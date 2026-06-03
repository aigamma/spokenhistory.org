import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Moon, Sun, Home, Pause, Play } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAnimationPreference } from '../../hooks/useAnimationPreference';
import ShareButton from '../ShareButton';

/**
 * Header, global nav for the protected app.
 *
 * The header is now just two controls: a Light/Dark toggle and a red
 * Menu pill in the far-right corner. There are no top-of-page pill
 * links anymore; clicking Menu opens the slide-out drawer that carries
 * every destination. The drawer entry for the page the user is already
 * on is grayed and non-interactive (marked aria-current) rather than
 * hidden, so the menu keeps a constant shape and shows the user where
 * they are.
 */

// Slide-out menu items. Dustin (2026-05-30) asked to remove the
// top-of-page pill links and let the single Menu drawer carry every
// destination, so there is no NAV_ROUTES list anymore. "Spectrum" is
// renamed "Data Insights", and the two technical sub-tab
// entries ("Semantic Overlap", "Word Search") are dropped from the
// menu in favor of content-level destinations. The numbered prefix
// (01., 02., ...) is assigned at render time. The entry matching the
// current page is grayed and non-interactive (not hidden), so the
// numbering and the menu's overall shape stay constant across pages.
//
// 2026-05-31: the card-grid Interview Index was retired and merged into
// the richer Table of Contents (parts, chapters, click-to-play). The
// single "Interviews" entry now points at /table-of-contents, and the
// old standalone "Table of Contents" entry plus the old
// "Interviews" -> /interview-index entry are both gone.
// 2026-06-02 (Dustin, afternoon): the main menu is set to FIVE destinations,
// re-promoting "Explore Interview Data" out of the footer and splitting the
// morning's combined "Interviews & People" entry back into a People-led
// section.
// 2026-06-03 (Eric, later batch): the merged "People & Interviews" experiment
// was undone. The per-interview chapter index (the collapsed, alphabetical,
// click-to-play page at /table-of-contents) is re-surfaced as its own primary
// item, "Interviews"; the themes-and-playlists book that had taken the "Table
// of Contents" label is renamed "Topics"; and the people page, stripped of
// interviewees (now browsed under Interviews), holds only the historic figures
// (route still /people). Its PAGE title is "Historical Figures Referenced in
// Interviews", but the MENU label is just "People" (Eric, 2026-06-03), another
// deliberate label/page mismatch. Order, menu label -> route:
//   Timeline               -> /                  (scroll-driven home timeline)
//   Interviews             -> /table-of-contents (per-interview chapter index, click-to-play)
//   Topics                 -> /topic-glossary    (the nested themes-and-playlists book)
//   People                 -> /people            (page title "Historical Figures Referenced in Interviews"; figures -> /person)
//   K-12 Curriculum        -> /curriculum
//   Explore Interview Data -> /rag-explore       (the maps and retrieval surfaces; bottom row, Eric 2026-06-03)
// Essays, About, Methodology, and Technical Documentation stay in the global
// footer sitemap (Footer.jsx). NOTE: the visible labels still do NOT all match
// their route names, kept stable because many in-app deep links target them.
// "Interviews" routes at /table-of-contents (the per-interview chapter index);
// "Topics" routes at /topic-glossary (the thematic themes-and-playlists book).
const MENU_ROUTES = [
  { label: 'Timeline', to: '/', matchPath: '/' },
  { label: 'Interviews', to: '/table-of-contents', matchPath: '/table-of-contents' },
  { label: 'Topics', to: '/topic-glossary', matchPath: '/topic-glossary' },
  { label: 'People', to: '/people', matchPath: '/people' },
  { label: 'K-12 Curriculum', to: '/curriculum', matchPath: '/curriculum' },
  { label: 'Explore Interview Data', to: '/rag-explore', matchPath: '/rag-explore' },
];

function isCurrentRoute(route, location) {
  if (!route.matchPath) return false;
  if (location.pathname !== route.matchPath) return false;
  if (!route.matchTab) return true;
  const tab = new URLSearchParams(location.search).get('tab');
  if (tab === route.matchTab) return true;
  if (route.defaultTab && tab == null) return true;
  return false;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const menuTriggerRef = useRef(null);
  const menuCloseRef = useRef(null);
  const { isDark, toggle } = useTheme();
  const { paused: animationsPaused, toggle: toggleAnimations } = useAnimationPreference();

  // Esc-to-close + focus restoration for the slide-out menu. WCAG
  // 2.4.3 + ARIA Authoring Practices for dialogs: focus moves into
  // the dialog on open, returns to the trigger on close.
  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);

    // Defer focus until the slide-in transition finishes positioning
    // the close button, otherwise screen readers narrate the focus
    // moving before the button has visually arrived.
    const t = setTimeout(() => {
      menuCloseRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener('keydown', handleKey);
      clearTimeout(t);
      menuTriggerRef.current?.focus();
    };
  }, [isMenuOpen]);

  // Every menu item renders below; the entry matching the current page
  // is grayed and non-interactive (computed per-item) instead of being
  // filtered out, so the drawer keeps a constant shape and numbering.

  return (
    <>
      {/* Header. The top-of-page pill nav is gone (Dustin, 2026-05-30); the
          chrome row carries a "share this page" control, a "Pause Animations"
          toggle (timeline page only), the Light/Dark toggle, and the Menu
          button, pinned right. Every navigation destination lives in the Menu
          drawer. The site-wide command palette is no longer surfaced as a
          header button (Eric, 2026-06-03); it stays mounted at the App root
          and opens via Cmd/Ctrl+K or "/". */}
      <header className="relative bg-[#EBEAE9] dark:bg-zinc-900">
        <div className="w-full px-4 sm:px-8 lg:px-12 pt-3 sm:pt-4 pb-2.5">
          <div className="flex items-center justify-between gap-2 sm:gap-2.5">
            {/* Return-home control in the upper-left corner (Dustin, 2026-06-02
                afternoon). The wordmark graphic was removed; a plain text-plus-icon
                "Home" link carries the return-home function so it survives without
                the graphic. It shows on every page EXCEPT the homepage itself,
                where returning home is a no-op (Eric's earlier call); on the
                homepage an empty span holds the left slot so justify-between still
                pins the controls to the right. */}
            {location.pathname !== '/' ? (
              <Link
                to="/"
                aria-label="Return to the homepage"
                className="inline-flex items-center gap-1.5 min-h-11 px-3 -ml-1 rounded-full text-sm sm:text-base font-medium text-stone-700 dark:text-zinc-200 hover:bg-white/70 dark:hover:bg-zinc-800/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                style={{ fontFamily: 'Chivo Mono, monospace' }}
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                Home
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}

            {/* Right-side chrome cluster: share, Pause Animations (timeline page
                only), theme toggle, menu, grouped so justify-between keeps the
                home link at the left edge and these pinned to the right. flex-wrap
                + justify-end let the row drop the Dark+Menu group onto a neat
                second right-aligned line on the narrowest phones rather than
                clipping the "Pause Animations" label. */}
            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2.5">
            {/* Share this page: copies the current URL, the answer to "share
                whatever page you are on." On the interview, Table of Contents,
                and playlist pages the URL also carries the open section or
                clip, so this shares the exact view, not just the route. */}
            <ShareButton
              variant="icon"
              getUrl={() => (typeof window !== 'undefined' ? window.location.href : '/')}
              label="Share this page"
              iconClassName="w-4 h-4"
              className="min-w-11 min-h-11 justify-center rounded-full border border-stone-300 dark:border-zinc-600 bg-white/70 dark:bg-zinc-800/70 text-stone-600 dark:text-zinc-300 shadow-sm"
            />

            {/* Pause Animations toggle. RENDERED ONLY ON THE TIMELINE PAGE
                ("/"), Eric 2026-06-03: the looping decorative motion (the period
                "GIF" videos plus a few infinite CSS animations) lives on the
                landing-page timeline, so the control belongs where the motion
                is, not on every page where "Pause Animations" would have nothing
                to pause. WCAG 2.2.2 (Pause, Stop, Hide) wants an in-page way to
                stop motion that auto-plays and loops, which the OS-only
                prefers-reduced-motion rule cannot provide (and CSS cannot pause a
                <video>). The default is animations ON unless the OS asks for
                reduced motion (see useAnimationPreference + the no-FOUC script in
                index.html), so the button reads "Pause Animations", a clear and
                discoverable affordance, rather than the murkier "Play
                Animations". This persists the choice and reflects it onto <html
                data-animations-paused>; the timeline pauses its videos off that,
                the stylesheet freezes keyframe animations off it. The icon +
                label name the action the button performs: Pause while motion is
                running, Play once paused. */}
            {location.pathname === '/' && (
            <button
              type="button"
              onClick={toggleAnimations}
              aria-pressed={animationsPaused}
              aria-label={animationsPaused ? 'Play animations' : 'Pause animations'}
              title={animationsPaused ? 'Resume page animations' : 'Pause page animations'}
              className={
                'inline-flex items-center gap-1.5 min-w-11 min-h-11 px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base font-medium shadow-sm transition-colors ' +
                (animationsPaused
                  ? 'bg-stone-800 text-white border border-stone-800 hover:bg-stone-900'
                  : 'bg-white/70 dark:bg-zinc-800/70 text-stone-700 dark:text-zinc-200 border border-stone-300 dark:border-zinc-600 hover:bg-white dark:hover:bg-zinc-800')
              }
              style={{ fontFamily: 'Chivo Mono, monospace' }}
            >
              {animationsPaused
                ? <Play className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                : <Pause className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}
              {/* Label is visible at EVERY width, including the narrowest
                  phones (Eric, 2026-06-03): a motion-sensitive visitor has to
                  be able to SEE that a pause exists, or they bounce (or resort
                  to an ad blocker to kill the videos) before they find a bare
                  icon. whitespace-nowrap keeps the two words together; the
                  chrome row wraps the whole pill instead of breaking the text.
                  Room is made by shrinking the Dark toggle to its icon below
                  sm and letting the row wrap. */}
              <span className="whitespace-nowrap">
                {animationsPaused ? 'Play Animations' : 'Pause Animations'}
              </span>
            </button>
            )}

            <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
              {/* Light/dark toggle, sits just left of Menu. Its label
                  names the mode it switches TO (Dark when currently
                  light, Light when currently dark) and the pill previews
                  that target mode. */}
              <button
                type="button"
                onClick={toggle}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className={
                  'inline-flex items-center justify-center gap-1.5 min-w-11 min-h-11 px-3 sm:px-5 py-2 rounded-full text-sm sm:text-base font-medium shadow-sm transition-colors ' +
                  (isDark ? 'bg-stone-200 text-stone-900 hover:bg-white' : 'bg-stone-800 text-white hover:bg-stone-900')
                }
                style={{ fontFamily: 'Chivo Mono, monospace' }}
              >
                {isDark ? <Sun className="w-4 h-4 flex-shrink-0" aria-hidden="true" /> : <Moon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}
                {/* Text drops below sm so "Pause Animations" keeps its full
                    label on phones; the Moon/Sun icon plus the aria-label carry
                    the control on small screens. */}
                <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
              </button>

              <button
                ref={menuTriggerRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
                aria-controls="site-navigation-menu"
                className="inline-flex items-center min-h-11 px-4 sm:px-5 py-2 rounded-full text-sm sm:text-base font-medium text-white shadow-sm transition-colors bg-red-600 hover:bg-red-700 flex-shrink-0"
                style={{ fontFamily: 'Chivo Mono, monospace' }}
              >
                Menu
              </button>
            </div>
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        id="site-navigation-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        aria-hidden={!isMenuOpen}
        className={`fixed top-0 right-0 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-3xl h-full px-4 sm:px-6 lg:px-9 py-4 sm:py-6 lg:py-9 shadow-xl z-50 flex justify-start items-start transition-transform duration-300 ease-in-out overflow-y-auto ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: '#F2483C' }}
      >
        <div className="w-full h-full flex flex-col justify-start items-start gap-2 sm:gap-4 lg:gap-12">
          <div className="w-full flex justify-between items-center pb-2 sm:pb-3 lg:pb-6 border-b border-black">
            <div className="text-black text-3xl lg:text-4xl font-light" style={{ fontFamily: 'Chivo Mono, monospace' }}>
              Menu
            </div>
            <button
              ref={menuCloseRef}
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
              className="inline-flex items-center justify-center min-w-11 min-h-11 p-2 outline outline-2 outline-offset-[-1px] outline-black hover:opacity-70 transition-opacity"
            >
              <X size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          {MENU_ROUTES.map((item, idx) => {
            const num = String(idx + 1).padStart(2, '0') + '.';
            const isLast = idx === MENU_ROUTES.length - 1;
            const isCurrent = isCurrentRoute(item, location);
            return (
              <div key={item.to} className={`w-full ${!isLast ? 'border-b border-black' : ''}`}>
                {isCurrent ? (
                  // Current page: grayed and non-interactive (aria-current)
                  // so the user sees where they are and cannot "navigate"
                  // to the page they are already on.
                  <div
                    aria-current="page"
                    className="flex items-center justify-between w-full px-2 py-2 -mx-2 text-black/40 cursor-default select-none"
                  >
                    <div className="text-base lg:text-lg font-light" style={{ fontFamily: 'Chivo Mono, monospace' }}>
                      {num}
                    </div>
                    <div className="text-right text-xl sm:text-2xl lg:text-3xl font-medium leading-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {item.label}
                    </div>
                  </div>
                ) : (
                  /* Hover state inverts the row from black-on-red (drawer
                     default) to white-on-black so the affordance is
                     unambiguous in both light and dark OS modes. */
                  <Link
                    to={item.to}
                    className="group flex items-center justify-between w-full px-2 py-2 -mx-2 text-black hover:bg-black hover:text-white focus-visible:bg-black focus-visible:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="text-base lg:text-lg font-light" style={{ fontFamily: 'Chivo Mono, monospace' }}>
                      {num}
                    </div>
                    <div className="text-right text-xl sm:text-2xl lg:text-3xl font-medium leading-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {item.label}
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
