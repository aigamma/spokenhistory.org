/**
 * @fileoverview ClipCountdown, a circular "time remaining" ring for the clip
 * that is currently playing: a depleting arc with the seconds left shown in the
 * middle, so a snippet reads like a short countdown ("doomsday timer") rather
 * than an open-ended video. It is designed to sit in the lower-right corner of
 * the video itself (LocVideoEmbed's `overlay` slot), so it is visible exactly
 * when and where you are watching, not in a strip below the frame.
 *
 * Driven by a clip-relative progress fraction (0..1) plus the clip duration, so
 * it adds no media listener of its own. The graphic is aria-hidden; a static
 * (non-live) sr-only label states the clip length, so a screen reader is not
 * spammed with a per-second tick. The depletion transition is short and
 * collapses to nothing under prefers-reduced-motion (the global rule in
 * styles/index.css).
 *
 * `onDark` styles it for overlaying on video: a translucent dark disc behind a
 * bright ring and white label, legible over any frame.
 */

function fmtClock(totalSec) {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

/**
 * @param {Object} props
 * @param {number} props.progress         Clip-relative playback fraction, 0..1.
 * @param {number} props.durationSeconds  Length of the clip, in seconds.
 * @param {number} [props.size]           Diameter in px (default 64).
 * @param {boolean} [props.onDark]        Style for overlaying on video.
 * @param {string} [props.className]      Extra classes on the wrapper.
 */
export default function ClipCountdown({
  progress = 0,
  durationSeconds,
  size = 64,
  onDark = false,
  className = '',
}) {
  if (!durationSeconds || durationSeconds <= 0) return null;
  const clamped = Math.min(1, Math.max(0, progress || 0));
  const remaining = durationSeconds * (1 - clamped);
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  // The colored arc shrinks from full to empty as the clip plays (the dash
  // offset grows with progress), so the ring visibly runs out while the label
  // counts the remaining seconds down.
  const dashOffset = circ * clamped;

  const trackCls = onDark ? 'stroke-white/25' : 'stroke-stone-200 dark:stroke-zinc-700';
  const arcCls = onDark ? 'stroke-civil-red' : 'stroke-civil-red-strong';
  const textCls = onDark ? 'text-white' : 'text-stone-800 dark:text-zinc-100';
  const wrapCls = onDark ? 'bg-black/55 backdrop-blur-sm rounded-full shadow-lg' : '';

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center ${wrapCls} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className={trackCls} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          className={`${arcCls} transition-[stroke-dashoffset] duration-150 ease-linear`}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center tabular-nums text-sm font-semibold ${textCls}`}
        aria-hidden="true"
      >
        {fmtClock(remaining)}
      </span>
      <span className="sr-only">Clip length {fmtClock(durationSeconds)}</span>
    </div>
  );
}
