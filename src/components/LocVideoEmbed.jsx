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
 * This component renders that video with native HTML5 controls, seeks to
 * a requested start time, and (optionally) begins playback. It is used in
 * two places:
 *
 *   - PersonPage, expanded inline beneath a transcript snippet when the
 *     reader clicks "Hear this in context" (seeks to the quote's
 *     timestamp and plays, so the spoken moment is actually heard).
 *   - InterviewDetail, as the page's video hero, optionally deep-linked
 *     to a moment via the ?t= query param.
 *
 * The MP4 is served from tile.loc.gov, which honors HTTP range requests,
 * so seeking deep into a multi-hour file does not download the whole
 * thing first. We prefer the MP4 source because it plays natively in
 * every browser; the HLS .m3u8 needs a media-source library outside
 * Safari and is kept only as a fallback when no MP4 is published.
 */

import { useEffect, useRef, useState } from 'react';

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
 * @param {boolean}  [props.autoPlay]     Begin playback once ready.
 * @param {string}   [props.className]    Extra classes on the wrapper.
 * @param {boolean}  [props.showCaption]  Render the LoC caption below the
 *                                        player (default true).
 */
export default function LocVideoEmbed({
  entryNumber,
  locVideo: locVideoProp = null,
  startSeconds = 0,
  autoPlay = false,
  className = '',
  showCaption = true,
}) {
  const [locVideo, setLocVideo] = useState(locVideoProp);
  const [status, setStatus] = useState(locVideoProp ? 'ready' : 'loading');
  const videoRef = useRef(null);

  // Resolve the loc_video block: use the prop when given, otherwise fetch
  // it from the entry's pipeline output.
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
    return () => { cancelled = true; };
  }, [entryNumber, locVideoProp]);

  // Seek to the requested moment and optionally autoplay once the element
  // has metadata. The click that mounts this component (on PersonPage) is
  // the user gesture that lets play() proceed with audio.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || status !== 'ready') return undefined;

    const applyStart = () => {
      try {
        if (startSeconds > 0) el.currentTime = startSeconds;
      } catch {
        // Some sources reject a seek before the first play; ignore and
        // let the user scrub manually.
      }
      if (autoPlay) {
        el.play().catch(() => { /* autoplay blocked; controls remain */ });
      }
    };

    if (el.readyState >= 1) {
      applyStart();
      return undefined;
    }
    el.addEventListener('loadedmetadata', applyStart, { once: true });
    return () => el.removeEventListener('loadedmetadata', applyStart);
  }, [status, startSeconds, autoPlay, locVideo]);

  if (status === 'loading') {
    return (
      <div className={`w-full aspect-video rounded-lg bg-stone-900 flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" role="status">
          <span className="sr-only">Loading video</span>
        </div>
      </div>
    );
  }

  if (status === 'error' || !locVideo) {
    return (
      <div className={`w-full rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-600 ${className}`}>
        The Library of Congress video for this interview could not be loaded. Use the Library of Congress catalog link to view it on loc.gov.
      </div>
    );
  }

  const sourceUrl = locVideo.video_url || locVideo.video_stream_url;

  return (
    <div className={className}>
      <div className="w-full aspect-video rounded-lg overflow-hidden bg-black shadow">
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
          available at{' '}
          <a href={sourceUrl}>the Library of Congress</a>.
        </video>
      </div>
      {showCaption && locVideo.caption && (
        <p className="mt-2 text-xs text-stone-500 leading-snug">
          {locVideo.caption}. Streamed from the Library of Congress.
        </p>
      )}
    </div>
  );
}
