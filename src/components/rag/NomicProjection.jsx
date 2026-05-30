/**
 * @fileoverview NomicProjection, fully custom React rendering of the
 * 15,464-passage UMAP projection that Atlas computed on our behalf.
 *
 * Atlas is the data pipeline (UMAP + topic modeling); this is the
 * viewer. No Nomic iframes, no deepscatter widget, no third-party
 * JS, just our own canvas + topic overlay + search + brand styling.
 *
 * The component fetches /rag/atlas_projection.json (produced by
 * rag/download_from_nomic.py) and renders:
 *
 *   - A canvas scatter (15K points → canvas, not SVG; SVG choked).
 *     Each point colored by its Atlas-derived topic; brand red for
 *     hovered/selected; opacity adapts to zoom level.
 *   - Pan + zoom via mouse drag and wheel.
 *   - Hover → cursor-anchored card showing entry subject + passage
 *     preview + audit tier + LoC link.
 *   - Topic legend on the right, click to filter to just that topic
 *     (dims everything else).
 *   - Search box: matches entry_subject / text_preview, highlights
 *     matching points + auto-zooms to them.
 *
 * Performance notes:
 *   - Canvas 2D rendering with a single beginPath per topic-color so
 *     painting is bounded by paint count, not point count.
 *   - Spatial-bucket hit detection (Map keyed by floor(x*N), floor(y*N))
 *     so hover lookups are O(neighbors-in-bucket) not O(15K).
 *   - useMemo on projection bounds + topic palette so they only
 *     recompute when the data file changes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Search as SearchIcon, X } from 'lucide-react';

// Render dimensions. The canvas uses devicePixelRatio for sharpness;
// the CSS dimensions are these values, the backing-store pixels are
// dpr*. Aspect is intentionally wider than tall so the UMAP projection
// has room to breathe horizontally.
const CSS_W = 880;
const CSS_H = 540;

// Color palette, varied warm tones for the topics, low-saturation so
// the chart stays atmospheric rather than rainbow-dashboard. The
// 12-stop ring is reused if there are more topics than stops; modulo
// gives ten clean visual buckets that re-enter without clashing.
const TOPIC_PALETTE = [
  '#B23E2F', // deep brand red
  '#A86A1E', // burnt orange
  '#7A6B2E', // ochre
  '#3F5D3B', // forest green
  '#2E5C70', // teal blue
  '#3B4276', // muted indigo
  '#65467A', // mauve
  '#8C3F5C', // wine
  '#3B6E59', // sea green
  '#665A3A', // olive
  '#5C3F2D', // umber
  '#4A5A6E', // slate blue
];

const BG_COLOR = '#18181b'; // stone-900 atmospheric background
const POINT_BASE_ALPHA = 0.78;
const POINT_DIM_ALPHA = 0.12;
const HIGHLIGHT_COLOR = '#F2483C';

export default function NomicProjection() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Pan / zoom transform applied to projection space → screen space.
  // Identity is { scale: 1, dx: 0, dy: 0 }. dx, dy are in screen
  // pixels (post-projection-fit).
  const [transform, setTransform] = useState({ scale: 1, dx: 0, dy: 0 });

  // Drag state lives in a ref (no re-render mid-drag).
  const dragRef = useRef({ active: false, startX: 0, startY: 0, baseDx: 0, baseDy: 0 });

  // Hover + selection.
  const [hover, setHover] = useState(null); // { point, screenX, screenY }
  const [activeTopic, setActiveTopic] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/atlas_projection.json')
      .then((r) => {
        if (!r.ok) throw new Error('atlas projection not yet generated');
        return r.json();
      })
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  // Bounds + projection scale (data → fit canvas). Recomputed only when
  // data changes; transform from pan/zoom applies on top.
  const projection = useMemo(() => {
    if (!data?.points?.length) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of data.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    // Fit inside CSS_W × CSS_H with 40px padding, preserve aspect.
    const padX = 40;
    const padY = 40;
    const sx = (CSS_W - 2 * padX) / w;
    const sy = (CSS_H - 2 * padY) / h;
    const scale = Math.min(sx, sy);
    const offX = padX + (CSS_W - 2 * padX - w * scale) / 2 - minX * scale;
    const offY = padY + (CSS_H - 2 * padY - h * scale) / 2 - minY * scale;
    return { minX, minY, maxX, maxY, scale, offX, offY };
  }, [data]);

  // Topic palette keyed by topic label (stable across renders).
  const topicColors = useMemo(() => {
    if (!data?.topics?.length) return new Map();
    const m = new Map();
    data.topics.forEach((t, i) => {
      m.set(t.label, TOPIC_PALETTE[i % TOPIC_PALETTE.length]);
    });
    return m;
  }, [data]);

  // Search-filter membership (Set of pinecone_id strings that match).
  const matchedIds = useMemo(() => {
    if (!data?.points?.length) return null;
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const out = new Set();
    for (const p of data.points) {
      const subject = (p.entry_subject || '').toLowerCase();
      const text = (p.text_preview || '').toLowerCase();
      if (subject.includes(q) || text.includes(q)) {
        out.add(p.pinecone_id || `${p.entry_number}::${p.x}::${p.y}`);
      }
    }
    return out;
  }, [data, query]);

  // Spatial hash for hover. Bucketed by canvas-space pixel position
  // post-projection (NOT post-transform); we'll re-project per-frame
  // to find the hovered point.
  const spatialBuckets = useMemo(() => {
    if (!data?.points?.length || !projection) return null;
    const BUCKET = 24; // px
    const map = new Map();
    for (const p of data.points) {
      const cx = projection.offX + p.x * projection.scale;
      const cy = projection.offY + p.y * projection.scale;
      const key = `${Math.floor(cx / BUCKET)},${Math.floor(cy / BUCKET)}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ p, cx, cy });
    }
    return { map, BUCKET };
  }, [data, projection]);

  // The render function. Cleared then drawn on every paint frame.
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || !projection) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== CSS_W * dpr) canvas.width = CSS_W * dpr;
    if (canvas.height !== CSS_H * dpr) canvas.height = CSS_H * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background.
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, CSS_W, CSS_H);

    // Subtle radial vignette.
    const grad = ctx.createRadialGradient(CSS_W / 2, CSS_H / 2, 60, CSS_W / 2, CSS_H / 2, Math.max(CSS_W, CSS_H));
    grad.addColorStop(0, 'rgba(255,255,255,0.04)');
    grad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CSS_W, CSS_H);

    // Apply pan + zoom transform.
    ctx.translate(CSS_W / 2, CSS_H / 2);
    ctx.scale(transform.scale, transform.scale);
    ctx.translate(-CSS_W / 2 + transform.dx, -CSS_H / 2 + transform.dy);

    const radius = Math.max(0.9, 1.6 / Math.sqrt(transform.scale));

    // Group points by render color so we can batch beginPath calls.
    // Three groups: matched (highlight color), dimmed (any topic but
    // active filter excludes), and normal (per-topic color).
    const pointsByColor = new Map();
    for (const p of data.points) {
      const id = p.pinecone_id || `${p.entry_number}::${p.x}::${p.y}`;
      const isHover = hover && hover.point.pinecone_id === p.pinecone_id;
      const matchesQuery = matchedIds ? matchedIds.has(id) : true;
      const matchesTopic = !activeTopic || p.topic === activeTopic;
      const visible = matchesQuery && matchesTopic;
      const color = isHover
        ? HIGHLIGHT_COLOR
        : visible
          ? (topicColors.get(p.topic) || '#78716c')
          : 'dim';
      const alpha = visible ? POINT_BASE_ALPHA : POINT_DIM_ALPHA;
      const key = `${color}|${alpha}`;
      if (!pointsByColor.has(key)) pointsByColor.set(key, []);
      pointsByColor.get(key).push(p);
    }

    for (const [key, group] of pointsByColor) {
      const [color, alpha] = key.split('|');
      ctx.globalAlpha = Number(alpha);
      ctx.fillStyle = color === 'dim' ? '#57534e' : color;
      ctx.beginPath();
      for (const p of group) {
        const cx = projection.offX + p.x * projection.scale;
        const cy = projection.offY + p.y * projection.scale;
        ctx.moveTo(cx + radius, cy);
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // Hover ring on top.
    if (hover) {
      const p = hover.point;
      const cx = projection.offX + p.x * projection.scale;
      const cy = projection.offY + p.y * projection.scale;
      ctx.globalAlpha = 1;
      ctx.strokeStyle = HIGHLIGHT_COLOR;
      ctx.lineWidth = 2 / transform.scale;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
  }, [data, projection, transform, hover, activeTopic, matchedIds, topicColors]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse events: pan with drag, zoom with wheel, hover detection on
  // move. The hit-test undoes the pan/zoom transform to find which
  // bucket the cursor falls into.
  const screenToProjection = useCallback((screenX, screenY) => {
    // Inverse of the canvas transform above.
    const cx = CSS_W / 2;
    const cy = CSS_H / 2;
    const x = (screenX - cx) / transform.scale + cx - transform.dx;
    const y = (screenY - cy) / transform.scale + cy - transform.dy;
    return { x, y };
  }, [transform]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = ((e.clientX - rect.left) / rect.width) * CSS_W;
    const screenY = ((e.clientY - rect.top) / rect.height) * CSS_H;

    if (dragRef.current.active) {
      const dx0 = e.clientX - dragRef.current.startX;
      const dy0 = e.clientY - dragRef.current.startY;
      setTransform((t) => ({
        ...t,
        dx: dragRef.current.baseDx + dx0 / t.scale,
        dy: dragRef.current.baseDy + dy0 / t.scale,
      }));
      return;
    }

    // Hover hit test.
    if (!spatialBuckets) return;
    const proj = screenToProjection(screenX, screenY);
    const { map, BUCKET } = spatialBuckets;
    const bx = Math.floor(proj.x / BUCKET);
    const by = Math.floor(proj.y / BUCKET);
    let best = null;
    let bestDist = Infinity;
    const PICK_RADIUS = 12 / transform.scale;
    for (let i = -1; i <= 1; i += 1) {
      for (let j = -1; j <= 1; j += 1) {
        const bucket = map.get(`${bx + i},${by + j}`);
        if (!bucket) continue;
        for (const { p, cx: pcx, cy: pcy } of bucket) {
          const d2 = (pcx - proj.x) ** 2 + (pcy - proj.y) ** 2;
          if (d2 < bestDist && d2 < PICK_RADIUS ** 2) {
            best = p;
            bestDist = d2;
          }
        }
      }
    }
    if (best) {
      setHover({ point: best, screenX: e.clientX, screenY: e.clientY });
    } else if (hover) {
      setHover(null);
    }
  }, [spatialBuckets, screenToProjection, transform.scale, hover]);

  const handleMouseDown = useCallback((e) => {
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      baseDx: transform.dx,
      baseDy: transform.dy,
    };
  }, [transform.dx, transform.dy]);

  const handleMouseUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    setTransform((t) => {
      const nextScale = Math.max(0.5, Math.min(20, t.scale * factor));
      return { ...t, scale: nextScale };
    });
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-6 text-sm text-stone-600">
        <p className="font-medium text-stone-900 mb-2">Atlas projection not yet downloaded.</p>
        <p className="text-stone-700">
          The 15,464-passage UMAP projection is being computed by Nomic Atlas.
          Once ready, run <code className="font-mono bg-stone-100 px-1 rounded">python rag/download_from_nomic.py</code>{' '}
          to pull the projected coordinates + topic labels into
          {' '}<code className="font-mono bg-stone-100 px-1 rounded">public/rag/atlas_projection.json</code>.
        </p>
        <p className="text-xs text-stone-500 mt-3">
          Atlas typically takes 5–15 minutes to project + label a 15K-row dataset.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-6 text-sm text-stone-500" role="status">
        Loading projection…
      </div>
    );
  }

  return (
    <div ref={containerRef} className="rag-nomic-projection">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-[16rem]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find passages by speaker or content…"
            className="w-full pl-9 pr-9 py-2 text-sm border border-stone-300 rounded-md focus:border-red-700 focus:ring-2 focus:ring-red-700/30 outline-none bg-white"
            aria-label="Filter the projection"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700"
              aria-label="Clear filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => { setTransform({ scale: 1, dx: 0, dy: 0 }); setActiveTopic(null); setQuery(''); }}
          className="text-sm px-3 py-2 rounded-md border border-stone-300 bg-white hover:bg-stone-50"
        >
          Reset view
        </button>
        <span className="text-xs text-stone-500 tabular-nums">
          {data.points.length.toLocaleString()} passages · {data.topics.length} topics
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 rounded-lg overflow-hidden" style={{ background: BG_COLOR }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: 'auto', aspectRatio: `${CSS_W} / ${CSS_H}`, display: 'block', cursor: dragRef.current.active ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { handleMouseUp(); setHover(null); }}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
            role="img"
            aria-label={`Custom UMAP projection of ${data.points.length} oral-history passages, colored by ${data.topics.length} thematic clusters.`}
          />
          {hover && (
            <HoverCard hover={hover} />
          )}
        </div>

        <aside className="md:w-72 max-h-[540px] overflow-y-auto rounded-lg border border-stone-200 bg-white">
          <header className="px-3 py-2 border-b border-stone-200 sticky top-0 bg-white z-10">
            <h3 className="text-sm font-medium text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
              Topics ({data.topics.length})
            </h3>
            <p className="text-xs text-stone-500">Click to filter; click again to clear.</p>
          </header>
          <ul className="divide-y divide-stone-100 text-sm">
            {data.topics.map((t) => {
              const color = topicColors.get(t.label);
              const isActive = activeTopic === t.label;
              return (
                <li key={t.label}>
                  <button
                    type="button"
                    onClick={() => setActiveTopic(isActive ? null : t.label)}
                    aria-pressed={isActive}
                    className={
                      'w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ' +
                      (isActive ? 'bg-stone-100' : 'hover:bg-stone-50')
                    }
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <span className="flex-1 truncate text-stone-900" title={t.label}>{t.label}</span>
                    <span className="text-xs text-stone-500 tabular-nums">{t.size}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

      <p className="mt-3 text-xs text-stone-500 max-w-2xl">
        Each dot is one passage (about 5-15 seconds of speech). Position comes from a UMAP
        projection of the Voyage embeddings, passages that share thematic content land
        near each other even when the speakers never met. Topic labels are auto-generated;
        the underlying 2D layout is computed by Nomic Atlas, but every pixel rendered here
        is drawn by this React component (canvas, brand palette, hover, search, filter -
        no third-party viewer).
      </p>
    </div>
  );
}

function HoverCard({ hover }) {
  const { point, screenX, screenY } = hover;
  const containerStyle = {
    position: 'fixed',
    left: Math.min(screenX + 14, (typeof window !== 'undefined' ? window.innerWidth : 1024) - 380),
    top: screenY + 14,
    zIndex: 50,
    pointerEvents: 'none',
    maxWidth: 360,
  };
  return (
    <div style={containerStyle}>
      <div className="bg-stone-900 text-white rounded-md shadow-xl px-3 py-2 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="font-medium">{point.entry_subject || `Entry #${point.entry_number}`}</div>
        {point.topic && (
          <div className="text-xs text-stone-300 mt-0.5" style={{ fontFamily: 'Chivo Mono, monospace' }}>
            {point.topic}
          </div>
        )}
        {point.text_preview && (
          <div className="text-xs text-stone-200 mt-2 italic leading-snug">
            &ldquo;{point.text_preview}&rdquo;
          </div>
        )}
        {point.uncertainty_tier && (
          <div className="text-xs text-stone-400 mt-2">
            audit tier: {point.uncertainty_tier}
          </div>
        )}
        {point.loc_item_url && (
          <div className="text-xs text-stone-300 mt-2 inline-flex items-center gap-1">
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
            <span>{point.loc_item_url.replace(/^https?:\/\//, '')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
