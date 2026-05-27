import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  SemanticSearch,
  QuoteFinder,
  Constellation,
  RelatedPassages,
  ConceptSpectrum,
  FamousNames,
  ThemesBrowser,
  GeographicAtlas,
  InfluenceList,
  QuoteOfTheDay,
  TourPages,
  ConceptMatrix,
  InterviewMap,
  AuditProvenance,
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
  'spectrum', 'names', 'themes',
  'atlas', 'network', 'tours', 'quote-of-day',
  'lenses',
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
// Default tab when no ?tab= param is provided. Concept lenses is the
// most pedagogically distinctive view we ship — four named-axis pairs
// with cross-chart hover sync, showing the same interviewee at
// different coordinates in different concept spaces. That's the
// "AI takes academic traditions to the next level" demo and earns
// the default slot.
const DEFAULT_TAB = 'lenses';
// 'spectrum' deep links resolve to 'lenses' because Spectrum is now
// rendered at the page top (always visible), not as a tab. So a
// /rag-explore?tab=spectrum URL gives the user Spectrum (at top) +
// Concept Lenses (the next-best surface) below the tab nav.
const VALID_TAB = (t) => {
  if (t === 'spectrum') return DEFAULT_TAB;
  return TABS.includes(t) ? t : DEFAULT_TAB;
};

// Display order for the pill nav. Featured demos (★) come first,
// then the visualizations, then text-input demos, then secondary tabs.
// Spectrum is rendered above the tab nav as the page's permanent
// headline surface, so it does NOT appear in this list. Default tab
// is 'lenses' below — the user gets Spectrum at top + Concept lenses
// matrix below the tab nav, the two strongest views adjacent.
const TAB_ORDER = [
  { id: 'lenses', label: 'Concept lenses', featured: true },
  { id: 'map', label: 'Interview map' },
  { id: 'related', label: 'Semantic Overlap' },
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
  lenses: 'Concept lenses',
  search: 'Semantic search',
  quote: 'Quote-finder',
  spectrum: 'Spectrum', // retained for back-compat; resolves to lenses now
  map: 'Interview map',
  related: 'Semantic Overlap',
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
        {/* Spectrum is the page's headline surface. It renders above
            the tab nav so it's always the first thing visitors see;
            tabs below let them explore alternative views without
            displacing the headline. Filtered out of the tab nav below
            since duplicating it as a tab label would be redundant. */}
        <section className="mb-8">
          <h2
            className="text-stone-900 text-2xl sm:text-3xl font-medium mb-3"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Spectrum
          </h2>
          <ConceptSpectrum />
        </section>

        <nav
          aria-label="Demo tabs"
          className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-4 mb-8 backdrop-blur border-t border-stone-300/50"
          style={{ backgroundColor: 'rgba(235, 234, 233, 0.94)' }}
        >
          <p className="text-xs text-stone-500 mb-2 font-mono uppercase tracking-wide">
            Other ways to look at the data
          </p>
          <ul className="flex flex-wrap gap-2 sm:gap-2.5 list-none p-0">
            {TAB_ORDER.filter((t) => t.id !== 'spectrum').map((t) => {
              const isActive = tab === t.id;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setTab(t.id)}
                    aria-pressed={isActive}
                    className={
                      'inline-flex items-center min-h-11 px-4 sm:px-5 py-2 rounded-full border-2 text-sm sm:text-base font-medium transition-all ' +
                      // Three distinct visual states so active and
                      // hover never look the same (Eric's bug):
                      //   Active    = brand-red solid fill, white text,
                      //               soft brand-red ring shadow.
                      //   Hover     = white background, dark text, brand-red
                      //               border + subtle glow ring.
                      //   Default   = white background, dark/stone text,
                      //               stone border (heavier for featured).
                      (isActive
                        ? 'bg-civil-red-strong text-white border-civil-red-strong shadow-md ring-2 ring-red-200'
                        : t.featured
                          ? 'bg-white text-stone-900 border-stone-900 hover:border-civil-red-strong hover:text-civil-red-strong hover:ring-2 hover:ring-red-100'
                          : 'bg-white text-stone-700 border-stone-300 hover:border-civil-red-strong hover:text-civil-red-strong hover:ring-2 hover:ring-red-100')
                    }
                    style={{ fontFamily: 'Chivo Mono, monospace' }}
                  >
                    {t.featured && (
                      <span aria-hidden="true" className={'mr-1.5 ' + (isActive ? 'text-yellow-200' : 'text-red-600')}>
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

        <section ref={sectionRef} className="mb-16 scroll-mt-28">
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
                Interview map
              </h2>
              <InterviewMap />
            </div>
          )}

          {/* Legacy Constellation block — kept gated on a never-true
              tab id so the component import stays warm but the surface
              is not user-reachable. The old PCA-based Constellation
              gave Eric a "sphere of dots with no axis guidance" UX;
              InterviewMap above replaces it with the Atlas UMAP at
              interview-scale + names labeled + search + empirical
              axis labels. */}
          {tab === '__legacy_constellation_disabled__' && (
            <div>
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
                Semantic Overlap
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


          {tab === 'lenses' && (
            <div>
              <h2 className="text-stone-900 text-2xl sm:text-3xl font-medium mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                Concept lenses
              </h2>
              <p className="text-sm text-stone-600 mb-6 max-w-2xl">
                UMAP and PCA put the corpus into 2D, but their axes mean
                nothing — they&apos;re just "directions of max variance."
                This view does the opposite: four scatters, each with axes
                that are <em>named human concepts</em> (nonviolence vs.
                armed self-defense, sacred vs. secular framing, etc.).
                Hover any voice in one chart and watch the same person
                land at a different coordinate in the other three — that
                shift is what the embedding space is actually telling us.
              </p>
              <ConceptMatrix />
            </div>
          )}

          {/* Spectrum is rendered at the page top now, not as a tab.
              The 'spectrum' tab id is still in the TABS list so deep
              links like /rag-explore?tab=spectrum don't 404 — they
              just don't render a second copy here. The DEFAULT_TAB
              is 'lenses' so the page opens with Spectrum (top) +
              Concept Lenses (below tab nav) by default. */}

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

          <AuditProvenance />
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
