# Layer 5 fidelity findings — entry #21 Clarence Magee

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 7 (0 canonical-figure / 7 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 14 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 0 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `21.36` | Pass 1 | David Damon | David Dahmer | 0.0 | low-impact |
| `21.P2.2` | Pass 2 | Rowan High | Rowan High School (Hattiesburg) | 0.0 | low-impact |
| `21.P2.18` | Pass 2 | Forest County | Forrest County, Mississippi | 0.0 | low-impact |
| `21.P2.19` | Pass 2 | Lamar County | Lamar County, Mississippi | 0.0 | low-impact |
| `21.P2.20` | Pass 2 | Marion County | Marion County, Mississippi | 0.0 | low-impact |
| `21.P2.23` | Pass 2 | Aberdeen courthouse | Monroe County Courthouse (Aberdeen MS) | 0.0 | low-impact |
| `21.P3.3` | Pass 3 | Lorman | Lorman, Mississippi (Claiborne County, Alcorn State University site) | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Vernon Dahmer / Lil' Dahmer (Martinez) / Vernon Dahmer Jr. ( | Vernon Dahmer / Lil' Dahmer (Martinez) / Vernon Dahmer Jr. ( | 5 | 6 |
| ? | N.R. Burger (Dr. N.R. Burger) | N.R. Burger (Dr. N.R. Burger) | 3 | 4 |
| ? | Forrest County, Mississippi | Forrest County (Mississippi) | 2 | 3 |
| ? | Governor (William) Waller | Governor (William) Waller | 2 | 2 |
| ? | Lillie Burney School | Lillie Burney School | 2 | 2 |
| ? | Dr. (N.R.) Burger / Dr. Bilbo / similar | Dr. (N.R.) Burger / Dr. Bilbo / similar | 2 | 2 |
| ? | J.C. Fairley | J.C. Fairley | 2 | 2 |
| ? | Hopkins School (Hattiesburg) | Hopkins School (Hattiesburg) | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

*(no D3 catalog-vs-per-entry contradictions for this entry)*


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **7 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 21. Clarence Magee` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
