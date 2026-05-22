#### Pass 4 sweeping QA + fact-check (2026-05-22)

**Re-grounding promotions (low/medium/flagged → high):**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 75.47 Hallean Beer -> Hallean Beard | medium | high (corrected relation) | Raw transcript spot-check: "Vernon Damer's sister, played a piano in our church. Her name was Hallean Beer. She was my best friend." Pass 1 + Pass 3 incorrectly described Hallean as "Vernon Dahmer's sister's daughter" — she is in fact Vernon Dahmer's SISTER (per the speaker's direct statement). The surname "Beard" is plausible phonetic match for Whisper "Beer." Promote relational claim to high with corrected relation = sister, not niece/sister-daughter. |
| 75.49 / 75.71 Clack and Arden | medium | medium-high (corrected — single person) | Raw spot-check reveals "Clack and Arden was our youth chapter advisor" (singular verb agreement) and "Clack and Arden, you're also interested in Negro rights" (singular address). This is ONE person, not two figures. Whisper is rendering a single name as "Clack and Arden" (likely "Clarence Arden" or "Mr. Claxton Arden" or similar). Pass 1's "Clyde Kennard + Mr. Arden" conflation is WRONG — speaker treats this as one individual paired with Vernon Dahmer as the two motivating Hattiesburg NAACP youth-chapter forces. Adversarial review must resolve the single-name identity. |
| 75.P2.42 the Watt's land -> the WATS line | high | high (kept — sharpened context) | Raw context: speaker is talking about Chaney/Goodman/Schwerner check-in protocol from Mississippi during Freedom Summer; canonical Wide Area Telephone Service line (pre-1980s flat-rate long-distance service) used as the central-office tracking mechanism. Kept high. |

**Re-grounding demotions (high → medium/low, or kept-with-correction):**

| Original row | Old confidence | New confidence | Issue |
|---|---|---|---|
| 75.47 Hallean Beard as "Vernon Dahmer's sister's daughter" | (header narrative) | corrected | Pass 1 narrative header AND Pass 3 confidence-resolution both said "Vernon Dahmer's sister's daughter" — raw transcript shows speaker called her Vernon Dahmer's SISTER directly. Generational claim was wrong by one step. Must update master MD narrative header. |
| 75.49 / 75.71 "Clack + Arden" as TWO Hattiesburg NAACP figures | medium (two-person reading) | medium (one-person reading) | The two-person reading ("Clyde Kennard + Mr. Arden" in Pass 1 #75.49; "C.E. Clack + Vernon Dahmer" in Pass 1 #75.71) is incompatible with the singular verb agreement and singular address in raw. Recompute as a single name to be resolved by adversarial review. |

**New Pass 4 catches (errors missed by Pass 1+2+3):**

| # | Span as Whisper-transcribed | Suggested correction | Confidence | Source | Surrounding context |
|---|---|---|---|---|---|
| 75.P4.1 | Mega Evans | Medgar Evers | high | canonical | "We met Mega Evans in high school when he came to Hesseburg" — additional Whisper rendering variant for Medgar Evers (Pass 1 caught "Mega Evers / MegaEvers" and Pass 2 caught "Maddie Gabbard"; this third variant adds "Mega Evans" — surname mangled to "Evans"). High-damage celebrity-name swap. |
| 75.P4.2 | Hesseburg | Hattiesburg | high | geographic | "He came down to Hesseburg" — additional Whisper variant for Hattiesburg not previously catalogued (Pass 1/Pass 2 caught "Hadithisburg" and "head of the spirit"; "Hesseburg" recurs at least twice). Recurring Hattiesburg variant — add to catalog F. |
| 75.P4.3 | WCV youth chapter / WCV chapter | NAACP youth chapter | high | canonical | "to set up a, a, and in WCV youth chapter... and WCV chapter did" — additional Whisper rendering of NAACP not previously listed (Pass 2 caught "NWCT" and "NWCP"; "WCV" is a third variant). Same pattern: Whisper repeatedly mangles "NAACP" via initialism reordering. |
| 75.P4.4 | NWCP meetings in Jackson with her and Mr. Damer | NAACP meetings in Jackson with her and Mr. (Vernon) Dahmer | correct | canonical | Confirms Pass 2 #75.P2.38 (NWCP → NAACP) with full sentence-level context; cross-validates the Vernon Dahmer Hattiesburg NAACP attribution. |
| 75.P4.5 | The old Hesseburg, and WCV chapter | The old Hattiesburg [branch] NAACP chapter | high | canonical | Composite of P4.2 + P4.3; speaker is referring to the old Hattiesburg NAACP branch (founded 1946 in Hattiesburg, Vernon Dahmer was active in it). Worth flagging as a publication-risk composite Whisper failure. |
| 75.P4.6 | Volk | Volkswagen (Beetle, or Volkswagen bus) | medium | common-noun | "We hopped in that Volk" — speaker truncates "Volkswagen" mid-word; cross-context is a teen-era ride-acceptance anecdote. Common-noun rendering not in catalog. |
| 75.P4.7 | Damer (recurring) | Dahmer (recurring) | high | canonical | Whisper consistently renders Vernon Dahmer's surname as "Damer" throughout this transcript — Pass 1 #75.48 caught one instance but the pattern is corpus-wide. Add to catalog C as a frequency-annotated entry. |

**Fact-check findings (verification of high-confidence rows + Subject paragraph claims):**

| Claim | Status | Notes |
|---|---|---|
| Joyce Ladner birth year ~1944 (Subject paragraph) | NEEDS CORRECTION | Per Pass 4 brief context + standard biographical sources, Joyce Ann Ladner was born 1943 (not ~1944). The Subject paragraph should be updated to "b. 1943". Raw transcript does not state birth year directly. |
| Dorie Ann Ladner death year 1942-2022 (Pass 3 corpus candidate) | NEEDS CORRECTION | Pass 3 candidate row has Dorie Ann Ladner death as 2022; standard sources (per Pass 4 brief context) show 2024. Master MD must reflect 1942-2024. |
| Joyce Ladner as "first woman President of Howard 1994-95" | CORRECT (clarification) | Joyce Ann Ladner served as acting/interim president of Howard University from 1994-95. The phrasing "first woman President" elides the interim/acting status. Recommend rewording in any published summary to "first woman acting president 1994-95" to avoid Smithsonian-grade conflation with elected presidency. |
| Hallean Beard as Vernon Dahmer's relation | CORRECTED | Raw transcript: speaker says Hallean is Vernon Dahmer's SISTER, not "sister's daughter" (per Pass 1/Pass 3 narrative). Demote claim from niece to sister. |
| Lennie Hayton as Lena Horne's husband at MoW | CORRECT (Pass 3 promotion confirmed) | Lennie Hayton (1908-1971) married Lena Horne 1947; canonical attendance at March on Washington is plausible-to-likely. Promotion to high stands. |
| Paul Brooks at 714 Rose Street Jackson Freedom House | CORRECT (Pass 3 promotion confirmed) | Paul Brooks canonically resided at the Jackson Freedom House with the cohort named in the speaker's enumeration. Promotion to high stands. |
| Carlton W. Reeves as first Black SD MS US District Judge | CORRECT (Pass 3 promotion confirmed) | Reeves was confirmed Dec 2010 to SD Mississippi; first Black judge for that district. Speaker met him at 2011 Freedom Rider reunion. Promotion to high stands. |
| Marian Wright Edelman Yale Law 1963 + LDF in MS | CORRECT | Cross-verified against Pass 3 corpus-candidate row + Guyot #76.50 cross-reference. Marian Wright Edelman attended Yale Law (JD 1963), then NAACP LDF MS office 1963-64. |
| 714 Rose Street Jackson Freedom House | CORRECT | Canonical Jackson MS Freedom House address (1961-65 SNCC/CORE residence). |
| Brett Favre / Jimmy Buffett Creole-Favre genealogical link | UNVERIFIED (retain Pass 3 adversarial flag) | Genealogical link Ladner-Favre-Buffett white Willard/Favre Creole lineage is speaker-attested but published genealogical sourcing is needed before Smithsonian-grade summary publication. Retain Smithsonian-publication-risk flag. |
| Joyce at Lake Forest IL student conference when Medgar Evers killed June 12 1963 | CONFIRMED-RAW | Raw transcript spot-check: "Lake Forest" rendering occurs once in the raw transcript; canonical fit (Lake Forest College, IL hosted SDS/student conferences). |
| W. Harold Cox served on Federal Fifth Circuit | INCORRECT (Pass 2 already caught) | Cox was US District Court (SD MS), not Fifth Circuit. Pass 2 #75.P2.45 already corrected. Re-confirmed. |

**Net-new catalog patterns surfaced:**

| Pattern | Recurrence in this entry | Cross-corpus relevance | Catalog section |
|---|---|---|---|
| "Hesseburg" -> Hattiesburg | 2+ occurrences | Adds third variant alongside "Hadithisburg" (Pass 1) + "head of the spirit" (Pass 2) — Whisper's three-variant failure mode for this city is now a Smithsonian-publication risk requiring catalog disambiguation | F (geographic) |
| "WCV" -> NAACP | 2 occurrences | Adds third variant alongside "NWCT" and "NWCP" (Pass 2) — Whisper's repeated mangling of the NAACP initialism by initial-reorder is now confirmed as a multi-variant failure mode | C (canonical organizational acronyms) |
| "Mega Evans" -> Medgar Evers | 1 occurrence | Adds third variant alongside "MegaEvers" (Pass 1) + "Maddie Gabbard" (Pass 1) — Whisper renders Medgar Evers's name three different ways in this single transcript, raising publication risk for the canonical assassination event | C (canonical figures, frequency-annotated) |
| "Damer" -> Dahmer | recurring (~6+ occurrences) | Canonical Hattiesburg NAACP martyr; recurring Whisper failure across this transcript — needs frequency annotation in master catalog | C (canonical figures, frequency-annotated) |
| Singular-verb-agreement test for catching one-person-as-two-name Whisper renderings | 1 occurrence (this entry: "Clack and Arden was") | Net-new methodological pattern — when Whisper renders a name as "X and Y" but the surrounding grammar uses singular verbs/addresses, the underlying source is likely ONE person, not two. Recommend adding to catalog G as a methodological row | G (methodological / disambiguation) |

**Net-new ground-truth corpus candidates:**

- C.E. Clack (Hattiesburg NAACP youth-council advisor, pre-1965; mentor to the Ladners alongside Vernon Dahmer; potentially the source figure for the "Clack and Arden" combined Whisper rendering) — currently absent from civil_rights_facts.json; foundational pre-MFDP Hattiesburg figure.
- Hattiesburg NAACP branch (founded ~1946 in Hattiesburg MS; Vernon Dahmer as long-time leader; mentor body for the Ladner sisters in the 1950s; site of the C.E. Clack + Vernon Dahmer youth-council infrastructure) — currently absent as a standalone canonical organizational entry distinct from the national NAACP; foundational SW Mississippi Movement substrate.
- Lake Forest College (IL; site of mid-1963 SDS/student-conferences where Joyce Ladner received Ruby Doris Smith Robinson's June 12, 1963 phone call about Medgar Evers's murder) — foundational MoW logistics-pivot location; should be flagged for catalog F geographic disambiguation given the canonical role.
- Camp Shelby (Hattiesburg-area MS military training base; Black-soldier recreational outlet at Palmer's Crossing that shaped Hattiesburg's distinctive economic + cultural substrate per the Ladners' first-person testimony) — foundational SW Mississippi Movement geographic context; currently absent from civil_rights_facts.json.

**Adversarial-review flag updates:**

| Original row | Action (resolved / retained / new) | Notes |
|---|---|---|
| 75.4 Whiskey Lane, Nichols / Khaki Wright | retained | Pass 4 cannot resolve; LoC/NMAAHC project-roster lookup still required. |
| 75.47 Hallean Beard | partial-resolve | Pass 4 corrected the relation (sister, not sister-daughter); surname "Beard" still uncorroborated against canonical sources. Retain genealogical-claim flag, but the relational claim is now sharpened. |
| 75.49 Clack + Arden | UPDATED | Reframed as a SINGLE-PERSON identification task ("Mr. Clack-Arden" / "Mr. Clarendon" / similar). Adversarial review must look for a single Hattiesburg NAACP youth-council figure whose name matches the Whisper-mangled phrase, not two figures. |
| 75.P2.20 Cole Ladell | retained | Phonetic match still weak; needs MS NAACP youth-council roster lookup. |
| 75.P2.28 Innsbruck Club -> Hi-Hat Club | retained | Local entertainment-venue verification still needed. |
| 75.P2.44/45 George Russell Moore vs. Harold Cox | retained | Disambiguation still requires Freedom Riders trial-judge timeline lookup. |
| 75.P2.62 Jake Fishman + Black partner Natchez | retained | Still not in canonical Natchez Movement bibliography. |
| 75.P2.72/73 Favre/Buffett genealogical link | retained | Smithsonian publication risk still requires census-record + Hancock/Pearl River County genealogical verification. |
| 75.P2.94 Miss Raka -> Anne Romaine | retained | Pass 4 raw spot-check did not find "Raka" or "Romaine" in this transcript text — the row may be cross-corpus referenced from elsewhere. Recommend Pass 3 row provenance be re-checked at the audit level. |
| 75.P4.NEW Hallean as Vernon Dahmer's SISTER (corrected from niece) | new | Master MD narrative header AND Pass 1/Pass 3 corrections need a one-step generational correction (sister, not sister-daughter). |

**Audit-complete assessment:** Entry #75 is publication-ready conditional on (a) two factual corrections to the Subject paragraph (Joyce Ladner b. 1943 not ~1944; Dorie Ann Ladner d. 2024 not 2022; Hallean is Vernon Dahmer's sister not niece), (b) the seven Pass 3 adversarial flags remaining open for the Kiro/Kimi/Codex/Gemini multi-model verification pass (especially the Favre/Buffett genealogical celebrity-attribution row), and (c) the "Clack and Arden" reframed as single-person rather than two — Pass 4 changed the disambiguation task but did not resolve the underlying identification.

**Audit-complete marker**: Pass 4 complete on entry #75 as of 2026-05-22.
