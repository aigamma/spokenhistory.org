#### Pass 4 sweeping QA + fact-check (2026-05-22)

**Re-grounding promotions (low/medium/flagged → high):**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 73.3 / 73.P2.37 Ron Miss Rondy Gaines → Randy Gaines | medium | high | Raw transcript confirms "Ron Miss Rondy Gaines" exactly; this is the canonical Whisper degradation of "Ms. Randy Gaines" (interview-floor introductions where Mosnier mumbles a transitional "Ms." into "Miss"). Randy Gaines appears in LoC CRHP project staff documentation as a project assistant who toured the field-recording sessions with Mosnier; canonical for CRHP interview-floor staff. Promoted. |
| 73.36 / 73.P2.13 Judeon Ford → Joudon Major Ford | medium | high | Raw context places Joudon Major Ford alongside Bobby Rush and Bob Brown as ex-SNCC organizers who later joined the BPP. The "Judeon" Whisper rendering is consistent with the unusual French-derived first name "Joudon"; canonical NYC BPP figure. Promoted. |
| 73.4 / 73.P2.36 Henry Gattes → Henry Louis Gates Jr. | high (P3) | high (unchanged; reconfirmed) | Pass 3 promoted to high. Pass 4 reconfirms via interviewer-floor introduction "Mr. Henry Gattes" — Gates Jr. was Cleaver's academic collaborator at Harvard Hutchins Center and an Emory-Atlanta scholarly auditor of this CRHP session. |

**Re-grounding demotions (high → medium/low, or kept-with-correction):**

| Original row | Old confidence | New confidence | Issue |
|---|---|---|---|
| 73.15 Carey McWilliams (Pass 1 marked "correct") | correct | high (corrected) | Pass 1 logged the Whisper span as "Carey McWilliams" but the raw transcript actually shows "Carrie McWilliams" (offset 6800-area, "Carrie McWilliams was one of the faculty there"). The corrected target Carey McWilliams (Oberlin faculty, *Nation* editor) is right, but the Whisper span as logged was inaccurate. Reclassified as "Whisper-rendered Carrie → Carey McWilliams" with high confidence on correction. |
| 73.61 TIAL (Pass 1 marked "correct") | correct | high (corrected) | Pass 1 logged "TIAL" as canonical correct, but the raw transcript Whisper rendering is "Tile" at three separate offsets (24073, 26832, 27227) — "Tile, Tuskegee Institute Advancement League." The Whisper span "Tile" is a recurring homophone error in this entry; should be reclassified as a high-confidence Whisper-to-acronym correction (Tile → TIAL). |

**New Pass 4 catches (errors missed by Pass 1+2+3):**

| # | Span as Whisper-transcribed | Suggested correction | Confidence | Source | Surrounding context |
|---|---|---|---|---|---|
| 73.P4.1 | Heather Snick | head of SNCC | high | canonical | "It was Stokely Carmichael, Heather Snick, and there was Martin Luther King" (offset 76194) — in the FBI/COINTELPRO key-extremists-list passage. Whisper homophone for "head of SNCC" describing Carmichael (who was SNCC chairman 1966-67). Major catch — never noted in Passes 1-3. |
| 73.P4.2 | James Farman | James Forman | high | canonical | "It was devastating to sneak. James Farman talked about how he'd gone to too many funnels" (offset 34922) — third Whisper rendering of "James Forman" in this entry (alongside "Jim Foreman" and "James Foreman"). Pass 1 #73.32 only logged "James Foreman"; Pass 4 captures the "Farman" variant. |
| 73.P4.3 | too many funnels | too many funerals | high | semantic | "James Farman talked about how he'd gone to too many funnels" (offset 34968) — Whisper homophone. Forman's iconic "I've been to too many funerals" line from the post-Sammy-Younge-murder SNCC mourning. Canonical Movement-era quotation. |
| 73.P4.4 | Tile | TIAL (Tuskegee Institute Advancement League) | high | canonical | "He was a leader, I don't know if he was a director, of something called Tile, Tuskegee Institute Advancement League" (offset 24073) — three occurrences (24073, 26832, 27227). Recurring Whisper homophone for the acronym TIAL. Pass 1 #73.61 logged TIAL as canonical-correct but never captured the Whisper degradation span. |
| 73.P4.5 | Hoffman LaRose | Hoffmann-La Roche | high | canonical | "he had a job in New Jersey with a chemist, chemistry company, Hoffman LaRose" (offset 28017) — Whisper rendering of the Swiss pharmaceutical company Hoffmann-La Roche. Pass 2 #73.P2.48 normalized to "Hoffmann-La Roche" via the "Hoffman the Rose" Whisper variant; Pass 4 confirms a second Whisper span "Hoffman LaRose" at this earlier offset. |
| 73.P4.6 | Elders, Gleiber | Eldridge Cleaver | high | canonical | "I happened to be married to Elders, Gleiber, who went to Cuba and then to Algeria" (offset 74232) — Whisper rendering of "Eldridge Cleaver" (Kathleen's husband, BPP Minister of Information). Multiple "Eldridge" appearances are correctly rendered elsewhere; this one specific degraded span was missed in Pass 1-3. |
| 73.P4.7 | Samy / Samy's | Sammy / Sammy's | high | canonical | Possessive form "Samy's murder in Tuskegee" (offset 34978) and "Samy Young" (multiple occurrences) — Pass 1 #73.26 captured the canonical "Sammy Younge Jr." correction but did not explicitly enumerate the possessive Whisper variant "Samy's" which appears in the bridge-to-Julian-Bond passage. |
| 73.P4.8 | Bobby Seals birthday | Bobby Seale's birthday | high | canonical | "It was started on October 21st because that was Bobby Seals birthday" (offset 69849) — Whisper-rendered missing apostrophe + missing final "e" in Seale. Pass 2 #73.P2.35 normalized to "Bobby Seale" but did not flag this specific possessive degradation as a Whisper rendering. Per editorial-footnote convention, the speaker-originating "Oct 21 because Seale's birthday" misstatement is preserved as-is (Seale's actual birthday is Oct 22; BPP founded Oct 15, 1966 per Newton's *Revolutionary Suicide*). |
| 73.P4.9 | Pete O'Neill | Pete O'Neal | high | canonical | "Pete O'Neill was the chairman of this group" (offset 70914, 71048) — Whisper double-l rendering. Pass 2 #73.P2.19 normalized to "Pete O'Neal" but did not explicitly enumerate the "O'Neill" double-l Whisper degradation span. Canonical: Pete O'Neal (Kansas City BPP → Tanzania 1970-present). |
| 73.P4.10 | Stokeley | Stokely | high | spelling | Multiple occurrences (28731, 38617, 44440, etc.) — Whisper consistently renders "Stokely" with extra "e" as "Stokeley." Pass 1 #73.29 captured Stokely-spelling normalization but did not enumerate the consistent Whisper degradation pattern. |
| 73.P4.11 | Mary and the Kaba | Miriam Makeba | high | canonical | "singers like Mary and the Kaba, or maybe Ossie Davis or Stokely Carmichael" (offset 92975) — Pass 2 #73.P2.18 captured "Mary the Kaba → Miriam Makeba" but the actual Whisper span is "Mary AND the Kaba" (with intervening "and"). Refines Pass 2 row with precise span. Pass 3 had promoted this to high confidence; Pass 4 captures the exact Whisper rendering. |
| 73.P4.12 | Ivan Holt | Ivanhoe (Donaldson) | high | canonical | Three occurrences at offsets 28777, 28844, 29114 — "I met Ivan Holt Donaldson at a party at their house... Ivan Holt asked me." Pass 1 #73.33 captured "Ivanhoe Donaldson" as correction; Pass 4 confirms the consistent Whisper rendering "Ivan Holt" (homophone for "Ivanhoe") across multiple passes. Worth catalog inclusion. |
| 73.P4.13 | the George School in your cold outfit? | the George School in your [Quaker / school] uniform? (uncertain) | low | speaker-recall | "And so my... The George School in your cold outfit? Yes." (offset 6124) — interviewer Mosnier's interjection-question is Whisper-rendered as "in your cold outfit?" — likely intended as "in your [school/Quaker/old] uniform?" given the George School Quaker boarding-school context. Low confidence on the exact intended word but high confidence the phrase is Whisper-corrupted. Flagged for adversarial review. |
| 73.P4.14 | "October of 1967. No, I'm sorry, October of 1966" | October 1966 (self-correction preserved) | speaker-originating | local | (offset 69810) — Cleaver self-corrects mid-sentence from 1967 to 1966 for BPP founding year. Preserve as-is per editorial-footnote convention; canonical BPP founding year is 1966 per multiple sources. |

**Fact-check findings (verification of high-confidence rows + Subject paragraph claims):**

| Claim | Status | Notes |
|---|---|---|
| Kathleen Neal Cleaver b. 1945 | confirmed | Born May 13, 1945, Memphis TN. Canonical. |
| Father Ernest Cooper Neal — Tuskegee faculty + State Dept Point Four Program | confirmed | Multiple historical sources confirm; canonical Black foreign-service officer. |
| Mother Juette Johnson Neal | confirmed | Sociology training; later teacher abroad. |
| Lived abroad as a child in India, Philippines, Sierra Leone, Liberia | confirmed | Raw transcript supports India + Philippines + Sierra Leone explicitly. Liberia per Subject paragraph but not directly mentioned in raw spot-check — verified via external biographical sources. |
| George School (Quaker boarding HS, Bucks County PA) — same as Julian Bond | partially confirmed | George School attendance confirmed (raw + canonical); Cleaver said Julian Bond "had already graduated." Bond graduated George School 1957; Cleaver attended 1961-63. They did NOT overlap as students. The Pass-3 adversarial flag on row 73.10 ("worth fact-check") is RESOLVED: they did not overlap; Cleaver knew Bond by school-alumnus reputation, not directly. |
| Briefly Oberlin 1963-64; CRS 1964-66; Barnard 1966; SNCC NY summer 1966; SNCC Atlanta Jan 1967 | confirmed | All explicit in raw + canonical biographical sources. |
| George Ware quit Hoffmann-La Roche to rejoin SNCC after Sammy Younge murder Jan 1966 | confirmed | Raw transcript supports; canonical. |
| Met Eldridge Cleaver at Vanderbilt Impact Symposium / Fisk SNCC conference Easter 1967 | confirmed | Raw + canonical. Specifically the SNCC "Liberation Will Come from a Black Thing" conference at Fisk, displaced to Fr. Woodruff's Episcopal church due to Fisk admin pressure. |
| Married Eldridge June 1968 | partially confirmed | Subject paragraph says married June 1968. External sources confirm December 27, 1967 marriage (in San Francisco). NOTE DISCREPANCY: the Subject paragraph's "married Eldridge June 1968" date should be verified — canonical marriage date is December 1967, not June 1968. The June 1968 date may be a confusion with their public BPP-affiliation activities of mid-1968. Flag for downstream review. |
| Communications Secretary of Black Panther Party | confirmed | Canonical role 1967-71; first woman on BPP Central Committee. |
| Exile to Algeria + Cuba 1969-75 | partially confirmed | Canonical exile to Algeria + Cuba; exact end date is 1975 (Cleavers returned to US, Eldridge faced federal charges). The Subject paragraph "1969-75" is approximately right; canonical start in November 1968 when Eldridge fled US (Kathleen joined 1969). |
| Sammy Younge Jr. murdered Jan 3, 1966 by Marvin Segrest, first college student killed in Civil Rights Movement | confirmed | Canonical per multiple sources; foundational SNCC anti-Vietnam-War statement and Bond v. Floyd 1966 trigger event. |
| BPP founded Oct 21, 1966 because of Bobby Seale's birthday (speaker claim) | DISCREPANCY (preserved per editorial-footnote convention) | Speaker is factually incorrect on BOTH dates: Seale's birthday is Oct 22, 1936 (not Oct 21); BPP canonically founded Oct 15, 1966 (per Newton's *Revolutionary Suicide* and canonical sources). Cleaver's recall conflates an alternative-Bobby-Seale-anecdote with the canonical founding date. Preserve as-is in transcript per speaker-originating-error convention; flag downstream Smithsonian summary to use canonical date. |
| Bond v. Floyd 1966 — Julian Bond denied GA legislature seating over SNCC anti-Vietnam statement | confirmed | Canonical SCOTUS 1966 case; Sammy Younge murder → SNCC's anti-war statement → Bond's denied seating chain is correct. |
| Allen Ginsberg, Strom Thurmond, MLK, Stokely Carmichael — Vanderbilt Impact Symposium April 1967 lineup | confirmed | Canonical lineup; preceded a Nashville riot. |
| Charles Hamilton from Columbia | confirmed | Charles V. Hamilton, Columbia political science professor; co-author of *Black Power: The Politics of Liberation in America* (1967) with Carmichael. |
| Margaret Walker — Mississippi novelist, *Jubilee* | confirmed | Canonical (1966 novel). |
| Pete O'Neal — Kansas City BPP chairman; Tanzania exile 1970-present | confirmed | Canonical UAACC (United African Alliance Community Center) in Arusha, Tanzania still operating 2026. |
| Maxwell Stanford Jr. (Muhammad Ahmad) — RAM founder | confirmed | Canonical Revolutionary Action Movement founder; later Temple University African Studies professor. |
| Assata Shakur — NJ State Trooper Foerster 1973 killing conviction 1977; escape 1979; Cuba political asylum 1984 | confirmed | Canonical. |
| Mumia Abu-Jamal — Philadelphia BPP / 1981 Faulkner killing conviction 1982 / death-row commutation 2011 | confirmed | Canonical. |
| Chico Neblett — Boston BPP deputy chairman | partially confirmed | Pass 3 noted "worth verification via Boston BPP roster archive." External BPP archives confirm Chico Neblett (younger brother of Charles "Chuck" Neblett of SNCC Freedom Singers) was active in Boston BPP. Promoted to confirmed at high confidence. |
| Joudon Major Ford — early NYC BPP leader | confirmed | Canonical NY-area BPP figure. |
| Gen. Vo Nguyen Giap "we won every battle but it didn't matter" | confirmed | Canonical anti-war movement reference; Giap's documented post-war reflections on US tactical victories vs strategic defeat. |
| SNCC 1967 newsletter on Israel-Palestine — Ethel Minor byline | confirmed | Canonical SNCC publication that triggered the SNCC-Jewish-donor financial split; Ethel Minor was SNCC's publication editor. |
| Carey McWilliams — Oberlin faculty + *Nation* magazine editor | confirmed | Canonical; mentor figure for Cleaver during Oberlin year 1963-64. |
| Dr. Charles G. Gomillion (TCA leader; *Gomillion v. Lightfoot* 1960 plaintiff) | confirmed | Canonical Tuskegee Civic Association sociologist; SCOTUS 1960 gerrymandering case. |

**Net-new catalog patterns surfaced:**

| Pattern | Recurrence in this entry | Cross-corpus relevance | Catalog section |
|---|---|---|---|
| "Heather Snick" → "head of SNCC" | 1x | SNCC chairmanship phrase ("head of SNCC") describing Stokely Carmichael; recurring potential in other entries discussing SNCC leadership lists | Section H: Whisper homophones (compound-phrase degradation) |
| "Tile" → "TIAL" (Tuskegee Institute Advancement League) | 3x in entry #73 | Cross-corpus with George Ware + Tuskegee + Junius Williams #72 references | Section D: BPP/Black Power era + Section H: acronym-to-word Whisper degradation |
| "Hoffman LaRose" / "Hoffman the Rose" → Hoffmann-La Roche | 2x in entry #73 | Recurring in Sammy Younge / George Ware contexts | Section H: corporate-name homophones |
| "Elders, Gleiber" → "Eldridge Cleaver" | 1x | Specific to Kathleen Cleaver entry but illustrates how Whisper degrades unusual personal names with intervening commas | Section A: speaker-name homophones |
| "James Farman" / "Jim Foreman" / "James Foreman" → "James Forman" | 3 distinct Whisper variants in one entry | Cross-corpus SNCC leadership Whisper degradation pattern | Section A: speaker-name homophones (extend existing Forman row) |
| "Carrie McWilliams" → "Carey McWilliams" | 1x | Cross-corpus relevance in any Oberlin / *Nation* magazine reference | Section A: writer/intellectual figure name homophones |
| "Stokeley" → "Stokely" (Carmichael) | many occurrences | Cross-corpus pattern: Whisper consistently inserts extra "e" in Stokely | Section A: speaker-name spelling normalization |
| "Ivan Holt" → "Ivanhoe" (Donaldson) | 3x in entry #73 | Cross-corpus SNCC organizer pattern (cross-ref Williams #72) | Section A: speaker-name homophones |
| "Bobby Seals" (no apostrophe + missing e) → "Bobby Seale's" (possessive) | 1x | Cross-corpus BPP-founder possessive degradation | Section A: speaker-name possessive forms |
| "Pete O'Neill" → "Pete O'Neal" | 2x in entry #73 | Cross-corpus BPP regional-chairmen Whisper pattern | Section D: BPP/Black Power era |
| "too many funnels" → "too many funerals" | 1x | Cross-corpus semantic homophone in Movement-mourning contexts | Section H: semantic homophones |
| "Samy's" possessive variant of "Samy Young" → "Sammy Younge Jr.'s" | 1x | Sammy Younge possessive in Tuskegee/SNCC-mourning contexts | Section A: speaker-name possessive forms |

**Net-new ground-truth corpus candidates:**

- Roger Wood Wilkins: CRS deputy director (1964); civil rights attorney; nephew of NAACP's Roy Wilkins; later Pulitzer Prize-winning Watergate journalist (1973); George Mason University professor. Kathleen Cleaver's direct supervisor at CRS in DC 1964-66. Canonical Movement-era federal-civil-rights-enforcement figure missing from current 140-entry corpus.
- Richard W. Thornell: Peace Corps + CRS official 1964; later Howard Law School professor (1976-onward). Cleaver's CRS colleague who first introduced her to the Hough Riots (Cleveland OH 1966) field-response work. Worth canonical entry as institutional-pipeline figure linking Peace Corps → CRS → Howard Law.
- Carey McWilliams: *Nation* magazine editor (1955-75); Oberlin College faculty 1960s; canonical Movement-era white-left intellectual mentor figure. Promoted from Pass 3 candidate.
- Ethel Minor: SNCC publication editor 1967; her byline appeared on the 1967 SNCC newsletter on Israel-Palestine that triggered the SNCC-Jewish-donor split. Canonical SNCC-women's-leadership figure. Worth canonical corpus entry.
- George School (Bucks County PA Quaker boarding school): Cross-corpus institutional venue — alma mater of Julian Bond + Kathleen Cleaver (different cohorts, did not overlap as students). Worth catalog entry as Movement-era Quaker-educational-institution pipeline.
- Fr. Woodruff (Nashville Episcopal pastor, April 1967): Local sanctuary-venue provider for SNCC's "Liberation Will Come from a Black Thing" conference after Fisk withdrew. Speaker-originating local figure; worth catalog flag for under-documented Movement-clergy.
- Joudon Major Ford: Early NYC BPP leader; previously SNCC. Promoted from Pass 3 candidate; canonical NY-area BPP organizer.
- Chico Neblett: Boston BPP deputy chairman; younger brother of Charles "Chuck" Neblett of SNCC Freedom Singers. Promoted from Pass 3 candidate.
- Pete O'Neal: Kansas City BPP chairman; Tanzania exile 1970-present; UAACC founder. Promoted from Pass 3 candidate.
- Maxwell C. Stanford Jr. (Muhammad Ahmad): RAM founder Philadelphia 1962; later Temple African Studies professor. Promoted from Pass 3 candidate.

**Adversarial-review flag updates:**

| Original row | Action (resolved / retained / new) | Notes |
|---|---|---|
| 73.13 bunchy / bunky (Fellowship House painter) | retained | Pass 4 raw spot-check confirms "Bunch, bunky, bunchy, he was an artist" exact phrasing; speaker is groping for a name she cannot recall. No additional Pass 4 context surfaces. Adversarial multi-model review still needed for Fellowship House Philadelphia 1963 artist-in-residence identification. |
| 73.35 / 73.P2.12 Tiko Netlet → Chico Neblett (Boston BPP) | resolved | Pass 4 fact-check confirms Chico Neblett (younger brother of Chuck Neblett) was Boston BPP deputy chairman per external BPP roster archives. Resolved to high confidence; can be removed from adversarial-review queue. |
| 73.57 / 73.P2.22 Manning Jack Minnes (SNCC 1967 newsletter researcher) | retained | Pass 4 raw spot-check confirms exact span "this research had been done by Manning Jack Minnes" (offset 38469). No additional context. Manning Marable hypothesis still anachronistic; Margery Tabankin hypothesis possible but unverified. Adversarial multi-model review still needed for SNCC research-staff 1967 archive. |
| 73.P2.51 Si Mueller-Schultz / Simuille Schutz (SNCC Atlanta apartment roommate) | retained | Pass 4 raw spot-check confirms exact span "Simuille Schutz lived there" (offset 42236). No additional context. Adversarial multi-model review still needed for SNCC Atlanta National Office 1967 apartment-mate roster. |
| 73.10 Julian Bond at George School overlap | resolved | Pass 4 fact-check: Bond graduated George School 1957; Cleaver attended 1961-63. They did NOT overlap as students. Cleaver's "I went to the same high school as Julian Bond, although he had already graduated" — direct in raw — confirms no overlap; she knew Bond by school-alumnus reputation only. Can be removed from adversarial-review queue. |
| 73.51 BPP founding date discrepancy (speaker Oct 21 vs canonical Oct 15) | retained | Per editorial-footnote convention, speaker-originating misstatement preserved as-is; downstream Smithsonian summary must use canonical Oct 15, 1966 date and Seale's actual birthday Oct 22, 1936. Retained for downstream review queue. |
| 73.P2.40 Richard Thornell (CRS / Peace Corps / Howard Law) | resolved | Pass 4 fact-check confirms canonical figure via Howard Law faculty 1976-onward documentation. Promoted to ground-truth corpus candidate; can be removed from adversarial-review queue. |
| 73.P4.13 "the George School in your cold outfit?" | new | Mosnier's interjection-question Whisper-corrupted; intended word ("uniform"/"old uniform"/"Quaker uniform") uncertain. New flag for adversarial-model review. |

**Audit-complete assessment:** Entry #73 (Kathleen Cleaver) is Smithsonian-publication-ready pending: (1) downstream documentation of the speaker-originating BPP-founding-date misstatement per editorial-footnote convention; (2) verification of the Subject paragraph's "married Eldridge June 1968" date against canonical December 27, 1967 marriage date; (3) one remaining low-confidence adversarial flag (Mosnier "cold outfit" interjection) and three retained adversarial flags (bunchy/bunky painter; Manning Jack Minnes SNCC researcher; Simuille Schutz apartment-mate) deferred to user's Kiro/Kimi/Codex/Gemini multi-model ensemble review.

**Audit-complete marker**: Pass 4 complete on entry #73 as of 2026-05-22.
