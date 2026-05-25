/**
 * Civil Rights History Project — Remote MCP Server
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
 *     stays self-contained — track those files as the canonical source.
 *
 * Three tools:
 *
 *   - search_transcripts(query, limit?, entry_number?)
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
 * Plus three canned research prompts (registered as MCP prompts) that
 * help researchers structure their queries:
 *
 *   - compare_perspectives — given a topic, surface how multiple
 *     interviewees discussed it differently
 *   - trace_evolution — given an interviewee, surface how their framing
 *     of a topic changed across the chapters of their interview
 *   - source_for_claim — given a claim, quote, or paraphrase, find the
 *     transcript passages that back or complicate it. Tuned for
 *     academic-citation use: emits Chicago-style citation blocks with
 *     LoC archive URLs, exact timestamps, and transcript-fidelity
 *     transparency flags.
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
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

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

// ── Voyage query embedding ─────────────────────────────────────────
// Mirrors rag/embed.mjs::embedQuery. input_type='query' routes through
// Voyage's retrieval-tuned query encoder (not the document encoder used
// at ingest time).

const EMBED_RETRY_MAX = 3
const EMBED_RETRY_BACKOFF_MS = 500

async function embedQuery(query) {
  let attempt = 0
  while (true) {
    const res = await fetch(VOYAGE_EMBED_ENDPOINT, {
      method: 'POST',
      headers: voyageHeaders(),
      body: JSON.stringify({
        input: [query],
        model: VOYAGE_MODEL,
        input_type: 'query',
      }),
    })
    if (res.ok) {
      const data = await res.json()
      return data?.data?.[0]?.embedding
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
  const res = await fetch(`${PINECONE_HOST}/query`, {
    method: 'POST',
    headers: pineconeHeaders(),
    body: JSON.stringify(body),
  })
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
  const res = await fetch(VOYAGE_RERANK_ENDPOINT, {
    method: 'POST',
    headers: voyageHeaders(),
    body: JSON.stringify({
      query,
      documents,
      model: VOYAGE_RERANK_MODEL,
      top_k: Math.min(topN, documents.length),
      return_documents: true,
    }),
  })
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

// ── Citation formatting ────────────────────────────────────────────
// Build a Chicago-Manual-of-Style-style citation block from a chunk's
// Pinecone metadata. This is the academic-grade representation the
// MCP client (Claude) needs in order to cite primary sources rigorously.

function formatTimestamp(seconds) {
  if (seconds == null || !Number.isFinite(seconds)) return null
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function fidelityNote(provenance, tier) {
  if (provenance === 'ingestion-only') {
    return 'Single-pass ingestion; transcript fidelity not yet audited against the Library of Congress canonical source.'
  }
  if (provenance === 'audit-original') {
    if (tier === 'low') return 'Audited transcript (Pass 1–8 + LoC heal); high confidence in fidelity.'
    if (tier === 'medium') return 'Audited transcript with residual uncertainty; verify against audio for high-stakes citations.'
    if (tier === 'high') return 'Audited transcript with substantial residual uncertainty; treat as a research lead, verify against audio.'
    return 'Audited transcript.'
  }
  return 'Provenance unknown.'
}

function buildCitation(metadata, { timestampStart, timestampEnd } = {}) {
  const interviewee = metadata.entry_subject || 'Unknown interviewee'
  const locUrl = metadata.loc_item_url || null
  const tsStartStr = formatTimestamp(timestampStart)
  const tsEndStr = formatTimestamp(timestampEnd)
  const tsRange = tsStartStr && tsEndStr ? `${tsStartStr}–${tsEndStr}` : tsStartStr || ''
  const archiveClause = locUrl ? `, ${locUrl}` : ''
  const tsClause = tsRange ? `, at ${tsRange}` : ''
  return (
    `${interviewee}, interview, Civil Rights History Project, American Folklife Center, ` +
    `Library of Congress in association with the Smithsonian National Museum of African American ` +
    `History and Culture${archiveClause}${tsClause}.`
  )
}

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

// Hard caps and floors on user-supplied parameters. The MCP client is
// usually a well-behaved LLM but the surface is internet-facing so we
// validate as if it were any other public endpoint. The query cap of
// 4000 chars is roughly the upper bound of useful semantic-search
// queries (text-embedding-3-small accepts up to 8191 tokens but most
// useful queries are short) and prevents one client from running up a
// large OpenAI embeddings bill by sending a megabyte of text. The limit
// cap of 50 prevents one query from pulling the entire ranked corpus
// over the wire when the model probably only needed the top 10.
const MAX_QUERY_LENGTH = 4000
const MAX_LIMIT = 50
const DEFAULT_LIMIT = 10
const MIN_LIMIT = 1

function clampLimit(rawLimit) {
  const n = Number(rawLimit)
  if (!Number.isFinite(n)) return DEFAULT_LIMIT
  return Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, Math.floor(n)))
}

// ── Tool implementations ────────────────────────────────────────────

// Convert a Pinecone retrieve() result into the citation-grade payload
// shape that the MCP tool returns. Centralized so search_transcripts
// and get_transcript both produce consistent fields.
function toCitationPayload(result) {
  const m = result.metadata || {}
  const text = result.text || m.text || ''
  const timestampStart = Number.isFinite(m.timestamp_start_seconds) ? m.timestamp_start_seconds : null
  const timestampEnd = Number.isFinite(m.timestamp_end_seconds) ? m.timestamp_end_seconds : null
  const provenance = m.entry_provenance || null
  const uncertaintyTier = m.inferential_uncertainty_tier || null
  const uncertaintyScore = Number.isFinite(m.inferential_uncertainty_score) ? m.inferential_uncertainty_score : null
  return {
    // identity
    id: result.id,
    entryNumber: m.entry_number ?? null,
    entrySubject: m.entry_subject || null,
    chunkIndex: m.chunk_index ?? null,

    // passage
    text,
    textPreview: text.length > 200 ? text.slice(0, 200) + '…' : text,

    // citation
    locItemUrl: m.loc_item_url || null,
    timestampStart,
    timestampEnd,
    timestampStartStr: formatTimestamp(timestampStart),
    timestampEndStr: formatTimestamp(timestampEnd),

    // transparency
    entryProvenance: provenance,
    uncertaintyTier,
    uncertaintyScore,
    fidelityNote: fidelityNote(provenance, uncertaintyTier),

    // ranking
    pineconeScore: result.pineconeScore ?? null,
    rerankScore: result.rerankScore ?? null,
    similarity: result.rerankScore ?? result.pineconeScore ?? null,

    // pre-formatted citation block
    suggestedCitation: buildCitation(m, { timestampStart, timestampEnd }),

    // legacy-compat fields for existing prompts that reference these names
    interviewName: m.entry_subject || null,
    documentId: m.entry_number != null ? `entry-${m.entry_number}` : null,
    timestamp: formatTimestamp(timestampStart) || '',
    type: m.chunk_type || 'clip',
    videoEmbedLink: null,
    sourcePath: m.source_path || null,
    sourceExt: m.source_ext || null,
  }
}

async function searchTranscripts({ query, limit = DEFAULT_LIMIT, entry_number = null }) {
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

  // Optional metadata filter: restrict the search to a specific entry.
  // Useful when the client already knows which interview to draw from
  // (e.g., "what does Wheeler Parker say specifically about Bryant's store?").
  let filter = null
  if (entry_number != null) {
    const n = Number(entry_number)
    if (!Number.isFinite(n) || n < 1) {
      throw new Error('entry_number must be a positive integer')
    }
    filter = { entry_number: { $eq: Math.floor(n) } }
  }

  // Stage-1 net: ask Pinecone for 3× the desired limit so the
  // stage-2 reranker has enough candidates to discriminate.
  const topK = Math.max(clampedLimit * 3, 20)
  const results = await retrieve(trimmed, { topK, topN: clampedLimit, filter })
  return results.map(toCitationPayload)
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
  // irrelevant — we re-sort by chunk_index below.
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

// ── MCP server wiring ───────────────────────────────────────────────

const mcpServer = new Server(
  {
    name: 'civil-rights-history-archive',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
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
    } else {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      }
    }
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Tool ${name} failed: ${err.message}` }],
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
              `1. Call search_transcripts({query: "${promptArgs.topic || '<TOPIC>'}", limit: 12}) to find candidate passages.\n` +
              `2. Group the results by entrySubject (interviewee). Aim for 3-5 distinct voices.\n` +
              `3. For each interviewee, quote the relevant passage verbatim, then summarize their framing in one sentence.\n` +
              `4. After presenting all voices, surface the tensions, agreements, and complementary perspectives.\n\n` +
              `Citation requirements for each quoted passage:\n` +
              `- Interviewee name (entrySubject)\n` +
              `- Timestamp range (timestampStartStr–timestampEndStr)\n` +
              `- Library of Congress catalog URL (locItemUrl)\n` +
              `- Transcript-fidelity disclosure (fidelityNote)\n\n` +
              `Treat this as primary-source scholarship. The polyphonic record IS the answer — do not collapse the perspectives into a single synthetic view.`,
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
              `- Timestamp range (timestampStartStr–timestampEndStr) — the audio offset is the chapter anchor\n` +
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
              `   - Library of Congress catalog URL (locItemUrl) — the verifiable primary source\n` +
              `   - Transcript-fidelity transparency flag (fidelityNote) — researchers MUST see this\n` +
              `   - The pre-formatted Chicago citation (suggestedCitation field)\n` +
              `3. Below each citation, note whether the passage SUPPORTS, COMPLICATES, or CONTRADICTS the claim, ` +
              `with a one-sentence justification grounded in the passage's actual words.\n\n` +
              `Critical reporting requirements:\n` +
              `- If multiple passages bear on the claim, present ALL of them — the polyphonic record is the point of an oral history archive.\n` +
              `- Do NOT synthesize a single answer. Let the primary sources speak.\n` +
              `- If entryProvenance is "ingestion-only" or uncertaintyTier is "medium"/"high", explicitly flag that the ` +
              `transcript fidelity is not fully audited and recommend the researcher verify against the LoC audio.\n` +
              `- If the search returns no results, say so directly. Do not paraphrase from your training data — this corpus is the source of truth.\n\n` +
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

// ── HTTP transport via Express ──────────────────────────────────────

const app = express()
app.use(express.json({ limit: '4mb' }))

// Health endpoint for deployment-environment probes (uptime monitors,
// load balancers).
app.get('/healthz', (req, res) => res.json({ ok: true }))

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
app.post('/mcp', async (req, res) => {
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

const PORT = parseInt(process.env.PORT, 10) || 3001
app.listen(PORT, () => {
  console.log(`Civil Rights History MCP server listening on :${PORT}`)
})
