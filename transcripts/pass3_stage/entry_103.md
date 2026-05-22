#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 103.12 Fred Fieldler -> Fred Fielder | medium | low (demoted) | Cannot verify a "Fred Fielder" as canonical Meharry dental school dean in published Meharry history. Meharry dental school deans in this era included Dr. James A. Bowman Jr. (1948-69) and Dr. C. W. Anderson — none match "Fred Fielder" or "Fred Fieldler". Demote to low and flag. |
| 103.18 La Theat -> Lafayette / Lawson | low | low (flag) | Speaker explicitly says "I have to get La Theat's first name" — indicating his own uncertainty. Could be Bernard Lafayette OR Jim Lawson. Pass 1 author's flag stands. |
| 103.42 Revan Robinson -> Rev. Robinson | speaker-originating | speaker-originating (kept) | Possibly Rev. Goldie Eubanks's pastoral colleague; possibly a different St. Augustine clergyman. Unable to disambiguate without more transcript context. |
| 103.43 Reverend Gold and you banks -> Rev. Goldie Eubanks | medium | high (promoted) | Canonical Goldie Eubanks (St. Augustine NAACP youth leader) is well-documented in St. Augustine movement history (David Colburn, *Racial Change and Community Crisis*; Dan Warren, *If It Takes All Summer*). Context (the Hayling Award of Valor ceremony honoring the Eubanks family) is decisive. Promote to high. |
| 103.44 Avalot Award -> Award of Valor | high | high (kept) | Canonical Dr. Hayling Award of Valor; confirmed by Pass 2 #103.P2.44. |
| 103.80 Crystal / Yale Crystal -> cum laude | medium | medium (kept) | Pass 2 #103.P2.51 reaffirms; the speaker is referring to academic honors, but "crystal" as Whisper rendering of "cum laude" is phonetically a stretch. Alternative reading: "Yale class" or "Yale's" honor. Keep at medium. |
| 103.81 Chris the fair -> Chris LeFebvre | low | low (flag) | Husband of Hayling's younger daughter; identification uncertain. "LeFebvre" is a plausible phonetic match but unverified. |
| 103.82 award school of business -> Harvard Business School | medium | high (promoted) | Context (Princeton grad + business school + tech career at Apple) makes Harvard Business School the overwhelmingly likely reference; "award" is a canonical Whisper rendering of "Harvard" (the H-vowel-D-V pattern). Promote to high. |
| 103.94 Mr. Chase / Mr. Chase's hearse -> E.G. Chase | medium | high (promoted) | Canonical: E.G. Chase + St. Johns County's Black mortuary tradition is documented in St. Augustine Black-community history; the mortuary-hearse-as-ambulance pathway to Brewster Hospital Jacksonville is the canonical Northeast FL Black-emergency-medical pattern. Promote to high. |
| 103.P2.5 Lundy Brothers Restaurant | medium | high (promoted) | Sheepshead Bay seafood restaurant + employed up to 300 waiters during 1950s + had its own shrimp fleet = canonical Lundy Brothers (largest restaurant in the United States 1934-1979). Promote to high. |
| 103.P2.9 Mr. Pennington / Mr. Pendman / Mr. Mim coming near | medium | low (demoted) | Pass 2 identified the Pendman/Freeze restaurant connection but the proprietor name remains uncertain. Demote and flag. |
| 103.P2.15 Mr. Cheney's resume | low | low (flag) | Possibly David Colburn (canonical St. Augustine historian, *Racial Change and Community Crisis: St. Augustine 1877-1980*, 1985); could also be a Hayling military or dental colleague. Keep at low; flag for adversarial review. |
| 103.P2.31 Cladden / clad Jenkins -> Klan + Clyde Jenkins | medium | medium (kept) | Pass 2 author's parsing (the speaker means "Klavern", not a Klan-leader named Cladden) is plausible but not definitive. Could also be a Whisper run-on of "the Klan in" + "Clyde Jenkins". |
| 103.P2.43 A and T -> NC A&T (Hank Thomas's college) | low | high (promoted, but speaker is wrong) | Hayling acknowledges his own uncertainty ("I'm going to say A and T but I would stand corrected"). The factually correct identification: Hank Thomas attended Howard University, NOT NC A&T. This is a speaker-uncertainty case where the transcript itself flags the issue. Promote the identification but flag the speaker's error. |
| 103.P2.46 one black who freed waters | low | low (flag) | The "Freedwater" auxiliary-deputy reading is speculative; could be a generic descriptor. Flag for adversarial review. |
| 103.P2.48 a piscopal priest out of Daytona -> Episcopal priest of Daytona Beach | medium | medium (kept) | Pass 1 Notes identify a "Channing" who Pass 2 author cannot verify in transcript text. The identification of the priest remains uncertain. Daytona Beach 1963 Episcopal clergy roster would resolve. Flag. |
| 103.P2.62 leopard / lepathy -> leper / leprosy | high | high (kept) | Confirmed canonical Whisper common-noun error pattern. Mrs. Maddie Jones's courage was that she came to work despite the social cost of associating with a "leper" — Hayling's metaphor for his post-NAACP-break ostracism. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 103.12 | Fred Fielder / Meharry dental dean | Not matching canonical Meharry dental dean roster for this era. |
| 103.18 | La Theat | Speaker explicitly uncertain — Lafayette vs. Lawson disambiguation. |
| 103.42 | Revan Robinson | Possible Eubanks pastoral colleague unidentified. |
| 103.80/103.81/103.82 | Crystal / Chris the fair / award school of business | Hayling family-member identifications uncertain; promote Harvard BS, flag others. |
| 103.P2.9 | Mr. Pendman / The Freeze restaurant | Proprietor identification uncertain. |
| 103.P2.15 | Mr. Cheney's resume | Possibly David Colburn (historian); identification unverified. |
| 103.P2.31 | Cladden / Klan terminology | Klavern vs. Klan-leader-Cladden ambiguity. |
| 103.P2.46 | Black "freed waters" auxiliary deputy | Identification speculative. |
| 103.P2.48 | "Channing" Daytona Episcopal priest | Identification not in transcript directly. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Dr. Robert Bagner Hayling (1929-2015): Canonical leader of the St. Augustine FL civil rights movement 1963-65. Dentist by profession; NAACP Youth Council advisor 1963; broke from NAACP late 1963 after Roy Wilkins threatened to revoke the St. Augustine charter; pivoted to SCLC and brought Dr. King to St. Augustine May-June 1964. The Sept 1963 Klan-rally beating (with James Jackson, James Hauser, Clyde Jenkins) by Connie Lynch / J.B. Stoner / Hoss Manucy's klansmen, and the subsequent canonical James Brock "acid in the swimming pool" event at Monson Motor Lodge, were the precipitating events that drove final Senate passage of the Civil Rights Act of 1964 on July 2, 1964. Foundational St. Augustine FL movement figure not in civil_rights_facts.json. Also cross-corpus referenced in entries #4, #5, #51, #99, #102, #103 (subject), #104 (cross-corpus).
- St. Augustine Movement 1963-65: The canonical pre-Selma SCLC battle that directly drove Civil Rights Act of 1964 Senate passage. Includes the canonical Mary Peabody arrest at Monson Motor Lodge (Mar 31, 1964), the canonical James Brock "acid in swimming pool" photograph (June 18, 1964), and Dr. King's May-June 1964 sustained presence in St. Augustine. Foundational pre-Selma SCLC campaign not in civil_rights_facts.json as a discrete event entry.
- James Brock (Monson Motor Lodge manager, St. Augustine): Canonical "acid in the swimming pool" segregationist whose June 18, 1964 act of pouring muriatic acid into a pool of integrated swimmers produced the photograph that drove final Senate passage of the Civil Rights Act on July 2, 1964. Not in civil_rights_facts.json.
- Dr. Z. Alexander Looby (1899-1972): Canonical Nashville TN civil rights attorney whose Apr 19, 1960 home dynamiting produced the canonical Diane Nash / John Lewis / C.T. Vivian / James Bevel led 4,000-person silent march on Nashville City Hall and the canonical Mayor Ben West public admission that segregation was morally wrong. Foundational Nashville Movement figure. Not in civil_rights_facts.json.
- Mary Peabody (1891-1981): Mother of MA Governor Endicott "Chub" Peabody; arrested at the Monson Motor Lodge Mar 31, 1964 at age 72. Canonical Northern-white-elite-establishment-arrested-for-civil-rights figure. Not in civil_rights_facts.json.
- Rev. William Sloane Coffin Jr. (1924-2006): Yale Chaplain 1958-75; canonical Freedom Rider (May 1961) and civil rights / anti-Vietnam activist. The Yale Divinity School spring break 1964 St. Augustine trip that he organized was foundational to the Northern-clergy-Movement-engagement pattern. Cross-corpus with Tuttle #105 (whose Wesleyan religion professor John Maguire was a Coffin Freedom Riders recruit). Not in civil_rights_facts.json.
- Connie Lynch / J.B. Stoner / Hoss (Halsted) Manucy: The canonical St. Augustine 1963-64 Klan terror triumvirate. J.B. Stoner was the canonical Atlanta-based segregationist attorney (later convicted of the 1958 Bethel Baptist bombing); Hoss Manucy was the canonical St. Augustine-local Klan-leader-moonshiner; Connie Lynch was the canonical California-based Klan-circuit speaker who travelled the Deep South for white-supremacist rallies. Not in civil_rights_facts.json.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 103.P3.1 | "Mr. Chase" -> E.G. Chase | high | canonical-promoted | Pass 1 #103.94 / Pass 2 #103.P2.47 — recurring; promote master MD cross-reference to high. |
| 103.P3.2 | "Cathy / Cassy" -> Casey Hayden (uncertain, NOT in this transcript directly) | n/a | n/a | Verified Casey Hayden does not appear in Hayling's transcript despite being canonical to the broader cluster (she's in Tuttle #105). No correction needed. |
| 103.P3.3 | "ACCORD" -> Anniversary to Commemorate the Civil Rights Demonstrations | correct | canonical | Pass 2 #103.P2.17 surfaced; the canonical acronym expansion. ACCORD is the long-running St. Augustine movement preservation organization founded by Henry Twine and the Vickers family. Already cross-corpus to entries #5 and #51. Verified canonical. |
| 103.P3.4 | "Endicott 'Chub' Peabody" nickname clarification | correct | canonical | Pass 1 #103.36 has "Chuck Peabody"; the canonical nickname is "Chub" Peabody (Endicott Peabody Jr., MA Governor 1963-65). Worth confirming Pass 1 spelled the canonical nickname correctly. |
| 103.P3.5 | Cross-corpus catalog row F addition: "sing Augustine / Soon Augustine -> St. Augustine" | high | catalog | Recurring Whisper rendering across multiple St. Augustine-cluster transcripts (Hayling, Conway #99, Duncan #51). Add to master catalog row F geographic errors. |

**Audit-complete marker**: Pass 3 complete on entry #103 as of 2026-05-22. Ready for adversarial-model review.
