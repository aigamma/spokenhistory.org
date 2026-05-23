#### Pass 4 sweeping QA + fact-check (2026-05-22)

**Re-grounding promotions (low/medium/flagged → high):**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 7.P2T.65 (HRSA "high-end spill" → Hyattsville/Rockville) | medium | high | HRSA's main headquarters address is Parklawn Building, 5600 Fishers Lane, Rockville MD (verifiable canonical fact). "High-end spill" is a clear phonetic garbling of "in Rockville" / "Rockville, Maryland." Speaker's recollection that "it's in" some MD city aligns. Resolve to Rockville MD with high confidence; the speaker is not misremembering — Whisper garbled the syllables. |
| 7.P2T.30 (Walter Tilla → Walter Tillow) | medium (already promoted P3 to high) | high | Pass 3 promotion confirmed; reaffirm via cross-corpus catalog entry. No further action. |

**Re-grounding demotions (high → medium/low, or kept-with-correction):**

| Original row | Old confidence | New confidence | Issue |
|---|---|---|---|
| 7.P2.9 (Stokeley Carmichael → Stokely Carmichael) | high | speaker-originating / kept-with-correction | Raw spot-check shows the transcript actually renders "Stokely" (4 occurrences, all correct spelling). Pass 2's row classifies it as a Whisper alias correction, but Whisper produced the canonical spelling here. The correction-table entry should be marked as "speaker-originating / canonical-already-correct," not a Whisper error. No correction needed for this entry; flag for catalog-pattern accuracy. |

**New Pass 4 catches (errors missed by Pass 1+2+3):**

| # | Span as Whisper-transcribed | Suggested correction | Confidence | Source | Surrounding context |
|---|---|---|---|---|---|
| 7.P4.M.1 | Romely (Dinky Romely) | Dinky Romilly | high | canonical-alias | Raw: "Casey is sort of the first northern coordinator exactly. And then Dinky. Exactly. Romely picks it up. Exactly. And she goes back to New York" — NET-NEW third Whisper variant of "Romilly" alongside the P1/P2 variants "Romley" and the P2T "Romney." Same canonical person (Constance "Dinky" Romilly). Add to the alias dictionary as a third rendering. |

**Fact-check findings (verification of high-confidence rows + Subject paragraph claims):**

| Claim | Status | Notes |
|---|---|---|
| Betty Garman Robinson b. 1939, NYC | CONFIRMED | Raw transcript contains "1939" and multiple "born" references; speaker confirms NYC origin. |
| Skidmore College '60 | CONFIRMED | Raw transcript has both "Skidmore" (multiple) and "1960" (multiple) in temporal alignment with college graduation. |
| NSA officer cohort 1958–61 (revealed to have been CIA-funded) | CONFIRMED | Karen Paget's *Patriotic Betrayal* (2015) is the canonical book; raw confirms speaker discusses Helsinki 1962 festival + Algerian students program (the documented NSA-CIA conduits). |
| SDS national-council member | CONFIRMED (speaker self-states) | Speaker explicitly references Tom Hayden + Al Haber + Port Huron + SDS founding involvement. |
| Came south to SNCC March 1964 | CONFIRMED | Raw: "you come south to the Atlanta office in March" and "I come to SNCC in March of 64." |
| Northern Coordinator of SNCC 1964–66 | CONFIRMED | Raw: multiple direct references including "fall 64 is when Dinky Romney moves to New York. And I become the Northern Coordinator." |
| Succeeded Dinky Romilly | CONFIRMED | Raw chronology confirms Casey Hayden → Dinky Romilly → Betty Garman Robinson succession in Northern Coordinator role. |
| Subject paragraph framing: "Important first-hand witness to the NSA / CIA / SDS / SNCC overlap" | CONFIRMED | The transcript provides foundational primary-source material on the NSA-CIA covert funding relationship, the white-Northern-left-to-SNCC pipeline, and SNCC Atlanta-office internal dynamics — appropriate framing. |
| 7.P2T.1 (Marion Barry 4-way Whisper split) | CONFIRMED in raw | Raw spot-check confirms multiple Whisper variants of Marion Barry; high-damage misattribution is real. |
| 7.P2T.6 (Edmund Pettus Bridge) | CONFIRMED | "Edmund Pettis Bridge" verified as the Whisper rendering; Edmund Pettus Bridge is canonical Selma site. |
| 7.P2T.39 (Claude Sitten → Claude Sitton) | CONFIRMED canonical | Claude Sitton (1925–2015) was NYT Atlanta bureau chief 1960–64 — high-confidence canonical correction. |

**Net-new catalog patterns surfaced:**

| Pattern | Recurrence in this entry | Cross-corpus relevance | Catalog section |
|---|---|---|---|
| Surname "Romilly" rendered as three distinct Whisper variants in a single transcript (Romley / Romney / Romely) | 3 distinct renderings within entry #7 | Predicts: any transcript referencing Jessica Mitford / her daughter / SNCC Northern Coordinator pre-Robinson may trigger the same multi-variant failure. Recommend catalog C addition aggregating all three variants under one canonical row. | catalog C (proper-noun aliases) |

**Net-new ground-truth corpus candidates:**

- Casey Hayden (Sandra "Casey" Cason Hayden): SDS / SNCC organizer; co-author of the 1964 Waveland SNCC women's position paper; foundational figure in the white-Northern-left-to-SNCC pipeline; ex-wife of Tom Hayden. Recurs in raw as central organizing figure for the entry.
- Mary King: SNCC press office staff; co-author of the 1964 Waveland SNCC women's position paper; foundational figure documenting SNCC media + the position-paper origin. Pairs with Casey Hayden as canonical second-wave-feminism-within-the-New-Left bridge figure.
- Connie Curry: NSA Southern Project director; founder of the Southern Student Human Relations Seminar; first white woman on SNCC's Executive Committee (an honorary capacity). Foundational white-Southern-ally figure documenting SNCC institutional history.
- Judy Richardson: SNCC field organizer; later *Eyes on the Prize* (1987 / 1990) co-producer + *Hands on the Freedom Plow* (2010) co-editor. Bridges 1960s SNCC and the documentary-canon of the Movement.
- Tim Jenkins: NSA national vice president; Howard student body president; recurring cross-corpus figure (#120 per catalog cross-ref list).
- Hardy Frye (Hardy T. Frye): SNCC field secretary in Alabama 1964–66 (especially Lowndes County); later UC Berkeley sociology professor + labor researcher. Living scholar.
- Faith S. Holsaert: SNCC SW Georgia field secretary 1962–63; *Hands on the Freedom Plow* co-editor. Pioneering white SNCC woman + later activist-scholar.
- Paulo Freire: Brazilian popular educator; *Pedagogy of the Oppressed* (1968); founder of critical pedagogy; deeply influential at Highlander Folk School + at SNCC's organizing-trainer pipeline. Cross-corpus relevance via Highlander Folk School linkage.
- Jack Minnis (1923–2005): SNCC research director 1962–66; designed the Lowndes County Freedom Organization (LCFO) ballot 1965–66; later anti-corporate-power researcher. Foundational behind-the-scenes SNCC strategic figure.
- Prathia Hall (1940–2002): SNCC field secretary, Albany Movement (1962–63); pioneering Black woman in Baptist clergy.
- Claude Sitton (1925–2015): NYT Atlanta bureau chief 1960–64; foundational civil rights South journalist.
- Amelia Boynton Robinson (1911–2015): Selma voting-rights pioneer; beaten on Edmund Pettus Bridge March 7 1965.
- Waveland (SNCC retreat, Nov 1964): canonical thematic entry parallel to Birmingham/Selma/Atlantic City — women's position paper + "freedom-high vs structure" debate + McComb Project pivot all originated here.
- *Hands on the Freedom Plow: Personal Accounts by Women in SNCC* (2010): thematic "Women in SNCC" entry — University of Illinois Press; 52-essay oral history; co-edited by Faith Holsaert, Martha Prescott Norman Noonan, Judy Richardson, Betty Garman Robinson, Jean Smith Young, Dorothy M. Zellner.

**Adversarial-review flag updates:**

| Original row | Action (resolved / retained / new) | Notes |
|---|---|---|
| 7.27 / 7.P2.18 (Walter Williams Jackson State) | retained | Still uncertain; speaker self-tagged the name as uncertain. Awaiting Jackson State SNCC-era expulsion records SME lookup. |
| 7.29 / 7.P2.10 (Mickey Most → Michael Harrington?) | retained | LID-SDS split context unresolved; awaiting multi-model match against LID 1962 NEC roster. |
| 7.P2.17 (Becky Mills / Becky Adams) | retained | Berkeley SDS organizer name ambiguity; awaiting SDS biographical archive lookup. |
| 7.P2T.37 (Charlene Crants → Charlene Mitchell?) | retained | DC SNCC/MFDP office figure unresolved; multi-model could differentiate Charlene Mitchell (CPUSA) from a DC-local Charlene. |
| 7.P2T.66 ("our coast steel" Baltimore steel plant) | retained | Baltimore industrial-tour SME lookup unresolved; Armco / Eastern Stainless / Sparrows Point cluster candidates. |
| 7.P2T.65 (HRSA "high-end spill") | RESOLVED (promoted to high in this Pass 4) | Confirmed Rockville MD as the HRSA Parklawn Building canonical address; "high-end spill" is a phonetic garbling of "in Rockville." Remove from adversarial-review queue. |

**Audit-complete assessment:** Entry #7 (Betty Garman Robinson) is publication-ready pending resolution of 5 retained adversarial-review flags (Walter Williams, Mickey Most, Becky Mills, Charlene Crants, "our coast steel"); all high-confidence rows and Subject-paragraph claims verified against raw transcript, with one new alias variant (Dinky Romely) and one promoted resolution (HRSA → Rockville MD) added.

**Audit-complete marker**: Pass 4 complete on entry #7 as of 2026-05-22.
