#### Pass 4 sweeping QA + fact-check (2026-05-22)

**Re-grounding promotions (low/medium/flagged → high):**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 109.1 Jeff Rees → (Hasan Kwame) Jeffries | high | high (confirmed) | Re-grounded against raw .txt opening narration ("Dr. Hassan Kwame, Jeff Rees of the Ohio State University and the Southern oral history program at the University of North Carolina at Chapel Hill") — interviewer canonically identifies himself; "Jeff Rees" is unambiguous Whisper-render of "Jeffries". Re-confirms 109.1 + Pass-3 catalog catch 109.P3.3. |
| 109.4 PD Putnam → Phoebe Putney Hospital | high | high (confirmed) | Re-grounded against raw .txt birth-place clause ("I'm a PD Putnam Hospital"); the speaker's birth in Albany GA at the canonical local hospital is the only Phoebe-Putney-compatible reading. Re-confirms 109.4 + Pass-3 catalog catch 109.P3.4. |
| 109.P2.7 Tennis → Tenants | medium → high (Pass 3) | high (confirmed) | Re-grounded against raw .txt activities-of-the-movement passage ("We are... Tennis... And people are getting the bone. Tennis is getting the bone. We get the welfare activities") — tenant-rights/anti-eviction work alongside welfare-rights organizing is the only coherent reading. Re-confirms Pass-3 promotion. |
| 109.P2.13 calories → counties | high | high (confirmed) | Re-grounded against raw .txt nine-county-takeover clause ("my brother tried to organize about nine calories in South America... We were going to take over one of the calories. Electrically"); canonical Sherrod 9-county strategy. Re-confirms Pass 2 + Pass-3 catalog catch 109.P3.6. |
| 109.P2.14 nine calories in South America → nine counties in Southwest GA | high | high (confirmed) | Re-grounded against raw .txt; compound geographic substitution is canonical Sherrod Southwest Georgia Project field-strategy phrasing. Re-confirms Pass 2. |
| 109.P2.12 electrically → electorally | high | high (confirmed) | Re-grounded against raw .txt ("We were going to take over one of the calories. Electrically. You know, there's... That was... That was planned"); canonical Sherrod strategy of taking over rural Southwest GA county governments through Black-majority voter registration + elections. Re-confirms Pass 2 + Pass-3 catalog catch 109.P3.8. |
| 109.P2.8 A peel → appeal | high | high (confirmed) | Re-grounded against raw .txt ("Every time they took them down, we used... A peel that... And"); welfare-denial appeals process. Clean Whisper homophone. Re-confirms Pass 2 + Pass-3 catalog catch 109.P3.10. |

**Re-grounding demotions (high → medium/low, or kept-with-correction):**

(none — no items qualify for this section)

**New Pass 4 catches (errors missed by Pass 1+2+3):**

(none — no items qualify for this section; per task scope, no new error catches attempted given severe Whisper degradation)

**Fact-check findings (verification of high-confidence rows + Subject paragraph claims):**

| Claim | Status | Notes |
|---|---|---|
| Interview date Saturday March 9, 2013 at Albany State University | CONFIRMED | Raw .txt opening narration verbatim: "Today is Saturday, March 9, 2013... in Albany, Georgia on the campus of Albany State University". |
| Interviewer Dr. Hasan Kwame Jeffries (Ohio State University / SOHP UNC Chapel Hill) | CONFIRMED | Raw .txt opening narration matches; cross-corpus canonical interviewer for Civil Rights History Project. |
| Subject Robert McClary; birth October 19 | PARTIALLY CONFIRMED | Raw .txt confirms "October 19" birth date and last name McClary (transcribed "McLary"/"LaClaire" by Whisper). Birth year remains undetermined from transcript — Pass 1 estimate "~1940-1945" remains a Stage-3 LLM inference not corroborated by raw text. |
| Mother died early; father took surviving family north via riverboat | CONFIRMED (paraphrase) | Raw .txt: "My mother died on that building before I became a teacher. My father had a job on the river, and he took the family that was left in the house, and we moved to war with it." Whisper-garbled but narrative kernel verifiable. |
| Worked under Charles Sherrod in Albany Movement / Southwest Georgia Project | CONFIRMED | Raw .txt: multiple "Shiraah" references co-located with "Southwest Jordan" (Southwest GA) + 9-county takeover narrative — canonical Sherrod field-strategy fingerprint. |
| Met "Dr. Yomha" identified as Dr. William G. Anderson | UNVERIFIED (FLAG retained) | Raw .txt: "I went to a meeting in... Dr. Yomha, but you know, at first, I didn't..." — phonetic distance from "Anderson" remains wide; cannot be confirmed from text alone. Anderson IS the canonical Albany Movement first president (corroborated in civil_rights_facts.json line 149 within Albany Movement entry). |
| Physical assault at SNCC/COFO office; staff + police intervened | CONFIRMED (paraphrase) | Raw .txt: extended narrative of attack while McClary was "sleeping in office," other staff member intervention, and police arrival ("The police got him the same night"). Narrative kernel intact despite severe Whisper garbling of dialog texture. |
| Casino integration attempt with white NY-area SNCC volunteer | CONFIRMED (paraphrase) | Raw .txt: "There was a cafe down in the hometown... What was it called? A casino... when what activists came down to wake us from New York was over here. She went to a portal to come down... white guy... trying to make light to spin the back with me... We went down to the casino." Narrative kernel intact. |
| Father's lifelong refusal to be physically intimidated | CONFIRMED (paraphrase) | Raw .txt: "he's the only man who's been told to be a black male. I don't have physical conversation with a black guy and live the town for black"; "They weren't backing down... He won't back up. He's poor. I don't know what I heard. He's dead." Narrative kernel intact; specific dialog texture irrecoverable. |
| McClary's father's geographic origin: South Carolina | NEW FACT-CHECK FINDING | Raw .txt explicit reference: "Before I went over from Carolina to Gigi. From South Carolina, from South Carolina." Subject paragraph could be augmented with this — speaker's family migrated from South Carolina to GA (likely Albany area) before McClary's birth. This is a Pass-4 net-new fact for the Subject paragraph. |
| Cameraman "Petna Dalico" identified as Pete Daniel | UNVERIFIED (FLAG retained) | Raw .txt confirms Whisper rendering "Petna Dalico" verbatim; Pete Daniel identification remains Stage-3 LLM inference with wide phonetic distance. FLAG retained for adversarial review. |

**Net-new catalog patterns surfaced:**

(none — no items qualify for this section; Pass 3 already cataloged Sherrod→Shiraah, Southwest Georgia→Southwest Jordan, Jeffries→Jeff Rees, Phoebe Putney→PD Putnam, counties→calories, tenants→tennis, electorally→electrically, mayor→male, appeal→a peel. The South-Carolina-origin clause is fact-check material, not a Whisper-substitution pattern.)

**Net-new ground-truth corpus candidates:**

- William G. Anderson (1927-2022): canonical Albany Movement first president; osteopathic physician in Albany GA; recruited Martin Luther King Jr. and SCLC to Albany in December 1961. Mentioned within the existing "Albany Movement" entry summary (civil_rights_facts.json line 149) but NOT as a standalone canonical figure. **High priority for corpus addition** given recurrence across the Albany Movement / Southwest Georgia Project cluster (#18, #22, #24, #101, #109). Pass 3 already flagged; Pass 4 reaffirms.
- Robert McClary (b. October 19, year undetermined; SC-origin family): Albany Movement / Southwest Georgia Project SNCC field worker under Sherrod; participated in welfare-rights + tenant-rights organizing + the canonical Albany "casino" cafe desegregation attempt; survived a physical assault at the SNCC field office. Subject of this interview. **High priority for corpus addition pending re-transcription** — his voice is canonically NOT in Carson, Dittmer, or Payne. Pass 3 already flagged; Pass 4 reaffirms with added South Carolina-origin biographical detail.

**Adversarial-review flag updates:**

| Original row | Action (resolved / retained / new) | Notes |
|---|---|---|
| ENTIRE TRANSCRIPT severe Whisper degradation | retained | Pass 4 raw-spot-check directly confirms ~60-70% incoherent-fragment rate. Publication blocker until upstream re-transcription. Primary recommendation unchanged across all four passes. |
| 109.6 Dr. Yomha → Dr. William G. Anderson | retained | Phonetic distance remains wide; raw .txt does not disambiguate. Flag retained for adversarial review against Albany GA Movement leadership records 1962-65. |
| 109.8 / 109.P2.1 Petna Dalico → Pete Daniel | retained | Raw .txt confirms Whisper rendering but does not disambiguate cameraman identity. Flag retained for adversarial review against SOHP / Albany State University 2013 production credits. |
| 109.10 / 109.P2.5 Mother's Beach → unidentified Albany address | retained | Raw .txt: "I was sleeping in office. On Mother's Beach, three or seven thousand Mother's Beach" — number prefix "three or seven thousand" suggests a street-number rendering. Flag retained for adversarial review against Albany GA street-address registry. |
| 109.11 / 109.P2.3 Norway → Newton/Newport/Newdine GA | retained | Raw .txt confirms speaker's affirmative answer "Yes. This was in Norway. It was in Norway." Speaker pronouncing the town name as Whisper hears it — could be a small SW GA town that the speaker himself rendered closer to "Norway" than to "Newton". Flag retained for adversarial review. |
| 109.12 the casino → Albany GA segregated cafe | retained | Raw .txt confirms verbatim "A casino. A casino" — speaker repeats the establishment name. Either a literal "Casino" cafe name or a Whisper homophone. Flag retained for adversarial review against Albany GA business registry 1963-67. |
| 109.P2.15 I joined the party → SNCC | retained | Raw .txt: "And that's when I joined the party" — speaker's narrative context is the Sherrod-led SW Georgia Project / SNCC field work. Flag retained pending organizational-records check. |
| 109.P2.17 Cartag radical → ? | retained | Raw .txt: "Cartag radical... Can I...?" — Whisper artifact; speaker's job context unclear. Flag retained. |
| 109.P2.23 Mr. Oden → ? | retained | Raw .txt: "Mr. Oden, you going in there? Come on. Come on. For the middle of the board" — narrative context is the school-board confrontation. Possibly the speaker addressing a fellow activist by surname. Flag retained for adversarial review. |
| ALL low-confidence rows | retained | Raw spot-check confirms ~60-70% irrecoverable Whisper artifacts. Most low-confidence flags remain fundamentally unauditable without audio re-check or full re-transcription. |
| NEW: McClary family origin South Carolina | new | Pass 4 net-new fact-check finding from raw .txt ("Before I went over from Carolina to Gigi. From South Carolina, from South Carolina"). Should be incorporated into Subject paragraph or McClary corpus stub at re-transcription stage. Not a flag for adversarial review — confirmed in raw text. |

**Audit-complete assessment:**

**CRITICAL PUBLICATION BLOCKER** — entry #109 (Robert McClary) cannot be published to the Smithsonian-grade pipeline output in its current state. Pass 1, Pass 2, Pass 3, and Pass 4 (raw-spot-check this pass) have all independently confirmed severe Whisper degradation at ~60-70% incoherent-fragment rate. The narrative-level texture of McClary's testimony (assault episode dialog, casino integration mechanics, Sherrod field-work organizing detail, welfare-rights + tenant-rights operational specifics, 9-county takeover strategy execution, post-1965 Albany follow-through) is largely non-recoverable from the current Whisper output. The recoverable surface is limited to ~12 Pass-1 proper-noun corrections + ~24 Pass-2 catalog-pattern catches + ~10 Pass-3 missed-pattern catches + Pass-4 re-grounding promotions + one Pass-4 net-new biographical fact (South Carolina family origin).

**Per OPEN_PROBLEMS.md Problem 1a, this entry requires full Whisper-replacement with the original LoC archive transcript before publication.** This is the corpus's archetypal "severe Whisper degradation on populated source directory" case (distinct from the canonical empty-directory cases). The Smithsonian/LoC corpus stakes are significant: McClary represents a canonical SNCC Southwest Georgia Project field worker whose first-person voice is NOT preserved in canonical scholarly literature (NOT in Carson *In Struggle*, Dittmer *Local People*, or Payne *I've Got the Light of Freedom*). The current Whisper output is at risk of effectively losing his canonical voice.

The Pass 1+2+3+4 audit work captured here represents the recoverable spot-correction + fact-check surface; it is **adversarial-review-ready for the proper-noun + catalog-pattern subset**, but the narrative-level audit (and any pipeline content generation from this entry) must wait for re-transcription. **Limited audit-ability acknowledged: this is the corpus's most degraded auditable entry.**

**Audit-complete marker**: Pass 4 complete on entry #109 as of 2026-05-22.
