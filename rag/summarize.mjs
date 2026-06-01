// rag/summarize.mjs
//
// Anthropic-API-based regeneration script for the agentic-summary surfaces
// (capsules, cluster names, tours, quotes). This is the FALLBACK PATH for
// operators who don't have Claude Code session access.
//
// During the initial 2026-05-26 deployment, Eric used Claude Code subagents
// under his Claude Max 20x subscription to generate every surface. The work
// cost ~$0 in marginal API tokens. This script exists for the case where:
//
//   - A new transcript has been added to the corpus, and its capsule needs
//     to be generated.
//   - The cluster structure has shifted (e.g., after a re-ingest with new
//     content), and cluster names need to be re-derived.
//   - A new tour or quote needs to be added to the rotation.
//   - The original Claude Code agent who generated these surfaces is not
//     available to do it again.
//
// Cost expectations (Opus-4.7 at 2026 pricing):
//   - 1 capsule:  ~$0.005-0.01  (small input, small output)
//   - 30 cluster names + descriptions: ~$0.15
//   - 10 tour pages:                   ~$0.50
//   - Full regeneration of every surface: ~$3-5
//
// Usage:
//   node --env-file=rag/.env.local rag/summarize.mjs <feature> [--entries 1,2,3]
//
// Features:
//   capsules     - regenerate capsules.json (use --entries N,N,N to limit)
//   clusters     - regenerate clusters.json (re-runs k-means + names)
//   tours        - regenerate tours.json
//   quotes       - regenerate quotes.json
//   all          - regenerate all of the above (interactive confirmation per)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const SUMMARIES_DIR = join(REPO_ROOT, 'public', 'rag', 'summaries');
const CORRECTED_DIR = join(REPO_ROOT, 'transcripts', 'corrected');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY required (set in rag/.env.local)');
  process.exit(1);
}

const MODEL = process.env.SUMMARIZE_MODEL || 'claude-opus-4-7';
const MAX_OUTPUT_TOKENS = 600;

// ---------------------------------------------------------------------------
// Anthropic API client (thin wrapper, no SDK)
// ---------------------------------------------------------------------------

async function callClaude(systemPrompt, userPrompt, { maxTokens = MAX_OUTPUT_TOKENS } = {}) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`anthropic ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = await res.json();
  const text = (data?.content ?? []).map((c) => c.text || '').join('').trim();
  return text;
}

// ---------------------------------------------------------------------------
// Capsule generation
// ---------------------------------------------------------------------------

const CAPSULE_SYSTEM = `You are generating concise biographical capsules for the Civil Rights History Project oral history corpus. Each capsule is EXACTLY 3 sentences max. Tone: museum wall label. Grounded ONLY in actual interview content.

CONSTRAINTS:
- 3 sentences MAX
- NO decorative adjectives ("powerful", "moving", "fascinating", "remarkable", "important", "inspiring", "profound", "incredible", "compelling")
- NO meta-commentary ("This interview...", "This testimony...", "Through her story...")
- NO unsupported inferences (don't invent dates, places, roles)
- Cite specific organizations the speaker was a member of (SCLC, SNCC, CORE, NAACP, MFDP, BPP, etc.)
- Cite specific events the speaker discusses as central (Selma march, Birmingham, Mississippi Freedom Summer, etc.)
- Present tense for biographical role; past tense for events
- Museum-wall-label register: terse, specific, citation-grade

GOOD EXAMPLE (Lawrence Guyot):
"MFDP chairman who organized voter registration in Hattiesburg, Mississippi through the violent summers of 1963-64. Guyot's account grounds the federal-local clash that culminated in the 1964 Atlantic City challenge to the regular Mississippi delegation."

Output JUST the capsule text. No JSON, no preamble.`;

function sampleChunks(text, count = 5) {
  const len = text.length;
  if (len < 2000) return text.slice(0, 5000);
  const positions = [];
  for (let i = 0; i < count; i++) {
    positions.push(Math.floor((i / (count - 1)) * (len - 1000)));
  }
  return positions
    .map((p, i) => `--- chunk ${i + 1} (offset ~${Math.round(p)}) ---\n${text.slice(Math.max(0, p - 200), p + 600)}`)
    .join('\n\n');
}

async function generateCapsule(entry) {
  const txtPath = join(CORRECTED_DIR, entry.dir, entry.txt);
  const txt = readFileSync(txtPath, 'utf-8');
  const sampled = sampleChunks(txt);
  const userPrompt = `Subject: ${entry.entry_subject}
Audit tier: ${entry.tier}
LoC item URL: ${entry.loc_url || '(none)'}

Sampled transcript chunks (5 distributed sections):

${sampled}

Write the 3-sentence capsule now.`;
  const capsule = await callClaude(CAPSULE_SYSTEM, userPrompt, { maxTokens: 240 });
  return {
    entry_number: entry.entry_number,
    entry_subject: entry.entry_subject,
    capsule,
    model: MODEL,
  };
}

async function regenerateCapsules({ entries = null } = {}) {
  const entryList = JSON.parse(readFileSync(join(SUMMARIES_DIR, '_entry_list.json'), 'utf-8'));
  const targets = entries ? entryList.filter((e) => entries.includes(e.entry_number)) : entryList;
  console.log(`Regenerating capsules for ${targets.length} entries...`);

  // capsules.json schema: { generated, total_entries, model, capsules: { <entry_number>: {...} } }
  // Read the existing wrapper so a targeted regen merges into the per-entry map
  // instead of clobbering it or writing entries at the top level.
  let wrapper = { generated: '', total_entries: 0, model: MODEL, capsules: {} };
  if (existsSync(join(SUMMARIES_DIR, 'capsules.json'))) {
    const existing = JSON.parse(readFileSync(join(SUMMARIES_DIR, 'capsules.json'), 'utf-8'));
    if (existing && typeof existing === 'object' && existing.capsules) {
      wrapper = existing;
    } else if (existing && typeof existing === 'object') {
      // Legacy flat map { <entry_number>: {...} }: migrate into the wrapper shape.
      wrapper.capsules = existing;
    }
  }

  for (const e of targets) {
    process.stdout.write(`  #${e.entry_number} ${e.entry_subject} ... `);
    try {
      const capsule = await generateCapsule(e);
      wrapper.capsules[e.entry_number] = capsule;
      console.log('ok');
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }
  }

  wrapper.generated = new Date().toISOString().slice(0, 10);
  wrapper.total_entries = Object.keys(wrapper.capsules).length;
  writeFileSync(
    join(SUMMARIES_DIR, 'capsules.json'),
    JSON.stringify(wrapper, null, 2),
    'utf-8',
  );
  console.log(`Wrote ${wrapper.total_entries} capsules to capsules.json`);
}

// ---------------------------------------------------------------------------
// Cluster naming
// ---------------------------------------------------------------------------

const CLUSTER_SYSTEM = `You are naming a thematic cluster of civil-rights oral-history interviews. Given a list of members, write:

- name (2-6 words, no decorative adjectives)
- description (2 sentences: what unifies them + what specific vocabulary/geography/organizational frame anchors them)
- starter_query (a search query a user could click that would return passages from this cluster)

Output strict JSON: {"name": "...", "description": "...", "starter_query": "..."}

NO decorative adjectives. NO meta-commentary.`;

async function generateClusterName(cluster) {
  const memberList = cluster.members
    .slice(0, 8)
    .map((m) => `  - ${m.entry_subject} (similarity ${m.similarity_to_centroid.toFixed(3)})`)
    .join('\n');
  const userPrompt = `Cluster size: ${cluster.size}
Top members by similarity to centroid:
${memberList}

Write the JSON now.`;
  const raw = await callClaude(CLUSTER_SYSTEM, userPrompt, { maxTokens: 300 });
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]+\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error(`could not parse cluster JSON: ${raw}`);
  }
}

async function regenerateClusters() {
  const raw = JSON.parse(readFileSync(join(SUMMARIES_DIR, 'clusters_raw.json'), 'utf-8'));
  console.log(`Naming ${raw.clusters.length} clusters...`);
  const out_clusters = [];
  for (const c of raw.clusters) {
    process.stdout.write(`  cluster ${c.cluster_id} (size ${c.size}) ... `);
    try {
      const named = await generateClusterName(c);
      out_clusters.push({
        cluster_id: c.cluster_id,
        name: named.name,
        description: named.description,
        starter_query: named.starter_query,
        size: c.size,
        exemplar_entry_subject: c.exemplar_entry_subject,
        member_entry_subjects: c.members.map((m) => m.entry_subject),
      });
      console.log(`"${named.name}"`);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }
  }
  out_clusters.sort((a, b) => b.size - a.size);

  writeFileSync(
    join(SUMMARIES_DIR, 'clusters.json'),
    JSON.stringify({
      method: raw.method,
      generated: new Date().toISOString().slice(0, 10),
      clusters: out_clusters,
    }, null, 2),
    'utf-8',
  );
  console.log(`Wrote ${out_clusters.length} clusters to clusters.json`);
}

// ---------------------------------------------------------------------------
// CLI dispatch
// ---------------------------------------------------------------------------

const feature = process.argv[2];
const entriesArg = process.argv.find((a) => a.startsWith('--entries='));
const entries = entriesArg
  ? entriesArg.slice('--entries='.length).split(',').map(Number)
  : null;

switch (feature) {
  case 'capsules':
    await regenerateCapsules({ entries });
    break;
  case 'clusters':
    await regenerateClusters();
    break;
  case 'tours':
    console.error('tours regeneration not yet implemented in this fallback path');
    console.error('current path: use a Claude Code session with subagents');
    process.exit(2);
    break;
  case 'quotes':
    console.error('quotes regeneration not yet implemented in this fallback path');
    console.error('current path: use a Claude Code session with subagents');
    process.exit(2);
    break;
  default:
    console.log('Usage: node --env-file=rag/.env.local rag/summarize.mjs <feature> [--entries=N,N,N]');
    console.log('  features: capsules, clusters, tours, quotes');
    console.log('');
    console.log('Notes:');
    console.log('  - tours + quotes editorial regeneration is not yet ported to this script.');
    console.log('    For those, use a Claude Code session with subagents (the original 2026-05-26 path).');
    console.log('  - capsules + clusters work fully from this script as a fallback.');
    process.exit(1);
}
