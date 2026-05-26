/**
 * @fileoverview ThemesBrowser — render the 30 k-means clusters with their
 * LLM-generated names + descriptions + starter queries.
 *
 * Loads /rag/summaries/clusters.json. Falls back to clusters_raw.json with
 * generic names if the named version doesn't exist yet.
 */

import { useEffect, useState } from 'react';

export default function ThemesBrowser() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

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

  return (
    <div className="rag-themes">
      <p className="text-sm text-stone-600 mb-6 max-w-2xl">
        K-means partition of all 136 interview centroids into 30 thematic clusters in the 1024-dimensional embedding space. Each cluster is a region of the space where interviewees&apos; testimony rhymes — even when they never met. Click a cluster to expand its membership.
      </p>

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

              {isExpanded && (
                <div className="border-t border-stone-100 p-4 bg-stone-50">
                  {c.starter_query && (
                    <div className="mb-3 text-sm">
                      <span className="text-stone-600">Starter query: </span>
                      <a
                        href={`/rag-explore#search?q=${encodeURIComponent(c.starter_query)}`}
                        className="font-mono text-civil-red-body hover:underline"
                      >
                        &ldquo;{c.starter_query}&rdquo;
                      </a>
                    </div>
                  )}
                  <ul className="text-sm text-stone-700 list-disc list-inside space-y-0.5">
                    {(c.member_entry_subjects || (c.members || []).map((m) => m.entry_subject)).map((name, idx) => (
                      <li key={idx}>
                        {name}
                        {idx === 0 && c.exemplar_entry_subject === name && (
                          <span className="ml-2 text-xs text-stone-500">(exemplar)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
