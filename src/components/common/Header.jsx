import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

/**
 * Header, global nav for the protected app.
 *
 * Three pill links sit on the left (Timeline, Spectrum, Topics) and
 * a single red Menu pill sits in the far-right corner; clicking Menu
 * opens the slide-out drawer with the full route list. A pill (and
 * its corresponding entry in the slide-out menu) is hidden when the
 * user is already on the page that pill leads to, the rule is
 * "don't advertise the page you're on."
 */

// Top-of-page pills. Each entry carries its visual color and a matcher
// that decides whether the pill maps to the current location. The
// matcher matches on pathname and (for /rag-explore) on the ?tab=
// search param. `defaultTab` lets the Spectrum pill self-hide when
// the user is on /rag-explore with no ?tab= (the page defaults to
// spectrum there).
const NAV_ROUTES = [
  {
    label: 'Timeline',
    to: '/',
    bg: 'bg-emerald-700 hover:bg-emerald-800',
    matchPath: '/',
  },
  {
    label: 'Spectrum',
    to: '/rag-explore?tab=spectrum',
    bg: 'bg-violet-700 hover:bg-violet-800',
    matchPath: '/rag-explore',
    matchTab: 'spectrum',
    defaultTab: true,
  },
  {
    label: 'Topics',
    to: '/topic-glossary',
    bg: 'bg-sky-700 hover:bg-sky-800',
    matchPath: '/topic-glossary',
  },
];

// Slide-out menu items. Same shape as NAV_ROUTES so the same matcher
// can hide the current page from this list too. The numbered prefix
// (01., 02., ...) is assigned at render time after filtering so the
// numbering stays contiguous regardless of which page is currently
// hidden.
const MENU_ROUTES = [
  { label: 'Timeline', to: '/', matchPath: '/' },
  {
    label: 'Spectrum',
    to: '/rag-explore?tab=spectrum',
    matchPath: '/rag-explore',
    matchTab: 'spectrum',
    defaultTab: true,
  },
  {
    label: 'Semantic Overlap',
    to: '/rag-explore?tab=related',
    matchPath: '/rag-explore',
    matchTab: 'related',
  },
  {
    label: 'Word Search',
    to: '/rag-explore?tab=lenses',
    matchPath: '/rag-explore',
    matchTab: 'lenses',
  },
  { label: 'Interviews', to: '/interview-index', matchPath: '/interview-index' },
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

  const visibleNav = NAV_ROUTES.filter((r) => !isCurrentRoute(r, location));
  const visibleMenu = MENU_ROUTES.filter((r) => !isCurrentRoute(r, location));

  return (
    <>
      {/* Header, a single row: pill nav strip on the left, search +
          hamburger on the right. The original 4xl wordmark is gone;
          the pills carry the site's identity now. */}
      <header className="relative" style={{ backgroundColor: '#EBEAE9' }}>
        <div className="w-full px-4 sm:px-8 lg:px-12 py-4 sm:py-5">
          <div className="flex items-start justify-between gap-3 sm:gap-6">
            <nav
              aria-label="Featured demos"
              className="flex flex-wrap items-center gap-2 sm:gap-2.5 flex-1 min-w-0"
            >
              {visibleNav.map((route) => (
                <Link
                  key={route.to}
                  to={route.to}
                  className={
                    'inline-flex items-center min-h-11 px-4 sm:px-5 py-2 rounded-full text-sm sm:text-base font-medium text-white shadow-sm transition-colors ' +
                    route.bg
                  }
                  style={{ fontFamily: 'Chivo Mono, monospace' }}
                >
                  {route.label}
                </Link>
              ))}
            </nav>

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

          {visibleMenu.map((item, idx) => {
            const num = String(idx + 1).padStart(2, '0') + '.';
            const isLast = idx === visibleMenu.length - 1;
            return (
              <div key={item.to} className={`w-full ${!isLast ? 'border-b border-black' : ''}`}>
                {/* Hover state inverts the row from black-on-red (drawer
                    default) to white-on-black so the affordance is
                    unambiguous in both light and dark OS modes. */}
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
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
