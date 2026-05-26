/**
 * @fileoverview Single source of truth for the audit-tier vocabulary
 * + visual palette + fidelity-note text on the React side.
 *
 * The same 5-tier classification flows from:
 *   manifest.json::inferential_uncertainty.confidence_tier
 *     → Pinecone metadata.inferential_uncertainty_tier
 *     → citation payload.uncertaintyTier
 *     → here, where it gets visual + textual rendering
 *
 * If a new tier value is added to the corpus manifests, update:
 *   1. This file (TIER_VOCABULARY + each map below)
 *   2. mcp-server/server.mjs::fidelityNote (inline copy — Docker isolation)
 *   3. netlify/functions/retrieve.mjs::fidelityNote (inline copy — Function isolation)
 *   4. mcp-server/USAGE_GUIDE.md tier reference table
 *   5. rag/INTERACTIVE_FEATURES_DESIGN.md tier-color-palette section
 *   6. mcp-server/server.mjs source_for_claim prompt tier enumeration
 */

import { ShieldCheck, AlertTriangle } from 'lucide-react';

// The 5 tier values that actually appear in the corpus as of 2026-05-26.
// Counts (from mcp-server/data/leaders.json):
//   low                72
//   medium             18
//   publication-block  23
//   not-auditable      14
//   ingestion-only      9
export const TIER_VOCABULARY = [
  'low',
  'medium',
  'publication-block',
  'not-auditable',
  'ingestion-only',
];

// Tailwind class palette for the CitationCard tier badges + the
// RagExplore corpus-stats header pills. Light backgrounds + dark
// text (bg-50, text-800, border-200) for use on the cream page
// background; AA-contrast-safe across all 5.
export const TIER_BADGE = {
  'low': { label: 'Audited · Low uncertainty', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: ShieldCheck },
  'medium': { label: 'Audited · Medium uncertainty', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: AlertTriangle },
  'publication-block': { label: 'Audited · Publication-blocker issues', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', icon: AlertTriangle },
  'not-auditable': { label: 'Audited · Not externally verifiable', bg: 'bg-violet-50', text: 'text-violet-800', border: 'border-violet-200', icon: AlertTriangle },
  'ingestion-only': { label: 'Ingested · Not yet audited', bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-200', icon: AlertTriangle },
};

// Raw hex colors for SVG fills on the Constellation scatter. Darker
// 600/700-level variants chosen for visibility against the cream
// background — different brightness from the badge palette above
// because the contexts demand different luminance.
export const TIER_COLORS = {
  'low': '#15803d',                  // green-700
  'medium': '#b45309',               // amber-700
  'publication-block': '#b91c1c',    // red-700
  'not-auditable': '#7c3aed',        // violet-600
  'ingestion-only': '#475569',       // slate-600
};

/**
 * Per-tier fidelity-note text. Same logic as the server-side function
 * in mcp-server/server.mjs and netlify/functions/retrieve.mjs (those
 * stay inline because of Docker/Function isolation; React side is
 * DRYed via this module). When adding a new tier, update all three.
 *
 * @param {string|null} provenance - 'audit-original' | 'ingestion-only' | null
 * @param {string|null} tier - one of TIER_VOCABULARY, or null
 * @returns {string}
 */
export function fidelityNoteFor(provenance, tier) {
  if (tier === 'ingestion-only' || provenance === 'ingestion-only') {
    return 'Single-pass ingestion; transcript fidelity not yet audited against the Library of Congress canonical source.';
  }
  if (provenance === 'audit-original') {
    if (tier === 'low') return 'Audited transcript (Pass 1–8 + LoC heal); high confidence in fidelity.';
    if (tier === 'medium') return 'Audited transcript with residual uncertainty; verify against audio for high-stakes citations.';
    if (tier === 'publication-block') return 'Audited transcript with documented publication-blocker issues; verify the specific passage against audio before citing.';
    if (tier === 'not-auditable') return 'Audit pass completed but the entry cannot be fully verified against an external canonical source.';
    return 'Audited transcript.';
  }
  return 'Provenance unknown.';
}
