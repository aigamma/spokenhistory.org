import { useEffect } from 'react';

const SITE_NAME = 'Civil Rights History Project';

/**
 * Set the browser tab title for the current route.
 *
 * React Router single-page apps share a single index.html with one
 * <title>. Without intervention every route shows the same browser
 * tab title, which (a) breaks screen-reader announcements that fire
 * on page change (SR users hear "Civil Rights History Project" on
 * every navigation, indistinguishable from any other page), (b) makes
 * browser history navigation ambiguous, and (c) makes bookmarks land
 * with a generic site name instead of the specific page title.
 *
 * The hook restores the original title on unmount so a parent route
 * that navigates back inherits the right title.
 *
 * @param {string|null} title - The page-specific title. If null, the
 *   title falls back to SITE_NAME alone. A non-null title becomes
 *   "{title} | Civil Rights History Project".
 * @example
 *   useDocumentTitle('Interview Index')
 *   // -> "Interview Index | Civil Rights History Project"
 *
 *   useDocumentTitle(`${interview.name}`)
 *   // -> "Maynard E. Moore | Civil Rights History Project"
 *
 *   useDocumentTitle(null)
 *   // -> "Civil Rights History Project"
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

export default useDocumentTitle;
