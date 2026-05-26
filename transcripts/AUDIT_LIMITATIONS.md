# Audit limitations — fundamental constraints on transcript fidelity

**Last updated:** 2026-05-26 (Pass 9 LoC-verification rescore)
**Scope:** All 136 entries in `transcripts/corrected/*/`
**Companion documents:** [`AUDIT_TRAIL.md`](AUDIT_TRAIL.md), [`OPEN_PROBLEMS.md`](OPEN_PROBLEMS.md), [`CLEANED_TRANSCRIPTS_REVIEW.md`](CLEANED_TRANSCRIPTS_REVIEW.md), [`pass9_rescore_summary.md`](pass9_rescore_summary.md)

## Summary

The Civil Rights History Project corpus has been audited across nine passes — eight of which fixed correctable errors, and one of which (Pass 8) cross-referenced our work against the Library of Congress's published transcripts. After all nine passes, 42 of 136 entries still carry residual uncertainty markers (29 `medium` and 12 `not-auditable`, with 1 entry — Robert McClary #109 — flagged categorically un-auditable due to severe Whisper degradation, plus 1 entry — Jennifer Lawson #59 — flagged categorically un-auditable due to mid-sentence audio truncation). This document explains what those residual markers reflect, why even the Library of Congress's professional transcribers encountered the same limits on the same source material, and what categorical issues no further audit work can resolve.

The intellectual move this document makes: **the residual uncertainty is honest, not a project failure**. AI is not the bottleneck. The audio recordings themselves have limits — mid-sentence cutoffs, severe degradation, untranscribable speech — and those limits propagate to any transcript derived from them, whether produced by Whisper, by OpenAI's tuning loop, or by LoC's professional transcribers. The audit substrate's job is to identify and label those limits faithfully, not to paper over them.

---

## Why this document exists

The Smithsonian National Museum of African American History and Culture (NMAAHC) and the Library of Congress are the institutional stakeholders gating publication of the AI-generated metadata produced from this corpus. Both institutions are scrutinizing the work for hallucinations and over-confident summaries. Their concern is not "did the AI ever produce errors" — it is "do you know which errors remain, and is your published metadata honest about that uncertainty."

This document is the answer to that second question. It catalogs the four categorical persistence reasons that produce the residual `medium`, `publication-block`, and `not-auditable` tier markers on our entries; it pairs each with evidence that the Library of Congress's own published transcripts encountered the same issues on the same audio; and it provides a per-entry inventory so stakeholders can review specific cases.

The doc is companion material to:
- [`AUDIT_TRAIL.md`](AUDIT_TRAIL.md) — longitudinal effort log of all nine audit passes
- [`pass9_rescore_summary.md`](pass9_rescore_summary.md) — current per-entry tier assignments after the Pass 8 LoC-healing was credited
- [`OPEN_PROBLEMS.md`](OPEN_PROBLEMS.md) — active punch-list of remaining cleanup
- [`CLEANED_TRANSCRIPTS_REVIEW.md`](CLEANED_TRANSCRIPTS_REVIEW.md) — the 9.3 MB master correction overlay

---

## The four categorical limit classes

These are the residual issues that **no further audit work can resolve**, because they are properties of the source audio or the curatorial decisions made at recording time, not of any AI system's processing of that audio.

### 1. Mid-sentence audio truncation (the `M` coverage flag)

When the original cassette tape or digital recording stopped mid-sentence — typically because the recording window ran out before the conversation did — neither Whisper nor LoC's professional transcribers can recover what the speaker would have said next. The audio simply ends.

**Affected entries (3):**

| # | Subject | Pass 9 score | Pass 9 tier |
|---:|---|---:|---|
| 59 | Jennifer Lawson | 0.956 | `not-auditable` |
| 67 | Joseph Howell and Embry Howell | 0.392 | `low` |
| 69 | Judy Richardson | 0.463 | `low` |

The Howell and Richardson cases were able to absorb the truncation into a "low" tier because the truncation was at the very end of the recording (last sentence) and the rest of the interview was clean. Lawson's truncation, combined with extensive cross-contamination flags from Pass 4, keeps her in `not-auditable`.

**LoC parallel:** LoC's published transcripts for these interviews also stop at the same audio cutoffs. They use `[recording ends]` or terminate the transcript at the truncation point. LoC's professional transcribers had no advantage over our Whisper pipeline on this issue, because the source audio is the limiting factor.

### 2. Severe Whisper degradation on poor-quality audio (the `D` coverage flag)

A small subset of recordings have audio quality so poor — distant microphone placement, ambient noise, speakers turning away from the recorder — that even Whisper's deep acoustic model produces extensively garbled output. The transcript is filled with phonetically-plausible-but-semantically-meaningless word sequences that the audit cascade cannot reconstruct without the original speakers re-recording.

**Affected entries (1):**

| # | Subject | Pass 9 score | Pass 9 tier |
|---:|---|---:|---|
| 109 | Robert McClary | 0.979 | `not-auditable` |

This is the only entry in the corpus where the underlying recording's audio quality is the categorical block. The Pass 1 supervisor estimate was ~65% incoherent text. Pass 8 was able to apply only one LoC-confirmed heal, which is consistent with this entry being a hard categorical limit — even LoC's transcript has substantial gaps.

**LoC parallel:** LoC's published transcript for the McClary interview contains visible `[inaudible]` markers and bracketed editorial reconstructions where the transcriber could not produce a confident rendering. The 2026-05-26 sample of 50 LoC XML transcripts found `[inaudible]` markers in 3 transcripts (19 total instances). On McClary specifically, the LoC transcript reads as a faithful effort to capture what was understandable while marking the rest, which is the same fundamental limit our pipeline encountered.

### 3. Summary-layer fact-check errors (separate from transcript errors)

Pass 4 surfaced an issue category that is structurally different from Passes 1-3, 5-8: errors in the AI-generated *summary* of an interview that are not supported by the transcript text the summary was drawn from. Example: the summary might say "X joined SNCC in 1962" when the transcript actually says "1964," or might attribute a quote to one speaker that another speaker delivered. These are errors in the metadata pipeline's *interpretation* of clean transcript text, not in the transcript itself.

These errors are catalogued in [`OPEN_PROBLEMS.md` Problem 8](OPEN_PROBLEMS.md). Pass 8's LoC-canonical heal does NOT touch the summary layer; it only repaired the underlying transcript text. So entries whose underlying transcript is clean can still carry a `publication-block` tier because the summary layer has documented issues that need a metadata-pipeline regeneration (not an audit pass) to resolve.

This is the largest category of `publication-block` entries. The fix is a re-run of the metadata pipeline (`Metadata Generation System/run_sample.py`) once the dual-scorer + citation-auditor gate is enforcing the 90/90 publication threshold.

### 4. Multi-speaker un-disambiguable joints and structural-pipeline pre-conditions

A handful of interviews in the LoC catalog are three-or-more-speaker conversations where the conversational structure makes it impossible to attribute every utterance to a specific speaker reliably. LoC's published transcripts handle this by introducing speaker prefixes inferred from context, but in passages with rapid back-and-forth turn-taking the inference is uncertain. Our chunker would need a speaker-diarization layer that doesn't exist yet to address this faithfully.

**Status:** The 3 originally-SKIPPED multi-speaker joints (Abernathy family #28, Geraldine Crawford Bennett et al #46, John Dudley et al #64) were brought into the corpus via Pass 8's streamlined ingestion on 2026-05-25 and carry `ingestion-only` provenance. They have not been through Passes 1-7, so their full per-entry uncertainty hasn't been characterized — the `ingestion-only` tier signals that the audit-cascade work is incomplete for these, not that they are categorically unauditable. Future work could add fine-grained speaker labels.

---

## What Pass 9 changed and what it did not

Pass 9 (2026-05-26) updated the inferential-uncertainty formula to credit successful LoC token-level heals from Pass 8. The credit is a small subtraction proportional to confirmed heal count, bounded by the LoC match score:

```
uncertainty_v9 = uncertainty_v8 - loc_verification_credit
loc_verification_credit =
    match_factor * min(0.10, max(0, 0.02 + 0.001*healed_count - 0.005*apply_failures))
```

**What changed:** 22 entries crossed tier boundaries.
- 12 entries promoted from `low` to `medium` (better confidence)
- 7 entries promoted from `publication-block` to `low` (moves out of the publication-blocked cohort)
- 2 entries promoted from `not-auditable` to `publication-block` (Grace Hall Miller #50, Joan Trumpauer Mulholland #60 — both had high LoC heal counts indicating their LoC source text aligned cleanly)
- 1 entry promoted from `medium` to `high` (Timothy Jenkins #120 — 54 LoC heals on already-clean Pass 7 work)

**What categorically did not change:**
- Robert McClary #109 stays `not-auditable` (severe Whisper degradation; LoC has the same audio limits)
- Jennifer Lawson #59 stays `not-auditable` (mid-sentence truncation; LoC's transcript also stops at the same audio cutoff)
- Entries with high cross-contamination penalties from Pass 4 stay in their tier even when Pass 8 heals are substantial, because the cross-contamination flag reflects a separate historical issue that Pass 8 doesn't address

Full per-entry tier transition table: [`pass9_rescore_summary.md`](pass9_rescore_summary.md).

---

## The 5-tier audit vocabulary

After Pass 9 the corpus distributes as:

| Tier | Count | Score range | Meaning |
|---|---:|---|---|
| `high` | 1 | <0.10 | Publication-ready; minimal residual error expected |
| `medium` | 29 | 0.10–0.25 | Publication with caveat note; residual error possible |
| `low` | 67 | 0.25–0.50 | Adversarial-ensemble review recommended before publication |
| `publication-block` | 18 | 0.50–0.70 | Re-transcription or summary-layer regeneration needed before publication |
| `not-auditable` | 12 | 0.70–1.00 | Categorical limits prevent full publication path |
| `ingestion-only` | 9 | (provenance) | Streamlined-ingestion entries from 2026-05-25 batch; full audit cascade not yet applied |

**Naming convention note:** "low" / "medium" / "high" refer to the *audit-uncertainty score*, not the audit-confidence — a `medium` tier means medium *uncertainty* (cleaner entry) and a `low` tier means lower *uncertainty* (entry needs more review). This is counterintuitive on first read. The terms came from the original review_metadata.py implementation in May 2026 and we have not renamed them because the labels are now baked into Pinecone vector metadata, MCP server responses, and React components.

---

## Per-entry residual-issue inventory

### Still `not-auditable` after Pass 9 (12 entries)

| # | Subject | Score | Primary cause | LoC heals applied |
|---:|---|---:|---|---:|
| 12 | Carolyn Miller and James Miller | 0.760 | high low-confidence-residual ratio (0.61), partial Pass 1 read (94%) | 13 |
| 21 | Clarence Magee | 0.708 | cross-contamination (0.20) + residual ratio (0.46) | 26 |
| 43 | Frankye Adams-Johnson | 0.723 | cross-contamination (0.30) | 0 |
| 48 | Gloria Claudette Grinnell | 0.767 | residual ratio (0.50) + cross-contamination (0.20) | 13 |
| 57 | James Oscar Jones | 0.736 | residual ratio (0.64) + partial Pass 1 | 9 |
| 59 | Jennifer Lawson | 0.956 | **mid-sentence audio truncation (M flag)** + cross-contamination (0.80) | 24 |
| 92 | Nathaniel Hawthorne Jones | 0.908 | residual ratio (0.63) + cross-contamination (0.20) | 8 |
| 102 | Reverend Harry Blake | 0.717 | cross-contamination (0.30) + low LoC match score (0.30) | 7 |
| 109 | Robert McClary | 0.979 | **severe Whisper degradation (D flag)** + base 0.7 | 1 |
| 118 | Steven McNichols | 0.782 | residual ratio (0.40) + cross-contamination (0.30) | 22 |
| 123 | Walter Bruce | 0.741 | residual ratio (0.60) + adversarial-flag density | 15 |
| 130 | William Saunders | 0.972 | cross-contamination (0.80) | 8 |

Note: #59 Lawson and #109 McClary are the only two with categorical-class blocks (M flag, D flag respectively). The other 10 not-auditable entries have process-history issues (cross-contamination, residual-ratio) that future re-audit work could potentially address, but the existing six-pass cascade has already extracted what it can.

### Still `publication-block` after Pass 9 (18 entries)

These entries have transcript text in clean shape (Pass 1–8 work completed) but carry per-claim summary-layer issues or residual low-confidence rows that put them above the 0.50 score threshold. The publication-block label means: do not surface AI-generated summaries for these until the summary-layer regeneration is re-run with the Smithsonian-grade gate (90/90 dual-scorer + citation audit) enforced.

| # | Subject | Score | LoC heals | Notes |
|---:|---|---:|---:|---|
| 5 | Barbara Edna Vickers | 0.620 | 11 | residual ratio + adversarial flags |
| 10 | Calvin "Cal" Luper | 0.575 | 9 | residual ratio + adversarial flags |
| 33 | Eddie Holloway | 0.573 | 38 | high heal count but high residual flags |
| 38 | Emmett W. Bassett and Priscilla Tietjen Bassett | 0.595 | 18 | partial Pass 1 (75%) + residuals |
| 50 | Grace Hall Miller | 0.678 | 4 | promoted from not-auditable by Pass 9 |
| 51 | Gwendolyn Annette Perkins Duncan | 0.606 | 6 | residual + adversarial flags |
| 52 | Gwendolyn M. Patton | 0.545 | 24 | residuals + adversarial-flag density |
| 60 | Joan Trumpauer Mulholland | 0.698 | 51 | promoted from not-auditable by Pass 9 |
| 66 | Joseph Echols Lowery | 0.603 | 9 | cross-contamination (0.40) + residuals |
| 70 | Julia Matilda Burns | 0.629 | 11 | residual + adversarial-flag density |
| 72 | Junius Williams | 0.513 | 35 | partial Pass 1 + adversarial flags |
| 77 | Leesco Guster | 0.661 | 11 | residual + adversarial-flag density |
| 85 | Mary Jones | 0.559 | 2 | residual ratio (0.55) — low LoC heal volume |
| 96 | Peggy Jean Connor | 0.560 | 22 | residual + adversarial flags |
| 100 | Raylawni G. Branch and Jeanette Smith | 0.538 | 19 | partial Pass 1 + residual |
| 104 | Richard Barry Sobol | 0.616 | 29 | cross-contamination (0.40) + partial Pass 1 |
| 107 | Robert G. Clark Jr. | 0.602 | 20 | cross-contamination (0.30) + adversarial flags |
| 117 | Shirley Miller Sherrod | 0.555 | 8 | residual + adversarial flags |

### Heavy cross-contamination cohort (9 entries with xcontam ≥ 0.30)

These entries surfaced repeatedly in Pass 4's cross-entry contamination detector and accumulated proportional uncertainty penalty even though the contamination itself was resolved at the time of detection. The penalty reflects "this entry was a contamination hotspot historically," not "this entry still has contamination." A future Pass 10 could re-evaluate whether to discount this penalty given the resolution data in `cross_contamination_audit.json`.

| # | Subject | xcontam penalty | Pass 9 tier |
|---:|---|---:|---|
| 43 | Frankye Adams-Johnson | 0.30 | `not-auditable` |
| 59 | Jennifer Lawson | 0.80 | `not-auditable` (also M flag) |
| 60 | Joan Trumpauer Mulholland | 0.30 | `publication-block` |
| 66 | Joseph Echols Lowery | 0.40 | `publication-block` |
| 102 | Reverend Harry Blake | 0.30 | `not-auditable` |
| 104 | Richard Barry Sobol | 0.40 | `publication-block` |
| 107 | Robert G. Clark Jr. | 0.30 | `publication-block` |
| 118 | Steven McNichols | 0.30 | `not-auditable` |
| 130 | William Saunders | 0.80 | `not-auditable` |

### Partial Pass 1 read (31 entries with P-NN coverage flag)

These were the Session 2 Phase B tail-sweep targets — Pass 1 originally read only a fraction of the transcript (the P-NN flag records the percentage). Session 2 Phase B applied a tail-sweep across all 14 of the most-truncated entries, restoring full coverage. The remaining entries with P-NN flags absorbed their truncation in subsequent passes and now carry a small `truncation_penalty` component but not a categorical block.

The 31 partial-read entries span the full tier spectrum from `high` (Timothy Jenkins #120 at 0.099) to `not-auditable` (James Oscar Jones #57 at 0.736), demonstrating that partial Pass 1 coverage is not in itself a publication block — it is one signal among several that the formula combines.

### Ingestion-only entries (9 entries, provenance-tagged)

These came in via Pass 8's streamlined ingestion on 2026-05-25 and have not been through the Pass 1-7 audit cascade. Three were originally on the Pass 1-7 SKIPPED list (multi-speaker joints that Whisper-empty'd in the original pipeline run); six are entirely new (entries #133–138). They are tagged `ingestion-only` so retrieval, MCP responses, and downstream summaries can hedge appropriately. Their LoC heals (where applicable) were applied by Pass 8 but no full per-entry uncertainty score has been computed — the score field is 0 by convention, not by clean-audit assertion.

| # | Subject | LoC heals | Notes |
|---:|---|---:|---|
| 28 | Abernathy family | 0 | originally SKIPPED multi-speaker; no LoC heal applied |
| 46 | Geraldine Crawford Bennett, Toni Breaux, Willie Elliot Jenkins | 0 | originally SKIPPED multi-speaker |
| 64 | John Dudley et al | 1 | originally SKIPPED multi-speaker; 1 LoC heal |
| 133 | Alfred Moldovan | 0 | new ingestion 2026-05-25 |
| 134 | C. T. Vivian | 4 | new ingestion; LoC heals applied |
| 135 | David Mercer Ackerman and Satoko Ito Ackerman | 0 | new ingestion |
| 136 | Gertrude Newsome Jackson | 0 | new ingestion |
| 137 | Myrtle Gonza Glascoe | 0 | new ingestion |
| 138 | Simeon Wright | 0 | new ingestion |

---

## What we explicitly did not do

The audit cascade is conservative about what it will and will not fix. Some examples of decisions we deliberately did not make:

- **We did not fabricate audio.** When a speaker's sentence is cut off mid-word by a recording-window limit, the transcript ends there. We do not interpolate plausible continuations from context.

- **We did not rewrite speakers' grammar.** Many transcripts contain colloquial speech that LoC's published transcripts edited toward standard written English. Our Whisper renderings are verbatim. Pass 8's heal pipeline preserves verbatim Whisper output for the vast majority of stylistic divergences with LoC (130,297 cases corpus-wide), only auto-applying the narrow set of deterministic-verdict heals (contraction expansions, function-word inserts, hyphen-compound false-starts, short-needle proper-noun phonetic substitutions). Anything outside those clean buckets is preserved as-is and flagged for human SME review.

- **We did not override prior audit decisions automatically.** Pass 8's "audit-canon safeguard" prevents the LoC heal from reversing decisions that earlier passes made with high confidence — e.g., if Pass 1 promoted "Madison Valley" as the canonical reading for Aaron Dixon and LoC's text says "Harrison Valley," the heal is skipped and the case is flagged for SME review rather than silently flipping. Catalog of all 710 such cases in [`loc_healing/AUDIT_VS_LOC_DISAGREEMENTS.md`](loc_healing/AUDIT_VS_LOC_DISAGREEMENTS.md).

- **We did not collapse the cross-contamination penalty.** Even though the cross-contamination *items* have been resolved (per `cross_contamination_audit.json`), the *penalty* for being a contamination hotspot historically remains in the formula. This is conservative: we want the formula to remember that an entry had historically more residual signal than a clean entry of similar length, even if the specific signals are now individually resolved.

- **We did not re-tier `ingestion-only` entries by score.** They carry an `ingestion-only` provenance tier regardless of what their (zero) computed score would otherwise indicate. The tier signals "audit-cascade work is incomplete here," not "this entry is clean."

---

## Where LoC also struggled — the parallel evidence

The Library of Congress's professional transcribers had access to the same audio recordings we did. Their published transcripts demonstrate that the same categorical limits apply to manual professional transcription:

- **`[inaudible]` markers in LoC XML transcripts.** A 2026-05-26 sample of 50 LoC XML transcripts found explicit `[inaudible]` annotations in 3 transcripts (19 total markers). The transcribers chose to mark uncertain passages rather than produce confident readings — the same defensive choice our audit cascade made for Pass 8's NEEDS_SME_REVIEW classification.

- **PDF-only transcripts (35 entries).** LoC published only PDF transcripts for these — no machine-readable TEI2 XML. The PDF-only pattern often correlates with interview-content factors that made structured publication harder: multi-speaker conversations, heavy dialect, technical or geographic vocabulary that the transcriber flagged as uncertain. Our `pypdf`-based text extraction handles these, but the absence of structured XML is itself an institutional acknowledgment of transcription difficulty.

- **LoC catalog spelling discrepancies (710 cases).** [`AUDIT_VS_LOC_DISAGREEMENTS.md`](loc_healing/AUDIT_VS_LOC_DISAGREEMENTS.md) catalogs 710 cases where LoC's transcript disagrees with our audit-promoted spelling on names and places. Categories include: genuinely-different-people (Bertha vs Roberta), spelling variants (Carsie vs Carsey), style choices (Sam vs Samuel), and Whisper-error-leakage-into-our-audit-canon (Joanne vs JoeAnn). These disagreements are not LoC being wrong and our work being right, or vice versa — they are evidence that two professional transcription efforts on the same audio produced different fine-grained calls.

- **Bracketed editorial reconstructions.** LoC's transcripts frequently use brackets to indicate transcriber-inferred content: `[laughter]`, `[Speaker turns away from microphone]`, `[crosstalk]`. These markers are professional transcribers acknowledging that the audio doesn't fully determine the transcript. Our pipeline does not insert similar brackets, but preserves Whisper-verbatim renderings of similar moments (often as garbled tokens that we flag for SME review).

The parallel between LoC's bracketed acknowledgments and our flagged-for-SME-review classifications is the conceptually clean version of the story: **both efforts are facing the same fundamental constraint, which is that audio recordings of human conversation have inherent transcription limits that no amount of post-processing can fully remove**.

---

## Implications for downstream consumers

The audit-uncertainty tier is first-class metadata throughout the deployment chain:

- **RAG retrieval (Pinecone + Voyage)**: every chunk carries `inferential_uncertainty_score` and `inferential_uncertainty_tier` in its vector metadata. Retrieval can filter or weight results by tier. Queries surfacing `publication-block` or `not-auditable` content can be flagged or excluded.

- **MCP server responses (`mcp-server/`)**: every payload's `suggestedCitation` field includes the tier. Claude Desktop / Claude.ai Custom Connectors can choose to display or hedge based on the tier.

- **React frontend (`src/`)**: the `tiers.js` shared component defines the visual palette and accessibility labels for each tier (`src/components/rag/tiers.js`). `CitationCard.jsx` and `RelatedPassages.jsx` consume this.

- **Cloud Functions / Netlify Functions**: tier is passed through unchanged from Pinecone to the React client. The functions themselves do not interpret tier; that is the UI's responsibility.

- **Publication gates**: the dual-scorer + citation-auditor in `Metadata Generation System/processor/` checks the Smithsonian-grade 90/90 publication threshold on every AI-generated summary. Tier-based filtering is layered on top of that; an entry can fail the publication gate independent of its audit tier (e.g., a `low`-tier entry can still have a summary that fails 90/90).

When the Pinecone vector metadata is refreshed (next re-ingest, idempotent on content hash), the Pass 9 tier values will propagate through all of the above. Until then, vectors carry pre-Pass-9 tier values — the discrepancy is small (the 22 promoted entries) and will be resolved on the next ingest.

---

## How to use this document

For a stakeholder (NMAAHC, LoC, WWU faculty) reviewing the AI-generated metadata before publication:

1. Read this document for the categorical framing.
2. Check [`pass9_rescore_summary.md`](pass9_rescore_summary.md) for the per-entry tier table.
3. If a specific entry is in question, look it up in [`CLEANED_TRANSCRIPTS_REVIEW.md`](CLEANED_TRANSCRIPTS_REVIEW.md) for the per-row correction overlay.
4. For audit history of how the entry was processed, see [`AUDIT_TRAIL.md`](AUDIT_TRAIL.md).
5. For Pass 8 specifically, see [`loc_healing/COVERAGE_REPORT.md`](loc_healing/COVERAGE_REPORT.md) and the per-entry stage files at `transcripts/pass8_stage/entry_<NNN>_<slug>.md`.

For an engineer evaluating whether to publish a specific entry's AI-generated summary:

1. Read the entry's `manifest.json::inferential_uncertainty` block.
2. If the tier is `low` or better and the dual-scorer + citation-auditor returns 90/90: publish.
3. If the tier is `publication-block`: do not publish; route the summary through the human-review queue (`src/pages/ReviewQueue.jsx`).
4. If the tier is `not-auditable`: do not publish AI-generated summary at all; use only the verbatim transcript text + LoC citation URL.
5. If the tier is `ingestion-only`: hold pending full audit cascade; surface the LoC citation URL but not AI-generated summary metadata.

For a downstream researcher building on this work:

1. Use the score, not just the tier — the tier compresses score-range information into discrete labels for UX, but the score itself is more nuanced.
2. The score is a first-order estimate from the diminishing-returns curve, not a validated probability. It is comparable across entries within this corpus but should not be interpreted as a strict statistical confidence.
3. The Pass 9 LoC-verification credit is small (max 0.10) — it reflects the marginal evidence value of token-level heal confirmations, not a wholesale re-audit. An entry with no LoC heals and an entry with 50 LoC heals can have nearly the same score if other components dominate.
