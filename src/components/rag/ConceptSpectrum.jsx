/**
 * @fileoverview ConceptSpectrum, the headline "philosophy of embedding"
 * surface: a 2D scatter that places every interview centroid at the
 * intersection of TWO named concept axes computed from Voyage embeddings.
 *
 * Each axis is defined by two pole descriptions; the axis_vector is the
 * normalized difference of their embeddings. Each interview centroid is
 * projected onto the axis (a dot product), giving a 1D position per axis.
 * Pick any axis for the horizontal (X) lens and any other for the
 * vertical (Y) lens, and the same voice lands at a coordinate that means
 * something in both dimensions at once.
 *
 * Defaults: X = Nonviolence as Theology vs Armed Self-Defense,
 *           Y = Individual Conscience vs Collective Discipline.
 * Both are switchable from the control panel beside the chart.
 *
 * The audience literally watches the embedding space take a position on
 * where each interviewee sits in a two-concept plane. Clicking a dot
 * drills into the passages from THAT interview most aligned with the
 * horizontal pole the voice leans toward, the RAG demonstration the page
 * promises.
 *
 * Loads /rag/summaries/concept_axes.json (static). Drill-down passages
 * come from /retrieve (Netlify Function, Pinecone + Voyage rerank).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Link2, Check, ArrowLeftRight, Search } from 'lucide-react';
import { TIER_COLORS } from './tiers';
import { retrieve } from '../../services/ragClient';
import { useIsDark } from '../../hooks/useTheme';
import CitationCard from './CitationCard';
import FiveAxisRadar from './FiveAxisRadar';

// Default lenses. X is the page's signature framing (nonviolence vs
// armed self-defense); Y is a second, orthogonal-feeling dimension
// (the conscience-vs-discipline tension) so the opening view already
// shows the embedding taking a position in two directions at once.
const DEFAULT_X = 'nonviolence-self-defense';
const DEFAULT_Y = 'individual-collective';

// Compact two-word labels for the axis toggle pills. The chart itself
// uses the full pole labels; the pills stay short so the control panel
// reads at a glance. Falls back to first-word-of-each-pole if a slug
// is ever added to the data without an entry here.
const SHORT_LABELS = {
  'nonviolence-self-defense': 'Nonviolence ↔ Self-Defense',
  'sacred-secular': 'Sacred ↔ Secular',
  'tactical-strategic': 'Tactical ↔ Strategic',
  'southern-northern': 'Northern ↔ Southern',
  'individual-collective': 'Individual ↔ Collective',
  'local-national': 'Local ↔ National',
  'grassroots-institutional': 'Grassroots ↔ Institutional',
};
function shortLabel(ax) {
  return (
    SHORT_LABELS[ax.slug] ||
    `${ax.pole_a.label.split(' ')[0]} ↔ ${ax.pole_b.label.split(' ')[0]}`
  );
}

export default function ConceptSpectrum() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  // URL params:
  //   ?spectrumX=<slug> chooses the horizontal axis,
  //   ?spectrumY=<slug> chooses the vertical axis,
  //   ?spectrumEntry=<N> auto-selects (and drills into) that interview.
  // ?spectrumAxis=<slug> is the legacy single-axis param; it resolves to
  // the X axis so older deep-links still land somewhere sensible.
  const [searchParams, setSearchParams] = useSearchParams();
  const [xSlug, setXSlug] = useState(DEFAULT_X);
  const [ySlug, setYSlug] = useState(DEFAULT_Y);
  const [hover, setHover] = useState(null);
  // selectedEntry = the locked dot the user clicked. Triggers an inline
  // /retrieve call against the corpus, scoped to that interviewee's
  // passages and queried with the horizontal pole they lean toward.
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [drillResults, setDrillResults] = useState(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState(null);
  // Name filter: typing here labels matching dots directly on the chart
  // so a viewer can find one voice in the 136-dot cloud without hovering.
  const [nameQuery, setNameQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/summaries/concept_axes.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  // entry_number -> { entry_subject, tier, loc_item_url, pos: { slug: {n, raw} } }.
  // `n` is the [-1, 1] normalized position used for plotting; `raw` is the
  // unstretched projection used to decide which pole a voice leans toward
  // (raw >= 0 means closer to pole_a, the geometrically correct test).
  const profilesById = useMemo(() => {
    if (!data?.axes) return null;
    const map = new Map();
    for (const axis of data.axes) {
      for (const pos of axis.positions) {
        let prof = map.get(pos.entry_number);
        if (!prof) {
          prof = {
            entry_number: pos.entry_number,
            entry_subject: pos.entry_subject,
            tier: pos.tier,
            loc_item_url: pos.loc_item_url,
            pos: {},
          };
          map.set(pos.entry_number, prof);
        }
        prof.pos[axis.slug] = { n: pos.position_normalized, raw: pos.position };
      }
    }
    return map;
  }, [data]);

  const axesBySlug = useMemo(() => {
    if (!data?.axes) return null;
    const map = new Map();
    for (const ax of data.axes) map.set(ax.slug, ax);
    return map;
  }, [data]);

  // Once data is in, make sure the two chosen slugs actually exist (guards
  // against a stale URL param or a renamed axis). Fall back to the first
  // two axes if a default is missing.
  useEffect(() => {
    if (!data?.axes?.length || !axesBySlug) return;
    if (!axesBySlug.has(xSlug)) setXSlug(data.axes[0].slug);
    if (!axesBySlug.has(ySlug)) {
      const fallback = data.axes.find((a) => a.slug !== xSlug) || data.axes[0];
      setYSlug(fallback.slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, axesBySlug]);

  // URL -> state: on data load (or browser nav) pick up the axis + entry
  // params and apply them.
  useEffect(() => {
    if (!data?.axes?.length || !axesBySlug || !profilesById) return;
    const wantX = searchParams.get('spectrumX') || searchParams.get('spectrumAxis');
    if (wantX && axesBySlug.has(wantX) && wantX !== xSlug) setXSlug(wantX);
    const wantY = searchParams.get('spectrumY');
    if (wantY && axesBySlug.has(wantY) && wantY !== ySlug) setYSlug(wantY);
    const wantEntry = searchParams.get('spectrumEntry');
    if (wantEntry) {
      const n = Number(wantEntry);
      if (Number.isFinite(n) && n !== selectedEntry && profilesById.has(n)) {
        setSelectedEntry(n);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, searchParams, axesBySlug, profilesById]);

  // state -> URL: mirror both axes + the selected entry so back/forward
  // and copy-link work. The legacy spectrumAxis param is dropped once we
  // own the URL so it can't shadow spectrumX on a later read.
  useEffect(() => {
    if (!data?.axes?.length) return;
    const next = new URLSearchParams(searchParams);
    let changed = false;
    if (xSlug && next.get('spectrumX') !== xSlug) { next.set('spectrumX', xSlug); changed = true; }
    if (ySlug && next.get('spectrumY') !== ySlug) { next.set('spectrumY', ySlug); changed = true; }
    if (next.has('spectrumAxis')) { next.delete('spectrumAxis'); changed = true; }
    if (selectedEntry != null) {
      if (next.get('spectrumEntry') !== String(selectedEntry)) {
        next.set('spectrumEntry', String(selectedEntry));
        changed = true;
      }
    } else if (next.has('spectrumEntry')) {
      next.delete('spectrumEntry');
      changed = true;
    }
    if (changed) setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xSlug, ySlug, selectedEntry, data]);

  const handleSelect = useCallback((entryNumber) => {
    setSelectedEntry((prev) => (prev === entryNumber ? null : entryNumber));
  }, []);

  // Axis pickers. Picking the axis already shown on the other dimension
  // swaps the two so the chart never collapses onto a single diagonal.
  const pickX = useCallback((slug) => {
    if (slug === xSlug) return;
    if (slug === ySlug) setYSlug(xSlug); // collision: send the old X to Y
    setXSlug(slug);
  }, [xSlug, ySlug]);
  const pickY = useCallback((slug) => {
    if (slug === ySlug) return;
    if (slug === xSlug) setXSlug(ySlug); // collision: send the old Y to X
    setYSlug(slug);
  }, [xSlug, ySlug]);
  const swapAxes = useCallback(() => {
    setXSlug(ySlug);
    setYSlug(xSlug);
  }, [xSlug, ySlug]);

  const xAxis = axesBySlug?.get(xSlug) || null;
  const yAxis = axesBySlug?.get(ySlug) || null;
  const selectedProfile = selectedEntry != null ? profilesById?.get(selectedEntry) : null;

  // The voice whose full multi-axis fingerprint renders below the chart:
  // the locked dot if there is one, otherwise the hovered dot. Mirrors the
  // Data Insights matrix (ConceptMatrix), where the radar previews on hover
  // and pins on lock. hover.p carries only the two active-axis coordinates,
  // so resolve the full per-axis profile by entry number.
  const hoverProfile = hover?.p?.entry_number != null
    ? (profilesById?.get(hover.p.entry_number) || null)
    : null;
  const focusProfile = selectedProfile ?? hoverProfile;
  // Normalized [-1, 1] position per axis slug, the shape FiveAxisRadar
  // wants. profilesById stores { n, raw } per slug; the radar plots n.
  const radarPositions = useMemo(() => {
    if (!focusProfile?.pos) return null;
    const m = {};
    for (const slug in focusProfile.pos) m[slug] = focusProfile.pos[slug].n;
    return m;
  }, [focusProfile]);

  // Run the drill-down whenever the selection or the horizontal axis
  // changes. The X pole the interviewee leans toward becomes the semantic
  // query; the entry filter constrains results to that interview only.
  // Switching the Y axis does NOT re-query (the drill-down is anchored to
  // the horizontal lens), so it is intentionally absent from the deps.
  useEffect(() => {
    if (selectedEntry == null || !selectedProfile || !xAxis) {
      setDrillResults(null);
      setDrillError(null);
      return undefined;
    }
    let cancelled = false;
    const xRaw = selectedProfile.pos[xSlug]?.raw ?? 0;
    const pole = xRaw >= 0 ? xAxis.pole_a : xAxis.pole_b;
    setDrillLoading(true);
    setDrillError(null);
    setDrillResults(null);
    retrieve(pole.anchor, {
      topN: 5,
      filter: { entry_number: { $eq: selectedEntry } },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntry, xSlug, data]);

  const matched = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    if (!q || !profilesById) return null;
    const set = new Set();
    for (const p of profilesById.values()) {
      if (p.entry_subject.toLowerCase().includes(q)) set.add(p.entry_number);
    }
    return set;
  }, [nameQuery, profilesById]);

  if (error) {
    return (
      <div className="text-sm text-stone-500 p-4">
        Spectrum not yet generated. Run <code className="font-mono">node --env-file=rag/.env.local rag/precompute_concept_axes.mjs</code> from the repo root.
      </div>
    );
  }

  if (!data || !profilesById || !axesBySlug || !xAxis || !yAxis) {
    return <div className="text-sm text-stone-500 p-4" role="status">Loading spectrum…</div>;
  }

  return (
    <div className="rag-concept-spectrum">
      {/* Chart on the left (capped so it stays compact and leaves room
          for the axis labels in its own margins), control panel on the
          right. On a phone the controls stack above the chart so the
          toggles are seen first. */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-5 lg:gap-6">
        <AxisControls
          axes={data.axes}
          xSlug={xSlug}
          ySlug={ySlug}
          onPickX={pickX}
          onPickY={pickY}
          onSwap={swapAxes}
          nameQuery={nameQuery}
          onNameQuery={setNameQuery}
          matchCount={matched ? matched.size : null}
        />

        <div className="w-full max-w-[640px] lg:order-1 lg:flex-1 min-w-0">
          <Scatter2D
            xAxis={xAxis}
            yAxis={yAxis}
            profilesById={profilesById}
            hover={hover}
            setHover={setHover}
            selectedEntry={selectedEntry}
            onSelect={handleSelect}
            matched={matched}
          />
        </div>
      </div>

      <SpectrumTooltip
        hover={hover}
        selectedEntry={selectedEntry}
        xShort={shortLabel(xAxis)}
        yShort={shortLabel(yAxis)}
      />

      {/* The hovered-or-locked voice's full multi-axis fingerprint. The
          two-axis scatter shows where a voice sits on the two chosen
          lenses; this radar shows where the same voice sits on EVERY
          concept axis at once, so the drill-down is read against the
          whole shape, not just the two active dimensions. */}
      {focusProfile && radarPositions && (
        <SpectrumRadar
          profile={focusProfile}
          axes={data.axes}
          positions={radarPositions}
          locked={selectedEntry != null}
        />
      )}

      {selectedProfile && (
        <DrillDown
          profile={selectedProfile}
          xAxis={xAxis}
          yAxis={yAxis}
          xSlug={xSlug}
          ySlug={ySlug}
          results={drillResults}
          loading={drillLoading}
          error={drillError}
          onClose={() => setSelectedEntry(null)}
        />
      )}

      <p className="text-sm text-stone-600 mt-6 mb-6 max-w-2xl">
        Each dot is one interviewee, placed by projecting their interview&apos;s
        embedding centroid onto two named concept axes at once. Pick any concept
        for the horizontal and vertical lens in the panel{' '}
        <span className="lg:hidden">above</span><span className="hidden lg:inline">beside the chart</span>.
        The placement is reproducible math, identical for every visitor, with no
        model call per dot. Click a dot to pull the passages from that interview
        that anchor it where it sits.
      </p>

      {/* Extremes on each axis: a readable, keyboard-navigable index into
          the scatter. Clicking a name drills in exactly as clicking the
          dot does. */}
      <Extremes
        xAxis={xAxis}
        yAxis={yAxis}
        selectedEntry={selectedEntry}
        onSelect={handleSelect}
      />

      {/* Pole definitions for the two active axes, collapsed by default.
          The anchor sentences are the exact text embedded to build each
          axis vector, kept available for institutional provenance. */}
      <AxisDefinitions xAxis={xAxis} yAxis={yAxis} />

      {/* Dot color legend, explains the audit-tier palette so users
          understand what color each dot encodes. Reuses the pattern
          from Constellation.jsx. */}
      <div className="flex flex-wrap gap-3 mt-6 mb-6 text-xs text-stone-700" aria-label="Audit-tier color legend">
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
          Pure-math projection of pre-computed Voyage embeddings. No LLM call per query. Each axis vector is <code className="font-mono">normalize(embedding(pole_A) - embedding(pole_B))</code>; a voice&apos;s coordinate on that axis is the dot product of its centroid with the vector, then linearly stretched to [-1, 1]. The horizontal and vertical axes are two such projections of the same 1024-dim embedding. Source: <code className="font-mono">rag/precompute_concept_axes.mjs</code>.
        </p>
      </footer>
    </div>
  );
}

/**
 * AxisControls, the toggle panel. Two radiogroups (horizontal + vertical)
 * each list every concept axis; the active one is highlighted and carries
 * an X or Y badge. The axis currently shown on the OTHER dimension is
 * dimmed and tagged so the user understands why picking it swaps. A swap
 * button flips the two lenses, and a name filter labels matching dots on
 * the chart.
 */
function AxisControls({ axes, xSlug, ySlug, onPickX, onPickY, onSwap, nameQuery, onNameQuery, matchCount }) {
  return (
    <aside className="w-full lg:w-64 lg:flex-shrink-0 lg:order-2">
      <div className="rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
        <AxisPickerGroup
          legend="Horizontal Axis (X)"
          letter="X"
          axes={axes}
          currentSlug={xSlug}
          otherSlug={ySlug}
          otherLetter="Y"
          onPick={onPickX}
        />

        <div className="my-3 flex justify-center">
          <button
            type="button"
            onClick={onSwap}
            className="inline-flex items-center gap-1.5 min-h-9 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-zinc-200 border border-stone-300 dark:border-zinc-600 rounded-full hover:border-civil-red-strong hover:text-civil-red-strong hover:bg-red-50 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Swap the horizontal and vertical axes"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
            Swap X and Y
          </button>
        </div>

        <AxisPickerGroup
          legend="Vertical Axis (Y)"
          letter="Y"
          axes={axes}
          currentSlug={ySlug}
          otherSlug={xSlug}
          otherLetter="X"
          onPick={onPickY}
        />

        <div className="mt-4 pt-4 border-t border-stone-200 dark:border-zinc-700">
          <label className="block text-xs uppercase tracking-wide font-mono text-stone-500 dark:text-zinc-400 mb-1.5">
            Find a Voice
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
            <input
              type="text"
              value={nameQuery}
              onChange={(e) => onNameQuery(e.target.value)}
              placeholder="Label a name on the chart…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-stone-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 dark:placeholder-zinc-500 focus:border-civil-red-strong focus:outline-none focus:ring-2 focus:ring-red-200 dark:focus:ring-red-400/30"
              aria-label="Filter interviewees by name to label them on the chart"
            />
          </div>
          {nameQuery.trim() && (
            <p className="text-xs text-stone-500 mt-1.5" role="status">
              {matchCount === 0
                ? 'No voice matches that name.'
                : `${matchCount} voice${matchCount === 1 ? '' : 's'} labeled on the chart.`}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

function AxisPickerGroup({ legend, letter, axes, currentSlug, otherSlug, otherLetter, onPick }) {
  return (
    <div role="group" aria-label={legend}>
      <p className="text-xs uppercase tracking-wide font-mono text-stone-500 dark:text-zinc-400 mb-2">
        {legend}
      </p>
      <div className="flex flex-col gap-1.5">
        {axes.map((ax) => {
          const isCurrent = ax.slug === currentSlug;
          const isOther = ax.slug === otherSlug;
          return (
            <button
              key={ax.slug}
              type="button"
              onClick={() => onPick(ax.slug)}
              aria-pressed={isCurrent}
              className={
                'inline-flex items-center justify-between gap-2 min-h-9 px-3 py-1.5 text-sm rounded-md border text-left transition-colors ' +
                (isCurrent
                  ? 'border-civil-red-strong bg-red-50 dark:bg-red-950/40 text-stone-900 dark:text-zinc-50 font-medium'
                  : isOther
                    ? 'border-stone-300 dark:border-zinc-700 bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400'
                    : 'border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-stone-700 dark:text-zinc-200 hover:border-stone-400 hover:bg-stone-50 dark:hover:bg-zinc-800')
              }
              style={{ fontFamily: 'Chivo Mono, monospace' }}
            >
              <span className="truncate">{shortLabel(ax)}</span>
              {isCurrent && (
                <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded text-[0.7rem] font-bold bg-civil-red-strong text-white" aria-hidden="true">
                  {letter}
                </span>
              )}
              {isOther && (
                <span className="flex-shrink-0 text-[0.65rem] font-mono text-stone-400 dark:text-zinc-500" aria-hidden="true">
                  on {otherLetter}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * SpectrumRadar, the below-chart panel that renders the focused voice's
 * full multi-axis fingerprint (the shared FiveAxisRadar) under a compact
 * header. "Focused" is the locked dot, or the hovered dot when nothing is
 * locked, so the radar previews on hover and pins on click, the same
 * interaction the Data Insights matrix (ConceptMatrix) uses. The two-axis
 * scatter answers "where on these two lenses"; this answers "where on all
 * of them," so the position never reads as just two numbers.
 */
function SpectrumRadar({ profile, axes, positions, locked }) {
  return (
    <aside className="mt-5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
      <header className="text-center mb-1">
        <h3 className="text-base font-medium text-stone-900 dark:text-zinc-50" style={{ fontFamily: 'Inter, sans-serif' }}>
          {profile.entry_subject}
        </h3>
        <p className="text-xs text-stone-500 dark:text-zinc-400" style={{ fontFamily: 'Chivo Mono, monospace' }}>
          Entry #{profile.entry_number}
          {profile.tier ? ` · audit tier ${profile.tier}` : ''}
          {locked ? ' · locked, passages below' : ' · hovering, click a dot to lock'}
        </p>
      </header>
      <FiveAxisRadar axes={axes} positions={positions} subject={profile.entry_subject} />
    </aside>
  );
}

function SpectrumTooltip({ hover, selectedEntry, xShort, yShort }) {
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
          className="text-xs text-stone-300 mt-1 space-y-0.5"
          style={{ fontFamily: 'Chivo Mono, monospace' }}
        >
          <div>{p.tier || 'unknown'}</div>
          <div>{xShort}: <span className="tabular-nums">{p.xRaw.toFixed(3)}</span></div>
          <div>{yShort}: <span className="tabular-nums">{p.yRaw.toFixed(3)}</span></div>
        </div>
        <div className="text-xs text-amber-300 mt-1.5 font-medium" style={{ fontFamily: 'Chivo Mono, monospace' }}>
          click → see passages
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DrillDown({ profile, xAxis, yAxis, xSlug, ySlug, results, loading, error, onClose }) {
  const xRaw = profile.pos[xSlug]?.raw ?? 0;
  const yRaw = profile.pos[ySlug]?.raw ?? 0;
  // The horizontal pole the voice leans toward is the query we ran.
  // raw >= 0 means closer to pole_a per the projection math.
  const pole = xRaw >= 0 ? xAxis.pole_a : xAxis.pole_b;
  const side = xRaw >= 0 ? 'left' : 'right';
  return (
    <aside className="mt-5 rounded-lg border-2 border-red-700 bg-white dark:bg-zinc-900 p-5 shadow-sm">
      <header className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-civil-red-body font-mono uppercase tracking-wide mb-1">
            Retrieval drill-down
          </p>
          <h4 className="text-lg sm:text-xl font-medium text-stone-900 dark:text-zinc-50 leading-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
            Why is {profile.entry_subject} here?
          </h4>
          <p className="text-sm text-stone-600 dark:text-zinc-300 mt-1">
            On the horizontal axis ({xAxis.title}) this voice sits at{' '}
            <span className="tabular-nums font-medium">{xRaw.toFixed(2)}</span>; on the vertical
            axis ({yAxis.title}) at <span className="tabular-nums font-medium">{yRaw.toFixed(2)}</span>.
            Below: the passages from this interview most aligned with{' '}
            <strong className="text-civil-red-body">{pole.label.toLowerCase()}</strong>{' '}
            (the {side}-side pole of the horizontal axis).
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <CopyLinkButton />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center min-h-9 px-3 py-1.5 text-xs text-stone-700 dark:text-zinc-200 hover:text-stone-900 hover:bg-stone-50 dark:hover:bg-zinc-800 border border-stone-300 dark:border-zinc-600 rounded hover:border-stone-500 transition-colors"
            aria-label="Close drill-down"
          >
            close ✕
          </button>
        </div>
      </header>

      {loading && (
        <p className="text-sm text-stone-500 inline-flex items-center gap-2" role="status">
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          Searching {profile.entry_subject}&apos;s passages…
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

/**
 * Scatter2D, the 2D plot. Every interviewee is placed at
 * (projectX(xPosition), projectY(yPosition)). Pole labels live entirely
 * in the chart's outer margins, never over the dot field: the horizontal
 * poles sit at the bottom corners, the vertical poles top-center and
 * bottom-center, each with a direction arrow. A faint crosshair marks the
 * neutral origin and divides the plane into four quadrants.
 */
function Scatter2D({ xAxis, yAxis, profilesById, hover, setHover, selectedEntry, onSelect, matched }) {
  const isDark = useIsDark();
  const W = 620;
  const H = 560;
  // Generous margins reserve room for the axis labels so they never
  // collide with the dots. Left is widest to seat the bottom-left
  // horizontal pole label; bottom carries the horizontal poles plus the
  // lower vertical pole.
  const PAD_L = 52;
  const PAD_R = 28;
  const PAD_T = 46;
  const PAD_B = 60;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const centerX = PAD_L + innerW / 2;
  const centerY = PAD_T + innerH / 2;

  // High normalized position (+1) = closer to pole_a per the projection
  // math (axisVec = normalize(eA - eB)). pole_a labels render on the LEFT
  // (X) and TOP (Y), so map +1 -> left and +1 -> top to match.
  const projectX = (x) => PAD_L + ((1 - x) / 2) * innerW;
  const projectY = (y) => PAD_T + ((1 - y) / 2) * innerH;

  // Axis-line text colors (theme-aware).
  const labelFill = isDark ? '#e7e5e4' : '#292524';
  const lineStroke = isDark ? '#3f3f46' : '#d6d3d1';
  const frameStroke = isDark ? '#27272a' : '#f0efee';

  const points = useMemo(() => {
    if (!profilesById || !xAxis || !yAxis) return [];
    const out = [];
    for (const prof of profilesById.values()) {
      const xp = prof.pos[xAxis.slug];
      const yp = prof.pos[yAxis.slug];
      if (!xp || !yp) continue;
      // A whisper of deterministic jitter (a few px) so exact-overlap
      // dots stay individually clickable. Tiny relative to the plot, so
      // it does not misrepresent position.
      const seed = (prof.entry_number * 2654435761) >>> 0;
      const jx = ((seed % 1000) / 1000 - 0.5) * 5;
      const jy = (((seed >> 10) % 1000) / 1000 - 0.5) * 5;
      out.push({
        entry_number: prof.entry_number,
        entry_subject: prof.entry_subject,
        tier: prof.tier,
        xRaw: xp.raw,
        yRaw: yp.raw,
        cx: projectX(xp.n) + jx,
        cy: projectY(yp.n) + jy,
        color: TIER_COLORS[prof.tier] || '#b91c1c',
      });
    }
    return out;
    // projectX/projectY derive from constants that never change; omitting
    // them keeps the exhaustive-deps lint quiet without staleness risk.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilesById, xAxis, yAxis]);

  // Render order: unfocused first, then matched/hovered/selected on top so
  // the dot the user cares about is never buried under the cloud.
  const ordered = useMemo(() => {
    const rank = (p) => {
      if (p.entry_number === selectedEntry) return 3;
      if (hover?.p?.entry_number === p.entry_number) return 2;
      if (matched && matched.has(p.entry_number)) return 1;
      return 0;
    };
    return [...points].sort((a, b) => rank(a) - rank(b));
  }, [points, selectedEntry, hover, matched]);

  const handleEnter = (p, e) => setHover({ p, x: e.clientX, y: e.clientY });
  const handleMove = (p, e) => setHover({ p, x: e.clientX, y: e.clientY });
  const handleFocus = (p, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHover({ p, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };
  const clearHover = () => setHover(null);

  // The tooltip is a fixed-position portal. If the pointer ever leaves a
  // dot without the per-dot onMouseLeave firing (fast exit off the chart
  // edge, a re-sort moving the node, a wheel scroll), it would otherwise
  // hang on screen and appear to follow the page. Clear it on any scroll
  // or window blur, in addition to the container's onMouseLeave below.
  useEffect(() => {
    const clear = () => setHover(null);
    window.addEventListener('scroll', clear, { passive: true, capture: true });
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('scroll', clear, { capture: true });
      window.removeEventListener('blur', clear);
    };
  }, [setHover]);

  return (
    <div
      className="rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2"
      onMouseLeave={clearHover}
    >
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Two-axis concept scatter. Horizontal axis: ${xAxis.title}. Vertical axis: ${yAxis.title}. 136 interviewees plotted; click a dot to drill into that interview's passages.`}
        style={{ display: 'block', width: '100%', height: 'auto' }}
        onMouseLeave={clearHover}
      >
        {/* Plot-area frame separates the dot field from the label margins. */}
        <rect x={PAD_L} y={PAD_T} width={innerW} height={innerH} fill="none" stroke={frameStroke} strokeWidth={1} />

        {/* Neutral crosshair through the origin (0, 0). */}
        <line x1={PAD_L} y1={centerY} x2={W - PAD_R} y2={centerY} stroke={lineStroke} strokeWidth={1.25} />
        <line x1={centerX} y1={PAD_T} x2={centerX} y2={H - PAD_B} stroke={lineStroke} strokeWidth={1.25} />

        {/* Vertical-axis pole labels: pole_a above (top-center), pole_b
            below (bottom-center). Centered over the vertical crosshair, in
            the top and bottom margins, clear of every dot. */}
        <text x={centerX} y={PAD_T - 18} fontSize="14" fill={labelFill} fontWeight="600" textAnchor="middle" fontFamily="Inter, sans-serif">
          ↑ {yAxis.pole_a.label}
        </text>
        <text x={centerX} y={H - PAD_B + 38} fontSize="14" fill={labelFill} fontWeight="600" textAnchor="middle" fontFamily="Inter, sans-serif">
          ↓ {yAxis.pole_b.label}
        </text>

        {/* Horizontal-axis pole labels: pole_a bottom-left, pole_b
            bottom-right, in the bottom margin and anchored to the plot
            edges so they flank the lower vertical-pole label without
            overlapping it. */}
        <text x={PAD_L} y={H - PAD_B + 20} fontSize="14" fill={labelFill} fontWeight="600" textAnchor="start" fontFamily="Inter, sans-serif">
          ← {xAxis.pole_a.label}
        </text>
        <text x={W - PAD_R} y={H - PAD_B + 20} fontSize="14" fill={labelFill} fontWeight="600" textAnchor="end" fontFamily="Inter, sans-serif">
          {xAxis.pole_b.label} →
        </text>

        {/* Dots. */}
        {ordered.map((p) => {
          const isHover = hover?.p?.entry_number === p.entry_number;
          const isSelected = selectedEntry === p.entry_number;
          const isMatch = !matched || matched.has(p.entry_number);
          const dimByFilter = matched && !isMatch;
          const showLabel = isSelected || (matched && isMatch);
          return (
            <g key={p.entry_number}>
              <circle
                cx={p.cx}
                cy={p.cy}
                r={isSelected ? 9 : isHover ? 7 : (matched && isMatch ? 6 : 4.5)}
                fill={isSelected ? '#F2483C' : p.color}
                fillOpacity={
                  isSelected || isHover
                    ? 1
                    : dimByFilter
                      ? 0.14
                      : 0.8
                }
                stroke={isSelected || isHover ? (isDark ? '#fafaf9' : '#18181b') : 'transparent'}
                strokeWidth={isSelected ? 2 : 1.5}
                onMouseEnter={(e) => handleEnter(p, e)}
                onMouseMove={(e) => handleMove(p, e)}
                onMouseLeave={clearHover}
                onFocus={(e) => handleFocus(p, e)}
                onBlur={clearHover}
                onClick={() => onSelect(p.entry_number)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(p.entry_number);
                  }
                }}
                tabIndex={0}
                style={{ cursor: 'pointer' }}
                aria-label={`${p.entry_subject}, ${xAxis.pole_a.label.split(' ')[0]} axis ${p.xRaw.toFixed(3)}, ${yAxis.pole_a.label.split(' ')[0]} axis ${p.yRaw.toFixed(3)}. Click to drill into passages.`}
              />
              {/* Label the selected dot, and any dot matched by the name
                  filter, so it can be located without hovering. Sits below
                  the dot, non-interactive, with a halo for contrast. */}
              {showLabel && (
                <text
                  x={p.cx}
                  y={p.cy + (isSelected ? 22 : 18)}
                  fontSize={isSelected ? 12 : 11}
                  fontWeight={600}
                  fill={isSelected ? '#B23E2F' : (isDark ? '#f5f5f4' : '#18181b')}
                  textAnchor="middle"
                  paintOrder="stroke"
                  stroke={isDark ? 'rgba(12,10,9,0.9)' : 'rgba(255,255,255,0.95)'}
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
  );
}

/**
 * Extremes, the "Most {pole}" leaderboards for both active axes. A
 * readable, keyboard-navigable index into the scatter; each name drills
 * into the same retrieval as clicking the dot.
 */
function Extremes({ xAxis, yAxis, selectedEntry, onSelect }) {
  return (
    <section className="mt-2 mb-2">
      <h4 className="text-sm font-medium text-stone-900 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
        Extremes On Each Axis
      </h4>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
        <AxisExtremes axis={xAxis} letter="X" selectedEntry={selectedEntry} onSelect={onSelect} />
        <AxisExtremes axis={yAxis} letter="Y" selectedEntry={selectedEntry} onSelect={onSelect} />
      </div>
    </section>
  );
}

function AxisExtremes({ axis, letter, selectedEntry, onSelect }) {
  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-wide text-stone-500 mb-2">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-stone-200 text-stone-700 text-[0.6rem] font-bold mr-1.5">{letter}</span>
        {axis.title}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <PoleLeaders axis={axis} pole="a" selectedEntry={selectedEntry} onSelect={onSelect} />
        <PoleLeaders axis={axis} pole="b" selectedEntry={selectedEntry} onSelect={onSelect} />
      </div>
    </div>
  );
}

function PoleLeaders({ axis, pole, selectedEntry, onSelect }) {
  // axis.positions is sorted by raw projection descending, so the head is
  // most-pole_a and the tail (reversed) is most-pole_b.
  const list = pole === 'a' ? axis.positions.slice(0, 5) : axis.positions.slice(-5).reverse();
  const poleObj = pole === 'a' ? axis.pole_a : axis.pole_b;
  return (
    <div>
      <p className="font-medium text-stone-900 mb-1">Most {poleObj.label.toLowerCase()}:</p>
      <ol className="list-decimal list-inside text-stone-700 space-y-0.5">
        {list.map((p) => (
          <LeaderboardEntry
            key={p.entry_number}
            p={p}
            onSelect={onSelect}
            isSelected={selectedEntry === p.entry_number}
          />
        ))}
      </ol>
    </div>
  );
}

/**
 * LeaderboardEntry, a clickable name in a "Most {pole}" list. Clicking
 * triggers the same drill-down as clicking the dot itself, so users can
 * drill from the easier-to-read leaderboard without hunting the scatter.
 */
function LeaderboardEntry({ p, onSelect, isSelected }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(p.entry_number)}
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
 * AxisDefinitions, the exact pole anchor sentences for the two active
 * axes. Collapsed by default to keep the chart the headline, but kept on
 * the page so a reviewer can see precisely what text was embedded to
 * define each axis vector.
 */
function AxisDefinitions({ xAxis, yAxis }) {
  return (
    <details className="mt-6 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50/60 dark:bg-zinc-900">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-stone-800 dark:text-zinc-100">
        How these two axes are defined
      </summary>
      <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
        {[{ axis: xAxis, letter: 'X' }, { axis: yAxis, letter: 'Y' }].map(({ axis, letter }) => (
          <div key={letter}>
            <p className="text-xs font-mono uppercase tracking-wide text-stone-500 mb-2">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-stone-200 text-stone-700 text-[0.6rem] font-bold mr-1.5">{letter}</span>
              {axis.title}
            </p>
            <p className="text-stone-700 dark:text-zinc-300 mb-2">
              <strong className="text-stone-900 dark:text-zinc-100">{axis.pole_a.label}:</strong>{' '}
              <span className="italic">{axis.pole_a.anchor}</span>
            </p>
            <p className="text-stone-700 dark:text-zinc-300">
              <strong className="text-stone-900 dark:text-zinc-100">{axis.pole_b.label}:</strong>{' '}
              <span className="italic">{axis.pole_b.anchor}</span>
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}

/**
 * CopyLinkButton, copies the current page URL (which includes spectrumX,
 * spectrumY, and spectrumEntry query params) to the clipboard. Lets a
 * researcher share a deep-link to their exact drill-down.
 *
 * Reads the URL fresh on click rather than caching at render time, so the
 * most-current URL always lands in the clipboard.
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
      className="inline-flex items-center gap-1 min-h-9 px-3 py-1.5 text-xs text-stone-700 dark:text-zinc-200 hover:text-stone-900 hover:bg-stone-50 dark:hover:bg-zinc-800 border border-stone-300 dark:border-zinc-600 rounded hover:border-stone-500 transition-colors"
      aria-label={copied ? 'Link copied to clipboard' : 'Copy permalink to this drill-down'}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
}
