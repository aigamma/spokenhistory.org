/**
 * @fileoverview TourPages — 10 pre-written narrative tour pages, each a
 * curator's walk through 6-10 interviews around a theme.
 *
 * Loads /rag/summaries/tours.json.
 */

import { useEffect, useState } from 'react';

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
        Ten curated tours — pre-written narrative paths through 6-10 interviews each, organized around a theme. Editorial; not generated per query.
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
                <li key={idx} className="border border-stone-200 rounded-md bg-white p-4">
                  <header className="flex items-baseline justify-between gap-2 mb-1">
                    <h4 className="text-base font-medium text-stone-900">
                      <span className="text-civil-red-body font-mono mr-2">{String(idx + 1).padStart(2, '0')}</span>
                      {stop.entry_subject}
                    </h4>
                    {stop.entry_number != null && (
                      <span className="text-xs text-stone-500 tabular-nums">#{stop.entry_number}</span>
                    )}
                  </header>
                  {stop.note && (
                    <p className="text-sm text-stone-700 ml-8" style={{ fontFamily: 'Source Serif 4, serif' }}>
                      {stop.note}
                    </p>
                  )}
                </li>
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
