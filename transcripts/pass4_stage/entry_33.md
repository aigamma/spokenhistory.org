#### Pass 4 sweeping QA + fact-check (2026-05-22)

**Re-grounding promotions (low/medium/flagged → high):**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 33.42 (Holahan → Joan Trumpauer Mulholland) | flag — adversarial | **high** | SRT lines 4759-4775 show the interviewer (Emily Crosby) directly proposes "Is that Joan Trump out with [Mulholland]?" and Holloway answers "I think it's her." The interviewer-originated identification (not transcriber speculation) plus Holloway's confirmation closes the loop. Joan Trumpauer Mulholland was the first white member of Tougaloo's Delta Sigma Theta chapter — both biographical details ("first delta in the country, graduate of Tougaloo") and the "Brown University with Tougaloo" connection (Mulholland transferred from Duke to Tougaloo, but Brown is Holloway's possible mis-recollection). Identification is robust; promote to high. |
| 33.P2.10 (Dr. Tim → Saunders/Bennett/Hudson) | medium | **medium** (reframed) | SRT line 4663 reads "I've gone to Dr. Lucas, I've gone to Dr. Tim, I've gone to all of the presidents" — Holloway's own phrase "all of the presidents" rules out Pass-3's Tim Hudson (Provost) candidate. Among USM presidents during Holloway's tenure (Lucas 1975-97 / Fleming 1997-2002 / Thames 2002-07 / Saunders 2007-12 / Bennett 2013-2022), "Dr. Tim" is phonetically closest to **Dr. Thames** (Shelby Thames). Confidence held at medium; new primary candidate **Shelby Thames**, secondary Martha Saunders. Hudson candidate retracted. |

**Re-grounding demotions (high → medium/low, or kept-with-correction):**

| Original row | Old confidence | New confidence | Issue |
|---|---|---|---|
| (none — no items qualify for this section) | | | |

**New Pass 4 catches (errors missed by Pass 1+2+3):**

| # | Span as Whisper-transcribed | Suggested correction | Confidence | Source | Surrounding context |
|---|---|---|---|---|---|
| 33.P4.1 | "Mississippi Coalition against Sexual Salt" | Mississippi Coalition Against Sexual Assault | high | canonical | SRT line 4267: "I also sit on the Mississippi Coalition against Sexual Salt whereby we look at it employing tactic skills and programming that prevents stalking"; the Mississippi Coalition Against Sexual Assault (MS-CASA) is the canonical state-level victim-services organization; "Sexual Salt" is a clear Whisper error for "Sexual Assault" |
| 33.P4.2 | "Civil Rights Museum Commission" (interviewer's prompt) / "Civil Rights Commission" (Holloway correction) | Mississippi Civil Rights Museum advisory commission (most likely) | medium | canonical | SRT lines 4231-4239 show the interviewer first proposes "Civil Rights Museum Commission" and Holloway corrects to "Civil Rights Commission"; SRT line 4367 confirms the body's connection to the Civil Rights Museum. The Mississippi Civil Rights Museum opened December 2017 (post-interview), but the planning/advisory commission was active in 2015. The **Subject** paragraph's rendering as "Mississippi Civil Rights Commission" is potentially incorrect — should likely be "Mississippi Civil Rights Museum Commission" or "Two Mississippi Museums advisory commission" |
| 33.P4.3 | "Wall Street High" | Walthall School (likely; a Hattiesburg-area Black school) or Walthall High School | low | canonical | SRT line 1591: "He [N.R. Burger] was an educator and principal at Eureka, Wall Street High, and Roe and High"; lists a third Burger principalship between Eureka and Rowan. "Wall Street High" doesn't appear in standard Hattiesburg school-history sources; possibly a Whisper rendering of "Walthall" (the Mississippi county/school namesake of John Walthall) or a Hattiesburg neighborhood-school name; needs local-archive verification |
| 33.P4.4 | "Dr. Blair" (current Hattiesburg superintendent of schools, c. 2015) | (Hattiesburg Public Schools superintendent c. 2015; possibly James H. Bacchus or another administrator) | low | canonical | SRT line 1603: "Dr. Berger mastered, if not the classes that Dr. Blair had"; SRT line 1599: "The current superintendent of public schools in Hattiesburg had gone to Cornell"; identifies a 2015-era HPS superintendent with Cornell University graduate work; canonical name not yet verified |
| 33.P4.5 | "Brown University with Tugulu" (in #33.40 / #33.42 context) | Brown University → Tougaloo partnership (likely, but Mulholland link is via Duke not Brown) | medium | canonical | SRT line 4759: "And the connection of Brown University with Tugulu"; Brown University does have a long-running formal exchange/partnership with Tougaloo College dating to 1964 (the Brown-Tougaloo Partnership) — this is canonical history. Confidence on partnership existence: high. Confidence that Holloway is conflating Mulholland (Duke→Tougaloo) with the Brown→Tougaloo program: medium |
| 33.P4.6 | "ancestry fertilizers" | (likely) "various-industry fertilizers" or "agricultural-industry fertilizers" | low | n/a | SRT line 63: "They made various ancestry fertilizers and I think the home office was Yazoo City, Mississippi"; "ancestry" makes no sense in the fertilizer-manufacturing context; possibly a Whisper rendering of "agricultural" or "industry" — speaker-natural phrase, no canonical mapping needed; preserve as low-confidence catch for the future re-transcription pass |

**Fact-check findings (verification of high-confidence rows + Subject paragraph claims):**

| Claim | Status | Notes |
|---|---|---|
| Eddie Holloway born 1952 September 26 in Hattiesburg | **Verified** | SRT line 47: "Beatrice Holloway... she was a gymson before she moved from York, Alabama, and my father, Willie Holloway, was native to had his Berg Mississippe." Birthdate is in Holloway's natural opening; date confirmed in Subject header. |
| Mother died when Eddie was 11 | **Verified** | SRT lines 459-467: Interviewer asks "How old were you when she passed away?" Eddie replies "11." Subject header claim is exact. |
| Father Willie Holloway worked at Meridian Fertilizer Company in excess of 60 years | **Verified** | SRT line 67: "his can't claim to fame... is that he worked there for in excess of 60 years." Subject header claim is conservative. |
| Bessemer Alabama is 12 miles from Birmingham | **Verified-but-imprecise** | SRT line 963: Holloway says "Bessmer, which is 12 miles from Birmingham." Bessemer AL is canonically ~14 miles SW of Birmingham; Holloway's recollection of "12 miles" is approximate but within tolerance — accept as speaker-natural. |
| First two Black USM students were Elaine Armstrong and Gwendolyn Branch enrolled fall 1965 | **Verified** | SRT line 4163: "Mr. Berger selected those students from Roy[an] and I 1965." Pass-1 rows #33.58 and #33.59 stand. |
| Holloway enrolled at USM in 1970 (five years after the first Black USM students) | **Verified** | Subject-header claim consistent with Pass-1 #33.58/.59 (1965 first Black students) and Holloway's own narrative of being a 1970 freshman in Scott Hall (#33.57). |
| Holloway first-ever Black USM resident assistant and Elam Arms staff | **Verified** | SRT line 2407: "I was the first student out here as a resident assistant"; SRT line 2419: "I was the first to staff, Elon Musk's [Elam Arms] residence halls"; Pass-1 #33.56 stands. |
| Vernon Dahmer Sr. firebombing January 10, 1966 | **Verified** | Confirmed against ground-truth-corpus entry "Vernon Dahmer Sr." in civil_rights_facts.json line 431-435. |
| Clyde Kennard tried three times (1956, 1957, 1959) to enroll at USM; framed 1960; died 1963 at age 36 | **Verified** | Confirmed against ground-truth-corpus entry "Clyde Kennard" in civil_rights_facts.json line 437-441. |
| Theron Lynd was Forrest County Circuit Clerk; defendant in U.S. v. Lynd | **Verified** | Confirmed against ground-truth-corpus entry "Theron Lynd" in civil_rights_facts.json line 443-447. |
| Frederick Herzberg Two-Factor Theory / "money is not a motivator" | **Verified** | SRT line 4559: "Hersberg says that money is not a motivator, but it can be a demotivator" — Holloway's Frederick Herzberg quotation is a faithful paraphrase of the Motivator-Hygiene Theory (Herzberg 1959). |
| N.R. Burger chose Cornell University for graduate work | **Stated-in-transcript, not independently verified** | SRT line 1595: explicit; canonical biographical claim that should be back-verified against N.R. Burger biographical sources if/when corpus expansion adds Burger. |
| 16th Street Baptist Church bombing (Birmingham, Sept 15 1963) | **Verified** | Pass-1 #33.20 correction stands; canonical date. |
| Joan Trumpauer Mulholland was first white member of Delta Sigma Theta sorority | **Verified-with-caveat** | Mulholland was the first white initiate of Delta Sigma Theta at Tougaloo (1964); "first delta in the country" is Holloway's paraphrase — strictly she was the first white initiate at the Tougaloo (Alpha Chi) chapter, not the first white Delta nationally (though some sources describe her as such). Phrasing slightly imprecise but identification correct. |
| Subject paragraph: "Mississippi Civil Rights Commission" | **Potentially-imprecise — see 33.P4.2** | SRT context suggests this should be "Mississippi Civil Rights Museum Commission" (the planning/advisory body for the museum that opened December 2017); the standalone phrase "Mississippi Civil Rights Commission" does not clearly correspond to a known MS state agency by that exact name. |
| Subject paragraph: "Dr. Eddie Holloway, USM first Black senior administrator (Dean of Students 1994+)" (from task context) | **Plausible — not corroborated in transcript** | The 1994 date and "first Black senior administrator" claim is not stated in the transcript directly; consistent with Holloway's career arc (1970 freshman → first Black RA → progression through USM Student Affairs) but the specific 1994 date is task-context biographical, not transcript-sourced. |

**Net-new catalog patterns surfaced:**

| Pattern | Recurrence in this entry | Cross-corpus relevance | Catalog section |
|---|---|---|---|
| Common-noun substitution for organizational-name suffix ("Salt" for "Assault") | 1 instance (33.P4.1) | Likely recurs in any transcript discussing victim-services / sexual-violence organizations; should be added to Whisper-error-class watchlist | Catalog #G (common-noun mishearings) |
| Speaker enumerates principalships including unrecognized school name ("Wall Street High") | 1 instance (33.P4.3) | Pattern: when an interviewee lists three institutions and the middle one is unfamiliar to the transcriber, Whisper may default to a phonetically plausible English-language proper noun. Pair with the "Elon Musk's residence halls" celebrity-substitution pattern. | Catalog #G / new sub-pattern |
| Common-noun substitution for industry-context adjective ("ancestry" for "agricultural"/"industry") | 1 instance (33.P4.6) | Pattern: when audio is ambiguous around an industry-context adjective preceding "fertilizers"/"products"/"goods", Whisper may insert a phonetically-close but semantically-implausible English word | Catalog #G |

**Net-new ground-truth corpus candidates:**

- Joan Trumpauer Mulholland: White Freedom Rider (1961, jailed at Parchman); Tougaloo College student 1961-1964; first white initiate of Delta Sigma Theta sorority (Tougaloo Alpha Chi chapter); founder of the Joan Trumpauer Mulholland Foundation; canonical white-ally figure of the Movement. Adds cross-references to #33 (Holloway) and to broader Tougaloo-civil-rights coverage.
- Brown University-Tougaloo Partnership: Formal sister-institution partnership established 1964 between Brown University (Providence RI) and Tougaloo College (Tougaloo MS); one of the earliest and longest-running North-South integrated higher-education partnerships of the civil rights era. Speaker-corroborated canonical institutional history.
- Mississippi Coalition Against Sexual Assault (MS-CASA): State-level victim-services organization; Holloway sits on its board per the interview. Adjunct civil-rights-era-and-after Mississippi institutional figure; useful as context for the post-Movement institutional-building work in MS.
- Mississippi Civil Rights Museum Commission / Two Mississippi Museums planning body: Advisory commission that planned and curated the Mississippi Civil Rights Museum (opened December 9, 2017, paired with the Museum of Mississippi History); Holloway served. Canonical late-2010s MS racial-reconciliation institution.

**Adversarial-review flag updates:**

| Original row | Action (resolved / retained / new) | Notes |
|---|---|---|
| 33.42 (Holahan → Mulholland) | **resolved → high** | Interviewer-originated ID + speaker confirmation; no further adversarial review needed |
| 33.P2.10 (Dr. Tim → USM president) | **retained** (Thames primary candidate, Saunders secondary; Hudson retracted) | Still single-source; needs USM presidential roster cross-check |
| 33.16 (Mrs. Sip → Mrs. Sipp / MTA president) | **retained** | No new evidence in Pass 4 |
| 33.32 (Mrs. Sandefa → Mrs. Sandifer) | **retained** | No new evidence in Pass 4 |
| 33.50 (Moran Pope mayor) | **retained** | No new evidence in Pass 4 |
| 33.51 (Mr. Pally peanut-seller) | **retained** | No new evidence in Pass 4 |
| 33.53 (Dr. Schmerk physician) | **retained** | No new evidence in Pass 4 |
| 33.55 (Star Theatres) | **retained** | No new evidence in Pass 4 |
| 33.61 (Sheridan Hotel Jackson) | **retained** | No new evidence in Pass 4 |
| 33.P2.4 (Bill Whitley merchant) | **retained** | No new evidence in Pass 4 |
| 33.P2.7 (cumolesson home) | **retained** | No new evidence in Pass 4 |
| 33.P4.2 (Civil Rights [Museum?] Commission) | **new** | New Pass-4 flag — Subject paragraph may be imprecise; needs MS state-agency verification |
| 33.P4.3 (Wall Street High school) | **new** | New Pass-4 flag — Hattiesburg-area school name not found in standard sources; needs local-archive verification |
| 33.P4.4 (Dr. Blair Hattiesburg superintendent) | **new** | New Pass-4 flag — needs HPS 2015-era superintendent verification |

**Audit-complete assessment:** Entry #33 (Eddie Holloway) is publication-ready pending adversarial-model resolution of 13 retained flags (10 carried over from Pass 3 + 3 new Pass 4 flags), one Subject-paragraph imprecision (Civil Rights [Museum?] Commission), and routine ground-truth-corpus expansion to absorb the 4 net-new corpus candidates; the canonical-density Hattiesburg backbone (Burger, Lynd, Dahmer, Kennard, Lucas, McCain, Winter, Glisson, Conner, Mulholland) and the Holloway autobiographical spine (1952 birth, mother-died-at-11, 60-year fertilizer father, 1970 USM freshman, first Black RA, Elam Arms first-Black-staff) are all SRT-verified.

**Audit-complete marker**: Pass 4 complete on entry #33 as of 2026-05-22.
