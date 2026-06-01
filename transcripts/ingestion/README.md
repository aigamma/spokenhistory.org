# Transcript ingestion, adding new interviews to the corpus

This directory holds the scaffolding for ingesting new interview transcripts
into the audit-overlay system. It exists because the existing 127 audit-able
interviews went through seven mostly-improvised audit passes between 2026-05-21
and 2026-05-25; new transcripts arriving after that point do NOT need to
re-trace that journey. Instead, they can enter the corpus via the **Pass 8
LoC-healing architecture used as the primary correction pipeline**, much
faster, more principled, and reproducible.

## TL;DR, the new-interview workflow

Onboarding a new interview is one command, `transcripts/ingestion/onboard_interview.py`.
It is the master, idempotent pipeline; `ingest_new_transcript.py` (described
later) is the bootstrap-and-LoC-heal sub-step that it reuses.

```
1. Drop the raw Whisper transcript files (.srt + .txt + .vtt [+ .summary.txt])
   into transcripts/raw/<Subject>_interview_<YYYYMMDD>_<HHMMSS>/
2. Run: python transcripts/ingestion/onboard_interview.py "<entry_dir>"
   It runs as far as it can, then STOPS and tells you to author the chapter
   spec. Every stage is idempotent, so re-run it after each authored input.
3. Author scripts/spec_<N>.json (granular, parts-grouped chapters), re-run.
4. Author transcripts/rechapter_staging/entry_<N>.summary.txt, re-run. The
   pipeline now assembles entry_<N>.json, ingests vectors to Pinecone,
   scaffolds the person page, and rebuilds toc.json + playlist_index.json.
5. Author the real person page (bio, ai_reading, verbatim snippets, sources)
   per public/rag/people/README.md, replacing the stub.
6. Rebuild the remaining derived artifacts (see "After Onboarding" below),
   then commit raw/ + corrected/ + scripts/spec_<N>.json + the staging files
   + entry_<N>.json + the person page + the rebuilt indexes together.
```

The whole point: a new transcript is corrected in ONE deterministic pass
against the Library of Congress reference text, not the eight internal-guess
passes the original 127-entry corpus needed. The Pass 8 conservative-first-pass
discipline (single-word proper-noun phonetic-substitution heals; audit-canon
safeguard; LoC bracketed stage-direction skip; short-needle protection) carries
over, so new transcripts get the same quality bar without the labor. For the
engineering audit of this pipeline (what it does well and where it is still
incomplete), read `ONBOARDING_REVIEW.md` in this directory.

## Why this works

The 127-interview audit produced an audit overlay (`CLEANED_TRANSCRIPTS_REVIEW.md`)
that catalogues every Whisper failure pattern observed and the canonical-source
fix. The seven-pass journey was largely about discovering those patterns and
building the ground-truth corpus (`Metadata Generation System/civil_rights_facts.json`).

Once that ground-truth substrate exists, new transcripts can be corrected
in one pass by:

- LoC-XML or LoC-PDF word-level cross-validation against the authoritative
  source. This is the correction authority: `heal_one_entry.py` aligns our
  .srt against LoC's transcript and applies only rule-classified ASR heals.
- The master-MD audit canon, which prevents auto-reversing a spelling that a
  prior audit pass already promoted.
- Per-entry SME review of the flagged divergence catalog.

Note: the 378-entry `civil_rights_facts.json` corpus grounds the Metadata
Generation scorer, which is a separate subsystem. It does NOT participate in
the LoC heal. See `ONBOARDING_REVIEW.md` gap F.

Compare to the seven-pass journey:
- Pass 1: initial human-in-the-loop review → SKIPPED, the audit overlay
  already encodes Pass 1 findings
- Pass 2 / Pass 3 / Pass 4: deeper sweeps + consolidation → SKIPPED, same
- Layer 5 (Pass 5): corpus-global fidelity → BENEFIT carries over via the
  master MD's existing rows
- Pass 6: low-confidence residual QA → BENEFIT carries over
- Pass 7: PRR readiness review → can be run as a final-stage check if the
  new entries reach publication scrutiny
- Pass 8: LoC canonical-archive cross-reference → THIS is the new pipeline's
  primary phase

## What you need before ingesting

1. **Raw Whisper output** in the same format as the existing 127 entries:
   - `<entry_dir>/<Subject>_interview_transcript_<YYYYMMDD>_<HHMMSS>.srt`
   - same name with `.txt` extension
   - same name with `.vtt` extension
   - `<Subject>_interview_summary_<YYYYMMDD>_<HHMMSS>.txt` (optional)

   If the student's transcripts are in a different format (raw `.docx`, PDF,
   `.json` blob from WhisperX, etc.), use an adapter step before ingestion.
   See "Format adapters" below.

2. **Interviewee name** matching how LoC catalogs it. The directory name's
   prefix before `_interview_` is what the LoC resolver searches against.
   See `transcripts/loc_healing/resolve_loc_items.py::_score_candidate` for
   the matcher's behavior. If LoC catalogs the person under a different
   spelling than your directory uses (e.g., "Moses Newson" vs "Moses Newsom"),
   the resolver will report `no_candidates`, and you can use
   `transcripts/loc_healing/resolve_by_item_url.py` to direct-resolve once
   you find the LoC item URL manually.

3. **The standard validation commands** still apply:
   - `python scripts/apply_corrections.py --dry-run`, must remain idempotent
   - `cd "Metadata Generation System" && python scripts/validate_facts.py`
    , if you add new canonical figures

## The Heal Sub-Step (`ingest_new_transcript.py`)

`transcripts/ingestion/ingest_new_transcript.py` performs the bootstrap and
LoC-heal portion only, and `onboard_interview.py` reuses it. You would run it
directly only when you want the corrected transcript without the rest of the
onboarding (assembly, search ingest, person page, index rebuild). For a single
entry:

```
python transcripts/ingestion/ingest_new_transcript.py "Jane Doe_interview_20260601_120000"
```

It does:

1. **Validates raw/ entry structure**, confirms `.srt + .txt + .vtt`
   exist with correct naming.
2. **Bootstraps corrected/**, copies the four file types from `raw/` to
   `corrected/<entry_dir>/`, creates an initial `manifest.json` with the
   ingestion provenance.
3. **Resolves to LoC**, calls `resolve_loc_items.py` (XML-first), falls
   back to `resolve_pdf_fallback.py` (PDF text extraction). Reports
   `no_candidates` if LoC search misses; in that case Eric / SME must
   direct-resolve via `resolve_by_item_url.py` with a known LoC URL.
4. **Heals against LoC**, runs `heal_one_entry.py heal_one <entry>`. The
   same conservative-first-pass discipline applies (single-word proper-noun
   phonetic substitutions auto-heal; everything else preserved + flagged
   for SME review).
5. **Writes the per-entry stage file** at `transcripts/pass8_stage/entry_<NNN>_<slug>.md`.
   The entry number is derived from alphabetical position in the corrected/
   directory, OR, if the new interview gets folded into the master MD, the
   master MD entry number is used.
6. **Appends a Session-N follow-on entry to AUDIT_TRAIL.md** documenting
   the ingestion + heal counts + LoC source URL.

Result: the new interview is now part of the corpus with the same per-entry
artifact structure as the original 127. Search/retrieval works the same way.
Downstream pipelines (RAG, playlist generator, Smithsonian-grade summary
pipeline) consume the new entry identically.

## After Onboarding: Rebuild The Derived Artifacts

`onboard_interview.py` rebuilds `toc.json`, `playlist_index.json`, and the
Pinecone passage vectors, and it scaffolds a person stub. It does NOT yet
rebuild the other derived artifacts the rest of the site reads, so a freshly
onboarded interview is present on its own interview page and in raw search but
missing from the embedding map, the related-passages panel, the influence
graph, the geographic atlas, the events network, the ideological spectrums, the
tours and quote rotation, and the /people browse index. Until that is wired
into the pipeline (see `ONBOARDING_REVIEW.md` gap A), run these by hand from the
repo root after onboarding:

```
# Embedding neighbors + map (Voyage / Pinecone credentials required)
node --env-file=rag/.env.local rag/precompute.mjs

# Panels + clusters + influence + events (run the ones your entry affects)
node --env-file=rag/.env.local rag/summarize.mjs
node --env-file=rag/.env.local rag/precompute_panels.mjs
python rag/precompute_influence.py
python scripts/build_event_network.py
node --env-file=rag/.env.local rag/precompute_concept_axes.mjs   # ideological_spectrums.json

# Person browse index (after the real person page is authored)
node scripts/build_people_index.mjs
```

The most commonly forgotten one is `rag/precompute.mjs --feature related`:
without it, the new interview's person page shows an empty "related people"
section (the `/rag/related/entry-<N>.json` fetch 404s and is swallowed). That
is exactly what happened to entries 139 through 142.

## Format adapters

The corpus expects `.srt + .txt + .vtt + .summary.txt` in `raw/<entry_dir>/`.
If the student delivers transcripts in another format, here are the adapters:

### From WhisperX JSON output

WhisperX produces a single `.json` with per-word timestamps + per-segment text.
Convert to `.srt + .txt + .vtt` via `whisperx --output_format srt vtt txt`,
or use a small Python script that walks the segments and emits each format.
(Future TODO: include a reusable `whisperx_to_audit_format.py` adapter here.)

### From PDF transcripts only (no audio re-run)

If the student delivers PDFs without re-transcribing the audio, we can extract
text via the same `pypdf` path the LoC PDF fallback uses, then synthesize an
SRT with rough time-coding using sentence-segmentation. This loses the
fine-grained per-cue timing the playlist generator relies on. Avoid this path
unless the audio file isn't available.

### From plain-text transcripts

If only `.txt` is delivered, generate stub `.srt` + `.vtt` with single-segment
timestamps spanning the interview's known duration. The audit pipeline will
work but the playlist generator's clip precision will degrade.

## Validation gates before merge

For each ingested new entry, verify before merging:

- [ ] `transcripts/raw/<entry_dir>/` has 3+ files (`.srt`, `.txt`, `.vtt`,
      optionally `.summary.txt`)
- [ ] `transcripts/corrected/<entry_dir>/` has the same three transcript files
      plus a `manifest.json` with `loc_healing` section populated
- [ ] `transcripts/pass8_stage/entry_<NNN>_<slug>.md` exists
- [ ] `transcripts/loc_healing/divergences/<safe_subject>.divergences.json` exists
- [ ] Cue count matches between SRT and VTT (`python transcripts/loc_healing/heal_one_entry.py verify <entry_dir>`)
- [ ] `python scripts/apply_corrections.py --dry-run` parses without errors
- [ ] If new ground-truth corpus entries added: `cd "Metadata Generation System" && python scripts/validate_facts.py` passes
- [ ] AUDIT_TRAIL.md has a new Session entry (or appended follow-on sub-section) documenting the ingestion

## When LoC has no transcript

If the new interview is from a project OTHER than LoC's Civil Rights History
Project, e.g., a student's independent interview series, LoC will return
`no_candidates` and no healing is possible against the LoC authority.

In that case:
1. Use the ground-truth corpus (`civil_rights_facts.json`) for canonical-figure
   pattern matching as the only correction source.
2. Optionally run the dual-scoring + citation-audit pipeline in `Metadata Generation System/`
   for hallucination-risk scoring.
3. Mark the entry's manifest with `loc_healing: {status: "no_loc_item", reason: "..."}`
   so downstream pipelines know its provenance.

## Open questions for the next ingest

When Dustin's student's transcripts arrive, the first batch will surface
questions like:

- **Which Whisper model produced them?** Different Whisper variants have
  different failure modes. The 127-entry corpus was Whisper-large-v3
  (per the original ingestion notes in `transcripts/AUDIT_TRAIL.md`).
- **Are these interviews actually in LoC's CRHP collection?** Or a different
  archive? If a different archive, the LoC-healing path doesn't apply and we
  need a different reference authority.
- **Are the canonical names in the new transcripts already in our
  ground-truth corpus?** If the new interviews introduce new historical
  figures (e.g., regional movement leaders not in the existing 140+ corpus),
  those need to be added to `civil_rights_facts.json` for the alias-matching
  layer to work.

The first ingested entry from the new batch should be a small test case
(short interview) to surface these questions before scaling to the full
batch.
