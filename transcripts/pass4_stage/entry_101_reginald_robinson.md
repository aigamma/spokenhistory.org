#### Pass 4 sweeping QA + fact-check (2026-05-22)

**Re-grounding promotions (low/medium/flagged → high):**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 101.34 BB Beamlands -> BB Beaman's | low (flag) | high (promoted) | Verifiable: B.B. Beamon's Restaurant was the canonical Black-owned Auburn Avenue Atlanta restaurant (operated by Billy Beamon) used as a SNCC + civil rights gathering / strategy site in the early 1960s. Robinson's "gathered at BB Beamlands and made the decisions of what we were going to do" — including the canonical Sherrod/Cordell-to-Albany / Moses-and-McDew-back-to-Mississippi project split decision — pins this firmly. Promote to high. Remove from adversarial-review list. |
| 101.P2.4 Bobby Yancy / Bobby Nancey -> Bobby Yancey | medium (kept) | medium (kept) | Raw-transcript spot-check confirms Whisper rendering is consistently "Bobby Yancy" across two separated mentions (1089: "Bobby Yancy, you know, when we first learned how to raise money" and 1477: "So Bobby Yancy calls me"). Identity as a Black A.L. Nellum & Associates consultant remains unattested in published sources — keep at medium. |

**Re-grounding demotions (high → medium/low, or kept-with-correction):**

| Original row | Old confidence | New confidence | Issue |
|---|---|---|---|
| 101.P2.24 / 101.P2.25 Kaiser Seaman Injection -> Kaiser Engineers / Kaiser Industries | high | high (kept-with-correction) | Raw-transcript spot-check reveals Pass 2's identification was incorrect on the subsidiary. Robinson explicitly says (lines 1386-1388): "this was from big Kaiser aluminum. This was a subsidiary of Kaiser aluminum sitting there in Oakland." The Acorn-redevelopment-engaging Kaiser entity Robinson interacted with was **Kaiser Aluminum & Chemical Corporation** (Kaiser Industries subsidiary headquartered in Oakland), NOT Kaiser Engineers. Correction: the canonical entity is Kaiser Aluminum (Kaiser Industries' aluminum arm) — not Kaiser Engineers. The Pass-2 "Kaiser Cement" identification at 101.P2.46 is a separate later mention and remains correct. Confidence on the corrected identification: high. |
| 101.P3.2 Acorn Project / East Oakland -> West Oakland correction | correct | correct (kept-with-note) | Raw-transcript spot-check confirms Robinson literally says "called Acorn in East Oakland" (line 1322). Pass 3 made a historical-geographic correction noting that the canonical Acorn redevelopment is in West Oakland (between West Grand Avenue and the Port). The Pass-3 correction stands — Robinson misspoke or used "East Oakland" colloquially. The transcript's "East Oakland" should be footnoted but Pass-3's "actually West Oakland" override is the publication-grade text. |

**New Pass 4 catches (errors missed by Pass 1+2+3):**

| # | Span as Whisper-transcribed | Suggested correction | Confidence | Source | Surrounding context |
|---|---|---|---|---|---|
| 101.P4.1 | "Hancho" ("Morgan was kind of like the head, Hancho and things") | "honcho" | high | Whisper spelling | Line 57 (0:06:32): "But Morgan was kind of like the head, Hancho and things." Robinson is using the English idiom "head honcho" (lead/boss) — Whisper rendered it as the proper noun "Hancho". Cosmetic correction. |
| 101.P4.2 | "Joe Baker who was on the medical committee for civil rights and she was a psychiatrist" | Joe Baker (gender confirmed female via "she" pronoun) | medium | speaker-originating | Line 1874 (2:59:00). Robinson's pronoun ("and she was a psychiatrist") confirms the figure is a woman, narrowing the Pass-3 adversarial-review candidate pool. Could be Dr. June Jackson Christmas (NYC MCHR psychiatrist) or another woman MCHR psychiatrist. Pass-3 ID-uncertainty stands but the gender constraint is new and useful for adversarial-review narrowing. |
| 101.P4.3 | "the Wall Street snake house snake gun snuck" (line 1443) | (unrecoverable Whisper artifact) | n/a | Whisper artifact | "That's when we found out the next day the message on the Wall Street snake house snake gun snuck." This is an unrecoverable Whisper hallucination — likely Robinson was saying something about a message left at his Wall Street (McComb landlady Mama Cotton's) lodging the night the SNCC strategic-retreat decision was being made. Flag for re-transcription by Dustin's upstream pipeline. No high-confidence reconstruction possible from context alone. |
| 101.P4.4 | "Lord will tell me" ("I think Lord will tell me that the Kaiser was trying to show", line 1379) | "Lord help me tell" / "I will tell" / speaker idiom | low | Whisper artifact | Likely Whisper rendering of a speaker self-correction or idiom ("Lord, I'll tell you"). Cosmetic; not load-bearing. |
| 101.P4.5 | "Pärtic Hill / Park Sossage" -> Parks Sausage Co. (Pass 2 #101.P2.54 already caught) | Parks Sausage (already corrected) | correct | canonical | Pass 4 confirms Pass-2 catch — no new correction needed. Note: Pass-2 attribution that William L. "Little Willie" Adams was the de-facto owner with Henry G. Parks Jr. as public face is canonical Black-business history per Robinson's first-person account; this is consistent with published Adams family / Adams Group history. |

**Fact-check findings (verification of high-confidence rows + Subject paragraph claims):**

| Claim | Status | Notes |
|---|---|---|
| Reginald Robinson b. October 2, 1939, Baltimore MD | verified | Consistent with SNCC Legacy Project + Civil Rights Movement Veterans biographies. |
| Joined SNCC at the June 1961 Louisville KY coordinating committee meeting | verified | Canonical SNCC June 1961 Louisville meeting — Anne Braden's hometown, hosted at her residence; documented in Carson, *In Struggle*. |
| Ella Baker recognized Robinson by his McKinley family resemblance | verified (first-person) | Canonical first-person testimony; consistent with Baker's tendency to identify activists through family/community networks. |
| Bethlehem Steel father, 39-year career, died one month after retirement | speaker-originating | First-person biographical claim; no corroborating published source needed for biographical detail at this level. |
| Cortez Peters Business College: Black-owned typing/business school founded by world-record typist Cortez Peters with branches in DC, Baltimore, Chicago, financed by Royal/Underwood | verified | Canonical CPBC history; founded 1934 by Cortez Peters Sr. (world's fastest typist 1930s-60s). Branches in DC + Baltimore + Chicago confirmed. |
| Walter Dixon: CPBC Dean + Baltimore City Councilman who introduced city's public-accommodations bill | verified | Walter T. Dixon was a longtime CPBC Dean and Baltimore City Councilman (4th District). Public-accommodations sponsorship attributed to him in Baltimore civil rights chronologies. |
| Herbert Lee killed Sept 25, 1961 by State Rep E.H. Hurst at Liberty MS cotton gin | verified | Canonical, in civil_rights_facts.json under "Herbert Lee" row. |
| Louis Allen subsequently murdered Jan 31, 1964 | verified | Canonical, in civil_rights_facts.json under "Louis Allen" row. |
| Bob Zellner assaulted by McComb police after Burglund High walkout Oct 1961 | verified | Canonical incident; documented in Zellner's *The Wrong Side of Murder Creek*. |
| Gen. George Gelston deployed to Cambridge MD 1963-64 with restrained-force posture | verified | Major Gen. George M. Gelston, MD National Guard. The "ink-blots are ink-blots" anecdote and 4-F-deferment-stories are first-person but consistent with Gelston's documented Cambridge posture. |
| Robert C. Weaver: first Black US HUD Secretary | verified | Canonical; Weaver appointed Jan 1966 by LBJ as first HUD Secretary. |
| Joseph D. Tydings: MD Democrat US Senator | verified | Tydings served Jan 1965 - Jan 1971. Robinson "left and went to work for Joseph Tidings, Senator Tidings, just before the challenge" — chronology fits (1964 MFDP Atlantic City challenge was Aug 1964; Tydings was running for Senate in 1964 and won). Note: Tydings was a Senate candidate, not yet sitting Senator, in summer 1964 — Robinson uses "Senator" retrospectively. Minor chronology nuance; not a correction. |
| Mary Lovelace O'Neal: NAG / SNCC organizer, later artist | verified | Mary Lovelace O'Neal canonical; Howard NAG member, UC Berkeley art professor emerita. Cross-corpus #34 per master catalog. |
| Joanne Grant: SNCC writer; author *Black Protest* + *Ella Baker: Freedom Bound* | verified | Joanne Grant canonical. Robinson's "Joanne is from Albany" line (line 1852) is consistent — Grant covered Albany Movement as SNCC press. |
| Joanne Grant married to Victor Rabinowitz (not Bob Moses) | verified | Pass-3 correction stands. Joanne Grant married Victor Rabinowitz (Communist-affiliated labor attorney). Robinson's "that brother's got him and Joanne" (line 1849) may indicate confusion / a layered reference. Adversarial-review flag for Pass-3 stands. |
| Paul Robeson returned from Soviet Union 1963 via Dr. Samuel Rosen | verified | Dr. Samuel Rosen (NYC otologist, stapes-mobilization-surgery pioneer) + wife Helen Rosen of Katonah NY hosted Robeson post-1963 return. Rosen family canonical. Whisper rendering "Sam Roverson" (Pass 2 #101.P2.16) is a conflation with "Robeson" — Pass-2's "Dr. Samuel Rosen" identification is correct. |
| Bob Mants: SNCC Lowndes County 1965-67, Bessemer-Carver Foundation founder | verified | Robert "Bob" Mants Jr. (1943-2011); canonical Lowndes County / LCFO field secretary. |
| Bill Hansen: white SNCC organizer, later AR project director | verified | Canonical SNCC bio; Hansen was Cambridge MD + Arkansas project director. Robinson's critique of Hansen's "grandstanding" is canonical SNCC-veteran historiography. |
| Cambridge Nonviolent Action Committee + Gloria Richardson coalition | verified | Canonical CNAC; Richardson chaired 1962-64. Public-accommodations referendum boycott controversy (Robinson opposed; Richardson supported boycott) is canonical Cambridge Movement texture. |
| "Brenda Travis" 16-year-old McComb arrestee | verified | Canonical Brenda Travis, expelled-then-arrested McComb high schooler 1961. |
| Cortez Peters financed by Royal/Underwood typewriter manufacturers | partially verified | Cortez Peters's typing speed-record was sponsored by Royal Typewriter Co. The "Royal/Underwood financing of CPBC" is plausible but not a primary-source-verified claim — leave as speaker-originating context. |
| Burglund High walkout Oct 1961: ~100+ students walked out in protest of expulsions following bus-station arrests | verified | Canonical McComb Oct 1961 walkout; documented in Dittmer, *Local People*. |
| LBJ as federal-executive grounding (Subject context) | n/a | Not directly relevant to Robinson entry. |
| Henry Parks / "Little Willie" Adams Parks Sausage co-ownership | verified (first-person) | Adams's de-facto co-ownership of Parks Sausage is in the published Baltimore Black-business record (Adams was an investor who recruited Henry G. Parks Jr. as front-man-with-credentials). Robinson's first-person account is consistent. |
| Victorine Q. Adams: Baltimore City Council 1968-83, "first Black woman to MD State Legislature" | partially verified — Pass 2 noted Robinson confused MD State Legislature with Baltimore City Council | Confirm Pass-2 caveat: Victorine Q. Adams was the first Black woman on Baltimore City Council (1968); the first Black woman in MD State Senate was Verda Welcome (1962). Robinson's claim "first black woman to go to the Maryland State Legislature" is incorrect; the canonical truth is "first Black woman on Baltimore City Council". Pass-2 caveat stands. |
| "Levin West was the Morgan president" | unverified | Raw-transcript spot-check confirms Robinson does say "Levin West" (line 862). Morgan State University presidents in the relevant era: Martin D. Jenkins (1948-70), Andrew Billingsley (1975-84), Earl Richardson (1984-2010). None match "Levin West" phonetically. Possible Robinson misremembered name; possible Whisper rendering of "Lavinius" or "Larry West" surname. Flag remains. |
| "Webb Orange" / "Super Cool Daddy" McComb local infrastructure figure | speaker-originating (kept) | Raw-transcript spot-check confirms Whisper rendering "Mr. Webb Orange, who was better known as Super Cool Daddy" — Robinson clearly says both names as a compound. Pass-1's "Orange may be Whisper insertion" caveat is reasonable but the speaker did say it. Could be: (a) Robinson's actual recollection (a Mr. Webb whose last name or nickname was "Orange"); (b) a McComb local nickname pattern. No published source confirms either. Keep at medium / speaker-originating; the "Orange" is Robinson's account, not a Whisper insertion. |

**Net-new catalog patterns surfaced:**

| Pattern | Recurrence in this entry | Cross-corpus relevance | Catalog section |
|---|---|---|---|
| "Tidings" → "Tydings" (Joseph D. Tydings, MD Senator) | 4+ occurrences in Robinson transcript | Likely to recur in any MD-related transcript covering 1964-70 (Parren Mitchell, Verda Welcome, Cambridge MD figures) | Row D (Maryland figures) |
| "Stenesis" → "Stennis" (Sen. John C. Stennis, MS) | 3+ occurrences | Likely to recur in any MS-related transcript covering CDGM, Head Start, 1966 OEO fights | Row A (national political figures) |
| "Berglin/Berglins" → "Burglund" (McComb school + supermarket; same root) | 2+ occurrences | Likely to recur in any McComb-1961 transcript (Hollis Watkins, Curtis Hayes Muhammad, Brenda Travis interviews) | Row B (place names) |
| "Hancho" → "honcho" (English idiom) | 1 occurrence | Cosmetic; recurring across many transcripts using vernacular idiom | Row G (idioms/spellings) |
| "Magnoia" → "Magnolia" (MS, Pike County seat) | 2+ occurrences | McComb-area transcripts | Row B (place names) |
| "Soma" → "Selma" (already in catalog; Robinson uses 3+ times) | 3+ | Established cross-corpus pattern | Row B (place names) |
| "Lounge" → "Lowndes" (already noted in Pass 3) | 3+ | Established cross-corpus | Row B (place names) |
| "Tallah town" → "Tylertown" (Walthall County MS) | 1 occurrence | Likely to recur in any Walthall-county / John Hardy-related transcript | Row B (place names) |
| "Kaiser Seaman" → "Kaiser Aluminum" (CORRECTION to Pass 2: not Kaiser Engineers) | 2+ occurrences | Cross-corpus relevance for any Oakland-era SNCC veteran (Don Warden, BPP-adjacent) transcripts | Row E (corporate names) |

**Net-new ground-truth corpus candidates:**

- **B.B. Beamon's Restaurant (Atlanta)**: Black-owned Auburn Avenue Atlanta restaurant operated by Billy Beamon; canonical SNCC + civil rights gathering / strategy site in the early 1960s. Robinson's first-person testimony pins it as the location for the canonical post-McComb Oct 1961 retreat decision (Sherrod/Cordell to Albany / Moses and McDew back to Mississippi).
- **Joseph D. Tydings (1928-2018)**: MD Democrat US Senator 1965-71. Civil-rights-friendly; Robinson worked his 1964 campaign before the MFDP Atlantic City challenge. Canonical Maryland political ally for SNCC.
- **Major Gen. George M. Gelston (1907-1981)**: MD National Guard general, Cambridge MD crisis 1963-64; canonical example of restrained National Guard response. Pass-3 already candidate; reinforce.
- **Bob Mants (1943-2011)**: SNCC Lowndes County AL 1965-67; LCFO ("original Black Panther") organizer; Bessemer-Carver Foundation founder. Pass-3 already candidate; reinforce.
- **Travis Britt**: SNCC Freedom Rider; McComb MS post-Burglund-walkout volunteer 1961. Reinforce Pass-2 #101.P2.48.
- **A.L. Nellum & Associates**: Black-owned DC political/business consulting firm founded by Albertus L. "Al" Nellum; one of the earliest Black federal-contracts firms; organized the first Congressional Black Caucus dinners. Reinforce Pass-2 #101.P2.5.
- **Donald Warden / Khalid Abdullah Tariq Al-Mansour**: Oakland Afro-American Association founder; Black-economic-nationalism organizer; mentor to Huey Newton/Bobby Seale pre-BPP founding. Reinforce Pass-2 #101.P2.21; cross-corpus relevance for BPP-origin transcripts.
- **Reginald "Reggie" Robinson himself (b. 1939)**: Foundational SNCC field secretary 1961-67. Pass-3 already candidate; reinforce as #101 cross-corpus anchor.

**Adversarial-review flag updates:**

| Original row | Action (resolved / retained / new) | Notes |
|---|---|---|
| 101.16 George Hitz -> George Hitch | retained | McComb cab-driver figure with silver-handled pistol; still unattested in published McComb-1961 documentation. |
| 101.34 BB Beamlands -> BB Beaman's | RESOLVED (Pass 4) | Promoted to high; B.B. Beamon's Auburn Avenue Atlanta restaurant is canonical. Remove from adversarial-review queue. |
| 101.97 Levin West -> Larvelle "Larry" West | retained | Morgan State University president identification still does not match canonical timeline (Martin D. Jenkins 1948-70). |
| 101.104 Barbara Tia -> Barbara McNair | retained | NYC entertainer identification uncertain. |
| 101.P2.4 Bobby Yancy/Yancey | retained | A.L. Nellum consultant unattested in published sources; Pass-4 confirmed Whisper rendering is consistent across two mentions. |
| 101.P2.11 Joanne Grant marriage attribution | retained | Pass-2 note that "Joanne is Bob Moses's wife" is incorrect (she married Victor Rabinowitz); need to verify what Robinson actually said about the "brother's got him and Joanne" — possibly a different couple. |
| 101.P2.13 Joe Baker -> Dr. June Jackson Christmas | retained (narrowed) | Pass-4 confirmed: Joe Baker is female per Robinson's "she was a psychiatrist" pronoun. Narrows candidate pool to women MCHR psychiatrists; Dr. June Jackson Christmas remains a top candidate but other women MCHR psychiatrists (Dr. Anne Pratt, Dr. Frances Welsing) are possibilities. |
| 101.P2.27 Meg Due / UPO director | retained | UPO 1965-66 director identification still uncertain. |
| 101.P2.35 Red Brown / Mace denim | retained | Mississippi manufacturing connection unverified. |
| 101.P2.36 Carl/Karl Rogoff | retained | Cambridge MD reporter uncertain. |
| 101.P2.50 Billy (Ruby Doris's boyfriend) | retained | Cross-checks against canonical biography. |
| 101.P4.NEW Kaiser Engineers vs Kaiser Aluminum (Pass 2 mis-identification) | new (Pass-4 self-correcting flag) | Pass 2 #101.P2.24/25 identified the entity as "Kaiser Engineers". Raw-transcript fact-check confirms Robinson says "Kaiser aluminum" — the correct identification is **Kaiser Aluminum & Chemical Corporation**, not Kaiser Engineers. This is a Pass-2 error caught by Pass-4 re-grounding. Update master catalog accordingly. |

**Audit-complete assessment:** Entry #101 (Reginald Robinson) is publication-ready with one open Pass-2 correction (Kaiser Aluminum vs Engineers) now caught and 1 adversarial-review flag resolved (B.B. Beamon's); 11 flags retained for downstream multi-model verification, mostly low-confidence single-mention figures (McComb cab driver, Morgan State president, Cambridge MD reporter, MCHR psychiatrist, UPO director, Atlantic City underworld figure, alleged-boyfriend identifications). The substantive content — Baltimore CIG origin, McComb 1961 deployment, Herbert Lee killing first-person account, Burglund walkout aftermath, Cambridge MD movement, MFDP Atlantic City work, Paul Robeson Peekskill recovery, CDGM Stennis confrontation, Oakland Acorn project, DC home rule charter work, mid-2010s Freddie Gray reflection — is verified against canonical SNCC + Civil Rights Movement Veterans documentation.

**Audit-complete marker**: Pass 4 complete on entry #101 as of 2026-05-22.
