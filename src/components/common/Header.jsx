import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { 
  Search, 
  X
} from 'lucide-react';
import VectorSearchOverlay from '../VectorSearchOverlay';

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();


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

              {/* Search button -- p-3 on mobile expands the 18px icon to a ~42px tap target (further enlarged by the surrounding header padding); lg restores the original p-1 + 24px icon */}
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Open search"
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
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
              className="inline-flex items-center justify-center min-w-11 min-h-11 p-2 outline outline-2 outline-offset-[-1px] outline-black hover:opacity-70 transition-opacity"
            >
              <X size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          {/* Timeline */}
          <div className="w-full border-b border-black pb-2 sm:pb-3 lg:pb-6">
            <Link
              to="/"
              className="flex items-center justify-between w-full hover:opacity-80 transition-opacity"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="text-black text-xl lg:text-3xl font-light" style={{ fontFamily: 'Chivo Mono, monospace' }}>
                01.
              </div>
              <div className="text-right text-black text-2xl sm:text-3xl md:text-4xl lg:text-8xl font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                Timeline
              </div>
            </Link>
          </div>

          {/* Interviews */}
          <div className="w-full border-b border-black pb-2 sm:pb-3 lg:pb-6">
            <Link
              to="/interview-index"
              className="flex items-center justify-between w-full hover:opacity-80 transition-opacity"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="text-black text-xl lg:text-3xl font-light" style={{ fontFamily: 'Chivo Mono, monospace' }}>
                02.
              </div>
              <div className="text-right text-black text-2xl sm:text-3xl md:text-4xl lg:text-8xl font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                Interviews
              </div>
            </Link>
          </div>

          {/* Glossary */}
          <div className="w-full border-b border-black pb-2 sm:pb-3 lg:pb-6">
            <Link
              to="/topic-glossary"
              className="flex items-center justify-between w-full hover:opacity-80 transition-opacity"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="text-black text-xl lg:text-3xl font-light" style={{ fontFamily: 'Chivo Mono, monospace' }}>
                03.
              </div>
              <div className="text-right text-black text-2xl sm:text-3xl md:text-4xl lg:text-8xl font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                Glossary
              </div>
            </Link>
          </div>

          {/* About */}
          <div className="w-full">
            <Link
              to="/about"
              className="flex items-center justify-between w-full hover:opacity-80 transition-opacity"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="text-black text-xl lg:text-3xl font-light" style={{ fontFamily: 'Chivo Mono, monospace' }}>
                04.
              </div>
              <div className="text-right text-black text-2xl sm:text-3xl md:text-4xl lg:text-8xl font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                About
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <VectorSearchOverlay 
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      )}
    </>
  );
} 