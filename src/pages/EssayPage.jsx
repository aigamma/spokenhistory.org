/**
 * @fileoverview EssayPage (/essays/:slug). Renders one curated essay as an
 * integration hub: a prominent attribution block (author, year, venue, license,
 * canonical source), the verbatim full text, and cross-links derived from the
 * essay's topics into the oral-history archive (related interviews via the
 * Topics keyword, the Topics page itself).
 *
 * The essay body is a VERBATIM reproduction of a public-domain or open-license
 * work, so its original punctuation (including em dashes) is preserved as the
 * author wrote it; the project's house style applies only to our own chrome.
 * The cross-links are DERIVED at render time from /rag/essays/topics.json, the
 * same precomputed-substrate pattern PersonPage uses, so nothing is hand-wired.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Footer from '../components/common/Footer';

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

export default function EssayPage() {
  const { slug } = useParams();
  const [essay, setEssay] = useState(null);
  const [body, setBody] = useState('');
  const [topics, setTopics] = useState([]);
  const [status, setStatus] = useState('loading');

  useDocumentTitle(essay?.title || 'Essay');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    Promise.all([
      fetchJsonOrNull(`/rag/essays/${slug}.json`),
      fetchTextOrNull(`/rag/essays/text/${slug}.txt`),
      fetchJsonOrNull('/rag/essays/topics.json'),
    ]).then(([meta, text, topicDoc]) => {
      if (cancelled) return;
      if (meta) {
        setEssay(meta);
        setBody(text || '');
        setTopics(topicDoc?.topics || []);
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

  const paragraphs = useMemo(() => (body ? body.split(/\n{2,}/).filter((p) => p.trim()) : []), [body]);

  const crossLinks = useMemo(() => {
    if (!essay) return [];
    return (essay.themes || [])
      .map((id) => topicMap.get(id))
      .filter((t) => t && t.corpus_links && t.corpus_links.keyword);
  }, [essay, topicMap]);

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
          <Link to="/essays" className="mt-4 inline-block text-civil-red-body hover:underline">Back to Essays</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBEAE9] dark:bg-zinc-900">
      <main id="main-content" className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <Link to="/essays" className="text-sm text-civil-red-body hover:underline">Essays</Link>

        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-stone-900 dark:text-stone-100 leading-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
          {essay.title}
        </h1>
        <div className="mt-2 text-stone-700 dark:text-stone-300">
          {(essay.authors || []).join(', ')}
          {essay.year ? `, ${essay.year}` : ''}
        </div>

        {/* Attribution + license. This is the academic-citation surface. */}
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
            <div className="mt-1">
              <a href={essay.source_url} target="_blank" rel="noopener noreferrer" className="text-civil-red-body hover:underline">
                View the original source
              </a>
            </div>
          )}
          <div className="mt-1 text-stone-500">Reproduced in full from a public-domain or open-license source.</div>
        </div>

        {/* Cross-links into the archive (derived from the essay's topics). */}
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

        {/* The verbatim full text. white-space: pre-line preserves the author's
            line breaks (the verse epigraphs) within each paragraph block. */}
        <article className="mt-8 max-w-none text-stone-900 dark:text-stone-100 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
          {paragraphs.map((p, i) => (
            <p key={i} className="mb-4" style={{ whiteSpace: 'pre-line' }}>{p}</p>
          ))}
        </article>
      </main>
      <Footer />
    </div>
  );
}
