import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Play, Clock, FileText, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Footer from '../components/common/Footer';
import LocVideoEmbed from '../components/LocVideoEmbed';
import { TIER_COLORS } from '../components/rag/tiers';

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

export default function StaticPlaylist() {
  const [searchParams] = useSearchParams();
  const keywords = (searchParams.get('keywords') || searchParams.get('q') || '').trim();
  const topic = (searchParams.get('topic') || '').trim();
  const entryParam = searchParams.get('entry');
  const entriesParam = (searchParams.get('entries') || '').trim();
  const labelParam = (searchParams.get('label') || '').trim();

  const [index, setIndex] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(0);
  const [userInitiated, setUserInitiated] = useState(false);
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

  // Reset selection + autoplay gate whenever the query changes.
  useEffect(() => { setSelected(0); setUserInitiated(false); }, [keywords, topic, entryParam, entriesParam]);

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
      return all.filter((c) => (c.topic_category || '').toLowerCase() === t);
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
      return hits;
    }
    return all;
  }, [index, keywords, topic, entryParam, entriesParam]);

  const subjectForEntry = entryParam && index?.videos?.[entryParam]?.subject;
  const titleText = entriesParam
    ? (labelParam || 'Selected Interviews')
    : topic
      ? `Clips: ${topic}`
      : entryParam
        ? `${subjectForEntry || `Interview #${entryParam}`}: Chapter Playlist`
        : keywords
          ? `Clips About “${keywords}”`
          : 'All Clips';

  const current = clips[selected];

  const playClip = (i) => {
    setSelected(i);
    setUserInitiated(true);
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
          <p className="text-civil-red-body text-sm font-light font-mono mb-2">
            Civil Rights History Project · Playlist
          </p>
          <h1 className="text-stone-900 text-2xl sm:text-3xl md:text-4xl font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            {titleText}
          </h1>
          {index && (
            <p className="text-sm text-stone-600">
              {clips.length} {clips.length === 1 ? 'clip' : 'clips'}
              {clips.length > 0 && ', drawn straight from the interviews. Play one, then read or watch the full interview behind it.'}
            </p>
          )}
        </header>

        {!index && <p className="text-stone-600" role="status">Loading clips...</p>}

        {index && clips.length === 0 && (
          <div className="rounded-lg border border-stone-200 bg-white p-6">
            <p className="text-stone-700 mb-3">No clips match this yet.</p>
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
              />

              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide font-mono text-stone-500 mb-1">
                  Clip {selected + 1} of {clips.length}
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
                    className="inline-flex items-center gap-1 min-h-11 px-3 py-2 text-sm rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Previous clip
                  </button>
                  <button
                    type="button"
                    onClick={() => playClip(Math.min(clips.length - 1, selected + 1))}
                    disabled={selected === clips.length - 1}
                    className="inline-flex items-center gap-1 min-h-11 px-3 py-2 text-sm rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
                </div>
              </div>
            </div>

            {/* Clip list (the playlist) */}
            <aside className="lg:col-span-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide font-mono text-stone-700 mb-3 flex items-center gap-1.5">
                <List className="w-4 h-4" aria-hidden="true" />
                In This Playlist
              </h2>
              <ol ref={listRef} className="space-y-2 list-none p-0 max-h-[32rem] overflow-y-auto pr-1">
                {clips.map((c, i) => {
                  const dur = fmtDuration(c.start_seconds, c.end_seconds);
                  const isActive = i === selected;
                  const tier = index.videos?.[c.entry_number]?.tier;
                  return (
                    <li key={`${c.entry_number}-${c.chapter_number}-${i}`}>
                      <button
                        type="button"
                        onClick={() => playClip(i)}
                        aria-current={isActive ? 'true' : undefined}
                        className={
                          'w-full text-left rounded-md border p-3 transition-colors ' +
                          (isActive
                            ? 'border-civil-red-strong bg-red-50'
                            : 'border-stone-200 bg-white hover:bg-stone-50')
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
                    </li>
                  );
                })}
              </ol>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
