# Layer 5 fidelity findings — entry #3 Annie Pearl Avery

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 9 (0 canonical-figure / 9 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 26 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 2 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `3.68` | Pass 1 | the chains were in Goodman | (the murders of) Chaney, Schwerner, and Goodman | 0.0 | low-impact |
| `3.76` | Pass 1 | Tugaloo College | Tougaloo College | 0.0 | low-impact |
| `3.79` | Pass 1 | Grahamland | Grambling (College) | 0.0 | low-impact |
| `3.85` | Pass 1 | Steve and Wander | Stevie Wonder | 0.0 | low-impact |
| `3.P2.9` | Pass 2 | Withhol Caprizo | Wetumpka State Prison for Women (AL) | 0.0 | low-impact |
| `3.P2.21` | Pass 2 | the lock the changes... in Goodman | Chaney, Schwerner, and Goodman | 0.0 | low-impact |
| `3.P3.1` | Pass 3 | "Bridge Crossing Jubilee" (Pass 2 row 3.P2.25) | Bridge Crossing Jubilee | 0.0 | low-impact |
| `3.P3.2` | Pass 3 | "Wetumpka State Prison for Women" vs "Julia Tutwiler Prison" | Julia Tutwiler Prison (canonical name) | 0.0 | low-impact |
| `3.P3.4` | Pass 3 | "the chains were in Goodman" (Pass 1 row 3.68) | Chaney, Schwerner, and Goodman | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | SNCC (Student Nonviolent Coordinating Committee) | SNCC (Student Nonviolent Coordinating Committee) | 2 | 22 |
| ? | Jim Forman | James Forman (Jim Forman) | 2 | 10 |
| ? | Hosea Williams | Hosea Williams | 2 | 10 |
| ? | Ruby Doris Smith Robinson | Ruby Doris Smith Robinson | 4 | 6 |
| ? | Ms. Ella Baker (or Miss Ella Baker) | Ms. Ella Baker (or Miss Ella Baker) | 3 | 4 |
| ? | Rutha Mae Harris | Ruth-Etta Harris | 2 | 3 |
| ? | Danville (Virginia) | Danville (Virginia) | 2 | 3 |
| ? | Reverend William A. Bender | Rev. William Albert Bender | 2 | 2 |
| ? | Reverend Abernathy | Reverend Abernathy | 2 | 2 |
| ? | Hale County (Alabama) | Hale County (Alabama) | 2 | 2 |
| ? | Chico Neblett | Chico Neblett | 2 | 2 |
| ? | Katzenbach (Nicholas Katzenbach) | Katzenbach (Nicholas Katzenbach) | 2 | 2 |
| ? | Janet (Jemmott) Moses | Janet (Jemmott) Moses | 2 | 2 |
| ? | James Peacock / Willie Peacock | James Peacock / Willie Peacock | 2 | 2 |
| ? | (the murders of) Chaney, Schwerner, and Goodman | (the murders of) Chaney, Schwerner, and Goodman | 2 | 2 |
| ? | Lennox Hinds (low) / Len Holt (high) | Lennox Hinds (low) / Len Holt (high) | 2 | 2 |
| ? | Rev. Prathia Hall | Rev. Prathia Hall | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `3.17` | Jim Foreman | Jim Forman | James Forman (SNCC executive secretary) | C |  |
| `3.58` | Janet Moses | Janet (Jemmott) Moses | Likely Dona Moses née Richards (Bob Moses's first wife, m. 1 | C-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **9 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 3. Annie Pearl Avery` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
