# Layer 5 fidelity findings — entry #99 Purcell Maurice Conway

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 12 (0 canonical-figure / 12 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 20 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 0 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `99.P2.35` | Pass 2 | New York Post Office | NYC Post Office | 0.0 | low-impact |
| `99.P2.36` | Pass 2 | NYPD | NYPD (New York City Police Department) | 0.0 | low-impact |
| `99.P2.37` | Pass 2 | sergeant lieutenant promotional exams | NYPD sergeant-and-lieutenant promotional exam discrimination class action | 0.0 | low-impact |
| `99.P2.47` | Pass 2 | Bayfront Hilton | Bayfront Hilton Hotel | 0.0 | low-impact |
| `99.P2.56` | Pass 2 | Solomon Calhoun Center | Solomon Calhoun Community Center | 0.0 | low-impact |
| `99.P2.58` | Pass 2 | 40th anniversary / 40th accord movement | ACCORD (Accord Civil Rights Movement of Florida) | 0.0 | low-impact |
| `99.P2.62` | Pass 2 | Lyndon Johnson administration | Lyndon B. Johnson administration | 0.0 | low-impact |
| `99.P2.70` | Pass 2 | "ACCORD Freedom Trail" | ACCORD Freedom Trail | 0.0 | low-impact |
| `99.P2.72` | Pass 2 | 60s civil rights protest pattern in St. Augustine | canonical 1963-64 St. Augustine campaign | 0.0 | low-impact |
| `99.P2.74` | Pass 2 | Civil Rights Act, Civil Rights Bill | Civil Rights Act of 1964 | 0.0 | low-impact |
| `99.P2.76` | Pass 2 | college kids north / Mass college kids / from Princeton, Mass | (Northern white college students) — Princeton NJ + Massachusetts | 0.0 | low-impact |
| `99.P2.77` | Pass 2 | New York Post Office discrimination | NY USPS (1968-73 Conway employment) | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Hosea Williams | Hosea Williams | 2 | 10 |
| ? | Dr. (Robert B.) Hayling | Dr. Robert B. Hayling | 2 | 4 |
| ? | Southern Oral History Program | Southern Oral History Program | 2 | 4 |
| ? | St. Augustine Beach | St. Augustine Beach | 2 | 3 |
| ? | St. Augustine / St. Augustine Record | St. Augustine / St. Augustine Record | 2 | 3 |
| ? | St. Augustine / St. Augustine Record | St. Augustine / St. Augustine Record | 2 | 3 |
| ? | Tallahassee | Tallahassee | 2 | 3 |
| ? | St. Augustine / St. Augustine Record | St. Augustine / St. Augustine Record | 2 | 2 |
| ? | DCE / Diversified Cooperative Education | DCE / Diversified Cooperative Education | 2 | 2 |
| ? | Samuel White / James White | Samuel White / James White | 2 | 2 |
| ? | Samuel White / James White | Samuel White / James White | 2 | 2 |
| ? | Florida Memorial College | Florida Memorial College | 2 | 2 |


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

The annotations in the master MD's `### 99. Purcell Maurice Conway` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
