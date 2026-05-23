# Layer 5 fidelity findings — entry #98 Phil Hutchings

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 10 (0 canonical-figure / 10 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 8 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 1 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `98.P2.29` | Pass 2 | Vence and Rome's Brigade / Vence Ramus Brigade | Venceremos Brigade | 0.0 | low-impact |
| `98.P2.46` | Pass 2 | Hugh Newton | Huey Newton | 0.0 | low-impact |
| `98.P2.48` | Pass 2 | Brigade with Eldridge Cleaver | (Eldridge) Cleaver (BPP) | 0.0 | low-impact |
| `98.P2.63` | Pass 2 | Lyndon Johnson / "kind of Humphrey Democrat" | (Hubert) Humphrey Democrat | 0.0 | low-impact |
| `98.P2.68` | Pass 2 | Carmichael, Stokely (later Kwame Ture) | Stokely Carmichael / Kwame Ture | 0.0 | low-impact |
| `98.P2.88` | Pass 2 | Ho Chi Minh / North Vietnam US bombing | (canonical Vietnam War context) | 0.0 | low-impact |
| `98.P2.89` | Pass 2 | "Wineca Illinois" | Winnetka, Illinois | 0.0 | low-impact |
| `98.P3.6` | Pass 3 | "court / from court" → CORE (catalog-B new) | CORE (Congress of Racial Equality) | 0.0 | low-impact |
| `98.P3.7` | Pass 3 | "Bunchy Carter" cross-reference in Hutchings transcript verification | Alprentice "Bunchy" Carter (LA BPP) | 0.0 | low-impact |
| `98.P4.3` | Pass 4 | Dimes' Door / Dimes' Door in Cleveland | dime stores (Cleveland) | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Joe Mosnier | Joe Mosnier | 2 | 24 |
| ? | SNCC (Student Nonviolent Coordinating Committee) | SNCC (Student Nonviolent Coordinating Committee) | 2 | 22 |
| ? | John (canonical Newark taxi driver) — John Smith | John W. Walker | 4 | 4 |
| ? | Madison / Locust Street | Massillon | 2 | 2 |
| ? | the Yippies / Abbie Hoffman / Jerry (Rubin) | Abbie Hoffman | 2 | 2 |
| ? | Bessie Smith (Newark NCUP chairperson) / Jesse Allen (Newark | Bessie Smith / Thurmond Smith (NCUP mainstays) | 2 | 2 |
| ? | Mrs. (Fannie Lou) Hamer | Mrs. (Fannie Lou) Hamer | 2 | 2 |
| ? | Wazir Peacock (Willie Wazir Peacock) | Wazir Peacock (Willie Wazir Peacock) | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `98.P2.29` | Vence and Rome's Brigade / Vence Ramus Brigade | Venceremos Brigade | high | N-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **10 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 98. Phil Hutchings` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
