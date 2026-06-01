/**
 * verify_image_urls.mjs, offline guard for Wikimedia image-URL correctness on
 * the person-page catalog.
 *
 * Background: Wikimedia serves an original file at
 *   https://upload.wikimedia.org/wikipedia/commons/<a>/<ab>/<Filename>
 * where <a>/<ab> is the first hex digit and first two hex digits of the MD5 of
 * the (URL-decoded, underscore-form) filename. The prefix is NOT free text: a
 * wrong prefix is a guaranteed 404 even when the file exists. An early
 * enrichment pass wrote person-page src_external URLs with fabricated prefixes,
 * silently breaking 51 images across 27 pages while the pages themselves looked
 * fine (the catalog never fetches the image at build time). This script
 * recomputes the canonical prefix for every commons (non-thumb) image URL in
 * public/rag/people/*.json (photo.src_external + gallery[].src_external) and the
 * photo_src mirror in index.json, and fails if any stored prefix disagrees.
 *
 * Deterministic and offline (no network): the prefix is a pure function of the
 * filename, so this is safe to run in CI and does not touch loc.gov or
 * Wikimedia. It does NOT assert the file exists on Commons (that needs the
 * Commons API); existence was confirmed once at fix time. Run after adding or
 * editing any person page that carries Wikimedia imagery.
 *
 * Usage: node scripts/verify_image_urls.mjs
 * Exit 0 = all prefixes correct; exit 1 = at least one wrong (listed).
 */

import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PEOPLE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'rag', 'people');
const COMMONS_RE =
  /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/(.+)$/;

// The canonical <a>/<ab> prefix for a commons original URL, or null if the URL
// is not a plain commons original (e.g. a /thumb/ URL, or a non-Wikimedia
// host). Thumb URLs use the same hash but a different path layout, so they are
// out of scope here and left untouched.
function correctPrefix(url) {
  if (!url || url.includes('/commons/thumb/')) return null;
  const m = COMMONS_RE.exec(url);
  if (!m) return null;
  const filename = decodeURIComponent(m[3]);
  const md5 = createHash('md5').update(filename, 'utf8').digest('hex');
  const expected = `${md5[0]}/${md5.slice(0, 2)}`;
  const actual = `${m[1]}/${m[2]}`;
  return { ok: expected === actual, expected, actual, filename };
}

const problems = [];
let checked = 0;

const files = readdirSync(PEOPLE_DIR).filter((f) => f.endsWith('.json'));
for (const f of files) {
  const json = JSON.parse(readFileSync(join(PEOPLE_DIR, f), 'utf8'));
  if (f === 'index.json') {
    for (const [slug, p] of Object.entries(json.by_slug || {})) {
      const r = correctPrefix(p?.photo_src);
      if (r) {
        checked++;
        if (!r.ok) problems.push(`index.json by_slug.${slug}.photo_src: ${r.actual} should be ${r.expected} (${r.filename})`);
      }
    }
    continue;
  }
  const urls = [];
  if (json.photo?.src_external) urls.push(['photo', json.photo.src_external]);
  (json.gallery || []).forEach((g, i) => {
    if (g?.src_external) urls.push([`gallery[${i}]`, g.src_external]);
  });
  for (const [loc, u] of urls) {
    const r = correctPrefix(u);
    if (r) {
      checked++;
      if (!r.ok) problems.push(`${f} ${loc}: ${r.actual} should be ${r.expected} (${r.filename})`);
    }
  }
}

console.log(`[verify-image-urls] checked ${checked} Wikimedia commons URLs across ${files.length} files`);
if (problems.length) {
  console.error(`[verify-image-urls] ${problems.length} WRONG prefix(es):`);
  for (const p of problems) console.error('  ' + p);
  console.error('\nFix: the prefix must be md5(filename)[0]/md5(filename)[0:2]. Recompute, do not guess.');
  process.exit(1);
}
console.log('[verify-image-urls] all prefixes correct.');
