#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 123.1 (Rolling Wall / Roe Wall) | speaker-originating | speaker-originating + adversarial-flag | Holmes County rural community name; could be "Rolling Wall" (literal) or "Rolling Fork" (canonical MS Delta town, but in Sharkey County not Holmes). Defer to local geography lookup. |
| 123.2 (Ambrole School in Latin) | low | low + adversarial-flag | High school identification + "Latin → Lexington MS" both uncertain. Possibly canonical Saints Industrial and Literary School or Lexington Attendance Center. |
| 123.3 (Mayor Levin) | low | low + adversarial-flag | Holmes County figure name uncertain — possibly Lorenzi-related |
| 123.7 (Ralph Hayse) | speaker-originating | medium | Canonical Mileston 14 applicant per speaker; name plausible but not in independent corroboration. Promote to medium based on canonical Mileston 14 context. |
| 123.8 (Russian Whitaker / Russell Whitaker) | low | medium | Canonical Mileston 14 applicant; "Russell" is the plausible canonical correction. Promote to medium. |
| 123.9 (James Boyne / James Bourne) | medium | medium + adversarial-flag | Pass 2 left unresolved between "Boyne" and "Bourne" (cross-corpus #100); SME confirmation needed for canonical Mileston 14 applicant name |
| 123.13 (J. Young / J.J. Young) | speaker-originating | high | Canonical Durant-area martyr per speaker; reinforced in Pass 2 as ground-truth corpus candidate. Promote to high. |
| 123.15 (Reverend Eddie Clark) | speaker-originating | high | Canonical first Black US Congress candidate from Holmes County. Promote to high. |
| 123.16 (Saigon Pagoda) | low | low + adversarial-flag | Holmes County Black-church name — likely "Salem Pagoda" or another similar local-church name; needs Holmes County church-registry lookup |
| 123.19 (Reverend Mr. M. Crawford) | low | low + adversarial-flag | Holmes County Black minister + movement leader — needs SME confirmation |
| 123.P2.4-5 (Ambrole / At Latin → Lexington MS) | medium-high | high | Speaker repeatedly refers to "Latin" as town — context (Lexington MS as Holmes County seat) makes the geographic correction certain. Promote to high. |
| 123.P2.6 (Iowa Hoppe) | low | low + adversarial-flag | Holmes County local place name uncertain |
| 123.P2.8 (Marvell Walker / Maynard Walker) | low | low + adversarial-flag | Speaker's gospel-singing partner; name uncertain |
| 123.P2.11 (W-H-T-N-L-E radio station) | low | low + adversarial-flag | Local Holmes/Carroll County radio station call letters; possibly WHTN-L-E or local AM station |
| 123.P2.30 (Hooker / lawyer name) | low | low + adversarial-flag | Lawyer who bailed out the Durant 12 arrestees — name uncertain |
| 123.P2.36 (Dr. McLean / McLeod) | medium | medium + adversarial-flag | Holmes County 1967 state-office candidate; full surname spelling uncertain |
| 123.P2.37 (Bow-Belling Smith) | low | low + adversarial-flag | Holmes County Sheriff 1960s; full name uncertain |
| 123.P2.41 (Tony Zivolich) | low | low | Pass 2 notes this is N/A here (cross-corpus only); resolve as out-of-scope |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 123.1 | "Rolling Wall" Holmes County community | Local-geography lookup needed |
| 123.2 | "Ambrole School in Latin" → Lexington MS high school | Holmes County Black-school 1940s-50s identification |
| 123.3 | "Mayor Levin" Holmes County figure | Lorenzi-circle local-figure identification |
| 123.9 | James Boyne vs. James Bourne (cross-corpus #100) | Mileston 14 applicant canonical name |
| 123.16 | "Saigon Pagoda" Holmes County church | Holmes County Black-church-registry lookup |
| 123.19 | Reverend M. Crawford Holmes County | Holmes County minister + movement-leader 1960s |
| 123.P2.6 | Iowa Hoppe local place | Holmes County micro-geography |
| 123.P2.8 | Marvell/Maynard Walker gospel partner | Speaker's 50+-year gospel-group lead partner |
| 123.P2.11 | W-H-T-N-L-E gospel-broadcast station | Holmes/Carroll County 1950s-60s AM radio |
| 123.P2.30 | "Hooker" Durant-12 bail lawyer | Civil-rights-lawyer identification (Hollis Watkins?) |
| 123.P2.36 | Dr. McLean / McLeod 1967 state-office | Holmes County 1967 movement-slate full surname |
| 123.P2.37 | Sheriff Bow-Belling/Bobby-Bell-In Smith | Holmes County 1960s sheriff full name |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Mileston Fourteen — canonical April 1963 group of 14 Holmes County Black-land-owning farmers who attempted to register to vote at the Lexington MS courthouse + formed the Mississippi Freedom Democratic Party's Holmes County base; foundational MFDP-era organizing group; Hartman Turnbow was the canonical first applicant
- Hartman Turnbow — canonical Mileston (Holmes County MS) armed-defense farmer; first of the Mileston 14 to attempt voter registration April 1963; canonically firebombed May 1963 + returned fire to defend his family; foundational MS-armed-defense figure (already flagged in catalog section I)
- Robert G. Clark Jr. — canonical first Black to be elected to the Mississippi House of Representatives in the 20th century (1967, Holmes County); canonical 1982 Education Reform Act chief House sponsor under Speaker Buddie Newman; representative for 36 years (already covered as #107)
- Sue Lorenzi Sojourner — canonical white Holmes County volunteer 1964-69 + 2013 author of *Thunder of Freedom: Black Activism in Holmes County, Mississippi* (with Cheryl Lynn Reed); foundational documenter of Holmes County movement
- J.J. Young — canonical Durant-area Holmes County civil-rights martyr; beaten to death in Durant jail c. early 1960s after medical-neglect refusal; his death triggered the Durant Movement boycott campaign Bruce co-led
- Mississippi Freedom Democratic Party (MFDP) — already in corpus as canonical entry; reinforce Holmes County base
- Reverend Eddie Carthan — canonical Tchula MS mayor (elected 1977); 1981 conviction-and-imprisonment on disputed charges became canonical 1980s-Mississippi-civil-rights cause célèbre
- Reverend Eddie Clark — canonical first Black US Congress candidate from Holmes County (1968 special election)
- Annie Devine — canonical MFDP co-founder + MFDP congressional-challenge co-plaintiff (with Hamer + Gray) + Canton MS organizer (already flagged in catalog section E + Stage F.G. corpus list)
- Victoria Gray (Adams) — canonical MFDP congressional-challenge co-plaintiff + Hattiesburg MS organizer; cross-corpus reference here from Bruce's MFDP-trio recall

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 123.P3.1 | "the Mass and Community" / "masks" recurring (Pass 2 123.P2.18-19) | Mileston (community) | high | canonical-from-catalog | Add to catalog row F as new geographic Whisper failure: "Mass and Community / masks → Mileston, Mississippi". Pass 2 noted but didn't formalize as global rule |
| 123.P3.2 | "the cold article → courthouse" (Pass 2 123.P2.17) | Common-noun Whisper failure | high | catalog-extension | Add to catalog row G as common-noun pattern; recurring voter-registration-venue Whisper failure across Mississippi-Movement transcripts |
| 123.P3.3 | "Lee Floreau / Leflore Counting → Leflore County" (Pass 2 123.P2.10) | Geographic Whisper failure | high | catalog-extension | Add to catalog row F as new geographic Whisper failure: "Lee Floreau Counting / Lee Flore Counting → Leflore County, Mississippi" |
| 123.P3.4 | "Tugelone → Tougaloo" recurring (Pass 2 123.P2.12) | Already in catalog row F | high | catalog-from-catalog | Catalog row F already has "Tuvalu / Tugaloo / Tugulu / Tuwu / Tugel / two-below / Two-Wheeled → Tougaloo / Tougaloo College" — add "Tugelone" variant to existing row |
| 123.P3.5 | "the lecture / Luxembourg → Lexington MS" (Pass 2 123.P2.28) | Geographic Whisper failure | high | catalog-extension | Add to catalog row F as new geographic Whisper failure: "lecture / Luxembourg / Latin → Lexington, Mississippi"; recurring throughout 123 |
| 123.P3.6 | "Mrs. Ray → Mrs. (Victoria) Gray" (Pass 2 123.P2.47) | Already in canonical MFDP-trio | high | canonical-alias | The trio Hamer + Devine + Gray is canonical MFDP congressional-challenge co-plaintiff trio; Whisper rendering "Gray → Ray" worth adding to catalog row C as named-figure failure |
| 123.P3.7 | "Sue and Henley Lorenzi → Sue and Henry Lorenzi" (Pass 2 123.P2.51) | Common spousal misrendering | high | canonical-alias | "Henley → Henry" — add to catalog as common Whisper failure for the canonical Holmes County white volunteer couple |
| 123.P3.8 | "Reedmean → uncertain Medgar-Evers-meeting context" (Pass 2 123.P2.13) | Speaker's recollection unresolved | low + adversarial-flag | speaker-originating | Pass 2 left unresolved; multi-model could disambiguate from speaker's Medgar Evers reference context |
| 123.P3.9 | "the snake / SNCC" recurring (Pass 2 123.P2.42) | Already in catalog row H | high | canonical-from-catalog | Catalog row H already has '"snake" → "SNCC" pattern'; reinforce — recurring in 123 throughout |
| 123.P3.10 | "Bow-Belling Smith / Bobby-Bell-In Smith → Sheriff Smith" speaker-originating | Holmes County 1960s Sheriff | low + adversarial-flag | speaker-originating | Pass 2 captured the multi-rendering; canonical sheriff name needs SME confirmation |

**Audit-complete marker**: Pass 3 complete on entry #123 as of 2026-05-22. Ready for adversarial-model review.
