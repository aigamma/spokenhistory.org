# Layer 5 fidelity findings — entry #112 Ruby Sales

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 9 (0 canonical-figure / 9 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 5 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 1 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `112.P2.28` | Pass 2 | the snake debate | the SNCC debate | 0.0 | low-impact |
| `112.P2.65` | Pass 2 | the Voter's Rights Act | the Voting Rights Act (1965) | 0.0 | low-impact |
| `112.P2.69` | Pass 2 | Tent City under Avanathy | Tent City under (Ralph) Abernathy | 0.0 | low-impact |
| `112.P2.85` | Pass 2 | the Southern Negro Youth Congress | Southern Negro Youth Congress (SNYC, 1937-49) | 0.0 | low-impact |
| `112.P2.93` | Pass 2 | who could have stand that sinful boxing | who couldn't have stand that sinful boxing | 0.0 | low-impact |
| `112.P3.2` | Pass 3 | "Black Manifesto" cross-reference (also caught in #115 McKinney) | James Forman's 1969 Black Manifesto | 0.0 | low-impact |
| `112.P3.4` | Pass 3 | "the canonical Selma 1965 church-siege" experience | the canonical Brown Chapel AME or Tabernacle Baptist Church Selma post-Bloody-Su | 0.0 | low-impact |
| `112.P3.6` | Pass 3 | "the canonical Hubbard / Hulett / Jackson / Maul Lowndes-County freedom houses"  | the canonical 1965 Lowndes County freedom-house network | 0.0 | low-impact |
| `112.P4.15` | Pass 4 | "Caroliner, the Lily of the Valley, Bright Morning Star" (cross-corpus pattern) | gospel-song-lyric Whisper-degradation pattern | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Southern Oral History Program | Southern Oral History Program | 2 | 4 |
| ? | Lowndes County | Lowndes County | 2 | 3 |
| ? | Mr. Jackson | Matthew Jackson Sr. (likely) | 2 | 2 |
| ? | Lowndes County, Alabama | "Lowndes County, Alabama" | 2 | 2 |
| ? | First Assisi (Civilian Conservation) Camp / CCC | Civilian Conservation Corps (CCC) | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `112.P3.4` | "the canonical Selma 1965 church-siege" experience | the canonical Brown Chapel AME or Tabernacle Baptist Church  | "the canonical Selma 1965 church-siege" experience | F-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **9 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 112. Ruby Sales` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
