# Next-session pickup, civil rights RAG layer

If you're a fresh agent or returning to this work after a break, read
this doc first. It's the 5-minute orientation for "where things stand
and what should happen next." Last reviewed 2026-06-01.

## State of the world (one paragraph)

The civil rights RAG layer is **live and working**, in production on
`https://robotlogic.org` and staging on
`https://civil-rights-staging.netlify.app`. The Pinecone civil-rights
index holds ≈16K `.srt`-anchored passage vectors covering the 140
interviews (verify exact count against Pinecone; it was 15,464 at the
136-interview point), plus one vector per person page
(`content_type='person'`, ~202). Per-interview data is STATIC JSON, not
Firestore: the React app reads `public/rag/summaries/pipeline_output/entry_<N>.json`
plus derived aggregates under `public/rag/` (Firestore backs only the
auth gate and the unused review queue). The `/retrieve` Netlify function
returns citation-grade payloads (interviewee, LoC catalog URL, exact
timestamp range, audit tier, Chicago-style suggestedCitation block). The
`/rag-explore` page (surfaced as "Data Insights" in the nav) has tabs for
semantic search, quote-finding, the embedding-space scatter, and related
interviewees, all backed by live data. The MCP server code is rewired
against the same substrate and smoke-tested locally; it hasn't been
deployed to Fly.io yet because flyctl isn't installed on Eric's machine.

## Read these first (priority order)

1. **`CLAUDE.md`**, project-wide conventions, operational state
   section near the bottom, full Pinecone+Voyage substrate details.
2. **`rag/DEMO_SCRIPT.md`**, what to demo to stakeholders on
   Wednesday meeting (or any subsequent demo). Three concrete
   queries to run, talking points for each tab.
3. **`rag/ENDPOINTS.md`**, one-page lookup for URLs, identifiers,
   env vars, response payload shape, regenerate commands.
4. **`mcp-server/USAGE_GUIDE.md`**, the audience-facing connector
   doc (Anthropic Connector Directory submission material).
5. **`rag/INTERACTIVE_FEATURES_DESIGN.md`**, the architecture
   diagram + worldthought.com porting pattern.

## What's blocked (admin-only actions)

These three things can ONLY be done by Eric (or whoever has the
relevant credentials):

| Item | What it needs | Effort |
|---|---|---|
| MCP server Fly.io deploy | flyctl install → `flyctl auth login` → `cd mcp-server && fly deploy` | ~10 min |
| Pinecone migration to separate `civil-rights-prod` project | Pinecone console action → generate new project-scoped API key → update `rag/.env.local` + Netlify env vars → re-ingest | ~30 min |
| Anthropic Connector Directory submission | OAuth 2.1 on the MCP `/mcp` endpoint first, then submit per Anthropic's process | post-conference |

## What's NOT blocked (open code work, if asked)

- **Wire `<SemanticSearch>` or `<RelatedPassages>` into the existing
  pages** (`src/pages/TableOfContents.jsx`, the `/table-of-contents`
  "Interviews" page that absorbed the retired card-grid Interview Index;
  and `src/pages/InterviewPlayer.jsx`). The components are built and
  tested via `/rag-explore`. Integration into existing pages was
  intentionally deferred because it's Eric-decision-shaped: where should
  the components surface?
- **Port the same RAG layer to worldthought.com**. Architecture
  documented in `rag/INTERACTIVE_FEATURES_DESIGN.md::Portability to
  worldthought.com`. The patches needed are well-scoped (~half-day
  port if metadata schemas align, ~one day if a per-field adapter
  is needed).
- **HDBSCAN clustering of the embedding space** for thematic-cluster
  pages. Scaffolded as a TODO in `rag/precompute.mjs`; the function
  shell + run hook are present, the algorithm choice is pending.
- **OAuth 2.1 on the MCP endpoint** for Connector Directory
  submission. Skeleton notes the plug-in point in
  `mcp-server/server.mjs` near `app.post('/mcp', ...)`.

## Three patterns to know about this codebase

1. **Citation-grade payload contract** is documented at the type-
   level in `rag/INTERACTIVE_FEATURES_DESIGN.md`. The shape is
   materialized in THREE places (MCP server, Netlify function, the
   per-chunk snake_case adapter in RelatedPassages.jsx). When adding
   a new metadata field, propagate it through all three.

2. **`fidelityNoteFor`** is duplicated in three places (server.mjs,
   retrieve.mjs, RelatedPassages.jsx) because the React boundary
   and the Docker isolation make a shared module awkward. Keep them
   in sync, adding a new tier value means editing all three.

3. **Pre-existing audit substrate** lives in `transcripts/`, 8
   passes of audit work culminating in word-level alignment against
   the Library of Congress's published transcripts. The five tier
   values (low / medium / publication-block / not-auditable /
   ingestion-only; per-tier counts shift as new interviews ingest,
   verify against current manifests) are the per-entry confidence
   classification flowing through Pinecone metadata and surfacing
   as colored badges on every citation card. The user-facing
   `/rag-explore` UI collapses these into two settled states,
   "LoC-Verified" (137) and "Audio-Limited" (3), for a 140-interview
   total.

## Things NOT to do

- Don't re-run Passes 1-7 on new transcripts, that pipeline is
  retired. The Pass 8 LoC-canonical-archive cross-reference is the
  primary correction layer for any new ingestion (documented in
  `transcripts/ingestion/README.md`).
- Don't co-mingle worldthought + civil-rights as a permanent
  arrangement, they share a Pinecone project today as a temporary
  shortcut because we needed to deploy fast. Migration to a separate
  `civil-rights-prod` project is documented in `rag/.env.local`
  (a gitignored file Eric will have).
- Don't set Netlify env vars with `envVarIsSecret: true` +
  `context: "all"` via MCP, that combination silently rejects the
  upsert (verified pitfall, saved as
  `reference_netlify_mcp_envvar_secret.md` in memory).
- Don't strip the audit-fidelity transparency from any citation
  surface. The per-tier audit signal (five values in the substrate,
  collapsed to two settled states in the UI: LoC-Verified and
  Audio-Limited) is load-bearing for the academic-citation use case,
  without it, the connector becomes a hallucination risk.

## Two things worth verifying on session resume

```bash
# 1. The live function still works (no env vars rotated, no Pinecone
#    quota hit, no Voyage rate limit issue)
bash scripts/demo-queries.sh nonviolence

# 2. The Pinecone index still has its full content
curl -sS -H "Api-Key: ${PINECONE_API_KEY}" -H "X-Pinecone-API-Version: 2024-07" \
  https://civil-rights-odc9z70.svc.aped-4627-b74a.pinecone.io/describe_index_stats \
  | python -c "import json, sys; print('vector count:', json.load(sys.stdin)['totalVectorCount'])"
# Expected: ≈16K passage vectors across 140 interviews + ~202 person vectors
# (it was 15,464 at the 136-interview .srt-only point; verify the current total)
```

If either of those breaks, the issue is operational (key rotated,
rate-limit, etc.), not in the codebase. Start there.

## Commit signature for this session

26+ commits over ~6 hours of autonomous work on 2026-05-25/26. Full
list in `git log --oneline 2c05cd8..`. Major buckets:

- MCP server rewire (3 commits)
- Precompute pipeline (4 commits)
- Netlify Function + RAG components (5 commits)
- `.srt`-only prune + tier-aware UX (6 commits)
- Doc cleanups + smoke-tests + memory entries (8+ commits)
