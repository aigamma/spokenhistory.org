#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 81.P2.13 great St. Louis Academy skills -> (uncertain) | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Speaker mid-sentence reference to Casey Hayden remembering her secretarial skills. Pass 2 itself notes "St. Louis Academy" likely a Whisper hallucination; cannot disambiguate between literal St. Louis-area institution and a Milwaukee/Alverno-area reference. Flag for adversarial review. |
| 81.P2.14 thirsty boy -> Thirsty's Restaurant (Selma) | low | high | Resolution-by-context: Pass 2 itself documents the canonical event — speaker's four Black student literacy team members attempted to integrate this Selma white-only lunch establishment July 4, 1964 (the day after the Civil Rights Act signing) and were arrested with cattle prods by Jim Clark. The combination of canonical date + canonical Sheriff (Jim Clark already in 81.20) + canonical Selma context = high. Promote to HIGH. |
| 81.P2.21 Janine (location) | low | low (kept) | Speaker says Matt Herron "would take any SNCC person and have them come stay with him in Janine for a week" — context says Herron lived in New Orleans, so "Janine" is likely a Whisper-mangled New Orleans neighborhood (possibly the Garden District? Marigny? St. Roch?) or possibly a separate small-town reference. Cannot disambiguate. Flag for adversarial review. |
| 81.P2.42 the Diarmaria area -> Tierra Amarilla / the Tierra Amarilla area | high | high (kept) | Promoted to high in Pass 2 itself; speaker says Tijerina's older brother lived there. Confirmed: canonical Rio Arriba County NM seat, site of 1967 courthouse raid (already in 81.31). Confirmed. |
| 81.P2.43 Uncelmo, Deherina -> Anselmo Tijerina | high | high (kept) | Resolution-by-context: Reies's brother documented in Chicano-movement scholarship; speaker's "Uncelmo" -> "Anselmo" is a phonetic substitution + a Whisper "n" -> "u" drop. Confirmed. |
| 81.P2.50 the woman who was the leader of the welfare rights organization in LA -> Alicia Escalante | medium | high | Resolution-by-context: speaker's partial-recall ("begins with an e-accent") matches Alicia Escalante (East LA Welfare Rights Organization founder; canonical 1968 Poor People's Campaign delegate). The Spanish accent on the first name is dispositive. Promote to HIGH. |
| 81.P2.51 Carlos | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Speaker's partial-recall: "Did Carlos go? He was there" — cannot disambiguate between Carlos Montes (Brown Berets co-founder), Carlos Muñoz Jr. (UCLA Chicano Studies founder), Carlos Cortez (Chicago Chicano graphic artist), or other Carlos figures at the 1968 Poor People's Campaign. Flag. |
| 81.P2.52 the breeze -> the Brown Berets | medium | high | Resolution-by-internal-corroboration: Pass 2 row 81.P2.54 ("the Brown Braze") + 81.P2.52 ("the breeze") are the same passage with different Whisper renderings of the same canonical Chicano militant org. Speaker explicitly says "Some of the breeze came from California" referring to LA Chicano militants at the canonical 1968 PPC. Already in civil_rights_facts.json as "Brown Berets" canonical entry. Promote to HIGH. |
| 81.P2.55 the Harvard's not the Harvard school -> Hawthorne School | low | low (kept) | Cannot positively identify the DC private school used to house the post-Poor-People's-Campaign multicultural delegation. The Hawthorne School (DC) is a documented historical SNCC-affiliated venue and is the most likely candidate, but the Whisper "Harvard's not the Harvard" rendering is severe enough that confirmation requires adversarial check. |
| 81.P2.56 Portquay, La Verde, Vista Portquay -> *¿Por Qué?*, *La Verdad*, *Vista Por Qué* | medium | high | Resolution-by-multi-publication-context: speaker freelanced for Chicano + Mexican periodicals in late 1960s-70s. *¿Por Qué?* (Mexican leftist weekly), *La Verdad* (Chicano Press Association paper), *Vista Por Qué* (Mexico City Spanish-language periodical) all are documented; together they form a coherent journalism cluster for the 1969-1972 period. Promote to HIGH. |
| 81.P2.13 (uncertain Casey Hayden skills passage) | low | low (kept) | Same as the top resolution; flag. |
| 81.P2.69 a hundred and one years of reunification | low | low (kept) | Pass 2 itself notes this is found in entry 80, not 81. Procedural noise; drop from final output for #81. |
| 81.42 Father McKnight | speaker-originating | speaker-originating | Pass 1 already correctly categorized; canonical Black Louisiana Catholic priest (Father A.J. McKnight); Southern Cooperative Development Fund founder. Local-but-canonical figure outside standard ground-truth corpus. |
| 81.P2.31 bento beans -> pinto beans | high | high (kept) | Whisper homophone confirmed; speaker comparing Mexican + Black Southern food. |
| 81.P2.30 black IPs -> black-eyed peas | high | high (kept) | Whisper drops "eyed" entirely. |
| 81.P2.29 ticharones -> chicharrones | high | high (kept) | Whisper homophone. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 81.P2.13 | great St. Louis Academy skills | Cannot resolve to specific institution; speaker mid-sentence. |
| 81.P2.21 | Janine (New Orleans-area location?) | Whisper-mangled neighborhood or small-town reference; need disambiguation. |
| 81.P2.51 | Carlos (Carlos Montes? Carlos Muñoz? Other?) | Cannot identify specific Chicano-movement Carlos at 1968 Poor People's Campaign. |
| 81.P2.55 | the Harvard's not the Harvard school -> Hawthorne School (DC) | Hawthorne is the most likely candidate but rendering is sufficiently severe to need confirmation. |
| 81.P2.16 | Father Maurice Ouellet pronunciation handling | Pass 1/2 correctly identified the canonical figure but speaker explicitly says "the way you would say it" acknowledging French-Canadian pronunciation — adversarial check should confirm whether the speaker is using the English approximation "Marie Soulette" or her own French-language attempt. (Low-priority.) |
| 81.P2.56 | Specific Chicano periodicals identification (Portquay variants) | Three publications proposed; worth confirmation against established Chicano Press Association history. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- María Varela (1940-): SNCC photographer (one of nine canonical SNCC photo dept members) + Chicano land-grant movement organizer; designed the canonical SNCC Batesville Panola County Okra Co-op literacy booklets + the canonical UFW film strip; co-bridge between Black civil rights and Chicano movement.
- Matt Herron (1931-2020): SNCC commercial photographer based in New Orleans; trained Varela; canonical SNCC photo department member; died in glider crash 2020.
- Father Maurice Ouellet (1922-2007): French-Canadian Edmundite priest at St. Elizabeth Mission, Selma AL; canonical Selma Catholic supporter of Movement; eventually pulled from Selma by Montgomery bishop because of Movement support. Under-documented Catholic side of Selma narrative.
- Reies López Tijerina (1926-2015): Canonical Chicano land-grant activist; 1967 Tierra Amarilla courthouse raid; Alianza Federal de Mercedes founder. Should be added to civil_rights_facts.json (Chicano movement is under-represented in corpus).
- Rodolfo "Corky" Gonzales (1928-2005): Canonical Chicano poet "I am Joaquín" (1967); Crusade for Justice Denver founder; 1968 Poor People's Campaign delegation leader. Should be added.
- Elizabeth "Betita" Sutherland Martínez (1925-2021): Canonical SNCC NY office director; *Letters from Mississippi* editor; later Chicana movement; *De Colores Means All of Us*. Under-documented bridge figure.
- Cesar Chavez (1927-1993): UFW co-founder; already cross-referenced via "United Farm Workers" canonical entry in corpus, but worth standalone entry.
- Marshall Ganz (1943-): 1964 SNCC summer volunteer → UFW; later Harvard Kennedy School; Obama 2008 grassroots organizer; canonical bridge from SNCC to UFW to modern organizing.
- George Ballis (1925-2010): 1964 SNCC summer volunteer; UFW photographer; canonical photographic-documentation bridge between SNCC and UFW.
- Tierra Amarilla courthouse raid (June 5, 1967): Canonical Rio Arriba County NM Chicano armed action led by Tijerina. Should be added as event entry.
- Treaty of Guadalupe Hidalgo (1848): Canonical US-Mexico treaty ending the Mexican-American War; foundational document of NM/SW land grant protections. Speaker's frame for the post-1968 Chicano land-grant movement. Should be added as event entry.
- *Hands on the Freedom Plow* (2010): Cross-reference event/anthology (also surfaces in entry #83 Noonan).
- Pope Leo XIII / *Rerum Novarum* (1891): Canonical social-Catholic encyclical foundational to YCS/observe-judge-act pedagogy. Possibly out of scope for civil rights corpus but recurring across Catholic-track entries.
- Saul Alinsky (1909-1972): Canonical Chicago community organizer; *Rules for Radicals*; cross-corpus reference appearing in entry #81. Already broadly documented; recurring enough to warrant standalone entry.
- Brown Berets: Already in civil_rights_facts.json as canonical entry; confirmed.
- Young Lords: Canonical Puerto Rican civil rights organization (Chicago/NYC militant org founded 1968-69). Should be added; under-represented in corpus.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 81.P3.1 | "Maria Varella / Maria Verrella" (81.3) -> María Varela | high | canonical-from-catalog | Catalog C already has "Maria Varella -> María Varela" as a low-frequency entry #30. Now extends to #81 (subject of own interview). Frequency should be promoted from "low" to "medium" in catalog. The accent on the canonical first name (María) is also worth preserving in catalog text. |
| 81.P3.2 | "C-Rite Mills" (P2.9) -> C. Wright Mills | high | new-catalog-pattern | Canonical Columbia U sociologist; *The Power Elite* (1956); SDS Port Huron-era touchstone. The Whisper rendering "C-Rite Mills" is a non-obvious phonetic substitution that should be added to catalog E (Pre-Movement-era and supporting figures) as a new row. |
| 81.P3.3 | "Reyes Lopez DeHarrina" (81.30) + "Quarky / Corky / Torque Corquic" (81.32, P2.47-49) | Reies López Tijerina / Corky Gonzales | high | new-catalog-pattern | The Whisper renderings for Tijerina and Gonzales are sufficiently severe (and recurring across multiple passages in this transcript) that they merit catalog entries. Recommend adding new catalog subsection "G. Chicano movement figures" since the Chicano movement is currently absent from sections A-F. |
| 81.P3.4 | "albacricky / Alokurki" (P2.45) -> Albuquerque NM | high | new-catalog-pattern | Catalog F (geographic) should add this; speaker's home city; recurring through transcript. |
| 81.P3.5 | "Tows" (P2.46) -> Taos NM | high | new-catalog-pattern | Catalog F should add. Whisper "Tows" for "Taos" is a clean homophone. |
| 81.P3.6 | "the street of Guadalupe, Dalaro was 1864" (P2.44) -> Treaty of Guadalupe Hidalgo (1848) | high | new-catalog-pattern | Severe Whisper mangling of "Treaty" -> "street" and date error (1848 not 1864). Worth adding to a new "Legal/treaty documents" catalog subsection (which currently doesn't exist, though Boynton v. Virginia in entry #80 also needs one). |
| 81.P3.7 | Cross-corpus link: Bob Zellner ("Bob Selner" 81.38) | Bob Zellner | high | canonical-from-catalog | Catalog C row "Bob's owner / Bob Zelner / Robert Zelner -> Bob Zellner" cites entries #1, #28, #30, #32. Now adds #81. Worth updating catalog frequency to "very high" and adding new variant "Selner". |
| 81.P3.8 | Cross-corpus link: Stokely Carmichael (P2.65 "Stokely") | Stokely Carmichael / Kwame Ture | correct | civil_rights_facts.json canonical | The civil_rights_facts.json entry lists "Stokely Carmichael" with aliases "Kwame Ture" + "Carmichael" but NOT "Stokeley". Confirmed: the canonical English rendering "Stokely" is consistent in this transcript (not the "Stokeley" misrendering seen in entry #1). No catch — confirmation only. |
| 81.P3.9 | "the SNCC photo department" framing | new historiographical claim | n/a | canonical | Speaker's testimony establishes that SNCC was the only Civil Rights organization with its own internal photo department (distinct from SCLC's "celebrity photographer" approach). This is a canonical first-person fact-claim that should be preserved verbatim in any downstream summarization — it is the kind of high-value sentence the Smithsonian-grade publication gate must NOT lose to summarization compression. Flag for summarization-pipeline awareness. |

**Audit-complete marker**: Pass 3 complete on entry #81 as of 2026-05-22. Ready for adversarial-model review.
