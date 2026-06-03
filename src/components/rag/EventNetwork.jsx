/**
 * @fileoverview EventNetwork, a d3-force graph linking historical EVENTS to
 * the interviewees whose oral histories engage them.
 *
 * Data source: public/rag/summaries/event_network.json, built by
 * scripts/build_event_network.py from each chapter's related_events tags. An
 * edge exists ONLY where a chapter actually tagged that event; nothing is
 * inferred. Events are normalized to canonical hubs (so "Murder of Emmett
 * Till", "Emmett Till murder", and "Emmett Till trial 1955" are one node) and
 * any event engaged by fewer than two distinct interviewees is dropped, so the
 * graph shows shared anchors rather than a hairball of singletons.
 *
 * The graph is bipartite: event nodes on one side, interviewee nodes on the
 * other, edges run event -> interviewee. Event nodes use a distinct amber
 * accent and are sized by interviewee_count (how many lives the event anchors);
 * interviewee nodes reuse the brand red and are a fixed small size.
 *
 * Interaction mirrors InfluenceGraph:
 *  - Drag a node to pin it; double-click to unpin.
 *  - Hover a node to fade non-neighbors so its local subgraph stands out.
 *  - Mouse-wheel + drag pans/zooms via d3-zoom.
 *  - Click an EVENT node -> navigate to that event's clips
 *    (/playlist-builder?keywords=<label>&label=<label>).
 *  - Click a PERSON node -> navigate to that interview (/interview/<entry>).
 *
 * Imperative d3 attribute updates inside the simulation tick (rather than
 * React-state-per-tick) so the settle does not trigger a render per tick.
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GitBranch, List, Play } from 'lucide-react';
import * as d3 from 'd3';

const W = 760;
const H = 560;

// Event nodes get the one new accent (a warm amber that reads as distinct
// from the brand red without leaving the cream/stone/red family). Person
// nodes reuse the site brand red, matching InfluenceGraph's in-corpus color.
const COLOR_EVENT = '#D97706'; // amber-600
const COLOR_PERSON = '#F2483C'; // brand red
const COLOR_EDGE = '#d6d3d1';
const COLOR_EDGE_HOVER = '#18181b';
const COLOR_LABEL_BG = 'rgba(255,255,255,0.92)';

/**
 * EventNetwork, the user-facing wrapper. Loads the precomputed
 * event_network.json, shows the framing line, and offers two views: the
 * force-directed graph (default) and a ranked list fallback in case the graph
 * is heavy on a given device. Mirrors InfluenceList's structure.
 */
export default function EventNetwork() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('graph'); // 'graph' or 'list'
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/summaries/event_network.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="text-sm text-stone-500 p-4">Event network not yet generated.</div>;
  if (!data) return <div className="text-sm text-stone-500 p-4" role="status">Loading…</div>;

  const selectedNode = (() => {
    if (!selectedId) return null;
    if (selectedId.startsWith('event:')) {
      const ev = data.events.find((e) => `event:${e.id}` === selectedId);
      return ev ? { kind: 'event', ...ev } : null;
    }
    if (selectedId.startsWith('person:')) {
      const n = Number(selectedId.slice('person:'.length));
      const p = data.people.find((x) => x.entry_number === n);
      return p ? { kind: 'person', ...p } : null;
    }
    return null;
  })();

  return (
    <div className="rag-event-network">
      <p className="text-sm text-stone-600 mb-6 max-w-2xl">
        These are the historical events the interviewees engage and the people whose
        testimony connects to each, so you can see which events anchor the most lives.
        Each link is a chapter that actually names the event, nothing is inferred. Click an
        event to hear its clips, or a person to open their interview.
      </p>

      {/* View-mode toggle, matching InfluenceList. */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex rounded-md border border-stone-300 overflow-hidden" role="tablist">
          <button
            type="button"
            onClick={() => setMode('graph')}
            aria-pressed={mode === 'graph'}
            className={
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ' +
              (mode === 'graph' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-50 dark:hover:bg-zinc-800')
            }
          >
            <GitBranch className="w-3.5 h-3.5" aria-hidden="true" />
            Graph
          </button>
          <button
            type="button"
            onClick={() => setMode('list')}
            aria-pressed={mode === 'list'}
            className={
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors border-l border-stone-300 ' +
              (mode === 'list' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-50 dark:hover:bg-zinc-800')
            }
          >
            <List className="w-3.5 h-3.5" aria-hidden="true" />
            List
          </button>
        </div>
      </div>

      {mode === 'graph' && (
        <>
          <EventNetworkGraph
            events={data.events}
            people={data.people}
            edges={data.edges}
            selectedId={selectedId}
            onSelect={(n) => setSelectedId(n.id === selectedId ? null : n.id)}
          />
          {selectedNode && selectedNode.kind === 'event' && (
            <aside className="mt-3 px-4 py-3 rounded-md border border-stone-200 bg-white text-sm">
              <header className="flex items-baseline justify-between gap-2 mb-1">
                <h3 className="text-base font-medium text-stone-900">{selectedNode.label}</h3>
                <span className="text-xs text-stone-500">Historical event</span>
              </header>
              <p className="text-stone-700">
                Engaged by <span className="font-medium tabular-nums">{selectedNode.interviewee_count}</span>
                {' '}
                {selectedNode.interviewee_count === 1 ? 'interviewee' : 'interviewees'} in the collection.
              </p>
              <Link
                to={`/playlist-builder?keywords=${encodeURIComponent(selectedNode.label)}&label=${encodeURIComponent(selectedNode.label)}`}
                className="inline-flex items-center gap-1 text-xs text-civil-red-body hover:underline mt-2"
              >
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                Hear the clips for {selectedNode.label}
              </Link>
            </aside>
          )}
          {selectedNode && selectedNode.kind === 'person' && (
            <aside className="mt-3 px-4 py-3 rounded-md border border-stone-200 bg-white text-sm">
              <header className="flex items-baseline justify-between gap-2 mb-1">
                <h3 className="text-base font-medium text-stone-900">{selectedNode.name}</h3>
                <span className="text-xs text-stone-500">Interview #{selectedNode.entry_number}</span>
              </header>
              <Link
                to={`/interview/${selectedNode.entry_number}`}
                className="inline-flex items-center gap-1 text-xs text-civil-red-body hover:underline mt-1"
              >
                Open this interview
              </Link>
            </aside>
          )}
        </>
      )}

      {mode === 'list' && (
        <div className="space-y-1">
          {data.events.map((e) => (
            <article key={e.id} className="flex items-center gap-3 p-3 border border-stone-200 rounded-md bg-white">
              <span className="font-mono text-xs text-stone-500 tabular-nums w-8 text-right">
                {e.interviewee_count}
              </span>
              <span className="flex-1 text-sm text-stone-900">{e.label}</span>
              <Link
                to={`/playlist-builder?keywords=${encodeURIComponent(e.label)}&label=${encodeURIComponent(e.label)}`}
                className="inline-flex items-center gap-1 text-xs text-civil-red-body hover:underline"
              >
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                Clips
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * EventNetworkGraph, the inner d3-force visualization. Takes the raw events /
 * people / edges arrays and renders the bipartite graph. Kept as a separate
 * component so the wrapper above owns data-loading and the view toggle.
 */
function EventNetworkGraph({
  events,
  people,
  edges,
  selectedId = null,
  onSelect = null,
}) {
  const svgRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!svgRef.current) return undefined;
    if (!events || !people || !edges) return undefined;

    // Build the node set: events prefixed "event:", people prefixed "person:"
    // so the two id spaces never collide. Clone so d3 can mutate freely.
    const eventNodes = events.map((e) => ({
      id: `event:${e.id}`,
      kind: 'event',
      label: e.label,
      eventId: e.id,
      interviewee_count: e.interviewee_count,
    }));
    const personNodes = people.map((p) => ({
      id: `person:${p.entry_number}`,
      kind: 'person',
      label: p.name,
      entry_number: p.entry_number,
    }));
    const nodes = [...eventNodes, ...personNodes];
    const nodeById = new Map(nodes.map((n) => [n.id, n]));

    // Links: event -> person, only where both endpoints exist.
    const links = edges
      .map((e) => ({
        source: `event:${e.event_id}`,
        target: `person:${e.entry_number}`,
        chapter_count: e.chapter_count || 1,
      }))
      .filter((l) => nodeById.has(l.source) && nodeById.has(l.target))
      .map((l) => ({
        source: nodeById.get(l.source),
        target: nodeById.get(l.target),
        chapter_count: l.chapter_count,
      }));

    // Neighbor index for hover-highlight: O(1) "is B a neighbor of A".
    const neighbors = new Map();
    for (const n of nodes) neighbors.set(n.id, new Set([n.id]));
    for (const l of links) {
      neighbors.get(l.source.id).add(l.target.id);
      neighbors.get(l.target.id).add(l.source.id);
    }

    // Radius scaling. Event nodes scale by interviewee_count (the hub size
    // that makes Emmett Till's murder visibly anchor a generation). Person
    // nodes are a fixed small dot. sqrt keeps the 38-interviewee hub from
    // dwarfing the 2-interviewee events.
    const radiusFor = (d) =>
      d.kind === 'event'
        ? 6 + Math.sqrt(d.interviewee_count || 0) * 2.6
        : 4;

    // Reset the SVG between effect runs (StrictMode double-fires in dev).
    const root = d3.select(svgRef.current);
    root.selectAll('*').remove();

    // <defs> for the glow used on the selected node.
    const defs = root.append('defs');
    const glow = defs
      .append('filter')
      .attr('id', 'event-glow-selected')
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
      .attr('stroke-width', (d) => 0.6 + Math.log(d.chapter_count + 1) * 0.7);

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
      .attr('fill', (d) => (d.kind === 'event' ? COLOR_EVENT : COLOR_PERSON))
      .attr('fill-opacity', (d) => (d.kind === 'event' ? 0.9 : 0.8))
      .attr('stroke', '#18181b')
      .attr('stroke-width', (d) => (d.id === selectedId ? 2 : 0.8))
      .attr('filter', (d) => (d.id === selectedId ? 'url(#event-glow-selected)' : null));

    // Labels: every event node is labeled (events are the headline content and
    // there are only ~67 of them). Person labels are omitted by default to
    // avoid an ant-line of names over the dense interviewee cloud; the person
    // name appears in the details panel when a person node is clicked.
    nodeSel
      .filter((d) => d.kind === 'event')
      .append('text')
      .text((d) => d.label)
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
        nodeSel.attr('opacity', (n) => (nbr.has(n.id) ? 1 : 0.15));
        linkSel
          .attr('opacity', (l) => (l.source.id === d.id || l.target.id === d.id ? 1 : 0.08))
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
        if (d.kind === 'event') {
          // Navigate to this event's clips. keywords drives the text filter;
          // label gives the playlist a human heading.
          const q = encodeURIComponent(d.label);
          navigate(`/playlist-builder?keywords=${q}&label=${q}`);
        } else if (d.kind === 'person' && d.entry_number != null) {
          navigate(`/interview/${d.entry_number}`);
        }
      });

    // No per-node <title>: the native browser tooltip popped up over the graph
    // on every hover and blocked the network. Event nodes carry always-on
    // labels, a clicked node opens its details/route, and the SVG has a
    // graph-level aria-label for assistive tech.

    // Drag, restart while dragging so the dragged node's pull is felt.
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
      .on('end', (event) => {
        if (!event.active) simulation.alphaTarget(0);
        // Leave fx/fy set so the user can park a node; double-click clears it.
      });
    nodeSel.call(dragBehavior);

    nodeSel.on('dblclick', (_event, d) => {
      d.fx = null;
      d.fy = null;
      simulation.alpha(0.5).restart();
    });

    // The simulation. Event hubs repel harder so their personal clusters
    // spread out; collide radius keeps the hub labels legible.
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(46)
          .strength(0.55),
      )
      .force(
        'charge',
        d3.forceManyBody().strength((d) => (d.kind === 'event' ? -220 : -60)),
      )
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force(
        'collide',
        d3.forceCollide().radius((d) => radiusFor(d) + 3),
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
  }, [events, people, edges, selectedId, onSelect, navigate]);

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 overflow-hidden">
      <svg
        ref={svgRef}
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Network graph linking historical events to the interviewees whose oral histories engage them. Drag nodes to reposition; scroll to zoom; click an event to hear its clips."
        style={{ display: 'block', background: '#fafaf9' }}
      />
      <div className="px-3 py-2 text-xs text-stone-500 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-stone-200 bg-white">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR_EVENT }} aria-hidden="true" />
          Event (sized by how many lives it anchors)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR_PERSON }} aria-hidden="true" />
          Interviewee
        </span>
        <span className="text-stone-400">·</span>
        <span>Click an event for its clips, a person for their interview · drag to reposition · scroll to zoom</span>
      </div>
    </div>
  );
}
