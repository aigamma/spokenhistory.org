#!/usr/bin/env node
// rag/dump_for_nomic.mjs
//
// STATUS (2026-05-27): The Nomic Atlas account was canceled after the
// initial projection was downloaded. This script still works against
// Pinecone (the Pinecone account is active), but the downstream
// upload_to_nomic.py will fail without an Atlas account. The output
// `public/rag/atlas_projection.json` is preserved permanently; see
// `rag/ATLAS_PROVENANCE.md` for the full story and replacement path
// (umap-learn) if re-projection is ever needed.
//
// One-shot dump of all 15K passage vectors + metadata from the
// civil-rights Pinecone index into an NDJSON file at the path
// passed as --out (defaults to public/rag/nomic_export.ndjson).
// The file is the input to rag/upload_to_nomic.py, which uploads
// to atlas.nomic.ai.
//
// Why a sidecar dump rather than direct upload from Node: Nomic's
// official client (atlas.nomic.ai) is a Python package; their JS
// client is less mature. The Node-side dump keeps a single source
// of truth (the Pinecone index) while still letting Eric run the
// Python upload one-time. The dump is idempotent, rerunning
// produces a stable file based on the current index state.
//
// Usage:
//   node --env-file=rag/.env.local rag/dump_for_nomic.mjs
//   node --env-file=rag/.env.local rag/dump_for_nomic.mjs --out tmp/nomic.ndjson
//   node --env-file=rag/.env.local rag/dump_for_nomic.mjs --limit 500    # subset for testing
//
// Output line shape:
//   {
//     "id": "chunk::entry-1::aaron-dixon::0042::...",
//     "embedding": [1024 floats],
//     "entry_number": 1,
//     "entry_subject": "Aaron Dixon",
//     "text": "And we started getting domestic violent calls...",
//     "timestamp_start_seconds": 412.3,
//     "timestamp_end_seconds": 438.7,
//     "uncertainty_tier": "low",
//     "loc_item_url": "https://www.loc.gov/item/2015669186/"
//   }
//
// Nomic accepts pandas dataframes / Arrow tables of this shape;
// rag/upload_to_nomic.py reads this NDJSON and converts.

import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

import {
  REPO_ROOT,
  PINECONE_HOST,
  pineconeHeaders,
} from './shared.mjs';

function parseArgs(argv) {
  const args = {
    // Default lives under tmp/ (gitignored, not deployed), the dump
    // file is ~220MB for the full corpus and must NOT land in public/
    // (Netlify would serve it, leaking the embedding matrix) or in git
    // (build-size + privacy concerns).
    out: join(REPO_ROOT, 'tmp', 'nomic_export.ndjson'),
    namespace: '',
    limit: null,
    concurrency: 16,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--out' && argv[i + 1]) { args.out = argv[i + 1]; i += 1; }
    else if (a === '--namespace' && argv[i + 1]) { args.namespace = argv[i + 1]; i += 1; }
    else if (a === '--limit' && argv[i + 1]) { args.limit = Number(argv[i + 1]); i += 1; }
    else if (a === '--concurrency' && argv[i + 1]) { args.concurrency = Number(argv[i + 1]); i += 1; }
  }
  return args;
}

async function pineconeListAllIds(namespace = '') {
  const ids = [];
  let paginationToken = null;
  do {
    const params = new URLSearchParams({ namespace, limit: '100' });
    if (paginationToken) params.set('paginationToken', paginationToken);
    const res = await fetch(`${PINECONE_HOST}/vectors/list?${params}`, {
      method: 'GET',
      headers: pineconeHeaders(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`pinecone_list_failed status=${res.status} body=${text.slice(0, 300)}`);
    }
    const data = await res.json();
    for (const v of data?.vectors || []) ids.push(v.id);
    paginationToken = data?.pagination?.next || null;
  } while (paginationToken);
  return ids;
}

async function pineconeFetchBatch(ids, namespace = '') {
  if (ids.length === 0) return {};
  const params = new URLSearchParams({ namespace });
  for (const id of ids) params.append('ids', id);
  const res = await fetch(`${PINECONE_HOST}/vectors/fetch?${params}`, {
    method: 'GET',
    headers: pineconeHeaders(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`pinecone_fetch_failed status=${res.status} body=${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return data?.vectors || {};
}

// Bounded-concurrency mapper. Each worker pulls a batch of `batchSize`
// IDs at a time and fetches them in one HTTP call.
async function fetchAllConcurrent(ids, namespace, concurrency = 16, batchSize = 10) {
  const batches = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    batches.push(ids.slice(i, i + batchSize));
  }
  const out = new Map();
  let cursor = 0;
  let done = 0;

  const worker = async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const idx = cursor++;
      if (idx >= batches.length) return;
      const batch = batches[idx];
      const result = await pineconeFetchBatch(batch, namespace);
      for (const [id, rec] of Object.entries(result)) {
        out.set(id, rec);
      }
      done += 1;
      if (done % 25 === 0 || done === batches.length) {
        const pct = ((done / batches.length) * 100).toFixed(1);
        process.stderr.write(`  fetched ${done}/${batches.length} batches (${pct}%)\n`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, batches.length) }, worker));
  return out;
}

function metadataForNomic(rec) {
  // Pinecone stores metadata as a flat key-value map. We surface the
  // fields Atlas will use for topic-label generation + filtering, and
  // omit deep junk (e.g. internal-only audit IDs). Empty strings are
  // dropped because Atlas treats missing-vs-empty inconsistently.
  const m = rec.metadata || {};
  const keep = {};
  for (const field of [
    'entry_number',
    'entry_subject',
    'text',
    'source_path',
    'chunk_index',
    'timestamp_start_seconds',
    'timestamp_end_seconds',
    'uncertainty_tier',
    'entry_provenance',
    'loc_item_url',
  ]) {
    const v = m[field];
    if (v == null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    keep[field] = v;
  }
  return keep;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  process.stderr.write(`Pinecone host: ${PINECONE_HOST}\n`);
  process.stderr.write(`Listing all vector IDs...\n`);
  let ids = await pineconeListAllIds(args.namespace);
  process.stderr.write(`  ${ids.length} total IDs\n`);
  if (args.limit && args.limit > 0 && args.limit < ids.length) {
    ids = ids.slice(0, args.limit);
    process.stderr.write(`  --limit applied: keeping first ${ids.length}\n`);
  }

  process.stderr.write(`Fetching vectors + metadata (concurrency ${args.concurrency})...\n`);
  const vectors = await fetchAllConcurrent(ids, args.namespace, args.concurrency, 10);
  process.stderr.write(`  fetched ${vectors.size} vectors\n`);

  if (!existsSync(dirname(args.out))) {
    mkdirSync(dirname(args.out), { recursive: true });
  }
  const stream = createWriteStream(args.out);
  let written = 0;
  let skippedNoValues = 0;
  for (const [id, rec] of vectors) {
    const embedding = rec.values;
    if (!Array.isArray(embedding) || embedding.length === 0) {
      skippedNoValues += 1;
      continue;
    }
    const row = {
      id,
      embedding,
      ...metadataForNomic(rec),
    };
    stream.write(JSON.stringify(row));
    stream.write('\n');
    written += 1;
  }
  await new Promise((resolve, reject) => {
    stream.end((err) => (err ? reject(err) : resolve()));
  });

  process.stderr.write(`\n✓ Wrote ${written} rows to ${args.out}\n`);
  if (skippedNoValues > 0) {
    process.stderr.write(`  (skipped ${skippedNoValues} records with no embedding values)\n`);
  }
  process.stderr.write(`\nNext step: run rag/upload_to_nomic.py to push to atlas.nomic.ai\n`);
}

main().catch((err) => {
  console.error('dump_for_nomic failed:', err);
  process.exit(1);
});
