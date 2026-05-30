/**
 * @fileoverview InfluenceGraph, d3-force visualization of the
 * who-discussed-whom graph from public/rag/summaries/influence.json.
 *
 * 151 nodes + 214 edges. Filtered to nodes that participate in at
 * least one edge (drops isolates that were ingested but never
 * mentioned). Color encodes corpus membership: brand red for the
 * 136 interviewees in the corpus, stone-gray for external figures
 * (Ella Baker, Bob Moses, Bayard Rustin, Diane Nash, etc.) who don't
 * have their own interview but are extensively discussed.
 *
 * Size encodes discussed_by_count (the in-degree of "how many
 * interviewees mention you"). Edge width encodes edge.count (how
 * many times the from→to mention was reinforced; usually 1).
 *
 * Interaction:
 *  - Drag a node to pin it (d3-drag).
 *  - Click a node → onSelect(node) fires (parent can scroll details
 *    panel into view).
 *  - Hover → fade non-neighbors so the node's local subgraph stands
 *    out without losing global context.
 *  - Mouse-wheel + drag pans/zooms via d3-zoom; double-click recenters.
 *
 * Imperative d3 attribute updates inside the simulation tick (rather
 * than React-state-per-tick) so the 150-iteration settle doesn't
 * trigger 150 React renders of a 365-element subtree.
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const W = 760;
const H = 520;

// Color scheme. In-corpus nodes use the brand red; external figures
// use the same warm stone palette as the rest of the site. The "label
// shown" threshold prevents the SVG from becoming an ant-line of text.
const COLOR_IN_CORPUS = '#F2483C';
const COLOR_EXTERNAL = '#78716c';
const COLOR_EDGE = '#d6d3d1';
const COLOR_EDGE_HOVER = '#18181b';
const COLOR_LABEL_BG = 'rgba(255,255,255,0.92)';

export default function InfluenceGraph({
  nodes: nodesIn,
  edges: edgesIn,
  selectedId = null,
  onSelect = null,
  minLabelDegree = 4,
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return undefined;

    // Drop true isolates (zero edges in or out). Keeping them in the
    // simulation just produces a halo of disconnected dust at the
    // periphery, visually meaningless.
    const edgeNodeIds = new Set();
    for (const e of edgesIn) {
      edgeNodeIds.add(e.from);
      edgeNodeIds.add(e.to);
    }
    const nodes = nodesIn
      .filter((n) => edgeNodeIds.has(n.id))
      .map((n) => ({ ...n })); // clone so d3 can mutate

    // Map edge endpoint IDs to the cloned-node objects d3 expects.
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const links = edgesIn
      .filter((e) => nodeById.has(e.from) && nodeById.has(e.to))
      .map((e) => ({
        source: nodeById.get(e.from),
        target: nodeById.get(e.to),
        count: e.count || 1,
      }));

    // Build a neighbor index for hover-highlight: O(1) lookup of "is
    // node B a neighbor of node A."
    const neighbors = new Map();
    for (const n of nodes) neighbors.set(n.id, new Set([n.id]));
    for (const l of links) {
      neighbors.get(l.source.id).add(l.target.id);
      neighbors.get(l.target.id).add(l.source.id);
    }

    // Radius scaling. Nodes with discussed_by_count=0 still get r=4
    // so they're visible at the periphery. Linear sqrt scaling keeps
    // the 24-mention Rev. Sherrod from being 6× the 4-mention nodes.
    const radiusFor = (d) => 4 + Math.sqrt(d.discussed_by_count || 0) * 3.5;

    // Reset the SVG between effect runs (StrictMode double-fires this
    // in dev; production hits it once per mount).
    const root = d3.select(svgRef.current);
    root.selectAll('*').remove();

    // A <defs> for the brand-red glow used on the selected node.
    const defs = root.append('defs');
    const glow = defs
      .append('filter')
      .attr('id', 'glow-selected')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', 3).attr('result', 'blur');
    const merge = glow.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    // A pannable/zoomable inner group.
    const view = root.append('g').attr('class', 'view');

    const zoom = d3
      .zoom()
      .scaleExtent([0.4, 4])
      .on('zoom', (event) => {
        view.attr('transform', event.transform);
      });
    root.call(zoom);

    // Edges first (so nodes paint on top).
    const linkSel = view
      .append('g')
      .attr('class', 'links')
      .attr('stroke', COLOR_EDGE)
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d) => 0.6 + Math.log(d.count + 1) * 0.9);

    // Nodes.
    const nodeSel = view
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer');

    nodeSel
      .append('circle')
      .attr('r', (d) => radiusFor(d))
      .attr('fill', (d) => (d.in_corpus ? COLOR_IN_CORPUS : COLOR_EXTERNAL))
      .attr('fill-opacity', 0.85)
      .attr('stroke', '#18181b')
      .attr('stroke-width', (d) => (d.id === selectedId ? 2 : 0.8))
      .attr('filter', (d) => (d.id === selectedId ? 'url(#glow-selected)' : null));

    // Labels (only on the top-degree nodes to avoid ant-line clutter).
    nodeSel
      .filter((d) => (d.discussed_by_count || 0) >= minLabelDegree)
      .append('text')
      .text((d) => d.name)
      .attr('x', (d) => radiusFor(d) + 4)
      .attr('y', 4)
      .attr('font-size', 11)
      .attr('font-family', 'ui-sans-serif, system-ui, sans-serif')
      .attr('fill', '#18181b')
      .attr('paint-order', 'stroke')
      .attr('stroke', COLOR_LABEL_BG)
      .attr('stroke-width', 3)
      .attr('stroke-linejoin', 'round');

    // Hover: fade non-neighbors, darken neighbor edges.
    nodeSel
      .on('mouseenter', function handleEnter(_event, d) {
        const nbr = neighbors.get(d.id);
        nodeSel.attr('opacity', (n) => (nbr.has(n.id) ? 1 : 0.18));
        linkSel
          .attr('opacity', (l) => (l.source.id === d.id || l.target.id === d.id ? 1 : 0.1))
          .attr('stroke', (l) =>
            l.source.id === d.id || l.target.id === d.id ? COLOR_EDGE_HOVER : COLOR_EDGE,
          );
      })
      .on('mouseleave', function handleLeave() {
        nodeSel.attr('opacity', 1);
        linkSel.attr('opacity', 0.6).attr('stroke', COLOR_EDGE);
      })
      .on('click', function handleClick(_event, d) {
        if (onSelect) onSelect(d);
      });

    // <title> for native browser tooltip + screen reader.
    nodeSel.append('title').text((d) =>
      `${d.name}\n${d.in_corpus ? 'In corpus' : 'External figure'}\nDiscussed by ${d.discussed_by_count} other ${d.discussed_by_count === 1 ? 'interview' : 'interviews'}`,
    );

    // Drag, restart the simulation while dragging so the dragged
    // node's pull is felt by its neighbors.
    const dragBehavior = d3
      .drag()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        // Don't auto-release: leaving fx/fy set lets the user park
        // a node where they want it. A double-click clears the pin.
      });
    nodeSel.call(dragBehavior);

    nodeSel.on('dblclick', (_event, d) => {
      d.fx = null;
      d.fy = null;
      simulation.alpha(0.5).restart();
    });

    // The simulation.
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((l) => 28 + 40 / (l.count + 0.5))
          .strength(0.7),
      )
      .force('charge', d3.forceManyBody().strength(-140))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force(
        'collide',
        d3.forceCollide().radius((d) => radiusFor(d) + 2),
      )
      .alphaDecay(0.025);

    simulation.on('tick', () => {
      linkSel
        .attr('x1', (l) => l.source.x)
        .attr('y1', (l) => l.source.y)
        .attr('x2', (l) => l.target.x)
        .attr('y2', (l) => l.target.y);
      nodeSel.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodesIn, edgesIn, selectedId, onSelect, minLabelDegree]);

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 overflow-hidden">
      <svg
        ref={svgRef}
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Network graph of who-discussed-whom across the 136-interview corpus. Drag nodes to reposition; scroll to zoom."
        style={{ display: 'block', background: '#fafaf9' }}
      />
      <div className="px-3 py-2 text-xs text-stone-500 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-stone-200 bg-white">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR_IN_CORPUS }} aria-hidden="true" />
          In corpus (interviewed)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR_EXTERNAL }} aria-hidden="true" />
          External (discussed only)
        </span>
        <span className="text-stone-400">·</span>
        <span>Drag to reposition · scroll to zoom · double-click to unpin</span>
      </div>
    </div>
  );
}
