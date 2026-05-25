# Civil Rights History Project — Codebase Guide

Project context: an open-source AI system that transforms the Library of Congress Civil Rights History Project oral history archive (600+ hours of interviews, produced in collaboration with the Smithsonian NMAAHC) into structured, searchable metadata. The Smithsonian has been scrutinizing the team's AI-generated summaries for hallucinations -- the quality bar is "Smithsonian-grade publication," not "good enough for a research demo."

## Pacing constraints

**Eric is on Claude Max 20x with consistent unused weekly headroom** and pre-paid overage credits that have never been touched. Do not throttle token usage, insert sleep gaps between iterations, or split independent work across wakeups to conserve prompt cache. Optimize for **wall-clock time and visible progress**, not tokens or cache hit rate.

**Hard deadline 2026-05-27 is 5–6 days away as of 2026-05-22.** Pace work accordingly.

**Do not use `/loop` for backlog work.** `/loop` is for event-gated polling (CI runs, file watches, remote queues) or calendar cadences (daily, weekly). For "burn through N known independent items," spawn N parallel `Agent` subagents in a single message — wall-clock = slowest single subagent, not the sum. An 89-item transcript-audit backlog finishes in ~10 minutes via parallel subagents, not hours of 270s sleep pulses.

**For genuine multi-hour persistence** (overnight work, scheduled cleanups, work that must survive session close), use `/schedule` (cron in Anthropic's cloud). Eric's real reason for reaching toward `/loop` is continuity across his errands/sleep windows, not a preference for sleep pulses — `/schedule` is the right answer for that, not `/loop`.

**Do not ask for confirmation between batches of independent work.** Run to completion.

External rate limits (OpenAI, Firebase, Fly.io, GitHub, Netlify) still apply. This rule is about Anthropic-side conservatism only.

## Current sprint status (as of 2026-05-21)

**Hard deadline: Wednesday 2026-05-27 team meeting at WWU.**

Staging deploy: https://civil-rights-staging.netlify.app — live, Firebase-backed (project `civil-rights-history-project`, Firestore `nam7`), Email/Password auth gate (Eric admin + `wwu`/`civilrights` team-shared). Firestore is empty of content; pipeline has not yet been run on the 135 raw Whisper transcripts in `transcripts/raw/`.

What's done as of 2026-05-21: dual-scorer + citation auditor + human-review queue substrate (commits 297f47d, ecde562, 5bcb591, f50bbdb, 297f47d, 50dcf49); 60-entry ground-truth corpus with cross-entry collision validator (commits 4358213, 781d67a, 77d4503); Cloud Functions + MCP server + Firestore rules code complete; comprehensive mobile + WCAG 2.2 AA audit applied across 8 pages and components (commits 150da11 through 783d419). MobileAdvisory banner removed (783d419) — site no longer needs the "best on desktop" hedge.

What needs operational action (not code work):
1. **Generate a Firebase service-account JSON.** Firebase Console > Project settings > Service accounts > Generate new private key. Save to a gitignored path (scripts/firebase/ is already gitignored). Required for the next steps.
2. **Deploy Cloud Functions to new Firebase project.** Requires Blaze billing on `civil-rights-history-project` + `firebase functions:secrets:set OPENAI_API_KEY` + `firebase deploy --only functions`.
3. **Deploy MCP server to Fly.io.** Requires `flyctl auth login` then `fly deploy` in `mcp-server/`.
4. **Run pipeline on the 135 transcripts.** From the project root: `python "Metadata Generation System/run_sample.py"` runs the smallest transcript end-to-end and dumps JSON. The Flask UI at `python app.py` handles batch submission. Cost ~$0.04 per transcript at the dual-scoring + citation-audit threshold (measured on the 2026-05-22 PoC: Maynard E. Moore, 152-line .srt, ran in 64.6s, cost $0.0348, scored Accuracy 85 / Quality 80 on the OpenAI scorer's first attempt). At ~$0.04 per transcript, the full 135-transcript corpus is ~$5.40.
5. **Push pipeline outputs to Firestore.** `node scripts/pipeline-to-firestore.mjs --input <pipeline.json> --service-account <sa.json>` writes the JSON into interviewIndex/{slug}/subSummaries/{chapter_NN} in the new Firebase. --dry-run validates the shape without auth.
6. **Open PR to upstream** `jsovelove/civil-rights-history-project`. Currently 118 commits ahead.

Complete deployment chain (post-2026-05-22):
- Python pipeline (Metadata Generation System/run_sample.py) -> JSON dump
- Node bridge (scripts/pipeline-to-firestore.mjs) -> Firestore writes
- React app (src/) reads Firestore via VITE_FIREBASE_* env vars
- Cloud Functions (functions/) provide vector search + feedback submission once deployed

What's NOT load-bearing for Wednesday: any further mobile polish, any further accessibility sweep, any further pipeline hardening. The five-track core overhaul is done; what remains is ops + content generation.

## Architecture

Five subsystems, each in its own directory:

- **`src/`** -- React 18 + Vite frontend. Pages: Home (scroll-driven timeline), Interview Index (card grid with semantic search), Playlist Builder (cross-interview clip assembly), Topic Glossary (force-directed graph of AI-curated topics), Review Queue (admin UI for the human-review gate).
- **`functions/`** -- Firebase Cloud Functions (Node.js). `generateEmbedding`, `vectorSearch`, `submitCannyFeedback`. The OpenAI key lives here, not in the client bundle.
- **`Metadata Generation System/`** -- Standalone Python/Flask 7-step pipeline (blocking → labeling → TOC → chapterization → summarization → tuning → engagement). This is the hallucination hot zone.
- **`mcp-server/`** -- Node MCP server exposing the archive via three tools (`search_transcripts`, `get_transcript`, `list_leaders`) for Claude Desktop and Claude.ai Custom Connectors. Deployable to Fly.io.
- **`scripts/`** -- Admin scripts (Firestore migration, Firebase data tools, vectorization). Do not delete without explicit confirmation; some are reference material.

## The Smithsonian-grade publication gate (new in May 2026 overhaul)

The original pipeline scored summaries at 80/80 accuracy/quality and kept the best-of-3 even if no attempt passed -- letting hallucinations through. The new gate:

1. **`processor/claude_scorer.py`** -- Independent Claude Opus 4.7 scorer that runs after the OpenAI tuning loop. Same rubric, separate model family (no blind-spot risk).
2. **`processor/citation_check.py`** -- Per-claim audit: every factual claim in the summary must map to a transcript passage that establishes it.
3. **`processor/review_queue.py`** -- Producer that enqueues failed-gate summaries into a Firestore `review_queue` collection. The React `src/pages/ReviewQueue.jsx` is the consumer.
4. **`processor/dual_scoring_helper.py`** -- Feature-flag dispatcher. `USE_DUAL_SCORING=1` env var routes through the dual path; default is bare OpenAI.
5. **`processor/tuning.py`** -- Original OpenAI scoring loop, now with type-coercion guards on model output and threaded `near_threshold_tolerance` / `min_improvement` parameters.

The publication threshold is 90/90 on BOTH scorers independently. Disagreement (one passes, one fails) routes to human review -- the gate fails closed rather than publishing on a coin flip.

## Ground-truth corpus

`Metadata Generation System/civil_rights_facts.json` -- 60 entries (51 with alias lists) covering Big Six leaders, SCLC inner circle, foundational pre-Movement intellectuals (Du Bois, Wells, Murray, Height), major events, legal precedents (Brown, Plessy, Loving), and LBJ as federal-executive grounding. `processor/shared.py::get_relevant_facts` consults this corpus to ground the LLM scorer's accuracy claims.

Validate with `python scripts/validate_facts.py` (runs in `Metadata Generation System/`).

## Audit documentation discipline (READ THIS IF YOU TOUCH THE TRANSCRIPT AUDIT)

The transcript-audit work has accumulated four core governance documents at `transcripts/`. Any agent doing work that affects the audit overlay, the per-entry corrections, the audit-progress tracking, or the open-problems queue MUST follow the discipline below. The documents are designed to be machine-parseable (downstream scorers + ensemble reviewers) and human-readable (project stakeholders + the Smithsonian/LoC institutional review).

### The four governance documents

| Document | Purpose | Update discipline |
|---|---|---|
| `transcripts/AUDIT_TRAIL.md` | Longitudinal effort log across sessions, agents, and models. Records WHAT was done, WHEN, BY WHOM, with WHAT COVERAGE. The data substrate for inferential error-rate scoring. | **Per-phase incremental updates, not session-end-only.** Every multi-step session creates a new `### Session N` entry near the top of the `## Session log` section. Each phase appends a sub-section as it completes (not when the whole session ends). Follow the "Session entry template" at the bottom of the file. |
| `transcripts/OPEN_PROBLEMS.md` | Active punch-list of what still needs doing. Numbered Problems (1, 2, 3, ...) — never delete, only annotate as RESOLVED with a dated sub-section that preserves the original entry below. | Mark resolved Problems with `## Problem N — <title> — **RESOLVED YYYY-MM-DD (Phase/Session reference)**` followed by a `### Resolved YYYY-MM-DD <date qualifier>` sub-section, then a preserved-for-history sub-section. New problems get appended as `## Problem N+1` with current `**Last updated:** YYYY-MM-DD` at the top of the file. |
| `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` | The corrections overlay — per-entry Pass 1/2/3/4 tables with row IDs, Whisper renderings, canonical corrections, confidence tiers, source attribution. ~9.3 MB, ~26,000+ lines as of 2026-05-22. | **Non-destructive overlay**: `transcripts/raw/` files are NEVER modified. Corrections accumulate here. Per-entry tables use the row-ID convention `<entry>.<row>` for Pass 1, `<entry>.P2.<row>` for Pass 2, `<entry>.P3.<row>` for Pass 3, `<entry>.P4.<row>` for Pass 4, and `<target>.P2.RELOC[<source>.P2.<row>]` for cross-contamination relocations. Confidence tiers: `correct` / `high` / `medium` / `low` / `speaker-originating` / `flagged-for-adversarial-review` / `n/a`. |
| `Metadata Generation System/civil_rights_facts.json` | Ground-truth corpus (140 entries, 291 aliases as of 2026-05-22). Used by `processor/shared.py::get_relevant_facts` to ground the LLM scorer's accuracy claims. | **Additions only — no deletions of existing entries.** Validate after every edit with `cd "Metadata Generation System" && python scripts/validate_facts.py`. The validator catches schema regressions and alias collisions. |

### Per-phase update protocol for AUDIT_TRAIL.md

When a session has multiple phases:

1. **At session start:** add a new `### Session N — YYYY-MM-DD: <short label>` entry near the top of the `## Session log` section. Initialize with End-of-session summary placeholder, Agents, Wall-clock, Scope, Methodology fields. Add placeholder sub-section headers for each anticipated phase (`#### Phase 1`, `#### Phase 2`, etc.) with `*(populated when Phase N completes)*`.
2. **At each phase completion (before the phase's commit):** replace the placeholder with the real phase sub-section. Include: agents spawned (counts), wall-clock, files created/modified, coverage metrics, anomalies surfaced, handoff notes for the next phase.
3. **At session close:** populate the End-of-session summary at the top of the entry (one paragraph: what got done, next priority, blockers).
4. **The commit that lands phase N's code/data changes MUST also include the phase N sub-section update.** Atomicity matters — if the session terminates between phase completion and doc update, the docs lie.
5. **For follow-on work after the session is "closed":** append a sub-section to the existing Session N entry (e.g., `#### Phase 1a follow-on — cross-contamination cleanup (2026-05-22 evening)`). Do NOT create a new Session N+1 entry for follow-on work to the same session.

### Cross-session coordination

If two sessions are running in parallel (which has happened — Session 3 + Session 4 ran simultaneously on 2026-05-22), they each maintain their own session entry in AUDIT_TRAIL.md. Add a "Coordination note" in the late-arriving session's entry explaining what the parallel session was doing and where their work fits in the broader audit history.

### Inferential-scoring-framework hookup

`transcripts/AUDIT_TRAIL.md` has an "Inferential scoring framework" section that defines per-entry uncertainty scoring. The Per-entry coverage matrix is the structured input to that framework. Any agent that adds rows to the coverage matrix or modifies the Pass coverage flags (F/P/T/S/R/D/M) should preserve the structure so downstream scorer scripts can parse it.

## Pass 8: LoC canonical-archive cross-reference (2026-05-25)

**Pass 8 is the eighth audit pass and the FIRST one anchored to a primary external authority (the Library of Congress's own published transcripts) rather than internal review or ground-truth corpus matching.** It is the architectural endpoint of the audit cascade for the existing 127-entry corpus and the primary correction pipeline for NEW transcripts arriving after 2026-05-25 (see "Streamlined ingestion" below).

**Coverage:** 127 of 127 (100%) audit-able entries healed against LoC reference text. 92 entries via LoC's TEI2 XML transcripts; 35 entries via pypdf-extracted text from LoC's transcript PDFs (only fallback because XML wasn't published for those interviews). Zero genuinely audio-only entries — every interview in the LoC CRHP collection has at least a PDF transcript that we can text-extract.

**Workflow (per entry):**
1. **Resolve** the entry's interviewee to its LoC item URL via `transcripts/loc_healing/resolve_loc_items.py` (LoC `/search` API search by name) or `transcripts/loc_healing/resolve_pdf_fallback.py` (PDF fallback when XML isn't published) or `transcripts/loc_healing/resolve_by_item_url.py` (direct-resolve for catalog-spelling discrepancies like LoC "Newson" vs our "Newsom").
2. **Align** our Whisper-derived `.srt` against LoC's transcript text at the word level via `transcripts/loc_healing/heal_one_entry.py phase1`. Output: per-entry divergence list in `transcripts/loc_healing/divergences/<subject>.divergences.json`.
3. **Classify** each divergence under the conservative-first-pass discipline (deterministic verdicts only — no model call in the loop): contraction expansion / number↔word / function-word insert-delete / LoC bracketed stage-direction insert / hyphen-compound false-start / short-needle proper-noun phonetic substitution. Everything outside those clean buckets is `NEEDS_SME_REVIEW` and preserved verbatim.
4. **Apply** the `ASR_ERROR_HEAL` verdicts surgically — token-level replacements inside the existing SRT/VTT cue boundaries; no timestamp drift, no segment restructuring. The `.txt` is patched via in-place substring substitution preserving its original continuous-line format.
5. **Audit-canon safeguard** prevents auto-reversal of prior audit decisions: if `our_token` is already in the master MD's correction-table set for this entry, the heal is skipped and the case is flagged `UNCLEAR` for SME review. Verified to have prevented reversal of e.g. Aaron Dixon's audit-confirmed "Madison Valley" against LoC's "Harrison Valley".
6. **Stage file** written to `transcripts/pass8_stage/entry_<NNN>_<slug>.md` documenting every heal applied + every divergence preserved + every NEEDS_SME_REVIEW case. The per-entry institutional-audit artifact, parallel to `pass2_stage/` ... `pass7_stage/`.
7. **Master MD backport** via `transcripts/loc_healing/backport_pass8_to_master_md.py` — emits `<entry>.P8.X` correction-table rows that reproduce the heals when `scripts/apply_corrections.py` runs from `raw/` + master MD. Two-tier strategy: DIRECT rows for universal substitutions; CONTEXT-EXTENDED rows for position-specific heals (uses 2-9 surrounding words to make the phrase unique). Position-specific heals whose unique-context-extension fails stay in `corrected/` + `pass8_stage/` only (not in master MD).

**Linear LoC API access is mandatory.** No parallel subagents touching `loc.gov` or `tile.loc.gov`. The polite delay is 1.5s/request. LoC will throttle / ban aggressive scrapers. See `feedback_linear_loc_api` memory.

**The 710-row AUDIT_VS_LOC_DISAGREEMENTS report** (`transcripts/loc_healing/AUDIT_VS_LOC_DISAGREEMENTS.md`) catalogues every case where the audit-canon safeguard fired — i.e., where our audit-promoted spelling conflicts with LoC's authoritative text. SME-reviewable conflicts grouped by entry. The categories that show up: genuinely-different-people (Bertha vs Roberta), spelling variants (Carsie vs Carsey), style choices (Sam vs Samuel), and Whisper-error leakage into our own audit-canon (Joanne vs JoeAnn — our directory itself says JoeAnn but a prior audit row promoted Joanne).

## Streamlined ingestion for new transcripts (DEPRECATES Passes 1-7 for new entries)

`transcripts/ingestion/README.md` + `transcripts/ingestion/ingest_new_transcript.py` together replace the seven-pass improvised journey for any new transcript that arrives in the corpus AFTER 2026-05-25. The seven-pass journey on the original 127 was largely about discovering Whisper failure patterns and building the ground-truth substrate; that substrate now exists, so new interviews can be corrected in ONE pass.

**The single command** that ingests a new entry:
```
python transcripts/ingestion/ingest_new_transcript.py "<Subject>_interview_<YYYYMMDD>_<HHMMSS>"
```

Does: validate raw structure → bootstrap `corrected/<entry>/` from raw → resolve LoC item (XML first, PDF fallback, direct-URL override available via `--loc-item-url`) → run `heal_one_entry.py heal_one` → write per-entry stage file → append ingestion note to AUDIT_TRAIL.md.

**Do NOT run Passes 1-7 on new transcripts.** That pipeline was designed before LoC integration existed. The Pass 8 architecture (LoC heal + conservative auto-apply + SME review of flagged divergences) catches the same Whisper-error class with much less hand-tuning. The legacy Pass 1-7 documentation in `transcripts/AUDIT_TRAIL.md` is historical record for the 127-entry corpus; it is not a template for new work.

**Format adapters** for non-Whisper input (PDF-only transcripts, plain text, WhisperX JSON) are documented in `transcripts/ingestion/README.md` — TODO section noting the synthesized-timestamp fallback for text-only sources (which loses fine-grained playlist-generator clip precision; avoid unless audio is unavailable).

### Why this discipline matters

The Smithsonian (NMAAHC) and Library of Congress are gating publication on AI-hallucination-fact-check rigor. The audit overlay + AUDIT_TRAIL are the institutional credibility instrument. A future reviewer or replacement engineer must be able to read these documents and reconstruct exactly what was audited, by whom, with what coverage, and what residual error remains. Per-phase incremental updates prevent the docs from drifting out of sync with the actual state of the corpus.

### Recent example commits to follow as templates

- `e0a1dbf` — Session 3 Phase 5 finalization (aggregate metrics + end-of-session summary)
- `847f763` — Cross-contamination follow-on cleanup (sub-section added to existing Session 3 Phase 1a, not a new session entry)
- `e325d79` — Session 4 initial entry + Session 3 Phase 1 back-fill (cross-session coordination note example)
- `6a70838` — Layer 5 corpus-global fidelity sweep (4-dimension audit, advisory artifacts, Session 3 follow-on sub-section)
- *(post-Layer-5-deploy commit, this session)* — Layer 5 fidelity-deploy follow-on (770 phantom removals + 1,483 ensemble annotations + 7 normalizations; added as sub-section to existing Session 3 Layer 5 entry, not a new session)

## Documentation map

The project has ~17 human-facing markdown documents plus ~440 per-entry staging files. The staging files are machine-generated (Pass 2/3/4 supervisor outputs + per-entry slices) — new agents should NOT read them as documentation; they're audit artifacts consumed by merge scripts. The human-facing documents are:

### Root-level

| File | Purpose |
|---|---|
| `README.md` | Public-facing project overview for GitHub viewers (corpus description, what the system does) |
| `CLAUDE.md` (this file) | Project-wide conventions for AI-agent contributors. Auto-loaded into every agent's context. **The first thing any new agent should rely on for project orientation.** |
| `CONTRIBUTORS.md` | Human contributor credits |
| `lessons_learned.md` | Conceptual + categorical analysis of the seven-pass audit cascade, the Whisper-error taxonomy we observed (phonetic confusion, ASR name-bleed, short-needle substitution corruption, audit-canon leakage), and the process-governance lessons (apply-step discipline, word-boundary safety, commit+push at every moderate milestone). Companion to PRESENTATION_REFERENCE.md. |
| `PRESENTATION_REFERENCE.md` | The conceptual-map briefing for the WWU presentation (and any external stakeholder summary). Eight conceptual breakthroughs from the audit work; the coverage table; implications for the user-facing product. Slide-friendly summary; less detail than lessons_learned.md. |

### `docs/` — architecture + decision records

| File | Purpose |
|---|---|
| `docs/ACCESSIBILITY.md` | WCAG 2.2 AA + mobile audit findings + accessibility-token reference (`text-civil-red-body`, focus-visible rule, prefers-reduced-motion handling) |
| `docs/DEPLOYMENT.md` | End-to-end deployment chain (Python pipeline → Node bridge → Firestore → React + Cloud Functions + MCP server) |
| `docs/TRANSCRIPT_AUDIT_DESIGN.md` | Original architectural design for the three-stage audit cascade (exact/alias match → phonetic+edit-distance fuzzy → LLM disambiguation). Read this before adding new audit infrastructure. |
| `docs/WEAVIATE_INTEGRATION_DESIGN.md` | Original RAG-substrate design when the plan was Weaviate. **HISTORICAL** — the substrate decision pivoted to Pinecone Builder + Voyage AI on 2026-05-22. Kept for design-decision provenance. Current substrate documented in `docs/RAG_SUBSTRATE_DECISION.md` and `rag/README.md`. |
| `docs/RAG_SUBSTRATE_DECISION.md` | The decision record explaining why Pinecone Builder + Voyage AI was chosen over self-hosted Weaviate / Supabase pgvector. Covers alternatives considered, weighting criteria, what was explicitly deferred, and migration triggers that should re-open the decision. |

### `transcripts/` — audit governance documents + audit outputs

| File | Purpose |
|---|---|
| `transcripts/AUDIT_TRAIL.md` | Longitudinal effort log across sessions (see "Audit documentation discipline" above). Read for full audit history + inferential-scoring framework + per-entry coverage matrix. |
| `transcripts/OPEN_PROBLEMS.md` | Active punch-list of remaining cleanup work (see "Audit documentation discipline" above). Read to see what's still open vs RESOLVED. |
| `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` | The ~9.3 MB master correction overlay (see "Audit documentation discipline" above). Read sections by entry: `### N. Subject`. The catalog at the top (sections A–I + Phase 1b extensions J–P + Z catch-all) documents recurring Whisper-failure patterns. |
| `transcripts/cross_contamination_audit_summary.md` | Human-readable summary of the 2026-05-22 cross-contamination follow-on cleanup (catches Pass 3 + Pass 4 retraction signals beyond Phase 1a's original 22-item fix). Full data in `cross_contamination_audit.json`. |
| `transcripts/layer5_fidelity_audit_summary.md` *(may not exist yet — generated by Layer 5 sweep)* | Human-readable summary of the corpus-global fidelity sweep across phantom Whisper renderings, bidirectional canonical consistency, catalog-vs-per-entry contradictions, and cross-entry biographical consistency. Full data in `layer5_fidelity_audit.json`. |
| `transcripts/session_prompts/archive/*.md` | Archived session prompts from completed sessions (per the single-use-prompt convention — once a session executes a `NEXT_SESSION_PROMPT.md` they archive-and-delete it to prevent re-execution). Read for historical context on prior session scoping. |

### `transcripts/loc_healing/` — Pass 8 LoC canonical-archive cross-reference (2026-05-25)

| File | Purpose |
|---|---|
| `transcripts/loc_healing/heal_one_entry.py` | Per-entry heal toolkit. Modes: `phase1` (parse LoC source + corrected SRT, word-align via difflib, emit per-entry divergences JSON with deterministic verdicts inlined), `apply` (apply verdicts to .srt/.txt/.vtt within existing cue boundaries), `verify` (cue-count parity check between SRT and VTT), `heal_one` (combined pipeline). |
| `transcripts/loc_healing/resolve_loc_items.py` | LoC `/search` API resolver — finds the LoC item URL for each interviewee by name, downloads TEI2 XML transcript where published. Polite-delayed (1.5s/request). Output: per-entry resolution.json + cached XML in `loc_cache/`. |
| `transcripts/loc_healing/resolve_pdf_fallback.py` | PDF-fallback resolver for entries where LoC has no machine-readable XML (35 of the original 127). Downloads LoC's transcript PDF, runs `pypdf` text extraction, caches as `<subject>.pdf.txt`. |
| `transcripts/loc_healing/resolve_by_item_url.py` | Direct-resolve helper for catalog-spelling discrepancies (LoC "Newson" vs our "Newsom", "Wheeler Parker" without our "Jr.", etc.). Bypasses search-by-name; takes a known LoC item URL and resolves directly. |
| `transcripts/loc_healing/process_batch.py` | Sequential per-entry driver. Iterates `corrected/` alphabetically and runs `heal_one_entry.py heal_one` on each entry that has its LoC source cached. Linear by design — no concurrency. |
| `transcripts/loc_healing/backport_pass8_to_master_md.py` | Backport tool that inserts `<entry>.P8.X` correction-table rows into `CLEANED_TRANSCRIPTS_REVIEW.md`, so `scripts/apply_corrections.py` reproduces the Pass 8 heals from raw/ + master MD. Two-tier strategy (direct + context-extended). Idempotent. |
| `transcripts/loc_healing/loc_cache/` | Cached LoC content (one set per entry): `<subject>.xml` + `.resolution.json` for XML-source entries; `<subject>.pdf` + `.pdf.txt` + `.resolution.json` for PDF-source entries; `_index.json` aggregate coverage. |
| `transcripts/loc_healing/divergences/` | Per-entry divergence streams: `<subject>.divergences.json` — the raw alignment + deterministic-verdict output that both feeds `apply` and serves as the SME-review input. |
| `transcripts/loc_healing/COVERAGE_REPORT.md` | Pass 8 aggregate coverage report. 127/127 entries healed (92 via XML, 35 via PDF). Per-entry source kind, heal counts, and failure-mode breakdown. |
| `transcripts/loc_healing/AUDIT_VS_LOC_DISAGREEMENTS.md` | 710 SME-reviewable conflicts where Pass 8's audit-canon safeguard fired (our prior-pass-promoted spelling disagrees with LoC's authoritative text). Grouped by entry, sorted by per-entry disagreement count. Categories: genuinely-different-people, spelling variants, style choices, Whisper-error leakage into our own audit-canon. |

### `transcripts/pass8_stage/` — Pass 8 per-entry institutional-audit artifacts

127 files (one per entry that was healed) at `transcripts/pass8_stage/entry_<NNN>_<slug>.md`. Per-entry file documents: LoC item URL + match metadata; divergence counts (detected / healed / preserved-verbatim / flagged-for-SME-review); per-correction table (cue index + our token + LoC token + reasoning); preserved-verbatim table; SME-review-flagged table. Parallel to the existing `pass2_stage/` ... `pass7_stage/` naming convention.

### `transcripts/ingestion/` — Streamlined ingestion for new transcripts (DEPRECATES Pass 1-7)

| File | Purpose |
|---|---|
| `transcripts/ingestion/README.md` | The full new-transcript workflow documentation: TL;DR command, format adapters (WhisperX JSON / PDF-only / plain-text source), pre-ingest requirements, validation checklist, the "what if LoC doesn't have it" fallback. |
| `transcripts/ingestion/ingest_new_transcript.py` | The single-command ingestion script. Validate raw entry structure → bootstrap `corrected/<entry>/` → resolve LoC → heal_one → write stage file → append AUDIT_TRAIL ingestion note. One transcript per invocation; linear by design. Supports `--loc-item-url` override for catalog-spelling cases. |

### Component-level `README.md` files

| File | Purpose |
|---|---|
| `rag/README.md` | Architecture + setup + metadata-schema reference for the Pinecone + Voyage RAG layer. Read before touching `rag/ingest.mjs`, `rag/retrieve.mjs`, or related code. |
| `rag/CONFERENCE_PREP.md` | London-conference brief (2026-06): what's in the corpus, how the embeddings represent it, what queries the presentation will exercise, what's still left to wire up. The "philosophy of embedding" framing for stakeholder communication. |
| `rag/INTERACTIVE_FEATURES_DESIGN.md` | Design doc for the interactive connection-display layer (SemanticSearch, QuoteFinder, RelatedPassages, Constellation). Substrate → precompute → UI architecture diagram, per-feature interfaces, the shared citation-grade payload contract, build order, deployment manifest, cross-corpus portability pattern (civil-rights ↔ worldthought.com), open design questions. **Read this before integrating the rag/ components into React pages or porting the pattern to worldthought.com.** |
| `mcp-server/README.md` | Engineering reference for the MCP server (post-2026-05-25 Pinecone+Voyage rewire). Architecture, local dev, deployment, env vars, citation-payload shape. |
| `mcp-server/USAGE_GUIDE.md` | End-user / researcher / Anthropic-Connector-Directory submission doc. Audience, what's in the corpus, connection setup, three worked examples (grant citation, quote verification, curriculum dev), citation format reference (Chicago/APA/MLA), provenance/transparency notes. **Read this if asked about how to use the MCP connector or its value proposition.** |
| `netlify/functions/README.md` | Netlify Function endpoints (server-side proxies that keep API keys out of the client bundle). Currently: `retrieve.mjs` for the public semantic-search proxy used by the frontend RAG components. |
| `functions/README.md` | Cloud Functions (Firebase) layer documentation |

### `Metadata Generation System/` — the Python pipeline

| File | Purpose |
|---|---|
| `Metadata Generation System/Metadata Generation Documentation.md` | The original Python/Flask 7-step pipeline documentation (blocking → labeling → TOC → chapterization → summarization → tuning → engagement). Read before touching `processor/*.py`. |
| `Metadata Generation System/StandardizedRubric_1.md` | The Smithsonian-grade scoring rubric used by the dual-scorer + citation-auditor. **The reference rubric for what "publication-grade" means.** |

### Per-pass audit staging (machine-generated, ~440 files)

These directories contain one file per audit-able entry per pass. They are intermediate audit artifacts consumed by merge scripts (`merge_pass2.py`, `merge_pass2_tail.py`, `merge_pass3.py`, and the Session 4 Pass 4 merge in commit `32516a3`). **A new agent doing audit work should NOT read these files for project context** — read the merged result in `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` instead.

| Directory | Count | Purpose |
|---|---|---|
| `transcripts/pass2_stage/` | 90 files | Session 2 Phase A Pass 2 per-entry corrections (entries #43–#132) |
| `transcripts/pass2_tail_stage/` | 14 files | Session 2 Phase B Pass 2 tail-sweep for the 14 entries that had Pass 1 partial reads (#1, #6, #7, #8, #12, #13, #14, #17, #20, #26, #29, #30, #34, #38) |
| `transcripts/pass3_stage/` | 127 files | Session 2 Phase C Pass 3 consolidation per entry (confidence resolutions, adversarial-review flags, ground-truth corpus candidates, missed-pattern catches) |
| `transcripts/pass4_stage/` | 127 files | Session 4 Pass 4 sweeping QA + fact-check per entry (one-transcript-per-agent strict isolation) |
| `transcripts/pass5_stage/` | 126 files | Session 3 Layer 5 corpus-global fidelity findings, per-entry sliced (D1 phantom Whisper renderings, D2 bidirectional canonical inconsistencies, D3 catalog-vs-per-entry contradictions). Generated by `transcripts/build_pass5_stage.py` from `layer5_fidelity_audit.json` — derivative of the corpus-global audit, structured per-entry for institutional auditability and Google Drive sharing. |
| `transcripts/per_entry_slices/` | 127 files | Session 4 cross-contamination firewall slices — each agent reads ONLY its own slice, never the master MD. Built by `transcripts/slice_master_md.py`. |

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
- **New agent doing LoC-healing or new-transcript work:** this CLAUDE.md, then `transcripts/ingestion/README.md` and `transcripts/loc_healing/COVERAGE_REPORT.md`. Read `transcripts/AUDIT_VS_LOC_DISAGREEMENTS.md` if the heal pipeline surfaces issues. **Do not re-run Passes 1-7 on new transcripts** — that pipeline is retired for new work.
- **New agent doing RAG-related work:** this CLAUDE.md, then `rag/README.md`, `rag/CONFERENCE_PREP.md`, and `docs/RAG_SUBSTRATE_DECISION.md`.
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

- **Pinecone index `civil-rights`** (1024-dim, cosine, AWS us-east-1) — created via REST API on 2026-05-25 23:00 UTC. **Co-mingled with `worldthought` in the same Pinecone project** (shared host hash `odc9z70`); separating into project-scoped keys is a follow-on (see `rag/.env.local` header for the migration path). Index is **Ready**; first ingest is running (~40k vectors, ~30-60 min wall-clock).
- **Netlify `civil-rights-staging` env vars** — `PINECONE_API_KEY`, `PINECONE_HOST`, `PINECONE_INDEX`, `VOYAGE_API_KEY`, `VOYAGE_MODEL`, `VOYAGE_RERANK_MODEL` all set via Netlify MCP. The first attempt with `envVarIsSecret: true` failed silently for the API keys — they were re-upserted as non-secret. **Lesson:** when Netlify env-var setting "succeeds" but the value never appears in subsequent `getAllEnvVars` listings, the secret-flag + `context: "all"` combination silently rejects the upsert.
- **`/retrieve` Netlify Function** — deployed at `b935c03`+. After env var fix, requires another deploy to cycle the function's `process.env` snapshot. Empty-commit pushes are the trigger.
- **`/rag-explore` page** — three-tab demo of SemanticSearch + QuoteFinder + Constellation, gated behind ProtectedRoute. Live at `https://civil-rights-staging.netlify.app/rag-explore`.

### What's NOT deployed

- **MCP server (Fly.io)** — `flyctl` is not installed on Eric's machine; `flyctl auth login` is interactive. Blocked on Eric installing the CLI + authenticating. The server code is rewired (commit `2c05cd8`) and ready to deploy.
- **Pinecone civil-rights as a SEPARATE project from worldthought** — would require Eric to provision via the Pinecone console + generate a new project-scoped API key. Current setup is functional but cohabitating in the worldthought project space.
