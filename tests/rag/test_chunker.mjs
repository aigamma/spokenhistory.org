// tests/rag/test_chunker.mjs
//
// Tests for rag/chunker.mjs. Validates that:
//   - SRT timestamp parsing extracts cues correctly
//   - Time-aware chunking aggregates cues into ~60-second windows
//   - Paragraph-aware text chunking respects CHUNK_SIZE + CHUNK_OVERLAP
//   - chunkSource dispatches correctly based on extension
//   - Whitespace normalization preserves content while collapsing runs
//
// Run with: node --test tests/rag/test_chunker.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeWhitespace,
  parseSubtitleCues,
  chunkSubtitles,
  chunkText,
  chunkSource,
} from '../../rag/chunker.mjs';

test('normalizeWhitespace collapses tabs and runs of spaces', () => {
  const input = 'hello\t\tworld   foo   bar';
  assert.equal(normalizeWhitespace(input), 'hello world foo bar');
});

test('normalizeWhitespace collapses triple-or-more newlines to double', () => {
  const input = 'para 1\n\n\n\npara 2';
  assert.equal(normalizeWhitespace(input), 'para 1\n\npara 2');
});

test('normalizeWhitespace converts NBSP to space', () => {
  const input = 'foo bar';
  assert.equal(normalizeWhitespace(input), 'foo bar');
});

test('parseSubtitleCues parses standard SRT', () => {
  const srt = [
    '1',
    '00:00:01,500 --> 00:00:04,200',
    'Hello, world.',
    '',
    '2',
    '00:00:04,500 --> 00:00:08,100',
    'This is the second cue.',
    '',
  ].join('\n');
  const cues = parseSubtitleCues(srt);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].text, 'Hello, world.');
  assert.equal(cues[0].start, 1.5);
  assert.equal(cues[0].end, 4.2);
  assert.equal(cues[1].text, 'This is the second cue.');
});

test('parseSubtitleCues handles WebVTT header + dot-separated millis', () => {
  const vtt = [
    'WEBVTT',
    '',
    '00:00:00.000 --> 00:00:03.500',
    'WebVTT cue.',
    '',
  ].join('\n');
  const cues = parseSubtitleCues(vtt);
  assert.equal(cues.length, 1);
  assert.equal(cues[0].text, 'WebVTT cue.');
  assert.equal(cues[0].start, 0);
  assert.equal(cues[0].end, 3.5);
});

test('parseSubtitleCues returns empty for content with no timestamps', () => {
  const garbage = 'lorem ipsum dolor sit amet';
  assert.deepEqual(parseSubtitleCues(garbage), []);
});

test('chunkSubtitles aggregates within 60s window', () => {
  const cues = [];
  for (let i = 0; i < 10; i++) {
    cues.push({
      start: i * 5,
      end: (i + 1) * 5,
      text: `Sentence ${i}.`,
    });
  }
  const chunks = chunkSubtitles(cues);
  // 10 cues × 5s each = 50s total, should fit in one chunk
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].timestamp_start_seconds, 0);
  assert.equal(chunks[0].timestamp_end_seconds, 50);
  assert.equal(chunks[0].cue_count, 10);
});

test('chunkSubtitles splits at 60s boundary', () => {
  const cues = [];
  for (let i = 0; i < 20; i++) {
    cues.push({
      start: i * 5,
      end: (i + 1) * 5,
      text: `Sentence ${i}.`,
    });
  }
  const chunks = chunkSubtitles(cues);
  // 20 cues × 5s = 100s, should produce 2 chunks
  assert.ok(chunks.length >= 2);
  // All chunks should have timestamp metadata
  for (const ch of chunks) {
    assert.ok(typeof ch.timestamp_start_seconds === 'number');
    assert.ok(typeof ch.timestamp_end_seconds === 'number');
    assert.ok(ch.cue_count > 0);
  }
});

test('chunkText respects CHUNK_SIZE for short text', () => {
  const text = 'A short paragraph.\n\nAnother short paragraph.';
  const chunks = chunkText(text);
  assert.equal(chunks.length, 1);
  assert.ok(chunks[0].text.includes('A short paragraph.'));
  assert.ok(chunks[0].text.includes('Another short paragraph.'));
});

test('chunkText splits long text into multiple chunks with overlap', () => {
  // Build a deterministic long text: 5 paragraphs of ~500 chars each = ~2500 chars
  const para = 'word '.repeat(100); // ~500 chars
  const text = Array(5).fill(para).join('\n\n');
  const chunks = chunkText(text);
  assert.ok(chunks.length >= 2, 'expected multiple chunks for 2500-char input');
  // Verify each chunk has the expected shape
  for (const ch of chunks) {
    assert.ok(ch.text.length > 0);
    assert.equal(ch.cue_count, null); // text-mode has no cue timestamps
  }
});

test('chunkSource dispatches to subtitle parser for .srt', () => {
  const srt = '1\n00:00:00,000 --> 00:00:02,000\nFoo bar.\n';
  const chunks = chunkSource(srt, '.srt');
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].text, 'Foo bar.');
  assert.equal(chunks[0].timestamp_start_seconds, 0);
});

test('chunkSource dispatches to text chunker for .txt', () => {
  const text = 'Plain text content with no timestamps.';
  const chunks = chunkSource(text, '.txt');
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].cue_count, null);
});

test('chunkSource falls back to text chunker when .srt has no parseable cues', () => {
  const garbage = 'this has .srt extension but no timestamps';
  const chunks = chunkSource(garbage, '.srt');
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].cue_count, null);
});
