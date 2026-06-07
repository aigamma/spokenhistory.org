# Civil Rights History Project

> Over 600 hours of civil rights oral history testimony from the people who lived and led the movement sits in the Library of Congress Civil Rights History Project collection, produced in collaboration with the Smithsonian National Museum of African American History and Culture (NMAAHC), public but difficult to navigate at scale. This project builds the infrastructure to change that: an open-source AI system that transforms long-form interview archives into transparent, interpretable public knowledge, with every generated summary, label, and interpretive decision traceable, auditable, and revisable. The goal is not to replace curatorial judgment but to augment it, making primary sources genuinely accessible for civic education, research, and institutional accountability.

This repository contains two things:

1. **A React web application** for exploring and creating playlists from civil rights oral history interviews sourced from the [Library of Congress Civil Rights History Project](https://www.loc.gov/collections/civil-rights-history-project). The platform uses AI-generated metadata and vector embeddings to power search, playlist creation, and interactive visualizations.

2. **A metadata generation pipeline** (`Metadata Generation System/`), a standalone Python/Flask tool that processes raw interview transcripts through a 7-step AI pipeline to produce the structured metadata that the web app is built on. It generates chapter breaks, summaries, topic classifications, keywords, and engagement scores for each interview, and exports results as JSON ready for Firestore upload.

**Live site:** https://www.civil-rights-history.org/
**Staging:** https://civil-rights-staging.netlify.app (Firebase project `civil-rights-history-project`)

---

## What's new in the May 2026 overhaul

The Smithsonian has been scrutinizing AI-generated summaries for hallucinations; the team raised the bar from "good enough for a research demo" to "Smithsonian-grade publication." This branch adds the substrate to meet that bar:

- **Dual-scorer publication gate.** `processor/claude_scorer.py` runs Claude Opus 4.7 as an independent second-opinion scorer after the OpenAI tuning loop; the publication threshold is now 90/90 on BOTH scorers (up from 80/80 on one). Disagreement routes to human review rather than auto-publishing. Enable with `USE_DUAL_SCORING=1` env var. See `processor/dual_scoring_helper.py` for the dispatch.
- **Per-claim citation audit.** `processor/citation_check.py` checks every factual claim in a summary against the transcript text. Unsupported claims block publication and surface in the review queue with severity-coded annotations.
- **Human-review queue.** Failed-gate summaries land in Firestore `review_queue` (producer: `processor/review_queue.py`). Reviewers triage at `/review-queue` (consumer: `src/pages/ReviewQueue.jsx`), approve, reject, or send back for revision.
- **Ground-truth corpus.** `Metadata Generation System/civil_rights_facts.json` now has 378 entries (396 aliases) covering Big Six leadership, SCLC inner circle, foundational pre-Movement intellectuals (Du Bois, Wells, Murray, Height), major events, and legal precedents (Plessy, Brown, Loving). Validate with `python scripts/validate_facts.py`.
- **Pipeline-to-Firestore bridge.** `scripts/pipeline-to-firestore.mjs` takes a JSON output from the pipeline and writes it into the new Firebase project's `interviewIndex/{slug}/subSummaries/{chapter_NN}` schema. `--dry-run` validates shape without auth.
- **Sample-transcript driver.** `Metadata Generation System/run_sample.py` runs the smallest .srt end-to-end as a single-command integration test. Measured cost on a 152-line transcript: $0.035, runtime 64.6s, first-attempt OpenAI score 85/80 (passed the 80/80 threshold without dual-scorer revisions).
- **Comprehensive mobile + WCAG 2.2 AA audit.** Every primary page and major component swept for tap targets, orientation handling, focus indicators, and color contrast. New utility class `.text-civil-red-body` (#B23E2F, 4.86:1 on cream) for small red text where the brand red (#F2483C, 3.05:1) fails normal-text AA. The `MobileAdvisory` "best on desktop" banner removed because the audit closed every issue it was hedging against.
- **`useViewport` hook.** `src/hooks/useViewport.js` exposes `isMobile / isTablet / isDesktop / isPortrait / isLandscape / isShortLandscape` driven by `matchMedia('(orientation: landscape)')` + window resize. Consumed by the carousel components and the force-directed graph to branch behavior for touch devices.
- **`useDocumentTitle` hook.** `src/hooks/useDocumentTitle.js`, adopted on all 14 pages. Produces per-route browser tab titles (e.g., `"Maynard E. Moore | Civil Rights History Project"`) so screen readers, browser history, and bookmarks distinguish routes. Dynamic on InterviewPlayer / PlaylistBuilder / ClipPlayer to compose interviewee + topic data into the title once Firestore resolves.
- **Top-level ErrorBoundary.** `src/components/ErrorBoundary.jsx` catches any unhandled render error in the React tree. Closes the blank-white-page failure mode that React's default error handling produces; users see a recoverable error card with a Reload button. `console.error` reporting hook ready for a one-line swap to Sentry / Rollbar / Bugsnag.
- **Proper 404 page.** `src/pages/NotFound.jsx` replaces the previous silent `<Navigate to="/" replace />` catch-all. Mistyped URLs, dead bookmarks, and search-engine crawler hits on broken links now see an explicit 404 with the attempted path + suggested destinations.
- **Skip-link, focus management, modal dialog patterns.** `<Layout>` carries a WCAG 2.4.1 skip-link to `#main-content`. All 5 site modals (Header menu / VectorSearchOverlay / WelcomeDisclaimerModal / FeedbackModal / PeopleGrid person-detail) implement the WAI-ARIA dialog focus pattern: Esc-to-close, focus-enter on open, focus-restore to trigger on close.
- **Production polish.** `alert()` extinct across the React app (replaced with inline `role="alert"` for errors and natural modal dismissal for success). `vite.config.js` strips `console.log / console.debug / console.info` from production bundles via esbuild pure-call elimination (preserves `console.error` / `console.warn`).
- **Daily pa11y-ci CI workflow.** `.github/workflows/a11y.yml` runs an automated WCAG 2.2 AA scan against the staging deploy daily at 09:00 UTC + workflow_dispatch. First-run result (2026-05-22): 5/5 URLs passed, 0 errors across axe + htmlcs runners.
- **Citation-grade RAG layer.** `rag/` (Pinecone + Voyage AI substrate, approximately 16K .srt-anchored vectors across 140 interviews plus one vector per person reference page) + `netlify/functions/retrieve.mjs` (public retrieval endpoint with `entry_number` shortcut + `dedupeByEntry` polyphonic option) + `src/components/rag/` (SemanticSearch, QuoteFinder, RelatedPassages, Constellation, CitationCard) + `/rag-explore` demo page with 4 tabs. Every retrieval result carries a Library of Congress catalog URL, exact audio timestamp range, audit-tier transparency badge (5-tier vocabulary: low / medium / publication-block / not-auditable / ingestion-only), and a pre-formatted Chicago-style citation block. `mcp-server/` is deployed and live on Fly.io at `https://mcp.spokenhistory.org/mcp` (also `https://civil-rights-history-mcp.fly.dev/mcp`): a public, no-auth MCP connector that lets Claude Desktop, claude.ai, Codex, and any MCP client search and cite the archive. **To use the archive from your own AI tool, see `mcp-server/GETTING_STARTED.md`.** See also `rag/README.md`, `rag/DEMO_SCRIPT.md`, `rag/OPERATIONS.md`, `mcp-server/USAGE_GUIDE.md`.

**For contributors and operators:** see `CLAUDE.md` for the canonical project guide (architecture, validation commands, defensive patterns, accessibility tokens, current sprint status, deployment chain), `docs/ACCESSIBILITY.md` for the WCAG 2.2 AA audit report, and `docs/DEPLOYMENT.md` for the step-by-step operator deployment guide.

---

## Repository Structure

```
/
├── src/                          # React frontend application
│   ├── pages/                    # Application pages / routes
│   ├── components/               # Reusable UI components
│   │   ├── auth/                 # Authentication components
│   │   ├── common/               # Layout, Header, Sidebar, Footer
│   │   ├── connectors/           # Animated timeline event connectors
│   │   └── visualization/        # Chart, map, and globe components
│   ├── contexts/                 # React Context providers
│   ├── hooks/                    # Custom React hooks
│   ├── services/                 # Firebase, OpenAI, and playlist services
│   ├── utils/                    # Utility functions
│   ├── App.jsx                   # Route definitions
│   └── main.jsx                  # Entry point
├── functions/                    # Firebase Cloud Functions (Node.js)
├── Metadata Generation System/   # Standalone Python/Flask pipeline tool
│   ├── app.py                    # Flask app
│   ├── processor/                # Pipeline step modules
│   ├── processor_prompts/        # LLM prompt templates
│   ├── templates/                # Flask HTML templates
│   └── Metadata Generation Documentation.md  # Pipeline documentation
├── scripts/
│   ├── firebase/                 # Firestore data management scripts
│   ├── media/                    # Video/GIF processing scripts
│   └── vectorization/            # Batch embedding generation scripts
└── dist/                         # Production build output
```

---

## Metadata Generation System

A standalone **Python/Flask** tool (`Metadata Generation System/`) that processes raw `.srt` interview transcripts through a configurable 7-step pipeline to produce structured metadata for Firestore.

### Pipeline Steps

| Step | Module | Description |
|---|---|---|
| 1 | `blocking.py` | Parse SRT file and group lines into fixed-size text blocks |
| 2 | `labeling.py` | Assign topic labels to each text block via LLM |
| 3 | `toc.py` | Generate a table of contents from labeled blocks |
| 4 | `chapterization.py` | Detect topic transitions and define chapter boundaries |
| 5 | `summarization.py` | Generate a main interview summary and per-chapter summaries |
| 6 | `tuning.py` | Evaluate summary quality and iteratively revise until thresholds are met |
| 7 | `engagement.py` | Score each chapter for audience engagement |

Each step uses editable LLM prompts (stored in `processor_prompts/`) and can be individually re-run. The tool supports single-file and batch processing, and exports results as JSON ready for Firestore upload.

For a detailed walkthrough of each pipeline stage, see [`Metadata Generation System/Metadata Generation Documentation.md`](Metadata%20Generation%20System/Metadata%20Generation%20Documentation.md).

### Running the Metadata Tool

```bash
cd "Metadata Generation System"
pip install -r requirements.txt
python app.py
```

Then open `http://localhost:5000` in your browser and follow the step-by-step UI.

---

## Frontend Pages

The app uses a single drawer menu (one Menu button; items: Timeline, Interviews, Topics, People, Curriculum, Data Insights, About) and reads its data from static JSON committed under `public/rag/`. Highlights:

### Timeline (`/`)
A custom-built, scroll-driven civil rights history timeline spanning the 1950s through the late 1960s. Each major event, from the murder of Emmett Till through the Civil Rights Act of 1968, is presented with historical photographs, looping archival video clips, quotes, and decade headers. Animated SVG line connectors thread the events together as the user scrolls. A welcome disclaimer modal is shown on first visit.

### Interviews (`/table-of-contents`)
The Table of Contents for all 140 interviews. Each interview expands to its named chapters grouped into parts; every chapter and part links to a bounded video segment so a multi-hour interview opens to the right place without buffering the whole file. This page absorbed the earlier card-grid Interview Index (which now redirects here) and carries each interview's capsule and audit-tier badge.

### Playlist (`/playlist-builder`)
A static playlist surface that reads `public/rag/playlist_index.json` (one entry per chapter across the 140 interviews) and filters by `?keywords=`, `?topic=`, `?entry=`, or `?entries=`. Each clip plays as a Library of Congress video segment bounded to its start and end.

### Topics (`/topic-glossary`)
A directory of recurring civil rights themes and AI-curated topics, leading with curated playlists. Selecting a topic opens its clips in the Playlist surface.

### People (`/people`, `/person/:slug`)
A catalog of 202 reference pages (165 interviewees plus 37 historic figures discussed in the interviews). Each person page is a citation-bearing integration hub: a biographical paragraph, an embedding-derived "AI reading," verbatim interview snippets with in-context clips, semantic neighbors, concept-axis positions, influence-graph edges, and a sources list.

### Curriculum (`/curriculum`)
A K-12 lesson generator: a teacher slides to a grade band and the page assembles a grade-leveled lesson unit (objectives, materials, activities, vocabulary) out of the archive, with clip materials playing as bounded LoC segments.

### Data Insights (`/rag-explore`)
The interactive demo of the citation-grade retrieval layer. Semantic search returns ranked passages with full primary-source attribution (interviewee, exact audio timestamp, audit-tier transparency badge, pre-formatted Chicago citation). The Ideological Spectrums place each voice on seven embedding-derived concept axes (for example Nonviolence-as-Theology versus Armed Self-Defense). An embedding-space map renders the interview centroids as a 2D scatter so interviewees who never met but whose words cluster thematically appear as nearby dots. Backed by [Pinecone](https://www.pinecone.io/) (civil-rights index) and [Voyage AI](https://www.voyageai.com/) (voyage-3 embeddings + rerank-2). See `rag/DEMO_SCRIPT.md` and `mcp-server/USAGE_GUIDE.md`.

### Machine Audit (`/machine-audit`)
An explainer of how the AI metadata is generated, the 90/90 dual-scorer publication gate, the Library of Congress cross-reference, where uncertainty remains, and how to send a correction.

---

## Contributors

See [CONTRIBUTORS.md](CONTRIBUTORS.md) for the full roster of project leads, code contributors, and research partners, with notes on each person's focus areas and contribution period. Every contributor to this project (code, design, research, prompts, documentation, infrastructure, or curatorial work) is welcome to add or revise their own entry.

---

## Acknowledgments

- [Library of Congress Civil Rights History Project](https://www.loc.gov/collections/civil-rights-history-project) for the original interview content
- [Smithsonian National Museum of African American History and Culture (NMAAHC)](https://nmaahc.si.edu/) for their collaboration in producing the Civil Rights History Project oral history collection
