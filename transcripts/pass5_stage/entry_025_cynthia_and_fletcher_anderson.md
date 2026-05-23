# Layer 5 fidelity findings — entry #25 Cynthia and Fletcher Anderson

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 13 (0 canonical-figure / 13 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 11 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 0 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `25.26` | Pass 1 | Lake Puncher Train Bridge | Lake Pontchartrain Causeway | 0.0 | low-impact |
| `25.30` | Pass 1 | Greenville Park, Hammond | Greenville Park, Hammond, Louisiana | 0.0 | low-impact |
| `25.33` | Pass 1 | Title VII | Title VII (of the Civil Rights Act of 1964) | 0.0 | low-impact |
| `25.P2.12` | Pass 2 | Cluxos Clair | Ku Klux Klan | 0.0 | low-impact |
| `25.P2.15` | Pass 2 | Lewis Lomac / Louis Lo-Max | Louis Lomax | 0.0 | low-impact |
| `25.P2.20` | Pass 2 | Crown Zellerbach | Crown Zellerbach Corporation | 0.0 | low-impact |
| `25.P2.21` | Pass 2 | James Meredith March | James Meredith March Against Fear (June 1966) | 0.0 | low-impact |
| `25.P3.1` | Pass 3 | "Bogolusianne / Bogdallas / Bogolusa / Bowel's Hash" → Bogalusa, LA | Bogalusa, Louisiana | 0.0 | low-impact |
| `25.P3.2` | Pass 3 | "Cookega clan / Cluxos Clair" → Ku Klux Klan | Ku Klux Klan | 0.0 | low-impact |
| `25.P3.3` | Pass 3 | "Barf Act / Barfract" → Crown Zellerbach | Crown Zellerbach paper mill (Bogalusa) | 0.0 | low-impact |
| `25.P3.4` | Pass 3 | "Joan Burl / Joan Burr" → Jonesboro, LA | Jonesboro, Louisiana | 0.0 | low-impact |
| `25.P3.6` | Pass 3 | "Lake Puncher Train Bridge" → Lake Pontchartrain Causeway | Lake Pontchartrain Causeway | 0.0 | low-impact |
| `25.P3.9` | Pass 3 | "AG / A.Z. Young / Easy Young / Andrew Moses" → A.Z. Young | A.Z. Young (Bogalusa Civic and Voters League president) | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Governor John J. McKeithen | Governor John J. McKeithen | 2 | 3 |
| ? | Lake Pontchartrain Causeway | Lake Pontchartrain Causeway | 2 | 3 |
| ? | Bogalusa, Louisiana | Bogalusa, Louisiana | 2 | 2 |
| ? | Charles Sims | Charles Sims | 2 | 2 |
| ? | A.Z. Young | A.Z. Young | 2 | 2 |
| ? | Lolis Elie and (Bob/Robert) Collins | Lolis Elie and (Bob/Robert) Collins | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

*(no D3 catalog-vs-per-entry contradictions for this entry)*


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **13 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 25. Cynthia and Fletcher Anderson` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
