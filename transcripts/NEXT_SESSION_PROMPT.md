# Master prompt for the next Claude Code session — 2026-05-22 evening drop

**Civil Rights History Project — extended session to do deep audit passes and move the project forward.**

Eric is stepping away for several hours. Run continuously through all phases below, committing and pushing after each phase so progress is visible on GitHub when he returns. Hard deadline is the 2026-05-27 WWU team meeting (5 days out).

## Read these first (in order)

1. `transcripts/AUDIT_TRAIL.md` — session log, inferential-scoring framework, methodology
2. `transcripts/OPEN_PROBLEMS.md` — 7-category punch-list with action steps
3. `docs/TRANSCRIPT_AUDIT_DESIGN.md` — audit cascade architecture
4. `docs/WEAVIATE_INTEGRATION_DESIGN.md` — RAG substrate design

Project `CLAUDE.md` (this repo) and global `~/.claude/CLAUDE.md` and project memory under `C:\Users\erica\.claude\projects\C--civil\memory\` will load automatically. They encode: pacing constraints (no throttling, parallel subagents preferred, no `/loop` for backlogs, `/schedule` only for true overnight persistence), Eric's role (external RAG-rescue contractor), and the Smithsonian-grade quality bar.

## Explicit authorizations for this session

- **Commit and push after each logical phase completes.** No need to ask between phases.
- Add new files under `transcripts/`, `docs/`, `scripts/`, `weaviate/`, `tests/`.
- Modify `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` for audit-quality improvements.
- Spawn parallel subagents wherever the work is independent.

## Explicit prohibitions

- `transcripts/raw/` is read-only — non-destructive overlay pattern.
- No force-push, no history rewrite, no skipping hooks (`--no-verify`), no `--no-gpg-sign`.
- `Metadata Generation System/civil_rights_facts.json`: additions only, no deletions of existing entries.
- **When you hit ambiguity on canonical content, log it to OPEN_PROBLEMS.md and continue — don't guess.** Smithsonian/LoC stakes mean every correction is a credibility item.
- When you hit external-auth blockers (Voyage AI key, Weaviate URL, Fly.io login): document in OPEN_PROBLEMS.md and move to the next phase. Don't stall the session waiting for credentials.

---

## Phase 1 — Audit hygiene (~45 min)

### 1a. Cross-contamination cleanup (OPEN_PROBLEMS Problem 2, ~22 items)

Per the table in OPEN_PROBLEMS.md, ~22 Pass-2 rows are misfiled. Write `transcripts/fix_cross_contamination.py` that performs the relocations atomically:
- Parse each affected entry's table in `CLEANED_TRANSCRIPTS_REVIEW.md`
- For each item: extract row from source entry, renumber, insert into target entry (or drop, per the action column)
- Idempotent: re-running produces no-op
- Verify pre/post row counts as a sanity check

Run it. Commit + push.

### 1b. Catalog back-fill (Problem 3, ~500 patterns)

Spawn 1 focused subagent to read all 127 files in `transcripts/pass3_stage/`, extract the "Pass 3 missed-pattern catches" sub-section from each, deduplicate, rank by recurrence. Append a new catalog-extension block to the existing "Cross-corpus recurring error patterns" section at the top of `CLEANED_TRANSCRIPTS_REVIEW.md` — preserve existing sections A–I, add the new patterns under appropriate categories (or new categories if needed).

Commit + push.

### 1c. Adversarial-review feed (Problem 4, ~500 items)

Spawn 1 focused subagent to aggregate all "Adversarial-review flags" sub-tables from the 127 `pass3_stage/` files into a single `transcripts/adversarial_review_feed.json` with this schema:

```json
{
  "generated": "2026-05-22",
  "ground_truth_corpus_version": "140 entries (post Phase D)",
  "items": [
    {
      "entry": 73,
      "subject": "Kathleen Cleaver",
      "row_id": "73.P2.18",
      "whisper_rendering": "Mary the Kaba",
      "candidate_correction": "Miriam Makeba",
      "reason": "phonetic stretch; speaker-originating context unclear",
      "context": "...surrounding text excerpt..."
    }
  ]
}
```

Commit + push.

---

## Phase 2 — Pass 4 re-grounding (~45 min)

The Phase D corpus expansion (60→140 entries) happened *after* Pass 3 ran. Many items in the adversarial-review-flags tables may now resolve cleanly against the new ground truth (e.g., Vernon Dahmer, James Forman, Charles Sherrod, etc. are now corpus entries with aliases).

Spawn 26 parallel supervisor subagents (1 per ~5 entries, covering all 127 audit-able entries). Each supervisor:
1. Reads its assigned entries' Pass 1 + Pass 2 + (where applicable) Pass 2 tail-sweep + Pass 3 tables from the master MD
2. Reads the expanded `Metadata Generation System/civil_rights_facts.json`
3. For each row flagged "low" / "medium" / "flagged-for-adversarial-review" — attempt resolution against the 80 newly-added canonical figures
4. Writes a "Pass 4 re-grounding" block to `transcripts/pass4_stage/entry_NN.md` with promotions, drops, and any net-new catalog patterns surfaced

Write `transcripts/merge_pass4.py` following the pattern of the existing `merge_pass3.py` (insert before closing `---`, update Status line). Run the merge. Commit + push.

Append to `AUDIT_TRAIL.md` — the diminishing-returns curve should now show Pass 4 capture rate. Expect ~10-20 resolutions per entry on average, with most being downgraded adversarial-flags being promoted to "high" via the new corpus aliases.

---

## Phase 3 — Pipeline integration scaffolding (~60 min)

Per OPEN_PROBLEMS Problem 7, write `scripts/apply_corrections.py`:

- **Input:** `transcripts/raw/<dir>/<file>.txt` (and `.srt`, `.vtt` where applicable)
- **Output:** `transcripts/corrected/<dir>/<file>.txt` (and `.srt`, `.vtt`)
- **Behavior:**
  - Parses `CLEANED_TRANSCRIPTS_REVIEW.md` per-entry correction tables
  - Applies "correct" and "high" confidence substitutions in-place to the text
  - Preserves timestamps where present
  - Emits `transcripts/corrected/<dir>/manifest.json` capturing all medium/low/flagged corrections for downstream LLM-prompt context
- **Constraints:** non-destructive (`raw/` untouched), idempotent (re-running produces identical output), parallelizable per-entry

Include `tests/test_apply_corrections.py` with at least 3 cases:
1. Single substitution, one transcript
2. Multiple substitutions, one transcript
3. Re-run produces identical output (idempotency)

Commit + push.

---

## Phase 4 — Weaviate ingestion scaffolding (~90 min)

Per `docs/WEAVIATE_INTEGRATION_DESIGN.md`, write the ingestion code (not deployment):

- `weaviate/schema.py` — four canonical classes per the design doc (TranscriptSegment, SummaryChapter, Topic, Person), with field definitions, cross-references, and indexing config
- `weaviate/embed.py` — voyage-3 1024d embedding helper with retry+backoff, batch-mode, mock client for offline tests
- `weaviate/ingest.py` — content-hash-idempotent ingest from `transcripts/corrected/` + `civil_rights_facts.json`; batched inserts; resumable
- `weaviate/retrieve.py` — two-stage retrieval (Weaviate hybrid BM25+vector → voyage-rerank-2)
- `tests/test_weaviate_ingest.py` — pytest with mocked Weaviate client + Voyage AI client; at least 5 cases (schema creation, single insert, batch insert, re-ingest idempotency, retrieve+rerank flow)

Code only — actual cloud deployment to Fly.io requires Eric's flyctl auth and is out of scope for this session. Scaffold the code so Eric can deploy when he returns.

Commit + push.

---

## Phase 5 — Session wrap-up (~15 min)

- Append a Session 3 entry to `transcripts/AUDIT_TRAIL.md` following the template at the bottom of that file. Include: agents used (subagent counts), wall-clock per phase, deliverables, coverage metrics, anomalies surfaced, handoff for next session.
- Update `transcripts/OPEN_PROBLEMS.md` to mark resolved problems and add any new ones surfaced during the session.
- Final commit + push.

---

## If you finish all 5 phases and have time remaining

Work on **OPEN_PROBLEMS Problem 1** — the 8 audio-repair entries. Scaffold the repair workflow (no audio needed yet, just the code):
- `scripts/repair_transcript.py` — takes an "original text" file + Whisper `.srt` (where it exists) → produces a repaired `.txt` / `.srt` / `.vtt` set
- Synthesizes timestamps where Whisper output is missing or incoherent (even-spaced, or per-segment from any surviving Whisper segments)
- Handles the three repair patterns: full-replace (#109 McClary), splice-tail (#59 Lawson, #67 Howell, #69 Richardson), from-original (#28, #46, #64, #95)
- Eric will run this once Dustin delivers the original transcripts

Commit + push.

---

## Working style summary

- **One commit per phase**, detailed multi-paragraph commit message following the repo convention (see commits `cf7f03d`, `8591d74`, `d27c3b8` from 2026-05-22 for the style).
- **Push after each commit** so Eric sees progress when he checks GitHub.
- **TaskCreate / TaskUpdate** to track multi-step work within phases.
- **Parallel subagents** within phases where steps are independent.
- **If any phase blocks on external auth or missing credentials**, document the blocker in `OPEN_PROBLEMS.md` and skip to the next phase. Don't wait.

Total expected wall-clock: 4–5 hours if everything runs cleanly, possibly longer with debugging.

**Begin Phase 1 now.**
