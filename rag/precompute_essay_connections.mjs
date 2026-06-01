// rag/precompute_essay_connections.mjs
//
// For each curated essay, compute its nearest oral-history voices in the
// corpus by embedding similarity, so the EssayPage "How This Connects" footer
// can make a genuine data-analytics claim ("the embedding model places this
// essay nearest these archive voices") rather than only a curated one.
//
// Pipeline per essay:
//   1. Build a representative query (title + themes + a prose excerpt, the
//      opening verse epigraph skipped).
//   2. retrieve() it against the corpus, filtered to transcript passages
//      (chunk_type = transcript_segment), so essays/persons/facts are excluded.
//      That runs Voyage query-embed -> Pinecone query -> Voyage rerank-2.
//   3. Aggregate the ranked passages by interview (entry_number): best rerank
//      score, hit count, and the best passage timestamp.
//   4. Keep the top voices, resolve each to a catalog slug.
//
// Output: public/rag/essays/connections/_embedding_neighbors.json keyed by
// slug. The per-essay connections assembly merges this in as the footer's
// embedding-derived neighbor list.
//
// Run (credentials in rag/.env.local, exactly like ingest):
//   node --env-file=rag/.env.local rag/precompute_essay_connections.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { retrieve } from './retrieve.mjs';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const ESSAYS_DIR = join(REPO_ROOT, 'public', 'rag', 'essays');
const PEOPLE_INDEX = join(REPO_ROOT, 'public', 'rag', 'people', 'index.json');

// Title + themes + the first stretch of prose. The leading verse epigraph (a
// short, often all-caps-attributed quotation from an unrelated poet) is skipped
// so it does not pull the query toward the wrong semantic neighborhood.
function buildQuery(meta, body) {
  const themes = (meta.themes || []).join(', ');
  const blocks = (body || '')
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => !/^\[[^\]]*\]$/.test(p));
  const isProse = (p) => p.length > 180 && /[a-z]/.test(p) && !/^[-A-Z0-9 .,'"’;:()]+$/.test(p);
  const i = blocks.findIndex(isProse);
  const prose = (i >= 0 ? blocks.slice(i) : blocks).join(' ').replace(/\s+/g, ' ');
  return `${meta.title || ''}. Themes: ${themes}. ${prose.slice(0, 1800)}`.trim();
}

async function main() {
  const index = JSON.parse(await readFile(join(ESSAYS_DIR, 'index.json'), 'utf8'));
  let byEntry = {};
  try {
    const peopleIdx = JSON.parse(await readFile(PEOPLE_INDEX, 'utf8'));
    byEntry = peopleIdx.by_entry || {};
  } catch {
    byEntry = {};
  }
  const slugFor = (entry) => byEntry[entry]?.slug || byEntry[String(entry)]?.slug || null;

  const neighbors = {};
  for (const e of index.essays) {
    const slug = e.slug;
    let meta = e;
    let body = '';
    try { meta = JSON.parse(await readFile(join(ESSAYS_DIR, `${slug}.json`), 'utf8')); } catch { /* use index meta */ }
    try { body = await readFile(join(ESSAYS_DIR, 'text', `${slug}.txt`), 'utf8'); } catch { /* no body */ }

    const query = buildQuery(meta, body);
    let results = [];
    try {
      results = await retrieve(query, {
        filter: { chunk_type: { $eq: 'transcript_segment' } },
        topK: 60,
        topN: 24,
      });
    } catch (err) {
      console.error(`[essay-neighbors] ${slug} retrieve FAILED: ${err.message}`);
      neighbors[slug] = { error: err.message, nearest_voices: [] };
      continue;
    }

    const agg = new Map();
    for (const r of results) {
      const m = r.metadata || {};
      const entry = m.entry_number;
      if (entry == null) continue;
      const score = r.rerank_score ?? r.pinecone_score ?? 0;
      const cur = agg.get(entry) || { entry, subject: m.entry_subject || '', hits: 0, top_score: 0, best_ts: null };
      cur.hits += 1;
      if (score > cur.top_score) {
        cur.top_score = score;
        cur.best_ts = m.timestamp_start_seconds ?? cur.best_ts;
      }
      agg.set(entry, cur);
    }
    const voices = [...agg.values()]
      .map((v) => ({
        entry: v.entry,
        subject: v.subject,
        slug: slugFor(v.entry),
        top_score: Number(v.top_score.toFixed(3)),
        hits: v.hits,
        best_ts: v.best_ts,
      }))
      .sort((a, b) => b.top_score - a.top_score || b.hits - a.hits)
      .slice(0, 8);

    neighbors[slug] = { nearest_voices: voices };
    console.log(`[essay-neighbors] ${slug}: ${voices.length} voices; top=${voices[0]?.subject || 'none'} (${voices[0]?.top_score ?? 'n/a'})`);
  }

  const outPath = join(ESSAYS_DIR, 'connections', '_embedding_neighbors.json');
  await writeFile(
    outPath,
    JSON.stringify(
      {
        generated_note:
          'Embedding-derived nearest oral-history voices per essay (Voyage voyage-3 query embed, Pinecone civil-rights index, Voyage rerank-2, filtered to transcript passages). Internal precompute consumed by the EssayPage data-footer assembly.',
        model: 'voyage-3 + rerank-2',
        neighbors,
      },
      null,
      2,
    ),
  );
  console.log(`\nwrote ${outPath} (${Object.keys(neighbors).length} essays)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
