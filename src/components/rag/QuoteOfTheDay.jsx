/**
 * @fileoverview QuoteOfTheDay — daily rotating quote widget.
 *
 * Loads /rag/summaries/quotes.json and picks one quote based on the
 * day-of-year, so every user sees the same quote on the same day.
 * Pre-curated; static; no LLM call per request.
 */

import { useEffect, useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';

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
      <header className="flex items-start justify-between gap-3 mb-3">
        <h3
          className="text-stone-900 text-lg sm:text-xl font-medium leading-tight"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {q.headline || q.entry_subject}
        </h3>
        <div className="flex items-center gap-2 flex-shrink-0">
          <CopyCitationButton quote={q} />
          {allowCycle && (
            <button
              type="button"
              onClick={() => setOffset((o) => o + 1)}
              className="text-xs text-stone-500 hover:text-stone-900"
            >
              Next →
            </button>
          )}
        </div>
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

/**
 * CopyCitationButton — copies the quote + speaker + LoC URL to the
 * clipboard as a single formatted block. Educators and researchers
 * lifting the quote into their own work get attribution for free.
 *
 * Format:
 *   "{quote}"
 *   — {entry_subject}, Civil Rights History Project.
 *   {loc_item_url}
 */
function CopyCitationButton({ quote }) {
  const [copied, setCopied] = useState(false);
  const handleClick = async () => {
    const parts = [
      `“${quote.quote}”`,
      `— ${quote.entry_subject}, Civil Rights History Project.`,
    ];
    if (quote.context) parts.push(quote.context);
    if (quote.loc_item_url) parts.push(quote.loc_item_url);
    const text = parts.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error('[QuoteOfTheDay] clipboard write failed:', e);
    }
  };
  const Icon = copied ? Check : Copy;
  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 px-2 py-1 rounded border border-transparent hover:border-stone-300 transition-colors"
      aria-label={copied ? 'Citation copied to clipboard' : 'Copy quote with citation'}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {copied ? 'Copied' : 'Copy citation'}
    </button>
  );
}
