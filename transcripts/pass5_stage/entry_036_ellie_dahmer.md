# Layer 5 fidelity findings — entry #36 Ellie Dahmer

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 8 (0 canonical-figure / 8 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 12 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 2 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `36.P2.11` | Pass 2 | The Constitution interpretation test | Mississippi voter-registration "interpretation of the Constitution" test | 0.0 | low-impact |
| `36.P2.13` | Pass 2 | the notarized form for organizations we gave money to | the NAACP-affiliation-disclosure form for MS teachers | 0.0 | low-impact |
| `36.P3.4` | Pass 3 | "Mr. Daymer / Damon / Demon" (Pass-1 #36.6) | Vernon Dahmer Sr. (catalog #E entry) | 0.0 | low-impact |
| `36.P3.7` | Pass 3 | "Cofu / Kofu" (Pass-1 #36.16) | COFO (catalog #B entry) | 0.0 | low-impact |
| `36.P3.8` | Pass 3 | "John Doors / John Doe / John Dakota / Dakota" (Pass-1 #36.17) | John Doar | 0.0 | low-impact |
| `36.P3.13` | Pass 3 | "Tennessee A&I" (Pass-1 #36.1) | Tennessee A&I State University (now Tennessee State) | 0.0 | low-impact |
| `36.P4.16` | Pass 4 | "the cunmolesson home" (Mrs. Beard's son) | "the convalescent home" | 0.0 | low-impact |
| `36.P4.18` | Pass 4 | "the affidavits, the deposition" sequence | the *U.S. v. Lynd* plaintiff depositions and affidavits | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Mr. Dahmer (Vernon Dahmer Sr.) | Vernon Dahmer / Lil' Dahmer (Martinez) / Vernon Dahmer Jr. ( | 5 | 6 |
| ? | Forrest County (Mississippi) | Forrest County (Mississippi) | 2 | 3 |
| ? | Judge W. Harold Cox (William Harold Cox) | Judge W. Harold Cox (William Harold Cox) | 2 | 3 |
| ? | home economics | home economics | 2 | 2 |
| ? | home economics (teaching subject) | home economics (teaching subject) | 2 | 2 |
| ? | Mr. Lynd (Theron Lynd) | Mr. Lynd (Theron Lynd) | 2 | 2 |
| ? | His voter registration card came [back from the Justice Depa | His voter registration card came [back from the Justice Depa | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `36.10` | Mr. Nene, Nene | Mr. Lynd (Theron Lynd) | Theron Lynd (catalog #E entry) | E-ext |  |
| `36.P2.4` | His card came out to be buried him | His voter registration card came [back from the Justice Depa | Vernon Dahmer Sr.'s posthumous voter-registration card | E-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **8 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 36. Ellie Dahmer` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
