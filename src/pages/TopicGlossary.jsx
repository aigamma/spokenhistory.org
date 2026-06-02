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
import { Play } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Footer from '../components/common/Footer';

// Major recurring themes drawn from the David Cline interview framework
// (Dustin, 2026-05-30). Cline, the lead interviewer and scholar for the
// Civil Rights History Project, identified these as the narratives that run
// across the collection. Each is a curated entry point into a playlist of
// clips. Keyword counts were verified against the clip index before wiring.
// Each theme carries a one-line blurb shown in the orientation panel when the
// card is opened (Dustin, 2026-06-02), so a visitor reads what the theme covers
// before the playlist loads. Blurbs are factual and archive-grounded (no
// evaluative adjectives), per the project's narration discipline.
const MAJOR_THEMES = [
  { name: 'Family and Community', kw: 'family', blurb: 'How households, kin networks, and neighborhoods shaped interviewees before and during the movement.' },
  { name: 'Growing Up Under Jim Crow', kw: 'segregation', blurb: 'Childhood and daily life under legal segregation, recalled by the people who lived it.' },
  { name: 'Education and Schools', kw: 'school', blurb: 'Segregated and desegregating schools, the teachers inside them, and the fight for equal education.' },
  { name: 'Emmett Till and Generational Memory', kw: 'emmett till', blurb: 'How the 1955 murder of Emmett Till is remembered across the interviews and carried between generations.' },
  { name: 'Youth and Student Activism', kw: 'student', blurb: 'Students and young people organizing sit-ins, marches, and voter drives.' },
  { name: 'Faith and the Church', kw: 'church', blurb: 'The place of churches, faith, and clergy in sustaining the movement.' },
  { name: 'Voter Registration and Local Organizing', kw: 'voter registration', blurb: 'Registering Black voters and building local movement organizations, county by county.' },
  { name: 'Violence and State Repression', kw: 'violence', blurb: 'Encounters with white-supremacist violence, police, and state power.' },
  { name: 'Military Service', kw: 'military', blurb: 'Military service and its ties to civil-rights consciousness and organizing.' },
  { name: 'Migration', kw: 'migration', blurb: 'Movement between South and North and the communities that migration built.' },
  { name: 'Music and Culture', kw: 'music', blurb: 'Freedom songs, music, and cultural expression within the movement.' },
  { name: 'High School Activists', kw: 'high school', blurb: 'High-school-age participants and the role of secondary schools in local movements.' },
  { name: 'Churches as Organizing Spaces', kw: 'mass meeting', blurb: 'Mass meetings and the use of churches as gathering and organizing spaces.' },
  { name: 'Media and the Movement', kw: 'press', blurb: 'The press, photography, and how coverage shaped the movement and its memory.' },
  { name: 'Funding the Movement', kw: 'funding', blurb: 'How local movements and organizations were financed and sustained.' },
  { name: 'Local Movement Stories', kw: 'community', blurb: 'Community-level accounts of organizing that the national narrative often leaves out.' },
  { name: 'Coming of Age in the Movement', kw: 'childhood', blurb: 'Interviewees who grew up inside the movement and came of age within it.' },
];

export default function TopicGlossary() {
  useDocumentTitle('Table of Contents');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [essays, setEssays] = useState(null);
  // The major theme the visitor has opened for orientation. Clicking a theme
  // card opens a short explanation plus a Play button here, BEFORE the playlist
  // loads (Dustin, 2026-06-02), instead of jumping straight to the playlist.
  const [selectedTheme, setSelectedTheme] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/summaries/clusters.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  // Curated-essays index, loaded defensively so the Topics page links through
  // to /essays. If the catalog is absent the section simply does not render.
  useEffect(() => {
    let cancelled = false;
    fetch('/rag/essays/index.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled) setEssays(j); })
      .catch(() => {});
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
      <div className="min-h-screen p-8 bg-[#EBEAE9] dark:bg-zinc-900">
        <p className="text-stone-700">Topic glossary not yet available. {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBEAE9] dark:bg-zinc-900">
      <main id="main-content" tabIndex={-1} className="max-w-5xl mx-auto px-4 sm:px-6 py-12 focus:outline-none">
        <header className="mb-8">
          <p className="text-civil-red-body text-sm font-light font-mono mb-2">
            Civil Rights History Project · Thematic browse
          </p>
          <h1
            className="text-stone-900 text-3xl sm:text-4xl md:text-5xl font-medium mb-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Table of Contents
          </h1>
          <p
            className="text-stone-700 text-base sm:text-lg max-w-3xl"
            style={{ fontFamily: 'Source Serif 4, serif' }}
          >
            A guide to the major stories and recurring themes across the collection:
            childhood under segregation, family and community, the movement&apos;s turning
            points, local organizing, faith, violence, and memory. Each topic gathers
            interviewees whose testimony returns to the same subjects, even when they
            never met. Open one to read what connects it and to play a stream of clips
            from the voices inside it.
          </p>
        </header>

        <section className="mb-10" aria-label="Major themes in the collection">
          <h2 className="text-stone-900 text-xl font-medium mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Major Themes in the Collection
          </h2>
          <p className="text-sm text-stone-600 mb-4 max-w-3xl">
            The recurring narratives that run across the interviews, the throughlines the
            project&apos;s lead interviewer identified. Open one to read what it covers, then
            play a stream of clips drawn from every voice that returns to it.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 list-none p-0">
            {MAJOR_THEMES.map((t) => {
              const active = selectedTheme?.kw === t.kw;
              return (
                <li key={t.kw}>
                  <button
                    type="button"
                    onClick={() => setSelectedTheme(active ? null : t)}
                    aria-pressed={active}
                    className={
                      'flex items-center gap-2 w-full h-full text-left rounded-md border p-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 ' +
                      (active
                        ? 'border-civil-red-strong bg-red-50'
                        : 'border-stone-200 bg-white hover:border-civil-red-strong hover:bg-red-50')
                    }
                  >
                    <Play className="w-4 h-4 text-civil-red-strong shrink-0" aria-hidden="true" />
                    <span className="text-sm font-medium text-stone-900">{t.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Orientation panel (Dustin, 2026-06-02): a short explanation of the
              opened theme and a Play button, shown before the playlist loads so
              the visitor knows what they are about to hear. */}
          {selectedTheme && (
            <div className="mt-3 rounded-md border border-civil-red-strong bg-white p-4">
              <h3 className="text-lg font-medium text-stone-900 mb-1">{selectedTheme.name}</h3>
              <p className="text-sm text-stone-700 mb-4 max-w-3xl" style={{ fontFamily: 'Source Serif 4, serif' }}>
                {selectedTheme.blurb}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to={`/playlist-builder?keywords=${encodeURIComponent(selectedTheme.kw)}&label=${encodeURIComponent(selectedTheme.name)}`}
                  className="inline-flex items-center gap-1.5 min-h-11 px-4 py-2 text-sm rounded-md bg-civil-red-strong text-white font-medium hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  <Play className="w-4 h-4" aria-hidden="true" />
                  Play this playlist
                </Link>
                <Link
                  to="/table-of-contents"
                  className="inline-flex items-center min-h-11 px-1 text-sm text-civil-red-body hover:underline"
                >
                  Or browse the interviews
                </Link>
              </div>
            </div>
          )}
        </section>

        {essays?.topics?.length > 0 && (
          <section className="mb-10" aria-label="Curated essays">
            <h2 className="text-stone-900 text-xl font-medium mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              Curated Essays
            </h2>
            <p className="text-sm text-stone-600 mb-4 max-w-3xl">
              Public-domain and openly-licensed essays that illuminate these themes, reproduced in full with full
              citation and license. Open one to read it and to follow its links into the oral histories.
            </p>
            <ul className="flex flex-wrap gap-2 list-none p-0">
              {essays.topics.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/essays?topic=${encodeURIComponent(t.id)}`}
                    className="inline-flex items-center rounded-full border border-stone-200 bg-white px-3 py-1 text-sm text-stone-700 hover:border-civil-red-strong hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  >
                    {t.label} <span className="ml-1 text-stone-400">({t.essay_count})</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/essays"
                  className="inline-flex items-center rounded-full border border-civil-red-strong bg-white px-3 py-1 text-sm text-civil-red-body hover:bg-red-50 transition-colors"
                >
                  All essays
                </Link>
              </li>
            </ul>
          </section>
        )}

        <div className="mb-6">
          <input
            type="search"
            placeholder="Search by topic, description, or interviewee…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 focus:border-civil-red-strong focus:ring-2 focus:ring-civil-red-strong/30 outline-none transition-colors"
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
                  className="w-full text-left p-4 hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors"
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
                    {/* Each topic leads to a playlist (Dustin, 2026-05-30):
                        play a stream of clips from every interview in the
                        topic, via the static playlist on member entry numbers. */}
                    {(c.members || []).some((m) => m.entry_number != null) && (
                      <p className="mb-3">
                        <Link
                          to={`/playlist-builder?entries=${c.members.map((m) => m.entry_number).filter((n) => n != null).join(',')}&label=${encodeURIComponent(c.name)}`}
                          className="inline-flex items-center gap-1.5 min-h-11 px-4 py-2 text-sm rounded-md bg-civil-red-strong text-white font-medium hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                        >
                          <Play className="w-4 h-4" aria-hidden="true" />
                          Play clips from these {c.members.length} interviews
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
                                to={`/table-of-contents?q=${encodeURIComponent(name)}`}
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

      </main>
    </div>
  );
}
