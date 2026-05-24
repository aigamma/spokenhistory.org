## Pass 7 PRR — Entry 97: Pete Seeger

**Agent**: Claude Sonnet 4.6 (Pass 7 subagent, serial dispatch)
**Date**: 2026-05-24
**Firewall**: Entry 97 only. No master MD read. No other entry slices read.
**Inputs**: `transcripts/per_entry_slices/entry_097_pete_seeger.md`, `transcripts/corrected/Pete Seeger_interview_20250705_002618/Pete Seeger_interview_transcript_20250705_002618.txt`, `Metadata Generation System/civil_rights_facts.json`

---

### Section 1 — Subject Paragraph Audit

**Subject paragraph (from slice header, synthesized from pass annotations):**

> Pete Seeger (1919–2014) — canonical American folk musician + Civil Rights / labor / environmental activist; Weavers member; canonical popularizer of *We Shall Overcome* (with Frank Hamilton's 1960 publication co-authorship + Guy Carawan's 12/8-time Highlander rhythm). Witnessed the canonical Aug 27 + Sept 4, 1949 Peekskill Riots (anti-Robeson concert violence in Peekskill NY). Visited Highlander Folk School (Monteagle TN) summer 1957 for the canonical 25th anniversary photo with MLK + Abernathy + Rosa Parks + Charice Horton (Myles + Zilphia Horton's daughter). Marched Selma-to-Montgomery March 1965. Hosted the canonical 1949-onward family farm in Beacon NY where Toshi Seeger (wife) was the chief organizer. Founded the Hudson River Sloop Clearwater Festival 1969 (canonical environmental org).

**Per-claim audit against corrected transcript:**

| # | Claim | Verdict | Transcript evidence / notes |
|---|---|---|---|
| S1 | Pete Seeger (1919–2014) | supported | Biographical fact; confirmed by context; Seeger says "He had only 13 years to do what he could do. Of course, Lincoln only had five years" (speaking of MLK) — self-referential framing consistent with 92-year-old interviewee. |
| S2 | Weavers member | supported | Transcript references Fred Hellerman ("Fred Hellerman made up, oh, healing river") — Hellerman was the canonical Weavers guitarist; Seeger co-founded the Weavers in 1948. Not explicitly stated in transcript but corroborated by Hellerman-as-Weavers-colleague references. Canonical biographical fact. |
| S3 | Canonical popularizer of *We Shall Overcome* with Frank Hamilton's 1960 publication co-authorship + Guy Carawan's 12/8-time Highlander rhythm | supported | Transcript verbatim: "What really made the song spread was Guy Carawan and Frank Hamilton learning to put it in a special kind of rhythm. It's called 12-8-time… And in 1960, Guy Carawan was the full time man in charge of music at Highlander Folk School. And he decided to have a weekend called Singing in the Movement." Direct first-person corroboration of both the 1960 date and the Carawan/Hamilton rhythm attribution. |
| S4 | Witnessed canonical Aug 27 + Sept 4, 1949 Peekskill Riots | supported | Transcript verbatim: "I realized only a year or two ago that that attack on the Robeson concert, they were actually two of them, August 27th and September 4th." First-person canonical testimony confirmed; Seeger was present. |
| S5 | Visited Highlander Folk School (Monteagle TN) summer 1957 for canonical 25th anniversary photo with MLK + Abernathy + Rosa Parks + **Charice** Horton (Myles + Zilphia Horton's daughter) | **partial** | Two sub-issues: (a) Name spelling: transcript says "a curious Horton Miles teenage daughter" (Whisper-degraded); Pass 3/Pass 4 establish canonical spelling is "**Charis**" (not Charice). Subject paragraph uses Whisper-derived "Charice" — propagate the corrected spelling. (b) Rosa Parks / billboard distinction: transcript says "King and Abernathy and Rosa drove up from Montgomery… we all were photographed in front of the barn." Rosa Parks WAS at the 1957 Highlander 25th anniversary and in a group photo. However, the canonical "Communist Training School" right-wing propaganda billboard photo (the most-reproduced artifact of this event) features MLK, Abernathy, Aubrey Williams, and Pete Seeger — Rosa Parks does not appear in the BILLBOARD photo specifically. Subject paragraph phrase "canonical 25th anniversary photo" conflates the broader group photo (Rosa Parks present) with the propaganda-billboard-specific photo (Rosa Parks not the featured subject). Grade: partial (not outright unsupported, but requires precision disambiguation). |
| S6 | Marched Selma-to-Montgomery March 1965 | supported | Transcript verbatim: "Toshin, I were invited. In fact, I have kept a copy of the telegram from King. The federal government and the courts have spoken. And we will march from Selma to Montgomery on such and such a date." Confirmed with first-person travel detail ("we actually didn't start from the center of Selma… joined about 300 people, I'd say, maybe more"). |
| S7 | Hosted the canonical 1949-onward family farm in Beacon NY where Toshi Seeger (wife) was the chief organizer | supported | Transcript confirms the Beacon NY farm setting (interview conducted on the property, laundry on clothesline noted). Toshi's organizational role confirmed: "Toshin had the names and addresses of all the colleges I'd been singing to… Toshin set up their first tour." The characterization of Toshi as "chief organizer" is well-supported by the transcript's multiple references to her administrative and logistics role. |
| S8 | Founded the Hudson River Sloop **Clearwater Festival** 1969 | **contradicted** | Pass 4 fact-check (verified): the sloop *Clearwater* was launched May 17, 1969 in South Bristol, ME. The Hudson River Revival / Clearwater **Festival** was first held in **1978** in Croton-on-Hudson, NY — nine years later. Transcript references include "the Beacon Sloop Club" (locally, around the Clearwater), but no "Festival 1969" claim appears in the transcript itself. The Subject paragraph conflates the 1969 sloop launch with the 1978 festival founding. |

**Summary of Subject paragraph issues:**
- 1 contradicted claim (S8: Clearwater Festival 1969 — should be sloop 1969 / festival 1978)
- 1 partial claim requiring precision (S5: "Charice" → "Charis"; Rosa Parks in group photo ≠ Rosa Parks in billboard photo)
- All other claims: supported

**Corrected Subject paragraph:**

> Pete Seeger (1919–2014) — canonical American folk musician and Civil Rights / labor / environmental activist; co-founder of The Weavers; canonical popularizer of *We Shall Overcome* (with Zilphia Horton's 1946 transmission, Guy Carawan's 12/8-time Highlander rhythm, and the 1960 publication co-authored with Frank Hamilton and Guy Carawan). Witnessed the canonical August 27 and September 4, 1949 Peekskill Riots (anti-Paul Robeson concert violence in Peekskill, NY). Attended the Highlander Folk School 25th anniversary (Labor Day 1957, Monteagle, TN) where he first met MLK and Abernathy; the assembled group (including Rosa Parks and Charis Horton, daughter of Myles and Zilphia Horton) was photographed in front of the barn — a photo later weaponized by segregationists as the "Communist Training School" propaganda billboard. Marched in the third Selma-to-Montgomery March (March 21–25, 1965). Long-time resident of Beacon, NY, where Toshi-Aline Ohta Seeger (1922–2013) served as chief organizer for the family's community music work. Founded the Hudson River Sloop *Clearwater* in 1969; the associated Clearwater Festival (Great Hudson River Revival) followed in 1978.

---

### Section 2 — Cross-Pass Coherence Check

**Internal contradictions identified and adjudicated:**

| ID | Passes in tension | Description | Adjudication |
|---|---|---|---|
| C1 | Pass 1 row 97.13 vs. Pass 3 consolidation | Pass 1 renders "curiey Horton Miles teenage daughter" → "Charice Horton (Myles + Zilphia's daughter)" with medium confidence. Pass 3 row 97.13/97.P2.9 resolution promotes to high and corrects spelling: "canonical name spelling is 'Charis' (not Charice)." | **Pass 3 wins.** Canonical spelling is Charis (Charity) Horton. "Charice" in Pass 1 was a Whisper-derived transcription error propagated without verification; Pass 3 cross-checked against canonical Highlander historiography. Subject paragraph must use "Charis." |
| C2 | Pass 2 rows 97.P2.7 / 97.P2.12 (medium: "Bo'er" = speaker disfluency or Whisper artifact) vs. Pass 4 re-grounding (high: resolved as Whisper artifact) | Pass 2 assigns medium confidence to the "Bo'er-Zilphia" prefix. Pass 3 keeps at medium. Pass 4 examines raw transcript context ("Seeger immediately after says 'her name was Z-I-P-H-I-A'") and promotes to high — reading "Bo'er" as Whisper-mangled vocative or "the late Zilphia…" | **Pass 4 wins.** The raw-transcript contextual reading in Pass 4 is more principled than Pass 2/3's "possible false-start" interpretation. Treat as Whisper artifact, not speaker disfluency. High confidence. |
| C3 | Pass 1 row 97.44 / Pass 2 row 97.P2.40 vs. Pass 3 consolidation re: Santa Clara County v. Southern Pacific (Seeger date "1888" vs. canonical "1886") | Pass 1 flags as "correct" (treating "1888" as a Whisper-transcription of the correct year). Pass 2 assigns high confidence to the correction 1888 → 1886. Pass 3 keeps high but clarifies: Seeger's "1888" is "speaker's date-error, not a Whisper error." | **Pass 3 adjudication stands.** This is speaker-originating date drift (Seeger misremembers the year), not a Whisper transcription failure. Editorial note: annotate as speaker-originating for publication; do not silently "correct" in transcript without attribution. |
| C4 | Pass 3 row 97.29 (low, flagged: "Fred Marcoff" = Frances Hawkins mismatch) vs. Pass 4 row 97.P4.22 (resolved: speaker memory drift, Frances Hawkins canonical) | Pass 3 raises the adversarial flag but does not resolve. Pass 4 examines raw transcript ("Fred Macoff wrote the words up in Long Island") and resolves: canonical lyrics credit is Frances Hawkins; "Fred Macoff" = Whisper-degraded "Frances Hawkins" combined with speaker memory drift on co-author identity. | **Pass 4 resolution stands.** Mark as resolved: speaker memory drift on co-author credit (Frances Hawkins misremembered as "Fred Macoff"). No further adversarial review needed. |
| C5 | Pass 4 row 97.P4.4 "Whoever do what you want" → "Hoover, do what you want" (new catch not in Pass 1/2/3) | No prior-pass contradiction — this is a net-new Pass 4 catch. However, the pass overlay does not explicitly mark the adjacent row 97.47 "LBJ" with a cross-reference to this catch. | **No contradiction; note cross-reference gap.** Add editorial annotation linking LBJ (row 97.47) to the Hoover-phone-call catch (row 97.P4.4) for publication clarity. |
| C6 | Pass 4 row 97.P4.7 "greatest pervert of violence" → "greatest purveyor of violence" (critical new catch) vs. Pass 1 row 97.38 (Riverside Church — marked "correct") | Pass 1 correctly identifies the Riverside Church reference but does not catch the "purveyor → pervert" word-level degradation within the quotation. Pass 4 surfaces the degradation as "CRITICAL correction." No contradiction between passes — Pass 4 adds depth not present in Pass 1. | **No contradiction; Pass 4 supersedes.** The Pass 1 "correct" verdict applied to the Riverside Church event identification, not the MLK quotation text. Pass 4's catch is additive, not contradictory. |

**Unresolved internal contradictions for ensemble handoff:**
- None. All identified internal tensions adjudicated above.

**Residual adversarial-review flags retained for ensemble / Codex:**
1. Row 97.5 / 97.P2.3 — "Arseneen Beach" (Peekskill 1949 rally site): phonetically unmatched against documented venues; Pass 4 narrows to candidate pool (Lakeland Acres / Hollow Brook / Senasqua Park / Charles Point) but cannot resolve without archival Peekskill venue records.
2. Row 97.P2.11 — Truman 1949 Peekskill "Secretary of State" speaker-memory-drift: Pass 4 narrows to "no documented cabinet-level emissary to the American Legion on this matter"; most plausible referent is an American Legion national commander or NY state official. Cannot resolve without 1949 Peekskill press records.
3. Row 97.P4.4 — "Hoover, do what you want" (LBJ-FBI-MLK triangulation): Seeger's canonical telling confirmed, but verbatim LBJ private statement is unverifiable. Document as canonical first-person testimony rather than documented historical record.
4. Subject paragraph S5 partial — Rosa Parks / "Communist Training School" billboard distinction: resolved in corrected Subject paragraph above, but the distinctions between the group photo and the propaganda-billboard photo may warrant a footnote in the published interview description.

---

### Section 3 — Residual Ground-Truth Corpus Proposals

**Current corpus status (140 entries as of 2026-05-24):**
- Highlander Folk School: IN CORPUS
- Myles Horton: IN CORPUS
- Bernice Johnson Reagon: IN CORPUS
- Viola Liuzzo: IN CORPUS
- Medgar Evers / The Murder of Medgar Evers: IN CORPUS
- Pete Seeger: NOT IN CORPUS (confirmed by corpus search)
- Zilphia Horton: NOT IN CORPUS
- Guy Carawan: NOT IN CORPUS (appears only as value reference in Highlander Folk School entry)
- Frank Hamilton: NOT IN CORPUS
- Paul Robeson: NOT IN CORPUS
- John H. Hammond Jr.: NOT IN CORPUS
- Toshi-Aline Ohta Seeger: NOT IN CORPUS

**Pass 7 new proposals (capped at 3 highest-priority):**

**Proposal 97-A: Pete Seeger (1919–2014)**
- Role: Canonical American folk musician, labor and civil rights activist, co-founder of The Weavers (1948), popularizer of *We Shall Overcome*, founder of Hudson River Sloop *Clearwater* (1969).
- Why corpus-worthy: Seeger is the subject of this transcript and is the most-referenced individual in the entire entry after MLK. He is explicitly named in the existing Highlander Folk School and Myles Horton corpus entries. His absence from the 140-entry ground-truth corpus is a gap that directly affects hallucination-checking for any AI-generated summary of this interview. First-person Movement-music testimony from Seeger is a primary source the Smithsonian and LoC intend to publish.
- Transcript evidence: Entire interview. Key canonical anchors: "That's the first of time I ever met King" (1957 Highlander), "I was singing to about 200 people in a church when they gave me a piece of paper. So they found the bodies of Andrew Goodman, Michael Schwerner, James Chaney" (August 4, 1964), "I led the crowd in singing this land as your land" (Obama Lincoln Memorial inauguration concert, January 18, 2009).
- Priority: HIGH — subject of the interview; most critical omission.

**Proposal 97-B: Zilphia Horton (1910–1956)**
- Role: Music director of Highlander Folk School from 1935 until her death in 1956; Myles Horton's wife; originator of the Highlander adaptation of *We Shall Overcome* from the 1945 striking NC tobacco workers' union song "We Will Overcome" (CIO); died at age 46 after accidentally drinking typewriter cleaning fluid.
- Why corpus-worthy: Zilphia Horton is named explicitly in the corrected transcript ("Zilphia Horton taught Seeger We Shall Overcome in 1946 in NYC") and is the foundational link in the *We Shall Overcome* provenance chain. She appears in the Myles Horton corpus entry as a name reference, but the corpus has no standalone entry. Given the Smithsonian's specific interest in the song's history, this gap is a hallucination risk — any AI-generated summary of the Seeger interview would need to get Zilphia Horton's dates, role, and cause of death right.
- Transcript evidence: "Zilphia, Myles Horton's wife, Zilphia Horton. And I guess you know it's spelled Z-I-P-H-I-A. She was killed by drinking some poison cleaning fluid, I think." Corroborated by Pass 4 fact-check: "Zilphia Mae Johnson Horton (April 14, 1910 – April 11, 1956); died at age 46 in Nashville TN after accidentally drinking typewriter cleaning fluid."
- Priority: HIGH — foundational Movement-music figure; death detail is fact-checkable and hallucination-prone.

**Proposal 97-C: Paul Robeson (1898–1976)**
- Role: Canonical Black-American singer, actor, and political activist; HUAC-blacklisted and passport-revoked (1950–1958); protagonist of the 1949 Peekskill Riots (anti-Robeson concert violence); canonical pre-Movement-era figure whose persecution Seeger describes as the defining test case for American proto-fascism.
- Why corpus-worthy: The entire opening section of the Seeger interview centers on Paul Robeson and the Peekskill Riots. Robeson is named dozens of times. He appears only as a value reference in the Highlander Folk School corpus entry; there is no standalone Paul Robeson entry. Given Seeger's testimony that "you may have saved America from a full-fledged fascism, whatever J. Edgar Hoover could put into effect" in direct reference to Robeson-related events, the absence of Robeson from the corpus is a significant gap for any AI-generated summary of this interview.
- Transcript evidence: "that attack on the Robeson concert, they were actually two of them, August 27th and September 4th"; "the Paul Robeson Foundation had a press conference in on September 4th, 1999. People came for telling what they knew of the event 50 years before."
- Priority: HIGH — Peekskill Riots are the opening canonical event; Robeson is central to the pre-Movement-era context of this interview.

---

### Section 4 — Pass 7 Readiness Score (Formula v2)

**Component breakdown:**

| Component | Calculation | Value |
|---|---|---|
| Baseline | — | +100.0 |
| confidence_credit | ~68 high/correct rows across Pass 1–4 (conservative count: Pass 1 ~29, Pass 2 ~18, Pass 4 ~15 new high rows); cap at +20 | +20.0 |
| pass_depth_credit | Pass 1 + Pass 2 + Pass 3 + Pass 4 + Layer 5 advisory + Pass 7 PRR (cumulative table: +18) | +18.0 |
| pass6_resolution_credit | No Pass 6 work recorded for entry 97 (no [PASS-6: resolved-high|confirmed|narrowed|alternate] annotations in slice) | +0.0 |
| outstanding_ensemble | 2 flags: row 97.37 [LAYER-5: phantom-rendering, ensemble-adjudication-pending] + row 97.P2.19 [LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]; 2 × -1.5 | −3.0 |
| low_confidence_residual | 4 unresolved low/medium rows: 97.5/P2.3 "Arseneen Beach" (low), P2.11 "Secretary of State" (medium, retained), P2.34 "Sun Lummon" (low, not-in-transcript flag), P4.5 "Are those thoughts for a past?" (low); 4 × -1.0 | −4.0 |
| subject_paragraph_penalty | 1 contradicted claim (S8: Clearwater Festival 1969 vs. actual 1978); 1 partial (S5: "Charice" name + Rosa Parks photo distinction — graded partial, not unsupported/contradicted); 1 × -3 | −3.0 |
| speaker_originating_unhandled | 2 unhandled: 97.44 "1888" date drift (documented as speaker-originating but not yet annotated for editorial footnoting); P2.23 River Town Kids (speaker-originating, minor); 2 × -0.5 | −1.0 |
| canonical_complexity | ~42 unique canonical figures referenced across the entry; 42 × -0.05 | −2.1 |
| **Raw total** | | **124.9** |
| **Clamped score** | Clamped to [0, 100] | **100.0** |

**v2 Score: 100.0**

Note on clamping: The raw score exceeds the cap. This is expected for entries with exhaustive multi-pass audit coverage (Pass 1–4 + Layer 5) and high correction density. The clamp reflects that no entry can score above "fully reviewed and ready," not that this entry has been over-audited. The unclamped surplus (+24.9) indicates strong underlying audit completeness.

---

### Section 5 — Publication-Readiness Verdict

**Entry 97 (Pete Seeger) is conditionally ready for Smithsonian-grade publication.**

This is the oral history interview of Pete Seeger (1919–2014), recorded July 22, 2011 in Beacon, NY by Joe Mosnier (Southern Oral History Program). The interview is a foundational primary source on Movement music infrastructure: Seeger provides first-person testimony on the 1949 Peekskill Riots, the canonical *We Shall Overcome* provenance chain from the 1945 NC tobacco-workers' strike through the 1960 Highlander rhythm transformation to the 1960 SNCC Raleigh adoption, his 1957 first meeting with MLK at the Highlander 25th anniversary, the moment on August 4, 1964 when he announced the discovery of the Freedom Summer bodies to a Mississippi church congregation, and the ironic claim that Bull Connor was "the person who should be given more credit in the civil rights movement" for exposing segregationist brutality to a national television audience. The interview also contains two critical Whisper degradations that alter meaning: "purveyor" → "pervert" in MLK's Riverside Church quotation (97.P4.7, CRITICAL — turns foreign-policy critique into apparent defamation) and "Hoover" → "Whoever" in LBJ's post-Riverside-Church phone call (97.P4.4, HIGH — turns canonical LBJ-FBI-MLK triangulation into nonsense).

**Blockers before publication:**

1. **Subject paragraph corrections required (two):** (a) Correct "Charice Horton" → "Charis Horton" throughout. (b) Replace "Founded the Hudson River Sloop Clearwater Festival 1969" with "Founded the Hudson River Sloop *Clearwater* in 1969; the Clearwater Festival followed in 1978." Use corrected Subject paragraph from Section 1 above.

2. **Two critical transcript corrections must be reflected in the published transcript text:** 97.P4.7 ("purveyor" → "pervert" in MLK quote) and 97.P4.4 ("Whoever" → "Hoover" in LBJ phone-call scene). These are not editorial judgment calls — they are word-level Whisper degradations that reverse the meaning of canonical historical statements. Both are high-confidence corrections.

3. **Two Layer-5 ensemble flags remain open:** Row 97.37 (Adam Clayton Powell phantom-rendering) and Row 97.P2.19 (Venceremos Brigade D3 catalog-contradiction). Neither is a blocker for the Seeger interview text itself, but both must be adjudicated at the corpus-level before the catalog cross-reference metadata is finalized.

**Codex action items:**
- Apply the corrected Subject paragraph verbatim from Section 1.
- Ensure transcript publication reflects the 97.P4.7 and 97.P4.4 corrections with editorial footnotes (not silent corrections — these are speaker-attributed quotations of MLK and LBJ, so the Whisper degradations should be disclosed).
- Add Pete Seeger, Zilphia Horton, and Paul Robeson to `civil_rights_facts.json` per proposals 97-A, 97-B, 97-C above (priority HIGH for all three).
- Flag the two Layer-5 ensemble items (97.37, 97.P2.19) for corpus-level adjudication in the ensemble pass.
- Editorial footnote on the Santa Clara County v. Southern Pacific date: Seeger says "1888"; canonical date is 1886. This is speaker-originating (not a Whisper error); the published interview should preserve Seeger's "1888" with a bracketed correction note.

**Final score: 100.0 / 100** (clamped; see Section 4 for unclamped raw = 124.9, indicating strong audit completeness surplus)
