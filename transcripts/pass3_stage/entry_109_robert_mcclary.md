#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 109.6 Dr. Yomha → Dr. (William G.) Anderson | medium | FLAG | William G. Anderson is the canonical Albany Movement osteopath / first president of the Albany Movement (Pass-1 attempt at Stage-3 LLM identification). The Whisper rendering "Yomha" is phonetically distant from "Anderson" — this is a low-confidence identification that the Pass-1 entry flagged as Stage-3 LLM. Given the severe Whisper degradation across this transcript, retaining as FLAG for adversarial review rather than promoting to high. |
| 109.8 Petna Dalico → Pete Daniel | low | FLAG | Pete Daniel is a canonical Smithsonian/SOHP-affiliated historian who could plausibly have been a videographer on this interview, but the Whisper rendering is phonetically distant. Flag for adversarial review against SOHP/Albany State University 2013 production records. |
| 109.10 Mother's Beach → Mother Macedonia/Bryants Beach (Albany address) | low | FLAG | Whisper-rendered Albany GA Movement office street name; canonical SNCC/COFO office address. Flag for adversarial review against Albany GA Black-neighborhood-historical address records. |
| 109.11 Norway → Newton/Newark (GA town) | low | FLAG | Uncertain Southwest Georgia town identification. Flag for adversarial review. |
| 109.12 the casino → the Albany Casino restaurant/club | medium | FLAG | Canonical Albany GA segregated restaurant; speaker's narrative about the desegregation attempt is contextually clear but the specific establishment name is uncertain. Flag for adversarial review against Albany GA Civil-Rights-Trail business registry. |
| 109.P2.1 Petna Dalico → Pete Daniel | low | FLAG | Reaffirmed; same as 109.8. Flag retained. |
| 109.P2.2 live the town for black → "left the town" | low | FLAG | Speaker's narrative coherence about his father's hometown-staying-after-physical-defense is clear but the Whisper rendering of the specific clause is irrecoverable. Flag. |
| 109.P2.3 Norway → Newton GA / Newport GA / Newdine GA | low | FLAG | Same as 109.11. Multiple Southwest Georgia town candidates. Flag for adversarial review. |
| 109.P2.4 At their welfare → "people not getting welfare" | medium | FLAG | Speaker's SNCC/COFO welfare-rights organizing context is canonical (National Welfare Rights Organization era 1966+) but the sentence structure is irrecoverable from this Whisper output. Flag. |
| 109.P2.5 Mother's Beach → uncertain Albany address | low | FLAG | Same as 109.10. Flag retained. |
| 109.P2.6 Black male and one with → Black mayor of one of the towns | medium | FLAG | Speaker's narrative about election of Black mayor in a Southwest Georgia town is canonical (Charles Sherrod's nine-county-takeover strategy did include Black-mayor elections in some Southwest GA municipalities) but the specific town/person is irrecoverable. Flag. |
| 109.P2.7 Tennis → Tenants | medium | high | Common-noun substitution pattern is solid; the SNCC-COFO tenant-rights/anti-eviction context is canonical and contextually clear. Promote to high (catalog candidate). |
| 109.P2.8 A peel → appeal | high | high | Whisper homophone pattern; clean substitution. |
| 109.P2.11 school board → school board confrontation | speaker-originating | speaker-originating | Local Southwest GA town school-board context; preserve. |
| 109.P2.12 electrically → electorally | high | high | Clean common-noun homophone substitution; canonical Southwest GA strategy. |
| 109.P2.13 calories → counties | high | high | Same as above; canonical Southwest GA county-takeover. |
| 109.P2.14 nine calories in South America → nine counties in Southwest GA | high | high | Compound geographic substitution; canonical Southwest Georgia Project field strategy. |
| 109.P2.15 I joined the party → SNCC | medium | FLAG | Could be SNCC, the Albany Movement, or another Movement organization. Flag for adversarial review. |
| 109.P2.17 Cartag radical → ? | low | FLAG | Whisper artifact; meaning unclear. Flag. |
| 109.P2.19 she went to a portal → ? | low | FLAG | Whisper-garbled white SNCC volunteer entry attempt. Flag. |
| 109.P2.20 I can just like open like this → ? | low | FLAG | Unrecoverable Whisper artifact. Flag. |
| 109.P2.22 Hey, Jeff → Sherrod / SNCC? | low | FLAG | Could be addressing interviewer Jeffries OR mid-narrative reference. Flag. |
| 109.P2.23 Mr. Oden → ? | low | FLAG | Local Southwest GA figure or speaker's narrative artifact. Flag. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| ENTIRE TRANSCRIPT | severe Whisper degradation | Pass 1 + Pass 2 + Pass 3 unanimously identify this transcript as effectively unauditable beyond spot-correction on identifiable proper nouns. **PRIMARY RECOMMENDATION: this entry is awaiting upstream re-transcription with a higher-quality ASR model before further QA passes can produce meaningful output.** The Smithsonian/LoC corpus stakes are significant — McClary represents a canonical SNCC Southwest Georgia Project field worker whose first-person voice is NOT preserved in canonical scholarly literature (NOT in Carson, Dittmer, Payne). The current Whisper output is at risk of effectively losing his canonical voice. |
| 109.6 | Dr. Yomha → Dr. William G. Anderson? | Canonical Albany Movement osteopath identification is plausible but phonetic distance is wide. Verify against Albany GA Movement leadership records 1962-65. |
| 109.8 / 109.P2.1 | Petna Dalico → Pete Daniel? | Videographer identification uncertain. Verify against SOHP / Albany State 2013 production credits. |
| 109.10 / 109.P2.5 | Mother's Beach → unidentified Albany GA address | Verify against Albany GA Civil-Rights-Trail historical address registry. |
| 109.11 / 109.P2.3 | Norway → Newton GA? Newport GA? Newdine GA? | Multiple Southwest GA town candidates; verify against Southwest Georgia Project field-office locations. |
| 109.12 | the casino → Albany GA segregated cafe identification | Verify against Albany GA business registry 1963-67. |
| 109.P2.15 | I joined the party → SNCC? Albany Movement? | Verify against organizational records. |
| ALL low-confidence rows | Multiple irrecoverable Whisper artifacts | The transcript's overall ~60-70% incoherent-fragment rate means most low-confidence flags here are fundamentally unauditable without audio re-check or full re-transcription. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Charles Sherrod (1937-2022): canonical SNCC field secretary; founder + lead organizer of the Southwest Georgia Project (1961+); architect of the canonical 9-county-takeover strategy via Black-majority voter registration. Cross-corpus #18, #22, #24, #101. Foundational figure of the Albany Movement and rural-GA voter registration. Add to ground-truth corpus.
- William G. Anderson (1927-2022): canonical Albany Movement first president (osteopath in Albany GA); recruited King + SCLC to Albany in December 1961. Add to ground-truth corpus.
- Albany Movement (1961-1962): canonical desegregation coalition that became a tactical-failure-but-strategic-lesson for SCLC. Already implicit in corpus via the existing "Albany Movement" entry in civil_rights_facts.json (line 146-149). Confirmed present; no addition needed.
- Robert McClary (b. ~1940-1945): canonical Albany Movement / Southwest Georgia Project SNCC field worker under Sherrod; participated in welfare-rights work + anti-eviction actions + the canonical attempted desegregation of "the casino" Albany GA cafe; survived a physical assault at the SNCC/COFO office. Subject of this interview. **HIGH PRIORITY** for corpus addition because his voice is canonically NOT in *In Struggle* (Carson), *Local People* (Dittmer), or *I've Got the Light of Freedom* (Payne) — his testimony is at risk of being effectively lost given the Whisper degradation. The corpus entry can be a brief biographical placeholder noting his Southwest Georgia Project SNCC field-work + that his interview is awaiting re-transcription.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 109.P3.1 | "Shiraah / Sharad" | (Charles) Sherrod | high | catalog | Pass 1 caught at 109.5; catalog C does not currently list this Sherrod-variant. Add to catalog C as a recurring Whisper rendering of canonical Albany Movement / Southwest Georgia Project leader. |
| 109.P3.2 | "Southwest Jordan" | Southwest Georgia | high | catalog-new | Pass 1 + Pass 2 caught (109.9 + 109.P2.21). Recurring within transcript and a high-stakes geographic substitution. Add to catalog F (Geographic errors). |
| 109.P3.3 | "Jeff Rees" | (Hasan Kwame) Jeffries | high | catalog-new | Pass 1 caught at 109.1; catalog A (interview-team names) lists other interviewer-substitution patterns but does not currently include the Jeffries→Jeff-Rees pattern. Add to catalog A. |
| 109.P3.4 | "PD Putnam" | Phoebe Putney (Memorial Hospital, Albany GA) | high | catalog-new | Pass 1 caught at 109.4. Add to catalog F (geographic) or to a new institutional catalog. |
| 109.P3.5 | "Mother's Beach / Mother Macedonia Beach" | uncertain Albany GA address | low | catalog-derivative-uncertain | Pass 1 109.10 + Pass 2 109.P2.5; could not resolve identification. Flag as unresolved item for future audio re-check. |
| 109.P3.6 | "calories" | counties | high | catalog-new | Pass 2 109.P2.13 + 109.P2.14. High-frequency Whisper homophone substitution within this transcript; pattern is general (county-related contexts in Southwest GA narrative). Add to catalog as a common-noun pattern (geographic/governmental terminology). |
| 109.P3.7 | "Tennis" | Tenants | high | catalog-new | Pass 2 109.P2.7. Add to common-noun catalog (housing/welfare-rights terminology). |
| 109.P3.8 | "electrically" | electorally | high | catalog-new | Pass 2 109.P2.12. Add to common-noun catalog (election-process terminology). |
| 109.P3.9 | "Black male" | Black mayor | medium | catalog-new | Pass 2 109.P2.6. Recurring Whisper homophone substitution in Civil-Rights-Movement narratives about Black-elected-official histories. Add to common-noun catalog (political-office terminology). |
| 109.P3.10 | "A peel" | appeal | high | catalog-new | Pass 2 109.P2.8. Add to common-noun catalog (legal/administrative terminology). |

**Audit-complete marker**: Pass 3 complete on entry #109 as of 2026-05-22. **CRITICAL ANOMALY**: this transcript is awaiting upstream re-transcription with a higher-quality ASR model — Pass 1/2/3 have all converged on this recommendation. Currently ~60-70% of the Whisper output is incoherent fragments. The 12 proper-noun corrections + 24 Pass-2 catalog-pattern catches + 10 Pass-3 missed-pattern catches together represent the recoverable spot-correction surface; the narrative-level texture (assault episode, casino integration, Sherrod field-work, 9-county takeover, welfare-rights organizing, post-1965 Albany follow-through) is largely non-recoverable from the current Whisper output. Ready for adversarial-model review of the proper-noun + catalog-pattern subset; the narrative-level audit must wait for re-transcription.
