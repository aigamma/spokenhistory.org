/**
 * @fileoverview TourMap, overlay a curated tour's stops as a numbered
 * arc through the Atlas UMAP projection.
 *
 * Ties the Tours feature (editorial narrative paths through ~7-10
 * interviews around a theme) to the embedding-space visualization
 * surfaces. Same coordinate system as InterviewMap and PassageMap -
 * everything in this app's RAG layer lives in one Atlas-derived
 * 2D space.
 *
 * Visual encoding:
 *   - All 136 interviews rendered as small faded reference dots
 *     (gray, low opacity), so the user gets a sense of where the tour
 *     sits in the broader corpus.
 *   - The selected tour's stops rendered as larger circles, brand red,
 *     numbered in order. A polyline connects them in sequence with
 *     arrowhead marker so the directionality is obvious.
 *   - Hover a numbered stop → highlights the interviewee + shows
 *     their curated note for that stop position.
 *   - Stops far from each other on the map make for visually-long
 *     line segments, that's actually informative ("this tour jumps
 *     between thematic territories").
 *
 * If atlas_projection.json hasn't been downloaded yet, the component
 * silently returns null, TourPages still works with the body + path
 * list below.
 */

import { useEffect, useMemo, useState } from 'react';

const W = 880;
const H = 480;
const PAD = 40;

export default function TourMap({ tour, onSelectStop = null }) {
  const [projection, setProjection] = useState(null);
  const [hoverStop, setHoverStop] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/atlas_projection.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled) setProjection(j); })
      .catch(() => { /* silent, TourMap is optional */ });
    return () => { cancelled = true; };
  }, []);

  const centroids = useMemo(() => {
    if (!projection?.points?.length) return null;
    const byEntry = new Map();
    for (const p of projection.points) {
      if (p.entry_number == null) continue;
      if (!byEntry.has(p.entry_number)) {
        byEntry.set(p.entry_number, { entry_number: p.entry_number, entry_subject: p.entry_subject, sx: 0, sy: 0, n: 0 });
      }
      const e = byEntry.get(p.entry_number);
      e.sx += p.x;
      e.sy += p.y;
      e.n += 1;
    }
    const out = new Map();
    for (const e of byEntry.values()) {
      out.set(e.entry_number, { entry_number: e.entry_number, entry_subject: e.entry_subject, x: e.sx / e.n, y: e.sy / e.n });
    }
    return out;
  }, [projection]);

  const bounds = useMemo(() => {
    if (!centroids?.size) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of centroids.values()) {
      if (c.x < minX) minX = c.x;
      if (c.x > maxX) maxX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.y > maxY) maxY = c.y;
    }
    return { minX, minY, maxX, maxY };
  }, [centroids]);

  if (!projection || !centroids || !bounds || !tour?.path?.length) {
    return null;
  }

  const innerW = W - 2 * PAD;
  const innerH = H - 2 * PAD;
  const px = (x) => PAD + ((x - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * innerW;
  const py = (y) => PAD + (1 - (y - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * innerH;

  const stops = tour.path
    .map((s, idx) => {
      const c = centroids.get(s.entry_number);
      if (!c) return null;
      return {
        ...s,
        idx,
        cx: px(c.x),
        cy: py(c.y),
        entry_subject: s.entry_subject || c.entry_subject,
      };
    })
    .filter(Boolean);

  if (stops.length === 0) return null;

  const pathD = stops.map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.cx.toFixed(1)} ${s.cy.toFixed(1)}`).join(' ');

  const stopIds = new Set(stops.map((s) => s.entry_number));

  return (
    <figure className="rag-tour-map mb-6">
      <div className="rounded-lg border border-stone-200 overflow-hidden bg-stone-50">
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Map view of the tour "${tour.title}", showing its ${stops.length} stops drawn as a numbered arc through the embedding space.`}
          style={{ display: 'block' }}
        >
          <defs>
            {/* Arrowhead marker pointing along the tour direction */}
            <marker
              id="tour-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#B23E2F" />
            </marker>
          </defs>

          {/* Faded reference dots for all 136 interviews not in this tour */}
          <g aria-hidden="true">
            {[...centroids.values()].filter((c) => !stopIds.has(c.entry_number)).map((c) => (
              <circle
                key={c.entry_number}
                cx={px(c.x)}
                cy={py(c.y)}
                r={2.2}
                fill="#a8a29e"
                fillOpacity={0.35}
              />
            ))}
          </g>

          {/* The tour path itself */}
          <path
            d={pathD}
            fill="none"
            stroke="#B23E2F"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            markerEnd="url(#tour-arrow)"
            opacity={0.85}
          />

          {/* Numbered stop nodes */}
          {stops.map((s) => {
            const isHover = hoverStop === s.entry_number;
            return (
              <g key={s.entry_number}>
                <circle
                  cx={s.cx}
                  cy={s.cy}
                  r={isHover ? 18 : 14}
                  fill="#F2483C"
                  stroke="#18181b"
                  strokeWidth={1.5}
                  style={{ cursor: onSelectStop ? 'pointer' : 'default', transition: 'r 90ms' }}
                  onMouseEnter={() => setHoverStop(s.entry_number)}
                  onMouseLeave={() => setHoverStop(null)}
                  onClick={() => onSelectStop?.(s.entry_number)}
                />
                <text
                  x={s.cx}
                  y={s.cy + 4}
                  fontSize={isHover ? 13 : 11}
                  fontWeight={700}
                  fill="#fafaf9"
                  textAnchor="middle"
                  fontFamily="Chivo Mono, ui-monospace, monospace"
                  style={{ pointerEvents: 'none' }}
                >
                  {String(s.idx + 1).padStart(2, '0')}
                </text>
                {/* Name label, alongside the stop */}
                <text
                  x={s.cx + 20}
                  y={s.cy + 4}
                  fontSize={isHover ? 13 : 11}
                  fontWeight={isHover ? 600 : 500}
                  fill="#18181b"
                  paintOrder="stroke"
                  stroke="rgba(250,250,249,0.95)"
                  strokeWidth={3}
                  strokeLinejoin="round"
                  fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
                  style={{ pointerEvents: 'none' }}
                >
                  {s.entry_subject}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {hoverStop != null && (() => {
        const s = stops.find((x) => x.entry_number === hoverStop);
        if (!s?.note) return null;
        return (
          <p className="text-xs text-stone-600 italic mt-2 max-w-2xl px-1" style={{ fontFamily: 'Source Serif 4, serif' }}>
            <span className="font-mono not-italic text-civil-red-body mr-2">{String(s.idx + 1).padStart(2, '0')}.</span>
            {s.note}
          </p>
        );
      })()}
      <figcaption className="text-xs text-stone-500 mt-2">
        {stops.length} stops drawn as a numbered arc through the corpus&apos;s embedding space.
        Gray dots are the 136 interviews not in this tour. Hover a numbered stop to read
        the curator&apos;s note.
      </figcaption>
    </figure>
  );
}
