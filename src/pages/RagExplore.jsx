import { useEffect, useState } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  SemanticSearch,
  QuoteFinder,
  Constellation,
  RelatedPassages,
} from '../components/rag';

/**
 * Pull a small set of corpus stats from /rag/constellation.json
 * (which carries entry_provenance + uncertainty_tier per point).
 * Lets the header render "136 interviews, 5-tier audit substrate"
 * without requiring a separate stats endpoint.
 */
function useCorpusStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/rag/constellation.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json?.points) return;
        const tiers = {};
        let totalChunks = 0;
        for (const p of json.points) {
          const t = p.uncertainty_tier || 'unknown';
          tiers[t] = (tiers[t] || 0) + 1;
          totalChunks += p.chunk_count || 0;
        }
        setStats({
          interviews: json.points.length,
          chunks: totalChunks,
          tiers,
        });
      })
      .catch(() => { /* swallow — header just falls back to baseline copy */ });
    return () => { cancelled = true; };
  }, []);
  return stats;
}

/**
 * RagExplore — landing page for the interactive RAG features layer.
 *
 * Three surfaces on one page, switchable via tabs:
 *
 *   1. Search — live semantic-search box (SemanticSearch component).
 *      Calls /retrieve via Netlify Function. Renders ranked passages
 *      as CitationCards with full primary-source metadata.
 *
 *   2. Quote-finder — paste a half-remembered quote, get the source.
 *      Same retrieval backend, larger textarea, always shows full text.
 *
 *   3. Constellation — 2D PCA scatter of all 136 interview centroids
 *      in embedding space. Click a dot to (someday) jump to the
 *      interview. Loads public/rag/constellation.json.
 *
 * The page is the conference's "philosophy of embedding" demo surface.
 * It is intentionally simple — the goal is to show the substrate
 * works, not to be the final UX.
 */
// Tab IDs are reflected in window.location.hash so URLs like
// /rag-explore#map are shareable and deep-linkable.
const TABS = ['search', 'quote', 'map', 'related'];

// Entries to surface in the "related" demo tab. Each one is a
// well-audited interviewee with a strong thematic profile, so the
// related-passages list shows distinct content. Eric / a stakeholder
// can navigate the dropdown to see different examples.
const RELATED_DEMO_ENTRIES = [
  { number: 1, name: 'Aaron Dixon (Black Panther Party, Seattle)' },
  { number: 73, name: 'Kathleen Cleaver (Black Panther Party)' },
  { number: 76, name: 'Lawrence Guyot (MFDP, SNCC)' },
  { number: 22, name: 'Cleveland Sellers (SNCC)' },
  { number: 125, name: 'Wheeler Parker, Jr. (Emmett Till\'s cousin)' },
  { number: 60, name: 'Joan Trumpauer Mulholland (Freedom Rider)' },
];
const TAB_FROM_HASH = (hash) => {
  const t = (hash || '').replace(/^#/, '');
  return TABS.includes(t) ? t : 'search';
};

export default function RagExplore() {
  useDocumentTitle('Explore the embeddings');
  const stats = useCorpusStats();
  const [tab, setTab] = useState(() =>
    typeof window === 'undefined' ? 'search' : TAB_FROM_HASH(window.location.hash),
  );
  const [relatedEntry, setRelatedEntry] = useState(RELATED_DEMO_ENTRIES[0].number);

  // Keep tab state and the hash in sync so the URL is bookmarkable.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== `#${tab}`) {
      window.history.replaceState(null, '', `#${tab}`);
    }
  }, [tab]);

  // Respond to hash changes (back/forward, manual edit).
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onHash = () => setTab(TAB_FROM_HASH(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EBEAE9' }}>
      <main id="main-content" tabIndex={-1} className="max-w-5xl mx-auto px-4 sm:px-6 py-12 focus:outline-none">
        <header className="mb-10">
          <p className="text-civil-red-body text-sm font-light font-mono mb-2">
            Civil Rights History Project · RAG demo
          </p>
          <h1
            className="text-stone-900 text-3xl sm:text-4xl md:text-5xl font-medium mb-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Explore the embeddings
          </h1>
          <p
            className="text-stone-700 text-base sm:text-lg max-w-2xl"
            style={{ fontFamily: 'Source Serif 4, serif' }}
          >
            Every passage in this archive lives at a point in a 1024-dimensional embedding space.
            Two interviewees who never met but whose words land within 0.12 cosine of each other
            on a topic are nearby in that space. This page surfaces three ways to query and
            visualize those connections.
          </p>
          {stats && (
            <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-700">
              <div>
                <dt className="font-medium text-stone-900 inline">{stats.interviews}</dt>{' '}
                <span>interviews indexed</span>
              </div>
              <div>
                <dt className="font-medium text-stone-900 inline">~{Math.round(stats.chunks / 1000)}K</dt>{' '}
                <span>time-anchored passages</span>
              </div>
              <div>
                <dt className="font-medium text-stone-900 inline">{Object.keys(stats.tiers).length}-tier</dt>{' '}
                <span>audit substrate</span>
              </div>
              <div>
                <span className="text-stone-600">
                  {stats.tiers.low || 0} low · {stats.tiers.medium || 0} medium ·{' '}
                  {stats.tiers['publication-block'] || 0} pub-block ·{' '}
                  {stats.tiers['not-auditable'] || 0} not-auditable ·{' '}
                  {stats.tiers['ingestion-only'] || 0} ingestion-only
                </span>
              </div>
            </dl>
          )}
        </header>

        <nav aria-label="Demo tabs" className="border-b border-stone-300 mb-8">
          <ul className="flex flex-wrap gap-1 list-none p-0">
            {[
              { id: 'search', label: 'Semantic search' },
              { id: 'quote', label: 'Quote-finder' },
              { id: 'map', label: 'Embedding-space map' },
              { id: 'related', label: 'Related interviewees' },
            ].map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setTab(t.id)}
                  aria-pressed={tab === t.id}
                  className={
                    'min-h-11 px-4 py-2 text-sm font-medium border-b-2 transition-colors ' +
                    (tab === t.id
                      ? 'border-red-700 text-stone-900'
                      : 'border-transparent text-stone-600 hover:text-stone-900')
                  }
                  style={{ fontFamily: 'Chivo Mono, monospace' }}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section className="mb-12">
          {tab === 'search' && (
            <div>
              <h2
                className="text-stone-900 text-xl font-medium mb-2"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Search the archive
              </h2>
              <p className="text-sm text-stone-600 mb-6">
                Type a natural-language query. Voyage AI&apos;s retrieval-tuned model embeds the
                query, Pinecone returns the top candidates, and Voyage rerank-2 reranks them.
                Each result links to the Library of Congress catalog entry and lists the exact
                timestamp range in the original audio.
              </p>
              <SemanticSearch
                placeholder="e.g. nonviolence as theology vs. tactic"
                topN={8}
              />
            </div>
          )}

          {tab === 'quote' && (
            <div>
              <QuoteFinder />
            </div>
          )}

          {tab === 'map' && (
            <div>
              <h2
                className="text-stone-900 text-xl font-medium mb-2"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Embedding-space map
              </h2>
              <p className="text-sm text-stone-600 mb-6 max-w-2xl">
                A 2D projection of all 136 interview centroids via PCA on their average chunk
                embeddings. The layout is dependency-free and approximate — UMAP would give a
                richer view — but it&apos;s already enough to show thematic clustering: hover a
                dot to see whose voice lives there.
              </p>
              <Constellation width={720} height={720} />
            </div>
          )}

          {tab === 'related' && (
            <div>
              <h2
                className="text-stone-900 text-xl font-medium mb-2"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Related interviewees
              </h2>
              <p className="text-sm text-stone-600 mb-6 max-w-2xl">
                For each interview, we precompute which other interviewees in the corpus discuss
                semantically-related material. Pick an interview from the list to see the
                top-related voices — interviewees who never met but whose words cluster in the
                embedding space.
              </p>
              <label className="block text-sm text-stone-700 mb-2">
                Interview:
                <select
                  value={relatedEntry}
                  onChange={(e) => setRelatedEntry(Number(e.target.value))}
                  className="ml-2 px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900"
                >
                  {RELATED_DEMO_ENTRIES.map((e) => (
                    <option key={e.number} value={e.number}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-6">
                <RelatedPassages entryNumber={relatedEntry} mode="entries" limit={8} />
              </div>
            </div>
          )}
        </section>

        <footer className="text-xs text-stone-500 border-t border-stone-200 pt-6">
          <p className="mb-1">
            Substrate: Pinecone Builder (civil-rights index) + Voyage AI voyage-3 embeddings +
            rerank-2. The /retrieve Netlify Function proxies live queries; the
            constellation reads a precomputed JSON at /rag/constellation.json. See{' '}
            <code className="font-mono">rag/INTERACTIVE_FEATURES_DESIGN.md</code> in the repo
            for the full architecture.
          </p>
        </footer>
      </main>
    </div>
  );
}
