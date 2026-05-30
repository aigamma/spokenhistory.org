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
 *   2. mcp-server/server.mjs::fidelityNote (inline copy, Docker isolation)
 *   3. netlify/functions/retrieve.mjs::fidelityNote (inline copy, Function isolation)
 *   4. mcp-server/USAGE_GUIDE.md tier reference table
 *   5. rag/INTERACTIVE_FEATURES_DESIGN.md tier-color-palette section
 *   6. mcp-server/server.mjs source_for_claim prompt tier enumeration
 */

import { ShieldCheck, AlertTriangle } from 'lucide-react';

// The 6 tier values that appear in the corpus as of Pass 9 (2026-05-26):
//   high                1
//   medium             29
//   low                67
//   publication-block  18
//   not-auditable      12
//   ingestion-only      9
export const TIER_VOCABULARY = [
  'high',
  'medium',
  'low',
  'publication-block',
  'not-auditable',
  'ingestion-only',
];

// Tailwind class palette for the CitationCard tier badges + the
// RagExplore corpus-stats header pills.
//
// Light mode (default): soft pastel fills (bg-50) + dark charcoal text
//   (text-800) + subtle border (border-200). AA-contrast-safe on cream.
// Dark mode (prefers-color-scheme: dark): saturated dark fills (bg-700
//   or 800) + white text + brighter border (border-400 or 500) so the
//   pill keeps its outline glow on a dark background.
export const TIER_BADGE = {
  'high':              { label: 'Audited · High confidence',           bg: 'bg-sky-50 dark:bg-sky-800',         text: 'text-sky-800 dark:text-white',         border: 'border-sky-200 dark:border-sky-400',         icon: ShieldCheck },
  'medium':            { label: 'Audited · Medium confidence',         bg: 'bg-emerald-50 dark:bg-emerald-800', text: 'text-emerald-800 dark:text-white',     border: 'border-emerald-200 dark:border-emerald-400', icon: ShieldCheck },
  'low':               { label: 'Audited · Low confidence',            bg: 'bg-amber-50 dark:bg-amber-700',     text: 'text-amber-800 dark:text-white',       border: 'border-amber-200 dark:border-amber-400',     icon: AlertTriangle },
  'publication-block': { label: 'Audited · Publication-blocker issues', bg: 'bg-red-50 dark:bg-red-800',         text: 'text-red-800 dark:text-white',         border: 'border-red-200 dark:border-red-400',         icon: AlertTriangle },
  'not-auditable':     { label: 'Audited · Not externally verifiable',  bg: 'bg-violet-50 dark:bg-violet-800',   text: 'text-violet-800 dark:text-white',      border: 'border-violet-200 dark:border-violet-400',   icon: AlertTriangle },
  'ingestion-only':    { label: 'Ingested · Not yet audited',           bg: 'bg-slate-50 dark:bg-slate-700',     text: 'text-slate-800 dark:text-white',       border: 'border-slate-200 dark:border-slate-400',     icon: AlertTriangle },
};

// Raw hex colors for SVG fills on the Constellation scatter. Darker
// 600/700-level variants chosen for visibility against the cream
// background, different brightness from the badge palette above
// because the contexts demand different luminance.
//
// Note: tier ordering is high (best) → ingestion-only (provenance-pinned).
// The color progression goes blue (high audit confidence) → green (medium)
// → amber (low) → red (publication-block) → violet (not-auditable) →
// slate (ingestion-only), so a glance at the constellation reads the
// audit-quality gradient.
export const TIER_COLORS = {
  'high': '#0369a1',                 // sky-700
  'medium': '#047857',               // emerald-700
  'low': '#b45309',                  // amber-700
  'publication-block': '#b91c1c',    // red-700
  'not-auditable': '#7c3aed',        // violet-600
  'ingestion-only': '#475569',       // slate-600
};

// ---- Person-page oral-history snippet cards -------------------------
//
// The embedded pull-quotes on /person/:slug are verbatim, gated by
// scripts/verify_person_snippets.py against the corpus. Their card color
// does NOT encode the source transcript's audit tier the way the RAG
// surfaces (Constellation, ConceptMatrix, neighbor chips) do. Tier-
// coloring every quote produced an all-amber wash (502 of ~1005 snippets
// are "low") where the whole page read as flagged, so nothing read as
// flagged. Each card instead gets one calm standard accent, and the red
// flag is reserved for the genuine problem case below. The accent is a
// transcript-tier signal misapplied to a vetted quote; the quote being
// present and verbatim is what the card actually attests to.

// Standard accent for a snippet card that carries a verbatim quote. The
// 6px left bar and the quotation mark take SNIPPET_ACCENT; the card fill
// and border take SNIPPET_FILL / SNIPPET_BORDER, so the WHOLE card reads
// as one calm color, not just the quote mark.
//
// These are CSS custom properties, not literal hexes: the colors live in
// src/styles/index.css and switch on prefers-color-scheme, so the cards
// adapt to the visitor's screen automatically:
//   light screen: blue-700 #1d4ed8 on a pale blue-50 fill
//   dark screen:  blue-400 #60a5fa on a dark navy fill
// To recolor every snippet card at once, edit the two :root blocks in
// src/styles/index.css.
export const SNIPPET_ACCENT = 'var(--snippet-accent)';
export const SNIPPET_FILL = 'var(--snippet-fill)';
export const SNIPPET_BORDER = 'var(--snippet-border)';

// The problem case (red), a source transcript flagged with documented
// publication-blocker issues ("really bad context"). Adapts to the
// screen via the same index.css prefers-color-scheme blocks.
export const SNIPPET_PROBLEM_ACCENT = 'var(--snippet-problem-accent)';
export const SNIPPET_PROBLEM_FILL = 'var(--snippet-problem-fill)';
export const SNIPPET_PROBLEM_BORDER = 'var(--snippet-problem-border)';

// The only tier that turns a snippet card red. publication-block means
// the source transcript carries documented publication-blocker issues
// (verify the passage against audio before citing). Every other tier
// (high / medium / low / not-auditable / ingestion-only) renders with
// the calm standard accent.
export const SNIPPET_PROBLEM_TIERS = new Set(['publication-block']);

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
    if (tier === 'high') return 'Audited transcript (Pass 1–9); minimal residual error expected, publishable as-is.';
    if (tier === 'medium') return 'Audited transcript (Pass 1–9); publication-eligible with caveat note.';
    if (tier === 'low') return 'Audited transcript (Pass 1–9); adversarial-ensemble review recommended before publication-grade attribution.';
    if (tier === 'publication-block') return 'Audited transcript with documented publication-blocker issues; verify the specific passage against audio before citing.';
    if (tier === 'not-auditable') return 'Audit pass completed but the entry cannot be fully verified against an external canonical source.';
    return 'Audited transcript.';
  }
  return 'Provenance unknown.';
}
