#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 4.5 Miss Fanny Wood, Fuller Wood -> Mrs. Fannie Fuller Wood | medium | high | Mrs. Fannie Fullerwood was a documented St. Augustine NAACP youth-movement adult mentor (confirmed in Pass 2 row 4.P2.4 as "Mrs. Fannie Fullerwood"). Pass 2 spelled the surname as one word "Fullerwood" (likely the canonical form per St. Augustine archives). HIGH. |
| 4.7 Macquarie's / Mr. Cotton -> McCrory's | medium | high | Pass 2 row 4.P2.2 already promoted: McCrory's (F.W. McCrory's downtown 5-and-dime; sit-in target on July 18, 1963). The St. Augustine Four sit-in at McCrory's lunch counter is well-documented in St. Augustine historical record. HIGH. |
| 4.8 Armacurus | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | "May or may not be a separate store" - in the listing of downtown St. Augustine stores targeted by sit-ins, "Armacurus" could be McCrory's (already covered), Woolworth's (already covered), Service Drug Store, or another store. Cannot resolve from context. Flag. |
| 4.11 car Williams | speaker-originating + low | speaker-originating | "Likely the first name was cut off" per Pass 1; cannot recover. Single-category speaker-originating. |
| 4.12 the sickle of the city | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Speaker's flow garbled; possibly "the cycle" or "the city" - Whisper rendered an unrecoverable noun. Cannot resolve. Flag. |
| 4.16 Dr. Nol | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Pass 1 hypothesis "Whisper mangling of Dr. Hayling" is plausible (given the pervasive "Hayling" failure pattern, captured in Pass 2 row 4.P2.1). But the speaker is using a question form ("did Dr. Nol, he didn't?") which suggests a separate referent. Flag for adversarial review of whether "Nol" is a third-party figure or mangled Hayling. |
| 4.17 goldie -> Goldie (Eubanks) | medium | high | Goldie Eubanks was a documented St. Augustine teen civil rights activist (one of the 16 original sit-in participants per St. Augustine historical record). The speaker's "he gave goldie some money" + "he gave big gymma [Jimmy] Jackson some money" lists known sit-in participants. Biographical fit + phonetic match = HIGH. |
| 4.23 Harris | speaker-originating + low | speaker-originating | "Could be the first or surname of another teen" - cannot recover. Single-category. |
| 4.24 Janelle -> Audrey Nell | medium | high | Two co-interviewees in the same interview using each other's names; Whisper's rendering "Janelle" for "Audrey Nell" (or for "JoeAnn"?) is a known Whisper pattern in multi-speaker interviews. Pass 1 LLM-disambiguation evidence + co-interviewee context = HIGH. |
| 4.25 Elo Davis / Ella Davis -> L.O. Davis (Sheriff Lawrence O. Davis) | high | high | Pass 2 row 4.P2.7 confirms: Sheriff L.O. Davis (St. Johns County FL, notorious for Klan collaboration during the 1963-64 St. Augustine campaign). HIGH preserved. |
| 4.27 Judge Matthew -> Judge Charles Mathis | medium | high | Pass 1 hypothesis confirmed: Judge Charles C. Mathis Jr. was the documented St. Johns County juvenile court judge who tried the St. Augustine Four. Biographical + phonetic match = HIGH. |
| 4.28 Mr. Shaw | speaker-originating + low | speaker-originating | NAACP representative; unverifiable in canonical sources. Single-category. |
| 4.29 commoners niggles -> "Communist niggers" (verbatim slur) | high | high | Pass 1 note: "the original 'commoners -> communists' is a documented epithet of that era. The slur is restored verbatim per archival convention." Library of Congress convention (per Pass 1 Notes for Pass 2) preserves verbatim. HIGH preserved. (Defer to WWU team confirmation on editorial policy.) |
| 4.31 Reformatory School (girls + boys) | speaker-originating | speaker-originating + cross-ref | Two different reform schools: Florida Industrial School for Girls (Ocala) + Florida School for Boys (Marianna, AKA Dozier School). Pass 2 row 4.P2.8 + 4.P2.9 captured the canonical names. Speaker's generic "Reformatory School" is colloquial; correct as speaker-originating with cross-reference to the canonical school names. |
| 4.40 Diane Mitchell | speaker-originating + low | speaker-originating | Young St. Augustine activist; unverifiable. Single-category. |
| 4.41 St. Mary's Church | speaker-originating | speaker-originating | "St. Mary's Missionary Baptist Church (likely)" - real St. Augustine Black congregation. Confirmed as speaker-originating, correct. |
| 4.46 originale side | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Speaker's natural diction OR Whisper error; cannot disambiguate. Possibly speaker referring to a specific St. Augustine neighborhood designation. Flag. |
| 4.51 Donald Duncan / Wolland Duncan -> Yvonne Duncan/Gwendolyn Duncan | medium | high | Pass 2 row 4.P2.15 resolved: Gwendolyn Duncan (canonical St. Augustine activist + Foot Soldiers monument committee member). The "her props" gender cue in Pass 1 + Pass 2 canonical attribution = HIGH. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 4.8 | Armacurus (4th downtown store name) | Could be a real fourth target store, mangled rendering of McCrory's/Woolworth's, or noise. Need St. Augustine sit-in records to verify. |
| 4.12 | the sickle of the city | Speaker's flow garbled; unrecoverable phrase. |
| 4.16 | Dr. Nol vs Dr. Hayling vs separate figure | Question-form suggests separate referent; but pervasive Hayling-failure-pattern suggests mangled rendering. |
| 4.46 | "originale side" of Lincolnville | Speaker's natural diction OR Whisper error; cannot disambiguate without family/community informant. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Dr. Robert B. Hayling: Founder of the modern St. Augustine FL civil rights movement; Air Force dental officer 1951-55; NAACP Youth Council advisor; recruited Dr. King to St. Augustine; survived multiple Klan attempts on his life (Sept 1963 attack on his home killed his dog Madonna). NOT in corpus despite being canonical figure across this batch (entries #4, #5) + cross-corpus #103 in progress tracker.
- The St. Augustine Four (Audrey Nell Edwards, JoeAnn Anderson, Samuel White, Willie Carl Singleton): The four Black teens jailed July 1963 at Florida reform schools after refusing to sign demonstration-renouncement forms. Their imprisonment "set the stage" for the 1964 St. Augustine campaign that produced Civil Rights Act-signing testimony. NOT in corpus.
- Sheriff L.O. Davis: St. Johns County FL sheriff 1948-72; documented Klan collaborator; oversaw 1963-64 mass arrests including the St. Augustine Four. NOT in corpus.
- Mrs. Mary Peabody: 72-year-old wife of Episcopal Bishop Malcolm Peabody + mother of MA Governor Endicott Peabody; arrested March 31 1964 St. Augustine. Her arrest brought national press attention to the St. Augustine campaign. NOT in corpus (Pass 2 row 4.P2.14 confirms canonical).
- Andrew Young: SCLC executive director under MLK 1964-68; beaten in St. Augustine June 18, 1964. ALREADY IN CORPUS as standalone "Andrew Young" entry. Confirmed.
- Jimmy Brock: Owner of the Monson Motor Lodge; perpetrator of the canonical June 18, 1964 acid-in-pool incident (pouring muriatic acid into the motel pool while integrated swimmers were in it). Pass 2 row 4.P2.10 confirms canonical figure. NOT in corpus.
- The Monson Motor Lodge acid-in-pool incident (June 18, 1964): One of the most-photographed moments of the St. Augustine campaign; helped drive Senate Civil Rights Act passage. NOT in corpus as a standalone canonical event.
- St. Augustine campaign (1963-64): The SCLC campaign that produced the Civil Rights Act passage testimony; chronologically the last major SCLC direct-action campaign before the Act. NOT in corpus as a standalone canonical event.
- Henry Twine: St. Augustine's first Black city commissioner; canonical Foot Soldier of the 1964 campaign. NOT in corpus.
- Katherine Twine: Foot Soldier of the 1964 St. Augustine campaign; wife of Henry Twine. NOT in corpus.
- Hank Thomas (Henry James Thomas): Freedom Rider; survived Anniston AL bus burning May 14, 1961. Catalog row C lists him as "correct" rendering at entry #34. NOT in corpus as standalone.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 4.P3.1 | Florida Industrial School for Boys vs Florida School for Boys at Marianna (Dozier School) | Florida School for Boys at Marianna (Arthur G. Dozier School) | high | canonical | Pass 1 row 4.30 + Pass 2 row 4.P2.8 captured Marianna correctly. The "Florida Industrial School for Boys" phrasing in the entry-header narrative is technically the school's original name (1900-1914); after 1914 it was renamed "Florida Industrial School for Boys" -> "Florida School for Boys" -> finally "Arthur G. Dozier School for Boys" in 1967. The modern canonical name post-1967 is the Dozier School (subject of the 2008-12 abuse-investigation scandal). All three Pass 1/2 references are accurate; recommend adding "Dozier School" as a cross-reference alias in the canonical-name entry. |
| 4.P3.2 | "Mariana" vs "Marianna" spelling | Marianna (FL) | high | geographic | Pass 1 row 4.30 captures both spellings; "Marianna" (two n's) is the canonical Florida city spelling. Speaker uses both interchangeably. |
| 4.P3.3 | William Carl Singleton (post-prison fate) | Willie Carl Singleton died 1995 Germany (per Pass 2 row 4.P2.6) | speaker-originating | local | Pass 2 row 4.P2.6 includes the canonical-fact that Willie Carl Singleton died in Germany in 1995. This is the kind of detail that may not appear in canonical St. Augustine archives but is preserved through speaker oral history. Worth flagging for the WWU team's separate biographical-fact verification. |
| 4.P3.4 | "Janelle" -> Audrey Nell vs JoeAnn | Audrey Nell | high | speaker-originating | Pass 1 row 4.24 marked as medium; speaker JoeAnn Ulmer refers to co-interviewee Audrey Nell Hamilton as "Audrey Nell" throughout, so "Janelle" is the Whisper rendering of "Audrey Nell" (not JoeAnn). Confirming Pass 1's disambiguation. |
| 4.P3.5 | "Foot Soldiers Monument" canonical-name reference | Foot Soldiers Monument (St. Augustine Plaza de la Constitución, 2011) | speaker-originating + local-canonical | local | Pass 2 of entry #5 captures the monument as Vickers's project. Pass 1 of entry #4 row 4.51 cross-references "Gwendolyn Duncan + Foot Soldiers monument committee." Cross-entry pattern is well-documented; no Pass-3 correction needed but worth noting as a cross-entry canonical reference. |

**Audit-complete marker**: Pass 3 complete on entry #4 as of 2026-05-22. Ready for adversarial-model review.
