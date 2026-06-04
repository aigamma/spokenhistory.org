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
import { RotateCcw } from 'lucide-react';
import { seekThenPlay } from '../utils/mediaClip';

// Module-level cache of loc_video metadata keyed by entry number, so the
// several snippet cards that can appear on one person page (and repeat
// visits to the same interview) reuse a single fetch of the entry's
// pipeline output rather than refetching a ~30 KB JSON per card.
const locVideoCache = new Map();

function loadLocVideo(entryNumber) {
  if (locVideoCache.has(entryNumber)) return locVideoCache.get(entryNumber);
  const p = fetch(`/rag/summaries/pipeline_output/entry_${entryNumber}.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => (d && d.loc_video ? d.loc_video : null))
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
    overlay = null,
  },
  ref,
) {
  const [locVideo, setLocVideo] = useState(locVideoProp);
  const [status, setStatus] = useState(locVideoProp ? 'ready' : 'loading');
  const videoRef = useRef(null);
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

  // Keep the stop mark in sync with the props. Runs on prop change only, so an
  // imperative seek's stop mark survives unrelated re-renders.
  useEffect(() => {
    stopAtRef.current = hasClipBound ? endSeconds : null;
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
        stopAtRef.current = stopAt != null && stopAt > target ? stopAt : null;
        const run = () => seekThenPlay(el, target, play);
        if (el.readyState >= 1) run();
        else el.addEventListener('loadedmetadata', run, { once: true });
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
    let detach = () => {};
    const begin = () => {
      detach = seekThenPlay(el, startSeconds, autoPlay);
    };
    if (el.readyState >= 1) {
      begin();
    } else {
      el.addEventListener('loadedmetadata', begin, { once: true });
    }
    return () => {
      el.removeEventListener('loadedmetadata', begin);
      detach();
    };
  }, [status, startSeconds, autoPlay, locVideo]);

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
      // Clip-relative progress (0..1) for an optional parent progress bar.
      // timeupdate already fires during normal playback, so this adds no
      // listener and no latency. Guard against a missing or zero-length clip.
      if (typeof onProgressRef.current === 'function') {
        const span = endSeconds - startSeconds;
        if (hasClipBound && span > 0) {
          let frac = (el.currentTime - startSeconds) / span;
          if (frac < 0) frac = 0;
          else if (frac > 1) frac = 1;
          onProgressRef.current(frac);
        }
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
          preload="metadata"
          playsInline
          className="w-full h-full"
        >
          Your browser does not support embedded video. The interview is
          available at <a href={sourceUrl}>the Library of Congress</a>.
        </video>
        {/* Corner overlay slot (e.g. the clip countdown ring), pinned to the
            lower-right of the video so it is visible while watching.
            pointer-events-none so it never blocks the native video controls. */}
        {overlay && (
          <div className="pointer-events-none absolute bottom-3 right-3 z-10">
            {overlay}
          </div>
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
