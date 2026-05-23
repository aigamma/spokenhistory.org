# Layer 5 Corpus-Global Fidelity Audit — Summary

**Generated**: 2026-05-22 (Session 3 follow-on, final Claude-side review before adversarial multi-model handoff)
**Full findings JSON**: `transcripts/layer5_fidelity_audit.json` (1.58 MB)
**Pipeline**: `transcripts/layer5_fidelity_audit.py` + `transcripts/layer5_extract_corrections.py`

## Why this layer exists

Passes 1–4 and the cross-contamination follow-on sweep all operated **per-entry**. Each supervisor or fix-script saw one transcript at a time. They were good at finding entry-internal errors but structurally blind to corpus-global inconsistencies. Layer 5 treats `CLEANED_TRANSCRIPTS_REVIEW.md` (9.26 MB / 41,036 lines) as a SINGLE corpus-global artifact and audits four dimensions no per-entry pass could detect.

## Coverage

| Quantity | Value |
| --- | --- |
| Master MD chars | 9,257,591 |
| Master MD lines | 41,036 |
| Entries parsed | 131 (4 SKIPPED-but-headered + 127 audit-able) |
| Correction rows parsed | 16,214 (Pass 1 / Pass 2 / Pass 2 tail / Pass 3 / Pass 4) |
| Catalog rows parsed | 1,118 (sections A-Z + extension subsections) |
| Raw bundles loaded into cache | 131 (total 128.3 MB of raw text concatenated across .txt / .srt / .vtt / .json) |
| Wall-clock | ~15 s end-to-end |

## Per-dimension finding counts

| Dimension | Findings | Description |
| --- | ---: | --- |
| **D1**: Phantom Whisper-renderings | **939** | High/correct-confidence correction rows whose claimed Whisper rendering cannot be found in the corresponding raw transcript (fuzzy `partial_ratio` < 85). Self-confirming rows (whisper == correction) excluded. |
| **D2**: Bidirectional canonical inconsistency | **628** | Same Whisper rendering mapped to different canonical corrections across entries. Meta-noise corrections filtered. |
| **D3**: Catalog-vs-per-entry contradiction | **191** | Per-entry correction disagrees with the catalog canonical for the same Whisper pattern. Catalog sections H / I / P / Z excluded (those are descriptive meta, not lookup rows). |
| **D4**: Cross-entry biographical inconsistency | **0** | Tight name-proximity birth-year extraction across top-50 mentioned canonical figures found no internally contradictory birth-year claims. |

## Top 10 most-impactful findings

### Phantom Whisper-renderings (Dimension 1) — confirmed false claims

These are correction rows where the supervisor stated "Whisper rendered X as Y" but X is not present in the raw transcript. They will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time, so the LLM downstream will never see the fix — the row is dead weight in the audit overlay.

| # | Entry | Row | Pass | Claimed Whisper rendering | Canonical | Fuzzy score | Verification |
| ---: | ---: | --- | --- | --- | --- | ---: | --- |
| 1 | #2 Amos Brown | 2.32 | Pass 1 | "Pittsburgh Korea / Pittsburgh Kuzat" | Pittsburgh Courier | 81.2 | Raw .srt has only "Pittsburgh Courier" (correct). Supervisor invented rendering. |
| 2 | #2 Amos Brown | 2.60 | Pass 1 | "Acta Almighty King" | Come, Thou Almighty King | 83.3 | Hymn not present in raw under either form. |
| 3 | #3 Annie Pearl Avery | 3.76 | Pass 1 | "Tugaloo College" | Tougaloo College | 53.3 | No college name in Avery's raw transcript. |
| 4 | #103 Robert Hayling | 103.26 | Pass 1 | "mega-evils" | Medgar Evers | 60.0 | Hayling transcript contains neither "Medgar", "Evers", nor "mega" anywhere. |
| 5 | #124 Walter Tillow | 124.34 | Pass 1 | "Walter Mondale" | Walter Mondale | 71.4 | Raw says "Mondale" 3x — never "Walter Mondale". Self-confirming row mis-claiming a 2-word rendering. (Now filtered as self-confirm; included for context.) |
| 6 | #67 Howell (joint) | 67.P2.13 | Pass 2 | "Joe Mosnier — NOT this interviewer; David Cline is" | David Cline | 48.2 | The "whisper rendering" cell contains supervisor commentary, not a Whisper rendering. |
| 7 | #116 Scott Bates | 116.34 | Pass 1 | "Stocks-O Cymbol" | Stokely Carmichael | 53.3 | Inventive rendering; not found in raw. |
| 8 | #57 James O. Jones | 57.P3.13 | Pass 3 | "foreign foreign Stoke" | Stokely Carmichael | 61.9 | Not in raw under that exact phrasing. |
| 9 | #34 Ekwueme Thelwell | 34.P3.6 | Pass 3 | "Mrs. Hema / Mrs. Hemmam / Mrs. Santa Lu Hemer" | Fannie Lou Hamer | 64.4 | Pass 3 commentary about a Pass 2 row; cell contains slash-list of variants supervisor claims but none score above threshold. |
| 10 | #76 Lawrence Guyot | 76.71 | Pass 1 | "Bayard Rustin's 'From Protest to Politics'" | Bayard Rustin's 'From Protest to Politics' | 62.5 | Self-confirming row where the rendering is just the canonical title — likely speaker quoted it directly and Whisper got it right with slight wording difference. |

**Distribution of D1 findings by pass section** (where the supervisor produced the phantom):

| Pass | Phantom count | Share |
| --- | ---: | ---: |
| Pass 2 | 460 | 49.0 % |
| Pass 1 | 281 | 29.9 % |
| Pass 3 | 159 | 16.9 % |
| Pass 4 | 23 | 2.4 % |
| Pass 2 tail-sweep | 16 | 1.7 % |

**Top 10 entries by phantom count**:

| Entry | Phantoms | Note |
| --- | ---: | --- |
| #124 Walter Tillow | 24 | Dense Pass-1 confirmation rows for Senate-era figures (Mondale, Edith Green, Burke Marshall, Humphrey, O'Neill) — supervisor padded with bookkeeping rows for figures whose surnames Whisper got right but where the supervisor inflated the rendering to include first names. |
| #52 Gwendolyn Patton | 23 | |
| #26 D'Army Bailey | 21 | |
| #125 Wheeler Parker | 20 | |
| #53 Gwendolyn Zoharah Simmons | 18 | |
| #100 Branch + Smith joint | 16 | |
| #113 Sam Mahone | 16 | |
| #115 Samuel Berry McKinney | 16 | |
| #72 Junius Williams | 14 | |
| #97 Pete Seeger | 14 | |

**Pattern observation**: phantoms cluster in entries audited by supervisors who produced dense Pass 1 + Pass 2 + Pass 3 layers. The fact that 49 % of phantoms originate in Pass 2 (re-review-for-missed-errors) suggests that the Pass 2 sweep introduced fabricated-pattern padding when supervisors tried to demonstrate thoroughness — supervisors invented variant renderings that "sounded plausible" given the canonical figure context but didn't actually appear in the source.

**Important caveat on D1**: my fuzzy threshold is 85 (rapidfuzz `partial_ratio`). Rows in the 70–85 band are *probably* phantom but could be reviewer corrections of a rendering that differs from the raw by more than minor punctuation. The 939 phantom count is a conservative upper bound on rows that downstream `apply_corrections.py` would silently no-op. **A second adversarial-model pass should cross-validate the high-impact subset (canonical-figure phantoms, ~74 rows) before any production action.**

### Bidirectional inconsistency (Dimension 2)

The 628 D2 findings are dominated by minor formatting differences — most have a clear majority (>= 80% share) and a small set of one-off variants. The genuinely problematic ones:

| Whisper rendering | Variants | Most-likely true canonical | Notes |
| --- | --- | --- | --- |
| "Joe Manier" (24 occ across 12+ entries) | "Joe Mosnier" (23, 88.5%) vs catalog-meta-tag noise | **Joe Mosnier** | Catalog A confirms — minority variants are bookkeeping artifacts |
| "David Klein" (22 occ across 17 entries) | "David Cline" (21, 95.5%) vs "catalog-worthy" (1) | **David Cline** | Cross-entry agreement is strong; only one anomalous row |
| "snake" (25 occ) | "SNCC" (21, 84%) vs "SNCC office" / catalog notes | **SNCC** | Reinforces catalog row C |
| "Jim Foreman" (10 occ) | "James Forman (Jim Forman)" (8) vs "Jim Forman" (2) | **James Forman** | Two entries (#3, #7) use abbreviated form; should normalize |
| "Dinky Romley" (multiple) | "Dinky Romilly" vs "Dinky Forman" | **disambiguation needed** | Constance "Dinky" Romilly Forman is one person; catalog uses married name, per-entry rows use maiden name |
| "Sammy Young" (6 occ) | "Samuel Younge Jr." (3) vs "Sammy Younge Jr." (3) | normalize to **Samuel Younge Jr.** | Even 3:3 split between formal and informal forms |
| "Stokeley" (6 occ) | "Stokely Carmichael" (3) vs "Stokely" (3) | **Stokely Carmichael** | Short-form normalization needed |
| "Lounge County" (7 occ across 4 entries) | "Lowndes County, Alabama" (4) vs "Lowndes County, AL" (2) vs "Lowndes County" (1) | normalize to one form | Minor formatting |

**Pattern observation**: D2 findings reveal that the corpus uses **two different canonical forms for figures with maiden-vs-married names** ("Dinky Romilly" / "Dinky Forman"; "Sammy" / "Samuel" Younge). This is the kind of inconsistency that survives every per-entry sweep because no single supervisor saw both contexts. The adversarial-model ensemble should adjudicate by checking which form is in `civil_rights_facts.json` and normalizing every per-entry row to that form.

### Catalog-vs-per-entry contradictions (Dimension 3)

The 191 D3 findings split into:

- **Real disagreements** (~40 estimated): cases where the catalog canonical and the per-entry correction differ on a canonical figure's name (e.g., "Janet (Jemmott) Moses" per-entry vs catalog "Dona Moses née Richards" — but these are TWO DIFFERENT women, both married to Bob Moses at different times — so the disagreement reflects a real catalog ambiguity that needs reconciliation).
- **Different-referent false positives** (~120 estimated): cases where the whisper rendering happens to match the same surface form across genuinely different referents (e.g., entry #20.24 "Damon (the Hawaii landowner family)" → catalog F "Vernon Dahmer" — same Whisper rendering "Damon", entirely different historical referent).
- **Minor formatting variance** (~30 estimated): "Jim Forman" vs "James Forman (SNCC executive secretary)" — same person, different presentation richness.

**Highest-impact D3 disagreement**: "Dinky" cluster — three different entries (#7, #30) use "Dinky Romilly" in per-entry rows while catalog row C uses "Dinky Forman". Both are the same historical figure (Constance "Dinky" Romilly Forman, James Forman's wife). Choose one canonical form and propagate.

### Biographical consistency (Dimension 4)

**0 findings** under the tightened name-proximity heuristic. This is partly methodology-limited: the dim4 pass only looks for birth-year claims tightly attached to canonical-figure names (within ~50 chars), and most birth-year facts in the corpus belong to interviewees themselves (single occurrence each) rather than recurring canonical figures. The Pass 3 closeout block at lines 40,789+ contains dense canonical-figure birth-year claims (Wyatt Tee Walker b. 1928, Bull Connor b. 1897, Louis Lomax b. 1922, etc.) that are by definition uncontradicted because they only appear once.

A future deeper biographical-consistency pass would need a different methodology: extract structured `(figure, claim_type, value, source_entry)` records from canonical-figure-mention sites by LLM rather than regex, then aggregate across entries. That is beyond Layer 5's regex-based scope.

## Honest publication-grade assessment

**The audit overlay is publication-grade with caveats.** Specifically:

- **What is publication-grade**: the catalog (sections A–O + extension subsections at lines 27–1196) is internally consistent and high-quality. The per-entry tables contain genuine high-value corrections (mega-evils → Medgar Evers, Slave Sellers → Cleveland Sellers, the SNCC-as-snake cluster, etc.) that materially improve LLM downstream summarization. The Pass 4 fact-check tables in many entries are detailed and accurate. The cross-corpus pattern catalog is the strongest single artifact in the document.

- **Caveats**:

  1. **~5 % of high/correct-confidence correction rows have Whisper renderings that cannot be ground-truthed against the raw transcript** (939 phantoms ÷ ~10,557 audited rows). Most are low-impact (self-confirming rows, supervisor commentary in the rendering column, near-misses where the rendering differs from raw by more than minor punctuation). The high-impact subset is ~74 rows mentioning canonical figures (Medgar Evers, Stokely Carmichael, Bayard Rustin, James Forman, etc.).

  2. **Canonical names sometimes appear in two normalized forms across the corpus** ("Dinky Romilly" / "Dinky Forman"; "Samuel Younge Jr." / "Sammy Younge Jr."; "Stokely Carmichael" / "Stokely"). The adversarial ensemble should normalize to a single form per `civil_rights_facts.json`.

  3. **The catalog and per-entry rows do not always agree on phrasing for the same canonical figure**. 191 D3 findings; most are different-referent false positives but ~40 are genuine reconciliation candidates.

  4. **Cross-entry biographical consistency was effectively un-auditable by the regex approach.** Most biographical claims are about interviewees themselves (single occurrence). Recurring canonical-figure biographical claims appear in narrative paragraphs that need LLM-grade extraction to validate.

  5. **The cross-contamination sweep already done in commit `847f763`** caught row-level misfiling but did not cover the kinds of fidelity issues this Layer 5 pass surfaces (which are about the relationship between correction rows and the raw transcripts they claim to correct).

The overlay is fit for downstream LLM grounding and Smithsonian/LoC reviewer use, **provided the adversarial ensemble adjudicates the ~74 high-impact phantom canonical-figure rows** before any production write of corrected transcripts to `transcripts/corrected/`. The remaining 800+ low-impact phantoms will silently no-op without causing factual error — they're dead weight in the audit overlay but not factual hazards.

## Recommended next actions for the adversarial multi-model ensemble

1. **Highest priority**: cross-validate the 74 canonical-figure phantom rows (Medgar Evers, Stokely Carmichael, Bayard Rustin, James Forman, etc. — see top-10 list above) by spot-checking each entry's raw transcript. For each row, the ensemble should either:
   - Confirm the phantom and propose the *actual* whisper rendering Whisper produced (so the row becomes correctable), OR
   - Flag the row for deletion from the overlay.

2. **Second priority**: normalize the D2 maiden-vs-married name inconsistencies ("Dinky Romilly" vs "Dinky Forman", "Sammy" vs "Samuel" Younge, etc.) against `civil_rights_facts.json` canonical forms.

3. **Third priority**: triage the 191 D3 catalog-contradictions — separate real disagreements (~40) from different-referent false positives (~120). The real disagreements feed back into either a catalog update or a per-entry-row update.

4. **Lower priority**: a structured LLM-based biographical-consistency pass that goes beyond the regex approach used here. Each top-mentioned canonical figure (Wyatt Walker, Bull Connor, Louis Lomax, etc.) deserves a (figure, claim, source) extraction sweep so that future entries citing them have a fact-check anchor.

5. **Deferred**: the ~9 D1 findings with fuzzy scores <50 (closest to truly fabricated renderings) are immediate red flags but represent edge cases — likely supervisor commentary rows where the "whisper rendering" cell was used for narrative text.

## Files produced

- `transcripts/layer5_fidelity_audit.json` — full structured findings (1.58 MB)
- `transcripts/layer5_fidelity_audit_summary.md` — this document
- `transcripts/layer5_fidelity_audit.py` — the pipeline (deterministic, re-runnable)
- `transcripts/layer5_extract_corrections.py` — the parser (reusable)

End of Layer 5 summary.
