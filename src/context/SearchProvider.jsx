/**
 * @fileoverview SearchProvider, the small context that owns the command
 * palette's open state and its global keyboard shortcuts.
 *
 * The palette (CommandPalette) is mounted once at the App root, outside the
 * router's <Routes>, so it overlays every page including the header-less
 * interview and player routes. The header's search trigger and the global
 * shortcuts both flip the same `isOpen` flag through this context, which is
 * why the state lives here rather than inside the header.
 *
 * Shortcuts:
 *   - Cmd/Ctrl + K  toggles the palette from anywhere.
 *   - "/"           opens it, but only when the user is not already typing in
 *                   a field, so it never swallows a slash meant for an input.
 */

import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';

const SearchContext = createContext(null);

const NOOP = () => {};
// Returned by useSearch when no provider is mounted (e.g. an isolated test
// render), so a stray call is a harmless no-op rather than a crash.
const FALLBACK = { isOpen: false, openSearch: NOOP, closeSearch: NOOP, toggleSearch: NOOP };

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return el.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function SearchProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => setIsOpen(false), []);
  const toggleSearch = useCallback(() => setIsOpen((v) => !v), []);

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key;
      if ((e.metaKey || e.ctrlKey) && (k === 'k' || k === 'K')) {
        e.preventDefault();
        setIsOpen((v) => !v);
        return;
      }
      if (k === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const value = useMemo(
    () => ({ isOpen, openSearch, closeSearch, toggleSearch }),
    [isOpen, openSearch, closeSearch, toggleSearch],
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  return useContext(SearchContext) || FALLBACK;
}
