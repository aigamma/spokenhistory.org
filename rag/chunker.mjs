// rag/chunker.mjs
//
// Chunking strategy for the civil rights oral-history corpus.
//
// Two chunking modes:
//
// 1. **Time-aware chunking** (when an .srt or .vtt file is available):
//    chunks aggregate consecutive subtitle cues until they reach a target
//    duration (default 60s) or character budget, whichever comes first.
//    The chunk carries timestamp_start_seconds and timestamp_end_seconds
//    so the downstream UI can deep-link to a video offset.
//
// 2. **Text-only chunking** (.txt fallback, or when timing data is
//    unavailable): paragraph-aware splitting matching the worldthought.com
//    convention — 1100-char target, 180-char overlap, sentence-aware
//    fallback for long paragraphs.
//
// The chunker preserves the speaker label where Whisper output marks
// turn boundaries (e.g., "[Speaker 1]" or speaker-tagged JSON segments)
// so per-speaker retrieval is possible for joint-interview entries.

const CHUNK_SIZE = 1100;       // characters per text-chunk target
const CHUNK_OVERLAP = 180;     // characters of overlap between adjacent text chunks
const TIME_CHUNK_SECONDS = 60; // target duration of a time-aware chunk
const TIME_CHUNK_MAX_CHARS = 1400; // hard cap on time-aware chunk length

// ---------------------------------------------------------------------------
// Text normalization (shared)
// ---------------------------------------------------------------------------

export function normalizeWhitespace(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/ /g, ' ')   // NBSP -> space
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------------------------------------------------------------------------
// .srt / .vtt parsing
// ---------------------------------------------------------------------------

const SRT_TIMESTAMP_RE = /^(\d{2}):(\d{2}):(\d{2})[,\.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,\.](\d{3})/;

function srtTimestampToSeconds(h, m, s, ms) {
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000;
}

// Parse .srt or .vtt into a flat list of { start, end, text } cues.
// Returns [] if the file doesn't contain any timestamp lines (e.g.,
// a Whisper-degraded transcript that has no parseable timing data).
export function parseSubtitleCues(content) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const cues = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line || line === 'WEBVTT' || /^NOTE\b/i.test(line)) {
      i++;
      continue;
    }
    // Cue numeric ID (SRT) — skip if present
    if (/^\d+$/.test(line)) {
      i++;
      if (i >= lines.length) break;
    }
    const tsMatch = lines[i]?.match(SRT_TIMESTAMP_RE);
    if (!tsMatch) {
      i++;
      continue;
    }
    const start = srtTimestampToSeconds(tsMatch[1], tsMatch[2], tsMatch[3], tsMatch[4]);
    const end = srtTimestampToSeconds(tsMatch[5], tsMatch[6], tsMatch[7], tsMatch[8]);
    i++;
    const textLines = [];
    while (i < lines.length && lines[i].trim() !== '') {
      textLines.push(lines[i].trim());
      i++;
    }
    const text = textLines.join(' ').trim();
    if (text) cues.push({ start, end, text });
    i++;
  }
  return cues;
}

// ---------------------------------------------------------------------------
// Time-aware chunker
// ---------------------------------------------------------------------------

// Aggregate consecutive subtitle cues into chunks of ~TIME_CHUNK_SECONDS
// or TIME_CHUNK_MAX_CHARS, whichever comes first. Each chunk carries:
//   { text, timestamp_start_seconds, timestamp_end_seconds, cue_count }
export function chunkSubtitles(cues) {
  if (!Array.isArray(cues) || cues.length === 0) return [];
  const chunks = [];
  let current = null;
  for (const cue of cues) {
    if (!current) {
      current = {
        text: cue.text,
        timestamp_start_seconds: cue.start,
        timestamp_end_seconds: cue.end,
        cue_count: 1,
      };
      continue;
    }
    const candidateDuration = cue.end - current.timestamp_start_seconds;
    const candidateText = `${current.text} ${cue.text}`;
    if (
      candidateDuration <= TIME_CHUNK_SECONDS &&
      candidateText.length <= TIME_CHUNK_MAX_CHARS
    ) {
      current.text = candidateText;
      current.timestamp_end_seconds = cue.end;
      current.cue_count += 1;
    } else {
      chunks.push(current);
      current = {
        text: cue.text,
        timestamp_start_seconds: cue.start,
        timestamp_end_seconds: cue.end,
        cue_count: 1,
      };
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// ---------------------------------------------------------------------------
// Text-only chunker (paragraph + sentence aware)
// ---------------------------------------------------------------------------

export function chunkText(text) {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return [];
  const paragraphs = normalized.split(/\n{2,}/g);
  const chunks = [];
  let current = '';
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    const candidate = current ? `${current}\n\n${trimmed}` : trimmed;
    if (candidate.length <= CHUNK_SIZE) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      if (trimmed.length > CHUNK_SIZE) {
        const sentences = trimmed.split(/(?<=[.!?])\s+(?=[A-Z])/g);
        let cur = '';
        for (const s of sentences) {
          if (!cur) { cur = s; continue; }
          const cand = `${cur} ${s}`;
          if (cand.length <= CHUNK_SIZE) cur = cand;
          else { chunks.push(cur); cur = s; }
        }
        current = cur;
      } else {
        current = trimmed;
      }
    }
  }
  if (current) chunks.push(current);
  const withOverlap = [];
  for (let i = 0; i < chunks.length; i++) {
    if (i === 0) withOverlap.push(chunks[i]);
    else {
      const prevTail = chunks[i - 1].slice(-CHUNK_OVERLAP);
      withOverlap.push(`${prevTail}\n\n${chunks[i]}`);
    }
  }
  return withOverlap.map((text) => ({ text, cue_count: null }));
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

// Given a source file's content + its extension, return an array of
// chunk objects. Time-aware shape if .srt/.vtt with parseable timing;
// text shape otherwise. Either way each chunk has at least { text }.
export function chunkSource(content, ext) {
  const e = (ext || '').toLowerCase();
  if (e === '.srt' || e === '.vtt') {
    const cues = parseSubtitleCues(content);
    if (cues.length > 0) return chunkSubtitles(cues);
    // Fall through to text chunking if timing is unparseable
  }
  return chunkText(content);
}
