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
    .catch(() => new Map());
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

  return (
    <aside className={`rag-related-entries ${className}`}>
      <Header>Related interviewees</Header>
      <p className="text-sm text-stone-600 mb-4">
        These voices in the corpus discuss themes that overlap semantically with{' '}
        <strong>{data.entry_subject}</strong>&apos;s testimony, even when the interviews
        never reference each other.
      </p>
      <ul className="space-y-2">
        {entries.map((e) => (
          <li
            key={e.entry_number}
            className="flex items-center justify-between gap-4 py-2 px-3 rounded-md bg-stone-50 border border-stone-200"
          >
            <div>
              <div className="font-medium text-stone-900">{e.entry_subject}</div>
              <div className="text-xs text-stone-500">Entry #{e.entry_number}</div>
            </div>
            <div className="text-xs text-stone-500 tabular-nums">
              {e.count} matching passages
            </div>
          </li>
        ))}
      </ul>
    </aside>
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
