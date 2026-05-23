# Layer 5 fidelity findings — entry #111 Rosie Head

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 14 (0 canonical-figure / 14 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 9 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 2 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `111.6` | Pass 1 | Mt. Bueblah | Mt. Beulah (Edwards MS) | 0.0 | low-impact |
| `111.8` | Pass 1 | Stokeley Carmichael | Stokely Carmichael | 0.0 | low-impact |
| `111.13` | Pass 1 | Henry and Schoo / Henry and Sue Lorenzo / Lorenzies | Henry + Sue Lorenzi | 0.0 | low-impact |
| `111.14` | Pass 1 | milestone 14 | Mileston 14 (Hartman Turnbow + 13 other applicants) | 0.0 | low-impact |
| `111.27` | Pass 1 | Med-Gar-Evers | Medgar Evers | 0.0 | low-impact |
| `111.28` | Pass 1 | Avanathy | (Ralph) Abernathy | 0.0 | low-impact |
| `111.P2.7` | Pass 2 | chop cat | chop cotton | 0.0 | low-impact |
| `111.P2.41` | Pass 2 | Med-Gar-Evers | Medgar Evers | 0.0 | low-impact |
| `111.P2.72` | Pass 2 | Robert King | Robert F. Kennedy | 0.0 | low-impact |
| `111.P2.79` | Pass 2 | Durant | Durant, Mississippi | 0.0 | low-impact |
| `111.P2.90` | Pass 2 | tenth city / 10th city | Tent City (Lowndes County) | 0.0 | low-impact |
| `111.P2.97` | Pass 2 | this minor like that | this money like that | 0.0 | low-impact |
| `111.P2.100` | Pass 2 | Avanathy | (Ralph) Abernathy | 0.0 | low-impact |
| `111.P3.3` | Pass 3 | "the Greyhound-bus-children-to-Washington-DC tactic" (header/notes reference) | Greyhound-bus-children-to-Washington 1965-66 Head Start lobbying | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | SNCC people | SNCC / SNCC people | 2 | 5 |
| ? | John D. Ball | John Ball | 2 | 3 |
| ? | Lorenzi | Lorenzi | 2 | 3 |
| ? | Tchula | LD Pratt | 2 | 2 |
| ? | Henry + Sue Lorenzi | Henry and Sue (Lorenzi) | 2 | 2 |
| ? | Mr. Hartman Turnbow | Mr. Hartman Turnbow | 2 | 2 |
| ? | Dr. McLean | Dr. McLean | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `111.P3.4` | "Robert F. Williams" pattern not directly present in this tr | n/a | Robert F. Williams (*Negroes with Guns* 1962) | E-ext |  |
| `111.P3.5` | "Brown vs. Borge" catalog pattern check | not present in this transcript | Brown v. Board of Education (1954) | G |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **14 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 111. Rosie Head` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
