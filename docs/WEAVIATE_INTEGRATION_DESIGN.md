# Weaviate + Voyage AI Integration Design

The RAG (Retrieval-Augmented Generation) substrate for the Civil Rights History Project. **Weaviate** as the open-source vector store, **Voyage AI** as the embedding provider, with the WWU team owning the operational surface. This is the rescue centerpiece, deploying production-grade RAG is what brought Eric onto the project, and this document is the design handoff so another agent can execute the implementation without re-deriving any decision.

## Why this exists, and why these vendors

The current vector substrate is the `embeddings` Firestore collection + the `performVectorSearch` Cloud Function in `functions/index.js:122-317`. It works as a demo but has three structural failures:

1. **O(n) scan per query.** The Cloud Function paginates through every embedding doc in the collection, computes cosine similarity in JavaScript, and sorts. At 135 transcripts × ~50 segments each ≈ 6,750 vectors today, latency is a few seconds. At full corpus scale (600+ hours of oral history → ~40K segments), it becomes minutes.
2. **No ANN index.** Every query is exact-cosine across the full collection. There is no HNSW, no IVF, nothing that gives sub-millisecond approximate-nearest-neighbor.
3. **Per-query Cloud Function cost.** Firestore reads + Cloud Function compute seconds × ~6,750 docs per query adds up. The Blaze billing plan can absorb it now; it doesn't scale.

The team's constraints:

- **No recurring SaaS budget.** Weaviate Cloud is off the table. Pinecone (serverless) is off the table. Any solution must run somewhere the team can host without monthly invoicing.
- **Open source preferred.** Weaviate (Apache 2.0) is the chosen vendor, confirmed by Eric on 2026-05-21.
- **Voyage AI for embeddings.** Voyage's models outperform OpenAI's text-embedding-3-small on retrieval benchmarks at lower cost, and the project has direct precedent (worldthought.com, see Parallels section). Confirmed as the chosen embedder by Eric on 2026-05-21.

The combination is structurally cost-bound: Weaviate has no API metering, Voyage AI charges per-token at ~$0.06/MTok for `voyage-3`, the entire 135-transcript ingest costs about $0.06, and steady-state query traffic is fractions of a cent per query. Total monthly cost in steady state: under $5 regardless of cadence.

## Parallels with sibling projects

This design is consciously informed by two of Eric's prior RAG implementations. The civil-rights project is following the **worldthought.com pattern with Weaviate swapped in for Pinecone**, augmented by efficiency patterns from **aigamma.com's Supabase pgvector** implementation. Both repos are on disk; future agents should read them as reference implementations.

### worldthought.com (Pinecone + Voyage AI), the closest analog

`C:\worldthought.com` is a 7-day proof-of-concept (750+ commits) that uses Pinecone + `voyage-3` embeddings to power chat over public-domain philosophical texts (Hegel, Kant, Aristotle, etc.). Direct precedent for the Voyage AI integration.

**Patterns to copy directly:**

1. **`voyage-3` at 1024 dimensions** is the model. `worldthought.com/scripts/rag/ingest.mjs:171` and `chat.mjs:338`. Hardcoded default with `VOYAGE_MODEL` env override.

2. **`input_type` asymmetry** is critical. Voyage's bi-encoder embeds documents and queries with different prompts internally, producing different vectors for the same text depending on intent:
   - **Ingest**: `input_type: 'document'` (worldthought ingest.mjs:171)
   - **Retrieval**: `input_type: 'query'` (worldthought chat.mjs:338)
   - Failing to differentiate degrades retrieval quality by 5-15%. This is the single most easy-to-miss-and-most-painful Voyage pitfall.

3. **Two-stage retrieval: over-retrieve + rerank.** Pull top-12 from the vector store, then rerank with `voyage-rerank-2` down to top-6 before sending to the LLM. The reranker is a cross-encoder (vs the bi-encoder used for embedding), it sees the query and the document together, which catches relevance signals the embedding-only score misses. worldthought.com chat.mjs:242-246, fail-open on rerank error (returns vector-store order if rerank fails).

4. **Idempotent ingest via SHA256 content hash.** Each chunk's vector ID embeds a content hash; re-running the ingest skips chunks whose hash matches the existing entry. worldthought ingest.mjs:142-150. Without this, an ingest sweep re-embeds the entire corpus on every minor edit, burning Voyage tokens for nothing.

5. **Paragraph-aware chunking with sentence fallback.** 1100-char target with 180-char overlap; split on blank lines first, then on sentence boundaries if a paragraph exceeds the ceiling. worldthought ingest.mjs:95-139.

6. **LRU query cache.** 64-entry per-surface cache with 45s TTL avoids re-embedding repeat queries. worldthought chat.mjs:304.

7. **Similarity floor.** Reject chunks with rerank score below 0.35; assume retrieval failed. The LLM falls back to its training instead of hallucinating from low-relevance context. worldthought chat.mjs:244, 490-496.

**Patterns to fix in this implementation** (worldthought's wrong turns):

1. **No retry / exponential backoff for Voyage calls.** worldthought ingest.mjs:156-183 fires a single `fetch` with a hard timeout, a Voyage rate-limit response (429) crashes the ingest pass and requires manual restart. **Fix here**: implement exponential backoff with `tenacity` (Python) or a custom retry wrapper (Node) for both embed and rerank calls. The civil-rights ingest is one-shot (135 transcripts ≈ 1M tokens) so a 30-second pause is irrelevant to total throughput.

2. **No per-chunk relevance metadata.** worldthought computes rerank scores at retrieval time but doesn't store them. **Fix here**: store a `qualityScore` property on each Weaviate object (computed at ingest as a `len(text) + has_proper_nouns + cite_count` heuristic, or as a Voyage rerank score against a canonical "high-quality civil rights oral history" query). Lets Weaviate filter and sort on relevance during retrieval, not just cosine similarity.

3. **Tight coupling to Netlify Blobs for rate-limit tracking + chat logs.** **Fix here**: use Firestore for both, the project already has it, no new dependency.

### aigamma.com (Supabase pgvector), the efficiency patterns

`C:\aigamma.com` uses Postgres + pgvector with `gte-small` (384d) embeddings inside Supabase Edge Runtime. Different vector store, different embedder, but several patterns are vendor-neutral and directly applicable.

**Patterns to copy:**

1. **Content-hash idempotency** (same pattern as worldthought, validated independently). aigamma `scripts/rag/ingest.mjs:50-551` stores SHA-256 of chunk text and skips re-embedding when the hash matches. Architectural win across both prior projects.

2. **Per-source allowlist for ingest.** A `SOURCES` array curates which files become chunks. Prevents internal docs, retired pages, or debug artifacts from leaking into RAG. For the civil-rights project, the analog is **the transcripts/raw/ directory + the civil_rights_facts.json file**, both of which are explicit, version-controlled, and curatable.

3. **Dual-path retrieval (vector → keyword fallback).** When the vector embedder fails (rate limit, transient error), fall back to BM25 / Postgres tsvector keyword search. aigamma `netlify/functions/chat.mjs:281-303`. Weaviate has this built in via its `hybrid` query that combines vector + BM25 in one call, weight-controllable per query.

4. **Markdown-aware chunking with H2/H3 boundaries.** aigamma `scripts/rag/ingest.mjs:218-284`. Semantically cleaner than sliding windows. For civil-rights transcripts the analog is chapter boundaries (the existing pipeline produces per-chapter chunks; embed at chapter granularity, not arbitrary fixed-size windows).

5. **Async fire-and-forget logging.** chat log writes don't block the response; errors are swallowed. Essential for production reliability. aigamma `netlify/functions/chat.mjs:381-440`.

6. **Surface / metadata routing.** Each chunk has a `surface` metadata field tying it to a page or section; retrieval filters by surface to keep page-specific context local. For civil-rights, the analog is `interviewId` (per-interview namespace) and `mainTopicCategory` (cross-interview thematic filter).

**Patterns to avoid:**

1. **Tiny batch sizes (3 chunks per Edge Function call).** aigamma is constrained by Supabase Edge Runtime's 256MB memory ceiling. Weaviate is not. Batch at Voyage's natural limit (32 texts per call, well under the 120K token cap) for ingest throughput.

2. **Storing only chunk summaries in chat logs.** aigamma chat_logs stores `(source_path, chunk_index, title, similarity)` and dereferences full text on demand. For civil-rights we want richer logging, store the full chunk text in the log to enable post-hoc quality analysis (which queries returned which chunks, was the answer correct, etc.).

## Architecture

Four major surfaces. Each is independently shippable.

### 1. Weaviate hosting

The user has signalled "no recurring budget." Three viable options; **the WWU on-prem option is the recommendation**, with Eric's dev box + Cloudflare Tunnel as the bridge for the 2026-05-27 demo.

#### Option A, WWU on-prem (RECOMMENDED for steady state)

A lab machine at WWU runs Docker; the team ssh-tunnels for admin tasks; production traffic hits via a Cloudflare Tunnel (free tier, supports up to 50 concurrent connections, way more than this archive's traffic).

- **Cost**: $0 hardware (existing lab machine), $0 networking, $0 storage. HNSW index for current corpus is ~40MB; full corpus would be ~250MB.
- **RAM**: 2GB host is sufficient for the full eventual corpus.
- **Pros**: Truly zero recurring cost. WWU owns and controls uptime. Backup is rsync-to-second-machine on a cron.
- **Cons**: SPOF on lab machine uptime; lab power outage = search down. Acceptable for academic archive use case; not acceptable for high-traffic public service.
- **Ops owner**: someone on the WWU side (Jack, Dustin, or a grad student) takes ownership. Bi-weekly OS updates, weekly Weaviate version check, monthly backup verification.

#### Option B, Fly.io shared-cpu-1x

The MCP server is already on Fly.io. Adding Weaviate keeps everything on one platform.

- **Cost**: ~$1.94/mo on shared-cpu-1x (256MB), or $5.40/mo at 1GB. Often covered by Fly's free allowance for accounts already paying for other apps.
- **Pros**: Same platform as MCP server. HTTPS routing + TLS certs managed.
- **Cons**: 256MB is tight, fits current corpus but not full archive. The reranker module adds ~150MB of memory pressure, pushing us to the 1GB tier.

#### Option C, Eric's dev box + Cloudflare Tunnel (TEMPORARY)

Eric runs Docker locally; Cloudflare Tunnel exposes Weaviate's REST + gRPC ports under a stable public URL.

- **Cost**: $0.
- **Pros**: Eric controls the box; can iterate fast for the 2026-05-27 demo.
- **Cons**: When Eric's machine sleeps, search is down. Pre-handoff mode only.

#### Migration timeline

- **Now → 2026-05-27**: Option C. Eric runs Weaviate locally; tunnel makes it reachable from Netlify staging.
- **Post-2026-05-27**: WWU team provisions the lab machine; migration to Option A is a single config change (`WEAVIATE_URL` env var), transparent to Cloud Functions, MCP server, and the React frontend.

### 2. Schema

Four classes mirroring the current Firestore `embeddings` collection's shape, expressed as Weaviate schema objects. Use `vectorizer: none` because Voyage AI generates vectors externally, Weaviate stores them, doesn't regenerate.

Embedding model: **`voyage-3` at 1024 dimensions**. All four classes use the same model so cross-class similarity is meaningful.

#### Class: `TranscriptSegment`

```python
{
    "class": "TranscriptSegment",
    "description": "A ~20-50 second segment of a Whisper-transcribed civil rights oral history interview. Embedded with voyage-3 at 1024d.",
    "vectorizer": "none",
    "vectorIndexConfig": {
        "distance": "cosine",
        "ef": 64,
        "efConstruction": 128,
        "maxConnections": 32
    },
    "invertedIndexConfig": {"bm25": {"b": 0.75, "k1": 1.2}},
    "properties": [
        {"name": "text", "dataType": ["text"], "description": "Full segment text", "tokenization": "word"},
        {"name": "contentHash", "dataType": ["text"], "description": "SHA-256 of text for idempotent ingest"},
        {"name": "interviewId", "dataType": ["text"], "description": "Slug matching transcripts/raw/<dir-name>"},
        {"name": "interviewName", "dataType": ["text"]},
        {"name": "interviewRole", "dataType": ["text"]},
        {"name": "segmentId", "dataType": ["text"]},
        {"name": "chapterNumber", "dataType": ["int"]},
        {"name": "startTime", "dataType": ["text"], "description": "HH:MM:SS in source video"},
        {"name": "endTime", "dataType": ["text"]},
        {"name": "topic", "dataType": ["text"]},
        {"name": "mainTopicCategory", "dataType": ["text"]},
        {"name": "keyThemes", "dataType": ["text[]"]},
        {"name": "keywordsArray", "dataType": ["text[]"]},
        {"name": "hasNotableQuotes", "dataType": ["boolean"]},
        {"name": "hasRelatedEvents", "dataType": ["boolean"]},
        {"name": "notableQuotes", "dataType": ["text[]"]},
        {"name": "relatedEvents", "dataType": ["text[]"]},
        {"name": "videoEmbedLink", "dataType": ["text"]},
        {"name": "collection", "dataType": ["text"]},
        {"name": "embeddingModel", "dataType": ["text"], "description": "voyage-3"},
        {"name": "embeddingDimension", "dataType": ["int"], "description": "1024"},
        {"name": "qualityScore", "dataType": ["number"], "description": "Pre-computed retrievability score, 0-1. See ingest pipeline for derivation."},
        {"name": "createdAt", "dataType": ["date"]}
    ]
}
```

#### Class: `SummaryChapter`

```python
{
    "class": "SummaryChapter",
    "description": "A chapter summary from the metadata pipeline. One per interview chapter. Vector is on the summary prose, not the full transcript.",
    "vectorizer": "none",
    "vectorIndexConfig": {"distance": "cosine", "ef": 64, "efConstruction": 128, "maxConnections": 32},
    "invertedIndexConfig": {"bm25": {"b": 0.75, "k1": 1.2}},
    "properties": [
        {"name": "summary", "dataType": ["text"], "tokenization": "word"},
        {"name": "contentHash", "dataType": ["text"]},
        {"name": "interviewId", "dataType": ["text"]},
        {"name": "chapterNumber", "dataType": ["int"]},
        {"name": "title", "dataType": ["text"]},
        {"name": "keyThemes", "dataType": ["text[]"]},
        {"name": "keywords", "dataType": ["text[]"]},
        {"name": "historicalSignificance", "dataType": ["text"]},
        {"name": "openaiAccuracyScore", "dataType": ["int"]},
        {"name": "openaiQualityScore", "dataType": ["int"]},
        {"name": "claudeAccuracyScore", "dataType": ["int"]},
        {"name": "claudeQualityScore", "dataType": ["int"]},
        {"name": "publishable", "dataType": ["boolean"]},
        {"name": "publicationDecisionPath", "dataType": ["text"]},
        {"name": "createdAt", "dataType": ["date"]}
    ]
}
```

#### Class: `Topic`

```python
{
    "class": "Topic",
    "description": "An AI-curated topic from the Topic Glossary. Vector is on the keyword + textPreview.",
    "vectorizer": "none",
    "vectorIndexConfig": {"distance": "cosine", "ef": 64, "efConstruction": 128, "maxConnections": 32},
    "properties": [
        {"name": "keyword", "dataType": ["text"]},
        {"name": "contentHash", "dataType": ["text"]},
        {"name": "category", "dataType": ["text"]},
        {"name": "importanceScore", "dataType": ["int"]},
        {"name": "clipCount", "dataType": ["int"]},
        {"name": "interviewCount", "dataType": ["int"]},
        {"name": "textPreview", "dataType": ["text"]},
        {"name": "createdAt", "dataType": ["date"]}
    ]
}
```

#### Class: `InterviewIndex`

```python
{
    "class": "InterviewIndex",
    "description": "Interview-level embedding for the listing page. One per interview. Vector is on the combined name + role + brief summary.",
    "vectorizer": "none",
    "vectorIndexConfig": {"distance": "cosine", "ef": 64, "efConstruction": 128, "maxConnections": 32},
    "properties": [
        {"name": "interviewId", "dataType": ["text"]},
        {"name": "contentHash", "dataType": ["text"]},
        {"name": "name", "dataType": ["text"]},
        {"name": "role", "dataType": ["text"]},
        {"name": "roleSimplified", "dataType": ["text"]},
        {"name": "totalMinutes", "dataType": ["number"]},
        {"name": "clipCount", "dataType": ["int"]},
        {"name": "thumbnailUrl", "dataType": ["text"]},
        {"name": "videoEmbedLink", "dataType": ["text"]},
        {"name": "textPreview", "dataType": ["text"]},
        {"name": "createdAt", "dataType": ["date"]}
    ]
}
```

**Schema design choices:**

- **HNSW parameters from Weaviate's "balanced" defaults.** Corpus size is small (~6,750 segments today, ~40K eventually); tuning `ef`/`efConstruction`/`maxConnections` higher is free quality. The defaults shown are roughly that.
- **`contentHash` everywhere.** Enables the idempotent-ingest pattern from both sibling projects. Single biggest cost-saver across re-ingests.
- **`bm25` configured per class.** Enables Weaviate's `hybrid` query (vector + keyword in one call). `b=0.75, k1=1.2` are BM25's classical defaults; revisit if retrieval quality on rare proper nouns is poor.
- **`embeddingDimension` stored explicitly** rather than inferred from vector length. Lets a future query refuse mismatched-dimension docs at retrieval time without a length-check loop. This replaces the manual dimension filter at `functions/index.js:160-167` and the mirror in `mcp-server/server.mjs::searchTranscripts`.
- **`text[]` array properties** (`keyThemes`, `keywordsArray`, `notableQuotes`, `relatedEvents`) replace the current Firestore approach of comma-separated strings. Weaviate's `text[]` supports filter-on-array-contains: a query can filter to "segments tagged with `Voting Rights`" trivially. Firestore can't.
- **`qualityScore` on `TranscriptSegment`** is a stored relevance hint, derived at ingest time. See Ingestion section for the formula. Lets the retrieval pipeline pre-filter low-quality segments without a per-query rerank.

### 3. Voyage AI integration

Sandboxed in a single module: `Metadata Generation System/processor/voyage_client.py`. Used by both the ingest pipeline and the runtime retrieval, with different `input_type` settings.

```python
"""
Voyage AI embedding + reranking client.

Vendor: Voyage AI (https://www.voyageai.com/).
Model: voyage-3 (1024-dim, $0.06 per MTok, 32K input tokens per text).
Reranker: rerank-2 ($0.05 per 1K queries).

Critical pattern (from worldthought.com): input_type asymmetry.
  - embed_documents() always passes input_type='document'
  - embed_query()    always passes input_type='query'
Voyage's bi-encoder generates DIFFERENT vectors for the same text
depending on input_type because the model is asymmetric. Failing to
differentiate degrades retrieval quality by 5-15%.

Retry strategy: exponential backoff with jitter on 429 / 5xx, max 5
retries, base delay 1s. (worldthought.com lacked this and an ingest
sweep would crash on a rate limit; this client fixes that.)
"""

import os
import time
import random
import logging
from typing import List, Optional, Literal

import requests

VOYAGE_API_URL = "https://api.voyageai.com/v1"
DEFAULT_MODEL = "voyage-3"
DEFAULT_RERANKER = "rerank-2"
EMBEDDING_DIMENSION = 1024  # voyage-3
MAX_BATCH_SIZE = 32          # Voyage's natural batch size for the /embeddings endpoint
MAX_INPUT_TOKENS = 32000     # voyage-3 per-text limit


class VoyageClient:
    def __init__(self, api_key: Optional[str] = None, model: str = DEFAULT_MODEL):
        key = api_key or os.environ.get("VOYAGE_API_KEY")
        if not key:
            raise ValueError("VOYAGE_API_KEY not set")
        self.api_key = key
        self.model = model
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        })

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed a batch of documents. Uses input_type='document'."""
        return self._embed(texts, input_type="document")

    def embed_query(self, text: str) -> List[float]:
        """Embed a single query string. Uses input_type='query'."""
        return self._embed([text], input_type="query")[0]

    def _embed(self, texts: List[str], input_type: Literal["document", "query"]) -> List[List[float]]:
        # Batch into chunks of MAX_BATCH_SIZE.
        all_vectors = []
        for i in range(0, len(texts), MAX_BATCH_SIZE):
            batch = texts[i:i + MAX_BATCH_SIZE]
            vectors = self._embed_one_batch(batch, input_type)
            all_vectors.extend(vectors)
        return all_vectors

    def _embed_one_batch(self, batch: List[str], input_type: str, _retries: int = 5) -> List[List[float]]:
        delay = 1.0
        for attempt in range(_retries):
            try:
                resp = self.session.post(
                    f"{VOYAGE_API_URL}/embeddings",
                    json={"input": batch, "model": self.model, "input_type": input_type},
                    timeout=30
                )
                if resp.status_code in (429, 500, 502, 503, 504):
                    jitter = random.uniform(0, 0.5)
                    time.sleep(delay + jitter)
                    delay *= 2
                    continue
                resp.raise_for_status()
                return [item["embedding"] for item in resp.json()["data"]]
            except requests.exceptions.Timeout:
                jitter = random.uniform(0, 0.5)
                time.sleep(delay + jitter)
                delay *= 2
                continue
        raise RuntimeError(f"Voyage embed failed after {_retries} retries (input_type={input_type})")

    def rerank(self, query: str, documents: List[str], top_k: int = 6) -> List[dict]:
        """Rerank documents by relevance to query. Returns [{'index': int, 'relevance_score': float}].

        Use after an over-retrieve from Weaviate. Cross-encoder; ~100-200ms per call.
        Fails open: on error, returns documents in input order with placeholder scores.
        """
        try:
            resp = self.session.post(
                f"{VOYAGE_API_URL}/rerank",
                json={"query": query, "documents": documents, "model": DEFAULT_RERANKER, "top_k": top_k},
                timeout=15
            )
            resp.raise_for_status()
            return resp.json()["data"]
        except Exception as e:
            logging.warning(f"Voyage rerank failed; returning input order: {e}")
            return [{"index": i, "relevance_score": 0.5} for i in range(min(top_k, len(documents)))]
```

**Why this shape:**

1. **Two methods (`embed_documents`, `embed_query`)** make the asymmetry impossible to forget. A caller can't accidentally pass the wrong `input_type` because they don't pick it; the method does.
2. **Batching at 32 texts per call** matches Voyage's natural batch size, well under the 120K token cap and avoids HTTP overhead.
3. **Exponential backoff with jitter** fixes the worldthought.com gap. 5 retries with base 1s doubling = up to 32s pause on a sustained rate-limit, after which the ingest should not still be failing.
4. **`rerank` fails open.** On error, return input order with placeholder scores. The pipeline degrades to vector-only ranking rather than crashing, same posture as worldthought.com (line 246 of chat.mjs).
5. **No client-level caching.** Caching belongs at a higher layer (the query module's LRU); the embed client is stateless.

### 4. Ingestion

Single CLI: `scripts/firestore-to-weaviate.mjs` for the one-shot migration, then `scripts/rag-ingest.mjs` for steady-state ingest of new transcripts.

#### One-shot migration

```javascript
// scripts/firestore-to-weaviate.mjs
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import weaviate from 'weaviate-client'
import { createHash } from 'crypto'

// Connect to Firestore (source) and Weaviate (destination)
const fb = initializeApp({ credential: cert(process.env.FIREBASE_SERVICE_ACCOUNT_PATH) })
const db = getFirestore(fb)

const client = await weaviate.connectToCustom({
    httpHost: process.env.WEAVIATE_HOST,
    httpPort: 8080,
    grpcHost: process.env.WEAVIATE_HOST,
    grpcPort: 50051,
    authCredentials: process.env.WEAVIATE_API_KEY
        ? new weaviate.ApiKey(process.env.WEAVIATE_API_KEY)
        : undefined
})

const segments = client.collections.get('TranscriptSegment')
const chapters = client.collections.get('SummaryChapter')
const topics = client.collections.get('Topic')
const interviews = client.collections.get('InterviewIndex')

// Stream the embeddings collection (might be 50K+ docs eventually)
const batchSize = 100
let lastDoc = null
let totalMigrated = 0

while (true) {
    let q = db.collection('embeddings').orderBy('__name__').limit(batchSize)
    if (lastDoc) q = q.startAfter(lastDoc)
    const snap = await q.get()
    if (snap.empty) break

    const bSeg = [], bChap = [], bTop = [], bInt = []
    snap.forEach(doc => {
        const d = doc.data()
        const hash = createHash('sha256').update(d.textPreview || d.text || '').digest('hex').slice(0, 16)
        const baseProps = {
            ...d,
            contentHash: hash,
            embeddingModel: d.embeddingModel || 'text-embedding-3-small',
            embeddingDimension: d.embedding?.length || 1536,
            createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        }
        // Discriminator: topicId vs interviewId+segmentId vs interviewId-only
        if (d.topicId) bTop.push({ properties: baseProps, vectors: d.embedding })
        else if (d.segmentId) bSeg.push({ properties: baseProps, vectors: d.embedding })
        else if (d.interviewId) bInt.push({ properties: baseProps, vectors: d.embedding })
    })

    await segments.data.insertMany(bSeg)
    await chapters.data.insertMany(bChap)
    await topics.data.insertMany(bTop)
    await interviews.data.insertMany(bInt)
    totalMigrated += bSeg.length + bChap.length + bTop.length + bInt.length

    lastDoc = snap.docs[snap.docs.length - 1]
    console.log(`Migrated batch: ${totalMigrated} total objects`)
}
```

**Note**: this preserves existing OpenAI `text-embedding-3-small` (1536d) vectors in their original dimension. After migration, run `scripts/reembed-with-voyage.mjs` to regenerate all vectors with `voyage-3` (1024d), one class at a time, using the content-hash idempotency to skip unchanged rows on re-runs.

#### Steady-state ingest

`scripts/rag-ingest.mjs` runs after the metadata pipeline produces new transcripts. For each new transcript:

1. **Chunk** the SRT into per-chapter segments using the chapter boundaries the existing pipeline already produces (no need for sliding-window chunking, the pipeline gives us semantically-meaningful chapters for free).
2. **Compute content hash** SHA-256(text). Query Weaviate `TranscriptSegment` filtered by `interviewId == ... AND segmentId == ...`. If found and `contentHash` matches, skip.
3. **Batch embed** with `voyage_client.embed_documents([texts])`. Voyage natural batch is 32 texts per call.
4. **Compute `qualityScore`** per segment: `min(1.0, 0.3 + 0.4 * has_proper_noun_match + 0.3 * len_normalized)` where:
   - `has_proper_noun_match` = 1 if any token matches a `civil_rights_facts.json` canonical name or alias, else 0
   - `len_normalized` = `min(1.0, len(text) / 1000)` (segments under 1000 chars are penalized as too-short)
   This is a heuristic, tune from quality data once we have it.
5. **Insert** as a batch using Weaviate's gRPC batch API (`insertMany`). On collision (same UUID, same hash), skip silently. On error, log + skip.
6. **Idempotency check**: re-running the script on the same corpus produces no Voyage calls and no Weaviate writes.

### 5. Retrieval

The actual RAG query pipeline. Three layers: query embed → Weaviate hybrid search → Voyage rerank.

```python
# Metadata Generation System/processor/rag_retrieval.py

from typing import List, Dict, Any, Optional
from functools import lru_cache
import time

from .voyage_client import VoyageClient
import weaviate
import weaviate.classes as wvc


class RAGRetriever:
    def __init__(self, weaviate_url: str, voyage_client: VoyageClient):
        self.client = weaviate.connect_to_custom(
            http_host=weaviate_url, http_port=8080,
            grpc_host=weaviate_url, grpc_port=50051,
        )
        self.voyage = voyage_client
        self._query_cache: Dict[str, tuple[List[Dict[str, Any]], float]] = {}
        self._cache_ttl = 45.0
        self._cache_max = 64

    def retrieve(
        self,
        query: str,
        collection: str = "TranscriptSegment",
        top_k: int = 6,
        over_retrieve_k: int = 12,
        filters: Optional[Dict[str, Any]] = None,
        similarity_floor: float = 0.35,
        hybrid_alpha: float = 0.7,  # 1.0 = pure vector, 0.0 = pure BM25
    ) -> List[Dict[str, Any]]:
        """Two-stage retrieval: hybrid search → Voyage rerank.

        Returns at most top_k results, sorted by rerank score (descending),
        each with the full Weaviate object properties + rerank_score.

        Returns [] when retrieval is weak (all candidates below floor).
        """
        # Cache hit?
        cache_key = f"{collection}:{query}:{top_k}:{hybrid_alpha}:{filters}"
        if cache_key in self._query_cache:
            cached, timestamp = self._query_cache[cache_key]
            if time.time() - timestamp < self._cache_ttl:
                return cached

        # Stage 1: embed query
        query_vector = self.voyage.embed_query(query)

        # Stage 2: hybrid search against Weaviate (vector + BM25 in one call)
        coll = self.client.collections.get(collection)
        weaviate_filters = self._build_filters(filters) if filters else None

        result = coll.query.hybrid(
            query=query,
            vector=query_vector,
            alpha=hybrid_alpha,
            limit=over_retrieve_k,
            filters=weaviate_filters,
            return_metadata=wvc.query.MetadataQuery(score=True, distance=True)
        )

        candidates = [
            {**obj.properties, "_score": obj.metadata.score}
            for obj in result.objects
        ]
        if not candidates:
            return []

        # Stage 3: Voyage rerank
        documents = [c["text"] if "text" in c else c.get("summary", c.get("keyword", "")) for c in candidates]
        reranked = self.voyage.rerank(query, documents, top_k=top_k)

        # Apply floor + return
        results = []
        for r in reranked:
            if r["relevance_score"] < similarity_floor:
                continue
            cand = candidates[r["index"]]
            cand["rerank_score"] = r["relevance_score"]
            results.append(cand)

        # Cache (LRU-ish via dict + manual eviction)
        if len(self._query_cache) >= self._cache_max:
            oldest = min(self._query_cache.items(), key=lambda kv: kv[1][1])
            del self._query_cache[oldest[0]]
        self._query_cache[cache_key] = (results, time.time())

        return results

    def _build_filters(self, filters: Dict[str, Any]):
        """Translate {field: value} to Weaviate Filter object."""
        f = None
        for k, v in filters.items():
            new_f = wvc.query.Filter.by_property(k).equal(v)
            f = new_f if f is None else f & new_f
        return f
```

**Why this shape:**

1. **`hybrid_alpha=0.7`** is the Weaviate default skew toward vector. For oral history queries that contain specific names ("Selma march", "Bobby Seale"), the BM25 component (1-alpha = 0.3) catches the exact name even when the vector misses; for conceptual queries ("nonviolent resistance strategy"), the vector dominates. Tune per-class if needed.

2. **`over_retrieve_k=12` then rerank to `top_k=6`**, the worldthought.com pattern, validated by 750+ commits of production traffic. Caught real query-disambiguation cases (e.g., "necessity" matching multiple philosophers).

3. **`similarity_floor=0.35` on rerank scores**, matches worldthought.com. Below this threshold, retrieval is too weak to be useful; the calling LLM should fall back to its training rather than hallucinate from low-relevance context.

4. **45s TTL LRU cache**, same as worldthought. Avoids re-embedding repeat queries (huge for repeat-visitor queries on the frontend).

5. **Fails-open everywhere**, if Voyage embed fails, the exception propagates (caller decides); if Voyage rerank fails, candidates pass through in their hybrid-score order; if Weaviate fails, the exception propagates (the calling Cloud Function returns a 500). Same posture as both sibling projects.

### 6. Cloud Functions + MCP server adapters

#### `functions/index.js`, `vectorSearch` rewrite

The current ~290 lines of pagination + cosine-similarity-in-JS + early-exit collapse to:

```javascript
const { RAGRetriever } = require('./rag-retriever') // a new small module

exports.vectorSearch = onCall({ maxInstances: 10, memory: "256MiB", timeoutSeconds: 30 }, async (request) => {
    const { query, limit, filters, collection } = request.data
    // ... existing input validation ...

    const retriever = new RAGRetriever(process.env.WEAVIATE_URL, process.env.VOYAGE_API_KEY)
    const results = await retriever.retrieve(query, {
        collection: collection || 'TranscriptSegment',
        top_k: safeLimit,
        filters: filters || {}
    })

    return { success: true, results: results.map(toFrontendShape) }
})

function toFrontendShape(r) {
    // Map Weaviate property names back to the shape the React frontend expects.
    // The frontend has been reading this shape from the old Firestore-backed
    // function for months, so we preserve it byte-for-byte to avoid a UI change.
    return {
        documentId: r.interviewId,
        segmentId: r.segmentId,
        textPreview: r.text?.slice(0, 200),
        similarity: r.rerank_score,
        type: r.type || 'unknown',
        topic: r.topic,
        // ... etc, same shape as functions/index.js:244-271
    }
}
```

The dim-filter logic at `functions/index.js:160-167` is structurally eliminated, Weaviate refuses mismatched-dimension inserts at the schema level. ~290 lines deleted; latency drops from "seconds for the current corpus" to "sub-100ms for the eventual full corpus."

A feature-flag env var (`USE_WEAVIATE`) controls Weaviate-vs-Firestore at first; flip to Weaviate-only once verified.

#### `mcp-server/server.mjs`, `searchTranscripts` rewrite

Same pattern. Cloud Function and MCP server share an adapter module: `mcp-server/lib/retriever.mjs` exports `searchTranscriptSegments({query, limit, filters})` and both surfaces import it. Single source of truth for the Weaviate query shape; eliminates the drift risk between the two retrievers.

### 7. RAG-ified summarization (the actual rescue)

This is the strategic payoff. Once Weaviate is populated, the summarization pipeline can do **real RAG**, retrieve from the corpus when generating, not just fit-into-context-window.

**Current behavior** (`processor/summarization.py`, `processor/chapterization.py`): the LLM sees the chapter's transcript window (~12K chars) + the ground-truth facts that `get_relevant_facts` regex-matched. If the speaker references an event by an unusual alias not in the facts file, the LLM has no grounding. If a claim could be cross-checked against another interview, the pipeline has no way to find that interview.

**RAG-ified behavior**: before generating a chapter summary, the pipeline:

1. Embeds the chapter transcript via `voyage_client.embed_documents([transcript])`
2. Runs `RAGRetriever.retrieve(query=transcript_excerpt, collection='Topic', top_k=5)`, what topics from the curated glossary are semantically closest to this chapter?
3. Runs `RAGRetriever.retrieve(query=transcript_excerpt, collection='SummaryChapter', top_k=3, filters={'interviewId': {'!=': current_interview_id}})`, what *other* interviews' chapters cover similar ground?
4. Adds both to the system prompt's context block:

```
RELEVANT TOPICS FROM THE GLOSSARY:
- Voting Rights Act (importance: 9): The 1965 federal legislation banning racial discrimination in voting...
- SNCC (importance: 8): Student Nonviolent Coordinating Committee, key organizing force...

RELATED CHAPTERS FROM OTHER INTERVIEWS:
- Charles Sherrod (Albany Movement, Chapter 3): "When we organized in Albany, the strategy was..."
- Bob Moses (Mississippi Freedom Summer, Chapter 5): "The decision to bring white volunteers..."

Now generate the summary, drawing on the chapter transcript primarily and the above context where it deepens or contextualizes specific claims.
```

This is the actual deliverable that justifies the Weaviate investment. The current pipeline summarizes interviews in isolation; the RAG-ified pipeline summarizes them in conversation with the rest of the corpus.

**Cost lift**: each summarization pass adds 1-3 Weaviate queries (~50ms each, free internally; ~$0.00005 in Voyage rerank cost) + ~500 extra tokens of context per LLM call. For Claude Opus 4.7 at $15/MTok input, that's ~$0.0075 per chapter; across 135 transcripts × ~10 chapters ≈ 1,350 chapters; total cost lift of ~$10. Negligible relative to the existing ~$0.04/transcript baseline.

**Citation pattern**: when the LLM cites a related chapter ("similar to Charles Sherrod's account..."), it surfaces the source `interviewId` + `chapterNumber` in its output, and the citation auditor (`processor/citation_check.py`) can verify the cited chapter actually exists and contains what the summary claims. This is how RAG becomes a fact-grounding mechanism rather than just a context-stuffing mechanism.

### 8. Frontend integration

The React frontend's `src/services/search.js` (semantic search) and `src/services/firebase.js::searchVectors` already wrap a Cloud Function call. No frontend change required, the function's response shape is preserved.

Two opt-in enhancements:

1. **Show rerank scores in the UI**: the new pipeline returns `rerank_score` instead of (or alongside) `similarity`. The search results page can render confidence indicators that are more meaningful than raw cosine, a "Strong match" / "Possible match" / "Weak match" badge.

2. **Add a "related chapters" sidebar** on interview detail pages: query `SummaryChapter` filtered by `interviewId != current` + limit 5; show as a sidebar. Uses the same retriever; no new endpoint needed.

### 9. Backup + ops

Weaviate's [backup module](https://weaviate.io/developers/weaviate/configuration/backups) ships with filesystem, S3, GCS, and Azure backends. For WWU on-prem, filesystem backups to a mounted volume + a daily cron that rsyncs to a second machine is sufficient.

```yaml
# weaviate/docker-compose.yml
services:
  weaviate:
    image: cr.weaviate.io/semitechnologies/weaviate:1.28.0   # pin to specific minor version
    ports:
      - "8080:8080"  # HTTP
      - "50051:50051"  # gRPC
    volumes:
      - ./data:/var/lib/weaviate
      - ./backups:/var/lib/weaviate/backups
    environment:
      QUERY_DEFAULTS_LIMIT: 25
      AUTHENTICATION_APIKEY_ENABLED: 'true'
      AUTHENTICATION_APIKEY_ALLOWED_KEYS: ${WEAVIATE_API_KEY}
      AUTHENTICATION_APIKEY_USERS: 'admin@civilrights'
      PERSISTENCE_DATA_PATH: '/var/lib/weaviate'
      ENABLE_API_BASED_MODULES: 'true'
      ENABLE_MODULES: 'backup-filesystem'
      BACKUP_FILESYSTEM_PATH: '/var/lib/weaviate/backups'
      CLUSTER_HOSTNAME: 'civilrights-node1'
    restart: unless-stopped
```

Version upgrades: pin to a minor version in the Docker compose; review release notes weekly; upgrade with a test restore from the previous night's backup as the safety net.

Monitoring: Weaviate exposes Prometheus metrics on port 2112. A free Grafana Cloud account (10K series limit) is more than enough for this corpus's metric volume.

### 10. Cost projection

| Component | Cost basis | Monthly cost (steady state) |
|---|---|---|
| Weaviate hosting (WWU on-prem) | $0, existing lab hardware | $0 |
| Weaviate hosting (Fly.io fallback) | $1.94-5.40 if separate from MCP allowance | $0-5.40 |
| Voyage AI embeddings (ingest) | $0.06/MTok × ~1M tokens (one-shot, then deltas) | <$0.01 |
| Voyage AI embeddings (queries) | $0.06/MTok × ~10K queries × ~10 tokens each = 100K tokens | <$0.01 |
| Voyage AI rerank | $0.05/1K queries × ~10K queries | $0.50 |
| Cloud Function invocations (proxy) | Existing billing; unchanged | $1-2 |
| Anthropic for RAG-aware summarization | $0.0075/chapter × ~1,350 chapters one-shot, then deltas | <$1 |

**Total monthly steady state: well under $5**, all within the "no recurring SaaS budget" envelope.

### 11. Acceptance criteria for the next agent

Weaviate integration is shippable when:

1. **Docker compose**: `weaviate/docker-compose.yml` brings up Weaviate (with the backup-filesystem module enabled) on a single `docker compose up`.
2. **Schema initialization**: `scripts/init-weaviate-schema.mjs` creates all four classes idempotently (no-op on re-run). Schema matches this document.
3. **Migration**: `scripts/firestore-to-weaviate.mjs` runs to completion against the current Firestore `embeddings` collection and produces a populated Weaviate instance with all four classes. Idempotent (content-hash-skip on re-runs).
4. **Voyage re-embed**: `scripts/reembed-with-voyage.mjs` regenerates every vector in Weaviate with `voyage-3`, using the content-hash idempotency to skip unchanged rows on re-runs. Cost-tracked; reports total tokens consumed.
5. **Voyage client**: `Metadata Generation System/processor/voyage_client.py` matches the design above, with both `embed_documents` and `embed_query`, exponential backoff on 429/5xx, and a `rerank` method that fails open.
6. **Retriever**: `Metadata Generation System/processor/rag_retrieval.py` matches the design above. Has tests for: cache hit, cache miss, fails-open rerank, fails-open Weaviate, filter pass-through, hybrid alpha tuning.
7. **Cloud Function**: `functions/index.js::vectorSearch` proxies to Weaviate when `USE_WEAVIATE=1` is set; falls back to the old Firestore loop otherwise. Frontend gets the same response shape either way.
8. **MCP server**: `mcp-server/server.mjs::searchTranscripts` similarly proxies. Shared adapter module (`mcp-server/lib/retriever.mjs`) imported by both the Cloud Function and the MCP server.
9. **Frontend smoke test**: A search in the React frontend ("voter registration in Mississippi 1964") returns relevant results in <500ms end-to-end.
10. **RAG-ified summarization**: The summarization pipeline calls the retriever and adds related topics + related chapters to its system prompt context. Visible in the prompt logs.
11. **Backup**: `weaviate/scripts/backup.sh` runs successfully on cron and produces a restorable snapshot.
12. **Docs**: `docs/DEPLOYMENT.md` extended with sections on Weaviate setup, Voyage AI key management, the migration script, and the re-embed script.

That's the clean handoff.

## What this does NOT solve

Honest scope:

1. **Cross-language retrieval.** voyage-3 is English-tuned. If interviews ever include Spanish, French, or other non-English content, switch to `voyage-multilingual-2` (same dimension, slightly higher cost per token).

2. **Cold-start latency**. Weaviate's HNSW index loads lazily; the first query after a restart takes 2-5s while the index pages in. Mitigation: a warmup query in the Docker container's healthcheck.

3. **Pre-existing low-quality Whisper transcripts**. Voyage AI embeds whatever it's given. "Megahevers" embeds as a phonetically-distant token from "Medgar Evers", so a query for "Medgar Evers" won't find the segment that mentions "Megahevers". The transcript audit pipeline (see `docs/TRANSCRIPT_AUDIT_DESIGN.md`) is the upstream fix; this RAG substrate benefits from those corrections but doesn't apply them itself.

4. **Multi-tenancy across users**. The current design is single-tenant, all queries hit the same corpus with the same filters. If the project ever needs per-user query scoping (e.g., grant-writer view vs. researcher view), Weaviate supports it via tenant API on the schema; this document does not address that.

5. **Real-time streaming retrieval**. The current design is synchronous request/response. For a future "chat with the archive" UI that streams answers token by token, the retriever can be called once at the start of each turn and the results threaded into Anthropic's streaming response, but the streaming layer itself is out of scope here.

## See also

- `docs/TRANSCRIPT_AUDIT_DESIGN.md`, the upstream transcript quality pipeline. Catches Whisper errors before they pollute the embeddings.
- `docs/DEPLOYMENT.md`, operator-level setup. Will be extended with Weaviate + Voyage AI setup once implemented.
- `CLAUDE.md`, project-wide architectural notes.
- `C:\worldthought.com`, the closest sibling implementation (Pinecone + voyage-3). Key files: `scripts/rag/ingest.mjs`, `scripts/rag/shared.mjs`, `netlify/functions/chat.mjs`, `CLAUDE.md` (sections 41-122).
- `C:\aigamma.com`, the efficiency-pattern reference (Supabase pgvector + gte-small). Key files: `docs/rag-architecture.md`, `scripts/rag/ingest.mjs`, `netlify/functions/chat.mjs`, `.github/workflows/refresh-rag.yml`.
- `functions/index.js`, the current Cloud Function that this design replaces. Lines 122-317 (`performVectorSearch`) collapse to ~30 lines once Weaviate is the backend.
- `mcp-server/server.mjs`, the MCP server's `searchTranscripts` tool; refactored to share the adapter with the Cloud Function.
- [Weaviate docs](https://weaviate.io/developers/weaviate), particularly the Hybrid Search and Backup module pages.
- [Voyage AI docs](https://docs.voyageai.com/), particularly the `input_type` parameter documentation and the rerank-2 model card.
