# Layer 5 fidelity findings — entry #63 John Churchville

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 13 (0 canonical-figure / 13 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 11 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 0 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `63.5` | Pass 1 | Marcus Govy | Marcus Garvey | 0.0 | low-impact |
| `63.6` | Pass 1 | Paul Roberson | Paul Robeson | 0.0 | low-impact |
| `63.8` | Pass 1 | Mosque #7 / 116th Street | Mosque #7 / 116th Street NOI Mosque | 0.0 | low-impact |
| `63.19` | Pass 1 | Greenwood Mississippi Kofo Freedom School | Greenwood MS COFO Freedom School | 0.0 | low-impact |
| `63.30` | Pass 1 | Michaux's bookstore | Michaux's National Memorial African Bookstore | 0.0 | low-impact |
| `63.P2.6` | Pass 2 | the police commissioner (Frank Rizzo) | Frank L. Rizzo | 0.0 | low-impact |
| `63.P2.27` | Pass 2 | Mosque #7 / 116th Street | Mosque #7 / 116th Street NOI Mosque | 0.0 | low-impact |
| `63.P2.28` | Pass 2 | Michaux's bookstore | Lewis Michaux's National Memorial African Bookstore | 0.0 | low-impact |
| `63.P2.33` | Pass 2 | Greenwood Mississippi Kofo Freedom School | Greenwood MS COFO Freedom School | 0.0 | low-impact |
| `63.P2.40` | Pass 2 | the 1964 North Philadelphia riot | 1964 Philadelphia race riot (August 28-30, 1964) | 0.0 | low-impact |
| `63.P2.63` | Pass 2 | Selma to Montgomery | Selma to Montgomery March (March 1965) | 0.0 | low-impact |
| `63.P2.64` | Pass 2 | Black People's Unity Movement police raid (August 13, 1966) | BPUM Freedom Library August 13 1966 police raid | 0.0 | low-impact |
| `63.P4.24` | Pass 4 | "Selma to Montgomery... that was on the way back from Montgomery after the summe | Viola Liuzzo (March 25, 1965 murder en route to Selma after the march) | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Joe Mosnier | Joe Mosnier | 2 | 24 |
| ? | SNCC (Student Nonviolent Coordinating Committee) | SNCC (Student Nonviolent Coordinating Committee) | 2 | 22 |
| ? | Elijah Muhammad | Honorable Elijah Muhammad | 2 | 2 |
| ? | Dunnoway (Lee County sheriff; spelling unverified) | Dunnoway (Lee County sheriff; spelling unverified) | 2 | 2 |
| ? | Elijah Muhammad | Elijah Muhammad | 2 | 2 |
| ? | Mrs. Maines / Mrs. Corn / Mrs. Freed (T.M. Pierce teachers) | Mrs. Maines / Mrs. Corn / Mrs. Freed (T.M. Pierce teachers) | 2 | 2 |
| ? | Casimiro Pereira (police plant; spelling unverified) | Casimiro Pereira (police plant; spelling unverified) | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

*(no D3 catalog-vs-per-entry contradictions for this entry)*


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **13 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 63. John Churchville` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
