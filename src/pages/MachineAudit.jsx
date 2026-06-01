import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Info, ArrowLeft, FileText, Scale, Library, AlertCircle, Mail } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Footer from '../components/common/Footer';
import { TIER_BADGE, TIER_VOCABULARY, fidelityNoteFor } from '../components/rag/tiers';

/**
 * MachineAudit, the /machine-audit route.
 *
 * Dustin (2026-05-30) asked to "develop the Machine Audit concept
 * further": a Machine Audit indicator should open a page explaining how
 * the AI metadata was generated, where uncertainty exists, and how a
 * reader can send a correction. This is that page. Every audit-tier
 * badge across the site can link here (the badge is the indicator; this
 * is the explanation).
 *
 * Live corpus + tier counts are read from /rag/constellation.json so the
 * numbers never go stale as the corpus changes. The explanatory prose is
 * grounded only in true facts about this pipeline (the 7 steps, the 90/90
 * dual-scorer gate, the Pass 8 Library of Congress cross-reference, the
 * settled audit states). Feedback routes through a mailto link, which
 * works without a populated Firestore.
 */

const PIPELINE_STEPS = [
  {
    n: 1,
    name: 'Blocking',
    body: 'The corrected transcript is parsed from its subtitle file into timed segments, then grouped into larger text blocks. Each block keeps the start and end timestamps of the speech it covers, so every downstream label stays anchored to a real moment in the recording.',
  },
  {
    n: 2,
    name: 'Topic Labeling',
    body: 'Each block is assigned a main topic and subtopics from a fixed civil-rights vocabulary (voting and legal rights, organizations and movement networks, violence and state repression, integration and everyday segregation, historical figures and turning points).',
  },
  {
    n: 3,
    name: 'Building the Table of Contents',
    body: 'Neighboring blocks that share a topic are merged into table-of-contents entries, so the interview reads as a sequence of coherent subjects rather than a flat list of segments.',
  },
  {
    n: 4,
    name: 'Chapterization',
    body: 'Natural topic transitions are detected and turned into chapters, each with a title, a time range, and keywords. Chapters are how a reader jumps straight to a specific story inside a long interview.',
  },
  {
    n: 5,
    name: 'Summarization',
    body: 'A main summary and per-chapter summaries are generated, each carrying key themes and a note on historical significance. Summaries are written to point back to the testimony, not to replace it.',
  },
  {
    n: 6,
    name: 'Tuning',
    body: 'Every summary is scored for accuracy and quality against a standardized rubric and regenerated until it clears the bar. Low-scoring drafts are rewritten rather than shipped.',
  },
  {
    n: 7,
    name: 'Engagement Scoring',
    body: 'A final pass rates narrative qualities so the most vivid moments can be surfaced first, without changing any of the underlying facts.',
  },
];

const UNCERTAINTY_NOTES = [
  {
    title: 'Speech Recognition Errors',
    body: 'The first-pass transcript comes from automatic speech recognition, which mishears names, places, and unfamiliar terms. The audit layer catches the failure patterns we have seen, but a novel mishearing in a future transcript can still slip through until it is reviewed.',
  },
  {
    title: 'Ground-Truth Coverage',
    body: 'Accuracy scoring is grounded in a corpus of verified facts that is strongest for nationally known leaders, organizations, events, and legal precedents. Claims about lesser-known local figures or events are supported by the transcript itself but are harder to corroborate against an external record.',
  },
  {
    title: 'Paraphrase and Emphasis',
    body: 'The citation auditor checks that each factual claim in a summary is supported by a passage in the transcript. A faithful paraphrase can still shift emphasis or tone, which is one reason every summary links back to the recording it describes.',
  },
  {
    title: 'Two Transcription Efforts',
    body: 'The Library of Congress publishes its own lightly edited transcript. Where its edition and our verbatim text differ, both readings are preserved in the audit record rather than one being silently chosen over the other.',
  },
];

export default function MachineAudit() {
  useDocumentTitle('How Machine Audit Works');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/constellation.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json?.points) return;
        const tiers = {};
        for (const p of json.points) {
          const t = p.uncertainty_tier || 'unknown';
          tiers[t] = (tiers[t] || 0) + 1;
        }
        setStats({ interviews: json.points.length, tiers });
      })
      .catch(() => { /* page still renders without live counts */ });
    return () => { cancelled = true; };
  }, []);

  // Group the raw tier counts into the three settled states the badge
  // vocabulary uses (LoC-Verified / Audited / Audio-Limited Source), so
  // the legend matches what readers see on every citation card.
  const settledStates = (() => {
    if (!stats) return null;
    const acc = {};
    for (const key of TIER_VOCABULARY) {
      const n = stats.tiers[key] || 0;
      if (n === 0) continue;
      const badge = TIER_BADGE[key];
      const note = fidelityNoteFor(null, key);
      if (!acc[badge.label]) acc[badge.label] = { label: badge.label, count: 0, badge, note };
      acc[badge.label].count += n;
    }
    return Object.values(acc);
  })();

  return (
    <div className="min-h-screen bg-[#EBEAE9] dark:bg-zinc-900">
      <main id="main-content" tabIndex={-1} className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-12 focus:outline-none">
        <Link
          to="/rag-explore"
          className="inline-flex items-center gap-1 text-sm text-civil-red-body hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded mb-6"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Explore the Interview Data
        </Link>

        <header className="mb-10">
          <p className="text-civil-red-body text-sm font-light font-mono mb-2">
            Civil Rights History Project · Machine Audit
          </p>
          <h1
            className="text-stone-900 text-3xl sm:text-4xl font-medium mb-4 leading-tight"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            How Machine Audit Works
          </h1>
          <p
            className="text-stone-700 text-base sm:text-lg max-w-2xl"
            style={{ fontFamily: 'Source Serif 4, serif' }}
          >
            Every summary, chapter, topic, and connection on this site is generated by AI
            and then checked. This page explains how that metadata is produced, how it is
            held to a publication standard, where uncertainty remains, and how you can
            send a correction.
          </p>
          {stats && (
            <p className="mt-4 text-sm text-stone-600">
              Currently published:{' '}
              <span className="font-medium text-stone-900 tabular-nums">{stats.interviews}</span>{' '}
              interviews, each one cross-referenced against the Library of Congress.
            </p>
          )}
        </header>

        <section className="mb-10">
          <h2 className="text-stone-900 text-2xl font-medium mb-3 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            <FileText className="w-5 h-5 text-civil-red-strong" aria-hidden="true" />
            The Problem This Solves
          </h2>
          <p className="text-stone-800 text-base leading-relaxed" style={{ fontFamily: 'Source Serif 4, serif' }}>
            A first-pass machine transcript of a six-hour oral history will mishear names,
            scramble places, and invent tidy phrasing the speaker never used. The Smithsonian
            and the Library of Congress hold this collection to a high bar for accuracy. The
            audit described below is what happens to every interview after the first machine
            transcript, so that the summaries and connections you read can be trusted to point
            back to what was actually said.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-stone-900 text-2xl font-medium mb-4 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            <Scale className="w-5 h-5 text-civil-red-strong" aria-hidden="true" />
            The Seven-Step Pipeline
          </h2>
          <ol className="space-y-4 list-none p-0">
            {PIPELINE_STEPS.map((s) => (
              <li key={s.n} className="border border-stone-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 p-4">
                <h3 className="text-base font-medium text-stone-900 mb-1">
                  <span className="text-civil-red-body font-mono mr-2 text-sm tabular-nums">{String(s.n).padStart(2, '0')}</span>
                  {s.name}
                </h3>
                <p className="text-sm text-stone-700 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-stone-900 text-2xl font-medium mb-3 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            <ShieldCheck className="w-5 h-5 text-civil-red-strong" aria-hidden="true" />
            The Publication Gate
          </h2>
          <p className="text-stone-800 text-base leading-relaxed mb-4" style={{ fontFamily: 'Source Serif 4, serif' }}>
            A summary is not published just because it was generated. It has to clear an
            independent, fail-closed gate first.
          </p>
          <ul className="space-y-3 text-sm text-stone-700 list-none p-0">
            <li className="flex gap-2">
              <span className="text-civil-red-strong font-bold" aria-hidden="true">1.</span>
              <span>
                <span className="font-medium text-stone-900">Two independent scorers.</span> One model from
                OpenAI and one from Anthropic (Claude) each score the summary for accuracy and quality on a
                shared rubric. They are different model families, so a blind spot in one is unlikely to be
                shared by the other. Both must score 90 or higher on both dimensions.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-civil-red-strong font-bold" aria-hidden="true">2.</span>
              <span>
                <span className="font-medium text-stone-900">A per-claim citation audit.</span> Every factual
                claim in the summary has to map to a passage in the transcript that establishes it. Claims that
                cannot be traced to the testimony are flagged.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-civil-red-strong font-bold" aria-hidden="true">3.</span>
              <span>
                <span className="font-medium text-stone-900">Fail closed, not open.</span> If the two scorers
                disagree, or a claim cannot be sourced, the summary is sent to a human review queue rather than
                published on a coin flip. The default is to hold, not to ship.
              </span>
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-stone-900 text-2xl font-medium mb-3 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            <Library className="w-5 h-5 text-civil-red-strong" aria-hidden="true" />
            The Library of Congress Cross-Reference
          </h2>
          <p className="text-stone-800 text-base leading-relaxed mb-4" style={{ fontFamily: 'Source Serif 4, serif' }}>
            The final and strongest check lines each interview up against the Library of Congress's own
            published transcript, word by word. Where the recognition pass and the Library of Congress text
            disagree, clean recognition errors are healed automatically inside the existing timestamps, and
            anything ambiguous is preserved for a human to review. The healing never silently overturns a
            decision an earlier audit pass had already made.
          </p>
          <p className="text-stone-800 text-base leading-relaxed" style={{ fontFamily: 'Source Serif 4, serif' }}>
            Every audit-able interview in the collection was reconciled this way, most against the Library of
            Congress machine-readable transcript and the rest against the text extracted from its published
            transcript. The full record of where the two professional transcription efforts differ is kept as
            a transparent, reviewable catalog rather than hidden.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-stone-900 text-2xl font-medium mb-4 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            <ShieldCheck className="w-5 h-5 text-civil-red-strong" aria-hidden="true" />
            What the Audit States Mean
          </h2>
          <p className="text-stone-800 text-base leading-relaxed mb-4" style={{ fontFamily: 'Source Serif 4, serif' }}>
            Every interview on the site is finished and cross-referenced. The badge on a citation states which
            of three settled states the transcript is in. It describes what the transcript is, never a task the
            reader has to perform.
          </p>
          <div className="space-y-3">
            {(settledStates || [
              { label: 'LoC-Verified', badge: TIER_BADGE['high'], note: fidelityNoteFor(null, 'high'), count: null },
              { label: 'Audio-Limited Source', badge: TIER_BADGE['not-auditable'], note: fidelityNoteFor(null, 'not-auditable'), count: null },
            ]).map(({ label, badge, note, count }) => {
              const BadgeIcon = badge.icon;
              return (
                <div key={label} className={`flex items-start gap-3 rounded-lg border p-4 ${badge.bg} ${badge.border}`}>
                  <BadgeIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${badge.text}`} aria-hidden="true" />
                  <div>
                    <div className={`text-sm font-semibold uppercase tracking-wide mb-1 ${badge.text}`}>
                      {label}
                      {count != null && <span className="ml-2 font-normal tabular-nums">{count} interviews</span>}
                    </div>
                    <p className={`text-sm leading-snug ${badge.text}`}>{note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-stone-900 text-2xl font-medium mb-3 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            <AlertCircle className="w-5 h-5 text-civil-red-strong" aria-hidden="true" />
            Where Uncertainty Remains
          </h2>
          <p className="text-stone-800 text-base leading-relaxed mb-4" style={{ fontFamily: 'Source Serif 4, serif' }}>
            The audit reduces error; it does not claim to eliminate it. These are the places where judgment is
            still required, stated plainly.
          </p>
          <div className="space-y-4">
            {UNCERTAINTY_NOTES.map((u) => (
              <div key={u.title} className="border-l-2 border-stone-300 dark:border-zinc-600 pl-4">
                <h3 className="text-base font-medium text-stone-900 mb-1">{u.title}</h3>
                <p className="text-sm text-stone-700 leading-relaxed">{u.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 border-t border-stone-300 pt-8">
          <h2 className="text-stone-900 text-2xl font-medium mb-3 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            <Mail className="w-5 h-5 text-civil-red-strong" aria-hidden="true" />
            Found Something to Correct?
          </h2>
          <p className="text-stone-800 text-base leading-relaxed mb-4" style={{ fontFamily: 'Source Serif 4, serif' }}>
            If a name, date, place, or summary looks wrong, the audit team wants to know. Corrections from
            researchers and from the people in these interviews and their families are one of the most valuable
            inputs we have.
          </p>
          <a
            href="mailto:support@aigamma.com?subject=Civil%20Rights%20History%20Project%3A%20metadata%20correction&body=Interview%20or%20page%3A%20%0AWhat%20looks%20wrong%3A%20%0AThe%20correction%3A%20%0ASource%20(optional)%3A%20"
            className="inline-flex items-center gap-2 min-h-11 px-4 py-2 rounded-md bg-civil-red-strong text-white text-sm font-medium hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            <Mail className="w-4 h-4" aria-hidden="true" />
            Send a Correction
          </a>
        </section>

        <nav aria-label="Related pages" className="text-sm text-stone-600 border-t border-stone-200 pt-6">
          <p className="mb-2 font-medium text-stone-900">See Also</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 list-none p-0">
            <li><Link to="/interview-index" className="text-civil-red-body hover:underline">Browse the Interviews</Link></li>
            <li><Link to="/people" className="text-civil-red-body hover:underline">People Catalog</Link></li>
            <li><Link to="/rag-explore" className="text-civil-red-body hover:underline">Explore the Interview Data</Link></li>
          </ul>
        </nav>
      </main>
      <Footer />
    </div>
  );
}
