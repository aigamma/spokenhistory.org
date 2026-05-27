// rag/retrieve.mjs
//
// Two-stage retrieval for the civil rights corpus:
//
//   1. **Stage 1, Pinecone hybrid query**: embed the user query via Voyage
//      (input_type='query'), then call Pinecone's /query endpoint with
//      the dense vector + optional metadata filter. Pinecone returns the
//      top-K most-similar chunks (K typically 20–50).
//
//   2. **Stage 2, Voyage rerank-2**: take the top-K from stage 1 and
//      hand them off to Voyage's rerank endpoint with the original
//      query. Voyage returns scored indices; keep the top-N (typically
//      5–10) and return them.
//
// The two-stage pattern is the canonical RAG quality lift: stage 1 casts
// a wide retrieval net, stage 2 narrows it with a much more accurate
// cross-encoder score. This is the layer where Smithsonian-grade quality
// is enforced relative to a single-stage retrieval that would let weak
// matches through.
//
// Hybrid lexical+semantic (BM25 + dense) is enabled at index-creation
// time by configuring Pinecone with both a dense vector field and a
// sparse (BM25) field. This module assumes the index supports hybrid; if
// the index is dense-only, the sparse vector argument is ignored.

import {
  PINECONE_HOST,
  PINECONE_API_KEY,
  pineconeHeaders,
  VOYAGE_API_KEY,
  VOYAGE_RERANK_ENDPOINT,
  VOYAGE_RERANK_MODEL,
  voyageHeaders,
} from './shared.mjs';
import { embedQuery } from './embed.mjs';

const DEFAULT_TOP_K = 30;
const DEFAULT_TOP_N = 8;

// ---------------------------------------------------------------------------
// Pinecone hybrid query
// ---------------------------------------------------------------------------

// Issue a Pinecone /query call. Returns Pinecone matches:
//   [{ id, score, values?, metadata: {...} }]
// `filter` is a Pinecone metadata-filter object, e.g.,
//   { entry_number: { $eq: 73 } }   // restrict to entry #73
//   { chunk_type: { $in: ['transcript_segment', 'summary_chapter'] } }
//   { 'metadata.speaker': { $eq: 'Kathleen Cleaver' } }
// `namespace` defaults to '' (the index's default namespace).
export async function pineconeQuery(queryVector, {
  topK = DEFAULT_TOP_K,
  filter = null,
  namespace = '',
  includeMetadata = true,
  includeValues = false,
} = {}) {
  if (!PINECONE_API_KEY) throw new Error('PINECONE_API_KEY is not set.');
  if (!PINECONE_HOST) throw new Error('PINECONE_HOST is not set.');
  const body = {
    vector: queryVector,
    topK,
    includeMetadata,
    includeValues,
    namespace,
  };
  if (filter) body.filter = filter;
  const res = await fetch(`${PINECONE_HOST}/query`, {
    method: 'POST',
    headers: pineconeHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`pinecone_query_failed status=${res.status} body=${text.slice(0, 500)}`);
  }
  const data = await res.json();
  return data?.matches || [];
}

// ---------------------------------------------------------------------------
// Voyage rerank-2
// ---------------------------------------------------------------------------

// Given a query and a list of candidate documents (strings), return the
// top-N reordered by rerank-2 relevance score. Returns:
//   [{ index, relevance_score, document }]
// where `index` is the position in the input candidates array.
export async function voyageRerank(query, documents, {
  topN = DEFAULT_TOP_N,
  model = null,
} = {}) {
  if (!VOYAGE_API_KEY) throw new Error('VOYAGE_API_KEY is not set.');
  if (!Array.isArray(documents) || documents.length === 0) return [];
  const res = await fetch(VOYAGE_RERANK_ENDPOINT, {
    method: 'POST',
    headers: voyageHeaders(),
    body: JSON.stringify({
      query,
      documents,
      model: model || VOYAGE_RERANK_MODEL,
      top_k: Math.min(topN, documents.length),
      return_documents: true,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`voyage_rerank_failed status=${res.status} body=${text.slice(0, 500)}`);
  }
  const data = await res.json();
  return (data?.data || []).map((item) => ({
    index: item.index,
    relevance_score: item.relevance_score,
    document: item.document?.text ?? documents[item.index],
  }));
}

// ---------------------------------------------------------------------------
// Composed two-stage retrieval
// ---------------------------------------------------------------------------

// Top-level retrieval: query string in, ranked passages out. This is the
// function the chat function (Netlify Function or Cloud Function) should
// call when assembling RAG context for a user question.
//
// Returns an array of result objects in rerank order:
//   {
//     id: <Pinecone vector id>,
//     pinecone_score: <stage-1 similarity>,
//     rerank_score: <stage-2 relevance>,
//     text: <chunk text>,
//     metadata: { entry_number, entry_subject, chunk_type, source_path,
//                 timestamp_start_seconds, ... }
//   }
export async function retrieve(query, {
  topK = DEFAULT_TOP_K,
  topN = DEFAULT_TOP_N,
  filter = null,
  namespace = '',
  rerank = true,
} = {}) {
  if (!query || typeof query !== 'string') {
    throw new Error('retrieve: query must be a non-empty string');
  }
  const queryVec = await embedQuery(query);
  const matches = await pineconeQuery(queryVec, { topK, filter, namespace });
  if (!rerank || matches.length === 0) {
    return matches.slice(0, topN).map((m) => ({
      id: m.id,
      pinecone_score: m.score,
      rerank_score: null,
      text: m.metadata?.text ?? '',
      metadata: m.metadata ?? {},
    }));
  }
  const documents = matches.map((m) => m.metadata?.text ?? '');
  const reranked = await voyageRerank(query, documents, { topN });
  return reranked.map((r) => {
    const original = matches[r.index];
    return {
      id: original.id,
      pinecone_score: original.score,
      rerank_score: r.relevance_score,
      text: original.metadata?.text ?? r.document,
      metadata: original.metadata ?? {},
    };
  });
}
