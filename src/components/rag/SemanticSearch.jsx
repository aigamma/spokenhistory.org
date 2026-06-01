/**
 * @fileoverview SemanticSearch, live semantic-search UI over the
 * civil-rights corpus via the Netlify /retrieve function.
 *
 * No LLM call at runtime, just retrieval + display. The cheapest and
 * most-useful interactive RAG surface: every result is a quoted
 * primary source with citation metadata, not a paraphrased "AI answer."
 *
 * Renders a search input + ranked CitationCard list. Supports an
 * optional entry_number filter for "search within one interviewee."
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Loader2, X } from 'lucide-react';
import { retrieve } from '../../services/ragClient';
import CitationCard from './CitationCard';
import { TIER_VOCABULARY, SETTLED_STATES } from './tiers';

/**
 * SemanticSearch, live semantic-search input + result list.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.placeholder] - Search-input placeholder text.
 * @param {number} [props.topN=8] - Number of results to render.
 * @param {number} [props.entryNumber] - Optional filter to one interviewee.
 * @param {boolean} [props.showFullText=false] - Pass-through to CitationCard.
 * @param {(payload: CitationPayload) => void} [props.onSelect] - Callback
 *   when a card is clicked. If absent, cards link via their LoC URL.
 * @param {string} [props.className]
 * @returns {React.ReactElement}
 */
// Curated query suggestions shown under the search box so first-time
// visitors discover what the system can do. Mix of open questions,
// specific events, and a paraphrased-quote case.
const SUGGESTED_QUERIES = [
  'nonviolence as theology vs. tactic',
  '16th Street Baptist Church bombing',
  'the dreamer can be killed but not the dream',
  'Freedom Summer in Mississippi',
  'Black Power and SNCC',
];

// onSelect was a click-handler hook on each result; it wrapped the
// CitationCard in a <button>, which made the LoC <a> inside the card
// a nested-interactive (invalid HTML, broken for keyboard nav). Removed
// because the card's LoC link is the meaningful action and no caller
// of this component actually used onSelect. If a future use case
// needs in-app routing to an interview detail page, add a dedicated
// secondary action inside the CitationCard rather than wrapping the
// whole card in a button.
export default function SemanticSearch({
  placeholder = 'Search the oral history archive…',
  topN = 8,
  entryNumber = null,
  showFullText = false,
  className = '',
}) {
  // The app uses HashRouter, so query params live INSIDE the router
  // path (URL like /#/rag-explore?q=foo). useSearchParams() reads
  // those params correctly, window.location.search would be empty.
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') || '');

  const writeQueryToUrl = (q) => {
    const next = new URLSearchParams(searchParams);
    if (q) next.set('q', q);
    else next.delete('q');
    setSearchParams(next, { replace: true });
  };

  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // When true, results are deduplicated by interviewee so users see
  // the polyphonic record (one passage per voice). Default off so the
  // same-speaker-different-moment results aren't hidden by default.
  const [dedupeByEntry, setDedupeByEntry] = useState(false);
  // Audit-tier filter, research-grade users want to dial down to
  // only the higher-confidence passages. Default: all tiers visible.
  // Filter happens client-side over the returned topN; we don't
  // re-issue the query when filters change.
  const [allowedTiers, setAllowedTiers] = useState(new Set(TIER_VOCABULARY));
  const abortRef = useRef(null);
  const hasAutoRunRef = useRef(false);

  // Cancel any in-flight request on unmount.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Auto-run the query from ?q= on first mount so a deep-link
  // (/rag-explore?q=foo#search) renders results without a manual submit.
  // Only fires once per mount; subsequent state changes don't re-trigger.
  useEffect(() => {
    if (hasAutoRunRef.current) return;
    if (query && query.trim()) {
      hasAutoRunRef.current = true;
      runQuery(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runQuery = async (rawQuery) => {
    const trimmed = (rawQuery || '').trim();
    if (!trimmed) return;
    writeQueryToUrl(trimmed);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    try {
      const opts = { topN, signal: ctrl.signal, dedupeByEntry };
      if (entryNumber != null) opts.filter = { entry_number: { $eq: entryNumber } };
      const { results: payloads, meta: respMeta } = await retrieve(trimmed, opts);
      setResults(payloads || []);
      setMeta(respMeta || null);
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.error('[SemanticSearch] retrieve failed:', e);
      setError(e?.detail?.message || e?.message || 'Search failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    runQuery(query);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    runQuery(suggestion);
  };

  return (
    <section className={`rag-semantic-search ${className}`}>
      <form onSubmit={handleSubmit} className="relative mb-6">
        <SearchIcon
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-40 py-4 text-base border border-stone-300 rounded-lg focus:border-red-700 dark:focus:border-red-400 focus:ring-2 focus:ring-red-700/30 dark:focus:ring-red-400/30 outline-none transition-colors bg-white dark:placeholder-zinc-500"
          aria-label="Search query"
          maxLength={4000}
        />
        {query && !isLoading && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setMeta(null);
              setError(null);
              writeQueryToUrl('');
            }}
            className="absolute right-28 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-700 rounded transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-civil-red-strong text-white rounded-md font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Searching
            </span>
          ) : (
            'Search'
          )}
        </button>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 flex-1 min-w-0">
          <span className="text-stone-500">Try:</span>
          {SUGGESTED_QUERIES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSuggestionClick(s)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full border border-stone-300 bg-white hover:bg-stone-50 hover:border-stone-400 transition-colors disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-stone-600 cursor-pointer select-none whitespace-nowrap">
          <input
            type="checkbox"
            checked={dedupeByEntry}
            onChange={(e) => setDedupeByEntry(e.target.checked)}
            className="rounded border-stone-400 dark:border-zinc-600 text-red-700 dark:text-red-400 focus:ring-red-700/30 dark:focus:ring-red-400/30"
          />
          <span>One passage per interviewee</span>
        </label>
      </div>

      {/* Audit-tier filter row. Click to toggle which tiers are
          visible; results from un-checked tiers fade out client-side
          (the query still pulls the full topN; this is presentation).
          For researchers who want only Library-of-Congress-verified
          passages, unchecking Audio-Limited Source leaves the
          LoC-Verified majority only. */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-stone-500">Audit state:</span>
        {SETTLED_STATES.map((state) => {
          const active = state.tiers.every((t) => allowedTiers.has(t));
          return (
            <label
              key={state.label}
              className={
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-full border cursor-pointer transition-opacity ' +
                (active ? 'border-stone-700 bg-white' : 'border-stone-200 bg-stone-50 opacity-50')
              }
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => {
                  const next = new Set(allowedTiers);
                  if (active) state.tiers.forEach((t) => next.delete(t));
                  else state.tiers.forEach((t) => next.add(t));
                  setAllowedTiers(next);
                }}
                className="sr-only"
              />
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: state.color }} aria-hidden="true" />
              <span>{state.label}</span>
            </label>
          );
        })}
        {allowedTiers.size < TIER_VOCABULARY.length && (
          <button
            type="button"
            onClick={() => setAllowedTiers(new Set(TIER_VOCABULARY))}
            className="text-xs text-stone-500 hover:text-stone-900 underline ml-1"
          >
            show all
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm">
          {error}
        </div>
      )}

      {meta?.rerankEnabled === false && results.length > 0 && (
        <div className="mb-4 text-xs text-stone-500">
          Reranker disabled, showing first-stage Pinecone matches.
        </div>
      )}

      {(() => {
        // Filter results by allowed tiers. If all tiers are checked
        // (the default), no filter applies, show all results.
        const filtered = allowedTiers.size === TIER_VOCABULARY.length
          ? results
          : results.filter((p) => allowedTiers.has(p.uncertaintyTier));
        const hiddenCount = results.length - filtered.length;
        return (
          <>
            {hiddenCount > 0 && (
              <div className="mb-3 text-xs text-stone-500">
                {hiddenCount} {hiddenCount === 1 ? 'result' : 'results'} hidden by tier filter
              </div>
            )}
            <ol className="space-y-4">
              {filtered.map((payload) => (
                <li key={payload.id}>
                  <CitationCard payload={payload} showFullText={showFullText} />
                </li>
              ))}
            </ol>
            {!isLoading && !error && results.length === 0 && query.trim() && (
              <p className="text-stone-500 text-sm">
                No matches in the archive for that query.{' '}
                {entryNumber != null
                  ? 'Try removing the entry filter, or '
                  : 'Try '}
                rephrasing, or click one of the suggested-query chips above.
              </p>
            )}
            {!isLoading && !error && results.length > 0 && filtered.length === 0 && (
              <p className="text-stone-500 text-sm">
                All {results.length} results are in tiers you&apos;ve hidden.{' '}
                <button
                  type="button"
                  className="underline hover:text-stone-900"
                  onClick={() => setAllowedTiers(new Set(TIER_VOCABULARY))}
                >
                  Show all tiers
                </button>
                {' '}to see them.
              </p>
            )}
          </>
        );
      })()}
    </section>
  );
}
