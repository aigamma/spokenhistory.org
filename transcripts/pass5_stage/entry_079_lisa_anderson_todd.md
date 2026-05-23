# Layer 5 fidelity findings — entry #79 Lisa Anderson Todd

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 13 (0 canonical-figure / 13 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 35 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 15 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `79.37` | Pass 1 | Heidi Booth | Heather Booth | 0.0 | low-impact |
| `79.48` | Pass 1 | Carter family swimming pool | Hodding Carter family pool (Greenville MS) | 0.0 | low-impact |
| `79.55` | Pass 1 | Frisbee, Dr. | Dr. Matthew T. Frisbee | 0.0 | low-impact |
| `79.63` | Pass 1 | Friendship Baptist Temple Church | Friendship Baptist Church (Greenville MS) | 0.0 | low-impact |
| `79.P2.38` | Pass 2 | Tugulu... Tugelow | Tougaloo | 0.0 | low-impact |
| `79.P2.50` | Pass 2 | Bob Moses, Joe Rao, Aaron Henry, Ed King | (correct — canonical MFDP leadership) | 0.0 | low-impact |
| `79.P2.61` | Pass 2 | Sharkey, Issaquena, Washington | (canonical Greenville MS SNCC Mississippi Delta project area) | 0.0 | low-impact |
| `79.P2.106` | Pass 2 | swarna chain goodman | Schwerner, Chaney, Goodman | 0.0 | low-impact |
| `79.P2.117` | Pass 2 | Charles Moore became a member of the city council | (Greenville Black city councilor — speaker recall) | 0.0 | low-impact |
| `79.P2.125` | Pass 2 | Joe Rao was offering to withdraw in a letter to the White House | (canonical late-Aug 1964 Rauh letter to LBJ White House — pivotal speaker resear | 0.0 | low-impact |
| `79.P2.131` | Pass 2 | Stanford Law School | (correct — speaker's law school 1964-67) | 0.0 | low-impact |
| `79.P2.137` | Pass 2 | when Bob Moses comes back from McComb, when one of the witnesses was killed that | (Louis Allen witness murder Jan 1964, cross-ref Guyot #76.54 + #76.55) | 0.0 | low-impact |
| `79.P4.2` | Pass 4 | active in the Lutheran Church of America... elected treasurer of the Lutheran Ch | (correct as transcribed — Pass 1's Subject paragraph said "UCC" but raw transcri | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Joseph L. Rauh Jr. | Joseph L. Rauh Jr. | 4 | 7 |
| ? | Tougaloo | Tougaloo | 2 | 7 |
| ? | Hodding Carter (II/III) | Hodding Carter (II/III) | 2 | 4 |
| ? | Hodding Carter (III) | Hodding Carter (III) | 3 | 4 |
| ? | Walter Reuther (UAW president) | Walter Reuther (UAW president) | 2 | 3 |
| ? | Dr. (Ernst) Borinski | Dr. (Ernst) Borinski | 2 | 3 |
| ? | Spottswood W. Robinson III | Spottswood W. Robinson III | 2 | 3 |
| ? | Hodding Carter (II + III) | Hodding Carter (II + III) | 3 | 3 |
| ? | Recurring Whisper drop of final "e" | Anne Romaine | 2 | 3 |
| ? | the symbolic two-seat offer | Whisper homophone confusion: "to seek/seat/seat" — canonical | 2 | 2 |
| ? | Cross-corpus with Guyot #76.P3.13 | Whisper homophone confusion: "to seek/seat/seat" — canonical | 2 | 2 |
| ? | Heather Booth | Heather Booth | 2 | 2 |
| ? | Anne Romaine | Anne Romaine | 2 | 2 |
| ? | Jerry and Lamar Britton | Jerry and Lamar Britton | 2 | 2 |
| ? | Issaquena (or Sharkey) County | Issaquena (or Sharkey) County | 2 | 2 |
| ? | the Lawyers' Committee for Civil Rights Under Law | the Lawyers' Committee for Civil Rights Under Law | 2 | 2 |
| ? | Morgan, Lewis & Bockius | Morgan, Lewis & Bockius | 2 | 2 |
| ? | Bill Kunstler | Bill Kunstler | 2 | 2 |
| ? | Arthur Kinoy | Arthur Kinoy | 2 | 2 |
| ? | Whisper recurring homophone in interview-opening template | Whisper recurring homophone in interview-opening template | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `79.37` | Heidi Booth | Heather Booth | First-name garble of canonical SNCC + Citizen Action founder | B-ext |  |
| `79.39` | Anne Romain | Anne Romaine | Recurring Whisper drop of final "e" | E-ext |  |
| `79.P2.102` | Connolly of Texas | Gov. John Connally of Texas | (Gov. John) Connally Jr. (TX) | F-ext |  |
| `79.P2.105` | Lawrence of the Committee | Chairman (David) Lawrence of the Credentials Committee | David L. Lawrence (Credentials Committee Chair) | E-ext |  |
| `79.P2.107` | Bill Consler | Bill Kunstler | Recurring Whisper rendering of canonical movement lawyer | C-ext |  |
| `79.P2.108` | Arthur Canoei | Arthur Kinoy | "Arthur Canoei" / "Canoa" -> "Arthur Kinoy" | C-ext |  |
| `79.P2.112` | Hiding Carter family / Hotting Carter / Heidi Carter | Hodding Carter family | Recurring Whisper renderings of canonical Hodding Carter II/ | C-ext |  |
| `79.P2.141` | the symbolic to seat offer | the symbolic two-seat offer | Whisper homophone confusion: "to seek/seat/seat" — canonical | O-ext |  |
| `79.P2.59` | Cherokee | Issaquena (or Sharkey) County | Whisper preserves speaker's "Cherokee" error but does not ca | F-ext |  |
| `79.P3.14` | "to seat" / "to seek" Whisper homophone confusion at MFDP co | Cross-corpus with Guyot #76.P3.13 | "to seat" / "to seek" Whisper homophone confusion at MFDP co | B-ext |  |
| `79.P3.2` | "Walter Ruther" -> "Walter Reuther" | Severe Whisper omission of "e" in UAW president's surname | "Walter Ruther" -> "Walter Reuther" | L-ext |  |
| `79.P3.20` | "Mississippi students union, the high school students" -> "M | Recurring Whisper compression of canonical MFDP youth organi | Mississippi Student Union | B-ext |  |
| `79.P3.3` | "Morgan Lewis and Bacchius" -> "Morgan, Lewis & Bockius" | Severe Whisper garble of canonical major DC/Philadelphia law | "Morgan Lewis and Bacchius" -> "Morgan, Lewis & Bockius" | C-ext |  |
| `79.P3.7` | "Arthur Canoei" / "Canoa" -> "Arthur Kinoy" | Severe Whisper garble; cross-corpus with Guyot #76.52 ("Kana | "Arthur Canoei" / "Canoa" -> "Arthur Kinoy" | C-ext |  |
| `79.P3.9` | "Spotswood Robinson" -> "Spottswood W. Robinson III" | Whisper drops the second "t" in canonical NAACP LDF attorney | Spottswood W. Robinson III | L-ext |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **13 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 79. Lisa Anderson Todd` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
