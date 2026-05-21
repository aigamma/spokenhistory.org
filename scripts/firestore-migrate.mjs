#!/usr/bin/env node
/**
 * Firestore migration script: copy collections from one Firebase project
 * to another.
 *
 * Built for the 2026-05-20 transition from the existing `llm-hyper-audio`
 * Firebase project to the new clean `civil-rights-history-project`. The
 * script supports two modes:
 *
 *   - **Full copy** (default): every document in the chosen collections
 *     lands in the destination project unchanged. Use this when the team
 *     wants continuity for a demo and is willing to re-validate later.
 *
 *   - **Filtered copy** (--filter-key / --filter-value): only documents
 *     matching a key/value predicate land in the destination. Use this
 *     to skip the "experimental residue" Dustin wants to leave behind --
 *     for example, --filter-key processingInfo.mode --filter-value complete
 *     copies only the interviews that fully completed all 7 pipeline
 *     steps, leaving partial / failed runs in the old project.
 *
 * Always dry-run first (--dry-run) to count what would be copied without
 * touching the destination. The script is idempotent (set with merge=true)
 * so re-running after a partial failure picks up where it left off without
 * duplicating writes.
 *
 * Usage:
 *   node scripts/firestore-migrate.mjs --source <path> --dest <path> [options]
 *
 * Required:
 *   --source <path>         Service-account JSON for source project
 *   --dest <path>           Service-account JSON for destination project
 *
 * Optional:
 *   --collections <list>    Comma-separated (default: interviewIndex,events_and_topics,embeddings)
 *   --dry-run               Count documents, don't write
 *   --filter-key <key>      Only copy docs where this key is present (supports dot.notation)
 *   --filter-value <value>  Combined with --filter-key, only copy where filter-key === filter-value
 *   --concurrency <n>       Parallel writes per collection (default 10)
 *   --include-subcollections  Also copy known sub-collections (subSummaries under interviewIndex)
 *
 * Examples:
 *   Dry-run the default collections (count what would land):
 *     node scripts/firestore-migrate.mjs --source src.json --dest dst.json --dry-run
 *
 *   Full migrate of interviewIndex including the per-interview subSummaries:
 *     node scripts/firestore-migrate.mjs --source src.json --dest dst.json \
 *         --collections interviewIndex --include-subcollections
 *
 *   Migrate only interviews that completed all 7 pipeline steps:
 *     node scripts/firestore-migrate.mjs --source src.json --dest dst.json \
 *         --collections interviewIndex --include-subcollections \
 *         --filter-key processingInfo.mode --filter-value complete
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import fs from 'fs/promises'

const DEFAULT_COLLECTIONS = ['interviewIndex', 'events_and_topics', 'embeddings']
const DEFAULT_CONCURRENCY = 10

// Known nested-collection shapes. Each top-level collection maps to a
// list of sub-collection names that should be copied per parent document
// when --include-subcollections is enabled. Sub-collections of
// sub-collections are NOT traversed (single-level depth) because the
// existing pipeline does not produce deeper nesting.
const KNOWN_SUB_COLLECTIONS = {
  interviewIndex: ['subSummaries'],
}

function parseArgs(argv) {
  const args = {
    source: null,
    dest: null,
    collections: null,
    dryRun: false,
    filterKey: null,
    filterValue: null,
    concurrency: DEFAULT_CONCURRENCY,
    includeSubCollections: false,
  }
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--source') args.source = argv[++i]
    else if (arg === '--dest') args.dest = argv[++i]
    else if (arg === '--collections') args.collections = argv[++i].split(',').map((s) => s.trim()).filter(Boolean)
    else if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--filter-key') args.filterKey = argv[++i]
    else if (arg === '--filter-value') args.filterValue = argv[++i]
    else if (arg === '--concurrency') args.concurrency = parseInt(argv[++i], 10) || DEFAULT_CONCURRENCY
    else if (arg === '--include-subcollections') args.includeSubCollections = true
    else if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    }
  }
  return args
}

function printUsage() {
  console.error('Usage: node scripts/firestore-migrate.mjs --source <src.json> --dest <dst.json> [options]')
  console.error('  --collections <list>         Comma-separated (default: interviewIndex,events_and_topics,embeddings)')
  console.error('  --dry-run                    Count only, no writes')
  console.error('  --filter-key <key>           Only copy docs with this key present (supports dot.notation)')
  console.error('  --filter-value <value>       Combined with --filter-key, only copy where filter-key equals this')
  console.error('  --concurrency <n>            Parallel writes per collection (default 10)')
  console.error('  --include-subcollections     Also copy subSummaries under interviewIndex')
}

function getNestedValue(obj, dotKey) {
  if (!obj || !dotKey) return undefined
  const parts = dotKey.split('.')
  let cursor = obj
  for (const part of parts) {
    if (cursor === null || cursor === undefined) return undefined
    cursor = cursor[part]
  }
  return cursor
}

function shouldCopyDoc(data, filterKey, filterValue) {
  if (!filterKey) return true
  const value = getNestedValue(data, filterKey)
  if (value === undefined || value === null) return false
  if (filterValue === null) return true
  return String(value) === String(filterValue)
}

async function loadServiceAccount(filePath) {
  const json = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(json)
}

async function copyCollection({
  srcDb,
  dstDb,
  collName,
  dryRun,
  filterKey,
  filterValue,
  concurrency,
  includeSubCollections,
  parentDocPath = '',
  indent = '',
}) {
  const srcCollPath = parentDocPath ? `${parentDocPath}/${collName}` : collName
  console.log(`${indent}Reading ${srcCollPath}...`)

  const srcColl = srcDb.collection(srcCollPath)
  const snapshot = await srcColl.get()
  console.log(`${indent}  ${snapshot.size} document(s) in source`)

  let copied = 0
  let skipped = 0
  const tasks = []

  for (const doc of snapshot.docs) {
    const data = doc.data()
    if (!shouldCopyDoc(data, filterKey, filterValue)) {
      skipped++
      continue
    }
    const targetPath = `${srcCollPath}/${doc.id}`

    if (dryRun) {
      copied++
      continue
    }

    tasks.push(
      (async () => {
        await dstDb.doc(targetPath).set(data, { merge: true })
      })(),
    )

    if (tasks.length >= concurrency) {
      await Promise.all(tasks.splice(0, concurrency))
      copied += concurrency
      if (copied % 100 === 0) {
        console.log(`${indent}  Copied ${copied}/${snapshot.size}...`)
      }
    }
  }

  if (tasks.length) {
    const remaining = tasks.length
    await Promise.all(tasks)
    copied += remaining
  }

  console.log(`${indent}  ${srcCollPath}: ${copied} copied, ${skipped} skipped`)

  if (includeSubCollections && KNOWN_SUB_COLLECTIONS[collName]) {
    for (const doc of snapshot.docs) {
      const subParentPath = `${srcCollPath}/${doc.id}`
      for (const subName of KNOWN_SUB_COLLECTIONS[collName]) {
        await copyCollection({
          srcDb,
          dstDb,
          collName: subName,
          dryRun,
          filterKey: null,
          filterValue: null,
          concurrency,
          includeSubCollections: false,
          parentDocPath: subParentPath,
          indent: indent + '    ',
        })
      }
    }
  }

  return { copied, skipped }
}

async function main() {
  const args = parseArgs(process.argv)
  if (!args.source || !args.dest) {
    printUsage()
    process.exit(1)
  }

  const sourceServiceAccount = await loadServiceAccount(args.source)
  const destServiceAccount = await loadServiceAccount(args.dest)

  console.log(`Source project: ${sourceServiceAccount.project_id}`)
  console.log(`Dest project:   ${destServiceAccount.project_id}`)
  if (sourceServiceAccount.project_id === destServiceAccount.project_id) {
    console.error('ERROR: source and dest are the same project. Aborting to prevent self-copy.')
    process.exit(1)
  }

  const srcApp = initializeApp({ credential: cert(sourceServiceAccount) }, 'source')
  const dstApp = initializeApp({ credential: cert(destServiceAccount) }, 'dest')
  const srcDb = getFirestore(srcApp)
  const dstDb = getFirestore(dstApp)

  const collections = args.collections || DEFAULT_COLLECTIONS
  console.log(`Collections: ${collections.join(', ')}`)
  console.log(`Mode: ${args.dryRun ? 'DRY RUN' : 'WRITE'}`)
  if (args.filterKey) {
    const valueClause =
      args.filterValue !== null ? `== ${args.filterValue}` : '(present)'
    console.log(`Filter: ${args.filterKey} ${valueClause}`)
  }
  console.log()

  const totals = { copied: 0, skipped: 0 }

  for (const coll of collections) {
    const result = await copyCollection({
      srcDb,
      dstDb,
      collName: coll,
      dryRun: args.dryRun,
      filterKey: args.filterKey,
      filterValue: args.filterValue,
      concurrency: args.concurrency,
      includeSubCollections: args.includeSubCollections,
    })
    totals.copied += result.copied
    totals.skipped += result.skipped
  }

  console.log()
  console.log(`Total: ${totals.copied} copied, ${totals.skipped} skipped`)
  if (args.dryRun) {
    console.log('Dry run complete -- no writes performed.')
  } else {
    console.log('Migration complete.')
  }
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
