/**
 * @fileoverview PlaylistPanel, the in-page player for a user playlist on the
 * Interviews page (/table-of-contents).
 *
 * A playlist is an ordered list of clips carried in the ?clips= URL param (see
 * src/utils/clipTokens.js), so it is bookmarkable and shareable with no backend
 * and no login. This panel plays the list through with the same bounded
 * LocVideoEmbed the rest of the page uses, so only the active clip's bytes load
 * and a multi-hour interview never buffers whole.
 *
 * Phase 2 scope: render + play-through. The in-place editor (reorder, remove,
 * rename) and the save/share controls are layered on in later phases.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Clock, ListVideo } from 'lucide-react';
import LocVideoEmbed from './LocVideoEmbed';

function fmtClock(s) {
  const t = Math.max(0, Math.round(Number(s) || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function fmtLen(start, end) {
  const d = (end ?? 0) - (start ?? 0);
  if (!isFinite(d) || d <= 0) return '';
  return fmtClock(d);
}

function fmtTotal(sec) {
  const m = Math.round((sec || 0) / 60);
  if (m < 1) return 'under a minute';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} hr ${r} min` : `${h} hr`;
}

/**
 * @param {Object} props
 * @param {Array<{key:string,entry_number:number,start_seconds:number,end_seconds:number,title:string,subject:string}>} props.clips
 *   Rehydrated, render-ready clips in playlist order.
 * @param {string} [props.title] Display name for the playlist.
 */
export default function PlaylistPanel({ clips = [], title = 'Your Playlist' }) {
  const [selected, setSelected] = useState(0);
  // Autoplay only after the reader's first click, so arriving on a shared link
  // cues the first clip without auto-starting audio (browser policy aligned).
  const [userInitiated, setUserInitiated] = useState(false);
  const playerRef = useRef(null);

  // Keep the selection in range when the clip list shrinks (an edit, later).
  useEffect(() => {
    setSelected((i) => (i >= clips.length ? 0 : i));
  }, [clips.length]);

  const totalSec = useMemo(
    () => clips.reduce((a, c) => a + Math.max(0, (c.end_seconds || 0) - (c.start_seconds || 0)), 0),
    [clips],
  );
  const interviewees = useMemo(() => new Set(clips.map((c) => c.subject)).size, [clips]);

  if (!clips.length) return null;
  const idx = Math.min(selected, clips.length - 1);
  const current = clips[idx];

  const play = (i) => {
    setSelected(i);
    setUserInitiated(true);
    requestAnimationFrame(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  };

  return (
    <section
      aria-label="Your playlist"
      className="mb-8 rounded-xl border-2 border-civil-red-strong bg-white dark:bg-zinc-800 overflow-hidden"
    >
      <div className="px-4 sm:px-5 py-3 bg-red-50 dark:bg-zinc-700/50 border-b border-stone-200 dark:border-zinc-700">
        <p className="text-civil-red-body text-xs font-mono uppercase tracking-wide mb-0.5 flex items-center gap-1.5">
          <ListVideo className="w-4 h-4" aria-hidden="true" /> Playlist
        </p>
        <h2 className="text-stone-900 dark:text-stone-100 text-xl font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
          {title}
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">
          <span className="font-medium text-stone-900 dark:text-stone-200 tabular-nums">{clips.length}</span>{' '}
          {clips.length === 1 ? 'clip' : 'clips'}
          {' · '}
          <span className="tabular-nums">{interviewees}</span> {interviewees === 1 ? 'interviewee' : 'interviewees'}
          {totalSec > 0 && (
            <>
              {' · '}
              <span className="tabular-nums">{fmtTotal(totalSec)}</span> total
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 sm:p-5">
        <div className="lg:col-span-2">
          <div ref={playerRef}>
            <LocVideoEmbed
              key={`${current.entry_number}-${current.start_seconds}`}
              entryNumber={current.entry_number}
              startSeconds={current.start_seconds}
              endSeconds={current.end_seconds}
              autoPlay={userInitiated}
              onClipEnd={() => {
                if (idx < clips.length - 1) play(idx + 1);
              }}
            />
          </div>
          <div className="mt-3">
            <p className="text-xs uppercase tracking-wide font-mono text-stone-500 mb-1">
              Clip {idx + 1} of {clips.length}
              {fmtLen(current.start_seconds, current.end_seconds) && (
                <span className="ml-2 inline-flex items-center gap-1 text-stone-600 dark:text-stone-400">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {fmtLen(current.start_seconds, current.end_seconds)}
                </span>
              )}
            </p>
            <h3 className="text-stone-900 dark:text-stone-100 text-lg font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
              {current.title}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              From the interview with{' '}
              <span className="font-medium text-stone-800 dark:text-stone-200">{current.subject}</span>
            </p>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide font-mono text-stone-500 mb-2">In This Playlist</h3>
          <ol className="space-y-1.5 list-none p-0 m-0 max-h-[24rem] overflow-y-auto pr-1">
            {clips.map((c, i) => {
              const isActive = i === idx;
              return (
                <li key={`${c.key || `${c.entry_number}_${c.start_seconds}`}-${i}`}>
                  <button
                    type="button"
                    onClick={() => play(i)}
                    aria-current={isActive ? 'true' : undefined}
                    className={
                      'w-full text-left rounded-md border p-2.5 transition-colors ' +
                      (isActive
                        ? 'border-civil-red-strong bg-red-50 dark:bg-zinc-700/50'
                        : 'border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-700/40')
                    }
                  >
                    <div className="flex items-start gap-2">
                      <Play
                        className={'w-3.5 h-3.5 mt-0.5 shrink-0 ' + (isActive ? 'text-civil-red-strong' : 'text-stone-400')}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-stone-900 dark:text-stone-100 leading-snug">{c.title}</div>
                        <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="truncate">{c.subject}</span>
                          {fmtLen(c.start_seconds, c.end_seconds) && (
                            <span className="inline-flex items-center gap-0.5 tabular-nums">
                              <Clock className="w-3 h-3" aria-hidden="true" />
                              {fmtLen(c.start_seconds, c.end_seconds)}
                            </span>
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
    </section>
  );
}
