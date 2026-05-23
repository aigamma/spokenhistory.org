# Layer 5 fidelity findings — entry #129 William S. Leventhal

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 12 (0 canonical-figure / 12 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 19 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 0 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `129.P2.43` | Pass 2 | Deacons for Defense | Deacons for Defense and Justice | 0.0 | low-impact |
| `129.P2.96` | Pass 2 | wyatt T Walker | Wyatt Tee Walker | 0.0 | low-impact |
| `129.P2.140` | Pass 2 | Senator Charles Cogen | Charles Cogen (AFT national president 1964-68) | 0.0 | low-impact |
| `129.P2.141` | Pass 2 | Hoo-bre | J. Edgar Hoover | 0.0 | low-impact |
| `129.P2.185` | Pass 2 | Solidad (where Hugo Maxi paroled from) | Soledad State Prison | 0.0 | low-impact |
| `129.P2.187` | Pass 2 | Bob Singleton (freedom writer) | Robert Singleton | 0.0 | low-impact |
| `129.P2.191` | Pass 2 | the look magazine appeal Dr. King wrote | (MLK's posthumous *Look* magazine article on Resurrection City) | 0.0 | low-impact |
| `129.P2.204` | Pass 2 | Andrew Wally was killed (Marine bystander) | Andrew Whatley | 0.0 | low-impact |
| `129.P3.4` | Pass 3 | "the route to Selma / bridge to Selma" (129.P2.69) | "Bridge to Freedom" (Eyes on the Prize episode 6) | 0.0 | low-impact |
| `129.P3.6` | Pass 3 | "the Allman Brothers / Almond Brothers" (129.P2.62) Macon GA cultural context | The Allman Brothers Band | 0.0 | low-impact |
| `129.P3.7` | Pass 3 | "Med Gravers -> Medgar Evers" recurring catalog C entry | Medgar Evers | 0.0 | low-impact |
| `129.P4.11` | Pass 4 | "Reverend Walter Fontroy, Rand" | Rev. Walter Fauntroy / (Walter Fauntroy [office]) and [the] [other office in LA] | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Hosea Williams | Hosea Williams | 2 | 10 |
| ? | Lowndes County, Alabama | Lowndes County, Alabama | 3 | 7 |
| ? | Ralph Bunche | Ralph Bunche | 2 | 4 |
| ? | Hosea Williams | Hosea Williams | 2 | 4 |
| ? | Americus (Sumter County, Georgia) | Americus, Georgia | 2 | 3 |
| ? | Soledad State Prison (catalog #F entry) | Soledad State Prison (catalog #F entry) | 2 | 3 |
| ? | Sheriff Fred B. Chappell (Sumter County GA Sheriff) | Sheriff Fred Chappell | 3 | 3 |
| ? | Rev. Walter Fauntroy | Walter Fauntroy | 2 | 2 |
| ? | Gwen Green | Gwen (Robinson) Green | 2 | 2 |
| ? | Lowndes County, Alabama | Lowndes County (Alabama) | 2 | 2 |
| ? | Jane Seymour, Dr. Quinn (Medicine Woman) | Jane Seymour, Dr. Quinn (Medicine Woman) | 2 | 2 |
| ? | Almeda Lambert (?) and Diane McWhorter | Almeda Lambert (?) and Diane McWhorter | 2 | 2 |
| ? | (Mrs. Amelia) Boynton | (Mrs. Amelia) Boynton | 2 | 2 |
| ? | (likely) Ron McKee or similar — Mark McGuire's buddy | (likely) Ron McKee or similar — Mark McGuire's buddy | 2 | 2 |
| ? | Cheryl LaBatts (or similar SCOPE veteran historian) | Cheryl LaBatts (or similar SCOPE veteran historian) | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

*(no D3 catalog-vs-per-entry contradictions for this entry)*


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **12 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 129. William S. Leventhal` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
