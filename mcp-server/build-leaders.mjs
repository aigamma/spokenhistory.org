#!/usr/bin/env node
// mcp-server/build-leaders.mjs
//
// Generate mcp-server/data/leaders.json from the corpus manifests at
// transcripts/corrected/<dir>/manifest.json. Pinecone can't enumerate
// distinct entry_subject values cheaply, so the MCP `list_leaders` tool
// ships a pre-computed roster instead. This script regenerates it.
//
// Usage (from project root):
//   node mcp-server/build-leaders.mjs
//
// Run this any time the corpus changes (new entries added, manifest
// fields updated). Commit the resulting leaders.json so the Docker image
// build picks it up.

import { readFile, readdir, stat, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const CORRECTED_ROOT = join(REPO_ROOT, 'transcripts', 'corrected')
const OUT_PATH = join(__dirname, 'data', 'leaders.json')

async function main() {
  const entries = []
  let dirs
  try {
    dirs = await readdir(CORRECTED_ROOT, { withFileTypes: true })
  } catch (e) {
    console.error(`Cannot read ${CORRECTED_ROOT}: ${e.message}`)
    process.exit(1)
  }
  for (const ent of dirs) {
    if (!ent.isDirectory()) continue
    const manifestPath = join(CORRECTED_ROOT, ent.name, 'manifest.json')
    try {
      await stat(manifestPath)
    } catch {
      continue
    }
    let m
    try {
      const text = await readFile(manifestPath, 'utf8')
      m = JSON.parse(text)
    } catch (e) {
      console.warn(`[build-leaders] ${ent.name}: manifest unreadable (${e.message}); skipping`)
      continue
    }
    if (m.entry_number == null || !m.entry_subject) {
      console.warn(`[build-leaders] ${ent.name}: missing entry_number or entry_subject; skipping`)
      continue
    }
    entries.push({
      entry_number: m.entry_number,
      name: m.entry_subject,
      sourceDir: ent.name,
      locItemUrl: m.loc_healing?.loc_item_url || null,
      entryProvenance: m.entry_provenance || 'unknown',
      uncertaintyTier: m.inferential_uncertainty?.confidence_tier || null,
      uncertaintyScore: typeof m.inferential_uncertainty?.score === 'number' ? m.inferential_uncertainty.score : null,
    })
  }
  entries.sort((a, b) => a.entry_number - b.entry_number)

  await mkdir(dirname(OUT_PATH), { recursive: true })
  await writeFile(OUT_PATH, JSON.stringify(entries, null, 2) + '\n', 'utf8')
  console.log(`[build-leaders] wrote ${entries.length} entries to ${OUT_PATH}`)
  const counts = { 'audit-original': 0, 'ingestion-only': 0, unknown: 0 }
  for (const e of entries) {
    counts[e.entryProvenance] = (counts[e.entryProvenance] || 0) + 1
  }
  console.log(`[build-leaders] provenance: ${JSON.stringify(counts)}`)
}

main().catch((e) => {
  console.error('[build-leaders] fatal:', e?.stack || e?.message || e)
  process.exit(1)
})
