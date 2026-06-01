import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Printer, Film, User, Info, BookOpen } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import LocVideoEmbed from '../components/LocVideoEmbed';

// Format seconds as M:SS or H:MM:SS for the print-only clip citation. In print
// the playable LocVideoEmbed is hidden (a video box is dead on paper), so a
// teacher gets a timestamped reference to the interview instead.
function fmtClock(s) {
  if (s == null || !isFinite(s)) return '';
  const t = Math.max(0, Math.round(s));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return (h > 0 ? `${h}:` : '') + `${mm}:${String(sec).padStart(2, '0')}`;
}

// Per-grade quantity ramps: higher grades get MORE, so the climb is visible
// rather than lateral. Discussion questions equal the grade number (K and 1
// get one, grade 12 gets twelve); vocabulary and objectives ramp up more
// gently. The band supplies an ordered foundational-to-advanced pool; the
// grade slices how many of it the student sees, and how far up the difficulty.
const qCount = (g) => Math.max(1, g);
const vCount = (g) => Math.min(10, Math.max(3, 3 + Math.floor(g / 2)));
const oCount = (g) => Math.min(6, Math.max(2, 2 + Math.floor(g / 3)));
const headFirst = (arr, n) => (Array.isArray(arr) ? arr.slice(0, Math.max(0, n)) : []);

/**
 * Curriculum, the /curriculum page: the grade-leveled curriculum generator.
 *
 * A teacher slides to a grade (K through 12) and the page assembles a
 * grade-leveled lesson unit out of the archive's primary-source oral
 * histories. The unit is one JSON document authored in parallel
 * (public/rag/curriculum/youth-and-student-activism.json) that splits
 * into two layers:
 *
 *   - bands[]: four grade BANDS (K-2, 3-5, 6-8, 9-12). Each band holds the
 *     shared core of the lesson at that span: objectives, materials (clips +
 *     person cards), activities, discussion questions, an assessment, an
 *     age-appropriateness content note, and standards.
 *   - grade_tuning{}: one entry PER grade ("0".."12") that tunes the band core
 *     to a single grade: reading level, essential question, and a scaffolding
 *     line. The grade ALSO scales QUANTITY by slicing the band's ordered pools
 *     (discussion questions equal the grade number; vocabulary and objectives
 *     ramp up too), so higher grades carry more, ordered foundational to
 *     advanced, and the climb is visible even inside one band.
 *
 * The page renders the MERGE of band core + grade tuning for the selected
 * grade. Clip materials play as bounded LoC segments via LocVideoEmbed (seek to
 * start, pause at end, fetch only the clip's bytes), the same component the
 * Table of Contents uses. The selected grade is mirrored into ?grade=N so a
 * teacher can share a specific grade's view.
 *
 * Built defensively: the data file is authored in parallel and may be absent.
 * A missing or malformed file shows a calm loading / unavailable state rather
 * than throwing, and any individual field that a band or tuning entry omits is
 * skipped, not assumed.
 */

const DATA_URL = '/rag/curriculum/youth-and-student-activism.json';
const DEFAULT_GRADE = 5;
const GRADE_MIN = 0;
const GRADE_MAX = 12;

// "Kindergarten", "Grade 1", ... for a numeric grade. Grade 0 is K.
function gradeLabel(g) {
  if (g === 0) return 'Kindergarten';
  return `Grade ${g}`;
}

// Short tick label for the slider ticks: "K", "1", ... "12".
function gradeTick(g) {
  return g === 0 ? 'K' : String(g);
}

// Resolve the band whose grades[] contains G. Falls back to a band whose
// label/grade range brackets G if grades[] is missing, then to null.
function bandForGrade(bands, g) {
  if (!Array.isArray(bands)) return null;
  const byList = bands.find(
    (b) => Array.isArray(b.grades) && b.grades.includes(g),
  );
  if (byList) return byList;
  // Fallback: some authoring passes may give a "band" range string ("K-2")
  // without an explicit grades[] array. Parse it leniently.
  return (
    bands.find((b) => {
      const m = String(b.band || '').match(/^(K|\d+)\s*[-–]\s*(\d+)$/i);
      if (!m) return false;
      const lo = /k/i.test(m[1]) ? 0 : Number(m[1]);
      const hi = Number(m[2]);
      return g >= lo && g <= hi;
    }) || null
  );
}

// Clamp + integer-coerce a grade candidate from the URL or slider.
function normalizeGrade(value, fallback) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(GRADE_MAX, Math.max(GRADE_MIN, n));
}

const GRADES = Array.from(
  { length: GRADE_MAX - GRADE_MIN + 1 },
  (_, i) => GRADE_MIN + i,
);

// Small section heading shared across the lesson body. Title Case is the
// caller's responsibility for any dynamic text; these literals are fixed.
function SectionHeading({ children }) {
  return (
    <h3
      className="text-stone-900 dark:text-stone-100 text-lg sm:text-xl font-semibold mt-8 mb-3"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {children}
    </h3>
  );
}

export default function Curriculum() {
  useDocumentTitle('Curriculum');
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  // Click-to-play: which clip's player is mounted. Only one mounts at a time,
  // and only on an explicit click, so no clip ever buffers (or plays audio) in
  // the background. Cleared when the grade changes (band materials swap).
  const [playingKey, setPlayingKey] = useState(null);

  // Selected grade: seeded from ?grade= (clamped) on first render, default 5.
  const [grade, setGrade] = useState(() =>
    normalizeGrade(searchParams.get('grade'), DEFAULT_GRADE),
  );

  // Load the unit. Absence or a malformed shape is an "unavailable" state, not
  // an error throw, so the page degrades gracefully while the data is authored.
  useEffect(() => {
    let cancelled = false;
    fetch(DATA_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled) return;
        if (json && Array.isArray(json.bands) && json.bands.length > 0) {
          setData(json);
          setStatus('ready');
        } else {
          setStatus('unavailable');
        }
      })
      .catch(() => !cancelled && setStatus('unavailable'));
    return () => {
      cancelled = true;
    };
  }, []);

  // Mirror the selected grade into the URL (?grade=N) without stacking history
  // entries, so the slider stays shareable and back/forward is not polluted.
  useEffect(() => {
    const current = searchParams.get('grade');
    if (current === String(grade)) return;
    const next = new URLSearchParams(searchParams);
    next.set('grade', String(grade));
    setSearchParams(next, { replace: true });
  }, [grade, searchParams, setSearchParams]);

  // Changing grade swaps the band's materials, so unmount any playing clip.
  useEffect(() => {
    setPlayingKey(null);
  }, [grade]);

  const band = useMemo(
    () => (data ? bandForGrade(data.bands, grade) : null),
    [data, grade],
  );
  const tuning = useMemo(
    () => (data && data.grade_tuning ? data.grade_tuning[String(grade)] : null),
    [data, grade],
  );

  // Essential question prefers the per-grade tuning, falls back to the band.
  const essentialQuestion =
    (tuning && tuning.essential_question) ||
    (band && band.essential_question) ||
    null;

  return (
    <div className="min-h-screen bg-[#EBEAE9] dark:bg-zinc-900">
      <main
        id="main-content"
        tabIndex={-1}
        className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 focus:outline-none"
      >
        {/* Unit header. Title + subtitle + overview come from the data when
            present; a stable fallback title keeps the page legible while the
            unit is still being authored. */}
        <header className="mb-6">
          <p
            className="text-civil-red-body dark:text-red-400 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2"
            style={{ fontFamily: 'Chivo Mono, monospace' }}
          >
            Civil Rights History Project · Curriculum
          </p>
          <h1
            className="text-stone-900 dark:text-stone-100 text-3xl sm:text-4xl font-medium mb-2 leading-tight"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {data?.title || 'Youth and Student Activism'}
          </h1>
          {data?.subtitle && (
            <p
              className="text-stone-700 dark:text-stone-300 text-base sm:text-lg max-w-3xl mb-3"
              style={{ fontFamily: 'Source Serif 4, serif' }}
            >
              {data.subtitle}
            </p>
          )}
          {data?.overview && (
            <p
              className="text-stone-700 dark:text-stone-300 text-base max-w-3xl leading-relaxed"
              style={{ fontFamily: 'Source Serif 4, serif' }}
            >
              {data.overview}
            </p>
          )}
          <p className="mt-4 text-sm text-stone-500 dark:text-stone-400 max-w-3xl leading-relaxed">
            This is an AI-assisted, educator-reviewed lesson built from
            primary-source oral histories in the Civil Rights History Project
            archive. Review each clip and adapt the plan for your classroom
            before teaching.
          </p>
        </header>

        {status === 'loading' && (
          <div className="py-16 flex justify-center" role="status">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civil-red-strong" />
            <span className="sr-only">Loading the lesson unit</span>
          </div>
        )}

        {status === 'unavailable' && (
          <div className="py-12 max-w-3xl">
            <div className="rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5">
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                This lesson unit is being prepared and is not available yet.
                Please check back soon. When it is ready, you will be able to
                slide to any grade from Kindergarten through Grade 12 and see a
                grade-leveled plan built from the archive.
              </p>
            </div>
          </div>
        )}

        {status === 'ready' && (
          <>
            {/* GRADE SLIDER. The whole control hides on print (the printed
                lesson is for one chosen grade, so the picker is noise on
                paper). The live label and band sit above the track; clickable
                ticks below make it obvious every grade is selectable. */}
            <section
              className="print:hidden mb-8 rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5 sm:p-6"
              aria-labelledby="grade-picker-heading"
            >
              <h2
                id="grade-picker-heading"
                className="text-stone-900 dark:text-stone-100 text-base font-semibold mb-1"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Choose a Grade
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
                Slide or tap a grade to rebuild the lesson at that level.
              </p>

              {/* Live readout: selected grade + the band it falls in. */}
              <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span
                  className="text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-100"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {gradeLabel(grade)}
                </span>
                {band && (
                  <span
                    className="text-sm font-medium text-civil-red-body dark:text-red-400"
                    style={{ fontFamily: 'Chivo Mono, monospace' }}
                  >
                    {gradeLabel(grade)}
                    {band.label ? ` / ${band.label}` : band.band ? ` / ${band.band}` : ''}
                  </span>
                )}
              </div>

              <input
                type="range"
                min={GRADE_MIN}
                max={GRADE_MAX}
                step={1}
                value={grade}
                onChange={(e) => setGrade(normalizeGrade(e.target.value, grade))}
                aria-label="Select a grade from Kindergarten to Grade 12"
                aria-valuetext={gradeLabel(grade)}
                className="w-full accent-red-600 cursor-pointer"
              />

              {/* Clickable ticks. Each is a real button so every grade is
                  obviously reachable by click and by keyboard, not only by
                  dragging the thumb. The active grade is filled red. */}
              <div className="mt-3 flex justify-between gap-0.5">
                {GRADES.map((g) => {
                  const active = g === grade;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGrade(g)}
                      aria-pressed={active}
                      aria-label={gradeLabel(g)}
                      className={
                        'flex-1 min-w-0 min-h-9 px-0.5 py-1 rounded text-xs sm:text-sm font-medium tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 ' +
                        (active
                          ? 'bg-red-600 text-white'
                          : 'text-stone-600 dark:text-stone-300 hover:bg-red-50 dark:hover:bg-zinc-700')
                      }
                    >
                      {gradeTick(g)}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Print button. Hidden on paper. */}
            <div className="print:hidden mb-6 flex justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 min-h-11 px-4 py-2 rounded-full text-sm font-medium text-white bg-stone-800 hover:bg-stone-900 dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-white shadow-sm transition-colors"
                style={{ fontFamily: 'Chivo Mono, monospace' }}
              >
                <Printer className="w-4 h-4" aria-hidden="true" />
                Print This Lesson
              </button>
            </div>

            {/* The merged lesson body for the selected grade. */}
            <article>
              {/* Grade + band heading, reading level, scaffolding. The heading
                  carries the per-grade specificity that makes sliding inside a
                  band feel different grade to grade. */}
              <div className="border-b border-stone-300 dark:border-zinc-700 pb-5 mb-2">
                <h2
                  className="text-stone-900 dark:text-stone-100 text-2xl sm:text-3xl font-medium leading-tight"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {gradeLabel(grade)}
                  {band && (band.label || band.band)
                    ? ` / ${band.label || band.band}`
                    : ''}
                </h2>
                {band && (band.concept || band.skill_focus) && (
                  <div className="mt-2 space-y-1 text-sm text-stone-600 dark:text-stone-400">
                    {band.concept && (
                      <p>
                        <span className="font-semibold text-stone-700 dark:text-stone-300">
                          Concept:
                        </span>{' '}
                        {band.concept}
                      </p>
                    )}
                    {band.skill_focus && (
                      <p>
                        <span className="font-semibold text-stone-700 dark:text-stone-300">
                          Skill Focus:
                        </span>{' '}
                        {band.skill_focus}
                      </p>
                    )}
                  </div>
                )}
                {tuning && tuning.reading_level && (
                  <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      Reading Level:
                    </span>{' '}
                    {tuning.reading_level}
                  </p>
                )}
                {tuning && tuning.scaffolding && (
                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      Scaffolding:
                    </span>{' '}
                    {tuning.scaffolding}
                  </p>
                )}
              </div>

              {/* Essential Question (per-grade, falls back to band). */}
              {essentialQuestion && (
                <>
                  <SectionHeading>Essential Question</SectionHeading>
                  <blockquote
                    className="border-l-4 border-civil-red-strong pl-4 py-1 text-stone-800 dark:text-stone-200 text-lg italic"
                    style={{ fontFamily: 'Source Serif 4, serif' }}
                  >
                    {essentialQuestion}
                  </blockquote>
                </>
              )}

              {/* Learning Objectives (band pool, sliced by grade). */}
              {band && headFirst(band.objectives, oCount(grade)).length > 0 && (
                <>
                  <SectionHeading>Learning Objectives</SectionHeading>
                  <p className="-mt-1 mb-2 text-xs text-stone-500 dark:text-stone-400">
                    {headFirst(band.objectives, oCount(grade)).length} for {gradeLabel(grade)}.
                  </p>
                  <ul className="list-disc pl-6 space-y-1.5 text-stone-800 dark:text-stone-200">
                    {headFirst(band.objectives, oCount(grade)).map((obj, i) => (
                      <li key={i} className="leading-relaxed">
                        {obj}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Vocabulary (band pool, sliced by grade so higher grades get
                  more terms). */}
              {band && headFirst(band.vocabulary, vCount(grade)).length > 0 && (
                  <>
                    <SectionHeading>Vocabulary</SectionHeading>
                    <p className="-mt-1 mb-2 text-xs text-stone-500 dark:text-stone-400">
                      {headFirst(band.vocabulary, vCount(grade)).length} terms for {gradeLabel(grade)}.
                    </p>
                    <dl className="space-y-2">
                      {headFirst(band.vocabulary, vCount(grade)).map((v, i) => (
                        <div
                          key={i}
                          className="sm:flex sm:gap-3 rounded-md bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 px-3 py-2"
                        >
                          <dt className="font-semibold text-stone-900 dark:text-stone-100 sm:w-40 sm:flex-shrink-0">
                            {v.term}
                          </dt>
                          <dd className="text-stone-700 dark:text-stone-300 leading-relaxed">
                            {v.definition}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </>
                )}

              {/* Materials: clips (bounded LoC player) + person cards (band). */}
              {band && Array.isArray(band.materials) && band.materials.length > 0 && (
                <>
                  <SectionHeading>Materials From the Archive</SectionHeading>
                  <div className="space-y-6">
                    {band.materials.map((m, i) => {
                      if (m && m.type === 'clip') {
                        const hasEntry = m.entry_number != null;
                        const clipKey = `${m.entry_number}-${m.start_seconds ?? 0}-${i}`;
                        return (
                          <div
                            key={i}
                            className="rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4"
                          >
                            <div className="mb-2">
                              <p
                                className="text-stone-900 dark:text-stone-100 font-semibold"
                                style={{ fontFamily: 'Inter, sans-serif' }}
                              >
                                {m.clip_title || 'Archive Clip'}
                              </p>
                              {m.interviewee && (
                                <p className="text-sm text-stone-500 dark:text-stone-400">
                                  {m.interviewee}
                                </p>
                              )}
                            </div>
                            {hasEntry ? (
                              <>
                                {playingKey === clipKey ? (
                                  <div className="print:hidden">
                                    <LocVideoEmbed
                                      entryNumber={m.entry_number}
                                      startSeconds={m.start_seconds || 0}
                                      endSeconds={m.end_seconds ?? null}
                                      autoPlay
                                    />
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setPlayingKey(clipKey)}
                                    className="print:hidden inline-flex items-center gap-2 rounded-md bg-civil-red-strong px-3 py-2 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                                  >
                                    <Film className="w-4 h-4" aria-hidden="true" />
                                    Play Clip
                                    {m.start_seconds != null && m.end_seconds != null
                                      ? ` (${fmtClock(m.end_seconds - m.start_seconds)})`
                                      : ''}
                                  </button>
                                )}
                                <p className="hidden print:block text-sm text-stone-700">
                                  Clip reference: Interview {m.entry_number}
                                  {m.start_seconds != null
                                    ? `, ${fmtClock(m.start_seconds)} to ${fmtClock(
                                        m.end_seconds ?? m.start_seconds,
                                      )}`
                                    : ''}
                                  . Play it on the Civil Rights History Project site.
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-stone-500">
                                This clip is not yet linked to an interview.
                              </p>
                            )}
                            {m.why && (
                              <p className="mt-3 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                                <span className="font-semibold text-stone-700 dark:text-stone-300">
                                  Why This Clip:
                                </span>{' '}
                                {m.why}
                              </p>
                            )}
                            {hasEntry && (
                              <Link
                                to={`/interview/${m.entry_number}`}
                                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-civil-red-body dark:text-red-400 hover:underline focus:outline-none focus-visible:underline"
                              >
                                <Film className="w-4 h-4" aria-hidden="true" />
                                Watch the Full Interview
                              </Link>
                            )}
                          </div>
                        );
                      }
                      if (m && m.type === 'person') {
                        return (
                          <Link
                            key={i}
                            to={`/person/${m.slug}`}
                            className="group flex items-start gap-3 rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 hover:bg-stone-50 dark:hover:bg-zinc-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 transition-colors"
                          >
                            <span className="mt-0.5 flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-50 dark:bg-zinc-700">
                              <User
                                className="w-5 h-5 text-civil-red-body dark:text-red-400"
                                aria-hidden="true"
                              />
                            </span>
                            <span className="min-w-0">
                              <span
                                className="block font-semibold text-stone-900 dark:text-stone-100 group-hover:underline"
                                style={{ fontFamily: 'Inter, sans-serif' }}
                              >
                                {m.name || m.slug}
                              </span>
                              {m.why && (
                                <span className="block mt-1 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                                  {m.why}
                                </span>
                              )}
                              <span className="mt-1 inline-block text-xs font-medium text-civil-red-body dark:text-red-400">
                                Read This Person&apos;s Page
                              </span>
                            </span>
                          </Link>
                        );
                      }
                      return null;
                    })}
                  </div>
                </>
              )}

              {/* Activities (band, numbered). */}
              {band && Array.isArray(band.activities) && band.activities.length > 0 && (
                <>
                  <SectionHeading>Activities</SectionHeading>
                  <ol className="list-decimal pl-6 space-y-2 text-stone-800 dark:text-stone-200">
                    {band.activities.map((a, i) => (
                      <li key={i} className="leading-relaxed pl-1">
                        {a}
                      </li>
                    ))}
                  </ol>
                </>
              )}

              {/* Discussion Questions (band pool, sliced to the grade number:
                  K and 1 get one, grade 12 gets twelve, ordered by depth). */}
              {band && headFirst(band.discussion_questions, qCount(grade)).length > 0 && (
                  <>
                    <SectionHeading>Discussion Questions</SectionHeading>
                    <p className="-mt-1 mb-2 text-xs text-stone-500 dark:text-stone-400">
                      {headFirst(band.discussion_questions, qCount(grade)).length} for {gradeLabel(grade)}, ordered from most accessible to most demanding.
                    </p>
                    <ul className="list-disc pl-6 space-y-1.5 text-stone-800 dark:text-stone-200">
                      {headFirst(band.discussion_questions, qCount(grade)).map((q, i) => (
                        <li key={i} className="leading-relaxed">
                          {q}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

              {/* Assessment (band). */}
              {band && band.assessment && (
                <>
                  <SectionHeading>Assessment</SectionHeading>
                  <p className="text-stone-800 dark:text-stone-200 leading-relaxed">
                    {band.assessment}
                  </p>
                </>
              )}

              {/* Age-appropriateness and content: its own clearly-labeled
                  section explaining how difficult material is graded by
                  developmental band, then the per-grade specifics. */}
              {band && band.content_note && (
                <div className="mt-8 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 p-4">
                  <p className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold text-sm mb-2">
                    <Info className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    Age-Appropriateness and Difficult Content
                  </p>
                  <p className="text-sm text-amber-900/90 dark:text-amber-100/90 leading-relaxed mb-2">
                    This lesson grades difficult material by developmental band. The
                    civil rights record includes racial violence, including the
                    murders and lynchings that drove the movement; that material is
                    engaged directly only at the bands developmentally ready for it,
                    and routed around at the younger grades. At this grade:
                  </p>
                  <p className="text-sm text-amber-900/90 dark:text-amber-100/90 leading-relaxed">
                    {band.content_note}
                  </p>
                </div>
              )}

              {/* Standards (band) if present. */}
              {band && Array.isArray(band.standards) && band.standards.length > 0 && (
                <>
                  <SectionHeading>Standards Alignment</SectionHeading>
                  <ul className="list-disc pl-6 space-y-1 text-stone-700 dark:text-stone-300 text-sm">
                    {band.standards.map((s, i) => (
                      <li key={i} className="leading-relaxed">
                        {s}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Sources at the bottom: each links to the interview detail. */}
              {Array.isArray(data.sources) && data.sources.length > 0 && (
                <>
                  <SectionHeading>Sources</SectionHeading>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mb-2 max-w-3xl">
                    Oral history interviews from the Civil Rights History Project,
                    a collaboration of the Library of Congress and the Smithsonian
                    National Museum of African American History and Culture.
                  </p>
                  <ul className="list-none p-0 m-0 space-y-1">
                    {data.sources.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-baseline gap-2 text-sm text-stone-700 dark:text-stone-300"
                      >
                        <BookOpen
                          className="w-3.5 h-3.5 flex-shrink-0 translate-y-0.5 text-stone-400"
                          aria-hidden="true"
                        />
                        {s.entry_number != null ? (
                          <Link
                            to={`/interview/${s.entry_number}`}
                            className="text-civil-red-body dark:text-red-400 hover:underline focus:outline-none focus-visible:underline"
                          >
                            {s.interviewee || `Interview ${s.entry_number}`}
                          </Link>
                        ) : (
                          <span>{s.interviewee || 'Interview'}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </>
        )}
      </main>
    </div>
  );
}
