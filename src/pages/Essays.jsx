/**
 * @fileoverview Essays index (/essays). A data-driven catalog of curated,
 * public-domain and openly-licensed essays that illuminate the themes the oral
 * histories explore. It renders whatever topics and essays exist in
 * /rag/essays/index.json (built by scripts/build_essays_index.mjs), so the
 * collection scales by data alone. A ?topic=<id> query filters to one theme,
 * which is how the Topics page links in.
 *
 * No AI-generated prose lives here: every essay is a real third-party work,
 * reproduced in full from its public-domain or open-license source, with its
 * citation and license shown. Only this page's own framing copy is ours.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Footer from '../components/common/Footer';

function fetchJsonOrNull(url) {
  return fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
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

function EssayCard({ essay }) {
  return (
    <Link
      to={`/essays/${essay.slug}`}
      className="block rounded-lg border border-stone-300 bg-white p-5 hover:border-red-500 hover:shadow-sm transition-colors focus-visible:border-red-500"
    >
      <div className="text-lg font-semibold text-stone-900 leading-snug" style={{ fontFamily: 'Inter, sans-serif' }}>
        {essay.title}
      </div>
      <div className="mt-1 text-sm text-stone-600">
        {(essay.authors || []).join(', ')}
        {essay.year ? `, ${essay.year}` : ''}
        {essay.collection ? ` (from ${essay.collection})` : ''}
      </div>
      {essay.excerpt && (
        <p className="mt-3 text-sm text-stone-700 leading-relaxed line-clamp-4">{essay.excerpt}</p>
      )}
      <div className="mt-3 flex items-center gap-3 text-xs">
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600">
          {LICENSE_LABEL[essay.license_type] || essay.license_type}
        </span>
        {essay.word_count ? <span className="text-stone-500">{essay.word_count.toLocaleString()} words</span> : null}
      </div>
    </Link>
  );
}

export default function Essays() {
  useDocumentTitle('Essays');
  const [index, setIndex] = useState(null);
  const [status, setStatus] = useState('loading');
  const [params, setParams] = useSearchParams();
  const activeTopic = params.get('topic');

  useEffect(() => {
    let cancelled = false;
    fetchJsonOrNull('/rag/essays/index.json').then((d) => {
      if (cancelled) return;
      if (d && Array.isArray(d.essays)) {
        setIndex(d);
        setStatus('ready');
      } else {
        setStatus('unavailable');
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const topics = useMemo(() => {
    if (!index) return [];
    return activeTopic ? index.topics.filter((t) => t.id === activeTopic) : index.topics;
  }, [index, activeTopic]);

  const essayBySlug = useMemo(() => {
    const m = new Map();
    if (index) for (const e of index.essays) m.set(e.slug, e);
    return m;
  }, [index]);

  return (
    <div className="min-h-screen bg-[#EBEAE9] dark:bg-zinc-900">
      <main id="main-content" className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <h1 className="text-3xl sm:text-4xl font-light text-stone-900 dark:text-stone-100" style={{ fontFamily: 'Chivo Mono, monospace' }}>
          Essays
        </h1>
        <p className="mt-3 max-w-3xl text-stone-700 dark:text-stone-300 leading-relaxed">
          Curated public-domain and openly-licensed essays that illuminate the themes the oral histories explore.
          Each work is reproduced in full from its source, with full citation and license, and linked to related
          interviews in the archive. These are real published texts, not generated summaries.
        </p>

        {status === 'loading' && (
          <p className="mt-8 text-stone-500" role="status">Loading essays...</p>
        )}
        {status === 'unavailable' && (
          <p className="mt-8 text-stone-500" role="status">The essays catalog is being prepared.</p>
        )}

        {status === 'ready' && (
          <>
            {activeTopic && (
              <button
                type="button"
                onClick={() => setParams({})}
                className="mt-6 inline-flex min-h-11 items-center text-sm text-civil-red-body hover:underline"
              >
                Show all topics
              </button>
            )}
            <div className="mt-8 space-y-12">
              {topics.map((t) => (
                <section key={t.id} aria-labelledby={`topic-${t.id}`}>
                  <h2 id={`topic-${t.id}`} className="text-2xl font-semibold text-stone-900 dark:text-stone-100" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {t.label}
                  </h2>
                  {t.description && <p className="mt-1 max-w-3xl text-sm text-stone-600 dark:text-stone-400">{t.description}</p>}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {t.essay_slugs.map((slug) => {
                      const e = essayBySlug.get(slug);
                      return e ? <EssayCard key={slug} essay={e} /> : null;
                    })}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
