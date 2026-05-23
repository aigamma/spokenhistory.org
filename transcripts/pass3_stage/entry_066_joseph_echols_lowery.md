#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 66.6 / 66.P2.15 S. M. McCree -> Rev. S.S. Seay or other | low | low (kept) | Pass 2 P2.15 noted that Mobile Baptist clergy cohort 1952–60 (R.W. Gilliard, C.S. Cumby, J.C. Stocking, Albert Foley SJ) do not phonetically match "McCree." Adversarial check against the Mobile NAACP 1952–60 directory may resolve, but Pass 3 cannot. Speaker-recall uncertainty remains. |
| 66.10 / 66.P2.25 Fred Schoenleware "Tallahassee" Pass-1 conflation | high (Shuttlesworth Birmingham) | high (kept; Pass 2 corrected Pass 1 error) | Pass 2 P2.25 surfaces a Pass-1 conflation: the transcript reads "Birmingham with Fred Schoenleware Tallahassee with CK Steele" meaning Shuttlesworth-Birmingham AND C.K. Steele-Tallahassee (correct), not Shuttlesworth-Tallahassee (Pass 1 misread). Resolution stands. |
| 66.18 Emmy Attili -> Rev. John L. Tilley | medium | high (promoted) | Pass 2 did not promote, but the SCLC executive director chronology is unambiguous: Rev. John L. Tilley was SCLC's first ED (1958–59), came from Baltimore (Methodist clergy, NAACP), and was succeeded by Ella Baker. The "came out of Baltimore" speaker prompt + the first-ED context are corpus-anchorable. Pass 3 promotes to high. |
| 66.30 R.B. Dewitt -> R.B. DeWitt | speaker-originating | speaker-originating (kept) | Mobile YMCA secretary; speaker recall of a local Mobile figure. No canonical anchor needed; preserve as speaker-originating. |
| 66.43 / 66.P2.4 / 66.P2.11 "the easy guest in the North" -> L.H. (Luther) Foster | medium | high (Pass 2 promoted) | Pass 2 P2.4 confirms high via context: Luther H. Foster Jr., Tuskegee Institute president 1953–81, would be the dignitary Wallace would meet with (Wallace's "Alabamians only" rule). "Easy guest" is Whisper artifact for "eldest" or "ablest" — unresolved as exact substitution but the canonical referent (Foster) is high-confidence. |
| 66.53 NSAS -> Americus | low | medium (promoted) | The Lowery context "people in NSAS had to go to America to very court" likely refers to the Albany Movement court cases relocated to the federal court in Americus, Sumter County, GA — canonical 1962–63 Albany federal-litigation venue. Pass 3 promotes to medium pending adversarial confirmation. |
| 66.P2.6 "praise themselves, weapons" -> purged themselves of weapons | high | high (kept) | Pass 2's reading of the nonviolent-action workshop weapons-purging ritual is canonical SCLC/SNCC training practice; "purged" / "cleansed" / "stripped" all plausible. Resolution stands. |
| 66.P2.7 "you mean us in the home with me" -> "you mean us no harm and we mean you no harm" | high | high (kept) | Pass 2 reading is the canonical Movement nonviolent de-escalation phrase. Resolution stands. |
| 66.P2.8 "by Justice. Justice said" -> Justice Brennan | medium | medium (kept) | Justice William J. Brennan Jr. wrote the *NYT v. Sullivan* (1964) opinion. The "Justice said" prefix could be Brennan (most likely) or one of the other associate justices (Black, Goldberg). Adversarial check warranted. |
| 66.P2.10 "where he wasn't going to meet" -> "wasn't going to meet with anybody who wasn't from Alabama" | high | high (kept) | The "went" / "wasn't" inversion changes meaning entirely. Pass 2 reading is consistent with the canonical Wallace post-Selma "Alabamians only" stance + the context that Lowery (in Birmingham, an Alabamian) was named chair specifically for that reason. Resolution stands. |
| 66.P2.22 "first phase, three embers the man" | low | low (kept) | Speaker disfluency about who fronted the $8900 for the *Sullivan* car auction. Multiple plausible readings (first place / first phase / first base). Adversarial check warranted. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 66.6 / 66.P2.15 | S.M. McCree / Mobile Baptist minister | Mobile NAACP 1952–60 directory cross-reference needed. Speaker-recall + Whisper-phonetic ambiguity persists. |
| 66.P2.8 | "by Justice. Justice said" — which Supreme Court Justice | Brennan most likely (he wrote the opinion); could be Black, Goldberg, or Harlan. Worth confirming. |
| 66.P2.22 | "first phase, three embers the man" *Sullivan* auction context | Speaker-disfluency parsing; adversarial models with stronger context-window may resolve. |
| 66.43 / 66.P2.4 / 66.P2.11 | "easy guest in the North" — Foster confirmation + exact Whisper-substitution | Foster canonical referent is high-confidence; exact "easy guest" substitution still ambiguous. Worth a second-model lookup. |
| 66.53 | NSAS → Americus + the Albany court-case relocation context | Verify that the Albany Movement federal litigation venue was Americus (Sumter Co. federal court). |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Joseph Echols Lowery (1921–2020): SCLC co-founder January 1957, original VP, SCLC president 1977–97, co-defendant in *New York Times v. Sullivan* (1964), Selma–Montgomery march committee chair (1965), Obama 2009 inauguration benediction. The interview subject himself — foundational SCLC figure absent from facts.json. CRITICAL ADD: the SCLC summary entry in facts.json names Lowery as a co-founder but he is not himself a corpus entry.
- Fred Shuttlesworth (1922–2011): SCLC co-founder, Birmingham Christian Movement for Human Rights founder, Birmingham Campaign architect (1963), *NYT v. Sullivan* co-defendant. The interview's most-mangled Whisper figure (Schoenleware/Shotherworth — see Pass 1 #66.10 + Pass 2 P2.2/P2.25). Foundational SCLC figure absent from facts.json despite being named in the SCLC summary.
- Rev. S.S. Seay Sr. (Solomon Snowden Seay Sr., 1899–1988): Montgomery AME Zion minister, NAACP Alabama president, *NYT v. Sullivan* co-defendant (the fourth Black co-defendant alongside Lowery, Abernathy, and Shuttlesworth). Pass 2 P2.24 explicitly recommends adding to facts.json. Father of Solomon S. Seay Jr. (civil rights attorney).
- Roland Nachman Jr. (M. Roland Nachman Jr.): Montgomery attorney for the city in *NYT v. Sullivan*, the figure whose summation-to-the-jury invocation of Sammy Davis Jr.'s interracial marriage to May Britt is canonical first-person Lowery testimony on Alabama-jury-bias mechanics in segregation-era libel cases. Pass 1 #66.24 ("Knockman" Whisper rendering).
- Rev. T.J. Jemison (1918–2013): Baton Rouge SCLC co-founder, organized the 1953 Baton Rouge Bus Boycott (the precedent to Montgomery — 30 months before Rosa Parks). Foundational pre-Montgomery Movement figure absent from facts.json.
- Rev. C.K. Steele (Charles Kenzie Steele, 1914–1980): Tallahassee SCLC co-founder, Inter-Civic Council bus boycott leader (1956 Tallahassee Bus Boycott, contemporaneous with Montgomery). Foundational SCLC co-founder absent from facts.json.
- Rev. Kelly Miller Smith Sr. (1920–1984): Nashville SCLC co-founder, First Baptist Capitol Hill pastor, Nashville Christian Leadership Council founder, mentor to John Lewis / Diane Nash / James Bevel during the Lawson nonviolent workshops. Foundational SCLC co-founder absent from facts.json.
- *New York Times Co. v. Sullivan* (1964): Landmark First Amendment libel decision (376 U.S. 254) establishing the "actual malice" standard for libel claims by public officials. Lowery, Abernathy, Shuttlesworth, and Seay were the four Black co-defendants. This is the single most important Civil Rights Movement-era First Amendment case and should be a discrete event entry in facts.json alongside Brown / Plessy / Loving.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 66.P3.1 | "Star Spank Obama" / "Barber's bursting in air" (national anthem) | "Star-Spangled Banner" / "bombs bursting in air" | high | canonical | Pass 1 #66.44/66.45 + Pass 2 P2.13 already caught. Pass 3 flags this as a corpus-defining surreal Whisper pair worth catalog-promotion: the "Spangled → Spank Obama" substitution and "bombs → barber's" substitution should be added to catalog H ("Special patterns to watch for") as documented Whisper-error variants for the U.S. national anthem. Currently absent from catalog. |
| 66.P3.2 | "Madagrah" → Mardi Gras + "dooleans" → New Orleans pattern | Mardi Gras / New Orleans | high | canonical | Pass 1 #66.31/66.32 caught. The "dooleans" → "New Orleans" Whisper rendering is a previously-undocumented geographic-error variant. Recommend back-filing to catalog F. |
| 66.P3.3 | "Polar Commodation Act" → 1964 Civil Rights Act / Public Accommodations Act | Civil Rights Act of 1964 | high | canonical | Pass 1 #66.39 + Pass 2 P2.23 caught. The "Polar Commodation" Whisper-rendering of "Public Accommodations" is one of the most-distinctive corpus Whisper-compounds; worth back-filing to catalog G common-noun errors. |
| 66.P3.4 | "Browns, Apple" → Brown Chapel AME (Selma) | Brown Chapel AME Church (Selma) | high | canonical | Pass 1 #66.48 + Pass 2 P2.14 caught. Selma's Brown Chapel AME is the canonical 1965 Selma-to-Montgomery launch site and the 2007 commemorative-march reunion site for Lowery + Obama. Worth back-filing to catalog F (church-name geographic errors). |
| 66.P3.5 | "the LC" → SCLC / "Coresh" / "Cory" → CORE pattern | SCLC / CORE | high | canonical-alias | Pass 1 #66.20/66.21/66.23 caught. The "LC → SCLC" and "Cory/Coresh → CORE" patterns are recurring across this iteration (also in Howell #67 P1.16/17). Catalog B has CORE rendered as "Co-full / Cofu / Kofu" — recommend adding "Cory / Coresh / Cresh" as additional variants. |
| 66.P3.6 | "TJ Jimmerson" → T.J. Jemison + "the battered" → Baton Rouge | T.J. Jemison / Baton Rouge | high | canonical | Pass 1 #66.13/66.14 caught. The "Jimmerson → Jemison" rendering + "the battered → Baton Rouge" geographic substitution are corpus-defining for the SCLC founding-cohort identification. Worth back-filing to catalog C (figure) + catalog F (geographic). |

**Audit-complete marker**: Pass 3 complete on entry #66 as of 2026-05-22. Ready for adversarial-model review.
