/**
 * @fileoverview QuoteOfTheDay — daily rotating quote widget.
 *
 * Loads /rag/summaries/quotes.json and picks one quote based on the
 * day-of-year, so every user sees the same quote on the same day.
 * Pre-curated; static; no LLM call per request.
 */

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / 86400000);
}

export default function QuoteOfTheDay({ allowCycle = true }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/rag/summaries/quotes.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e.message || 'failed'); });
    return () => { cancelled = true; };
  }, []);

  if (error) return null;
  if (!data) return null;
  const quotes = data.quotes || [];
  if (quotes.length === 0) return null;

  const idx = (dayOfYear() + offset) % quotes.length;
  const q = quotes[idx];

  return (
    <aside className="rag-quote-of-day border border-stone-200 rounded-lg bg-white p-5">
      <header className="flex items-center justify-between mb-3">
        <p className="text-xs text-civil-red-body font-mono">QUOTE OF THE DAY</p>
        {allowCycle && (
          <button
            type="button"
            onClick={() => setOffset((o) => o + 1)}
            className="text-xs text-stone-500 hover:text-stone-900"
          >
            Next →
          </button>
        )}
      </header>
      <blockquote className="border-l-4 border-red-700 pl-4 py-1 mb-3 text-stone-800 italic" style={{ fontFamily: 'Source Serif 4, serif' }}>
        &ldquo;{q.quote}&rdquo;
      </blockquote>
      <footer className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-stone-700">
        <div>
          <span className="font-medium">{q.entry_subject}</span>
          {q.context && <span className="text-stone-500 italic"> · {q.context}</span>}
        </div>
        {q.loc_item_url && (
          <a href={q.loc_item_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-civil-red-body hover:underline">
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            LoC
          </a>
        )}
      </footer>
    </aside>
  );
}
