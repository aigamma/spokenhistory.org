# mcp-server/ — Civil Rights History Project MCP server

Remote MCP server exposing the Library of Congress / Smithsonian NMAAHC
civil rights oral history archive via the Model Context Protocol.

**End-user documentation:** see [`USAGE_GUIDE.md`](./USAGE_GUIDE.md) — the
audience-facing guide that explains the tools, the citation patterns,
and the worked examples. Read that first if you are evaluating the
connector for use in Claude Desktop / claude.ai / another MCP client.

This README is for engineers maintaining the server.

## Architecture

```
   MCP client (Claude Desktop, claude.ai Custom Connector, etc.)
                          |
                          v
   StreamableHTTP transport over POST /mcp
                          |
                          v
   server.mjs (Express + @modelcontextprotocol/sdk)
                          |
        ┌─────────────────┼─────────────────┐
        v                 v                 v
   Voyage AI          Pinecone           data/leaders.json
   (voyage-3          (civil-rights      (pre-baked roster
   + rerank-2)        index, query)      built from manifests)
```

Three tools: `search_transcripts`, `get_transcript`, `list_leaders`. Three
prompts: `compare_perspectives`, `trace_evolution`, `source_for_claim`. All
defined in `server.mjs`.

## Local development

```bash
cd mcp-server
npm install
# Create a .env (or export inline) with the three required keys:
#   PINECONE_API_KEY=...
#   PINECONE_HOST=https://civil-rights-<hash>.svc.<region>.pinecone.io
#   VOYAGE_API_KEY=...
# Then:
npm run dev
# Server listens on :3001 by default; POST /mcp for the MCP endpoint,
# GET /healthz for the liveness probe.
```

To regenerate the static `data/leaders.json` roster after corpus changes:

```bash
npm run build:leaders
# Reads transcripts/corrected/<dir>/manifest.json across all 136 entries
# and emits data/leaders.json. Commit the result so the Docker image
# build picks it up.
```

## Deployment

Fly.io is the default target. See `fly.toml` for the full quickstart.
Summary:

1. `flyctl auth login`
2. `flyctl secrets set PINECONE_API_KEY=... PINECONE_HOST=... VOYAGE_API_KEY=...`
3. `flyctl deploy`
4. Configure custom domain via `flyctl certs add <hostname>`

The Docker image is self-contained (the retrieval logic is inlined into
`server.mjs` — no parent-dir COPY needed). VM size is shared-cpu-1x with
256 MB; the in-process working set is small since Voyage + Pinecone are
HTTP services.

## Substrate notes (post-2026-05-25 rewire)

The server originally used OpenAI `text-embedding-3-small` (1536-dim) +
Firestore's `embeddings` collection with in-process cosine similarity.
On 2026-05-22 the RAG substrate decision pivoted to Pinecone Builder +
Voyage AI (see `docs/RAG_SUBSTRATE_DECISION.md`), and on 2026-05-25 the
MCP server was rewired to match.

The retrieval helpers in `server.mjs` (`embedQuery`, `pineconeQuery`,
`voyageRerank`, `retrieve`) mirror the same-named exports in `rag/embed.mjs`
and `rag/retrieve.mjs`. The duplication is intentional: it keeps the
Docker build context isolated to the `mcp-server/` directory so the
Fly.io deploy doesn't depend on copying parent files. If the upstream
`rag/` modules evolve (e.g., new model, hybrid sparse-dense support),
mirror those changes here.

## Tool response shape (citation-grade payload)

Every `search_transcripts` and `get_transcript` chunk result carries
this shape (see `toCitationPayload` in `server.mjs`):

```js
{
  // identity
  id, entryNumber, entrySubject, chunkIndex,
  // passage
  text, textPreview,
  // citation
  locItemUrl, timestampStart, timestampEnd,
  timestampStartStr, timestampEndStr,
  // transparency
  entryProvenance,         // 'audit-original' | 'ingestion-only'
  uncertaintyTier,         // 'low' | 'medium' | 'high' | 'ingestion-only'
  uncertaintyScore,        // numeric, 0.0–~0.5
  fidelityNote,            // human-readable one-line
  // ranking
  pineconeScore, rerankScore, similarity,
  // pre-formatted citation
  suggestedCitation,       // Chicago-Manual-of-Style block
  // legacy-compat
  interviewName, documentId, timestamp, type,
  videoEmbedLink, sourcePath, sourceExt
}
```

The transparency fields are load-bearing for the academic-citation use
case. Do not strip them in a future refactor without an explicit reason.

## Environment variables

| Var | Required? | Purpose |
|---|---|---|
| `PINECONE_API_KEY` | yes | Pinecone API key for the civil-rights project |
| `PINECONE_HOST` | yes | Pinecone serverless index host URL |
| `VOYAGE_API_KEY` | yes | Voyage AI API key (shared with worldthought.com) |
| `PINECONE_INDEX` | no | default `civil-rights` |
| `VOYAGE_MODEL` | no | default `voyage-3` |
| `VOYAGE_RERANK_MODEL` | no | default `rerank-2` |
| `MCP_RERANK_ENABLED` | no | default `true`; set `false` to skip stage 2 |
| `PORT` | no | default 3001 |

Authentication on the `/mcp` endpoint is currently open. For Anthropic
Connector Directory inclusion or per-user audit trails, OAuth 2.1 plugs
in at the Express middleware layer before the StreamableHTTP transport.

## Related modules

| Path | Purpose |
|---|---|
| `rag/shared.mjs` | Upstream source for the env-var + headers helpers (mirror here) |
| `rag/embed.mjs` | Upstream source for `embedQuery` |
| `rag/retrieve.mjs` | Upstream source for `pineconeQuery` + `voyageRerank` + `retrieve` |
| `rag/ingest.mjs` | Pinecone ingestion (writes the vectors the MCP server queries) |
| `rag/README.md` | RAG substrate architecture + setup |
| `rag/CONFERENCE_PREP.md` | London-conference brief |
