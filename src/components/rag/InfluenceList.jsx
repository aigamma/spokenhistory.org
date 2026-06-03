/**
 * @fileoverview InfluenceList, who-discussed-whom across the corpus.
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
import { Link } from 'react-router-dom';
import { GitBranch, List, Loader2, FileText } from 'lucide-react';
import InfluenceGraph from './InfluenceGraph';
import { retrieve } from '../../services/ragClient';
import CitationCard from './CitationCard';

// Normalize a display name to the same form used by
// public/rag/people/index.json's by_normalized_name lookup. Keep in
// sync with scripts/build_people_index.mjs::normalize.
function normalizeName(s) {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

// Resolve a node from /rag/summaries/influence.json to its catalog
// slug if one exists. In-corpus nodes look up by entry_number;
// external nodes look up by normalized name.
function resolveCatalogSlug(node, peopleIndex) {
  if (!peopleIndex) return null;
  if (node.in_corpus && node.entry_number != null) {
    return peopleIndex.by_entry?.[node.entry_number]?.slug || null;
  }
  if (node.name) {
    return peopleIndex.by_normalized_name?.[normalizeName(node.name)] || null;
  }
  return null;
}

export default function InfluenceList() {
  const [data, setData] = useState(null);
  const [peopleIndex, setPeopleIndex] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState('top'); // list-view sub-mode: 'top' (external) or 'corpus' (in-corpus)
  const [mode, setMode] = useState('graph'); // 'graph' or 'list'
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/rag/summaries/influence.json').then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found')))),
      fetch('/rag/people/index.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([j, idx]) => {
        if (cancelled) return;
        setData(j);
        setPeopleIndex(idx);
      })
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
              (mode === 'graph' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-50 dark:hover:bg-zinc-800')
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
              (mode === 'list' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-50 dark:hover:bg-zinc-800')
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
              <div className="flex flex-wrap gap-3 mt-2">
                {(() => {
                  const slug = resolveCatalogSlug(selectedNode, peopleIndex);
                  if (!slug) return null;
                  return (
                    <Link
                      to={`/person/${slug}`}
                      className="inline-flex items-center gap-1 text-xs text-civil-red-body hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                      Full catalog page
                    </Link>
                  );
                })()}
                {selectedNode.loc_item_url && (
                  <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                    Library of Congress
                  </span>
                )}
              </div>
              <InfluenceDrillDown node={selectedNode} />
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
            {topList.slice(0, 30).map((n) => {
              const slug = resolveCatalogSlug(n, peopleIndex);
              return (
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
                  {slug && (
                    <Link
                      to={`/person/${slug}`}
                      className="inline-flex items-center gap-1 text-xs text-civil-red-body hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                      Catalog
                    </Link>
                  )}
                  {n.loc_item_url && (
                    <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                      Library of Congress
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * InfluenceDrillDown, when a node is selected (whether an in-corpus
 * interviewee or an external figure like Ella Baker), run /retrieve
 * with the person's name as the query and dedupeByEntry: true so the
 * returned passages span multiple voices discussing them. Filter
 * applies to the WHOLE corpus (no entry filter) because we want
 * "who in the archive talks about Ella Baker", by definition that's
 * across-interviewee.
 *
 * For external figures, this surfaces the secondhand-as-primary-source
 * pattern: Ella Baker has no oral history of her own here, but her
 * influence shows up as quoted memory from people she organized.
 *
 * For in-corpus interviewees, this surfaces what their PEERS said
 * about them, a different read than their own testimony.
 */
function InfluenceDrillDown({ node }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!node?.name) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResults(null);
    retrieve(node.name, { topN: 5, dedupeByEntry: true })
      .then(({ results: r }) => {
        if (cancelled) return;
        // For in-corpus people, filter out the person's own interview -
        // we want what OTHERS say about them, not their own testimony.
        const filtered = node.in_corpus && node.entry_number != null
          ? (r || []).filter((p) => p.entryNumber !== node.entry_number)
          : (r || []);
        setResults(filtered);
      })
      .catch((e) => { if (!cancelled) setError(e?.detail?.message || e?.message || 'Drill-down failed.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [node?.name, node?.entry_number, node?.in_corpus]);

  return (
    <div className="mt-4 pt-3 border-t border-stone-200">
      <p className="text-xs text-civil-red-body font-mono uppercase tracking-wide mb-1">
        Passages that mention {node.name}
      </p>
      <p className="text-sm text-stone-700 mb-3">
        {node.in_corpus
          ? <>Top passages from <strong>other</strong> interviewees that mention {node.name} (their own testimony excluded).</>
          : <>Top passages where {node.name} is discussed, they have no interview of their own here; the archive&apos;s coverage of them is entirely secondhand.</>
        }
      </p>
      {loading && (
        <p className="text-sm text-stone-500 inline-flex items-center gap-2" role="status">
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          Searching the corpus…
        </p>
      )}
      {error && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded p-3">
          {error}
        </p>
      )}
      {results && results.length === 0 && !loading && !error && (
        <p className="text-sm text-stone-500">
          No passages mention them by name with strong-enough alignment to surface.
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
