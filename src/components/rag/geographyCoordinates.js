/**
 * Lat/lng for the 12 geographic anchors used by GeographicAtlas.
 *
 * These coordinates live next to the component (rather than inside
 * public/rag/summaries/geography.json) so the precomputed-from-Pinecone
 * data file stays a clean regen artifact. If `rag/precompute_panels.mjs`
 * is re-run, it'll overwrite geography.json without losing coordinates.
 *
 * Each anchor is a single point chosen for visual clarity, not a
 * region center of mass. The Mississippi Delta and Alabama Black Belt
 * are placed at recognizable cities within those regions (Clarksdale
 * MS, Selma AL respectively); city-level anchors use their actual
 * city-hall coordinates.
 *
 * Keyed by `slug` (matches geography.json's anchor.slug). If an anchor
 * appears in geography.json without an entry here, the map silently
 * skips it (the pill list still renders).
 */

const GEOGRAPHY_COORDINATES = {
  'mississippi-delta':  { lat: 34.2003, lng: -90.5712, kind: 'region' },  // Clarksdale, MS (Delta seat)
  'alabama-black-belt': { lat: 32.6010, lng: -86.6803, kind: 'region' },  // central Alabama Black Belt
  'selma':              { lat: 32.4074, lng: -87.0211, kind: 'city' },
  'birmingham':         { lat: 33.5186, lng: -86.8104, kind: 'city' },
  'atlanta':            { lat: 33.7490, lng: -84.3880, kind: 'city' },
  'nashville':          { lat: 36.1627, lng: -86.7816, kind: 'city' },
  'memphis':            { lat: 35.1495, lng: -90.0490, kind: 'city' },
  'hattiesburg':        { lat: 31.3271, lng: -89.2903, kind: 'city' },
  'jackson':            { lat: 32.2988, lng: -90.1848, kind: 'city' },
  'oakland':            { lat: 37.8044, lng: -122.2712, kind: 'city' },
  'chicago':            { lat: 41.8781, lng: -87.6298, kind: 'city' },
  'washington-dc':      { lat: 38.9072, lng: -77.0369, kind: 'city' },
};

export default GEOGRAPHY_COORDINATES;
