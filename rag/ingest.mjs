#!/usr/bin/env node
// rag/ingest.mjs
//
// RAG ingestion walker for the Civil Rights History Project corpus.
//
// Walks transcripts/corrected/<dir>/<file> (the output of
// scripts/apply_corrections.py — never raw/ directly), chunks each
// transcript file via rag/chunker.mjs (time-aware for .srt/.vtt,
// paragraph-aware for .txt), embeds via Voyage AI (voyage-3, 1024-dim
// document mode), and upserts vectors to Pinecone with metadata tagging
// each chunk with: entry_number, entry_subject, chunk_type, source_path,
// chunk_index, content_hash, text, optional timestamps + speaker.
//
// Idempotent on content hash: chunks unchanged since the last ingest
// are detected via Pinecone's /vectors/list and skipped without a Voyage
// embed round-trip. Re-runs after a small set of corrections only embed
// the changed chunks.
//
// Usage (set env vars in .env.local first; see rag/.env.example):
//   node --env-file=.env.local rag/ingest.mjs
//   node --env-file=.env.local rag/ingest.mjs --entries 1,5,73-80
//   node --env-file=.env.local rag/ingest.mjs --include-ground-truth
//   node --env-file=.env.local rag/ingest.mjs --prune
//   node --env-file=.env.local rag/ingest.mjs --dry-run

import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { basename, extname, relative, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  REPO_ROOT,
  CORRECTED_TRANSCRIPTS_ROOT,
  GROUND_TRUTH_PATH,
  PINECONE_API_KEY,
  PINECONE_HOST,
  PINECONE_INDEX,
  VOYAGE_API_KEY,
  VOYAGE_MODEL,
  pineconeHeaders,
  walkDir,
  SKIPPED_ENTRIES,
} from './shared.mjs';
import { chunkSource } from './chunker.mjs';
import { embedTexts } from './embed.mjs';

// Matched to the embed-batch ceiling (Voyage caps at 128 inputs per
// call). Pinecone serverless accepts up to 1000 vectors per upsert,
// so this isn't a Pinecone limit — it's keeping the round-trip pair
// (embed + upsert) at the same size so neither side dominates.
const UPSERT_BATCH = 128;

// ---------------------------------------------------------------------------
// Idempotency: deterministic IDs + content hashing
// ---------------------------------------------------------------------------

function hashContent(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

// Vector ID convention:
//   <chunk_type>::entry-<NN>::<source-safe>::<chunk-index>::<hash>
// e.g.,  "transcript_segment::entry-73::Kathleen_Cleaver__interview_2025...::42::a1b2c3d4..."
// Pinecone IDs must be ASCII and avoid certain delimiters; we sanitize
// the source path to underscores. The chunk index + content hash make
// the ID stable across re-ingests so unchanged chunks short-circuit.
function deterministicId(chunkType, entryNumber, sourceRel, chunkIndex, hash) {
  const safeSource = sourceRel.replace(/[^a-zA-Z0-9._-]/g, '_');
  const entryTag = entryNumber == null ? 'global' : `entry-${entryNumber}`;
  return `${chunkType}::${entryTag}::${safeSource}::${chunkIndex}::${hash}`;
}

// ---------------------------------------------------------------------------
// Source-directory -> entry-number mapping
// ---------------------------------------------------------------------------
//
// The audit overlay (CLEANED_TRANSCRIPTS_REVIEW.md) defines each entry
// with a `**Source**: \`transcripts/raw/<dir>/\`` line. The corrected
// transcripts mirror that directory structure under
// transcripts/corrected/<dir>/. We extract entry_number + entry_subject
// from the master overlay so every ingested chunk can be cleanly attributed.
//
// This is implemented as a lazy lookup the first time it's needed; the
// parsed map is cached in memory.

let _entryMapCache = null;

export async function loadEntryMap() {
  if (_entryMapCache) return _entryMapCache;

  // Pass 1: parse master MD's `### N. Subject` + `**Source**:` lines.
  // This is the canonical record for the original 127 audit-able entries
  // (which have full Pass 1-8 audit overlay data).
  const masterPath = `${REPO_ROOT}/transcripts/CLEANED_TRANSCRIPTS_REVIEW.md`;
  const content = await readFile(masterPath, 'utf8').catch(() => null);
  const byDir = new Map();
  const bySubject = new Map();
  if (content) {
    const entryRe = /^### (\d+)\.\s+([^\n]+)\n/gm;
    const sourceRe = /\*\*Source\*\*:\s*`transcripts\/raw\/([^`]+)\/?`/;
    // Materialize all heading matches up front. The earlier double-exec
    // pattern hit a global-regex pitfall: when the final entry's
    // "next match" lookup returned null, entryRe.lastIndex auto-reset
    // to 0 and the outer while-loop re-found match #1, looping forever.
    // matchAll is single-pass and resets cleanly at exhaustion.
    const allMatches = [...content.matchAll(entryRe)];
    for (let i = 0; i < allMatches.length; i++) {
      const m = allMatches[i];
      const number = Number(m[1]);
      const subject = m[2].replace(/\s*\(PARTIAL\)\s*$/, '').trim();
      const sectionStart = m.index;
      const sectionEnd = i + 1 < allMatches.length ? allMatches[i + 1].index : content.length;
      const sectionBody = content.slice(sectionStart, sectionEnd);
      const srcMatch = sectionBody.match(sourceRe);
      const sourceDir = srcMatch ? srcMatch[1].replace(/\/$/, '') : null;
      const record = { number, subject, sourceDir, provenance: 'audit-original' };
      if (sourceDir && !byDir.has(sourceDir)) byDir.set(sourceDir, record);
      if (!bySubject.has(subject)) bySubject.set(subject, record);
    }
  } else {
    console.warn('[ingest] master overlay not found; entry-number resolution from master MD unavailable');
  }

  // Pass 2: scan corrected/<dir>/manifest.json for two purposes:
  // (a) Add records for entries with NO master MD heading (the 9 Pass-8-only
  //     ingestion entries added 2026-05-25: 28/46/64 reactivated + 133-138).
  // (b) Enrich EXISTING records (audit-original entries already in byDir
  //     from Pass 1) with per-entry metadata that downstream retrieval
  //     needs: entry_provenance, inferential_uncertainty.score/tier, and
  //     loc_healing.loc_item_url. These flow into the Pinecone metadata so
  //     a query can filter by audit-vs-ingestion provenance and surface
  //     LoC citation URLs in the answer.
  let manifestAdded = 0;
  let manifestEnriched = 0;
  try {
    const { readdir, stat: fsStat } = await import('node:fs/promises');
    const { join: pathJoin } = await import('node:path');
    const sub = await readdir(CORRECTED_TRANSCRIPTS_ROOT);
    for (const dirName of sub) {
      const manifestPath = pathJoin(CORRECTED_TRANSCRIPTS_ROOT, dirName, 'manifest.json');
      try {
        const stat = await fsStat(manifestPath);
        if (!stat.isFile()) continue;
      } catch {
        continue;
      }
      let m;
      try {
        const text = await readFile(manifestPath, 'utf8');
        m = JSON.parse(text);
      } catch {
        continue;
      }
      const number = m.entry_number;
      const subject = m.entry_subject;
      if (number == null || !subject) continue;
      const provenance = m.entry_provenance || null;
      const iuScore = m.inferential_uncertainty?.score;
      const iuTier = m.inferential_uncertainty?.confidence_tier;
      const locUrl = m.loc_healing?.loc_item_url;
      if (byDir.has(dirName)) {
        // (b) Enrich an existing audit-original record.
        const rec = byDir.get(dirName);
        if (provenance) rec.provenance = provenance;
        if (Number.isFinite(iuScore)) rec.inferential_uncertainty_score = iuScore;
        if (typeof iuTier === 'string' && iuTier) rec.inferential_uncertainty_tier = iuTier;
        if (typeof locUrl === 'string' && locUrl) rec.loc_item_url = locUrl;
        manifestEnriched++;
        continue;
      }
      // (a) Add a brand-new manifest-only record.
      const record = {
        number,
        subject,
        sourceDir: dirName,
        provenance: provenance || 'unknown',
      };
      if (Number.isFinite(iuScore)) record.inferential_uncertainty_score = iuScore;
      if (typeof iuTier === 'string' && iuTier) record.inferential_uncertainty_tier = iuTier;
      if (typeof locUrl === 'string' && locUrl) record.loc_item_url = locUrl;
      byDir.set(dirName, record);
      if (!bySubject.has(subject)) bySubject.set(subject, record);
      manifestAdded++;
    }
  } catch (e) {
    console.warn(`[ingest] manifest-fallback scan failed: ${e.message}`);
  }

  // Drop phantom records: master-MD entries whose `**Source**:` pointer
  // references a corrected/ directory that doesn't exist on disk (typically
  // because the directory was renamed for curly-quote / Windows-MAX_PATH
  // reasons, or because the entry was originally Whisper-empty / SKIPPED).
  // Phantoms cause no harm to ingest (no walker hits them) but they inflate
  // the byDir count and the audit-original histogram. The real on-disk
  // directory still has its own Pass-2 record with correct metadata.
  let phantomDropped = 0;
  try {
    const { readdir } = await import('node:fs/promises');
    const onDiskDirs = new Set(
      (await readdir(CORRECTED_TRANSCRIPTS_ROOT, { withFileTypes: true }))
        .filter((e) => e.isDirectory())
        .map((e) => e.name),
    );
    for (const dir of [...byDir.keys()]) {
      if (!onDiskDirs.has(dir)) {
        byDir.delete(dir);
        phantomDropped++;
      }
    }
  } catch (e) {
    console.warn(`[ingest] phantom-cleanup skipped: ${e.message}`);
  }

  _entryMapCache = { byDir, bySubject };
  console.log(
    `[ingest] entry map loaded: ${byDir.size} entries by source dir ` +
    `(master MD: ${byDir.size - manifestAdded}; manifest-only: ${manifestAdded}; ` +
    `enriched: ${manifestEnriched}; phantoms dropped: ${phantomDropped})`,
  );
  return _entryMapCache;
}

// ---------------------------------------------------------------------------
// Pinecone list / upsert / delete
// ---------------------------------------------------------------------------

async function listAllVectorIds(namespace = '') {
  if (!PINECONE_API_KEY || !PINECONE_HOST) return new Set();
  const ids = new Set();
  let paginationToken = null;
  do {
    const params = new URLSearchParams({ namespace, limit: '100' });
    if (paginationToken) params.set('paginationToken', paginationToken);
    const res = await fetch(`${PINECONE_HOST}/vectors/list?${params}`, {
      method: 'GET',
      headers: pineconeHeaders(),
    });
    if (!res.ok) {
      console.warn(`[ingest] pinecone_list status=${res.status} namespace='${namespace}'`);
      return ids;
    }
    const data = await res.json();
    for (const v of data?.vectors || []) ids.add(v.id);
    paginationToken = data?.pagination?.next || null;
  } while (paginationToken);
  return ids;
}

async function upsertVectors(vectors, namespace = '') {
  if (vectors.length === 0) return;
  const res = await fetch(`${PINECONE_HOST}/vectors/upsert`, {
    method: 'POST',
    headers: pineconeHeaders(),
    body: JSON.stringify({ namespace, vectors }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`pinecone_upsert_failed status=${res.status} body=${text.slice(0, 500)}`);
  }
}

async function deleteVectorIds(ids, namespace = '') {
  if (ids.length === 0) return;
  for (let i = 0; i < ids.length; i += 1000) {
    const batch = ids.slice(i, i + 1000);
    const res = await fetch(`${PINECONE_HOST}/vectors/delete`, {
      method: 'POST',
      headers: pineconeHeaders(),
      body: JSON.stringify({ namespace, ids: batch }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`pinecone_delete_failed status=${res.status} body=${text.slice(0, 500)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Transcript ingest
// ---------------------------------------------------------------------------

export async function buildTranscriptVectors(sourcePath, entryMap) {
  const sourceRel = relative(REPO_ROOT, sourcePath).replace(/\\/g, '/');
  const dirRel = relative(CORRECTED_TRANSCRIPTS_ROOT, dirname(sourcePath)).replace(/\\/g, '/');
  const entry = entryMap.byDir.get(dirRel);
  if (!entry) {
    return { sourceRel, entryNumber: null, entrySubject: null, vectors: [] };
  }
  if (SKIPPED_ENTRIES.has(entry.number)) {
    return { sourceRel, entryNumber: entry.number, entrySubject: entry.subject, vectors: [] };
  }
  const ext = extname(sourcePath).toLowerCase();
  const content = await readFile(sourcePath, 'utf8');
  const chunks = chunkSource(content, ext);
  const vectors = [];
  for (let i = 0; i < chunks.length; i++) {
    const ch = chunks[i];
    const text = ch.text || '';
    if (!text.trim()) continue;
    const hash = hashContent(text);
    const id = deterministicId('transcript_segment', entry.number, sourceRel, i, hash);
    const metadata = {
      chunk_type: 'transcript_segment',
      entry_number: entry.number,
      entry_subject: entry.subject,
      source_path: sourceRel,
      source_ext: ext,
      chunk_index: i,
      content_hash: hash,
      text,
    };
    if (entry.provenance) metadata.entry_provenance = entry.provenance;
    if (entry.inferential_uncertainty_score != null) {
      metadata.inferential_uncertainty_score = entry.inferential_uncertainty_score;
    }
    if (entry.inferential_uncertainty_tier) {
      metadata.inferential_uncertainty_tier = entry.inferential_uncertainty_tier;
    }
    if (entry.loc_item_url) metadata.loc_item_url = entry.loc_item_url;
    if (ch.timestamp_start_seconds != null) {
      metadata.timestamp_start_seconds = ch.timestamp_start_seconds;
      metadata.timestamp_end_seconds = ch.timestamp_end_seconds;
      metadata.cue_count = ch.cue_count;
    }
    vectors.push({ id, metadata, text });
  }
  return { sourceRel, entryNumber: entry.number, entrySubject: entry.subject, vectors };
}

// ---------------------------------------------------------------------------
// Ground-truth corpus ingest
// ---------------------------------------------------------------------------
//
// Each entry in civil_rights_facts.json (140 canonical figures, 291 aliases
// as of 2026-05-22 Phase D) becomes one chunk. The full fact text + alias
// list is embedded as a single document; the canonical name is preserved
// in metadata for filter-by-name queries.

async function buildGroundTruthVectors() {
  let raw;
  try {
    raw = await readFile(GROUND_TRUTH_PATH, 'utf8');
  } catch (e) {
    console.warn(`[ingest] ground-truth corpus not found at ${GROUND_TRUTH_PATH}; skipping`);
    return [];
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.warn(`[ingest] ground-truth corpus malformed JSON: ${e.message}`);
    return [];
  }
  const entries = Array.isArray(data) ? data : Object.values(data);
  const vectors = [];
  for (let i = 0; i < entries.length; i++) {
    const fact = entries[i];
    const canonicalName = fact.canonical_name || fact.name || fact.subject || `fact_${i}`;
    const aliases = Array.isArray(fact.aliases) ? fact.aliases : [];
    const summary = fact.summary || fact.description || fact.bio || '';
    const text = [
      `Canonical name: ${canonicalName}`,
      aliases.length ? `Aliases: ${aliases.join(', ')}` : '',
      summary,
    ].filter(Boolean).join('\n\n');
    if (!text.trim()) continue;
    const hash = hashContent(text);
    const id = deterministicId('ground_truth_fact', null, `civil_rights_facts/${canonicalName}`, i, hash);
    vectors.push({
      id,
      metadata: {
        chunk_type: 'ground_truth_fact',
        canonical_name: canonicalName,
        aliases,
        source_path: 'Metadata Generation System/civil_rights_facts.json',
        chunk_index: i,
        content_hash: hash,
        text,
      },
      text,
    });
  }
  return vectors;
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    entries: null,
    includeGroundTruth: false,
    prune: false,
    forcePrune: false,
    dryRun: false,
    namespace: '',
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--entries' && argv[i + 1]) {
      args.entries = parseEntryRange(argv[i + 1]);
      i++;
    } else if (a === '--include-ground-truth') {
      args.includeGroundTruth = true;
    } else if (a === '--prune') {
      args.prune = true;
    } else if (a === '--force-prune') {
      args.prune = true;
      args.forcePrune = true;
    } else if (a === '--dry-run') {
      args.dryRun = true;
    } else if (a === '--namespace' && argv[i + 1]) {
      args.namespace = argv[i + 1];
      i++;
    }
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
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!PINECONE_API_KEY) throw new Error('PINECONE_API_KEY is not set.');
  if (!PINECONE_HOST) throw new Error('PINECONE_HOST is not set.');
  if (!VOYAGE_API_KEY) throw new Error('VOYAGE_API_KEY is not set.');

  console.log(`[ingest] index=${PINECONE_INDEX} host=${PINECONE_HOST}`);
  console.log(`[ingest] model=${VOYAGE_MODEL}`);
  if (args.entries) console.log(`[ingest] --entries ${[...args.entries].sort((a, b) => a - b).join(',')}`);
  if (args.includeGroundTruth) console.log('[ingest] --include-ground-truth');
  if (args.prune) console.log('[ingest] --prune');
  if (args.dryRun) console.log('[ingest] --dry-run (no Pinecone writes)');

  // Verify corrected/ exists; without it, the ingest has nothing to do.
  try {
    await stat(CORRECTED_TRANSCRIPTS_ROOT);
  } catch (e) {
    console.error(
      `[ingest] ${CORRECTED_TRANSCRIPTS_ROOT} not found. Run scripts/apply_corrections.py first to produce the corrected transcript tree.`,
    );
    process.exit(1);
  }

  const entryMap = await loadEntryMap();
  const sourceFiles = await walkDir(CORRECTED_TRANSCRIPTS_ROOT);
  console.log(`[ingest] discovered ${sourceFiles.length} corrected transcript files`);

  // Build the expected vector set across all sources for this run.
  const expectedById = new Map();
  for (const sourcePath of sourceFiles) {
    const { vectors, entryNumber, entrySubject, sourceRel } =
      await buildTranscriptVectors(sourcePath, entryMap);
    if (entryNumber == null) {
      console.warn(`[ingest] no entry mapping for ${sourceRel}; skipping`);
      continue;
    }
    if (args.entries && !args.entries.has(entryNumber)) continue;
    if (vectors.length === 0) continue;
    for (const v of vectors) expectedById.set(v.id, v);
    console.log(`[ingest] entry #${entryNumber} ${entrySubject}: ${vectors.length} chunks from ${basename(sourceRel)}`);
  }

  if (args.includeGroundTruth && (!args.entries || args.entries.size === 0)) {
    const gtVectors = await buildGroundTruthVectors();
    for (const v of gtVectors) expectedById.set(v.id, v);
    console.log(`[ingest] ground-truth: ${gtVectors.length} fact-vectors`);
  }

  // Diff against Pinecone's current state for idempotency.
  const existingIds = await listAllVectorIds(args.namespace);
  const toEmbedIds = [];
  for (const id of expectedById.keys()) {
    if (!existingIds.has(id)) toEmbedIds.push(id);
  }
  const orphaned = [...existingIds].filter((id) => !expectedById.has(id));
  console.log(
    `[ingest] state: expected=${expectedById.size} new/changed=${toEmbedIds.length} ` +
    `unchanged=${expectedById.size - toEmbedIds.length} orphaned=${orphaned.length}`,
  );

  if (args.dryRun) {
    console.log('[ingest] --dry-run complete; no Pinecone writes performed');
    return;
  }

  // Embed + upsert in batches.
  let upserted = 0;
  for (let i = 0; i < toEmbedIds.length; i += UPSERT_BATCH) {
    const idBatch = toEmbedIds.slice(i, i + UPSERT_BATCH);
    const docs = idBatch.map((id) => expectedById.get(id));
    const embeddings = await embedTexts(
      docs.map((d) => d.text),
      'document',
    );
    const upsertBatch = docs.map((d, j) => ({
      id: d.id,
      values: embeddings[j],
      metadata: d.metadata,
    }));
    await upsertVectors(upsertBatch, args.namespace);
    upserted += upsertBatch.length;
    console.log(`[ingest] upserted ${upserted}/${toEmbedIds.length}`);
  }

  if (args.prune && orphaned.length > 0) {
    // Safety threshold: refuse to prune if orphans are >50% of the
    // total index. A typo in PINECONE_INDEX or pointing at the wrong
    // corpus is the most likely cause of accidentally orphaning the
    // entire dataset. Caller can override with --force-prune.
    const totalSoFar = expectedById.size + orphaned.length;
    const orphanRatio = orphaned.length / Math.max(totalSoFar, 1);
    if (orphanRatio > 0.5 && !args.forcePrune) {
      console.error(
        `[ingest] REFUSING to prune ${orphaned.length} orphaned vectors — that's ` +
        `${(orphanRatio * 100).toFixed(1)}% of the index (${totalSoFar} total). ` +
        `If this is intentional, re-run with --force-prune. ` +
        `Otherwise check PINECONE_INDEX, the corrected/ directory, and the ` +
        `expected vs orphaned counts above before retrying.`,
      );
      process.exit(2);
    }
    await deleteVectorIds(orphaned, args.namespace);
    console.log(`[ingest] pruned ${orphaned.length} orphaned vectors`);
  }

  console.log(`[ingest] done — ${upserted} upserted, ${expectedById.size - upserted} unchanged${args.prune ? `, ${orphaned.length} pruned` : ''}`);
}

// Only run main() when this module is the entry point, not when imported.
// Lets test scripts import loadEntryMap / buildTranscriptVectors without
// triggering the PINECONE_API_KEY check.
const __isEntry = import.meta.url === pathToFileURL(process.argv[1] || '').href;
if (__isEntry) {
  main().catch((e) => {
    console.error('[ingest] fatal:', e?.stack || e?.message || e);
    process.exit(1);
  });
}
