/**
 * @fileoverview InterviewDetail — per-interview page.
 *
 * Route: /interview/:entryNumber
 *
 * Reads from the RAG substrate JSON files (no Firestore dependency):
 *   - /rag/summaries/capsules.json   — 3-sentence biographical summary
 *   - /rag/summaries/neighbors.json  — top-5 thematic neighbors
 *   - /rag/summaries/pipeline_output/entry_<N>.json  — full pipeline output
 *     (main_summary + chapters + key_themes + historical_significance);
 *     this file may or may not exist depending on whether the pipeline
 *     has run for this entry. The page renders gracefully without it.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, ChevronLeft, Clock } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Footer from '../components/common/Footer';
import { TIER_BADGE, fidelityNoteFor } from '../components/rag/tiers';

export default function InterviewDetail() {
  const { entryNumber } = useParams();
  const n = parseInt(entryNumber, 10);

  const [capsules, setCapsules] = useState(null);
  const [neighbors, setNeighbors] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [pipelineMissing, setPipelineMissing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/rag/summaries/capsules.json').then((r) => (r.ok ? r.json() : { capsules: {} })),
      fetch('/rag/summaries/neighbors.json').then((r) => (r.ok ? r.json() : {})),
      fetch(`/rag/summaries/pipeline_output/entry_${n}.json`).then((r) => {
        if (r.ok) return r.json();
        return null;
      }).catch(() => null),
    ])
      .then(([caps, nbrs, pipe]) => {
        if (cancelled) return;
        setCapsules(caps.capsules || caps || {});
        setNeighbors(nbrs || {});
        if (pipe) setPipeline(pipe);
        else setPipelineMissing(true);
      })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, [n]);

  const entry = useMemo(() => {
    if (!neighbors) return null;
    return neighbors[n] || neighbors[String(n)] || null;
  }, [neighbors, n]);

  const capsule = useMemo(() => {
    if (!capsules) return null;
    const c = capsules[n] || capsules[String(n)];
    return c?.capsule || null;
  }, [capsules, n]);

  useDocumentTitle(entry ? `${entry.entry_subject} — Interview` : 'Interview');

  if (error) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#EBEAE9' }}>
        <p className="text-stone-700">Failed to load this interview. {error}</p>
      </div>
    );
  }

  if (!neighbors) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#EBEAE9' }}>
        <p className="text-stone-700">Loading…</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#EBEAE9' }}>
        <Link to="/interview-index" className="text-civil-red-body hover:underline inline-flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Back to Interview Index
        </Link>
        <p className="text-stone-700 mt-4">No interview found for entry #{n}.</p>
      </div>
    );
  }

  const tierKey = entry.tier in TIER_BADGE ? entry.tier : null;
  const tierBadge = tierKey ? TIER_BADGE[tierKey] : null;
  const fidelity = fidelityNoteFor(pipeline?.entry_provenance || 'audit-original', entry.tier);

  // Pull data from pipeline (if present) — main_summary + chapters + themes
  const main = pipeline?.main_summary;
  const chapters = pipeline?.chapters || [];
  const themes = main?.key_themes || [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EBEAE9' }}>
      <main id="main-content" tabIndex={-1} className="max-w-4xl mx-auto px-4 sm:px-6 py-12 focus:outline-none">
        <Link
          to="/interview-index"
          className="inline-flex items-center gap-1 text-civil-red-body hover:underline mb-6 text-sm"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Interview Index
        </Link>

        <header className="mb-8">
          <p className="text-civil-red-body text-sm font-light font-mono mb-2">
            Entry #{entry.entry_number}
          </p>
          <h1
            className="text-stone-900 text-3xl sm:text-4xl md:text-5xl font-medium mb-3"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {entry.entry_subject}
          </h1>
          {tierBadge && (
            <div className="mb-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border ${tierBadge.bg} ${tierBadge.border} ${tierBadge.text}`}>
                {tierBadge.label}
              </span>
            </div>
          )}
          {capsule && (
            <p
              className="text-stone-800 text-lg max-w-3xl italic"
              style={{ fontFamily: 'Source Serif 4, serif' }}
            >
              {capsule}
            </p>
          )}
          <p className="text-xs text-stone-500 mt-3">{fidelity}</p>
        </header>

        {entry.loc_item_url && (
          <a
            href={entry.loc_item_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors text-sm"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            Library of Congress catalog page
          </a>
        )}

        {main?.summary && (
          <section className="mb-10">
            <h2 className="text-stone-900 text-2xl font-medium mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              Overview
            </h2>
            <p
              className="text-stone-800 text-base leading-relaxed"
              style={{ fontFamily: 'Source Serif 4, serif' }}
            >
              {main.summary}
            </p>
          </section>
        )}

        {themes.length > 0 && (
          <section className="mb-10">
            <h2 className="text-stone-900 text-xl font-medium mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              Key themes
            </h2>
            <ul className="flex flex-wrap gap-2">
              {themes.map((t, i) => (
                <li key={i} className="px-3 py-1 bg-white border border-stone-200 rounded-full text-sm text-stone-700">
                  {t}
                </li>
              ))}
            </ul>
          </section>
        )}

        {main?.historical_significance && (
          <section className="mb-10">
            <h2 className="text-stone-900 text-xl font-medium mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              Historical significance
            </h2>
            <p
              className="text-stone-800 leading-relaxed"
              style={{ fontFamily: 'Source Serif 4, serif' }}
            >
              {main.historical_significance}
            </p>
          </section>
        )}

        {chapters.length > 0 && (
          <section className="mb-10">
            <h2 className="text-stone-900 text-2xl font-medium mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Chapters ({chapters.length})
            </h2>
            <ol className="space-y-3 list-none p-0">
              {chapters.map((ch) => (
                <li key={ch.chapter_number} className="border border-stone-200 rounded-md bg-white p-4">
                  <header className="flex items-baseline justify-between gap-3 mb-1">
                    <h3 className="text-base font-medium text-stone-900">
                      <span className="text-civil-red-body font-mono mr-2 text-sm">
                        {String(ch.chapter_number).padStart(2, '0')}
                      </span>
                      {ch.title}
                    </h3>
                    {(ch.start_time || ch.end_time) && (
                      <span className="text-xs text-stone-500 tabular-nums whitespace-nowrap inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {(ch.start_time || '').split(',')[0]}–{(ch.end_time || '').split(',')[0]}
                      </span>
                    )}
                  </header>
                  {ch.main_topic_category && (
                    <p className="text-xs text-stone-500 uppercase tracking-wide mb-2 ml-8">
                      {ch.main_topic_category}
                    </p>
                  )}
                  {ch.summary && (
                    <p className="text-sm text-stone-700 ml-8" style={{ fontFamily: 'Source Serif 4, serif' }}>
                      {ch.summary}
                    </p>
                  )}
                  {ch.keywords && (
                    <p className="text-xs text-stone-500 mt-2 ml-8">
                      <span className="uppercase tracking-wide">Keywords:</span>{' '}
                      {Array.isArray(ch.keywords) ? ch.keywords.join(', ') : ch.keywords}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {pipelineMissing && (
          <section className="mb-10 p-4 border border-stone-200 rounded-md bg-white">
            <p className="text-sm text-stone-600">
              Chapter breakdown and overview are still being generated for this interview. The Library of Congress catalog page (above) has the canonical published transcript.
            </p>
          </section>
        )}

        {entry.neighbors && entry.neighbors.length > 0 && (
          <section className="mb-10">
            <h2 className="text-stone-900 text-xl font-medium mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              Voices in conversation
            </h2>
            <p className="text-sm text-stone-600 mb-4 max-w-2xl">
              These interviewees discuss thematically related material — surfaced by embedding-space proximity (cosine similarity over 1024-dim Voyage-3 vectors).
            </p>
            <ul className="space-y-2 list-none p-0">
              {entry.neighbors.map((nb) => {
                const nbTierKey = nb.tier in TIER_BADGE ? nb.tier : null;
                const nbBadge = nbTierKey ? TIER_BADGE[nbTierKey] : null;
                return (
                  <li key={nb.entry_number} className="flex items-center justify-between gap-3 p-3 border border-stone-200 rounded-md bg-white">
                    <Link
                      to={`/interview/${nb.entry_number}`}
                      className="text-stone-900 hover:text-civil-red-body font-medium"
                    >
                      {nb.entry_subject}
                    </Link>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-stone-500 tabular-nums">
                        similarity {nb.similarity.toFixed(3)}
                      </span>
                      {nbBadge && (
                        <span className={`px-2 py-0.5 rounded-full border ${nbBadge.bg} ${nbBadge.border} ${nbBadge.text}`}>
                          {nb.tier}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
