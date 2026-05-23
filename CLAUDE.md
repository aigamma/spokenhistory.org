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

### Why this discipline matters

The Smithsonian (NMAAHC) and Library of Congress are gating publication on AI-hallucination-fact-check rigor. The audit overlay + AUDIT_TRAIL are the institutional credibility instrument. A future reviewer or replacement engineer must be able to read these documents and reconstruct exactly what was audited, by whom, with what coverage, and what residual error remains. Per-phase incremental updates prevent the docs from drifting out of sync with the actual state of the corpus.

### Recent example commits to follow as templates

- `e0a1dbf` — Session 3 Phase 5 finalization (aggregate metrics + end-of-session summary)
- `847f763` — Cross-contamination follow-on cleanup (sub-section added to existing Session 3 Phase 1a, not a new session entry)
- `e325d79` — Session 4 initial entry + Session 3 Phase 1 back-fill (cross-session coordination note example)

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
