/**
 * @fileoverview InterviewMap, the abandoned-and-rebuilt Constellation.
 *
 * Eric's critique of the original Constellation tab: "Just having a
 * dot randomly float over a dot and hoping to hit the one out of 136
 * you're looking for is absurd, especially with no guidance whatsoever
 * on the axes." This component is the answer: same conceptual demo
 * (each interview as one dot in the corpus's thematic space), but:
 *
 *   - Uses the **Atlas UMAP projection** as its substrate, not the
 *     old hand-rolled PCA. Same coordinate system as the PassageMap,
 *     so the two views are zoomed-out and zoomed-in faces of the
 *     same atlas. Passages are aggregated to interview centroids
 *     (mean x, y of all chunks belonging to one entry_number).
 *
 *   - **Names are labeled, not hidden behind hover.** Every dot has
 *     its interviewee's name rendered alongside it (paint-order
 *     stroke for legibility). Density is low enough (136 dots ~ 1
 *     per 4000 px²) that the labels read clean.
 *
 *   - **Search-to-find** instead of hover-treasure-hunt. Type a name
 *     and matching dots highlight while non-matches dim. Cross-corpus
 *     filtering by audit tier from a checkbox row.
 *
 *   - **Empirically derived axis labels.** UMAP dims are still
 *     abstract math (no human "x means …" exists), but we can show
 *     the user what's at each pole by labeling the axis ends with
 *     the topic that dominates that end. So instead of an unlabeled
 *     x-axis, you get "← Black Panther Movement" ... "Religion →"
 *     read off the actual data.
 *
 *   - **Topic regions overlaid** (same treatment as the previous
 *     Constellation iteration), giving the user a sense of which
 *     thematic territory each part of the map represents.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon, X, ExternalLink, Loader2 } from 'lucide-react';
import { TIER_COLORS, TIER_BADGE, TIER_VOCABULARY } from './tiers';
import { retrieve } from '../../services/ragClient';
import CitationCard from './CitationCard';

const W = 880;
const H = 620;
const PAD = 60;

export default function InterviewMap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [allowedTiers, setAllowedTiers] = useState(new Set(TIER_VOCABULARY));
  // Top-5 most-related interviewees for the currently selected dot,
  // fetched from the precomputed /rag/related/entry-N.json. Drawn as
  // soft curves from the focal dot to each neighbor so the audience
  // SEES the semantic neighborhood instead of reading it as a list.
  const [neighbors, setNeighbors] = useState(null);
  // Concept-query projection, UMAP can't directly project new
  // queries because it's a learned nonlinear embedding (no inverse
  // transform). Instead we use the nearest-neighbor approximation:
  // find the centroid whose 1024-dim vector is most cosine-similar
  // to the query embedding, render a marker at THAT centroid's UMAP
  // coord plus a "closest voice" annotation. Pedagogically honest;
  // the marker visibly snaps onto an existing dot.
  const [conceptInput, setConceptInput] = useState('');
  const [conceptQuery, setConceptQuery] = useState(null);
  const [conceptLoading, setConceptLoading] = useState(false);
  const [conceptError, setConceptError] = useState(null);
  const [conceptNearest, setConceptNearest] = useState(null); // { entry_number, similarity }
  const [conceptResults, setConceptResults] = useState(null);
  const [centroids, setCentroids] = useState(null); // lazy-loaded on first query

  const handleConceptSubmit = useCallback(async (e) => {
    e?.preventDefault?.();
    const q = conceptInput.trim();
    if (!q || conceptLoading) return;
    setConceptLoading(true);
    setConceptError(null);
    setConceptQuery(q);
    setConceptNearest(null);
    setConceptResults(null);
    try {
      // Lazy-load centroids only when first needed. 4MB; one-shot per
      // session. Fine for the demo path; default page load stays light.
      let cs = centroids;
      if (!cs) {
        const r = await fetch('/rag/centroids.json');
        if (!r.ok) throw new Error('Failed to load centroids');
        cs = await r.json();
        setCentroids(cs);
      }
      const { results, meta } = await retrieve(q, {
        topN: 5,
        includeQueryEmbedding: true,
        dedupeByEntry: true,
      });
      const qVec = meta?.queryEmbedding;
      if (!Array.isArray(qVec) || qVec.length !== 1024) {
        throw new Error('Backend did not return a 1024-dim query embedding.');
      }
      // Find nearest centroid by cosine similarity. Both vectors
      // expected to be L2-normalized already; if not, normalize.
      let qNorm = 0;
      for (let i = 0; i < qVec.length; i++) qNorm += qVec[i] * qVec[i];
      qNorm = Math.sqrt(qNorm) || 1;
      let best = null;
      let bestSim = -Infinity;
      for (const c of cs) {
        if (!Array.isArray(c.vector) || c.vector.length !== qVec.length) continue;
        let dot = 0;
        let cNorm = 0;
        for (let i = 0; i < qVec.length; i++) {
          dot += qVec[i] * c.vector[i];
          cNorm += c.vector[i] * c.vector[i];
        }
        cNorm = Math.sqrt(cNorm) || 1;
        const sim = dot / (qNorm * cNorm);
        if (sim > bestSim) {
          bestSim = sim;
          best = c;
        }
      }
      if (best) {
        setConceptNearest({ entry_number: best.entry_number, entry_subject: best.entry_subject, similarity: bestSim });
      }
      setConceptResults(Array.isArray(results) ? results : []);
    } catch (err) {
      setConceptError(err?.detail?.message || err?.message || 'Query projection failed.');
    } finally {
      setConceptLoading(false);
    }
  }, [conceptInput, conceptLoading, centroids]);

  const clearConcept = useCallback(() => {
    setConceptInput('');
    setConceptQuery(null);
    setConceptNearest(null);
    setConceptResults(null);
    setConceptError(null);
  }, []);

  // One-click example queries, same set as Spectrum + Word Search
  // so visitors get consistent prompts across surfaces. Clicking one
  // populates the input AND runs the full nearest-centroid lookup.
  const runExample = useCallback(async (text) => {
    setConceptInput(text);
    setConceptLoading(true);
    setConceptError(null);
    setConceptQuery(text);
    setConceptNearest(null);
    setConceptResults(null);
    try {
      let cs = centroids;
      if (!cs) {
        const r = await fetch('/rag/centroids.json');
        if (!r.ok) throw new Error('Failed to load centroids');
        cs = await r.json();
        setCentroids(cs);
      }
      const { results, meta } = await retrieve(text, {
        topN: 5,
        includeQueryEmbedding: true,
        dedupeByEntry: true,
      });
      const qVec = meta?.queryEmbedding;
      if (!Array.isArray(qVec) || qVec.length !== 1024) {
        throw new Error('Backend did not return a 1024-dim query embedding.');
      }
      let qNorm = 0;
      for (let i = 0; i < qVec.length; i++) qNorm += qVec[i] * qVec[i];
      qNorm = Math.sqrt(qNorm) || 1;
      let best = null;
      let bestSim = -Infinity;
      for (const c of cs) {
        if (!Array.isArray(c.vector) || c.vector.length !== qVec.length) continue;
        let dot = 0;
        let cNorm = 0;
        for (let i = 0; i < qVec.length; i++) {
          dot += qVec[i] * c.vector[i];
          cNorm += c.vector[i] * c.vector[i];
        }
        cNorm = Math.sqrt(cNorm) || 1;
        const sim = dot / (qNorm * cNorm);
        if (sim > bestSim) {
          bestSim = sim;
          best = c;
        }
      }
      if (best) {
        setConceptNearest({ entry_number: best.entry_number, entry_subject: best.entry_subject, similarity: bestSim });
      }
      setConceptResults(Array.isArray(results) ? results : []);
    } catch (err) {
      setConceptError(err?.detail?.message || err?.message || 'Query projection failed.');
    } finally {
      setConceptLoading(false);
    }
  }, [centroids]);

  useEffect(() => {
    if (selected == null) {
      setNeighbors(null);
      return undefined;
    }
    let cancelled = false;
    fetch(`/rag/related/entry-${selected}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('related not found'))))
      .then((j) => {
        if (cancelled) return;
        const summary = j?.related_entry_summary || {};
        const top = Object.entries(summary)
          .map(([num, info]) => ({ entry_number: Number(num), count: info.count || 0 }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setNeighbors(top);
      })
      .catch(() => { if (!cancelled) setNeighbors([]); });
    return () => { cancelled = true; };
  }, [selected]);

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/atlas_projection.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('atlas projection not yet generated'))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  // Aggregate passages → 136 interview centroids. We also tally the
  // most-common topic per interview so each dot has a "primary topic"
  // for color encoding.
  const interviews = useMemo(() => {
    if (!data?.points?.length) return null;
    const byEntry = new Map();
    for (const p of data.points) {
      if (p.entry_number == null) continue;
      if (!byEntry.has(p.entry_number)) {
        byEntry.set(p.entry_number, {
          entry_number: p.entry_number,
          entry_subject: p.entry_subject,
          uncertainty_tier: p.uncertainty_tier || 'unknown',
          loc_item_url: p.loc_item_url || null,
          sx: 0, sy: 0, n: 0,
          topicTally: new Map(),
        });
      }
      const e = byEntry.get(p.entry_number);
      e.sx += p.x;
      e.sy += p.y;
      e.n += 1;
      if (p.topic) {
        e.topicTally.set(p.topic, (e.topicTally.get(p.topic) || 0) + 1);
      }
    }
    const out = [];
    for (const e of byEntry.values()) {
      const x = e.sx / e.n;
      const y = e.sy / e.n;
      // primary topic = most common across this interview's chunks
      let primary = null;
      let primaryCount = 0;
      for (const [t, c] of e.topicTally) {
        if (c > primaryCount) {
          primary = t;
          primaryCount = c;
        }
      }
      out.push({
        entry_number: e.entry_number,
        entry_subject: e.entry_subject,
        uncertainty_tier: e.uncertainty_tier,
        loc_item_url: e.loc_item_url,
        x, y,
        n_chunks: e.n,
        primary_topic: primary,
      });
    }
    return out;
  }, [data]);

  // Axis bounds + projection.
  const bounds = useMemo(() => {
    if (!interviews?.length) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const i of interviews) {
      if (i.x < minX) minX = i.x;
      if (i.x > maxX) maxX = i.x;
      if (i.y < minY) minY = i.y;
      if (i.y > maxY) maxY = i.y;
    }
    return { minX, minY, maxX, maxY };
  }, [interviews]);

  // Derive empirical axis labels: which topic dominates the +x, -x,
  // +y, -y poles? Take the top-15 interviews at each pole, find the
  // topic that appears most often among their primary_topic.
  const axisLabels = useMemo(() => {
    if (!interviews?.length) return null;
    const findDominant = (sortedByPole) => {
      const top = sortedByPole.slice(0, 15);
      const tally = new Map();
      for (const i of top) {
        if (!i.primary_topic) continue;
        tally.set(i.primary_topic, (tally.get(i.primary_topic) || 0) + 1);
      }
      let bestT = null;
      let bestN = 0;
      for (const [t, n] of tally) {
        if (n > bestN) { bestT = t; bestN = n; }
      }
      return bestT;
    };
    return {
      negX: findDominant([...interviews].sort((a, b) => a.x - b.x)),
      posX: findDominant([...interviews].sort((a, b) => b.x - a.x)),
      negY: findDominant([...interviews].sort((a, b) => a.y - b.y)),
      posY: findDominant([...interviews].sort((a, b) => b.y - a.y)),
    };
  }, [interviews]);

  // Search matching set (entry_numbers whose subject matches query).
  const matched = useMemo(() => {
    if (!interviews?.length) return null;
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const set = new Set();
    for (const i of interviews) {
      if ((i.entry_subject || '').toLowerCase().includes(q)) set.add(i.entry_number);
    }
    return set;
  }, [interviews, query]);

  if (error) {
    return (
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-6 text-sm text-stone-600">
        <p>Atlas projection not yet downloaded.</p>
        <p className="font-mono mt-2 text-xs">python rag/download_from_nomic.py</p>
      </div>
    );
  }

  if (!data || !interviews || !bounds) {
    return (
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-6 text-sm text-stone-500" role="status">
        Loading interview map…
      </div>
    );
  }

  const innerW = W - 2 * PAD;
  const innerH = H - 2 * PAD;
  const px = (x) => PAD + ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * innerW;
  const py = (y) => PAD + (1 - (y - bounds.minY) / (bounds.maxY - bounds.minY)) * innerH;

  const visibleInterviews = interviews.filter((i) => allowedTiers.has(i.uncertainty_tier));

  return (
    <div className="rag-interview-map">
      <p className="text-sm text-stone-600 mb-4 max-w-3xl">
        136 interviews, each one a dot, positioned by the Atlas UMAP
        projection, same coordinate system as the Passage map, just
        aggregated to interview-scale (the mean of each interviewee&apos;s
        passages). The axes are abstract directions in embedding space,
        but the axis labels below show which topic dominates each pole,
        derived from the data itself. Type a name to find someone; click
        a dot to see their details.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-[14rem]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find an interviewee by name…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-stone-300 rounded-md focus:border-red-700 focus:ring-2 focus:ring-red-700/30 outline-none bg-white"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700" aria-label="Clear search">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-stone-500">Audit tier:</span>
          {TIER_VOCABULARY.map((tier) => {
            const active = allowedTiers.has(tier);
            return (
              <label
                key={tier}
                className={'inline-flex items-center gap-1.5 px-2 py-1 rounded-full border cursor-pointer ' + (active ? 'border-stone-700 bg-white' : 'border-stone-200 bg-stone-50 opacity-50')}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => {
                    const next = new Set(allowedTiers);
                    if (active) next.delete(tier); else next.add(tier);
                    setAllowedTiers(next);
                  }}
                  className="sr-only"
                />
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: TIER_COLORS[tier] }} aria-hidden="true" />
                <span>{tier}</span>
              </label>
            );
          })}
          {allowedTiers.size < TIER_VOCABULARY.length && (
            <button
              type="button"
              onClick={() => setAllowedTiers(new Set(TIER_VOCABULARY))}
              className="text-xs text-stone-500 hover:text-stone-900 underline ml-1"
            >
              show all
            </button>
          )}
        </div>
      </div>

      {/* Concept-query projection input, type a phrase, find the
          single most semantically-similar interview by cosine on the
          1024-dim centroids, render a green-ringed pin at that
          centroid's UMAP coord. */}
      <form onSubmit={handleConceptSubmit} className="mb-3 max-w-2xl">
        <div className="relative">
          <input
            type="text"
            value={conceptInput}
            onChange={(e) => setConceptInput(e.target.value)}
            placeholder="Project a phrase onto the map (finds closest voice)…"
            className="w-full pl-3 pr-24 py-2 text-sm border border-emerald-400 rounded-md focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30 outline-none bg-white"
            aria-label="Project a phrase onto the interview map"
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
          <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1.5">
            {conceptError}
          </p>
        )}
        {conceptNearest && conceptQuery && !conceptError && (
          <p className="text-xs text-emerald-900 mt-1.5">
            <span className="text-emerald-700 font-medium">●</span>{' '}
            Closest voice to &ldquo;{conceptQuery}&rdquo;:{' '}
            <strong>{conceptNearest.entry_subject}</strong>{' '}
            (cosine similarity <span className="font-mono tabular-nums">{conceptNearest.similarity.toFixed(3)}</span>)
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
                className="px-2 py-0.5 rounded-full border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 hover:border-emerald-500 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </form>

      {visibleInterviews.length === 0 && interviews.length > 0 && (
        <p className="mb-3 text-sm text-stone-500">
          All {interviews.length} interviews are in tiers you&apos;ve hidden.{' '}
          <button
            type="button"
            className="underline hover:text-stone-900"
            onClick={() => setAllowedTiers(new Set(TIER_VOCABULARY))}
          >
            Show all tiers
          </button>
          {' '}to see them.
        </p>
      )}

      <div className="rounded-lg border border-stone-200 bg-stone-50 overflow-hidden">
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="136 interviewees positioned in UMAP-projected embedding space, with empirically-derived axis labels and names."
          style={{ display: 'block', background: '#fafaf9' }}
        >
          {/* Quadrant guidelines */}
          <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="#e7e5e4" strokeDasharray="3 5" />
          <line x1={W / 2} y1={PAD} x2={W / 2} y2={H - PAD} stroke="#e7e5e4" strokeDasharray="3 5" />

          {/* Empirical axis labels: which topic dominates each pole.
              Pinned INSIDE the chart frame at the four cardinal
              gutters so long labels never bleed past the SVG edges. */}
          {axisLabels && (
            <g aria-hidden="true">
              {axisLabels.negX && (
                <text x={8} y={H / 2 + 4} fontSize={12} fontWeight={500} fill="#57534e" textAnchor="start" fontFamily="Inter, ui-sans-serif, system-ui, sans-serif">
                  ← {axisLabels.negX}
                </text>
              )}
              {axisLabels.posX && (
                <text x={W - 8} y={H / 2 + 4} fontSize={12} fontWeight={500} fill="#57534e" textAnchor="end" fontFamily="Inter, ui-sans-serif, system-ui, sans-serif">
                  {axisLabels.posX} →
                </text>
              )}
              {axisLabels.posY && (
                <text x={W / 2} y={16} fontSize={12} fontWeight={500} fill="#57534e" textAnchor="middle" fontFamily="Inter, ui-sans-serif, system-ui, sans-serif">
                  ↑ {axisLabels.posY}
                </text>
              )}
              {axisLabels.negY && (
                <text x={W / 2} y={H - 8} fontSize={12} fontWeight={500} fill="#57534e" textAnchor="middle" fontFamily="Inter, ui-sans-serif, system-ui, sans-serif">
                  ↓ {axisLabels.negY}
                </text>
              )}
            </g>
          )}

          {/* Neighbor links, when a dot is selected, draw soft red
              curves from the focal dot to its top-5 semantically-
              related interviewees. Stroke opacity scales with the
              passage-overlap count, so the strongest connection (e.g.
              Aaron Dixon ↔ Elmer Dixon) reads as the thickest line.
              Drawn BEFORE the dots so dots sit on top of the curves. */}
          {selected != null && neighbors && neighbors.length > 0 && (() => {
            const focus = interviews.find((i) => i.entry_number === selected);
            if (!focus) return null;
            const fx = px(focus.x);
            const fy = py(focus.y);
            const maxCount = neighbors[0].count || 1;
            return (
              <g aria-hidden="true">
                {neighbors.map((n) => {
                  const tgt = interviews.find((i) => i.entry_number === n.entry_number);
                  if (!tgt) return null;
                  const tx = px(tgt.x);
                  const ty = py(tgt.y);
                  // Quadratic Bezier with control point perpendicular
                  // to the midpoint, gives a soft arc that visually
                  // separates overlapping straight lines when several
                  // neighbors sit in the same direction.
                  const mx = (fx + tx) / 2;
                  const my = (fy + ty) / 2;
                  const dx = tx - fx;
                  const dy = ty - fy;
                  const len = Math.max(Math.hypot(dx, dy), 1);
                  const curveAmount = Math.min(len * 0.18, 36);
                  const cx = mx + (-dy / len) * curveAmount;
                  const cy = my + (dx / len) * curveAmount;
                  const strength = n.count / maxCount;
                  return (
                    <path
                      key={`link-${n.entry_number}`}
                      d={`M ${fx.toFixed(1)} ${fy.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`}
                      fill="none"
                      stroke="#F2483C"
                      strokeWidth={1.2 + strength * 1.8}
                      strokeOpacity={0.28 + strength * 0.42}
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>
            );
          })()}

          {/* Dots + names */}
          {(() => {
            const neighborIds = new Set((neighbors || []).map((n) => n.entry_number));
            return visibleInterviews.map((i) => {
              const cx = px(i.x);
              const cy = py(i.y);
              const isMatch = !matched || matched.has(i.entry_number);
              const isFocus = (selected === i.entry_number) || (hover?.entry_number === i.entry_number);
              const isNeighbor = neighborIds.has(i.entry_number);
              const tierColor = TIER_COLORS[i.uncertainty_tier] || '#78716c';
              const baseAlpha = matched && !isMatch ? 0.12 : 0.85;
              return (
                <g
                  key={i.entry_number}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setSelected(selected === i.entry_number ? null : i.entry_number)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  style={{ cursor: 'pointer', outline: 'none' }}
                  role="button"
                  aria-label={`${i.entry_subject}, ${i.n_chunks} passages${isNeighbor ? ', semantic neighbor of selected interview' : ''}`}
                >
                  {/* Faint red ring on neighbors so the audience sees WHERE
                      each curve lands, even when the dot is small. */}
                  {isNeighbor && !isFocus && (
                    <circle cx={cx} cy={cy} r={9} fill="none" stroke="#F2483C" strokeWidth={1.5} strokeOpacity={0.6} />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isFocus ? 8 : (isNeighbor ? 5.5 : (matched && isMatch ? 5.5 : 4))}
                    fill={isFocus ? '#F2483C' : tierColor}
                    fillOpacity={isFocus ? 1 : (isNeighbor ? 1 : baseAlpha)}
                    stroke={isFocus ? '#1c1917' : 'transparent'}
                    strokeWidth={isFocus ? 1.5 : 0}
                  />
                  {/* Name label, render alongside the dot, with stroke
                      halo so it stays readable over any background. */}
                  {(isMatch || isFocus || isNeighbor) && (
                    <text
                      x={cx + 8}
                      y={cy + 4}
                      fontSize={isFocus ? 13 : (isNeighbor ? 11 : 10)}
                      fontWeight={isFocus ? 600 : (isNeighbor ? 600 : 400)}
                      fill={isFocus ? '#1c1917' : (isNeighbor ? '#B23E2F' : '#44403c')}
                      opacity={matched && !isMatch && !isNeighbor ? 0.2 : 1}
                      paintOrder="stroke"
                      stroke="rgba(250,250,249,0.95)"
                      strokeWidth={3}
                      strokeLinejoin="round"
                      style={{ pointerEvents: 'none' }}
                      fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
                    >
                      {i.entry_subject}
                    </text>
                  )}
                </g>
              );
            });
          })()}

          {/* Concept-query projection marker, rendered AFTER the dots
              so it draws on top. Pin sits at the centroid of the
              nearest-match interview; visually says "your query lives
              right here in the embedding space". */}
          {conceptNearest && conceptQuery && (() => {
            const tgt = interviews.find((i) => i.entry_number === conceptNearest.entry_number);
            if (!tgt) return null;
            const cx = px(tgt.x);
            const cy = py(tgt.y);
            const wantTextOnLeft = cx > W - 200;
            const queryLabel = conceptQuery.length > 38 ? conceptQuery.slice(0, 36) + '…' : conceptQuery;
            return (
              <g aria-label={`Query "${conceptQuery}" nearest voice: ${conceptNearest.entry_subject}`}>
                {/* Larger green ring at the nearest centroid */}
                <circle cx={cx} cy={cy} r={18} fill="none" stroke="#059669" strokeWidth={2.5} strokeOpacity={0.65} />
                <circle cx={cx} cy={cy} r={12} fill="none" stroke="#059669" strokeWidth={2} strokeDasharray="4 3" />
                {/* Callout line + label */}
                <line x1={cx} y1={cy - 18} x2={cx} y2={cy - 38} stroke="#059669" strokeWidth={2} />
                <circle cx={cx} cy={cy - 42} r={6} fill="#059669" stroke="#fff" strokeWidth={2} />
                <text
                  x={wantTextOnLeft ? cx - 10 : cx + 10}
                  y={cy - 46}
                  fontSize={12}
                  fontWeight={600}
                  fill="#065f46"
                  textAnchor={wantTextOnLeft ? 'end' : 'start'}
                  paintOrder="stroke"
                  stroke="rgba(255,255,255,0.95)"
                  strokeWidth={3}
                  fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
                >
                  Query: &ldquo;{queryLabel}&rdquo;
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Top retrieved passages for the same query, same demo loop
          closure as Spectrum and Word Search: query → projection on
          the map (nearest centroid) → here are the voices that match. */}
      {conceptResults && conceptResults.length > 0 && conceptQuery && (
        <aside className="mt-4 p-4 rounded-md border border-emerald-200 bg-white">
          <p className="text-xs text-emerald-900 font-mono uppercase tracking-wide mb-2">
            Top {conceptResults.length} retrieved passages for &ldquo;{conceptQuery}&rdquo;
          </p>
          <p className="text-sm text-stone-600 mb-3">
            The pin on the map shows the nearest voice geometrically; this list shows the actual passages full semantic retrieval surfaces. One embedding, two ways to read it.
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

      {(selected || hover) && (() => {
        const focusEntry = selected || hover?.entry_number;
        const focus = interviews.find((i) => i.entry_number === focusEntry);
        if (!focus) return null;
        return (
          <aside className="mt-4 p-4 rounded-md border border-stone-200 bg-white text-sm">
            <header className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
              <div>
                <h3 className="text-lg font-medium text-stone-900">{focus.entry_subject}</h3>
                <p className="text-xs text-stone-500">
                  Entry #{focus.entry_number} · {focus.n_chunks} passages · audit tier {focus.uncertainty_tier}
                </p>
              </div>
              {focus.loc_item_url && (
                <a href={focus.loc_item_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-civil-red-body hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  LoC catalog
                </a>
              )}
            </header>
            {focus.primary_topic && (
              <p className="text-stone-700">
                Dominant region: <span className="font-medium">{focus.primary_topic}</span>
              </p>
            )}
            {/* When the user clicks (not just hovers), drill into the
                top passages this interview contributes to their
                primary topic. Only on click, hovering through 136
                dots shouldn't trigger 136 /retrieve calls. */}
            {selected === focusEntry && <InterviewMapDrillDown entry={focus} />}
          </aside>
        );
      })()}

      <InterviewMapFooter />
    </div>
  );
}

// Footer extracted so the JSX is symmetrical with the drill-down
// component below, easier to read than nesting them inline.
function InterviewMapFooter() {
  return (
    <footer className="text-xs text-stone-500 border-t border-stone-200 pt-3 mt-5 max-w-3xl">
      Substrate: <code className="font-mono">public/rag/atlas_projection.json</code> (UMAP
        from Nomic Atlas). The same projection that drives the InterviewMap; this view
        aggregates to interview-scale. Axis labels are computed live from the data, the
        topic that dominates each pole&apos;s top-15 interviewees.
    </footer>
  );
}

function InterviewMapDrillDown({ entry }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const query = entry.primary_topic;

  useEffect(() => {
    if (!query) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResults(null);
    retrieve(query, {
      topN: 5,
      filter: { entry_number: { $eq: entry.entry_number } },
    })
      .then(({ results: r }) => { if (!cancelled) setResults(r || []); })
      .catch((e) => { if (!cancelled) setError(e?.detail?.message || e?.message || 'Drill-down failed.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [entry.entry_number, query]);

  if (!query) {
    return (
      <p className="mt-3 text-xs text-stone-500">
        No dominant topic for this entry, drill-down requires a topic anchor.
      </p>
    );
  }

  return (
    <div className="mt-4 pt-3 border-t border-stone-200">
      <p className="text-xs text-civil-red-body font-mono uppercase tracking-wide mb-1">
        Retrieval drill-down
      </p>
      <p className="text-sm text-stone-700 mb-3">
        Top passages from this interview most aligned with{' '}
        <strong className="text-civil-red-body">{query.toLowerCase()}</strong> -
        the region that anchors them on this map.
      </p>
      {loading && (
        <p className="text-sm text-stone-500 inline-flex items-center gap-2" role="status">
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          Searching their passages…
        </p>
      )}
      {error && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded p-3">
          {error}
        </p>
      )}
      {results && results.length === 0 && !loading && !error && (
        <p className="text-sm text-stone-500">No passages found for this entry.</p>
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
