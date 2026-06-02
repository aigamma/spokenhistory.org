/**
 * @fileoverview CommandPalette, the site-wide federated search overlay.
 *
 * A single Cmd/Ctrl+K (or "/") overlay that searches the whole archive at once
 * and renders the hits grouped by type: Interviews, People, Topics & Events,
 * Timeline, Essays, and time-anchored Passages. It is mounted once at the App
 * root (outside the router) so it works on every page, including the
 * header-less interview and player routes, and it is driven by SearchProvider
 * so the header trigger and the keyboard shortcuts share one open state.
 *
 * The federation (Pinecone passages + the Firestore database + the static
 * catalogs) lives in services/federatedSearch; this component is just the
 * input, the debounce/abort, the keyboard model, and the rendering. It keeps
 * the original GlobalSearch funnel: a "Play a playlist about ..." row that is
 * the Enter default, because a time-anchored playlist remains the primary
 * destination. Relevance is shown as evidence (the matched passage + a score),
 * not model-written prose, the safer choice on a Smithsonian-grade archive.
 *
 * Accessibility follows the WAI-ARIA combobox + listbox pattern: focus stays on
 * the input and the active option is tracked with aria-activedescendant, so
 * arrow keys move a highlight without moving DOM focus.
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, X, Loader2, Play, FileText, ListVideo, CornerDownLeft,
  User, Tag, Clock, BookOpen,
} from 'lucide-react';
import { useSearch } from '../context/SearchProvider';
import { federatedSearch } from '../services/federatedSearch';

const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;

const GROUP_ORDER = [
  { key: 'interview', label: 'Interviews', icon: FileText },
  { key: 'person', label: 'People', icon: User },
  { key: 'topic', label: 'Topics & Events', icon: Tag },
  { key: 'timeline', label: 'Timeline', icon: Clock },
  { key: 'essay', label: 'Essays', icon: BookOpen },
  { key: 'passage', label: 'Passages', icon: Play },
];

const EMPTY_GROUPS = { interview: [], person: [], topic: [], timeline: [], essay: [], passage: [] };

export default function CommandPalette() {
  const { isOpen, closeSearch } = useSearch();
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState(EMPTY_GROUPS);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [sourceStatus, setSourceStatus] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const abortRef = useRef(null);
  const prevFocusRef = useRef(null);

  const q = query.trim();
  const playlistHref = `/playlist-builder?keywords=${encodeURIComponent(q)}`;

  // Flattened, ordered option list the keyboard model walks. Index 0 is the
  // playlist funnel (the Enter default); results follow in group order.
  const flatItems = useMemo(() => {
    const items = [];
    if (q.length >= MIN_QUERY) {
      items.push({ kind: 'playlist', id: 'cmdk-playlist', href: playlistHref });
    }
    for (const g of GROUP_ORDER) {
      for (const it of groups[g.key] || []) items.push({ kind: 'result', group: g.key, ...it });
    }
    return items;
  }, [groups, q, playlistHref]);

  const hasAnyResult = useMemo(
    () => GROUP_ORDER.some((g) => (groups[g.key] || []).length > 0),
    [groups],
  );

  // Debounced federated retrieval. Aborts the in-flight run on each keystroke so
  // only the latest query lands, and skips the network below the min length.
  useEffect(() => {
    if (q.length < MIN_QUERY) {
      setGroups(EMPTY_GROUPS);
      setStatus('idle');
      setActiveIndex(0);
      if (abortRef.current) abortRef.current.abort();
      return undefined;
    }
    setStatus('loading');
    const ctrl = new AbortController();
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = ctrl;
    const timer = setTimeout(() => {
      federatedSearch(q, { signal: ctrl.signal })
        .then((res) => {
          if (ctrl.signal.aborted) return;
          setGroups(res.groups || EMPTY_GROUPS);
          setSourceStatus(res.status || {});
          setStatus('done');
          setActiveIndex(0);
        })
        .catch((e) => {
          if (ctrl.signal.aborted || (e && e.name === 'AbortError')) return;
          setGroups(EMPTY_GROUPS);
          setStatus('error');
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q]);

  // Open/close lifecycle: focus the input on open (restoring focus to the
  // opener on close), and reset the query so the next open starts clean.
  useEffect(() => {
    if (isOpen) {
      prevFocusRef.current = typeof document !== 'undefined' ? document.activeElement : null;
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
    setQuery('');
    setGroups(EMPTY_GROUPS);
    setStatus('idle');
    setActiveIndex(0);
    if (abortRef.current) abortRef.current.abort();
    if (prevFocusRef.current && typeof prevFocusRef.current.focus === 'function') {
      prevFocusRef.current.focus();
    }
    return undefined;
  }, [isOpen]);

  // Close when navigation occurs (a result was chosen, or the user moved on).
  useEffect(() => {
    if (isOpen) closeSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  const go = useCallback(
    (href) => {
      if (!href) return;
      closeSearch();
      navigate(href);
    },
    [closeSearch, navigate],
  );

  const activate = useCallback(
    (idx) => {
      const item = flatItems[idx] || flatItems[0];
      if (item) go(item.href);
    },
    [flatItems, go],
  );

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(flatItems.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      activate(activeIndex);
    }
  };

  // Keep the active option scrolled into view as the highlight moves.
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`#cmdk-opt-${activeIndex}`);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, flatItems.length]);

  if (!isOpen) return null;

  const showPanel = q.length >= MIN_QUERY;
  const passagesDown = sourceStatus.passages && sourceStatus.passages !== 'ok' && sourceStatus.passages !== 'aborted';

  // Render walks flatItems, emitting a group header whenever the group changes,
  // so the visual grouping and the keyboard index stay in lockstep.
  let lastGroup = null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[10vh] pb-6"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={closeSearch}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the archive"
        className="relative w-full max-w-2xl rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden"
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 border-b border-stone-200 dark:border-zinc-800">
          <Search className="w-5 h-5 text-stone-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls="cmdk-listbox"
            aria-activedescendant={showPanel ? `cmdk-opt-${activeIndex}` : undefined}
            aria-label="Search the archive"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search interviews, people, topics, the timeline, essays, and passages"
            className="flex-1 min-w-0 bg-transparent py-4 text-base text-stone-800 dark:text-zinc-100 placeholder-stone-400 dark:placeholder-zinc-500 outline-none"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[11px] text-stone-400 border border-stone-200 dark:border-zinc-700 rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>

        {/* Results */}
        {showPanel && (
          <div ref={listRef} id="cmdk-listbox" role="listbox" aria-label="Search results" className="max-h-[60vh] overflow-y-auto py-2">
            {flatItems.map((item, idx) => {
              const active = idx === activeIndex;
              if (item.kind === 'playlist') {
                return (
                  <Option key="playlist" id={`cmdk-opt-${idx}`} active={active} onSelect={() => activate(idx)} onHover={() => setActiveIndex(idx)}>
                    <ListVideo className="w-4 h-4 text-civil-red-strong shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-stone-900 dark:text-zinc-100 truncate">
                        Play a playlist about &ldquo;{q}&rdquo;
                      </span>
                      <span className="block text-xs text-stone-500">
                        A time-anchored set of clips drawn from across the interviews.
                      </span>
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-stone-400 shrink-0">
                      <CornerDownLeft className="w-3 h-3" aria-hidden="true" /> Enter
                    </span>
                  </Option>
                );
              }

              const groupDef = GROUP_ORDER.find((g) => g.key === item.group);
              const header =
                item.group !== lastGroup ? (
                  <div
                    key={`h-${item.group}`}
                    role="presentation"
                    className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-400"
                  >
                    {groupDef?.label || item.group}
                  </div>
                ) : null;
              lastGroup = item.group;
              const Icon = groupDef?.icon || FileText;

              return (
                <div key={item.id || idx}>
                  {header}
                  <Option id={`cmdk-opt-${idx}`} active={active} onSelect={() => activate(idx)} onHover={() => setActiveIndex(idx)}>
                    <Icon className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-stone-900 dark:text-zinc-100 truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[11px] text-stone-400 tabular-nums shrink-0">{item.badge}</span>
                        )}
                      </span>
                      {item.evidence ? (
                        <span className="block text-xs text-stone-600 dark:text-zinc-400 line-clamp-2">
                          &ldquo;{item.evidence}&rdquo;
                        </span>
                      ) : (
                        item.subtitle && (
                          <span className="block text-xs text-stone-500 line-clamp-1">{item.subtitle}</span>
                        )
                      )}
                    </span>
                  </Option>
                </div>
              );
            })}

            {status === 'loading' && (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-stone-500" role="status">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Searching the archive&hellip;
              </div>
            )}

            {status === 'done' && !hasAnyResult && (
              <p className="px-3 py-3 text-sm text-stone-500">
                No matches for &ldquo;{q}&rdquo;. Try a broader phrase, or build the playlist above.
              </p>
            )}

            {status === 'error' && (
              <p className="px-3 py-3 text-sm text-stone-500">
                Search is unavailable right now. The playlist above still works.
              </p>
            )}

            {status === 'done' && passagesDown && (
              <p className="px-3 py-2 text-[11px] text-stone-400">
                Semantic passage results are unavailable right now. The other results above are unaffected.
              </p>
            )}
          </div>
        )}

        {/* Footer hint */}
        <div className="border-t border-stone-100 dark:border-zinc-800 px-3 py-2 flex items-center justify-between text-[11px] text-stone-400">
          <span>Search across interviews, people, topics, the timeline, essays, and passages.</span>
          <span className="hidden sm:flex items-center gap-2">
            <kbd className="border border-stone-200 dark:border-zinc-700 rounded px-1 py-0.5">&uarr;&darr;</kbd>
            to navigate
            <kbd className="border border-stone-200 dark:border-zinc-700 rounded px-1 py-0.5">&crarr;</kbd>
            to open
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * One selectable row in the listbox. role="option" so the input keeps DOM focus
 * (aria-activedescendant points here); hover and click both select.
 */
function Option({ id, active, onSelect, onHover, children }) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={active}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={
        'w-full flex items-start gap-3 px-3 py-2 text-left cursor-pointer ' +
        (active ? 'bg-stone-100 dark:bg-zinc-800' : 'hover:bg-stone-50 dark:hover:bg-zinc-800/60')
      }
    >
      {children}
    </div>
  );
}
