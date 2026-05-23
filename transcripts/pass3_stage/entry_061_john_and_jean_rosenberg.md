#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 61.5 C Park -> C.E. Park (Duke trustee) | medium | medium (kept) | "C Park" is the Whisper rendering; "C.E. Park" is plausibly the Gastonia-native Duke trustee but the spelling and full name are unverified by the Pass 1 author. Without a Duke-trustee-roster lookup, medium stays. Flag for adversarial review. |
| 61.13 Jerry Hyalbrun / Jerry Hyalburn -> Gerald Heilbron | low | medium (promoted) | Pass 2 row 61.P2.25 noted "Jerome A. 'Jerry' Heilbron" as a Fort Smith AR-based civil-rights attorney who joined the Civil Rights Division; later Community Relations Service. Pass 3 promotes to medium because the "Fort Smith Arkansas private attorney" anchor + the timeline (1960s CRD Mississippi work) fits the canonical Heilbron biography. Spelling still flagged for confirmation. |
| 61.P2.2 Apple Red -> Appalred | high | high (kept) | "Appalachian Research and Defense Fund" original-name verification: the canonical 1970-founded Prestonsburg KY legal-aid organization began as "Appalachian Research and Defense Fund" (Appalred) — yes, this matches the canonical AppalReD Legal Aid identity (now branded as AppalReD). Resolution confirmed. |
| 61.P2.23 Frank Schwelb -> Frank E. Schwelb | correct | correct (kept) | Pass 2 noted Schwelb as "child Holocaust refugee from Czechoslovakia." This is documented (Schwelb's father Egon Schwelb was a Sudeten German legal expert; family fled in 1939). Resolution stands. |
| 61.P2.27 Nick Flannery -> Nicholas C. Flannery | medium | medium (kept) | Pass 2 author flagged Nicholas C. Flannery as the likely Civil Rights Division attorney; the alternative Nicholas Katzenbach was actually Deputy AG / Attorney General — not a Mississippi-section CRD line attorney. Flannery is a documented CRD attorney of the era. Keep at medium pending second-source confirmation; the Katzenbach alternative the Pass 2 author hedged is implausible based on rank. |
| 61.P2.32 Lou Couter -> Louis B. "Lou" Coutter | low | low (kept) | Spelling unverified; the canonical CRD attorney name "Lou Coutter" / "Louis Coutter" / "Louis Couter" needs second-source confirmation. Flag for adversarial review. |
| 61.P2.42 Judge Wisdom -> Judge John Minor Wisdom | high | high (kept) | "Fifth Circuit Four" canonical pro-civil-rights judges (Wisdom, Brown, Rives, Tuttle — Tuttle is not Tuttle the SNCC volunteer #105 but rather Judge Elbert Tuttle Sr.). Pass 2 noted "Fifth Circuit Four" but listed Wisdom, Brown, Bell — note Bell came later. Resolution confirmed for Wisdom himself; the cohort framing should be checked separately. |
| 61.P2.59 Balance Do -> Baptist Town / Balance Due | low | low (kept) | "Black section is known as Balance Do" — could be a colloquial Black neighborhood name in Itta Bena, MS. Possibilities: "Balance Due" (a small unincorporated Black section), "Baptist Town" (a more famous Greenwood MS Black neighborhood, but Itta Bena is in Leflore County and Baptist Town is its neighbor). Without a Leflore County Black-community-names lookup, low stays. Flag for adversarial review. |
| 61.P2.66 A.Z. Hicks / Hicks family -> Robert "Bob" Hicks / A.Z. Young / Hicks family | medium | high (promoted) | The canonical Bogalusa LA Voters League and Deacons for Defense Bogalusa chapter leadership (A.Z. Young as president; Robert "Bob" Hicks as Vice president) are well-documented in the foundational Bogalusa 1965 CORE-testing-and-Deacons-for-Defense literature. Promote to high. |
| 61.P2.73 Gondolezo | low | low (kept) | "Roman Hassan was already addressed" — Pass 2 author flagged "Gondolezo" as a possible separate Italian/last-name reference; without context, low stays. Could also be a phonetic rendering of "Gonzalez" or similar. Flag for adversarial review. |
| 61.P2.83 Greater Germantown Business Association | speaker-originating | speaker-originating (housekeeping noise) | Pass 2 author noted "this is in #63 Churchville transcript, not Rosenberg; ignore." Confirmed — this is cross-corpus contamination; drop from final output. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 61.5 / 61.P2.9 | C Park -> C.E. Park (Duke trustee) | Duke-trustee-roster lookup needed; Gastonia native; specific name unverified. |
| 61.13 / 61.P2.25 | Jerry Hyalbrun -> Jerome A. "Jerry" Heilbron | Fort Smith AR civil rights attorney; spelling unverified. |
| 61.P2.27 | Nick Flannery -> Nicholas C. Flannery | Civil Rights Division attorney identification needed. |
| 61.P2.32 | Lou Couter -> Louis B. "Lou" Coutter | CRD attorney name spelling unverified. |
| 61.P2.42 | "Fifth Circuit Four" composition | Pass 2 listed Wisdom/Brown/Bell; canonical "Fifth Circuit Four" is Wisdom/Brown/Rives/Tuttle (the historic civil-rights-era panel). Bell came on the bench in 1961 but is typically not counted in the original "Four." Worth a second-model check on the canonical composition. |
| 61.P2.59 | Balance Do -> Baptist Town / Balance Due | Leflore County MS Black-community-name needed. |
| 61.P2.73 | Gondolezo | Unidentified reference; second-model lookup. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- John Doar (1921-2014): Civil Rights Division Asst. Attorney General 1965-67; Mississippi Burning case prosecutor; foundational federal civil-rights enforcement architect 1960-69; later House Judiciary Committee special counsel for the Nixon impeachment inquiry 1973-74.
- Burke Marshall (1922-2003): Civil Rights Division Asst. Attorney General 1961-65; foundational JFK/RFK-era civil-rights legal architect; the original "let's get four more lawyers" CRD-scaling figure; later Yale Law professor and IBM general counsel. (Already cross-referenced in #49 Richardson; corpus addition essential.)
- Julius LeVonne Chambers (1936-2013): Foundational NC LDF civil rights attorney; UNC Law (1962, top of class); his home, office, and car all firebombed during the 1960s-70s; later NAACP-LDF director-counsel; chancellor NC Central; foundational North Carolina civil-rights litigation figure.
- Hazel Brannon Smith (1914-1994): Holmes County MS newspaper editor (*Lexington Advertiser*); 1964 Pulitzer Prize for editorials supporting civil rights; first woman to win the Pulitzer for Editorial Writing; foundational white Southern-press civil-rights ally figure.
- Hodding Carter Jr. (1907-1972) / Hodding Carter III (b. 1935): Greenville MS *Delta Democrat-Times* editors; the canonical white Mississippi-press civil-rights moderate dynasty; Hodding Carter III later State Dept. spokesman under Carter administration (1977-80).
- Viola Liuzzo (1925-1965): Detroit MI volunteer; KKK-murdered March 25 1965 on Highway 80 while shuttling Selma-Montgomery marchers; foundational Selma-Montgomery March martyr. (Catalog mention but corpus essential.)
- Harry M. Caudill (1922-1990): Whitesburg KY attorney and author of *Night Comes to the Cumberlands* (1963); foundational Appalachian-poverty-and-strip-mining literary figure; Appalred founding board member.
- Edgar Ray "Preacher" Killen (1925-2018): Mississippi Burning case Klansman defendant; first hung jury 1967, then convicted by state on manslaughter charges 2005 (41st anniversary of the murders); foundational late-Klan-era prosecution.
- Marian Wright Edelman (b. 1939): NAACP-LDF Mississippi lawyer 1964-68 (first Black woman admitted to MS Bar); founder Children's Defense Fund 1973; foundational child-advocacy and Poor People's Campaign figure.
- Resurrection City (May 12 – June 24 1968): Poor People's Campaign tent city on the National Mall; successor to MLK's planned campaign after his assassination; foundational late-1960s Poor People's Campaign event.
- Sen. James O. Eastland (1904-1986): MS Democratic Senator 1943-78; Senate Judiciary Committee chairman 1956-78; foundational segregationist blocker of civil-rights legislation; Judge W. Harold Cox's UMiss law-school roommate (the conflict-of-interest origin of Cox's pro-segregationist 5th Circuit appointment).
- Appalred / Appalachian Research and Defense Fund: 1970-founded Prestonsburg KY legal-aid organization; John Rosenberg's foundational post-Civil-Rights-Division Eastern KY public-interest law project (1970-2002); foundational Appalachian-poverty-law model.
- The Buffalo Creek disaster / Pittston Coal slurry impoundment flood (Feb 26 1972): 125+ killed in West Virginia by Pittston Coal's negligent dam; Gerald M. Stern (CRD alum) was the foundational plaintiffs' counsel; subject of his 1976 *The Buffalo Creek Disaster* book.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 61.P3.1 | "John Dorr" (recurring rendering) | John Doar | high | catalog | Pass 2 row 61.P2.18 noted "Dorr" as a recurring Whisper rendering of "Doar." Pass 3 confirms this is a corpus-wide pattern (also surfaces in Greenberg #56, Sobol #104, Geiger #54). Add to the cross-corpus catalog (table A or C) as a high-frequency interviewee-team-adjacent failure mode: "Dorr / Door / D'Or -> Doar." |
| 61.P3.2 | "Marin Wright" (Pass 2 noted) | Marian Wright Edelman | high | catalog | Recurring Whisper rendering pattern: "Marin" (lacking the "ah" diphthong) for "Marian." Add to catalog. |
| 61.P3.3 | "Children's Offense Fund" | Children's Defense Fund | high | catalog | Pass 2 row 61.P2.47 caught this; Pass 3 confirms it as a corpus-wide pattern worth adding to catalog G (common-noun and idiom errors) — Whisper consistently substitutes "Offense" for "Defense" when the word is unstressed in the phrase. |
| 61.P3.4 | "Lawrence Giot" -> Lawrence Guyot | high | canonical | Pass 2 row 61.P2.71 caught this; cross-corpus consistency confirms (also surfaces in #41 Simpson, #76 Guyot's own transcript). Guyot's surname is consistently mis-rendered by Whisper as "Giot," "Gioit," or "Joyot." Worth a catalog entry. |
| 61.P3.5 | "Lt. Gov. Johnson" (Pass 2 caught) | Lt. Gov. Paul B. Johnson Jr. | high | canonical | Cross-corpus check: Paul B. Johnson Jr. as MS Lt. Governor 1960-64 then Governor 1964-68 is canonical; his blocking of Meredith at Ole Miss September 1962 is a well-documented event. Cross-reference with Carter (Hodding Jr.'s) 1962 editorials. Pass 2 resolution stands at high. |

**Audit-complete marker**: Pass 3 complete on entry #61 as of 2026-05-22. Ready for adversarial-model review.
