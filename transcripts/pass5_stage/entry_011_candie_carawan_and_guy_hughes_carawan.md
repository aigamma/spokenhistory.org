# Layer 5 fidelity findings — entry #11 Candie Carawan and Guy Hughes Carawan

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 9 (0 canonical-figure / 9 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 22 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 1 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `11.6` | Pass 1 | Wells in Hand | Wayland Hand | 0.0 | low-impact |
| `11.36` | Pass 1 | Tom Paxton, Bella Oaks, Bob Dylan | Tom Paxton, Phil Ochs, Bob Dylan | 0.0 | low-impact |
| `11.42` | Pass 1 | Sing for Freedom workshops | *Sing for Freedom* (workshops) | 0.0 | low-impact |
| `11.P2.7` | Pass 2 | Mary E. Thindose / Jamila Mary Eath Thindose | Jamila Jones / Mary Ethel Dozier | 0.0 | low-impact |
| `11.P2.14` | Pass 2 | Bevel and Lafayette | James Bevel + Bernard Lafayette | 0.0 | low-impact |
| `11.P3.2` | Pass 3 | "Carleton exchange" / "Pomona-Fisk exchange" | Carleton-Pomona-Fisk-Carleton-Wesleyan-Spelman-Howard exchange | 0.0 | low-impact |
| `11.P3.4` | Pass 3 | "April 1960 conference at Highlander" | April 15-17, 1960 SNCC founding-period Highlander conference | 0.0 | low-impact |
| `11.P3.5` | Pass 3 | "Charles Tindley" not yet in catalog | Add as canonical figure | 0.0 | low-impact |
| `11.P4.22` | Pass 4 | "Carry It On" (the song title in master header) | Carry It On (Gil Turner song) | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Joe Mosnier | Joe Mosnier | 2 | 24 |
| ? | Wayland Hand | Wayland Hand | 2 | 2 |
| ? | Septima (Clark) / Septima Poinsette Clark | Septima (Clark) / Septima Poinsette Clark | 2 | 2 |
| ? | Septima (Clark) / Septima Poinsette Clark | Septima (Clark) / Septima Poinsette Clark | 2 | 2 |
| ? | Zilphia (Horton) | Zilphia (Horton) | 2 | 2 |
| ? | Fisk (University) | Fisk (University) | 2 | 2 |
| ? | Moe Asch | Moe Asch | 2 | 2 |
| ? | Mary Jane Pigee / Mrs. Pigee | Mary Jane Pigee / Mrs. Pigee | 2 | 2 |
| ? | Joan Boyd | Joan Boyd | 2 | 2 |
| ? | Fisk Exchange Program / Fisk University | Fisk Exchange Program / Fisk University | 2 | 2 |
| ? | Wayland D. Hand | Wayland D. Hand | 2 | 2 |
| ? | Carleton-Pomona-Fisk-Carleton-Wesleyan-Spelman-Howard exchan | Carleton-Pomona-Fisk-Carleton-Wesleyan-Spelman-Howard exchan | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `11.P4.27` | "Pomona-Fisk Exchange" / "fiscal change program" | Pomona-Fisk Exchange / Carleton Plan | Carleton-Pomona-Fisk-Carleton-Wesleyan-Spelman-Howard exchan | F-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **9 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 11. Candie Carawan and Guy Hughes Carawan` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
