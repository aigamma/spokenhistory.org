# ESLint Cleanup Changelog, 2026-06-01

A focused pass over the root ESLint debt that CI has carried disabled since
commit d2b4114 (see `.github/workflows/ci.yml`: "Re-enable the step after the
upstream lint debt is addressed in a focused cleanup pass"). This is that pass.

Only safe, mechanical fixes were applied. Behavioral, structural, and
dead-code-excision findings were deliberately left in place and are itemized
under "Deferred" below so a reviewer knows exactly what remains and why.

## Result

| Metric | Before | After | Fixed |
|---|---|---|---|
| ESLint errors | 194 | 51 | 143 |
| ESLint warnings | 27 | 27 | 0 (all deferred) |

Command: `npm run lint` (i.e. `eslint . --ext js,jsx`). Root config:
`.eslintrc.cjs`; scan scope is `src/`, `scripts/`, `rag/`, `netlify/` (it
ignores `functions/`, `mcp-server/`, `dist/`, `node_modules/` per
`.eslintignore`).

Rules cleared to zero: `no-dupe-keys`, `no-useless-escape`,
`react/no-unescaped-entities`, `react-hooks/rules-of-hooks`.
`no-unused-vars` went 106 to 34.

Every change is confined to `src/`. The pre-existing modification to
`output/site-improvements-report-2026-05-30.md` (already dirty at the start of
this session) is unrelated to this pass and was not touched.

## How To Revert

All changes from this pass live in the working tree under `src/` and are
uncommitted. The pre-existing `output/*.md` edit is the only non-`src/` dirty
file, so reverting `src/` reverts exactly this pass and nothing else.

- Revert the entire pass: `git checkout -- src/`
- Revert one file: `git checkout -- <path>` (every file is listed below)
- Inspect any single change: `git diff <path>`

The git diff is the authoritative line-level record. The categories below map
each rule to the files it touched.

## Fixes Applied

### 1. `no-dupe-keys` (1 error, real bug)

- `src/services/collectionMapper.js`: removed the duplicate
  `mainSummary: data.mainSummary` key in the legacy `interviewSummaries`
  branch of `mapInterviewData`. A later key in the same object literal,
  `mainSummary: data.summary || data.mainSummary || ''`, was already
  overriding it (JS keeps the last duplicate), and that later value falls
  back to `data.mainSummary`, so removing the earlier key is
  behavior-preserving. The intended behavior is documented in the comment
  block directly above the surviving key.

### 2. `no-useless-escape` (9 errors)

Regex character-class simplifications. Inside a `[...]` class, `[` and `/`
are literal and do not need a backslash, so the escapes were redundant. The
matched-character set is unchanged in every case.

- `/[\[\]]/g` to `/[[\]]/g` (8 occurrences across):
  - `src/services/collectionMapper.js` (3)
  - `src/utils/timeUtils.js` (1)
  - `src/pages/ClipPlayer.jsx` (1)
  - `src/pages/InterviewPlayer.jsx` (3)
- `src/components/visualization/MapVisualization.jsx`: the YouTube-ID regex
  character class `[^\/\n\s]` to `[^/\n\s]` (1). The other `\/` escapes on
  that line are outside the class and were correctly left intact.

### 3. `no-unused-vars` (72 errors)

#### 3a. Unused imports removed

Default `React` import (not needed under the automatic JSX runtime that this
project's `.eslintrc.cjs` declares via `plugin:react/jsx-runtime` and that
`@vitejs/plugin-react` compiles to): `src/components/IntegratedTimeline.jsx`,
`src/components/MetadataPanel.jsx`, `src/components/VideoPanel.jsx`,
`src/components/VideoPlayer.jsx`,
`src/components/visualization/ReactGlobeGLComponent.jsx`,
`src/components/visualization/TimelineVisualization.jsx`,
`src/pages/About.jsx`, `src/pages/ClipPlayer.jsx`,
`src/pages/InterviewPlayer.jsx`, `src/pages/PlaylistBuilder.jsx`.
(`src/main.jsx` and `src/components/ErrorBoundary.jsx` keep their `React`
import; they reference it directly and were not flagged.)

Unused named imports removed:
- `ExternalLink` (from `lucide-react`): `src/pages/InterviewDetail.jsx`,
  `src/pages/PersonPage.jsx`, `src/components/rag/CitationCard.jsx`,
  `src/components/rag/GeographicAtlas.jsx`,
  `src/components/rag/FamousNames.jsx`, `src/components/rag/InterviewMap.jsx`,
  `src/components/rag/InfluenceList.jsx`, `src/components/rag/PassageMap.jsx`,
  `src/components/rag/PolyphonicEvents.jsx`,
  `src/components/rag/NomicProjection.jsx`,
  `src/components/rag/QuoteOfTheDay.jsx`.
- `App.jsx`: removed the unrouted `PlaylistBuilder` page import (the route now
  renders `StaticPlaylist`; see the comment block on that route).
- `MetadataPanel.jsx`: `collection` (from `firebase/firestore`).
- `VideoPlayer.jsx`: `convertTimestampToSeconds`, `extractStartTimestamp`.
- `Constellation.jsx`: `Search as SearchIcon`, `X` (whole `lucide-react` line).
- `VectorSearchOverlay.jsx`: `Search as SearchIcon`.
- `SemanticSearch.jsx`: `useMemo`.
- `TimelineVisualization.jsx`: `useCallback` (with `React`).
- `About.jsx`: `Link` (from `react-router-dom`).
- `MachineAudit.jsx`: `Info`.
- `PlaylistEditor.jsx`: `collection`, `getDocs`, `getDoc`.
- `embeddings.js`: `addDoc`, `doc`, `getDoc`.
- `firebase.js`: `where` (from `firebase/firestore`) and `normalizeDocumentId`
  (from `collectionMapper`).
- `topicVectorSearch.js`: `query`, `where`.
- `Visualizations.jsx`: `useAuth` import removed as a cascade of 3c below
  (its only consumer was the removed `const { user } = useAuth()`).

#### 3b. Unused pure-arithmetic locals in connector SVG components

These are intermediate elbow/point coordinate `const`s that were computed but
never referenced (pure expressions, no side effects). Removed:
- `BlackPantherToBrownBeretsConnector.jsx`: `point2X`, `point4X`.
- `BrownBeretsToLongHotSummerConnector.jsx`: `endX`.
- `CivilRightsActToMalcolmXConnector.jsx`: `secondElbowX`, `secondElbowY`.
- `FreedomSummerToCivilRightsActConnector.jsx`: `secondElbowX`, `secondElbowY`.
- `LittleRockToSNCCConnector.jsx`: `endX`.
- `LongHotSummerToMLKConnector.jsx`: `secondElbowX`, `secondElbowY`.
- `MLKToCivilRightsAct1968Connector.jsx`: `secondElbowX`, `fifthElbowX`.
- `MalcolmXToSelmaConnector.jsx`: `secondElbowX`, `secondElbowY`.
- `MarchOnWashingtonDateToQuoteConnector.jsx`: `endX`, `elbowY`.
- `MarchOnWashingtonGifToDateConnector.jsx`: `firstElbowX`, `secondElbowX`,
  `secondElbowY`.
- `MedgarEversToMarchOnWashingtonConnector.jsx`: `secondElbowX`, `secondElbowY`.
- `SelmaToVotingRightsActConnector.jsx`: `thirdElbowX`, `thirdElbowY`.

A re-lint after these removals confirmed no cascade: the partner coordinates
(`firstElbowY`, etc.) are genuinely used in each component's `segments` array,
so nothing was orphaned.

#### 3c. Other unused locals

- `Constellation.jsx`: dropped the unused index param `i` from a `.map((s, i) =>
  ...)` callback.
- `EventNetwork.jsx`, `InfluenceGraph.jsx`: dropped the unused `d` param from
  the d3 drag `.on('end', (event, d) => ...)` handler (the handler body uses
  only `event`; d3 still passes both args).
- `PassageMap.jsx`: removed the unused module const `HIGHLIGHT_COLOR`.
- `VideoPanel.jsx`: removed the unused destructured prop `currentTimestamp`
  (the prop still flows in via props; the component simply does not bind it).
- `Home.jsx`: removed the unused module const `FEEDBACK_ENABLED`.
- `Visualizations.jsx`: removed `const { user } = useAuth()` (unused), which
  cascaded to the `useAuth` import removal noted in 3a. `ProtectedRoute`
  already gates the page, so no auth behavior is lost.

### 4. `react/no-unescaped-entities` (60 errors)

Escaped literal quotes and apostrophes in JSX text with their HTML entities
(`"` to `&quot;`, `'` to `&apos;`). This is render-identical: the browser
prints the same glyph. Only JSX text-node quotes were changed; attribute
quotes (for example `className="..."` and `font-['Source_Serif_4']` on
`Home.jsx` line 2487) were left untouched.

Files: `src/components/FeedbackModal.jsx` (3),
`src/components/VectorSearchOverlay.jsx` (2),
`src/components/visualization/TimelineVisualization.jsx` (2),
`src/pages/About.jsx` (1), `src/pages/Curriculum.jsx` (1),
`src/pages/MachineAudit.jsx` (1), `src/pages/NotFound.jsx` (1),
`src/pages/PeopleCatalog.jsx` (2), `src/pages/TopicGlossary.jsx` (2),
`src/pages/Home.jsx` (45, across 23 lines of interview-quote and
historical-summary copy).

Note on approach: the alternative was to disable
`react/no-unescaped-entities` in `.eslintrc.cjs` (one line, consistent with
the project already disabling `react/prop-types` and
`react/jsx-no-target-blank`). Escaping was chosen instead because the
instruction was to fix errors, escaping keeps the rule active to catch a
genuine future stray `>` or `}` in copy, and it is render-identical. To switch
to the disable approach later, revert the escapes (`git checkout -- src/`,
keeping the other categories you want) and add
`'react/no-unescaped-entities': 'off'` to the `rules` block.

### 5. `react-hooks/rules-of-hooks` (1 error, real latent bug)

- `src/components/rag/CitationCard.jsx`: `useCapsule(entryNumber)` was called
  after the `if (!payload) return null` early return, so the hook ran
  conditionally. If a card instance ever re-rendered with `payload` toggling
  between null and non-null, React's hook order would change and could corrupt
  state. Fixed by hoisting the call to `useCapsule(payload?.entryNumber)`
  above the guard. Verified behavior-preserving: `useCapsule` (in
  `useCapsules.js`) already treats a null/undefined `entryNumber` as "no
  capsule" and yields null, and when `payload` is present
  `payload?.entryNumber === entryNumber`, so the normal-path value is
  unchanged.

## Deferred (Not Fixed)

These were left in place on purpose. Each is either not safe to fix
mechanically, or safe but more invasive than this pass should be without a
reviewer's sign-off.

### `no-undef` (17 errors), real runtime bugs in broken legacy files

These reference functions and state that do not exist in scope, so they would
throw `ReferenceError` if the code path ran. Fixing them means reconstructing
deleted logic, not a lint edit. Both pages are routed but pre-existing-broken.
- `src/pages/InterviewPlayer.jsx` (3): `calculateRelatedTerms`,
  `setRelatedTermsCache`, `setAvailableTopics`.
- `src/pages/PlaylistEditor.jsx` (14): `searchAndBuildPlaylist`, `formatTime`,
  `getTotalPlaylistDuration`, `currentVideo` (x4), `handleSkipPrevious`,
  `handlePlayPause`, `handleSkipNext`, `convertTimestampToSeconds` (x2),
  `extractStartTimestamp` (x2).
Recommendation: these signal that `/interview-player` and `/playlist-editor`
are dead routes; consider removing the routes and files (the live playlist
surface is `StaticPlaylist`).

### `no-unused-vars` (34 remaining)

- Multi-line dead code, safe to remove but invasive (deferred to keep this
  pass to one-line mechanical edits, especially in flagship `Home.jsx`):
  `Home.jsx` `Ray` (an unused component), `embeddings.js` `cosineSimilarity`,
  `ContentDirectory.jsx` `navigateToClips` and `formatTime`,
  `VectorSearchPage.jsx` `extractVideoId`,
  `scripts/media/update-gifs-to-video.js` `createVideoComponent`.
- Public API surface kept for signature stability: `embeddings.js` `clipsOnly`
  (an exported function parameter) and `segmentsOnly` (a documented `options`
  field). Removing these would change a public contract.
- Partial destructures where the value or setter partner is still used, so the
  line cannot be cleanly removed: `VideoPanel.jsx` `playerReady`,
  `VideoPlayer.jsx` `playerState`, `Constellation.jsx` `setShowRegions`,
  `PassageMap.jsx` `hover`, `ClipPlayer.jsx` `playerReady`.
- Locals in broken/unrouted legacy files (same cluster as the `no-undef`
  items above): `InterviewPlayer.jsx` (4), `PlaylistBuilder.jsx` (8),
  `PlaylistEditor.jsx` (9).

### `react-hooks/exhaustive-deps` (22 warnings)

Not safe to auto-fix. Adding the flagged dependencies can change effect timing
or introduce render loops; each needs per-effect reasoning. Spread across
`ClipsDirectory.jsx`, `IntegratedTimeline.jsx`, `PeopleGrid.jsx`,
`VectorSearchOverlay.jsx`, `VideoPlayer.jsx`, `common/Header.jsx`, the rag
panels (`GeographicAtlas`, `PolyphonicEvents`, `TourPages`),
`ForceDirectedTopicGraph.jsx`, `MapVisualization.jsx`, `ClipPlayer.jsx`,
`InterviewPlayer.jsx`, `PlaylistBuilder.jsx`, `TableOfContents.jsx`.

### `react-refresh/only-export-components` (5 warnings)

A dev-only Fast Refresh nicety. Fixing means moving non-component exports
(constants, contexts, helpers) into separate files, a refactor. Files:
`HearInContext.jsx`, `TopicLinkedText.jsx` (2), `contexts/AuthContext.jsx`,
`ContentDirectory.jsx`.

## Verification Performed

- ESLint re-run after each batch and at the end (`eslint . --ext js,jsx`):
  194 to 51 errors; zero fatal/parse errors in the final report (every
  remaining finding is a known rule).
- esbuild parse-check across all 54 changed `.js`/`.jsx` files
  (`esbuild <file> --format=esm`): 0 failures. This is the project's standard
  parse gate because a local `vite build` is unusable in this environment
  (AV segfaults node mid-transform; see CLAUDE.md "Things that look broken but
  aren't" and the `reference_av_blocks_dev_server` memory).
- `git diff --stat` reviewed for line-ending integrity: changes are surgical
  and proportional (no whole-file CRLF/LF flips). The CRLF warnings from git
  are pre-existing autocrlf notices, not introduced here.
- Spot-checked the `Home.jsx` multi-quote interview lines: prose is
  byte-identical apart from the intended quote-to-entity swaps; attribute
  quotes and the en-dash in the Mamie Till quote are preserved.

The `npm run lint` script uses `--max-warnings 0`, so it still exits non-zero
until the 27 deferred warnings (and the 51 deferred errors) are addressed.
Re-enabling the CI lint step should wait until the deferred items are
resolved or the warning budget is adjusted.
