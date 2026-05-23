# Layer 5 fidelity findings — entry #107 Robert G. Clark Jr.

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 8 (0 canonical-figure / 8 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 8 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 0 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `107.44` | Pass 1 | Saints' New York College / Saints' Newark College | Saints Junior College (Lexington MS) | 0.0 | low-impact |
| `107.P2.4` | Pass 2 | Bobby T. Washington (Memphis) | Booker T. Washington (HS, Memphis) | 0.0 | low-impact |
| `107.P2.13` | Pass 2 | full time track scholarship at Jackson State 1949 | full track scholarship at Jackson State (first track scholarship recipient) | 0.0 | low-impact |
| `107.P2.36` | Pass 2 | Mr. Bullitt / Mr. Buddie (the Buddie Newman alternate ID) | Buddie Newman | 0.0 | low-impact |
| `107.P2.38` | Pass 2 | Mac and Eyetad of all of it | Michigan State offered all of it | 0.0 | low-impact |
| `107.P2.39` | Pass 2 | the Reuel of the House walls | the rule of the House (House rules) | 0.0 | low-impact |
| `107.P3.5` | Pass 3 | "the Reuel of the House walls" | the rule of the House (House Rules) | 0.0 | low-impact |
| `107.P4.4` | Pass 4 | "Holmes County Education Adult program" (paraphrased: "I worked for Dr. Aurelia  | "Adult Education" (program, not "all education") | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Crugar/Cruger (Holmes County) | Cruger | 3 | 3 |
| ? | 12th grade | 12th grade | 2 | 3 |
| ? | Lorenzi | Lorenzi | 2 | 3 |
| ? | Marian Wright (Edelman) | Marian Wright Edelman | 2 | 3 |
| ? | Henry and Sue (Lorenzi) | Henry and Sue (Lorenzi) | 2 | 2 |
| ? | Buddie Newman (Clarence Benton "Buddie" Newman) | Buddie Newman (Clarence Benton "Buddie" Newman) | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

*(no D3 catalog-vs-per-entry contradictions for this entry)*


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **8 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 107. Robert G. Clark Jr.` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
