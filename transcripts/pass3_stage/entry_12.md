#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 12.1 ("Emily Crosby" → Emilye Crosby) | medium | high | Cross-corpus catalog row A confirms "Emily Crosby → Emilye Crosby" recurs across #12, #17, #30. Emilye Crosby is the canonical Claiborne County historian, author of *A Little Taste of Freedom: The Black Freedom Struggle in Claiborne County, Mississippi* (UNC Press 2005), and the interviewer of record for this entry. Catalog match upgrades to high. |
| 12.4 ("Ms. Dismute / Jessie Dismute" — Claiborne midwife) | medium | low — flag for adversarial | Speaker recalls a 1950s Claiborne County midwife; surname "Dismukes" / "Dismuke" is plausible Mississippi spelling but the specific individual is unverifiable from public sources. Downgrade with flag — speaker-originating local figure. |
| 12.9 ("Dan McKay / Dan McCay" — Claiborne sheriff) | low | low — flag for adversarial | Stays low — local sheriff name not verifiable from canonical sources without Claiborne County records access; speaker-originating. Crosby's *A Little Taste of Freedom* (2005) is the authoritative published source; adversarial-model search of that text may resolve. |
| 12.10 ("Mr. Mott Hegli / Matt Hegley" — Claiborne educator) | low | medium | Pass 2 #12.P2.7 promoted "Mott Hegli" → "Mott Headley" with the surrounding context of "white plantation owner referenced as having paternalistic relationship with Black workers." Headley is a documented Claiborne County white landowner surname. Promoted from low to medium. |
| 12.13 ("Rudy Shields") | correct | correct + ground-truth candidate | Rudy Shields (d. 1976) is canonical: the Chicago-via-Vicksburg SNCC/NAACP boycott organizer who was Charles Evers's #1 statewide boycott architect (Port Gibson 1966, Natchez 1965, Fayette 1966). Protagonist of Crosby's book. Not in current civil_rights_facts.json. |
| 12.15 ("George Henry / George and them" → George Henry Walker) | medium | medium — flag for adversarial | "George Henry Walker" plausible but the specific Claiborne County youth organizer cannot be verified without Crosby's local-roster cross-reference; adversarial model may resolve. |
| 12.18 ("the Buiwai set / Vagracial Committee" → Bi-Racial Committee) | high | high (unchanged) | Maintained — the 1966 Claiborne County Bi-Racial Committee / Human Relations Committee is the documented negotiating body during the boycott. |
| 12.19 ("Camerrill Williams" → Cameron Williams / Carruth Williams) | medium | low — flag for adversarial | Pass 2 #12.P2.25 introduces "Carruth Williams (likely)" as an alternative to "Cameron Williams." Neither resolves cleanly. Downgrade with flag pending Claiborne-County roster access. |
| 12.20 ("Joe Zerl" → Joe Searles / Joe Sayres) | low | low — flag for adversarial | Stays low; Claiborne-County-specific surname unverifiable. |
| 12.21 ("Reverend Wendy") | low | low — flag for adversarial | Stays low; local Claiborne minister unverifiable. |
| 12.24 ("King's Sushun / King's Sushine" — Port Gibson business) | low | low — flag for adversarial | Stays low; local business name unverifiable. |
| 12.26 ("Ms. Rachel Wilson Ken Lamont" → Rachel Williams-Kennard) | low | low — flag for adversarial | Hermanville schoolteacher surname unverifiable; stays low. |
| 12.33 ("Louis Lullaby Turnipsey") | medium | medium (unchanged) | Pass 2 #12.P2.24 settled on "Louise Lullabelle Jennings Turnipseed (likely)" — but the canonical spelling of the given name remains ambiguous; medium maintained. Could also be "Lue Bell" or "Lou Bell" per Mississippi naming conventions. |
| 12.35 ("a virginity" — great-uncle's name garbled) | low | low — flag for adversarial | Stays low — Whisper garble of a personal name with no recoverable phonetic core; speaker said "her brother, her virginity"; could be "Virgil" / "Virgie" / "Vernon" but cannot resolve. |
| 12.36 ("Marshall Williams / Cameron Williams") | low | low — flag for adversarial | Stays low; Claiborne family-name verification gap. |
| 12.37 ("the four days Cason Project") | low | low — flag for adversarial | Likely Whisper garble of "the Freedom Vote project" or "the Delta Ministry project" but cannot resolve; stays low. |
| 12.39 ("first chapter of the church" → First AME Church) | low | high | Resolved by P2-tail #12.P2T.22: surrounding context ("biggest church in the community" + canonical First A.M.E. Church Port Gibson identifier in Crosby's book) confirms. Promoted from low to high. |
| 12.41 ("Cleveland, I'm on" → Tamir Rice) | low | high | Resolved by P2-tail #12.P2T.12 + #12.P2T.13 surrounding context — speaker pivots to contemporary-era unarmed-Black-killing references (Cleveland → Tamir Rice; 16 shots → Laquan McDonald). Promoted from low to high. |
| 12.P2T.4 (Emerson Davis — Port Gibson white antagonist) | low | low — flag for adversarial | Speaker-originating consistent through the disarming narrative, but no canonical published reference; stays low pending Crosby/local-records cross-check. |
| 12.P2T.7 / 12.P2T.8 (wad shot / misfire / must game) | low / medium | low — flag for adversarial | Whisper firearms-idiom garble; speaker-originating accuracy unverifiable. |
| 12.P2T.15 ("Wyatt's / why he's") | low | low — flag for adversarial | Filler-word vs. personal-name ambiguity stays low. |
| 12.P2T.16 ("Jones Jones" — furniture-store owner) | medium | medium — flag for adversarial | Port Gibson white merchant surname; speaker self-corrects on tape; needs Crosby's-book / local-records confirmation. |
| 12.P2T.26 / 12.P2T.27 ("little soldier" / "Hollywood") | low | low — flag for adversarial | Freedom-song lyric / singer identification not recoverable from context. |
| 12.P2T.28 ("Her and Dali" — singer's name) | low | low — flag for adversarial | Personal-name Whisper garble; unverifiable. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 12.4 | Mrs. Jessie Dismuke / Dismukes (midwife) | Local figure unverifiable from public sources |
| 12.9 | Dan McKay / McCay (sheriff) | Local figure; needs Crosby's-book cross-check |
| 12.15 | George Henry Walker (youth organizer) | Local figure; needs Crosby's local-roster cross-check |
| 12.19 | Cameron / Carruth Williams | Two candidate surnames; needs Crosby-book cross-check |
| 12.20, 12.21, 12.24, 12.26, 12.35, 12.36, 12.37 | Multiple speaker-originating local proper nouns | Whisper-garble of local figures, businesses, projects; adversarial-model search of Crosby's *A Little Taste of Freedom* may resolve many |
| 12.P2T.4 | Emerson Davis (white antagonist Rudy Shields disarmed) | Speaker-originating consistent but needs corroboration |
| 12.P2T.16 | Jones furniture-store owner | Port Gibson local-merchant surname |
| 12.P2T.26-28 | "little soldier" / "Hollywood" / "Her and Dali" — freedom-song-lyric / singer-name fragments | Possibly Bertha Gober or another Albany/Port-Gibson singer |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Rudy Shields (d. 1976): Chicago-via-Vicksburg SNCC/NAACP boycott organizer; protagonist of Crosby's *A Little Taste of Freedom*; foundational figure in the post-1964 Mississippi-statewide boycott strategy (Natchez 1965, Port Gibson 1966, Fayette 1966). Mentioned in cross-corpus catalog row C as canonical figure.
- *NAACP v. Claiborne Hardware Co.* (1982): Landmark Supreme Court decision (458 U.S. 886) affirming the right to organize economic boycotts as protected First Amendment speech; arose from the 1966 Claiborne County boycott this transcript documents. Already a candidate in the master MD's section I cross-reference list (implicitly via the Claiborne-County coverage); should be added as a canonical-events entry.
- Charles Evers (1922-2020): Medgar Evers's older brother; MS NAACP Field Director 1963-87 (succeeding Medgar); first Black mayor of Fayette MS 1969-89; foundational figure in post-1963 Mississippi NAACP statewide boycott strategy. Not in current civil_rights_facts.json despite high corpus frequency.
- Emilye Crosby: Civil-rights historian; *A Little Taste of Freedom: The Black Freedom Struggle in Claiborne County, Mississippi* (UNC Press 2005); CRHP interviewer for #12 and others. Recurring corpus-team-name failure pattern (Whisper renders as "Emily Crosby") makes this a high-priority interview-team-roster entry. Already in cross-corpus catalog row A.
- Deacons for Defense and Justice: armed self-defense group founded 1964 in Jonesboro LA, chartered chapters across MS and LA; canonical foil to the SNCC/SCLC nonviolent framing. Recurring corpus reference (catalog row B); not currently a standalone canonical-events entry.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 12.P3.1 | "Sumter County Stolen Girls Leesburg Stockade" (Pass 2 mention at the end of #113 Sam Mahone) | Stolen Girls of Leesburg (1963 Americus GA jail-of-teen-girls episode) | high | canonical | Cross-corpus reference relevant if the speaker mentions the Americus context; needs to be flagged for any joint-Sherrod/Sam-Mahone/James-Miller cross-corpus coherence check. |
| 12.P3.2 | "Pigford v. Glickman" (1999 USDA discrimination class action) | Pigford v. Glickman / Pigford settlement | high | canonical | Referenced indirectly in Carolyn's Hermanville-grandparents arc; the 1999-2010 USDA-discrimination class action that settled $1.06 billion for Black farmers, with most settled in 2009-10 under the Obama-era Pigford II. Catalog-worthy as a recurring corpus-end reference for Black-farmer post-Movement context. |
| 12.P3.3 | "AME Church" / "First AME Church Port Gibson" not yet in catalog | First African Methodist Episcopal Church, Port Gibson MS | high | canonical | Resolved-to-high in Pass 3 above (was P1 #12.39 + P2T #12.P2T.22). The canonical mass-meeting church of the 1966 Port Gibson boycott; should be added to the catalog as a canonical Movement venue. |

**Audit-complete marker**: Pass 3 complete on entry #12 as of 2026-05-22. Ready for adversarial-model review.
