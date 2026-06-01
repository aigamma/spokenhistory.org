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

// The 6 tier KEYS still flow through from the manifests, but they render as only
// TWO settled states (see TIER_BADGE): every Library-of-Congress-cross-referenced
// interview is "LoC-Verified", and "not-auditable" is "Audio-Limited Source".
// Corpus distribution as of 2026-06 (140 interviews):
//   high               133   -> LoC-Verified
//   ingestion-only       3   -> LoC-Verified (new-pipeline entries, at LoC parity)
//   publication-block    1   -> LoC-Verified (Reverend Harry Blake; the LoC edited
//                              edition differs from the recording, both preserved)
//   medium / low         0   -> LoC-Verified (unused)
//   not-auditable        3   -> Audio-Limited Source (permanent source-audio limit)
// So the site reports 137 LoC-Verified + 3 Audio-Limited Source.
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
// badge states WHAT an entry is, never an action a reader must take. There are two
// settled states: LoC-Verified (cross-referenced against the Library of Congress) and
// Audio-Limited Source (the recording itself has a permanent limit). No warning icons,
// no "review" / "verify" call-to-action.
// Two settled states only. Every LoC-cross-referenced interview reads as
// "LoC-Verified" (there is no middle "Audited" rung: a Library-of-Congress
// check is the grade, so the tier keys that used to label "Audited" now all
// render LoC-Verified). "Audio-Limited Source" is the one genuinely different
// state, a permanent limit in the source recording. Per-entry nuance (for
// example where the Library's edited edition differs from the recording) lives
// in the fidelity note, not in a separate badge rung.
export const TIER_BADGE = {
  'high':              { label: 'LoC-Verified',         bg: 'bg-sky-50 dark:bg-sky-800',     text: 'text-sky-800 dark:text-white',   border: 'border-sky-200 dark:border-sky-400',     icon: ShieldCheck },
  'medium':            { label: 'LoC-Verified',         bg: 'bg-sky-50 dark:bg-sky-800',     text: 'text-sky-800 dark:text-white',   border: 'border-sky-200 dark:border-sky-400',     icon: ShieldCheck },
  'low':               { label: 'LoC-Verified',         bg: 'bg-sky-50 dark:bg-sky-800',     text: 'text-sky-800 dark:text-white',   border: 'border-sky-200 dark:border-sky-400',     icon: ShieldCheck },
  'publication-block': { label: 'LoC-Verified',         bg: 'bg-sky-50 dark:bg-sky-800',     text: 'text-sky-800 dark:text-white',   border: 'border-sky-200 dark:border-sky-400',     icon: ShieldCheck },
  'not-auditable':     { label: 'Audio-Limited Source', bg: 'bg-slate-50 dark:bg-slate-700', text: 'text-slate-700 dark:text-white', border: 'border-slate-200 dark:border-slate-400', icon: Info },
  'ingestion-only':    { label: 'LoC-Verified',         bg: 'bg-sky-50 dark:bg-sky-800',     text: 'text-sky-800 dark:text-white',   border: 'border-sky-200 dark:border-sky-400',     icon: ShieldCheck },
};

// Raw hex colors for SVG fills on the Constellation scatter. Darker
// 600/700-level variants chosen for visibility against the cream
// background, different brightness from the badge palette above
// because the contexts demand different luminance.
//
// Two settled states, no alarm colors: sky = LoC-Verified, slate = Audio-Limited
// Source. A glance at the map reads "finished corpus," not "work remaining."
export const TIER_COLORS = {
  'high': '#0369a1',                 // sky-700   (LoC-Verified)
  'medium': '#0369a1',               // sky-700   (LoC-Verified)
  'low': '#0369a1',                  // sky-700   (LoC-Verified)
  'publication-block': '#0369a1',    // sky-700   (LoC-Verified)
  'not-auditable': '#475569',        // slate-600 (Audio-Limited Source)
  'ingestion-only': '#0369a1',       // sky-700   (LoC-Verified)
};

// The two settled display states, derived from TIER_BADGE so there is one
// source of truth. Each pairs a label with its Constellation color and the set
// of raw tier keys that render under it, so legends show two swatches (not six
// tier keys) and tier filters can toggle a whole state at once.
export const SETTLED_STATES = (() => {
  const byLabel = new Map();
  for (const key of TIER_VOCABULARY) {
    const label = TIER_BADGE[key].label;
    if (!byLabel.has(label)) byLabel.set(label, { label, color: TIER_COLORS[key], tiers: [] });
    byLabel.get(label).tiers.push(key);
  }
  return Array.from(byLabel.values());
})();

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
 * Merge the "Audited" header bucket into "LoC-Verified" for the page-top
 * summary pills. NOTE (2026-06): the badge vocabulary itself has since
 * collapsed to two states (see TIER_BADGE), so "Audited" now resolves to the
 * same label as "LoC-Verified" and this function is effectively a pass-through.
 * It is kept for the existing call site and in case a future tier ever
 * reintroduces a distinct bucket. Audio-Limited Source remains a genuinely
 * different caveat and passes through as its own pill.
 *
 * The two label strings come straight from TIER_BADGE so the names stay in
 * sync with the badge palette: TIER_BADGE.high.label is the absorbing bucket
 * ("LoC-Verified") and TIER_BADGE.medium.label is the absorbed one ("Audited").
 * Any zero/falsy count is dropped; every other label passes through unchanged.
 *
 * @param {Object<string, number>} labelCounts - displayLabel -> count
 * @returns {Object<string, number>}
 */
export function summarizeAuditPills(labelCounts) {
  const VERIFIED = TIER_BADGE['high'].label;    // 'LoC-Verified'
  const AUDITED = TIER_BADGE['medium'].label;   // 'Audited'
  const result = {};
  let auditedExtra = 0;
  for (const [label, count] of Object.entries(labelCounts || {})) {
    if (!count) continue;
    if (label === AUDITED) {
      auditedExtra += count;
      continue;
    }
    result[label] = (result[label] || 0) + count;
  }
  if (auditedExtra) {
    result[VERIFIED] = (result[VERIFIED] || 0) + auditedExtra;
  }
  return result;
}

/**
 * Fold any audit-tier bucket whose count is below `min` into the bucket with
 * the largest count, so the header summary pills never show an absurd lone
 * bucket (for example a single pill reading "Audited: 1"; Dustin objected to
 * exactly that on 2026-05-30). The returned object keeps the same
 * displayLabel -> count shape and preserves the grand total; only buckets at or
 * above `min` survive as standalone pills. With one bucket or fewer the input is
 * returned unchanged. When every bucket is tiny they all collapse into the
 * single largest one, which still avoids a stray one-off pill.
 *
 * This only governs the summary pills. A filter dropdown can keep every label.
 *
 * @param {Object<string, number>} labelCounts - displayLabel -> count
 * @param {number} [min=3] - smallest count allowed to stand alone
 * @returns {Object<string, number>}
 */
export function foldTinyTierCounts(labelCounts, min = 3) {
  const entries = Object.entries(labelCounts || {});
  if (entries.length <= 1) {
    return { ...(labelCounts || {}) };
  }

  // The absorbing bucket is the one with the largest count (ties resolved by the
  // first such label encountered), so folded counts land where they read best.
  let majorLabel = entries[0][0];
  let majorCount = entries[0][1];
  for (const [label, count] of entries) {
    if (count > majorCount) {
      majorLabel = label;
      majorCount = count;
    }
  }

  const result = {};
  let folded = 0;
  for (const [label, count] of entries) {
    if (label === majorLabel) continue;
    if (count < min) {
      folded += count;
    } else {
      result[label] = count;
    }
  }
  result[majorLabel] = majorCount + folded;
  return result;
}

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
  if (tier === 'publication-block') return 'Cross-referenced against the Library of Congress published transcript. Where the Library’s lightly edited edition differs from the verbatim recording, both readings are preserved in the audit record.';
  if (tier === 'not-auditable') return 'The source recording carries an inherent audio limit (mid-sentence truncation or degradation). This is the most complete transcript the recording supports, and the Library of Congress transcript reflects the same limit.';
  // medium / low / ingestion-loc-verified / ingestion-only and any fallback:
  return 'Audited across nine passes against the project correction substrate and the Library of Congress reference.';
}
