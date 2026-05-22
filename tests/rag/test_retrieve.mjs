// tests/rag/test_retrieve.mjs
//
// Tests for rag/retrieve.mjs. Uses fetch-mocking to verify the two-stage
// pipeline (Pinecone hybrid query → Voyage rerank-2) without real API
// calls. Validates filter passthrough, top-K vs top-N semantics, and the
// shape of returned result objects.
//
// Run with: node --test tests/rag/test_retrieve.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.PINECONE_API_KEY = 'test-key';
process.env.PINECONE_HOST = 'https://test.pinecone.io';
process.env.PINECONE_INDEX = 'civil-rights';
process.env.VOYAGE_API_KEY = 'test-key';
process.env.VOYAGE_MODEL = 'voyage-3';
process.env.VOYAGE_RERANK_MODEL = 'rerank-2';

const { pineconeQuery, voyageRerank, retrieve } = await import('../../rag/retrieve.mjs');

const originalFetch = globalThis.fetch;

function mockFetch(handler) {
  globalThis.fetch = handler;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

function makePineconeMatches(n = 5) {
  return Array.from({ length: n }, (_, i) => ({
    id: `transcript_segment::entry-${i + 1}::source::${i}::hash${i}`,
    score: 0.9 - i * 0.05,
    metadata: {
      chunk_type: 'transcript_segment',
      entry_number: i + 1,
      entry_subject: `Subject ${i + 1}`,
      text: `Passage ${i + 1}: ipsum lorem about Stokely Carmichael in Greenwood Mississippi.`,
      chunk_index: i,
      content_hash: `hash${i}`,
    },
  }));
}

test('pineconeQuery posts to /query endpoint with vector + topK', async () => {
  const calls = [];
  const restore = mockFetch(async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return {
      ok: true,
      json: async () => ({ matches: makePineconeMatches(3) }),
    };
  });
  try {
    const vec = new Array(1024).fill(0.5);
    const matches = await pineconeQuery(vec, { topK: 10 });
    assert.equal(matches.length, 3);
    assert.ok(calls[0].url.endsWith('/query'));
    assert.equal(calls[0].body.topK, 10);
    assert.equal(calls[0].body.vector.length, 1024);
    assert.equal(calls[0].body.includeMetadata, true);
  } finally {
    restore();
  }
});

test('pineconeQuery includes filter when provided', async () => {
  const calls = [];
  const restore = mockFetch(async (url, options) => {
    calls.push(JSON.parse(options.body));
    return {
      ok: true,
      json: async () => ({ matches: [] }),
    };
  });
  try {
    await pineconeQuery([0.1, 0.2], {
      filter: { entry_number: { $eq: 73 } },
    });
    assert.deepEqual(calls[0].filter, { entry_number: { $eq: 73 } });
  } finally {
    restore();
  }
});

test('pineconeQuery surfaces 5xx errors as exceptions', async () => {
  const restore = mockFetch(async () => ({
    ok: false,
    status: 502,
    text: async () => 'bad gateway',
  }));
  try {
    await assert.rejects(
      () => pineconeQuery([0.1], { topK: 1 }),
      /pinecone_query_failed status=502/,
    );
  } finally {
    restore();
  }
});

test('voyageRerank posts query + documents and returns top-N', async () => {
  const documents = [
    'Stokely Carmichael at Greenwood June 1966.',
    'Unrelated content about cattle.',
    'Carmichael and the Black Power slogan.',
    'A passage about Kant.',
  ];
  const restore = mockFetch(async (url, options) => {
    assert.ok(url.endsWith('/rerank'));
    const body = JSON.parse(options.body);
    assert.equal(body.query, 'who first said black power?');
    assert.equal(body.documents.length, 4);
    return {
      ok: true,
      json: async () => ({
        data: [
          { index: 2, relevance_score: 0.95, document: { text: documents[2] } },
          { index: 0, relevance_score: 0.91, document: { text: documents[0] } },
        ],
      }),
    };
  });
  try {
    const out = await voyageRerank('who first said black power?', documents, { topN: 2 });
    assert.equal(out.length, 2);
    assert.equal(out[0].index, 2);
    assert.ok(out[0].relevance_score > out[1].relevance_score);
  } finally {
    restore();
  }
});

test('voyageRerank returns empty for empty documents', async () => {
  const out = await voyageRerank('query', []);
  assert.deepEqual(out, []);
});

test('retrieve composes embed → pineconeQuery → voyageRerank in order', async () => {
  const callOrder = [];
  const restore = mockFetch(async (url, options) => {
    if (url.includes('voyageai.com/v1/embeddings')) {
      callOrder.push('embed');
      const body = JSON.parse(options.body);
      assert.equal(body.input_type, 'query');
      return {
        ok: true,
        json: async () => ({ data: [{ embedding: new Array(1024).fill(0.1) }] }),
      };
    }
    if (url.includes('pinecone.io/query')) {
      callOrder.push('pinecone');
      return {
        ok: true,
        json: async () => ({ matches: makePineconeMatches(5) }),
      };
    }
    if (url.includes('voyageai.com/v1/rerank')) {
      callOrder.push('rerank');
      const body = JSON.parse(options.body);
      // Verify documents were passed (the text field from each match)
      assert.equal(body.documents.length, 5);
      return {
        ok: true,
        json: async () => ({
          data: body.documents.slice(0, 2).map((d, i) => ({
            index: i,
            relevance_score: 0.99 - i * 0.05,
            document: { text: d },
          })),
        }),
      };
    }
    throw new Error(`unexpected fetch to ${url}`);
  });
  try {
    const results = await retrieve('Black Power slogan origin', { topK: 5, topN: 2 });
    assert.deepEqual(callOrder, ['embed', 'pinecone', 'rerank']);
    assert.equal(results.length, 2);
    assert.ok(results[0].pinecone_score > 0);
    assert.ok(results[0].rerank_score > 0);
    assert.equal(results[0].metadata.chunk_type, 'transcript_segment');
    assert.ok(results[0].text.length > 0);
  } finally {
    restore();
  }
});

test('retrieve skips rerank when rerank=false', async () => {
  const callOrder = [];
  const restore = mockFetch(async (url) => {
    if (url.includes('voyageai.com/v1/embeddings')) {
      callOrder.push('embed');
      return {
        ok: true,
        json: async () => ({ data: [{ embedding: new Array(1024).fill(0.1) }] }),
      };
    }
    if (url.includes('pinecone.io/query')) {
      callOrder.push('pinecone');
      return {
        ok: true,
        json: async () => ({ matches: makePineconeMatches(3) }),
      };
    }
    throw new Error(`unexpected fetch to ${url}`);
  });
  try {
    const results = await retrieve('q', { topK: 3, topN: 2, rerank: false });
    assert.deepEqual(callOrder, ['embed', 'pinecone']);
    assert.equal(results.length, 2);
    assert.equal(results[0].rerank_score, null);
  } finally {
    restore();
  }
});

test('retrieve rejects non-string query', async () => {
  await assert.rejects(() => retrieve(null), /query must be a non-empty string/);
  await assert.rejects(() => retrieve(''), /query must be a non-empty string/);
});

test('retrieve passes filter through to pineconeQuery', async () => {
  const filterSeen = {};
  const restore = mockFetch(async (url, options) => {
    if (url.includes('voyageai.com/v1/embeddings')) {
      return {
        ok: true,
        json: async () => ({ data: [{ embedding: [0.1, 0.2] }] }),
      };
    }
    if (url.includes('pinecone.io/query')) {
      const body = JSON.parse(options.body);
      filterSeen.value = body.filter;
      return { ok: true, json: async () => ({ matches: [] }) };
    }
    throw new Error('unexpected');
  });
  try {
    await retrieve('q', {
      topK: 5,
      topN: 5,
      filter: { entry_number: { $eq: 73 } },
      rerank: false,
    });
    assert.deepEqual(filterSeen.value, { entry_number: { $eq: 73 } });
  } finally {
    restore();
  }
});
