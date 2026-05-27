/**
 * @fileoverview FamousNames — figures who don't have their own oral
 * history in this corpus but are discussed extensively by people who
 * do. Demonstrates that the archive's coverage extends BEYOND its 136
 * named interviewees through the network of who-knew-whom.
 *
 * Loads /rag/summaries/famous_external.json. Pre-computed; zero
 * per-request cost.
 *
 * Layout: card grid (was a row of identical pills). Each card carries
 * the figure's name, a hand-curated role/era line, and the count of
 * voices discussing them. Click a card to expand the passages inline.
 */

import { useEffect, useState } from 'react';
import { ExternalLink, Clock } from 'lucide-react';
import { TIER_BADGE } from './tiers';

// Hand-curated role/era line per figure. The famous_external.json
// data doesn't carry biographical metadata, so we add it here
// once. These are short identifiers for stakeholder recognition,
// not full biographies.
const FIGURE_ROLES = {
  'ella-baker':       'SNCC founder · NAACP organizer · 1903–1986',
  'bayard-rustin':    'Architect of the 1963 March on Washington · 1912–1987',
  'diane-nash':       'Nashville sit-ins · Freedom Rides organizer',
  'bob-moses':        'SNCC Mississippi project director · 1935–2021',
  'james-forman':     'SNCC executive secretary · 1928–2005',
  'fannie-lou-hamer': 'MFDP founder · 1962 Winona jail survivor · 1917–1977',
  'martin-luther-king': 'SCLC president · 1929–1968',
  'malcolm-x':        'Nation of Islam · OAAU founder · 1925–1965',
  'stokely-carmichael': 'SNCC chairman, 1966 · later Kwame Ture · 1941–1998',
  'septima-clark':    'Citizenship Schools founder · 1898–1987',
  'medgar-evers':     'NAACP Mississippi field secretary · 1925–1963',
  'thurgood-marshall': 'NAACP LDF chief counsel · 1908–1993',
  'huey-newton':      'Black Panther Party co-founder · 1942–1989',
  'james-baldwin':    'Essayist, novelist · 1924–1987',
  'a-philip-randolph': 'BSCP president · 1963 March on Washington · 1889–1979',
};

export default function FamousNames() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/summaries/famous_external.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="text-sm text-stone-500 p-4">Famous-name panel not yet generated.</div>;
  if (!data) return <div className="text-sm text-stone-500 p-4" role="status">Loading…</div>;

  const fig = selectedSlug ? data.figures.find((f) => f.slug === selectedSlug) : null;

  return (
    <div className="rag-famous-names">
      <p className="text-sm text-stone-600 mb-6 max-w-2xl">
        Fifteen iconic figures don&apos;t have their own oral history in this
        136-entry corpus — but they&apos;re discussed extensively by interviewees
        who knew them. The embedding space surfaces those secondhand accounts
        with citation-grade attribution. <strong>Click a card</strong> to load
        passages mentioning that figure.
      </p>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 list-none p-0 mb-6">
        {data.figures
          .slice()
          .sort((a, b) => b.passages.length - a.passages.length)
          .map((f) => {
            const isSelected = f.slug === selectedSlug;
            return (
              <li key={f.slug}>
                <button
                  type="button"
                  onClick={() => setSelectedSlug(isSelected ? null : f.slug)}
                  aria-pressed={isSelected}
                  className={
                    'w-full text-left p-4 rounded-lg border-2 transition-all ' +
                    (isSelected
                      ? 'border-red-700 bg-white shadow-md'
                      : 'border-stone-200 bg-white hover:border-stone-400 hover:shadow-sm')
                  }
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3
                      className={
                        'text-base sm:text-lg font-medium leading-tight ' +
                        (isSelected ? 'text-civil-red-body' : 'text-stone-900')
                      }
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {f.name}
                    </h3>
                    <span
                      className={
                        'flex-shrink-0 text-xs tabular-nums px-2 py-0.5 rounded-full border ' +
                        (isSelected
                          ? 'border-red-700 text-civil-red-body bg-red-50'
                          : 'border-stone-300 text-stone-600')
                      }
                    >
                      {f.passages.length} voices
                    </span>
                  </div>
                  {FIGURE_ROLES[f.slug] && (
                    <p className="text-xs text-stone-500 leading-snug" style={{ fontFamily: 'Chivo Mono, monospace' }}>
                      {FIGURE_ROLES[f.slug]}
                    </p>
                  )}
                </button>
              </li>
            );
          })}
      </ul>

      {fig && (
        <article>
          <header className="mb-4 pt-4 border-t border-stone-200">
            <h3 className="text-2xl font-medium text-stone-900 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              {fig.name}
            </h3>
            <p className="text-sm text-stone-600">
              Not in corpus · discussed by {fig.passages.length} {fig.passages.length === 1 ? 'voice' : 'voices'}
              {FIGURE_ROLES[fig.slug] && <> · <span className="font-mono text-xs">{FIGURE_ROLES[fig.slug]}</span></>}
            </p>
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
