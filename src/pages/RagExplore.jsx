import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
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
 * Single fetch of /rag/constellation.json (which carries one point per
 * interview with entry_subject, entry_number, uncertainty_tier,
 * entry_provenance, chunk_count). Used in two places:
 *   - Header stats display (interview count, passage count, tier counts)
 *   - Semantic Overlap picker (full alphabetized roster for search)
 *
 * Returning a combined { stats, interviewees } object keeps the fetch
 * to a single request and lets either consumer skip the data while it
 * loads.
 */
function useCorpusData() {
  const [data, setData] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/rag/constellation.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json?.points) return;
        const tiers = {};
        let totalChunks = 0;
        const interviewees = [];
        for (const p of json.points) {
          const t = p.uncertainty_tier || 'unknown';
          tiers[t] = (tiers[t] || 0) + 1;
          totalChunks += p.chunk_count || 0;
          interviewees.push({
            entry_number: p.entry_number,
            entry_subject: p.entry_subject || `Entry #${p.entry_number}`,
          });
        }
        interviewees.sort((a, b) =>
          a.entry_subject.localeCompare(b.entry_subject, 'en', { sensitivity: 'base' })
        );
        setData({
          stats: {
            interviews: json.points.length,
            chunks: totalChunks,
            tiers,
          },
          interviewees,
        });
      })
      .catch(() => { /* swallow, header just falls back to baseline copy */ });
    return () => { cancelled = true; };
  }, []);
  return data;
}

/**
 * RagExplore, landing page for the interactive RAG features layer.
 *
 * Three surfaces on one page, switchable via tabs:
 *
 *   1. Search, live semantic-search box (SemanticSearch component).
 *      Calls /retrieve via Netlify Function. Renders ranked passages
 *      as CitationCards with full primary-source metadata.
 *
 *   2. Quote-finder, paste a half-remembered quote, get the source.
 *      Same retrieval backend, larger textarea, always shows full text.
 *
 *   3. Constellation, 2D PCA scatter of all 136 interview centroids
 *      in embedding space. Click a dot to (someday) jump to the
 *      interview. Loads public/rag/constellation.json.
 *
 * The page is the conference's "philosophy of embedding" demo surface.
 * It is intentionally simple, the goal is to show the substrate
 * works, not to be the final UX.
 */
// Tab IDs are reflected in window.location.hash so URLs like
// /rag-explore#map are shareable and deep-linkable.
const TABS = [
  'quote', 'map', 'related',
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
// Default tab when no ?tab= param is provided. Semantic Overlap is
// the simplest entry point: pick an interview, see which other voices
// in the corpus discuss semantically-related material. The page opens
// with Spectrum at the top (the headline surface) and Semantic Overlap
// below the tab nav so visitors immediately see a worked example of
// cross-interview retrieval without having to choose a query first.
const DEFAULT_TAB = 'related';
// 'spectrum' deep links resolve to the default tab because Spectrum
// is rendered at the page top (always visible), not as a tab. So a
// /rag-explore?tab=spectrum URL gives the user Spectrum (at top) +
// the default surface below the tab nav.
const VALID_TAB = (t) => {
  if (t === 'spectrum') return DEFAULT_TAB;
  return TABS.includes(t) ? t : DEFAULT_TAB;
};

// Pill nav metadata. `featured: true` adds the leading star and a
// heavier border. Spectrum is rendered above the tab nav as the page's
// permanent headline surface, so it does NOT appear in this list.
const TAB_ORDER = [
  { id: 'lenses', label: 'Word Search', featured: true },
  { id: 'map', label: 'Interview Map' },
  { id: 'related', label: 'Semantic Overlap' },
  { id: 'quote', label: 'Quote Finder' },
  { id: 'themes', label: 'Themes' },
  { id: 'names', label: 'Famous Names' },
  { id: 'atlas', label: 'Atlas' },
  { id: 'network', label: 'Network' },
  { id: 'tours', label: 'Tours' },
  { id: 'quote-of-day', label: 'Quote of the Day' },
];

// Group tabs by user intent so visitors see four taxonomies (each
// with a label that teaches what the demos in it are FOR) instead
// of a single flat ten-pill row. Order within each group is rough
// "most useful first." The Spectrum chart at page-top is the
// always-visible relative of the "Concept projection" group.
const TAB_GROUPS = [
  {
    label: 'Concept projection',
    tabs: ['lenses'],
    footnote: 'Spectrum (one-axis lens) is the chart at the top of this page.',
  },
  {
    label: 'Structural maps',
    tabs: ['map', 'themes', 'network', 'atlas'],
  },
  {
    label: 'Find a passage',
    tabs: ['quote', 'related'],
  },
  {
    label: 'Curated reading',
    tabs: ['tours', 'names', 'quote-of-day'],
  },
];

// Human-readable label per tab id. Used for the dynamic document title
// (so the browser-tab label changes when the user navigates between
// demos) and for the in-page section heading. Keep in sync with the
// tab buttons in <nav> below.
const TAB_LABELS = {
  lenses: 'Word Search',
  quote: 'Quote Finder',
  spectrum: 'Spectrum', // retained for back-compat; resolves to default tab
  map: 'Interview Map',
  related: 'Semantic Overlap',
  themes: 'Themes',
  names: 'Famous Names',
  atlas: 'Atlas',
  network: 'Network',
  tours: 'Tours',
  'quote-of-day': 'Quote of the Day',
};

export default function RagExplore() {
  const corpusData = useCorpusData();
  const stats = corpusData?.stats;
  const allInterviewees = corpusData?.interviewees;
  const [searchInput, setSearchInput] = useState('');
  // The app uses HashRouter, so window.location.hash is consumed by
  // the router itself (e.g. /#/rag-explore?tab=search&q=foo). Reading
  // window.location.hash returns "#/rag-explore?tab=search&q=foo", not
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
  // scroll if the URL explicitly chose a tab, direct visits to
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
        {/* Page-level header. Without an h1 the document had no
            top-of-hierarchy heading, and a first-time visitor landed
            on the Spectrum scatter chart with no page-level orientation
            for what /rag-explore IS. Heading hierarchy is now
            h1 (page) > h2 (each section) > h3 (tab-group labels in nav).
            Corpus stats (interview count, passage count, per-tier
            counts) sit immediately below the framing so visitors see
            the substrate's scale + audit-tier vocabulary upfront,
            instead of having to scroll to the bottom aside. */}
        <header className="mb-10">
          <h1
            className="text-stone-900 text-3xl sm:text-4xl font-medium mb-2 leading-tight"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Explore the Embeddings
          </h1>
          <p
            className="text-stone-700 text-base sm:text-lg max-w-3xl"
            style={{ fontFamily: 'Source Serif 4, serif' }}
          >
            Multiple lenses on the 136-interview Civil Rights History Project
            corpus. The chart below places voices along one conceptual axis at
            a time; tabs further down offer structural maps, passage-finding,
            and curated readings of the same embedding substrate.
          </p>
          {stats && (
            <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-2 text-sm text-stone-700">
              <span>
                <span className="font-medium text-stone-900 tabular-nums">{stats.interviews}</span>{' '}
                interviews indexed
              </span>
              <span aria-hidden className="text-stone-400">·</span>
              <span>
                <span className="font-medium text-stone-900 tabular-nums">
                  ~{Math.round(stats.chunks / 1000)}K
                </span>{' '}
                time-anchored passages
              </span>
              <span aria-hidden className="text-stone-400 hidden sm:inline">·</span>
              <ul
                aria-label="Audit-confidence tiers, with the interview count in each"
                className="flex flex-wrap gap-1.5 text-xs list-none p-0 m-0"
              >
                {TIER_VOCABULARY.map((key) => {
                  const badge = TIER_BADGE[key];
                  return (
                    <li key={key}>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${badge.bg} ${badge.border} ${badge.text}`}
                      >
                        <span className="font-medium tabular-nums">{stats.tiers[key] || 0}</span>
                        <span>{key}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </header>

        {/* Spectrum is the page's headline surface. It renders above
            the tab nav so it's always the first thing visitors see;
            tabs below let them explore alternative views without
            displacing the headline. Filtered out of the tab nav below
            since duplicating it as a tab label would be redundant.
            The id is the scroll target for cross-tab "place this
            interviewee on the spectrum" links from elsewhere on the
            page (currently the Semantic Overlap tab). */}
        <section id="spectrum-section" className="mb-8 scroll-mt-28">
          <h2
            className="text-stone-900 text-2xl sm:text-3xl font-medium mb-1"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Spectrum
          </h2>
          <p className="text-sm text-stone-600 mb-4 max-w-3xl">
            136 oral-history interviewees placed along one conceptual axis at a time. The
            position of each dot is the dot product of that interview&apos;s mean embedding
            with the axis vector, geometric, deterministic, no LLM per query. Pick a
            different axis below the chart to swap the lens; type a phrase in the green
            box to project YOUR words onto the same axis.
          </p>
          <ConceptSpectrum />
        </section>

        <nav
          aria-label="Demo tabs"
          className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-4 mb-8 backdrop-blur border-t border-stone-300/50"
          style={{ backgroundColor: 'rgba(235, 234, 233, 0.94)' }}
        >
          <p className="text-xs text-stone-500 mb-3 font-mono uppercase tracking-wide">
            Pick a demo. Grouped by what each one does.
          </p>
          <div className="space-y-2.5">
            {TAB_GROUPS.map((group) => {
              const groupId = `tabgroup-${group.label.toLowerCase().replace(/\s+/g, '-')}`;
              return (
                <div
                  key={group.label}
                  role="group"
                  aria-labelledby={groupId}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2"
                >
                  <h3
                    id={groupId}
                    className="text-[0.7rem] uppercase tracking-wider font-semibold text-stone-700 font-mono whitespace-nowrap min-w-[7.5rem] sm:basis-32 sm:flex-shrink-0"
                  >
                    {group.label}
                  </h3>
                  <ul className="flex flex-wrap gap-2 sm:gap-2.5 list-none p-0 m-0">
                    {group.tabs.map((tabId) => {
                      const t = TAB_ORDER.find((x) => x.id === tabId);
                      if (!t) return null;
                      const isActive = tab === t.id;
                      return (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => setTab(t.id)}
                            aria-pressed={isActive}
                            className={
                              'inline-flex items-center min-h-11 px-4 sm:px-5 py-2 rounded-full border-2 text-sm sm:text-base font-medium transition-all ' +
                              // Three visual states with WCAG AA contrast at the
                              // pills' text size (text-sm / text-base, font-medium):
                              //   Active  = civil-red-strong fill (#B23E2F) +
                              //             white text -> 4.57:1, AA compliant.
                              //   Hover   = light-red wash background + dark red
                              //             text + dark red border. text-stone-900
                              //             stays on background to keep contrast
                              //             high; civil-red-strong border + ring
                              //             signals the hover affordance.
                              //   Default = white bg, stone text, stone border
                              //             (heavier for featured).
                              (isActive
                                ? 'bg-civil-red-strong text-white border-civil-red-strong shadow-md ring-2 ring-red-300'
                                : t.featured
                                  ? 'bg-white text-stone-900 border-stone-900 hover:bg-red-50 hover:border-civil-red-strong hover:text-civil-red-strong hover:ring-2 hover:ring-red-200'
                                  : 'bg-white text-stone-700 border-stone-300 hover:bg-red-50 hover:border-civil-red-strong hover:text-civil-red-strong hover:ring-2 hover:ring-red-200')
                            }
                            style={{ fontFamily: 'Chivo Mono, monospace' }}
                          >
                            {t.featured && (
                              <span aria-hidden="true" className={'mr-1.5 ' + (isActive ? 'text-yellow-200' : 'text-civil-red-strong')}>
                                ★
                              </span>
                            )}
                            {t.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {group.footnote && (
                    <p className="text-xs italic text-stone-500 basis-full sm:basis-auto sm:ml-2 mt-0">
                      {group.footnote}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        <section ref={sectionRef} className="mb-16 scroll-mt-28">
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
                Interview Map
              </h2>
              <InterviewMap />
            </div>
          )}

          {/* Legacy Constellation block, kept gated on a never-true
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
                For each interview, we precompute which other interviewees in the corpus
                discuss semantically-related material. Pick a suggested interview below, or
                search by name to choose from any of the {allInterviewees?.length || 136}.
              </p>

              {/* Picker: six hand-curated quick picks at top, then a
                  full-corpus search input with a datalist of every
                  interviewee. Clicking a quick pick or following a
                  related-passage link clears the search input (since
                  those are alternate selection sources), but typing /
                  picking from the search itself preserves the typed
                  value so the visitor can see what they queried. The
                  active entry's name is also visible in the
                  RelatedPassages heading below. */}
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wide font-mono text-stone-500 mb-2">
                  Suggested
                </p>
                <ul className="flex flex-wrap gap-2 mb-4 list-none p-0">
                  {RELATED_DEMO_ENTRIES.map((e) => {
                    const isActive = relatedEntry === e.number;
                    return (
                      <li key={e.number}>
                        <button
                          type="button"
                          onClick={() => {
                            setRelatedEntry(e.number);
                            setSearchInput('');
                          }}
                          aria-pressed={isActive}
                          className={
                            'inline-flex items-center min-h-9 px-3 py-1.5 text-sm rounded-full border-2 transition-colors ' +
                            (isActive
                              ? 'border-civil-red-strong bg-red-50 text-stone-900 font-medium'
                              : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50')
                          }
                        >
                          {e.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <label className="block text-sm text-stone-700">
                  Or search by name:
                  <input
                    type="text"
                    list="interviewee-names"
                    placeholder={
                      allInterviewees
                        ? `e.g. ${allInterviewees[Math.floor(allInterviewees.length / 2)]?.entry_subject ?? 'Diane Nash'}`
                        : 'Loading roster…'
                    }
                    value={searchInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchInput(value);
                      // The datalist options are formatted "Name (#N)". When the user
                      // selects one (or types the full text), this regex extracts the
                      // entry number and jumps to that interview.
                      const numMatch = value.match(/\(#(\d+)\)$/);
                      if (numMatch) {
                        setRelatedEntry(Number(numMatch[1]));
                      }
                    }}
                    className="mt-1 block w-full sm:w-96 px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 focus:border-civil-red-strong focus:outline-none focus:ring-2 focus:ring-red-200"
                  />
                </label>
                {allInterviewees && (
                  <datalist id="interviewee-names">
                    {allInterviewees.map((e) => (
                      <option key={e.entry_number} value={`${e.entry_subject} (#${e.entry_number})`} />
                    ))}
                  </datalist>
                )}
              </div>

              {/* Cross-tab affordance. The same person can be looked at
                  through Concept Spectrum's lens (one axis at a time) by
                  setting ?spectrumEntry=N; the Spectrum chart at the top
                  of the page reads that param and selects the dot. */}
              {relatedEntry != null && (
                <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-2 text-sm">
                  <span className="text-stone-600">Currently exploring:</span>
                  <span className="font-medium text-stone-900">
                    {allInterviewees?.find((e) => e.entry_number === relatedEntry)?.entry_subject ||
                      `Entry #${relatedEntry}`}
                  </span>
                  <span aria-hidden className="text-stone-400">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = new URLSearchParams(searchParams);
                      next.set('tab', 'related');
                      next.set('spectrumEntry', String(relatedEntry));
                      setSearchParams(next, { replace: false });
                      document
                        .getElementById('spectrum-section')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-civil-red-body hover:underline focus:outline-none focus-visible:underline font-medium"
                  >
                    Also place on the Concept Spectrum &uarr;
                  </button>
                </div>
              )}

              <div className="mt-6">
                <RelatedPassages
                  entryNumber={relatedEntry}
                  mode="entries"
                  limit={16}
                  onNavigateToEntry={(n) => {
                    setRelatedEntry(n);
                    setSearchInput('');
                  }}
                />
              </div>
            </div>
          )}


          {tab === 'lenses' && (
            <div>
              <h2 className="text-stone-900 text-2xl sm:text-3xl font-medium mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                Word Search
              </h2>
              <p className="text-sm text-stone-600 mb-6 max-w-2xl">
                UMAP and PCA put the corpus into 2D, but their axes mean
                nothing, they&apos;re just &ldquo;directions of max variance.&rdquo;
                This view does the opposite: four scatters, each with axes
                that are <em>named human concepts</em> (nonviolence vs.
                armed self-defense, sacred vs. secular framing, etc.).
                Hover any voice in one chart and watch the same person
                land at a different coordinate in the other three, that
                shift is what the embedding space is actually telling us.
              </p>
              <ConceptMatrix />
            </div>
          )}

          {/* Spectrum is rendered at the page top now, not as a tab.
              The 'spectrum' tab id is still in the TABS list so deep
              links like /rag-explore?tab=spectrum don't 404, they
              just don't render a second copy here. The DEFAULT_TAB
              is 'related' so the page opens with Spectrum (top) +
              Semantic Overlap (below tab nav) by default. */}

          {tab === 'themes' && (
            <div>
              <h2 className="text-stone-900 text-xl font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Thematic Clusters
              </h2>
              <ThemesBrowser />
            </div>
          )}

          {tab === 'names' && (
            <div>
              <h2 className="text-stone-900 text-xl font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Famous Figures (Not in Corpus)
              </h2>
              <FamousNames />
            </div>
          )}

          {tab === 'atlas' && (
            <div>
              <h2 className="text-stone-900 text-xl font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Geographic Atlas
              </h2>
              <GeographicAtlas />
            </div>
          )}

          {tab === 'network' && (
            <div>
              <h2 className="text-stone-900 text-xl font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Influence Network
              </h2>
              <InfluenceList />
            </div>
          )}

          {tab === 'tours' && (
            <div>
              <h2 className="text-stone-900 text-xl font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Curated Tours
              </h2>
              <TourPages />
            </div>
          )}

          {tab === 'quote-of-day' && (
            <div>
              <h2 className="text-stone-900 text-xl font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Quote of the Day
              </h2>
              <p className="text-sm text-stone-600 mb-6 max-w-2xl">
                One quote rotates per day from 30 curated passages drawn from low/medium-tier audited interviews. Pre-curated; no LLM call per request. Click &quot;Next →&quot; to cycle.
              </p>
              <QuoteOfTheDay />
            </div>
          )}
        </section>

        {/* About this demo, content that previously sat above the
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
            About This Page
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

          {/* Corpus stats + tier badges that previously sat here are
              now rendered in the page-top <header>, where a first-time
              visitor sees them BEFORE scrolling past Spectrum + every
              demo tab. AuditProvenance stays in this aside as the
              deeper "why you can trust the substrate" credentialing. */}
          <AuditProvenance />
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
