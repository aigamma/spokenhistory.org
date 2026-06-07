#!/usr/bin/env node
// mcp-server/build-essays.mjs
//
// Generate mcp-server/data/essays.json from public/rag/essays/index.json so the
// MCP `list_essays` tool ships a pre-computed catalog baked into the Docker
// image (the index itself is a website artifact, not copied into the image).
//
// Usage (from project root):
//   node mcp-server/build-essays.mjs
//
// Run after the essay collection changes. Commit the resulting essays.json so
// the Docker image build picks it up. CI enforces this via a drift check.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const SRC_PATH = join(REPO_ROOT, 'public', 'rag', 'essays', 'index.json')
const OUT_PATH = join(__dirname, 'data', 'essays.json')

async function main() {
  const raw = JSON.parse(await readFile(SRC_PATH, 'utf8'))

  const essays = (raw.essays || []).map((e) => ({
    slug: e.slug,
    title: e.title,
    authors: e.authors || [],
    year: e.year ?? null,
    collection: e.collection || null,
    themes: e.themes || [],
  }))

  const topics = (raw.topics || []).map((t) => ({
    id: t.id,
    label: t.label,
    description: t.description || null,
    essay_count: t.essay_count ?? (t.essay_slugs ? t.essay_slugs.length : null),
    essay_slugs: t.essay_slugs || [],
  }))

  const out = { topics, essays }

  await mkdir(dirname(OUT_PATH), { recursive: true })
  await writeFile(OUT_PATH, JSON.stringify(out, null, 2) + '\n', 'utf8')
  console.log(`Wrote ${essays.length} essays and ${topics.length} topics to ${OUT_PATH}`)
}

main().catch((err) => {
  console.error('build-essays failed:', err)
  process.exit(1)
})
