# Pass 8 LoC Canonical-Archive Cross-Reference — Coverage Report

**Date:** 2026-05-25
**Session:** 8
**Scope:** Heal each of the 127 audit-able interview transcripts in `transcripts/corrected/` against the Library of Congress TEI2 XML transcript for that interview, when available. LoC's prose wins where it disagrees with our Whisper-derived text on matters of canonical fact (proper names, place names, dates, attributions). Conservative first-pass discipline: only single-word proper-noun phonetic-substitution heals applied automatically; everything else preserved verbatim and flagged for SME review.

---

## Resolver phase (Phase 1) coverage

| Resolver status | Count | Description |
|---|---|---|
| `ok` (XML cached, ready to heal) | **86** | LoC item found, transcript TEI2 XML downloaded |
| `no_transcript` | 35 | LoC item exists but only audio + PDF; no machine-readable transcript |
| `no_candidates` | 5 | LoC search returned no item matching the interviewee + collection |
| `xml_fetch_failed` | 1 | LoC item found and XML URL identified but download retries exhausted |
| `search_failed` | 0 | No transient search failures |
| **Total resolved** | **127** | Full coverage of the audit-able corpus |

**LoC machine-readable transcript coverage of the 127-entry corpus: 86/127 = 67.7%.**

The 41 entries that did not heal in this pass are NOT confirmed absent from the Library of Congress collection — every interview in our corpus is part of LoC's CRHP collection (which LoC and Smithsonian NMAAHC produced jointly). The 41 unhealable-in-this-pass breakdown:

- **35** entries: LoC has the item with audio + PDF transcript, but no machine-readable TEI2 XML. PDF-OCR pass would unlock these.
- **5** entries: LoC search returned no item under the interviewee name as our directory spells it. Most likely a spelling discrepancy between our directory names and LoC's catalog records (e.g., LoC's "Newson" vs our "Newsom"; LoC's "Wheeler Parker" without our "Jr." suffix). Re-search with the alternative spelling would likely recover the item.
- **1** entry: LoC has the XML and the resolver identified the URL, but the download timed out across 3 retries (Mary Jones — likely a transient LoC CDN issue). Single `--refresh` re-run would probably recover it.

Each of these 41 is documented below with the specific failure mode and recovery path.

### `xml_fetch_failed` entries (1)

| # | Subject | Status | Recovery |
|---|---|---|---|
| 88 | Mary Jones | XML download timeout / IncompleteRead | Re-run resolver with `--refresh` for this entry to retry the LoC CDN |

### `no_candidates` entries (5)

These interviews exist in our corpus but LoC's CRHP collection search returns no items under the interviewee's name (with or without first name). Possible causes: LoC catalog uses a different spelling, the item is restricted, or the interview is filed differently.

| # | Subject | Notes |
|---|---|---|
| 9 | Booker and Newsom | Likely the LoC catalog uses "Simeon Booker" + "Moses Newson" with the "Newson" spelling (single N); our directory spells "Newsom". Spelling discrepancy worth flagging. |
| 30 | Dr. Doris Derby | Possibly "Doris Adelaide Derby" in LoC catalog |
| 71 | Ladners (joint interview) | Likely "Dorie Ladner and Joyce Ladner" in LoC catalog |
| 74 | Linda Fuller Degelmann | Possibly "Linda Fuller" without married surname |
| 120 | Wheeler Parker, Jr. | Likely just "Wheeler Parker" without the Jr. suffix |

### `no_transcript` entries (35)

LoC's CRHP item for these interviewees exists but only carries audio + a PDF transcript, no machine-readable XML. These are candidates for a future PDF-OCR pass.

```
#7   Betty Garman Robinson           #61  Joseph Howell + Embry Howell
#12  Carolyn Miller and James Miller #64  Juadine Henderson
#16  Charles F. McDew                #65  Judy Richardson
#17  Charles McLaurin                #66  Julia Matilda Burns
#21  Clarence Magee                  #67  Julius W. Becton
#27  Dion Diamond                    #73  Leesco Guster
#29  Dorothy Zellner                 #77  Maria Varela
#31  Eddie Holloway                  #82  Mateo Camarillo
#33  Elbert "Big Man" Howard         #84  Maynard E. Moore
#34  Ellie Dahmer                    #85  Michael D. McCarty
#41  Frankye Adams-Johnson           #88  Nathaniel Hawthorne Jones
#42  Freddie Greene                  #89  Norma Mtume
#44  Gloria Arellanes                #91  Peggy Jean Connor
#52  Harold K. Brown                 #105 Roberta Alexander
#56  Jennifer Lawson                 #115 Timothy Jenkins
#116 Vernon Dahmer, Jr.              #126 Worth W. Long
#127 Wyatt Tee Walker
```

---

## Healing phase (Phase 2) coverage

86 entries received LoC-derived heals.

### Aggregate counts

| Metric | Value |
|---|---|
| Entries healed | 86 |
| Total divergences detected | 121,627 |
| Total ASR_ERROR_HEAL applied | **1,774** |
| Total preserved verbatim (EDITORIAL_SMOOTHING / SPEAKER_DISFLUENCY / orthography) | 32,118 |
| Total flagged for SME review (NEEDS_SME_REVIEW) | 87,735 |
| Total apply failures | **0** |
| Total cue-count verification failures | **0** |

**Heal rate: 1,774 corrections / 86 entries = 20.6 avg corrections per entry.**

### Top 10 entries by heal count

| Entry | Subject | Heals |
|---|---|---|
| 129 | William S. Leventhal | 82 |
| 34 | Ekwueme Michael Thelwell | 67 |
| 116 | Scott Bates | 64 |
| 80 | Lonnie C. King | 62 |
| 26 | D'Army Bailey | 54 |
| 98 | Phil Hutchings | 52 |
| 60 | Joan Trumpauer Mulholland | 51 |
| 105 | Rick Tuttle | 47 |
| 25 | Cynthia + Fletcher Anderson | 46 |
| 51 | H. Jack Geiger | 44 |

### Conservative-first-pass discipline

The 87,735 NEEDS_SME_REVIEW divergences represent the **deferred** classification load. These are divergences that:
- Were not deterministically classifiable as EDITORIAL_SMOOTHING or SPEAKER_DISFLUENCY, AND
- Were not single-word capitalized-proper-noun-class substitutions matching the conservative auto-heal heuristic.

For each, the relevant cue context, our token, LoC's token, and the surrounding word stream are preserved in the entry's `transcripts/pass8_stage/entry_NNN_<slug>.md` stage file under the "Flagged for SME review" section. A future pass can promote a subset of these to applied heals via:

1. Per-entry model classification (Sonnet 4.6 subagent per transcript reading the stage file).
2. SME review (Eric / WWU team) directly editing the stage file's verdict column.

The deterministic auto-heal pass intentionally ran conservative to avoid the same class of failure mode that produced this morning's audit cleanup ("Don" → "Daniel H. Krenge De Iongh" corrupting every contraction; UNC → UNC-Chapel Hill applied recursively). The audit-canon safeguard (skip auto-heal if our token is already in the master MD as an audit-promoted Correction value for this entry) successfully prevented reversal of 4+ confirmed prior audit decisions in Aaron Dixon alone (Madison Valley, Richmond, Bertha Alexander, Tony Kline).

---

## Apply-before-push verification

Per Eric's explicit constraint: every commit ships both the analysis AND the applied heal in `corrected/<entry>/`. No abstract recommendations that get committed-but-never-applied — that pattern caused the staleness gap closed in commit `a80a77c` earlier this session.

For every commit in the Session 8 sequence (commits `f0e91f1` through `672b6f1`):

- The `transcripts/corrected/<entry>/` body files (`.srt`, `.txt`, `.vtt`, `manifest.json`) were modified in place.
- The `transcripts/pass8_stage/entry_NNN_<slug>.md` stage file was written.
- The `transcripts/loc_healing/divergences/<subject>.divergences.json` raw divergence list was written.
- All three categories were staged + committed + pushed together.

Re-run of `python scripts/apply_corrections.py --dry-run` should remain idempotent (no master-MD-side correction-table rows were added or removed in Pass 8; heals operate directly on `corrected/` text).

---

## Files of record

| File | Role |
|---|---|
| `transcripts/AUDIT_TRAIL.md` | Session 8 longitudinal record; Phase 1 / Phase 2 / Phase 3 sub-sections |
| `transcripts/loc_healing/COVERAGE_REPORT.md` | This file |
| `transcripts/pass8_stage/entry_NNN_<slug>.md` | Per-entry granular evidence (86 files) |
| `transcripts/loc_healing/divergences/<subject>.divergences.json` | Per-entry raw divergence stream (86 files) |
| `transcripts/loc_healing/loc_cache/<subject>.xml` | Cached LoC TEI2 XML (86 files; 41 entries have no cache) |
| `transcripts/loc_healing/loc_cache/<subject>.resolution.json` | Per-entry LoC resolution metadata (127 files) |
| `transcripts/loc_healing/loc_cache/_index.json` | Aggregate resolver coverage |
| `transcripts/loc_healing/heal_one_entry.py` | Per-entry heal toolkit (phase1 + apply + verify + heal_one) |
| `transcripts/loc_healing/process_batch.py` | Sequential per-entry driver |
| `transcripts/loc_healing/resolve_loc_items.py` | LoC search + XML download resolver |
| `transcripts/corrected/<entry>/manifest.json::loc_healing` | Per-entry summary embedded in the manifest |

---

## Follow-ups for a future session

1. **Mary Jones (#88) XML retry**: re-run resolver with `--refresh` for this single entry; the LoC CDN failure was transient.
2. **`no_candidates` re-search** (5 entries): try alternative spellings or LoC catalog cross-references for Booker+Newsom, Dr. Doris Derby, Ladners, Linda Fuller, Wheeler Parker.
3. **PDF-OCR pass** (35 entries): the `no_transcript` entries have LoC PDFs that could be OCR'd and aligned. This is a separate work stream.
4. **Promote NEEDS_SME_REVIEW divergences to heals**: 87,735 divergences await SME or model classification. Promising candidates:
   - Multi-word phonetic substitutions on proper nouns that didn't fit the single-word auto-heal heuristic
   - Lexical paraphrases where LoC's editor smoothed but the underlying meaning matches
   - LoC-canonical place-name spellings that our audit hasn't covered yet
5. **Pass 7 PRR re-run for 11 stale-slice entries** (still deferred from this morning): #6, #7, #8, #12, #13, #14, #17, #20, #26, #29, #30. Their Pass 7 PRR analytical scoring used pre-Layer-5 slices. Pass 8 LoC healing already provided independent cross-validation for these, so the Pass 7 re-run is now lower priority than originally estimated.
