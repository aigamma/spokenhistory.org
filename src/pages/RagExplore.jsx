import { useState } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  SemanticSearch,
  QuoteFinder,
  Constellation,
} from '../components/rag';

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
export default function RagExplore() {
  useDocumentTitle('Explore the embeddings');
  const [tab, setTab] = useState('search');

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
        </header>

        <nav aria-label="Demo tabs" className="border-b border-stone-300 mb-8">
          <ul className="flex flex-wrap gap-1 list-none p-0">
            {[
              { id: 'search', label: 'Semantic search' },
              { id: 'quote', label: 'Quote-finder' },
              { id: 'map', label: 'Embedding-space map' },
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
