# Transcript Audit Design

A recurring quality-assurance pass on the 135 raw Whisper transcripts in `transcripts/raw/`. Catches Whisper transcription errors that the existing dual-scorer + citation-auditor gate can't see, because that gate scores generated summaries against transcripts, and if the transcript itself is wrong, the gate has nothing to compare against.

This document is the handoff design. The next agent reading this should be able to implement the system end-to-end without re-deriving any architectural decision.

## Why this exists

The current Smithsonian-grade publication gate (introduced 2026-05-20 through 2026-05-22 in commits 297f47d, ecde562, 5bcb591, f50bbdb) audits the generated summary against the transcript via two independent scorers (OpenAI + Claude Opus 4.7) and a per-claim citation auditor. The gate fails closed: disagreement between scorers routes to human review rather than auto-publishing.

The gate has a structural blind spot. **It assumes the transcript is reliable.** Whisper introduces phonetic errors silently:

- "Medgar Evers" → "Megahevers" (consonant-cluster collapse)
- "Stokely Carmichael" → "Stokey Carmickle" (silent-letter loss + edit)
- "the laundry" → "the Laundras" (proper-noun hallucination on a common noun)
- "Brooksville" → potentially right, potentially a town that doesn't exist (no current way to know)

When the summarizer reads "Megahevers" in the transcript, it has two failure modes:

1. **Echo the error**: the summary says "Megahevers" and the citation auditor marks it `supported` because the transcript says "Megahevers". The error propagates with the gate's seal of approval. Smithsonian-grade fails silently.
2. **Correct silently**: the summary says "Medgar Evers" (the LLM recognizes the corrupted form from training) and the citation auditor marks it `unsupported` because the transcript doesn't literally say "Medgar Evers". The summary is correct but blocked. A reviewer who doesn't dig in might trust the auditor and reject a good summary.

Both modes degrade the project's quality. The fix is an upstream audit that flags phonetic errors before summarization, treats the corrections as a non-destructive overlay, and feeds the corrected context into both the summarizer and the scorer.

A spot-check confirms the gap exists. Searching the Aaron Dixon transcript (`transcripts/raw/Aaron Dixon_interview_20250704_170306/`) for known leader surnames returns 6 matches for "Carmichael" and 31 for "Huey" (probably Huey Newton, no last-name confirmation in the regex) but exposes "the Laundras" (likely "laundry"), "Miljert" (a phantom proper noun where Whisper hallucinated structure into a vowel sequence), and "Joe Willie" (could be a real birth name or could be a corruption, context-dependent). The existing `shared.py::get_relevant_facts` regex-matcher catches the good cases and misses the broken ones.

## Architecture

A new processor module (`processor/transcript_audit.py`) + an output JSON overlay (`transcripts/audit/<interview_id>.json`) + a reviewer UI (`src/pages/TranscriptAuditReview.jsx`) + a Firestore corrections collection + downstream pipeline integration.

### Module: `processor/transcript_audit.py` (new)

For each candidate proper-noun-or-suspicious-token in a transcript, run a three-stage cascade. Earlier stages are free; the LLM stage is ~$0.001 per transcript.

#### Stage 1, Exact / alias match

Already implemented as `shared.py::get_relevant_facts`. Lift the logic into the audit module so the audit can claim ownership of grounding decisions independent of any specific summarization step.

For each `\bword\b`-anchored regex match against a canonical name or alias in `civil_rights_facts.json`, emit a `grounded_facts` entry: `{canonical_name, occurrences, match_source: "stage_1_exact"}`. No correction needed, the transcript already names the fact correctly.

Cost: free. ~5ms per transcript on a modern laptop.

#### Stage 2, Phonetic + edit-distance fuzzy match

For every transcript token (or n-gram up to length 4) that **misses** Stage 1 but looks like a proper noun (capitalized, not a common stopword, not a number), run two similarity checks in parallel:

- **Double Metaphone** (`jellyfish.metaphone(candidate)` compared to the precomputed metaphone keys of every canonical name + alias). Catches phonetic collisions that edit distance misses: "Megahevers" / "Medgar Evers" share the metaphone key `MTKR` once the silent-cluster collapse is normalized.
- **Jaro-Winkler** (`jellyfish.jaro_winkler_similarity(candidate, target)`). Higher prefix-weight than Levenshtein, well-suited to proper-noun matching where the first few characters typically survive transcription. Catches edit-distance errors that phonetic matching might miss ("Carmickle" → "Carmichael", both metaphone-key `KRMKL`, but the Jaro-Winkler is the clearer signal).

Combine the two scores: `combined = 0.5 * metaphone_match + 0.5 * jaro_winkler`. (Metaphone match is binary, 1.0 if keys match, 0.0 if not.)

Routing decision:
- `combined >= 0.85` → emit correction with `source: "stage_2_fuzzy"` and `confidence: combined`
- `combined in [0.65, 0.85]` → escalate to Stage 3 (LLM disambiguation)
- `combined < 0.65` → no match; the candidate is either unknown or a name not in the ground-truth corpus

Cost: free. ~50ms per transcript for the full token sweep against 60 canonical names + 138 aliases.

Library dependency: `jellyfish`, Apache 2.0, pure-Python, ~80KB. Add to `Metadata Generation System/requirements.txt`.

#### Stage 3, LLM disambiguation for the middle band

For each candidate scoring in [0.65, 0.85], assemble a tightly-bounded prompt and ship to Claude Haiku 4.5 (`claude-haiku-4-5-20251001`):

```
You are a transcript-correction auditor for Library of Congress / Smithsonian civil rights oral history interviews. A Whisper-transcribed candidate name appears in the transcript, and three phonetically-close canonical names from the ground-truth corpus might match it. Your job is to decide which (if any) is correct based on the surrounding context.

CANDIDATE FROM TRANSCRIPT: "{candidate}"

TOP 3 PHONETIC MATCHES:
1. {name1} ({score1:.2f})
2. {name2} ({score2:.2f})
3. {name3} ({score3:.2f})

SURROUNDING CONTEXT (±200 chars):
{transcript_excerpt}

Output JSON only:
{
  "match": "<exact canonical name from list, or 'none'>",
  "confidence": <0.0-1.0>,
  "rationale": "<one sentence explaining the decision>"
}
```

Why Claude Haiku 4.5:
- Lowest-cost model in the Anthropic family ($1 / $5 per MTok input/output as of 2026-05)
- The task is small and well-bounded, Haiku handles it cleanly
- Continues the project's pattern of using Anthropic as the adversarial / verification layer alongside OpenAI for generation
- At ~$0.001 per transcript, cost is negligible. The full 135-transcript sweep is ~$0.15.

**Always on.** No env-var gating. Stage 3 always runs. The marginal cost is below the threshold the project should worry about (the per-transcript summarization pass already costs $0.04). If cadence becomes the concern, drop the sweep frequency, that's a workflow-file edit, not a module-level decision.

#### Output schema

For each transcript, write a single JSON file `transcripts/audit/<interview_id>.json`:

```json
{
  "transcript_id": "Aaron Dixon_interview_20250704_170306",
  "audit_timestamp": "2026-05-22T14:23:00Z",
  "ground_truth_version_sha": "<git sha of civil_rights_facts.json at audit time>",
  "audit_pipeline_version": "1.0",
  "corrections": [
    {
      "span": "Megahevers",
      "span_locations": [
        {"file": "Aaron Dixon_interview_transcript_20250704_170306.srt", "srt_index": 142, "char_offset": 78}
      ],
      "suggested": "Medgar Evers",
      "canonical_fact_key": "The Murder of Medgar Evers",
      "confidence": 0.94,
      "source": "stage_2_fuzzy",
      "metaphone_match": true,
      "jaro_winkler": 0.88,
      "context_excerpt": "...he was killed by Megahevers in Mississippi..."
    },
    {
      "span": "the Laundras",
      "span_locations": [...],
      "suggested": "the laundry",
      "canonical_fact_key": null,
      "confidence": 0.78,
      "source": "stage_3_llm",
      "rationale": "Speaker is describing menial work; common-noun, not a proper noun",
      "context_excerpt": "...worked for many, many years at the Laundras..."
    }
  ],
  "grounded_facts": [
    {"canonical_name": "Medgar Evers", "occurrences": 1, "match_source": "stage_1_exact"},
    {"canonical_name": "Freedom Summer", "occurrences": 3, "match_source": "stage_1_exact"},
    {"canonical_name": "Black Panther Party", "occurrences": 2, "match_source": "stage_1_exact"}
  ],
  "stats": {
    "candidates_examined": 47,
    "stage_1_hits": 18,
    "stage_2_fuzzy_corrections": 4,
    "stage_3_llm_corrections": 2,
    "stage_3_llm_rejections": 6,
    "stage_3_llm_cost_usd": 0.0011,
    "unmatched": 17
  }
}
```

**Key design decisions** (each non-obvious choice has a "why"):

1. **Non-destructive: `.srt` is never edited.** The audit file is an overlay. Downstream consumers merge it in at read time. The Smithsonian-grade provenance requirement is that the canonical artifact is what Whisper produced; corrections must be visible *as* corrections, not silent rewrites. A reviewer auditing the project six months from now must be able to see exactly what Whisper said and exactly what was corrected, with attribution.

2. **`canonical_fact_key`** lets downstream code resolve a correction to its `civil_rights_facts.json` entry (the wikipedia link, the description, the full summary text). When `canonical_fact_key` is `null`, the correction is a generic Whisper-error fix without ground-truth grounding (e.g., the laundry case). Both kinds matter; differentiating them in the schema lets the reviewer UI surface them differently.

3. **`ground_truth_version_sha`** lets an audit be re-evaluated when the ground-truth file changes. If `civil_rights_facts.json` gains a new alias, audits for transcripts that previously had no match can be re-run selectively. The workflow uses this sha as a cache key.

4. **`audit_pipeline_version`** versions the audit logic itself. A change to the scoring weights or the LLM prompt bumps this. Downstream consumers decide whether to trust audits from earlier versions or invalidate them.

5. **`span_locations`** uses SRT subtitle indices and character offsets, not byte offsets. Survives encoding changes; renders cleanly in the reviewer UI.

6. **Stats block** lets future analysis distinguish "well-grounded transcript" (high stage_1_hits, low corrections) from "unreliable transcript" (low stage_1_hits, many stage_3 escalations). A future quality dashboard surfaces these per-interview.

### Downstream consumers

The audit file is consumed by three surfaces. Each needs a small code change.

#### 1. Summarization pipeline (the highest-leverage consumer)

Files to modify:
- `processor/summarization.py` (system prompt assembly for `generate_main_summary`)
- `processor/chapterization.py` (system prompt assembly for chapter detection + per-chapter summaries)
- `processor/citation_check.py` (so the citation auditor sees the same corrected context)
- `processor/claude_scorer.py` (so the adversarial scorer sees corrections)

For each, accept a new optional parameter `corrections: Optional[Dict[str, str]] = None` (mapping original span → suggested replacement). When present, append a block to the system prompt:

```
KNOWN CORRECTIONS (Whisper transcription errors detected and verified; treat the suggested form as authoritative):
- "Megahevers" → "Medgar Evers"
- "Stokey Carmickle" → "Stokely Carmichael"
- "the Laundras" → "the laundry"
```

This is the **biggest single quality lift** the audit pipeline produces. The summarizer no longer has to guess; the scorer no longer has to choose between "echo the error" and "correct silently and get flagged." Both layers see the same disambiguated context.

#### 2. Fact-grounding extension

File: `processor/shared.py::get_relevant_facts`

Extend the regex match to also catch correction spans. If the transcript contains "Megahevers" and an approved correction maps it to "Medgar Evers" (which canonicalizes to `The Murder of Medgar Evers`), the `Medgar Evers` ground-truth fact gets pulled into the summary prompt's context block, just as it would have been if Whisper had transcribed the name correctly.

Implementation sketch:

```python
def get_relevant_facts(ctx, text, corrections=None):
    text_lower = text.lower()
    # Apply corrections by substituting corrected forms into a working copy
    # of the text used only for matching, so the original text is preserved
    # for any caller that wants the verbatim transcript.
    matching_text = text_lower
    if corrections:
        for span, suggested in corrections.items():
            matching_text = matching_text.replace(span.lower(), suggested.lower())
    # ... rest of existing regex match logic against matching_text ...
```

#### 3. Reviewer UI

File: `src/pages/TranscriptAuditReview.jsx` (new)

Mirror the existing `src/pages/ReviewQueue.jsx` structure (which already provides the pattern for human review over Firestore). Three-column layout:

- **Left**: list of transcripts with pending corrections (transcript name + pending count badge). Sortable by count.
- **Center**: selected transcript's correction list. Each row shows the candidate span, the suggested replacement, the confidence score, the stage that produced it, the surrounding context, and `[Accept] [Reject] [Edit]` buttons.
- **Right**: full transcript text with each correction span highlighted in yellow. Click a correction in the center → scroll the right pane to the relevant context.

Reviewer actions hit `src/services/transcriptCorrections.js` (new), which writes to the Firestore `transcript_corrections` collection (schema below).

The page is admin-only, gate via the existing `isAdmin()` check used elsewhere in `firestore.rules`.

### Firestore: `transcript_corrections` collection (new)

One document per accepted-or-rejected correction:

```
transcript_corrections/{auto_id}
  transcript_id: "Aaron Dixon_interview_20250704_170306"
  span: "Megahevers"
  suggested: "Medgar Evers"
  canonical_fact_key: "The Murder of Medgar Evers"
  status: "approved" | "rejected" | "pending"
  reviewer_email: "eric@aigamma.com"
  reviewed_at: <Firestore timestamp>
  reviewer_notes: <optional string, e.g. "Confirmed via 1963 LoC archive">
  confidence_at_audit: 0.94
  audit_pipeline_version: "1.0"
  source: "stage_2_fuzzy" | "stage_3_llm"
  context_excerpt: "..."
```

Rules block to add to `firestore.rules`:

```
match /transcript_corrections/{docId} {
  allow read: if request.auth != null;
  allow create, update: if isAdmin();
  allow delete: if isAdmin();
}
```

**Why store both `approved` and `rejected`**: the next audit sweep needs to know which corrections the reviewer already rejected so it doesn't re-propose them. A `rejected` correction is a learned-out-of-the-loop signal.

### Pipeline integration

In `Metadata Generation System/app.py::_process_single_interview` (called by both the Flask UI and `run_sample.py`):

1. Before any LLM-using step, load `transcripts/audit/<interview_id>.json` if it exists.
2. Query Firestore: `transcript_corrections` where `transcript_id == <interview_id>` AND `status == "approved"`.
3. Merge the two into a single `corrections: Dict[str, str]` (Firestore approvals take precedence over raw audit suggestions for the same span).
4. Pass `corrections` as a parameter to: `summarization.generate_main_summary`, `chapterization.detect_topic_transitions`, the per-chapter summary generator, `citation_check.audit_citations`, `claude_scorer.score_with_claude`, and `shared.get_relevant_facts`.
5. Each of those uses `corrections` to extend its system prompt or its matching logic, per the per-consumer sections above.

`dual_scoring_helper.run_tuning_loop_or_dual` similarly accepts and forwards `corrections`. This is the critical thread that prevents the "summary corrected the name → scorer doesn't know about the correction → citation auditor flags it as unsupported" failure mode.

### Recurring scaffolding (deliberately under-specified)

The recurring trigger and cadence are deliberately not specified here. The next agent picks based on operational context. **Recommended baseline** for the next agent's reference:

`.github/workflows/transcript-audit.yml`:

```yaml
name: Transcript audit
on:
  push:
    paths:
      - 'transcripts/raw/**'
      - 'Metadata Generation System/civil_rights_facts.json'
      - 'Metadata Generation System/processor/transcript_audit.py'
  workflow_dispatch:
  schedule:
    - cron: '0 6 * * *'   # 6am UTC = 11pm PT, adjust to WWU's preference
```

Steps:

1. Checkout, Python 3.11, `pip install -r "Metadata Generation System/requirements.txt"`, `pip install jellyfish anthropic`.
2. Restore previous `transcripts/audit/` from the workflow cache, keyed on the git sha of `civil_rights_facts.json` so a ground-truth change invalidates all audits.
3. For each transcript in `transcripts/raw/`: run `python -m processor.transcript_audit <interview_id>`. The module decides whether to re-run based on input mtime + ground-truth sha.
4. Diff new audit JSON against cached previous: new corrections at confidence ≥0.9, withdrawn corrections, confidence shifts of more than ±0.1.
5. If diff is non-empty:
   - Commit `transcripts/audit/` updates to a branch `audit-update-<date>`.
   - Open a draft PR with the diff summarized in the body.
   - Bulk-enqueue new corrections (status=`pending`) into Firestore `transcript_corrections` collection.
6. Cache the updated `transcripts/audit/` under the new ground-truth sha key.

The most important trigger to get right is **on changes to `civil_rights_facts.json`**. When the team adds a new alias to ground truth, the audit can find newly-grounded errors retroactively. This converts the corpus from "what we knew when we first audited" to "what we know now."

### Future direction: Voyage AI semantic similarity stage

Once Weaviate + Voyage AI is operational (see `docs/WEAVIATE_INTEGRATION_DESIGN.md`), a fourth stage becomes possible:

**Stage 2.5, semantic similarity check.** For each Stage 2 candidate scoring in [0.65, 0.85] (the LLM-escalation band), embed the surrounding context with Voyage AI and search the `TranscriptSegment` Weaviate collection for the top-K semantically-similar passages. If those passages mention any canonical fact (via Stage 1 match), the candidate is probably an error referencing that fact. This catches collisions where phonetic + edit-distance fail but the context unambiguously identifies the speaker's referent.

This is additive, not a replacement for Stage 3, semantic similarity tells you "the candidate is about Fact X"; LLM disambiguation tells you "the candidate IS Fact X-spelled-wrong." Both signals improve accuracy.

Voyage AI also offers a reranker (`rerank-2`) that can re-score Stage 2's top-3 phonetic candidates before they reach Stage 3. The reranker is a cross-encoder trained on relevance, for our use case ("which of these three names best matches the context?") that's exactly the right shape of task and runs faster than an LLM call.

### Tests

`Metadata Generation System/tests/test_transcript_audit.py`:

| Test | What it proves |
|---|---|
| `test_stage_1_exact_match` | "Medgar Evers" in transcript → grounded with `match_source=stage_1_exact`, no correction emitted |
| `test_stage_2_fuzzy_phonetic` | "Megahevers" → "Medgar Evers" via metaphone, confidence ≥0.9, `source=stage_2_fuzzy` |
| `test_stage_2_below_threshold_no_falsepositive` | "Bob Smith" → not in ground truth, no spurious correction emitted |
| `test_stage_3_llm_grounded` | Candidate at 0.7 → escalates, Claude Haiku response approves match (mock the API call) |
| `test_stage_3_llm_rejected` | Candidate at 0.7 with ambiguous context → Claude returns `match: "none"`, no correction emitted |
| `test_idempotency_unchanged_inputs` | Re-running on unchanged transcript + unchanged ground-truth sha → returns cached audit, no LLM calls |
| `test_ground_truth_invalidation` | Change ground-truth sha → audit re-runs even when transcript is byte-identical |
| `test_pipeline_integration_corrections_in_prompt` | Run `_process_single_interview` with an audit file present; verify the summarizer's system prompt contains the "KNOWN CORRECTIONS" block |
| `test_firestore_approved_correction_overrides_audit_suggestion` | Audit suggests X→Y, Firestore has approved X→Z, pipeline uses Z |
| `test_firestore_rejected_correction_suppresses_audit` | Audit suggests X→Y, Firestore has rejected X→Y, next audit sweep does not re-propose |

### Cost projection

| Cadence | API cost per sweep | Monthly | Annual |
|---|---|---|---|
| Nightly cron | $0.15 (Haiku 4.5 Stage 3 on 135 transcripts) | $4.50 | $54 |
| Weekly cron | $0.15 | $0.65 | $7.80 |
| On-PR + monthly cron | $0.15 + churn | $1-3 | $12-36 |

Cost is dominated by Stage 3. Stages 1 + 2 are CPU-only and free. Pick cadence based on "how often does ground truth change" and "how often is the team checking the reviewer queue."

### What this does NOT solve

Honest scope limits, flag these in the reviewer UI so reviewers know not to expect coverage:

- **Common-noun Whisper errors with no ground-truth grounding.** "the Laundras" → "the laundry" is a Whisper error where neither word is in `civil_rights_facts.json`. Stage 1 + 2 will miss it. Stage 3 might catch it if the candidate happens to be in the middle-band score range, but the design isn't optimized for it. Mitigating that class of error requires either a dictionary-based spell-check pass or a confidence-flagged Whisper re-run with a larger model. **Out of scope here.**

- **Speaker disagreement with ground truth.** If the speaker misremembers a date ("Brown v. Board was in 1955" when the ruling was 1954), the audit flags neither. **Intentional.** The speaker's recollection is the source material, and it's not the audit's job to correct it. The reviewer can annotate disagreement in the summary if needed.

- **Cross-transcript phonetic disambiguation.** If "Stokey Carmickle" appears in 10 transcripts, each audit runs independently. A future v2 could pool candidates across the corpus and use the aggregate to boost confidence (10 transcripts independently flagging the same span at 0.83 is stronger evidence than any single one), but v1 is per-transcript for simplicity.

- **Disambiguation of speakers with overlapping names.** Two interviewees both named "James Wilson" would each get audit files but no cross-reference linking them. Acceptable for the current corpus, none of the 135 interviewees share names.

### Acceptance criteria for the next agent

The transcript audit is shippable when:

1. `python -m processor.transcript_audit <interview_id>` runs without errors and writes a well-formed JSON to `transcripts/audit/<interview_id>.json` matching the schema above.
2. On the Aaron Dixon transcript: at least 5 Stage 1 hits, Stage 3 either grounds or rejects the laundry case, no false-positive corrections on common nouns ("the", "and", "Mississippi", "Chicago", "Black").
3. The summarization pipeline picks up corrections from both the audit file and the Firestore `transcript_corrections` collection when running `python "Metadata Generation System/run_sample.py" "Aaron Dixon"`. The "KNOWN CORRECTIONS" block appears in the system prompt that reaches the LLM.
4. The reviewer UI at `src/pages/TranscriptAuditReview.jsx` renders pending corrections with the highlighting + accept/reject actions wired up to Firestore.
5. CI: workflow runs successfully on a PR that touches `transcripts/raw/` or `civil_rights_facts.json`.
6. All ten tests in the test plan pass.
7. `docs/DEPLOYMENT.md` updated with a section on running the audit module locally.

That's the clean handoff.

## See also

- `docs/WEAVIATE_INTEGRATION_DESIGN.md`, the RAG retrieval substrate this design integrates with (Stage 2.5 semantic similarity, plus the corpus-wide grounding the Weaviate-backed pipeline enables)
- `docs/DEPLOYMENT.md`, operator-level setup; will be extended with the audit module's setup once implemented
- `docs/ACCESSIBILITY.md`, the WCAG 2.2 AA audit report from the May 2026 overhaul, which established the documentation style this doc follows
- `CLAUDE.md`, project-wide architectural notes for Claude Code agents
- `Metadata Generation System/civil_rights_facts.json`, the ground-truth corpus the audit grounds against (60 entries, 51 with aliases, 138 aliases total)
- `Metadata Generation System/processor/shared.py::get_relevant_facts`, the existing exact-match fact resolver this design extends
- `Metadata Generation System/processor/citation_check.py`, `claude_scorer.py`, `dual_scoring_helper.py`, the downstream consumers whose system prompts get the corrections block
- `src/pages/ReviewQueue.jsx`, the existing reviewer UI pattern that `TranscriptAuditReview.jsx` mirrors
