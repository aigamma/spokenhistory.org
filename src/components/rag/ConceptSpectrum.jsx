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
 * sits along a conceptual continuum.
 *
 * Loads /rag/summaries/concept_axes.json. Static; no live retrieval.
 */

import { useEffect, useState } from 'react';
import { TIER_COLORS } from './tiers';

export default function ConceptSpectrum() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeAxis, setActiveAxis] = useState(0);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/summaries/concept_axes.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="text-sm text-stone-500 p-4">
        Concept axes not yet generated. Run <code className="font-mono">node --env-file=rag/.env.local rag/precompute_concept_axes.mjs</code> from the repo root.
      </div>
    );
  }

  if (!data) {
    return <div className="text-sm text-stone-500 p-4" role="status">Loading concept axes…</div>;
  }

  const axis = data.axes[activeAxis];

  return (
    <div className="rag-concept-spectrum">
      <p className="text-sm text-stone-600 mb-6 max-w-2xl">
        Each axis below is defined by two opposing concepts. We embed each pole with Voyage, take the unit difference vector, and project all 136 interview centroids onto it. The result: a 1D position per interviewee on each conceptual continuum. Watch the embedding space <em>take a position</em> on where each voice sits.
      </p>

      <div className="mb-8 flex flex-wrap gap-2">
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

      <Axis axis={axis} hover={hover} setHover={setHover} />

      <footer className="text-xs text-stone-500 border-t border-stone-200 pt-4 mt-8">
        <p>
          Pure-math projection of pre-computed Voyage embeddings. No LLM call per query. The axis vector is <code className="font-mono">normalize(embedding(pole_A) - embedding(pole_B))</code>; each interviewee&apos;s position is the dot product of their centroid with that vector, then linearly stretched to [-1, 1]. Source: <code className="font-mono">rag/precompute_concept_axes.mjs</code>.
        </p>
      </footer>
    </div>
  );
}

function Axis({ axis, hover, setHover }) {
  const W = 880;
  const H = 380;
  const PAD_X = 24;
  const TOP = 130;
  const BOTTOM = 270;

  const xFor = (pos) => PAD_X + ((pos + 1) / 2) * (W - 2 * PAD_X);

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
          aria-label={`Concept axis: ${axis.title}. 136 interviewees plotted by position.`}
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

          {/* Dots */}
          {axis.positions.map((p) => {
            const cx = xFor(p.position_normalized);
            const jitterSeed = (p.entry_number * 2654435761) >>> 0;
            const jitter = ((jitterSeed % 100) / 100 - 0.5) * 100;
            const cy = (TOP + BOTTOM) / 2 + jitter;
            const color = TIER_COLORS[p.tier] || '#b91c1c';
            const isHover = hover?.entry_number === p.entry_number;
            return (
              <circle
                key={p.entry_number}
                cx={cx}
                cy={cy}
                r={isHover ? 7 : 4}
                fill={color}
                fillOpacity={isHover ? 1 : 0.75}
                stroke={isHover ? '#1c1917' : 'transparent'}
                strokeWidth="1.5"
                onMouseEnter={() => setHover(p)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(p)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                style={{ cursor: 'pointer' }}
                aria-label={`${p.entry_subject}, position ${p.position.toFixed(3)}`}
              />
            );
          })}

          {/* Hover label */}
          {hover && (
            <g pointerEvents="none">
              <rect
                x={xFor(hover.position_normalized) - 100}
                y={BOTTOM + 10}
                width="200"
                height="48"
                rx="4"
                fill="#1c1917"
                opacity="0.92"
              />
              <text
                x={xFor(hover.position_normalized)}
                y={BOTTOM + 28}
                fontSize="13"
                fill="white"
                textAnchor="middle"
                fontWeight="500"
                fontFamily="Inter, sans-serif"
              >
                {(hover.entry_subject || '').slice(0, 40)}
              </text>
              <text
                x={xFor(hover.position_normalized)}
                y={BOTTOM + 46}
                fontSize="11"
                fill="#d6d3d1"
                textAnchor="middle"
                fontFamily="Chivo Mono, monospace"
              >
                {hover.tier || 'unknown'} · projection {hover.position.toFixed(3)}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium text-stone-900 mb-1">Most {axis.pole_a.label.toLowerCase()}:</p>
          <ol className="list-decimal list-inside text-stone-700 space-y-0.5">
            {axis.positions.slice(0, 5).map((p) => (
              <li key={p.entry_number}>
                <span className="font-medium">{p.entry_subject}</span>{' '}
                <span className="text-xs text-stone-500 tabular-nums">({p.position.toFixed(3)})</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p className="font-medium text-stone-900 mb-1">Most {axis.pole_b.label.toLowerCase()}:</p>
          <ol className="list-decimal list-inside text-stone-700 space-y-0.5">
            {axis.positions.slice(-5).reverse().map((p) => (
              <li key={p.entry_number}>
                <span className="font-medium">{p.entry_subject}</span>{' '}
                <span className="text-xs text-stone-500 tabular-nums">({p.position.toFixed(3)})</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  );
}
