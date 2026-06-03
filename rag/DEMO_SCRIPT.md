# RAG demo, what to show stakeholders

A one-pager for the WWU meeting (or any future demo). The surfaces below
are live in production on `https://spokenhistory.org` and staging on
`https://civil-rights-staging.netlify.app` unless otherwise noted.

## In one sentence

140 oral-history interviews from the Library of Congress / Smithsonian
Civil Rights History Project, ≈16K time-anchored passages indexed
in Pinecone, available as (1) a public semantic-search endpoint with
citation-grade metadata, (2) a 2D map of the corpus in embedding space,
and (3) an MCP connector for researchers using Claude (when deployed).

## Three minutes of demo

### 1. Semantic search on the explore page

Open `/rag-explore` (login required: `wwu` / `civilrights`).

- Default tab: **Semantic search**.
- Try: `nonviolence as theology vs. tactic`
  - Expect three SNCC voices in distinct framings (Annie Pearl Avery,
    Dion Diamond, Courtland Cox), each with a Library of Congress
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

- 140 dots, color-coded by the settled audit state:
  - **LoC-Verified (137)**, healed against the Library of Congress's
    published transcript for that interview
  - **Audio-Limited (3)**, no machine-readable LoC transcript to verify
    against, so fidelity is bounded by the audio
- Hover any dot for the interviewee's name and chunk count.

The talking point: this is the "philosophy of embedding" demo. Two
interviewees who never met but whose words land within 0.12 cosine of
each other on a topic appear as nearby dots. The audit-tier coloring
overlays the corpus's institutional credibility on top of the
thematic similarity layout. **Click any dot** to jump to the Related
Interviewees tab pre-filtered to that interview, the map becomes a
discovery tool, not just a visualization.

### 4. Related interviewees

Same page, **Related interviewees** tab.

- Pick an interview from the dropdown (six pre-seeded examples spanning
  SCLC, SNCC, BPP, Freedom Rider, and Till-family voices).
- The panel shows the top-8 interviewees whose words are most
  thematically related, aggregated across all chunks of the selected
  interview. The counts reflect how many cross-chunk embedding matches
  each related interviewee accumulated.

The talking point: this is the cross-corpus kinship layer made
concrete. Showing "Aaron Dixon's voice is most related to Elmer
Dixon's, Kathleen Cleaver's, and Cleveland Sellers'" is what makes
the embedding space useful for narrative scholarship, the
relationships were computed by the model, not curated by hand.

## Numbers worth quoting

| | |
|---|---|
| Interviews indexed | 140 |
| Total time-anchored passages | ≈16K (verify exact count against Pinecone) |
| Person reference pages indexed | 202 (165 interviewees + 37 external Historic Figures) |
| Embedding model | Voyage AI voyage-3 (1024-dim, retrieval-tuned) |
| Reranker | Voyage rerank-2 (cross-encoder) |
| Vector store | Pinecone Builder serverless |
| Monthly infra cost (all-in) | ~$25 |
| Cost per query | <$0.0001 (Voyage + Pinecone combined) |
| LLM cost on the project side | $0, clients supply their own |

## Three Wednesday-friendly demo queries

For the meeting, these three exercise distinct facets:

1. **`nonviolence as theology vs. tactic`**, 3 distinct SNCC voices,
   all LoC-Verified. Shows the polyphonic record.
2. **`my cousin Emmett Till`** with entry_number filter on Wheeler
   Parker Jr., three time-anchored Wheeler Parker passages from the
   moments before the abduction. Shows the metadata-filter precision.
3. **`Bloody Sunday Edmund Pettus Bridge`**, Alfred Moldovan describing
   the medical-team response. Shows the system handling a range of
   interviews with the per-result audit-state badge (LoC-Verified vs
   Audio-Limited).

(All seven canonical demo queries live in `scripts/demo-queries.sh`.)

### Deep-linkable share URLs

Any search query can be shared as a URL. Examples Eric can hand to a
stakeholder before the meeting:

- `https://civil-rights-staging.netlify.app/rag-explore?q=Bloody+Sunday+Edmund+Pettus+Bridge#search`
- `https://civil-rights-staging.netlify.app/rag-explore?q=nonviolence+as+theology+vs.+tactic#search`
- `https://civil-rights-staging.netlify.app/rag-explore?q=the+dreamer+can+be+killed+but+not+the+dream#search`

The recipient lands on the Search tab, the query is pre-loaded into
the box, and results render automatically. The URL itself is also a
verbatim record of what was searched, useful for citation footnotes
("queried 2026-05-26 at <URL>").

## The MCP connector (not yet deployed)

`mcp-server/` contains a ready-to-deploy MCP server backed by the same
Pinecone substrate. Three tools (`search_transcripts`, `get_transcript`,
`list_leaders`) + three research prompts including `source_for_claim`,
which is the citation-oracle pattern from `mcp-server/USAGE_GUIDE.md`.

Deployment is blocked on `flyctl auth login` (interactive). Once
deployed, researchers using Claude Desktop / claude.ai Custom
Connectors can attach the archive to their workflow without WWU paying
LLM costs, the client supplies their own Claude subscription.

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
  `.vtt` re-encodings, every result now carries timestamps.
- Color-coded the constellation by audit tier so the substrate is
  visible at a glance, not just described in copy.
- Cap the citation card with a per-tier audit badge so researchers
  know exactly which tier they're citing from.

## The `/playlist-builder` surface (now static)

The legacy grad-student playlist row read from Firestore, which is empty
of content, so every `/playlist-builder?keywords=...` deep-link (roughly
50 on the Home page alone, plus Topics and others) was dead. The route
now renders `src/pages/StaticPlaylist.jsx`, which reads
`public/rag/playlist_index.json` (every chapter across the 140
interviews; regenerated by `scripts/build_playlist_index.py`). It filters
by `?keywords=` / `?q=` / `?topic=` / `?entry=` / `?entries=N,M&label=`
and plays each clip bounded to its start/end timestamp. The old
`PlaylistBuilder.jsx` is retained but no longer routed. Re-run
`scripts/build_playlist_index.py` after any re-chapterization so the clip
index tracks the new chapter boundaries.
