#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 102.22 Dr. Tony Stone -> Dr. Anthony Stone | medium | medium (kept) | Shreveport attorney identification still uncertain. "Anthony Stone" not directly verified in published Shreveport civil-rights legal-defense history; could be a phonetic Whisper rendering of a different name (e.g., "Tom Stone" or "Sloan"). Recommend keeping at medium pending adversarial review. |
| 102.24 HL Wicklow / HL Whitlow -> H.L. Whitlow | medium | high (promoted) | The Pass 2 #102.P2.13 observation that Blake himself uses "Whitlow" with closure when retelling the story is decisive. Phonetic variation within the same transcript between "Wicklow" and "Whitlow" is a Whisper artifact, not speaker uncertainty. Promote to high. |
| 102.25 Tech -> Louisiana Tech | medium | high (promoted) | Context: a white student from "Tech" hired alongside a "black student from Grahamlin (Grambling)" — Louisiana Tech is the canonical white state university in Ruston LA, paired naturally with Grambling. Promote to high. |
| 102.36 Tony Stone (recurring) -> Anthony Stone | medium | medium (kept) | Same as #102.22 — flag for adversarial review. |
| 102.P2.5 Mouth Scow -> Moscow | high | high (kept) | Confirmed 1960s segregationist anti-civil-rights "blame the Russians" trope. Recurring pattern in transcripts of Southern segregationist accounts (Klan + Citizens Council literature both invoked Moscow). |
| 102.P2.22 head water / had water (Walter intervention) | high | high (kept) | Pass 2 author's Stage-3 LLM interpretation ("we got to have Walter") is plausible. Alternative reading: "we got a Walter" (referring to the boy by first name). Either way, the meaning of the passage (Blake's plea to fund a homeschool intervention) is unambiguous. |
| 102.P2.31 Halsom / Halson | low | low (flag) | Plantation neighbor surname uncertain. Could be "Halsey" or speaker's local Caddo Parish neighbor. Flag. |
| 102.P2.33 senior AIDS white farmer | medium | high (promoted) | "Senior aged" being rendered as "senior AIDS" is a canonical Whisper acronym-insertion error. Same pattern across the corpus. Promote to high. |
| 102.P2.34 He'd been pollster -> "He was the postmaster" | medium | high (promoted) | Context: elderly white customer in the Whitlow general store + the Dixie LA postal context confirms "postmaster" reading. Promote to high. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 102.22 / 102.36 | Dr. Tony Stone / Anthony Stone | Identification not directly verifiable in published Shreveport civil-rights legal history; possible Whisper rendering of a different name. |
| 102.P2.17 | Brewster Hospital / Flagler / E.G. Chase cross-contamination of Pass 1 Notes | Pass 2 author correctly identified that Pass 1 Notes for Blake erroneously imported the Brewster-Hospital / Flagler / E.G. Chase pathway from Hayling's transcript #103. Master MD needs correction at line ~13497 (Blake's Pass 1 Notes second paragraph). |
| 102.P2.18 | Mayor "Calhoun" name unsourced in Pass 1 Notes | Pass 2 author correctly identified that the name "Calhoun" appears in Pass 1 Notes for Blake but is not in the actual transcript. Master MD needs correction. |
| 102.P2.31 | Halsom / Halson surname | Plantation neighbor identification uncertain. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Rev. Dr. Harry Blake (b. 1934): Shreveport LA SCLC field staff member hired by Dr. Martin Luther King Jr. on March 1, 1960. Survived a Sept 22, 1963 beating by Commissioner George D'Artois at Little Union Baptist Church (the 16th-Street Baptist memorial gathering); survived an Oct 12, 1960 assassination attempt that left four bullet holes in his coat. Pastor of Mount Canaan Baptist Church Shreveport from 1966. Foundational LA SCLC figure not in civil_rights_facts.json.
- Commissioner George W. D'Artois (Shreveport Commissioner of Public Safety 1962-77): Canonical LA segregationist law-enforcement figure; personally beat Blake at Little Union Baptist Church Sept 22, 1963 with two officers; later (post-1966) consented to support Blake's housing development projects; received a public proclamation of apology to Blake from the City of Shreveport in 2003 (40 years after the beating). Notorious figure also implicated in 1976-77 murder-for-hire investigations. Not in civil_rights_facts.json.
- Dr. C.O. Simkins (Shreveport NAACP / SCLC board member): Blake's mentor and the canonical Shreveport SCLC figure who asked Dr. King to interview Blake post-Bishop-College-commencement. Not in civil_rights_facts.json; foundational Shreveport SCLC figure.
- H.L. Whitlow (Dixie LA grocery owner): Documented (via Blake's first-person testimony) post-WWII non-Klan-aligned Southern white who in 1952 paid Blake at the rate the work was actually worth, gave him a car to drive to school, and integrated his summer-hire of LA Tech + Grambling students. Lost social standing among his white peers ("nigga lover" reputation). Canonical example of pre-1964-Civil-Rights-Act voluntary fair-employment practice — not in civil_rights_facts.json but worth including as a representative figure of an under-documented category.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 102.P3.1 | None — Pass 1/2 was substantively comprehensive for this 42 KB transcript. The two Pass 2 corrections to master-MD Pass 1 Notes (Brewster-Hospital cross-contamination and unsourced "Mayor Calhoun" name) are the primary contributions. | n/a | n/a | n/a | The Pass 1 author identified all canonical-figure misattributions and all key geographic substitutions. Pass 2 sweep also caught all the recurring Whisper variants and the canonical common-noun errors (whoa/gee/haw mule commands, the pool of the rains, Captain and Balson). The two master-MD-error corrections are the substantive net new contribution. |

**Audit-complete marker**: Pass 3 complete on entry #102 as of 2026-05-22. Ready for adversarial-model review.
