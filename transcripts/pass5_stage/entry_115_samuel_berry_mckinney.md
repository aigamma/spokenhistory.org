# Layer 5 fidelity findings — entry #115 Samuel Berry McKinney

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 13 (0 canonical-figure / 13 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 8 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 1 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `115.34` | Pass 1 | Bishop Burgess | Bishop John Melville Burgess | 0.0 | low-impact |
| `115.38` | Pass 1 | Roslyn / Roslin (WA) | Roslyn, Washington | 0.0 | low-impact |
| `115.49` | Pass 1 | Antoine | Antioch (Baptist Church) | 0.0 | low-impact |
| `115.P2.29` | Pass 2 | a 30-year ministry | 34-and-a-half-year pastorate | 0.0 | low-impact |
| `115.P2.92` | Pass 2 | Pond Street Baptist | Pond Street Baptist (Church, Providence RI) | 0.0 | low-impact |
| `115.P2.94` | Pass 2 | First Presbyterian Church | First Presbyterian Church Seattle | 0.0 | low-impact |
| `115.P2.96` | Pass 2 | World's Fair | (Seattle) World's Fair | 0.0 | low-impact |
| `115.P2.114` | Pass 2 | Renton, WA | Renton, Washington | 0.0 | low-impact |
| `115.P2.170` | Pass 2 | the urban age | the Urban League | 0.0 | low-impact |
| `115.P2.183` | Pass 2 | a couple of credit, good-sized supermarkets | a couple of pretty good-sized supermarkets | 0.0 | low-impact |
| `115.P2.202` | Pass 2 | the canonical Joel Russell Berry / "Squad Run F" | the canonical Squadron F | 0.0 | low-impact |
| `115.P3.3` | Pass 3 | "the canonical accelerated-college admission program" (Georgia 1944 WWII enrollm | the canonical Georgia accelerated-college program for WWII enrollment shortfall | 0.0 | low-impact |
| `115.P3.9` | Pass 3 | "the Cleveland Transit System hiring-boycott" (Pass 2 P2.52) | the canonical 1930s-40s Cleveland Transit System Black-hiring-boycott | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | (Sophia B.) Packard and (Harriet E.) Giles | (Sophia B.) Packard and (Harriet E.) Giles | 2 | 2 |
| ? | Laura Spelman Rockefeller | Laura Spelman Rockefeller | 2 | 2 |
| ? | anointed me to preach the gospel | anointed me to preach the gospel | 2 | 2 |
| ? | "Squirt" (MLK nickname at Morehouse) | "Squirt" (MLK nickname at Morehouse) | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `115.P3.6` | "MacMex" pattern check (catalog row D entry #32) | not present in this transcript | Malcolm X | D |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **13 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 115. Samuel Berry McKinney` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
