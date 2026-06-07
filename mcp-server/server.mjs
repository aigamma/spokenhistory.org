/**
 * Civil Rights History Project, Remote MCP Server
 *
 * Exposes the Library of Congress / Smithsonian NMAAHC oral history
 * archive to Claude Desktop, Claude.ai Custom Connectors, and any other
 * MCP-compatible client by URL.
 *
 * SUBSTRATE (post 2026-05-25 rewire):
 *   - Query embedding: Voyage AI voyage-3 (1024-dim, input_type='query')
 *   - Vector store:    Pinecone Builder, project `civil-rights`
 *   - Reranking:       Voyage AI rerank-2 (second-stage cross-encoder)
 *   - This replaces the prior OpenAI text-embedding-3-small + Firestore
 *     in-memory cosine-scan path. The retrieval logic is inlined here
 *     (mirrors rag/embed.mjs + rag/retrieve.mjs) so the Docker image
 *     stays self-contained, track those files as the canonical source.
 *
 * Six tools (three primitives + three research patterns):
 *
 *   PRIMITIVES
 *   - search_transcripts(query, limit?, entry_number?, dedupe_by_entry?)
 *       Citation-grade semantic search across the 136-entry corpus.
 *       Returns ranked passages with FULL primary-source citation
 *       metadata: interviewee, Library of Congress catalog URL, audio
 *       timestamp range, audit provenance (audit-original vs
 *       ingestion-only), inferential-uncertainty tier, plus a
 *       pre-formatted Chicago-Manual-of-Style citation block.
 *
 *   - get_transcript(entry_number)
 *       All chunks for a given entry, stitched back into the full
 *       transcript with timestamps. Query-side filter on Pinecone
 *       (no Firestore dependency); response carries the same
 *       citation-grade metadata as search.
 *
 *   - list_leaders(limit?)
 *       Roster of all 136 interviewees with entry_number, name, LoC
 *       catalog URL, audit provenance. Backed by a pre-generated
 *       leaders.json baked into the Docker image (data/leaders.json).
 *
 *   RESEARCH PATTERNS (also exposed as MCP prompts; see below)
 *   - compare_perspectives(topic)
 *       Wraps search_transcripts with dedupe_by_entry=true and limit=8.
 *       Returns 8 voices on a topic plus a `framing` field for the model.
 *
 *   - trace_evolution(interviewee, topic)
 *       Resolves interviewee → entry_number from leaders, calls
 *       search_transcripts with that filter, sorts results by timestamp.
 *
 *   - source_for_claim(claim)
 *       Wraps search_transcripts with limit=8 (no dedupe, polyphonic
 *       record preserved). Returns passages plus a `framing` instructing
 *       SUPPORTS / COMPLICATES / CONTRADICTS labeling per result.
 *
 * The same three research patterns are ALSO advertised as MCP prompts
 * with the same names. This is intentional dual exposure: some MCP
 * clients (Claude Desktop) surface prompts as slash-commands and route
 * them through the model; others (Codex Desktop, ChatGPT Apps SDK) do
 * NOT route prompts to the model, only tools are model-callable on
 * those surfaces. Exposing the patterns as both means they reach the
 * model on every client regardless of capability surface.
 *
 * Deployment target: Fly.io (per fly.toml). The server uses the
 * StreamableHTTP transport from the MCP TypeScript SDK and Express, so
 * it can run anywhere Node.js + a public HTTP endpoint are available
 * (Railway, Render, a bare VPS).
 *
 * Authentication: this skeleton does NOT require auth on the MCP
 * endpoint -- the archive is intended as a public-readable surface,
 * matching the broader project's goal of making the Library of Congress
 * collection "intuitive and engaging" per the README. For Anthropic's
 * Connector Directory submission, OAuth 2.1 plugs in at the Express
 * middleware level before the StreamableHTTP transport.
 *
 * Required environment variables:
 *   PINECONE_API_KEY                Pinecone API key (civil-rights project)
 *   PINECONE_HOST                   Pinecone serverless host URL
 *   VOYAGE_API_KEY                  Voyage AI key (shared with worldthought)
 *   PORT                            HTTP listen port (default 3001)
 *
 * Optional environment variables:
 *   PINECONE_INDEX                  default 'civil-rights'
 *   VOYAGE_MODEL                    default 'voyage-3' (1024-dim)
 *   VOYAGE_RERANK_MODEL             default 'rerank-2'
 *   MCP_RERANK_ENABLED              default 'true'; set 'false' to skip stage 2
 */

import express from 'express'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  MAX_QUERY_LENGTH,
  DEFAULT_LIMIT,
  clampLimit,
  normalizeLeaderName,
  leaderDisplayName,
  fidelityNote,
  buildCitation,
  toCitationPayload,
  buildContentFilter,
  dedupeByEntry,
  createLruCache,
  createRateLimiter,
} from './lib.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Config from environment ────────────────────────────────────────

const PINECONE_API_KEY = process.env.PINECONE_API_KEY
const PINECONE_HOST = process.env.PINECONE_HOST
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'civil-rights'
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY
const VOYAGE_MODEL = process.env.VOYAGE_MODEL || 'voyage-3'
const VOYAGE_RERANK_MODEL = process.env.VOYAGE_RERANK_MODEL || 'rerank-2'
const RERANK_ENABLED = (process.env.MCP_RERANK_ENABLED || 'true').toLowerCase() !== 'false'

const PINECONE_API_VERSION = '2024-07'
const VOYAGE_EMBED_ENDPOINT = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_RERANK_ENDPOINT = 'https://api.voyageai.com/v1/rerank'

// Fail-fast env validation. Missing keys cause the first /mcp call to
// fail with a confusing internal error; failing here surfaces the
// misconfiguration at process start so the Fly machine never marks
// itself healthy with an unusable server.
{
  const missing = []
  if (!PINECONE_API_KEY) missing.push('PINECONE_API_KEY')
  if (!PINECONE_HOST) missing.push('PINECONE_HOST')
  if (!VOYAGE_API_KEY) missing.push('VOYAGE_API_KEY')
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`)
    process.exit(1)
  }
}

function pineconeHeaders() {
  return {
    'Content-Type': 'application/json',
    'Api-Key': PINECONE_API_KEY,
    'X-Pinecone-API-Version': PINECONE_API_VERSION,
  }
}

function voyageHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${VOYAGE_API_KEY}`,
  }
}

// ── fetch with timeout ─────────────────────────────────────────────
// A hung upstream (Voyage / Pinecone) would otherwise block the request
// forever, holding a Fly machine and the client connection open. AbortController
// caps each call so a stalled dependency fails fast instead of hanging.
const EMBED_TIMEOUT_MS = Number(process.env.MCP_EMBED_TIMEOUT_MS) || 20000
const QUERY_TIMEOUT_MS = Number(process.env.MCP_QUERY_TIMEOUT_MS) || 20000
const RERANK_TIMEOUT_MS = Number(process.env.MCP_RERANK_TIMEOUT_MS) || 30000

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error(`upstream_timeout after ${timeoutMs}ms: ${url}`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// ── Caches ─────────────────────────────────────────────────────────
// Memoize query embeddings and retrieval results so a repeated identical query
// (common in demos and in the research-pattern tools that call searchTranscripts
// internally) does not re-bill Voyage + Pinecone. In-process, TTL-bounded.
const CACHE_TTL_MS = Number(process.env.MCP_CACHE_TTL_MS) || 10 * 60 * 1000
const _embedCache = createLruCache({ max: 500, ttlMs: CACHE_TTL_MS })
const _retrieveCache = createLruCache({ max: 500, ttlMs: CACHE_TTL_MS })

// ── Voyage query embedding ─────────────────────────────────────────
// Mirrors rag/embed.mjs::embedQuery. input_type='query' routes through
// Voyage's retrieval-tuned query encoder (not the document encoder used
// at ingest time).

const EMBED_RETRY_MAX = 3
const EMBED_RETRY_BACKOFF_MS = 500

async function embedQuery(query) {
  const cached = _embedCache.get(query)
  if (cached) return cached
  let attempt = 0
  while (true) {
    const res = await fetchWithTimeout(
      VOYAGE_EMBED_ENDPOINT,
      {
        method: 'POST',
        headers: voyageHeaders(),
        body: JSON.stringify({
          input: [query],
          model: VOYAGE_MODEL,
          input_type: 'query',
        }),
      },
      EMBED_TIMEOUT_MS,
    )
    if (res.ok) {
      const data = await res.json()
      const embedding = data?.data?.[0]?.embedding
      if (embedding) _embedCache.set(query, embedding)
      return embedding
    }
    const isTransient = res.status >= 500 || res.status === 429
    const body = await res.text().catch(() => '')
    if (!isTransient || attempt >= EMBED_RETRY_MAX) {
      throw new Error(`voyage_embed_failed status=${res.status} body=${body.slice(0, 300)}`)
    }
    await new Promise((r) => setTimeout(r, EMBED_RETRY_BACKOFF_MS * Math.pow(2, attempt)))
    attempt++
  }
}

// ── Pinecone /query ────────────────────────────────────────────────
// Mirrors rag/retrieve.mjs::pineconeQuery.

async function pineconeQuery(queryVector, { topK = 30, filter = null, namespace = '' } = {}) {
  const body = {
    vector: queryVector,
    topK,
    includeMetadata: true,
    includeValues: false,
    namespace,
  }
  if (filter) body.filter = filter
  const res = await fetchWithTimeout(
    `${PINECONE_HOST}/query`,
    {
      method: 'POST',
      headers: pineconeHeaders(),
      body: JSON.stringify(body),
    },
    QUERY_TIMEOUT_MS,
  )
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`pinecone_query_failed status=${res.status} body=${text.slice(0, 300)}`)
  }
  const data = await res.json()
  return data?.matches || []
}

// ── Voyage rerank-2 ────────────────────────────────────────────────
// Mirrors rag/retrieve.mjs::voyageRerank.

async function voyageRerank(query, documents, { topN = 10 } = {}) {
  if (!Array.isArray(documents) || documents.length === 0) return []
  const res = await fetchWithTimeout(
    VOYAGE_RERANK_ENDPOINT,
    {
      method: 'POST',
      headers: voyageHeaders(),
      body: JSON.stringify({
        query,
        documents,
        model: VOYAGE_RERANK_MODEL,
        top_k: Math.min(topN, documents.length),
        return_documents: true,
      }),
    },
    RERANK_TIMEOUT_MS,
  )
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`voyage_rerank_failed status=${res.status} body=${text.slice(0, 300)}`)
  }
  const data = await res.json()
  return (data?.data || []).map((item) => ({
    index: item.index,
    relevance_score: item.relevance_score,
  }))
}

// ── Composed two-stage retrieval ───────────────────────────────────

async function retrieve(query, { topK = 30, topN = 10, filter = null } = {}) {
  const cacheKey = JSON.stringify({ query, topK, topN, filter })
  const cached = _retrieveCache.get(cacheKey)
  if (cached) return cached
  const result = await retrieveUncached(query, { topK, topN, filter })
  _retrieveCache.set(cacheKey, result)
  return result
}

async function retrieveUncached(query, { topK = 30, topN = 10, filter = null } = {}) {
  const queryVec = await embedQuery(query)
  const matches = await pineconeQuery(queryVec, { topK, filter })
  if (!RERANK_ENABLED || matches.length === 0) {
    return matches.slice(0, topN).map((m) => ({
      id: m.id,
      pineconeScore: m.score,
      rerankScore: null,
      text: m.metadata?.text ?? '',
      metadata: m.metadata ?? {},
    }))
  }
  const documents = matches.map((m) => m.metadata?.text ?? '')
  const reranked = await voyageRerank(query, documents, { topN })
  return reranked.map((r) => {
    const original = matches[r.index]
    return {
      id: original.id,
      pineconeScore: original.score,
      rerankScore: r.relevance_score,
      text: original.metadata?.text ?? '',
      metadata: original.metadata ?? {},
    }
  })
}

// Citation formatting (formatTimestamp / fidelityNote / buildCitation) and the
// citation-payload shaper (toCitationPayload) are pure functions and live in
// lib.mjs so they can be unit-tested without booting the server.

// ── Pre-baked leaders directory ────────────────────────────────────
// Generated at build time from transcripts/corrected/<dir>/manifest.json
// via mcp-server/build-leaders.mjs. Pinecone can't enumerate distinct
// entry_subject values cheaply, so we ship a static roster instead.
// The file is small (~30 KB for the current 136 entries).

let _leadersCache = null

async function loadLeaders() {
  if (_leadersCache) return _leadersCache
  const path = join(__dirname, 'data', 'leaders.json')
  try {
    const text = await readFile(path, 'utf8')
    _leadersCache = JSON.parse(text)
  } catch (e) {
    console.warn(`[mcp] leaders.json not found at ${path}; list_leaders will return []. Regenerate via build-leaders.mjs.`)
    _leadersCache = []
  }
  return _leadersCache
}

// People catalog (interviewees + external figures), baked from
// public/rag/people/index.json via build-people.mjs. Backs list_people.
let _peopleCache = null
async function loadPeople() {
  if (_peopleCache) return _peopleCache
  const path = join(__dirname, 'data', 'people.json')
  try {
    _peopleCache = JSON.parse(await readFile(path, 'utf8'))
  } catch (e) {
    console.warn(`[mcp] people.json not found at ${path}; list_people will return []. Regenerate via build-people.mjs.`)
    _peopleCache = []
  }
  return _peopleCache
}

// Curated-essays catalog ({ topics, essays }), baked from
// public/rag/essays/index.json via build-essays.mjs. Backs list_essays.
let _essaysCache = null
async function loadEssays() {
  if (_essaysCache) return _essaysCache
  const path = join(__dirname, 'data', 'essays.json')
  try {
    _essaysCache = JSON.parse(await readFile(path, 'utf8'))
  } catch (e) {
    console.warn(`[mcp] essays.json not found at ${path}; list_essays will return {topics:[],essays:[]}. Regenerate via build-essays.mjs.`)
    _essaysCache = { topics: [], essays: [] }
  }
  return _essaysCache
}

// ── Tool implementations ────────────────────────────────────────────
// Parameter caps/floors (MAX_QUERY_LENGTH, DEFAULT_LIMIT, clampLimit) and the
// citation-payload shaper (toCitationPayload) are pure and imported from lib.mjs.

async function searchTranscripts({ query, limit = DEFAULT_LIMIT, entry_number = null, dedupe_by_entry = false, include_persons = false, include_essays = false }) {
  if (typeof query !== 'string') {
    throw new Error('query must be a string')
  }
  const trimmed = query.trim()
  if (trimmed.length === 0) {
    throw new Error('query must not be empty after trimming')
  }
  if (trimmed.length > MAX_QUERY_LENGTH) {
    throw new Error(
      `query exceeds maximum length (${trimmed.length} > ${MAX_QUERY_LENGTH} characters)`,
    )
  }
  const clampedLimit = clampLimit(limit)

  // Validate the optional single-interview restriction, then delegate the
  // (entry_number + content_type) filter assembly to the pure builder in lib.mjs.
  let entryNumber = null
  if (entry_number != null) {
    const n = Number(entry_number)
    if (!Number.isFinite(n) || n < 1) {
      throw new Error('entry_number must be a positive integer')
    }
    entryNumber = Math.floor(n)
  }
  const filter = buildContentFilter({
    entryNumber,
    includePersons: include_persons,
    includeEssays: include_essays,
  })

  // Stage-1 net: ask Pinecone for 3× the desired limit so the
  // stage-2 reranker has enough candidates to discriminate. When
  // dedupe_by_entry is true, over-fetch by 4× so we still have
  // limit-many distinct interviewees after deduplication.
  const baseFetch = dedupe_by_entry ? clampedLimit * 4 : clampedLimit
  const topK = Math.max(baseFetch * 3, 20)
  const results = await retrieve(trimmed, { topK, topN: baseFetch, filter })

  if (dedupe_by_entry) {
    return dedupeByEntry(results, clampedLimit).map(toCitationPayload)
  }
  return results.slice(0, clampedLimit).map(toCitationPayload)
}

// Accepts either an integer entry_number or a "entry-N" string. Pulls
// every chunk for that entry from Pinecone and stitches them in
// chunk_index order so the caller sees the full interview as a
// citation-ready document.
async function getTranscript({ entry_number, interview_id }) {
  // entry_number takes precedence; interview_id retained for legacy
  // callers (the prior Firestore-backed implementation took it).
  let n = null
  if (entry_number != null) {
    const parsed = Number(entry_number)
    if (Number.isFinite(parsed) && parsed >= 1) n = Math.floor(parsed)
  }
  if (n == null && typeof interview_id === 'string') {
    const m = interview_id.match(/^entry-(\d+)$/i)
    if (m) n = Number(m[1])
  }
  if (n == null) {
    throw new Error('entry_number (positive integer) is required, e.g., {"entry_number": 125}')
  }

  // Retrieve all chunks for this entry. Pinecone doesn't have a
  // straight "list-by-metadata" call, so we use /query with a high
  // topK and a dummy vector (zeros). The metadata filter does the
  // actual selection; the score from cosine against zeros is
  // irrelevant, we re-sort by chunk_index below.
  //
  // 1024 zeros to match voyage-3 dim. topK=400 is well above any
  // entry's chunk count (max observed ~250 for the longest interview).
  const ZERO_VEC = new Array(1024).fill(0)
  const matches = await pineconeQuery(ZERO_VEC, {
    topK: 400,
    filter: { entry_number: { $eq: n } },
  })
  if (matches.length === 0) {
    return { error: `No content found for entry_number=${n}` }
  }

  // Sort chunks back into their original transcript order.
  matches.sort((a, b) => (a.metadata?.chunk_index ?? 0) - (b.metadata?.chunk_index ?? 0))

  // The first chunk's metadata tells us about the entry as a whole.
  const first = matches[0].metadata || {}
  const interview = {
    entryNumber: first.entry_number ?? n,
    entrySubject: first.entry_subject || null,
    locItemUrl: first.loc_item_url || null,
    entryProvenance: first.entry_provenance || null,
    uncertaintyTier: first.inferential_uncertainty_tier || null,
    uncertaintyScore: Number.isFinite(first.inferential_uncertainty_score) ? first.inferential_uncertainty_score : null,
    fidelityNote: fidelityNote(first.entry_provenance, first.inferential_uncertainty_tier),
    suggestedCitation: buildCitation(first),
    chunkCount: matches.length,
    sourceExt: first.source_ext || null,
    sourcePath: first.source_path || null,
  }

  const chunks = matches.map((m) =>
    toCitationPayload({
      id: m.id,
      pineconeScore: null,
      rerankScore: null,
      text: m.metadata?.text || '',
      metadata: m.metadata || {},
    }),
  )

  return { interview, chunks }
}

async function listLeaders({ limit = 200 }) {
  const n = Number(limit)
  const safeLimit = Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 500) : 200
  const all = await loadLeaders()
  return all.slice(0, safeLimit)
}

// leaderDisplayName + normalizeLeaderName are pure and imported from lib.mjs.

async function listPeople({ limit = 250, person_type = null } = {}) {
  const n = Number(limit)
  const safeLimit = Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 500) : 250
  let people = await loadPeople()
  if (person_type === 'interviewee' || person_type === 'external_figure') {
    people = people.filter((p) => p.person_type === person_type)
  }
  return people.slice(0, safeLimit)
}

async function listEssays({ topic = null } = {}) {
  const catalog = await loadEssays()
  if (!topic || typeof topic !== 'string') {
    return catalog
  }
  const t = topic.toLowerCase().trim()
  const matchedTopic = (catalog.topics || []).find(
    (x) => x.id === t || (x.label && x.label.toLowerCase() === t),
  )
  if (!matchedTopic) {
    // Fall back to matching essays by theme tag so a near-miss topic still works.
    const essays = (catalog.essays || []).filter((e) =>
      (e.themes || []).some((th) => th.toLowerCase() === t),
    )
    return { topic, matched: false, topics: catalog.topics, essays }
  }
  const slugs = new Set(matchedTopic.essay_slugs || [])
  const essays = (catalog.essays || []).filter((e) => slugs.has(e.slug))
  return { topic: matchedTopic.label, matched: true, topic_detail: matchedTopic, essays }
}

// ── Research-pattern tools (compare_perspectives / trace_evolution /
//    source_for_claim) ─────────────────────────────────────────────────
//
// These three patterns are ALSO advertised as MCP prompts (see
// PROMPT_DEFINITIONS below) for clients that surface prompts as
// slash-commands or template menus (Claude Desktop). They're ALSO
// exposed as tools because some MCP clients (Codex Desktop, ChatGPT
// Apps SDK) do not route MCP prompts to the model, only tools are
// model-callable on those surfaces. Dual exposure means the patterns
// reach the model on every client regardless of capability surface.
//
// Each tool wraps the existing retrieval primitives (searchTranscripts,
// loadLeaders) with the preset arguments the pattern needs and returns
// a structured envelope { pattern, args..., framing, results } where
// `framing` carries the analytic instruction the prompt template would
// have provided. The model uses `framing` to structure its presentation
// of `results`.

async function comparePerspectives({ topic }) {
  if (!topic || typeof topic !== 'string') {
    throw new Error('topic (string) is required')
  }
  const results = await searchTranscripts({
    query: topic,
    limit: 8,
    dedupe_by_entry: true,
  })
  return {
    pattern: 'compare_perspectives',
    topic,
    framing:
      'These passages are from different interviewees in the archive, each discussing the requested topic. ' +
      'Present each as a citation block (interviewee · quoted passage · timestamp · locItemUrl · audit-tier badge) ' +
      'and surface the agreements, tensions, and complementary perspectives across voices. Do not synthesize a ' +
      'single conclusion, the polyphonic record IS the point of an oral history archive. If uncertaintyTier ' +
      'is anything other than "low", pass the fidelityNote through to the user verbatim.',
    results,
  }
}

async function traceEvolution({ interviewee, topic }) {
  if (!interviewee || typeof interviewee !== 'string') {
    throw new Error('interviewee (string) is required')
  }
  if (!topic || typeof topic !== 'string') {
    throw new Error('topic (string) is required')
  }
  const leaders = await loadLeaders()
  const target = normalizeLeaderName(interviewee)
  let resolved = leaders.find((l) => normalizeLeaderName(leaderDisplayName(l)) === target)
  if (!resolved) {
    const partials = leaders.filter((l) =>
      normalizeLeaderName(leaderDisplayName(l)).includes(target),
    )
    if (partials.length === 1) {
      resolved = partials[0]
    } else if (partials.length > 1) {
      throw new Error(
        `Multiple interviewees matched "${interviewee}": ` +
          partials.map((p) => leaderDisplayName(p)).join(', ') +
          '. Use a more specific name (e.g., include first + last) or call list_leaders to find the exact entry.',
      )
    } else {
      throw new Error(
        `No interviewee matched "${interviewee}". Call list_leaders to see the available roster.`,
      )
    }
  }
  const results = await searchTranscripts({
    query: topic,
    entry_number: resolved.entry_number,
    limit: 20,
  })
  results.sort((a, b) => (a.timestampStart ?? 0) - (b.timestampStart ?? 0))
  const resolvedName = leaderDisplayName(resolved)
  return {
    pattern: 'trace_evolution',
    interviewee: resolvedName,
    entry_number: resolved.entry_number,
    topic,
    framing:
      'These passages are from ' + resolvedName + "'s interview, arranged chronologically by timestamp. " +
      "Examine how their framing or thinking about this topic evolves across the chapters of the interview. " +
      'Quote each passage with its timestamp; the audit-tier badge applies to the interview as a whole and ' +
      'should be cited once at the top of the response.',
    results,
  }
}

async function sourceForClaim({ claim }) {
  if (!claim || typeof claim !== 'string') {
    throw new Error('claim (string) is required')
  }
  const results = await searchTranscripts({
    query: claim,
    limit: 8,
  })
  return {
    pattern: 'source_for_claim',
    claim,
    framing:
      'These passages bear on the stated claim. For each, present a COMPLETE academic citation block ' +
      '(interviewee · quoted passage · timestamp · locItemUrl · suggestedCitation · fidelityNote) and then a ' +
      "one-sentence justification noting whether the passage SUPPORTS, COMPLICATES, or CONTRADICTS the claim, " +
      "grounded in the passage's actual words. If multiple passages bear on the claim, present ALL of them, " +
      "do not synthesize a single answer. If uncertaintyTier is anything other than \"low\", flag that the " +
      "transcript fidelity is not fully audited and recommend verification against the LoC audio.",
    results,
  }
}

// ── MCP server wiring ───────────────────────────────────────────────

const mcpServer = new Server(
  {
    name: 'civil-rights-history-archive',
    version: '0.2.0',
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
      resources: {},
    },
  },
)

const TOOL_DEFINITIONS = [
  {
    name: 'search_transcripts',
    description:
      'Citation-grade semantic search across the Library of Congress / Smithsonian NMAAHC civil rights oral history archive (136 interviews, 600+ hours). ' +
      'Returns up to `limit` passages ranked by Voyage rerank-2 relevance, with every primary-source field a researcher needs to cite the result: ' +
      'interviewee name, audio timestamp range (timestampStart/timestampEnd in seconds plus HH:MM:SS strings), Library of Congress catalog URL (locItemUrl), ' +
      'audit provenance ("audit-original" for the 127 interviews that went through the full Pass 1-8 audit cascade vs "ingestion-only" for the 9 added 2026-05-25), ' +
      'inferential-uncertainty tier ("low" / "medium" / "high" / "ingestion-only"), a one-line transcript-fidelity note (fidelityNote), and a Chicago-Manual-of-Style citation block (suggestedCitation). ' +
      'Use entry_number to restrict the search to a single interview when the user already knows whose voice they want.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The natural-language search query. Quotes, paraphrases, and topical questions are all supported; the embedding model is tuned for retrieval-style queries.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default 10, max 50). The reranker over-fetches by 3× internally so quality remains high even at small limits.',
        },
        entry_number: {
          type: 'number',
          description: 'Optional: restrict the search to a specific interviewee by their corpus entry number (1-138). Use list_leaders to discover entry_numbers.',
        },
        dedupe_by_entry: {
          type: 'boolean',
          description: 'Optional: when true, results are deduplicated by interviewee so the response shows the polyphonic record (one passage per voice). Default false. Useful for compare-perspectives-style queries; turn off if the same speaker\'s different moments are both wanted.',
        },
        include_persons: {
          type: 'boolean',
          description: 'Optional: when true, per-person catalog vectors (content_type="person") are included in the result set alongside archive passages. Default false so the tool returns ranked passages only, the citation-grade use case this tool was built for. Turn on for a cross-content search that surfaces both passage matches and the person page(s) most semantically relevant to the query.',
        },
        include_essays: {
          type: 'boolean',
          description: 'Optional: when true, curated-essay vectors (content_type="essay") are included in the result set alongside archive passages. Default false so the tool returns ranked passages only. Turn on for a cross-content search that also surfaces the public-domain and open-license essays whose text is most semantically relevant to the query.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_transcript',
    description:
      'Fetch every chunk of one interview in the corpus, stitched back into the original transcript order with full citation metadata on each chunk. ' +
      'Returns { interview, chunks } where `interview` carries entry-level metadata (entrySubject, locItemUrl, entryProvenance, uncertaintyTier, suggestedCitation, chunkCount) ' +
      'and `chunks` is the ordered list of passages each with timestampStart/timestampEnd, text, fidelityNote, and a suggestedCitation. ' +
      'Use this when the researcher wants the full primary source rather than a search-ranked excerpt.',
    inputSchema: {
      type: 'object',
      properties: {
        entry_number: {
          type: 'number',
          description: 'The corpus entry number of the interview (1-138). Use list_leaders to discover entry_numbers.',
        },
        interview_id: {
          type: 'string',
          description: 'DEPRECATED: legacy "entry-N" id string for backwards compatibility. Prefer entry_number.',
        },
      },
    },
  },
  {
    name: 'list_leaders',
    description:
      'List the interviewees in the archive with their corpus entry_number, name, and Library of Congress catalog URL. ' +
      'Useful for browsing the roster, confirming a particular person is in the collection, and discovering entry_numbers to pass to other tools. ' +
      'Returns up to `limit` records sorted by entry_number.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of records to return (default 200, max 500). The corpus currently has 136 entries.',
        },
      },
    },
  },
  {
    name: 'list_people',
    description:
      'List the people catalog: the 165 interviewees PLUS the 37 external historical figures who are discussed in the archive but not themselves interviewed (e.g., Martin Luther King Jr., Ella Baker, Malcolm X). ' +
      'Each record has slug, display_name, person_type ("interviewee" or "external_figure"), entry_number (for interviewees; null for external figures), a short role_preview, and birth/death years where known. ' +
      'Use person_type to filter to just one group. This complements list_leaders (interviewees only) by also surfacing the figures the movement was built around. To pull the passages where an external figure is discussed, pass their name as the query to search_transcripts, or set include_persons:true to retrieve their catalog page directly.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of records to return (default 250, max 500). The catalog currently has 202 people.',
        },
        person_type: {
          type: 'string',
          description: 'Optional filter: "interviewee" (people with an oral history in the corpus) or "external_figure" (people discussed but not interviewed). Omit to return both.',
        },
      },
    },
  },
  {
    name: 'list_essays',
    description:
      'List the curated essays layer: 23 public-domain / open-license essays (W. E. B. Du Bois, Booker T. Washington, Anna Julia Cooper, Ida B. Wells, and others) reproduced in full and cross-linked into the archive, organized under 10 thematic topics. ' +
      'With no argument, returns { topics, essays } (each essay has slug, title, authors, year, collection, themes). ' +
      'Pass a topic id or label (e.g., "youth-student-activism", "Family Influence") to return just the essays under that theme. ' +
      'Use this to find primary-text reading that illuminates a theme; pass an essay\'s subject as a query to search_transcripts (with include_essays:true) to retrieve passages from the essay body itself.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Optional topic id or label to filter by (e.g., "education", "Intergenerational Activism"). Omit to return the full catalog plus the topic taxonomy.',
        },
      },
    },
  },
  {
    name: 'compare_perspectives',
    description:
      'Research pattern: given a topic, surface how multiple interviewees in the archive discussed it differently. ' +
      'Returns up to 8 deduped-by-interviewee passages plus a `framing` field with the analytic instruction the model ' +
      'should use to present them (citation block per voice, surface tensions and agreements, do not synthesize). ' +
      'Use this when the user wants the polyphonic record on a topic rather than a single best match. ' +
      'Same pattern as the compare_perspectives MCP prompt, callable as a tool for clients that do not route prompts to the model.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'The civil rights topic or event to compare across interviews (e.g., "Bloody Sunday", "nonviolence as theology vs. tactic", "Black Power as ideology").',
        },
      },
      required: ['topic'],
    },
  },
  {
    name: 'trace_evolution',
    description:
      'Research pattern: given an interviewee and a topic, return passages from that interviewee\'s interview arranged ' +
      'chronologically by timestamp so the researcher can see how their framing of the topic evolves across the chapters of the interview. ' +
      'Resolves the interviewee name against the corpus roster (exact match preferred, partial substring fallback; errors if ambiguous). ' +
      'Same pattern as the trace_evolution MCP prompt, callable as a tool for clients that do not route prompts to the model.',
    inputSchema: {
      type: 'object',
      properties: {
        interviewee: {
          type: 'string',
          description: 'The interviewee whose evolution to trace. Name as it appears in the corpus (e.g., "Wheeler Parker Jr.", "Joseph Echols Lowery"). Use list_leaders if unsure.',
        },
        topic: {
          type: 'string',
          description: 'The topic whose evolution to trace across the chapters of the interview.',
        },
      },
      required: ['interviewee', 'topic'],
    },
  },
  {
    name: 'source_for_claim',
    description:
      'Research pattern: given a factual claim, quote, or paraphrase, find up to 8 transcript passages that bear on it. ' +
      'Returns passages plus a `framing` field that instructs the model to present each as a Chicago-style citation block ' +
      'AND label whether it SUPPORTS, COMPLICATES, or CONTRADICTS the claim. The polyphonic record is preserved (no dedupe). ' +
      'Use this for grant writers, journalists, and researchers grounding their work in primary sources. ' +
      'Same pattern as the source_for_claim MCP prompt, callable as a tool for clients that do not route prompts to the model.',
    inputSchema: {
      type: 'object',
      properties: {
        claim: {
          type: 'string',
          description: 'The claim, quote, or paraphrase to find sources for (e.g., "the dreamer can be killed but not the dream", "King\'s nonviolent approach was theological, not just tactical").',
        },
      },
      required: ['claim'],
    },
  },
]

const PROMPT_DEFINITIONS = [
  {
    name: 'compare_perspectives',
    description:
      'Given a civil rights topic or event, surface how multiple interviewees in the archive discussed it differently. Useful for revealing tensions, agreements, and complementary perspectives that a single interview would miss.',
    arguments: [
      { name: 'topic', description: 'The topic or event to compare across interviews.', required: true },
    ],
  },
  {
    name: 'trace_evolution',
    description:
      'Given an interviewee, trace how their framing or thinking about a particular topic evolved across the chapters of their interview. Useful for understanding personal trajectories within the broader Movement.',
    arguments: [
      { name: 'interviewee', description: 'The interviewee whose evolution to trace.', required: true },
      { name: 'topic', description: 'The topic whose evolution to trace.', required: true },
    ],
  },
  {
    name: 'source_for_claim',
    description:
      'Given a factual claim, quote, or paraphrase, find the transcript passages in the archive that most directly back or complicate it. Useful for grant writers, journalists, and researchers grounding their work in primary sources.',
    arguments: [
      { name: 'claim', description: 'The claim, quote, or paraphrase to find sources for.', required: true },
    ],
  },
]

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOL_DEFINITIONS,
}))

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  let result
  try {
    if (name === 'search_transcripts') {
      result = await searchTranscripts(args || {})
    } else if (name === 'get_transcript') {
      result = await getTranscript(args || {})
    } else if (name === 'list_leaders') {
      result = await listLeaders(args || {})
    } else if (name === 'list_people') {
      result = await listPeople(args || {})
    } else if (name === 'list_essays') {
      result = await listEssays(args || {})
    } else if (name === 'compare_perspectives') {
      result = await comparePerspectives(args || {})
    } else if (name === 'trace_evolution') {
      result = await traceEvolution(args || {})
    } else if (name === 'source_for_claim') {
      result = await sourceForClaim(args || {})
    } else {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      }
    }
  } catch (err) {
    // Distinguish a degraded upstream (Voyage / Pinecone unreachable, timed out,
    // or rate-limited) from a caller-side problem (bad arguments) so the client
    // can tell "the service is having trouble, retry later" from "fix the
    // request". The upstream helpers throw tagged messages; match on those.
    const msg = err?.message || String(err)
    const isUpstream = /voyage_embed_failed|pinecone_query_failed|voyage_rerank_failed|upstream_timeout/.test(msg)
    const prefix = isUpstream
      ? `Tool ${name} could not reach a backend service (this is a transient server-side issue, please retry): `
      : `Tool ${name} failed: `
    console.error(`[mcp] tool_error tool=${name} upstream=${isUpstream} msg=${msg}`)
    return {
      content: [{ type: 'text', text: prefix + msg }],
      isError: true,
    }
  }
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  }
})

mcpServer.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: PROMPT_DEFINITIONS,
}))

mcpServer.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  const promptArgs = args || {}
  if (name === 'compare_perspectives') {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Using the civil-rights-history-archive MCP server tools, compare how different interviewees ` +
              `in the Library of Congress / Smithsonian NMAAHC civil rights oral history collection discussed ` +
              `${promptArgs.topic || '<TOPIC>'}.\n\n` +
              `Workflow:\n` +
              `1. Call search_transcripts({query: "${promptArgs.topic || '<TOPIC>'}", limit: 6, dedupe_by_entry: true}) to find one passage per distinct interviewee, the dedupe parameter guarantees you see the polyphonic record rather than the same speaker twice.\n` +
              `2. The 6 results should already be 6 distinct voices. Aim to present 3-5 of them in the comparison.\n` +
              `3. For each interviewee, quote the relevant passage verbatim, then summarize their framing in one sentence.\n` +
              `4. After presenting all voices, surface the tensions, agreements, and complementary perspectives.\n\n` +
              `Citation requirements for each quoted passage:\n` +
              `- Interviewee name (entrySubject)\n` +
              `- Timestamp range (timestampStartStr–timestampEndStr)\n` +
              `- Library of Congress catalog URL (locItemUrl)\n` +
              `- Transcript-fidelity disclosure (fidelityNote)\n\n` +
              `Treat this as primary-source scholarship. The polyphonic record IS the answer, do not collapse the perspectives into a single synthetic view.`,
          },
        },
      ],
    }
  }
  if (name === 'trace_evolution') {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Using the civil-rights-history-archive MCP server tools, trace how ${promptArgs.interviewee || '<INTERVIEWEE>'} ` +
              `discussed ${promptArgs.topic || '<TOPIC>'} across the chapters of their interview in the Library of Congress / ` +
              `Smithsonian NMAAHC civil rights oral history collection.\n\n` +
              `Workflow:\n` +
              `1. Call list_leaders to find ${promptArgs.interviewee || '<INTERVIEWEE>'}'s entry_number.\n` +
              `2. Call search_transcripts({query: "${promptArgs.topic || '<TOPIC>'}", entry_number: <N>, limit: 10}) to ` +
              `get the most relevant passages from this specific interview.\n` +
              `3. Sort the results by timestampStart (early → late in the interview).\n` +
              `4. Present them as a chronological progression, quoting each passage with its timestamp range.\n` +
              `5. After the quotes, summarize how the framing evolves across the interview.\n\n` +
              `Citation requirements for each quoted passage:\n` +
              `- Timestamp range (timestampStartStr–timestampEndStr), the audio offset is the chapter anchor\n` +
              `- Library of Congress catalog URL (locItemUrl)\n` +
              `- Transcript-fidelity disclosure (fidelityNote)`,
          },
        },
      ],
    }
  }
  if (name === 'source_for_claim') {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Using the civil-rights-history-archive MCP server tools, find primary-source transcript passages ` +
              `in the Library of Congress / Smithsonian NMAAHC civil rights oral history collection that bear on this claim:\n\n` +
              `   "${promptArgs.claim || '<CLAIM>'}"\n\n` +
              `Workflow:\n` +
              `1. Call search_transcripts({query: "${promptArgs.claim || '<CLAIM>'}", limit: 8}).\n` +
              `2. For each returned passage, present a COMPLETE ACADEMIC CITATION BLOCK including:\n` +
              `   - Interviewee name (entrySubject)\n` +
              `   - The passage text itself, quoted faithfully\n` +
              `   - Timestamp range (timestampStartStr–timestampEndStr)\n` +
              `   - Library of Congress catalog URL (locItemUrl), the verifiable primary source\n` +
              `   - Transcript-fidelity transparency flag (fidelityNote), researchers MUST see this\n` +
              `   - The pre-formatted Chicago citation (suggestedCitation field)\n` +
              `3. Below each citation, note whether the passage SUPPORTS, COMPLICATES, or CONTRADICTS the claim, ` +
              `with a one-sentence justification grounded in the passage's actual words.\n\n` +
              `Critical reporting requirements:\n` +
              `- If multiple passages bear on the claim, present ALL of them, the polyphonic record is the point of an oral history archive.\n` +
              `- Do NOT synthesize a single answer. Let the primary sources speak.\n` +
              `- Each result carries a fidelityNote stating its settled provenance (LoC-Verified or Audio-Limited Source). ` +
              `Pass the fidelityNote through verbatim. It is a statement of fact about a finished transcript; do not add your own "unverified" or "verify against audio" caveats.\n` +
              `- If the search returns no results, say so directly. Do not paraphrase from your training data, this corpus is the source of truth.\n\n` +
              `A Chicago-Manual-of-Style citation template (the suggestedCitation field follows this pattern):\n` +
              `   [Interviewee], interview, Civil Rights History Project, American Folklife Center, Library of Congress ` +
              `in association with the Smithsonian National Museum of African American History and Culture, [locItemUrl], at [timestampStart]–[timestampEnd].`,
          },
        },
      ],
    }
  }
  throw new Error(`Unknown prompt: ${name}`)
})

// ── MCP resources ───────────────────────────────────────────────────
// Resource-aware clients (e.g. Claude Desktop) can browse and read these
// without issuing tool calls. We expose static catalogs (roster, people,
// essays, a corpus overview) and a transcript resource template that reuses
// the existing getTranscript path. Reading a transcript resource still hits
// Pinecone; the catalog resources are served from the baked JSON.

const RESOURCES = [
  {
    uri: 'civilrights://corpus/overview',
    name: 'Corpus overview',
    description: 'Counts, audit-tier legend, and what the archive contains.',
    mimeType: 'application/json',
  },
  {
    uri: 'civilrights://leaders',
    name: 'Interviewee roster',
    description: 'All interviewees with entry_number, name, LoC catalog URL, and audit provenance.',
    mimeType: 'application/json',
  },
  {
    uri: 'civilrights://people',
    name: 'People catalog',
    description: 'Interviewees plus external historical figures discussed in the archive.',
    mimeType: 'application/json',
  },
  {
    uri: 'civilrights://essays',
    name: 'Curated essays catalog',
    description: 'Public-domain / open-license essays and the thematic topic taxonomy.',
    mimeType: 'application/json',
  },
]

const RESOURCE_TEMPLATES = [
  {
    uriTemplate: 'civilrights://transcript/{entry_number}',
    name: 'Full interview transcript',
    description: 'Every chunk of one interview, stitched in order with citation metadata. entry_number is 1-142 (use list_leaders / list_people to discover it).',
    mimeType: 'application/json',
  },
]

mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: RESOURCES }))
mcpServer.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
  resourceTemplates: RESOURCE_TEMPLATES,
}))

mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params
  const asJson = (value) => ({
    contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(value, null, 2) }],
  })

  if (uri === 'civilrights://leaders') return asJson(await loadLeaders())
  if (uri === 'civilrights://people') return asJson(await loadPeople())
  if (uri === 'civilrights://essays') return asJson(await loadEssays())
  if (uri === 'civilrights://corpus/overview') {
    const [leaders, people, essays] = await Promise.all([loadLeaders(), loadPeople(), loadEssays()])
    return asJson({
      name: 'Civil Rights History Project oral history archive',
      source: 'Library of Congress American Folklife Center + Smithsonian NMAAHC',
      interviews: leaders.length,
      people: {
        total: people.length,
        interviewees: people.filter((p) => p.person_type === 'interviewee').length,
        external_figures: people.filter((p) => p.person_type === 'external_figure').length,
      },
      essays: (essays.essays || []).length,
      essay_topics: (essays.topics || []).length,
      audit_tier_legend: {
        high: 'Cross-referenced line by line against the Library of Congress published transcript.',
        'publication-block': 'LoC edition differs from the verbatim recording; both readings preserved.',
        'not-auditable': 'Source recording carries an inherent audio limit (truncation or degradation).',
        'ingestion-only': 'Added via the streamlined LoC-heal ingestion path; not through the full Pass 1-8 cascade.',
      },
      tools: TOOL_DEFINITIONS.map((t) => t.name),
    })
  }

  const m = uri.match(/^civilrights:\/\/transcript\/(\d+)$/)
  if (m) {
    const transcript = await getTranscript({ entry_number: Number(m[1]) })
    return asJson(transcript)
  }

  throw new Error(`Unknown resource: ${uri}`)
})

// ── HTTP transport via Express ──────────────────────────────────────

const app = express()
// Fly terminates TLS at its edge and forwards X-Forwarded-For; trust it so
// req.ip is the real client IP (the rate limiter keys on it).
app.set('trust proxy', true)

// CORS: the endpoint is public and read-only, so a permissive policy is fine
// and lets browser-based MCP clients / the MCP Inspector connect. Preflight is
// answered before any heavier middleware.
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id, Last-Event-ID')
  res.set('Access-Control-Expose-Headers', 'Mcp-Session-Id')
  if (req.method === 'OPTIONS') return res.status(204).end()
  next()
})

app.use(express.json({ limit: '4mb' }))

// Structured per-request logging (HTTP mode only; never reaches stdio). Logs
// metadata ONLY, never query text, honoring the connector's no-query-logging
// promise: the JSON-RPC method and tool/resource name are protocol identifiers,
// not user content.
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const rec = {
      t: new Date().toISOString(),
      ip: req.ip,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - start,
    }
    if (req.path === '/mcp' && req.body && typeof req.body === 'object') {
      rec.rpc = req.body.method || null
      if (req.body.params && req.body.params.name) rec.tool = req.body.params.name
    }
    console.log(JSON.stringify(rec))
  })
  next()
})

// ── Rate limiter (cost guard, not auth) ────────────────────────────
// In-process per-IP token bucket. Caps Voyage + Pinecone spend from scraping
// or a hammering client; legitimate single-user usage is unaffected. Per
// machine, so it is a soft cost guard layered on Fly's concurrency limits, not
// a security boundary.
const RL_CAPACITY = Number(process.env.MCP_RATE_BURST) || 30
const RL_REFILL_PER_SEC = Number(process.env.MCP_RATE_REFILL_PER_SEC) || 1 // 60/min
const _rateLimiter = createRateLimiter({ capacity: RL_CAPACITY, refillPerSec: RL_REFILL_PER_SEC })

function rateLimit(req, res, next) {
  const { allowed, retryAfter } = _rateLimiter.take(req.ip || 'unknown')
  if (allowed) return next()
  res.set('Retry-After', String(retryAfter))
  return res.status(429).json({
    jsonrpc: '2.0',
    error: { code: -32029, message: `Rate limit exceeded. Retry after ${retryAfter}s.` },
    id: req.body?.id ?? null,
  })
}

// Liveness probe: trivial, must stay cheap so scale-to-zero wakeups are fast.
app.get('/healthz', (req, res) => res.json({ ok: true }))

// Readiness probe: reports config presence + loaded roster counts WITHOUT
// touching Voyage / Pinecone (so it does not tax a cold wake or bill upstreams).
app.get('/readyz', async (req, res) => {
  try {
    const [leaders, people, essays] = await Promise.all([loadLeaders(), loadPeople(), loadEssays()])
    res.json({
      ok: true,
      config: {
        pinecone: Boolean(PINECONE_API_KEY && PINECONE_HOST),
        voyage: Boolean(VOYAGE_API_KEY),
        rerank: RERANK_ENABLED,
      },
      rosters: {
        leaders: leaders.length,
        people: people.length,
        essays: (essays.essays || []).length,
      },
      caches: { embed: _embedCache.size, retrieve: _retrieveCache.size },
    })
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || String(err) })
  }
})

// MCP endpoint. The StreamableHTTPServerTransport handles the SSE
// upgrade and the bidirectional message stream over HTTP per the MCP
// spec; clients (Claude Desktop, Claude.ai Custom Connectors) connect
// by POSTing JSON-RPC messages here.
//
// Express v4 does NOT auto-catch promise rejections from async route
// handlers (Express v5 does, but the deployment target is v4 per the
// existing package.json pin), so the body is wrapped in an explicit
// try / catch. On error we log the underlying exception server-side
// and return a clean JSON 500 to the client rather than letting the
// rejection propagate as an unhandled promise that could crash the
// Node process under default --unhandled-rejections=throw behavior.
// This stateless server has no server-initiated SSE stream and no session to
// terminate, so GET and DELETE on /mcp are not supported. Answer them with a
// clean JSON-RPC 405 (+ Allow header) instead of Express's default 404 HTML,
// which some clients probe for and mis-handle.
app.get('/mcp', (req, res) => {
  res.set('Allow', 'POST')
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method Not Allowed: this MCP endpoint is stateless; use POST /mcp.' },
    id: null,
  })
})
app.delete('/mcp', (req, res) => {
  res.set('Allow', 'POST')
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method Not Allowed: this MCP endpoint is stateless; there is no session to delete.' },
    id: null,
  })
})

app.post('/mcp', rateLimit, async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode; each request is independent
  })
  res.on('close', () => transport.close().catch(() => {}))
  try {
    await mcpServer.connect(transport)
    await transport.handleRequest(req, res, req.body)
  } catch (err) {
    console.error('MCP /mcp handler error:', err)
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal MCP server error',
        },
        id: req.body?.id ?? null,
      })
    }
    try {
      await transport.close()
    } catch {
      // Already closed or never opened; ignore.
    }
  }
})

// ── Transport dispatch ──────────────────────────────────────────────
//
// Two run modes:
//   1. HTTP (default), `node server.mjs`. Listens on PORT and serves
//      /mcp via StreamableHTTPServerTransport. This is the Fly.io
//      deployment target and the local-dev target for the website's
//      /retrieve Netlify Function proxy.
//   2. stdio, `node server.mjs --stdio` (or MCP_TRANSPORT=stdio).
//      Used by desktop MCP clients (Codex Desktop, Claude Desktop)
//      that spawn the server as a subprocess and communicate over
//      stdin/stdout per the MCP stdio transport. No HTTP listener;
//      the Express app is set up above but never told to listen.
//
// CRITICAL for stdio mode: nothing must write to stdout besides the
// transport itself, stray prints would corrupt the JSON-RPC stream.
// All existing console.log calls in this file either run only in HTTP
// mode (the "listening on" line below) or use console.error/.warn
// (which go to stderr, safe). Future additions to this file must
// preserve that discipline.

const useStdio = process.argv.includes('--stdio') || process.env.MCP_TRANSPORT === 'stdio'

if (useStdio) {
  const transport = new StdioServerTransport()
  await mcpServer.connect(transport)
  console.error('[mcp] stdio transport ready')
} else {
  const PORT = parseInt(process.env.PORT, 10) || 3001
  const server = app.listen(PORT, () => {
    console.log(`Civil Rights History MCP server listening on :${PORT}`)
  })

  // Periodically drop idle rate-limiter buckets so memory does not grow with
  // the number of distinct client IPs seen. unref() so it never holds the
  // process open on its own.
  const sweepTimer = setInterval(() => _rateLimiter.sweep(), 10 * 60 * 1000)
  sweepTimer.unref()

  // Graceful shutdown: Fly sends SIGTERM (then SIGINT) on deploy/scale-down.
  // Stop accepting new connections and let in-flight tool calls drain before
  // exiting, instead of being hard-killed mid-response.
  let shuttingDown = false
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => {
      if (shuttingDown) return
      shuttingDown = true
      console.log(`[mcp] ${signal} received, draining connections...`)
      clearInterval(sweepTimer)
      server.close(() => {
        console.log('[mcp] closed cleanly')
        process.exit(0)
      })
      // Hard cap so a stuck connection cannot block shutdown forever.
      setTimeout(() => {
        console.error('[mcp] drain timeout, forcing exit')
        process.exit(0)
      }, 10000).unref()
    })
  }
}
