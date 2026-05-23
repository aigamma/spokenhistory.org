# Layer 5 fidelity findings — entry #75 Ladners joint interview (Dorie Ann Ladner + Joyce Ann Ladner)

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 6 (0 canonical-figure / 6 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 24 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 8 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `75.35` | Pass 1 | 714 Rose Street | 714 Rose Street (Jackson MS) | 0.0 | low-impact |
| `75.43` | Pass 1 | Byron D. LeBeckworth | Byron De La Beckwith | 0.0 | low-impact |
| `75.67` | Pass 1 | Hudson Brothers | Hudson Brothers / Hudson's Salvage | 0.0 | low-impact |
| `75.69` | Pass 1 | Hatched a high school for me / "Hadeesburg high" | Hattiesburg High School | 0.0 | low-impact |
| `75.P2.75` | Pass 2 | Marlon Brando... Sidney Poitier | (Sidney Poitier reference) | 0.0 | low-impact |
| `75.P3.1` | Pass 3 | "Hudson family / Hudson's Salvage" cross-corpus disambiguation | Two distinct Hudson families: (a) Hattiesburg Jewish-owned Hudson's department s | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Dahmer (recurring) | Vernon Dahmer / Dahmer Hall / Dahmer's son | 4 | 5 |
| ? | SNCC people | SNCC / SNCC people | 2 | 5 |
| ? | Ruleville, Mississippi | Ruleville, Mississippi | 2 | 4 |
| ? | Tougaloo / Tougaloo College | Tougaloo / Tougaloo College | 2 | 3 |
| ? | Recurring Whisper homophone for "Joyce" (Ladner) as "Joace"  | Joyce Ladner | 3 | 3 |
| ? | Denmark, South Carolina, at Cleve Sellers' parents' home | Paris | 3 | 3 |
| ? | Statler-Hilton Hotel (Washington DC) | Statler-Hilton Hotel (Washington DC) | 2 | 3 |
| ? | Jeanne Noble | Jeanne Noble | 2 | 3 |
| ? | Joan Trumpauer (Mulholland), my Tougaloo (roommate) | Tougaloo (College) | 2 | 3 |
| ? | Neshoba County | Neshoba County | 3 | 3 |
| ? | Atlantic City | Atlantic City | 3 | 3 |
| ? | The canonical 1964 MFDP convention site garbled | Atlantic City, New Jersey | 2 | 2 |
| ? | Severe Whisper garble of the canonical MoW gospel singer | not directly in Cox raw | 2 | 2 |
| ? | March on Washington | March on Washington | 2 | 2 |
| ? | Severe Whisper garble of the canonical MoW gospel singer | Severe Whisper garble of the canonical MoW gospel singer | 2 | 2 |
| ? | The Emmett Till murder town garbled | The Emmett Till murder town garbled | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `75.P2.53` | Denmark, South Carolina, at cleave sellers' parents' home | Denmark, South Carolina, at Cleve Sellers' parents' home | Copenhagen / Stockholm / Paris | F-ext |  |
| `75.P2.56` | showroom county | Neshoba County | Smithsonian publication-risk cluster | C-ext |  |
| `75.P2.69` | Lennox City | Atlantic City | The canonical 1964 MFDP convention site garbled | B-ext |  |
| `75.P3.5` | "the Haley Ajax" -> "Mahalia Jackson" | Severe Whisper garble of the canonical MoW gospel singer | "the Haley Ajax" -> "Mahalia Jackson" | C-ext |  |
| `75.P3.6` | "showroom county" -> "Neshoba County" | The canonical Freedom Summer murder county garbled into nond | Smithsonian publication-risk cluster | C-ext |  |
| `75.P3.7` | "Mowlum" -> "Money, MS" | The Emmett Till murder town garbled | Smithsonian publication-risk cluster | C-ext |  |
| `75.P3.8` | "Lennox City" -> "Atlantic City" | The canonical 1964 MFDP convention site garbled | Smithsonian publication-risk cluster | C-ext |  |
| `75.P3.9` | "the Haley Ajax" + "showroom county" + "Mowlum" + "Lennox Ci | Smithsonian publication-risk cluster | "the Haley Ajax" -> "Mahalia Jackson" | C-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **6 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 75. Ladners joint interview (Dorie Ann Ladner + Joyce Ann Ladner)` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
