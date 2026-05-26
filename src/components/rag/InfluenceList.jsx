/**
 * @fileoverview InfluenceList — simple list view of the who-discussed-whom
 * graph. Shows each interviewee with the count of mentions they have in
 * other interviews, plus the in-corpus and external (out-of-corpus) names
 * sorted by how often they're discussed.
 *
 * A full force-directed graph view would be richer but takes time to wire;
 * this list view captures the same data and is conference-presentable.
 */

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

export default function InfluenceList() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState('top');

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/summaries/influence.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="text-sm text-stone-500 p-4">Influence graph not yet generated.</div>;
  if (!data) return <div className="text-sm text-stone-500 p-4" role="status">Loading…</div>;

  const inCorpus = data.nodes.filter((n) => n.in_corpus).sort((a, b) => b.discussed_by_count - a.discussed_by_count);
  const external = data.nodes.filter((n) => !n.in_corpus).sort((a, b) => b.discussed_by_count - a.discussed_by_count);
  const topList = view === 'corpus' ? inCorpus : external;

  return (
    <div className="rag-influence">
      <p className="text-sm text-stone-600 mb-6 max-w-2xl">
        Directed graph of who-discussed-whom across the corpus. Built by full-name matching against every other interviewee + 15 famous out-of-corpus figures. {data.edge_count} edges across {data.node_count} nodes. The names on the right are not interviewees themselves but are surfaced through the corpus as discussed by multiple speakers — the network of who-knew-whom that extends the archive&apos;s coverage.
      </p>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setView('top')}
          aria-pressed={view === 'top'}
          className={
            'px-3 py-1.5 text-sm rounded-md border transition-colors ' +
            (view === 'top'
              ? 'border-red-700 bg-red-50 text-stone-900 font-medium'
              : 'border-stone-300 bg-white text-stone-700')
          }
        >
          Most-discussed (out-of-corpus)
        </button>
        <button
          type="button"
          onClick={() => setView('corpus')}
          aria-pressed={view === 'corpus'}
          className={
            'px-3 py-1.5 text-sm rounded-md border transition-colors ' +
            (view === 'corpus'
              ? 'border-red-700 bg-red-50 text-stone-900 font-medium'
              : 'border-stone-300 bg-white text-stone-700')
          }
        >
          Most-discussed (in-corpus interviewees)
        </button>
      </div>

      <div className="space-y-1">
        {topList.slice(0, 30).map((n) => (
          <article key={n.id} className="flex items-center gap-3 p-3 border border-stone-200 rounded-md bg-white">
            <span className="font-mono text-xs text-stone-500 tabular-nums w-8 text-right">
              {n.discussed_by_count}
            </span>
            <span className="flex-1 text-sm text-stone-900">
              {n.name}
              {!n.in_corpus && (
                <span className="ml-2 text-xs text-stone-500 italic">(not in corpus)</span>
              )}
            </span>
            {n.loc_item_url && (
              <a href={n.loc_item_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-civil-red-body hover:underline">
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                LoC
              </a>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
