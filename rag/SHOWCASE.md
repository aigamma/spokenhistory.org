# RAG Showcase, Conference Presentation Brief

**Date:** 2026-05-27 (for the 2026-05-27 WWU team meeting and the London conference). Substantially revised from the 2026-05-26 version.
**Live demo URL:** https://civil-rights-staging.netlify.app/rag-explore (Email/Password gated: Eric admin + `wwu` / `civilrights` team-shared)
**Production URL:** https://robotlogic.org/#/rag-explore
**Branch:** master at the most recent commit; layout now Spectrum-at-top, Concept Lenses default tab.

## What this document is

A single brief explaining every RAG surface deployed for the conference presentation, what each demonstrates conceptually, and how to demo each in 30–90 seconds. Use this to plan the live walkthrough.

Eric's constraint to the project: showcase advanced RAG features **without a chatbot**, because the project leadership doesn't want uncapped tail-risk costs from open-ended generation. Every surface in this brief is either pre-computed (zero per-request cost) or bounded-live-retrieval (~$0.001 per query against the live Pinecone + Voyage pipeline). No LLM-in-the-loop per user request.

**New since the 2026-05-26 version of this doc:**

1. **Six visualization surfaces now drill into actual passages on click.** Spectrum, Concept lenses, Interview map, Themes, Network, and Tours all fire a `/retrieve` call when the user clicks a dot/node/stop, surfacing the audit-graded passages that anchor the visualization. The chart isn't decorative; every interactive element is a live link into the evidence.
2. **Polyphonic events tab retired.** The 8-event timeline didn't earn its place; the homepage Timeline (Home.jsx) carries the canonical movement chronology. Component code retained in the repo for possible flip-back; data files at `public/rag/summaries/events/*` still exist.
3. **Concept axes → "Spectrum"** (renamed) and **floated to the top of the page** as the always-visible headline. The tab nav sits below it labeled "Other ways to look at the data."
4. **Concept lenses (new) is the default tab** below the nav. Four named-axis pair scatters of the same 136 voices with cross-chart hover sync.
5. **Constellation tab → "Interview map"**: same UMAP projection as the (now-retired) Passage map, aggregated to 136 interview centroids with names labeled, search, and empirically-derived axis labels.
6. **Voices in conversation → "Semantic Overlap"** (renamed). Now 16 related entries per interview (was 8), with the top 8 in a radial graph + the full 16 in a list below.
7. **Audit Provenance widget** at the bottom of the About block, 3 number callouts (9 passes / 127 LoC cross-references / 5 tiers) + the Pass 8 methodology paragraph.

## The 11 surfaces (current state)

| # | Tab | URL (after `#/rag-explore?tab=`) | Cost shape | Drill-down? | Demo time |
|---|---|---|---|---|---|
| 1 | **Spectrum** (always at top, not a tab) | `spectrum` redirects to `lenses` | pre-computed + live drill-down | ✓ click any dot | 60 s |
| 2 | **Concept lenses ★** (default tab) | `lenses` | pre-computed + live drill-down | ✓ click any dot | 90 s |
| 3 | **Interview map** | `map` | pre-computed (UMAP) + live drill-down | ✓ click any dot | 45 s |
| 4 | Semantic Overlap | `related` | pre-computed (16 entries) |, | 30 s |
| 5 | Semantic search | `search` | live retrieval (~$0.001/query) |, | 30 s |
| 6 | Quote-finder | `quote` | live retrieval |, | 30 s |
| 7 | Themes (k-means) | `themes` | pre-computed + live drill-down | ✓ click cluster | 30 s |
| 8 | Famous names | `names` | pre-computed |, | 45 s |
| 9 | Geographic atlas | `atlas` | pre-computed + Leaflet map |, | 45 s |
| 10 | Influence network | `network` | pre-computed + live drill-down | ✓ click node | 30 s |
| 11 | Curated tours | `tours` | pre-computed + live drill-down | ✓ click stop | 60 s |
| 12 | Quote of the day | `quote-of-day` | pre-computed (rotation + AI headline) |, | 15 s |

★ = the headline demo. Spectrum sits above the tab nav so it's seen alongside whatever tab is open.

## Three-minute conference demo flow (revised 2026-05-27)

The presentation's thesis is **"relationships between philosophy and embedding"**, what the embedding space "thinks" two oral-history passages have in common, and how that surfaces meaningful philosophical threads across a 600-hour archive. The new flow puts the click-to-retrieve drill-down at the center: every visualization is a live link into the audit-graded passages.

**Minute 1, "The embedding space takes a position, then shows you why."**
1. Open `/rag-explore` (already logged in). The page leads with the **Spectrum** chart, 136 voices positioned along "Nonviolence as theology ↔ Armed self-defense" (the default axis).
2. Hover the leftmost cluster (theological, Lowery, Vivian, C.T. Vivian) and the rightmost (BPP cohort, Elmer Dixon, Cleaver, Howard). *"Watch the embedding space sort 136 voices along a continuum it didn't design."*
3. **Click a leftmost dot** (e.g., Joseph Lowery). A drill-down panel appears beneath the chart: 5 passages from his interview most aligned with "nonviolence as theology." Each carries a timestamp deep-link to the LoC audio, the audit-tier badge, and the full LoC catalog URL. *"The visualization isn't decorative, every dot is a live link into the evidence."*
4. Switch axes (the pills directly under the chart). Try *"Sacred ↔ Secular framing"*. Jack Greenberg and Robert L. Carter (legal infrastructure) shift dramatically; ordained ministers shift the other way.

**Minute 2, "Same voices, multiple conceptual lenses, single hover sync."**
1. Scroll down to the **Concept Lenses ★** tab (the default below the nav). Four small scatters share the same 136 dots through different paired axes.
2. *"Hover Aaron Dixon in chart 1, armed self-defense, secular. Same hover lights him up in chart 2, tactical, collective discipline. Chart 3, northern, armed."* One voice exists at different coordinates in every named-concept space.
3. **Click Dixon to lock**. Below the 4 charts, his 5-axis profile appears as horizontal bars, then a drill-down panel shows his passages most aligned with his STRONGEST axis (largest |position|).

**Minute 3, "The corpus extends beyond its named voices through the network of who-knew-whom."**
1. Click the **Influence network** tab. A d3-force graph of 151 nodes + 214 edges: 136 in-corpus interviewees (brand-red dots) + 15 external figures (gray dots, Ella Baker, Bayard Rustin, Bob Moses, etc.).
2. *"Ella Baker doesn't have an interview here. Bayard Rustin doesn't either. But..."*, **click Ella Baker**. The drill-down shows 5 passages from 5 different speakers describing her. *"Her influence permeates the archive through quoted memory."*
3. Closing line: *"This is the audit-graded substrate the Smithsonian and LoC are gating publication on. Every retrieval is citation-grade, timestamp, LoC URL, audit-tier badge. The embedding does discovery; the audit substrate does trust. And every click on every chart shows you the evidence."*

## The click-to-retrieve pattern (cross-cutting)

Six surfaces share a unified drill-down pattern. The /retrieve call is parameterized by the chart's semantic anchor and the user's click target:

| Chart | Query (semantic anchor) | Filter |
|---|---|---|
| Spectrum | active axis's pole anchor (long pole description) | entry_number = clicked dot |
| Concept lenses | strongest axis's pole anchor (largest \|position\|) | entry_number = clicked dot |
| Interview map | interview's primary topic (broadest Atlas-derived topic) | entry_number = clicked dot |
| Themes | cluster's starter_query (LLM-named) | dedupe by entry (themes span voices) |
| Network | clicked node's name | dedupe by entry, exclude self (for in-corpus nodes) |
| Tours | tour title (editorial framing) | entry_number = stop's interview |

Every drill-down renders the same `CitationCard` component, so the citation grammar is identical across surfaces: passage preview → entry # → audit-tier badge → timestamp → LoC catalog link → similarity/rerank score. A stakeholder seeing this in five different contexts learns the citation format once and recognizes it everywhere.

## The 11 surfaces in detail

### 1. Semantic search (`#search`)

What it does: live query → Voyage embedding → Pinecone hybrid search → Voyage rerank-2 → top-N passages with citation metadata.

What it demonstrates: the base case. RAG retrieval as a tool. *Without a chatbot,* the user types a question and gets passages, not synthesized answers, not hallucinated paraphrases.

Demo queries (verified to return strong matches):
- `nonviolence as theology` → Joseph Echols Lowery at 0.75 similarity
- `philosophy of nonviolence` → Thomas Walter Gaither at 0.75
- `religious foundations of the movement` → C. T. Vivian at 0.68
- `the role of women in SNCC` → Dr. Doris Derby at 0.84

### 2. Quote-finder (`#quote`)

What it does: paste a half-remembered paraphrase, get the primary-source passage.

What it demonstrates: research utility. The embedding handles semantic kinship well enough that a paraphrase ("the dreamer can be killed but not the dream") retrieves the actual quoted moment with full citation.

### 3. Polyphonic events, RETIRED 2026-05-27

The 8-event timeline was removed from the live surface. Quote from
Eric: "There already is a timeline; just removing it." The homepage
Timeline (Home.jsx) carries the canonical movement chronology built
by the WWU team over two years.

The component code (`PolyphonicEvents.jsx`, `EventsTimeline.jsx`)
and the precomputed data files (`public/rag/summaries/events/`) are
retained in the repo for possible flip-back; nothing in the user-
facing nav references them.

### 4. Spectrum (`#spectrum`, but redirects to `#lenses`, Spectrum renders above the tab nav)

What it does: 5 conceptual axes defined by pole-pair descriptions. Each interview's centroid is projected onto each axis vector, giving a 1D position per interviewee per axis. Now floats at the top of `/rag-explore` (always visible, not a tab). Pills directly under the chart switch which axis is active; explanation paragraph below.

**Click any dot to drill into the passages that anchor that voice at that position.** This is the page's most pedagogically distinctive interaction, the user sees the embedding space's verdict on a voice, then sees the actual quotes that justify that verdict.

What it demonstrates: **"the embedding space takes a position, and the retrieval shows you why."** A 1024-dimensional space has opinions, and we can ask it questions about its opinions, then drill into the evidence behind each answer.

Axes:
- Nonviolence as theology ↔ Armed self-defense
- Sacred framing ↔ Secular framing
- Tactical pragmatism ↔ Strategic vision
- Northern struggle ↔ Southern struggle
- Individual conscience ↔ Collective discipline

Data: `public/rag/summaries/ideological_spectrums.json`. Math: `axis_vector = normalize(embed(pole_A) - embed(pole_B))`; position = `dot(centroid, axis_vector)`. Drill-down: `/retrieve` with `query = pole.anchor`, `filter = { entry_number: $eq: clicked_dot }`.

### 4b. Concept Lenses ★ (`#lenses`), the default tab below the nav

What it does: 4 small scatters of the same 136 voices, each one a different pair of named concept axes (so each chart's x/y both have human-readable meaning, unlike UMAP). Hover any dot in any chart and the same interviewee lights up in the other three at different coordinates. Click to lock; below the grid, the interviewee's full 5-axis profile renders as horizontal bars + a drill-down panel.

What it demonstrates: **the multi-lens revelation.** Nomic Atlas and every other embedding viewer shows ONE projection per dataset. Concept Lenses shows four projections of the same data and lets the user watch a voice move as the question changes. The structure IS the lesson.

This is the thing the conference is pitched on that nobody else builds.

Data: `public/rag/summaries/ideological_spectrums.json` (the same file as Spectrum). Drill-down: `/retrieve` with `query = strongest_axis.pole.anchor` (auto-picked from the interviewee's 5 positions; whichever has the largest |position|), `filter = { entry_number: $eq: clicked_dot }`.

### 5. Interview map (`#map`), replaces the old Constellation tab

What it does: 2D UMAP projection of all 136 interview centroids (aggregated from the 15,464 passage-level Atlas projection). Names are labeled directly on the chart (no hover-treasure-hunt). Search box filters to one or more interviewees. Empirically-derived axis labels at each pole, the dominant Atlas topic of the top-15 interviewees at each end of each axis ("← Black Panther Movement ... Religion →" reads off the actual data).

What it demonstrates: the corpus's shape at interview-scale. Same UMAP coordinate space as the now-retired Passage map, just aggregated.

Click any dot to drill into the interviewee's passages most aligned with their primary topic.

Data: `public/rag/atlas_projection.json` (the durable Atlas-derived JSON, see `rag/ATLAS_PROVENANCE.md`).

### 6. Semantic Overlap (`#related`), renamed from "Voices in conversation"

What it does: for any interview, pre-compute its top-16 thematic neighbors (was 8; bumped to 16 on 2026-05-27 because the section felt like a carousel). The radial graph at the top renders the top 8 as numbered spokes around the focal interviewee; the list below extends to all 16 with passage-overlap counts.

What it demonstrates: the research-tool framing. *The embeddings discover connections speakers never knew about each other.*

Data: `public/rag/related/entry-N.json` (pre-computed, 136 entries × top-16 neighbors). Updated 2026-05-27 after bumping the precompute slice from 8 to 16.

### 7. Themes (`#themes`)

What it does: k-means partition (k=30) of 136 centroids into thematic clusters. Each cluster has an LLM-generated name + 2-sentence description + a starter query. Two views toggleable: "Map" (bubble chart of clusters positioned at their centroid in the same 2D embedding space as the Constellation/Interview map; bubble color = dominant audit tier, bubble size = member count) and "List" (vertical accordion of all 30).

Click any cluster to expand: the cluster's starter query is now run against `/retrieve` inline, surfacing the top 5 passages across the corpus most aligned with that theme (deduped to one passage per interviewee for polyphonic record).

What it demonstrates: emergent thematic structure. *The clusters weren't designed by anyone; they fell out of the geometry.* And the drill-down shows what each theme contains in the speakers' own words.

Data: `public/rag/summaries/clusters.json` (named) + `clusters_raw.json` (math output). Drill-down: `/retrieve` with `query = cluster.starter_query`, `dedupeByEntry: true`.

### 8. Famous names (`#names`)

What it does: 15 iconic figures NOT in the 136-interview corpus (Ella Baker, Bayard Rustin, Bob Moses, James Forman, Diane Nash, Fannie Lou Hamer, etc.). For each, pre-computed retrieval surfaces the passages where in-corpus interviewees discuss them.

What it demonstrates: the secondhand-as-primary-source pattern. The corpus's coverage extends beyond its 136 named speakers through the network of who-knew-whom. Even though Ella Baker isn't interviewed here, 8 different interviewees describe her.

Data: `public/rag/summaries/famous_external.json`.

### 9. Geographic atlas (`#atlas`)

What it does: 12 movement geographies (Mississippi Delta, Selma, Birmingham, Atlanta, Nashville, Memphis, Oakland, etc.). Each anchor surfaces pre-computed retrieved passages from interviewees discussing that location.

What it demonstrates: the spatial dimension. Browsing the corpus geographically rather than thematically.

Data: `public/rag/summaries/geography.json`.

### 10. Influence network (`#network`)

What it does: directed graph of who-discussed-whom across the corpus + the 15 external figures. d3-force layout (drag nodes to reposition, scroll to zoom, double-click to unpin). Built by full-name string matching with conservative-precision filtering.

Click any node, in-corpus interviewee or external figure, to surface the top passages mentioning them. For in-corpus nodes, the drill-down excludes the person's own testimony (we want what OTHERS said about them, not their own self-account). For external figures, the drill-down surfaces the secondhand-as-primary-source pattern in action.

What it demonstrates: the network of mutual reference. Sherrod is the most-discussed in-corpus voice (24 mentions); Ella Baker tops the external list (8 mentions); the embedding-surfaced retrieval is corroborated by literal lexical co-occurrence.

Data: `public/rag/summaries/influence.json` (123 in-corpus edges + 91 external edges across 151 nodes). Drill-down: `/retrieve` with `query = node.name`, `dedupeByEntry: true`, client-side filter to exclude focal entry for in-corpus nodes.

### 11. Curated tours (`#tours`)

What it does: 10 pre-written narrative paths through the corpus, each 6–10 stops organized around a theme. Editorial; not auto-generated per query. Each tour also renders as a numbered arc on the Interview map (UMAP space), so visitors see "where this tour walks through the corpus."

Each stop is expandable: clicking it opens an inline drill-down with 3 passages from THAT interview most aligned with the TOUR'S title. The Wyatt Tee Walker stop on the "theological foundations of nonviolence" tour shows Walker's most-theological passages, the specific quotes that justify his presence in the tour's narrative arc.

Tours:
- The theological foundations of nonviolence
- Mississippi voter registration, 1962–65
- Women shaping SNCC
- The Black Power turn
- Highlander Folk School and its alumni
- Witnesses to the Emmett Till case
- The legal infrastructure
- The Black church as movement infrastructure
- Western and Southwestern voices
- Children of the movement

What it demonstrates: the museum-curator framing. AI did discovery; humans did curation. The combination produces a publication-grade path through the archive.

Data: `public/rag/summaries/tours.json`.

### 12. Quote of the day (`#quote-of-day`)

What it does: rotates one quote per day from a curated set of 30 (drawn only from low/medium/high audit-tier interviews). Click "Next →" to cycle through.

What it demonstrates: editorial daily content with zero infrastructure cost. Pre-curated; no LLM call per request.

Data: `public/rag/summaries/quotes.json`.

## Architecture summary

Pre-computed at build time:
- 136 capsules (Opus-4.7 via Claude Code subagents)
- 30 cluster names + descriptions (Opus-4.7)
- 30-cluster k-means partition + per-entry top-5 neighbors (pure math)
- 8 polyphonic event pages (Pinecone retrieval, 1 query/event)
- 15 famous-name panels (Pinecone retrieval, 1 query/name)
- 12 geographic atlas anchors (Pinecone retrieval, 1 query/anchor)
- 5 concept axes (Voyage embedding of pole anchors, projection math)
- Influence network (string-matching + retrieval-corroboration)
- 10 curated tours (Opus-4.7 editorial)
- 30 quote-of-the-day candidates (Opus-4.7 curation)

Live at request time (bounded cost):
- Semantic search → /retrieve Netlify Function → Pinecone + Voyage rerank-2
- Quote-finder → same /retrieve endpoint, different UI shape

Static at request time (zero cost):
- All 11 pre-computed surfaces. Just JSON fetched from `/rag/summaries/*.json`.

The single chatbot-adjacent surface that DOES NOT EXIST: there is no `/chat` endpoint, no `/ask`, no `/synthesize`. Every UI surface either pre-renders or makes a bounded retrieval call. The cost ceiling per user-day is functionally zero (Pinecone serverless reads + Voyage embedding/rerank at retrieval-time only; the precompute LLM cost is one-time and was paid via Claude Code subagents under Eric's Claude Max 20x subscription).

## Substrate

- **Pinecone Builder** (separate `civil-rights-history` project, NOT co-mingled with worldthought), index `civil-rights`, 1024-dim, cosine, AWS us-east-1, 15,464 vectors.
- **Voyage AI**, `voyage-3` (1024-dim) for embeddings, `rerank-2` for cross-encoder reranking.
- **Netlify Function** at `/retrieve` for the bounded-live retrieval surfaces.
- **Anthropic API** (Opus-4.7), used at PRECOMPUTE time only (capsules, cluster names, tours, quotes). Never invoked per user request. A fallback `rag/summarize.mjs` script exists for post-handoff regeneration; otherwise, regeneration happens via Claude Code subagents under subscription.

## Data files in `public/rag/summaries/`

```
_entry_list.json              136 entries × {entry_number, entry_subject, dir, txt, loc_url, tier, provenance}
_batches/                     subagent assignment files (internal, gitignored not gitignored, present for traceability)
capsules.json                 136 entries × 3-sentence biographical capsule
capsules_batch_<1-7>.json     subagent intermediate outputs
clusters.json                 30 k-means clusters × {name, description, starter_query, members}
clusters_raw.json             same k-means math, no names
neighbors.json                136 entries × top-5 thematic neighbors
events/_index.json            8 events × {slug, title, date, blurb, voice_count}
events/<slug>.json            per-event: blurb + 8 retrieved passages
famous_external.json          15 external figures × passages
geography.json                12 anchors × passages
ideological_spectrums.json             5 axes × {pole_a, pole_b, raw_range, 136 positions}
influence.json                151 nodes + 214 edges
tours.json                    10 tours × {title, subtitle, body, path[], closing}
quotes.json                   30 quotes × {entry_subject, quote, context, loc_item_url}
```

## Regeneration runbook (post-handoff)

When new material is added to the corpus, the surfaces that need regeneration:

| Surface | Trigger | Command |
|---|---|---|
| Capsules | New entry added | Via subagent (preferred): rerun the capsule subagent prompt for the new entry. Via fallback: `node --env-file=rag/.env.local rag/summarize.mjs capsules --entries=N` |
| Cluster names | Centroids changed | After re-running `python rag/precompute_clusters_neighbors.py`: re-run cluster naming via subagent or `rag/summarize.mjs clusters` |
| Neighbors | Centroids changed | `python rag/precompute_clusters_neighbors.py` |
| Events / Famous / Geography | Pinecone index changed | `node --env-file=rag/.env.local rag/precompute_panels.mjs all` |
| Concept axes | Centroids changed | `node --env-file=rag/.env.local rag/precompute_concept_axes.mjs` |
| Influence | Transcripts or famous list changed | `python rag/precompute_influence.py` |
| Tours | Editorial decision | Subagent-curated; no automated path |
| Quotes | Editorial decision | Subagent-curated; no automated path |

All scripts are idempotent and safe to re-run.

## Known limitations

- **Pinecone vector metadata still carries pre-Pass-9 tier values** (the audit-substrate update from earlier today). The next idempotent `rag/ingest.mjs` run will refresh them. Until then, tier badges in the live retrieval surfaces reflect Pass 8 tiers; static surfaces (capsules, neighbors, axes) consume the Pass 9 manifests directly.
- **Influence network uses conservative full-name string matching**, it will undercount any reference using just a last name or honorific+last. Reading "Mr. Sherrod" doesn't add a Sherrod mention to the count. This is intentional: false positives (matching common-word surnames like "Young", "Long", "Head", "King") were far worse than under-counting.
- **The `not-auditable` and `publication-block` entries are still in Pinecone**, meaning they can appear in retrieval results. Each tier badge transparently surfaces the substrate uncertainty, but a future filter setting could restrict the search surface to `low`+`medium`+`high` tiers if a stakeholder requests publication-only retrieval.
- **No mobile-optimized layout for the concept-spectrum SVG.** The 880×380 SVG scrolls horizontally on small screens but doesn't restructure. Acceptable for the conference demo (desktop projector); a future mobile pass would compress.

## What to read for deeper context

- **Pre-presentation:** this file (you're here), plus `rag/DEMO_SCRIPT.md` for the original three-query stakeholder pitch.
- **For substrate understanding:** `rag/CONFERENCE_PREP.md` (the philosophy-of-embedding framing), `transcripts/AUDIT_LIMITATIONS.md` (why some entries carry residual uncertainty).
- **For operations:** `rag/OPERATIONS.md` (key-rotation procedures, day-of-conference monitoring), `rag/ENDPOINTS.md` (live URLs + env vars).
- **For architecture:** `rag/INTERACTIVE_FEATURES_DESIGN.md` (the design behind the substrate), `rag/README.md` (component-level).

## Eric's standing constraints reflected in this build

These shaped what got built and what was deliberately not built:

- **No chatbot.** No `/chat`, no `/ask`, no LLM-in-the-loop per user request. Every UI surface either pre-renders or makes a bounded retrieval call.
- **Smithsonian-grade citation rigor.** Every retrieved passage carries entry number, LoC catalog URL, timestamp deep-link, audit-tier badge, and fidelity note. Researchers can copy a Chicago citation directly from the card.
- **Audit substrate is first-class.** Tier badges are visible everywhere, not hidden behind a "details" toggle.
- **Cross-corpus interlinking with worldthought.com is intentionally NOT done.** Civil-rights and worldthought are in separate Pinecone projects under the same Builder organization, and any editorial bridging will be a human-curated decision Eric makes with Dustin, not an automated cosine-similarity surface that would feel like Eric colonized another project.
