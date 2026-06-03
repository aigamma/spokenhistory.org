// rag/eval/run_eval.mjs
//
// Retrieval-quality evaluation harness for the civil-rights corpus.
//
// Loads rag/eval/golden_queries.json, runs each query through the live
// retrieval pipeline (Pinecone voyage-3 + rerank-2), checks each row's
// `expect` assertions, prints a per-query PASS/FAIL line plus a final
// X/Y summary, and exits non-zero if any query fails. The point is to
// catch retrieval regressions automatically: run it before a demo or
// conference and after any corpus reingest, and a red line tells you a
// known-good query stopped resolving the way it used to.
//
// Two retrieval backends, auto-selected:
//
//   1. Direct import (default, preferred). Imports `retrieve` from
//      ../retrieve.mjs and calls Pinecone + Voyage in-process. Requires
//      the Voyage + Pinecone credentials, so run it with the env file:
//
//        node --env-file=rag/.env.local rag/eval/run_eval.mjs
//
//   2. HTTP fallback. If --http is passed (or the direct import cannot
//      reach credentials and --http-on-error is set), POST each query to
//      a deployed /retrieve endpoint instead. The URL comes from
//      RETRIEVE_URL and defaults to production:
//
//        RETRIEVE_URL=https://spokenhistory.org/retrieve \
//          node rag/eval/run_eval.mjs --http
//
// The two backends return different field casings (the in-process path
// returns Pinecone snake_case metadata; the HTTP path returns the
// camelCase citation payload). normalizeResult() collapses both into one
// shape so the assertions are backend-agnostic.
//
// Flags:
//   --http               force the HTTP backend (POST to RETRIEVE_URL)
//   --http-on-error      fall back to HTTP if the direct import path
//                        throws a credential/connection error
//   --json               emit a machine-readable JSON report on stdout
//                        (suppresses the human per-query lines)
//   --query "<substr>"   run only golden queries whose text contains
//                        <substr> (case-insensitive); repeatable
//   --help               print usage and exit 0
//
// This script never mutates anything; it only reads golden_queries.json
// and calls retrieval. It is safe to run repeatedly.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const GOLDEN_PATH = join(HERE, 'golden_queries.json');

// Tier ordering, best (most settled) to worst. Used by the
// `max_top_tier` assertion: the top result's tier must be at or above
// (index <= ) the asserted ceiling. Mirrors the corpus vocabulary in
// src/components/rag/tiers.js; all real values map to either
// LoC-Verified or Audio-Limited Source, with not-auditable the only
// genuinely weaker state.
const TIER_ORDER = [
  'low',
  'medium',
  'high',
  'publication-block',
  'ingestion-only',
  'not-auditable',
];

// ---------------------------------------------------------------------------
// Arg parsing (matches the lightweight process.argv style used elsewhere
// in rag/, e.g. precompute.mjs, rather than pulling in a CLI library).
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { http: false, httpOnError: false, json: false, queryFilters: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--http') opts.http = true;
    else if (a === '--http-on-error') opts.httpOnError = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--query') {
      const v = argv[i + 1];
      if (v && !v.startsWith('--')) {
        opts.queryFilters.push(v.toLowerCase());
        i += 1;
      }
    }
  }
  return opts;
}

const USAGE = `Retrieval-quality eval harness for the civil-rights corpus.

Usage:
  node --env-file=rag/.env.local rag/eval/run_eval.mjs [flags]

Flags:
  --http              POST to a deployed /retrieve endpoint (RETRIEVE_URL,
                      default https://spokenhistory.org/retrieve) instead of
                      importing retrieve.mjs in-process.
  --http-on-error     Try the in-process path first; fall back to HTTP if it
                      throws a credential or connection error.
  --json              Emit a machine-readable JSON report (no human lines).
  --query "<substr>"  Run only golden queries containing <substr>
                      (case-insensitive). Repeatable.
  --help, -h          Show this help and exit.

Exit code is 0 when every selected query passes, 1 when any assertion
fails, and 2 on a setup/usage error (bad golden file, no backend
reachable, etc.).`;

// ---------------------------------------------------------------------------
// Result normalization. The in-process retrieve() and the HTTP citation
// payload disagree on field names; flatten both into one shape:
//   { entryNumber, speaker, tier, score, text }
// ---------------------------------------------------------------------------

function normalizeResult(r) {
  // HTTP citation payload (camelCase, top-level fields).
  if (r && (r.entryNumber !== undefined || r.entrySubject !== undefined)) {
    const score = pickNumber(r.similarity, r.rerankScore, r.pineconeScore);
    return {
      entryNumber: toNum(r.entryNumber),
      speaker: r.entrySubject ?? null,
      tier: r.uncertaintyTier ?? null,
      score,
      text: r.text ?? r.textPreview ?? '',
    };
  }
  // In-process retrieve() shape: scores at top level, everything else in
  // Pinecone snake_case metadata.
  const m = (r && r.metadata) || {};
  const score = pickNumber(r && r.rerank_score, r && r.pinecone_score);
  return {
    entryNumber: toNum(m.entry_number),
    speaker: m.entry_subject ?? null,
    tier: m.inferential_uncertainty_tier ?? null,
    score,
    text: (r && r.text) || m.text || '',
  };
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// First finite number among the candidates, else null.
function pickNumber(...candidates) {
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Backends
// ---------------------------------------------------------------------------

// Lazily import retrieve.mjs so that `--http` mode and `--help` never
// pay the import cost (and never trip on a missing dependency).
async function getDirectRetriever() {
  const mod = await import('../retrieve.mjs');
  if (typeof mod.retrieve !== 'function') {
    throw new Error('retrieve.mjs did not export a `retrieve` function.');
  }
  return mod.retrieve;
}

// In-process retrieval. Maps the golden row's optional knobs
// (topN / dedupeByEntry / entry_number) onto retrieve()'s options.
// retrieve() does not dedupe by entry itself, so we replicate the
// Netlify function's behavior: over-fetch, then keep one passage per
// interviewee. retrieve()'s signature, confirmed from rag/retrieve.mjs:
//   retrieve(query, { topK, topN, filter, namespace, rerank })
async function runDirect(retrieve, row) {
  const topN = clampInt(row.topN, 1, 50, 8);
  const dedupe = row.dedupeByEntry === true;
  const filter = buildFilter(row);
  // Over-fetch when deduping so distinct interviewees still fill topN.
  const fetchN = dedupe ? Math.min(topN * 4, 50) : topN;
  const topK = Math.max(fetchN * 3, 30);
  const raw = await retrieve(row.query, { topK, topN: fetchN, filter });
  const normalized = raw.map(normalizeResult);
  return dedupe ? dedupeByEntry(normalized, topN) : normalized.slice(0, topN);
}

// HTTP retrieval against a deployed /retrieve. The endpoint does its own
// dedupe + filter when we pass the knobs through, so we forward them and
// read back the citation payloads.
async function runHttp(url, row) {
  const topN = clampInt(row.topN, 1, 50, 8);
  const body = { query: row.query, topN };
  if (row.dedupeByEntry === true) body.dedupeByEntry = true;
  if (row.entry_number != null) body.entry_number = row.entry_number;
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(`network error reaching ${url}: ${e?.message || e}`);
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`/retrieve returned ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json().catch(() => null);
  const results = data?.results;
  if (!Array.isArray(results)) {
    throw new Error('/retrieve response had no `results` array.');
  }
  return results.map(normalizeResult);
}

function buildFilter(row) {
  const f = {};
  if (row.entry_number != null) {
    const n = Number(row.entry_number);
    if (Number.isFinite(n) && n >= 1) f.entry_number = { $eq: Math.floor(n) };
  }
  // Match the production passage-flow behavior: exclude person-page and
  // essay-segment vectors so a passage assertion is not shadowed by a
  // person or essay hit (those carry display_name, not entry_subject). A
  // golden row can opt in with includePersons or includeEssays.
  const exclude = [];
  if (!row.includePersons) exclude.push('person');
  if (!row.includeEssays) exclude.push('essay');
  if (exclude.length) f.content_type = { $nin: exclude };
  return Object.keys(f).length ? f : null;
}

function dedupeByEntry(results, max) {
  const seen = new Set();
  const out = [];
  for (const r of results) {
    if (r.entryNumber == null || seen.has(r.entryNumber)) continue;
    seen.add(r.entryNumber);
    out.push(r);
    if (out.length >= max) break;
  }
  return out;
}

function clampInt(raw, min, max, fallback) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

// ---------------------------------------------------------------------------
// Assertions. Each returns { ok, detail } so the report can explain a
// failure without re-deriving the cause. A query passes only when every
// assertion in its `expect` block passes.
// ---------------------------------------------------------------------------

function evaluate(expect, results) {
  const checks = [];
  const top = results[0] || null;
  const e = expect || {};

  if (results.length === 0) {
    // No results at all fails any non-empty expectation; if `expect` is
    // empty we still treat zero results as a failure (a golden query
    // that returns nothing is a regression by definition).
    checks.push({ name: 'has_results', ok: false, detail: 'retrieval returned 0 results' });
    return { passed: false, checks };
  }

  if (e.top_entry_number != null) {
    const got = top ? top.entryNumber : null;
    checks.push({
      name: 'top_entry_number',
      ok: got === e.top_entry_number,
      detail: `expected top entry ${e.top_entry_number}, got ${fmt(got)}`,
    });
  }

  if (typeof e.top_speaker_substring === 'string') {
    const speaker = top && top.speaker ? String(top.speaker) : '';
    const ok = speaker.toLowerCase().includes(e.top_speaker_substring.toLowerCase());
    checks.push({
      name: 'top_speaker_substring',
      ok,
      detail: `expected top speaker to contain "${e.top_speaker_substring}", got "${speaker || '(none)'}"`,
    });
  }

  if (Array.isArray(e.must_include_entry) && e.must_include_entry.length > 0) {
    const present = new Set(results.map((r) => r.entryNumber).filter((n) => n != null));
    const missing = e.must_include_entry.filter((n) => !present.has(n));
    checks.push({
      name: 'must_include_entry',
      ok: missing.length === 0,
      detail: missing.length === 0
        ? `all of [${e.must_include_entry.join(', ')}] present`
        : `missing entr${missing.length === 1 ? 'y' : 'ies'} [${missing.join(', ')}] (got [${[...present].join(', ')}])`,
    });
  }

  if (typeof e.min_top_score === 'number') {
    const got = top ? top.score : null;
    const ok = typeof got === 'number' && got >= e.min_top_score;
    checks.push({
      name: 'min_top_score',
      ok,
      detail: `expected top score >= ${e.min_top_score}, got ${got == null ? '(none)' : got.toFixed(4)}`,
    });
  }

  if (typeof e.min_distinct_entries === 'number') {
    const distinct = new Set(results.map((r) => r.entryNumber).filter((n) => n != null)).size;
    checks.push({
      name: 'min_distinct_entries',
      ok: distinct >= e.min_distinct_entries,
      detail: `expected >= ${e.min_distinct_entries} distinct entries, got ${distinct}`,
    });
  }

  if (typeof e.max_top_tier === 'string') {
    const ceilingIdx = TIER_ORDER.indexOf(e.max_top_tier);
    const gotTier = top ? top.tier : null;
    const gotIdx = gotTier == null ? -1 : TIER_ORDER.indexOf(gotTier);
    let ok;
    let detail;
    if (ceilingIdx === -1) {
      ok = false;
      detail = `max_top_tier "${e.max_top_tier}" is not a known tier value`;
    } else if (gotTier == null) {
      // No tier on the top result. Treat as a pass-with-note rather than
      // a hard fail: person/essay vectors and some fallbacks legitimately
      // carry no uncertainty tier, and the score floor already guards
      // quality. Flag it in the detail so it is visible.
      ok = true;
      detail = `top result carries no tier (ceiling "${e.max_top_tier}"), not penalized`;
    } else if (gotIdx === -1) {
      ok = false;
      detail = `top tier "${gotTier}" is not in the known vocabulary`;
    } else {
      ok = gotIdx <= ceilingIdx;
      detail = `expected top tier at or better than "${e.max_top_tier}", got "${gotTier}"`;
    }
    checks.push({ name: 'max_top_tier', ok, detail });
  }

  // A query with an empty expect block passes as long as it returned
  // results (handled above). Otherwise: pass iff every check passed.
  const passed = checks.every((c) => c.ok);
  return { passed, checks };
}

function fmt(v) {
  return v == null ? '(none)' : String(v);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(USAGE);
    process.exit(0);
  }

  let golden;
  try {
    golden = JSON.parse(readFileSync(GOLDEN_PATH, 'utf8'));
  } catch (e) {
    fail(`could not read or parse golden_queries.json at ${GOLDEN_PATH}: ${e?.message || e}`);
  }
  let rows = Array.isArray(golden?.queries) ? golden.queries : [];
  if (rows.length === 0) {
    fail('golden_queries.json has no `queries` array (or it is empty).');
  }
  if (opts.queryFilters.length > 0) {
    rows = rows.filter((r) =>
      opts.queryFilters.some((f) => String(r.query || '').toLowerCase().includes(f)));
    if (rows.length === 0) {
      fail(`no golden queries matched --query filter(s): ${opts.queryFilters.join(', ')}`);
    }
  }

  const httpUrl = process.env.RETRIEVE_URL || 'https://spokenhistory.org/retrieve';

  // Resolve the backend. Default is the in-process retrieve() import; if
  // that import fails (missing creds module, etc.) and --http-on-error
  // is set, fall back to HTTP. --http forces HTTP outright.
  let backend = null;
  let backendLabel = '';
  if (opts.http) {
    backend = (row) => runHttp(httpUrl, row);
    backendLabel = `HTTP POST ${httpUrl}`;
  } else {
    try {
      const retrieve = await getDirectRetriever();
      backend = (row) => runDirect(retrieve, row);
      backendLabel = 'in-process retrieve.mjs (Pinecone + Voyage)';
    } catch (e) {
      if (opts.httpOnError) {
        backend = (row) => runHttp(httpUrl, row);
        backendLabel = `HTTP POST ${httpUrl} (fell back: ${e?.message || e})`;
      } else {
        fail(
          `could not load the in-process retriever from ../retrieve.mjs: ${e?.message || e}\n` +
          'Run with --env-file=rag/.env.local so credentials resolve, or pass --http to use a deployed endpoint.',
        );
      }
    }
  }

  if (!opts.json) {
    console.log(`\nRetrieval eval, backend: ${backendLabel}`);
    console.log(`Golden queries: ${rows.length}\n`);
  }

  const report = [];
  let passCount = 0;

  for (const row of rows) {
    let results = [];
    let runError = null;
    try {
      results = await backend(row);
    } catch (e) {
      runError = e?.message || String(e);
    }

    let outcome;
    if (runError) {
      outcome = {
        passed: false,
        checks: [{ name: 'retrieval', ok: false, detail: `retrieval error: ${runError}` }],
      };
    } else {
      outcome = evaluate(row.expect, results);
    }
    if (outcome.passed) passCount += 1;

    report.push({
      query: row.query,
      passed: outcome.passed,
      note: row.note || null,
      checks: outcome.checks,
      topResult: results[0]
        ? {
            entryNumber: results[0].entryNumber,
            speaker: results[0].speaker,
            tier: results[0].tier,
            score: results[0].score,
          }
        : null,
      resultCount: results.length,
    });

    if (!opts.json) printQueryLine(row, outcome, results);
  }

  const total = rows.length;
  const allPassed = passCount === total;

  if (opts.json) {
    console.log(JSON.stringify({
      backend: backendLabel,
      total,
      passed: passCount,
      failed: total - passCount,
      allPassed,
      results: report,
    }, null, 2));
  } else {
    console.log(`\n${allPassed ? 'PASS' : 'FAIL'}  ${passCount}/${total} golden queries passed.`);
    if (!allPassed) {
      const failed = report.filter((r) => !r.passed).map((r) => `  - ${r.query}`);
      console.log('Failing queries:\n' + failed.join('\n'));
    }
  }

  process.exit(allPassed ? 0 : 1);
}

function printQueryLine(row, outcome, results) {
  const status = outcome.passed ? 'PASS' : 'FAIL';
  const top = results[0];
  const topStr = top
    ? `top: entry ${fmt(top.entryNumber)} (${top.speaker || '?'}), score ${top.score == null ? 'n/a' : top.score.toFixed(3)}, tier ${top.tier || 'n/a'}`
    : 'top: (no results)';
  console.log(`[${status}] ${row.query}`);
  console.log(`        ${topStr}`);
  for (const c of outcome.checks) {
    if (!c.ok) console.log(`        x ${c.name}: ${c.detail}`);
  }
}

// Setup / usage error: exit 2 so callers can distinguish a harness
// problem from an honest assertion failure (exit 1).
function fail(msg) {
  console.error(`run_eval: ${msg}`);
  process.exit(2);
}

main().catch((e) => {
  console.error(`run_eval: unexpected error: ${e?.stack || e?.message || e}`);
  process.exit(2);
});
