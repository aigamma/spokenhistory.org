# RAG endpoint reference

A one-page lookup for the URLs/IDs/keys that make the RAG layer go.
For internal use; not a stakeholder doc.

## Live URLs (staging)

| Path | What it is |
|---|---|
| `https://civil-rights-staging.netlify.app/` | The site root |
| `https://civil-rights-staging.netlify.app/rag-explore` | The 4-tab RAG demo page (auth-gated) |
| `https://civil-rights-staging.netlify.app/rag-explore#search` | Semantic search tab (default) |
| `https://civil-rights-staging.netlify.app/rag-explore?q=nonviolence#search` | Search tab with query pre-loaded + auto-executed (deep-linkable share URL) |
| `https://civil-rights-staging.netlify.app/rag-explore#quote` | Quote-finder tab |
| `https://civil-rights-staging.netlify.app/rag-explore#map` | Embedding-space scatter |
| `https://civil-rights-staging.netlify.app/rag-explore#related` | Related-interviewees tab |
| `https://civil-rights-staging.netlify.app/retrieve` | POST endpoint for live retrieval (also `/.netlify/functions/retrieve`) |
| `https://civil-rights-staging.netlify.app/rag/constellation.json` | 2D PCA scatter data |
| `https://civil-rights-staging.netlify.app/rag/centroids.json` | Per-entry mean embeddings (1024-dim) |
| `https://civil-rights-staging.netlify.app/rag/related/entry-<N>.json` | Per-entry related-passages (136 files) |

## Backend identifiers

| Resource | Identifier |
|---|---|
| Pinecone index name | `civil-rights` |
| Pinecone index host | `https://civil-rights-odc9z70.svc.aped-4627-b74a.pinecone.io` |
| Pinecone vector count | 15,464 (`.srt`-only) |
| Pinecone region | `aws-us-east-1` |
| Pinecone dimension | 1024 |
| Pinecone metric | cosine |
| Voyage embedding model | `voyage-3` (input_type 'document' at ingest, 'query' at retrieve) |
| Voyage rerank model | `rerank-2` |
| Netlify project name | `civil-rights-staging` |
| Netlify siteId | `c0f91bc7-5e3d-46ba-82bb-e44cb8fd47e9` |
| Firebase project | `civil-rights-history-project` (Firestore in `nam7`) |
| MCP server (when deployed) | `mcp.civilrightshistory.org` or `civil-rights-history-mcp.fly.dev` (TBD per fly.toml) |

## `/retrieve` body parameters

```jsonc
{
  "query": "string (required, max 4000 chars)",
  "topN": 8,                               // 1-50, default 8
  "topK": null,                            // optional, defaults to max(3*topN, 30)
  "entry_number": null,                    // optional shortcut for single-entry filter
  "filter": null,                          // optional Pinecone metadata filter object
  "namespace": "",                         // optional Pinecone namespace
  "dedupeByEntry": false                   // optional — one passage per interviewee
}
```

## `/retrieve` response shape

```jsonc
{
  "results": [/* citation-grade payloads */],
  "meta": {
    "rerankEnabled": true,
    "model": "voyage-3",
    "rerankModel": "rerank-2",
    "index": "civil-rights",
    "topK": 30,
    "topN": 8,
    "dedupeByEntry": false
  }
}
```

Citation-grade payload fields (per result):

```jsonc
{
  "id": "string",
  "entryNumber": 73,
  "entrySubject": "Kathleen Cleaver",
  "chunkIndex": 42,
  "text": "string (full passage)",
  "textPreview": "string (first 200 chars + ellipsis)",
  "locItemUrl": "https://www.loc.gov/item/2015669147/",
  "timestampStart": 1842,        // seconds
  "timestampEnd": 1893,
  "timestampStartStr": "00:30:42",
  "timestampEndStr": "00:31:33",
  "entryProvenance": "audit-original",
  "uncertaintyTier": "low",      // 5 values: low|medium|publication-block|not-auditable|ingestion-only
  "uncertaintyScore": 0.31,
  "fidelityNote": "Audited transcript (Pass 1–8 + LoC heal); high confidence in fidelity.",
  "pineconeScore": 0.79,
  "rerankScore": 0.92,
  "similarity": 0.92,            // = rerankScore ?? pineconeScore
  "suggestedCitation": "Chicago-style citation block ending with the timestamp range",
  "sourcePath": "transcripts/corrected/.../...srt",
  "sourceExt": ".srt"
}
```

## Required env vars (Netlify + Fly.io)

- `PINECONE_API_KEY` (secret-equivalent; set without `is_secret: true` on Netlify — see [[reference_netlify_mcp_envvar_secret]])
- `PINECONE_HOST` — full URL including https://
- `VOYAGE_API_KEY`
- Optional defaults: `PINECONE_INDEX=civil-rights`, `VOYAGE_MODEL=voyage-3`, `VOYAGE_RERANK_MODEL=rerank-2`, `MCP_RERANK_ENABLED=true`, `RETRIEVE_ALLOWED_ORIGINS=*`

## Regenerating artifacts

```bash
# From the project root:

# Full ingest (after corrected/ changes; idempotent on content hash)
node --env-file=rag/.env.local rag/ingest.mjs

# Drop ingested vectors that are no longer in corrected/ (e.g., after
# pruning .txt/.vtt as we did on 2026-05-25)
node --env-file=rag/.env.local rag/ingest.mjs --prune

# Precompute the static artifacts
node --env-file=rag/.env.local rag/precompute.mjs               # all features
node --env-file=rag/.env.local rag/precompute.mjs --feature related
node --env-file=rag/.env.local rag/precompute.mjs --feature centroids
node --env-file=rag/.env.local rag/precompute.mjs --feature constellation

# Refresh the MCP server's list_leaders data
cd mcp-server && node build-leaders.mjs

# Run the demo queries against the live function
bash scripts/demo-queries.sh           # all 8 queries
bash scripts/demo-queries.sh till      # one query by name
```
