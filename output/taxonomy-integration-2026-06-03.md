# Topics Taxonomy Integration (2026-06-03)

Decision log for integrating the academic director's 13-theme, ~98-sub-topic
curatorial taxonomy into the Topics page and the playlist layer, plus a record of
which program-manager (Dustin) requests were already shipped. Authored for the
directors and for the next agent (this report lives in the repo so it survives a
local re-image; the working plan file under `~/.claude/plans/` does not).

## What shipped

- **`src/data/archiveThemes.js`** rewritten from 6 themes / 18 playlists to the
  director's **13 themes / 95 sub-topic playlists**, schema and exports unchanged
  (`playlistHref`, `findPlaylist`, `relatedPlaylists`, `allPlaylists`), so the
  Topics page and the playlist page's Related Playlists kept working with no other
  edits. Each node carries the director's title (Title Case) and description
  (verbatim, em-dash-free) plus a hand-tuned, coverage-verified `query`.
- **`src/pages/TopicGlossary.jsx`**: progressive disclosure. Each theme opens with
  its first 4 playlists and a "Show all N playlists" expander; an active search
  expands all matches. Theme descriptions and the Contents jump-nav (now 13
  entries) render as before.
- **`scripts/check_theme_coverage.mjs`**: a coverage gate that imports the taxonomy
  and asserts every query resolves to clips in `public/rag/playlist_index.json`
  using `StaticPlaylist`'s exact match logic. Run `node scripts/check_theme_coverage.mjs`.
- **No data rebuild.** All 95 queries hit the existing `playlist_index.json` (4,932
  clips across 140 interviews). `build_playlist_index.py` did not need to run.

## Themes, ordered by corpus coverage (distinct clips each surfaces)

Per the director's instruction to order by coverage, most-covered first:

1. Family, Faith, Culture, and Community (1179)
2. Organizations, Leadership, and Strategic Debate (1167)
3. Voting, Law, and Political Power (1113)
4. Violence, Repression, and Resistance (870)
5. Education, Schools, and Student Formation (759)
6. Major Campaigns, Places, and Turning Points (619)
7. Direct Action, Protest, and Nonviolence (573)
8. Life History and Political Awakening (504)
9. Segregation and Everyday Life (423)
10. Economic Justice, Labor, and Movement Sustainability (352)
11. Media, Visibility, and Public Opinion (311)
12. Grassroots Organizing and Movement Infrastructure (310)
13. Memory, Legacy, and Ongoing Struggles (145)

The full theme to sub-topic to query map is the data in `src/data/archiveThemes.js`.
Smallest live playlists: CORE (4), Black Lives Matter (4), Logistics and Movement
Support (6), Unfinished Work (7), Community Infrastructure (10). All 95 pass the
gate at the 3-clip minimum.

## Query precision

The coverage probe found a non-empty anchor for 96 of 98 sub-topics, but several
best-match anchors were too broad or substring-contaminated and were hand-tuned:

- Avoided substring contamination: `bus` (matches "business") became `buses`;
  `office` (matches "officer") became `elected`; `young` became `came of age`;
  `still` became `unfinished`; `story` (matches "history") became `stories`.
- `CORE` is the one unavoidable compromise. As a substring, `core` matches
  "score", "encore", "hardcore" (128 noisy hits), so the playlist uses the clean
  full name `congress of racial equality` (4 clips). It undersells CORE's reach;
  the fix is the deferred per-clip semantic tagging, or a future word-boundary
  keyword match in `StaticPlaylist`.

## Three sub-topics folded (no clean corpus anchor)

The director's taxonomy includes three concepts the 1960s-veteran interviews do not
express in keyword-findable language. Rather than ship near-empty or misleading
playlists, their ideas are carried in the prose of their nearest sibling/theme:

- **The Politics of Visibility** and **Narrative Framing and Public Opinion** (both
  Theme 11): folded into the Theme 11 description and the "Protest as Public
  Spectacle" and "Newspapers and Movement Narratives" blurbs. Theme 11 ships 5
  playlists.
- **Environmental Justice** (Theme 13): folded into the "Unfinished Work" blurb.
  Theme 13 ships 7 playlists.

Net: 95 live playlists; all 98 source concepts are represented (3 in sibling prose).
This is the "broaden or fold the thin ones" path the approved plan authorized.

## What was deliberately NOT done (and why)

- **Did not rebuild the program manager's playlist UX, because it already shipped**
  (his notes are dated 2026-06-01; the work landed 2026-06-02/03). Evidence:
  - Playlists no longer lead with Aaron Dixon: `StaticPlaylist.jsx` `curatedOrder`
    (groups by interviewee, orders by clip count) at lines 73-86.
  - Featured/"choice" clips at the top: `featuredIndices` at lines 283-295.
  - Clips clustered by person with portraits: group headers at lines 714-733.
  - Latency-safe per-clip progress bar: lines 774-780.
  - Topics link straight to a playlist (not the data page): `TopicGlossary.jsx`
    uses `playlistHref` (line ~190); no `/rag-explore` links on the page.
  - People-page snippets auto-open as video clips: `HearInContext` `defaultOpen`
    passed at `PersonPage.jsx:203`.
- **Did not add per-topic data visualizations to the playlist page.** The program
  manager explicitly de-scoped this ("forget about putting the data visualizations
  on that page"); the text-only "About This Playlist" block already captures what
  he kept.
- **Did not rename the Topics page.** The program manager mused about "Table of
  Contents"; the page was set to "Topics" on 2026-06-03 by Eric. Naming stays Eric's
  call.
- **Did not merge the People and Interview pages.** The program manager called this
  a multi-day, large redistribution and explicitly deferred it.
- **Did not build the semantic per-clip theme-tagging precompute.** Keyword queries
  cover 95/98 cleanly and ship for the London conference. The precompute (a
  `theme_index.json` built from Pinecone) is the precision upgrade and enables
  in-playlist sub-theme grouping; it is deferred.

## Flagged for the directors (not changed here)

- **Interviewer name inconsistency: "David Cline" vs "David Klein."** Both spellings
  appear across `public/rag/summaries/pipeline_output/*.json` (for example
  `entry_35.json` reads "David Klein"; other entries read "Cline"). For the
  Smithsonian / Library of Congress publication bar the interviewer attribution
  should be one canonical spelling. Recommend confirming the canonical spelling with
  the directors, then a one-pass normalization across the pipeline outputs and
  person pages. Not bundled into this taxonomy work.

## Link stability

The previous 18 playlists' query strings still resolve to clips (the playlist page
handles any `?topic` / `?keywords`), so old deep links keep working; only the
book's labels changed. A few old labels (for example "Military Service") have no
home in the new taxonomy; their links still play clips, they just no longer appear
as a named playlist.

## Verification

- Coverage gate: `node scripts/check_theme_coverage.mjs` -> 95 playlists, 0
  failures at the 3-clip minimum.
- Build-graph proxy (local `vite build` segfaults; see CLAUDE.md): per-file esbuild
  parse of both changed files (exit 0) and the whole-app `src/main.jsx` import graph
  (resolved in ~156ms, exit 0).
- Writing rules: zero em dashes in the changed files; Title Case on every theme and
  sub-topic name.
- Deploy gate: the Netlify Linux build on push remains the real build gate.

## Future / deferred

- Semantic per-clip theme tagging (`theme_index.json`) for precision and in-playlist
  sub-theme grouping; would also let CORE and similar acronyms match cleanly.
- Unify this taxonomy as the site-wide topic vocabulary (essay `topics.json`, the
  command-palette topic group, Firestore `events_and_topics`).
- Optional legacy `?label=` alias map if zero deep-link degradation is wanted.
