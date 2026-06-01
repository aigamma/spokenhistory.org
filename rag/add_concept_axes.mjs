// rag/add_concept_axes.mjs
//
// Append two concept axes, Local <-> National and Grassroots <-> Institutional,
// to the existing public/rag/summaries/concept_axes.json WITHOUT recomputing
// the five already-shipped axes. The five keep their exact positions and their
// Title Case titles; this script only embeds the two new pole pairs, projects
// every interview centroid onto each new axis (the same math as
// precompute_concept_axes.mjs), and pushes the two new axis objects onto the
// `axes` array. Idempotent: re-running skips a slug that is already present.
//
// These two axes are the coordinate system the project lead asked for: select
// Local <-> National for one screen axis and Grassroots <-> Institutional for
// the other in the Ideological Spectrums view to read each interview's position
// on both at once.
//
// Usage: node --env-file=rag/.env.local rag/add_concept_axes.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { embedQuery } from './embed.mjs';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const CENTROIDS_PATH = join(REPO_ROOT, 'public', 'rag', 'centroids.json');
const OUT_PATH = join(REPO_ROOT, 'public', 'rag', 'summaries', 'concept_axes.json');

// pole_a renders at the top of the Y axis and the left of the X axis in
// ConceptSpectrum, so Local and Grassroots are pole_a (read left-to-right as
// Local -> National and Grassroots -> Institutional).
const NEW_AXES = [
  {
    slug: 'local-national',
    title: 'Local Struggle ↔ National Struggle',
    pole_a: {
      label: 'Local Struggle',
      anchor: 'Local, place-based struggle rooted in a single community: organizing in one town or county, the indigenous leadership of local people, neighbors and church members and sharecroppers and students acting where they live, a specific courthouse or schoolhouse or stretch of road, the local movement that national figures came only to visit and support, ordinary local people who never sought a national platform.',
    },
    pole_b: {
      label: 'National Struggle',
      anchor: 'National-scale struggle waged on the national stage: the major national civil rights organizations and their headquarters, nationally prominent leaders and spokesmen and strategists, federal legislation and the United States Congress and the Supreme Court, national conventions and coordinated multi-state campaigns, the national news media and television, the movement as it was seen, argued, and decided at the level of the whole nation.',
    },
  },
  {
    slug: 'grassroots-institutional',
    title: 'Grassroots Movement ↔ Institutional Power',
    pole_a: {
      label: 'Grassroots Movement',
      anchor: 'A bottom-up grassroots movement made by ordinary people: mass meetings and spontaneous local action, sharecroppers and domestic workers and day laborers and students stepping forward, indigenous leaders without title or salary, the conviction that the people themselves make the movement, participatory democracy, the unlettered local organizer, a movement that rose from the grass roots rather than from any office.',
    },
    pole_b: {
      label: 'Institutional Power',
      anchor: 'Established institutions and formal organization: the bureaucratic structure of large organizations, professional salaried staff and titled officers, boards and committees and chains of command, denominational church hierarchy, labor unions and their locals, the NAACP chartered branch system and legal apparatus, foundations, philanthropies, and government agencies, power exercised through formal institutional channels.',
    },
  },
];

function normalize(v) {
  let s = 0;
  for (const x of v) s += x * x;
  const n = Math.sqrt(s);
  if (n === 0) return v;
  return v.map((x) => x / n);
}
function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
function diff(a, b) {
  return a.map((x, i) => x - b[i]);
}

async function main() {
  const centroids = JSON.parse(readFileSync(CENTROIDS_PATH, 'utf-8'));
  const existing = JSON.parse(readFileSync(OUT_PATH, 'utf-8'));
  const have = new Set(existing.axes.map((a) => a.slug));
  console.log(`Loaded ${centroids.length} centroids; existing axes: ${existing.axes.length}`);

  for (const ax of NEW_AXES) {
    if (have.has(ax.slug)) {
      console.log(`skip (already present): ${ax.slug}`);
      continue;
    }
    console.log(`\nEmbedding axis: ${ax.slug}`);
    const eA = await embedQuery(ax.pole_a.anchor);
    const eB = await embedQuery(ax.pole_b.anchor);
    const axisVec = normalize(diff(eA, eB));

    const positions = centroids.map((c) => {
      const v = normalize(c.vector);
      const p = dot(v, axisVec);
      return {
        entry_number: c.entry_number,
        entry_subject: c.entry_subject,
        tier: c.uncertainty_tier,
        provenance: c.entry_provenance,
        loc_item_url: c.loc_item_url,
        position: +p.toFixed(4),
      };
    });
    const min = Math.min(...positions.map((p) => p.position));
    const max = Math.max(...positions.map((p) => p.position));
    const range = Math.max(max - min, 1e-9);
    for (const p of positions) {
      p.position_normalized = +(((p.position - min) / range) * 2 - 1).toFixed(4);
    }
    positions.sort((a, b) => b.position - a.position);

    existing.axes.push({
      slug: ax.slug,
      title: ax.title,
      pole_a: ax.pole_a,
      pole_b: ax.pole_b,
      raw_range: [min, max],
      axis_vector: Array.from(axisVec).map((v) => +v.toFixed(6)),
      positions,
    });

    console.log(`  range [${min.toFixed(3)}, ${max.toFixed(3)}]`);
    console.log(`  most ${ax.pole_a.label}: ${positions.slice(0, 5).map((p) => p.entry_subject).join(', ')}`);
    console.log(`  most ${ax.pole_b.label}: ${positions.slice(-5).map((p) => p.entry_subject).join(', ')}`);
  }

  existing.total_axes = existing.axes.length;
  writeFileSync(OUT_PATH, JSON.stringify(existing, null, 2), 'utf-8');
  console.log(`\nWrote ${OUT_PATH} (total_axes ${existing.total_axes})`);
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
