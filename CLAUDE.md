# Civil Rights History Project, Codebase Guide

Project context: an open-source AI system that transforms the Library of Congress Civil Rights History Project oral history archive (600+ hours of interviews, produced in collaboration with the Smithsonian NMAAHC) into structured, searchable metadata. The Smithsonian has been scrutinizing the team's AI-generated summaries for hallucinations -- the quality bar is "Smithsonian-grade publication," not "good enough for a research demo."

## Writing rules (apply to ALL generative output)

**Em dashes (`—`, U+2014) are strictly forbidden in any generative text on this project.** This applies to:

- All UI copy, headings, and JSX strings in `src/`.
- All comments and JSDoc blocks in source files.
- All AI-generated content in `public/rag/summaries/*.json` (tour titles, capsule bodies, theme labels, quote headlines, etc.).
- All Markdown documentation in `docs/`, `rag/`, `mcp-server/`, top-level `README.md` / `CLAUDE.md` / `lessons_learned.md` / `PRESENTATION_REFERENCE.md`, etc.
- All prompts shipped to OpenAI / Voyage / Anthropic models from the pipeline (`Metadata Generation System/processor/*.py`) and the MCP server (`mcp-server/server.mjs`).

Replace em dashes with the punctuation the sentence actually wants: comma, colon, semicolon, period, parentheses, or "and". Do not substitute en dashes (`–`, U+2013); en dashes are a different mark used for numeric ranges and are NOT under this prohibition. `scripts/strip_em_dashes.mjs` is the one-shot sweep that enforces this on the existing tree; rerun it after any large generation pass that may have introduced new em dashes.

Title headlines (page titles, tab labels, chart titles, section headings, tour titles, theme labels) use **Title Case**: capitalize nouns, verbs, adjectives, adverbs, and pronouns; lowercase articles (a/an/the), coordinating conjunctions (and, but, or, nor, for, yet, so), and prepositions of 3 letters or fewer (of, in, on, to, by, at, up, as). Always capitalize the first and last word of the title regardless. Hyphenated compounds capitalize both parts (Self-Defense, Co-Ops). Acronyms stay uppercase (SNCC, NAACP, MFDP).

## Pacing constraints

**Eric is on Claude Max 20x with consistent unused weekly headroom** and pre-paid overage credits that have never been touched. Do not throttle token usage, insert sleep gaps between iterations, or split independent work across wakeups to conserve prompt cache. Optimize for **wall-clock time and visible progress**, not tokens or cache hit rate.

**The 2026-05-27 WWU team meeting has passed; as of 2026-06-01 the next external milestone is the London conference (June 2026).** Pace work accordingly.

**Do not use `/loop` for backlog work.** `/loop` is for event-gated polling (CI runs, file watches, remote queues) or calendar cadences (daily, weekly). For "burn through N known independent items," spawn N parallel `Agent` subagents in a single message, wall-clock = slowest single subagent, not the sum. An 89-item transcript-audit backlog finishes in ~10 minutes via parallel subagents, not hours of 270s sleep pulses.

**For genuine multi-hour persistence** (overnight work, scheduled cleanups, work that must survive session close), use `/schedule` (cron in Anthropic's cloud). Eric's real reason for reaching toward `/loop` is continuity across his errands/sleep windows, not a preference for sleep pulses, `/schedule` is the right answer for that, not `/loop`.

**Do not ask for confirmation between batches of independent work.** Run to completion.

**Commit liberally and verbosely; push at every completion state.** Every iteration of work should produce a substantive, verbose commit message, that's how the rollback log stays useful and how a future reader (Eric, another agent, an institutional reviewer) reconstructs what changed and why. Push LESS often than you commit, because pushes trigger Netlify production builds that consume billing credits: batch the intermediate pushes during active work (roughly every 1-2 hours, or every 5-10 commits during an autonomous run). **But always push when you reach a milestone or a relative state of completion: a feature lands, a regression is fixed, a documentation or test sweep finishes, the assigned task is done.** Leaving completed work committed but unpushed is the specific failure that has repeatedly caused stale-file problems, the deployed tree and the local tree silently diverge and the next agent inherits a confusing half-state with no way to tell what is real. Do NOT hold a push just because the diff is "purely internal" (docs, refactor, tooling): if the work is at a stopping point, push it. The only thing you ever batch is mid-work intermediate state, never a finished sweep.

**Do not end a `/loop` turn early just to schedule the next wakeup.** `ScheduleWakeup` is a failsafe so the loop survives if the turn ends; it is NOT a checkpoint that signals the end. When more work is in front of you (more iterations to run, more pages to build, more verifications to perform), keep doing the work in the same turn. Stopping early costs wall-clock time (the gap before the next wakeup fires), burns a prompt-cache miss across the gap, and yields nothing in return. End a turn for real reasons only: a hard external blocker (CI you cannot fix, network failure, missing credential), context-length pressure with no compaction available, or a genuine natural stopping point (the assigned task is complete). This is a recurring failure pattern Eric has called out specifically; the rule lives here and in the user-global `~/.claude/CLAUDE.md` so it carries forward.

External rate limits (OpenAI, Firebase, Fly.io, GitHub, Netlify) still apply. This rule is about Anthropic-side conservatism only.

## Documentation as durable source of truth

Insights, rules, decisions, and discipline that future contributors (human or AI) need to know MUST land in the repository's documentation hierarchy, not just in session-local notes, agent private memory, or chat history. The hierarchy is `CLAUDE.md` (auto-loaded into every agent's context) → `STEERING_DOCS.md` (the one-page map of where to look for what) → tier-2 subsystem docs (`docs/*.md`, `rag/README.md`, `mcp-server/README.md`, `Metadata Generation System/Metadata Generation Documentation.md`, `public/rag/people/README.md`) → the per-pass audit governance docs at `transcripts/`.

If you discover a new constraint mid-session (a writing-style rule, a sourcing discipline, a feature-gate, a stakeholder preference about how copy reads, a "do this not that" pattern that surfaced through a correction), the work is not done until it's written somewhere a fresh agent would actually look. Private session memory and chat transcripts decay across sessions; the repository doesn't. The corollary: when a working rule conflicts with what's in the docs, fix the docs (or fix the rule, but make the alignment explicit in a commit). Working-tree state where the docs lie is a process failure, no different from code state that lies.

The principle applies to itself: this section was added to `CLAUDE.md` rather than living only in agent memory because the rule about durable docs is itself a durable insight.

## Current state (2026-06-01)

The site is built out and live. The 2026-05-27 WWU team meeting and the May overhaul are behind us; the next external milestone is the London conference (June 2026).

**Corpus: 140 interviews**, all re-chapterized into granular chapters grouped into "parts." Entry IDs span 1-142 (gaps at 31 and 95). Authoritative count: `public/rag/toc.json` (`count: 140`, `rechaptered_count: 140`).

**The per-interview page render path is static JSON, but Firestore is a populated backend, not the empty one earlier notes describe.** For rendering, the React app reads per-interview metadata from `public/rag/summaries/pipeline_output/entry_<N>.json` and the derived aggregates under `public/rag/` (`toc.json`, `playlist_index.json`, `related/`, `centroids.json`, `constellation.json`, `summaries/*.json`, `people/`, `curriculum/`). Separately, Firestore (project `civil-rights-history-project`, `nam7`, Email/Password auth: Eric admin + `wwu`/`civilrights` team-shared) was rebuilt from scratch (replacing the abandoned WWU/`llm-hyper-audio` project) and is a live, queryable database: beyond the auth gate and the `review_queue`, it backs the movement timeline (`timelineEvents`, read live by `src/components/visualization/TimelineVisualization.jsx`) and carries the interview-content and topic collections defined public-read in `firestore.rules` (`metadataV2` + `subSummaries`, `interviewIndex`, `events_and_topics`, `embeddings`/`clipEmbeddings`, `keywords`). The federated command-palette search (`src/components/CommandPalette.jsx` + `src/services/federatedSearch.js`) reads `timelineEvents` and `events_and_topics` live, and, once the Cloud Functions are deployed, the Firestore vector layer (`embeddings`/`clipEmbeddings` via the `vectorSearch` Cloud Function) as well. The earlier "Firestore is empty / backs only auth + review_queue" status is obsolete on both counts.

**Search is live.** Pinecone index `civil-rights` (Voyage `voyage-3`, 1024-dim, cosine) + `rerank-2`, fronted by `netlify/functions/retrieve.mjs`. It holds `.srt`-anchored passage vectors plus one vector per person page (`content_type='person'`, excluded from passage flows unless `include_persons` is set). The person-vector push is done.

**Deployed:** frontend to **spokenhistory.org** (production, Netlify, `master`) and `civil-rights-staging.netlify.app` (staging). **spokenhistory.org replaces robotlogic.org** as the production domain (cut over 2026-06-02).

**Repository (2026-06-02):** the project is now a standalone GitHub repo at **`aigamma/spokenhistory.org`**, which is the canonical `origin`. The prior `aigamma/civil-rights-history-project` is kept as the `civil-rights-old` remote; `jsovelove/civil-rights-history-project` remains as `upstream` for provenance only (the Dustin-authorized takeover means we are NOT opening a PR upstream). The user-facing name still reads "Civil Rights History Project" pending a deliberate rename (it collides with the Library of Congress's own program name). No Firebase change is required for the new domain: Authorized Domains only gates OAuth-redirect sign-in (Phone, Google, third-party) and email-link, NOT the plain Email/Password this app uses, so the admin login works on spokenhistory.org with no console action (confirmed empirically on 2026-06-02: robotlogic.org was never authorized yet logged in fine). Add `spokenhistory.org` under Authentication, Authorized Domains only if Google/Phone/passwordless sign-in is ever introduced. The `wwu`/`civilrights` team gate is a client-side bypass (no real Firebase user) and works on any origin regardless, see `src/contexts/AuthContext.jsx`.

**Still outstanding (ops, not code):**
- Deploy Cloud Functions to `civil-rights-history-project` (Blaze billing + `firebase functions:secrets:set OPENAI_API_KEY` + `firebase deploy --only functions`). The live search path does NOT depend on these; it runs through the Netlify function + Pinecone.
- Deploy the MCP server to Fly.io (`flyctl auth login` then `fly deploy` in `mcp-server/`). The server is rewired to Pinecone+Voyage and locally smoke-tested.
- (Obsolete) The earlier plan to open a PR to upstream `jsovelove/civil-rights-history-project` no longer applies: the project is now a standalone repo at `aigamma/spokenhistory.org` (Dustin-authorized takeover, 2026-06-02). `upstream` is retained only for provenance.

**Known data / integration gaps (see `transcripts/OPEN_PROBLEMS.md` + `transcripts/ingestion/ONBOARDING_REVIEW.md`):**
- **CLOSED 2026-06-01:** `public/rag/related/` now covers entries 1-142 (the 139-142 backfill ran 2026-06-01, and the same pass regenerated the corpus-global artifacts that were stale at entry 138: `centroids`/`constellation`, `ideological_spectrums`, `geography`/events/panels, `influence`, `capsules`, and a deterministic nearest-cluster assignment of 139-142 into `clusters`). The `network` stage now rebuilds `related/` for every new entry automatically, so this gap will not recur.
- **CLOSED 2026-06-01:** `transcripts/ingestion/onboard_interview.py` (the master onboarding pipeline) now rebuilds the full derived cross-link set in one command via a new `network` stage (stage 14, between `indexes` and `audit`): `related/` (per-entry), `centroids`/`constellation`, `ideological_spectrums`, `geography`/events/famous-external panels, `influence`, `event_network`, `clusters`, `capsules` (per-entry), and `people/index.json`, plus a deterministic rebuild of the gitignored `_entry_list.json` (new builder `scripts/build_entry_list.py`) that `influence` and `capsules` depend on. The corpus-global rebuilds default to running and are gated on `rag/.env.local` exactly like `ingest`; pass `--skip-networking` to opt out. Only `tours.json` and `quotes.json` remain a deliberate manual editorial pass (they are not scriptable); the status block prints a reminder. Entries 139-142 predated this stage and were backfilled by hand on 2026-06-01 (see the bullet above).

Data-build scripts (run from repo root after a corpus change): `scripts/build_toc.py`, `scripts/build_playlist_index.py`, `scripts/build_people_index.mjs`, `scripts/build_event_network.py`; plus the Pinecone-derived precompute in `rag/precompute.mjs`, `rag/precompute_concept_axes.mjs`, `rag/precompute_influence.py`, `rag/precompute_panels.mjs`, and `rag/summarize.mjs`.

## Architecture

Five subsystems, each in its own directory:

- **`src/`** -- React 18 + Vite frontend, drawer-only navigation (a single Menu button; items: Timeline, Interviews, Topics, People, Curriculum, Data Insights, About). Reads the static JSON under `public/rag/`. Key pages: Home (`/`, scroll-driven timeline), Interviews (`/table-of-contents`, the per-interview Table of Contents with parts and chapters and click-to-play; it absorbed the retired card-grid Interview Index, which now redirects here), Static Playlist (`/playlist-builder`, time-anchored clips from `playlist_index.json`), Topic Glossary (`/topic-glossary`), People catalog and Person Pages (`/people` and `/person/:slug`, citation-bearing reference page per named individual, see `public/rag/people/README.md`), Curriculum (`/curriculum`, K-12 lesson generator), Data Insights / RAG Explore (`/rag-explore`, the embedding-substrate demos including the Ideological Spectrums), Machine Audit (`/machine-audit`, how the AI metadata is made and where uncertainty remains), Visualizations (`/visualizations`), Content Directory (`/content-directory`), About (`/about`), Review Queue (`/review-queue`, admin UI for the human-review gate), plus `/interview/:entryNumber`, `/interview-player`, `/clip-player`, and a proper 404.
- **`functions/`** -- Firebase Cloud Functions (Node.js). `generateEmbedding`, `vectorSearch`, `submitCannyFeedback`. The OpenAI key lives here, not in the client bundle.
- **`Metadata Generation System/`** -- Standalone Python/Flask 7-step pipeline (blocking → labeling → TOC → chapterization → summarization → tuning → engagement). This is the hallucination hot zone.
- **`mcp-server/`** -- Node MCP server exposing the archive via six tools: three primitives (`search_transcripts`, `get_transcript`, `list_leaders`) plus three research-pattern tools (`compare_perspectives`, `trace_evolution`, `source_for_claim`). The research patterns are also registered as MCP prompts for prompt-routing clients. Deployable to Fly.io.
- **`scripts/`** -- Admin and data-build scripts. The corpus-derived static artifacts are (re)built here: `build_toc.py` (toc.json), `build_playlist_index.py` (playlist_index.json), `build_people_index.mjs` (people/index.json), `build_event_network.py` (event_network.json), the re-chapterization tooling (`merge_rechapter.py`, `expand_chapters.py`, `add_parts.py`, `build_rechapter_map.py`), the person-page gates (`verify_person_snippets.py`, `audit_axis_labels.py`, `classify_people_pages.py`), `strip_em_dashes.mjs`, and `diag_corpus_state.py` (the corpus-state diagnostic). Legacy Firestore/Firebase migration and media scripts also live here. Do not delete without explicit confirmation; some are reference material.

### Civil Rights MCP usage in Codex Desktop

The canonical MCP surface is six tools and three prompts. Run `npm run smoke` from `mcp-server/` to verify the stdio server advertises all of them before debugging a client.

Primitive tools:
- `search_transcripts` - citation-grade semantic search across the archive. Use `dedupe_by_entry: true` when manually handling compare-perspectives-style requests.
- `get_transcript` - full ordered transcript for one `entry_number`.
- `list_leaders` - archive roster with entry numbers, LoC URLs, provenance, and audit tiers.

Research-pattern tools:
- `compare_perspectives({ topic })` - multiple interviewee voices on one topic, deduped by entry, with citation framing.
- `trace_evolution({ interviewee, topic })` - resolves the interviewee name, searches within that interview, and returns chronologically ordered passages.
- `source_for_claim({ claim })` - finds passages that support, complicate, or contradict a claim, preserving citation metadata.

The same three research patterns are also registered as MCP prompts for clients that route prompts. Codex Desktop and similar tool-only clients should call the research-pattern tools directly after restarting/reloading the MCP server. If an already-running client session still exposes only the primitive tools, fall back to the equivalent primitive workflow above rather than telling the user the pattern is unavailable.

## The Smithsonian-grade publication gate (new in May 2026 overhaul)

The original pipeline scored summaries at 80/80 accuracy/quality and kept the best-of-3 even if no attempt passed -- letting hallucinations through. The new gate:

1. **`processor/claude_scorer.py`** -- Independent Claude Opus 4.7 scorer that runs after the OpenAI tuning loop. Same rubric, separate model family (no blind-spot risk).
2. **`processor/citation_check.py`** -- Per-claim audit: every factual claim in the summary must map to a transcript passage that establishes it.
3. **`processor/review_queue.py`** -- Producer that enqueues failed-gate summaries into a Firestore `review_queue` collection. The React `src/pages/ReviewQueue.jsx` is the consumer.
4. **`processor/dual_scoring_helper.py`** -- Feature-flag dispatcher. `USE_DUAL_SCORING=1` env var routes through the dual path; default is bare OpenAI.
5. **`processor/tuning.py`** -- Original OpenAI scoring loop, now with type-coercion guards on model output and threaded `near_threshold_tolerance` / `min_improvement` parameters.

The publication threshold is 90/90 on BOTH scorers independently. Disagreement (one passes, one fails) routes to human review -- the gate fails closed rather than publishing on a coin flip.

## Ground-truth corpus

`Metadata Generation System/civil_rights_facts.json` -- 378 entries (396 aliases) covering Big Six leaders, SCLC inner circle, foundational pre-Movement intellectuals (Du Bois, Wells, Murray, Height), major events, legal precedents (Brown, Plessy, Loving), LBJ as federal-executive grounding, and the regional movement figures surfaced across the 140-interview corpus. `processor/shared.py::get_relevant_facts` consults this corpus to ground the LLM scorer's accuracy claims.

Validate with `python scripts/validate_facts.py` (runs in `Metadata Generation System/`).

## Audit documentation discipline (READ THIS IF YOU TOUCH THE TRANSCRIPT AUDIT)

The transcript-audit work has accumulated four core governance documents at `transcripts/`. Any agent doing work that affects the audit overlay, the per-entry corrections, the audit-progress tracking, or the open-problems queue MUST follow the discipline below. The documents are designed to be machine-parseable (downstream scorers + ensemble reviewers) and human-readable (project stakeholders + the Smithsonian/LoC institutional review).

### The four governance documents

| Document | Purpose | Update discipline |
|---|---|---|
| `transcripts/AUDIT_TRAIL.md` | Longitudinal effort log across sessions, agents, and models. Records WHAT was done, WHEN, BY WHOM, with WHAT COVERAGE. The data substrate for inferential error-rate scoring. | **Per-phase incremental updates, not session-end-only.** Every multi-step session creates a new `### Session N` entry near the top of the `## Session log` section. Each phase appends a sub-section as it completes (not when the whole session ends). Follow the "Session entry template" at the bottom of the file. |
| `transcripts/OPEN_PROBLEMS.md` | Active punch-list of what still needs doing. Numbered Problems (1, 2, 3, ...), never delete, only annotate as RESOLVED with a dated sub-section that preserves the original entry below. | Mark resolved Problems with `## Problem N, <title>, **RESOLVED YYYY-MM-DD (Phase/Session reference)**` followed by a `### Resolved YYYY-MM-DD <date qualifier>` sub-section, then a preserved-for-history sub-section. New problems get appended as `## Problem N+1` with current `**Last updated:** YYYY-MM-DD` at the top of the file. |
| `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` | The corrections overlay, per-entry Pass 1/2/3/4 tables with row IDs, Whisper renderings, canonical corrections, confidence tiers, source attribution. ~9.3 MB, ~26,000+ lines as of 2026-05-22. | **Non-destructive overlay**: `transcripts/raw/` files are NEVER modified. Corrections accumulate here. Per-entry tables use the row-ID convention `<entry>.<row>` for Pass 1, `<entry>.P2.<row>` for Pass 2, `<entry>.P3.<row>` for Pass 3, `<entry>.P4.<row>` for Pass 4, and `<target>.P2.RELOC[<source>.P2.<row>]` for cross-contamination relocations. Confidence tiers: `correct` / `high` / `medium` / `low` / `speaker-originating` / `flagged-for-adversarial-review` / `n/a`. |
| `Metadata Generation System/civil_rights_facts.json` | Ground-truth corpus (378 entries, 396 aliases as of 2026-06-01). Used by `processor/shared.py::get_relevant_facts` to ground the LLM scorer's accuracy claims. | **Additions only, no deletions of existing entries.** Validate after every edit with `cd "Metadata Generation System" && python scripts/validate_facts.py`. The validator catches schema regressions and alias collisions. |

### Per-phase update protocol for AUDIT_TRAIL.md

When a session has multiple phases:

1. **At session start:** add a new `### Session N, YYYY-MM-DD: <short label>` entry near the top of the `## Session log` section. Initialize with End-of-session summary placeholder, Agents, Wall-clock, Scope, Methodology fields. Add placeholder sub-section headers for each anticipated phase (`#### Phase 1`, `#### Phase 2`, etc.) with `*(populated when Phase N completes)*`.
2. **At each phase completion (before the phase's commit):** replace the placeholder with the real phase sub-section. Include: agents spawned (counts), wall-clock, files created/modified, coverage metrics, anomalies surfaced, handoff notes for the next phase.
3. **At session close:** populate the End-of-session summary at the top of the entry (one paragraph: what got done, next priority, blockers).
4. **The commit that lands phase N's code/data changes MUST also include the phase N sub-section update.** Atomicity matters, if the session terminates between phase completion and doc update, the docs lie.
5. **For follow-on work after the session is "closed":** append a sub-section to the existing Session N entry (e.g., `#### Phase 1a follow-on, cross-contamination cleanup (2026-05-22 evening)`). Do NOT create a new Session N+1 entry for follow-on work to the same session.

### Cross-session coordination

If two sessions are running in parallel (which has happened, Session 3 + Session 4 ran simultaneously on 2026-05-22), they each maintain their own session entry in AUDIT_TRAIL.md. Add a "Coordination note" in the late-arriving session's entry explaining what the parallel session was doing and where their work fits in the broader audit history.

### Inferential-scoring-framework hookup

`transcripts/AUDIT_TRAIL.md` has an "Inferential scoring framework" section that defines per-entry uncertainty scoring. The Per-entry coverage matrix is the structured input to that framework. Any agent that adds rows to the coverage matrix or modifies the Pass coverage flags (F/P/T/S/R/D/M) should preserve the structure so downstream scorer scripts can parse it.

## Pass 8: LoC canonical-archive cross-reference (2026-05-25)

**Pass 8 is the eighth audit pass and the FIRST one anchored to a primary external authority (the Library of Congress's own published transcripts) rather than internal review or ground-truth corpus matching.** It is the architectural endpoint of the audit cascade for the existing 127-entry corpus and the primary correction pipeline for NEW transcripts arriving after 2026-05-25 (see "Streamlined ingestion" below).

**Coverage:** 127 of 127 (100%) audit-able entries healed against LoC reference text. 92 entries via LoC's TEI2 XML transcripts; 35 entries via pypdf-extracted text from LoC's transcript PDFs (only fallback because XML wasn't published for those interviews). Zero genuinely audio-only entries, every interview in the LoC CRHP collection has at least a PDF transcript that we can text-extract.

**Workflow (per entry):**
1. **Resolve** the entry's interviewee to its LoC item URL via `transcripts/loc_healing/resolve_loc_items.py` (LoC `/search` API search by name) or `transcripts/loc_healing/resolve_pdf_fallback.py` (PDF fallback when XML isn't published) or `transcripts/loc_healing/resolve_by_item_url.py` (direct-resolve for catalog-spelling discrepancies like LoC "Newson" vs our "Newsom").
2. **Align** our Whisper-derived `.srt` against LoC's transcript text at the word level via `transcripts/loc_healing/heal_one_entry.py phase1`. Output: per-entry divergence list in `transcripts/loc_healing/divergences/<subject>.divergences.json`.
3. **Classify** each divergence under the conservative-first-pass discipline (deterministic verdicts only, no model call in the loop): contraction expansion / number↔word / function-word insert-delete / LoC bracketed stage-direction insert / hyphen-compound false-start / short-needle proper-noun phonetic substitution. Everything outside those clean buckets is `NEEDS_SME_REVIEW` and preserved verbatim.
4. **Apply** the `ASR_ERROR_HEAL` verdicts surgically, token-level replacements inside the existing SRT/VTT cue boundaries; no timestamp drift, no segment restructuring. The `.txt` is patched via in-place substring substitution preserving its original continuous-line format.
5. **Audit-canon safeguard** prevents auto-reversal of prior audit decisions: if `our_token` is already in the master MD's correction-table set for this entry, the heal is skipped and the case is flagged `UNCLEAR` for SME review. Verified to have prevented reversal of e.g. Aaron Dixon's audit-confirmed "Madison Valley" against LoC's "Harrison Valley".
6. **Stage file** written to `transcripts/pass8_stage/entry_<NNN>_<slug>.md` documenting every heal applied + every divergence preserved + every NEEDS_SME_REVIEW case. The per-entry institutional-audit artifact, parallel to `pass2_stage/` ... `pass7_stage/`.
7. **Master MD backport** via `transcripts/loc_healing/backport_pass8_to_master_md.py`, emits `<entry>.P8.X` correction-table rows that reproduce the heals when `scripts/apply_corrections.py` runs from `raw/` + master MD. Two-tier strategy: DIRECT rows for universal substitutions; CONTEXT-EXTENDED rows for position-specific heals (uses 2-9 surrounding words to make the phrase unique). Position-specific heals whose unique-context-extension fails stay in `corrected/` + `pass8_stage/` only (not in master MD).

**Linear LoC API access is mandatory.** No parallel subagents touching `loc.gov` or `tile.loc.gov`. The polite delay is 1.5s/request. LoC will throttle / ban aggressive scrapers. See `feedback_linear_loc_api` memory.

**The 710-row AUDIT_VS_LOC_DISAGREEMENTS report** (`transcripts/loc_healing/AUDIT_VS_LOC_DISAGREEMENTS.md`) catalogues every case where the audit-canon safeguard fired, i.e., where our audit-promoted spelling conflicts with LoC's authoritative text. SME-reviewable conflicts grouped by entry. The categories that show up: genuinely-different-people (Bertha vs Roberta), spelling variants (Carsie vs Carsey), style choices (Sam vs Samuel), and Whisper-error leakage into our own audit-canon (Joanne vs JoeAnn, our directory itself says JoeAnn but a prior audit row promoted Joanne).

## Streamlined ingestion for new transcripts (DEPRECATES Passes 1-7 for new entries)

`transcripts/ingestion/README.md` is the canonical onboarding doc. The seven-pass improvised journey on the original 127 entries was largely about discovering Whisper failure patterns and building the ground-truth substrate; that substrate now exists, so a new interview is corrected in ONE deterministic pass against the Library of Congress reference text and carried the rest of the way onto the live site by a single master pipeline.

**The single command** that onboards a new entry end-to-end:
```
python transcripts/ingestion/onboard_interview.py "<Subject>_interview_<YYYYMMDD>_<HHMMSS>"
```

`onboard_interview.py` is a master, idempotent, 15-stage pipeline (every stage checks for its own output and skips work already done, so it is safe to re-run): locate, bootstrap raw to corrected, resolve LoC item, LoC heal, assign entry_number, resolve LoC video, extract cue blocks, expand chapters, attach summary, assemble `entry_<N>.json`, ingest vectors to Pinecone, scaffold the person page, rebuild `toc.json` and `playlist_index.json`, append an AUDIT_TRAIL note, print status. It reuses `ingest_new_transcript.py` (the bootstrap and LoC-heal sub-step) rather than duplicating it.

**Two inputs are authored, not auto-generated.** The Smithsonian / LoC bar requires reviewable segmentation and a citation-bearing page, so the pipeline STOPS and tells you exactly what to write, then carries it the rest of the way on the next run: the granular, parts-grouped chapter spec at `scripts/spec_<N>.json` (stage 8) and the 2-3 paragraph summary at `transcripts/rechapter_staging/entry_<N>.summary.txt` (stage 9). The person page (stage 12) is scaffolded as a thin stub and needs a real bio, `ai_reading`, verbatim snippets, and sources per `public/rag/people/README.md`.

**The cleaning is deterministic, not guesswork.** The heal aligns our Whisper `.srt` word-for-word against LoC's authoritative transcript and applies ONLY the rule-classified `ASR_ERROR_HEAL` divergences (no model is called in the onboarding path); everything else is preserved verbatim or flagged `NEEDS_SME_REVIEW`. This is the deliberate replacement for the expensive, stochastic internal-guess passes that preceded LoC integration.

**Full networking is automated (closed 2026-06-01; see `transcripts/ingestion/ONBOARDING_REVIEW.md` gap A).** `onboard_interview.py` now rebuilds every derived cross-link artifact in one command via the `network` stage (stage 14): `related/` (per-entry), `centroids` / `constellation`, `ideological_spectrums`, `geography` / events / famous-external panels, `influence`, `event_network`, `clusters`, `capsules` (per-entry), and `people/index.json`. It first rebuilds the gitignored `_entry_list.json` (new deterministic builder `scripts/build_entry_list.py`) because `influence` and `capsules` read it. Dependency order is enforced (centroids before constellation; `precompute_concept_axes.mjs` before `add_concept_axes.mjs`; `_entry_list` before influence/capsules). The corpus-global rebuilds default to running and are gated on `rag/.env.local` exactly like `ingest`; `--skip-networking` opts out and the status block then prints the exact commands to finish later. **Only `tours.json` and `quotes.json` are still manual:** their regeneration is editorial (not scriptable), so the status block prints a reminder to run a Claude Code editorial subagent pass if the new interview should be considered for a guided Tour or the Quote rotation. Note: the `clusters` rebuild re-NAMES the existing k-means clusters; folding a new entry into the cluster STRUCTURE still needs the separate, not-yet-scripted k-means step that writes `clusters_raw.json`.

**Do NOT run Passes 1-7 on new transcripts.** That pipeline was designed before LoC integration existed. The Pass 8 architecture (LoC heal + conservative auto-apply + SME review of flagged divergences) catches the same Whisper-error class with much less hand-tuning. The legacy Pass 1-7 documentation in `transcripts/AUDIT_TRAIL.md` is historical record for the 127-entry corpus; it is not a template for new work.

**Format adapters** for non-Whisper input (PDF-only transcripts, plain text, WhisperX JSON) are documented in `transcripts/ingestion/README.md`, including the synthesized-timestamp fallback for text-only sources (which loses fine-grained playlist-clip precision; avoid unless audio is unavailable).

### Why this discipline matters

The Smithsonian (NMAAHC) and Library of Congress are gating publication on AI-hallucination-fact-check rigor. The audit overlay + AUDIT_TRAIL are the institutional credibility instrument. A future reviewer or replacement engineer must be able to read these documents and reconstruct exactly what was audited, by whom, with what coverage, and what residual error remains. Per-phase incremental updates prevent the docs from drifting out of sync with the actual state of the corpus.

### Recent example commits to follow as templates

- `e0a1dbf`, Session 3 Phase 5 finalization (aggregate metrics + end-of-session summary)
- `847f763`, Cross-contamination follow-on cleanup (sub-section added to existing Session 3 Phase 1a, not a new session entry)
- `e325d79`, Session 4 initial entry + Session 3 Phase 1 back-fill (cross-session coordination note example)
- `6a70838`, Layer 5 corpus-global fidelity sweep (4-dimension audit, advisory artifacts, Session 3 follow-on sub-section)
- *(post-Layer-5-deploy commit, this session)*, Layer 5 fidelity-deploy follow-on (770 phantom removals + 1,483 ensemble annotations + 7 normalizations; added as sub-section to existing Session 3 Layer 5 entry, not a new session)

## Documentation map

**For a one-page hierarchy view: see `STEERING_DOCS.md` at the project root.** It ranks every document by tier (Orientation / Active reference / Lessons learned / Demo prep / Provenance / Deprecated) with a "when to read what" cheat sheet. Read that first if you're new; the per-document breakdown below is the deep-dive supplement.

The project has ~20 human-facing markdown documents plus ~440 per-entry staging files. The staging files are machine-generated (Pass 2/3/4 supervisor outputs + per-entry slices), new agents should NOT read them as documentation; they're audit artifacts consumed by merge scripts. The human-facing documents are:

### Root-level

| File | Purpose |
|---|---|
| `STEERING_DOCS.md` | **One-page hierarchy view of every document on this project**, ranked by tier with a "when to read what" cheat sheet. The teaching aid for explaining the document set to a new contributor or stakeholder group. **Start here if you're new.** |
| `README.md` | Public-facing project overview for GitHub viewers (corpus description, what the system does). |
| `CLAUDE.md` (this file) | Project-wide conventions for AI-agent contributors. Auto-loaded into every agent's context. The deep-dive supplement to `STEERING_DOCS.md`. |
| `CONTRIBUTORS.md` | Human contributor credits. |
| `lessons_learned.md` | Conceptual + categorical analysis of the seven-pass audit cascade, the Whisper-error taxonomy we observed (phonetic confusion, ASR name-bleed, short-needle substitution corruption, audit-canon leakage), and the process-governance lessons (apply-step discipline, word-boundary safety, commit+push at every moderate milestone). Companion to PRESENTATION_REFERENCE.md. |
| `PRESENTATION_REFERENCE.md` | The conceptual-map briefing for the WWU presentation (and any external stakeholder summary). Eight conceptual breakthroughs from the audit work; the coverage table; the live RAG demo layer; implications for the user-facing product. Slide-friendly summary; less detail than lessons_learned.md. |

### `docs/`, architecture + decision records

| File | Purpose |
|---|---|
| `docs/ACCESSIBILITY.md` | WCAG 2.2 AA + mobile audit findings + accessibility-token reference (`text-civil-red-body`, focus-visible rule, prefers-reduced-motion handling) |
| `docs/DEPLOYMENT.md` | End-to-end deployment chain. Current data path: authored inputs + raw transcript, `onboard_interview.py`, static `entry_<N>.json` plus the derived `public/rag/` artifacts, served by Netlify; Pinecone for search; Firestore for auth and the review queue only; Cloud Functions and MCP server optional. |
| `docs/TRANSCRIPT_AUDIT_DESIGN.md` | Original architectural design for the three-stage audit cascade (exact/alias match → phonetic+edit-distance fuzzy → LLM disambiguation). Read this before adding new audit infrastructure. |
| `docs/WEAVIATE_INTEGRATION_DESIGN.md` | Original RAG-substrate design when the plan was Weaviate. **HISTORICAL**, the substrate decision pivoted to Pinecone Builder + Voyage AI on 2026-05-22. Kept for design-decision provenance. Current substrate documented in `docs/RAG_SUBSTRATE_DECISION.md` and `rag/README.md`. |
| `docs/RAG_SUBSTRATE_DECISION.md` | The decision record explaining why Pinecone Builder + Voyage AI was chosen over self-hosted Weaviate / Supabase pgvector. Covers alternatives considered, weighting criteria, what was explicitly deferred, and migration triggers that should re-open the decision. |

### `transcripts/`, audit governance documents + audit outputs

| File | Purpose |
|---|---|
| `transcripts/AUDIT_TRAIL.md` | Longitudinal effort log across sessions (see "Audit documentation discipline" above). Read for full audit history + inferential-scoring framework + per-entry coverage matrix. |
| `transcripts/OPEN_PROBLEMS.md` | Active punch-list of remaining cleanup work (see "Audit documentation discipline" above). Read to see what's still open vs RESOLVED. |
| `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` | The ~9.3 MB master correction overlay (see "Audit documentation discipline" above). Read sections by entry: `### N. Subject`. The catalog at the top (sections A–I + Phase 1b extensions J–P + Z catch-all) documents recurring Whisper-failure patterns. |
| `transcripts/cross_contamination_audit_summary.md` | Human-readable summary of the 2026-05-22 cross-contamination follow-on cleanup (catches Pass 3 + Pass 4 retraction signals beyond Phase 1a's original 22-item fix). Full data in `cross_contamination_audit.json`. |
| `transcripts/layer5_fidelity_audit_summary.md` *(may not exist yet, generated by Layer 5 sweep)* | Human-readable summary of the corpus-global fidelity sweep across phantom Whisper renderings, bidirectional canonical consistency, catalog-vs-per-entry contradictions, and cross-entry biographical consistency. Full data in `layer5_fidelity_audit.json`. |
| `transcripts/session_prompts/archive/*.md` | Archived session prompts from completed sessions (per the single-use-prompt convention, once a session executes a `NEXT_SESSION_PROMPT.md` they archive-and-delete it to prevent re-execution). Read for historical context on prior session scoping. |

### `transcripts/loc_healing/`, Pass 8 LoC canonical-archive cross-reference (2026-05-25)

| File | Purpose |
|---|---|
| `transcripts/loc_healing/heal_one_entry.py` | Per-entry heal toolkit. Modes: `phase1` (parse LoC source + corrected SRT, word-align via difflib, emit per-entry divergences JSON with deterministic verdicts inlined), `apply` (apply verdicts to .srt/.txt/.vtt within existing cue boundaries), `verify` (cue-count parity check between SRT and VTT), `heal_one` (combined pipeline). |
| `transcripts/loc_healing/resolve_loc_items.py` | LoC `/search` API resolver, finds the LoC item URL for each interviewee by name, downloads TEI2 XML transcript where published. Polite-delayed (1.5s/request). Output: per-entry resolution.json + cached XML in `loc_cache/`. |
| `transcripts/loc_healing/resolve_pdf_fallback.py` | PDF-fallback resolver for entries where LoC has no machine-readable XML (35 of the original 127). Downloads LoC's transcript PDF, runs `pypdf` text extraction, caches as `<subject>.pdf.txt`. |
| `transcripts/loc_healing/resolve_by_item_url.py` | Direct-resolve helper for catalog-spelling discrepancies (LoC "Newson" vs our "Newsom", "Wheeler Parker" without our "Jr.", etc.). Bypasses search-by-name; takes a known LoC item URL and resolves directly. |
| `transcripts/loc_healing/process_batch.py` | Sequential per-entry driver. Iterates `corrected/` alphabetically and runs `heal_one_entry.py heal_one` on each entry that has its LoC source cached. Linear by design, no concurrency. |
| `transcripts/loc_healing/backport_pass8_to_master_md.py` | Backport tool that inserts `<entry>.P8.X` correction-table rows into `CLEANED_TRANSCRIPTS_REVIEW.md`, so `scripts/apply_corrections.py` reproduces the Pass 8 heals from raw/ + master MD. Two-tier strategy (direct + context-extended). Idempotent. |
| `transcripts/loc_healing/loc_cache/` | Cached LoC content (one set per entry): `<subject>.xml` + `.resolution.json` for XML-source entries; `<subject>.pdf` + `.pdf.txt` + `.resolution.json` for PDF-source entries; `_index.json` aggregate coverage. |
| `transcripts/loc_healing/divergences/` | Per-entry divergence streams: `<subject>.divergences.json`, the raw alignment + deterministic-verdict output that both feeds `apply` and serves as the SME-review input. |
| `transcripts/loc_healing/COVERAGE_REPORT.md` | Pass 8 aggregate coverage report. 127/127 entries healed (92 via XML, 35 via PDF). Per-entry source kind, heal counts, and failure-mode breakdown. |
| `transcripts/loc_healing/AUDIT_VS_LOC_DISAGREEMENTS.md` | 710 SME-reviewable conflicts where Pass 8's audit-canon safeguard fired (our prior-pass-promoted spelling disagrees with LoC's authoritative text). Grouped by entry, sorted by per-entry disagreement count. Categories: genuinely-different-people, spelling variants, style choices, Whisper-error leakage into our own audit-canon. |

### `transcripts/pass8_stage/`, Pass 8 per-entry institutional-audit artifacts

127 files (one per entry that was healed) at `transcripts/pass8_stage/entry_<NNN>_<slug>.md`. Per-entry file documents: LoC item URL + match metadata; divergence counts (detected / healed / preserved-verbatim / flagged-for-SME-review); per-correction table (cue index + our token + LoC token + reasoning); preserved-verbatim table; SME-review-flagged table. Parallel to the existing `pass2_stage/` ... `pass7_stage/` naming convention.

### `transcripts/ingestion/`, Streamlined ingestion for new transcripts (DEPRECATES Pass 1-7)

| File | Purpose |
|---|---|
| `transcripts/ingestion/README.md` | The full new-transcript workflow documentation: TL;DR command, format adapters (WhisperX JSON / PDF-only / plain-text source), pre-ingest requirements, validation checklist, the "what if LoC doesn't have it" fallback. |
| `transcripts/ingestion/ingest_new_transcript.py` | The single-command ingestion script. Validate raw entry structure → bootstrap `corrected/<entry>/` → resolve LoC → heal_one → write stage file → append AUDIT_TRAIL ingestion note. One transcript per invocation; linear by design. Supports `--loc-item-url` override for catalog-spelling cases. |

### `public/rag/people/`, per-person reference pages catalog (2026-05-27 ongoing)

One JSON file per named individual on the site, loaded by the `/person/:slug` route's `PersonPage` component (`src/pages/PersonPage.jsx`). Two `person_type` values: interviewees (their own oral history in the CRHP corpus) and external figures (discussed by interviewees but not themselves interviewed). The pages are **integration hubs**, the primary value is the cross-link manifest connecting each person to the rest of the site (LoC item URL, semantic neighbors precomputed in `/rag/related/`, position on each concept axis, influence-graph edges, tour appearances); the biographical paragraph is connective tissue, not the headline content.

**Citation priority (critical for Smithsonian / LoC institutional review):** LoC item pages first, other LoC collections second, other primary-source institutional archives third, peer-reviewed scholarly archives fourth, established secondary references fifth, Wikipedia almost never. Wikipedia is best used as a **directory** to find the diverse non-correlated sources its editors drew on; cite THOSE underlying sources, not the Wikipedia hub. A long `sources[]` array of disparate academic references reads stronger to an institutional reviewer than a single Wikipedia link, and removes the "monolithic hub source" attack vector entirely. The full discipline lives in `public/rag/people/README.md` § `sources[]`.

**Headline content is the AI's reading, not the historical orientation.** A paper is in preparation that asks what a blank-slate AI embedding model "thinks about" each civil rights thinker, in contrast to what the cultural record has carved out. Each person page therefore needs an `ai_reading` field whose prose names a specific embedding-derived observation: a top semantic neighbor at high cosine similarity who isn't an obvious cultural-historical pairing, a concept-axis position that contradicts the public framing, or an influence-graph edge that runs unexpectedly. The biographical paragraph follows as orientation; the AI's reading leads. The full discipline lives in `public/rag/people/README.md` § Writing discipline → `ai_reading`.

| File | Purpose |
|---|---|
| `public/rag/people/README.md` | The schema (with field-by-field discipline), the catalog purpose (integration-hub framing), and the writing discipline (Wikipedia / SNCC Digital / BlackPast / LoC item pages are FACT-CHECK material only, never writing material; anti-idempotent prose with varied openings + sentence rhythms per page; cite every factual claim with `[src: N]`; citation priority with Wikipedia LAST). **Read this before adding a person page or modifying `PersonPage.jsx`.** |
| `public/rag/people/*.json` | One catalog entry per person, schema documented in the README. Bio paragraphs follow the seven writing rules in the README. |
| `src/pages/PersonPage.jsx` | The React component that renders a catalog entry as a citation-bearing reference page with auto-derived cross-link sections. |

Searchability rollout: the catalog JSON gets ingested into the main `civil-rights` Pinecone index as **one vector per person** (embedding `display_name + role_summary + biographical_paragraph + ai_reading` as a single document), with `content_type: 'person'` metadata. Existing archive-focused retrieval flows (Quote Finder, Semantic Overlap, ConceptSpectrum drill-down, ConceptMatrix concept-query, InterviewMap concept-query, Tour Pages, Themes Browser, Influence drill-down) filter out `content_type='person'` so their existing ranked-passage UX is unchanged. A new site-wide search bar or "find a person" affordance can pass `includePersons: true` (client) / `include_persons: true` (MCP server) to query without the filter and render mixed results with a "Person" or "Passage" badge per result.

**Status (updated 2026-06-01):** Catalog at 202 pages (165 interviewees + 37 external figures), 100% bio coverage, verbatim interview-snippet coverage on all non-stub pages (1000+ quotes, gated by `scripts/verify_person_snippets.py`), 0 reversed concept-axis labels (`scripts/audit_axis_labels.py` clean), and full portrait/environment hero imagery (0 bare pages). The exclusion filter is implemented at both layers (`src/services/ragClient.js::retrieve` and `mcp-server/server.mjs::searchTranscripts`) as of commit 6f446a7. The ingestion command path is implemented in `rag/ingest.mjs` as of commit 7cbf643:
- `node --env-file=.env.local rag/ingest.mjs --persons-only` ingests the person-page vectors (one per page, currently 202) without touching the transcript index.
- `node --env-file=.env.local rag/ingest.mjs --include-persons` performs a normal transcript ingest and the person-catalog ingest in the same run.
**The person-vector Pinecone push is DONE (2026-05-29):** the catalog-page vectors were upserted to the `civil-rights` index (model voyage-3, `content_type='person'`, 0 orphaned) using Eric's Voyage + Pinecone credentials in `rag/.env.local`. The catalog has since grown to 202 pages, so re-run `node --env-file=rag/.env.local rag/ingest.mjs --persons-only` to sync the newest pages (entries 139-142 plus any edits). Re-runs are idempotent on content hash and only re-embed changed pages.

### Component-level `README.md` files

| File | Purpose |
|---|---|
| `rag/README.md` | Architecture + setup + metadata-schema reference for the Pinecone + Voyage RAG layer. Read before touching `rag/ingest.mjs`, `rag/retrieve.mjs`, or related code. |
| `rag/CONFERENCE_PREP.md` | London-conference brief (2026-06): what's in the corpus, how the embeddings represent it, what queries the presentation will exercise, what's still left to wire up. The "philosophy of embedding" framing for stakeholder communication. |
| `rag/INTERACTIVE_FEATURES_DESIGN.md` | Design doc for the interactive connection-display layer (SemanticSearch, QuoteFinder, RelatedPassages, Constellation). Substrate → precompute → UI architecture diagram, per-feature interfaces, the shared citation-grade payload contract, build order, deployment manifest, cross-corpus portability pattern (civil-rights ↔ worldthought.com), open design questions. **Read this before integrating the rag/ components into React pages or porting the pattern to worldthought.com.** |
| `rag/DEMO_SCRIPT.md` | Wednesday-meeting (or any stakeholder) one-pager. Three minutes of demo, three Wednesday-friendly demo queries with expected results, infra-cost numbers, audit-tier color legend, outstanding admin actions. **Read this if asked to prep a demo or write a stakeholder summary.** |
| `rag/ENDPOINTS.md` | One-page lookup reference. Live URLs (including tab-hash deep-links), backend identifiers (Pinecone index host, Netlify siteId, etc.), `/retrieve` body params + response shape, required env vars, regenerate-artifacts commands. |
| `rag/NEXT_SESSION_PICKUP.md` | Fresh-eyes 5-minute orientation for an agent resuming work. Priority read order, what's admin-blocked vs open code work, three patterns worth knowing, things NOT to do, two-step health check to run on resume. **Read this first if you're a new agent or returning to this codebase after a break.** |
| `rag/OPERATIONS.md` | Operations runbook: key-rotation procedures (Voyage + Pinecone), what to monitor day-of-conference, abuse-response playbook, reingestion-after-corpus-changes recipe, cost ceiling + worst-case-abuse estimates, disaster-recovery procedure. |
| `rag/SHOWCASE.md` | Feature-by-feature showcase of the interactive RAG surfaces: the math behind the Ideological Spectrums (`ideological_spectrums.json`), the per-feature data files and drill-down query contracts, and the regenerate commands. |
| `rag/ATLAS_PROVENANCE.md` | Provenance record for `public/rag/atlas_projection.json` (the one Nomic Atlas UMAP projection produced before the account was canceled on 2026-05-27; the replacement path is umap-learn). |
| `mcp-server/README.md` | Engineering reference for the MCP server (post-2026-05-25 Pinecone+Voyage rewire). Architecture, local dev, deployment, env vars, citation-payload shape. |
| `mcp-server/USAGE_GUIDE.md` | End-user / researcher / Anthropic-Connector-Directory submission doc. Audience, what's in the corpus, connection setup, three worked examples (grant citation, quote verification, curriculum dev), citation format reference (Chicago/APA/MLA), provenance/transparency notes. **Read this if asked about how to use the MCP connector or its value proposition.** |
| `mcp-server/CODEX_SETUP.md` | Step-by-step setup for connecting the MCP server to Codex and other tool-only MCP clients (env vars, the `civil-rights` Pinecone index, voyage-3 + rerank-2, and the six-tool verify step). |
| `netlify/functions/README.md` | Netlify Function endpoints (server-side proxies that keep API keys out of the client bundle). Currently: `retrieve.mjs` for the public semantic-search proxy used by the frontend RAG components. |
| `functions/README.md` | Cloud Functions (Firebase) layer documentation |

### `Metadata Generation System/`, the Python pipeline

| File | Purpose |
|---|---|
| `Metadata Generation System/Metadata Generation Documentation.md` | The original Python/Flask 7-step pipeline documentation (blocking → labeling → TOC → chapterization → summarization → tuning → engagement). Read before touching `processor/*.py`. |
| `Metadata Generation System/StandardizedRubric_1.md` | The Smithsonian-grade scoring rubric used by the dual-scorer + citation-auditor. **The reference rubric for what "publication-grade" means.** |

### Per-pass audit staging (machine-generated, ~440 files)

These directories contain one file per audit-able entry per pass. They are intermediate audit artifacts consumed by merge scripts (`merge_pass2.py`, `merge_pass2_tail.py`, `merge_pass3.py`, and the Session 4 Pass 4 merge in commit `32516a3`). **A new agent doing audit work should NOT read these files for project context**, read the merged result in `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` instead.

| Directory | Count | Purpose |
|---|---|---|
| `transcripts/pass2_stage/` | 90 files | Session 2 Phase A Pass 2 per-entry corrections (entries #43–#132) |
| `transcripts/pass2_tail_stage/` | 14 files | Session 2 Phase B Pass 2 tail-sweep for the 14 entries that had Pass 1 partial reads (#1, #6, #7, #8, #12, #13, #14, #17, #20, #26, #29, #30, #34, #38) |
| `transcripts/pass3_stage/` | 127 files | Session 2 Phase C Pass 3 consolidation per entry (confidence resolutions, adversarial-review flags, ground-truth corpus candidates, missed-pattern catches) |
| `transcripts/pass4_stage/` | 127 files | Session 4 Pass 4 sweeping QA + fact-check per entry (one-transcript-per-agent strict isolation) |
| `transcripts/pass5_stage/` | 126 files | Session 3 Layer 5 corpus-global fidelity findings, per-entry sliced (D1 phantom Whisper renderings, D2 bidirectional canonical inconsistencies, D3 catalog-vs-per-entry contradictions). Generated by `transcripts/build_pass5_stage.py` from `layer5_fidelity_audit.json`, derivative of the corpus-global audit, structured per-entry for institutional auditability and Google Drive sharing. |
| `transcripts/per_entry_slices/` | 127 files | Session 4 cross-contamination firewall slices, each agent reads ONLY its own slice, never the master MD. Built by `transcripts/slice_master_md.py`. |

### Test fixtures

| File | Purpose |
|---|---|
| `tests/fixtures/fixture_master.md` | Small synthetic master-MD fixture for `tests/test_apply_corrections.py` (two entries, deterministic, no dependency on the real 6 MB overlay) |

### GitHub meta

| File | Purpose |
|---|---|
| `.github/pull_request_template.md` | PR description template |

### When to read what

- **New agent doing audit-related work:** start with this CLAUDE.md (you're here), then `transcripts/AUDIT_TRAIL.md` (history) and `transcripts/OPEN_PROBLEMS.md` (open items). Don't try to read the per-pass staging directories.
- **New agent doing LoC-healing or new-transcript work:** this CLAUDE.md, then `transcripts/ingestion/README.md` and `transcripts/loc_healing/COVERAGE_REPORT.md`. Read `transcripts/AUDIT_VS_LOC_DISAGREEMENTS.md` if the heal pipeline surfaces issues. **Do not re-run Passes 1-7 on new transcripts**, that pipeline is retired for new work.
- **New agent doing RAG-related work:** this CLAUDE.md, then `rag/README.md`, `rag/CONFERENCE_PREP.md`, and `docs/RAG_SUBSTRATE_DECISION.md`.
- **New agent doing per-person-pages work:** this CLAUDE.md, then `public/rag/people/README.md` (catalog purpose + schema + writing discipline). The writing discipline is non-negotiable: Wikipedia and similar sources are fact-check material only, never writing material, and each bio gets novel, anti-idempotent prose. Work one person per iteration, no subagent parallelism (Claude Max 20x rolling-cap constraint).
- **New agent doing accessibility / frontend work:** this CLAUDE.md, then `docs/ACCESSIBILITY.md`.
- **New agent doing deployment / DevOps work:** this CLAUDE.md, then `docs/DEPLOYMENT.md`.
- **New agent doing pipeline / Python work:** this CLAUDE.md, then `Metadata Generation System/Metadata Generation Documentation.md` and `StandardizedRubric_1.md`.
- **External stakeholder briefing / presentation prep:** `PRESENTATION_REFERENCE.md` first (conceptual map of breakthroughs), then `lessons_learned.md` for deeper-dive error categories.

## Validation commands

- **React build**: `npm run build` (from project root)
- **Node Cloud Functions parse-check**: `node --check functions/index.js`
- **MCP server parse-check**: `node --check mcp-server/server.mjs`
- **Python pipeline compile-check**: `cd "Metadata Generation System" && python -m compileall -q processor/`
- **Ground-truth corpus validate**: `cd "Metadata Generation System" && python scripts/validate_facts.py`
- **CI**: `.github/workflows/ci.yml` runs all five on every push (parallel frontend + python jobs, 15m timeouts, cancel-in-progress).

## Deployment

- **Frontend**: Netlify, connected to `master` branch. `VITE_FIREBASE_*` env vars are required (no hardcoded fallbacks). `SECRETS_SCAN_OMIT_KEYS` must list those six keys or the secrets scanner blocks the deploy.
- **Firebase**: project ID `civil-rights-history-project` (the new clean one, replacing legacy `llm-hyper-audio`). Firestore in `nam7` multi-region. Email/Password auth. Rules in `firestore.rules` cover 12 collections; push with `firebase deploy --only firestore:rules`.
- **Cloud Functions**: not yet deployed to the new project. Will require Blaze billing + `firebase functions:secrets:set OPENAI_API_KEY`.
- **MCP server**: Fly.io. Requires `flyctl auth login`. Dockerfile + fly.toml + .dockerignore in `mcp-server/`.

## Defensive patterns established in the overhaul

- **Type coercion on model output**: `claude_scorer._coerce_score`, `citation_check._coerce_count`, `tuning._coerce_score` -- all defend against type-confused model output (string-of-digits, float, bool, None).
- **Input validation at API boundaries**: Cloud Functions (functions/index.js), MCP server tools (mcp-server/server.mjs), client-side `markReviewed` (src/services/reviewQueue.js) -- all type/length-check inputs.
- **Embedding-dimensionality filter**: `performVectorSearch` (functions/index.js) and `searchTranscripts` (mcp-server) skip docs with embedding lengths that don't match the query, preventing NaN-poisoned similarity rankings.
- **Named firebase-admin app**: `processor/review_queue.py` uses a named app (`review_queue_app`) so it doesn't collide with default-app initialization elsewhere in the process.
- **Fail-closed publication**: dual-scoring disagreement -> human review queue, not auto-publish. Per-claim citation failures -> block, not skip.

## Accessibility tokens

- **Brand red `#F2483C` on cream `#EBEAE9` = 3.05:1 contrast.** Passes WCAG 2.2 AA only for large text (18pt+, or 14pt+ bold). FAILS the 4.5:1 minimum for normal body text. For small red labels (text-sm, text-base), use the `.text-civil-red-body` utility class (`#B23E2F`, measured 4.86:1, WCAG AA compliant). CSS tokens for both live in `src/index.css`.
- **Stone-900 `#1c1917` on cream `#EBEAE9` = 14.1:1**, passes AAA. Default body text.
- **`*:focus-visible` global rule** in `src/index.css` restores a 2px red outline with 2-3px offset on every focused interactive element (Tailwind's preflight reset suppresses the browser default).
- **`prefers-reduced-motion`** is respected globally; animation/transition durations collapse to 0.01ms.

## Things that look broken but aren't

- The legacy `llm-hyper-audio` references in `scripts/firebase/*.cjs` are by filename only -- the actual service-account JSON files are gitignored. Don't try to "fix" the filenames.
- `score_chapters_batch` in `tuning.py` returns an empty list on length mismatch -- this is intentional fallback to per-chapter scoring, not a silent failure.
- `MobileAdvisory` no longer exists. The component was deleted on 2026-05-21 (commit 783d419) after the mobile audit closed out the issues the banner was hedging against. Earlier commit messages reference it; those references are historical, not current state.
- The site uses two reds: `text-red-500` (Tailwind, `#F2483C`, brand) for large text only; `text-civil-red-body` (custom utility, `#B23E2F`) for any text below 18pt or 14pt-bold. See "Accessibility tokens" section above for the rule.
- `text-civil-red-body` and `.bg-civil-red-strong` are CSS custom classes defined in `src/index.css` -- they do not appear in Tailwind's class scanner output but they ARE valid utility classes. If a linter or content-purge step ever flags them as unused, configure it to whitelist these names.

## Operational state (2026-05-25 23:00, autonomous-deploy session)

The interactive RAG layer is live in staging. The following are operational facts
(not architecture), captured here so a future agent picks up the right state.

### What's deployed and running

- **Pinecone index `civil-rights`** (1024-dim, cosine, AWS us-east-1), created via REST API on 2026-05-25 23:00 UTC. **Co-mingled with `worldthought` in the same Pinecone project** (shared host hash `odc9z70`); separating into project-scoped keys is a follow-on (see `rag/.env.local` header for the migration path). Index is **Ready** and **populated**: 15,464 passage vectors as of 2026-05-26 (`.srt`-only after the prune that dropped `.txt` + `.vtt` duplicates). That count has since grown with the corpus reaching 140 plus the per-person vectors; the current total is ≈16K (verify against the Pinecone console).
- **Netlify `civil-rights-staging` env vars**, `PINECONE_API_KEY`, `PINECONE_HOST`, `PINECONE_INDEX`, `VOYAGE_API_KEY`, `VOYAGE_MODEL`, `VOYAGE_RERANK_MODEL` all set via Netlify MCP. The first attempt with `envVarIsSecret: true` failed silently for the API keys, they were re-upserted as non-secret. **Lesson:** when Netlify env-var setting "succeeds" but the value never appears in subsequent `getAllEnvVars` listings, the secret-flag + `context: "all"` combination silently rejects the upsert.
- **`/retrieve` Netlify Function**, deployed at `b935c03`+. After env var fix, requires another deploy to cycle the function's `process.env` snapshot. Empty-commit pushes are the trigger.
- **`/rag-explore` page**, three-tab demo of SemanticSearch + QuoteFinder + Constellation, gated behind ProtectedRoute. Live at `https://civil-rights-staging.netlify.app/rag-explore`.

### What's NOT deployed

- **MCP server (Fly.io)**, `flyctl` is not installed on Eric's machine; `flyctl auth login` is interactive. Blocked on Eric installing the CLI + authenticating. The server code is rewired (commit `2c05cd8`) and ready to deploy. **Verified working locally** on 2026-05-26: started `node server.mjs` on port 3099 against the live Pinecone index, hit `/healthz` (200 `{ok:true}`), called `tools/call` with `search_transcripts({query:"nonviolence as theology", dedupe_by_entry:true})` via the proper `Accept: application/json, text/event-stream` header, got a clean citation-grade response (Joseph Echols Lowery on nonviolence-as-theology, timestamp 00:26:57, full Chicago citation block).
- **Pinecone civil-rights as a SEPARATE project from worldthought**, would require Eric to provision via the Pinecone console + generate a new project-scoped API key. Current setup is functional but cohabitating in the worldthought project space.

### Post-23:00 quality-pass follow-on

Quality improvements landed after the initial operational state was captured. Summary (commits):

- **Pruned to `.srt`-only** (`3bfcc07`). Cross-format duplicate hits in top-N retrievals were the most visible issue in the first demo run. Dropping `.txt` and `.vtt` from `SOURCE_EXTENSIONS` + `ingest --prune` removed 25,246 duplicate vectors (40,710 → 15,464). Every retrieval result now carries timestamps.
- **Tier-aware visualization + cards** (`0274e5c`, `5be487a`, `4e3d66f`). The Constellation color-codes dots by `uncertaintyTier` (5-color scale: emerald → amber → red → violet → slate). `CitationCard` shows a colored per-tier badge with full label text. The audit substrate is now visible at a glance instead of being a "trust us" claim.
- **Tier-vocabulary doc cleanup** (`3f4249f`, `ed18acc`, `07438c2`). The vocabulary value `high` was a placeholder in early docs but never appears in the corpus. Updated mcp-server/USAGE_GUIDE.md, the `source_for_claim` MCP prompt, rag/INTERACTIVE_FEATURES_DESIGN.md, and rag/README.md to list the 5 real tier values (low / medium / publication-block / not-auditable / ingestion-only) with per-tier counts.
- **Corpus-stats header on /rag-explore** (`ed72e02`). The demo page now shows `136 interviews · ~15K time-anchored passages · 5-tier audit substrate` with the tier distribution inline, so visitors see the substrate is real and quantified.
- **Stakeholder one-pager** (`42291c0`). `rag/DEMO_SCRIPT.md` for Wednesday-meeting prep: what to demo, three concrete queries to run, the infra-cost numbers, and the outstanding admin actions.
- **`/retrieve` ergonomics** (`84677cf`). The Netlify Function now accepts top-level `entry_number` as a shortcut, matching the MCP server's tool signature.

Memory items saved this session:

- `feedback_no_idle_waiting.md`, don't idle during background tasks; do parallel work.
- `reference_netlify_mcp_envvar_secret.md`, the `is_secret=true + context="all"` silent-fail pitfall.

## Curated essays layer (2026-06-01)

`/essays` is a content type: curated, real, academically-attributable essays that illuminate the archive's themes, reproduced in full with citation and license, and cross-linked into the corpus. There is NO AI-generated essay prose; every essay is a third-party public-domain or open-license work (AI editorializing on a formal archive would cast suspicion on the well-sourced rest of the site). A director at UCLA requested featured essays; the four he named (family influence, intergenerational activism, community support, youth/student activism) were examples, not limits. **Read `public/rag/essays/README.md` before touching this layer.**

Seed collection: 23 essays from 9 authors (two women), all public domain. W. E. B. Du Bois (the 14 essays of *The Souls of Black Folk*); the 7 essays of *The Negro Problem* (Booker T. Washington, Du Bois's "The Talented Tenth," Charles Chesnutt, Wilford Smith, H. T. Kealing, Paul Laurence Dunbar, T. Thomas Fortune); Anna Julia Cooper's *A Voice from the South*; Ida B. Wells's *The Red Record*.

**The licensing gate is the controlling rule:** the license must permit DERIVATIVE use, because embedding a text into the search index is a derivative use, so No-Derivatives licenses (CC BY-ND, CC BY-NC-ND, which is why the SNCC Digital Gateway tier is out) are categorically excluded. NonCommercial is acceptable for this non-commercial academic project. Qualifying tiers: public domain, US-government works, CC0, CC BY, CC BY-NC, and ShareAlike variants. Paywalled work is excluded entirely. Verify the SPECIFIC item, not the repository.

**Verbatim reproduction:** the essay body is the author's verbatim text, so its original punctuation (em dashes, curly quotes) is preserved; the project's writing rules apply only to OUR chrome (page headings, abstracts, topic descriptions). `scripts/strip_em_dashes.mjs` skips `public/rag/essays/` so a sweep never corrupts a reproduction.

**Pipeline (manifest-driven, idempotent, scalable; the broader oral-history platform reuses it):**
- `public/rag/essays/manifest.json` is the curation source of truth (one verified row per source); `topics.json` is the extensible topic taxonomy that drives cross-linking.
- `python scripts/harvest_essays.py` fetches and extracts verified rows into `text/<slug>.txt` + `<slug>.json` (license-gated; refuses non-qualifying rows).
- `node scripts/build_essays_index.mjs` builds `index.json` (the `/essays` UI reads it).
- `node --env-file=rag/.env.local rag/ingest.mjs --essays-only` chunks and embeds into Pinecone as `content_type='essay'` (excluded from passage/people flows by default; opt in via `includeEssays` / `include_essays`). 869 essay-segment vectors as of the seed ingest.
- `node scripts/build_essays_sources_report.mjs` writes `output/essays-sources-report.md`, the provenance record and reporting export.

**Standardized suggestion + onboarding (the essay parity to `onboard_interview.py`):** the content-suggestion concept is unified across interviews and essays. A candidate essay is a `manifest.json` row with `status: "candidate"` (no separate candidates file, the same way an interview carries state in its one `corrected/` manifest). `scripts/intake_essay_candidate.py` is the candidate front-door: it validates metadata and runs the LICENSE-DERIVATIVE GATE deterministically (the controlling check), promoting `candidate -> verified` or refusing with the specific reason (exit 0 pass, 1 invalid metadata, 2 license refused); it never fetches the text. `scripts/onboard_essay.py` is the master idempotent pipeline (validate, license gate, promote, harvest, index, ingest, sources-report, status), mirroring `onboard_interview.py`: numbered stages that skip work already done, ingest gated on `rag/.env.local` with a `--skip-ingest` opt-out, and a hard stop on a failed license. It reuses the intake script for the gate and shells out to the existing essay scripts (no duplicated logic). The one human decision is the per-item license verification; the rest is mechanical (the body is verbatim, no authored inputs like the interview's chapter spec/summary/person page). `scripts/essay_candidate.example.json` is the worked candidate example. Full process doc: `public/rag/essays/README.md` § "The standardized suggestion and onboarding process".

UI: `src/pages/Essays.jsx` (`/essays`, data-driven index grouped by topic; `?topic=` filters), `src/pages/EssayPage.jsx` (`/essays/:slug`, one essay as an integration hub with attribution and derived corpus cross-links). Nav: "Essays" in `Header.jsx`. The Topics page links through via `/essays?topic=<id>`.

## Site-improvement pass (2026-05-30, Dustin request batch)

A batch of PM (Dustin) site-improvement requests was implemented and pushed to production (`origin/master` -> Netlify -> **robotlogic.org**). Full request-by-request report at `output/site-improvements-report-2026-05-30.md`. Durable facts a future agent needs:

- **`/playlist-builder` is now STATIC, not Firestore.** The old `PlaylistBuilder.jsx` (and `InterviewPlayer.jsx`, `ClipPlayer.jsx`) read from Firestore, which is empty, so every `/playlist-builder?keywords=...` link (roughly 50 on Home alone, plus Topics and others) was dead. The route now renders `src/pages/StaticPlaylist.jsx`, which reads `public/rag/playlist_index.json` (every chapter across the 140 interviews, regenerated by `scripts/build_playlist_index.py`; the clip count grew when the corpus was re-chapterized into granular chapters). It filters by `?keywords=` / `?q=` / `?topic=` / `?entry=` / `?entries=N,M&label=` and plays each clip via `LocVideoEmbed` bounded to its start/end. `PlaylistBuilder.jsx` is retained but no longer routed. **Re-run `scripts/build_playlist_index.py` after any re-chapterization** so the clip index tracks the new chapter boundaries.
- **Corpus count is now 140** (verify via `scripts/diag_corpus_state.py`). History: 127 originally; the 9 transcripts dated 2026-05-25 brought it to 136 (entries 28, 46, 64, 133-138); the 4 that had corrected SRTs but no pipeline output (Glenda Funchess, Louise Broadway, the Lucius Holloway Sr. and Emma Kate Holloway joint, Luis Zapata) were then built as entries 139-142, reaching 140. Entry IDs span 1-142 with gaps at 31 and 95. 145 is the approximate full LoC/Smithsonian collection size, not our holdings. On-site copy was updated to the 140 count (commit `66fda23`).
- **New page `/machine-audit`** (`src/pages/MachineAudit.jsx`): explains the pipeline, the 90/90 dual-scorer gate, the LoC cross-reference, the settled audit states (live counts from constellation), where uncertainty remains, and a mailto correction path. Linked from `AuditProvenance`.
- **Navigation is drawer-only** (`Header.jsx`): top pill links removed, current page grayed via `aria-current` (not hidden), "Spectrum" renamed "Ideological Spectrums," the technical sub-tab menu entries (Semantic Overlap, Word Search) dropped. Explore-page tabs use content language (Related People, Concept Lenses, Places, Influence).
- **All outbound loc.gov catalog links removed site-wide** (16 files). Textual "Library of Congress" attribution kept as plain text; `tile.loc.gov` media sources and the person-page `sources[]` citations are untouched, so the citation substrate is intact.
- **Topics page** leads with David Cline's recurring-narrative themes as curated playlists; "External Figures" renamed "Historic Figures" on `/people`.
- **Completed since this batch (2026-05-31):** the full-corpus re-chapterization into granular parts-grouped chapters ran across all 140 interviews (commit `3404a7d`), and the 4 previously-missing interviews were built as entries 139-142 via the master onboarding pipeline `transcripts/ingestion/onboard_interview.py` (commit `becd128`), taking the corpus from 136 to 140. Residual: the `related/` semantic-neighbor precompute for entries 139-142 still needs a credentialed `node --env-file=rag/.env.local rag/precompute.mjs --feature related` run (see `transcripts/OPEN_PROBLEMS.md`).
- **Local `vite build` is unusable** (segfaults during transform, exit 5). This was originally blamed on antivirus, but it PERSISTS after Eric fully removed Malwarebytes and Windows Defender on 2026-06-02, and after disabling the harness sandbox and raising the Node heap, via both Git Bash and native PowerShell node. So it is a genuine node/vite transform crash (the msys Git Bash to Windows-node hop is the leading suspect), NOT antivirus. The verification stack that DOES work locally: (1) per-file parse check `./node_modules/.bin/esbuild <file> --format=esm --loader:.jsx=jsx`; (2) a whole-app graph check that resolves every import and export in about 170ms (the closest local proxy for the real build), `./node_modules/.bin/esbuild src/main.jsx --bundle --format=esm --outfile=/dev/null --jsx=automatic --loader:.css=empty --loader:.less=empty --loader:.png=dataurl --loader:.jpg=dataurl --loader:.jpeg=dataurl --loader:.svg=dataurl --loader:.webp=dataurl --loader:.woff=dataurl --loader:.woff2=dataurl --loader:.ttf=dataurl --loader:.js=jsx`. The Netlify Linux build remains the deploy gate (unaffected by this crash; it will not deploy a broken build, so production is protected).

## Sharing, segment deep-links, and global search (2026-06-01)

Three linked navigation features (originally branch `feat/share-and-global-search`, now merged to `master`). The thread is that a video segment on this site is identified by `(entryNumber, startSeconds, endSeconds)`, which is a URL, so it is shareable, deep-linkable, and the natural funnel target for search.

**Share foundation (reused everywhere):**
- `src/utils/share.js`: `buildShareUrl(path)` makes an absolute URL from an in-app path; `shareOrCopy({url,title,text})` uses the device share sheet on coarse-pointer (touch) devices and the clipboard everywhere else (with a legacy `execCommand` fallback). `prefersNativeShare()` is the pointer gate.
- `src/components/ShareButton.jsx`: the one share/copy control. Variants `button` / `icon` / `inline`; accepts a static `url` or a `getUrl()` computed at click time (used for "this moment" / live-filter links); flips to a "Link copied" state and announces it via `aria-live`.

**Interview page (`/interview/:entryNumber`, `src/pages/InterviewDetail.jsx`) is the centerpiece.** It was the page where the URL stayed static while you browsed parts/chapters (playback was imperative via `heroRef.seek`), so granular sharing did not work. Fixes:
- **Hashtag anchor marks**: each part and chapter has a stable id (`#part-2`, `#chapter-5`, where part index is 1-based over the rendered `groupChaptersByPart` groups and chapter is `chapter_number`) and a faint `#` mark (`AnchorMark`) that copies a deep-link to that section.
- **Deep-link arrival** (one-shot, `didArriveRef`): a `#chapter-N`/`#part-N` fragment, or a `?t=<sec>[&end=<sec>]` query (also accepts `HH:MM:SS`), seeks the hero, bounds the clip, scrolls the section (or the hero) into view, and flags it. Browser autoplay policy may hold a fresh-nav clip until the reader presses play; it is cued either way.
- **Live URL sync**: playing a chapter/part also rewrites the address-bar hash via `window.history.replaceState` (no router churn, no history spam), so the bar tracks playback. Plus a "Copy link to this moment" that reads the live playhead (`LocVideoEmbed` now exposes `getCurrentTime()` on its imperative handle) and a page-level "Share."

**Other surfaces:**
- `HearInContext.jsx` (every citation/snippet: person pages, Quote Finder, etc.) gets a "Copy link to this clip" that points at `/interview/N?t=&end=`, so any passage is shareable down to its bounded segment.
- `TableOfContents.jsx`: per-chapter / per-part / per-entry share. The active clip is restored from and synced to `?entry=&t=&end=` (label recovered by matching the time against the interview's parts/chapters), so a shared ToC link reopens on the right segment.
- `StaticPlaylist.jsx`: per-clip and now-playing share. The selected clip is restored from / synced to `?play=<entry>_<startSeconds>` on top of the existing filter params.

**Global search is now a federated command palette (`src/components/CommandPalette.jsx` + `src/services/federatedSearch.js`), opened via Cmd/Ctrl+K or `/`.** (The upper-right Search trigger button in `Header.jsx` was removed on 2026-06-03 at Eric's request; the palette itself is unchanged and still mounted at the App root, only the header button is gone.) It supersedes and replaces the original always-visible header bar (the old `GlobalSearch.jsx` was removed). One query fans out, in parallel and fail-soft, across four source families and renders them grouped (Interviews, People, Topics & Events, Timeline, Essays, Passages): the static catalogs (`/rag/people/index.json`, `/rag/essays/index.json`) for instant name/title/topic typeahead; the Firebase database (`timelineEvents` and `events_and_topics`, fetched once and cached, then filtered locally) for the timeline and topic groups; Pinecone + Voyage via `ragClient.retrieve` for citation-grade, time-anchored passages; and, when the Cloud Functions are deployed, the Firestore vector layer (`embeddings.searchClipsByTopic` -> the `vectorSearch` Cloud Function over `clipEmbeddings`, circuit-broken so a proven-dead source is not re-hit each keystroke). Each group resolves independently within its own timeout, so a slow or unavailable source just drops its group and the rest still render. The original funnel is kept: a "Play a playlist about ..." row (`/playlist-builder?keywords=...`) is the Enter default; passages open `/interview/N?t=&end=` (the segment deep-link) so selecting one lands the reader listening. Relevance is shown as **evidence** (the matched passage + a score), not model prose. The keyboard model is the WAI-ARIA combobox/listbox pattern (the input keeps DOM focus; arrow keys move `aria-activedescendant`); Escape / outside-click / route-change dismiss. Shared deep-link helpers were lifted into `src/utils/clipLink.js` (`clipHref`, `shortTimestamp`, `tsToSeconds`).

**Scope note (updated):** the command palette is mounted once at the App root (outside `<Routes>` in `App.jsx`, under `SearchProvider`), so it works on every route, including the header-less player routes (`/interview/:entryNumber`, `/interview-player`, `/clip-player`), via Cmd/Ctrl+K or `/`. This closes the prior gap where the header-only search did not reach those routes. The header no longer carries a clickable Search trigger (removed 2026-06-03); the palette is reached only via Cmd/Ctrl+K or `/`, which work on every route, including the header-less player routes. Page-share is still header-bound (so it renders only on `Layout`-wrapped routes), and the interview page carries its own richer share controls. The header is not sticky-on-scroll (matches the prior header); pinning it is a one-line follow-up if wanted.

## Site-improvement pass (2026-06-02 afternoon, Dustin IA batch)

A second 2026-06-02 batch of Dustin IA requests landed on `master` -> production after the morning's four-item-menu change; it SUPERSEDES that morning menu (so the "drawer-only navigation (items: Timeline, Interviews, Topics, ...)" line in "Current state" and the four-item notes in the 2026-05-30 batch are obsolete). Durable facts:

- **Primary nav is five items** (`Header.jsx` `MENU_ROUTES`): Timeline (`/`), Table of Contents (`/topic-glossary`), People & Interviews (`/people`), Explore Interview Data (`/rag-explore`), K-12 Curriculum (`/curriculum`). (People & Interviews was moved above Explore Interview Data on 2026-06-03 at Eric's request, so the human-facing browse precedes the analytical maps-and-retrieval surface.) The footer (`Footer.jsx`) holds the four secondary destinations (Essays, Methodology, Technical Documentation, About) plus the LoC attribution. **The visible labels still do NOT all match their route names** (kept stable for deep links): "Table of Contents" is the thematic book at `/topic-glossary`; the per-interview chapter index keeps the `/table-of-contents` route and is reached from People & Interviews and from the foot of the book ToC. The wordmark logo was removed; a plain "Home" text-plus-icon control in the top-left carries the return-home function (hidden on the homepage).
- **New taxonomy module `src/data/archiveThemes.js`** is the single source of truth for the **Collection > Theme > Playlist > Video Clips** hierarchy (6 themes, 18 playlists; every playlist query was verified non-empty against `playlist_index.json`). Exports `playlistHref`, `findPlaylist`, `relatedPlaylists`. Consumed by `TopicGlossary.jsx` (the book ToC) and `StaticPlaylist.jsx` (Related Playlists). Dustin's three themes (Movement Building and Organizing; Violence and State Repression; Education) lead verbatim; three more extend corpus coverage (trim if Dustin wants only his three).
- **Table of Contents (`TopicGlossary.jsx`, `/topic-glossary`)** is the primary archive entry: search bar first, then a structured overview (theme jump-links), then a nested book (themes as numbered sections, playlists nested, each linking straight to its playlist). The old curated-essays and k-means-cluster sections were removed; the page is strictly interviews and playlists (essays remain at `/essays`, clusters on `/rag-explore`).
- **Homepage (`Home.jsx`)** leads with Dustin's tagline, then a large random rotating Quote of the Day (`HeroQuote`, reads `summaries/quotes.json`), then ONE "Explore the Collection" button to `/topic-glossary`. The "145 Interviews" and "View Timeline" entry points were removed; the timeline stays directly below.
- **Interview page (`InterviewDetail.jsx`)** is now video-first: the top is only title + verification badge + player. Descriptive text moved into collapsible accordions (new `Disclosure` component): Overview (summary + key themes), Historical Significance, About, What the Embedding Finds, Voices from the Archive, Related People (renamed from "Related Topics"). The Sources list stays visible so the in-prose `[src: N]` anchors resolve. Chapters reworked: parts are collapsed-by-default sections with prominent titles + time ranges, chapters revealed on expand, and the WHOLE chapter card is clickable to play (was only the small time button). Deep-link arrival (`?t=`, `#chapter-N`, `#part-N`) now opens the containing part before scrolling; bounded-clip seek + hash sync preserved.
- **Playlists (`StaticPlaylist.jsx`)** standardize the Collection/Theme/Playlist/Video Clips vocabulary (a breadcrumb names the Playlist and its Theme; list headings read "Video Clips") and replace "Related topics" with **Related Playlists** (two same-theme siblings + one cross-theme pick, via `relatedPlaylists`; falls back to in-set topics for cluster-derived views).
- **People & Interviews (`PeopleCatalog.jsx` + `PersonPage.jsx`)**: PeopleCatalog is the merged section's primary experience (interviewee cards go straight to `/interview/N`; historic-figure cards to `/person/slug`); the `FamousNames` "not in the corpus" panel moved here under "Historic Figures Discussed in the Archive". `PersonPage` renamed "Related Topics" -> "Related People" and, for external figures, derives Related People (interviewees who discuss them + figures co-discussed by the same voices) and a "Where This Figure Appears in the Archive" passage list with bounded clips, from `summaries/famous_external.json` + `summaries/influence.json`.
- **Explore Interview Data (`RagExplore.jsx`)**: promoted to a primary nav destination; "Maps of the Archive" is the primary grouping (Themes, Influence, Events and Activism, Places, Related People; Ideological Spectrums leads as the featured map). Compare Voices kept in place (Dustin wants more time on its placement). The Famous Names tab was removed (moved to People).
- **K-12 Curriculum (`Curriculum.jsx`)**: title generalized to "K-12 Curriculum" with the specific topic as subtitle, immediately followed by grade selection; the overview and AI-assisted disclaimer moved below the grade picker.

Verification: the local `vite build` segfault still stands, so this batch was gated on the esbuild whole-app import-graph check (clean, ~167ms) plus a zero-em-dash sweep of `src/`, not a local `vite build`. The Netlify Linux build remains the deploy gate.

## Site-improvement pass (2026-06-03, Eric batch)

A sequence of header/nav changes landed on `master` across one working session. The first three are in `src/components/common/Header.jsx`; the later ones (the People/Interviews restructuring) span several pages, see the subsection below. Durable facts:

- **The Search trigger button was removed from the top nav.** The header chrome row no longer renders a Search icon button. The federated command palette (`src/components/CommandPalette.jsx`) is untouched and still mounted once at the App root under `SearchProvider`; it opens via **Cmd/Ctrl+K or `/`** on every route. Only the header button (and its `useSearch`/`openSearch` wiring inside `Header.jsx`) was removed. If a fully searchless experience is ever wanted, the next step would be to also remove the keyboard shortcuts in `src/context/SearchProvider.jsx` and unmount `<CommandPalette />` in `App.jsx`, but that was deliberately NOT done here (the request was scoped to the top nav).
- **The "Pause Animations" toggle now renders ONLY on the timeline page (`/`).** The looping decorative motion (the period "GIF" videos plus a few infinite CSS animations) lives on the landing-page timeline, so the control was scoped to where the motion actually is, via a `location.pathname === '/'` guard around the button. On every other page the button is absent (it would have had nothing to pause). The underlying preference plumbing is unchanged and still site-wide: `useAnimationPreference` keeps `data-animations-paused` on `<html>` in sync from the stored choice on every page, and `src/pages/Home.jsx` pauses its videos off that attribute via the read-only `useAnimationsPaused`.
- **The default is animations ON unless the OS asks for reduced motion**, which was already the behavior (no code change needed) and is now the documented intent: `getInitialPaused()` in `useAnimationPreference.js` and the no-FOUC script in `index.html` both default to not-paused unless `prefers-reduced-motion: reduce` is detected. Eric's rationale: a default-on state makes the button read "Pause Animations" (a clear, discoverable affordance) rather than the murkier "Play Animations"; devices with a detectable reduce-motion setting remain the deliberate exception and still default to paused. (Note: a machine with reduced-motion set, e.g. a motion-sensitive developer's, will correctly see the page default to paused and the button read "Play Animations"; that is the exception working as specified, not a regression.)
- **Menu reorder (req 3, then SUPERSEDED below):** "People & Interviews" was briefly moved above "Explore Interview Data" in `MENU_ROUTES`. That intermediate order was replaced later the same day by the People/Interviews restructuring (next subsection), so the live order is NOT this one.

### People / Interviews restructuring (2026-06-03, later in the batch)

The short-lived "People & Interviews" merge was undone. The driving realization: a dedicated **Interviews** page and a combined **People & Interviews** page are contradictory, and the merged `/people` had become cluttered (165 interviewees + 37 historic figures + a 15-figure FamousNames panel). End state:

- **The Interviews page was re-surfaced, not rebuilt.** The per-interview chapter index (`src/pages/TableOfContents.jsx`, route `/table-of-contents`) was never lost: it still renders every interview collapsed by default, expandable to named chapters grouped into parts, each chapter/part a click-to-play bounded `LocVideoEmbed` segment (low latency), with a name filter, capsule, and audit badge. It had merely been buried in the nav (the "Table of Contents" label pointed at the themes book, and this page was demoted to a sub-link under the People toggle). It is now a primary nav item, **"Interviews"** (route unchanged for deep-link stability). Two fixes: the obsolete People/Interviews toggle `<nav>` was removed, and an explicit alphabetical sort by interviewee name was pinned in `filtered` (toc.json already arrives alphabetical; the sort guarantees it regardless of data order).
- **`/people` is now historic figures only, renamed "Historical Figures Referenced in Interviews."** `src/pages/PeopleCatalog.jsx` was rewritten: it drops the interviewees (now browsed under Interviews) and shows ALL 37 external figures as rich thumbnail cards, each linking to its strong `/person/:slug` reference page. This replaces the retired `FamousNames` panel, which covered only 15 of the 37 and led to "N voices" inline passages rather than the reference pages. (`FamousNames.jsx` still exists and is exported from `rag/index.js` but is no longer imported anywhere; safe to delete in a later cleanup.) Route stays `/people` for link stability; the page H1 and document title are "Historical Figures Referenced in Interviews", while the **menu label is just "People"** (Eric, 2026-06-03) so the drawer stays terse.
- **The themes-and-playlists book (`/topic-glossary`) was renamed "Table of Contents" -> "Topics"** in BOTH the nav label AND the page header + document title (`TopicGlossary.jsx`), 2026-06-03; page content otherwise unchanged. (Eric first picked the nav label, then confirmed the on-page header should match.) Route stays `/topic-glossary` for link stability.
- **Final live `MENU_ROUTES` order (menu label -> route):** Timeline (`/`), Interviews (`/table-of-contents`), Topics (`/topic-glossary`), People (`/people`, page title "Historical Figures Referenced in Interviews"), K-12 Curriculum (`/curriculum`), Explore Interview Data (`/rag-explore`). (Explore moved to the bottom row, below K-12 Curriculum, on 2026-06-03 at Eric's request.)
- **Orphaning check (Eric asked to confirm): cutting interviewees from `/people` orphans nothing.** The catalog never linked an interviewee to their `/person` page (it linked to `/interview`), so `/people` was never their inbound path. Every `/person` page, interviewees included, stays reachable via the global command-palette search (`federatedSearch.js` normalizes all people to `/person/:slug`) and via cross-links on other `/person` pages, essays, and curriculum. Interviewees' primary pages (`/interview/:entry`) became MORE prominent (the dedicated Interviews nav). `PersonPage.jsx`'s browse back-link is now context-aware (interviewee -> Interviews, figure -> /people). Stale inbound labels were updated in `TopicGlossary.jsx`, `MachineAudit.jsx`, and `PersonPage.jsx`.

This restructuring **SUPERSEDES the 2026-06-02 afternoon nav notes above** (the five-item menu; "Table of Contents" -> /topic-glossary as the primary label; "People & Interviews" -> /people) and the req-3 reorder bullet just above.

Verification: same stack as the 2026-06-02 batch (local `vite build` segfault stands). Gated on esbuild per-file parse checks of all changed files plus the whole-app import-graph check (clean) and a zero-em-dash sweep of the changed files. The Netlify Linux build remains the deploy gate.

### Playlist recommendations, historic-figure links, and page uniformity (2026-06-03, Dustin/Eric vision batch)

A brainstorm batch toward a YouTube-style exploratory player (stay in the video; move laterally between clips, topics, interviews, and figures via recommendations). First, buildable-now slice landed:

- **Recommended Clips on `/playlist-builder` (`StaticPlaylist.jsx`).** A "watch next" rail of clips from the interviews most closely related to the current playlist, by cosine similarity. Source: `public/rag/summaries/neighbors.json` (entry-level top-5 cosine neighbors with `similarity`). For the present set's entries it aggregates their neighbors, drops entries already in the playlist, ranks by best similarity, and represents each by that interview's longest clip (skips the short LoC intro chapter). Each card links to `/playlist-builder?entry=<E>&play=<E>_<start>` so the visitor keeps hopping inside the player. Loads defensively (no rail if the file is missing).
- **Historic figures discussed, opened in a NEW TAB (`StaticPlaylist.jsx`).** The now-playing detail lists the historic figures discussed in the current clip's interview, each a `<Link target="_blank" rel="noopener noreferrer">` to its `/person/:slug` page, so the video keeps playing while the reader pulls up the figure (Dustin's exact flow). Source: `public/rag/summaries/famous_external.json` inverted to entry -> figures (deduped).
- **Page uniformity.** The Interviews page (`TableOfContents.jsx`) header band was aligned to the Historical Figures page (`PeopleCatalog.jsx`): same eyebrow + Inter H1 sizing + stone intro + `max-w-5xl` container + `py-12`. Bodies still differ (single-column list vs card grid), which Eric approved; only the full-width header sections were unified.

**Data note for future recommendation work:** entry-level cosine is `neighbors.json`. True per-CLIP cosine neighbors exist as `public/rag/related/entry-<N>.json` (`per_chunk[i]` = a chunk's top cross-corpus neighbor passages with scores + timestamps), but mapping a chapter/clip to its chunk index is not yet wired; a small precompute that emits per-clip neighbor lists (or a chunk->time map) is the upgrade path to clip-precise recommendations.

**Roadmap (Dustin/Eric vision, not yet built):**
- **Interview page (`/interview/:entryNumber`) recommendations at the bottom:** related interviews/clips (neighbors.json) + figure links, mirroring the playlist rail. The next concrete step.
- **Per-clip cosine precompute:** emit static per-clip neighbors so "Recommended Clips" is clip-precise, not interview-representative. Needs `rag/.env.local` (Voyage + Pinecone) for a credentialed build, or derive from the existing `related/` per-chunk data plus a chunk->time map.
- **Query-driven exploratory player:** give a topic/query, assemble a playlist, recommend adjacent topics that pull up clips, all without leaving the player. Largely realized by `StaticPlaylist` + the new rail + Related Playlists; the remaining piece is a unified "explore" entry and tighter topic->clip recommendation.
- **User playlists / save-snippets / bookmarks (DEFERRED by Eric; must be built fresh).** Eric's overnight automated build of this was LOST: a machine segfault meant it never executed/saved. Confirmed not in this repo (no commits on any ref, no stash, no branch, no uncommitted source, only the untracked Dustin notes file). The old `PlaylistBuilder.jsx` / `PlaylistEditor.jsx` (Firestore-backed, unrouted) are prior infra to reference but do NOT implement the save-snippet/bookmark feature.
