#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 25.11 — William Bayley → William Bailey | medium | high | Speaker-originating Bogalusa city councilman; surname spelling "Bailey" is consistent with the canonical Black Bogalusa city official roster of the late 1960s–70s. Promote to high. |
| 25.12 / 25.P2.18 — Gail Jenkins → Gayle Jenkins | medium / high | high | Pass 2 confirms. Gayle Jenkins was the canonical Bogalusa Civic and Voters League secretary and a long-serving Bogalusa school board member. Confirmed. |
| 25.13 — Willie Boyle Crawford / Lille Bell Crawford | low | low (flag) | Speaker's reference to "first VOTEC-attempting Black women" of Bogalusa; canonical name "Lillie Belle Crawford" is plausible but not yet cross-corpus confirmed. Flag for adversarial. |
| 25.14 — VOTEC → Louisiana Vocational and Technical College | medium | high (Sullivan Technical Institute, Bogalusa) | Resolved: the Bogalusa Sullivan Vocational/Technical Institute (later Louisiana Technical College — Sullivan Campus) is the canonical Bogalusa-area trade school where the first Black women applied. Promote to high. |
| 25.16 — Sam Barnes / Skipper Piper / Trainwite / Albert Davis | speaker-originating | speaker-originating (flag) | Four Bogalusa Deacons identified by first/last name; none yet cross-corpus confirmed against the Deacons membership roster. Flag for adversarial review. |
| 25.19 / 25.P2.25 — Canadian Griffith → Canadian Griffin | low | low (flag) | Speaker says Canadian Griffin was the Bogalusa Deacon assigned to protect James Farmer; surname "Griffin" appears in some Bogalusa accounts but first name "Canadian" is unusual. Possibly a nickname. Flag. |
| 25.22 / 25.P2.15 — Lewis Low-Mac → Louis Lomax | medium | high | Confirmed: Louis E. Lomax (1922–70) was the canonical Black journalist; *The Hate That Hate Produced* (1959 CBS documentary with Mike Wallace on the Nation of Islam); fundraiser for the Deacons. Promote to high. |
| 25.29 — Eli and Robert and I → Lolis Elie and (Bob/Robert) Collins | high | high | Confirmed: Collins, Douglas, and Elie was the canonical NOLA Black civil rights law firm — Lolis Elie, Robert F. Collins, Nils Douglas. Reinforce. |
| 25.31 — Captain Seymour | low | low (flag) | Speaker says was shot in a phone booth; canonical Bogalusa figure shot in a phone booth was Captain Sam Barnes (?). Flag — unresolved. |
| 25.P2.14 — Reese Perkins / Albert Davis / Bert Rainwite | speaker-originating | speaker-originating (flag) | Same as 25.16; Bogalusa Deacons members not yet on documented roster. Flag. |
| 25.P2.26 — Will or Cebrand → Willie Wilfred (latrines truck) | low | low (flag) | Speaker's reference to the Bogalusa-to-Baton Rouge march logistics; Willie Wilfred hedge unconfirmed. Flag. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 25.13 | "Willie Boyle Crawford / Lille Bell Crawford" → Lillie Belle Crawford | First Bogalusa-area Black VOTEC applicant; canonical name pin needed. |
| 25.16 / 25.P2.14 | Bogalusa Deacons roster: Sam Barnes / Skipper Piper / Trainwite / Albert Davis / Reese Perkins / Bert Rainwite | Multi-name speaker-originating cluster; adversarial cross-check against Lance Hill, *The Deacons for Defense* (2004), is needed to canonicalize. |
| 25.19 | "Canadian Griffin" — Bogalusa Deacon | First-name "Canadian" is unusual; possibly nickname for an actual Griffin. |
| 25.31 | "Captain Seymour" — Bogalusa military veteran shot in phone booth | Canonical figure not identified; adversarial cross-check needed. |
| 25.P2.26 | "Will or Cebrand" → Willie Wilfred (latrines truck) | Logistics figure for Bogalusa-to-Baton Rouge 1967 march; canonical name unconfirmed. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Deacons for Defense and Justice: armed Black self-defense organization chartered Jonesboro LA July 1964; Bogalusa chapter chartered February 1965; the canonical 1960s armed-self-defense organization that operated in parallel with nonviolent SNCC/CORE work. Major omission from current corpus.
- Bogalusa Civic and Voters League: the canonical Bogalusa Movement coordinating organization led by A.Z. Young; the 1967 Bogalusa-to-Baton Rouge march organizer.
- A.Z. Young: Bogalusa Civic and Voters League president; led the 1967 Bogalusa-to-Baton Rouge march; canonical local-organizing figure.
- Charles R. Sims: Bogalusa Deacons for Defense president; *Time* magazine cover figure 1965; canonical Deacons spokesman.
- Robert "Bob" Hicks: Bogalusa Deacons for Defense Vice President; NAACP president; the cross-burning at his home in 1965 galvanized the Deacons charter.
- Ernest "Chilly Willy" Thomas + Rev. Frederick D. Kirkpatrick: Jonesboro LA Deacons co-founders (July 1964); canonical origin figures for the Deacons movement.
- Crown Zellerbach Corporation: the Bogalusa paper mill; canonical Title VII employment-discrimination test case site; Fletcher Anderson was one of the first Black workers to file suit.
- Lolis Elie + Robert F. Collins + Nils R. Douglas: the Collins, Douglas, and Elie law firm — canonical NOLA Black civil rights firm that represented the Deacons and many other LA movement clients.
- Louis E. Lomax: Black journalist; *The Hate That Hate Produced* (1959 CBS documentary co-produced with Mike Wallace); the Deacons fundraiser.
- Governor John J. McKeithen: Louisiana Governor 1964–72; canonical state-government intervenor in the Bogalusa crisis (1965).
- 1967 Bogalusa-to-Baton Rouge march (A.Z. Young + Hosea Williams): canonical late-1960s LA voting-rights march, largely Deacons-protected.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 25.P3.1 | "Bogolusianne / Bogdallas / Bogolusa / Bowel's Hash" → Bogalusa, LA | Bogalusa, Louisiana | high | new catalog pattern | Pervasive Whisper failure; add to catalog §F as new pattern with frequency "very high (entry-#25 canonical)." |
| 25.P3.2 | "Cookega clan / Cluxos Clair" → Ku Klux Klan | Ku Klux Klan | high | new catalog pattern | Pass 1 #25.2 + Pass 2 #25.P2.12. Add to catalog §B as new pattern; very high cross-corpus utility (KKK rendering failures are pervasive but not yet catalogued). |
| 25.P3.3 | "Barf Act / Barfract" → Crown Zellerbach | Crown Zellerbach paper mill (Bogalusa) | high | new catalog pattern | Pass 1 #25.3 + Pass 2 #25.P2.2. Add to catalog §B (industrial / employer site). |
| 25.P3.4 | "Joan Burl / Joan Burr" → Jonesboro, LA | Jonesboro, Louisiana | high | new catalog pattern | Pass 1 #25.5 + Pass 2 #25.P2.8. Add to catalog §F. |
| 25.P3.5 | "Frankerton" → Franklinton, LA | Franklinton, Louisiana (Washington Parish seat) | high | new catalog pattern | Pass 1 #25.23 + Pass 2 #25.P2.9. Add to catalog §F. |
| 25.P3.6 | "Lake Puncher Train Bridge" → Lake Pontchartrain Causeway | Lake Pontchartrain Causeway | high | new catalog pattern | Pass 1 #25.26. Add to catalog §F — striking Whisper failure on a recurring LA geographic feature. |
| 25.P3.7 | "Governor John McKithey" → Governor John J. McKeithen | Governor John J. McKeithen | high | new catalog pattern | Pass 1 #25.24 + Pass 2 #25.P2.11. Add to catalog §E. |
| 25.P3.8 | "Jane Farmer" → James Farmer | James Farmer (CORE national director) | high | catalog §C extension | Pass 1 #25.20 + Pass 2 #25.P2.16. James Farmer is in the 60-entry corpus already; add the "Jane Farmer" Whisper rendering to catalog §C. |
| 25.P3.9 | "AG / A.Z. Young / Easy Young / Andrew Moses" → A.Z. Young | A.Z. Young (Bogalusa Civic and Voters League president) | high | new catalog pattern | Pass 1 #25.9 + Pass 2 #25.P2.19. The four-way Whisper rendering ambiguity for A.Z. Young is a notable failure mode; add to catalog §E. |
| 25.P3.10 | "Badenburg" → Baton Rouge | Baton Rouge, Louisiana | high | catalog §F | Pass 1 #25.25 + Pass 2 #25.P2.10. Add to catalog §F as new pattern. |

**Audit-complete marker**: Pass 3 complete on entry #25 as of 2026-05-22. Ready for adversarial-model review.
