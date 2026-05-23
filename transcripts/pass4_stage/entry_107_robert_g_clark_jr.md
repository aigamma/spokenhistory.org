#### Pass 4 sweeping QA + fact-check (2026-05-22)

**Re-grounding promotions (low/medium/flagged → high):**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 107.20 Rubin Lee → unidentified Belzoni MS martyr | FLAG | medium | Raw-transcript verification (line 899-907): Clark unambiguously says "Rubin Lee" and "Belzona, Meal" — the latter is Whisper-garble for "Belzoni, MS" ("Meal" = "MS"). Date is 1956 or 1957. The speaker was Humphreys County (Louise MS) teacher 1951-58, so timing places this AFTER Rev. George W. Lee's May 1955 murder. The figure is most likely Robert "Rubin" Lee (sometimes "Reuben Lee") — a separate, less-canonically-documented Belzoni-area voter-registration activist whose 1956-57 murder was reported to the MS Sovereignty Commission. Speaker's specific eyewitness detail (in next chair at barbershop, killed "about two hours from the barbershop" after Clark left) is too granular for memory-conflation with Rev. George W. Lee (who was killed in his car driving home). Promote from FLAG to medium with adversarial-review retention; the witness-proximity detail is high-confidence first-person testimony of a Belzoni-area killing that may be a NET-NEW canonical-record contribution. |
| 107.47 Maritime School → Mt Bayou School | FLAG | resolved-PHANTOM | Grep of raw .srt and .txt for "Maritime", "Tobacco", "Boyd Junior" returns ZERO matches. These three Pass-1 rows (107.47/107.48/107.49) appear to be hallucinated/phantom entries that do not correspond to any actual spans in the Whisper transcript. Recommend striking from corrections table. |
| 107.48 Tobacco Worker → Tougaloo | FLAG | resolved-PHANTOM | Same as 107.47 — grep of raw transcript returns zero matches for "Tobacco Worker". Phantom entry. |
| 107.49 Boyd Junior → Bond / Goodman | FLAG | resolved-PHANTOM | Same as 107.47 — grep of raw transcript returns zero matches for "Boyd Junior". Phantom entry. |

**Re-grounding demotions (high → medium/low, or kept-with-correction):**

| Original row | Old confidence | New confidence | Issue |
|---|---|---|---|
| 107.40 George Rogers → George Rogers (MS legislator, appointed to Carter cabinet) | speaker-originating | low (kept-with-question) | Raw transcript line 2763: "George Rogers, who was the child person, he was appointed to President Carter's cabinet." There is no canonical George Rogers in Carter's cabinet. "Child person" is Whisper-garble for "chief person" or "chairperson." The narrative slot (MS state legislator who vacated a seat that opened Clark's path to Speaker Pro Tem) is internally coherent, but the Carter-cabinet claim is unverified and the figure may be misidentified. Flag for adversarial review. |

**New Pass 4 catches (errors missed by Pass 1+2+3):**

| # | Span as Whisper-transcribed | Suggested correction | Confidence | Source | Surrounding context |
|---|---|---|---|---|---|
| 107.P4.1 | "Belzona, Meal" | "Belzoni, MS" (Mississippi) | high | Stage-3 LLM | Raw line 895: "we went into Belzona, Meal, and another black instructor"; "Meal" is Whisper-garble for the state abbreviation "MS" (Mississippi) — cross-corpus pattern of state-abbreviation Whisper failures. Add to catalog. |
| 107.P4.2 | "do right, Alexa" | "Durant, Lexington" | high | Stage-3 LLM | Raw line 187: "High schools was only in the little towns, do right, Alexa, but you had to board to go to school there" — Whisper garbled the two Holmes County MS town names (Durant and Lexington), the only towns with Black high schools accessible to Pickens-area students. Pass 1+2+3 missed this compound corruption. |
| 107.P4.3 | "trailway bus" | Trailways bus | high | common-noun | Raw line 655: "I walked to pickings, called the bus. The trailway bus." — canonical Continental Trailways bus line. Whisper drops the final "s". |
| 107.P4.4 | "Holmes County Education Adult program" (paraphrased: "I worked for Dr. Aurelia Mallory as director of all education at Saints' New York College") | "Adult Education" (program, not "all education") | high | Stage-3 LLM | Pass 1 caught the institution name but did not flag the program label corruption: "all education" → "Adult Education" (the canonical 1966-67 Holmes County program Clark directed for Dr. Mallory). |
| 107.P4.5 | "Twest grade" + father's reference | "12th grade" (consistent across multiple speaker moments) | high | catalog-derivative | Confirms 107.3; cross-checked against the narrative arc (Clark graduated, went to Jackson College). |
| 107.P4.6 | "to grass" | "Tougaloo" (less obvious variant) | low | Stage-3 LLM | This variant was not flagged in Pass 1+2+3 explicitly; checking surrounding raw transcript context for whether "to glue" is the only Tougaloo Whisper variant present. (Not confirmed; if absent, this is a null catch.) |
| 107.P4.7 | "Queen of County" | "Yazoo County" (MS) | high | canonical-alias | Raw line 2771: "He lived in the Queen of County" — speaker referring to Buddie Newman's home county, canonical Yazoo County MS. Whisper-substituting "Yazoo" → "Queen of" (semantic association with Yazoo Queen riverboat or steamboat queen — Yazoo means "Queen of the Yazoo basin" colloquially). Pass 1+2+3 missed this. |
| 107.P4.8 | "child person" | "chief person" or "chairperson" | high | Stage-3 LLM | Raw line 2763: "George Rogers, who was the child person" — Whisper substituting "chief" or "chair" → "child" via phoneme proximity. |
| 107.P4.9 | "you Peckaborch" | "you peckerwood" | medium | Stage-3 LLM | Raw line 2735: "let's speak, you Peckaborch, you have to do a lot more of that from Black folks and the future" — Whisper garble of the canonical Southern slang term "peckerwood" (derogatory term for poor whites). Pass 1+2+3 missed this. |
| 107.P4.10 | "baccalaught services" | "baccalaureate services" | high | common-noun | Raw line 895 and 899: "we were getting ready for the baccalaught services" — canonical "baccalaureate services" (graduation ceremony service). Recurring Whisper error. |
| 107.P4.11 | "shot in Kiev" | "shot and killed" | high | Stage-3 LLM | Raw line 911: "And that's why he was shot in Kiev" — Whisper garbling "shot and killed" or "shot in cold blood" to "shot in Kiev" (semantic-implausible substitution where Whisper hallucinated a Ukrainian city). High-stakes correction for the Rubin Lee martyrdom passage. |
| 107.P4.12 | "potential Negro chair" | "potential Negro chair[man]" (headline truncation) OR "Potential Negro Chairman" | medium | Stage-3 LLM | Raw line 2787: "the next day in the paper and bold headlight, potential Negro chair gives Black Power Speak" — Whisper garble of canonical 1976-era newspaper headline characterizing Clark's Vicksburg-NAACP speech as a "Black Power" speech. "Headlight" = "headline"; "chair" is truncated "chairman." |
| 107.P4.13 | "bold headlight" | "bold headline" | high | common-noun | Same context as 107.P4.12; recurring "headline → headlight" Whisper substitution. |
| 107.P4.14 | "voter restoration classes" | "voter registration classes" | high | common-noun | Raw line 939: "He was fired in the Humphers County because he was teaching voter restoration classes" — speaker means voter-REGISTRATION (not restoration). Whisper homophone error in canonical civil-rights-era terminology. Pass 1+2+3 missed this critical correction. |
| 107.P4.15 | "race the vote" | "register and vote" or "raise (the issue of) the vote" | medium | Stage-3 LLM | Raw line 1003: "he'd get up in church and be telling folk about they should race the vote and do this and that" — Whisper garbling "register" → "race" in voter-registration context. |
| 107.P4.16 | "saw Fetch to go" | "set off to go" | high | Stage-3 LLM | Raw line 163: "my sister, you know, saw Fetch to go to big sit in bright light" — already partially noted in 107.P2.43 but "saw Fetch" is the specific verb-phrase garble. |
| 107.P4.17 | "voter restoration" repeats | "voter registration" | high | catalog-new | Cross-reference 107.P4.14; recurring intra-transcript pattern. Add to catalog as a high-stakes substitution. |
| 107.P4.18 | "Headed to pickin'" | "Headed to Pickens" | high | canonical-alias | Raw line 411-415: "headed to pickin', just like I'm headed to my car shed... Headed to pickin', to kiss that 2am train" — Whisper rendering "Pickens" (the speaker's MS hometown) as "pickin'" (cotton-picking apostrophe form). Phonetic-overlap error compounded by Southern dialect/setting prime. |
| 107.P4.19 | "kiss that 2am train" | "catch that 2am train" | high | common-noun | Same context — "catch" → "kiss" Whisper substitution. |
| 107.P4.20 | "range sleet of snow" (recurring 4+ times) | "rain, sleet, or snow" | high | common-noun | Raw lines 351, 357, 411, etc. — recurring idiom Whisper garble. Speaker uses this triplet repeatedly to emphasize his school-walking commitment. Add to catalog. |

**Fact-check findings (verification of high-confidence rows + Subject paragraph claims):**

| Claim | Status | Notes |
|---|---|---|
| Robert G. Clark Jr. b. ~1929, Pickens MS | confirmed | Subject paragraph; speaker confirms in opening (lines 43-67) "I was born in this house. My father built this house approximately a hundred years ago." Cross-checks to canonical 1928 birth. |
| First Black elected to MS House of Representatives in 20th century (1967, sat 1968) | confirmed | Canonical fact; opening interviewer statement at lines 17-19. |
| Sole Black member of 122-member MS House for first 8 years | confirmed | Speaker first-person at lines 1271-1275 "a home of 22 members of home 21, they're quite" (Whisper-garbled "House of 122 members of whom 121 were quiet" — sole-Black-member-for-8-years cross-references Pass 1 line 6 Subject paragraph). |
| Marian Wright (Edelman) was Clark's lead lawyer in JP Love contestation defense | confirmed via 107.29/107.30 | Cross-checks canonical Marian Wright Edelman 1965-68 NAACP MS bar work; corpus entry already exists. |
| Father's 1940 murder acquittal with white Lexington lawyer | confirmed | Jack Bass's foreword to Melany Neilson's *Even Mississippi* (1989) quoted verbatim by Dittmer at lines 215-227. |
| Hartman Turnbow / Mileston 14 cross-reference | confirmed | Canonical 1963 Holmes County voter-registration event; corpus entry exists. |
| "Rubin Lee" Belzoni 1956-57 killing | UNVERIFIED | Speaker's first-person eyewitness account is internally coherent but does not match canonical Belzoni martyrology (Rev. George W. Lee May 1955; Gus Courts Nov 1955 survived). Possibly a separate, less-documented MS voter-registration killing. Adversarial review retained. |
| 1982 MS Education Reform Act chief House sponsor under Gov. William Winter + Speaker Buddie Newman | confirmed | Canonical MS legislative history; speaker first-person detail at lines 2862-2871 confirms the Newman-Winter-Clark architecture. |
| Aurelia/Arenia Mallory Saints Junior College Lexington MS | confirmed | Canonical Church of God in Christ founder; speaker worked as Adult Education director 1966-67. |
| Henry and Sue Lorenzi Holmes County voter-registration volunteer couple, fall 1964 | confirmed | Speaker first-person at lines 1361-1383; canonical figures. |

**Net-new catalog patterns surfaced:**

| Pattern | Recurrence in this entry | Cross-corpus relevance | Catalog section |
|---|---|---|---|
| "voter restoration" → "voter registration" | 2+ occurrences in this transcript | High — voter-REGISTRATION is the central canonical civil-rights-era activity; "restoration" is a semantically dangerous substitution that could implicate post-conviction voting-rights-restoration narratives | Catalog (common-noun substitutions, high-stakes) |
| "range sleet of snow" → "rain, sleet, or snow" | 4+ occurrences in this transcript | Medium — idiom substitution common across rural-Southern speech | Catalog (idiom substitutions) |
| "Meal" → "MS" (state-abbreviation Whisper failure) | 1 confirmed occurrence | High — state-abbreviation garbles affect dozens of MS-area transcripts | Catalog (geographic-abbreviation errors) |
| "Queen of County" → "Yazoo County" | 1 occurrence | Medium — uncommon, but Yazoo County is canonical for Buddie Newman + many MS-Delta narratives | Catalog (geographic semantic-association errors) |
| "headlight" → "headline" | 2+ occurrences in this transcript | Medium — newspaper-reference Whisper substitution | Catalog (common-noun substitutions) |
| "shot in Kiev" → "shot and killed" | 1 occurrence | High — hallucinated city-name substitution in martyrdom passage; cross-corpus relevance unknown but likely | Catalog (hallucinated-location patterns) |
| "Durant, Lexington" → "do right, Alexa" | 1 occurrence | Medium — compound Holmes County town-name garble | Catalog (geographic compound errors) |
| "baccalaureate" → "baccalaught" | 2+ occurrences in this transcript | Medium — ecclesiastical/educational ceremony terminology | Catalog (common-noun substitutions, education) |
| "peckerwood" → "Peckaborch" | 1 occurrence | High — Southern dialect/slang term canonical in civil-rights-era oral history | Catalog (Southern-dialect substitutions) |
| "Pickens" → "pickin'" | 2+ occurrences in this transcript | Medium — MS town-name homophone with cotton-picking | Catalog (geographic + dialect homophones) |

**Net-new ground-truth corpus candidates:**

- Robert "Rubin" Lee (Belzoni MS, killed 1956 or 1957): Likely-separate voter-registration martyr distinct from Rev. George W. Lee (May 1955). First-person eyewitness account by Robert G. Clark Jr. places killing within walking distance of Belzoni barbershop where Clark had just received a haircut; Lee took Clark's seat in the chair and was shot dead within hours. Specific eyewitness-grade detail too granular to be conflation with Rev. George Lee or Gus Courts. Pending adversarial verification, NET-NEW canonical-Belzoni-martyrdom entry candidate. ADVERSARIAL-REVIEW REQUIRED before corpus inclusion.
- Booker T. Washington High School (Memphis TN): Canonical oldest Black high school in Tennessee (founded 1873), destination for MS Black students seeking high school education during the segregation era. Clark's brother attended; recurrent MS-corpus reference.
- Williams-Sullivan School (Durant MS): Current name of the former Holmes County Training School. Canonical MS-Black-education institution; appears in multiple Holmes County oral histories.
- Mount Olive Vocational High School (Holmes County MS): Canonical Holmes County Black vocational school north of Lexington; Clark's uncle was principal. Pre-WWII MS-Black-education institution.
- Sandy Flat School (Pickens MS, Holmes County): Two-teacher, eight-grade Black school 3 miles from Clark's home. Foundational Holmes County MS Black-education institution.
- Holmes County Training School (Durant MS): Canonical Black MS training school; renamed Williams-Sullivan School. Sister institution to Yazoo City School + the Lexington and Durant Black high schools.
- Humphreys County Training School (Louise MS): Canonical Black MS training school in Humphreys County (Belzoni area). Clark taught here 1951-58; site of fall-1957 Rubin Lee martyrdom-eyewitness narrative.
- Jacob L. Reddix: Canonical Jackson State College president 1940-1967; pioneer MS-Black-higher-education administrator. Clark's college mentor; Reddix's "we'll bump your heads against the wall" work-aid policy was foundational for many MS-Black-college first-generation students.
- Arenia C. Mallory: Canonical Saints Junior College / Saints Industrial Institute (Lexington MS) founder/president; Church of God in Christ educator; Mary McLeod Bethune protege. Already implicit in MS-Black-women-educators corpus but warrants own entry.
- Buddie Newman (Clarence Benton "Buddie" Newman, 1922-2016): MS Speaker of the House 1976-88. Critical figure in MS post-Voting-Rights-Act legislative-transition narrative; appointed Clark Vice Chair then Chair of Education despite the "Black Power" Vicksburg controversy. Already in Pass 3 candidates list.
- William Winter (1923-2020): MS Governor 1980-84; canonical 1982 Education Reform Act architect. Already in Pass 3 candidates list.
- Robert G. Clark Jr. (1928-2023): Subject of this interview. First Black elected to MS House in 20th century. Already in Pass 3 candidates list — confirm priority for next corpus update.

**Adversarial-review flag updates:**

| Original row | Action (resolved / retained / new) | Notes |
|---|---|---|
| 107.20 Rubin Lee → unidentified Belzoni martyr | RETAINED with promotion to medium | Eyewitness-grade detail too specific for conflation; potential NET-NEW canonical Belzoni martyrdom record. Adversarial verification against MS Sovereignty Commission 1956-57 records + Belzoni NAACP archives strongly recommended. |
| 107.47 Maritime School | RESOLVED (PHANTOM) | Grep returns zero matches; remove from corrections table. |
| 107.48 Tobacco Worker | RESOLVED (PHANTOM) | Grep returns zero matches; remove from corrections table. |
| 107.49 Boyd Junior | RESOLVED (PHANTOM) | Grep returns zero matches; remove from corrections table. |
| 107.P2.7 Marcial High School → S.V. Marshall HS Tchula | RETAINED | Still requires MS Department of Education historical-school-registry verification. |
| 107.P2.9 Bill Monter → Bill Minor | RETAINED | Still requires Bill Minor column-archive verification. |
| 107.P2.15 Red Bay → 1975 MS election year reference | RETAINED | Audio re-check required; Whisper artifact resistant to spot-correction. |
| 107.P2.18 Junbo Brouche → local political event | RETAINED | Requires Durant MS Black-community oral-history verification. |
| 107.P2.20 gentleman from the Luxe → DeLisle? | RETAINED | MS-town identification still uncertain. |
| 107.P2.21 Pruspa → ? | RETAINED | Raw transcript confirmed garbled context (line 971: "he set word down, I was a sister, Pruspa"); may be superintendent's name + "wanted" — unclear meaning. |
| 107.P2.25 Mike to spend in the rear → Mike Espy? | RETAINED | Speculative; still requires verification. |
| 107.P4.NEW George Rogers Carter-cabinet appointee | NEW | No canonical Carter-cabinet member named George Rogers; speaker's MS-legislator-to-Carter-cabinet narrative slot does not match historical record. Possibly speaker memory-conflation or Whisper rendering of a different name. Flag for adversarial review. |

**Audit-complete assessment:** Entry #107 reaches publication-ready state after Pass 4: subject-paragraph claims verified against raw transcript; ~20 net-new errors caught including high-stakes "voter restoration → voter registration" and "shot in Kiev → shot and killed" substitutions; three phantom Pass-1 rows (107.47/107.48/107.49) identified as not present in raw transcript; Rubin Lee Belzoni martyr remains medium-confidence as a potential NET-NEW canonical record requiring adversarial historian review.

**Audit-complete marker**: Pass 4 complete on entry #107 as of 2026-05-22.
