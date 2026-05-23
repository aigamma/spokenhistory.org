# Layer 5 fidelity findings — entry #35 Elbert "Big Man" Howard

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 0 (0 canonical-figure / 0 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 22 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 7 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

*(no D1 phantom-Whisper-rendering findings for this entry)*


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Sam Napier | Samuel White | 2 | 3 |
| ? | Catalog #D cluster: Che Guevara / Mao Zedong / Malcolm X | Malcolm X | 2 | 3 |
| ? | *Soul on Ice* | *Soul on Ice* | 2 | 3 |
| ? | Paris | Paris | 3 | 3 |
| ? | engaging in the war / the imperialist war | engaging in the war / the imperialist war | 3 | 3 |
| ? | Catalog #D cluster: Che Guevara / Mao Zedong / Malcolm X | Mao Zedong (Mao Tse-tung) | 2 | 3 |
| ? | Chattanooga, Tennessee | Chattanooga, Tennessee | 2 | 2 |
| ? | Che Guevara | Che Guevara | 2 | 2 |
| ? | mimeograph / mimeograph sheet | mimeograph / mimeograph sheet | 2 | 2 |
| ? | Stockholm | Stockholm | 2 | 2 |
| ? | Sam Napier | Sam Napier | 2 | 2 |
| ? | Sam Napier | Sam Napier | 2 | 2 |
| ? | American Indian Movement (AIM) | American Indian Movement (AIM) | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `35.2` | Santa, New York, Tennessee / Santa Tennessee / native of San | Chattanooga, Tennessee | "Santa, New York, Tennessee" (Pass-1 #35.2) | F-ext |  |
| `35.21` | stock home | Stockholm | Copenhagen / Stockholm / Paris | F-ext |  |
| `35.22` | parents | Paris | Copenhagen / Stockholm / Paris | F-ext |  |
| `35.25` | engin in their war | engaging in the war / the imperialist war | The imperialist war / the Vietnam War | K-ext |  |
| `35.P2.2` | American Indians movement | American Indian Movement (AIM) | Young Lords / AIM | D-ext |  |
| `35.P2.8` | enemy's war / engin in their war | the Vietnam War (US imperialist war framing) | The imperialist war / the Vietnam War | K-ext |  |
| `35.P3.1` | "Santa, New York, Tennessee" (Pass-1 #35.2) | Cross-corpus catalog candidate | Chattanooga, Tennessee | F |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **0 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 35. Elbert "Big Man" Howard` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
