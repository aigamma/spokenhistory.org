// netlify/functions/retrieve.mjs
//
// Public-facing retrieval endpoint for the civil-rights React frontend.
// Proxies POST /retrieve calls to Pinecone (civil-rights index) +
// Voyage AI (voyage-3 embedding + rerank-2). API keys live in the
// Netlify environment, never the client bundle.
//
// Returns the same citation-grade payload shape that the MCP server
// emits (toCitationPayload in mcp-server/server.mjs) so UI components
// can render either source identically.
//
// Endpoint shape:
//   POST /.netlify/functions/retrieve
//   Body: { query: string, topK?: number, topN?: number, filter?: object, namespace?: string }
//   Response: { results: CitationPayload[], meta: { rerankEnabled, model, ... } }
//
// Required environment variables (set in Netlify dashboard):
//   PINECONE_API_KEY
//   PINECONE_HOST
//   VOYAGE_API_KEY
// Optional:
//   PINECONE_INDEX (default 'civil-rights')
//   VOYAGE_MODEL (default 'voyage-3')
//   VOYAGE_RERANK_MODEL (default 'rerank-2')
//   RETRIEVE_RERANK_ENABLED (default 'true')
//   RETRIEVE_ALLOWED_ORIGINS (comma-separated list, default '*')
//
// The function is intentionally self-contained — no imports from the
// rag/ workspace — so Netlify's function bundler doesn't have to chase
// dependencies across directory boundaries. Track rag/embed.mjs +
// rag/retrieve.mjs as upstream sources of truth if the retrieval
// internals evolve.

const PINECONE_API_VERSION = '2024-07';
const VOYAGE_EMBED_ENDPOINT = 'https://api.voyageai.com/v1/embeddings';
const VOYAGE_RERANK_ENDPOINT = 'https://api.voyageai.com/v1/rerank';

const DEFAULT_TOP_K = 30;
const DEFAULT_TOP_N = 8;
const MAX_QUERY_LENGTH = 4000;
const MAX_TOP_N = 50;

function getEnv() {
  const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
  const PINECONE_HOST = process.env.PINECONE_HOST;
  const PINECONE_INDEX = process.env.PINECONE_INDEX || 'civil-rights';
  const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
  const VOYAGE_MODEL = process.env.VOYAGE_MODEL || 'voyage-3';
  const VOYAGE_RERANK_MODEL = process.env.VOYAGE_RERANK_MODEL || 'rerank-2';
  const RERANK_ENABLED = (process.env.RETRIEVE_RERANK_ENABLED || 'true').toLowerCase() !== 'false';
  const ALLOWED_ORIGINS = (process.env.RETRIEVE_ALLOWED_ORIGINS || '*')
    .split(',').map((s) => s.trim()).filter(Boolean);
  return {
    PINECONE_API_KEY, PINECONE_HOST, PINECONE_INDEX,
    VOYAGE_API_KEY, VOYAGE_MODEL, VOYAGE_RERANK_MODEL,
    RERANK_ENABLED, ALLOWED_ORIGINS,
  };
}

function corsHeaders(reqOrigin, allowed) {
  // If '*' is allowed, accept any origin. Otherwise echo the request's
  // origin only when it matches the whitelist (else omit the header,
  // which causes the browser to block).
  const accept = allowed.includes('*')
    ? '*'
    : (reqOrigin && allowed.includes(reqOrigin) ? reqOrigin : '');
  const h = { 'Content-Type': 'application/json' };
  if (accept) h['Access-Control-Allow-Origin'] = accept;
  h['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  h['Access-Control-Allow-Headers'] = 'Content-Type';
  h['Access-Control-Max-Age'] = '86400';
  return h;
}

function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

// ---------------------------------------------------------------------------
// Voyage / Pinecone primitives (inlined; track rag/ upstream)
// ---------------------------------------------------------------------------

async function embedQuery(query, env) {
  const res = await fetch(VOYAGE_EMBED_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      input: [query],
      model: env.VOYAGE_MODEL,
      input_type: 'query',
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`voyage_embed_failed status=${res.status} body=${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return data?.data?.[0]?.embedding;
}

async function pineconeQuery(queryVector, env, { topK = DEFAULT_TOP_K, filter = null, namespace = '' } = {}) {
  const body = {
    vector: queryVector,
    topK,
    includeMetadata: true,
    includeValues: false,
    namespace,
  };
  if (filter) body.filter = filter;
  const res = await fetch(`${env.PINECONE_HOST}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': env.PINECONE_API_KEY,
      'X-Pinecone-API-Version': PINECONE_API_VERSION,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`pinecone_query_failed status=${res.status} body=${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return data?.matches || [];
}

async function voyageRerank(query, documents, env, { topN = DEFAULT_TOP_N } = {}) {
  if (!Array.isArray(documents) || documents.length === 0) return [];
  const res = await fetch(VOYAGE_RERANK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      documents,
      model: env.VOYAGE_RERANK_MODEL,
      top_k: Math.min(topN, documents.length),
      return_documents: true,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`voyage_rerank_failed status=${res.status} body=${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return (data?.data || []).map((item) => ({
    index: item.index,
    relevance_score: item.relevance_score,
  }));
}

// ---------------------------------------------------------------------------
// Citation payload (mirrors mcp-server/server.mjs::toCitationPayload)
// ---------------------------------------------------------------------------

function formatTimestamp(seconds) {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fidelityNote(provenance, tier) {
  if (tier === 'ingestion-only' || provenance === 'ingestion-only') {
    return 'Single-pass ingestion; transcript fidelity not yet audited against the Library of Congress canonical source.';
  }
  if (provenance === 'audit-original') {
    // The five tier values that actually appear in the corpus manifests:
    //   low (72 entries)               — well-audited, low residual error
    //   medium (18 entries)            — residual uncertainty; flag for high-stakes citations
    //   publication-block (23 entries) — known issues that block direct publication
    //                                    (Subject-paragraph errors, severe Whisper degradation,
    //                                    mid-sentence source truncations). The audit work is done;
    //                                    the issues are documented; the transcript can still be
    //                                    cited but consumers should know.
    //   not-auditable (14 entries)    — cannot be fully verified against an external canonical
    //                                    source (multi-speaker complications, no LoC reference, etc.)
    if (tier === 'low') return 'Audited transcript (Pass 1–8 + LoC heal); high confidence in fidelity.';
    if (tier === 'medium') return 'Audited transcript with residual uncertainty; verify against audio for high-stakes citations.';
    if (tier === 'high') return 'Audited transcript with substantial residual uncertainty; treat as a research lead, verify against audio.';
    if (tier === 'publication-block') return 'Audited transcript with documented publication-blocker issues (Subject-paragraph fact-check or severe Whisper degradation); usable as a research lead, verify the specific passage against audio before citing.';
    if (tier === 'not-auditable') return 'Audit pass completed but the entry cannot be fully verified against an external canonical source (multi-speaker or missing LoC reference); treat as a research lead.';
    return 'Audited transcript.';
  }
  return 'Provenance unknown.';
}

function buildCitation(metadata, { timestampStart, timestampEnd } = {}) {
  const interviewee = metadata.entry_subject || 'Unknown interviewee';
  const locUrl = metadata.loc_item_url || null;
  const tsStartStr = formatTimestamp(timestampStart);
  const tsEndStr = formatTimestamp(timestampEnd);
  const tsRange = tsStartStr && tsEndStr ? `${tsStartStr}–${tsEndStr}` : tsStartStr || '';
  const archiveClause = locUrl ? `, ${locUrl}` : '';
  const tsClause = tsRange ? `, at ${tsRange}` : '';
  return (
    `${interviewee}, interview, Civil Rights History Project, American Folklife Center, ` +
    `Library of Congress in association with the Smithsonian National Museum of African American ` +
    `History and Culture${archiveClause}${tsClause}.`
  );
}

function toCitationPayload(result) {
  const m = result.metadata || {};
  const text = result.text || m.text || '';
  const timestampStart = Number.isFinite(m.timestamp_start_seconds) ? m.timestamp_start_seconds : null;
  const timestampEnd = Number.isFinite(m.timestamp_end_seconds) ? m.timestamp_end_seconds : null;
  const provenance = m.entry_provenance || null;
  const uncertaintyTier = m.inferential_uncertainty_tier || null;
  const uncertaintyScore = Number.isFinite(m.inferential_uncertainty_score) ? m.inferential_uncertainty_score : null;
  return {
    id: result.id,
    entryNumber: m.entry_number ?? null,
    entrySubject: m.entry_subject || null,
    chunkIndex: m.chunk_index ?? null,
    text,
    textPreview: text.length > 200 ? text.slice(0, 200) + '…' : text,
    locItemUrl: m.loc_item_url || null,
    timestampStart,
    timestampEnd,
    timestampStartStr: formatTimestamp(timestampStart),
    timestampEndStr: formatTimestamp(timestampEnd),
    entryProvenance: provenance,
    uncertaintyTier,
    uncertaintyScore,
    fidelityNote: fidelityNote(provenance, uncertaintyTier),
    pineconeScore: result.pineconeScore ?? null,
    rerankScore: result.rerankScore ?? null,
    similarity: result.rerankScore ?? result.pineconeScore ?? null,
    suggestedCitation: buildCitation(m, { timestampStart, timestampEnd }),
    sourcePath: m.source_path || null,
    sourceExt: m.source_ext || null,
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req) {
  const env = getEnv();
  const reqOrigin = req.headers.get('origin') || '';
  const headers = corsHeaders(reqOrigin, env.ALLOWED_ORIGINS);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed', method: req.method }, { status: 405, headers });
  }

  // Fail-fast env check
  if (!env.PINECONE_API_KEY || !env.PINECONE_HOST || !env.VOYAGE_API_KEY) {
    return jsonResponse(
      { error: 'server_misconfigured', message: 'Required environment variables not set.' },
      { status: 500, headers },
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, { status: 400, headers });
  }

  const query = typeof body?.query === 'string' ? body.query.trim() : '';
  if (!query) {
    return jsonResponse({ error: 'query_required', message: 'Body must include a non-empty `query` string.' }, { status: 400, headers });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return jsonResponse(
      { error: 'query_too_long', max: MAX_QUERY_LENGTH, got: query.length },
      { status: 400, headers },
    );
  }

  const topN = clamp(body?.topN, 1, MAX_TOP_N, DEFAULT_TOP_N);
  const topK = clamp(body?.topK, topN, MAX_TOP_N * 4, Math.max(topN * 3, DEFAULT_TOP_K));
  const namespace = typeof body?.namespace === 'string' ? body.namespace : '';
  const filter = isPlainObject(body?.filter) ? body.filter : null;

  try {
    const queryVec = await embedQuery(query, env);
    const matches = await pineconeQuery(queryVec, env, { topK, filter, namespace });
    let resultObjs;
    if (!env.RERANK_ENABLED || matches.length === 0) {
      resultObjs = matches.slice(0, topN).map((m) => ({
        id: m.id,
        pineconeScore: m.score,
        rerankScore: null,
        text: m.metadata?.text ?? '',
        metadata: m.metadata ?? {},
      }));
    } else {
      const documents = matches.map((m) => m.metadata?.text ?? '');
      const reranked = await voyageRerank(query, documents, env, { topN });
      resultObjs = reranked.map((r) => {
        const original = matches[r.index];
        return {
          id: original.id,
          pineconeScore: original.score,
          rerankScore: r.relevance_score,
          text: original.metadata?.text ?? '',
          metadata: original.metadata ?? {},
        };
      });
    }

    return jsonResponse(
      {
        results: resultObjs.map(toCitationPayload),
        meta: {
          rerankEnabled: env.RERANK_ENABLED && matches.length > 0,
          model: env.VOYAGE_MODEL,
          rerankModel: env.VOYAGE_RERANK_MODEL,
          index: env.PINECONE_INDEX,
          topK,
          topN,
        },
      },
      { headers },
    );
  } catch (e) {
    console.error('[retrieve] error:', e?.stack || e?.message || e);
    return jsonResponse(
      { error: 'retrieval_failed', message: String(e?.message || e).slice(0, 300) },
      { status: 502, headers },
    );
  }
}

// Optional: Netlify Functions config. This exposes the function at the
// pretty URL /retrieve in addition to the default /.netlify/functions/retrieve.
export const config = {
  path: '/retrieve',
};

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------

function clamp(raw, min, max, fallback) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function isPlainObject(x) {
  return x != null && typeof x === 'object' && !Array.isArray(x);
}
