/**
 * MCP server stdio smoke test.
 *
 * Spawns the server in stdio mode with env loaded from rag/.env.local,
 * issues tools/list and prompts/list, and prints the result. Use this
 * to verify the stdio surface matches the canonical advertised set
 * before deploying a server change or onboarding a new MCP client.
 *
 * Expected output (current canonical surface, 2026-05-26):
 *   TOOLS:   [ search_transcripts, get_transcript, list_leaders,
 *              compare_perspectives, trace_evolution, source_for_claim ]
 *   PROMPTS: [ compare_perspectives, trace_evolution, source_for_claim ]
 *
 * Run from the mcp-server/ directory:
 *   npm run smoke
 * or directly:
 *   node scripts/smoke_stdio.mjs
 *
 * If a client (Codex Desktop, Claude Desktop) shows a smaller set of
 * tools than this script reports, the discrepancy is on the client's
 * display/relevance-filtering side, the server itself is advertising
 * the full set.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const mcpRoot = join(here, '..')
const envFile = join(mcpRoot, '..', 'rag', '.env.local')

const env = { ...process.env }
for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) env[m[1]] = m[2]
}

const transport = new StdioClientTransport({
  command: 'node',
  args: [join(mcpRoot, 'server.mjs'), '--stdio'],
  env,
})
const client = new Client({ name: 'smoke-stdio', version: '0.0.1' }, { capabilities: {} })
await client.connect(transport)

const tools = await client.listTools()
console.log('TOOLS:  ', tools.tools.map((t) => t.name))

const prompts = await client.listPrompts()
console.log('PROMPTS:', prompts.prompts.map((p) => p.name))

const EXPECTED_TOOLS = [
  'search_transcripts',
  'get_transcript',
  'list_leaders',
  'compare_perspectives',
  'trace_evolution',
  'source_for_claim',
]
const EXPECTED_PROMPTS = ['compare_perspectives', 'trace_evolution', 'source_for_claim']

const toolNames = new Set(tools.tools.map((t) => t.name))
const promptNames = new Set(prompts.prompts.map((p) => p.name))
const missingTools = EXPECTED_TOOLS.filter((t) => !toolNames.has(t))
const missingPrompts = EXPECTED_PROMPTS.filter((p) => !promptNames.has(p))

await client.close()

if (missingTools.length || missingPrompts.length) {
  if (missingTools.length) console.error('MISSING tools:', missingTools)
  if (missingPrompts.length) console.error('MISSING prompts:', missingPrompts)
  process.exit(1)
}
console.log('OK, server advertises the canonical surface.')
