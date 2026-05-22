// tests/rag/test_embed.mjs
//
// Tests for rag/embed.mjs. Uses fetch-mocking to verify batching, retry
// logic, and input_type discrimination without making real Voyage calls.
//
// Run with: node --test tests/rag/test_embed.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';

// Stub VOYAGE_API_KEY before importing the module under test
process.env.VOYAGE_API_KEY = 'test-key';
process.env.VOYAGE_MODEL = 'voyage-3';

const { embedTexts, embedQuery } = await import('../../rag/embed.mjs');

const originalFetch = globalThis.fetch;

function mockFetch(handler) {
  globalThis.fetch = handler;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

function fakeEmbedding(seed, dim = 1024) {
  const v = new Array(dim);
  for (let i = 0; i < dim; i++) v[i] = (Math.sin(seed * (i + 1)) + 1) / 2;
  return v;
}

test('embedTexts rejects invalid input_type', async () => {
  await assert.rejects(
    () => embedTexts(['hello'], 'invalid'),
    /inputType must be 'document' or 'query'/,
  );
});

test('embedTexts returns empty array on empty input', async () => {
  const out = await embedTexts([], 'document');
  assert.deepEqual(out, []);
});

test('embedTexts forwards input_type to Voyage API', async () => {
  const calls = [];
  const restore = mockFetch(async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return {
      ok: true,
      json: async () => ({
        data: [{ embedding: fakeEmbedding(1) }],
      }),
    };
  });
  try {
    await embedTexts(['hello'], 'query');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].body.input_type, 'query');
    assert.equal(calls[0].body.model, 'voyage-3');
    assert.deepEqual(calls[0].body.input, ['hello']);
  } finally {
    restore();
  }
});

test('embedTexts batches inputs by 32 by default', async () => {
  const calls = [];
  const restore = mockFetch(async (_url, options) => {
    const body = JSON.parse(options.body);
    calls.push(body.input);
    return {
      ok: true,
      json: async () => ({
        data: body.input.map((_, i) => ({ embedding: fakeEmbedding(i + 1) })),
      }),
    };
  });
  try {
    const inputs = Array.from({ length: 70 }, (_, i) => `text ${i}`);
    const out = await embedTexts(inputs, 'document');
    assert.equal(out.length, 70);
    // 70 inputs / 32 batch = 3 calls (32, 32, 6)
    assert.equal(calls.length, 3);
    assert.equal(calls[0].length, 32);
    assert.equal(calls[1].length, 32);
    assert.equal(calls[2].length, 6);
  } finally {
    restore();
  }
});

test('embedTexts retries transient 5xx and succeeds', async () => {
  let callCount = 0;
  const restore = mockFetch(async () => {
    callCount += 1;
    if (callCount < 3) {
      return {
        ok: false,
        status: 503,
        text: async () => 'service unavailable',
      };
    }
    return {
      ok: true,
      json: async () => ({ data: [{ embedding: fakeEmbedding(1) }] }),
    };
  });
  try {
    const out = await embedTexts(['hello'], 'document');
    assert.equal(out.length, 1);
    assert.equal(callCount, 3, 'should have retried twice before success');
  } finally {
    restore();
  }
});

test('embedTexts fails permanently on 4xx (non-429)', async () => {
  const restore = mockFetch(async () => ({
    ok: false,
    status: 400,
    text: async () => 'bad request',
  }));
  try {
    await assert.rejects(
      () => embedTexts(['hello'], 'document'),
      /voyage_embed_failed status=400/,
    );
  } finally {
    restore();
  }
});

test('embedTexts treats 429 as transient and retries', async () => {
  let callCount = 0;
  const restore = mockFetch(async () => {
    callCount += 1;
    if (callCount < 2) {
      return { ok: false, status: 429, text: async () => 'rate limited' };
    }
    return {
      ok: true,
      json: async () => ({ data: [{ embedding: fakeEmbedding(1) }] }),
    };
  });
  try {
    const out = await embedTexts(['hello'], 'document');
    assert.equal(out.length, 1);
    assert.equal(callCount, 2);
  } finally {
    restore();
  }
});

test('embedQuery is a single-input convenience wrapper', async () => {
  const restore = mockFetch(async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.input_type, 'query');
    return {
      ok: true,
      json: async () => ({
        data: body.input.map((_, i) => ({ embedding: fakeEmbedding(i + 1) })),
      }),
    };
  });
  try {
    const vec = await embedQuery('how did Bobby Seale describe the founding?');
    assert.equal(vec.length, 1024);
  } finally {
    restore();
  }
});

test('embedTexts rejects mismatched response shape', async () => {
  const restore = mockFetch(async () => ({
    ok: true,
    json: async () => ({ data: [] }), // 0 embeddings for 2 inputs
  }));
  try {
    await assert.rejects(
      () => embedTexts(['a', 'b'], 'document'),
      /voyage_embed_mismatch/,
    );
  } finally {
    restore();
  }
});
