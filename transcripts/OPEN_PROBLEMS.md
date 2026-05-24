# OPEN_PROBLEMS — Civil Rights History Project transcript audit cleanup

**Last updated:** 2026-05-24 evening (Pass 6 Track 3 + Track 4 deployed to master MD — D2-ambiguous residual reduced from 1,174 → 912; ~262-item ensemble handoff queue shrunk by ~22%)
**Master overlay:** `C:\civil\transcripts\CLEANED_TRANSCRIPTS_REVIEW.md` (~9.3 MB post-Pass-4)
**Ground-truth corpus:** `C:\civil\Metadata Generation System\civil_rights_facts.json` (140 entries, 291 aliases — ~80+ Pass-4 candidates pending corpus commit)
**Hard deadline:** 2026-05-27 WWU team meeting (5 days from this writing)

## Current audit state

- **Pass 1:** complete on 132 entries (5 SKIPPED/redirect: #28, #31, #46, #64, #95)
- **Pass 2:** complete on 127 audit-able entries via Phase A (43-132) + Phase B (tail-sweep for 14 entries in 1-42)
- **Pass 3:** complete on 127 audit-able entries via Phase C (parallel supervisors)
- **Pass 4 (Session 4, 2026-05-22 later):** complete on all 127 audit-able entries via one-transcript-per-agent strict isolation. ~2,500+ net-new catches; ~250+ promotions; ~100+ demotions; ~1,500+ fact-check verifications; ~30+ cross-contamination retractions; ~120+ Subject-paragraph publication-blocking corrections (see Problem 8 below). Cross-contamination firewall held cleanly across all 127 entries.
- **Ground-truth corpus:** expanded 60 → 140 entries via Phase D; Pass 4 surfaced ~80+ additional candidates pending batched corpus commit (~220+ total when committed)
- **Cross-corpus recurring error patterns catalog:** in place at top of master MD, sections A–I + Phase 1b extensions J-P + Z catch-all + ~150 additional Pass 4 patterns pending catalog merge

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

## Problem 2 — Cross-contamination items (~22 misfiled Pass 2 rows) — **RESOLVED 2026-05-22 (Phase 1a + Phase 1a-follow-on)**

### Resolved 2026-05-22 evening

All 22 items addressed by `transcripts/fix_cross_contamination.py`:
- 15 drops (procedural noise rows self-flagged "not in this transcript")
- 7 moves with `<target>.P2.RELOC[<source>.P2.<row>]` provenance markers
- 1 adversarial-flag drop (#130.P2.115 — canonical content already at 129.P2.115)
- 4 prose edits (#102 Subject + Pass 2 Notes; #110 Pass 3 confidence-resolutions annotation)
- 2 reclassifications during investigation: #25.13 (not contamination — two Whisper variants of same person); #110.P2.16 (legitimate Pass 2 row; Pass 3 confusion was the issue, not the Pass 2 row)

Pre/post Pass-2 row count delta: -15 net. Script is idempotent (verified). Original 22-item table preserved below for audit history.

### Phase 1a follow-on cleanup (2026-05-22 evening, post-Session-4 close)

After Session 4 merged Pass 4 sweeping QA + fact-check into the master MD (commit `32516a3`), an additional 46 cross-contamination retractions surfaced — Pass 4's `Re-grounding demotions` and `Adversarial-review flag updates` sub-tables explicitly directed retraction of phantom Pass 1 rows, hallucinated Pass 2 rows, drifted Pass 3 rows, and Pass-3 "DROP — unrecoverable" Whisper-degradation rows. The Session 4 `merge_pass4.py` script only INSERTED Pass 4 blocks; it did NOT modify the prior-pass rows that Pass 4 had marked for retraction. So Pass 4's retraction directives were *annotated alongside* the still-present rows rather than *physically applied*.

**Phase 1a follow-on resolution:**
- `transcripts/extract_retractions.py` — scans 355 staging files for retraction signals
- `transcripts/build_cross_contamination_audit.py` — cross-references against master MD, bucket-classifies
- `transcripts/fix_cross_contamination_pass4.py` — atomic transactional removal with content-match heuristic
- `transcripts/cross_contamination_audit.json` — 68-candidate audit artifact (46 physically_remove + 22 known false positives)
- `transcripts/cross_contamination_audit_summary.md` — human-readable summary

**Cleanup applied:** 84 row lines removed across 22 entries. Master MD: 9,279,632 → 9,257,591 chars (−22,041). Verified idempotent. Top affected entries: #59 Lawson (−7 rows, NAG/SNCC cross-contamination from #60 Mulholland), #43 / #60 / #107 / #118 / #130 (3 rows each).

**Meta-cross-contamination discovered:** Pass 3 supervisor for entry #59 typed wrong entry numbers when copying row references — `60.P2.9 Jane Rosette` was incorrectly logged as `59.P2.9` in Pass 3 tables. The content-match heuristic in the fix script preserved the legit Pass 2 row `59.P2.9 brighten → Brighton (Birmingham)` while removing the contaminated Pass 3 references. Same root-cause pattern as Session 2's Pass-2 cross-contamination, now manifesting at the Pass-3 layer.

**Smithsonian/LoC publication-gate status:** The audit overlay's row-level corrections tables (Pass 1 / Pass 2 / Pass 3) are now substantively clean of cross-contamination. Remaining governance items: Problem 8 (Subject-paragraph publication-blocking corrections) and the intentional `(not in transcript)` cross-corpus reference rows (audit-trail markers, not hallucinations).

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

## Problem 7 — Pipeline integration — **RESOLVED 2026-05-22 (Session 3 Phase 3 + Phase 4)**

### Resolved 2026-05-22 evening

**Phase 3 — preprocessing layer:** `scripts/apply_corrections.py` (992 lines, 26 passing pytest cases) parses the audit overlay's per-entry Pass 1/2/3 correction tables, applies `correct`/`high` confidence substitutions to raw transcripts (.txt/.srt/.vtt with timestamp preservation), and routes `medium`/`low`/`flagged-for-adversarial-review`/`speaker-originating` rows to a `manifest.json` `pending_context` array for downstream LLM-prompt augmentation. Non-destructive (`transcripts/raw/` never modified), idempotent, parallelizable per-entry. Handles the Phase 1a-introduced `<target>.P2.RELOC[<source>.P2.<row>]` relocated row IDs.

**Phase 4 — RAG substrate:** Substrate decision is **Pinecone Builder + Voyage AI** (voyage-3 1024-dim + rerank-2). Full decision rationale + alternatives considered in `docs/RAG_SUBSTRATE_DECISION.md`. Scaffolding in `C:\civil\rag\` (964 lines across shared.mjs / chunker.mjs / embed.mjs / ingest.mjs / retrieve.mjs / .env.example / README.md, 31 passing node:test cases). Pattern mirrors `worldthought.com/scripts/rag/` for consistency. Substrate-adapter portability documented for future migration if needed.

**Remaining operational actions (Eric):**
1. Provision Pinecone civil-rights-prod project + civil-rights index (1024-dim cosine, sparse+dense hybrid if available on Builder)
2. Add Pinecone + Voyage credentials to `rag/.env.local` (gitignored; example template in `rag/.env.example`)
3. Run first full ingest: `python scripts/apply_corrections.py` then `node --env-file=rag/.env.local rag/ingest.mjs --include-ground-truth`
4. Wire chat function downstream of `rag/retrieve.mjs` (future commit)

### Original 2026-05-22 morning punch-list (now resolved)


The audit overlay (`CLEANED_TRANSCRIPTS_REVIEW.md`) is a Markdown document. The Smithsonian-grade publication pipeline (dual-scorer + citation-auditor) needs corrections as machine-readable input.

**Wiring options:**

1. **Inline LLM prompt context** — embed each entry's Pass 1+2+3 corrections table into the prompt context when the LLM summarizes that transcript. Simple, costs more tokens per call.

2. **Pre-correction preprocessing** — apply corrections to the raw `.txt` / `.srt` / `.vtt` *before* the LLM sees them. Cleaner. Requires parsing the table structure and generating a corrected transcript file per entry. Non-destructive overlay pattern preserved by keeping the original `transcripts/raw/` intact and writing corrected versions to a parallel directory (e.g., `transcripts/corrected/`).

3. **Firestore-collection-merge** — push corrections into the `transcript_corrections` Firestore collection per the design in `docs/TRANSCRIPT_AUDIT_DESIGN.md`. The pipeline's summarization step looks them up at query time. Most aligned with the existing architecture.

**Suggested:** Option 2 (pre-correction preprocessing) for the Wednesday deadline — fastest implementation, no Firestore dependency. Then Option 3 as the long-term substrate.

---

## Problem 8 — Subject-paragraph publication-blocking corrections (~120+ across ~50+ entries) — NEW (surfaced by Session 4 Pass 4)

Pass 4's one-transcript-per-agent sweep added explicit Subject-paragraph fact-checking as a sub-task, which prior passes did not. Across 127 entries, Pass 4 found ~120+ claim-level Subject-paragraph errors that block publication-grade Smithsonian/LoC release. These are NOT Whisper transcription errors — they are errors in the **audit-overlay metadata itself** (the "Subject" paragraph that introduces each entry's section in `CLEANED_TRANSCRIPTS_REVIEW.md`), which the Pass 1 supervisor inferred from the transcript opening + external biographical knowledge but in many cases got wrong.

### Categories of Subject-paragraph errors found:

1. **External biographical claims not supported by the transcript** — the audit overlay attributes a fact (e.g., "co-founded X organization", "served as Y official", "later did Z") that the speaker does NOT actually say in their interview. These are biographical-inference errors where the Pass 1 supervisor pulled external knowledge into the Subject paragraph. (~30+ instances)
2. **Date and chronology errors** — wrong birth years, wrong organizational founding dates, wrong death dates, wrong event years, mismatched event-vs-Movement-era timing. (~25+ instances)
3. **Role and title errors** — wrong organizational title (e.g., "general counsel" should be "associate counsel"), wrong court-level (state vs. federal), wrong duration of tenure, wrong order-of-events (X did Y *before* Z, not after). (~25+ instances)
4. **Cross-entry / cross-figure conflation** — Subject paragraph attributes Person A's biography to Person B because they share a surname or organizational affiliation. (~15+ instances; e.g., #92 Nathaniel Hawthorne Jones's family-history-vs-his-own-narrative conflation, #100 Branch+Smith's "Clyde Kennard died January 1966" conflation with Vernon Dahmer's Jan 1966 firebombing)
5. **Speaker-vs-paragraph misalignment** — Subject paragraph claims X happened when the speaker actually says ~X (semantic inversion); or paragraph treats a speaker's hedged recollection as confirmed fact; or paragraph attributes the wrong direction to an event (e.g., #125 Parker — "Sammy Davis Jr. pallbearer direction REVERSED — he died 1990, Mamie Till-Mobley died 2003; she was honorary pallbearer at HIS funeral not vice versa"). (~15+ instances)
6. **Task-prompt-injected claims not in either transcript or canonical sources** — a few Pass 4 subagents flagged claims that were in the audit-overlay Subject paragraph as inferred but cannot be verified against any source (e.g., #20 Jones "founded the Institute for Nonviolence Initiatives" — could not be verified against any external biography). (~10+ instances)

### High-priority publication-blocking examples (subset; full list in each entry's Pass 4 block):

| Entry | Subject paragraph error | Correction |
|---|---|---|
| #20 Jones | "founded the Institute for Nonviolence Initiatives" | Could not be verified; canonical affiliations are Stanford King Institute + USF Institute for Advanced Studies in Nonviolence |
| #56 Greenberg | "Marshall personally tried the Topeka trial" | Only Carter + Greenberg did; Marshall did not personally try the Topeka portion |
| #65 McCullar | "Brother of Clifford Brawner" | She is the SISTER (publication-bound metadata fix required) |
| #80 Lonnie King | "Manns Brothers grocery" | Speaker says "Man Brothers" (or canonical "Mann Brothers" without the s); also "partial scholarship" not "full football scholarship" |
| #87 Perry | "co-counsel at Briggs v. Elliott 1951 trial" | Perry was a SPECTATOR, not formal co-counsel |
| #90 Roxborough | staff start date 1948; Tuskegee; Gus Courts shot in 1955 | 1953 not 1948; Howard not Tuskegee; Gus Courts SURVIVED 1955 shooting and lived to 1969 |
| #91 Walter | 1986 Peace Walk direction FROM Moscow; "American Peace Walk" | TO Moscow; canonical name is "American-Soviet Peace Walk" |
| #100 Branch+Smith | "Clyde Kennard died January 1966" | Canonical date July 4 1963 — Branch's transcript-recall conflated with Vernon Dahmer Jan 10 1966 firebombing |
| #102 Blake | "Florida Memorial College" + Hank Thomas + Sammy Davis Jr. $100 bond | Florida Memorial College fabrication; Hank Thomas content was cross-contaminated from #103 Hayling |
| #113 Mahone | "sent to France"; "Hasty House attack July 4 1964" | Sent to West Germany (raw line 2211); attack was July 2-3 1964 |
| #114 Young Jr. | "NCI founded 1968"; "5,000 acres"; "lost in Pigford lawsuit" | NCI founded 1969; 5,735 acres; NCI lost in 1985 USDA foreclosure (NOT Pigford which came later) |
| #117 Sherrod | "white grand jury statement" | Refined to "voir-dire-pool statement during CB King's civil trial of Cal Hall" |
| #118 McNichols | "all 100 Mississippi counties" | MS has 82 counties not 100 |
| #125 Parker | "Sammy Davis Jr. was Mamie's pallbearer" + "Eric Holder signed Till Bill 2008" + "Beauford Wilson" | REVERSED — Davis died 1990, Mamie died 2003 → SHE was HIS pallbearer; Holder became AG Feb 2009 AFTER Oct 2008 Bush signing; Wilson canonical name is Benjamin (Benji) Wilson Jr. |
| #126 Anderson | "first Black president of American Osteopathic Association" | Anderson chaired the American Hospital Association (different org) |
| #127 Strickland | "Dotson"; "1971-present" | Dodson; 1971-2024 (Strickland d. June 22 2024) |
| #130 Saunders | "Highlander raid by SC state police"; "Carmichael 1968"; "lost foot" | Tennessee state authorities; 1967 per speaker; bone broken with fear-of-loss only (did NOT lose foot); basic training Hawaii not Fort Jackson |
| #132 Walker | "Gillfield pastorate 1953-58" (in civil_rights_facts.json) | 1952-1960 (8 years per first-person) — corpus update required |

### Suggested implementation:

The Subject paragraph for each affected entry needs to be edited in `CLEANED_TRANSCRIPTS_REVIEW.md` *before* the dual-scorer + citation-auditor pipeline runs on that entry. Two approaches:

1. **Script-based batched correction** — write a `transcripts/fix_subject_paragraphs.py` that consumes each entry's Pass 4 block "Fact-check findings" sub-table, extracts the proposed corrections, and applies them to the master overlay's Subject paragraph. Idempotent. ~2-3 hours of careful scripting.

2. **Human-in-the-loop review** — Eric (or a WWU researcher) reviews each Pass 4 fact-check finding and decides whether to apply the correction, soften the claim, or footnote it as speaker-originating-uncertain. Higher quality but slower. Recommended for Smithsonian-grade publication gate.

Approach 2 is the Smithsonian-grade recommendation; approach 1 is the deadline-driven recommendation if the 2026-05-27 WWU meeting is the hard gate. A hybrid is possible: script applies the high-confidence corrections; human reviews the medium/low-confidence ones.

---

## Problem 9 — Layer 5 corpus-global fidelity findings (1,758 advisory items) — **PARTIALLY RESOLVED 2026-05-23 (Layer 5 fidelity-deploy) + 2026-05-24 (Pass 6 partial coverage of D2-ambiguous residual)**

### Additional progress 2026-05-24 evening (Pass 6 Track 3 + Track 4 deployed to master MD)

Pass 6 (Session 5, see AUDIT_TRAIL.md Phase 5 sub-section) deployed both Track 3 + Track 4 resolutions into master MD via `transcripts/apply_low_conf_resolutions.py`. **300 items dispatched, 290 mutated, 10 skipped as already-Pass-6.** D2-ambiguous markers in master MD: 1,174 → 912 (-262). PASS-6 audit markers: 0 → 290.

| Track | Items resolved | Master MD effect |
| --- | ---: | --- |
| Track 3 (Low-conf adversarial) | 82 items / 40 entries | Resolutions applied: 39 rejected, 21 unresolved, 10 narrowed, 4 confirmed, 4 alternate, 4 resolved-high |
| Track 4 (Layer 5 pending residual) | 218 items / 11 entries | Resolutions applied: 147 confirmed, 42 resolved-high, 23 narrowed, 4 unresolved, 1 alternate, 1 rejected |
| **Combined dispatched** | **300** | **290 mutated + 10 already-Pass-6 (Track 3/4 overlap on entries #34, #100)** |

**Coverage of original Problem 9 residual:** of the 1,174 D2-ambiguous flags annotated by the 2026-05-23 Layer 5 fidelity-deploy, **262 have been cleared** (~22%) by Pass 6 apply-back. The remaining **912 D2-ambiguous rows still belong to the Kiro/Kimi/Codex/Gemini ensemble handoff.**

**What's still open (now narrower):**

1. **912 D2-ambiguous rows** in master MD still awaiting ensemble adjudication. The Track 3+4 selection picked the highest-density entries; the residual ~912 are spread thin across the remaining ~116 entries.
2. **130 D1 canonical-figure phantom rows** — same as before; awaiting ensemble.
3. **179 D3 catalog contradictions** — same as before; awaiting ensemble triage.
4. **800+ D1 sub-canonical-figure phantoms** — same as before; not in primary ensemble queue.
5. **D4 cross-entry biographical consistency (0 findings)** — same as before; methodology-limited.

**Outstanding Pass 6 follow-on (carrying to next session):**

1. Re-run `scripts/apply_corrections.py` to regenerate `transcripts/corrected/<entry>/*.txt` outputs with Track 3+4 resolutions baked in, AND refresh the 19 stale `manifest.json` files from Pass 6 Track 2 heuristic mutation sweep.
2. (Optional, post-deadline) Spawn additional Track 3-style adversarial-resolution batches for more of the ~912 residual D2-ambiguous rows. Per-entry-density sort + cost-benefit threshold would be the natural prioritization input.

### Resolved 2026-05-23 (Layer 5 fidelity-deploy)

`transcripts/fix_layer5_findings.py` (atomic, idempotent, verified via second dry-run = 0 changes) applied the high-confidence subset of Layer 5 findings to the master MD:

| Layer 5 dimension | Action | Count |
| --- | --- | ---: |
| D1 canonical-figure phantoms | Annotated `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` | **130** |
| D1 low-impact phantoms | Physically removed (124 entries affected) + per-entry Layer 5 removal-log annotation | **770** |
| D2 high-majority normalizations (≥80% share + ≥4 occ) | Rewrote correction cell + audit annotation preserving original | **7** |
| D2 ambiguous (<80% majority or <4 occ) | Annotated `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]` | **1,174** |
| D3 catalog contradictions | Annotated `[LAYER-5: D3-catalog-contradiction (catalog 'X': 'canon'), ensemble-adjudication-pending]` | **179** |
| **Total rows mutated** | | **2,260** |

Master MD: 9,257,591 → 9,112,733 chars (−144,858 chars). The 7 D2 normalizations applied:
- "already in catalog section A" → "Joe Mosnier" (#29.P3.8, 96% of 24)
- "SNCC office" → "SNCC (Student Nonviolent Coordinating Committee)" (#53.P2.10, 96% of 22)
- "(James) Forman (uncertain)" → "James Forman" (#90.P2.15, 90% of 10)
- "Jim Forman" → "James Forman (Jim Forman)" (#3.17, 80% of 10)
- "Jim Forman" → "James Forman (Jim Forman)" (#7.23, 80% of 10)
- "Rev. Hosea Williams" → "Hosea Williams" (#105.51, 90% of 10)
- "Dinky (Constance) Romilly Forman" → "Dinky Romilly (Constance \"Dinky\" Romilly)" (#124.P2.18, 80% of 5)

**What's still open (deferred to adversarial multi-model ensemble per the prompt's "annotate-don't-resolve" constraint for ambiguous cases):**

1. **130 D1 canonical-figure phantom rows** — annotated with fuzzy score, awaiting ensemble adjudication. For each, the ensemble should either (a) confirm phantom + propose the actual Whisper rendering Whisper produced (so the row becomes correctable), or (b) flag the row for deletion.
2. **1,174 D2 ambiguous rows** — annotated for ensemble decision on which canonical form to standardize. These are below the 80% majority threshold (most are 50/50 splits) where auto-resolution would be guessing.
3. **179 D3 catalog contradictions** — annotated for ensemble triage; per the Layer 5 summary's analysis these break down as ~40 real disagreements, ~120 different-referent false positives, ~30 minor formatting variance. The ensemble should separate the real disagreements (which feed back into catalog or per-entry-row updates) from the false positives (which just need a no-op confirmation).
4. **800+ D1 sub-canonical-figure phantoms** — these were NOT annotated by the deploy (the deploy's canonical-figure detection only flagged the ~130 rows whose correction text matches a name in `civil_rights_facts.json` ≥5 chars). The remaining ~800 are not in the ensemble's primary queue but remain in the master MD; the Layer 5 JSON has them for any future deeper sweep.
5. **D4 cross-entry biographical consistency (0 findings)** — methodology-limited (regex approach). A future LLM-based extraction pass would surface `(figure, claim, value, source)` records for cross-entry validation.

All annotations are searchable via `grep "\\[LAYER-5:" transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` — the ensemble can read each annotated row, decide, and emit a structured response keyed by `(entry_number, row_id)` similar to how `transcripts/adversarial_review_feed.json` was structured for the Pass 3 adversarial feed.

### Original 2026-05-22/23 punch-list (now partially resolved)


Layer 5 is the final Claude-side fidelity audit before the user hands off the audit overlay to the adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini + others). Unlike Pass 1 / 2 / 3 / 4 (all per-entry), Layer 5 treats `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` (9.26 MB / 41,036 lines) as a single corpus-global artifact and audits four fidelity dimensions no per-entry pass could detect. Findings are **advisory** — the four artifacts (JSON + summary + parser + pipeline) are committed for the adversarial ensemble to triage; Layer 5 does NOT auto-mutate the master MD.

**Full findings JSON**: `transcripts/layer5_fidelity_audit.json` (1.58 MB)
**Summary**: `transcripts/layer5_fidelity_audit_summary.md`
**Re-runnable pipeline**: `transcripts/layer5_fidelity_audit.py` + `transcripts/layer5_extract_corrections.py`

### Bucket counts

| Dimension | Findings | Severity | Action recommended |
| --- | ---: | --- | --- |
| **D1 — Phantom Whisper-renderings** | 939 | High (silent-failure mode) | Ensemble spot-check the ~74 canonical-figure subset; remaining ~865 are low-impact |
| **D2 — Bidirectional canonical inconsistency** | 628 | Medium (mostly formatting variance) | Normalize the ~8 substantive findings against `civil_rights_facts.json` |
| **D3 — Catalog-vs-per-entry contradiction** | 191 | Medium (~40 real, ~120 false-positive different-referent, ~30 minor) | Ensemble triage: real disagreements feed back into catalog or per-entry-row updates |
| **D4 — Cross-entry biographical inconsistency** | 0 | n/a (methodology-limited) | Future LLM-based extraction pass would be needed for true biographical-consistency audit |
| **Total** | **1,758** | | |

### Why this matters

**D1 phantom rows are a silent-failure mode.** When `scripts/apply_corrections.py` runs at preprocessing time, it searches the raw transcript for the claimed Whisper rendering and replaces it with the canonical correction. If the rendering doesn't actually exist in the raw, the script silently no-ops — the LLM downstream pipeline sees the uncorrected text without any warning that the audit overlay claimed to fix it. No per-entry supervisor could catch this because they each only saw one entry at a time.

**D2 + D3 are coherence issues.** The audit overlay is intended to be a single authoritative reference. Internal contradictions undermine institutional credibility with Smithsonian / LoC reviewers. The good news: most D2 findings are minor formatting variance with a clear majority (>80% share); only ~8 are substantive corpus-wide normalizations.

**D4 = 0 reflects methodology limitations, not corpus quality.** A regex approach can only verify birth years tightly attached to figure names. Most biographical claims in the corpus are about interviewees themselves (single occurrence each). A true biographical-consistency audit would need an LLM-based extraction pass — deferred.

### Highest-impact findings (top 10 by potential publication risk)

The summary document's top-10 list (copied here for triage convenience):

| # | Entry | Row | Pass | Claimed Whisper rendering | Canonical | Status |
| ---: | ---: | --- | --- | --- | --- | --- |
| 1 | #2 Amos Brown | 2.32 | Pass 1 | "Pittsburgh Korea / Pittsburgh Kuzat" | Pittsburgh Courier | **Verified phantom** — raw has only "Pittsburgh Courier" (correct) |
| 2 | #2 Amos Brown | 2.60 | Pass 1 | "Acta Almighty King" | Come, Thou Almighty King | Not in raw under either form |
| 3 | #3 Annie Pearl Avery | 3.76 | Pass 1 | "Tugaloo College" | Tougaloo College | No college name in Avery's raw at all |
| 4 | #103 Robert Hayling | 103.26 | Pass 1 | "mega-evils" | Medgar Evers | **Verified phantom** — neither term in Hayling's transcript |
| 5 | #124 Walter Tillow | 124.34 | Pass 1 | "Walter Mondale" | Walter Mondale | Raw has only "Mondale"; self-confirming row inflated to 2-word rendering |
| 6 | #67 Howell | 67.P2.13 | Pass 2 | "Joe Mosnier — NOT this interviewer; David Cline is" | David Cline | Supervisor commentary in whisper-rendering cell |
| 7 | #116 Scott Bates | 116.34 | Pass 1 | "Stocks-O Cymbol" | Stokely Carmichael | Inventive rendering not in raw |
| 8 | #57 James O. Jones | 57.P3.13 | Pass 3 | "foreign foreign Stoke" | Stokely Carmichael | Not in raw under that exact phrasing |
| 9 | #34 Ekwueme Thelwell | 34.P3.6 | Pass 3 | "Mrs. Hema / Mrs. Hemmam / Mrs. Santa Lu Hemer" | Fannie Lou Hamer | Pass 3 commentary; supervisor-invented slash-list |
| 10 | #76 Lawrence Guyot | 76.71 | Pass 1 | "Bayard Rustin's 'From Protest to Politics'" | Bayard Rustin's 'From Protest to Politics' | Self-confirming row likely picking up speaker's direct quote with minor wording difference |

### Statistical observations

**Phantom distribution by pass section** (where the supervisor produced the phantom row):

| Pass | Phantom count | Share |
| --- | ---: | ---: |
| Pass 2 | 460 | 49.0 % |
| Pass 1 | 281 | 29.9 % |
| Pass 3 | 159 | 16.9 % |
| Pass 4 | 23 | 2.4 % |
| Pass 2 tail-sweep | 16 | 1.7 % |

The Pass 2 plurality (49%) suggests the re-review-for-missed-errors layer introduced fabricated-pattern padding — supervisors invented variant renderings that "sounded plausible" given the canonical figure context but did not appear in source. Pass 4 (only 2.4% of phantoms) had the strictest methodology (one-transcript-per-agent isolation per Session 4) and produced the cleanest layer.

**D2 normalize-needed findings** (most pervasive cross-corpus inconsistencies):

| Whisper rendering | Variants | Most-likely true canonical | Affected entries |
| --- | --- | --- | --- |
| "Jim Foreman" | "James Forman" (8) vs "Jim Forman" (2) | **James Forman** | #3, #7 use abbreviated |
| "Dinky Romley" | "Dinky Romilly" vs catalog "Dinky Forman" | normalize per canonical | #7, #30, #124 |
| "Sammy Young" | "Samuel Younge Jr." (3) vs "Sammy Younge Jr." (3) | **Samuel Younge Jr.** | #22, #52, #59 |
| "Stokeley" | "Stokely Carmichael" (3) vs "Stokely" (3) | **Stokely Carmichael** | #43, #73, #81, #101, #117, #124 |
| "Lounge County" | "Lowndes County, Alabama" (4) vs "Lowndes County, AL" (2) vs "Lowndes County" (1) | normalize to one form | #22, #73, #83, #129 |

### Recommended action sequence for the adversarial ensemble

1. **Highest priority — D1 canonical-figure subset (~74 rows)**: spot-check each in the entry's raw transcript. For each, either:
   - Confirm phantom and propose the *actual* Whisper rendering Whisper produced (so the row becomes correctable), OR
   - Flag the row for deletion from the overlay.

2. **Second priority — D2 maiden-vs-married normalization (~8 substantive rows)**: pick canonical forms per `civil_rights_facts.json`; propagate.

3. **Third priority — D3 catalog reconciliation (~40 real disagreements out of 191)**: separate from the ~120 different-referent false positives (same whisper rendering, different historical referent).

4. **Lower priority — Future LLM-grade biographical-consistency pass**: replace Layer 5's regex approach with `(figure, claim, value, source)` extraction across canonical figure mentions.

5. **Deferred — D1 sub-50-fuzzy-score rows (~9)**: closest to truly fabricated renderings; immediate red flags but edge-case-prone (supervisor commentary that looked like a Whisper rendering).

### What is NOT in scope for Problem 9

- Auto-mutation of the master MD: explicitly out-of-scope per the Layer 5 prompt. Findings are advisory.
- Modification of `transcripts/raw/`: never permissible.
- Re-running cross-contamination cleanup (already done in `847f763`).
- Updating staging files (historical artifacts).

### Smithsonian-grade publication-gate assessment

**The audit overlay is publication-grade with caveats.** The catalog is internally consistent; per-entry tables contain genuine high-value corrections. The caveats are:

1. ~5 % of high/correct-confidence rows have un-ground-truth-able Whisper renderings (D1 = 939 / 10,557 audited). High-impact subset is ~74 rows.
2. Canonical names sometimes appear in two normalized forms (D2 maiden-vs-married, formal-vs-informal).
3. Catalog and per-entry rows do not always agree on phrasing (D3, ~40 real disagreements).
4. Cross-entry biographical consistency requires LLM-grade methodology (D4 = 0 by regex-method limitation).

The overlay is fit for downstream LLM grounding and Smithsonian/LoC review **provided the adversarial ensemble adjudicates the ~74 high-impact D1 phantom canonical-figure rows** before any production write of corrected transcripts to `transcripts/corrected/`. The remaining ~865 low-impact phantoms will silently no-op without causing factual error — they're dead weight in the audit overlay but not factual hazards.

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
