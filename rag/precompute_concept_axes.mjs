// rag/precompute_concept_axes.mjs
//
// Pre-compute 1D embeddings of every interview centroid onto 5 conceptual
// axes defined by pairs of opposing concept descriptions.
//
// The math:
//
//   1. Embed pole-A description (e.g., "nonviolence as theology and agape...")
//      and pole-B description (e.g., "armed self-defense and Black Power...")
//      via Voyage. Both 1024-dim.
//
//   2. axis_vector = (pole_A - pole_B) / ||pole_A - pole_B||
//      This is the unit direction along the axis from B to A.
//
//   3. For each of 136 interview centroids, project onto axis_vector:
//      position = dot(centroid, axis_vector)
//      Centroids are L2-normalized; axis_vector is normalized; so position
//      is bounded approximately within [-1, 1] but typically narrower.
//
//   4. Save per-axis array of {entry_number, entry_subject, tier, position}
//      sorted by position (most-pole-A to most-pole-B).
//
// This is the most "philosophy of embedding" demo: the audience watches
// the embedding space *take a position* on where each interviewee sits
// along a conceptual continuum.
//
// Usage:
//   node --env-file=rag/.env.local rag/precompute_concept_axes.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { embedQuery } from './embed.mjs';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const CENTROIDS_PATH = join(REPO_ROOT, 'public', 'rag', 'centroids.json');
const OUT_PATH = join(REPO_ROOT, 'public', 'rag', 'summaries', 'concept_axes.json');

const AXES = [
  {
    slug: 'nonviolence-self-defense',
    title: 'Nonviolence as theology ↔ Armed self-defense',
    pole_a: {
      label: 'Nonviolence as theology',
      anchor: 'Nonviolence as a Christian theological commitment: agape love, the beloved community, redemptive suffering, the cross as a model, Gandhian satyagraha, the ethical force of unearned suffering, refusal to dehumanize the oppressor, the prayer-and-protest tradition of the Black church.',
    },
    pole_b: {
      label: 'Armed self-defense',
      anchor: 'Armed self-defense and Black Power praxis: the right to defend home and community against white supremacist terror, the Deacons for Defense, the Black Panther Party Ten-Point Program, Fanon\'s analysis of colonial violence, Robert F. Williams\' Negroes with Guns, the limits of moral suasion in the face of state and vigilante violence.',
    },
  },
  {
    slug: 'sacred-secular',
    title: 'Sacred framing ↔ Secular framing',
    pole_a: {
      label: 'Sacred / theological framing',
      anchor: 'Civil rights work as the work of the Black church: prayer, scripture, hymns, the prophetic tradition, ordained ministers as movement leaders, Sunday morning organizing, the church as movement infrastructure, divine justice and moral arc.',
    },
    pole_b: {
      label: 'Secular / political framing',
      anchor: 'Civil rights work as political and legal struggle: constitutional rights, federal enforcement, labor organizing, electoral coalition-building, legislative lobbying, courts and litigation, the secular language of citizenship, suffrage, and equal protection.',
    },
  },
  {
    slug: 'tactical-strategic',
    title: 'Tactical pragmatism ↔ Strategic vision',
    pole_a: {
      label: 'Tactical pragmatism',
      anchor: 'On-the-ground tactical work: voter registration in specific counties, organizing specific sit-ins, planning specific marches, negotiating with specific sheriffs and mayors, recruiting specific volunteers, the daily craft of movement-building.',
    },
    pole_b: {
      label: 'Strategic vision',
      anchor: 'Long-horizon strategic and ideological vision: what kind of society the movement is building, the relationship between civil rights and economic justice, the post-1965 question of where the movement goes, the analysis of structural racism, the philosophical foundations of liberation.',
    },
  },
  {
    slug: 'southern-northern',
    title: 'Southern struggle ↔ Northern struggle',
    pole_a: {
      label: 'Southern struggle',
      anchor: 'The southern civil rights struggle: Jim Crow segregation laws, sharecropper economy, sheriffs and Klan, voter registration in the rural Black Belt, the Mississippi Delta, Alabama Black Belt, segregated schools and public accommodations, lynching and racial terror.',
    },
    pole_b: {
      label: 'Northern struggle',
      anchor: 'The northern civil rights struggle: housing segregation, de facto school segregation, police brutality in northern cities, Chicago campaign 1966, Watts uprising 1965, the Black Power turn, urban unemployment, the limits of southern-strategy organizing in northern contexts.',
    },
  },
  {
    slug: 'individual-collective',
    title: 'Individual conscience ↔ Collective discipline',
    pole_a: {
      label: 'Individual conscience',
      anchor: 'Individual moral witness: the personal decision to sit at the lunch counter, the family decision to register to vote, the conscience that refuses to comply with unjust law, the lone voice that won\'t be silenced, the personal cost of activism, autobiography of movement participation.',
    },
    pole_b: {
      label: 'Collective discipline',
      anchor: 'Organizational and collective discipline: the SCLC committee structure, SNCC consensus decision-making, the training of nonviolent direct-action workshops, the coordination across organizations, the strategic planning of campaigns, the institutional history of movement organizations.',
    },
  },
];

// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------

async function main() {
  const centroids = JSON.parse(readFileSync(CENTROIDS_PATH, 'utf-8'));
  console.log(`Loaded ${centroids.length} centroids`);

  const axes_out = [];

  for (const ax of AXES) {
    console.log(`\nEmbedding axis: ${ax.slug}`);
    const eA = await embedQuery(ax.pole_a.anchor);
    const eB = await embedQuery(ax.pole_b.anchor);
    const axisVec = normalize(diff(eA, eB));

    // Compute positions
    const positions = centroids.map((c) => {
      const v = normalize(c.vector); // ensure normalized
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

    // Normalize positions into [-1, 1] for display (linear stretch over observed range).
    // Keep the raw projection too for the math-curious.
    const min = Math.min(...positions.map((p) => p.position));
    const max = Math.max(...positions.map((p) => p.position));
    const range = Math.max(max - min, 1e-9);
    for (const p of positions) {
      p.position_normalized = +(((p.position - min) / range) * 2 - 1).toFixed(4);
    }

    positions.sort((a, b) => b.position - a.position);

    axes_out.push({
      slug: ax.slug,
      title: ax.title,
      pole_a: ax.pole_a,
      pole_b: ax.pole_b,
      raw_range: [min, max],
      positions,
    });

    console.log(`  ${ax.slug}: range [${min.toFixed(3)}, ${max.toFixed(3)}]`);
    console.log(`  most pole-A: ${positions[0].entry_subject} (${positions[0].position.toFixed(3)})`);
    console.log(`  most pole-B: ${positions[positions.length - 1].entry_subject} (${positions[positions.length - 1].position.toFixed(3)})`);
  }

  const out = {
    generated: new Date().toISOString().slice(0, 10),
    total_entries: centroids.length,
    total_axes: axes_out.length,
    axes: axes_out,
  };

  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf-8');
  console.log(`\nWrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
