# Layer 5 fidelity findings — entry #78 Linda Fuller Degelmann

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 8 (0 canonical-figure / 8 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 40 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 10 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `78.37` | Pass 1 | Mbandaka, DRC | Mbandaka, Democratic Republic of the Congo (formerly Coquilhatville, Zaire) | 0.0 | low-impact |
| `78.40` | Pass 1 | Habitat for Humanity (1976 founding) + Fuller Center for Housing (2005) | (canonical org names) | 0.0 | low-impact |
| `78.43` | Pass 1 | 1971 Americus boycott | (canonical 1971 Americus boycott) | 0.0 | low-impact |
| `78.P2.36` | Pass 2 | first Baptist church in America... on Leastry in America's sand | First Baptist Church Americus on Lee Street in Americus | 0.0 | low-impact |
| `78.P2.56` | Pass 2 | Mars D's | Morris Dees | 0.0 | low-impact |
| `78.P2.71` | Pass 2 | seminary Aramco | (Saudi Aramco; speaker's son worked in Saudi Arabia) | 0.0 | low-impact |
| `78.P2.84` | Pass 2 | first Baptist church Americus where the Georgia Baptist Convention head was prea | (Christmas 1965 ejection event) | 0.0 | low-impact |
| `78.P3.14` | Pass 3 | "atom bomb 1941" anomaly | Speaker / Whisper conflation of speaker's 1941 birth year with the 1945 atom bom | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Tougaloo / Tougaloo College | Tougaloo / Tougaloo College | 3 | 6 |
| ? | Koinonia Farm | Koinonia Farm | 4 | 5 |
| ? | Koinonia | Koinonia | 4 | 5 |
| ? | Koinonia | Koinonia | 4 | 5 |
| ? | Koinonia Farm | Koinonia Farm | 3 | 4 |
| ? | Koinonia Farm | Koinonia Farm | 2 | 3 |
| ? | Koinonia | Koinonia | 3 | 3 |
| ? | Koinonia | Koinonia | 3 | 3 |
| ? | Southern Poverty Law Center | Southern Poverty Law Center | 2 | 3 |
| ? | "the Freedom Rides" | the freedom rides | 2 | 2 |
| ? | Dr. Howard A. Durgan (or Dougan) | Dr. Howard A. Durgan (or Dougan) | 2 | 2 |
| ? | Kiwanis Club | Kiwanis Club | 2 | 2 |
| ? | Clarence Jordan | Clarence Jordan | 2 | 2 |
| ? | Sumter County, Georgia | Sumter County, Georgia | 2 | 2 |
| ? | Habitat for Humanity | Habitat for Humanity | 2 | 2 |
| ? | Tougaloo / Koinonia (variants) | Tougaloo / Koinonia (variants) | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `78.4` | Coenania / Coenonia / Cornelia / Quanonia | Koinonia Farm | Whisper produces 8+ variant renderings of "Koinonia" alone a | C-ext |  |
| `78.P2.18` | Coenania / Coenania farm | Koinonia Farm | Whisper produces 8+ variant renderings of "Koinonia" alone a | C-ext |  |
| `78.P2.59` | Suntra County | Sumter County, Georgia | "Suntra County" -> "Sumter County, GA" | F-ext |  |
| `78.P2.8` | Coana Club | Kiwanis Club | Whisper garble of mainstream civic organization | G-ext |  |
| `78.P2.81` | Tugaloo / to the Lou / Coenania / Quenan Inn / Cornelia / Qu | Tougaloo / Koinonia (variants) | Whisper produces 8+ variant renderings of "Koinonia" alone a | C-ext |  |
| `78.P3.2` | "Southern Parvading Law Center" -> "Southern Poverty Law Cen | Severe Whisper garble of canonical Morris-Dees-founded organ | Southern Poverty Law Center | B-ext |  |
| `78.P3.3` | "Habitat Remedity" -> "Habitat for Humanity" | Severe Whisper garble of canonical Fuller-founded organizati | "Habitat Remedity" -> "Habitat for Humanity" | B-ext |  |
| `78.P3.7` | "Bobway" -> "Zimbabwe" | Severe Whisper garble of canonical post-Rhodesia African cou | "Bobway" -> "Zimbabwe" | M-ext |  |
| `78.P3.8` | "Suntra County" -> "Sumter County, GA" | Severe Whisper garble of canonical Americus GA county name | "Suntra County" -> "Sumter County, GA" | F-ext |  |
| `78.P4.17` | "Coenania farm" / "Quenan Inn" / "Quantania" / "Coinanilla"  | Koinonia Farm | Whisper produces 8+ variant renderings of "Koinonia" alone a | C-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **8 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 78. Linda Fuller Degelmann` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
