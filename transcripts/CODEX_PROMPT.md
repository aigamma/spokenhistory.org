# CODEX — Master prompt

**Created:** 2026-05-24 end-of-day, by Claude Opus 4.7
**For:** Codex (or whichever agent picks up the project next)
**Run this in:** The C:\civil project root.

---

## Who you are, what you're here to do

You are picking up the Civil Rights History Project at a critical handoff. **Seven audit passes** have been completed on the Library of Congress Civil Rights History Project oral-history corpus (~131 transcripts, ~600 hours of interviews, produced with the Smithsonian NMAAHC). The Smithsonian is the publication gatekeeper and the quality bar is **"Smithsonian-grade — zero AI hallucinations,"** not "good enough for a research demo."

**Hard deadline: 2026-05-27 (3 days from this handoff).** The next milestone is a WWU team meeting where the system needs to demonstrate end-to-end working state: pipeline → Firestore → React frontend → search + playlist + topic glossary → MCP server for Claude.ai Custom Connector.

**Your job is execution, not audit.** The audit is done. You apply the audit's recommended corrections + finish the deployment chain + open the upstream PR.

---

## READ THESE THREE FILES FIRST (5 minutes orientation)

In this order:

1. **`CLAUDE.md`** (project root) — project-wide conventions for AI-agent contributors. Auto-loaded into your context, but read it consciously once.
2. **`transcripts/CODEX_MASTER_PROMPT.md`** — comprehensive handoff doc (325 lines). Has the full file map, the seven audit sessions' histories, specific traps + gotchas (ASR-bleed artifacts, cross-entry pollution, hard-stop pipeline gates), and the priority-ordered work queue with concrete details. **This is your reference for any question this current prompt doesn't answer.**
3. **`transcripts/OPEN_PROBLEMS.md`** — active punch-list with current state of Problems 1, 5, 6, 9 still open; Problems 2, 3, 4, 7, 8 marked RESOLVED.

If after reading these three you have any question about a Pass 7 PRR finding for a specific entry, read that entry's staging file at `transcripts/pass7_stage/entry_NNN_*.md` — it's the authoritative source.

---

## Your mission, in priority order

**Priority 1 — Apply the 330 Subject paragraph corrections** *(estimated 2-3 hrs)*

Input: `transcripts/subject_paragraph_corrections_pass7.json` (106 entries / 330 claims; each entry has `corrected_subject_paragraph` ready to apply).

Output: master MD with corrected Subject paragraphs + re-run apply_corrections.py to propagate to `transcripts/corrected/<entry>/*.txt`.

Approach:
1. Write `transcripts/apply_subject_corrections.py` modeled on `transcripts/apply_low_conf_resolutions.py`. Reuse `entry_section_bounds` from `transcripts/fix_layer5_findings.py`. Make it idempotent (skip entries already corrected) and atomic.
2. For each entry where `corrected_subject_paragraph` is non-null: locate the `**Subject:**` line in master MD entry section, replace.
3. For entries with `claims_needing_fix` but no extracted corrected paragraph (~10-15 cases, parser missed them): read the per-entry staging file, apply the corrected paragraph manually.
4. Verify by spot-checking the 13 hard-stop blockers listed in `CODEX_MASTER_PROMPT.md` Section 3 Priority 1 (entries 9, 47, 49, 56, 58, 87, 96, 100, 102, 108, 125, 128, 130).
5. Re-run `python scripts/apply_corrections.py` to regenerate `transcripts/corrected/` output.
6. Commit + push.

**Priority 2 — Expand civil_rights_facts.json from 140 → ~390 entries** *(estimated 3-5 hrs)*

Input: `transcripts/ground_truth_proposals_pass7.json` (88 entries / 251 unique proposed canonical figures, recurrence-sorted).

Output: `Metadata Generation System/civil_rights_facts.json` with ~250 new canonical entries (filtering out parser noise).

Approach:
1. Read the `deduplicated_names` array. Filter out parser-noise names (entries with single-character names like "#", "1", "2", "Role", "Field", "Aliases to include" — these are markdown-table-header bleeds).
2. For each legitimate name, look up the figure (cross-reference with the per-entry PRR staging files for transcript evidence + Whisper aliases).
3. Build canonical entries matching the existing schema (see existing entries like Medgar Evers, James Forman). Required: `wikipedia_title`, `aliases` (include Whisper variants), `role`, `key_events` or `biography_summary`.
4. Validate after every batch of 20-30 names: `cd "Metadata Generation System" && python scripts/validate_facts.py`.
5. Commit + push in batches (don't accumulate hundreds of changes in one commit).

**Priority 3 — Run the pipeline + dual scoring + citation audit on all 131 transcripts** *(estimated 1-2 hrs cycle + ~$5.40 OpenAI cost)*

Prerequisites:
- Eric must have generated the Firebase service-account JSON (manual ops step from `CLAUDE.md` Current Sprint Status, item 1).
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `USE_DUAL_SCORING=1`, `FIREBASE_SERVICE_ACCOUNT_PATH=<path>` set in env.

Approach:
1. Verify single-transcript baseline: `python "Metadata Generation System/run_sample.py"`.
2. Launch batch via Flask UI: `python "Metadata Generation System/app.py"` and submit all 131 transcripts.
3. Output goes to `Metadata Generation System/uploads/` or wherever batch path resolves.
4. Monitor for failures: the dual-scoring gate routes failed-gate summaries to Firestore `review_queue`. The Smithsonian-grade threshold is 90/90 on BOTH scorers independently.
5. When done: `node scripts/pipeline-to-firestore.mjs --input <pipeline.json> --service-account <sa.json>` pushes outputs to Firestore.
6. Commit + push any pipeline artifacts that should be versioned (output JSONs, summary reports).

**Priority 4 — Deploy ops chain** *(manual ops + ~30 min execution)*

In strict order:
1. **Cloud Functions:** Eric flips Blaze billing on `civil-rights-history-project`, sets `firebase functions:secrets:set OPENAI_API_KEY`, then you run `firebase deploy --only functions` from project root. The deterministic-embedding-ID fix (commit `ec94c5d`) is already on HEAD; verify with `git log --oneline functions/index.js`.
2. **MCP server (Fly.io):** Eric runs `flyctl auth login`, then you run `fly deploy` in `mcp-server/`. Adjust `mcp-server/fly.toml` app name from placeholder `civil-rights-history-mcp` if needed.
3. **Firestore push:** After Priority 3's pipeline run, `node scripts/pipeline-to-firestore.mjs --input <pipeline.json> --service-account <sa.json>`.
4. **RAG ingest:** Eric provisions Pinecone index + Voyage API key, populates `rag/.env.local` with `PINECONE_API_KEY`, `PINECONE_HOST`, `VOYAGE_API_KEY`. Then you run `node --env-file=rag/.env.local rag/ingest.mjs` (~$2.10 one-time embedding cost).
5. **Netlify:** No deploy needed — the React app auto-redeploys on every push to `master`. Verify staging at https://civil-rights-staging.netlify.app after Firestore is populated.

**Priority 5 — Open upstream PR to jsovelove/civil-rights-history-project** *(estimated 30 min)*

The branch is ~225+ commits ahead of `upstream/master`. Write a thoughtful PR description summarizing:
- Seven-pass audit cascade (Pass 1 through Pass 7 + Layer 5)
- The dual-scoring + citation-auditor publication gate
- The Pinecone + Voyage AI RAG layer
- The deployment chain

```bash
git remote -v  # confirm upstream exists
gh pr create --base master --head master --repo jsovelove/civil-rights-history-project --title "..." --body "$(cat <<'EOF' ... EOF)"
```

Not deadline-critical — can land after the WWU meeting.

**Priority 6 — Run the Kiro/Kimi/Codex/Gemini ensemble on residual flags** *(parallel to other work, not blocking)*

912 `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]` flags + 130 D1 canonical phantoms + 179 D3 catalog contradictions remain in master MD per `OPEN_PROBLEMS.md` Problem 9. These are flagged for ENSEMBLE adjudication, not for Codex to solve directly. Feed the relevant rows to the ensemble queue (Eric coordinates with the ensemble). When ensemble results return, apply them via a script modeled on `transcripts/apply_low_conf_resolutions.py`.

**Priority 7 — Schedule entry 109 McClary re-transcription with Dustin** *(coordination, not execution)*

Entry 109 is the only NOT-READY entry. Per Pass 7 PRR, ~60-70% of the Whisper output is incoherent fragments. Coordinate with Dustin via WWU team channel to either obtain the LoC archive transcript OR schedule a fresh Whisper run with a different model. Track via `OPEN_PROBLEMS.md` Problem 1.

---

## How to work (rules you cannot violate)

### Cross-contamination firewall

When doing per-entry work (e.g., per-entry corpus expansion verification, per-entry Subject paragraph application that needs context), **read ONLY that one entry's files**. Never read the master MD directly from a per-entry agent invocation — use the slice at `transcripts/per_entry_slices/entry_NNN_*.md`. This is architecturally enforced — don't break it.

### Per-phase atomicity (CLAUDE.md mandate)

Every phase commits its code/data changes AND the corresponding AUDIT_TRAIL.md sub-section update in the SAME commit. If the session terminates between phase completion and doc update, the docs lie. This applies to your own work: a commit that lands Priority 1's apply-script must ALSO update AUDIT_TRAIL Session 7 with the Priority 1 sub-section.

### Commit + push at every milestone

Eric's standing rule (encoded in `~/.claude/projects/C--civil/memory/feedback_commit_push_milestones.md` and `CLAUDE.md`): "I always want everything pushed after every moderate milestone." Uncommitted working-tree state is a process failure. After any script produces output, any subagent batch returns, any doc update — `git add` + `git commit` + `git push`. Pair every commit with its push. **Never leave the working tree dirty across more than one task.**

### Smithsonian-grade fail-closed gate

The dual-scoring pipeline (Claude + OpenAI scorers, 90/90 threshold) and per-claim citation auditor FAIL CLOSED. Failed-gate summaries route to Firestore `review_queue` — they do NOT auto-publish. If you find yourself thinking "let me just ship this past the gate," stop. The gate is the institutional credibility instrument with the Smithsonian/LoC.

### Don't throttle, don't pulse work into sleeps

Eric is on Claude Max 20x with consistent unused weekly headroom + pre-paid overage credits never touched. Optimize for **wall-clock time and visible progress**, not tokens or cache. For burning through N independent items, use parallel subagents in one turn — NOT `/loop`. For genuine multi-hour persistence (overnight, scheduled cleanup), use `/schedule`. The 5-min Anthropic prompt cache TTL is a real constraint but should not dominate decisions.

---

## How to document your work

### Open a Session 7 entry in AUDIT_TRAIL.md

At the start of your work, insert a new Session 7 entry near the top of the `## Session log` section in `transcripts/AUDIT_TRAIL.md`. Follow the template documented at the bottom of that file. Initialize with placeholder phase sub-sections:

```
### Session 7 — 2026-05-25: Codex deployment + Subject paragraph application + corpus expansion

**End-of-session summary:** *(populated at session close)*

**Agents:** [parent model + subagent counts]

**Wall-clock:** *(populated at session close)*

**Scope:** Apply Pass 7 PRR Subject-paragraph corrections + expand corpus 140→390 + run pipeline + deploy ops + upstream PR.

| Phase | Scope | Status |
| --- | --- | --- |
| Phase 1 | Subject paragraph corrections apply-back (330 claims / 106 entries) | *(populated when complete)* |
| Phase 2 | civil_rights_facts.json expansion 140→~390 | *(populated when complete)* |
| Phase 3 | Pipeline run + dual scoring + citation audit on 131 transcripts | *(populated when complete)* |
| Phase 4 | Cloud Functions + MCP + RAG deploy + Firestore push | *(populated when complete)* |
| Phase 5 | Upstream PR to jsovelove/civil-rights-history-project | *(populated when complete)* |
```

### Update each placeholder as that phase completes

When a phase completes:
1. Replace the placeholder with a real Phase N sub-section per the template.
2. Include: agents spawned, wall-clock, files created/modified, coverage metrics, anomalies surfaced, handoff notes for the next phase.
3. The commit that lands the phase's code/data must ALSO include this AUDIT_TRAIL update (per-phase atomicity).

### Mark Problems RESOLVED as you close them

In `transcripts/OPEN_PROBLEMS.md`, when you finish a Problem:
1. Change its heading to `## Problem N — <title> — **RESOLVED YYYY-MM-DD (Session 7 Phase X)**`.
2. Add a `### Resolved YYYY-MM-DD <date qualifier>` sub-section explaining what was done.
3. Preserve the original problem-description text below the resolution marker (institutional history).

Don't delete Problems, ever. Only annotate as RESOLVED.

### Bump the OPEN_PROBLEMS "Last updated" line

After every significant Problem update, bump the `**Last updated:**` line at the top of `OPEN_PROBLEMS.md` with the new date + one-line summary.

### Update the master "Last updated" line at the top of OPEN_PROBLEMS.md

This is the one-line summary readers see first. Bump it with each milestone.

---

## Commit message style

Match the existing project style (read `git log --oneline | head -20` to confirm). Substantive multi-paragraph messages for non-trivial commits. The CLAUDE.md mandate is the lower bound; the project log shows the upper bound.

For every commit, include:
- One-line subject (≤72 chars)
- Body explaining WHY this change (not just WHAT)
- Files added/modified/deleted
- Coverage metrics if quantifiable
- Any incompletions or follow-on items
- Co-Authored-By: footer for AI contributors

---

## When you finish all priorities

Write your own session-close documentation:
1. Populate Session 7 End-of-session summary at the top of the Session 7 entry.
2. Close OPEN_PROBLEMS Problems you fully resolved.
3. Add new OPEN_PROBLEMS items if you surfaced new issues.
4. Write a `transcripts/NEXT_AGENT_PROMPT_<date>_codex-completed.md` — modeled on this prompt — that hands off to whoever picks up after you (per the project's single-use-prompt convention; see existing archived examples at `transcripts/session_prompts/archive/`).
5. After the next agent picks it up, they should archive your handoff prompt to `transcripts/session_prompts/archive/`.

---

## Verify before you claim "done"

For each priority, "done" means:

| Priority | "Done" verification |
| --- | --- |
| 1 (Subject corrections) | `grep -c "PASS-7-SUBJECT-APPLIED" transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` returns 106+; sample 10 random entries and confirm Subject paragraphs match the JSON's `corrected_subject_paragraph`. |
| 2 (Corpus expansion) | `python "Metadata Generation System/scripts/validate_facts.py"` passes; corpus has ≥350 entries with proper schema (aliases, role, biography). |
| 3 (Pipeline run) | `Metadata Generation System/uploads/` (or wherever batch path resolves) contains 131 output JSONs; failed-gate summaries are in Firestore `review_queue` for review. |
| 4 (Deploy ops) | Cloud Functions deployed (verify in Firebase Console); MCP server reachable at `<app>.fly.dev`; Firestore `interviewIndex` populated; Pinecone index has 131 documents worth of vectors. |
| 5 (Upstream PR) | `gh pr list --repo jsovelove/civil-rights-history-project` shows your PR. |

Don't move on until verification passes for the current priority.

---

## Trust but verify

- A memory or recommendation that names a specific file, function, or flag is a CLAIM about a state that may have changed since. Before acting on it, `grep` or `glob` to verify.
- The `transcripts/CODEX_MASTER_PROMPT.md` document was written at the close of Pass 7; the "key recent commits" section is a snapshot. If you see drift between what that doc says and what's in `git log`, trust git.
- If you find a project-level CLAUDE.md statement that contradicts what's actually in the codebase, fix the doc — don't fight the code.

---

## When stuck

Escalation order:
1. Read `transcripts/AUDIT_TRAIL.md` to see what prior sessions did in similar territory.
2. Read the relevant per-entry Pass 7 PRR staging file (`transcripts/pass7_stage/entry_NNN_*.md`).
3. Read the CLAUDE.md "Things that look broken but aren't" section — your blocker may be there.
4. Ask Eric. He's typically responsive within the work window.

---

## Specific traps documented in the audit (don't get burned)

See `transcripts/CODEX_MASTER_PROMPT.md` Section 6 for the full list. The critical ones:

- **Entry 62 (John Carlos):** The corrected `.txt` has Paul Hoffman ASR-merged into every Paul Robeson reference. You MUST fix before the pipeline consumes it.
- **Entry 112 (Ruby Sales):** Row 112.P2.45 has a meaning-INVERTING fix in the corrected text. The pipeline MUST consume the corrected `.txt` (not raw Whisper).
- **Entry 109 (McClary):** NOT READY. Don't include in pipeline run. Mark `skipped` in batch list pending re-transcription.
- **The 4 skip-set entries** (#28, #31, #46, #64, #95): empty-source-directory multi-speaker pipeline failures from Whisper. Already excluded by convention. Don't try to include them.
- **Entry 75** is a joint-interview redirect of #74 + #79. Don't double-process.

---

## Welcome to the project. The audit is done. Now ship it.

— Claude Opus 4.7, closing Pass 7, 2026-05-24

---

## Appendix — Quick commands you'll use

```bash
# Validate corpus after any edit
cd "Metadata Generation System" && python scripts/validate_facts.py

# Regenerate corrected/ output from master MD
python scripts/apply_corrections.py

# Regenerate per-entry slices from master MD (if you change master MD heavily)
python transcripts/slice_master_md.py

# React build
npm run build

# Cloud Functions parse-check
node --check functions/index.js

# MCP server parse-check
node --check mcp-server/server.mjs

# Python pipeline compile-check
cd "Metadata Generation System" && python -m compileall -q processor/

# Git status (no -uall, OOMs on large repos)
git status

# View recent project commits
git log --oneline -20

# Push after every commit
git push origin master
```
