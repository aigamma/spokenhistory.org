/**
 * @fileoverview PassageMap — Plotly-backed scattergl render of the
 * 15,464-passage UMAP projection from Atlas, with x AND y range
 * sliders so a viewer can window into any rectangular region of the
 * embedding space.
 *
 * Why Plotly + not pure canvas:
 *   - Native x-axis range slider (Plotly's built-in `rangeslider`).
 *     Sliding the bottom strip live-windows the chart's x-range while
 *     keeping the full projection visible in the strip itself.
 *   - WebGL scatter (scattergl) handles 15K points with smooth
 *     pan/zoom/lasso/box-select.
 *   - Lasso select gives stakeholders a "circle these voices and
 *     show me who they are" affordance that's tedious to wire by hand.
 *
 * Why we keep the dependency small:
 *   - `plotly.js-cartesian-dist-min` (~750KB minified) covers
 *     scattergl + range sliders + axis controls without bundling 3D
 *     globes, sankey, ternary, etc.
 *   - Both Plotly and `react-plotly.js` are dynamically imported on
 *     mount, so the bundle splits cleanly and pages that don't open
 *     this tab don't pay the cost.
 *
 * Y-axis range slider is hand-rolled because Plotly's native
 * rangeslider config is x-axis only. We render a vertical HTML slider
 * on the right edge of the chart frame and update layout.yaxis.range
 * on change.
 *
 * Brand styling: Plotly's default theme is a neutral light gray.
 * We pass an explicit layout config that swaps in our cream
 * background (#EBEAE9), stone text (#1c1917), Chivo Mono / Inter
 * font stacks, and the warm topic palette already used by the
 * NomicProjection canvas version.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';

// Match NomicProjection's palette so users see consistent topic
// colors across both views.
const TOPIC_PALETTE = [
  '#B23E2F', '#A86A1E', '#7A6B2E', '#3F5D3B',
  '#2E5C70', '#3B4276', '#65467A', '#8C3F5C',
  '#3B6E59', '#665A3A', '#5C3F2D', '#4A5A6E',
];

const HIGHLIGHT_COLOR = '#F2483C';

export default function PassageMap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [Plot, setPlot] = useState(null);
  const [hover, setHover] = useState(null);
  const plotRef = useRef(null);

  // The current x/y window. Initialized once we have data; updated by
  // the x-rangeslider (Plotly relayout event) and the y range-slider
  // controls below.
  const [xRange, setXRange] = useState(null);
  const [yRange, setYRange] = useState(null);
  const [yMin, setYMin] = useState(null);
  const [yMax, setYMax] = useState(null);

  // Lazy-load Plotly + the React wrapper so the bundle splits cleanly
  // on this tab. createPlotlyComponent wraps the cartesian-only build
  // (skips 3D globes, sankey, etc) to keep the chunk under ~750KB.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      import('react-plotly.js/factory'),
      import('plotly.js-cartesian-dist-min'),
    ]).then(([factoryMod, plotlyMod]) => {
      if (cancelled) return;
      const factory = factoryMod.default || factoryMod;
      const Plotly = plotlyMod.default || plotlyMod;
      setPlot(() => factory(Plotly));
    }).catch((e) => {
      if (!cancelled) setError(`Plotly load failed: ${e?.message || 'unknown'}`);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/atlas_projection.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('atlas projection not yet generated'))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  // Compute initial axis bounds + topic palette + per-point arrays.
  const traceData = useMemo(() => {
    if (!data?.points?.length) return null;
    const xs = new Array(data.points.length);
    const ys = new Array(data.points.length);
    const colors = new Array(data.points.length);
    const custom = new Array(data.points.length);
    const colorByTopic = new Map();
    (data.topics || []).forEach((t, i) => {
      colorByTopic.set(t.label, TOPIC_PALETTE[i % TOPIC_PALETTE.length]);
    });
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    for (let i = 0; i < data.points.length; i += 1) {
      const p = data.points[i];
      xs[i] = p.x;
      ys[i] = p.y;
      colors[i] = colorByTopic.get(p.topic) || '#78716c';
      custom[i] = [
        p.entry_subject || `Entry #${p.entry_number || '?'}`,
        p.topic || '',
        p.text_preview || '',
        p.uncertainty_tier || '',
        p.loc_item_url || '',
        typeof p.entry_number === 'number' ? p.entry_number : null,
      ];
      if (p.x < xMin) xMin = p.x;
      if (p.x > xMax) xMax = p.x;
      if (p.y < yMin) yMin = p.y;
      if (p.y > yMax) yMax = p.y;
    }
    const xPad = (xMax - xMin) * 0.04;
    const yPad = (yMax - yMin) * 0.04;
    return {
      xs, ys, colors, custom,
      bounds: { xMin: xMin - xPad, xMax: xMax + xPad, yMin: yMin - yPad, yMax: yMax + yPad },
      colorByTopic,
    };
  }, [data]);

  // Initialize ranges + Y-slider bounds when data first loads.
  useEffect(() => {
    if (!traceData) return;
    setXRange([traceData.bounds.xMin, traceData.bounds.xMax]);
    setYRange([traceData.bounds.yMin, traceData.bounds.yMax]);
    setYMin(traceData.bounds.yMin);
    setYMax(traceData.bounds.yMax);
  }, [traceData]);

  // Plotly relayout fires when the user drags the x-rangeslider or
  // zoom-boxes the plot; we mirror it into our state so the y-slider
  // and reset button stay in sync.
  const handleRelayout = useCallback((event) => {
    if (event['xaxis.range[0]'] !== undefined) {
      setXRange([event['xaxis.range[0]'], event['xaxis.range[1]']]);
    } else if (event['xaxis.range']) {
      setXRange(event['xaxis.range']);
    }
    if (event['yaxis.range[0]'] !== undefined) {
      setYRange([event['yaxis.range[0]'], event['yaxis.range[1]']]);
    } else if (event['yaxis.range']) {
      setYRange(event['yaxis.range']);
    }
  }, []);

  const handleHover = useCallback((event) => {
    const pt = event?.points?.[0];
    if (!pt) return;
    const custom = pt.customdata;
    setHover({
      entry_subject: custom[0],
      topic: custom[1],
      text_preview: custom[2],
      uncertainty_tier: custom[3],
      loc_item_url: custom[4],
      entry_number: custom[5],
      clientX: pt.bbox?.x0 || 0,
      clientY: pt.bbox?.y0 || 0,
    });
  }, []);

  const handleUnhover = useCallback(() => setHover(null), []);

  const resetView = useCallback(() => {
    if (!traceData) return;
    setXRange([traceData.bounds.xMin, traceData.bounds.xMax]);
    setYRange([traceData.bounds.yMin, traceData.bounds.yMax]);
    setYMin(traceData.bounds.yMin);
    setYMax(traceData.bounds.yMax);
  }, [traceData]);

  if (error) {
    return (
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-6 text-sm text-stone-600">
        <p className="font-medium text-stone-900 mb-2">Atlas projection not yet downloaded.</p>
        <p className="text-stone-700">
          Once Atlas finishes projecting, run{' '}
          <code className="font-mono bg-stone-100 px-1 rounded">python rag/download_from_nomic.py</code>{' '}
          to populate <code className="font-mono bg-stone-100 px-1 rounded">public/rag/atlas_projection.json</code>.
        </p>
      </div>
    );
  }

  if (!data || !Plot || !traceData || !xRange || !yRange) {
    return (
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-6 text-sm text-stone-500" role="status">
        Loading projection… (one-time Plotly bundle load, ~750KB)
      </div>
    );
  }

  // Single scattergl trace. We use a single trace with marker.color
  // as an array because Plotly draws all marker.color values in one
  // GPU pass; splitting into one trace per topic would be N draw
  // calls and slower at 15K+ points.
  const plotData = [{
    type: 'scattergl',
    mode: 'markers',
    x: traceData.xs,
    y: traceData.ys,
    customdata: traceData.custom,
    marker: {
      color: traceData.colors,
      size: 5,
      opacity: 0.78,
      line: { width: 0 },
    },
    hovertemplate:
      '<b>%{customdata[0]}</b><br>' +
      '<span style="color:#a8a29e">topic:</span> %{customdata[1]}<br>' +
      '<span style="color:#a8a29e">audit tier:</span> %{customdata[3]}<br>' +
      '<extra></extra>',
    name: 'Passages',
  }];

  const layout = {
    autosize: true,
    height: 620,
    margin: { l: 56, r: 90, t: 16, b: 60 },
    paper_bgcolor: '#EBEAE9',
    plot_bgcolor: '#1c1917',
    font: {
      family: 'Inter, ui-sans-serif, system-ui, sans-serif',
      color: '#1c1917',
      size: 12,
    },
    showlegend: false,
    hovermode: 'closest',
    dragmode: 'pan',
    xaxis: {
      title: { text: 'UMAP-x  (no inherent unit; only relative distance matters)', font: { size: 11, color: '#57534e' } },
      range: xRange,
      autorange: false,
      showgrid: true,
      gridcolor: 'rgba(168,162,158,0.18)',
      zeroline: false,
      color: '#1c1917',
      ticks: 'outside',
      tickcolor: '#a8a29e',
      // Native x-axis range slider — the marquee feature here.
      rangeslider: {
        visible: true,
        thickness: 0.07,
        bgcolor: 'rgba(28,25,23,0.85)',
        bordercolor: '#a8a29e',
        borderwidth: 1,
        range: [traceData.bounds.xMin, traceData.bounds.xMax],
      },
    },
    yaxis: {
      title: { text: 'UMAP-y', font: { size: 11, color: '#57534e' } },
      range: yRange,
      autorange: false,
      showgrid: true,
      gridcolor: 'rgba(168,162,158,0.18)',
      zeroline: false,
      color: '#1c1917',
      ticks: 'outside',
      tickcolor: '#a8a29e',
    },
  };

  const config = {
    displaylogo: false,
    responsive: true,
    // scrollZoom intentionally disabled: an embedded plot that grabs
    // the mouse wheel hijacks page scroll for users trying to scroll
    // past the chart, which is a hostile UX. Users zoom via the
    // x-rangeslider, the y-range-slider on the right, the modebar's
    // box-zoom button, or by clicking and dragging.
    scrollZoom: false,
    modeBarButtonsToRemove: ['select2d', 'autoScale2d', 'toggleSpikelines'],
    toImageButtonOptions: {
      filename: 'civil-rights-passages-umap',
      format: 'png',
      scale: 2,
    },
  };

  return (
    <div className="rag-passage-map">
      <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
        <span className="text-stone-600">
          <span className="font-medium text-stone-900 tabular-nums">{data.points.length.toLocaleString()}</span>
          {' passages · '}
          <span className="font-medium text-stone-900 tabular-nums">{(data.topics || []).length}</span>
          {' topics'}
        </span>
        <button
          type="button"
          onClick={resetView}
          className="px-3 py-1.5 rounded-md border border-stone-300 bg-white hover:bg-stone-50 text-xs text-stone-700"
        >
          Reset view
        </button>
        <span className="text-xs text-stone-500 flex-1 min-w-[10rem]">
          Drag the bottom strip to window the x-axis; drag the right slider for y.
          Box-select via the chart toolbar to lasso a region.
        </span>
      </div>

      <div className="flex items-stretch gap-3">
        <div className="flex-1 rounded-lg border border-stone-200 overflow-hidden shadow-sm" style={{ background: '#EBEAE9' }}>
          <Plot
            ref={plotRef}
            data={plotData}
            layout={layout}
            config={config}
            useResizeHandler
            style={{ width: '100%', height: 620 }}
            onRelayout={handleRelayout}
            onHover={handleHover}
            onUnhover={handleUnhover}
          />
        </div>

        {/* Y-axis range slider (vertical). Plotly's native rangeslider
            is x-only; this is a hand-rolled vertical control that
            writes into layout.yaxis.range via setYRange. */}
        <YRangeSlider
          min={traceData.bounds.yMin}
          max={traceData.bounds.yMax}
          low={yMin}
          high={yMax}
          onChange={(low, high) => {
            setYMin(low);
            setYMax(high);
            setYRange([low, high]);
          }}
        />
      </div>

      <TopicLegend topics={data.topics || []} colorByTopic={traceData.colorByTopic} />

      <p className="mt-4 text-xs text-stone-500 max-w-3xl">
        Plotly is rendering this scatter (scattergl WebGL backend) with our brand palette
        and Civil Rights History audit-tier metadata layered into the hover. Atlas computed
        the UMAP projection; Plotly handles the live windowing on both axes; React owns
        the layout, controls, and styling. The light-cream chrome contains the dark plot
        area so the dots stay legible regardless of the surrounding page.
      </p>
    </div>
  );
}

function YRangeSlider({ min, max, low, high, onChange }) {
  // Two range inputs stacked, styled to look like a vertical track.
  // The low-end slider sets the lower bound; the high-end sets upper.
  // Numeric inputs guard against the user crossing them.
  const handleLow = (e) => {
    const v = Number(e.target.value);
    onChange(Math.min(v, high - (max - min) * 0.02), high);
  };
  const handleHigh = (e) => {
    const v = Number(e.target.value);
    onChange(low, Math.max(v, low + (max - min) * 0.02));
  };
  const step = (max - min) / 200;
  return (
    <div className="flex flex-col items-center justify-between w-12 py-3 rounded-md border border-stone-200 bg-white shadow-sm" style={{ height: 620 }}>
      <span className="text-[10px] text-stone-500 font-mono">y max</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={high}
        onChange={handleHigh}
        className="vertical-range"
        aria-label="Y-axis maximum"
        style={{
          writingMode: 'vertical-lr',
          WebkitAppearance: 'slider-vertical',
          appearance: 'slider-vertical',
          width: 24,
          height: 250,
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={low}
        onChange={handleLow}
        className="vertical-range"
        aria-label="Y-axis minimum"
        style={{
          writingMode: 'vertical-lr',
          WebkitAppearance: 'slider-vertical',
          appearance: 'slider-vertical',
          width: 24,
          height: 250,
        }}
      />
      <span className="text-[10px] text-stone-500 font-mono">y min</span>
    </div>
  );
}

function TopicLegend({ topics, colorByTopic }) {
  if (!topics?.length) return null;
  return (
    <details className="mt-4 group">
      <summary className="cursor-pointer text-sm text-stone-700 font-medium select-none">
        Topics ({topics.length}){' '}
        <span className="text-xs text-stone-500 font-normal group-open:hidden">— click to expand</span>
      </summary>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {topics.map((t) => (
          <span key={t.label} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: colorByTopic.get(t.label) || '#78716c' }}
              aria-hidden="true"
            />
            <span className="text-stone-700">{t.label}</span>
            <span className="text-stone-500 tabular-nums">({t.size})</span>
          </span>
        ))}
      </div>
    </details>
  );
}
