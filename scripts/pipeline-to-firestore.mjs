#!/usr/bin/env node
/**
 * Push a pipeline JSON output (from `Metadata Generation System/run_sample.py`
 * or the Flask UI's quick-run path) into the new `civil-rights-history-project`
 * Firestore as the schema the React app reads.
 *
 * Schema mapping (Firestore <- pipeline JSON):
 *   interviewIndex/{slug}                              <- top-level fields
 *     ├─ name              <- interview_name
 *     ├─ summary           <- main_summary.summary
 *     ├─ key_themes        <- main_summary.key_themes
 *     ├─ historical_significance <- main_summary.historical_significance
 *     ├─ quality_metrics   <- main_summary.quality_metrics
 *     ├─ engagement_scores <- engagement_scores
 *     ├─ cost_data         <- cost_data (without call_log to keep doc small)
 *     ├─ youtube_video_id  <- youtube_video_id
 *     ├─ processed_at      <- ISO timestamp (now)
 *     └─ pipeline_version  <- "dual-scorer-1" (constant for now)
 *
 *   interviewIndex/{slug}/subSummaries/{chapter_NN}    <- chapters[i]
 *     ├─ title             <- chapters[i].title
 *     ├─ summary           <- chapters[i].summary
 *     ├─ topic             <- chapters[i].main_topic_category
 *     ├─ keywords          <- chapters[i].keywords (comma-joined string)
 *     ├─ related_events    <- chapters[i].related_events
 *     ├─ chapter_number    <- chapters[i].chapter_number
 *     ├─ timestamp         <- "[hh:mm:ss] - [hh:mm:ss]" derived from start_time/end_time
 *     └─ quality_metrics   <- chapters[i].quality_metrics
 *
 * The slug is a kebab-case form of interview_name (e.g., "Maynard E. Moore"
 * becomes "maynard-e-moore") so it stays stable across re-runs. Existing
 * documents at the same slug are overwritten with merge=true so a re-run
 * doesn't duplicate.
 *
 * Usage:
 *   node scripts/pipeline-to-firestore.mjs \
 *       --input "Metadata Generation System/run_sample_output.json" \
 *       --service-account path/to/civil-rights-history-project-firebase-adminsdk.json \
 *       [--dry-run]
 *
 * The service account JSON is downloaded from the Firebase Console:
 *   Project settings -> Service accounts -> Generate new private key.
 * Drop it in a gitignored location (the scripts/firebase/ directory is
 * already gitignored). NEVER commit the JSON to git.
 *
 * --dry-run prints what would be written without authenticating to Firebase.
 * Use it to validate the input JSON's shape before paying for any writes.
 *
 * Built 2026-05-22 as part of the post-PoC deployment chain. The previous
 * step (Metadata Generation System/run_sample.py) produces the JSON; this
 * step is the bridge between Python (which runs the pipeline) and
 * JavaScript (which writes to Firestore via firebase-admin).
 */

import fs from 'fs/promises'
import path from 'path'

const args = parseArgs(process.argv.slice(2))

function parseArgs(argv) {
  const out = {
    input: null,
    serviceAccount: null,
    dryRun: false,
    slug: null,
    // Default 'interviewIndex' matches the migrate-script default and
    // the InterviewIndex.jsx listing-page read. But many other React
    // pages (ClipPlayer, ClipsDirectory, KeywordDirectory, MetadataPanel,
    // RelatedClips, MapVisualization) read from 'interviewSummaries'
    // -- a legacy upstream collection name. To populate both targets,
    // run the script twice with --collection interviewIndex and
    // --collection interviewSummaries. The upstream is mid-migration
    // between the two; see src/services/collectionMapper.js for the
    // V1/V2 dispatcher that some pages use.
    collection: 'interviewIndex',
    bothCollections: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--input') out.input = argv[++i]
    else if (a === '--service-account') out.serviceAccount = argv[++i]
    else if (a === '--dry-run') out.dryRun = true
    else if (a === '--slug') out.slug = argv[++i]
    else if (a === '--collection') out.collection = argv[++i]
    else if (a === '--both-collections') out.bothCollections = true
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts/pipeline-to-firestore.mjs --input <json> --service-account <json> [options]')
      console.log('Options:')
      console.log('  --dry-run               Validate shape without writing')
      console.log('  --slug <override>       Override the auto-generated slug')
      console.log('  --collection <name>     Target collection (default: interviewIndex)')
      console.log('  --both-collections      Write to BOTH interviewIndex and interviewSummaries')
      process.exit(0)
    } else {
      console.error(`unknown arg: ${a}`)
      process.exit(2)
    }
  }
  if (!out.input) {
    console.error('--input is required')
    process.exit(2)
  }
  return out
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function timestampSeconds(s) {
  // Handles "HH:MM:SS,mmm" or "HH:MM:SS" -> seconds
  if (typeof s !== 'string') return 0
  const cleaned = s.replace(/[,.]/g, ':')
  const parts = cleaned.split(':')
  if (parts.length < 3) return 0
  const [h, m, sec] = parts.map(Number)
  return (h || 0) * 3600 + (m || 0) * 60 + (sec || 0)
}

function fmtTimestamp(start, end) {
  // Pipeline JSON's start_time/end_time fields are "HH:MM:SS,mmm" strings.
  // React reads "[HH:MM:SS] - [HH:MM:SS]" with brackets. Mirror that shape.
  const s = (start || '').split(',')[0].split('.')[0]
  const e = (end || '').split(',')[0].split('.')[0]
  return `[${s}] - [${e}]`
}

async function main() {
  // Read + parse the pipeline JSON.
  const raw = await fs.readFile(args.input, 'utf-8')
  const data = JSON.parse(raw)

  if (data.error) {
    console.error(`pipeline JSON reports error: ${data.error}`)
    process.exit(1)
  }

  const interviewName = data.interview_name
  if (!interviewName) {
    console.error('pipeline JSON missing interview_name')
    process.exit(1)
  }

  const slug = args.slug || slugify(interviewName)
  const ms = data.main_summary || {}
  const chapters = data.chapters || []
  const engagementScores = data.engagement_scores || null
  const costData = data.cost_data || null

  // Strip the per-call log out of cost_data because it can be large and
  // is only useful for debugging on the local machine.
  const trimmedCost = costData ? { ...costData } : null
  if (trimmedCost && 'call_log' in trimmedCost) {
    delete trimmedCost.call_log
  }

  const interviewDoc = {
    name: interviewName,
    summary: ms.summary || '',
    key_themes: ms.key_themes || [],
    historical_significance: ms.historical_significance || '',
    quality_metrics: ms.quality_metrics || null,
    engagement_scores: engagementScores,
    cost_data: trimmedCost,
    youtube_video_id: data.youtube_video_id || null,
    processed_at: new Date().toISOString(),
    pipeline_version: 'dual-scorer-1',
  }

  const subSummaryDocs = chapters.map((ch, i) => ({
    id: `chapter_${String(ch.chapter_number || i + 1).padStart(2, '0')}`,
    title: ch.title || '',
    summary: ch.summary || '',
    topic: ch.main_topic_category || '',
    keywords: Array.isArray(ch.keywords) ? ch.keywords.join(', ') : (ch.keywords || ''),
    related_events: ch.related_events || [],
    chapter_number: ch.chapter_number || (i + 1),
    timestamp: fmtTimestamp(ch.start_time, ch.end_time),
    start_seconds: timestampSeconds(ch.start_time),
    end_seconds: timestampSeconds(ch.end_time),
    quality_metrics: ch.quality_metrics || null,
  }))

  console.log(`Interview: ${interviewName}`)
  console.log(`Slug:      ${slug}`)
  console.log(`Chapters:  ${subSummaryDocs.length}`)
  console.log(`Summary:   ${interviewDoc.summary.slice(0, 80)}${interviewDoc.summary.length > 80 ? '…' : ''}`)
  console.log(`Cost:      $${(trimmedCost?.total_cost_usd || 0).toFixed(4)}`)

  const targets = args.bothCollections
    ? ['interviewIndex', 'interviewSummaries']
    : [args.collection]

  if (args.dryRun) {
    console.log('\n--dry-run set: not authenticating to Firebase, not writing.')
    console.log('Would write:')
    for (const t of targets) {
      console.log(`  ${t}/${slug}`)
      for (const sub of subSummaryDocs) {
        console.log(`  ${t}/${slug}/subSummaries/${sub.id}`)
      }
    }
    return
  }

  if (!args.serviceAccount) {
    console.error('\n--service-account <path> is required when not running --dry-run')
    console.error('Get one from: Firebase Console -> Project settings -> Service accounts -> Generate new private key')
    process.exit(2)
  }

  // Lazy-import firebase-admin so --dry-run doesn't need it installed.
  const { initializeApp, cert } = await import('firebase-admin/app')
  const { getFirestore } = await import('firebase-admin/firestore')

  const saPath = path.resolve(args.serviceAccount)
  const saRaw = await fs.readFile(saPath, 'utf-8')
  const sa = JSON.parse(saRaw)
  initializeApp({ credential: cert(sa) })
  const db = getFirestore()

  // Write to each target collection. The loop is sequential because
  // we want each collection's writes to surface as a coherent block
  // in the log, not interleaved; the per-target parallel subSummary
  // writes inside handle the throughput.
  let totalDocs = 0
  for (const targetCollection of targets) {
    await db.collection(targetCollection).doc(slug).set(interviewDoc, { merge: true })
    console.log(`\nWrote ${targetCollection}/${slug}`)
    totalDocs += 1

    await Promise.all(
      subSummaryDocs.map(async (sub) => {
        const { id, ...rest } = sub
        await db.collection(targetCollection).doc(slug).collection('subSummaries').doc(id).set(rest, { merge: true })
        console.log(`Wrote ${targetCollection}/${slug}/subSummaries/${id}`)
      }),
    )
    totalDocs += subSummaryDocs.length
  }

  console.log(`\nDone. ${totalDocs} Firestore document(s) written across ${targets.length} collection(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
