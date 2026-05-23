# Layer 5 fidelity findings — entry #74 Kay Tillow

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 5 (0 canonical-figure / 5 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 25 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 10 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `74.44` | Pass 1 | Cuban Missile Crisis | Cuban Missile Crisis (October 1962) | 0.0 | low-impact |
| `74.50` | Pass 1 | Stop in Frisk judge | (Judge) Shira Scheindlin | 0.0 | low-impact |
| `74.P2.52` | Pass 2 | Pennsylvania state collective bargaining law | Public Employee Relations Act / Act 195 (PA, 1970) | 0.0 | low-impact |
| `74.P2.55` | Pass 2 | Stop in Frisk judge | (Judge) Shira A. Scheindlin (SDNY) | 0.0 | low-impact |
| `74.P2.66` | Pass 2 | Cuban Missile Crisis | Cuban Missile Crisis (October 1962) | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | *To Katanga and Back* (Conor Cruise O'Brien memoir, 1962) | "To Katanga and Back" (Conor Cruise O'Brien memoir, 1962) | 4 | 4 |
| ? | Cairo (Illinois) | Cairo (Illinois) | 2 | 3 |
| ? | Champaign, Illinois | Champaign, Illinois | 2 | 3 |
| ? | Conor Cruise O'Brien | Conor Cruise O'Brien | 2 | 3 |
| ? | Monteagle, Tennessee | Monteagle, Tennessee | 2 | 3 |
| ? | Wilkes-Barre (Pennsylvania) | Wilkes-Barre (Pennsylvania) | 3 | 3 |
| ? | Anne Braden | Anne Braden | 2 | 2 |
| ? | James Dombrowski | James Dombrowski | 2 | 2 |
| ? | Eleanor Flexner's *A Century of Struggle* | Eleanor Flexner's *A Century of Struggle* | 2 | 2 |
| ? | (Judge) Shira Scheindlin | (Judge) Shira Scheindlin | 2 | 2 |
| ? | March on Frankfort (Kentucky) | March on Frankfort (Kentucky) | 2 | 2 |
| ? | Rodef Shalom Congregation (Pittsburgh) | Rodef Shalom Congregation (Pittsburgh) | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `74.23` | Monegal, Tennessee | Monteagle, Tennessee | Single occurrence but canonical Highlander location 1932-62. | O-ext |  |
| `74.P2.2` | took a tanga and back | *To Katanga and Back* (Conor Cruise O'Brien memoir, 1962) | Note: Pass 2 #73.P2.3 explicitly marks this as "belongs to # | F-ext |  |
| `74.P2.21` | Monegal, Tennessee | Monteagle, Tennessee | Single occurrence but canonical Highlander location 1932-62. | O-ext |  |
| `74.P2.28` | March on Frankfurt | March on Frankfort (Kentucky) | High-distortion Whisper rendering of canonical Kentucky civi | F-ext |  |
| `74.P2.34` | Wilkesbury | Wilkes-Barre, Pennsylvania | "Wilkesbury" → Wilkes-Barre PA | L-ext |  |
| `74.P2.41` | Rodolf Shalom | Rodef Shalom Congregation (Pittsburgh) | Whisper rendering "Rodolf Shalom" of canonical 1856-founded  | N-ext |  |
| `74.P3.1` | "took a tanga and back" → *To Katanga and Back* | This row was misplaced under Cleaver #73 (P2 #73.P2.3) and r | Note: Pass 2 #73.P2.3 explicitly marks this as "belongs to # | F-ext |  |
| `74.P3.3` | "Conor Cruzel Brian" → Conor Cruise O'Brien | Distinctive Whisper failure for canonical Irish writer/diplo | "Conor Cruzel Brian" → Conor Cruise O'Brien | O-ext |  |
| `74.P3.6` | "Wilkesbury" → Wilkes-Barre PA | Distinctive Whisper failure for canonical PA city; 1199 orga | "Wilkesbury" → Wilkes-Barre PA | L-ext |  |
| `74.P3.8` | "1199" + canonical Title VI-leveraged hospital desegregation | Tillow's testimony that 1965 Medicare's Title VI-compliance  | "1199" + canonical Title VI-leveraged hospital desegregation | L-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **5 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 74. Kay Tillow` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
