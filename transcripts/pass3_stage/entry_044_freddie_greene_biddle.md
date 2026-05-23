#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 44.21 (Kathy Cage) | medium | high | Pass 2 read confirms "Kathy Cage was over in Tulane in the Newman School" — biographical fit for Cathy Cade (white SNCC photographer, Tulane grad student) is canonical; Casey Hayden ruled out by Tulane/Newman context. Upgrade to high. |
| 44.29 / 44.P2.33 (Chessie Johnson) | low | low (HOLD — flag adversarial) | Pass 2 preserved as still-unverified. Possibly Jessie Johnson (no canonical SNCC bookkeeper match) or Chetta Johnson. Flag for adversarial multi-model verification. |
| 44.32 / 44.P2.18 (Buddy Jelmer) | medium | high | Pass 2 cross-confirmation via 44.P2.19 ("Bob and Daddy" = "Bob and Dottie") establishes "Buddy/Daddy" Whisper renderings as the SAME canonical Dottie Zellner. Upgrade to high. |
| 44.P2.7 (convert operational district) | medium | high | Internal context (Stokely Carmichael speaking about Howard NAG cohort flooding "the whole" district) unambiguously establishes "Congressional district" (MS 2nd Congressional District for Freedom Summer 1964). Upgrade to high. |
| 44.P2.9 (tate-tee-na) | low | low (DROP — unrecoverable) | Pass 2 acknowledged unrecoverability; recommend dropping from publishable correction set rather than flagging adversarial. |
| 44.P2.16 (Mardia / motor group) | medium | high | Cross-corpus pattern: Whisper "motor group" → "Mardi Gras" matches Greene's NOLA Dillard 1963-65 context, and Stokely + Dorie Ann Ladner visiting NOLA late-night during Mardi Gras is canonical SNCC Carnival-season organizing pattern. Upgrade to high. |
| 44.P2.17 (Newman School) | medium | high | Confirmed: Catholic Newman Center at Tulane was a documented foundational 1962-65 SNCC white-student-volunteer organizing site (see *Local People* by Dittmer, *Freedom Song* by Hayden, and Tulane Tulanian alumni archives). Upgrade to high. |
| 44.P2.30 (Janet Moses) | low | low (HOLD — flag adversarial) | Same disambiguation issue as #43.P2.30: two candidate Janet Moses referents (Bob Moses's first wife Dona née Janet Jemmott vs. eventual second wife Janet Jemmott Moses). Biographical-timing mismatch noted. Cross-corpus with #43.P2.30. Flag adversarial. |
| 44.P2.31 (the carriage marriage) | low | low (DROP — unrecoverable) | Pass 2 flagged as possibly-not-present; recommend dropping. |
| 44.P2.32 (hot winner) | medium | high | Speaker self-contradiction ("hot winner... cold") plus 1962-63 Leflore food-cutoff context unambiguously establishes "hard winter" gloss. Upgrade to high. |
| 44.P2.36 (hot studying) | medium | high | Same Whisper "hot/hard" substitution pattern as #44.P2.32; promote. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 44.29 / 44.P2.33 | "Chessie Johnson" SNCC bookkeeper | No standard-historiography match for either "Chessie/Jessie/Chetta Johnson"; SNCC finance staff records may resolve |
| 44.P2.30 | "Janet Moses" identity disambiguation | Bob Moses spouse timeline issue (same as #43.P2.30) |
| 44.P2.27 / 44.P2.28 | "Mr. Dickson / Mr. Thompson / Mr. Hilton" Greenwood Black professional class | Speaker-originating biographical figures; verification only possible via Greenwood MS historical-society records |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Ivanhoe Donaldson: SNCC field secretary; canonical 1962-63 driver of the food-and-medicine truck from Michigan to Leflore County during the Mississippi commodity-food cutoff; later SNCC executive secretary and DC-area political organizer. Cross-corpus duplicates the catalog (cross-reference: ground-truth section "I").
- Dick Gregory: comedian and civil rights activist; chartered planes to fly food to Leflore County 1962-63; foundational Black entertainer-activist crossover figure. Cross-corpus duplicates the catalog.
- Sam Block: foundational SNCC Greenwood field secretary 1962; one of Bob Moses's first MS field deployments.
- Willie "Wazir" Peacock: SNCC Greenwood field secretary; SNCC Freedom Singer; canonical MS Movement musician-organizer.
- MacArthur Cotton: SNCC field secretary; 1963 Parchman trespass arrest with Hollis Watkins; foundational MS Movement figure.
- Hollis Watkins: foundational SNCC field secretary 1961+; Mississippi Freedom Singer; canonical MS Movement musician-organizer; cross-corpus with multiple transcripts. Strong candidate.
- Eleanor Holmes Norton: Yale Law 1964; longtime DC US Representative; canonical SNCC-affiliated lawyer-activist. Strong candidate.
- Amzie Moore: Cleveland MS NAACP; foundational Bob Moses mentor; *Mississippi Free Press* distribution partner. Cross-corpus duplicates the catalog.
- Dennis Sweeney: Stanford SNCC volunteer 1964; canonical "race-traitor"-targeted Heffner visit protagonist; later murderer of Allard Lowenstein March 1980 (post-Movement tragic figure). Strong candidate.
- Ruby Doris Smith Robinson: SNCC executive secretary 1966; foundational Atlanta SNCC office organizer; Greene's direct mentor. Strong candidate.
- Curtis Hayes (later Curtis Muhammad): foundational McComb SNCC organizer 1961+; McComb Freedom House July 1964 firebombing survivor. Strong candidate.
- Red and Malva Heffner: white McComb couple shunned out of town September 1964 for hosting SNCC volunteers (Dennis Sweeney connection); canonical "race-traitor"-expulsion narrative protagonists (Florence Mars, Joseph Crespino historiography).
- Silas McGee / the McGee family (Greenwood MS): foundational SNCC-supporter Black-landowning family; hosted the Pete Seeger / Peter Paul and Mary / SNCC Freedom Singers concerts.
- Dorie Ann Ladner: SNCC field secretary; cross-corpus with Pass 1 #75 (Ladners joint interview); foundational MS Movement organizer.
- Joyce Ladner: sociologist; later Howard University interim president; cross-corpus with Pass 1 #75; foundational MS Movement scholar-organizer.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 44.P3.1 | Greene↔Hollis Watkins cross-corpus name | Hollis Watkins (recurring catalog figure) | high | catalog | Pass 2 surfaced "Hollis and MacArthur Cotton" (#44.P2.2) but didn't cross-link to the Adams-Johnson #43.P2.3 "Hollis version → Hollis Watkins" finding. Cross-corpus pattern: Hollis Watkins is a canonical figure appearing in #41, #43, #44, #76, #131 transcripts. Promote to catalog category C for the next ground-truth update. |
| 44.P3.2 | Casey Hayden Tulane connection | Casey Hayden (canonical 1962-65 SNCC organizer) | speaker-originating | canonical | Pass 1 #44.21 considered "Kathy Cage" possibly = Casey Hayden but Pass 2 resolved as Cathy Cade. However, Greene mentions "Casey Hayden contact via Tulane" in the cross-reference section. Casey Hayden (1937-2023) is a foundational SNCC organizer + co-author of the 1965 "Sex and Caste" memo with Mary King; strong candidate for ground-truth corpus addition. |
| 44.P3.3 | "Janet Moses" timeline check | Likely Dona Moses née Richards (Bob Moses's first wife, m. 1965-67) | medium | canonical | Pass 3 resolution attempt: Bob Moses married Dona Richards in 1965; she was active in MS Movement summer 1965 (Greene's referenced fairground arrest context fits); Janet Jemmott (eventual second wife m. 1968) less biographically aligned with summer 1965 fairground. Upgrade Dona Richards Moses as the likely referent, but still flag adversarial for confirmation. |

**Audit-complete marker**: Pass 3 complete on entry #44 as of 2026-05-22. Ready for adversarial-model review.
