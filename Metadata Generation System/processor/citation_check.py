"""
Citation verifier for summary claims.

Given a generated summary and the source transcript, runs a focused
Claude Opus 4.7 pass that maps every factual claim in the summary to
the specific transcript text that supports it. Unsupported claims are
flagged with a three-way status (supported / partially_supported /
unsupported), and the per-claim rationale tells the reviewer exactly
why each claim got its status.

Complementary to the holistic claude_scorer.py:
  - claude_scorer.py produces accuracy_score + quality_score +
    unsupported_claims as one publication-gate decision
  - citation_check.py produces a per-claim audit table that the Flask
    tuning UI can render alongside the score, and that a future
    review_queue document can store as a 'citation_audit' field for the
    human reviewer to consult

Both can be run independently; neither requires the other. The Flask UI
can choose to surface only the score (cost-conservative), only the
citation audit (transparency-first), or both (Smithsonian-grade).
"""

import os
import json
import re
from typing import Dict, Any, Optional

try:
    import anthropic
except ImportError:
    anthropic = None


DEFAULT_MODEL = "claude-opus-4-7"


CITATION_CHECK_SYSTEM_PROMPT = """\
You are a citation auditor for civil rights oral history summaries. Given a generated summary and the source transcript, your job is to map every factual claim in the summary to the specific transcript text that supports it.

CORE RULES:
1. Read the summary carefully. Extract every factual claim it makes about people, places, dates, organizations, events, causes, attributions, or quoted statements. Treat each claim as a separate audit item.
2. For each claim, find the most relevant transcript passage. The passage is "supporting" if it directly establishes the claim. A passage that mentions a related topic but does not establish the specific claim is NOT supporting.
3. Mark every claim as supported, partially_supported, or unsupported.
   - supported: the transcript directly establishes the claim, including its dates, names, attributions, and emphasis.
   - partially_supported: the transcript has some basis for the claim but the summary extends beyond it -- a paraphrase that changes emphasis, a date the speaker mentioned in passing that the summary frames as central, a relationship the speaker named loosely that the summary describes specifically.
   - unsupported: no transcript passage establishes the claim. The summary appears to have invented or imported the claim from outside the transcript.
4. Transcription errors are expected: if the summary uses a real historical name (e.g. 'Medgar Evers') and the transcript has a garbled version (e.g. 'Megahevers'), treat them as a match and mark the claim supported. But if the summary uses a real name and the transcript clearly contains a different real name, mark the claim unsupported.
5. Be thorough. It is better to flag a borderline claim as partially_supported than to give the summary the benefit of the doubt. The Smithsonian-grade quality bar treats every uncertainty as a problem.

OUTPUT FORMAT:
Respond ONLY with valid JSON in this exact shape. No preamble, no markdown fences, no commentary outside the JSON object:

{
  "claims": [
    {
      "claim": "exact text of the factual claim from the summary",
      "status": "supported" | "partially_supported" | "unsupported",
      "supporting_excerpt": "the transcript passage that establishes the claim, or 'none found' for unsupported claims",
      "rationale": "1-2 sentence explanation of why the claim got this status"
    }
  ],
  "summary_stats": {
    "total_claims": integer,
    "supported": integer,
    "partially_supported": integer,
    "unsupported": integer
  }
}"""


def _strip_markdown_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*\n?", "", text)
        text = re.sub(r"\n?```\s*$", "", text)
    return text.strip()


def audit_citations(
    summary_text: str,
    transcript: str,
    model: Optional[str] = None,
    api_key: Optional[str] = None,
    transcript_char_limit: int = 12000,
    max_tokens: int = 3000,
) -> Dict[str, Any]:
    """Audit citations for every factual claim in a summary.

    Args:
        summary_text: the generated summary's prose body. Pass just the
            summary string, not the wrapping dict; this function audits
            the prose, not the metadata fields.
        transcript: the source transcript text. Truncated to
            transcript_char_limit characters (default 12000) to match
            the existing OpenAI scorer's truncation window.
        model: optional override; defaults to CLAUDE_SCORER_MODEL env
            var, then to claude-opus-4-7.
        api_key: optional API key override. Defaults to ANTHROPIC_API_KEY.
        transcript_char_limit: input truncation. Default 12000 matches
            the OpenAI scoring window for apples-to-apples comparison.
        max_tokens: response size cap. Default 3000 is enough for an
            audit of ~20 claims with full rationale text; raise for
            summaries with many claims.

    Returns:
        {
            "claims": [
                {"claim": "...", "status": "supported"|"partially_supported"|"unsupported",
                 "supporting_excerpt": "...", "rationale": "..."},
                ...
            ],
            "summary_stats": {
                "total_claims": int,
                "supported": int,
                "partially_supported": int,
                "unsupported": int
            }
        }

        On API failure: {"error": "..."}. On JSON parse failure:
        {"error": "...", "raw_response": "..."}.

    Raises:
        RuntimeError: if anthropic SDK is not installed.
        ValueError: if ANTHROPIC_API_KEY is not set and api_key not passed.
    """
    if anthropic is None:
        raise RuntimeError("anthropic SDK not installed. Run: pip install anthropic")

    key = api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        raise ValueError("ANTHROPIC_API_KEY not found. Set the env var or pass api_key.")

    model = model or os.environ.get("CLAUDE_SCORER_MODEL") or DEFAULT_MODEL
    client = anthropic.Anthropic(api_key=key)

    user_prompt = (
        f"SUMMARY TO AUDIT:\n{summary_text}\n\n"
        f"TRANSCRIPT (first {transcript_char_limit} chars):\n"
        f"{transcript[:transcript_char_limit]}"
    )

    try:
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=[
                {
                    "type": "text",
                    "text": CITATION_CHECK_SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": user_prompt}],
            # Claude Opus 4.7 rejects `temperature` (HTTP 400 "deprecated for
            # this model"). Determinism comes from the strict JSON-shape
            # contract in CITATION_CHECK_SYSTEM_PROMPT, not the temperature
            # setting. See claude_scorer.py for the same rationale.
        )
    except Exception as e:
        return {"error": f"Claude API call failed: {str(e)}"}

    # Defensively extract the first text content block, same pattern as
    # claude_scorer.py: the Anthropic API can return non-text blocks
    # (tool_use) or an empty content array in edge cases, and a bare
    # response.content[0].text access would raise on either.
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

    parsed.setdefault("claims", [])
    parsed.setdefault("summary_stats", {
        "total_claims": 0,
        "supported": 0,
        "partially_supported": 0,
        "unsupported": 0,
    })

    # Type-coerce the fields the downstream consumer (fraction_supported,
    # plus any future review-queue 'citation_audit' renderer) expects.
    # Same defensive pattern landed in claude_scorer.py: a model that
    # emits "total_claims": "20" (string) or "claims": null would
    # otherwise crash a downstream int comparison or list iteration.
    # Inlining the helpers here (rather than importing from
    # claude_scorer) keeps this module independently importable -- a
    # caller running just the citation audit without the full dual-scorer
    # stack does not need to drag in claude_scorer's other helpers.
    if not isinstance(parsed.get("claims"), list):
        parsed["claims"] = []
    stats = parsed.get("summary_stats")
    if not isinstance(stats, dict):
        stats = {}
    parsed["summary_stats"] = {
        "total_claims": _coerce_count(stats.get("total_claims")),
        "supported": _coerce_count(stats.get("supported")),
        "partially_supported": _coerce_count(stats.get("partially_supported")),
        "unsupported": _coerce_count(stats.get("unsupported")),
    }

    return parsed


def _coerce_count(value) -> int:
    """Coerce a model-supplied count to a non-negative int, falling back
    to 0 on parse failure. Same intent as claude_scorer._coerce_int but
    inlined here so citation_check stays independently importable."""
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


def fraction_supported(audit: Dict[str, Any]) -> float:
    """Return the fraction of claims marked supported (excluding partial).

    Useful as a single-number signal callers can route on. A summary
    with 20 claims of which 18 are supported and 2 partial scores 0.9;
    a summary with 5 claims and 1 unsupported scores 0.8. The denominator
    is total_claims, not (total - unsupported), so an unsupported claim
    counts against the fraction.

    Returns 0.0 if the audit failed (no claims extracted) or if the
    audit returned an error. Robust against malformed audit dicts:
    audit.get returns None if the key is missing, _coerce_count
    converts any non-numeric value to 0, so a malformed audit returns
    0.0 instead of crashing.
    """
    stats = audit.get("summary_stats") if isinstance(audit, dict) else None
    if not isinstance(stats, dict):
        return 0.0
    total = _coerce_count(stats.get("total_claims"))
    if total <= 0:
        return 0.0
    supported = _coerce_count(stats.get("supported"))
    return supported / total
