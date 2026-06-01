# Essays: Curated Public-Domain and Open-License Texts

This directory is the curated-essays layer: real, published, academically-attributable essays that illuminate the themes the oral-history archive explores, reproduced in full with their citation and license, and cross-linked into the corpus. There is NO AI-generated essay prose here; every essay is a third-party work. Only the site's own framing copy (page headings, abstracts, topic descriptions) is ours.

## Why curated, not generated

For a formal archive whose credibility rests on academic-grade sourcing, AI-written editorializing would invite suspicion onto the rest of the well-sourced site. So the essays are real texts, curated and attributed, never generated.

## The licensing gate (the controlling rule)

The license must permit DERIVATIVE use and redistribution, because this site chunks, embeds, indexes, and surfaces semantic excerpts of each text. Embedding is inherently a derivative use, so a No-Derivatives license is fundamentally incompatible with how we use a text.

- **Qualifies:** public domain, US-government works, CC0, CC BY, and (this is a non-commercial academic project) CC BY-NC, plus the ShareAlike variants.
- **Excluded:** any No-Derivatives license (CC BY-ND, CC BY-NC-ND, which is why the SNCC Digital Gateway tier is out), paywalled work, and anything with unclear terms.
- Verify the SPECIFIC item, not the repository.

The gate is encoded in `manifest.json` (`license_gate`) and enforced by `scripts/harvest_essays.py`, which refuses any non-qualifying row.

## Verbatim reproduction

The essay body is a verbatim reproduction of the third-party work, so its original punctuation (including em dashes and curly quotes) is preserved as the author wrote it. The project's em-dash prohibition and Title Case rules apply ONLY to our own chrome (headings, abstracts, topic descriptions), never to the reproduced text. `scripts/strip_em_dashes.mjs` skips this directory for that reason.

## Files

- `manifest.json`: the curation source of truth and the candidate front-door. One row per source (slug, title, authors, year, venue, license, source, themes, status, verification). `status` is the lifecycle field: candidate (proposed, license not yet confirmed) to verified (license vetted, ready to harvest) to hosted (body extracted and live); `excluded` is a permanently disqualified row. A candidate is just a row with `status: "candidate"`, so the suggestion front-door and the curation record are the same file and never drift. Nothing in code hardcodes this list.
- `topics.json`: the extensible topic taxonomy. Each topic maps to corpus cross-link primitives (a Topics keyword, tour slugs, cluster ids) so `EssayPage` derives related interviews at render time.
- `<slug>.json`: per-essay metadata plus the body pointer.
- `text/<slug>.txt`: the verbatim full text.
- `index.json`: built from the per-essay files by `scripts/build_essays_index.mjs`; the `/essays` UI reads this.

## Pipeline (manifest-driven, idempotent, scalable)

1. `python scripts/harvest_essays.py` , fetch and extract verified rows into `text/` plus `<slug>.json`.
2. `node scripts/build_essays_index.mjs` , build `index.json`.
3. `node --env-file=rag/.env.local rag/ingest.mjs --essays-only` , chunk and embed into Pinecone (`content_type='essay'`).
4. `node scripts/build_essays_sources_report.mjs` , write `output/essays-sources-report.md` (provenance).

Re-running is safe; each stage skips work already done. This is the same path the broader oral-history platform reuses.

## Search

Essay chunks are ingested with `content_type='essay'` and excluded from passage and people search flows by default. The exclusion lives in `src/services/ragClient.js` (`includeEssays`) and `mcp-server/server.mjs` (`include_essays`). Pass the include flag for a cross-content search.

## The standardized suggestion and onboarding process

Essays have the same kind of standardized, idempotent front-door-to-live pipeline that interviews have. For interviews it is `transcripts/ingestion/onboard_interview.py`; for essays it is `scripts/onboard_essay.py`, with `scripts/intake_essay_candidate.py` as the candidate front-door. The two pipelines are deliberately parallel so the content-suggestion concept is unified across the site: propose a candidate, vet it (for an interview that is the LoC heal; for an essay it is the license gate), then a single command carries it the rest of the way and networks it into the corpus.

### Where candidates live

A candidate essay is a row in `manifest.json` with `status: "candidate"`. There is no separate candidates file, for the same reason an interview has one manifest in its `corrected/` directory that carries it from bootstrap through onboarding rather than a separate "candidate interview" file. One manifest keeps a single source of truth, keeps the harvester's "process verified rows only" invariant intact (it already skips `candidate` rows and refuses non-qualifying licenses), and means the suggestion front-door and the curation record can never drift apart.

### The candidate front-door (`scripts/intake_essay_candidate.py`)

The intake script records a candidate and runs the LICENSE-DERIVATIVE GATE deterministically, promoting the row to `verified` or refusing it with the specific reason. It validates metadata and license ONLY; it never fetches the essay text (that is harvest's job), so a candidate can be license-vetted and queued long before the bytes of the reproduction are committed.

```
# Add a brand-new candidate from a JSON file (license still unconfirmed), record only:
python scripts/intake_essay_candidate.py --from-json my_candidate.json --record-only

# Vet a candidate and, if it passes the gate, mark it verified (ready to harvest):
python scripts/intake_essay_candidate.py --slug my-essay-slug \
    --verified-by "Your Name (per-item license check)"

# Report the verdict without writing the manifest:
python scripts/intake_essay_candidate.py --slug my-essay-slug --dry-run
```

The candidate schema (see `scripts/essay_candidate.example.json` for a complete worked example): `slug` (lowercase-hyphenated, unique; it is the filename stem), `title`, `authors[]` (`[]` only for a corporate/anonymous work), `year`, `venue`, optional `collection`, `license` `{type, url?, note?}`, `source` `{kind, ...}`, `themes[]` (topic ids that exist in `topics.json`, cross-linking is keyed on these), `rationale` (the why-it-fits), and `proposer`. Exit codes: `0` valid/promoted, `1` invalid metadata, `2` license refused.

### The license gate is the controlling check

Embedding a text into the search index is a derivative use, so the license MUST permit derivative use. The gate is the same one `harvest_essays.py` enforces (`manifest.license_gate`), so a row the intake marks `verified` will never be refused later for its license.

- **Qualifies** (promoted): `public-domain`, `us-government-public-domain`, `cc0`, `cc-by`, `cc-by-sa`, `cc-by-nc`, `cc-by-nc-sa`. NonCommercial is acceptable for this non-commercial academic project.
- **Refused** (exit 2): any No-Derivatives license (`cc-by-nd`, `cc-by-nc-nd`, which is why the SNCC Digital Gateway tier is out), `all-rights-reserved`, `paywalled`, `unknown`.
- Verify the SPECIFIC item's license, not the repository's.

### One-command onboarding (`scripts/onboard_essay.py`)

Once a candidate exists, one idempotent command takes it the rest of the way. Every stage checks for its own output and skips work already done, so it is safe to re-run.

```
python scripts/onboard_essay.py --slug my-essay-slug
python scripts/onboard_essay.py --from-json my_candidate.json   # add the candidate, then onboard it
python scripts/onboard_essay.py --slug my-essay-slug --skip-ingest   # everything but the paid Pinecone write
```

Stages, in order: (1) validate the candidate, (2) LICENSE GATE (hard stop), (3) promote candidate to verified, (4) harvest the verbatim body (reuses `scripts/harvest_essays.py`, the only network step), (5) rebuild `index.json` (`scripts/build_essays_index.mjs`), (6) ingest to Pinecone (`rag/ingest.mjs --essays-only`, gated on `rag/.env.local` exactly like the interview pipeline's ingest; default on, opt out with `--skip-ingest`), (7) rebuild the sources report (`scripts/build_essays_sources_report.mjs`), (8) status summary. Stages 1 to 3 reuse `intake_essay_candidate.py` so the gate has one implementation; stages 4 to 7 shell out to the existing essay scripts (none of their logic is duplicated). After the run, commit `manifest.json`, `<slug>.json`, `text/<slug>.txt`, `index.json`, and `output/essays-sources-report.md` together.

### Authored-by-human vs automated

The ONE human decision is the per-item license verification, recorded on the candidate row (`license.type`, `license_verified_date`, `verified_by`) and enforced by the gate at stage 2. Everything else is mechanical: the essay body is a verbatim reproduction (no editorial writing, unlike the interview pipeline's authored chapter spec, summary, and person page), and the index, embedding, and report are derived. For a non-Gutenberg source (`source.kind` `pdf-url` or `url`), harvest cannot auto-fetch the body; host the text via the format adapter below, then re-run the pipeline from `--stop-after index`.

## Provenance

`output/essays-sources-report.md` lists every hosted essay with citation, license, and source, plus the documented candidates. It is the institutional provenance record and the reporting export.
