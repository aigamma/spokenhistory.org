#!/usr/bin/env node
// mcp-server/build-people.mjs
//
// Generate mcp-server/data/people.json from public/rag/people/index.json so the
// MCP `list_people` tool ships a pre-computed roster baked into the Docker
// image (the index itself is a website artifact, not copied into the image).
//
// Usage (from project root):
//   node mcp-server/build-people.mjs
//
// Run after the person catalog changes. Commit the resulting people.json so the
// Docker image build picks it up. CI enforces this via a drift check.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const SRC_PATH = join(REPO_ROOT, 'public', 'rag', 'people', 'index.json')
const OUT_PATH = join(__dirname, 'data', 'people.json')

async function main() {
  const raw = JSON.parse(await readFile(SRC_PATH, 'utf8'))
  const bySlug = raw.by_slug || {}

  const people = Object.values(bySlug).map((p) => ({
    slug: p.slug,
    display_name: p.display_name,
    person_type: p.person_type, // 'interviewee' | 'external_figure'
    entry_number: p.entry_number ?? null,
    role_preview: p.role_preview || null,
    born: p.born ?? null,
    died: p.died ?? null,
  }))

  // Interviewees first (by entry_number), then external figures (alphabetical).
  people.sort((a, b) => {
    if (a.person_type !== b.person_type) {
      return a.person_type === 'interviewee' ? -1 : 1
    }
    if (a.person_type === 'interviewee') {
      return (a.entry_number ?? 1e9) - (b.entry_number ?? 1e9)
    }
    return a.display_name.localeCompare(b.display_name)
  })

  await mkdir(dirname(OUT_PATH), { recursive: true })
  await writeFile(OUT_PATH, JSON.stringify(people, null, 2) + '\n', 'utf8')

  const interviewees = people.filter((p) => p.person_type === 'interviewee').length
  const external = people.length - interviewees
  console.log(`Wrote ${people.length} people to ${OUT_PATH} (${interviewees} interviewees, ${external} external figures)`)
}

main().catch((err) => {
  console.error('build-people failed:', err)
  process.exit(1)
})
