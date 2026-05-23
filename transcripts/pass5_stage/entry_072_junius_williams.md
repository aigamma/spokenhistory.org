# Layer 5 fidelity findings — entry #72 Junius Williams

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 13 (0 canonical-figure / 13 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 26 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 6 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `72.11` | Pass 1 | Pratha Hall / Praithia | Prathia Hall | 0.0 | low-impact |
| `72.16` | Pass 1 | Ellen their homes | Eleanor Holmes Norton | 0.0 | low-impact |
| `72.36` | Pass 1 | Selma de Maagra March | Selma to Montgomery March | 0.0 | low-impact |
| `72.49` | Pass 1 | Bull Connor (Birmingham) | Bull Connor | 0.0 | low-impact |
| `72.50` | Pass 1 | Tuskegee Institute Advancement League | Tuskegee Institute Advancement League (TIAL) | 0.0 | low-impact |
| `72.P2.23` | Pass 2 | Ellen their homes | Eleanor Holmes Norton | 0.0 | low-impact |
| `72.P2.33` | Pass 2 | Yale Law | Yale Law School | 0.0 | low-impact |
| `72.P2.36` | Pass 2 | Praithia Hall / Praithia | Prathia Hall | 0.0 | low-impact |
| `72.P2.39` | Pass 2 | Carlton Hill | Clinton Hill (Newark NJ neighborhood) | 0.0 | low-impact |
| `72.P2.46` | Pass 2 | Bayard | Bayard Rustin | 0.0 | low-impact |
| `72.P2.54` | Pass 2 | Vissa | (possibly VISTA - Volunteers in Service to America) | 0.0 | low-impact |
| `72.P3.5` | Pass 3 | "Ellen their homes" → Eleanor Holmes Norton (cross-corpus) | Pass 2 #72.P2.23 noted "same Whisper drop as in #73 Cleaver" — this is a cross-c | 0.0 | low-impact |
| `72.P3.7` | Pass 3 | "Selma de Maagra March" → Selma to Montgomery March | High-distortion Whisper rendering for canonical Selma marches. Worth cataloging  | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Joe Mosnier | Joe Mosnier | 2 | 24 |
| ? | SNCC (Student Nonviolent Coordinating Committee) | SNCC (Student Nonviolent Coordinating Committee) | 2 | 22 |
| ? | Eleanor Holmes Norton | Eleanor Holmes Norton | 2 | 4 |
| ? | Ivanhoe Donaldson | Ivanhoe Donaldson | 2 | 3 |
| ? | Selma to Montgomery March | Selma to Montgomery March | 2 | 3 |
| ? | Kilby Prison / Kilby Correctional Facility | Kilby Prison / Kilby Correctional Facility | 3 | 3 |
| ? | Viola Liuzzo | Viola Liuzzo | 2 | 3 |
| ? | Ivanhoe Donaldson | Ivanhoe Donaldson | 3 | 3 |
| ? | Kigezi District (Uganda) | Kigezi District (Uganda) | 2 | 2 |
| ? | Hugh Addonizio (Mayor of Newark 1962–70) | Hugh Addonizio (Mayor of Newark 1962–70) | 2 | 2 |
| ? | Bessie Smith / Thurmond Smith (NCUP mainstays) | Bessie Smith / Thurmond Smith (NCUP mainstays) | 2 | 2 |
| ? | Amiri Baraka (LeRoi Jones) | Amiri Baraka (LeRoi Jones) | 2 | 2 |
| ? | Amiri Baraka (LeRoi Jones) | Amiri Baraka (LeRoi Jones) | 2 | 2 |
| ? | Ron Karenga (Dr. Maulana Karenga) | Ron Karenga (Dr. Maulana Karenga) | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `72.36` | Selma de Maagra March | Selma to Montgomery March | High-distortion Whisper rendering for canonical Selma marche | F-ext |  |
| `72.38` | Kilburg State Prison / Kilby | Kilby Prison / Kilby Correctional Facility | "Kilburg State Prison" → Kilby Correctional Facility | L-ext |  |
| `72.P2.12` | Berraka / Emiri Berraka | Amiri Baraka (LeRoi Jones) | "Berraka" / "Emiri Berraka" → Amiri Baraka | O-ext |  |
| `72.P2.17` | Selma de Maagra / Selma de Maagra March | Selma to Montgomery March | High-distortion Whisper rendering for canonical Selma marche | F-ext |  |
| `72.P3.3` | "Berraka" / "Emiri Berraka" → Amiri Baraka | Distinctive Whisper-failure for a canonical Black Arts Movem | "Berraka" / "Emiri Berraka" → Amiri Baraka | O-ext |  |
| `72.P3.8` | "Kilburg State Prison" → Kilby Correctional Facility | Canonical Alabama state prison (Mt. Meigs near Montgomery);  | "Kilburg State Prison" → Kilby Correctional Facility | L-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **13 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 72. Junius Williams` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
