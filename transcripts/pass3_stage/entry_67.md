#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 67.22 UNC State -> NC State (or UNC) | low | high (promoted) | Allard Lowenstein's teaching post in the mid-1960s is canonically documented as NC State University (Raleigh) 1964–66 where he taught American government / political science. "UNC State" is a Whisper compound of two NC institution names. Pass 3 promotes to high. |
| 67.26 Ed V. Brickialpister -> (uncertain Union seminary friend) | low | low (kept) | Multiple plausible attributions (Ed Pister, Ed Whitfield, Ed Spalding); no canonical SNCC/Union cohort match. Adversarial check against Union Theological Seminary 1965 class roster may resolve. |
| 67.39 Larry Bill -> Lavinia Bell or other | low | low (kept) | Local Nashville name; insufficient context to resolve. Speaker recall. |
| 67.43 / 67.P2.24 "Mustang year" at Davidson | low | low (kept) | Davidson's mascot is Wildcats, not Mustangs. Pass 2 P2.24 noted; possibly "maelstrom year" or "master year" (senior year) per Pass 2 speculation. No canonical anchor. Adversarial check warranted. |
| 67.48 Stokeley Carmichael spelling | low (spelling) | speaker-originating (revised) | Spelling variant is canonical-alias issue, not a Whisper transcription error per se. Pass 3 reclassifies as speaker-originating spelling drift; the canonical is "Stokely" (one e). Catalog C documents the "Stokely/Stokeley/Stoke Lee/Stelke" Whisper variants as very high frequency. |
| 67.P2.1 Dennis Sweeney + Lowenstein assassin attribution | high | high (kept) | Pass 2 P2.1 correctly identifies Dennis Sweeney (Stanford SNCC volunteer 1964) as the Lowenstein assassin (March 14, 1980, Lowenstein's NYC office, schizophrenia-related fixed delusion). Cross-corpus catalog confirms (catalog E references "Dennis Swini → Dennis Sweeney" via entry #44 Burns same iteration). Resolution stands. |
| 67.P2.5 "Stokeley Conlike us, a few wise" | high | high (kept) | Pass 2 reading "Stokely Carmichael's view was" is internally consistent and Whisper-phonetic-plausible. Resolution stands. |
| 67.P2.8 "wait till we get the bird clock" | low | low (kept) | Davidson Chambers Building bell tower is a plausible referent; speaker recall remains uncertain. Adversarial check warranted. |
| 67.P2.12 "always back in" parking advice | medium | high (promoted) | Pass 2 reading "always back in so you can [go] into a restaurant" is internally consistent with the SNCC field-training-for-quick-getaway context. The speaker is describing a canonical Movement defensive-driving practice. Pass 3 promotes. |
| 67.P2.16 "Nashville City Banks" / "Nashville City Bank" | high | high (kept) | Pass 2 reading is correct. Nashville City Bank (singular) is the canonical Howell family bank. |
| 67.P2.20 "I never want to say" -> "I never want to see" | medium | medium (kept) | Plausible but speaker disfluency. Pass 2 noted; adversarial check could verify against the surrounding narrative arc. |
| 67.P2.22 "the early cities" -> "the early sit-ins" | high | high (kept) | Pass 2 reading is internally consistent (Nashville Movement, Lawson workshops, Greensboro Four context). Resolution stands. |
| 67.P2.23 "NT, North Carolina" -> NC A&T | high | high (kept) | The Greensboro Four (Blair, Richmond, McCain, McNeil) were students at North Carolina A&T State University, Greensboro — canonical February 1, 1960 Woolworth sit-in launch site. "NT" is Whisper compression of "N C A and T". Resolution stands. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 67.26 | Ed V. Brickialpister (Union seminary friend) | Union Theological Seminary 1965 class roster cross-reference needed. Speaker-recall + Whisper-phonetic ambiguity. |
| 67.39 | Larry Bill (Nashville local name) | Speaker recall; no canonical anchor. |
| 67.43 / 67.P2.24 | "Mustang year" at Davidson | Davidson local terminology check; possibly "maelstrom" or "master" (senior). Worth a second-model lookup. |
| 67.P2.8 | "wait till we get the bird clock" Davidson reference | Davidson Chambers Building bell tower verification. |
| 67.P2.20 | "I never want to say" / "I never want to see" disfluency | Speaker-disfluency parsing; adversarial models may resolve. |
| 67.P2.29 | Source-file truncation at byte ~29.6 KB | Confirm with WWU team that the Whisper SRT/VTT/TXT all terminate at the same point — this may be a re-transcription opportunity from raw audio if Whisper truncated due to a source audio gap rather than file-size limits. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Allard Lowenstein (1929–1980): Yale Law, National Student Association president, Eleanor Roosevelt protege, "Dump Johnson" architect (1967–68 anti-LBJ campaign), U.S. Congressman from Nassau County NY (5th district, 1969–71), foundational Movement-organizer / liberal-Democratic-strategist bridge figure. Assassinated by Dennis Sweeney March 14, 1980. Pass 2 P2.1 documents the Sweeney connection. Lowenstein is referenced across multiple corpus interviews (Howell #67, Burns #44, Lowery #66 same iteration via Dump Johnson reference). Foundational figure absent from facts.json.
- Charles Sherrod (1937–2022): SNCC SW Georgia field director 1961–67, Albany Movement co-launcher with Cordell Reagon, Mt. Olive Baptist Church / Carolyn Daniels organizing infrastructure. Already documented as transcript #18 subject. Cross-corpus the most-cross-referenced figure in the Pass-1 audit (per Pass 2 P2.14 note in this entry: "appearing in ~8+ transcripts"). Foundational SNCC figure absent from facts.json — should be added.
- Willie Ricks (Mukasa Dada, b. 1942): SNCC field secretary who first led the "Black Power" chant at SNCC rallies in spring 1966 before Carmichael's June 16, 1966 Greenwood, MS speech. Foundational Black Power articulation figure absent from facts.json.
- Lowndes County Freedom Organization (LCFO): Bob Mants, Stokely Carmichael, and local Lowndes County activists organized 1965–66 as the all-Black political party adopting the Black Panther emblem (later borrowed by Newton/Seale's Oakland BPP). Catalog D lists "Lounds County Freedom Association → Lowndes County Freedom Organization" as a documented Whisper-error pattern. Worth adding as a discrete event/organization entry to facts.json — it is the missing link between SNCC and the Black Panther Party.
- D. Grier Martin (1908–2000): Davidson College president 1958–68, integrated Davidson with African students 1963, quietly supported Joe Howell's controversial March on Charlotte 1964. Canonical Southern white-college-president integration-era figure; speaker-originating relevance to the Howell interview but corpus-relevant as a recurring archetype.
- William "Bill" Webber (1920–2014): Union Theological Seminary professor, founder of the East Harlem Protestant Parish (1948), founder of the MUST (Metropolitan Urban Service Training) program at Union. Theological-foundation figure for many seminarian-route civil-rights workers (Howell, others). Foundational figure absent from facts.json.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 67.P3.1 | "David Klein" → David Cline interviewer pattern | David Cline | high | canonical (interviewer) | Pass 1 #67.1 caught and Pass 2 P2.13 reinforced. Catalog A documents "Joe Manier / Joe Mania / Joe Maner → Joe Mosnier" but does NOT document the "David Klein → David Cline" pattern that recurs across Aaron Dixon (#1), Amos C. Brown (#2), and now this interview. Recommend adding to catalog A as a high-frequency interviewer-name failure pattern with examples #1, #2, #67. |
| 67.P3.2 | "Southern Normal History Program" → Southern Oral History Program | Southern Oral History Program | high | canonical | Pass 1 #67.2 caught. Catalog A documents "Southern World History Program / Southern Wall of the History Program" but not "Southern Normal History Program" — recommend back-filing as an additional variant. |
| 67.P3.3 | "Bryn Mark" / "Brinmore" → Bryn Mawr | Bryn Mawr | high | canonical | Pass 1 #67.14 + Richardson #69 P1.21 both attest the Bryn Mawr Whisper error. Recurring across iteration; worth a catalog-C addition (currently no Bryn Mawr entry). |
| 67.P3.4 | "Haberfoot" → Haverford | Haverford | high | canonical | Pass 1 #67.15 caught. The "Haberfoot" Whisper rendering of Haverford is a Pennsylvania-college-name pattern not in catalog F. Recommend back-filing. |
| 67.P3.5 | "Johnson T Smith" → Johnson C. Smith / "Barbara Scotian" → Barber-Scotia | Johnson C. Smith University / Barber-Scotia College | high | canonical | Pass 1 #67.18/67.19 caught. Both are Charlotte/Concordia NC HBCU names; "T → C" letter substitution is a distinctive Whisper pattern. Worth catalog-F geographic-or-institutional addition. |
| 67.P3.6 | "Stokeley Conlike" / "Stokeley Carmichael" Whisper variants | Stokely Carmichael | high | canonical | Pass 1 #67.28 + Pass 2 P2.5 caught. Catalog C documents "Stoke the Carmichael / Stoke Lee / Stelke Carmichael / Storkley" — recommend adding "Conlike" as an additional variant. |
| 67.P3.7 | "Lowns County" → Lowndes County | Lowndes County | high | canonical | Pass 1 #67.30 caught. Catalog F has "Lions County → Lowndes" (#44) and catalog D has "Lounds County Freedom Association → LCFO" — recommend adding "Lowns" as additional variant. |
| 67.P3.8 | Transcript truncation at byte ~29.6 KB | Source-file end | n/a | n/a | Pass 2 P2.29 noted. Pass 3 flags: this is the second cap-truncation in the iteration (Howell #67 + likely Henderson #68 + Richardson #69 also affected — see their entries). All three should be marked for raw-audio re-transcription opportunity. The post-Albany SW Georgia summer 1966 work, the Howells' relationship with Sherrod after Black Power, and the Black-family-embedding are NOT in this transcript. |

**Audit-complete marker**: Pass 3 complete on entry #67 as of 2026-05-22. Ready for adversarial-model review.
