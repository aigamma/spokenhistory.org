#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 83.51 Mayor Smith of America -> Mayor Smitherman of Selma | medium | medium (kept) | Pass 2 row 83.P2.46 also at medium. Speaker says "Smith of America" which is severe Whisper phonetic mangling of "Smitherman". Canonical Selma mayor 1965-2000 (Joseph T. Smitherman) is well-documented but the Whisper rendering is sufficiently severe to keep at medium pending adversarial review. The canonical anchor exists; the phonetic distance is the obstacle. |
| 83.P2.8 Bob Manns -> Bob Mants | medium | high | Resolution-by-canonical-anchor: Bob Mants is a documented SNCC field secretary present at Bloody Sunday March 7, 1965. The Whisper rendering "Manns" -> "Mants" is a clean single-consonant substitution. Already documented in SNCC scholarship. Promote to HIGH. |
| 83.P2.13 the Catholic workers party -> the Catholic Worker (Dorothy Day) | medium | high | Resolution-by-context: speaker explicitly says the Detroit Friends of SNCC drew from "the Catholic workers party" — the Catholic Worker Movement (Dorothy Day + Peter Maurin) was canonical anti-poverty + anti-war pacifist organization. The "party" suffix is Whisper's misreading of "movement" or simply a noun appendix. Catholic Worker is canonical 20th-century radical Catholic organization. Promote to HIGH. |
| 83.P2.21 Mrs. Cippy / Mrs. Sippy | low | low (kept) | Pass 2 itself notes uncertainty; mid-sentence reference. Flag for adversarial review. |
| 83.P2.29 Monroe (Albany cousin) | low | low (kept) | Pass 2 itself notes uncertainty — possibly Monroe Sherrod or Monroe Gaines or JoAnn Christian's relative. Cannot disambiguate. Flag for adversarial review. |
| 83.P2.47 shirley, Mercer -> Shirley Mesher | medium | high | Resolution-by-canonical-anchor: Shirley Mesher was the canonical SCLC organizer in Selma 1965-66; the speaker says "I was actually working with a woman from SCLC" and identifies her by partial recall. Whisper "Mercer" -> "Mesher" is a clean voiceless-fricative substitution. Mesher is documented in SCLC/Selma scholarship. Promote to HIGH. |
| 83.P2.55 a new and siloist -> I met Silas (Norman) | low | high | Resolution-by-internal-marriage-anchor: speaker says "I was a new and siloist. We're married in 1967" — Silas Norman Jr. was the speaker's first husband (already canonical via Pass 1 row 83.48). The Whisper rendering "a new and siloist" is severe but the marriage context + speaker's biographical narrative is dispositive. Promote to HIGH. |
| 83.P2.4 the boys died on that day -> W.E.B. Du Bois died on that day (Aug 27, 1963) | high | high (kept) | Critical Pass 1 miss caught by Pass 2 — this is the canonical homophone failure "the boys" -> "Du Bois" (catalog-row E "W.E.B. Divorce / W.B. Dubois -> W.E.B. Du Bois" already documents the high-damage pattern). The Aug 27, 1963 date is canonical (Du Bois died in Accra, Ghana on the eve of the March on Washington). Civil_rights_facts.json already has W.E.B. Du Bois as canonical figure. Pass 2 promotion to high is correct and stands. |
| 83.P2.5 a disparaging remark from Roy Wilkins | high | high (kept) | Resolution-by-canonical-witness: Roy Wilkins's canonical anti-Du-Bois remark at the March on Washington Aug 28, 1963 platform — this is canonical first-person witness testimony to an under-documented inter-organizational tension. Confirmed: speaker is direct witness. Maintained at high. |
| 83.P2.6 Mickey / Ed Henry / Ed King (MFDP) -> Edwin King (MFDP minister) + Aaron Henry | high | high (kept) | Resolution: canonical 1964 MFDP-ticket Edwin King (white Methodist Tougaloo chaplain) + Aaron Henry (MS NAACP president). Both are documented historical figures. Speaker's "Mickey / Ed Henry" is a name-confusion artifact in the moment, not a Whisper error per se. Maintained at high. |
| 83.P2.7 Eric Henry -> Aaron Henry | high | high (kept) | Pass 2 row already at high; Aaron Henry is canonical MS NAACP president and MFDP co-chair; the Whisper rendering "Eric" -> "Aaron" is a phonetic substitution. Maintained. |
| 83.P2.8 Bob Manns -> Bob Mants | medium | high | (Already resolved above.) |
| 83.P2.12 Peking review -> Peking Review | correct | correct (kept) | Canonical Maoist publication 1958-79. |
| 83.P2.20 Curtis, Hayes, out of jail in Liberia | speaker-originating | speaker-originating (kept) | Speaker mentions post-SNCC project of getting Curtis Hayes out of jail in Liberia. Personal recall, not Whisper error. Flag for archival lookup if needed. |
| 83.P2.41 the city is on the corner by the Capitol -> Dexter Avenue King Memorial Baptist Church | high | high (kept) | Resolution-by-canonical-anchor: speaker mid-recalls — initially says "Ebenezer" then corrects to "the Montgomery bus boycott church" (= Dexter Avenue Baptist, MLK's pre-Atlanta pastorate 1954-60); canonical March 25, 1965 Selma-to-Montgomery March endpoint. Maintained at high. |
| 83.P2.51 Lounge County Freedom Organization -> Lowndes County Freedom Organization (LCFO) | high | high (kept) | Canonical 1965 independent Black political party; original Black Panther emblem. Catalog row D already documents the pattern. Maintained. |
| 83.P2.61 nephrologists with a subspecialty | correct | correct (kept) | Common-noun; speaker's son's medical specialty. |
| 83.P2.60 hospitalist | correct | correct (kept) | Common-noun; not Whisper error. |
| 83.P2.65 Bobby Fletcher (NOT in #83 transcript) | n/a | n/a | n/a | Cross-corpus only. Procedural noise; drop from final output. |
| 83.P2.67 Sammy Younge Jr. (NOT in #83 transcript) | n/a | n/a | n/a | Cross-corpus only. Procedural noise; drop from final output. |
| 83.P2.58 a Lang city (NOT in #83 transcript) | n/a | n/a | n/a | Pass 2 itself notes confused with Mary Jones #85. Procedural noise; drop. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 83.51 / P2.46 | Mayor Smith of America -> Mayor Smitherman of Selma | Phonetic distance from "Smith of America" to "Smitherman" is unusually large; deserves second-model check despite canonical-figure anchor. |
| 83.P2.21 | Mrs. Cippy / Mrs. Sippy | Mid-sentence reference uncertain — Mississippi project white volunteer; need disambiguation. |
| 83.P2.29 | Monroe (Albany church-guard cousin) | Could be Monroe Sherrod, Monroe Gaines, or unnamed Christian family relative; cannot resolve. |
| 83.P2.20 | Curtis Hayes in Liberia | Need archival lookup on the post-SNCC Liberia project Curtis Muhammad was involved in. |
| 83.P2.4 / P2.5 | "The boys died" -> Du Bois died | The canonical pattern is documented (catalog E) but the SPECIFIC speaker witness to Wilkins's MoW remark needs corroboration against the canonical Du Bois death/MoW historiography. |
| 83.P2.68 | Selma dentist's house pre-Bloody-Sunday meeting | Speaker recounts a Fay Bellamy passage in *Hands on the Freedom Plow* where Forman + Stokely went to a Selma dentist's house in middle of night before March 9, 1965 to plead with MLK to defy federal injunction; need cross-verification against canonical Movement-history record. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Martha Prescod Norman Noonan (1944-): Canonical SNCC veteran; Albany GA + Mississippi field secretary 1962-65; co-editor of *Hands on the Freedom Plow* (2010); University of Michigan SDS-to-SNCC bridge figure. Under-documented compared to the more-famous SNCC women.
- *Hands on the Freedom Plow* (2010, U. Illinois Press): Canonical 52-essay anthology of SNCC women, co-edited by Faith S. Holsaert + Martha Prescod Norman Noonan + Judy Richardson + Dorothy M. Zellner + Betty Garman Robinson. The definitive primary-source compendium on women in SNCC. Should be added as canonical book/document entry.
- Silas Norman Jr. (1940-2004): Canonical SNCC Augusta GA → Selma project director; physician; speaker's first husband. Foundational SNCC figure cross-corpus with Maria Varela #81.
- Buxton, Ontario / Elgin Settlement (founded 1849 by Rev. William King): Canonical Underground Railroad terminus. Should be added as geographic-historical entry; the speaker's maternal family migrated there in the 1850s.
- C.L.R. James (1901-1989): Canonical Trinidadian Marxist intellectual; *The Black Jacobins* (1938); Detroit Trotskyist Facing Reality group founder; influenced the Detroit DRUM/LRBW pipeline. Under-documented intellectual lineage from C.L.R. James → SNCC organizing strategy.
- George Rawick (1929-1990): Canonical historian; *From Sundown to Sunup* (1972) — slave narratives volumes; Wayne State sociology; Facing Reality group member.
- Bob Mants (1944-2011): SNCC field secretary present at Bloody Sunday March 7, 1965; canonical first-row marcher (the "John Lewis on the left, Bob Mants on the right" position).
- Joan Browning (1942-2024): SNCC Albany 1961 white woman; *Deep in Our Hearts* (2002) co-author with Faith Holsaert + Constance Curry; canonical bridge figure.
- Prathia Hall (1940-2002): SNCC SW Georgia + theologian; gave the canonical "I have a dream" formulation before MLK (heard by King at a Terrell County church burning 1962); cross-corpus figure.
- *Brothers and Sisters in SNCC*: Cross-reference event/anthology.
- Pat Gurin: U. Michigan social psychologist; canonical Black college student aspirations study with Doris Derby + John Bracey; under-documented pre-affirmative-action academic work.
- John H. Bracey Jr. (1941-2023): Historian; U. Mass Amherst African American Studies; canonical Black-radical-tradition scholar.
- Shirley Mesher: Canonical SCLC organizer in Selma 1965-66; under-documented compared to more famous SCLC figures.
- Henry A. Wallace (1888-1965): FDR VP; 1948 Progressive Party presidential candidate; canonical 1940s anti-McCarthyism figure whose Progressive Party state-chair role threatened speaker's father with deportation. Should be added if 1940s-pre-Movement civil rights context is in scope.
- Lowndes County Freedom Organization (LCFO, 1965): Canonical 1965 Black Belt Alabama independent Black political party; original Black Panther emblem. Catalog row D already mentions; worth standalone canonical entry given centrality.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 83.P3.1 | "Bundy March 18, 2013" (P2.1) -> Monday March 18, 2013 | high | new-catalog-pattern | Whisper homophone "Bundy" -> "Monday" — opening date statement. Should be added to a new "Whisper date/day-of-week renderings" catalog subsection. |
| 83.P3.2 | "Martha Prescott Norman Nune / Nunin" (83.1, P2.2, plus cross-corpus row 30.P2T.34) -> Martha Prescod Norman Noonan | high | catalog-cascade | Multiple Whisper renderings ("Nune", "Nunin", "Prescott") of the subject's name; cross-corpus catalog (entry #30.P2T.34 already documents "Norman-Nunin"). Should be added to catalog C with the full chain of variants. |
| 83.P3.3 | "Pratia" (83.36, P2.3) -> Prathia Hall | high | new-catalog-pattern | Canonical SNCC SW Georgia + theologian; the "I have a dream" formulation. Whisper "Pratia" is a single-letter drop from "Prathia". Worth adding to catalog C. |
| 83.P3.4 | "Sumptu County" (P2.26) -> Sumter County, Georgia | high | new-catalog-pattern | Speaker says "we had orientation in Sumptu County" — canonical SNCC Georgia training-camp location (south of Albany); "Sumptu" is Whisper for "Sumter". Catalog F should add. Cross-corpus link: entry #16 also references Sumter (different state, South Carolina). |
| 83.P3.5 | "Wayne State University of the South" + "Newspaper Wayne State University" (P2.9, P2.10) -> Wayne State *South End* | high | new-catalog-pattern | Whisper "University of the South" is a hallucination for "South End" (the canonical DRUM/LRBW pipeline newspaper). Worth catalog entry as it's a distinctive failure. |
| 83.P3.6 | "the Foreman" pattern (P2.68, cross-corpus catalog C) | James Forman | high | canonical-from-catalog | Catalog C already has "Foreman / Jim Foreman -> James Forman" at very-high frequency for entries #22, #30, #32, #34, #44. Now adds #83. Frequency should remain very-high. |
| 83.P3.7 | "Sylvie Carmichael" (P2.48) -> Stokely Carmichael | high | catalog-cascade | Catalog C "Stoke the Carmichael / Stoke Lee / Stelke Carmichael / Storkley -> Stokely Carmichael" lists very-high frequency. The "Sylvie" rendering is a NEW variant not previously documented. Worth adding. |
| 83.P3.8 | "Lounge County" (P2.50, P2.51) -> Lowndes County | high | catalog-cascade | Catalog D row "Lounds County Freedom Association -> LCFO" cites entry #37. Now extends to #83 with new "Lounge" variant. Worth catalog update. |
| 83.P3.9 | Cross-corpus link: Rev. Samuel B. Wells Sr. (83.26, P2.30) | Rev. Samuel B. Wells Sr. | high | canonical | Already documented as Pass 1 (83.26); P2 confirms with multiple cross-refs (Mary Jenkins #84, Mary Jones #85, McCullar #65). Should be added to a new "Albany Movement ministers" catalog subsection given the multi-corpus recurrence. |
| 83.P3.10 | "Edmund Pettis" (P2.53) -> Edmund Pettus Bridge | correct | catalog-confirmation | Already in catalog F. Spelling variant "Pettis" is the canonical Whisper rendering. Cross-corpus pattern confirmed. |
| 83.P3.11 | "Curtis Hayes Muhammad" (83.10, P2.19) -> Curtis Hayes / Curtis Muhammad | correct | canonical | The double-name appearance is the speaker's hybrid form acknowledging Hayes's post-conversion name. Not a Whisper error; canonical speaker-form. |
| 83.P3.12 | Speaker's father's deportation threat (1948 Progressive Party context) | (canonical Cold War civil rights frame) | speaker-originating | n/a | Speaker's first-person witness to the canonical 1948 Henry Wallace Progressive Party state-chair → deportation threat against her West Indian-born father (St. Vincent). Under-documented intersection of immigration enforcement + leftist political activity in late 1940s. Flag for summarization-pipeline awareness; this is canonical first-person Cold War civil rights testimony. |

**Audit-complete marker**: Pass 3 complete on entry #83 as of 2026-05-22. Ready for adversarial-model review.
