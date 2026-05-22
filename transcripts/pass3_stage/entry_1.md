#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 1.5 Elmer Rhodes -> Eleanor Roosevelt | medium | high | Catalog row E lists "Mrs. Ellen, the Roosevelt -> Mrs. Eleanor Roosevelt" as a canonical Whisper pattern (entry #29). Context (Black soldier's mother writing to Eleanor Roosevelt about Mississippi mistreatment) is documented WWII practice; phonetic "Elmer Rhodes" maps cleanly to "Eleanor Roosevelt" via Whisper's stress-pattern substitution. Catalog precedent + context = HIGH. |
| 1.7 Orange Institute -> Art Institute | medium | high | Resolution-by-internal-corroboration: Pass-1 note states "earlier in the same passage Whisper rendered this correctly as 'Art Institute'." Same speaker, same antecedent, same passage = HIGH. Pass 2 row 1.P2.24 already promoted this independently. |
| 1.8 Shannu Air Force Base -> Chanute Air Force Base | medium | high | Geographic context confirms (Champaign IL is adjacent to Rantoul IL, the documented site of Chanute AFB until 1993). Pass 2 row 1.P2.1 already promoted to HIGH. |
| 1.9 Majona -> Madrona | medium | high | Catalog row F: "Madrid (Seattle context) / Modrona -> Madrona (Seattle Central District)" cites entries #1, #37. Pass 2 row 1.P2.2 already promoted to HIGH. |
| 1.10 Les Chi -> Leschi | medium | high | Leschi is a documented Seattle neighborhood directly adjacent to Mount Baker (confirmed by speaker's adjacency-list); Pass 2 row 1.P2.4 already promoted to HIGH. |
| 1.13 Stokeley vs Stokely | low (spelling) | high (spelling) | Canonical spelling per civil_rights_facts.json ("Stokely Carmichael") is definitive. One-character variant promoted to HIGH-spelling. |
| 1.15 Brutu Man -> Voodoo Man | low | speaker-originating | Pass 1 itself flagged 1.16 as the canonical speaker-form. The two are the same person; "Brutu Man" is Whisper's variant transcription of the speaker's natural nickname. Downgrade-to-speaker-originating is the correct resolution (cannot ground-truth either rendering against external sources). |
| 1.22 Eldritch John Huggins -> Bunchy Carter and John Huggins | medium | high | Catalog row D and Pass 2 row 1.P2.13 both confirm canonical 1969 UCLA Campbell Hall assassination of Bunchy Carter + John Huggins. Whisper sentence-merge artefact is well-documented. HIGH. |
| 1.24 Marston -> Mao Zedong (likely) / Marx (alt) | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Catalog row D has "Mao Zai-Tung -> Mao Zedong" as a canonical pattern at entries #1, #35, #37. The Whisper rendering "Marston" does not match either Mao or Marx phonetically. Context (rapid-fire list with Che Guevara + Castro + Havana) supports a leftist-revolutionary referent but the specific identification cannot be resolved. Flag for adversarial review. |
| 1.34 Civil College of Intelligence -> Central Committee of Intelligence | medium | high | BPP Central Committee is canonical leadership body; "Civil College" is a clean Whisper homophone for "Central" + "Intelligence" appearing in both renderings. Phonetic match + canonical-entity match = HIGH. |
| 1.35 brother Rugi -> Brother Reefer/Roogie | low | speaker-originating | Speaker explicitly states it's a code name for marijuana, so the canonical form is speaker-internal. Downgrade to speaker-originating. |
| 1.45 Miljert -> Mildred | speaker-originating + low confidence | speaker-originating | Speaker's grandmother's name; unverifiable against external records per Pass 1 note. Resolve as speaker-originating (single category, not dual). |
| 1.48 L.U. too -> Cleaver too (ambiguous) | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Context is BPP leadership name list ("Elders Cleveland, David, L.U. too, as well"). The "Elders Cleveland" is clearly Eldridge Cleaver, "David" is David Hilliard. "L.U." likely a Whisper noise artifact for an additional name; cannot resolve. Flag. |
| 1.P2.8 Lynx Fine Arts -> Links Fine Arts | medium | medium | Pass-1 hypothesis (The Links Incorporated, national Black women's service organization) is plausible but no direct corroboration in catalog or corpus. Maintain MEDIUM. |
| 1.P2.16 Bertha Alexander -> Bertha Knox Alexander | medium | speaker-originating | BPP member unverifiable in canonical sources. Resolve as speaker-originating. |
| 1.P2.18 Audrey Jones -> Audrea Jones (Audrea Dunham) | medium | high | Boston BPP Captain Audrea Jones (later Audrea Dunham) is a documented historical figure; speaker's "Audrey" is a single-vowel slip on the canonical "Audrea". HIGH. |
| 1.P2.23 that Congressman / Harlem -> Adam Clayton Powell Jr. | medium | high | Catalog row C lists "Maddow Maddison / Adam Clayton Powell (renovated Radfelus) -> Adam Clayton Powell Jr." as canonical pattern (entry #34). Context (Harlem Congressman with Powell records in father's collection) is dispositive. HIGH. |
| 1.P2T.4 Leon Valentine Hobbes | speaker-originating | speaker-originating | Maintained — Black SPD officer not verifiable in external records; correct categorization. |
| 1.P2T.7 Conrad | speaker-originating | FLAGGED-FOR-ADVERSARIAL-REVIEW | Pass 2 tail-sweep itself flagged for review ("could be 'another Panther, Conrad' or 'another comrade'"). Adversarial review should resolve. |
| 1.P2T.12 Rumbabis Silver Mayor of Oakland -> Bobby Seale for Mayor | high | high | Confirmed: Bobby Seale's 1973 Oakland mayoral campaign is canonical fact; Elaine Brown's concurrent City Council bid is canonical. HIGH preserved. |
| 1.P2T.16 Bertha Alexander | medium | speaker-originating | Same resolution as 1.P2.16 above. |
| 1.P2T.31 Samson system panthers -> San Francisco panthers | medium | FLAGGED-FOR-ADVERSARIAL-REVIEW | Pass 2 tail itself notes "appears to be garbled"; cannot be confidently resolved. Flag. |
| 1.P2T.50 Shedderly / William Shedderly / Clark's corporation -> William Sherrill / Clorox Corp | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Pass 2 tail itself notes "unverified - possibly a Clorox Corp exec of the era." Maintained as flag for review. |
| 1.P2T.55 Marin Bridge -> Richmond-San Rafael Bridge / Golden Gate | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Cannot disambiguate between candidate bridges from transcript context. Flag. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 1.24 | Marston (Mao? Marx? Other?) | Whisper rendering doesn't cleanly map to either canonical leftist figure; context supports leftist-revolutionary referent but doesn't disambiguate. |
| 1.48 | L.U. too (third BPP leader in name-list) | Cannot identify third figure in "Elders Cleveland, David, L.U. too" leadership list. Possibly a phonetic noise artifact. |
| 1.P2T.7 | Conrad (BPP comrade or generic "comrade"?) | Single-word rendering, ambiguous between proper noun and common noun. |
| 1.P2T.31 | Samson system panthers | "Samson system" rendering doesn't phonetically map to any known SF/Oakland BPP organizational structure. |
| 1.P2T.50 | William Shedderly / Clark's corporation | "Clark's" -> Clorox is plausible (Oakland HQ) but "William Shedderly" -> William Sherrill is unverified; both ends of the correction need confirmation. |
| 1.P2T.55 | Marin Bridge identification | Two plausible candidate bridges (Richmond-San Rafael vs Golden Gate); transcript context insufficient to choose. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Eldridge Cleaver: BPP Minister of Information; 1968 Peace and Freedom Party presidential candidate; recurring Whisper-failure target across entries #1, #35, #42 (catalog row D). Strong corpus candidate given recurrence and Pass-1 + Pass-2 + tail-sweep all flag this same figure.
- David Hilliard: BPP Chief of Staff 1967-70; ran the party during Newton's incarceration; catalog row D (entry #42). Whisper consistently renders his surname as "here you" / "hear you" - corpus entry would help the LLM disambiguation step.
- H. Rap Brown (Hubert Gerold Brown / Jamil Al-Amin): SNCC chairman 1967-68 succeeding Carmichael; recurring Whisper failure ("H. Rat Brown").
- Elbert "Big Man" Howard: BPP founding member; deputy minister of information; editor of The Black Panther newspaper. Entry #35 in the corpus.
- Elaine Brown: BPP Chairperson 1974-77; "A Taste of Power" memoirist; 1973/75 Oakland City Council candidate. Catalog row D-adjacent (new in tail-sweep).
- Ericka Huggins: BPP New Haven chapter leader; 1970-71 New Haven Black Panther trials. Catalog row D (entry #35).
- Bobby Seale: BPP Co-founder; already in civil_rights_facts.json under "Black Panther Party" aliases but worth a standalone entry given his canonical centrality.
- Huey Newton: BPP Co-founder; already in civil_rights_facts.json under "Black Panther Party" aliases but worth standalone treatment.
- Wes Uhlman: Seattle Mayor 1969-78; famously blocked an ATF raid on the Seattle BPP office (1970); high-confidence civil-rights-era political figure recovered by tail-sweep.
- Alprentice "Bunchy" Carter: LA BPP leader; assassinated at UCLA Campbell Hall January 17, 1969.
- John Huggins: LA BPP leader; assassinated at UCLA Campbell Hall January 17, 1969 alongside Bunchy Carter (Ericka Huggins' husband).
- Fred Hampton: BPP Illinois Chairman; killed December 4, 1969 by FBI/Chicago PD raid. Canonical figure mentioned correctly in transcript (1.P2T.8).
- Geronimo Pratt (Elmer "Geronimo" Pratt / ji Jaga): LA BPP; later imprisoned 27 years on a frame-up overturned in 1997. Catalog row D.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 1.P3.1 | "Portchop Hill" / "Pork Chop Hill" (header reference) | Pork Chop Hill | high | canonical-alias | The header context describes the BPP stand-off with Seattle Police as the "'Portchop Hill' stand-off"; this is a speaker-originating reference to the 1953 Korean War battle "Pork Chop Hill" (and the 1959 Gregory Peck film). Pass 1/2 did not flag the spelling. |
| 1.P3.2 | "Bobby Seale catches up with me" (1.39) | Bobby Seale catches up with me | correct | n/a | Pass 1 marked as correct but Whisper does have a noun-form failure on "catches up" - flag is appropriate; no correction. Confirming Pass 1's categorization is sound. (No real catch; placeholder verification.) |
| 1.P3.3 | Stokeley spelling propagation | Stokely Carmichael (canonical) | high | civil_rights_facts.json canonical | The civil_rights_facts.json entry "Stokely Carmichael" lists no "Stokeley" alias. Pass 1/2 flagged 1.13 and 1.P2.18 as variants but did not explicitly cross-reference the corpus aliases list to confirm. Confirmed: corpus aliases include "Kwame Ture" and "Carmichael" but NOT "Stokeley" - so the "Stokeley" rendering is a Whisper error, not a documented speaker-variant. |
| 1.P3.4 | "Mama King / Mrs. Albert King" pattern not present in this transcript but Aaron's mother's name (Frances) absent from civil_rights_facts.json | n/a | n/a | n/a | Cross-reference note: Aaron Dixon's mother Frances Sledge Dixon is not a canonical figure; Pass 1's family-names class handling is correct. No catch. |

**Audit-complete marker**: Pass 3 complete on entry #1 as of 2026-05-22. Ready for adversarial-model review.
