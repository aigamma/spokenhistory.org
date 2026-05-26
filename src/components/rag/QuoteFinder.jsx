/**
 * @fileoverview QuoteFinder — variant of SemanticSearch tuned for the
 * "find the source of this half-remembered quote" use case.
 *
 * Differences from SemanticSearch:
 *   - Larger textarea input (multi-line quotes are common).
 *   - Always shows full text, not just preview (researchers want to
 *     confirm the entire passage matches what they remember).
 *   - Visual framing emphasizes "verify your quote" rather than
 *     "search the archive."
 *   - Returns a smaller default topN (5) — finding THE quote is the
 *     point, not browsing related passages.
 */

import { useEffect, useRef, useState } from 'react';
import { Quote, Loader2 } from 'lucide-react';
import { retrieve } from '../../services/ragClient';
import CitationCard from './CitationCard';

// Sample paraphrases for the QuoteFinder demo. Each one is a real
// civil-rights-era quote (or its canonical paraphrase) that the
// archive can attribute via semantic match.
const SAMPLE_QUOTES = [
  'the dreamer can be killed but not the dream',
  'nonviolence is the weapon of the strong',
  'you may be able to kill the dreamer but you cannot kill the dream',
];

/**
 * QuoteFinder — find primary-source attribution for a half-remembered quote.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.placeholder]
 * @param {number} [props.topN=5]
 * @param {string} [props.className]
 * @returns {React.ReactElement}
 */
export default function QuoteFinder({
  placeholder = 'Paste the quote you want to verify or attribute…',
  topN = 5,
  className = '',
}) {
  const [quote, setQuote] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const runSearch = async (rawQuote) => {
    const trimmed = (rawQuote || '').trim();
    if (!trimmed) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const { results: payloads } = await retrieve(trimmed, { topN, signal: ctrl.signal });
      setResults(payloads || []);
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.error('[QuoteFinder] retrieve failed:', e);
      setError(e?.detail?.message || e?.message || 'Search failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    runSearch(quote);
  };

  const handleSampleClick = (sample) => {
    setQuote(sample);
    runSearch(sample);
  };

  return (
    <section className={`rag-quote-finder ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <Quote className="w-6 h-6 text-red-700 flex-shrink-0 mt-1" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-medium text-stone-900">Find the source of a quote</h2>
          <p className="text-sm text-stone-600 mt-1">
            Paste a quote (or your best recollection of one). The archive returns the closest matching
            passages, each with the interviewee, exact timestamp, and Library of Congress catalog link.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder={placeholder}
          rows={4}
          maxLength={4000}
          className="w-full px-4 py-3 text-base border border-stone-300 rounded-lg focus:border-red-700 focus:ring-2 focus:ring-red-700/30 outline-none transition-colors bg-white resize-y"
          aria-label="Quote to find"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-stone-500">{quote.length} / 4000</span>
          <button
            type="submit"
            disabled={isLoading || !quote.trim()}
            className="px-6 py-2 bg-civil-red-strong text-white rounded-md font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Searching
              </span>
            ) : (
              'Find source'
            )}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-600">
          <span className="text-stone-500">Sample quotes:</span>
          {SAMPLE_QUOTES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSampleClick(s)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full border border-stone-300 bg-white hover:bg-stone-50 hover:border-stone-400 transition-colors disabled:opacity-40 text-left italic"
            >
              &ldquo;{s}&rdquo;
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="mb-4 p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          {error}
        </div>
      )}

      <ol className="space-y-4">
        {results.map((payload) => (
          <li key={payload.id}>
            <CitationCard payload={payload} showFullText={true} />
          </li>
        ))}
      </ol>

      {!isLoading && !error && hasSearched && results.length === 0 && (
        <p className="text-stone-500 text-sm">
          No close matches in the corpus. If the quote is from a civil rights figure not in this
          archive (or is paraphrased rather than directly transcribed), it may not be findable here.
        </p>
      )}
    </section>
  );
}
