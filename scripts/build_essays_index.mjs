#!/usr/bin/env node
// scripts/build_essays_index.mjs
//
// Builds public/rag/essays/index.json from the per-essay <slug>.json files and
// topics.json. The /essays UI reads this index; nothing in code hardcodes the
// essay list or the topic list, so the collection scales by data alone. Mirrors
// scripts/build_people_index.mjs. Re-run after scripts/harvest_essays.py.
//
// Usage: node scripts/build_essays_index.mjs

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'public', 'rag', 'essays');
const RESERVED = new Set(['manifest.json', 'topics.json', 'index.json']);

const topics = JSON.parse(readFileSync(join(DIR, 'topics.json'), 'utf8')).topics;

const essays = [];
for (const f of readdirSync(DIR)) {
  if (!f.endsWith('.json') || RESERVED.has(f)) continue;
  const d = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
  essays.push({
    slug: d.slug,
    title: d.title,
    authors: d.authors || [],
    year: d.year ?? null,
    collection: d.collection || null,
    themes: d.themes || [],
    excerpt: d.excerpt || '',
    word_count: d.word_count || 0,
    license_type: d.license?.type || 'unknown',
  });
}
essays.sort((a, b) => (a.year || 0) - (b.year || 0) || a.title.localeCompare(b.title));

const byTopic = {};
for (const t of topics) byTopic[t.id] = [];
for (const e of essays) for (const th of e.themes) if (byTopic[th]) byTopic[th].push(e.slug);

const authors = new Set();
for (const e of essays) for (const a of e.authors) authors.add(a);

const topicsOut = topics
  .map((t) => ({ ...t, essay_count: byTopic[t.id].length, essay_slugs: byTopic[t.id] }))
  .filter((t) => t.essay_count > 0);

const index = {
  schema_version: 1,
  generated: new Date().toISOString().slice(0, 10),
  counts: { essays: essays.length, topics: topicsOut.length, authors: authors.size },
  topics: topicsOut,
  essays,
};
writeFileSync(join(DIR, 'index.json'), JSON.stringify(index, null, 2) + '\n', 'utf8');
console.log(`essays index: ${essays.length} essays, ${topicsOut.length} topics, ${authors.size} authors`);
