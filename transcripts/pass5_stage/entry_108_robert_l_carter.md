# Layer 5 fidelity findings — entry #108 Robert L. Carter

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 15 (0 canonical-figure / 15 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 23 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 1 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `108.24` | Pass 1 | Adam Clayton Powell | Adam Clayton Powell Jr. | 0.0 | low-impact |
| `108.26` | Pass 1 | Jack Kleinberg | Otto Klineberg | 0.0 | low-impact |
| `108.29` | Pass 1 | Kennedy Clark | Kenneth Clark | 0.0 | low-impact |
| `108.P2.7` | Pass 2 | Concent's Maltley | Constance Baker Motley | 0.0 | low-impact |
| `108.P2.10` | Pass 2 | put... claim | proclaim | 0.0 | low-impact |
| `108.P2.24` | Pass 2 | Universe Alabama | NAACP v. Alabama (1958) | 0.0 | low-impact |
| `108.P2.28` | Pass 2 | Jack Kleinberg | Otto Klineberg | 0.0 | low-impact |
| `108.P2.41` | Pass 2 | the Topeka, the first case... the Topeka did not school | Topeka (school board) did not (want to fight to keep segregation) | 0.0 | low-impact |
| `108.P2.45` | Pass 2 | Adam Clayton Powell | Adam Clayton Powell Jr. | 0.0 | low-impact |
| `108.P2.52` | Pass 2 | a print-tossing | apprenticing | 0.0 | low-impact |
| `108.P2.53` | Pass 2 | Coentel (program) | COINTELPRO (FBI Counterintelligence Program) | 0.0 | low-impact |
| `108.P3.8` | Pass 3 | "Concent Maltley / Conning / Concent's Maltley" | Constance Baker Motley | 0.0 | low-impact |
| `108.P3.11` | Pass 3 | "Mary Carr / Kenneth and Mary Carr" | Mamie Phipps Clark / Kenneth + Mamie Clark | 0.0 | low-impact |
| `108.P3.12` | Pass 3 | "All Deliberts Free / All Liberts Free / the Liberts Free" | All Deliberate Speed | 0.0 | low-impact |
| `108.P3.13` | Pass 3 | "the figure case" | the Figg/Briggs case (Briggs v. Elliott) | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Barringer High School (Newark NJ) | Barringer High School (Newark NJ) | 2 | 3 |
| ? | Spottswood W. Robinson III | Spottswood W. Robinson III | 2 | 3 |
| ? | Charles Hamilton Houston | Charles Hamilton Houston | 2 | 3 |
| ? | Mamie (Phipps) Clark | Mamie (Phipps) Clark | 2 | 2 |
| ? | Noel Dowling | Noel Dowling | 2 | 2 |
| ? | (the) broke migration / great migration | (the) broke migration / great migration | 2 | 2 |
| ? | (the) Great Migration | (the) Great Migration | 2 | 2 |
| ? | a court was 9 men, black and white | a court was 9 men, black and white | 2 | 2 |
| ? | NAACP v. Alabama (1958) | NAACP v. Alabama (1958) | 2 | 2 |
| ? | First Amendment right | First Amendment right | 2 | 2 |
| ? | (educational) opportunity | (educational) opportunity | 2 | 2 |
| ? | Rosenwald Fellowship (Julius Rosenwald Fund) | Rosenwald Fellowship (Julius Rosenwald Fund) | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `108.P2.2` | broke my migration | (the) broke migration / great migration | the Great Migration | E-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **15 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 108. Robert L. Carter` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
