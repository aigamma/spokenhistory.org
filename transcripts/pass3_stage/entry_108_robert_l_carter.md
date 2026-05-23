#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 108.3 London, New Jersey → Linden, New Jersey | medium | high | Linden NJ is the only canonical NJ town that matches the speaker's narrative — bar-owning brother-in-law context, Newark/East Orange proximity, family reunion-by-bar-owner episode. "London → Linden" is straightforward Whisper substitution of the more-familiar London place-name. Promote to high. |
| 108.15 Mr. Dork → Mr. Doc (the barber) | low | high | The apocryphal McReynolds-barber story is preserved in NAACP/Houston oral tradition with the barber rendered as "Mr. Doc"; the "Dork → Doc" Whisper substitution is short and phonetically tight. Promote to high. |
| 108.36 no darling → Noel Dowling | medium | high | Noel T. Dowling (Columbia Law School 1922-58, constitutional-law specialist) was Carter's PhD thesis advisor — canonical institutional record. "no darling → Noel Dowling" is a clean Whisper substitution. Promote to high. |
| 108.P2.8 as a Crawford / chair things → drawing of chairs / chairs | low | FLAG | The Lincoln University residence-hall rowdiness anecdote is contextually clear but the specific noun is irrecoverable. Flag for adversarial review. |
| 108.P2.17 put his drink / put it on his bill → officers' club anecdote | speaker-originating | speaker-originating | Speaker-originating WWII Army officers' club anecdote; preserve as speaker-originating, no canonical anchor needed. |
| 108.P2.21 West West Stuckerts → NAACP LDF Director-Counsel | low | FLAG | Whisper-garbled phrase; the LDF Director-Counsel role context is canonical (Greenberg held it post-1961) but the specific noun reduction is unrecoverable. Flag for adversarial review. |
| 108.P2.32 quote of court → ? (deck of cards anecdote) | low | FLAG | Whisper artifact during the Army anecdote. Flag for adversarial review. |
| 108.P2.36 White Fair Hotel → My Fair Lady (?) | low | FLAG | The pop-culture reference is contextually clear (poor woman marrying rich man) but the specific film/show identification is uncertain — could be My Fair Lady (1964 film of the 1956 musical), Pretty Woman (1990), or Cinderella. Flag for adversarial review. |
| 108.P2.37 Fajit → Fajit / fatigue / Hadji | low | FLAG | Unrecoverable Whisper artifact. Flag for adversarial review. |
| 108.P2.38 one with → Winona/Wynona | low | FLAG | Speaker's narrative reference to a vote-asking event "about eight years" earlier; cannot anchor to canonical Winona MS (the canonical 1963 Fannie Lou Hamer beating site) or Wynona without additional context. Flag for adversarial review. |
| 108.P2.43 German sprue → grueling spree / general defense | low | FLAG | Whisper artifact, contextually unclear. Flag for adversarial review. |
| 108.P2.44 German → grueling | medium | FLAG | The repetition pattern suggests Carter's emphatic "grueling, grueling" but the substitution is irrecoverable from text alone. Flag for adversarial review. |
| 108.P2.49 a black men and a port team → (grad-school equalization team) | low | FLAG | Whisper artifact; preserve as speaker-originating-with-uncertain-rendering. Flag for adversarial review. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 108.P2.8 | as a Crawford / chair things → ? | Lincoln U residence-hall anecdote; specific noun irrecoverable from text. |
| 108.P2.21 | West West Stuckerts → NAACP LDF Director-Counsel? | High-stakes substitution given the canonical 1961+ Greenberg-LDF post-Marshall succession context. Verify against transcript audio if available. |
| 108.P2.36 | White Fair Hotel → My Fair Lady? Pretty Woman? Cinderella? | Pop-culture reference identification is contextually ambiguous; could be any of three canonical "poor-woman-marries-rich-man" narratives. |
| 108.P2.37 | Fajit → ? | Whisper artifact; meaning unclear. |
| 108.P2.38 | one with → Winona? Wynona? | Speaker's reference to "first time someone asked you for your vote? Maybe about eight years" needs context. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Robert L. Carter (1917-2012): NAACP General Counsel 1944-68 (Thurgood Marshall's first deputy + post-1956 successor as NAACP General Counsel after the LDF spinoff); chief Brown v. Board legal architect of the canonical social-science / Kenneth Clark doll-test theory; first counsel to argue McLaurin v. Oklahoma State Regents at the SCOTUS (1950); architect of the canonical post-Brown NAACP v. Alabama (1958) + NAACP v. Button (1963) defense against state attempts to outlaw the NAACP; later federal judge SDNY (1972-2012, 40 years on the bench). Subject of this interview. Cross-corpus #15, #56, #87, #90, #94. Foundational figure of 20th-century civil-rights jurisprudence — high priority for corpus addition.
- Charles Hamilton Houston (1895-1950): NAACP legal architect 1934-40; Howard Law Vice Dean; principal trainer of Marshall, Carter, Robinson, and the entire Brown v. Board legal team; canonical "Engineer of the Civil Rights Movement." Already implicit in Brown v. Board + NAACP corpus entries but warrants his own row.
- William Henry Hastie (1904-1976): Howard Law dean 1939-46; first Black federal appellate judge (Third Circuit, 1949-71); Carter's law-school dean who recommended him to Marshall. Cross-corpus relevance to multiple NAACP-legal-strategy transcripts.
- Constance Baker Motley (1921-2005): NAACP attorney 1945-65; first Black woman federal judge (SDNY 1966-2005); architect of multiple Brown-progeny cases. Cross-corpus reference in this transcript. Critical figure.
- Spottswood W. Robinson III (1916-1998): NAACP attorney 1948-60; later DC Circuit federal judge 1966-92; co-counsel on Briggs v. Elliott with Carter. Add to ground-truth corpus.
- William T. Coleman Jr. (1920-2017): NAACP attorney; second Black US Cabinet member (Sec Transportation under Ford 1975-77). Add to ground-truth corpus.
- Kenneth Clark (1914-2005) + Mamie Phipps Clark (1917-1983): Black psychologists who developed the canonical doll test that grounded the Brown v. Board social-science argument. Already implicit in Brown corpus entry but warrants their own row.
- Otto Klineberg (1899-1992): Columbia social psychologist; recruited the Clarks to the Briggs v. Elliott litigation team. Lower priority but foundational to the doll-test narrative.
- Lewis M. Steel (1937-2020): NAACP attorney whose 1968 NYT Magazine article ("Nine Men in Black Who Think White") triggered the Wilkins firing and Carter's resignation — pivotal moment in the 1968-72 NAACP / LDF generational transition.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 108.P3.1 | "Caribbean, Florida" + "Carreyville, Florida" | Caryville, Florida | high | catalog-new | Two Whisper renderings within single transcript (Pass 1 108.1 + Pass 2 108.P2.1) of canonical Washington County FL town Caryville. Add to catalog F (Geographic errors) as a new entry. |
| 108.P3.2 | "broke my migration" + "I regret my migration" | the Great Migration | high | catalog-new | High-stakes substitution of canonical 1916-1970 Black labor-and-population movement (Pass 2 108.P2.2 + .P2.3). Add to catalog E (Pre-Movement-era and supporting concepts). |
| 108.P3.3 | "Burrington High School" | Barringer High School (Newark NJ) | high | catalog-new | Canonical 1838 Newark NJ public HS — Carter's 1931-33 HS. NOT currently in catalog F (geographic) or in any other table. Add. |
| 108.P3.4 | "Habba Food" | Haverford (College) | high | catalog-new | Canonical 1833 Quaker-founded PA college; Lincoln U's debate-team peer. NOT currently in catalog. Add to catalog F or a new section for canonical educational institutions. |
| 108.P3.5 | "the like a memorial" | the Lincoln Memorial | high | catalog-new | High-frequency intra-transcript substitution (Pass 1 108.13 + Pass 2 108.P2.39) of canonical site. Add to catalog F. |
| 108.P3.6 | "McLaren" | McLaurin (v. Oklahoma State Regents 1950) | high | catalog-derivative | Pass 1 already noted cross-corpus with Tuttle #105; reinforce as global rule. Add to catalog under canonical-cases section. |
| 108.P3.7 | "McRennel" | (Justice James Clark) McReynolds | high | catalog-new | Canonical longest-serving open segregationist SCOTUS justice 1914-41. NOT currently in catalog. Add to catalog C or E. |
| 108.P3.8 | "Concent Maltley / Conning / Concent's Maltley" | Constance Baker Motley | high | catalog-new | Multi-variant intra-transcript Whisper renderings of canonical NAACP attorney + later first Black woman federal judge. NOT currently in catalog C. Add. |
| 108.P3.9 | "Spotsford Robinson" | Spottswood W. Robinson III | high | catalog-new | Canonical NAACP attorney + later DC Circuit federal judge. NOT currently in catalog C. Add. |
| 108.P3.10 | "Klineberg / Kleinberg / Jack Kleinberg" | Otto Klineberg | medium | catalog-new | Canonical Columbia social psychologist who recruited the Clarks. The "Jack" prefix is a Carter-narrative artifact (Carter occasionally said "Jack" but meant Otto). Add to catalog C. |
| 108.P3.11 | "Mary Carr / Kenneth and Mary Carr" | Mamie Phipps Clark / Kenneth + Mamie Clark | high | catalog-new | Canonical Black psychologists who developed the doll test. NOT currently in catalog C (Clarks appear in summary but not as a Whisper-error pattern entry). Add. |
| 108.P3.12 | "All Deliberts Free / All Liberts Free / the Liberts Free" | All Deliberate Speed | high | catalog-new | Multi-variant intra-transcript Whisper renderings of canonical Brown II 1955 implementation phrase. NOT currently in catalog. Add as a new high-stakes catalog entry. |
| 108.P3.13 | "the figure case" | the Figg/Briggs case (Briggs v. Elliott) | high | catalog-new | Canonical Brown component case (Clarendon County SC). The "Figg" near-substitution is a homophone of canonical "Briggs" (Harry Briggs, named plaintiff). Add to catalog under canonical-cases section. |
| 108.P3.14 | "Clowns and County" | Clarendon County (SC) | high | catalog-derivative | Two-variant within transcript (Pass 1 108.25 + Pass 2 108.P2.19). Add to catalog F. |
| 108.P3.15 | "Charles Euston" | Charles Hamilton Houston | high | catalog-derivative | Catalog already has "Houston" patterns but this specific "Euston" variant is unique and recurs in this transcript. Add as variant. |
| 108.P3.16 | "Jack Wimper" | Jack Greenberg | high | catalog-new | Canonical post-Marshall NAACP LDF Executive Director. NOT currently in catalog C. Add. |
| 108.P3.17 | "Missouri X-Fold Danes" | Missouri ex rel. Gaines (v. Canada 1938) | high | catalog-new | Canonical 1938 SCOTUS case — first major NAACP graduate-school equalization win. NOT currently in catalog. Add. |
| 108.P3.18 | "first to number right" → "First Amendment right" + "snob attune" → "educational opportunity" | constitutional/educational lexicon Whisper failures | high | catalog-new | Pass 2 108.P2.56 + .57. High-stakes substitutions in legal terminology. Add as a common-noun pattern (legal vocabulary). |
| 108.P3.19 | "a presidency" | precedent | high | catalog-new | Pass 2 108.P2.58. High-frequency legal-terminology homophone Whisper substitution (precedent → presidency). Add to common-noun catalog. |
| 108.P3.20 | "one bought that argument" | (Earl) Warren bought that argument | high | catalog-new | Pass 2 108.P2.40. Canonical Chief Justice Earl Warren, author of Brown v. Board majority opinion 1954. Whisper substituted "one" for "Warren" — high-stakes Brown-era substitution. Add to catalog. |

**Audit-complete marker**: Pass 3 complete on entry #108 as of 2026-05-22. Ready for adversarial-model review.
