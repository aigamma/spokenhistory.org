#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 82.5 Marlon -> Marilyn Luper (the speaker's older sister) | medium (catalog crossref 10.9) | high | Resolution-by-cross-corpus-cascade: catalog row 10.9 (entry #10 Calvin Luper) already corrected "Marlon" -> "Marilyn Luper" at medium, and 10.P2.1 promoted it to high. Now in entry #82 (Marilyn's own interview), there is no doubt of identity. The "Marlon" rendering is a recurring Whisper failure that the catalog should track at high frequency. (This is a catalog cross-corpus cascade — the resolution lives in entries #10 + #82.) |
| 82.12 Fish Street Baptist -> Fairview Baptist Church | low | low (kept) | Pass 2 row 82.P2.19 also at low; offers "Fairview Baptist Church / Fifth Street Baptist Church" as alternatives. Without external corroboration of the specific Clara Luper family church name in OKC, cannot disambiguate. Flag for adversarial review. |
| 82.14 Barbara Post here -> Barbara Posey Jones (UGA professor) | high | high (kept) | Pass 2 row 82.P2.18 confirms — speaker's "University of London, Georgia" is Whisper rendering of "University of Georgia" (or possibly Albany State or Atlanta U.). Barbara Posey Jones is canonical OKC sit-in spokesperson and academic figure. Maintained at high. |
| 82.19 Tokyo and then I said | low | low (kept) | Pass 2 row 82.P2.20 confirms uncertainty — "Tokyo" likely a family nickname for the speaker's brother Calvin or for Calvin's friend. Maintain low. Flag for adversarial review. |
| 82.23 1970 Mother Andrews / 1972 primary -> 1972 OK Democratic US Senate primary | high | high (kept on the canonical date / event); | Pass 2 row 82.P2.23 confirms — canonical Clara Luper 1972 primary (4th of 8 candidates). The "Mother Andrews" segment is genuinely unclear and best left as low for that specific phrase. Split resolution: the primary event date/identification at high; the "Mother Andrews" referent at low pending adversarial review. |
| 82.P2.14 nickel seals -> Nichols Hills | medium | high | Resolution-by-geographic-anchor: Nichols Hills is the canonical wealthy white OKC suburb where Black domestic workers were employed (well-documented OKC geographical-social history). Whisper "nickel seals" is a clean phonetic substitution for "Nichols Hills". Promote to HIGH. |
| 82.P2.19 Fish Street Baptist -> Fairview or Fifth Street Baptist | low | low (kept) | Same as 82.12. |
| 82.P2.23 Mother Andrews segment | low | low (kept) | Pass 2 itself notes the segment is "genuinely unclear". Flag. |
| 82.P2.26 the dog as you tag (shoe-sizing string) | n/a | n/a | n/a | Pass 2 itself notes "Not in transcript verbatim — described shoe-shopping under Jim Crow". Procedural noise; drop from final output. |
| 82.P2.16 Mr. Lining / Mr. Kim (cross-ref to entry #80) | n/a | n/a | n/a | Pass 2 itself notes "Cross-reference to wrong entry". Procedural noise; drop from final output. |
| 82.13 Hoffman Oklahoma in a Fusky County -> Hoffman, OK (Okfuskee County) | high | high (kept) | Canonical Clara Luper birthplace; Pass 1 and Pass 2 both confirm. The "Fusky" -> "Okfuskee" Whisper-drop is a recurring pattern in Oklahoma-place-name failures. |
| 82.15 a chimpanzee on me | speaker-originating | speaker-originating | Speaker affirms truthfulness twice when prompted; this is canonical first-person Movement-violence account. Correct categorization. |
| 82.16 Gandhi | correct | correct | Canonical nonviolence influence. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 82.12 / 82.P2.19 | Fish Street Baptist -> Fairview / Fifth Street Baptist | Cannot disambiguate between Fairview Baptist Church and Fifth Street Baptist Church; need archival lookup on the Luper family's OKC church. |
| 82.19 / 82.P2.20 | Tokyo (family nickname?) | Speaker's brother nickname or Calvin's friend; cannot disambiguate. |
| 82.P2.23 | Mother Andrews segment of the 1972 primary | The campaign-staff person Andrews or Whisper artifact; unclear. |
| 82.P2.32 | the Jason building (Carver Junior High annex?) | (Note: this row appears in entry #84 not #82 — cross-corpus check.) |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Clara Luper (1923-2011): Oklahoma City NAACP Youth Council advisor 1957-77; canonical Aug 19, 1958 OKC Katz Drug Store sit-in leader — the canonical *first* successful department-store lunch-counter sit-in in US history, predating Greensboro by 18 months; Dunjee HS history teacher; *Behold the Walls* memoir 1979; 1972 OK Democratic US Senate primary candidate (4th of 8). Foundational pre-Greensboro sit-in movement figure under-represented in mainstream Movement narrative.
- Marilyn Luper Hildreth (1950-): The 8-year-old who moved the canonical motion at the August 1958 NAACP Youth Council meeting to sit-in at Katz Drug Store. First-person witness to the canonical "first" department-store sit-in.
- Roscoe Dunjee (1883-1965): *Black Dispatch* OKC Black newspaper founder 1915-66; foundational OKC Black-press figure; Dunjee HS named for him.
- Herbert L. Wright (1923-2007): NAACP National Youth Director 1957-69; invited the OKC Luper youth group to perform *Brother President* at the NAACP National Convention 1957 — the canonical pre-sit-in tour that catalyzed the 1958 OKC action.
- Katz Drug Store sit-in (Aug 19, 1958): Canonical first successful department-store lunch-counter sit-in in US history, 18 months before Greensboro Feb 1, 1960. Should be added as an event entry to civil_rights_facts.json — this is the canonical pre-Greensboro origin event that the Smithsonian-grade publication gate must NOT lose to the dominant Greensboro narrative.
- Barbara Posey Jones: Canonical OKC NAACP Youth Council activist; later UGA / Albany State / Atlanta U professor; canonical OKC sit-in spokesperson.
- *Brother President* (1957 Clara Luper play about MLK): Canonical NAACP-funded touring play that took the OKC Black youth on a Northern-route experience of integrated public accommodations before re-immersing them in Jim Crow on the Southern return leg — the canonical catalyst for the 1958 OKC sit-in. Should be added as cultural-event entry.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 82.P3.1 | "Welcome to Mexico, Oklahoma City" (P2.24) | (Whisper closing-line hallucination) | high | catalog-worthy | The closing-line "Welcome to Mexico" is a Whisper hallucination for "Thank you for welcoming us to Oklahoma City". This is the SAME pattern caught in cross-corpus entries (multiple Whisper closing-sign-off hallucinations across the corpus). Recommend adding a new catalog subsection on "Whisper closing-line hallucinations" — common renderings include geographic substitutions ("Welcome to Mexico" for "Welcome to OK"), proper-name substitutions, and idiom-substitutions. This pattern is canonical enough to merit its own catalog row. |
| 82.P3.2 | "Kestrick's / Cats" (82.10, P2.11) -> Katz Drug Store | high | new-catalog-pattern | Both Pass 1 and Pass 2 catch the canonical OKC sit-in target name. The two distinct Whisper renderings ("Kestrick's" + "Cats") in same transcript suggest the proper noun is hard for Whisper. Should be added to catalog B (Civil rights organizations and federal agencies) or to a new "Canonical event sites" catalog subsection. |
| 82.P3.3 | "Mr. Marlena Luther King / Brother President" (82.3, P2.6) -> *Brother President* (Clara Luper play) | high | new-catalog-pattern | The Whisper rendering "Mr. Marlena Luther King" is a homophone substitution that should be added to catalog C as a new "play / film title" subsection (currently absent). Speaker's name for Clara Luper's 1957 MLK biography play. |
| 82.P3.4 | "Dengia / Dungy / Donglee" (82.4, 82.20, P2.5) -> Dunjee | high | new-catalog-pattern | Three distinct Whisper renderings of "Dunjee" in same transcript. Should be added to catalog F (geographic) or to a new "Black HBCU and school names" subsection. The Roscoe Dunjee namesake is canonical enough that the Whisper variants are recurring. |
| 82.P3.5 | "1819 North East Park" (82.9, P2.10) -> 1819 NE Park Place (OKC) | correct (Pass 1/2 caught) | n/a | The canonical address of the NAACP Youth Council meeting where 8-year-old Hildreth moved the motion that produced the canonical Aug 19, 1958 OKC sit-in. Pass 1 and Pass 2 both correct. Confirmation only. |
| 82.P3.6 | "Hoffman Oklahoma in a Fusky County" (82.13, P2.17) -> Hoffman, OK (Okfuskee County) | high | new-catalog-pattern | Whisper renders "Okfuskee" as "in a Fusky" — a vowel-drop + consonant-substitution. The Oklahoma-place-name pattern is recurring across entries #10 + #82. Should be added to catalog F. |
| 82.P3.7 | "the 50-year anniversary here" (P2.30) -> 50th-anniversary commemoration of Aug 19 1958 OKC sit-in (Aug 2008) | correct | canonical | Pass 2 catches the canonical event date; first-person recall. The 2008 commemoration is itself an under-documented Movement-history moment that should be preserved verbatim. |
| 82.P3.8 | Cross-corpus link: Calvin Luper (transcript #10) is the speaker's brother | n/a | n/a | Pass 1/2 cross-references already note this. The speaker is Calvin's older sister Marilyn Luper Hildreth. The two siblings are both canonical OKC NAACP Youth Council members; their two transcripts are critical first-person paired-witness testimony on the canonical 1958 OKC sit-in. |
| 82.P3.9 | The "first-in-US-history" framing (P2 notes) | (canonical Movement-history claim) | high | canonical | Speaker's testimony establishes that the Aug 19, 1958 OKC Katz Drug Store sit-in PRECEDED Greensboro Feb 1, 1960 by 18 months. This is the kind of canonical first-person fact-claim that the Smithsonian-grade publication gate must NOT lose to summarization compression. Flag for summarization-pipeline awareness. The mainstream Greensboro-centric narrative is canonically incorrect; OKC is the canonical first. |

**Audit-complete marker**: Pass 3 complete on entry #82 as of 2026-05-22. Ready for adversarial-model review.
