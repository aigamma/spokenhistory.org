/**
 * @fileoverview Encode, decode, and rehydrate an ordered playlist of clips
 * carried in the URL, so a playlist is a bookmarkable, shareable link with no
 * backend and no login.
 *
 * A clip is (entryNumber, startSeconds, endSeconds). A playlist is an ORDERED
 * list of clips, serialized into the `?clips=` query param on the Interviews
 * page (/table-of-contents).
 *
 * Grammar (version 1):
 *   ?clips=1~<entry>.<start>-<end>,<entry>.<start>-<end>,...
 * entry/start/end are non-negative integers (seconds). The separators
 * (~ . - ,) never occur inside an integer, so no percent-escaping is needed and
 * the URL stays human-readable and hand-editable. An optional &title= carries a
 * display name (encoded with the standard URLSearchParams, not here).
 *
 * Token order IS playlist order. A clip's identity (and dedupe key) is
 * `${entry}_${round(start)}`, which is unique across the corpus clip set, so a
 * clip is identified by where it starts, and adding the same moment twice is a
 * no-op regardless of a differing end.
 *
 * A stored/working clip ref is the minimal shape { e, s, n, t, sub }:
 *   e   entry number (int)
 *   s   start seconds (int)
 *   n   end seconds (int)
 *   t   cached label (advisory; re-derived from the catalogs on render)
 *   sub cached interviewee subject (advisory)
 * Labels are advisory because they re-derive authoritatively from
 * playlist_index.json + toc.json at render time (see rehydrateClip), so a
 * re-chapterization never leaves a saved playlist showing a stale title.
 */

import { tsToSeconds } from './clipLink';

export const CLIPS_PARAM_VERSION = 1;
export const MAX_CLIPS_PER_PLAYLIST = 100;
// Fallback window when a clip carries no usable end (a bare passage start, or a
// malformed token). Mirrors the clipHref end-repair in src/utils/clipLink.js.
const DEFAULT_CLIP_SECONDS = 60;

function toInt(v, fallback = 0) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : fallback;
}

function mmss(sec) {
  const t = Math.max(0, Math.round(Number(sec) || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return (h > 0 ? `${h}:` : '') + `${mm}:${String(s).padStart(2, '0')}`;
}

/**
 * Stable identity for a clip: entry plus rounded start. Accepts a stored ref
 * ({ e, s }) or any normalized/index/passage shape.
 * @param {Object} ref
 * @returns {string}
 */
export function dedupeKey(ref) {
  const e = toInt(ref.e ?? ref.entry ?? ref.entry_number ?? ref.entryNumber);
  const s = toInt(ref.s ?? ref.start ?? ref.start_seconds ?? ref.startSeconds);
  return `${e}_${s}`;
}

/**
 * Normalize any clip-bearing shape to the minimal stored ref { e, s, n, t, sub }.
 * Handles: an index clip ({ entry_number, start_seconds, end_seconds, title,
 * subject }), a retrieved passage ({ entryNumber, timestampStart(Str),
 * timestampEnd(Str), entrySubject }), a chapter/explicit shape ({ entry|
 * entryNumber, start|startSeconds, end|endSeconds, label|title, subject }), or an
 * already-stored ref. Returns null when no usable entry+start is present.
 * @param {Object} input
 * @returns {{e:number,s:number,n:number,t:string,sub:string}|null}
 */
export function normalizeClip(input) {
  if (!input) return null;
  const e = toInt(input.e ?? input.entry ?? input.entry_number ?? input.entryNumber, NaN);
  if (!Number.isFinite(e) || e <= 0) return null;

  // Start: numeric seconds first, then a timestamp string (passage shape).
  let s = input.s ?? input.start ?? input.start_seconds ?? input.startSeconds;
  if (s == null && (input.timestampStartStr != null || input.timestampStart != null)) {
    s = tsToSeconds(input.timestampStartStr != null ? input.timestampStartStr : input.timestampStart);
  }
  s = toInt(s);

  let n = input.n ?? input.end ?? input.end_seconds ?? input.endSeconds;
  if (n == null && (input.timestampEndStr != null || input.timestampEnd != null)) {
    n = tsToSeconds(input.timestampEndStr != null ? input.timestampEndStr : input.timestampEnd);
  }
  n = toInt(n);
  if (!(n > s)) n = s + DEFAULT_CLIP_SECONDS;

  const t = (input.t ?? input.label ?? input.title ?? '').toString().trim().slice(0, 160);
  const sub = (input.sub ?? input.subject ?? input.entrySubject ?? '').toString().trim().slice(0, 120);
  return { e, s, n, t, sub };
}

/**
 * Serialize one ref to a `<entry>.<start>-<end>` token.
 * @param {Object} ref
 * @returns {string}
 */
export function encodeToken(ref) {
  const e = toInt(ref.e ?? ref.entry_number ?? ref.entryNumber);
  const s = toInt(ref.s ?? ref.start_seconds ?? ref.startSeconds);
  let n = toInt(ref.n ?? ref.end_seconds ?? ref.endSeconds);
  if (!(n > s)) n = s + DEFAULT_CLIP_SECONDS;
  return `${e}.${s}-${n}`;
}

/**
 * Parse one `<entry>.<start>-<end>` token (the end is optional). Returns null
 * for a malformed token so the caller can drop it and keep the rest.
 * @param {string} tok
 * @returns {{e:number,s:number,n:number}|null}
 */
export function decodeToken(tok) {
  const m = /^(\d+)\.(\d+)(?:-(\d+))?$/.exec((tok || '').trim());
  if (!m) return null;
  const e = toInt(m[1]);
  const s = toInt(m[2]);
  let n = m[3] != null ? toInt(m[3]) : 0;
  if (!(e > 0)) return null;
  if (!(n > s)) n = s + DEFAULT_CLIP_SECONDS;
  return { e, s, n };
}

/**
 * Serialize an ordered list of refs to the `?clips=` value (versioned, capped).
 * @param {Array<Object>} refs
 * @returns {string}
 */
export function toClipsParam(refs) {
  const list = (refs || []).slice(0, MAX_CLIPS_PER_PLAYLIST).map(encodeToken);
  return `${CLIPS_PARAM_VERSION}~${list.join(',')}`;
}

/**
 * Parse a `?clips=` value to an ordered, deduped list of { e, s, n } refs.
 * Tolerant: strips a leading `<version>~`, drops malformed tokens, keeps the
 * rest, and caps the length. Labels are not present here (see rehydrateClip).
 * @param {string} param
 * @returns {Array<{e:number,s:number,n:number}>}
 */
export function fromClipsParam(param) {
  if (!param) return [];
  let body = String(param).trim();
  const vm = /^(\d+)~(.*)$/.exec(body);
  if (vm) body = vm[2]; // strip a leading "<version>~"
  const out = [];
  const seen = new Set();
  for (const tok of body.split(',')) {
    const ref = decodeToken(tok);
    if (!ref) continue;
    const k = `${ref.e}_${ref.s}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(ref);
    if (out.length >= MAX_CLIPS_PER_PLAYLIST) break;
  }
  return out;
}

/**
 * Build a Map of `${entry}_${round(start)}` -> index clip, for exact-hit label
 * rehydration of chapter-aligned clips.
 * @param {Object} playlistIndex parsed /rag/playlist_index.json
 * @returns {Map<string, Object>}
 */
export function buildIndexMap(playlistIndex) {
  const map = new Map();
  for (const c of playlistIndex?.clips || []) {
    map.set(`${toInt(c.entry_number)}_${toInt(c.start_seconds)}`, c);
  }
  return map;
}

/**
 * Build a Map of entry -> interview (with parts/chapters), for the nearest
 * containing-chapter label fallback used by mid-chapter (semantic) clips.
 * @param {Object} toc parsed /rag/toc.json
 * @returns {Map<number, Object>}
 */
export function buildTocIndex(toc) {
  const map = new Map();
  for (const iv of toc?.interviews || []) map.set(Number(iv.entry), iv);
  return map;
}

/**
 * Resolve a stored ref to a render-ready clip:
 *   { key, entry_number, start_seconds, end_seconds, title, subject }
 *
 * PLAYBACK ALWAYS USES THE LITERAL REF BOUNDS. The label is the exact index
 * clip when the start matches a chapter boundary (favorited chapters, topic
 * playlists), otherwise the chapter that CONTAINS the start (semantic snippets
 * fall mid-chapter), otherwise a bare timestamp. The end is repaired from the
 * matched chapter, then from the default window, only when the ref carries none.
 *
 * @param {Object} ref a stored ref { e, s, n, t?, sub? }
 * @param {Map<string,Object>} [indexMap] from buildIndexMap
 * @param {Map<number,Object>} [tocIndex] from buildTocIndex
 * @param {Object} [videos] playlistIndex.videos (entry -> { subject, ... })
 * @returns {{key:string,entry_number:number,start_seconds:number,end_seconds:number,title:string,subject:string}}
 */
export function rehydrateClip(ref, indexMap, tocIndex, videos) {
  const e = toInt(ref.e ?? ref.entry_number);
  const s = toInt(ref.s ?? ref.start_seconds);
  let n = toInt(ref.n ?? ref.end_seconds);
  const key = `${e}_${s}`;

  const exact = indexMap && indexMap.get(key);
  if (exact) {
    if (!(n > s)) n = toInt(exact.end_seconds) || s + DEFAULT_CLIP_SECONDS;
    return {
      key,
      entry_number: e,
      start_seconds: s,
      end_seconds: n,
      title: (ref.t || exact.title || 'Untitled clip').toString(),
      subject: (ref.sub || exact.subject || '').toString(),
    };
  }

  // Fallback: the chapter that contains this start time (mid-chapter snippet).
  let title = (ref.t || '').toString();
  let subject = (ref.sub || '').toString();
  const iv = tocIndex && tocIndex.get(e);
  if (iv) {
    if (!subject) subject = iv.subject || '';
    for (const part of iv.parts || []) {
      const ch = (part.chapters || []).find((c) => c.start <= s && s < c.end);
      if (ch) {
        if (!title) title = ch.title;
        if (!(n > s)) n = toInt(ch.end);
        break;
      }
    }
  }
  if (!subject && videos && videos[e] && videos[e].subject) subject = videos[e].subject;
  if (!(n > s)) n = s + DEFAULT_CLIP_SECONDS;
  if (!title) title = `Clip at ${mmss(s)}`;
  if (!subject) subject = `Interview ${e}`;
  return { key, entry_number: e, start_seconds: s, end_seconds: n, title, subject };
}
