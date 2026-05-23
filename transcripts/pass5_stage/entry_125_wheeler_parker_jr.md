# Layer 5 fidelity findings — entry #125 Wheeler Parker, Jr.

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 19 (0 canonical-figure / 19 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 16 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 1 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `125.11` | Pass 1 | Mose Wright | Moses (Mose) Wright | 0.0 | low-impact |
| `125.20` | Pass 1 | Mr. Roy Bryant + J.W. Milam | Roy Bryant + J.W. Milam | 0.0 | low-impact |
| `125.22` | Pass 1 | Mamie Till | Mamie Till-Mobley | 0.0 | low-impact |
| `125.P2.7` | Pass 2 | Greenwood, packing's town | Greenwood (Mississippi packed-shopping-town reference) | 0.0 | low-impact |
| `125.P2.18` | Pass 2 | Mose Wright / Moses Wright | Moses Wright (Mose Wright) | 0.0 | low-impact |
| `125.P2.32` | Pass 2 | Mr. Roy Bryant + J.W. Milam | Roy Bryant + J.W. Milam | 0.0 | low-impact |
| `125.P2.33` | Pass 2 | Mamie Till | Mamie Till-Mobley | 0.0 | low-impact |
| `125.P2.46` | Pass 2 | the call about that experience | the conversation about that experience | 0.0 | low-impact |
| `125.P2.52` | Pass 2 | sheriff is gone | the sheriff is gone (Tallahatchie County investigation) | 0.0 | low-impact |
| `125.P3.1` | Pass 3 | "Tallahassee County → Tallahatchie County" (Pass 2 125.P2.20) | Already cross-corpus #105 Tuttle | 0.0 | low-impact |
| `125.P3.2` | Pass 3 | "Aaron Curtin → Iron Curtain" (Pass 2 125.P2.3, 125.P2.47) | Common-noun Cold War metaphor failure | 0.0 | low-impact |
| `125.P3.3` | Pass 3 | "Keith Bochamp → Keith Beauchamp" (Pass 2 125.P2.30) | Already in Pass 2 notes; formalize | 0.0 | low-impact |
| `125.P3.4` | Pass 3 | "TL bill → Till Bill" (Pass 2 125.P2.27) | Canonical legislation Whisper failure | 0.0 | low-impact |
| `125.P3.5` | Pass 3 | "6th and 4th in St. Lawrence → 64th and St. Lawrence" (Pass 2 125.P2.11) | Address-parsing Whisper failure | 0.0 | low-impact |
| `125.P3.6` | Pass 3 | "Bobo → Emmett Till's family nickname" (Pass 2 125.P2.13) | Family-nickname disambiguation | 0.0 | low-impact |
| `125.P3.7` | Pass 3 | "Mr. Bryant → Mrs. (Carolyn) Bryant" recurring (Pass 2 125.P2.12, 125.P2.51) | Gender-pronoun Whisper failure | 0.0 | low-impact |
| `125.P3.8` | Pass 3 | "Iroh → Argo" (Pass 2 125.P2.50) | Geographic Whisper failure | 0.0 | low-impact |
| `125.P3.9` | Pass 3 | "Simian / Simyan → Simeon Wright" (Pass 2 125.P2.15) | Canonical Till-case eyewitness | 0.0 | low-impact |
| `125.P4.18` | Pass 4 | "ridge over the the highway" / "Stripped of highway" | "stretch of highway (Emmett Till Memorial Highway)" | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Curtis Jones | Curtis Jones | 2 | 3 |
| ? | Maurice Wright (canonical "Bobo" was Emmett Till's nickname) | Johnny Lee Roberts | 3 | 3 |
| ? | Iron Curtain | Iron Curtain | 2 | 3 |
| ? | Carolyn Bryant Donham | Detective Brown (NYPD 32nd Precinct) | 2 | 2 |
| ? | Maurice Wright | Marie (Sallasin) and Pat (Patricia Washington) | 2 | 2 |
| ? | Benjamin "Ben" Wilson Jr. | Ben Wilson / Benjamin Wilson | 2 | 2 |
| ? | Summit / Argo / Cuddahy, Illinois | Summit / Argo / Cuddahy, Illinois | 2 | 2 |
| ? | Maurice Wright (canonical "Bobo" was Emmett Till's nickname) | Maurice Wright (canonical "Bobo" was Emmett Till's nickname) | 2 | 2 |
| ? | Benjamin Wilson (likely) | Benjamin Wilson (likely) | 2 | 2 |
| ? | Mrs. (Carolyn) Bryant came out | Mrs. (Carolyn) Bryant came out | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `125.P2.48` | Tugaloo / Tugulu (none here) | n/a | Tougaloo / Tougaloo College | F |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **19 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 125. Wheeler Parker, Jr.` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
