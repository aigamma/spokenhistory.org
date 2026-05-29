# Civil Rights MCP Setup for Codex

This file sets up the Civil Rights History Project MCP server as a local
stdio server for Codex.

## Prerequisites

1. Install Node.js 20 or newer.
2. Clone the repository.
3. Install MCP server dependencies:

```powershell
cd C:\path\to\civil\mcp-server
npm install
```

4. Create `mcp-server/.env.local` from `mcp-server/.env.example`:

```env
PINECONE_API_KEY=your-pinecone-key
PINECONE_HOST=https://your-civil-rights-index-host.pinecone.io
PINECONE_INDEX=civil-rights

VOYAGE_API_KEY=your-voyage-key
VOYAGE_MODEL=voyage-3
VOYAGE_RERANK_MODEL=rerank-2

MCP_RERANK_ENABLED=true
```

Do not commit `.env.local`.

## Where Files Go

Assume the user cloned the repo to:

```text
C:\path\to\civil
```

Use these paths:

| File | Put it here | Notes |
|---|---|---|
| MCP secrets file | `C:\path\to\civil\mcp-server\.env.local` | Local-only file with Pinecone and Voyage keys. Create from `mcp-server\.env.example`. |
| Codex config block | `C:\Users\<you>\.codex\config.toml` | Add the TOML block below to the user's existing Codex config. Do not replace the whole file unless it is empty. |

On macOS or Linux, the Codex config path is:

```text
~/.codex/config.toml
```

The path inside the Codex `args` array must point to that user's local
clone, for example `C:/Users/Avery/projects/civil/mcp-server/server.mjs`
on Windows or `/Users/avery/projects/civil/mcp-server/server.mjs` on
macOS.

## Codex Setup

Add this block to `~/.codex/config.toml`. Use an absolute path to the
repo on that machine.

Windows example:

```toml
[mcp_servers.civil_rights]
command = "node"
args = ["C:/path/to/civil/mcp-server/server.mjs", "--stdio"]
startup_timeout_sec = 120

[mcp_servers.civil_rights.env]
PINECONE_API_KEY = "your-pinecone-key"
PINECONE_HOST = "https://your-civil-rights-index-host.pinecone.io"
PINECONE_INDEX = "civil-rights"
VOYAGE_API_KEY = "your-voyage-key"
VOYAGE_MODEL = "voyage-3"
VOYAGE_RERANK_MODEL = "rerank-2"
MCP_RERANK_ENABLED = "true"
```

macOS or Linux example:

```toml
[mcp_servers.civil_rights]
command = "node"
args = ["/absolute/path/to/civil/mcp-server/server.mjs", "--stdio"]
startup_timeout_sec = 120

[mcp_servers.civil_rights.env]
PINECONE_API_KEY = "your-pinecone-key"
PINECONE_HOST = "https://your-civil-rights-index-host.pinecone.io"
PINECONE_INDEX = "civil-rights"
VOYAGE_API_KEY = "your-voyage-key"
VOYAGE_MODEL = "voyage-3"
VOYAGE_RERANK_MODEL = "rerank-2"
MCP_RERANK_ENABLED = "true"
```

Restart Codex after editing the config.

## Verify

From `mcp-server/`, run:

```powershell
npm run smoke
```

Expected tools:

- `search_transcripts`
- `get_transcript`
- `list_leaders`
- `compare_perspectives`
- `trace_evolution`
- `source_for_claim`

Expected prompts:

- `compare_perspectives`
- `trace_evolution`
- `source_for_claim`

If `npm run smoke` works but the client shows fewer tools, restart the
client. Some clients cache MCP tool lists until a full reload.
