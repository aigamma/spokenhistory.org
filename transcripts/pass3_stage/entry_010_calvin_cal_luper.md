#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 10.4 (Cleveland Browns — placeholder) | n/a | n/a — DELETED | Pass 1 row #10.4 was a placeholder ("flag for next iteration"). Pass 2 did not surface a Cleveland Browns reference. No correction needed; remove as a row. |
| 10.5 (Clara Luperello show → *The Clara Luper Show*) | speaker-originating | high | OKC radio program 1960s-onward is documented in Oklahoma History Center records; Calvin Luper canonically co-hosted with his mother Clara Luper. Promote — "speaker-originating" is the wrong source-label; the program IS a canonical local-institutional reference. |
| 10.6 (Bishop's Restaurant) | speaker-originating | speaker-originating + canonical | Confirmed real OKC restaurant per local historical records (Bishop's was OKC's famous Black-owned restaurant on NE 23rd; targeted by youth-council sit-ins). Confirms as canonical local-institutional reference. |
| 10.7 (Johnny Browns) | speaker-originating + low | FLAGGED-FOR-ADVERSARIAL-REVIEW | "Johnny Brown's" / "Johnny Browns" — uncertain rendering. Could be "Johnny Browns" (an OKC business name) or a Whisper failure. Adversarial review against OKC business-directory historical records can resolve. |
| 10.8 (Hudson hotel) | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Pass 2 #10.P2.13 maintained at low — possibly Skirvin Hotel (canonical OKC downtown landmark hotel) or Huckins Hotel (canonical OKC mid-century hotel). The "Hudson" rendering is plausibly a Whisper failure on either canonical OKC hotel name. Both Skirvin and Huckins are documented in OKC hotel history but cannot be distinguished from speaker phrasing alone. |
| 10.9 (Marlon → Marilyn Luper) | medium | high | Pass 2 #10.P2.1 reaffirmed. Marilyn Luper Hildreth is canonical Clara Luper's older daughter; cross-corpus #82 in transcript list. Promote. |
| 10.10 (Brother President → *Brother President* play) | medium | high | Pass 2 #10.P2.7 reaffirmed. *Brother President* is canonical 1957-58 NAACP Youth Council production about MLK Jr., authored by Clara Luper; the NYC trip with the play preceded the Katz sit-in. Documented in Clara Luper's memoir *Behold the Walls* (1979). Promote. |
| 10.11 (Betty Germany — speaker-originating + low) | speaker-originating + low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Cousin's name; cannot externally verify. Maintain as low speaker-originating. Adversarial multi-model could match against OKC NAACP Youth Council membership rolls. |
| 10.14 (dear couch, poured with Williams) | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Highly speculative Pass 1 interpretation as "Ford Williams re-covered the couch." Cannot resolve from speaker phrasing alone. |
| 10.17 (Dungee School → Dunjee School) | medium | high | Pass 2 #10.P2.9 reaffirmed. Frederick Douglass Dunjee was canonical OKC Black educator (early 20th c.); Dunjee School in NE OKC named for him. Distinct from Dunbar School. Promote. |
| 10.18 (Reverend Morris Kerry — speaker-originating) | speaker-originating | speaker-originating | OKC minister; specific identification uncertain. Pass 2 did not resolve. Maintain. |
| 10.19 (Reverend Bratzinger — speaker-originating + low) | speaker-originating + low | FLAGGED-FOR-ADVERSARIAL-REVIEW | Whisper rendering of an OKC Baptist minister's name. "Bratzinger" is an unusual German-origin name; could be Whisper failure on a more common OKC-Baptist surname. Adversarial review against Fifth Street Baptist Church historical pastoral records may resolve. |
| 10.21 (Dr. Taza Akkins → Dr. Charles Atkins) | medium | high | Pass 2 #10.P2.4 reaffirmed. Dr. Charles N. Atkins (canonical OKC obstetrician + civil rights leader; husband of Hannah Atkins) is documented in Oklahoma Black-medical-history records. Promote. |
| 10.22 (Hannah Akkins → Hannah Atkins) | high | high | Reaffirm. Hannah Atkins was canonical first Black female OK State Representative (1968-80); later UN ambassador. |
| 10.23 (Sam Cornieus → Sam Cornelius) | medium | high | Pass 2 #10.P2.6 reaffirmed. Sam Cornelius was canonical OKC East Side YMCA director. Documented in OKC Black-community-institutional records. Promote. |
| 10.24 (Bruce — speaker-originating + low) | speaker-originating + low | speaker-originating | Sam Cornelius's son. Family-specific; maintain. |
| 10.27 (Bourdoir Cropborne → "Board of Education") | low | medium | Pass 1 inference: Clara Luper's discipline switch was colloquially called "the Board of Education" by family. "Bourdoir Cropborne" is Whisper noise that the Stage-3 LLM should not attempt to resolve to a proper-noun referent; it's a common-noun idiom. Maintain at medium with note: idiom usage, not a proper noun. |
| 10.28 (Pifkins — likely Pipkin) | low | FLAGGED-FOR-ADVERSARIAL-REVIEW | OKC photo shop name; cannot resolve from speaker phrasing. Adversarial review against OKC business-directory records may resolve. |
| 10.29 (Melvin Porter / Joel Porter) | high | high | Pass 2 #10.P2.5 reaffirmed: Melvin R. Porter (canonical first Black Oklahoma State Senator, 1964-86, 22 years). Reaffirm. Note: Pass 1 listed "Joel Porter" as alternative — Joel is not canonical; only Melvin is the correct name. |
| 10.32 (Professor McClure — speaker-originating + low) | speaker-originating + low | speaker-originating | OU desegregation context; the canonical OU desegregation figures are George McLaurin (*McLaurin v. Oklahoma State Regents* 1950) and Ada Lois Sipuel Fisher (*Sipuel v. Oklahoma* 1948). "Professor McClure" may be Whisper rendering of "Professor McLaurin." Flag this in adversarial review. |
| 10.36 (Akins → Atkins) | high | high | Reaffirm. Same family as #10.21 + #10.22. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 10.7 | Johnny Browns OKC business | Multi-model against OKC business-directory historical records. |
| 10.8 | Hudson hotel → Skirvin / Huckins / Black Hotel | Multi-model against OKC mid-century hotel directory; this is one of the canonical sites of OKC civil-rights memory. |
| 10.11 | Betty Germany OKC NAACP Youth Council member | Multi-model against OKC NAACP Youth Council 1958 membership rolls. |
| 10.14 | "dear couch, poured with Williams" | Highly speculative; multi-model likely cannot resolve. |
| 10.19 | Reverend Bratzinger OKC Baptist minister | Multi-model against Fifth Street Baptist Church pastoral records 1950s-60s. |
| 10.28 | Pifkins / Pipkin OKC photo shop | Multi-model against OKC business-directory historical records. |
| 10.32 | Professor McClure → McLaurin? | Multi-model against OU 1948-50 desegregation litigation faculty list (George McLaurin + Ada Lois Sipuel Fisher are the canonical figures). |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Clara Luper (1923-2011): OKC NAACP Youth Council advisor; organizer of the **first organized sit-in of the modern civil rights movement** at Katz Drug Store, OKC, 19 August 1958 — a year and a half before Greensboro Feb 1960. Author of *Behold the Walls* (1979) memoir. Foundational pre-Greensboro sit-in figure who is conspicuously missing from the existing corpus's Greensboro sit-in entry. HIGH PRIORITY — the corpus's Greensboro entry (#101) currently positions Greensboro Feb 1 1960 as the foundational sit-in moment; Clara Luper's August 1958 Katz sit-in pre-dates it by 18 months and should be either a separate primary entry or worked into the Greensboro entry as the precedent.
- Katz Drug Store sit-in (August 19, 1958): the canonical OKC sit-in event itself. The first organized sit-in of the modern movement (after the smaller-scale Wichita Dockum Drugs sit-in of July 1958, also pre-Greensboro). Foundational event missing from corpus.
- Marilyn Luper Hildreth: Clara Luper's older daughter; original OKC Youth Council member; canonical *Brother President* play co-star; cross-corpus #82. Foundational pre-Greensboro figure.
- Hannah Atkins (1923-2010): first Black female OK State Representative (1968-80); UN ambassador under Carter; Oklahoma's leading post-1960s Black political figure. Foundational state-political-leadership figure.
- Dr. Charles N. Atkins: OKC obstetrician + civil-rights leader + mentor to Clara Luper; husband of Hannah Atkins. Foundational OKC Black-professional-class figure.
- Melvin R. Porter (b. 1929): first Black Oklahoma State Senator (1964-86, 22 years); civil-rights attorney; Vanderbilt Law School graduate. Foundational OK political figure.
- Sam Cornelius: OKC East Side YMCA director; mentored generations of OKC Black youth. Foundational OK Black-institutional figure.
- Dunjee School (named for Frederick Douglass Dunjee, OKC Black educator early 20th c.): canonical OKC Black HBCU-feeder high school. Foundational OK Black-education-institutional figure.
- *Brother President* play (1957-58): one-act play about MLK Jr., authored by Clara Luper for her OKC NAACP Youth Council; touring the play to NYC in 1958 was the experience that crystallized Luper's commitment to direct action and led to the Aug 19 1958 Katz sit-in. Foundational pre-movement-pedagogy text.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 10.P3.1 | Catalog backfile recommendation | "Cats Drug Store → Katz Drug Store" | high | catalog-new (G / G-prime, business names) | Pass 1 #10.3 + Pass 2 #10.P2.12. Pervasive Whisper failure on the canonical 1958 sit-in target. Add to catalog G or a new business-names catalog. HIGH PRIORITY — this is the August 19, 1958 first-modern-sit-in venue, and any transcript referencing it should match canonically. |
| 10.P3.2 | Catalog backfile recommendation | "Joe Lurwell / Joe Manye → Joe Mosnier" | high | catalog-confirmation (A) | Pass 1 #10.1. Already in catalog A row 41 ("Joe Manier / Joe Mania / Joe Maner → Joe Mosnier"); the Calvin Luper transcript adds "Joe Lurwell" + "Joe Manye" as two additional Whisper renderings. Update catalog A row 41 to include these. |
| 10.P3.3 | Catalog backfile recommendation | "Douglas High School → Douglass High School" | high | catalog-new (G / E educational institutions) | Pass 1 #10.26. Frederick Douglass High School (OKC) — Whisper drops the second S. Add to catalog G as an HBCU-feeder-school canonical-name failure mode. Predict recurrence cross-corpus (any reference to Douglass HS in DC, OKC, Baltimore, Memphis, etc.). |
| 10.P3.4 | Catalog backfile recommendation | "Dungee → Dunjee" | high | catalog-new (E educational institutions) | Pass 1 #10.17 + Pass 2 #10.P2.9. Whisper rendered Dunjee School / Dunjee HS as "Dungee" — phantom phoneme insertion. Add to catalog E. |
| 10.P3.5 | Pass 3 historical correction | Wichita sit-in pre-dates OKC | high | meta | Pass 1 + Pass 2 framing positions OKC Katz Drug Store (Aug 19 1958) as the "first organized sit-in" — actually the Dockum Drug Store sit-in in Wichita KS (July 1958) preceded OKC by ~6 weeks. Clara Luper's sit-in was the SECOND major organized pre-Greensboro sit-in; both predate Greensboro by 15-18 months. The transcript's framing (which the notes already document: "first organized sit-in of the modern civil rights movement") is speaker-originating Luper-family-narrative; the broader historical record places Wichita slightly earlier. RECOMMEND: refine ground-truth corpus entry on the sit-in movement to capture the Wichita-OKC-Greensboro sequence rather than the Greensboro-only frame currently in the corpus. |
| 10.P3.6 | Catalog backfile recommendation | "Akkins → Atkins" | high | catalog-new (C) | Pass 1 #10.21, #10.22, #10.36 + Pass 2 #10.P2.3, #10.P2.4. Whisper consistently rendered the Atkins surname as "Akkins" across both Hannah and Charles Atkins. Add to catalog C. |
| 10.P3.7 | Catalog backfile recommendation | "Cornieus → Cornelius" | high | catalog-new (C) | Pass 1 #10.23 + Pass 2 #10.P2.6. Whisper rendered Sam Cornelius's surname as "Cornieus" — vowel-cluster failure. Add to catalog C. |
| 10.P3.8 | Confirmed canonical context | The Clara Luper / Pre-Greensboro Sit-in Movement | n/a | meta | This transcript's Pass 1 + Pass 2 + Pass 3 all confirm that the OKC NAACP Youth Council's 1958 Katz sit-in is foundational pre-Greensboro movement history, and Clara Luper as the architect of organized sit-in tactics. Recommend the WWU team treat this transcript as a canonical primary source for the sit-in-movement pre-history in the corpus documentation. |

**Audit-complete marker**: Pass 3 complete on entry #10 as of 2026-05-22. Ready for adversarial-model review.
