#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 85.3 Mr. Kina -> Mr. Kine / Kina (former Albany mayor) | low | speaker-originating | Pass 1 author hedged "(former Albany mayor; uncertain)". No external canonical record of a "Kine/Kina" as Albany mayor matches. Speaker-recall reference; cannot ground-truth. Downgrade to speaker-originating, single-category. |
| 85.5 First, but third / Visited rather -> First Bethel Baptist Church / W.E.B. Du Bois visit | low | medium | Two parts. Part A (First Bethel rendering): Pass 2 row 85.P2.18 already reframed the "first but third" as a "Bethel" homophone — supports a MEDIUM promotion. Part B (Du Bois church visit): historically plausible — Du Bois was at Atlanta University 1897-1910 and 1934-44, ~150 mi from Albany; cannot disprove but cannot definitively confirm without church-records corroboration. Net: promote rendering identification to MEDIUM; flag Du Bois church-visit fact for adversarial review. |
| 85.6 Miss Willime Jackson -> Willie Mae Jackson | medium | medium (kept) | "Willie Mae Jackson" is a phonetically plausible reading of "Willime" but no canonical Albany figure with this name surfaces. Speaker-originating local figure pending corroboration. Maintain MEDIUM. |
| 85.12 put curd -> *Atlanta Daily World* alternate | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Pass 2 row 85.P2.12 retains low confidence ("uncertain second paper"). The "put curd" phonetic profile (two stressed syllables ending in voiced consonant cluster) does not cleanly map to "Atlanta Daily World" (4 syllables) or to other canonical Black newspaper names. Could also be *Baltimore Afro-American* or *Chicago Defender*. Flag for adversarial review. |
| 85.15 Mr. McNair -> Albany school principal | low | speaker-originating | No external canonical record; family/local. Speaker-originating, single-category. |
| 85.17 Shaveen, Attorney King -> Chevene "C.B." King + (Slater) King | high | high (kept) | "Shaveen" is Whisper's rendering of "Chevene" (which is pronounced "Sha-VEEN"). C.B. King is canonical Albany Movement attorney (cross-corpus with Jenkins #84). The bracket "(Slater)" is speaker's reference to Slater King (C.B.'s brother, also Albany Movement). Confirmed canonical. |
| 85.32 James Gray's Albany Herald + Chantine | medium | medium (kept) | First part canonical and confirmed (James H. Gray, *Albany Herald* segregationist editor). "Chantine" remains speaker-originating publication name not externally corroborated. Net rating stays at medium because the *Albany Herald* identification is firm even if "Chantine" itself remains uncertain. |
| 85.P2.5 Howing -> hoeing | high | high (kept) | Confirmed; common-noun verb conjugation Whisper-rendered phonetically without dropping the "e". |
| 85.P2.9 slot-loan -> small loan / small farm plot | medium | medium (kept) | Pass 2 author noted the phonetic uncertainty between "small loan" and "small lot". Both readings preserve the speaker's meaning (purchase of small acreage); without speaker disambiguation cannot resolve to high. Maintain medium. |
| 85.P2.10 Because of full pants | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Pass 2 noted "clearly garbled" with no high-confidence reading. Whisper artifact; speaker likely said something like "Because of a few pennies" or "before plantation" — flag for adversarial review. |
| 85.P2.17 I'd go in home with that | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Pass 2 marked low; speaker's pension/retirement context discussion. Cannot resolve idiom without speaker-recall data. Flag. |
| 85.P2.19 new boss, a tenant at church | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Whisper-garbled church-name phrase. Could be "New Bethel" or related Albany Baptist congregation name; cannot resolve from transcript. Flag. |
| 85.P2.22 Chantine -> The Albany Chronicle (uncertain) | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Pass 2 maintained low; "James Gray's news vapor" rendering hints at "newspaper" but second publication-name beyond *Albany Herald* unclear. Could be a weekly insert or *Albany Daily*. Flag. |
| 85.P2.23 a challenge, a good year in call | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Pass 2 noted "clearly garbled". Cannot resolve. Flag. |
| 85.P2.25 motry | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Pass 2 author suggested "Macon" as candidate but flagged low. Could also be "Moultrie" (Georgia town ~50 miles east of Albany, plausible boycott-shopping destination). Adversarial review can disambiguate Macon vs. Moultrie vs. another town. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 85.5 (Du Bois visit) | W.E.B. Du Bois visited First Bethel Baptist (childhood church) | Historically plausible but uncorroborated; speaker's apocryphal-feeling recollection — worth adversarial verification against any Du Bois travel records covering Albany GA churches. |
| 85.12 | "put curd" (second Black newspaper) | Phonetic profile does not clean-map to *Atlanta Daily World*. Adversarial models should propose canonical Black newspapers Mary Jones could have been reading in 1940s-50s Albany. |
| 85.P2.10 | "Because of full pants" | Garbled phrase; need fresh-listener disambiguation. |
| 85.P2.17 | "I'd go in home with that" | Garbled idiom in pension/retirement discussion. |
| 85.P2.19 | "new boss, a tenant at church" | Unidentified Albany Baptist congregation name. |
| 85.P2.22 | "Chantine" (Albany publication) | Possibly a James Gray-published Albany weekly insert; needs adversarial corroboration. |
| 85.P2.23 | "a challenge, a good year in call" | Whisper garble; needs fresh listener. |
| 85.P2.25 | "motry" (Cordele/Tifton-adjacent town) | Macon vs. Moultrie vs. other plausible Georgia town; adversarial models should select from boycott-context candidates. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Dr. William G. Anderson: Canonical Albany Movement first president (1961-62); osteopath; cross-corpus recurring (Jenkins #84, Jones #85, Noonan #83). Foundational Albany Movement figure not yet in civil_rights_facts.json despite Albany Movement entry already in corpus.
- Charles Sherrod: Canonical SNCC field secretary in Albany (1961-onward); foundational SW Georgia organizer. Already in Bob Moses summary by association but not standalone; recurring across corpus.
- Chief Laurie Pritchett: Canonical Albany Police Chief whose "nonviolent mass arrest" tactic neutralized the Albany Movement; foundational counter-Movement police figure already mentioned in Albany Movement entry but worth standalone treatment given pedagogical importance.
- McCree Harris: Canonical Albany Movement leader; Monroe HS teacher; principal Albany Movement Police Committee figure (per Jones's first-person account). Recurring; not in corpus.
- C.B. King (Chevene Bowers King): Canonical Albany Movement attorney; brother of Slater King; recurring across Albany interviews.
- Sargent Shriver: Canonical OEO Director 1964-68; Head Start founder. Cross-corpus recurring; should be in ground-truth corpus given War-on-Poverty programmatic centrality (LBJ entry references "OEO" but not Shriver standalone).
- Bernice Johnson Reagon: Canonical SNCC Freedom Singers, Sweet Honey in the Rock founder; recurring across corpus (catalog C). Foundational cultural figure.
- Rutha Mae Harris: Canonical SNCC Freedom Singer (Albany); recurring.
- A.C. Searles: Canonical Albany Black newspaper editor (*Southwest Georgian*); foundational SW Georgia Black-press figure; cross-corpus with Jenkins #84.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 85.P3.1 | "Sergeant Shriver" (across 85.13 + 85.P2.14) | Sargent Shriver | catalog-worthy | catalog reference | "Sergeant" -> "Sargent" Whisper rendering is recurring corpus-wide and should be added to catalog E (Pre-Movement-era and supporting figures). Both Jones #85 and McCarty #89 / cross-corpus instances render "Sargent" as "Sergeant" (military-rank homophone). Add to catalog E. |
| 85.P3.2 | "Cardinal L.A." -> Rosa Parks | catalog-worthy | catalog reference | Pass 2 row 85.P2.27 already flagged for catalog inclusion. Promote: this is one of the most surprising Whisper failures in the corpus (a canonical figure substituted by a Catholic-religious title). Add to catalog C or H as a "homophone with high cognitive surprise" pattern. Recommend specific catalog row: "Cardinal L.A. -> Rosa Parks" (frequency: low; cross-corpus: #85). |
| 85.P3.3 | "Eat your Smith" -> Etheridge Smith | catalog-worthy | catalog reference | Pass 2 row 85.P2.20 already flagged. The "Eat your" -> "Etheridge" Whisper rendering pattern is canonical-name first-syllable degradation; add to catalog E or H with explicit cross-reference to the first Black Albany police officer historical context (1962). |
| 85.P3.4 | "Robert Benning, big junior" -> Robert Benning Jr. | catalog-worthy | catalog reference | Pass 2 row 85.P2.21 flagged. The "big junior" -> "Jr." rendering should be added to catalog H ("Special patterns to watch for") as a recurring suffix-mishandling pattern; Whisper consistently misreads the "Jr." abbreviation when speakers pronounce it as "junior" in regional dialect. |
| 85.P3.5 | "the wall poverty" -> the War on Poverty | catalog-worthy | catalog reference | Pass 2 row 85.P2.16; canonical LBJ 1964 program. The "war" -> "wall" homophone is high-damage because it conjures a phantom policy program. Add to catalog G (Common-noun and idiom errors). |
| 85.P3.6 | "photo registration" -> voter registration | catalog-worthy | catalog reference | Pass 2 row 85.P2.26; canonical Movement-era voter-registration term. The "voter" -> "photo" Whisper homophone is a recurring failure family member; add to catalog G with a cross-reference to corpus instances. |
| 85.P3.7 | "first but third" -> First Bethel | recurring | n/a (already cataloged) | Confirming Pass 2 framing — this is a member of Whisper's "Methodist/Baptist denomination church name" rendering family (cf. catalog F geographic errors that touch on church-name proximities); no new catalog row needed but worth a cross-corpus tracker. |

**Audit-complete marker**: Pass 3 complete on entry #85 as of 2026-05-22. Ready for adversarial-model review.
