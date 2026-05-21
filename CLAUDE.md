# Civil Rights History Project — Codebase Guide

Project context: an open-source AI system that transforms the Library of Congress Civil Rights History Project oral history archive (600+ hours of interviews, produced in collaboration with the Smithsonian NMAAHC) into structured, searchable metadata. The Smithsonian has been scrutinizing the team's AI-generated summaries for hallucinations -- the quality bar is "Smithsonian-grade publication," not "good enough for a research demo."

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

## Things that look broken but aren't

- The legacy `llm-hyper-audio` references in `scripts/firebase/*.cjs` are by filename only -- the actual service-account JSON files are gitignored. Don't try to "fix" the filenames.
- `script_chapters_batch` in `tuning.py` returns an empty list on length mismatch -- this is intentional fallback to per-chapter scoring, not a silent failure.
- `MobileAdvisory` looks like an overlay but is actually a dismissable banner -- the original `MobileOverlay` hard-block was replaced in the overhaul.
