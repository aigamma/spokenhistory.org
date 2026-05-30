/**
 * @fileoverview AuditProvenance, compact, scannable widget telling
 * the data-cleaning story that backs every passage on this site.
 *
 * Stakeholder context (Smithsonian / LoC / WWU): the corpus's
 * credibility rests on the audit substrate, which is currently
 * invisible on the public site except for per-result tier badges.
 * This widget surfaces the headline numbers so a first-time visitor
 * can see "this isn't unverified Whisper output; it's been hammered
 * against primary sources."
 *
 * Three numeric callouts + one short paragraph:
 *   - 9 audit passes (the Whisper → internal-review → LoC cascade)
 *   - 127 / 127 LoC API cross-references (100% of audit-able entries)
 *   - 133 of 136 interviews LoC-Verified (the rest with a stated reason)
 *
 * Designed to sit inside the existing "About this page" block on
 * /rag-explore. Links out to the full Machine Audit explainer page.
 */

import { Link } from 'react-router-dom';

export default function AuditProvenance() {
  return (
    <section className="mt-8 mb-8 rounded-lg border border-stone-300 bg-white p-5 sm:p-6">
      <header className="mb-4">
        <p className="text-xs text-civil-red-body font-mono uppercase tracking-wide mb-1">
          Why you can trust these passages
        </p>
        <h3 className="text-lg sm:text-xl font-medium text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
          Nine audit passes, ending in line-by-line cross-reference with the Library of Congress
        </h3>
      </header>

      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 list-none p-0">
        <li>
          <div className="text-3xl sm:text-4xl font-medium text-stone-900 tabular-nums" style={{ fontFamily: 'Inter, sans-serif' }}>
            9<span className="text-base text-stone-500 ml-1">passes</span>
          </div>
          <p className="text-xs text-stone-600 mt-1 leading-snug">
            Each transcript passed through nine rounds of audit, phonetic
            alias matching, cross-contamination cleanup, fidelity sweeps,
            adversarial review.
          </p>
        </li>
        <li>
          <div className="text-3xl sm:text-4xl font-medium text-stone-900 tabular-nums" style={{ fontFamily: 'Inter, sans-serif' }}>
            127<span className="text-base text-stone-500 ml-1">/ 127</span>
          </div>
          <p className="text-xs text-stone-600 mt-1 leading-snug">
            LoC API cross-referenced, 100% of audit-able entries.
            92 via TEI2 XML transcripts, 35 via PDF text extraction.
          </p>
        </li>
        <li>
          <div className="text-3xl sm:text-4xl font-medium text-stone-900 tabular-nums" style={{ fontFamily: 'Inter, sans-serif' }}>
            133<span className="text-base text-stone-500 ml-1">/ 136</span>
          </div>
          <p className="text-xs text-stone-600 mt-1 leading-snug">
            Interviews that cleanly aligned to the Library of Congress
            (LoC-Verified). The remaining three carry a stated reason: two
            audio-limited recordings, one where LoC&apos;s edition diverges.
          </p>
        </li>
      </ul>

      <p className="text-sm text-stone-700 max-w-3xl leading-relaxed" style={{ fontFamily: 'Source Serif 4, serif' }}>
        Whisper produces a first-pass transcript with names mis-heard, places
        scrambled, and contractions inserted. Most archives ship those errors;
        we don&apos;t. The final pass (Pass 8) opens each interview&apos;s LoC
        TEI2 XML transcript (or PDF when XML isn&apos;t published) and word-aligns
        it against our text, healing the differences a deterministic verdict
        layer resolves and preserving both readings where our verbatim text and
        LoC&apos;s edited edition legitimately differ. Those 710 documented
        differences are catalogued in full, the transparent record of two
        professional transcription efforts on the same audio.
      </p>

      <p className="mt-4">
        <Link
          to="/machine-audit"
          className="inline-flex items-center gap-1 text-sm font-medium text-civil-red-body hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
        >
          How was this generated? Read the full Machine Audit
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </p>
    </section>
  );
}
