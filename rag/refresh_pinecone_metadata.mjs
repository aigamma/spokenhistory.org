// rag/refresh_pinecone_metadata.mjs
//
// Push current Pass 9 inferential-uncertainty tier + score values into the
// Pinecone vector metadata. No re-embedding, metadata-only via Pinecone's
// /update endpoint.
//
// Background: rag/ingest.mjs is content-hash idempotent. After Pass 9
// updated 22 entries' tiers in manifests on disk, re-running ingest.mjs
// would skip every chunk (hashes unchanged) and not propagate the new
// metadata. This script does the metadata-only push that ingest.mjs
// won't.
//
// Cost: 0 Voyage spend. Pinecone Builder serverless writes are within
// quota. Wall-clock: ~5-10 min for 15K vectors at the per-vector update rate.
//
// Usage:
//   node --env-file=rag/.env.local rag/refresh_pinecone_metadata.mjs
//   node --env-file=rag/.env.local rag/refresh_pinecone_metadata.mjs --dry-run

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PINECONE_HOST,
  PINECONE_API_KEY,
  pineconeHeaders,
} from './shared.mjs';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const CORRECTED_DIR = join(REPO_ROOT, 'transcripts', 'corrected');
const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Load Pass 9 tier + score per entry from manifests
// ---------------------------------------------------------------------------

async function loadEntryTiers() {
  const dirs = await readdir(CORRECTED_DIR);
  const tiers = new Map(); // entryNumber -> { tier, score }
  for (const d of dirs) {
    try {
      const mfPath = join(CORRECTED_DIR, d, 'manifest.json');
      const raw = await readFile(mfPath, 'utf-8');
      const m = JSON.parse(raw);
      const num = m.entry_number;
      if (num == null) continue;
      const iu = m.inferential_uncertainty || {};
      tiers.set(num, {
        tier: iu.confidence_tier || null,
        score: typeof iu.score === 'number' ? iu.score : null,
      });
    } catch {
      // skip
    }
  }
  return tiers;
}

// ---------------------------------------------------------------------------
// Walk all Pinecone vector IDs (paginated)
// ---------------------------------------------------------------------------

async function listAllVectorIds(namespace = '') {
  if (!PINECONE_API_KEY || !PINECONE_HOST) {
    throw new Error('PINECONE_API_KEY and PINECONE_HOST must be set');
  }
  const ids = [];
  let paginationToken = null;
  let pages = 0;
  do {
    const url = new URL(`${PINECONE_HOST}/vectors/list`);
    if (namespace) url.searchParams.set('namespace', namespace);
    url.searchParams.set('limit', '100');
    if (paginationToken) url.searchParams.set('paginationToken', paginationToken);
    const res = await fetch(url, { headers: pineconeHeaders() });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`pinecone_list_failed status=${res.status} body=${text.slice(0, 300)}`);
    }
    const data = await res.json();
    const vectorList = data?.vectors || [];
    for (const v of vectorList) {
      if (v.id) ids.push(v.id);
    }
    paginationToken = data?.pagination?.next || null;
    pages += 1;
    if (pages % 20 === 0) {
      console.log(`  [list] page ${pages} → ${ids.length} IDs so far`);
    }
  } while (paginationToken);
  return ids;
}

// ---------------------------------------------------------------------------
// Parse entry_number out of vector ID
// ID format: <chunk_type>::entry-<NN>::<source>::<index>::<hash>
// Ground truth fact IDs: ground_truth_fact::entry-null::civil_rights_facts/<name>::...
// ---------------------------------------------------------------------------

function entryNumberFromId(id) {
  const m = id.match(/::entry-(\d+|null)::/);
  if (!m) return null;
  if (m[1] === 'null') return null;
  return parseInt(m[1], 10);
}

// ---------------------------------------------------------------------------
// Push metadata update for one vector
// ---------------------------------------------------------------------------

async function updateMetadata(id, setMetadata, namespace = '') {
  const body = { id, setMetadata };
  if (namespace) body.namespace = namespace;
  const res = await fetch(`${PINECONE_HOST}/vectors/update`, {
    method: 'POST',
    headers: pineconeHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`pinecone_update_failed status=${res.status} body=${text.slice(0, 300)}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`[refresh] host=${PINECONE_HOST}`);
  console.log(`[refresh] dry-run=${DRY_RUN}`);

  console.log('\n[refresh] Loading Pass 9 manifests...');
  const tiers = await loadEntryTiers();
  console.log(`[refresh] Loaded ${tiers.size} entries`);

  console.log('\n[refresh] Listing all Pinecone vector IDs...');
  const ids = await listAllVectorIds();
  console.log(`[refresh] Found ${ids.length} vectors in index`);

  // Group by entry_number, count unmappable
  const byEntry = new Map();
  let unmappable = 0;
  for (const id of ids) {
    const n = entryNumberFromId(id);
    if (n == null) {
      unmappable += 1;
      continue;
    }
    if (!byEntry.has(n)) byEntry.set(n, []);
    byEntry.get(n).push(id);
  }
  console.log(`[refresh] Grouped: ${byEntry.size} entries cover ${ids.length - unmappable} vectors; ${unmappable} unmappable (likely ground-truth)`);

  // Show plan
  console.log('\n[refresh] Update plan by entry:');
  let totalToUpdate = 0;
  for (const [entryNum, entryIds] of [...byEntry.entries()].sort((a, b) => a[0] - b[0])) {
    const t = tiers.get(entryNum);
    if (!t) {
      console.log(`  #${entryNum}: ${entryIds.length} vectors, NO MANIFEST FOUND, skipping`);
      continue;
    }
    totalToUpdate += entryIds.length;
  }
  console.log(`[refresh] Will update ${totalToUpdate} vectors across ${byEntry.size} entries`);

  if (DRY_RUN) {
    console.log('\n[refresh] DRY RUN, no Pinecone writes performed');
    return;
  }

  // Execute updates
  console.log('\n[refresh] Pushing metadata updates...');
  let done = 0;
  let errs = 0;
  const startedAt = Date.now();
  for (const [entryNum, entryIds] of byEntry.entries()) {
    const t = tiers.get(entryNum);
    if (!t) continue;
    const setMetadata = {};
    if (t.tier) setMetadata.inferential_uncertainty_tier = t.tier;
    if (t.score != null) setMetadata.inferential_uncertainty_score = t.score;
    if (Object.keys(setMetadata).length === 0) continue;

    // Run updates for this entry's vectors sequentially (Pinecone rate-limit friendly)
    for (const id of entryIds) {
      try {
        await updateMetadata(id, setMetadata);
        done += 1;
      } catch (e) {
        errs += 1;
        if (errs < 10) console.error(`  ERR ${id}: ${e.message}`);
      }
      if (done % 500 === 0) {
        const elapsed = (Date.now() - startedAt) / 1000;
        const rate = done / elapsed;
        const remaining = (totalToUpdate - done) / rate;
        console.log(`  [progress] ${done}/${totalToUpdate} done (${errs} errors, ${rate.toFixed(1)}/s, ~${Math.round(remaining)}s remaining)`);
      }
    }
  }

  const elapsed = (Date.now() - startedAt) / 1000;
  console.log(`\n[refresh] Done, ${done} updates in ${elapsed.toFixed(1)}s, ${errs} errors`);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
