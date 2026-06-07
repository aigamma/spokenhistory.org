/**
 * mcp-server/lib.mjs, pure logic for the Civil Rights History MCP server.
 *
 * This module is deliberately SIDE-EFFECT FREE: importing it never reads the
 * environment, opens a socket, or touches the filesystem. Everything here is a
 * pure function of its inputs, so `test/*.test.mjs` can import and exercise it
 * with no network and no `process.exit`. All IO (Voyage, Pinecone, Express,
 * roster loading) lives in server.mjs and imports from here.
 *
 * Keep it pure. If a function needs the clock, take a `now` injector (see
 * createLruCache / createRateLimiter) so tests stay deterministic.
 */

// ── Limits / floors on user-supplied parameters ────────────────────
// The MCP client is usually a well-behaved LLM, but the surface is
// internet-facing, so we validate as if it were any other public endpoint.
export const MAX_QUERY_LENGTH = 4000
export const MAX_LIMIT = 50
export const DEFAULT_LIMIT = 10
export const MIN_LIMIT = 1

export function clampLimit(rawLimit) {
  const n = Number(rawLimit)
  if (!Number.isFinite(n)) return DEFAULT_LIMIT
  return Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, Math.floor(n)))
}

// ── Citation formatting ────────────────────────────────────────────

export function formatTimestamp(seconds) {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return null
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function fidelityNote(provenance, tier) {
  // Declarative only, kept in sync with src/components/rag/tiers.js::fidelityNoteFor.
  // LoC verification is the grade; the labels collapse to two settled states.
  // Distribution (140 interviews): high 133 / ingestion-only 3 / publication-block 1
  // (Blake) all render LoC-Verified; not-auditable 3 is Audio-Limited Source. Every
  // note states a settled fact; none asks the researcher to review unfinished work.
  if (tier === 'high') return 'Cross-referenced line by line against the Library of Congress published transcript and confirmed aligned.'
  if (tier === 'publication-block') return 'Cross-referenced against the Library of Congress published transcript. Where the Library’s lightly edited edition differs from the verbatim recording, both readings are preserved in the audit record.'
  if (tier === 'not-auditable') return 'The source recording carries an inherent audio limit (mid-sentence truncation or degradation). This is the most complete transcript the recording supports, and the Library of Congress transcript reflects the same limit.'
  return 'Audited across nine passes against the project correction substrate and the Library of Congress reference.'
}

export function buildCitation(metadata, { timestampStart, timestampEnd } = {}) {
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

// Convert a Pinecone retrieve() result into the citation-grade payload shape
// the MCP tools return. Centralized so search_transcripts and get_transcript
// produce identical fields.
export function toCitationPayload(result) {
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

// ── Leader-name resolution ─────────────────────────────────────────

export function leaderDisplayName(leader) {
  return leader.name || leader.entry_subject || leader.entrySubject || ''
}

export function normalizeLeaderName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

// ── Pinecone metadata filter builder ───────────────────────────────
// The civil-rights index holds archive transcript passages (no content_type
// field) plus per-person catalog vectors (content_type='person') and curated
// essays (content_type='essay'). $nin matches records where content_type is
// ABSENT, so passages pass through unchanged while persons/essays are excluded
// unless explicitly admitted. `entryNumber` (already validated to a positive
// integer by the caller, or null) restricts to one interview.
export function buildContentFilter({ entryNumber = null, includePersons = false, includeEssays = false } = {}) {
  let filter = null
  if (entryNumber != null) filter = { entry_number: { $eq: entryNumber } }
  const excluded = []
  if (!includePersons) excluded.push('person')
  if (!includeEssays) excluded.push('essay')
  if (excluded.length) {
    const excl = { content_type: { $nin: excluded } }
    filter = filter == null ? excl : { ...filter, ...excl }
  }
  return filter
}

// Deduplicate retrieve() results to one passage per interviewee, preserving
// rank order, up to `limit` distinct entries.
export function dedupeByEntry(results, limit) {
  const seen = new Set()
  const out = []
  for (const r of results) {
    const en = r.metadata?.entry_number
    if (en == null || seen.has(en)) continue
    seen.add(en)
    out.push(r)
    if (out.length >= limit) break
  }
  return out
}

// ── In-process LRU cache with TTL ──────────────────────────────────
// Dependency-free. Used to memoize query embeddings and retrieval results so a
// repeated identical query does not re-bill Voyage + Pinecone. `now` is
// injectable for deterministic tests.
export function createLruCache({ max = 500, ttlMs = 10 * 60 * 1000, now = () => Date.now() } = {}) {
  const store = new Map() // key -> { value, expires }
  return {
    get(key) {
      const hit = store.get(key)
      if (!hit) return undefined
      if (hit.expires <= now()) {
        store.delete(key)
        return undefined
      }
      // refresh recency (Map preserves insertion order)
      store.delete(key)
      store.set(key, hit)
      return hit.value
    },
    set(key, value) {
      if (store.has(key)) store.delete(key)
      store.set(key, { value, expires: now() + ttlMs })
      while (store.size > max) {
        const oldest = store.keys().next().value
        store.delete(oldest)
      }
    },
    get size() {
      return store.size
    },
    clear() {
      store.clear()
    },
  }
}

// ── Per-key token-bucket rate limiter ──────────────────────────────
// In-process (per-machine), so it is a cost guard against scraping/hammering,
// NOT an auth boundary. `capacity` is the burst; `refillPerSec` the steady
// rate (refillPerSec=1 => 60 requests/minute). `now` is injectable for tests.
export function createRateLimiter({ capacity = 30, refillPerSec = 1, now = () => Date.now() } = {}) {
  const buckets = new Map() // key -> { tokens, last }
  return {
    take(key, cost = 1) {
      const t = now()
      let b = buckets.get(key)
      if (!b) {
        b = { tokens: capacity, last: t }
        buckets.set(key, b)
      }
      const elapsedSec = (t - b.last) / 1000
      b.tokens = Math.min(capacity, b.tokens + elapsedSec * refillPerSec)
      b.last = t
      if (b.tokens >= cost) {
        b.tokens -= cost
        return { allowed: true, remaining: Math.floor(b.tokens) }
      }
      const retryAfter = Math.ceil((cost - b.tokens) / refillPerSec)
      return { allowed: false, retryAfter }
    },
    sweep(maxIdleMs = 10 * 60 * 1000) {
      const t = now()
      for (const [k, b] of buckets) {
        if (t - b.last > maxIdleMs) buckets.delete(k)
      }
    },
    get size() {
      return buckets.size
    },
  }
}
