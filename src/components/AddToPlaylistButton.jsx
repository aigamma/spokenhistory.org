/**
 * @fileoverview AddToPlaylistButton, the "favorite this clip" toggle.
 *
 * The sibling of ShareButton: a small control placed next to a clip anywhere it
 * is played, which adds or removes that clip from the working playlist held by
 * PlaylistProvider. The clip can be any shape clipTokens.normalizeClip accepts
 * (a chapter, a part, an index clip, a retrieved passage, or an explicit
 * { entry, start, end, label, subject }).
 *
 * Pressed state and the screen-reader announcement are derived from the live
 * membership, so the button is in sync with the playlist on every render.
 */
import { useState, useCallback } from 'react';
import { ListPlus, Check } from 'lucide-react';
import { normalizeClip, dedupeKey } from '../utils/clipTokens';
import { usePlaylist } from '../context/PlaylistProvider';

/**
 * @param {Object} props
 * @param {Object} props.clip A clip-bearing shape (see clipTokens.normalizeClip).
 * @param {'button'|'icon'|'inline'} [props.variant] Visual treatment (default icon).
 * @param {string} [props.className] Extra classes on the button.
 * @param {string} [props.label] Override the visible/aria label.
 */
export default function AddToPlaylistButton({ clip, variant = 'icon', className = '', label }) {
  const { isClipInPlaylist, toggleClip, isFull } = usePlaylist();
  const [announce, setAnnounce] = useState('');

  const ref = normalizeClip(clip);
  const key = ref ? dedupeKey(ref) : null;
  const inList = key ? isClipInPlaylist(key) : false;

  const onClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!ref) return;
      // Reading membership BEFORE the toggle tells us which way it went, so the
      // live-region message is correct without waiting for the re-render.
      if (!inList && isFull) {
        setAnnounce('Playlist is full');
        setTimeout(() => setAnnounce(''), 2500);
        return;
      }
      toggleClip(clip);
      setAnnounce(inList ? 'Removed from playlist' : 'Added to playlist');
      setTimeout(() => setAnnounce(''), 2000);
    },
    [ref, inList, isFull, clip, toggleClip],
  );

  if (!ref) return null;

  const Icon = inList ? Check : ListPlus;
  const text = label || (inList ? 'In playlist' : 'Add to playlist');
  const aria = `${inList ? 'Remove from' : 'Add to'} playlist${ref.t ? `: ${ref.t}` : ''}`;

  const base =
    'inline-flex items-center gap-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded';
  const byVariant = {
    button:
      'min-h-9 px-3 py-1.5 text-xs font-medium border bg-white dark:bg-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800 ' +
      (inList
        ? 'border-civil-red-strong text-civil-red-body'
        : 'border-stone-300 dark:border-zinc-600 text-stone-700 dark:text-zinc-200 hover:border-stone-500'),
    icon:
      'p-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 ' +
      (inList ? 'text-civil-red-strong' : 'text-stone-400 hover:text-stone-700 dark:text-zinc-500 dark:hover:text-zinc-200'),
    inline:
      'text-xs font-medium hover:underline ' +
      (inList ? 'text-civil-red-strong' : 'text-civil-red-body dark:text-red-400'),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={inList}
      aria-label={aria}
      title={text}
      className={`${base} ${byVariant[variant] || byVariant.icon} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {variant !== 'icon' && <span>{text}</span>}
      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
    </button>
  );
}
