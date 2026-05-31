/**
 * @fileoverview ComparePerspectives, a variant of QuoteFinder tuned for the
 * "how did different people in the archive talk about the same subject" use
 * case.
 *
 * Differences from QuoteFinder:
 *   - The retrieval is issued with dedupeByEntry: true, so every result is a
 *     DIFFERENT interviewee (at most one passage per person). That is what
 *     turns a ranked passage list into a genuine multi-perspective spread:
 *     a local Mississippi organizer's voice can sit next to a national
 *     figure's, both on the one subject the visitor typed.
 *   - A larger default topN (10), the point is breadth of voices, not a
 *     single best match.
 *   - The input is framed as a topic / theme / event ("Emmett Till",
 *     "Nonviolence as strategy", "Voter registration") rather than a quote
 *     to verify.
 *   - The framing line above the results explains that these are distinct
 *     interviewees speaking about the same subject, so the reader knows to
 *     compare across them.
 *
 * Reuses CitationCard unchanged (one card per voice, full text shown) and
 * the same audit-tier filter affordance as QuoteFinder and SemanticSearch,
 * so the surface is visually consistent with the rest of the page.
 */

import { useEffect, useRef, useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { retrieve } from '../../services/ragClient';
import CitationCard from './CitationCard';
import { TIER_VOCABULARY, TIER_COLORS } from './tiers';

// Example topics for the ComparePerspectives demo. Each is chosen to return
// a diverse spread of interviewees (a recurring subject across the archive
// that local participants and national figures both spoke to), so the
// deduped result reads as several distinct people on one shared subject.
const SAMPLE_TOPICS = [
  'Emmett Till',
  'Nonviolence as strategy',
  'Voter registration',
  'Freedom Summer',
  'What the movement cost them',
];

/**
 * ComparePerspectives, multiple interviewees side by side on one subject.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.placeholder]
 * @param {number} [props.topN=10]
 * @param {string} [props.className]
 * @returns {React.ReactElement}
 */
export default function ComparePerspectives({
  placeholder = 'Type a topic, theme, or event (for example "Emmett Till" or "voter registration")…',
  topN = 10,
  className = '',
}) {
  const [topic, setTopic] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  // Audit-tier filter, same pattern as QuoteFinder and SemanticSearch so the
  // affordance is consistent across the site. Default: all tiers visible. The
  // filter applies client-side to the returned topN; the search is NOT
  // re-issued when filters change.
  const [allowedTiers, setAllowedTiers] = useState(new Set(TIER_VOCABULARY));
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const runSearch = async (rawTopic) => {
    const trimmed = (rawTopic || '').trim();
    if (!trimmed) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      // dedupeByEntry is REQUIRED here: it collapses the result set to one
      // passage per interviewee, so the cards represent distinct voices
      // rather than several passages from the same talkative person.
      const { results: payloads } = await retrieve(trimmed, {
        dedupeByEntry: true,
        topN,
        signal: ctrl.signal,
      });
      setResults(payloads || []);
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.error('[ComparePerspectives] retrieve failed:', e);
      setError(e?.detail?.message || e?.message || 'Search failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    runSearch(topic);
  };

  const handleSampleClick = (sample) => {
    setTopic(sample);
    runSearch(sample);
  };

  return (
    <section className={`rag-compare-perspectives ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <Users className="w-6 h-6 text-red-700 dark:text-red-400 flex-shrink-0 mt-1" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-medium text-stone-900">Compare Voices on One Subject</h2>
          <p className="text-sm text-stone-600 mt-1">
            Type a topic, a theme, or an event. The archive returns several different
            interviewees speaking about that same subject, each with the speaker, the exact
            timestamp, and a Library of Congress catalog reference, so you can read how, for
            example, a local organizer and a national figure described it side by side.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={2000}
          className="w-full px-4 py-3 text-base border border-stone-300 rounded-lg focus:border-red-700 dark:focus:border-red-400 focus:ring-2 focus:ring-red-700/30 dark:focus:ring-red-400/30 outline-none transition-colors bg-white dark:placeholder-zinc-500 resize-y"
          aria-label="Topic, theme, or event to compare across interviewees"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-stone-500">{topic.length} / 2000</span>
          <div className="flex items-center gap-2">
            {topic && !isLoading && (
              <button
                type="button"
                onClick={() => {
                  setTopic('');
                  setResults([]);
                  setError(null);
                  setHasSearched(false);
                }}
                className="px-3 py-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
                aria-label="Clear topic"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !topic.trim()}
              className="px-6 py-2 bg-civil-red-strong text-white rounded-md font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Comparing
                </span>
              ) : (
                'Compare Voices'
              )}
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-600">
          <span className="text-stone-500">Example topics:</span>
          {SAMPLE_TOPICS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSampleClick(s)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full border border-stone-300 bg-white hover:bg-stone-50 hover:border-stone-400 transition-colors disabled:opacity-40 text-left"
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="mb-4 p-4 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <>
          {/* Framing line: tells the reader these cards are DISTINCT
              interviewees on the one subject, which is the whole point of the
              deduped retrieval. The count makes the multi-perspective spread
              legible at a glance ("6 people on this topic"). */}
          <p className="mb-4 text-sm text-stone-600">
            {results.length === 1 ? (
              <>One interviewee in the archive spoke about this subject. Other voices may surface with a broader topic.</>
            ) : (
              <>
                <span className="font-medium text-stone-900">{results.length} different interviewees</span>{' '}
                in the archive spoke about this subject. Each passage below is a separate person, so
                you can compare how, for example, local participants and national figures described
                the same thing.
              </>
            )}
          </p>

          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-stone-500">Audit tier:</span>
            {TIER_VOCABULARY.map((tier) => {
              const active = allowedTiers.has(tier);
              return (
                <label
                  key={tier}
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
                      if (active) next.delete(tier); else next.add(tier);
                      setAllowedTiers(next);
                    }}
                    className="sr-only"
                  />
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: TIER_COLORS[tier] }} aria-hidden="true" />
                  <span>{tier}</span>
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
        </>
      )}

      {(() => {
        const filtered = allowedTiers.size === TIER_VOCABULARY.length
          ? results
          : results.filter((p) => allowedTiers.has(p.uncertaintyTier));
        const hiddenCount = results.length - filtered.length;
        return (
          <>
            {hiddenCount > 0 && (
              <div className="mb-3 text-xs text-stone-500">
                {hiddenCount} {hiddenCount === 1 ? 'voice' : 'voices'} hidden by tier filter
              </div>
            )}
            <ol className="space-y-4">
              {filtered.map((payload) => (
                <li key={payload.id}>
                  <CitationCard payload={payload} showFullText={true} />
                </li>
              ))}
            </ol>
          </>
        );
      })()}

      {!isLoading && !error && hasSearched && results.length === 0 && (
        <p className="text-stone-500 text-sm">
          No passages found. Try a broader topic. Click one of the example chips above to see
          what a multi-voice comparison looks like.
        </p>
      )}
    </section>
  );
}
