/**
 * @fileoverview TopicGlossary, the Table of Contents: the primary entry into
 * the archive (Dustin, 2026-06-02 afternoon).
 *
 * The page opens with a search bar, then a structured overview, then a nested,
 * book-style table of contents: broad Themes as sections, with specific
 * Playlists nested beneath, each Playlist linking directly to its stream of
 * clips on the static playlist page. The taxonomy is the single source of truth
 * in src/data/archiveThemes.js (shared with the playlist page's Related
 * Playlists logic). The page is kept strictly to interviews and playlists; the
 * earlier curated-essays and cluster sections were removed (essays live at
 * /essays; the data-driven clusters live on /rag-explore).
 *
 * Naming note: this page routes at /topic-glossary but is labeled "Table of
 * Contents" in the nav. The per-interview chapter index keeps the stable
 * /table-of-contents route and is reached from People & Interviews (and linked
 * at the foot of this page). Routes were left stable because many in-app deep
 * links target them.
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Search } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { THEMES, playlistHref } from '../data/archiveThemes';

export default function TopicGlossary() {
  useDocumentTitle('Table of Contents');
  const [search, setSearch] = useState('');

  // Filter the book by the search text. A theme matched by its own name or
  // blurb keeps all of its playlists; otherwise only the playlists whose name
  // or blurb match are kept. Each surviving section carries the theme's
  // original index so the numbering stays stable while filtering.
  const sections = useMemo(() => {
    const s = search.trim().toLowerCase();
    const out = [];
    THEMES.forEach((theme, index) => {
      if (!s) {
        out.push({ theme, index, playlists: theme.playlists });
        return;
      }
      const themeHit =
        theme.name.toLowerCase().includes(s) ||
        (theme.blurb || '').toLowerCase().includes(s);
      const playlists = theme.playlists.filter(
        (p) =>
          themeHit ||
          p.name.toLowerCase().includes(s) ||
          (p.blurb || '').toLowerCase().includes(s),
      );
      if (playlists.length) out.push({ theme, index, playlists });
    });
    return out;
  }, [search]);

  const totalPlaylists = useMemo(
    () => THEMES.reduce((n, t) => n + t.playlists.length, 0),
    [],
  );
  const shownPlaylists = sections.reduce((n, s) => n + s.playlists.length, 0);

  return (
    <div className="min-h-screen bg-[#EBEAE9] dark:bg-zinc-900">
      <main
        id="main-content"
        tabIndex={-1}
        className="max-w-4xl mx-auto px-4 sm:px-6 py-12 focus:outline-none"
      >
        <header className="mb-6">
          <p className="text-civil-red-body text-sm font-light font-mono mb-2">
            Civil Rights History Project · Table of Contents
          </p>
          <h1
            className="text-stone-900 dark:text-stone-100 text-3xl sm:text-4xl md:text-5xl font-medium mb-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Table of Contents
          </h1>
          <p
            className="text-stone-700 dark:text-stone-300 text-base sm:text-lg max-w-3xl"
            style={{ fontFamily: 'Source Serif 4, serif' }}
          >
            The primary way into the archive. The collection is laid out as a book:
            broad themes, each holding a set of playlists. Open a playlist to watch a
            stream of time-anchored clips drawn from the interviews. Search to jump to
            a theme or playlist, or browse the contents below.
          </p>
        </header>

        {/* Search first (Dustin, 2026-06-02 afternoon). */}
        <div className="mb-8">
          <label htmlFor="toc-search" className="sr-only">
            Search themes and playlists
          </label>
          <div className="relative">
            <Search
              className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="toc-search"
              type="search"
              placeholder="Search themes and playlists…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded-md bg-white text-stone-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 focus:border-civil-red-strong focus:ring-2 focus:ring-civil-red-strong/30 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Structured overview: the themes as quick jump-links (the book's
            section list). Hidden while searching, when the filtered list below
            is the more useful view. */}
        {!search.trim() && (
          <nav aria-label="Themes in the collection" className="mb-10">
            <h2 className="text-stone-900 dark:text-stone-100 text-sm font-semibold uppercase tracking-wide font-mono mb-3">
              Contents
            </h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 list-none p-0 m-0">
              {THEMES.map((theme, i) => (
                <li key={theme.id} className="flex items-baseline gap-2">
                  <span className="text-civil-red-body font-mono text-sm tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <a
                    href={`#theme-${theme.id}`}
                    className="text-stone-800 dark:text-stone-200 hover:text-civil-red-body hover:underline"
                  >
                    {theme.name}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {search.trim() && (
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
            {shownPlaylists} of {totalPlaylists} playlists
          </p>
        )}

        {/* The nested book: each theme is a section, its playlists nested beneath,
            every playlist linking directly to its stream of clips. */}
        <div className="space-y-10">
          {sections.map(({ theme, index, playlists }) => (
            <section
              key={theme.id}
              id={`theme-${theme.id}`}
              className="scroll-mt-24"
              aria-labelledby={`theme-${theme.id}-h`}
            >
              <div className="border-b border-stone-300 dark:border-zinc-700 pb-2 mb-4">
                <h2
                  id={`theme-${theme.id}-h`}
                  className="text-stone-900 dark:text-stone-100 text-2xl sm:text-3xl font-medium flex items-baseline gap-3"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <span className="text-civil-red-body font-mono text-lg tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {theme.name}
                </h2>
                {theme.blurb && (
                  <p
                    className="mt-1 text-stone-600 dark:text-stone-400 text-base max-w-3xl"
                    style={{ fontFamily: 'Source Serif 4, serif' }}
                  >
                    {theme.blurb}
                  </p>
                )}
              </div>
              <ul className="space-y-2 list-none p-0">
                {playlists.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={playlistHref(p)}
                      className="group flex items-start gap-3 rounded-md border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 hover:border-civil-red-strong hover:bg-red-50 dark:hover:bg-zinc-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 transition-colors"
                    >
                      <span className="mt-0.5 shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 dark:bg-zinc-700 group-hover:bg-civil-red-strong transition-colors">
                        <Play
                          className="w-4 h-4 text-civil-red-strong group-hover:text-white"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-stone-900 dark:text-stone-100">
                          {p.name}
                        </span>
                        {p.blurb && (
                          <span
                            className="block mt-0.5 text-sm text-stone-600 dark:text-stone-400"
                            style={{ fontFamily: 'Source Serif 4, serif' }}
                          >
                            {p.blurb}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {sections.length === 0 && (
            <p className="text-stone-600 dark:text-stone-400">
              No themes or playlists match that search.
            </p>
          )}
        </div>

        {/* The per-interview chapter index and the people catalog live under
            People & Interviews now; keep them reachable from the archive's front door. */}
        <div className="mt-12 pt-6 border-t border-stone-300 dark:border-zinc-700">
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Looking for a specific person or interview?{' '}
            <Link to="/people" className="text-civil-red-body hover:underline">
              Browse People and Interviews
            </Link>{' '}
            or{' '}
            <Link to="/table-of-contents" className="text-civil-red-body hover:underline">
              open the full interview index
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
