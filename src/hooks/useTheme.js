import { useCallback, useEffect, useState } from 'react';

/**
 * Manual light/dark theme.
 *
 * The theme is applied as a `dark` class on <html> (Tailwind v4 is
 * configured for class-based dark via the @custom-variant in
 * src/styles/index.css). A no-FOUC inline script in index.html applies
 * the stored choice before first paint; this hook reads that initial
 * state and lets the header toggle flip + persist it.
 *
 * Default is LIGHT: dark is opt-in via the toggle, so the in-progress
 * dark theme (currently the person pages + the header) is never shown to
 * a visitor who did not ask for it. Once every page is dark-themed, the
 * default can switch to follow prefers-color-scheme.
 */
function getInitialIsDark() {
  try {
    if (document.documentElement.classList.contains('dark')) return true;
    return localStorage.getItem('theme') === 'dark';
  } catch {
    return false;
  }
}

export function useTheme() {
  const [isDark, setIsDark] = useState(getInitialIsDark);

  // Keep the <html> class in sync with state. Idempotent with the
  // no-FOUC script, which has already set the class on first load.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('theme', next ? 'dark' : 'light');
      } catch {
        /* localStorage blocked (private mode); class still applies for the session */
      }
      return next;
    });
  }, []);

  return { isDark, toggle };
}
