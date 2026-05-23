# Layer 5 fidelity findings — entry #73 Kathleen Cleaver

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 11 (0 canonical-figure / 11 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 28 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 5 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `73.6` | Pass 1 | Truman's .4 program | Truman's Point Four Program | 0.0 | low-impact |
| `73.24` | Pass 1 | Macon County (Alabama) | Macon County, AL | 0.0 | low-impact |
| `73.40` | Pass 1 | Black Power: Politics of Liberation | *Black Power: The Politics of Liberation in America* (Carmichael & Hamilton, 196 | 0.0 | low-impact |
| `73.50` | Pass 1 | Soul on Ice | *Soul on Ice* (Eldridge Cleaver, Feb 1968) | 0.0 | low-impact |
| `73.P2.1` | Pass 2 | Truman's .4 program | Truman's Point Four Program | 0.0 | low-impact |
| `73.P2.3` | Pass 2 | took a tanga and back | "To Katanga and Back" (Conor Cruise O'Brien memoir, 1962) | 0.0 | low-impact |
| `73.P2.31` | Pass 2 | the Tennessee state legislature | Tennessee General Assembly | 0.0 | low-impact |
| `73.P2.32` | Pass 2 | Lee, Utah | (Viola) Liuzzo | 0.0 | low-impact |
| `73.P2.41` | Pass 2 | Mark Stanford | Maxwell C. Stanford Jr. (Muhammad Ahmad) | 0.0 | low-impact |
| `73.P2.43` | Pass 2 | Asata Shakur | Assata Shakur (JoAnne Deborah Byron Chesimard) | 0.0 | low-impact |
| `73.P2.57` | Pass 2 | Carla and Ann / Carl and Anne | Carl Braden and Anne Braden | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Lowndes County, AL | Lowndes County, Alabama | 3 | 7 |
| ? | Stokely | Stokely Carmichael | 2 | 6 |
| ? | Joe Mosnier | Joe Mosnier | 2 | 4 |
| ? | Eleanor Holmes Norton | Eleanor Holmes Norton | 2 | 4 |
| ? | "To Katanga and Back" (Conor Cruise O'Brien memoir, 1962) | "To Katanga and Back" (Conor Cruise O'Brien memoir, 1962) | 4 | 4 |
| ? | Note that "Sons of Malcolm" appears in two distinct historic | Catalog gaps | 3 | 3 |
| ? | Ivanhoe (Donaldson) | Ivanhoe Donaldson | 3 | 3 |
| ? | Cleveland / Hough neighborhood | Cleveland / Hough neighborhood | 3 | 3 |
| ? | Dr. Charles Gomillion | Dr. Charles Gomillion | 3 | 3 |
| ? | Greenwood, Mississippi | Greenwood, Mississippi | 2 | 3 |
| ? | Gen. Vo Nguyen Giap | Gen. Vo Nguyen Giap | 3 | 3 |
| ? | Henry Louis Gates (Jr.) | Henry Louis Gates (Jr.) | 2 | 2 |
| ? | Dr. Charles Gomillion | Dr. Charles Gomillion | 2 | 2 |
| ? | Sammy Younge Jr. | Sammy Younge Jr. | 2 | 2 |
| ? | Stern Gang (Lehi) / Moshe Dayan | Stern Gang (Lehi) / Moshe Dayan | 2 | 2 |
| ? | Hough neighborhood (Cleveland OH) | Hough neighborhood (Cleveland OH) | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `73.31` | Greenville, Mississippi | Greenwood, Mississippi | Already in section H "Whisper homophones" general note (Gree | F-ext |  |
| `73.55` | Stern Gang / Morshidayan | Stern Gang (Lehi) / Moshe Dayan | Pass 1 / Pass 2 #73.55 / #73.P2.21 correctly identify "Stern | N-ext |  |
| `73.P2.10` | Greenville, Mississippi | Greenwood, Mississippi | Already in section H "Whisper homophones" general note (Gree | F-ext |  |
| `73.P2.3` | took a tanga and back | "To Katanga and Back" (Conor Cruise O'Brien memoir, 1962) | Note: Pass 2 #73.P2.3 explicitly marks this as "belongs to # | F-ext |  |
| `73.P3.3` | "Joe Maneye" → Joe Mosnier | One more variant of the canonical Mosnier degradation patter | "Joe Maneye" → Joe Mosnier | A-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **11 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 73. Kathleen Cleaver` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
