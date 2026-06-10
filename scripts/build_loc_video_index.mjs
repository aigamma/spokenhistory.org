#!/usr/bin/env node
// scripts/build_loc_video_index.mjs
//
// Walks public/rag/summaries/pipeline_output/entry_<N>.json and emits a single
// compact public/rag/loc_video_index.json: entry_number -> the five-field
// loc_video block the player actually needs.
//
//   { "<entry>": {
//       video_url, video_stream_url, poster_url, duration_seconds, caption
//   }, ... }
//
// WHY THIS EXISTS. Every "See this in context" snippet (CitationCard, PersonPage,
// PolyphonicEvents) and the interview-page hero render a LocVideoEmbed that needs
// only the loc_video block to show its poster and seek its clip. Without this
// index each snippet fetched the WHOLE per-entry pipeline output (37-71 KB of
// summary/chapter/audit metadata) just to read five fields, and a page that lays
// out snippets from many different interviews (the Explore / Data Insights pages,
// a person page) paid that per distinct entry. This index is ~80 KB for all 140
// entries, fetched once and cached for the session, so the SECOND clip onward
// resolves with no network at all and the poster paints immediately, the way the
// interview page's hero does. It does NOT change how the clip itself loads: the
// byte-bounded seek (moov atom + the clip's range, never the multi-GB file) is
// unchanged. See src/components/LocVideoEmbed.jsx for the load path.
//
// Usage:
//   node scripts/build_loc_video_index.mjs
//
// Run this after any corpus change that adds, removes, or re-sources an entry's
// loc_video (i.e. after onboard_interview.py, alongside build_toc.py /
// build_playlist_index.py). The output is deterministic (entries sorted
// numerically), so CI can verify it is current by re-running and diffing.

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const PIPELINE_DIR = join(
  process.cwd(),
  'public',
  'rag',
  'summaries',
  'pipeline_output',
);
const OUT_PATH = join(process.cwd(), 'public', 'rag', 'loc_video_index.json');

// The exact fields LocVideoEmbed reads, in a stable order. Keeping the set tight
// is the whole point: anything else belongs in the per-entry JSON, not here.
const FIELDS = [
  'video_url',
  'video_stream_url',
  'poster_url',
  'duration_seconds',
  'caption',
];

async function main() {
  const files = (await readdir(PIPELINE_DIR)).filter((f) =>
    /^entry_\d+\.json$/.test(f),
  );

  const index = {};
  const coverage = Object.fromEntries(FIELDS.map((f) => [f, 0]));
  let withVideo = 0;
  let skipped = 0;

  for (const file of files) {
    let data;
    try {
      data = JSON.parse(await readFile(join(PIPELINE_DIR, file), 'utf8'));
    } catch {
      skipped += 1;
      continue;
    }
    const entry = data.entry_number ?? Number(file.match(/entry_(\d+)\.json/)[1]);
    const lv = data.loc_video;
    // Only index entries that can actually back a player. A row with neither a
    // direct MP4 nor an HLS stream is useless here; LocVideoEmbed's per-entry
    // fallback still handles any such straggler.
    if (!lv || !(lv.video_url || lv.video_stream_url)) {
      skipped += 1;
      continue;
    }
    const slim = {};
    for (const f of FIELDS) {
      if (lv[f] !== undefined && lv[f] !== null) {
        slim[f] = lv[f];
        coverage[f] += 1;
      }
    }
    index[entry] = slim;
    withVideo += 1;
  }

  // Sort keys numerically so the emitted JSON is stable across runs.
  const sorted = {};
  for (const k of Object.keys(index).sort((a, b) => Number(a) - Number(b))) {
    sorted[k] = index[k];
  }

  const json = `${JSON.stringify(sorted, null, 0)}\n`;
  await writeFile(OUT_PATH, json, 'utf8');

  const bytes = Buffer.byteLength(json, 'utf8');
  console.log(`Wrote ${OUT_PATH}`);
  console.log(`  entries indexed: ${withVideo}  (skipped ${skipped})`);
  console.log(`  size: ${(bytes / 1024).toFixed(1)} KB`);
  console.log(
    `  field coverage: ${FIELDS.map((f) => `${f}=${coverage[f]}`).join('  ')}`,
  );
  // Loud, non-fatal warnings: a player needs video_url and poster_url to feel
  // instant. Missing either is a data gap worth surfacing, not a build break.
  if (coverage.video_url < withVideo) {
    console.warn(
      `  WARNING: ${withVideo - coverage.video_url} indexed entries lack a direct video_url (HLS-only).`,
    );
  }
  if (coverage.poster_url < withVideo) {
    console.warn(
      `  WARNING: ${withVideo - coverage.poster_url} indexed entries lack a poster_url (no instant still frame).`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
