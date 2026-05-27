# Interactive features, design doc

**Audience:** engineers picking up this work (could be a fresh agent, a
human contributor, or the worldthought.com team adapting the pattern to
their own corpus). Status as of **2026-05-25**.

The scaffolding for an interactive "connection-display" layer on top of
the civil-rights RAG substrate is complete and pushed. This doc explains
the architecture, the contract each piece exposes, what's blocked on
operational steps (Pinecone provisioning + first ingest), and how the
same pattern ports to worldthought.com.

## One substrate, three layers, two consumers

```
[ Pinecone civil-rights ]   [ Pinecone worldthought ]
        \                    /
         \                  /
          v                v
     ┌──────────────────────────┐
     │ Logic layer (this repo's │
     │ rag/ workspace)          │
     │                          │
     │ - rag/embed.mjs          │  Voyage voyage-3 query embedding
     │ - rag/retrieve.mjs       │  Pinecone /query + Voyage rerank-2
     │ - rag/precompute.mjs     │  Static JSON artifact generation
     │ - rag/ingest.mjs         │  (writes the vectors the rest reads)
     └──────────────────────────┘
          |                |
          v                v
   ┌──────────────┐ ┌────────────────────────────┐
   │ Function     │ │ Static JSON artifacts      │
   │ /retrieve    │ │ public/rag/                │
   │ (live queries)│ │ - related/entry-<N>.json │
   │              │ │ - centroids.json           │
   │              │ │ - constellation.json       │
   └──────────────┘ └────────────────────────────┘
          |                       |
          v                       v
     ┌─────────────────────────────────────┐
     │ UI layer                            │
     │ src/components/rag/                 │
     │                                     │
     │ - CitationCard (shared)             │
     │ - SemanticSearch    (uses Function) │
     │ - QuoteFinder       (uses Function) │
     │ - RelatedPassages   (uses static)   │
     │ - Constellation     (uses static)   │
     │ - <future: ThemeCard, Graph>        │
     └─────────────────────────────────────┘
          |                       |
          v                       v
     civil-rights site       worldthought site
```

## The single payload contract

Every interactive surface, the Netlify function, the MCP server tool
response, the precomputed JSON arrays, emits the same per-result
payload shape. This is why UI components don't branch on substrate.

```ts
type CitationPayload = {
  // identity
  id: string;                  // Pinecone vector id
  entryNumber: number | null;
  entrySubject: string | null;
  chunkIndex: number | null;

  // passage
  text: string;
  textPreview: string;         // first 200 chars + …

  // citation
  locItemUrl: string | null;   // Library of Congress catalog URL
  timestampStart: number | null;       // seconds
  timestampEnd: number | null;
  timestampStartStr: string | null;    // "HH:MM:SS"
  timestampEndStr: string | null;

  // transparency
  entryProvenance: "audit-original" | "ingestion-only" | null;
  uncertaintyTier: "low" | "medium" | "publication-block" | "not-auditable" | "ingestion-only" | null;
  uncertaintyScore: number | null;     // 0.0–~0.5
  fidelityNote: string;                // one-line plain English

  // ranking
  pineconeScore: number | null;
  rerankScore: number | null;
  similarity: number | null;           // = rerankScore ?? pineconeScore

  // pre-formatted citation block (Chicago)
  suggestedCitation: string;

  // legacy-compat (for prompts referencing prior field names)
  interviewName: string | null;
  documentId: string | null;
  timestamp: string;
  type: string;
  videoEmbedLink: string | null;
  sourcePath: string | null;
  sourceExt: string | null;
};
```

The shape is defined in three places in the codebase that must stay in
sync:

1. `mcp-server/server.mjs::toCitationPayload`
2. `netlify/functions/retrieve.mjs::toCitationPayload`
3. `src/components/rag/RelatedPassages.jsx::passagePreviewToCard`
   (only because the precomputed JSON uses snake_case keys; this adapter
   bridges to the camelCase shape)

If a new field is added to the metadata schema at ingest time, propagate
it through all three. The MCP server's USAGE_GUIDE.md also documents
this shape, keep it accurate.

### Tier-color palette is also duplicated

The same 5-tier vocabulary (`low` / `medium` / `publication-block` /
`not-auditable` / `ingestion-only`) maps to colors in four UI surfaces.
**Add a new tier value? Update all four:**

1. `src/components/rag/CitationCard.jsx::TIER_BADGE`, Tailwind classes
   for the citation badge (bg-50, text-800, border-200, icon).
2. `src/components/rag/Constellation.jsx::TIER_COLORS`, raw hex colors
   for the SVG circle fills (darker 600/700-level for cream-background
   visibility).
3. `src/pages/RagExplore.jsx` corpus-stats header pills, Tailwind
   classes, same palette as `TIER_BADGE`.
4. `fidelityNoteFor()`, duplicated in `mcp-server/server.mjs`,
   `netlify/functions/retrieve.mjs`, AND `src/components/rag/RelatedPassages.jsx`.
   Same 5 tier values get human-readable note text.

A future refactor could extract a single `src/components/rag/tiers.js`
exporting `{ vocabulary, palette, fidelityNote }` and import it across
the React side; the MCP server and Netlify function would still need
their inline copies (Docker / Function isolation), but at least the
React side would be DRY. For now: 4 files, ~15 lines each, documented.

## Per-feature interfaces

### 1. SemanticSearch + QuoteFinder (live; Function-backed)

```jsx
<SemanticSearch
  placeholder="Search the archive…"
  topN={8}
  entryNumber={null}         // optional metadata filter
  showFullText={false}
  onSelect={(payload) => {}} // optional click handler
/>

<QuoteFinder
  placeholder="Paste a quote…"
  topN={5}
/>
```

Both call `retrieve(query, opts)` from `src/services/ragClient.js`. Both
render a list of `CitationCard`s.

Requirements:
- Netlify environment has `PINECONE_API_KEY` / `PINECONE_HOST` / `VOYAGE_API_KEY`.
- The Pinecone index is populated.

### 2. RelatedPassages (static; precomputed JSON)

```jsx
{/* Mode A: top related interviewees (sidebar) */}
<RelatedPassages entryNumber={73} mode="entries" limit={5} />

{/* Mode B: top related passages for a specific chunk (inline) */}
<RelatedPassages entryNumber={73} mode="chunk" chunkIndex={42} limit={5} />
```

Reads `public/rag/related/entry-<N>.json`. Returns null gracefully if
the file isn't published yet.

Requirements:
- `rag/precompute.mjs --feature related` has run and the output JSON
  is committed to the repo (or generated at Netlify build time).

### 3. Constellation (static; PCA)

```jsx
<Constellation
  width={720}
  height={720}
  onSelect={(point) => navigate(`/interviews/${point.entry_number}`)}
/>
```

Reads `public/rag/constellation.json`. SVG scatter with subtle reference
grid, variable-radius dots (log-scaled by chunk count), hover labels,
click navigation.

Requirements:
- `rag/precompute.mjs --feature centroids` and `--feature constellation`
  have run.

## Build order (the operational pipeline)

```
1. Pinecone civil-rights project + index provisioned in console (admin)
   ↓
2. node --env-file=rag/.env.local rag/ingest.mjs
   (writes ~70k chunks to Pinecone; one-time + idempotent re-ingest)
   ↓
3. node --env-file=rag/.env.local rag/precompute.mjs
   (writes public/rag/related/*.json, centroids.json, constellation.json)
   ↓
4. Commit public/rag/ artifacts → push → Netlify deploy picks them up
   ↓
5. Set Netlify env vars (PINECONE_API_KEY/HOST, VOYAGE_API_KEY) so
   the /retrieve function works for live SemanticSearch/QuoteFinder
   ↓
6. (Optional) Wire each UI component into the existing React pages
   ↓
7. (Optional) flyctl deploy in mcp-server/ for the MCP connector
```

Steps 1, 4, 5, and 7 are operational (admin actions on Pinecone /
Netlify / Fly.io dashboards). Steps 2, 3, 6 are running scripts /
editing React pages.

## Portability to worldthought.com

The same code runs against worldthought.com's Pinecone index by changing
exactly four things:

1. **`PINECONE_HOST` + `PINECONE_INDEX`** at runtime (env vars). Point
   them at the worldthought project's index.
2. **Per-site adapter function** (only if the metadata schemas diverge).
   civil-rights uses `entry_subject` + `entry_number` + `timestamp_*`.
   worldthought uses different field names (e.g., `philosopher_name`,
   `work_citation`). Adapter normalizes them into the shared payload
   shape. Lives in `src/services/ragClient.js` (per-site fork) or as a
   pluggable function.
3. **Branding tokens.** Tailwind theme colors per-site.
4. **Editorial content.** Tour content, theme names, anything human-
   curated rather than corpus-derived.

The retrieval, the rerank, the chunking, the embed model, the precompute
algorithms, the UI components, all of these are corpus-agnostic. The
worldthought adaptation is a half-day port if the metadata schemas align,
or a one-day port if a per-field adapter has to be written.

### Cross-corpus federation (future)

If at some point the user wants to query BOTH corpora from one UI
("show me how civil rights leaders' words on nonviolence relate to
philosopher writings on the same theme"), the path is:

- Two Pinecone projects, two `/retrieve` functions
- A new federation component that fans out the query to both and merges
  the results by similarity score
- The metadata shape difference becomes a UI affordance ("3 civil rights
  passages + 2 philosopher passages on this query")

Not in scope today, but the architecture leaves this open.

## Deployment manifest

| Component | Where | Env vars | Build cost | Runtime cost |
|---|---|---|---|---|
| MCP server | Fly.io | PINECONE_API_KEY, PINECONE_HOST, VOYAGE_API_KEY | npm + Docker | $5-10/mo Fly + ~$1-3/mo Voyage |
| /retrieve function | Netlify | Same three + RETRIEVE_ALLOWED_ORIGINS | Netlify build | included in Builder plan (~$1/mo Voyage at moderate traffic) |
| Static artifacts (public/rag/*) | Repo, deployed via Netlify | none at runtime | One-shot via rag/precompute.mjs (~$0 on Pinecone Builder; queries are free under the tier limits) | $0 |
| UI components | Bundled into the React build | none | included in `npm run build` | $0 |

Total infrastructure cost across MCP server + Netlify Function + static
artifacts + UI: **~$25/mo combined**. The connector's per-query LLM cost
is borne by the client (Claude subscription).

## Open design questions

The following are not blocking but worth deciding before the conference:

- **Should the constellation use UMAP instead of PCA?** UMAP gives a
  much more thematically-readable layout, but the existing JS ecosystem
  doesn't have a production-quality UMAP. Options: (a) keep PCA, (b)
  add a Python preprocessor that produces the JSON, (c) ship a WASM-
  compiled UMAP. Current scaffold uses PCA + a note in the JSON output
  documenting the choice.
- **Should the precomputed `related` files be committed to the repo
  or generated at Netlify build time?** Committing is simpler (deterministic
  deploys, demo-able on a fresh clone). Build-time generation keeps the
  repo small but adds Pinecone-credential requirements to the Netlify
  build environment.
- **Should the SemanticSearch component include CAPTCHA or rate-limiting
  on the public site?** Pinecone queries are essentially free under the
  Builder tier, so abuse-cost exposure is low. But Voyage embed cost
  could grow under heavy abuse; per-IP rate-limit at the Netlify edge
  is the simplest mitigation. Current scaffold has no rate-limiting.
- **Should the MCP server require OAuth before submitting to Anthropic
  Connector Directory?** Per Anthropic's submission process, OAuth 2.1
  is required. The skeleton's `app.post('/mcp', ...)` handler is where
  the auth middleware plugs in. Implementation deferred to whichever
  agent picks up the Directory-submission task.

## Where this fits in the broader project

The interactive layer is purposefully orthogonal to the seven-pass audit
work that occupies the bulk of the repo. The audit produces the
corrected transcripts; the corrected transcripts get ingested into
Pinecone; this layer makes them queryable.

Read order for a fresh agent:

1. `CLAUDE.md` (you're already there if you're reading via the
   docs map).
2. This file.
3. `rag/README.md` (substrate details + metadata schema).
4. `rag/CONFERENCE_PREP.md` (the London-conference framing).
5. `mcp-server/USAGE_GUIDE.md` (the audience-facing connector pitch).

If you're picking up the wiring task, putting these components into
the actual React pages, start with `src/pages/InterviewIndex.jsx` and
`src/pages/Interview*.jsx` to find natural integration points for
`<RelatedPassages>` and `<SemanticSearch>`. The `<Constellation>` is a
landing-page / `/explore` candidate.
