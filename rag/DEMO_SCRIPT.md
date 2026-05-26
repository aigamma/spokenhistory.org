# RAG demo — what to show stakeholders

A one-pager for the Wednesday WWU meeting (or any future demo). All
the surfaces below are live on `https://civil-rights-staging.netlify.app`
unless otherwise noted.

## In one sentence

136 oral-history interviews from the Library of Congress / Smithsonian
Civil Rights History Project, ~15,000 time-anchored passages indexed
in Pinecone, available as (1) a public semantic-search endpoint with
citation-grade metadata, (2) a 2D map of the corpus in embedding space,
and (3) an MCP connector for researchers using Claude (when deployed).

## Three minutes of demo

### 1. Semantic search on the explore page

Open `/rag-explore` (login required: `wwu` / `civilrights`).

- Default tab: **Semantic search**.
- Try: `nonviolence as theology vs. tactic`
  - Expect three SNCC voices in distinct framings (Annie Pearl Avery,
    Dion Diamond, Courtland Cox) — each with a Library of Congress
    catalog link, an exact timestamp range, and an audit-tier badge
    showing "Audited · Low uncertainty."

The talking point: every result is a verifiable primary-source quote,
not an AI paraphrase. The Chicago citation is pre-formatted and
deep-links to the LoC archive item.

### 2. Quote-finder pattern

Same page, **Quote-finder** tab.

- Paste: `the dreamer can be killed but not the dream`
- Expect: the **Abernathy family** interview, with the passage at
  `01:43:46–01:44:06`. Ralph David Abernathy on carrying the movement
  forward after King's assassination.

The talking point: a researcher who half-remembers a quote gets the
actual canonical primary source with full attribution. This is the
exact use case that drives the MCP-connector pitch for the Anthropic
Connector Directory.

### 3. The embedding-space map

Same page, **Embedding-space map** tab.

- 136 dots, color-coded by audit tier:
  - **Green (72)** — low uncertainty, well-audited
  - **Amber (18)** — medium uncertainty
  - **Red (23)** — publication-block tier (known issues)
  - **Violet (14)** — not externally verifiable
  - **Slate (9)** — ingestion-only (added 2026-05-25)
- Hover any dot for the interviewee's name and chunk count.

The talking point: this is the "philosophy of embedding" demo. Two
interviewees who never met but whose words land within 0.12 cosine of
each other on a topic appear as nearby dots. The audit-tier coloring
overlays the corpus's institutional credibility on top of the
thematic similarity layout.

### 4. Related interviewees

Same page, **Related interviewees** tab.

- Pick an interview from the dropdown (six pre-seeded examples spanning
  SCLC, SNCC, BPP, Freedom Rider, and Till-family voices).
- The panel shows the top-8 interviewees whose words are most
  thematically related — aggregated across all chunks of the selected
  interview. The counts reflect how many cross-chunk embedding matches
  each related interviewee accumulated.

The talking point: this is the cross-corpus kinship layer made
concrete. Showing "Aaron Dixon's voice is most related to Elmer
Dixon's, Kathleen Cleaver's, and Cleveland Sellers'" is what makes
the embedding space useful for narrative scholarship — the
relationships were computed by the model, not curated by hand.

## Numbers worth quoting

| | |
|---|---|
| Interviews indexed | 136 |
| Total time-anchored passages | ~15,464 |
| Embedding model | Voyage AI voyage-3 (1024-dim, retrieval-tuned) |
| Reranker | Voyage rerank-2 (cross-encoder) |
| Vector store | Pinecone Builder serverless |
| Monthly infra cost (all-in) | ~$25 |
| Cost per query | <$0.0001 (Voyage + Pinecone combined) |
| LLM cost on the project side | $0 — clients supply their own |

## Three Wednesday-friendly demo queries

For the meeting, these three exercise distinct facets:

1. **`nonviolence as theology vs. tactic`** — 3 distinct SNCC voices,
   all tier=low. Shows the polyphonic record.
2. **`my cousin Emmett Till`** with entry_number filter on Wheeler
   Parker Jr. — three time-anchored Wheeler Parker passages from the
   moments before the abduction. Shows the metadata-filter precision.
3. **`Bloody Sunday Edmund Pettus Bridge`** — Alfred Moldovan (an
   ingestion-only entry) describing the medical-team response.
   Shows the system handles new ingestion-only entries with a
   different audit-tier badge.

(All seven canonical demo queries live in `scripts/demo-queries.sh`.)

## The MCP connector (not yet deployed)

`mcp-server/` contains a ready-to-deploy MCP server backed by the same
Pinecone substrate. Three tools (`search_transcripts`, `get_transcript`,
`list_leaders`) + three research prompts including `source_for_claim`,
which is the citation-oracle pattern from `mcp-server/USAGE_GUIDE.md`.

Deployment is blocked on `flyctl auth login` (interactive). Once
deployed, researchers using Claude Desktop / claude.ai Custom
Connectors can attach the archive to their workflow without WWU paying
LLM costs — the client supplies their own Claude subscription.

## Outstanding admin actions

| Action | Who | Effort |
|---|---|---|
| `flyctl` install + `auth login` + `fly deploy` in `mcp-server/` | Eric | 10 min |
| Decide: keep Pinecone civil-rights cohabitating with worldthought, or migrate to a separate project | Eric | TBD |
| Anthropic Connector Directory submission (requires OAuth 2.1 on the MCP endpoint first) | Eric + WWU | post-conference |

## What changed in the 2026-05-25 autonomous-deploy session

Eight blocks, 17+ commits, 138 precompute artifacts. Full session log
in CLAUDE.md under "Operational state." The big quality wins:

- Pruned the index from 40,710 to 15,464 vectors by dropping `.txt` and
  `.vtt` re-encodings — every result now carries timestamps.
- Color-coded the constellation by audit tier so the substrate is
  visible at a glance, not just described in copy.
- Cap the citation card with a per-tier audit badge so researchers
  know exactly which tier they're citing from.
