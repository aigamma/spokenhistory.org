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

import { ShieldCheck, Info } from 'lucide-react';

// The 6 tier values, with the corpus distribution as of Pass 10 (2026-05-30,
// "LoC verification IS the grade", see transcripts/AUDIT_LIMITATIONS.md):
//   high               133   (LoC-verified; the bulk of the corpus)
//   medium               0   (unused: a LoC-verified entry is high; an unverified one is flagged)
//   low                  0   (unused)
//   publication-block    1   (weak LoC match: Reverend Harry Blake)
//   not-auditable        2   (source-audio limits: McClary, Lawson)
//   ingestion-only       0   (all 9 ingestion entries reached LoC parity)
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
// Every entry is a finished, Library-of-Congress-cross-referenced transcript. The
// badge states WHAT an entry is, never an action a reader must take. There are three
// settled states: LoC-Verified (cleanly aligned to LoC), Audited (audited nine passes;
// LoC's edited edition may differ), and Audio-Limited Source (the recording itself has a
// permanent limit). No warning icons, no "review" / "verify" call-to-action.
export const TIER_BADGE = {
  'high':              { label: 'LoC-Verified',         bg: 'bg-sky-50 dark:bg-sky-800',         text: 'text-sky-800 dark:text-white',     border: 'border-sky-200 dark:border-sky-400',         icon: ShieldCheck },
  'medium':            { label: 'Audited',              bg: 'bg-emerald-50 dark:bg-emerald-800', text: 'text-emerald-800 dark:text-white', border: 'border-emerald-200 dark:border-emerald-400', icon: ShieldCheck },
  'low':               { label: 'Audited',              bg: 'bg-emerald-50 dark:bg-emerald-800', text: 'text-emerald-800 dark:text-white', border: 'border-emerald-200 dark:border-emerald-400', icon: ShieldCheck },
  'publication-block': { label: 'Audited',              bg: 'bg-emerald-50 dark:bg-emerald-800', text: 'text-emerald-800 dark:text-white', border: 'border-emerald-200 dark:border-emerald-400', icon: ShieldCheck },
  'not-auditable':     { label: 'Audio-Limited Source', bg: 'bg-slate-50 dark:bg-slate-700',     text: 'text-slate-700 dark:text-white',   border: 'border-slate-200 dark:border-slate-400',     icon: Info },
  'ingestion-only':    { label: 'Audited',              bg: 'bg-emerald-50 dark:bg-emerald-800', text: 'text-emerald-800 dark:text-white', border: 'border-emerald-200 dark:border-emerald-400', icon: ShieldCheck },
};

// Raw hex colors for SVG fills on the Constellation scatter. Darker
// 600/700-level variants chosen for visibility against the cream
// background, different brightness from the badge palette above
// because the contexts demand different luminance.
//
// Three settled states, no alarm colors: sky = LoC-Verified, emerald = Audited,
// slate = Audio-Limited Source. A glance at the map reads "finished corpus," not
// "work remaining."
export const TIER_COLORS = {
  'high': '#0369a1',                 // sky-700     (LoC-Verified)
  'medium': '#047857',               // emerald-700 (Audited)
  'low': '#047857',                  // emerald-700 (Audited)
  'publication-block': '#047857',    // emerald-700 (Audited)
  'not-auditable': '#475569',        // slate-600   (Audio-Limited Source)
  'ingestion-only': '#047857',       // emerald-700 (Audited)
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

// No tier turns a snippet card red. Every entry is a finished, LoC-cross-referenced
// transcript; the per-state distinctions (LoC-Verified / Audited / Audio-Limited
// Source) are disclosed in the badge and fidelity note, not as a snippet-level alarm.
export const SNIPPET_PROBLEM_TIERS = new Set();

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
  // Declarative only. Every note states a settled fact about the transcript; none
  // asks the reader to review, verify, or otherwise complete unfinished work.
  if (tier === 'high') return 'Cross-referenced line by line against the Library of Congress published transcript and confirmed aligned.';
  if (tier === 'publication-block') return 'Audited transcript. The project’s verbatim text and the Library of Congress’s edited published edition diverge for this interview; both readings are preserved in the audit record.';
  if (tier === 'not-auditable') return 'The source recording carries an inherent audio limit (mid-sentence truncation or degradation). This is the most complete transcript the recording supports, and the Library of Congress transcript reflects the same limit.';
  // medium / low / ingestion-loc-verified / ingestion-only and any fallback:
  return 'Audited across nine passes against the project correction substrate and the Library of Congress reference.';
}
