# Layer 5 fidelity findings — entry #34 Ekwueme Michael Thelwell

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 13 (0 canonical-figure / 13 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 33 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 5 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `34.48` | Pass 1 | biology professor of Ensuka, the evil man | biology professor at Nsukka (University of Nigeria, Nsukka) | 0.0 | low-impact |
| `34.50` | Pass 1 | Tugulu | Tougaloo | 0.0 | low-impact |
| `34.56` | Pass 1 | AMSAC | AMSAC (American Society of African Culture) | 0.0 | low-impact |
| `34.P2T.3` | Pass 2 tail-sweep | what's her name was being for it from our YMC grant... Connie Curry. Connie Curr | Connie Curry (YWCA/SNCC adult advisor) | 0.0 | low-impact |
| `34.P2T.36` | Pass 2 tail-sweep | the AFL, CIO | the AFL-CIO | 0.0 | low-impact |
| `34.P2T.132` | Pass 2 tail-sweep | freshman Democrats... John Connys, Democratic Michigan | John Conyers (Dem-MI) | 0.0 | low-impact |
| `34.P2T.145` | Pass 2 tail-sweep | the Union of Electricians... a leader, communist | UE (United Electrical, Radio and Machine Workers of America) | 0.0 | low-impact |
| `34.P2T.148` | Pass 2 tail-sweep | the average bro... average wide politician | Irish-brogue politician | 0.0 | low-impact |
| `34.P2T.149` | Pass 2 tail-sweep | his sainted mother | his sainted mother (Irish-Catholic idiom) | 0.0 | low-impact |
| `34.P2T.154` | Pass 2 tail-sweep | Congressman Senator Proxmar... a little sandy here in fellow | Sen. William Proxmire (Dem-WI) | 0.0 | low-impact |
| `34.P2T.162` | Pass 2 tail-sweep | Jesse Harris... project director in Macomb | Jesse Harris (SNCC McComb project director) | 0.0 | low-impact |
| `34.P2T.169` | Pass 2 tail-sweep | Pelham, Massachusetts (implicit from UMass context) | Pelham, Massachusetts (Thelwell's hometown near UMass-Amherst) | 0.0 | low-impact |
| `34.P3.6` | Pass 3 | "Mrs. Hema / Mrs. Hemmam / Mrs. Santa Lu Hemer" (Pass-2 #34.P2T.27) | Fannie Lou Hamer (catalog #C entry) | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | Joseph Rauh / Joe Rauh (Joseph L. Rauh Jr.) | Joseph L. Rauh Jr. | 4 | 7 |
| ? | Tougaloo | Tougaloo | 2 | 7 |
| ? | McComb, Mississippi | McComb, Mississippi | 2 | 4 |
| ? | *Blues for Mister Charlie* (James Baldwin play, 1964) | Charles "Mr. Charlie" Russell (Sr.) | 2 | 3 |
| ? | Bob Spike (Rev. Robert W. Spike) | Bob Spike (Rev. Robert W. Spike) | 2 | 3 |
| ? | Walter Reuther (UAW president) | Walter Reuther (UAW president) | 2 | 3 |
| ? | Catalog gaps | Catalog gaps | 3 | 3 |
| ? | Cleve Sellers (Cleveland Sellers) | Cleveland L. Sellers Jr. ("Cleve Sellers") | 2 | 2 |
| ? | Ralph Featherstone (SNCC field secretary) | Reverend Ralph Abernathy (Rev. Ralph David Abernathy) | 2 | 2 |
| ? | the Bombingham / Birmingham | the Bombingham / Birmingham | 2 | 2 |
| ? | Forman (James Forman) | Forman (James Forman) | 2 | 2 |
| ? | the prologue (?) | the prologue (?) | 2 | 2 |
| ? | MFDP first / Ms. (Fannie Lou) Hamer | MFDP first / Ms. (Fannie Lou) Hamer | 2 | 2 |
| ? | MFDP candidates | MFDP candidates | 2 | 2 |
| ? | MFDP letterhead | MFDP letterhead | 2 | 2 |
| ? | Robert Spike (Rev. Robert W. Spike) | Robert Spike (Rev. Robert W. Spike) | 2 | 2 |
| ? | Snick coffees / SNCC's office | Snick coffees / SNCC's office | 2 | 2 |
| ? | (Rep.) Robert Kastenmeier of Wisconsin | (Rep.) Robert Kastenmeier of Wisconsin | 2 | 2 |
| ? | WASP-gay / white-Anglo-Saxon-Protestant gay | WASP-gay / white-Anglo-Saxon-Protestant gay | 2 | 2 |
| ? | Goodman, Schwerner, Chaney | Goodman, Schwerner, Chaney | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `34.11` | Slave Sellers | Cleve Sellers (Cleveland Sellers) | Cleveland L. Sellers Jr. ("Cleve Sellers") | C-ext |  |
| `34.9` | Charlotte Cobb | Charlie Cobb (Charles E. Cobb Jr.) | Charles E. Cobb Jr. (Charlie Cobb) | C |  |
| `34.P2T.41` | Robert Spake / Bob Spake / Bob Speck (recurring) | Robert Spike (Rev. Robert W. Spike) | Bob Spike (Rev. Robert W. Spike) | O-ext |  |
| `34.P2T.49` | Stiklpande / Stiklpande coffees / Snickoffees | Snick coffees / SNCC's office | SNCC | B-ext |  |
| `34.P3.7` | "Sons of Malcolm" / "Acura" / "Castanmar from Wisconsin" — a | Catalog gaps | Sons of Malcolm (1966 pre-naming of BPP, honoring Malcolm X) | D |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **13 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 34. Ekwueme Michael Thelwell` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
