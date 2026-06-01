# Onboarding Pipeline: A Hard Look

**Subject:** `transcripts/ingestion/onboard_interview.py` (and the heal engine it drives, `transcripts/loc_healing/heal_one_entry.py`).
**Date:** 2026-06-01.
**Why this doc exists:** the onboarding script is the central achievement of this project. It is the distillation of ten audit passes (the first eight of which were expensive, internal, stochastic guesswork with no external authority) into a single, deterministic, Library-of-Congress-anchored pipeline. This is the engineering review of what it does well, where it falls short of "fully integrated into the rest of the site," and what the next integration project needs to fix. It is a companion to the workflow doc in `README.md`: the README teaches how to run it; this doc audits whether it does what it claims.

---

## 1. What It Is

`onboard_interview.py` is a master, idempotent, fifteen-stage pipeline that takes a new Civil Rights History Project interview from a raw Whisper transcript all the way onto the live site. Its fifteen stages:

`locate` -> `bootstrap` (raw to corrected) -> `resolve` (LoC item) -> `heal` (LoC-anchored correction) -> `number` (assign entry_number) -> `video` (resolve the LoC video) -> `blocks` (extract cue blocks) -> `chapters` (expand the authored spec) -> `summary` (attach the authored summary) -> `assemble` (write `entry_<N>.json`) -> `ingest` (Voyage to Pinecone) -> `person` (scaffold the person page) -> `indexes` (rebuild `toc.json` + `playlist_index.json`) -> `audit` (append an AUDIT_TRAIL note) -> `status`.

Every stage checks for its own output and skips work already done, so the script is safe to run, stop, author the two human inputs, and re-run. It reuses `ingest_new_transcript.py` (the bootstrap-plus-LoC-heal sub-step) rather than duplicating it.

The historical context matters. The original 127-entry corpus was corrected over ten passes. Passes 1 through 8 did not consult the LoC API; they were internal model guesses about what each Whisper line was probably trying to say, and they also corrected the interviewee names in the subject headers by hand. That effort cost more than one thousand dollars in tokens because the transcript heap was large. Pass 8 introduced the LoC cross-reference, and the streamlined pipeline makes Pass 8's deterministic LoC heal the only correction pass a new transcript needs. The point of the pipeline is to never again pay for stochastic guesswork when an authoritative reference transcript exists.

---

## 2. What It Does Well

1. **The cleaning is deterministic and authoritative, with no model in the loop.** `heal_one_entry.py` aligns our Whisper `.srt` against LoC's TEI2 XML (or, where LoC published no XML, against pypdf-extracted PDF text) at the word level using `difflib.SequenceMatcher`. Each divergence is classified by hard linguistic rules in `deterministic_verdict()`: contraction expansions, number-to-word forms, function-word inserts and deletes, LoC bracketed stage directions, hyphenated false starts, and single-word proper-noun phonetic substitutions. Only `ASR_ERROR_HEAL` verdicts are applied. Everything else is preserved verbatim or flagged `NEEDS_SME_REVIEW`. In the onboarding path no language model is ever called to decide a correction. This is exactly the replacement for the eight internal-guess passes that the project set out to build, and it is sound.

2. **It is idempotent and resumable.** Each stage is guarded by an output check. Re-running after authoring the chapter spec and the summary carries the entry the rest of the way with no repeated work and no second-guessing of decisions already made.

3. **The conservative-first-pass discipline protects prior audit decisions.** The audit-canon safeguard refuses to heal toward LoC when our token was already promoted by a prior audit pass for that entry; the case is flagged `UNCLEAR` for human review instead of silently reversed. The single-word, mid-similarity band (0.55 to 0.95) for proper-noun heals avoids both case-only noise and unrelated substitutions.

4. **It honors the Smithsonian bar by stopping for human authorship.** Two inputs are deliberately not auto-generated: the chapter segmentation (`scripts/spec_<N>.json`) and the interview summary (`transcripts/rechapter_staging/entry_<N>.summary.txt`). The person page is scaffolded only as a stub. The pipeline prints exactly what to write and where, then stops. Segmentation and citation-bearing pages must be reviewable, not blindly produced.

5. **It respects the LoC API.** All LoC access is linear with a 1.5-second delay; the video resolution is a single `?fo=json` request. No parallel scraping.

---

## 3. Gaps And Defects

This is the part that matters for the next project. The findings below are ordered by impact.

### A. Site Integration Is Incomplete; "Networked" Is Overstated, **RESOLVED 2026-06-01**

**Resolved 2026-06-01.** A `network` stage (stage 14, between `indexes` and `audit`) now rebuilds the full derived cross-link set in one command, so a newly onboarded interview is genuinely networked into every site surface rather than landing half-integrated. The stage runs two groups in strict dependency order:

- **Deterministic (no network, always run):** `_entry_list.json` (see below), `influence.json` (`rag/precompute_influence.py`), `event_network.json` (`scripts/build_event_network.py`), `people/index.json` (`scripts/build_people_index.mjs`).
- **Credentialed (Pinecone / Voyage / Anthropic; gated on `rag/.env.local` exactly like `ingest`):** `related/entry-<N>.json` (per-entry, targeting the new N), `centroids.json` then `constellation.json` (order enforced: constellation reads centroids), `ideological_spectrums.json` via `precompute_concept_axes.mjs` then `add_concept_axes.mjs` (order enforced: the add step re-appends the extra axes the recompute drops), the geography + canonical-event + famous-external panels (`precompute_panels.mjs`), the per-entry capsule (`summarize.mjs capsules --entries=<N>`), and cluster names (`summarize.mjs clusters`).

Three implementation notes:

- **`_entry_list.json` now has a committed, deterministic builder, `scripts/build_entry_list.py`.** It had none before: it was produced once by an ad hoc step during the 2026-05-26 build and went stale at entry 138 while the corpus reached 142. Because both `precompute_influence.py` and `summarize.mjs` (capsules) read it, the `network` stage rebuilds it FIRST so the new entry appears in the speaker roster and the capsule target list.
- **`clusters.json` regeneration re-NAMES the existing k-means clusters** (from `clusters_raw.json`); it does NOT re-run k-means against the new vectors. Folding a new entry into the cluster STRUCTURE still needs the separate, not-yet-scripted k-means step that writes `clusters_raw.json`. This limit is documented inline at the call site.
- **`tours.json` and `quotes.json` are deliberately NOT wired.** Their regeneration is editorial (`summarize.mjs` prints a "use a Claude Code session with subagents" message for them). The status block always prints a reminder that a new interview considered for a Tour or the Quote rotation needs a manual editorial subagent pass.

An operator can opt out of the corpus-global rebuilds with `--skip-networking` (they cost Pinecone/Voyage/Anthropic calls and time); the default runs them, which is the whole point of a one-command full onboarding. When networking is skipped, or when `rag/.env.local` is absent so only the deterministic artifacts ran, the status block prints the exact commands to finish the rebuild later. A single failing builder warns rather than aborting, so it does not strand the rest of the networking. The original analysis that motivated this fix is preserved verbatim below.

---

The docstring says the pipeline leaves the interview "onboarded, healed, chaptered, assembled, search-ingested, and networked." The first five are true. "Networked" is not, or only partly. The pipeline rebuilds exactly four things: `toc.json`, `playlist_index.json`, the Pinecone passage vectors (via `rag/ingest.mjs`), and a thin person-page stub.

It does **not** rebuild the derived cross-link artifacts that the rest of the site reads. Each of these is generated by a separate script that the onboarding pipeline never calls:

| Derived artifact | Generator | Site surface it feeds |
|---|---|---|
| `related/entry-<N>.json` | `rag/precompute.mjs --feature related` | PersonPage "related people"; RelatedPassages |
| `centroids.json`, `constellation.json` | `rag/precompute.mjs` | Embedding-space map |
| `clusters.json`, `tours.json`, `quotes.json`, `capsules.json` | `rag/summarize.mjs` | Tours, Quote of the Day, capsules, clusters |
| `influence.json` | `rag/precompute_influence.py` | Influence graph |
| `geography.json` | `rag/precompute_panels.mjs` | Geographic atlas |
| `event_network.json` | `scripts/build_event_network.py` | Events network |
| `ideological_spectrums.json` | `rag/precompute_concept_axes.mjs` | Ideological Spectrums |
| `people/index.json` | `scripts/build_people_index.mjs` | The `/people` browse index |

**This is not hypothetical. It already happened.** The four newest interviews (entries 139 through 142) were onboarded through this pipeline, yet `public/rag/related/` contains files only for entries 1 through 138. `PersonPage.jsx` fetches `/rag/related/entry-${N}.json` and swallows the 404 through `fetchJsonOrNull`, so the four newest person pages render with their "related people" section silently empty. Meanwhile `people/index.json` does contain all four (it was rebuilt by hand), and `constellation.json` has all 140 points. So the derived layer is in a partially-rebuilt, internally-inconsistent state: a person ran some rebuilds by hand and forgot others. That is the exact failure mode of a pipeline that rebuilds some-but-not-all derived artifacts. The pipeline that claims to be the single entry point creates the false confidence that nothing else needs running.

**Recommendation (implemented 2026-06-01, see the resolution note above).** Add a final `network` stage that runs the full derived-artifact rebuild, gated the same way the `ingest` stage is gated on `rag/.env.local`: run what can run, and for the steps that need Voyage or Pinecone credentials, either run them or print the exact commands and mark them pending in the status block. At minimum, the pipeline must not finish with a clean "onboarded" status while leaving the new entry absent from half the site.

### B. The Healing Date Is Hardcoded

`heal_one_entry.py::update_manifest` writes `applied_date: "2026-05-25"` and `write_stage_file` writes `**Date:** 2026-05-25`, both unconditionally. Every newly onboarded interview is stamped with a false healing date of 2026-05-25, regardless of when it was actually onboarded. For a project whose entire credibility rests on a reconstructable audit trail, a falsified date in the per-entry manifest and stage file is a real defect.

**Recommendation.** Use `date.today().isoformat()` in both places.

### C. New Entries Get An `entry_000` Stage Filename

`heal_one_entry.py::guess_entry_number` resolves the entry number only by matching the subject against headings in `CLEANED_TRANSCRIPTS_REVIEW.md`. A brand-new interview is not in the master MD, so it returns 0, and the Pass 8 stage file is written as `entry_000_<slug>.md`. The onboarding pipeline assigns the real entry number separately (into the manifest and `scripts/rechapter_map.json`), but the heal sub-step does not read it.

**Recommendation.** Thread the assigned entry number from `onboard_interview.py` into `heal_one_entry.py` (an argument or an environment variable) so the stage file is named correctly on the first run.

### D. The Subject Name Is Never Canonicalized Against LoC

This is the specific gap the project owner flagged: the early passes "corrected the names in the subject headers themselves," and that hand-correction is not yet streamlined.

The interviewee's name is parsed from the directory name by `_parse_subject_from_dir` and propagates unchanged into three durable, public places: `interview_name` in `entry_<N>.json`, the person-page slug, and the person-page `display_name`. The LoC resolution finds the canonical catalog item, but the pipeline never reconciles our subject spelling with LoC's catalogued name. If the directory mis-spells the interviewee (a Whisper artifact, or a cataloging discrepancy like LoC's "Newson" versus our "Newsom"), that error rides straight through to the published entry and the person page. The `resolve_by_item_url.py` override fixes resolution, not the displayed name.

**Recommendation.** After `resolve`, read LoC's catalogued interviewee name from the resolution record or the XML header. If it differs from our directory-derived subject by more than punctuation or case, surface the difference for confirmation rather than guessing, and record the canonical spelling in the manifest so the assemble and person stages can prefer it. This closes the last hand-correction the old passes performed, and it does so with the same LoC-authoritative discipline as the transcript heal: the catalog is the authority, not a model.

### E. Only Single-Word Proper-Noun Errors Auto-Heal

`looks_like_asr_proper_noun_error` fires only for a single token versus a single token. A multi-word ASR error (a mis-heard two-word surname, or a full name rendered as two wrong tokens) falls to `NEEDS_SME_REVIEW`. This is correct conservatism for the Smithsonian bar, but it means name correction is reduced, not eliminated, as human work. That tradeoff should be stated plainly so no one assumes the pipeline catches every name error. The next project can decide how far to push multi-token phonetic healing against the higher false-positive risk, ideally still anchored to LoC rather than to a model.

### F. The Ground-Truth Corpus Does Not Participate In The Heal

The README has claimed that new transcripts are corrected by "phonetic plus alias matching against the canonical-figures corpus." In the actual heal path, `civil_rights_facts.json` (378 entries, 396 aliases) is not consulted at all. The correction authority is LoC alignment plus the master-MD audit canon. The facts corpus grounds the Metadata Generation scorer, which is a different subsystem. The documentation must be precise about this, because conflating the two obscures where the correction authority actually lives. (Fixed in the README heal that accompanies this review.)

### G. Smaller Robustness Notes

- `stage_video` carries `loc_video: {}` when LoC exposes no video for the item. The interview page may then lack playback. The status block should call this out explicitly rather than printing a generic success.
- `assemble` sets `inferential_uncertainty_tier` to `ingestion-only` (or `not-auditable` for a partial excerpt) with a `null` score. That is correct for a freshly onboarded, not-yet-deeply-audited entry, but it means new entries show the "Audio-Limited" badge in the site's two-state audit display until a deeper pass promotes them. Document this so it is not mistaken for a bug.
- Nothing checks the authored summary or chapter spec for em dashes, which are forbidden project-wide. Wire the (now repaired) `scripts/strip_em_dashes.mjs`, or a lighter inline check, into the `assemble` stage so an authored em dash cannot reach a published `entry_<N>.json`.

---

## 4. The Full Onboarding Flow (For The Next Project)

This is the end-to-end picture the integration project needs, including the manual steps the pipeline does not yet automate.

```
raw/<Subject>_interview_<YYYYMMDD>_<HHMMSS>/   (.srt + .txt + .vtt [+ .summary.txt])
        |
        v   python transcripts/ingestion/onboard_interview.py "<dir>"
  [ 1] locate / [ 2] bootstrap -> corrected/<dir>/ + manifest.json
  [ 3] resolve  -> LoC item URL (XML first, PDF fallback, --loc-item-url override)
  [ 4] heal     -> deterministic LoC-anchored correction (heal_one_entry.py)
  [ 5] number   -> entry_number into manifest + scripts/rechapter_map.json
  [ 6] video    -> LoC ?fo=json -> loc_video_links.json
  [ 7] blocks   -> scripts/blocks_<N>.txt
        |
        |   ** STOP: author scripts/spec_<N>.json (granular, parts-grouped chapters) **
        v
  [ 8] chapters -> transcripts/rechapter_staging/entry_<N>.chapters.json
        |
        |   ** STOP: author transcripts/rechapter_staging/entry_<N>.summary.txt **
        v
  [ 9] summary
  [10] assemble -> public/rag/summaries/pipeline_output/entry_<N>.json (+ output_subagent twin)
  [11] ingest   -> Voyage embeddings -> Pinecone civil-rights index
  [12] person   -> public/rag/people/<slug>.json  (thin stub; needs real authoring)
  [13] indexes  -> rebuild toc.json + playlist_index.json
  [14] network  -> rebuild every derived cross-link artifact (AUTOMATED 2026-06-01; --skip-networking to opt out)
        |          deterministic (always): _entry_list.json, influence.json, event_network.json, people/index.json
        |          credentialed (gated on rag/.env.local, like ingest):
        |            rag/precompute.mjs --entries <N> --feature related   (related/entry-<N>.json)
        |            rag/precompute.mjs --feature centroids                (centroids.json)
        |            rag/precompute.mjs --feature constellation            (constellation.json; after centroids)
        |            rag/precompute_concept_axes.mjs then add_concept_axes.mjs  (ideological_spectrums.json; order matters)
        |            rag/precompute_panels.mjs                             (geography + events + famous_external)
        |            rag/summarize.mjs capsules --entries=<N>              (capsules.json, per-entry)
        |            rag/summarize.mjs clusters                            (clusters.json re-name only; k-means not re-run)
  [15] audit    -> AUDIT_TRAIL.md note
  [16] status   -> reports networking state + prints any pending rebuild commands
        |
        |   ** STILL MANUAL (editorial, not scriptable): tours.json + quotes.json **
        |   ** if entry <N> should join a guided Tour or the Quote rotation, run a **
        |   ** Claude Code subagent pass (summarize.mjs prints the same instruction). **
        v
        |   ** Author the real person page (bio, ai_reading, verbatim snippets, sources) **
        |   ** per public/rag/people/README.md, then re-run build_people_index + persons ingest **
        v
  deploy (Netlify) -> live
```

---

## 5. Bottom Line

The cleaning engine is the real achievement and it is sound: deterministic, LoC-authoritative, conservative, and free of the stochastic guesswork that the first eight passes paid so much for. That goal is met.

As of 2026-06-01 the pipeline's claim to carry an interview "all the way onto the live site" is substantially true. The new `network` stage (gap A, resolved above) lands the interview in the embedding map, the related-passages panel, the influence graph, the geographic atlas, the events network, the ideological spectrums, the capsule rotation, and the `/people` browse index, in the same command. What remains manual is editorial by design: the guided tours, the quote rotation, and the real (non-stub) person page. The half-integration that entries 139 through 142 exhibited is the failure mode the `network` stage exists to prevent on every future onboarding (those four entries still need a one-time credentialed `network`-equivalent rebuild to backfill, see `transcripts/OPEN_PROBLEMS.md`).

The remaining integration work, in priority order:

1. ~~Add the derived-artifact rebuild as a final pipeline stage (gap A).~~ **Done 2026-06-01.** Onboarding now finishes the networking it claims; tours + quotes stay a deliberate manual editorial pass.
2. Add LoC subject-name canonicalization (gap D), closing the last hand-correction from the old passes.
3. Fix the hardcoded healing date and the `entry_000` stage filename (gaps B and C), so the audit trail does not lie.
4. Decide the policy on multi-word name healing versus SME review (gap E), and wire an em-dash guard into assembly (gap G).

Done in that order, the script becomes what its docstring already promises.
