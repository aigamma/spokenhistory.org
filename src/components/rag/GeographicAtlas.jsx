/**
 * @fileoverview GeographicAtlas — pre-computed panel of 12 movement geographies
 * with the passages from interviewees who discuss each one.
 *
 * Loads /rag/summaries/geography.json. Same shape as FamousNames + Events.
 */

import { useEffect, useState } from 'react';
import { ExternalLink, Clock, MapPin } from 'lucide-react';
import { TIER_BADGE } from './tiers';
import AtlasMap from './AtlasMap';

export default function GeographicAtlas() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/summaries/geography.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((j) => {
        if (cancelled) return;
        setData(j);
        if (j.anchors?.length && !selectedSlug) setSelectedSlug(j.anchors[0].slug);
      })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="text-sm text-stone-500 p-4">Geographic atlas not yet generated.</div>;
  if (!data) return <div className="text-sm text-stone-500 p-4" role="status">Loading…</div>;

  const anchor = data.anchors.find((a) => a.slug === selectedSlug);

  return (
    <div className="rag-geography">
      <p className="text-sm text-stone-600 mb-6 max-w-2xl">
        Twelve movement geographies, from the Mississippi Delta to Oakland. Click a marker
        on the map or a label below to see the interviewees who discussed that location;
        circle size reflects how many voices in the corpus speak about each place.
      </p>

      <div className="mb-6">
        <AtlasMap
          anchors={data.anchors}
          selectedSlug={selectedSlug}
          onSelect={setSelectedSlug}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {data.anchors.map((a) => (
          <button
            key={a.slug}
            type="button"
            onClick={() => setSelectedSlug(a.slug)}
            aria-pressed={a.slug === selectedSlug}
            className={
              'inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border transition-colors ' +
              (a.slug === selectedSlug
                ? 'border-red-700 bg-red-50 text-stone-900 font-medium'
                : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400')
            }
            style={{ fontFamily: 'Chivo Mono, monospace' }}
          >
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            {a.name}
          </button>
        ))}
      </div>

      {anchor && (
        <article>
          <header className="mb-4">
            <h3 className="text-2xl font-medium text-stone-900 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              {anchor.name}
            </h3>
            <p className="text-sm text-stone-600">{anchor.passages.length} voices</p>
          </header>

          <div className="space-y-3">
            {anchor.passages.map((p, idx) => {
              const tierKey = p.uncertainty_tier in TIER_BADGE ? p.uncertainty_tier : null;
              const badge = tierKey ? TIER_BADGE[tierKey] : null;
              const ts = p.timestamp_start_seconds != null
                ? `${Math.floor(p.timestamp_start_seconds / 60)}:${String(Math.floor(p.timestamp_start_seconds % 60)).padStart(2, '0')}`
                : null;
              return (
                <article key={`${p.entry_number}-${idx}`} className="border border-stone-200 rounded-lg bg-white p-4">
                  <header className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-base font-medium text-stone-900">{p.entry_subject}</h4>
                      <p className="text-xs text-stone-500">Entry #{p.entry_number}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      {p.rerank_score != null && <span className="tabular-nums">rerank {(p.rerank_score * 100).toFixed(0)}%</span>}
                      {badge && <span className={`px-2 py-0.5 rounded-full border ${badge.bg} ${badge.border} ${badge.text}`}>{badge.label}</span>}
                    </div>
                  </header>
                  <blockquote className="border-l-4 border-red-700 pl-3 py-0.5 mb-2 text-sm text-stone-800 italic">
                    &ldquo;{p.text_preview}&rdquo;
                  </blockquote>
                  <div className="flex flex-wrap items-center gap-x-4 text-xs text-stone-700">
                    {ts && <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" aria-hidden="true" />{ts}</span>}
                    {p.loc_item_url && (
                      <a href={p.loc_item_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-civil-red-body hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        LoC catalog
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </article>
      )}
    </div>
  );
}
