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
    inputDir: null,
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
    else if (a === '--input-dir') out.inputDir = argv[++i]
    else if (a === '--service-account') out.serviceAccount = argv[++i]
    else if (a === '--dry-run') out.dryRun = true
    else if (a === '--slug') out.slug = argv[++i]
    else if (a === '--collection') out.collection = argv[++i]
    else if (a === '--both-collections') out.bothCollections = true
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts/pipeline-to-firestore.mjs (--input <json> | --input-dir <path>) [options]')
      console.log('Options:')
      console.log('  --input <json>          Single pipeline-output JSON file')
      console.log('  --input-dir <path>      Directory containing entry_*.json files (batch mode)')
      console.log('  --service-account <p>   Path to Firebase admin SDK JSON (optional)')
      console.log('  --dry-run               Validate shape without writing')
      console.log('  --slug <override>       Override the auto-generated slug (single-input mode only)')
      console.log('  --collection <name>     Target collection (default: interviewIndex)')
      console.log('  --both-collections      Write to BOTH interviewIndex and interviewSummaries')
      console.log('')
      console.log('Authentication (in priority order):')
      console.log('  1. --service-account <path> if provided (Google Workspace may block SA key creation)')
      console.log('  2. Application Default Credentials (run `gcloud auth application-default login` first)')
      process.exit(0)
    } else {
      console.error(`unknown arg: ${a}`)
      process.exit(2)
    }
  }
  if (!out.input && !out.inputDir) {
    console.error('--input or --input-dir is required')
    process.exit(2)
  }
  if (out.input && out.inputDir) {
    console.error('only one of --input or --input-dir')
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

function buildDocs(data, slugOverride) {
  if (data.error) throw new Error(`pipeline JSON reports error: ${data.error}`)
  const interviewName = data.interview_name
  if (!interviewName) throw new Error('pipeline JSON missing interview_name')

  const slug = slugOverride || slugify(interviewName)
  const ms = data.main_summary || {}
  const chapters = data.chapters || []
  const engagementScores = data.engagement_scores || null
  const costData = data.cost_data || null

  const trimmedCost = costData ? { ...costData } : null
  if (trimmedCost && 'call_log' in trimmedCost) delete trimmedCost.call_log

  // LoC-served video fields. If extracted by scripts/fetch-loc-videos.py
  // these flow through; otherwise they're null and the UI falls back.
  const locVideo = data.loc_video || {};

  const interviewDoc = {
    name: interviewName,
    summary: ms.summary || '',
    key_themes: ms.key_themes || [],
    historical_significance: ms.historical_significance || '',
    quality_metrics: ms.quality_metrics || null,
    engagement_scores: engagementScores,
    cost_data: trimmedCost,
    loc_item_url: data.loc_item_url || null,
    entry_number: typeof data.entry_number === 'number' ? data.entry_number : null,
    inferential_uncertainty_tier: data.inferential_uncertainty_tier || null,
    inferential_uncertainty_score: typeof data.inferential_uncertainty_score === 'number' ? data.inferential_uncertainty_score : null,
    entry_provenance: data.entry_provenance || null,
    youtube_video_id: data.youtube_video_id || null,
    // Direct LoC video stream URL. The frontend's VideoPlayer dispatches
    // on the URL pattern: tile.loc.gov MP4 → HTML5 video; YouTube embed
    // → YT.Player API. videoEmbedLink is the field playlistService.js
    // already reads, so populating it with the LoC mp4 makes the legacy
    // PlaylistBuilder UI work end-to-end against our new pipeline data.
    videoEmbedLink: locVideo.video_url || null,
    video_url: locVideo.video_url || null,
    video_stream_url: locVideo.video_stream_url || null,
    poster_url: locVideo.poster_url || null,
    video_duration_seconds: locVideo.duration_seconds || null,
    video_caption: locVideo.caption || null,
    processed_at: new Date().toISOString(),
    pipeline_version: data.pipeline_version || 'claude-subagent-1',
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

  return { slug, interviewName, interviewDoc, subSummaryDocs }
}

async function initFirestore() {
  const { initializeApp, applicationDefault, cert } = await import('firebase-admin/app')
  const { getFirestore } = await import('firebase-admin/firestore')

  if (args.serviceAccount) {
    const saPath = path.resolve(args.serviceAccount)
    const saRaw = await fs.readFile(saPath, 'utf-8')
    const sa = JSON.parse(saRaw)
    initializeApp({ credential: cert(sa) })
    console.log(`[auth] using service-account JSON at ${args.serviceAccount}`)
  } else {
    // Application Default Credentials path. Works after the user runs:
    //   gcloud auth application-default login
    // or (for Firebase-specific scopes):
    //   npx firebase login --reauth
    // ADC is the right path on Google Workspace orgs that block SA key
    // creation, see reference_google_workspace_sa_policy memory.
    initializeApp({
      credential: applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || 'civil-rights-history-project',
    })
    console.log('[auth] using Application Default Credentials (ADC); project=civil-rights-history-project')
  }
  return getFirestore()
}

async function pushOne(db, fileName, raw) {
  const data = JSON.parse(raw)
  const { slug, interviewName, interviewDoc, subSummaryDocs } = buildDocs(data, args.slug)

  const targets = args.bothCollections
    ? ['interviewIndex', 'interviewSummaries']
    : [args.collection]

  if (args.dryRun) {
    console.log(`[dry-run] ${fileName} -> ${interviewName} (slug=${slug}, chapters=${subSummaryDocs.length})`)
    for (const t of targets) {
      for (const sub of subSummaryDocs) console.log(`  ${t}/${slug}/subSummaries/${sub.id}`)
    }
    return { slug, chapters: subSummaryDocs.length }
  }

  for (const targetCollection of targets) {
    await db.collection(targetCollection).doc(slug).set(interviewDoc, { merge: true })
    await Promise.all(
      subSummaryDocs.map(async (sub) => {
        const { id, ...rest } = sub
        await db.collection(targetCollection).doc(slug).collection('subSummaries').doc(id).set(rest, { merge: true })
      }),
    )
  }
  console.log(`[write] ${interviewName} -> ${targets.join(' + ')} / ${slug} (${subSummaryDocs.length} chapters)`)
  return { slug, chapters: subSummaryDocs.length }
}

async function main() {
  // Build list of pipeline JSON files to process
  const files = []
  if (args.input) {
    files.push(args.input)
  } else if (args.inputDir) {
    const dirEntries = await fs.readdir(args.inputDir)
    for (const f of dirEntries) {
      if (f.startsWith('entry_') && f.endsWith('.json')) {
        files.push(path.join(args.inputDir, f))
      }
    }
    files.sort()
  }
  console.log(`[plan] ${files.length} pipeline JSON file(s) to process`)
  if (args.bothCollections) console.log('[plan] writing to BOTH interviewIndex + interviewSummaries')
  else console.log(`[plan] writing to ${args.collection}`)

  let db = null
  if (!args.dryRun) {
    db = await initFirestore()
  }

  let okCount = 0
  let errCount = 0
  for (const file of files) {
    try {
      const raw = await fs.readFile(file, 'utf-8')
      await pushOne(db, path.basename(file), raw)
      okCount += 1
    } catch (e) {
      console.error(`[error] ${file}: ${e.message}`)
      errCount += 1
    }
  }

  console.log(`\nDone. ${okCount} ok, ${errCount} error(s).`)
  if (args.dryRun) console.log('(dry-run, no Firestore writes performed)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
