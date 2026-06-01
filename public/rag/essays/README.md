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

- `manifest.json`: the curation source of truth. One row per source (slug, title, authors, year, venue, license, source, themes, status, verification). `status`: candidate | verified | hosted | excluded. Add content by adding verified rows; nothing in code hardcodes this list.
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

## Adding an essay (the scalable path)

1. Find a real essay that overlaps the archive's themes and qualifies under the gate.
2. Verify its license on the SPECIFIC item.
3. Add a verified row to `manifest.json` (slug, title, authors, year, venue, license, source, themes, `status: "verified"`, license_verified_date, verified_by). For a Project Gutenberg book, use `source.kind` `"gutenberg-chapter"` (one essay, located by `chapter_title`, optionally `chapter_roman`) or `"gutenberg-whole"` (a whole work).
4. Run the pipeline. The new essay appears on `/essays`, interlinks through its topics, and becomes searchable.

## Provenance

`output/essays-sources-report.md` lists every hosted essay with citation, license, and source, plus the documented candidates. It is the institutional provenance record and the reporting export.
