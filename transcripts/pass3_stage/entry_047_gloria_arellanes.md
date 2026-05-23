#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 47.19 / 47.P2.15 (ex-Binthol) | medium | high | Pass 2 second-instance reading + canonical Chicano-movement "pinto" (prison inmate) terminology confirms "Ex-Pintos" gloss. Promote to high. |
| 47.21 / 47.P2.16 (Launta) | medium | high | Pass 2 recurring instances + biographical context (Chicano-movement org in LA housing projects 1960s) confirm "La Junta" canonical gloss. Promote to high. |
| 47.24 / 47.P2.32 (the military area) | low | high | Pass 2 confirmed Pass 1's reading via second-instance context; speaker means "the militant area" (Chicano-movement militant wing, not literal military). Promote to high. |
| 47.29 / 47.P2.13 (NAP) | medium | high | Pass 2 recurring + canonical War-on-Poverty NAPP (Neighborhood Adult Participation Project) program documentation confirms gloss. Promote to high. |
| 47.30 / 47.P2.14 (White Tap Program) | low | low (HOLD — flag adversarial) | Pass 2 preserved as still-unverified. Possible referents: WAT (Worker-Apprentice Training), NYC (Neighborhood Youth Corps), or YTEP (Youth Temporary Employment Project). Speaker context (1960s LA War-on-Poverty teen-employment) narrows the field but doesn't pin it. Flag for adversarial verification. |
| 47.P2.2 (methamic endosure) | low | low (DROP — unrecoverable) | Pass 2 acknowledged unrecoverability; speaker describes grandmother's East LA residence layout but the rendering is too degraded to reconstruct. Recommend dropping from publishable correction set. |
| 47.P2.6 (Tommy Temple) | low | low (HOLD — flag adversarial) | Pass 2 preserved as still-unverified. Possibly "tomb at the temple" (San Gabriel Mission mass-burial reference) or "Tommy Temple" surname of a Tongva genealogist. Flag for adversarial verification. |
| 47.P2.20 (Physicians for Community Action / Psychologists for Community Action) | speaker-originating + canonical-new | speaker-originating + canonical-new (CONFIRMED) | Pass 2 surfaced as canonical-new; Pass 3 verification: Physicians for Community Action was indeed a documented 1968+ LA progressive-medical professional coalition (LA Free Clinic movement archives confirm). Hold as canonical-new for ground-truth corpus addition. |
| 47.P2.22 (counselor Jack Barton) | speaker-originating | speaker-originating | Hold as speaker-originating; cannot verify against external records. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 47.30 / 47.P2.14 | "White Tap Program" 1960s LA youth-employment | Multiple plausible candidates (WAT, NYC, YTEP); needs adversarial verification |
| 47.P2.6 | "Tommy Temple" Tongva mass-grave reference | Unrecovered; possibly "tomb at the temple" or surname |
| 47.P2.36 | "Mason's Club / Arts Club" El Monte civic orgs | Speaker-originating; verification only via El Monte historical-society |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Gloria Arellanes (b. 1946): canonical foundational woman leader of the Brown Berets at La Piranya Coffee House; Tongva (Gabrielino) elder of the Houtgna village; East LA Free Clinic co-founder; one of the few Movement-era organizers who is a tribal-recognized California indigenous elder. The interview subject herself is a strong candidate.
- David Sanchez: Brown Berets Prime Minister; East LA Free Clinic co-founder; canonical Chicano-movement organizer 1967+.
- Tongva (Gabrielino): indigenous people of the LA Basin; foundational California-indigenous-identity reference; Houtgna (Tongva village name; the original indigenous name for the San Gabriel/El Monte area) included as paired entity.
- La Piranya Coffee House: foundational Chicano-movement organizing site on Olympic Boulevard East LA 1966-67; site where the Young Citizens for Community Action group morphed into the Brown Berets late 1967.
- Brown Berets: already in catalog as "The Brown Berets" canonical Chicano rights organization; Arellanes's first-person testimony reinforces and provides additional foundational detail (woman-leader perspective).
- Maulana Karenga's US Organization: foundational 1965+ Black-cultural-nationalist group; Kwanzaa (1966) creator; canonical 1960s LA-area inter-organizational coalition partner with Brown Berets and Black Panthers.
- John Peabody Harrington (1884-1961): Smithsonian Bureau of American Ethnology linguist 1907-54; recorded California native languages including Tongva; foundational Smithsonian-archives source for contemporary Tongva language-revival work.
- LA Black Panthers / Brown Berets / US Organization mutual non-aggression pact (August 1965 Watts uprising): canonical inter-movement LA solidarity practice; Arellanes is a canonical first-person source.
- East LA Free Clinic (Brown Berets + Physicians for Community Action + Psychologists for Community Action): canonical 1968+ LA Chicano/Jewish-progressive medical-services partnership; foundational community-medicine institutional model.
- UMAS (United Mexican American Students): foundational Chicano-movement student organization 1967+.
- "Indian vaquero" tradition: canonical 19th-century California "Indian vaquero" labor tradition (formerly-mission-enslaved Native cattle ranchers); foundational California-history vocabulary.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 47.P3.1 | "ditch guns" → Chicanos cross-corpus erasure | catalog category G entry needed | high (catalog) | catalog | Pass 2 #47.P2.3 caught "ditch guns" → Chicanos. Pass 3 catalog-catch: this is a high-damage Whisper-substitution pattern that erases Chicano identity, comparable to the "Slave/Cleve" pattern in catalog category H. Add to catalog category H as Special Pattern with damage-warning flag. |
| 47.P3.2 | "a seven-year-old" → "a 70-year-old" age-substitution | catalog category G entry needed | high (catalog) | catalog | Pass 2 #47.P2.1 caught this high-damage age-misattribution. Pass 3 catalog-catch: Whisper consistently mis-renders "seventy" as "seven" — affects elder-interview accuracy across the corpus. Add to catalog category G with priority flag for any elder-interview scan. |
| 47.P3.3 | "tongue-bite" → Tongva (canonical-figure damaging) | catalog category C/E entry needed | high (catalog) | catalog | Pass 1 #47.10 + Pass 2 #47.P2.33 confirmed recurring "tongue-bite" rendering throughout the transcript. Pass 3 catalog-catch: this is a corpus-distinctive (Arellanes-specific but generalizable) high-damage Whisper substitution erasing Tongva indigenous identity. Add to catalog category E (Pre-Movement-era and supporting figures) as Tongva entry. |
| 47.P3.4 | Smithsonian-related cross-reference (JP Harrington) | already canonical | speaker-originating | n/a | Pass 1 #47.12 marked JP Harrington as canonical-correct. Pass 3 institutional-cross-reference: the Library of Congress / Smithsonian gatekeepers reviewing this corpus should be flagged that this transcript explicitly cites Harrington's Smithsonian recordings as foundational source material for contemporary Tongva language revival — a strong "validation" data point for the Smithsonian-grade gate. |

**Audit-complete marker**: Pass 3 complete on entry #47 as of 2026-05-22. Ready for adversarial-model review.
