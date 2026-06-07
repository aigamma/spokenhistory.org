// Unit tests for mcp-server/lib.mjs (the pure logic). No network, no env.
// Run: npm test  (from mcp-server/)

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  clampLimit,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  formatTimestamp,
  fidelityNote,
  buildCitation,
  toCitationPayload,
  normalizeLeaderName,
  leaderDisplayName,
  buildContentFilter,
  dedupeByEntry,
  createLruCache,
  createRateLimiter,
} from '../lib.mjs'

test('clampLimit clamps, floors, and defaults', () => {
  assert.equal(clampLimit(10), 10)
  assert.equal(clampLimit(0), 1) // below MIN_LIMIT
  assert.equal(clampLimit(9999), MAX_LIMIT)
  assert.equal(clampLimit(7.9), 7) // floored
  assert.equal(clampLimit('abc'), DEFAULT_LIMIT)
  assert.equal(clampLimit(undefined), DEFAULT_LIMIT)
  assert.equal(clampLimit(NaN), DEFAULT_LIMIT)
})

test('formatTimestamp handles edge cases', () => {
  assert.equal(formatTimestamp(0), '00:00:00')
  assert.equal(formatTimestamp(3661), '01:01:01')
  assert.equal(formatTimestamp(59.9), '00:00:59') // floored
  assert.equal(formatTimestamp(null), null)
  assert.equal(formatTimestamp(undefined), null)
  assert.equal(formatTimestamp(NaN), null)
  assert.equal(formatTimestamp(Infinity), null)
  assert.equal(formatTimestamp(-5), null) // negative guarded
})

test('fidelityNote maps tiers and defaults', () => {
  assert.match(fidelityNote('audit-original', 'high'), /line by line/)
  assert.match(fidelityNote('audit-original', 'publication-block'), /both readings are preserved/)
  assert.match(fidelityNote('audit-original', 'not-auditable'), /inherent audio limit/)
  // unknown / ingestion-only tier falls through to the default note
  assert.match(fidelityNote('ingestion-only', 'ingestion-only'), /nine passes/)
})

test('buildCitation falls back gracefully and includes timestamp range', () => {
  const full = buildCitation(
    { entry_subject: 'Joseph Echols Lowery', loc_item_url: 'https://www.loc.gov/item/2015669122/' },
    { timestampStart: 1617, timestampEnd: 1673 },
  )
  assert.match(full, /Joseph Echols Lowery, interview/)
  assert.match(full, /loc\.gov\/item\/2015669122/)
  assert.match(full, /at 00:26:57–00:27:53\.$/)

  const bare = buildCitation({})
  assert.match(bare, /Unknown interviewee, interview/)
  assert.ok(!bare.includes(', at ')) // no timestamp clause when none given
})

test('toCitationPayload shapes a Pinecone result and derives transparency fields', () => {
  const payload = toCitationPayload({
    id: 'chunk-1',
    pineconeScore: 0.4,
    rerankScore: 0.91,
    text: 'x'.repeat(250),
    metadata: {
      entry_number: 66,
      entry_subject: 'Joseph Echols Lowery',
      chunk_index: 30,
      timestamp_start_seconds: 1617,
      timestamp_end_seconds: 1673,
      loc_item_url: 'https://www.loc.gov/item/2015669122/',
      entry_provenance: 'audit-original',
      inferential_uncertainty_tier: 'high',
      inferential_uncertainty_score: 0.21,
    },
  })
  assert.equal(payload.entryNumber, 66)
  assert.equal(payload.timestampStartStr, '00:26:57')
  assert.equal(payload.similarity, 0.91) // rerank preferred over pinecone
  assert.equal(payload.documentId, 'entry-66')
  assert.match(payload.fidelityNote, /line by line/)
  assert.ok(payload.textPreview.endsWith('…')) // long text truncated
  assert.ok(payload.textPreview.length <= 201)
})

test('normalizeLeaderName + leaderDisplayName', () => {
  assert.equal(normalizeLeaderName('Wheeler Parker, Jr.'), 'wheeler parker jr')
  assert.equal(normalizeLeaderName('  JoeAnn   Anderson  '), 'joeann anderson')
  assert.equal(leaderDisplayName({ name: 'Aaron Dixon' }), 'Aaron Dixon')
  assert.equal(leaderDisplayName({ entry_subject: 'X' }), 'X')
  assert.equal(leaderDisplayName({}), '')
})

test('buildContentFilter excludes person/essay by default and merges entry_number', () => {
  assert.deepEqual(buildContentFilter(), { content_type: { $nin: ['person', 'essay'] } })
  assert.deepEqual(buildContentFilter({ includePersons: true, includeEssays: true }), null)
  assert.deepEqual(buildContentFilter({ entryNumber: 66 }), {
    entry_number: { $eq: 66 },
    content_type: { $nin: ['person', 'essay'] },
  })
  assert.deepEqual(buildContentFilter({ entryNumber: 66, includePersons: true, includeEssays: true }), {
    entry_number: { $eq: 66 },
  })
  assert.deepEqual(buildContentFilter({ includePersons: true }), { content_type: { $nin: ['essay'] } })
})

test('dedupeByEntry keeps one passage per entry up to limit, preserving order', () => {
  const results = [
    { metadata: { entry_number: 1 } },
    { metadata: { entry_number: 1 } },
    { metadata: { entry_number: 2 } },
    { metadata: {} }, // no entry_number -> skipped
    { metadata: { entry_number: 3 } },
  ]
  assert.deepEqual(
    dedupeByEntry(results, 2).map((r) => r.metadata.entry_number),
    [1, 2],
  )
  assert.deepEqual(
    dedupeByEntry(results, 10).map((r) => r.metadata.entry_number),
    [1, 2, 3],
  )
})

test('createLruCache evicts by size and expires by TTL', () => {
  let clock = 1000
  const cache = createLruCache({ max: 2, ttlMs: 100, now: () => clock })
  cache.set('a', 1)
  cache.set('b', 2)
  assert.equal(cache.get('a'), 1)
  cache.set('c', 3) // evicts least-recently-used; 'a' was just read so 'b' goes
  assert.equal(cache.get('b'), undefined)
  assert.equal(cache.get('a'), 1)
  assert.equal(cache.get('c'), 3)
  clock += 101 // expire everything (lazy: entries drop as they are read)
  assert.equal(cache.get('a'), undefined)
  assert.equal(cache.get('c'), undefined)
  assert.equal(cache.size, 0)
})

test('createRateLimiter allows a burst then refills over time', () => {
  let clock = 0
  const rl = createRateLimiter({ capacity: 2, refillPerSec: 1, now: () => clock })
  assert.equal(rl.take('ip').allowed, true)
  assert.equal(rl.take('ip').allowed, true)
  const blocked = rl.take('ip')
  assert.equal(blocked.allowed, false)
  assert.ok(blocked.retryAfter >= 1)
  clock += 1000 // one token refills
  assert.equal(rl.take('ip').allowed, true)
  // a different IP has its own bucket
  assert.equal(rl.take('other').allowed, true)
})
