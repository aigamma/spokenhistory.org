#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 65.2 Petna Dalico -> Petna Dadelica | low | low (kept) | Videographer name remains uncertain; David Cline crew has used multiple videographers across transcripts. Pass 2 P2.12 noted same uncertainty. Recommend adversarial-model cross-check against canonical Cline-team videographer roster. |
| 65.9 Dubgaate -> (uncertain local landmark) | low | low (kept) | No corpus or canonical anchor. Likely a Sasser/Old Dawson Road local farming-community name with no documentary footprint. Defer to subject's family or oral-history follow-up. |
| 65.10 Limson -> (Sasser sub-community) | low | low (kept) | Same as 65.9 — local micro-toponym with no canonical anchor. |
| 65.11 Panty Grove -> Pinney Grove | low | medium (promoted) | The entry preamble already establishes "Pinney Grove" as canonical (the one-room school McCullar attended); the Whisper rendering "Panty Grove" is phonetically consistent with "Pinney Grove" given the speaker's south-Georgia dialect. Promotion is internal-consistency-driven, not external-corpus-driven. |
| 65.12 Vanny Wakefield | speaker-originating | speaker-originating (kept) | Speaker's own recall of her first teacher; no canonical anchor possible. Keep as speaker-originating. |
| 65.18 Buffa Global -> Bertha Gober | medium | high (Pass 2 promoted, confirmed) | Pass 2 P2.8 already promoted to high via canonical-alias evidence (Albany State sophomore expelled November 1961 for train-station sit-in; SNCC Freedom Singer). Confirmed. |
| 65.21 Zine Hill / Sardis Baptist | medium | medium (kept) | Both "Zion Hill" and "Sardis Baptist" are common rural-Black-Baptist church names with multiple Dawson-area instances. Pass 2 did not promote. Speaker recall + canonical-pattern but not a specific canonical congregation; adversarial check could attempt to identify the specific Dawson-area church. |
| 65.25 Don Steward -> Don Harris | low | high (Pass 2 promoted from medium) | Pass 2 P2.6 upgraded to medium citing canonical SW Georgia field-worker triad (Sherrod/Hall/Allen) + Don Harris as canonical fourth. Pass 3 promotes further to high: Don Harris is canonically attested in the Sherrod transcript (#18) and the Albany Movement literature as the field worker who organized in Americus alongside Ralph Allen and John Perdew (the Americus Four). The McCullar triad-plus-Harris reading is internally consistent. |
| 65.30 Reverend Whale -> Rev. Samuel B. Wells | medium | high (Pass 2 promoted) | Pass 2 P2.7 already promoted; the "His name was Samuel" prefix is the smoking-gun confirmation. Resolution stands. |
| 65.31 ADL sales -> (uncertain adult-literacy teacher) | low | low (kept) | Insufficient context to resolve. Speaker recall of an adult-literacy class teacher; possibly a person's initials (A.D.L.) rather than the ADL organization. |
| 65.37 CNA, Citiburn nursing system | medium | medium (kept) | Pass 2 P2.13 proposed CCU (Critical Care Unit) interpretation; reasonable but not corpus-anchorable. Phoebe Putney's CCU is plausible. Adversarial check might verify via Phoebe Putney historical department names. |
| 65.P2.11 We sickle this mess | low | low (kept) | Speaker disfluency. Pass 2 noted uncertainty. No corpus anchor. |
| 65.P2.15 cross through the other cross the streets | medium | high (promoted) | "Customer across the street" reading is internally consistent with the babysitting-children narrative context. The babysitting work + "smaller kid" homophone (Whisper key/kid) is unambiguous. Pass 3 promotes. |
| 65.P2.16 meetings have moved from there to my knowledge | medium | high (promoted) | The interviewer's confirmation "your family church" + the speaker's parallel "my home" construction in nearby context (and Pass 2 P2.18 covers the same speaker's "his house" pattern) makes "my home" reading unambiguous. Pass 3 promotes. |
| 65.P2.17 I tried to buy it, always working | medium | medium (kept) | Speaker disfluency; multiple plausible corrections. Adversarial check warranted. |
| 65.P2.18 Santa Claus at the post office and washes | medium | medium (kept) | Speaker context (Terrell Co. voter registrar's day job) is clear but the exact transcription "and washes" remains ambiguous (could be "and wages" / "and rushes" / "and watches"). Adversarial check warranted. |
| 65.P2.20 Methodist Church of the Small Church in South | medium | high (promoted) | "in Sasser" reading is unambiguous: Sasser is the canonical Terrell County town McCullar herself lived in (Pass 1 #65.5 established), and the geographic context (a small Methodist church the family attended after the Mount Olive burning) fits. Pass 3 promotes. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 65.2 / 65.P2.12 | Petna Dalico / Petna Dadelica / Petna Lo Castro | Three different Pass-1/Pass-2 renderings of the David Cline crew videographer. Cross-corpus check against Cline-team transcripts (Howell #67 same iteration uses Cline; Burns #70 uses Dittmer) to pin canonical spelling. |
| 65.9 / 65.10 | Dubgaate / Limson local toponyms | Adversarial models with stronger Georgia gazetteer access may resolve. |
| 65.31 / 65.32 | ADL sales / St. Robert (adult-literacy teacher) | Pass 1 + Pass 2 both unable to resolve. Speaker recall ambiguity. |
| 65.37 / 65.P2.13 | Citiburn nursing system | Phoebe Putney Hospital department-name lookup may resolve. |
| 65.P2.17 / 65.P2.18 | "I tried to buy it" / "Santa Claus at the post office and washes" | Speaker-disfluency parsing; adversarial models with stronger context-window may resolve. |
| 65.21 | Zine Hill / Sardis Baptist (specific Dawson-area congregation) | Identifying the specific church Mt. Olive-burned-out members moved to. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Sheriff Z.T. Mathews (Terrell County, GA): Notorious segregationist sheriff of Terrell County 1940s–60s, documented in Howard Zinn's "SNCC: The New Abolitionists" and the Justice Department's 1962 Civil Rights Division investigation following the Mount Olive Baptist Church burning. The Pass 2 entry (65.P2.21) explicitly recommends adding to facts.json. Mathews is the canonical figure who personifies "Terrible Terrell" — adding him grounds the SW Georgia Movement geography in a specific antagonist.
- Bertha Gober (b. ~1942): Albany State sophomore expelled November 1961 for train-station sit-in (with Blanton Hall, who was also expelled), SNCC Freedom Singer, helped catalyze the Albany Movement's student wave. Foundational SW Georgia Movement figure not in facts.json.
- Lucius Holloway: President of the Terrell County Movement 1961–65, canonical local-leadership figure who anchored SNCC's SW Georgia field-worker base in Sasser. Recurring across SW Georgia interviews (Sherrod #18, McCullar #65, Howell #67); should be in facts.json.
- Carolyn Daniels: Dawson, GA Black woman whose home was the primary lodging for SNCC field workers (Sherrod, Hall, Allen, Harris) during the 1961–63 SW Georgia campaign. Canonical Movement-infrastructure figure; her name appears across multiple SW Georgia transcripts.
- Mount Olive Baptist Church burning (August 1962, Sasser, Terrell County, GA): Canonical SW Georgia church-burning event, one of three (Mt. Olive, Mt. Mary, Shady Grove) that triggered the federal Justice Department's Civil Rights Division investigation under John Doar. Worth adding as a discrete event entry to facts.json.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 65.P3.1 | "the famous Brown ruling, Stagnath's segregation" | the famous Brown ruling [stating] that segregation | high | canonical | Pass 2 P2.1 caught the "Stagnath" Whisper artifact but did not link to the catalog: this is a previously-undocumented variant of the "Brown vs. Borge" → "Brown v. Board of Education" pattern (catalog G, frequency high). Recommend adding "Stagnath" as a new Whisper-error variant to catalog G under Brown v. Board. |
| 65.P3.2 | "snake / snake workers" cross-reference to Henderson #68 same iteration | SNCC / SNCC workers | high | canonical-alias | Pass 1 #65.28 and Henderson #68 P2 row both attest the snake/SNCC pattern. This iteration (entries #65–#69) shows the pattern recurring in three consecutive SW Georgia / Mississippi interviews. The catalog B "snake" entry should be promoted to "very high" frequency (currently "very high" but example list does not include #65, #68). |
| 65.P3.3 | "Lucius Hallway" → Lucius Holloway pattern | Lucius Holloway | high | canonical | Pass 1 #65.22 caught. Worth adding "Hallway → Holloway" as a previously-undocumented variant to catalog C (similar to "Mathews → Matthews" patterns) for downstream Stage-2 fuzzy matcher. Recurring in SW Georgia transcripts. |
| 65.P3.4 | "Tarot County" / "Terrible terror" Whisper pattern for Terrell | Terrell County | high | canonical | Pass 1 #65.4 + 65.41 caught. The "Tarot/Terrible terror" rendering is a high-frequency canonical SW Georgia geographic Whisper-error not currently in catalog F. Recommend back-filing to catalog F geographic errors. |
| 65.P3.5 | The Henderson #68 P2.27/P2.28 reference to "northern Penole County" (Othar Turner statue) | northern Panola County (NOT Terrell — different county, different state) | n/a | cross-corpus disambiguation | Cross-corpus disambiguation note: Henderson's "Penole/Penola" is Panola County, MS (Mississippi Hill Country); McCullar's "Tarot" is Terrell County, GA. Different counties, different states. Adversarial models should not conflate. |

**Audit-complete marker**: Pass 3 complete on entry #65 as of 2026-05-22. Ready for adversarial-model review.
