# Layer 5 fidelity findings — entry #32 Dr. Doris Derby

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 3 (0 canonical-figure / 3 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 11 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 17 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `32.19` | Pass 1 | the freedom rights | the freedom rides | 0.0 | low-impact |
| `32.P2.10` | Pass 2 | the only thing — Lane University in New Orleans | Tulane University | 0.0 | low-impact |
| `32.P2.12` | Pass 2 | the book that a historian wrote… called Black Bangor | *Black Bangor* (Maureen Elgersman Lee, 2005) | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Joe Mosnier | Joe Mosnier | 2 | 24 |
| ? | Tougaloo College | Tougaloo | 2 | 7 |
| ? | Tougaloo College | Tougaloo / Tougaloo College | 3 | 6 |
| ? | Bob Zellner | Bob Zellner | 2 | 3 |
| ? | Malcolm X | Malcolm X | 2 | 3 |
| ? | Mound Bayou (Tufts–Delta Health Center) | Mound Bayou (Tufts–Delta Health Center) | 2 | 3 |
| ? | Schomburg Library / Schomburg Center for Research in Black C | Schomburg Library / Schomburg Center for Research in Black C | 2 | 2 |
| ? | the freedom rides | the freedom rides | 2 | 2 |
| ? | Tougaloo College | Tougaloo College | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `32.30` | MacMex | Malcolm X | not present in this transcript | E-ext |  |
| `32.5` | Schronberg Library / Schronberg | Schomburg Library / Schomburg Center for Research in Black C | Schomburg Center for Research in Black Culture (NYPL) | E |  |
| `32.P2.17` | MacMex (recurring) | Malcolm X | not present in this transcript | E-ext |  |
| `32.P3.1` | "Bob's owner" (recurring, 32.16 + 32.P2.7) → Bob Zellner | high | Bob Zellner (first white SNCC field secretary) | C |  |
| `32.P3.10` | "Mount Bio Hospital" (32.39) → Mound Bayou (Tufts–Delta Heal | high | Mound Bayou Community Hospital (Tufts-Delta) | F-ext |  |
| `32.P3.11` | "Bangalore, Maine" (32.3) → Bangor, Maine | high | Bangor, Maine | F |  |
| `32.P3.12` | "Manrovia" (32.8) → Monrovia, Liberia | high | Monrovia, Liberia | F |  |
| `32.P3.13` | "Wahaka" (32.11) → Oaxaca, Mexico | high | Oaxaca, Mexico | F |  |
| `32.P3.14` | "Wim's Bridge" (32.4) → Williamsbridge (Bronx) | high | Williamsbridge (Bronx) | F |  |
| `32.P3.16` | "Piscoparian" / "Piscopal" (32.2) → Episcopalian / Episcopal | high | Episcopalian / Episcopal | G |  |
| `32.P3.17` | "Tarsen" (32.7) → Tarzan | high | Tarzan | G |  |
| `32.P3.2` | "snake" / "Sudamont" / "the snake" (recurring) → SNCC | high | SNCC (Student Nonviolent Coordinating Committee) | B |  |
| `32.P3.3` | "MacMex" (32.30 + 32.P2.17) → Malcolm X | high | Malcolm X | D |  |
| `32.P3.5` | "Holland Briders Guild" (32.31 + 32.P2.16) → Harlem Writers  | high | Harlem Writers Guild | E |  |
| `32.P3.6` | "Co-full" / "co-full office" (32.15) → COFO | high | COFO (Council of Federated Organizations) | B |  |
| `32.P3.7` | "Pour People's Corporation" (32.P2.4) → Poor People's Corpor | high | Poor People's Corporation | G |  |
| `32.P3.8` | "W.E.B. Divorce" (32.P2.1) → W.E.B. Du Bois | high | W.E.B. Du Bois | E |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **3 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 32. Dr. Doris Derby` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
