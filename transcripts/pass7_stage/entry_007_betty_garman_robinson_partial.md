## Pass 7 PRR — Entry 7: Betty Garman Robinson (PARTIAL)

**Agent**: Claude Sonnet 4.6 (Pass 7 subagent, serial dispatch)
**Date**: 2026-05-24
**Firewall**: Entry 7 only. Inputs: per_entry_slices/entry_007_betty_garman_robinson_partial.md, corrected transcript (Betty Garman Robinson_interview_20250704_175052/*.txt), civil_rights_facts.json, PASS7_DESIGN.md. No master MD read.
**PARTIAL flag**: Pass 1 covered ~71 KB of a 140 KB file. Pass 2 tail-sweep (P2T rows) covered the remaining ~69 KB. All 70 P2T rows are present and use the `entry.P2T.row` convention — tail coverage is complete. No tail gap detected.

---

## Section 1 — Subject Paragraph Audit

**Subject paragraph as written in the slice:**

> Betty Garman Robinson (b. 1939, NYC) — Skidmore College '60, NSA officer cohort 1958–61 (revealed in retrospect to have been CIA-funded), SDS national-council member, came south to SNCC in March 1964 as part of the Atlanta office support staff. Northern Coordinator of SNCC 1964–66 (succeeded Dinky Romilly). Important first-hand witness to the NSA / CIA / SDS / SNCC overlap in the early '60s and the gendered dynamics of the white-left-to-SNCC pipeline.

**Per-claim audit table:**

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| S1 | b. 1939, NYC | **supported** | Corrected transcript: "I was born on January 8, 1939. And I was born in New York City." (pos ~572) — direct speaker statement, confirmed in two places. |
| S2 | Skidmore College '60 | **supported** | Corrected transcript: "Is this the year you graduated? Yes, that's 60. It's 1960." (pos ~8600); entering 1956 per context; Skidmore confirmed multiple times. Graduation year 1960 is transcript-supported. |
| S3 | NSA officer cohort 1958–61 | **partial** | The transcript confirms NSA involvement and CIA-funding revelations extensively. However, the specific date range 1958–61 is not explicitly stated verbatim; speaker references NSA activity from ~1958 through the 1960 Congress (Minnesota) and 1961 Helsinki festival. The 1958 start date is inferential (entering NSA as a student officer in freshman/sophomore year at Skidmore). The 1961 end date aligns with the Helsinki WFDY festival references. Supportable but not verbatim confirmed. **Recommend adding parenthetical: "(approximately)"** |
| S4 | Revealed in retrospect to have been CIA-funded | **supported** | Corrected transcript references *Patriotic Betrayal* (Karen Paget, 2015) directly: "Patriotic Betrayal, Patriotic Betrayal? Yeah, sure, let's hold it up." (pos ~31915); extensive discussion of CIA conduit funding through foundations. |
| S5 | SDS national-council member | **partial** | Corrected transcript says speaker was "put on the SDS executive committee" (pos ~58508–58620), not "national council." The SDS governing body was called the National Executive Committee (NEC) or simply "executive committee." "National council" is not the SDS body's canonical name; the SDS National Council existed as a separate, broader body that met at plenary sessions. The Subject paragraph conflates these. The corrected transcript supports "SDS executive committee member," not "SDS national-council member." **Correction required**: replace "SDS national-council member" with "SDS executive-committee member." |
| S6 | Came south to SNCC in March 1964 | **supported** | Corrected transcript: "When I come to SNCC in March of 64, Dinky Romilly is the Northern Coordinator." (pos ~65494) — direct, unambiguous. |
| S7 | Atlanta office support staff | **supported** | Corrected transcript repeatedly places her in the Atlanta SNCC office from March 1964 onward; "you come south to the Atlanta office in March." |
| S8 | Northern Coordinator of SNCC 1964–66 | **partial** | The transcript confirms she became Northern Coordinator in fall 1964 ("fall 64 is when Dinky Romilly Romney moves to New York. And I become the Northern Coordinator."); it also confirms she stepped down "in the fall of 65, after I had been the Northern Coordinator for a year." This makes the date range fall 1964 – fall 1965, not 1964–66. The Subject paragraph end date of 1966 appears to overstate her tenure by ~1 year. **Correction required**: change "1964–66" to "fall 1964 – fall 1965." |
| S9 | Succeeded Dinky Romilly | **supported** | Corrected transcript confirms Casey Hayden → Dinky Romilly → Betty Garman Robinson succession explicitly. |
| S10 | NSA / CIA / SDS / SNCC overlap primary witness | **supported** | The transcript is one of the richest first-person accounts of the CIA-NSA covert-funding relationship in the corpus; framing is appropriate. |
| S11 | Gendered dynamics of the white-left-to-SNCC pipeline | **supported** | The Waveland women's position paper discussion (Mary King and Casey Hayden), the "backsliding" passage, and Robinson's own trajectory from NSA through SDS to SNCC all support this framing. |

**Summary of Subject paragraph issues:**
- **One correction required (factual error)**: "SDS national-council member" should be "SDS executive-committee member" — the corrected transcript says "executive committee," not "national council."
- **One correction required (date overstatement)**: "Northern Coordinator of SNCC 1964–66" should be "Northern Coordinator of SNCC fall 1964 – fall 1965" per the speaker's own "after I had been the Northern Coordinator for a year" statement.
- **One partial (NSA 1958–61 dates)**: end dates inferential, not verbatim. Minor; the range is defensible. No mandatory change, but recommend parenthetical qualifier.

**Corrected Subject paragraph:**

> Betty Garman Robinson (b. 1939, NYC) — Skidmore College '60, NSA officer cohort (approximately 1958–61, revealed in retrospect to have been CIA-funded), SDS executive-committee member, came south to SNCC in March 1964 as part of the Atlanta office support staff. Northern Coordinator of SNCC fall 1964 – fall 1965 (succeeded Dinky Romilly). Important first-hand witness to the NSA / CIA / SDS / SNCC overlap in the early '60s and the gendered dynamics of the white-left-to-SNCC pipeline.

---

## Section 2 — Cross-Pass Coherence Check

**Internal contradictions identified:**

| ID | Conflict | Passes involved | Adjudication |
|---|---|---|---|
| C1 | 7.P2.9: Stokely Carmichael row was categorized as "high / canonical-alias Whisper correction" in Pass 2; Pass 4 demoted it to "speaker-originating / canonical-already-correct" because the raw transcript uses the correct spelling "Stokely" throughout. | Pass 2 vs. Pass 4 | **Pass 4 wins.** Corrected transcript confirms "Stokely" spelled correctly (3 occurrences, all consistent). The Pass 2 row is a false positive — the correction was unnecessary. The catalog-pattern observation (Whisper may garble it elsewhere) remains valid as a corpus-wide advisory, but this specific entry has no Stokely error. |
| C2 | 7.P2T.65 (HRSA "high-end spill"): Pass 2T rated medium; Pass 4 promoted to high (Rockville MD, Parklawn Building). Pass 3 explicitly maintained medium. | Pass 3 vs. Pass 4 | **Pass 4 wins.** The HRSA Parklawn Building, 5600 Fishers Lane, Rockville MD is a verifiable canonical fact. Pass 4's promotion to high is correct; Pass 3's "maintain medium" was conservative but incorrect. |
| C3 | 7.P2T.30 (Walter Tilla → Walter Tillow): Pass 2T rated medium; Pass 3 promoted to high ("cross-corpus catalog confirms the name"); Pass 4 notes "Pass 3 promotion confirmed; reaffirm." | Pass 2T vs. Pass 3 vs. Pass 4 | **Pass 3/4 win.** Promotion to high is consistent and well-reasoned. No conflict. |
| C4 | D3 catalog contradiction: 7.24 / 7.P2.7 both flag "catalog entry says 'Dinky Forman (Constance Dinky Romilly Forman)'" vs. the correction "Dinky Romilly." | LAYER-5 D3 vs. Pass 1/2 corrections | **Pass 1/2 corrections win for this entry.** The corrected transcript uses "Dinky Romilly" consistently (4 occurrences). The catalog entry name "Dinky Forman" appears to conflate Dinky Romilly (who was SNCC Northern Coordinator before Robinson and was Jessica Mitford's daughter) with the separate person of James Forman (SNCC executive secretary). The ensemble-adjudication-pending flag is appropriate; the catalog entry needs correction. The per-entry correction "Dinky Romilly" is confirmed correct by the transcript. |
| C5 | 7.P2.8 (James Foreman → James Forman): flagged as "phantom-rendering, fuzzy=76.9, ensemble-adjudication-pending" in LAYER-5. | LAYER-5 vs. Pass 2 | **Pass 2 correction wins.** The corrected transcript confirms "James Forman" appears 4 times, correctly rendered. The phantom-rendering flag is a LAYER-5 corpus-global concern, not an error in this entry's correction. The correction from "Foreman" to "Forman" remains valid and necessary. |
| C6 | 7.38: Pass 1 rated low; Pass 3 promoted to high (SLATE Berkeley, VOICE Michigan, TOXIN Wisconsin all canonical 1960s campus parties). | Pass 1 vs. Pass 3 | **Pass 3 wins.** The promotion is well-argued; all three are documented campus political parties contemporaneous with Robinson's NSA/SDS-era involvement. Maintain high. |
| C7 | Tail-sweep row numbering gap: Pass 1 had rows 7.31, 7.32, 7.39 expected (based on sequential numbering) but they do not appear in the slice. These may have been absent due to the partial-read scope. | Pass 1 partial coverage | **No contradiction, but gap noted.** Rows 7.31, 7.32, 7.39 are absent from the slice; given the PARTIAL flag and the note that Pass 1 covered only the first ~71 KB, these rows may have been subsumed into Pass 2 coverage or may represent numbering gaps from the initial partial auditor. Not a coherence failure — a coverage artifact of the PARTIAL read architecture. |

**Unresolved internal contradictions for ensemble handoff:**
- C4: Catalog entry "Dinky Forman (Constance Dinky Romilly Forman)" needs catalog-level correction. The per-entry correction is settled; the catalog-level D3 contradiction remains open for ensemble.
- 14 LAYER-5 D2-ambiguous / phantom / D3-contradiction items remain pending ensemble adjudication (detailed in Section 4 score calculation). These are not Pass-to-Pass contradictions but corpus-global uncertainty flags.

---

## Section 3 — Residual Ground-Truth Corpus Proposals

Marion Barry is already in the corpus (140-entry corpus confirmed). The following three figures are not in the corpus and are the highest-priority additions justified by this entry:

**Proposal 1 — Prathia Hall (1940–2002)**
- **Role**: SNCC field secretary, Albany Movement (1962–63); ordained Baptist minister and theologian; later dean at United Theological Seminary.
- **Why she belongs**: Her September 1962 prayer at the burned Mount Olive Baptist Church site in Sasser, Georgia — which began "I have a dream" — reportedly influenced Martin Luther King Jr.'s adoption of that phrase. She is a foundational figure in the intersection of Black theology and civil rights organizing, and she is cited directly in this transcript (7.P2T.8: "Courtland Cox, and Pratia Hall, and I don't know who the fourth person was, to Selma"). She is a high-damage Whisper target ("Pratia Hall" rendered in place of "Prathia Hall"). Not in corpus.
- **Transcript evidence**: 7.P2T.8 — Robinson names her as one of four people chartered to Selma on a plane Robinson organized.

**Proposal 2 — Jack Minnis (1923–2005)**
- **Role**: SNCC research director 1962–66; designed the Lowndes County Freedom Organization (LCFO) ballot in 1965–66; foundational behind-the-scenes SNCC strategic architect.
- **Why he belongs**: Robinson's transcript describes him directly: "Jack Minnes in the research department had done all the research to show all the denial of voting rights across all those Black counties" (7.P2T.10). His work directly underpinned the LCFO (the Black Panther Party precursor ballot), making him an essential figure in the structural history of SNCC. Whisper renders "Jack Minnis" as "Jack Minnes" — a single-letter phonetic substitution requiring corpus grounding.
- **Transcript evidence**: 7.P2T.10 — Robinson credits his voting-rights research as foundational to SNCC's southern strategy.

**Proposal 3 — Amelia Boynton Robinson (1911–2015)**
- **Role**: Dallas County (AL) Voters League leader; Selma voting-rights organizer; beaten unconscious on the Edmund Pettus Bridge on Bloody Sunday (March 7, 1965); the photograph of her collapsed on the bridge galvanized national support for the Voting Rights Act.
- **Why she belongs**: She is cited directly by Robinson (7.P2T.41: "Amelia Boynton, who was the leader of the Dallas County Voters League, she wanted Dr. King to come in") and is a foundational Selma-to-VRA figure. She predates the Selma marches as the backbone of Dallas County organizing for years. She is not in the corpus despite being a critical actor in the VRA's passage. Her name renders correctly in this transcript but she is a cross-corpus figure likely to appear in other Selma/Alabama-focused entries.
- **Transcript evidence**: 7.P2T.41 — Robinson places her as the central Selma organizer who invited King into Dallas County.

---

## Section 4 — Pass 7 Score v2

**Score components:**

| Component | Calculation | Value |
|---|---|---|
| Baseline | — | +100.0 |
| Confidence credit | ~88 high/correct rows across P1+P2+P2T+P4 (capped at +20) | +20.0 |
| Pass depth credit | P1+P2+P3+P4+Layer5+Pass6+Pass7 (all passes done) | +18.0 |
| Pass 6 resolution credit | 1 confirmed PASS-6 resolution (7.P2.17 narrowed) | +1.5 |
| Outstanding ensemble penalty | 14 remaining LAYER-5 flags (D2-ambiguous × 10, phantom × 2, D3 × 2) × −1.5 | −21.0 |
| Low-confidence residual penalty | ~11 unresolved low/medium rows (5 adversarial-review flags retained + ~6 medium-unresolved) × −1.0 | −11.0 |
| Subject paragraph penalty | 2 claims graded partial with corrections required (S5: SDS body name, S8: NC end date) × −3 | −6.0 |
| Speaker-originating unhandled | ~26 speaker-originating rows without editorial footnote annotation × −0.5 | −13.0 |
| Canonical complexity | ~55 unique canonical figures × −0.05 | −2.75 |
| **Raw total** | | **85.75** |
| **Clamped to [0, 100]** | — | **85.8** |

**Pass 7 v2 readiness score: 85.8**

**Score breakdown notes:**
- The 14 outstanding LAYER-5 ensemble flags are the single largest penalty driver (−21.0). This is expected for a transcript of this density (one of the densest catalog-hit transcripts in the corpus, per the Pass 2T anomaly note). Resolution of these flags by the ensemble adjudication pipeline would raise the score by ~10 points.
- The 5 retained adversarial-review flags (Walter Williams, Mickey Most/Harrington, Becky Mills, Charlene Crants, "our coast steel") account for −5.0 of the low-confidence residual penalty.
- The 2 Subject paragraph corrections (SDS body name error, NC tenure end date overstatement) reduce the score by −6.0. These are fixable pre-publication corrections.
- Speaker-originating rows (26 estimated) are a structural feature of this transcript's density, not audit failures. Editorial footnoting of these rows is a pre-publication step for the WWU team.

---

## Section 5 — Publication-Readiness Verdict

Entry 7 (Betty Garman Robinson, 8 December 2015, Baltimore) is the richest and most complex transcript in the audited corpus by row count (70 tail rows, 31 Pass 1 rows, 31 Pass 2 re-read rows, 8 Pass 3 confidence-resolution rows, 1 Pass 4 net-new catch = 141 total audit rows plus 8 catalog backfile recommendations). It provides foundational first-person testimony on the CIA-NSA covert funding of the National Student Association, the white-Northern-left-to-SNCC pipeline (NSA → SDS → SNCC), the gendered internal dynamics of SNCC's Waveland retreat, the Sojourner Motor Fleet, Freedom Summer Greenwood operations, the DC Free DC / MFDP challenge work, and Robinson's post-SNCC organizing trajectory through SURJ and the Baltimore Algebra Project.

**Verdict: CONDITIONALLY READY — two Subject paragraph corrections required before Smithsonian-grade publication; 14 ensemble flags and 5 adversarial-review flags remain open.**

**Blockers (must fix before publication):**
1. Subject paragraph Claim S5: "SDS national-council member" must be corrected to "SDS executive-committee member" — the corrected transcript says "executive committee," not "national council." This is a verifiable factual error in the metadata field.
2. Subject paragraph Claim S8: "Northern Coordinator of SNCC 1964–66" must be corrected to "Northern Coordinator of SNCC fall 1964 – fall 1965" — speaker explicitly states she left the role after one year, in fall 1965.

**Non-blocking pre-publication items (for WWU editorial team):**
- 14 LAYER-5 ensemble-adjudication-pending flags: D2-ambiguous canonical figures (Wilson Brown/McCray, Dinky Romilly D3, James Forman D3, "luck/Grasso/Hagel/Marx" philosopher names, Becky Mills, LD Pratt, "Macomb" geographic, Mark Suckle, Marion Barry D2) and phantom-rendering flags (James Foreman, Greenwood office). These require the corpus-global ensemble adjudicator to resolve, not per-entry re-audit.
- 5 adversarial-review flags retained from Passes 3 and 4: Walter Williams (Jackson State student), Mickey Most vs. Michael Harrington (LID-SDS meeting), Becky Mills surname ambiguity, Charlene Crants DC identity, "our coast steel" Baltimore steel plant. Each requires SME lookup against SNCC biographical records or Baltimore industrial-history databases.
- ~26 speaker-originating rows require editorial footnote annotation before archival publication (these are correct renderings of names the speaker themselves supplied, not Whisper errors, but they require sourcing footnotes for the Smithsonian/LoC metadata).
- Catalog C addition recommended: "Mary and Barry / Maryann / Maryann Barry → Marion Barry" — the 4-way Whisper split on Marion Barry in this transcript is the highest-damage single-figure misattribution in the corpus and merits a corpus-wide catalog entry to protect future pipeline runs.

**Codex action items:**
- Apply the two Subject paragraph corrections (S5 and S8) before generating pipeline metadata.
- Flag entries referencing Dinky Romilly for catalog-level correction of "Dinky Forman" (the D3 contradiction — catalog entry conflates Dinky Romilly with James Forman and should be corrected to "Constance 'Dinky' Romilly").
- Add Prathia Hall, Jack Minnis, and Amelia Boynton Robinson to civil_rights_facts.json (Section 3 proposals).
- Cross-entry note: the "Marion Barry → Mary and Barry / Maryann" Whisper failure pattern, "MFDP → MFEP/MFTP/MFP," "Waveland → Wavelin/wavelength," and "SNCC → Snickles" compound-form patterns from this transcript should be verified as catalog additions covering the full corpus.

**Final score: 85.8 / 100**
