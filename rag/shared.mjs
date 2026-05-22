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

// Source file extensions we ingest. Civil-rights raw transcripts come as
// .txt (Whisper text output), .srt and .vtt (timed segments), and .json
// (Whisper raw output with segment metadata). The corrected/ directory
// produced by scripts/apply_corrections.py preserves the same shape.
const SOURCE_EXTENSIONS = new Set(['.txt', '.srt', '.vtt']);

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

// Skipped entries: 4 multi-speaker (3+) joint interviews where Whisper
// produced empty source directories due to upstream diarization failure
// (#28, #46, #64, #95), plus 1 redirect (#31 covered via joint #75). The
// ingest walker should skip these — they have no useable raw content.
export const SKIPPED_ENTRIES = new Set([28, 31, 46, 64, 95]);
