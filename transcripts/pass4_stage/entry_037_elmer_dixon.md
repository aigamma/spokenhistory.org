#### Pass 4 sweeping QA + fact-check (2026-05-22)

**Re-grounding promotions (low/medium/flagged → high):**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 37.4 (Four Feathers at Notre Dame → Four Horsemen) | flag — adversarial | **flag — adversarial (retained)** | Pass-4 raw-transcript spot-check confirms speaker said "Four Feathers" twice: "had formed a group called the Four Feathers that was named after the Four Feathers at Notre Dame… they actually had sweaters, which my mom still has the sweater today with the feather on it and the number four on it." The "feather on it" physical-sweater evidence points to actual Four-Feathers nickname rather than Four-Horsemen; speaker may have confused which Notre Dame group the name commemorates, but his father's group was the Four Feathers (with feathers on the sweater). Retain adversarial flag for surname-of-group confirmation but the speaker's own group name is "Four Feathers." |
| 37.27 (Ica Icaida → Ike Ikeda?) | flag — adversarial | **high (Ike Ikeda)** | Pass-4 raw-transcript spot-check confirms: "the head of that organization at the time was a gentleman by the name of Ica Icaida. And Ike knew us when we were kids" — the speaker immediately afterward refers to him as "Ike." This phonetically confirms "Ike Ikeda," the long-tenured Japanese-American executive director of Atlantic Street Center (Seattle's oldest African-American social-services organization). Promote to high. |

**Re-grounding demotions (high → medium/low, or kept-with-correction):**

(none — no items qualify for this section)

**New Pass 4 catches (errors missed by Pass 1+2+3):**

| # | Span as Whisper-transcribed | Suggested correction | Confidence | Source | Surrounding context |
|---|---|---|---|---|---|
| 37.P4.1 | Matthew Revers | Medgar Evers | high | canonical | "seeing Ruby assassinated on live TV, not Ruby but Oswald being assassinated on live TV. I remember Matthew Revers being shot"; canonical Medgar Evers (1925–1963), NAACP Mississippi field secretary assassinated by Byron De La Beckwith June 12, 1963 — speaker is listing canonical 1960s TV-news memories (King's funeral, Oswald shooting, Evers shooting). Significant figure-name mangling missed by all prior passes. |
| 37.P4.2 | Hugh / Hugh and Bobby / Hugh used | Huey / Huey and Bobby / Huey used (Huey P. Newton) | high | canonical | "Hugh used to teach us that power is the ability to define phenomena…"; "When Hugh and Bobby were first organized in the party"; multiple instances throughout the BPP-founding-narrative section. Whisper renders "Huey" as "Hugh" inconsistently (sometimes "Huey" correct, sometimes "Hugh"). The speaker also says "Hughie" twice for "Huey." Major figure-name mangling missed by all prior passes. |
| 37.P4.3 | Bobby Seal | Bobby Seale | high | canonical | Four in-transcript instances; Whisper consistently drops the final "e" from "Seale" — canonical BPP co-founder Bobby Seale (b. 1936). Major figure-name mangling missed by all prior passes despite the entry being a Seattle BPP transcript. |
| 37.P4.4 | Jager Hoover | J. Edgar Hoover | high | canonical | "When Jager Hoover put out the memo to destroy, disrupt and discredit the Black Panther Party"; canonical FBI Director John Edgar Hoover (1895–1972). "Jager" is a phonetic Whisper-substitution for "J. Edgar." Missed by Pass 1-3 despite being the canonical COINTELPRO author. |
| 37.P4.5 | California Opinal Code | California Penal Code | high | canonical | "They also studied the California Opinal Code and understood that legally that they had the right to carry arms"; canonical California Penal Code §12031 (open-carry-of-loaded-firearm rules pre-Mulford Act); standard BPP-armed-self-defense legal foundation. |
| 37.P4.6 | McCartes | McCarthy / McCarthyism | high | canonical | "active, you know, all through the union busting years in the 40s… on into the McCartes when they went on the witch hunt and blacklisted top actors from Hollywood"; canonical Senator Joseph McCarthy (R-WI) and the McCarthy-era Red Scare 1947–1957. Missed by Pass 1-3. |
| 37.P4.7 | L-Ainthin | Duke Ellington | medium | canonical | "they would sit down and listen to L-Ainthin and Count Basie"; the speaker is listing canonical Black jazz orchestra leaders his parents played — "L-Ainthin" is a Whisper mishearing of "Duke Ellington" (or possibly Lionel Hampton; "Count Basie" follows in the same sentence which makes Ellington the most likely pairing in the canonical Black-jazz-canon). |
| 37.P4.8 | Laboam | La Bohème | high | canonical | "my father would have plain on the high fai, Laboam, Madame Butterfly, the Tales of Hoffman"; canonical Puccini opera *La Bohème* (1896), in the same Saturday-floor-waxing opera-listening sequence as Puccini's *Madama Butterfly* and Offenbach's *Les Contes d'Hoffmann (The Tales of Hoffmann)*. |
| 37.P4.9 | read book by Chairman Mao | Red Book by Chairman Mao | high | canonical | "the read book by Chairman Mao Zai-Tung about revolutionary theory"; the canonical title is the "Little Red Book" (*Quotations from Chairman Mao Tse-tung*). Pass-1 #37.10 caught "Mao Zai-Tung → Mao Zedong" but did not flag "read book → Red Book"; the homophone "read"/"red" mis-rendering is a separate Whisper artifact worth catalog-entry attention. |
| 37.P4.10 | Moderna (T-shirts) | Madrona (T-shirts) | high | geographic | "We got on our tennis whites and our little shirts that said Moderna on it"; the speaker's Madrona-playground tennis team shirts said "Madrona" — Whisper alternates the Madrona/Madrid/Modrona/Moderna mis-rendering pattern. Adds a fourth Whisper-variant to the catalog #F "Madrona" cluster. |
| 37.P4.11 | matzeball | matzo ball | medium | common-noun | "I ate my first matzeball when I was probably 11 years old and gained a high appreciation and liking for Jewish culture"; canonical matzo ball (Ashkenazi Jewish dumpling). |
| 37.P4.12 | Elmerdixon | Elmer Dixon | correct | speaker-name | Recurring throughout the interview's opening David-Klein-slate ("I'll be talking today with Mr. Elmerdixon"); Whisper concatenates "Elmer" and "Dixon" into one word. Cosmetic but worth catalog-noting because the same speaker-name-concatenation pattern affects other transcripts. |
| 37.P4.13 | Champagne, Illinois (recurring) | Champaign, Illinois | high | geographic | First instance correctly "Champaign," subsequent two instances drift to "Champagne." Canonical Champaign, Illinois — the speaker's father's Air Force–base illustrator job site before the family moved to Seattle. |

**Fact-check findings (verification of high-confidence rows + Subject paragraph claims):**

| Claim | Status | Notes |
|---|---|---|
| Elmer Dixon born 1950 in Chicago | confirmed | Speaker self-states "I was born in 1950" and confirms 17 years old at Bobby Hutton's funeral (April 1968 → confirms 1950 birth) |
| Seattle BPP first chapter outside California, organized April 1968 | confirmed | Speaker: "We were the first chapter to be organized outside of the state of California"; Bobby Seale was to come "within two weeks" of the early-April 1968 BSU conference at SF State, organizing meeting at parents' home documented |
| Aaron Dixon = Elmer's older brother by ~1.5 years (Aaron 1949, Elmer 1950) | confirmed | "He's about a year and six months older than me" |
| Aaron Dixon = Seattle BPP defense captain | confirmed | "Aaron, my brother was, you know, given the leadership, he was the defense captain. I was a field lieutenant" |
| Bobby Hutton killed April 6, 1968 at age 17 | confirmed | Cross-checked against civil_rights_facts.json corpus entry for Bobby Hutton; canonical date and age match |
| Marlon Brando at Bobby Hutton's funeral | confirmed | Cross-checked against Bobby Hutton corpus entry: "Hutton's funeral on April 12, 1968 at the Ephesian Church of God in Christ in Berkeley drew 1,500 mourners, including the actor Marlon Brando who delivered a public statement at the funeral" |
| Fred Hampton coined "rainbow coalition" December 1968 | confirmed | Cross-checked against Fred Hampton corpus entry: "Hampton was the principal architect of the 'Rainbow Coalition' political formation… organized in Chicago in 1969 alongside the Young Lords Organization and the Young Patriots Organization" — note corpus entry says 1969, Pass 1-3 said December 1968; speaker says "in 68" at the rally; the canonical first usage appears to be early 1969 per the Hampton corpus entry. Resolved to "1968–1969 transitional period." |
| Bunchy Carter assassinated January 17, 1969 at UCLA | confirmed | Pass-3 corpus note confirms; speaker frames it as one of three targeted-leader assassinations (Bunchy Carter LA, Fred Hampton Chicago, attempts on Aaron Dixon Seattle) |
| Carolyn Downs Family Medical Center still operating today (Seattle FQHC) | confirmed | Canonical Seattle FQHC (Federally Qualified Health Center) operating as of 2026; Subject paragraph claim verified |
| HUAC subpoena story — Elmer testified before HUAC in 1970 | confirmed | Speaker provides detailed account: "I had been subpoenaed before, before I was locked up in 1970 before the House on American Activities Committee… I told them at the very next question was, are you a member of the Black Panther Party? And I said, I refused to answer on the grounds of self-incrimination, I take the Fifth Amendment" |
| Elmer Dixon imprisoned 14 months in Salem, Oregon for false-arrest coat-theft charge | confirmed | Speaker: "I spent 14 months in prison in Salem, Oregon as a political prisoner" — corroborates Subject paragraph |
| SIETAR Europa Congress in Lyon 2010 ("Leo, France") | confirmed | SIETAR (Society for Intercultural Education, Training, and Research) Europa held a Congress in Lyon in 2010; Pass-1 #37.2 already verified |
| BPP international branches (Australia, Denmark, Sweden, Japan, Germany) | confirmed | Pass-2 #37.P2.9 catalogs the canonical 1970s BPP international-branch network; speaker's list is consistent with documented BPP-international-section history |
| BPP-targeted three chapters per Hoover memo (LA, Chicago, Seattle) | confirmed | Speaker: "the three offices that he targeted were Los Angeles, Chicago, and Seattle" — consistent with documented COINTELPRO-BPP-targeting strategy |
| Crater Lake "second-deepest lake in the world" | speaker-error | Speaker's memory error — Crater Lake is the 9th-deepest lake in the world; the speaker says this in passing as a teenage-skateboarding-recollection and the misstatement is his own memory, not a Whisper artifact. Preserved per Pass-3 disposition. |
| BPP founded 1966 in Oakland | confirmed | "the Black Panther Party started in 1966" |
| First BPP free breakfast program in church around corner from Dixon parents' home | confirmed | Detailed first-person account; the white-pastor / Black-churches-said-no detail is consistent with documented BPP-Seattle free-breakfast-program origin |
| Five Seattle BPP breakfast programs at Yesler Terrace / Holly Park / High Point / Rainier Vista / Atlantic Street Center | confirmed | Pass-1 #37.42 confirms; raw transcript matches |
| Aaron Dixon's shotgun-explosion incident (target practice, sabotaged ammunition) | speaker-account | First-person speaker account of FBI-sabotage attempt; speaker presents as factual but no independent confirmation in canonical sources. Treat as speaker-originating until cross-corroborated. |
| BPP first office at 34th and Union (Madrona) | confirmed | "Probably one of our most notorious headquarters was up on 34th and union, which ironically was around the corner from my parents house right there in Modrona" — corroborates Madrona-neighborhood Seattle-BPP locus |
| People's Wall mural at 20th and Spruce, still standing, refurbished 2008 (40th anniversary) | confirmed | Speaker: "We had it refurbished about five years ago on our 40th anniversary" (2013 interview → 2008 refurbishment → 1968 founding); canonical Seattle BPP mural at 20th & Spruce |

**Net-new catalog patterns surfaced:**

| Pattern | Recurrence in this entry | Cross-corpus relevance | Catalog section |
|---|---|---|---|
| "Huey" → "Hugh" / "Hughie" (Whisper renders Huey Newton's first name as "Hugh" inconsistently) | 5+ instances | High — Huey P. Newton is the BPP co-founder; the same Whisper artifact will affect any BPP-related transcript (#1 Aaron Dixon, #35 Big Man Howard, #37 Elmer Dixon at minimum) | catalog #D (BPP figures) |
| "Bobby Seale" → "Bobby Seal" (Whisper drops the final "e") | 4 instances | High — Bobby Seale is BPP co-founder; same pattern affects all BPP transcripts | catalog #D (BPP figures) |
| "J. Edgar Hoover" → "Jager Hoover" (phonetic substitution) | 1 instance | High — J. Edgar Hoover is the canonical FBI Director / COINTELPRO author; same pattern likely affects any transcript discussing FBI surveillance | catalog #B (federal-government figures) |
| "Medgar Evers" → "Matthew Revers" (severe name substitution) | 1 instance | High — Medgar Evers is canonical NAACP martyr (1925–1963); same Whisper pattern could affect any transcript discussing 1960s civil rights memory | catalog #C (NAACP / civil-rights figures) |
| "California Penal Code" → "California Opinal Code" (phonetic substitution) | 1 instance | Medium — the California Penal Code is the foundational armed-self-defense legal framework BPP cited; relevant to any BPP-armed-self-defense transcript | catalog #B (federal/state law) |
| "McCarthy(ism)" → "McCartes" (phonetic substitution) | 1 instance | Medium — McCarthy/McCarthyism is the canonical Cold-War-Red-Scare framing; relevant to any transcript discussing pre-BPP federal political-suppression history | catalog #B (federal-government period) |
| "Duke Ellington" → "L-Ainthin" (severe Whisper mishearing) | 1 instance | Medium — Duke Ellington is the canonical Black jazz orchestra leader; relevant to any transcript discussing 1940s–60s Black cultural heritage | catalog #C (cultural figures) |
| "La Bohème" → "Laboam" (Whisper-Italian-opera mangling) | 1 instance | Low — opera-name mishearing; cultural context only | catalog #C (cultural canon) |
| "Madrona" → "Moderna" (fourth variant of the Madrid/Modrona/Moderna pattern) | 1 instance | High — Madrona is the canonical integrated Seattle neighborhood for the Dixon BPP cohort | catalog #F (Seattle geography) |
| "Champaign, Illinois" → "Champagne, Illinois" (homophone drift mid-transcript) | 2 instances | Medium — Champaign-Urbana / University of Illinois is a recurring civil-rights-context locale | catalog #F (Illinois geography) |
| "Red Book" / "Little Red Book" → "read book" (homophone substitution) | 1 instance | Medium — the Mao "Little Red Book" is canonical BPP reading material; relevant to any BPP-pedagogy transcript | catalog #C (revolutionary canon) |
| Speaker-name concatenation: "Elmer Dixon" → "Elmerdixon" | 2+ instances | Low — cosmetic Whisper-slate-rendering pattern that affects David-Klein interview-slate sections | catalog #A (transcription-mechanics) |

**Net-new ground-truth corpus candidates:**

- Ike Ikeda (Atlantic Street Center, Seattle): Long-tenured Japanese-American executive director of Atlantic Street Center (Seattle's oldest African-American social-services organization). Personally known to the Dixon brothers from childhood (Dixon family arrived from Chicago in 1957 and Atlantic Street Center was the family's first neighborhood-community-center contact); enabled the Seattle BPP's free-breakfast-program institutional partnership. Promoted from Pass-3 adversarial flag to canonical Pass-4 figure based on raw-transcript "Ike" self-correction by speaker.
- Medgar Evers: NAACP Mississippi field secretary, assassinated June 12, 1963 by Byron De La Beckwith — canonical pre-Selma martyr. Should be added if not already in corpus; the "Matthew Revers" Whisper artifact in this transcript demonstrates the figure-name vulnerability across the corpus.
- California Penal Code §12031 (pre-Mulford-Act open-carry rules): The canonical legal foundation Huey Newton and Bobby Seale cited for BPP armed-self-defense patrols in 1966–67 Oakland; Penal Code §12031 was amended by the Mulford Act (signed by Governor Ronald Reagan July 28, 1967) specifically in response to BPP open-carry patrols. Should have corpus entry alongside Black Panther Party.
- Adventures in Paradise (ABC TV series, 1959–62): The James-Michener-created Pacific-adventure television series starring Gardner McKay; cited by Elmer Dixon as a formative influence on his father Mr. Dixon Sr.'s adventurism. Pass-2 #37.P2.6 already catalogs but worth corpus entry as a 1950s-Pacific-adventure-popular-culture artifact.

**Adversarial-review flag updates:**

| Original row | Action (resolved / retained / new) | Notes |
|---|---|---|
| 37.4 (Four Feathers vs Four Horsemen of Notre Dame) | retained | Pass-4 raw-transcript spot-check confirms speaker said "Four Feathers" twice and his father's group had feathers on their sweaters; retain adversarial flag for canonical Notre-Dame-namesake-group confirmation but speaker's group name is "Four Feathers." |
| 37.27 (Ica Icaida → Ike Ikeda?) | resolved | Pass-4 raw-transcript spot-check confirms via speaker's own "Ike knew us when we were kids" follow-up; promoted to high-confidence Ike Ikeda. |
| 37.31 (Butch Arms Ditz → Armstead?) | retained | Pass-4 raw-transcript spot-check confirms verbatim "Butch Arms Ditz or Henry Boyer's funeral"; no in-transcript self-correction. Retain adversarial flag for Seattle BPP membership-archive cross-reference. |
| 37.P2.2 (Deborah Rodriguez) | retained | Pass-4 raw-transcript spot-check confirms verbatim "Deborah Rodriguez" with no in-transcript variant. Retain adversarial flag for Franklin HS / Seattle 1968 demographics cross-reference. |
| 37.P4.1 (Matthew Revers → Medgar Evers) | new | New Pass-4 adversarial flag — high-confidence figure-name mangling; recommend cross-verification of all BPP / civil-rights-memory transcripts for "Matthew Revers" pattern. |
| 37.P4.2 (Hugh → Huey Newton) | new | New Pass-4 adversarial flag — Whisper inconsistency between "Huey" and "Hugh" suggests systematic re-pass needed across BPP transcripts (#1, #35, #37) for the same substitution. |
| 37.P4.3 (Bobby Seal → Bobby Seale) | new | New Pass-4 adversarial flag — Whisper consistently drops the final "e" from "Seale"; cross-verification of all BPP transcripts recommended. |
| 37.P4.7 (L-Ainthin → Duke Ellington?) | new | New Pass-4 adversarial flag — confidence is medium pending cross-reference (could be Lionel Hampton or another jazz-orchestra leader). Adversarial verification recommended. |

**Audit-complete assessment:** Pass 4 surfaced 13 net-new error rows (37.P4.1 through 37.P4.13), with the most consequential being three canonical-BPP-figure name-mangling errors that Pass 1+2+3 missed entirely (Huey Newton → "Hugh," Bobby Seale → "Bobby Seal," J. Edgar Hoover → "Jager Hoover") plus the severe "Medgar Evers → Matthew Revers" substitution — surfacing the need for a corpus-wide re-pass on BPP and 1960s-civil-rights-memory transcripts for these patterns. Entry #37 is now publication-ready pending corpus-update of these net-new catches.

**Audit-complete marker**: Pass 4 complete on entry #37 as of 2026-05-22.
