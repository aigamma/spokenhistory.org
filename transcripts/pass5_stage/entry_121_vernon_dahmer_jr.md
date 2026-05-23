# Layer 5 fidelity findings — entry #121 Vernon Dahmer, Jr.

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 10 (0 canonical-figure / 10 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 13 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 1 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `121.7` | Pass 1 | Peter Damer | Peter Dahmer | 0.0 | low-impact |
| `121.18` | Pass 1 | Bayspring school | Bay Springs School | 0.0 | low-impact |
| `121.19` | Pass 1 | Shady Grove | Shady Grove Baptist Church | 0.0 | low-impact |
| `121.P2.25` | Pass 2 | Jones County in law of Mississippi | Jones County and Laurel, Mississippi | 0.0 | low-impact |
| `121.P2.30` | Pass 2 | January 10th memorial services every year | January 10 (Vernon Dahmer Sr. death anniversary) | 0.0 | low-impact |
| `121.P2.33` | Pass 2 | did the rest in the boat | did the registering, the vote | 0.0 | low-impact |
| `121.P2.44` | Pass 2 | the dog tags | dog tags (USAF identification) | 0.0 | low-impact |
| `121.P3.3` | Pass 3 | "Cluclic clan / Clucleic clan" (Pass 2 121.P2.23) | Ku Klux Klan / KKK | 0.0 | low-impact |
| `121.P3.7` | Pass 3 | "Hadithworth" (Pass 2 footnote reference) | Hattiesburg | 0.0 | low-impact |
| `121.P4.10` | Pass 4 | "August 21st... 1998" (Sam Bowers conviction date) | August 21, 1998 (Sam Bowers conviction confirmed) | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Tougaloo / Tougaloo College | Tougaloo / Tougaloo College | 3 | 6 |
| ? | Vernon F. Dahmer Jr. | Vernon Dahmer / Dahmer Hall / Dahmer's son | 4 | 5 |
| ? | Medgar Evers | Medgar Evers | 2 | 3 |
| ? | Medgar (Evers) | Medgar Evers | 2 | 2 |
| ? | Alcorn State University | Alcorn (State University) | 2 | 2 |
| ? | George Dahmer / Ellen Kelly Dahmer | George Dahmer / Ellen Kelly Dahmer | 2 | 2 |
| ? | Jeanette (Smith) | Jeanette (Smith) | 2 | 2 |
| ? | Medgar (Evers) | Medgar (Evers) | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `121.22` | Tugaloo | Tougaloo | Whisper produces 8+ variant renderings of "Koinonia" alone a | C-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **10 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 121. Vernon Dahmer, Jr.` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
