#!/usr/bin/env node
/**
 * check_theme_coverage.mjs - coverage gate for the Topics taxonomy.
 *
 * Enforces the project rule that every Playlist in src/data/archiveThemes.js
 * resolves to a non-empty set of real clips in public/rag/playlist_index.json,
 * so the Topics page never links to an empty playlist. The matching logic here
 * mirrors src/pages/StaticPlaylist.jsx EXACTLY (whole-phrase substring across the
 * combined clip text, with an all-words fallback; exact topic_category match for
 * topic queries), so a green gate here means a non-empty page there.
 *
 * Usage:  node scripts/check_theme_coverage.mjs [--min N]   (default min 3)
 * Exit:   0 if every query has >= min clips; 1 (with a report) otherwise.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { THEMES } from '../src/data/archiveThemes.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const index = JSON.parse(
  readFileSync(resolve(root, 'public/rag/playlist_index.json'), 'utf8'),
);
const clips = index.clips || [];

const minArg = process.argv.indexOf('--min');
const MIN = minArg !== -1 ? Number(process.argv[minArg + 1]) : 3;

const tokenize = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const textOf = (c) =>
  `${c.title || ''} ${c.summary || ''} ${(c.keywords || []).join(' ')} ${(c.related_events || []).join(' ')} ${c.topic_category || ''} ${c.subject || ''}`.toLowerCase();

const TEXTS = clips.map(textOf);
const TOPICS = clips.map((c) => (c.topic_category || '').toLowerCase());

function countKeywords(phrase) {
  const p = phrase.toLowerCase();
  let n = TEXTS.reduce((acc, t) => acc + (t.includes(p) ? 1 : 0), 0);
  if (n > 0) return n;
  const words = tokenize(phrase);
  if (!words.length) return 0;
  return TEXTS.reduce(
    (acc, t) => acc + (words.every((w) => t.includes(w)) ? 1 : 0),
    0,
  );
}

function countTopic(topic) {
  const t = topic.toLowerCase();
  return TOPICS.reduce((acc, v) => acc + (v === t ? 1 : 0), 0);
}

let total = 0;
let failures = 0;
const counts = [];
for (const theme of THEMES) {
  for (const p of theme.playlists) {
    total += 1;
    const q = p.query || {};
    const n = q.topic ? countTopic(q.topic) : countKeywords(q.keywords || '');
    counts.push([n, theme.name, p.name, q.topic ? `topic:${q.topic}` : q.keywords]);
    if (n < MIN) {
      failures += 1;
      console.error(
        `  FAIL  ${theme.name} > ${p.name}  (${q.topic ? `topic:${q.topic}` : `"${q.keywords}"`} = ${n}, need >= ${MIN})`,
      );
    }
  }
}

counts.sort((a, b) => a[0] - b[0]);
console.log('\nSmallest playlists:');
for (const [n, themeName, name, q] of counts.slice(0, 8)) {
  console.log(`  ${String(n).padStart(4)}  ${name}  (${q})`);
}
console.log(
  `\nChecked ${total} playlists across ${THEMES.length} themes. Failures (< ${MIN}): ${failures}`,
);
process.exit(failures ? 1 : 0);
