#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 121.9 (Charlie Kraft / Charlie Craft) | medium (Stage-3 LLM) | high | Speaker's own family genealogy; "Charlie Craft" is the canonical ex-slave great-grandfather name as Pass 2 confirmed via the Laura Barnes marriage context. Speaker-originating family-history with no plausible alternative. Promote to high. |
| 121.P2.5 (the old, old white Natty) | low | low + adversarial-flag | Speaker idiom unclear — "white nasty/nasties" vs. "white Nazis" cannot be disambiguated from context alone. Defer to multi-model. |
| 121.P2.6 (McCone family) | low | low + adversarial-flag | Speaker's maternal great-grandmother's adoptive family — name remains uncertain. Defer to multi-model genealogy lookup. |
| 121.P2.9 (Mrs. Wynn / Mrs. Smith) | low | medium | Pass 2 already disambiguated Pass 1's conflation — there are two distinct figures (Jeanette Smith #100 + a separate Mrs. Wynn). Speaker explicitly confirms two SOHP interviews same day. Promote to medium pending Mrs. Wynn's full identification. |
| 121.P2.12 (Lions room and team) | medium | medium + adversarial-flag | Whisper-degradation; FBI-interrogation context disambiguates ("lying" = denying), but specific dialog is severely garbled. Flag for adversarial review. |
| 121.P2.17 (Mr. Wishon CO surname) | low | low + adversarial-flag | Speaker's Air Force Kentucky CO name; not externally verifiable. Defer to USAF unit-roster research. |
| 121.P2.42-43 (DSI / TS-SI clearance) | low | low | Specialized USAF security-clearance abbreviation; not externally verifiable in transcript context. Leave as low + acceptable for unresolved technical jargon. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 121.P2.5 | "old, old white Natty" → nasty whites / Nazis | Speaker idiom unclear; multi-model could disambiguate via period Black-Mississippi vernacular |
| 121.P2.6 | McCone family adoption | Forrest County MS 1880s-90s Black family identification — genealogy database lookup needed |
| 121.P2.12 | "Lion's room and team / Lion stood in flat foot" | Severely degraded FBI-interrogation passage; multi-model could reconstruct intended dialogue |
| 121.P2.17 | Mr. Wishon (Kentucky USAF CO) | Surname uncertain; USAF historical-unit roster verification |
| 121.P2.42-43 | DSI / TS-SI clearance | USAF specialized comm-center clearance terminology — model should confirm canonical abbreviation |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Vernon Dahmer Sr. — Hattiesburg NAACP president 1958-66; Forrest County voter-registration leader; killed by KKK firebombing Jan 10, 1966; foundational Mississippi martyr referenced cross-corpus in #21, #33, #36, #100, #121 (already flagged in catalog section I but not yet added)
- Sam Bowers (Samuel Holloway Bowers Jr.) — Imperial Wizard of the White Knights of the Ku Klux Klan in Mississippi 1964-72; mastermind of Jan 10, 1966 Dahmer firebombing + Jun 21, 1964 Schwerner-Goodman-Chaney murders; convicted Aug 21, 1998 of Dahmer's murder; canonical figure repeatedly miss-rendered by Whisper as "Soundbowers / Sound Bowers"
- White Knights of the Ku Klux Klan — Sam Bowers's 1964-72 Mississippi terror-organization; perpetrators of the canonical Schwerner-Goodman-Chaney + Dahmer murders; canonical FBI MIBURN target
- Kelly Settlement (Forrest County MS) — canonical Black landowner community ~5 miles north of Hattiesburg; founded by Warren Kelly 1879 on his slave-owner-ancestor land; Dahmer-family ancestral home; foundational Mississippi Black-land-ownership site
- Theron Lynd — Forrest County MS Circuit Clerk 1959-69; canonical voter-registration obstructionist whose denial of Vernon Dahmer Sr.'s registration application became *U.S. v. Lynd* (5th Cir. 1962) — the canonical pre-1965 federal voter-registration injunction Mississippi case (already flagged in catalog section I)
- Clyde Kennard — Hattiesburg MS pre-Meredith higher-education-integration martyr; framed on chicken-feed-theft charges 1960; died of medical neglect in prison 1963 at age 36; canonical Mississippi Movement martyr (already flagged in catalog section I)

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 121.P3.1 | "five of those brothers" (Pass 2 121.P2.10) | five Dahmer brothers emigrated from Darmstadt — speaker establishes canonical Dahmer-family German-immigrant origin | correct | canonical | Reinforce Pass 2; the canonical-immigration-of-five-Dahmer-brothers establishes the genealogy depth of speaker's mixed-race lineage |
| 121.P3.2 | "Megars / Medgev" (Pass 2 121.P2.27 captured "Medgev" but not the full "Megars" rendering) | Medgar Evers | high | canonical-from-catalog | Catalog row C cross-references "mega-evils / mega-ever's / Megars / Medgev / Megahabwitz / Mat here" → Medgar Evers; Whisper renders speaker's reference twice — both as "Medgev" (caught) and "Megars" (missed in Pass 2). Reinforces cross-corpus #1/#36/#41/#43/#44 |
| 121.P3.3 | "Cluclic clan / Clucleic clan" (Pass 2 121.P2.23) | Ku Klux Klan / KKK | high | canonical-alias-new | Add to global cross-corpus catalog as KKK Whisper-rendering variant — previously not in catalog despite being a high-recurrence-likely failure |
| 121.P3.4 | "Joseph H. Fichter, SJ / Father Fichter" | n/a — not in transcript | n/a | n/a | Verified: this Pass-2 row marker exists at 125.P2.39 (Wheeler Parker) as a skip-not-applicable; not present in #121. |
| 121.P3.5 | "March Air Base in California" (Pass 2 121.P2.40) | March Air Force Base, Riverside CA — speaker's Jan 1966 station when father killed | correct | canonical | Reinforces canonical setting; no error to correct |
| 121.P3.6 | "Senator Strom Thurmond / Eastland / Stennis (Mississippi senators)" | n/a — not specifically in 121 tail | n/a | n/a | Pass 2 captured all named-figures in the FBI / Bowers retrial passages; no missed canonical-figure |
| 121.P3.7 | "Hadithworth" (Pass 2 footnote reference) | Hattiesburg | high | canonical-from-catalog | Catalog row F entry already captures "had his Berg / Hadisburg / Hadishburg / Haddie's Burg / Hadisburden → Hattiesburg" — extend catalog to include "Hadesburg" + "Hadithworth" variants explicitly |

**Audit-complete marker**: Pass 3 complete on entry #121 as of 2026-05-22. Ready for adversarial-model review.
