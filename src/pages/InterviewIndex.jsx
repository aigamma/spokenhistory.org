/**
 * @fileoverview InterviewIndex, card-based directory of all 136 interviews.
 *
 * Originally fetched from Firestore (`interviewIndex` collection); rewired
 * 2026-05-26 to read from the RAG substrate JSON files:
 *   - /rag/summaries/neighbors.json (entry_number, subject, tier, LoC URL)
 *   - /rag/summaries/capsules.json (3-sentence museum-label biographies)
 *
 * This works without Firestore being populated. When the team eventually
 * pushes Metadata Generation System outputs into Firestore, that data
 * can be merged in as a secondary layer (timestamps, chapter summaries,
 * etc.), but the directory itself stays RAG-backed.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Footer from '../components/common/Footer';
import { TIER_BADGE } from '../components/rag/tiers';

export default function InterviewIndex() {
  useDocumentTitle('Interview Index');
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [data, setData] = useState(null);
  const [capsules, setCapsules] = useState({});
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(initialSearch);
  const [tierFilter, setTierFilter] = useState('all');
  const [sortBy, setSortBy] = useState('A-Z');
  const [peopleIndex, setPeopleIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/rag/summaries/neighbors.json').then((r) => (r.ok ? r.json() : {})),
      fetch('/rag/summaries/capsules.json').then((r) => (r.ok ? r.json() : { capsules: {} })),
      fetch('/rag/people/index.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([neighbors, caps, idx]) => {
        if (cancelled) return;
        setData(neighbors);
        setCapsules(caps.capsules || caps || {});
        setPeopleIndex(idx);
      })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  const interviews = useMemo(() => {
    if (!data) return [];
    return Object.values(data).map((e) => ({
      entry_number: e.entry_number,
      name: e.entry_subject,
      tier: e.tier,
      loc_item_url: e.loc_item_url,
      capsule: (capsules[e.entry_number] || capsules[String(e.entry_number)])?.capsule || null,
      catalog_slug: peopleIndex?.by_entry?.[e.entry_number]?.slug || null,
    }));
  }, [data, capsules, peopleIndex]);

  const filtered = useMemo(() => {
    let list = interviews;
    if (tierFilter !== 'all') list = list.filter((i) => i.tier === tierFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(s) || (i.capsule || '').toLowerCase().includes(s));
    }
    const sorted = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'Z-A': return b.name.localeCompare(a.name);
        case 'Entry #': return (a.entry_number || 0) - (b.entry_number || 0);
        default: return a.name.localeCompare(b.name);
      }
    });
    return sorted;
  }, [interviews, search, tierFilter, sortBy]);

  const tiers = useMemo(() => {
    const counts = {};
    for (const i of interviews) counts[i.tier || 'unknown'] = (counts[i.tier || 'unknown'] || 0) + 1;
    return counts;
  }, [interviews]);

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-[#EBEAE9] dark:bg-stone-900">
        <p className="text-stone-700">Failed to load the index. {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBEAE9] dark:bg-stone-900">
      <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 py-12 focus:outline-none">
        <header className="mb-8">
          <p className="text-civil-red-body text-sm font-light font-mono mb-2">
            Civil Rights History Project · Interview directory
          </p>
          <h1
            className="text-stone-900 text-3xl sm:text-4xl md:text-5xl font-medium mb-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Interview Index
          </h1>
          <p
            className="text-stone-700 text-base sm:text-lg max-w-3xl"
            style={{ fontFamily: 'Source Serif 4, serif' }}
          >
            All 136 interviews in the corpus, with audit-tier badges and 3-sentence biographical capsules. Click an entry to open the embedding-space &quot;voices in conversation&quot; view, or follow the Library of Congress link to the canonical archive.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {Object.entries(TIER_BADGE).map(([key, badge]) => (
              <span key={key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${badge.bg} ${badge.border} ${badge.text}`}>
                <span className="font-medium tabular-nums">{tiers[key] || 0}</span>
                <span>{key}</span>
              </span>
            ))}
          </div>
        </header>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search by name or capsule content…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 focus:border-civil-red-strong focus:ring-2 focus:ring-civil-red-strong/30 outline-none transition-colors"
            aria-label="Search interviews by name or capsule content"
          />
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 focus:border-civil-red-strong focus:ring-2 focus:ring-civil-red-strong/30 outline-none transition-colors"
            aria-label="Filter interviews by audit tier"
          >
            <option value="all">All tiers</option>
            {Object.keys(TIER_BADGE).map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 focus:border-civil-red-strong focus:ring-2 focus:ring-civil-red-strong/30 outline-none transition-colors"
            aria-label="Sort interviews"
          >
            <option value="A-Z">Name A–Z</option>
            <option value="Z-A">Name Z–A</option>
            <option value="Entry #">Entry #</option>
          </select>
        </div>

        <p className="text-sm text-stone-600 mb-4">
          {filtered.length} {filtered.length === 1 ? 'interview' : 'interviews'} shown
        </p>

        {!data && (
          <p className="text-sm text-stone-500" role="status" aria-live="polite">Loading…</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((it) => (
            <InterviewCard key={it.entry_number} interview={it} />
          ))}
        </div>

        <div className="mt-12">
          <Link
            to="/rag-explore"
            className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 dark:bg-stone-700 text-white rounded-md hover:bg-stone-800 dark:hover:bg-stone-600 transition-colors"
          >
            Explore embedding-space features →
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function InterviewCard({ interview }) {
  const tierKey = interview.tier in TIER_BADGE ? interview.tier : null;
  const badge = tierKey ? TIER_BADGE[tierKey] : null;
  return (
    <article className="border border-stone-200 rounded-lg bg-white p-5">
      <header className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="text-lg font-medium text-stone-900">
            {interview.name}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">Entry #{interview.entry_number}</p>
        </div>
        {badge && (
          <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${badge.bg} ${badge.border} ${badge.text}`}>
            {badge.label}
          </span>
        )}
      </header>
      {interview.capsule && (
        <p
          className="text-sm text-stone-700 mb-3 italic"
          style={{ fontFamily: 'Source Serif 4, serif' }}
        >
          {interview.capsule}
        </p>
      )}
      <div className="flex flex-wrap gap-3 text-xs">
        <Link
          to={`/interview/${interview.entry_number}`}
          className="text-civil-red-body hover:underline font-medium"
        >
          Open interview →
        </Link>
        {interview.catalog_slug && (
          <Link
            to={`/person/${interview.catalog_slug}`}
            className="text-civil-red-body hover:underline"
          >
            Catalog page →
          </Link>
        )}
        {interview.loc_item_url && (
          <a
            href={interview.loc_item_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-civil-red-body hover:underline"
          >
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
            LoC catalog
          </a>
        )}
      </div>
    </article>
  );
}
