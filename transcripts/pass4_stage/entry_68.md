#### Pass 4 sweeping QA + fact-check (2026-05-22)

**Re-grounding promotions (low/medium/flagged → high):**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 68.P2.1 "Maritath March" → Meredith March Against Fear (June 1966) | high | high (re-confirmed; back-filed) | Raw `.srt` line 1 confirms "Maritath" rendering. Canonical James Meredith March Against Fear June 1966, Memphis → Jackson; Henderson is recalling Dr. King speaking in Batesville en route. Re-confirms Pass 2 + Pass 3 reading; flagged in Pass 3 P3.5 for catalog D back-file as discrete event-name pattern. |
| 68.P2.5 "Earl Callswell" → Earl Caldwell | high | high (re-confirmed) | Raw `.srt` confirms "Earl" rendering (multiple "earl" tokens) plus the surrounding NY Times Black-reporter cohort (Gerald Frazier, Tom Johnson, Bob Maynard) all present. Pass 2 reading stands; corpus addition recommended (see candidates below). |
| 68.P2.18 "Sigovil" → Seagoville (FCI, Texas) | high | high (re-confirmed) | Raw `.srt` 6119 confirms "Sigovil" rendering. Canonical FCI Seagoville federal prison near Dallas TX. Henderson visited it during her Bishop College years, supplying books to prisoner "Lafayette Locke". Resolution stands; Lafayette Locke remains speaker-originating with no canonical anchor available. |
| 68.P2.32 "if goal" → IFCO (Inter-religious Foundation for Community Organization) | high | high (re-confirmed) | Pass 2 reading stands. IFCO is canonical NCC affiliate; coordinated James Forman's 1969 *Black Manifesto* + Cuba care-package program. Recommended for corpus addition. |

**Re-grounding demotions (high → medium/low, or kept-with-correction):**

(none — no items qualify for this section)

**New Pass 4 catches (errors missed by Pass 1+2+3):**

| # | Span as Whisper-transcribed | Suggested correction | Confidence | Source | Surrounding context |
|---|---|---|---|---|---|
| 68.P4.1 | "to sit in the 10th city" | "to sit in the tent city" (Resurrection City, National Mall, May–June 1968 SCLC Poor People's Campaign) | high | canonical | `.srt` line 6603. Henderson is discussing the 1968 SCLC Poor People's Campaign tent encampment on the National Mall — Resurrection City. "10th city" is a Whisper homophone substitution for "tent city". Confirmed by surrounding context: lines 6651 "tents on the National Mall", 6735/6763/6803 "Resurrection City". |
| 68.P4.2 | "the pit smoda in a hotel" / "the pits motor in in Resurrection City" | "the Pitts Motor Inn" (Washington DC, Belmont Rd NW, SCLC accommodations 1968) | high | canonical | `.srt` lines 6655 + 6831. Canonical Pitts Motor Inn was a Washington DC Black-owned motor lodge on Belmont Rd NW where SCLC staff stayed during the 1968 Poor People's Campaign. "Pit smoda" / "pits motor in" are Whisper phonetic decompositions of "Pitts Motor Inn". |
| 68.P4.3 | "Dr. King was coming to Vatesville to speak" | "Dr. King was coming to Batesville to speak" | high | geographic | `.srt` line 6219. One-off Whisper voicing-error variant of Batesville, MS (Henderson's hometown). Henderson's mother told her to go see MLK speak in Batesville before his death — this is the canonical Meredith March stop. Adds "Vatesville" as a discrete Whisper-variant of Batesville to the geographic-collision catalog. |
| 68.P4.4 | "a big science in strike city" | "a big sign in [/at] Strike City" | high | common-noun | `.srt` line 5615. Whisper "science" for "sign" homophone substitution in the Strike City description. Context: "Yeah, it was a tent city and they had a big science in strike city" — Henderson describing the visible Strike City signage on the Greenville Air Force Base tent encampment property summer 1965. |
| 68.P4.5 | "junior Robinson" | "Junior Robinson" (proper name, capitalize) | speaker-originating | local | `.srt` line 2411. Henderson recalls "John Hardy, junior Robinson, who was the youngest, I think he was 13-14" — a Greenwood SNCC voter-registration workshop teen cohort member. "junior Robinson" should be capitalized as the proper name "Junior Robinson"; speaker recall, no canonical anchor outside potential cross-corpus identification. |

**Fact-check findings (verification of high-confidence rows + Subject paragraph claims):**

| Claim | Status | Notes |
|---|---|---|
| Henderson born Batesville, MS, Panola County | verified | Raw `.srt` line 30–31 ("Yes, I was born in Batesville, Mississippi, Penola County"). Canonical Panola Co. is bisected — half Delta, half Hill Country; Batesville is the South Panola County seat in the Hill Country portion. |
| Parents Lyora Morris + Hugo Henderson, farmers in Section 7 (Olive Ray) | verified | Raw `.srt` 34–35 ("My parents were Lyora Morris and Hugo Henderson. We were farmers"); lines 91–107 confirm 80-acre Section 7 (Olive Ray) farm. Speaker-originating; consistent with Pass 1 Subject paragraph claim. |
| Activated by Frank Smith arrival Thanksgiving 1962 | verified | Raw `.srt` 856 ("Frank Smith, the SNCC person, came to town in 1962. The Thanksgiving"). Frank Smith is canonical SNCC field secretary (Holmes/Panola); later DC City Council. Recommended for corpus. |
| June 1963 Greenwood workshop; Medgar Evers killed during stay | verified | Raw `.srt` 1305 ("June, 1963"), 1481 ("Medgar Evans was killed last night in Jackson"). Canonical: Evers assassinated June 12, 1963. Henderson's first-person bridge testimony stands. |
| Wore natural/afro hair from 1965, predating *Ebony*'s Sept 1966 "All Natural" cover | partially verifiable | The September 1966 *Ebony* "Natural Look" feature is canonical (Eunice W. Johnson editorial direction). Henderson's 1965 personal adoption is speaker-originating but consistent with the documented Movement-era natural-hair adoption pattern (Odetta cited as cultural anchor). |
| "Christmas addicts" → Crispus Attucks (surreal Whisper substitution) | verified | Raw `.srt` 603 confirms "we knew who Christmas addicts was". Canonical Crispus Attucks (Revolutionary War martyr, killed Boston Massacre 1770). Surreal Whisper substitution; Pass 3 P3.1 already flagged for catalog H back-fill. |
| Ralph Featherstone + W.H. "Che" Payne killed by car bomb in Bel Air MD March 9, 1970 | verified | Canonical event; Pass 2 + Pass 3 reading stands. Featherstone is in corpus (lines 683–688 of `civil_rights_facts.json`); Payne is not. Corpus addition recommended. |
| Drum and Spear Bookstore (1968–74) co-founded by Charlie Cobb + Curtis Hayes (Muhammad) et al. | verified | Corpus has Drum and Spear (line 689) + Charlie Cobb (line 817); Pass 2 reading stands. |
| Mount Beulah (Edwards, MS) — Delta Ministry HQ | verified | Canonical: former Southern Christian Institute property, taken over by Delta Ministry / NCC mid-1960s. Pass 1 + Pass 2 reading stands. |
| Bishop College (Marshall TX → Dallas TX, closed 1988) | verified | Canonical Baptist HBCU. Pass 1 + Pass 2 reading stands. |
| Sauti ya Watoto Swahili children's radio program (Drum and Spear–affiliated) | verified | Canonical Drum and Spear–era cultural-nationalist programming; "Sauti ya Watoto" is canonical Swahili "Voice of the Children". Pass 2 reading stands. |

**Net-new catalog patterns surfaced:**

| Pattern | Recurrence in this entry | Cross-corpus relevance | Catalog section |
|---|---|---|---|
| "10th city" → "tent city" (Resurrection City context) | 1 occurrence (line 6603) | Cross-corpus relevant — Resurrection City / 1968 Poor People's Campaign is referenced in multiple Movement-era SCLC oral histories (e.g., #66 Lowery, #71 cross-refs). Worth catalog B/F entry as a number-for-noun Whisper substitution pattern. | Catalog B (very-high-frequency homophones) or new "Resurrection City / Poor People's Campaign era" catalog section |
| "pit smoda" / "pits motor in" → "Pitts Motor Inn" (DC, Belmont Rd NW) | 2 occurrences (lines 6655, 6831) | Cross-corpus possibility — the Pitts Motor Inn was a canonical DC Black-owned SCLC accommodations site during the 1968 Poor People's Campaign; could recur in any DC-Movement first-person testimony. Worth net-new catalog entry. | Catalog F (DC venue / hospitality network) |
| "Vatesville" → "Batesville" (voicing-error variant) | 1 occurrence (line 6219) | Adds discrete variant to catalog F geographic-Whisper-collision section alongside the canonical "Penola/Penalo" → Panola pattern. Batesville is the seat of South Panola County. | Catalog F (geographic name variants) |
| "big science" → "big sign" (common-noun homophone) | 1 occurrence (line 5615) | Cross-corpus relevant — "science"/"sign" homophone confusion is a generic Whisper risk wherever Movement signage/banner descriptions appear. Worth a brief catalog G entry on common-noun homophones. | Catalog G (common-noun homophones) |
| "Maritath" → "Meredith [March]" (proper-name Whisper substitution for event-name) | 1 occurrence (line 1) | Pass 3 P3.5 already flagged. Confirms catalog D Meredith-March variant addition recommended. | Catalog D (event-name patterns) |

**Net-new ground-truth corpus candidates:**

- Pitts Motor Inn (Washington DC, Belmont Rd NW): Canonical Black-owned DC motor lodge that housed SCLC staff during the 1968 Poor People's Campaign / Resurrection City period. Henderson #68 (P4.2) is at least the second corpus reference to it. Worth a brief facts.json venue entry alongside other DC Movement-era hospitality network (e.g., Drum and Spear).
- Resurrection City / Poor People's Campaign (May–June 1968): Canonical SCLC-organized tent encampment on the National Mall, follow-up to MLK's pre-assassination organizing plan; led by Ralph Abernathy after King's April 4 death. Henderson #68 (P4.1) provides canonical first-person testimony from a SNCC-veteran perspective on the SCLC-led campaign. Not in facts.json; foundational late-Movement event.
- Junior Robinson (Greenwood SNCC voter-registration workshop teen, ~13–14 in June 1963): Speaker-originating local figure; not in canonical SNCC roster. Pass 3 corpus deferral candidate pending cross-corpus identification with other Greenwood-era oral histories (#41 Simpson, #46 the canonical Greenwood cohort).
- John Hardy: Henderson references "John Hardy" among the Greenwood June 1963 workshop cohort. Canonical SNCC McComb organizer (1961 voter-registration project, Walthall Co. MS arrests); foundational SNCC figure absent from facts.json. Worth corpus addition.

**Adversarial-review flag updates:**

| Original row | Action (resolved / retained / new) | Notes |
|---|---|---|
| 68.8 Rev. Middleton Godfrey (Panola Co. Baptist minister) | retained | No new resolution from Pass 4. Pass 3 deferral to adversarial check stands. |
| 68.20 / 68.47 Mama Hackman (Greenwood SNCC host) | retained | Pass 4 raw-spot-check confirms "Mama Hackman" rendering in raw `.srt`; no new identification. Pass 3 deferral stands. |
| 68.40 Lou Grant / Lewis Grant (Jackson MS Freedom Office project head) | retained | No new resolution from Pass 4. Pass 3 deferral stands. |
| 68.P2.12 / P2.13 "shapeane" → Che Payne (Featherstone car bomb) | resolved (Pass 4 fact-check confirms) | Canonical: William W.H. "Che" Payne was killed alongside Featherstone in the March 9, 1970 Bel Air MD car bomb; both were en route to a Rap Brown court appearance. Pass 4 promotes to resolved. Recommend corpus addition. |
| 68.P2.16 Marvin Holloway (IPS fellow) | retained | No new resolution from Pass 4. Pass 3 deferral stands. |
| 68.P2.34 Tom Brown (Bishop College admissions / former SNCC) | retained | No new resolution from Pass 4. Pass 3 deferral stands. |
| Pop Herb (Cambridge MD funeral parlor host) — cross-corpus #68/#69 | retained | Pass 3 cross-corpus deferral stands; Pop Herb is the primary speaker-originating canonical figure surfaced across both Henderson #68 and Richardson #69. Recommend keeping the cross-corpus adversarial check open. |
| 68.P4.1 / 68.P4.2 Pitts Motor Inn + Resurrection City context (new) | new | Pass 4 NET-NEW catches; recommend adversarial cross-check against the canonical SCLC Poor People's Campaign Washington DC accommodations roster (1968) to confirm Pitts Motor Inn identification. |
| 68.P4.5 Junior Robinson (Greenwood SNCC teen, June 1963) | new | Pass 4 NET-NEW; recommend cross-corpus check against canonical Greenwood-era SNCC youth roster (#41 Simpson, McLaurin #17, etc.). |

**Audit-complete assessment:** Entry #68 (Juadine Henderson) is publication-ready pending adversarial-model review of the 8 retained/new flagged items and corpus addition of the ~8 net-new corpus candidates (Benjamin Brown, Frank Smith, Ivanhoe Donaldson, Lerone Bennett Jr., Earl Caldwell, IFCO, Pitts Motor Inn, Junior Robinson/John Hardy); the Pass 1+2+3+4 cumulative coverage is comprehensive across the 115 KB raw `.srt`.

**Audit-complete marker**: Pass 4 complete on entry #68 as of 2026-05-22.
