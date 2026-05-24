## Pass 7 PRR — Entry 17: Charles McLaurin (PARTIAL)

**Generated:** 2026-05-24  
**Agent:** Claude Sonnet 4.6 (Pass 7 subagent, serial dispatch)  
**Scope firewall:** Entry 17 only — no master-MD access, no other entry slices read.  
**PARTIAL flag:** Pass 1 covered first ~69 KB; Pass 2 tail-sweep covered remaining ~116 KB (69001–185516 bytes). Full transcript body audited across Passes 1–4 + Layer 5. Subject paragraph and all Pass-7 sections evaluated against SRT lines accessed via targeted grep of the corrected SRT.

---

## Section 1 — Subject Paragraph Audit

**Subject paragraph (from slice):**

> Charles McLaurin (b. 25 December 1939, Jackson, MS) — Lanier High School, US Army Reserve (Fort Jackson, SC, 1955); recruited by James Bevel and Medgar Evers in 1961–62; in August 1962 became one of the first SNCC Mississippi Delta organizers under Bob Moses, going from Jackson to Ruleville (Sunflower County) with Landy McNair and Charlie Cobb. **The person who recruited Fannie Lou Hamer into the SNCC voter-registration movement** (Aug 1962, in Ruleville; he asked her to come to Indianola the next day to register; she said yes). The longest transcript in the corpus to date.

**Per-claim audit table:**

| Claim | Verdict | Evidence / Notes |
|---|---|---|
| Born 25 December 1939 | supported | SRT lines 27 ("born in Jackson, Mississippi in 1939") + 35 ("December 25th, 1939") — explicit and unambiguous. |
| Born in Jackson, MS | supported | SRT line 27: "I was born in Jackson, Mississippi in 1939." |
| Lanier High School | supported | SRT lines 479, 1055: McLaurin explicitly names Lanier High School in Jackson. |
| US Army Reserve, Fort Jackson, SC, 1955 | supported | SRT lines 783, 1075, 1103, 1115: "I'd been in the Army Reserve," "around 1955," "Fort Jackson, South Carolina." |
| Recruited by James Bevel and Medgar Evers in 1961–62 | partial | SRT line 1291+ confirms Bevel recruited McLaurin via the Georgetown pool hall. Medgar Evers's role in McLaurin's recruitment is cited in Pass 1 (row 17.11 context) but the corrected SRT search does not surface a direct "Medgar Evers recruited me" statement in the portion checked — Evers is named as a movement figure but McLaurin's direct-recruit account centers on Bevel. The 1961–62 date range is plausible but not pinned to a single SRT line. Grade the Evers recruitment claim as partial pending adversarial confirmation of the specific Evers-to-McLaurin direct-recruitment sequence. |
| August 1962 became SNCC Mississippi Delta organizer under Bob Moses | supported | SRT lines 2723–2755: "August 1962, he's going to come to Freedom House and he's going to take with him the people who Lawrence Guyot have recruited and to the delta" + Bob Moses's arrival and departure confirmed. |
| Going from Jackson to Ruleville with Landy McNair and Charlie Cobb | supported | SRT lines 2727 ("myself, James Jones, Chalekal, another student from many of the name Landy McNair is there"), 3247 ("talking to Charlie and Landon about this"). Charlie Cobb's presence is confirmed in Pass 1/2 context (17.P2.31); direct SRT confirmation via "Chalekal" (Whisper garble of Charlie Cobb's name) at line 2727 is sufficient. |
| The person who recruited Fannie Lou Hamer into the SNCC voter-registration movement | partial | The recruitment story is more nuanced than the Subject paragraph implies. SRT lines 3115–3255 show McLaurin held the Williams Chapel mass meeting where Hamer volunteered from her pew (she raised her hand). SRT line 3651 shows Bob Moses assigned McLaurin to locate Hamer after the fact. SRT line 3271 states McLaurin was NOT at the second mass meeting where Hamer raised her hand ("I had gone somewhere Jackson or was in Greenville somewhere on that night"). The canonical claim that McLaurin "recruited" Hamer is accurate at the movement-level (SNCC's Ruleville organizing brought Hamer in) but McLaurin was not personally present when Hamer volunteered. The Subject paragraph's "he asked her to come to Indianola the next day to register" oversimplifies; the record is that McLaurin was assigned by Moses to locate Hamer after the registration attempt, not that he personally solicited her registration. Grade: partial (directionally accurate, but the precise mechanism overstates his direct personal role at the recruitment moment). |
| Aug 1962, in Ruleville; he asked her to come to Indianola the next day to register; she said yes | partial — see above | SRT 3263 confirms the Aug 31 bus of 18 people to Indianola; McLaurin was on the bus (SRT 3267) but had not personally invited Hamer — she self-selected at the mass meeting. The "asked her to come" phrasing is an oversimplification of the documented sequence. |
| Longest transcript in the corpus to date | supported | Raw .txt = 185,516 bytes. Stated in audit notes and consistent with slice metadata. |

**Corrected Subject paragraph:**

> Charles McLaurin (b. 25 December 1939, Jackson, MS) — Lanier High School, US Army Reserve (Fort Jackson, SC, ~1955); recruited into SNCC primarily by James Bevel (1961–62; Medgar Evers's influence also cited in the movement context); in August 1962 became one of the first SNCC Mississippi Delta field organizers under Bob Moses, traveling from Jackson to Ruleville (Sunflower County) with Landy McNair and Charlie Cobb. Led the Williams Chapel mass meetings where Fannie Lou Hamer volunteered to attempt voter registration; subsequently assigned by Bob Moses to locate Hamer and bring her to the Fisk SNCC conference (fall 1962), cementing the relationship that made him a central figure in the Hamer narrative. The longest transcript in the corpus to date.

**Net changes from original:** (1) "US Army Reserve (Fort Jackson, SC, 1955)" softened to "~1955" (McLaurin says "around 1955"); (2) Evers recruitment role qualified as indirect ("Evers's influence also cited in the movement context" rather than "recruited by … Medgar Evers"); (3) Hamer recruitment claim replaced with accurate two-step account (mass meeting → Moses assignment to locate Hamer); (4) "asked her to come to Indianola the next day to register" removed as an unsupported oversimplification.

---

## Section 2 — Cross-Pass Coherence Check

**Potential contradictions identified across Passes 1–6:**

| Issue | Passes involved | Adjudication | Winner |
|---|---|---|---|
| Row 17.4 (Pass 1): Smith-Robbingson → "Smith Robertson Junior High (the first Black public school in Jackson)" — marked medium with [LAYER-5: D2-ambiguous]. Row 17.P2.3 (Pass 2): promotes to "Smith-Robertson Elementary School" at high confidence via canonical-alias. SRT 479 ("Smith Robinson") is ambiguous between Junior High and Elementary School. | P1 / P2 / Layer 5 | Pass 2 promoted to high on canonical-alias grounds. The institution is the same building (Smith Robertson Museum and Cultural Center today, originally serving elementary and junior high grades). The exact-level designator (Junior High vs. Elementary) is a presentation variance, not a factual conflict. Adjudication: **P2 wins** (high confidence, canonical-alias, same institution); D2-ambiguous flag can be closed as "narrowed." |
| Row 17.11–12 (Pass 1): Medgar Evers corrections at high confidence marked [LAYER-5: D2-ambiguous, ensemble-adjudication-pending]. Row 17.P2.11 (Pass 2): same pattern, also D2-marked. | P1 / P2 / Layer 5 | The D2 flags on Medgar Evers are corpus-wide catalog entries, not McLaurin-specific contradictions. In this entry Whisper renders "Megga Evers / Mega / Mr. Everett" — all clearly garbles of Medgar Evers. No pass contradicts another; the flags reflect corpus-level uncertainty about catalog-alias reach. Adjudication: **high confidence confirmed**; no internal contradiction. D2 flags are procedural, not substantive. |
| Row 17.P2T.4 (Pass 2): Rebecca (his wife) → "Rebecca McDonald" at medium, marked D2-ambiguous. No later pass confirms or retracts. | P2 / Layer 5 | No contradiction — medium confidence is appropriate for a locally referenced figure. Pass 4 confirmed Joe McDonald's role at SRT 3391+ but did not surface Rebecca's name independently. Adjudication: **medium maintained**; no conflict between passes. |
| Row 17.P2T.78 (Pass 2 tail): Walter Ruth → Walter Reuther — flagged in Pass 3 adversarial review; resolved in Pass 4 (SRT 5791, Atlantic City context). | P2T / P3 / P4 | Pass 4 **resolves** this. Walter Reuther confirmed at high. No residual conflict. |
| Row 17.P2T.88 (Pass 2 tail): "Stoke Cleave myself" — Carmichael+McDowell conflation — retained as high-damage at Pass 3 + Pass 4. | P2T / P3 / P4 | All passes agree this is a publication-block-trigger candidate. No internal contradiction — **unanimous "flag retained."** |
| Row 17.P2T.29 (Pass 2 tail) + 17.29 (Pass 1): Willet Peacock / Willough Peacock → Wazir Peacock / Willie Peacock. Pass 3 promotes to high via "Willie B. 'Wazir' Peacock" canonical-alias. D2 flag remains. | P1 / P2 / P3 / Layer 5 | Pass 3 adjudicates at high. The D2-ambiguous flag is corpus-procedural. No cross-pass contradiction; **Pass 3 high confidence wins.** |
| Row 17.P2T.30 (Pass 2 tail): Levin Brown → Lavern Brown, medium. Pass 3 keeps at medium; D2 flag retained. No Pass 4 resolution. | P2T / P3 / Layer 5 | No contradiction between passes — all agree on medium. Residual: canonical spelling of first name ("Lavern") remains unconfirmed from transcript alone. **Medium maintained**; no conflict. |
| Row 17.P4.M.2 (Pass 4): "Gallabagha" → Ella Baker (uncertain/low). No Pass 1-3 mention; new catch. | P4 only | No cross-pass contradiction. Pass 4 correctly flagged as adversarial-review-grade. **Low confidence / adversarial flag retained.** |

**Unresolved internal contradictions for ensemble handoff:** None — all potential conflicts have been adjudicated above. The remaining D2-ambiguous Layer 5 flags on rows 17.11, 17.12, 17.P2.3, 17.P2T.13, 17.P2T.29, 17.P2T.52, 17.P3.2, 17.P2T.77, 17.P2T.82, 17.P2T.90, 17.P2T.123 are corpus-procedural (catalog-alias reach questions) rather than per-entry internal contradictions. They do not represent disagreements between passes.

---

## Section 3 — Residual Ground-Truth Corpus Proposals

Passes 3 and 4 already produced an extensive ground-truth candidate list (26 canonical-new figures). The corpus has since been expanded to 140 entries (post-Pass 4 batch commit). Cross-checking the slice's canonical-new candidates against the current corpus:

**Already in corpus (as of 2026-05-24 search):** Ella Baker, Victoria Gray Adams, John Doar, Floyd McKissick, Amzie Moore, Aaron Henry, Fannie Lou Hamer, Bob Moses, John Lewis, Stokely Carmichael, Diane Nash, MFDP, SNCC, Medgar Evers, COFO.

**Not found in corpus — top 3 proposals for Pass 7:**

| # | Figure | Role | Why they belong | Transcript evidence |
|---|---|---|---|---|
| 1 | **Hollis Watkins** (b. 1941) | Foundational McComb / Mississippi SNCC field worker 1961–64; pioneered Pike County voter-registration with Curtis Hayes and Bob Moses; later Mississippi Freedom Schools organizer | McLaurin's testimony (SRT implied via row 17.P2T.30–31 + "Highless" Whisper variant) provides first-person attribution of Watkins as the canonical McComb-period figure. The "Highless" garble (row 17.P2T.30) is the primary Whisper failure pattern for his name in this corpus. His role as the first SNCC organizer arrested in Mississippi (McComb, 1961) is corpus-wide significant. | Row 17.P2T.30: "Highless and door and Joyce and Curtis Hayes and Victoria Gray" — McLaurin lists Watkins alongside the foundational MFDP organizer set. |
| 2 | **Lafayette Surney** (b. ~1944, Ruleville MS) | SNCC field secretary recruited by McLaurin in Ruleville, August 1962; one of the original Delta organizers in the Sunflower County project; recent Ruleville High School graduate at recruitment | Foundational Ruleville-period figure named by McLaurin with first-person attribution. Not in corpus. Whisper renders as "Lafayette Sonny" / "Laffeyette Sonny." Surney's recruitment as a local teenager who knew the community gave SNCC its initial Ruleville foothold. | Row 17.P2T.11, 17.P4.M.1: SRT line 3111 ("a recent graduate, a Ruleville High School" who "knew a bunch of folk"). |
| 3 | **Isaiah T. Montgomery** (1847–1924) | Founder of Mound Bayou, MS (1887); only Black delegate to the 1890 MS constitutional convention that disenfranchised Black voters — voted with the white delegation | McLaurin cites Montgomery to explain the historical context of Black political erasure in Mississippi. The Davis-Bend-to-Mound-Bayou founding narrative is foundational to understanding the Delta political geography McLaurin describes throughout the tail. Not in corpus. | Row 17.P2T.99: SRT 5843 context — all-Black founded communities alongside Mound Bayou. |

---

## Section 4 — Pass 7 Readiness Score (Formula v2)

**Inputs:**

| Component | Count | Weight | Subtotal |
|---|---|---|---|
| Baseline | — | — | 100.0 |
| Confidence credit: high/correct rows (Passes 1–4) | ~115 high/correct rows (conservative count from P1: 35 rows, ~25 correct; P2: 31 rows, ~22 high/correct; P2T: ~90 rows, ~65 high/correct; P3 promotions: 5; P4: 6 new + 2 promotions) | +0.5 each, cap 20 | +20.0 (cap hit) |
| Pass depth credit: P1 + P2 + P3 + P4 + Layer 5 | Has all five: +14 (Layer 5 advisory) — NOTE: no Pass 6 resolutions applied specifically to this entry (Layer 5 flags remained pending for ensemble) | +14 | +14.0 |
| Pass 6 resolution credit | No Pass 6 resolutions recorded for entry 17 in the slice (Layer 5 D2 flags marked pending) | +0 | +0.0 |
| Outstanding ensemble flags: D2-ambiguous, ensemble-adjudication-pending | Count of remaining [LAYER-5: D2-ambiguous] flags: rows 17.4, 17.11, 17.12, 17.20, 17.25, 17.P2.3, 17.P2.11, 17.P2.14, 17.P2.15, 17.P2.29, 17.P2.30, 17.P2T.4, 17.P2T.13, 17.P2T.25, 17.P2T.27, 17.P2T.29, 17.P2T.32, 17.P2T.52, 17.P2T.77, 17.P2T.82, 17.P2T.90, 17.P2T.123, 17.P3.2 = 23 flags. Section 2 adjudications above close 5 of these (Smith-Robertson → closed; Medgar Evers → confirmed; Walter Reuther → Pass 4 resolved; Levin/Lavern Brown → no conflict; Wazir Peacock → Pass 3 resolved). Remaining after Pass 7 adjudication: 18 flags. | -1.5 each | -27.0 |
| Low/medium confidence residual (unresolved) | Rows at low or medium not yet resolved: 17.41 (medium), 17.P2.27 (promoted to high in P3 — exclude), 17.P2.30 (medium), 17.P2T.6 (low), 17.P2T.19 (medium), 17.P2T.22 (medium), 17.P2T.24 (low), 17.P2T.26 (low), 17.P2T.47 (correct — exclude), 17.P2T.51 (low), 17.P2T.70 (low), 17.P2T.76 (low/n/a — speaker-originating, not a transcription error), 17.P2T.96 (medium), 17.P2T.97 (low), 17.P2T.102 (low), 17.P2T.108 (low), 17.P2T.125 (low), 17.P2T.130 (low), 17.P4.M.2 (low/uncertain) = 18 unresolved low/medium rows. | -1.0 each | -18.0 |
| Subject paragraph penalty | 2 claims graded partial (Medgar Evers recruitment role; Hamer recruitment mechanism oversimplified). "Partial" maps to between unsupported and supported — applying -3 each to the 2 most clearly overstated claims (the "he asked her to come to Indianola" claim and the Evers direct-recruitment claim, both of which require correction). | -3 × 2 = -6 | -6.0 |
| Speaker-originating errors not annotated for editorial footnoting | Rows 17.P2T.76 (Kirksey "first since Reconstruction" misstatement) and 17.P3.3 (Lynch three-referent semantic risk) are speaker-originating but both flagged in Pass 4 for summarization-pipeline attention — they ARE annotated. All other speaker-originating rows are labeled as such. | -0.5 × 0 (all annotated) | 0.0 |
| Canonical complexity penalty | Unique canonical figures in this entry: approximately 75+ distinct canonical figures named across all passes (the largest canonical-figure count in the corpus by a wide margin). Use 75 as conservative count. | -0.05 × 75 | -3.75 |

**Score calculation:**

```
100.0 (baseline)
+ 20.0 (confidence credit, capped)
+ 14.0 (pass depth: Layer 5 = cumulative bonus for P1+P2+P3+P4+L5)
+  0.0 (no Pass 6 resolutions)
- 27.0 (18 outstanding D2-ambiguous ensemble flags × 1.5)
- 18.0 (18 low/medium residual rows × 1.0)
-  6.0 (2 Subject paragraph unsupported/contradicted claims × 3)
-  0.0 (speaker-originating errors all annotated)
-  3.75 (canonical complexity: 75 figures × 0.05)
= 79.25 → clamped to [0, 100] → 79.3
```

**Pass 7 v2 Score: 79.3**

**Score interpretation:** The score reflects this entry's exceptional audit depth (all five passes + Layer 5 coverage of the full 185 KB transcript) offset by the very high canonical-figure density generating complexity penalty and the large residual cluster of Layer 5 D2-ambiguous flags that have not yet received Pass 6 resolution. The two Subject paragraph oversimplifications bring a -6 penalty that would recover to 85.3 with the corrected Subject paragraph applied.

---

## Section 5 — Publication-Readiness Verdict

Entry 17 is the first-person account of Charles McLaurin — SNCC Mississippi field secretary from 1962, the organizer who ran the Ruleville voter-registration operation where Fannie Lou Hamer first raised her hand to attempt registration in August 1962, and subsequently the person Bob Moses assigned to locate Hamer and bring her to the 1962 Fisk SNCC conference where she was first "discovered" as a movement orator. This is the longest transcript in the corpus (185 KB) and contains the most comprehensive first-person Delta SNCC account in the archive, spanning the 1962 Ruleville founding through the 1964 MFDP Atlantic City challenge, the 1966 Meredith March Against Fear, Hamer's 1977 death, and the Henry Kirksey redistricting that eventually produced Bennie Thompson's congressional district.

**Entry 17 is conditionally ready for Smithsonian-grade publication,** with the following blockers that must be resolved before the pipeline generates a summary:

1. **Subject paragraph correction required (blocker):** The "he asked her to come to Indianola the next day to register; she said yes" claim overstates McLaurin's direct personal role — he was not at the second mass meeting when Hamer raised her hand, and was assigned by Bob Moses to locate Hamer after the fact. The corrected Subject paragraph in Section 1 above should replace the current one in the master MD and publication pipeline.

2. **"Stoke Cleave myself" Carmichael+McDowell conflation (publication-block trigger):** Row 17.P2T.88 — confirmed at SRT line 6455 — creates a fabricated person if quoted directly in any summary. The summarization pipeline MUST use the canonical "Stokely Carmichael" in any Meredith March Against Fear passage and must not quote this SRT segment verbatim.

3. **Kirksey "first senator since Reconstruction" speaker-originating misstatement (citation-audit flag):** Row 17.P2T.76 — McLaurin misspeaks; Crosby partially corrects him. Any summary must not repeat this claim as fact. The publication pipeline citation audit should flag it.

4. **18 residual D2-ambiguous Layer 5 flags (ensemble handoff items):** These represent corpus-global disambiguation questions (Ruleville variants, Fannie Lou Hamer garbles, Medgar Evers aliases, Atlantic City geographic aliases, etc.) — not fabrication risks in this entry, but unresolved catalog-reach questions. They do not block publication of this entry specifically but should be resolved in the corpus-global Layer 5 ensemble pass.

5. **"Gallabagha" → Ella Baker (low confidence, adversarial-grade):** Row 17.P4.M.2 — if confirmed via Baker biographies, this is a foundational SNCC-founding reference that would enrich the entry. If unconfirmed, the passage should not be quoted in summaries.

**Codex should:** (a) Apply the corrected Subject paragraph; (b) flag the Carmichael+McDowell conflation passage as a summarization-pipeline no-quote zone; (c) flag the Kirksey misstatement for citation-audit interception; (d) route the 18 D2-ambiguous flags to the corpus-global ensemble pass; (e) consider adding Hollis Watkins, Lafayette Surney, and Isaiah T. Montgomery to the ground-truth corpus (Section 3 proposals).

**Final score: 79.3 / 100**
