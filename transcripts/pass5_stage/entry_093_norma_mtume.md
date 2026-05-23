# Layer 5 fidelity findings — entry #93 Norma Mtume

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 4 (0 canonical-figure / 4 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 4 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 7 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `93.20` | Pass 1 | Bunchy Carter people's Greek clinic / Bunchy Carter People's Free Medical Clinic | Bunchy Carter People's Free Medical Clinic | 0.0 | low-impact |
| `93.P2.64` | Pass 2 | "Newton-ordered killing-the-prosecution-witness operation" | Crystal Gray prosecution-witness incident 1974 | 0.0 | low-impact |
| `93.P3.7` | Pass 3 | "Slausons" (canonical pre-BPP LA Black gang) | Slausons | 0.0 | low-impact |
| `93.P3.11` | Pass 3 | "Crystal Gray prosecution-witness incident 1974" + BPP late-era exit | canonical late-BPP episode | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | California Institution for Women, Frontera | California Institution for Women, Frontera | 2 | 3 |
| ? | Dr. (Henry) Shapiro | Dr. (Henry) Shapiro | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `93.25` | Frontier, California | Frontera, California | California Institution for Women, Frontera (Chino CA) | F-ext |  |
| `93.P2.37` | "Cofu" / "Snake" / "Snick" SNCC pattern check | n/a (not in this transcript) | COFO (Council of Federated Organizations) | B |  |
| `93.P2.39` | "Memograph" / "Memo" pattern check | n/a (not in this transcript) | mimeograph | G |  |
| `93.P2.43` | "Larry Gassett" check | n/a (not in this transcript) | Larry Gossett (UW BSU; King County Council) | D |  |
| `93.P2.44` | "Mao Zai-Tung" / "Mao" pattern check | n/a (not in this transcript) | Catalog #D cluster: Che Guevara / Mao Zedong / Malcolm X | M-ext |  |
| `93.P2.45` | "Chagavera" / "Che" check | n/a (not in this transcript) | Che Guevara | D |  |
| `93.P2.46` | "MacMex" / "Malcolm X" check | n/a (not directly named in this transcript) | Malcolm X | D |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **4 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 93. Norma Mtume` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
