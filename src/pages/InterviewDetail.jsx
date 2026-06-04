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
 * Layout (Dustin, 2026-06-02 afternoon): the video is the focal point. The top
 * of the page is only the interview title, the verification badge, and the
 * player. Everything textual moves below the video into collapsible accordions
 * (Overview, Historical Significance, the interviewee's biography, the AI's
 * reading, the archival quotes, Related People), with the Sources list kept
 * visible at the foot so the in-prose citation anchors always resolve. Chapter
 * navigation sits right under the video: parts are the prominent, scannable
 * sections shown by default with their time ranges, their chapters are revealed
 * on expand, and the whole chapter card is clickable to play that chapter.
 *
 * Deep links (sharing): the page is addressable down to a single chapter or
 * part. Each part and chapter carries a stable anchor id (#part-2, #chapter-5)
 * and a faint hashtag mark that copies a link to that exact section. Arriving
 * on such a link opens the containing part, scrolls to the section, and plays
 * its bounded video segment. A ?t=<seconds>[&end=<seconds>] form addresses an
 * arbitrary moment (used by snippet, citation, and playlist links, and by "copy
 * link to this moment"). Browsing chapters also keeps the address-bar hash in
 * step with playback, so the URL alone is shareable even without using a mark.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronRight, Clock, FileText, Play, Hash, Check, Quote } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Footer from '../components/common/Footer';
import LocVideoEmbed from '../components/LocVideoEmbed';
import ShareButton from '../components/ShareButton';
import ClipCountdown from '../components/ClipCountdown';
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

/** Strip an SRT/VTT millisecond suffix from a timestamp for display ("HH:MM:SS,mmm" -> "HH:MM:SS"). */
function clockOf(ts) {
  return (ts || '').split(',')[0];
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
 * checkmark for ~1.6s after a copy. Stops propagation so it can sit on top of a
 * clickable chapter card without also triggering the card's play action.
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

/**
 * Disclosure, one collapsible accordion for a descriptive section below the
 * video. The header is a real button (aria-expanded) with a rotating chevron;
 * the panel mounts only when open, so the heavy bits (clip players inside
 * Voices) do not load until the reader opens that section.
 */
function Disclosure({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mb-3 border border-stone-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 overflow-hidden">
      <h2 className="m-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        >
          <span
            className="text-stone-900 dark:text-stone-100 text-lg sm:text-xl font-medium"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {title}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-stone-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </h2>
      {open && <div className="px-4 sm:px-5 pb-5 pt-1">{children}</div>}
    </section>
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
  // Which part indices are expanded (their chapters revealed). Parts are
  // collapsed by default so the section list reads as a scannable outline; the
  // arrival jump opens the part that holds a deep-linked chapter or part.
  const [openParts, setOpenParts] = useState(() => new Set());
  // Run the arrival jump (seek + scroll + highlight) exactly once per load.
  const didArriveRef = useRef(false);
  // The snippet currently bounded in the hero (a played chapter/part, or an
  // arrival ?t&end), as { start, end, duration, label }, plus its clip-relative
  // playback fraction (0..1). These drive the "time left in this clip" countdown
  // ring under the video. Null when the full, unbounded interview is playing
  // (there is no snippet to count down). See the polling effect below.
  const [activeClip, setActiveClip] = useState(null);
  const [clipProgress, setClipProgress] = useState(0);

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

  const togglePart = (gi) =>
    setOpenParts((prev) => {
      const s = new Set(prev);
      if (s.has(gi)) s.delete(gi);
      else s.add(gi);
      return s;
    });

  // Play one chapter in the hero: seek to its start, bound to its end, flag it,
  // and record the section in the URL. `scroll` brings the hero into view for a
  // click in the chapter list; the hashtag mark passes scroll:false so it does
  // not yank the reader away from the row they just shared.
  const goToChapter = (ch, { scroll } = { scroll: true }) => {
    const start = tsToSeconds(ch.start_time);
    const end = ch.end_time ? tsToSeconds(ch.end_time) : null;
    heroRef.current?.seek(start, { play: true, stopAt: end });
    setActiveClip(end != null && end > start ? { start, end, duration: end - start, label: ch.title } : null);
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
    setActiveClip(end != null && end > start ? { start, end, duration: end - start, label: group.title || 'This part' } : null);
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
    // A fresh interview is a fresh arrival: re-arm the one-shot jump and reset
    // which parts are open so the new page starts with its outline collapsed.
    didArriveRef.current = false;
    setOpenParts(new Set());
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
  // target from the URL (a #chapter-/#part- fragment, else ?t/&end), then open
  // the part that holds it, seek and bound the hero, scroll the relevant section
  // (or the hero) into view, and flag the section. Runs once via didArriveRef so
  // the later URL-sync writes from browsing never re-trigger it.
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
    let openPartIdx = null;
    if (chMatch) {
      const num = parseInt(chMatch[1], 10);
      const ch = chapters.find((c) => c.chapter_number === num);
      if (ch) {
        target = {
          start: tsToSeconds(ch.start_time),
          end: ch.end_time ? tsToSeconds(ch.end_time) : null,
          scrollId: `chapter-${num}`,
          flag: `chapter-${num}`,
          label: ch.title,
        };
        openPartIdx = partGroups.findIndex((g) =>
          g.chapters.some((c) => c.chapter_number === num),
        );
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
          label: group.title || 'This part',
        };
        openPartIdx = idx;
      }
    } else if (startSeconds > 0) {
      target = {
        start: startSeconds,
        end: endSeconds > startSeconds ? endSeconds : null,
        scrollId: null,
        flag: null,
        label: 'Selected clip',
      };
    }

    didArriveRef.current = true;
    if (!target) return;

    // Open the part that holds the target so its chapter is in the DOM to scroll
    // to (parts are collapsed by default).
    if (openPartIdx != null && openPartIdx >= 0) {
      setOpenParts((prev) => {
        const s = new Set(prev);
        s.add(openPartIdx);
        return s;
      });
    }

    // Seek and bound (best effort: a fresh navigation has no user gesture, so
    // the browser may hold autoplay; the clip is still cued to the right spot).
    heroRef.current?.seek(target.start, { play: true, stopAt: target.end });
    if (target.end != null && target.end > target.start) {
      setActiveClip({
        start: target.start,
        end: target.end,
        duration: target.end - target.start,
        label: target.label || 'Selected clip',
      });
    }
    if (target.flag) setHighlight(target.flag);
    // Defer the scroll so a just-opened part has rendered its chapters.
    setTimeout(() => {
      const el = target.scrollId ? document.getElementById(target.scrollId) : heroWrapRef.current;
      el?.scrollIntoView({ behavior: 'smooth', block: target.scrollId ? 'center' : 'start' });
    }, 80);
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

  // Drive the countdown ring while a bounded snippet is active. The hero is one
  // long-lived element played imperatively, so its onProgress prop tracks the
  // page-level ?t/&end bound, not a clicked chapter; reading getCurrentTime
  // against the active clip's own start/end is the reliable feed. A light 500ms
  // poll (reading one property) is plenty for a seconds countdown and adds no
  // media listener. Clears when no snippet is active.
  useEffect(() => {
    if (!activeClip || !(activeClip.duration > 0)) {
      setClipProgress(0);
      return undefined;
    }
    const tick = () => {
      const now = heroRef.current?.getCurrentTime?.() ?? 0;
      let frac = (now - activeClip.start) / activeClip.duration;
      if (!Number.isFinite(frac) || frac < 0) frac = 0;
      else if (frac > 1) frac = 1;
      setClipProgress(frac);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [activeClip]);

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

  // Group the flat chapters into parts. On un-migrated interviews this is a
  // single untitled group, which renders flat (and always expanded) exactly as
  // before, since there is no section header to collapse under.
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

        {/* Top of page: only the title, the verification badge, and the video
            (Dustin, 2026-06-02 afternoon). A small entry label and the page
            Share control are the only chrome; everything descriptive is below. */}
        <header className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-2">
            <p className="text-civil-red-body text-sm font-light font-mono">
              Entry #{entry.entry_number}
            </p>
            <ShareButton
              variant="inline"
              label="Share"
              url={`/interview/${n}`}
              title={interviewTitle}
            />
          </div>
          <h1
            className="text-stone-900 dark:text-stone-100 text-3xl sm:text-4xl md:text-5xl font-medium mb-3"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {entry.entry_subject}
          </h1>
          {tierBadge && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border ${tierBadge.bg} ${tierBadge.border} ${tierBadge.text}`}>
              {tierBadge.label}
            </span>
          )}
        </header>

        {/* Video hero. The Library of Congress serves the full interview as a
            streamable MP4 (range-request seekable), so the page leads with the
            recording itself. When the reader arrived via a snippet's "Open the
            full interview" link, startSeconds jumps the player to that moment and
            endSeconds bounds the clip. LocVideoEmbed fetches the loc_video block
            by entry number (cached), so its source stays stable regardless of
            when the rest of the pipeline output resolves. */}
        <div className="mb-2" ref={heroWrapRef}>
          <LocVideoEmbed
            ref={heroRef}
            entryNumber={n}
            startSeconds={startSeconds}
            endSeconds={endSeconds > startSeconds ? endSeconds : null}
            autoPlay={startSeconds > 0}
            overlay={
              activeClip && activeClip.duration > 0 ? (
                <ClipCountdown
                  progress={clipProgress}
                  durationSeconds={activeClip.duration}
                  size={56}
                  onDark
                />
              ) : null
            }
          />
        </div>

        {/* Grab a link to wherever the playhead is right now, the answer to
            "the URL does not change as I scrub": this reads the live position
            and builds a ?t= deep-link on click. */}
        <div className="mb-4 flex justify-end">
          <ShareButton
            variant="inline"
            label="Copy link to this moment"
            title={interviewTitle}
            getUrl={() => `/interview/${n}?t=${Math.round(heroRef.current?.getCurrentTime?.() || 0)}`}
          />
        </div>

        {/* A one-line orientation under the video (capsule + fidelity note),
            moved down from the header so the top stays title, badge, video. */}
        {capsule && (
          <p
            className="text-stone-800 dark:text-stone-200 text-lg max-w-3xl italic"
            style={{ fontFamily: 'Source Serif 4, serif' }}
          >
            {capsule}
          </p>
        )}
        <p className="text-xs text-stone-500 mt-2 mb-8">{fidelity}</p>

        {/* Chapter navigation: parts are the prominent sections, shown by
            default with their time ranges; their chapters are revealed on
            expand; the whole chapter card is clickable to play that chapter. */}
        {chapters.length > 0 && (
          <section className="mb-10">
            <h2 className="text-stone-900 dark:text-stone-100 text-2xl font-medium mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Chapters ({chapters.length})
            </h2>
            {hasTitledPart && (
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 max-w-2xl">
                The interview is grouped into parts. Open a part to see its chapters and
                click any chapter to play it in the video above, or use a part&apos;s Play
                button to listen to the whole part straight through. The faint{' '}
                <Hash className="w-3 h-3 inline-block align-text-bottom" aria-hidden="true" /> beside
                a part or chapter copies a link straight to it.
              </p>
            )}
            {partGroups.map((group, gi) => {
              const isOpen = group.title ? openParts.has(gi) : true;
              const partStart = clockOf(group.chapters[0]?.start_time);
              const lastWithEnd = [...group.chapters].reverse().find((c) => c.end_time);
              const partEnd = clockOf(lastWithEnd?.end_time);
              const partRange = partStart && partEnd ? `${partStart}–${partEnd}` : partStart;
              return (
                <div
                  key={gi}
                  id={`part-${gi + 1}`}
                  className={`scroll-mt-24 ${gi > 0 ? 'mt-5' : ''} ${
                    highlight === `part-${gi + 1}` ? 'rounded-md ring-2 ring-civil-red-strong ring-offset-2' : ''
                  }`}
                >
                  {group.title && (
                    // Prominent, scannable part header. Clicking it expands the
                    // part (reveals its chapters); the Play button plays the
                    // whole part; the time range and a deep-link mark sit inline.
                    <div className="group flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => togglePart(gi)}
                        aria-expanded={isOpen}
                        className="flex-1 min-w-0 flex items-center gap-3 px-3 py-3 text-left rounded-md hover:bg-white dark:hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      >
                        <ChevronRight
                          className={`w-5 h-5 shrink-0 text-civil-red-strong transition-transform ${isOpen ? 'rotate-90' : ''}`}
                          aria-hidden="true"
                        />
                        <span
                          className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-100 truncate"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {group.title}
                        </span>
                        {partRange && (
                          <span className="ml-auto shrink-0 text-xs sm:text-sm text-stone-500 tabular-nums">
                            {partRange}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => goToPart(group, gi)}
                        className="shrink-0 inline-flex items-center gap-1.5 min-h-11 px-3 py-2 text-sm rounded-md border border-stone-300 bg-white dark:bg-zinc-800 dark:border-zinc-600 text-civil-red-body hover:border-civil-red-strong hover:bg-red-50 dark:hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                        title="Play this whole part in the video above"
                      >
                        <Play className="w-4 h-4" aria-hidden="true" /> Play
                      </button>
                      <AnchorMark
                        fragment={`part-${gi + 1}`}
                        targetPath={`/interview/${n}`}
                        title={`${group.title} (part)`}
                        onActivate={() => goToPart(group, gi, { scroll: false })}
                        className="shrink-0 p-1 opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
                      />
                    </div>
                  )}
                  {isOpen && (
                    <ol className={`space-y-3 list-none p-0 ${group.title ? 'mt-3 sm:pl-8' : ''}`}>
                      {group.chapters.map((ch) => (
                        <li
                          key={ch.chapter_number}
                          id={`chapter-${ch.chapter_number}`}
                          className="relative group scroll-mt-24"
                        >
                          {/* The whole card is the play control (Dustin,
                              2026-06-02 afternoon): a click anywhere seeks the
                              video to this chapter. The deep-link mark sits on
                              top as a sibling so it copies a link without
                              triggering playback. */}
                          <button
                            type="button"
                            onClick={() => goToChapter(ch)}
                            title="Play this chapter in the video above"
                            className={`w-full text-left border rounded-md bg-white dark:bg-zinc-800 p-4 pr-10 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 ${
                              highlight === `chapter-${ch.chapter_number}`
                                ? 'border-civil-red-strong ring-2 ring-civil-red-strong ring-offset-2'
                                : 'border-stone-200 dark:border-zinc-700 hover:border-civil-red-strong'
                            }`}
                          >
                            <div className="flex items-baseline justify-between gap-3 mb-1">
                              <div className="text-base font-medium text-stone-900 dark:text-stone-100 min-w-0 flex items-baseline gap-2">
                                <span className="text-civil-red-body font-mono text-sm shrink-0">
                                  {String(ch.chapter_number).padStart(2, '0')}
                                </span>
                                <span className="min-w-0">{ch.title}</span>
                              </div>
                              {(ch.start_time || ch.end_time) && (
                                <span className="text-xs text-civil-red-body tabular-nums whitespace-nowrap inline-flex items-center gap-1 shrink-0">
                                  <Play className="w-3 h-3" aria-hidden="true" />
                                  {clockOf(ch.start_time)}
                                  {ch.end_time ? `–${clockOf(ch.end_time)}` : ''}
                                </span>
                              )}
                            </div>
                            {ch.main_topic_category && (
                              <p className="text-xs text-stone-500 uppercase tracking-wide mb-2 ml-8">
                                {ch.main_topic_category}
                              </p>
                            )}
                            {ch.summary && (
                              <p className="text-sm text-stone-700 dark:text-stone-300 ml-8" style={{ fontFamily: 'Source Serif 4, serif' }}>
                                {ch.summary}
                              </p>
                            )}
                            {ch.keywords && (
                              <p className="text-xs text-stone-500 mt-2 ml-8">
                                <span className="uppercase tracking-wide">Keywords:</span>{' '}
                                {Array.isArray(ch.keywords) ? ch.keywords.join(', ') : ch.keywords}
                              </p>
                            )}
                          </button>
                          <AnchorMark
                            fragment={`chapter-${ch.chapter_number}`}
                            targetPath={`/interview/${n}`}
                            title={`${ch.title} (chapter)`}
                            onActivate={() => goToChapter(ch, { scroll: false })}
                            className="absolute top-3 right-2 p-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                          />
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {pipelineMissing && (
          <section className="mb-10 p-4 border border-stone-200 rounded-md bg-white">
            <p className="text-sm text-stone-600">
              Chapter breakdown and overview are still being generated for this interview. The Library of Congress catalog page has the canonical published transcript.
            </p>
          </section>
        )}

        {/* Descriptive text in collapsible accordions (Dustin, 2026-06-02
            afternoon). Each accordion renders only when its data is present.
            The Sources list stays visible at the foot so the in-prose [N]
            citation anchors always resolve, even with the prose collapsed. */}
        <div className="mt-2">
          {(main?.summary || themes.length > 0) && (
            <Disclosure title="Overview" defaultOpen>
              {main?.summary && (
                <p
                  className="text-stone-800 dark:text-stone-200 text-base leading-relaxed"
                  style={{ fontFamily: 'Source Serif 4, serif' }}
                >
                  {main.summary}
                </p>
              )}
              {themes.length > 0 && (
                <div className={main?.summary ? 'mt-4' : ''}>
                  <p className="text-xs uppercase tracking-wide text-stone-500 mb-2">Key Themes</p>
                  <ul className="flex flex-wrap gap-2 list-none p-0">
                    {themes.map((t, i) => (
                      <li key={i} className="px-3 py-1 bg-stone-50 dark:bg-zinc-700 border border-stone-200 dark:border-zinc-600 rounded-full text-sm text-stone-700 dark:text-stone-200">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Disclosure>
          )}

          {main?.historical_significance && (
            <Disclosure title="Historical Significance">
              <p
                className="text-stone-800 dark:text-stone-200 leading-relaxed"
                style={{ fontFamily: 'Source Serif 4, serif' }}
              >
                {main.historical_significance}
              </p>
            </Disclosure>
          )}

          {personPage?.biographical_paragraph && (
            <Disclosure title={`About ${entry.entry_subject}`}>
              <p
                className="text-stone-800 dark:text-stone-200 text-base leading-relaxed"
                style={{ fontFamily: 'Source Serif 4, serif' }}
              >
                {renderProseWithCitationRefs(personPage.biographical_paragraph, personPage.sources)}
              </p>
            </Disclosure>
          )}

          {personPage?.ai_reading && (
            <Disclosure title="What the Embedding Finds">
              <div className="border-l-4 border-civil-red-strong pl-5 py-1">
                <p
                  className="text-stone-800 dark:text-stone-200 text-base leading-relaxed"
                  style={{ fontFamily: 'Source Serif 4, serif' }}
                >
                  {renderProseWithCitationRefs(personPage.ai_reading, personPage.sources)}
                </p>
              </div>
            </Disclosure>
          )}

          {Array.isArray(personPage?.interview_snippets) && personPage.interview_snippets.length > 0 && (
            <Disclosure title="Voices from the Archive">
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 max-w-2xl">
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
            </Disclosure>
          )}

          {entry.neighbors && entry.neighbors.length > 0 && (
            <Disclosure title="Related People">
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 max-w-2xl">
                Other interviewees whose testimony returns to the same themes, surfaced by comparing the interviews in the embedding space.
              </p>
              <ul className="space-y-2 list-none p-0">
                {entry.neighbors.map((nb) => {
                  const nbTierKey = nb.tier in TIER_BADGE ? nb.tier : null;
                  const nbBadge = nbTierKey ? TIER_BADGE[nbTierKey] : null;
                  return (
                    <li key={nb.entry_number} className="flex items-center justify-between gap-3 p-3 border border-stone-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800">
                      <Link
                        to={`/interview/${nb.entry_number}`}
                        className="text-stone-900 dark:text-stone-100 hover:text-civil-red-body font-medium"
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
            </Disclosure>
          )}
        </div>

        {/* Sources kept visible (not collapsed) so the [N] citation anchors in
            the biography and the AI's reading above always resolve. */}
        {Array.isArray(personPage?.sources) && personPage.sources.length > 0 && (
          <section className="mt-8 border-t border-stone-300 dark:border-zinc-700 pt-6">
            <h2 className="text-stone-900 dark:text-stone-100 text-xl font-medium mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              Sources
            </h2>
            <ol className="text-sm space-y-2 list-decimal pl-5">
              {personPage.sources.map((s, i) => (
                <li key={i} id={`source-${i + 1}`} className="text-stone-800 dark:text-stone-200">
                  <span className="text-stone-900 dark:text-stone-100">{s.title}</span>
                  {s.publisher && (
                    <span className="text-stone-500 ml-1">({s.publisher})</span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
