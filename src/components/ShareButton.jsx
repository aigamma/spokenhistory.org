/**
 * @fileoverview ShareButton, the shared "copy a link to this" control.
 *
 * Builds an absolute URL from an in-app path (or computes one on click via
 * getUrl, for a moving target like the current playback position) and hands it
 * to shareOrCopy: the device share sheet on phones, the clipboard on desktop.
 * Flips to a "Link copied" state for ~2.5s after a copy so the action is
 * visibly confirmed, and announces the copy to assistive tech via aria-live.
 * If the URL resolves empty, or the copy fails, it shows a failed state that
 * tells the reader to copy the link manually.
 *
 * Used by the interview page (chapter/part marks, page share, copy-this-moment),
 * the Table of Contents and Static Playlist (per-clip share), HearInContext
 * (segment share), and the global page-share control in the header.
 */

import { useState, useCallback } from 'react';
import { Share2, Check, AlertCircle } from 'lucide-react';
import { buildShareUrl, shareOrCopy } from '../utils/share';

/**
 * @param {Object} props
 * @param {string} [props.url] Relative in-app path (or absolute URL) to share.
 * @param {() => string} [props.getUrl] Compute the path at click time (e.g. the
 *   live playhead position). Takes precedence over url when provided.
 * @param {string} [props.title] Title for the native share sheet.
 * @param {string} [props.text] Text for the native share sheet.
 * @param {string} [props.label] Visible label (default "Share").
 * @param {string} [props.copiedLabel] Label after copying (default "Link copied").
 * @param {'button'|'icon'|'inline'} [props.variant] Visual treatment.
 * @param {string} [props.className] Extra classes on the button.
 * @param {string} [props.iconClassName] Extra classes on the icon.
 */
export default function ShareButton({
  url,
  getUrl,
  title,
  text,
  label = 'Share',
  copiedLabel = 'Link copied',
  variant = 'button',
  className = '',
  iconClassName = 'w-3.5 h-3.5',
}) {
  const [state, setState] = useState('idle'); // idle | copied | failed

  const onClick = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const raw = getUrl ? getUrl() : url;
      const abs = buildShareUrl(raw);
      // Nothing to share (empty/falsy URL): show the failed state instead of
      // copying an empty string or a bare origin.
      if (!abs) {
        setState('failed');
        setTimeout(() => setState('idle'), 2500);
        return;
      }
      const result = await shareOrCopy({ url: abs, title, text });
      if (result === 'copied') {
        setState('copied');
        setTimeout(() => setState('idle'), 2500);
      } else if (result === 'failed') {
        setState('failed');
        setTimeout(() => setState('idle'), 2500);
      }
      // 'shared' (the native sheet handled it) needs no inline feedback.
    },
    [getUrl, url, title, text],
  );

  const copied = state === 'copied';
  const failed = state === 'failed';
  const failedLabel = 'Copy failed, try again';
  const Icon = copied ? Check : failed ? AlertCircle : Share2;
  const currentLabel = copied ? copiedLabel : failed ? failedLabel : label;
  const aria = copied
    ? copiedLabel
    : failed
    ? `${failedLabel}. Copy the link manually.`
    : `${label}${title ? `: ${title}` : ''}`;

  const base =
    'inline-flex items-center gap-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded';
  const byVariant = {
    button:
      'min-h-9 px-3 py-1.5 text-xs font-medium border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-200 hover:bg-stone-50 hover:border-stone-500',
    icon: 'p-1.5 text-stone-400 hover:text-stone-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800',
    inline: 'text-xs font-medium text-civil-red-body dark:text-red-400 hover:underline',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${byVariant[variant] || byVariant.button} ${
        copied ? 'font-semibold text-emerald-600 dark:text-emerald-400' : ''
      } ${failed ? 'text-amber-700 dark:text-amber-400' : ''} ${className}`}
      aria-label={aria}
      title={failed ? `${failedLabel}. Copy the link manually.` : currentLabel}
    >
      <Icon className={iconClassName} aria-hidden="true" />
      {variant !== 'icon' && <span>{currentLabel}</span>}
      {/* Announce the outcome without relying on the visual icon swap. */}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? copiedLabel : failed ? `${failedLabel}. Copy the link manually.` : ''}
      </span>
    </button>
  );
}
