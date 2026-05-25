/**
 * @fileoverview CitationCard — shared building block for RAG result UIs.
 *
 * Renders one citation-grade payload (the shape emitted by both the
 * Netlify /retrieve function and the MCP server) as a self-contained
 * card with the interviewee, the quoted passage, the timestamp range,
 * the LoC catalog link, the fidelity transparency note, and the
 * pre-formatted Chicago citation.
 *
 * The same component is consumed by SemanticSearch, QuoteFinder, and
 * RelatedPassages. Keep the visual styling consistent across surfaces.
 */

import { ExternalLink, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';

/**
 * CitationCard — primary-source result card.
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
  if (!payload) return null;

  const {
    entryNumber,
    entrySubject,
    text,
    textPreview,
    locItemUrl,
    timestampStartStr,
    timestampEndStr,
    entryProvenance,
    uncertaintyTier,
    fidelityNote,
    suggestedCitation,
    similarity,
  } = payload;

  const displayText = showFullText ? text : textPreview;

  // Provenance badge styling: high-confidence is the default; flag
  // ingestion-only or medium+ uncertainty so researchers see it.
  const isHighConfidence =
    entryProvenance === 'audit-original' && (uncertaintyTier === 'low' || uncertaintyTier == null);
  const ProvenanceIcon = isHighConfidence ? ShieldCheck : AlertTriangle;
  const provenanceColor = isHighConfidence ? 'text-emerald-700' : 'text-amber-700';

  return (
    <article
      className={`rag-citation-card border border-stone-200 rounded-lg bg-white p-5 ${className}`}
    >
      <header className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-lg font-medium text-stone-900">
            {entrySubject || 'Unknown interviewee'}
          </h3>
          {entryNumber != null && (
            <p className="text-xs text-stone-500 mt-0.5">Entry #{entryNumber}</p>
          )}
        </div>
        {similarity != null && (
          <div className="text-xs text-stone-500 tabular-nums">
            relevance {(similarity * 100).toFixed(0)}%
          </div>
        )}
      </header>

      <blockquote className="border-l-4 border-red-700 pl-4 py-1 mb-4 text-stone-800 italic">
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
          <a
            href={locItemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-civil-red-body hover:underline"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            Library of Congress catalog
          </a>
        )}
      </div>

      <div className={`flex items-start gap-2 text-sm ${provenanceColor} mb-3`}>
        <ProvenanceIcon className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <span>{fidelityNote || 'Provenance unknown.'}</span>
      </div>

      {showCitation && suggestedCitation && (
        <details className="text-sm text-stone-600 border-t border-stone-100 pt-3">
          <summary className="cursor-pointer font-medium text-stone-700 hover:text-stone-900">
            Citation (Chicago)
          </summary>
          <p className="mt-2 font-mono text-xs leading-relaxed">{suggestedCitation}</p>
        </details>
      )}
    </article>
  );
}
