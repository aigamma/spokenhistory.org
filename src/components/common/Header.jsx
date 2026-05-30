import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

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
// renamed "Ideological Spectrums", and the two technical sub-tab
// entries ("Semantic Overlap", "Word Search") are dropped from the
// menu in favor of content-level destinations. The numbered prefix
// (01., 02., ...) is assigned at render time. The entry matching the
// current page is grayed and non-interactive (not hidden), so the
// numbering and the menu's overall shape stay constant across pages.
const MENU_ROUTES = [
  { label: 'Timeline', to: '/', matchPath: '/' },
  {
    label: 'Ideological Spectrums',
    to: '/rag-explore?tab=spectrum',
    matchPath: '/rag-explore',
    matchTab: 'spectrum',
    defaultTab: true,
  },
  { label: 'Interviews', to: '/interview-index', matchPath: '/interview-index' },
  { label: 'People', to: '/people', matchPath: '/people' },
  { label: 'Topics', to: '/topic-glossary', matchPath: '/topic-glossary' },
  { label: 'About', to: '/about', matchPath: '/about' },
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
      {/* Header, a single row. The top-of-page pill nav is gone (Dustin,
          2026-05-30); the row now carries only the Light/Dark toggle and
          the Menu button, pinned to the right. Every destination lives
          in the Menu drawer. */}
      <header className="relative bg-[#EBEAE9] dark:bg-zinc-900">
        <div className="w-full px-4 sm:px-8 lg:px-12 py-4 sm:py-5">
          <div className="flex items-start justify-end gap-3 sm:gap-6">
            <div className="flex items-start gap-2 sm:gap-2.5 flex-shrink-0">
              {/* Light/dark toggle, sits just left of Menu. Its label
                  names the mode it switches TO (Dark when currently
                  light, Light when currently dark) and the pill previews
                  that target mode. */}
              <button
                type="button"
                onClick={toggle}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className={
                  'inline-flex items-center gap-1.5 min-h-11 px-4 sm:px-5 py-2 rounded-full text-sm sm:text-base font-medium shadow-sm transition-colors ' +
                  (isDark ? 'bg-stone-200 text-stone-900 hover:bg-white' : 'bg-stone-800 text-white hover:bg-stone-900')
                }
                style={{ fontFamily: 'Chivo Mono, monospace' }}
              >
                {isDark ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
                {isDark ? 'Light' : 'Dark'}
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
