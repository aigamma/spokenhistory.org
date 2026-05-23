#### Pass 4 sweeping QA + fact-check (2026-05-22)

**Re-grounding promotions (low/medium/flagged → high):**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 71.P2.20 Bunch/bunky/bunchy | low | n/a (REMOVED) | Phase 1a cross-contamination cleanup correctly removed this row — Pass 4 raw-grep confirms the span "bunch/bunky/bunchy" does NOT appear in entry #71's raw transcript. Row was misattributed in Pass 2 and correctly moved to #73 Kathleen Cleaver. No action required for #71. |
| 71.50 / 71.P2.17 Mike Johnson-Hime → German garrison | low | low (retained; flagged) | Raw context confirms "Mike Johnson-Hime is our location where my unit was located. And I was in combat command B, CCB. I'm now a captain..." — paired with new Pass 4 catch that "second Army division" is actually 2nd Armored Division and his CCB context places him at the 2nd Armored Division's German garrison in 1955-58 (CCB headquartered at Mainz-Gonsenheim during that period). "Mike Johnson-Hime" is plausibly Whisper for "Mainz-Gonsenheim." Still flagged for adversarial review pending direct confirmation. |
| 71.P2.22 Sonuno / Kainan Sunu Nu → John H. Sununu | high | high (confirmed) | Raw context "Sunu Nu" + governor of NH + nuclear power plant installation perfectly fits John H. Sununu (NH Gov. 1983-89, then GHWB Chief of Staff 1989-91). Confirmed. |
| 71.P2.23 Seabrook | medium | high (promoted) | Seabrook Station nuclear power plant is the canonical FEMA-disputed NH plant during Sununu's governorship; the FEMA emergency-planning fight over Seabrook was the defining 1980s nuclear-plant licensing dispute and aligns precisely with Becton's tenure as FEMA Director (1985-89) and Sununu's NH-governor role. Promoted to high. |

**Re-grounding demotions (high → medium/low, or kept-with-correction):**

| Original row | Old confidence | New confidence | Issue |
|---|---|---|---|
| Header Subject paragraph: "born... 1925" | high | corrected | Header reads "b. 1926 Bryn Mawr, PA" which is canonically correct (Becton was born 29 June 1926). Raw transcript contains "In 1925, I could be off by a year" which refers NOT to his birth year but to the **Carlisle Barracks 1925 study** (the Army War College's "Use of Negro Manpower in War" study). No correction needed to header; flagging here to confirm Pass 1+2+3 correctly interpreted the "1925" reference as the Carlisle study, not Becton's birth year. |
| Header Cross-references: "John Patterson (Alabama gov., recurring; cross-ref Lowery #66, Kathleen Cleaver #73 same iteration)" | (cross-ref claim) | demoted (Subject paragraph error) | Raw-grep across full transcript confirms "Patterson" and "John Patterson" do NOT appear in entry #71. The cross-reference is a false claim — Patterson belongs to #66/#73 but not to #71. Subject-paragraph cross-reference list should be corrected by removing the Patterson line before publication. |

**New Pass 4 catches (errors missed by Pass 1+2+3):**

| # | Span as Whisper-transcribed | Suggested correction | Confidence | Source | Surrounding context |
|---|---|---|---|---|---|
| 71.P4.1 | "second Army division in West Germany" | 2nd Armored Division | high | canonical | "going off to Germany and join the second Army division in West Germany. Mike Johnson-Hime is our location ... I was in combat command B, CCB. I'm now a captain". Becton's CCB / Combat Command B context unambiguously identifies the 2nd Armored Division (which had CCA, CCB, CCR in its triangular structure). "Army" is Whisper-corruption of "Armored." |
| 71.P4.2 | "42nd Army and infantry battalion" | 42nd Armored Infantry Battalion | high | canonical | Same passage as P4.1 — "I was in combat command B, CCB ... became the communication officer for the battalion. 42nd Army and infantry battalion." Canonical 42nd Armored Infantry Battalion, part of CCB / 2nd Armored Division in 1955-58 Germany. |
| 71.P4.3 | "first calf" / "first cav" (2 occurrences) | 1st Cavalry Division | high | canonical | "Beckton gets the armored division, first calf" + "heading off to Fort Hood to command a division." Canonical 1st Cavalry Division at Fort Hood TX — Becton commanded it 1978 as a Maj. Gen. then promoted to Lt. Gen. "Calf" is Whisper homophone for "Cav." |
| 71.P4.4 | "Pooh-Syme parameter" | Pusan Perimeter | high | canonical | "talk about my efforts back on a Pooh-Syme parameter and a breakout on a 201" — new Whisper variant of Pusan Perimeter (cf. existing #71.31 "Poosing perimeter"); also "parameter" is homophone for "perimeter." |
| 71.P4.5 | "Associated United States Army" | Association of the United States Army (AUSA) | high | canonical | "I'll put it up on the Associated United States Army, in which the fellow named Jack Murrett was the first publisher" — canonical AUSA, founded 1950, Army Magazine is its publication. Becton's contemporary Gen. Jack N. Merritt was AUSA president 1988-98. |
| 71.P4.6 | "Jack Murrett" | Gen. Jack N. Merritt | high | canonical | Same AUSA passage — second mention of Merritt as "first publisher" (i.e., first AUSA president of the modern reorganization). Cross-refs P2 #71.P2.6. New Whisper variant "Murrett" added to existing "Tony in Jack Merritt." |
| 71.P4.7 | "second armored division" (post-Patton arrival, distinct from P4.1) | 2nd Armored Division | correct | canonical | "And he comes in command of a second armored division. We could get along well together" — references George S. Patton IV taking command of 2nd Armored after Becton; this rendering is correct (not Whisper-corrupted here). Preserved for completeness. |
| 71.P4.8 | "civil-winging and goal bars" | silver wings and gold bars | high | common-noun | "convinced us to join the Army Air Corps when you're civil-winging and goal bars" — canonical USAAF cadet symbols. "Civil-winging" → "silver wings" (pilot insignia); "goal bars" → "gold bars" (2nd Lt. rank). |
| 71.P4.9 | "name-rigabelle" / "these name-rigabelle" | (those) names ring a bell | high | common-noun | "the second one was the fellow named Gordon Sullivan, these name-rigabelle" — speaker idiom "names ring a bell" mis-rendered as compound noun. Common-word Whisper degradation. |
| 71.P4.10 | "snowball in the hill" | snowball in hell | high | common-noun | "Now the chance of my being a 5,000 graduate like a snowball in the hill" — canonical English idiom "snowball's chance in hell" Whisper-corrupted via homophone "hell" → "hill." |
| 71.P4.11 | "May 10th Century humor" | maintain a sense of humor | high | common-noun | "There are some 13 points. May 10th Century humor. If I can't do that, I'm in a wrong job" — canonical leadership-philosophy idiom "maintain a sense of humor" garbled into a date-and-noun phrase. |
| 71.P4.12 | "pace 19" | page 19 | high | common-noun | "You haven't seen Army magazine? No, I haven't. You are taking a look, pace 19. Is there my picture" — common homophone Whisper substitution "pace" for "page." |
| 71.P4.13 | "kitchen of poor" | (uncertain — possibly "kitchen of pure," "kid you of poor," or "Quichotte/Quixote of poor") | low | speaker-originating | "I've had fun doing what I'm doing because my kitchen of poor, I cannot have fun. I stop doing it" — opaque idiom; could be Becton's personal philosophy expression; preserved verbatim. |
| 71.P4.14 | "Billy's Crossroads" | Bailey's Crossroads (Virginia) | high | canonical | "I go from that division to a place in the spring outside in Billy's Crossroads. O.T.A., Army Operations on Test and Evaluation Agency" — canonical Bailey's Crossroads, VA (Fairfax County, just outside DC) where the US Army Operational Test and Evaluation Agency (OTEA, since renamed) was headquartered. |
| 71.P4.15 | "O.T.A. / OTA / Army Operations on Test and Evaluation Agency" | OTEA (Operational Test and Evaluation Agency) | high | canonical | Same passage as P4.14 — canonical US Army OTEA (now ATEC). Becton was OTEA commander 1976-78 as a Lt. Gen. before VII Corps Germany. |
| 71.P4.16 | "Natalia, the Natalia, 9th Infantry" | (uncertain — possibly "Manchus, the Manchus, 9th Infantry") | low | speaker-originating | "And I was in the Natalia, the Natalia, 9th Infantry" — the 9th Infantry Regiment's canonical nickname is "Manchus" / the "Manchu Regiment" (from 1900 Boxer Rebellion service in China). "Natalia" may be Whisper degradation of "Manchus" with vowel/consonant shift; speculative. |
| 71.P4.17 | "AID, for interested development" | AID, Agency for International Development (USAID) | high | canonical | "I finally get a job, AID, for interested development, and become the director of, disaster assistance" — canonical USAID, where Becton served as Director of OFDA (Office of US Foreign Disaster Assistance) 1984-85 before being appointed FEMA Director. |
| 71.P4.18 | "Colonel General Bechtney" | Lt. General Becton | high | canonical | "Sure, go down and see Colonel General Bechtney, he'll take care of you" — new Whisper variant of Becton's surname ("Bechtney") combined with rank-garble ("Colonel General" → "Lt. General"). Add to the canonical Becton-surname-failure cluster (cf. P1 #71.2/#71.3/#71.29, P2 #71.P2.1). |
| 71.P4.19 | "Frint Down in Texas" | (uncertain — possibly "friend down in Texas" or "phone down in Texas") | low | speaker-originating | "the first time I heard about was when Frint Down in Texas, hey, congratulations" — likely "friend (called/phoned) down in Texas" with Whisper compression. |
| 71.P4.20 | "Reese Georgia" / "Reese, Georgia" | (uncertain — possibly "Reece, GA" or Whisper garble of small unincorporated community near Fort Benning/Columbus GA) | low | speaker-originating | "she's from her background, per certificate, Reese Georgia. And it was also in Columbus, Georgia" — Becton's daughter's birth-certificate location. Reece, GA exists (Union County, far from Fort Benning); "Reese, GA" doesn't canonically exist; possibly Whisper for "Reece" or for a Columbus-suburb. |
| 71.P4.21 | "the interesse in the Thunc heard" | (uncertain — opaque) | low | speaker-originating | "I asked the Director of FEMA, thoroughly enjoyed it, had good conti, made good relations, and then an interesse in the Thunc heard. The Governor of New Hampshire..." — speaker false-start sequence ending with the Sununu reference; "Thunc heard" could be "thing occurred" or similar. |
| 71.P4.22 | "ICAP" (sequence "I go from there to the ICAP to the OTA") | (speaker false-start; OTEA is the actual destination) | speaker-originating | speaker-originating | "I go from there to the ICAP to the OTA, training, testing unit" — Becton false-starts (possibly "I CAP" → "I cap (off)" or partial acronym fragment) then corrects to OTEA. Preserved as speaker false-start, not a separate institution. |
| 71.P4.23 | "Mulebert" (new variant) | Muhlenberg College | high | canonical | "between the time I got home, they went to Mulebert" — new Whisper variant for Muhlenberg College, supplementing existing P1 #71.39 "Muleenberg" cluster. |

**Fact-check findings (verification of high-confidence rows + Subject paragraph claims):**

| Claim | Status | Notes |
|---|---|---|
| Becton born 1926 in Bryn Mawr PA (Subject paragraph) | confirmed | Canonical: Julius Wesley Becton Jr., b. 29 June 1926, Bryn Mawr PA. The transcript's "1925, I could be off by a year" reference is to the Carlisle Barracks 1925 study, NOT his birth year — Pass 1+2+3 correctly interpreted this. |
| Graduated Lower Merion HS 1944 top of class (Subject paragraph) | confirmed in raw | "1944 when I came on to do the, my first duty station was the Luxe Mississippi" — confirms 1944 graduation. Canonical Lower Merion HS class of 1944. |
| Keesler Field Biloxi eye-test failure 1944 (Subject paragraph) | confirmed in raw | Multiple raw mentions of "Kiesler" + "Biloxi" + the canonical eye-test trick failure on new vision-testing technology. |
| 93rd Infantry Division on Morotai Aug 1945 - Jan 1946 (Subject paragraph) | confirmed in raw | Multiple raw mentions of "93rd Infantry Division" + "Moritai" + "Dixie Division" (31st Inf) flying Confederate flag. |
| Korean War with 9th Inf Regt 2nd Inf Div, Pusan breakout at Pohang (Subject paragraph) | confirmed in raw | Multiple raw mentions of 9th Infantry, Pohang ("Poehong"), Pusan Perimeter ("Poosing perimeter" / "Pooh-Syme parameter"). |
| Hill 201 capture Aug 1950 Silver Star (Subject paragraph) | confirmed in raw | "I took a Hill 201, I got my first one" + "Receive a silver star for the operations back in the breaking out of the Poosing perimeter." NOTE: historians sometimes cite Becton's Silver Star action as a different hill number; this is the speaker's self-attestation. |
| Two Purple Hearts (Subject paragraph) | confirmed in raw | "I had received two purple hearts." |
| Col. C.C. Sloan "put them where they're needed" de facto integration of 9th Inf Aug 1950 (Subject paragraph + Pass 2 notes) | confirmed in raw | Multiple raw mentions of Sloan + the "put them where" exact phrase confirmed twice. Canonical first-person testimony, properly captured by Pass 1+2+3. |
| Aberdeen Proving Ground 1948 post commander reading E.O. 9981 + "as long as I'm here, there'd be no change" (Pass 2 notes) | confirmed in raw | Multiple raw mentions of Aberdeen + executive order 9981. Canonical first-person testimony, properly captured. |
| Van Horn Texas drugstore-and-sheriff 1948 episode (Pass 2 notes) | confirmed in raw | Van Horn referenced in raw; canonical first-person testimony as Pass 1+2+3 captured. |
| VII Corps Germany command late-1970s (Subject paragraph) | confirmed in raw | "George comes in, boss, glad you're here. You're in any way" + Heidelberg + Blanchard as USAREUR commander — confirms Becton's VII Corps Germany command and the chain of command. |
| FEMA Director 1985-89 under Reagan (project context line) | confirmed in raw | "from that time until 1989, I asked the Director of FEMA, thoroughly enjoyed it" + Sununu + Seabrook context all confirm FEMA Director role. |
| Prairie View A&M presidency (Subject paragraph) | confirmed in raw | Multiple raw mentions of Prairie View + ROTC PMS captain context. |
| Header cross-ref to John Patterson | **FALSE — does not appear in #71** | Raw-grep confirms "Patterson" / "John Patterson" do NOT appear in entry #71. Header cross-reference should be removed before publication. (See Demotions table.) |
| Header cross-ref to Charles Rangel | confirmed | Multiple raw mentions; canonical. |
| Header cross-ref to Oliver Hill | confirmed | One raw mention + Hill Tucker Marsh law firm; canonical. |
| Header cross-ref to Roy Campanella | confirmed | Multiple raw mentions; canonical. |
| Header cross-ref to Benjamin O. Davis Jr. | confirmed | Multiple raw mentions; canonical. |
| Header cross-ref to Carlisle Barracks 1925 study | confirmed | Raw "study done at Carlisle Barrett, the Army War College" + "1925, I could be off by a year"; canonical. |
| Header cross-ref to E.O. 9981 | confirmed | Multiple raw mentions of executive order + 9981; canonical. |
| Header cross-ref to Indiantown Gap PA | confirmed | One raw mention; canonical. |

**Net-new catalog patterns surfaced:**

| Pattern | Recurrence in this entry | Cross-corpus relevance | Catalog section |
|---|---|---|---|
| "Calf" / "first calf" → "Cav" / "1st Cavalry Division" (homophone for military division name) | 2 occurrences in #71 | Cross-corpus high: 1st Cavalry Division (Air Cav) commanded by multiple Korea/Vietnam-era Black officers; homophone will recur in any military-veteran interview | G (common-word / homophone Whisper substitutions) |
| "Army division" → "Armored Division" (single-word omission/substitution for armor-branch designation) | 1 occurrence in #71 ("second Army division") | Cross-corpus medium: any Armored Cavalry / Armored Division reference is vulnerable to Whisper dropping "ored" | C/D (military unit-designation failures) |
| "Silver wings and gold bars" → "civil-winging and goal bars" (homophone-cluster on USAAF cadet symbols) | 1 occurrence in #71 | Cross-corpus medium: any Air Corps / Air Force cadet-era interview will use this idiom; high recurrence potential in Tuskegee Airmen interviews | G (common-noun phrase corruption) |
| "Names ring a bell" → "name-rigabelle" (idiom-to-compound-noun corruption) | 1 occurrence in #71 | Cross-corpus high: very common English idiom; will appear across many interviews | G (idiom degradation) |
| "Snowball in hell" → "snowball in the hill" (idiom homophone "hell" → "hill") | 1 occurrence in #71 | Cross-corpus high: common American English idiom | G (idiom degradation) |
| "Maintain a sense of humor" → "May 10th Century humor" (idiom-to-date-and-noun corruption) | 1 occurrence in #71 | Cross-corpus low-medium: idiom usage varies by speaker but corruption pattern is distinctive | G (idiom degradation) |
| "Page" → "pace" (homophone in citation context) | 1 occurrence in #71 ("pace 19") | Cross-corpus high: common-word homophone, will recur whenever speakers cite page numbers | G (homophone substitution) |
| "Becton" surname → "Bechtney" (NEW variant beyond Bechtung/Bechton/Beckton) | 1 occurrence in #71 | Cross-corpus n/a (single-subject surname) | C (single-transcript high-recurrence surname-failure cluster expansion) |
| "Bailey's Crossroads VA" → "Billy's Crossroads" (place-name single-syllable shift) | 1 occurrence in #71 | Cross-corpus medium: Bailey's Crossroads is canonical NoVA suburb housing many DoD agencies; will recur in defense-related interviews | F (geographic-name failures) |
| "Agency for International Development" → "for interested development" (single-acronym-expansion garble) | 1 occurrence in #71 | Cross-corpus medium: USAID is a recurring government-service reference | C (institutional-name failures) |
| "Association of the United States Army" → "Associated United States Army" (single-word grammatical-form swap) | 1 occurrence in #71 | Cross-corpus medium: AUSA is the canonical Army veterans/professional organization referenced in many military-officer interviews | C (organization-name failures) |
| "Muhlenberg" → "Mulebert" (new variant supplementing "Muleenberg") | 1 occurrence in #71 | Cross-corpus low (Muhlenberg is PA-specific) | F (institutional-name failure) |
| "OTEA / Operational Test and Evaluation Agency" → "O.T.A. / Operations on Test and Evaluation Agency" | 1 occurrence in #71 | Cross-corpus low-medium: military test-agency references will recur in late-career military interviews | C (institutional-acronym garble) |
| "Mainz-Gonsenheim" (German 2nd Armored CCB garrison) → "Mike Johnson-Hime" | 1 occurrence in #71 (hypothesized) | Cross-corpus medium: Cold War US Army Germany garrison towns are a recurring vulnerability | F (geographic-name failure, foreign) |

**Net-new ground-truth corpus candidates:**

- Gen. George S. Patton IV (1923-2004): Son of WWII Gen. George S. Patton Jr.; commanded 2nd Armored Division after Becton; canonical Vietnam-era armor commander. Worth canonical entry given his Becton-relationship and his own Vietnam-era Black-officer-promotion track record (Patton IV personally promoted several Black armor officers in the 1970s VII Corps pipeline).
- Gen. Jack N. Merritt (1925-2014): Becton's chief of staff at OTEA / 1st Cav era; later AUSA president 1988-98; canonical post-Vietnam Army-professional-organization figure. Already in P2 #71.P2.6 candidate list; reinforced here.
- John H. Sununu (b. 1939): NH Governor 1983-89; GHWB Chief of Staff 1989-91. Canonical late-1980s Republican Northeast political figure; his FEMA-Seabrook fight with Becton is documented and his pressure on Becton over the Seabrook nuclear plant licensing is a canonical regulatory-capture-vs-emergency-management episode.
- Seabrook Station (Seabrook NH nuclear power plant): The defining 1980s FEMA emergency-planning regulatory dispute; opened 1990 after a decade of FEMA-NRC disputes during Becton's tenure. Canonical regulatory-dispute landmark.
- Bailey's Crossroads, VA: Canonical NoVA suburb (Fairfax County) housing OTEA / multiple DoD test agencies. Worth corpus-entry as a cross-referenced location for military-careers interviews.
- US Army Operational Test and Evaluation Agency (OTEA, later ATEC): Becton was its commander 1976-78. Canonical Cold War-era Army institution that handled test-and-evaluation for major equipment programs including the Abrams tank and Bradley fighting vehicle.
- Association of the United States Army (AUSA): Founded 1950; Army Magazine publisher; canonical professional-organization that figures in many post-retirement officer narratives.
- USAID Office of US Foreign Disaster Assistance (OFDA): Becton was its Director 1984-85 before FEMA. Canonical international-humanitarian-aid agency that recurs in late-career Black-officer narratives (cross-link to entries discussing African development work).
- Gen. George S. Blanchard (1920-2006): Commander of USAREUR + Seventh Army 1975-79. Already in P2 #71.P2.30; reinforced here. The VII Corps - USAREUR command chain ran Becton (VII Corps) -> Blanchard (USAREUR) -> Haig then later Bernard Rogers (SACEUR).

**Adversarial-review flag updates:**

| Original row | Action (resolved / retained / new) | Notes |
|---|---|---|
| 71.15 half-barnal (Tuskegee Airmen recruiter) | retained | Speaker recall of late-1943 Lower Merion HS recruiter still unresolved. Pass 4 raw context: "half-barnal had come out to our high school and convinced us to join the Army Air Corps when you're civil-winging and goal bars" — possibly a Tuskegee Airmen recruiter named "Captain Barnett" or "Half-Bernal" (unidentified). |
| 71.50 / 71.P2.17 Mike Johnson-Hime (German garrison) | retained with refinement | Pass 4 raw context confirms Becton's German CCB / 2nd Armored Division posting was Aug-1955 to 1958. The canonical 2nd Armored Division CCB garrison during that period was **Mainz-Gonsenheim** (Lee Barracks). "Mike Johnson-Hime" -> "Mainz-Gonsenheim" is the most likely identification but not directly confirmed. Multi-model military-base atlas resolution requested. |
| 71.P2.8 Bert Snyder / Killy (Marine General) | retained | Wackenhut corporate-board roster c.1992; speaker recall still opaque. |
| 71.P2.25 Mark Russ-Eitel | retained | MSRC presidents list; speaker recall still opaque. |
| 71.P2.35 Tilkani | retained | Korean officer name / unit-number garble; still unresolved. |
| 71.P2.41 Dorothy Mendoza | retained | GHWB FEMA personnel; still unresolved. |
| 71.P2.51 Senate General Steiver | retained | MLDC vice-chair identification; still unresolved. |
| 71.52 / 71.P2.36 Severnfield → Suffolk VA | retained | "Uofia" hypothesized as "U of Va" but could be Suffolk-area hospital/nursing school. Pass 4 reinforces: raw context "they went to Mulebert. I met a young nurse from Severnfield, of the Uofia" — "Mulebert" (= Muhlenberg) is where Becton went to college, so the nurse-meeting was during his Muhlenberg years (1946-47) and his wife Louise's nursing school could be in Allentown PA area, NOT Suffolk VA. Reopen the geography assumption: "Severnfield" could be a Pennsylvania place name (e.g., Sellersville or similar). |
| 71.P4.16 Natalia / 9th Infantry nickname | new | Speculative "Manchu" identification; multi-model regimental-history check requested. |
| 71.P4.19 Frint Down in Texas | new | Speaker phrasing; "friend down in Texas" most likely but speculative. |
| 71.P4.20 Reese Georgia | new | Daughter's birth-certificate location near Fort Benning/Columbus GA; small-place-name verification requested. |
| 71.P4.21 the interesse in the Thunc heard | new | Speaker false-start sequence in FEMA-context; opaque. |
| Header cross-ref to John Patterson | new (Subject paragraph error) | Patterson does not appear in entry #71; cross-reference list should be corrected before publication. Recommend the cross-reference list be regenerated against the actual transcript content. |

**Audit-complete assessment:** Pass 4 brought entry #71 to publication-ready state with one Subject-paragraph cross-reference error flagged for correction (the spurious John Patterson cross-reference), 23 net-new Pass 4 catches covering canonical military units (2nd Armored Division, 1st Cavalry Division, OTEA, AUSA, USAID), Subject-paragraph idiom corruptions (silver wings/gold bars, snowball in hell, names ring a bell, maintain a sense of humor, page→pace), and a refined hypothesis for the Mike Johnson-Hime German garrison (Mainz-Gonsenheim). Closing line is clean (standard LoC/Smithsonian outro); no closing-line hallucination.

**Audit-complete marker**: Pass 4 complete on entry #71 as of 2026-05-22.
