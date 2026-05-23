# Layer 5 fidelity findings — entry #130 William Saunders

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 12 (0 canonical-figure / 12 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 15 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 0 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `130.3` | Pass 1 | Wadmalaw | Wadmalaw Island | 0.0 | low-impact |
| `130.39` | Pass 1 | Governor McNair | Governor Robert E. McNair | 0.0 | low-impact |
| `130.47` | Pass 1 | Henrietta Canty (repeat) | Henrietta Canty | 0.0 | low-impact |
| `130.51` | Pass 1 | Gullah | Gullah (language + culture) | 0.0 | low-impact |
| `130.52` | Pass 1 | Sea Island Sickle Cell | Sea Island Sickle Cell Anemia Program | 0.0 | low-impact |
| `130.57` | Pass 1 | Bowing Tac koma | Tacoma (Fort Lewis, Tacoma WA) | 0.0 | low-impact |
| `130.58` | Pass 1 | Tuskegee | Tuskegee Institute / University | 0.0 | low-impact |
| `130.59` | Pass 1 | Mali | Mali (West African country) | 0.0 | low-impact |
| `130.P2.10` | Pass 2 | Constituent School Board in District 9 | District 9 school board (Charleston County) | 0.0 | low-impact |
| `130.P2.54` | Pass 2 | the William Huffitz | William Huffitz | 0.0 | low-impact |
| `130.P2.59` | Pass 2 | Folly Beach (the canonical SLED-Saunders meeting site) | (motel near Folly Beach SC) | 0.0 | low-impact |
| `130.P2.83` | Pass 2 | American Folklife Center in the Library of Congress | American Folklife Center, Library of Congress | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Morris Brown AME Church (likely) | Morris Brown (College) | 2 | 2 |
| ? | Avery Normal Institute | Roman / Avery | 2 | 2 |
| ? | Cheryl LaBatts (possible) / unknown | Cheryl LaBatts (or similar SCOPE veteran historian) | 2 | 2 |
| ? | Black Muslim, Otis Robinson | Black Muslim, Otis Robinson | 2 | 2 |
| ? | Dr. Howard Levy | Dr. Howard Levy | 2 | 2 |
| ? | Dr. Howard Levy | Dr. Howard Levy | 2 | 2 |
| ? | Jim Clyburn (likely; James E. Clyburn) | Jim Clyburn (likely; James E. Clyburn) | 2 | 2 |
| ? | Rob Nell (likely Robin Talley or similar; or Bobby Bell) | Rob Nell (likely Robin Talley or similar; or Bobby Bell) | 2 | 2 |
| ? | Hugh Lane Sr. (likely repeat) | Hugh Lane Sr. (likely repeat) | 2 | 2 |


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

The annotations in the master MD's `### 130. William Saunders` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
