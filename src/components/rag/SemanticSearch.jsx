/**
 * @fileoverview SemanticSearch — live semantic-search UI over the
 * civil-rights corpus via the Netlify /retrieve function.
 *
 * No LLM call at runtime — just retrieval + display. The cheapest and
 * most-useful interactive RAG surface: every result is a quoted
 * primary source with citation metadata, not a paraphrased "AI answer."
 *
 * Renders a search input + ranked CitationCard list. Supports an
 * optional entry_number filter for "search within one interviewee."
 */

import { useEffect, useRef, useState } from 'react';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import { retrieve } from '../../services/ragClient';
import CitationCard from './CitationCard';

/**
 * SemanticSearch — live semantic-search input + result list.
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
export default function SemanticSearch({
  placeholder = 'Search the oral history archive…',
  topN = 8,
  entryNumber = null,
  showFullText = false,
  onSelect = null,
  className = '',
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  // Cancel any in-flight request on unmount.
  useEffect(() => () => abortRef.current?.abort(), []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    try {
      const opts = { topN, signal: ctrl.signal };
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
          className="w-full pl-12 pr-32 py-4 text-base border border-stone-300 rounded-lg focus:border-red-700 focus:ring-2 focus:ring-red-700/30 outline-none transition-colors bg-white"
          aria-label="Search query"
          maxLength={4000}
        />
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

      {error && (
        <div className="mb-4 p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          {error}
        </div>
      )}

      {meta?.rerankEnabled === false && results.length > 0 && (
        <div className="mb-4 text-xs text-stone-500">
          Reranker disabled — showing first-stage Pinecone matches.
        </div>
      )}

      <ol className="space-y-4">
        {results.map((payload) => (
          <li key={payload.id}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(payload)}
                className="block w-full text-left hover:opacity-90 transition-opacity"
              >
                <CitationCard payload={payload} showFullText={showFullText} />
              </button>
            ) : (
              <CitationCard payload={payload} showFullText={showFullText} />
            )}
          </li>
        ))}
      </ol>

      {!isLoading && !error && results.length === 0 && query.trim() && (
        <p className="text-stone-500 text-sm">No matches. Try a different query.</p>
      )}
    </section>
  );
}
