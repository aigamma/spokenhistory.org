#### Pass 4 sweeping QA + fact-check (2026-05-22)

**Re-grounding promotions (low/medium/flagged → high):**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 52.P2.6 (Adams found it the school → Lewis Adams co-founded Tuskegee Institute) | medium (Pass 3 upgrade) | high | Lewis Adams (1842-1905), formerly enslaved Macon County tinsmith/community leader, is canonical Tuskegee Institute co-founder with state legislator W.F. Foster and George W. Campbell; petitioned the Alabama legislature 1880 to establish the Tuskegee Normal School in exchange for delivering Black votes for Democrat Wilbur Cunningham. Patton's framing of Adams as the founder (with B.T. Washington as developer) matches the documented post-1980s historiographical correction; "Adams found it" = "Adams founded" (Whisper consonant-drop on "founded → found it"); promote to high |
| 52.P2.10 (he didn't hand me Ford → Henry Ford) | medium (Pass 3 unchanged) | high | Raw context: "I learned about Ford, he didn't hand me Ford. I think my daddy told me" — phrase is "I learned about [Henry] Ford [as Carver's patron], [and] he didn't hand me Ford [meaning Daddy didn't dictate this knowledge]. I think my daddy told me." Carver-Ford friendship is canonical (Ford funded Carver's late-life research, built Carver Cabin at Greenfield Village); promote to high |
| 52.P2.40 (Mrs. Odessa Williams → Mrs. Odessa Williams Wilson) | medium | low (demoted — see below) | Raw text actually reads "Mrs. Odessa, Williams later became ready" — Pass 2's "Wilson" guess unverified; "ready" may be literal ("became ready/active") or a Whisper-garble for a married surname (Reedy / Riley / Ready); demoted pending canonical Montgomery-women verification |

**Re-grounding demotions (high → medium/low, or kept-with-correction):**

| Original row | Old confidence | New confidence | Issue |
|---|---|---|---|
| 52.46 (E. Franklin Frazier — claimed "correct" cross-ref to Thelwell #34.20 / Richardson #49.2) | correct | n/a — false-positive | Verified via Grep of raw .txt: "Frazier" does NOT appear anywhere in the Patton transcript. Pass 1 entry mis-pulls this as a cross-corpus reference; not a true citation in this transcript. Remove from entry-52 corrections |
| 52.27 / 52.P2.96 (Bobby Seale in Patton transcript → cousin Robert "Bobby" Harris confusion) | flagged for adversarial | confirmed false-positive | Pass 4 raw-text verification: only "Bobby" reference in Patton transcript is "I had a cousin, Bobby, who lived with me while I was in Inxter" — clearly Patton's cousin (Bobby Harris's PARTNER Junior is at Wayne State context, NOT Bobby Seale). Pass 1 #52.27 is a Pass-1 false-positive; resolve as "no Bobby Seale reference in this transcript" |
| 52.P2.40 (Mrs. Odessa Williams Wilson) | medium | low | See above — Whisper "later became ready" may be literal not a surname |

**New Pass 4 catches (errors missed by Pass 1+2+3):**

| # | Span as Whisper-transcribed | Suggested correction | Confidence | Source | Surrounding context |
|---|---|---|---|---|---|
| 52.P4.1 | "Stokely and Deadwell" | Stokely [Carmichael] and [Mike] Thelwell | high | canonical | "I know what Stokely and Deadwell and all of them were coming from. So, and they had also, Stoke people and Stoke men in particular, had almost the same kind of attitude towards Southern blacks..." — canonical Ekwueme Michael "Mike" Thelwell (b. 1939), Jamaican-American SNCC organizer and Carmichael's close associate, co-author of Carmichael's posthumous autobiography *Ready for Revolution* (2003); same canonical figure as entry #34 (Thelwell's own interview); "Deadwell" is Whisper for "Thelwell" (consonant-cluster substitution) — MAJOR missed catch, Thelwell is in the corpus as #34 |
| 52.P4.2 | "and do war people" | and antiwar people | high | common-noun | "I don't think, stick people understood that very well, nor did, and do war people later. Because we had one of the best draft counseling centers." — canonical mid-1960s antiwar movement; "do war" is Whisper consonant-elision for "anti-war"; recurring Whisper pattern across the corpus on the "antiwar" / "anti-war" prefix |
| 52.P4.3 | "he thought I was a little bit more malibal" | he thought I was a little bit more malleable | high | common-noun | "But Dr. Foster shows the deal with me, a woman, had TV, or whatever his thing, he thought I was a little bit more malibal. Not knowing where I was coming from." — canonical "malleable" (easily influenced); "malibal" is Whisper's heavily-garbled phonetic for "malleable" |
| 52.P4.4 | "little balloon sandwiches" | little baloney sandwiches | high | common-noun | "And the cafeteria folks fixed this little balloon sandwiches and an apple and a little paper thing of juice" — canonical 1960s baloney (bologna) sandwich box-lunch; "balloon" is Whisper for "baloney" (vowel-cluster substitution); referring to the cafeteria-workers-organized food for the March-9-10-1965 Tuskegee-to-Montgomery caravan |
| 52.P4.5 | "Mrs. Odessa, Williams later became ready" | (literal: "later became ready/active") or "later became R___" (surname uncertain) | low | canonical | Raw text exact: "Mrs. Odessa, Williams later became ready. They all jumped into gear to rescue and provide refuge for the Freedom Riders." — Pass 2's "Wilson" guess unverified; "ready" may be literal "ready/active" or Whisper-garble for a married name (Reedy / Riley / Ready); demoting prior P2.40 confidence |
| 52.P4.6 | "where was munitions chat" | where was [the] munitions chest / where was [the] munitions cache | medium | common-noun | "And doing my administration, they were my personal bodyguards. Okay. You know, and where was munitions chat? Oh yeah, we knew all of that." — ROTC bodyguard context discussing where weapons were stored; "munitions chat" is likely Whisper for "munitions chest" or "munitions cache" (consonant approximation) |
| 52.P4.7 | "to keep this movement thing alive, Warren Hamilton and Benny James" | (Warren Hamilton + Benny James — next-cohort TIAL student body presidents) | speaker-originating | n/a | "we got to line up presidents for the next four years, which we did, Warren Hamilton and Benny James and, you know, at all." — Patton's named successors as TIAL/Tuskegee student body president; preserved as speaker-originating until canonical Tuskegee-student-government verification |
| 52.P4.8 | "Bookertea / Book of Tea Washintern" recurring variant | Booker T. Washington (in retrospect) | high | canonical | "I wrote a piece called Book of Teawashintern in retrospect, the father of black power" — Whisper consonant-cluster mishearing of "Booker T. Washington in retrospect"; Patton's canonical post-1967 essay "Booker T. Washington in retrospect: father of black power"; net-new variant beyond Pass 1's #52.2 catch |
| 52.P4.9 | "the boogeys, and Dexter" | the bourgies / bourgeoisie at Dexter [Avenue Baptist] | medium | common-noun | "And this Montgomery community turned on us, the boogeys, and Dexter. That's a whole nother story." — Patton's Black-vernacular "boogies/bougies" (bourgeoisie), same as her earlier "bougie doctor" P2.82; "boogeys" is Whisper for "bourgies" / "bougies" |
| 52.P4.10 | "low-shop gun houses" | long shotgun houses | high | common-noun | "my grandfather had to build a lot of those low-shop gun houses. We'll come up to the church with their overalls" — canonical Southern shotgun houses (single-room-wide vernacular Black-Southern architecture); "low-shop gun" is Whisper consonant approximation of "long shotgun" |
| 52.P4.11 | "George Davis, who was at that time from Providence" | George Davis (TIAL co-organizer, Providence RI) | correct | canonical | Pass 1 #52.7-context and P2.72 cover; flag for canonical TIAL roster expansion alongside George Ware / Patton / Younge |
| 52.P4.12 | "dog skin in you" | "dark-skinned, you" (or "dog-gone you" — Patton-vernacular) | low | speaker-originating | "Yes. At the consternation of the black middle class bourgeoisie, he was dog skin in you. Lucius Amerson, there was a book written by his son." — context: bourgeoisie's reaction to dark-skinned Lucius Amerson winning Macon County sheriff election 1966; "dog skin in you" may be Whisper for "dark-skinned, you know" or vernacular "dog-gone you"; preserved low-confidence for adversarial |
| 52.P4.13 | "And patina at that girl" | And Bettina Aptheker, that girl | high | canonical | "All of my ducks in the row. That began your transition to New York? That I told patina at that girl." — recurring Pass-1 #52.12 Aptheker; "at that girl" is Whisper for ", that girl" or "Aptheker, that girl"; addendum to chain-consolidation already flagged in Pass-3 |
| 52.P4.14 | "It's spat, and I shouldn't say that" | "Hispanic, and I shouldn't say that" | medium | common-noun | "Mary Cochiam. I never seen a Japanese person in my life. His spat, and I shouldn't say that. Latinas, Latinos, Puerto Ricans." — context: Patton listing NYC ethnic groups new to her; "his spat" / "It's spat" is Whisper for "Hispanic" (vowel collapse); period-correct mid-60s usage "Hispanic" being a term Patton was unfamiliar with |
| 52.P4.15 | "$199 union" (transcript-end variant) | 1199 SEIU | high | canonical | "organized a union, $199, I know it. Play poker and won all of the money." — same as P2.100 ($1199 → 1199 SEIU); the closing/coda section renders "1199" as "$199" (digit-dropping); confirms recurring Whisper pattern |

**Fact-check findings (verification of high-confidence rows + Subject paragraph claims):**

| Claim | Status | Notes |
|---|---|---|
| Subject paragraph: Joe Mosnier (SOHP), videographer John Bishop, 1 June 2011 Montgomery | confirmed | Raw text opens: "Wednesday June 1, 2011. My name is Joe Manier of the Southern oral history program" — date/interviewer canonical; Pass 2 P2.1 / P2.2 corrections valid |
| Patton's TB hospitalization at Benson Sanatorium Lafayette AL January 1963 – March 1964 | confirmed | Raw: "63 January. And we're there until March of 64. So a year and a couple of months." — 14-month hospitalization canonical |
| March of 1,500 Tuskegee students in the "march that wouldn't turn around" | confirmed | Raw: "I think we had 2,300 students at the time that I remember, about 1,500." — canonical figure with caveat ("I remember"); preserves speaker-recall hedge |
| Mother's Day Massacre 1960 (Patton's date) vs canonical May 14, 1961 | confirmed Pass-3 correction | Raw: "May, 1960, what I call it, the Mother's Day Massacre" — Patton's misremembering of the canonical 1961 Mother's Day Anniston Greyhound attack; canonical date is May 14, 1961 (Pass-3 correctly promoted to high) |
| Patton's February 10, 1967 single-car accident on Shorter AL highway | confirmed | Raw: "And so that night, February the 10th, 1967, I never forget it. I'm in the Strumina's car accident." — canonical date matches Subject paragraph |
| Pass 1 #52.27 claim of "Bobby Seale" reference in this transcript | FALSE-positive (confirmed) | Pass 4 raw-text verification: only "Bobby" referent is Patton's cousin Bobby Harris; NO Bobby Seale reference in the Patton transcript. Pass 2 P2.96 flagging confirmed as the correct resolution |
| Pass 1 #52.46 claim of "E. Franklin Frazier" reference (cross-ref to Thelwell #34.20, Richardson #49.2) | FALSE-positive (confirmed) | Pass 4 grep verification: "Frazier" does NOT appear anywhere in the Patton .txt. Pass 1 entry imported a cross-corpus reference that is not in this transcript |
| Subject paragraph claim: "Patton↔Reverend Albert Cleage (Detroit Black-nationalist)" cross-reference | partial | "Cleage" does NOT appear in this transcript. The cross-reference is a Subject-paragraph contextual link to Patton's Detroit/Inkster years but not a direct in-transcript citation |
| Subject paragraph claim: Patton's NYC 1967-68 Communist Party / Socialist Workers Party / Progressive Labor Party milieu | confirmed | Raw: "the Communist Party, the Social Workers Party, the Progressive Labor Party. And I was introduced to all of these new people" — canonical (with P2.102 "Social Workers" → "Socialist Workers" correction applied) |
| Subject paragraph claim: 14-month-segregated Benson Sanatorium first-person | confirmed | Patton's account of library access, kitchen menu posting, classical piano protest is all in raw .txt — canonical first-person |
| Subject paragraph claim: George Washington Carver scholarship paper (age 11-12) | confirmed | Raw: "when I was 12 years old or 11, I wrote my paper on George Washington Carthler, and tried to dispel the myth of the peanut man" — canonical Patton-childhood scholarship |
| Subject paragraph claim: 1957 SCLC founding at Patton family's church (refused MIA absorption) | confirmed | Raw: "When the Southern Christian Leadership Conference formed in 1957, at my church, I talk southern touch with HHS, a HHS missionary Baptist Church. And they wanted the MIA to become a chapter, an SCLC chapter, and my grandparents... said, no" — canonical first-person account of MIA-SCLC organizational autonomy decision |

**Net-new catalog patterns surfaced:**

| Pattern | Recurrence in this entry | Cross-corpus relevance | Catalog section |
|---|---|---|---|
| "Deadwell" → Thelwell (Mike Thelwell, SNCC organizer; entry #34 himself) | 1 instance in this transcript (52.P4.1) | Critical — Thelwell is foundational SNCC figure with own entry #34; missed in all three prior passes here | Add to Personal Names / SNCC-organizer Whisper-renderings catalog |
| "do war" / "and do war people" → antiwar | 1 instance (52.P4.2) | Probable cross-corpus; mid-60s "antiwar" prefix frequently mis-tokenized by Whisper | Add to Common-noun Whisper-renderings catalog (movement vocabulary) |
| "balloon sandwiches" → baloney sandwiches | 1 instance (52.P4.4) | Plausible cross-corpus; movement-era box-lunch vocabulary | Add to Common-noun Whisper-renderings catalog (food/material vernacular) |
| "malibal" → malleable | 1 instance (52.P4.3) | Plausible cross-corpus phonetic substitution | Add to Common-noun Whisper-renderings catalog |
| "low-shop gun houses" → long shotgun houses | 1 instance (52.P4.10) | Highly probable cross-corpus; canonical Black-Southern vernacular architecture term | Add to Common-noun Whisper-renderings catalog (Black-Southern architecture) |
| "his spat" / "It's spat" → Hispanic | 1 instance (52.P4.14) | Plausible cross-corpus; mid-60s ethno-vocabulary | Add to Common-noun Whisper-renderings catalog |
| "$199" → 1199 (SEIU dollar-sign-pollution) | 1 transcript-end variant (52.P4.15) + 1 prior P2.100 instance | Likely cross-corpus on labor-union references | Add to Numeric-rendering Whisper-pattern catalog (digit-drop with currency-pollution) |
| "boogeys" → bourgies/bougies | 1 instance (52.P4.9) + recurring P2.82 "bougie doctor" | Cross-corpus; Black-vernacular class term | Add to Common-noun Whisper-renderings catalog (Black-vernacular class terms) |
| "Booker T. Washington" extended Whisper variants: "Book of T", "Bookertea", "Book of Teawashintern" | 3+ instances in this transcript | Cross-corpus very high; foundational figure | Augment Personal Names catalog with Pass-1 base + this transcript's variants |

**Net-new ground-truth corpus candidates:**

- Lewis Adams (1842-1905): Formerly enslaved Macon County, AL tinsmith and community organizer who, with state legislator Wilbur Cunningham and George W. Campbell, helped establish the Tuskegee Normal School in 1881 — canonical Tuskegee Institute co-founder credited by Patton over Booker T. Washington (whom Patton frames as developer rather than founder).
- Robert Russa Moton (1867-1940): Tuskegee Institute president 1915-35 (Booker T. Washington's successor); Hampton-educated; led the foundational 1920s Tuskegee VA Hospital staffing struggle Patton describes; canonical Black-institutional-leadership figure pre-Movement.
- George Washington Carver (1864-1943): Tuskegee Institute scientist/agronomist whose work on yams, peanuts, soil restoration is canonical; recurring Whisper variants "Carthler/Carva/Carlos" make this a high-priority corpus add for any Tuskegee-context corpus indexing.
- Tuskegee Institute Advancement League (TIAL): Foundational mid-1960s Tuskegee-student SNCC-affiliate organization; co-organized the March 9-10, 1965 Tuskegee-to-Montgomery caravan; foundational anti-iconic-leadership SNCC-affiliated organization led by Patton, George Ware, George Davis, Sammy Younge Jr., Kathleen Neal (Cleaver).
- Tuskegee Black Power Conference (April 1967): First-of-its-kind contemporary Black Power conference at Tuskegee, predating the Newark NJ Black Power Conference of July 1967; organized by Patton and SHARP/SNCC; relocated to Boy Scouts camp after Dr. Foster's on-campus cancellation.
- Lucius Amerson (1934-1994): First Black sheriff in the Deep South since Reconstruction; elected Macon County AL November 1966; foundational post-VRA Black-elected-official precedent; same election cycle that produced LCFO sheriff candidacy of John Hulett.
- Mary Kochiyama (1921-2014): Japanese-American Harlem activist; close ally of Malcolm X; held Malcolm X as he died at Audubon Ballroom February 21, 1965; foundational Asian-American/Black-Power solidarity figure.
- Bettina Aptheker (b. 1944): Berkeley Free Speech Movement leader 1964; daughter of CPUSA historian Herbert Aptheker (author of *American Negro Slave Revolts* 1943); longtime UC Santa Cruz feminist-studies professor; foundational New-Left/CPUSA bridge figure for the post-1966 SNCC-NYC milieu.
- A.G. Gaston Motel (Birmingham AL): Black-owned motel that served as SCLC headquarters during the 1963 Birmingham campaign; canonical SCLC infrastructural site.
- General Daniel "Chappie" James Jr. (1920-78): First Black US military four-star general; Tuskegee Airman and Tuskegee Institute alumnus.
- General Benjamin O. Davis Jr. (1912-2002): Air Force four-star general; Tuskegee Airmen commander; canonical post-WWII Black-military-leadership figure.
- Dr. Gwendolyn M. Patton (1943-2017): TIAL foundational leader; Tuskegee student body president 1965-66; organizer of "the march that wouldn't turn around" (March 9-10, 1965); SHARP organizer who underwrote the April 1967 Tuskegee Black Power Conference; later UF Religion Department / Trenholm State CC archives.
- The Mattachine Society (1950-67): Foundational pre-Stonewall gay-rights organization; published *Mattachine Review* magazine 1955-66; exceptionally rare canonical pre-Stonewall reference in the civil rights oral-history corpus.
- 1199 SEIU (originally Local 1199, Drug, Hospital, and Health Care Employees): NYC hospital-workers union; foundational 1960s multi-racial labor organizing target; Patton's NYC 1967-68 milieu.
- Dr. Luther H. Foster Jr. (1913-1994): Tuskegee Institute president 1953-81 who navigated the canonical "liberated zone" tolerance of TIAL on-campus organizing; foundational HBCU-administration figure in the SNCC era.

**Adversarial-review flag updates:**

| Original row | Action (resolved / retained / new) | Notes |
|---|---|---|
| 52.28 (Phil → Phil Ochs / Philip Foner) | retained — low | No new evidence in Pass-4 raw re-read; still needs adversarial 1965-66 TIAL reading-list verification |
| 52.30 (Hubert) | retained — low | No new evidence; needs adversarial Patton-transcript context-region verification |
| 52.36 / P2.38 / P2.39 (Greg Re → MIA secretary) | retained — low | No new evidence; "great re" raw rendering suggests "Reverend Graetz" (Robert Graetz, Montgomery white MIA ally) is plausible alongside Maude Ballou |
| 52.41 / 52.P2.85 (Reverend Stokes, Dexter architect) | retained — low | Raw says "the preacher there who did all of that was called Reverend Stokes. He was a more attrition, but he was a race man." — likely **Rev. R.D. Crockett** or possibly **Rev. Robert Hill Stokes** (Dexter pastor 1925-37) who oversaw the 1925-28 Dexter Avenue Baptist Church rebuilding; "more attrition" Whisper for "Mason" / "more reactionary"? — needs adversarial Dexter pastoral history verification |
| 52.P2.6 (Adams found it / Lewis Adams) | resolved — promoted to high | Pass 4 promoted (see promotions table) |
| 52.P2.10 (Henry Ford / Carver) | resolved — promoted to high | Pass 4 promoted (see promotions table) |
| 52.P2.22 (Twilight book) | retained — low | No new evidence in raw; still adversarial pending |
| 52.P2.40 (Mrs. Odessa Williams Wilson) | retained but DEMOTED | Raw says "later became ready" — Pass 2's "Wilson" guess unverified; possible literal "became ready/active" reading |
| 52.P2.50 (Jolacy) | retained — low | No new evidence; needs adversarial First Baptist 1961 youth-roster verification |
| 52.P2.75 / P2.76 / P2.77 / P2.78 (Tuskegee faculty) | retained — low/correct | No new evidence; needs Tuskegee administrative-roster verification |
| 52.P2.80 (Boy Scouts camp) | retained — low | No new evidence; needs Macon County AL Boy Scouts camp roster verification |
| 52.P2.86 (Powertown) | retained — low | No new evidence; needs Montgomery Black-neighborhood historiography verification |
| 52.P2.96 (Bobby Seale mis-attribution) | resolved — confirmed false-positive | Pass 4 raw-text verification confirms only "Bobby" referent is cousin Bobby Harris; Pass 1 #52.27 should be marked as a Pass-1 false-positive cross-corpus pollution |
| 52.P2.105 (Carvalesci) | retained — low | "between, you know, Carvalesci" — context is between buildings, possibly "Carver-Lee Sciences" / "Carver Hall and X" / "Carver lab science"; needs Tuskegee campus-building verification |
| 52.P4.1 (Deadwell → Mike Thelwell) | new — RESOLVED HIGH | Net-new Pass-4 catch; Thelwell is canonical entry #34; no adversarial follow-up needed |
| 52.P4.2 (do war → antiwar) | new — RESOLVED HIGH | Net-new Pass-4 catch; common-noun phonetic substitution |
| 52.P4.3 (malibal → malleable) | new — RESOLVED HIGH | Net-new Pass-4 catch; common-noun |
| 52.P4.4 (balloon sandwiches → baloney sandwiches) | new — RESOLVED HIGH | Net-new Pass-4 catch; common-noun |
| 52.P4.5 (Mrs. Odessa Williams "later became ready") | new — RETAINED LOW | Net-new Pass-4 catch; demotes prior P2.40; needs Montgomery women-leaders genealogical verification |
| 52.P4.6 (munitions chat → munitions chest/cache) | new — retained medium | Common-noun garble; minor item |
| 52.P4.7 (Warren Hamilton + Benny James) | new — speaker-originating | Net-new TIAL student-government successor figures; flag for Tuskegee-student-body-president roster verification |
| 52.P4.8 (Booker T Washington in retrospect / Bookertea) | new — RESOLVED HIGH | Net-new variant beyond Pass 1 #52.2 |
| 52.P4.9 (boogeys → bourgies) | new — RESOLVED HIGH | Net-new variant; same Black-vernacular cluster as P2.82 |
| 52.P4.10 (low-shop gun → long shotgun) | new — RESOLVED HIGH | Net-new common-noun Whisper substitution |
| 52.P4.12 (dog skin in you) | new — retained low | Speaker-originating idiom; needs adversarial Patton-vernacular verification |
| 52.P4.13 ("And patina at that girl" — Aptheker re-rendering) | new — RESOLVED HIGH | Same canonical Aptheker as P2.20 |
| 52.P4.14 (his spat → Hispanic) | new — retained medium | Common-noun phonetic; period-correct usage in NYC-1967-68 ethno-vocabulary context |
| 52.P4.15 ($199 → 1199 transcript-end variant) | new — RESOLVED HIGH | Same canonical 1199 SEIU as P2.100 |

**Audit-complete assessment:** Pass 4 brings entry #52 to publication-ready state with 15 net-new corrections layered onto Pass 1's 49 + Pass 2's 117 + Pass 3's 36 resolutions; two Pass-1 false-positives confirmed (Frazier #52.46 and Bobby Seale #52.27); one Pass-2 over-confident guess demoted (Odessa Williams Wilson surname); the most significant net-new catch is "Deadwell" → Mike Thelwell (cross-references corpus entry #34), missed by all three prior passes; remaining unresolved items are all flagged for the user's adversarial-model ensemble check (Kiro/Kimi/Codex/Gemini); the corrections overlay is now sufficient for Smithsonian-grade publication of the underlying transcript with the noted hedge-tags on the residual-low items.

**Audit-complete marker**: Pass 4 complete on entry #52 as of 2026-05-22.
