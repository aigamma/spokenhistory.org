# Layer 5 fidelity findings — entry #77 Leesco Guster

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 2 (0 canonical-figure / 2 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 12 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 5 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `77.23` | Pass 1 | Cleveland Hardware | Claiborne Hardware | 0.0 | low-impact |
| `77.P3.8` | Pass 3 | The 2001 vs. 1982 SCOTUS date confusion | Speaker-error or Whisper-error on canonical *NAACP v. Claiborne Hardware* 458 U. | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Vicksburg, Mississippi | Vicksburg, Mississippi | 2 | 2 |
| ? | Mrs. Wells / Mrs. Walls (local activist) | Mrs. Wells / Mrs. Walls (local activist) | 2 | 2 |
| ? | a 1965 Catalina (Pontiac stopped making the Catalina years a | a 1965 Catalina (Pontiac stopped making the Catalina years a | 2 | 2 |
| ? | the Claiborne County in canvassing | the Claiborne County in canvassing | 2 | 2 |
| ? | KKK / Klan / Ku Klux Klan | KKK / Klan / Ku Klux Klan | 2 | 2 |
| ? | Mr. Nate (Jones) | Mr. Nate (Jones) | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `77.P2.20` | clue club | KKK / Klan / Ku Klux Klan | High-damage Whisper homophone for the canonical Klan threat | B-ext |  |
| `77.P2.53` | Mr. Naked | Mr. Nate (Jones) | Recurring Whisper homophone for canonical Port Gibson activi | G-ext |  |
| `77.P3.3` | "the Clappern County of Canvacent" -> "Claiborne County in c | Severe Whisper compound garble of canonical SW MS county nam | Claiborne County in canvassing | F-ext |  |
| `77.P3.4` | "Big Sput" / "Veecesburg" -> Vicksburg | Two distinct Whisper renderings of canonical Warren County M | Vicksburg | F-ext |  |
| `77.P3.6` | "Catalina Ponta" -> "Pontiac Catalina" | Canonical 1965 GM full-size sedan model — the "movement car" | "Catalina Ponta" -> "Pontiac Catalina" | J-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **2 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 77. Leesco Guster` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
