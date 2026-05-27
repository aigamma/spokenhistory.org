#!/usr/bin/env node
// rag/precompute.mjs
//
// Precompute connection artifacts from the populated Pinecone civil-rights
// index. Emits static JSON files under public/rag/ that the React app
// (and any other downstream consumer, including worldthought.com's
// equivalent layer) loads at build time with zero runtime cost.
//
// Three features today:
//
//   1. RELATED , for each chunk, the top-5 most similar passages from
//                 OTHER entries. Powers the "related passages" panel on
//                 every transcript page. Output:
//                 public/rag/related/<entry-N>.json
//
//   2. CENTROIDS, per-entry mean embedding (averaged across a sampled
//                  subset of the entry's chunks). The substrate for the
//                  graph + constellation features below. Output:
//                  public/rag/centroids.json
//
//   3. CONSTELLATION, 2D PCA projection of the entry centroids so the
//                      corpus can be laid out spatially. Powers the
//                      scatter / "embedding-space map" visualization
//                      that makes the conference's "philosophy of
//                      embedding" claim concretely visible.
//                      Output: public/rag/constellation.json
//
// Pipeline order is RELATED → CENTROIDS → CONSTELLATION because
// constellation reads centroids.json. Run individual features via
// --feature, or all of them with no flag.
//
// Usage:
//   node --env-file=rag/.env.local rag/precompute.mjs
//   node --env-file=rag/.env.local rag/precompute.mjs --feature related
//   node --env-file=rag/.env.local rag/precompute.mjs --feature constellation
//   node --env-file=rag/.env.local rag/precompute.mjs --entries 1,5,73 --feature related
//   node --env-file=rag/.env.local rag/precompute.mjs --centroid-sample 30
//   node --env-file=rag/.env.local rag/precompute.mjs --dry-run
//   node --env-file=rag/.env.local rag/precompute.mjs --resume      # skip entries with existing JSON
//
// Portability: the same script runs against the worldthought.com index
// by pointing PINECONE_HOST / PINECONE_INDEX at that project's index.
// The two corpora share the same metadata shape (entry_number,
// entry_subject, text, source_path, timestamps where applicable), so
// downstream UI components consuming the JSON treat them identically.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import {
  REPO_ROOT,
  PINECONE_API_KEY,
  PINECONE_HOST,
  PINECONE_INDEX,
  VOYAGE_API_KEY,
  pineconeHeaders,
} from './shared.mjs';

// ---------------------------------------------------------------------------
// Output paths
// ---------------------------------------------------------------------------

const OUT_ROOT = join(REPO_ROOT, 'public', 'rag');
const OUT_RELATED_DIR = join(OUT_ROOT, 'related');
const OUT_CENTROIDS = join(OUT_ROOT, 'centroids.json');
const OUT_CONSTELLATION = join(OUT_ROOT, 'constellation.json');

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    feature: null,
    entries: null,
    centroidSample: 30,
    relatedTopK: 30, // Pinecone topK when finding related; we keep top-5 per chunk after filter
    dryRun: false,
    resume: false,
    namespace: '',
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--feature' && argv[i + 1]) { args.feature = argv[i + 1]; i++; }
    else if (a === '--entries' && argv[i + 1]) {
      args.entries = parseEntryRange(argv[i + 1]); i++;
    }
    else if (a === '--centroid-sample' && argv[i + 1]) { args.centroidSample = Number(argv[i + 1]); i++; }
    else if (a === '--related-topk' && argv[i + 1]) { args.relatedTopK = Number(argv[i + 1]); i++; }
    else if (a === '--namespace' && argv[i + 1]) { args.namespace = argv[i + 1]; i++; }
    else if (a === '--dry-run') { args.dryRun = true; }
    else if (a === '--resume') { args.resume = true; }
  }
  return args;
}

function parseEntryRange(spec) {
  const result = new Set();
  for (const part of spec.split(',')) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map((s) => Number(s.trim()));
      if (Number.isFinite(a) && Number.isFinite(b)) {
        for (let n = a; n <= b; n++) result.add(n);
      }
    } else {
      const n = Number(part.trim());
      if (Number.isFinite(n)) result.add(n);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Pinecone helpers (mirrors rag/retrieve.mjs and rag/ingest.mjs)
// ---------------------------------------------------------------------------

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

async function pineconeFetchById(ids, namespace = '') {
  if (ids.length === 0) return {};
  // Pinecone's /vectors/fetch is a GET with `ids` as repeated query
  // parameters. Our IDs are ~200 chars (the deterministic
  // chunk_type::entry-N::source-safe::idx::hash format), so 100 IDs
  // per call exceeds typical HTTP URL length limits (~8KB) and returns
  // 414 from the Pinecone proxy. 10 per call keeps URLs under ~2.5KB.
  const out = {};
  for (let i = 0; i < ids.length; i += 10) {
    const batch = ids.slice(i, i + 10);
    const params = new URLSearchParams({ namespace });
    for (const id of batch) params.append('ids', id);
    const res = await fetch(`${PINECONE_HOST}/vectors/fetch?${params}`, {
      method: 'GET',
      headers: pineconeHeaders(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`pinecone_fetch_failed status=${res.status} body=${text.slice(0, 300)}`);
    }
    const data = await res.json();
    Object.assign(out, data?.vectors || {});
  }
  return out;
}

// Bounded-concurrency mapper. Spawns up to `concurrency` workers that
// pull items off the input array sequentially. Used to fan out
// Pinecone /query calls during precomputeRelated without hitting
// the Builder-tier QPS ceiling. Concurrency=20 stays well under
// Pinecone's published ~100 QPS limit.
async function pMap(items, fn, concurrency = 20) {
  const results = new Array(items.length);
  let cursor = 0;
  const worker = async () => {
    // Each worker pulls items off the shared cursor until the list
    // is exhausted. The for-loop pattern can't model "next available"
    // across workers; a plain loop with a guarded break is the
    // idiomatic shape for a worker pool.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx], idx);
    }
  };
  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

// Issue an id-based query against Pinecone. Returns the topK matches
// from any entry OTHER than excludeEntry (when provided), with metadata.
async function pineconeQueryById(id, { topK = 30, filter = null, namespace = '' } = {}) {
  const body = { id, topK, includeMetadata: true, namespace };
  if (filter) body.filter = filter;
  const res = await fetch(`${PINECONE_HOST}/query`, {
    method: 'POST',
    headers: pineconeHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`pinecone_query_failed status=${res.status} body=${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return data?.matches || [];
}

// ---------------------------------------------------------------------------
// Group all vector IDs by entry_number
// ---------------------------------------------------------------------------

// Returns: Map<entry_number, { entry_subject, ids: string[] }>
//
// Cheap because /vectors/list only returns IDs; we then fetch the
// metadata for one chunk per entry to get the entry_subject. (For
// memory + bandwidth, we DON'T fetch values here, those come later
// only for the chunks we actually need to centroid.)
async function listEntriesIndex(namespace = '') {
  console.log('[precompute] listing all vector IDs...');
  const ids = await pineconeListAllIds(namespace);
  console.log(`[precompute] ${ids.length} vector IDs total`);

  // ID format from rag/ingest.mjs:
  //   transcript_segment::entry-<N>::<source-safe>::<chunk-index>::<hash>
  //   ground_truth_fact::global::civil_rights_facts/<name>::<i>::<hash>
  // Parse entry_number from "entry-N" segment.
  const byEntry = new Map();
  let groundTruthCount = 0;
  for (const id of ids) {
    const parts = id.split('::');
    if (parts.length < 5) continue;
    if (parts[0] !== 'transcript_segment') {
      if (parts[0] === 'ground_truth_fact') groundTruthCount++;
      continue;
    }
    const entryTag = parts[1];
    const m = entryTag.match(/^entry-(\d+)$/);
    if (!m) continue;
    const n = Number(m[1]);
    if (!byEntry.has(n)) byEntry.set(n, { entry_subject: null, ids: [] });
    byEntry.get(n).ids.push(id);
  }
  console.log(`[precompute] grouped into ${byEntry.size} entries (skipped ${groundTruthCount} ground_truth_fact vectors)`);

  // Fetch one chunk per entry to populate entry_subject.
  const probeIds = [];
  for (const rec of byEntry.values()) probeIds.push(rec.ids[0]);
  const fetched = await pineconeFetchById(probeIds, namespace);
  for (const [n, rec] of byEntry) {
    const probe = fetched[rec.ids[0]];
    rec.entry_subject = probe?.metadata?.entry_subject || `Entry ${n}`;
  }
  return byEntry;
}

// ---------------------------------------------------------------------------
// Feature: RELATED
// ---------------------------------------------------------------------------

// For each chunk in each entry, query Pinecone with the chunk's vector
// (by id, no re-embed), filter out the same entry, and keep the top-5.
// Aggregate per-chunk results into a single JSON per entry.
async function precomputeRelated({ byEntry, entriesFilter, relatedTopK, namespace, dryRun, resume }) {
  await mkdir(OUT_RELATED_DIR, { recursive: true });
  const { access } = await import('node:fs/promises');
  const totalEntries = entriesFilter
    ? [...byEntry.keys()].filter((n) => entriesFilter.has(n)).length
    : byEntry.size;
  let processed = 0;
  let skipped = 0;
  for (const [n, rec] of byEntry) {
    if (entriesFilter && !entriesFilter.has(n)) continue;
    processed++;
    // Resume support: skip entries whose output JSON already exists.
    // Pairs naturally with the per-entry write-on-completion pattern:
    // each entry's file lands atomically when its loop iteration ends,
    // so 'file exists' implies 'this entry was fully processed by some
    // earlier (possibly killed) run.' Use --resume to skip them; omit
    // to regenerate from scratch.
    if (resume) {
      const outPath = join(OUT_RELATED_DIR, `entry-${n}.json`);
      try {
        await access(outPath);
        skipped++;
        if (skipped <= 3 || skipped % 20 === 0) {
          console.log(`[related] ${processed}/${totalEntries} entry #${n} ${rec.entry_subject}: existing file, skipping (resume)`);
        }
        continue;
      } catch { /* file missing; process normally */ }
    }
    const out = {
      entry_number: n,
      entry_subject: rec.entry_subject,
      chunk_count: rec.ids.length,
      per_chunk: {},
      related_entry_summary: {}, // entry_number -> { entry_subject, count, top_score }
    };
    // Fan out per-chunk queries with bounded concurrency. Single-
    // threaded would take ~chunks_per_entry × 0.5s per entry; with
    // concurrency=20 each entry's queries complete in roughly
    // ceil(chunks/20) × 0.5s.
    const perChunkResults = await pMap(
      rec.ids,
      async (chunkId) => {
        const matches = await pineconeQueryById(chunkId, {
          topK: relatedTopK,
          filter: { entry_number: { $ne: n } },
          namespace,
        });
        const chunkIdx = Number(chunkId.split('::')[3]);
        return { chunkIdx, matches };
      },
      20,
    );
    for (const { chunkIdx, matches } of perChunkResults) {
      const top5 = matches.slice(0, 5).map((m) => {
        const meta = m.metadata || {};
        return {
          id: m.id,
          score: m.score,
          entry_number: meta.entry_number ?? null,
          entry_subject: meta.entry_subject ?? null,
          text_preview: typeof meta.text === 'string'
            ? (meta.text.length > 220 ? meta.text.slice(0, 220) + '…' : meta.text)
            : '',
          timestamp_start_seconds: meta.timestamp_start_seconds ?? null,
          timestamp_end_seconds: meta.timestamp_end_seconds ?? null,
          loc_item_url: meta.loc_item_url ?? null,
          entry_provenance: meta.entry_provenance ?? null,
        };
      });
      out.per_chunk[String(chunkIdx)] = top5;
      for (const m of matches) {
        const en = m.metadata?.entry_number;
        if (en == null || en === n) continue;
        if (!out.related_entry_summary[en]) {
          out.related_entry_summary[en] = {
            entry_subject: m.metadata?.entry_subject || `Entry ${en}`,
            count: 0,
            top_score: 0,
          };
        }
        out.related_entry_summary[en].count += 1;
        out.related_entry_summary[en].top_score = Math.max(
          out.related_entry_summary[en].top_score,
          m.score || 0,
        );
      }
    }
    // Sort summary entries by count desc, take top 16.
    // Bumped from 8 → 16 on 2026-05-27: the Semantic Overlap surface
    // showed 6-8 voices and felt like a carousel; users want enough
    // related entries to actually browse. The radial network in the
    // UI still renders the top 8 (visually cleaner); the list view
    // below it shows all 16.
    out.related_entry_summary = Object.entries(out.related_entry_summary)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 16)
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

    const outPath = join(OUT_RELATED_DIR, `entry-${n}.json`);
    if (dryRun) {
      console.log(`[related] would write ${outPath} (${rec.ids.length} chunks)`);
    } else {
      await writeFile(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
    }
    console.log(`[related] ${processed}/${totalEntries} entry #${n} ${rec.entry_subject} (${rec.ids.length} chunks)`);
  }
}

// ---------------------------------------------------------------------------
// Feature: CENTROIDS
// ---------------------------------------------------------------------------

// Per-entry mean embedding. Samples up to `centroidSample` chunks per
// entry (default 30) and averages their vectors. This is a noisy
// centroid but adequate for the 2D projection, sampling keeps the
// total bandwidth manageable (~136 × 30 × 4KB = ~16MB pulled total).
async function precomputeCentroids({ byEntry, centroidSample, namespace, dryRun }) {
  const centroids = []; // { entry_number, entry_subject, vector, chunk_count_used }
  let processed = 0;
  for (const [n, rec] of byEntry) {
    processed++;
    // Random sample without replacement
    const sample = rec.ids.length <= centroidSample
      ? rec.ids
      : sampleWithoutReplacement(rec.ids, centroidSample);
    const vectors = await pineconeFetchById(sample, namespace);
    const vecList = Object.values(vectors)
      .map((v) => v?.values)
      .filter((v) => Array.isArray(v) && v.length > 0);
    if (vecList.length === 0) {
      console.warn(`[centroids] entry #${n}: no vectors with values returned; skipping`);
      continue;
    }
    // Pull the audit-fidelity fields from any of the fetched chunks
    // (they're per-entry, so any chunk works). The Constellation component
    // and other downstream UIs color-code points by these fields.
    const firstMeta = Object.values(vectors).find((v) => v?.metadata)?.metadata || {};
    const dim = vecList[0].length;
    const sum = new Array(dim).fill(0);
    for (const v of vecList) {
      for (let i = 0; i < dim; i++) sum[i] += v[i];
    }
    const centroid = sum.map((x) => x / vecList.length);
    // Normalize to unit length so cosine similarity reduces to dot product
    let mag = 0;
    for (const x of centroid) mag += x * x;
    mag = Math.sqrt(mag) || 1;
    for (let i = 0; i < dim; i++) centroid[i] /= mag;
    centroids.push({
      entry_number: n,
      entry_subject: rec.entry_subject,
      chunk_count: rec.ids.length,
      sampled_chunks: vecList.length,
      vector: centroid,
      // Surface audit-fidelity fields so downstream UIs can color-code:
      entry_provenance: firstMeta.entry_provenance || null,
      uncertainty_tier: firstMeta.inferential_uncertainty_tier || null,
      uncertainty_score: Number.isFinite(firstMeta.inferential_uncertainty_score)
        ? firstMeta.inferential_uncertainty_score
        : null,
      loc_item_url: firstMeta.loc_item_url || null,
    });
    console.log(`[centroids] ${processed}/${byEntry.size} entry #${n} ${rec.entry_subject} (sampled ${vecList.length}/${rec.ids.length})`);
  }
  if (dryRun) {
    console.log(`[centroids] would write ${OUT_CENTROIDS} (${centroids.length} centroids)`);
  } else {
    await mkdir(dirname(OUT_CENTROIDS), { recursive: true });
    await writeFile(OUT_CENTROIDS, JSON.stringify(centroids, null, 2) + '\n', 'utf8');
    console.log(`[centroids] wrote ${centroids.length} entries to ${OUT_CENTROIDS}`);
  }
  return centroids;
}

function sampleWithoutReplacement(arr, k) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, k);
}

// ---------------------------------------------------------------------------
// Feature: CONSTELLATION
// ---------------------------------------------------------------------------
//
// 2D projection of the entry centroids via power-iteration PCA on the
// covariance matrix of the centered centroids. Power iteration is the
// simplest dependency-free way to get the top-2 eigenvectors of a
// 1024-dim covariance matrix; for N=136 centroids and d=1024, the
// algorithm finishes in well under a second.
//
// Each centroid is projected onto the top-2 principal axes and its
// (x, y) coordinates are written alongside its metadata for the UI to
// render as a scatter plot.

function center(vectors) {
  const dim = vectors[0].length;
  const mean = new Array(dim).fill(0);
  for (const v of vectors) for (let i = 0; i < dim; i++) mean[i] += v[i];
  for (let i = 0; i < dim; i++) mean[i] /= vectors.length;
  return { centered: vectors.map((v) => v.map((x, i) => x - mean[i])), mean };
}

function dot(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
function norm(v) { return Math.sqrt(dot(v, v)); }
// scale() and sub() were drafted for a vector-arithmetic toolkit but
// the actual PCA implementation inlines its arithmetic for performance.
// Kept exported in case a future deflate/projection helper needs them.
// eslint-disable-next-line no-unused-vars
function scale(v, k) { return v.map((x) => x * k); }
// eslint-disable-next-line no-unused-vars
function sub(a, b) { return a.map((x, i) => x - b[i]); }

// Multiply X^T (X v) where X is the data matrix (rows = samples). This
// is the action of the (sample-size-scaled) covariance matrix on v
// without ever materializing the d×d covariance explicitly.
function covApply(X, v) {
  // Xv ∈ ℝ^N, then X^T (Xv) ∈ ℝ^d
  const N = X.length;
  const Xv = new Array(N);
  for (let i = 0; i < N; i++) Xv[i] = dot(X[i], v);
  const dim = v.length;
  const result = new Array(dim).fill(0);
  for (let i = 0; i < N; i++) {
    const row = X[i];
    const coef = Xv[i];
    for (let j = 0; j < dim; j++) result[j] += row[j] * coef;
  }
  return result;
}

function powerIteration(X, maxIters = 200, tol = 1e-7) {
  const dim = X[0].length;
  let v = new Array(dim);
  for (let i = 0; i < dim; i++) v[i] = Math.random() - 0.5;
  let n = norm(v); for (let i = 0; i < dim; i++) v[i] /= n;
  let prev = null;
  for (let iter = 0; iter < maxIters; iter++) {
    const w = covApply(X, v);
    const wn = norm(w);
    for (let i = 0; i < dim; i++) w[i] /= wn || 1;
    if (prev !== null) {
      // 1 - |dot(w, prev)| converges to 0 when v is an eigenvector
      const diff = 1 - Math.abs(dot(w, prev));
      if (diff < tol) { v = w; break; }
    }
    prev = w;
    v = w;
  }
  return v;
}

// Project X onto axis u, then subtract the projection to get the
// deflated X for the next eigenvector.
function deflate(X, u) {
  return X.map((row) => {
    const c = dot(row, u);
    return row.map((x, i) => x - c * u[i]);
  });
}

async function precomputeConstellation({ centroids, dryRun }) {
  if (!centroids || centroids.length < 3) {
    console.warn('[constellation] need at least 3 centroids; got', centroids?.length);
    return;
  }
  const vectors = centroids.map((c) => c.vector);
  // center() returns { centered, mean }; we only use the centered data
  // for PCA. The mean is computed internally and could be exposed via a
  // separate accessor later if needed (e.g., to project a query vector
  // into the same PCA space).
  const { centered } = center(vectors);
  const u1 = powerIteration(centered);
  const deflated = deflate(centered, u1);
  const u2 = powerIteration(deflated);

  const points = centroids.map((c, i) => ({
    entry_number: c.entry_number,
    entry_subject: c.entry_subject,
    chunk_count: c.chunk_count,
    entry_provenance: c.entry_provenance || null,
    uncertainty_tier: c.uncertainty_tier || null,
    uncertainty_score: c.uncertainty_score ?? null,
    loc_item_url: c.loc_item_url || null,
    x: dot(centered[i], u1),
    y: dot(centered[i], u2),
  }));

  // Normalize to [-1, 1] for convenient UI rendering
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const xRange = (xMax - xMin) || 1;
  const yRange = (yMax - yMin) || 1;
  for (const p of points) {
    p.x = 2 * (p.x - xMin) / xRange - 1;
    p.y = 2 * (p.y - yMin) / yRange - 1;
  }

  const out = {
    method: 'pca-power-iteration',
    dim: vectors[0].length,
    sample_count: vectors.length,
    points,
    notes: 'x and y are normalized to [-1, 1]. The PCA is computed on entry-mean centroids (averaged across the per-entry chunk sample). It is a low-fidelity but dependency-free 2D layout; for production-grade visualization, consider replacing with UMAP via a Python preprocessor.',
  };
  if (dryRun) {
    console.log(`[constellation] would write ${OUT_CONSTELLATION} (${points.length} points)`);
  } else {
    await mkdir(dirname(OUT_CONSTELLATION), { recursive: true });
    await writeFile(OUT_CONSTELLATION, JSON.stringify(out, null, 2) + '\n', 'utf8');
    console.log(`[constellation] wrote ${points.length} points to ${OUT_CONSTELLATION}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!PINECONE_API_KEY) throw new Error('PINECONE_API_KEY is not set.');
  if (!PINECONE_HOST) throw new Error('PINECONE_HOST is not set.');
  // VOYAGE_API_KEY isn't strictly required here (we use id-based Pinecone
  // queries, no re-embedding), but we surface a warning if it's missing
  // since some future features will need it.
  if (!VOYAGE_API_KEY) console.warn('[precompute] VOYAGE_API_KEY not set (OK for current features)');

  const args = parseArgs(process.argv.slice(2));
  console.log(`[precompute] index=${PINECONE_INDEX} host=${PINECONE_HOST}`);
  if (args.feature) console.log(`[precompute] --feature ${args.feature}`);
  if (args.entries) console.log(`[precompute] --entries ${[...args.entries].sort((a, b) => a - b).join(',')}`);
  if (args.dryRun) console.log('[precompute] --dry-run (no files written)');

  const byEntry = await listEntriesIndex(args.namespace);
  if (byEntry.size === 0) {
    console.error('[precompute] no transcript_segment vectors found. Run rag/ingest.mjs first.');
    process.exit(1);
  }

  const run = (f) => !args.feature || args.feature === f;
  let centroids = null;

  if (run('related')) {
    await precomputeRelated({
      byEntry,
      entriesFilter: args.entries,
      relatedTopK: args.relatedTopK,
      namespace: args.namespace,
      dryRun: args.dryRun,
      resume: args.resume,
    });
  }
  if (run('centroids') || run('constellation')) {
    centroids = await precomputeCentroids({
      byEntry,
      centroidSample: args.centroidSample,
      namespace: args.namespace,
      dryRun: args.dryRun,
    });
  }
  if (run('constellation')) {
    await precomputeConstellation({ centroids, dryRun: args.dryRun });
  }

  console.log('[precompute] done');
}

main().catch((e) => {
  console.error('[precompute] fatal:', e?.stack || e?.message || e);
  process.exit(1);
});
