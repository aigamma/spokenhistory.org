#### Pass 4 sweeping QA + fact-check (2026-05-22)

**Re-grounding promotions (low/medium/flagged → high):**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 20.24 Damon (Hawaii landowner) | medium | high | Verified canonical: Samuel Mills Damon's estate was indeed the second-largest private Hawaii landowner (after Bishop Estate / Kamehameha Schools) until its 2004 break-up. Jones's Altadena/Hawaii context (Pass 2T #20.P2T.9) cross-confirms the Hawaii residency thread. Promote to high. |
| 20.P2T.6 Donald Clarence -> Donald Shapiro | medium | high | Donald Shapiro is canonically BU Law mid-1950s + later NYU Law dean (1968-83); his mentorship of Jones is documented in Jones's published memoir *What Would Martin Say?* and in the Tavis Smiley/Cornel West interview record. The "Donald Clarence" mishearing makes sense as the professor's first name spliced with the student's first name. Promote to high. |
| 20.P2T.2 Visitor Island -> Emerald Isle (Ireland) | medium | medium (retained) | Phonetic match remains weak; insufficient evidence to promote. Retain at medium for adversarial pass. |

**Re-grounding demotions (high → medium/low, or kept-with-correction):**

| Original row | Old confidence | New confidence | Issue |
|---|---|---|---|
| 20.12 / Subject paragraph "Daniel H. Krenge De Iongh" | high (P1) | kept-with-correction | Pass 1 wrote "Daniel H. Krenge De Iongh"; Pass 2 #20.P2.4 correctly identifies as "Daniel H. Crena de Iongh." The canonical form (per Dutch banking records + World Bank archives) is **Daniel H. Crena de Iongh**, first Treasurer of the World Bank 1946-52. The Subject paragraph's "Krenge" spelling is an artifact of Pass 1 and should be corrected to "Crena" in any master-MD update. Pass 2 form stands. |
| 20.P2T.12 Judge Huigilini -> Judge Hubert T. Delany | high (P3 confirmed) | kept-with-correction | Verified: Hubert T. Delany was indeed counsel in the 1960 *State of Alabama v. King* tax/perjury case, but the **chief defense counsel** designation is overstated. Delany was a senior member of King's defense team alongside Fred Gray, William Ming, Robert Carter, and others. The lead trial counsel role is more accurately attributed to William Robert Ming Jr. of Chicago. Recommend softening "chief defense counsel" to "senior defense counsel" in master MD. |

**New Pass 4 catches (errors missed by Pass 1+2+3):**

| # | Span as Whisper-transcribed | Suggested correction | Confidence | Source | Surrounding context |
|---|---|---|---|---|---|
| 20.P4.1 | (Subject paragraph) "founded the Institute for Nonviolence Initiatives" | (claim absent from raw transcript) | n/a — fact-check finding | external | Pass 4 prompt asserts Jones "founded the Institute for Nonviolence Initiatives," but no such institute appears in the raw transcript and Pass 1/2/3 do not corroborate. Jones's actual post-2005 institutional affiliations are the **Martin Luther King Jr. Research and Education Institute at Stanford** (where he was a visiting professor / fellow) and, separately, the **Institute of Politics, Democracy and the Internet** + later the **Institute for Advanced Studies in Nonviolence at the University of San Francisco** (founded c. 2014, named for Jones in 2015). Flag the prompt-given institute name as unverified and recommend the Stanford King Institute + USF Institute as the canonical pair. |
| 20.P4.2 | (Subject paragraph) "Drafted significant portions of King's 'I Have a Dream' speech... and the Letter from Birmingham Jail's drafting context" | Co-drafted "I Have a Dream" (specifically the opening "promissory note" passage); smuggled drafts of the Letter from Birmingham Jail out of jail | high | canonical-clarification | Jones's documented contribution to the speech is the **opening "cash a check / promissory note" passage** (not "significant portions" generally) — well-corroborated by Jones's own 2011 book *Behind the Dream*. For the Letter, Jones's role was as the **conduit who carried successive drafts in/out of Birmingham Jail** on legal-visit privilege; he did not author it. Recommend tightening Subject paragraph language to distinguish "co-drafted opening" (Dream) from "drafts-courier" (Letter). |
| 20.P4.3 | (Subject paragraph) "Drafted significant portions of King's 'I Have a Dream' speech at the 1963 March on Washington" | (missing the SCLC general counsel role) | high | canonical-omission | Subject paragraph omits Jones's documented role as **SCLC general counsel** (referenced in Pass 4 prompt context but missing from the per-entry-slice Subject summary). Pass 1 author's Subject paragraph emphasizes the speechwriter role but the legal role is canonical (1960 tax case onward + Birmingham bail-bond work via Rockefeller). Recommend Subject-paragraph expansion. |
| 20.P4.4 | "Cornwell's Heights" (in 20.1 / 20.P2.2 row's Whisper-transcribed column) | Cornwells Heights | (catalog-pattern reinforced) | geographic | The apostrophe in "Cornwell's" is the Whisper failure; the canonical place name has no apostrophe and no possessive form ("Cornwells Heights" — collective plural). Already corrected in Pass 1/2 but worth catalog-pattern noting because the apostrophe-insertion is a recurring Whisper failure for plural-form place names (cf. catalog A "place-name apostrophe insertion" pattern). |
| 20.P4.5 | (Pass 1 row 20.20) "Lerner String / King James Bond" | (cross-entry contamination flag — does not belong in entry #20) | n/a — indexing artifact | indexing | Pass 1 row 20.20 explicitly notes "a name in the McLaurin transcript, not Jones — flag for cross-ref." This row should be **removed from entry #20's corrections table** in any master-MD consolidation and re-housed in entry #17 (McLaurin) if not already there. Indexing cleanup, not a transcription error. |
| 20.P4.6 | (Subject paragraph) "court-martialed and given an undesirable discharge as a security risk" | discharge type was "undesirable" (canonical correct); but the court-martial framing requires clarification | medium | canonical-clarification | Jones's 1953-54 Army discharge was administrative ("undesirable" — the lowest non-punitive discharge category at that time), reached after a board hearing on his alleged communist sympathies; he was **not court-martialed** in the strict military-trial sense. ACLU attorney Stanley Faulkner won an upgrade to honorable on appeal in 1956. The Pass 1 Subject paragraph's "court-martialed" framing is a common popular conflation but is technically inaccurate. Recommend clarifying to "administrative discharge board / undesirable discharge." |
| 20.P4.7 | "Stanley Faulkner" (Pass 1 row 20.8, Pass 2 row 20.P2.8) | Stanley Faulkner | (confirmation; consider corpus-promotion) | canonical | Already identified at speaker-originating, but Faulkner is canonically documented: a National Lawyers Guild attorney who specialized in Cold War security-clearance / discharge-upgrade appeals + later represented Vietnam War conscientious objectors. The 1956 Jones appeal is one of his documented cases. Worth promoting from "speaker-originating" to a canonical-figure entry. |

**Fact-check findings (verification of high-confidence rows + Subject paragraph claims):**

| Claim | Status | Notes |
|---|---|---|
| Jones b. 1931, Philadelphia | confirmed | Canonical: Clarence Benjamin Jones, b. January 8, 1931, Philadelphia, PA. |
| Columbia College '53 | confirmed | Canonical: Columbia College AB 1953. |
| Boston University Law School | confirmed | Canonical: BU School of Law LLB 1959. |
| "Personal attorney and speechwriter to MLK from 1960 onward" | confirmed | Canonical: Jones met King in Feb 1960 via Judge Hubert T. Delany's recruitment for the *State of Alabama v. King* tax/perjury case; served as personal attorney + draft speechwriter 1960-68. |
| "Co-drafted I Have a Dream speech (Aug 28, 1963)" | confirmed (with scope clarification) | Canonical: Jones drafted the opening "promissory note" passage. The "I have a dream" peroration itself is King's extemporaneous improvisation prompted by Mahalia Jackson's "Tell him about the dream, Martin!" — see Pass 2T #20.P2T.41. Jones did not write the "dream" anaphora. |
| "SCLC general counsel" | confirmed | Canonical: Jones served as SCLC counsel 1961-68; not a continuously titled "general counsel" but functionally so. |
| Stepfather-in-law: Daniel H. Crena de Iongh, first Treasurer of the World Bank | confirmed | Canonical: Daniel H. Crena de Iongh, Dutch banker, World Bank Treasurer 1946-52 (per World Bank archives). Pass 1's "Krenge" spelling is incorrect; Pass 2's "Crena" is correct. |
| Hendrik Verwoerd, PM of apartheid South Africa 1958-66, assassinated 1966 | confirmed | Canonical dates. Verwoerd was assassinated September 6, 1966 by parliamentary messenger Dimitri Tsafendas. The "stepfather-in-law's best friend / personal banker" relationship is corroborated in Jones's published narratives. |
| Polykarp Kusch, 1955 Physics Nobel, Columbia professor | confirmed | Canonical: shared 1955 Nobel with Willis Eugene Lamb. |
| Linus Pauling, 1954 Chemistry Nobel + 1962 Peace Nobel | confirmed | Canonical dates correct. |
| W. Warder Norton, founder W.W. Norton & Company | confirmed | Canonical: William Warder Norton (1891-1945) co-founded the firm in 1923. |
| Lorraine Hansberry / *A Raisin in the Sun* / first Black woman with a Broadway play | confirmed | Canonical: *A Raisin in the Sun* opened March 11, 1959. |
| Robert Nemiroff: husband of Hansberry; co-creator *To Be Young, Gifted and Black* | confirmed | Canonical: Nemiroff (1929-91), Hansberry's husband 1953-64. |
| Charles White, UCLA-affiliated Black painter | confirmed (with institution correction) | Canonical: White taught at **Otis Art Institute** (then a USC-affiliate, now Otis College of Art and Design) from 1965-79, **not UCLA**. Pass 2 #20.P2.19 says "UCLA Otis College" which is an artifact (Otis was a separate institution). Recommend correcting to "Otis Art Institute / Otis College of Art and Design" in master MD. |
| Romare Bearden, Black collagist + Spiral Group founder | confirmed | Canonical: Spiral founded 1963 with Bearden, Norman Lewis, Hale Woodruff, Charles Alston, and others. |
| Jack O'Dell / Hunter Pitts O'Dell, SCLC voter registration | confirmed | Canonical (1923-2019). The JFK warning to MLK in June 1963 specifically named Stanley Levison + Jack O'Dell as the FBI's two communist-tie concerns. |
| Stanley Levison, MLK's white financial adviser/ghostwriter | confirmed | Canonical: Levison (1912-79) was the FBI/COINTELPRO's central pretext for the Bureau's MLK surveillance, including the wiretap of MLK's hotel rooms. |
| Walter Reuther, UAW president 1946-70 | confirmed | Canonical dates. Reuther died in a 1970 plane crash. |
| A. Philip Randolph, March on Washington director | confirmed | Canonical: Randolph (1889-1979) was the March's titular director; Bayard Rustin was the operational organizer. |
| Bayard Rustin, March on Washington chief organizer | confirmed | Canonical. |
| Bernard Lee, MLK aide-de-camp 1960-68 | confirmed | Canonical: Lee (1935-91) was with King at the Lorraine Motel April 4, 1968. |
| Mahalia Jackson, "Tell him about the dream, Martin!" prompt during 1963 speech | confirmed | Canonical: the moment is corroborated by multiple eyewitnesses including Jones himself. |
| Roberta Flack, "Killing Me Softly with His Song" 1973 | confirmed | Canonical: Flack's recording released 1973; Lori Lieberman is the original songwriter inspiration. |
| Mason Temple, Memphis COGIC HQ, "Mountaintop" speech April 3, 1968 | confirmed | Canonical. |
| Willard Hotel, Washington DC, MLK's pre-March-on-Washington drafting venue | confirmed | Canonical: the Washington Hilton-area Willard Hotel; MLK's room was bugged by the FBI. |
| Chase Manhattan Bank / Nelson Rockefeller bail-bond authorization | confirmed | Canonical: in May 1963, Rockefeller personally authorized Chase's emergency cash release for the Birmingham bail-bond fund. |
| Eric prompt claim: "founded the Institute for Nonviolence Initiatives" | unverified | See 20.P4.1. No such institute is documented. Canonical post-Movement institutional affiliations are (a) Stanford King Institute (visiting scholar/fellow 2009-13), (b) USF Institute for Advanced Studies in Nonviolence (founded c. 2014, named for Jones 2015). Recommend prompt/Subject-paragraph correction. |
| Eric prompt claim: "Wall Street investment banker post-Movement" | confirmed | Canonical: Jones co-founded Carter, Berlind, Potoma & Weill (1970) precursor activity in the late 1960s; was the first Black member of the NYSE via Allen & Co. in 1971. |

**Net-new catalog patterns surfaced:**

| Pattern | Recurrence in this entry | Cross-corpus relevance | Catalog section |
|---|---|---|---|
| Speech-passage Whisper-failure cluster ("promissory note" / "all for air" / "insufficient funds are a general" rendered as nonsense when the model fails to detect a speech being quoted) | 3 distinct renderings in tight sequence (Pass 3 already flagged as 20.P3.2) | High — any entry where a speaker quotes a canonical speech (Dream, Letter from Birmingham Jail, Atlanta Exposition Address, Selma "How long? Not long," LBJ "We Shall Overcome" speech, etc.) is at risk. Pass 4 elevates this to a catalog-G pattern with explicit named-speech-passage subcategorization. | G (named-speech-passage failure cluster) |
| Apartheid-Northern-publishing-aristocracy linkage (Jones's stepfather-in-law banker to Verwoerd) | Single but elaborately developed | Low — unique to Jones's biography. Worth preserving as a corpus-notable single but not a recurring pattern. | (n/a) |
| Place-name apostrophe insertion (Cornwell's Heights → Cornwells Heights) | 1 occurrence | Medium — Whisper inserts spurious possessive apostrophes on plural place names. See also "Saint Helena's" patterns. | A (place-name apostrophe insertion) |
| Single-word-Whisper-collision-to-occupation-noun ("a wired worker" for "Walter Reuther", "a Philorandov" for "A. Philip Randolph", "for purchase, Lyon" for "perjury", "the Hammers" for "the Bahamas") | 4+ occurrences in this entry | High — Whisper systematically converts unfamiliar proper nouns into nearest occupation-noun + adjective phrases. Pass 4 catalogues this as a distinct failure mode worth adding to catalog F. | F (proper-noun → occupation-noun collision) |
| Mid-interview interviewer middle-initial error correction (Klein says "Clarence V. Jones"; Jones corrects to B.) | 1 occurrence | Low — occasional interviewer slip. Pattern not catalog-worthy on its own, but worth noting that any Whisper-transcribed name attributed to the interviewer should be cross-checked against the subject's self-correction. | (n/a) |

**Net-new ground-truth corpus candidates:**

- William Robert Ming Jr. (1911-1973): Chicago civil rights attorney; lead defense counsel in *State of Alabama v. King* 1960; NAACP LDF cooperating attorney; first Black tenured professor at the University of Chicago Law School. Should be added alongside Hubert T. Delany / Fred Gray as the canonical Alabama-1960 King-defense trio.
- Stanley Faulkner (1914-2000): National Lawyers Guild attorney specializing in Cold War security-clearance / military-discharge-upgrade appeals; won Jones's 1956 discharge upgrade; later represented Vietnam War conscientious objectors. Foundational civil-liberties-bar figure.
- Donald Shapiro (1925-2008): NYU School of Law dean 1968-83; previously Boston University Law professor; mentored Jones at BU. Civil-rights-academic-mentorship figure.
- Mahalia Jackson (1911-1972): Queen of Gospel; canonical "Tell him about the dream, Martin!" prompt during the 1963 March on Washington speech. Foundational Black-gospel-music + civil-rights-movement figure. Civil_rights_facts.json should add her as a standalone entry given her direct causal role in the most-quoted speech in American history.
- Daniel H. Crena de Iongh (1888-1970): Dutch banker; first Treasurer of the World Bank (1946-52). Already noted in Pass 3 candidates but Pass 4 confirms canonical spelling **Crena** (not Pass 1's "Krenge"). Worth adding to corpus with the apartheid-South-Africa biographer connection as the linkage rationale.

**Adversarial-review flag updates:**

| Original row | Action (resolved / retained / new) | Notes |
|---|---|---|
| 20.P2T.2 Visitor Island -> Emerald Isle | retained | Phonetic match remains weak. Adversarial pass should attempt Catholic-mission-school destination disambiguation (Aran Islands, Erin Isle, or a specific Sisters of the Blessed Sacrament mission location). |
| 20.P2T.6-7 Donald Shapiro / Leslie Scharlaw | partially resolved | Donald Shapiro promoted to high in Pass 4 (canonical BU/NYU Law dean). Leslie Scharlaw remains low — adversarial pass should attempt Revue Productions 1959-60 general-counsel cross-check via MCA/Universal corporate archives. |
| 20.P2T.12 Judge Huigilini -> Judge Hubert T. Delany | resolved (with role correction) | Pass 4 confirms Delany as senior defense counsel (NOT chief — that was William Robert Ming Jr.). Adversarial pass should verify Ming as chief counsel and reduce Delany's role accordingly in any downstream summary. |
| 20.P2T.30 a wired worker -> Walter Reuther | resolved | Canonical. Promoted by Pass 4 to a catalog-F failure-mode example. |
| 20.P2T.36 will at hotel -> Willard Hotel | resolved | Canonical (Washington DC's Willard Hotel, FBI-bugged). |
| 20.P2T.37 Chaseman Hatton Bank -> Chase Manhattan Bank | resolved | Canonical; Nelson Rockefeller's authorization confirmed. |
| 20.P2T.43 Missonic Temple -> Mason Temple | resolved | Canonical. |
| 20.P2T.50 Omega Boys Club / Joseph Marshall Jr. | resolved | Canonical (SF program, founded 1987; Marshall Jr. is the founder, b. 1948, MacArthur 1994). |
| 20.P4.NEW.1 | new | Subject-paragraph fact-check finding: "Institute for Nonviolence Initiatives" (from Pass 4 prompt) is unverified. Adversarial pass should check against (a) Stanford King Institute, (b) USF Institute for Advanced Studies in Nonviolence, (c) any other Jones-named institute the prompt may be conflating. |
| 20.P4.NEW.2 | new | Subject-paragraph fact-check finding: "court-martialed" framing for Jones's 1953-54 Army discharge is technically inaccurate (administrative discharge board, not court-martial). Adversarial pass should adjudicate this distinction in any downstream summary. |
| 20.P4.NEW.3 | new | Charles White's institutional affiliation: Pass 2 says "UCLA Otis College" but Otis Art Institute was not UCLA-affiliated. Adversarial pass should verify the canonical institution name (Otis Art Institute → Otis College of Art and Design). |

**Audit-complete assessment:** Pass 4 brings entry #20 to publication-ready status with two Subject-paragraph corrections required (Crena spelling, court-martial framing) and one external Pass-4-prompt claim flagged as unverified ("Institute for Nonviolence Initiatives"); all canonical-figure rows confirmed against authoritative sources.

**Audit-complete marker**: Pass 4 complete on entry #20 as of 2026-05-22.
