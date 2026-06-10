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

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ChevronUp, FileText } from 'lucide-react';
import LocVideoEmbed, { prefetchLocVideoIndex } from './LocVideoEmbed';
import ShareButton from './ShareButton';
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
 * @param {number}  [props.endSeconds]      Clip end, in seconds. A missing,
 *                                          backwards, or implausibly long value
 *                                          (over MAX_CLIP_SECONDS) is replaced by
 *                                          a short bounded window from the start.
 * @param {string}  [props.fullInterviewHref] Route to the full interview
 *                                          (deep-linked to the moment); shown
 *                                          beneath the player when provided.
 * @param {string}  [props.label]           Button label (default
 *                                          "See this in context").
 * @param {string}  [props.buttonClassName] Override the button styling.
 * @returns {React.ReactElement|null}
 */
// Hardest ceiling on any "Hear this in context" clip. An oral-history pull
// quote runs at most ~90 seconds; anything longer means a missing, stale, or
// mis-aligned end bound. Rather than ever play minutes of the source interview
// (the regression the project manager flagged), clamp every clip here, the one
// place every snippet surface funnels through, so the guarantee holds site-wide.
const MAX_CLIP_SECONDS = 150;
const FALLBACK_CLIP_SECONDS = 60;

export default function HearInContext({
  entryNumber,
  startSeconds,
  endSeconds = null,
  fullInterviewHref = null,
  label = 'See this in context',
  buttonClassName = '',
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);
  // Track whether the reader opened the clip themselves. A default-open clip
  // (the People pages and the K-12 curriculum, Dustin 2026-06-02) renders the
  // player ready but does NOT autoplay; only a click-to-open begins playback
  // (and browsers gate autoplay on a user gesture anyway).
  const [userOpened, setUserOpened] = useState(false);
  // Warm the shared loc_video index as soon as a "See this in context" control
  // mounts, so by the time the reader clicks open the poster resolves with no
  // fetch gap. The index fetch is deduped behind one cached promise, so the
  // many cards on an Explore or person page trigger a single ~8 KB request.
  useEffect(() => {
    prefetchLocVideoIndex();
  }, []);
  if (entryNumber == null || startSeconds == null) return null;

  // Use the supplied end only when it is present, after the start, and within
  // the ceiling; otherwise play a short bounded window. This turns a null or
  // implausible end into a few seconds of audio instead of an open-ended clip.
  const boundedEnd =
    endSeconds != null &&
    endSeconds > startSeconds &&
    endSeconds - startSeconds <= MAX_CLIP_SECONDS
      ? endSeconds
      : startSeconds + FALLBACK_CLIP_SECONDS;

  const btnClass =
    buttonClassName ||
    'inline-flex items-center gap-1 font-semibold text-civil-red-body dark:text-red-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded';

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setUserOpened(true); }}
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
            endSeconds={boundedEnd}
            autoPlay={userOpened}
          />
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            {fullInterviewHref && (
              <Link
                to={fullInterviewHref}
                className="inline-flex items-center gap-1 font-semibold text-civil-red-body dark:text-red-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
              >
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                Open the full interview
              </Link>
            )}
            {/* Share this exact passage. The link opens the interview page
                seeked to the clip and bounded to its end, so a recipient
                lands on the same segment, not the top of a multi-hour file. */}
            <ShareButton
              variant="inline"
              label="Copy link to this clip"
              title="oral history clip"
              url={`/interview/${entryNumber}?t=${Math.round(startSeconds)}&end=${Math.round(boundedEnd)}`}
            />
          </div>
        </div>
      )}
    </>
  );
}
