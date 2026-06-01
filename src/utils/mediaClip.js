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
  // Register the seek FIRST so `target` becomes the official playback position.
  // The browser then range-jumps to the clip's byte offset when it plays
  // instead of streaming from byte 0 up to the clip (the load-the-whole-file
  // regression). LoC MP4s are faststart with byte-range support, so this is a
  // small fetch at the clip offset.
  try {
    el.currentTime = target;
  } catch {
    // Seekable position not available yet; play from where we are.
    play();
    return () => {};
  }
  // Start playback as soon as data at the new position is ready, triggering on
  // the FIRST of `seeked`, `canplay`, or a short timeout rather than on
  // `seeked` alone. A deep seek into a multi-hour recording is slow (and
  // sometimes fails) to fire `seeked`, and gating playback on it exclusively
  // left the clip frozen on its poster, the "comes up but nothing plays" bug.
  // currentTime is already `target`, so whichever fires first, playback still
  // begins at the clip and stays byte-bounded.
  let started = false;
  let timer = null;
  const start = () => {
    if (started) return;
    started = true;
    el.removeEventListener('seeked', start);
    el.removeEventListener('canplay', start);
    if (timer) clearTimeout(timer);
    play();
  };
  el.addEventListener('seeked', start);
  el.addEventListener('canplay', start);
  timer = setTimeout(start, 1500);
  return () => {
    started = true;
    el.removeEventListener('seeked', start);
    el.removeEventListener('canplay', start);
    if (timer) clearTimeout(timer);
  };
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
  const play = () => el.play().catch(() => { /* autoplay blocked; controls remain */ });
  if (!el.seeking) {
    play();
    return;
  }
  // A seek is in flight; play once data at the seek target is ready. Trigger on
  // the first of `seeked` / `canplay` with a timeout backstop so a slow or
  // missing `seeked` never strands playback. Playing while still seeking is
  // safe: the element resumes at its seek target, never at 0.
  let started = false;
  let timer = null;
  const start = () => {
    if (started) return;
    started = true;
    el.removeEventListener('seeked', start);
    el.removeEventListener('canplay', start);
    if (timer) clearTimeout(timer);
    play();
  };
  el.addEventListener('seeked', start);
  el.addEventListener('canplay', start);
  timer = setTimeout(start, 1500);
}
