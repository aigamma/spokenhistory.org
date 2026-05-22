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

### Session 3 — 2026-05-22 (evening): audit hygiene + Pass 4 re-grounding + pipeline + Weaviate scaffolding

**End-of-session summary:** *(populated in Phase 5)*

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

*(populated when Phase 5 completes)*

**Session 3 closure note (added 2026-05-22, Session 4):** Session 3 completed Phase 1 (audit hygiene: cross-contamination cleanup + catalog back-fill + adversarial-review feed). Phases 2–5 were not executed in Session 3. Session 4 supersedes the Pass-4-re-grounding work that Session 3 Phase 2 was scoped to do, with a stricter methodology (one-transcript-per-agent) per Eric's directive. The other Session 3 phases (3 pipeline-integration, 4 Weaviate scaffolding, 5 finalization) remain unfilled and are deferred to a later session.

---

### Session 4 — 2026-05-22 (later): Pass 4 sweeping QA + fact-check (one-transcript-per-agent architecture)

**End-of-session summary:** *(populated in finalization step)*

**Agents:**
- Claude Opus 4.7 (parent / orchestrator)
- 127 general-purpose subagents, each strictly scoped to ONE entry — spawned in parallel batches across multiple messages

**Wall-clock:** *(populated at session close)*

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

*(populated as batches complete; one sub-block per batch with batch-scope and metrics)*

#### Phase 3 — Merge Pass 4 staging into master MD

*(populated when merge completes)*

#### Phase 4 — Audit-document finalization (this AUDIT_TRAIL.md + OPEN_PROBLEMS.md + Progress Tracker)

*(populated at session close)*

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
| Total corrections (cumulative across Pass 1 + Pass 2 + tail-sweep + Pass 3) | ~9,500+ |
| Ground-truth corpus entries | 60 (2026-05-21) → 140 (2026-05-22) |
| Ground-truth corpus aliases | ~138 (2026-05-21) → 291 (2026-05-22) |
| Adversarial-review flags awaiting external multi-model ensemble | ~500 |
| Cross-contamination items needing relocation | ~22 |
| Speaker-originating factual errors flagged for editorial footnoting | ~9 |

---

## Diminishing-returns analysis (signal for saturation)

Per-pass net-new-finding rate observed in Session 2 across the entries that received all three passes:

| Pass | Avg net-new corrections per entry | Notes |
|---|---|---|
| Pass 1 | ~22-25 | Initial sweep; covers obvious canonical-figure mishears |
| Pass 2 | ~45 | Includes catalog-pattern instances Pass 1 missed |
| Pass 2 tail-sweep (for the 14 partial-reads) | ~62 | Net-new from previously-unread material |
| Pass 3 | ~15-20 of which most are confidence-resolutions, ~3-5 are new missed-pattern catches | Diminishing returns: most rows are resolutions of existing entries, not new finds |

**Interpretation:** Pass 1 + Pass 2 capture the bulk of substantive corrections. Pass 3's net-new catch rate (3-5 per entry on average) is below the saturation threshold for most entries — Pass 3's main value is **confidence resolution** of items already surfaced, not new findings. Pass 4 (if attempted) would likely produce fewer than 2 new catches per entry on average.

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
