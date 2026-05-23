# Layer 5 fidelity findings — entry #69 Judy Richardson

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 3 (0 canonical-figure / 3 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 17 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 3 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `69.P2.1` | Pass 2 | Jack Menis... Jack Minnes | Jack Minnis | 0.0 | low-impact |
| `69.P2.31` | Pass 2 | the SNCC 40s / SNCC 50th | the SNCC 40th anniversary conference (Duke, 2000) / SNCC 50th (Raleigh, 2010) | 0.0 | low-impact |
| `69.P3.4` | Pass 3 | "Bryn Mawr" pattern (cross-corpus with Howell #67) | Bryn Mawr College | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Ruby Doris Smith Robinson | Ruby Doris Smith Robinson | 4 | 6 |
| ? | Pop Herb | Pop Herb | 2 | 4 |
| ? | Mark Suckle (likely correct as the speaker's pronunciation,  | Mark Suckle (likely correct as the speaker's pronunciation,  | 2 | 3 |
| ? | *Soul on Rice* (Tamio Wakayama's planned book) | *Soul on Ice* | 2 | 3 |
| ? | the WATS line (Wide Area Telephone Service line) | the WATS line (Wide Area Telephone Service line) | 2 | 3 |
| ? | Bryn Mawr | Bryn Mawr | 2 | 3 |
| ? | Prathia Hall | Rev. Prathia Hall | 2 | 2 |
| ? | Oginga Odinga | Jaramogi Oginga Odinga (Kenya VP) | 2 | 2 |
| ? | Parchman Prison / Parchman Farm | Parchman Prison / Parchman Farm | 2 | 2 |
| ? | Plaquemines Parish (Louisiana) | Plaquemines Parish (Louisiana) | 2 | 2 |
| ? | Raymond Street | Raymond Street | 2 | 2 |
| ? | Bobbi Yancy (Roberta Y. "Bobbi" Yancy) | Bobbi Yancy (Roberta Y. "Bobbi" Yancy) | 2 | 2 |
| ? | Mississippi (personification by speaker, or Whisper substitu | Mississippi (personification by speaker, or Whisper substitu | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `69.21` | Brinmore | Bryn Mawr (College) | Catalog this as a recurring Whisper failure across the corpu | F-ext |  |
| `69.26` | parchment prison | Parchman Prison / Parchman Farm | Parchman Penitentiary, Mississippi | F-ext |  |
| `69.39` | rainmasthread | Raymond Street | 8 1/2 Raymond Street, Atlanta | F-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **3 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 69. Judy Richardson` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
