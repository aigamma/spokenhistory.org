"""
Step 6b -- External second-opinion scorer using Anthropic Claude Opus 4.7.

This module provides an independent scoring path for AI-generated summaries
that complements the existing OpenAI-based scorer in tuning.py. Using a
different model family (Anthropic Claude vs OpenAI GPT) catches blind spots
that arise when the same model both generates and scores its own output:
the same training distribution produces the same shortcuts in both passes.

For Smithsonian-grade publication, both scorers must independently pass the
threshold for a summary to be considered publishable. When the two scorers
disagree (one passes, one fails), the summary is quarantined for human
review rather than auto-published. See combined_publication_decision().

This module is intentionally additive -- it does not modify tuning.py.
Integration into the pipeline happens by calling score_with_claude after
the existing tuning loop completes, then routing the combined decision
through a new gating step.
"""

import os
import json
import re
from typing import Dict, Any, Optional, List

try:
    import anthropic
except ImportError:
    anthropic = None  # Optional dependency; module degrades gracefully if absent.


# Default model. Claude Opus 4.7 is the most rigorous model in the Anthropic
# family as of this writing and is the appropriate choice for an adversarial
# fact-checking pass over civil rights oral history summaries. Override via
# the model parameter or the CLAUDE_SCORER_MODEL environment variable.
DEFAULT_MODEL = "claude-opus-4-7"


# Hardened scoring prompt that inverts the lenient bias of the existing
# score_summary_system.txt. Where the existing OpenAI scoring prompt
# instructs "do not penalize for reasonable omissions" and "when in doubt,
# do NOT flag" and "it is perfectly acceptable to have zero errors," this
# prompt asks for the opposite: identify every claim, verify each against
# the transcript, and flag uncertainty rather than overlook it.

CLAUDE_SCORER_SYSTEM_PROMPT = """\
You are an adversarial fact-checker reviewing an AI-generated summary of a civil rights oral history interview.
The summary will be published as part of an archival project in partnership with the Library of Congress and the Smithsonian National Museum of African American History and Culture.
Hallucinations in prior AI-generated outputs have caused real reputational damage to this project. Your job is to find them.

CORE RULES:
1. Treat every claim in the summary as a hypothesis to verify against the transcript.
2. A claim is "supported" only if you can point to specific transcript text that establishes it. Paraphrases must preserve meaning AND emphasis AND attribution.
3. When you are uncertain whether a claim is supported, FLAG it as uncertain. Do not give the summary the benefit of the doubt.
4. Hallucinations include not just invented facts but also: unsupported causal links (X happened because of Y), unsupported attributions (X said Y, X did Y), unsupported emphasis (presenting a minor mention as a central theme), and unsupported context (adding historical framing the speaker did not provide).
5. Transcription errors in the input are expected. If the summary uses a real historical name (e.g., "Medgar Evers") and the transcript has a garbled version (e.g., "Megahevers"), the summary is correct. But if the summary uses a real name and the transcript clearly contains a different real name, the summary is wrong.

SCORING:
You will score the summary on two dimensions: accuracy (0-100) and quality/completeness (0-100), using the rubric the user will provide.
Smithsonian-grade publication requires a minimum of 90 on BOTH dimensions, with zero unsupported claims.

OUTPUT FORMAT:
Respond ONLY with valid JSON in this exact shape. No preamble, no markdown fences, no commentary outside the JSON object:

{
  "accuracy_score": 0-100,
  "quality_score": 0-100,
  "unsupported_claims": [
    {
      "claim": "exact text from the summary",
      "transcript_evidence": "the closest transcript passage, or 'none found'",
      "severity": "hallucination" | "overreach" | "uncertain"
    }
  ],
  "supported_claims_count": integer,
  "errors": [
    "REPLACE: '<wrong text>' -> '<correct text>'",
    "REMOVE: '<unsupported claim>'",
    "ADD: '<missing important detail>'"
  ],
  "improvements": [
    "<optional non-blocking enhancement>"
  ],
  "publishable": boolean,
  "publishable_rationale": "1-2 sentences explaining the publishable decision"
}

The "publishable" field is true ONLY if ALL of:
- accuracy_score >= 90
- quality_score >= 90
- unsupported_claims is empty (zero hallucinations, zero overreaches, zero uncertainties)

If any of those conditions fail, publishable is false regardless of the score numbers.

Severity definitions for unsupported_claims:
- "hallucination": the claim is contradicted by the transcript or has no basis in it whatsoever (e.g., a date the speaker never mentioned).
- "overreach": the claim extends beyond what the transcript supports (e.g., "the boycott was unsuccessful" when the transcript only says the speaker felt frustrated).
- "uncertain": the claim might be supported but the transcript text is ambiguous (e.g., the speaker mentions a meeting in passing but the summary frames it as a turning point)."""


def _strip_markdown_fences(text: str) -> str:
    """Remove ```json ... ``` fences if the model wraps the response despite
    instructions to the contrary. Defensive parsing."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*\n?", "", text)
        text = re.sub(r"\n?```\s*$", "", text)
    return text.strip()


def score_with_claude(
    summary_dict: Dict[str, Any],
    transcript: str,
    content_type: str = "main_summary",
    rubric: str = "",
    model: Optional[str] = None,
    api_key: Optional[str] = None,
    transcript_char_limit: int = 12000,
    primary_source_info: Optional[Dict[str, Any]] = None,
    max_tokens: int = 2000,
) -> Dict[str, Any]:
    """Score a generated summary independently using Claude.

    Returns a dict with the same overall shape as the OpenAI scorer
    (accuracy_score, quality_score, errors, improvements) plus the
    Claude-specific fields:
      - unsupported_claims: list of dicts with claim, transcript_evidence, severity
      - supported_claims_count: integer
      - publishable: bool (the strict Smithsonian-grade decision)
      - publishable_rationale: str (1-2 sentence explanation)

    The publishable flag is the strict gate: requires accuracy >= 90,
    quality >= 90, AND zero unsupported claims. A single uncertain claim
    blocks publication even if both numeric scores cleared the bar.

    Args:
        summary_dict: the generated summary, same shape as passed to the
            existing OpenAI scorer (summary text, key_themes, etc.).
        transcript: the source transcript text. Truncated to
            transcript_char_limit characters (default 12000) to match the
            existing OpenAI scorer's truncation.
        content_type: "main_summary" or "chapter". For "chapter", expects
            additional fields (title, keywords) in summary_dict.
        rubric: the rubric text. Pass the same StandardizedRubric_1.md
            content the OpenAI scorer uses, so the two scorers are
            evaluating against an identical standard.
        model: model name. Defaults to CLAUDE_SCORER_MODEL env var, then
            to claude-opus-4-7.
        api_key: optional API key override. Defaults to ANTHROPIC_API_KEY.
        transcript_char_limit: input truncation. Claude Opus handles up
            to 200K tokens, so this could be raised; default matches the
            OpenAI scorer for apples-to-apples comparison.
        primary_source_info: interviewee reference dict (optional).
        max_tokens: response size cap. Default 2000 is enough for a few
            dozen flagged claims plus the rationale; raise for chapters
            with many issues.

    Returns:
        Score dict (see above). On API failure, returns
        {"error": "..."}. On JSON parse failure, returns
        {"error": "...", "raw_response": "..."}.

    Raises:
        RuntimeError: anthropic SDK is not installed.
        ValueError: ANTHROPIC_API_KEY is not set and api_key not passed.
    """
    if anthropic is None:
        raise RuntimeError(
            "anthropic SDK not installed. Run: pip install anthropic"
        )

    key = api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        raise ValueError(
            "ANTHROPIC_API_KEY not found. Set the env var or pass api_key."
        )

    model = model or os.environ.get("CLAUDE_SCORER_MODEL") or DEFAULT_MODEL
    client = anthropic.Anthropic(api_key=key)

    # Build the user prompt: summary fields, transcript, rubric.
    user_prompt_parts = [
        f"CONTENT TYPE: {content_type}",
        "",
        "SUMMARY TO EVALUATE:",
        f"  Summary text: {summary_dict.get('summary', '')}",
        f"  Key themes: {', '.join(summary_dict.get('key_themes', []))}",
        f"  Historical significance: {summary_dict.get('historical_significance', '')}",
    ]
    if content_type != "main_summary":
        user_prompt_parts.append(
            f"  Chapter title: {summary_dict.get('title', '')}"
        )
        user_prompt_parts.append(
            f"  Keywords: {', '.join(summary_dict.get('keywords', []))}"
        )
    user_prompt_parts.extend([
        "",
        f"TRANSCRIPT (first {transcript_char_limit} chars):",
        transcript[:transcript_char_limit],
        "",
        "RUBRIC TO USE:",
        rubric if rubric else "Use the rubric described in the system prompt.",
    ])

    if primary_source_info:
        # Defer import so this module can be imported without dragging in
        # all of shared.py's dependencies.
        from .shared import format_primary_source_for_prompt
        user_prompt_parts.append(format_primary_source_for_prompt(primary_source_info))

    user_prompt = "\n".join(user_prompt_parts)

    # Make the API call. Prompt caching on the system prompt cuts cost
    # dramatically when scoring many chapters back-to-back since the
    # system prompt is identical across all calls in a batch run.
    try:
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=[
                {
                    "type": "text",
                    "text": CLAUDE_SCORER_SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": user_prompt}],
            temperature=0.0,  # Maximum determinism for scoring consistency.
        )
    except Exception as e:
        return {"error": f"Claude API call failed: {str(e)}"}

    # Defensively extract the first text content block. The Anthropic
    # API can return non-text blocks (tool_use) or an empty content
    # array in edge cases; the bare response.content[0].text access
    # this used to do would raise on either. We walk the content array
    # for the first .text-bearing block instead.
    raw_text = ""
    for block in response.content or []:
        text = getattr(block, "text", None)
        if text:
            raw_text = text
            break
    if not raw_text:
        return {"error": "Claude API returned no text content blocks"}

    cleaned = _strip_markdown_fences(raw_text)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as e:
        return {
            "error": f"Failed to parse Claude response as JSON: {str(e)}",
            "raw_response": raw_text[:2000],
        }

    # Defensive defaults so callers can rely on the same keys being present
    # even when the model omits one despite the prompt instructions.
    parsed.setdefault("accuracy_score", 0)
    parsed.setdefault("quality_score", 0)
    parsed.setdefault("unsupported_claims", [])
    parsed.setdefault("supported_claims_count", 0)
    parsed.setdefault("errors", [])
    parsed.setdefault("improvements", [])
    parsed.setdefault("publishable", False)
    parsed.setdefault("publishable_rationale", "")

    # Type-coerce score fields so downstream comparisons in
    # combined_publication_decision (c_acc >= 90, etc.) cannot crash with
    # a TypeError when the model emits a stringified number like
    # "accuracy_score": "90" instead of an int. Temperature=0.0 reduces
    # but does not eliminate this risk -- model-output JSON can drift in
    # rare cases. The coercion is intentionally permissive: int("90.5")
    # works via the float() round-trip, "high" and None fall back to 0,
    # so the publication gate fails closed (a malformed score becomes 0
    # which fails the 90 threshold) rather than crashing the pipeline.
    parsed["accuracy_score"] = _coerce_score(parsed.get("accuracy_score"))
    parsed["quality_score"] = _coerce_score(parsed.get("quality_score"))
    parsed["supported_claims_count"] = _coerce_int(parsed.get("supported_claims_count"))

    # Coerce unsupported_claims to a list. The downstream len() call in
    # combined_publication_decision would crash on a None or a string.
    if not isinstance(parsed.get("unsupported_claims"), list):
        parsed["unsupported_claims"] = []

    return parsed


def _coerce_score(value) -> int:
    """Coerce a model-supplied score to an int in [0, 100], falling back
    to 0 on any parse failure. Used to defend combined_publication_decision
    against TypeError on malformed scorer responses."""
    if isinstance(value, bool):  # bool is a subclass of int; reject explicitly
        return 0
    if isinstance(value, (int, float)):
        try:
            n = int(value)
        except (ValueError, OverflowError):
            return 0
        return max(0, min(100, n))
    if isinstance(value, str):
        try:
            n = int(float(value.strip()))
        except (ValueError, OverflowError):
            return 0
        return max(0, min(100, n))
    return 0


def _coerce_int(value) -> int:
    """Coerce a model-supplied integer to a non-negative int, falling
    back to 0 on any parse failure. Companion to _coerce_score for
    fields like supported_claims_count that are counts rather than
    bounded 0-100 scores."""
    if isinstance(value, bool):
        return 0
    if isinstance(value, (int, float)):
        try:
            n = int(value)
        except (ValueError, OverflowError):
            return 0
        return max(0, n)
    if isinstance(value, str):
        try:
            n = int(float(value.strip()))
        except (ValueError, OverflowError):
            return 0
        return max(0, n)
    return 0


def tune_with_dual_scoring(
    ctx,
    summary: Dict[str, Any],
    transcript: str,
    content_type: str = "main_summary",
    quality_threshold: int = 80,
    accuracy_threshold: int = 80,
    max_retries: int = 3,
    smithsonian_accuracy_threshold: int = 90,
    smithsonian_quality_threshold: int = 90,
    claude_model: Optional[str] = None,
    claude_api_key: Optional[str] = None,
    rubric: Optional[str] = None,
    primary_source_info: Optional[Dict[str, Any]] = None,
    eval_sys_prompt: Optional[str] = None,
    eval_user_prompt: Optional[str] = None,
    revision_sys_prompt: Optional[str] = None,
    revision_user_prompt: Optional[str] = None,
    near_threshold_tolerance: int = 3,
    min_improvement: int = 3,
) -> Dict[str, Any]:
    """Orchestrate dual-scorer tuning: existing OpenAI loop + independent Claude pass.

    Step 1: run the existing OpenAI tuning loop with the OpenAI thresholds
            (default 80/80). The loop iterates regenerate-until-pass and
            returns its best attempt.
    Step 2: take the final summary and score it independently with Claude
            using the adversarial scoring prompt baked into claude_scorer.py.
    Step 3: apply the Smithsonian-grade thresholds (default 90/90) to both
            scorers via combined_publication_decision and produce the
            publishable bool plus the decision_path.

    The OpenAI thresholds and Smithsonian-grade thresholds are intentionally
    separated. The OpenAI loop iterates against the 80/80 bar (the threshold
    it has historically been tuned for); the publication gate is the stricter
    90/90 bar that BOTH scorers must clear independently. This preserves the
    existing pipeline's regeneration behavior while applying a stricter
    publication gate on the final result.

    Smithsonian-grade publication requires:
      - OpenAI accuracy >= 90 AND quality >= 90
      - Claude accuracy >= 90 AND quality >= 90 AND zero unsupported_claims

    Disagreement between the two scorers (one passes, one fails) blocks
    publication and routes the summary into the human-review queue.

    Args:
        ctx: ProcessorContext (the existing pipeline's shared config object).
        summary: the draft summary dict to tune.
        transcript: the source transcript text.
        content_type: "main_summary" or "chapter".
        quality_threshold: OpenAI loop threshold (default 80, the existing
            pipeline's historical value).
        accuracy_threshold: OpenAI loop threshold (default 80).
        max_retries: OpenAI loop retry budget (default 3).
        smithsonian_accuracy_threshold: publication-gate threshold for both
            scorers (default 90).
        smithsonian_quality_threshold: publication-gate threshold (default 90).
        claude_model: optional Claude model override; defaults to claude-opus-4-7.
        claude_api_key: optional Claude API key; defaults to ANTHROPIC_API_KEY.
        rubric: rubric text; defaults to ctx.rubric (loaded from StandardizedRubric_1.md).
        primary_source_info: interviewee metadata (optional).
        eval_sys_prompt, eval_user_prompt, revision_sys_prompt,
            revision_user_prompt: optional prompt overrides passed through
            to run_tuning_loop, same semantics as the existing pipeline.

    Returns:
        Augmented dict with all keys from run_tuning_loop's result
        (summary, scores, regenerated, retries) PLUS:
          - openai_scores: alias of scores for symmetry in combined output
          - claude_scores: result of score_with_claude
          - publication_decision: result of combined_publication_decision
          - publishable: shortcut bool from publication_decision

    Caller can route based on publication_decision["human_review_required"]:
        True  -> send to review queue (task #14)
        False -> publish (only happens when publication_decision["publishable"] is True)
    """
    # Local imports to avoid eager loading of the OpenAI dependency when only
    # the Claude scorer is needed (e.g., in unit tests of claude_scorer alone).
    from .tuning import run_tuning_loop

    # Step 1: existing OpenAI tuning loop. near_threshold_tolerance and
    # min_improvement are threaded through so the early-exit semantics
    # are identical to a direct run_tuning_loop call. If those were
    # dropped here (as the original implementation did), toggling
    # USE_DUAL_SCORING would silently change tuning behavior for callers
    # that pass non-default values -- the dispatcher's promise of
    # behavior parity on the tuning-loop side would only hold for
    # callers using the default 3/3 thresholds.
    tuning_result = run_tuning_loop(
        ctx,
        summary=summary,
        transcript=transcript,
        content_type=content_type,
        quality_threshold=quality_threshold,
        accuracy_threshold=accuracy_threshold,
        max_retries=max_retries,
        eval_sys_prompt=eval_sys_prompt,
        eval_user_prompt=eval_user_prompt,
        revision_sys_prompt=revision_sys_prompt,
        revision_user_prompt=revision_user_prompt,
        primary_source_info=primary_source_info,
        near_threshold_tolerance=near_threshold_tolerance,
        min_improvement=min_improvement,
    )

    openai_scores = tuning_result.get("scores", {}) or {}
    final_summary = tuning_result["summary"]

    # Step 2: independent Claude scoring of the final OpenAI-tuned summary.
    if rubric is None:
        rubric = getattr(ctx, "rubric", "") or ""

    claude_scores = score_with_claude(
        summary_dict=final_summary,
        transcript=transcript,
        content_type=content_type,
        rubric=rubric,
        model=claude_model,
        api_key=claude_api_key,
        primary_source_info=primary_source_info,
    )

    # Step 3: combined publication decision against the stricter Smithsonian
    # thresholds. This gate is independent of the OpenAI loop's pass/fail.
    publication_decision = combined_publication_decision(
        openai_scores=openai_scores,
        claude_scores=claude_scores,
        accuracy_threshold=smithsonian_accuracy_threshold,
        quality_threshold=smithsonian_quality_threshold,
    )

    return {
        **tuning_result,
        "openai_scores": openai_scores,
        "claude_scores": claude_scores,
        "publication_decision": publication_decision,
        "publishable": publication_decision["publishable"],
    }


def combined_publication_decision(
    openai_scores: Dict[str, Any],
    claude_scores: Dict[str, Any],
    accuracy_threshold: int = 90,
    quality_threshold: int = 90,
) -> Dict[str, Any]:
    """Combine the OpenAI scorer's output with the Claude scorer's output
    to produce a single Smithsonian-grade publication decision.

    Smithsonian-grade requires BOTH scorers to independently pass.
    Disagreement (one passes, one fails) triggers human review rather than
    auto-publication.

    Args:
        openai_scores: the dict returned by score_summary or score_chapter
            in tuning.py.
        claude_scores: the dict returned by score_with_claude.
        accuracy_threshold: minimum accuracy score for both scorers. Default
            90, well above the 80/80 currently used by the pipeline.
        quality_threshold: minimum quality score for both scorers. Default 90.

    Returns:
        {
            "publishable": bool,
            "decision_path": "both_pass" | "claude_blocked" | "openai_blocked" | "both_blocked",
            "openai_accuracy": int,
            "openai_quality": int,
            "claude_accuracy": int,
            "claude_quality": int,
            "claude_unsupported_count": int,
            "human_review_required": bool,
            "rationale": str,
        }
    """
    o_acc = openai_scores.get("accuracy_score", 0)
    o_qual = openai_scores.get("quality_score", 0)
    c_acc = claude_scores.get("accuracy_score", 0)
    c_qual = claude_scores.get("quality_score", 0)
    c_unsupported_count = len(claude_scores.get("unsupported_claims", []))

    openai_passes = (
        o_acc >= accuracy_threshold and o_qual >= quality_threshold
    )
    claude_passes = (
        c_acc >= accuracy_threshold
        and c_qual >= quality_threshold
        and c_unsupported_count == 0
    )

    if openai_passes and claude_passes:
        decision_path = "both_pass"
        publishable = True
        human_review_required = False
        rationale = (
            f"Both scorers pass the {accuracy_threshold}/{quality_threshold} threshold. "
            f"OpenAI: {o_acc}/{o_qual}. Claude: {c_acc}/{c_qual} with "
            f"{c_unsupported_count} unsupported claims."
        )
    elif openai_passes and not claude_passes:
        decision_path = "claude_blocked"
        publishable = False
        human_review_required = True
        rationale = (
            f"OpenAI passed ({o_acc}/{o_qual}) but Claude blocked publication: "
            f"{c_acc}/{c_qual} with {c_unsupported_count} unsupported claims. "
            f"Human review required to resolve scorer disagreement."
        )
    elif claude_passes and not openai_passes:
        decision_path = "openai_blocked"
        publishable = False
        human_review_required = True
        rationale = (
            f"Claude passed ({c_acc}/{c_qual} with zero unsupported claims) but "
            f"OpenAI blocked: {o_acc}/{o_qual}. Human review required to resolve "
            f"scorer disagreement."
        )
    else:
        decision_path = "both_blocked"
        publishable = False
        human_review_required = True
        rationale = (
            f"Both scorers block publication. OpenAI: {o_acc}/{o_qual}. "
            f"Claude: {c_acc}/{c_qual} with {c_unsupported_count} unsupported claims. "
            f"Summary needs revision or rejection."
        )

    return {
        "publishable": publishable,
        "decision_path": decision_path,
        "openai_accuracy": o_acc,
        "openai_quality": o_qual,
        "claude_accuracy": c_acc,
        "claude_quality": c_qual,
        "claude_unsupported_count": c_unsupported_count,
        "human_review_required": human_review_required,
        "rationale": rationale,
    }
