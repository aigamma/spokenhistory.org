# Layer 5 fidelity findings — entry #68 Juadine Henderson

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 7 (0 canonical-figure / 7 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 13 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 0 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `68.46` | Pass 1 | CDGM | Child Development Group of Mississippi (CDGM) | 0.0 | low-impact |
| `68.53` | Pass 1 | Marshall (junior high) | Marshall High School (Holmes County MS) | 0.0 | low-impact |
| `68.P2.36` | Pass 2 | the 1965 MFDP Congressional Challenge | the MFDP Congressional Challenge (January 1965) | 0.0 | low-impact |
| `68.P2.37` | Pass 2 | I'm calling for Emma Bell | Emma Bell (Moses) | 0.0 | low-impact |
| `68.P2.39` | Pass 2 | his daughter and a younger cousin to the woods | took his grandmother and a younger cousin to the woods | 0.0 | low-impact |
| `68.P3.7` | Pass 3 | "Oginga Oginga" → Jaramogi Oginga Odinga | Jaramogi Oginga Odinga (Kenya VP) | 0.0 | low-impact |
| `68.P3.9` | Pass 3 | "snake / snake people" → SNCC pattern cross-reference | SNCC | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | SNCC (Student Nonviolent Coordinating Committee) | SNCC (Student Nonviolent Coordinating Committee) | 2 | 22 |
| ? | SNCC / SNCC people | SNCC / SNCC people | 2 | 5 |
| ? | McComb (Mississippi) | McComb, Mississippi | 2 | 4 |
| ? | Pop Herb | Pop Herb | 2 | 4 |
| ? | Fannie Lou Hamer | Fannie Lou Hamer | 2 | 3 |
| ? | (uncertain — possibly Marvin Rich (CORE), Marvin Surkin (IPS | Marvin Holloway / Anne Holloway | 2 | 2 |
| ? | Panola County (Mississippi) | Panola County (Mississippi) | 2 | 2 |
| ? | Ruleville (Mississippi) | Ruleville (Mississippi) | 2 | 2 |
| ? | Itta Bena (Mississippi) | Itta Bena (Mississippi) | 2 | 2 |
| ? | Jaramogi Oginga Odinga (Kenya VP) | Jaramogi Oginga Odinga (Kenya VP) | 2 | 2 |


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

The annotations in the master MD's `### 68. Juadine Henderson` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
