/**
 * Firebase client wrapper for the Smithsonian-grade human-review queue.
 *
 * Companion to Metadata Generation System/processor/review_queue.py.
 * The Python module is the producer side (the dual-scoring pipeline routes
 * not-publishable summaries into the queue); this is the consumer side
 * (the reviewer's React UI reads and updates queue items).
 *
 * The collection name 'review_queue' is the shared contract between the
 * two sides. The document schema lives in the Python module's docstring.
 */

import { db } from './firebase'
import {
  collection,
  query,
  where,
  orderBy,
  limit as fbLimit,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'

const COLLECTION = 'review_queue'

export const STATUS_PENDING = 'pending'
export const STATUS_APPROVED = 'approved'
export const STATUS_REJECTED = 'rejected'
export const STATUS_NEEDS_REVISION = 'needs_revision'

const TERMINAL_STATUSES = [STATUS_APPROVED, STATUS_REJECTED, STATUS_NEEDS_REVISION]

/**
 * Return up to `maxItems` pending review items, oldest first.
 */
export async function listPendingReviewItems(maxItems = 50) {
  const q = query(
    collection(db, COLLECTION),
    where('status', '==', STATUS_PENDING),
    orderBy('created_at'),
    fbLimit(maxItems),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Return per-status counts for the queue. Used by the admin UI header.
 */
export async function getQueueStats() {
  const statuses = [STATUS_PENDING, STATUS_APPROVED, STATUS_REJECTED, STATUS_NEEDS_REVISION]
  const stats = {}
  for (const status of statuses) {
    const q = query(collection(db, COLLECTION), where('status', '==', status))
    const snapshot = await getDocs(q)
    stats[status] = snapshot.size
  }
  return stats
}

/**
 * Update a queue item with the reviewer's decision.
 *
 * @param {string} docId - Firestore document ID.
 * @param {object} args
 * @param {string} args.decision - one of STATUS_APPROVED / STATUS_REJECTED / STATUS_NEEDS_REVISION.
 * @param {string} args.reviewerEmail - identifies the reviewer in the audit trail.
 * @param {string} [args.reviewerNotes] - optional human-readable explanation.
 * @param {object} [args.finalSummary] - reviewer's edited version of the summary
 *   (for STATUS_APPROVED with edits). Null when accepting the original or
 *   rejecting.
 */
export async function markReviewed(docId, { decision, reviewerEmail, reviewerNotes, finalSummary }) {
  // docId guards: empty / non-string / slash-containing IDs would either
  // crash doc() with an obscure SDK error or, in the slash case,
  // silently rebind the doc reference to a nested path (the same
  // primitive the MCP server fixed in 46e038e for getTranscript). The
  // audit trail depends on every markReviewed call landing on the
  // intended doc, so failing fast here with a clear error is much
  // better than writing into an unintended sub-collection document.
  if (typeof docId !== 'string' || docId.trim().length === 0) {
    throw new Error('docId must be a non-empty string')
  }
  if (docId.includes('/')) {
    throw new Error('docId must not contain forward slashes (would rebind to a nested path)')
  }
  if (!TERMINAL_STATUSES.includes(decision)) {
    throw new Error(`Invalid decision: ${decision}. Must be one of ${TERMINAL_STATUSES.join(', ')}`)
  }
  // reviewerEmail must be a non-empty string. The audit trail is the
  // primary product of the review queue -- a queue document with
  // reviewer_email = null is unattributable and defeats the purpose of
  // the gate. Requiring the email here means a caller that forgets to
  // pass the field gets a clear error rather than silently writing an
  // unattributable decision.
  if (typeof reviewerEmail !== 'string' || reviewerEmail.trim().length === 0) {
    throw new Error('reviewerEmail must be a non-empty string')
  }
  const update = {
    status: decision,
    reviewed_at: serverTimestamp(),
    reviewer_email: reviewerEmail.trim(),
    reviewer_notes: reviewerNotes || null,
  }
  if (finalSummary !== undefined && finalSummary !== null) {
    update.final_summary = finalSummary
  }
  await updateDoc(doc(db, COLLECTION, docId), update)
}
