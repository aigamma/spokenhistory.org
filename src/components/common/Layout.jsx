import { useAuth } from '../../contexts/AuthContext'
import Header from './Header'

export default function Layout({ children }) {
  const { loading } = useAuth()
  
  if (loading) {
    return (
      <div
        className="h-screen flex items-center justify-center bg-[#EBEAE9] dark:bg-stone-900"
        role="status"
        aria-live="polite"
      >
        <div
          className="w-12 h-12 border-4 border-black/20 rounded-full animate-spin"
          style={{ borderTopColor: '#F2483C' }}
          aria-hidden="true"
        />
        <span className="sr-only">Loading...</span>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen w-full font-body bg-[#EBEAE9] dark:bg-stone-900">
      {/* Skip-link for WCAG 2.2 SC 2.4.1 (Bypass Blocks). Visually
          hidden until focused via keyboard Tab; appears at the top-
          left as a high-contrast pill on focus. Keyboard users can
          press Tab once on page load, see the skip-link, press
          Enter to jump past the repeated header navigation (hamburger
          + search + sidebar = 5+ Tab presses on every page) and land
          on the <main> content. Screen readers also announce the
          link in the page outline so a JAWS / NVDA / VoiceOver user
          can reach it via heading/link navigation.

          Targets #main-content. The <main> below carries that id +
          tabIndex={-1} so the link target receives focus correctly
          when clicked (without tabIndex={-1}, focusing a non-
          interactive element via fragment-link is browser-inconsistent). */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-stone-900 focus:text-white focus:rounded focus:outline focus:outline-2 focus:outline-offset-2"
        style={{ outlineColor: '#F2483C' }}
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="w-full focus:outline-none">
        {children}
      </main>
    </div>
  )
}
