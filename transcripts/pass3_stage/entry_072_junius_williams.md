#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 72.46 / 72.P2.16 Marbo Harrington (Cordell Reagon's second wife) | low | low (unchanged; flagged) | Per Pass 2, Cordell Reagon's second wife was Lakini Bookman per public records — but the speaker says "Marbo" / "Marbo Harrington" which does not match. Either speaker's memory is incorrect, or Cordell had additional marriages not in public record. Cannot resolve without genealogical archive. |
| 72.P2.4 Bill Hagen | low | low (unchanged; flagged) | NCUP early-organizing context; speaker recall trail-off; uncertain. Possibly "Bill Hayden" (Tom Hayden's brother) or unrelated. |
| 72.P2.5 Barry Kellace | low | low (unchanged; flagged) | NCUP leadership-competition context with Tom Hayden; "Barry Kalish" hypothesis unverified. SDS roster cross-check could resolve. |
| 72.P2.9 Karenna | low | low (unchanged; flagged) | NCUP block organizer pair-partner; uncertain spelling. |
| 72.P2.16 Marbo Harrington | low | low (unchanged; flagged) | Same as 72.46. |
| 72.P2.41 Bernard's | low | low (unchanged; flagged) | Newark neighborhood store/org name; opaque. |
| 72.P2.50 Animate Shepherd | low | low (unchanged; flagged) | Newark Legal Services co-worker; "Anna Mae Shepherd" hypothesis unverified. |
| 72.P2.52 Colonel Hassan | medium | medium (unchanged) | Hassan Jeru-Ahmed was a documented Newark-area Black-nationalist figure; identification is plausible but needs documentary confirmation. |
| 72.P2.4-9 cluster | low/speaker-orig | low/speaker-orig (unchanged; flagged) | Newark NCUP roster figures — none currently in public-canonical SDS/SNCC archive listings; multi-model SDS papers cross-check might surface. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 72.46 / 72.P2.16 | Marbo Harrington (Cordell Reagon's second wife) | Genealogical archive cross-check; either Whisper degradation of "Marbo" or speaker memory error. |
| 72.P2.4 | Bill Hagen (NCUP organizer) | SDS/NCUP roster cross-check 1964-67. |
| 72.P2.5 | Barry Kellace | NCUP leadership competition with Tom Hayden; archive identification. |
| 72.P2.9 | Karenna (NCUP block partner) | NCUP staff roster check. |
| 72.P2.41 | Bernard's (Newark neighborhood reference) | Local Newark business/community identification. |
| 72.P2.50 | Animate Shepherd | Newark Legal Services Project staff roster 1968-72. |
| 72.P2.52 | Colonel Hassan → Hassan Jeru-Ahmed | Newark Black-nationalist 1967-City-Hall-demo participant identification. |
| 72.P2.51 | Si Mueller-Schultz / Simuille Schutz | SNCC Atlanta apartment-mate identification 1967. |
| 72.P2.7 | Bessie Smith / Thurmond Smith | Newark NCUP staff — local working-class Black family identification (not the canonical 1920s blues singer). |
| 72.P2.6 | Terry Jefferson (NCUP office manager) | Local Newark NCUP staff identification. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Junius Williams: Subject of this transcript. Newark NJ civil rights attorney + Rutgers-Newark professor; first Black member of Amherst Alpha Delta Phi 1961-65; organizer of canonical Feb 12 1965 Mount Holyoke "Reform or Revolution?" conference (Malcolm X invited 9 days before his Feb 21 assassination); jailed at Kilby Prison March 1965 alongside Worth Long during Selma campaign; Yale Law 1968; foundational Newark community organizer post-1967 Rebellion; led the College of Medicine and Dentistry of NJ urban-renewal land-seizure fight that became canonical Northern-civil-rights case.
- Hugh Addonizio: Newark mayor 1962-70; convicted of racketeering in 1970 federal trial; canonical Northern-urban-political-machine-vs-civil-rights antagonist; central political figure during 1967 Newark Rebellion.
- Phil Hutchings: SNCC Newark project organizer; SNCC executive secretary 1968-69 (last person to hold that title before SNCC dissolved). Canonical late-SNCC leadership figure.
- Amiri Baraka (LeRoi Jones): Newark-born Black Arts Movement poet/playwright/activist. Founded the United Brothers in Newark 1968 (precursor to Congress of African People 1970). Canonical Black Arts Movement founding figure; later cofounder of CAP. Recurring across corpus (also #73 Cleaver).
- Ron Karenga (Dr. Maulana Karenga): Black-nationalist scholar; founder of US Organization in Los Angeles 1965; created Kwanzaa 1966; emeritus chair of Africana Studies at California State University Long Beach. Canonical Black Power-era cultural-nationalism figure.
- Worth Long: SNCC field secretary 1962-67; SNCC organizer in Selma, Bogalusa, Albany; later ethnomusicologist; Williams's Kilby Prison bunkmate March 1965 whose "blanket" speech organized 75-man bullpen overnight. Canonical Civil Rights / Black Arts bridge figure.
- Ivanhoe Donaldson: SNCC field secretary; the "food truck from Michigan to Leflore" canonical figure; Williams's leadership idol; later DC Mayor Marion Barry chief political strategist. Already candidate from cross-corpus #44 listing — confirmed by Williams #72.
- Eleanor Holmes Norton: Yale Law class 1963/64; DC delegate to US Congress 1991-present; first SNCC-era figure to enter Congress from DC. Canonical figure who appears in cross-corpus with Cleaver #73 and Williams #72 — both 1962-65 Yale Law context.
- Operation Crossroads Africa / Rev. James H. Robinson: Canonical 1958-founded ecumenical Black college youth exchange to Africa. The model that JFK's 1961 Peace Corps proposal was explicitly built upon. Robinson is the under-credited "father of the Peace Corps" via Crossroads Africa.
- Viola Liuzzo: White Detroit homemaker; canonical Selma martyr murdered March 25, 1965 by KKK after Selma-to-Montgomery march. The most-jarringly-mangled Whisper rendering in the corpus ("Violet Luto" + "Viola Lee Utah"). Foundational martyr who should be added.
- Posey Lombard: White Smith College SNCC organizer; later SW Georgia field worker. Killed in car accident. Canonical white-women-in-SNCC figure.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 72.P3.1 | "Violet Luto" / "Viola Lee Utah" → Viola Liuzzo | This is one of the most-jarring Whisper renderings in the entire corpus. Should be added to cross-corpus catalog section C/D as a canonical figure not yet listed there. The two Whisper renderings within a single transcript demonstrate the high-distortion failure pattern. | very high (damaging) | catalog-new | Liuzzo is canonically important; missing from cross-corpus catalog section. Add: "Violet Luto / Viola Lee Utah → Viola Liuzzo (Selma martyr, murdered March 25 1965)". |
| 72.P3.2 | "Adneezio" → Addonizio | Newark mayor 1962-70 figure; one of the most distinctive Whisper degradations for a canonical urban political figure. Catalog as: "Adneezio → Hugh Addonizio (Mayor of Newark 1962-70, convicted of racketeering 1970)". | high | catalog-new | Should be added to section D or new section on Northern-urban political figures. |
| 72.P3.3 | "Berraka" / "Emiri Berraka" → Amiri Baraka | Distinctive Whisper-failure for a canonical Black Arts Movement figure. Catalog as: "Berraka / Emiri Berraka / Lee Roy Jones → Amiri Baraka (LeRoi Jones, pre-1968) (Black Arts Movement poet/playwright)". | high | catalog-new | Cross-corpus pattern — appears in this entry and Cleaver #73; worth catalog row. |
| 72.P3.4 | "Ron Karinga" → Ron Karenga | Single-transcript occurrence but figure is canonical and the Whisper degradation is distinctive. Catalog as: "Ron Karinga → Ron Karenga / Dr. Maulana Karenga (US Organization founder, Kwanzaa creator)". | medium | catalog-new | Add to section D. |
| 72.P3.5 | "Ellen their homes" → Eleanor Holmes Norton (cross-corpus) | Pass 2 #72.P2.23 noted "same Whisper drop as in #73 Cleaver" — this is a cross-corpus pattern. Should be promoted to cross-corpus catalog. | high | catalog-new | Add to section E or new section "Yale Law 1963/64 cohort": "Ellen their homes → Eleanor Holmes Norton (DC US Rep; Yale Law class 1963/64)". |
| 72.P3.6 | "Ivan Holdon Wilson" / "Ivan Holt" / "Ivan Holdon" → Ivanhoe Donaldson | Recurring across at least 3 entries (#44 cross-corpus, #72 Williams, #73 Cleaver). Should be added to section C as recurring Whisper-failure. | high | catalog-new | Cross-corpus row needed in section C: "Ivan Hodon / Ivan Holdon Wilson / Ivan Holt → Ivanhoe Donaldson (SNCC project director)". The catalog currently has "Ivan Hodon" under #44 only. |
| 72.P3.7 | "Selma de Maagra March" → Selma to Montgomery March | High-distortion Whisper rendering for canonical Selma marches. Worth cataloging as section F/B addition. | high | catalog-new | Add: "Selma de Maagra / Maagra March → Selma to Montgomery March". |
| 72.P3.8 | "Kilburg State Prison" → Kilby Correctional Facility | Canonical Alabama state prison (Mt. Meigs near Montgomery); jailing site for ~7 days of Williams + Worth Long + 75-man bullpen March 1965. Worth cataloging in section F. | medium | catalog-new | Add: "Kilburg State Prison / Kilburg → Kilby Prison (AL, Mt. Meigs)". |

**Audit-complete marker**: Pass 3 complete on entry #72 as of 2026-05-22. Ready for adversarial-model review.
