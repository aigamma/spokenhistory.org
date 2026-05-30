import { Link, useLocation } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * 404 page. Replaces the silent <Navigate to="/" replace /> catch-all
 * that previously made mistyped URLs disappear into the home page with
 * no feedback. The user (or the bookmark or the search-engine bot) now
 * sees an explicit "this URL does not exist" message + a list of the
 * real navigation destinations they probably meant.
 *
 * Showing the attempted path (location.pathname) helps a confused user
 * diagnose whether the issue was their typo or our broken link; it also
 * gives the support team a string to grep against in error reports.
 */
export default function NotFound() {
  useDocumentTitle('Page not found');
  const location = useLocation();
  const attemptedPath = location.pathname + (location.hash || '');

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 font-body bg-[#EBEAE9] dark:bg-stone-900"
    >
      <main id="main-content" tabIndex={-1} className="max-w-lg w-full focus:outline-none">
        <div className="bg-white dark:bg-stone-800 border-2 border-black dark:border-stone-700 p-6 sm:p-8 shadow-xl">
          <p className="text-civil-red-body text-base font-light font-mono mb-2">
            404
          </p>
          <h1
            className="text-stone-900 text-3xl sm:text-4xl md:text-5xl font-medium mb-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Page not found
          </h1>
          <p
            className="text-stone-900 text-base sm:text-lg mb-2"
            style={{ fontFamily: 'Source Serif 4, serif' }}
          >
            The URL you typed or the link you followed doesn't match any page on this site.
          </p>
          {attemptedPath && attemptedPath !== '/' && (
            <p className="text-sm text-stone-700 mb-6 font-mono break-all">
              Attempted: <code>{attemptedPath}</code>
            </p>
          )}

          <p
            className="text-stone-900 text-base mb-3 mt-6"
            style={{ fontFamily: 'Source Serif 4, serif' }}
          >
            Try one of these instead:
          </p>
          <nav aria-label="Suggested destinations">
            <ul className="space-y-1 list-none p-0">
              <li>
                <Link
                  to="/"
                  className="inline-flex items-center min-h-11 text-civil-red-body hover:underline font-medium"
                  style={{ fontFamily: 'Chivo Mono, monospace' }}
                >
                  Home (timeline)
                </Link>
              </li>
              <li>
                <Link
                  to="/interview-index"
                  className="inline-flex items-center min-h-11 text-civil-red-body hover:underline font-medium"
                  style={{ fontFamily: 'Chivo Mono, monospace' }}
                >
                  Interview Index
                </Link>
              </li>
              <li>
                <Link
                  to="/topic-glossary"
                  className="inline-flex items-center min-h-11 text-civil-red-body hover:underline font-medium"
                  style={{ fontFamily: 'Chivo Mono, monospace' }}
                >
                  Topics
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="inline-flex items-center min-h-11 text-civil-red-body hover:underline font-medium"
                  style={{ fontFamily: 'Chivo Mono, monospace' }}
                >
                  About
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </main>
    </div>
  );
}
