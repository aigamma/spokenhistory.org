/**
 * @fileoverview LocVideoEmbed, a self-contained embedded player for the
 * Library of Congress oral-history video that backs each interview.
 *
 * Every entry in /rag/summaries/pipeline_output/entry_<N>.json carries a
 * `loc_video` block sourced from the LoC catalog:
 *
 *   {
 *     video_url:        "https://tile.loc.gov/.../*.mp4",   // direct MP4
 *     video_stream_url: "https://tile.loc.gov/.../*.m3u8",  // HLS variant
 *     poster_url:       "https://tile.loc.gov/.../*.jpg",   // still frame
 *     duration_seconds: 8871,
 *     caption:          "<subject> oral history interview ..."
 *   }
 *
 * This component renders that video with native HTML5 controls, seeks to a
 * requested start time, and plays a BOUNDED CLIP: when `endSeconds` is set it
 * pauses the moment playback crosses that mark, so a snippet plays just its
 * passage instead of running on into a multi-hour interview.
 *
 * Loading only the clip's bytes (not the whole 1.9 GB file) depends on the
 * seek being a true range-jump. The LoC MP4 is web-optimized (moov atom at
 * the front) and tile.loc.gov serves any mid-file byte range in well under a
 * second, so a seek to the clip start fetches the index plus the clip's bytes
 * and nothing else. The critical client-side rule: do NOT call play() until
 * the browser has landed the seek (the `seeked` event). Calling play() while
 * a seek is still pending makes the browser play from 0 and buffer
 * sequentially all the way to the seek point, which downloads ~1.4 GB before
 * a deep clip starts. Seeking first, then playing on `seeked`, keeps the
 * fetch bounded to the clip.
 *
 * SLOW-LOAD NOTE. Even with faststart, the front-loaded moov atom is the seek
 * index for the WHOLE recording, so it grows with duration: a 73-second clip
 * carries a 40 KB moov, but a 2-3 hour interview carries a 3-4.6 MB moov. Any
 * <video> that must seek (a bounded clip) or that preloads metadata has to
 * download that entire atom before it can show a frame or honor a seek, which
 * is why the long interviews feel slow while the short ones are instant. Two
 * mitigations live here: (1) preload is adaptive, an unbounded, non-autoplay
 * player (the interview-page hero on a cold load) uses preload="none" so the
 * poster shows at once and the moov is fetched only when the reader presses
 * play; (2) the `lazy` prop holds a player at its poster until clicked, so a
 * page that lays out several clips (a curriculum lesson) does not fire off
 * several multi-megabyte moov downloads in parallel at mount.
 *
 * Used in:
 *   - HearInContext, expanded inline beneath a snippet / citation card.
 *   - InterviewDetail, as the page's video hero, with an imperative handle so
 *     chapter rows can seek + clip-bound it without remounting.
 */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { RotateCcw, Play } from 'lucide-react';
import { seekThenPlay } from '../utils/mediaClip';
import ClipCountdown from './ClipCountdown';

// Resolution of an entry's loc_video block is backed by ONE compact shared
// index (public/rag/loc_video_index.json, ~8 KB gzipped, built by
// scripts/build_loc_video_index.mjs) rather than the per-entry pipeline output.
// Every snippet surface needs only the five-field loc_video block to paint its
// poster and seek its clip; fetching the whole 37-71 KB per-entry JSON for that
// was the redundant cost on pages that lay out clips from many interviews (the
// Explore / Data Insights pages, a person page). With the index, the FIRST clip
// on a session pays one tiny fetch and every clip after it (any entry) resolves
// with no network, so the poster paints immediately, the way the interview-page
// hero does. This changes only metadata resolution; the byte-bounded clip load
// (moov atom + the clip's range, never the multi-GB file) is unchanged.
const locVideoCache = new Map(); // entryNumber -> Promise<loc_video|null>
let indexPromise = null; // shared one-shot fetch of the whole index

function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch('/rag/loc_video_index.json')
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return indexPromise;
}

// Warm the shared index ahead of an open so the first clip's poster paints with
// no fetch gap. Safe to call many times: the fetch is deduped behind a single
// cached promise. HearInContext calls this when a "See this in context" control
// mounts, so the index is usually in hand before the reader clicks.
export function prefetchLocVideoIndex() {
  loadIndex();
}

function loadLocVideo(entryNumber) {
  if (locVideoCache.has(entryNumber)) return locVideoCache.get(entryNumber);
  const p = loadIndex()
    .then((idx) => {
      const v = idx && idx[entryNumber];
      if (v && (v.video_url || v.video_stream_url)) return v;
      // Fallback for any entry not yet in the index (e.g. a freshly onboarded
      // interview before the index is rebuilt): read its per-entry pipeline
      // output directly, the original load path.
      return fetch(`/rag/summaries/pipeline_output/entry_${entryNumber}.json`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => (d && d.loc_video ? d.loc_video : null))
        .catch(() => null);
    })
    .catch(() => null);
  locVideoCache.set(entryNumber, p);
  return p;
}

/**
 * @param {Object}   props
 * @param {number}   [props.entryNumber]  Entry to fetch loc_video for when
 *                                        locVideo is not supplied directly.
 * @param {Object}   [props.locVideo]     Pre-loaded loc_video block; skips
 *                                        the fetch when present.
 * @param {number}   [props.startSeconds] Seek target in seconds.
 * @param {number}   [props.endSeconds]   Clip end in seconds. When set and
 *                                        greater than startSeconds, playback
 *                                        pauses on reaching it (bounded clip).
 * @param {boolean}  [props.autoPlay]     Begin playback once the seek lands.
 * @param {string}   [props.className]    Extra classes on the wrapper.
 * @param {boolean}  [props.showCaption]  Render the LoC caption below the
 *                                        player (default true).
 * @param {Function} [props.onProgress]   Called on timeupdate with the
 *                                        clip-relative fraction (0..1):
 *                                        (currentTime - startSeconds) /
 *                                        (endSeconds - startSeconds), clamped.
 *                                        Lets a parent draw a clip progress bar
 *                                        without owning the element.
 * @param {boolean}  [props.lazy]         Hold the player at its poster until
 *                                        the reader clicks it; only then does
 *                                        it load (its moov atom) and play. Use
 *                                        on surfaces that render several players
 *                                        at once so the page does not trigger
 *                                        several multi-megabyte moov downloads
 *                                        in parallel on mount.
 * @param {React.Ref} ref                 Imperative handle exposing
 *                                        seek(seconds, { play, stopAt }).
 */
const LocVideoEmbed = forwardRef(function LocVideoEmbed(
  {
    entryNumber,
    locVideo: locVideoProp = null,
    startSeconds = 0,
    endSeconds = null,
    autoPlay = false,
    className = '',
    showCaption = true,
    onClipEnd = null,
    onProgress = null,
    showCountdown = true,
    lazy = false,
  },
  ref,
) {
  const [locVideo, setLocVideo] = useState(locVideoProp);
  const [status, setStatus] = useState(locVideoProp ? 'ready' : 'loading');
  const videoRef = useRef(null);
  // The clip currently bounded in the player as { start, end, duration }, or
  // null when the source plays open-ended. Set from the start/end props AND from
  // an imperative seek({ stopAt }), so the built-in countdown ring works whether
  // a parent bounds the clip by props (HearInContext, the playlist player) or by
  // calling seek() on a long-lived element (the interview page hero). Mirrored to
  // a ref so the high-frequency timeupdate handler reads it without re-subscribing.
  const [clipBound, setClipBound] = useState(null);
  const clipBoundRef = useRef(null);
  // Clip-relative playback fraction (0..1) of the bounded clip; drives the ring.
  const [clipFrac, setClipFrac] = useState(0);
  // The active clip-stop mark in seconds, or null for open-ended. Held in a
  // ref so the high-frequency timeupdate handler reads the current value
  // without re-subscribing, and so an imperative seek can re-arm it without a
  // render. Disarmed (set null) the instant it fires, so a reader who presses
  // play again is not bounced back at the boundary.
  const stopAtRef = useRef(null);
  // Latest onClipEnd kept in a ref so the timeupdate/ended listeners (which
  // subscribe once per ready state) always call the current callback without
  // having to re-subscribe on every parent re-render.
  const onClipEndRef = useRef(onClipEnd);
  useEffect(() => {
    onClipEndRef.current = onClipEnd;
  }, [onClipEnd]);
  // Latest onProgress kept in a ref for the same reason: the timeupdate
  // listener subscribes once per ready state and reads the current callback
  // here, so a parent re-render does not force a re-subscribe.
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  const hasClipBound =
    endSeconds != null && endSeconds > 0 && endSeconds > startSeconds;

  // Lazy surfaces (e.g. a curriculum lesson laying out several clips at once)
  // hold the player at its poster until clicked, so the page does not fire off
  // several multi-megabyte moov-atom downloads at mount. "armed" is true once
  // the player should actually load: immediately for a normal embed, only after
  // the click for a lazy one. Until armed, the element neither seeks nor
  // preloads, so a poster-only video costs nothing.
  const [activated, setActivated] = useState(!lazy);
  const armed = !lazy || activated;
  const seekTarget = armed ? startSeconds : 0;
  const effectiveAutoPlay = armed && (autoPlay || (lazy && activated));
  // Adaptive preload: only fetch metadata (the moov atom) when the player will
  // actually seek on mount or autoplay. An unbounded, non-autoplay player (the
  // interview-page hero on a cold load, or a lazy poster pre-click) stays at
  // preload="none" so the poster paints instantly and the moov is fetched only
  // when the reader presses play.
  const effectivePreload =
    effectiveAutoPlay || seekTarget > 0 ? 'metadata' : 'none';

  // Keep the stop mark in sync with the props. Runs on prop change only, so an
  // imperative seek's stop mark survives unrelated re-renders.
  useEffect(() => {
    stopAtRef.current = hasClipBound ? endSeconds : null;
    const bound = hasClipBound
      ? { start: startSeconds, end: endSeconds, duration: endSeconds - startSeconds }
      : null;
    clipBoundRef.current = bound;
    setClipBound(bound);
    setClipFrac(0);
  }, [hasClipBound, endSeconds, startSeconds]);

  // Imperative handle for parents that own the element (InterviewDetail's
  // hero): seek to a moment, optionally bound the clip, optionally play. Like
  // the mount path, it plays only after the seek lands.
  useImperativeHandle(
    ref,
    () => ({
      seek(seconds, { play = true, stopAt = null } = {}) {
        const el = videoRef.current;
        if (!el) return;
        const target = Math.max(0, Number(seconds) || 0);
        const bounded = stopAt != null && stopAt > target;
        stopAtRef.current = bounded ? stopAt : null;
        const bound = bounded ? { start: target, end: stopAt, duration: stopAt - target } : null;
        clipBoundRef.current = bound;
        setClipBound(bound);
        setClipFrac(0);
        const run = () => seekThenPlay(el, target, play);
        if (el.readyState >= 1) run();
        else {
          el.addEventListener('loadedmetadata', run, { once: true });
          // A preload="none" hero (cold-load) will not load on its own; kick
          // it so metadata arrives and the requested seek can land.
          try { el.load(); } catch { /* noop */ }
        }
      },
      // Current playhead position in seconds, so a parent (the interview page)
      // can build a "link to this moment" from wherever the reader has scrubbed
      // to. Returns 0 before the element exists or has a valid time.
      getCurrentTime() {
        const el = videoRef.current;
        const t = el ? el.currentTime : 0;
        return Number.isFinite(t) ? t : 0;
      },
    }),
    [],
  );

  // Resolve the loc_video block: use the prop when given, otherwise fetch it
  // from the entry's pipeline output.
  useEffect(() => {
    if (locVideoProp) {
      setLocVideo(locVideoProp);
      setStatus('ready');
      return undefined;
    }
    if (entryNumber == null) {
      setStatus('error');
      return undefined;
    }
    let cancelled = false;
    setStatus('loading');
    loadLocVideo(entryNumber).then((lv) => {
      if (cancelled) return;
      if (lv && (lv.video_url || lv.video_stream_url)) {
        setLocVideo(lv);
        setStatus('ready');
      } else {
        setStatus('error');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [entryNumber, locVideoProp]);

  // Seek to the clip start and (for autoPlay) begin playback once the element
  // has metadata. play() is deferred to the `seeked` event by seekThenPlay so
  // the browser range-jumps to the clip instead of buffering from 0. The click
  // that mounts this component (via HearInContext) is the user gesture that
  // lets play() proceed with audio.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || status !== 'ready') return undefined;
    // A lazy player not yet clicked stays unloaded: no seek, no moov fetch.
    if (!armed) return undefined;
    // An armed but unbounded, non-autoplay player (the cold-load hero) has
    // nothing to do on mount, leave it at preload="none" so the moov is fetched
    // only when the reader presses native play (which then plays from 0).
    const needsLoad = seekTarget > 0 || effectiveAutoPlay;
    if (!needsLoad) return undefined;
    let detach = () => {};
    const begin = () => {
      detach = seekThenPlay(el, seekTarget, effectiveAutoPlay);
    };
    if (el.readyState >= 1) {
      begin();
    } else {
      el.addEventListener('loadedmetadata', begin, { once: true });
      // With preload="none" (lazy just clicked) the element will not load on
      // its own; kick it so metadata arrives and the seek can land.
      try { el.load(); } catch { /* noop */ }
    }
    return () => {
      el.removeEventListener('loadedmetadata', begin);
      detach();
    };
  }, [status, armed, seekTarget, effectiveAutoPlay, locVideo]);

  // Bounded-clip stop. Pause the instant playback crosses the stop mark, then
  // disarm so the reader can keep listening or scrub freely; "Replay clip"
  // re-arms and restarts from the clip start.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || status !== 'ready') return undefined;
    const fireClipEnd = () => {
      if (typeof onClipEndRef.current === 'function') onClipEndRef.current();
    };
    const onTimeUpdate = () => {
      // Clip-relative progress (0..1) drives the built-in countdown ring and any
      // parent progress bar (onProgress). Uses the active bound (prop- or
      // seek-derived) read from a ref, so it tracks the right clip on every
      // surface. timeupdate already fires during playback, so this adds no
      // listener and no latency. Guards a missing or zero-length clip.
      const bound = clipBoundRef.current;
      if (bound && bound.duration > 0) {
        let frac = (el.currentTime - bound.start) / bound.duration;
        if (frac < 0) frac = 0;
        else if (frac > 1) frac = 1;
        setClipFrac(frac);
        if (typeof onProgressRef.current === 'function') onProgressRef.current(frac);
      }
      const stopAt = stopAtRef.current;
      if (stopAt != null && el.currentTime >= stopAt) {
        el.pause();
        stopAtRef.current = null;
        // Notify the parent so a playlist can auto-advance to the next clip.
        fireClipEnd();
      }
    };
    // An open-ended clip (no stop mark) advances when the source itself ends.
    const onEnded = () => fireClipEnd();
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('ended', onEnded);
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('ended', onEnded);
    };
  }, [status, locVideo, hasClipBound, startSeconds, endSeconds]);

  const replayClip = () => {
    const el = videoRef.current;
    if (!el) return;
    stopAtRef.current = hasClipBound ? endSeconds : null;
    seekThenPlay(el, startSeconds, true);
  };

  if (status === 'loading') {
    return (
      <div
        className={`w-full aspect-video rounded-lg bg-stone-900 flex items-center justify-center ${className}`}
      >
        <div
          className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"
          role="status"
        >
          <span className="sr-only">Loading video</span>
        </div>
      </div>
    );
  }

  if (status === 'error' || !locVideo) {
    return (
      <div
        className={`w-full rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-600 ${className}`}
      >
        The Library of Congress video for this interview could not be loaded.
        Use the Library of Congress catalog link to view it on loc.gov.
      </div>
    );
  }

  const sourceUrl = locVideo.video_url || locVideo.video_stream_url;

  return (
    <div className={className}>
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black shadow">
        <video
          ref={videoRef}
          src={sourceUrl}
          poster={locVideo.poster_url || undefined}
          controls
          preload={effectivePreload}
          playsInline
          className="w-full h-full"
        >
          Your browser does not support embedded video. The interview is
          available at <a href={sourceUrl}>the Library of Congress</a>.
        </video>
        {/* Built-in "time left" countdown, pinned to the TOP-right corner of the
            video. The native controls (play, timeline, volume, and the fullscreen
            button) all sit along the bottom edge, with fullscreen in the
            bottom-right, so a lower-right badge covers the fullscreen icon; the
            top edge is the only control-free corner. Shown whenever the player has
            a bounded clip (a snippet), whether bounded by start/end props (every
            embed) or by an imperative seek (the interview hero's chapters), so it
            appears on every clip surface without per-page wiring. pointer-events-
            none so it never blocks the controls. */}
        {showCountdown && armed && clipBound && clipBound.duration > 0 && (
          <div className="pointer-events-none absolute top-3 right-3 z-10">
            <ClipCountdown progress={clipFrac} durationSeconds={clipBound.duration} size={56} onDark />
          </div>
        )}
        {/* Lazy poster-gate. Until the reader clicks, the element sits at
            preload="none" showing only its poster, so a page with several
            clips lays out instantly and downloads no video. The click is the
            user gesture that lets the loaded clip autoplay with audio. */}
        {lazy && !activated && (
          <button
            type="button"
            onClick={() => setActivated(true)}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            aria-label="Load and play this clip"
          >
            <span className="rounded-full bg-white/90 p-4 shadow-lg transition-transform group-hover:scale-105">
              <Play className="w-7 h-7 text-stone-900" aria-hidden="true" />
            </span>
          </button>
        )}
      </div>
      {/* Controls below the player, never overlapping the native play button.
          "Replay clip" re-seeks to the clip start and re-arms the stop mark. */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        {hasClipBound && (
          <button
            type="button"
            onClick={replayClip}
            className="inline-flex items-center gap-1 text-xs font-medium text-civil-red-body dark:text-red-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Replay clip
          </button>
        )}
        {showCaption && locVideo.caption && (
          <span className="text-xs text-stone-500 leading-snug">
            {locVideo.caption}. Streamed from the Library of Congress.
          </span>
        )}
      </div>
    </div>
  );
});

export default LocVideoEmbed;
