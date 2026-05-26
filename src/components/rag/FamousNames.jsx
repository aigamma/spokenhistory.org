/**
 * @fileoverview FamousNames — pre-computed panel of iconic civil-rights
 * figures NOT in the 136-interview corpus, showing who in the corpus
 * discussed them.
 *
 * The demo thesis: the corpus's coverage extends BEYOND its 136 named
 * interviewees through the network of who-knew-whom. Ella Baker has no
 * interview but 8 different speakers describe her. Bayard Rustin, Bob
 * Moses, Diane Nash — same. Querying their names directly surfaces the
 * secondhand-as-primary-source pattern.
 *
 * Loads /rag/summaries/famous_external.json. Pre-computed; zero per-request cost.
 */

import { useEffect, useState } from 'react';
import { ExternalLink, Clock } from 'lucide-react';
import { TIER_BADGE } from './tiers';

export default function FamousNames() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/summaries/famous_external.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((j) => {
        if (cancelled) return;
        setData(j);
        if (j.figures?.length && !selectedSlug) setSelectedSlug(j.figures[0].slug);
      })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="text-sm text-stone-500 p-4">Famous-name panel not yet generated.</div>;
  if (!data) return <div className="text-sm text-stone-500 p-4" role="status">Loading…</div>;

  const fig = data.figures.find((f) => f.slug === selectedSlug);

  return (
    <div className="rag-famous-names">
      <p className="text-sm text-stone-600 mb-6 max-w-2xl">
        Several iconic figures don&apos;t have their own interview in this 136-entry corpus — but they&apos;re discussed extensively by interviewees who knew them. The embedding space surfaces those secondhand accounts with citation-grade attribution.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {data.figures.map((f) => (
          <button
            key={f.slug}
            type="button"
            onClick={() => setSelectedSlug(f.slug)}
            aria-pressed={f.slug === selectedSlug}
            className={
              'px-3 py-1.5 text-sm rounded-md border transition-colors ' +
              (f.slug === selectedSlug
                ? 'border-red-700 bg-red-50 text-stone-900 font-medium'
                : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400')
            }
            style={{ fontFamily: 'Chivo Mono, monospace' }}
          >
            {f.name}
          </button>
        ))}
      </div>

      {fig && (
        <article>
          <header className="mb-4">
            <h3 className="text-2xl font-medium text-stone-900 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              {fig.name}
            </h3>
            <p className="text-sm text-stone-600">Not in corpus · discussed by {fig.passages.length} {fig.passages.length === 1 ? 'voice' : 'voices'}</p>
          </header>

          <div className="space-y-3">
            {fig.passages.map((p, idx) => (
              <PassageCard key={`${p.entry_number}-${idx}`} passage={p} />
            ))}
          </div>
        </article>
      )}
    </div>
  );
}

function PassageCard({ passage }) {
  const tierKey = passage.uncertainty_tier in TIER_BADGE ? passage.uncertainty_tier : null;
  const badge = tierKey ? TIER_BADGE[tierKey] : null;
  const ts = passage.timestamp_start_seconds != null
    ? `${Math.floor(passage.timestamp_start_seconds / 60)}:${String(Math.floor(passage.timestamp_start_seconds % 60)).padStart(2, '0')}`
    : null;
  return (
    <article className="border border-stone-200 rounded-lg bg-white p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <div>
          <h4 className="text-base font-medium text-stone-900">{passage.entry_subject}</h4>
          <p className="text-xs text-stone-500">Entry #{passage.entry_number}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-500">
          {passage.rerank_score != null && <span className="tabular-nums">rerank {(passage.rerank_score * 100).toFixed(0)}%</span>}
          {badge && <span className={`px-2 py-0.5 rounded-full border ${badge.bg} ${badge.border} ${badge.text}`}>{badge.label}</span>}
        </div>
      </header>
      <blockquote className="border-l-4 border-red-700 pl-3 py-0.5 mb-2 text-sm text-stone-800 italic">
        &ldquo;{passage.text_preview}&rdquo;
      </blockquote>
      <div className="flex flex-wrap items-center gap-x-4 text-xs text-stone-700">
        {ts && <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" aria-hidden="true" />{ts}</span>}
        {passage.loc_item_url && (
          <a href={passage.loc_item_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-civil-red-body hover:underline">
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            LoC catalog
          </a>
        )}
      </div>
    </article>
  );
}
