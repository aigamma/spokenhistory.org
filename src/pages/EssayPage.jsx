/**
 * @fileoverview EssayPage (/essays/:slug). Renders one curated essay as an
 * integration hub: a cited hero portrait, the verbatim full text reflowed for
 * comfortable reading, a "Voices from the Archive" block of click-to-play
 * interview chapters chosen for their resonance with the essay, and a
 * data-driven closing panel that names the corpus voices this essay connects
 * to (with a second cited portrait).
 *
 * The essay body is a VERBATIM reproduction of a public-domain or open-license
 * work. We never alter its words; we only normalize whitespace for display.
 * The harvested source text is hard-wrapped at about 70 columns, so prose
 * paragraphs are reflowed into flowing lines while the opening verse epigraph
 * keeps its line breaks. The project house style (em-dash ban, Title Case)
 * applies only to our own chrome, never to the reproduced text.
 *
 * All connective material (hero image, related chapters, closing image,
 * connection summary) is read from /rag/essays/connections/${slug}.json, the
 * curated and precomputed enrichment file, the same precomputed-substrate
 * pattern PersonPage uses. When that file is absent the page still renders
 * (graceful degradation): a typographic hero, the text, and the topic links.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, MessageSquareQuote, Play, ChevronUp, ArrowRight } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Footer from '../components/common/Footer';
import LocVideoEmbed from '../components/LocVideoEmbed';

function fetchJsonOrNull(url) {
  return fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
}
function fetchTextOrNull(url) {
  return fetch(url).then((r) => (r.ok ? r.text() : null)).catch(() => null);
}

const LICENSE_LABEL = {
  'public-domain': 'Public Domain',
  'us-government-public-domain': 'Public Domain (US Government)',
  cc0: 'CC0',
  'cc-by': 'CC BY',
  'cc-by-sa': 'CC BY-SA',
  'cc-by-nc': 'CC BY-NC',
  'cc-by-nc-sa': 'CC BY-NC-SA',
};

// Each essay topic gets an accent color so a page reads as keyed to its theme.
// Accents are 700-level: dark enough to carry white badge text, calm enough
// for the site's cream ground. Used for decoration only (badges, borders, the
// hero tint, section icons), never for body text, so contrast stays AA.
const TOPIC_COLOR = {
  'family-influence': '#B45309',
  'intergenerational-activism': '#0F766E',
  'community-support': '#15803D',
  'youth-student-activism': '#1D4ED8',
  'faith-and-church': '#6D28D9',
  'education-and-schools': '#4338CA',
  'identity-and-double-consciousness': '#BE185D',
  'music-and-culture': '#C2410C',
  'womens-leadership': '#86198F',
  'justice-and-resistance': '#B91C1C',
};
const DEFAULT_ACCENT = '#B23E2F'; // civil-red-body

function fmtClock(s) {
  if (s == null || !isFinite(s)) return '';
  const t = Math.max(0, Math.round(s));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
function fmtLen(start, end) {
  const d = (end ?? 0) - (start ?? 0);
  if (!isFinite(d) || d <= 0) return '';
  return fmtClock(d);
}

// A cited image figure (hero and closing). Mirrors the PersonPage figcaption
// citation pattern so every image on the site carries its full attribution:
// caption, photographer, date, repository, license.
function CitedFigure({ image, eager = false }) {
  if (!image) return null;
  const src = image.src_local || image.src_external;
  if (!src) return null;
  return (
    <figure className="m-0">
      <img
        src={src}
        alt={image.alt || ''}
        loading={eager ? 'eager' : 'lazy'}
        className="w-full block object-cover rounded-md border border-stone-300 bg-white shadow-sm"
      />
      <figcaption
        className="mt-2 text-xs text-stone-500 italic leading-snug text-center"
        style={{ fontFamily: 'Source Serif 4, serif' }}
      >
        {image.caption && <>{image.caption} </>}
        {image.photographer && <span className="not-italic">{image.photographer}</span>}
        {image.date_taken && <span className="not-italic">, {image.date_taken}</span>}
        {(image.photographer || image.date_taken) && <span className="not-italic">. </span>}
        {image.repository && <span className="not-italic">{image.repository}. </span>}
        {image.license && <span className="not-italic">{image.license}.</span>}
      </figcaption>
    </figure>
  );
}

// One related interview chapter, click-to-play. Mirrors the Table of Contents:
// a row that, on click, mounts a bounded LocVideoEmbed that range-jumps to the
// chapter start and pauses at its end, so only the clip's bytes load even from
// a multi-hour interview.
function VoiceCard({ chapter, accent }) {
  const [open, setOpen] = useState(false);
  const start = Number(chapter.start) || 0;
  const end = chapter.end != null ? Number(chapter.end) : null;
  const firstName = (chapter.subject || '').split(' ')[0];
  return (
    <li
      className="rounded-lg border border-stone-300 bg-white overflow-hidden"
      style={{ borderLeftColor: accent, borderLeftWidth: '4px' }}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-semibold text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
            {chapter.subject}
          </span>
          {fmtLen(start, end) && (
            <span className="text-xs text-stone-400 tabular-nums shrink-0">{fmtLen(start, end)}</span>
          )}
        </div>
        <div className="mt-0.5 text-sm text-stone-700">
          {chapter.chapter_title}
          {chapter.part_title ? <span className="text-stone-400"> · {chapter.part_title}</span> : null}
        </div>
        {chapter.why && (
          <p className="mt-2 text-sm text-stone-600 leading-relaxed" style={{ fontFamily: 'Source Serif 4, serif' }}>
            {chapter.why}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-civil-red-body hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
          >
            {open ? (
              <><ChevronUp className="w-4 h-4" aria-hidden="true" /> Hide clip</>
            ) : (
              <><Play className="w-4 h-4" aria-hidden="true" /> Play this chapter</>
            )}
          </button>
          {chapter.slug && (
            <Link to={`/person/${chapter.slug}`} className="text-sm text-stone-500 hover:text-civil-red-body hover:underline">
              About {firstName}
            </Link>
          )}
          <Link to={`/interview/${chapter.entry}?t=${Math.round(start)}`} className="text-sm text-stone-500 hover:text-civil-red-body hover:underline">
            Full interview
          </Link>
        </div>
        {open && (
          <div className="mt-4">
            <LocVideoEmbed
              key={`${chapter.entry}-${start}`}
              entryNumber={chapter.entry}
              startSeconds={start}
              endSeconds={end}
              autoPlay
            />
          </div>
        )}
      </div>
    </li>
  );
}

export default function EssayPage() {
  const { slug } = useParams();
  const [essay, setEssay] = useState(null);
  const [body, setBody] = useState('');
  const [topics, setTopics] = useState([]);
  const [conn, setConn] = useState(null);
  const [status, setStatus] = useState('loading');

  useDocumentTitle(essay?.title || 'Essay');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    Promise.all([
      fetchJsonOrNull(`/rag/essays/${slug}.json`),
      fetchTextOrNull(`/rag/essays/text/${slug}.txt`),
      fetchJsonOrNull('/rag/essays/topics.json'),
      fetchJsonOrNull(`/rag/essays/connections/${slug}.json`),
    ]).then(([meta, text, topicDoc, connections]) => {
      if (cancelled) return;
      if (meta) {
        setEssay(meta);
        setBody(text || '');
        setTopics(topicDoc?.topics || []);
        setConn(connections || null);
        setStatus('ready');
      } else {
        setStatus('notfound');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const topicMap = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);

  // Split the verbatim body into a leading verse epigraph (kept line-broken)
  // and the prose that follows (reflowed). Drop standalone bracketed artifacts
  // like "[Illustration]" that the digitized source carries but for which we
  // show our own curated imagery instead.
  const { epigraph, prose } = useMemo(() => {
    const blocks = (body ? body.split(/\n{2,}/) : [])
      .map((p) => p.trim())
      .filter(Boolean)
      .filter((p) => !/^\[[^\]]*\]$/.test(p));
    const isProse = (p) => p.length > 180 && /[a-z]/.test(p) && !/^[-A-Z0-9 .,'"’;:()]+$/.test(p);
    const firstProse = blocks.findIndex(isProse);
    if (firstProse > 0) return { epigraph: blocks.slice(0, firstProse), prose: blocks.slice(firstProse) };
    return { epigraph: [], prose: blocks };
  }, [body]);

  const crossLinks = useMemo(() => {
    if (!essay) return [];
    return (essay.themes || [])
      .map((id) => topicMap.get(id))
      .filter((t) => t && t.corpus_links && t.corpus_links.keyword);
  }, [essay, topicMap]);

  const primaryTopic = conn?.primary_topic || essay?.themes?.[0] || null;
  const accent = (primaryTopic && TOPIC_COLOR[primaryTopic]) || DEFAULT_ACCENT;

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#EBEAE9] dark:bg-zinc-900">
        <main id="main-content" className="mx-auto max-w-3xl px-4 py-16">
          <p className="text-stone-500" role="status">Loading essay...</p>
        </main>
      </div>
    );
  }
  if (status === 'notfound' || !essay) {
    return (
      <div className="min-h-screen bg-[#EBEAE9] dark:bg-zinc-900">
        <main id="main-content" className="mx-auto max-w-3xl px-4 py-16">
          <p className="text-stone-700 dark:text-stone-300">That essay was not found.</p>
          <Link to="/essays" className="mt-4 inline-flex min-h-11 items-center text-civil-red-body hover:underline">Back to Essays</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const hero = conn?.hero_image || null;
  const closing = conn?.closing_image || null;
  const chapters = Array.isArray(conn?.related_chapters) ? conn.related_chapters : [];
  const topicLabel = primaryTopic && topicMap.get(primaryTopic) ? topicMap.get(primaryTopic).label : null;

  return (
    <div className="min-h-screen bg-[#EBEAE9] dark:bg-zinc-900">
      <main id="main-content" className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <Link to="/essays" className="inline-flex items-center gap-1 min-h-11 text-sm text-civil-red-body hover:underline">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Essays
        </Link>

        {/* HERO. The cited portrait leads; the title sits beside it on wider
            screens and stacks above it on mobile. A soft topic-keyed tint
            binds the two and gives each essay a distinct color signature. */}
        <header className="mt-4 rounded-xl border border-stone-200 overflow-hidden" style={{ backgroundColor: `${accent}12` }}>
          <div className="p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7">
            {hero && (
              <div className="shrink-0 w-44 sm:w-48 mx-auto sm:mx-0">
                <CitedFigure image={hero} eager />
              </div>
            )}
            <div className="min-w-0">
              {topicLabel && (
                <Link
                  to={`/essays?topic=${primaryTopic}`}
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white mb-2"
                  style={{ backgroundColor: accent }}
                >
                  {topicLabel}
                </Link>
              )}
              <h1 className="text-3xl sm:text-4xl font-semibold text-stone-900 leading-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                {essay.title}
              </h1>
              <div className="mt-2 text-stone-700">
                {(essay.authors || []).join(', ')}
                {essay.year ? `, ${essay.year}` : ''}
                {essay.collection ? <span className="text-stone-500"> · {essay.collection}</span> : null}
              </div>
              {chapters.length > 0 && (
                <a href="#voices" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: accent }}>
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  {chapters.length} oral histories take up this essay
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Attribution + license. The academic citation surface. */}
        <div className="mt-5 rounded-lg border border-stone-300 bg-white/70 dark:bg-zinc-800/50 p-4 text-sm text-stone-700 dark:text-stone-300">
          <div>
            <span className="font-semibold">Source:</span>{' '}
            {essay.collection ? `${essay.collection}. ` : ''}
            {essay.venue ? `${essay.venue}. ` : ''}
            {essay.year ? `${essay.year}.` : ''}
          </div>
          <div className="mt-1">
            <span className="font-semibold">License:</span>{' '}
            {LICENSE_LABEL[essay.license?.type] || essay.license?.type}
            {essay.license?.note ? ` (${essay.license.note})` : ''}
          </div>
          {essay.source_url && (
            <div className="mt-1 text-stone-500">
              Digitized full text via {(() => {
                try { return new URL(essay.source_url).hostname.replace(/^www\./, ''); } catch { return 'the cited source'; }
              })()}.
            </div>
          )}
          <div className="mt-1 text-stone-500">Reproduced in full from a public-domain or open-license source.</div>
        </div>

        {/* Topic cross-links into the archive. */}
        {crossLinks.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">In the Archive</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {crossLinks.map((t) => (
                <Link
                  key={t.id}
                  to={`/playlist-builder?keywords=${encodeURIComponent(t.corpus_links.keyword)}&label=${encodeURIComponent(t.label)}`}
                  className="rounded-full border border-stone-300 bg-white px-3 py-1 text-sm text-stone-700 hover:border-red-500 hover:text-red-700 transition-colors"
                >
                  Oral histories on {t.label}
                </Link>
              ))}
              <Link
                to="/topic-glossary"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-sm text-stone-700 hover:border-red-500 hover:text-red-700 transition-colors"
              >
                Browse all topics
              </Link>
            </div>
          </div>
        )}

        {/* The verbatim essay. The opening verse epigraph keeps its line breaks
            and reads as a centered block; the prose that follows is reflowed
            from the source's hard-wrapped lines and opens with a drop cap. */}
        <article className="mt-8 text-stone-900 dark:text-stone-100 leading-relaxed break-words" style={{ fontFamily: 'Georgia, serif' }}>
          {epigraph.length > 0 && (
            <div className="mb-8 mx-auto max-w-md text-center text-stone-600 dark:text-stone-300" style={{ whiteSpace: 'pre-line' }}>
              {epigraph.map((p, i) => (
                <p key={i} className={i === 0 ? 'italic text-[0.95rem] leading-relaxed' : 'mt-2 text-xs uppercase tracking-widest text-stone-500'}>
                  {p}
                </p>
              ))}
            </div>
          )}
          {prose.map((p, i) => (
            <p
              key={i}
              className={`mb-5 ${i === 0 ? 'first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:text-6xl first-letter:leading-[0.8] first-letter:font-semibold first-letter:text-stone-800' : ''}`}
            >
              {p.replace(/\s*\n\s*/g, ' ')}
            </p>
          ))}
        </article>

        {/* VOICES FROM THE ARCHIVE. Click-to-play interview chapters chosen for
            their resonance with the essay. Each plays only its clip's bytes. */}
        {chapters.length > 0 && (
          <section id="voices" className="mt-14 scroll-mt-6">
            <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100" style={{ fontFamily: 'Inter, sans-serif' }}>
              <MessageSquareQuote className="w-5 h-5" style={{ color: accent }} aria-hidden="true" />
              Voices From the Archive
            </h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Oral histories from the Civil Rights History Project that take up the questions this essay raises. Click any one to play that moment; only the clip loads, never the full interview.
            </p>
            <ul className="mt-4 space-y-3 list-none p-0">
              {chapters.map((c, i) => (
                <VoiceCard key={i} chapter={c} accent={accent} />
              ))}
            </ul>
          </section>
        )}

        {/* DATA-DRIVEN CLOSING. Names the corpus voice the data connects most
            closely with, carried by a second cited portrait. */}
        {(conn?.connections?.summary || closing || conn?.top_voice || (conn?.shared_topics && conn.shared_topics.length > 0)) && (
          <section className="mt-14 rounded-xl border p-5 sm:p-6" style={{ borderColor: `${accent}55`, backgroundColor: `${accent}0d` }}>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide" style={{ color: accent, fontFamily: 'Chivo Mono, monospace' }}>
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              How This Connects
            </h2>
            {conn?.connections?.summary && (
              <p className="mt-2 text-stone-800 dark:text-stone-200 leading-relaxed" style={{ fontFamily: 'Source Serif 4, serif' }}>
                {conn.connections.summary}
              </p>
            )}
            <div className="mt-4 flex flex-col sm:flex-row gap-5 sm:gap-6">
              {closing && (
                <div className="shrink-0 w-40 mx-auto sm:mx-0">
                  <CitedFigure image={closing} />
                </div>
              )}
              <div className="min-w-0">
                {conn?.top_voice && (
                  <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                    The archive voice closest to this essay:{' '}
                    {conn.top_voice.slug ? (
                      <Link to={`/person/${conn.top_voice.slug}`} className="font-semibold text-civil-red-body hover:underline">
                        {conn.top_voice.subject}
                      </Link>
                    ) : (
                      <span className="font-semibold">{conn.top_voice.subject}</span>
                    )}
                    {conn.top_voice.reason ? `. ${conn.top_voice.reason}` : '.'}
                  </p>
                )}
                {conn?.shared_topics && conn.shared_topics.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {conn.shared_topics.map((id) => {
                      const t = topicMap.get(id);
                      if (!t) return null;
                      return (
                        <Link
                          key={id}
                          to={`/essays?topic=${id}`}
                          className="rounded-full border bg-white px-3 py-1 text-xs text-stone-700 hover:border-red-500 transition-colors"
                          style={{ borderColor: `${accent}66` }}
                        >
                          {t.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
                <p className="mt-3 text-xs text-stone-500">
                  {conn?.connections?.method === 'embedding'
                    ? 'Connections are ranked by cosine similarity between this essay and the oral-history corpus in the shared embedding space.'
                    : "Connections are drawn from the oral-history corpus, the chapters above selected for their resonance with this essay's themes."}
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
