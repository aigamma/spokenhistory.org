/**
 * @fileoverview federatedSearch, the orchestrator behind the command palette.
 *
 * One query, fanned out across the whole archive and blended into typed
 * groups. The site holds its knowledge in several places, and a "comprehensive"
 * search has to reach all of them:
 *
 *   - Static catalogs (instant, no per-keystroke network): the people index
 *     (`/rag/people/index.json`) and the essays index (`/rag/essays/index.json`)
 *     drive name / role / title / author / topic typeahead. Loaded once and
 *     cached, then filtered locally.
 *   - The Firebase database (Eric's rebuilt Firestore): `timelineEvents` for the
 *     movement timeline and `events_and_topics` for topic labels. Read once,
 *     cached, filtered locally.
 *   - The RAG layer (Pinecone + Voyage, via `ragClient.retrieve`): time-anchored
 *     transcript passages, citation-grade and reranked. This is the semantic
 *     heart, and the only group whose relevance is meaning-based rather than
 *     string-based.
 *   - The Firebase vector layer (`embeddings.searchClipsByTopic` -> the
 *     `vectorSearch` Cloud Function over `clipEmbeddings`): a second semantic
 *     engine over the chapter-level Firestore embeddings. Best-effort: it stays
 *     dark until the Cloud Functions are deployed and the collection is
 *     populated, and a small circuit breaker stops calling it after it proves
 *     unavailable so the palette never pays for a dead source twice.
 *
 * Every source is independent and fails soft: a slow or unavailable source
 * resolves to nothing within its timeout, and the other groups still render.
 * Each hit is normalized to one shape so the UI renders them uniformly:
 *
 *   { id, type, title, subtitle, evidence?, score, href, badge, source }
 *   type in 'interview' | 'person' | 'topic' | 'timeline' | 'essay' | 'passage'
 */

import { collection, getDocs } from 'firebase/firestore';
import { retrieve } from './ragClient';
import { searchClipsByTopic } from './embeddings';
import { db } from './firebase';
import { clipHref, shortTimestamp } from '../utils/clipLink';

const MIN_QUERY = 2;
const PER_GROUP_CAP = 5;
const PASSAGE_TOPN = 8;
const NETWORK_TIMEOUT_MS = 7000;
const CLIP_TIMEOUT_MS = 4500;

// ---------------------------------------------------------------------------
// Text matching (string-based groups). Diacritic-folded, punctuation-loose,
// ranked so an exact or prefix hit on a primary field beats a buried substring.
// ---------------------------------------------------------------------------

function norm(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Rank how well `hay` matches the already-normalized `needle`, 0 = no match. */
function matchScore(needle, hay) {
  const h = norm(hay);
  if (!h || !needle) return 0;
  if (h === needle) return 1;
  if (h.startsWith(needle)) return 0.9;
  if (new RegExp('\\b' + escapeRegex(needle)).test(h)) return 0.8;
  if (h.includes(needle)) return 0.6;
  const toks = needle.split(' ').filter(Boolean);
  if (toks.length > 1 && toks.every((t) => h.includes(t))) return 0.5;
  return 0;
}

/** Best weighted score across several fields: [text, weight] pairs. */
function bestFieldScore(needle, fields) {
  let best = 0;
  for (const [text, weight] of fields) {
    const s = matchScore(needle, text) * weight;
    if (s > best) best = s;
  }
  return best;
}

// ---------------------------------------------------------------------------
// Cached sources. Each cache holds a promise; a failed load resets to null so
// the next query can retry rather than caching the failure forever.
// ---------------------------------------------------------------------------

let peopleIndexPromise = null;
let essaysIndexPromise = null;
let timelineEventsPromise = null;
let firestoreTopicsPromise = null;

// Circuit breaker for the (likely-undeployed) Firestore vector arm.
let clipFailures = 0;
let clipsDisabled = false;

function loadJson(url) {
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(`fetch_failed ${url} ${res.status}`);
    return res.json();
  });
}

function getPeople() {
  if (!peopleIndexPromise) {
    peopleIndexPromise = loadJson('/rag/people/index.json')
      .then((data) => {
        const bySlug = data && typeof data.by_slug === 'object' ? data.by_slug : null;
        if (bySlug) return Object.values(bySlug);
        const byEntry = data && typeof data.by_entry === 'object' ? data.by_entry : {};
        return Object.values(byEntry);
      })
      .catch((e) => {
        peopleIndexPromise = null;
        throw e;
      });
  }
  return peopleIndexPromise;
}

function getEssays() {
  if (!essaysIndexPromise) {
    essaysIndexPromise = loadJson('/rag/essays/index.json').catch((e) => {
      essaysIndexPromise = null;
      throw e;
    });
  }
  return essaysIndexPromise;
}

function getTimeline() {
  if (!timelineEventsPromise) {
    timelineEventsPromise = getDocs(collection(db, 'timelineEvents'))
      .then((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      .catch((e) => {
        timelineEventsPromise = null;
        throw e;
      });
  }
  return timelineEventsPromise;
}

function getFirestoreTopics() {
  if (!firestoreTopicsPromise) {
    firestoreTopicsPromise = getDocs(collection(db, 'events_and_topics'))
      .then((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      .catch((e) => {
        firestoreTopicsPromise = null;
        throw e;
      });
  }
  return firestoreTopicsPromise;
}

function getClips(raw) {
  if (clipsDisabled) return Promise.resolve([]);
  return searchClipsByTopic(raw, { limit: 8 })
    .then((r) => (Array.isArray(r) ? r : []))
    .catch((e) => {
      // A missing/undeployed callable trips the breaker so we stop paying for
      // it; an abort does not count against it.
      if (!(e && e.name === 'AbortError')) {
        clipFailures += 1;
        if (clipFailures >= 2) clipsDisabled = true;
      }
      throw e;
    });
}

// ---------------------------------------------------------------------------
// settle: resolve a source to its value or null within a timeout, recording a
// per-source status, never rejecting.
// ---------------------------------------------------------------------------

function statusFor(e) {
  return e && e.name === 'AbortError' ? 'aborted' : 'error';
}

function settle(status, label, promise, ms) {
  const guarded = promise.then(
    (value) => ({ value, st: 'ok' }),
    (e) => ({ value: null, st: statusFor(e) }),
  );
  const timer = new Promise((res) => setTimeout(() => res({ value: null, st: 'timeout' }), ms));
  return Promise.race([guarded, timer]).then((r) => {
    status[label] = r.st;
    return r.value;
  });
}

// ---------------------------------------------------------------------------
// Normalizers (-> the common result shape)
// ---------------------------------------------------------------------------

function personHref(p) {
  return p.slug ? `/person/${p.slug}` : null;
}

function normalizePerson(p, score) {
  return {
    id: `person-${p.slug}`,
    type: 'person',
    title: p.display_name || p.slug,
    subtitle: p.role_preview || '',
    score,
    href: personHref(p),
    badge: p.person_type === 'interviewee' ? 'Interviewee' : 'Historic figure',
    source: 'static',
  };
}

function normalizePassage(r) {
  return {
    id: `passage-${r.id || `${r.entryNumber}-${r.chunkIndex}`}`,
    type: 'passage',
    entryNumber: r.entryNumber,
    title: r.entrySubject || `Interview #${r.entryNumber}`,
    subtitle: shortTimestamp(r.timestampStartStr),
    evidence: r.textPreview || r.text || '',
    score: r.similarity != null ? r.similarity : 0,
    href: clipHref(r),
    badge: r.similarity != null ? `${Math.round(r.similarity * 100)}%` : null,
    source: 'pinecone',
  };
}

function normalizeClip(c, nameToEntry) {
  const entry = nameToEntry.get(norm(c.interviewName));
  const start = Number(c.startTime);
  const end = Number(c.endTime);
  let href = null;
  if (entry != null && Number.isFinite(start) && start > 0) {
    const e = Number.isFinite(end) && end > start ? Math.round(end) : Math.round(start) + 60;
    href = `/interview/${entry}?t=${Math.round(start)}&end=${e}`;
  } else if (typeof c.playUrl === 'string' && c.playUrl) {
    href = c.playUrl;
  }
  if (!href) return null;
  const score = c.similarity != null ? c.similarity : c.topicRelevance != null ? c.topicRelevance : 0;
  return {
    id: `clip-${c.documentId}-${c.segmentId}`,
    type: 'passage',
    title: c.interviewName || c.displayTitle || 'Clip',
    subtitle: c.topic || c.timestamp || '',
    evidence: c.textPreview || c.summary || c.topic || '',
    score,
    href,
    badge: 'Clip',
    source: 'firestore-vector',
    entryNumber: entry != null ? entry : null,
  };
}

function normalizeTopic(t, score) {
  const kw = t.keyword || t.label;
  return {
    id: `topic-${t.id || norm(t.label)}`,
    type: 'topic',
    title: t.label,
    subtitle: t.description || '',
    score,
    href: `/playlist-builder?keywords=${encodeURIComponent(kw)}&label=${encodeURIComponent(t.label)}`,
    badge: 'Topic',
    source: t.source || 'static',
  };
}

function normalizeTimeline(ev, score) {
  const year = pickYear(ev.date);
  return {
    id: `timeline-${ev.id}`,
    type: 'timeline',
    title: ev.title || ev.headline || 'Timeline event',
    subtitle: stripTags(ev.description || '').slice(0, 120),
    score,
    href: '/',
    badge: year || 'Timeline',
    source: 'firestore',
  };
}

function normalizeEssay(e, score) {
  const authors = Array.isArray(e.authors) ? e.authors.join(', ') : e.authors || '';
  return {
    id: `essay-${e.slug}`,
    type: 'essay',
    title: e.title || e.slug,
    subtitle: authors,
    score,
    href: `/essays/${e.slug}`,
    badge: 'Essay',
    source: 'static',
  };
}

function pickYear(date) {
  if (date == null) return null;
  const m = String(date).match(/\b(1[5-9]\d{2}|20\d{2})\b/);
  return m ? m[1] : null;
}

function stripTags(s) {
  return String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Topic assembly: curated essay topics (reliable, carry a corpus keyword)
// merged with whatever Firestore's events_and_topics offers, deduped by label.
// ---------------------------------------------------------------------------

function pickString(obj, keys) {
  for (const k of keys) {
    const v = obj && obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function assembleTopics(essays, fsTopics) {
  const out = [];
  const seen = new Set();
  const push = (label, keyword, description, id, source) => {
    const key = norm(label);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({ label, keyword: keyword || label, description: description || '', id: id || key, source });
  };
  const essayTopics = essays && Array.isArray(essays.topics) ? essays.topics : [];
  for (const t of essayTopics) {
    push(t.label, t.corpus_links && t.corpus_links.keyword, t.description, t.id, 'static');
  }
  const fs = Array.isArray(fsTopics) ? fsTopics : [];
  for (const t of fs) {
    const label = pickString(t, ['name', 'title', 'label', 'topic', 'event']);
    if (!label) continue;
    const keyword = pickString(t, ['keyword', 'kw', 'slug']) || label;
    const description = pickString(t, ['description', 'summary', 'definition']);
    push(label, keyword, description, t.id, 'firestore');
  }
  return out;
}

function buildNameToEntry(people) {
  const map = new Map();
  for (const p of people || []) {
    if (p && p.entry_number != null && p.display_name) {
      map.set(norm(p.display_name), p.entry_number);
    }
  }
  return map;
}

function rankSlice(scored) {
  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, PER_GROUP_CAP);
}

function emptyGroups() {
  return { interview: [], person: [], topic: [], timeline: [], essay: [], passage: [] };
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

/**
 * @param {string} query
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<{ groups: Record<string, Array>, status: Record<string,string> }>}
 */
export async function federatedSearch(query, opts = {}) {
  const { signal } = opts;
  const raw = String(query || '').trim();
  const q = norm(raw);
  const status = {};
  if (q.length < MIN_QUERY) return { groups: emptyGroups(), status };

  const [people, essays, timeline, fsTopics, passages, clips] = await Promise.all([
    settle(status, 'people', getPeople(), NETWORK_TIMEOUT_MS),
    settle(status, 'essays', getEssays(), NETWORK_TIMEOUT_MS),
    settle(status, 'timeline', getTimeline(), NETWORK_TIMEOUT_MS),
    settle(status, 'topics', getFirestoreTopics(), NETWORK_TIMEOUT_MS),
    settle(status, 'passages', retrieve(raw, { topN: PASSAGE_TOPN, signal }), NETWORK_TIMEOUT_MS),
    settle(status, 'clips', getClips(raw), CLIP_TIMEOUT_MS),
  ]);

  // People (every catalog entry; interviewees and historic figures alike).
  const person = rankSlice(
    (people || []).map((p) => ({
      ref: p,
      score: bestFieldScore(q, [
        [p.display_name, 1],
        [p.role_preview, 0.45],
      ]),
    })),
  ).map((x) => normalizePerson(x.ref, x.score));

  // Interviews: interviewee name matches, plus the distinct interviewees behind
  // the semantic passage hits, deduped by entry number. Explicit name matches
  // outrank passage-derived ones.
  const passageList = passages && Array.isArray(passages.results) ? passages.results : [];
  const interviewMap = new Map();
  for (const p of people || []) {
    if (p.entry_number == null) continue;
    const score = bestFieldScore(q, [
      [p.display_name, 1],
      [p.role_preview, 0.45],
    ]);
    if (score > 0) {
      interviewMap.set(p.entry_number, {
        entryNumber: p.entry_number,
        title: p.display_name,
        subtitle: p.role_preview || `Interview #${p.entry_number}`,
        score: score + 0.05,
        source: 'static',
      });
    }
  }
  for (const r of passageList) {
    const en = r.entryNumber;
    if (en == null || interviewMap.has(en)) continue;
    interviewMap.set(en, {
      entryNumber: en,
      title: r.entrySubject || `Interview #${en}`,
      subtitle: 'Mentioned in a matching passage',
      score: (r.similarity != null ? r.similarity : 0.4) * 0.6,
      source: 'pinecone',
    });
  }
  const interview = [...interviewMap.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, PER_GROUP_CAP)
    .map((x) => ({
      id: `interview-${x.entryNumber}`,
      type: 'interview',
      title: x.title,
      subtitle: x.subtitle,
      score: x.score,
      href: `/interview/${x.entryNumber}`,
      badge: 'Interview',
      source: x.source,
    }));

  // Passages: Pinecone (citation-grade) merged with best-effort Firestore-vector
  // clips, deduped by entry + rounded start; Pinecone wins a collision.
  const nameToEntry = buildNameToEntry(people);
  const clipHits = (Array.isArray(clips) ? clips : [])
    .map((c) => normalizeClip(c, nameToEntry))
    .filter(Boolean);
  const passageHits = passageList.map(normalizePassage);
  const passage = dedupePassages([...passageHits, ...clipHits]).slice(0, PER_GROUP_CAP + 2);

  // Essays + topics (static catalogs, plus any Firestore topics).
  const essayArr = essays && Array.isArray(essays.essays) ? essays.essays : [];
  const essay = rankSlice(
    essayArr.map((e) => ({
      ref: e,
      score: bestFieldScore(q, [
        [e.title, 1],
        [Array.isArray(e.authors) ? e.authors.join(' ') : e.authors, 0.6],
        [e.slug, 0.4],
      ]),
    })),
  ).map((x) => normalizeEssay(x.ref, x.score));

  const topic = rankSlice(
    assembleTopics(essays, fsTopics).map((t) => ({
      ref: t,
      score: bestFieldScore(q, [
        [t.label, 1],
        [t.keyword, 0.6],
        [t.description, 0.4],
      ]),
    })),
  ).map((x) => normalizeTopic(x.ref, x.score));

  // Timeline (Firestore).
  const timelineGroup = rankSlice(
    (Array.isArray(timeline) ? timeline : []).map((ev) => ({
      ref: ev,
      score: bestFieldScore(q, [
        [ev.title || ev.headline, 1],
        [ev.description, 0.4],
        [String(ev.date || ''), 0.5],
      ]),
    })),
  ).map((x) => normalizeTimeline(x.ref, x.score));

  return {
    groups: { interview, person, topic, timeline: timelineGroup, essay, passage },
    status,
  };
}

function dedupePassages(list) {
  const seen = new Map();
  const out = [];
  for (const r of list) {
    const start = r.href && r.href.includes('t=') ? r.href.split('t=')[1].split('&')[0] : '';
    const key = `${r.entryNumber != null ? r.entryNumber : r.title}-${start}`;
    if (seen.has(key)) {
      // Prefer the citation-grade Pinecone hit over a Firestore-vector clip.
      const prevIdx = seen.get(key);
      if (out[prevIdx].source === 'firestore-vector' && r.source === 'pinecone') out[prevIdx] = r;
      continue;
    }
    seen.set(key, out.length);
    out.push(r);
  }
  return out.sort((a, b) => b.score - a.score);
}

/** Exposed for diagnostics/tests: whether the Firestore-vector arm is live. */
export function clipArmStatus() {
  return { disabled: clipsDisabled, failures: clipFailures };
}
