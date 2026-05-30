/**
 * @fileoverview HearInContext, the shared "Hear this in context" affordance.
 *
 * One toggle button plus an inline, BOUNDED LoC video clip that plays just
 * the passage between its start and end timestamps. Used wherever the site
 * surfaces a time-anchored oral-history quote, so the behavior is identical
 * on every page:
 *
 *   - PersonPage snippet cards (relation self / about)
 *   - CitationCard (Quote Finder, Semantic Overlap, Related Passages, the
 *     Concept Spectrum / Concept Matrix / Interview Map drill-downs, Themes,
 *     Tours)
 *   - PolyphonicEvents passages
 *
 * Layout: the button renders as an inline chip; when opened, the clip player
 * is wrapped in a `basis-full` block so that inside a `flex flex-wrap` row
 * (the timestamp + LoC-link rows these cards use) it drops onto its own
 * full-width line beneath the chips. In normal block flow the same wrapper
 * is simply a full-width block.
 *
 * The clip is cheap: LocVideoEmbed seeks the faststart LoC MP4 to the start
 * and stops at the end via byte-range playback, so only the clip's bytes
 * load, never the multi-hour file.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ChevronUp, FileText } from 'lucide-react';
import LocVideoEmbed from './LocVideoEmbed';
import { convertTimestampToSeconds } from '../utils/timeUtils';

/**
 * Convert a timestamp to seconds, tolerating the SRT/VTT millisecond suffix
 * ("01:51:16,500" / "01:51:16.500") and bare "MM:SS" / "HH:MM:SS" forms.
 * Passes numbers through unchanged.
 * @param {string|number|null|undefined} ts
 * @returns {number}
 */
export function tsToSeconds(ts) {
  if (ts == null) return 0;
  if (typeof ts === 'number') return Number.isFinite(ts) ? ts : 0;
  const clean = String(ts).trim().split(/[.,]/)[0];
  return convertTimestampToSeconds(clean);
}

/**
 * @param {Object}  props
 * @param {number}  props.entryNumber       CRHP entry whose loc_video backs the clip.
 * @param {number}  props.startSeconds      Clip start, in seconds.
 * @param {number}  [props.endSeconds]      Clip end, in seconds. Omit for an
 *                                          open-ended play from the start.
 * @param {string}  [props.fullInterviewHref] Route to the full interview
 *                                          (deep-linked to the moment); shown
 *                                          beneath the player when provided.
 * @param {string}  [props.label]           Button label (default
 *                                          "Hear this in context").
 * @param {string}  [props.buttonClassName] Override the button styling.
 * @returns {React.ReactElement|null}
 */
export default function HearInContext({
  entryNumber,
  startSeconds,
  endSeconds = null,
  fullInterviewHref = null,
  label = 'Hear this in context',
  buttonClassName = '',
}) {
  const [open, setOpen] = useState(false);
  if (entryNumber == null || startSeconds == null) return null;

  const btnClass =
    buttonClassName ||
    'inline-flex items-center gap-1 font-semibold text-civil-red-body dark:text-red-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={btnClass}
      >
        {open ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            Hide clip
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
            {label}
          </>
        )}
      </button>
      {open && (
        <div className="basis-full w-full mt-4">
          <LocVideoEmbed
            entryNumber={entryNumber}
            startSeconds={startSeconds}
            endSeconds={endSeconds}
            autoPlay
          />
          {fullInterviewHref && (
            <Link
              to={fullInterviewHref}
              className="inline-flex items-center gap-1 mt-2 font-semibold text-civil-red-body dark:text-red-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              Open the full interview
            </Link>
          )}
        </div>
      )}
    </>
  );
}
