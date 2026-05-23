# Layer 5 fidelity findings — entry #17 Charles McLaurin

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 8 (0 canonical-figure / 8 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 31 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 2 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `17.37` | Pass 1 | Beardstown | Belzoni, Mississippi | 0.0 | low-impact |
| `17.50` | Pass 1 | Joe Mannie / Joe Maneye | Joe Mosnier | 0.0 | low-impact |
| `17.P2.32` | Pass 2 | Edwin G. Robinson + George Raff | Edward G. Robinson + George Raft | 0.0 | low-impact |
| `17.P2.33` | Pass 2 | Smith-Robbingson Elementary School | Smith Robertson Elementary School | 0.0 | low-impact |
| `17.P2T.116` | Pass 2 tail-sweep | Marsha Field Foundation | Marshall Field Foundation | 0.0 | low-impact |
| `17.P2T.122` | Pass 2 tail-sweep | "the black to no nelet" graduate from Ole Miss | the 1st Black to enroll + graduate from Ole Miss | 0.0 | low-impact |
| `17.P2T.138` | Pass 2 tail-sweep | Wide Sunflower County, the small town of sunflower | town of Sunflower, Sunflower County | 0.0 | low-impact |
| `17.P3.1` | Pass 3 | "Hollis Watkins / Highless" - already in P2T as #17.P2T.30; cross-check for any  | Hollis Watkins | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | SNCC (Student Nonviolent Coordinating Committee) | SNCC (Student Nonviolent Coordinating Committee) | 2 | 22 |
| ? | Joseph Rauh Jr. | Joseph L. Rauh Jr. | 4 | 7 |
| ? | Ruleville, Mississippi | Ruleville, Mississippi | 2 | 4 |
| ? | Joe Mosnier | Joe Mosnier | 2 | 4 |
| ? | Medgar Evers | Medgar Evers | 2 | 3 |
| ? | Levin (Brown) | Levin (Brown) | 3 | 3 |
| ? | Tougaloo College | Tougaloo / Tougaloo College | 2 | 3 |
| ? | Joyce Ladner | Joyce Ladner | 3 | 3 |
| ? | Fannie Lou Hamer | Fannie Lou Hamer | 2 | 3 |
| ? | Willie B. "Wazir" Peacock | James Peacock / Willie Peacock | 2 | 2 |
| ? | Bob Moses | Bob Moses | 2 | 2 |
| ? | Smith Robertson Junior High (the first Black public school i | Smith Robertson Junior High (the first Black public school i | 2 | 2 |
| ? | Medgar | Medgar | 2 | 2 |
| ? | Hartman Turnbow | Hartman Turnbow | 2 | 2 |
| ? | Wazir Peacock / Willie Peacock | Wazir Peacock / Willie Peacock | 2 | 2 |
| ? | William L. "Bill" Higgs | William L. "Bill" Higgs | 2 | 2 |
| ? | Mount Beulah (Edwards, MS) | Mount Beulah (Edwards, MS) | 2 | 2 |
| ? | Jack Young | Jack Young | 2 | 2 |
| ? | Rebecca McDonald | Rebecca McDonald | 2 | 2 |
| ? | Ruleville, Mississippi | Ruleville, Mississippi | 2 | 2 |
| ? | James O. Eastland | James O. Eastland | 2 | 2 |
| ? | Willie Ricks (Mukasa Dada) | Willie Ricks (Mukasa Dada) | 2 | 2 |
| ? | Atlantic City, New Jersey | Atlantic City, New Jersey | 2 | 2 |
| ? | Atlantic City, New Jersey | Atlantic City, New Jersey | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `17.20` | Hartman Turnbow | Hartman Turnbow | "Hot Maternity Boat" / "Mr. Timebow" -> "Hartman Turnbow" | C-ext |  |
| `17.P3.2` | "Bob Moses" via "by Moses" rendering | Bob Moses | Robert Parris Moses | C-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **8 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 17. Charles McLaurin` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
