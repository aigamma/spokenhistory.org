/**
 * @fileoverview ConceptMatrix — show the SAME 136 interviewees through
 * four DIFFERENT pairs of named concept axes simultaneously, with
 * cross-chart hover sync so you watch a single voice move when you
 * change the lens.
 *
 * Why this exists: Nomic Atlas + UMAP + PCA all share the same
 * pedagogical failure — they give you a 2D scatter where the axes
 * have no human-readable meaning, only "directions of max variance."
 * The viewer hovers a dot and learns who's there, but nothing about
 * WHY they're there or what the structure represents. Atlas itself
 * doesn't try to explain because the axes can't BE explained — they're
 * statistical leftovers.
 *
 * This component flips the framing. Instead of one un-labeled projection,
 * show many projections where every axis has a hand-curated name. We
 * already have rag/precompute_concept_axes.mjs computing 5 such axes
 * — each defined by two pole descriptions whose unit-difference vector
 * is the axis. Project every interview onto each axis (a dot product
 * with that vector) and plot pairs as 2D scatters.
 *
 * The educational reveal is the cross-chart sync. Hover Aaron Dixon
 * in chart 1 — see him land toward "armed self-defense." Same hover
 * highlights him in chart 2 — now he's toward "tactical pragmatism."
 * Chart 3 — toward "collective discipline." His one voice exists at
 * different coordinates in every named-concept space, and the user
 * learns what the structure means by watching it shift.
 *
 * That's the trick Nomic doesn't do — they show one projection per
 * dataset; we show four lenses on the same data and let the
 * interrelation teach.
 */

import { useEffect, useMemo, useState } from 'react';
import { TIER_COLORS, TIER_BADGE } from './tiers';

// Strategic pair selection — five axes give ten possible pairs; we
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
        hand-curated semantic dimension — not a statistical leftover like
        UMAP — so the structure you see is interpretable.{' '}
        <strong>Hover any dot</strong> to watch the same voice move
        across the other three lenses. <strong>Click</strong> to lock the
        highlight and see the full five-axis profile below.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {AXIS_PAIRS.map(([xSlug, ySlug]) => (
          <MiniScatter
            key={`${xSlug}-${ySlug}`}
            axisX={axesById.get(xSlug)}
            axisY={axesById.get(ySlug)}
            profilesById={profilesById}
            highlightEntry={focusEntry}
            onHover={setHoveredEntry}
            onSelect={(n) => setSelectedEntry((cur) => (cur === n ? null : n))}
          />
        ))}
      </div>

      {focusProfile && (
        <FiveAxisProfile
          profile={focusProfile}
          axes={data.axes}
          locked={selectedEntry != null}
          onClear={() => setSelectedEntry(null)}
        />
      )}

      <footer className="text-xs text-stone-500 border-t border-stone-200 pt-3 mt-6 max-w-3xl">
        Source: <code className="font-mono">public/rag/summaries/concept_axes.json</code>.
        Each axis vector is{' '}
        <code className="font-mono">normalize(embedding(pole_A) - embedding(pole_B))</code>;
        each interview&apos;s position is the dot product of its centroid with that vector,
        stretched to <code className="font-mono">[-1, +1]</code>. Pure projection — no LLM
        per query.
      </footer>
    </div>
  );
}

function MiniScatter({ axisX, axisY, profilesById, highlightEntry, onHover, onSelect }) {
  if (!axisX || !axisY) return null;

  const W = 460;
  const H = 340;
  const PAD_L = 24;
  const PAD_R = 24;
  const PAD_T = 36;
  const PAD_B = 36;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const projectX = (x) => PAD_L + ((x + 1) / 2) * innerW;
  const projectY = (y) => PAD_T + ((1 - y) / 2) * innerH;

  const points = useMemo(() => {
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
  }, [axisX, axisY, profilesById]);

  return (
    <figure className="rounded-md border border-stone-200 bg-white overflow-hidden">
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
            {locked ? ' · click again to unlock' : ' · hovering — click a dot to lock'}
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

      {/* Five horizontal mini-axes — one bar per concept axis showing
          this interviewee's position along it. */}
      <div className="space-y-2.5">
        {axes.map((ax) => {
          const pos = profile.positions[ax.slug];
          if (typeof pos !== 'number') return null;
          // Map [-1, +1] to [0%, 100%].
          const leftPct = ((pos + 1) / 2) * 100;
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
    </aside>
  );
}
