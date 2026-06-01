/**
 * @fileoverview InterviewDetail, per-interview page.
 *
 * Route: /interview/:entryNumber
 *
 * Reads from the RAG substrate JSON files (no Firestore dependency):
 *   - /rag/summaries/capsules.json  , 3-sentence biographical summary
 *   - /rag/summaries/neighbors.json , top-5 thematic neighbors
 *   - /rag/summaries/pipeline_output/entry_<N>.json , full pipeline output
 *     (main_summary + chapters + key_themes + historical_significance);
 *     this file may or may not exist depending on whether the pipeline
 *     has run for this entry. The page renders gracefully without it.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Clock, FileText, Play } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Footer from '../components/common/Footer';
import LocVideoEmbed from '../components/LocVideoEmbed';
import { tsToSeconds } from '../components/HearInContext';
import { convertTimestampToSeconds } from '../utils/timeUtils';
import { TIER_BADGE, fidelityNoteFor } from '../components/rag/tiers';

/**
 * Group a flat chapters[] array into PARTS, mirroring the Table of Contents
 * page. A run of consecutive chapters sharing the same non-empty `part` value
 * is one titled part. A leading (or any) run of chapters with no `part` value
 * (null, absent, or empty after trimming) becomes an untitled group that the
 * page renders flat, exactly as it did before the part-migration existed.
 *
 * Returns an array of { title, chapters }. `title` is the part name, or null
 * for an untitled group. Each group preserves chapter order, so the part's
 * span runs from its first chapter's start_time to its last chapter's
 * end_time. Backwards compatible: an un-migrated interview (every chapter's
 * `part` null/absent) collapses to a single untitled group, so the rendered
 * output is one flat chapter list with no part headers.
 */
function groupChaptersByPart(chapters) {
  const groups = [];
  for (const ch of chapters) {
    const raw = ch && ch.part;
    const title = typeof raw === 'string' && raw.trim() ? raw.trim() : null;
    const last = groups[groups.length - 1];
    // Extend the current group when this chapter's part matches the group's
    // (including the null-to-null case, so consecutive untitled chapters stay
    // together); otherwise open a new group.
    if (last && last.title === title) {
      last.chapters.push(ch);
    } else {
      groups.push({ title, chapters: [ch] });
    }
  }
  return groups;
}

export default function InterviewDetail() {
  const { entryNumber } = useParams();
  const n = parseInt(entryNumber, 10);

  // Optional deep-link to a moment: ?t=2078 (seconds) or ?t=00:34:38.
  // PersonPage's "Open the full interview" link passes raw seconds; we
  // also accept a colon-delimited timestamp so the URL stays shareable.
  const [searchParams] = useSearchParams();
  const tParam = searchParams.get('t');
  const startSeconds = tParam
    ? (tParam.includes(':') ? convertTimestampToSeconds(tParam) : parseInt(tParam, 10) || 0)
    : 0;

  // The hero video holds an imperative handle so a chapter row can seek it
  // to that chapter's start and bound the clip to its end, without mounting
  // a second multi-hour video element. Clicking a chapter scrolls the hero
  // back into view and plays just that chapter.
  const heroRef = useRef(null);
  const heroWrapRef = useRef(null);
  const playChapter = (ch) => {
    const start = tsToSeconds(ch.start_time);
    const end = ch.end_time ? tsToSeconds(ch.end_time) : null;
    heroRef.current?.seek(start, { play: true, stopAt: end });
    heroWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Play a whole part straight through: seek to the part's FIRST chapter
  // start and bound playback to the part's LAST chapter end. Same hero handle
  // and same HH:MM:SS,mmm-to-seconds conversion that playChapter uses, so the
  // part run and a single chapter share one playback path (no whole-interview
  // buffering, the player range-jumps to the part and stops at its end).
  const playPart = (group) => {
    const list = group.chapters;
    if (!list || list.length === 0) return;
    const first = list[0];
    const lastWithEnd = [...list].reverse().find((c) => c.end_time);
    const start = tsToSeconds(first.start_time);
    const end = lastWithEnd ? tsToSeconds(lastWithEnd.end_time) : null;
    heroRef.current?.seek(start, { play: true, stopAt: end });
    heroWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const [capsules, setCapsules] = useState(null);
  const [neighbors, setNeighbors] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [pipelineMissing, setPipelineMissing] = useState(false);
  const [error, setError] = useState(null);
  const [peopleIndex, setPeopleIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/rag/summaries/capsules.json').then((r) => (r.ok ? r.json() : { capsules: {} })),
      fetch('/rag/summaries/neighbors.json').then((r) => (r.ok ? r.json() : {})),
      fetch(`/rag/summaries/pipeline_output/entry_${n}.json`).then((r) => {
        if (r.ok) return r.json();
        return null;
      }).catch(() => null),
      fetch('/rag/people/index.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([caps, nbrs, pipe, idx]) => {
        if (cancelled) return;
        setCapsules(caps.capsules || caps || {});
        setNeighbors(nbrs || {});
        if (pipe) setPipeline(pipe);
        else setPipelineMissing(true);
        setPeopleIndex(idx);
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

  useDocumentTitle(entry ? `${entry.entry_subject}, Interview` : 'Interview');

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-[#EBEAE9] dark:bg-zinc-900">
        <p className="text-stone-700">Failed to load this interview. {error}</p>
      </div>
    );
  }

  if (!neighbors) {
    return (
      <div className="min-h-screen p-8 bg-[#EBEAE9] dark:bg-zinc-900">
        <p className="text-stone-700">Loading…</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen p-8 bg-[#EBEAE9] dark:bg-zinc-900">
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

  // Pull data from pipeline (if present), main_summary + chapters + themes
  const main = pipeline?.main_summary;
  const chapters = pipeline?.chapters || [];
  const themes = main?.key_themes || [];

  // Group the flat chapters into parts for the "Play Whole Part" controls.
  // On un-migrated interviews this is a single untitled group, so the list
  // renders flat exactly as before.
  const partGroups = groupChaptersByPart(chapters);
  const hasTitledPart = partGroups.some((g) => g.title);

  return (
    <div className="min-h-screen bg-[#EBEAE9] dark:bg-zinc-900">
      <main id="main-content" tabIndex={-1} className="max-w-4xl mx-auto px-4 sm:px-6 py-12 focus:outline-none">
        <Link
          to="/interview-index"
          className="inline-flex items-center gap-1 text-civil-red-body hover:underline mb-6 text-sm"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Interview Index
        </Link>

        <header className="mb-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 mb-2">
            <p className="text-civil-red-body text-sm font-light font-mono">
              Entry #{entry.entry_number}
            </p>
            {/* Jump to the integrated catalog page (the /person/:slug
                page that consolidates the interviewee's AI's-reading,
                semantic neighbors, concept-axis positions, influence
                edges, and tour appearances; the catalog index resolves
                joint-interview entries to their canonical joint page). */}
            {peopleIndex?.by_entry?.[entry.entry_number]?.slug && (
              <Link
                to={`/person/${peopleIndex.by_entry[entry.entry_number].slug}`}
                className="inline-flex items-center gap-1 text-sm text-civil-red-body hover:text-civil-red-strong focus:outline-none focus-visible:underline"
              >
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                Full catalog page
              </Link>
            )}
          </div>
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

        {/* Video hero. The Library of Congress serves the full interview
            as a streamable MP4 (range-request seekable), so the page
            leads with the recording itself. When the reader arrived via a
            snippet's "Open the full interview" link, startSeconds jumps
            the player to that moment. LocVideoEmbed fetches the loc_video
            block by entry number (cached), so its source stays stable
            regardless of when the rest of the pipeline output resolves. */}
        <div className="mb-8" ref={heroWrapRef}>
          <LocVideoEmbed
            ref={heroRef}
            entryNumber={n}
            startSeconds={startSeconds}
            autoPlay={startSeconds > 0}
          />
        </div>

        {/* The outbound "Library of Congress catalog page" button was
            removed (Dustin, 2026-05-30: keep users on our site, the LoC
            recording is already embedded above). The Library of Congress
            remains credited in the video caption. */}

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
            {hasTitledPart && (
              <p className="text-sm text-stone-600 mb-4 max-w-2xl">
                Chapters are grouped into parts. Play a single chapter, or use a part
                header to listen to that whole part straight through in the video above.
              </p>
            )}
            {partGroups.map((group, gi) => (
              <div key={gi} className={gi > 0 ? 'mt-6' : ''}>
                {group.title && (
                  // Red part header, itself a "Play Whole Part" control: clicking
                  // seeks the hero to this part's first chapter and stops at its
                  // last chapter's end. Same red part-header family as the Table
                  // of Contents page.
                  <button
                    type="button"
                    onClick={() => playPart(group)}
                    className="group w-full flex items-center gap-2 text-left mb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
                    title="Play this whole part in the video above"
                  >
                    <Play className="w-4 h-4 flex-shrink-0 text-civil-red-strong opacity-70 group-hover:opacity-100" aria-hidden="true" />
                    <span className="text-civil-red-strong font-semibold text-sm uppercase tracking-wide group-hover:underline" style={{ fontFamily: 'Chivo Mono, monospace' }}>
                      {group.title}
                    </span>
                    <span className="text-xs text-stone-400 font-normal normal-case">
                      Play Whole Part
                    </span>
                  </button>
                )}
                <ol className="space-y-3 list-none p-0">
                  {group.chapters.map((ch) => (
                    <li key={ch.chapter_number} className="border border-stone-200 rounded-md bg-white p-4">
                      <header className="flex items-baseline justify-between gap-3 mb-1">
                        <h3 className="text-base font-medium text-stone-900">
                          <span className="text-civil-red-body font-mono mr-2 text-sm">
                            {String(ch.chapter_number).padStart(2, '0')}
                          </span>
                          {ch.title}
                        </h3>
                        {ch.start_time ? (
                          <button
                            type="button"
                            onClick={() => playChapter(ch)}
                            className="text-xs text-civil-red-body hover:text-civil-red-strong tabular-nums whitespace-nowrap inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
                            title="Play this chapter in the video above"
                          >
                            <Play className="w-3 h-3" aria-hidden="true" />
                            {(ch.start_time || '').split(',')[0]}–{(ch.end_time || '').split(',')[0]}
                          </button>
                        ) : ch.end_time ? (
                          <span className="text-xs text-stone-500 tabular-nums whitespace-nowrap inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            –{(ch.end_time || '').split(',')[0]}
                          </span>
                        ) : null}
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
              </div>
            ))}
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
              Semantic Overlap
            </h2>
            <p className="text-sm text-stone-600 mb-4 max-w-2xl">
              These interviewees discuss thematically related material, surfaced by embedding-space proximity (cosine similarity over 1024-dim Voyage-3 vectors).
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
