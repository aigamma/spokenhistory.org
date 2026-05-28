/**
 * @fileoverview PersonPage, the /person/:slug route.
 *
 * One page per named individual on the site. Loads the static JSON at
 * /rag/people/${slug}.json (schema described in public/rag/people/README.md)
 * and renders a citation-bearing reference page: portrait + role
 * summary + interlinked biographical paragraph + sources + cross-link
 * manifest into the existing RAG-explore surfaces.
 *
 * The JSON itself carries only the hand-curated content (bio, photo
 * citation, source list). All cross-references are derived at render
 * time from precomputed JSON already on the site:
 *
 *   - LoC item URL + audit tier      <- /rag/constellation.json
 *   - Semantic-neighbor list         <- /rag/related/entry-${N}.json
 *   - Concept-axis positions         <- /rag/summaries/concept_axes.json
 *   - Influence edges                <- /rag/summaries/influence.json
 *   - Tour appearances               <- /rag/summaries/tours.json
 *   - Geographic anchors             <- /rag/summaries/geography.json
 *
 * That way the JSON catalog stays small (~200 files at ~2 KB each =
 * ~400 KB total) and any updates to the substrate (re-precompute of
 * related-passages, new concept axes, new tours) propagate to person
 * pages without touching the catalog.
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { TIER_BADGE } from '../components/rag/tiers';

/**
 * Helper: fetch JSON with a single attempt; resolves to null on any
 * non-OK response so the calling component can render a graceful
 * "not available" state instead of throwing.
 */
function fetchJsonOrNull(url) {
  return fetch(url)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
}

/**
 * Render the inline-citation refs `[src: 1]`, `[src: 2]` inside the
 * biographical paragraph as superscript links to the sources list at
 * the bottom of the page. Refs that don't map to a real source render
 * as plain text (so a typo in the JSON doesn't break the page).
 */
function renderBioWithCitationRefs(text, sources) {
  if (!text) return null;
  const parts = [];
  let last = 0;
  const re = /\[src:\s*(\d+)\]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const n = Number(m[1]);
    const sourceExists = sources && sources[n - 1];
    if (sourceExists) {
      parts.push(
        <sup key={`cite-${m.index}`} className="text-xs">
          <a
            href={`#source-${n}`}
            className="text-civil-red-body hover:underline focus:outline-none focus-visible:underline"
            aria-label={`Citation ${n}`}
          >
            [{n}]
          </a>
        </sup>
      );
    } else {
      parts.push(<span key={`cite-${m.index}`} className="text-xs text-stone-400">[{n}]</span>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function PersonPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [crossLinks, setCrossLinks] = useState(null);

  // Load the person's JSON file. On 404, flip notFound and render the
  // "not in the catalog" view; on real errors (network, JSON parse),
  // the same view appears, the page never crashes.
  useEffect(() => {
    if (!slug) return undefined;
    let cancelled = false;
    setPerson(null);
    setNotFound(false);
    setCrossLinks(null);
    fetchJsonOrNull(`/rag/people/${slug}.json`).then((data) => {
      if (cancelled) return;
      if (!data) {
        setNotFound(true);
        return;
      }
      setPerson(data);
    });
    return () => { cancelled = true; };
  }, [slug]);

  // Derive cross-links from the precomputed substrate. Only for
  // interviewees (person_type === 'interviewee'); external figures
  // skip this step since they have no entry_number to key off of.
  useEffect(() => {
    if (!person?.entry_number) return undefined;
    let cancelled = false;
    Promise.all([
      fetchJsonOrNull('/rag/constellation.json'),
      fetchJsonOrNull(`/rag/related/entry-${person.entry_number}.json`),
      fetchJsonOrNull('/rag/summaries/concept_axes.json'),
      fetchJsonOrNull('/rag/summaries/influence.json'),
      fetchJsonOrNull('/rag/summaries/tours.json'),
    ]).then(([constellation, related, conceptAxes, influence, tours]) => {
      if (cancelled) return;
      const point = constellation?.points?.find(
        (p) => p.entry_number === person.entry_number
      );
      const relatedTop = related?.related_entry_summary
        ? Object.entries(related.related_entry_summary)
            .map(([num, info]) => ({
              entry_number: Number(num),
              count: info?.count || 0,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6)
        : [];
      const axisPositions = (conceptAxes?.axes || [])
        .map((axis) => {
          const pos = axis.positions?.find(
            (p) => p.entry_number === person.entry_number
          );
          if (!pos) return null;
          return {
            slug: axis.slug,
            label: axis.label || axis.slug,
            position_normalized: pos.position_normalized,
            pole_low: axis.pole_low_label,
            pole_high: axis.pole_high_label,
          };
        })
        .filter(Boolean);
      const influenceOut = (influence?.nodes || [])
        .find((n) => n.entry_number === person.entry_number)
        ?.discussed || [];
      const tourAppearances = (tours?.tours || []).filter((t) =>
        (t.entries || []).some((e) => e.entry_number === person.entry_number)
      );
      setCrossLinks({
        locItemUrl: point?.loc_item_url || null,
        uncertaintyTier: point?.uncertainty_tier || null,
        chunkCount: point?.chunk_count || 0,
        related: relatedTop,
        constellation,
        axisPositions,
        influenceOut,
        tours: tourAppearances,
      });
    });
    return () => { cancelled = true; };
  }, [person]);

  useDocumentTitle(person ? `${person.display_name}` : 'Person');

  // Not-found view. Slug doesn't match any catalog entry, or the JSON
  // is malformed.
  if (notFound) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#EBEAE9' }}>
        <main id="main-content" tabIndex={-1} className="max-w-3xl mx-auto px-4 sm:px-6 py-8 focus:outline-none">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-stone-700 hover:text-stone-900 mb-6 focus:outline-none focus-visible:underline"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back
          </button>
          <h1 className="text-stone-900 text-2xl font-medium mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            No catalog entry for &ldquo;{slug}&rdquo;
          </h1>
          <p className="text-stone-700">
            This person doesn&apos;t have a page in the catalog yet. The
            catalog is being filled in incrementally; check back later,
            or browse the corpus from{' '}
            <Link to="/rag-explore" className="text-civil-red-body hover:underline">
              the embedding-explorer page
            </Link>{' '}
            or the{' '}
            <Link to="/interview-index" className="text-civil-red-body hover:underline">
              interview index
            </Link>.
          </p>
        </main>
      </div>
    );
  }

  // Loading view. The catalog JSON fetch is in flight.
  if (!person) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#EBEAE9' }}>
        <main id="main-content" tabIndex={-1} className="max-w-3xl mx-auto px-4 sm:px-6 py-8 focus:outline-none">
          <p className="text-sm text-stone-500" role="status">Loading…</p>
        </main>
      </div>
    );
  }

  const tierBadge = crossLinks?.uncertaintyTier
    ? TIER_BADGE[crossLinks.uncertaintyTier]
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EBEAE9' }}>
      <main id="main-content" tabIndex={-1} className="max-w-4xl mx-auto px-4 sm:px-6 py-8 focus:outline-none">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-stone-700 hover:text-stone-900 mb-6 focus:outline-none focus-visible:underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back
        </button>

        {/* Header: portrait (if PD photo available) + identity block. */}
        <header className="flex flex-col sm:flex-row gap-6 mb-8">
          {person.photo && (person.photo.src_local || person.photo.src_external) && (
            <figure className="flex-shrink-0">
              <img
                src={person.photo.src_local || person.photo.src_external}
                alt={person.photo.alt || person.display_name}
                className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-md border border-stone-300 bg-white"
                loading="lazy"
              />
              <figcaption className="text-[10px] text-stone-500 mt-1 max-w-[10rem] leading-tight">
                {person.photo.photographer && `Photo: ${person.photo.photographer}. `}
                {person.photo.repository && `${person.photo.repository}. `}
                {person.photo.license || ''}
              </figcaption>
            </figure>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-civil-red-body text-xs font-light font-mono mb-1 uppercase tracking-wide">
              {person.person_type === 'interviewee'
                ? 'Civil Rights History Project · Interviewee'
                : 'Discussed by corpus voices · Not interviewed'}
            </p>
            <h1
              className="text-stone-900 text-3xl sm:text-4xl font-medium mb-2 leading-tight"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {person.display_name}
            </h1>
            <div className="text-sm text-stone-700 mb-3 flex flex-wrap gap-x-3 gap-y-1 items-baseline">
              {(person.born || person.died) && (
                <span className="tabular-nums">
                  {person.born || '?'}{person.died ? ` - ${person.died}` : person.born ? ' - ' : ''}
                </span>
              )}
              {person.entry_number && (
                <span className="text-stone-500">CRHP entry #{person.entry_number}</span>
              )}
              {tierBadge && crossLinks?.uncertaintyTier && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${tierBadge.bg} ${tierBadge.border} ${tierBadge.text}`}
                  title={`Audit tier: ${crossLinks.uncertaintyTier}`}
                >
                  {crossLinks.uncertaintyTier}
                </span>
              )}
            </div>
            {person.role_summary && (
              <p className="text-stone-800 text-base sm:text-lg" style={{ fontFamily: 'Source Serif 4, serif' }}>
                {person.role_summary}
              </p>
            )}
          </div>
        </header>

        {/* Biographical paragraph with inline [src: N] citation refs. */}
        {person.biographical_paragraph && (
          <section className="mb-10">
            <p className="text-stone-800 text-base leading-relaxed max-w-3xl" style={{ fontFamily: 'Source Serif 4, serif' }}>
              {renderBioWithCitationRefs(person.biographical_paragraph, person.sources)}
            </p>
          </section>
        )}

        {/* Cross-link manifest. Only renders for interviewees (need
            entry_number to look anything up). Each section appears
            only if its precomputed substrate file actually has data
            for this entry. */}
        {crossLinks && (
          <section className="mb-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {crossLinks.locItemUrl && (
              <article>
                <h2 className="text-stone-900 text-sm font-semibold uppercase tracking-wide font-mono mb-2">
                  Primary source
                </h2>
                <a
                  href={crossLinks.locItemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-civil-red-body hover:underline"
                >
                  Library of Congress item
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
                {crossLinks.chunkCount > 0 && (
                  <p className="text-xs text-stone-500 mt-1">
                    {crossLinks.chunkCount} time-anchored passages in the corpus.
                  </p>
                )}
              </article>
            )}

            {crossLinks.related && crossLinks.related.length > 0 && (
              <article>
                <h2 className="text-stone-900 text-sm font-semibold uppercase tracking-wide font-mono mb-2">
                  Semantic neighbors in the corpus
                </h2>
                <ul className="text-sm space-y-1 list-none p-0">
                  {crossLinks.related.map((r) => {
                    const neighbor = crossLinks.constellation?.points?.find(
                      (p) => p.entry_number === r.entry_number
                    );
                    if (!neighbor) return null;
                    return (
                      <li key={r.entry_number}>
                        <Link
                          to={`/rag-explore?tab=related`}
                          state={{ entryNumber: r.entry_number }}
                          className="text-civil-red-body hover:underline"
                        >
                          {neighbor.entry_subject}
                        </Link>
                        <span className="text-xs text-stone-500 ml-2">
                          {r.count} shared passages
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-stone-500 mt-2">
                  Full list on the{' '}
                  <Link
                    to={`/rag-explore?tab=related&entry=${person.entry_number}`}
                    className="text-civil-red-body hover:underline"
                  >
                    Semantic Overlap tab
                  </Link>.
                </p>
              </article>
            )}

            {crossLinks.axisPositions && crossLinks.axisPositions.length > 0 && (
              <article>
                <h2 className="text-stone-900 text-sm font-semibold uppercase tracking-wide font-mono mb-2">
                  Position on concept axes
                </h2>
                <ul className="text-sm space-y-2 list-none p-0">
                  {crossLinks.axisPositions.map((axis) => (
                    <li key={axis.slug}>
                      <Link
                        to={`/rag-explore?spectrumAxis=${axis.slug}&spectrumEntry=${person.entry_number}`}
                        className="text-civil-red-body hover:underline"
                      >
                        {axis.label}
                      </Link>
                      {axis.position_normalized != null && (
                        <span className="text-xs text-stone-500 ml-2">
                          {(axis.position_normalized * 100).toFixed(0)}% toward {axis.position_normalized >= 0.5 ? axis.pole_high : axis.pole_low}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            )}

            {crossLinks.influenceOut && crossLinks.influenceOut.length > 0 && (
              <article>
                <h2 className="text-stone-900 text-sm font-semibold uppercase tracking-wide font-mono mb-2">
                  Discussed in this interview
                </h2>
                <ul className="text-sm space-y-1 list-none p-0">
                  {crossLinks.influenceOut.slice(0, 8).map((d) => (
                    <li key={d.id || d.name}>
                      {d.in_corpus && d.slug ? (
                        <Link
                          to={`/person/${d.slug}`}
                          className="text-civil-red-body hover:underline"
                        >
                          {d.name || d.id}
                        </Link>
                      ) : (
                        <span className="text-stone-700">{d.name || d.id}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            )}

            {crossLinks.tours && crossLinks.tours.length > 0 && (
              <article>
                <h2 className="text-stone-900 text-sm font-semibold uppercase tracking-wide font-mono mb-2">
                  In curated tours
                </h2>
                <ul className="text-sm space-y-1 list-none p-0">
                  {crossLinks.tours.map((t) => (
                    <li key={t.slug}>
                      <Link
                        to={`/rag-explore?tab=tours&tour=${t.slug}`}
                        className="text-civil-red-body hover:underline"
                      >
                        {t.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            )}
          </section>
        )}

        {/* Sources list. The [src: N] refs in the bio paragraph anchor
            to #source-N inside this list, so a reader can click any
            citation and see exactly which source supports the claim. */}
        {person.sources && person.sources.length > 0 && (
          <section className="mt-10 border-t border-stone-300 pt-6">
            <h2 className="text-stone-900 text-sm font-semibold uppercase tracking-wide font-mono mb-3">
              Sources
            </h2>
            <ol className="text-sm space-y-2 list-decimal pl-5">
              {person.sources.map((s, i) => (
                <li key={s.url || i} id={`source-${i + 1}`}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-civil-red-body hover:underline"
                  >
                    {s.title}
                  </a>
                  {s.publisher && (
                    <span className="text-stone-500 ml-1">({s.publisher})</span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        <footer className="text-xs text-stone-500 border-t border-stone-200 pt-4 mt-10">
          <p>
            Page rendered from <code className="font-mono">/rag/people/{slug}.json</code>.
            Cross-references derived from the precomputed RAG substrate. See{' '}
            <code className="font-mono">public/rag/people/README.md</code> for schema and
            citation discipline.
          </p>
        </footer>
      </main>
    </div>
  );
}
