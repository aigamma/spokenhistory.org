/**
 * @fileoverview SearchPage component for searching interview content by keywords.
 * 
 * This component provides a simple, focused interface for users to search for
 * interview content using keywords. It includes a prominent search form and
 * a collection of popular keyword suggestions to help users discover content.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * SearchPage - Primary search interface for the application
 * 
 * This component:
 * 1. Provides a search form for entering keywords
 * 2. Validates input and handles form submission
 * 3. Navigates to the playlist builder with search parameters
 * 4. Offers quick access to popular keyword searches
 * 
 * @returns {React.ReactElement} The search page interface
 */
export default function SearchPage() {
  useDocumentTitle('Search');
  // State for the keywords input field
  const [keywords, setKeywords] = useState('');
  // Inline validation error state. Replaces the previous browser
  // alert() which (a) is not screen-reader-friendly and (b) breaks
  // the page flow with a modal interrupt that touch users find
  // particularly jarring on mobile.
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (keywords.trim()) {
      setError('');
      navigate(`/playlist-builder?keywords=${encodeURIComponent(keywords)}`);
    } else {
      setError('Please enter at least one keyword.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-stone-950 min-h-screen font-sans flex flex-col items-center justify-center">
      {/* Search header and form */}
      <div className="w-full max-w-3xl text-center mb-16">
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 text-transparent bg-clip-text">
          Search Interviews
        </h1>
        <p className="text-base leading-relaxed text-gray-600 dark:text-stone-400 mb-10 max-w-xl mx-auto">
          Enter keywords separated by commas to find relevant interviews and create custom playlists
        </p>
        
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative w-full">
            {/* Search icon -- aria-hidden so screen readers do not
                announce it; the input's label below carries the
                accessible name. */}
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <SearchIcon className="w-5 h-5 text-gray-500 dark:text-stone-400" aria-hidden="true" />
            </div>

            {/* sr-only label gives the input an accessible name that
                screen readers announce. Placeholder is NOT a label
                per WCAG -- it disappears on focus and many screen
                readers skip it entirely. */}
            <label htmlFor="search-keywords" className="sr-only">
              Search keywords
            </label>

            {/* Search input field. autoCapitalize off so mobile soft
                keyboards do not capitalize the first letter (a real
                problem for searching short proper nouns like SNCC). */}
            <input
              id="search-keywords"
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="civil rights, voting, education..."
              className="w-full pl-12 pr-32 py-5 min-h-11 border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-xl shadow-sm outline-none text-base text-gray-900 dark:text-stone-100 transition-all duration-300 focus:shadow-blue-300 focus:ring-2 focus:ring-blue-500"
              autoCapitalize="none"
              autoCorrect="off"
              aria-invalid={!!error}
              aria-describedby={error ? 'search-error' : undefined}
            />

            {/* Search submit button. min-h-11 brings the hit area to
                the WCAG 2.2 AA 44x44 minimum; previously py-2.5
                + text-base gave ~36px. */}
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 px-6 py-2.5 min-h-11 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg shadow-sm border-none cursor-pointer transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-md"
            >
              Search
            </button>
          </div>

          {/* Inline error message replacing the previous alert().
              role="alert" + aria-live="assertive" so screen readers
              announce the validation failure immediately. */}
          {error && (
            <div
              id="search-error"
              role="alert"
              aria-live="assertive"
              className="mt-3 text-sm text-red-700 dark:text-red-400"
            >
              {error}
            </div>
          )}
        </form>
      </div>

      {/* Popular keywords section */}
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-stone-100">
            Popular Keywords
          </h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Popular keyword shortcuts">
            {/* Array of popular keywords. min-h-11 brings each pill
                to the WCAG 2.2 AA tap target rule; previously py-2
                + text-sm gave ~32px. aria-label on each button so
                screen readers announce "Browse playlist for X" rather
                than just the bare keyword. */}
            {['civil rights', 'voting', 'education', 'segregation', 'protests', 'leadership', 'communities', 'legislation', 'equality', 'freedom'].map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => {
                  setKeywords(keyword);
                  navigate(`/playlist-builder?keywords=${encodeURIComponent(keyword)}`);
                }}
                className="px-4 py-2 min-h-11 bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-stone-300 rounded-lg text-sm border-none cursor-pointer transition-colors duration-200 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-800 dark:hover:text-blue-200"
                aria-label={`Browse playlist for ${keyword}`}
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}