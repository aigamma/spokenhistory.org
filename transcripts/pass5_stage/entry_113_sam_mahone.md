# Layer 5 fidelity findings — entry #113 Sam Mahone

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 15 (0 canonical-figure / 15 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 12 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 0 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `113.3` | Pass 1 | America's Georgia / America's | Americus, Georgia | 0.0 | low-impact |
| `113.42` | Pass 1 | sticks | SNCC | 0.0 | low-impact |
| `113.P2.14` | Pass 2 | Sumter County | Sumter County (Georgia) | 0.0 | low-impact |
| `113.P2.22` | Pass 2 | stick rookers | SNCC workers | 0.0 | low-impact |
| `113.P2.25` | Pass 2 | Snake! | SNCC | 0.0 | low-impact |
| `113.P2.51` | Pass 2 | tire arms and tires | tire irons and tires | 0.0 | low-impact |
| `113.P2.52` | Pass 2 | the strain old sedition law | the Reconstruction-era anti-sedition law | 0.0 | low-impact |
| `113.P2.80` | Pass 2 | the Americas high | Americus High School | 0.0 | low-impact |
| `113.P2.98` | Pass 2 | the kkk | the KKK (Ku Klux Klan) | 0.0 | low-impact |
| `113.P2.111` | Pass 2 | get photo registered | get voter registered / get registered to vote | 0.0 | low-impact |
| `113.P2.120` | Pass 2 | Communification | Community Education | 0.0 | low-impact |
| `113.P3.1` | Pass 3 | "Civil Rights Act of 1964" reference (canonical July 2, 1964 signing — also rele | Civil Rights Act of 1964 (signed July 2, 1964 by LBJ) | 0.0 | low-impact |
| `113.P3.2` | Pass 3 | "Tougaloo (College)" scholarships to Mahone 1966 | Tougaloo College (Jackson MS HBCU) | 0.0 | low-impact |
| `113.P3.3` | Pass 3 | "Synectics" (cross-corpus #114) | Synectics (W.J.J. Gordon creative-problem-solving methodology, 1961+) | 0.0 | low-impact |
| `113.P3.5` | Pass 3 | "Pete Daniel" (cameraman) | Pete Daniel (Smithsonian / SOHP videographer + canonical "Deep'n As It Come" + * | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | SNCC (Student Nonviolent Coordinating Committee) | SNCC (Student Nonviolent Coordinating Committee) | 2 | 22 |
| ? | Tougaloo (College) | Tougaloo (College) | 2 | 3 |
| ? | Sheriff Fred Chappell | Sheriff Fred Chappell | 3 | 3 |
| ? | the Sumter County prison farm | the Sumter County prison farm | 2 | 3 |
| ? | SNCC | SNCC | 2 | 2 |
| ? | Mary Kate Bell Fishbel | Mary Kate Bell Fishbel | 2 | 2 |
| ? | South Georgia / Southwest Georgia | South Georgia / Southwest Georgia | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

*(no D3 catalog-vs-per-entry contradictions for this entry)*


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **15 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 113. Sam Mahone` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
