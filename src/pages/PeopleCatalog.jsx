/**
 * @fileoverview "Historical Figures Referenced in Interviews", the /people route.
 *
 * The people the oral-history interviewees name and discuss but who were not
 * themselves interviewed for this collection, presented as rich thumbnail cards
 * that each open a /person/:slug reference page (a biography, the AI's reading of
 * the embedding signature, the verbatim archive passages that mention the figure
 * with citations, cross-links, and sources).
 *
 * History (2026-06-03, Eric's batch):
 *  - The page was "People and Interviews", mixing the 165 interviewees and the
 *    37 historic figures in one thumbnail grid behind an All / Interviewees /
 *    Historic Figures filter, with a separate FamousNames "N voices" panel that
 *    covered only 15 of the 37 figures and did not lead to their reference pages.
 *  - The interviewees moved to the dedicated Interviews page (the chapter index
 *    at /table-of-contents, re-surfaced as a primary nav item). Listing them here
 *    too was redundant clutter, so they were cut.
 *  - This page is now ONLY the historic figures (all 37, the full external-figure
 *    catalog), each card linking to its strong /person reference page. The route
 *    stays /people for link stability; the page and nav label are "Historical
 *    Figures Referenced in Interviews".
 *
 * No orphaning results from cutting the interviewees: the catalog never linked an
 * interviewee to their /person page (it linked them to /interview), so /people was
 * never their inbound path. Every person page, interviewees included, remains
 * reachable from the global command-palette search (federatedSearch normalizes
 * all people to /person/:slug) and from cross-links on other /person pages,
 * essays, and curriculum. The interviewees' primary pages (/interview/:entry) are
 * now MORE prominent via the dedicated Interviews nav item.
 *
 * Data: public/rag/people/index.json (by_slug; the external_figure entries).
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserCircle, ArrowRight } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// Surname = last whitespace-delimited token, lowercased. Only a sort key,
// never displayed.
function surnameOf(name) {
  return (name || '').trim().split(/\s+/).slice(-1)[0]?.toLowerCase() || '';
}

function bySurname(a, b) {
  const la = surnameOf(a.display_name);
  const lb = surnameOf(b.display_name);
  if (la !== lb) return la.localeCompare(lb);
  return (a.display_name || '').localeCompare(b.display_name || '');
}

// Lifespan string. En dash (U+2013) is the correct mark for a numeric range and
// is allowed by the project writing rules (only the em dash U+2014 is banned).
function lifespan(p) {
  if (!p.born && !p.died) return null;
  return `${p.born ?? '?'}${p.died ? `–${p.died}` : (p.born ? '–' : '')}`;
}

export default function PeopleCatalog() {
  useDocumentTitle('Historical Figures Referenced in Interviews');
  const [index, setIndex] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/people/index.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('index not found'))))
      .then((j) => { if (!cancelled) setIndex(j); })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  // Every external-figure catalog entry (each has its own /person page),
  // alphabetical by surname. This is the full set, not the 15-figure subset the
  // retired FamousNames panel used to show.
  const figures = useMemo(() => {
    if (!index?.by_slug) return [];
    return Object.values(index.by_slug).filter((p) => p.person_type === 'external_figure').sort(bySurname);
  }, [index]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return figures;
    return figures.filter(
      (p) =>
        (p.display_name || '').toLowerCase().includes(q) ||
        (p.role_preview || '').toLowerCase().includes(q),
    );
  }, [figures, search]);

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
      <main id="main-content" tabIndex={-1} className="max-w-5xl mx-auto px-4 sm:px-6 py-12 focus:outline-none">
        <header className="mb-8">
          <p className="text-civil-red-body text-sm font-light font-mono mb-2">
            Civil Rights History Project · Historical Figures
          </p>
          <h1
            className="text-stone-900 text-3xl sm:text-4xl md:text-5xl font-medium mb-4 leading-tight"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Historical Figures Referenced in Interviews
          </h1>
          <p className="text-stone-700 max-w-3xl">
            People the oral-history interviewees name and discuss, but who were not themselves interviewed for this collection. Open any figure to reach its reference page: a biography, the AI&apos;s reading of its embedding signature, the verbatim passages from the archive that mention the figure (each with citation and a link to the clip), and the sources behind it. The interviewees themselves are on the{' '}
            <Link to="/table-of-contents" className="text-civil-red-body hover:underline focus:outline-none focus-visible:underline">Interviews</Link>{' '}page.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or role..."
              className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              aria-label="Search historical figures by name or role"
            />
          </div>
          <span className="text-sm text-stone-500">{shown.length} of {figures.length} shown</span>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
          {shown.map((p) => {
            const years = lifespan(p);
            return (
              <li key={p.slug}>
                <Link
                  to={`/person/${p.slug}`}
                  className="group block h-full border border-stone-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 p-4 hover:shadow-md hover:border-stone-300 dark:hover:border-zinc-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 transition-all"
                >
                  <div className="flex items-start gap-3">
                    {p.photo_src ? (
                      <img
                        src={p.photo_src}
                        alt={p.photo_kind === 'context' ? (p.photo_alt || 'Related historical image') : ''}
                        title={p.photo_kind === 'context' ? (p.photo_alt || undefined) : undefined}
                        className="w-16 h-16 rounded-md object-cover border border-stone-300 bg-stone-100 shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-md border border-stone-200 bg-stone-50 flex items-center justify-center shrink-0"
                        aria-hidden="true"
                      >
                        <UserCircle className="w-9 h-9 text-stone-300" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h2 className="text-base font-medium text-stone-900 dark:text-zinc-100 group-hover:text-civil-red-body truncate">
                          {p.display_name}
                        </h2>
                        <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-civil-red-body shrink-0 transition-colors" aria-hidden="true" />
                      </div>
                      {years && (
                        <p className="text-xs text-stone-500 font-mono mb-1 tabular-nums">{years}</p>
                      )}
                      {p.role_preview && (
                        <p className="text-xs text-stone-700 dark:text-zinc-300 leading-snug line-clamp-3">{p.role_preview}</p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {shown.length === 0 && (
          <p className="text-stone-500 mt-2">No figures match. Clear the search to see all {figures.length}.</p>
        )}
      </main>
    </div>
  );
}
