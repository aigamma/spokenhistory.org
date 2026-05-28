#!/usr/bin/env node
// scripts/build_people_index.mjs
//
// Walks public/rag/people/*.json and emits public/rag/people/index.json
// with entry_number -> slug mapping for interviewees plus a slug-to-
// summary lookup. The PersonPage component uses this index at render
// time to turn the precomputed semantic-neighbor lists (which carry
// only entry_number) into hyperlinks that point at the neighbor's
// /person/:slug catalog page directly rather than at the Semantic
// Overlap tab.
//
// Usage:
//   node scripts/build_people_index.mjs
//
// Run this after adding, removing, or renaming any catalog JSON.
// CI verifies the index is current by re-running this script and
// failing if the diff is non-empty.

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const PEOPLE_DIR = join(process.cwd(), 'public', 'rag', 'people');
const INDEX_PATH = join(PEOPLE_DIR, 'index.json');

async function main() {
  const files = (await readdir(PEOPLE_DIR)).filter(
    (f) => f.endsWith('.json') && f !== 'index.json' && f !== 'famous_external.json',
  );

  // entry_number -> { slug, display_name, person_type }
  // for interviewees only (external_figures have no entry_number).
  const byEntry = {};

  // slug -> { display_name, person_type, entry_number? }
  // covers every catalog page; useful for direct slug lookups.
  const bySlug = {};

  for (const f of files) {
    let data;
    try {
      const raw = await readFile(join(PEOPLE_DIR, f), 'utf8');
      data = JSON.parse(raw);
    } catch (e) {
      console.warn(`[build-people-index] skipping ${f}: ${e.message}`);
      continue;
    }
    const slug = data.slug || f.replace(/\.json$/, '');
    const displayName = data.display_name || slug;
    const personType = data.person_type || 'external_figure';
    const entryNumber = Number.isFinite(data.entry_number) ? data.entry_number : null;

    const summary = { slug, display_name: displayName, person_type: personType };
    if (entryNumber != null) summary.entry_number = entryNumber;

    bySlug[slug] = summary;
    if (entryNumber != null && personType === 'interviewee') {
      const existing = byEntry[entryNumber];
      if (existing) {
        // Joint interviews have one "joint" page (slug includes
        // "-and-" or "-et-al") plus one page per participant for name
        // searchability. The joint page is the canonical entry-level
        // reference. Prefer the joint slug.
        const isJoint = (s) => s.includes('-and-') || s.includes('-et-al') || s.includes('joint-interview');
        const existingIsJoint = isJoint(existing.slug);
        const newIsJoint = isJoint(slug);
        if (newIsJoint && !existingIsJoint) {
          byEntry[entryNumber] = summary;
        } else if (!newIsJoint && existingIsJoint) {
          // Keep the existing joint slug.
        } else {
          // Both joint or both split. Keep first; warn.
          console.warn(
            `[build-people-index] duplicate entry_number ${entryNumber} both ${newIsJoint ? 'joint' : 'split'}: keeping ${existing.slug}, also saw ${slug}`,
          );
        }
      } else {
        byEntry[entryNumber] = summary;
      }
    }
  }

  const indexJson = {
    schema_version: 1,
    built_at: new Date().toISOString(),
    counts: {
      total: Object.keys(bySlug).length,
      interviewees: Object.values(bySlug).filter((s) => s.person_type === 'interviewee').length,
      external_figures: Object.values(bySlug).filter((s) => s.person_type === 'external_figure').length,
    },
    by_entry: byEntry,
    by_slug: bySlug,
  };

  await writeFile(INDEX_PATH, JSON.stringify(indexJson, null, 2) + '\n', 'utf8');
  console.log(`[build-people-index] wrote ${INDEX_PATH}`);
  console.log(`  total=${indexJson.counts.total}`);
  console.log(`  interviewees=${indexJson.counts.interviewees}`);
  console.log(`  external_figures=${indexJson.counts.external_figures}`);
}

main().catch((e) => {
  console.error('[build-people-index] fatal:', e?.stack || e?.message || e);
  process.exit(1);
});
