/**
 * @fileoverview Common Footer for the Civil Rights History Project.
 *
 * Mounted ONCE globally in Layout (Dustin, 2026-06-02) so every framed page
 * carries the same footer sitemap; individual pages no longer render their own
 * <Footer/>. The two header-less routes that fall outside Layout
 * (InterviewDetail, InterviewPlayer) still render it directly.
 *
 * The footer is now the secondary-navigation home for the destinations Dustin
 * pulled out of the four-item main menu (Essays, Data Insights, Methodology,
 * About). It carries the full site map plus the Library of Congress
 * attribution (plain text, no outbound loc.gov link, per the site-wide policy).
 *
 * Naming note: Dustin's IA renames the /topic-glossary page to "Table of
 * Contents" and routes "Interviews" at /table-of-contents, so the labels below
 * intentionally do NOT match their route names. Routes were left stable because
 * dozens of in-app deep links target them; only the visible labels changed.
 */

import { Link } from 'react-router-dom';

// One sitemap entry per destination. Order: the four primary sections first
// (matching the main menu), then the secondary destinations moved out of it.
const SITEMAP = [
  { label: 'Timeline', to: '/' },
  { label: 'Table of Contents', to: '/topic-glossary' },
  { label: 'Interviews', to: '/table-of-contents' },
  { label: 'People', to: '/people' },
  { label: 'K-12 Curriculum', to: '/curriculum' },
  { label: 'Essays', to: '/essays' },
  { label: 'Data Insights', to: '/rag-explore' },
  { label: 'Methodology', to: '/machine-audit' },
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
            {SITEMAP.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex items-center min-h-11 px-1 -mx-1 text-base sm:text-lg lg:text-xl font-bold font-['Inter'] hover:underline"
                style={{ color: '#EBEAE9' }}
              >
                {item.label}
              </Link>
            ))}
            <span
              className="inline-flex items-center min-h-11 px-1 -mx-1 text-base sm:text-lg lg:text-xl font-bold font-['Inter'] whitespace-nowrap"
              style={{ color: '#EBEAE9' }}
            >
              Library of Congress
            </span>
          </nav>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-zinc-300 opacity-30"></div>
      </div>
    </footer>
  );
}
