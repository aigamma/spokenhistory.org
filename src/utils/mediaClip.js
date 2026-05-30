/**
 * @fileoverview Helpers for playing a BOUNDED CLIP of a large remote MP4
 * (the Library of Congress oral-history recordings) without downloading the
 * whole file to reach the clip.
 *
 * The critical rule both helpers enforce: never call play() while a seek is
 * still pending. A play() issued before the browser has landed a seek makes it
 * begin playback from the current position (usually 0) and buffer
 * SEQUENTIALLY up to the seek point, downloading hundreds of MB (the LoC
 * interviews are ~1.9 GB) before a deep clip starts. The LoC MP4 is
 * web-optimized (moov atom at the front) and tile.loc.gov serves any byte
 * range in well under a second, so seeking first and playing only once the
 * seek lands (`seeked` event) forces a single range request to the clip
 * offset: playback starts at once and only the clip's bytes load.
 *
 * Used by LocVideoEmbed (person pages, citation cards, interview hero,
 * polyphonic events) and Html5VideoPlayer (the PlaylistBuilder / VideoPlayer
 * direct-stream path), so the seek behavior is identical everywhere a raw
 * <video> element seeks into a LoC recording.
 */

/**
 * Seek `el` to `seconds`, then call play() (when `shouldPlay`) only after the
 * browser fires `seeked`. Plays immediately when already at the target (no
 * pending seek to wait on). Returns a cleanup function that detaches the
 * pending `seeked` listener.
 *
 * @param {HTMLMediaElement} el
 * @param {number} seconds
 * @param {boolean} shouldPlay
 * @returns {() => void} detach
 */
export function seekThenPlay(el, seconds, shouldPlay) {
  if (!el) return () => {};
  const target = Math.max(0, Number(seconds) || 0);
  const play = () => {
    if (shouldPlay) el.play().catch(() => { /* autoplay blocked; controls remain */ });
  };
  // Already at (or effectively at) the target: nothing to wait on.
  if (target <= 0 || Math.abs(el.currentTime - target) < 0.4) {
    play();
    return () => {};
  }
  const onSeeked = () => {
    el.removeEventListener('seeked', onSeeked);
    play();
  };
  el.addEventListener('seeked', onSeeked);
  try {
    el.currentTime = target;
  } catch {
    // Seek rejected before load; detach and play from wherever we are.
    el.removeEventListener('seeked', onSeeked);
    play();
  }
  return () => el.removeEventListener('seeked', onSeeked);
}

/**
 * Play `el` safely: if a seek is in flight, wait for it to land before calling
 * play(), so play() never kicks off a from-0 sequential buffer. Use this in
 * place of a bare el.play() anywhere a play might coincide with a pending
 * seek (e.g., an external isPlaying prop toggling true mid-seek).
 *
 * @param {HTMLMediaElement} el
 */
export function playWhenReady(el) {
  if (!el) return;
  if (el.seeking) {
    const onSeeked = () => {
      el.removeEventListener('seeked', onSeeked);
      el.play().catch(() => { /* autoplay blocked; controls remain */ });
    };
    el.addEventListener('seeked', onSeeked);
  } else {
    el.play().catch(() => { /* autoplay blocked; controls remain */ });
  }
}
