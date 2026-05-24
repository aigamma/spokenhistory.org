## Pass 7 PRR — Entry 82: Marilyn Luper Hildreth

**PRR date:** 2026-05-24
**Agent:** Claude Sonnet 4.6 (Pass 7 subagent, strict entry-82-only scope)
**Inputs read:** per_entry_slices/entry_082_marilyn_luper_hildreth.md · corrected/Marilyn Luper Hildreth_interview_20250704_234223/*.txt · civil_rights_facts.json · PASS7_DESIGN.md

---

### Section 1 — Subject Paragraph Audit

**Subject paragraph (from slice):**

> Marilyn Luper Hildreth (née Marilyn Calvin Luper; later Hildreth) — daughter of Clara Luper (canonical Oklahoma NAACP Youth Council advisor + Aug 19, 1958 OKC Katz Drug Store sit-in leader) and Calvin Luper (electrician, divorced from Clara mid-1960s). Was 8 years old when she initiated the canonical motion at the August 1958 NAACP Youth Council meeting at 1819 NE Park Place to sit-in at Katz Drug Store — the canonical *first* successful department-store lunch-counter sit-in in US history, predating Greensboro by 18 months. Cross-refs Calvin Luper transcript #10 (her brother).

**Per-claim audit table:**

| # | Claim | Verdict | Evidence / Notes |
|---|---|---|---|
| S1 | Marilyn Luper Hildreth née Marilyn Calvin Luper | **supported** | Corrected transcript opening confirms "Miss Marilyn (née Calvin) Luper Hildreth"; speaker's own birth name recurs in transcript |
| S2 | Daughter of Clara Luper | **supported** | Speaker's first-person narrative throughout; "my mother…Clara Luper" explicit |
| S3 | Clara Luper was Oklahoma NAACP Youth Council advisor | **supported** | Transcript: NAACP Youth Council meeting at 1819 NE Park Place; she "prepared us to participate in the city and movement" — advisor role confirmed throughout |
| S4 | Clara Luper was the Aug 19, 1958 OKC Katz Drug Store sit-in leader | **supported** | Transcript confirms Clara Luper led the OKC sit-in campaign; civil_rights_facts.json Clara Luper entry confirms the Aug 19, 1958 date |
| S5 | Calvin Luper was an electrician | **supported** | Speaker verbatim: "He was electrician." |
| S6 | Calvin Luper divorced from Clara mid-1960s | **partial** | Speaker says "My mother and dad had the worst at early age, right in the midst of it" — confirms separation/split during the movement era, but "mid-1960s" is a slice-level inference; transcript does not give an explicit date for the divorce. Acceptable as contextual inference, not directly contradicted. |
| S7 | Marilyn was 8 years old when she made the motion at the NAACP Youth Council meeting | **supported** | Speaker verbatim: "I was eight years old at that time. This I can remember that I was not at 10 years old." |
| S8 | The meeting was at 1819 NE Park Place | **supported** | Transcript: "at our house at 1819 NE Park Place, we were having an NAACP Youth Council meeting." |
| S9 | The motion was to sit-in at Katz Drug Store | **supported** | Transcript: "I suggested made a motion that we would go down to Katz Drug Store store and just sit." |
| S10 | The OKC Katz sit-in was "the canonical *first* successful department-store lunch-counter sit-in in US history, predating Greensboro by 18 months" | **contradicted** (requires correction) | civil_rights_facts.json Clara Luper entry explicitly states the Wichita Dockum Drug Store sit-in of July 1958, organized by Ron Walters, "slightly predates the OKC Katz sit-in." The claim to be the outright "first" in US history is factually inaccurate. Pass 4 fact-check (82.P4 table) already flagged this and prescribed the correction: change to "among the canonical first sustained department-store lunch-counter sit-ins of the modern civil rights era, predating the much more famous February 1, 1960 Greensboro Four sit-in by ~18 months (alongside the Wichita Dockum sit-in of July 1958)." |
| S11 | Cross-refs Calvin Luper transcript #10 (her brother) | **supported** | Speaker repeatedly references her brother Calvin; transcript #10 is his interview. |

**Corrected Subject paragraph:**

> Marilyn Luper Hildreth (née Marilyn Calvin Luper; later Hildreth) — daughter of Clara Luper (canonical Oklahoma NAACP Youth Council advisor + Aug 19, 1958 OKC Katz Drug Store sit-in leader) and Calvin Luper Sr. (electrician, separated from Clara during the Movement era). Was 8 years old when she initiated the canonical motion at the August 1958 NAACP Youth Council meeting at 1819 NE Park Place to sit-in at Katz Drug Store — among the canonical first sustained department-store lunch-counter sit-ins of the modern civil rights era, predating the much more famous February 1, 1960 Greensboro Four sit-in by ~18 months (alongside the Wichita Dockum sit-in of July 1958). Cross-refs Calvin Luper Jr. transcript #10 (her brother).

**Net subject-paragraph issues:** 1 claim `contradicted` (S10 — "first" sit-in overstates the canonical record; Wichita Dockum predates OKC by ~1 month). 1 claim `partial` (S6 — divorce date not transcript-confirmed). All other claims supported.

---

### Section 2 — Cross-Pass Coherence Check

**Contradictions and ambiguities reviewed:**

| Item | Passes involved | Adjudication |
|---|---|---|
| Barbara Posey Jones institutional affiliation: "University of Georgia (UGA)" vs. "Albany State University" | Pass 1 (82.14), Pass 2 (82.P2.18) → both say UGA; Pass 4 (82.P4 demotion table) demotes to "Albany State University (probable)" | **Pass 4 wins.** Pass 1+2+3 inferred "UGA" phonetically from "University of London, Georgia" (Whisper artifact); Pass 4 identified canonical Barbara Posey Jones affiliation as Albany State. The corrected transcript reads "Barbara Posey Jones — University of Georgia professor" — this is a retained Whisper artifact in the corrected file, not a confirmed institution. The institutional affiliation should remain at **medium confidence — Albany State University (probable)**, pending adversarial archival confirmation. No internal contradiction between passes; Pass 4's demotion is the correct resolution. |
| "Fish Street Baptist" → Fairview Baptist vs. Fifth Street Baptist | Pass 1 (82.12, low), Pass 2 (82.P2.19, low), Pass 3 (retained low), Pass 4 refined to "Fifth Street Baptist Church (probable)" | **Pass 4 narrowing wins.** Whisper "Fish" → "Fifth" is the cleanest phonetic substitution (Fricative /θ/-loss + sibilant rendering). Fifth Street Baptist Church (OKC, Rev. W.K. Jackson) is the primary candidate; Fairview Baptist demoted to secondary. **Adversarial flag retained.** Corrected transcript preserves "Fish Street Baptist" verbatim (speaker's own word), which is appropriate — the editorial note is in the overlay, not the corrected text. |
| "Tokyo and then I said" — family nickname or Whisper artifact? | Pass 1 (82.19, low), Pass 2 (82.P2.20, low), Pass 6 rejected as speculation; Pass 4 confirmed the "Tokyo" IS verbatim in the raw transcript (not a Whisper artifact) | **Pass 4 + Pass 6 together win.** "Tokyo" is confirmed verbatim (real word spoken by the speaker), but the referent (family nickname for Calvin Luper Jr., or for a friend) remains unresolved. Pass 6 correctly rejected speculation. Maintain as **speaker-originating utterance, referent unknown, adversarial flag retained.** |
| "Mother Andrews" — real campaign-staff person or Whisper hallucination? | Pass 2 (82.P2.23, low, might be real), Pass 3 (retained low), Pass 4 resolved as "Whisper hallucination — not a real referent" | **Pass 4 wins.** Raw spot-check context shows interviewer transitioning to the 1972 Senate primary topic; "Mother Andrews" is meaningless interpolation. **Resolved: Whisper hallucination.** No ongoing adversarial flag needed. |
| 82.P3.8 cross-corpus note about Marilyn being Calvin's "older sister" | Pass 3 only — no Pass 1/2/4 contradiction | The transcript does not explicitly confirm the birth-order relationship (who is older). The slice header says Calvin Luper is "Marilyn's brother" (not specifying order). Marilyn's birth year implied ~1950 (age 8 in 1958); Calvin Jr.'s birth year not confirmed in this transcript. The "older sister" claim in Pass 3 has no direct transcript basis — treat as **unresolved, low priority.** |
| "1968 sanitation workers strike" vs. 1969 | Interviewer setup said "summer 68"; Pass 2 (82.P2.22) and Pass 4 (82.P4.15) both correct to 1969 | **Both Pass 2 and Pass 4 consistent.** Canonical date is 1969. The corrected transcript renders this as "Interviewer's 'summer 68' -> the OKC sanitation strike actually occurred in 1969" — appropriate inline annotation. No contradiction. |
| Pass 2 row 82.P2.16 cross-contamination from entry #80 (Lonnie King) | Pass 2 noted the row was wrong entry; Pass 3 dropped it; Pass 4 confirmed via spot-check | **Fully resolved.** Administrative cleanup; no further action. |
| Pass 3 drop of shoe-sizing string anecdote (82.P2.26) reversed by Pass 4 | Pass 3 dropped as "not in transcript verbatim"; Pass 4 restored as Pass 4 catch 82.P4.3 | **Pass 4 wins.** The anecdote IS verbatim in the corrected transcript: "she had to take some three-it and tie a knot in it to determine the size shoe." Pass 3's drop was incorrect. Restored. |

**Unresolved internal contradictions for ensemble handoff:** None. All material contradictions have been adjudicated above. The "Tokyo" referent and the "Fifth Street vs. Fairview Baptist" identification are open adversarial-review items, not internal overlay contradictions.

---

### Section 3 — Residual Ground-Truth Corpus Proposals

Checking civil_rights_facts.json for existing entries on key figures from this transcript:

- **Clara Luper**: ALREADY IN CORPUS (entry "Clara Luper," detailed summary including the OKC Katz sit-in, Wichita Dockum comparison, *Brother President* play, *Behold the Walls* memoir). No addition needed.
- **NAACP**: ALREADY IN CORPUS.

**New proposals not yet in the 140-entry corpus:**

| # | Name / Entity | Role | Transcript evidence | Why they belong |
|---|---|---|---|---|
| 1 | **Herbert L. Wright** (1923–2007) | NAACP National Youth Director 1957–69 | Speaker: "A guy by the name of Herbert L. Wright with the NAACP was here in Oklahoma City and [saw] the play and invited the group of young people to the NAACP National Convention to produce Martin Luther King Jr." | Wright is the canonical operational link between Clara Luper's 1957 *Brother President* play and the NAACP National Convention tour that catalyzed the 1958 OKC sit-in. His invitation is the hinge event between the theatrical/educational work and the sit-in action. Foundational pre-Greensboro Movement figure not yet in corpus. |
| 2 | **Barbara Posey Jones** (~1940–) | Canonical OKC NAACP Youth Council spokesperson; Albany State University professor (probable) | Speaker: "the spokesperson for the NAACP Youth Council is a young lady who's now a Barbara Posey Jones — University of Georgia professor." Speaker identifies her by name as the canonical spokesperson. Posey Jones figure also appears in the Posey-house shelter episode (canonical Movement-courage testimony). | She is the named canonical spokesperson of the OKC NAACP Youth Council — a figure central to the pre-Greensboro sit-in narrative. Her institutional affiliation should be listed as "Albany State University (probable)" pending adversarial confirmation, not UGA. Her inclusion would give the corpus a second named OKC Youth Council figure alongside Clara Luper. |
| 3 | **Katz Drug Store sit-in (Aug 19, 1958)** | Canonical early sustained department-store lunch-counter sit-in | Transcript: "I suggested made a motion that we would go down to Katz Drug Store store and just sit… Katz Drug Store, desegregates its lunch counter in a couple of days." Full first-person account of the motion, the sit-in, and the desegregation outcome. | The sit-in as an *event* entry (not just through Clara Luper's bio entry) would allow the corpus to anchor the cross-entry Whisper-pattern corrections (Kestrick's / Cats → Katz) and the Wichita Dockum comparison. The Clara Luper entry covers it but an event-level entry would also capture the canonical 13-participant roster, the NAACP Youth Council institutional context, and the Greensboro comparison. Recommend creating an event entry alongside the existing Clara Luper biographical entry. |

---

### Section 4 — Pass 7 Readiness Score (Formula v2)

**Inputs counted from the full slice (Passes 1–4 + Layer 5 flags):**

| Component | Count | Notes |
|---|---|---|
| `high` or `correct` confidence rows (Pass 1 + P2 + P3 promotions + P4 catches) | 48 | Counting all rows graded high/correct across Passes 1–4: Pass 1 (17 high/correct), Pass 2 (+14 high/correct net new), Pass 3 promotions (+2: nickel seals→Nichols Hills, cross-corpus cascade), Pass 4 catches (~15, most at high). Approximate; capped at 40 for credit ceiling calculation. |
| `low` or `medium` confidence rows not yet resolved | 4 | 82.12/P2.19 Fish Street Baptist (medium-low), 82.19/P2.20 Tokyo (low), 82.P2.14 Nichols Hills originally medium (promoted to high in Pass 3 — not counting), 82.P2.23 Mother Andrews (resolved as Whisper artifact in Pass 4 — not counting). Net unresolved low/medium: **Fish Street Baptist** (1 row, medium-low) + **Tokyo** (1 row, low) + **Barbara Posey Jones institution** (1 row, medium post-Pass-4-demotion) = **3 rows**. |
| `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]` flags | 8 | Rows: 82.2, 82.3, 82.8, 82.14, 82.P2.1, 82.P2.4, 82.P2.5, 82.P2.6, 82.P2.13, 82.P2.18 — counting unique Layer-5-flagged rows across the overlay. Conservative count of remaining unresolved D2-ambiguous: after removing those resolved in Pass 4 (82.P2.1 is a catalog-pair confirm, not truly ambiguous; 82.P2.18 demoted but not D2-resolved), **outstanding ensemble flags ≈ 6**. |
| `[PASS-6: rejected]` resolutions | 2 | 82.19 (Tokyo rejected as speculation) + 82.P2.20 (same row, Pass 2 version). These are PASS-6 resolution credits: type = `rejected` (not `resolved-high/confirmed/narrowed/alternate`), so **no Pass-6 resolution credit** applies per formula. |
| Subject-paragraph claims graded `unsupported` or `contradicted` | 1 | Claim S10 ("first successful department-store sit-in") is `contradicted`. Claim S6 is `partial` — formula counts only unsupported/contradicted. |
| `speaker-originating` errors not annotated for editorial footnoting | 2 | 82.15/P2.15 (chimpanzee on me — well-annotated, likely footnoted) and 82.P2.25 (mom said…do what I'm going to do — speaker-originating family recall). The chimpanzee episode is explicitly confirmed twice by the speaker; the overlay notes this clearly. The 82.P4.9 canonical fear-once episode is also speaker-originating. Conservative count of speaker-originating items not yet formally annotated for editorial footnoting: **2** (the family-recall items; the chimpanzee is effectively annotated). |
| Unique canonical figures in this entry | ~18 | Clara Luper, Calvin Luper Sr., Calvin Luper Jr., Marilyn Luper Hildreth, Herbert L. Wright, Barbara Posey Jones, Roscoe Dunjee, Mahatma Gandhi, Joe Mosnier, John Bishop, Rev. W.K. Jackson (implicit), Ezell Shepard (Clara's father), unnamed Dunjee HS principal, Ron Walters (Wichita Dockum, mentioned in corpus note), MLK Jr. (implicit), the 13 sit-in participants (as a group), the Posey father. Conservative count: **18**. |
| Pass depth | Pass 1 + Pass 2 + Pass 3 + Pass 4 + Layer 5 advisory + Pass 7 PRR | Cumulative bonus table: baseline 100 + Pass 7 PRR = **+18** |

**Score calculation:**

```
baseline:                       100.0
confidence_credit:              +0.5 × 40 (capped) = +20.0
pass_depth_credit (Pass7):      +18.0
pass6_resolution_credit:        +0.0  (Pass-6 resolutions were "rejected" type, not qualifying)
outstanding_ensemble:           −1.5 × 6 = −9.0
low_confidence_residual:        −1.0 × 3 = −3.0
subject_paragraph_penalty:      −3.0 × 1 (contradicted) = −3.0
speaker_originating_unhandled:  −0.5 × 2 = −1.0
canonical_complexity:           −0.05 × 18 = −0.9

Raw total:                      100.0 + 20.0 + 18.0 + 0.0 − 9.0 − 3.0 − 3.0 − 1.0 − 0.9 = 121.1
Clamped to [0, 100]:            100.0
```

**Pass 7 v2 Score: 100.0** *(clamped from raw 121.1)*

Note: The raw score exceeds 100 because this entry has exceptionally thorough audit coverage (40+ high/correct rows, capped confidence credit, full pass depth) and a manageable penalty profile (1 contradicted Subject claim, 3 low/medium residuals, 6 D2-ambiguous flags). The clamping reflects the formula's ceiling, not an over-optimistic assessment — the outstanding ensemble flags and Subject-paragraph correction are real items that Codex must address before publication.

**Adjusted narrative score (unclamped, for comparative ranking):** 121.1 — this entry would rank among the highest-coverage entries in the corpus.

---

### Section 5 — Publication-Readiness Verdict

Entry 82 is **conditionally ready** for Smithsonian-grade publication, with one mandatory Subject-paragraph correction and six Layer-5 D2-ambiguous ensemble flags requiring resolution before final publication clearance.

This entry is the first-person testimony of Marilyn Luper Hildreth — the 8-year-old who moved the canonical motion at the August 1958 NAACP Youth Council meeting at 1819 NE Park Place that produced the OKC Katz Drug Store sit-in, approximately 18 months before the Greensboro sit-ins. She is the daughter of Clara Luper and a canonical direct participant in one of the most under-documented foundational events of the modern civil rights movement. The transcript is rich, the speaker has strong diction and precise recall, and Passes 1–4 constitute one of the most thorough audit overlays in the corpus.

**Blockers before publication clearance:**

1. **Subject-paragraph mandatory correction (S10):** The claim that the OKC Katz sit-in was "the canonical *first* successful department-store lunch-counter sit-in in US history" is factually contradicted by the civil_rights_facts.json corpus: the Wichita Dockum Drug Store sit-in (July 1958, Ron Walters) slightly predates OKC. The corrected phrasing (provided in Section 1 above) must be applied before publication. This is a Smithsonian-grade accuracy issue — publishing the "first" claim would perpetuate a historical inaccuracy visible to LoC and NMAAHC reviewers.

2. **Barbara Posey Jones institution (medium confidence):** Cross-references and any pipeline summary should use "Albany State University (probable)" rather than "University of Georgia." Adversarial-model confirmation recommended.

3. **Six outstanding Layer-5 D2-ambiguous ensemble flags** (rows 82.2, 82.3, 82.8, 82.P2.4, 82.P2.5, 82.P2.6, 82.P2.13 — some overlap): These are primarily recurring Whisper-mangling rows (subject name, MLK name, Dunjee HS, Clara Luper name) that have been corrected to high confidence but retain the D2-ambiguous tag pending formal ensemble adjudication. Given the strong canonical grounding of all corrections, these are unlikely to change — but the flags should be cleared by the ensemble sweep before Codex marks this entry publication-complete.

4. **Fish Street Baptist / Fifth Street Baptist:** Adversarial archival lookup (OKC Black church records for the Luper family congregation) should narrow the candidate from "Fifth Street (probable) / Fairview (secondary)" to a single confirmed name before publication. Low urgency relative to blockers 1–3.

**Codex action items:**
- Apply Subject-paragraph correction (S10 rewrite in Section 1 above).
- Soften Barbara Posey Jones institutional affiliation to "Albany State University (probable)" in all cross-references and pipeline summaries.
- Clear D2-ambiguous ensemble flags for the 6 rows above (all corrections are high-confidence canonical; ensemble adjudication is likely a formality).
- Optional: OKC Black church archival lookup to confirm Fifth Street Baptist as the Luper family congregation.

**Pass 7 v2 Score: 100.0 (clamped); raw 121.1 — highest-coverage-tier entry. Conditionally ready pending Subject-paragraph correction and D2-flag clearance.**
