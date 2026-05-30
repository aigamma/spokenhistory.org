/**
 * @fileoverview SnippetColorLab, a temporary /snippet-colors comparison
 * route.
 *
 * Renders the person-page oral-history pull-quote card (the same markup
 * as PersonPage's SnippetCard) in every candidate accent color, on an
 * explicit light panel (the cream design of record) and an explicit dark
 * panel (a proposed dark theme). Backgrounds are set with inline styles
 * so the comparison holds up even under a force-dark browser: the dark
 * panel is genuinely dark, the light panel shows the cream design.
 *
 * This is a throwaway decision aid. Once the accent (and the dark-mode
 * question) are settled, delete this file and its route in App.jsx, and
 * set the final SNIPPET_ACCENT in src/components/rag/tiers.js. The card
 * markup here is a faithful replica of SnippetCard, kept local so the
 * production component stays untouched.
 */

import { Link } from 'react-router-dom';
import { Quote, Clock, Play, ExternalLink, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// The representative snippet. Freddie Greene (Biddle), entry 44, the
// passage Eric was looking at. All five of her snippets are tier "low,"
// so none of them flag red under the new scheme.
const SNIP = {
  leadIn:
    "In March 1963, a car that dropped her brother George home from a SNCC meeting was followed, and the family's house was blasted with a shotgun through the front door. Greene describes her father's response:",
  quote:
    "No. I mean, if anything, my father said that this is more, this is a clear indication that we have to do something. Because they're doing things to us, no matter whether we do something or not, and we have to change the way things are.",
  speaker: 'Freddie Greene (Biddle)',
  timestamp: '00:50:10',
};

// Blend `hex` onto `base` with weight t (0..1) toward hex, returning a
// solid hex. Used to tint each card's fill and border with its own
// accent so the whole card reads as one color, not just the quote mark.
function mix(hex, base, t) {
  const h = parseInt(hex.slice(1), 16);
  const b = parseInt(base.slice(1), 16);
  const hr = (h >> 16) & 255, hg = (h >> 8) & 255, hb = h & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(hr * t + br * (1 - t));
  const g = Math.round(hg * t + bg * (1 - t));
  const bl = Math.round(hb * t + bb * (1 - t));
  return '#' + [r, g, bl].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// One card. accent colors the 6px left bar and the quotation mark, AND
// tints the card fill + border, so the whole card reads as one color
// (the fix for "only the red one stands out"). The links stay brand red
// + sky, held constant so the accent is the only variable. surface
// switches the base the tint is blended onto, cream-white vs dark.
function LabCard({ accent, surface, flag }) {
  const dark = surface === 'dark';
  const base = dark ? '#1c1917' : '#ffffff';
  const cardBg = mix(accent, base, dark ? 0.22 : 0.11);
  const borderColor = mix(accent, base, dark ? 0.45 : 0.34);
  const hearColor = dark ? '#f87171' : '#B23E2F';
  const locColor = dark ? '#7dd3fc' : '#075985';
  return (
    <figure
      className="my-3 rounded-xl border"
      style={{ backgroundColor: cardBg, borderColor, borderLeftColor: accent, borderLeftWidth: '6px' }}
    >
      <div className="p-5 sm:p-6">
        <p className={`text-sm mb-3 leading-snug ${dark ? 'text-stone-400' : 'text-stone-600'}`}>{SNIP.leadIn}</p>
        <div className="flex items-start gap-3">
          <Quote className="w-7 h-7 shrink-0 mt-1" style={{ color: accent }} aria-hidden="true" />
          <blockquote
            className={`text-lg sm:text-xl leading-relaxed ${dark ? 'text-stone-100' : 'text-stone-900'}`}
            style={{ fontFamily: 'Source Serif 4, serif' }}
          >
            &ldquo;{SNIP.quote}&rdquo;
          </blockquote>
        </div>
        <figcaption className="mt-4 sm:pl-10 text-sm">
          <div className={dark ? 'text-stone-100' : 'text-stone-900'}>
            <span className="font-bold" style={{ color: hearColor }}>{SNIP.speaker}</span>
          </div>
          <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 ${dark ? 'text-stone-400' : 'text-stone-600'}`}>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {SNIP.timestamp}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold" style={{ color: hearColor }}>
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              Hear this in context
            </span>
            <span className="inline-flex items-center gap-1 font-semibold" style={{ color: locColor }}>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              Library of Congress
            </span>
          </div>
          {flag && (
            <div
              className={`inline-flex items-center gap-1.5 mt-3 px-2 py-0.5 rounded border text-xs font-medium ${dark ? 'border-red-800 text-red-300' : 'border-red-300 text-red-800'}`}
              style={{ backgroundColor: dark ? 'rgba(127,29,29,0.3)' : '#fef2f2' }}
            >
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              Source transcript flagged: verify this passage against the audio before citing.
            </div>
          )}
        </figcaption>
      </div>
    </figure>
  );
}

function Label({ accent, hex, name, note, dark }) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 mt-8 mb-0 font-mono text-sm"
      style={{ color: dark ? '#a8a29e' : '#57534e' }}
    >
      <span className="inline-block w-3.5 h-3.5 rounded" style={{ background: accent }} aria-hidden="true" />
      <span style={{ color: dark ? '#f5f5f4' : '#1c1917' }}>{name}</span>
      <span>{hex}</span>
      {note && (
        <span
          className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{ background: dark ? '#f5f5f4' : '#1c1917', color: dark ? '#1c1917' : '#EBEAE9' }}
        >
          {note}
        </span>
      )}
    </div>
  );
}

const LIGHT_OPTIONS = [
  { name: 'Indigo', hex: '#4338ca', note: 'committed default' },
  { name: 'Blue', hex: '#1d4ed8' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Teal', hex: '#0f766e' },
  { name: 'Slate', hex: '#475569' },
];

const DARK_OPTIONS = [
  { name: 'Purple', hex: '#a78bfa', note: 'try first' },
  { name: 'Blue', hex: '#60a5fa' },
  { name: 'Green', hex: '#34d399' },
  { name: 'Indigo', hex: '#818cf8' },
];

export default function SnippetColorLab() {
  useDocumentTitle('Snippet Color Comparison');
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      {/* Top bar */}
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
            <Link
              to="/person/freddie-greene-biddle"
              className="inline-flex items-center gap-1 text-sm text-stone-700 hover:text-stone-900 focus:outline-none focus-visible:underline"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Freddie Greene page
            </Link>
            <Link to="/people" className="text-sm text-stone-700 hover:text-stone-900 focus:outline-none focus-visible:underline">
              All people
            </Link>
          </div>
          <h1 className="text-stone-900 text-2xl font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            Snippet Color Comparison
          </h1>
          <p className="text-stone-700 text-sm leading-relaxed">
            The same verbatim Freddie Greene snippet, rendered in each candidate accent. The accent colors the left
            bar and the quotation mark only (exactly as it ships); the links stay brand red and sky so the accent is
            the one thing changing. The light panel is the cream design of record; the dark panel is a proposed dark
            theme with its own background, so it stays dark even if your browser is force-darkening pages.
          </p>
        </div>
      </div>

      {/* Light panel */}
      <section style={{ backgroundColor: '#EBEAE9' }} className="px-4 sm:px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-wide font-mono font-semibold mb-1" style={{ color: '#B23E2F' }}>
            Light Surface (Current Design of Record)
          </p>
          <p className="text-sm text-stone-600 mb-2">
            What every visitor sees today, and what the Smithsonian and LoC reviewers see. Five accent options, then
            the red problem flag.
          </p>
          {LIGHT_OPTIONS.map((o) => (
            <div key={o.name}>
              <Label {...o} accent={o.hex} dark={false} />
              <LabCard accent={o.hex} surface="light" />
            </div>
          ))}
          <Label name="Red flag" hex="#b91c1c" note="publication-block only" accent="#b91c1c" dark={false} />
          <LabCard accent="#b91c1c" surface="light" flag />
        </div>
      </section>

      {/* Dark panel */}
      <section style={{ backgroundColor: '#1c1917' }} className="px-4 sm:px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-wide font-mono font-semibold mb-1" style={{ color: '#fca5a5' }}>
            Dark Surface (Proposed Dark Theme)
          </p>
          <p className="text-sm mb-2" style={{ color: '#a8a29e' }}>
            What an intentional dark theme would look like (the site has none today). Brighter accent variants read
            better on dark.
          </p>
          {DARK_OPTIONS.map((o) => (
            <div key={o.name}>
              <Label {...o} accent={o.hex} dark />
              <LabCard accent={o.hex} surface="dark" />
            </div>
          ))}
          <Label name="Red flag" hex="#f87171" note="publication-block only" accent="#f87171" dark />
          <LabCard accent="#f87171" surface="dark" flag />
        </div>
      </section>

      {/* Footer note */}
      <div className="bg-white border-t border-stone-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 text-sm text-stone-600">
          <p>
            Committed baseline is the light Indigo card. Tell me which accent to keep (and whether you want a real
            dark theme built), and I will set it and remove this comparison route.
          </p>
        </div>
      </div>
    </div>
  );
}
