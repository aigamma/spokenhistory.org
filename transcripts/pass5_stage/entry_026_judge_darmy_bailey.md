# Layer 5 fidelity findings — entry #26 Judge D'Army Bailey

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 20 (0 canonical-figure / 20 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 13 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 1 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `26.7` | Pass 1 | E. Shelton Clock | Felton G. Clark | 0.0 | low-impact |
| `26.12` | Pass 1 | Aluten Einstein | Allard Lowenstein | 0.0 | low-impact |
| `26.30` | Pass 1 | Hyman Bookbag | Hyman Bookbinder | 0.0 | low-impact |
| `26.32` | Pass 1 | Michael Schorner | Michael Schwerner | 0.0 | low-impact |
| `26.P2.5` | Pass 2 | Hyman Bookbag | Hyman Bookbinder | 0.0 | low-impact |
| `26.P2.8` | Pass 2 | Sodom Schreiber | Sargent Shriver | 0.0 | low-impact |
| `26.P2.9` | Pass 2 | Russell Sugarman | Russell Sugarmon | 0.0 | low-impact |
| `26.P2.20` | Pass 2 | E. Shelton Clock | Felton G. Clark | 0.0 | low-impact |
| `26.P2.21` | Pass 2 | Charles Plimpton / Dr. Howard Jefferson | Howard Jefferson (Clark University president) | 0.0 | low-impact |
| `26.P2.22` | Pass 2 | Father Bernie Gilgorn | Father Bernard Gilgun | 0.0 | low-impact |
| `26.P2.28` | Pass 2 | Will D. Campbell from Mount Juliet | Will D. Campbell | 0.0 | low-impact |
| `26.P2T.32` | Pass 2 tail-sweep | Marsha Field Foundation / Marshall Field Foundation | Marshall Field Foundation (Field Foundation) | 0.0 | low-impact |
| `26.P2T.73` | Pass 2 tail-sweep | Lamar Alexander (Republican governor) | Lamar Alexander | 0.0 | low-impact |
| `26.P2T.75` | Pass 2 tail-sweep | Pour People's Corporation | Poor People's Campaign | 0.0 | low-impact |
| `26.P2T.76` | Pass 2 tail-sweep | Memphis sanitation strike | Memphis Sanitation Workers Strike (1968) | 0.0 | low-impact |
| `26.P3.1` | Pass 3 | "Title VII summer mentor 1965" (Bailey's LSCRRC Louisiana summer) | Title VII (Civil Rights Act of 1964) | 0.0 | low-impact |
| `26.P3.2` | Pass 3 | Walter Hill Bailey (Bailey's father) vs. Walter L. Bailey Sr. (Lorraine Motel ow | Two distinct individuals with overlapping names | 0.0 | low-impact |
| `26.P3.4` | Pass 3 | "the John Birch Society National Council member" (Robert W. Stoddard) | John Birch Society | 0.0 | low-impact |
| `26.P3.5` | Pass 3 | "the National Council of Churches" (Will D. Campbell affiliation) | National Council of Churches (NCC) | 0.0 | low-impact |
| `26.P3.6` | Pass 3 | "Cleveland Donald Jr." not in Bailey's transcript — but Bailey is the Ole Miss r | Ole Miss 1962 (James Meredith) integration | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Ruleville (Mississippi) | Ruleville, Mississippi | 2 | 4 |
| ? | Robert L. Carter | Robert L. Carter | 2 | 3 |
| ? | Lake Pontchartrain (Causeway Bridge) | Lake Pontchartrain Causeway | 2 | 3 |
| ? | Robert Stoddard | Robert Stoddard | 2 | 2 |
| ? | Abbie Hoffman | Abbie Hoffman | 2 | 2 |
| ? | Birch Bayh | Birch Bayh | 2 | 2 |
| ? | Leslie W. Dunbar | Leslie W. Dunbar | 2 | 2 |
| ? | Walter L. Bailey Sr. | Walter L. Bailey Sr. | 2 | 2 |
| ? | Walter L. Bailey Sr. | Walter L. Bailey Sr. | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `26.P2T.75` | Pour People's Corporation | Poor People's Campaign | Poor People's Corporation | G |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **20 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 26. Judge D'Army Bailey` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
