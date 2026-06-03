import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Play, Film } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import LocVideoEmbed from '../components/LocVideoEmbed';
import ShareButton from '../components/ShareButton';
import { TIER_BADGE } from '../components/rag/tiers';
import PlaylistPanel from '../components/PlaylistPanel';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import { PlaylistProvider, usePlaylist } from '../context/PlaylistProvider';
import PlaylistGenerator from '../components/PlaylistGenerator';
import PlaylistLibrary from '../components/PlaylistLibrary';
import { retrieve } from '../services/ragClient';
import {
  fromClipsParam,
  toClipsParam,
  rehydrateClip,
  buildIndexMap,
  buildTocIndex,
  normalizeClip,
  MAX_CLIPS_PER_PLAYLIST,
} from '../utils/clipTokens';

/**
 * TableOfContents, the /table-of-contents page and the site's single
 * "Interviews" surface (Dustin, 2026-05-30; consolidated 2026-05-31;
 * re-surfaced 2026-06-03 as a primary nav item, "Interviews", after the
 * short-lived People/Interviews merge was undone, and pinned to alphabetical
 * order by interviewee name).
 *
 * Every interview in the corpus, collapsed to a single row. Expand one and it
 * opens to its NAMED CHAPTERS, grouped into PARTS so a long interview reads as a
 * handful of scannable parts instead of a wall of chapter titles. Each chapter is
 * a link to its bounded video segment; each part is itself playable as one
 * bounded autoplay run from its first chapter to its last, for a visitor who
 * wants to listen longer than a single chapter.
 *
 * This page absorbed the retired card-grid Interview Index (2026-05-31): each
 * closed row now also shows a one-line biographical capsule and the interview's
 * audit-tier badge, so the collapsed list carries the grid's two useful signals
 * without its redundant second browse surface.
 *
 * The critical performance rule (Dustin: a multi-hour LoC video can freeze for
 * 5+ minutes if you try to buffer the whole thing) is handled by LocVideoEmbed:
 * it seeks to the clip start and range-jumps, fetching only the clip's bytes, and
 * pauses at the clip end. So we always pass startSeconds + endSeconds bounding the
 * chapter or the part, never the whole interview.
 *
 * Data: /rag/toc.json (built by scripts/build_toc.py). Each interview carries
 * { entry, subject, duration_seconds, parts: [{ title, start, end, chapters:
 * [{ title, topic, start, end }] }] }. Times are seconds. An interview that has
 * not been re-chapterized has one part with title === null; we render its
 * chapters flat, without a part header. The capsule comes from
 * /rag/summaries/capsules.json (capsules[entry].capsule) and the tier from
 * /rag/summaries/neighbors.json (neighbors[entry].tier), both keyed by entry.
 */

function fmtClock(s) {
  if (s == null || !isFinite(s)) return '';
  const t = Math.max(0, Math.round(s));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// Clip length, e.g. "3:24", for the chapter/part rows so a visitor sees how long
// the segment runs before clicking (Dustin asked to surface clip duration).
function fmtLen(start, end) {
  const d = (end ?? 0) - (start ?? 0);
  if (!isFinite(d) || d <= 0) return '';
  return fmtClock(d);
}

// Drop the corpus-internal "(PARTIAL)" tag from a display name; a site visitor
// does not need our transcript-completeness bookkeeping.
function cleanName(s) {
  return (s || '').replace(/\s*\(PARTIAL\)\s*$/i, '').trim();
}

// Match a playlist_index clip against a taxonomy query (an exact topic_category
// bucket, or a whole-phrase keyword search over the clip's text), the same
// matching the static playlist page uses, so a generated topic playlist lines
// up with what the topic link would show.
function clipMatchesQuery(c, query) {
  if (query && query.topic) return (c.topic_category || '').toLowerCase() === query.topic.toLowerCase();
  if (query && query.keywords) {
    const phrase = query.keywords.toLowerCase();
    const text =
      `${c.title || ''} ${c.summary || ''} ${(c.keywords || []).join(' ')} ${(c.related_events || []).join(' ')} ${c.topic_category || ''} ${c.subject || ''}`.toLowerCase();
    return text.includes(phrase);
  }
  return false;
}

function TableOfContentsInner() {
  useDocumentTitle('Interviews');
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  // Seed the name filter from ?q= so /table-of-contents?q=Hamer arrives
  // pre-filtered (Topics page and the retired Interview Index both deep-link
  // this way). The input and the URL stay in sync from there.
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [openEntry, setOpenEntry] = useState(null);
  // Per-entry biographical capsule + audit tier, absorbed from the retired
  // card-grid Interview Index. Both maps are keyed by entry number.
  const [capsules, setCapsules] = useState({});
  const [tiers, setTiers] = useState({});
  // The active clip: { entry, start, end, label, nonce }. nonce bumps on every
  // click so the player remounts and re-seeks even when re-selecting the same
  // segment; the mounting click is the user gesture that lets it autoplay.
  const [clip, setClip] = useState(null);
  // Playlist mode (?clips=): the secondary playlist_index.json is loaded lazily
  // only when a playlist is present, for exact clip labels + interviewee names.
  const [plIndex, setPlIndex] = useState(null);
  const {
    working,
    setClips,
    rename,
    removeClip,
    reorder,
    clearWorking,
    saveToLibrary,
    updateLibraryEntry,
    storageAvailable,
  } = usePlaylist();
  // syncedRef holds the ?clips=+title the working playlist currently mirrors, so
  // the URL<->working effects below never re-trigger one another.
  const syncedRef = useRef(null);
  const playlistInitRef = useRef(false);
  // Playlist generation (topic + loose semantic phrase) state.
  const [genBusy, setGenBusy] = useState(false);
  const [genError, setGenError] = useState('');
  const plIndexPromiseRef = useRef(null);
  const playlistSectionRef = useRef(null);
  const playerWrapRef = useRef(null);
  // A shared link can arrive deep: ?entry=12 opens that interview, and an
  // optional &t=/&end= cues a specific chapter or part. Restored once after the
  // data loads (didRestoreRef), so later in-page clicks that rewrite these
  // params never re-trigger the restore.
  const deepEntry = searchParams.get('entry');
  const deepT = searchParams.get('t');
  const deepEnd = searchParams.get('end');
  // Playlist mode: an ordered list of clips encoded in ?clips= (src/utils/clipTokens.js).
  const clipsParam = (searchParams.get('clips') || '').trim();
  const didRestoreRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/rag/toc.json').then((r) => (r.ok ? r.json() : null)),
      // Capsule + tier are enrichment, not load-bearing: a failed fetch leaves
      // the rows without the extra line/badge but the chapter UI still works.
      fetch('/rag/summaries/capsules.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/rag/summaries/neighbors.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([toc, caps, neighbors]) => {
        if (cancelled) return;
        if (toc?.interviews) {
          setData(toc);
          setCapsules(caps?.capsules || caps || {});
          setTiers(neighbors || {});
          setStatus('ready');
          // All interviews start COLLAPSED (Dustin, 2026-06-02): the visitor
          // sees the full scannable list first and expands the one they want,
          // instead of Aaron Dixon (entry 1) loading pre-expanded. A shared
          // deep link (?entry=) still opens its target via the restore effect.
        } else {
          setStatus('error');
        }
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => { cancelled = true; };
  }, []);

  // Playlist mode loads the clip index lazily (only when ?clips= is present),
  // for exact per-clip labels and interviewee names; rehydrateClip falls back
  // to toc.json (already loaded) for anything it misses, so the panel renders
  // even before this resolves.
  useEffect(() => {
    if ((!clipsParam && !working.clips.length) || plIndex) return undefined;
    let cancelled = false;
    fetch('/rag/playlist_index.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled && j) setPlIndex(j); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [clipsParam, working.clips.length, plIndex]);

  // Keep the URL's ?q= in step with the filter box, so a filtered view is
  // shareable/bookmarkable and the back button restores it. replace:true keeps
  // each keystroke out of the history stack.
  useEffect(() => {
    const current = searchParams.get('q') || '';
    const next = query.trim();
    if (next === current.trim()) return;
    const params = new URLSearchParams(searchParams);
    if (next) params.set('q', next);
    else params.delete('q');
    setSearchParams(params, { replace: true });
    // searchParams is intentionally omitted: this effect only fires on query
    // changes; reading the latest searchParams inside is fine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Restore a shared deep-link (?entry=&t=&end=) once the data is ready: open
  // the named interview and, when a start time is given, cue that clip (its
  // label recovered by matching the time against the interview's parts and
  // chapters). Browser autoplay policy holds the clip until the reader presses
  // play, since a fresh navigation carries no user gesture; it is cued either
  // way. One-shot via didRestoreRef.
  useEffect(() => {
    if (didRestoreRef.current) return;
    if (status !== 'ready' || !data?.interviews) return;
    didRestoreRef.current = true;
    const e = deepEntry != null ? Number(deepEntry) : NaN;
    if (Number.isNaN(e)) return;
    const iv = data.interviews.find((x) => x.entry === e);
    if (!iv) return;
    setOpenEntry(e);
    const tNum = deepT != null ? Number(deepT) : NaN;
    if (Number.isNaN(tNum)) return;
    let label = 'Shared clip';
    let end = deepEnd != null && !Number.isNaN(Number(deepEnd)) ? Number(deepEnd) : null;
    for (let pi = 0; pi < (iv.parts || []).length; pi++) {
      const part = iv.parts[pi];
      if (Math.round(part.start) === Math.round(tNum)) {
        if (part.title) label = `Part ${pi + 1}: ${part.title}`;
        if (end == null) end = part.end;
        break;
      }
      const ch = (part.chapters || []).find((c) => Math.round(c.start) === Math.round(tNum));
      if (ch) {
        label = ch.title;
        if (end == null) end = ch.end;
        break;
      }
    }
    setClip({ entry: e, start: tNum, end, label, nonce: 1 });
    requestAnimationFrame(() => {
      playerWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, data]);

  const interviews = data?.interviews || [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? interviews.filter((iv) => cleanName(iv.subject).toLowerCase().includes(q))
      : interviews.slice();
    // Pin an explicit alphabetical order by cleaned interviewee name. toc.json
    // already arrives alphabetical, but sorting here guarantees the page stays
    // alphabetical regardless of the data file's order (Eric, 2026-06-03).
    return base.sort((a, b) => cleanName(a.subject).localeCompare(cleanName(b.subject)));
  }, [interviews, query]);

  // The working playlist rehydrated to render-ready clips, in order. Labels come
  // from the exact index clip when available, otherwise the containing chapter
  // in toc.json (semantic snippets fall mid-chapter).
  const playlistClips = useMemo(() => {
    if (!working.clips.length) return [];
    const idxMap = plIndex ? buildIndexMap(plIndex) : null;
    const tocMap = buildTocIndex(data);
    return working.clips.map((r) => rehydrateClip(r, idxMap, tocMap, plIndex?.videos));
  }, [working.clips, plIndex, data]);

  // ---- Playlist <-> URL sync ----------------------------------------------
  // The working playlist (PlaylistProvider, localStorage-backed) is mirrored to
  // and from ?clips= so the address bar is always a shareable bookmark. A shared
  // ?clips= link wins on arrival; after that, edits write the URL and
  // back/forward reloads working. The shared syncedRef sentinel holds the value
  // both sides agree on, so neither effect re-triggers the other.
  const buildSig = (cp, t) => `${cp}|${t || ''}`;

  useEffect(() => {
    if (playlistInitRef.current || status !== 'ready') return;
    playlistInitRef.current = true;
    const urlTitle = (searchParams.get('title') || '').trim();
    if (clipsParam) {
      setClips(fromClipsParam(clipsParam), urlTitle);
      syncedRef.current = buildSig(clipsParam, urlTitle);
    } else if (working.clips.length) {
      const cp = toClipsParam(working.clips);
      syncedRef.current = buildSig(cp, working.title);
      const params = new URLSearchParams(searchParams);
      params.set('clips', cp);
      if (working.title) params.set('title', working.title);
      setSearchParams(params, { replace: true });
    } else {
      syncedRef.current = buildSig('', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // working -> URL (favorites, edits, generation, clears).
  useEffect(() => {
    if (!playlistInitRef.current) return;
    const cp = working.clips.length ? toClipsParam(working.clips) : '';
    const sig = buildSig(cp, working.clips.length ? working.title : '');
    if (sig === syncedRef.current) return;
    syncedRef.current = sig;
    const params = new URLSearchParams(searchParams);
    if (working.clips.length) {
      params.set('clips', cp);
      if (working.title) params.set('title', working.title);
      else params.delete('title');
    } else {
      params.delete('clips');
      params.delete('title');
    }
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [working]);

  // URL -> working (back/forward to a different ?clips=).
  useEffect(() => {
    if (!playlistInitRef.current) return;
    const urlTitle = (searchParams.get('title') || '').trim();
    const sig = buildSig(clipsParam, urlTitle);
    if (sig === syncedRef.current) return;
    syncedRef.current = sig;
    setClips(fromClipsParam(clipsParam), urlTitle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipsParam]);

  // Fetch the clip index once (cached on a promise ref), for topic generation
  // and exact rehydration labels. Shared by both generators so the file is
  // fetched at most once.
  const ensurePlIndex = useCallback(async () => {
    if (plIndex) return plIndex;
    if (!plIndexPromiseRef.current) {
      plIndexPromiseRef.current = fetch('/rag/playlist_index.json')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
    }
    const j = await plIndexPromiseRef.current;
    if (j) setPlIndex(j);
    return j;
  }, [plIndex]);

  // Generate a ready-made playlist from a curated topic: filter the clip index
  // and materialize an editable ?clips= snapshot the reader can then reorder.
  const generateFromTopic = useCallback(
    async (query, label) => {
      setGenError('');
      setGenBusy(true);
      try {
        const idx = await ensurePlIndex();
        if (!idx || !Array.isArray(idx.clips)) {
          setGenError('The clip index is unavailable right now.');
          return;
        }
        const hits = idx.clips.filter((c) => clipMatchesQuery(c, query));
        hits.sort((a, b) => a.entry_number - b.entry_number || (a.chapter_number || 0) - (b.chapter_number || 0));
        if (!hits.length) {
          setGenError('No clips matched that topic yet.');
          return;
        }
        const refs = hits.slice(0, MAX_CLIPS_PER_PLAYLIST).map((c) => ({
          entry: c.entry_number,
          start: c.start_seconds,
          end: c.end_seconds,
          label: c.title,
          subject: c.subject,
        }));
        setClips(refs, label);
        requestAnimationFrame(() => playlistSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      } catch {
        setGenError('Could not build that playlist.');
      } finally {
        setGenBusy(false);
      }
    },
    [ensurePlIndex, setClips],
  );

  // Generate a playlist of snippets from a loose semantic phrase: a live
  // retrieval, deduped, materialized as an editable ?clips= snapshot. Snippet
  // starts fall mid-chapter, so their labels resolve to the containing chapter.
  const generateFromPhrase = useCallback(
    async (phrase) => {
      setGenError('');
      setGenBusy(true);
      try {
        const res = await retrieve(phrase, { topN: 24 });
        const results = (res && res.results) || [];
        const seen = new Set();
        const refs = [];
        for (const r of results) {
          const ref = normalizeClip(r);
          if (!ref) continue;
          const k = `${ref.e}_${ref.s}`;
          if (seen.has(k)) continue;
          seen.add(k);
          refs.push(ref);
        }
        if (!refs.length) {
          setGenError('No clips matched that phrase. Try different words.');
          return;
        }
        ensurePlIndex();
        setClips(refs, `"${phrase}"`);
        requestAnimationFrame(() => playlistSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      } catch {
        setGenError('Search is unavailable right now. Please try again.');
      } finally {
        setGenBusy(false);
      }
    },
    [ensurePlIndex, setClips],
  );

  function toggleEntry(entry) {
    setOpenEntry((cur) => (cur === entry ? null : entry));
    // Closing an interview clears any clip that belonged to it.
    setClip((c) => (c && c.entry === entry && openEntry === entry ? null : c));
  }

  function playClip(entry, start, end, label) {
    setClip((c) => ({ entry, start, end, label, nonce: (c?.nonce || 0) + 1 }));
    // Reflect the active clip in the URL (replace, no history spam) so the page
    // is shareable and bookmarkable at this exact segment. The ?q= filter, if
    // any, is preserved.
    const params = new URLSearchParams(searchParams);
    params.set('entry', String(entry));
    params.set('t', String(Math.round(start)));
    if (end != null) params.set('end', String(Math.round(end)));
    else params.delete('end');
    setSearchParams(params, { replace: true });
    // Bring the player into view; it renders at the top of the expanded section.
    requestAnimationFrame(() => {
      playerWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  return (
    <div className="min-h-screen bg-[#EBEAE9] dark:bg-zinc-900">
      <main id="main-content" tabIndex={-1} className="max-w-5xl mx-auto px-4 sm:px-6 py-12 focus:outline-none">
        {/* Full-width header band, kept consistent with the Historical Figures
            page (PeopleCatalog): same eyebrow + Inter H1 sizing + stone intro +
            container width, so the two sibling pages read as one family even
            though the body below differs (a single-column list here, a card grid
            there). Eric, 2026-06-03. */}
        <header className="mb-8">
          <p className="text-civil-red-body text-sm font-light font-mono mb-2">
            Civil Rights History Project · Interviews
          </p>
          <h1
            className="text-stone-900 text-3xl sm:text-4xl md:text-5xl font-medium mb-4 leading-tight"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Interviews
          </h1>
          <p className="text-stone-700 max-w-3xl">
            Every interview in the collection. Open one to see its chapters, grouped
            into parts. Click any chapter to play that moment, or a part to play it
            straight through. Only the segment you pick loads, so even a multi-hour
            interview opens to the right place at once.
          </p>
          {data && (
            <p className="mt-3 text-sm text-stone-500">
              <span className="font-medium text-stone-900 tabular-nums">{data.count}</span> interviews
            </p>
          )}
        </header>

        {status === 'loading' && (
          <div className="py-16 flex justify-center" role="status">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civil-red-strong" />
            <span className="sr-only">Loading the table of contents</span>
          </div>
        )}

        {status === 'error' && (
          <p className="py-12 text-stone-600">
            The table of contents could not be loaded. Please try again.
          </p>
        )}

        {status === 'ready' && (
          <>
            {playlistClips.length > 0 && (
              <div ref={playlistSectionRef}>
                <PlaylistPanel
                  clips={playlistClips}
                  title={working.title}
                  onRename={rename}
                  onRemove={removeClip}
                  onReorder={reorder}
                  onClear={clearWorking}
                  onSave={() => saveToLibrary(null, playlistClips)}
                  onUpdateSaved={() => updateLibraryEntry(working.libraryId, { title: working.title, clips: playlistClips })}
                  libraryId={working.libraryId}
                  storageAvailable={storageAvailable}
                  shareGetUrl={() => {
                    const cp = toClipsParam(working.clips);
                    const t = working.title ? `&title=${encodeURIComponent(working.title)}` : '';
                    return `/table-of-contents?clips=${cp}${t}`;
                  }}
                />
              </div>
            )}
            <PlaylistGenerator
              onGenerateTopic={generateFromTopic}
              onGeneratePhrase={generateFromPhrase}
              busy={genBusy}
              error={genError}
            />
            <PlaylistLibrary
              onOpen={() =>
                requestAnimationFrame(() => playlistSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
              }
            />
            <label className="block mb-5">
              <span className="sr-only">Filter interviews by name</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by interviewee name…"
                className="w-full sm:w-96 px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 dark:placeholder-zinc-500 focus:border-civil-red-strong focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </label>

            <ul className="list-none p-0 m-0 space-y-2">
              {filtered.map((iv) => {
                const isOpen = openEntry === iv.entry;
                const name = cleanName(iv.subject);
                const hasParts = iv.part_count > 0;
                // Capsule + audit-tier badge, absorbed from the retired card
                // grid. Capsule keys may be number or string; tiers map keys by
                // the same entry number neighbors.json uses.
                const capsule = (capsules[iv.entry] || capsules[String(iv.entry)])?.capsule || null;
                const tierKey = tiers[iv.entry]?.tier ?? tiers[String(iv.entry)]?.tier ?? null;
                const badge = tierKey && tierKey in TIER_BADGE ? TIER_BADGE[tierKey] : null;
                return (
                  <li
                    key={iv.entry}
                    className="border border-stone-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleEntry(iv.entry)}
                      aria-expanded={isOpen}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 transition-colors ${
                        isOpen
                          ? 'bg-red-50 dark:bg-zinc-700/60'
                          : 'hover:bg-stone-50 dark:hover:bg-zinc-700/50'
                      }`}
                    >
                      <ChevronRight
                        className={`w-4 h-4 flex-shrink-0 mt-1 transition-transform ${
                          isOpen ? 'rotate-90 text-civil-red-strong' : 'text-stone-400'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium text-stone-900 dark:text-stone-100 truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {name}
                        </span>
                        <span className="block text-xs text-stone-500 mt-0.5">
                          {iv.chapter_count} {iv.chapter_count === 1 ? 'chapter' : 'chapters'}
                          {hasParts ? ` in ${iv.part_count} parts` : ''}
                          {iv.duration_seconds ? ` · ${fmtClock(iv.duration_seconds)}` : ''}
                        </span>
                        {/* One-line biographical capsule, clamped so it never
                            balloons the row height. */}
                        {capsule && (
                          <span
                            className="block text-xs text-stone-600 dark:text-stone-400 mt-1 leading-snug overflow-hidden text-ellipsis whitespace-nowrap"
                            style={{ fontFamily: 'Source Serif 4, serif' }}
                          >
                            {capsule}
                          </span>
                        )}
                        {/* Audit-tier badge, same vocabulary + palette as the
                            Data Insights surfaces (TIER_BADGE). */}
                        {badge && (
                          <span className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${badge.bg} ${badge.border} ${badge.text}`}>
                            {badge.label}
                          </span>
                        )}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 border-t border-stone-200 dark:border-zinc-700">
                        {/* Bounded player for the active clip, rendered only after
                            a chapter/part is picked. Keyed by nonce so each pick
                            remounts and autoplays just that segment. */}
                        {clip && clip.entry === iv.entry && (
                          <div ref={playerWrapRef} className="my-3">
                            <LocVideoEmbed
                              key={`${clip.entry}-${clip.nonce}`}
                              entryNumber={iv.entry}
                              startSeconds={clip.start}
                              endSeconds={clip.end}
                              autoPlay
                            />
                            {clip.label && (
                              <p className="mt-1.5 text-xs text-stone-500">
                                Now playing: <span className="text-stone-700">{clip.label}</span>
                                {' '}({fmtLen(clip.start, clip.end)})
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-3 mt-2 mb-3">
                          <Link
                            to={`/interview/${iv.entry}`}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-civil-red-body dark:text-red-400 hover:underline focus:outline-none focus-visible:underline"
                          >
                            <Film className="w-4 h-4" aria-hidden="true" />
                            Watch the full interview
                          </Link>
                          {/* Share this interview, opened here at the Table of
                              Contents. Each part and chapter below shares a
                              single segment. */}
                          <ShareButton
                            variant="inline"
                            label="Share"
                            title={`${name}, oral history`}
                            url={`/table-of-contents?entry=${iv.entry}`}
                          />
                        </div>

                        {iv.parts.map((part, pi) => (
                          <div key={pi} className={pi > 0 ? 'mt-4' : ''}>
                            {part.title && (
                              // Red part header: the title plays the whole part
                              // as one bounded autoplay run; the trailing share
                              // mark copies a link straight to this part.
                              <div className="group flex items-center gap-1.5 mb-1.5">
                                <button
                                  type="button"
                                  onClick={() => playClip(iv.entry, part.start, part.end, `Part ${pi + 1}: ${part.title}`)}
                                  className="flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
                                >
                                  <Play className="w-3.5 h-3.5 flex-shrink-0 text-civil-red-strong opacity-70 group-hover:opacity-100" aria-hidden="true" />
                                  <span className="text-civil-red-strong font-semibold text-sm uppercase tracking-wide group-hover:underline" style={{ fontFamily: 'Chivo Mono, monospace' }}>
                                    Part {pi + 1}: {part.title}
                                  </span>
                                  <span className="text-xs text-stone-400 font-normal normal-case">
                                    play all · {fmtLen(part.start, part.end)}
                                  </span>
                                </button>
                                <ShareButton
                                  variant="icon"
                                  title={`Part ${pi + 1}: ${part.title}`}
                                  url={`/table-of-contents?entry=${iv.entry}&t=${Math.round(part.start)}&end=${Math.round(part.end)}`}
                                  className="opacity-60 group-hover:opacity-100 focus-visible:opacity-100 shrink-0"
                                />
                                <AddToPlaylistButton
                                  variant="icon"
                                  clip={{ entry: iv.entry, start: part.start, end: part.end, label: `Part ${pi + 1}: ${part.title}`, subject: name }}
                                  className="opacity-60 group-hover:opacity-100 focus-visible:opacity-100 shrink-0"
                                />
                              </div>
                            )}
                            <ul className="list-none p-0 m-0 sm:pl-5 space-y-0.5">
                              {part.chapters.map((ch, ci) => (
                                <li key={ci} className="group flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => playClip(iv.entry, ch.start, ch.end, ch.title)}
                                    className="flex-1 min-w-0 flex items-baseline gap-2 px-2 py-1.5 -mx-2 rounded text-left hover:bg-red-50 dark:hover:bg-zinc-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                                  >
                                    <Play className="w-3 h-3 flex-shrink-0 translate-y-0.5 text-stone-400" aria-hidden="true" />
                                    <span className="flex-1 min-w-0 text-sm text-stone-800 dark:text-stone-200">
                                      {ch.title}
                                    </span>
                                    <span className="flex-shrink-0 text-xs text-stone-400 tabular-nums">
                                      {fmtLen(ch.start, ch.end)}
                                    </span>
                                  </button>
                                  <ShareButton
                                    variant="icon"
                                    title={ch.title}
                                    url={`/table-of-contents?entry=${iv.entry}&t=${Math.round(ch.start)}&end=${Math.round(ch.end)}`}
                                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 shrink-0"
                                  />
                                  <AddToPlaylistButton
                                    variant="icon"
                                    clip={{ entry: iv.entry, start: ch.start, end: ch.end, label: ch.title, subject: name }}
                                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 shrink-0"
                                  />
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {filtered.length === 0 && (
              <p className="py-10 text-stone-500">No interviews match that name.</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function TableOfContents() {
  return (
    <PlaylistProvider>
      <TableOfContentsInner />
    </PlaylistProvider>
  );
}
