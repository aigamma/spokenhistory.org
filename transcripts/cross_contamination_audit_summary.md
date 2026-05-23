# Cross-contamination follow-on audit summary

**Generated:** 2026-05-22 (Session 3 follow-on at user request)
**Master overlay:** `C:\civil\transcripts\CLEANED_TRANSCRIPTS_REVIEW.md`
**Audit JSON:** `transcripts/cross_contamination_audit.json`
**Fix script:** `transcripts/fix_cross_contamination_pass4.py`

## TL;DR

68 retraction candidates surfaced across 4 staging-file sets (Pass 2 / Pass 2-tail / Pass 3 / Pass 4). After deduplication, false-positive screening, and content matching against the master MD:

- **46 candidates** → `physically_remove`  (cleanup script applied)
- **22 candidates** → `skip_no_action`  (false positives — see categories below)
- **0 candidates** → `ambiguous_human_review`

The fix script removed **84 row lines** across 22 entries, reducing the master MD from 9,279,632 → 9,257,591 chars (−22,041). Per-entry Pass-1/Pass-2/Pass-3 row-count deltas in the dry-run log.

## Bucket distribution

| Bucket | Count | Action |
|---|---|---|
| `annotated_but_still_present` | 38 | physically_remove — Pass 4 block has retraction annotation but the actual row was never removed |
| `no_annotation_in_master` | 8 | physically_remove — Pass 3 "DROP — unrecoverable" but no Pass 4 follow-up annotation |
| `already_clean` | 0 | n/a — none were already physically removed (Phase 1a only covered the 22 enumerated items; everything else is new) |
| `ambiguous_human_review` | 0 | n/a — content-match heuristics resolved all ambiguous cases |
| `known_false_positive` | 22 | skip_no_action — manual override list, see below |

## Top retraction signal categories (by frequency)

| Count | Signal | Meaning |
|---|---|---|
| 10 | `RETRACTED` | Pass 4 explicit retraction directive |
| 9 | `DROP — unrecoverable` | Pass 3 confidence-resolution "drop from publishable correction set" |
| 4 | `phantom row` | Pass 4 confirms row references content not in raw transcript |
| 2 | `WHISPER-PHANTOM` | Pass 4 confirmed no source span exists |
| 2 | `recommend dropping` | Pass 3 unrecoverable-degradation drop |
| 2 | `resolved-PHANTOM` | Pass 4 phantom-entry confirmation |
| 2 | `not-in-transcript` | Pass 4 confirmed absent from raw |
| ~14 | Others | `RESOLVED — RETRACT`, `withdraw correction`, `demote correction row`, `cross-contamination`, `recommend retraction`, etc. |

## Top 10 entries most affected (by physical removals)

| Entry | Subject | Rows removed | Examples |
|---|---|---|---|
| #59 Jennifer Lawson | 7 | Six Pass-1/Pass-2 rows (59.14 Bandit burn, 59.15 Charlene Hunter, 59.16 Hamilton Holmes, 59.P2.44 Drug Fair, 59.P2.49 Eddie O'Neill, 59.P2.9 Jane Rosette references) + Pass-3 59.P3.3 Bob Zellner cross-contamination — all imported from Mulholland #60 / NAG cohort context |
| #43 Adams-Johnson | 3 | 43.P2.7 / 43.P2.24 Pignus Dubere (unrecoverable Whisper degradation) + 43.P2.30 Janet Moses (drifted from another entry) |
| #60 Mulholland | 3 | 60.P2.1 ARA drills (not in transcript; biographical-context contamination), 60.P2.25 Brooks Hays (not in transcript), 60.P2.31 Arthur Shores (cross-contamination from Lawson #59) |
| #107 Walter Lee Clark | 3 | 107.47 Maritime School, 107.48 Tobacco Worker, 107.49 Boyd Junior — all three phantom Pass-1 rows that don't match raw transcript |
| #118 McNichols | 3 | 118.P2.20, 118.P2.32, 118.P2.41 — Pass 3 "DROP — unrecoverable" Whisper degradations |
| #130 Saunders | 3 | 130.26 Mary Plays, 130.27 Mary Britain, 130.P2.71 Hannah War — all confirmed absent from raw transcript |
| #9 Booker+Newsom | 2 | 9.46 Westmoreland, 9.50 Pumpsy Green — phantom Pass-1 rows likely imported from Russell #8 |
| #38 Bassett | 2 | 38.42 / 38.P2.16 Sopta — Whisper-phantom (no source span exists) |
| #44 Greene | 2 | 44.P2.9 tate-tee-na, 44.P2.31 the carriage marriage — Pass 3 drop-unrecoverable |
| #48 Grinnell | 2 | 48.P2.20 Camp Nou, 48.P2.22 El Haido — Pass 3 drop-unrecoverable |

## High-impact retractions of particular note

These match the examples Eric called out in the task prompt:

1. **#59 Lawson NAG/SNCC roll-call cross-contamination** (commit 653ae01): Confirmed — Pass 4 marked 6 rows for retraction (59.14, 59.15, 59.16, 59.P2.9, 59.P2.44, 59.P2.49 + 59.P3.3). All physically removed.

2. **#60 Mulholland hallucinated Pass 2 rows** (commit 653ae01): Confirmed — 60.P2.1 ARA, 60.P2.25 Brooks Hays, 60.P2.31 Arthur Shores all marked for retraction; all physically removed.

3. **#69 Richardson Lily/Julie Belafonte** (commit 653ae01): Confirmed — 69.58 / 69.P2.40 are speculative names with no in-transcript span; both physically removed (Pass-1 row 69.58 + Pass-2 row 69.P2.40, with Pass-3 confidence-resolution rows also removed).

4. **#65 McCullar "brother of Clifford Brawner" subject-paragraph metadata error**: This is a Subject-paragraph correction, not a row-level retraction — already tracked under OPEN_PROBLEMS Problem 8 (Subject-paragraph publication-blocking corrections). Out of scope for this script.

5. **#66 Lowery "NSAS / Americus" + "dump Johnson movement"**: Confirmed — 66.53 and 66.60 marked as error-of-record (Pass 1 corrected text that is not in source); both physically removed.

## Anomalies discovered

### Meta cross-contamination (Pass 3/Pass 4 reference is misattributed)

**#59.P2.9** is the canonical example: the Pass 4 staging file for entry #59 marks "59.P2.9 Jane Rosette → Jan Rosett" for retraction, but the actual Pass 2 row 59.P2.9 in the master MD is `brighten → Brighton (Birmingham)` — a legitimate geographic correction. The "Jane Rosette" content actually belongs to row **60.P2.9** (entry #60 Mulholland's Pass 2 row 9).

The Pass 3 author for entry #59 typed the wrong entry number when copying row references — they put the row content from entry #60 into entry #59's Pass 3 confidence-resolution and adversarial-flag tables. The Pass 4 author then carried forward the misattribution.

The fix script's content-match heuristic correctly:
- **Skipped** the legit Pass 2 row at 59.P2.9 (`brighten → Brighton`) — preserved
- **Removed** the Pass 3 confidence-resolution row at 59.P2.9 (`Jane Rosette` — actually from #60) — eliminated
- **Removed** the Pass 3 adversarial-flag row at 59.P2.9 (`Jane Rosette` — actually from #60) — eliminated

The same content-match approach handled other cases where row-IDs could span multiple Pass 1/Pass 2/Pass 3 tables.

### Intentional cross-corpus reference rows (MAINTAINED, not retracted)

Several Pass 1/Pass 2 rows explicitly say `(not in transcript)` or `(n/a)` in their correction column. These were intentionally added by the original auditor as cross-corpus catalog markers: "I looked for X in this transcript but did not find it." Pass 4 in some cases reaffirmed "Maintained" — meaning the row stays as audit-trail provenance.

Examples logged as `known_false_positive`:
- `130.43 Plough industries`, `130.46 Worden Reynolds`, `130.50 Pigford v. Glickman`, `130.P2.70 Watts riots`, `130.P2.82 South Africa` — all explicit `(not in transcript)` placeholder rows.

These were NOT removed. They may be candidates for future cleanup if Eric wants to reduce noise, but they're not the type of "hidden contamination" that the task scope was concerned with.

### Other false positives skipped

- **#21.16, #21.P2.9** — POSITIVE RESOLUTION: Pass 4 resolved "Governor Walla" → William Waller Sr. The note "Remove from adversarial queue" means remove the adversarial-review flag, NOT the correction row itself.
- **#33.P2.10** — sub-candidate retracted (Hudson) but row kept with new primary candidate (Thames).
- **#34.30** — referenced in the demotion note as confirming the SURROUNDING figure Kaunda; the retracted row is 34.P2.9, not 34.30 (different row entirely).
- **#66.22, #66.P2.8** — Whisper-form or sub-attribution corrections (row stays, internal column changes).
- **#67.P2.8, #101.34, #126.23 vs 126.24** — "Remove from adversarial queue" / "RESOLVED" where the resolution is POSITIVE (correction confirmed). My script catches the keyword but the manual override list correctly classifies as false positives.
- **#71.P2.20, #104.P2.49** — Already resolved by Phase 1a (relocation / drop). Pass 4 confirms.
- **#92.5, #92.P2.3** — Pass 3 reframes as "Whisper-segmentation failure" but the row content is updated, not physically removed.
- **#102.P2.35** — REFERENCED in the note as separately catalogued (Medical Arts Building); not being retracted.
- **#104.P2.3, #104.P2.28** — kept-with-caveat per Pass 4.
- **#112.33** — Pass 1's Sargent Shriver speculation removed but row stays with Bishop John Morris part.
- **#59.P3.1** — Pass 4 demotes 59.P3.1 to low but row stays as corpus-level annotation.

## What this audit does NOT cover

This script focused on **row-level retractions** of Pass 1 / Pass 2 / Pass 3 correction rows where Pass 4 (or sometimes Pass 3) explicitly directed retraction. Out-of-scope items, which remain on the OPEN_PROBLEMS punch-list:

1. **Subject-paragraph publication-blocking corrections** (Problem 8) — ~120+ instances where Pass 4 found errors in the Subject paragraphs themselves (biographical inferences, dates, roles, cross-entry conflation). These don't have row IDs to remove; they need direct paragraph editing. The 30+ Subject-paragraph mentions in this audit (like #3 Lawrence Guyot / Bernard Lafayette, #65 McCullar "brother of Clifford Brawner") are tracked there, not here.

2. **Intentional "(not in transcript)" cross-corpus placeholder rows** — explicitly added by auditors as catalog markers. If Eric wants to clean them, they can be removed in a separate pass (their content already says they're not in the transcript, so they're not hallucinations — they're audit-trail markers).

3. **Pass 4 adversarial-review flag updates that ADD new flags** — these are flagged for downstream Kiro/Kimi/Codex/Gemini ensemble review, not contamination removal.

4. **Cross-corpus catalog patterns** that Pass 4 added as new corpus-wide Whisper failure modes — these belong in the catalog extension work (Phase 1b already shipped), not row removal.

## Publication-grade clean? (Smithsonian/LoC gate question)

**Yes, mostly, with caveats.** The audit overlay's row-level corrections tables are now cleaner with respect to cross-contamination — Pass 4 supervisors' retraction directives have been physically applied where they directed row removal. The two remaining concerns are:

1. **Subject-paragraph publication-blocking errors** (Problem 8) are still un-applied. The dual-scorer + citation-auditor pipeline needs those Subject paragraphs corrected before it can produce publication-grade summaries.

2. **The intentional `(not in transcript)` rows** add some noise (auditor-internal markers) to the corrections tables but don't represent hallucinated content. They could be cleaned in a future pass but are not load-bearing for the Smithsonian/LoC gate.

For Eric's downstream multi-model adversarial-review ensemble, the audit overlay's corrections tables (Pass 1 / Pass 2 / Pass 3 / Pass 4) are now substantively free of cross-contamination as of this commit.

## Next steps

1. Eric reviews this summary + the audit JSON's `physically_remove` list.
2. Cleanup is already applied — no further script runs needed (verified idempotent).
3. Subject-paragraph corrections (Problem 8) remain as the next governance work item.
4. The 825-item adversarial-review feed (`adversarial_review_feed.json`) is hand-off-ready for Eric's Kiro/Kimi/Codex/Gemini ensemble, with these 46 contamination rows now eliminated from the underlying overlay.
