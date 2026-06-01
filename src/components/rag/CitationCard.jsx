/**
 * @fileoverview CitationCard, shared building block for RAG result UIs.
 *
 * Renders one citation-grade payload (the shape emitted by both the
 * Netlify /retrieve function and the MCP server) as a self-contained
 * card with the interviewee, the quoted passage, the timestamp range,
 * the Library of Congress provenance label, the fidelity transparency
 * note, and the pre-formatted Chicago citation.
 *
 * The same component is consumed by SemanticSearch, QuoteFinder, and
 * RelatedPassages. Keep the visual styling consistent across surfaces.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlertTriangle, Copy, Check, Info } from 'lucide-react';
import { TIER_BADGE } from './tiers';
import { useCapsule } from './useCapsules';
import HearInContext, { tsToSeconds } from '../HearInContext';

/**
 * CitationCard, primary-source result card.
 *
 * @component
 * @param {Object} props
 * @param {CitationPayload} props.payload - One result from /retrieve or MCP.
 * @param {boolean} [props.showFullText=false] - Whether to render the full
 *   passage text (true) or only the textPreview (false).
 * @param {boolean} [props.showCitation=true] - Whether to render the
 *   pre-formatted Chicago citation block.
 * @param {string} [props.className] - Additional CSS classes.
 * @returns {React.ReactElement}
 */
export default function CitationCard({
  payload,
  showFullText = false,
  showCitation = true,
  className = '',
}) {
  // Hooks must run unconditionally before any early return (Rules of
  // Hooks). payload can be null on the first render; useCapsule treats a
  // null entry_number as "no capsule" and returns null, so hoisting the
  // call above the guard is behavior-preserving.
  const capsule = useCapsule(payload?.entryNumber);

  if (!payload) return null;

  const {
    entryNumber,
    entrySubject,
    text,
    textPreview,
    locItemUrl,
    timestampStartStr,
    timestampEndStr,
    uncertaintyTier,
    fidelityNote,
    suggestedCitation,
    similarity,
  } = payload;

  const displayText = showFullText ? text : textPreview;

  // Pick the per-tier badge styling. Falls back to a generic look if
  // the manifest tier is missing or unfamiliar.
  const tierKey = uncertaintyTier in TIER_BADGE ? uncertaintyTier : null;
  const badge = tierKey
    ? TIER_BADGE[tierKey]
    : { label: 'Provenance unknown', bg: 'bg-stone-50', text: 'text-stone-700', border: 'border-stone-200', icon: AlertTriangle };
  const BadgeIcon = badge.icon;

  // Bounded-clip parameters. The retrieval payload carries both ends of the
  // matched cue, so the clip plays exactly the passage; if only a start is
  // present we fall back to a short window.
  const clipStart = timestampStartStr ? tsToSeconds(timestampStartStr) : null;
  const clipEnd = timestampEndStr
    ? tsToSeconds(timestampEndStr)
    : clipStart != null
      ? clipStart + 60
      : null;
  const canHear = entryNumber != null && clipStart != null;

  return (
    <article
      className={`rag-citation-card border border-stone-200 rounded-lg bg-white p-5 ${className}`}
    >
      <header className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-stone-900">
            {entrySubject || 'Unknown interviewee'}
          </h3>
          {entryNumber != null && (
            <p className="text-xs text-stone-500 mt-0.5">Entry #{entryNumber}</p>
          )}
          {capsule && (
            <p
              className="text-sm text-stone-600 mt-2 italic"
              style={{ fontFamily: 'Source Serif 4, serif' }}
            >
              <Info className="w-3.5 h-3.5 inline-block mr-1 text-stone-400" aria-hidden="true" />
              {capsule}
            </p>
          )}
        </div>
        {similarity != null && (
          <div className="text-xs text-stone-500 tabular-nums shrink-0">
            relevance {(similarity * 100).toFixed(0)}%
          </div>
        )}
      </header>

      <blockquote className="border-l-4 border-red-700 dark:border-red-400 pl-4 py-1 mb-4 text-stone-800 italic">
        &ldquo;{displayText}&rdquo;
      </blockquote>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-700 mb-3">
        {(timestampStartStr || timestampEndStr) && (
          <span className="inline-flex items-center gap-1">
            <Clock className="w-4 h-4" aria-hidden="true" />
            {timestampStartStr}
            {timestampEndStr && timestampEndStr !== timestampStartStr ? `–${timestampEndStr}` : ''}
          </span>
        )}
        {locItemUrl && (
          <span className="inline-flex items-center gap-1 text-stone-600">
            Library of Congress
          </span>
        )}
        {canHear && (
          <HearInContext
            entryNumber={entryNumber}
            startSeconds={clipStart}
            endSeconds={clipEnd}
            fullInterviewHref={`/interview/${entryNumber}?t=${clipStart}`}
          />
        )}
      </div>

      <div className={`flex items-start gap-2 text-sm ${badge.bg} ${badge.text} border ${badge.border} rounded-md px-3 py-2 mb-3`}>
        <BadgeIcon className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <div className="font-medium text-xs uppercase tracking-wide mb-0.5">{badge.label}</div>
          <div className="text-xs leading-snug">{fidelityNote || 'Provenance unknown.'}</div>
          {/* The audit badge is the Machine Audit indicator (Dustin,
              2026-05-30): clicking through opens the explainer page. */}
          <Link
            to="/machine-audit"
            className="inline-block text-xs font-medium underline mt-1 hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
          >
            How was this generated?
          </Link>
        </div>
      </div>

      {showCitation && suggestedCitation && (
        <details className="text-sm text-stone-600 border-t border-stone-100 pt-3">
          <summary className="cursor-pointer font-medium text-stone-700 hover:text-stone-900">
            Citation (Chicago)
          </summary>
          <div className="mt-2 flex items-start gap-3">
            <p className="font-mono text-xs leading-relaxed flex-1 break-words">{suggestedCitation}</p>
            <CopyButton text={suggestedCitation} />
          </div>
        </details>
      )}
    </article>
  );
}

// Small inline button, copies suggestedCitation to clipboard and
// flashes a checkmark for ~1.5s. Researchers paste this into their
// drafts; saves them from manually copying out of the <p>.
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('[CitationCard] clipboard write failed:', e);
    }
  };
  const Icon = copied ? Check : Copy;
  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded transition-colors shrink-0"
      aria-label={copied ? 'Copied' : 'Copy citation to clipboard'}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
