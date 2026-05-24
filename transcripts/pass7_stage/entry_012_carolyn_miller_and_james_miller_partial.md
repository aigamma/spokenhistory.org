## Pass 7 PRR — Entry 12: Carolyn Miller and James Miller (PARTIAL)

**Date:** 2026-05-24
**Agent:** Claude Sonnet 4.6 (Pass 7 subagent, serial dispatch)
**Scope firewall:** Entry 12 only. Inputs: per_entry_slices/entry_012, corrected transcript .txt, civil_rights_facts.json, PASS7_DESIGN.md. No master MD read. No other entry slices read.

---

### Section 1 — Subject Paragraph Audit (closes OPEN_PROBLEMS Problem 8)

**Subject paragraph as recorded in slice:**

> Carolyn Miller (b. 1953) — grew up in Hermanville, MS with her grandparents; involved in the Port Gibson youth movement starting ~1966 at age 11–12 as a voter-registration canvasser. James Miller — Korean War vet's son; Claiborne County activist; later Claiborne County administrator. The interview is the most detailed first-person account in the corpus of: (a) the 1966 Port Gibson / Claiborne County boycott of white merchants, (b) the Deacons for Defense chapter operating in Port Gibson, (c) the SNCC-organizer Rudy Shields (Chicago via Vicksburg) and his community-organizing methods, and (d) the eventual NAACP v. Claiborne Hardware (1982) Supreme Court case, which established the right to organize economic boycotts.

**Per-claim audit table:**

| # | Claim | Verdict | Evidence / Notes |
|---|---|---|---|
| S1 | Carolyn Miller (b. 1953) | **supported** | Corrected transcript: "I was born... back in 1953... at Alcorn A&M College then." |
| S2 | grew up in Hermanville, MS with her grandparents | **supported** | Corrected transcript: "I grew up in Hermanville... my dad's parents raised me... my grandmother's school teacher in Hermanville." |
| S3 | involved in Port Gibson youth movement starting ~1966 at age 11–12 | **supported** | Corrected transcript: "the movement really starts here in about 1966. So you know that... I was about that." She notes she was double-promoted; matches age 11–12 in 1966 for a 1953 birth year. |
| S4 | voter-registration canvasser | **supported** | Corrected transcript: "they trained us how to go in campus and how to register people... And that's how I really had them involved." |
| S5 | James Miller — Korean War vet's son | **contradicted** | **CRITICAL ERROR.** Corrected transcript confirms James's father was a WWII veteran ("My father was a World War II veteran"). The Korean War veteran is Carolyn's father ("my dad was in the Army, so he was a Korean veteran"). Subject paragraph misattributes the Korean War service to James's family; it is Carolyn's father who served in Korea. Pass 4 already surfaced this finding (entry 12.P4 fact-check table, "James Miller — Korean War vet's son" row). |
| S6 | Claiborne County activist | **supported** | Corrected transcript confirms James's involvement in movement organizing, Deacons context, and county administrator role in Port Gibson/Claiborne County. |
| S7 | later Claiborne County administrator | **supported** | Corrected transcript: "when I came back to your man and was trying to make a contribution, and it's the county administrator" — verified as late-1990s county administrator position. |
| S8 | 1966 Port Gibson / Claiborne County boycott of white merchants | **supported** | Corrected transcript extensively documents the boycott, including demands, Deacons enforcement, and NAACP organizing. |
| S9 | Deacons for Defense chapter operating in Port Gibson | **supported** | Corrected transcript: "Rudy Shields and George Henry and Julius Warner, when they were organizing the dance and the deacons and they were carrying the weapons, Dan McCay came to them..." Multiple references confirmed. |
| S10 | Rudy Shields (Chicago via Vicksburg) and his community-organizing methods | **partial** | Corrected transcript verifies Rudy Shields is "from the end of the city [Vicksburg], by way of Chicago" — matches "Chicago via Vicksburg." However the transcript records speaker uncertainty: "I think he's already from the end of the city, but not mistaken." The Chicago/Vicksburg origin is speaker's best recollection, not documented certainty. Grade partial rather than supported given hedged language. |
| S11 | NAACP v. Claiborne Hardware (1982) Supreme Court case, which established the right to organize economic boycotts | **supported** | Corrected transcript: "you talk to hear about the NAACP v. Claiborne Hardware Co. 458 U.S. 886 Co. Yes. So that was filed by the white merchants 69 to try to stop the boycott." Independently verified via civil_rights_facts.json Charles Evers entry. |

**Summary of Subject paragraph issues:**

- **1 contradicted claim** (S5): James Miller described as "Korean War vet's son" — this is Carolyn's father, not James's. James's father was a WWII veteran. This is the single highest-priority correction because it misidentifies a named subject of the interview.
- **1 partial claim** (S10): Rudy Shields origin "Chicago via Vicksburg" — accurate but based on the speaker's hedged recollection; should note speaker uncertainty in the published paragraph.
- **9 supported claims** (S1–S4, S6–S9, S11): no change needed.

**Corrected Subject paragraph:**

> **Carolyn Miller** (b. 1953) — grew up in Hermanville, MS with her grandparents; involved in the Port Gibson youth movement starting ~1966 at age 11–12 as a voter-registration canvasser; daughter of a Korean War veteran. **James Miller** — son of a World War II veteran; Claiborne County activist; later Claiborne County administrator. The interview is the most detailed first-person account in the corpus of: (a) the 1966 Port Gibson / Claiborne County boycott of white merchants, (b) the Deacons for Defense chapter operating in Port Gibson, (c) the SNCC-organizer Rudy Shields (from the Vicksburg area via Chicago, per speakers' recollection) and his community-organizing methods, and (d) the eventual *NAACP v. Claiborne Hardware Co.*, 458 U.S. 886 (1982), the Supreme Court case that established the constitutional right to organize politically motivated economic boycotts.

---

### Section 2 — Cross-Pass Coherence Check

**Internal contradictions identified and adjudicated:**

| ID | Contradiction | Passes involved | Adjudication |
|---|---|---|---|
| C1 | 12.9 (Dan McKay / Dan McCay) graded `low` in P1, promoted to `high` in P4 | P1 vs. P4 | **P4 wins.** P4 re-read confirms consistent "Dan McCay" spelling in Carolyn's direct-attribution narrative ("Dan McCay came to them and wanted to de-escalate"). Internal transcript consistency is the decisive factor; adversarial verification of given/family name still recommended but confidence is `high` with that caveat. |
| C2 | 12.11 (Allen Binder / Alon Barrel / Alvin Binder) — P1 identified "Alvin Binder" (Jackson MS attorney), P4 notes P2 introduced "Alan Barrell" as a county supervisor and flags discrepancy between statewide-Jackson attorney and local Port Gibson attorney/supervisor. | P1, P2, P4 | **P4 adjudication preserved.** The corrected transcript uses "Alvin Binder" consistently (4+ occurrences) and Carolyn explicitly says "He's just an attorney here. He's a prominent attorney. And he was a... A terrible supervisor." Both the attorney and county supervisor dimensions are supported by the text. The most economical resolution: Alvin Binder is a Port Gibson-area attorney who also served as county supervisor — not a Jackson-only figure. Retain "Alvin Binder" as the best canonical identification while flagging the local-vs.-Jackson discrepancy for adversarial review. |
| C3 | 12.39 / 12.P2T.22 ("first chapter of the church") — P1 graded `low` for "first AME or first Baptist?"; P2-tail resolved to `high` for First A.M.E. Church Port Gibson. The corrected transcript now reads "Yeah, the First African Methodist Episcopal Church, Port Gibson MS. Yeah." | P1, P2-tail, P3 | **Fully resolved.** The corrected .txt file has already incorporated the First A.M.E. correction. P3's promotion to `high` is confirmed. No contradiction remains. |
| C4 | 12.P3.2 (Pigford v. Glickman alleged indirect reference) — P3 proposed it, P4 retracted it. | P3 vs. P4 | **P4 wins — retraction stands.** The corrected transcript contains no occurrence of "Pigford" and no textual basis for the extrapolation. P3's row 12.P3.2 is excised from the official record. |
| C5 | 12.P2T.27 ("who been in the Hollywood") — P3 suggested Holocaust reference, P4 demoted to "Holy" / "holy war" garble in mass-meeting singing context. | P3 vs. P4 | **P4 wins.** The corrected transcript context ("freedom songs coming out of the rafters... I hear that little soldier in there, you know, who'd been in the Holocaust. Her and Dali, you know...") — notably the corrected .txt retains "Holocaust" as a possible rendering because the surrounding passage is about SNCC freedom-song singing at mass meetings and the low-confidence fragment cannot be safely resolved to "Holy." The corrected transcript makes a conservative choice here. P4's warning that the Holocaust interpretation is contextually implausible (this is a mass-meeting singing passage, not Holocaust testimony) should be preserved as an editorial note. Grade: `low`, `flagged-for-adversarial-review`. |
| C6 | 12.P4.6 ("Allen High School" → Chamberlain-Hunt Academy) — P4 flagged as `medium`, adversarial-review needed. | P4 only | **Open.** The corrected transcript reads: "how do you think Alvin Binder High School got built?" — the corrected .txt has partially resolved this by substituting "Alvin Binder High School" for "Allen High School," but P4's identification of this as a post-Brown white-flight segregation academy (likely Chamberlain-Hunt) remains unresolved. The corrected transcript's substitution of "Alvin Binder" is plausible (the prominent attorney/supervisor who James credits with community impact) but introducing Alvin Binder's name into the seg-academy sentence may itself be an error — Alvin Binder is described as a generally positive figure; it would be unusual for him to have built a segregation academy. This contradiction between the corrected-transcript substitution and the contextual logic needs adversarial-review flagging. |

**Unresolved contradictions for ensemble handoff:**

1. C2 (Alvin Binder local-vs.-Jackson discrepancy): Whisper renders the attorney/supervisor name consistently but the geographic-institutional question (Port Gibson firm vs. Jackson firm) is not resolved from transcript evidence alone.
2. C5 (P2T.27 "Holocaust" / "Holy" garble in freedom-song passage): the corrected transcript retains "Holocaust" as a conservative preservation; Pass 7 flags it as contextually implausible for adversarial-review.
3. C6 (Alvin Binder High School vs. Chamberlain-Hunt Academy): corrected transcript's "Alvin Binder High School" substitution is internally inconsistent with James's characterization of Alvin Binder as a helpful community figure — Codex should treat this sentence as requiring adversarial verification before publication.

---

### Section 3 — Residual Ground-Truth Corpus Proposals

Pass 1–4 already identified the following high-priority additions: Rudy Shields, *NAACP v. Claiborne Hardware Co.* (458 U.S. 886), Emilye Crosby, Deacons for Defense and Justice, First A.M.E. Church Port Gibson. Checking civil_rights_facts.json: Charles Evers is already present (entry "Charles Evers," line 629). Sweet Honey in the Rock (Bernice Johnson Reagon) is already present (line 415, as a sub-entry under "Bernice Johnson Reagon"). The following are **not yet in the 140-entry corpus** and are proposed for addition:

**Proposal 1: Rudy Shields (d. 1976)**
- **Role:** Chicago-via-Vicksburg SNCC/NAACP statewide boycott organizer; Charles Evers's chief operational architect for the Mississippi boycott strategy (Natchez 1965, Port Gibson 1966, Fayette 1966); protagonist of Emilye Crosby's *A Little Taste of Freedom: The Black Freedom Struggle in Claiborne County, Mississippi* (UNC Press, 2005).
- **Why corpus-worthy:** Referenced directly by every Claiborne County interviewee in the CRHP corpus. The corpus's Charles Evers entry already references the Port Gibson boycott and *NAACP v. Claiborne Hardware* — Rudy Shields is the operational figure who made that boycott work on the ground. He is a canonical Mississippi movement figure who is currently an alias gap in the corpus (the Charles Evers entry does not surface Rudy Shields as a searchable alias).
- **Transcript evidence:** "Rudy Shields was an old organiser. We're back in Chicago and stuff... He always seemed to be somebody who was very bright, okay? Seen to be committed to the community... I really honestly hope, man, that history records the contribution that Rudy Shields made to this trouble... unsung hero." Speaker confirms Shields died without the recognition he deserved.
- **Priority:** TOP — affects scorer accuracy on every Claiborne County entry.

**Proposal 2: Deacons for Defense and Justice**
- **Role:** Armed Black self-defense organization founded 1964 in Jonesboro, Louisiana; chartered chapters across Louisiana and Mississippi, including a documented Port Gibson chapter that provided armed security for civil rights workers and NAACP mass meetings during the 1966 boycott.
- **Why corpus-worthy:** Recurring cross-corpus reference (Pass 1–4 catalog row B documents multiple Whisper-rendering variants: "the Dickens," "decons of defense," "Digs," "Digs standing guard"). A canonical-organizations entry would enable the LLM scorer to correctly identify these variants. The Port Gibson Deacons chapter is directly documented in this transcript; Aaron Dixon's transcript (Entry referenced in the slice) documents the Seattle/Pacific Northwest dimension. This is a nationally significant organization with a corpus-wide Whisper-garble signature.
- **Transcript evidence:** "Rudy Shields and George Henry and Julius Warner, when they were organizing the dance and the deacons and they were carrying the weapons, Dan McCay came to them and wanted to de-escalate..." "You can imagine 25 or 30 black men at that particular point in time in history walking around with guns and putting people to business."
- **Priority:** HIGH.

**Proposal 3: NAACP v. Claiborne Hardware Co., 458 U.S. 886 (1982)**
- **Role:** Landmark U.S. Supreme Court decision unanimously holding that politically motivated economic boycotts are constitutionally protected First Amendment activity; arose directly from the 1966 Port Gibson, MS boycott of white merchants that this interview documents.
- **Why corpus-worthy:** The Charles Evers entry (civil_rights_facts.json line 633) already mentions *Claiborne Hardware* as a subordinate clause in the Charles Evers summary ("The Port Gibson boycott in particular produced the foundational federal-constitutional case NAACP v. Claiborne Hardware Co., 458 U.S. 886 (1982)"). But the case deserves its own standalone canonical-events entry because: (a) it is the only major Supreme Court civil-rights holding in the CRHP corpus that is not yet a top-level entry; (b) Whisper renders the case name in at least six distinct ways across this transcript alone ("play born hardware case," "the end of the way," "end of the ACP," etc.); (c) the LoC/Smithsonian publication context means this entry is likely to be the canonical primary-source reference for the case's oral-history dimension.
- **Transcript evidence:** "you talk to hear about the NAACP v. Claiborne Hardware Co. 458 U.S. 886 Co. Yes. So that was filed by the white merchants 69 to try to stop the boycott." Also: "they were trying to keep Evers and the NAACP out of Port Gibson."
- **Priority:** HIGH.

---

### Section 4 — Pass 7 Readiness Score (Formula v2)

**Input counts from slice review:**

| Component | Count | Score contribution |
|---|---|---|
| Baseline | — | +100 |
| **confidence_credit** (high\|correct rows, capped at +20): P1: 12.3, 12.6, 12.12, 12.13, 12.14, 12.17, 12.25, 12.30 (8 correct/high); P2: 12.P2.3, 12.P2.4, 12.P2.5, 12.P2.9, 12.P2.10, 12.P2.11, 12.P2.13, 12.P2.16, 12.P2.21, 12.P2.28, 12.P2.29 (11 high); P2T: 12.P2T.1, 12.P2T.2, 12.P2T.3, 12.P2T.5, 12.P2T.11, 12.P2T.17, 12.P2T.22, 12.P2T.23, 12.P2T.24, 12.P2T.25, 12.P2T.31 (11 high); P4: 12.P4.1, 12.P4.2, 12.P4.3, 12.P4.4, 12.P4.5, 12.P4.9, 12.P4.10, 12.P4.13, 12.P4.15, 12.P4.17, 12.P4.18 (11 high). Total high/correct rows: ~41. Capped at 20 rows for credit. | 20 rows (cap) | **+10.0** (0.5 × 20) |
| **pass_depth_credit**: Entry has Pass 1 (partial) + Pass 2 (partial + tail-sweep) + Pass 3 + Pass 4 + Layer 5 advisory (4 phantom rows removed, per slice header) + Pass 7 PRR verdict now applied. Cumulative through Pass 7 PRR. | — | **+18** |
| **pass6_resolution_credit**: No Pass 6 findings documented in this slice. Pass 6 was targeted at D2-ambiguous residuals; the D2-ambiguous rows in this entry (12.5 Hermanville, 12.7 Cleveland/Claiborne, 12.P2.1, 12.P2.2, 12.P2.5, 12.P2.24, 12.33) remain flagged as [LAYER-5: D2-ambiguous, ensemble-adjudication-pending] with no Pass 6 resolution markers in the slice. | 0 | **+0.0** |
| **outstanding_ensemble**: D2-ambiguous rows still pending ensemble adjudication: 12.5 (Hermanville), 12.7 (Cleveland/Claiborne pervasive), 12.P2.1 (Cleveland County recurring), 12.P2.2 (Hermond Hill), 12.P2.5 (NAACP v. Claiborne Hardware, phantom-rendering fuzzy=63), 12.P2.24 (Turnipseed), 12.33 (Turnipseed P1). Total: 7 D2-ambiguous outstanding. | 7 | **-10.5** (-1.5 × 7) |
| **low_confidence_residual**: Rows remaining at `low` or `medium` confidence not resolved by Pass 3 or Pass 4: 12.4 (midwife, low-flagged), 12.9 (Dan McCay — P4 promotes to high but adversarial verification still recommended; count as resolved), 12.10 (Mott Headley, medium-high), 12.15 (George Henry Walker, medium-flagged), 12.19 (Cameron/Carruth Williams, low-flagged), 12.20 (Joe Zerl, low), 12.21 (Reverend Wendy, low), 12.24 (King's Sushun, low), 12.26 (Rachel Wilson Ken Lamont, low), 12.35 (virginity garble, low), 12.36 (Marshall/Cameron Williams, low), 12.37 (four days Cason Project, low), 12.P2T.4 (Emerson Davis, low), 12.P2T.7-8 (firearms idiom, low), 12.P2T.15 (Wyatt/why-he's, low), 12.P2T.16 (Jones furniture-store, medium-flagged), 12.P2T.26-28 (freedom-song fragments, low). Total unresolved low/medium: ~17. | 17 | **-17.0** (-1.0 × 17) |
| **subject_paragraph_penalty**: 1 `contradicted` claim (S5: Korean War vs. WWII father-attribution); 0 `unsupported` claims. | 1 contradicted | **-3.0** (-3 × 1) |
| **speaker_originating_unhandled**: Speaker-originating errors not yet annotated for editorial footnoting: 12.16 (Julius Warner), 12.23 (Pop/Dad family roles), 12.27 (Reeves family), 12.28 (Shafer family), 12.29 (Mr. Dodd, Mr. Holtz), 12.32 (Sam Jennings), 12.P2T.20 (give you a little balls), 12.P2T.30 (Bill, bro), 12.P2T.32 (speaker's closing reflection). Most are low-stakes. Conservatively count 7 speaker-originating errors not yet editorially annotated. | 7 | **-3.5** (-0.5 × 7) |
| **canonical_complexity** (-0.05 per unique canonical figure): Unique canonical figures in this entry: Carolyn Miller, James Miller, Emilye Crosby, John Bishop, Guha Shankar, Rudy Shields, Charles Evers, Emmett Till, Tamir Rice, Laquan McDonald, Muddy Waters, John Lee Hooker, Bobby "Blue" Bland, Sweet Honey in the Rock, MLK Jr. (implied), Dan McCay, Julius Warner, Alvin Binder, George Henry, Carolyn's father (Korean veteran), James's father (WWII veteran), NAACP v. Claiborne Hardware. Approximately 22 unique canonical figures. | 22 | **-1.1** (-0.05 × 22) |

**Score calculation:**

```
100 (baseline)
+ 10.0 (confidence_credit, capped)
+ 18.0 (pass_depth_credit through Pass 7)
+ 0.0  (pass6_resolution_credit — no Pass 6 applied)
- 10.5 (outstanding_ensemble: 7 D2-ambiguous × 1.5)
- 17.0 (low_confidence_residual: 17 rows × 1.0)
- 3.0  (subject_paragraph_penalty: 1 contradicted × 3)
- 3.5  (speaker_originating_unhandled: 7 × 0.5)
- 1.1  (canonical_complexity: 22 × 0.05)
= 92.9
```

**Clamp check:** 92.9 is within [0, 100].

**Pass 7 v2 Score: 92.9**

---

### Section 5 — Publication-Readiness Verdict

Entry 12 is a joint interview with Carolyn Miller and James Miller, conducted December 4, 2015, at Mississippi Cultural Crossroads in Port Gibson, Mississippi. It is the most substantive first-person oral-history account in the CRHP corpus of the 1966 Claiborne County / Port Gibson boycott of white merchants, the Deacons for Defense chapter that provided armed security for civil rights workers and NAACP mass meetings, SNCC organizer Rudy Shields's community-organizing methods, and the foundational First Amendment case *NAACP v. Claiborne Hardware Co.*, 458 U.S. 886 (1982).

**Entry 12 is conditionally ready for Smithsonian-grade publication**, with one mandatory correction and three items requiring adversarial resolution before final sign-off.

**Mandatory correction (must fix before publication):**

The Subject paragraph misattributes the Korean War veteran service to James Miller's father. The corrected transcript clearly establishes that James's father was a World War II veteran ("My father was a World War II veteran") while Carolyn's father served in the Korean War ("my dad was in the Army, so he was a Korean veteran"). The published Subject paragraph must read: "Carolyn Miller (b. 1953)... daughter of a Korean War veteran" and "James Miller — son of a World War II veteran." This is a direct biographical error involving a named interview subject and cannot be published uncorrected.

**Items requiring adversarial resolution before final sign-off:**

1. **Seven D2-ambiguous rows** (12.5, 12.7, 12.P2.1, 12.P2.2, 12.P2.5, 12.P2.24, 12.33) remain flagged for ensemble adjudication. Most are pervasive Whisper substitutions (Cleveland → Claiborne County; Hermond Hill → Hermanville) that are high-confidence corrections in context but carry Layer 5 phantom-rendering flags. The ensemble review should be confirmatory for the geographic/county-name rows but may reveal genuine ambiguity in the Turnipseed given-name rows.
2. **"Alvin Binder High School" substitution** (corrected transcript, from P4 12.P4.6): The corrected .txt has substituted "Alvin Binder" for "Allen" in the seg-academy sentence, but Alvin Binder is described throughout the transcript as a helpful community figure — this substitution may be incorrect. Codex should flag this sentence for adversarial review (possible correction: Chamberlain-Hunt Academy or an unverified white-flight-era school name).
3. **Seventeen unresolved low/medium-confidence local-proper-noun rows** (Port Gibson Fair Street businesses, Claiborne County movement figures, firearms-idiom garbles) require Emilye Crosby's *A Little Taste of Freedom* (UNC Press, 2005) cross-reference to resolve. These do not block the canonical narrative but reduce per-claim citation confidence in any published summary.

**Action item for Codex:** Apply the Korean War / WWII attribution correction to the Subject paragraph immediately. Flag the "Alvin Binder High School" sentence as requiring adversarial check. Submit the seven D2-ambiguous rows to the ensemble adjudication queue. The Rudy Shields, Deacons for Defense and Justice, and *NAACP v. Claiborne Hardware* ground-truth corpus additions (Section 3) should be batched with other pending corpus expansions.

**Final score: 92.9 / 100**
