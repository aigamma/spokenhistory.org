# RAG Showcase — Conference Presentation Brief

**Date:** 2026-05-26 (for the 2026-05-27 WWU team meeting and the London conference)
**Live demo URL:** https://civil-rights-staging.netlify.app/rag-explore (Email/Password gated: Eric admin + `wwu` / `civilrights` team-shared)
**Branch:** master at the most recent commit landing all 11 surfaces

## What this document is

A single brief explaining every RAG surface deployed for the conference presentation, what each demonstrates conceptually, and how to demo each in 30–90 seconds. Use this to plan the live walkthrough.

Eric's constraint to the project: showcase advanced RAG features **without a chatbot**, because the project leadership doesn't want uncapped tail-risk costs from open-ended generation. Every surface in this brief is either pre-computed (zero per-request cost) or bounded-live-retrieval (~$0.001 per query against the live Pinecone + Voyage pipeline). No LLM-in-the-loop per user request.

## The 11 surfaces (alphabetical by tab)

| # | Tab | URL | Cost shape | Demo time |
|---|---|---|---|---|
| 1 | Semantic search | `#search` | live retrieval (~$0.001/query) | 30 s |
| 2 | Quote-finder | `#quote` | live retrieval | 30 s |
| 3 | **Polyphonic events ★** | `#events` | pre-computed | 60–90 s |
| 4 | **Concept axes ★** | `#spectrum` | pre-computed | 60 s |
| 5 | Constellation (map) | `#map` | pre-computed | 30 s |
| 6 | Voices in conversation | `#related` | live retrieval | 30 s |
| 7 | Themes (k-means) | `#themes` | pre-computed | 30 s |
| 8 | Famous names | `#names` | pre-computed | 45 s |
| 9 | Geographic atlas | `#atlas` | pre-computed | 45 s |
| 10 | Influence network | `#network` | pre-computed | 30 s |
| 11 | Curated tours | `#tours` | pre-computed (editorial) | 60 s |
| 12 | Quote of the day | `#quote-of-day` | pre-computed (rotation) | 15 s |

★ = headline demos for the conference.

## Three-minute conference demo flow (suggested)

The presentation's thesis is **"relationships between philosophy and embedding"** — what the embedding space "thinks" two oral-history passages have in common, and how that surfaces meaningful philosophical threads across a 600-hour archive. The three-minute walkthrough:

**Minute 1 — "What does the embedding space think these voices have in common?"**
1. Open `/rag-explore` (already logged in). The header shows: `136 interviews · ~15K time-anchored passages · 6-tier audit substrate`.
2. Click the **Polyphonic events ★** tab. Click *Bloody Sunday — Edmund Pettus Bridge*.
3. *"This event was reported in newspapers. But what did the witnesses say?"* — six different voices appear side-by-side, each with a timestamp deep-link to the LoC audio. The pre-computed retrieval (no LLM, no chatbot) demonstrates the embedding's understanding viscerally.
4. Click *Emmett Till*. Different cohort, same pattern — Wheeler Parker Jr. (the last living witness) anchors the page; Simeon Wright, Julia Burns, and Newsome Jackson surround him.

**Minute 2 — "The embedding takes a position on conceptual continua."**
1. Click the **Concept axes ★** tab. Default view is "Nonviolence as theology ↔ Armed self-defense."
2. Each interviewee is a dot positioned along the axis by their centroid's projection onto the axis vector. *"Watch the embedding space take a position on where each voice sits."*
3. Hover the leftmost dots (Lowery, Vivian, Anderson — theological framing) and the rightmost (Elmer Dixon, Cleaver, Howard — BPP cohort). This is the math the conference is pitched on: a 1024-dimensional space has opinions, and we can ask it questions about its opinions.
4. Switch axes — *"Sacred ↔ Secular"*. Now Jack Greenberg and Robert L. Carter (legal infrastructure lawyers) shift dramatically; ordained ministers in the corpus shift the other way.

**Minute 3 — "The corpus extends beyond its 136 interviewees through the network of who-knew-whom."**
1. Click the **Famous names** tab. *"Ella Baker doesn't have an interview in this 136-entry corpus. Bayard Rustin doesn't either. But..."* — eight different speakers describe Ella Baker; seven describe Rustin; six describe Bob Moses.
2. Click *Bayard Rustin*. The voices that surface are not the ones the audience might predict — Phil Hutchings, Joseph Echols Lowery, others.
3. Closing line: *"This is the audit-graded substrate the Smithsonian and LoC are gating publication on. Every retrieval is citation-grade — timestamp, LoC URL, audit-tier badge. The embedding does discovery; the audit substrate does trust."*

## The 11 surfaces in detail

### 1. Semantic search (`#search`)

What it does: live query → Voyage embedding → Pinecone hybrid search → Voyage rerank-2 → top-N passages with citation metadata.

What it demonstrates: the base case. RAG retrieval as a tool. *Without a chatbot,* the user types a question and gets passages — not synthesized answers, not hallucinated paraphrases.

Demo queries (verified to return strong matches):
- `nonviolence as theology` → Joseph Echols Lowery at 0.75 similarity
- `philosophy of nonviolence` → Thomas Walter Gaither at 0.75
- `religious foundations of the movement` → C. T. Vivian at 0.68
- `the role of women in SNCC` → Dr. Doris Derby at 0.84

### 2. Quote-finder (`#quote`)

What it does: paste a half-remembered paraphrase, get the primary-source passage.

What it demonstrates: research utility. The embedding handles semantic kinship well enough that a paraphrase ("the dreamer can be killed but not the dream") retrieves the actual quoted moment with full citation.

### 3. Polyphonic events ★ (`#events`)

What it does: 8 canonical events pre-loaded; each surfaces 5–8 first-person accounts from different interviewees. Each passage carries a timestamp deep-link to the LoC audio.

What it demonstrates: the polyphonic-record-of-events thesis. *Wikipedia gives one consensus version of Bloody Sunday. The embedding surfaces 8 different voices' first-person accounts.* No chatbot needed — the retrieval IS the answer.

Events: Bloody Sunday (1965), Greensboro Sit-Ins (1960), March on Washington (1963), 16th Street Baptist bombing (1963), Freedom Summer (1964), MLK Assassination (1968), Voting Rights Act (1965), Emmett Till (1955).

Data: `public/rag/summaries/events/_index.json` + `events/<slug>.json` per event.

### 4. Concept axes ★ (`#spectrum`)

What it does: 5 conceptual axes defined by pole-pair descriptions. Each interview's centroid is projected onto each axis vector, giving a 1D position per interviewee per axis.

What it demonstrates: **"the embedding space takes a position."** This is the most philosophy-of-embedding-coded surface. The audience watches the embeddings sort 136 voices along continua they didn't curate by hand.

Axes:
- Nonviolence as theology ↔ Armed self-defense
- Sacred framing ↔ Secular framing
- Tactical pragmatism ↔ Strategic vision
- Southern struggle ↔ Northern struggle
- Individual conscience ↔ Collective discipline

Data: `public/rag/summaries/concept_axes.json`. Math: `axis_vector = normalize(embed(pole_A) - embed(pole_B))`; position = `dot(centroid, axis_vector)`.

### 5. Constellation / Embedding-space map (`#map`)

What it does: 2D PCA projection of all 136 interview centroids in 1024-dim space. Hover a dot to see whose voice lives there. Click a dot to switch to the Voices-in-conversation tab pre-populated to that entry.

What it demonstrates: the geometric intuition. *Two interviewees who never met but whose words land within 0.12 cosine of each other are nearby dots.*

Data: `public/rag/constellation.json`.

### 6. Voices in conversation (`#related`)

What it does: for any interview, pre-compute its top-5 thematic neighbors in the centroid space. Click an interview, see who else's voice rhymes with it.

What it demonstrates: the research-tool framing. *The embeddings discover connections speakers never knew about each other.*

Data: `public/rag/summaries/neighbors.json` (pre-computed, 136 entries × top-5 neighbors).

### 7. Themes (`#themes`)

What it does: k-means partition (k=30) of 136 centroids into thematic clusters. Each cluster has an LLM-generated name + 2-sentence description + a starter query.

What it demonstrates: emergent thematic structure. *The clusters weren't designed by anyone; they fell out of the geometry.*

Data: `public/rag/summaries/clusters.json` (named) + `clusters_raw.json` (math output).

### 8. Famous names (`#names`)

What it does: 15 iconic figures NOT in the 136-interview corpus (Ella Baker, Bayard Rustin, Bob Moses, James Forman, Diane Nash, Fannie Lou Hamer, etc.). For each, pre-computed retrieval surfaces the passages where in-corpus interviewees discuss them.

What it demonstrates: the secondhand-as-primary-source pattern. The corpus's coverage extends beyond its 136 named speakers through the network of who-knew-whom. Even though Ella Baker isn't interviewed here, 8 different interviewees describe her.

Data: `public/rag/summaries/famous_external.json`.

### 9. Geographic atlas (`#atlas`)

What it does: 12 movement geographies (Mississippi Delta, Selma, Birmingham, Atlanta, Nashville, Memphis, Oakland, etc.). Each anchor surfaces pre-computed retrieved passages from interviewees discussing that location.

What it demonstrates: the spatial dimension. Browsing the corpus geographically rather than thematically.

Data: `public/rag/summaries/geography.json`.

### 10. Influence network (`#network`)

What it does: directed graph of who-discussed-whom across the corpus + the 15 external figures. Built by full-name string matching with conservative-precision filtering.

What it demonstrates: the network of mutual reference. Sherrod is the most-discussed in-corpus voice (24 mentions); Ella Baker tops the external list (8 mentions); the embedding-surfaced retrieval is corroborated by literal lexical co-occurrence.

Data: `public/rag/summaries/influence.json` (123 in-corpus edges + 91 external edges across 151 nodes).

### 11. Curated tours (`#tours`)

What it does: 10 pre-written narrative paths through the corpus, each 6–10 stops organized around a theme. Editorial; not auto-generated per query.

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

- **Pinecone Builder** (separate `civil-rights-history` project, NOT co-mingled with worldthought) — index `civil-rights`, 1024-dim, cosine, AWS us-east-1, 15,464 vectors.
- **Voyage AI** — `voyage-3` (1024-dim) for embeddings, `rerank-2` for cross-encoder reranking.
- **Netlify Function** at `/retrieve` for the bounded-live retrieval surfaces.
- **Anthropic API** (Opus-4.7) — used at PRECOMPUTE time only (capsules, cluster names, tours, quotes). Never invoked per user request. A fallback `rag/summarize.mjs` script exists for post-handoff regeneration; otherwise, regeneration happens via Claude Code subagents under subscription.

## Data files in `public/rag/summaries/`

```
_entry_list.json              136 entries × {entry_number, entry_subject, dir, txt, loc_url, tier, provenance}
_batches/                     subagent assignment files (internal, gitignored not gitignored — present for traceability)
capsules.json                 136 entries × 3-sentence biographical capsule
capsules_batch_<1-7>.json     subagent intermediate outputs
clusters.json                 30 k-means clusters × {name, description, starter_query, members}
clusters_raw.json             same k-means math, no names
neighbors.json                136 entries × top-5 thematic neighbors
events/_index.json            8 events × {slug, title, date, blurb, voice_count}
events/<slug>.json            per-event: blurb + 8 retrieved passages
famous_external.json          15 external figures × passages
geography.json                12 anchors × passages
concept_axes.json             5 axes × {pole_a, pole_b, raw_range, 136 positions}
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
- **Influence network uses conservative full-name string matching** — it will undercount any reference using just a last name or honorific+last. Reading "Mr. Sherrod" doesn't add a Sherrod mention to the count. This is intentional: false positives (matching common-word surnames like "Young", "Long", "Head", "King") were far worse than under-counting.
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
- **Cross-corpus interlinking with worldthought.com is intentionally NOT done.** Civil-rights and worldthought are in separate Pinecone projects under the same Builder organization, and any editorial bridging will be a human-curated decision Eric makes with Dustin — not an automated cosine-similarity surface that would feel like Eric colonized another project.
