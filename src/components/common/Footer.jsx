/**
 * @fileoverview Common Footer for the Civil Rights History Project.
 *
 * Mounted ONCE globally in Layout (Dustin, 2026-06-02) so every framed page
 * carries the same footer; individual pages no longer render their own
 * <Footer/>. The two header-less routes that fall outside Layout
 * (InterviewDetail, InterviewPlayer) still render it directly.
 *
 * The footer is the secondary-navigation home for the destinations that are NOT
 * in the five-item primary nav (Dustin, 2026-06-02 afternoon): Essays,
 * Methodology, GitHub, and About. The five primary sections
 * (Timeline, Table of Contents, Explore Interview Data, People & Interviews,
 * K-12 Curriculum) now live in the header Menu drawer.
 *
 * The footer previously also carried a plain-text "Library of Congress"
 * attribution, removed 2026-06-02 (Dustin): it was unlinked and was forcing the
 * sitemap to wrap to a second row. LoC attribution still lives in page copy and
 * the person-page citations.
 */

import { Link } from 'react-router-dom';

// One sitemap entry per secondary destination. The five primary sections live
// in the header Menu drawer (Header.jsx); the footer holds the rest.
const SITEMAP = [
  { label: 'Essays', to: '/essays' },
  { label: 'Methodology', to: '/machine-audit' },
  { label: 'GitHub', href: 'https://github.com/jsovelove/civil-rights-history-project' },
  { label: 'About', to: '/about' },
];

/**
 * Footer, the global footer + sitemap.
 *
 * @returns {React.ReactElement} The footer component
 */
export default function Footer() {
  return (
    <footer className="py-8 lg:py-12" style={{ backgroundColor: '#F2483C' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-6 lg:gap-8 mb-6 lg:mb-8">
          {/* Project Title */}
          <div className="text-center lg:text-left">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-normal font-['Source_Serif_4']" style={{ color: '#EBEAE9' }}>
              Civil Rights <span className="font-bold">History Project</span>
            </h3>
          </div>

          {/* Sitemap. Cream (#EBEAE9) on the brand red (#F2483C) measures
              3.05:1, which passes the 3:1 large-text rule but FAILS the 4.5:1
              normal-text rule, so every link has to qualify as large text (18pt+
              regular OR 14pt+ bold). The text-base/sm:text-lg/lg:text-xl
              progression gets large at sm+ and accepts the documented mobile
              edge case rather than visually dominating small screens, matching
              the prior footer's compromise. min-h-11 keeps every tap target at
              least 44x44 even where the glyphs are smaller. */}
          <nav className="flex flex-wrap justify-center lg:justify-end gap-x-4 gap-y-1 sm:gap-x-5 lg:gap-x-6 max-w-2xl" aria-label="Footer sitemap">
            {SITEMAP.map((item) =>
              item.href ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center min-h-11 px-1 -mx-1 text-base sm:text-lg lg:text-xl font-bold font-['Inter'] hover:underline"
                  style={{ color: '#EBEAE9' }}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  className="inline-flex items-center min-h-11 px-1 -mx-1 text-base sm:text-lg lg:text-xl font-bold font-['Inter'] hover:underline"
                  style={{ color: '#EBEAE9' }}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-zinc-300 opacity-30"></div>
      </div>
    </footer>
  );
}
