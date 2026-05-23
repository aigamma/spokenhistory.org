# Layer 5 fidelity findings — entry #52 Gwendolyn M. Patton

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 21 (0 canonical-figure / 21 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 15 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 0 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `52.10` | Pass 1 | Gen. Chappy James | Gen. Daniel "Chappie" James Jr. | 0.0 | low-impact |
| `52.11` | Pass 1 | Gen. Benjamin O. Davis | Gen. Benjamin O. Davis Jr. | 0.0 | low-impact |
| `52.20` | Pass 1 | Inxter, Michigan | Inkster, Michigan | 0.0 | low-impact |
| `52.29` | Pass 1 | TV at home | (Tuskegee TIAL liberated zone) | 0.0 | low-impact |
| `52.P2.17` | Pass 2 | Lawrence Howard graduates Tuskegee Airman | Tuskegee Airmen graduates | 0.0 | low-impact |
| `52.P2.18` | Pass 2 | Gen. Chappy James | Gen. Daniel "Chappie" James Jr. | 0.0 | low-impact |
| `52.P2.19` | Pass 2 | Gen. Benjamin O. Davis | Gen. Benjamin O. Davis Jr. | 0.0 | low-impact |
| `52.P2.65` | Pass 2 | Inxter, Michigan | Inkster, Michigan | 0.0 | low-impact |
| `52.P2.67` | Pass 2 | the dunger-reased / dungerees | dungarees (denim work pants) | 0.0 | low-impact |
| `52.P2.70` | Pass 2 | Frank Johnson injunction | Judge Frank M. Johnson Jr.'s injunction | 0.0 | low-impact |
| `52.P2.72` | Pass 2 | George Davis from Providence, Rhode Island | George Davis (TIAL co-organizer) | 0.0 | low-impact |
| `52.P2.79` | Pass 2 | Dr. Luther H. Foster | Dr. Luther H. Foster Jr. (Tuskegee president 1953-81) | 0.0 | low-impact |
| `52.P2.100` | Pass 2 | the $1199 union | 1199 SEIU (Service Employees International Union Local 1199) | 0.0 | low-impact |
| `52.P2.101` | Pass 2 | Bettina Atthaca's father | Herbert Aptheker | 0.0 | low-impact |
| `52.P2.107` | Pass 2 | the Mississippi staff (cross-reference) | the SNCC Mississippi staff | 0.0 | low-impact |
| `52.P2.108` | Pass 2 | Bobby Kennedy (journal general at the time) | Robert F. Kennedy (Attorney General) | 0.0 | low-impact |
| `52.P2.110` | Pass 2 | Turnaround Tuesday | Turnaround Tuesday (March 9, 1965) | 0.0 | low-impact |
| `52.P2.115` | Pass 2 | her broken leg | Patton's broken leg (1967 car accident) | 0.0 | low-impact |
| `52.P3.3` | Pass 3 | Carver references chain | Dr. George Washington Carver | 0.0 | low-impact |
| `52.P4.8` | Pass 4 | "Bookertea / Book of Tea Washintern" recurring variant | Booker T. Washington (in retrospect) | 0.0 | low-impact |
| `52.P4.15` | Pass 4 | "$199 union" (transcript-end variant) | 1199 SEIU | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | SNCC (Student Nonviolent Coordinating Committee) | SNCC (Student Nonviolent Coordinating Committee) | 2 | 22 |
| ? | James Forman | James Forman | 2 | 10 |
| ? | James Forman (Jim Forman) | James Forman (Jim Forman) | 2 | 10 |
| ? | Sammy Younge Jr. | Samuel Younge Jr. | 2 | 6 |
| ? | SNCC / SNCC people | SNCC / SNCC people | 2 | 5 |
| ? | Freedom Riders | Freedom Riders | 2 | 5 |
| ? | Mrs. Eleanor Roosevelt | Mrs. Eleanor Roosevelt | 2 | 3 |
| ? | Robert F. Kennedy (Attorney General) | correct | 3 | 3 |
| ? | Joe Mosnier of the Southern Oral History Program | Joe Mosnier (Southern Oral History Program / UNC) | 2 | 2 |
| ? | Mother's Day Massacre May 14, 1961 (likely) | Mother's Day Massacre May 14, 1961 (likely) | 2 | 2 |
| ? | Aunt Chick / Aunt Flora | Aunt Chick / Aunt Flora | 2 | 2 |
| ? | Aunt Chick / Aunt Flora | Aunt Chick / Aunt Flora | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

*(no D3 catalog-vs-per-entry contradictions for this entry)*


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **21 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 52. Gwendolyn M. Patton` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
