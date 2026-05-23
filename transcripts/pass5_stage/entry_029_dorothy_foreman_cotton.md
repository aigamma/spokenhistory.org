# Layer 5 fidelity findings — entry #29 Dorothy Foreman Cotton

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 2 (0 canonical-figure / 2 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 9 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 2 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `29.24` | Pass 1 | Final Luhamer | Fannie Lou Hamer | 0.0 | low-impact |
| `29.P3.9` | Pass 3 | "MLK + Eleanor Roosevelt billboard at Highlander" (29.P2.4) | canonical segregationist propaganda artifact | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | already in catalog section A | Joe Mosnier | 2 | 24 |
| ? | Hosea Williams | Hosea Williams | 2 | 10 |
| ? | Ms. Ella Baker (or Miss Ella Baker) | Ms. Ella Baker (or Miss Ella Baker) | 3 | 4 |
| ? | Reverend Ralph Abernathy (Rev. Ralph David Abernathy) | Reverend Abernathy | 2 | 4 |
| ? | Hosea Williams | Hosea Williams | 2 | 4 |
| ? | already in catalog section A | Southern Oral History Program | 2 | 4 |
| ? | Mrs. Eleanor Roosevelt | Mrs. Eleanor Roosevelt | 2 | 3 |
| ? | Bernard Lee | Bernard Lee | 2 | 2 |
| ? | Reverend Ralph Abernathy (Rev. Ralph David Abernathy) | Reverend Ralph Abernathy (Rev. Ralph David Abernathy) | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `29.P2.5` | Pittsburgh Improvement Association | Petersburg Improvement Association | Petersburg, Virginia | F |  |
| `29.P3.8` | "Joe Manier" / "Southern World History Program" (29.P2.1 / 2 | already in catalog section A | Joe Mosnier (Southern Oral History Program, UNC Chapel Hill) | A |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **2 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 29. Dorothy Foreman Cotton` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
