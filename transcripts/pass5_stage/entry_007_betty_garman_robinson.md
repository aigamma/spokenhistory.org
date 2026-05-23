# Layer 5 fidelity findings — entry #7 Betty Garman Robinson

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 7 (0 canonical-figure / 7 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 16 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 3 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `7.31` | Pass 1 | the Boston, Massachusetts, MIT radiation lab | MIT Radiation Lab(oratory) | 0.0 | low-impact |
| `7.32` | Pass 1 | Ohio Wesleyan | Ohio Wesleyan (University) | 0.0 | low-impact |
| `7.39` | Pass 1 | Mississippi Greenwood office | (SNCC) Greenwood (Mississippi) office | 0.0 | low-impact |
| `7.P2.8` | Pass 2 | James Foreman | James Forman | 0.0 | low-impact |
| `7.P2.20` | Pass 2 | World festival in Helsinki | 8th World Festival of Youth and Students (Helsinki 1962) | 0.0 | low-impact |
| `7.P2.21` | Pass 2 | Wisconsin University NSA Congress | University of Wisconsin (Madison) NSA Congress 1961 | 0.0 | low-impact |
| `7.P2.26` | Pass 2 | Greenwood, Mississippi (Freedom Summer office) | Greenwood, MS Freedom Summer SNCC headquarters | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | SNCC (Student Nonviolent Coordinating Committee) | SNCC (Student Nonviolent Coordinating Committee) | 2 | 22 |
| ? | Jim Forman | James Forman (Jim Forman) | 2 | 10 |
| ? | Dinky Romilly (Constance "Dinky" Romilly) | Dinky Romilly (Constance "Dinky" Romilly) | 2 | 5 |
| ? | McComb, Mississippi | McComb, Mississippi | 2 | 4 |
| ? | Dinky Romilly | Dinky Romilly | 3 | 3 |
| ? | Mark Suckle (likely correct as the speaker's pronunciation,  | Mark Suckle (likely correct as the speaker's pronunciation,  | 2 | 3 |
| ? | Wilson Brown / Willie McCray | Wilson Brown / Willie McCray | 2 | 2 |
| ? | Locke / Rousseau / Hegel / Marx | Locke / Rousseau / Hegel / Marx | 2 | 2 |
| ? | Locke / Rousseau / Hegel / Marx | Locke / Rousseau / Hegel / Marx | 2 | 2 |
| ? | Becky Mills | Becky Mills | 2 | 2 |
| ? | Marion Barry (Marion S. Barry Jr.) | Marion Barry (Marion S. Barry Jr.) | 2 | 2 |
| ? | LD Pratt | LD Pratt | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `7.23` | Jim Foreman | Jim Forman (James Forman) | James Forman (SNCC executive secretary) | C |  |
| `7.24` | Dinky Romley / Dinky Romley Romley | Dinky Romilly (Constance "Dinky" Romilly) | Dinky Forman (Constance "Dinky" Romilly Forman) | C |  |
| `7.P2.7` | Dinky Romley / Dinky | Dinky Romilly | Dinky Forman (Constance "Dinky" Romilly Forman) | C |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **7 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 7. Betty Garman Robinson` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
