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

import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ExternalLink, ArrowLeft, Compass, Users, MessageSquareQuote, BookOpen, FileText } from 'lucide-react';
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
// Build a regex that matches any catalog display_name. Names are
// escaped, sorted longest-first (so "Aaron Dixon" matches before
// "Aaron"), bounded by word-boundaries on both sides so we don't
// match substrings inside other words. The current person's own
// display_name is excluded so a page does not self-link.
function buildNameMatcher(peopleIndex, currentSlug) {
  if (!peopleIndex?.by_slug) return null;
  const entries = Object.values(peopleIndex.by_slug)
    .filter((p) => p.slug && p.slug !== currentSlug && p.display_name);
  // Drop very short names to avoid false positives (e.g., "King" or
  // common-noun strings); require 6 or more chars for the visible
  // form.
  const usable = entries.filter((p) => p.display_name.length >= 6);
  // Sort longest-first.
  usable.sort((a, b) => b.display_name.length - a.display_name.length);
  if (usable.length === 0) return null;
  // Escape regex meta-chars in each name; allow optional period after
  // an initial inside the name (handled by escaping; literal "F."
  // matches "F.").
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const alternation = usable.map((p) => escape(p.display_name)).join('|');
  // Word boundaries: \b before, and (?=\b|\W|$) after so trailing
  // punctuation (comma, period, parenthesis) still terminates the
  // match.
  const pattern = new RegExp(`\\b(${alternation})(?=\\b|[^\\w']|$)`, 'g');
  // Build a lookup display_name -> slug for the replacement step.
  const slugByName = {};
  for (const p of usable) slugByName[p.display_name] = p.slug;
  return { pattern, slugByName };
}

// Wrap occurrences of catalog display_names inside `text` with
// /person/:slug Links. Returns an array of strings + JSX elements
// suitable for inclusion in a JSX render. The first match per name
// per render-pass becomes a link; subsequent occurrences are left
// as plain text so the page does not become a sea of red.
function hyperlinkNames(text, matcher) {
  if (!text || !matcher) return [text];
  const parts = [];
  let last = 0;
  let m;
  const linked = new Set();
  matcher.pattern.lastIndex = 0;
  while ((m = matcher.pattern.exec(text)) !== null) {
    const name = m[1];
    const slug = matcher.slugByName[name];
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (slug && !linked.has(slug)) {
      parts.push(
        <Link
          key={`link-${m.index}`}
          to={`/person/${slug}`}
          className="text-civil-red-body hover:underline focus:outline-none focus-visible:underline"
        >
          {name}
        </Link>
      );
      linked.add(slug);
    } else {
      // Already linked once in this render pass, or no slug found;
      // emit as plain text.
      parts.push(name);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderBioWithCitationRefs(text, sources, matcher) {
  if (!text) return null;
  const parts = [];
  let last = 0;
  const re = /\[src:\s*(\d+)\]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(...hyperlinkNames(text.slice(last, m.index), matcher));
    }
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
  if (last < text.length) {
    parts.push(...hyperlinkNames(text.slice(last), matcher));
  }
  return parts;
}

export default function PersonPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [crossLinks, setCrossLinks] = useState(null);
  const [peopleIndex, setPeopleIndex] = useState(null);

  // Always load the people index. PersonPage runs for both interviewees
  // (which also fetch concept axes / neighbors / tours) and external
  // figures (which don't), but both render bios that should have
  // narrative-hyperlinked figure names. Loading the index unconditionally
  // gives the narrative-hyperlink matcher the catalog it needs.
  useEffect(() => {
    let cancelled = false;
    fetchJsonOrNull('/rag/people/index.json').then((idx) => {
      if (!cancelled) setPeopleIndex(idx);
    });
    return () => { cancelled = true; };
  }, []);

  // Memoize the name matcher, recomputing only when the slug or the
  // people index changes. The matcher builds a longest-first regex of
  // all catalog display_names (excluding the current page's name),
  // used by renderBioWithCitationRefs to hyperlink in-text figure
  // names to /person/:slug.
  const nameMatcher = useMemo(
    () => buildNameMatcher(peopleIndex, slug),
    [peopleIndex, slug]
  );

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
      // Compute the influence-graph out-edges from this person's
      // interview to other figures (in-corpus or external). The
      // influence.json schema has flat nodes + edges arrays:
      // edges come as { from: 'in:N', to: 'in:M' | 'ext:slug', count }.
      // Resolve each `to` to its node (for name + in_corpus + kind)
      // and emit a flat list the renderer can consume. Sorted by
      // edge count descending.
      const fromId = `in:${person.entry_number}`;
      const nodesById = new Map((influence?.nodes || []).map((n) => [n.id, n]));
      const influenceOut = ((influence?.edges || [])
        .filter((e) => e.from === fromId)
        .map((e) => {
          const target = nodesById.get(e.to);
          if (!target) return null;
          // Slug resolution:
          //   - in-corpus: take from people-index by entry_number
          //     (which respects the joint-page preference)
          //   - external: the id suffix after "ext:" IS the slug,
          //     and we also confirm via peopleIndex.by_slug
          //     when the external figure now has a catalog page
          let slug = null;
          if (target.in_corpus && target.entry_number != null) {
            slug = peopleIndex?.by_entry?.[target.entry_number]?.slug || null;
          } else if (target.id && target.id.startsWith('ext:')) {
            const candidate = target.id.slice(4);
            if (peopleIndex?.by_slug?.[candidate]) {
              slug = candidate;
            } else if (target.name) {
              // Fallback: normalize the name and look up in
              // by_normalized_name (catches catalog-page additions
              // that used a different slug from the influence-graph
              // ext:slug convention).
              const normName = target.name
                .toLowerCase()
                .normalize('NFKD')
                .replace(/[̀-ͯ]/g, '')
                .replace(/[^a-z0-9]+/g, ' ')
                .trim()
                .replace(/\s+/g, ' ');
              slug = peopleIndex?.by_normalized_name?.[normName] || null;
            }
          }
          return {
            id: target.id,
            name: target.name,
            in_corpus: !!target.in_corpus,
            slug,
            count: e.count || 0,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.count - a.count));
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
        peopleIndex,
      });
    });
    return () => { cancelled = true; };
  }, [person, peopleIndex]);

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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-stone-700 hover:text-stone-900 focus:outline-none focus-visible:underline"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back
          </button>
          {/* Anchor link to the catalog browse page. When the visitor
              arrived via a direct URL (a shared link, a search result,
              a bookmark) navigate(-1) goes back to the document.referrer
              which may be outside the site; this link gives a reliable
              in-site path to the catalog index. */}
          <Link
            to="/people"
            className="inline-flex items-center gap-1 text-sm text-stone-700 hover:text-stone-900 focus:outline-none focus-visible:underline"
          >
            <Users className="w-4 h-4" aria-hidden="true" />
            All people
          </Link>
        </div>

        {/* Identity block: name + role + dates + tier, full width
            above the body prose. The portrait is floated INTO the
            prose below (magazine-style), not sidebar'd to one side,
            so the page reads as illustrated continuous text rather
            than as two side-by-side columns. */}
        <header className="mb-6 max-w-3xl">
          <p className="text-civil-red-body text-xs font-light font-mono mb-1 uppercase tracking-wide">
            {person.person_type === 'interviewee'
              ? 'Civil Rights History Project · Interviewee'
              : 'Discussed by corpus voices · Not interviewed'}
          </p>
          <h1
            className="text-stone-900 text-3xl sm:text-4xl md:text-5xl font-medium mb-2 leading-tight"
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
        </header>

        {/* Body prose, with the portrait floated INTO the text so
            paragraphs wrap around it (the magazine / encyclopedia
            article pattern, distinct from the dictionary-style
            sidebar layout). The float clears at the end of the body
            wrapper, so source-list rendering below stays on its own
            line. */}
        <div className="max-w-3xl mb-10">
          {person.photo && (person.photo.src_local || person.photo.src_external) ? (
            <figure className="float-right ml-6 mb-3 w-2/5 sm:w-1/3 max-w-[18rem]">
              <img
                src={person.photo.src_local || person.photo.src_external}
                alt={person.photo.alt || person.display_name}
                className="w-full object-cover rounded-md border border-stone-300 bg-white"
                loading="lazy"
              />
              <figcaption className="text-[10px] text-stone-500 mt-1.5 leading-tight">
                {person.photo.photographer && `Photo: ${person.photo.photographer}. `}
                {person.photo.repository && `${person.photo.repository}. `}
                {person.photo.license || ''}
              </figcaption>
            </figure>
          ) : (
            // Initial-letter avatar fallback floats inside the prose
            // the same way an actual portrait would; the body wraps
            // around it so photo-less pages have the same magazine-
            // article feel as photographed pages.
            <div
              aria-hidden="true"
              className="float-right ml-6 mb-3 w-2/5 sm:w-1/3 max-w-[18rem] aspect-square rounded-md border border-stone-300 flex items-center justify-center"
              style={{ backgroundColor: '#F2483C' }}
            >
              <span
                className="text-7xl sm:text-8xl md:text-9xl font-medium"
                style={{ color: '#EBEAE9', fontFamily: 'Source Serif 4, serif' }}
              >
                {(person.display_name || '?').trim().charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* AI's reading. Headline content per the catalog discipline:
              a specific embedding-derived observation that the cultural
              record hasn't foregrounded. */}
          {person.ai_reading && (
            <section className="mb-6">
              <div className="border-l-4 border-civil-red-strong pl-5 py-1">
                <p className="text-xs uppercase tracking-wide font-mono text-civil-red-body mb-2 font-semibold">
                  What the embedding finds
                </p>
                <p className="text-stone-800 text-base leading-relaxed" style={{ fontFamily: 'Source Serif 4, serif' }}>
                  {renderBioWithCitationRefs(person.ai_reading, person.sources, nameMatcher)}
                </p>
              </div>
            </section>
          )}

          {/* Biographical paragraph. Historical orientation behind the
              AI's-reading section above; cited from external sources
              (LoC first, Wikipedia last). Reads as supporting context
              rather than the headline. */}
          {person.biographical_paragraph && (
            <section>
              {person.ai_reading && (
                <p className="text-xs uppercase tracking-wide font-mono text-stone-500 mb-2">
                  Historical orientation
                </p>
              )}
              <p className="text-stone-800 text-base leading-relaxed" style={{ fontFamily: 'Source Serif 4, serif' }}>
                {renderBioWithCitationRefs(person.biographical_paragraph, person.sources, nameMatcher)}
              </p>
            </section>
          )}
          {/* Clear the float so cross-link sections below render
              full-width and don't get pulled up alongside the
              portrait. */}
          <div className="clear-both" />
        </div>

        {/* Cross-link manifest. Only renders for interviewees (need
            entry_number to look anything up). Each section appears
            only if its precomputed substrate file actually has data
            for this entry. Visual treatment: section icons + colored
            chips for tier-bearing entries, inline mini-bars for
            concept-axis positions. The manifest IS the page's
            primary value (per public/rag/people/README.md), so the
            visual density and color are deliberate, not decorative. */}
        {crossLinks && (
          <section className="mb-12 space-y-8">

            {/* Primary-source link to the LoC catalog item.
                Compact, prominent so visitors can ground the page in
                the underlying interview. */}
            {crossLinks.locItemUrl && (
              <article>
                <h2 className="text-stone-900 text-sm font-semibold uppercase tracking-wide font-mono mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-civil-red-strong" aria-hidden="true" />
                  Primary source
                </h2>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <a
                    href={crossLinks.locItemUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-civil-red-body hover:underline font-medium"
                  >
                    Library of Congress item
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                  {crossLinks.chunkCount > 0 && (
                    <span className="text-xs text-stone-600">
                      <span className="font-medium text-stone-900 tabular-nums">{crossLinks.chunkCount}</span> time-anchored passages in the corpus
                    </span>
                  )}
                </div>
              </article>
            )}

            {/* Concept-axis positions, the embedding-substrate's
                opinion of where this person sits along each named
                conceptual continuum. Rendered as inline horizontal
                mini-bars filled in red proportional to position
                (0 = pole_low pole, 100 = pole_high pole), with the
                pole labels below the bar so the visitor can read the
                axis without leaving the page. Each row is a link
                that opens the Concept Spectrum at the page top with
                this entry pre-selected on that axis. */}
            {crossLinks.axisPositions && crossLinks.axisPositions.length > 0 && (
              <article>
                <h2 className="text-stone-900 text-sm font-semibold uppercase tracking-wide font-mono mb-3 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-civil-red-strong" aria-hidden="true" />
                  Position on concept axes
                </h2>
                <ul className="space-y-3 list-none p-0 max-w-2xl">
                  {crossLinks.axisPositions.map((axis) => {
                    // position_normalized ranges from -1 (pole_low) to
                    // +1 (pole_high), centered on 0. Convert linearly
                    // to a 0-100 percentage along the bar (0 = fully
                    // toward pole_low, 100 = fully toward pole_high).
                    // The earlier formula `position_normalized * 100`
                    // wrongly clamped negative positions to 0%, hiding
                    // every interviewee in the bottom half of any axis.
                    const pct = axis.position_normalized != null
                      ? Math.max(0, Math.min(100, Math.round((axis.position_normalized + 1) * 50)))
                      : null;
                    return (
                      <li key={axis.slug}>
                        <Link
                          to={`/rag-explore?spectrumAxis=${axis.slug}&spectrumEntry=${person.entry_number}`}
                          className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded-md p-1 -m-1"
                        >
                          <div className="flex items-baseline justify-between mb-1.5">
                            <span className="text-sm font-medium text-stone-800 group-hover:text-civil-red-strong">
                              {axis.label}
                            </span>
                            {pct != null && (
                              <span className="text-xs text-stone-500 tabular-nums">
                                {pct}% toward {axis.position_normalized >= 0 ? axis.pole_high : axis.pole_low}
                              </span>
                            )}
                          </div>
                          <div
                            className="relative h-2 bg-stone-200 rounded-full overflow-hidden"
                            role="progressbar"
                            aria-label={`${axis.label}: ${pct ?? 'unknown'}% along axis`}
                            aria-valuenow={pct ?? undefined}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          >
                            {pct != null && (
                              <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-civil-red-strong/60 to-civil-red-strong rounded-full group-hover:from-civil-red-strong group-hover:to-civil-red-strong/80"
                                style={{ width: `${pct}%` }}
                              />
                            )}
                          </div>
                          <div className="flex justify-between mt-1 text-[10px] text-stone-500">
                            <span>{axis.pole_low}</span>
                            <span className="text-right">{axis.pole_high}</span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </article>
            )}

            {/* Semantic neighbors, the precomputed top-related
                interviewees from /rag/related/entry-${N}.json.
                Rendered as portrait+name+tier cards so every catalog
                page pulls in 4-6 small portraits from its neighbors,
                even when the page itself has no photo. */}
            {crossLinks.related && crossLinks.related.length > 0 && (
              <article>
                <h2 className="text-stone-900 text-sm font-semibold uppercase tracking-wide font-mono mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-civil-red-strong" aria-hidden="true" />
                  Semantic neighbors in the corpus
                </h2>
                <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 list-none p-0 mb-3">
                  {crossLinks.related.map((r) => {
                    const neighbor = crossLinks.constellation?.points?.find(
                      (p) => p.entry_number === r.entry_number
                    );
                    if (!neighbor) return null;
                    const badge = TIER_BADGE[neighbor.uncertainty_tier] || {
                      bg: 'bg-stone-100',
                      border: 'border-stone-300',
                      text: 'text-stone-700',
                    };
                    const neighborSlug = peopleIndex?.by_entry?.[r.entry_number]?.slug || null;
                    const neighborSummary = neighborSlug ? peopleIndex?.by_slug?.[neighborSlug] : null;
                    const toUrl = neighborSlug
                      ? `/person/${neighborSlug}`
                      : `/rag-explore?tab=related&entry=${r.entry_number}`;
                    const initial = (neighbor.entry_subject || '?').trim().charAt(0).toUpperCase();
                    return (
                      <li key={r.entry_number}>
                        <Link
                          to={toUrl}
                          className="flex items-center gap-3 p-2 rounded-md border border-stone-200 bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 transition-shadow"
                          title={`Audit tier: ${neighbor.uncertainty_tier || 'unknown'}; ${r.count} shared passages`}
                        >
                          {neighborSummary?.photo_src ? (
                            <img
                              src={neighborSummary.photo_src}
                              alt=""
                              className="w-12 h-12 rounded-md object-cover border border-stone-300 bg-stone-100 shrink-0"
                              loading="lazy"
                            />
                          ) : (
                            <div
                              aria-hidden="true"
                              className="w-12 h-12 rounded-md flex items-center justify-center shrink-0"
                              style={{ backgroundColor: '#F2483C' }}
                            >
                              <span
                                className="text-xl font-medium"
                                style={{ color: '#EBEAE9', fontFamily: 'Source Serif 4, serif' }}
                              >
                                {initial}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className={`text-sm leading-tight truncate ${badge.text}`}>
                              {neighbor.entry_subject}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`w-2 h-2 rounded-full ${badge.bg.replace('bg-', 'bg-').replace('-100', '-400').replace('-50', '-300')} border ${badge.border}`} aria-hidden="true" />
                              <span className="text-xs text-stone-500 tabular-nums">{r.count} shared</span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-stone-500">
                  Number on each chip is the count of shared passages; the dot indicates the neighbor&apos;s audit tier. Full list on the{' '}
                  <Link
                    to={`/rag-explore?tab=related&entry=${person.entry_number}`}
                    className="text-civil-red-body hover:underline"
                  >
                    Semantic Overlap tab
                  </Link>.
                </p>
              </article>
            )}

            {/* Influence out-edges: figures discussed in THIS
                interview. In-corpus figures link to their own
                /person/:slug page; out-of-corpus figures render as
                plain text. */}
            {crossLinks.influenceOut && crossLinks.influenceOut.length > 0 && (
              <article>
                <h2 className="text-stone-900 text-sm font-semibold uppercase tracking-wide font-mono mb-3 flex items-center gap-1.5">
                  <MessageSquareQuote className="w-4 h-4 text-civil-red-strong" aria-hidden="true" />
                  Discussed in this interview
                </h2>
                <ul className="flex flex-wrap gap-2 list-none p-0">
                  {crossLinks.influenceOut.slice(0, 12).map((d) => {
                    const label = d.name || d.id;
                    // Hyperlink when the figure has a catalog page,
                    // regardless of in_corpus status. External
                    // figures whose catalog pages were added after
                    // the influence graph was precomputed are
                    // resolved via the people-index by_slug +
                    // by_normalized_name fallback in the loader
                    // above.
                    if (d.slug) {
                      return (
                        <li key={d.id || label}>
                          <Link
                            to={`/person/${d.slug}`}
                            className="inline-flex items-center px-3 py-1 rounded-full border border-civil-red-strong/40 bg-red-50 text-civil-red-body text-sm hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                          >
                            {label}
                          </Link>
                        </li>
                      );
                    }
                    return (
                      <li key={d.id || label}>
                        <span className="inline-flex items-center px-3 py-1 rounded-full border border-stone-300 bg-white text-stone-700 text-sm">
                          {label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            )}

            {/* Curated tour appearances. */}
            {crossLinks.tours && crossLinks.tours.length > 0 && (
              <article>
                <h2 className="text-stone-900 text-sm font-semibold uppercase tracking-wide font-mono mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-civil-red-strong" aria-hidden="true" />
                  In curated tours
                </h2>
                <ul className="flex flex-wrap gap-2 list-none p-0">
                  {crossLinks.tours.map((t) => (
                    <li key={t.slug}>
                      <Link
                        to={`/rag-explore?tab=tours&tour=${t.slug}`}
                        className="inline-flex items-center px-3 py-1 rounded-full border border-stone-900 bg-white text-stone-900 text-sm hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
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
            citation and see exactly which source supports the claim.
            Renders as bibliographic text only (no clickable outbound
            link) so the page does not bleed SEO authority to external
            domains and does not surface 404s when external URLs rot.
            A researcher who wants to look up a source can copy the
            title or OCLC and search themselves. */}
        {person.sources && person.sources.length > 0 && (
          <section className="mt-10 border-t border-stone-300 pt-6">
            <h2 className="text-stone-900 text-sm font-semibold uppercase tracking-wide font-mono mb-3">
              Sources
            </h2>
            <ol className="text-sm space-y-2 list-decimal pl-5">
              {person.sources.map((s, i) => (
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
