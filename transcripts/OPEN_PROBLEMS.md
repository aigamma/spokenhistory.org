# OPEN_PROBLEMS — Civil Rights History Project transcript audit cleanup

**Last updated:** 2026-05-22
**Master overlay:** `C:\civil\transcripts\CLEANED_TRANSCRIPTS_REVIEW.md` (~6 MB)
**Ground-truth corpus:** `C:\civil\Metadata Generation System\civil_rights_facts.json` (140 entries, 291 aliases)
**Hard deadline:** 2026-05-27 WWU team meeting (5 days from this writing)

## Current audit state

- **Pass 1:** complete on 132 entries (5 SKIPPED/redirect: #28, #31, #46, #64, #95)
- **Pass 2:** complete on 127 audit-able entries via Phase A (43-132) + Phase B (tail-sweep for 14 entries in 1-42)
- **Pass 3:** complete on 127 audit-able entries via Phase C (parallel supervisors)
- **Ground-truth corpus:** expanded 60 → 140 entries via Phase D
- **Cross-corpus recurring error patterns catalog:** in place at top of master MD, sections A–I

## Critical-path context

The Smithsonian (NMAAHC) and Library of Congress are gating this project's public release on AI hallucination-fact-check rigor. The audit overlay is the institutional credibility instrument. Outstanding items below must clear before the dual-scorer + citation-auditor pipeline produces publication-grade summaries.

---

## Problem 1 — Transcripts needing audio re-transcription (8 entries)

Discussed with Dustin 2026-05-22. Repair workflow: use original transcripts (LoC archive) for accurate text, accept weaker timestamps in exchange for accurate text. Smithsonian/LoC gate is text-hallucination, not timestamp-precision.

### 1a. Severe Whisper degradation (1 entry)

| # | Subject | Issue | Repair |
|---|---|---|---|
| #109 | Robert McClary | ~60-70% incoherent | Replace Whisper text entirely with original; keep Whisper segment boundaries as approximate timestamps |

### 1b. Source-level truncations (3 entries)

Whisper pipeline stopped mid-sentence; not retry-resolvable via offset.

| # | Subject | Truncation point | Repair |
|---|---|---|---|
| #59 | Jennifer Lawson | "And I worked with them. I worked for…" | Splice original text for uncovered tail; synthetic/even-spaced timestamps for tail |
| #67 | Joseph & Embry Howell | Audio time 33:20 ("we were married couple.") | Same recipe |
| #69 | Judy Richardson | Audio time 2:14:52 ("not looking good. So,") | Same recipe |

### 1c. SKIPPED entries — multi-speaker Whisper pipeline failure (4 entries)

Empty source directories; pattern: 3+ speakers in the original interview.

| # | Subjects | Speaker count |
|---|---|---|
| #28 | Donzaleigh, Juandalynn, and Ralph Abernathy III | 3 |
| #46 | Geraldine Crawford Bennett, Toni Breaux, Willie Elliot Jenkins | 3 |
| #64 | John Dudley, Eleanor Stewart, Charles Jarmon, Frances Suggs, Harold Suggs, Samuel Dove | 6 |
| #95 | Patricia A. Crosby, David L. Crosby, Worth W. Long, Carolyn Miller, James Miller | 5 |

**Repair options:**
- A. If raw audio exists: re-run Whisper with speaker diarization (or alternative ASR) — best fidelity
- B. If no audio: use original text as-is with synthetic timestamps, document provenance in Status line
- C. Forced-alignment (aeneas / gentle / wav2vec2-CTC) post-facto for precise timestamps — not blocking for Wednesday

### 1d. Implication for audit overlay

Pass 1/2/3 corrections for the 8 entries above were generated against the *broken* Whisper output. After repair, ~80% of those corrections become moot. **Quick targeted re-Pass-1** on just the repaired transcripts is the cleanup — one parallel-supervisor batch (~10 minutes wall-clock).

---

## Problem 2 — Cross-contamination items (~22 misfiled Pass 2 rows) — **RESOLVED 2026-05-22 (Phase 1a)**

### Resolved 2026-05-22 evening

All 22 items addressed by `transcripts/fix_cross_contamination.py`:
- 15 drops (procedural noise rows self-flagged "not in this transcript")
- 7 moves with `<target>.P2.RELOC[<source>.P2.<row>]` provenance markers
- 1 adversarial-flag drop (#130.P2.115 — canonical content already at 129.P2.115)
- 4 prose edits (#102 Subject + Pass 2 Notes; #110 Pass 3 confidence-resolutions annotation)
- 2 reclassifications during investigation: #25.13 (not contamination — two Whisper variants of same person); #110.P2.16 (legitimate Pass 2 row; Pass 3 confusion was the issue, not the Pass 2 row)

Pre/post Pass-2 row count delta: -15 net. Script is idempotent (verified). Original 22-item table preserved below for audit history.

### Original 2026-05-22 morning punch-list (now resolved)


Pass 2 rows written into the wrong entry's table. Flagged in Pass 3 anomaly reports. Items exist in master MD but in wrong locations.

| Entry | Row | Action | Notes |
|---|---|---|---|
| #25 | 25.13 | Disambiguate | "Willie Boyle Crawford" / "Lille Bell Crawford" — same person |
| #61 | 61.P2.83 | Move to #63 | Greater Germantown Business Association |
| #62 | 62.P2.78 | Move to #61 | Iceland/Greenland reference |
| #71 | 71.P2.20 | Move to #73 | "Bunchy/bunky" |
| #73 | 73.P2.3 | Move to #74 | "To Katanga and Back" |
| #73 | 73.P2.52 | Move to #74 | "Crete → Coretta" |
| #73 | 73.P2.57 | Move to #74 | "Carl and Anne Braden" |
| #80 | 80.P2.16 | Move to #82 | Lonnie King cross-ref |
| #81 | 81.P2.69 | Move to #80 | misfiled |
| #82 | 82.P2.26 | Drop | shoe-sizing not in transcript verbatim |
| #83 | 83.P2.58 | Move to #85 | cross-ref artifact |
| #83 | 83.P2.65, 83.P2.67 | Tag as cross-corpus refs | Bobby Fletcher + Sammy Younge |
| #87 | 87.P2.25, 87.P2.26 | Drop | not Perry references |
| #102 | 102.P2.17 | Move to #103 + correct Pass 1 Notes | Brewster Hospital |
| #102 | 102.P2.18 | Verify or drop | "Mayor Calhoun" unsourced |
| #104 | 104.P2.49 | Drop | "Tony Stone" phantom |
| #105 | 105.P2.91 | Drop | "Anne Annover/Ann Arbor" — Tuttle was UCLA |
| #110 | 110.P2.16, 110.P2.78 | Reassign | cross-reference artifacts |
| #116 | 116.P2.10 | Move to #119 | "Reverend Albert Apples Church" |
| #117 | 117.P2.46 | Move to #116 | "Chattenew time / cap times" |
| #129 | 129.P2.213 | Reconcile status | contradicts "34% read" note |
| #130 | 130.P2.115 | Move to #129 | "Eric Schiller / Reverend Eric Schill" |

**Suggested implementation:** single Python script that reads each item's source-and-target entries, removes the row from source, inserts into target's table with renumbered ID. ~30 minutes of work.

---

## Problem 3 — Catalog back-fill (~500 patterns) — **RESOLVED 2026-05-22 (Phase 1b)**

### Resolved 2026-05-22 evening

`transcripts/build_catalog_extension.py` (re-runnable, sentinel-bounded for idempotency) appended a 893-line "Cross-corpus catalog — Phase 1b back-fill extension (added 2026-05-22)" subsection to `CLEANED_TRANSCRIPTS_REVIEW.md`:
- 881 raw rows extracted from 127 staging files
- **792 unique canonical patterns** after dedup
- 7 new catalog sections proposed (J–P) + 42-row catch-all Z
- Sections A–I extended in place with 509 new rows; A–I body byte-identical to HEAD
- Per-entry tables untouched

Top 10 by recurrence: Stokely Carmichael (6), SNCC (6), Medgar Evers (5), Thurgood Marshall (5), Fannie Lou Hamer (4), COINTELPRO (4), Hattiesburg (4), James Forman (3), KKK (3), Joe Mosnier (3).

### Original 2026-05-22 morning punch-list (now resolved)


Pass 3 supervisors surfaced roughly 500 new Whisper-failure patterns that should be added to the "Cross-corpus recurring error patterns" section at the top of the master MD (sections A–I). Patterns currently live only inside individual Pass 3 blocks.

**Source files:** `C:\civil\transcripts\pass3_stage\entry_*.md` — each contains a "Pass 3 missed-pattern catches" sub-section.

**Sample high-priority additions surfaced across multiple Pass 3 reports:**
- "Reverend Avenue → Reverend Abernathy" (Cotton #29 tail, 9+ recurrences — single most-damaging un-cataloged pattern)
- "Christmas addicts → Crispus Attucks" (Henderson #68 — corpus-defining surreal substitution)
- "Star Spank Obama → Star-Spangled Banner" (Lowery #66)
- "Cardinal L.A. → Rosa Parks" (Jones #85)
- "Mary and Barry → Marion Barry" (5+ corpus instances, conjunction-insertion pattern)
- "Bowling Rights Act → Voting Rights Act" (Williams #14, context-bleed)
- "the Korean → Kareem Abdul-Jabbar" (Russell #8)
- "Cresswood → Crestwood" (McCarty #89)
- "Jodo-Chimnasium → Morehouse gym" (Leventhal #129)
- "Coffinchett / Peyton DeVille / Tempton" (Branch+Smith #100)
- New compound-name-splitting pattern: "King and Brewster → Kingman Brewster" (Howard #35)
- New "Bob's owner → Bob Zellner" reinforcement (now 4+ cross-corpus instances)
- New "Slave Sellers → Cleve Sellers" reinforcement
- New "Joe Lanye / Joe Maneye" Mosnier variants
- New catalog subsections suggested:
  - Black congressional figures 1964-80 (Conyers, Mink, Hawkins, Powell, Dawson, Nix, etc.)
  - Chicano movement figures (Tijerina, Gonzales, Chávez, Huerta, Karenga, etc.)
  - Legal cases / SCOTUS (Brown II, Browder v. Gayle, NAACP v. Claiborne Hardware, etc.)
  - Whisper closing-line hallucinations
  - Whisper date/day-of-week garbles

**Suggested implementation:** spawn a single subagent to read all 127 Pass 3 staging files, aggregate the "Pass 3 missed-pattern catches" sub-tables, dedupe, and produce a catalog-section-extension block to append to the master MD. ~30-45 minutes wall-clock.

---

## Problem 4 — Adversarial-review flag aggregation (~500 items) — **RESOLVED 2026-05-22 (Phase 1c)**

### Resolved 2026-05-22 evening

`transcripts/build_adversarial_feed.py` (deterministic, hash-stable) produced `transcripts/adversarial_review_feed.json` (439 KB, 10,371 lines):
- **825 items** across 125 entries (#9 and #42 correctly excluded — both Pass 3 supervisors marked "all rows resolved")
- 100% schema-coverage (all 10 required fields populated)
- 11-category controlled vocabulary; top 3 categories (canonical-figure-identification + geographic-place-name + organization-or-event-name) = 65% of items
- Top 5 entries by adversarial-flag density: #34 Thelwell (16), #129 Leventhal (15), #52 Patton (14), #132 Walker (14), #30 Zellner (13)

Schema version 1.0. Downstream Kiro/Kimi/Codex/Gemini ensemble can append `ensemble_resolution` / `ensemble_confidence` fields keyed by `(entry_number, row_id)`.

### Original 2026-05-22 morning punch-list (now resolved)


Pass 3 blocks each contain an "Adversarial-review flags" sub-table — items where Pass 3 supervisors couldn't resolve canonicality and deferred to the user's multi-model ensemble (Kiro/Kimi/Codex/Gemini).

**Source files:** same Pass 3 staging files, "Adversarial-review flags" sub-section per entry.

**Recommended:** aggregate into a single flat CSV/JSON feed that the external ensemble can consume:
- Entry # + row #
- Whisper rendering
- Candidate correction
- Reason for adversarial flag
- Surrounding context

Categories surfaced:
- Local-figure identification (small-town residents, family members, neighbors)
- Speaker-originating place names with no canonical match
- Severely garbled passages (one or two rows per entry where Whisper noise is essentially unparseable)
- Cross-corpus name-overlap ambiguities (e.g., Bobby Seale vs. cousin Bobby Harris in #52)
- Specialized vocabulary (military jargon, legal Latin, medical terminology, foreign-language transliterations)

**Suggested implementation:** subagent to aggregate + write to `C:\civil\transcripts\adversarial_review_feed.json`. ~15 minutes wall-clock.

---

## Problem 5 — Phase D corpus deferrals (~10 figures)

Phase D added 80 figures to `civil_rights_facts.json` (60 → 140) but deferred ~10 low-confidence candidates pending adversarial review:

- **Joseph Miller Sr.** — Baker County GA murder victim; canonical only via Grace Hall Miller #50 family-history testimony
- **"Pop Herb"** — Cambridge MD funeral parlor host (recurs in Henderson #68 + Richardson #69); canonical name unverified
- **Mrs. Eberhart Spinks** — Laurel MS, Simmons #53 primary source
- **L. Warren "Gator" Johnson** — Baker County GA sheriff; canonical locally only
- **Tamio "Tommy O" Wakayama** — SNCC Asian-American photographer; low cross-corpus recurrence
- **Mendy Samstein** — SNCC field secretary (1970 plane-crash death); specific to one transcript
- **Frederick Herzberg** — Two-Factor Theory psychologist (Holloway #33); not specifically civil-rights canonical
- **Henrietta Lacks** — medical-history canonical, edge-of-scope for civil-rights corpus
- **Henrietta Canty** — Atlanta OEO activist; canonical locally
- **Robert McClary placeholder** — pending #109 re-transcription

**Suggested implementation:** after the multi-model adversarial ensemble runs, commit any confirmed candidates to `civil_rights_facts.json` in a single batch.

---

## Problem 6 — Speaker-originating factual errors (for editorial footnoting, not correction)

These are speakers misspeaking facts, not Whisper errors. The audit preserves them as speaker-originating; the publication pipeline should footnote them rather than correct them in the source text.

| Entry | Speaker | Misstatement | Canonical fact |
|---|---|---|---|
| #14 | Cecil Williams | "Bowling Rights Act" | Voting Rights Act (Whisper-aided context-bleed) |
| #17 | Charles McLaurin | "Kirksey was first senator since Reconstruction" | Henry Kirksey was MS state senator, not US senator; not first since Reconstruction (Hiram Revels / Blanche K. Bruce predate) |
| #45 | Freeman Hrabowski | "1941 atom bomb" | Hrabowski born 1950; atom bomb 1945 — speaker misspoke or Whisper substituted |
| #73 | Kathleen Cleaver | "BPP founding Oct 21 because Seale's birthday" | Seale's birthday is Oct 22; BPP canonically founded Oct 15, 1966 |
| #78 | Linda Fuller Degelmann | "born Birmingham 1941, phenomenal year atom bomb used in Japan" | Same kind of chronology conflation |
| #79 | Lisa Anderson Todd | "Walter Reuther was actual MFDP-defeat architect" + "Joe Rauh offered to withdraw" | These are her *scholarly thesis* from LBJ-tapes research, not standard historiography (Branch, Dittmer). Should be attributed as "Anderson Todd's interpretation" rather than fact |
| #86 | Mateo Camarillo | "Saul Alinsky trained Obama" | Questionable historical claim |
| #89 | Michael McCarty | "Head Start was a response to BPP Breakfast" | Chronologically inverted: Head Start 1965, BPP Breakfast 1969 |
| #94 | Oliver W. Hill Jr. | "2009 Presidential Medal of Freedom" | Actual date 1999 (Clinton, not Obama) |

**Suggested implementation:** add an `editorial_footnotes` field to each entry's summary record in the Firestore push step. The dual-scorer + citation-auditor pipeline should reference these as "speaker statement; see footnote" rather than treating them as transcript facts.

---

## Problem 7 — Pipeline integration

The audit overlay (`CLEANED_TRANSCRIPTS_REVIEW.md`) is a Markdown document. The Smithsonian-grade publication pipeline (dual-scorer + citation-auditor) needs corrections as machine-readable input.

**Wiring options:**

1. **Inline LLM prompt context** — embed each entry's Pass 1+2+3 corrections table into the prompt context when the LLM summarizes that transcript. Simple, costs more tokens per call.

2. **Pre-correction preprocessing** — apply corrections to the raw `.txt` / `.srt` / `.vtt` *before* the LLM sees them. Cleaner. Requires parsing the table structure and generating a corrected transcript file per entry. Non-destructive overlay pattern preserved by keeping the original `transcripts/raw/` intact and writing corrected versions to a parallel directory (e.g., `transcripts/corrected/`).

3. **Firestore-collection-merge** — push corrections into the `transcript_corrections` Firestore collection per the design in `docs/TRANSCRIPT_AUDIT_DESIGN.md`. The pipeline's summarization step looks them up at query time. Most aligned with the existing architecture.

**Suggested:** Option 2 (pre-correction preprocessing) for the Wednesday deadline — fastest implementation, no Firestore dependency. Then Option 3 as the long-term substrate.

---

## File map

| Purpose | Path |
|---|---|
| Master overlay (all corrections) | `C:\civil\transcripts\CLEANED_TRANSCRIPTS_REVIEW.md` |
| Cross-corpus error catalog | Top of master MD, sections A–I |
| Ground-truth corpus | `C:\civil\Metadata Generation System\civil_rights_facts.json` |
| Pass 2 staging files | `C:\civil\transcripts\pass2_stage\entry_NN.md` |
| Pass 2 tail-sweep staging | `C:\civil\transcripts\pass2_tail_stage\entry_NN.md` |
| Pass 3 staging files | `C:\civil\transcripts\pass3_stage\entry_NN.md` |
| Audit design doc | `C:\civil\docs\TRANSCRIPT_AUDIT_DESIGN.md` |
| Weaviate integration design | `C:\civil\docs\WEAVIATE_INTEGRATION_DESIGN.md` |
| Project pacing constraints | `C:\civil\CLAUDE.md` |
| Global pacing constraints | `C:\Users\erica\.claude\CLAUDE.md` |

---

## Recommended sequence (5-day deadline)

If audit-quality finishing is the priority:
1. Repair the 8 problem transcripts (Problem 1) — depends on Dustin delivering originals — afternoon
2. Re-Pass-1 on the 8 repaired transcripts — 10 min subagent batch
3. Cross-contamination cleanup (Problem 2) — 30 min Python script
4. Catalog back-fill (Problem 3) — single subagent ~30-45 min
5. Adversarial-review feed aggregation (Problem 4) — single subagent ~15 min
6. Hand off feed to your Kiro/Kimi/Codex/Gemini ensemble — they run async
7. Pipeline integration (Problem 7, option 2) — 1-2 hours of script writing + pipeline test
8. Phase D corpus commit (Problem 5) — after adversarial returns
9. Speaker-originating editorial footnotes (Problem 6) — Firestore metadata field

If deployment-blocking items are the priority:
- Skip 1-6, go straight to 7 (pipeline integration) and the CLAUDE.md deployment checklist (Firebase service-account → Cloud Functions → MCP server → pipeline run → Firestore push → PR upstream)
- Audit cleanup becomes a follow-up after Wednesday demo

---

## Memory + CLAUDE.md state

Project memory: `C:\Users\erica\.claude\projects\C--civil\memory\` — has the no-throttling feedback, no-deferral preference, project rescue mandate.

Global CLAUDE.md and project CLAUDE.md both have the Pacing constraints section: no `/loop` for backlogs, parallel subagents preferred, `/schedule` (cron) for multi-hour persistence.

Any future agent loading this project will inherit these defaults automatically.
