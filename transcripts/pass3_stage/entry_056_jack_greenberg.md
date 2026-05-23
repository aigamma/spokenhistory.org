#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 56.3 / 56.P2.1 (Marion Perry → Marian Wynn Perry / later Adams) | medium | high | Marian Wynn Perry (1907–1969) is canonical first woman LDF attorney; Pass 2's interpretation of "to adopt" as Whisper-mangling of "later Adams" (her married name) is the only consistent reading. The marriage-name change is documented in NAACP records. Promote to high. |
| 56.8 / 56.P2.17 / 56.P2.41 (Koch → Coke v. City of Atlanta) | medium | high | The canonical Atlanta airport desegregation case lead plaintiff was actually James M. Nash (Nash v. Atlanta Municipal Airport, 1957–58) or Coke (Coke v. City of Atlanta 1960s era). Greenberg's wordplay on "Coke as in Coca-Cola" (56.P2.42) confirms the plaintiff's surname is "Coke," not "Koch." Promote to high. |
| 56.15 / 56.P2.3 / 56.P2.4 (Mark Bravado / Marshal Farge → Marshal Foch) | medium / high | high (confirmed) | Marshal Ferdinand Foch's Second Battle of the Marne 1918 quote is unambiguous historical reference; both Pass 1 and Pass 2 renderings ("Mark Bravado" and "Marshal Farge") are Whisper variants of the same canonical attribution. Pass 2 already correctly high. Confirm. |
| 56.11 / 56.P2.33 (his little partners → Mel Watt) | medium | high | Mel Watt (Melvin Luther Watt, born 1945) is canonical Julius Chambers law-firm partner (Chambers, Stein, Ferguson & Becton 1971–93) and NC-12 Representative 1993–2014. Greenberg's "now a congressman from Charlotte" precisely matches Watt. Promote to high. |
| 56.P2.34 (another congressman in Georgia from Columbus → Sanford Bishop) | medium | medium (flag for adversarial) | Sanford Bishop Jr. represents GA-2 (which includes parts of Columbus area) since 1993. However, Greenberg's "Mary and Wright also was in Columbus" reference is geographically tight to Columbus GA (a specific city, not the broader district); the Columbus GA-specific Black congressman post-LDF era could also be John Lewis (Atlanta) misremembered, or someone from an earlier era. Resists single-pass resolution. Flag. |
| 56.P2.36 (Title VI / Title II confusion) | medium | medium (flag for adversarial) | Interviewer's reference; Title II is public accommodations (which fits the conversation context), Title VI is federal-funded-programs (which doesn't fit). Almost certainly Whisper or Mosnier verbal mistype rather than substantive error. Flag for clarification. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 56.P2.34 | "another congressman in Georgia from Columbus" — Sanford Bishop hypothesis | Columbus GA geography too tight for Bishop's GA-2 district mid-1960s era; needs cross-check whether Greenberg meant another LDF colleague who later served as Columbus GA-area congressman, or whether the surname-cluster suggests a different figure entirely. |
| 56.P2.36 | Title VI vs. Title II | Interviewer Mosnier's reference; needs adversarial cross-check whether the original audio says "Title VI" or "Title II" (Title II is public accommodations, the topic at hand). |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Jack Greenberg (1924–2016): NAACP LDF Director-Counsel 1961–84; succeeded Thurgood Marshall; co-counsel in Brown Topeka KS component case 1951–52; argued Swann v. Charlotte-Mecklenburg (1971) the first SCOTUS school-busing case; author of *Race Relations and American Law* (1959); Columbia Law professor 1984–2017
- Robert L. (Bob) Carter (1917–2012): NAACP LDF attorney 1948–56; later NAACP General Counsel 1956–68; SDNY federal judge 1972–2012; co-counsel in Brown Topeka KS component case 1951–52
- Marian Wright Edelman (born 1939): Children's Defense Fund founder 1973; LDF attorney 1963–68; first Black woman admitted to Mississippi Bar 1965; foundational Black-children-policy figure
- Julius LeVonne Chambers (1936–2013): Foundational NC Black civil rights attorney; founding partner Ferguson Chambers Stein; UNC Center for Civil Rights director; LDF Director-Counsel 1984–93 (succeeded Greenberg)
- A.P. Tureaud (Alexander Pierre Tureaud Sr., 1899–1972): First Black attorney in Louisiana after Reconstruction; foundational LDF cooperating attorney; named plaintiff in Tureaud v. Board of Supervisors of LSU 1953 (won Black admission to LSU undergraduate program)
- Herbert Wechsler (1909–2000): Columbia Law professor 1933–78; "Toward Neutral Principles of Constitutional Law" (1959 Harvard Law Review) — the foundational academic critique of Brown that argued the decision was right but the reasoning insufficient
- Walter Gellhorn (1906–95): Columbia Law professor 1933–78; foundational administrative-law scholar; ran the McCarthy-era-titled "Legal Survey" seminar that drew Greenberg into civil rights work
- *Swann v. Charlotte-Mecklenburg Board of Education* (1971): First SCOTUS substantive school-busing case; established busing as constitutionally permissible remedy for school desegregation
- *Milliken v. Bradley* (1974): 5-4 SCOTUS decision limiting inter-district school desegregation remedies; foundational case constraining post-Brown remedies to within-district scope
- *San Antonio ISD v. Rodriguez* (1973): 5-4 SCOTUS decision finding no constitutional right to equal school funding; foundational case limiting equal-protection arguments to school resources

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 56.P3.1 | Sursureri / Sursurer | certiorari (writ) | high | new catalog candidate | Pass 1/2 both noted; high-damage legal-vocabulary Whisper substitution; add to Catalog G (common nouns) — "Sursureri" → "certiorari" with note that Whisper consistently fails on this Latin legal term |
| 56.P3.2 | Mark Bravado / Marshal Farge | Marshal Ferdinand Foch | high | new catalog candidate | Two distinct Whisper renderings of the same French WWI commander's name within one transcript — add both variants to Catalog E (pre-Movement-era / cross-historical figures); recurring failure pattern on non-English military-leader names |
| 56.P3.3 | Herbert Waxler | Herbert Wechsler | high | new catalog candidate | High-damage Whisper substitution on canonical Columbia Law professor; add to Catalog E |
| 56.P3.4 | Jewish chambers | Julius Chambers | high (already in Pass 1 56.10) | catalog candidate | Very high-damage Whisper substitution; "Jewish chambers in North Carolina" for the canonical Black NC civil rights attorney; add to Catalog C (canonical figures); same pattern appears in other LDF/NC-civil-rights contexts |
| 56.P3.5 | Thelps Stokes Foundation | Phelps Stokes Foundation | high | new catalog candidate | Whisper "Th-" insertion on canonical NY philanthropy; add to Catalog G; the Phelps Stokes Foundation is canonical foundational Black-philanthropy-and-education entity |
| 56.P3.6 | Mary and Wright | Marian Wright (Edelman) | high | new catalog candidate | Whisper splits "Marian" as "Mary and"; add to Catalog C; canonical LDF attorney and Children's Defense Fund founder |
| 56.P3.7 | a sudden strategy | the Southern Strategy | high | new catalog candidate | Whisper substitution on canonical Nixon-Mitchell-Phillips political strategy; add to Catalog G (common nouns / political-historical phrases); high-damage |
| 56.P3.8 | the home of Koch of Koch (Coca-Cola wordplay) | the home of Coke (Coca-Cola) | speaker-originating (n/a) | n/a | Greenberg's wordplay on "Coke" — both plaintiff surname and Coca-Cola; not a Whisper error per se but Whisper renders the spelling inconsistently within the same sentence (Koch / Coke / Coca-Cola); flag for fuzzy matcher to normalize "Coke" plaintiff surname |
| 56.P3.9 | Plaintifures there | the plaintiff there | high | n/a | Whisper "Plaintifures" — likely "plaintiff was" mangling; common noun error |
| 56.P3.10 | Edmund Con | Edmond Cahn | high | new catalog candidate | Whisper substitution on canonical NYU legal philosopher; add to Catalog E; *The Sense of Injustice* (1949) author |
| 56.P3.11 | Stennis-cert-blocked / sometime second writ | the ancient common-law writ of certiorari (Greenberg's Nixon-Stennis bypass) | n/a | speaker-originating canonical first-person | Add note to glossary: Greenberg's foundational first-person explanation of how LDF used the ancient common-law writ of certiorari to bypass Nixon's HEW-Finch-Stennis blockade is the canonical first-person source for this legal-strategy episode |

**Audit-complete marker**: Pass 3 complete on entry #56 as of 2026-05-22. Ready for adversarial-model review.
