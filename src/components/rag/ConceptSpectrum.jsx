/**
 * @fileoverview ConceptSpectrum, visualize interviewees positioned along
 * conceptual axes computed from Voyage embeddings.
 *
 * Each axis is defined by two pole descriptions; the axis_vector is the
 * normalized difference of their embeddings. Each interview centroid is
 * projected onto the axis. The result: a 1D position per interviewee per axis.
 *
 * This is the most "philosophy of embedding" demo, the audience literally
 * watches the embedding space *take a position* on where each interviewee
 * sits along a conceptual continuum. Clicking a dot drills into the
 * passages from THAT interview most aligned with whichever pole that
 * interviewee leans toward, the RAG demonstration the page promises.
 *
 * Loads /rag/summaries/concept_axes.json (static). Drill-down passages
 * come from /retrieve (Netlify Function → Pinecone + Voyage rerank).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X, Loader2, Link2, Check } from 'lucide-react';
import { TIER_COLORS } from './tiers';
import { retrieve } from '../../services/ragClient';
import CitationCard from './CitationCard';

export default function ConceptSpectrum() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  // URL params: ?spectrumAxis=<slug> chooses the active axis;
  // ?spectrumEntry=<N> auto-selects (and drills into) that
  // interview's dot. So deep-links like
  //    /rag-explore?spectrumAxis=nonviolence-self-defense&spectrumEntry=1
  // reproduce a specific drill-down state, researchers can copy + share
  // a permalink to their finding.
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeAxis, setActiveAxis] = useState(0);
  const [hover, setHover] = useState(null);
  // selected = locked dot the user clicked. Triggers an inline /retrieve
  // call against the corpus, scoped to that interviewee's passages and
  // queried with whichever pole they lean toward, the RAG drill-down.
  const [selected, setSelected] = useState(null);
  const [drillResults, setDrillResults] = useState(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState(null);
  // Name search, when set, matching dots stay bright and non-matching
  // dots dim. Helps users find a specific voice among 136 without
  // hover-treasure-hunting.
  const [query, setQuery] = useState('');
  // Concept-query projection, the audience-facing demo of "the
  // embedding space takes a position on YOUR words". User types a
  // natural-language query; /retrieve embeds it; we dot-product the
  // resulting 1024-dim vector against each axis_vector and render a
  // marker at the projected position on each axis. Only the active
  // axis shows the marker on the main chart; a small cross-axis
  // summary table renders below.
  const [conceptInput, setConceptInput] = useState('');
  const [conceptQuery, setConceptQuery] = useState(null); // last submitted
  const [conceptEmbedding, setConceptEmbedding] = useState(null);
  const [conceptResults, setConceptResults] = useState(null);
  const [conceptLoading, setConceptLoading] = useState(false);
  const [conceptError, setConceptError] = useState(null);

  // Shared submission path used by the form submit, the example chips,
  // and the URL-driven auto-run on mount.
  const submitQuery = useCallback(async (text) => {
    if (!text || conceptLoading) return;
    setConceptInput(text);
    setConceptLoading(true);
    setConceptError(null);
    setConceptQuery(text);
    setConceptResults(null);
    try {
      // Bump topN to 5 so the user sees BOTH the geometric projection
      // (where the query lands on each axis) AND the actual retrieval
      // (which passages best match). Dedupe by entry so each result is
      // a distinct voice; one query, many ways to know it found
      // something real.
      const { results, meta } = await retrieve(text, {
        topN: 5,
        includeQueryEmbedding: true,
        dedupeByEntry: true,
      });
      if (Array.isArray(meta?.queryEmbedding) && meta.queryEmbedding.length === 1024) {
        setConceptEmbedding(meta.queryEmbedding);
      } else {
        setConceptError('Backend did not return a query embedding.');
      }
      setConceptResults(Array.isArray(results) ? results : []);
    } catch (err) {
      setConceptError(err?.detail?.message || err?.message || 'Query projection failed.');
    } finally {
      setConceptLoading(false);
    }
  }, [conceptLoading]);

  const handleConceptSubmit = useCallback((e) => {
    e?.preventDefault?.();
    submitQuery(conceptInput.trim());
  }, [conceptInput, submitQuery]);

  const clearConcept = useCallback(() => {
    setConceptInput('');
    setConceptQuery(null);
    setConceptEmbedding(null);
    setConceptResults(null);
    setConceptError(null);
  }, []);

  // One-click example queries. Picked to produce distinct cross-axis
  // patterns so the demo lands the "same embedding, different axes"
  // payoff. Clicking one populates the input AND submits in a single
  // action so visitors don't have to type or press a second button.
  const runExample = useCallback((text) => submitQuery(text), [submitQuery]);

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/summaries/concept_axes.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  // Clear the drill-down when the user switches axes, the selection
  // is axis-specific (Aaron Dixon "on the nonviolence axis" is a
  // different question than "on the sacred-vs-secular axis").
  useEffect(() => {
    setSelected(null);
    setDrillResults(null);
    setDrillError(null);
  }, [activeAxis]);

  // URL → state: on data load (or URL change from browser nav), pick
  // up spectrumAxis and spectrumEntry params and apply them.
  useEffect(() => {
    if (!data?.axes?.length) return;
    const wantSlug = searchParams.get('spectrumAxis');
    if (wantSlug) {
      const idx = data.axes.findIndex((a) => a.slug === wantSlug);
      if (idx >= 0 && idx !== activeAxis) setActiveAxis(idx);
    }
    const wantEntry = searchParams.get('spectrumEntry');
    if (wantEntry) {
      const entryNum = Number(wantEntry);
      if (Number.isFinite(entryNum) && (!selected || selected.entry_number !== entryNum)) {
        const axis = data.axes[
          wantSlug ? Math.max(0, data.axes.findIndex((a) => a.slug === wantSlug)) : activeAxis
        ];
        const p = axis?.positions?.find((x) => x.entry_number === entryNum);
        if (p) {
          setSelected({
            entry_number: p.entry_number,
            entry_subject: p.entry_subject,
            position: p.position,
            position_normalized: p.position_normalized,
            tier: p.tier,
            loc_item_url: p.loc_item_url,
          });
        }
      }
    }
    // Auto-run a query when the URL has ?spectrumQuery=…, but only
    // once per text value (not every searchParams change), so the
    // mirror-state-to-URL effect below doesn't trigger an infinite
    // re-run loop.
    const wantQuery = searchParams.get('spectrumQuery');
    if (wantQuery && wantQuery !== conceptQuery && !conceptLoading) {
      submitQuery(wantQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, searchParams]);

  // state → URL: when user changes axis, selection, or query, mirror
  // to URL so the back/forward and copy-link affordances work.
  useEffect(() => {
    if (!data?.axes?.length) return;
    const currentSlug = data.axes[activeAxis]?.slug;
    const currentEntry = selected?.entry_number;
    const next = new URLSearchParams(searchParams);
    let changed = false;
    if (currentSlug && next.get('spectrumAxis') !== currentSlug) {
      next.set('spectrumAxis', currentSlug);
      changed = true;
    }
    if (currentEntry) {
      if (next.get('spectrumEntry') !== String(currentEntry)) {
        next.set('spectrumEntry', String(currentEntry));
        changed = true;
      }
    } else if (next.has('spectrumEntry')) {
      next.delete('spectrumEntry');
      changed = true;
    }
    if (conceptQuery) {
      if (next.get('spectrumQuery') !== conceptQuery) {
        next.set('spectrumQuery', conceptQuery);
        changed = true;
      }
    } else if (next.has('spectrumQuery')) {
      next.delete('spectrumQuery');
      changed = true;
    }
    if (changed) setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAxis, selected, conceptQuery, data]);

  const handleSelect = useCallback((p) => {
    setSelected((prev) => {
      if (prev?.entry_number === p.entry_number) {
        // Click same dot again → deselect.
        setDrillResults(null);
        setDrillError(null);
        return null;
      }
      return {
        entry_number: p.entry_number,
        entry_subject: p.entry_subject,
        position: p.position,
        position_normalized: p.position_normalized,
        tier: p.tier,
        loc_item_url: p.loc_item_url,
      };
    });
  }, []);

  // Run the drill-down search whenever `selected` changes to a non-null
  // value. The axis pole the interviewee leans toward becomes the
  // semantic query; the entry filter constrains results to that
  // interview's passages only.
  useEffect(() => {
    if (!selected || !data) return undefined;
    let cancelled = false;
    const axis = data.axes[activeAxis];
    // position >= 0 means closer to pole_a per the projection math.
    const pole = selected.position >= 0 ? axis.pole_a : axis.pole_b;
    setDrillLoading(true);
    setDrillError(null);
    setDrillResults(null);
    retrieve(pole.anchor, {
      topN: 5,
      filter: { entry_number: { $eq: selected.entry_number } },
    })
      .then(({ results }) => {
        if (cancelled) return;
        setDrillResults(results || []);
      })
      .catch((e) => {
        if (cancelled) return;
        setDrillError(e?.detail?.message || e?.message || 'Drill-down search failed.');
      })
      .finally(() => {
        if (!cancelled) setDrillLoading(false);
      });
    return () => { cancelled = true; };
  }, [selected, activeAxis, data]);

  if (error) {
    return (
      <div className="text-sm text-stone-500 p-4">
        Spectrum not yet generated. Run <code className="font-mono">node --env-file=rag/.env.local rag/precompute_concept_axes.mjs</code> from the repo root.
      </div>
    );
  }

  if (!data) {
    return <div className="text-sm text-stone-500 p-4" role="status">Loading spectrum…</div>;
  }

  const axis = data.axes[activeAxis];

  // Project the user's query embedding onto EVERY axis. Same math as
  // the precompute: dot(queryVec, axis_vector). Normalize to [-1, +1]
  // using the axis's raw_range so the position lines up visually with
  // the precomputed interview dots.
  const conceptProjections = (() => {
    if (!conceptEmbedding || !data?.axes) return null;
    const out = [];
    for (const ax of data.axes) {
      if (!Array.isArray(ax.axis_vector) || ax.axis_vector.length !== conceptEmbedding.length) continue;
      let dot = 0;
      for (let i = 0; i < conceptEmbedding.length; i++) {
        dot += conceptEmbedding[i] * ax.axis_vector[i];
      }
      const [min, max] = ax.raw_range || [-1, 1];
      const range = Math.max(max - min, 1e-9);
      const position_normalized = +(((dot - min) / range) * 2 - 1).toFixed(4);
      out.push({
        slug: ax.slug,
        title: ax.title,
        pole_a_label: ax.pole_a?.label,
        pole_b_label: ax.pole_b?.label,
        position: +dot.toFixed(4),
        // Pass the raw normalized projection through unclamped, the
        // marker render clamps for display + draws an arrow for "beyond
        // corpus range" instead of silently squashing the value.
        position_normalized,
      });
    }
    return out;
  })();

  const activeProjection = conceptProjections?.find((p) => p.slug === axis.slug) || null;

  // Match set for the search filter, entry_numbers whose subject
  // includes the query (case-insensitive). null = "no filter active".
  const matched = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const set = new Set();
    for (const p of axis.positions) {
      if ((p.entry_subject || '').toLowerCase().includes(q)) {
        set.add(p.entry_number);
      }
    }
    return set;
  })();

  return (
    <div className="rag-concept-spectrum">
      <Axis
        axis={axis}
        hover={hover}
        setHover={setHover}
        selectedEntry={selected?.entry_number ?? null}
        onSelect={handleSelect}
        matched={matched}
      />

      {/* Two search boxes side by side: name-search (left, dim non-
          matches) and concept-projection (right, drop a marker on the
          axis at the projected position for the query embedding). The
          concept-projection is the audience-facing "embedding space
          takes a position on your words" demo. */}
      <div className="mt-3 mb-1 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Name search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a voice in the scatter…"
            className="w-full pl-9 pr-9 py-2 text-sm border border-stone-300 rounded-md focus:border-red-700 focus:ring-2 focus:ring-red-700/30 outline-none bg-white"
            aria-label="Find a voice in the Spectrum"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {matched && (
            <p className="text-xs text-stone-500 mt-1.5">
              {matched.size} {matched.size === 1 ? 'match' : 'matches'}
              {matched.size > 0 && ' · matching dots stay bright, names appear next to them'}
            </p>
          )}
        </div>

        {/* Concept-query projection */}
        <form onSubmit={handleConceptSubmit} className="relative">
          <input
            type="text"
            value={conceptInput}
            onChange={(e) => setConceptInput(e.target.value)}
            placeholder="Project a phrase onto this axis…"
            className="w-full pl-3 pr-24 py-2 text-sm border border-emerald-400 rounded-md focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30 outline-none bg-white"
            aria-label="Project a query onto this axis"
            disabled={conceptLoading}
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {conceptQuery && (
              <button
                type="button"
                onClick={clearConcept}
                className="p-1 text-stone-400 hover:text-stone-700"
                aria-label="Clear projection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              disabled={!conceptInput.trim() || conceptLoading}
              className="px-2.5 py-1 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {conceptLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : 'Project'}
            </button>
          </div>
          {conceptError && (
            <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1.5">
              {conceptError}
            </p>
          )}
          {!conceptError && activeProjection && conceptQuery && (
            <p className="text-xs text-stone-600 mt-1.5">
              <span className="text-emerald-700 font-medium">●</span>{' '}
              Query lands at <span className="font-mono tabular-nums">{activeProjection.position.toFixed(3)}</span>
              {' '}({activeProjection.position >= 0 ? activeProjection.pole_a_label : activeProjection.pole_b_label} side)
            </p>
          )}
          {!conceptQuery && !conceptLoading && (
            <div className="text-xs text-stone-500 mt-1.5 flex flex-wrap items-baseline gap-1.5">
              <span>Try:</span>
              {[
                'nonviolence as theology',
                'Black Power as community defense',
                'the role of women in SNCC',
                'Mississippi Freedom Summer',
              ].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => runExample(ex)}
                  className="px-2 py-0.5 rounded-full border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 hover:border-emerald-500 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Cross-axis summary: show where the same query lands on all 5
          axes. The audience sees one embedding produce 5 different
          positions, demonstrating "the same words sit differently on
          different conceptual dimensions". */}
      {conceptProjections && conceptProjections.length > 0 && conceptQuery && (
        <div className="mt-4 mb-1 p-3 rounded-md border border-emerald-200 bg-emerald-50/50">
          <p className="text-xs text-emerald-900 font-mono uppercase tracking-wide mb-2">
            Query &ldquo;{conceptQuery}&rdquo; projected onto all 5 axes
          </p>
          <ul className="space-y-1.5">
            {conceptProjections.map((proj, idx) => {
              const isActive = proj.slug === axis.slug;
              const rawN = proj.position_normalized;
              const clampedN = Math.max(-1, Math.min(1, rawN));
              const outOfRange = rawN < -1 || rawN > 1;
              const beyondLeft = rawN < -1;
              const leftPct = ((1 - clampedN) / 2) * 100;
              const leaning = proj.position >= 0 ? proj.pole_a_label : proj.pole_b_label;
              return (
                <li key={proj.slug}>
                  <button
                    type="button"
                    onClick={() => setActiveAxis(idx)}
                    className={'w-full text-left flex items-center gap-3 px-2 py-1 rounded ' + (isActive ? 'bg-white' : 'hover:bg-white')}
                  >
                    <span className="text-xs text-stone-700 flex-shrink-0 w-44 truncate">{proj.title}</span>
                    <span className="relative flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
                      <span className="absolute top-0 bottom-0 w-px bg-stone-400" style={{ left: '50%' }} aria-hidden="true" />
                      <span
                        className="absolute top-0 bottom-0 w-2 rounded-full bg-emerald-600"
                        style={{ left: `calc(${leftPct}% - 4px)` }}
                        aria-hidden="true"
                      />
                      {outOfRange && (
                        <span
                          className="absolute top-1/2 -translate-y-1/2 text-emerald-700 text-[10px] leading-none"
                          style={beyondLeft ? { left: '-10px' } : { right: '-10px' }}
                          aria-hidden="true"
                          title="Query projects beyond the observed corpus range on this axis"
                        >
                          {beyondLeft ? '◀' : '▶'}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-stone-600 flex-shrink-0 w-44 truncate text-right">
                      {leaning}
                      {outOfRange && (
                        <span className="text-emerald-700 ml-1" title="More extreme than any voice in the corpus">★</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-stone-500 mt-2">
            Same 1,024-dim embedding, projected onto five different axes. Click any row to make it the active axis above.
          </p>
        </div>
      )}

      {/* Top retrieved passages for the same query, the projection
          above is the geometric demo; this list is the actual RAG
          payoff. The audience sees: query → projected position →
          here are the voices that match it. Closes the demo loop. */}
      {conceptResults && conceptResults.length > 0 && conceptQuery && (
        <aside className="mt-4 p-4 rounded-md border border-emerald-200 bg-white">
          <p className="text-xs text-emerald-900 font-mono uppercase tracking-wide mb-2">
            Top {conceptResults.length} retrieved passages for &ldquo;{conceptQuery}&rdquo;
          </p>
          <p className="text-sm text-stone-600 mb-3">
            The same query went through full semantic retrieval, Voyage embedding → Pinecone vector search → Voyage rerank → dedupe by interviewee. These are the voices the embedding space says match.
          </p>
          <ol className="space-y-3">
            {conceptResults.map((payload) => (
              <li key={payload.id}>
                <CitationCard payload={payload} showFullText={false} />
              </li>
            ))}
          </ol>
        </aside>
      )}

      <SpectrumTooltip hover={hover} selectedEntry={selected?.entry_number ?? null} />

      {selected && (
        <DrillDown
          selected={selected}
          axis={axis}
          results={drillResults}
          loading={drillLoading}
          error={drillError}
          onClose={() => {
            setSelected(null);
            setDrillResults(null);
            setDrillError(null);
          }}
        />
      )}

      {/* Footer block: axis selector pills, the explanation of how
          the projection is computed, and the audit-tier dot color
          legend are grouped here as the chart's tail matter. The
          per-axis content sits above; everything below is invariant
          across axis selection. */}
      <div className="mt-6 mb-6 flex flex-wrap gap-2">
        {data.axes.map((ax, idx) => (
          <button
            key={ax.slug}
            type="button"
            onClick={() => setActiveAxis(idx)}
            aria-pressed={idx === activeAxis}
            className={
              'px-3 py-2 text-sm rounded-md border transition-colors ' +
              (idx === activeAxis
                ? 'border-red-700 bg-red-50 text-stone-900 font-medium'
                : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400')
            }
            style={{ fontFamily: 'Chivo Mono, monospace' }}
          >
            {ax.title.replace('↔', '↔')}
          </button>
        ))}
      </div>

      <p className="text-sm text-stone-600 mb-6 max-w-2xl">
        Each axis above is defined by two opposing concepts. We embed each pole with Voyage,
        take the unit difference vector, and project all 136 interview centroids onto it.
        The result: a 1D position per interviewee on each conceptual continuum.
        Click a dot to drill into the passages from that interview that anchor it where it is -
        the embedding space takes a position, and the retrieval shows you why.
      </p>

      {/* Dot color legend, explains the audit-tier palette so users
          understand what color each dot encodes. Reuses the pattern
          from Constellation.jsx. */}
      <div className="flex flex-wrap gap-3 mb-6 text-xs text-stone-700" aria-label="Audit-tier color legend">
        <span className="font-medium text-stone-900">Dot color (audit tier):</span>
        {Object.entries(TIER_COLORS).map(([tier, color]) => (
          <span key={tier} className="inline-flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: color, opacity: 0.85 }}
              aria-hidden="true"
            />
            {tier}
          </span>
        ))}
      </div>

      <footer className="text-xs text-stone-500 border-t border-stone-200 pt-4 mt-8">
        <p>
          Pure-math projection of pre-computed Voyage embeddings. No LLM call per query. The axis vector is <code className="font-mono">normalize(embedding(pole_A) - embedding(pole_B))</code>; each interviewee&apos;s position is the dot product of their centroid with that vector, then linearly stretched to [-1, 1]. Source: <code className="font-mono">rag/precompute_concept_axes.mjs</code>.
        </p>
      </footer>
    </div>
  );
}

function SpectrumTooltip({ hover, selectedEntry }) {
  if (!hover || typeof document === 'undefined') return null;

  // Don't render the hover tooltip on the dot the user has locked
  // (it'd compete with the drill-down panel below the chart).
  if (hover.p?.entry_number === selectedEntry) return null;

  const { p, x, y } = hover;
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const TOOLTIP_MAX = 320;
  const PAD = 12;
  const GAP = 18; // vertical offset below the cursor

  let style;
  if (x > viewportW - TOOLTIP_MAX / 2 - PAD) {
    style = { right: Math.max(PAD, viewportW - x - 8), top: y + GAP };
  } else if (x < TOOLTIP_MAX / 2 + PAD) {
    style = { left: Math.max(PAD, x - 8), top: y + GAP };
  } else {
    style = { left: x, top: y + GAP, transform: 'translateX(-50%)' };
  }

  return createPortal(
    <div
      role="tooltip"
      className="fixed z-[100] pointer-events-none"
      style={style}
    >
      <div
        className="bg-stone-900 text-white px-3 py-2 rounded shadow-xl"
        style={{ maxWidth: TOOLTIP_MAX }}
      >
        <div className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
          {p.entry_subject}
        </div>
        <div
          className="text-xs text-stone-300 mt-1"
          style={{ fontFamily: 'Chivo Mono, monospace' }}
        >
          {p.tier || 'unknown'} · projection {p.position.toFixed(3)}
        </div>
        <div className="text-xs text-amber-300 mt-1.5 font-medium" style={{ fontFamily: 'Chivo Mono, monospace' }}>
          click → see passages
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DrillDown({ selected, axis, results, loading, error, onClose }) {
  // Whichever pole the interviewee leans toward becomes the query
  // we ran. Show the user that framing so the drill-down's intent
  // is obvious.
  // position >= 0 means closer to pole_a per the projection math.
  const pole = selected.position >= 0 ? axis.pole_a : axis.pole_b;
  return (
    <aside className="mt-5 rounded-lg border-2 border-red-700 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-civil-red-body font-mono uppercase tracking-wide mb-1">
            Retrieval drill-down
          </p>
          <h4 className="text-lg sm:text-xl font-medium text-stone-900 leading-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
            Why is {selected.entry_subject} at position {selected.position.toFixed(2)}?
          </h4>
          <p className="text-sm text-stone-600 mt-1">
            Top passages from this interview most aligned with{' '}
            <strong className="text-civil-red-body">{pole.label.toLowerCase()}</strong>{' '}
            (the {selected.position >= 0 ? 'left' : 'right'}-side pole of this axis).
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <CopyLinkButton />
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 text-xs text-stone-500 hover:text-stone-900 border border-stone-300 rounded hover:border-stone-500"
          >
            close ✕
          </button>
        </div>
      </header>

      {loading && (
        <p className="text-sm text-stone-500 inline-flex items-center gap-2" role="status">
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          Searching {selected.entry_subject}&apos;s passages…
        </p>
      )}

      {error && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded p-3">
          Drill-down search failed: {error}
        </p>
      )}

      {results && results.length === 0 && !loading && !error && (
        <p className="text-sm text-stone-500">
          No passages found. This can happen for entries with very few audited chunks.
        </p>
      )}

      {results && results.length > 0 && (
        <ol className="space-y-3">
          {results.map((payload) => (
            <li key={payload.id}>
              <CitationCard payload={payload} showFullText={false} />
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}

function Axis({ axis, hover, setHover, selectedEntry, onSelect, matched }) {
  const W = 880;
  const H = 380;
  // Generous horizontal padding so the extreme dots on either end have
  // visual breathing room and never clip against the chart frame's
  // rounded corners or border.
  const PAD_X = 40;
  // Pole labels sit at the top corners of the chart so the axis
  // extremes don't compete with the dot scatter. JITTER_HALF is sized
  // so the 136 interview dots fan out across most of the chart's
  // vertical space, making every dot individually clickable instead
  // of clustering along the axis line.
  const POLE_Y = 24;
  const AXIS_Y = 210;
  const JITTER_HALF = 130;

  // High position_normalized (+1) = closer to pole_a per the projection math
  // (axisVec = normalize(eA - eB)). Flip the visual axis so pole_a renders on
  // the LEFT to match the chart's "← pole_a … pole_b →" header labels and the
  // "Most pole_a / Most pole_b" leaderboards below.
  const xFor = (pos) => PAD_X + ((1 - pos) / 2) * (W - 2 * PAD_X);

  const handleEnter = (p, e) => {
    setHover({ p, x: e.clientX, y: e.clientY });
  };

  const handleMove = (p, e) => {
    setHover({ p, x: e.clientX, y: e.clientY });
  };

  const handleFocus = (p, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHover({ p, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };

  const clearHover = () => setHover(null);

  return (
    <article>
      <header className="mb-4">
        <h3 className="text-xl font-medium text-stone-900 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          {axis.title}
        </h3>
      </header>

      {/* Each column pairs a pole anchor card with the "Most {pole}"
          leaderboard underneath it, so the two extremes of the axis
          read as a single self-contained unit above the scatter. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm">
        <div className="space-y-3">
          <div className="rounded-md border border-stone-200 bg-white p-3">
            <p className="font-medium text-stone-900 mb-1">← {axis.pole_a.label}</p>
            <p className="text-xs text-stone-600 italic">{axis.pole_a.anchor}</p>
          </div>
          <div>
            <p className="font-medium text-stone-900 mb-1">Most {axis.pole_a.label.toLowerCase()}:</p>
            <ol className="list-decimal list-inside text-stone-700 space-y-0.5">
              {axis.positions.slice(0, 5).map((p) => (
                <LeaderboardEntry key={p.entry_number} p={p} onSelect={onSelect} isSelected={selectedEntry === p.entry_number} />
              ))}
            </ol>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-md border border-stone-200 bg-white p-3">
            <p className="font-medium text-stone-900 mb-1">{axis.pole_b.label} →</p>
            <p className="text-xs text-stone-600 italic">{axis.pole_b.anchor}</p>
          </div>
          <div>
            <p className="font-medium text-stone-900 mb-1">Most {axis.pole_b.label.toLowerCase()}:</p>
            <ol className="list-decimal list-inside text-stone-700 space-y-0.5">
              {axis.positions.slice(-5).reverse().map((p) => (
                <LeaderboardEntry key={p.entry_number} p={p} onSelect={onSelect} isSelected={selectedEntry === p.entry_number} />
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white overflow-x-auto">
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Concept axis: ${axis.title}. 136 interviewees plotted by position. Click a dot to drill into their passages.`}
          style={{ display: 'block', minWidth: '720px' }}
        >
          {/* Axis line */}
          <line
            x1={PAD_X}
            y1={AXIS_Y}
            x2={W - PAD_X}
            y2={AXIS_Y}
            stroke="#a8a29e"
            strokeWidth="2"
          />

          {/* Pole labels at endpoints, lifted high above the scatter so
              they read as the axis extremes and never share vertical
              space with the dot row. */}
          <text x={PAD_X} y={POLE_Y} fontSize="14" fill="#1c1917" fontWeight="500" fontFamily="Inter, sans-serif">
            {axis.pole_a.label}
          </text>
          <text x={W - PAD_X} y={POLE_Y} fontSize="14" fill="#1c1917" fontWeight="500" fontFamily="Inter, sans-serif" textAnchor="end">
            {axis.pole_b.label}
          </text>

          {/* Dots. Vertical jitter is decorative: it spreads overlapping
              dots apart so the user can click individual ones in the
              dense middle of the axis. The y-position carries no
              meaning. The jitter band is intentionally wide so 136 dots
              do not collapse into a single unhoverable smear. */}
          {axis.positions.map((p) => {
            const cx = xFor(p.position_normalized);
            const jitterSeed = (p.entry_number * 2654435761) >>> 0;
            const jitter = ((jitterSeed % 100) / 100 - 0.5) * (2 * JITTER_HALF);
            const cy = AXIS_Y + jitter;
            const color = TIER_COLORS[p.tier] || '#b91c1c';
            const isHover = hover?.p?.entry_number === p.entry_number;
            const isSelected = selectedEntry === p.entry_number;
            const isMatch = !matched || matched.has(p.entry_number);
            const dimByFilter = matched && !isMatch;
            return (
              <g key={p.entry_number}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 9 : isHover ? 7 : (matched && isMatch ? 6 : 4)}
                  fill={isSelected ? '#F2483C' : color}
                  fillOpacity={
                    isSelected || isHover
                      ? 1
                      : dimByFilter
                        ? 0.18
                        : 0.78
                  }
                  stroke={isSelected ? '#1c1917' : isHover ? '#1c1917' : 'transparent'}
                  strokeWidth={isSelected ? 2 : 1.5}
                  onMouseEnter={(e) => handleEnter(p, e)}
                  onMouseMove={(e) => handleMove(p, e)}
                  onMouseLeave={clearHover}
                  onFocus={(e) => handleFocus(p, e)}
                  onBlur={clearHover}
                  onClick={() => onSelect(p)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(p);
                    }
                  }}
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  aria-label={`${p.entry_subject}, position ${p.position.toFixed(3)}. Click to drill into passages.`}
                />
                {/* When a name search is active, label any matching
                    dot with the entry_subject so the user can locate
                    it without hovering. Stays under the dot to avoid
                    blocking interaction. */}
                {matched && isMatch && (
                  <text
                    x={cx}
                    y={cy + 18}
                    fontSize={11}
                    fontWeight={600}
                    fill="#1c1917"
                    textAnchor="middle"
                    paintOrder="stroke"
                    stroke="rgba(255,255,255,0.95)"
                    strokeWidth={3}
                    strokeLinejoin="round"
                    style={{ pointerEvents: 'none' }}
                    fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
                  >
                    {p.entry_subject}
                  </text>
                )}

              </g>
            );
          })}
        </svg>
      </div>

    </article>
  );
}

/**
 * LeaderboardEntry, a clickable name in the "Most {pole}" lists
 * under the Spectrum chart. Clicking triggers the same drill-down
 * as clicking the dot itself, so users can drill from the easier-
 * to-read leaderboard without hunting the scatter for the dot.
 */
function LeaderboardEntry({ p, onSelect, isSelected }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(p)}
        className={
          'inline text-left hover:text-civil-red-body transition-colors ' +
          (isSelected ? 'text-civil-red-body font-semibold' : 'text-stone-700')
        }
      >
        <span className="font-medium">{p.entry_subject}</span>{' '}
        <span className="text-xs text-stone-500 tabular-nums">({p.position.toFixed(3)})</span>
      </button>
    </li>
  );
}

/**
 * CopyLinkButton, copies the current page URL (which includes
 * spectrumAxis + spectrumEntry query params) to the clipboard.
 * Lets a researcher share a deep-link to their drill-down.
 *
 * Reads the URL fresh on click rather than caching at render time,
 * so the most-current URL always lands in the clipboard.
 */
function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const handleClick = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error('[ConceptSpectrum] clipboard write failed:', e);
    }
  };
  const Icon = copied ? Check : Link2;
  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-stone-500 hover:text-stone-900 border border-stone-300 rounded hover:border-stone-500 transition-colors"
      aria-label={copied ? 'Link copied to clipboard' : 'Copy permalink to this drill-down'}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
}
