# rag/ — Civil Rights History Project RAG layer

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
  retrieval stack — significantly better than gte-small on semantically
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
[ chat / LLM context builder (downstream — not in this module) ]
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
| `precompute.mjs` | After ingest, emits static JSON for the interactive-features layer (related passages per entry + per-chunk, per-entry centroids, 2D PCA constellation). Runs against any Pinecone index with the same metadata shape — civil-rights and worldthought.com share the script. CLI flags: `--feature {related,centroids,constellation}`, `--entries`, `--centroid-sample`, `--dry-run`. |
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
| `inferential_uncertainty_score` | float (0.0 = no evidence of error, higher = more residual uncertainty) | when manifest carries it (all 136 entries as of 2026-05-25) |
| `inferential_uncertainty_tier` | enum: `low` \| `medium` \| `publication-block` \| `not-auditable` \| `ingestion-only` | same as score |
| `loc_item_url` | string (Library of Congress canonical archive URL) | when LoC healing was applied (all 136 entries) |
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

### Why the provenance / uncertainty / LoC fields are in the metadata

`entry_provenance` lets retrieval differentiate the 127 entries that went through the full Pass 1–8 audit cascade (`audit-original`) from the 9 entries that came in via the 2026-05-25 streamlined ingestion (`ingestion-only`). For Smithsonian-grade publication, an LLM answer that draws from an audit-original chunk can cite the audit overlay; an answer drawn from an ingestion-only chunk should be hedged. Putting the flag in the chunk metadata avoids a second Firestore round-trip at answer time.

`inferential_uncertainty_score` + `inferential_uncertainty_tier` carry the per-entry residual-error estimate defined in `transcripts/AUDIT_TRAIL.md::Inferential scoring framework`. The five tier values that appear in the corpus are `low` (72 entries), `medium` (18), `publication-block` (23), `not-auditable` (14), and `ingestion-only` (9). Retrieval can use the tier as a coarse filter (e.g., `tier: {$eq: "low"}` to bias toward publication-grade entries) or weight rerank by score.

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

- `shared.mjs` — endpoint + header config
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
| One-time ingest (15.5K chunks × ~500 tokens) | once | ~$0.80 in Voyage embedding |
| Steady-state query embedding (~3–15K queries/mo × ~20 tokens) | monthly | <$0.02 |
| Voyage rerank-2 on top-K retrievals | monthly | ~$1–3 |
| Pinecone Builder (covers civil-rights + worldthought) | monthly | $20 flat |
| **Total monthly RAG infrastructure** | | **~$22–25** |

## Status as of 2026-05-25

- ✅ Phase 4 scaffolding complete (this directory)
- ✅ Pass 1-8 audit complete on the original 127-entry corpus (Pass 8 = LoC canonical-archive cross-reference; see `transcripts/AUDIT_TRAIL.md` Session 8)
- ✅ +9 ingestion-only entries added 2026-05-25 from Dustin's student batch (6 genuinely new + 3 SKIPPED/DEFERRED revivals). See `transcripts/ingestion/README.md`. Corpus now 136 entries.
- ✅ `corrected/` is downstream-ready: every entry has `.srt + .txt + .vtt + manifest.json` with the same schema (verified by `transcripts/ingestion/verify_corpus_unified.py`). All 136 manifests carry `entry_number`, `entry_subject`, and `entry_provenance` (`audit-original` or `ingestion-only`).
- ✅ `rag/ingest.mjs` updated 2026-05-25 to discover entries via BOTH master MD `**Source**:` lines AND fallback to `manifest.json::entry_number` for the 9 ingestion-only entries (which don't have master MD entry headings yet). `SKIPPED_ENTRIES` reduced to `{31, 95}` since #28, #46, #64 now have content.
- ✅ `rag/ingest.mjs` second 2026-05-25 update: (a) fixed a pre-existing infinite-loop bug in the master-MD heading-walker (double-`exec` pattern interacted with the global-regex auto-reset of `lastIndex` on null match — replaced with `matchAll` materialization); (b) propagates `entry_provenance`, `inferential_uncertainty_score`, `inferential_uncertainty_tier`, and `loc_item_url` from each manifest into the Pinecone metadata for downstream filtering and LoC-citation linking; (c) drops phantom byDir records whose source directories don't exist on disk so the entry count is honest. Final entry map: 127 audit-original + 9 ingestion-only = 136, matching corrected/ exactly.
- ⏳ Pinecone civil-rights index: not yet provisioned. **Status update**: the Pinecone account originally created for worldthought.com is being shared across both projects via Builder tier's multi-project feature — civil-rights and worldthought each have their own Pinecone project under one billing relationship + one organization. `civil-rights` index host URL needs to be generated in the Pinecone console (one-time admin action) and put in `rag/.env.local`.
- ⏳ First ingest: blocked only on the Pinecone index existing. Voyage AI key already shared via the worldthought-side `.env.local` (or a copy thereof). Full ingest estimated at ~45-75 minutes wall-clock; subsequent re-ingests are content-hash-idempotent so only changed chunks re-embed.
- ⏳ Chat function: not yet written (downstream of this scaffolding).

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
