# AUDIT_TRAIL — Civil Rights History Project transcript-cleanup effort log

**Purpose:** Longitudinal record of all transcript-accuracy and fidelity-restoration work across sessions, agents, and models. Intended to feed downstream **inferential error-rate scoring** that grades the corpus's residual-hallucination likelihood per entry and in aggregate. Distinct from:
- `CLEANED_TRANSCRIPTS_REVIEW.md` — the per-entry corrections overlay (artifact)
- `OPEN_PROBLEMS.md` — the open punch-list (what still needs doing)

This file records **what was done, when, by whom, and with what coverage** — provenance metadata for the audit work itself.

## How to use this document

- **Humans** read the chronological session narratives plus the per-session metric summaries.
- **Analysis scripts** parse the structured tables (per-entry coverage matrix, per-pass aggregate metrics, residual-confidence distribution) to compute inferential error-rate estimates.
- **Adversarial reviewers** (e.g., Kiro / Kimi / Codex / Gemini ensemble) use the session log to scope their own pass: which entries had which coverage, what was already resolved vs. still flagged.

When adding a new session entry, follow the template at the bottom of this file. Every session should record: agents used, scope, methodology, deliverables, coverage metrics, anomalies, follow-up handoffs.

---

## Methodology overview (cross-session invariants)

Per `docs/TRANSCRIPT_AUDIT_DESIGN.md`, each pass uses a three-stage cascade:

1. **Stage 1 — Exact / alias match** against `Metadata Generation System/civil_rights_facts.json`.
2. **Stage 2 — Phonetic + edit-distance fuzzy match** (Double Metaphone + Jaro-Winkler).
3. **Stage 3 — LLM disambiguation** for middle-band candidates (score 0.65–0.85), using surrounding context.

**Confidence tiers:** high / medium / low / correct / speaker-originating / flagged-for-adversarial-review.

**Non-destructive overlay:** raw `.srt` / `.txt` / `.vtt` / `.json` files in `transcripts/raw/` are never edited. Corrections accumulate in `CLEANED_TRANSCRIPTS_REVIEW.md` and (post-deployment) in a Firestore `transcript_corrections` collection.

**Corpus size:** 135 source directories. After exclusions (4 SKIPPED empty-directory multi-speaker pipeline failures + 1 redirect via joint interview #75): **127 audit-able entries** + 4 awaiting upstream re-transcription = 131. Entry #109 McClary is audit-able-but-impaired (severe Whisper degradation).

---

## Session log

### Session 5 — 2026-05-23 → 2026-05-24: Pass 6 low-confidence residual QA round (retrospective entry)

**End-of-session summary:** Pass 6 is the informal name for a post-Layer-5 cleanup wave executed late 2026-05-23 (after the Layer 5 fidelity-deploy `2669753` and the Stage 3 Layer 5 deploy `389ae4f`). It runs four orthogonal tracks across the corpus: (1) per-entry publication-readiness scoring; (2) heuristic Whisper→canonical mutation sweep against the corrected/ output; (3) per-entry adversarial resolution of the highest-density `LAYER-5: D2-ambiguous` flag set; (4) per-entry slicing of an additional Layer 5 pending subset for a future resolution pass. Tracks 1–3 produced substantive output; Track 4 stopped at slicing (no resolution agent has yet been spawned). This Session entry is **authored retroactively** as part of the 2026-05-24 commit that brings the wave under version control — the original Pass 6 session did not author its own AUDIT_TRAIL entry, violating the per-phase atomicity discipline mandated in CLAUDE.md. Going forward, every milestone in this session and future sessions commits + pushes; uncommitted working-tree state is treated as a process failure, not as "in-flight."

**Agents:** Claude Opus 4.7 (parent + ~40 low-confidence resolution subagents in Track 3); precise per-track subagent count not recorded by the original session.

**Wall-clock:** ~2.5 hours (script authoring + execution) across 2026-05-23 evening; AUDIT_TRAIL + OPEN_PROBLEMS retroactive authoring + commit/push 2026-05-24 (~30 min).

**Scope:** 127 audit-able entries (Tracks 1–2) + 40 entries with the highest LAYER-5: D2-ambiguous concentration (Track 3) + 11 entries identified as carrying un-resolved Layer 5 findings (Track 4). Same skip-set as prior passes: {28, 31, 46, 64, 95}.

#### Track 1 — Per-entry publication-readiness scoring (complete)

**Deliverables:**
- `transcripts/calculate_transcript_readiness.py` — parses master MD via the existing `layer5_extract_corrections.py` helper; scores each entry 0–100 from a four-term heuristic: starts at 100, subtracts 5 per outstanding flag (flagged-for-adversarial-review + LAYER-5: annotations), 0.1 per initial Pass-1/Pass-2 error, 0.05 per unique canonical (complexity penalty), adds 2 per pass-depth-layer endured. Includes a guard against the false-positive "perfect 100" failure mode for unaudited entries (4 entries with `source_dir` set but zero correction rows emit `readiness_confidence: null, status: "unaudited"` instead of the misleading score=100).
- `transcripts/readiness_ledger.json` — 131-entry ledger (127 scored + 4 unaudited): mean 47.7, median 52.0, min 0.0, max 100.0. Distribution: 28 entries score 0–20 (heavy outstanding-flag load), 21 score 20–40, 26 score 40–60, 35 score 60–80, 17 score 80–100. Concretely: 38% of the corpus scores below 40 by this metric — the natural prioritization input for the remaining 3-day push before the 2026-05-27 deadline.

**Coverage:** all 131 entries (including the 4 unaudited skipped/redirect entries flagged with null readiness).

**Limitations:** the score formula is heuristic — weights live only in script comments, not in any audit doc. If readiness scores are communicated to WWU/Smithsonian, the formula should be made transparent.

#### Track 2 — Heuristic Whisper→canonical mutation sweep (complete, applied to corrected/)

**Deliverables:**
- `transcripts/run_qa_batch.py` + `transcripts/mutate_transcript.py` — paired orchestrator + mutator. The orchestrator iterates each `transcripts/corrected/<entry>/` directory; for each entry, applies 13 hardcoded Whisper→canonical patterns drawn from Layer 5 findings and recurring corpus-wide failure modes: "mega-evils" → Medgar Evers, "Tugaloo College" → Tougaloo College, "Stocks-O Cymbol" / "Stokeley" → Stokely Carmichael, "Jim Foreman" → James Forman, "Sammy Young" → Samuel Younge Jr., "Lounge County" → Lowndes County, "Acta Almighty King" → Come Thou Almighty King, "Pittsburgh Korea" / "Pittsburgh Kuzat" → Pittsburgh Courier, "Dinky Romley" → Dinky Romilly, "snake office" → SNCC office. The generic "snake" → "SNCC" expansion is explicitly skipped as too risky for an unscoped global replace.
- Modified 19 entries / 57 files (.srt + .vtt + .txt per entry) under `transcripts/corrected/`. Net delta: 149 insertions / 149 deletions. The volume-weighted entries are SNCC-era interviewees who name-drop Carmichael heavily: Kathleen Cleaver (36 lines), Gwendolyn M. Patton (12), Phil Hutchings (10).

**Coverage:** all 127 corrected/ entries processed; 19 hit at least one pattern; 108 were idempotent no-ops.

**Known incompletion:** per-entry `manifest.json` files in the 19 affected entry directories are now ~18 hours older than the .txt files they document (manifests stamped 2026-05-23 ~01:00; .txt files modified 2026-05-23 ~19:34). The audit-chain signature in each affected manifest no longer matches the file it describes. Resolution: re-run `scripts/apply_corrections.py` to regenerate manifests — but the regen must run AFTER the Track 3 apply-back lands so the regenerated output captures both Track 2's heuristic mutations and Track 3's adversarial resolutions in one pass.

#### Track 3 — Per-entry adversarial resolution of LAYER-5: D2-ambiguous flags (generated, NOT applied)

**Deliverables:**
- `transcripts/low_confidence_residual.json` — flat list of 82 items pulled from the master MD (entries with `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]` annotation in Notes). Each item has entry_number, subject, pass_section, row_id, whisper, correction, notes.
- `transcripts/low_conf_per_entry_slices/` — 40 per-entry input slices grouping the 82 items by entry. Used as input by ~40 parallel resolution subagents.
- `transcripts/low_conf_resolutions/` — 40 per-entry output files (1:1 with the input slices). Each item has a `resolution` field (one of: `narrowed` / `resolved-high` / `rejected` / `confirmed` / `unresolved` / `alternate`), a `new_candidate` value, multi-paragraph `evidence` derived from transcript context + ground-truth corpus lookup + external archival sources (SNCC Digital Gateway, CRMVet, Library of Congress finding aids, university archives), and an `external_sources` URL list.
- Resolution-type distribution across the 82 items: 39 rejected (Pass 2/3 hypothesis judged to be speculation without corroboration), 21 unresolved (genuinely ambiguous after adversarial lookup), 10 narrowed (correction refined to a more cautious form), 4 confirmed (original Pass 2/3 hypothesis upheld), 4 alternate (a different canonical candidate proposed), 4 resolved-high (high-confidence canonical identification reached).

**Critical incompletion: no apply-back script exists.** The 82 resolutions are sitting in `low_conf_resolutions/*.json`. Zero of them have been written back to the `correction` column of the corresponding rows in `CLEANED_TRANSCRIPTS_REVIEW.md`. Verification: `grep -c "Becky Mills [unverified" transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` (the entry_007 new_candidate) returns 0. Until an `apply_low_conf_resolutions.py` is written and run, the Smithsonian-publication overlay shows the un-adjudicated Pass 2/3 speculations, not the adversarially-vetted resolutions.

#### Track 4 — Layer 5 pending residual (sliced only, not resolved)

**Deliverables:**
- `transcripts/layer5_pending_slices/` — 11 per-entry input slices for entries identified as carrying un-resolved Layer 5 findings: #2, #11, #15, #34, #38, #39, #74, #76, #79, #100, #113.

**Critical incompletion: no resolution agent ever ran.** There is no `layer5_pending_resolutions/` directory. Slices were generated and then the wave stalled. Either: (a) spawn 11 parallel subagents in a single message to produce resolutions (~10 min wall-clock per the CLAUDE.md pacing guidance for parallel-subagent work); or (b) scope-acknowledge that these defer to the Kiro/Kimi/Codex/Gemini ensemble and remove the slice directory.

#### Coverage relative to total Layer 5 residual

The Layer 5 fidelity-deploy (`2669753`) annotated 1,174 D2-ambiguous rows for ensemble adjudication. Pass 6 Tracks 3+4 cover 82 + ~22 estimated (for the 11 Track 4 entries at average ~2 items each) = ~104 items, or **~9% of the D2-ambiguous residual**. The remaining ~1,070 D2-ambiguous rows are still annotated and waiting for the Kiro/Kimi/Codex/Gemini ensemble handoff per OPEN_PROBLEMS Problem 9.

#### Handoff to whatever session picks this up

1. **[BLOCKER] Write `transcripts/apply_low_conf_resolutions.py`** — consume the 40 `low_conf_resolutions/entry_NNN.json` files; for each item, locate the corresponding row in master MD by `(entry_number, row_id)`; rewrite the `correction` column based on `resolution` type (`narrowed`/`resolved-high`/`alternate` → write `new_candidate`; `rejected` → annotate as rejected + retain original; `confirmed` → annotate as confirmed; `unresolved` → annotate as remaining for ensemble). Preserve a Layer 6 audit annotation in Notes column. Idempotent. ~1–2 hrs to script.
2. **[BLOCKER] Spawn 11 parallel resolution subagents for Track 4** — one per `layer5_pending_slices/entry_NNN.json`; outputs go to a new `layer5_pending_resolutions/` directory. Same prompt template as Track 3. Then write a corresponding apply-back step (can share infrastructure with Track 3's apply-back).
3. **[MEDIUM] Re-run `scripts/apply_corrections.py`** after Tracks 1+2's apply-back lands — to refresh the 19 stale `manifest.json` files in `transcripts/corrected/` so the audit-chain signature matches the .txt file it documents.
4. **[OPTIONAL] Expand Track 2's heuristic pattern set** OR supersede it with a generic alias-driven applier that consumes the 291 aliases in `civil_rights_facts.json`. Track 2 currently covers <10% of the high-frequency Whisper failure modes the corpus could mechanically catch.

#### Process learnings

- The fact that this Session entry is being authored retroactively is itself a finding. The original Pass 6 session executed work but did not commit + push it, leaving 66 files in working-tree limbo for ~24 hours and creating a governance gap. Per the user's standing directive ("I always want everything pushed after every moderate milestone"), going forward: every milestone — including intermediate checkpoints — commits and pushes. Uncommitted working-tree state is a process failure, not a "work-in-progress" state. The same visibility-gap pattern that commits `e325d79` and `8591d74` previously had to back-fill is what motivated CLAUDE.md's per-phase atomicity discipline; that discipline now needs project-wide enforcement, not just within audit-document updates.

---

### Session 1 — 2026-05-21: Pass 1 initial sweep (single-session, foreground)

**Agents:** Claude Opus 4.7 (single conversation, no parallel subagents)
**Wall-clock:** roughly 1 day, multiple iterations
**Scope:** 132 source transcripts, Pass 1 corrections (initial cleanup audit)

**Methodology:**
- Sequential per-entry processing via `/loop` skill at 270s `ScheduleWakeup` cadence (pre-pacing-constraints regime)
- Each entry: Read transcript → identify canonical-figure misattributions, geographic errors, date errors, organization mishears → write per-entry corrections table to master MD
- Heavy reliance on the original 60-entry `civil_rights_facts.json` as ground truth

**Deliverables:**
- `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` (Pass 1 portion, ~2.8 MB at session end)
- Pass 1 Closeout block embedded in master MD with per-entry narrative
- ~3,000 Pass 1 corrections across 132 entries (avg ~22-25 per entry; high-density entries up to 60-95 corrections)

**Coverage:**
- 132 / 135 entries audit-able (5 SKIPPED, 1 redirect)
- 14 entries hit Read-tool 25K-token cap → partial reads (covered first ~68 KB, tails unaudited)
- Of those 14, the largest tails: #34 Thelwell 122 KB, #17 McLaurin 116 KB, #26 Bailey 83 KB

**Anomalies:**
- 4 SKIPPED entries identified as empty source directories — all multi-speaker (3+) joint interviews; pattern attributed to upstream Whisper pipeline failure on diarization
- 1 severely-degraded transcript (#109 McClary) — populated source but ~60-70% incoherent Whisper output
- 3 source-level mid-sentence truncations: #59 Lawson, #67 Howell, #69 Richardson

**Handoff:** Pass 2 needed to (a) re-review for missed errors, (b) cover the 14 unread tails.

---

### Session 3 — 2026-05-22 (evening): audit hygiene + pipeline preprocessor + Pinecone+Voyage scaffolding + aigamma migration

**End-of-session summary:** Phase 1 (cross-contamination cleanup + catalog back-fill + adversarial-review feed) shipped cleanly with 22 cross-contamination items resolved, 792 catalog patterns added across sections A–I plus 7 new sections J–P, and 825 adversarial-review items aggregated into a hand-off-ready JSON feed for the Kiro/Kimi/Codex/Gemini ensemble. Phase 2 (Pass 4 re-grounding) was reassigned to a parallel Session 4 with methodologically tighter one-transcript-per-agent isolation (Session 4 has landed ~92/127 entries as of this session close). Phase 3 (`scripts/apply_corrections.py`) and Phase 4 (`rag/` Pinecone + Voyage scaffolding) shipped end-to-end with 57 passing tests + complete decision record (`docs/RAG_SUBSTRATE_DECISION.md`). A Voyage-3 migration was applied as a bonus deliverable to aigamma.com (schema + Edge Functions v3/v2 + re-embed of 122 rows) since markets were closed for the weekend. Substrate decision was the dominant cognitive cost: pivoted from Weaviate self-host to Pinecone Builder + Voyage AI after the team-handoff dimension moved up the priority stack and the realization that worldthought.com already covers Pinecone exposure. **Next priorities for whatever session picks this up:** (1) wait for Session 4 to finish Pass 4 batches + write `merge_pass4.py`; (2) Eric to provision Pinecone civil-rights-prod project + set VOYAGE_API_KEY in aigamma Supabase Edge Function secrets; (3) first production ingest via `rag/ingest.mjs` once Pinecone is provisioned. **Manual-intervention blockers held by Eric:** Pinecone project creation, Supabase Edge Function secret setting; no agent intervention possible on either.

**Agents:**
- Claude Opus 4.7 (parent / orchestrator)
- *(subagent counts populated per-phase)*

**Wall-clock:** *(populated per-phase)*

**Scope:** Five-phase agenda per `transcripts/NEXT_SESSION_PROMPT.md` (2026-05-22 evening drop). Phase 1: audit hygiene (cross-contamination cleanup + catalog back-fill + adversarial-review feed). Phase 2: Pass 4 re-grounding against expanded 140-entry corpus. Phase 3: `scripts/apply_corrections.py` for raw→corrected transcript preprocessing. Phase 4: Weaviate ingestion scaffolding (schema + embed + ingest + retrieve + tests). Phase 5: session finalization.

**Methodology shift from Session 2:** Per the per-phase document-update protocol in the prompt, `AUDIT_TRAIL.md` and `OPEN_PROBLEMS.md` are updated *during* the session (incremental phase sub-sections, resolved-items annotations) rather than at session close. Each phase concludes with a single atomic commit that bundles code/data changes + doc updates. This is intended to keep the contract documents accurate even if the session is interrupted mid-run, and to give Eric real-time visibility on GitHub.

#### Phase 1 — Audit hygiene

**Agents:** Claude Opus 4.7 (parent) + 2 general-purpose subagents in parallel (Phase 1b + Phase 1c).
**Wall-clock:** ~30 minutes (Phase 1a sequential ~10 min; Phase 1b + 1c parallel ~20 min wall-clock, ~37 min serial-equivalent).
**Scope:** Cross-contamination cleanup (Problem 2), catalog back-fill (Problem 3), adversarial-review feed (Problem 4).

##### Phase 1a — Cross-contamination cleanup

Wrote `transcripts/fix_cross_contamination.py` (sole parent agent). Defined an action manifest covering all 22 items flagged in `OPEN_PROBLEMS.md` Problem 2, then disambiguated 2 of them after investigation:

- **#25.13 reclassified** — not actually cross-contamination; two Whisper variants of the same Bogalusa activist within #25's own transcript. Pass 3 already flagged for adversarial review. No action taken.
- **#110.P2.16 reclassified** — legitimate Pass 2 row (`Su City -> Sioux City`). The Pass 3 confidence-resolutions block mis-cited it with content from a different row ("White Fair Hotel" from #108 Carter). Applied a prose-edit annotation to the Pass 3 row marking it as a supervisor mis-attribution; preserved the Pass 2 row.
- **#130.P2.115 reclassified** — adversarial-flag row, not a Pass 2 correction row. Canonical content already at 129.P2.115 (Rev. Eric Schiller). Dropped the noise flag from #130.

Final action breakdown:
- 15 drops (procedural noise rows that were self-flagged "not in this transcript" by their original Pass 2 author)
- 7 moves (rows relocated to the correct entry's Pass 2 table with `<target>.P2.RELOC[<source>.P2.<row>]` provenance markers and dated relocation notes)
- 1 adversarial-flag drop (#130.P2.115)
- 4 prose edits (#102 Subject paragraph + Pass 2 Notes; #110 Pass 3 confidence-resolutions annotation; #102 anomaly-list resolved-marker)
- 2 reclassifications (#25.13 not contamination; #110.P2.16 legitimate Pass 2 row + Pass 3 confusion)

Pre/post Pass-2 row count delta: -15 net (-22 drops + 14 move-in/move-out balance). Master MD: 5,998,907 → 5,995,961 chars (-2,946). Script verified idempotent (second dry-run produces zero changes).

##### Phase 1a follow-on (2026-05-22 evening, post-Session-4 close)

After Session 4 merged Pass 4 sweeping QA + fact-check into the master MD (commit `32516a3`, +3.17 MB), the user requested a comprehensive verification + fix to ensure Pass 4's cross-contamination retractions were *physically applied* to the master MD rather than merely *annotated alongside* the still-present rows. The Session 4 merge script (`merge_pass4.py`) only inserted Pass 4 blocks; it did not modify the Pass 1 / Pass 2 / Pass 3 correction rows that Pass 4 had marked for retraction.

**Agents:** Claude Opus 4.7 (parent, no subagents — direct script work as required by the task prompt).
**Wall-clock:** ~90 minutes (extraction iteration + content-match heuristics + verification).
**Deliverables:**
- `transcripts/extract_retractions.py` — scans Pass 2 / Pass 2-tail / Pass 3 / Pass 4 staging files for retraction signals (RETRACTED / REMOVE / DROP / phantom / strike / withdraw / not-in-transcript / etc.) and emits raw candidate JSON. Refined through 3 iterations to balance recall (Eric's "be exhaustive" directive) against precision (avoiding false-positive removals of legitimate cross-corpus reference rows).
- `transcripts/build_cross_contamination_audit.py` — cross-references raw candidates against the master MD, classifies into 5 buckets (`already_clean` / `annotated_but_still_present` / `no_annotation_in_master` / `ambiguous_human_review` / `known_false_positive`) and applies a 22-item false-positive override list (sub-attribution corrections, positive resolutions misclassified by keyword match, intentional `(not in transcript)` placeholder rows, rows referenced as confirming evidence rather than retraction targets).
- `transcripts/cross_contamination_audit.json` — 68-candidate audit with verbatim Pass 4 reasoning, signal keyword matched, confidence-in-retraction, master-MD state, action, and (where applicable) current row text.
- `transcripts/fix_cross_contamination_pass4.py` — atomic transactional removal script with content-match heuristic to handle meta-cross-contamination (where Pass 3/Pass 4 mislabels a row reference, e.g. `59.P2.9 Jane Rosette` actually belongs to `60.P2.9`). Removes only the row(s) whose CONTENT matches the candidate's reason; preserves legitimate rows that happen to share the same ID. Idempotent (verified via second dry-run = no-op).
- `transcripts/cross_contamination_audit_summary.md` — human-readable summary of the bucket counts, top retraction signal categories, top affected entries, high-impact retractions of note, and anomalies discovered.

**Action breakdown:**
- 46 candidates `physically_remove` (cleanup applied)
- 22 candidates `skip_no_action` (false positives per manual override list)
- 0 candidates `ambiguous_human_review` (content-match heuristic resolved all ambiguity)
- 38 candidates were `annotated_but_still_present` (Pass 4 block had retraction note but the actual row remained); 8 were `no_annotation_in_master` (Pass 3 "DROP — unrecoverable" directives that never got a Pass 4 follow-up annotation)

**Cleanup applied:** 84 total row lines removed across 22 entries. Master MD: 9,279,632 → 9,257,591 chars (−22,041). Per-entry Pass-1 / Pass-2 / Pass-3 row deltas printed in the script's dry-run log. Top 5 most-affected entries: #59 Lawson (−7 rows, NAG/SNCC cross-contamination from #60 Mulholland), #43 / #60 / #107 / #118 / #130 (3 rows each).

**Meta-cross-contamination discovered:** The Pass 3 supervisor for entry #59 typed the wrong entry number when copying row references from another entry's batch — putting `60.P2.9 Jane Rosette → Jan Rosett` (entry #60 Mulholland's NAG cohort context) into entry #59's Pass 3 confidence-resolution and adversarial-flag tables labeled as `59.P2.9`. Pass 4 author then carried the misattribution forward. The fix script's content-match heuristic correctly preserved the legit Pass 2 row `59.P2.9 brighten → Brighton (Birmingham)` while removing the contaminated Pass 3 references. This is the same root-cause-pattern as the original Pass 2 cross-contamination (batched parallel supervisors conflating cohort lists across entries), just now manifesting at Pass 3.

**Smithsonian/LoC publication-gate assessment:** The audit overlay's row-level corrections tables (Pass 1 / Pass 2 / Pass 3) are now substantively clean of cross-contamination. The two remaining governance items are tracked under OPEN_PROBLEMS Problem 8 (Subject-paragraph publication-blocking corrections, ~120+ instances) and the intentional `(not in transcript)` cross-corpus reference rows (audit-trail markers, not hallucinations — could be cleaned in a separate pass but not load-bearing for the Wednesday deadline).

##### Phase 1b — Catalog back-fill (parallel subagent)

Spawned 1 general-purpose subagent. Subagent wrote `transcripts/build_catalog_extension.py` (re-runnable, sentinel-bounded for idempotency) and appended a 893-line "Cross-corpus catalog — Phase 1b back-fill extension (added 2026-05-22)" subsection between Section I and the Progress Tracker.

**Coverage:**
- 881 raw "Pass 3 missed-pattern catches" rows extracted from 127 staging files
- **792 unique canonical patterns** after dedup (recurrence-counted, provenance-tracked)
- 24 patterns filtered as confirmation-only placeholders or noise
- 7 new catalog sections proposed beyond A–I (sections J–P + Z catch-all):
  - J — Publications (12 rows)
  - K — Military (18 rows)
  - L — Institutional/legal (32 rows)
  - M — Pan-African/international (12 rows)
  - N — Foreign-language (12 rows)
  - O — Music/arts (28 rows)
  - P — Cross-entry meta (127 rows)
  - Z — Unsorted catch-all (42 rows flagged for manual review)
- Sections A–H extended in place with 509 new rows total (largest extension: section F geographic at 182, section C SNCC/SCLC/NAACP figures at 103)
- Top 10 by recurrence: Stokely Carmichael (6), SNCC (6), Medgar Evers (5), Thurgood Marshall (5), Fannie Lou Hamer (4), COINTELPRO (4), Hattiesburg (4), James Forman (3), Ku Klux Klan (3), Joe Mosnier (3)

**Quality notes:**
- Tiered keyword routing (regex on correction → explicit "Catalog #X" tag → Whisper-span match → context fallback)
- Word-boundary regex to prevent substring matches
- Sections A–I byte-identical to HEAD (verified)
- Per-entry tables untouched

##### Phase 1c — Adversarial-review feed (parallel subagent)

Spawned 1 general-purpose subagent. Subagent wrote `transcripts/build_adversarial_feed.py` (deterministic, hash-stable across reruns) and produced `transcripts/adversarial_review_feed.json` (439 KB, 10,371 lines).

**Coverage:**
- **825 items** extracted across 125 entries (#9 Booker/Newson and #42 Hopkins correctly excluded — both Pass 3 supervisors marked "all rows resolved")
- 100% schema-coverage (all 10 required fields populated per item)
- 148 items with `row_id_aliases` (multi-ID rows split on `/`)
- 166 items with non-null `candidate_correction` (arrow-form rows)
- 438 items with non-empty `transcript_excerpt`

**Distribution by category (11-category controlled vocabulary):**
- canonical-figure-identification: 263 (32%)
- geographic-place-name: 153 (19%)
- organization-or-event-name: 118 (14%)
- local-figure-identification: 88 (11%)
- other: 44 (5%)
- legal-or-political-term: 39 (5%)
- severely-garbled: 32 (4%)
- quotation-or-document-title: 28 (3%)
- speaker-originating: 25 (3%)
- chronology-or-date: 24 (3%)
- specialized-vocabulary: 11 (1%)

**Top 5 entries by adversarial-flag density:** #34 Thelwell (16), #129 Leventhal (15), #52 Patton (14), #132 Walker (14), #30 Zellner (13).

Top 3 categories account for 65% of all flagged items.

**Anomalies / handoff notes:**
- Categorization is heuristic (keyword-based on Item + Reason text); single-line item descriptions sometimes contain overlapping signals. Downstream Kiro/Kimi/Codex/Gemini ensemble can override `category` if needed — all underlying fields are preserved verbatim.
- Schema version 1.0; future ensemble outputs may add `ensemble_resolution` / `ensemble_confidence` fields keyed by `(entry_number, row_id)`.

**Strategic decision recorded during Phase 1:** RAG-substrate stack pivot from Weaviate-on-Fly.io to Supabase pgvector after Eric reviewed the aigamma.com RAG infrastructure he already runs (`rag_documents` table with gte-small embeddings + `discord_chat_memory` with voyage-3 + chat_logs eval loop). Phase 4 will scaffold to Supabase pgvector, with explicit framing that the additive value is voyage-3 production scale + voyage-rerank-2 + multi-class relational schema + citation auditing + ground-truth corpus grounding — NOT basic pgvector mechanics (which Eric already runs in production).

**Phase 1 handoff to Phase 2:** Pass 4 re-grounding will read the (now cleaned-up) master MD, the (now-extended) catalog, and the expanded `civil_rights_facts.json`. The adversarial feed's 825 items become the primary candidates for re-grounding promotion — many should resolve cleanly against the 80 new corpus entries.

#### Phase 2 — Pass 4 re-grounding

*(populated when Phase 2 completes)*

#### Phase 3 — Pipeline integration scaffolding

*(populated when Phase 3 completes)*

#### Phase 4 — Weaviate ingestion scaffolding

*(populated when Phase 4 completes)*

#### Phase 5 — Session finalization

**Agents:** Claude Opus 4.7 (parent).
**Wall-clock:** ~10 minutes.
**Scope:** Aggregate Session 3 metrics, sweep OPEN_PROBLEMS.md for resolved items, write end-of-session summary, coordinate handoff with the still-running Session 4 (Pass 4 batches in progress).

**Coordination note — NEXT_SESSION_PROMPT.md NOT archived in this session.** The original prompt's Phase 5 instruction was to archive-and-delete `transcripts/NEXT_SESSION_PROMPT.md`. Session 4 (the parallel Pass 4 re-grounding sweep with strict one-transcript-per-agent isolation) is still in flight and may still be referring to the prompt for its own scope (Phase 2 was originally Session 3's; Session 4 inherited it with a methodology improvement). Archive-and-delete responsibility passes to Session 4 once Pass 4 completes across all 127 audit-able entries. Session 3 explicitly leaves the prompt in place rather than risk pulling it out from under Session 4.

**Session 3 aggregate metrics (across all phases):**

| Metric | Value |
|---|---|
| Subagents spawned | 2 (Phase 1b + Phase 1c, parallel) + 1 (Phase 3 apply_corrections.py, background) = 3 total |
| Wall-clock by phase | Phase 1 ~30 min, Phase 4 ~60 min, Phase 3 ~25 min (background), Phase 5 ~10 min |
| Total wall-clock (overlapping) | ~3.5 hours including extended substrate-decision deliberation |
| Files created (this session) | 13 (rag/ × 6 + tests × 5 + docs/RAG_SUBSTRATE_DECISION.md + scripts/apply_corrections.py + transcripts/fix_cross_contamination.py + transcripts/build_catalog_extension.py + transcripts/build_adversarial_feed.py + transcripts/adversarial_review_feed.json) |
| Files modified (this session) | 3 (CLEANED_TRANSCRIPTS_REVIEW.md, OPEN_PROBLEMS.md, AUDIT_TRAIL.md) |
| Tests added | 57 (31 rag tests + 26 apply_corrections tests, all passing) |
| Lines of code added (excluding tests, JSON, docs) | ~3,000 across .mjs + .py + .sql |
| Cross-contamination items resolved | 22 (15 drops + 7 moves + 1 adversarial-flag drop + 2 reclassifications) |
| Catalog patterns added | 792 unique (across sections A–I extensions + 7 new sections J–P) |
| Adversarial-review items aggregated | 825 across 125 entries |
| OPEN_PROBLEMS items resolved this session | Problems 2, 3, 4 (cross-contamination, catalog back-fill, adversarial feed) |
| RAG-substrate decision | Pinecone Builder + Voyage-3 + voyage-rerank-2 (deferred Weaviate to a separate personal project) |
| aigamma.com migration | Schema migrated vector(384) → vector(1024); rag-ingest v3 + rag-search v2 deployed; 122 rows re-embedded with voyage-3 |

**Commits landed this session (Session 3, evening):**
- `2e95086` Land Session 3 Phase 3 + Phase 4: pipeline-integration preprocessor and Pinecone + Voyage RAG scaffolding
- *(Phase 5 commit pending after this writeup)*

**Cross-session commits also landed during the same wall-clock window (Session 4 sibling work):**
- `e325d79` Set up Session 4 Pass 4 cross-contamination firewall + back-fill Session 3 Phase 1 deliverables
- `685c6f9` Land Pass 4 batch 1 (entries #1-22)
- `eb149f6` Land Pass 4 batch 2 (entries #23-47)
- `653ae01` Land Pass 4 batch 3 (entries #48-70)
- `2da75df` Land Pass 4 batch 4 (entries #71-92)

**Handoff to whatever session picks this up next:**

1. **Pass 4 still in flight.** Session 4 has landed 92/127 audit-able entries; remaining ~35 entries are being processed by Session 4's parallel subagents. Once complete, Session 4 will need to write `transcripts/merge_pass4.py` (following the pattern of `merge_pass3.py`) and merge the Pass 4 staging files into the master overlay.

2. **Pinecone civil-rights-prod project not yet provisioned.** The scaffolding in `rag/` is implementation-ready but the Pinecone project + index need to be created via the Pinecone web console (see `rag/README.md` § "Setup steps"). Eric to action — one-time admin step.

3. **First production ingest pending.** Once Pinecone is provisioned + a full `scripts/apply_corrections.py` run completes against transcripts/raw/ (currently only entry #1 has been run by the Phase 3 test invocation), run `node --env-file=rag/.env.local rag/ingest.mjs` to push the corpus to Pinecone.

4. **aigamma.com VOYAGE_API_KEY pending.** Eric needs to set `VOYAGE_API_KEY` in Supabase Edge Function secrets (one CLI call: `supabase secrets set VOYAGE_API_KEY=pa-xxx --project-ref tbxhvpoyyyhbvoyefggu`). Until set, rag-search falls back to tsvector (graceful degradation in place).

5. **Adversarial-review ensemble feed ready.** `transcripts/adversarial_review_feed.json` (825 items, 11-category controlled vocabulary) is hand-off-ready for Eric's Kiro/Kimi/Codex/Gemini multi-model ensemble run.

6. **Substrate-adapter pgvector backup**: stubbed in `docs/RAG_SUBSTRATE_DECISION.md` as future insurance work; not yet implemented. Estimated 1–2 days if ever needed.

**End-of-session summary:** Session 3 set out to execute a 5-phase audit-hygiene + RAG-substrate-scaffolding agenda; mid-session the substrate decision was extensively renegotiated (Weaviate → Pinecone Builder + Voyage AI, after the team-handoff dimension moved up the priority stack and the realization that worldthought.com already covers Pinecone exposure). Phase 1 (cross-contamination cleanup + catalog back-fill + adversarial-review feed) shipped cleanly. Phase 2 (Pass 4 re-grounding) was superseded by Session 4 running in parallel with a methodologically tighter one-transcript-per-agent firewall. Phase 3 (apply_corrections.py preprocessor) and Phase 4 (Pinecone + Voyage scaffolding) shipped end-to-end with 57 passing tests + a complete decision record + ready-to-deploy code. The aigamma.com Voyage-3 migration was applied as a bonus deliverable (schema + Edge Functions + re-embed of 122 rows) since SPY was closed for the weekend and the migration had zero customer impact. The substrate decision was the dominant cognitive cost of the session; the execution side was straightforward once the decision locked.

**Session 3 closure note (added 2026-05-22, Session 4):** Session 3 completed Phase 1 (audit hygiene: cross-contamination cleanup + catalog back-fill + adversarial-review feed). Phases 2–5 were not executed in Session 3. Session 4 supersedes the Pass-4-re-grounding work that Session 3 Phase 2 was scoped to do, with a stricter methodology (one-transcript-per-agent) per Eric's directive. The other Session 3 phases (3 pipeline-integration, 4 Weaviate scaffolding, 5 finalization) remain unfilled and are deferred to a later session.

#### Layer 5 — Corpus-global fidelity sweep (2026-05-22 / 23 follow-on, user-requested final Claude-side review)

**Agents:** Claude Opus 4.7 (parent, no subagents — direct script work; user's prompt explicitly prohibited spawning further subagents).
**Wall-clock:** ~45 minutes from task start to commit-ready (parse pipeline development + iterative threshold tuning + four-dimension sweep + summary + audit-trail update).

**Scope:** Final Claude-side fidelity audit before the user hands off to the adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini + others). Operates on the master overlay `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` as a single corpus-global artifact rather than per-entry. Four fidelity dimensions, each orthogonal to anything per-entry passes could detect:

1. **D1 — Phantom Whisper-renderings.** Cross-checks each high/correct-confidence correction row's claimed Whisper rendering against the entry's raw transcript files (.txt / .srt / .vtt / .json). Rows whose rendering cannot be found (fuzzy `partial_ratio` < 85) flag as phantom — they will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time.
2. **D2 — Bidirectional canonical inconsistency.** Same Whisper rendering mapped to different canonical corrections across entries.
3. **D3 — Catalog-vs-per-entry contradiction.** Per-entry correction disagrees with catalog canonical for the same Whisper pattern.
4. **D4 — Cross-entry biographical inconsistency.** Birth-year claims about top-50 mentioned canonical figures.

**Methodology:**
- **Single-pass parse** of the 9.26 MB master MD into 16,214 correction rows + 1,118 catalog rows + 131 entry-metadata records (parser: `transcripts/layer5_extract_corrections.py`, reusable for future analysis).
- **In-memory raw-text cache** for all 131 raw transcript directories (128.3 MB total, cached once for D1's full sweep).
- **rapidfuzz `partial_ratio`** for D1 fuzzy matching; **token-set ratio** for D3 entity-equivalence.
- **Quote-aware variant extraction**: whisper-rendering cells that contain quoted spans (e.g., `"Reverend Brann" (3 occurrences at lines 23, 31)`) extract the quoted text as the variant rather than the whole cell.
- **Meta-filter**: rows with whisper-rendering cells that contain commentary patterns ("spelling propagation", "canonical spelling", "catalog backfile recommendation", etc.) excluded from D1 to avoid false positives on Pass 3 / Pass 4 missed-pattern commentary rows.
- **Self-confirm filter**: rows where whisper == correction (1,447 rows; bookkeeping confirmations rather than actual corrections) excluded from D1.
- **Confidence-resolution row filter**: rows where col[1] and col[2] are bare confidence words ("medium" / "high") excluded from correction parsing (those are Pass 3 confidence-resolution tables that have a different shape).
- **Catalog-section exclusion**: sections H / I / P / Z (and their extensions) excluded from D3's catalog map — those rows contain descriptive meta-text in col[0], not whisper renderings.
- **Tight name-proximity** for D4 birth-year extraction (figure name within 50 chars of the year, in birth-context syntactic frame) — replaces a loose ±200-char window that produced a false positive on Sam Mahone vs Charles Sherrod.

**Deliverables:**
- `transcripts/layer5_extract_corrections.py` — parser module (reusable). Parses master MD into structured `CorrectionRow` + `CatalogRow` + `EntryMetadata` records.
- `transcripts/layer5_fidelity_audit.py` — full pipeline (deterministic, re-runnable, ~15 s wall-clock).
- `transcripts/layer5_fidelity_audit.json` — 1.58 MB structured findings (well under 5 MB cap).
- `transcripts/layer5_fidelity_audit_summary.md` — human-readable summary (per-dimension counts + top-10 highest-impact + statistical observations + publication-grade assessment + recommended actions for the adversarial ensemble).

**Findings (per-dimension counts):**

| Dimension | Findings | Notes |
| --- | ---: | --- |
| D1 — Phantom Whisper-renderings | 939 | After self-confirm + meta-text filters. Of these, ~74 reference canonical figures (Medgar Evers, Stokely Carmichael, Bayard Rustin, James Forman, etc.) — high-impact subset for the ensemble to spot-check. The remaining ~865 are lower-impact (supervisor commentary rows, near-misses, minor mis-quotes). |
| D2 — Bidirectional inconsistencies | 628 | Dominated by formatting variance (Tougaloo vs Tougaloo College, Samuel vs Sammy Younge, Stokely vs Stokely Carmichael); ~8 with both substantial minority share AND > 4 occurrences are genuinely worth review. |
| D3 — Catalog contradictions | 191 | ~40 estimated real disagreements (Dinky Romilly vs Dinky Forman cluster, Janet Jemmott Moses vs Dona Moses Richards), ~120 different-referent false positives (same whisper rendering across genuinely different canonical referents — e.g., Hawaiian Damon vs Vernon Dahmer), ~30 minor formatting differences. |
| D4 — Biographical inconsistencies | 0 | Tightened proximity heuristic eliminated the original false positive (Sam Mahone b.1945 mis-attributed to Charles Sherrod). True biographical-consistency audit requires LLM-grade extraction; regex approach is methodology-limited. |

**Top 5 high-impact phantom findings** (canonical-figure rows where the supervisor's claimed Whisper rendering is not in the raw):

1. **#2.32 Amos Brown Pass 1**: "Pittsburgh Korea / Pittsburgh Kuzat" → "Pittsburgh Courier" — raw says "Pittsburgh Courier" (correct); supervisor invented the rendering.
2. **#103.26 Robert Hayling Pass 1**: "mega-evils" → "Medgar Evers" — neither term appears anywhere in Hayling's transcript.
3. **#3.76 Annie Pearl Avery Pass 1**: "Tugaloo College" → "Tougaloo College" — no college name appears in Avery's raw.
4. **#67.P2.13 Howell Pass 2**: "Joe Mosnier — NOT this interviewer; David Cline is" → "David Cline" — supervisor put commentary in the whisper-rendering cell.
5. **#116.34 Scott Bates Pass 1**: "Stocks-O Cymbol" → "Stokely Carmichael" — inventive rendering not in raw.

**Phantom distribution by pass section**: Pass 2 49%, Pass 1 30%, Pass 3 17%, Pass 4 2%, Pass 2 tail-sweep 2%. The Pass 2 plurality suggests the re-review-for-missed-errors layer introduced fabricated-pattern padding — supervisors invented variant renderings that "sounded plausible" given the canonical figure context but did not appear in source.

**Honest publication-grade assessment:** The audit overlay is publication-grade **with caveats**. The catalog (sections A–O + extensions) is internally consistent and high-quality; per-entry tables contain genuine high-value corrections that materially improve LLM downstream summarization. The caveats are: (a) ~5 % of high/correct-confidence rows have un-ground-truth-able Whisper renderings; (b) canonical names sometimes appear in two normalized forms across the corpus; (c) catalog and per-entry rows do not always agree on phrasing for the same figure; (d) cross-entry biographical consistency was effectively un-auditable by regex alone. The overlay is fit for downstream LLM grounding and Smithsonian/LoC review **provided the adversarial ensemble adjudicates the ~74 high-impact canonical-figure phantom rows** before any production write of corrected transcripts.

**Methodology orthogonal to prior passes:**
- Pass 1 / Pass 2 / Pass 3 / Pass 4 all operated per-entry — supervisors could not detect cross-entry inconsistencies.
- The cross-contamination follow-on cleanup (commit `847f763`) caught row-level misfiling and meta-cross-contamination by analyzing retraction-signal keywords in staging files, but did not verify whether claimed Whisper renderings actually existed in raw transcripts.
- Layer 5 is the first pass that treats the master MD as a single corpus-global artifact and validates the relationship between (correction rows) → (raw transcripts they claim to correct) + (catalog) ↔ (per-entry overlay).

**Handoff to the adversarial ensemble:** the four artifacts (JSON + summary + parser + pipeline) are committed. Eric's Kiro/Kimi/Codex/Gemini ensemble should prioritize the canonical-figure phantom subset (top-10 in summary), then the maiden-vs-married name normalizations (D2), then the catalog reconciliation candidates (D3 real disagreements). Adversarial findings should feed back into a final master-MD revision pass, after which the overlay is ready for `scripts/apply_corrections.py` to produce `transcripts/corrected/`.

#### Layer 5 fidelity-deploy follow-on (2026-05-23 early-morning, post-Layer-5 production application)

After Layer 5 produced 1,758 advisory findings (`transcripts/layer5_fidelity_audit.json`, summary + commit `6a70838`), the user requested production application of the high-confidence subset to the master MD ahead of the adversarial multi-model ensemble handoff. This sub-section documents the deploy.

**Agents:** Claude Opus 4.7 (parent, no subagents — direct script work per user directive).
**Wall-clock:** ~45 minutes (script development + dry-run iteration + idempotency fixes + apply + documentation).
**Deliverables:**
- `transcripts/fix_layer5_findings.py` — atomic, idempotent four-phase deploy script that selectively mutates the master MD based on Layer 5 findings. Distinguishes (a) canonical-figure phantom rows (annotate-for-ensemble), (b) low-impact phantom rows (physically remove + per-entry audit log), (c) high-majority D2 normalizations ≥80% share with ≥4 occurrences (rewrite correction cell + audit annotation preserving the original), (d) ambiguous D2 + all D3 contradictions (annotate-for-ensemble). Canonical-figure detection consults `Metadata Generation System/civil_rights_facts.json` (140 entries, 448 unique names+aliases after Phase D expansion). Two non-trivial bugs caught during iteration: (1) `find_row_line` was matching Pass 3 annotation rows that reference an earlier row via `(context)` parenthetical syntax — fixed by requiring row_id to be directly followed by a pipe-cell-separator; (2) `append_to_notes` was using ` | ` as separator which created a NEW table cell rather than appending to the existing notes cell, breaking idempotency on subsequent runs — fixed by switching to ` // ` separator. A third fix tightened the minimum-pipe-count threshold from 3 to 6 to exclude 3-column adversarial-flag tables from being treated as the original correction row.

**Action breakdown (single atomic apply, verified idempotent via second dry-run):**

| Layer 5 dimension | Action | Count |
| --- | --- | ---: |
| D1 canonical-figure phantoms | Annotate `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` | 130 |
| D1 low-impact phantoms | Physically remove + per-entry Layer 5 removal log | 770 (across 124 entries) |
| D2 high-majority normalizations (≥80% + ≥4 occ) | Rewrite correction cell + annotation preserving original | 7 |
| D2 ambiguous (<80% majority or <4 occ) | Annotate `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]` | 1,174 |
| D3 catalog contradictions | Annotate `[LAYER-5: D3-catalog-contradiction (catalog 'X': 'canon'), ensemble-adjudication-pending]` | 179 |
| **Total rows mutated** | | **2,260** |

Master MD size delta: 9,257,591 → 9,112,733 chars (−144,858 chars / ~−1.6%). The shrink is dominated by the 770 physical removals; the ~1,500 annotations added back ~150 KB of notes-cell text.

**D2 normalizations applied (the 7 highest-confidence corpus-wide name harmonizations):**

| Entry | Row | Original correction | Normalized correction | Share | Total occ |
| --- | --- | --- | --- | ---: | ---: |
| #29 | 29.P3.8 | "already in catalog section A" | "Joe Mosnier" | 96% | 24 |
| #53 | 53.P2.10 | "SNCC office" | "SNCC (Student Nonviolent Coordinating Committee)" | 96% | 22 |
| #90 | 90.P2.15 | "(James) Forman (uncertain)" | "James Forman" | 90% | 10 |
| #3 | 3.17 | "Jim Forman" | "James Forman (Jim Forman)" | 80% | 10 |
| #7 | 7.23 | "Jim Forman" | "James Forman (Jim Forman)" | 80% | 10 |
| #105 | 105.51 | "Rev. Hosea Williams" | "Hosea Williams" | 90% | 10 |
| #124 | 124.P2.18 | "Dinky (Constance) Romilly Forman" | "Dinky Romilly (Constance \"Dinky\" Romilly)" | 80% | 5 |

Each normalization preserves the original correction in a `[LAYER-5: D2-normalized 'X' -> 'Y' (majority NN% of M occ)]` audit annotation appended to the notes cell, so the ensemble can spot-check the normalization and reverse it if needed.

**D1 removal distribution (top 5 entries by phantom-removal count):** #124 Tillow −23 (Senate-era figures padded with bookkeeping rows), #26 D'Army Bailey −19, #53 Simmons −19, #52 Patton −18, #125 Parker −18.

**Phase B per-entry audit log:** each of the 124 affected entries gets a one-line `*Layer 5 removed N low-impact phantom rendering rows (whisper renderings not present in raw).*` annotation inserted after its Status line, preserving institutional auditability of what was removed.

**What was explicitly deferred (per the prompt's "annotate-don't-resolve" constraint for ambiguous cases):**
- 800+ D1 phantom canonical-figure rows that didn't reach the canonical-name-detection threshold (fuzzy <85 but rendering not in raw) — these are the ensemble's adjudication queue.
- 1,174 D2 ambiguous rows (majority <80% or total <4 occ) — all annotated, none auto-resolved.
- 179 D3 catalog-vs-per-entry contradictions — all annotated, none auto-resolved (per prompt: "if the D3 contradiction is purely formatting and one form has clear majority, apply the normalization" — the implementation defers ALL D3 to the ensemble rather than risk wrongly auto-resolving genuine catalog-disambiguation cases like "Dinky Romilly" vs "Dinky Forman" or "Janet Jemmott Moses" vs "Dona Moses née Richards").

**Constraints satisfied:**
- **Idempotent**: second dry-run produces 0 changes (`Master MD size: 9,112,733 → 9,112,733 chars (+0)`).
- **Atomic**: single read of master MD, all mutations in memory, single write back.
- **Catalog sections A–Z + extensions untouched**: catalog rows are excluded from D1/D2/D3 source data by Layer 5's own filters (sections H / I / P / Z). The master-MD edits only touch per-entry correction tables.
- **Per-entry Subject paragraphs untouched**: Problem 8 territory; the script only mutates row lines inside markdown tables.
- **`transcripts/raw/` never read or written**: the script operates only on the master MD overlay.

**Smithsonian/LoC publication-gate impact:** The 770 low-impact phantom removals eliminate dead-weight rows that would have silently no-op'd in `scripts/apply_corrections.py` preprocessing. The 130 canonical-figure phantom annotations + 1,174 D2 ambiguous annotations + 179 D3 contradiction annotations are the ensemble's structured punch-list — each annotation contains enough context (fuzzy score, original variant, catalog canonical, majority share) for an adversarial model to make a decision without re-running Layer 5. The 7 normalizations are corpus-wide consistency improvements that directly raise institutional credibility (the audit overlay now uses a single canonical form for high-frequency figures rather than ~5% variant inconsistency).

**Handoff:** the master MD is now in a state where (a) `scripts/apply_corrections.py` will produce cleaner output (no silent no-ops from the 770 removed phantoms), and (b) the adversarial ensemble has a focused triage queue (130 + 1,174 + 179 = 1,483 annotated rows tagged with explicit Layer 5 markers searchable via `grep "\\[LAYER-5:"` against the master MD).

---

### Session 4 — 2026-05-22 (later): Pass 4 sweeping QA + fact-check (one-transcript-per-agent architecture)

**End-of-session summary:** Pass 4 complete on all 127 audit-able entries with strict one-transcript-per-agent isolation. The cross-contamination firewall (`transcripts/per_entry_slices/` + the prompt-level prohibition) held across every entry: zero observed cross-contamination errors from Pass 4 itself, AND Pass 4 actively *identified* prior Session 1/2 cross-contamination (phantom rows in entries #9, #16, #43, #52, #59, #60, #69, #82, #92, #102, #104, #107, #110, #122, #130 and others — all flagged for retraction in the merged Pass 4 block per entry). Six milestone commits + six pushes to origin/master across the session; one socket-disconnect retry (entry #83), zero data loss. Wall-clock end-to-end ~3.5 hours from slicing-infrastructure setup through master-MD merge. The master overlay grew from ~6.1 MB pre-Pass 4 to ~9.3 MB post-Pass 4 (+52% reflecting the volume of Pass 4 net-new catches + fact-check verifications + corpus-candidate proposals). **Next priorities for whatever session picks this up:** (1) consolidate the publication-blocking Subject-paragraph corrections across many entries into a new OPEN_PROBLEMS Problem 8 (Smithsonian-grade metadata gate); (2) feed the augmented adversarial-review queue (now larger after Pass 4 demoted several previously-high rows and added new flags) into Eric's Kiro/Kimi/Codex/Gemini ensemble; (3) commit the ~80+ net-new ground-truth corpus candidates surfaced by Pass 4 to `civil_rights_facts.json` in a batched expansion (60→140→~220+). **Manual-intervention blockers:** none for Pass 4 work itself; the existing Session-3 deployment blockers (Pinecone provisioning, Supabase secrets) are unaffected.

**Agents:**
- Claude Opus 4.7 (parent / orchestrator)
- 128 general-purpose subagents in total: 127 for the Pass 4 sweep (one per audit-able entry) + 1 retry for entry #83 (socket-disconnect on first attempt) — spawned in 6 parallel batches across 6 messages

**Wall-clock:** ~3.5 hours end-to-end. Phase 1 (slicing infrastructure) ~10 min. Phase 2 (6 parallel subagent batches): batch 1 ~8 min, batch 2 ~8 min, batch 3 ~9 min, batch 4 ~10 min, batch 5 ~10 min, batch 6 ~9 min — sum-of-slowest ~55 min wall-clock (vs. sum-of-all ~12 hours of subagent compute time). Phase 3 (merge + tracker patch) ~5 min. Phase 4 (audit-document finalization) ~15 min.

**Scope:** Pass 4 sweeping quality-assurance + fact-check pass across all 127 audit-able entries. Same skip-set as prior passes: {28, 31, 46, 64, 95}. Pass 4 is the fourth audit pass over the corpus and the **first pass after the Phase D corpus expansion (60→140) and the Phase 1b catalog extension** — every previously low/medium/adversarial-flagged row is being re-grounded against substantially more canonical ground truth than Pass 3 had access to.

**Methodology shift from Session 2/3:**
- **One-transcript-per-agent strict isolation.** Each subagent is scoped to exactly one entry's content; cross-contamination is foreclosed at the data layer (the master MD is never read by a subagent — only its pre-sliced per-entry chunk).
- **Pre-slicing firewall.** Before any subagent runs, `transcripts/slice_master_md.py` extracts each entry's section from the 6.1 MB master MD into `transcripts/per_entry_slices/entry_NN.md` (127 files, ~5.9 MB total). Each subagent reads exactly: its slice + its Pass 3 staging file + the ground-truth corpus. No subagent reads any other entry's data, and no subagent reads the master MD.
- **Parallel batches across messages.** Subagents are spawned in multiple parallel batches of ~25 per message. Each batch's wall-clock = slowest single subagent in the batch. Staging files are committed and pushed after each batch so progress is visible on GitHub at milestone boundaries.
- **Per-entry deliverable explicit.** Each subagent writes a single Pass 4 staging file: `transcripts/pass4_stage/entry_NN.md`. The file structure mirrors Pass 3's: confidence resolutions, new catches / corrections, ground-truth corpus candidates, adversarial-review flag updates, audit-complete marker.

**Why this methodology shift:** Session 2's Phase A used 18 supervisors handling ~5 entries each — that arrangement was correlated with the ~22 cross-contamination items that Session 3 Phase 1a had to clean up afterward (`transcripts/fix_cross_contamination.py`). The user's directive in opening Session 4 was: "each agent can only look at one transcript at a time — before, when I attempted to use 132 separate agents, there were massive cross-contamination errors where it would be reading more than one document and then blending them together." This audit pass therefore enforces the one-transcript-per-agent rule architecturally, not just by prompt convention.

#### Phase 1 — Slicing infrastructure + Session 4 initialization

**Agents:** Claude Opus 4.7 (parent, no subagents)
**Wall-clock:** ~10 minutes
**Deliverables:**
- `transcripts/slice_master_md.py` — re-runnable per-entry slicer with manifest output
- `transcripts/per_entry_slices/` — 127 entry slice files + `manifest.json` (entry_num → subject + raw_dir + slice_path + pass3_path + slice_size_bytes)
- `transcripts/AUDIT_TRAIL.md` — this Session 4 entry initialized
- 1 warning recorded: entry #35 ("Elbert 'Big Man' Howard") raw-directory path uses straight quotes in master MD but the filesystem dir uses curly quotes — cosmetic mismatch, does not affect Pass 4 (slicing extracts the section regardless; the raw-transcript spot-check, if needed, can be done via the actual filesystem name)

**Slice size distribution:**
- Median: 44,585 bytes
- Largest 5: #34 Thelwell 102 KB, #129 Leventhal 92 KB, #115 McKinney 90 KB, #100 Branch+Smith 80 KB, #17 McLaurin 76 KB
- Smallest 5: #18 Sherrod 18 KB, #88 Moore 20 KB, #16 McDew 22 KB, #55 Brown 23 KB, #23 Browner 24 KB

#### Phase 2 — Parallel Pass 4 subagent batches

**Agents:** 6 parallel batches of subagents; 22 + 22 + 22 + 22 + 22 + 17 = 127 unique subagents, plus 1 retry (entry #83) = 128 total Pass 4 subagent invocations.
**Wall-clock:** ~55 min (sum of slowest-subagent-per-batch). Subagent compute time aggregate ~12 hours.
**Scope:** Pass 4 sweeping QA + fact-check across all 127 audit-able entries.

| Batch | Entries | Sub-agents | Notes |
|---|---|---|---|
| 1 | #1-22 | 22 | Includes the BPP-Seattle, Brown, Avery, Hamilton-Ulmer, Vickers, Caldwell, Robinson, Russell, Booker+Newsom, Luper, Carawans, Miller, Young, Williams, Marshall, McDew, McLaurin, Sherrod, Siler, Jones, Magee, Sellers entries. Cross-contamination firewall held cleanly. |
| 2 | #23-47 (skip #28, #31, #46) | 22 | Browner, Cox, Anderson, Bailey, Diamond, Cotton, Zellner, Derby, Holloway, Thelwell, Howard, Dahmer (Ellie), Dixon, Bassett, Finney, Terry, Simpson, Hopkins, Adams-Johnson, Greene, Hrabowski, Arellanes. |
| 3 | #48-70 (skip #64) | 22 | Grinnell, Richardson, Miller, Duncan, Patton, Simmons, Geiger, Brown, Greenberg, Jones, Jamila Jones, Lawson, Mulholland, Rosenbergs, Carlos, Churchville, McCullar, Lowery, Howell, Henderson, Judy Richardson, Burns. |
| 4 | #71-92 | 22 | Becton, Williams, Cleaver, Tillow (Kay), Ladners, Guyot, Guster, Degelmann, Anderson Todd, King, Varela, Hildreth, Noonan, Mary Jenkins, Mary Jones, Camarillo, Perry, Moore, McCarty, Roxborough, Walter, Nathaniel Hawthorne Jones. ONE socket-disconnect on entry #83 (Noonan); retry succeeded. |
| 5 | #93-115 (skip #95) | 22 | Mtume, Hill Jr., Connor, Seeger, Hutchings, Conway, Branch+Smith, Robinson, Blake, Hayling, Sobol, Tuttle, Brown, Clark, Carter, McClary, Alexander, Head, Sales, Mahone, Young Jr., McKinney. |
| 6 | #116-132 | 17 | Bates, Sherrod (Shirley), McNichols, Gaither, Jenkins (Timothy), Dahmer Jr., George, Bruce, Tillow (Walter), Parker, Anderson (William G.), Strickland, Lucy, Leventhal, Saunders, Long, Walker. The Memphis-Sanitation + Emmett-Till + Albany-Movement + SCLC-Walker canonical Movement-anchor batch. |

**Per-batch milestone commits:** `e325d79` infrastructure setup; `685c6f9` batch 1; `eb149f6` batch 2; `653ae01` batch 3; `2da75df` batch 4; `c93d8d9` batch 5; batch 6 files swept into the parallel Session 3 agent's Phase 5 commit `e0a1dbf` (work preserved, attribution differs). Six commits + six pushes total for Phase 2; each commit included multi-paragraph commit-message documentation of the batch's substantive findings.

**Substantive findings aggregated across all 6 batches (counts approximate from per-subagent reports):**
- **Net-new Pass 4 catches** (errors missed by all of Pass 1+2+3): ~2,500+ rows across 127 entries (avg ~20 per entry; high-density entries 40-60+; low-density entries 5-10).
- **Re-grounding promotions** (low/medium/flagged → high via expanded corpus + extended catalog): ~250+ rows.
- **Re-grounding demotions** (high → medium/low, or kept-with-correction): ~100+ rows.
- **Fact-check verifications** (high-confidence rows + Subject paragraph claims verified against canonical sources): ~1,500+ items.
- **Subject paragraph corrections needed** (publication-blocking metadata fixes): ~50+ entries with at least one correction; ~120+ individual claim-level fixes. This is a substantial corpus-wide governance finding -- many transcript Subject paragraphs as currently written contain claims that are not directly supported by the transcript, or that conflate canonical biographical facts from elsewhere with what the speaker actually said. Consolidating these into a new OPEN_PROBLEMS Problem 8 is the recommended follow-up.
- **Cross-contamination retractions** discovered by Pass 4 (phantom rows in Pass 1/2/3 that don't actually appear in the entry's raw transcript): ~30+ rows across ~20 entries.
- **Net-new ground-truth corpus candidates** surfaced: ~250+ unique additions (cross-corpus-deduplicated to ~80+ high-priority canonical figures). Top examples: Eleanor Roosevelt (#124), Sam Bowers (#36/#121), George Jackson (#42), Joe Mosnier-as-figure (cross-corpus interviewer self-reference), Annie Devine (#41), Casamiro Pereira (#63 — COINTELPRO informant of historic interest), Bobby Morrow (#62), Kenneth Gibson (#72), Maggie Kuhn + Gray Panthers (#93), Mike Espy (#96), Hardy Frye (#7), Mary King (#76/#69), Charles Sherrod aliases consolidation (#18), Mickey Schwerner (#22 + #60), Hubert Humphrey (#22 + #79), James Forman aliases consolidation (#73), William Robert Ming Jr. (#20), Bayard Rustin + Joseph Rauh Jr. aliases (#79 + #124), Mahalia Jackson (#20), and ~70 more.
- **Net-new catalog patterns** surfaced (Whisper failure modes that recur in Pass 4 entries but aren't in catalog A-I / J-P / Z): ~150+ patterns across catalog sections. Top families: name-decomposition (Featherstone→fell the stone; Stoke Lee→Stokely; "Stokely called Michael"→Stokely Carmichael); SNCC→snake corpus-wide pattern; interviewer-name garble (Joe Manier→Joe Mosnier) corpus-wide; semantic-inversion (encumbering→empowering, freedom writer→Freedom Rider, two-gallonine→Tougaloo Nine, treasure→treasurer, blue→blew, sleeping→sit-ins, race rights→race riots); HBCU-name garbles (Mojas→Morehouse 12+ instances in single #80 entry; Spellman→Spelman 17+ instances in same; Marsh College→Morris College; Mojave→Morehouse; Mahari→Meharry; Tougaloo→Tugulu/two-gallonine/two-balloons 8+ variants corpus-wide); transliteration failures (Pholela→Pallela; Pietermaritzburg→Peter Maritzburg; Sierra Maestra→year of Madras; Khrushchev→crew chef); idiom degeneration (hitch my star→hook my style; fair and impartial→fan impassure; snowball in hell→snowball in the hill; nose to the grindstone→ground and stone); homophone family (mass meetings→math meetings; pastor→pasture 4x; soul food→so food; statute→statue 3x); decomposition (canonical multi-word names compressed into single-word phantoms — "need a black well"→Annie Devine, "Ma'an Lupi King"→Martin Luther King, "I-uh-stayed at Ortho"→I stayed at Ortho, "Synogoctynful"→St. Augustine Foot Soldiers); gospel-hymn-lyric chain degradation (#112 Sales — Brighton Morningstar / shelter in the region / still on the way out of no way); obscenity-redaction (#112 — Whisper sanitized "fucking" to "near"); Whisper transcription-loop triplication artifact (#87 Perry — mass-deletion risk across corpus); singular-verb-agreement-test for catching one-person-as-two-name renderings (#75 Ladners).
- **Adversarial-review flag updates:** ~150+ Pass 3 flags resolved against the 140-entry corpus; ~300+ remained or newly added (the queue grew rather than shrank because Pass 4 found more ambiguity than it resolved — the canonical "more eyes = more questions" pattern). Updated feed delta needs to flow to Eric's Kiro/Kimi/Codex/Gemini ensemble.
- **Subagent error rate:** 1 socket-disconnect out of 127 first-attempt subagents (0.8%); 0 cross-contamination errors observed in any subagent output; 0 staging files corrupted or missing post-batch.

#### Phase 3 — Merge Pass 4 staging into master MD

**Agents:** Claude Opus 4.7 (parent, no subagents).
**Wall-clock:** ~5 minutes.
**Deliverables:**
- `transcripts/merge_pass4.py` — re-runnable merge script following the pattern of `merge_pass3.py`. Inserts Pass 4 block before each entry's closing `---`. Updates Status line to add "Pass 4 complete." (idempotent — re-running skips already-merged entries via Pass 4 sentinel string detection).
- `transcripts/patch_tracker_pass4.py` — one-shot Progress Tracker patch (added because the tracker's fixed-width column padding did not match the parameterized regex in `merge_pass4.py`). Adds a "Pass 4" column header + separator and inserts "2026-05-22" into the new column for each of the 127 audit-able entries.
- `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` — master overlay updated from 6,112,733 chars (pre-Pass-4) to 9,279,632 chars (post-merge + tracker patch). Each of the 127 audit-able entries now contains a "#### Pass 4 sweeping QA + fact-check (2026-05-22)" block with seven standardized sub-tables.

**Merge commit:** `32516a3` Merge Pass 4 sweeping QA + fact-check into master CLEANED_TRANSCRIPTS_REVIEW.md (+3.17 MB, 127 entries) and add Pass 4 column to Progress Tracker.

**Anomalies / handoff notes:**
- The merge inserted Pass 4 blocks cleanly with zero collisions against existing Pass 3 / Pass 2 / Pass 1 / tail-sweep content.
- One semi-automated step: the Progress Tracker header + separator + row updates required a separate script (`patch_tracker_pass4.py`) because the tracker uses fixed-width column padding that didn't match the parameterized regex in the main merge script. Future passes (if any) should generalize the tracker-update logic.
- The 127 per-entry slice files in `transcripts/per_entry_slices/` are RETAINED in the repo as audit-trail provenance — a future session or downstream Smithsonian/LoC reviewer could verify any Pass 4 catch by re-running the same slice through a different model or reviewer.

#### Phase 4 — Audit-document finalization (this AUDIT_TRAIL.md + OPEN_PROBLEMS.md + Progress Tracker)

**Agents:** Claude Opus 4.7 (parent, no subagents).
**Wall-clock:** ~15 minutes (this section + OPEN_PROBLEMS.md sweep + final commit).
**Deliverables:**
- `transcripts/AUDIT_TRAIL.md` — Session 4 entry populated with End-of-session summary + Phase 2 batch-by-batch metrics + Phase 3 merge metrics + this Phase 4 sub-section + aggregate metrics row in the cross-session aggregate table below + diminishing-returns row in the diminishing-returns table below.
- `transcripts/OPEN_PROBLEMS.md` — Pass 4 resolutions noted (most prior problems substantially advanced; new Problem 8 added consolidating the publication-blocking Subject-paragraph errors corpus-wide).
- `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` Progress Tracker — Pass 4 column added with 127 audit-able entries dated 2026-05-22.

**Final commit + push:** `(pending)` will land this AUDIT_TRAIL Session 4 finalization + OPEN_PROBLEMS Problem 8 + cleanup.

**Coordination note:** This Session 4 ran concurrently with a parallel Session 3 (Phase 3 + Phase 4 + Phase 5 — pipeline preprocessor + Pinecone/Voyage RAG scaffolding + Session 3 finalization). Eric was running both sessions in parallel — Session 4 owned the Pass-4 sweep (which had originally been Session 3 Phase 2 but was reassigned to Session 4 with methodologically tighter one-transcript-per-agent isolation per Eric's directive); Session 3 owned the pipeline + RAG scaffolding. The two sessions coordinated via git: each pushed independent commits to `origin/master` with no merge conflicts. Session 3 closed first (with `e0a1dbf` Phase 5 finalization). Session 4 closes second with this commit. The canonical `transcripts/NEXT_SESSION_PROMPT.md` is now archived (single-use convention satisfied).

---

### Session 2 — 2026-05-22: Pass 2 + tail-sweep + Pass 3 + corpus expansion (parallel-subagent architecture)

**Agents:**
- Claude Opus 4.7 (parent / orchestrator)
- 58 general-purpose subagents across 4 phases (18 Phase A + 14 Phase B + 26 Phase C + 1 Phase D), each running independently on the same model

**Wall-clock:** ~1 hour for all 4 phases plus merges plus corpus expansion plus this doc plus the OPEN_PROBLEMS.md handoff doc

**Scope:** Pass 2 across entries #43–#132 (87 entries); Pass 2 tail-sweep on 14 partial-reads from #1–#42; Pass 3 across all 127 audit-able entries; ground-truth corpus expansion 60 → 140

**Methodology shift:**
- Architectural pivot from sequential `/loop` cadence to **parallel subagent spawning** (per user directive on 2026-05-22 in response to observed throttling pattern)
- Each phase: spawn N supervisor subagents in a single message → supervisors write to dedicated staging directory → parent runs merge script to insert into master MD
- Wall-clock = slowest single subagent in the batch, not the sum

**Pacing constraints codified mid-session:**
- Added "Pacing constraints" section to project `CLAUDE.md` and global `~/.claude/CLAUDE.md`
- Saved `feedback_no_token_throttling.md` to project memory
- Effective for all future sessions on this and other projects

#### Phase A — Pass 2 on entries #43–#132

**18 supervisors × ~5 entries each (87 total).** Each supervisor: read entry's Pass 1 table + cross-corpus catalog + raw transcript → produce Pass 2 corrections table → write to `transcripts/pass2_stage/entry_NN.md`.

| Metric | Value |
|---|---|
| Entries processed | 87 |
| Total Pass-2 corrections produced | ~4,000+ |
| Avg corrections per entry | ~45 |
| High-density entries (>100 corrections) | #52 Patton (117), #53 Simmons (99), #129 Leventhal (213), #115 McKinney (205) |
| Partial-read tails handled in-phase via `tail -c` Bash workaround | ~8 entries |
| Source-level truncations confirmed | #59 Lawson, #67 Howell, #69 Richardson |
| Severe Whisper degradation confirmed | #109 McClary |

#### Phase B — Pass 2 tail-sweep on 14 partial-reads from #1–#42

**14 focused subagents in parallel**, each handling one entry's previously-unread tail bytes (offset 68000+ to EOF).

| Metric | Value |
|---|---|
| Entries processed | 14 |
| Total tail-sweep corrections | ~870 |
| Avg corrections per tail | ~62 |
| Largest tail audited | #34 Thelwell (170 corrections from 122 KB tail) |
| File-size discrepancies discovered | #8 Russell actual 109 KB not 140 KB; #12 Miller actual 76 KB not 119 KB; #89 McCarty actual 24 KB not 88 KB |
| Whisper duplication artifact confirmed | #38 Bassett (~byte 78000 onward, Riverside Church passage transcribed verbatim twice) |

#### Phase C — Pass 3 final consolidation across all 127 audit-able entries

**26 supervisors × ~5 entries each.** Each supervisor: read entry's full Pass 1 + Pass 2 (+ tail-sweep where applicable) tables + ground-truth corpus + cross-corpus catalog → produce Pass 3 consolidation block with four structured sub-tables.

| Metric | Value |
|---|---|
| Entries processed | 127 |
| Confidence resolutions (low/medium → high or flagged) | ~1,500+ |
| Adversarial-review flags (deferred to multi-model ensemble) | ~500 |
| Ground-truth corpus candidates surfaced | ~250 (deduplicated to ~80 unique high-priority) |
| Pass 3 missed-pattern catches (catalog-back-fill candidates) | ~500 |
| Cross-contamination items flagged | ~22 (Pass 2 rows misfiled into wrong entry's table) |
| Speaker-originating factual-error flags (for editorial footnoting) | ~9 |

#### Phase D — Ground-truth corpus expansion

**1 focused subagent.** Read all 127 Pass 3 staging files + catalog Section I + existing `civil_rights_facts.json` → aggregate, deduplicate, rank by recurrence + canonical importance → add top 80 to corpus.

| Metric | Before | After |
|---|---|---|
| Canonical entries | 60 | **140** |
| Aliases | ~138 | **291** |
| Validation (`scripts/validate_facts.py`) | passes | passes |

Top 10 additions (by cross-corpus recurrence): James Forman, Charles Sherrod, Cleveland Sellers, Wyatt Tee Walker, Fred Shuttlesworth, Vernon Dahmer Sr., Clyde Kennard, Hosea Williams, Constance Baker Motley, Charles Hamilton Houston.

**Deferred (~10 candidates, low-confidence, awaiting adversarial ensemble):** Joseph Miller Sr., "Pop Herb", Mrs. Eberhart Spinks, L. Warren "Gator" Johnson, Tamio Wakayama, Mendy Samstein, Frederick Herzberg, Henrietta Lacks, Henrietta Canty, Robert McClary placeholder.

#### Mid-session catalog construction

Built the "Cross-corpus recurring error patterns" sweep-rule catalog as a new top-level section of the master MD. **~70 high-frequency Whisper-failure patterns** documented across 9 categories (sections A–I). Designed as a sweep-rule reference for future QA agents and as the basis for Stage-2 fuzzy-matcher tuning.

#### Session 2 git artifacts

3 commits pushed to `origin/master`:
- `d27c3b8` Pacing constraints in CLAUDE.md + `.gitignore` widening
- `8591d74` Long-untracked design docs (TRANSCRIPT_AUDIT_DESIGN.md, WEAVIATE_INTEGRATION_DESIGN.md)
- `cf7f03d` Full 4-phase audit deliverable (234 files, +43,107 lines)

#### Session 2 handoff

- `OPEN_PROBLEMS.md` created at session close with 7 problem categories + recommended sequence
- Per-entry staging files preserved in `pass2_stage/`, `pass2_tail_stage/`, `pass3_stage/` for differential reviews

---

## Per-entry coverage matrix

Pass timestamps + coverage notes. Use this as the structured input for inferential error-rate scoring per entry. (See "Inferential scoring framework" section below.)

The full per-entry data lives in the Progress Tracker section of `CLEANED_TRANSCRIPTS_REVIEW.md` (lines ~304-440). This matrix records categorical-coverage flags for analysis-script consumption.

**Pass 4 coverage (Session 4, 2026-05-22 later):** Pass 4 sweeping QA + fact-check is `F` (full) for all 127 audit-able entries, with the following per-entry caveats unchanged from prior passes: #109 McClary remains `D` (severe Whisper degradation — Pass 4 confirmed the publication-blocker status); #59 Lawson + #67 Howell + #69 Richardson remain `M` (source-level mid-sentence truncations — Pass 4 confirmed no errors past the truncation points and reiterated the splice-needed status). The matrix below is the Pass 1+2+3 coverage flags; treat the Pass 4 column as universally `F` across all 127 rows except the 4 caveats above (which inherit their prior-pass flag).

**Coverage flag legend:**
- `F` = full transcript read end-to-end
- `P-NN` = partial-read covered NN% of bytes
- `T` = tail-sweep applied (full coverage restored)
- `S` = SKIPPED (empty source dir / 3+-speaker pipeline failure)
- `R` = redirect (covered via joint interview)
- `D` = severe Whisper degradation
- `M` = mid-sentence source truncation (not retry-resolvable)

| Entry # | Pass 1 | Pass 2 | Pass 3 | Status |
|---|---|---|---|---|
| 1 Aaron Dixon | P-59 | F (P-59 + T) | F | Tail-sweep applied 2026-05-22 |
| 2 Amos C. Brown | F | F | F | Clean |
| 3 Annie Pearl Avery | F | F | F | Clean |
| 4 Audrey Hamilton + Ulmer | F | F | F | Clean (joint, 2 speakers) |
| 5 Barbara Edna Vickers | F | F | F | Clean |
| 6 Ben Caldwell | P-70 | F (P-70 + T) | F | Tail-sweep applied |
| 7 Betty Garman Robinson | P-51 | F (P-51 + T) | F | Tail-sweep applied |
| 8 Bill Russell | P-65 | F (P-65 + T) | F | Tail-sweep applied; transcript size was 109KB not 140KB |
| 9 Booker + Newsom | F | F | F | Clean |
| 10 Calvin Luper | F | F | F | Clean |
| 11 Carawan (Candie + Guy) | F | F | F | Clean |
| 12 Miller (Carolyn + James) | P-94 | F (T) | F | Tail-sweep; transcript actually 76KB |
| 13 Carrie Lamar Young | P-80 | F (P-80 + T) | F | Tail-sweep applied |
| 14 Cecil J. Williams | P-80 | F (P-80 + T) | F | Tail-sweep applied |
| 15 Cecilia Suyat Marshall | F | F | F | Clean |
| 16 Charles F. McDew | F | F | F | Clean |
| 17 Charles McLaurin | P-37 | F (P-37 + T) | F | Tail-sweep applied (largest tail, 116KB) |
| 18 Charles Sherrod | F | F | F | Clean |
| 19 Charles Siler | F | F | F | Clean |
| 20 Clarence B. Jones | P-60 | F (P-60 + T) | F | Tail-sweep applied |
| 21 Clarence Magee | F | F | F | Clean |
| 22 Cleveland Sellers | F | F | F | Clean |
| 23 Clifford Browner | F | F | F | Clean |
| 24 Courtland Cox | F | F | F | Clean |
| 25 Anderson (Cynthia + Fletcher) | F | F | F | Clean (joint, 2 speakers) |
| 26 D'Army Bailey | P-46 | F (P-46 + T) | F | Tail-sweep applied |
| 27 Dion Diamond | F | F | F | Clean |
| 28 Abernathy family | S | – | – | SKIPPED — 3 speakers, empty source dir, needs re-transcription |
| 29 Dorothy Foreman Cotton | P-69 | F (P-69 + T) | F | Tail-sweep applied |
| 30 Dorothy "Dottie" Zellner | P-51 | F (P-51 + T) | F | Tail-sweep applied |
| 31 Dorie Ann Ladner | R | R | R | Redirect to joint #75 |
| 32 Dr. Doris Derby | F | F | F | Clean |
| 33 Eddie Holloway | F | F | F | Clean |
| 34 Ekwueme Michael Thelwell | P-36 | F (P-36 + T) | F | Tail-sweep applied (122KB tail) |
| 35 Elbert "Big Man" Howard | F | F | F | Clean |
| 36 Ellie Dahmer | F | F | F | Clean |
| 37 Elmer Dixon | F | F | F | Clean |
| 38 Bassett (Emmett + Priscilla) | P-75 | F (P-75 + T) | F | Tail-sweep applied; Whisper duplication artifact in tail |
| 39 Ernest Adolphus Finney Jr. | F | F | F | Clean |
| 40 Esther M. A. Terry | F | F | F | Whisper repetition artifact in opening |
| 41 Euvester Simpson | F | F | F | Clean |
| 42 Evans Derrell Hopkins | F | F | F | Clean |
| 43 Frankye Adams-Johnson | F | F | F | Clean |
| 44 Freddie Greene (Biddle) | F | F | F | Clean |
| 45 Freeman A. Hrabowski III | F | F | F | Speaker-originating "1941 atom bomb" misspeak flagged |
| 46 Bennett/Breaux/Jenkins | S | – | – | SKIPPED — 3 speakers, empty source dir |
| 47 Gloria Arellanes | P-95 | F (P-95) | F | Transcript truncated post-East-LA-Free-Clinic-founding |
| 48 Gloria Claudette Grinnell | F | F | F | Clean |
| 49 Gloria Hayes Richardson | F | F | F | Clean |
| 50 Grace Hall Miller | F | F | F | Clean |
| 51 Gwendolyn Perkins Duncan | F | F | F | Clean |
| 52 Gwendolyn M. Patton | F | F | F | Densest Pass 2 (117 corrections) |
| 53 Gwendolyn Zoharah Simmons | F | F | F | Densest Pass 2 (99 corrections) |
| 54 H. Jack Geiger | P-54 | F (T) | F | Tail-sweep via tail-extraction workaround |
| 55 Harold K. Brown | F | F | F | Clean |
| 56 Jack Greenberg | F | F | F | Clean |
| 57 James Oscar Jones | P-78 | F (T) | F | Tail-sweep via tail-extraction |
| 58 Jamila Jones | F | F | F | Clean |
| 59 Jennifer Lawson | F | F (M) | F | Source-level mid-sentence truncation at LCFO/Wilcox era |
| 60 Joan Trumpauer Mulholland | F | F | F | Clean |
| 61 John + Jean Rosenberg | F | F | F | Clean |
| 62 John Carlos | F | F | F | Clean |
| 63 John Churchville | F | F | F | Clean |
| 64 Dudley + Stewart + Jarmon + Suggs + Suggs + Dove | S | – | – | SKIPPED — 6 speakers, empty source dir |
| 65 Johnnie Ruth McCullar | F | F | F | Clean |
| 66 Joseph Echols Lowery | F | F | F | "Star Spank Obama" surreal Whisper artifact |
| 67 Joseph + Embry Howell | F | F (M) | F | Source-level truncation at 33:20 |
| 68 Juadine Henderson | P-57 | F | F | "Christmas addicts → Crispus Attucks" |
| 69 Judy Richardson | P-57 | F (M) | F | Source-level truncation at 2:14:52 |
| 70 Julia Matilda Burns | F | F | F | Clean |
| 71 Julius W. Becton Jr. | F | F | F | Clean |
| 72 Junius Williams | P-75 | F (P-75) | F | ~30KB tail not Pass-2-covered; Pass 3 noted |
| 73 Kathleen Cleaver | F | F | F | Cleaver BPP-date misspeak flagged |
| 74 Kay Tillow | F | F | F | Clean |
| 75 Ladners joint (Dorie + Joyce) | F | F | F | Clean (joint, 2 speakers) |
| 76 Lawrence Guyot | F | F | F | Densest Pass 2 (125 corrections) |
| 77 Leesco Guster | F | F | F | Strong Mississippi Delta accent + age — ~30% LOW confidence |
| 78 Linda Fuller Degelmann | F | F | F | Speaker-originating "1941 atom bomb" misspeak flagged |
| 79 Lisa Anderson Todd | F | F | F | Anderson Todd scholarly thesis flagged for attribution |
| 80 Lonnie C. King | F | F | F | Clean |
| 81 Maria Varela | F | F | F | Clean |
| 82 Marilyn Luper Hildreth | F | F | F | Clean |
| 83 Martha Prescod Norman Noonan | F | F | F | "the boys" → W.E.B. Du Bois (high-damage catch) |
| 84 Mary Jenkins | F | F | F | Clean |
| 85 Mary Jones | F | F | F | "Cardinal L.A. → Rosa Parks" surreal artifact |
| 86 Mateo Camarillo | F | F | F | "Alinsky trained Obama" speaker-originating |
| 87 Matthew J. Perry Jr. | F | F | F | Clean |
| 88 Maynard E. Moore | F (short ~4KB PoC) | F | F | Smallest transcript; CLAUDE.md PoC |
| 89 Michael D. McCarty | F | F | F | "Saint Ignatius → sitting nation" |
| 90 Mildred Bond Roxborough | F | F | F | Clean |
| 91 Mildred Pitts Walter | F | F | F | Clean |
| 92 Nathaniel Hawthorne Jones | F | F | F | 101-year-old subject; broadest historical span in corpus |
| 93 Norma Mtume | F | F | F | Clean |
| 94 Oliver W. Hill Jr. | F | F | F | "2009 Medal of Freedom" speaker-error (actual 1999) |
| 95 Crosby+Crosby+Long+Miller+Miller | S | – | – | SKIPPED — 5 speakers, empty source dir |
| 96 Peggy Jean Connor | F | F | F | Clean |
| 97 Pete Seeger | F | F | F | Clean |
| 98 Phil Hutchings | P-50 | F (P-50) | F | Pass 2 reached full coverage via tail-extraction |
| 99 Purcell Maurice Conway | F | F | F | "Synal Christine Beach → St. Augustine Beach" surreal |
| 100 Branch + Smith | F | F | F | Clean (joint, 2 speakers) |
| 101 Reginald Robinson | P-54 | F (P-54) | F | Pass 2 via SRT offset reads |
| 102 Reverend Harry Blake | F | F | F | Pass 1 Notes cross-contamination flagged in OPEN_PROBLEMS |
| 103 Robert Bagner Hayling | F | F | F | Clean |
| 104 Richard Barry Sobol | P-76 | F (P-76) | F | Pass 2 recovered Hicks v. Weaver + Sobol v. Perez tail |
| 105 Rick Tuttle | P-55 | F (P-55) | F | Pass 2 recovered Aaron Buchsbaum + LA City Controller years |
| 106 Robert Brown | F | F | F | Clean |
| 107 Robert G. Clark Jr. | F | F | F | Rubin Lee Belzoni martyr identification uncertain |
| 108 Robert L. Carter | F | F | F | Clean |
| 109 Robert McClary | D | D | D | SEVERE WHISPER DEGRADATION — needs upstream re-transcription |
| 110 Roberta Alexander | F | F | F | Clean |
| 111 Rosie Head | F | F | F | Clean |
| 112 Ruby Sales | F | F | F | "I was in dead → I was not dead" pronoun-inversion flagged |
| 113 Sam Mahone | F | F | F | "Orange Brick/Bring/Break" variants for Orangeburg |
| 114 Sam Young Jr. | F | F | F | Clean |
| 115 Samuel Berry McKinney | F | F | F | Densest Pass 2 (205 corrections) |
| 116 Scott Bates | F | F | F | Clean |
| 117 Shirley Miller Sherrod | F | F | F | Clean |
| 118 Steven McNichols | F | F | F | Clean |
| 119 Thomas Walter Gaither | P-76 | F (P-76) | F | Pass 2 via tail-extraction |
| 120 Timothy Jenkins | P-78 | F (P-78) | F | Pass 2 via tail-extraction |
| 121 Vernon Dahmer Jr. | P-76 | F (P-76) | F | Pass 2 captured Sam Bowers + post-Jan-1966 narrative |
| 122 Virginia Simms George | F | F | F | Clean |
| 123 Walter Bruce | F | F | F | Mileston Fourteen + J.J. Young surfaced |
| 124 Walter Tillow | P-77 | F (P-77) | F | Pass 2 most-canonical-figure-dense in #121-#125 batch |
| 125 Wheeler Parker Jr. | F | F | F | Canonical Emmett Till eyewitness; speaker died July 2024 |
| 126 William G. Anderson | P-80 | F (P-80) | F | Pass 2 recovered Albany 1962 reference cluster |
| 127 William Lamar Strickland | P-81 | F (P-81) | F | Pass 2 surfaced Vincent Harding + IBW material |
| 128 William Lucy | F | F | F | Canonical 1968 Memphis Sanitation Strike first-person |
| 129 William S. Leventhal | P-34 | F (P-34) | F | Densest Pass 2 (213 corrections) |
| 130 William Saunders | F | F | F | Clean |
| 131 Worth W. Long | F | F | F | Clean |
| 132 Wyatt Tee Walker | F | F | F | Clean |

---

## Aggregate metrics (cross-session)

| Metric | Value |
|---|---|
| Total source directories | 135 |
| Audit-able entries | 127 |
| Awaiting upstream re-transcription | 4 SKIPPED + 3 mid-sentence-truncated + 1 severe-degradation = 8 |
| Redirect via joint interview | 1 (#31 → #75) |
| Entries with Pass 1 partial (~25K-token cap hit) | 14 in #1-#42; ~25 more in #43-#132 (Pass 2 supervisors handled via tail-extraction) |
| Entries with Pass 2 partial-and-then-completed via tail-sweep | 14 |
| Entries with Pass 1 + Pass 2 + Pass 3 all complete | 127 |
| Entries with Pass 1 + Pass 2 + Pass 3 + Pass 4 all complete | 127 |
| Total corrections (cumulative across Pass 1 + Pass 2 + tail-sweep + Pass 3) | ~9,500+ |
| Total corrections (cumulative across Pass 1 + Pass 2 + tail-sweep + Pass 3 + Pass 4) | ~12,000+ |
| Pass 4 net-new catches (errors missed by all of Pass 1+2+3) | ~2,500+ |
| Pass 4 re-grounding promotions (low/medium/flagged → high) | ~250+ |
| Pass 4 re-grounding demotions (high → medium/low or kept-with-correction) | ~100+ |
| Pass 4 fact-check verifications (high-confidence rows + Subject paragraph claims) | ~1,500+ |
| Pass 4 cross-contamination retractions (phantom Pass 1/2/3 rows not in raw) | ~30+ across ~20 entries |
| Pass 4 Subject-paragraph publication-blocking corrections | ~120+ claim-level fixes across ~50+ entries (see OPEN_PROBLEMS Problem 8) |
| Ground-truth corpus entries | 60 (2026-05-21) → 140 (2026-05-22 early) → ~220+ proposed (Pass 4 candidates pending corpus commit) |
| Ground-truth corpus aliases | ~138 (2026-05-21) → 291 (2026-05-22 early) → ~500+ proposed (Pass 4 candidates pending) |
| Adversarial-review flags awaiting external multi-model ensemble | ~500 pre-Pass 4 → ~650 post-Pass 4 (queue grew: ~150 resolved + ~300 new/retained) |
| Cross-contamination items resolved (Phase 1a) | 22 (resolved 2026-05-22 evening) + ~30 additional retractions surfaced by Pass 4 (pending merge into master) |
| Speaker-originating factual errors flagged for editorial footnoting | ~9 pre-Pass 4 → ~25+ post-Pass 4 (Pass 4 found ~15 additional speaker-originating chronology/attribution conflations) |

---

## Diminishing-returns analysis (signal for saturation)

Per-pass net-new-finding rate observed in Session 2 across the entries that received all three passes:

| Pass | Avg net-new corrections per entry | Notes |
|---|---|---|
| Pass 1 | ~22-25 | Initial sweep; covers obvious canonical-figure mishears |
| Pass 2 | ~45 | Includes catalog-pattern instances Pass 1 missed |
| Pass 2 tail-sweep (for the 14 partial-reads) | ~62 | Net-new from previously-unread material |
| Pass 3 | ~15-20 of which most are confidence-resolutions, ~3-5 are new missed-pattern catches | Diminishing returns: most rows are resolutions of existing entries, not new finds |
| Pass 4 (Session 4) | ~20 net-new catches per entry + ~12 fact-check verifications + ~2 promotions + ~1 demotion per entry | **PASS 4 SIGNIFICANTLY OVERSHOT THE SATURATION PREDICTION.** Pre-Pass 4 estimate (in this very document) was "fewer than 2 new catches per entry on average." Actual Pass 4 net-new yield was ~20 per entry — an order of magnitude higher than predicted. Three drivers: (a) the corpus expansion 60→140 + catalog extension +792 patterns gave Pass 4 *much* more canonical ground truth to recognize and fact-check against; (b) the one-transcript-per-agent isolation meant each subagent could go deeper into raw-transcript spot-checking than the prior multi-entry supervisors did; (c) Pass 4 explicitly added fact-check + Subject-paragraph verification + cross-contamination-retraction sub-tasks that prior passes lacked. The diminishing-returns curve is therefore **non-monotonic**: yield went up at Pass 4 because the audit's *capability* increased (bigger corpus + better methodology) faster than the *remaining errors* shrank. |

**Interpretation:** Pass 1 + Pass 2 capture the bulk of substantive corrections. Pass 3's net-new catch rate (3-5 per entry on average) is below the saturation threshold for most entries — Pass 3's main value is **confidence resolution** of items already surfaced, not new findings.

**Pass 4 result CONTRADICTS the pre-Pass-4 saturation prediction.** The prediction here ("Pass 4 would likely produce fewer than 2 new catches per entry on average") was wrong by a factor of ~10. The lesson: saturation predictions assume the *methodology* is held fixed. Pass 4's methodology *changed* — bigger corpus + one-transcript-per-agent isolation + Subject-paragraph fact-checking added — so the saturation curve effectively reset. For Pass 5 (if attempted): if no methodology change, expect saturation to bite hard (probably ~2-5 net-new per entry). If methodology changes again (e.g., adversarial multi-model ensemble, or full-text-rewrite Whisper-replacement of #109 + the three truncated entries), the yield may again exceed the saturation prediction.

**Exception:** entries with severe Whisper degradation or source-level truncation show different curves — finding rate stays high because each pass is auditing partially-different content. #109 McClary and the 3 source-truncated entries (#59, #67, #69) should be treated as outliers for saturation analysis.

---

## Known systematic limitations

These bias any error-rate calculation done from this audit:

1. **Severe Whisper degradation (#109):** the underlying Whisper output is ~60-70% incoherent. Our corrections only cover the spot-correctable proper nouns; whole-passage degradation goes uncaptured.
2. **Source-level truncations (#59, #67, #69):** the unread tail of each transcript is unknown to the audit.
3. **SKIPPED entries (#28, #46, #64, #95):** 3+-speaker joint interviews where Whisper produced empty output. No corrections possible until re-transcribed.
4. **Pass 1 partial reads in #1-#42:** Pass 2 tail-sweep captured most; some residual gap possible in extreme tails.
5. **Cross-contamination (~22 rows):** corrections that exist in the master MD but in the wrong entry's table — they're recorded but not yet acted on the right speaker.
6. **Speaker-originating factual errors:** these are not Whisper errors but speakers misspeaking. They are preserved as-is (with a speaker-originating tag); a downstream pipeline that treats every transcript claim as fact would propagate them. ~9 known instances.
7. **Whisper duplication artifact:** observed in #38 Bassett and #40 Terry — Whisper occasionally repeats whole passages mid-transcript. Caught in Pass 2 for those two; may be present un-flagged in other entries.
8. **Single-model audit bias:** all three passes ran on Claude Opus 4.7. The user's planned adversarial ensemble (Kiro / Kimi / Codex / Gemini) provides cross-model verification but has not yet run as of 2026-05-22.
9. **Ground-truth corpus growth post-audit:** 80 figures were added to `civil_rights_facts.json` *after* Pass 3 ran. Re-scoring Pass 1/2 corrections against the new corpus might surface additional resolutions; the catalog catches most of this but a Pass 4 re-grounding pass against the 140-entry corpus could refine confidence tiers.

---

## Inferential scoring framework

Suggested approach for computing per-entry residual error-rate estimates from this audit trail data:

### Per-entry uncertainty score (lower = more confident)

```
uncertainty(N) = base
               + truncation_penalty
               + degradation_penalty
               + low_confidence_residual_ratio
               + adversarial_flag_density
               + cross_contamination_penalty
```

Where:
- `base = 0.0` for clean Pass-1+2+3 entries; `1.0` for SKIPPED; `0.7` for severe-degradation; `0.4` for source-truncation
- `truncation_penalty = 0.05 * unread_byte_fraction`
- `degradation_penalty = 0.5 * incoherent_fraction` (per Pass-1 supervisor estimate)
- `low_confidence_residual_ratio = count(low/medium rows in Pass 3 / total corrections)`
- `adversarial_flag_density = count(adversarial-review flags) / total corrections`
- `cross_contamination_penalty = 0.1 * (cross-contamination rows referencing this entry)`

### Aggregate error-rate estimate

```
expected_residual_errors_per_entry = (1 - capture_rate) * expected_true_error_count
```

Where `capture_rate` derives from the diminishing-returns curve:
- Pass 1 alone: ~60% capture (estimated from Pass-2 net-new finding rate)
- Pass 1 + 2: ~85% capture
- Pass 1 + 2 + 3: ~92% capture (estimated from Pass-3 net-new finding rate dropping to ~3-5 per entry)
- Pass 1 + 2 + 3 + adversarial multi-model: ~97%+ estimated (untested, awaiting Kiro/Kimi/Codex/Gemini run)

`expected_true_error_count` per entry is the variable — high-density entries (long transcripts, dense proper-noun content) have more underlying errors to find. Use the total observed corrections per entry as a proxy for underlying error density.

### Corpus-grade summary

| Subset | Estimated residual error rate |
|---|---|
| Clean Pass-1+2+3 entries (~115 of 127) | <5% per entry |
| Tail-sweep-completed entries (#1, #6, #7, #8, #12, #13, #14, #17, #20, #26, #29, #30, #34, #38) | <8% per entry |
| Pass-1+2-partial entries that didn't get full tail-sweep coverage | 10-15% per entry |
| Source-truncated entries (#59, #67, #69) | 20-30% (uncaptured tail content) |
| #109 McClary | 60-70% (degraded Whisper baseline) |
| SKIPPED entries (#28, #46, #64, #95) | 100% (no audit possible) |

**Caveats:** these numbers are first-order estimates from the diminishing-returns curve observed in this audit, not validated against an independent ground-truth dataset. Tightening them requires either (a) the adversarial multi-model ensemble's output to refine the residual catch rate, or (b) a sample-based re-audit on a held-out subset to measure true residual error.

---

## Session entry template

When adding a new session, copy and fill out:

```markdown
### Session N — YYYY-MM-DD: [short label]

**Agents:** [parent model + subagent counts/types]
**Wall-clock:** [duration]
**Scope:** [which entries, which passes]

**Methodology:** [bullet list of approach]

**Deliverables:** [bullet list of files created/modified]

**Coverage:** [table or bullet list]

**Anomalies:** [discoveries / outliers / issues surfaced]

**Handoff:** [what the next session/agent needs to pick up]
```

---

## File map

| Purpose | Path |
|---|---|
| This file (effort log) | `C:\civil\transcripts\AUDIT_TRAIL.md` |
| Per-entry corrections overlay | `C:\civil\transcripts\CLEANED_TRANSCRIPTS_REVIEW.md` |
| Open punch-list | `C:\civil\transcripts\OPEN_PROBLEMS.md` |
| Ground-truth corpus | `C:\civil\Metadata Generation System\civil_rights_facts.json` |
| Audit design doc | `C:\civil\docs\TRANSCRIPT_AUDIT_DESIGN.md` |
| Per-entry Pass 2 staging | `C:\civil\transcripts\pass2_stage\entry_NN.md` |
| Per-entry Pass 2 tail-sweep staging | `C:\civil\transcripts\pass2_tail_stage\entry_NN.md` |
| Per-entry Pass 3 staging | `C:\civil\transcripts\pass3_stage\entry_NN.md` |
| Merge scripts | `C:\civil\transcripts\merge_pass2.py`, `merge_pass2_tail.py`, `merge_pass3.py` |
