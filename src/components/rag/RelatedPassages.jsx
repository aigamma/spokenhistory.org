/**
 * @fileoverview RelatedPassages — show passages from OTHER interviewees
 * that are semantically related to the current entry.
 *
 * Consumes the precomputed JSON at /rag/related/entry-N.json (generated
 * by rag/precompute.mjs). Zero runtime retrieval cost; just a static
 * fetch + render. This is the panel that lives on every transcript page
 * and makes the "philosophy of embedding" claim visible — clicking
 * through reveals interviewees who never met but whose words land
 * close in the embedding space.
 */

import { useEffect, useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import { loadRelated, loadConstellation } from '../../services/ragClient';
import CitationCard from './CitationCard';
import { fidelityNoteFor } from './tiers';

// Module-scoped cache of entry_number → audit-fidelity fields, populated
// once per session from constellation.json. The per-chunk JSON files
// don't carry tier info per result (they would balloon by ~30%), so we
// look it up by entry_number when rendering each related-passage card.
//
// The cache stores a successful result indefinitely. On error, it
// resolves to an empty Map AND clears _tierCachePromise so a future
// caller can retry — useful if the constellation.json fetch fails on
// page load but later becomes available (e.g., temporary CDN miss).
let _tierCachePromise = null;
function loadTierLookup() {
  if (_tierCachePromise) return _tierCachePromise;
  _tierCachePromise = loadConstellation()
    .then((json) => {
      const map = new Map();
      if (json?.points) {
        for (const p of json.points) {
          map.set(p.entry_number, {
            uncertaintyTier: p.uncertainty_tier || null,
            entryProvenance: p.entry_provenance || null,
            uncertaintyScore: p.uncertainty_score ?? null,
            locItemUrl: p.loc_item_url || null,
          });
        }
      }
      return map;
    })
    .catch((e) => {
      // Allow retry on the next call by clearing the cached promise.
      // The current caller still gets a successful (empty) Map so the
      // UI degrades gracefully rather than throwing.
      _tierCachePromise = null;
      console.warn('[RelatedPassages] tier lookup failed; using empty fallback:', e?.message);
      return new Map();
    });
  return _tierCachePromise;
}

/**
 * RelatedPassages — sidebar/panel for related passages on a transcript page.
 *
 * Two display modes via the `mode` prop:
 *
 *   - "entries" (default): top-N most thematically related interviewees,
 *     each with their summary count + a hover preview.
 *   - "chunk": top-5 related passages for a specific chunk_index, for
 *     in-context "this passage is like…" affordances.
 *
 * @component
 * @param {Object} props
 * @param {number} props.entryNumber - The current entry (1-138).
 * @param {string} [props.mode='entries'] - 'entries' | 'chunk'.
 * @param {number} [props.chunkIndex] - Required when mode='chunk'.
 * @param {number} [props.limit=5]
 * @param {string} [props.className]
 * @returns {React.ReactElement}
 */
export default function RelatedPassages({
  entryNumber,
  mode = 'entries',
  chunkIndex = null,
  limit = 5,
  className = '',
  onNavigateToEntry = null,
}) {
  const [data, setData] = useState(null);
  const [tierMap, setTierMap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    Promise.all([loadRelated(entryNumber), loadTierLookup()])
      .then(([related, tiers]) => {
        if (cancelled) return;
        setData(related);
        setTierMap(tiers);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error('[RelatedPassages] load failed:', e);
        setError(e?.message || 'Failed to load related passages.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [entryNumber]);

  if (isLoading) {
    return (
      <aside className={`rag-related-loading ${className}`}>
        <Skeleton />
      </aside>
    );
  }

  if (error || !data) {
    return (
      <aside className={`rag-related-empty ${className} text-sm text-stone-500`}>
        <div className="inline-flex items-center gap-2">
          <AlertCircle className="w-4 h-4" aria-hidden="true" />
          Related passages unavailable for this entry yet.
        </div>
      </aside>
    );
  }

  if (mode === 'chunk') {
    const passages = (data.per_chunk?.[String(chunkIndex)] || []).slice(0, limit);
    if (passages.length === 0) {
      return null;
    }
    return (
      <aside className={`rag-related-chunk ${className}`}>
        <Header>Passages with similar meaning</Header>
        <ol className="space-y-3">
          {passages.map((p) => (
            <li key={p.id}>
              <CitationCard payload={passagePreviewToCard(p, tierMap)} showFullText={false} showCitation={false} />
            </li>
          ))}
        </ol>
      </aside>
    );
  }

  // mode === 'entries'
  const summary = data.related_entry_summary || {};
  const entries = Object.entries(summary)
    .map(([num, info]) => ({ entry_number: Number(num), ...info }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  if (entries.length === 0) {
    return null;
  }

  // The radial network is most legible with ≤8 spokes (label collisions
  // get bad past that). The list below shows the full set so users get
  // both the structural overview AND the long tail.
  const networkSlice = entries.slice(0, 8);

  return (
    <aside className={`rag-related-entries ${className}`}>
      <Header>Related interviewees</Header>
      <p className="text-sm text-stone-600 mb-4">
        These voices in the corpus discuss themes that overlap semantically with{' '}
        <strong>{data.entry_subject}</strong>&apos;s testimony, even when the interviews
        never reference each other. The radial graph shows the top {networkSlice.length} closest by
        passage-overlap count; the list below extends to all {entries.length}.
      </p>
      <RadialNetwork
        focal={data.entry_subject}
        related={networkSlice}
        onNavigate={onNavigateToEntry}
      />
      <ul className="space-y-2 mt-4">
        {entries.map((e) => (
          <li key={e.entry_number}>
            <button
              type="button"
              onClick={() => onNavigateToEntry?.(e.entry_number)}
              disabled={!onNavigateToEntry}
              className={
                'w-full flex items-center justify-between gap-4 py-2 px-3 rounded-md border text-left transition-colors ' +
                (onNavigateToEntry
                  ? 'bg-stone-50 border-stone-200 hover:bg-white hover:border-civil-red-strong cursor-pointer'
                  : 'bg-stone-50 border-stone-200 cursor-default')
              }
            >
              <div>
                <div className="font-medium text-stone-900">{e.entry_subject}</div>
                <div className="text-xs text-stone-500">
                  Entry #{e.entry_number}
                  {onNavigateToEntry && <> · click to make focal</>}
                </div>
              </div>
              <div className="text-xs text-stone-500 tabular-nums">
                {e.count} matching passages
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/**
 * RadialNetwork — small SVG showing the focal interviewee at center
 * with related voices arranged on a circle around it. Edges weighted
 * by passage-overlap count. Pure SVG; no library.
 *
 * The radial layout is the right choice here because the focal voice
 * is the privileged node — this isn't a peer graph, it's "voices in
 * conversation with X." Center-at-X makes that semantic explicit.
 */
function RadialNetwork({ focal, related, onNavigate = null }) {
  const W = 520;
  const H = 360;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) * 0.36;
  const [hoverIdx, setHoverIdx] = useState(-1);

  if (!related?.length) return null;
  const maxCount = Math.max(...related.map((r) => r.count || 1));

  // Distribute related nodes evenly around the circle.
  const nodes = related.map((r, i) => {
    const angle = (i / related.length) * Math.PI * 2 - Math.PI / 2; // start at top
    const x = cx + R * Math.cos(angle);
    const y = cy + R * Math.sin(angle);
    // Edge weight: sqrt to compress the range so a 475-count edge
    // isn't 5× the width of a 100-count edge.
    const weight = Math.sqrt(r.count || 1) / Math.sqrt(maxCount);
    return { ...r, x, y, angle, weight };
  });

  return (
    <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`Radial network: ${focal} at center, with ${related.length} related interviewees arrayed around them, edge thickness by passage overlap count.`}
        style={{ display: 'block' }}
      >
        {/* Edges */}
        {nodes.map((n, i) => (
          <line
            key={`edge-${i}`}
            x1={cx}
            y1={cy}
            x2={n.x}
            y2={n.y}
            stroke={hoverIdx === i ? '#B23E2F' : '#a8a29e'}
            strokeWidth={2 + n.weight * 6}
            strokeOpacity={hoverIdx === -1 || hoverIdx === i ? 0.85 : 0.25}
          />
        ))}

        {/* Outer nodes */}
        {nodes.map((n, i) => (
          <g
            key={`node-${i}`}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(-1)}
            onFocus={() => setHoverIdx(i)}
            onBlur={() => setHoverIdx(-1)}
            onClick={() => onNavigate?.(n.entry_number)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && onNavigate) {
                e.preventDefault();
                onNavigate(n.entry_number);
              }
            }}
            tabIndex={0}
            style={{ cursor: onNavigate ? 'pointer' : 'default', outline: 'none' }}
            role={onNavigate ? 'button' : 'img'}
            aria-label={`${n.entry_subject}: ${n.count} overlapping passages${onNavigate ? '. Click to make this the focal voice.' : ''}`}
          >
            <circle
              cx={n.x}
              cy={n.y}
              r={hoverIdx === i ? 11 : 8}
              fill={hoverIdx === i ? '#F2483C' : '#78716c'}
              stroke="#1c1917"
              strokeWidth={1.2}
              opacity={hoverIdx === -1 || hoverIdx === i ? 1 : 0.5}
            />
            <text
              x={n.x + (n.angle > -Math.PI / 2 && n.angle < Math.PI / 2 ? 16 : -16)}
              y={n.y + 4}
              fontSize={11}
              fontWeight={hoverIdx === i ? 600 : 500}
              fill="#1c1917"
              textAnchor={n.angle > -Math.PI / 2 && n.angle < Math.PI / 2 ? 'start' : 'end'}
              paintOrder="stroke"
              stroke="rgba(255,255,255,0.95)"
              strokeWidth={3}
              strokeLinejoin="round"
              fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
              style={{ pointerEvents: 'none' }}
              opacity={hoverIdx === -1 || hoverIdx === i ? 1 : 0.4}
            >
              {n.entry_subject}
            </text>
          </g>
        ))}

        {/* Focal node — central hub. The interviewee's name sits BELOW
            the circle on the white SVG background (not inside the red
            disc), so contrast is 14:1 (stone-900 on white) regardless
            of system color-scheme. The original "near-white text on
            brand red" was ~2.6:1, well below WCAG AA. */}
        <g>
          <circle cx={cx} cy={cy} r={20} fill="#F2483C" stroke="#1c1917" strokeWidth={2} />
          <text
            x={cx}
            y={cy + 4}
            fontSize={11}
            fontWeight={700}
            fill="#fafaf9"
            textAnchor="middle"
            paintOrder="stroke"
            stroke="#7f1d1d"
            strokeWidth={2}
            strokeLinejoin="round"
            fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
            style={{ pointerEvents: 'none' }}
            aria-hidden="true"
          >
            ★
          </text>
          <text
            x={cx}
            y={cy + 38}
            fontSize={13}
            fontWeight={600}
            fill="#1c1917"
            textAnchor="middle"
            paintOrder="stroke"
            stroke="rgba(255,255,255,0.95)"
            strokeWidth={3}
            strokeLinejoin="round"
            fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
            style={{ pointerEvents: 'none' }}
          >
            {focal}
          </text>
        </g>

        {/* Hover detail strip in the bottom */}
        {hoverIdx >= 0 && (
          <g>
            <rect x={12} y={H - 38} width={W - 24} height={28} rx={4} fill="#1c1917" opacity={0.92} />
            <text
              x={20}
              y={H - 20}
              fontSize={12}
              fill="#fafaf9"
              fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
            >
              {nodes[hoverIdx].entry_subject} — {nodes[hoverIdx].count} overlapping passages · top similarity {(nodes[hoverIdx].top_score || 0).toFixed(3)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

function Header({ children }) {
  return (
    <h3 className="flex items-center gap-2 text-base font-medium text-stone-900 mb-3">
      <Sparkles className="w-4 h-4 text-red-700" aria-hidden="true" />
      {children}
    </h3>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="h-4 w-40 bg-stone-200 rounded animate-pulse" />
      <div className="h-12 bg-stone-100 rounded animate-pulse" />
      <div className="h-12 bg-stone-100 rounded animate-pulse" />
      <div className="h-12 bg-stone-100 rounded animate-pulse" />
    </div>
  );
}

// Adapter: the precomputed JSON uses snake_case keys; CitationCard
// consumes the camelCase shape that /retrieve emits. Bridge them here
// so the card's contract stays single-shape. The audit-fidelity
// fields (uncertaintyTier, fidelityNote) aren't in the per-chunk
// records (they live per-entry, not per-chunk) — we resolve them
// from the tierMap that was built from constellation.json.
function passagePreviewToCard(p, tierMap) {
  const tierInfo = (tierMap && p.entry_number != null) ? tierMap.get(p.entry_number) : null;
  const tier = tierInfo?.uncertaintyTier ?? null;
  const provenance = tierInfo?.entryProvenance ?? p.entry_provenance ?? null;
  return {
    id: p.id,
    entryNumber: p.entry_number ?? null,
    entrySubject: p.entry_subject || null,
    text: p.text_preview || '',
    textPreview: p.text_preview || '',
    locItemUrl: p.loc_item_url || tierInfo?.locItemUrl || null,
    timestampStart: p.timestamp_start_seconds ?? null,
    timestampEnd: p.timestamp_end_seconds ?? null,
    timestampStartStr: formatTimestamp(p.timestamp_start_seconds),
    timestampEndStr: formatTimestamp(p.timestamp_end_seconds),
    entryProvenance: provenance,
    uncertaintyTier: tier,
    uncertaintyScore: tierInfo?.uncertaintyScore ?? null,
    fidelityNote: fidelityNoteFor(provenance, tier),
    suggestedCitation: null,
    similarity: p.score ?? null,
  };
}

function formatTimestamp(seconds) {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
