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
