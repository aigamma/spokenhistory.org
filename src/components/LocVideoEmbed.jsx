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
 * requested start time, and plays a BOUNDED CLIP: when `endSeconds` is set
 * it pauses the moment playback crosses that mark, so a snippet on a person
 * page or a search result plays just its passage instead of running on into
 * the rest of a multi-hour interview.
 *
 * Why a bounded clip is cheap: the LoC MP4 is served from tile.loc.gov with
 * its moov atom at the front (web-optimized) and Accept-Ranges: bytes, so a
 * seek to the clip start pulls only the index plus the byte range the clip
 * actually plays. The 1.9 GB file is never downloaded whole; the player
 * fetches the clip's bytes and stops. That granularity is the whole point of
 * carrying precise per-passage timestamps.
 *
 * Used in:
 *   - HearInContext, expanded inline beneath a snippet / citation card when
 *     the reader clicks "Hear this in context" (seeks to the quote's start,
 *     plays, and stops at the quote's end).
 *   - InterviewDetail, as the page's video hero. It holds an imperative
 *     handle so chapter rows can seek + clip-bound it without remounting.
 *
 * We prefer the MP4 source because it plays natively in every browser; the
 * HLS .m3u8 needs a media-source library outside Safari and is kept only as
 * a fallback when no MP4 is published.
 */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { RotateCcw } from 'lucide-react';

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
 *                                        Null/0 means open-ended playback.
 * @param {boolean}  [props.autoPlay]     Begin playback once ready.
 * @param {string}   [props.className]    Extra classes on the wrapper.
 * @param {boolean}  [props.showCaption]  Render the LoC caption below the
 *                                        player (default true).
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
  },
  ref,
) {
  const [locVideo, setLocVideo] = useState(locVideoProp);
  const [status, setStatus] = useState(locVideoProp ? 'ready' : 'loading');
  // True once playback has paused at the clip boundary, so we can offer a
  // "Replay clip" control instead of leaving the reader at a silent freeze.
  const [atClipEnd, setAtClipEnd] = useState(false);
  const videoRef = useRef(null);
  // The active clip-stop mark in seconds, or null for open-ended. Held in a
  // ref (not state) so the high-frequency timeupdate handler reads the
  // current value without re-subscribing, and so an imperative seek can
  // re-arm it without a render. Disarmed (set null) the instant it fires so
  // a reader who presses play again is not trapped at the boundary.
  const stopAtRef = useRef(null);

  const hasClipBound =
    endSeconds != null && endSeconds > 0 && endSeconds > startSeconds;

  // Keep the stop mark in sync with the props. Runs on prop change only, so
  // an imperative seek's stop mark survives unrelated re-renders.
  useEffect(() => {
    stopAtRef.current = hasClipBound ? endSeconds : null;
    setAtClipEnd(false);
  }, [hasClipBound, endSeconds, startSeconds]);

  // Imperative handle for parents that own the element (InterviewDetail's
  // hero): seek to a moment, optionally bound the clip, optionally play.
  useImperativeHandle(
    ref,
    () => ({
      seek(seconds, { play = true, stopAt = null } = {}) {
        const el = videoRef.current;
        if (!el) return;
        const target = Math.max(0, Number(seconds) || 0);
        stopAtRef.current = stopAt != null && stopAt > target ? stopAt : null;
        setAtClipEnd(false);
        const go = () => {
          try {
            el.currentTime = target;
          } catch {
            /* seek rejected before load; controls remain */
          }
          if (play) el.play().catch(() => {});
        };
        if (el.readyState >= 1) go();
        else el.addEventListener('loadedmetadata', go, { once: true });
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

  // Seek to the requested moment and optionally autoplay once the element
  // has metadata. The click that mounts this component (via HearInContext)
  // is the user gesture that lets play() proceed with audio.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || status !== 'ready') return undefined;

    const applyStart = () => {
      try {
        if (startSeconds > 0) el.currentTime = startSeconds;
      } catch {
        // Some sources reject a seek before the first play; ignore and let
        // the user scrub manually.
      }
      if (autoPlay) {
        el.play().catch(() => {
          /* autoplay blocked; controls remain */
        });
      }
    };

    if (el.readyState >= 1) {
      applyStart();
      return undefined;
    }
    el.addEventListener('loadedmetadata', applyStart, { once: true });
    return () => el.removeEventListener('loadedmetadata', applyStart);
  }, [status, startSeconds, autoPlay, locVideo]);

  // Bounded-clip stop. Pause the instant playback crosses the stop mark,
  // then disarm so the reader can keep listening (or scrub) freely; a
  // "Replay clip" control re-arms and restarts from the clip start.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || status !== 'ready') return undefined;
    const onTimeUpdate = () => {
      const stopAt = stopAtRef.current;
      if (stopAt != null && el.currentTime >= stopAt) {
        el.pause();
        stopAtRef.current = null;
        setAtClipEnd(true);
      }
    };
    el.addEventListener('timeupdate', onTimeUpdate);
    return () => el.removeEventListener('timeupdate', onTimeUpdate);
  }, [status, locVideo]);

  const replayClip = () => {
    const el = videoRef.current;
    if (!el) return;
    stopAtRef.current = hasClipBound ? endSeconds : null;
    setAtClipEnd(false);
    try {
      el.currentTime = startSeconds;
    } catch {
      /* ignore; controls remain */
    }
    el.play().catch(() => {});
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
        {atClipEnd && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <button
              type="button"
              onClick={replayClip}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white/95 text-stone-900 text-sm font-medium hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Replay clip
            </button>
          </div>
        )}
      </div>
      {showCaption && locVideo.caption && (
        <p className="mt-2 text-xs text-stone-500 leading-snug">
          {locVideo.caption}. Streamed from the Library of Congress.
        </p>
      )}
    </div>
  );
});

export default LocVideoEmbed;
