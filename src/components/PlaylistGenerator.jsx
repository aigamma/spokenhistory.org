/**
 * @fileoverview PlaylistGenerator, the "Build a Playlist" controls on the
 * Interviews page.
 *
 * Two ready-made ways to populate the working playlist, alongside favoriting
 * clips by hand as you browse:
 *   - From a TOPIC: pick one of the curated playlists (src/data/archiveThemes.js)
 *     and the page assembles the matching chapters.
 *   - From a loose semantic PHRASE: the page runs a semantic search and assembles
 *     a list of snippets.
 * Either way the result lands in the editable, bookmarkable playlist panel; this
 * component only collects the input and calls back. The data work lives in the
 * Interviews page so it owns the clip index and the retrieval client.
 */
import { useState } from 'react';
import { Sparkles, Search, Loader2 } from 'lucide-react';
import { THEMES } from '../data/archiveThemes';

/**
 * @param {Object} props
 * @param {(query:{topic?:string,keywords?:string}, label:string)=>void} props.onGenerateTopic
 * @param {(phrase:string)=>void} props.onGeneratePhrase
 * @param {boolean} [props.busy]
 * @param {string} [props.error]
 */
export default function PlaylistGenerator({ onGenerateTopic, onGeneratePhrase, busy = false, error = '' }) {
  const [phrase, setPhrase] = useState('');
  const [topicValue, setTopicValue] = useState('');

  const submitPhrase = (e) => {
    e.preventDefault();
    const q = phrase.trim();
    if (q) onGeneratePhrase(q);
  };

  const onTopicChange = (e) => {
    const v = e.target.value;
    setTopicValue(v);
    if (!v) return;
    const [ti, pi] = v.split('.').map(Number);
    const theme = THEMES[ti];
    const pl = theme && theme.playlists[pi];
    if (pl) onGenerateTopic(pl.query, pl.name);
  };

  return (
    <section
      aria-label="Build a playlist"
      className="mb-6 rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4"
    >
      <h2 className="text-stone-900 dark:text-stone-100 text-sm font-semibold uppercase tracking-wide font-mono mb-1 flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-civil-red-body" aria-hidden="true" /> Build a Playlist
      </h2>
      <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
        Generate a ready-made playlist from a topic or a phrase, then bookmark it or edit it below. You can also
        add clips as you browse, using the plus on any chapter.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="pl-topic" className="block text-xs font-medium text-stone-500 mb-1">
            From a topic
          </label>
          <select
            id="pl-topic"
            value={topicValue}
            onChange={onTopicChange}
            disabled={busy}
            className="w-full px-3 py-2 border border-stone-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 focus:border-civil-red-strong focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-50"
          >
            <option value="">Choose a topic...</option>
            {THEMES.map((theme, ti) => (
              <optgroup key={theme.id} label={theme.name}>
                {theme.playlists.map((pl, pi) => (
                  <option key={pl.id} value={`${ti}.${pi}`}>
                    {pl.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pl-phrase" className="block text-xs font-medium text-stone-500 mb-1">
            From a phrase
          </label>
          <form onSubmit={submitPhrase} className="flex gap-2">
            <input
              id="pl-phrase"
              type="search"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              disabled={busy}
              placeholder="e.g. nonviolence as a discipline"
              className="flex-1 min-w-0 px-3 py-2 border border-stone-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 dark:placeholder-zinc-500 focus:border-civil-red-strong focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={busy || !phrase.trim()}
              className="inline-flex items-center gap-1.5 min-h-11 px-3 py-2 rounded-md bg-civil-red-strong text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Search className="w-4 h-4" aria-hidden="true" />}
              {busy ? 'Finding' : 'Generate'}
            </button>
          </form>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-sm text-civil-red-body" role="status">
          {error}
        </p>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {busy ? 'Building playlist' : ''}
      </span>
    </section>
  );
}
