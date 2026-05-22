#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 17.29 Willet Peacock -> Wazir Peacock | medium (P1) -> high | high | Pass 2 #17.P2.29 promoted to high via canonical-alias ("Willie B. 'Wazir' Peacock", SNCC Mississippi field worker, Cleveland MS native). Confirmed unambiguous. |
| 17.41 Marisee Jones Elementary -> Morrison-Jones | low (P1) -> medium (P2 promoted) | medium (kept) | Pass 2 #17.P2.5 promoted to medium. Cannot fully resolve to high without external Jackson MS Black-elementary-school directory. Speaker context (childhood Jackson schools) is consistent. Recommend keeping at medium; flag for adversarial pass. |
| 17.47 Rust Brown -> R. Jess Brown | medium (P1) -> high (P2T promoted as catalog-alias) | high | Pass 2 tail #17.P2T.114 ("RHS Brown / Rust Brown") confirms canonical-alias rendering. R. Jess Brown is one of the three Black MS civil-rights attorneys (Brown, Young, Hall). Resolution stands at high. |
| 17.P2.27 Landon Magnet / Landy McNair | medium (P2) -> high (P2T reinforced) | high | Pass 2 tail #17.P2T.35 "landed Magnil" -> Landy McNair confirms via canonical-alias. Driver who fell asleep on the Nashville/Fisk trip. Promoted to high. |
| 17.P2.30 Levin Brown -> Lavern Brown | medium | medium (kept) | Speaker-originating local SNCC field worker; canonical spelling "Lavern" not externally confirmable from corpus alone. Recommend keeping medium and flagging for adversarial pass. |
| 17.P2T.6 Miles Foster | low | low (kept) | "Mileston Foster" or "Milas Foster" — local Ruleville community leader. Canonical spelling unrecoverable from transcript alone. Recommend keeping low. |
| 17.P2T.19 Maddie -> Mary Tucker | medium | medium (kept) | Speaker may have been referring to Mary Tucker, Mae Bertha Carter, or another Sunflower elder. Context insufficient. Recommend adversarial pass. |
| 17.P2T.22 Sizzle's house -> Sissles' / Sisson | medium | medium (kept) | Whisper-garbled Ruleville activist family; "Sisson" is plausible per #17.P2T.7 "Jake Sisson" reference. Recommend confirming via Sunflower County civil-rights local history. |
| 17.P2T.51 Rennie Williams | low | low (kept) | Tracy Sugarman's host family; canonical spelling unrecoverable. Recommend low and adversarial pass. |
| 17.P2T.70 Dr. Virginia Talbert -> Virginia Travis (uncertain) | low | low (kept) | The "female mayor" of Ruleville at Hamer's March 1977 death. Recommend adversarial check against Ruleville municipal records. |
| 17.P2T.96 Sydney Livingston's plantation | medium | medium (kept) | Sunflower County plantation; canonical spelling unverified. |
| 17.P2T.108 Burnley -> Pat Dunne / Burnley Lewis | low | low (kept) | Greenville MS police-chief-turned-mayor; canonical name unrecoverable from corpus alone. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 17.P2T.3 | Joe McDonald (Ruleville host) | Spelled "Joe Magdalen / Joe Max / Mag / Magdew" by Whisper. Critical Hamer-recruitment-period figure: he housed the SNCC organizers in Ruleville Aug 1962. Whisper conflates with Chuck McDew ("Magdew" rendering). Adversarial pass should confirm the historical record on Joe McDonald's role in the Hamer recruitment and his relationship (if any) to other "McDonald" / "McDonnell" figures in the corpus (esp. Dora McDonald, Dr. King's secretary - catalog C). |
| 17.P2T.76 | McLaurin misspeaks: Kirksey "first senator since Reconstruction" | This is speaker-originating factual error, not Whisper. If quoted in a summary without fact-check it becomes a hallucination risk. Hiram Revels (1870-71) and Blanche K. Bruce (1875-81) were the first Black US senators since Reconstruction; Kirksey was a MS state senator. Adversarial pass should flag this for publication-pipeline citation-audit attention. |
| 17.P2T.78 | Walter Ruth -> Walter Reuther | "Walter Ruth" is the Pass 1 author's attribution but Reuther's name is also often Whisper-rendered as "Roother / Reuters" — adversarial check should confirm context (UAW + Atlantic City 1964 + MFDP-compromise context) supports the Reuther attribution. |
| 17.P2T.88 | "Stoke Cleave myself" | High-damage Whisper conflation of Stokely Carmichael + Cleve McDowell within a single sentence. A summarization model quoting this directly would fabricate a person. Adversarial pass should treat this as a publication-block-trigger candidate. |
| 17.P2T.97 | Six lives, big location | "Sixteenth-section" is the most likely canonical reading (a Mississippi land-allocation term for the public-school-supporting parcel in each township). Adversarial pass should confirm via MS land-grant terminology. |
| 17.P2T.98-99 | Lynch / Montgomery conflation | John R. Lynch and Isaiah Montgomery appear in adjacent sentences. Summarization risk: a model may conflate these two distinct historical figures into one. Adversarial pass should treat with caution. |
| 17.P2T.102 | "I team on Gumber" | Whisper garble for "Itta Bena and ?" — second town possibly Renova or another all-Black founded community alongside Mound Bayou. Recommend Stage-3 LLM disambiguation. |
| 17.P2T.108 | Burnley (Greenville police chief later mayor) | Canonical name unrecoverable. Adversarial pass should consult Greenville MS municipal history. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Charles McLaurin (b. 1939): The SNCC field secretary who recruited Fannie Lou Hamer into the voter-registration movement (Ruleville, Aug 1962). Foundational Hamer-recruitment-period figure. The longest first-person Mississippi Delta SNCC account in the corpus.
- Joe McDonald + Rebecca McDonald: Ruleville civil-rights host family; sheltered the SNCC organizers Aug 1962. The "second-amendment + Bible + history-book" episode is foundational to the Ruleville Movement narrative.
- Perry "Pap" Hamer: Fannie Lou Hamer's husband; co-anchor of the Hamer family on the Marlow plantation. Repeatedly referenced.
- Hollis Watkins: Foundational McComb/Mississippi SNCC field worker. Pioneered the 1961 Pike County voter-registration work with Curtis Hayes and Bob Moses.
- Dorie Ladner + Joyce Ladner: Sister Tougaloo SNCC field workers. Dorie was a SNCC field secretary; Joyce became a foundational Black sociologist (later Howard University acting president).
- Curtis Hayes (later Curtis Muhammad): Founding McComb SNCC field worker; first SNCC arrest in MS.
- Victoria Gray Adams (1926-2006): MFDP co-founder; ran as MFDP Senate candidate in the 1964 Freedom Vote. Foundational Mississippi-movement figure.
- Jimmy Travis: SNCC field secretary shot Feb 1963 near Greenwood with Bob Moses + Randolph Blackwell in the car. The shooting was the trigger for SNCC's expanded MS Delta presence.
- Randolph Blackwell: Voter Education Project (VEP) field director; in the car with Moses + Travis at the Greenwood shooting.
- John Doar (1921-2014): DOJ Civil Rights Division attorney (later Assistant AG for Civil Rights under LBJ). Principal federal investigator on MS voting-rights cases including U.S. v. Lynd. Walked alongside MLK at the Selma marches; the federal-government counterweight to MS state-level segregation.
- Rev. Ed King (b. 1936): White Tougaloo chaplain; ran for MS Lieutenant Governor on the 1963 MFDP Freedom Vote slate with Aaron Henry. Foundational MFDP figure.
- Joseph Rauh Jr. (1911-1992): UAW general counsel + MFDP attorney at Atlantic City 1964. The lawyer who argued the MFDP credentials challenge.
- Walter Reuther (1907-1970): UAW president 1946-70; principal Atlantic City compromise-broker on LBJ's behalf.
- Henry J. Kirksey (1915-2005): MS state senator + foundational redistricting mapmaker who drew the Black-majority MS congressional + state-legislative maps post-1965. Resigned the MS Senate citing futility.
- Owen Brooks: Director of the Delta Ministry (NCC's MS civil-rights arm) 1969-89. Foundational post-1965 Delta movement figure; organized Hamer's funeral.
- Charles Bannerman: Founding president/CEO of MACE (Mississippi Action for Community Education) + the Delta Foundation. Foundational Black economic-development figure in the Delta.
- Henry Espy: Sunflower County funeral director who buried Hamer March 1977; brother of Mike Espy (later US Sec. of Ag).
- Willie Ricks (Mukasa Dada): SNCC field secretary; original coiner of the "Black Power" chant per McLaurin's testimony (spring 1966).
- Lafayette Surney: SNCC field secretary in the Delta.
- June Johnson: Greenwood SNCC teenage activist; with Hamer + Ponder in the Winona MS jail beating June 9, 1963.
- Tracy Sugarman (1921-2013): Westport CT illustrator-witness of Freedom Summer 1964; author of "Stranger at the Gates."
- Floyd McKissick (1922-1991): CORE national director 1966-68; with King + Carmichael on the Meredith March Against Fear.
- Frank Smith: Foundational SNCC field worker; later DC Statehood activist + founder of the African American Civil War Museum in DC.
- Bidwell Adams: MS Democratic Party Secretary 1944-68. The state-establishment Democrat who handled Hamer's $500 congressional qualifying check.
- Isaiah T. Montgomery (1847-1924): Founder of Mound Bayou MS (1887); last Black MS legislator to vote in the 1890 MS constitutional convention.
- Bennie G. Thompson (b. 1948): US Rep (D-MS-2) 1993-present. The post-redistricting Black-majority Delta district McLaurin drew the map for.
- Robert G. Clark Jr. (1928-2024): First Black member of the MS state legislature post-Reconstruction (elected 1967, MS House).

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 17.P3.1 | "Hollis Watkins / Highless" - already in P2T as #17.P2T.30; cross-check for any second occurrence | Hollis Watkins | high | canonical-new | Pass 2T flagged this once. Tail re-read should sweep for any additional Whisper variants ("Hollins / Holless / Hollest"). |
| 17.P3.2 | "Bob Moses" via "by Moses" rendering | Bob Moses | high | canonical-alias | Pass 2T #17.P2T.2 captured "by Moses wakes us up" — extend this as a corpus-wide pattern: Whisper drops the "B" in "Bob" before "Moses" / Mosnier / Bishop etc. consistently. Adversarial pass should sweep for "by Mosnier" / "by Bishop" in this transcript and across the corpus. |
| 17.P3.3 | "Lynch" / "John R. Lynch" / "Lynch Street" - same-word three-referent confusion | (three distinct referents — flag at summarization) | high | canonical | (1) US Rep John R. Lynch (the post-Reconstruction Black congressman), (2) Lynch Street (Jackson MS street + COFO HQ + Jackson State 1970), and (3) "lynch" / "lynching" verb. Three distinct semantic referents that a summarization model would risk conflating. Worth a summarization-time disambiguation note in the publication-pipeline prompt context. |

**Audit-complete marker**: Pass 3 complete on entry #17 as of 2026-05-22. Ready for adversarial-model review.
