/**
 * @fileoverview ConceptSpectrum — visualize interviewees positioned along
 * conceptual axes computed from Voyage embeddings.
 *
 * Each axis is defined by two pole descriptions; the axis_vector is the
 * normalized difference of their embeddings. Each interview centroid is
 * projected onto the axis. The result: a 1D position per interviewee per axis.
 *
 * This is the most "philosophy of embedding" demo — the audience literally
 * watches the embedding space *take a position* on where each interviewee
 * sits along a conceptual continuum. Clicking a dot drills into the
 * passages from THAT interview most aligned with whichever pole that
 * interviewee leans toward — the RAG demonstration the page promises.
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
  // reproduce a specific drill-down state — researchers can copy + share
  // a permalink to their finding.
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeAxis, setActiveAxis] = useState(0);
  const [hover, setHover] = useState(null);
  // selected = locked dot the user clicked. Triggers an inline /retrieve
  // call against the corpus, scoped to that interviewee's passages and
  // queried with whichever pole they lean toward — the RAG drill-down.
  const [selected, setSelected] = useState(null);
  const [drillResults, setDrillResults] = useState(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState(null);
  // Name search — when set, matching dots stay bright and non-matching
  // dots dim. Helps users find a specific voice among 136 without
  // hover-treasure-hunting.
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/summaries/concept_axes.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  // Clear the drill-down when the user switches axes — the selection
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, searchParams]);

  // state → URL: when user changes axis or selection, mirror to URL
  // so the back/forward and copy-link affordances work.
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
    if (changed) setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAxis, selected, data]);

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
    const pole = selected.position >= 0 ? axis.pole_b : axis.pole_a;
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

  // Match set for the search filter — entry_numbers whose subject
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

      {/* Search box for finding a specific voice in the 136-dot
          scatter. Sits right under the chart. Matches dim non-matches
          to ~20% opacity and label-tag any matches with their name
          drawn alongside the dot. */}
      <div className="mt-3 mb-1 relative max-w-md">
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

      {/* Axis selector pills sit immediately under the chart so the
          user reads chart → "and here are the axes I can switch to"
          → explanation. Eric's directive: chart at the top, pills
          right under, explanation below. */}
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
        Click a dot to drill into the passages from that interview that anchor it where it is —
        the embedding space takes a position, and the retrieval shows you why.
      </p>

      {/* Dot color legend — explains the audit-tier palette so users
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
  const pole = selected.position >= 0 ? axis.pole_b : axis.pole_a;
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
            (the {selected.position >= 0 ? 'right' : 'left'}-side pole of this axis).
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
  const PAD_X = 24;
  const TOP = 130;
  const BOTTOM = 270;

  const xFor = (pos) => PAD_X + ((pos + 1) / 2) * (W - 2 * PAD_X);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm">
        <div className="rounded-md border border-stone-200 bg-white p-3">
          <p className="font-medium text-stone-900 mb-1">← {axis.pole_a.label}</p>
          <p className="text-xs text-stone-600 italic">{axis.pole_a.anchor}</p>
        </div>
        <div className="rounded-md border border-stone-200 bg-white p-3">
          <p className="font-medium text-stone-900 mb-1">{axis.pole_b.label} →</p>
          <p className="text-xs text-stone-600 italic">{axis.pole_b.anchor}</p>
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
            y1={(TOP + BOTTOM) / 2}
            x2={W - PAD_X}
            y2={(TOP + BOTTOM) / 2}
            stroke="#a8a29e"
            strokeWidth="2"
          />

          {/* Pole labels at endpoints */}
          <text x={PAD_X} y={TOP - 6} fontSize="14" fill="#1c1917" fontWeight="500" fontFamily="Inter, sans-serif">
            {axis.pole_a.label}
          </text>
          <text x={W - PAD_X} y={TOP - 6} fontSize="14" fill="#1c1917" fontWeight="500" fontFamily="Inter, sans-serif" textAnchor="end">
            {axis.pole_b.label}
          </text>

          {/* Pre-compute extremes for permanent labeling. positions
              is sorted ascending by position; first = leftmost
              (most pole_a), last = rightmost (most pole_b). */}
          {(() => null)()}
          {/* Dots */}
          {axis.positions.map((p, idx) => {
            const cx = xFor(p.position_normalized);
            const jitterSeed = (p.entry_number * 2654435761) >>> 0;
            const jitter = ((jitterSeed % 100) / 100 - 0.5) * 100;
            const cy = (TOP + BOTTOM) / 2 + jitter;
            const color = TIER_COLORS[p.tier] || '#b91c1c';
            const isHover = hover?.p?.entry_number === p.entry_number;
            const isSelected = selectedEntry === p.entry_number;
            const isMatch = !matched || matched.has(p.entry_number);
            const dimByFilter = matched && !isMatch;
            const isExtreme = idx === 0 || idx === axis.positions.length - 1;
            // Permanently label the extremes when no search is active,
            // so visitors immediately see who anchors each pole without
            // having to hover-treasure-hunt. When search is active, the
            // matched-label path below handles labeling.
            const labelAsExtreme = isExtreme && !matched && !isSelected;
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

                {/* Permanent label at each extreme pole when no search
                    is active. Positions the label so the leftmost
                    text-anchors at start (sits to the right of its
                    dot) and the rightmost at end (sits to the left of
                    its dot), keeping them inside the chart frame. */}
                {labelAsExtreme && (
                  <text
                    x={idx === 0 ? cx + 10 : cx - 10}
                    y={cy + 4}
                    fontSize={11}
                    fontWeight={600}
                    fill="#1c1917"
                    textAnchor={idx === 0 ? 'start' : 'end'}
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

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium text-stone-900 mb-1">Most {axis.pole_a.label.toLowerCase()}:</p>
          <ol className="list-decimal list-inside text-stone-700 space-y-0.5">
            {axis.positions.slice(0, 5).map((p) => (
              <LeaderboardEntry key={p.entry_number} p={p} onSelect={onSelect} isSelected={selectedEntry === p.entry_number} />
            ))}
          </ol>
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
    </article>
  );
}

/**
 * LeaderboardEntry — a clickable name in the "Most {pole}" lists
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
 * CopyLinkButton — copies the current page URL (which includes
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
