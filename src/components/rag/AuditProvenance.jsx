/**
 * @fileoverview AuditProvenance, a single quiet line linking to the full
 * Machine Audit explainer.
 *
 * This used to render a large "Why you can trust these passages" block: an
 * eyebrow + heading, three big stat callouts (9 passes / 127-127 LoC cross-
 * references / 133-of-136 LoC-Verified), and a paragraph on the Whisper to
 * Pass-8 healing. Eric cut it to just the link on 2026-06-03, for three
 * reasons:
 *   - The same detail already lives on /machine-audit (the link target),
 *     which renders LIVE audit counts, so the inline copy was a duplicate.
 *   - The /rag-explore page-top <header> already carries the headline corpus
 *     stats + tier badges, so this bottom block was a second pass at the same
 *     credentialing job.
 *   - The inline numbers had gone stale (the corpus grew to 140; this block
 *     still read 136), which is exactly the kind of drift a no-errors site
 *     should not ship. Keeping the figures in one live place avoids it.
 *
 * The credibility story now lives in one place, one click away, instead of
 * being restated (and quietly going out of date) here.
 */

import { Link } from 'react-router-dom';

export default function AuditProvenance() {
  return (
    <p className="mt-6">
      <Link
        to="/machine-audit"
        className="inline-flex items-center gap-1 text-sm font-medium text-civil-red-body hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
      >
        How was this generated? Read the full Machine Audit
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </p>
  );
}
