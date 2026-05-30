/**
 * @fileoverview ReviewQueue page for triaging summaries that failed the
 * Smithsonian-grade dual-scoring publication gate.
 *
 * Summaries that the OpenAI tuning loop generated but that Claude Opus
 * (the second-opinion scorer) flagged for unsupported_claims, or that
 * one scorer passed and the other blocked, land in the Firestore
 * 'review_queue' collection. This page is where a reviewer (Eric,
 * Dustin, Jack, or another team member) examines each flagged item and
 * either approves it for publication, rejects it, or sends it back for
 * regeneration with notes.
 *
 * Companion to:
 *   - Metadata Generation System/processor/review_queue.py (producer)
 *   - src/services/reviewQueue.js (Firebase wrapper)
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import {
  listPendingReviewItems,
  getQueueStats,
  markReviewed,
  STATUS_APPROVED,
  STATUS_REJECTED,
  STATUS_NEEDS_REVISION,
} from '../services/reviewQueue'

const SEVERITY_COLOR = {
  hallucination: '#F2483C',
  overreach: '#E89B2A',
  uncertain: '#7A7A7A',
}

const DECISION_PATH_LABEL = {
  both_pass: 'Both scorers passed (queued anyway)',
  claude_blocked: 'Claude blocked publication',
  openai_blocked: 'OpenAI blocked publication',
  both_blocked: 'Both scorers blocked publication',
}

export default function ReviewQueue() {
  useDocumentTitle('Review Queue')
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [editedSummary, setEditedSummary] = useState('')
  const [reviewerNotes, setReviewerNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [pendingItems, queueStats] = await Promise.all([
        listPendingReviewItems(),
        getQueueStats(),
      ])
      setItems(pendingItems)
      setStats(queueStats)
    } catch (e) {
      console.error('Failed to load review queue', e)
      setError('Failed to load review queue. ' + (e.message || ''))
    } finally {
      setLoading(false)
    }
  }

  const selected = items.find((it) => it.id === selectedId)

  function handleSelectItem(id) {
    setSelectedId(id)
    const item = items.find((it) => it.id === id)
    setEditedSummary(item?.summary?.summary || '')
    setReviewerNotes('')
  }

  function handleBack() {
    setSelectedId(null)
    setEditedSummary('')
    setReviewerNotes('')
  }

  async function handleAction(decision) {
    if (!selected || !user) return
    setActionError(null)
    // Guard against a signed-in user without an email address on record.
    // markReviewed in src/services/reviewQueue.js requires a non-empty
    // reviewerEmail (audit-trail integrity), so a user authenticated via
    // a flow that does not surface an email (anonymous auth, certain
    // OAuth providers that decline to share email, a Firebase Auth
    // account that was created with a phone number only) would otherwise
    // hit the service-side validation as an opaque "reviewerEmail must
    // be a non-empty string" message. Catching it here gives the
    // reviewer an actionable next step instead.
    if (!user.email || user.email.trim().length === 0) {
      setActionError(
        'You must be signed in with an email address to mark a review item. Sign out and sign back in with an account that has an email on file.',
      )
      return
    }
    setSubmitting(true)
    try {
      const summaryWasEdited =
        editedSummary && editedSummary !== (selected.summary?.summary || '')
      const finalSummary =
        decision === STATUS_APPROVED && summaryWasEdited
          ? { ...selected.summary, summary: editedSummary }
          : null
      await markReviewed(selected.id, {
        decision,
        reviewerEmail: user.email,
        reviewerNotes,
        finalSummary,
      })
      handleBack()
      await loadData()
    } catch (e) {
      console.error('Failed to update review item', e)
      setActionError('Failed to save: ' + (e.message || 'unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex justify-center items-center bg-[#EBEAE9] dark:bg-zinc-900"
        role="status"
        aria-live="polite"
      >
        <div
          className="w-12 h-12 border-4 border-black/20 dark:border-white/20 rounded-full animate-spin"
          style={{ borderTopColor: '#F2483C' }}
          aria-hidden="true"
        />
        <span className="sr-only">Loading review queue...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#EBEAE9] dark:bg-zinc-900">
        <div className="bg-white dark:bg-zinc-800 border border-black dark:border-zinc-700 px-6 py-4 text-black dark:text-zinc-100" style={{ fontFamily: 'Source Serif Pro, serif' }}>
          {error}
        </div>
      </div>
    )
  }

  if (selected) {
    return <DetailView
      item={selected}
      editedSummary={editedSummary}
      setEditedSummary={setEditedSummary}
      reviewerNotes={reviewerNotes}
      setReviewerNotes={setReviewerNotes}
      onBack={handleBack}
      onAction={handleAction}
      submitting={submitting}
      actionError={actionError}
    />
  }

  return <ListView items={items} stats={stats} onSelect={handleSelectItem} />
}


function ListView({ items, stats, onSelect }) {
  return (
    <div className="min-h-screen bg-[#EBEAE9] dark:bg-zinc-900">
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-[48px] pt-3 pb-6">
        <div className="mb-6 sm:mb-7 md:mb-8 lg:mb-[32px]">
          <h1 className="text-stone-900 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
            Review Queue
          </h1>
        </div>

        <div className="mb-[31px] flex flex-wrap gap-x-6 gap-y-2">
          <StatBadge label="Pending" count={stats.pending || 0} accent="#F2483C" />
          <StatBadge label="Approved" count={stats.approved || 0} />
          <StatBadge label="Rejected" count={stats.rejected || 0} />
          <StatBadge label="Needs revision" count={stats.needs_revision || 0} />
        </div>

        <div className="w-full h-px bg-black dark:bg-zinc-700 mb-8 sm:mb-10 md:mb-12 lg:mb-[48px]" />

        {items.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-stone-900 text-base font-light" style={{ fontFamily: 'Chivo Mono, monospace' }}>
              Queue is empty. No summaries currently waiting for review.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="w-full text-left bg-white dark:bg-zinc-800 border border-black dark:border-zinc-700 text-black dark:text-zinc-100 px-4 py-3 sm:px-6 sm:py-4 hover:bg-[#F2483C] hover:text-white dark:hover:bg-[#F2483C] dark:hover:text-white transition-colors group"
                style={{ fontFamily: 'Source Serif Pro, serif' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                  <span className="text-lg sm:text-xl font-bold flex-1 truncate">
                    {item.interview_id}
                  </span>
                  <span className="text-xs sm:text-sm uppercase tracking-wide" style={{ fontFamily: 'Chivo Mono, monospace' }}>
                    {item.content_type}{item.chapter_number ? ` · chapter ${item.chapter_number}` : ''}
                  </span>
                </div>
                <div className="mt-1 text-sm flex flex-wrap gap-x-4 gap-y-1" style={{ fontFamily: 'Chivo Mono, monospace' }}>
                  <span>
                    {DECISION_PATH_LABEL[item.publication_decision?.decision_path] || 'queued'}
                  </span>
                  <span>
                    GPT {item.openai_scores?.accuracy_score ?? '–'}/{item.openai_scores?.quality_score ?? '–'}
                    {' '}·{' '}
                    Claude {item.claude_scores?.accuracy_score ?? '–'}/{item.claude_scores?.quality_score ?? '–'}
                  </span>
                  <span>
                    {item.claude_scores?.unsupported_claims?.length || 0} flagged claims
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


function DetailView({ item, editedSummary, setEditedSummary, reviewerNotes, setReviewerNotes, onBack, onAction, submitting, actionError }) {
  const claims = item.claude_scores?.unsupported_claims || []

  return (
    <div className="min-h-screen bg-[#EBEAE9] dark:bg-zinc-900">
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-[48px] pt-3 pb-12">
        <button
          onClick={onBack}
          className="mb-6 text-black dark:text-zinc-100 underline hover:no-underline"
          style={{ fontFamily: 'Chivo Mono, monospace' }}
        >
          ← Back to queue
        </button>

        <div className="mb-6">
          <h1 className="text-stone-900 text-3xl sm:text-4xl md:text-5xl font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
            {item.interview_id}
          </h1>
          <div className="mt-2 text-sm dark:text-zinc-300" style={{ fontFamily: 'Chivo Mono, monospace' }}>
            <span className="uppercase">{item.content_type}</span>
            {item.chapter_number ? ` · chapter ${item.chapter_number}` : ''}
            {' · '}
            {DECISION_PATH_LABEL[item.publication_decision?.decision_path] || 'queued'}
          </div>
          {item.publication_decision?.rationale && (
            <div className="mt-3 max-w-prose text-sm text-black/80 dark:text-zinc-300" style={{ fontFamily: 'Source Serif Pro, serif' }}>
              {item.publication_decision.rationale}
            </div>
          )}
        </div>

        <div className="w-full h-px bg-black dark:bg-zinc-700 mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 mb-8">
          <section>
            <h2 className="text-xl font-bold mb-2 text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
              Summary (edit before approving if needed)
            </h2>
            <textarea
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
              className="w-full min-h-[300px] p-3 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-100 text-base leading-relaxed"
              style={{ fontFamily: 'Source Serif Pro, serif' }}
            />
            <div className="mt-3 text-xs dark:text-zinc-400" style={{ fontFamily: 'Chivo Mono, monospace' }}>
              GPT accuracy {item.openai_scores?.accuracy_score ?? '–'}/100 · quality {item.openai_scores?.quality_score ?? '–'}/100
              {' · '}
              Claude accuracy {item.claude_scores?.accuracy_score ?? '–'}/100 · quality {item.claude_scores?.quality_score ?? '–'}/100
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2 text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
              Source transcript (excerpt)
            </h2>
            <pre
              className="w-full min-h-[300px] p-3 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-100 text-sm leading-relaxed overflow-auto whitespace-pre-wrap"
              style={{ fontFamily: 'Source Serif Pro, serif' }}
            >
              {item.transcript_excerpt || '(no excerpt available)'}
            </pre>
          </section>
        </div>

        {claims.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3 text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
              Claude flagged {claims.length} claim{claims.length === 1 ? '' : 's'}
            </h2>
            <div className="flex flex-col gap-3">
              {claims.map((claim, idx) => (
                <div key={idx} className="bg-white dark:bg-zinc-800 border border-black dark:border-zinc-700 p-3 sm:p-4">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span
                      className="inline-block px-2 py-0.5 text-xs uppercase text-white"
                      style={{
                        fontFamily: 'Chivo Mono, monospace',
                        backgroundColor: SEVERITY_COLOR[claim.severity] || '#7A7A7A',
                      }}
                    >
                      {claim.severity || 'flagged'}
                    </span>
                  </div>
                  <div className="text-base mb-2 text-black dark:text-zinc-100" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                    <strong>Claim:</strong> {claim.claim}
                  </div>
                  <div className="text-sm text-black/80 dark:text-zinc-300" style={{ fontFamily: 'Source Serif Pro, serif' }}>
                    <strong>Transcript evidence:</strong> {claim.transcript_evidence || 'none found'}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2 text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
            Reviewer notes (optional)
          </h2>
          <textarea
            value={reviewerNotes}
            onChange={(e) => setReviewerNotes(e.target.value)}
            placeholder="Why you approved / rejected / sent back for revision. Recorded in the audit trail."
            className="w-full min-h-[100px] p-3 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-100 dark:placeholder-zinc-500 text-base leading-relaxed"
            style={{ fontFamily: 'Source Serif Pro, serif' }}
          />
        </section>

        {actionError && (
          <section
            id="review-queue-action-error"
            role="alert"
            aria-live="assertive"
            className="mb-4 p-4 bg-red-100 dark:bg-red-950/40 border-2 border-red-500 text-red-800 dark:text-red-300"
            style={{ fontFamily: 'Source Serif Pro, serif' }}
          >
            {actionError}
          </section>
        )}

        <section className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => onAction(STATUS_APPROVED)}
            disabled={submitting}
            aria-describedby={actionError ? 'review-queue-action-error' : undefined}
            className="px-6 py-3 min-h-11 text-white font-bold border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#2A8F4A', fontFamily: 'Inter, sans-serif' }}
          >
            Approve for publication
          </button>
          <button
            type="button"
            onClick={() => onAction(STATUS_NEEDS_REVISION)}
            disabled={submitting}
            aria-describedby={actionError ? 'review-queue-action-error' : undefined}
            className="px-6 py-3 min-h-11 text-black font-bold border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#E89B2A', fontFamily: 'Inter, sans-serif' }}
          >
            Send back for revision
          </button>
          <button
            type="button"
            onClick={() => onAction(STATUS_REJECTED)}
            disabled={submitting}
            aria-describedby={actionError ? 'review-queue-action-error' : undefined}
            className="px-6 py-3 min-h-11 text-white font-bold border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#F2483C', fontFamily: 'Inter, sans-serif' }}
          >
            Reject
          </button>
        </section>
      </div>
    </div>
  )
}


function StatBadge({ label, count, accent }) {
  // When no accent color is supplied the count uses the default body-text
  // color via the text-stone-900 utility, which the global dark-mode
  // foundation flips to a light tone. An explicit accent (the brand red on
  // the Pending badge) is the same in both modes, so it stays inline.
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={`text-3xl font-bold ${accent ? '' : 'text-stone-900'}`}
        style={{ ...(accent ? { color: accent } : {}), fontFamily: 'Inter, sans-serif' }}
      >
        {count}
      </span>
      <span
        className="text-xs uppercase tracking-wide text-stone-900"
        style={{ fontFamily: 'Chivo Mono, monospace' }}
      >
        {label}
      </span>
    </div>
  )
}
