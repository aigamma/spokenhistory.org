# Layer 5 fidelity findings — entry #66 Joseph Echols Lowery

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 11 (0 canonical-figure / 11 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 21 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 6 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `66.20` | Pass 1 | Coresh | CORE | 0.0 | low-impact |
| `66.21` | Pass 1 | Cory | CORE | 0.0 | low-impact |
| `66.22` | Pass 1 | Snick | SNCC | 0.0 | low-impact |
| `66.23` | Pass 1 | the LC | SCLC | 0.0 | low-impact |
| `66.49` | Pass 1 | Brown Chapel (canonical full form) | Brown Chapel AME Church | 0.0 | low-impact |
| `66.56` | Pass 1 | ICDM | Interdenominational Ministerial Alliance | 0.0 | low-impact |
| `66.59` | Pass 1 | Coresh / Cresh | CORE | 0.0 | low-impact |
| `66.P2.3` | Pass 2 | Shuttlesworth and say | Shuttlesworth and Seay | 0.0 | low-impact |
| `66.P2.14` | Pass 2 | the Bronner's Chapel Selma 2007 commemoration | the Brown Chapel Selma 2007 commemoration | 0.0 | low-impact |
| `66.P2.19` | Pass 2 | drew up of the bus over | pull the bus over | 0.0 | low-impact |
| `66.P3.5` | Pass 3 | "the LC" → SCLC / "Coresh" / "Cory" → CORE pattern | SCLC / CORE | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Andrew Young | Andrew Young | 2 | 4 |
| ? | CORE | CORE | 2 | 3 |
| ? | bombs bursting in air | bombs bursting in air | 2 | 3 |
| ? | Baton Rouge | Baton Rouge | 2 | 2 |
| ? | CORE | CORE | 2 | 2 |
| ? | New Orleans | New Orleans | 2 | 2 |
| ? | Public Accommodations Act / Civil Rights Act of 1964 | Public Accommodations Act / Civil Rights Act of 1964 | 2 | 2 |
| ? | Star-Spangled Banner | Star-Spangled Banner | 2 | 2 |
| ? | Brown Chapel AME (Selma) | Brown Chapel AME (Selma) | 2 | 2 |
| ? | First Federal Reserve / first phase three numbers — uncertai | First Federal Reserve / first phase three numbers — uncertai | 2 | 2 |
| ? | an eye for an eye, or a tooth for a tooth | an eye for an eye, or a tooth for a tooth | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `66.14` | the battered | Baton Rouge | T.J. Jemison / Baton Rouge | B-ext |  |
| `66.20` | Coresh | CORE | SCLC / CORE | B-ext |  |
| `66.21` | Cory | CORE | SCLC / CORE | B-ext |  |
| `66.32` | dooleans | New Orleans | Mardi Gras / New Orleans | F-ext |  |
| `66.39` | Polar Commodation Act | Public Accommodations Act / Civil Rights Act of 1964 | Civil Rights Act of 1964 | L-ext |  |
| `66.59` | Coresh / Cresh | CORE | SCLC / CORE | B-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **11 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 66. Joseph Echols Lowery` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
