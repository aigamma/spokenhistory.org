# Layer 5 fidelity findings — entry #117 Shirley Miller Sherrod

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 9 (0 canonical-figure / 9 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 4 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 0 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `117.29` | Pass 1 | MFDP | Mississippi Freedom Democratic Party | 0.0 | low-impact |
| `117.P2.1` | Pass 2 | NHA (vs FHA) | NHA (New Homemakers of America, Black) vs FHA (Future Homemakers of America, whi | 0.0 | low-impact |
| `117.P2.13` | Pass 2 | Lee County GA | Lee County, Georgia | 0.0 | low-impact |
| `117.P2.26` | Pass 2 | the daikis at New Communities | the daycare at New Communities | 0.0 | low-impact |
| `117.P2.28` | Pass 2 | bigger than just the Spooners | (the Spooners — Pass 1 caught) | 0.0 | low-impact |
| `117.P2.35` | Pass 2 | Pickford v. Glickman | Pigford v. Glickman | 0.0 | low-impact |
| `117.P2.39` | Pass 2 | Stokely (Carmichael) taking over from John Lewis | Stokely Carmichael's May 1966 SNCC chairmanship | 0.0 | low-impact |
| `117.P3.2` | Pass 3 | "Pigford v. Glickman" structure | Track A ($50K capped) + Track B (unlimited, full documentation) | 0.0 | low-impact |
| `117.P3.4` | Pass 3 | "white-grand-jury statement 'we never heard of niggers telling the truth'" | Canonical March 25, 1965 Baker County grand jury statement | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Stokely | Stokely Carmichael | 2 | 6 |
| ? | (probably) Joyce (a SNCC organizer) | Hosea Williams | 2 | 4 |
| ? | (likely) Charles Pruzan | (likely) Charles Pruzan | 2 | 2 |


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

The annotations in the master MD's `### 117. Shirley Miller Sherrod` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
