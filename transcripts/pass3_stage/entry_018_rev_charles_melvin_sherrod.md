#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 18.7 criteria club -> Criterion Club | medium (P1) -> high (P2 promoted) | high | Pass 2 #18.P2.10 promoted to high via canonical-alias evidence. The Albany Criterion Club was the pre-Movement Black women's civic organization that petitioned for paved streets and improved lighting; canonical documented in Albany civil-rights local history. Resolution stands. |
| 18.17 Smith Grouches | low | low (kept) | Sears, Smith's, or similar real Albany downtown store closed under SNCC's picket. Without an external Albany 1961-62 downtown-store directory, canonical name unrecoverable. Recommend low + adversarial pass. |
| 18.18 the Gillian -> "(possibly Petersburg)" | low (P1) -> medium (P2 promoted) | medium (kept) | Pass 2 #18.P2.7 promoted to medium. "The Gillian" is Sherrod's pre-Albany experience reference; speaker mentions both "the Gillian and Rock Hill SC." Pass 2 reads as Petersburg VA / Virginia Union origin context — plausible given Sherrod's biography (Petersburg native, Virginia Union seminary graduate), but the phonetic match to "Gillian" is unconvincing. Could also be "the Hill in" (i.e., "Rock Hill in"), with Whisper splitting "Rock Hill" into two referents. Recommend keeping medium and flagging for adversarial pass. |
| 18.19 1664 acres -> New Communities Inc. land | correct (P1) -> medium (P2 hedged) | medium | Pass 2 #18.P2.8 hedged: the canonical New Communities Inc. (NCI) original acreage was 5,735, but Sherrod uses "1,664 acres" — the 1,664 figure may refer to a later 2011 NCI reacquisition (NCI re-purchased land in 2011 following the 1985 Pigford v. Glickman class-action settlement). Resolution: keep at medium; flag the date-context for adversarial pass. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 18.18 | "the Gillian" -> Petersburg | Pass 2 interpretation requires Whisper to have garbled "Petersburg" into "the Gillian," which is not a phonetic match. More plausibly Whisper garbled "the [Petersburg] sit-ins" or "the Hill in [Rock Hill]." Adversarial pass should attempt Stage-3 LLM disambiguation. |
| 18.19 | 1,664 acres | Canonical NCI was 5,735 acres. The 1,664 figure either refers to a partial / sub-tract or the 2011 reacquisition. If quoted in summary as "the original NCI farm of 1,664 acres" it would be factually wrong. Publication-pipeline citation-audit concern. |
| 18.17 | Smith Grouches | Local Albany business name unrecoverable. Adversarial pass should attempt Albany Herald 1961-62 archive lookup. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Rev. Charles M. Sherrod (1937-2022): SNCC's first field secretary; arrived in Rock Hill SC for the Friendship Nine jail-no-bail (Feb 1961) then to SW Georgia (Oct 1961) where he, Charles Jones, and Cordell Reagon launched the Albany Movement. Co-founded New Communities Inc. (1969, with his wife Shirley Sherrod and others) — a 5,735-acre Black-owned cooperative farm, foundational in the Black-land-justice movement and the lineage from civil-rights organizing to the post-1985 Pigford v. Glickman USDA-discrimination case. The Albany Movement is in civil_rights_facts.json but Sherrod-as-individual is not — he should be added.
- Charles A. Jones: SNCC Charlotte NC / Rock Hill jail-no-bail co-organizer with Sherrod. Worked in Albany alongside Sherrod and Cordell Reagon. Foundational SNCC figure not in civil_rights_facts.json.
- Cordell Reagon (1943-1996): SNCC field secretary + co-founder of the SNCC Freedom Singers (with Bernice Johnson Reagon, his first wife); Albany Movement co-organizer with Sherrod and Jones. The Albany Movement entry in the corpus already references the broader SNCC organizing but Reagon-as-individual is not.
- Shirley Sherrod (b. 1947): NCI co-founder (with husband Charles); the 2010 USDA wrongful-resignation case (later vindicated; the Andrew Breitbart edited-video controversy that prompted her ouster) makes her a foundational Black-land-justice figure. Should be added.
- Laurie Pritchett (1925-2000): Albany police chief 1959-66; pioneer of the "nonviolent containment" counter-strategy that defeated King's Albany Movement (spreading arrests across multiple county jails to deny the movement the visible-brutality images that built national support for Montgomery + Selma + Birmingham). Foundational segregationist-strategy figure cited in catalog C. Although the Albany Movement entry mentions him, Pritchett-as-individual is not.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 18.P3.1 | None - Pass 1/2 was comprehensive for a ~16KB under-cap transcript | n/a | n/a | n/a | The Pass 1 + Pass 2 authors identified all canonical-figure misattributions (Sherrod, Reagon, Jones, Pritchett), all SW GA geographic substitutions (Albany, Americus, Terrell, Dougherty, Baker, Mitchell), and all biblical-reference patterns (Romans 8). The transcript's compressed narrative did not surface additional catalog-pattern instances on a tail-sweep pass. |

**Audit-complete marker**: Pass 3 complete on entry #18 as of 2026-05-22. Ready for adversarial-model review.
