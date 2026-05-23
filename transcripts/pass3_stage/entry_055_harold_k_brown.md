#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 55.P2.2 (David Klein → David Cline) | medium | high | David Cline (Cline-with-a-C) is canonical Virginia Tech History Department associate professor and the documented CRHP Western Region interviewer for multiple LoC-cataloged sessions in 2016, including Hopkins (CA) and Brown (San Diego); Whisper's "Klein" is the German-Yiddish spelling commonly substituted for English-Irish "Cline." Promote to high. |
| 55.P2.23 (the United Nations → the Y / YWCA) | high | high (confirmed) | Pass 2 already high; reinforce — speaker's context ("a place to live for the new bride") confirms Y not UN, and the temporal/geographic setting (1950s-60s San Diego) further excludes a UN reference. Confirm. |
| 55.P2.34 (Reverend Sharpton) | high | high (confirmed) | Confirm Al Sharpton canonical; June 2016 transcript date matches Sharpton's National Action Network media presence. Confirmed. |
| 55.P2.39 (Charles, I mean Lewis) | low | low (flag for adversarial) | Brown is in the middle of a recollection-stumble; the candidate could be Charles Sherrod, Charles McDew, or a different Charles entirely from the West Coast CORE network (e.g., Charles Hamilton). Resists confident resolution from single-pass. Flag for adversarial review. |
| 55.P2.41 (Florida McKissick → Floyd McKissick) | high | high (confirmed) | Confirm; Brown's San Diego pronunciation produces the "Florida" rendering consistently; recurring Whisper pattern shared with Big Man Howard #35. |
| 55.P2.42 (New Year → New York) | high | high (confirmed) | Brown's pronunciation produces "New Year"; recurring rendering confirmed. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 55.P2.39 | Charles ("I mean Lewis") | Three-way candidate (Sherrod / McDew / Hamilton); Brown's mid-sentence correction provides no disambiguation cue. Needs adversarial cross-check with the West Coast CORE network roster. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Floyd B. McKissick (Floyd Bixler McKissick, 1922–91): CORE National Chairman 1966–68; succeeded James Farmer as National Director; Soul City NC founder; foundational Black-economic-development figure; first Black student at UNC Law School (1951)
- Maulana Karenga (Ronald McKinley Everett): US Organization founder 1965; Kwanzaa originator 1966; foundational cultural-nationalist Black Power figure
- Donald Warden / Khalid Abdullah Tariq al-Mansour: UC Berkeley Law student who founded Afro-American Association 1962; Black-nationalist study group mentor to Huey Newton and Bobby Seale before BPP formation
- Dr. Jack Kimbrough: Foundational San Diego Black dentist; pre-CORE Woolworth's-sit-in organizer; West Coast civil rights figure
- King Moshoeshoe II of Lesotho (1938–96): Reigned 1960–90, 1995–96; opposed apartheid and was confined to palace 1970+ by PM Leabua Jonathan; foundational Southern African anti-apartheid royal figure
- Lerone Bennett Jr. (1928–2018): *Before the Mayflower* (1962) author; Ebony magazine senior editor; foundational Black-history popularizer

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 55.P3.1 | the soutu / the suit to (recurring rendering for Lesotho) | Lesotho | high | new catalog candidate | Pervasive Brown-specific Whisper rendering; "Lesotho" → "the soutu" / "the suit to"; add to Catalog F (Geographic errors) for low-frequency but distinctive geographic substitution |
| 55.P3.2 | basouto (referring to Lesotho citizens) | Basotho | high | new catalog candidate | Whisper doubled-vowel insertion (same family as NAG → NAAG); demonym rendering for citizens of Lesotho; add to Catalog F |
| 55.P3.3 | Miseru | Maseru | high | new catalog candidate | Recurring Whisper rendering for the Lesotho capital; add to Catalog F |
| 55.P3.4 | Christmas Attics | Crispus Attucks | high | new catalog candidate | High-damage Whisper rendering on foundational Boston Massacre martyr; new Catalog C entry; ensure Stage-2 fuzzy matcher catches; speaker mentions York PA's Crispus Attucks Center, but the pattern is corpus-recurring (Whisper has historically rendered "Crispus Attucks" as Christmas Attics or similar in multiple WWII-era Black-cultural-references contexts) |
| 55.P3.5 | Elkhohon Valley | El Cajon Valley | high | new catalog candidate | San Diego County geographic substitution; add to Catalog F |
| 55.P3.6 | the rev of Sharpton | Reverend Al Sharpton | high | new catalog candidate | New Catalog C entry; Whisper splits "Reverend Al" as "rev of"; add for fuzzy matcher |
| 55.P3.7 | Bonneville National Forest (Brown's basic training site) | Camp Gordon, Georgia | correct (n/a, already noted) | n/a | Reconfirms 55.P2.40 — note that Brown's vocabulary substitutes "Bonneville National Forest" but means Camp Gordon (Augusta GA) |
| 55.P3.8 | the Rome Bennett | Lerone Bennett Jr. | high | new catalog candidate | Whisper-mangled rendering of "Lerone" as "the Rome"; add to Catalog E (Pre-Movement-era figures) |
| 55.P3.9 | mail ins / coin ins | mail-ins / coin-ins | speaker-originating | n/a (not a Whisper error) | Tactical innovation by Brown's San Diego CORE; speaker-originating West-Coast-CORE direct-action vocabulary; note in glossary, not catalog |
| 55.P3.10 | Charsay Affairs | Chargé d'Affaires | high | new catalog candidate | French diplomatic title commonly Whisper-rendered; add to Catalog G (common nouns / idioms) |

**Audit-complete marker**: Pass 3 complete on entry #55 as of 2026-05-22. Ready for adversarial-model review.
