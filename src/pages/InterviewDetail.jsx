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
 *
 * Deep links (sharing): the page is addressable down to a single chapter or
 * part. Each part and chapter carries a stable anchor id (#part-2, #chapter-5)
 * and a faint hashtag mark that copies a link to that exact section. Arriving
 * on such a link scrolls to the section and plays its bounded video segment.
 * A ?t=<seconds>[&end=<seconds>] form addresses an arbitrary moment (used by
 * snippet, citation, and playlist links, and by "copy link to this moment").
 * Browsing chapters also keeps the address-bar hash in step with playback, so
 * the URL alone is shareable even without using a mark.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Clock, FileText, Play, Hash, Check, Quote, MessageSquareQuote } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Footer from '../components/common/Footer';
import LocVideoEmbed from '../components/LocVideoEmbed';
import ShareButton from '../components/ShareButton';
import HearInContext, { tsToSeconds } from '../components/HearInContext';
import { convertTimestampToSeconds } from '../utils/timeUtils';
import { buildShareUrl, shareOrCopy } from '../utils/share';
import { TIER_BADGE, fidelityNoteFor } from '../components/rag/tiers';

/**
 * Parse a time query param: either whole seconds ("2078") or a colon-delimited
 * timestamp ("00:34:38", tolerating an SRT/VTT millisecond suffix). Returns 0
 * for anything missing or unparseable.
 */
function parseTimeParam(v) {
  if (v == null || v === '') return 0;
  const s = String(v);
  if (s.includes(':')) return convertTimestampToSeconds(s.split(/[.,]/)[0]);
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

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

/**
 * Render a catalog prose field (biography, AI's reading) that carries inline
 * `[src: N]` citation markers, turning each marker into a small superscript link
 * to the matching entry in the Sources list (#source-N) below. A marker whose
 * index has no matching source renders as faint plain text, so a stray ref never
 * breaks the paragraph. Mirrors PersonPage's renderBioWithCitationRefs, minus the
 * cross-person name hyperlinking (which is a PersonPage concern). Returns an
 * array of strings and JSX nodes suitable for inclusion in a paragraph.
 */
function renderProseWithCitationRefs(text, sources) {
  if (!text) return null;
  const parts = [];
  let last = 0;
  const re = /\[src:\s*(\d+)\]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const num = Number(m[1]);
    const sourceExists = sources && sources[num - 1];
    if (sourceExists) {
      parts.push(
        <sup key={`cite-${m.index}`} className="text-xs">
          <a
            href={`#source-${num}`}
            className="text-civil-red-body hover:underline focus:outline-none focus-visible:underline"
            aria-label={`Citation ${num}`}
          >
            [{num}]
          </a>
        </sup>
      );
    } else {
      parts.push(<span key={`cite-${m.index}`} className="text-xs text-stone-400">[{num}]</span>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/**
 * AnchorMark, the faint "#" hashtag mark beside a part header or chapter title.
 *
 * Rendered as a real anchor (href="#part-2") so the browser's own "copy link
 * address" works and the fragment is keyboard-reachable, but its click is
 * intercepted to do three things at once: copy the absolute deep-link to the
 * clipboard (or the share sheet on touch), reflect the fragment in the address
 * bar, and play that section's bounded video segment via onActivate. Flashes a
 * checkmark for ~1.6s after a copy.
 */
function AnchorMark({ fragment, targetPath, title, onActivate, className = '' }) {
  const [copied, setCopied] = useState(false);
  const handle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onActivate) onActivate();
    const res = await shareOrCopy({ url: buildShareUrl(`${targetPath}#${fragment}`), title });
    if (res === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };
  return (
    <a
      href={`#${fragment}`}
      onClick={handle}
      aria-label={copied ? 'Link copied' : `Copy link to ${title}`}
      title={copied ? 'Link copied' : `Copy link to ${title}`}
      className={`inline-flex items-center justify-center align-middle rounded text-stone-400 hover:text-civil-red-body focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 transition-colors ${className}`}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5" aria-hidden="true" />
      ) : (
        <Hash className="w-3.5 h-3.5" aria-hidden="true" />
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? 'Link copied' : ''}
      </span>
    </a>
  );
}

export default function InterviewDetail() {
  const { entryNumber } = useParams();
  const n = parseInt(entryNumber, 10);

  // Optional deep-link to a moment: ?t=2078 (seconds) or ?t=00:34:38, with an
  // optional &end= that bounds the clip. PersonPage / StaticPlaylist / citation
  // links pass raw seconds; a colon-delimited timestamp is accepted too so the
  // URL stays human-readable and shareable.
  const [searchParams] = useSearchParams();
  const startSeconds = parseTimeParam(searchParams.get('t'));
  const endSeconds = parseTimeParam(searchParams.get('end'));

  // The hero video holds an imperative handle so a chapter row can seek it
  // to that chapter's start and bound the clip to its end, without mounting
  // a second multi-hour video element. Clicking a chapter scrolls the hero
  // back into view and plays just that chapter.
  const heroRef = useRef(null);
  const heroWrapRef = useRef(null);
  // The section (chapter-<n> / part-<i>) to visually flag, cleared after a few
  // seconds. Set when a section is played or when the page is opened on a
  // section deep-link, so the reader sees which part/chapter the link points to.
  const [highlight, setHighlight] = useState(null);
  // Run the arrival jump (seek + scroll + highlight) exactly once per load.
  const didArriveRef = useRef(false);

  // Reflect the current section in the address bar without a router navigation
  // (no scroll jump, no history spam), so the URL alone stays shareable while
  // the reader browses chapters and parts. This is the fix for "the link stays
  // the same when browsing": the bar now tracks playback.
  const syncHash = (fragment) => {
    if (typeof window === 'undefined') return;
    try {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${fragment}`);
    } catch {
      /* history is unavailable in some embedded contexts; ignore */
    }
  };

  // Play one chapter in the hero: seek to its start, bound to its end, flag it,
  // and record the section in the URL. `scroll` brings the hero into view for a
  // click in the chapter list; the hashtag mark passes scroll:false so it does
  // not yank the reader away from the row they just shared.
  const goToChapter = (ch, { scroll } = { scroll: true }) => {
    const start = tsToSeconds(ch.start_time);
    const end = ch.end_time ? tsToSeconds(ch.end_time) : null;
    heroRef.current?.seek(start, { play: true, stopAt: end });
    setHighlight(`chapter-${ch.chapter_number}`);
    syncHash(`chapter-${ch.chapter_number}`);
    if (scroll) heroWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Play a whole part straight through: seek to the part's FIRST chapter start
  // and bound playback to the part's LAST chapter end. Same hero handle and the
  // same HH:MM:SS,mmm-to-seconds conversion goToChapter uses, so a part run and
  // a single chapter share one playback path (the player range-jumps to the
  // part and stops at its end, no whole-interview buffering).
  const goToPart = (group, gi, { scroll } = { scroll: true }) => {
    const list = group.chapters;
    if (!list || list.length === 0) return;
    const first = list[0];
    const lastWithEnd = [...list].reverse().find((c) => c.end_time);
    const start = tsToSeconds(first.start_time);
    const end = lastWithEnd ? tsToSeconds(lastWithEnd.end_time) : null;
    heroRef.current?.seek(start, { play: true, stopAt: end });
    setHighlight(`part-${gi + 1}`);
    syncHash(`part-${gi + 1}`);
    if (scroll) heroWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const [capsules, setCapsules] = useState(null);
  const [neighbors, setNeighbors] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [pipelineMissing, setPipelineMissing] = useState(false);
  const [error, setError] = useState(null);
  const [peopleIndex, setPeopleIndex] = useState(null);
  // The interviewee's catalog content (biography, AI's reading, verbatim
  // snippets, sources), fetched from /rag/people/<slug>.json and layered onto
  // this page. The /person/:slug page hard-redirects interviewees here, so this
  // is where that content now lives. Null until resolved; a failed fetch leaves
  // it null and the page renders unchanged (the catalog sections just omit).
  const [personPage, setPersonPage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // A fresh interview is a fresh arrival: re-arm the one-shot jump.
    didArriveRef.current = false;
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

  // Arrival jump: once the interview and its chapters have resolved, resolve a
  // target from the URL (a #chapter-/#part- fragment, else ?t/&end), then seek
  // and bound the hero, scroll the relevant section (or the hero) into view,
  // and flag the section. Runs once via didArriveRef so the later URL-sync
  // writes from browsing never re-trigger it.
  useEffect(() => {
    if (didArriveRef.current) return;
    if (!entry) return;
    if (!pipeline && !pipelineMissing) return; // wait until chapters are known

    const chapters = pipeline?.chapters || [];
    const partGroups = groupChaptersByPart(chapters);
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const chMatch = hash.match(/^#chapter-(\d+)$/);
    const partMatch = hash.match(/^#part-(\d+)$/);

    let target = null; // { start, end, scrollId, flag }
    if (chMatch) {
      const num = parseInt(chMatch[1], 10);
      const ch = chapters.find((c) => c.chapter_number === num);
      if (ch) {
        target = {
          start: tsToSeconds(ch.start_time),
          end: ch.end_time ? tsToSeconds(ch.end_time) : null,
          scrollId: `chapter-${num}`,
          flag: `chapter-${num}`,
        };
      }
    } else if (partMatch) {
      const idx = parseInt(partMatch[1], 10) - 1;
      const group = partGroups[idx];
      if (group && group.chapters.length) {
        const first = group.chapters[0];
        const lastWithEnd = [...group.chapters].reverse().find((c) => c.end_time);
        target = {
          start: tsToSeconds(first.start_time),
          end: lastWithEnd ? tsToSeconds(lastWithEnd.end_time) : null,
          scrollId: `part-${idx + 1}`,
          flag: `part-${idx + 1}`,
        };
      }
    } else if (startSeconds > 0) {
      target = {
        start: startSeconds,
        end: endSeconds > startSeconds ? endSeconds : null,
        scrollId: null,
        flag: null,
      };
    }

    didArriveRef.current = true;
    if (!target) return;

    // Seek and bound (best effort: a fresh navigation has no user gesture, so
    // the browser may hold autoplay; the clip is still cued to the right spot).
    heroRef.current?.seek(target.start, { play: true, stopAt: target.end });
    if (target.flag) setHighlight(target.flag);
    requestAnimationFrame(() => {
      const el = target.scrollId ? document.getElementById(target.scrollId) : heroWrapRef.current;
      el?.scrollIntoView({ behavior: 'smooth', block: target.scrollId ? 'center' : 'start' });
    });
    if (target.flag) setTimeout(() => setHighlight(null), 4000);
  }, [entry, pipeline, pipelineMissing, startSeconds, endSeconds]);

  // Layer the interviewee's catalog page onto this interview. Resolve the slug
  // via the people index (by_entry is keyed by entry number, and respects the
  // joint-page preference), then fetch /rag/people/<slug>.json defensively. A
  // missing index entry or a failed fetch simply leaves personPage null, so the
  // page renders exactly as it did before. The /person/:slug route redirects
  // interviewees back here, so this fetch is how that catalog content (bio,
  // AI's reading, verbatim snippets, sources) reaches the reader.
  useEffect(() => {
    const slug = peopleIndex?.by_entry?.[n]?.slug;
    if (!slug) {
      setPersonPage(null);
      return undefined;
    }
    let cancelled = false;
    fetch(`/rag/people/${slug}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((data) => { if (!cancelled) setPersonPage(data || null); });
    return () => { cancelled = true; };
  }, [peopleIndex, n]);

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
  const interviewTitle = `${entry.entry_subject}, oral history`;

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
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-2">
            <p className="text-civil-red-body text-sm font-light font-mono">
              Entry #{entry.entry_number}
            </p>
            <div className="flex items-center gap-3">
              {/* Share the whole interview. The chapter and part marks below
                  share a single section; this shares the page itself. */}
              <ShareButton
                variant="inline"
                label="Share"
                url={`/interview/${n}`}
                title={interviewTitle}
              />
              {/* The former "Full catalog page" link to /person/:slug was
                  removed (2026-06-02): the catalog page now redirects
                  interviewees back to this interview page, and its content
                  (biography, AI's reading, verbatim snippets, sources) is
                  layered onto this page below, so the link would only loop
                  back here. */}
            </div>
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
          {/* Orienting note (2026-06-02): one plain-language line under the
              title that tells the reader how the pieces of this page relate.
              Factual, no evaluative adjectives. */}
          <p
            className="text-sm text-stone-600 mt-4 max-w-3xl italic"
            style={{ fontFamily: 'Source Serif 4, serif' }}
          >
            This page is the home for this interview: the recording plays above and is broken into chapters below, followed by the interviewee&apos;s biography, archival quotes, and sources. Related interviews and topics are listed at the end, and any essays that draw on this testimony link back here.
          </p>
        </header>

        {/* Video hero. The Library of Congress serves the full interview
            as a streamable MP4 (range-request seekable), so the page
            leads with the recording itself. When the reader arrived via a
            snippet's "Open the full interview" link, startSeconds jumps
            the player to that moment and endSeconds bounds the clip.
            LocVideoEmbed fetches the loc_video block by entry number
            (cached), so its source stays stable regardless of when the
            rest of the pipeline output resolves. */}
        <div className="mb-2" ref={heroWrapRef}>
          <LocVideoEmbed
            ref={heroRef}
            entryNumber={n}
            startSeconds={startSeconds}
            endSeconds={endSeconds > startSeconds ? endSeconds : null}
            autoPlay={startSeconds > 0}
          />
        </div>

        {/* Grab a link to wherever the playhead is right now, the answer to
            "the URL does not change as I scrub": this reads the live position
            and builds a ?t= deep-link on click. */}
        <div className="mb-8 flex justify-end">
          <ShareButton
            variant="inline"
            label="Copy link to this moment"
            title={interviewTitle}
            getUrl={() => `/interview/${n}?t=${Math.round(heroRef.current?.getCurrentTime?.() || 0)}`}
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
                The faint <Hash className="w-3 h-3 inline-block align-text-bottom" aria-hidden="true" /> beside
                a part or chapter copies a link straight to it.
              </p>
            )}
            {partGroups.map((group, gi) => (
              <div key={gi} className={gi > 0 ? 'mt-6' : ''}>
                {group.title && (
                  // Red part header: the title is itself a "Play Whole Part"
                  // control (seeks the hero to this part's first chapter and
                  // stops at its last chapter's end), and the trailing hashtag
                  // mark copies a deep-link to this part. The id makes #part-N
                  // resolvable on arrival.
                  <div
                    id={`part-${gi + 1}`}
                    className={`group flex items-center gap-1.5 mb-2 rounded transition-shadow ${
                      highlight === `part-${gi + 1}` ? 'ring-2 ring-civil-red-strong ring-offset-2' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => goToPart(group, gi)}
                      className="flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
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
                    <AnchorMark
                      fragment={`part-${gi + 1}`}
                      targetPath={`/interview/${n}`}
                      title={`${group.title} (part)`}
                      onActivate={() => goToPart(group, gi, { scroll: false })}
                      className="p-1 opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
                    />
                  </div>
                )}
                <ol className="space-y-3 list-none p-0">
                  {group.chapters.map((ch) => (
                    <li
                      key={ch.chapter_number}
                      id={`chapter-${ch.chapter_number}`}
                      className={`group border rounded-md bg-white p-4 transition-shadow scroll-mt-24 ${
                        highlight === `chapter-${ch.chapter_number}`
                          ? 'border-civil-red-strong ring-2 ring-civil-red-strong ring-offset-2'
                          : 'border-stone-200'
                      }`}
                    >
                      <header className="flex items-baseline justify-between gap-3 mb-1">
                        <h3 className="text-base font-medium text-stone-900 flex items-baseline gap-1.5 min-w-0">
                          <span className="min-w-0">
                            <span className="text-civil-red-body font-mono mr-2 text-sm">
                              {String(ch.chapter_number).padStart(2, '0')}
                            </span>
                            {ch.title}
                          </span>
                          <AnchorMark
                            fragment={`chapter-${ch.chapter_number}`}
                            targetPath={`/interview/${n}`}
                            title={`${ch.title} (chapter)`}
                            onActivate={() => goToChapter(ch, { scroll: false })}
                            className="p-0.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                          />
                        </h3>
                        {ch.start_time ? (
                          <button
                            type="button"
                            onClick={() => goToChapter(ch)}
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

        {/* Interviewee catalog content (2026-06-02): the biography, the AI's
            reading, the verbatim oral-history snippets, and the sources, layered
            on from /rag/people/<slug>.json. The /person/:slug page redirects
            interviewees here, so this is where that content now lives. Each
            section renders only when its field is present; a missing catalog
            page leaves personPage null and none of this renders. */}
        {personPage && (
          <>
            {personPage.biographical_paragraph && (
              <section className="mb-10">
                <h2 className="text-stone-900 text-2xl font-medium mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  About {entry.entry_subject}
                </h2>
                <p
                  className="text-stone-800 text-base leading-relaxed"
                  style={{ fontFamily: 'Source Serif 4, serif' }}
                >
                  {renderProseWithCitationRefs(personPage.biographical_paragraph, personPage.sources)}
                </p>
              </section>
            )}

            {personPage.ai_reading && (
              <section className="mb-10">
                <h2 className="text-stone-900 text-xl font-medium mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  What the embedding finds
                </h2>
                <div className="border-l-4 border-civil-red-strong pl-5 py-1">
                  <p
                    className="text-stone-800 text-base leading-relaxed"
                    style={{ fontFamily: 'Source Serif 4, serif' }}
                  >
                    {renderProseWithCitationRefs(personPage.ai_reading, personPage.sources)}
                  </p>
                </div>
              </section>
            )}

            {Array.isArray(personPage.interview_snippets) && personPage.interview_snippets.length > 0 && (
              <section className="mb-10">
                <h2 className="text-stone-900 text-2xl font-medium mb-3 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <MessageSquareQuote className="w-6 h-6 text-civil-red-strong" aria-hidden="true" />
                  Voices from the Archive
                </h2>
                <p className="text-sm text-stone-600 mb-4 max-w-2xl">
                  Quoted verbatim from the Civil Rights History Project oral histories, each gated against the corpus transcript it came from. Play any clip to hear it in the recording above.
                </p>
                <div className="space-y-6">
                  {personPage.interview_snippets.map((sn, i) => {
                    if (!sn || !sn.quote) return null;
                    const startSec = tsToSeconds(sn.timestamp);
                    const endSec = sn.end_timestamp ? tsToSeconds(sn.end_timestamp) : null;
                    const isAbout = sn.relation === 'about';
                    return (
                      <figure
                        key={i}
                        className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 border-l-[6px] border-l-civil-red-strong"
                      >
                        {sn.lead_in && (
                          <p className="text-sm text-stone-600 mb-3 leading-snug">{sn.lead_in}</p>
                        )}
                        <div className="flex items-start gap-3">
                          <Quote className="w-7 h-7 shrink-0 mt-1 text-civil-red-strong" aria-hidden="true" />
                          <blockquote
                            className="text-stone-900 text-lg sm:text-xl leading-relaxed"
                            style={{ fontFamily: 'Source Serif 4, serif' }}
                          >
                            &ldquo;{sn.quote}&rdquo;
                          </blockquote>
                        </div>
                        <figcaption className="mt-4 sm:pl-10 text-sm">
                          <div className="text-stone-900">
                            <span className="font-semibold">{sn.speaker}</span>
                            {isAbout && (
                              <span className="font-normal text-stone-500"> on {entry.entry_subject}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-stone-600">
                            {sn.timestamp && (
                              <span className="inline-flex items-center gap-1 tabular-nums">
                                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                                {sn.timestamp}
                              </span>
                            )}
                            {sn.source_entry != null && (
                              <HearInContext
                                entryNumber={sn.source_entry}
                                startSeconds={startSec}
                                endSeconds={endSec}
                                fullInterviewHref={`/interview/${sn.source_entry}?t=${startSec}`}
                                defaultOpen
                              />
                            )}
                            {sn.loc_url && (
                              <span className="inline-flex items-center gap-1 font-semibold text-stone-600">
                                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                                Library of Congress
                              </span>
                            )}
                          </div>
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </section>
            )}

            {Array.isArray(personPage.sources) && personPage.sources.length > 0 && (
              <section className="mb-10 border-t border-stone-300 pt-6">
                <h2 className="text-stone-900 text-xl font-medium mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Sources
                </h2>
                <ol className="text-sm space-y-2 list-decimal pl-5">
                  {personPage.sources.map((s, i) => (
                    <li key={i} id={`source-${i + 1}`} className="text-stone-800">
                      <span className="text-stone-900">{s.title}</span>
                      {s.publisher && (
                        <span className="text-stone-500 ml-1">({s.publisher})</span>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </>
        )}

        {entry.neighbors && entry.neighbors.length > 0 && (
          <section className="mb-10">
            <h2 className="text-stone-900 text-xl font-medium mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              Related Topics
            </h2>
            <p className="text-sm text-stone-600 mb-4 max-w-2xl">
              Other interviewees whose testimony returns to the same themes, surfaced by comparing the interviews in the embedding space.
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
