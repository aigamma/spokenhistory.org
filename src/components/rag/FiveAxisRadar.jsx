/**
 * @fileoverview FiveAxisRadar, a small SVG radar polygon showing one
 * voice's per-axis "fingerprint", one spoke per concept axis. Each spoke
 * runs from the center (pole_a end, position +1) outward to the rim
 * (pole_b end, position -1); the voice's polygon vertex on each spoke is
 * plotted at its [-1, +1] position mapped to a [0, 1] radial fraction.
 *
 * Shared by ConceptMatrix (the four-lens "Data Insights" grid) and
 * ConceptSpectrum (the top-level two-axis spectrum). Both feed it the same
 * shape: an `axes` array (each with `.slug` + `.pole_b.label`) and a
 * `positions` map of `{ [slug]: normalizedPosition }` in [-1, +1].
 *
 * Two reads in one shape:
 *   - The polygon's overall outline tells the eye which dimensions this
 *     voice is extreme on (long spokes = strong pole_b, short = strong
 *     pole_a, an all-medium ring = neutral profile).
 *   - Callers pair it with numeric bars for the exact per-axis read.
 *
 * Pure SVG, no charting library. The viewBox reserves generous horizontal
 * padding (PAD_X) around the radar box so the rim labels, some of them
 * long ("Secular / Political Framing", "Institutional Power"), are never
 * clipped by the SVG viewport, the labeling bug this component fixes.
 */

import { useIsDark } from '../../hooks/useTheme';

export default function FiveAxisRadar({ axes, positions, subject }) {
  const isDark = useIsDark();

  // Radar circle box. The plotted rings/polygon live inside SIZE; the
  // labels live in the padding around it.
  const SIZE = 260;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const rMax = SIZE * 0.35;
  const LABEL_GAP = 9; // gap between the rim and the label text

  // Padding around the SIZE box, reserved for the rim labels. Horizontal
  // pad is generous: a long pole label runs OUTWARD from a near-horizontal
  // spoke and, without room, clips at the SVG viewport edge (the bug).
  // Measured against the longest label "Secular / Political Framing"
  // (~109 units at fontSize 9), whose right edge lands near x=316; PAD_X
  // of 96 puts the viewport edge at 356, a comfortable margin. Top/bottom
  // labels are short and centered, so they need far less room.
  const PAD_X = 96;
  const PAD_T = 12;
  const PAD_B = 28;
  const vbW = SIZE + PAD_X * 2;
  const vbH = SIZE + PAD_T + PAD_B;

  // n spokes, starting at -PI/2 (straight up) and rotating clockwise so the
  // first axis sits at the top.
  const n = axes.length;
  const spokes = axes.map((ax, i) => {
    const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const pos = positions?.[ax.slug];
    // Map [-1, +1] to [0, 1] radial fraction. High position (+1) = closer to
    // pole_a per the projection math; we put pole_a at the CENTER (r=0) and
    // pole_b at the RIM (r=rMax) so the rim labels (pole_b) match the
    // long-spoke direction. Long spoke = strong pole_b; short = strong
    // pole_a; mid-ring = neutral.
    const r = typeof pos === 'number' ? rMax * ((1 - pos) / 2) : 0;
    return {
      ax,
      angle,
      pos,
      // Voice's vertex (the data point).
      vx: cx + r * Math.cos(angle),
      vy: cy + r * Math.sin(angle),
      // Outer rim point (where the pole_b label sits).
      rimX: cx + rMax * Math.cos(angle),
      rimY: cy + rMax * Math.sin(angle),
      // Halfway point (the position=0 baseline).
      midX: cx + (rMax / 2) * Math.cos(angle),
      midY: cy + (rMax / 2) * Math.sin(angle),
    };
  });

  const polygonPath = spokes
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.vx.toFixed(1)} ${s.vy.toFixed(1)}`)
    .join(' ') + ' Z';
  const baselinePath = spokes
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.midX.toFixed(1)} ${s.midY.toFixed(1)}`)
    .join(' ') + ' Z';

  return (
    <figure className="mb-5">
      {/* viewBox origin is negative so the radar box sits inside a wider
          frame whose left/right margins (PAD_X) hold the rim labels. The
          radar stays horizontally centered because the box is padded
          symmetrically. Gridlines/labels branch on isDark: rim + spokes
          ('#e7e5e4' light / '#292524' dark), the neutral-baseline polygon
          ('#a8a29e' / '#57534e'), and the pole_b rim labels ('#44403c' /
          '#a8a29e'). The voice polygon and dots ('#F2483C' / '#B23E2F')
          are brand colors that read on either theme. */}
      <svg
        viewBox={`${-PAD_X} ${-PAD_T} ${vbW} ${vbH}`}
        width="100%"
        style={{ maxWidth: 560, display: 'block', margin: '0 auto' }}
        role="img"
        aria-label={`Radar polygon of ${subject || 'this voice'}'s position on ${axes.length} concept axes. Each spoke runs from the center (pole_a end) outward to the rim (pole_b end).`}
      >
        {/* Outer rim circle, halfway baseline ring, and spoke gridlines. */}
        <circle cx={cx} cy={cy} r={rMax} fill="none" stroke={isDark ? '#292524' : '#e7e5e4'} strokeWidth={1} />
        <circle cx={cx} cy={cy} r={rMax / 2} fill="none" stroke={isDark ? '#292524' : '#e7e5e4'} strokeDasharray="2 3" strokeWidth={1} />
        {spokes.map((s, i) => (
          <line key={`spoke-${i}`} x1={cx} y1={cy} x2={s.rimX} y2={s.rimY} stroke={isDark ? '#292524' : '#e7e5e4'} strokeWidth={1} />
        ))}

        {/* Faint baseline polygon at position=0 on every axis. */}
        <path d={baselinePath} fill="none" stroke={isDark ? '#57534e' : '#a8a29e'} strokeDasharray="3 3" strokeWidth={1} opacity={0.6} />

        {/* The voice's polygon (the fingerprint). */}
        <path d={polygonPath} fill="#F2483C" fillOpacity={0.22} stroke="#B23E2F" strokeWidth={1.8} strokeLinejoin="round" />

        {/* Vertex dots. */}
        {spokes.map((s, i) => (
          <circle key={`vertex-${i}`} cx={s.vx} cy={s.vy} r={3.5} fill="#F2483C" stroke="#18181b" strokeWidth={1} />
        ))}

        {/* Pole_b labels at the rim. Anchored by quadrant (start on the
            right, end on the left, middle at top/bottom) so each label
            grows OUTWARD into the PAD_X margin and never crosses the chart. */}
        {spokes.map((s, i) => {
          const dx = Math.cos(s.angle);
          const dy = Math.sin(s.angle);
          const lx = cx + (rMax + LABEL_GAP) * dx;
          const ly = cy + (rMax + LABEL_GAP) * dy;
          const anchor = dx > 0.3 ? 'start' : dx < -0.3 ? 'end' : 'middle';
          const dyAdjust = dy < -0.3 ? -4 : dy > 0.3 ? 12 : 4;
          return (
            <text
              key={`label-${i}`}
              x={lx}
              y={ly + dyAdjust - 4}
              fontSize={9}
              textAnchor={anchor}
              fill={isDark ? '#a8a29e' : '#44403c'}
              fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
            >
              {s.ax.pole_b.label}
            </text>
          );
        })}
      </svg>
      <figcaption className="text-xs text-stone-500 text-center mt-1 px-2">
        {axes.length}-axis fingerprint. Each spoke runs from the center (the
        opposite pole) outward to the labeled pole. Dashed inner ring is the
        all-neutral baseline.
      </figcaption>
    </figure>
  );
}
