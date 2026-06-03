# Retrieval Eval Harness

A checked-in golden-set check for the civil-rights retrieval pipeline
(Pinecone voyage-3 embeddings plus rerank-2). Before this directory
existed, demo queries were hand-validated against the live `/retrieve`
endpoint one at a time, with no repeatable record of what "correct"
looked like. This harness turns that ad hoc check into a single
command: a curated set of queries, an assertion per query, and a
non-zero exit code when any known-good query stops resolving the way it
used to.

Run it before every demo or conference, and after any corpus reingest
(`rag/ingest.mjs`), so a retrieval regression surfaces as a red line
instead of as a surprise in front of stakeholders.

## Files

| File | Purpose |
|---|---|
| `golden_queries.json` | The curated query set. One row per query, each with an `expect` block of assertions. Verified against `public/rag/toc.json` on 2026-06-01. |
| `run_eval.mjs` | The Node runner. Loads the golden set, runs each query through retrieval, checks assertions, prints PASS/FAIL, exits non-zero on any failure. |
| `README.md` | This file. |

## Running It

The preferred path imports `retrieve` from `../retrieve.mjs` and calls
Pinecone plus Voyage in-process, so it needs the same credentials the
ingest and precompute scripts use. Run it from the repo root with the
env file:

```bash
node --env-file=rag/.env.local rag/eval/run_eval.mjs
```

Output is one block per query (PASS or FAIL, the top result, and any
failed assertion), then a final `X/Y golden queries passed` summary. The
process exits `0` when every query passes, `1` when any assertion fails,
and `2` on a setup error (a malformed golden file, no reachable backend,
and the like). The exit code is what a CI step or a pre-demo checklist
should gate on.

### Flags

| Flag | Effect |
|---|---|
| `--http` | Skip the in-process import and POST each query to a deployed `/retrieve` endpoint instead. The URL comes from `RETRIEVE_URL` and defaults to `https://spokenhistory.org/retrieve`. Useful when you do not have the Voyage and Pinecone keys locally but want to validate the live deployment. |
| `--http-on-error` | Try the in-process path first; fall back to HTTP only if the import fails to resolve credentials. |
| `--json` | Emit a machine-readable JSON report on stdout and suppress the human-readable per-query lines. For wiring the harness into other tooling. |
| `--query "<substr>"` | Run only the golden queries whose text contains `<substr>` (case-insensitive). Repeatable. Handy for iterating on one query. |
| `--help`, `-h` | Print usage and exit `0`. |

Examples:

```bash
# Validate the live production endpoint without local credentials.
RETRIEVE_URL=https://spokenhistory.org/retrieve \
  node rag/eval/run_eval.mjs --http

# Run just the Emmett Till query, in-process.
node --env-file=rag/.env.local rag/eval/run_eval.mjs --query "emmett till"

# Machine-readable report for downstream tooling.
node --env-file=rag/.env.local rag/eval/run_eval.mjs --json
```

A note on the two backends: the in-process `retrieve()` returns Pinecone
metadata in snake_case (`entry_number`, `inferential_uncertainty_tier`,
scores in `pinecone_score` / `rerank_score`), while the HTTP endpoint
returns the camelCase citation payload (`entryNumber`, `uncertaintyTier`,
`similarity`). The runner normalizes both into one shape before checking
assertions, so the same golden set works against either backend.

## The Assertion Vocabulary

Each `golden_queries.json` row looks like:

```jsonc
{
  "query": "my cousin Emmett Till",
  "expect": {
    "top_entry_number": 125,
    "top_speaker_substring": "Wheeler Parker"
  },
  "topN": 3,
  "entry_number": 125,
  "note": "why this query is in the set"
}
```

A query passes only when every assertion in its `expect` block passes,
and a query that returns zero results fails by definition (a golden
query that retrieves nothing is itself a regression). The supported
assertion keys, all optional:

| Key | Meaning |
|---|---|
| `top_entry_number` | The rank-1 result must come from this interview `entry_number`. Use only when retrieval is pinned (for example, an `entry_number` filter makes the top result deterministic). |
| `top_speaker_substring` | The rank-1 result's `entry_subject` must contain this substring (case-insensitive). Robust to small spelling differences, for example "Wheeler Parker" matches "Wheeler Parker, Jr." |
| `must_include_entry` | Every listed `entry_number` must appear somewhere in the returned set (not necessarily at rank 1). The right tool for "this canonical voice should be present" without over-constraining rank. |
| `min_top_score` | The rank-1 result's relevance score (rerank score when present, else Pinecone similarity) must be at least this value. A floor that catches a query degrading to weak matches. |
| `min_distinct_entries` | The returned set must span at least this many distinct interviews. Pair it with `dedupeByEntry: true` to assert polyphonic coverage of a heavily-covered event. |
| `max_top_tier` | The rank-1 result's audit tier must be at or better than this ceiling, on the ordering `low` (best, most settled) through `not-auditable` (weakest). A top result with no tier (for example a person or essay vector) is not penalized; the score floor guards quality in that case. |

Per-row retrieval knobs (outside `expect`) mirror the `/retrieve` body
parameters: `topN` (how many results to fetch and inspect),
`dedupeByEntry` (one passage per interviewee), and `entry_number` (the
single-entry filter shortcut). When `dedupeByEntry` is set, the
in-process path replicates the Netlify function's behavior: over-fetch,
then keep one passage per interviewee.

### Assertion design discipline

Prefer loose, durable assertions over brittle exact-rank checks. Rank
order can shift legitimately between reingests (a new interview lands, a
chunk boundary moves, the reranker scores two near-ties differently), so
`top_speaker_substring`, `must_include_entry`, and `min_top_score` are
the workhorses. Reserve `top_entry_number` for queries where a metadata
filter pins the result. The goal is to catch real regressions (a
canonical voice vanishes, scores collapse, a topic stops resolving)
without flapping on benign rank churn.

## Adding A Golden Query

1. Pick a query with a clear, defensible expectation: a distinctive
   speaker, a well-covered event, or a metadata-pinned filter result.
   The existing rows seed from `rag/DEMO_SCRIPT.md` and the canonical
   set in `scripts/demo-queries.sh`; new rows should be similarly
   high-signal.
2. Verify any entry number you intend to assert against
   `public/rag/toc.json` (the `entry` field is the interview number, and
   `subject` is the interviewee). Do not guess entry numbers from prose;
   confirm them.
3. Choose the loosest assertion that still catches the regression you
   care about. If you only need "this voice is present," use
   `must_include_entry`, not `top_entry_number`.
4. Add the row to the `queries` array in `golden_queries.json` with a
   one-line `note` explaining why the query earns its place (which facet
   of retrieval it guards).
5. Re-run the harness with `--query "<your new query substring>"` to
   confirm the assertion holds against the current corpus before relying
   on it. Tune the assertion (for example, lower a `min_top_score` floor
   for a narrow-vocabulary topic) so it passes on a healthy corpus and
   would fail on a degraded one.

## When To Run It

- Before any stakeholder demo or conference (London, June 2026, and any
  later showing).
- After every corpus reingest: `rag/ingest.mjs`, a re-chapterization, or
  a change to what gets embedded.
- As a manual gate after touching `rag/retrieve.mjs`, `rag/embed.mjs`,
  the Voyage model, or the Pinecone index configuration.

The harness does not call the network on its own and does not run in CI
by default (it would consume Voyage and Pinecone quota on every push);
it is a deliberate, credentialed check you run at the moments above.
