# Layer 5 fidelity findings — entry #124 Walter Tillow

**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)
**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).

## Summary

| Dimension | Findings affecting this entry |
|---|---:|
| D1 — Phantom Whisper-renderings | 24 (0 canonical-figure / 24 low-impact) |
| D2 — Bidirectional canonical inconsistencies | 21 (cluster participations) |
| D3 — Catalog-vs-per-entry contradictions | 1 |
| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |

## D1 — Phantom Whisper renderings

Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.

| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |
|---|---|---|---|---:|---|
| `124.P2.72` | Pass 2 | Tip O'Neill | Tip O'Neill (Thomas P. O'Neill Jr.) | 0.0 | low-impact |
| `124.P2.80` | Pass 2 | warning | Warren (Chief Justice Earl Warren) | 0.0 | low-impact |
| `124.P2.113` | Pass 2 | Camille | Camille (Kay Tillow — speaker's wife) | 0.0 | low-impact |
| `124.P2.115` | Pass 2 | Padaca | Paducah, Kentucky | 0.0 | low-impact |
| `124.P3.1` | Pass 3 | "Maddie Redbus → Medgar Evers" (Pass 2 124.P2.27) | Critical canonical-figure failure | 0.0 | low-impact |
| `124.P3.2` | Pass 3 | "Lauren green → Lorne Greene" (Pass 2 124.P2.28) | Bonanza-cast Whisper failure | 0.0 | low-impact |
| `124.P3.3` | Pass 3 | "Stelke / Stoke → Stokely (Carmichael)" + "Lounce County → Lowndes County" (Pass | Both already in catalog | 0.0 | low-impact |
| `124.P3.4` | Pass 3 | "Hartman term bowl → Hartman Turnbow" (Pass 2 124.P2.44) | Already in catalog row C | 0.0 | low-impact |
| `124.P3.5` | Pass 3 | "Amsy Moore → Amzie Moore" (Pass 2 124.P2.45) | Already in catalog row C | 0.0 | low-impact |
| `124.P3.6` | Pass 3 | "Lawrence Giat → Lawrence Guyot" (Pass 2 124.P2.46) | Canonical MFDP chairman | 0.0 | low-impact |
| `124.P3.7` | Pass 3 | "Shorin a goodman cheney → Schwerner Goodman Chaney" (Pass 2 124.P2.47) | Already in catalog row G | 0.0 | low-impact |
| `124.P3.8` | Pass 3 | "Yenday → Allende" + "pinnachet → Pinochet" (Pass 2 124.P2.52-53) | International political figures Whisper failure | 0.0 | low-impact |
| `124.P3.9` | Pass 3 | "Kuntzor / Kuntsor → Kunstler" (Pass 2 124.P2.57) | Already in catalog row D | 0.0 | low-impact |
| `124.P3.10` | Pass 3 | "skeff / Sea SEC → SCEF" (Pass 2 124.P2.88-89) | Southern Conference Educational Fund canonical | 0.0 | low-impact |
| `124.P3.11` | Pass 3 | "the buyer → Bayard" (Pass 2 124.P2.12) | Canonical Bayard Rustin Whisper failure | 0.0 | low-impact |
| `124.P3.12` | Pass 3 | "warning → Warren (Earl Warren)" (Pass 2 124.P2.80) | Chief Justice Whisper failure | 0.0 | low-impact |
| `124.P3.13` | Pass 3 | "frank footer → Felix Frankfurter" + "Doug was → William O. Douglas" + "eyes and | SCOTUS-era political figures Whisper failure | 0.0 | low-impact |
| `124.P3.14` | Pass 3 | "Helbert Tuttle → Elbert Tuttle" + "minor wisdom → Minor Wisdom" (Pass 2 124.P2. | 5th Circuit jurists Whisper failure | 0.0 | low-impact |
| `124.P3.15` | Pass 3 | "Padaca → Paducah" + "K-Row Illinois → Cairo IL" (Pass 2 124.P2.114-115) | Geographic Whisper failures | 0.0 | low-impact |
| `124.P3.16` | Pass 3 | "Mrs. Beer → Mississippi (MFDP)" (Pass 2 124.P2.17) | Critical state-name Whisper failure | 0.0 | low-impact |
| `124.P3.17` | Pass 3 | "Wilkins → Roy Wilkins" (Pass 2 124.P2.98) | Speaker correctly identifies but Whisper failed to provide first-name context | 0.0 | low-impact |
| `124.P3.18` | Pass 3 | "Camille → Kay (Tillow)" (Pass 2 124.P2.113) | Spousal cross-corpus #74 reference | 0.0 | low-impact |
| `124.P3.19` | Pass 3 | "King Spock → King + Spock 1968 ticket" (Pass 2 124.P2.48) | Canonical 1968 King-Spock presidential-ticket plan | 0.0 | low-impact |
| `124.P3.20` | Pass 3 | "the comment well, we invited a social worker → Socialist Workers' (Party)" (Pas | Canonical 1960 SWP speaker context | 0.0 | low-impact |


## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)

Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.

| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |
|---|---|---|---:|---:|
| ? | James Forman (Jim Forman) | James Forman (Jim Forman) | 2 | 10 |
| ? | Joseph L. Rauh Jr. | Joseph L. Rauh Jr. | 4 | 7 |
| ? | Stokely Carmichael | Stokely Carmichael | 2 | 6 |
| ? | Dinky Romilly (Constance "Dinky" Romilly) | Dinky Romilly (Constance "Dinky" Romilly) | 2 | 5 |
| ? | Ruth-Etta Harris | Ruth-Etta Harris | 2 | 3 |
| ? | Camille (Kay Tillow — speaker's wife) | Dr. Charles Gomillion | 3 | 3 |
| ? | Anne Romaine | Anne Romaine | 2 | 3 |
| ? | Bertha Reynolds | Bertha Reynolds | 2 | 3 |
| ? | (James) Eastland + (John) Stennis + Governor (Ross) Barnett | James O. Eastland | 2 | 2 |
| ? | (Judge) Minor Wisdom | Judge John Minor Wisdom | 2 | 2 |
| ? | Tony Zivkovich | (likely) Tony Zivkovich (Teamsters Atlanta business agent) | 2 | 2 |
| ? | Mike Sair (likely Michael Sayer) | Mike Sair (likely Michael Sayer) | 2 | 2 |
| ? | (canonical) "I'm Going to Sit at the Welcome Table" / Allome | (canonical) "I'm Going to Sit at the Welcome Table" / Allome | 2 | 2 |
| ? | Lowndes County (Alabama) | Lowndes County (Alabama) | 2 | 2 |
| ? | Ben Wilson / Benjamin Wilson | Ben Wilson / Benjamin Wilson | 2 | 2 |


## D3 — Catalog-vs-per-entry contradictions

Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.

| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |
|---|---|---|---|---|---|
| `124.14` | Dinky Romley | Dinky Romilly (Dorothy Miller Zellner; or Dottie Miller's si | Dinky Forman (Constance "Dinky" Romilly Forman) | C |  |


## Deploy status (per commit `2669753` — 2026-05-22 evening)

Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:

- **0 canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)
- **24 low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)
- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations
- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`
- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`

## Ensemble handoff

The annotations in the master MD's `### 124. Walter Tillow` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.

## Related artifacts

- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`
- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`
- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`
- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`
- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`
- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`
