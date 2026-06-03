import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Play, Clock, FileText, ChevronLeft, ChevronRight, List, UserCircle, Sparkles } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Footer from '../components/common/Footer';
import LocVideoEmbed from '../components/LocVideoEmbed';
import ShareButton from '../components/ShareButton';
import { TIER_COLORS } from '../components/rag/tiers';
import { COLLECTION_NAME, findPlaylist, relatedPlaylists, playlistHref } from '../data/archiveThemes';

/**
 * StaticPlaylist, the /playlist-builder route.
 *
 * Replaces the old Firestore-backed PlaylistBuilder, which renders nothing
 * because Firestore holds no content (the site runs on the static /rag/
 * substrate). Every chapter in pipeline_output is a clip in
 * /rag/playlist_index.json; this page filters that index by the URL query
 * and plays the matching clips with LocVideoEmbed (bounded to each clip's
 * start/end so a clip plays just its passage, then the next one is one
 * click away).
 *
 * Query params (all optional; first match wins):
 *   ?keywords=emmett till   clips whose text matches the phrase (the ~50
 *                           "explore X" links on Home and elsewhere use this)
 *   ?topic=Family History   clips in one pipeline topic category
 *   ?entry=1                all chapters of one interview, in order
 *   ?q=...                  alias for keywords
 *
 * This is the spine of "everything leads to a playlist": topics, events,
 * people, and places can all link here and land the visitor on real clips
 * and the interviews behind them. Re-run scripts/build_playlist_index.py to
 * regenerate the clip set after a re-chapterization pass.
 *
 * Vocabulary (Dustin, 2026-06-02 afternoon): the site standardizes on
 * Collection > Theme > Playlist > Video Clips. This page renders one Playlist
 * (its Theme is named in the breadcrumb when the playlist belongs to the
 * curated taxonomy in src/data/archiveThemes.js) made of Video Clips, and the
 * "Related Playlists" block offers two close siblings plus one cross-theme pick.
 */

function fmtDuration(startSec, endSec) {
  if (startSec == null || endSec == null || endSec <= startSec) return null;
  const total = Math.round(endSec - startSec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function tokenize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function fmtMinutes(sec) {
  const m = Math.round((sec || 0) / 60);
  if (m < 1) return 'under a minute';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h} hr ${rem} min` : `${h} hr`;
}

// Curated default ordering (Dustin, 2026-06-02): group a result set by interview
// (entry_number), order the groups by how many clips each contributes to this
// filter (most first), then by entry number, and keep chapter order within a
// group. This clusters each interviewee's clips together (so a run from one
// voice reads as a group) and surfaces the interviews that speak most to the
// filter first, replacing the old alphabetical default that always put Aaron
// Dixon (entry 1) at the top.
function curatedOrder(hits) {
  const groups = new Map();
  for (const c of hits) {
    const k = c.entry_number;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(c);
  }
  for (const arr of groups.values()) {
    arr.sort((a, b) => (a.chapter_number || 0) - (b.chapter_number || 0));
  }
  return [...groups.entries()]
    .sort((a, b) => (b[1].length - a[1].length) || (a[0] - b[0]))
    .flatMap(([, arr]) => arr);
}

export default function StaticPlaylist() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keywords = (searchParams.get('keywords') || searchParams.get('q') || '').trim();
  const topic = (searchParams.get('topic') || '').trim();
  const entryParam = searchParams.get('entry');
  const entriesParam = (searchParams.get('entries') || '').trim();
  const labelParam = (searchParams.get('label') || '').trim();
  // ?play=<entry>_<startSeconds> selects one clip in the filtered list, so a
  // shared playlist link reopens on the exact clip rather than the first one.
  const playParam = (searchParams.get('play') || '').trim();

  const [index, setIndex] = useState(null);
  // Person catalog index, loaded for the interviewee portrait thumbnails in the
  // clip-list group headers (the playlist index itself carries no images).
  const [peopleIndex, setPeopleIndex] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(0);
  const [userInitiated, setUserInitiated] = useState(false);
  // Clip-relative playback fraction (0..1) of the ACTIVE clip, fed by
  // LocVideoEmbed's onProgress, drives the thin bar pinned to the active card.
  const [progress, setProgress] = useState(0);
  const listRef = useRef(null);

  const heading = topic
    ? topic
    : entryParam
      ? null // resolved to the interview subject once data loads
      : keywords || 'All Clips';
  useDocumentTitle(`Playlist${heading ? ` · ${heading}` : ''}`);

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/playlist_index.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('playlist index not found'))))
      .then((j) => { if (!cancelled) setIndex(j); })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  // People catalog (portraits), loaded defensively: a miss just leaves the
  // group-header thumbnails on the icon fallback.
  useEffect(() => {
    let cancelled = false;
    fetch('/rag/people/index.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled && j) setPeopleIndex(j); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Reset selection + autoplay gate whenever the query changes.
  useEffect(() => { setSelected(0); setUserInitiated(false); setProgress(0); }, [keywords, topic, entryParam, entriesParam]);
  // Clear the progress bar whenever the active clip changes, so a new card
  // starts empty rather than inheriting the previous clip's fill.
  useEffect(() => { setProgress(0); }, [selected]);

  const clips = useMemo(() => {
    if (!index?.clips) return [];
    const all = index.clips;
    if (entryParam) {
      const n = Number(entryParam);
      return all
        .filter((c) => c.entry_number === n)
        .sort((a, b) => (a.chapter_number || 0) - (b.chapter_number || 0));
    }
    if (entriesParam) {
      const set = new Set(
        entriesParam.split(',').map((x) => Number(x.trim())).filter((x) => !Number.isNaN(x)),
      );
      return all
        .filter((c) => set.has(c.entry_number))
        .sort((a, b) => (a.entry_number - b.entry_number) || ((a.chapter_number || 0) - (b.chapter_number || 0)));
    }
    if (topic) {
      const t = topic.toLowerCase();
      return curatedOrder(all.filter((c) => (c.topic_category || '').toLowerCase() === t));
    }
    if (keywords) {
      const phrase = keywords.toLowerCase();
      const words = tokenize(keywords);
      const textOf = (c) =>
        `${c.title || ''} ${c.summary || ''} ${(c.keywords || []).join(' ')} ${(c.related_events || []).join(' ')} ${c.topic_category || ''} ${c.subject || ''}`.toLowerCase();
      // Primary: whole-phrase substring. Fallback: every query word present.
      let hits = all.filter((c) => textOf(c).includes(phrase));
      if (hits.length === 0 && words.length > 0) {
        hits = all.filter((c) => {
          const text = textOf(c);
          return words.every((w) => text.includes(w));
        });
      }
      return curatedOrder(hits);
    }
    return curatedOrder(all);
  }, [index, keywords, topic, entryParam, entriesParam]);

  // Playlist-level metrics (Dustin, 2026-06-02): interviewee count, total
  // listening time, and the subtopics present, computed from the filtered set.
  const stats = useMemo(() => {
    const entries = new Set();
    let totalSec = 0;
    const topicCounts = new Map();
    for (const c of clips) {
      entries.add(c.entry_number);
      const d = (c.end_seconds || 0) - (c.start_seconds || 0);
      if (d > 0) totalSec += d;
      const tc = c.topic_category;
      if (tc) topicCounts.set(tc, (topicCounts.get(tc) || 0) + 1);
    }
    const subtopics = [...topicCounts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
    return { interviewees: entries.size, totalSec, subtopics };
  }, [clips]);
  // Other topics present in this playlist, each linking to its own playlist
  // (Dustin's "related topics below the player"); excludes the current topic.
  const relatedTopics = stats.subtopics
    .filter((t) => !topic || t.toLowerCase() !== topic.toLowerCase())
    .slice(0, 6);

  // Related Playlists (Dustin, 2026-06-02 afternoon): two closely related
  // playlists (siblings in this playlist's theme) plus one unexpected but
  // relevant (the lead playlist of another theme), for lateral discovery. When
  // the current view is not a taxonomy playlist (a cluster-derived ?entries=
  // selection, say), fall back to the topics present in this set, each opening
  // its own playlist.
  const relatedPlaylistItems = (() => {
    const rel = relatedPlaylists({ label: labelParam, topic, keywords });
    if (rel) {
      const items = rel.close.map((p) => ({
        key: `close-${p.id}`,
        to: playlistHref(p),
        label: p.name,
        title: `Closely related, from ${p.themeName}`,
        unexpected: false,
      }));
      if (rel.surprise) {
        items.push({
          key: `surprise-${rel.surprise.id}`,
          to: playlistHref(rel.surprise),
          label: rel.surprise.name,
          title: `An unexpected connection, from ${rel.surprise.themeName}`,
          unexpected: true,
        });
      }
      return items;
    }
    return relatedTopics.map((t) => ({
      key: `topic-${t}`,
      to: `/playlist-builder?topic=${encodeURIComponent(t)}&label=${encodeURIComponent(t)}`,
      label: t,
      title: 'A topic that recurs in this playlist',
      unexpected: false,
    }));
  })();

  // Featured Clips (Dustin, 2026-06-02): the first clip of each of the first 3
  // distinct interviews in curated order, so the panel opens with 3 diverse,
  // representative voices rather than three clips from the same interview.
  // These are indices INTO the single `clips` array (where entry_number first
  // changes), so playing one keeps the "Clip X of N" counter correct; we never
  // build a second clips array. Only meaningful when the list is long enough to
  // warrant a split (clips.length > 6); below that the list is short enough to
  // read whole and the Featured section is hidden.
  const featuredIndices = useMemo(() => {
    if (clips.length <= 6) return [];
    const out = [];
    let prevEntry = null;
    for (let i = 0; i < clips.length && out.length < 3; i++) {
      const e = clips[i].entry_number;
      if (e !== prevEntry) {
        out.push(i);
        prevEntry = e;
      }
    }
    return out;
  }, [clips]);

  // Interviewee portrait for a group-header thumbnail. The playlist index has no
  // images, so this reads the person catalog (by_entry -> photo_src, or via the
  // entry's slug into by_slug), the same source the People catalog and interview
  // pages use. Falls back to a poster on the playlist index if a future build
  // adds one, then to null (the header then shows a UserCircle icon).
  const posterFor = (entryNumber) => {
    const be = peopleIndex?.by_entry?.[entryNumber];
    if (be?.photo_src) return be.photo_src;
    const slug = be?.slug;
    const bs = slug ? peopleIndex?.by_slug?.[slug] : null;
    if (bs?.photo_src) return bs.photo_src;
    const v = index?.videos?.[entryNumber];
    return (v && (v.poster || v.poster_url || v.image)) || null;
  };

  // Restore the shared clip (?play=<entry>_<startSeconds>) once the filtered
  // clips exist, so a shared link lands on that clip instead of the first.
  useEffect(() => {
    if (!playParam || clips.length === 0) return;
    const [a, b] = playParam.split('_');
    const pe = Number(a);
    const ps = Number(b);
    if (Number.isNaN(pe) || Number.isNaN(ps)) return;
    const idx = clips.findIndex(
      (c) => c.entry_number === pe && Math.round(c.start_seconds || 0) === Math.round(ps),
    );
    if (idx >= 0) setSelected(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clips, playParam]);

  const subjectForEntry = entryParam && index?.videos?.[entryParam]?.subject;
  // The H1 is the Playlist's name; the breadcrumb above it names the object as a
  // Playlist (and its Theme when known), so the title itself stays a plain name.
  const titleText = labelParam
    ? labelParam
    : entriesParam
      ? 'Selected Interviews'
      : topic
        ? topic
        : entryParam
          ? `${subjectForEntry || `Interview #${entryParam}`}: Chapter Playlist`
          : keywords
            ? `“${keywords}”`
            : 'All Video Clips';

  // Situate this playlist in the Collection > Theme > Playlist hierarchy so the
  // breadcrumb can name its theme; null for cluster-derived or ad-hoc views.
  const currentTheme = findPlaylist({ label: labelParam, topic, keywords });

  const current = clips[selected];

  const playClip = (i) => {
    setSelected(i);
    setUserInitiated(true);
    const c = clips[i];
    if (c) {
      const params = new URLSearchParams(searchParams);
      params.set('play', `${c.entry_number}_${Math.round(c.start_seconds || 0)}`);
      setSearchParams(params, { replace: true });
    }
  };

  // Absolute share URL for one clip: the current filter plus a ?play= pointing
  // at that clip, so the recipient reopens this playlist on this segment.
  const clipShareUrl = (c) => {
    const params = new URLSearchParams(searchParams);
    params.set('play', `${c.entry_number}_${Math.round(c.start_seconds || 0)}`);
    return `/playlist-builder?${params.toString()}`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#EBEAE9] dark:bg-zinc-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <p className="text-stone-700">The playlist index is not available yet. {error}</p>
          <Link to="/interview-index" className="text-civil-red-body hover:underline">Browse all interviews instead</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBEAE9] dark:bg-zinc-900">
      <main id="main-content" tabIndex={-1} className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 focus:outline-none">
        <header className="mb-6">
          {/* Breadcrumb situating this object in the Collection > Theme >
              Playlist hierarchy (Dustin, 2026-06-02 afternoon). The Theme is
              named when the playlist belongs to the curated taxonomy. */}
          <p className="text-civil-red-body text-sm font-light font-mono mb-2">
            {COLLECTION_NAME}
            {currentTheme?.theme?.name ? ` · ${currentTheme.theme.name}` : ''}
            {' · Playlist'}
          </p>
          <h1 className="text-stone-900 text-2xl sm:text-3xl md:text-4xl font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            {titleText}
          </h1>
          {index && clips.length > 0 && (
            <div className="text-sm text-stone-600">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span><span className="font-medium text-stone-900 tabular-nums">{clips.length}</span> {clips.length === 1 ? 'video clip' : 'video clips'}</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span><span className="font-medium text-stone-900 tabular-nums">{stats.interviewees}</span> {stats.interviewees === 1 ? 'interviewee' : 'interviewees'}</span>
                {stats.totalSec > 0 && (
                  <>
                    <span aria-hidden="true" className="text-stone-300">·</span>
                    <span><span className="font-medium text-stone-900 tabular-nums">{fmtMinutes(stats.totalSec)}</span> total</span>
                  </>
                )}
              </p>
              {stats.subtopics.length > 0 && (
                <p className="mt-1 text-stone-500">Subtopics: {stats.subtopics.slice(0, 5).join(', ')}</p>
              )}
            </div>
          )}
          {index && clips.length === 0 && (
            <p className="text-sm text-stone-600">No video clips match this yet.</p>
          )}
        </header>

        {!index && <p className="text-stone-600" role="status">Loading clips...</p>}

        {index && clips.length === 0 && (
          <div className="rounded-lg border border-stone-200 bg-white p-6">
            <p className="text-stone-700 mb-3">No video clips match this yet.</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link to="/interview-index" className="text-civil-red-body hover:underline">Browse all interviews</Link>
              <Link to="/topic-glossary" className="text-civil-red-body hover:underline">Browse topics</Link>
            </div>
          </div>
        )}

        {index && clips.length > 0 && current && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Player + now-playing detail */}
            <div className="lg:col-span-2">
              <LocVideoEmbed
                key={`${current.entry_number}-${current.start_seconds}`}
                entryNumber={current.entry_number}
                startSeconds={current.start_seconds || 0}
                endSeconds={current.end_seconds || undefined}
                autoPlay={userInitiated}
                onClipEnd={() => { if (selected < clips.length - 1) playClip(selected + 1); }}
                onProgress={setProgress}
              />

              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide font-mono text-stone-500 mb-1">
                  Video Clip {selected + 1} of {clips.length}
                  {fmtDuration(current.start_seconds, current.end_seconds) && (
                    <span className="ml-2 inline-flex items-center gap-1 text-stone-600">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {fmtDuration(current.start_seconds, current.end_seconds)}
                    </span>
                  )}
                </p>
                <h2 className="text-stone-900 text-xl font-medium mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {current.title}
                </h2>
                <p className="text-sm text-stone-600 mb-3">
                  From the interview with <span className="font-medium text-stone-800">{current.subject}</span>
                </p>
                {current.summary && (
                  <p className="text-sm text-stone-700 leading-relaxed mb-4 max-w-2xl">{current.summary}</p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => playClip(Math.max(0, selected - 1))}
                    disabled={selected === 0}
                    className="inline-flex items-center gap-1 min-h-11 px-3 py-2 text-sm rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Previous clip
                  </button>
                  <button
                    type="button"
                    onClick={() => playClip(Math.min(clips.length - 1, selected + 1))}
                    disabled={selected === clips.length - 1}
                    className="inline-flex items-center gap-1 min-h-11 px-3 py-2 text-sm rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next clip <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                  {/* The full interview is the destination, this is the
                      interview-forward link Dustin asked to fix: it points
                      at the working static interview page, not the empty
                      Firestore player. */}
                  <Link
                    to={`/interview/${current.entry_number}?t=${current.start_seconds || 0}`}
                    className="inline-flex items-center gap-1.5 min-h-11 px-4 py-2 text-sm rounded-md bg-civil-red-strong text-white font-medium hover:opacity-90"
                  >
                    <FileText className="w-4 h-4" aria-hidden="true" />
                    Watch the Full Interview
                  </Link>
                  {/* Share this clip: the link reopens the playlist on this
                      exact segment. getUrl reads the live filter + selection. */}
                  <ShareButton
                    variant="button"
                    label="Share this clip"
                    title={current.title}
                    className="min-h-11"
                    getUrl={() => clipShareUrl(current)}
                  />
                </div>
              </div>

              {/* Patterns across this playlist (Dustin, 2026-06-02): a concise,
                  text-only read (no charts) on who is in it and what recurs,
                  plus related topics that open their own playlists. */}
              {clips.length > 1 && (
                <div className="mt-6 rounded-md border border-stone-200 bg-white p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide font-mono text-stone-700 mb-2">
                    About This Playlist
                  </h3>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    These {clips.length} clips come from {stats.interviewees} {stats.interviewees === 1 ? 'interviewee' : 'interviewees'}
                    {stats.totalSec > 0 ? ` and run about ${fmtMinutes(stats.totalSec)} in total` : ''}.
                    {stats.subtopics.length > 1 ? ` The subtopics that recur most are ${stats.subtopics.slice(0, 3).join(', ')}.` : ''}
                  </p>
                  {relatedPlaylistItems.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-wide text-stone-500 mb-1.5">Related Playlists</p>
                      <div className="flex flex-wrap gap-2">
                        {relatedPlaylistItems.map((it) => (
                          <Link
                            key={it.key}
                            to={it.to}
                            title={it.title}
                            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-sm text-stone-700 hover:border-civil-red-strong hover:bg-red-50 transition-colors"
                          >
                            {it.unexpected && (
                              <Sparkles className="w-3 h-3 text-civil-red-body" aria-hidden="true" />
                            )}
                            {it.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Clip list (the playlist) */}
            <aside className="lg:col-span-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide font-mono text-stone-700 mb-3 flex items-center gap-1.5">
                <List className="w-4 h-4" aria-hidden="true" />
                In This Playlist
              </h2>

              {/* Featured Clips: 3 diverse representative voices (first clip of
                  the first 3 distinct interviews). Shown only on longer lists;
                  each button plays its index into the single `clips` array so
                  the "Clip X of N" counter stays correct. */}
              {featuredIndices.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide font-mono text-stone-500 mb-2">
                    Featured Video Clips
                  </h3>
                  <ol className="space-y-2 list-none p-0">
                    {featuredIndices.map((i) => {
                      const c = clips[i];
                      const dur = fmtDuration(c.start_seconds, c.end_seconds);
                      const isActive = i === selected;
                      const tier = index.videos?.[c.entry_number]?.tier;
                      return (
                        <li key={`feat-${c.entry_number}-${c.chapter_number}-${i}`} className="relative">
                          <button
                            type="button"
                            onClick={() => playClip(i)}
                            aria-current={isActive ? 'true' : undefined}
                            className={
                              'w-full text-left rounded-md border p-3 transition-colors ' +
                              (isActive
                                ? 'border-civil-red-strong bg-red-50'
                                : 'border-stone-200 bg-white hover:bg-stone-50 dark:hover:bg-zinc-800')
                            }
                          >
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 shrink-0">
                                <Play className={'w-3.5 h-3.5 ' + (isActive ? 'text-civil-red-strong' : 'text-stone-400')} aria-hidden="true" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-stone-900 leading-snug">{c.title}</div>
                                <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                  <span className="truncate">{c.subject}</span>
                                  {dur && (
                                    <span className="inline-flex items-center gap-0.5 tabular-nums">
                                      <Clock className="w-3 h-3" aria-hidden="true" /> {dur}
                                    </span>
                                  )}
                                  {tier && TIER_COLORS[tier] && (
                                    <span
                                      className="w-2 h-2 rounded-full border border-stone-300 shrink-0"
                                      style={{ backgroundColor: TIER_COLORS[tier] }}
                                      title={`Audit tier: ${tier}`}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                          {isActive && (
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-civil-red-strong rounded-b-md transition-[width] duration-150 ease-linear"
                              style={{ width: `${Math.round(progress * 100)}%` }}
                            />
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              <h3 className="text-xs font-semibold uppercase tracking-wide font-mono text-stone-500 mb-2">
                Video Clips
              </h3>
              <ol ref={listRef} className="space-y-2 list-none p-0 max-h-[32rem] overflow-y-auto pr-1">
                {clips.map((c, i) => {
                  const dur = fmtDuration(c.start_seconds, c.end_seconds);
                  const isActive = i === selected;
                  const tier = index.videos?.[c.entry_number]?.tier;
                  // First appearance of an interviewee's run: render a labeled
                  // group header with a sparse thumbnail (poster if the index
                  // has one, otherwise a UserCircle icon). Header rows only,
                  // never per clip, so the run reads as one labeled group.
                  const isGroupStart = i === 0 || clips[i - 1].entry_number !== c.entry_number;
                  const poster = isGroupStart ? posterFor(c.entry_number) : null;
                  return (
                    <li key={`${c.entry_number}-${c.chapter_number}-${i}`} className="relative list-none">
                      {isGroupStart && (
                        <div className="flex items-center gap-2 px-1 pt-2 pb-1">
                          {poster ? (
                            <img
                              src={poster}
                              alt=""
                              aria-hidden="true"
                              className="w-8 h-8 rounded object-cover border border-stone-300 shrink-0"
                            />
                          ) : (
                            <span className="w-8 h-8 rounded border border-stone-300 bg-stone-100 flex items-center justify-center shrink-0">
                              <UserCircle className="w-5 h-5 text-stone-400" aria-hidden="true" />
                            </span>
                          )}
                          <span className="text-xs font-semibold text-stone-700 truncate">{c.subject}</span>
                        </div>
                      )}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => playClip(i)}
                          aria-current={isActive ? 'true' : undefined}
                          className={
                            'w-full text-left rounded-md border p-3 transition-colors ' +
                            (isActive
                              ? 'border-civil-red-strong bg-red-50'
                              : 'border-stone-200 bg-white hover:bg-stone-50 dark:hover:bg-zinc-800')
                          }
                        >
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 shrink-0">
                              <Play className={'w-3.5 h-3.5 ' + (isActive ? 'text-civil-red-strong' : 'text-stone-400')} aria-hidden="true" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-stone-900 leading-snug">{c.title}</div>
                              <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                <span className="truncate">{c.subject}</span>
                                {dur && (
                                  <span className="inline-flex items-center gap-0.5 tabular-nums">
                                    <Clock className="w-3 h-3" aria-hidden="true" /> {dur}
                                  </span>
                                )}
                                {tier && TIER_COLORS[tier] && (
                                  <span
                                    className="w-2 h-2 rounded-full border border-stone-300 shrink-0"
                                    style={{ backgroundColor: TIER_COLORS[tier] }}
                                    title={`Audit tier: ${tier}`}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                        {/* Thin (2px) clip-progress bar pinned to the bottom of
                            the ACTIVE card only, fed by LocVideoEmbed.onProgress
                            (timeupdate). No extra listener, so no added latency. */}
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-civil-red-strong rounded-b-md transition-[width] duration-150 ease-linear"
                            style={{ width: `${Math.round(progress * 100)}%` }}
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
