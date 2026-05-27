/**
 * @fileoverview InfluenceList — who-discussed-whom across the corpus.
 *
 * Two views, toggleable:
 *  - Graph: force-directed network via InfluenceGraph (default)
 *  - List: sortable ranked list (the original implementation)
 *
 * The graph is the more visually impactful surface for stakeholder
 * demos. The list is retained for accessibility and for users who
 * want to scan ranked counts rather than explore visually.
 */

import { useEffect, useState } from 'react';
import { ExternalLink, GitBranch, List } from 'lucide-react';
import InfluenceGraph from './InfluenceGraph';

export default function InfluenceList() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState('top'); // list-view sub-mode: 'top' (external) or 'corpus' (in-corpus)
  const [mode, setMode] = useState('graph'); // 'graph' or 'list'
  const [selectedId, setSelectedId] = useState(null);

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
  const selectedNode = selectedId ? data.nodes.find((n) => n.id === selectedId) : null;

  return (
    <div className="rag-influence">
      <p className="text-sm text-stone-600 mb-6 max-w-2xl">
        Directed graph of who-discussed-whom across the corpus. Built by full-name matching
        against every other interviewee plus 15 famous out-of-corpus figures: <span className="tabular-nums">{data.edge_count}</span> edges
        across <span className="tabular-nums">{data.node_count}</span> nodes.
        Brand-red dots are interviewees who have their own oral history; gray dots are
        figures discussed by others but not interviewed themselves (Ella Baker, Bayard Rustin,
        Bob Moses, and others whose voices reach the archive only through who-knew-whom).
      </p>

      {/* View-mode toggle */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex rounded-md border border-stone-300 overflow-hidden" role="tablist">
          <button
            type="button"
            onClick={() => setMode('graph')}
            aria-pressed={mode === 'graph'}
            className={
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ' +
              (mode === 'graph' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-50')
            }
          >
            <GitBranch className="w-3.5 h-3.5" aria-hidden="true" />
            Graph
          </button>
          <button
            type="button"
            onClick={() => setMode('list')}
            aria-pressed={mode === 'list'}
            className={
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors border-l border-stone-300 ' +
              (mode === 'list' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-50')
            }
          >
            <List className="w-3.5 h-3.5" aria-hidden="true" />
            List
          </button>
        </div>
      </div>

      {mode === 'graph' && (
        <>
          <InfluenceGraph
            nodes={data.nodes}
            edges={data.edges || []}
            selectedId={selectedId}
            onSelect={(n) => setSelectedId(n.id === selectedId ? null : n.id)}
          />
          {selectedNode && (
            <aside className="mt-3 px-4 py-3 rounded-md border border-stone-200 bg-white text-sm">
              <header className="flex items-baseline justify-between gap-2 mb-1">
                <h3 className="text-base font-medium text-stone-900">{selectedNode.name}</h3>
                <span className="text-xs text-stone-500">
                  {selectedNode.in_corpus ? 'In corpus' : 'External figure (not interviewed)'}
                </span>
              </header>
              <p className="text-stone-700">
                Discussed by <span className="font-medium tabular-nums">{selectedNode.discussed_by_count}</span>
                {' '}
                {selectedNode.discussed_by_count === 1 ? 'other interview' : 'other interviews'}
                {selectedNode.in_corpus && selectedNode.entry_number != null && (
                  <> · Entry #{selectedNode.entry_number}</>
                )}
                .
              </p>
              {selectedNode.loc_item_url && (
                <a
                  href={selectedNode.loc_item_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-civil-red-body hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  LoC catalog entry
                </a>
              )}
            </aside>
          )}
        </>
      )}

      {mode === 'list' && (
        <>
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
        </>
      )}
    </div>
  );
}
