/**
 * @fileoverview Constellation, 2D scatter of all 136 entry centroids in
 * the embedding space. Renders public/rag/constellation.json as an SVG
 * scatter with hover labels.
 *
 * This is the conference's "philosophy of embedding" money shot: the
 * audience literally sees the corpus laid out by thematic proximity.
 * Two interviewees who never met but whose words land within 0.12
 * cosine of each other on this topic appear as nearby dots on the
 * scatter.
 *
 * Static, no live retrieval. The data file is precomputed by
 * rag/precompute.mjs against the populated Pinecone index.
 */

import { useEffect, useState, useRef, useMemo } from 'react';
import { loadConstellation } from '../../services/ragClient';
import { useIsDark } from '../../hooks/useTheme';
import { TIER_COLORS, SETTLED_STATES } from './tiers';

// Fetch clusters.json once and cache per-session; the file is shared
// with ThemesBrowser + ThemesMap and is small (~30 cluster objects).
let _clustersPromise = null;
function loadClusters() {
  if (_clustersPromise) return _clustersPromise;
  _clustersPromise = fetch('/rag/summaries/clusters.json')
    .then((r) => (r.ok ? r.json() : fetch('/rag/summaries/clusters_raw.json').then((r2) => r2.json())))
    .catch(() => null);
  return _clustersPromise;
}

/**
 * Constellation, SVG scatter of corpus entries in 2D embedding space.
 *
 * @component
 * @param {Object} props
 * @param {number} [props.width=720]
 * @param {number} [props.height=720]
 * @param {(point: ConstellationPoint) => void} [props.onSelect] - Click handler.
 * @param {string} [props.className]
 * @returns {React.ReactElement}
 */
export default function Constellation({
  width = 720,
  height = 720,
  onSelect = null,
  className = '',
}) {
  const [data, setData] = useState(null);
  const [clusters, setClusters] = useState(null);
  const [error, setError] = useState(null);
  const [hover, setHover] = useState(null);
  // Regions are shown by default, they're the educational layer that
  // makes the abstract 2D space readable. User can toggle off if the
  // label clutter gets in the way of point-level inspection.
  const [showRegions, setShowRegions] = useState(true);
  const svgRef = useRef(null);
  const isDark = useIsDark();

  useEffect(() => {
    let cancelled = false;
    loadConstellation()
      .then((json) => { if (!cancelled) setData(json); })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Failed to load.'); });
    loadClusters().then((j) => { if (!cancelled && j?.clusters) setClusters(j.clusters); });
    return () => { cancelled = true; };
  }, []);

  // Padding: keep labels from spilling off the edges.
  const PAD = 40;
  const innerW = width - 2 * PAD;
  const innerH = height - 2 * PAD;
  const projected = useMemo(() => {
    if (!data?.points) return [];
    return data.points.map((p) => ({
      ...p,
      cx: PAD + ((p.x + 1) / 2) * innerW,
      cy: PAD + ((1 - p.y) / 2) * innerH, // flip y so positive is up
      r: 3 + Math.log10((p.chunk_count || 1) + 1),
      fill: TIER_COLORS[p.uncertainty_tier] || '#b91c1c',
    }));
  }, [data, innerW, innerH]);

  // Compute labeled region centroids from clusters.json. Each cluster
  // sits at the mean (x, y) of its member interviews; the label is
  // the LLM-generated cluster name. We filter to clusters of size
  // >= 3 so the visualization isn't drowned in small-cluster labels,
  // and rank them by size so big clusters render last (= on top).
  const regions = useMemo(() => {
    if (!clusters?.length || !data?.points?.length) return [];
    const pointById = new Map();
    for (const p of data.points) {
      pointById.set(p.entry_number, p);
    }
    const result = [];
    for (const c of clusters) {
      if ((c.size || 0) < 3) continue;
      const members = c.members || (c.member_entry_subjects || []).map((s) => ({ entry_subject: s, entry_number: null }));
      let sumX = 0, sumY = 0, n = 0;
      for (const m of members) {
        const pt = pointById.get(m.entry_number);
        if (!pt) continue;
        sumX += pt.x;
        sumY += pt.y;
        n += 1;
      }
      if (n === 0) continue;
      const meanX = sumX / n;
      const meanY = sumY / n;
      const cx = PAD + ((meanX + 1) / 2) * innerW;
      const cy = PAD + ((1 - meanY) / 2) * innerH;
      result.push({
        cluster_id: c.cluster_id,
        name: c.name || `Cluster ${c.cluster_id}`,
        size: c.size,
        cx,
        cy,
        // Font size scales with cluster size: 11 for size 3, 16 for size 18.
        fontSize: Math.min(16, 9 + Math.sqrt(c.size) * 1.4),
      });
    }
    // Sort by size ascending so big-cluster labels render last and
    // sit on top of small-cluster labels at overlap points.
    return result.sort((a, b) => a.size - b.size);
  }, [clusters, data, innerW, innerH]);

  if (error) {
    return (
      <div className={`rag-constellation-error ${className} text-sm text-stone-500 p-4`}>
        Embedding-space map not yet available. It is generated by
        rag/precompute.mjs against the populated Pinecone index.
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className={`rag-constellation-loading ${className} bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-center`}
        style={{ width, height }}
        role="status"
        aria-live="polite"
      >
        <span className="text-sm text-stone-500">Loading the embedding space…</span>
      </div>
    );
  }

  return (
    <figure className={`rag-constellation ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Two-dimensional projection of the corpus into embedding space; dots represent interviews positioned by thematic similarity."
        className="bg-stone-50 rounded-lg border border-stone-200"
      >
        {/* TODO(dark-mode): SVG interior fills are hardcoded for light theme and
            need dark variants read from a theme flag: reference-grid stroke
            ('#e5e5e5'), the region-centroid labels (fill '#18181b' with a near-white
            'rgba(250,250,249,0.92)' stroke halo, which become dark-on-dark and
            invisible), and the hover-label halo. The SVG element background itself
            already inverts via the bg-stone-50 utility above. */}
        {/* Subtle reference grid */}
        <g aria-hidden="true">
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={`h-${f}`}
              x1={PAD}
              y1={PAD + f * innerH}
              x2={PAD + innerW}
              y2={PAD + f * innerH}
              stroke={isDark ? '#292524' : '#e5e5e5'}
              strokeWidth={1}
              strokeDasharray="2 4"
            />
          ))}
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={`v-${f}`}
              x1={PAD + f * innerW}
              y1={PAD}
              x2={PAD + f * innerW}
              y2={PAD + innerH}
              stroke={isDark ? '#292524' : '#e5e5e5'}
              strokeWidth={1}
              strokeDasharray="2 4"
            />
          ))}
        </g>

        {/* Labeled region centroids, the educational layer.
            Renders BEFORE the points so dots paint on top (preventing
            big-cluster labels from blocking individual-dot hover). */}
        {showRegions && regions.map((r) => (
          <text
            key={`region-${r.cluster_id}`}
            x={r.cx}
            y={r.cy}
            fontSize={r.fontSize}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontWeight={500}
            textAnchor="middle"
            paintOrder="stroke"
            stroke={isDark ? 'rgba(12,10,9,0.9)' : 'rgba(250,250,249,0.92)'}
            strokeWidth={4}
            strokeLinejoin="round"
            fill={isDark ? '#f5f5f4' : '#18181b'}
            opacity={0.85}
            style={{ pointerEvents: 'none' }}
          >
            {r.name}
          </text>
        ))}

        {/* Points */}
        <g>
          {projected.map((p) => (
            <circle
              key={p.entry_number}
              cx={p.cx}
              cy={p.cy}
              r={p.r}
              fill={p.fill}
              fillOpacity={hover && hover.entry_number !== p.entry_number ? 0.35 : 0.75}
              className="cursor-pointer transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900"
              onMouseEnter={() => setHover(p)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(p)}
              onBlur={() => setHover(null)}
              onClick={() => onSelect?.(p)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect?.(p);
                }
              }}
              tabIndex={onSelect ? 0 : -1}
              role={onSelect ? 'button' : 'img'}
              aria-label={`${p.entry_subject}, entry ${p.entry_number}, audit tier ${p.uncertainty_tier || 'unknown'}, ${p.chunk_count} chunks`}
            />
          ))}
        </g>

        {/* Hover label */}
        {hover && (
          <g aria-hidden="true">
            <rect
              x={Math.min(hover.cx + 8, width - 200)}
              y={Math.max(hover.cy - 28, 4)}
              width={190}
              height={36}
              rx={4}
              fill="#18181b"
              opacity={0.92}
            />
            <text
              x={Math.min(hover.cx + 16, width - 192)}
              y={Math.max(hover.cy - 12, 18)}
              fill="#fafaf9"
              fontSize={12}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {hover.entry_subject}
            </text>
            <text
              x={Math.min(hover.cx + 16, width - 192)}
              y={Math.max(hover.cy + 2, 32)}
              fill="#a8a29e"
              fontSize={10}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              Entry #{hover.entry_number} · {hover.chunk_count} chunks
            </text>
          </g>
        )}
      </svg>
      <figcaption className="text-xs text-stone-500 mt-2 max-w-xl">
        {projected.length} interviews shown. The axes don&apos;t represent any
        specific quantity, only distance between dots is meaningful, and a
        shorter distance means the AI judges the two interviews as covering
        more similar content. Hover for a name; click to see similar interviews.
      </figcaption>
      <div className="flex flex-wrap gap-3 mt-3 text-xs text-stone-700" aria-label="Audit fidelity legend">
        <span className="font-medium text-stone-900">Audit tier:</span>
        {SETTLED_STATES.map(({ label, color }) => (
          <span key={label} className="inline-flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: color, opacity: 0.75 }}
              aria-hidden="true"
            />
            {label}
          </span>
        ))}
      </div>
    </figure>
  );
}
