"""
Helper that wraps the existing run_tuning_loop with optional Claude
Opus 4.7 second-opinion scoring and human-review-queue routing for
the Smithsonian-grade publication gate.

USE_DUAL_SCORING env var: when set to a truthy value (1, true, yes,
on -- case-insensitive), the helper calls tune_with_dual_scoring
instead of the bare run_tuning_loop. The returned dict has the same
shape as run_tuning_loop's result plus the additional Claude-scoring
fields (openai_scores, claude_scores, publication_decision,
publishable), so existing callers that expect the basic shape continue
to work; callers that want to act on the publication_decision can read
the extra keys.

Default behavior (env var unset): identical to run_tuning_loop.

Integration pattern: app.py imports `run_tuning_loop_or_dual` from
this module under the alias `run_tuning_loop` so the existing call
sites need only one import-line change. The function signature is a
superset of run_tuning_loop's, so callers that don't pass the new
interview_id / chapter_number / pipeline_run_id parameters still work
under the dual-scoring path (the human-review enqueue gracefully
skips with a warning rather than failing the pipeline).
"""

import os
from typing import Optional, Dict, Any

from .tuning import run_tuning_loop


def _dual_scoring_enabled() -> bool:
    """Return True iff the USE_DUAL_SCORING env var is set to a truthy
    value. Truthy here is exactly the standard 1 / true / yes / on
    (case-insensitive); anything else, including empty / unset, is
    False. Conservative on purpose -- the dual-scoring path doubles
    per-summary API cost (one OpenAI call + one Claude call) and the
    team should opt in deliberately."""
    v = os.environ.get("USE_DUAL_SCORING", "").strip().lower()
    return v in ("1", "true", "yes", "on")


def run_tuning_loop_or_dual(
    ctx,
    summary: Dict[str, Any],
    transcript: str,
    content_type: str = "main_summary",
    quality_threshold: int = 80,
    accuracy_threshold: int = 80,
    max_retries: int = 3,
    eval_sys_prompt: Optional[str] = None,
    eval_user_prompt: Optional[str] = None,
    revision_sys_prompt: Optional[str] = None,
    revision_user_prompt: Optional[str] = None,
    primary_source_info: Optional[Dict[str, Any]] = None,
    interview_id: Optional[str] = None,
    chapter_number: Optional[int] = None,
    pipeline_run_id: Optional[str] = None,
    near_threshold_tolerance: int = 3,
    min_improvement: int = 3,
) -> Dict[str, Any]:
    """Dispatch to either run_tuning_loop (default) or
    tune_with_dual_scoring (when USE_DUAL_SCORING is set).

    The new parameters interview_id / chapter_number / pipeline_run_id
    are only consumed by the dual-scoring path (for routing
    not-publishable summaries into the human-review queue). The
    bare run_tuning_loop path ignores them, so existing call sites can
    be updated incrementally: the import alias change unlocks the
    USE_DUAL_SCORING toggle, and later passing interview_id at the
    call sites unlocks proper enqueueing.

    When dual scoring is enabled and a summary fails the publication
    gate (publication_decision.human_review_required == True), the
    helper enqueues the item into the review_queue Firestore collection
    via processor.review_queue.enqueue_for_review. If interview_id is
    None at that point, the enqueue is skipped with a warning log
    rather than crashing the pipeline -- the publication decision
    still stands (the summary will not auto-publish), but the human
    reviewer surface will not see the item until the call site is
    updated to pass interview_id.
    """
    if not _dual_scoring_enabled():
        return run_tuning_loop(
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

    # Dual-scoring path. Local imports so the bare-tuning code path
    # does not eager-load the anthropic SDK / firebase-admin deps.
    from .claude_scorer import tune_with_dual_scoring

    result = tune_with_dual_scoring(
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
        rubric=getattr(ctx, "rubric", None),
        near_threshold_tolerance=near_threshold_tolerance,
        min_improvement=min_improvement,
    )

    pub = result.get("publication_decision", {}) or {}
    if pub.get("human_review_required"):
        if not interview_id:
            print(
                "[dual-scoring] Publication blocked but interview_id was not "
                "passed to run_tuning_loop_or_dual; review-queue enqueue "
                "skipped. Decision still stands: summary will not auto-publish. "
                f"Rationale: {pub.get('rationale', '')}"
            )
        else:
            try:
                from .review_queue import enqueue_for_review

                doc_id = enqueue_for_review(
                    interview_id=interview_id,
                    content_type=content_type,
                    summary=result["summary"],
                    transcript_excerpt=transcript,
                    openai_scores=result.get("openai_scores", {}) or {},
                    claude_scores=result.get("claude_scores", {}) or {},
                    publication_decision=pub,
                    chapter_number=chapter_number,
                    pipeline_run_id=pipeline_run_id,
                )
                if doc_id:
                    print(
                        f"[dual-scoring] Enqueued for human review: "
                        f"review_queue/{doc_id} (interview_id={interview_id}, "
                        f"decision_path={pub.get('decision_path')})"
                    )
                else:
                    print(
                        "[dual-scoring] enqueue_for_review returned None "
                        "(firebase-admin not installed or "
                        "FIREBASE_SERVICE_ACCOUNT_PATH not set). Decision "
                        "still stands; summary will not auto-publish."
                    )
            except Exception as e:
                print(
                    f"[dual-scoring] Review-queue enqueue failed: {e}. "
                    "Decision still stands; summary will not auto-publish."
                )

    return result
