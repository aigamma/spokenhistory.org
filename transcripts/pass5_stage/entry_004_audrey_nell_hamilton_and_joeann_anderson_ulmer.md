# Layer 5 fidelity findings — entry #4 Audrey Nell Hamilton and JoeAnn Anderson Ulmer

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 9 (0 canonical-figure / 9 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 22 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 0 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `4.39` | Pass 1 | Reverend Avenue | Reverend Abernathy | 0.0 | low-impact |
| `4.49` | Pass 1 | Ralph Avenfee | Ralph Abernathy | 0.0 | low-impact |
| `4.50` | Pass 1 | Reverend Avenue | Reverend Abernathy | 0.0 | low-impact |
| `4.53` | Pass 1 | Hank Thomas / hanged Thomas | Hank Thomas | 0.0 | low-impact |
| `4.54` | Pass 1 | Sin-orvesting four | St. Augustine Four | 0.0 | low-impact |
| `4.P2.20` | Pass 2 | Andy Young being beat that night | Andrew Young 18 June 1964 attack | 0.0 | low-impact |
| `4.P2.21` | Pass 2 | Florida Memorial College | Florida Memorial College (now University) | 0.0 | low-impact |
| `4.P3.1` | Pass 3 | Florida Industrial School for Boys vs Florida School for Boys at Marianna (Dozie | Florida School for Boys at Marianna (Arthur G. Dozier School) | 0.0 | low-impact |
| `4.P4.17` | Pass 4 | "buy y'all heads and prayer" | "**bow** y'all heads **for** prayer" | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Dr. Robert B. Hayling | Dr. Robert B. Hayling | 2 | 4 |
| ? | Reverend Abernathy | Reverend Abernathy | 2 | 4 |
| ? | Samuel White | Samuel White | 2 | 3 |
| ? | L.O. Davis (Sheriff Lawrence O. Davis) | L.O. Davis (Sheriff Lawrence O. Davis) | 2 | 3 |
| ? | Dr. King (Martin Luther King Jr.) | Dr. King (Martin Luther King Jr.) | 2 | 3 |
| ? | Dr. King (Martin Luther King Jr.) | Dr. King (Martin Luther King Jr.) | 2 | 3 |
| ? | Yvonne Duncan (likely) / Donald Duncan | Yvonne Duncan (likely) / Donald Duncan | 3 | 3 |
| ? | L.O. Davis (Sheriff Lawrence O. Davis) | L.O. Davis (Sheriff Lawrence O. Davis) | 2 | 2 |
| ? | Florida Industrial School for Girls (Ocala) / Florida School | Florida Industrial School for Girls (Ocala) / Florida School | 2 | 2 |
| ? | Dr. Martin Luther King (Jr.) | Dr. Martin Luther King (Jr.) | 2 | 2 |
| ? | Reverend Shuttlesworth (Fred Shuttlesworth) | Reverend Shuttlesworth (Fred Shuttlesworth) | 2 | 2 |
| ? | Ralph Abernathy | Ralph Abernathy | 2 | 2 |
| ? | Yvonne Duncan (likely) / Donald Duncan | Yvonne Duncan (likely) / Donald Duncan | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

*(no D3 catalog-vs-per-entry contradictions for this entry)*


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **9 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 4. Audrey Nell Hamilton and JoeAnn Anderson Ulmer` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
