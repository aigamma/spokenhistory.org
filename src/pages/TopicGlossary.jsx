/**
 * @fileoverview TopicGlossary, browse 30 thematic clusters derived from
 * the embedding space.
 *
 * Originally fetched from Firestore (`events_and_topics` collection);
 * rewired 2026-05-26 to read from /rag/summaries/clusters.json. Each
 * topic = one k-means cluster of interview centroids, named + described
 * by Claude Opus 4.7 at precompute time.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Footer from '../components/common/Footer';

export default function TopicGlossary() {
  useDocumentTitle('Topics');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/summaries/clusters.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!data?.clusters) return [];
    if (!search.trim()) return data.clusters;
    const s = search.toLowerCase();
    return data.clusters.filter((c) =>
      (c.name || '').toLowerCase().includes(s) ||
      (c.description || '').toLowerCase().includes(s) ||
      (c.member_entry_subjects || []).some((m) => m.toLowerCase().includes(s))
    );
  }, [data, search]);

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-[#EBEAE9] dark:bg-stone-900">
        <p className="text-stone-700">Topic glossary not yet available. {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBEAE9] dark:bg-stone-900">
      <main id="main-content" tabIndex={-1} className="max-w-5xl mx-auto px-4 sm:px-6 py-12 focus:outline-none">
        <header className="mb-8">
          <p className="text-civil-red-body text-sm font-light font-mono mb-2">
            Civil Rights History Project · Thematic browse
          </p>
          <h1
            className="text-stone-900 text-3xl sm:text-4xl md:text-5xl font-medium mb-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Topics
          </h1>
          <p
            className="text-stone-700 text-base sm:text-lg max-w-3xl"
            style={{ fontFamily: 'Source Serif 4, serif' }}
          >
            Thirty thematic groupings derived from the embedding space, k-means partition of all 136 interview centroids. Each topic gathers voices whose testimony rhymes in the 1024-dimensional space, even when they never met. Click a topic to see its members.
          </p>
        </header>

        <div className="mb-6">
          <input
            type="search"
            placeholder="Search by topic, description, or interviewee…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-100 focus:border-civil-red-strong focus:ring-2 focus:ring-civil-red-strong/30 outline-none transition-colors"
            aria-label="Search topics by name, description, or interviewee"
          />
        </div>

        <p className="text-sm text-stone-600 mb-4">
          {filtered.length} of {data?.clusters?.length || 0} topics
        </p>

        {!data && (
          <p className="text-sm text-stone-500" role="status" aria-live="polite">Loading…</p>
        )}

        <div className="space-y-2">
          {filtered.map((c) => {
            const isExpanded = expandedId === c.cluster_id;
            return (
              <article key={c.cluster_id} className="border border-stone-200 rounded-md bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : c.cluster_id)}
                  aria-expanded={isExpanded}
                  className="w-full text-left p-4 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-stone-900">{c.name}</h3>
                      {c.description && (
                        <p className="text-sm text-stone-600 mt-1" style={{ fontFamily: 'Source Serif 4, serif' }}>
                          {c.description}
                        </p>
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
                      <p className="text-sm mb-3">
                        <span className="text-stone-600">Try this query: </span>
                        <Link
                          to={`/rag-explore#search`}
                          className="font-mono text-civil-red-body hover:underline"
                        >
                          &ldquo;{c.starter_query}&rdquo;
                        </Link>
                      </p>
                    )}
                    <p className="text-xs text-stone-500 mb-2 uppercase tracking-wide">
                      Members ({(c.members || c.member_entry_subjects || []).length})
                    </p>
                    <ul className="text-sm text-stone-700 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 list-none">
                      {(c.members || []).length > 0
                        ? c.members.map((m, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-stone-400">·</span>
                              <Link
                                to={`/interview/${m.entry_number}`}
                                className="text-civil-red-body hover:underline transition-colors"
                              >
                                {m.entry_subject}
                              </Link>
                            </li>
                          ))
                        : (c.member_entry_subjects || []).map((name, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-stone-400">·</span>
                              <Link
                                to={`/interview-index?search=${encodeURIComponent(name)}`}
                                className="text-civil-red-body hover:underline transition-colors"
                              >
                                {name}
                              </Link>
                            </li>
                          ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <div className="mt-12">
          <Link
            to="/rag-explore?tab=themes"
            className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 text-white rounded-md hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 dark:border dark:border-stone-700 transition-colors"
          >
            Explore RAG demo surfaces →
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
