#!/usr/bin/env node
/**
 * strip_em_dashes.mjs
 *
 * One-shot sweep that removes em dashes (U+2014) from all source files
 * the React app + RAG layer + central docs ship. Em dashes are forbidden
 * for generative text on this project (per the central rule in CLAUDE.md);
 * this script enforces that on the existing tree.
 *
 * Replacement rules (the em dash, U+2014, is produced via
 * String.fromCharCode below so this script never strips the em dashes
 * out of its own source, which is what silently neutered the prior version):
 *   em dash framed by spaces -> ", "
 *   any other occurrence     -> "-"
 *
 * Skips: transcripts/ (audit governance evidence preserved verbatim),
 * node_modules/, .git/, dist/, build artifacts.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());

const INCLUDE_DIRS = [
  'src',
  'public',
  'rag',
  'mcp-server',
  'functions',
  'netlify',
  'scripts',
  'tests',
  'docs',
  'Metadata Generation System',
];

const TOP_FILES = [
  'CLAUDE.md',
  'STEERING_DOCS.md',
  'README.md',
  'CONTRIBUTORS.md',
  'lessons_learned.md',
  'PRESENTATION_REFERENCE.md',
  'index.html',
];

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.vite',
  'coverage',
  'transcripts',
  'pass2_stage',
  'pass3_stage',
  'pass4_stage',
  'pass5_stage',
  'pass8_stage',
  'loc_cache',
  'output_subagent',
]);

const EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.css', '.scss',
  '.html',
  '.md',
  '.json',
  '.py',
]);

function* walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

const targets = [];
for (const dir of INCLUDE_DIRS) {
  const abs = path.join(ROOT, dir);
  if (fs.existsSync(abs)) {
    for (const f of walk(abs)) targets.push(f);
  }
}
for (const name of TOP_FILES) {
  const abs = path.join(ROOT, name);
  if (fs.existsSync(abs)) targets.push(abs);
}

let touched = 0;
let totalReplacements = 0;
const summary = [];

for (const file of targets) {
  const ext = path.extname(file).toLowerCase();
  if (!EXTENSIONS.has(ext)) continue;
  // Never sweep the curated-essays layer: the essay bodies and their excerpts
  // are VERBATIM reproductions of public-domain / open-license works, so their
  // original punctuation (including em dashes) must be preserved.
  if (file.replace(/\\/g, '/').includes('/public/rag/essays/')) continue;
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  const EM_DASH = String.fromCharCode(0x2014);
  if (!content.includes(EM_DASH)) continue;

  const before = content;
  // Protect a backtick-wrapped em dash, e.g. the rule statement in CLAUDE.md
  // that cites the forbidden character itself. Without this guard the sweep
  // would rewrite the rule into nonsense (a hyphen) the first time it ran.
  const SENTINEL = ' EMDASH_LITERAL ';
  const guarded = before.split('`' + EM_DASH + '`').join(SENTINEL);
  const replaced = guarded
    .replace(new RegExp(' ' + EM_DASH + ' ', 'g'), ', ')
    .replace(new RegExp(EM_DASH, 'g'), '-')
    .split(SENTINEL).join('`' + EM_DASH + '`');

  if (replaced === before) continue;
  const count = (before.match(new RegExp(EM_DASH, 'g')) || []).length;

  fs.writeFileSync(file, replaced, 'utf8');
  touched++;
  totalReplacements += count;
  summary.push(`${path.relative(ROOT, file)}: ${count} em dashes removed`);
}

for (const line of summary) console.log(line);
console.log(`\n${touched} files touched, ${totalReplacements} em dashes removed.`);
