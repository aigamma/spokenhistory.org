#!/usr/bin/env node
// scripts/build_essays_sources_report.mjs
//
// Emits output/essays-sources-report.md: every essay hosted on /essays with its
// full citation, license, and canonical source, plus the documented candidates
// and a license-tier summary. For reporting notes and the institutional
// provenance record. Reads only local JSON (no network, no credentials).
// Re-run after scripts/harvest_essays.py + scripts/build_essays_index.mjs.
//
// Usage: node scripts/build_essays_sources_report.mjs

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ESSAYS = join(ROOT, 'public', 'rag', 'essays');
const OUT = join(ROOT, 'output');
const RESERVED = new Set(['manifest.json', 'topics.json', 'index.json']);

const manifest = JSON.parse(readFileSync(join(ESSAYS, 'manifest.json'), 'utf8'));

const hosted = [];
for (const f of readdirSync(ESSAYS)) {
  if (!f.endsWith('.json') || RESERVED.has(f)) continue;
  hosted.push(JSON.parse(readFileSync(join(ESSAYS, f), 'utf8')));
}
hosted.sort((a, b) => (a.year || 0) - (b.year || 0) || a.title.localeCompare(b.title));

const fmtAuthors = (a) => (a || []).join(', ');
const cell = (s) => String(s == null ? '' : s).replace(/\|/g, '/').replace(/\n/g, ' ');

const tier = {};
for (const e of hosted) {
  const t = e.license?.type || 'unknown';
  tier[t] = (tier[t] || 0) + 1;
}
const authors = new Set();
hosted.forEach((e) => (e.authors || []).forEach((a) => authors.add(a)));
const words = hosted.reduce((s, e) => s + (e.word_count || 0), 0);

const L = [];
L.push('# Essays: Sources Report');
L.push('');
L.push(`Generated ${new Date().toISOString().slice(0, 10)} by scripts/build_essays_sources_report.mjs.`);
L.push('');
L.push(
  'Every essay hosted on /essays, with full citation, license, and canonical source. ' +
    'All are public domain or under a license that permits derivative use (the embedding ' +
    'pipeline is a derivative use, so No-Derivatives licenses are excluded). This doubles ' +
    'as the institutional provenance record.',
);
L.push('');
L.push('## Summary');
L.push('');
L.push(`- Hosted essays: ${hosted.length}`);
L.push(`- Distinct authors: ${authors.size}`);
L.push(`- License tiers: ${Object.entries(tier).map(([k, v]) => `${k} (${v})`).join(', ')}`);
L.push(`- Total words hosted: ${words.toLocaleString()}`);
L.push('');
L.push('## Hosted Essays');
L.push('');
L.push('| Title | Author(s) | Year | Source / Venue | License | Themes | Source URL |');
L.push('|---|---|---|---|---|---|---|');
for (const e of hosted) {
  const venue = [e.collection, e.venue].filter(Boolean).join('; ');
  L.push(
    `| ${cell(e.title)} | ${cell(fmtAuthors(e.authors))} | ${cell(e.year)} | ${cell(venue)} | ` +
      `${cell(e.license?.type)} | ${cell((e.themes || []).join(', '))} | ${cell(e.source_url)} |`,
  );
}
L.push('');

const candidates = manifest.sources.filter((r) => r.status === 'candidate');
if (candidates.length) {
  L.push('## Documented Candidates (Not Yet Hosted)');
  L.push('');
  L.push(
    'Sources identified and recorded for the scalable expansion path. Each needs its ' +
      'per-item license verified (or its source URL resolved) before harvest.',
  );
  L.push('');
  L.push('| Title | Author(s) | Year | License (proposed) | Note |');
  L.push('|---|---|---|---|---|');
  for (const r of candidates) {
    L.push(`| ${cell(r.title)} | ${cell(fmtAuthors(r.authors))} | ${cell(r.year)} | ${cell(r.license?.type)} | ${cell(r.license?.note)} |`);
  }
  L.push('');
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'essays-sources-report.md'), L.join('\n') + '\n', 'utf8');
console.log(`sources report: ${hosted.length} hosted, ${candidates.length} candidates -> output/essays-sources-report.md`);
