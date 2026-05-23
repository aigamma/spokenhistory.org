#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 88.9 Dona-Mite -> dynamite | high | high (kept, with note) | Pass 2 row 88.P2.9 added the historical clarification: the actual canonical 1864 Battle of the Crater charge was 8,000 lbs of black powder (Nobel's dynamite was patented 1867, three years AFTER the Crater). Moore is using "dynamite" loosely as a common noun for explosive — speaker-originating loose usage, not a Whisper error per se. Keep HIGH on the Whisper-rendering correction; flag the historical fact for publication-side annotation. |
| 88.P2.8 the Union troops dug a tunnel -> 48th Pennsylvania Volunteer Infantry under Lt. Col. Henry Pleasants | speaker-originating | high (canonical historical fact) | Pass 2 author correctly identified the canonical Pennsylvania coal-miner regiment. Promote: this is a documented Civil War military-history fact, not a Moore-speculation; the regiment + commander identification is in any standard Crater historiography. |
| 88.P2.13 World War II during my growing up | correct | correct (kept) | Moore born 1938 -> would have been 3-7 during US WWII involvement (1941-45). Consistent with his Petersburg + Camp Lee + Fort Lee Army Quartermaster context. |
| 88.P2.17 state ward office -> state-wide office (Methodist Student Movement) | high | high (kept) | Pass 2 caught the "state-wide" -> "state ward" Whisper compound-word degradation. Confirmed. |
| 88.P2.20 no more interaction; black kids -> childhood friendship severance | speaker-originating | speaker-originating (kept, canonical theme) | Moore's account is canonical theme in white-Southern Civil-Rights-era memoirs (cf. Lillian Smith's *Killers of the Dream*, Sarah Patton Boyle, Will Campbell). Speaker-originating but participates in a documented genre of white-Southern remembered-childhood-segregation testimony. |

(Note: Maynard Moore transcript is the canonical CLAUDE.md pipeline-PoC sample — only ~4KB of content is captured in the source files, making this the smallest transcript in the corpus and the natural choice for the "smallest transcript end-to-end" pipeline test. Pass 1 + Pass 2 were exceptionally comprehensive given the small available content, so there are few confidence resolutions to perform.)

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 88.9 / 88.P2.9 | "dynamite" historical accuracy at Battle of the Crater | Moore's "dynamite" usage is technically anachronistic (1864 Crater used black powder; dynamite patented 1867). Adversarial models could verify this is canonical historical fact and propose appropriate publication-side footnote framing. |
| (transcript completeness) | Whether the full Moore interview exists in LoC archive beyond the captured ~4KB | The .txt and .srt both truncate at the same ~152-line point. Adversarial models with LoC archive access could verify whether more audio exists or whether this IS the complete Wesley Seminary interview. Significance: this is the CLAUDE.md PoC artifact. |

(No high-uncertainty Whisper-rendering rows remain in Moore #88 after Pass 1 + Pass 2; the transcript is too short to harbor much hidden ambiguity.)

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Maynard E. Moore (interview subject; b. 1938 Petersburg VA): Methodist minister; canonical figure in pre-Movement white Southern Methodist 1950s childhood testimony genre. Speaker-originating in his transcript but his role in the corpus is significant as the CLAUDE.md PoC interview.
- 1846 Methodist Episcopal Church South founding (Washington Street UMC, Petersburg VA): Canonical historical event marking US Methodist denominational split over slavery. Foundational pre-Movement religious-history landmark.
- Battle of the Crater (July 30, 1864): Canonical Civil War battle at Petersburg VA; 48th Pennsylvania Volunteer Infantry (coal miners) dug a tunnel under Confederate works and detonated 8,000 lbs of black powder; the Union infantry assault that followed was a disaster (notably with USCT — US Colored Troops — taking heavy casualties). Foundational Civil War event for Petersburg local memory + USCT history.
- Methodist Student Movement: Canonical 1930s-60s Methodist youth-organizing infrastructure; foundational pre-Movement white Christian student-activism tradition that produced several Movement-adjacent ministers.
- *Howdy Doody* show (NBC 1947-60): Canonical childhood TV-culture reference; foundational mid-century white American childhood-media touchstone (frequently used in oral histories as a temporal marker for "before-civil-rights" childhood innocence).
- Camp Lee / Fort Lee (Petersburg VA): Canonical US Army Quartermaster Corps training base; WWI-WWII home of Black-quartermaster-unit training (cf. Perry #87's quartermaster service). Cross-corpus relevant.
- Lt. Col. Henry Pleasants: Canonical commander of the 48th Pennsylvania at the Crater; Pennsylvania coal-mining engineer. Foundational Civil War figure for the Petersburg siege.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 88.P3.1 | "Dona-Mite" -> dynamite | catalog-worthy | catalog reference | Pass 1 row 88.9 + Pass 2 row 88.P2.9. Add to catalog G as a recurring "common-noun-treated-as-proper-noun" Whisper rendering. Cross-corpus risk: any transcript discussing 19th-century military explosives. Note: speaker's "dynamite" usage is anachronistic for 1864 Crater (correct historical material was black powder); flag the historical-context note for publication. |
| 88.P3.2 | "blue the Confederate works" -> blew the Confederate works | catalog-worthy | catalog reference | Pass 2 row 88.P2.10. Add to catalog G (Common-noun and idiom errors): canonical homophone family — past-tense verb "blew" rendered as color "blue". Cross-corpus risk: any transcript discussing Civil War battles or explosive demolition. |
| 88.P3.3 | "Howdy-Duty show" -> *Howdy Doody* show | catalog-worthy | catalog reference | Pass 1 row 88.8 + Pass 2 row 88.P2.18. Add to catalog G as a canonical mid-century cultural-reference Whisper-rendering. "Doody" -> "Duty" is a damaging childhood-TV-show rendering because it inverts the show's tone (puppet-show silliness -> military-discipline connotation). |
| 88.P3.4 | "cookies in ice cream" -> cookies and ice cream | catalog-worthy | catalog reference | Pass 2 row 88.P2.19. Conjunction "and" rendered as preposition "in" — recurring small-word Whisper failure family. Add to catalog G as a low-frequency but high-cumulative-impact pattern. |
| 88.P3.5 | "state ward office" -> state-wide office | catalog-worthy | catalog reference | Pass 2 row 88.P2.17. Add to catalog G as a compound-word-degradation pattern: Whisper consistently disambiguates "state-wide" as either "stateward" or "state ward" depending on speaker cadence. |
| 88.P3.6 | "Methodist Church South" -> Methodist Episcopal Church, South | confirming + canonical | catalog reference | Pass 1 + Pass 2 already correct. Cross-corpus note: foundational pre-Movement religious denomination split over slavery; any transcript discussing Southern Protestant denominational history will hit this term. Add to a new sub-section of catalog E ("Pre-Movement-era and supporting figures") covering canonical denominational-history terms. |
| 88.P3.7 | "the crater" -> the Crater (Battle of the Crater, July 30, 1864) | catalog-worthy | catalog reference | Pass 2 row 88.P2.7. Add to catalog F (Geographic errors) or a new sub-section for canonical Civil War battle references. Cross-corpus risk: any transcript referencing Petersburg VA history. |

**Audit-complete marker**: Pass 3 complete on entry #88 as of 2026-05-22. Ready for adversarial-model review.
