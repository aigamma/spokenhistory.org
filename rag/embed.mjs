// rag/embed.mjs
//
// Voyage AI embedding helper. Batches input texts (Voyage caps at 128
// inputs per call but the default batch is 32 to keep request size
// reasonable), retries on transient errors with exponential backoff,
// and returns the dense vectors in input order.
//
// Used at ingest time by rag/ingest.mjs (input_type='document') and at
// retrieval time by rag/retrieve.mjs (input_type='query'). The two
// modes use different internal embedding heads on Voyage's side — query
// embeddings are tuned for retrieval ranking, document embeddings are
// tuned for storage. Always pass the right input_type.

import {
  VOYAGE_API_KEY,
  VOYAGE_EMBED_ENDPOINT,
  VOYAGE_MODEL,
  voyageHeaders,
} from './shared.mjs';

// Voyage embedding API supports up to 128 inputs per call. The earlier
// default of 32 was conservative; bumped to 128 for ingest throughput
// (4× fewer round-trips). A typical civil-rights chunk is ~500 tokens,
// so a batch of 128 stays well under Voyage's 120K-token-per-request
// ceiling.
const DEFAULT_BATCH = 128;
const MAX_RETRIES = 4;
const INITIAL_BACKOFF_MS = 500;

async function backoff(attempt) {
  const ms = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
  await new Promise((r) => setTimeout(r, ms));
}

async function embedBatch(texts, inputType, model) {
  const res = await fetch(VOYAGE_EMBED_ENDPOINT, {
    method: 'POST',
    headers: voyageHeaders(),
    body: JSON.stringify({
      input: texts,
      model: model || VOYAGE_MODEL,
      input_type: inputType,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const status = res.status;
    const isTransient = status >= 500 || status === 429;
    const err = new Error(`voyage_embed_failed status=${status} body=${body.slice(0, 500)}`);
    err.isTransient = isTransient;
    err.status = status;
    throw err;
  }
  const data = await res.json();
  return (data?.data || []).map((item) => item.embedding);
}

// Embed an array of texts. Returns an array of embeddings in input order.
// `inputType` must be 'document' (at ingest) or 'query' (at retrieval).
export async function embedTexts(texts, inputType, { model = null, batch = DEFAULT_BATCH } = {}) {
  if (!VOYAGE_API_KEY) {
    throw new Error('VOYAGE_API_KEY is not set in env.');
  }
  if (!Array.isArray(texts) || texts.length === 0) return [];
  if (inputType !== 'document' && inputType !== 'query') {
    throw new Error(`embedTexts: inputType must be 'document' or 'query', got ${inputType}`);
  }
  const all = [];
  for (let i = 0; i < texts.length; i += batch) {
    const slice = texts.slice(i, i + batch);
    let attempt = 0;
    // Retry loop on transient Voyage errors (5xx, 429); breaks on
    // success or non-transient error or attempt-limit. eslint-disable
    // because the guarded-break shape is the canonical retry-loop
    // idiom and clearer than a sentinel boolean.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const embeddings = await embedBatch(slice, inputType, model);
        if (embeddings.length !== slice.length) {
          throw new Error(
            `voyage_embed_mismatch: expected ${slice.length} embeddings, got ${embeddings.length}`,
          );
        }
        all.push(...embeddings);
        break;
      } catch (e) {
        if (!e.isTransient || attempt >= MAX_RETRIES) throw e;
        await backoff(attempt);
        attempt += 1;
      }
    }
  }
  return all;
}

// Convenience wrapper for the common single-query case at retrieval time.
export async function embedQuery(text, opts = {}) {
  const [vec] = await embedTexts([text], 'query', opts);
  return vec;
}
