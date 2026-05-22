#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 86.4 Canto -> Campo (California) | medium | high | Catalog F (Geographic errors) framework: Campo is canonical SD-County border community. "Canto" -> "Campo" is a single-consonant Whisper homophone with strong context corroboration (speaker's mother Rufina was born there, before WWII). Cross-corpus catalog has plenty of "Bommot/Beaumont" and "Greece/Greenwood" homophone-precedent. Promote to HIGH. |
| 86.33 Schrodinger for President -> (Trump for President) | medium | high | Pass 2 already noted "interview is June 26, 2016" — that anchors the 2015-16 Trump campaign reference. "Schrodinger" rhymes with "Trump" only loosely, but the contextual lock ("building walls and deporting") is overwhelmingly Trump-2016. Phantom-canonical-name risk is real but the temporal + topical alignment is dispositive. Promote to HIGH. |
| 86.34 Alfredo Velasco -> Dr. Alfredo Velasco | speaker-originating | speaker-originating (kept) | Chicano Federation chairman; local figure, not externally canonical. Speaker-originating, single category. |
| 86.37 Monsanto, harvest at seaweed -> Monsanto + Harvey at Sea / Harvest at Sea | medium | medium (kept) | Pass 2 row 86.P2.57 maintained as medium; Barrio Logan pre-Chicano-Park polluting industrial tenants are canonical (kelp/seaweed processing canonical in SD industrial history), but the specific name "Harvest at Sea" or "Harvey at Sea" cannot be cleanly disambiguated without further corroboration. Maintain MEDIUM. |
| 86.P2.10 CIVIC Engagement Board | low | speaker-originating | Pass 2 maintained low; cannot resolve to canonical. Speaker-originating San Diego voter-registration board. |
| 86.P2.18 Alinsky trained Obama -> (speaker-originating + factual error) | speaker-originating | FLAGGED-FOR-ADVERSARIAL-REVIEW | Pass 2 author flagged correctly: Obama was trained by Industrial Areas Foundation (founded by Alinsky), not by Alinsky personally (Alinsky died 1972; Obama's organizing began 1985). This is a common simplification but speaker is making a factual claim. Adversarial review should annotate this as a speaker-originating-but-historically-imprecise claim worth a publication-side footnote. |
| 86.P2.26 Dean Kennerberg -> McDonald's regional manager | speaker-originating | speaker-originating (kept) | Local figure; McDonald's regional manager name cannot be ground-truthed. Speaker-originating. |
| 86.P2.39 the silverman -> Jack Silverman (Jack in the Box founder) | medium | FLAGGED-FOR-ADVERSARIAL-REVIEW | Pass 2 author noted: Jack in the Box founder is Robert O. Peterson, NOT Silverman. Camarillo may be confusing names. Adversarial review should: (a) confirm Peterson is canonical Jack in the Box founder, and (b) determine whether "Silverman" was a SD-area Peterson-adjacent restaurateur Camarillo conflated. Flag — speaker's claim contains likely factual error worth a publication-side footnote. |
| 86.P2.52 Boyn Iowa -> Des Moines, Iowa (Reagan WHO radio) | high | high (kept, qualified) | Pass 2 author noted WHO radio Des Moines as the canonical 1930s Reagan station. However "Boyn Iowa" doesn't phonetically map to "Des Moines"; it does sort-of map to "Boone, Iowa" (a smaller town WHO covered as part of regional reach) or "Davenport, IA" (WOC, where Reagan started). Speaker references "station 1040" which IS WHO Des Moines's canonical frequency, locking the canonical identification. Keep HIGH on Des Moines but note geographic specificity. |
| 86.P2.46 Aztec, Aztec, none both -> Mesoamerican civilizations | low | low (kept) | Pass 2 noted Whisper-degraded. Cannot fully resolve listing of civilization names. Maintain low. |
| 86.P2.50 judicial position open | speaker-originating | speaker-originating (kept) | Camarillo's account of SD Hispanic judicial recommendations under Jerry Brown patronage; local, speaker-internal narrative. |
| 86.P2.54 MacPAC | speaker-originating | speaker-originating (kept) | Camarillo's coined PAC name; local, speaker-internal coinage. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 86.P2.18 | Alinsky trained Obama (speaker claim) | Historically imprecise; needs adversarial annotation for publication-side footnote. Obama was IAF-lineage organizer, not Alinsky-personal trainee. |
| 86.P2.39 | "the silverman" = Jack in the Box founder | Possible Camarillo conflation: Jack in the Box's canonical founder is Robert O. Peterson; "Silverman" is unverified. Adversarial models should propose: is there a Jack-Silverman SD-area restaurateur figure who could plausibly be the actual referent? |
| 86.P2.46 | "Aztec, Aztec, none both" (Mesoamerican civilizations listing) | Whisper-garbled; needs fresh-listener disambiguation to extract correct civilizations list (Toltec, Olmec, Nahuatl, Maya, etc.). |
| 86.P2.52 | "Boyn Iowa" = Des Moines (Reagan 1930s radio) | "Boone, Iowa" alternative reading is geographically defensible (WHO covered Boone); WHO frequency 1040 confirms Des Moines as the canonical station. Speaker may have said "Boone Iowa" colloquially though; needs disambiguation. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Mateo Camarillo (interview subject): Foundational SD Chicano Movement figure; San Diego Trabajadores de la Raza co-founder; Chicano Federation Executive Director 1972-76; NCLR board member negotiating 1986 IRCA; McDonald's franchisee. Recommended for corpus given his canonical centrality to West Coast multicultural civil rights litigation.
- Herman Gallegos: Canonical National Council of La Raza co-founder; born Sal Si Puedes East San Jose; recruited by Camarillo to San Jose State School of Social Work faculty.
- Saul Alinsky: Canonical Chicago community organizer; *Rules for Radicals* (1971); Industrial Areas Foundation founder; trained the generation that produced César Chávez, Hermann Gallegos, NCLR founders. Already mentioned via Bob Moses summary but worth standalone given foundational role.
- César Chávez: Canonical UFW co-founder; already covered in United Farm Workers corpus entry but should have standalone given centrality.
- Dolores Huerta: Canonical UFW co-founder; "Si Se Puede" originator; Presidential Medal of Freedom 2012. Standalone treatment warranted (currently aliased only).
- 1986 Immigration Reform and Control Act (IRCA): Canonical Reagan-signed amnesty legislation; foundational immigration-policy landmark. NOT currently in civil_rights_facts.json despite being a major federal-policy outcome of the Chicano Movement's policy-influence arm.
- Brown Berets: Canonical 1967 Chicano militant organization. Already in corpus.
- Chicano Park: Canonical April 22, 1970 SD Barrio Logan land occupation; canonical mural-movement birthplace. Foundational Chicano Movement landmark site.
- Tomasa Camarillo (interview subject's sister): Canonical Chicano Park Steering Committee chair 1970-onward; foundational Chicano Park advocate.
- José Vasconcelos + *La Raza Cósmica* (1925): Canonical pre-Movement Mesoamerican-racial-cosmology treatise; source of "La Raza" concept. Foundational philosophical-political treatise undergirding the Chicano Movement.
- National Council of La Raza (now UnidosUS): Canonical Hispanic civil rights coalition; not in corpus.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 86.P3.1 | "Bary Logan / body Logan / Bariloag" -> Barrio Logan | catalog-worthy | catalog reference | Pass 2 row 86.P2.3 flagged but did not formalize the catalog entry. Add to catalog F: "Bary Logan / body Logan / Bariloag -> Barrio Logan (San Diego Mexican-American neighborhood, Chicano Park site)" frequency: high. |
| 86.P3.2 | "Susan Chavez" -> César Chávez | catalog-worthy | catalog reference | Pass 2 row 86.P2.17 flagged. Add to catalog C or G as a damaging gender-swap rendering pattern: "Whisper renders male canonical figure as female phantom" — one of the most cognitive-damaging Whisper failure modes (e.g., creates phantom female civil-rights figure). |
| 86.P3.3 | "between nine bombers" -> B-29 bombers | catalog-worthy | catalog reference | Pass 2 row 86.P2.2. Add to catalog G: Whisper's numeric-name-to-prepositional-phrase failure pattern. The "B-29" rendering as "between nine" is a damaging WWII military-equipment-name miss. |
| 86.P3.4 | "Jirrimandry" -> gerrymandering | catalog-worthy | catalog reference | Pass 2 row 86.P2.55. Add to catalog G as a recurring common-noun-treated-as-proper-noun rendering (similar to "Dona-Mite" -> dynamite in Maynard Moore #88). Whisper consistently capitalizes mis-rendered uncommon words. |
| 86.P3.5 | "mirror" / "mirrorless movement" -> mural / mural movement | catalog-worthy | catalog reference | Pass 2 row 86.P2.23. Add to catalog G as a recurring "mural" -> "mirror" Whisper homophone (high-damage; conjures different art form entirely; cross-corpus risk if any other transcript mentions murals). |
| 86.P3.6 | "Cresswood" / "Cresswood, Illinois" parallel in McCarty #89 | confirming pattern | catalog reference | Independent confirmation: Camarillo #86 doesn't use "Cresswood" itself, but McCarty #89 row 89.7 + 89.P2.13 confirms "Cresswood -> Crestwood, Illinois" — flagging the recurring corpus-wide pattern of Whisper inserting "ss" for "st" in compound place names. |
| 86.P3.7 | "Trabajadores de la Raza" (5+ variant renderings) | catalog-worthy | catalog reference | Pass 2 row 86.P2.13-14. Add to catalog B (Civil rights organizations): the multi-rendering pattern ("Trabajadoras / Trabajadores / Trabajalos / Trabajadoras") with gender-suffix instability. Catalog this as a Spanish-language-org-name family failure. |
| 86.P3.8 | "Schrodinger for President" -> Trump for President | catalog-worthy | catalog reference | Add to catalog H ("Special patterns to watch for"): Whisper's tendency to substitute familiar named figures (Schrodinger, Eleanor) for less-stress-prominent canonical figures (Trump, Illinois) when speaker's cadence is unusual. Like the "Cardinal L.A." -> Rosa Parks (Jones #85) and "Chicago Eleanor" -> Chicago Illinois (McCarty #89), this is a high-damage canonical-name-substitution failure. |
| 86.P3.9 | Recurring "David Klein" -> David Cline pattern | catalog-worthy | catalog reference | Confirmed across Camarillo #86, Moore #88, McCarty #89 (Pass 2 rows 86.P1, 88.P2.1, 89.P2.1). Cline is Virginia Tech history department; canonical SOHP-affiliated interviewer for the SW + Mid-Atlantic interview cohorts. Add to catalog A as a Joe-Mosnier-analogous corpus-wide interview-team failure: frequency high. |

**Audit-complete marker**: Pass 3 complete on entry #86 as of 2026-05-22. Ready for adversarial-model review.
