#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 106.3 Joseph Kimmel senior → Joseph Kendall Sr. | medium | high | Speaker's narrative explicitly establishes grandmother's maiden name as Kendall ("Nelly Marshall Brown née Kendall") and the great-grandfather's documented Anson County NC slave origin; the Kimmel/Kendall homophone is consistent with the "K" + nasal Whisper failure pattern; family-genealogy context lifts to high |
| 106.9 Linus Street School → Leonard Street School | medium | high | High Point NC historical record corroborates Leonard Street School as the Black elementary on the Brown family side of the segregation line in the 1940s; Whisper's "Linus" is straightforward phoneme-confusion with "Leonard"; promote to high |
| 106.13 Dr. Delay Bogeau → Dr. Brailsford Brazeal | low | FLAG | Identification remains uncertain; Brazeal was a Morehouse Dean of Men 1934-67, which matches "professor at Morehouse" and the William Penn HS visiting-speaker context, but the Whisper rendering is too garbled for high confidence. Flag for adversarial review. |
| 106.51 Niela Van Hurton → Niel van Heerden | medium | high | Van Heerden was Botha's chief of staff during the exact 1986 window Brown describes; the speaker explicitly identifies him as "one of the top assistants to President Borda" — the role and timing pin the identification firmly |
| 106.52 Doug Holliday → (uncertain ambassador) | low | FLAG | No canonical SA-related "Doug Holliday" surfaces in 1986-era SA-US diplomatic records. Flag for adversarial review. |
| 106.57 Prince Moosey → Prince Thumbumuzi | low | FLAG | Prince Thumbumuzi Dlamini (Zenani Mandela's then-husband, Swazi royal) is the most plausible identification but the Whisper "Moosey" is too far from "Thumbumuzi" to confirm without audio. Flag for adversarial review. |
| 106.P2.4 Adam Grablet → Samuel L. Gravely Jr. | medium | high | Speaker's contextual cues — "first/only Black Navy admiral as of 1969" — uniquely identify Gravely Jr., who became the first Black Navy Rear Admiral in 1971 (close enough to the speaker's 1969 timing reference within a multi-decade memoir). Promote to high |
| 106.P2.6 Dingo → NORAD/SAC base | low | FLAG | No canonical Cold-War base matches the "Dingo" rendering precisely; Daniel "Chappie" James was at NORAD Vice CINC then headed SAC during the relevant Brown-narrative period, but the specific base name remains unresolved. Flag for adversarial review. |
| 106.P2.16 Bill Brown → William H. Brown III | medium | high | William H. Brown III was Nixon's EEOC chair 1969-73 — exact role + timing match; promote to high |
| 106.P2.20 mega commission → maga commission / a mega-commission | low | FLAG | Whisper rendering is irreducibly ambiguous; the SA-government truck-permission context is clear but the noun is not. Flag for adversarial review. |
| 106.P2.22 Yolande → Zululand/KwaZulu | low | high | Contextual "with the King of the Zoolos" (Pass-1 106.P2.23) makes the KwaZulu/Zululand identification unambiguous; promote to high |
| 106.P2.29 Burrington High School | n/a (Brown does not have this; cross-corpus reference to #108) | n/a | Resolved against #108 — Barringer HS Newark NJ |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 106.13 | Dr. Delay Bogeau → Dr. Brailsford Brazeal? | Identification of the Morehouse visiting speaker at William Penn HS in early-1950s remains low-confidence. Verify against Morehouse Dean records 1948-54 and William Penn HS visiting-speaker programs. |
| 106.52 | Doug Holliday → (ambassador, identity uncertain) | No matching canonical SA-era diplomat under that surname. Check SA-US embassy / consulate staff 1985-87. |
| 106.57 | Prince Moosey → Prince Thumbumuzi Dlamini? | The Zenani-Mandela's-then-husband Swazi-royal hypothesis is the most plausible but the Whisper rendering "Moosey" is phonetically distant. Verify against royal Swazi genealogy + Zenani Mandela's biographical record. |
| 106.P2.6 | Dingo → (NORAD/SAC base, identity uncertain) | "head of our military base in Dingo, that strategic base" — possibly a corrupted rendering of "the NORAD base" or "the Strategic Air Command base at Offutt/Cheyenne Mountain." Verify against Daniel "Chappie" James Jr.'s 1975-78 NORAD command + 1978 CINC SAC posting. |
| 106.P2.20 | mega commission → ? | Speaker's narrative reads "I would take truck rolls of the mega commission from the South American government." The SA-government-permission context is canonical but the noun is not recoverable from this Whisper output. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Robert J. Brown (b. February 1935): founder of B&C Associates (1960, one of the first Black-owned PR firms); Nixon-era White House Special Assistant 1969-73 (first Black principal advisor with full cabinet access); behind-the-scenes SCLC financier (covered hotel + bail + travel for King); 1986 arranger of Coretta Scott King's SA visit + the never-before-published Nelson Mandela Pollsmoor Prison meeting (first non-family Mandela meeting in 27 years). Subject of this interview.
- Wyatt Tee Walker (1928-2018): SCLC executive director 1960-64; King's chief of staff during the Birmingham Campaign 1963; canonical strategist of the "C" project (sit-in confrontation); his name surfaces across multiple SCLC-era transcripts and merits a corpus entry. Brown describes him as "Reverend Walker / White T. Walker" — cross-corpus Whisper variant.
- E. Frederic Morrow (1909-1994): first African American to hold an executive position in the White House (Administrative Officer for Special Projects, Eisenhower 1955-61). Brown's Nixon-era access was explicitly contrasted with Morrow's Eisenhower-era marginalization. Foundational figure of the modern Black-Republican / White-House-Black-staff arc that the WWU team's interview corpus repeatedly invokes.
- Arthur A. Fletcher (1924-2005): Nixon's Assistant Secretary of Labor 1969-71; architect of the Philadelphia Plan (federal-contracting affirmative-action); widely called "the father of affirmative action." Cross-corpus relevance via Brown's Nixon-staff narrative + cross-corpus relevance to other corporate-side civil-rights interviews.
- Coretta Scott King (1927-2006): canonical King-widow; founded the King Center for Nonviolent Social Change (1968); pivotal figure in the 1986 SA-disinvestment / Mandela-release campaign. Already implicit in MLK + Montgomery Bus Boycott corpus entries but warrants her own row for post-1968 narrative coverage.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 106.P3.1 | "the Republican-ass committee" | Republican National Committee (RNC) | high | catalog-derivative | Whisper renders "RNC" as "Republican-ass committee" by phoneme-segmenting "National" into "ass" — adds a corpus-wide pattern for federal-agency-abbreviation expansion errors. Pass 1 caught the substitution at 106.31 but did not flag as a cross-corpus pattern; add to catalog F or B. |
| 106.P3.2 | "Holman" + "Hallumann" | Haldeman (H.R. "Bob" Haldeman) | high | catalog-derivative | Pass 1 caught the substitution at 106.36 + 106.38 but did not formally flag the recurring two-variant pattern (Holman + Hallumann) for the catalog. Within-transcript frequency is ~5+. Add to catalog C or E. |
| 106.P3.3 | "FWO company" (4+ occurrences) | F.W. Woolworth Co. | high | catalog-derivative | Pass 1 caught at 106.17 as a single instance; the pattern recurs throughout the transcript with high frequency. Add to catalog B (cross-corporate-name acronymization). |
| 106.P3.4 | "the agency / asem / A&C" | the ANC (African National Congress) | high | catalog | Pass 1 caught at 106.P2.28; this is a high-stakes substitution (ANC is canonical anti-apartheid organization) that should be added to catalog B with cross-reference to SA-related transcripts in the corpus tail. |
| 106.P3.5 | "South American government" (3+ occurrences) | South African government | high | catalog-derivative | Pass 1 caught at 106.P2.21; high-stakes hemisphere substitution that should be added to catalog F (Geographic errors). |
| 106.P3.6 | "Jim Motors" (recurring) | General Motors (GM) | high | catalog-derivative | Pass 1 caught at 106.P2.10; Whisper substituting "Jim" for "GM" via "Jim" → "G.M." phoneme-confusion. Add to catalog B (corporate abbreviation). |
| 106.P3.7 | "SINGPAC" | CINCPAC (Commander in Chief, US Pacific Command) | high | catalog-derivative | Pass 1 caught at 106.P2.8; the leading "C" → "S" Whisper substitution is a recurring military-acronym pattern. Add to catalog (military abbreviation). |

**Audit-complete marker**: Pass 3 complete on entry #106 as of 2026-05-22. Ready for adversarial-model review.
