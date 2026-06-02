/**
 * @fileoverview GlobalSearch, the always-visible semantic search in the header.
 *
 * A deliberately quiet affordance (a hairline underline and a muted magnifier)
 * that spans the top of every framed page. Tap it and type a natural-language
 * request; it runs a live semantic query against the archive (ragClient ->
 * /retrieve -> Pinecone + Voyage) and drops a panel of results grouped three
 * ways:
 *
 *   - Playlist : the funnel. One tap builds a time-anchored playlist of every
 *     clip matching the query (/playlist-builder?keywords=...). Pressing Enter
 *     in the field goes straight here, since the playlist is the primary
 *     destination.
 *   - Interviews : the distinct interviewees behind the matches, each linking
 *     to their interview page.
 *   - Clips : the individual time-anchored passages, each carrying the matched
 *     quote as its own relevance evidence and a relevance score. Selecting one
 *     opens the interview seeked to that moment and bounded to the passage, so
 *     the reader lands listening (this reuses the ?t=&end= segment deep-link).
 *
 * The relevance explanation is the retrieved passage itself, not model-written
 * prose: on a Smithsonian-grade archive, showing the evidence is safer than
 * generating a sentence about it. (An optional generated one-liner could be
 * layered on later; the funnel does not need it.)
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Loader2, Play, FileText, ListVideo, CornerDownLeft } from 'lucide-react';
import { retrieve } from '../services/ragClient';
import { tsToSeconds } from './HearInContext';

const MIN_QUERY = 2;
const DEBOUNCE_MS = 300;
const MAX_INTERVIEWS = 4;
const MAX_CLIPS = 6;

// Build the segment deep-link for one retrieved passage: open the interview
// seeked to the passage start and bounded to its end (a short window if no end
// is present), so selecting a clip lands the reader listening to that moment.
function clipHref(r) {
  const start = r.timestampStartStr ? Math.round(tsToSeconds(r.timestampStartStr)) : 0;
  const rawEnd = r.timestampEndStr ? Math.round(tsToSeconds(r.timestampEndStr)) : 0;
  const end = rawEnd > start ? rawEnd : start > 0 ? start + 60 : 0;
  const qs = end > start ? `?t=${start}&end=${end}` : start > 0 ? `?t=${start}` : '';
  return `/interview/${r.entryNumber}${qs}`;
}

function shortTimestamp(s) {
  return s ? String(s).split(/[.,]/)[0] : '';
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const q = query.trim();

  // Debounced live retrieval. Cancels the in-flight request on each keystroke
  // (AbortController) so only the latest query's results land, and skips the
  // network entirely below the minimum length.
  useEffect(() => {
    if (q.length < MIN_QUERY) {
      setResults([]);
      setStatus('idle');
      if (abortRef.current) abortRef.current.abort();
      return undefined;
    }
    setStatus('loading');
    const ctrl = new AbortController();
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = ctrl;
    const timer = setTimeout(() => {
      retrieve(q, { topN: 8, signal: ctrl.signal })
        .then((data) => {
          if (ctrl.signal.aborted) return;
          setResults(Array.isArray(data?.results) ? data.results : []);
          setStatus('done');
        })
        .catch((e) => {
          if (ctrl.signal.aborted || (e && e.name === 'AbortError')) return;
          setResults([]);
          setStatus('error');
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q]);

  // Dismiss the panel on navigation (a result was chosen, or the user moved on).
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  // Dismiss on outside click and on Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = useCallback(
    (href) => {
      setOpen(false);
      navigate(href);
    },
    [navigate],
  );

  const playlistHref = `/playlist-builder?keywords=${encodeURIComponent(q)}`;

  // Distinct interviewees behind the passage matches, in rank order.
  const interviews = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const r of results) {
      if (r.entryNumber == null || seen.has(r.entryNumber)) continue;
      seen.add(r.entryNumber);
      out.push(r);
      if (out.length >= MAX_INTERVIEWS) break;
    }
    return out;
  }, [results]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (q.length >= MIN_QUERY) go(playlistHref);
  };

  const showPanel = open && q.length >= MIN_QUERY;
  const hasResults = results.length > 0;

  return (
    <div ref={rootRef} className="relative w-full">
      <form onSubmit={onSubmit} role="search" aria-label="Search the archive">
        <div className="flex items-center gap-2 border-b border-stone-300/70 dark:border-zinc-700/70 focus-within:border-stone-500 dark:focus-within:border-zinc-400 transition-colors">
          <Search className="w-4 h-4 text-stone-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search the archive"
            aria-label="Search the archive"
            aria-expanded={showPanel}
            aria-controls="global-search-results"
            className="flex-1 min-w-0 bg-transparent py-2 text-sm text-stone-700 dark:text-zinc-200 placeholder-stone-400 dark:placeholder-zinc-500 outline-none [appearance:textfield] [&::-webkit-search-cancel-button]:hidden"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
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
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </form>

      {showPanel && (
        <div
          id="global-search-results"
          className="absolute left-0 mt-1 z-50 w-full max-w-2xl rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden"
        >
          <div className="max-h-[70vh] overflow-y-auto py-2">
            {/* The funnel: one tap to a time-anchored playlist of every match. */}
            <button
              type="button"
              onClick={() => go(playlistHref)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-red-50 dark:hover:bg-zinc-800 focus:outline-none focus-visible:bg-red-50"
            >
              <ListVideo className="w-4 h-4 text-civil-red-strong shrink-0" aria-hidden="true" />
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
            </button>

            {status === 'loading' && (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-stone-500" role="status">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Searching the archive…
              </div>
            )}

            {status === 'error' && (
              <p className="px-3 py-3 text-sm text-stone-500">
                Search is unavailable right now. The playlist above still works.
              </p>
            )}

            {status === 'done' && !hasResults && (
              <p className="px-3 py-3 text-sm text-stone-500">
                No passages matched &ldquo;{q}&rdquo;. Try a broader phrase, or build the playlist above.
              </p>
            )}

            {interviews.length > 0 && (
              <>
                <div className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  Interviews
                </div>
                {interviews.map((r) => (
                  <button
                    type="button"
                    key={`iv-${r.entryNumber}`}
                    onClick={() => go(`/interview/${r.entryNumber}`)}
                    className="w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-stone-50 dark:hover:bg-zinc-800 focus:outline-none focus-visible:bg-stone-50"
                  >
                    <FileText className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-stone-900 dark:text-zinc-100 truncate">
                        {r.entrySubject || `Interview #${r.entryNumber}`}
                      </span>
                      {r.textPreview && (
                        <span className="block text-xs text-stone-500 line-clamp-1">
                          &ldquo;{r.textPreview}&rdquo;
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </>
            )}

            {hasResults && (
              <>
                <div className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  Clips
                </div>
                {results.slice(0, MAX_CLIPS).map((r, i) => (
                  <button
                    type="button"
                    key={`clip-${r.entryNumber}-${i}`}
                    onClick={() => go(clipHref(r))}
                    className="w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-stone-50 dark:hover:bg-zinc-800 focus:outline-none focus-visible:bg-stone-50"
                  >
                    <Play className="w-4 h-4 text-civil-red-body shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-stone-900 dark:text-zinc-100 truncate">
                          {r.entrySubject || `Interview #${r.entryNumber}`}
                        </span>
                        {r.timestampStartStr && (
                          <span className="text-[11px] text-stone-400 tabular-nums shrink-0">
                            {shortTimestamp(r.timestampStartStr)}
                          </span>
                        )}
                      </span>
                      {r.textPreview && (
                        <span className="block text-xs text-stone-600 dark:text-zinc-400 line-clamp-2">
                          &ldquo;{r.textPreview}&rdquo;
                        </span>
                      )}
                      {r.similarity != null && (
                        <span className="block text-[11px] text-stone-400 mt-0.5">
                          matched passage · {Math.round(r.similarity * 100)}% relevance
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>

          <div className="border-t border-stone-100 dark:border-zinc-800 px-3 py-1.5 text-[11px] text-stone-400">
            Semantic search across the interview archive. Select a result to listen.
          </div>
        </div>
      )}
    </div>
  );
}
