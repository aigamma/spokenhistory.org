# rag/, Civil Rights History Project RAG layer

Retrieval scaffolding for the Smithsonian-grade publication pipeline. The
substrate is Pinecone (Builder tier, separate project from worldthought
under the same organization) + Voyage AI (voyage-3 embeddings + rerank-2).

## Why Pinecone Builder + Voyage AI

See `docs/RAG_SUBSTRATE_DECISION.md` for the full decision record. Short
version:

- Pinecone Builder ($20/mo flat, multi-project) hosts both worldthought
  and civil rights under one billing relationship
- Managed substrate is the right team-handoff profile for the WWU
  academic stakeholders (zero ops burden on them)
- Voyage-3 (1024-dim) + voyage-rerank-2 is the standard Smithsonian-grade
  retrieval stack, significantly better than gte-small on semantically
  dense corpora like oral history transcripts
- Cost ceiling: ~$22–25/mo all-in (Pinecone $20 + Voyage ~$2–5)

## Architecture

```
[ user query ]
      |
      v
[ rag/retrieve.mjs: embedQuery → pineconeQuery → voyageRerank ]
      |
      v
[ top-N passages with metadata ]
      |
      v
[ chat / LLM context builder (downstream, not in this module) ]
```

Ingest:

```
[ transcripts/raw/ ]
      |
      v (scripts/apply_corrections.py)
      |
[ transcripts/corrected/ ]
      |
      v (rag/ingest.mjs)
      |
[ rag/chunker.mjs ] -- time-aware for .srt/.vtt, paragraph-aware for .txt
      |
      v
[ rag/embed.mjs ] -- Voyage voyage-3 input_type=document
      |
      v
[ Pinecone civil-rights index ]
```

## Files

| File | Purpose |
|---|---|
| `shared.mjs` | Env-var resolution, Pinecone/Voyage HTTP helpers, walker, paths |
| `chunker.mjs` | Time-aware (.srt/.vtt) and paragraph-aware (.txt) chunking |
| `embed.mjs` | Voyage embedding batch helper with retry+backoff |
| `ingest.mjs` | Walker + ingest CLI (CLI flags: `--entries`, `--include-ground-truth`, `--prune`, `--dry-run`) |
| `retrieve.mjs` | Two-stage retrieve: Pinecone hybrid query → Voyage rerank-2 |
| `precompute.mjs` | After ingest, emits static JSON for the interactive-features layer (related passages per entry + per-chunk, per-entry centroids, 2D PCA constellation). Runs against any Pinecone index with the same metadata shape, civil-rights and worldthought.com share the script. CLI flags: `--feature {related,centroids,constellation}`, `--entries`, `--centroid-sample`, `--dry-run`. |
| `.env.example` | Env-var template (copy to `.env.local`, never commit) |

## Index design

One Pinecone index `civil-rights`, single namespace `''` (default).
Filtering and isolation are handled via metadata, not namespaces. This
keeps cross-interview semantic search natural while letting filters
restrict to a single interview when needed.

### Vector ID format

`<chunk_type>::<entry-N|global>::<source-safe>::<chunk-index>::<hash>`

Examples:
- `transcript_segment::entry-73::Kathleen_Cleaver__interview_2025...::42::a1b2c3d4`
- `ground_truth_fact::global::civil_rights_facts_Stokely_Carmichael::0::4f5a6b7c`

Deterministic IDs enable idempotent re-ingest. Unchanged chunks are
detected by content-hash collision and skipped without an embedding call.

### Metadata schema

Every vector carries these fields (some optional):

| Field | Type | Always present? |
|---|---|---|
| `chunk_type` | enum: `transcript_segment` \| `summary_chapter` \| `ground_truth_fact` | yes |
| `entry_number` | int | yes for transcript_segment + summary_chapter |
| `entry_subject` | string | yes for transcript_segment + summary_chapter |
| `entry_provenance` | enum: `audit-original` \| `ingestion-only` | yes for transcript_segment (added 2026-05-25) |
| `inferential_uncertainty_score` | float (0.0 = no evidence of error, higher = more residual uncertainty) | when manifest carries it (all 140 entries) |
| `inferential_uncertainty_tier` | enum: `low` \| `medium` \| `publication-block` \| `not-auditable` \| `ingestion-only` | same as score |
| `loc_item_url` | string (Library of Congress canonical archive URL) | when LoC healing was applied (all 140 entries) |
| `source_path` | string (repo-relative) | yes |
| `source_ext` | string (`.txt`, `.srt`, `.vtt`, `.json`) | yes for transcript_segment |
| `chunk_index` | int | yes |
| `content_hash` | string (16-hex sha256 prefix) | yes |
| `text` | string (the chunk content itself) | yes |
| `timestamp_start_seconds` | float | only for time-aware chunks |
| `timestamp_end_seconds` | float | only for time-aware chunks |
| `cue_count` | int | only for time-aware chunks |
| `canonical_name` | string | only for ground_truth_fact |
| `aliases` | string[] | only for ground_truth_fact |
| `content_type` | enum: `person` | only for person-page vectors (one per person page); absent on transcript/fact vectors |

The index also holds one vector per person page (the per-person reference pages under `public/rag/people/`), embedded with `content_type: 'person'`. Archive-focused retrieval flows filter these out by default; a site-wide "find a person" affordance passes `includePersons: true` to include them. See `public/rag/people/README.md` for the person-vector ingest path (`rag/ingest.mjs --persons-only`).

### Why the provenance / uncertainty / LoC fields are in the metadata

`entry_provenance` lets retrieval differentiate the 127 entries that went through the full Pass 1–8 audit cascade (`audit-original`) from the entries that came in via the streamlined ingestion (`ingestion-only`). For Smithsonian-grade publication, an LLM answer that draws from an audit-original chunk can cite the audit overlay; an answer drawn from an ingestion-only chunk should be hedged. Putting the flag in the chunk metadata keeps it available at answer time without a second lookup.

`inferential_uncertainty_score` + `inferential_uncertainty_tier` carry the per-entry residual-error estimate defined in `transcripts/AUDIT_TRAIL.md::Inferential scoring framework`. The five tier values that appear in the corpus are `low`, `medium`, `publication-block`, `not-auditable`, and `ingestion-only` (per-tier counts shift as new interviews are ingested; verify against the current manifests). Retrieval can use the tier as a coarse filter (e.g., `tier: {$eq: "low"}` to bias toward publication-grade entries) or weight rerank by score. Note: the user-facing `/rag-explore` UI collapses these five into two settled states, "LoC-Verified" (137) and "Audio-Limited" (3), for a 140-interview total.

`loc_item_url` carries the Library of Congress canonical archive URL for the entry. When an LLM answer cites a chunk, the UI can deep-link to the LoC item so a downstream reader can verify the source.

### Hybrid retrieval

The Pinecone index should be created with both dense and sparse vectors
enabled (Pinecone now supports this on all tiers, including Builder). The
retrieve.mjs module is written to use dense-only by default; once the
index is provisioned with sparse support, switch the retrieval call to
the `/query` endpoint with `sparse_vector` to get BM25 + cosine fusion.

For day-one deployment, dense-only is fine. The hybrid path is documented
here for the post-MVP retrieval tightening.

## Setup steps (one-time)

These actions happen in Pinecone's web console (Eric / authorized
admin). The code in this directory is the application layer; the index
itself is provisioned out-of-band.

1. **Create new Pinecone project** under your organization, named
   `civil-rights-prod` (or similar). Builder tier supports multiple
   projects.
2. **Create an index** in that project:
   - Name: `civil-rights`
   - Dimension: `1024` (voyage-3)
   - Metric: `cosine`
   - Type: Serverless (Builder default)
   - Cloud + region: closest to your Netlify edge (e.g., `aws-us-east-1`)
   - Hybrid: enable sparse + dense, if available on Builder (else dense-only)
3. **Copy index credentials** (API key + index host URL) into
   `.env.local` per `.env.example`.
4. **Get a Voyage AI API key** at https://dash.voyageai.com/. Add to
   `.env.local`.

## Setup steps (per ingest run)

```bash
# 1. Produce corrected transcripts from raw via the audit overlay
python scripts/apply_corrections.py

# 2. Embed + upsert into Pinecone (idempotent on content hash)
node --env-file=rag/.env.local rag/ingest.mjs

# 3. Optionally include the ground-truth corpus
node --env-file=rag/.env.local rag/ingest.mjs --include-ground-truth

# 4. After a re-pass on the audit overlay, re-run the ingest. Only the
#    changed chunks will be re-embedded.
node --env-file=rag/.env.local rag/ingest.mjs

# 5. To remove orphaned vectors after deletions:
node --env-file=rag/.env.local rag/ingest.mjs --prune
```

## Retrieval (from a chat function)

```javascript
import { retrieve } from './rag/retrieve.mjs';

const results = await retrieve(userQuestion, {
  topK: 30,
  topN: 8,
  filter: { entry_number: { $eq: 73 } },  // optional
});

// results: [
//   {
//     id: 'transcript_segment::entry-73::...',
//     pinecone_score: 0.91,
//     rerank_score: 0.87,
//     text: 'And we went down to Greenwood, Mississippi, where Stokely...',
//     metadata: { entry_number: 73, entry_subject: 'Kathleen Cleaver',
//                 timestamp_start_seconds: 1842.3, ... },
//   },
//   ...
// ]
```

## Substrate-adapter portability

The Pinecone-specific HTTP calls live in `shared.mjs` (headers + endpoints)
and the upper-level functions in `ingest.mjs` + `retrieve.mjs`. To migrate
to a different substrate (Weaviate, Supabase pgvector, Qdrant), the file
surface to swap is:

- `shared.mjs`, endpoint + header config
- `ingest.mjs::listAllVectorIds`, `::upsertVectors`, `::deleteVectorIds`
- `retrieve.mjs::pineconeQuery` (rename + reshape per new substrate)

The chunking (`chunker.mjs`), embedding (`embed.mjs`), and rerank
(`retrieve.mjs::voyageRerank`) layers are substrate-agnostic and stay
identical across migrations.

A panic-button migration to Supabase pgvector would be ~1–2 days of
work: re-implement the three Pinecone helpers against the Supabase
client SDK, change ingest output table, change retrieve query to SQL.
The application contract (the shape returned by `retrieve()`) stays
the same.

## Cost expectations

| Item | Frequency | Cost |
|---|---|---|
| One-time ingest (≈16K chunks × ~500 tokens) | once | ~$0.80 in Voyage embedding |
| Steady-state query embedding (~3–15K queries/mo × ~20 tokens) | monthly | <$0.02 |
| Voyage rerank-2 on top-K retrievals | monthly | ~$1–3 |
| Pinecone Builder (covers civil-rights + worldthought) | monthly | $20 flat |
| **Total monthly RAG infrastructure** | | **~$22–25** |

## Status as of 2026-06-01

- ✅ Phase 4 scaffolding complete (this directory)
- ✅ Pass 1-8 audit complete on the original 127-entry corpus (Pass 8 = LoC canonical-archive cross-reference; see `transcripts/AUDIT_TRAIL.md` Session 8)
- ✅ Corpus now 140 interviews (entry IDs 1-142, gaps at 31 and 95). Authoritative count lives in `public/rag/toc.json` (`count: 140`, `rechaptered_count: 140`); all 140 are re-chapterized into granular chapters grouped into parts. The 127 audit-original entries went through the full Pass 1-8 cascade; the remainder came in via the streamlined LoC-heal ingestion. See `transcripts/ingestion/README.md`.
- ✅ Per-interview data is STATIC JSON, not Firestore. The React app reads `public/rag/summaries/pipeline_output/entry_<N>.json` plus derived aggregates under `public/rag/`. Firestore backs only the auth gate and the (currently unused) review queue.
- ✅ `corrected/` is downstream-ready: every entry has `.srt + .txt + .vtt + manifest.json` with the same schema (verified by `transcripts/ingestion/verify_corpus_unified.py`). Manifests carry `entry_number`, `entry_subject`, and `entry_provenance` (`audit-original` or `ingestion-only`).
- ✅ `rag/ingest.mjs` discovers entries via BOTH master MD `**Source**:` lines AND fallback to `manifest.json::entry_number` for ingestion-only entries (which don't have master MD entry headings yet). `SKIPPED_ENTRIES` is `{31, 95}`.
- ✅ `rag/ingest.mjs` propagates `entry_provenance`, `inferential_uncertainty_score`, `inferential_uncertainty_tier`, and `loc_item_url` from each manifest into the Pinecone metadata for downstream filtering and LoC-citation linking, and drops phantom byDir records whose source directories don't exist on disk so the entry count is honest.
- ✅ **Pinecone civil-rights index provisioned 2026-05-25 23:00 UTC.** Index name `civil-rights`, dim 1024, cosine, aws-us-east-1, Builder serverless. Co-mingled with `worldthought` in the same project (shared host hash `odc9z70`), provisional, see `rag/.env.local` for migration path to separate `civil-rights-prod` project.
- ✅ **Ingest complete.** An earlier run held 40,710 vectors across `.srt`/`.txt`/`.vtt`; the `.txt`/`.vtt` near-duplicates were pruned, leaving `.srt`-only passage vectors (15,464 at the 136-interview point; now ≈16K across the 140 interviews, verify exact count against Pinecone). The catalog also pushes one vector per person page (`content_type='person'`, ~202 vectors). Every retrieval result is time-anchored.
- ✅ **Precompute artifacts published** under `public/rag/`: per-entry `related/entry-N.json` files (per-chunk top-5 cross-entry passages + per-entry related-entry summary), `centroids.json` (per-entry mean embeddings with tier/provenance/loc URL), `constellation.json` (2D PCA scatter for visualization). Re-run `rag/precompute.mjs` after a re-chapterization or re-ingest so these track the current 140-interview corpus.
- ✅ **`/retrieve` Netlify Function deployed.** Citation-grade payloads with `entry_number` shortcut + `dedupeByEntry` polyphonic option. Live at `https://civil-rights-staging.netlify.app/retrieve`; production frontend at robotlogic.org.
- ✅ **`/rag-explore` page deployed** (auth-gated), surfaced in the nav as "Data Insights". Tabs cover semantic search, quote-finding, the embedding-space map (constellation), and related interviewees. Audit-tier color signal consistent across header pills, citation card badges, and SVG dots.
- ✅ **MCP server rewired** to Pinecone+Voyage (commit `2c05cd8`). Smoke-tested locally 2026-05-26 (search_transcripts call with `dedupe_by_entry:true` returned Lowery on nonviolence-as-theology with full Chicago citation). Fly.io deploy blocked on Eric installing `flyctl`.
- ⏳ Anthropic Connector Directory submission: requires OAuth 2.1 on the MCP `/mcp` endpoint. Skeleton notes the plug-in point. Post-conference.

## Multi-project Pinecone setup (cost-sharing notes)

The civil-rights and worldthought.com projects share a single Pinecone Builder organization ($20/mo flat) but maintain SEPARATE Pinecone projects within that organization:

```
Pinecone organization (one account: eric@aigamma.com)
  └── Project: worldthought-prod (existing)
  │     └── index: worldthought (1024-dim, voyage-3, philosophy corpus)
  └── Project: civil-rights-prod (to be created)
        └── index: civil-rights (1024-dim, voyage-3, oral-history corpus)
```

This is intentional. Two separate projects keeps each corpus's metadata schema and namespacing independent, lets each project have its own API key for least-privilege access, and isolates blast radius if one project ever needs to be rotated or wiped. The shared billing-relationship + shared Voyage AI key keeps costs combined under the same per-month ceiling (~$22-25/mo for the pair).

The application-layer code in this directory (`shared.mjs`, `ingest.mjs`, `retrieve.mjs`) is identical to the worldthought.com `scripts/rag/` modules in structure but reads its own `.env.local` so a misconfiguration on one project can't accidentally write to the other's index.

## Nomic Atlas (used briefly, then canceled)

A Nomic Atlas Plus account was active from 2026-05-26 through approximately
2026-05-27 to compute a UMAP projection + auto-labeled topic model on the
then-15,464-passage corpus (136 interviews at the time). The static output is preserved in
`public/rag/atlas_projection.json` (5.10 MB, in git). After Atlas was
canceled, no further Atlas calls happen on the public site, the JSON is
the only piece that ever mattered for visualization, and it lives forever.

See [`ATLAS_PROVENANCE.md`](./ATLAS_PROVENANCE.md) for full documentation
of:
- What's in `atlas_projection.json` (schema, row counts, the 8 broad topic
  labels)
- The four pipeline scripts (`dump_for_nomic.mjs`, `upload_to_nomic.py`,
  `rebuild_atlas_topics.py`, `download_from_nomic.py`), retained for
  reference; they will FAIL post-cancellation because they hit
  Atlas-account-scoped endpoints
- The drop-in replacement (self-hosted UMAP via `umap-learn`) if the
  corpus ever needs re-projection without re-subscribing to Atlas
