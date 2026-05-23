# Layer 5 fidelity findings — entry #119 Thomas Walter Gaither

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 9 (0 canonical-figure / 9 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 8 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 3 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `119.38` | Pass 1 | Anzy Moore | Amzie Moore | 0.0 | low-impact |
| `119.41` | Pass 1 | Sherrod | Charles Sherrod | 0.0 | low-impact |
| `119.P2.17` | Pass 2 | 1947 Journey of Reconciliation | Journey of Reconciliation | 0.0 | low-impact |
| `119.P2.19` | Pass 2 | Magnolia State | Mississippi (the Magnolia State) | 0.0 | low-impact |
| `119.P2.37` | Pass 2 | JC Brooks gymnasium | JJ C. Brooks Gymnasium (Claflin) | 0.0 | low-impact |
| `119.P2.45` | Pass 2 | the Carrying for Action institute | (CORE) Action Institute | 0.0 | low-impact |
| `119.P2.53` | Pass 2 | Action Institute Hollywood Florida arrest charge | "ejection of undesirable guests" | 0.0 | low-impact |
| `119.P2.56` | Pass 2 | Brown versus Board of Education | Brown v. Board of Education | 0.0 | low-impact |
| `119.P3.8` | Pass 3 | "byssinosis" cotton-mill brown-lung disease | Common-noun confirmation | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Joe Mosnier | Joe Mosnier | 2 | 24 |
| ? | freedom rider / freedom riders / Freedom Riders | Freedom Riders | 2 | 5 |
| ? | (likely) Rev. Robert S. Graetz's church or First Baptist Chu | Rev. Robert S. Graetz (or similar) — uncertain | 3 | 3 |
| ? | Jack H. Young Sr. | Jack Young | 2 | 2 |
| ? | Chuck McDew | Charles McDew (Chuck McDew) | 2 | 2 |
| ? | Parchman [Farm / State Penitentiary] | Parchman Farm / Mississippi State Penitentiary | 2 | 2 |
| ? | Parris Island | Parris Island | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `119.P3.1` | Joe Mosnier ("Joe Manier") rendering | Master MD section A line 41 catalog match | Joe Mosnier (Southern Oral History Program, UNC Chapel Hill) | A |  |
| `119.P3.2` | Whisper "Avenathy" → Abernathy | New canonical-alias rendering | Whisper "Avenathy" → Abernathy | C-ext |  |
| `119.P3.4` | Whisper "Peck → Pek" pattern | Cross-corpus catalog addition | Whisper "Peck → Pek" pattern | B-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **9 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 119. Thomas Walter Gaither` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
