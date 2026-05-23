# Layer 5 fidelity findings — entry #97 Pete Seeger

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 16 (0 canonical-figure / 16 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 1 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 1 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `97.24` | Pass 1 | Toshy Reagon | Toshi Reagon | 0.0 | low-impact |
| `97.27` | Pass 1 | Goodman, Schwerner, Cheney | Andrew Goodman, Michael Schwerner, James Chaney | 0.0 | low-impact |
| `97.31` | Pass 1 | Lilian Helman | Lillian Hellman | 0.0 | low-impact |
| `97.37` | Pass 1 | Adam Clayton Powell | Adam Clayton Powell Jr. | 0.0 | low-impact |
| `97.40` | Pass 1 | Newburgh Bay / Hudson River sloop Clearwater | Newburgh Bay (Hudson River) / Hudson River Sloop *Clearwater* | 0.0 | low-impact |
| `97.43` | Pass 1 | Ruth-er-ford B. Hayes | Rutherford B. Hayes | 0.0 | low-impact |
| `97.44` | Pass 1 | 1888 Supreme Court no capital punishment for corporations | *Santa Clara County v. Southern Pacific Railroad* (1886) | 0.0 | low-impact |
| `97.49` | Pass 1 | Bobby Dylan | Bob Dylan | 0.0 | low-impact |
| `97.P2.2` | Pass 2 | Project Biographer | project videographer | 0.0 | low-impact |
| `97.P2.17` | Pass 2 | Mary daily | Mayor (Richard J.) Daley | 0.0 | low-impact |
| `97.P2.24` | Pass 2 | the unions are unions | the unions / labor unions | 0.0 | low-impact |
| `97.P2.25` | Pass 2 | Bobby Dylan | Bob Dylan | 0.0 | low-impact |
| `97.P2.36` | Pass 2 | Atlanta and South World History Program | Atlanta and Southern Oral History Program | 0.0 | low-impact |
| `97.P2.38` | Pass 2 | Wineca Illinois | Winnetka, Illinois | 0.0 | low-impact |
| `97.P2.43` | Pass 2 | Sherrod | (Charles) Sherrod | 0.0 | low-impact |
| `97.P4.9` | Pass 4 | "Reverend King... brother Nixon" (E.D. Nixon and King negotiating MIA meeting at | (canonical first-person — Seeger's recounting of the documented Nixon-King "two  | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Joe Mosnier | Joe Mosnier | 2 | 24 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `97.P2.19` | Vance and Romlees Brigade / Vence and Romes Brigade | Venceremos Brigade | high | N-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **16 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 97. Pete Seeger` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
