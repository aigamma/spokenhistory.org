#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 122.3 (Marion L. Poe) | speaker-originating (no confidence) | high | Marion L. Poe is canonically the first Black female attorney in Virginia (admitted 1925, Hampton VA). Speaker correctly identifies this canonical figure. Promote to high. |
| 122.4 (Mary Ann Benz) | speaker-originating | medium | Speaker's personal mentor and the wife of Newport News' first Black urologist — name plausible but not externally verifiable. Hold at medium. |
| 122.11 (Marie Sallasin) | speaker-originating | high | Marie Sallasin is canonically one of the "Richmond 34" Virginia Union sit-in arrestees (Feb 1960 Thalhimers). Speaker's identification matches canonical movement historiography. Promote to high. |
| 122.12 (Patricia Washington / Pat) | speaker-originating | high | Patricia Washington is canonically one of the Richmond 34. Speaker's account of Pat's white-passing barbershop episode reinforces. Promote to high. |
| 122.15 (Dr. Jones / Dr. Tucker) | speaker-originating | medium | Speaker's local-Newport News Black-owned drugstore proprietors; plausible but not externally verifiable. Hold at medium. |
| 122.P2.3 (RIP Black) | low | low + adversarial-flag | Speaker idiom unclear; possibly "all Black" or "racially isolated Black" — multi-model needed |
| 122.P2.8 (the Lakson / Jackson MS) | medium | low + adversarial-flag | Likely not Jackson MS at all (speaker is in Virginia context); possibly a Newport News-area location. Defer. |
| 122.P2.12 (not too far for me / drag along) | medium | low | Whisper drop-out, conversational filler; not load-bearing |
| 122.P2.21 (dorm lady / dorm matron) | medium | high | Canonical 1959-60 Black-women's-college dorm-matron context confirmed; promote |
| 122.P2.23 (North Town Philadelphia suburb) | low | low + adversarial-flag | Uncertain Philadelphia neighborhood for Patricia Washington's family home — multi-model could disambiguate via Philadelphia Black-middle-class 1940s-50s geography |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 122.P2.3 | "RIP Black" speaker idiom | Unclear period Black-Newport-News vernacular for residential segregation |
| 122.P2.8 | "the Lakson" geographic referent | Probably not Jackson MS; multi-model needed to identify Virginia-area location |
| 122.P2.23 | "North Town" Philadelphia suburb | Patricia Washington family-home identification (Norristown? Yeadon? Germantown?) |
| 122.4 | Mary Ann Benz / Newport News first Black urologist's wife | External verification of Newport News Black-medical-community 1950s-era genealogy |
| 122.15 | Dr. Jones + Dr. Tucker Black-owned drugstore | Newport News Black-business-community 1940s-50s verification |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Maggie L. Walker — first Black woman to charter a US bank (St. Luke Penny Savings Bank, Richmond VA, 1903); foundational Black-economic-organizing figure; Maggie L. Walker High School Richmond named for her (already flagged in catalog section I)
- Richmond 34 — the canonical Feb 22, 1960 group of 34 Virginia Union University students arrested-and-fingerprinted at the Thalhimers Department Store sit-in under Charles Sherrod + Frank Pinkston leadership; credited by the city of Richmond with desegregating downtown department stores; counterpart to the Greensboro Four and Nashville sit-ins
- Frank Pinkston — Virginia Union pre-1960 student leader + Baptist minister; co-organizer with Charles Sherrod of the Feb 1960 Richmond 34 Thalhimers sit-in
- Thalhimers Department Store — canonical downtown Richmond VA segregated department store + tea-room ("Richmond Room") + target of the Feb 22, 1960 sit-in; family-owned by the Thalhimer family 1842-1992
- LINKS Incorporated — canonical 1946-founded national Black women's social-service organization (founded by Margaret Hawkins + Sarah Strickland Scott, Philadelphia); 16,000+ members across the US; Virginia George is a member of the Springfield MA chapter
- Penn Relays — canonical 1895-founded oldest US track-and-field meet, held annually at U Penn Philadelphia; cultural touchstone for Black middle-class HBCU students 1930s-60s

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 122.P3.1 | "Pinkston → Prince Pink" (Pass 2 122.P2 note) | Add catalog row for Pinkston Whisper-rendering pattern | high | catalog-extension | Pass 2 notes flagged this as global rule needed; formalize as catalog row C addition: "Frank Prince Pink → Frank Pinkston" alongside Sherrod variant entries |
| 122.P3.2 | "Sallasin → unchanged" (Pass 2 122.P2 note) | n/a — already canonical | correct | n/a | Confirms Whisper got this name correct; no catalog-extension needed |
| 122.P3.3 | "the Lynx / Lianke S" (Pass 2 122.P2.4) | Add catalog row for LINKS Inc Whisper-rendering pattern | high | catalog-extension | "Lynx / Lianke S → LINKS Incorporated" needed as new catalog row C entry (Black women's organizations underweighted in current catalog) |
| 122.P3.4 | "Thalhimers → Taham / Talham" (Pass 2 122.P2 note) | Add catalog row for Thalhimers Whisper-rendering pattern | high | catalog-extension | Add to catalog row D (canonical Movement-era institutions); cross-corpus likely with other Richmond-area transcripts |
| 122.P3.5 | "Raleigh University → Shaw University" (Pass 2 122.P2.27) | Critical Pass-1 miss: canonical 1960 SNCC founding conference at Shaw University Raleigh; Whisper rendered as "Raleigh University" | high | canonical-from-catalog | Shaw University Easter 1960 conference is foundational SNCC history; reinforce catalog cross-reference; Whisper failure pattern "Shaw → Raleigh" worth adding to catalog row D |
| 122.P3.6 | "Pearly Rings → Pearl Earrings" (Pass 2 122.P2.6) | Common-noun debutante-context Whisper failure | high | common-noun | Add to catalog row G; debutante-attire-context Whisper failure |
| 122.P3.7 | "Phyllis → Philadelphia" + "Phyllis in" (Pass 2 122.P2.24-25) | Add catalog row for Philadelphia Whisper-rendering pattern | high | catalog-extension | Geographic catalog row F should add "Phyllis → Philadelphia" — recurring failure throughout 122 |
| 122.P3.8 | "Maurice → Marie (Sallasin)" (Pass 2 122.P2.9-10) | Add catalog row for second-half-transcript name-degradation | medium | catalog-extension | Whisper-drift-over-transcript-length pattern — speaker's same proper noun rendered differently in first vs. second halves of long transcripts. Worth noting as catalog row H special pattern |
| 122.P3.9 | "BPU → BYPU (Baptist Young People's Union)" (Pass 2 122.P2.26) | Canonical Black-Baptist HBCU institution acronym | high | canonical | Add to catalog row D religious-organization entries; foundational Black-Baptist-HBCU institution that no current transcript catalog row captures |

**Audit-complete marker**: Pass 3 complete on entry #122 as of 2026-05-22. Ready for adversarial-model review.
