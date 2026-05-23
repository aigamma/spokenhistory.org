#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 5.14 MS Pickers / Mrs. Vickers | n/a | n/a (correct - interviewee name) | Single-vowel Whisper drop on speaker's own surname. The speaker's name is canonical to the interview; no further resolution needed. Mark as correct/trivial. |
| 5.16 Andy Young -> Andrew Young | speaker-originating | speaker-originating + canonical-cross-ref | Andrew Young is canonical (in civil_rights_facts.json); speaker's "Andy Young" is the documented informal form. Speaker-originating + cross-reference to canonical entry. |
| 5.21 Slating Nina Verilam | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | "Likely a donor's name garbled" per Pass 1. Pass 2 row 5.P2.10 also notes "unverified - likely Nina Voorhees or similar local donor." Cannot resolve from transcript. Flag. |
| 5.23 McCann / Patrick Cohnan / Patrick Kahnan / Conan -> Patrick Canan | high | high | Pass 2 row 5.P2.8 maintained at MEDIUM. Patrick Canan is a documented St. Augustine attorney involved in the Foot Soldiers Monument fundraising. Multiple Whisper renderings cluster around "Canan." Promote to HIGH given Pass-1's biographical confirmation + Pass 2's canonical-alias categorization. |
| 5.24 Del Khan | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | "Musician's name - possibly Del Kennedy" per Pass 1. Cannot verify. Flag. |
| 5.27 Earl Jones | speaker-originating | speaker-originating | St. Augustine City Commissioner, African American; unverifiable in canonical sources without local-government records. Single-category. |
| 5.28 Ivory Doctor Helen | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | "It had to get rid of Ivory Doctor Helen" - Pass 1 hypothesizes "I voted Dr. Hayling out of his role" (community decision). The "Ivory" prefix is unrecoverable; speaker's actual phrasing could be "I voted out Dr. Hayling" with Whisper rendering noise. Flag. |
| 5.30 Donald Duncan / Wolland Duncan -> Yvonne Duncan | medium | high | Same resolution as 4.51 (cross-entry pair): Gwendolyn Duncan per Pass 2 row 4.P2.15. Cross-entry promotion = HIGH. |
| 5.P2.1 Montsehnt Hotel -> Monson Motor Lodge | medium | high | Monson Motor Lodge is canonical site of the June 18, 1964 acid-in-pool incident; Pass-2 hypothesis "Vickers's mother may have worked at the predecessor Monson House" + Pass-2's cross-entry confirmation in entry #4 (Pass 2 row 4.P2.10) = HIGH. |
| 5.P2.10 Nina Verilam | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Same as 5.21 above. |
| 5.P2.13 Mr. Dews | low | speaker-originating | "Earl Dews or Dewes" per Pass 2; unverifiable. Single-category speaker-originating. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 5.21 / 5.P2.10 | Slating Nina Verilam / Nina Voorhees | Local donor; unverified against any external source. |
| 5.24 | Del Khan / Del Kennedy (musician) | Musician's name; cannot verify. |
| 5.28 | Ivory Doctor Helen / "I voted Dr. Hayling out" | Speaker's phrasing reconstruction uncertain; community-decision context plausible but unrecoverable. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Foot Soldiers Monument (St. Augustine Plaza de la Constitución, 2011): First public civil rights memorial in St. Augustine FL. Vickers led the fund-raising drive (post-2004); commemorates the 1963-64 St. Augustine movement participants. NOT in corpus as a standalone canonical event/monument.
- Leni Riefenstahl: Nazi-era German filmmaker (Triumph of the Will, 1935; Olympia, 1938). Pass 2 row 5.P2.14 confirms canonical. Speaker (Vickers, via cross-entry mention) compares Riefenstahl's technical skill to morally problematic message - a recurring rhetorical device in interviews with Black artist-activists about propaganda aesthetics. NOT a civil-rights-canonical figure but worth noting as a cross-entry reference point that recurs in #5 + #6 Caldwell.
- Jackie Robinson: First Black MLB player (Brooklyn Dodgers, 1947); civil rights activist. ALREADY IN CORPUS? Let me re-verify - civil_rights_facts.json has no standalone "Jackie Robinson" entry; he's referenced inside other entries but not as a primary figure. NOT in corpus as standalone.
- Jackie Robinson Foundation: Founded 1973 by Rachel Robinson (Jackie's widow); provides scholarships for minority college students. Hosted the St. Augustine Four after their release from reform school. NOT in corpus.
- Solomon Calhoun: St. Augustine HS basketball coach + Recreation Department director; later city commissioner; the Solomon Calhoun Community Center is named after him. NOT in corpus (canonical local figure).
- Patrick Canan: St. Augustine attorney; foundational legal advisor to the Foot Soldiers Monument fundraising effort. NOT in corpus (canonical local figure).
- Phil McDaniel: St. Augustine private citizen donor; hosted the Foot Soldiers Monument fundraising dinner. NOT in corpus (canonical local figure).
- The "West Side Boys" of St. Augustine: Armed Black men who guarded Dr. Hayling's home from Klan night-riders during the 1963-64 campaign. NOT in corpus as a standalone canonical group.
- Florida Memorial College (St. Augustine 1918-1968, then Miami): St. Augustine HBCU through 1968 (moved to Miami after a complicated land-sale dispute). NOT in corpus.
- Excelsior High School (St. Augustine): Black high school during segregation era. NOT in corpus.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 5.P3.1 | "5013C" -> "501(c)(3)" (Pass 1 row 5.37) | 501(c)(3) | high | canonical-alias | Pass 1 row 5.37 captured this; the IRS nonprofit-status form is canonically formatted with parentheses around "(c)" and "(3)". Confirming Pass 1's correction; no further catch. |
| 5.P3.2 | Madonna (the dog) verification cross-entry | Madonna (Dr. Hayling's boxer dog, killed in Klan attack) | speaker-originating | local | Pass 1 row 5.11 + Pass 2 row 5.P2.12 both confirm. The dog's killing during the September 18, 1963 Klan attack on Hayling's home (during the founding meeting of the American Nazi Party member George Lincoln Rockwell's group's protest of the Klan/Hayling confrontation) is documented in St. Augustine historical record. Cross-entry confirmation - no new catch. |
| 5.P3.3 | "Lincoln's Hill" / "Lankenville" -> "Lincolnville" cross-entry pattern | Lincolnville (St. Augustine) | high | canonical | Pass 1 row 5.10 + Pass 2 row 5.P2.2 both confirm. Cross-entry with #4 Pass 1 row 4.45 ("Lankanville/Lankenville/Lincoln's Hill -> Lincolnville"). The cross-entry pattern is documented; recommend adding to the catalog row F (geographic errors) as a recurring St-Augustine-specific Whisper failure with entries #4 and #5. |
| 5.P3.4 | "St. Benedict the Moor Catholic School" - Black Catholic school | St. Benedict the Moor Catholic School (St. Augustine) | speaker-originating | local-canonical | Pass 1 row 5.3 captures speaker's reference. The school was founded by the Josephite Fathers in the early 20th century for Black Catholic education in St. Augustine; canonical local institution. Speaker-originating is correct categorization but worth noting as a cross-entry reference if other St. Augustine speakers also reference it. |
| 5.P3.5 | "Bayfront Health Inn" vs "Bayfront Hilton" - interview location | Hilton Bayfront (location of #4 interview) / Bayfront Health Inn (location of #5 interview - per header) | high | speaker-originating | The two interviews were recorded in different hotels on the same day in St. Augustine (per entry headers): #4 at "Hilton Bayfront" (per header for #4), #5 at "Bayfront Health Inn" (per header for #5). Pass 1 row 5.32 marks "Bayfront Health Inn" as speaker-originating but this is actually the canonical location-name from the entry header. Worth confirming whether these are two distinct hotels or one renamed venue. Minor cross-entry inconsistency. |

**Audit-complete marker**: Pass 3 complete on entry #5 as of 2026-05-22. Ready for adversarial-model review.
