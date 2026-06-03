/**
 * @fileoverview PeopleCatalog, the /people route.
 *
 * The primary experience of the merged "People and Interviews" section.
 * One place browses BOTH the oral-history interviewees and the historic
 * figures they discuss. Loads the precomputed public/rag/people/index.json
 * once (~50KB) and renders a search/filter-able grid of cards.
 *
 * Card routing (2026-06-02 merge): an interviewee card links straight to
 * its interview page (/interview/${entry_number}), which is that person's
 * home and already layers in the bio, the AI's reading, the verbatim
 * snippets, the sources, and the clips. A historic-figure card links to
 * its reference page (/person/${slug}), since those figures were never
 * interviewed and have no interview page of their own.
 *
 * The FamousNames panel (historic figures the interviewees discuss but who
 * were not themselves interviewed) is mounted here too, after the grid, so
 * the whole "People and Interviews" surface lives on one page.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, FileText, Users, UserCircle } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Footer from '../components/common/Footer';
import FamousNames from '../components/rag/FamousNames';
import { TIER_COLORS } from '../components/rag/tiers';

export default function PeopleCatalog() {
  useDocumentTitle('People and Interviews');
  const [index, setIndex] = useState(null);
  const [tiersByEntry, setTiersByEntry] = useState(null);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  // Seed the type filter from ?type= so the "Interviews & People" toggle can
  // deep-link straight to the historic figures the interviewees discuss
  // (Dustin, 2026-06-02). Only the known filter values are honored.
  const [typeFilter, setTypeFilter] = useState(() => {
    const t = searchParams.get('type');
    return t === 'interviewee' || t === 'external_figure' ? t : 'all';
  });
  const [sortBy, setSortBy] = useState('surname');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/rag/people/index.json').then((r) => (r.ok ? r.json() : Promise.reject(new Error('index not found')))),
      fetch('/rag/constellation.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([j, constellation]) => {
        if (cancelled) return;
        setIndex(j);
        if (constellation?.points) {
          const map = {};
          for (const p of constellation.points) {
            map[p.entry_number] = p.uncertainty_tier || null;
          }
          setTiersByEntry(map);
        }
      })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  const allEntries = useMemo(() => {
    if (!index?.by_slug) return [];
    const list = Object.values(index.by_slug).slice();
    if (sortBy === 'entry') {
      // Sort by CRHP entry_number (interviewees first), externals last.
      return list.sort((a, b) => {
        const an = Number.isFinite(a.entry_number) ? a.entry_number : Infinity;
        const bn = Number.isFinite(b.entry_number) ? b.entry_number : Infinity;
        if (an !== bn) return an - bn;
        return (a.display_name || '').localeCompare(b.display_name || '');
      });
    }
    if (sortBy === 'name') {
      return list.sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));
    }
    // Default: surname (last word of display_name).
    return list.sort((a, b) => {
      const la = (a.display_name || '').split(/\s+/).slice(-1)[0]?.toLowerCase() || '';
      const lb = (b.display_name || '').split(/\s+/).slice(-1)[0]?.toLowerCase() || '';
      if (la !== lb) return la.localeCompare(lb);
      return (a.display_name || '').localeCompare(b.display_name || '');
    });
  }, [index, sortBy]);

  const filtered = useMemo(() => {
    let list = allEntries;
    if (typeFilter !== 'all') list = list.filter((p) => p.person_type === typeFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.display_name || '').toLowerCase().includes(s) ||
          (p.role_preview || '').toLowerCase().includes(s),
      );
    }
    return list;
  }, [allEntries, search, typeFilter]);

  const counts = useMemo(() => {
    if (!index?.counts) return null;
    return index.counts;
  }, [index]);

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-[#EBEAE9] dark:bg-zinc-900">
        <p className="text-stone-700">Catalog index not yet generated. {error}</p>
      </div>
    );
  }
  if (!index) {
    return (
      <div className="min-h-screen p-8 bg-[#EBEAE9] dark:bg-zinc-900">
        <p className="text-stone-700" role="status">Loading the catalog...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBEAE9] dark:bg-zinc-900">
      <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 py-12 focus:outline-none">
        <header className="mb-8">
          <p className="text-civil-red-body text-sm font-light font-mono mb-2">
            Civil Rights History Project · People and Interviews
          </p>
          <h1
            className="text-stone-900 text-3xl sm:text-4xl md:text-5xl font-medium mb-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            People and Interviews
          </h1>
          <p className="text-stone-700 max-w-3xl">
            One place to browse the {counts ? counts.interviewees : ''} oral-history interviewees and the {counts ? counts.external_figures : ''} historic figures they discuss. An interviewee card opens their interview page, which carries the bio, the AI&apos;s reading of their embedding signature, verbatim snippets, sources, and the time-anchored clips. A historic-figure card opens a reference page for a person the interviewees name but who was not interviewed.
          </p>
        </header>

        {/* "Interviews & People" section toggle (Dustin, 2026-06-02): the People
            catalog is the people side of the merged section; this links back to
            the interviews view. The All / Interviewees / Historic Figures filter
            below switches within the people. */}
        <nav className="flex flex-wrap items-center gap-2 mb-6 text-sm" aria-label="Interviews and People views">
          <Link to="/table-of-contents" className="px-3 py-1.5 rounded-full border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors">
            Interviews
          </Link>
          <span aria-current="page" className="px-3 py-1.5 rounded-full border border-civil-red-strong bg-red-50 text-civil-red-body font-medium">
            People
          </span>
        </nav>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or role..."
              className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              aria-label="Search catalog by name or role"
            />
          </div>
          <div className="flex items-center gap-1 text-sm" role="radiogroup" aria-label="Filter by person type">
            {[
              { key: 'all', label: 'All' },
              { key: 'interviewee', label: 'Interviewees' },
              { key: 'external_figure', label: 'Historic Figures' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={typeFilter === key}
                onClick={() => setTypeFilter(key)}
                className={
                  'px-3 py-1.5 rounded-full text-sm border transition-colors ' +
                  (typeFilter === key
                    ? 'border-civil-red-strong bg-red-50 text-civil-red-body'
                    : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:hover:bg-zinc-800')
                }
              >
                {label}
              </button>
            ))}
          </div>
          <label className="text-sm text-stone-700 flex items-center gap-1">
            Sort:
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="ml-1 px-2 py-1 border border-stone-300 rounded-md bg-white text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              aria-label="Sort catalog by"
            >
              <option value="surname">By surname</option>
              <option value="name">By full name</option>
              <option value="entry">By CRHP entry</option>
            </select>
          </label>
          <span className="text-sm text-stone-500">{filtered.length} shown</span>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0">
          {filtered.map((p) => {
            // Card destination (2026-06-02 merge): an interviewee with a CRHP
            // entry goes to their interview page, which is their home and
            // already layers in the bio, the AI's reading, the snippets, the
            // sources, and the clips. A historic figure (no interview of their
            // own) goes to their /person reference page.
            const to =
              p.person_type === 'interviewee' && p.entry_number != null
                ? `/interview/${p.entry_number}`
                : `/person/${p.slug}`;
            return (
            <li key={p.slug}>
              <Link
                to={to}
                className="block h-full border border-stone-200 rounded-lg bg-white p-4 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 transition-shadow"
              >
                <div className="flex items-start gap-3">
                  {p.photo_src ? (
                    <img
                      src={p.photo_src}
                      alt={p.photo_kind === 'context' ? (p.photo_alt || 'Related historical image') : ''}
                      title={p.photo_kind === 'context' ? (p.photo_alt || undefined) : undefined}
                      className="w-12 h-12 rounded-md object-cover border border-stone-300 bg-stone-100 shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-md border border-stone-200 bg-stone-50 flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      <UserCircle className="w-7 h-7 text-stone-300" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {p.person_type === 'interviewee' ? (
                        <span title="CRHP interviewee" className="inline-flex items-center text-civil-red-body">
                          <FileText className="w-3 h-3" aria-hidden="true" />
                        </span>
                      ) : (
                        <span title="Historic figure (not interviewed)" className="inline-flex items-center text-stone-500">
                          <Users className="w-3 h-3" aria-hidden="true" />
                        </span>
                      )}
                      <h3 className="text-sm font-medium text-stone-900 truncate">{p.display_name}</h3>
                      {/* Audit-tier dot for interviewees. Color encodes
                          the corpus's uncertainty tier so visitors see
                          at a glance which catalog pages are anchored
                          to publication-grade transcripts vs which
                          carry residual uncertainty. */}
                      {p.person_type === 'interviewee' && p.entry_number != null && tiersByEntry?.[p.entry_number] && (
                        <span
                          className="w-2 h-2 rounded-full border border-stone-300 ml-auto shrink-0"
                          style={{ backgroundColor: TIER_COLORS[tiersByEntry[p.entry_number]] || '#d6d3d1' }}
                          title={`Audit tier: ${tiersByEntry[p.entry_number]}`}
                          aria-label={`Audit tier: ${tiersByEntry[p.entry_number]}`}
                        />
                      )}
                    </div>
                    {(p.born || p.died) && (
                      <p className="text-xs text-stone-500 font-mono mb-1">
                        {p.born ?? '?'}{p.died ? `–${p.died}` : (p.born ? '–' : '')}
                      </p>
                    )}
                    {p.role_preview && (
                      <p className="text-xs text-stone-700 leading-snug">{p.role_preview}</p>
                    )}
                  </div>
                </div>
              </Link>
            </li>
            );
          })}
        </ul>

        {filtered.length === 0 && (
          <p className="text-stone-500 mt-6">No matches. Clear the search or change the filter.</p>
        )}

        {/* Historic figures the interviewees discuss but who were not
            themselves interviewed (2026-06-02 merge): the FamousNames panel
            is mounted here so the whole "People and Interviews" surface lives
            on one page. It is always present in the default view; opening a
            figure shows the passages that mention them and links to their
            reference page. */}
        <section className="mt-14 border-t border-stone-300 pt-10">
          <h2
            className="text-stone-900 text-2xl sm:text-3xl font-medium mb-2"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Historic Figures Discussed in the Archive
          </h2>
          <p className="text-stone-700 max-w-3xl mb-6">
            People the interviewees discuss but who were not themselves interviewed. Open one to read the passages that mention them, each with citation, and to reach their reference page.
          </p>
          <FamousNames />
        </section>
      </main>
    </div>
  );
}
