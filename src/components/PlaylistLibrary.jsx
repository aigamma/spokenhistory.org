/**
 * @fileoverview PlaylistLibrary, the "My Playlists" saved list on the Interviews
 * page.
 *
 * The device-local library kept by PlaylistProvider (localStorage). Each saved
 * playlist opens back into the editable panel, can be renamed or deleted, and
 * carries a copy-link so it travels off this device as a bookmark. No login and
 * no backend: a saved playlist lives in this browser and in the links you keep.
 *
 * Renders nothing when the library is empty, so the page stays clean until the
 * reader saves their first playlist.
 */
import { useState } from 'react';
import { FolderOpen, Trash2, Pencil, Check, X } from 'lucide-react';
import { usePlaylist } from '../context/PlaylistProvider';
import { toClipsParam } from '../utils/clipTokens';
import ShareButton from './ShareButton';

function totalLen(clips) {
  const sec = (clips || []).reduce((a, c) => a + Math.max(0, (c.n || 0) - (c.s || 0)), 0);
  const m = Math.round(sec / 60);
  if (m < 1) return 'under a minute';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} hr ${r} min` : `${h} hr`;
}

/**
 * @param {Object} props
 * @param {()=>void} [props.onOpen] Called after a saved playlist is loaded into
 *   the working panel, so the page can scroll the panel into view.
 */
export default function PlaylistLibrary({ onOpen }) {
  const { library, loadIntoWorking, deleteLibraryEntry, renameLibraryEntry } = usePlaylist();
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  if (!library.length) return null;

  const open = (id) => {
    loadIntoWorking(id);
    onOpen?.();
  };

  const startRename = (pl) => {
    setEditingId(pl.id);
    setDraft(pl.title);
  };

  const commitRename = (id) => {
    if (draft.trim()) renameLibraryEntry(id, draft.trim());
    setEditingId(null);
  };

  return (
    <section
      aria-label="My playlists"
      className="mb-6 rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4"
    >
      <h2 className="text-stone-900 dark:text-stone-100 text-sm font-semibold uppercase tracking-wide font-mono mb-1 flex items-center gap-1.5">
        <FolderOpen className="w-4 h-4 text-civil-red-body" aria-hidden="true" /> My Playlists
      </h2>
      <p className="text-xs text-stone-400 mb-3">
        Saved in this browser. Bookmark or copy a link to keep one across devices.
      </p>
      <ul className="list-none p-0 m-0 space-y-1.5">
        {library.map((pl) => (
          <li
            key={pl.id}
            className="flex items-center gap-2 rounded-md border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2"
          >
            {editingId === pl.id ? (
              <>
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(pl.id);
                    else if (e.key === 'Escape') setEditingId(null);
                  }}
                  aria-label={`Rename ${pl.title}`}
                  autoFocus
                  className="flex-1 min-w-0 px-2 py-1 border border-stone-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 focus:border-civil-red-strong focus:outline-none focus:ring-2 focus:ring-red-200"
                />
                <button
                  type="button"
                  onClick={() => commitRename(pl.id)}
                  aria-label="Save name"
                  className="p-1.5 text-emerald-600 hover:bg-stone-100 dark:hover:bg-zinc-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  <Check className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  aria-label="Cancel rename"
                  className="p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => open(pl.id)}
                  className="flex-1 min-w-0 text-left flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded p-1"
                >
                  <FolderOpen className="w-4 h-4 shrink-0 text-stone-400" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                      {pl.title || 'Untitled playlist'}
                    </span>
                    <span className="block text-xs text-stone-500">
                      {pl.clips.length} {pl.clips.length === 1 ? 'clip' : 'clips'} · {totalLen(pl.clips)}
                    </span>
                  </span>
                </button>
                <ShareButton
                  variant="icon"
                  title={pl.title || 'Playlist'}
                  getUrl={() =>
                    `/table-of-contents?clips=${toClipsParam(pl.clips)}${pl.title ? `&title=${encodeURIComponent(pl.title)}` : ''}`
                  }
                />
                <button
                  type="button"
                  onClick={() => startRename(pl)}
                  aria-label={`Rename ${pl.title}`}
                  className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </button>
                {confirmId === pl.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      deleteLibraryEntry(pl.id);
                      setConfirmId(null);
                    }}
                    className="px-2 py-1 text-xs font-medium text-white bg-civil-red-strong rounded hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  >
                    Delete?
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(pl.id)}
                    aria-label={`Delete ${pl.title}`}
                    className="p-1.5 text-stone-400 hover:text-civil-red-body hover:bg-stone-100 dark:hover:bg-zinc-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
