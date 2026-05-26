// rag/precompute_panels.mjs
//
// Pre-compute the static-retrieval surfaces that consume the Pinecone +
// Voyage substrate:
//
//   1. Polyphonic event pages   - 8 canonical events, top passages per event
//   2. Famous-name-not-in-corpus - 15 figures discussed by interviewees
//   3. Geographic atlas         - 12 movement geographies
//
// Each surface is a fixed list of queries. The script hits the live
// Pinecone + Voyage rerank pipeline once per query, dedupes by entry to
// surface polyphonic coverage, and writes a static JSON file the React
// frontend can consume at build time.
//
// No LLM call per query. No tail-risk cost.
//
// Usage:
//   node --env-file=rag/.env.local rag/precompute_panels.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { retrieve } from './retrieve.mjs';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const SUMMARIES_DIR = join(REPO_ROOT, 'public', 'rag', 'summaries');
const EVENTS_DIR = join(SUMMARIES_DIR, 'events');
mkdirSync(EVENTS_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Canonical events
// ---------------------------------------------------------------------------

const EVENTS = [
  {
    slug: 'bloody-sunday-selma-1965',
    title: 'Bloody Sunday — Edmund Pettus Bridge',
    date_range: 'March 7, 1965',
    query: 'bloody sunday edmund pettus bridge selma march 1965 state troopers first-person account',
    blurb: 'The march from Selma toward Montgomery on March 7, 1965, halted at the foot of the Edmund Pettus Bridge by Alabama state troopers. Witnesses, organizers, and marchers describe what they saw.',
  },
  {
    slug: 'greensboro-sit-ins-1960',
    title: 'Greensboro Sit-Ins',
    date_range: 'February 1, 1960',
    query: 'greensboro sit-ins woolworth lunch counter february 1960 student protest',
    blurb: 'Four North Carolina A&T students refused to leave a Woolworth lunch counter on February 1, 1960. The action ignited a wave of sit-ins across the South within weeks.',
  },
  {
    slug: 'march-on-washington-1963',
    title: 'March on Washington for Jobs and Freedom',
    date_range: 'August 28, 1963',
    query: 'march on washington august 1963 lincoln memorial dream speech jobs and freedom',
    blurb: 'Some 250,000 people gathered at the Lincoln Memorial on August 28, 1963, behind a coalition of civil-rights, labor, and religious organizations. Witnesses describe the scale, the organizing, and the rhetoric.',
  },
  {
    slug: '16th-street-baptist-bombing-1963',
    title: '16th Street Baptist Church Bombing',
    date_range: 'September 15, 1963',
    query: 'sixteenth street baptist church bombing birmingham september 1963 four girls killed',
    blurb: 'A Ku Klux Klan bomb killed four Black girls and injured many at the 16th Street Baptist Church in Birmingham, Alabama, on September 15, 1963. Interviewees recall the day and its aftermath.',
  },
  {
    slug: 'freedom-summer-mississippi-1964',
    title: 'Freedom Summer',
    date_range: 'June – August 1964',
    query: 'freedom summer 1964 mississippi voter registration freedom schools cofo',
    blurb: 'A coalition of SNCC, CORE, NAACP, and SCLC organizers brought hundreds of mostly-white northern student volunteers into Mississippi for the summer of 1964 to register voters and staff Freedom Schools.',
  },
  {
    slug: 'mlk-assassination-1968',
    title: 'Dr. King Assassination',
    date_range: 'April 4, 1968',
    query: 'dr king assassination memphis lorraine motel april 1968 reaction grief',
    blurb: 'Dr. Martin Luther King Jr. was shot at the Lorraine Motel in Memphis on April 4, 1968. Movement contemporaries describe where they were and what they did in the hours and days after.',
  },
  {
    slug: 'voting-rights-act-1965',
    title: 'Voting Rights Act of 1965',
    date_range: 'August 6, 1965',
    query: 'voting rights act 1965 federal enforcement section five preclearance signing ceremony',
    blurb: 'Lyndon Johnson signed the Voting Rights Act on August 6, 1965, after the Selma campaign forced the federal government to act. Organizers describe what the legislation changed on the ground.',
  },
  {
    slug: 'emmett-till-1955',
    title: 'Emmett Till',
    date_range: 'August 28, 1955',
    query: 'emmett till money mississippi 1955 abduction murder open casket trial bryant',
    blurb: 'The fourteen-year-old Chicago boy abducted from his great-uncle\'s home in Money, Mississippi on August 28, 1955, and murdered. Wheeler Parker Jr. is the last living witness; he and others describe the events and what followed.',
  },
];

// ---------------------------------------------------------------------------
// Famous figures NOT in the 136-interview corpus, but discussed extensively
// by interviewees who knew them. Querying the embedding space by name
// surfaces who spoke about them.
// ---------------------------------------------------------------------------

const FAMOUS_EXTERNAL = [
  { slug: 'ella-baker', name: 'Ella Baker', query: 'Ella Baker SCLC SNCC organizing strategy' },
  { slug: 'bayard-rustin', name: 'Bayard Rustin', query: 'Bayard Rustin nonviolence organizing March on Washington' },
  { slug: 'diane-nash', name: 'Diane Nash', query: 'Diane Nash Nashville Freedom Riders SNCC' },
  { slug: 'bob-moses', name: 'Bob Moses', query: 'Bob Moses Mississippi voter registration SNCC' },
  { slug: 'james-forman', name: 'James Forman', query: 'James Forman SNCC executive secretary organizing' },
  { slug: 'fannie-lou-hamer', name: 'Fannie Lou Hamer', query: 'Fannie Lou Hamer MFDP Mississippi Atlantic City testimony' },
  { slug: 'martin-luther-king', name: 'Dr. Martin Luther King, Jr.', query: 'Dr. King SCLC leadership Birmingham Selma nonviolence' },
  { slug: 'malcolm-x', name: 'Malcolm X', query: 'Malcolm X Nation of Islam autobiography 1965' },
  { slug: 'stokely-carmichael', name: 'Stokely Carmichael (Kwame Ture)', query: 'Stokely Carmichael SNCC Black Power Mississippi' },
  { slug: 'septima-clark', name: 'Septima Clark', query: 'Septima Clark Highlander citizenship schools literacy' },
  { slug: 'medgar-evers', name: 'Medgar Evers', query: 'Medgar Evers NAACP Mississippi field secretary assassination 1963' },
  { slug: 'thurgood-marshall', name: 'Thurgood Marshall', query: 'Thurgood Marshall NAACP LDF Brown v Board Supreme Court' },
  { slug: 'huey-newton', name: 'Huey P. Newton', query: 'Huey Newton Black Panther Party Oakland armed self-defense' },
  { slug: 'james-baldwin', name: 'James Baldwin', query: 'James Baldwin writer Fire Next Time movement intellectual' },
  { slug: 'a-philip-randolph', name: 'A. Philip Randolph', query: 'A Philip Randolph Brotherhood of Sleeping Car Porters March on Washington' },
];

// ---------------------------------------------------------------------------
// Geographic atlas anchors
// ---------------------------------------------------------------------------

const GEOGRAPHY = [
  { slug: 'mississippi-delta', name: 'Mississippi Delta', query: 'Mississippi Delta sharecropper plantation voter registration' },
  { slug: 'alabama-black-belt', name: 'Alabama Black Belt', query: 'Alabama Black Belt Lowndes Dallas county organizing' },
  { slug: 'selma', name: 'Selma, Alabama', query: 'Selma Alabama Dallas County Voters League march' },
  { slug: 'birmingham', name: 'Birmingham, Alabama', query: 'Birmingham Alabama 1963 children march Connor jail' },
  { slug: 'atlanta', name: 'Atlanta, Georgia', query: 'Atlanta Georgia SCLC SNCC headquarters movement center' },
  { slug: 'nashville', name: 'Nashville, Tennessee', query: 'Nashville Tennessee Fisk sit-ins nonviolence workshops' },
  { slug: 'memphis', name: 'Memphis, Tennessee', query: 'Memphis Tennessee sanitation workers 1968 King assassination' },
  { slug: 'hattiesburg', name: 'Hattiesburg, Mississippi', query: 'Hattiesburg Mississippi Forrest County voter registration MFDP' },
  { slug: 'jackson', name: 'Jackson, Mississippi', query: 'Jackson Mississippi state capitol Tougaloo Medgar Evers' },
  { slug: 'oakland', name: 'Oakland, California', query: 'Oakland California Black Panther Party police' },
  { slug: 'chicago', name: 'Chicago, Illinois', query: 'Chicago Illinois 1966 open housing King northern campaign' },
  { slug: 'washington-dc', name: 'Washington, D.C.', query: 'Washington DC march on washington lobbying federal' },
];

// ---------------------------------------------------------------------------
// Common shapes
// ---------------------------------------------------------------------------

function shapeResult(r) {
  const m = r.metadata || {};
  return {
    entry_number: m.entry_number ?? null,
    entry_subject: m.entry_subject ?? null,
    text_preview: (m.text ?? r.text ?? '').slice(0, 320).replace(/\s+/g, ' ').trim(),
    timestamp_start_seconds: m.timestamp_start_seconds ?? null,
    timestamp_end_seconds: m.timestamp_end_seconds ?? null,
    loc_item_url: m.loc_item_url ?? null,
    suggested_citation: m.suggested_citation ?? null,
    uncertainty_tier: m.inferential_uncertainty_tier ?? null,
    uncertainty_score: typeof m.inferential_uncertainty_score === 'number' ? m.inferential_uncertainty_score : null,
    entry_provenance: m.entry_provenance ?? null,
    rerank_score: typeof r.rerank_score === 'number' ? +r.rerank_score.toFixed(4) : null,
    pinecone_score: typeof r.pinecone_score === 'number' ? +r.pinecone_score.toFixed(4) : null,
  };
}

function dedupeByEntry(results, max = 8) {
  const seen = new Set();
  const out = [];
  for (const r of results) {
    const e = r.entry_number;
    if (e == null || seen.has(e)) continue;
    seen.add(e);
    out.push(r);
    if (out.length >= max) break;
  }
  return out;
}

async function fetchQuery(query, { topK = 30, topN = 12, dedupe = true } = {}) {
  const raw = await retrieve(query, { topK, topN });
  const shaped = raw.map(shapeResult);
  return dedupe ? dedupeByEntry(shaped) : shaped;
}

// ---------------------------------------------------------------------------
// Polyphonic events
// ---------------------------------------------------------------------------

async function runEvents() {
  console.log(`\n[events] processing ${EVENTS.length} canonical events`);
  const index = [];
  for (const ev of EVENTS) {
    process.stdout.write(`  ${ev.slug} ... `);
    const passages = await fetchQuery(ev.query, { topK: 40, topN: 14 });
    const out = { ...ev, generated: new Date().toISOString().slice(0, 10), passages };
    const file = join(EVENTS_DIR, `${ev.slug}.json`);
    writeFileSync(file, JSON.stringify(out, null, 2), 'utf-8');
    console.log(`${passages.length} voices`);
    index.push({
      slug: ev.slug,
      title: ev.title,
      date_range: ev.date_range,
      blurb: ev.blurb,
      voice_count: passages.length,
    });
  }
  writeFileSync(
    join(EVENTS_DIR, '_index.json'),
    JSON.stringify({ events: index, generated: new Date().toISOString().slice(0, 10) }, null, 2),
    'utf-8',
  );
  console.log(`[events] wrote ${index.length} event pages + _index.json`);
}

// ---------------------------------------------------------------------------
// Famous figures
// ---------------------------------------------------------------------------

async function runFamous() {
  console.log(`\n[famous] processing ${FAMOUS_EXTERNAL.length} figures`);
  const out = [];
  for (const f of FAMOUS_EXTERNAL) {
    process.stdout.write(`  ${f.slug} ... `);
    const passages = await fetchQuery(f.query, { topK: 30, topN: 8 });
    out.push({ ...f, passages });
    console.log(`${passages.length} voices`);
  }
  writeFileSync(
    join(SUMMARIES_DIR, 'famous_external.json'),
    JSON.stringify({ generated: new Date().toISOString().slice(0, 10), figures: out }, null, 2),
    'utf-8',
  );
  console.log(`[famous] wrote ${out.length} figures`);
}

// ---------------------------------------------------------------------------
// Geographic atlas
// ---------------------------------------------------------------------------

async function runGeography() {
  console.log(`\n[geography] processing ${GEOGRAPHY.length} anchors`);
  const out = [];
  for (const g of GEOGRAPHY) {
    process.stdout.write(`  ${g.slug} ... `);
    const passages = await fetchQuery(g.query, { topK: 30, topN: 8 });
    out.push({ ...g, passages });
    console.log(`${passages.length} voices`);
  }
  writeFileSync(
    join(SUMMARIES_DIR, 'geography.json'),
    JSON.stringify({ generated: new Date().toISOString().slice(0, 10), anchors: out }, null, 2),
    'utf-8',
  );
  console.log(`[geography] wrote ${out.length} anchors`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const which = process.argv[2] || 'all';
if (which === 'all' || which === 'events') await runEvents();
if (which === 'all' || which === 'famous') await runFamous();
if (which === 'all' || which === 'geography') await runGeography();
console.log('\n[precompute_panels] done');
