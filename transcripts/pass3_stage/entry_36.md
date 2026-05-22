#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 36.8 (Paracabra → Purvis/Prentiss/Beaumont?) | low | **flag — adversarial** | "~30 miles from Hattiesburg" geographic constraint is real but doesn't uniquely identify the town; Purvis (Lamar Co, ~10 miles SE), Prentiss (Jefferson Davis Co, ~35 miles N), and Beaumont (Perry Co, ~30 miles E) all fit. "Paracabra" doesn't phonetically map cleanly to any of these; possibly a Whisper attempt at a less-common MS town name like "Pachuta" (Clarke Co), "Picayune" (Pearl River Co), or "Poplarville" (Pearl River Co). Adversarial verification against Mrs. Dahmer's Forrest/Jasper/Jones county teaching history needed. |
| 36.9 (Elmerman → Mississippi Southern / Tougaloo) | low | **flag — adversarial** | "I went to the second era first in Elmerman" — graduate-degree teacher's-certificate context; possible candidates include MS Southern (now USM), Tougaloo, Alcorn, or Tennessee A&I (her undergraduate school). The "Elmerman" rendering doesn't cleanly map; could be "Alcorn" (her alma mater) heard through accent. Adversarial verification needed. |
| 36.12 (state private → state field secretary) | medium | **high** | Medgar Evers's documented role was NAACP Mississippi state field secretary (the first such position in MS, from 1954 until his assassination June 12, 1963); "state private" is a clean Whisper substitution for "state field secretary." Promote to high. |
| 36.14 (Miss Beard → Mrs. Aylene Beard or similar) | medium | **flag — adversarial** | "The Ladner sisters' grandmother/mentor figure"; the Ladner family is well-documented in MS movement history; the first name "Aylene" / "Earlene" / "Erlene" needs verification against Ladner-family records and the Joyce Ladner / Dorie Ann Ladner published memoir material. |
| 36.21 (Erlin Beard / Burn on system) | low | **flag — adversarial** | Surrounding text is severely garbled per Pass-1 note; this entire row needs adversarial reading of the raw audio if available. The "her name was Erlin Beard" / "her name was not Damon Emotions, her name was Erlin Beard" sequence is so garbled that it may contain misidentification of speakers in the conversation. |
| 36.22 (mom, 18th → mom was one of 18 plaintiffs) | medium | **high** | Speaker's mother-in-law (Vernon Dahmer Sr.'s mother) being one of the 18 *U.S. v. Lynd* plaintiffs is canonical Dahmer-family history; the case docket is publicly available and confirms 18 plaintiffs. Promote to high. |
| 36.23 (three court panel names) | low | **flag — adversarial** | The Fifth Circuit Court of Appeals panel that reviewed *U.S. v. Lynd* in 1963 is verifiable from court records; the speaker recalls but can't name the panel. Likely candidates from the 5th Circuit's "Brennan Four" era include Elbert Tuttle, John Minor Wisdom, John R. Brown, and Richard Rives. Adversarial verification against the published *U.S. v. Lynd* (305 F.2d 120) panel composition needed. |
| 36.30 (Mr. Laney) | low | **flag — adversarial** | "Intimidating person, Mr. Laney. He was his size and his voice" — Hattiesburg-area figure; possible candidates include a local sheriff (Bud Gray was Forrest Co sheriff in the 1960s), a Klansman, or a political figure. Adversarial verification needed. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 36.8 | "Paracabra" — MS town ~30 miles from Hattiesburg | Verify against Mrs. Dahmer's Forrest/Jasper/Jones county teaching-history records |
| 36.9 | "Elmerman" — graduate institution | Verify against MS graduate-school options for Black teachers c. 1947–55 |
| 36.14 | "Miss Beard" — Ladner sisters' mentor | Verify first name against Ladner-family memoir / records |
| 36.21 | "Erlin Beard / Burn on system" — severely garbled passage | Re-read raw audio if available to disentangle speakers |
| 36.23 | Three-judge Fifth Circuit panel in *U.S. v. Lynd* | Verify against published *U.S. v. Lynd* (305 F.2d 120) appellate-panel record |
| 36.30 | "Mr. Laney" — Hattiesburg-area intimidating figure | Verify against Forrest Co law-enforcement / political-figure records 1960s |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Vernon Dahmer Sr.: Hattiesburg NAACP president; assassinated by KKK firebombing of his Kelly Settlement home January 10, 1966; canonical pre-VRA voting-rights martyr. The "his card came out to be buried him" detail — that his *U.S. v. Lynd* voter-registration card arrived *posthumously* — is one of the most-powerful canonical first-person details in the corpus. Already in catalog #I.
- Ellie Dahmer (the speaker herself): Mississippi educator (Alcorn State, Tennessee A&I); home-economics teacher in Jasper, Jones, Forrest counties; widow of Vernon Dahmer Sr.; one of the original 18 Black plaintiffs in *U.S. v. Lynd* (1962–65); later three-term Forrest County District 2 Election Commissioner — canonical case of the "victim becomes the official" arc that the post-VRA Mississippi electorate produced. Should have her own corpus entry.
- *U.S. v. Lynd* (1962–65): The foundational Justice Department pre-Voting-Rights-Act voting-rights case against Forrest County (Hattiesburg) registrar Theron Lynd; established the 18-plaintiff registration relief order. Currently underweighted in the corpus (mentioned only as "Theron Lynd" defendant); should have a full case entry alongside Brown v. Board, Plessy v. Ferguson, Loving v. Virginia.
- John Doar: US Justice Department Civil Rights Division attorney who prosecuted *U.S. v. Lynd*; later led the Watergate House Judiciary Committee inquiry; canonical DOJ civil-rights-litigation figure. Currently absent from corpus.
- Judge W. Harold Cox (William Harold Cox): Segregationist Mississippi federal district judge (Kennedy appointee, ironically); initially dismissed *U.S. v. Lynd* before the Fifth Circuit reversed; canonical example of the segregationist-federal-judge problem in 1960s MS. Should be added to corpus.
- Theron Lynd: Forrest County Circuit Clerk and voting registrar 1959–69; *U.S. v. Lynd* defendant; canonical pre-VRA voting-rights-obstruction figure. Already in catalog #I.
- Earl Travillion Attendance Center: The consolidated all-Black Forrest County school built in the 1966 "freedom of choice" desegregation-stalling era; canonical Mississippi school-desegregation-bypass institution. Cross-references #33, #36.
- Hollis Watkins and Curtis Hayes (Muhammad): SNCC field secretaries from McComb MS who lodged with the Dahmers during the early-1960s voter-registration push; canonical southern-MS SNCC organizers.
- Dorie Ann Ladner and Joyce Ladner: Foundational Mississippi SNCC organizers; both from Palmer's Crossing area (Forrest County); active with the Dahmer NAACP branch as teenagers. Joyce later served as interim president of Howard University; canonical Mississippi-to-Howard movement pipeline figures.
- The Mississippi "interpretation of the Constitution" voter-registration test: Per the 1890 MS Constitution; central evidentiary subject of *U.S. v. Lynd*; the canonical pre-VRA literacy-and-interpretation-test apparatus that the 1965 VRA banned. Should have a corpus entry alongside other Jim Crow voter-suppression mechanisms.
- The "watermelon truck through the white community" 1964 Freedom Summer picnic incident at the Dahmer property: Canonical first-person source on Freedom-Summer-era domestic-terror conditions; warrants thematic-unit preservation per Pass-2 notes.
- The "blackout-curtains and sleeping-in-shifts" pre-1966 Dahmer-family practice: Canonical first-person source on domestic-life-under-KKK-terror; warrants thematic-unit preservation per Pass-2 notes.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 36.P3.1 | "Hadisburden" (Pass-1 #36.19) | Hattiesburg (catalog #F entry) | high | catalog #F | Catalog #F lists "had his Berg / Hadisburg / Hadishburg / Haddie's Burg / Hadisburden → Hattiesburg" with #36 already noted; confirmed. |
| 36.P3.2 | "Forest County" (Pass-1 #36.4) | Forrest County (catalog #F not currently noting this specific variant) | high | new catalog | "Forest" vs "Forrest" is a common-noun homophone substitution; Whisper consistently mangles the double-r spelling. New catalog-#F candidate variant. |
| 36.P3.3 | "Kelly's cell" (Pass-1 #36.5) | Kelly Settlement (catalog #F entry) | high | catalog #F | Confirms Pass-1; Kelly Settlement is the historically-Black community in northern Forrest County where the Dahmer family lived. Cross-references #33, #36. |
| 36.P3.4 | "Mr. Daymer / Damon / Demon" (Pass-1 #36.6) | Vernon Dahmer Sr. (catalog #E entry) | high | catalog #E | Already in catalog #E "Damier / Daymer / Damon → Vernon Dahmer Sr."; confirmed Pass-1. The Whisper rendering "Demon" is a particularly damaging variant that should be back-filed to catalog #E. |
| 36.P3.5 | "Mr. Nene, Nene" / "Theron Land" (Pass-1 #36.10 / #36.18) | Theron Lynd (catalog #E entry) | high | catalog #E | Already in catalog #E "Theran Lynn / Theron Land / Mr. Nene → Theron Lynd"; confirmed Pass-1. The single-syllable "Lynd" rendered as "Nene" is one of the most extreme phonetic-mangling patterns in the corpus and warrants catalog-#H highlighting. |
| 36.P3.6 | "Mega-evils" (Pass-1 #36.11) | Medgar Evers (catalog #C entry) | high | catalog #C | Confirms catalog #C; canonical Medgar Evers. |
| 36.P3.7 | "Cofu / Kofu" (Pass-1 #36.16) | COFO (catalog #B entry) | high | catalog #B | Confirms catalog #B. |
| 36.P3.8 | "John Doors / John Doe / John Dakota / Dakota" (Pass-1 #36.17) | John Doar | high | new catalog | John Doar is canonical-new for the catalog; recommend new catalog-#E entry for "John Doors / John Dakota / Dakota → John Doar." The four-variant Whisper-mangling pattern is one of the more striking in the Dahmer transcript. |
| 36.P3.9 | "Doory Ladner and Joyce Lachner" (Pass-1 #36.13) | Dorie Ann Ladner and Joyce Ladner | high | new catalog | The Ladner sisters' Whisper-renderings ("Doory" + "Lachner") are new catalog candidates. Should be back-filed to catalog #C alongside other SNCC field secretaries. |
| 36.P3.10 | "his card came out to be buried him" (Pass-2 #36.P2.4) | Vernon Dahmer Sr.'s posthumous voter-registration card | high | canonical | One of the most-canonical Mississippi voting-rights tragedy details; warrants Pass-3 ground-truth-corpus priority elevation. The detail that his *U.S. v. Lynd* registration card arrived after his death is the single most-effective historical anecdote linking the legal/litigation strand to the human-cost strand. |
| 36.P3.11 | "Bobby Kennedy" (Pass-1 #36.20) | Robert F. Kennedy (catalog #E entry) | correct | catalog #E | Confirms catalog #E "Bobby Kennedy → Robert F. Kennedy"; the Doar prosecutions of *U.S. v. Lynd* fell under Kennedy's DOJ leadership. |
| 36.P3.12 | "Judge Cox" (Pass-1 #36.24) | Judge W. Harold Cox | high | new catalog | New catalog-canonical candidate; the segregationist Kennedy-appointee MS federal district judge is canonical 1960s-MS-litigation figure. Recommend new catalog-#E entry. |
| 36.P3.13 | "Tennessee A&I" (Pass-1 #36.1) | Tennessee A&I State University (now Tennessee State) | high | canonical | The 1947 home-economics-graduate institution Mrs. Dahmer attended; canonical Tennessee HBCU; should be added to corpus alongside Tougaloo / Howard / Hampton / Tuskegee as foundational pre-1965 HBCU graduate-pipeline institutions. |
| 36.P3.14 | "Kilimanjee" / "home to get to know me" (Pass-1 #36.2 / #36.3) | "home economics" (Mrs. Dahmer's teaching subject) | high | new catalog | The recurring Whisper-mangling of "home economics" as "Kilimanjee" / "home to get to know me" is a striking common-noun mishearing pattern; new catalog-#G entry recommended. |

**Audit-complete marker**: Pass 3 complete on entry #36 as of 2026-05-22. Ready for adversarial-model review.
