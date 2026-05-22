# RAG substrate decision record

**Date:** 2026-05-22
**Decision:** Pinecone Builder ($20/mo) hosting both worldthought.com and the civil rights project as separate projects under one organization, with Voyage AI (voyage-3 embeddings + rerank-2) as the embedding / reranking layer.
**Status:** Locked. Pinecone project to be provisioned by Eric; ingest scaffolding in `rag/` is implementation-ready.

## Context

The Civil Rights History Project needs a vector retrieval substrate for the Smithsonian-grade publication pipeline. The decision needed to balance four pressures:

1. **Quality**: The Smithsonian / Library of Congress have been scrutinizing AI-generated summaries for hallucinations. Retrieval quality (hybrid lexical + semantic, accurate reranking) is non-negotiable.
2. **Cost**: An academic project's monthly infrastructure budget should be small. Anything above ~$50/mo would be hard to justify.
3. **Team handoff**: The WWU team (the academic partners owning the long-term project) has limited AI/RAG engineering capacity. Whatever substrate gets deployed needs to be maintainable by someone who is not Eric.
4. **Eric's RAG portfolio**: As a contractor working toward additional AI engagements, Eric values exposure to different substrates across his portfolio of projects.

## Alternatives considered

### Option A — Self-hosted Weaviate on Fly.io
- **Pros**: Adds Weaviate + Fly.io operational experience to Eric's portfolio. Native hybrid retrieval. No vendor lock-in (Apache 2.0). Lowest hosting cost at $20/mo.
- **Cons**: Team handoff burden (Eric operates it; ~30–60 min/month ops). If Eric rolls off, the team inherits a Docker container they need to maintain.

### Option B — Supabase pgvector
- **Pros**: Eric already uses this on aigamma.com (his lead Supabase showcase). Lowest ops burden. Direct MCP integration with Claude (`apply_migration`, `execute_sql`, `deploy_edge_function`, `get_logs`). $10/mo marginal as a new project under his existing Pro.
- **Cons**: Doubles up on a substrate already in his portfolio. Hybrid retrieval requires hand-tuned `tsvector` + `cosine_distance` SQL rather than a pre-tuned hybrid operator.

### Option C — Pinecone Builder
- **Pros**: $20/mo flat covers multiple projects (worldthought + civil rights). Managed substrate — zero team-handoff burden. Polished dashboard for non-engineer stakeholders. Recent platform addition: dense + sparse + full-text indexes available on all tiers, closing the previous "hybrid retrieval is a Weaviate advantage" gap.
- **Cons**: Proprietary (data exportable but vendor lock-in real). Adds no new substrate to Eric's portfolio since worldthought already uses Pinecone. No MCP integration.

### Option D — Weaviate Cloud (managed)
- **Pros**: Managed Weaviate. Easy team handoff. Adds Weaviate to portfolio.
- **Cons**: Recent pricing shift makes the Flex tier $45/mo minimum and Premium $400+. At this price point, Pinecone Builder ($20/mo) and self-hosted Weaviate (~$20/mo) both dominate.

### Option E — Pinecone Cloud Standard
- **Pros**: Pay-as-you-go elasticity, dedicated read nodes, RBAC.
- **Cons**: $50/mo minimum and most features (RBAC, HIPAA, DRN) are unnecessary for the civil rights workload.

## Why Option C (Pinecone Builder) won

The decision criteria, weighted:

| Criterion | Weight | Self-host Weaviate | Supabase pgvector | Pinecone Builder | Weaviate Cloud |
|---|---|---|---|---|---|
| Retrieval quality | high | ✓ native hybrid | ~ DIY hybrid | ✓ hybrid available all tiers | ✓ native hybrid |
| Cost | high | ~$20/mo | ~$10/mo | $20/mo for two projects | $45–400/mo |
| Team handoff | **very high** | poor (Eric operates) | good (managed) | **excellent (managed + polished)** | good (managed) |
| Eric's portfolio | medium | +Weaviate +Fly.io | redundant with aigamma | redundant with worldthought | +Weaviate |

The team-handoff dimension carried the decision. The civil rights project has academic-team stakeholders with limited AI ops capacity; the substrate that ships with the lowest ongoing-maintenance footprint reduces the project's long-run risk. Pinecone Builder + Voyage AI is the highest-quality managed RAG stack at the lowest cost tier that still supports multiple projects under one billing relationship.

The career-portfolio-variety dimension was deliberately deprioritized for this project. Eric's plan is to add Weaviate + Fly.io exposure on a separate personal project (selectsectors.com or similar) where the constraints are different — his own timeline, no academic team to inherit, no Smithsonian quality bar. That keeps the civil rights project's substrate decision driven by *project* needs rather than *career* needs.

## What this commits us to

### Implementation (code)
- All retrieval code lives in `rag/` (mirrors the directory convention used in worldthought.com)
- Pinecone REST API access (no SDK) — same pattern as worldthought, lets us upgrade Pinecone API versions cleanly via the `X-Pinecone-API-Version` header in `shared.mjs`
- Voyage-3 (1024-dim) for document + query embeddings; rerank-2 for second-stage scoring
- Idempotent ingest via content-hash-based deterministic IDs
- Substrate-adapter pattern: the file surface to swap if we ever migrate (Pinecone-specific HTTP wrappers in `shared.mjs` + the upper-level CRUD in `ingest.mjs` / `retrieve.mjs`) is roughly 200 lines of code. Estimated migration to Supabase pgvector or Weaviate: 1–2 days.

### Operational (Pinecone admin)
- Create a new Pinecone project named `civil-rights-prod` under the existing aigamma organization (Builder tier supports multiple projects natively)
- Create a single index named `civil-rights` with dimension 1024, cosine metric, sparse + dense hybrid if available
- Single namespace (default `''`); filtering by `entry_number` / `chunk_type` / etc. is done via metadata
- Add the index API key + host URL to `rag/.env.local` (gitignored)

### Cost ceiling
- Pinecone Builder: $20/mo flat (covers both worldthought + civil rights)
- Voyage AI: ~$2–5/mo at expected query volume
- Total monthly RAG infrastructure: ~$22–25

### Team handoff artifacts (to be produced)
- `rag/README.md` — architecture overview ✓
- `rag/.env.example` — env-var template ✓
- This decision record ✓
- Runbook for common ops (re-ingest after audit overlay updates, prune orphaned vectors, query inspection via console, etc.) — pending
- Panic-button migration script to Supabase pgvector — pending (insurance policy)

## What we explicitly deferred

- **Weaviate + Fly.io exposure**: deferred to a separate personal project (likely selectsectors.com or similar). Not part of the civil rights deliverable.
- **Backup/restore on Pinecone**: Builder tier doesn't include automated backup/restore (that's Standard-tier and above). The civil rights corpus is regeneratable from `transcripts/raw/` + `CLEANED_TRANSCRIPTS_REVIEW.md` + `civil_rights_facts.json`, so the loss-of-index scenario is "re-run the ingest" — roughly $2 + 10 minutes. Backup is therefore not load-bearing.
- **HA / multi-region**: Pinecone Builder is single-region. For an academic project with no live transaction SLA, single-region is acceptable.
- **MCP integration**: Pinecone has no first-party MCP server as of 2026-05-22. Operations happen via REST API + console. The Supabase MCP advantage is acknowledged but not decisive given the other criteria.

## Migration triggers

Re-open this decision if any of these become true:

- **Corpus grows beyond Builder limits** (~10 GB storage or sustained >5M reads/month): step up to Standard ($50/mo) or migrate to Weaviate/pgvector.
- **WWU team adds full-time AI engineering capacity**: self-hosted Weaviate becomes viable; consider the migration for the portfolio + cost-discipline benefit.
- **Pinecone's pricing or feature set shifts adversely**: re-evaluate against Weaviate self-host or Supabase pgvector.
- **The substrate-adapter migration script is exercised**: if we're already running parallel substrates for some reason, consolidating on one becomes free.

## References

- Pinecone pricing: https://www.pinecone.io/pricing (verified 2026-05-22; Builder $20/mo, Standard $50/mo min)
- Voyage AI pricing: https://www.voyageai.com/pricing (voyage-3 $0.06/1M tokens; rerank-2 similar)
- Worldthought.com Pinecone integration: `C:\worldthought.com\scripts\rag\` (the pattern this project's `rag/` mirrors)
- Aigamma.com Supabase pgvector integration: `tbxhvpoyyyhbvoyefggu` project, `rag_documents` table (Eric's lead Supabase showcase)
- Long-form substrate analysis conducted in conversation between Eric and Claude on 2026-05-22; key trade-offs are summarized above without that conversation's full provenance.
