/**
 * Civil Rights History Project — Remote MCP Server
 *
 * Exposes the Library of Congress / Smithsonian NMAAHC oral history
 * archive to Claude Desktop, Claude.ai Custom Connectors, and any other
 * MCP-compatible client by URL. Three tools:
 *
 *   - search_transcripts(query, limit?)
 *       Semantic search across the corpus. Uses the same embeddings
 *       collection the React frontend already populates via the
 *       generateEmbedding Cloud Function in /functions/index.js, so
 *       there is one substrate for vector search shared by the web app
 *       and this MCP server.
 *
 *   - get_transcript(interview_id)
 *       Full interview metadata: chapter breaks, per-chapter summaries,
 *       topic categories, related events, keywords, engagement scores.
 *       Mirrors the existing src/services/firebase.js getInterviewData
 *       and getInterviewSegments helpers.
 *
 *   - list_leaders(limit?)
 *       Roster of interviewees with name, role, total minutes,
 *       thumbnail URL, and brief summary. For browsing the archive
 *       without a specific query in mind.
 *
 * Plus three canned research prompts (registered as MCP prompts) that
 * help grant writers and researchers structure their queries:
 *
 *   - compare_perspectives — given a topic, surface how multiple
 *     interviewees discussed it differently
 *   - trace_evolution — given an interviewee, surface how their framing
 *     of a topic changed across the chapters of their interview
 *   - source_for_claim — given a claim or quote, find the most relevant
 *     transcript passages backing or complicating it
 *
 * Deployment target is intentionally flexible: the server uses the
 * StreamableHTTP transport from the MCP TypeScript SDK and Express, so
 * it can run anywhere Node.js + a public HTTP endpoint are available
 * (Fly.io, Railway, Render, a bare VPS). Cloudflare Workers is also an
 * option but requires the Firebase Admin SDK alternatives that work
 * inside the Workers runtime.
 *
 * Authentication: this skeleton does NOT require auth on the MCP
 * endpoint -- the archive is intended as a public-readable surface,
 * matching the broader project's goal of making the Library of Congress
 * collection "intuitive and engaging" per the README. If the team
 * decides to gate the connector behind OAuth 2.1 for Anthropic
 * directory inclusion (per the Connector partnership process Eric
 * documented in his project memory), the auth layer plugs in at the
 * Express middleware level before the StreamableHTTP transport.
 *
 * Required environment variables:
 *   FIREBASE_SERVICE_ACCOUNT_PATH   path to the Firebase service-account JSON
 *   OPENAI_API_KEY                  for query embedding via text-embedding-3-small
 *   PORT                            HTTP listen port (default 3001)
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
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import OpenAI from 'openai'

const COLLECTION_INTERVIEW_INDEX = 'interviewIndex'
const COLLECTION_EMBEDDINGS = 'embeddings'

// ── Firebase Admin init ─────────────────────────────────────────────
// Two ways to provide service-account credentials, in priority order:
//   1. FIREBASE_SERVICE_ACCOUNT_JSON  -- the full JSON inline. Preferred
//      for Fly.io / Railway / Render and any other host where secrets
//      are env vars rather than mounted files. Set via:
//          flyctl secrets set FIREBASE_SERVICE_ACCOUNT_JSON="$(cat sa.json)"
//   2. FIREBASE_SERVICE_ACCOUNT_PATH  -- absolute path to a JSON file.
//      Preferred for local development and for hosts that mount secrets
//      as files (Kubernetes, Docker volumes, GCE metadata).
// If both are set, the inline JSON wins so the env var takes precedence
// over a stale file path. If neither is set, the process exits early
// with a clear error rather than failing at first Firestore call.

const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH

let firebaseCredential
if (saJson) {
  try {
    firebaseCredential = cert(JSON.parse(saJson))
  } catch (err) {
    console.error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON:', err.message)
    process.exit(1)
  }
} else if (saPath) {
  firebaseCredential = cert(saPath)
} else {
  console.error(
    'Either FIREBASE_SERVICE_ACCOUNT_JSON (inline JSON) or ' +
      'FIREBASE_SERVICE_ACCOUNT_PATH (file path) env var is required',
  )
  process.exit(1)
}

initializeApp({ credential: firebaseCredential })
const db = getFirestore()

// ── OpenAI init ──────────────────────────────────────────────────────

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── Helpers ─────────────────────────────────────────────────────────

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  if (magA === 0 || magB === 0) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

async function embedQuery(text) {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return res.data[0].embedding
}

// ── Tool implementations ────────────────────────────────────────────

async function searchTranscripts({ query, limit = 10 }) {
  const queryEmbedding = await embedQuery(query)

  // The existing Cloud Function vectorSearch in functions/index.js does
  // pagination + filter logic; we replicate the core lookup here.
  // Production note: for larger corpora, swap this in-memory scan for
  // Firestore's vector-search index once the corpus exceeds ~50K rows.
  const snapshot = await db.collection(COLLECTION_EMBEDDINGS).get()
  const scored = []
  snapshot.forEach((doc) => {
    const data = doc.data()
    if (!data.embedding) return
    scored.push({
      id: doc.id,
      documentId: data.documentId || data.interviewId || data.topicId,
      segmentId: data.segmentId || null,
      topic: data.topic || data.keyword || 'Untitled',
      timestamp: data.timestamp || '',
      textPreview: data.textPreview || '',
      interviewName: data.interviewName || data.name || '',
      type: data.type || (data.topicId ? 'topic' : data.interviewId ? 'interview' : 'clip'),
      videoEmbedLink: data.videoEmbedLink || null,
      similarity: cosineSimilarity(queryEmbedding, data.embedding),
    })
  })
  scored.sort((a, b) => b.similarity - a.similarity)
  return scored.slice(0, limit)
}

async function getTranscript({ interview_id }) {
  const docRef = db.collection(COLLECTION_INTERVIEW_INDEX).doc(interview_id)
  const docSnap = await docRef.get()
  if (!docSnap.exists) {
    return { error: `No interview found with id ${interview_id}` }
  }
  const interview = { id: docSnap.id, ...docSnap.data() }

  // Sub-summaries (chapters) live in a sub-collection.
  const subSnap = await db
    .collection(COLLECTION_INTERVIEW_INDEX)
    .doc(interview_id)
    .collection('subSummaries')
    .get()
  const chapters = subSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

  return { interview, chapters }
}

async function listLeaders({ limit = 200 }) {
  const snapshot = await db
    .collection(COLLECTION_INTERVIEW_INDEX)
    .limit(limit)
    .get()
  return snapshot.docs.map((doc) => {
    const d = doc.data()
    return {
      id: doc.id,
      name: d.name || doc.id,
      role: d.role || d.roleSimplified || 'Unknown',
      total_minutes: d.totalMinutes || 0,
      thumbnail_url: d.thumbnailUrl || null,
      video_embed_link: d.videoEmbedLink || null,
    }
  })
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
      'Semantic search across the Library of Congress / Smithsonian NMAAHC civil rights oral history archive. Returns up to `limit` clips, topics, or interviews ranked by relevance to the query. Each result includes a documentId, a topic label, a textPreview, the interviewee name when available, and a similarity score.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The natural-language search query.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default 10).',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_transcript',
    description:
      'Fetch the full metadata for one interview by its interview_id (document name in the interviewIndex Firestore collection). Returns the interview-level fields (name, role, duration, summary, key themes) plus the array of chapter summaries with their topic categories, related events, keywords, and engagement scores.',
    inputSchema: {
      type: 'object',
      properties: {
        interview_id: {
          type: 'string',
          description: 'The Firestore document name, e.g. "Aaron Dixon_interview_20250704_170306".',
        },
      },
      required: ['interview_id'],
    },
  },
  {
    name: 'list_leaders',
    description:
      'List the interviewees in the archive. Useful for browsing without a specific query in mind, or for confirming that a particular person is in the collection. Returns up to `limit` records with id, name, role, total minutes, thumbnail URL, and video embed link.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of records to return (default 200).',
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
            text: `Using the civil-rights-history-archive MCP server tools (search_transcripts, get_transcript, list_leaders), compare how different interviewees in the Library of Congress civil rights oral history collection discussed ${promptArgs.topic || '<TOPIC>'}. Surface tensions, agreements, and complementary perspectives. Quote the relevant transcript passages with their interviewee attribution and timestamp.`,
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
            text: `Using the civil-rights-history-archive MCP server tools, trace how ${promptArgs.interviewee || '<INTERVIEWEE>'}'s framing of ${promptArgs.topic || '<TOPIC>'} evolved across the chapters of their interview. Pull the chapter summaries via get_transcript and present the progression chronologically with anchor quotes from each chapter.`,
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
            text: `Using the civil-rights-history-archive MCP server tools, find the transcript passages in the Library of Congress civil rights oral history collection that most directly back or complicate this claim: "${promptArgs.claim || '<CLAIM>'}". For each passage, give the interviewee name, the timestamp, the textPreview, and a one-sentence note on whether the passage supports, complicates, or contradicts the claim.`,
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
app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode; each request is independent
  })
  res.on('close', () => transport.close().catch(() => {}))
  await mcpServer.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

const PORT = parseInt(process.env.PORT, 10) || 3001
app.listen(PORT, () => {
  console.log(`Civil Rights History MCP server listening on :${PORT}`)
})
