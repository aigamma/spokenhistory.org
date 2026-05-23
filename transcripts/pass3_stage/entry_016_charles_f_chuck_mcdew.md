#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 16.6 Ben Ferris -> Ben Fischer | medium | medium (kept) | "Ben Fischer" was a real USW (United Steelworkers) staffer in the mid-20th century, but without a Massillon-specific anchor in the transcript the phonetic match to "Ferris" is not conclusive. Could plausibly also be Ben Faries or a local Massillon labor figure. Recommend keeping at medium pending the user's adversarial-model pass. |
| 16.23 Reverend Ivory -> Rev. C.A. Ivory | medium (P1) -> high (P2 promoted) | high | Pass 2 already promoted to high via canonical-alias evidence (Rock Hill SC NAACP president during the Friendship Nine jail-no-bail). Confirmed: C.A. Ivory was paralyzed and used a wheelchair, was the canonical figure McDew worked with in early 1961. Resolution stands. |
| 16.37 Eldritch / Eldredge -> "(not in McDew transcript)" | n/a | n/a (housekeeping) | Pass 1 author flagged a cross-reference that turned out not to apply to this transcript. Row is procedural noise, not a correction; drop from final output. |
| 16.17 Sumter, South Carolina | correct | correct (kept) | Charles Gatson's hometown where McDew was first arrested over Thanksgiving 1959. Catalog F (Sumter / Sopta -> Sumter, South Carolina) confirms canonical spelling under correct attestation. |
| 16.22 Jail Nobel -> "Jail-no-bail" | high | high (kept) | Confirmed canonical SNCC tactical innovation pioneered at Rock Hill SC February 1961 by the Friendship Nine and Charles Jones / Diane Nash / Ruby Doris Smith / Mary Ann Smith / Charles Sherrod cohort. |

**Adversarial-review flags (for user's Kiro/Kimi/Codex/Gemini multi-model check):**

| Row | Item | Reason |
|---|---|---|
| 16.6 | Ben Ferris -> Ben Fischer | Confidence remains medium; no definitive disambiguation between Ben Fischer (USW), Ben Faries, or a local Massillon UAW/USW figure. Worth a second-model lookup. |
| 16.17.B (P2T new) | "Bluefield, West Virginia" framing | P2.6 logs this as the border-state community where McDew's father first showed him segregation. Worth verifying speaker context against canonical McDew biography (Lerone Bennett, Bloody Lowndes, etc.) to ensure not conflated with another border-state stop. |
| 16.18 Joan Bond / Mary Barry -> Marion Barry | high | The "Joan Bond" variant suggests Whisper conflated Julian Bond (SNCC comms) and Marion Barry (1st SNCC chair). Adversarial check should confirm McDew was speaking of Barry (succession context), not Bond. Context (#16.20 "succeeded by McDew Oct 1960") points unambiguously to Barry but worth a confirmation. |

**Ground-truth corpus candidates (figures to add to civil_rights_facts.json):**

- Charles F. "Chuck" McDew (1938-2018): Second chairman of SNCC (October 1960-1963), succeeding Marion Barry and preceding John Lewis. Architect of SNCC's strategic choice to organize voter registration in the Black Belt counties precisely because they were the political base of long-tenure Southern segregationist senators (Stennis, Eastland, Byrd, Talmadge). Foundational SNCC organizational-history figure missing from civil_rights_facts.json.
- Marion Barry (1936-2014): First chairman of SNCC (April-October 1960); later 4-term DC mayor. Foundational SNCC figure not in civil_rights_facts.json.
- Rev. C.A. Ivory: Rock Hill SC NAACP president and key local figure in the February 1961 Friendship Nine jail-no-bail action. Wheelchair-using minister whose home was the SNCC organizing base. Local but corpus-recurring (catalog C cross-ref pending).
- I. DeQuincey Newman: SC NAACP field director 1960-69; first Black SC state senator (1983-90). Foundational SC NAACP figure. Catalog E lists him; consider promoting to ground-truth corpus.

**Pass 3 missed-pattern catches:**

| # | Span | Correction | Confidence | Source | Context |
|---|---|---|---|---|---|
| 16.P3.1 | None - Pass 1/2 was exceptionally comprehensive for a 16KB transcript | n/a | n/a | n/a | The Pass 1 author identified all canonical-figure misattributions, all geographic substitutions (Massillon, Orangeburg, Sumter, Walthall, Amite, Pike), all senator references (Stennis/Eastland/Byrd/Talmadge), and all SW GA county references (Dougherty, Terrell, Baker). Pass 2 added the Bluefield WV detail and reinforced the speaker-name failure pattern. Tail-sweep not applicable (under-cap transcript). |

**Audit-complete marker**: Pass 3 complete on entry #16 as of 2026-05-22. Ready for adversarial-model review.
