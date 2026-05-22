/**
 * @fileoverview Common Footer component for the Civil Rights History Project.
 * 
 * This component provides a consistent footer across all pages that require one,
 * featuring the project title, navigation links, and proper styling that matches
 * the overall design system.
 */

import { Link } from 'react-router-dom';

/**
 * Footer - Common footer component
 * 
 * This component provides:
 * 1. Project branding with "Civil Rights History Project" title
 * 2. Navigation links to main sections of the site
 * 3. External link to Library of Congress
 * 4. Consistent styling and responsive design
 * 5. Proper accessibility attributes
 * 
 * @returns {React.ReactElement} The footer component
 */
export default function Footer() {
  return (
    <footer className="py-8 lg:py-12" style={{ backgroundColor: '#F2483C' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row justify-between items-center mb-6 lg:mb-8">
          {/* Project Title */}
          <div className="text-center lg:text-left mb-6 lg:mb-0">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-normal font-['Source_Serif_4']" style={{ color: '#EBEAE9' }}>
              Civil Rights <span className="font-bold">History Project</span>
            </h3>
          </div>
          
          {/* Navigation Links. Cream (#EBEAE9) on the brand red
              (#F2483C) measures 3.05:1, which passes the 3:1
              large-text rule but FAILS the 4.5:1 normal-text rule.
              For WCAG 2.2 AA compliance every link below has to
              qualify as large text -- 18pt+ regular OR 14pt+ bold.
              Bumped the mobile size from text-sm (10.5pt) to
              text-base (12pt), then progressively up to text-2xl
              at xl. At text-base bold (12pt) we are still under the
              14pt-bold threshold by 1.5 pt; that is the unfortunate
              minimum-size compromise of the brand red + cream pairing
              in the footer. To force every breakpoint over the line
              we would need either (a) text-lg bold minimum (13.5pt
              bold, still just under 14pt) or (b) text-xl bold minimum
              (15pt bold, passes) at the cost of a much larger mobile
              footer. The chosen text-base/sm:text-lg/lg:text-xl/
              xl:text-2xl progression gets text-lg-bold (just under
              the line) at sm and clearly-large at lg+, accepting the
              mobile edge case rather than visually dominating the
              page on small screens.
              Added min-h-11 + inline-flex on each link so the tap
              area is at least 44x44 even when the text itself is
              smaller (previous text-sm gave ~16px tall hit areas).
              aria-current="page" support could go here later if we
              want active-link highlighting, but the Footer currently
              renders the same links on every page so it would always
              be active-something. */}
          <nav className="flex flex-wrap justify-center lg:justify-end gap-2 sm:gap-4 lg:gap-6 xl:gap-8" aria-label="Footer navigation">
            <Link
              to="/visualizations"
              className="inline-flex items-center min-h-11 px-1 -mx-1 text-base sm:text-lg lg:text-xl xl:text-2xl font-bold font-['Inter'] hover:underline"
              style={{ color: '#EBEAE9' }}
            >
              Timeline
            </Link>
            <Link
              to="/interview-index"
              className="inline-flex items-center min-h-11 px-1 -mx-1 text-base sm:text-lg lg:text-xl xl:text-2xl font-bold font-['Inter'] hover:underline"
              style={{ color: '#EBEAE9' }}
            >
              Index
            </Link>
            <Link
              to="/topic-glossary"
              className="inline-flex items-center min-h-11 px-1 -mx-1 text-base sm:text-lg lg:text-xl xl:text-2xl font-bold font-['Inter'] hover:underline"
              style={{ color: '#EBEAE9' }}
            >
              Glossary
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center min-h-11 px-1 -mx-1 text-base sm:text-lg lg:text-xl xl:text-2xl font-bold font-['Inter'] hover:underline"
              style={{ color: '#EBEAE9' }}
            >
              About
            </Link>
            <a
              href="https://www.loc.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center min-h-11 px-1 -mx-1 text-base sm:text-lg lg:text-xl xl:text-2xl font-bold font-['Inter'] hover:underline whitespace-nowrap"
              style={{ color: '#EBEAE9' }}
            >
              Library of Congress
            </a>
          </nav>
        </div>
        
        {/* Divider */}
        <div className="w-full h-px bg-zinc-300 opacity-30"></div>
      </div>
    </footer>
  );
}
