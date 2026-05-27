import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  X
} from 'lucide-react';

/**
 * Header - Shared header component with navigation
 * 
 * Features:
 * - Project title/logo
 * - Search and hamburger menu icons
 * - Slide-out sidebar with navigation links
 * - Logout functionality
 * 
 * @returns {React.ReactElement} The header with navigation
 */
export default function Header() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const hamburgerRef = useRef(null);
  const menuCloseRef = useRef(null);
  const searchTriggerRef = useRef(null);

  // Esc-to-close + focus restoration for the slide-out menu.
  // WCAG 2.4.3 (Focus Order) + ARIA Authoring Practices for dialogs:
  // when the menu opens, move focus into it (to the close button) so a
  // keyboard user lands inside the dialog; when the menu closes,
  // return focus to the hamburger trigger so the user resumes from
  // where they invoked the dialog rather than jumping to top of page.
  // Esc handler is the standard dialog-dismiss affordance documented
  // in the WAI-ARIA Authoring Practices.
  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);

    // Defer the focus call until the slide-in transition has positioned
    // the close button in the viewport; without this the focus moves to
    // the close button before it visually arrives, which screen readers
    // and JAWS users perceive as the focus jumping somewhere unexpected.
    const t = setTimeout(() => {
      menuCloseRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener('keydown', handleKey);
      clearTimeout(t);
      // Restore focus to the hamburger that opened the menu, so the
      // keyboard user picks up where they left off.
      hamburgerRef.current?.focus();
    };
  }, [isMenuOpen]);


  return (
    <>
      {/* Header */}
      <header className="relative" style={{ backgroundColor: '#EBEAE9' }}>
        {/* The .mobile-collapsible-header / .site-logo-text marker classes
            let src/index.css collapse the header height and shrink the
            wordmark when the viewport is in short-landscape (height <=
            480px, e.g. a phone rotated sideways). Desktop and portrait
            mobile layouts are unaffected -- the rule is gated on
            (orientation: landscape) and (max-height: 480px). */}
        <div className="w-full px-4 sm:px-8 lg:px-12 py-6 lg:py-9 mobile-collapsible-header">
          <div className="flex justify-between items-start">
            {/* Logo/Title */}
            <Link to="/" className="text-decoration-none">
              <div>
                <span className="site-logo-text text-stone-900 text-4xl font-normal font-['Source_Serif_Pro']">Civil Rights </span>
                <br />
                <span className="site-logo-text text-stone-900 text-4xl font-bold font-['Source_Serif_Pro'] leading-9">History Project</span>
              </div>
            </Link>

            {/* Navigation Icons - stacked vertically */}
            <div className="flex flex-col items-end gap-3">
              {/* Hamburger menu icon -- w-11 h-11 on mobile gives a WCAG 2.2 AA-compliant 44x44 tap target; lg restores the original w-12 + auto height */}
              <button
                ref={hamburgerRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
                aria-controls="site-navigation-menu"
                className="w-11 h-11 lg:w-12 lg:h-auto flex flex-col justify-center lg:justify-start items-end gap-1 hover:opacity-70 transition-opacity"
              >
                <div className="w-6 lg:w-9 h-0.5 bg-black"></div>
                <div className="w-6 lg:w-9 h-0.5 bg-black"></div>
                <div className="w-6 lg:w-9 h-0.5 bg-black"></div>
              </button>

              {/* Search button — navigates to the RAG-backed semantic search.
                  The previous in-page Firestore-backed overlay was disabled
                  because Firestore content is not yet loaded; the new
                  /rag-explore#search surface is live and bounded-cost. */}
              <button
                ref={searchTriggerRef}
                onClick={() => navigate('/rag-explore#search')}
                aria-label="Search the archive"
                className="p-3 lg:p-1 text-black hover:opacity-70 transition-opacity"
              >
                <Search size={18} className="lg:w-6 lg:h-6" />
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
        className={`fixed top-0 right-0 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-3xl h-full px-4 sm:px-6 lg:px-9 py-4 sm:py-6 lg:py-9 shadow-xl z-50 flex justify-start items-start transition-transform duration-300 ease-in-out overflow-hidden ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: '#F2483C' }}
      >
        <div className="w-full h-full flex flex-col justify-start items-start gap-2 sm:gap-4 lg:gap-12">
          {/* Header */}
          <div className="w-full flex justify-between items-center pb-2 sm:pb-3 lg:pb-6 border-b border-black">
            <div className="text-black text-2xl lg:text-3xl font-light" style={{ fontFamily: 'Chivo Mono, monospace' }}>
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

          {[
            { num: '01.', label: 'Timeline', to: '/' },
            { num: '02.', label: 'Embeddings ★', to: '/rag-explore' },
            { num: '03.', label: 'Events', to: '/rag-explore?tab=events' },
            { num: '04.', label: 'Concept axes', to: '/rag-explore?tab=spectrum' },
            { num: '05.', label: 'Voices in conversation', to: '/rag-explore?tab=related' },
            { num: '06.', label: 'Search', to: '/rag-explore?tab=search' },
            { num: '07.', label: 'Interviews', to: '/interview-index' },
            { num: '08.', label: 'Topic Glossary', to: '/topic-glossary' },
            { num: '09.', label: 'About', to: '/about' },
          ].map((item, idx, arr) => (
            <div key={item.num} className={`w-full pb-2 ${idx < arr.length - 1 ? 'border-b border-black' : ''}`}>
              <Link
                to={item.to}
                className="flex items-center justify-between w-full hover:opacity-80 transition-opacity"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="text-black text-sm lg:text-base font-light" style={{ fontFamily: 'Chivo Mono, monospace' }}>
                  {item.num}
                </div>
                <div className="text-right text-black text-base sm:text-lg lg:text-xl font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {item.label}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

    </>
  );
}