/**
 * @fileoverview ThemesBrowser — 30 k-means thematic clusters with
 * LLM-generated names + descriptions + starter queries.
 *
 * Two views, toggleable:
 *   - Map (default): bubble chart of clusters positioned in 2D
 *     embedding space, same coordinate system as the Constellation
 *     tab. Bubble size = cluster member count; bubble color = dominant
 *     audit tier.
 *   - List: vertical accordion (the original implementation), kept
 *     for accessibility and for users who'd rather scan + read.
 */

import { useEffect, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import ThemesMap from './ThemesMap';

export default function ThemesBrowser() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [mode, setMode] = useState('map');

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/summaries/clusters.json')
      .then((r) => (r.ok ? r.json() : fetch('/rag/summaries/clusters_raw.json').then((r2) => r2.json())))
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="text-sm text-stone-500 p-4">Themes data not yet generated.</div>;
  if (!data) return <div className="text-sm text-stone-500 p-4" role="status">Loading themes…</div>;

  const clusters = data.clusters || [];
  const selectedCluster = expandedId != null ? clusters.find((c) => c.cluster_id === expandedId) : null;

  return (
    <div className="rag-themes">
      <p className="text-sm text-stone-600 mb-6 max-w-2xl">
        K-means partition of all 136 interview centroids into 30 thematic clusters in the
        1024-dimensional embedding space. Each cluster is a region of the space where
        interviewees&apos; testimony rhymes — even when they never met.
        {' '}Below, each bubble is positioned at the centroid of its members&apos; coordinates
        in the same 2D projection used by the Constellation tab; bubble size is the
        cluster&apos;s member count; bubble color shows the dominant audit-confidence tier
        of its members.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex rounded-md border border-stone-300 overflow-hidden" role="tablist">
          <button
            type="button"
            onClick={() => setMode('map')}
            aria-pressed={mode === 'map'}
            className={
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ' +
              (mode === 'map' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-50')
            }
          >
            <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
            Map
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

      {mode === 'map' && (
        <>
          <ThemesMap
            clusters={clusters}
            selectedId={expandedId}
            onSelect={(id) => setExpandedId(expandedId === id ? null : id)}
          />
          {selectedCluster && (
            <ClusterDetails cluster={selectedCluster} />
          )}
        </>
      )}

      {mode === 'list' && (
        <div className="space-y-2">
          {clusters.map((c) => {
            const isExpanded = expandedId === c.cluster_id;
            return (
              <article
                key={c.cluster_id}
                className="border border-stone-200 rounded-md bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : c.cluster_id)}
                  aria-expanded={isExpanded}
                  className="w-full text-left p-4 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-base font-medium text-stone-900">
                        <span className="text-civil-red-body font-mono mr-2">
                          {String(c.cluster_id).padStart(2, '0')}
                        </span>
                        {c.name || `Cluster ${c.cluster_id}`}
                      </h3>
                      {c.description && (
                        <p className="text-sm text-stone-600 mt-1">{c.description}</p>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 tabular-nums whitespace-nowrap">
                      {c.size} {c.size === 1 ? 'voice' : 'voices'}
                    </div>
                  </div>
                </button>

                {isExpanded && <ClusterDetailsInline cluster={c} />}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ClusterDetails({ cluster }) {
  return (
    <aside className="mt-4 p-5 rounded-md border border-stone-200 bg-white">
      <header className="mb-3">
        <h3 className="text-lg font-medium text-stone-900">
          <span className="text-civil-red-body font-mono mr-2">
            {String(cluster.cluster_id).padStart(2, '0')}
          </span>
          {cluster.name || `Cluster ${cluster.cluster_id}`}
        </h3>
        {cluster.description && (
          <p className="text-sm text-stone-600 mt-1">{cluster.description}</p>
        )}
      </header>
      <ClusterBody cluster={cluster} />
    </aside>
  );
}

function ClusterDetailsInline({ cluster }) {
  return (
    <div className="border-t border-stone-100 p-4 bg-stone-50">
      <ClusterBody cluster={cluster} />
    </div>
  );
}

function ClusterBody({ cluster }) {
  const subjects = cluster.member_entry_subjects || (cluster.members || []).map((m) => m.entry_subject);
  return (
    <>
      {cluster.starter_query && (
        <div className="mb-3 text-sm">
          <span className="text-stone-600">Starter query: </span>
          <a
            href={`#/rag-explore?tab=search&q=${encodeURIComponent(cluster.starter_query)}`}
            className="font-mono text-civil-red-body hover:underline"
          >
            &ldquo;{cluster.starter_query}&rdquo;
          </a>
        </div>
      )}
      <p className="text-sm text-stone-700 mb-2">
        <span className="font-medium">{subjects.length}</span>{' '}
        {subjects.length === 1 ? 'voice' : 'voices'} in this cluster:
      </p>
      <ul className="text-sm text-stone-700 list-disc list-inside space-y-0.5 columns-1 sm:columns-2">
        {subjects.map((name, idx) => (
          <li key={idx}>
            {name}
            {idx === 0 && cluster.exemplar_entry_subject === name && (
              <span className="ml-2 text-xs text-stone-500">(exemplar)</span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
