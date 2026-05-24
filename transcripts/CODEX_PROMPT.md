/goal Ship the Civil Rights History Project to publication-ready state before the 2026-05-27 WWU deadline by completing the 6 priorities documented in transcripts/CODEX_MASTER_PROMPT.md: (1) apply 330 Subject paragraph corrections from transcripts/subject_paragraph_corrections_pass7.json to master MD + transcripts/corrected/; (2) expand Metadata Generation System/civil_rights_facts.json from 140 to ~390 entries via transcripts/ground_truth_proposals_pass7.json + validate_facts.py passes; (3) run pipeline + dual scoring + citation audit on all 131 transcripts; (4) push outputs to Firestore via scripts/pipeline-to-firestore.mjs; (5) deploy Cloud Functions + MCP server (Fly.io) + RAG ingest (Pinecone+Voyage); (6) open upstream PR to jsovelove/civil-rights-history-project. transcripts/AUDIT_TRAIL.md Session 7 maintained with per-phase atomic commits. Working tree clean. Verification per transcripts/CODEX_MASTER_PROMPT.md "Verify before you claim done" passes for each priority.

You are picking up the Civil Rights History Project. The 7-pass audit cascade is complete; deployment + apply remain. Deadline 2026-05-27 (3 days).

READ FIRST (5 min orientation):
1. `CLAUDE.md` (project root) — conventions, "Things that look broken but aren't"
2. `transcripts/CODEX_MASTER_PROMPT.md` — comprehensive handoff: mission, 7-session history, file map, 13 hard-stop publication blockers (Greyhound/Trailways reversal entry 9, Briggs co-counsel entry 87, Sammy Davis pallbearer entry 125, etc.), ASR-bleed catches (Paul Hoffman/Robeson entry 62, Ruby Sales meaning-inversion entry 112), priority-by-priority execution detail, verification gates
3. `transcripts/OPEN_PROBLEMS.md` — active punch-list (Problems 1, 5, 6, 9 open; 2, 3, 4, 7, 8 RESOLVED)

Then execute the 6 priorities in /goal order.

OPERATING RULES (non-negotiable):
- **Cross-contamination firewall:** per-entry agents read ONLY their entry's slice at `transcripts/per_entry_slices/`, NEVER the master MD directly. Pass 4/6/7 enforced this architecturally.
- **Per-phase atomicity:** every commit that lands phase code/data MUST also include the corresponding AUDIT_TRAIL Session 7 sub-section update. Atomic. If the session terminates between work and doc, the docs lie.
- **Commit + push at every moderate milestone.** Uncommitted working tree is a process failure, not "work in progress." Pair every commit with its push.
- **Smithsonian fail-closed gate:** dual scoring 90/90 threshold on BOTH Claude + OpenAI scorers; disagreement routes to Firestore `review_queue`. Never bypass.
- **No token throttling, no sleep-pulsing.** Eric is on Claude Max 20x with unused weekly headroom. Optimize wall-clock, not cache.

DOCUMENT YOUR WORK:
- Open Session 7 at the top of `transcripts/AUDIT_TRAIL.md` Session log. Initialize with 6 Phase placeholders matching the priorities. Populate each as it completes per the template at the bottom of the file.
- Mark OPEN_PROBLEMS Problems RESOLVED as you close them. Preserve original text below a `### Resolved YYYY-MM-DD` sub-section. Bump the top-of-file `**Last updated:**` line.
- At session close: author `transcripts/NEXT_AGENT_PROMPT_<date>_codex-completed.md` modeled on this prompt. Archive per the single-use-prompt convention (see `transcripts/session_prompts/archive/` for examples).

VERIFICATION: For each priority, the verification gate in `transcripts/CODEX_MASTER_PROMPT.md` Section "Verify before you claim done" must pass before moving on. Don't skip to the next priority on optimism.

WHEN STUCK: `transcripts/AUDIT_TRAIL.md` (prior-session patterns) → relevant Pass 7 PRR staging file at `transcripts/pass7_stage/entry_NNN_*.md` → CLAUDE.md "Things that look broken but aren't" → ask Eric.

The audit is done. Now ship it.

— Claude Opus 4.7, closing Pass 7, 2026-05-24
