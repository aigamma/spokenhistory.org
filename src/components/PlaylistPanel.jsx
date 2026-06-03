/**
 * @fileoverview PlaylistPanel, the in-page player + editor for a user playlist
 * on the Interviews page (/table-of-contents).
 *
 * A playlist is an ordered list of clips carried in the ?clips= URL param (see
 * src/utils/clipTokens.js), so it is bookmarkable and shareable with no backend
 * and no login. The panel:
 *   - plays the list through with the same bounded LocVideoEmbed the rest of the
 *     page uses (only the active clip's bytes load), auto-advancing on clip end.
 *   - lets the reader edit IN PLACE rather than rebuild: rename, drag a handle to
 *     resort, and uncheck a clip to drop it. Every edit rewrites ?clips= upstream
 *     (the page owns that), so the bookmark always equals the current state.
 *   - copies the bookmark link, saves a snapshot to this device, and clears.
 *
 * Reorder uses native HTML5 drag-and-drop plus keyboard up/down buttons, NOT
 * react-beautiful-dnd: the app mounts under React.StrictMode (main.jsx), where
 * react-beautiful-dnd's Droppable renders empty in dev. Native DnD is
 * dependency-free and StrictMode-safe; the up/down buttons cover touch and
 * keyboard, which native DnD does not.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Clock, ListVideo, GripVertical, ChevronUp, ChevronDown, Trash2, Save } from 'lucide-react';
import LocVideoEmbed from './LocVideoEmbed';
import ShareButton from './ShareButton';

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
 * @param {Array} props.clips Rehydrated, render-ready clips in playlist order
 *   ({ key, entry_number, start_seconds, end_seconds, title, subject }).
 * @param {string} props.title Working playlist name (may be empty).
 * @param {(title:string)=>void} props.onRename
 * @param {(key:string)=>void} props.onRemove
 * @param {(from:number,to:number)=>void} props.onReorder
 * @param {()=>void} props.onClear
 * @param {()=>{ok:boolean,reason?:string}} [props.onSave] Save a snapshot to the device library.
 * @param {()=>{ok:boolean}} [props.onUpdateSaved] Write back to the originating saved entry.
 * @param {string|null} [props.libraryId] Set when the working playlist came from a saved entry.
 * @param {()=>string} [props.shareGetUrl] Compute the in-app share path at click time.
 * @param {boolean} [props.storageAvailable]
 */
export default function PlaylistPanel({
  clips = [],
  title = '',
  onRename,
  onRemove,
  onReorder,
  onClear,
  onSave,
  onUpdateSaved,
  libraryId = null,
  shareGetUrl,
  storageAvailable = true,
}) {
  const [selected, setSelected] = useState(0);
  const [userInitiated, setUserInitiated] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [saveMsg, setSaveMsg] = useState('');
  const playerRef = useRef(null);

  useEffect(() => {
    setSelected((i) => (i >= clips.length ? Math.max(0, clips.length - 1) : i));
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

  const move = (from, to) => {
    if (to < 0 || to >= clips.length) return;
    onReorder?.(from, to);
    // Keep the now-playing selection pinned to the clip the reader moved.
    if (selected === from) setSelected(to);
    else if (from < selected && to >= selected) setSelected(selected - 1);
    else if (from > selected && to <= selected) setSelected(selected + 1);
  };

  const doSave = () => {
    const r = onSave ? onSave() : null;
    if (r && r.ok) setSaveMsg('Saved to this device');
    else if (r && r.reason === 'libraryFull') setSaveMsg('Library is full (50)');
    else if (r && r.reason === 'empty') setSaveMsg('Nothing to save');
    else setSaveMsg('Could not save');
    setTimeout(() => setSaveMsg(''), 2600);
  };

  const doUpdate = () => {
    const r = onUpdateSaved ? onUpdateSaved() : null;
    setSaveMsg(r && r.ok ? 'Saved copy updated' : 'Could not update');
    setTimeout(() => setSaveMsg(''), 2600);
  };

  return (
    <section
      aria-label="Your playlist"
      className="mb-8 rounded-xl border-2 border-civil-red-strong bg-white dark:bg-zinc-800 overflow-hidden"
    >
      <div className="px-4 sm:px-5 py-3 bg-red-50 dark:bg-zinc-700/50 border-b border-stone-200 dark:border-zinc-700">
        <p className="text-civil-red-body text-xs font-mono uppercase tracking-wide mb-1 flex items-center gap-1.5">
          <ListVideo className="w-4 h-4" aria-hidden="true" /> Playlist
        </p>
        <input
          type="text"
          value={title}
          onChange={(e) => onRename?.(e.target.value)}
          placeholder="Name this playlist"
          aria-label="Playlist name"
          className="w-full bg-transparent text-stone-900 dark:text-stone-100 text-xl font-medium border-0 border-b border-transparent hover:border-stone-300 dark:hover:border-zinc-600 focus:border-civil-red-strong focus:outline-none px-0 py-0.5"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
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
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {shareGetUrl && (
            <ShareButton variant="button" label="Copy link" copiedLabel="Link copied" getUrl={shareGetUrl} title={title || 'Playlist'} />
          )}
          {storageAvailable && onSave && (
            <button
              type="button"
              onClick={doSave}
              className="inline-flex items-center gap-1 min-h-9 px-3 py-1.5 text-xs font-medium rounded border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 hover:border-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              <Save className="w-3.5 h-3.5" aria-hidden="true" /> Save to device
            </button>
          )}
          {storageAvailable && libraryId && onUpdateSaved && (
            <button
              type="button"
              onClick={doUpdate}
              className="inline-flex items-center gap-1 min-h-9 px-3 py-1.5 text-xs font-medium rounded border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-800 hover:border-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              Update saved copy
            </button>
          )}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 min-h-9 px-3 py-1.5 text-xs font-medium rounded border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800 hover:border-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Clear
            </button>
          )}
          <span className="sr-only" role="status" aria-live="polite">{saveMsg}</span>
          {saveMsg && <span className="text-xs text-stone-600 dark:text-stone-400" aria-hidden="true">{saveMsg}</span>}
        </div>
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
          <h3 className="text-xs font-semibold uppercase tracking-wide font-mono text-stone-500 mb-2">
            In This Playlist
          </h3>
          <p className="text-xs text-stone-400 mb-2">Uncheck to remove. Drag the handle, or use the arrows, to reorder.</p>
          <ol className="space-y-1.5 list-none p-0 m-0 max-h-[26rem] overflow-y-auto pr-1">
            {clips.map((c, i) => {
              const isActive = i === idx;
              const isOver = overIndex === i && dragIndex !== null && dragIndex !== i;
              return (
                <li
                  key={`${c.key}-${i}`}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (overIndex !== i) setOverIndex(i);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null && dragIndex !== i) move(dragIndex, i);
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  className={
                    'rounded-md border transition-colors ' +
                    (isActive
                      ? 'border-civil-red-strong bg-red-50 dark:bg-zinc-700/50'
                      : 'border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800') +
                    (isOver ? ' ring-2 ring-civil-red-strong' : '')
                  }
                >
                  <div className="flex items-center gap-1.5 p-1.5">
                    <span
                      className="shrink-0 text-stone-400 cursor-grab active:cursor-grabbing p-1"
                      aria-hidden="true"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                    <input
                      type="checkbox"
                      checked
                      onChange={() => onRemove?.(c.key)}
                      aria-label={`Remove ${c.title} from playlist`}
                      title="Uncheck to remove"
                      className="shrink-0 w-4 h-4 accent-civil-red-strong cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => play(i)}
                      aria-current={isActive ? 'true' : undefined}
                      className="flex-1 min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
                    >
                      <span className="flex items-start gap-1.5">
                        <Play
                          className={'w-3.5 h-3.5 mt-0.5 shrink-0 ' + (isActive ? 'text-civil-red-strong' : 'text-stone-400')}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-stone-900 dark:text-stone-100 leading-snug">{c.title}</span>
                          <span className="block text-xs text-stone-500 mt-0.5 truncate">
                            {c.subject}
                            {fmtLen(c.start_seconds, c.end_seconds) ? ` · ${fmtLen(c.start_seconds, c.end_seconds)}` : ''}
                          </span>
                        </span>
                      </span>
                    </button>
                    <span className="shrink-0 flex flex-col">
                      <button
                        type="button"
                        onClick={() => move(i, i - 1)}
                        disabled={i === 0}
                        aria-label={`Move ${c.title} up`}
                        className="p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
                      >
                        <ChevronUp className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, i + 1)}
                        disabled={i === clips.length - 1}
                        aria-label={`Move ${c.title} down`}
                        className="p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
                      >
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </section>
  );
}
