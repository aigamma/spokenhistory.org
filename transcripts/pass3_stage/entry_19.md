#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 19.8 Mayo Bruce / Winfield -> Winnfield LA | medium | medium (kept) | Pass 1 identified Winnfield LA correctly (Huey Long's birthplace). "Mayo Bruce" is the proper noun before "Winfield" — Pass 2 #19.P2.11 promoted this to a SNCC sit-in leader name ("Marvin Robinson + Donald Moss + Major Johns"). The Mayo Bruce / Major Johns disambiguation should be re-examined: "Mayo Bruce" is phonetically closer to "Major Johns" than "Marvin Robinson," and Major Johns was canonically one of the 1960 Southern University sit-in leaders. Resolution: drop "Mayo Bruce" as a SC-specific local toponym and confirm Major Johns as the intended referent. Recommend medium with adversarial pass to confirm. |
| 19.15 Bob Collins / Neil's Douglas | medium (P1) -> high (P2 promoted) | high | Pass 2 #19.P2.3 (Robert F. Collins, LA federal judge) and #19.P2.4 (Nils R. Douglas, LA civil rights attorney + first Black NOLA Civil District judge) promote both names to high via canonical-alias. These were the two principal Baton Rouge civil-rights attorneys who handled the December 1961 Southern University arrests. Resolution stands at high. |
| 19.20 Reverend Jeltson / Jelkes -> Rev. T.J. Jemison | medium (P1) -> high (P2 promoted) | high | Pass 2 #19.P2.1 promotes to high via canonical-alias. Jemison led the 1953 Baton Rouge bus boycott (the direct precursor to Montgomery 1955); later NBC USA president 1982-94. Resolution stands. |
| 19.22 Dr. Anderson / Freya Anderson -> Dupuy Anderson | medium (P1) -> correct (P2 promoted) | correct | Pass 2 #19.P2.16 promotes to correct via canonical (Dr. Dupuy H. Anderson, Baton Rouge dentist + civil-rights leader). Freya Anderson is his daughter (#19.43 / #19.P2.21 cross-ref). Resolution stands. |
| 19.24 Sergeant Pitcher -> Sargent Pitcher | medium (P1) -> high (P2 promoted) | high | Pass 2 #19.P2.5 promotes to high via canonical-alias (Sargent Pitcher, East Baton Rouge Parish DA). Resolution stands. |
| 19.33 Compton County Mac baseball league | low | low (kept) | The "Compton Comets / Compton Mac league" — Siler's father's CA Black baseball league. Local sports-history specifics unrecoverable from transcript context. Recommend keeping low. |
| 19.38 Maxson Wigg / Lawrence Maxson Wigg | low (P1) -> speaker-originating (P2) | speaker-originating | Pass 2 #19.P2.9 reclassified as "speaker-originating local" (LSU summer 1962 white friends helping Siler). Canonical spelling "Lawrence Maxon Wigg" still uncertain but no longer flagged for canonical-alias resolution. |
| 19.P2.19 the Tabitha Muses -> the Marsalises | medium | medium (kept) | The Marsalis family (Wynton, Branford, Delfeayo, Jason) interpretation is plausible given the NOLA jazz context, but the phonetic match "Tabitha Muses" -> "the Marsalises" is weak. Could alternatively be "the Tabby Maus" (a NOLA family) or "the Mahalias" or similar. Recommend keeping medium and flagging for adversarial Stage-3 LLM disambiguation. |
| 19.P2.20 Robert Numeroff -> Robert Nemiroff | high | high (cross-corpus dedupe note) | Pass 2 author notes "not in Siler transcript but cross-corpus check." This row is a cross-reference, not a correction to entry #19. Resolution: drop from final-pass correction count; retain as a cross-corpus dedupe note. |
| 19.P2.22 Hadar Adan | low | low (kept) | Speaker-originating local figure; "likely Adan Hubbard or Adam Hadar" — unrecoverable. |
| 19.P2.23 Bushwa / Arnold Buschwa -> Arnold Bouchwa / Boutet | low | low (kept) | NOLA channel 6 cameraman Siler met in Vietnam. Canonical name unrecoverable. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 19.8 / 19.P2.11 | Mayo Bruce -> Major Johns disambiguation | Pass 1 author read "Mayo Bruce" as a LA-toponym pairing with Winnfield. Pass 2 author read it as a Southern University 1960 sit-in leader name (Major Johns). These two readings cannot both be right. Adversarial pass should disambiguate via the surrounding transcript context. |
| 19.P2.19 | Tabitha Muses -> Marsalises | Phonetic match is weak. Adversarial pass should attempt Stage-3 LLM disambiguation. |
| 19.20 / 19.P2.1 | Jemison -> "Rev. T.J. Jemison" | Confirmed canonical. Adversarial flag: speaker may have been referring to T.J. Jemison Sr. (1899-1968, Baton Rouge native + father of the 1953 boycott leader) rather than Rev. Theodore Judson Jemison Jr. (1918-2013, the bus-boycott leader + NBC USA president). The corpus context (Siler's Baton Rouge 1961 movement) points to the Jr., but the Sr. was also a documented community leader. Adversarial pass should disambiguate. |
| 19.40 | John Hope Franklin and Lonnie Bunch | Whisper rendered "John Franklin and Lani" — likely the Pass 1 attribution is correct (NMAAHC + JHF context), but the "Lani" attribution could be "Lonnie Bunch" or alternatively "Lonnie Bunch's wife" or "Lani Guinier" (a different scholar in the same broad Smithsonian-adjacent ecosystem). Adversarial pass should confirm. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Charles "Chuck" Siler (b. early 1940s): Editorial cartoonist + Louisiana Weekly + Black Commentator contributor; first Black male curator at the Louisiana State Museum. Foot soldier of the December 1961 Baton Rouge / Southern University demonstrations. Foundational Baton Rouge-period figure not in corpus.
- Rev. T.J. Jemison (1918-2013): Led the 1953 Baton Rouge bus boycott — the direct precursor to and template for Montgomery 1955 (the carpool system Jemison developed was the canonical model). Later National Baptist Convention USA president 1982-94. Foundational pre-Montgomery figure absent from corpus.
- H. Rap Brown (Hubert Gerold Brown, later Jamil Abdullah Al-Amin, b. 1943): SNCC chairman 1967-68 (succeeding Stokely Carmichael, preceding Phil Hutchings). Foundational late-SNCC figure. Currently in civil_rights_facts.json only via the Stokely-Carmichael / Bob-Moses orbit — should be added as a standalone entry with cross-reference to the catalog C "H. Rat Brown" Whisper-failure pattern.
- Felton G. Clark (1903-1970): Southern University president 1938-69; canonical figure in the suppression-vs-accommodation debate of HBCU presidents during the 1960-62 Southern University sit-ins. Played the dual role of nominally enforcing the state-mandated expulsions while privately working to mitigate consequences for the students.
- Dave Dennis Sr.: CORE field secretary + Mississippi Freedom Summer co-director (with Bob Moses). Foundational CORE + Mississippi figure. Catalog cross-ref noted but not in civil_rights_facts.json.
- Jerome Smith: CORE Freedom Rider + founder of Tambourine & Fan in NOLA. Foundational New Orleans-period CORE figure.
- Ronnie Moore: CORE Louisiana director. Coordinator of the 1961-65 NOLA / Baton Rouge / Plaquemine actions.
- Sherian Cadoria: First Black female brigadier general in US Army; Southern University classmate of Siler. Notable Black-military-pioneer figure.
- Robert F. Collins (1931-2012): LA federal judge (Eastern District 1978-94); Baton Rouge civil-rights attorney pre-judgeship. Foundational LA-judicial figure.
- Nils R. Douglas: LA civil rights attorney; first Black judge of NOLA Civil District Court.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 19.P3.1 | None - Pass 1/2 captured the full Baton Rouge + Southern U + LA-attorneys + NFL-alums + LA-jazz roster comprehensively | n/a | n/a | n/a | The Pass 1 + Pass 2 authors identified all canonical Baton Rouge figures, all Southern University faculty + alumni references, all LA civil-rights attorney names, all LA governors + DA references, all CORE-Louisiana field staff, and all NOLA-jazz family + Vietnam-era references. The transcript's wide-ranging subject-matter (Baton Rouge 1961, Vietnam 1968, LA Museum + cartoon career) was covered end-to-end under-cap. No tail-sweep produced new catalog-pattern instances. |

**Audit-complete marker**: Pass 3 complete on entry #19 as of 2026-05-22. Ready for adversarial-model review.
