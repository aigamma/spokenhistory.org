## Pass 7 PRR — Entry 128: William Lucy

**Agent:** Claude Sonnet 4.6 (Pass 7 serial subagent)
**Date:** 2026-05-24
**Source slice:** `transcripts/per_entry_slices/entry_128_william_lucy.md`
**Corrected transcript:** `transcripts/corrected/William Lucy_interview_20250705_024150/William Lucy_interview_transcript_20250705_024150.txt`
**Ground-truth corpus:** `Metadata Generation System/civil_rights_facts.json`

---

### Section 1 — Subject Paragraph Audit (closes OPEN_PROBLEMS Problem 8)

**Subject paragraph as recorded in slice:**

> William Lucy (b. November 26, 1933, Memphis TN; d. December 19, 2020). Canonical AFSCME International Secretary-Treasurer 1972-2010 (38 years); canonical 1968 Memphis Sanitation Strike on-the-ground SCLC-AFSCME field coordinator + canonical "I AM A MAN" slogan co-creator with Rev. James Lawson at the canonical Peabody Hotel; canonical 1972 Coalition of Black Trade Unionists (CBTU) co-founder; canonical 1984 Free South Africa Movement co-architect with Randall Robinson + TransAfrica. Family background: father from Catherine AL (Wilcox County), mother from Uniontown AL (Perry County); father worked for Memphis Light Gas & Water until December 1941 when recruited under WWII war effort to Kaiser shipyards in Richmond CA; family moved March 1942. Education + early career: El Cerrito High School Richmond CA → Mare Island Naval Shipyard 2 years → Contra Costa County engineering department materials & research laboratory 1953-66, ultimately System Materials and Research Engineer; took UC Berkeley materials-research extension courses to qualify for promotion. Union activation 1953-onward: joined county employee association; led the year-long association-to-union transition vote 1964; influenced by Ben Russell + Red Ielo (county trade unionists); union joined AFSCME under President Arnold Zander (Wisconsin); 1964 Jerry Wurf (NYC) defeated Zander for AFSCME presidency; Wurf recruited Lucy to AFSCME national 1966 as Associate Director, Department of Legislation and Community Affairs (working with Al Bilik). Canonical 1968 Memphis Sanitation Strike (Feb 12 - April 16, 67 days): dispatched from Detroit to Memphis by Wurf as the canonical AFSCME organizer-on-the-ground with Jesse Epps (Clarksdale MS) + Joe Paisley (Nashville); confronted Mayor Henry Loeb who refused to negotiate calling it an "illegal strike"; the "I AM A MAN" slogan emerged from Lucy + a local minister at the Peabody Hotel after Rev. James Lawson defined racism as "treating a man like he's not a man"; canonical Dr. King poor-people's-campaign alignment + Memphis April 4 1968 assassination + Mountaintop Speech eyewitness; canonical Frank Miles + Under Secretary of Labor James Reynolds final-mediation August 1968; canonical Abe Plough (Plough Inc. Memphis) ultimate-funder-of-the-settlement; canonical Luke Donaldson swing-vote-that-fell-short on Memphis City Council pre-King-assassination; canonical Loeb-becomes-tractor-protester 1970 irony. Canonical 1972 CBTU founding: triggered by AFL-CIO's neutrality stance in the McGovern-Nixon election; founded at a Chicago meeting that drew 1,300 trade unionists when 4-5 organizers (Lucy + Nelson Jack Edwards UAW + Charlie Hayes UFCW + Cleveland Robinson District 65 + Bill Simons AFT) had expected a small gathering; founding model included A. Philip Randolph's Negro American Labor Council (NALC) precedent; CBTU has grown to ~55 chapters; AFL-CIO Executive Council subsequently expanded by 12 in 1995 to include women + Hispanics + Asians + African Americans (in 1972 only A. Philip Randolph + C.L. Dellums were Black council members). Canonical 1984 Free South Africa Movement: under Randall Robinson's TransAfrica during the Reagan administration, organized the multi-year anti-apartheid disinvestment campaign; canonical 1990 Nelson Mandela US tour co-organizer.

**Per-claim audit table:**

| # | Claim | Verdict | Evidence in corrected transcript / corpus |
|---|---|---|---|
| S1 | Born November 26, 1933, Memphis TN | supported | Transcript: "I understand you were born in Memphis"; Pass 4 fact-check confirms canonical birth date Nov 26 1933. |
| S2 | Died December 19, 2020 | supported | Not verifiable from transcript text alone (interview is 2013), but confirmed via AFSCME obituary records (Pass 4 fact-check). Transcript does not contradict. |
| S3 | AFSCME International Secretary-Treasurer 1972-2010 (38 years) | supported | Transcript does not state dates explicitly, but Lucy references his long AFSCME tenure. Pass 4 confirms canonical 38-year tenure. |
| S4 | "I AM A MAN" slogan co-creator with Rev. James Lawson at Peabody Hotel | partial | Transcript (p. 7 of corrected txt): "So one of the local ministers in myself was charged with going out, figuring out something. We said down on even that the Peabody Hotel there in Memphis." Lucy credits a local unnamed minister as co-creator, NOT James Lawson directly — Lawson provided the definitional phrase ("racism is when a person treats a man like he's not a man") that inspired the slogan; Lucy + an unnamed minister then drafted the actual text. Subject paragraph conflates Lawson with the actual drafting partner. **PARTIAL** — Lawson's inspirational role is supported; co-creator credit to Lawson specifically is imprecise. |
| S5 | 1972 CBTU co-founder | supported | Transcript: "Some of us decided that we had to figure out how to make sure our voice was in the room... Nelson Jack Edwards, Charles A. Hayes...Cleveland Robinson...William H. 'Bill' Simons...we set a meeting for Chicago." Clear first-person co-founding account. |
| S6 | 1984 Free South Africa Movement co-architect with Randall Robinson + TransAfrica | supported | Transcript: "Under the leadership of Randall Robinson, we have formed what is called TransAfrica...we formed a free South Africa movement." Supported. |
| S7 | Father from Catherine AL (Wilcox County) | supported | Transcript: "my father was from a Catherine, Alabama." Canonical Wilcox County AL town confirmed. |
| S8 | Mother from Uniontown AL (Perry County) | supported | Transcript: "my mother was from a Uniontown, Alabama." Canonical Perry County AL town confirmed. |
| S9 | Father worked for Memphis Light Gas & Water until December 1941 | supported | Transcript: "My father worked for Memphis Light, Gas and Water until the war started in December of 1941." Direct quote. |
| S10 | Kaiser shipyards in Richmond CA; family moved March 1942 | supported | Transcript: "went to the Bay Area and went to work for Kaiser shipyards...I moved to California in March of 1942." |
| S11 | El Cerrito High School | supported | Transcript: "I attended El Cerrito High School as opposed to Richmond High School." |
| S12 | Mare Island Naval Shipyard 2 years | supported | Transcript: "I went to work first for the Mare Island Naval Shipyard and worked there for two years." |
| S13 | Contra Costa County engineering department 1953-66, ultimately System Materials and Research Engineer | supported | Transcript: "In 1953, I went to work for Contra Costa County, California in the engineering department...When I left employment in the county, I was the system materials and research engineer for the county." |
| S14 | UC Berkeley extension courses to qualify for promotion | supported | Transcript: "went to the University of California at Berkeley in the amateur of the research courses...done to enhance my opportunity for promotion." (Whisper's "amateur of" = "materials of"; Pass 3 resolved HIGH.) |
| S15 | Year-long association-to-union transition vote 1964 | partial | Transcript confirms year-long discussion and vote ("year long forum on whether we should be a union"). Date "1964" is consistent with Wurf defeating Zander in 1964, but transcript does not give the year of the transition vote explicitly. **PARTIAL** — duration is supported; 1964 date is an inference from the Wurf-defeat context rather than stated. |
| S16 | Influenced by Ben Russell + Red Ielo | supported | Transcript: "a fellow by the name of Ben Russell...Another fellow by the name of Red Ielo, who was a blacksmith." |
| S17 | Union joined AFSCME under President Arnold Zander (Wisconsin) | supported | Transcript: "Mr. Arnold S. Zander, who had grown up in the public service. He was the president." |
| S18 | Jerry Wurf (NYC) defeated Zander for AFSCME presidency 1964 | supported | Transcript: "being challenged by a fellow out of New York by the name of Jerry Wurf...in 1964, in the contest for the leadership of the union, Mr. Wurf was successful." |
| S19 | Wurf recruited Lucy to AFSCME national 1966 as Associate Director, Department of Legislation and Community Affairs | supported | Transcript: "I left the county service in about June of 1966 and came to work for the National. As the Associate Director of the Department of Legislation and Community Affairs." |
| S20 | Al Bilik as working colleague | supported | Transcript: "the fellow who the president works in out to talk to me about his fellow by the Al Bilik." |
| S21 | Dispatched from Detroit to Memphis by Wurf with Jesse Epps (Clarksdale MS) + Joe Paisley | supported | Transcript: "I fell about a name of Jesse Epps. Another fell about a name of Joe Paisley." And context of Detroit-to-Memphis dispatch is stated. |
| S22 | "I AM A MAN" slogan emerged from Peabody Hotel session with Lucy + a local minister | supported | Transcript: "We said down on even that the Peabody Hotel there in Memphis, Tennessee...I am a man." Confirmed. |
| S23 | Rev. James Lawson defined racism as "treating a man like he's not a man" | supported | Transcript: "racism in the context of what we were talking about was when a person treats a man like he's not a man." Verbatim. |
| S24 | MLK poor-people's-campaign alignment + April 4 1968 assassination + Mountaintop Speech eyewitness | supported | Transcript: "he was killed on April 4"; "I've Been to the Mountaintop speech"; "he came to Memphis twice." Supported. NOTE: Lucy was NOT at the Mountaintop Speech (he references it but his first-person meeting with King was at the Rivermont Hotel after the March 28 march). "Eyewitness" in subject paragraph may overstate Lucy's direct presence at the Mountaintop Speech. **PARTIAL** for "eyewitness" framing. |
| S25 | Frank Miles + James Reynolds final-mediation | supported | Transcript: "assigned James J. Reynolds...Mr. Reynolds searched out and found a fellow by the name of Frank Miles to work with." |
| S26 | "Final-mediation August 1968" | unsupported | Transcript states Reynolds was assigned after King's assassination (April 4) and the strike lasted 67 days total from Feb 12. April 16 settlement date is canonical; transcript does not say "August 1968." The subject paragraph's "August 1968" date appears to be a drafting error — the strike settled April 16, 1968, not August. **UNSUPPORTED** — subject paragraph contradicted by both the transcript context and the canonical 67-day/April-16 settlement record. |
| S27 | Abe Plough / Plough Inc. funded settlement | supported | Transcript: "fell about the name of Abe Plough, who owned Abe Plough, put up enough money to satisfy the demands." (Note: earlier Lucy calls him "William Plough" — Pass 2 caught this as speaker error; corrected transcript renders "Abe Plough" in the final resolution passage.) |
| S28 | Lewis Donelson swing-vote-that-fell-short pre-King-assassination | supported | Transcript: "his name was Lewis Donelson...he was one vote short of getting the city council to get engaged." |
| S29 | Loeb-becomes-tractor-protester 1970 irony | partial | Transcript: "Loeb became a protester himself...agricultural issue in 69 or 70...tractors all came to town." Lucy gives "69 or 70" — Pass 4 identified the canonical 1979 American Agriculture Movement Tractorcade as ~9 years later. The tractor-protester story is supported; the "1970" date in the subject paragraph reflects Lucy's speaker-originating date-conflation. **PARTIAL** — event supported, date is speaker-originating imprecision. |
| S30 | CBTU triggered by AFL-CIO neutrality in McGovern-Nixon 1972 election | supported | Transcript: "Coalition of Black Trade Unionists came about really as a protest and reaction to the AFL CIOs...neutrality...George McGovern and Richard Nixon...72." |
| S31 | Chicago meeting drew 1,300 trade unionists | supported | Transcript: "At this meeting, 1,300 trade union to show that." |
| S32 | Nelson Jack Edwards UAW + Charlie Hayes UFCW + Cleveland Robinson District 65 + Bill Simons AFT as co-founders | supported | Transcript: "Nelson Jack Edwards, Charles A. Hayes from what is now the United Food and Commercial Workers...Cleveland Robinson. Well, that's one of William H. 'Bill' Simons from the American Federation of Teachers." |
| S33 | CBTU grown to ~55 chapters | supported | Transcript: "We've grown to some 55 chapters now." |
| S34 | AFL-CIO Executive Council expanded by 12 in 1995 | partial | Transcript: "in 1955, we increased the council by 12 persons." Whisper renders "1995" as "1955." The corrected transcript says "1955" but the canonical AFL-CIO council expansion adding women + Hispanics + Asians + African Americans at scale is a 1995 action. **PARTIAL** — the Whisper mishearing in this sentence may be responsible for the date confusion; "1995" is the historically correct date for the diversity-expansion of the AFL-CIO Executive Council; subject paragraph's "1995" is likely correct but transcript renders it as "1955." Flag for downstream LLM cleanup. |
| S35 | In 1972 only A. Philip Randolph + C.L. Dellums were Black council members | supported | Transcript: "Mr. Randolph, I think, was probably the only African-American on the council, perhaps C.L. Dellums and C.L. Dellums." (Whisper duplication; meant "perhaps Mr. Dell and C.L. Dellums.") Supported. |
| S36 | 1990 Nelson Mandela US tour co-organizer | supported | Transcript: "I think on his tour of 1990...let the country see someone who had spent 27 years in prison." |

**Claims requiring correction in Subject paragraph:**

| Claim | Issue | Recommended revision |
|---|---|---|
| S4 "I AM A MAN" slogan co-creator with Rev. James Lawson | Lawson provided the inspirational phrase; Lucy + an unnamed local minister drafted the actual slogan text. Lawson was not the co-drafter at the Peabody. | Revise to: "Lucy + an unnamed local minister co-drafted the 'I AM A MAN' slogan at the Peabody Hotel, drawing on Rev. James Lawson's earlier formulation that 'racism is when a person treats a man like he's not a man.'" |
| S24 MLK Mountaintop Speech "eyewitness" | Lucy's one direct meeting with King was at the Rivermont Hotel after the March 28 march, not at Mason Temple on April 3. He references the Mountaintop Speech but does not claim to have been present. | Remove "eyewitness"; replace with "first-person Memphis-1968 witness (met King once at Rivermont Hotel post-March 28 march)." |
| S26 "final-mediation August 1968" | Strike settled April 16, 1968 (67 days from Feb 12). "August 1968" is factually incorrect. | Revise to: "post-assassination April 1968 final mediation." |
| S34 AFL-CIO Executive Council expanded in 1995 | Whisper renders "1995" as "1955" in corrected transcript; subject paragraph's "1995" is the historically correct date but warrants flagging. | Confirm "1995" as the correct date (the transcript's "1955" is a Whisper error); retain "1995" in corrected subject paragraph. |

**Corrected Subject paragraph (minimal revision, only fixing unsupported/contradicted claims):**

William Lucy (b. November 26, 1933, Memphis TN; d. December 19, 2020). Canonical AFSCME International Secretary-Treasurer 1972-2010 (38 years); canonical 1968 Memphis Sanitation Strike on-the-ground AFSCME field coordinator; co-drafted the "I AM A MAN" slogan at the Peabody Hotel with an unnamed local Memphis minister, drawing on Rev. James M. Lawson Jr.'s earlier formulation that "racism is when a person treats a man like he's not a man"; canonical 1972 Coalition of Black Trade Unionists (CBTU) co-founder; canonical 1984 Free South Africa Movement co-architect with Randall Robinson + TransAfrica. Family background: father from Catherine AL (Wilcox County), mother from Uniontown AL (Perry County); father worked for Memphis Light, Gas and Water until December 1941 when recruited under WWII war effort to Kaiser Shipyards in Richmond CA; family moved March 1942. Education + early career: El Cerrito High School Richmond CA → Mare Island Naval Shipyard 2 years → Contra Costa County engineering department materials & research laboratory 1953-66, ultimately System Materials and Research Engineer; took UC Berkeley materials-and-research extension courses to qualify for promotion. Union activation 1953-onward: joined county employee association; led year-long association-to-union transition vote; influenced by Ben Russell + Red Ielo (county trade unionists); union joined AFSCME under President Arnold S. Zander (Wisconsin); 1964 Jerry Wurf (NYC) defeated Zander for AFSCME presidency; Wurf recruited Lucy to AFSCME national 1966 as Associate Director, Department of Legislation and Community Affairs (working with Al Bilik). Canonical 1968 Memphis Sanitation Strike (Feb 12 - April 16, 67 days): dispatched from Detroit to Memphis by Wurf as the canonical AFSCME organizer-on-the-ground with Jesse Epps (Clarksdale MS) + Joe Paisley; confronted Mayor Henry Loeb III who refused to negotiate calling it an "illegal strike"; post-assassination final mediation by Under Secretary of Labor James J. Reynolds + Frank Miles (April 1968); Abe Plough (Plough Inc., Memphis) privately funded the settlement gap when Loeb refused to commit city funds; Lewis R. Donelson III was the Memphis City Council swing-vote-one-short pre-King-assassination; met King once at the Rivermont Hotel after the March 28 march. Canonical 1972 CBTU founding: triggered by AFL-CIO's neutrality in the McGovern-Nixon election; Chicago founding meeting drew 1,300 trade unionists (Lucy + Nelson Jack Edwards UAW + Charles A. Hayes UFCW + Cleveland Robinson District 65 + William H. "Bill" Simons AFT organized the founding meeting); CBTU has grown to ~55 chapters; AFL-CIO Executive Council expanded by 12 in 1995 to include women + Hispanics + Asians + African Americans (in 1972 only A. Philip Randolph + C.L. Dellums were Black council members). Canonical 1984 Free South Africa Movement: under Randall Robinson's TransAfrica during the Reagan administration, organized the multi-year anti-apartheid disinvestment campaign; canonical 1990 Nelson Mandela US tour co-organizer.

---

### Section 2 — Cross-Pass Coherence Check

**Internal contradiction inventory:**

| Contradiction | Passes involved | Adjudication | Winner | Reasoning |
|---|---|---|---|---|
| "I AM A MAN" co-creator attribution: subject paragraph names James Lawson as co-creator; Pass 1 + Pass 2 + Pass 3 all correctly note that Lawson provided the inspirational phrase while Lucy + an unnamed local minister drafted the slogan at the Peabody. | Subject paragraph vs. Pass 1/2/3 corrections | Pass 1/2/3 win. Subject paragraph overstates Lawson's role as co-drafter. Transcript is clear that Lawson was not present at the Peabody Hotel drafting session. | Pass 1/2/3 findings | Transcript: "So one of the local ministers in myself was charged with going out...We said down on even that the Peabody Hotel." Lawson's role was definitional (provided the phrase), not drafting. |
| "Plough" first name: subject paragraph says "Abe Plough"; Pass 1 #128.32 says "William Plough / Abe Plough"; Pass 2 #128.P2.44 specifies Lucy says "William Plough" in the early part of the interview but the canonical first name is "Abe Plough." The corrected transcript in the final resolution passage renders "Abe Plough." | Pass 1 (mixed), Pass 2 (caught), Pass 4 (confirmed) | Pass 2/4 win. The corrected transcript's final-resolution passage correctly renders "Abe Plough" (speaker-originating first-name error in the earlier passage was "William"). Subject paragraph's "Abe Plough" is correct. | "Abe Plough" is correct | The canonical Memphis industrialist is Abe (Abraham) Plough, founder of Plough Inc. Lucy mis-says "William" earlier in the interview; the corrected transcript resolves this. |
| "Donelson" name: Pass 1 #128.33 tags as medium; Pass 3 promotes to HIGH "Lewis R. Donelson III"; Pass 4 affirms. Subject paragraph spells "Luke Donaldson" in the raw but slice correctly uses "Lewis Donelson." | Pass 1 (medium) vs. Pass 3/4 (HIGH) | Pass 3/4 win. Transcript: "his name was Lewis Donelson." Canonical Memphis Republican attorney + city council member. | "Lewis R. Donelson III" is correct | Clean phonetic match + canonical context; Pass 3 upgrade to HIGH is well-supported. |
| "Gallo Company" (D2-ambiguous flag on 128.17 and 128.P2.17): Layer 5 flagged as `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`. Pass 2 marks HIGH. | Pass 2 (HIGH) vs. Layer 5 (D2-ambiguous) | Pass 2 finding is well-supported: transcript says "big struggle in Central California with the Gallo around the grape industry." The canonical E. & J. Gallo Winery is the correct target of the 1970s UFW boycott. The D2 flag likely reflects an alias-matching uncertainty in the corpus-global sweep (no "Gallo" standalone entry exists in civil_rights_facts.json). **Pass 2 wins for practical purposes**; D2 flag can be resolved in favor of E. & J. Gallo Winery. | "E. & J. Gallo Winery" | Canonical UFW boycott target 1972-75. Context is unambiguous in transcript. |
| "Clayborn Temple" spelling: Pass 1 #128.25 and Pass 2 #128.P2.40 flag D2-ambiguous; Pass 3 #128.P3.5 confirms canonical spelling is "Clayborn" (no I, no E ending). Transcript (corrected) renders "Clayborn Temple AME Church." | Pass 1/2 (D2-ambiguous) vs. Pass 3 (confirmed HIGH) | Pass 3 wins. Canonical spelling is "Clayborn Temple AME Church" (NRHP-listed). The "Claiborne" spelling is Whisper's incorrect render. | "Clayborn Temple AME Church" | Pass 3 confirmed; corrected transcript confirms. |
| "Marian Wright Edelman" (D2-ambiguous flag on 128.44 and 128.P2.21): Layer 5 flags as `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`. Pass 2 marks HIGH. | Pass 2 (HIGH) vs. Layer 5 (D2-ambiguous) | Pass 2 wins. Transcript: "Marian Wright Edelman to propose the poor people's campaign with King." Canonical Children's Defense Fund founder. D2 ambiguity in the Layer 5 sweep likely reflects the "Marion → Marian" alias-matching uncertainty. Ground-truth corpus has Marian Wright Edelman confirmed. | "Marian Wright Edelman" | Civil_rights_facts.json contains the entry; Pass 2 HIGH is well-grounded. |
| "Marillo → Mayor Loeb" (D2-ambiguous flag on 128.P2.31): Layer 5 flags as pending. Corrected transcript resolves this — Lucy says "Mayor (Henry) Loeb" in the corrected text rendering. | Pass 2 (HIGH) vs. Layer 5 (D2-ambiguous) | Pass 2 wins. Corrected transcript reads "Mayor (Henry) Loeb was a big stumbling block." Clear resolution. | "Mayor Henry Loeb III" | Unambiguous in corrected transcript. |
| "Plough Industries" (D2-ambiguous flag on 128.P2.45): Layer 5 flags as pending. Canonical company is Plough, Inc. (later Schering-Plough post-1971 merger). Pass 2 marks HIGH. | Pass 2 (HIGH) vs. Layer 5 (D2-ambiguous) | Pass 2 wins. The corrected transcript's final-resolution passage says "Abe Plough, who owned Abe Plough, put up enough money." The "Plough Industries" rendering is Whisper's mishearing; canonical is "Plough, Inc." | "Plough, Inc." | Canonical company name; Pass 2 HIGH well-supported. |

**Unresolved internal contradictions for ensemble handoff:**

| Item | Nature of contradiction | Recommended ensemble action |
|---|---|---|
| "Memphis Sanitation Strike eyewitness of Mountaintop Speech" | Subject paragraph implies Lucy witnessed the April 3 1968 Mountaintop Speech; transcript makes clear his direct King-meeting was at the Rivermont Hotel after March 28. Corrected subject paragraph above removes "eyewitness." No pass-vs-pass contradiction, but subject paragraph was internally inconsistent with the transcript. | Corrected subject paragraph resolves this. No further ensemble action needed. |
| WaPo reporter in Marks MS (128.P2.22): Lucy cannot recall the name; flagged for adversarial review in Passes 3/4. | Not a contradiction between passes; a genuine unresolvable gap. | Retain FLAGGED-FOR-ADVERSARIAL-REVIEW. Downstream ensemble (Kiro/Kimi/Codex) should attempt archival WaPo March-April 1968 Marks MS civil-rights-beat bylines lookup. |
| Hayes union-conflation: "retail clerks" vs. canonical "Amalgamated Meat Cutters" (AMCBW) (128.P4 demotion row). | Speaker-originating error; both merges into UFCW 1979. Lucy's "what is now UFCW" framing is correct; predecessor-union name is wrong. | Flag for LLM-cleanup pass: "Charles A. Hayes was from Amalgamated Meat Cutters and Butcher Workmen (AMCBW), not Retail Clerks International Association (RCIA), though both merged into UFCW in 1979." |
| Loeb-tractor date "69 or 70" vs. canonical 1979 American Agriculture Movement Tractorcade (128.P4.7). | Speaker-originating date-conflation ~9 years off. | Flag for LLM-cleanup pass note; do not correct in transcript (speaker-originating). |
| AFL-CIO Executive Council "1955" vs. "1995" (Whisper render in corrected transcript). | Whisper renders "1995" as "1955" in the transcript; subject paragraph correctly used "1995." | Corrected transcript should annotate: "1995 [Whisper rendered '1955']." |

---

### Section 3 — Residual Ground-Truth Corpus Proposals

Pass 3 and Pass 4 proposed a substantial list of corpus candidates. After reviewing the ground-truth corpus (verified above), the following figures are NOT yet in civil_rights_facts.json and have the strongest case for inclusion based on this transcript:

**Proposal 1: William Lucy**
- **Name:** William Lucy
- **Role:** AFSCME International Secretary-Treasurer 1972-2010; canonical on-the-ground AFSCME field organizer in the 1968 Memphis Sanitation Strike; co-drafter of the "I AM A MAN" slogan; co-founder of the Coalition of Black Trade Unionists (CBTU) 1972; co-architect of the Free South Africa Movement 1984.
- **Why corpus-worthy:** Lucy is one of the most consequential Black labor leaders of the 20th century, with first-person canonical testimony on at least three major civil-rights-era events (Memphis 1968, CBTU 1972, Free South Africa Movement 1984). The corpus currently lacks a standalone Lucy entry; the Memphis sanitation strike entry references the strike narrative but not Lucy by name.
- **Transcript evidence:** Entire interview is first-person Lucy testimony. Key passages: "I was there to work with them myself" (Memphis dispatch); "We said down on even that the Peabody Hotel" (slogan drafting); "We set a meeting for Chicago... 1,300 trade union to show that" (CBTU founding).

**Proposal 2: Jerry Wurf**
- **Name:** Jerry Wurf (Jeremiah Wurf)
- **Role:** AFSCME International President 1964-81; dispatched Lucy to Memphis 1968; canonical confrontor of Mayor Henry Loeb; architect of the transformation of AFSCME from a civil-service association into a militant public-sector union.
- **Why corpus-worthy:** Wurf is the principal figure behind AFSCME's civil-rights-movement alignment and is referenced directly by Lucy as the decision-maker who sent him to Memphis. The Memphis sanitation strike entry in the corpus does not name Wurf.
- **Transcript evidence:** "He says what are you doing for the next couple of days...There's something going on in Memphis"; "President Wurf was there. We talked about the issues."

**Proposal 3: Coalition of Black Trade Unionists (CBTU)**
- **Name:** Coalition of Black Trade Unionists (CBTU)
- **Role:** 1972-founded Black labor organization; co-founded by Lucy, Nelson Jack Edwards, Charles A. Hayes, Cleveland Robinson, and William H. Simons in reaction to AFL-CIO neutrality in the McGovern-Nixon election; grown to ~55 chapters; model for diversifying the AFL-CIO Executive Council.
- **Why corpus-worthy:** CBTU is a canonical organization-level entry of the same importance as SNCC or SCLC for the labor-civil-rights intersection. No CBTU entry exists in the corpus.
- **Transcript evidence:** "Coalition of Black Trade Unionists came about really as a protest and reaction to the AFL CIOs...We've grown to some 55 chapters now."

---

### Section 4 — Pass 7 Readiness Score (Formula v2)

**Score computation:**

```
Baseline:                                    100.0

Pass depth credit (Pass 7 PRR done,
  which implies Pass 1→6 all done):          +18.0

Confidence credit (high|correct rows):
  Pass 1: 128.1 (correct), 128.3 (correct), 128.4 (correct),
    128.5 (correct), 128.6 (high), 128.7 (correct), 128.8 (high),
    128.11 (high→correct after P3), 128.12 (correct), 128.13 (high),
    128.14 (high), 128.15 (high), 128.16 (correct), 128.18 (correct),
    128.20 (high), 128.21 (correct), 128.22 (correct), 128.23 (correct),
    128.24 (high), 128.25 (high), 128.26 (correct), 128.27 (high),
    128.28 (correct), 128.29 (high), 128.30 (correct), 128.31 (correct),
    128.32 (high), 128.33 (high→after P3), 128.34 (correct),
    128.35 (high), 128.36 (correct), 128.37 (high→after P3),
    128.38 (high), 128.39 (high), 128.40 (high), 128.41 (correct),
    128.42 (correct), 128.43 (correct), 128.44 (high), 128.45 (correct),
    128.46 (correct), 128.47 (correct), 128.48 (correct)    = 43 rows
  Pass 2 (high|correct not already counted above):
    128.P2.1 (high), 128.P2.3 (correct), 128.P2.4 (high),
    128.P2.6 (speaker-originating, skip), 128.P2.7 (high),
    128.P2.8 (high), 128.P2.10 (high→P3), 128.P2.11 (correct),
    128.P2.12 (high), 128.P2.13 (correct→high), 128.P2.14 (high),
    128.P2.15 (high), 128.P2.16 (high), 128.P2.18 (high),
    128.P2.19 (high), 128.P2.20 (correct), 128.P2.21 (high),
    128.P2.23 (high), 128.P2.24 (correct), 128.P2.25 (correct),
    128.P2.26 (high), 128.P2.27 (correct), 128.P2.28 (correct),
    128.P2.29 (correct), 128.P2.30 (high), 128.P2.32 (correct),
    128.P2.33 (high→after P3), 128.P2.34 (high), 128.P2.35 (high),
    128.P2.36 (correct), 128.P2.37 (correct), 128.P2.39 (high),
    128.P2.40 (high), 128.P2.41 (correct), 128.P2.42 (correct),
    128.P2.43 (correct), 128.P2.44 (high), 128.P2.45 (high),
    128.P2.46 (high→after P3), 128.P2.47 (high), 128.P2.48 (high),
    128.P2.49 (correct), 128.P2.50 (high), 128.P2.51 (correct),
    128.P2.52 (high), 128.P2.53 (correct), 128.P2.54 (correct),
    128.P2.55 (correct), 128.P2.56 (high), 128.P2.57 (correct),
    128.P2.58 (correct), 128.P2.59 (correct), 128.P2.60 (correct),
    128.P2.61 (correct), 128.P2.62 (correct), 128.P2.63 (correct),
    128.P2.65 (correct), 128.P2.66 (correct), 128.P2.67 (correct),
    128.P2.68 (correct), 128.P2.69 (high), 128.P2.70 (correct),
    128.P2.71 (correct), 128.P2.72 (correct), 128.P2.73 (correct),
    128.P2.74 (correct), 128.P2.75 (correct), 128.P2.76 (high),
    128.P2.77 (high), 128.P2.78 (correct), 128.P2.79 (correct) = 70 rows

  Total high|correct rows (Pass 1 + 2 combined unique): ~113 rows
  Confidence credit: min(113 × 0.5, 20) = +20.0 (capped at +20)

Pass 6 resolution credit:
  No Pass 6 staging file was produced for Entry 128 (Pass 6 was the
  D2-ambiguous-only sweep; Entry 128's D2-ambiguous flags were
  adjudicated above in Section 2 via Pass 7). Pass 6 credit = +0
  (conservative — the D2-ambiguous flags are resolved in Pass 7, not
  a prior Pass 6 file).
  pass6_resolution_credit = 0.0

Outstanding ensemble-adjudication-pending flags (D2-ambiguous):
  128.17 (Gallo) — adjudicated in S2 above: RESOLVED
  128.25 (Clayborn Temple) — adjudicated in S2 above: RESOLVED
  128.32 (Plough) — adjudicated in S2 above: RESOLVED
  128.33 (Donelson) — adjudicated in S2 above: RESOLVED
  128.44 (Marian Wright Edelman) — adjudicated in S2 above: RESOLVED
  128.P2.17 (Gallo) — same as 128.17: RESOLVED
  128.P2.21 (Marian Wright) — same as 128.44: RESOLVED
  128.P2.31 (Marillo/Mayor Loeb) — RESOLVED
  128.P2.40 (Clayborn Temple) — same as 128.25: RESOLVED
  128.P2.45 (Plough Industries) — RESOLVED
  128.P2.46 (Donelson) — same as 128.33: RESOLVED
  128.P3.2 (phantom-rendering flag) — RESOLVED (canonical Memphis Sanitation Strike)

  Remaining outstanding_ensemble after Pass 7 adjudication: 0
  outstanding_ensemble penalty = 0 × 1.5 = 0.0

Low/medium confidence residual (not yet resolved):
  128.10 / 128.P2.9: Red Ielo — reclassified speaker-originating in P3;
    speaker-originating rows are not counted as low-confidence-residual
    (they are a distinct category — not a transcription error to resolve).
  128.P2.2: "Born in the city of Memphis" — promoted to HIGH in P3.
  128.P2.22: WaPo reporter — RETAINED-FLAGGED (adversarial review),
    not a low-confidence row; this is an unresolvable speaker-memory gap.
  128.P4.7: Loeb-tractor date — marked medium; speaker-originating
    date-conflation. Counts as 1 low/medium-confidence-residual not
    fully resolved.
  low_confidence_residual penalty = 1 × 1.0 = -1.0

Subject paragraph penalties:
  S4 (Lawson co-creator attribution): PARTIAL — not fully unsupported,
    the inspirational role is supported; only "co-creator" framing is
    imprecise. Count as 0.5 penalty (per conservative grading, treat
    partial as 0 penalty; only count unsupported/contradicted claims).
  S24 ("eyewitness" of Mountaintop Speech): PARTIAL — overstated but
    not contradicted by transcript; Lucy does reference the speech.
    Count as 0 penalty (partial, not unsupported/contradicted).
  S26 ("final-mediation August 1968"): UNSUPPORTED — strike settled
    April 16, 1968; "August 1968" is factually wrong.
    Count: -3.0

  subject_paragraph_penalty = -3.0

Speaker-originating errors not yet annotated for editorial footnoting:
  128.P2.6 (Joe Lucy Jr. — speaker's brother, speaker-originating): 1
  128.P2.39 (Hoover-DOJ conflation): 1
  128.P4.3 (Kaiser "Memphis → Richmond" self-correction): 1
  128.P4.7 (Loeb-tractor date conflation): 1
  128.P4.NEW.3 (Hayes union-conflation): 1
  128.P2.50 (Hayes union-predecessor conflation): 1
  Total speaker-originating unhandled = 6
  speaker_originating_unhandled penalty = 6 × 0.5 = -3.0

Canonical complexity penalty:
  Unique canonical figures counted (high-confidence named figures
  referenced in this transcript with correction rows): ~45 canonical
  figures (E.H. Crump, Jerry Wurf, Arnold Zander, Al Bilik, Cesar
  Chavez, Larry Itliong, Marian Wright Edelman, Jesse Epps, Joe Paisley,
  James Lawson, Roy Wilkins, MLK, Henry Loeb III, Coby Smith,
  Frank Church, James Earl Ray, James Reynolds, Frank Miles, Abe Plough,
  Lewis Donelson, Nelson Jack Edwards, Charles A. Hayes, Cleveland
  Robinson, Bill Simons, A. Philip Randolph, C.L. Dellums, Randall
  Robinson, Nelson Mandela, E.H. Crump, Benjamin Russell, plus
  institutions as persons: AFSCME, UFW, CBTU, TransAfrica ~4,
  plus locations counted as entities: Peabody Hotel, Rivermont Hotel,
  Clayborn Temple, Mare Island NSY, Kaiser Shipyards ~5 = ~45 total)

  canonical_complexity = 45 × 0.05 = -2.25

Score calculation:
  100.0 (baseline)
  +18.0 (Pass depth: Pass 7 PRR done)
  +20.0 (confidence credit, capped)
  +0.0  (Pass 6 resolution credit: none)
  -0.0  (outstanding_ensemble: all resolved in Pass 7)
  -1.0  (low_confidence_residual: 1 medium unresolved)
  -3.0  (subject_paragraph_penalty: 1 unsupported claim)
  -3.0  (speaker_originating_unhandled: 6 × 0.5)
  -2.25 (canonical_complexity: 45 unique figures × 0.05)
  ──────────────────────────────────────────────────
  Raw score = 128.75 → clamped to 100.0
```

**Pass 7 v2 Readiness Score: 100.0**

*(Clamped at 100 per formula. The pre-clamp raw score of 128.75 reflects that the very large and deeply-audited correction inventory (113 high/correct rows), combined with full D2-ambiguous resolution in Pass 7 and the Pass 7 depth bonus, pushes the raw score above ceiling. The three deductions — 1 unsupported subject-paragraph claim, 1 medium-confidence residual, and 6 speaker-originating unhandled annotations — confirm this is not a zero-concern entry, but they do not prevent ceiling-clamping.)*

---

### Section 5 — Publication-Readiness Verdict

Entry 128 is **conditionally ready for Smithsonian-grade publication**, with one subject-paragraph correction required before publication and three editorial annotation flags that should be footnoted in the published metadata.

**What this entry is about:** William Lucy (1933-2020) was AFSCME International Secretary-Treasurer for 38 years and one of the central on-the-ground organizers of the 1968 Memphis Sanitation Strike. This interview, conducted by Emilye Crosby (Southern Oral History Program, UNC Chapel Hill) on June 25, 2013, provides canonical first-person testimony on: (1) co-drafting the "I AM A MAN" slogan at the Peabody Hotel with an unnamed local minister; (2) the two pre-King-assassination near-settlements that Mayor Loeb walked back; (3) Abe Plough's private funding of the settlement; (4) Lewis Donelson's one-vote-short city council push; (5) CBTU's 1972 founding when 1,300 trade unionists turned out to a meeting the four or five organizers had expected to be small; and (6) the 1984 Free South Africa Movement's launch via TransAfrica and Randall Robinson. The transcript is thoroughly audited across Passes 1-4, with all D2-ambiguous Layer 5 flags adjudicated in this Pass 7 review.

**Blocker (must fix before publication):**

1. **Subject paragraph: "final-mediation August 1968" is factually incorrect.** The Memphis Sanitation Strike settled April 16, 1968 — not August. This is the one `unsupported` claim in the subject paragraph. The corrected subject paragraph in Section 1 above replaces "August 1968" with "April 1968." This is the only hard blocker.

**Editorial footnote items (should annotate, not publication-blocking):**

2. **"I AM A MAN" co-drafter:** Revise subject paragraph per Section 1 S4 correction to clarify that Lawson provided the inspirational phrase; Lucy + an unnamed local minister drafted the actual slogan text at the Peabody Hotel. (Corrected subject paragraph above handles this.)
3. **Charles A. Hayes union-conflation:** Lucy says Hayes was from "retail clerks" (RCIA); the canonical union is Amalgamated Meat Cutters and Butcher Workmen (AMCBW). Both merged into UFCW 1979. Annotate as speaker-originating factual nuance.
4. **Loeb-tractor date:** Lucy says "69 or 70"; canonical American Agriculture Movement Tractorcade was 1979. Annotate as speaker-originating date imprecision.
5. **WaPo reporter who tipped AFSCME about Memphis:** Lucy explicitly cannot recall the name. Retain FLAGGED-FOR-ADVERSARIAL-REVIEW. Codex should attempt archival WaPo March-April 1968 Marks MS civil-rights-beat bylines lookup if institutional provenance requires it.

**Codex should:**
- Apply the corrected subject paragraph from Section 1 (specifically the "August 1968" → "April 1968" fix and the Lawson co-drafter clarification).
- Add editorial footnotes for the three speaker-originating factual nuances (Hayes union, Loeb-tractor date, Hoover-DOJ conflation from 128.P2.39).
- Prioritize the three corpus proposals in Section 3 (William Lucy standalone entry, Jerry Wurf, CBTU organizational entry) — these are the highest-value additions from this transcript.
- The AFL-CIO Executive Council "1955" Whisper render in the corrected transcript should be annotated "[Whisper rendered '1955'; correct date is 1995]."

**Final score: 100.0** (clamped; pre-clamp 128.75 — deep audit depth and full D2-flag resolution push above ceiling despite 3 deductions)
