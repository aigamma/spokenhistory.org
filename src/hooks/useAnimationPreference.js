import { useCallback, useEffect, useState } from 'react';

/**
 * In-page "Pause Animations" preference.
 *
 * The landing-page timeline runs continuous, decorative motion (the
 * looping period "GIF" videos plus a few infinite CSS animations). The
 * global `@media (prefers-reduced-motion: reduce)` rule in
 * src/styles/index.css collapses CSS animation/transition timing, but it
 * cannot pause a <video> and it only follows the OS setting. WCAG 2.2.2
 * (Pause, Stop, Hide) wants an in-page control for motion that auto-plays
 * and loops longer than five seconds, so this preference gives the header
 * an explicit, persisted toggle.
 *
 * The choice is mirrored, exactly like the light/dark theme, onto a
 * `data-animations-paused` attribute on <html>:
 *   - CSS freezes infinite keyframe animations off that attribute
 *     (see src/styles/index.css).
 *   - The decorative timeline videos are paused/resumed in JS by the
 *     Home page, which reads useAnimationsPaused() (CSS cannot pause a
 *     <video>). User-initiated interview players are NOT affected; the
 *     Home page scopes the pause to the timeline content only.
 *
 * Default with no stored choice: honor the OS prefers-reduced-motion
 * setting, so a motion-sensitive visitor lands on a paused page without
 * having to find the button first.
 *
 * Pattern intentionally matches useTheme/useIsDark in src/hooks/useTheme.js:
 * a writer hook (useAnimationPreference) the header uses to toggle and
 * persist, and a read-only hook (useAnimationsPaused) any component uses
 * to react to the current value via a MutationObserver on <html>.
 */

const STORAGE_KEY = 'animationsPaused';
const ATTR = 'data-animations-paused';

function prefersReducedMotion() {
  try {
    return typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function getInitialPaused() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    /* localStorage blocked (private mode); fall through to OS preference */
  }
  // No explicit choice yet: follow the OS reduced-motion setting.
  return prefersReducedMotion();
}

/**
 * Writer hook for the header control. Returns the current paused state
 * and a toggle that flips it, persists the choice, and (via the effect)
 * reflects it onto <html data-animations-paused>. Idempotent with the
 * no-FOUC script in index.html, which sets the attribute before paint.
 */
export function useAnimationPreference() {
  const [paused, setPaused] = useState(getInitialPaused);

  useEffect(() => {
    document.documentElement.setAttribute(ATTR, paused ? 'true' : 'false');
  }, [paused]);

  const toggle = useCallback(() => {
    setPaused((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false');
      } catch {
        /* localStorage blocked; the attribute still applies for the session */
      }
      return next;
    });
  }, []);

  return { paused, toggle };
}

/**
 * Read-only hook. Subscribes to the <html data-animations-paused>
 * attribute via MutationObserver, so any component (the Home timeline
 * pausing its videos, for example) re-renders the moment the header
 * toggle flips the preference.
 */
export function useAnimationsPaused() {
  const [paused, setPaused] = useState(() => {
    try {
      return document.documentElement.getAttribute(ATTR) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setPaused(root.getAttribute(ATTR) === 'true');
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: [ATTR] });
    return () => observer.disconnect();
  }, []);

  return paused;
}
