/**
 * @fileoverview Thin client for the civil-rights RAG retrieval endpoints.
 *
 * Two surfaces:
 *
 *   - retrieve(query, opts): live semantic search via the Netlify Function
 *     at /retrieve. The function proxies Pinecone (civil-rights index) +
 *     Voyage AI (voyage-3 + rerank-2) and returns citation-grade payloads.
 *
 *   - loadRelated(entryNumber): fetch the precomputed related-passages
 *     JSON for one entry (public/rag/related/entry-N.json). Computed
 *     offline by rag/precompute.mjs; zero runtime cost.
 *
 *   - loadConstellation(): fetch the 2D PCA projection of entry centroids
 *     (public/rag/constellation.json). Powers the scatter visualization.
 *
 * All response shapes are documented in mcp-server/USAGE_GUIDE.md
 * (citation-grade payload section) and netlify/functions/README.md.
 */

const RETRIEVE_ENDPOINT = '/retrieve';

/**
 * Filter clause that excludes person-page vectors from a Pinecone retrieval.
 *
 * The civil-rights Pinecone index ingests two content types: archive transcript
 * passages (the canonical search target, no content_type metadata) and per-person
 * catalog pages (one vector per person, content_type='person'). Archive-focused
 * UI surfaces (Quote Finder, Semantic Overlap, Concept Spectrum drill-down,
 * Concept Matrix concept-query, Interview Map concept-query, Tours, Themes,
 * Influence drill-down) need to exclude person vectors so their existing
 * ranked-passage UX remains unchanged once person vectors are ingested.
 *
 * Pinecone's $ne operator matches records where the field does NOT equal the
 * value, INCLUDING records where the field is absent; this means existing
 * passage vectors (no content_type field) pass the filter unchanged.
 *
 * The filter is applied by default in retrieve(); call with
 * { includePersons: true } to override for a cross-content search affordance
 * (e.g., a future site-wide search bar that returns mixed Passage/Person
 * results).
 */
// Non-passage content types in the index. Archive passages carry no
// content_type field, so a $nin over these special types keeps every passage
// while excluding the special vectors. Each type is admitted via an opt-in
// flag. content_type='person' is per-person catalog pages; content_type='essay'
// is the curated-essays layer.
function buildExclusionFilter({ includePersons, includeEssays }) {
  const excluded = [];
  if (!includePersons) excluded.push('person');
  if (!includeEssays) excluded.push('essay');
  if (excluded.length === 0) return null;
  // $nin matches records where content_type is absent (passages) or not in the
  // list, so passages always pass; a single-element $nin behaves like $ne.
  return { content_type: { $nin: excluded } };
}

function mergeFilter(userFilter, exclusion) {
  if (!exclusion) return userFilter && Object.keys(userFilter).length ? userFilter : undefined;
  if (!userFilter || Object.keys(userFilter).length === 0) return exclusion;
  const userKeys = Object.keys(userFilter);
  if (userKeys.includes('$and') || userKeys.includes('$or')) {
    return { $and: [userFilter, exclusion] };
  }
  return { ...userFilter, ...exclusion };
}

/**
 * Issue a live semantic-search query.
 *
 * @param {string} query - The natural-language query.
 * @param {Object} [opts]
 * @param {number} [opts.topN=8] - Number of final results (after rerank).
 * @param {number} [opts.topK] - Number of candidates pre-rerank.
 * @param {Object} [opts.filter] - Pinecone metadata filter (e.g.,
 *   { entry_number: { $eq: 73 } }).
 * @param {boolean} [opts.includePersons=false] - When true, allow person-page
 *   vectors (content_type='person') in the result set. Default false so all
 *   archive-focused UI surfaces continue to return passage results only.
 * @param {boolean} [opts.includeEssays=false] - When true, allow curated-essay
 *   vectors (content_type='essay') in the result set. Default false so
 *   archive-focused UI surfaces return passage results only.
 * @param {AbortSignal} [opts.signal] - For cancellation.
 * @returns {Promise<{ results: CitationPayload[], meta: object }>}
 */
export async function retrieve(query, opts = {}) {
  const body = { query };
  if (opts.topN != null) body.topN = opts.topN;
  if (opts.topK != null) body.topK = opts.topK;
  const exclusion = buildExclusionFilter({
    includePersons: opts.includePersons === true,
    includeEssays: opts.includeEssays === true,
  });
  const mergedFilter = mergeFilter(opts.filter, exclusion);
  if (mergedFilter != null) body.filter = mergedFilter;
  if (opts.namespace != null) body.namespace = opts.namespace;
  if (opts.dedupeByEntry === true) body.dedupeByEntry = true;
  if (opts.includeQueryEmbedding === true) body.includeQueryEmbedding = true;

  const res = await fetch(RETRIEVE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  if (!res.ok) {
    let detail = null;
    try { detail = await res.json(); } catch { /* noop */ }
    const e = new Error(`retrieve_failed status=${res.status}`);
    e.status = res.status;
    e.detail = detail;
    throw e;
  }
  return res.json();
}

/**
 * Fetch precomputed related-passages JSON for one entry.
 *
 * @param {number} entryNumber - 1-138 (the corpus entry id).
 * @returns {Promise<RelatedJson>}
 */
export async function loadRelated(entryNumber) {
  const res = await fetch(`/rag/related/entry-${entryNumber}.json`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`loadRelated_failed status=${res.status} entry=${entryNumber}`);
  }
  return res.json();
}

/**
 * Fetch the precomputed 2D PCA constellation of entry centroids.
 *
 * @returns {Promise<ConstellationJson>}
 */
export async function loadConstellation() {
  const res = await fetch('/rag/constellation.json');
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`loadConstellation_failed status=${res.status}`);
  }
  return res.json();
}

/**
 * Fetch the precomputed entry centroids (1024-dim mean vectors).
 *
 * @returns {Promise<Array<{ entry_number, entry_subject, vector, chunk_count }>>}
 */
export async function loadCentroids() {
  const res = await fetch('/rag/centroids.json');
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`loadCentroids_failed status=${res.status}`);
  }
  return res.json();
}

/**
 * Filter a citation payload to surface only audit-original / low-uncertainty
 * results for high-confidence-only UI surfaces (e.g., a "publication-grade
 * citations only" toggle).
 *
 * @param {Array<CitationPayload>} payloads
 * @returns {Array<CitationPayload>}
 */
export function filterHighConfidence(payloads) {
  if (!Array.isArray(payloads)) return [];
  return payloads.filter(
    (p) => p.entryProvenance === 'audit-original' && (p.uncertaintyTier === 'low' || p.uncertaintyTier == null),
  );
}
