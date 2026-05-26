# netlify/functions/ — Netlify Function endpoints

Server-side helpers that proxy public requests to external services
(Pinecone, Voyage) without exposing API keys in the client bundle.

## Functions

### `retrieve.mjs` — public semantic-search proxy

**Endpoint:** `POST /retrieve` (also accessible at the default
`POST /.netlify/functions/retrieve`)

**Purpose:** the React frontend's semantic-search box, quote-finder,
related-passages live-refresh, and any other browser-initiated RAG
query goes through this function. Keeps `PINECONE_API_KEY` /
`VOYAGE_API_KEY` server-side.

**Request body:**

```jsonc
{
  "query": "string (required, max 4000 chars)",
  "topN": "number (1-50, default 8)",
  "topK": "number (auto, default max(3*topN, 30))",
  "filter": "Pinecone metadata filter object (optional)",
  "entry_number": "number — shortcut for {filter: {entry_number: {$eq: N}}}",
  "namespace": "Pinecone namespace string (optional, default '')",
  "dedupeByEntry": "boolean — one passage per interviewee (default false)"
}
```

**Response:**

```jsonc
{
  "results": [/* citation-grade payloads — see mcp-server/USAGE_GUIDE.md */],
  "meta": {
    "rerankEnabled": true,
    "model": "voyage-3",
    "rerankModel": "rerank-2",
    "index": "civil-rights",
    "topK": 30,
    "topN": 8
  }
}
```

The response shape mirrors the MCP server's `search_transcripts` tool
output (the `toCitationPayload` shape) so UI components are
substrate-agnostic — they consume the same `{ entryNumber,
entrySubject, text, locItemUrl, timestampStart, suggestedCitation,
fidelityNote, ... }` records whether the source is the MCP server or
this Netlify function.

**Required environment variables (Netlify dashboard):**

- `PINECONE_API_KEY`
- `PINECONE_HOST`
- `VOYAGE_API_KEY`

**Optional:**

- `PINECONE_INDEX` (default `civil-rights`)
- `VOYAGE_MODEL` (default `voyage-3`)
- `VOYAGE_RERANK_MODEL` (default `rerank-2`)
- `RETRIEVE_RERANK_ENABLED` (default `true`; set `false` to skip stage 2)
- `RETRIEVE_ALLOWED_ORIGINS` (default `*`; comma-separated list of
  allowed origins for CORS, e.g.
  `https://civil-rights-staging.netlify.app,https://civilrightshistory.org`)

The function is self-contained (no imports from the `rag/` workspace)
so Netlify's function bundler doesn't have to chase dependencies
across directory boundaries. The retrieval primitives mirror
`rag/embed.mjs` + `rag/retrieve.mjs` — track those as upstream.

## Local development

Netlify Functions can be tested locally via the Netlify CLI:

```bash
npm install -g netlify-cli
# From the project root:
netlify dev
# Function is then available at http://localhost:8888/retrieve
```

Set the required environment variables in `.env` or via
`netlify env:set PINECONE_API_KEY ...` before running.

## Adding more functions

Drop a new `.mjs` file in this directory. Netlify auto-discovers
`netlify/functions/<name>.mjs` and exposes it at
`/.netlify/functions/<name>`. Use `export const config = { path: '/foo' }`
to alias to a pretty URL.

For functions that share retrieval primitives, consider extracting the
common code into a private helper file and importing from there.
