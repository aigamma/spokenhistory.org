/**
 * @fileoverview AtlasMap, Leaflet-backed map showing the 12 movement
 * geographies from GeographicAtlas as clickable, scaled markers on an
 * OpenStreetMap tile layer.
 *
 * Why Leaflet and not Plotly / Mapbox / etc.:
 *  - Already a dependency (used elsewhere in the app for legacy map work).
 *  - Free OSM tiles, no API key, no per-tile charge.
 *  - SVG marker rendering is sharp at any zoom and trivial to colour
 *    + size by data (passage count, audit-tier mix).
 *
 * Markers use CircleMarker (vector circles, scale-correct in SVG), sized
 * by sqrt(passage_count) so a 25-voice anchor isn't 5x the radius of a
 * 5-voice one. Colour comes from the brand palette: brand red for the
 * selected anchor, stone-700 outline for the rest.
 *
 * Dynamic import of react-leaflet matches the existing pattern in
 * components/visualization/MapComponent.jsx, keeps the leaflet bundle
 * out of the main chunk so first-paint elsewhere isn't penalized.
 */

import { useEffect, useState } from 'react';
import GEOGRAPHY_COORDINATES from './geographyCoordinates';

const MAP_HEIGHT = 420;
const CENTER = [36.5, -89.0]; // continental US weighted toward the South
const ZOOM = 4;

export default function AtlasMap({ anchors, selectedSlug, onSelect }) {
  const [leafletMods, setLeafletMods] = useState(null);
  const [cssLoaded, setCssLoaded] = useState(false);

  // Lazy-load leaflet CSS at the document level. Including it via
  // ES import inside this file would force Vite to bundle it into the
  // page's CSS chunk even when the user never opens the Atlas tab -
  // appending a <link> on mount keeps it out of the critical path.
  useEffect(() => {
    const HREF = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    const existing = document.querySelector(`link[href="${HREF}"]`);
    if (existing) {
      setCssLoaded(true);
      return undefined;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = HREF;
    link.crossOrigin = 'anonymous';
    link.addEventListener('load', () => setCssLoaded(true));
    link.addEventListener('error', () => setCssLoaded(true)); // proceed even on error
    document.head.appendChild(link);
    return undefined;
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
    ]).then(([rl, leafletMod]) => {
      if (cancelled) return;
      const L = leafletMod.default || leafletMod;
      // Default-marker icon URLs need patching because Vite's asset
      // pipeline rewrites the relative paths leaflet expects.
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setLeafletMods({ rl, L });
    }).catch((err) => {
      console.error('[AtlasMap] failed to load leaflet:', err);
    });
    return () => { cancelled = true; };
  }, []);

  if (!leafletMods || !cssLoaded) {
    return (
      <div
        className="rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-center"
        style={{ height: MAP_HEIGHT }}
        role="status"
        aria-live="polite"
      >
        <span className="text-sm text-stone-500">Loading map…</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Tooltip } = leafletMods.rl;

  const markers = anchors
    .map((a) => {
      const coords = GEOGRAPHY_COORDINATES[a.slug];
      if (!coords) return null;
      return { ...a, ...coords };
    })
    .filter(Boolean);

  // Radius scaling: passage_count of 1 → r=8; 25 → r=22. sqrt keeps
  // small anchors visible without letting big ones dominate.
  const radiusFor = (count) => 6 + Math.sqrt(count || 1) * 3;

  return (
    <div
      className="rounded-lg border border-stone-200 overflow-hidden shadow-sm"
      style={{ height: MAP_HEIGHT }}
    >
      <MapContainer
        center={CENTER}
        zoom={ZOOM}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {markers.map((m) => {
          const isSelected = m.slug === selectedSlug;
          const passageCount = m.passages?.length ?? 0;
          return (
            <CircleMarker
              key={m.slug}
              center={[m.lat, m.lng]}
              radius={radiusFor(passageCount) + (isSelected ? 4 : 0)}
              pathOptions={{
                color: isSelected ? '#B23E2F' : '#44403c',
                weight: isSelected ? 3 : 1.5,
                fillColor: isSelected ? '#F2483C' : '#a8a29e',
                fillOpacity: isSelected ? 0.9 : 0.7,
              }}
              eventHandlers={{
                click: () => onSelect?.(m.slug),
                keydown: (e) => {
                  if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
                    e.originalEvent.preventDefault();
                    onSelect?.(m.slug);
                  }
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                <div className="text-sm">
                  <strong>{m.name}</strong>
                  <br />
                  <span className="text-xs text-stone-600">
                    {passageCount} {passageCount === 1 ? 'voice' : 'voices'}
                    {' · click to view'}
                  </span>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
