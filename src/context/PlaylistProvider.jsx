/**
 * @fileoverview PlaylistProvider, the state + persistence for user playlists on
 * the Interviews page (/table-of-contents).
 *
 * The whole feature is no-login and no-backend (the site is a flat hierarchy
 * with no per-user accounts). Identity and portability live in the URL (the
 * ?clips= param, encoded by src/utils/clipTokens.js); this provider owns the
 * device-local layer:
 *
 *   - the WORKING playlist: the in-progress list you favorite into and edit,
 *     mirrored to and from the ?clips= URL by the Interviews page.
 *   - the saved LIBRARY ("My Playlists"): named snapshots kept on this device.
 *
 * Both persist to localStorage under versioned keys, with the same defensive
 * discipline as src/services/relatedTermsCache.js + src/hooks/useTheme.js: every
 * access is guarded, a schema-version mismatch discards the key rather than
 * crashing, and a browser with storage disabled degrades to in-memory only.
 *
 * Clips are stored as the minimal ref { e, s, n, t, sub } (see clipTokens.js).
 * Labels (t/sub) are advisory: the UI re-derives them from the static catalogs
 * on render, so a saved playlist survives a re-chapterization.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { normalizeClip, MAX_CLIPS_PER_PLAYLIST } from '../utils/clipTokens';

const WORKING_KEY = 'civil-rights-playlist-working';
const LIBRARY_KEY = 'civil-rights-playlist-library';
const SCHEMA_VERSION = 1;
const MAX_LIBRARY_PLAYLISTS = 50;

function storageOk() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const k = '__clp_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function newId(prefix) {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}_${crypto.randomUUID()}`;
    }
  } catch {
    /* fall through to the non-crypto id */
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function keyOf(ref) {
  return `${ref.e}_${ref.s}`;
}

function readKey(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== SCHEMA_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeKey(key, obj) {
  try {
    window.localStorage.setItem(key, JSON.stringify(obj));
    return true;
  } catch {
    return false;
  }
}

function sanitizeClips(arr) {
  return Array.isArray(arr) ? arr.map(normalizeClip).filter(Boolean).slice(0, MAX_CLIPS_PER_PLAYLIST) : [];
}

function emptyWorking() {
  return { id: newId('wk'), title: '', clips: [], updatedAt: Date.now(), libraryId: null };
}

function loadWorking() {
  const p = readKey(WORKING_KEY);
  const pl = p && p.playlist;
  if (!pl) return emptyWorking();
  return {
    id: pl.id || newId('wk'),
    title: typeof pl.title === 'string' ? pl.title : '',
    clips: sanitizeClips(pl.clips),
    updatedAt: pl.updatedAt || Date.now(),
    libraryId: pl.libraryId || null,
  };
}

function loadLibrary() {
  const p = readKey(LIBRARY_KEY);
  if (!p || !Array.isArray(p.playlists)) return [];
  return p.playlists
    .map((pl) => ({
      id: pl.id || newId('pl'),
      title: typeof pl.title === 'string' && pl.title ? pl.title : 'Untitled playlist',
      clips: sanitizeClips(pl.clips),
      createdAt: pl.createdAt || Date.now(),
      updatedAt: pl.updatedAt || Date.now(),
    }))
    .filter((pl) => pl.clips.length);
}

const PlaylistContext = createContext(null);

const NOOP = () => {};
const NORES = () => ({ ok: false });
// Returned by usePlaylist when no provider is mounted, so a stray call outside
// the Interviews page is a harmless no-op rather than a crash.
const FALLBACK = {
  working: { id: '', title: '', clips: [], updatedAt: 0, libraryId: null },
  library: [],
  isClipInPlaylist: () => false,
  isFull: false,
  storageAvailable: false,
  addClip: NOOP,
  removeClip: NOOP,
  toggleClip: NOOP,
  reorder: NOOP,
  rename: NOOP,
  clearWorking: NOOP,
  addMany: NOOP,
  setClips: NOOP,
  saveToLibrary: NORES,
  updateLibraryEntry: NORES,
  loadIntoWorking: NORES,
  deleteLibraryEntry: NOOP,
  renameLibraryEntry: NOOP,
};

export function PlaylistProvider({ children }) {
  const availableRef = useRef(null);
  if (availableRef.current === null) availableRef.current = storageOk();

  const [working, setWorking] = useState(loadWorking);
  const [library, setLibrary] = useState(loadLibrary);

  // Persist on change. The browser fires `storage` only in OTHER tabs, so a
  // same-tab write never echoes back; no write-guard is needed.
  useEffect(() => {
    writeKey(WORKING_KEY, { v: SCHEMA_VERSION, playlist: working });
  }, [working]);
  useEffect(() => {
    writeKey(LIBRARY_KEY, { v: SCHEMA_VERSION, playlists: library });
  }, [library]);

  // Cross-tab sync: re-read whichever key another tab changed.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === WORKING_KEY) setWorking(loadWorking());
      else if (e.key === LIBRARY_KEY) setLibrary(loadLibrary());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const clipKeys = useMemo(() => new Set(working.clips.map(keyOf)), [working.clips]);
  const isClipInPlaylist = useCallback((key) => clipKeys.has(key), [clipKeys]);
  const isFull = working.clips.length >= MAX_CLIPS_PER_PLAYLIST;

  const addClip = useCallback((clipLike) => {
    setWorking((w) => {
      const ref = normalizeClip(clipLike);
      if (!ref) return w;
      const key = keyOf(ref);
      if (w.clips.some((c) => keyOf(c) === key)) return w;
      if (w.clips.length >= MAX_CLIPS_PER_PLAYLIST) return w;
      return { ...w, clips: [...w.clips, ref], updatedAt: Date.now() };
    });
  }, []);

  const removeClip = useCallback((key) => {
    setWorking((w) => ({ ...w, clips: w.clips.filter((c) => keyOf(c) !== key), updatedAt: Date.now() }));
  }, []);

  const toggleClip = useCallback((clipLike) => {
    setWorking((w) => {
      const ref = normalizeClip(clipLike);
      if (!ref) return w;
      const key = keyOf(ref);
      const idx = w.clips.findIndex((c) => keyOf(c) === key);
      if (idx >= 0) {
        const clips = w.clips.slice();
        clips.splice(idx, 1);
        return { ...w, clips, updatedAt: Date.now() };
      }
      if (w.clips.length >= MAX_CLIPS_PER_PLAYLIST) return w;
      return { ...w, clips: [...w.clips, ref], updatedAt: Date.now() };
    });
  }, []);

  const reorder = useCallback((from, to) => {
    setWorking((w) => {
      const n = w.clips.length;
      if (from < 0 || from >= n || to < 0 || to >= n || from === to) return w;
      const clips = w.clips.slice();
      const [moved] = clips.splice(from, 1);
      clips.splice(to, 0, moved);
      return { ...w, clips, updatedAt: Date.now() };
    });
  }, []);

  const rename = useCallback((title) => {
    setWorking((w) => ({ ...w, title: (title || '').slice(0, 120), updatedAt: Date.now() }));
  }, []);

  const clearWorking = useCallback(() => {
    setWorking((w) => ({ ...w, clips: [], libraryId: null, updatedAt: Date.now() }));
  }, []);

  const addMany = useCallback((clipLikes) => {
    setWorking((w) => {
      const seen = new Set(w.clips.map(keyOf));
      const next = w.clips.slice();
      for (const cl of clipLikes || []) {
        if (next.length >= MAX_CLIPS_PER_PLAYLIST) break;
        const ref = normalizeClip(cl);
        if (!ref) continue;
        const key = keyOf(ref);
        if (seen.has(key)) continue;
        seen.add(key);
        next.push(ref);
      }
      return { ...w, clips: next, updatedAt: Date.now() };
    });
  }, []);

  // Replace the working clips wholesale, used by the URL <-> working sync, by
  // generation, and by loading a saved playlist. libraryId resets unless the
  // caller is loading a specific saved entry.
  const setClips = useCallback((refsOrClips, title, opts = {}) => {
    setWorking((w) => ({
      ...w,
      clips: sanitizeClips(refsOrClips),
      title: title != null ? String(title).slice(0, 120) : w.title,
      libraryId: 'libraryId' in opts ? opts.libraryId : null,
      updatedAt: Date.now(),
    }));
  }, []);

  // ---- Library ("My Playlists") -------------------------------------------
  const saveToLibrary = useCallback(
    (title, hydratedClips) => {
      const source = sanitizeClips(
        hydratedClips && hydratedClips.length ? hydratedClips : working.clips,
      );
      if (!source.length) return { ok: false, reason: 'empty' };
      if (library.length >= MAX_LIBRARY_PLAYLISTS) return { ok: false, reason: 'libraryFull' };
      const id = newId('pl');
      const name = (title || working.title || 'Untitled playlist').slice(0, 120);
      const entry = { id, title: name, clips: source, createdAt: Date.now(), updatedAt: Date.now() };
      setLibrary((lib) => [entry, ...lib]);
      setWorking((w) => ({ ...w, title: name, libraryId: id }));
      return { ok: true, id };
    },
    [working.clips, working.title, library.length],
  );

  const updateLibraryEntry = useCallback((id, patch) => {
    let ok = false;
    setLibrary((lib) =>
      lib.map((pl) => {
        if (pl.id !== id) return pl;
        ok = true;
        return {
          ...pl,
          title: patch.title != null ? String(patch.title).slice(0, 120) : pl.title,
          clips: patch.clips != null ? sanitizeClips(patch.clips) : pl.clips,
          updatedAt: Date.now(),
        };
      }),
    );
    return { ok };
  }, []);

  const loadIntoWorking = useCallback(
    (id) => {
      const entry = library.find((pl) => pl.id === id);
      if (!entry) return { ok: false };
      setWorking((w) => ({
        ...w,
        clips: sanitizeClips(entry.clips),
        title: entry.title,
        libraryId: entry.id,
        updatedAt: Date.now(),
      }));
      return { ok: true };
    },
    [library],
  );

  const deleteLibraryEntry = useCallback((id) => {
    setLibrary((lib) => lib.filter((pl) => pl.id !== id));
    setWorking((w) => (w.libraryId === id ? { ...w, libraryId: null } : w));
  }, []);

  const renameLibraryEntry = useCallback((id, title) => {
    setLibrary((lib) =>
      lib.map((pl) => (pl.id === id ? { ...pl, title: String(title || '').slice(0, 120), updatedAt: Date.now() } : pl)),
    );
  }, []);

  const value = useMemo(
    () => ({
      working,
      library,
      isClipInPlaylist,
      isFull,
      storageAvailable: availableRef.current,
      addClip,
      removeClip,
      toggleClip,
      reorder,
      rename,
      clearWorking,
      addMany,
      setClips,
      saveToLibrary,
      updateLibraryEntry,
      loadIntoWorking,
      deleteLibraryEntry,
      renameLibraryEntry,
    }),
    [
      working,
      library,
      isClipInPlaylist,
      isFull,
      addClip,
      removeClip,
      toggleClip,
      reorder,
      rename,
      clearWorking,
      addMany,
      setClips,
      saveToLibrary,
      updateLibraryEntry,
      loadIntoWorking,
      deleteLibraryEntry,
      renameLibraryEntry,
    ],
  );

  return <PlaylistContext.Provider value={value}>{children}</PlaylistContext.Provider>;
}

export function usePlaylist() {
  return useContext(PlaylistContext) || FALLBACK;
}
