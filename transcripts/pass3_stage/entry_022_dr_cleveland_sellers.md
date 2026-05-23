#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 22.19 — Cliff Vaughan | medium | high (Cliff Vaughs) | Cross-confirmed by 22.P2.15 and entry #24.19 (Courtland Cox transcript). Canonical SNCC photographer; injured with a bayonet in Cambridge MD. Same figure in two independent SNCC oral histories raises confidence to high. |
| 22.21 — John Patisse | low | low (flag) | Pass 2's "John Patison" (22.P2.13) does not match a canonical NAG/Howard SNCC member in the documented record. Most likely a Whisper rendering of an actual Howard NAG figure but specific identity unresolved. Flag for adversarial review. |
| 22.25 — Donna Moses | medium | high (Dona Richards) | Pass 2 (22.P2.19) clarifies: Dona Richards (later Marimba Ani) was Bob Moses's wife during Freedom Summer. Documented in Charles Payne, *I've Got the Light of Freedom*. Promote to high. |
| 22.30 — Peter Cummins | low | medium (Peter Cummings) | Crimson editor on the Holly Springs Freedom Summer project. The Harvard Crimson archives confirm Peter Cummings as a 1964 staffer. Surname pin verified. |
| 22.32 — Holly Fry | low | low (flag) | *Freedom on My Mind* (1994) was co-produced by Connie Field and Marilyn Mulford, not "Holly Fry." Speaker may be conflating Connie Field with another producer. Flag — likely Marilyn Mulford. |
| 22.50 — Mr. Jackson / Jackson family | speaker-originating | medium (Matthew Jackson Sr.) | Pass 1 hedge "Matthew Jackson Sr. (likely)" is consistent with documented Lowndes County host families. Hasan Kwame Jeffries, *Bloody Lowndes* (2010), names Matthew Jackson Sr. as one of the canonical Lowndes farmer-hosts. Promote to medium. |
| 22.P2.13 — John Patisse | low | low (flag) | Same as 22.21 — unresolved Howard NAG figure; flag for adversarial. |
| 22.P2.19 — Donna Moses / Gwen Roberts | medium | mixed (Dona Richards high; Gwen Patton vs. Gwen Robinson — see notes) | Pass 2 confused two figures: Gwen Robinson (later Zoharah Simmons; SNCC; Howard professor) is correctly identified at 22.26 (high). Gwen Patton is a separate SNCC figure (Tuskegee). Promote Dona Richards to high; clarify Gwen Robinson at 22.26 already high. |
| 22.P2.23 — Holly Fry | low | low (flag) | Same as 22.32 — likely Marilyn Mulford. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 22.21 / 22.P2.13 | "John Patisse" — Howard NAG member | Whisper rendering does not cleanly map to a documented NAG figure. Adversarial cross-check against the published NAG roster (Stokely Carmichael, Mike Thelwell, Courtland Cox, Ed Brown, Tom Kahn, Butch Kahn, Bill Mahoney, etc.) |
| 22.32 / 22.P2.23 | "Holly Fry" — *Freedom on My Mind* co-producer | Documented producers are Connie Field and Marilyn Mulford; "Holly Fry" likely Whisper rendering of "Marilyn." Adversarial confirmation needed. |
| 22.P2.19 | "Donna Moses / Gwen Roberts" → Dona Richards + Gwen Robinson disambiguation | Two figures confused in the speaker rendering; ensure downstream pipeline distinguishes Dona Richards (Bob Moses's wife) from Gwen Robinson / Zoharah Simmons (independent SNCC figure). |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Cleveland Sellers (Dr. Cleveland L. Sellers Jr.): SNCC Program Secretary 1964–67 (second-ranking SNCC officer); Orangeburg Massacre survivor and the only person convicted of the riot; Voorhees College president 2008–15. Canonical SNCC organizational-history figure not yet in 60-entry corpus.
- James Forman: SNCC Executive Secretary 1961–66; *The Making of Black Revolutionaries* (1972); the canonical SNCC organizational architect. Critical omission from current 60-entry corpus.
- Lowndes County Freedom Organization (LCFO): the original Black Panther emblem (1965–66); SNCC's electoral-organizing template that preceded the California BPP. Should be its own entry given how often it appears.
- Samuel Younge Jr. (Sammy Younge): Tuskegee Institute student / Navy veteran killed January 3, 1966 in Tuskegee AL over a "whites-only" gas station restroom; canonical event that triggered SNCC's first anti-Vietnam War statement
- Ivanhoe Donaldson: SNCC field secretary; the Holly Springs project director; later 1980s DC government aide. Already on catalog candidate list (entry #44).
- Jack Minnis: SNCC research department director; discovered the Alabama law that enabled LCFO. Canonical SNCC strategic figure.
- Ralph Featherstone: SNCC field secretary; killed in 1970 car bombing in Bel Air, MD with Che Payne. Canonical late-SNCC martyr.
- Orangeburg Massacre (Feb 8, 1968): already in corpus; reinforce as canonical event for entries #14 (Cecil Williams) and #22.
- Voorhees College / Voorhees University: 1897 Denmark SC HBCU founded by Elizabeth Evelyn Wright (Tuskegee graduate); now Voorhees University since 2022. Notable for Sellers presidency.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 22.P3.1 | three students at USC (1963) | Henrie Monteith, James Solomon Jr., Robert Anderson | high | canonical | Pass 1 #22.15 left as speaker-originating. The 1963 USC desegregation trio is documented: Henrie Monteith (later Henrie Monteith Treadwell), James L. Solomon Jr., Robert G. Anderson. Note: Pass 1 listed "Henry Frost" — should be Henrie Monteith. |
| 22.P3.2 | "snake" / "sneak" → SNCC | SNCC (Student Nonviolent Coordinating Committee) | high | canonical | Catalog pattern §B. Entry #22 is cited in the catalog as a "snake → SNCC" exemplar; reinforce. |
| 22.P3.3 | "Slave Sellers" → Cleve Sellers | Cleveland L. Sellers Jr. ("Cleve Sellers") | high (damaging) | canonical | Catalog pattern §C (most damaging single-name failure). Reinforce — entry #22 is the canonical "Slave Sellers" pattern site. |
| 22.P3.4 | "Foreman" → James Forman | James Forman (SNCC Executive Secretary 1961–66) | high | canonical | Catalog pattern §C doubled-vowel insertion. Reinforce — multi-occurrence in entry #22. |
| 22.P3.5 | "Stoke the Carmichael" → Stokely Carmichael | Stokely Carmichael (Kwame Ture) | high | canonical | Catalog pattern §C. Reinforce — multi-occurrence in entry #22. |

**Audit-complete marker**: Pass 3 complete on entry #22 as of 2026-05-22. Ready for adversarial-model review.
