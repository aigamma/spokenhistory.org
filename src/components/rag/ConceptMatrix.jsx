/**
 * @fileoverview ConceptMatrix, show the SAME 136 interviewees through
 * four DIFFERENT pairs of named concept axes simultaneously, with
 * cross-chart hover sync so you watch a single voice move when you
 * change the lens.
 *
 * Why this exists: Nomic Atlas + UMAP + PCA all share the same
 * pedagogical failure, they give you a 2D scatter where the axes
 * have no human-readable meaning, only "directions of max variance."
 * The viewer hovers a dot and learns who's there, but nothing about
 * WHY they're there or what the structure represents. Atlas itself
 * doesn't try to explain because the axes can't BE explained, they're
 * statistical leftovers.
 *
 * This component flips the framing. Instead of one un-labeled projection,
 * show many projections where every axis has a hand-curated name. We
 * already have rag/precompute_concept_axes.mjs computing 5 such axes
 *, each defined by two pole descriptions whose unit-difference vector
 * is the axis. Project every interview onto each axis (a dot product
 * with that vector) and plot pairs as 2D scatters.
 *
 * The educational reveal is the cross-chart sync. Hover Aaron Dixon
 * in chart 1, see him land toward "armed self-defense." Same hover
 * highlights him in chart 2, now he's toward "tactical pragmatism."
 * Chart 3, toward "collective discipline." His one voice exists at
 * different coordinates in every named-concept space, and the user
 * learns what the structure means by watching it shift.
 *
 * That's the trick Nomic doesn't do, they show one projection per
 * dataset; we show four lenses on the same data and let the
 * interrelation teach.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { TIER_COLORS } from './tiers';
import { retrieve } from '../../services/ragClient';
import CitationCard from './CitationCard';

// Strategic pair selection, five axes give ten possible pairs; we
// surface four that read as distinct conceptual quadrants of the
// movement's intellectual space.
const AXIS_PAIRS = [
  ['nonviolence-self-defense', 'sacred-secular'],
  ['tactical-strategic', 'individual-collective'],
  ['southern-northern', 'nonviolence-self-defense'],
  ['sacred-secular', 'individual-collective'],
];

export default function ConceptMatrix() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [hoveredEntry, setHoveredEntry] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  // Concept-query projection, same idea as the Spectrum's projection
  // input, but here the query renders on ALL 4 charts simultaneously
  // at (xAxisProj, yAxisProj). User types a phrase, sees the embedding
  // space take a position on it across every concept-pair lens.
  const [conceptInput, setConceptInput] = useState('');
  const [conceptQuery, setConceptQuery] = useState(null);
  const [conceptLoading, setConceptLoading] = useState(false);
  const [conceptError, setConceptError] = useState(null);
  const [queryProjections, setQueryProjections] = useState(null);
  const [conceptResults, setConceptResults] = useState(null);

  const handleConceptSubmit = useCallback(async (e) => {
    e?.preventDefault?.();
    const q = conceptInput.trim();
    if (!q || conceptLoading || !data?.axes) return;
    setConceptLoading(true);
    setConceptError(null);
    setConceptQuery(q);
    setConceptResults(null);
    try {
      const { results, meta } = await retrieve(q, {
        topN: 5,
        includeQueryEmbedding: true,
        dedupeByEntry: true,
      });
      const qVec = meta?.queryEmbedding;
      if (!Array.isArray(qVec) || qVec.length !== 1024) {
        throw new Error('Backend did not return a 1024-dim query embedding.');
      }
      const proj = {};
      for (const ax of data.axes) {
        if (!Array.isArray(ax.axis_vector) || ax.axis_vector.length !== qVec.length) continue;
        let dot = 0;
        for (let i = 0; i < qVec.length; i++) dot += qVec[i] * ax.axis_vector[i];
        const [min, max] = ax.raw_range || [-1, 1];
        const range = Math.max(max - min, 1e-9);
        const normalized = ((dot - min) / range) * 2 - 1;
        proj[ax.slug] = { raw: dot, normalized };
      }
      setQueryProjections(proj);
      setConceptResults(Array.isArray(results) ? results : []);
    } catch (err) {
      setConceptError(err?.detail?.message || err?.message || 'Query projection failed.');
      setQueryProjections(null);
    } finally {
      setConceptLoading(false);
    }
  }, [conceptInput, conceptLoading, data]);

  const clearConcept = useCallback(() => {
    setConceptInput('');
    setConceptQuery(null);
    setQueryProjections(null);
    setConceptResults(null);
    setConceptError(null);
  }, []);

  // One-click example queries, same set as Spectrum so visitors get
  // consistent prompts across surfaces.
  const runExample = useCallback(async (text) => {
    if (!data?.axes) return;
    setConceptInput(text);
    setConceptLoading(true);
    setConceptError(null);
    setConceptQuery(text);
    setConceptResults(null);
    try {
      const { results, meta } = await retrieve(text, {
        topN: 5,
        includeQueryEmbedding: true,
        dedupeByEntry: true,
      });
      const qVec = meta?.queryEmbedding;
      if (!Array.isArray(qVec) || qVec.length !== 1024) {
        throw new Error('Backend did not return a 1024-dim query embedding.');
      }
      const proj = {};
      for (const ax of data.axes) {
        if (!Array.isArray(ax.axis_vector) || ax.axis_vector.length !== qVec.length) continue;
        let dot = 0;
        for (let i = 0; i < qVec.length; i++) dot += qVec[i] * ax.axis_vector[i];
        const [min, max] = ax.raw_range || [-1, 1];
        const range = Math.max(max - min, 1e-9);
        const normalized = ((dot - min) / range) * 2 - 1;
        proj[ax.slug] = { raw: dot, normalized };
      }
      setQueryProjections(proj);
      setConceptResults(Array.isArray(results) ? results : []);
    } catch (err) {
      setConceptError(err?.detail?.message || err?.message || 'Query projection failed.');
      setQueryProjections(null);
    } finally {
      setConceptLoading(false);
    }
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/summaries/concept_axes.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  // Build entry_number → full profile (all 5 axis positions + meta).
  const profilesById = useMemo(() => {
    if (!data?.axes) return null;
    const map = new Map();
    for (const axis of data.axes) {
      for (const pos of axis.positions) {
        if (!map.has(pos.entry_number)) {
          map.set(pos.entry_number, {
            entry_number: pos.entry_number,
            entry_subject: pos.entry_subject,
            tier: pos.tier,
            loc_item_url: pos.loc_item_url,
            positions: {},
          });
        }
        map.get(pos.entry_number).positions[axis.slug] = pos.position_normalized;
      }
    }
    return map;
  }, [data]);

  const axesById = useMemo(() => {
    if (!data?.axes) return null;
    const map = new Map();
    for (const ax of data.axes) map.set(ax.slug, ax);
    return map;
  }, [data]);

  if (error) {
    return (
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-6 text-sm text-stone-600">
        <p>Concept-axes data not yet generated.</p>
        <p className="font-mono mt-2 text-xs">
          node --env-file=rag/.env.local rag/precompute_concept_axes.mjs
        </p>
      </div>
    );
  }

  if (!data || !profilesById || !axesById) {
    return <div className="text-sm text-stone-500 p-4" role="status">Loading concept axes…</div>;
  }

  const focusEntry = selectedEntry ?? hoveredEntry;
  const focusProfile = focusEntry != null ? profilesById.get(focusEntry) : null;

  return (
    <div className="rag-concept-matrix">
      <p className="text-sm text-stone-600 mb-4 max-w-3xl">
        Four lenses on the same 136 interviewees. Every axis is a
        hand-curated semantic dimension, not a statistical leftover like
        UMAP, so the structure you see is interpretable.{' '}
        <strong>Hover any dot</strong> to watch the same voice move
        across the other three lenses. <strong>Click</strong> to lock the
        highlight and see the full five-axis profile below.
      </p>

      {/* Concept-query projection input, type a phrase and watch a
          green ✕ land on ALL 4 charts at the projected (x, y). Same
          1,024-dim embedding, four different 2D coordinate systems. */}
      <form onSubmit={handleConceptSubmit} className="mb-4 max-w-2xl">
        <div className="relative">
          <input
            type="text"
            value={conceptInput}
            onChange={(e) => setConceptInput(e.target.value)}
            placeholder="Project a phrase onto all 5 lenses…"
            className="w-full pl-3 pr-24 py-2 text-sm border border-emerald-400 rounded-md focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30 outline-none bg-white dark:bg-stone-900 dark:border-emerald-700 dark:text-stone-100"
            aria-label="Project a query phrase across all five lenses"
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
        </div>
        {conceptError && (
          <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 dark:text-amber-200 dark:bg-amber-950/40 dark:border-amber-800 rounded px-2 py-1 mt-1.5">
            {conceptError}
          </p>
        )}
        {queryProjections && conceptQuery && (
          <p className="text-xs text-emerald-900 dark:text-emerald-300 mt-1.5">
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">✕</span>{' '}
            &ldquo;{conceptQuery}&rdquo;, green ✕ on each chart shows where the same query lands in that pair of axes.
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
                className="px-2 py-0.5 rounded-full border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 hover:border-emerald-500 dark:bg-stone-900 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950 dark:hover:border-emerald-500 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Cross-axis summary: when a query is active, show where the
          same 1024-dim embedding lands on all 5 concept axes as
          horizontal bars. One embedding, five conceptual readings. */}
      {queryProjections && conceptQuery && (
        <div className="mb-5 p-4 rounded-md border border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/40">
          <p className="text-xs text-emerald-900 dark:text-emerald-200 font-mono uppercase tracking-wide mb-3">
            Query &ldquo;{conceptQuery}&rdquo; on all 5 spectrums
          </p>
          <ul className="space-y-2">
            {data.axes.map((ax) => {
              const proj = queryProjections[ax.slug];
              if (!proj) return null;
              const rawN = proj.normalized;
              const clampedN = Math.max(-1, Math.min(1, rawN));
              const outOfRange = rawN < -1 || rawN > 1;
              const beyondLeft = rawN < -1;
              const leftPct = ((1 - clampedN) / 2) * 100;
              const leaning = proj.raw >= 0 ? ax.pole_a.label : ax.pole_b.label;
              return (
                <li key={ax.slug} className="flex items-center gap-3 px-2 py-1">
                  <span className="text-xs text-stone-700 flex-shrink-0 w-44 truncate text-right">{ax.pole_a.label}</span>
                  <span className="relative flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
                    <span className="absolute top-0 bottom-0 w-px bg-stone-400" style={{ left: '50%' }} aria-hidden="true" />
                    <span
                      className="absolute top-0 bottom-0 w-2 rounded-full bg-emerald-600"
                      style={{ left: `calc(${leftPct}% - 4px)` }}
                      aria-hidden="true"
                    />
                    {outOfRange && (
                      <span
                        className="absolute top-1/2 -translate-y-1/2 text-emerald-700 dark:text-emerald-400 text-[10px] leading-none"
                        style={beyondLeft ? { left: '-10px' } : { right: '-10px' }}
                        aria-hidden="true"
                        title="Query projects beyond the observed corpus range on this axis"
                      >
                        {beyondLeft ? '◀' : '▶'}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-stone-700 flex-shrink-0 w-44 truncate">{ax.pole_b.label}</span>
                  <span className="text-xs text-stone-500 flex-shrink-0 w-24 truncate text-right tabular-nums">
                    {leaning.split(' ')[0]}
                    {outOfRange && <span className="text-emerald-700 dark:text-emerald-400 ml-1" title="More extreme than any voice in the corpus">★</span>}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-stone-500 mt-3">
            Same 1,024-dim embedding, five conceptual axes. The green tick on each bar is where your query lands relative to each axis&apos;s poles.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {AXIS_PAIRS.map(([xSlug, ySlug]) => {
          const queryPoint = queryProjections && queryProjections[xSlug] && queryProjections[ySlug]
            ? {
                x: queryProjections[xSlug].normalized,
                y: queryProjections[ySlug].normalized,
                label: conceptQuery,
              }
            : null;
          return (
            <MiniScatter
              key={`${xSlug}-${ySlug}`}
              axisX={axesById.get(xSlug)}
              axisY={axesById.get(ySlug)}
              profilesById={profilesById}
              highlightEntry={focusEntry}
              onHover={setHoveredEntry}
              onSelect={(n) => setSelectedEntry((cur) => (cur === n ? null : n))}
              queryPoint={queryPoint}
            />
          );
        })}
      </div>

      {focusProfile && (
        <FiveAxisProfile
          profile={focusProfile}
          axes={data.axes}
          locked={selectedEntry != null}
          onClear={() => setSelectedEntry(null)}
        />
      )}

      {/* Top retrieved passages for the same query, closes the loop:
          query → geometric projection on 5 lenses → here are the voices
          that match. */}
      {conceptResults && conceptResults.length > 0 && conceptQuery && (
        <aside className="mt-5 p-4 rounded-md border border-emerald-200 bg-white dark:border-emerald-800">
          <p className="text-xs text-emerald-900 dark:text-emerald-200 font-mono uppercase tracking-wide mb-2">
            Top {conceptResults.length} retrieved passages for &ldquo;{conceptQuery}&rdquo;
          </p>
          <p className="text-sm text-stone-600 mb-3">
            The green ✕ above shows where the query lands geometrically; this list shows the actual voices it matches. One query, one embedding, both visualizations come from the same vector.
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

      {/* Dot color legend, explains the audit-tier palette across
          all 4 mini-scatters. Same encoding the rest of the site uses. */}
      <div className="flex flex-wrap gap-3 mt-5 mb-2 text-xs text-stone-700" aria-label="Audit-tier color legend">
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

      <footer className="text-xs text-stone-500 border-t border-stone-200 pt-3 mt-6 max-w-3xl">
        Source: <code className="font-mono">public/rag/summaries/concept_axes.json</code>.
        Each axis vector is{' '}
        <code className="font-mono">normalize(embedding(pole_A) - embedding(pole_B))</code>;
        each interview&apos;s position is the dot product of its centroid with that vector,
        stretched to <code className="font-mono">[-1, +1]</code>. Pure projection, no LLM
        per query.
      </footer>
    </div>
  );
}

function MiniScatter({ axisX, axisY, profilesById, highlightEntry, onHover, onSelect, queryPoint }) {
  const W = 460;
  const H = 340;
  // Bump horizontal padding so the extreme-right and extreme-left dots
  // never clip against the chart frame's rounded corners.
  const PAD_L = 36;
  const PAD_R = 36;
  const PAD_T = 36;
  const PAD_B = 36;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  // High position_normalized (+1) = closer to pole_a per the projection math
  // (axisVec = normalize(eA - eB)). The labels show pole_a on the LEFT and on
  // the TOP, so projectX maps +1 → left and projectY maps +1 → top to match.
  const projectX = (x) => PAD_L + ((1 - x) / 2) * innerW;
  const projectY = (y) => PAD_T + ((1 - y) / 2) * innerH;

  // useMemo runs unconditionally (rules-of-hooks) and guards internally
  // against missing axes so the early-return below stays safe.
  const points = useMemo(() => {
    if (!axisX || !axisY || !profilesById) return [];
    const out = [];
    for (const profile of profilesById.values()) {
      const x = profile.positions[axisX.slug];
      const y = profile.positions[axisY.slug];
      if (typeof x !== 'number' || typeof y !== 'number') continue;
      out.push({
        entry_number: profile.entry_number,
        entry_subject: profile.entry_subject,
        tier: profile.tier,
        cx: projectX(x),
        cy: projectY(y),
        color: TIER_COLORS[profile.tier] || '#78716c',
      });
    }
    return out;
    // projectX/projectY are derived from W/PAD_L/etc constants that
    // never change between renders, so omitting them from the deps is
    // safe and avoids triggering the exhaustive-deps lint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axisX, axisY, profilesById]);

  if (!axisX || !axisY) return null;

  return (
    <figure className="rounded-md border border-stone-200 bg-white overflow-hidden">
      {/* TODO(dark-mode): MiniScatter SVG interior fills are hardcoded for light
          theme and need dark variants read from a theme flag: the two axis lines
          ('#d6d3d1'), the four pole labels ('#57534e'), the title strip ('#1c1917',
          goes dark-on-dark), and the query-marker white stroke halo ('#fff' /
          'rgba(255,255,255,0.95)'). The SVG background inverts via the bg-white
          container; dot fills come from TIER_COLORS and are theme-safe. */}
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Scatter: ${axisX.title} (x) vs ${axisY.title} (y).`}
        style={{ display: 'block' }}
      >
        {/* Axis lines */}
        <line
          x1={PAD_L} y1={PAD_T + innerH / 2}
          x2={W - PAD_R} y2={PAD_T + innerH / 2}
          stroke="#d6d3d1" strokeWidth={1}
        />
        <line
          x1={PAD_L + innerW / 2} y1={PAD_T}
          x2={PAD_L + innerW / 2} y2={H - PAD_B}
          stroke="#d6d3d1" strokeWidth={1}
        />

        {/* X-axis pole labels */}
        <text x={PAD_L} y={H - PAD_B + 18} fontSize="10" fill="#57534e" fontWeight={500} fontFamily="ui-sans-serif, system-ui, sans-serif">
          ← {axisX.pole_a.label}
        </text>
        <text x={W - PAD_R} y={H - PAD_B + 18} fontSize="10" fill="#57534e" fontWeight={500} fontFamily="ui-sans-serif, system-ui, sans-serif" textAnchor="end">
          {axisX.pole_b.label} →
        </text>

        {/* Y-axis pole labels (rotated). Top = pole_a, bottom = pole_b
            because positive y is "up" but in SVG up = lower Y value */}
        <text
          x={PAD_L - 12} y={PAD_T + 2}
          fontSize="10" fill="#57534e" fontWeight={500}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          ↑ {axisY.pole_a.label}
        </text>
        <text
          x={PAD_L - 12} y={H - PAD_B - 4}
          fontSize="10" fill="#57534e" fontWeight={500}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          ↓ {axisY.pole_b.label}
        </text>

        {/* Title strip at the top */}
        <text
          x={W / 2} y={18}
          fontSize="11" textAnchor="middle"
          fill="#1c1917" fontWeight={500}
          fontFamily="Chivo Mono, ui-monospace, monospace"
        >
          {axisX.pole_a.label.split(' ')[0]} ↔ {axisX.pole_b.label.split(' ')[0]}
          {' / '}
          {axisY.pole_a.label.split(' ')[0]} ↔ {axisY.pole_b.label.split(' ')[0]}
        </text>

        {/* Dots */}
        {points.map((p) => {
          const isFocus = highlightEntry === p.entry_number;
          return (
            <circle
              key={p.entry_number}
              cx={p.cx}
              cy={p.cy}
              r={isFocus ? 6 : 3.2}
              fill={isFocus ? '#F2483C' : p.color}
              fillOpacity={isFocus ? 1 : (highlightEntry != null ? 0.25 : 0.78)}
              stroke={isFocus ? '#1c1917' : 'transparent'}
              strokeWidth={isFocus ? 1.5 : 0}
              style={{ cursor: 'pointer', transition: 'r 90ms, fill-opacity 90ms' }}
              onMouseEnter={() => onHover(p.entry_number)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(p.entry_number)}
              onBlur={() => onHover(null)}
              onClick={() => onSelect(p.entry_number)}
              tabIndex={0}
              role="button"
              aria-label={`${p.entry_subject}, entry #${p.entry_number}, tier ${p.tier}`}
            />
          );
        })}

        {/* Concept-query projection marker, green ✕ at the projected
            (x, y). The marker stays inside the chart even when the
            projection is beyond the corpus's observed range; a small
            arrow + caption signals when that's happened. */}
        {queryPoint && (() => {
          const rawX = queryPoint.x;
          const rawY = queryPoint.y;
          const clampedX = Math.max(-1, Math.min(1, rawX));
          const clampedY = Math.max(-1, Math.min(1, rawY));
          const cx = projectX(clampedX);
          const cy = projectY(clampedY);
          const outOfRange = rawX < -1 || rawX > 1 || rawY < -1 || rawY > 1;
          return (
            <g aria-label={`Query "${queryPoint.label || ''}" projects to (${rawX.toFixed(2)}, ${rawY.toFixed(2)})${outOfRange ? ', beyond corpus range' : ''}`}>
              <line x1={cx - 8} y1={cy - 8} x2={cx + 8} y2={cy + 8} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
              <line x1={cx - 8} y1={cy + 8} x2={cx + 8} y2={cy - 8} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
              <line x1={cx - 7} y1={cy - 7} x2={cx + 7} y2={cy + 7} stroke="#059669" strokeWidth={2.5} strokeLinecap="round" />
              <line x1={cx - 7} y1={cy + 7} x2={cx + 7} y2={cy - 7} stroke="#059669" strokeWidth={2.5} strokeLinecap="round" />
              {outOfRange && (
                <text
                  x={cx + 12}
                  y={cy + 14}
                  fontSize={9}
                  fill="#065f46"
                  fontStyle="italic"
                  paintOrder="stroke"
                  stroke="rgba(255,255,255,0.95)"
                  strokeWidth={3}
                >
                  out of range
                </text>
              )}
            </g>
          );
        })()}
      </svg>
    </figure>
  );
}

function FiveAxisProfile({ profile, axes, locked, onClear }) {
  return (
    <aside className="mt-5 p-4 rounded-md border border-stone-200 bg-white">
      <header className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
        <div>
          <h3 className="text-lg font-medium text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
            {profile.entry_subject}
          </h3>
          <p className="text-xs text-stone-500" style={{ fontFamily: 'Chivo Mono, monospace' }}>
            Entry #{profile.entry_number}
            {profile.tier && (
              <> · audit tier {profile.tier}</>
            )}
            {locked ? ' · click again to unlock' : ' · hovering, click a dot to lock'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {profile.loc_item_url && (
            <a
              href={profile.loc_item_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-civil-red-body hover:underline"
            >
              LoC catalog ↗
            </a>
          )}
          {locked && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-stone-500 hover:text-stone-900 underline"
            >
              clear
            </button>
          )}
        </div>
      </header>

      {/* Radar polygon, the voice's 5-dimensional "fingerprint" in
          one visually distinctive shape. Renders ABOVE the bar chart
          so readers see the shape first, then the exact values. */}
      <FiveAxisRadar profile={profile} axes={axes} />

      {/* Five horizontal mini-axes, one bar per concept axis showing
          this interviewee's position along it. Kept below the radar
          for exact numeric readouts and accessibility. */}
      <div className="space-y-2.5 mt-5">
        {axes.map((ax) => {
          const pos = profile.positions[ax.slug];
          if (typeof pos !== 'number') return null;
          // Map [-1, +1] to [0%, 100%]. pos >= 0 means closer to pole_a per
          // the projection math; labels put pole_a on the LEFT, so high
          // position renders at the LEFT end of the bar.
          const leftPct = ((1 - pos) / 2) * 100;
          return (
            <div key={ax.slug}>
              <div className="flex items-baseline justify-between text-xs text-stone-700 mb-0.5">
                <span>{ax.pole_a.label}</span>
                <span className="font-mono text-stone-500 tabular-nums">{pos.toFixed(2)}</span>
                <span>{ax.pole_b.label}</span>
              </div>
              <div className="relative h-2 rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 w-px bg-stone-300"
                  style={{ left: '50%' }}
                  aria-hidden="true"
                />
                <div
                  className="absolute top-0 bottom-0 w-2 rounded-full"
                  style={{
                    left: `calc(${leftPct}% - 4px)`,
                    backgroundColor: '#F2483C',
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}
      </div>

      {locked && <StrongestAxisDrillDown profile={profile} axes={axes} />}
    </aside>
  );
}

/**
 * FiveAxisRadar, small SVG radar polygon showing the voice's
 * 5-axis fingerprint. Each spoke runs from the center (pole_a end,
 * position -1) outward to the rim (pole_b end, position +1). The
 * voice's polygon vertex on each spoke is plotted at the position
 * mapped to [0, 1] radial distance.
 *
 * Two reads in one shape:
 *   - The polygon's overall "shape" tells the eye which dimensions
 *     this voice is extreme on (long spokes = strong pole_b, short
 *     spokes = strong pole_a, all-medium = neutral profile).
 *   - The same data is below in numeric bars for exact reads.
 *
 * Pure SVG, no library. Pole labels at the outer rim use short
 * text so 5 labels fit around a small chart without colliding.
 */
function FiveAxisRadar({ profile, axes }) {
  const SIZE = 260;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const rMax = SIZE * 0.35;
  // n spokes, angles starting from -π/2 (straight up) and rotating
  // clockwise so the first axis sits at the top.
  const n = axes.length;
  const spokes = axes.map((ax, i) => {
    const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const pos = profile.positions[ax.slug];
    // Map [-1, +1] → [0, 1] radial fraction. High position (+1) = closer to
    // pole_a per the projection math; here we put pole_a at the CENTER (r=0)
    // and pole_b at the RIM (r=rMax) so the rim labels (pole_b) match the
    // long-spoke direction. A long spoke = strong pole_b; short spoke =
    // strong pole_a; baseline midring = neutral.
    const r = typeof pos === 'number' ? rMax * ((1 - pos) / 2) : 0;
    return {
      ax,
      angle,
      pos,
      // Voice's vertex (data point).
      vx: cx + r * Math.cos(angle),
      vy: cy + r * Math.sin(angle),
      // Outer rim point (where pole_b label sits).
      rimX: cx + rMax * Math.cos(angle),
      rimY: cy + rMax * Math.sin(angle),
      // Halfway point (the position=0 baseline).
      midX: cx + (rMax / 2) * Math.cos(angle),
      midY: cy + (rMax / 2) * Math.sin(angle),
    };
  });

  const polygonPath = spokes
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.vx.toFixed(1)} ${s.vy.toFixed(1)}`)
    .join(' ') + ' Z';
  const baselinePath = spokes
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.midX.toFixed(1)} ${s.midY.toFixed(1)}`)
    .join(' ') + ' Z';

  return (
    <figure className="mb-5">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE + 30}`}
        width="100%"
        style={{ maxWidth: 360, display: 'block', margin: '0 auto' }}
        role="img"
        aria-label={`Radar polygon of ${profile.entry_subject}'s position on five concept axes. Each spoke runs from the center (pole_a end) outward to the rim (pole_b end).`}
      >
        {/* TODO(dark-mode): radar SVG gridlines/labels are hardcoded for light theme
            and need dark variants read from a theme flag: rim + spoke gridlines
            ('#e7e5e4'), the neutral-baseline polygon stroke ('#a8a29e'), and the
            pole_b rim labels ('#44403c', go dark-on-dark). The voice polygon fill/
            stroke ('#F2483C' / '#B23E2F') and vertex dots are brand colors and read
            acceptably on dark. */}
        {/* Outer rim circle and spoke gridlines */}
        <circle cx={cx} cy={cy} r={rMax} fill="none" stroke="#e7e5e4" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={rMax / 2} fill="none" stroke="#e7e5e4" strokeDasharray="2 3" strokeWidth={1} />
        {spokes.map((s, i) => (
          <line key={`spoke-${i}`} x1={cx} y1={cy} x2={s.rimX} y2={s.rimY} stroke="#e7e5e4" strokeWidth={1} />
        ))}

        {/* Faint baseline polygon at position=0 on all axes */}
        <path d={baselinePath} fill="none" stroke="#a8a29e" strokeDasharray="3 3" strokeWidth={1} opacity={0.6} />

        {/* The voice's polygon (fingerprint) */}
        <path d={polygonPath} fill="#F2483C" fillOpacity={0.22} stroke="#B23E2F" strokeWidth={1.8} strokeLinejoin="round" />

        {/* Vertex dots */}
        {spokes.map((s, i) => (
          <circle key={`vertex-${i}`} cx={s.vx} cy={s.vy} r={3.5} fill="#F2483C" stroke="#1c1917" strokeWidth={1} />
        ))}

        {/* Pole_b labels at the rim */}
        {spokes.map((s, i) => {
          // Anchor labels based on which quadrant they're in so they
          // don't extend off-canvas.
          const dx = Math.cos(s.angle);
          const dy = Math.sin(s.angle);
          const lx = cx + (rMax + 8) * dx;
          const ly = cy + (rMax + 8) * dy;
          const anchor = dx > 0.3 ? 'start' : dx < -0.3 ? 'end' : 'middle';
          const dyAdjust = dy < -0.3 ? -4 : dy > 0.3 ? 12 : 4;
          return (
            <text
              key={`label-${i}`}
              x={lx}
              y={ly + dyAdjust - 4}
              fontSize={9}
              textAnchor={anchor}
              fill="#44403c"
              fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
            >
              {s.ax.pole_b.label}
            </text>
          );
        })}
      </svg>
      <figcaption className="text-xs text-stone-500 text-center mt-1 px-2">
        5-axis fingerprint. Each spoke runs from the center (the
        opposite pole) outward to the labeled pole. Dashed inner ring
        is the all-neutral baseline.
      </figcaption>
    </figure>
  );
}

/**
 * StrongestAxisDrillDown, when a voice is locked, identify their
 * highest-magnitude axis position (the "most defining" concept
 * dimension for them in the matrix), then retrieve the top passages
 * from THAT interview most aligned with the pole they lean toward.
 *
 * Mirrors the Spectrum drill-down pattern but auto-picks the axis
 * instead of asking the user to choose, the ConceptMatrix view is
 * already presenting all 5 axes simultaneously, so we use the
 * stand-out one as the query anchor.
 */
function StrongestAxisDrillDown({ profile, axes }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pick the axis with the largest absolute position, the dimension
  // where this voice is most distinctive within the corpus.
  const strongest = useMemo(() => {
    let bestAxis = null;
    let bestMag = -Infinity;
    for (const ax of axes) {
      const pos = profile.positions[ax.slug];
      if (typeof pos !== 'number') continue;
      if (Math.abs(pos) > bestMag) {
        bestMag = Math.abs(pos);
        bestAxis = { axis: ax, position: pos };
      }
    }
    return bestAxis;
  }, [axes, profile]);

  useEffect(() => {
    if (!strongest) return undefined;
    let cancelled = false;
    // position >= 0 means closer to pole_a per the projection math.
  const pole = strongest.position >= 0 ? strongest.axis.pole_a : strongest.axis.pole_b;
    setLoading(true);
    setError(null);
    setResults(null);
    retrieve(pole.anchor, {
      topN: 5,
      filter: { entry_number: { $eq: profile.entry_number } },
    })
      .then(({ results: r }) => { if (!cancelled) setResults(r || []); })
      .catch((e) => { if (!cancelled) setError(e?.detail?.message || e?.message || 'Drill-down failed.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [strongest, profile.entry_number]);

  if (!strongest) return null;
  // position >= 0 means closer to pole_a per the projection math.
  const pole = strongest.position >= 0 ? strongest.axis.pole_a : strongest.axis.pole_b;

  return (
    <div className="mt-5 pt-4 border-t border-stone-200">
      <p className="text-xs text-civil-red-body font-mono uppercase tracking-wide mb-1">
        Retrieval drill-down
      </p>
      <p className="text-sm text-stone-700 mb-3">
        The strongest dimension for {profile.entry_subject} is{' '}
        <strong>{strongest.axis.title}</strong> (position{' '}
        <span className="tabular-nums">{strongest.position.toFixed(2)}</span>).
        Top passages from this interview most aligned with{' '}
        <strong className="text-civil-red-body">{pole.label.toLowerCase()}</strong>:
      </p>

      {loading && (
        <p className="text-sm text-stone-500 inline-flex items-center gap-2" role="status"><Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />Searching their passages…</p>
      )}
      {error && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 dark:text-amber-200 dark:bg-amber-950/40 dark:border-amber-800 rounded p-3">
          {error}
        </p>
      )}
      {results && results.length === 0 && !loading && !error && (
        <p className="text-sm text-stone-500">
          No passages indexed for this interview yet.
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
    </div>
  );
}
