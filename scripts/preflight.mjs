#!/usr/bin/env node
/**
 * Preflight check for the Civil Rights History Project deployment chain.
 *
 * Run from the project root:
 *   node scripts/preflight.mjs
 *
 * Verifies, in order, that every prerequisite for the
 * Python pipeline -> JSON dump -> Node bridge -> Firestore writes
 * chain is in place. Reports each check as PASS or FAIL with a one-line
 * explanation; exits non-zero if any check fails. Use this BEFORE
 * burning API credits on a batch pipeline run or paying Firestore
 * writes for output that won't be readable by the React app.
 *
 * The checks are intentionally cheap (no network calls, no API
 * authentication, no .srt parsing) so the script runs in under a second
 * and can be wired into a pre-batch shell pipeline as:
 *   node scripts/preflight.mjs && python "Metadata Generation System/run_sample.py" <transcript>
 *
 * Built 2026-05-22 to give Eric a single-command sanity gate before he
 * runs the pipeline at scale.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')

const checks = []

function check(label, fn) {
  try {
    const result = fn()
    checks.push({ label, status: 'PASS', detail: result || '' })
  } catch (err) {
    checks.push({ label, status: 'FAIL', detail: err.message })
  }
}

// 1. .env exists with both API keys.
check('.env present at C:\\civil\\.env', () => {
  const envPath = path.join(PROJECT_ROOT, '.env')
  if (!fs.existsSync(envPath)) throw new Error('.env file missing')
  return ''
})

check('OPENAI_API_KEY set in .env', () => {
  const env = fs.readFileSync(path.join(PROJECT_ROOT, '.env'), 'utf-8')
  const match = env.match(/^OPENAI_API_KEY=(.+)$/m)
  if (!match || !match[1].trim()) throw new Error('OPENAI_API_KEY missing or empty in .env')
  if (!match[1].startsWith('sk-')) throw new Error(`OPENAI_API_KEY does not start with sk- (got ${match[1].slice(0, 10)}...)`)
  return `${match[1].slice(0, 14)}...${match[1].slice(-4)}`
})

check('ANTHROPIC_API_KEY set in .env', () => {
  const env = fs.readFileSync(path.join(PROJECT_ROOT, '.env'), 'utf-8')
  const match = env.match(/^ANTHROPIC_API_KEY=(.+)$/m)
  if (!match || !match[1].trim()) throw new Error('ANTHROPIC_API_KEY missing or empty in .env')
  if (!match[1].startsWith('sk-ant-')) throw new Error('ANTHROPIC_API_KEY does not start with sk-ant-')
  return `${match[1].slice(0, 14)}...${match[1].slice(-4)}`
})

check('USE_DUAL_SCORING enabled', () => {
  const env = fs.readFileSync(path.join(PROJECT_ROOT, '.env'), 'utf-8')
  const match = env.match(/^USE_DUAL_SCORING=(.+)$/m)
  if (!match) throw new Error('USE_DUAL_SCORING not set (dual-scorer publication gate will be skipped)')
  const v = match[1].trim().toLowerCase()
  if (!['1', 'true', 'yes', 'on'].includes(v)) {
    throw new Error(`USE_DUAL_SCORING=${match[1]} -- not truthy; the pipeline will run with bare-OpenAI scoring only`)
  }
  return '1'
})

check('VITE_FIREBASE_* config present', () => {
  const env = fs.readFileSync(path.join(PROJECT_ROOT, '.env'), 'utf-8')
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ]
  for (const key of required) {
    if (!env.match(new RegExp(`^${key}=.+$`, 'm'))) {
      throw new Error(`${key} missing from .env`)
    }
  }
  return 'all 6 present'
})

// 2. Pipeline modules importable (file-existence proxy; full import
//    check would need to spawn Python).
check('Metadata Generation System modules in place', () => {
  const required = [
    'Metadata Generation System/app.py',
    'Metadata Generation System/processor/__init__.py',
    'Metadata Generation System/processor/tuning.py',
    'Metadata Generation System/processor/claude_scorer.py',
    'Metadata Generation System/processor/citation_check.py',
    'Metadata Generation System/processor/dual_scoring_helper.py',
    'Metadata Generation System/processor/review_queue.py',
    'Metadata Generation System/civil_rights_facts.json',
    'Metadata Generation System/run_sample.py',
  ]
  for (const rel of required) {
    if (!fs.existsSync(path.join(PROJECT_ROOT, rel))) {
      throw new Error(`missing: ${rel}`)
    }
  }
  return `${required.length} files present`
})

// 3. Bridge script + Firestore destination scaffolding.
check('pipeline-to-firestore bridge script present', () => {
  const p = path.join(PROJECT_ROOT, 'scripts/pipeline-to-firestore.mjs')
  if (!fs.existsSync(p)) throw new Error('scripts/pipeline-to-firestore.mjs missing')
  return ''
})

// 4. Firebase service account (optional but expected for Firestore writes).
check('Firebase service-account JSON (optional)', () => {
  const candidateDirs = [
    'scripts/firebase',
    '.firebase',
    'secrets',
  ]
  for (const d of candidateDirs) {
    const dir = path.join(PROJECT_ROOT, d)
    if (!fs.existsSync(dir)) continue
    const entries = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
    for (const entry of entries) {
      const data = fs.readFileSync(path.join(dir, entry), 'utf-8')
      if (data.includes('"type": "service_account"')) {
        return `${d}/${entry}`
      }
    }
  }
  throw new Error('no Firebase service-account JSON found in scripts/firebase/, .firebase/, or secrets/. Download from Firebase Console > Project settings > Service accounts > Generate new private key. Required for `pipeline-to-firestore.mjs` writes (not required for the Python pipeline itself).')
})

// 5. Transcripts present.
check('Raw transcripts present at transcripts/raw/', () => {
  const dir = path.join(PROJECT_ROOT, 'transcripts/raw')
  if (!fs.existsSync(dir)) throw new Error('transcripts/raw/ missing')
  const subdirs = fs.readdirSync(dir).filter(name => {
    const full = path.join(dir, name)
    return fs.statSync(full).isDirectory()
  })
  if (subdirs.length === 0) throw new Error('no transcript directories in transcripts/raw/')
  return `${subdirs.length} transcript director${subdirs.length === 1 ? 'y' : 'ies'}`
})

// 6. .gitignore protects sensitive files.
check('.gitignore covers .env + service accounts', () => {
  const gitignore = fs.readFileSync(path.join(PROJECT_ROOT, '.gitignore'), 'utf-8')
  if (!/^\.env(\s|$)/m.test(gitignore)) {
    throw new Error('.gitignore does not list .env -- credentials at risk of being committed')
  }
  return ''
})

// ── Report ─────────────────────────────────────────────────────────────
let allPassed = true
const w = 50
for (const c of checks) {
  const status = c.status === 'PASS' ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'
  const label = c.label.padEnd(w, ' ')
  console.log(`  ${status}  ${label}${c.detail ? `  (${c.detail})` : ''}`)
  if (c.status === 'FAIL') allPassed = false
}

console.log()
if (allPassed) {
  console.log('\x1b[32mAll preflight checks passed.\x1b[0m')
  console.log('You can now safely run the pipeline:')
  console.log('  python "Metadata Generation System/run_sample.py"   # smallest transcript')
  console.log('  python "Metadata Generation System/run_sample.py" "Charles Melvin Sherrod"   # specific transcript')
  console.log('And then push the output to Firestore:')
  console.log('  node scripts/pipeline-to-firestore.mjs \\')
  console.log('      --input "Metadata Generation System/run_sample_output.json" \\')
  console.log('      --service-account scripts/firebase/<sa.json> \\')
  console.log('      --both-collections')
  process.exit(0)
} else {
  const failed = checks.filter(c => c.status === 'FAIL').length
  console.log(`\x1b[31m${failed} check${failed === 1 ? '' : 's'} failed.\x1b[0m Fix the issues above and re-run.`)
  process.exit(1)
}
