/**
 * @fileoverview GeographicAtlas, pre-computed panel of 12 movement geographies
 * with the passages from interviewees who discuss each one.
 *
 * Loads /rag/summaries/geography.json. Same shape as FamousNames + Events.
 */

import { useEffect, useState } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { TIER_BADGE, TIER_VOCABULARY, SETTLED_STATES } from './tiers';
import AtlasMap from './AtlasMap';

export default function GeographicAtlas() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState(null);
  // Audit-tier filter, same pattern as InterviewMap, SemanticSearch,
  // QuoteFinder. Default: all 5 tiers visible. Client-side filter
  // over the precomputed passages per anchor.
  const [allowedTiers, setAllowedTiers] = useState(new Set(TIER_VOCABULARY));

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

      {anchor && (() => {
        const visiblePassages = anchor.passages.filter((p) => allowedTiers.has(p.uncertainty_tier));
        const hidden = anchor.passages.length - visiblePassages.length;
        return (
        <article>
          <header className="mb-4">
            <h3 className="text-2xl font-medium text-stone-900 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              {anchor.name}
            </h3>
            <p className="text-sm text-stone-600">{anchor.passages.length} voices</p>
          </header>

          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
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
          {hidden > 0 && (
            <div className="mb-3 text-xs text-stone-500">
              {hidden} {hidden === 1 ? 'passage' : 'passages'} hidden by tier filter
            </div>
          )}

          {visiblePassages.length === 0 && anchor.passages.length > 0 && (
            <p className="text-sm text-stone-500 mb-3">
              All {anchor.passages.length} passages for this location are in tiers you&apos;ve hidden.{' '}
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

          <div className="space-y-3">
            {visiblePassages.map((p, idx) => {
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
                      <span className="inline-flex items-center gap-1 text-stone-500">
                        Library of Congress
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </article>
        );
      })()}
    </div>
  );
}
