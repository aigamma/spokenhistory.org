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

/**
 * Reactive, read-only dark-mode flag for any component, especially data-
 * visualizations that set colors in JavaScript (Plotly layouts, Leaflet
 * tile layers, SVG/canvas fills) and must recolor when the theme flips.
 *
 * Subscribes to class changes on <html> via MutationObserver, so it
 * updates live the moment the header toggle adds/removes the `dark`
 * class. Components branch their JS colors on the returned boolean and
 * re-render automatically.
 */
export function useIsDark() {
  const [isDark, setIsDark] = useState(() => {
    try {
      return document.documentElement.classList.contains('dark');
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
