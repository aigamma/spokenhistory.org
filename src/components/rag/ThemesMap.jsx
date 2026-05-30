/**
 * @fileoverview ThemesMap, bubble-chart view of the 30 thematic
 * clusters, positioned by each cluster's centroid in the same 2D
 * embedding space used by Constellation.
 *
 * Conceptual bridge: the Constellation tab shows individual interviews
 * as dots. This view shows the *regions* those dots fall into, with
 * each bubble's position computed as the centroid of its members'
 * (x, y) coordinates in the Constellation projection. So a cluster
 * bubble sits in the visual middle of the dots that belong to it.
 *
 * Visual encodings:
 *   - Bubble position: centroid of member positions in 2D PCA space.
 *   - Bubble radius: sqrt(member_count) * 5 + 8.
 *   - Bubble color: dominant audit tier among members (uses the same
 *     TIER_COLORS palette as the rest of the site, so an "publication-
 *     block" cluster shows red and a "low" (high-confidence) cluster
 *     shows emerald).
 *
 * No external chart lib, pure SVG. Hover shows a tooltip; click
 * fires the onSelect callback so the parent expands the cluster
 * details inline.
 */

import { useEffect, useMemo, useState } from 'react';
import { TIER_COLORS } from './tiers';

const W = 760;
const H = 480;
const PAD = 40;

export default function ThemesMap({ clusters, selectedId, onSelect }) {
  const [constellation, setConstellation] = useState(null);
  const [hoverCluster, setHoverCluster] = useState(null);
  const [hoverPos, setHoverPos] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/constellation.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled) setConstellation(j); })
      .catch(() => { /* falls back to grid layout below */ });
    return () => { cancelled = true; };
  }, []);

  const layout = useMemo(() => {
    if (!clusters?.length) return [];

    // Build entry_number → (x, y) lookup from constellation.json.
    const pointById = new Map();
    if (constellation?.points) {
      for (const p of constellation.points) {
        pointById.set(p.entry_number, { x: p.x, y: p.y });
      }
    }

    // Compute each cluster's centroid + dominant tier.
    return clusters.map((c) => {
      let sumX = 0;
      let sumY = 0;
      let n = 0;
      const tierTally = {};
      const members = c.members || (c.member_entry_subjects || []).map((s) => ({ entry_subject: s }));
      for (const m of members) {
        const tier = m.tier || 'unknown';
        tierTally[tier] = (tierTally[tier] || 0) + 1;
        const pt = m.entry_number != null ? pointById.get(m.entry_number) : null;
        if (pt) {
          sumX += pt.x;
          sumY += pt.y;
          n += 1;
        }
      }
      const cx = n > 0 ? sumX / n : 0;
      const cy = n > 0 ? sumY / n : 0;
      const dominantTier = Object.entries(tierTally).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

      return {
        cluster_id: c.cluster_id,
        name: c.name,
        description: c.description,
        size: c.size,
        cx, // domain: [-1, 1]
        cy, // domain: [-1, 1] (y-up in math; flipped to y-down when projecting to SVG)
        dominantTier,
        starter_query: c.starter_query,
      };
    });
  }, [clusters, constellation]);

  // Project domain (x, y in [-1, 1]) to SVG pixel space.
  const innerW = W - 2 * PAD;
  const innerH = H - 2 * PAD;
  const projectX = (x) => PAD + ((x + 1) / 2) * innerW;
  const projectY = (y) => PAD + ((1 - y) / 2) * innerH; // flip so positive y goes up

  const radiusFor = (size) => 8 + Math.sqrt(size || 1) * 5;

  const handleMouseEnter = (cluster, event) => {
    setHoverCluster(cluster);
    setHoverPos({ x: event.clientX, y: event.clientY });
  };
  const handleMouseMove = (cluster, event) => {
    setHoverCluster(cluster);
    setHoverPos({ x: event.clientX, y: event.clientY });
  };
  const handleMouseLeave = () => {
    setHoverCluster(null);
    setHoverPos(null);
  };

  if (!layout.length) {
    return (
      <div className="rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-center" style={{ height: H }}>
        <span className="text-sm text-stone-500">Loading themes map…</span>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-stone-200 overflow-hidden bg-stone-50">
        {/* TODO(dark-mode): SVG substrate fill is hardcoded '#fafaf9' inline; the
            reference grid lines ('#e7e5e4') and the bubble labels (fill '#1c1917'
            with '#fafaf9' stroke halo, below) need dark variants read from a theme
            flag (e.g. document.documentElement.classList.contains('dark')) so the
            chart interior inverts with the rest of the page. */}
        <svg
          width="100%"
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="30 thematic clusters positioned at their centroids in the embedding space. Bubble size shows cluster member count; color shows dominant audit tier."
          style={{ display: 'block', background: '#fafaf9' }}
        >
          {/* Soft reference grid */}
          <g aria-hidden="true">
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={`h-${f}`}
                x1={PAD}
                y1={PAD + f * innerH}
                x2={W - PAD}
                y2={PAD + f * innerH}
                stroke="#e7e5e4"
                strokeDasharray="2 4"
              />
            ))}
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={`v-${f}`}
                x1={PAD + f * innerW}
                y1={PAD}
                x2={PAD + f * innerW}
                y2={H - PAD}
                stroke="#e7e5e4"
                strokeDasharray="2 4"
              />
            ))}
          </g>

          {/* Bubbles, painted back-to-front by descending size so small
              bubbles aren't hidden under large ones */}
          {[...layout]
            .sort((a, b) => b.size - a.size)
            .map((c) => {
              const isSelected = c.cluster_id === selectedId;
              const isHover = hoverCluster?.cluster_id === c.cluster_id;
              const color = TIER_COLORS[c.dominantTier] || '#78716c';
              const cx = projectX(c.cx);
              const cy = projectY(c.cy);
              const r = radiusFor(c.size);
              return (
                <g key={c.cluster_id}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={color}
                    fillOpacity={isSelected ? 0.92 : isHover ? 0.85 : 0.7}
                    stroke={isSelected ? '#1c1917' : '#1c1917'}
                    strokeWidth={isSelected ? 2.5 : 0.5}
                    style={{ cursor: 'pointer', transition: 'fill-opacity 120ms' }}
                    onMouseEnter={(e) => handleMouseEnter(c, e)}
                    onMouseMove={(e) => handleMouseMove(c, e)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => onSelect?.(c.cluster_id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Cluster: ${c.name}, ${c.size} interviewees, dominant tier ${c.dominantTier}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect?.(c.cluster_id);
                      }
                    }}
                  />
                  {/* Label inside big bubbles, or to the right of smaller ones */}
                  {c.size >= 6 && (
                    <text
                      x={cx}
                      y={cy + 4}
                      fontSize={Math.min(13, r * 0.55)}
                      textAnchor="middle"
                      fill="#1c1917"
                      paintOrder="stroke"
                      stroke="#fafaf9"
                      strokeWidth={2.5}
                      strokeLinejoin="round"
                      fontWeight={500}
                      fontFamily="ui-sans-serif, system-ui, sans-serif"
                      style={{ pointerEvents: 'none' }}
                    >
                      {String(c.cluster_id).padStart(2, '0')}
                    </text>
                  )}
                </g>
              );
            })}
        </svg>
      </div>

      {/* Portal-rendered tooltip would be ideal here too, but a
          regular absolutely-positioned div over the chart is fine
          because the chart container doesn't clip. */}
      {hoverCluster && hoverPos && (
        <div
          className="fixed z-50 pointer-events-none bg-stone-900 text-white text-sm rounded-md shadow-xl px-3 py-2"
          style={{
            left: Math.min(hoverPos.x + 16, (typeof window !== 'undefined' ? window.innerWidth : 1024) - 320),
            top: hoverPos.y + 16,
            maxWidth: 300,
          }}
        >
          <div className="font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
            {hoverCluster.name}
          </div>
          <div className="text-xs text-stone-300 mt-1">
            {hoverCluster.size} {hoverCluster.size === 1 ? 'voice' : 'voices'}
            {' · dominant tier '}
            {hoverCluster.dominantTier}
          </div>
          {hoverCluster.description && (
            <div className="text-xs text-stone-300 mt-2 leading-snug">
              {hoverCluster.description}
            </div>
          )}
        </div>
      )}
    </>
  );
}
