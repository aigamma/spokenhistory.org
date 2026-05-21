import { useState, useEffect } from 'react'

const STORAGE_KEY = 'civilRights.mobileAdvisoryDismissed'
const MOBILE_BREAKPOINT_PX = 1024

/**
 * MobileAdvisory component.
 *
 * Replaces the previous fullscreen MobileOverlay that hard-blocked all
 * screens under 1024px with a "Desktop Experience Required" gate. The
 * new component is a small dismissible banner at the top of the page:
 * mobile readers still see a note that some pages are desktop-optimized,
 * but they can continue to use the site. Dismissal persists across
 * sessions via localStorage so a returning reader does not see the
 * banner again.
 *
 * Visual language matches the previous component: cream background
 * (#EBEAE9), red civil-rights accent on the icon (#F2483C), black
 * border, Inter for the headline word and Source Serif Pro for the
 * trailing body.
 */
export default function MobileAdvisory() {
  const [isMobile, setIsMobile] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT_PX)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'true') {
        setDismissed(true)
      }
    } catch (e) {
      // localStorage unavailable (private browsing, sandboxed iframe, etc.).
      // Treat as "not dismissed" and continue.
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch (e) {
      // Same as above; the in-memory dismissal still works for this session.
    }
  }

  if (!isMobile || dismissed) {
    return null
  }

  return (
    <div
      className="w-full px-4 py-3 border-b-2 border-black flex items-start justify-between gap-3"
      style={{
        backgroundColor: '#EBEAE9',
        fontFamily: 'Inter, sans-serif',
      }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <svg
          className="h-5 w-5 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          style={{ color: '#F2483C' }}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <div className="text-sm text-black leading-snug">
          <span className="font-medium">Best experienced on desktop.</span>{' '}
          <span style={{ fontFamily: 'Source Serif Pro, serif' }}>
            Some pages may not be fully optimized for mobile yet.
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 inline-flex items-center justify-center min-w-11 min-h-11 -mr-2 text-black hover:opacity-70 transition-opacity"
        aria-label="Dismiss desktop recommendation"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}
