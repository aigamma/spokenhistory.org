#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 62.10 / 62.P2.25 16th Street Armory -> 168th Street Armory | medium | high (promoted) | The 168th Street Armory (formally the 369th Regiment Armory, Washington Heights) was the foundational NYC indoor-track venue in the 1950s-60s — the "16th Street" is implausible (no major NYC armory at 16th Street). The canonical Carlos-era NYC indoor track was held at the 168th Street Armory and at the Park Avenue Armory. Promote to high. |
| 62.P2.15 Elgin Bell -> Elgin Baylor | high | high (kept) | "Bill Russell, Elgin Bell and the guys before them" — Elgin Baylor was the canonical LA Lakers forward of Carlos's childhood; "Bell" is a clear Whisper failure on "Baylor" (homophone-ish rendering). Resolution stands. |
| 62.P2.16 Wilk Chamon / Wilt Chambon -> Wilt Chamberlain | high | high (kept) | Canonical Philadelphia/LA NBA center; played Rucker Park summer tournaments; the speaker's Harlem context fits unambiguously. Resolution stands. |
| 62.P2.17 Rutgers tournament -> Rucker Park / Rucker Tournament | high | high (kept) | The Holcombe Rucker Park tournament at 155th & 8th Avenue is the canonical Harlem summer pickup-vs-pros venue. The "Rutgers" Whisper rendering is a clear failure (no Rutgers University tournament in NYC for this era). Resolution stands; add to catalog as Whisper failure mode. |
| 62.P2.21 Mr. Levy | low | low (kept) | Speaker-originating NYPC coach name; spelling unverified. The canonical New York Pioneer Club coaches alongside Joe Yancey included Bill Levy or similar; without an NYPC-roster lookup, low stays. Flag for adversarial review. |
| 62.P2.55 Dr. Tassel -> San Jose State president | low | low (kept) | Pass 2 author proposed Don Kassing (interim president 2004-08) as the likely "Dr. Tassel" at the October 2005 Smith/Carlos statue dedication. This is plausible — Kassing was interim 2004-08 and would have presided over the dedication. But without a campus-archive confirmation, low stays. Flag for adversarial review. |
| 62.P2.59 Canaan Miles | low | low (kept) | Speaker's recollection unclear; possibly the name of a small business or training partner. Flag for adversarial review. |
| 62.P2.71 Sochi / Finns | high | high (kept) | "Like Finns is right now, Mr. Putin" — Carlos is referring to the 2014 Sochi Winter Olympics anti-gay-law context; "Finns" is Whisper's phonetic failure on "Sochi" (perhaps via "Soche" -> "Fens"). Resolution stands. |
| 62.P2.77 Paul (Harvard rowing team) -> Paul Hoffman | medium | high (promoted) | Paul Hoffman is the documented Harvard rowing-team OPHR-supporter who threw down the spare OPHR pin Carlos gave Peter Norman on the medal stand. This is canonical Olympic-Project-for-Human-Rights history. Promote to high. |
| 62.P2.78 Iceland and Greenland | correct | n/a (housekeeping) | Pass 2 author noted "this is John Rosenberg's path, not Carlos — flag and ignore." Confirmed cross-corpus contamination; drop from final output. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 62.P2.21 | Mr. Levy (NYPC coach) | NYPC-roster lookup needed. |
| 62.P2.55 | Dr. Tassel -> San Jose State president | Don Kassing (interim 2004-08) is plausible but unverified. |
| 62.P2.59 | Canaan Miles | Unidentified reference; speaker context unclear. |
| 62.P2.74 | The Pink Pussycat (Greenwich Village) | Pass 2 noted Carlos may be conflating with another venue; second-source check needed. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Dr. John Carlos (b. 1945): 1968 Mexico City Olympics 200m bronze medalist; Black Power salute on the medal stand alongside Tommie Smith and Peter Norman (October 16, 1968); foundational athlete-activism figure; canonical Olympic Project for Human Rights (OPHR) participant.
- Tommie Smith (b. 1944): 1968 Mexico City Olympics 200m gold medalist; world-record holder; canonical co-Black-Power-salute athlete; later Oberlin and Santa Monica College track coach.
- Peter Norman (1942-2006): Australian 1968 Mexico City Olympics 200m silver medalist; OPHR-button wearer; ostracized by Australian athletics establishment for his stance; foundational interracial-Olympic-solidarity figure.
- Dr. Harry Edwards (b. 1942): San Jose State sociology professor; founder Olympic Project for Human Rights (OPHR) 1967; foundational architect of the 1968 Olympic boycott; lifelong athlete-activism intellectual.
- Olympic Project for Human Rights (OPHR): 1967-founded Black-athlete protest organization led by Harry Edwards; demanded the IOC remove apartheid South Africa and Rhodesia from the Olympics, that the US restore Muhammad Ali's heavyweight title, and that Avery Brundage step down as IOC president; foundational athlete-activism collective.
- Lewis Michaux (1885-1976): Founder Michaux's National Memorial African Bookstore ("House of Common Sense and Home of Proper Propaganda") at 125th & 7th Avenue Harlem (1932-74); foundational Harlem Black-nationalist meeting place; Malcolm X / Marcus Garvey movement intellectual hub.
- Joseph "Joe" Yancey (1910-1991): Founder of the New York Pioneer Club (1936); foundational integrated-NYC-track-club figure; coach to Mal Whitfield, Reggie Pearman, John Carlos, and other Black Olympic athletes; foundational sport-civil-rights bridge figure.
- The 1936 Berlin Olympics / Jesse Owens parallel (canonical historical event already in corpus as Owens?) — if not, add: Jesse Owens (1913-1980) 4-gold-medal 1936 Berlin Olympics achievement as the foundational pre-Carlos Black-Olympic-activism precedent that Carlos explicitly cites.
- Kareem Abdul-Jabbar (Lew Alcindor, b. 1947): 1968 OPHR-boycott participant; UCLA basketball center; converted to Islam and adopted Kareem Abdul-Jabbar name 1971; foundational athlete-activism figure who declined to play in the 1968 Olympics in solidarity with Smith/Carlos.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 62.P3.1 | "the auto bom bar room" / "Auto bom barroom" (multiple renderings) | Audubon Ballroom | high | catalog | Pass 1 / Pass 2 caught the Audubon Ballroom rendering multiple times (62.28, 62.P2.46, 62.P2.57). Pass 3 confirms this is a corpus-wide pattern worth adding to catalog F (geographic errors). The Whisper failure stems from "Audubon" parsed as "auto bom" or "audio bom" + "Ballroom" parsed as "barroom" (homophonic substitution). |
| 62.P3.2 | "Linux Avenue" (Pass 1 noted) | Lenox Avenue | high | catalog | Add to catalog F as a recurring geographic-error pattern: "Linux" / "Lennox" -> "Lenox" (Harlem Avenue, now Malcolm X Boulevard). Distinctive because "Linux" is a tech-era term that Whisper substitutes for the unfamiliar place name. |
| 62.P3.3 | "PSL" -> PSAL (Public Schools Athletic League) | high | catalog | Pass 2 row 62.P2.28 caught this. Worth a catalog entry for NYC-school-athletics references — the PSAL is the canonical NYC public schools athletic league (1903-) and a critical Black-athlete-pipeline institution. |
| 62.P3.4 | "Robin Hood" framing | (correct speaker phrasing) | speaker-originating | n/a | Carlos's "split the pea in half — God's law vs. man's law" framing is foundational canonical first-person material. Flag for possible Smithsonian-grade summary quote. |
| 62.P3.5 | "Texas Ranger" statue | Texas Ranger statue (DFW Airport) | correct | canonical | Pass 2 row 62.P2.75 caught this. The bronze Texas Ranger statue "One Riot, One Ranger" was a foundational segregation-era symbol at DFW Airport; removed June 2020. Worth a catalog entry as a recurring Carlos-era Black-traveler geographic landmark. |

**Audit-complete marker**: Pass 3 complete on entry #62 as of 2026-05-22. Ready for adversarial-model review.
