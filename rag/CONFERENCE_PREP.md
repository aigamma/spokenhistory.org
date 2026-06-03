# RAG layer, London conference prep

Status: **2026-06-01**, corpus at 140 interviews (entry IDs 1-142, gaps
at 31 and 95; authoritative count in `public/rag/toc.json`), RAG
application layer complete and deployed (chunker, embedder, ingest
pipeline, retrieval). The Pinecone index is provisioned and ingested;
the site is live in production at spokenhistory.org and staging at
civil-rights-staging.netlify.app.

The WWU team is presenting at a London conference next month. The
presentation hinges on **"relationships between philosophy and
embedding"**, i.e., what an embedding model "thinks" two oral-history
passages have in common, and how that surfaces meaningful philosophical
threads across a 600-hour archive of civil-rights leaders' testimony.

This doc is the brief for that work: what's in the corpus, how the
embeddings represent it, what queries the presentation will exercise,
and what's still left to wire up.

## What's in the corpus (the substrate the embeddings will represent)

The corpus now totals **140 interviews** (authoritative count in
`public/rag/toc.json`). They split by provenance:

| Provenance | Audit coverage | Notes |
|---|---|---|
| `audit-original` (the original 127 audit-able transcripts) | Pass 1–8 cleaned (Whisper → human → LoC canonical-archive cross-reference) | These went through the full Smithsonian-grade audit cascade. Each carries an `inferential_uncertainty.score` in the manifest (range observed: 0.0–0.51, most cluster `low` 0.3–0.5). |
| `ingestion-only` (the remaining entries, brought in via streamlined ingestion) | Pass 8 LoC-healing only | Some were originally `SKIPPED_ENTRIES` (multi-speaker joint interviews that Whisper-empty'd); others are entirely new. All carry `inferential_uncertainty.confidence_tier = 'ingestion-only'` so retrieval can hedge accordingly. |

The user-facing `/rag-explore` UI collapses the five underlying tier
values into two settled states, "LoC-Verified" (137) and "Audio-Limited"
(3), summing to the 140-interview total.

Every entry has the same on-disk shape:
`transcripts/corrected/<dir>/{.srt, .txt, .vtt, manifest.json}`.
The chunker handles all three transcript file formats identically, time-aware
60-second / 1400-char chunks for `.srt`/`.vtt`, paragraph-aware 1100-char
chunks for `.txt`.

## How the embeddings represent it (the philosophy-of-embedding angle)

Voyage-3 (1024-dim) is the embedding model. The choice matters
substantively for the "philosophy of embedding" angle:

- **Voyage-3 was trained on retrieval-augmented-generation use cases.**
  It's not a generic sentence-similarity model, it's tuned to find
  passages that *answer* a question. When a presenter asks "what does
  the corpus say about the relationship between nonviolence and
  self-defense?", the model is looking for passages that *speak to* that
  tension, not just passages that mention both phrases.
- **The 1024 dimensions encode latent thematic structure.** When two
  passages from entirely different interviews land close in the
  embedding space, the cosine similarity is reading a thematic kinship
  the speakers may never have realized they shared. This is the
  philosophical move the conference is exercising: the embedding is a
  proxy for "what these voices are saying together, even if they never
  met."
- **Provenance + uncertainty are first-class metadata.** Every chunk
  carries `entry_provenance` (`audit-original` vs `ingestion-only`) and
  `inferential_uncertainty_score` (0.0–~0.5). An answer drawn from a
  `low`-tier audit-original chunk is more defensible than one drawn
  from an `ingestion-only` chunk; the retrieval layer can filter or
  weight accordingly.
- **LoC canonical-archive citation is also first-class.** Every chunk
  carries `loc_item_url`, the Library of Congress catalog URL for
  the entry. An answer that quotes a passage can deep-link the LoC
  archive item so the audience can verify the source.

The "relationships between philosophy and embedding" the presentation
points at is not abstract: it's the concrete experience of asking the
corpus a question and watching it surface passages from interviewees
who never knew of each other but whose words rhyme in the latent space.

## What queries the presentation will exercise (representative)

A non-exhaustive list of the kinds of questions retrieval should handle
well:

1. **Cross-interview philosophical threads.**
   *"What do these interviews collectively say about the relationship
   between Christian theology and the practice of nonviolence?"*
   Retrieval should return passages from King-circle SCLC leaders,
   from Highlander-trained organizers, and from independent Black
   churches, different vocabularies, same philosophical territory.

2. **Generational continuity / discontinuity.**
   *"How do interviewees who came up after 1965 describe their
   relationship to the older SCLC leaders' nonviolence tradition?"*
   Retrieval should surface passages that wrestle with the
   tradition (Stokely's "Black Power" turn, Panther-side critiques,
   Mississippi vs. Northern strategic differences).

3. **Concrete-event grounding.**
   *"What did interviewees on the ground in Selma describe seeing
   on the bridge?"*
   Retrieval should hit time-anchored passages (the `timestamp_start_seconds`
   metadata makes this deep-linkable) from multiple witnesses, surfacing
   the polyphonic record of the event.

4. **Philosophical anchors.**
   *"Who in this corpus engages most directly with Gandhi's ideas?"*
   Retrieval should surface explicit Gandhi citations and also the
   less-obvious ones (a passage that *enacts* Gandhian thought without
   naming Gandhi). The ground-truth corpus (`civil_rights_facts.json`,
   378 entries, 396 aliases) is also ingestable as
   `chunk_type: ground_truth_fact` so a query can hit either oral history
   *or* canonical facts.

5. **Uncertainty-aware questions.**
   *"What do interviewees say about the 1955 Emmett Till case, and how
   confident are we in the transcript fidelity for those passages?"*
   Retrieval returns passages with their `inferential_uncertainty_tier`,
   letting the UI distinguish "Pass 1–8 audited" passages from
   "ingestion-only" passages.

## Verified philosophy-pattern queries (2026-05-26 live)

The five queries below are good Plan-B demos for the London talk -
they exercise the philosophical-framing angle (vs. the event-grounded
queries above) and all return strong matches against the live `/retrieve`:

| Query | Top match | Similarity |
|---|---|---|
| `the role of women in SNCC` | Dr. Doris Derby | 0.84 |
| `Christian ethics in civil rights` | Linda Fuller Degelmann | 0.76 |
| `philosophy of nonviolence` | Thomas Walter Gaither | 0.75 |
| `what made the movement possible` | Ruby Sales | 0.70 |
| `religious foundations of the movement` | C. T. Vivian | 0.68 |

The Derby + Vivian results are particularly nice for the conference -
both are speakers the London audience may not know about (Derby a
SNCC photographer; Vivian an ordained minister + SCLC executive). The
embeddings surface them on the right philosophical-framing queries
without anyone needing to know their names in advance.

### Bonus pattern: queries by famous-name-not-in-corpus

Several iconic civil rights figures don't have their own interview in
this 140-interview corpus (Bayard Rustin, Ella Baker, Diane Nash, James
Forman, Bob Moses), but they're discussed extensively by interviewees
who knew them. Several of them now have their own per-person reference
page under `public/rag/people/` as external "Historic Figures". Querying
their names directly surfaces the
interviewees who spoke about them, a powerful demo of secondhand
oral history as primary source:

| Query (name) | Top match (interviewee who discussed them) | Similarity |
|---|---|---|
| `Ella Baker` | Joseph Echols Lowery (SCLC) | 0.82 |
| `Diane Nash` | James Oscar Jones | 0.82 |
| `Bob Moses` | Thomas Walter Gaither (CORE/SNCC) | 0.81 |
| `James Forman` | Reginald Robinson (SNCC) | 0.80 |
| `Bayard Rustin` | Phil Hutchings | 0.77 |

This is the conference's "philosophy of embedding" thesis at its
clearest: the audience can ask about ANY civil-rights figure (in or
out of corpus) and the embeddings surface someone who knew them,
with citation-grade attribution. The corpus's coverage extends
beyond its named interviewees through the network of who-knew-whom, and
the per-person pages (202 total: 165 interviewees + 37 external Historic
Figures) make that network browsable.

## What's done, and what's still open

**Done:** the Pinecone civil-rights index is provisioned and ingested,
`rag/.env.local` holds the credentials, and the index is live behind
`/retrieve` and `/rag-explore`. The notes below document the re-run path
and the genuinely open items.

1. **Pinecone civil-rights project** (provisioned; one-time admin action
   in the Pinecone console, see "Setup steps (one-time)" in the main
   README). Builder tier supports multiple projects under one
   organization; civil-rights and worldthought.com share the
   `eric@aigamma.com` org. The civil-rights index currently cohabits the
   worldthought project as a provisional shortcut; migration to a
   separate `civil-rights-prod` project is documented in `rag/.env.local`.

2. **`rag/.env.local`** holds `PINECONE_API_KEY`, `PINECONE_HOST`
   (project-specific, generated when the index is created), and
   `VOYAGE_API_KEY` (shared with worldthought.com). A template is at
   `rag/.env.example`.

3. **Ingest** via `node --env-file=rag/.env.local rag/ingest.mjs`.
   Roughly 45–75 minutes wall-clock for the full corpus (≈16K
   `.srt`-anchored chunks, `.srt`-only after the prune that dropped
   `.txt`/`.vtt` duplicates; verify the exact current count against
   Pinecone). Idempotent on content hash, so re-runs after corrections
   only re-embed the changed chunks. Re-run after any re-chapterization
   or new-interview ingest so the index tracks the 140-interview corpus.

4. **Ground-truth corpus ingest** -
   `node --env-file=rag/.env.local rag/ingest.mjs --include-ground-truth`.
   Adds the `chunk_type: ground_truth_fact` vectors (378 entries, 396
   aliases) so queries can draw from canonical biography as well as oral
   history. Cheap (one shot).

5. **Person-page ingest** -
   `node --env-file=rag/.env.local rag/ingest.mjs --persons-only`. Pushes
   one vector per person page (`content_type='person'`, ~202). Idempotent
   on content hash; re-run after any person-page content edit.

6. **Retrieval evaluation** (open as a refresh task): run a small set of
   representative queries (the ones above) and inspect the top-N
   retrievals. The presentation is more credible with a few worked
   examples than with index statistics.

7. **Chat function** (open), downstream of this scaffolding. Wraps the
   `retrieve()` call in a Cloud Function that an LLM (Claude or GPT-4)
   can call as a tool. Not in scope for the RAG layer itself; will be
   added when the consumer UI/API surface is defined.

## Cost expectations through the conference

- **First ingest**: ~$2.10 in Voyage embedding (one-time)
- **Subsequent re-ingests** after small corrections: ~$0 (content-hash idempotent)
- **Pinecone Builder**: $20/mo flat (already paying, shared with worldthought.com)
- **Steady-state query embedding + rerank during the conference**: ~$3–5 in
  Voyage (depends on session traffic)

Total all-in: ~$25 for the month of the conference, with the marginal
cost of running an additional query well under a cent.
