# Pass 7 — Publication Readiness Review (PRR)

**Design date:** 2026-05-24 evening
**Designer:** Claude Opus 4.7 (parent session — Eric's standing goal at session start)
**Execution model:** Serial subagent dispatch (Sonnet 4.6), one transcript per agent, strict cross-contamination firewall
**Deadline context:** 3 days to WWU team meeting 2026-05-27; Pass 7 is the closing pass before Codex handoff

## Purpose

Pass 7 is the **closing pass** before the Codex master-prompt handoff. Its job is not to find new Whisper errors — Passes 1–4 covered that exhaustively, Pass 5 (Layer 5) caught the corpus-global fidelity drifts, and Pass 6 adjudicated the highest-density D2-ambiguous residual. Pass 7's job is to **render a per-entry publication-readiness verdict** that the next agent (Codex) can use as the authoritative input for what each entry needs before it ships to the Smithsonian/LoC.

## What Pass 7 produces per entry

For each of 127 audit-able entries, one Pass 7 subagent (Sonnet 4.6, one-transcript scope, no master-MD access) produces a single staging file at `transcripts/pass7_stage/entry_NNN_subject_slug.md` containing five sections:

### Section 1 — Subject paragraph audit (closes OPEN_PROBLEMS Problem 8)

The Subject paragraph is the publication-grade metadata field that summarizes who the interviewee is and what the interview covers. Session 4 Pass 4 surfaced that ~120+ Subject-paragraph claims across ~50+ entries are not directly supported by their transcript. Pass 7 closes this by:

- Reading the entry's Subject paragraph from its slice
- For each factual claim in the paragraph, deciding: `supported` / `partial` / `unsupported` / `contradicted` against the corrected transcript text
- Producing a per-claim audit table
- Producing a corrected Subject paragraph (if changes needed)

### Section 2 — Cross-pass coherence check

For each entry, Pass 1 + Pass 2 + Pass 3 + Pass 4 + Pass 6 may produce findings that contradict each other (e.g., Pass 1 says X, Pass 3 retracts it, Pass 4 partially restores it, Pass 6 leaves it ambiguous). Pass 7:

- Identifies internal contradictions in the entry's correction overlay
- Adjudicates each contradiction (which finding wins) with brief reasoning
- Lists any unresolved internal contradictions for ensemble handoff

### Section 3 — Residual ground-truth corpus proposals

Pass 4 surfaced ~80+ canonical-figure candidates for `civil_rights_facts.json` expansion (60→140 already done; remaining batched commit pending). Pass 7 reviews each entry one more time and proposes:

- 0–3 new canonical-figure candidates from this entry not yet in the 140-entry corpus
- For each: name, role, why they belong, transcript evidence

### Section 4 — Pass 7 readiness score (formula v2)

Replaces the heuristic Pass 6 Track 1 scoring with a more nuanced formula.

**Formula v2:**
```
score = 100  (baseline; no audit work assumed)
  + confidence_credit:           +0.5 per (high|correct) confidence row, capped at +20
  + pass_depth_credit:           depth-based bonus per the table below
  + pass6_resolution_credit:     +1.5 per [PASS-6: resolved-high|confirmed|narrowed|alternate]
  - outstanding_ensemble:        -1.5 per remaining [LAYER-5: D2-ambiguous, ensemble-adjudication-pending]
  - low_confidence_residual:     -1.0 per (low|medium) confidence row not yet resolved
  - subject_paragraph_penalty:   -3 per Subject-paragraph claim graded unsupported|contradicted
  - speaker_originating_unhandled: -0.5 per speaker-originating error not yet annotated for editorial footnoting
  - canonical_complexity:        -0.05 per unique canonical figure (gentle complexity penalty)

depth-based bonus:
  - Pass 1 only:                 +0
  - +Pass 2:                     +5
  - +Pass 3:                     +8
  - +Pass 4:                     +12
  - +Layer 5 advisory:           +14
  - +Pass 6 resolutions applied: +16
  - +Pass 7 PRR verdict:         +18

  (each row above is cumulative — an entry that has Pass 7 done also got Passes 1–6 done)

Clamp to [0, 100]. Round to one decimal place.
```

**Why this differs from Pass 6 Track 1 v1:**

| Dimension | v1 (Pass 6 Track 1) | v2 (Pass 7) |
| --- | --- | --- |
| Outstanding flag penalty | -5 each (too punitive; zeros easily) | -1.5 each |
| Pass depth | +2 per layer (linear, no quality signal) | Cumulative table (diminishing returns + Pass 7 quality marker) |
| Resolution outcomes | Not rewarded | +1.5 per resolved-high/confirmed/narrowed/alternate (rewards Pass 6 work) |
| Subject paragraph | Not considered | -3 per unsupported/contradicted claim (addresses Problem 8) |
| Confidence credit | Not rewarded | +0.5 per high/correct (rewards thorough audit work) |

**Expected v2 distribution vs v1:** v1 placed 38% of entries below 40 (heavy "not-ready" signal). v2 should produce a more centered distribution because (a) resolution outcomes now COUNT toward the score, and (b) confidence-credit rewards entries that have many verified-high corrections instead of penalizing them.

### Section 5 — Publication-readiness verdict (1-paragraph)

A human-readable judgment from the Pass 7 agent: "Entry NNN [is | is not | is conditionally] ready for Smithsonian-grade publication, because [...]." Includes:

- A 1–2 sentence summary of what this entry is about (for Codex's benefit)
- The blocker(s) if any (Subject paragraph issues, residual D2-ambiguous, etc.)
- A specific action item if any ("Codex should: ...")
- The final score from Section 4

## Execution architecture

### Serial subagent dispatch (NOT parallel)

Per the standing goal: "one agent operating so that each touches only one transcript at a time and avoids cross-contamination." Pass 7 uses **serial dispatch**: parent (Claude Opus 4.7 in this conversation) spawns one Sonnet 4.6 subagent at a time, waits for it to return, spawns the next. No parallel batches.

**Why serial:**
- Pass 4 demonstrated that parallel batches of agents touching one transcript each work cleanly, but Pass 7 is a closing-quality pass where Eric specifically wants the conservative architecture
- Serial keeps the parent's prompt cache hot (each tool call within a 5-min window cache-hits at ~90%+), which is the cost optimization Eric called out
- Serial also lets the parent surface real-time anomalies to the AUDIT_TRAIL during the run

**Why Sonnet 4.6 for subagents:**
- The per-entry work is well-scoped (read 3 files, follow a template, write 1 file). Sonnet 4.6 is plenty.
- ~5x faster wall-clock per entry than Opus 4.7
- Cost reduction matters for a 127-entry batch even with Eric's standing "don't throttle tokens" rule, because Sonnet means a job that would take 10+ hours of Opus instead takes ~5 hours

### Per-entry subagent prompt template

Each subagent receives:
- The path to its slice (`transcripts/per_entry_slices/entry_NNN_subject_slug.md`)
- The path to its corrected transcript text (`transcripts/corrected/<source_dir>/*.txt`)
- The path to the ground-truth corpus (`Metadata Generation System/civil_rights_facts.json`)
- The Pass 7 PRR template
- Strict isolation rule: NEVER read another entry's slice, NEVER read master MD, NEVER read other entries' corrected files

### Commit cadence

Every 10 entries:
- Commit the 10 new staging files
- Update AUDIT_TRAIL Session 6 with a Phase N+1 sub-section summarizing the batch
- Push to origin/master

Per CLAUDE.md per-phase atomicity discipline + the new "commit at every moderate milestone" rule.

### Failure handling

If a subagent fails (socket disconnect, malformed output, refuses task):
- Log the failure in AUDIT_TRAIL
- Retry once with the same prompt
- If second attempt also fails, mark the entry as "Pass 7 deferred to manual review" and continue
- Surface failed entries in the final AUDIT_TRAIL summary so Codex sees them

## Outputs

When Pass 7 completes:

| Artifact | Path | Purpose |
| --- | --- | --- |
| Per-entry staging files (127) | `transcripts/pass7_stage/entry_NNN_subject_slug.md` | One PRR per entry |
| Aggregate readiness ledger | `transcripts/readiness_ledger_v2.json` | All 127 v2 scores with breakdowns |
| Subject paragraph corrections | `transcripts/subject_paragraph_corrections_pass7.json` | Closes Problem 8 |
| Ground-truth proposals | `transcripts/ground_truth_proposals_pass7.json` | For batched corpus expansion |
| AUDIT_TRAIL Session 6 | `transcripts/AUDIT_TRAIL.md` | Continuous Phase 1...N updates |
| Updated OPEN_PROBLEMS | `transcripts/OPEN_PROBLEMS.md` | Problem 8 marked RESOLVED; new Problem 10 (Codex handoff items) added if needed |
| Merge script | `transcripts/merge_pass7.py` | Inserts Pass 7 PRR blocks into master MD per entry |

## Closing handoff to Codex

After Pass 7 completes and merges, Pass 7 produces (alongside Pass 7 outputs) `transcripts/CODEX_MASTER_PROMPT.md` — the comprehensive single-file handoff for whichever agent picks up the project next. The Codex prompt:

- Self-contained (does not require reading > 2-3 other docs to orient)
- Covers project state, deployment status, what's done across Pass 1–7, what remains, file map, operating conventions (cross-contamination firewall, per-phase atomicity, commit+push at milestones)
- Quotes the v2 readiness scores so Codex knows which entries are publication-ready and which need work
- Links to the per-entry PRR staging files for any entry Codex needs to act on

## Expected wall-clock

- Setup (this design doc, Session 6 entry, pass7_stage/ scaffolding): ~15 min
- 127 entries × ~2-3 min each (Sonnet 4.6 subagent + parent orchestration): ~5-6 hrs
- Merge + ledger generation + commit: ~30 min
- Codex master prompt authoring: ~30 min
- **Total: ~6-7 hours** — overnight job, completes by morning 2026-05-25
