import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  SemanticSearch,
  QuoteFinder,
  Constellation,
  RelatedPassages,
  PolyphonicEvents,
  ConceptSpectrum,
  FamousNames,
  ThemesBrowser,
  GeographicAtlas,
  InfluenceList,
  QuoteOfTheDay,
  TourPages,
} from '../components/rag';
import { TIER_VOCABULARY, TIER_BADGE } from '../components/rag/tiers';

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
const TABS = [
  'search', 'quote', 'map', 'related',
  'events', 'spectrum', 'names', 'themes',
  'atlas', 'network', 'tours', 'quote-of-day',
];

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
// Default tab when no ?tab= param is provided. The Concept-axes demo
// is the most visually striking "what the embedding space thinks" view,
// so it becomes the page's headline destination.
const DEFAULT_TAB = 'spectrum';
const VALID_TAB = (t) => (TABS.includes(t) ? t : DEFAULT_TAB);

// Display order for the pill nav. Featured demos (★) come first,
// then the visualizations, then text-input demos, then secondary tabs.
const TAB_ORDER = [
  { id: 'spectrum', label: 'Concept axes', featured: true },
  { id: 'events', label: 'Polyphonic events', featured: true },
  { id: 'map', label: 'Constellation' },
  { id: 'related', label: 'Voices in conversation' },
  { id: 'search', label: 'Semantic search' },
  { id: 'quote', label: 'Quote-finder' },
  { id: 'themes', label: 'Themes' },
  { id: 'names', label: 'Famous names' },
  { id: 'atlas', label: 'Atlas' },
  { id: 'network', label: 'Network' },
  { id: 'tours', label: 'Tours' },
  { id: 'quote-of-day', label: 'Quote of the day' },
];

// Human-readable label per tab id. Used for the dynamic document title
// (so the browser-tab label changes when the user navigates between
// demos) and for the in-page section heading. Keep in sync with the
// tab buttons in <nav> below.
const TAB_LABELS = {
  search: 'Semantic search',
  quote: 'Quote-finder',
  events: 'Polyphonic events',
  spectrum: 'Concept axes',
  map: 'Constellation',
  related: 'Voices in conversation',
  themes: 'Themes',
  names: 'Famous names',
  atlas: 'Atlas',
  network: 'Network',
  tours: 'Tours',
  'quote-of-day': 'Quote of the day',
};

export default function RagExplore() {
  const stats = useCorpusStats();
  // The app uses HashRouter, so window.location.hash is consumed by
  // the router itself (e.g. /#/rag-explore?tab=search&q=foo). Reading
  // window.location.hash returns "#/rag-explore?tab=search&q=foo" — not
  // useful as a tab anchor. Use React Router's useSearchParams() to
  // read the tab from a ?tab= query param inside the router's path.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState(() => VALID_TAB(tabParam));
  const [relatedEntry, setRelatedEntry] = useState(RELATED_DEMO_ENTRIES[0].number);

  // Dynamic title: "Explore the embeddings · <active tab>". The
  // user-visible feedback when navigating from a menu link is otherwise
  // a single tab-pill highlight change deep in the page; surfacing the
  // active demo in the document title makes the navigation legible in
  // browser-tab/history UI too.
  useDocumentTitle(`Explore the embeddings · ${TAB_LABELS[tab] || tab}`);

  // React to navigation that changes the tab query param (Links from
  // other pages or browser back/forward).
  useEffect(() => {
    const nextTab = VALID_TAB(tabParam);
    if (nextTab !== tab) setTab(nextTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  // Keep ?tab= synced when the user clicks a tab on this page, so
  // the URL stays bookmarkable. Don't touch other query params (e.g.
  // ?q= used by SemanticSearch).
  useEffect(() => {
    if (searchParams.get('tab') === tab) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Make the tab change *loud*. Previously a user arriving via a menu
  // link landed at the top of the page and had to scroll past the
  // intro/stats block to notice that the only thing that changed was
  // a tab body halfway down the page. Now we scroll the tab-content
  // section into view whenever the tab changes (menu nav, in-page tab
  // click, or browser back/forward). On the very first mount we only
  // scroll if the URL explicitly chose a tab — direct visits to
  // /rag-explore (no ?tab=) still land on the page intro.
  const sectionRef = useRef(null);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (!sectionRef.current) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (tabParam) {
        sectionRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
      return;
    }
    sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EBEAE9' }}>
      <main id="main-content" tabIndex={-1} className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 focus:outline-none">
        {/* Minimal page label. The big "Explore the embeddings" hero
            block (paragraph, stats, tier pills) moved to the bottom of
            the page so the demo content is above the fold and the tab
            change is impossible to miss when navigating from the menu. */}
        <p className="text-civil-red-body text-xs font-light font-mono mb-4 tracking-wide uppercase">
          (Embedded Data)
        </p>

        <nav
          aria-label="Demo tabs"
          className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-4 mb-8 backdrop-blur"
          style={{ backgroundColor: 'rgba(235, 234, 233, 0.94)' }}
        >
          <ul className="flex flex-wrap gap-2 sm:gap-2.5 list-none p-0">
            {TAB_ORDER.map((t) => {
              const isActive = tab === t.id;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setTab(t.id)}
                    aria-pressed={isActive}
                    className={
                      'inline-flex items-center min-h-11 px-4 sm:px-5 py-2 rounded-full border-2 text-sm sm:text-base font-medium transition-all ' +
                      (isActive
                        ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                        : t.featured
                          ? 'bg-white text-stone-900 border-stone-900 hover:bg-stone-900 hover:text-white'
                          : 'bg-white text-stone-700 border-stone-300 hover:border-stone-900 hover:text-stone-900')
                    }
                    style={{ fontFamily: 'Chivo Mono, monospace' }}
                  >
                    {t.featured && (
                      <span aria-hidden="true" className="mr-1.5 text-red-600">
                        ★
                      </span>
                    )}
                    {t.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section ref={sectionRef} className="mb-16 scroll-mt-4">
          {tab === 'search' && (
            <div>
              <h2
                className="text-stone-900 text-2xl sm:text-3xl font-medium mb-3"
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
                className="text-stone-900 text-2xl sm:text-3xl font-medium mb-3"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Constellation of 136 interviews
              </h2>
              <p className="text-sm text-stone-600 mb-6 max-w-2xl">
                Each dot is one interview. The AI places two dots close together when it judges
                the two interviews cover similar things, and far apart when it judges them
                different — even when the speakers never met. The x and y axes themselves
                don&apos;t measure anything specific; think of it as a map where only distance
                matters, not direction. Larger dots are longer interviews; color shows our
                audit-confidence tier. <strong>Hover</strong> for a name, <strong>click</strong>
                {' '}to see the other interviews most like it.
              </p>
              <Constellation
                width={720}
                height={720}
                onSelect={(point) => {
                  if (point?.entry_number != null) {
                    setRelatedEntry(point.entry_number);
                    setTab('related');
                  }
                }}
              />
            </div>
          )}

          {tab === 'related' && (
            <div>
              <h2
                className="text-stone-900 text-2xl sm:text-3xl font-medium mb-3"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Voices in conversation
              </h2>
              <p className="text-sm text-stone-600 mb-6 max-w-2xl">
                For each interview, we precompute which other interviewees in the corpus discuss
                semantically-related material. Pick an interview from the list — or click a dot
                on the Embedding-space map — to see the top-related voices.
              </p>
              <label className="block text-sm text-stone-700 mb-2">
                Interview:
                <select
                  value={
                    RELATED_DEMO_ENTRIES.some((e) => e.number === relatedEntry)
                      ? relatedEntry
                      : ''
                  }
                  onChange={(e) => setRelatedEntry(Number(e.target.value))}
                  className="ml-2 px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900"
                >
                  {!RELATED_DEMO_ENTRIES.some((e) => e.number === relatedEntry) && relatedEntry != null && (
                    <option value="">From constellation: entry #{relatedEntry}</option>
                  )}
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

          {tab === 'events' && (
            <div>
              <h2 className="text-stone-900 text-xl font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Polyphonic event pages
              </h2>
              <PolyphonicEvents />
            </div>
          )}

          {tab === 'spectrum' && (
            <div>
              <h2 className="text-stone-900 text-xl font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Concept-axis spectrum
              </h2>
              <ConceptSpectrum />
            </div>
          )}

          {tab === 'themes' && (
            <div>
              <h2 className="text-stone-900 text-xl font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Thematic clusters
              </h2>
              <ThemesBrowser />
            </div>
          )}

          {tab === 'names' && (
            <div>
              <h2 className="text-stone-900 text-xl font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Famous figures (not in corpus)
              </h2>
              <FamousNames />
            </div>
          )}

          {tab === 'atlas' && (
            <div>
              <h2 className="text-stone-900 text-xl font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Geographic atlas
              </h2>
              <GeographicAtlas />
            </div>
          )}

          {tab === 'network' && (
            <div>
              <h2 className="text-stone-900 text-xl font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Influence network
              </h2>
              <InfluenceList />
            </div>
          )}

          {tab === 'tours' && (
            <div>
              <h2 className="text-stone-900 text-xl font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Curated tours
              </h2>
              <TourPages />
            </div>
          )}

          {tab === 'quote-of-day' && (
            <div>
              <h2 className="text-stone-900 text-xl font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Quote of the day
              </h2>
              <p className="text-sm text-stone-600 mb-6 max-w-2xl">
                One quote rotates per day from 30 curated passages drawn from low/medium-tier audited interviews. Pre-curated; no LLM call per request. Click &quot;Next →&quot; to cycle.
              </p>
              <QuoteOfTheDay />
            </div>
          )}
        </section>

        {/* About this demo — content that previously sat above the
            tab nav (intro paragraph, corpus stats, tier badges). Moved
            here so the demo content can be the first thing visitors
            see; the framing reads as a postscript rather than a wall
            of text. */}
        <aside className="mt-20 mb-12 border-t border-stone-300 pt-10">
          <p className="text-civil-red-body text-sm font-light font-mono mb-2">
            Civil Rights History Project · RAG demo
          </p>
          <h2
            className="text-stone-900 text-2xl sm:text-3xl font-medium mb-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            About this page
          </h2>
          <p
            className="text-stone-700 text-base sm:text-lg max-w-2xl"
            style={{ fontFamily: 'Source Serif 4, serif' }}
          >
            Every passage in this archive lives at a point in a 1024-dimensional embedding space.
            Two interviewees who never met but whose words land within 0.12 cosine of each other
            on a topic are nearby in that space. This page surfaces several ways to query and
            visualize those connections.
          </p>
          {stats && (
            <div className="mt-6 space-y-3">
              <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-700">
                <div>
                  <dt className="font-medium text-stone-900 inline">{stats.interviews}</dt>{' '}
                  <span>interviews indexed</span>
                </div>
                <div>
                  <dt className="font-medium text-stone-900 inline">~{Math.round(stats.chunks / 1000)}K</dt>{' '}
                  <span>time-anchored passages</span>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2 text-xs">
                {TIER_VOCABULARY.map((key) => {
                  const badge = TIER_BADGE[key];
                  return (
                    <span
                      key={key}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${badge.bg} ${badge.border} ${badge.text}`}
                    >
                      <span className="font-medium tabular-nums">{stats.tiers[key] || 0}</span>
                      <span>{key}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

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
