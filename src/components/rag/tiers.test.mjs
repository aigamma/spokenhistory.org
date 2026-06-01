// node:test-based smoke test for tiers.js. Run with:
//   node --test src/components/rag/tiers.test.mjs
//
// Validates the contract that downstream surfaces (CitationCard,
// Constellation, RagExplore, RelatedPassages) rely on. If any of
// these assertions fail, those four surfaces break in ways that
// are hard to catch via visual inspection.
//
// This file imports the .js sibling directly; no Vite/JSX needed.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TIER_VOCABULARY,
  TIER_BADGE,
  TIER_COLORS,
  SETTLED_STATES,
  fidelityNoteFor,
} from './tiers.js';

test('TIER_VOCABULARY has the 6 expected tier values (Pass 9: includes "high")', () => {
  assert.deepStrictEqual(
    [...TIER_VOCABULARY].sort(),
    ['high', 'ingestion-only', 'low', 'medium', 'not-auditable', 'publication-block'],
  );
});

test('TIER_BADGE has an entry for every tier in TIER_VOCABULARY', () => {
  for (const tier of TIER_VOCABULARY) {
    const b = TIER_BADGE[tier];
    assert.ok(b, `TIER_BADGE missing entry for "${tier}"`);
    assert.ok(b.label, `TIER_BADGE.${tier}.label missing`);
    assert.ok(b.bg, `TIER_BADGE.${tier}.bg missing`);
    assert.ok(b.text, `TIER_BADGE.${tier}.text missing`);
    assert.ok(b.border, `TIER_BADGE.${tier}.border missing`);
    assert.ok(b.icon, `TIER_BADGE.${tier}.icon missing`);
  }
});

test('TIER_COLORS has a hex color for every tier in TIER_VOCABULARY', () => {
  for (const tier of TIER_VOCABULARY) {
    const c = TIER_COLORS[tier];
    assert.ok(c, `TIER_COLORS missing entry for "${tier}"`);
    assert.match(c, /^#[0-9a-fA-F]{6}$/, `TIER_COLORS.${tier} is not a 6-hex color`);
  }
});

test('fidelityNoteFor returns a non-empty string for every tier', () => {
  for (const tier of TIER_VOCABULARY) {
    const note = fidelityNoteFor('audit-original', tier);
    assert.ok(typeof note === 'string' && note.length > 0, `fidelityNoteFor returned empty for tier="${tier}"`);
  }
  // ingestion-only renders as LoC-Verified (new-pipeline entries at LoC parity);
  // its note references the Library of Congress.
  const note = fidelityNoteFor('audit-original', 'ingestion-only');
  assert.match(note, /Library of Congress/i);
});

test('fidelityNoteFor handles unknown tiers gracefully', () => {
  const audited = fidelityNoteFor('audit-original', 'completely-unknown-tier');
  assert.ok(audited.length > 0, 'should fall back to a generic settled note');
  const nullish = fidelityNoteFor(null, null);
  assert.ok(nullish.length > 0, 'should still return a settled note when both fields are null');
});

test('SETTLED_STATES collapses every tier into exactly two display states', () => {
  assert.equal(SETTLED_STATES.length, 2);
  assert.deepStrictEqual(
    SETTLED_STATES.map((s) => s.label).sort(),
    ['Audio-Limited Source', 'LoC-Verified'],
  );
  // every tier key is covered exactly once across the two states
  assert.deepStrictEqual(
    SETTLED_STATES.flatMap((s) => s.tiers).sort(),
    [...TIER_VOCABULARY].sort(),
  );
  for (const s of SETTLED_STATES) assert.match(s.color, /^#[0-9a-fA-F]{6}$/);
});
