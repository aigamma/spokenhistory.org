/**
 * @fileoverview In-page scrolling that is safe under HashRouter.
 *
 * This app runs under a <HashRouter> (see src/main.jsx), so the URL hash holds
 * the router's ROUTE (for example "#/topic-glossary"). That makes a raw
 * fragment anchor such as <a href="#theme-x"> actively dangerous: clicking it
 * overwrites the router hash with "#theme-x", the router then tries to navigate
 * to the bogus route "/theme-x", matches nothing, and renders the catch-all 404
 * page. That is exactly what was breaking the Topics page "Contents" jump-links,
 * the accessibility skip-link, and the citation footnote links.
 *
 * So we never rely on the browser's native fragment-anchor behavior for in-page
 * navigation. Instead, intercept the click (preventDefault) and scroll to the
 * target element by id with this helper, which leaves the router hash untouched.
 * prefers-reduced-motion is honored (an instant jump instead of a smooth
 * scroll), matching the rest of the site's motion discipline.
 *
 * @param {string} id The target element's id (without the leading "#").
 * @param {{ focus?: boolean }} [opts] focus moves keyboard focus to the target
 *   (for skip-links and other a11y jumps; the target must carry tabIndex={-1}).
 */
export function scrollToId(id, { focus = false } = {}) {
  if (typeof document === 'undefined' || !id) return;
  const el = document.getElementById(id);
  if (!el) return;
  const reduceMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  // Move focus to the target when asked (skip-link semantics). preventScroll
  // avoids a second, competing scroll on top of the scrollIntoView above.
  if (focus && typeof el.focus === 'function') {
    el.focus({ preventScroll: true });
  }
}
