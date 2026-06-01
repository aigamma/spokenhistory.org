/**
 * @fileoverview TourPages, 10 pre-written narrative tour pages, each a
 * curator's walk through 6-10 interviews around a theme.
 *
 * Loads /rag/summaries/tours.json.
 */

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import TourMap from './TourMap';
import { retrieve } from '../../services/ragClient';
import CitationCard from './CitationCard';

export default function TourPages() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/summaries/tours.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((j) => {
        if (cancelled) return;
        setData(j);
        if (j.tours?.length && !selectedSlug) setSelectedSlug(j.tours[0].slug);
      })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="text-sm text-stone-500 p-4">Tour pages not yet generated.</div>;
  if (!data) return <div className="text-sm text-stone-500 p-4" role="status">Loading tours…</div>;

  const tour = data.tours.find((t) => t.slug === selectedSlug);

  return (
    <div className="rag-tours">
      <p className="text-sm text-stone-600 mb-6 max-w-2xl">
        Ten curated tours, pre-written narrative paths through 6-10 interviews each, organized around a theme. Editorial; not generated per query.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {data.tours.map((t) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => setSelectedSlug(t.slug)}
            aria-pressed={t.slug === selectedSlug}
            className={
              'px-3 py-2 text-sm rounded-md border transition-colors text-left ' +
              (t.slug === selectedSlug
                ? 'border-red-700 bg-red-50 text-stone-900 font-medium'
                : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400')
            }
            style={{ fontFamily: 'Chivo Mono, monospace' }}
          >
            {t.title}
          </button>
        ))}
      </div>

      {tour && (
        <article>
          <header className="mb-4">
            <h3 className="text-2xl font-medium text-stone-900 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              {tour.title}
            </h3>
            {tour.subtitle && (
              <p className="text-base text-stone-600 italic mb-3">{tour.subtitle}</p>
            )}
          </header>

          {/* Visual map of the tour stops as a numbered arc through
              the Atlas UMAP projection. Renders silently as null if
              atlas_projection.json isn't loaded yet, the body + path
              list below remain functional regardless. */}
          <TourMap tour={tour} />

          {tour.body && (
            <div className="prose prose-stone max-w-3xl mb-6 text-stone-800" style={{ fontFamily: 'Source Serif 4, serif' }}>
              {tour.body.split(/\n\n/).map((para, i) => (
                <p key={i} className="mb-3">{para}</p>
              ))}
            </div>
          )}

          {tour.path && tour.path.length > 0 && (
            <ol className="space-y-3 list-none p-0">
              {tour.path.map((stop, idx) => (
                <TourStop key={idx} stop={stop} idx={idx} tourTitle={tour.title} />
              ))}
            </ol>
          )}

          {tour.closing && (
            <p className="mt-6 text-base text-stone-700 italic max-w-3xl" style={{ fontFamily: 'Source Serif 4, serif' }}>
              {tour.closing}
            </p>
          )}
        </article>
      )}
    </div>
  );
}

/**
 * TourStop, one stop in a curated tour's ordered path. The stop
 * shows the interviewee's name + curator's note by default; clicking
 * it opens an inline drill-down with 3 passages from THAT interview
 * most aligned with the TOUR'S title.
 *
 * Query strategy: use tour.title (e.g., "The theological foundations
 * of nonviolence") as the /retrieve query, filtered to the stop's
 * entry_number. So McLaurin's stop on the voter-registration tour
 * surfaces his voter-reg passages, not generic top-passages.
 *
 * Closed by default, clicking the row expands the drill-down.
 */
function TourStop({ stop, idx, tourTitle }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className={'border rounded-md bg-white overflow-hidden transition-colors ' + (expanded ? 'border-civil-red-strong' : 'border-stone-200')}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="w-full text-left p-4"
      >
        <header className="flex items-baseline justify-between gap-2 mb-1">
          <h4 className="text-base font-medium text-stone-900">
            <span className="text-civil-red-body font-mono mr-2">{String(idx + 1).padStart(2, '0')}</span>
            {stop.entry_subject}
          </h4>
          <div className="flex items-center gap-2 flex-shrink-0">
            {stop.entry_number != null && (
              <span className="text-xs text-stone-500 tabular-nums">#{stop.entry_number}</span>
            )}
            <span className="text-xs text-civil-red-body">{expanded ? '▾' : '▸'}</span>
          </div>
        </header>
        {stop.note && (
          <p className="text-sm text-stone-700 ml-8" style={{ fontFamily: 'Source Serif 4, serif' }}>
            {stop.note}
          </p>
        )}
      </button>
      {expanded && stop.entry_number != null && (
        <TourStopDrillDown entryNumber={stop.entry_number} tourTitle={tourTitle} />
      )}
    </li>
  );
}

function TourStopDrillDown({ entryNumber, tourTitle }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tourTitle || entryNumber == null) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResults(null);
    retrieve(tourTitle, {
      topN: 3,
      filter: { entry_number: { $eq: entryNumber } },
    })
      .then(({ results: r }) => { if (!cancelled) setResults(r || []); })
      .catch((e) => { if (!cancelled) setError(e?.detail?.message || e?.message || 'Drill-down failed.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [entryNumber, tourTitle]);

  return (
    <div className="border-t border-stone-200 p-4 bg-stone-50">
      <p className="text-xs text-civil-red-body font-mono uppercase tracking-wide mb-1">
        From this interview, aligned with the tour
      </p>
      <p className="text-xs text-stone-600 italic mb-3">
        Query: &ldquo;{tourTitle}&rdquo;
      </p>
      {loading && (
        <p className="text-sm text-stone-500 inline-flex items-center gap-2" role="status">
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          Searching…
        </p>
      )}
      {error && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded p-3">
          {error}
        </p>
      )}
      {results && results.length === 0 && !loading && !error && (
        <p className="text-sm text-stone-500">
          No strongly-aligned passages found in this interview.
        </p>
      )}
      {results && results.length > 0 && (
        <ol className="space-y-3">
          {results.map((payload) => (
            <li key={payload.id}>
              <CitationCard payload={payload} showFullText={false} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
