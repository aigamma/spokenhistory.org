# Layer 5 fidelity findings — entry #100 Raylawni G. Branch and Jeanette Smith

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 15 (0 canonical-figure / 15 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 46 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 1 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `100.74` | Pass 1 | Meharry | Meharry (Medical College) | 0.0 | low-impact |
| `100.P2.25` | Pass 2 | Brown decision / Brown vs Borge | Brown v. Board of Education | 0.0 | low-impact |
| `100.P2.32` | Pass 2 | Rowan High School | Rowan High School (Hattiesburg) | 0.0 | low-impact |
| `100.P2.65` | Pass 2 | Smith-Trucks' door / Smith-Juckstown / Smith's | Smith Drug Store | 0.0 | low-impact |
| `100.P2.70` | Pass 2 | HUW / HEW | HEW (Department of Health, Education, and Welfare) | 0.0 | low-impact |
| `100.P2.71` | Pass 2 | Meharry | Meharry Medical College | 0.0 | low-impact |
| `100.P2.74` | Pass 2 | Lillie Bernie / Lillie Burney | Lillie Burney Elementary | 0.0 | low-impact |
| `100.P2.77` | Pass 2 | Eureka (School) | Eureka School (Hattiesburg) | 0.0 | low-impact |
| `100.P2.81` | Pass 2 | NAACP membership receipts in Bible | NAACP membership receipts | 0.0 | low-impact |
| `100.P2.85` | Pass 2 | Aaron Henry | Aaron E. Henry | 0.0 | low-impact |
| `100.P2.86` | Pass 2 | "Brock Candy / Brock Candy Company" | Brock Candy Company | 0.0 | low-impact |
| `100.P2.102` | Pass 2 | William Carey College | William Carey University (Hattiesburg) | 0.0 | low-impact |
| `100.P2.114` | Pass 2 | Brown decision context | (canonical Brown v. Board context) | 0.0 | low-impact |
| `100.P3.4` | Pass 3 | "Clyde Kennard" 4-variant cluster (catalog-E reinforce) | Clyde Kennard | 0.0 | low-impact |
| `100.P4.5` | Pass 4 | Subject-paragraph claim: Kennard "developed cancer there, died January 1966" | "died July 4, 1963" | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Vernon Dahmer / Lil' Dahmer (Martinez) / Vernon Dahmer Jr. ( | Vernon Dahmer / Lil' Dahmer (Martinez) / Vernon Dahmer Jr. ( | 5 | 6 |
| ? | Mr. Burger (or Burger Berger) | N.R. Burger (Dr. N.R. Burger) | 3 | 4 |
| ? | Smith's Drug Store | SNCC | 3 | 3 |
| ? | Hattiesburg | Hattiesburg | 2 | 3 |
| ? | Clyde Kennard | Clyde Kennard | 2 | 3 |
| ? | the Freedom Riders | the Freedom Riders | 2 | 3 |
| ? | Vernon Dahmer | Vernon Dahmer | 2 | 3 |
| ? | Robert Beach | Robert Beach | 2 | 3 |
| ? | Methodist Hospital / Forrest General Hospital | Methodist Hospital / Forrest General Hospital | 3 | 3 |
| ? | Miss Emma Campbell | Miss Emma Campbell | 3 | 3 |
| ? | Johnny Lee Roberts | Johnny Lee Roberts | 3 | 3 |
| ? | Marian (Chinese-American woman) | Marion Barry (Marion S. Barry Jr.) | 2 | 2 |
| ? | Hattiesburg | Hattiesburg, Mississippi | 2 | 2 |
| ? | Hattiesburg | Hattiesburg, Mississippi | 2 | 2 |
| ? | Oral History | Whisper recurring homophone in interview-opening template | 2 | 2 |
| ? | Brown v. Board of Education | Brown decision / Governor (Hugh) White / Committee of 100 | 2 | 2 |
| ? | Coffeyville (MS, near Yazoo) or "Hot Coffee" (Covington Coun | Coffeyville (MS, near Yazoo) or "Hot Coffee" (Covington Coun | 2 | 2 |
| ? | Cajun(s) | Cajun(s) | 2 | 2 |
| ? | Mr. (Vernon) Dahmer | Mr. (Vernon) Dahmer | 2 | 2 |
| ? | Mr. (Clyde) Kennard | Mr. (Clyde) Kennard | 2 | 2 |
| ? | Smith's Drug Store | Smith's Drug Store | 2 | 2 |
| ? | Joyce Brown (Yarborough) | Joyce Brown (Yarborough) | 2 | 2 |
| ? | (likely) Dr. (James) Mason / Dr. Aaron Shirley | (likely) Dr. (James) Mason / Dr. Aaron Shirley | 2 | 2 |
| ? | (likely) Dr. (James) Mason / Dr. Aaron Shirley | (likely) Dr. (James) Mason / Dr. Aaron Shirley | 2 | 2 |
| ? | Methodist Hospital / Forrest General Hospital | Methodist Hospital / Forrest General Hospital | 2 | 2 |
| ? | Pearson v. Murray (1936) / Missouri ex rel. Gaines v. Canada | Pearson v. Murray (1936) / Missouri ex rel. Gaines v. Canada | 2 | 2 |
| ? | Marjorie James (Mrs. Mary James) | Marjorie James (Mrs. Mary James) | 2 | 2 |
| ? | Parchman Farm / Mississippi State Penitentiary | Parchman Farm / Mississippi State Penitentiary | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `100.36` | Mr. Canard | Mr. (Clyde) Kennard | Clyde Kennard (MS Southern College pre-Meredith integration  | E |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **15 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 100. Raylawni G. Branch and Jeanette Smith` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
