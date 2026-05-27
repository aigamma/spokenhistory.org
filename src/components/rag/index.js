/**
 * @fileoverview Public surface for the rag/ component bundle.
 *
 * All components consume citation-grade payloads (the same shape that
 * the Netlify /retrieve function and the MCP server emit). Backed by
 * the Pinecone civil-rights index + Voyage AI embeddings; precomputed
 * artifacts live under public/rag/.
 *
 * Usage:
 *   import { SemanticSearch, RelatedPassages, Constellation } from '@/components/rag';
 */

export { default as CitationCard } from './CitationCard';
export { default as SemanticSearch } from './SemanticSearch';
export { default as QuoteFinder } from './QuoteFinder';
export { default as RelatedPassages } from './RelatedPassages';
export { default as Constellation } from './Constellation';
// PolyphonicEvents + EventsTimeline removed from active surface
// 2026-05-27. The timeline I built was a "poor-contrast ruler" per
// Eric's review; the homepage Timeline (Home.jsx) is the canonical
// movement timeline. Component files retained in the directory for
// possible future flip-back but not exported from this barrel.
export { default as ConceptSpectrum } from './ConceptSpectrum';
export { default as FamousNames } from './FamousNames';
export { default as ThemesBrowser } from './ThemesBrowser';
export { default as GeographicAtlas } from './GeographicAtlas';
export { default as InfluenceList } from './InfluenceList';
export { default as QuoteOfTheDay } from './QuoteOfTheDay';
export { default as TourPages } from './TourPages';
export { default as NomicProjection } from './NomicProjection';
export { default as PassageMap } from './PassageMap';
export { default as ConceptMatrix } from './ConceptMatrix';
export { default as InterviewMap } from './InterviewMap';
export { default as AuditProvenance } from './AuditProvenance';

// Audit-tier vocabulary, palette, and fidelity-note helpers. Importers
// that build their own tier-aware UIs (custom badges, filters, legends)
// should pull from here rather than reimplementing the maps.
export {
  TIER_VOCABULARY,
  TIER_BADGE,
  TIER_COLORS,
  fidelityNoteFor,
} from './tiers';
