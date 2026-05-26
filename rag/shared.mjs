// rag/shared.mjs
//
// Helpers shared across the civil rights RAG layer. Keeps env-var
// resolution, Pinecone API version + headers, corpus paths, and the
// directory walker in one place so a bump lands as a one-line change.
//
// Mirrors the conventions established in worldthought.com's scripts/rag/
// (same pattern: Voyage embeddings, Pinecone serverless via REST, no SDK).
// This project has different data shape (oral-history interview corpus
// rather than philosopher-by-philosopher), so the corpus layout below is
// civil-rights-specific.

import { readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
export const RAW_TRANSCRIPTS_ROOT = join(REPO_ROOT, 'transcripts', 'raw');
export const CORRECTED_TRANSCRIPTS_ROOT = join(REPO_ROOT, 'transcripts', 'corrected');
export const GROUND_TRUTH_PATH = join(
  REPO_ROOT,
  'Metadata Generation System',
  'civil_rights_facts.json',
);

// Pinecone connection. The civil rights project uses a SEPARATE Pinecone
// project from worldthought (Builder tier supports multiple projects under
// one organization). PINECONE_INDEX defaults to "civil-rights" but can be
// overridden via env. The host is project-specific and must be set.
export const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
export const PINECONE_HOST = process.env.PINECONE_HOST;
export const PINECONE_INDEX = process.env.PINECONE_INDEX || 'civil-rights';

// Voyage AI embedding model. voyage-3 (1024-dim) is the default to match
// the civil rights project's Smithsonian-grade accuracy requirement, where
// retrieval quality dominates cost. voyage-3-large is available if a
// future evaluation shows it's worth the marginal cost.
export const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
export const VOYAGE_MODEL = process.env.VOYAGE_MODEL || 'voyage-3';
export const VOYAGE_RERANK_MODEL = process.env.VOYAGE_RERANK_MODEL || 'rerank-2';

// Pinecone REST API version pin. Bump deliberately when validating against
// a new version's response shape.
const PINECONE_API_VERSION = '2024-07';

export function pineconeHeaders() {
  return {
    'Content-Type': 'application/json',
    'Api-Key': PINECONE_API_KEY,
    'X-Pinecone-API-Version': PINECONE_API_VERSION,
  };
}

// Voyage AI endpoints. Centralized here so a domain change lands once.
export const VOYAGE_EMBED_ENDPOINT = 'https://api.voyageai.com/v1/embeddings';
export const VOYAGE_RERANK_ENDPOINT = 'https://api.voyageai.com/v1/rerank';

export function voyageHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${VOYAGE_API_KEY}`,
  };
}

// Source file extensions we ingest. Civil-rights raw transcripts come
// as .txt, .srt, and .vtt (all derived from the same Whisper output).
// We ingest ONLY .srt because:
//   1. SRT is time-anchored — every chunk carries timestampStart/End,
//      so every retrieval result can produce a citation with the exact
//      audio offset. .txt loses that.
//   2. .vtt is a near-identical re-encoding of .srt and produces
//      duplicate chunks in Pinecone (verified in the first ingest:
//      same passages appeared 2-3× in top-N retrievals across formats).
// If a future need surfaces for paragraph-aware chunking (e.g. theme
// queries that span subtitle boundaries), reintroduce .txt with a
// separate `chunk_type` so retrieval can prefer time-anchored chunks
// and fall back to paragraph chunks when no SRT match is found.
const SOURCE_EXTENSIONS = new Set(['.srt']);

export async function walkDir(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const results = await Promise.all(
    entries.map(async (ent) => {
      const fullPath = join(dir, ent.name);
      if (ent.isDirectory()) return walkDir(fullPath);
      if (ent.isFile() && SOURCE_EXTENSIONS.has(extname(ent.name).toLowerCase())) {
        return [fullPath];
      }
      return [];
    }),
  );
  return results.flat();
}

// Skipped entries: legacy multi-speaker / redirect cases that have no
// usable raw content.
//
// Note (2026-05-25): #28, #46, #64 were ORIGINALLY in this set as the
// Whisper-empty multi-speaker joint interviews. They've since been
// ingested with full content via the 2026-05-25 Dustin-student batch
// (transcripts/ingestion/ingest_new_batch_2026-05-25.py), so they were
// REMOVED from the skip set — the ingest walker now finds them and
// embeds their content. #31 (Eddie Holloway redirect — covered via joint
// #75) and #95 (Crosby + Long + Miller group) remain skipped: both have
// no corrected/ data and remain coverage gaps.
export const SKIPPED_ENTRIES = new Set([31, 95]);
