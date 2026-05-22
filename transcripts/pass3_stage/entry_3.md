#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 3.10 Reverend Billips -> Reverend Charles Billups | medium | high | Rev. Charles Billups was a documented Birmingham civil rights minister who co-organized with Fred Shuttlesworth in the ACMHR (Alabama Christian Movement for Human Rights). Biographical fit + phonetic match = HIGH. |
| 3.12 Candice Grindes (Abernathy's niece per speaker) | speaker-originating + low | speaker-originating | Pass 1 itself flagged "possibly real, unverifiable; flag as speaker-originating." Resolve as single-category speaker-originating. |
| 3.21 Karl Braaton -> Carl Braden | medium | high | Carl Braden + Anne Braden were canonical Louisville KY white SCEF (Southern Conference Educational Fund) editors and SNCC allies. Pass 2 row 3.P2.5 already confirms canonical figures. HIGH. |
| 3.25 Bill Hanson -> Bill Hansen | medium | high | William W. Hansen was a documented Arkansas SNCC organizer. Spelling variant Hanson/Hansen is a clean Whisper one-character error. HIGH. |
| 3.28 inspiration -> refreshments | medium | FLAGGED-FOR-ADVERSARIAL-REVIEW | Pass 1 hypothesis "refreshment" is contextually plausible (thirsty travelers at a bus station) but the Whisper rendering "inspiration" doesn't phonetically map cleanly to "refreshments." Could also be "respiration" (less likely) or speaker's actual figurative usage. Flag. |
| 3.43 Ola Mallory | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Pass 1 notes "could be Arenia Mallory (same name appears in Amos Brown transcript) but context here is SNCC, not COGIC." Arenia Mallory ran Saints Industrial in Lexington MS (COGIC school) - context mismatch is real. Flag for adversarial review of whether SNCC had a distinct "Ola Mallory" organizer or if speaker is conflating. |
| 3.44 Reverend Fyfe -> Reverend J.L. Phifer | medium | high | Rev. J.L. Phifer was a documented Birmingham minister allied with Shuttlesworth in the ACMHR; speaker's list of Birmingham-minister allies (Shuttlesworth, Billups, Oliver, Phifer) maps to the documented ACMHR core. Biographical fit + phonetic = HIGH. |
| 3.49 Reverend Bale | speaker-originating | speaker-originating | Maintained. Mt. Zion Baptist Church (Jackson MS) had multiple pastors; speaker's rendering "Bale" is unrecoverable without external corroboration. Correct categorization. |
| 3.51 Chico Neblet -> Chico Neblett | high | high | Pass 2 row 3.P2.17 expanded to "Charles 'Chico' Neblett" (full canonical name); SNCC Freedom Singer + Lowndes County organizer. HIGH preserved. |
| 3.56 Miss Boynton -> Amelia Boynton | high | high | Amelia Boynton Robinson - canonical Selma voting rights leader, beaten unconscious on Bloody Sunday. Documented historical figure. HIGH preserved. |
| 3.67 St. Clair, Jetta / St. Clair -> St. Clair Booker | speaker-originating + low | speaker-originating | Pass 1's hypothesis "St. Clair Booker, a SNCC organizer in Hale County" is plausible but unverifiable in canonical sources without additional context. Resolve to speaker-originating. |
| 3.70 Len Holder -> Len Holt | medium | high | Pass 2 row 3.P2.23 promoted to HIGH: Len Holt (canonical NLG attorney representing SNCC clients across the South; author of "The Summer That Didn't End" about Freedom Summer). Biographical fit + phonetic = HIGH. |
| 3.71 Capgrave | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Pass 1 + Pass 2 both note "context too thin"; Pass 2 row 3.P2.26 flagged "likely Stokely Carmichael / SCEF organizer." Cannot be resolved from transcript. Flag. |
| 3.78 Deva Irvin | speaker-originating + low | speaker-originating | Grambling College advisor; unverifiable in canonical sources. Single-category speaker-originating. |
| 3.80 Gladys Bates -> Gladys Noel Bates | medium | high | Gladys Noel Bates was the canonical Jackson MS teacher whose 1948 equal-pay lawsuit (Bates v. Batte) was a pre-Brown legal precedent for teacher pay equity. Documented historical figure. HIGH. |
| 3.81 Mr. Norris | speaker-originating | speaker-originating | Maintained. "Champion" father figure; unverifiable. Correct categorization. |
| 3.83 LC Wilcher | speaker-originating | speaker-originating | Letter carrier + civil rights worker; unverifiable. Correct. |
| 3.84 Hassan | speaker-originating + low | speaker-originating | Family/friend; unverifiable. Single-category. |
| 3.86 Kofi, Vagabee | low | duplicate-flag-of-2.68 | This is a cross-entry reference to Amos Brown's transcript (entry #2), not Avery's. The cross-reference is correctly noted in Pass 1; no Pass-3 action beyond confirming the indexing tag. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 3.28 | "inspiration" -> "refreshments" | Whisper rendering doesn't phonetically map cleanly to "refreshments"; could be other context. |
| 3.43 | Ola Mallory (SNCC member?) | Context-mismatch between speaker's SNCC narrative and the only canonical Mallory (Arenia Mallory, COGIC). |
| 3.71 | Capgrave | Pass 1+2 both note context too thin to resolve. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Fred Shuttlesworth: Founder of ACMHR (Alabama Christian Movement for Human Rights); SCLC co-founder; canonical Birmingham movement leader; survived multiple Klan assassination attempts. NOT in corpus despite being canonical (cf. catalog row catalog row I "figures to add" already lists multiple recovered figures).
- Amelia Boynton Robinson: Selma voting rights leader; beaten unconscious on Bloody Sunday at the Edmund Pettus Bridge; documented and photographed casualty of March 7, 1965. NOT in corpus.
- Hosea Williams: SCLC field director who co-led Bloody Sunday march with John Lewis; canonical SCLC figure. Catalog row C lists "Jose Williams -> Hosea Williams" as recurring pattern at entries #3, #29. NOT in corpus.
- Wyatt Tee Walker: SCLC Executive Director 1960-64; "Project C" Birmingham campaign architect; later 1967-2004 Canaan Baptist Church Harlem pastor; covered extensively in the progress-tracker notes for #132. NOT in corpus.
- Jimmie Lee Jackson: Civil rights activist killed by Alabama state trooper James Bonard Fowler on February 18, 1965 in Marion AL (died Feb 26); his murder was the catalyst for the Selma-to-Montgomery march. Canonical figure. NOT in corpus.
- Bob Mants (Robert Mants): SNCC field secretary; canonical Lowndes County / Black Belt AL organizer; co-founder of the Lowndes County Freedom Organization (LCFO, original "black panther" emblem). NOT in corpus.
- Prathia Hall (Rev. Prathia Hall Wynn): SNCC SW Georgia organizer; AME theologian; whose prayer phrase "I have a dream" influenced King's August 1963 speech (documented). NOT in corpus.
- Bernice Johnson Reagon: SNCC Freedom Singers founder; Sweet Honey in the Rock founder; Smithsonian curator. NOT in corpus.
- Charles Sherrod: SNCC Southwest Georgia / Albany Movement project director; founded New Communities Inc. cooperative farm with wife Shirley Sherrod. NOT in corpus.
- Nicholas Katzenbach: US Attorney General 1965-66; canonical Justice Department official during Selma + Voting Rights Act passage. NOT in corpus.
- Ralph Abernathy: ALREADY IN CORPUS. Confirmed.
- Mack Charles Parker: 1959 Mississippi lynching victim (kidnapped from Poplarville MS jail and murdered before trial). Canonical lynching that foreshadowed Movement-era violence; NOT in corpus.
- Autherine Lucy: First Black student admitted to University of Alabama (1956); expelled three days later after riots; canonical pre-1960s integration pioneer. NOT in corpus.
- Lafayette Surney: SNCC Clarksdale MS field organizer; canonical Freedom Summer figure. NOT in corpus.
- Madeleine Sherwood: Canadian actress (Cat on a Hot Tin Roof, Sweet Bird of Youth); arrested with Avery on the William Moore March; one of the few celebrity participants. NOT in corpus.
- Carsie Hall: Jackson MS civil rights attorney. NOT in corpus (cross-corpus with #2 Brown).
- Gladys Noel Bates: 1948 Bates v. Batte equal-pay litigant; pre-Brown teacher pay equity precedent. NOT in corpus.
- Rev. William A. Bender: Tougaloo College chaplain; MS NAACP president. NOT in corpus (cross-corpus with #2 Brown).
- R.L.T. Smith: 1962 MS 3rd Congressional District candidate. NOT in corpus (cross-corpus with #2 Brown).
- Len Holt: NLG attorney for SNCC; author of "The Summer That Didn't End". NOT in corpus.
- Ruby Doris Smith Robinson: SNCC Executive Secretary 1966-67; died October 1967 at age 25. Catalog row C lists "Rubidorus Robinson -> Ruby Doris Smith Robinson" recurring at entries #32, #44. NOT in corpus.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 3.P3.1 | "Bridge Crossing Jubilee" (Pass 2 row 3.P2.25) | Bridge Crossing Jubilee | high | canonical-alias | Pass 2 row 3.P2.25 captures the canonical annual Selma commemorative event - confirming this as a properly-resolved canonical-alias item. No further catch; documentation confirmation. |
| 3.P3.2 | "Wetumpka State Prison for Women" vs "Julia Tutwiler Prison" | Julia Tutwiler Prison (canonical name) | high | canonical | Pass 1 row 3.31 used "Julia Tutwiler Prison" name; Pass 2 row 3.P2.9 used "Wetumpka State Prison." Both refer to the same facility - Wetumpka is the location, "Julia Tutwiler Prison for Women" is the formal name. Recommend unifying to "Julia Tutwiler Prison for Women (Wetumpka AL)" for canonical consistency. |
| 3.P3.3 | Tougaloo College spelling consistency | Tougaloo College | high | canonical | Pass 1 row 3.76 corrected "Tugaloo" -> "Tougaloo." Catalog row F has "Tuvalu / Tugaloo / Tugulu / Tuwu / Tugel / two-below / Two-Wheeled -> Tougaloo / Tougaloo College" as a "very high" frequency pattern. Confirming Pass 1's correction. |
| 3.P3.4 | "the chains were in Goodman" (Pass 1 row 3.68) | Chaney, Schwerner, and Goodman | high | canonical | Catalog row C lists "swan, swan, swan, and chaining -> Schwerner, Chaney (Freedom Summer victims)" as a "medium (damaging)" pattern at entries #41, #44; "James Cheney -> James Chaney" pattern at entries #41. This transcript's Whisper failure on the trio extends the corpus catalog from entries #41, #44 to also include #3. Catalog should be updated to add #3 to the example-entries list. |

**Audit-complete marker**: Pass 3 complete on entry #3 as of 2026-05-22. Ready for adversarial-model review.
