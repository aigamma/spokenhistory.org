/**
 * @fileoverview Force-Directed Network Graph for semantic topic search visualization
 * Shows topics as nodes with the search query in the center, edges represent semantic similarity
 */

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import useViewport from '../../hooks/useViewport';

/**
 * ForceDirectedTopicGraph - Interactive network visualization of semantically related topics
 *
 * @param {Object} props
 * @param {Array} props.topics - Array of topic objects with similarity scores
 * @param {string} props.searchQuery - The search query (center node)
 * @param {Function} props.onTopicClick - Callback when a topic is clicked
 * @param {number} props.width - Width of the visualization
 * @param {number} props.height - Height of the visualization
 * @param {number} props.similarityThreshold - Minimum similarity to show edge (0-1)
 */
export default function ForceDirectedTopicGraph({
  topics = [],
  searchQuery = '',
  onTopicClick,
  width = 1200,
  height = 800,
  similarityThreshold = 0.6
}) {
  const svgRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  // Mobile branching: bigger font sizes so labels stay readable when
  // the SVG viewBox scales down to fit a 360px viewport, and the
  // info card converts from hover-only (impossible on touch) to
  // tap-toggled. The hook updates on resize/orientation change so a
  // desktop user dragging the window narrow gets the mobile treatment
  // without a refresh.
  const { isMobile } = useViewport();

  // Simple color scheme - one color for topics, brand color for search
  const topicNodeColor = '#57534e';    // stone-600 (neutral, professional)
  const searchNodeColor = '#F2483C';   // red (brand color)

  useEffect(() => {
    if (!svgRef.current || topics.length === 0) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    // Create nodes
    const nodes = [
      // Search query as central node
      {
        id: 'search',
        label: searchQuery,
        category: 'search',
        similarity: 1,
        isSearch: true,
        radius: 40 // Larger search node
      },
      // Topic nodes
      ...topics.map(topic => ({
        id: topic.id || topic.topicId,
        label: topic.keyword,
        category: topic.category || 'general',
        similarity: topic.similarity,
        clipCount: topic.clipCount,
        interviewCount: topic.interviewCount,
        description: topic.description || topic.shortDescription || '',
        isSearch: false,
        // Radius based on similarity with more dramatic differences
        radius: 8 + (topic.similarity * 35) // Range: 8-43px (more dramatic)
      }))
    ];

    // Create edges (links between topics)
    const links = [];
    
    // Connect search to all topics
    topics.forEach(topic => {
      links.push({
        source: 'search',
        target: topic.id || topic.topicId,
        strength: topic.similarity
      });
    });

    // Create edges between similar topics (optional - makes it more interesting)
    // Reduced connections for cleaner layout
    for (let i = 0; i < topics.length; i++) {
      for (let j = i + 1; j < topics.length; j++) {
        // Calculate similarity between topics based on their similarity to search
        const similarity = Math.abs(topics[i].similarity - topics[j].similarity);
        const inverseDistance = 1 - similarity;
        
        // Only connect if they're VERY similar (higher threshold for less clutter)
        if (inverseDistance > similarityThreshold + 0.1) {
          links.push({
            source: topics[i].id || topics[i].topicId,
            target: topics[j].id || topics[j].topicId,
            strength: inverseDistance * 0.2 // Even weaker for more spacing
          });
        }
      }
    }

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Add zoom behavior
    const g = svg.append('g');
    
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);

    // Create force simulation with more spacing
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(d => 250 - (d.strength * 120)) // Increased base distance for more space
        .strength(d => d.strength * 0.5) // Weaker links = more flexibility
      )
      .force('charge', d3.forceManyBody()
        .strength(d => d.isSearch ? -1000 : -400) // Increased repulsion for more spacing
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide()
        .radius(d => d.radius + 15) // Larger collision buffer
        .strength(0.8) // Strong collision prevention
      );

    // Create links (edges)
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', d => d.strength * 0.6)
      .attr('stroke-width', d => d.strength * 3);

    // Create node groups
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(drag(simulation));

    // Add circles for nodes
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.isSearch ? searchNodeColor : topicNodeColor)
      .attr('stroke', d => d.isSearch ? '#18181b' : '#fff') // stone-900 for search, white for others
      .attr('stroke-width', d => d.isSearch ? 3 : 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        setHoveredNode(d);
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.radius * 1.2)
          .attr('stroke-width', 4);
      })
      .on('mouseout', function(event, d) {
        setHoveredNode(null);
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.radius)
          .attr('stroke-width', 2);
      })
      .on('click', function(event, d) {
        // Mobile: a tap toggles the info card (first tap shows the
        // card, second tap on the same node navigates). Desktop: a
        // click goes straight to the topic playlist because the
        // info card was already visible during hover.
        if (d.isSearch) {
          setSelectedNode(d);
          return;
        }
        if (isMobile) {
          if (selectedNode && selectedNode.id === d.id) {
            // Second tap on the same node -> navigate.
            if (onTopicClick) onTopicClick(d.label);
            setSelectedNode(null);
          } else {
            // First tap -> show info card.
            setSelectedNode(d);
            setHoveredNode(d);
          }
        } else {
          if (onTopicClick) onTopicClick(d.label);
          setSelectedNode(d);
        }
      });

    // Add labels.
    // Mobile bumps font sizes so labels remain readable after the
    // SVG viewBox scales down to fit a phone-width container. The
    // search node label stays prominently larger than topic labels in
    // both modes so the center of the network is visually anchored.
    const searchFontSize = isMobile ? 26 : 18;
    const topicFontSize = isMobile ? 18 : 12;
    node.append('text')
      .text(d => d.label)
      .attr('font-size', d => d.isSearch ? searchFontSize : topicFontSize)
      .attr('font-weight', d => d.isSearch ? 'bold' : 'normal')
      .attr('font-family', 'Chivo Mono, monospace')
      .attr('fill', '#18181b') // stone-900
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.radius + 18)
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag behavior
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [topics, searchQuery, width, height, similarityThreshold, onTopicClick]);

  // Mobile uses the tap-pinned selectedNode for the info card
  // (because hover does not exist on touch); desktop uses the live
  // hoveredNode. The fallback to selectedNode on mobile is also what
  // makes the second-tap-to-navigate UX possible -- the card has to
  // stay visible after the first tap for the user to see what they're
  // about to navigate to. The card itself docks to the bottom of the
  // viewport on mobile (full-width, no top-right pinning that the
  // d3-zoom transform would have pushed off-screen) and stays in the
  // top-right corner on desktop where the original pattern works.
  const cardNode = isMobile ? selectedNode : hoveredNode;
  const showCard = cardNode && !cardNode.isSearch;

  return (
    <div className="relative w-full h-full bg-transparent rounded border border-stone-900">
      {/* SVG Canvas. role="img" + aria-label gives a screen-reader
          announcement; the graph itself is not screen-reader
          accessible (force-directed networks rarely are), but the
          surrounding TopicGlossary page presents the same data as a
          card grid that IS accessible, so the graph is treated as a
          decorative alternative presentation. */}
      <svg
        ref={svgRef}
        className="w-full h-full bg-transparent"
        role="img"
        aria-label={`Force-directed network of ${topics.length} topics related to ${searchQuery}`}
      />

      {/* Topic info card.
          Mobile: docked to the bottom of the SVG, full width,
          dismissable via the X button. Desktop: top-right corner. */}
      {showCard && (
        <div
          className={
            isMobile
              ? 'absolute left-2 right-2 bottom-2 bg-white/95 backdrop-blur-sm p-4 rounded border border-stone-900 shadow-lg'
              : 'absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded border border-stone-900 shadow-lg max-w-sm'
          }
          role="status"
          aria-live="polite"
        >
          {isMobile && (
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              aria-label="Dismiss topic info"
              className="absolute top-1 right-1 inline-flex items-center justify-center min-w-11 min-h-11 text-stone-900 hover:opacity-70"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <div className="text-lg font-bold mb-2 text-stone-900 pr-12" style={{ fontFamily: 'Source Serif 4, serif' }}>
            {cardNode.label}
          </div>
          {cardNode.description && (
            <div className="text-sm mb-3 text-stone-700 leading-relaxed" style={{ fontFamily: 'Source Serif 4, serif' }}>
              {cardNode.description.length > 200
                ? cardNode.description.substring(0, 200) + '...'
                : cardNode.description
              }
            </div>
          )}
          <div className="space-y-1 text-xs border-t border-stone-900 pt-2" style={{ fontFamily: 'Chivo Mono, monospace' }}>
            {cardNode.interviewCount && (
              <div className="text-stone-600">{cardNode.interviewCount} interviews • {cardNode.clipCount || 0} clips</div>
            )}
          </div>
          <div className="mt-2 text-xs text-stone-500" style={{ fontFamily: 'Chivo Mono, monospace' }}>
            {isMobile ? 'Tap topic again to view clips' : 'Click to view clips'}
          </div>
        </div>
      )}
    </div>
  );
}

