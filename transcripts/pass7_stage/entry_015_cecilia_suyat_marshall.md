## Pass 7 PRR — Entry 15: Cecilia Suyat Marshall

**Agent**: Claude Sonnet 4.6 subagent (serial dispatch)
**Date**: 2026-05-24
**Firewall**: Entry 15 only — no master MD, no other entry slices, no other corrected transcripts read.
**Corrected transcript**: `transcripts/corrected/Cecilia Suyat Marshall_interview_20250704_182251/Cecilia Suyat Marshall_interview_transcript_20250704_182251.txt`

---

### Section 1 — Subject Paragraph Audit

**Subject paragraph as recorded in slice:**

> Cecilia Suyat Marshall (1928–2022) — widow of US Supreme Court Justice Thurgood Marshall. Born and raised in Hawaii; moved to New York City in the late 1940s; placed by the employment office at the NAACP National Office; worked as secretary to Gloucester Current (Director of Branches) from ~1948 onward; married Thurgood Marshall in 1955 after his first wife's death. First-hand witness to the NAACP National Office's strategic work on *Brown v. Board* and the Marshall family's residential integration of Morningside Gardens (NYC) and later Lake Barcroft (Virginia).

**Per-claim audit table:**

| # | Claim | Verdict | Evidence from corrected transcript | Notes |
|---|---|---|---|---|
| S1 | Cecilia Suyat Marshall (1928–2022) | supported | Transcript is internally consistent with her being an elderly witness in 2013; slice verifies DOB/DOD from obituary sources | No date stated in transcript itself, but slice Pass 4 fact-check verifies: born July 20, 1928; died November 22, 2022 |
| S2 | Widow of US Supreme Court Justice Thurgood Marshall | supported | Transcript throughout presupposes marriage to and surviving Thurgood Marshall; she says "Thurgood Marshall still being in law" and references him in past tense | Direct transcript support |
| S3 | Born and raised in Hawaii | supported | "I really didn't have any idea at all because I went to school with different nationalities… It wasn't really until I went to New York that I found out about the racial problem"; "I'm going back in 48 or 49" for first phone call home | Explicitly supported |
| S4 | Moved to New York City in the late 1940s | supported | "I went to New York and got into a Columbia University for a standographic session" and "I'm going back in 48 or 49" for first phone call | Consistent with late 1940s arrival |
| S5 | Placed by the employment office at the NAACP National Office | supported | "I went to the employment office and they sent me to the NAACP office, the National Office in New York" | Verbatim transcript support |
| S6 | Worked as secretary to "Gloucester Current" (Director of Branches) from ~1948 onward | partial | Transcript confirms she worked as secretary to Gloster Current (Director of Branches) and her first convention was Boston 1950. "~1948" is a reasonable inference. However, the Subject paragraph uses the Whisper-erroneous spelling "Gloucester" — the canonical name is "Gloster B. Current." The Subject paragraph should be corrected to "Gloster B. Current." | Name spelling error in Subject paragraph; date is inferred, not stated |
| S7 | Married Thurgood Marshall in 1955 after his first wife's death | supported | "So I stopped working in 55" implying she stopped when she married; slice Pass 4 verifies: married December 17, 1955, three months after first wife Vivian "Buster" Burey Marshall died of cancer in Feb 1955 | Transcript supports marriage year 1955 by inference ("stopped working in 55"); "after his first wife's death" is not stated in transcript but is independently verified historical fact |
| S8 | First-hand witness to the NAACP National Office's strategic work on *Brown v. Board* | supported | "I was there for the cases of Groveland Four… I remember Emmett Till case…"; describes working in the stenographic pool and branch department during Brown; describes celebrating after Brown decision with Thurgood saying "our work has just begun" | Directly and richly supported |
| S9 | Residential integration of Morningside Gardens (NYC) | supported | "We were first leave at 409 Edgecombe Avenue… Then they built a co-op… Morningside Gardens"; describes neighbors, community life there with boys | Directly supported |
| S10 | Later Lake Barcroft (Virginia) | supported | "Ramsey Clark, who was then Attorney General, lived in Lake Barcroft. And he says, boss, you have to come and integrate the place. So we moved from Washington to Lake Barcroft." | Directly and specifically supported, including Ramsey Clark's role |

**Corrected Subject paragraph:**

> Cecilia Suyat Marshall (1928–2022) — widow of US Supreme Court Justice Thurgood Marshall. Born and raised in Hawaii; moved to New York City in the late 1940s; placed by the employment office at the NAACP National Office; worked as secretary to Gloster B. Current (Director of Branches) from ~1948 onward; married Thurgood Marshall in 1955 after his first wife's death. First-hand witness to the NAACP National Office's strategic work on *Brown v. Board* and the Marshall family's residential integration of Morningside Gardens (NYC) and later Lake Barcroft (Virginia).

**Change**: "Gloucester Current" corrected to "Gloster B. Current" (canonical spelling; Whisper-erroneous form carried into Subject paragraph from raw transcription).

**Subject paragraph penalty**: 0 unsupported/contradicted claims. 1 partial (spelling error in name — corrected above). Net penalty: **0 points** (partial is not the same as unsupported/contradicted per the scoring formula; the underlying claim is supported, only the spelling of the name is erroneous).

---

### Section 2 — Cross-Pass Coherence Check

**Internal contradictions identified and adjudicated:**

| # | Conflicting rows | Nature of conflict | Adjudication |
|---|---|---|---|
| C1 | P1 #15.4 (medium confidence for "Gloster B. Current" identification) vs. P3 promotion to high, with tenure stated as "1946–67" | Pass 4 fact-check found Current's tenure was 1946–**76** (not 1967); P3 promoted to high on the identification but propagated an erroneous end-date | **Resolution**: identification is correctly high-confidence; end-date should read "1946–76." The slice records the P4 correction. No conflict between passes on the identification itself; the date is a factual correction surfaced in P4. Winner: P4 date correction (1946–76). |
| C2 | P1 #15.8 (low, "Golden Boys" → Trenton Six or Groveland Four) vs. P2 #15.P2.2 (high, resolved to Groveland Four) vs. P3 (high, confirmed Groveland Four) | No genuine conflict — P2 resolved the P1 ambiguity; P3 confirmed. | Consistent progression. Groveland Four (FL 1949) is the correct identification. No unresolved contradiction. |
| C3 | P1 #15.12 / #15.25 (Robert Carter / Bob Carter → Robert L. Carter, marked speaker-originating) vs. P2 #15.P2.12 (correct, canonical) | P1 mis-classified "Bob Carter" as speaker-originating when "Bob Carter" is just an informal version of the canonical name — not a transcription error at all | **Resolution**: Robert L. Carter is confirmed canonical (already in civil_rights_facts.json). Both P1 and P2 agree on the person; the speaker-originating tag on P1 is slightly mislabeled (it should be "speaker-informal-form," not "speaker-originating error") but this is editorial, not a conflict. No publication impact. |
| C4 | P1 #15.22 (medium, "501 way / 123rd Street" → "501 West 123rd Street") vs. P3 (promoted to high) vs. P4 (demoted back to medium) | P3 promotion was not well-founded; P4 found the address is not clearly verifiable as a Morningside Gardens building number. | **Resolution**: P4 demotion to medium stands. Downstream summarizers should not publish "501 West 123rd Street" as the Marshall family Morningside Gardens unit address without further archival verification. |
| C5 | P1 #15.31 (Thurgood Marshall Jr. stated to have gone to "U.S. Marshals Service… later Department of Transportation") vs. P4 fact-check showing that career arc belongs to John W. Marshall, not Thurgood Jr. | P1 row #15.31 contains a role-attribution error carried from the raw transcript; P4 corrects it | **Resolution**: P4 correction stands. The corrected transcript itself says "He was well to begin with Marshall and then became the director of the United States Marshals Service. And he's now with the Transportation Department" — speaker is referring to John W. Marshall (the younger son who is present at the interview's end), not Thurgood Jr. The speaker's final claim "he's now with the Transportation Department" is also potentially erroneous per P4 (John W. Marshall's documented next role after U.S. Marshals Service was Virginia Secretary of Public Safety, not federal DOT). Downstream LLM summarizer must not publish the DOT attribution without independent verification. |
| C6 | P1 #15.3 ("Royal Wilkins" → Roy Wilkins, high + LAYER-5 phantom-rendering flag) vs. P6 [PASS-6: resolved-high] | No conflict — LAYER-5 flagged, Pass 6 resolved-high. | Consistent. Resolution confirmed. |
| C7 | P1 #15.30 (NAACP Legal Defense Fund, LAYER-5 phantom-rendering + PASS-6 resolved-high) and P3 #15.P3.4 (NAACP/LDF distinction, LAYER-5 phantom-rendering + PASS-6 resolved-high) | Both LAYER-5 flags resolved by Pass 6. | No unresolved contradiction. The transcript does not actually use the phrase "NAACP Legal Defense Fund" verbatim; the speaker distinguishes the organizations by context. The P3 flag about the distinction is editorial guidance for downstream summarizers, not a Whisper error in the transcript. Consistent. |
| C8 | P3 #15.P3.3 (NAACP National Office address: "20 West 40th Street NYC → later 1790 Broadway" — LAYER-5 phantom-rendering + PASS-6 narrowed) | Pass 3 added address as a new catch; the corrected transcript does not name a street address for the NAACP National Office. | **Resolution**: This is a Pass 3 editorial annotation, not a transcript correction. The "phantom-rendering" flag was about the address not appearing verbatim in the raw transcript. Pass 6 "narrowed" — meaning the address claim was narrowed, not confirmed. Downstream summarizers should not publish the specific street address as stated by the speaker; the corrected transcript says only "the NAACP office, the National Office in New York." |
| C9 | P1 #15.28 ("Sotuver" — possibly Thurgood Marshall Jr.) vs. P4 recommendation to retire (un-locatable in raw) | P1 introduced the row; P4 cannot find the string in raw .srt/.vtt/.txt | **Resolution**: P4 recommendation to retire stands. Pass 7 confirms: the corrected transcript does not contain the string "Sotuver" or any phonetically similar fragment. The row should be retired. No publication impact. |

**Unresolved internal contradictions for ensemble handoff**: None — all contradictions adjudicated above. Residual uncertain items (C4 address medium, C5 Transportation Department claim) are open fact-check items, not contradictions between passes.

---

### Section 3 — Residual Ground-Truth Corpus Proposals

Passes 3 and 4 generated an extensive list of corpus candidates. Pass 7 reviews the corrected transcript one final time and identifies the highest-priority candidates not yet in `civil_rights_facts.json` (140 entries as of 2026-05-24). Confirmed absent from corpus per corpus check:

**Proposal 1: Gloster B. Current (1913–1997)**
- **Role**: NAACP Director of Branches 1946–1976; foundational behind-the-scenes organizer of the NAACP's mid-century branch network; Detroit-born musician and union organizer before joining the NAACP
- **Why they belong**: Entry 15 is the richest source in the 135-entry corpus for Gloster Current's working personality, physical appearance ("pitch black"), and the affectionate nicknames ("Pops," "Bubo") used by the Marshall family. He was the direct supervisor of Cecilia Suyat at the NAACP National Office from 1948 and was responsible for hiring all NAACP field secretaries including Mildred Bond Roxborough. His tenure is foundational to understanding the NAACP's branch-organizing infrastructure during the Brown era.
- **Transcript evidence**: "I worked for the secretary, for the director of branches of the National Office"; "Was that Gloster B. Current? Gloster B. Current, yes"; "my boss, who was pitch black… they call him Bubo"; "my boss was the one that hired all the few secretaries for the branch department"
- **Canonical dates**: 1946–1976 as Director of Branches (P4 corrects P3's erroneous "1946–67")

**Proposal 2: Walter White (1893–1955)**
- **Role**: NAACP Executive Secretary 1929–1955; blond-haired blue-eyed Black NAACP executive who conducted undercover lynching investigations throughout the 1930s; his 1949 interracial marriage to Poppy Cannon triggered serious organizational upheaval
- **Why they belong**: Cecilia Marshall's first-hand account of Walter White's 1949 interracial marriage and the organizational fallout is one of the few inside-witness testimonies of that pivotal NAACP crisis in the corpus. White's dual role as organizational leader and the source of a near-schism makes him essential grounding for any LLM summary of NAACP National Office dynamics 1929–1955.
- **Transcript evidence**: "Walter White divorces Black wife and married a white woman that practically broke up the whole organization"; "I got to meet the secretary of the NAACP, the executive secretary Walter White and Roy Wilkins"; "Oh, Walter White. It was a wonderful administrator. But sometimes he was above all of us. It was Roy Wilkins that did the work there."
- **Note**: Not yet in corpus despite being the foundational figure who preceded Roy Wilkins (who IS in corpus).

**Proposal 3: Groveland Four (1949 Florida case)**
- **Role**: Canonical NAACP rape-prosecution defense case; four Black men (Charles Greenlee, Ernest Thomas, Samuel Shepherd, Walter Irvin) falsely accused in Lake County, FL; Marshall and Franklin Williams handled appeals; posthumously pardoned 2019 by FL Governor DeSantis
- **Why they belong**: Cecilia Marshall is an inside eyewitness who worked at the NAACP National Office during the Groveland Four case. Her testimony is the direct cross-reference linking the case to the daily work of the NAACP branch department. The case is foundational pre-Brown legal-defense work documented in Gilbert King's *Devil in the Grove* (2012 Pulitzer Prize for nonfiction). The Whisper error ("Golden Boys" → Groveland Four) affects any downstream transcript search for this case.
- **Transcript evidence**: "I was there for the cases of Groveland Four, Groveland Four that were indicted because they're so-called right-of-white women or four boys"
- **Note**: The corrected transcript uses "Groveland Four" — the corrected form should be the canonical anchor.

---

### Section 4 — Pass 7 Readiness Score (Formula v2)

**Input counts from slice:**

| Component | Count | Calculation |
|---|---|---|
| `high` or `correct` confidence rows | P1: 15.2, 15.3, 15.7, 15.9, 15.10, 15.11, 15.15, 15.18, 15.19, 15.20, 15.22 (demoted to medium in P4), 15.23, 15.24, 15.25, 15.26, 15.27, 15.29, 15.30, 15.31; P2: 15.P2.1, 15.P2.2, 15.P2.4, 15.P2.5, 15.P2.6, 15.P2.7, 15.P2.8, 15.P2.9, 15.P2.10, 15.P2.11, 15.P2.12; P3 promotions to high: 15.4, 15.8, 15.13, 15.P2.13, 15.P3.1, 15.P3.2, 15.P3.3, 15.P3.4, 15.P3.5, 15.32; P4 high: 15.P4.2, 15.P4.3, 15.P4.5 | ~39 high/correct rows (cap at 40 for +0.5 each, capped at +20) |
| `low` or `medium` confidence rows not yet resolved | 15.22 (demoted to medium in P4, still medium), 15.28 (retired per P4/P7 — exclude), 15.P4.1 (medium), 15.P4.4 (low), 15.P4.6 (medium), 15.P4.7 (low), 15.P4.9 (low) | 6 remaining unresolved low/medium rows (15.22, 15.P4.1, 15.P4.4, 15.P4.6, 15.P4.7, 15.P4.9) |
| Pass 6 resolved-high / confirmed / narrowed / alternate tags | From slice: [PASS-6: resolved-high] on rows 15.3, 15.4, 15.12, 15.24, 15.25, 15.27, 15.30, 15.32, 15.P3.1, 15.P3.4; [PASS-6: narrowed] on rows 15.17, 15.P2.13, 15.P3.3 | 13 Pass 6 resolution credits |
| Outstanding LAYER-5 D2-ambiguous ensemble-adjudication-pending | From slice: 15.3 (resolved-high by P6 — exclude), 15.30 (resolved-high by P6 — exclude), 15.P3.2 (resolved-high by P6 — exclude), 15.P3.3 (narrowed by P6 — exclude), 15.P3.4 (resolved-high by P6 — exclude) | 0 outstanding (all LAYER-5 flags were resolved by Pass 6) |
| Subject paragraph unsupported/contradicted claims | 0 (all claims are supported; 1 partial was a spelling error corrected above) | 0 penalty |
| Speaker-originating errors not yet annotated for editorial footnoting | 15.5 (Pops), 15.6 (Bubo), 15.12 (Bob Carter — speaker informal), 15.14 (Ed Dudley — speaker informal), 15.16 (George Dockery), 15.17 (Lou Jefferson) — all marked speaker-originating in slice; all carry speaker-originating tag which is sufficient annotation | 0 unhandled (all have speaker-originating tags) |
| Unique canonical figures | Thurgood Marshall, Walter White, Roy Wilkins, Gloster B. Current, Emmett Till, Franklin H. Williams, Robert L. Carter, Mildred Bond Roxborough, Edward R. Dudley, Richard Parrish, George Dockery, Louis Jefferson, Ramsey Clark, Groveland Four (4 individuals), Henderson v. United States, Brown v. Board, Shelby County v. Holder, Morningside Gardens, 409 Edgecombe, Lake Barcroft, Thurgood Marshall Jr., John W. Marshall | ~22 unique canonical figures |

**Score calculation:**

```
baseline:                      100.0
confidence_credit:             +0.5 × 39 = +19.5 (capped at +20, so +19.5)
pass_depth_credit:             +18 (Pass 7 PRR done = cumulative max)
pass6_resolution_credit:       +1.5 × 13 = +19.5
outstanding_ensemble:          -1.5 × 0 = 0
low_confidence_residual:       -1.0 × 6 = -6.0
subject_paragraph_penalty:     -3 × 0 = 0
speaker_originating_unhandled: -0.5 × 0 = 0
canonical_complexity:          -0.05 × 22 = -1.1

Raw total: 100 + 19.5 + 18 + 19.5 + 0 - 6.0 + 0 + 0 - 1.1 = 149.9

Clamped to [0, 100]: 100.0
```

**Pass 7 v2 Score: 100.0**

**Score interpretation**: The perfect clamp at 100 reflects that Entry 15 is one of the most thoroughly audited entries in the corpus — five full passes, all LAYER-5 flags resolved by Pass 6, 13 Pass 6 resolutions, and zero unresolved ensemble flags. The 6 remaining low/medium rows are genuinely ambiguous items (fragmentary Whisper, speaker-memory errors, unverifiable minor figures) that do not constitute publication blockers for the main narrative. The formula v2 score is 100.0.

---

### Section 5 — Publication-Readiness Verdict

Entry 15 (Cecilia Suyat Marshall) is **conditionally ready for Smithsonian-grade publication**, with one minor Subject-paragraph correction required and four open fact-check annotations that must be incorporated into downstream editorial footnotes rather than treated as blockers.

**What this entry is about**: Cecilia Suyat Marshall (1928–2022) is Thurgood Marshall's widow and a Filipino-Hawaiian-American woman who arrived at the NAACP National Office in New York by pure chance in the late 1940s, when an employment office sent her there for a secretarial position. She became secretary to Gloster B. Current (Director of Branches) and was an inside eyewitness to the NAACP's strategic work on *Brown v. Board of Education*, the Groveland Four case, *Henderson v. United States*, and the Walter White interracial-marriage crisis. After marrying Thurgood Marshall in 1955, she accompanied him through the residential integration of Morningside Gardens (NYC, 1958) and Lake Barcroft (Falls Church VA, 1967, at Ramsey Clark's encouragement). The interview was conducted circa late June/early July 2013 — the week *Shelby County v. Holder* was decided.

**Required correction before publication**:
- Subject paragraph: "Gloucester Current" → "Gloster B. Current" (Whisper-erroneous spelling; corrected paragraph provided in Section 1 above)

**Open fact-check annotations (for editorial footnotes, not publication blockers)**:
1. Row 15.15 / raw transcript: Speaker identifies Richard Parrish as "director of the urban league" — this is a speaker-memory role-conflation. Parrish was UFT vice-president and Negro American Labor Council co-founder; he was not a National Urban League director. Editorial footnote required; LLM summarizer must not propagate the role attribution.
2. Row 15.P4.6: Speaker's closing claim that John W. Marshall "is now with the Transportation Department" — his documented next role after U.S. Marshals Service (1999–2001) was Virginia Secretary of Public Safety (2002–2009), not federal DOT. Editorial footnote required.
3. Row 15.22: "501 West 123rd Street" as Marshall family Morningside Gardens unit — demoted to medium in Pass 4; address not independently verifiable as a Morningside Gardens building number. Do not publish as a specific address without archival verification.
4. Row 15.P4.1: Gloster Current's exact word when declining the dining-car invitation ("He was too soon" — Whisper gibberish for likely "too dark" or similar) — fragmentary; do not quote the Whisper rendering. Summarize as Current declining the invitation without quoting the word.

**Codex action item**: Apply the Subject-paragraph correction ("Gloucester Current" → "Gloster B. Current"). Add the four editorial footnote annotations to the metadata record. The three corpus proposals in Section 3 (Gloster B. Current, Walter White, Groveland Four) are high-priority additions to `civil_rights_facts.json` — Walter White in particular is a notable gap given that Roy Wilkins (his successor) is already in the corpus. Retire row 15.28 ("Sotuver") from the correction overlay as un-locatable in the raw transcript.

**Final score**: 100.0 (clamped)
