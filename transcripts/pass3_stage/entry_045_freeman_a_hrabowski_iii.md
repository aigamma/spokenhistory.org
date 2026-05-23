#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 45.6 (Reverend Good Game) | medium | high | Reverend John Goodgame Sr. (1894-1962) was canonical predecessor pastor at Sixth Avenue Baptist Church in Birmingham preceding John T. Porter (Porter took over 1962). "Good Game" is unambiguous Whisper degradation of "Goodgame." Verifiable via Birmingham Public Library Black-church archives. Upgrade to high. |
| 45.8 / 45.P2.14 (Sotti-Salam / Saudi-Salam) | low | low (HOLD — flag adversarial) | Pass 2 preserved as still-unverified. Possible referents: Sardis AL, Letohatchee AL, Town Creek AL, or Bragg's AL. Speaker context (Lowndes County outside Selma) narrows the candidate set. Flag for adversarial geocoding check. |
| 45.14 / 45.P2.2 (Dr. Carol Hayes) | medium | high | Pass 2 confirmed multi-source within transcript ("This VIP Dr. Hayes was my Godfather"); Dr. C.R. Hayes (Charles Robert Hayes) is documented as Birmingham AL Negro Schools Superintendent 1940s-50s. Upgrade to high. |
| 45.26 (Judge Black) | low | low (HOLD — flag adversarial) | Pass 2 noted possible referents: Judge Hobart Grooms (ND AL), Judge Frank Johnson Jr. (MD AL), or the Fifth Circuit panel. Birmingham Children's Crusade reinstatement order was actually issued by Judge Clarence Allgood (ND AL) per most historiography; "Black" Whisper rendering doesn't fit Allgood. Flag for adversarial verification. |
| 45.28 / 45.P2.23 (Marys Berger) | low | low (HOLD — flag adversarial) | Pass 2 preserved as still-unverified UMBC art-history colleague. Possibly Maurice Berger (1956-2020, art-historian / writer at UMBC). Berger curated *For All the World to See* (2010) exhibition on civil rights visual culture at the NMAAHC + UMBC; biographical-and-institutional fit is strong. Promote candidate identification but flag adversarial for final confirmation. |
| 45.P2.12 (Rose Civil Disabilities) | high | high (CONFIRMED + REFINED) | Pass 2 noted "Whisper has rendered Rose for On the (or Resistance to) and Civil Disabilities for Civil Disobedience." Pass 3 refinement: The actual title of Thoreau's essay is "Resistance to Civil Government" (1849, original title) or "Civil Disobedience" (1866 posthumous reprint title). Speaker likely said "Thoreau's Civil Disobedience." Whisper has "Rose" for "Thoreau's" — Pass 2 reading is correct; refine the suggested-correction text to "Thoreau's *Civil Disobedience*". |
| 45.P2.15 (bidget bevvy / I'm wish) | medium | medium (HOLD — context-bounded) | Pass 2 noted speaker's mother "transferred from" some 2-year school to finish at Alabama State. Candidate 2-year schools for Black students in AL 1930s-40s: Tuskegee Institute's 2-year normal-school program (likely), Talladega College's preparatory wing, or Alabama State Normal School's lower division. The Tuskegee normal-school 2-year track existed and would fit. Keep at medium but narrow gloss to "Tuskegee Institute (normal school program)." |
| 45.P2.16 (Cal 2, Cal 3) | correct | correct | Pass 2 noted as correct; preserved. No resolution needed. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 45.8 / 45.P2.14 | "Sotti-Salam / Saudi-Salam" Lowndes County community | Spelling unverified; possible candidates Sardis, Letohatchee, Bragg's, Town Creek |
| 45.26 | "Judge Black" Birmingham Children's Crusade reinstatement | Judge Allgood is the standard-historiography referent; "Black" rendering inconsistent; need adversarial verification |
| 45.28 / 45.P2.23 | "Marys Berger" UMBC colleague | Strong candidate Maurice Berger (1956-2020); needs adversarial confirmation of identity |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Birmingham Children's Crusade (May 2-7, 1963): already in catalog as canonical event but Hrabowski's first-person testimony (spat-upon-by-Bull-Connor, five-days-juvenile-detention) is one of the most-direct sources for this event in the corpus. Pass 1/2 noted; Pass 3 confirms strong canonical first-person.
- Cynthia Wesley: one of the four girls killed in the September 15, 1963 16th Street Baptist Church bombing; Hrabowski's classmate; the "bye, Franklin" Friday encounter. Strong candidate (parallel to Denise McNair / Addie Mae Collins / Carole Robertson, none of which are individually in the corpus).
- Reverend Fred Shuttlesworth (1922-2011): ACMHR founder; canonical Birmingham foundational civil rights leader; Bethel Baptist Church Christmas Day 1956 bombing victim. Pass 2 #45.P2.7 surfaced; strong candidate for ground-truth corpus addition.
- Attorney Arthur D. Shores (1904-96): Birmingham NAACP attorney; home in Smithfield bombed twice in 1963 (August and September); foundational legal architect of Birmingham desegregation. Pass 2 #45.P2.8 surfaced; strong candidate.
- Alabama Christian Movement for Human Rights (ACMHR): Shuttlesworth's foundational June 1956 Birmingham movement organization (founded after Alabama banned the NAACP from operating in the state). Pass 2 #45.P2.9 surfaced; strong candidate as paired-entity with Shuttlesworth.
- Reverend John T. Porter (1932-2006): canonical Birmingham AL Black minister; Sixth Avenue Baptist Church pastor 1962-2000; foundational civil rights leader; Morehouse / Crozer / Princeton-educated.
- Reverend John W. Rice Sr. (1923-2000): Birmingham Presbyterian minister; Condoleezza Rice's father; canonical Birmingham middle-class Black-community network member.
- Dr. Freeman A. Hrabowski III (b. 1950): canonical longtime UMBC president 1992-2022; Meyerhoff Scholarship Program co-founder; canonical Birmingham Children's Crusade first-person source. The interview subject himself is a strong ground-truth candidate.
- Richard Arrington Jr. (b. 1934): first Black mayor of Birmingham 1979-99; biochemist with a PhD; canonical "Birmingham progress" symbol.
- Robert E. Meyerhoff (1924-2018): Baltimore Jewish philanthropist; UMBC Meyerhoff Scholarship Program co-founder 1989 with Hrabowski; foundational US Black-and-minority-students-in-STEM pipeline funder.
- UMBC Meyerhoff Scholars Program: canonical 1989+ Black-and-minority-students-in-STEM pipeline; foundational post-Movement institutional-legacy work.
- Booker T. Washington (1856-1915): Tuskegee Institute founder; canonical pre-Movement Black-educational-uplift intellectual; foundational figure whose Atlanta Compromise was the position Du Bois opposed (cross-reference: existing Du Bois corpus entry mentions "Of Mr. Booker T. Washington and Others" but Washington himself is not in corpus).

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 45.P3.1 | "Polish-cluster" Whisper-error pattern (Hrabowski → Ravasque/Robusky/robust; Tuskegee → Bounta Ski) | cross-corpus catalog item | n/a | catalog | Pass 2 #45.P2.4 noted "Bounta Ski" matches Whisper's Polish-cluster substitution applied to Hrabowski's own surname. Pass 3 catalog-catch: this is a recurring Whisper failure mode where multisyllabic non-Anglo proper nouns get re-rendered through Slavic-sounding clusters. Add to catalog category H as Special Pattern. |
| 45.P3.2 | "Dynamite Hill" canonical Smithfield AL nickname | Smithfield (Birmingham) was nicknamed "Dynamite Hill" 1947-65 for recurring KKK bombings | speaker-originating | canonical | Pass 2 #45.P2.6 surfaced "bomb hill / Bithil" → Smithfield, but didn't promote "Dynamite Hill" as the canonical referent name. Pass 3 catalog-catch: add "Dynamite Hill" to corpus geographic catalog. |
| 45.P3.3 | "Connie / Kandy" → Condoleezza Rice childhood-nickname (Pass 1 #45.23) | confirmed via Pass 2 #45.P2.26 "Connie's father" cross-instance | high | canonical | Both Pass 1 and Pass 2 caught the Condi/Connie/Kandy variants; Pass 3 confirms they all refer to Condoleezza Rice and the childhood-nickname is preserved as canonical biographical detail. |
| 45.P3.4 | Birmingham News / Birmingham World newspaper pair | correct (Pass 1 #45.33, Pass 2 #45.P2.28) | correct | catalog | No correction needed; Pass 3 catalog-catch is that this pair (white paper / Black paper) is a foundational southern-city journalism dyad worth flagging as a recurring category — the Birmingham News/World pair has parallels in Atlanta Constitution/Daily World and Memphis Commercial Appeal/Tri-State Defender. Worth a future catalog entry. |

**Audit-complete marker**: Pass 3 complete on entry #45 as of 2026-05-22. Ready for adversarial-model review.
