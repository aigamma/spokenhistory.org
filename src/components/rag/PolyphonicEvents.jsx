/**
 * @fileoverview PolyphonicEvents — pre-computed event pages with multiple
 * first-person accounts of the same canonical event.
 *
 * Loads /rag/summaries/events/_index.json + per-event detail JSONs. No
 * live retrieval — every passage is pre-computed at build time by
 * rag/precompute_panels.mjs. Zero per-request cost.
 *
 * This is the conference's headline demo: click an event, watch six
 * different voices' accounts of the same moment appear side-by-side.
 * The pre-computed retrieval (no LLM, no chatbot) demonstrates the
 * embedding's understanding viscerally.
 */

import { useEffect, useState } from 'react';
import { ExternalLink, Clock } from 'lucide-react';
import { TIER_BADGE } from './tiers';

function formatTimestamp(seconds) {
  if (seconds == null) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function PolyphonicEvents() {
  const [index, setIndex] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [event, setEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/summaries/events/_index.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('index not found'))))
      .then((j) => {
        if (cancelled) return;
        setIndex(j);
        if (j.events?.length && !selectedSlug) setSelectedSlug(j.events[0].slug);
      })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedSlug) return undefined;
    let cancelled = false;
    setLoadingEvent(true);
    setEvent(null);
    fetch(`/rag/summaries/events/${selectedSlug}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('event not found'))))
      .then((j) => { if (!cancelled) setEvent(j); })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); })
      .finally(() => { if (!cancelled) setLoadingEvent(false); });
    return () => { cancelled = true; };
  }, [selectedSlug]);

  if (error) {
    return (
      <div className="text-sm text-stone-500 p-4">
        Event index not yet generated. Run <code className="font-mono">node --env-file=rag/.env.local rag/precompute_panels.mjs events</code> from the repo root.
      </div>
    );
  }

  if (!index) {
    return (
      <div className="text-sm text-stone-500 p-4" role="status" aria-live="polite">
        Loading event index…
      </div>
    );
  }

  return (
    <div className="rag-polyphonic-events">
      <p className="text-sm text-stone-600 mb-6 max-w-2xl">
        Each event below is reported in the newspapers. But what did the witnesses say? Click an event to see the embedding-retrieved passages from <strong>multiple interviewees</strong> — each grounded to the exact second in the original LoC audio.
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {index.events.map((ev) => (
          <button
            key={ev.slug}
            type="button"
            onClick={() => setSelectedSlug(ev.slug)}
            aria-pressed={ev.slug === selectedSlug}
            className={
              'px-3 py-2 text-sm rounded-md border transition-colors ' +
              (ev.slug === selectedSlug
                ? 'border-red-700 bg-red-50 text-stone-900 font-medium'
                : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400')
            }
            style={{ fontFamily: 'Chivo Mono, monospace' }}
          >
            <span className="block">{ev.title}</span>
            <span className="block text-xs text-stone-500 font-normal">{ev.date_range}</span>
          </button>
        ))}
      </div>

      {loadingEvent && (
        <div className="text-sm text-stone-500" role="status" aria-live="polite">Loading event…</div>
      )}

      {event && !loadingEvent && (
        <article className="space-y-6">
          <header>
            <h3 className="text-2xl font-medium text-stone-900 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              {event.title}
            </h3>
            <p className="text-sm text-stone-600 mb-3" style={{ fontFamily: 'Chivo Mono, monospace' }}>
              {event.date_range} · {event.passages?.length || 0} voices · embedding-retrieved
            </p>
            <p className="text-stone-700 max-w-3xl" style={{ fontFamily: 'Source Serif 4, serif' }}>
              {event.blurb}
            </p>
          </header>

          <div className="space-y-4">
            {event.passages.map((p, idx) => (
              <EventPassage key={`${p.entry_number}-${idx}`} passage={p} />
            ))}
          </div>

          <footer className="text-xs text-stone-500 border-t border-stone-200 pt-4">
            <p>
              Retrieved via Voyage-3 embedding + Pinecone hybrid search + Voyage rerank-2 against the live <code className="font-mono">civil-rights</code> index. Pre-computed at build time; zero per-request cost. Search query used: <em>&ldquo;{event.query}&rdquo;</em>
            </p>
          </footer>
        </article>
      )}
    </div>
  );
}

function EventPassage({ passage }) {
  const tierKey = passage.uncertainty_tier in TIER_BADGE ? passage.uncertainty_tier : null;
  const badge = tierKey ? TIER_BADGE[tierKey] : null;
  const ts = formatTimestamp(passage.timestamp_start_seconds);

  return (
    <article className="border border-stone-200 rounded-lg bg-white p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <div>
          <h4 className="text-lg font-medium text-stone-900">
            {passage.entry_subject || `Entry #${passage.entry_number}`}
          </h4>
          <p className="text-xs text-stone-500">Entry #{passage.entry_number}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-stone-500 tabular-nums">
          {passage.rerank_score != null && (
            <span>rerank {(passage.rerank_score * 100).toFixed(0)}%</span>
          )}
          {badge && (
            <span className={`px-2 py-0.5 rounded-full border ${badge.bg} ${badge.border} ${badge.text}`}>
              {badge.label}
            </span>
          )}
        </div>
      </header>

      <blockquote className="border-l-4 border-red-700 pl-4 py-1 mb-3 text-stone-800 italic text-sm">
        &ldquo;{passage.text_preview}&rdquo;
      </blockquote>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-700">
        {ts && (
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            {ts}
          </span>
        )}
        {passage.loc_item_url && (
          <a
            href={passage.loc_item_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-civil-red-body hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            LoC catalog
          </a>
        )}
      </div>
    </article>
  );
}
