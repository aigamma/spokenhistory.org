# Layer 5 fidelity findings — entry #76 Lawrence Guyot

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 11 (0 canonical-figure / 11 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 32 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 9 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `76.18` | Pass 1 | the Tugeloo Nine | the Tougaloo Nine | 0.0 | low-impact |
| `76.71` | Pass 1 | Bayard Rustin's "From Protest to Politics" | Bayard Rustin's "From Protest to Politics" (*Commentary* Feb 1965) | 0.0 | low-impact |
| `76.P2.10` | Pass 2 | Dory Ladden, Joy Sladden | Dorie Ladner, Joyce Ladner | 0.0 | low-impact |
| `76.P2.73` | Pass 2 | Maryland... Mississippi | Mississippi (speaker self-corrects) | 0.0 | low-impact |
| `76.P2.76` | Pass 2 | a course on, at Ole Miss | a conference at Ole Miss | 0.0 | low-impact |
| `76.P2.87` | Pass 2 | Marriage 67 | married in Washington in '67 | 0.0 | low-impact |
| `76.P2.88` | Pass 2 | snick folks | SNCC folks | 0.0 | low-impact |
| `76.P2.106` | Pass 2 | Hadisburg in 1963 | Hattiesburg in 1963 | 0.0 | low-impact |
| `76.P2.123` | Pass 2 | Bork — Andy Young | Robert Bork (1987 SCOTUS nomination) | 0.0 | low-impact |
| `76.P2.124` | Pass 2 | Tugulu was an Oasis | (variant spelling — Tougaloo) | 0.0 | low-impact |
| `76.P4.22` | Pass 4 | Just keep them informed on what he's doing | (correct — referring to Thelwell setting up MFDP DC office) | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | SNCC (Student Nonviolent Coordinating Committee) | SNCC (Student Nonviolent Coordinating Committee) | 2 | 22 |
| ? | Tougaloo College | Tougaloo | 2 | 7 |
| ? | Gloster Current | Gloster B. Current | 3 | 4 |
| ? | LeVon Brown | Levin (Brown) | 3 | 3 |
| ? | Hattiesburg | Hattiesburg | 2 | 3 |
| ? | Severe Whisper garble of canonical 1965 federal statute | Voting Rights Act of 1965 | 2 | 2 |
| ? | Recurring severe Whisper rendering of canonical Holmes Count | Hartman Turnbow | 2 | 2 |
| ? | Walthall County, Mississippi | Walthall County, Mississippi | 2 | 2 |
| ? | Forrest County, Mississippi | Forrest County, Mississippi | 2 | 2 |
| ? | Nicholas Katzenbach | Nicholas Katzenbach | 2 | 2 |
| ? | Walter Fauntroy | Walter Fauntroy | 2 | 2 |
| ? | Hattiesburg | Hattiesburg | 2 | 2 |
| ? | Lyndon Johnson | Lyndon Johnson | 2 | 2 |
| ? | Schwerner, Chaney, and Goodman | Schwerner, Chaney, and Goodman | 2 | 2 |
| ? | Louis Martin | Louis Martin | 2 | 2 |
| ? | Hartman Turnbow | Hartman Turnbow | 2 | 2 |
| ? | Mr. Turnbow | Mr. Turnbow | 2 | 2 |
| ? | along comes the Voting Rights Act | along comes the Voting Rights Act | 2 | 2 |
| ? | Voting Rights Act (1965) | Voting Rights Act (1965) | 2 | 2 |
| ? | Whisper homophone confusion: "to seek/seat/seat" — canonical | Whisper homophone confusion: "to seek/seat/seat" — canonical | 2 | 2 |
| ? | Whisper homophone confusion: "to seek/seat/seat" — canonical | Whisper homophone confusion: "to seek/seat/seat" — canonical | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `76.P2.41` | Howdy Spurry | Hattiesburg | High-frequency severe Whisper geographic garble pair in same | F-ext |  |
| `76.P2.69` | Hot Maternity Boat | Hartman Turnbow | "Hot Maternity Boat" / "Mr. Timebow" -> "Hartman Turnbow" | C-ext |  |
| `76.P2.70` | Mr. Timebow | Mr. Turnbow | "Hot Maternity Boat" / "Mr. Timebow" -> "Hartman Turnbow" | C-ext |  |
| `76.P3.12` | "Bollock-Courtney Committee" -> Student Nonviolent Coordinat | Severe Whisper garble of full SNCC name | Student Nonviolent Coordinating Committee | B-ext |  |
| `76.P3.4` | "Vodernich Act" -> "Voting Rights Act" | Severe Whisper garble of canonical 1965 federal statute | "Vodernich Act" -> "Voting Rights Act" | G-ext |  |
| `76.P3.5` | "Hot Maternity Boat" / "Mr. Timebow" -> "Hartman Turnbow" | Recurring severe Whisper rendering of canonical Holmes Count | "Hot Maternity Boat" / "Mr. Timebow" -> "Hartman Turnbow" | C-ext |  |
| `76.P3.6` | "Hardly lot" -> "Hardy Lott" | Greenwood MS segregationist attorney who defended Byron De L | Hardy Lott | C-ext |  |
| `76.P3.7` | "Gloucester Current" -> "Gloster Current" | NAACP Director of Branches 1947-78 (longest tenure of any NA | Gloster Current | B-ext |  |
| `76.P3.8` | "Lewis Martin" -> "Louis Martin" | DNC Black voter-outreach strategist; 1960 JFK-to-Coretta pho | Louis Martin | E-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **11 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 76. Lawrence Guyot` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
