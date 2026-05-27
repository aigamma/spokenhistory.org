/**
 * @fileoverview EventsTimeline — Plotly-backed chronological timeline
 * of the eight polyphonic-events panels (Emmett Till 1955 → MLK
 * assassination 1968). Replaces the row of event-selector pills with
 * a date-axis scatter where clicking a dot selects the event for
 * the detail view below.
 *
 * Why a date-axis: the eight events form an arc — the early
 * personal-narrative pivots (Emmett Till), the sit-in wave
 * (Greensboro), the federal march (Washington), the violence
 * (16th Street, Bloody Sunday), the legislative wins (Voting
 * Rights Act), and the assassination that bookends. Linear time
 * is the right reading. Plotly's date axis + native x-axis
 * rangeslider lets viewers window into specific years.
 *
 * y-axis is fixed at 1 (single horizontal line). Voice counts are
 * almost flat (8 out of 8 events have 8 voices; only Emmett Till
 * has 5), so encoding voice_count on y would just add noise. The
 * voice count is shown in the hover instead.
 *
 * 8 events sparse enough that direct text labels read clean —
 * no hover-treasure-hunt required.
 */

import { useEffect, useMemo, useState } from 'react';

// Parse the leading date out of a date_range string. Handles
// "March 7, 1965" and "June – August 1964" and "April 4, 1968".
// Returns an ISO date string for Plotly.
function parseEventDate(dateRange) {
  if (!dateRange) return null;
  const monthMap = {
    january: '01', february: '02', march: '03', april: '04',
    may: '05', june: '06', july: '07', august: '08',
    september: '09', october: '10', november: '11', december: '12',
  };
  // Case 1: "Month D, YYYY"
  let m = dateRange.match(/^([A-Z][a-z]+)\s+(\d+),\s+(\d{4})/);
  if (m) {
    const mm = monthMap[m[1].toLowerCase()];
    if (mm) return `${m[3]}-${mm}-${String(m[2]).padStart(2, '0')}`;
  }
  // Case 2: "Month – Month YYYY" or "Month - Month YYYY"
  m = dateRange.match(/^([A-Z][a-z]+)\s*[–-]\s*[A-Z][a-z]+\s+(\d{4})/);
  if (m) {
    const mm = monthMap[m[1].toLowerCase()];
    if (mm) return `${m[2]}-${mm}-15`; // middle of the start month
  }
  // Case 3: "Month YYYY"
  m = dateRange.match(/^([A-Z][a-z]+)\s+(\d{4})/);
  if (m) {
    const mm = monthMap[m[1].toLowerCase()];
    if (mm) return `${m[2]}-${mm}-15`;
  }
  return null;
}

export default function EventsTimeline({ events, selectedSlug, onSelect }) {
  const [Plot, setPlot] = useState(null);
  const [error, setError] = useState(null);

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

  const timeline = useMemo(() => {
    if (!events?.length) return null;
    const sorted = events
      .map((ev) => ({ ...ev, _date: parseEventDate(ev.date_range) }))
      .filter((ev) => ev._date)
      .sort((a, b) => a._date.localeCompare(b._date));
    return sorted;
  }, [events]);

  if (error) {
    return (
      <div className="rounded-md border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
        Timeline view failed to load: {error}. The events list above still works.
      </div>
    );
  }

  if (!Plot || !timeline) {
    return (
      <div className="rounded-md border border-stone-200 bg-stone-50 p-4 text-xs text-stone-500" role="status">
        Loading timeline (~750KB Plotly bundle)…
      </div>
    );
  }

  const dates = timeline.map((ev) => ev._date);
  const ys = timeline.map(() => 1);
  const customdata = timeline.map((ev) => [
    ev.title,
    ev.date_range,
    ev.voice_count,
    ev.blurb,
    ev.slug,
  ]);

  // Marker color: brand red for the selected event; warm stone for others.
  const colors = timeline.map((ev) =>
    ev.slug === selectedSlug ? '#F2483C' : '#78716c'
  );
  const sizes = timeline.map((ev) =>
    ev.slug === selectedSlug ? 22 : 16
  );

  const data = [{
    type: 'scatter',
    mode: 'markers',
    x: dates,
    y: ys,
    customdata,
    marker: {
      color: colors,
      size: sizes,
      line: { width: 1.5, color: '#1c1917' },
    },
    hovertemplate:
      '<b>%{customdata[0]}</b><br>' +
      '<span style="color:#a8a29e">%{customdata[1]}</span><br>' +
      '%{customdata[2]} voices in the corpus<br>' +
      '<extra></extra>',
    name: 'Events',
  }];

  // Year-anchored axis ticks so the user has temporal grounding even
  // without per-event labels. Plotly auto-ticks dates but they can be
  // sparse on a 13-year span; we set explicit dtick to every year.

  // Date range with a 6-month pad on each side so the first/last
  // event isn't crammed against the axis edge.
  const minDate = '1955-02-01';
  const maxDate = '1968-10-01';

  const layout = {
    autosize: true,
    // Shorter than the original 280px because the inline event labels
    // were removed (they collided badly in the 1963-65 cluster). The
    // detail panel below the chart shows the selected event's title;
    // hover the dot for a tooltip.
    height: 180,
    margin: { l: 12, r: 12, t: 16, b: 50 },
    paper_bgcolor: '#fafaf9',
    plot_bgcolor: '#ffffff',
    font: {
      family: 'Inter, ui-sans-serif, system-ui, sans-serif',
      color: '#1c1917',
      size: 11,
    },
    showlegend: false,
    hovermode: 'closest',
    dragmode: 'pan',
    xaxis: {
      type: 'date',
      range: [minDate, maxDate],
      autorange: false,
      showgrid: true,
      gridcolor: 'rgba(168,162,158,0.18)',
      tickfont: { color: '#57534e', size: 11 },
      ticks: 'outside',
      tickcolor: '#a8a29e',
      dtick: 'M12',
      tickformat: '%Y',
      // Native x-axis rangeslider — drag to window into specific years.
      rangeslider: {
        visible: true,
        thickness: 0.13,
        bgcolor: '#f5f5f4',
        bordercolor: '#d6d3d1',
        borderwidth: 1,
        range: [minDate, maxDate],
      },
    },
    yaxis: {
      visible: false,
      range: [0, 2],
      fixedrange: true,
    },
  };

  const config = {
    displaylogo: false,
    responsive: true,
    scrollZoom: false, // per [[feedback_embeds_must_not_hijack_scroll]]
    displayModeBar: false, // tight chrome — no toolbar
    staticPlot: false,
  };

  return (
    <div className="rag-events-timeline">
      <Plot
        data={data}
        layout={layout}
        config={config}
        useResizeHandler
        style={{ width: '100%', height: 180 }}
        onClick={(event) => {
          const pt = event?.points?.[0];
          if (pt?.customdata?.[4]) onSelect?.(pt.customdata[4]);
        }}
      />
      <p className="text-xs text-stone-500 mt-1 text-center">
        Drag the bottom strip to window into specific years · click a dot to load that event&apos;s passages below
      </p>
    </div>
  );
}
