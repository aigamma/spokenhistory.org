/**
 * @fileoverview Shared helpers for building time-anchored interview deep-links.
 *
 * A video segment on this site is identified by (entryNumber, startSeconds,
 * endSeconds), which is a URL: /interview/<N>?t=<start>&end=<end>. These
 * helpers turn a retrieved passage (carrying SRT/VTT-style timestamp strings
 * or numeric seconds) into that bounded segment link, so selecting a clip
 * anywhere on the site lands the reader listening to the exact moment. Lifted
 * out of GlobalSearch so the command palette and any future surface share one
 * implementation instead of re-deriving the link math.
 */

import { convertTimestampToSeconds } from './timeUtils';

/**
 * Convert a timestamp to seconds, tolerating the SRT/VTT millisecond suffix
 * ("01:51:16,500" / "01:51:16.500") and bare "MM:SS" / "HH:MM:SS" forms.
 * Passes finite numbers through unchanged.
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
 * Strip the millisecond suffix from a timestamp string for compact display
 * ("01:51:16,500" -> "01:51:16"). Returns '' for empty input.
 * @param {string|number|null|undefined} s
 * @returns {string}
 */
export function shortTimestamp(s) {
  return s ? String(s).split(/[.,]/)[0] : '';
}

/**
 * Build the segment deep-link for one retrieved passage: open the interview
 * seeked to the passage start and bounded to its end (a short window if no end
 * is present), so selecting a clip lands the reader listening to that moment.
 *
 * Accepts either timestamp strings (timestampStartStr / timestampEndStr) or
 * numeric seconds (timestampStart / timestampEnd); a usable string wins, then
 * the numeric field, then nothing. With no usable start the link is the plain
 * interview route.
 * @param {Object} r passage-like result carrying entryNumber + timestamps
 * @returns {string} /interview/<N> with an optional ?t=&end= query
 */
export function clipHref(r) {
  const startStr = r.timestampStartStr != null ? tsToSeconds(r.timestampStartStr) : 0;
  const endStr = r.timestampEndStr != null ? tsToSeconds(r.timestampEndStr) : 0;
  const startNum =
    startStr > 0
      ? startStr
      : typeof r.timestampStart === 'number' && Number.isFinite(r.timestampStart)
        ? r.timestampStart
        : 0;
  const endNum =
    endStr > 0
      ? endStr
      : typeof r.timestampEnd === 'number' && Number.isFinite(r.timestampEnd)
        ? r.timestampEnd
        : 0;
  const start = Math.round(startNum);
  const rawEnd = Math.round(endNum);
  const end = rawEnd > start ? rawEnd : start > 0 ? start + 60 : 0;
  const qs = end > start ? `?t=${start}&end=${end}` : start > 0 ? `?t=${start}` : '';
  return `/interview/${r.entryNumber}${qs}`;
}
