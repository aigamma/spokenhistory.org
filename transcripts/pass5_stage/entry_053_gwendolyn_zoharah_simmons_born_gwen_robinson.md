# Layer 5 fidelity findings — entry #53 Gwendolyn Zoharah Simmons (born Gwen Robinson)

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 19 (0 canonical-figure / 19 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 5 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 2 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `53.21` | Pass 1 | Corky Gonzales | Rodolfo "Corky" Gonzales | 0.0 | low-impact |
| `53.23` | Pass 1 | Veterans of Hope Project | Veterans of Hope Project (Iliff School of Theology) | 0.0 | low-impact |
| `53.P2.63` | Pass 2 | the SNCC's response to that... the Vietnam War | SNCC statement against the Vietnam War (January 6, 1966) | 0.0 | low-impact |
| `53.P2.65` | Pass 2 | the Black Power position paper | the Black Power position paper (1966) | 0.0 | low-impact |
| `53.P2.69` | Pass 2 | the Veterans of Hope Project | Veterans of Hope Project (Iliff School of Theology) | 0.0 | low-impact |
| `53.P2.78` | Pass 2 | the Black Belt | the Black Belt (Mississippi / Alabama agricultural region) | 0.0 | low-impact |
| `53.P2.79` | Pass 2 | the Northern attorneys | the Northern attorneys (LCDC / NLG / Northern law students) | 0.0 | low-impact |
| `53.P2.89` | Pass 2 | the Spelman administration | Spelman College | 0.0 | low-impact |
| `53.P2.91` | Pass 2 | the Antioch interview | the Antioch College admissions interview | 0.0 | low-impact |
| `53.P2.92` | Pass 2 | the Oxford Ohio (Freedom Summer orientation) | Oxford, Ohio (Western College for Women) | 0.0 | low-impact |
| `53.P2.95` | Pass 2 | this group called the Friends of Snick | the Friends of SNCC (Northern support chapters) | 0.0 | low-impact |
| `53.P3.1` | Pass 3 | "the Atlantic City MFDP debacle / delegation challenge" | Atlantic City MFDP delegation challenge (August 1964) | 0.0 | low-impact |
| `53.P3.2` | Pass 3 | "the SNCC statement against Vietnam (January 6, 1966)" | SNCC Vietnam War statement | 0.0 | low-impact |
| `53.P3.3` | Pass 3 | "the SNCC Palestinian/Israel statement (June 1967)" | SNCC Palestine/Israel statement | 0.0 | low-impact |
| `53.P3.4` | Pass 3 | "the SNCC whites-out decision (1966)" | SNCC 1966 white-organizers-out decision | 0.0 | low-impact |
| `53.P3.5` | Pass 3 | "the $3,000 check dispute (Atlanta Project expulsion)" | SNCC Atlanta Project expulsion / $3,000 check dispute (1967) | 0.0 | low-impact |
| `53.P3.6` | Pass 3 | "the inward → n-word" Whisper-substitution pattern | the n-word | 0.0 | low-impact |
| `53.P3.7` | Pass 3 | "Sorcery Commission → Sovereignty Commission" Whisper-substitution | Mississippi State Sovereignty Commission | 0.0 | low-impact |
| `53.P3.8` | Pass 3 | "Asian provocateurs → agents provocateurs" Whisper-substitution | agents provocateurs | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | SNCC office | SNCC (Student Nonviolent Coordinating Committee) | 2 | 22 |
| ? | James Forman (Jim Forman) | James Forman (Jim Forman) | 2 | 10 |
| ? | Spelman College | Jane Billings of Brown University / Spelman College | 3 | 3 |
| ? | Robert Parris Moses | Bob Moses | 2 | 2 |
| ? | "Lowndes County, Alabama" | "Lowndes County, Alabama" | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `53.P2.10` | snake / SNCC office | SNCC office | "snake" → SNCC pattern reinforcement | B-ext |  |
| `53.P2.85` | Bob Moses (cross-reference) | Robert Parris Moses | Bob Moses | C-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **19 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 53. Gwendolyn Zoharah Simmons (born Gwen Robinson)` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
