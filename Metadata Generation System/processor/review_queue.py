"""
Producer module for the Smithsonian-grade human-review queue.

Summaries flagged as not-publishable by the dual-scoring publication
decision land in a Firestore collection where a reviewer (Eric, Dustin,
Jack, or another team member) examines the scorers' output, edits the
summary inline if needed, and either approves it for publication or
rejects it.

This module is the producer side: it provides enqueue_for_review() which
tune_with_dual_scoring (or any future orchestrator) calls when the
combined publication decision flags a summary as not-publishable. The
consumer side (the reviewer's UI) lives in src/pages/ReviewQueue.jsx and
queries the same Firestore collection through the React app's Firebase
client.

Schema is deliberately rich: both scorers' full output is preserved (not
just pass/fail) so the reviewer can see specifically what Claude flagged
as unsupported_claims with severity tags. The severity field is the most
actionable signal: a "hallucination" requires a different fix than an
"overreach" or an "uncertain" -- the reviewer can scan the severity tags
to triage which items need the most attention.
"""

import os
from typing import Dict, Any, Optional, List

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    firebase_admin = None
    credentials = None
    firestore = None


COLLECTION_NAME = "review_queue"

# Status values for queue documents. Reviewer transitions a document from
# "pending" to one of the three terminal states. A "needs_revision" item
# can be re-enqueued as "pending" by the pipeline after a regeneration
# pass that addresses the reviewer's notes.
STATUS_PENDING = "pending"
STATUS_APPROVED = "approved"
STATUS_REJECTED = "rejected"
STATUS_NEEDS_REVISION = "needs_revision"

_VALID_TERMINAL_STATUSES = (STATUS_APPROVED, STATUS_REJECTED, STATUS_NEEDS_REVISION)


_db_singleton = None

# Use a named firebase-admin app instead of the default app, so this
# module's Firestore client is isolated from any other module in the
# same process that might initialize firebase-admin against a different
# Firebase project. Without a named app, two modules calling
# initialize_app() would either silently share the same default app
# (potentially pointed at the wrong project) or raise "already exists"
# on the second call -- both failure modes that the named-app pattern
# eliminates.
_APP_NAME = "review_queue_app"


def _get_db():
    """Lazy-initialize the firebase-admin Firestore client.

    Returns None if firebase-admin is not installed or the service
    account credentials are not configured. Callers should check for
    None and degrade gracefully (typically by logging and continuing
    without enqueueing). A failed enqueue is an operational failure that
    should NOT block the upstream publication decision, because the
    decision itself is correct -- the enqueue is just the side effect of
    routing the not-publishable summary into a review surface.
    """
    global _db_singleton
    if _db_singleton is not None:
        return _db_singleton

    if firebase_admin is None:
        return None

    # Service account JSON path. The pipeline operator sets
    # FIREBASE_SERVICE_ACCOUNT_PATH to a generated service account key
    # JSON downloaded from Firebase Console (Project settings -> Service
    # accounts -> Generate new private key).
    sa_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH")
    if not sa_path or not os.path.exists(sa_path):
        return None

    # Wrap the credentials load and the app init in a try/except so a
    # malformed JSON, an invalid service account, or any other initialize
    # failure degrades gracefully (returns None) rather than raising out
    # of every queue operation. The "promise" of this module is that the
    # publication decision is correct even when the side-effect enqueue
    # cannot land; an exception here would break that promise by
    # crashing the upstream pipeline on a configuration mistake instead
    # of just logging and continuing.
    try:
        # Initialize our named app if it does not yet exist; otherwise reuse
        # the existing named app. Using firebase_admin.get_app(_APP_NAME)
        # raises ValueError when the named app does not exist, which is the
        # signal to initialize it.
        try:
            app = firebase_admin.get_app(_APP_NAME)
        except ValueError:
            cred = credentials.Certificate(sa_path)
            app = firebase_admin.initialize_app(cred, name=_APP_NAME)
        _db_singleton = firestore.client(app)
    except Exception as exc:
        print(
            f"[review_queue] Firebase Admin init failed (FIREBASE_SERVICE_ACCOUNT_PATH={sa_path}): "
            f"{exc}. Queue operations will skip and return None until this is fixed."
        )
        _db_singleton = None
    return _db_singleton


def enqueue_for_review(
    interview_id: str,
    content_type: str,
    summary: Dict[str, Any],
    transcript_excerpt: str,
    openai_scores: Dict[str, Any],
    claude_scores: Dict[str, Any],
    publication_decision: Dict[str, Any],
    chapter_number: Optional[int] = None,
    pipeline_run_id: Optional[str] = None,
    citation_audit: Optional[Dict[str, Any]] = None,
) -> Optional[str]:
    """Add a not-yet-publishable summary to the review queue.

    Called from the dual-scoring orchestrator when combined_publication_decision
    returns publishable=False. The reviewer sees this document in the React
    admin UI at /review-queue and can edit, approve, reject, or send back
    for revision.

    Args:
        interview_id: the Firestore document ID of the parent interview
            (matches the directory name in /transcripts/raw/ or its
            normalized variant -- see src/services/collectionMapper.js for
            the existing space-vs-underscore ID tolerance).
        content_type: "main_summary" or "chapter".
        summary: the full generated summary dict (summary text, key_themes,
            historical_significance, etc.).
        transcript_excerpt: the source transcript text, truncated to a
            reviewer-friendly length. The reviewer needs to see the source
            material side-by-side with the summary to evaluate the
            scorers' flags. Capped at 6000 chars here -- larger than the
            4000-char scoring window so the reviewer has surrounding
            context for any flagged passage.
        openai_scores: dict from the existing OpenAI tuning scorer
            (accuracy_score, quality_score, errors, improvements).
        claude_scores: dict from the new Claude second-opinion scorer,
            INCLUDING the unsupported_claims list with severity tags
            ("hallucination" / "overreach" / "uncertain") and the
            publishable bool with rationale.
        publication_decision: combined dual-scoring decision dict from
            combined_publication_decision (decision_path, rationale,
            human_review_required, etc.).
        chapter_number: 1-indexed chapter number if content_type=="chapter",
            else None.
        pipeline_run_id: optional run identifier for grouping multiple
            chapter items from the same pipeline pass so the reviewer
            sees related items together in the UI.

    Returns:
        The Firestore document ID of the enqueued review item, or None if
        firebase-admin is unavailable or credentials are missing. Caller
        should log the None case but should NOT block publication on it.
    """
    db = _get_db()
    if db is None:
        return None

    doc = {
        "interview_id": interview_id,
        "content_type": content_type,
        "chapter_number": chapter_number,
        "summary": summary,
        "transcript_excerpt": transcript_excerpt[:6000],
        "openai_scores": openai_scores,
        "claude_scores": claude_scores,
        "citation_audit": citation_audit,
        "publication_decision": publication_decision,
        "pipeline_run_id": pipeline_run_id,
        "status": STATUS_PENDING,
        "created_at": firestore.SERVER_TIMESTAMP,
        "reviewed_at": None,
        "reviewer_email": None,
        "reviewer_notes": None,
        "final_summary": None,
    }

    _, ref = db.collection(COLLECTION_NAME).add(doc)
    return ref.id


def list_pending(limit: int = 50) -> List[Dict[str, Any]]:
    """Return up to `limit` pending review items, oldest first.

    Used by the React admin UI's queue listing endpoint and by any CLI
    tools the team builds for batch review. Returns an empty list when
    no items are pending or when Firestore is unavailable.
    """
    db = _get_db()
    if db is None:
        return []

    query = (
        db.collection(COLLECTION_NAME)
        .where("status", "==", STATUS_PENDING)
        .order_by("created_at")
        .limit(limit)
    )

    items = []
    for doc in query.stream():
        item = doc.to_dict()
        item["id"] = doc.id
        items.append(item)
    return items


def mark_reviewed(
    doc_id: str,
    decision: str,
    reviewer_email: str,
    reviewer_notes: Optional[str] = None,
    final_summary: Optional[Dict[str, Any]] = None,
) -> bool:
    """Update a queue item with the reviewer's decision.

    Args:
        doc_id: Firestore document ID returned by enqueue_for_review.
        decision: one of STATUS_APPROVED, STATUS_REJECTED, STATUS_NEEDS_REVISION.
        reviewer_email: identifies the reviewer in the audit trail.
        reviewer_notes: optional human-readable explanation of the decision.
        final_summary: the reviewer's edited version of the summary. Only
            relevant for STATUS_APPROVED with edits. None when accepting
            the original or when rejecting.

    Returns:
        True on successful write, False if Firestore is unavailable.

    Raises:
        ValueError: if decision is not one of the three valid terminal
            statuses.
    """
    if decision not in _VALID_TERMINAL_STATUSES:
        raise ValueError(
            f"Invalid decision: {decision!r}. Must be one of "
            f"{_VALID_TERMINAL_STATUSES}."
        )

    db = _get_db()
    if db is None:
        return False

    update = {
        "status": decision,
        "reviewed_at": firestore.SERVER_TIMESTAMP,
        "reviewer_email": reviewer_email,
        "reviewer_notes": reviewer_notes,
    }
    if final_summary is not None:
        update["final_summary"] = final_summary

    db.collection(COLLECTION_NAME).document(doc_id).update(update)
    return True


def queue_stats() -> Dict[str, int]:
    """Return per-status counts of all items in the review queue.

    Useful for the admin UI to show "N pending, M approved, K rejected"
    summary headers without paginating through every document.
    """
    db = _get_db()
    if db is None:
        return {}

    stats: Dict[str, int] = {}
    for status in (STATUS_PENDING, STATUS_APPROVED, STATUS_REJECTED, STATUS_NEEDS_REVISION):
        q = db.collection(COLLECTION_NAME).where("status", "==", status)
        stats[status] = sum(1 for _ in q.stream())
    return stats
