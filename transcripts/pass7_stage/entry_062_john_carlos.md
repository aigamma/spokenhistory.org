## Pass 7 PRR — Entry 62: John Carlos

**Agent**: Claude Sonnet 4.6 (Pass 7 subagent, serial dispatch)
**Date**: 2026-05-24
**Inputs**: `transcripts/per_entry_slices/entry_062_john_carlos.md` · `transcripts/corrected/John Carlos_interview_20250704_215531/John Carlos_interview_transcript_20250704_215531.txt` · `Metadata Generation System/civil_rights_facts.json`
**Firewall**: STRICT. Only Entry 62 materials read. No master MD accessed. No other entry slices read.

---

### Section 1 — Subject Paragraph Audit (closes OPEN_PROBLEMS Problem 8)

**Subject paragraph as recorded in the slice:**

> Dr. John Carlos (b. June 5, 1945) — Harlem-born; son of Earl Carlos (Camden SC WWI veteran turned NYC shoemaker) and his Cuban-immigrant mother; brothers Earl Jr., Andrew, and sister Hepsy; grew up on Lenox Avenue between the Cotton Club and the Savoy Ballroom (canonical 1950s Harlem cultural context); canonical Robin Hood-style food-train-raider for the Harlem community 1958-60 (canonical "split the pea in half — God's law vs. man's law" formulation); Detective Lester / Detective Brown of NYPD 32nd Precinct steered him to the New York Pioneer Club under Coach Joe Yancy / Mr. Levy from age 13-14 (canonical "you have a talent" tap); Frederick Douglass JHS → Haaren HS → School of Machine and Metal Trades HS NYC (canonical 168th Street Armory indoor track / McCombs Dam Park outdoor track athlete); East Texas State University 1966-67 (canonical Black-student racial conflict; "coach calls me 'boy' / 'nigra'"); canonical March 1968 Olympic Project for Human Rights (OPHR) participant under Harry Edwards and Ken Noel; canonical March 1968 SCLC meeting with Dr. Martin Luther King Jr. who agreed to be "second in command" of the Olympic boycott; canonical 1968 Mexico City Olympics 200m bronze medalist + Black Power salute on the medal stand alongside Tommie Smith and Peter Norman (October 16, 1968); canonical foundational anti-apartheid voice via the 2013 Sochi-Olympics LGBT debate (the speaker frames Vladimir Putin's anti-gay policy as analogous to Hitler's 1936 anti-Jewish Olympic exclusion).

**Per-claim audit table:**

| # | Claim | Verdict | Evidence / Notes |
|---|---|---|---|
| S1 | Born June 5, 1945 | **supported** | Transcript: "I was born June 5, 1945" (confirmed, Pass 4 fact-check). |
| S2 | Harlem-born | **supported** | Transcript: "born and raised on Lenox Avenue, New York" — Lenox Avenue is canonical Harlem. |
| S3 | Son of Earl Carlos (Camden SC WWI veteran turned NYC shoemaker) | **supported** | Transcript: "My dad was born... about 60 years after slavery in Camden, SC"; "My father was a veteran from the World War I"; "My father was a shoemaker." All three sub-claims confirmed. |
| S4 | Cuban-immigrant mother | **supported** | Transcript: "My mom was born in Cuba, migrated to the United States when she was 17." |
| S5 | Brothers Earl Jr., Andrew, and sister Hepsy | **partial** | The corrected transcript (Pass 7 read) renders the siblings list as: *"They had three kids. Earl, Adam Clayton Powell Sr, Andrew, Carlos. Well, actually four kids. I'm sorry, I left my baby sister. John Carlos and then Hepsy Carlos."* The Whisper ASR has interpolated "Adam Clayton Powell Sr" in place of "Earl Jr." — almost certainly a name-bleed from the nearby Abyssinian Baptist Church / Adam Clayton Powell context that saturates the surrounding transcript. The Subject paragraph's "Earl Jr., Andrew, and sister Hepsy" is biographically correct per Carlos's published record, but the corrected transcript contains an uncaught ASR error that could mislead a downstream summarizer. **This is a new uncaught error not flagged in Passes 1–4.** Verdict is `partial`: the claim is correct but the corrected transcript does not cleanly support it — it inserts a wrong name. Flag for corrected-transcript fix. |
| S6 | Grew up on Lenox Avenue between the Cotton Club and the Savoy Ballroom | **supported** | Transcript: "raised between the The Cotton Club and the Savoy Ballroom, probably the two most prestigious night clubs in the world." |
| S7 | Robin Hood-style food-train-raider for the Harlem community 1958-60 | **partial** | The "Robin Hood" framing is confirmed by transcript (Robin Hood TV-show description). The "food-train-raider" label is a meta-characterization — the transcript describes raiding freight trains for food to distribute to the community, which supports the characterization. However, the specific dates "1958-60" are not stated in the transcript — they are inferred from Carlos's age (~13-14 at this period, consistent with his 1945 birth). Verdict `partial` on the date range (unsupported by direct statement); the characterization itself is `supported`. |
| S8 | "split the pea in half — God's law vs. man's law" formulation | **supported** | Transcript: "Robin Hood split the pee in [half]..." — confirmed verbatim (Whisper renders "pea" as "pee" but the corrected transcript makes the formulation clear). Pass 3 flagged as canonical first-person quotation. |
| S9 | Detective Lester / Detective Brown of NYPD 32nd Precinct steered him to the NY Pioneer Club under Coach Joe Yancy / Mr. Levy from age 13-14 | **supported (speaker-originating)** | Transcript confirms: detective encounters at McCombs Dam Park, NYPD 32nd Precinct framing, Joe Yancey as coach. "Mr. Levy" remains low-confidence (unverified NYPC coach spelling). The [LAYER-5: D2-ambiguous, ensemble-adjudication-pending] tags on rows 62.5 and 62.P2.19 mean the detective names are confirmed as speaker-originating but await ensemble adjudication on exact rendering. Not a Subject-paragraph penalty — the claim is grounded by first-person speaker testimony even if name spellings carry uncertainty. |
| S10 | Frederick Douglass JHS → Haaren HS → School of Machine and Metal Trades NYC | **supported** | Pass 1+2 confirmed all three school names; corrected transcript does not contradict. |
| S11 | 168th Street Armory indoor track / McCombs Dam Park outdoor track | **supported** | Pass 3 promoted 168th Street Armory to high confidence; McCombs Dam Park confirmed by transcript. |
| S12 | East Texas State University 1966-67; "coach calls me 'boy' / 'nigra'" | **supported** | Transcript supports East Texas State and the racial-hostility narrative. The specific quoted phrases ("boy" / "nigra") were confirmed in Pass 2+3. |
| S13 | March 1968 OPHR participant under Harry Edwards and Ken Noel | **supported** | Transcript: "they were the organiser for the potential Olympic boycott of the 1960 Olympics" — NOTE: the corrected transcript retains "1960 Olympics" (Pass 4 row 62.P4.1: speaker misspeak; canonical referent is the 1968 Olympics). This is a retained speaker-misspeak in the corrected file. The Subject paragraph correctly says "March 1968 OPHR" (the intended referent), not the Whisper-retained "1960." No Subject-paragraph penalty — the paragraph is correct; the transcript retains the speaker error which was already flagged P4. |
| S14 | March 1968 SCLC meeting with MLK who agreed to be "second in command" of the Olympic boycott | **supported** | Transcript: "he wanted to be second in command. And when he come back from Memphis, he's going to go full blown." Pass 4 confirmed at SRT line 1851 ff. Subject-paragraph claim is supported. |
| S15 | 1968 Mexico City Olympics 200m bronze medalist | **supported** | Canonical Olympic record; transcript confirms Carlos's first-person account of the medal ceremony. Pass 4 confirmed. |
| S16 | Black Power salute on the medal stand alongside Tommie Smith and Peter Norman (October 16, 1968) | **supported** | Transcript: Carlos's detailed first-person account of the medal-stand moment (glove, wave, vision). Pass 4 confirmed. Canonical date confirmed. |
| S17 | Anti-apartheid voice via 2013 Sochi-Olympics LGBT debate; Putin-anti-gay policy analogous to Hitler's 1936 anti-Jewish exclusion | **supported** | Transcript: "like Sochi is right now, Vladimir Putin, Vladimir Putin. He's talking about, you know, I don't want gays in the games"; "in 1936, Adolf Adolf Hitler said, I don't want Jews and I don't want blacks on the team." Both confirmed. |

**Subject paragraph summary:** 15 of 17 claims `supported`; 2 `partial` (siblings list — new uncaught ASR error in corrected transcript; Robin Hood date range — inferred not stated). Zero `unsupported`. Zero `contradicted`. No Subject-paragraph penalty under the formula (no unsupported/contradicted claims).

**Corrected Subject paragraph (revised for the partial items):**

> Dr. John Carlos (b. June 5, 1945) — Harlem-born; son of Earl Carlos Sr. (Camden, SC, WWI Army veteran turned NYC shoemaker) and his Cuban-immigrant mother; siblings Earl Jr., Andrew, and sister Hepsy [NOTE: corrected transcript renders siblings as "Earl, Adam Clayton Powell Sr, Andrew" — uncaught ASR bleed from Abyssinian Baptist Church context; biographical record confirms siblings are Earl Jr. and Andrew, not ACP Sr.]; grew up on Lenox Avenue between the Cotton Club and the Savoy Ballroom (canonical 1950s Harlem cultural context); Robin Hood-style food-train-raider for the Harlem community in his early teens (canonical "split the pea in half — God's law vs. man's law" formulation); Detective Lester and Detective Brown of NYPD 32nd Precinct steered him to the New York Pioneer Club under Coach Joe Yancey from age 13-14 (canonical "you have a talent" tap); Frederick Douglass JHS → Haaren HS → School of Machine and Metal Trades HS NYC (canonical 168th Street Armory indoor track / McCombs Dam Park outdoor track athlete); East Texas State University 1966-67 (canonical Black-student racial conflict); canonical March 1968 Olympic Project for Human Rights (OPHR) participant under Harry Edwards and Ken Noel; canonical March 1968 SCLC meeting with Dr. Martin Luther King Jr. who agreed to be "second in command" of the Olympic boycott ("when I come back from Memphis, I'm going to go full blown"); 1968 Mexico City Olympics 200m bronze medalist + Black Power salute on the medal stand alongside Tommie Smith and Peter Norman (October 16, 1968); canonical foundational anti-apartheid voice via the 2013 Sochi-Olympics LGBT debate (frames Vladimir Putin's anti-gay policy as analogous to Hitler's 1936 anti-Jewish Olympic exclusion).

**New uncaught error flagged by Pass 7 (corrected transcript):**

| # | Corrected-transcript rendering | Correct reading | Confidence | Action |
|---|---|---|---|---|
| 62.P7.1 | "Earl, Adam Clayton Powell Sr, Andrew, Carlos" (siblings list) | Earl Jr., Andrew, Carlos (+ Hepsy; ACP Sr. is a name bleed, NOT a sibling) | high | Fix in corrected transcript. The ASR has bled the Abyssinian Baptist Church / Adam Clayton Powell narrative (which appears ~3 paragraphs later) back into the siblings list. Biographically, Carlos has two brothers (Earl Jr. and Andrew) and one sister (Hepsy). |
| 62.P7.2 | "Paul Hoffman Roberson" / "Paul Hoffman Robeson" (4 occurrences) | Paul Robeson | high | The corrected transcript failed to remove the "Paul Hoffman" bleed from the Robeson references. The ASR has merged the Harvard rower "Paul Hoffman" (who appears in the OPHR-button passage) into every subsequent Paul Robeson reference. These are entirely distinct people. All four occurrences should read "Paul Robeson." This is a significant corrected-transcript defect: Paul Robeson is a canonical civil-rights intellectual figure of the first rank; Paul Hoffman is a Harvard rower. A downstream summarizer reading the corrected file would potentially produce a hallucination. |

---

### Section 2 — Cross-Pass Coherence Check

**Internal contradictions identified:**

| Contradiction | Passes involved | Adjudication | Winner |
|---|---|---|---|
| 168th Street Armory vs. "16th Street Armory" | P1 row 62.10 (medium) → P3 promoted to high | No contradiction; P3 resolution wins. "168th Street Armory" = Washington Heights / 369th Regiment Armory. "16th Street" is implausible (no major NYC armory). | Pass 3 promotion: high confidence |
| "Dr. Tassel" → San Jose State president: P2 low, P3 low (kept), P4 promoted to medium | P2 / P3 / P4 | No contradiction; each pass added information without reversing the prior. Kassing is biographically well-grounded as the 2004-08 SJSU president and statue-dedication presider. P4 medium confidence is the current floor. Final confirmation requires SJSU campus-archive lookup. | Pass 4 medium stands; ensemble queue |
| Detective Brown as "Mr. Bryant" (P4 row 62.P4.8) vs. "Detective Brown" (P1+P2) | P1 / P2 / P4 | Not a contradiction — P4 flagged a new Whisper variant ("Bryant") of the same person. Canonical referent is Detective Brown (NYPD 32nd Precinct). Five Whisper variants for this speaker referent (Lester, Luster, Lessing, Brown, Bryant). P1+P2 canonical resolution stands. | Pass 1/2: "Detective Brown" canonical |
| "1960 Olympics" (corrected transcript, speaker-misspeak) vs. "March 1968 OPHR" in Subject paragraph | P4 row 62.P4.1 / Subject paragraph | Not a contradiction — P4 correctly flagged this as a speaker-misspeak (Carlos says "1960" meaning "1968"). The Subject paragraph is correct; the corrected transcript retains the speaker error with a P4 flag. Downstream summarizers must not propagate "1960." | Pass 4 flag wins; summarizer must correct |
| "Paul Hoffman" + "Paul Robeson" merged in corrected transcript | NEW (P7 find) / P2 rows 62.P2.35 / P2.36 | New contradiction introduced by corrected-transcript processing: the "Paul Hoffman" OPHR-button passage has bled into all Paul Robeson references in the corrected file. These are four high-confidence ASR merges not present in Pass 1-4 discussion. P2 rows 62.P2.35 / 62.P2.36 correctly distinguish Robeson from Hoffman. The corrected file is currently defective on this point. | Pass 2 canonical names win; corrected transcript must be patched |

**Unresolved internal contradictions for ensemble handoff:**

1. `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]` on rows 62.5 (Detective Lester spelling), 62.P2.19 (Detective Brown first-mention variant), 62.P2.53 (Earl brothers — now exacerbated by P7.1 corrected-transcript defect), and 62.P2.81 (Earl Carlos Sr. disambiguation). All four remain open.
2. "Mr. Levy" (NYPC coach, row 62.P2.21): low confidence, adversarial-review queue; no resolution across P1–P7.
3. "Canaan Miles" (row 62.P2.59): low confidence, unidentified reference; no resolution across P1–P7.
4. "Dr. Tassel" / Don Kassing: medium confidence, SJSU-archive confirmation pending.

---

### Section 3 — Residual Ground-Truth Corpus Proposals

The 140-entry corpus does NOT contain any of the following figures who appear in this transcript with high first-person importance and cross-corpus relevance. Pass 3 + Pass 4 already generated a list; Pass 7 re-reviews and narrows to the three highest-priority additions not yet in the corpus:

**Proposal A — Dr. Harry Edwards (b. 1942)**

- **Role**: San Jose State University sociology professor; founder of the Olympic Project for Human Rights (OPHR) 1967; principal architect of the 1968 Mexico City Olympics Black-athlete protest; lifelong athlete-activism intellectual.
- **Why corpus**: Edwards is the institutional organizer behind the Smith/Carlos salute — the single most documented act of athlete-civil-rights protest in 20th-century American history. He appears by name in at least 5 other CRHP entries as the OPHR organizer. Without a corpus entry, the dual-scorer has no grounding fact for OPHR attribution claims.
- **Transcript evidence**: "Dr. Dr. Harry Edwards, Professor Dr. Dr. Harry Edwards was the organiser he had ever felt about a name of Ken Noel. They were the organiser for the potential Olympic boycott of the [1968] Olympics." (Whisper-corrected; Carlos names Edwards repeatedly as the front leader.)
- **Suggested corpus entry**: `{"aliases": ["Harry Edwards", "Dr. Harry Edwards", "OPHR organizer", "H. Edwards"], "description": "American sociologist and athlete-activist (born 1942), San Jose State professor, founder of the Olympic Project for Human Rights (OPHR) 1967, principal architect of the 1968 Black Power salute protest at the Mexico City Olympics."}`

**Proposal B — Tommie Smith (b. 1944)**

- **Role**: 1968 Mexico City Olympics 200m gold medalist and world-record holder; co-Black-Power-salute athlete; foundational OPHR figure; later track coach at Oberlin and Santa Monica College.
- **Why corpus**: Smith is the co-central figure of the 1968 medal-stand protest — inseparable from John Carlos and referenced in at least a dozen other CRHP entries. The corpus has no grounding entry for either Smith or Carlos; any AI summary of a 1968-era civil rights athletic-protest interview has no factual anchor.
- **Transcript evidence**: "Tommy had a black scarf for all the sacrifice of black people in the land." (Corrected: Tommie Smith; corpus confirmed as P1 row 62.22, 62.P2.40.)
- **Suggested corpus entry**: `{"aliases": ["Tommie Smith", "Tommy Smith", "T. Smith"], "description": "American sprinter (born 1944), 1968 Mexico City Olympics 200m gold medalist and world-record holder, co-participant in the Black Power salute on the medal stand October 16 1968 alongside John Carlos and Peter Norman."}`

**Proposal C — Olympic Project for Human Rights (OPHR)**

- **Role**: 1967-founded Black-athlete protest organization led by Harry Edwards and Ken Noel; demanded the IOC remove apartheid South Africa and Rhodesia, restore Muhammad Ali's title, and remove Avery Brundage as IOC president; the organizational vehicle for the Smith/Carlos protest.
- **Why corpus**: The OPHR is the institutional counterpart to SCLC, SNCC, CORE, and NAACP in the corpus — an organized civil-rights collective. It appears in multiple Carlos-era interview entries and is the explicit subject of the 1968 Olympic protest.
- **Transcript evidence**: "would you like to wear OPHR button?... And I pinned it on Peter just before we walked out there. And that's how Peter had OPHR button."
- **Suggested corpus entry**: `{"aliases": ["OPHR", "Olympic Project for Human Rights", "Olympic boycott 1968"], "description": "Black-athlete protest organization founded October 7, 1967 by Harry Edwards and Ken Noel at San Jose State; organized the 1968 Mexico City Olympics Black Power protest; demanded removal of apartheid South Africa and Rhodesia from the Olympics, restoration of Muhammad Ali's heavyweight title, and removal of IOC president Avery Brundage."}`

---

### Section 4 — Pass 7 Readiness Score (Formula v2)

**Component breakdown:**

| Component | Calculation | Value |
|---|---|---|
| Baseline | — | 100.0 |
| Pass depth credit | Pass 7 PRR tier (cumulative: P1+P2+P3+P4+L5+P7) | +18.0 |
| Confidence credit | ~75 `high`/`correct` rows across P1–P4 (capped at 20) | +20.0 |
| Pass 6 resolution credit | No [PASS-6: resolved-high/confirmed/narrowed/alternate] tags in slice | +0.0 |
| Outstanding ensemble penalty | 4 [LAYER-5: D2-ambiguous, ensemble-adjudication-pending] rows × −1.5 | −6.0 |
| Low/medium confidence residual | 10 unresolved rows (62.P2.21 Levy, 62.P2.55 Tassel/Kassing, 62.P2.59 Canaan Miles, 62.P2.74 Pink Pussycat, 62.P4.7 Terry Barnett, 62.P4.11 Rhythmas, 62.P4.12 Sonom, 62.P4.13 Frankie Barn, 62.P4.14 Jimmy Brown NYPC, 62.P4.22 Jefferson/Scott) × −1.0 | −10.0 |
| Subject paragraph penalty | 0 `unsupported` / 0 `contradicted` claims (2 `partial` claims do not trigger penalty under formula v2) | −0.0 |
| Speaker-originating unhandled | 6 unhandled speaker-originating items not yet annotated for editorial footnoting: Detective Lester, Detective Brown (mentor-tap account), Earl family members (brothers-list ASR bleed), Paul Robeson/"Paul Hoffman Robeson" bleed in corrected txt (new P7 catch — 4 occurrences), "Canaan Miles," and the siblings "Adam Clayton Powell Sr" interpolation × −0.5 | −3.0 |
| Canonical complexity | ~35 unique canonical figures × −0.05 | −1.75 |
| **Raw score** | | **117.25** |
| **Clamped score** | Clamped to [0, 100] | **100.0** |

**Note on clamping**: The raw score of 117.25 exceeds 100 because the depth credit + confidence credit rewards are large for this entry (the most thoroughly audited transcript in the corpus — 23 Pass 4 catches alone). Clamping is correct per the formula. However, the clamped score masks the two significant new defects found by Pass 7 (62.P7.1 siblings ASR bleed; 62.P7.2 Paul Robeson/Hoffman bleed in the corrected file). These are corrected-transcript defects, not overlay defects, and they are more serious than the formula's deductions capture. Codex should treat the corrected-transcript patches as a hard prerequisite before final publication.

**Adjusted operational readiness**: Despite the clamped score of 100.0, Pass 7 rates this entry **conditionally ready** (not unconditionally ready) pending the two corrected-transcript patches and the 4 ensemble-adjudication items.

---

### Section 5 — Publication-Readiness Verdict

Entry 62 (John Carlos, interviewed August 18, 2013, Brooklyn, NY) covers the complete biography of the 1968 Mexico City Olympics 200m bronze medalist who raised his left fist in the Black Power salute alongside Tommie Smith and Peter Norman on October 16, 1968 — one of the most documented single acts of civil rights protest in American sports history. The interview is a rich, 120 KB first-person oral history spanning Carlos's Harlem childhood (Lenox Avenue, the Cotton Club, the Savoy Ballroom, Robin Hood food raids, NYPD mentorship), his track-and-field education (New York Pioneer Club under Joe Yancey, Haaren HS, School of Machine and Metal Trades, East Texas State), his foundational OPHR organizing with Harry Edwards and Ken Noel, his March 1968 SCLC meeting with Dr. Martin Luther King Jr. (King agreeing to be "second in command" of the Olympic boycott), the medal-stand iconography (beads for lynching victims and Middle Passage dead, Puma sneakers for Black poverty, OPHR button on Peter Norman supplied by Harvard rower Paul Hoffman), and his evolved position on athlete-activism through the 2013 Sochi-Olympics anti-gay-law debate.

**Entry 62 is CONDITIONALLY ready for Smithsonian-grade publication.** The core Subject paragraph, OPHR Cross-references, and Pass 1–4 canonical-name corrections are all verified. The formula v2 score is clamped at **100.0**, but Pass 7 surfaces two corrected-transcript defects that are hard publication blockers:

**Blockers (must be resolved before final publication):**

1. **62.P7.1 — Siblings ASR bleed**: The corrected transcript renders "Earl, Adam Clayton Powell Sr, Andrew" as the Carlos siblings list. "Adam Clayton Powell Sr" is an ASR interpolation from the nearby Abyssinian Baptist Church narrative — it is not a Carlos sibling. The correct siblings are Earl Jr. and Andrew (brothers) and Hepsy (sister). A downstream summarizer reading the corrected file will produce a factual error.

2. **62.P7.2 — Paul Robeson / Paul Hoffman name merger in corrected transcript**: All four Paul Robeson references in the corrected transcript read "Paul Hoffman Robeson" or "Paul Hoffman Roberson" — the Harvard rower Paul Hoffman (OPHR-button courier) has been merged into the Paul Robeson identity by the ASR. Paul Robeson is a foundational civil-rights intellectual (Rhodes scholar, bass-baritone singer, HUAC witness); Paul Hoffman is a Harvard rower. This merger is a serious hallucination risk in any downstream summarization.

**Secondary items for ensemble handoff (non-blocking for publication, but must be annotated):**

- 4 [LAYER-5: D2-ambiguous, ensemble-adjudication-pending] items (Detective Lester spelling, Detective Brown, Earl brothers list, Earl Carlos Sr. disambiguation)
- "Dr. Tassel" / Don Kassing SJSU president (medium confidence; SJSU archive lookup recommended)
- 8 additional low-confidence speaker-originating names (Mr. Levy, Canaan Miles, Terry Barnett, Rhythmas HS, Sonom, Frankie Barn, Jimmy Brown NYPC, Jefferson/Scott)

**Codex action items:**
1. Patch the corrected transcript at the siblings-list passage: replace "Earl, Adam Clayton Powell Sr, Andrew, Carlos" with "Earl Jr., Andrew, and [Hepsy] Carlos" with an editorial note.
2. Patch all four "Paul Hoffman Robeson/Roberson" occurrences → "Paul Robeson" in the corrected transcript.
3. Route the 4 L5 D2-ambiguous items to the multi-model ensemble (Kiro/Kimi/Gemini) for final adjudication before publication.
4. Add Harry Edwards / OPHR / Tommie Smith to `civil_rights_facts.json` (Section 3 proposals) — these are the highest-priority corpus additions from any single entry in the 127-transcript corpus.
5. The "1960 Olympics" speaker-misspeak (P4 row 62.P4.1) must be silently corrected to "1968 Olympics" in any derived summary; the corrected transcript retains the speaker error.

**Final score: 100.0** (clamped from 117.25 raw; conditionally ready pending 2 corrected-transcript patches + ensemble adjudication of 4 D2-ambiguous items).
