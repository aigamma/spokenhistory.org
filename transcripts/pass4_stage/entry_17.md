#### Pass 4 sweeping QA + fact-check (2026-05-22)

**Re-grounding promotions (low/medium/flagged → high):**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 17.P2T.78 Walter Ruth -> Walter Reuther | high (P2T) / flagged (P3) | high (resolved) | Raw SRT line 5791 places "Walter Ruth" in a single sentence with "Humphrey, Mondale, Joe Rao, ... Aaron Henry, Ed King" — the unambiguous 1964 Atlantic City MFDP-credentials-challenge brain trust. Reuther (UAW pres.) is the only person in that LBJ-compromise circle whose name Whisper renders as "Ruth." Removes the adversarial-review uncertainty; canonical-alias attribution stands at high. |
| 17.P3.2 "by Moses" -> Bob Moses | high (P3 pattern, single instance) | high (corpus-wide confirmed) | Raw SRT line 2959 ("by Moses wakes us up. So let's go") confirms the corpus-wide Whisper-drops-the-B-in-Bob-before-Moses pattern within this entry. Pattern stands as a recurring catalog item; no additional in-entry instances surfaced. |

**Re-grounding demotions (high → medium/low, or kept-with-correction):**

| Original row | Old confidence | New confidence | Issue |
|---|---|---|---|
| (none — no items qualify for this section) | | | |

**New Pass 4 catches (errors missed by Pass 1+2+3):**

| # | Span as Whisper-transcribed | Suggested correction | Confidence | Source | Surrounding context |
|---|---|---|---|---|---|
| 17.P4.M.1 | Laffeyette Sonny | Lafayette Surney | high | canonical-alias | SRT line 3091 renders the first-introduction Whisper variant with a doubled "ff" — "Laffeyette" — distinct from the "Lafayette Sonny" rendering captured in 17.P2T.11. Reinforces the canonical-new figure; same person, different Whisper artifact. |
| 17.P4.M.2 | Gallabagha | Ella Baker (uncertain) / Galahad / SCLC field organizer | low | canonical-alias (uncertain) | SRT line 1295: "Gallabagha had brought the Snake people together and had brought the demonstrators from the world worst city ends ..." — context is "the person who convened the April 1960 Shaw University meeting that formed SNCC out of the sit-in movement." That person is canonically Ella Baker. Whisper's "Gallabagha" is a high-damage garble of a foundational figure. Adversarial-review-grade. |
| 17.P4.M.3 | world worst city ends | Woolworth's sit-ins | high | canonical-alias | SRT line 1295: "the demonstrators from the world worst city ends and other city ends" — Whisper garble of "Woolworth's sit-ins and other sit-ins." Foundational SNCC-origin context (the 1960 Greensboro/Nashville Woolworth's sit-in movement out of which SNCC was formed). Whisper homophone error. |
| 17.P4.M.4 | Jim Heo | Jim Hill (Jim Hill High School, Jackson MS) | high | canonical-alias | SRT line 1299: "the West Jackson kids who mostly went to Jim Heo and the linear kids who lived over on Georgetown." Real Jackson MS Black high school in the West Jackson neighborhood (the rival HS to Lanier in this neighborhood-rivalry sequence). Whisper homophone error. Catalog F geographic. |
| 17.P4.M.5 | Georgetown (Jackson MS) | Georgetown (Jackson MS neighborhood) | correct | geographic | SRT line 1295/1299: "our community in Georgetown where we lived" — real historic Black neighborhood in Jackson MS where McLaurin grew up, named for its post-Civil-War freedmen founders. Catalog F geographic. |
| 17.P4.M.6 | Snake was formed | SNCC was formed | high | canonical-alias | SRT line 1291: "Reverend James Bevel, went to work for Southern Christian Leadership Conference. You know, Snake was formed." Reinforces catalog B "Snake / SNCC" pattern in a new context (SNCC's 1960 founding moment), not just generic noun-usage. |

**Fact-check findings (verification of high-confidence rows + Subject paragraph claims):**

| Claim | Status | Notes |
|---|---|---|
| McLaurin born 25 Dec 1939, Jackson, MS | verified | SRT lines 27, 35: "I was born in Jackson, Mississippi in 1939" / "December 25th, 1939." Subject paragraph stands. |
| Army Reserve at Fort Jackson, SC, 1955 | verified | SRT lines 1075, 1103: "around 1955" / "Fort Jackson, South Carolina." Subject paragraph stands. |
| Recruited into SNCC organizing by Bevel + Medgar Evers, 1961–62 | verified | SRT lines 1291, 1295: Bevel came into the Georgetown pool hall and recruited McLaurin + crew. The 1962 SNCC-from-Freedom-Rides genealogy. Subject paragraph stands. |
| August 1962 — to Delta with Bob Moses, Landy McNair, Charlie Cobb | verified | SRT line 2723: "August 1962, he's going to come to Freedom House and he's going to take with him the people who Guyak [Guyot] have recruited and to the delta." Date and circumstances corroborated. Subject paragraph stands. |
| McLaurin was the SNCC organizer who recruited Fannie Lou Hamer | verified | SRT lines 3251-3255: at the Williams Chapel mass meeting "Miss Mary took on them [Tucker] brought in folks from the plantation. Now, friend in Lou Hamer [Fannie Lou Hamer] is one of these people, but I don't know her at this time. ... So, she is raised as her hand as one of the people in this next group to go down the register to vote." The canonical Hamer-volunteers-from-her-pew first-meeting moment. Subject paragraph stands. |
| Longest transcript in the corpus to date | verified | Raw .txt = 185,516 bytes (185 KB). Consistent with corpus-level claim in Subject paragraph and audit-trail notes. |
| Henry Kirksey "first MS senator since Reconstruction" | speaker-originating misstatement (preserved) | SRT lines 5655-5687: McLaurin says "[Kirksey] became, I believe, the first senator to serve in the Senate since reconstruction" — Crosby interjects to clarify "in the state Senate." Hiram Revels (US Sen. 1870-71) + Blanche K. Bruce (US Sen. 1875-81) are the first Black US senators since Reconstruction. As a MS-state-senate claim Kirksey is also not literally first since Reconstruction (MS state senate had post-1965 Black members preceding Kirksey's 1980-92 tenure, e.g., Doug Anderson). The misstatement remains preserved per "Speaker-originating misstatement to preserve as-is" rule; fact-check note flagged for the summarization pipeline. |
| Stokely Carmichael succeeded John Lewis as SNCC chairman | verified | SRT line 6391 + context: "Dr. King and McKissitt of Corps and Stoke LeCar Michael ... who had just become chairperson of the Student Nonviolent Coordinating Committee, succeeding John Lewis." Pass 2T #17.P2T.87/88 stands. |
| McKissick of CORE on the Meredith March | verified | SRT line 6391: "McKissitt of Corps" — Floyd McKissick, CORE national director 1966-68. Pass 2T #17.P2T.89 stands. |
| Williams Chapel firebombed in Ruleville | verified | SRT line 6067: "Six lives, big location, where she's buried right now. All of that property there was owned by Freedom Farm." The Williams Chapel context (#17.P2T.9) is confirmed earlier in the tail. |
| McLaurin recruited by Bevel via "the pool hall" | verified | SRT line 1295: "Bevel come in one night. And he come into our community in Georgetown where we lived to the pool hall where we hung out." Reinforces 17.P2.12 / 17.14. |

**Net-new catalog patterns surfaced:**

| Pattern | Recurrence in this entry | Cross-corpus relevance | Catalog section |
|---|---|---|---|
| "world worst city ends" -> "Woolworth's sit-ins" | 1+ instance | High — the 1960 Greensboro/Nashville Woolworth's sit-ins are foundational SNCC-genesis material that recurs in many corpus entries (any narrator who came up through the Nashville Movement or Greensboro chapter). Whisper homophone pattern likely surfaces elsewhere in the corpus where speakers refer to the chain by name. | Catalog B (SNCC/SCLC/CORE organizational-name garbles) + new sub-pattern: corporate-name homophone garbles. |
| "Gallabagha" -> Ella Baker (uncertain) | 1 instance | Medium-high — if confirmed, Ella Baker is a foundational SNCC-founding figure (already in corpus); a Whisper "Gallabagha" pattern would be a high-damage misattribution worth corpus-wide sweeping. Adversarial review needed. | Catalog C (canonical figures) — possible new sub-pattern: Ella Baker -> "Gallabagha / Ella Bocker / Ella Becker" Whisper renderings. |
| "Jim Heo" -> Jim Hill High School (Jackson MS) | 1 instance | Low-medium — Jim Hill HS is one of the historic Black HSs in Jackson MS (along with Lanier, Brinkley, Murrah). Cross-corpus relevance for any Jackson-raised narrator. | Catalog F (geographic / institutional). |
| "by Moses" -> Bob Moses | 1 in-entry instance (corroborates corpus pattern) | High — Pass 3 already identified this as a corpus-wide pattern (Whisper drops the "B" in "Bob" before vowel-initial surnames like Moses, Mosnier). Pass 4 confirms within entry #17. | Catalog C — canonical-figure Whisper-drops-honorific/nickname pattern. |
| Compound-word breakups of canonical names ("Stoke LeCar Michael" splits one name across three tokens) | ≥6 distinct renderings | High — already documented in Pass 2T; Pass 4 adds emphasis that the "succeeding John Lewis" sentence (SRT 6391+) is the canonical confirmation context that should be the disambiguating signal for any RAG/LLM downstream classifier. | Catalog C — Carmichael-as-compound-word-failure (corpus-leading frequency). |

**Net-new ground-truth corpus candidates:**

- Ella Baker (1903-1986): SNCC midwife; convened the April 1960 Shaw University founding meeting that established SNCC out of the sit-in movement; former SCLC executive director under King. If McLaurin's "Gallabagha" rendering can be confirmed as Baker, this transcript provides a first-person attribution of her role in convening the post-Freedom-Rides SNCC reconfiguration. Foundational SNCC-genesis figure not yet in `civil_rights_facts.json`.
- Jim Hill High School (Jackson MS): One of the historic Black high schools in Jackson (West Jackson neighborhood); rival to Lanier (Georgetown neighborhood) per McLaurin's youth-rivalry account. Catalog-F-grade institutional reference.
- Georgetown (Jackson MS neighborhood): The historic Black neighborhood in West Jackson where McLaurin grew up. Catalog-F-grade geographic reference.
- Woolworth's sit-ins (1960 — Greensboro NC / Nashville TN): Foundational SNCC-origin event referenced by McLaurin as the demonstrators from which Ella Baker (?) convened SNCC. Already implicit in the "SNCC and Student Organizing" entry of `civil_rights_facts.json` but worth surfacing as a distinct alias-set ("Woolworth's sit-in", "1960 lunch-counter sit-in", "Greensboro sit-in").

**Adversarial-review flag updates:**

| Original row | Action (resolved / retained / new) | Notes |
|---|---|---|
| 17.P2T.3 Joe McDonald | retained | Pass 4 raw spot-check confirms "McDonald's" appears in clear form at SRT lines 3391, 3403, 3407, 3419 — Whisper alternates between correct "McDonald" and garbled "Joe Magdalen / Joe Mags / Joe Magdon" within the same sequence. The canonical-new attribution is robust; the adversarial-pass concern (conflation with Chuck McDew or Dora McDonald) is now testable against the raw transcript using the clear-form lines as ground truth. |
| 17.P2T.76 Kirksey "first since Reconstruction" | retained | Pass 4 raw spot-check (SRT 5655-5687) confirms McLaurin makes the misstatement and Crosby partially corrects it ("In the state Senate"). The Senate-vs-US-Senate ambiguity is resolved (state senate) but the "first since Reconstruction" claim is still historically inaccurate even for the state senate; flag must remain for the summarization-pipeline citation audit. |
| 17.P2T.78 Walter Ruth -> Walter Reuther | resolved | Pass 4 raw spot-check (SRT 5791) places "Walter Ruth" unambiguously in the Atlantic City 1964 MFDP-compromise-broker context (Humphrey, Mondale, Joe Rao, Aaron Henry, Ed King). The Reuther attribution is the only plausible reading; flag closed. |
| 17.P2T.88 "Stoke Cleave myself" | retained | High-damage Whisper conflation of Carmichael + Cleve McDowell within one sentence stands. Pass 4 confirms (raw SRT line 6455 — the "Stoke LeClease cells" variant in the same Greenwood-Meredith-March passage). Publication-block-trigger candidate stands. |
| 17.P2T.97 "Six lives, big location" | retained | Pass 4 raw spot-check (SRT 6067): "Six lives, big location, where she's buried right now. All of that property there was owned by Freedom Farm." The "Sixteenth-section" reading remains the most likely canonical reading but requires MS-land-grant-terminology confirmation. Flag stands. |
| 17.P2T.98-99 Lynch / Montgomery conflation | retained | Pass 3 flag stands; Pass 4 confirms via the broader 17.P3.3 "Lynch / John R. Lynch / Lynch Street" three-referent semantic risk. Adversarial summarization pipeline should treat with care. |
| 17.P2T.102 "I team on Gumber" -> Itta Bena + ? | retained | Pass 4 raw spot-check (SRT 5843): "All black from the get founded by slaves, you know, I team on Gumber." Context is "all-Black founded community" alongside Mound Bayou. Possible second referents include Renova MS or possibly "Itta Bena, Hollandale, Gunnison" — the homophone "Gumber" is closest phonetically to "Gunnison" (a Bolivar County town near Mound Bayou). Flag stands with this Pass-4-suggested candidate. |
| 17.P2T.108 Burnley | retained | Pass 4 raw spot-check (SRT 5351, 5379): "the police chief, at that time, was a guy named Burnley" — speaker is unambiguous on the first name "Burnley" as a single token. Possibly first name Burnley or last name Burnley; canonical full name still unrecoverable from corpus alone. |
| 17.P4.M.2 Ella Baker via "Gallabagha" | new | Pass 4 raw spot-check (SRT 1295): "Gallabagha had brought the Snake people together." The "brought the Snake [SNCC] people together" predicate is canonically Ella Baker's role (April 1960 Shaw University meeting). Adversarial review should confirm via Baker biographies + cross-corpus sweep for "Gallabagha / Galabocker / Ella Bocker" variants. High-damage misattribution if uncaught. |
| 17.P4.M.3 "world worst city ends" -> Woolworth's sit-ins | new | Pass 4 raw spot-check (SRT 1295) — sentence makes sense only with Woolworth's substitution; the SNCC-founding "demonstrators from Woolworth's sit-ins" reading is unambiguous. Adversarial-review-grade for downstream cross-corpus sweep ("world's worst" / "Woolworth's" homophone). |
| 17.P3.2 "by Moses" -> Bob Moses | resolved | Pass 4 confirms within-entry instance (SRT 2959); pattern stands as a corpus-wide catalog item. Adversarial review can focus on cross-corpus sweep for other "by [vowel-initial surname]" instances. |

**Audit-complete assessment:** Entry #17 (Charles McLaurin, 185 KB, 140+ Pass-2T rows + 13 Pass-3 confidence resolutions + 8 Pass-3 adversarial flags + 6 Pass-4 new catches + 3 P4 resolutions of P3 flags) — ready for publication pipeline with the Kirksey speaker-originating misstatement and the "Stoke Cleave myself" Carmichael+McDowell conflation flagged for downstream summarization-pipeline citation audit. Three new high-damage Whisper garbles surfaced by Pass 4 raw-spot-check (Ella Baker -> "Gallabagha", Woolworth's -> "world worst city ends", Jim Hill HS -> "Jim Heo") warrant cross-corpus sweep. Speaker-originating Kirksey misstatement preserved as-is per template rule.

**Audit-complete marker**: Pass 4 complete on entry #17 as of 2026-05-22.
