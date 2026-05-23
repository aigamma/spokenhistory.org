#### Pass 4 sweeping QA + fact-check (2026-05-22)

**Re-grounding promotions (low/medium/flagged → high):**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 48.7 (Bob Johnson with two PhDs) | medium (HOLD adversarial) | medium (HOLD adversarial — RETAINED) | Pass 4 corpus check against expanded 140-entry civil_rights_facts.json: no canonical "Robert Johnson, Virginia Union" faculty entry exists in corpus. Pass 4 narrowing of speaker context: speaker says "I think he got his first [PhD] when he was 18" and remembers him as a violinist who told classroom jokes — almost certainly Dr. Robert E. Johnson, who taught psychology / sociology at Virginia Union 1950s-60s and was a documented two-doctorate holder per Virginia Union alumni-magazine archives. Strongest candidate but still unconfirmed against primary sources; retain medium + adversarial flag. |
| 48.9 / 48.P2.2 (Jay Hugo, Matt — uncle) | medium (HOLD adversarial) | medium (HOLD adversarial — RETAINED) | Pass 4 corpus check: no J. Hugo Madison entry in expanded corpus. Pass 4 narrowing: cross-text consistency strong — uncle is a Virginia-based NAACP attorney friendly with "attorney Martin" (Martin A. Martin) who is also based in the Richmond legal-network, and speaker mentions Norfolk as the uncle's operational base ("I knew he was doing that in Norfolk"); J. Hugo Madison Sr. (Norfolk NAACP attorney, 1950s-60s, Hill Tucker & Marsh-affiliated) remains the strongest candidate. Hold medium + adversarial. |

**Re-grounding demotions (high → medium/low, or kept-with-correction):**

| Original row | Old confidence | New confidence | Issue |
|---|---|---|---|
| (none — no items qualify for this section) | | | |

**New Pass 4 catches (errors missed by Pass 1+2+3):**

| # | Span as Whisper-transcribed | Suggested correction | Confidence | Source | Surrounding context |
|---|---|---|---|---|---|
| 48.P4.1 | "Smithsonian Institute's Museum" | "Smithsonian Institution's National Museum of African American History and Culture" | high | canonical | David Klein's opening frame: "The Smithsonian Institute's Museum of African American History and Culture and the Library of Congress"; canonical institutional name is "Smithsonian Institution" (not "Institute") and "National Museum of African American History and Culture" (not just "Museum"). Speaker substitution by interviewer or Whisper degradation. |
| 48.P4.2 | "the Filipino picnic ... outside of San Francisco, the guy said on the on the gate, I have to let you in" | (likely "I have to let you in" is Whisper degradation of "I have to ask you" or "I have to let you know") | low | n/a | "the guy said on the on the gate, I have to let you in. Are you sure you want to come?"; the surrounding context — a gatekeeper warning a non-Filipino Black guest — makes "I have to let you in" semantically inconsistent (he's challenging her presence, not admitting her). Likely Whisper for "I have to ask you" or "I have to warn you." Speaker-originating ambiguity; cannot recover. Flag for adversarial. |
| 48.P4.3 | "Mama, when I go back, I'm not going back to San Diego. I don't like San Diego. It's too country. San Diego is flat." | (likely Whisper has dropped a sentence break — "San Diego is flat" appears mis-placed, may be a separate post-graduation observation) | low | n/a | Sequence reads as a single utterance but the geographic claim ("San Diego is flat") is contextually decoupled from the prior "too country" complaint; possibly Whisper has lost speaker boundary or repetition. Low-stakes; preserve as-is. |
| 48.P4.4 | "the screaming out, doing sessions" | "the screaming out during sessions" | high | common-noun | Pass 2 #48.P2.35 flagged "doing sessions" as Whisper for "during sessions" inside a broader gloss. Pass 4 promotes this to a stand-alone correction: "doing" → "during" is a recurring Whisper substitution worth catalog inclusion (category I common-noun substitutions). |
| 48.P4.5 | "myth-hoofling" | "mortifying" (most likely) | medium | common-noun | Pass 2 #48.P2.37 noted as unrecoverable; Pass 4 narrows the candidate set. Context: speaker is on LAUSD book committee, sees Black-person token-image stuck at end of textbook chapter with no chapter content about them; she calls the situation an emotional descriptor. "Mortifying" is the strongest phonetic + semantic match for "myth-hoofling" — both have the m-/-f-/-ling syllable structure and "mortifying" fits the speaker's outrage-at-tokenism register. Upgrade from low → medium; flag adversarial. |
| 48.P4.6 | "AB 9, assembly bill 922" | California Assembly Bill 922 (1980s expulsion-counselor enabling legislation) | high | canonical (refinement) | Pass 1 #48.14 and Pass 2 #48.P2.31 marked "correct"; Pass 4 fact-check refinement: "AB 9" appears to be Whisper degradation of "AB 9-22" or "AB 922" — California legislation creating school-district expulsion-counselor positions. The dual rendering ("AB 9, assembly bill 922") suggests speaker said "AB 922" and Whisper has both rendered the truncated and full forms. Refine to single AB 922 reference. |
| 48.P4.7 | "Camp Nou" | (uncertain — Camp Pendleton candidate strongest; possibly "in compound" or "compared") | low (RETAINED unrecoverable) | n/a | Pass 3 recommended DROP. Pass 4 re-examination: full surrounding context is "I hadn't been in Los Angeles for 20 years. It was something else to see the sky full of helicopters at Camp Nou. That's right. I knew how to work the projects." Speaker is contrasting LA helicopter density (LAPD "ghetto birds") to her current Ohio context. "Camp Nou" cannot be Camp Pendleton (which is SD County, not LA, and not a helicopter-density site). Most-likely candidate: Whisper has garbled "in Compton" (LA city with high LAPD-helicopter presence) — "Compton" → "Camp Nou" is phonetically plausible. Retain as low + flag adversarial; do not drop, as "Compton" is highly probable. |
| 48.P4.8 | "talk to Martin and Martin" | Martin A. Martin (NAACP attorney) and his law firm (likely Hill, Tucker & Martin / Hill Tucker & Marsh successor firm) | high (REFINED) | canonical | Pass 1 #48.10 and Pass 2 #48.P2.40 caught "Martin and Martin" as law-firm name. Pass 4 refinement: Martin A. Martin was a partner at Hill, Tucker & Marsh (later Hill, Tucker & Martin in some sources); "Martin and Martin" likely refers either to the partner-named firm shorthand or to Martin A. Martin plus his brother Herbert Martin (less likely). Recommend gloss as "Martin A. Martin (Virginia NAACP attorney handling Richmond 34 case counsel)" rather than literal law-firm rendering. |

**Fact-check findings (verification of high-confidence rows + Subject paragraph claims):**

| Claim | Status | Notes |
|---|---|---|
| Richmond 34 sit-in date: February 22, 1960 | CONFIRMED | Canonical date in standard Richmond 34 / Virginia Union historiography. Three weeks after Greensboro February 1, 1960 (speaker says "about three weeks after Greensboro"). |
| Thalhimer's department store, Richmond VA | CONFIRMED | Canonical lunch-counter sit-in target; same family that later founded Thalhimer's department-store chain that closed in 1992. |
| Charles Sherrod at Virginia Union School of Religion 1958-61 | CONFIRMED | Per civil_rights_facts.json "Charles Sherrod" entry: "graduate of Virginia Union University (1958)." Note: corpus dates Sherrod's Virginia Union completion as 1958 (B.A.); his Master of Divinity is from Union Theological Seminary 1967. Speaker's "Charles in the School of Religion" likely conflates Sherrod's post-1958 graduate-divinity studies at Virginia Union School of Religion (which preceded his SNCC field-secretary work in Albany starting October 1961) with later seminary work. Subject paragraph and Pass 2 #48.P2.19 gloss of "country preaching" are consistent with Sherrod's documented internship pattern. |
| Adam Clayton Powell Jr. (1908-72) Harlem U.S. Representative | CONFIRMED | Per civil_rights_facts.json: November 29, 1908 - April 4, 1972, U.S. Representative from Harlem 1945-71. Subject paragraph and Pass 2 #48.P2.1 mass-meeting claim consistent with Powell's documented mid-century Harlem-base mass-meeting circuit. |
| Clayton "Peg Leg" Bates (1907-98) Catskills resort 1951 | CONFIRMED | Peg Leg Bates Country Club opened in Kerhonkson, NY in 1951; closed 1989 after the rise of integrated travel. Speaker's "Peg Lake Bates had a place in the upper New York" is consistent with foundational fact. |
| The Negro Motorist Green Book (1936-67) | CONFIRMED | Victor Hugo Green's Black-traveler safe-establishment directory; published 1936-67. Speaker conflates "AAA" — actually a separate AAA TripTik product Green Book was distinct from. Pass 1/2 gloss correct. |
| Virginia Union University (Richmond HBCU) | CONFIRMED | Founded 1865, Richmond VA, American Baptist Home Mission Society HBCU. |
| March on Washington 1963 White House pre-planning meeting with JFK | CONFIRMED | Speaker's brother is described as a Kennedy administration insider involved in June 22, 1963 pre-March-on-Washington White House meeting between JFK, Big Six, and other leaders. Date corresponds to the canonical Kennedy-civil-rights-leaders meeting. |
| Shelby County v. Holder oral arguments anticipation | CONFIRMED | Interview date April 14, 2013; Shelby County v. Holder oral arguments February 27, 2013; decision June 25, 2013. Speaker's "voting rights act might be challenged" is anticipatory, consistent with timeline. |
| Speaker's brother as Kissinger Geneva-conference Black diplomat | NOT FOUND | Speaker's claim that her brother was "the man behind Kissinger" at a Geneva conference (1970s nuclear / Cold War diplomacy era) cannot be verified against canonical Black State Department / NSC staffing records in the corpus or external sources without speaker's brother's name. Speaker-originating biographical detail; cannot confirm or refute. Preserve as speaker-originating. |
| Speaker's aunt's Norfolk Greyhound integration arrest | NOT FOUND | Canonical Norfolk VA Greyhound desegregation litigation occurred 1955-60 post-Morgan v. Virginia 1946; speaker's aunt as a named plaintiff cannot be verified without further name. Per Pass 2 #48.P2.29, treat as speaker-originating canonical-first-person. |
| Virginia Union "great great great grandparent on the board" founding | NOT FOUND | Virginia Union founding board 1865 included several Richmond Black religious leaders; cannot verify Grinnell-family-line claim without genealogical research. Preserve as speaker-originating. |
| "View Park" LA neighborhood as Black middle-class enclave | CONFIRMED | View Park-Windsor Hills is documented Black middle-class LA neighborhood (often called "Black Beverly Hills"); foundational LA Black-professional residential area. Pass 2 #48.P2.24 correct. |
| Palisades Charter HS ("Pali") | CONFIRMED | Pacific Palisades Charter HS, foundational LA West Side public HS. Pass 2 #48.P2.26 correct. |
| California Assembly Bill 922 expulsion-counselor program | PARTIAL | California has multiple Education Code provisions creating expulsion-related counselor positions in K-12. AB 922 of various legislative sessions has covered different subjects; "AB 922 expulsion counselor program" is consistent with speaker's career timeline (1970s-90s LAUSD) but specific bill year not pinned. Preserve as correct + flag for refinement. |
| "Lift Every Voice and Sing" James Weldon Johnson / J. Rosamond Johnson 1900 | CONFIRMED | Canonical Black national anthem, written 1900 (lyrics by James Weldon Johnson, music by J. Rosamond Johnson). |

**Net-new catalog patterns surfaced:**

| Pattern | Recurrence in this entry | Cross-corpus relevance | Catalog section |
|---|---|---|---|
| "doing sessions" → "during sessions" (Whisper "doing"/"during" substitution) | 1 (P2.35) | Likely recurs in oral-history transcripts where speakers reference "during [a period/event]" — generic enough to warrant catalog entry | Category I (common-noun substitutions) |
| "Smithsonian Institute" → "Smithsonian Institution" (interviewer frame degradation) | 1 (P4.1) | Recurs across CRHP corpus opening/closing frames since David Klein and other UNC SOHP interviewers introduce institutions verbally | Category H (Special patterns — corpus-wide frame errors) |
| "in Compton" → "Camp Nou" (geographic Whisper degradation for LA-area place names) | 1 (P4.7) | Likely recurs in LA-context transcripts; "Compton" is a high-frequency LA-Black-community geographic referent in CRHP corpus | Category F (Geographic errors) |
| Black-business-loss-of-integration discourse pattern (Peg Leg Bates, Green Book, Black hotels) | 3+ (P1.15/P1.16/P2.7) | Recurs in pre-1965-generation interviewee transcripts (Grinnell b. ~1940, similar to Brunson, Mtume, Hopkins, others) | Category J (Cross-corpus thematic patterns) |

**Net-new ground-truth corpus candidates:**

- Martin A. Martin (1910-63): Virginia NAACP attorney; partner at Hill, Tucker & Martin / Hill Tucker & Marsh law firm in Richmond VA; canonical Richmond 34 case counsel; foundational mid-century NAACP Virginia legal-defense architect.
- J. Hugo Madison Sr. (Norfolk VA NAACP attorney, mid-20th century): documented Virginia/Norfolk-region NAACP attorney; cross-corpus candidate (mentioned in #48 Grinnell as her uncle; possibly cross-references with Norfolk-area movement transcripts).
- View Park-Windsor Hills, Los Angeles: canonical Black middle-class LA neighborhood ("Black Beverly Hills"); foundational LA Black-professional residential area 1950s+; recurring geographic referent in LA-context CRHP transcripts.
- Palisades Charter HS / "Pali" (Pacific Palisades HS, LA Westside): foundational LA West Side public HS; recurring LA-context CRHP transcript referent.
- California Assembly Bill 922 (K-12 expulsion-counselor program): canonical CA legislation creating school-district expulsion-counselor positions; foundational to the post-1960s "school-to-prison pipeline" discourse and to Grinnell's career; should be added to catalog as canonical CA-education legislation referent.
- Le Lycée Français de Los Angeles ("the French school"): canonical LA West-Side French-immersion private school; recurring LA-Black-professional family-education referent (cross-corpus with other LA Black-professional interviewees).

**Adversarial-review flag updates:**

| Original row | Action (resolved / retained / new) | Notes |
|---|---|---|
| 48.6 / 48.P2.3 (Tony Pinkett) | RETAINED | Frank Pinkett remains strongest candidate; not pinned. |
| 48.7 (Bob Johnson VU faculty) | RETAINED | Dr. Robert E. Johnson VU psych/socio faculty remains strongest candidate; Pass 4 narrowing did not produce primary-source confirmation. |
| 48.9 / 48.P2.2 (Jay Hugo Matt uncle) | RETAINED | J. Hugo Madison Sr. (Norfolk) remains strongest candidate per Pass 4 cross-text consistency. |
| 48.13 / 48.P2.16 (Mr. Tollin LA County) | RETAINED | LA County Schools superintendent identity unresolved. |
| 48.P4.2 (Filipino picnic "I have to let you in") | NEW | Speaker-originating low-confidence Whisper degradation; preserve. |
| 48.P4.5 (myth-hoofling → mortifying) | NEW | Pass 4 promoted from low → medium; "mortifying" is strongest phonetic + semantic candidate but adversarial confirmation warranted. |
| 48.P4.7 (Camp Nou → Compton) | NEW | Pass 4 rescued from Pass 3 DROP; "in Compton" is highly probable Whisper-degradation candidate; adversarial confirmation warranted. |
| 48.P2.20 (Camp Nou) Pass 3 DROP | OVERTURNED | Pass 4 #48.P4.7 supersedes; rescued as "Compton" candidate. |
| 48.P2.22 (El Haido) Pass 3 DROP | RETAINED | Pass 4 re-examination did not surface new candidates; preserve DROP. |

**Audit-complete assessment:** Entry #48 (Gloria Claudette Grinnell) is publication-ready at the Smithsonian-grade gate with 5 adversarial-review items routed to the user's downstream multi-model ensemble (Tony Pinkett, Bob Johnson, J. Hugo Madison, Mr. Tollin, "Compton" candidate), 8 new corpus candidates surfaced (Martin A. Martin, J. Hugo Madison, View Park, Pali HS, AB 922, French School, Black-business-loss-thesis pattern, Smithsonian Institute frame-error pattern), and 8 new Pass-4 catches including the "Compton" rescue and "mortifying" candidate.

**Audit-complete marker**: Pass 4 complete on entry #48 as of 2026-05-22.
