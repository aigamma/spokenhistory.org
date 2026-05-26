/**
 * @fileoverview Html5VideoPlayer — HTML5 <video> element variant of
 * VideoPlayer for LoC-served MP4 / HLS streams. Mirrors VideoPlayer's
 * public API so PlaylistBuilder and InterviewPlayer can dispatch
 * between this and the YouTube path without changes upstream.
 *
 * The original VideoPlayer.jsx is YouTube-iframe-only (uses YT.Player
 * API). The civil-rights pipeline now sources videos from the Library
 * of Congress catalog, which serves MP4 + HLS (.m3u8) directly — no
 * YouTube videoId to extract. This component takes a video.videoEmbedLink
 * pointing at a direct stream URL and plays it with native HTML5 video.
 *
 * Clip-window support:
 *   - video.timestamp is parsed for [HH:MM:SS] - [HH:MM:SS]
 *   - On mount: seek to startSeconds and (optionally) auto-play
 *   - On timeUpdate: if currentTime >= endSeconds, fire onVideoEnd
 *
 * Props match VideoPlayer.jsx:
 *   video, onVideoEnd, onPlay, onPause, onTimeUpdate, isPlaying, seekToTime
 */

import { useEffect, useRef, useState } from 'react';
import { parseTimestampRange } from '../utils/timeUtils';

const Html5VideoPlayer = ({
  video,
  onVideoEnd,
  onPlay,
  onPause,
  onTimeUpdate,
  isPlaying,
  seekToTime,
}) => {
  const videoRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const lastSeekRef = useRef(null);

  const boundaries = (() => {
    if (!video) return { startSeconds: 0, endSeconds: 0 };
    try {
      const { startSeconds, endSeconds } = parseTimestampRange(video.timestamp);
      const start = Number.isFinite(startSeconds) ? Math.max(0, startSeconds) : 0;
      const end = Number.isFinite(endSeconds) && endSeconds > start ? endSeconds : start + 300;
      return { startSeconds: start, endSeconds: end };
    } catch {
      return { startSeconds: 0, endSeconds: 300 };
    }
  })();

  const sourceUrl = video?.videoEmbedLink || video?.video_url || '';
  const posterUrl = video?.thumbnailUrl || video?.poster_url || null;

  // Mount: load source, seek to startSeconds, optionally autoplay.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !sourceUrl) return undefined;

    setIsReady(false);
    const { startSeconds } = boundaries;

    const onLoaded = () => {
      try {
        if (startSeconds > 0) el.currentTime = startSeconds;
      } catch {
        // ignore — some sources don't allow seek before play
      }
      setIsReady(true);
      if (isPlaying) {
        el.play().catch(() => { /* autoplay block; user gesture needed */ });
      }
    };
    el.addEventListener('loadedmetadata', onLoaded);

    return () => {
      el.removeEventListener('loadedmetadata', onLoaded);
      try { el.pause(); } catch { /* noop */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceUrl]);

  // External isPlaying changes -> sync to element
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !isReady) return;
    try {
      if (isPlaying) el.play().catch(() => { /* user gesture needed */ });
      else el.pause();
    } catch { /* noop */ }
  }, [isPlaying, isReady]);

  // External seekToTime — value is relative to clip start.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !isReady) return;
    if (seekToTime == null) return;
    if (lastSeekRef.current === seekToTime) return;
    try {
      el.currentTime = boundaries.startSeconds + seekToTime;
      lastSeekRef.current = seekToTime;
    } catch { /* noop */ }
  }, [seekToTime, isReady, boundaries.startSeconds]);

  if (!sourceUrl) {
    return (
      <div className="w-full h-full bg-stone-900 flex items-center justify-center text-stone-400 text-sm">
        No video stream available for this clip.
      </div>
    );
  }

  return (
    <div className="video-player-wrapper relative w-full h-full">
      <video
        ref={videoRef}
        src={sourceUrl}
        poster={posterUrl || undefined}
        controls
        playsInline
        className="rounded-lg shadow-lg bg-black w-full h-full"
        onPlay={() => { if (onPlay) onPlay(); }}
        onPause={() => { if (onPause) onPause(); }}
        onEnded={() => { if (onVideoEnd) onVideoEnd(); }}
        onTimeUpdate={(e) => {
          const cur = e.currentTarget.currentTime;
          const { startSeconds, endSeconds } = boundaries;
          const relative = Math.max(0, cur - startSeconds);
          if (onTimeUpdate) onTimeUpdate(relative);
          // End-of-clip detection: cut to next when we hit endSeconds
          if (endSeconds > startSeconds && cur >= endSeconds) {
            try { e.currentTarget.pause(); } catch { /* noop */ }
            if (onVideoEnd) onVideoEnd();
          }
        }}
        onError={() => {
          // If the stream URL fails (LoC region restriction, expired URL,
          // network error), skip to the next clip rather than block the
          // whole playlist. Same pattern as the YouTube path's onError.
          if (onVideoEnd) {
            setTimeout(() => { onVideoEnd(); }, 250);
          }
        }}
      >
        Your browser doesn&apos;t support HTML5 video. The clip is available at{' '}
        <a href={sourceUrl}>{sourceUrl}</a>.
      </video>
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 pointer-events-none">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
};

export default Html5VideoPlayer;
