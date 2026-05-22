# Civil Rights History Project

> Over 600 hours of civil rights oral history testimony from the people who lived and led the movement sits in the Library of Congress Civil Rights History Project collection, produced in collaboration with the Smithsonian National Museum of African American History and Culture (NMAAHC), public but difficult to navigate at scale. This project builds the infrastructure to change that: an open-source AI system that transforms long-form interview archives into transparent, interpretable public knowledge, with every generated summary, label, and interpretive decision traceable, auditable, and revisable. The goal is not to replace curatorial judgment but to augment it, making primary sources genuinely accessible for civic education, research, and institutional accountability.

This repository contains two things:

1. **A React web application** for exploring and creating playlists from civil rights oral history interviews sourced from the [Library of Congress Civil Rights History Project](https://www.loc.gov/collections/civil-rights-history-project). The platform uses AI-generated metadata and vector embeddings to power search, playlist creation, and interactive visualizations.

2. **A metadata generation pipeline** (`Metadata Generation System/`) — a standalone Python/Flask tool that processes raw interview transcripts through a 7-step AI pipeline to produce the structured metadata that the web app is built on. It generates chapter breaks, summaries, topic classifications, keywords, and engagement scores for each interview, and exports results as JSON ready for Firestore upload.

**Live site:** https://www.civil-rights-history.org/
**Staging:** https://civil-rights-staging.netlify.app (Firebase project `civil-rights-history-project`)

---

## What's new in the May 2026 overhaul

The Smithsonian has been scrutinizing AI-generated summaries for hallucinations; the team raised the bar from "good enough for a research demo" to "Smithsonian-grade publication." This branch adds the substrate to meet that bar:

- **Dual-scorer publication gate.** `processor/claude_scorer.py` runs Claude Opus 4.7 as an independent second-opinion scorer after the OpenAI tuning loop; the publication threshold is now 90/90 on BOTH scorers (up from 80/80 on one). Disagreement routes to human review rather than auto-publishing. Enable with `USE_DUAL_SCORING=1` env var. See `processor/dual_scoring_helper.py` for the dispatch.
- **Per-claim citation audit.** `processor/citation_check.py` checks every factual claim in a summary against the transcript text. Unsupported claims block publication and surface in the review queue with severity-coded annotations.
- **Human-review queue.** Failed-gate summaries land in Firestore `review_queue` (producer: `processor/review_queue.py`). Reviewers triage at `/review-queue` (consumer: `src/pages/ReviewQueue.jsx`) — approve, reject, or send back for revision.
- **Ground-truth corpus.** `Metadata Generation System/civil_rights_facts.json` now has 60 entries (51 with alias lists) covering Big Six leadership, SCLC inner circle, foundational pre-Movement intellectuals (Du Bois, Wells, Murray, Height), major events, and legal precedents (Plessy → Brown → Loving). Validate with `python scripts/validate_facts.py`.
- **Pipeline-to-Firestore bridge.** `scripts/pipeline-to-firestore.mjs` takes a JSON output from the pipeline and writes it into the new Firebase project's `interviewIndex/{slug}/subSummaries/{chapter_NN}` schema. `--dry-run` validates shape without auth.
- **Sample-transcript driver.** `Metadata Generation System/run_sample.py` runs the smallest .srt end-to-end as a single-command integration test. Measured cost on a 152-line transcript: $0.035, runtime 64.6s, first-attempt OpenAI score 85/80 (passed the 80/80 threshold without dual-scorer revisions).
- **Comprehensive mobile + WCAG 2.2 AA audit.** Every primary page and major component swept for tap targets, orientation handling, focus indicators, and color contrast. New utility class `.text-civil-red-body` (#B23E2F, 4.86:1 on cream) for small red text where the brand red (#F2483C, 3.05:1) fails normal-text AA. The `MobileAdvisory` "best on desktop" banner removed because the audit closed every issue it was hedging against.
- **`useViewport` hook.** `src/hooks/useViewport.js` exposes `isMobile / isTablet / isDesktop / isPortrait / isLandscape / isShortLandscape` driven by `matchMedia('(orientation: landscape)')` + window resize. Consumed by the carousel components and the force-directed graph to branch behavior for touch devices.

**For contributors and operators:** see `CLAUDE.md` for the canonical project guide (architecture, validation commands, defensive patterns, accessibility tokens, current sprint status, deployment chain).

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

### Home (`/`)
A custom-built, scroll-driven civil rights history timeline spanning the 1950s through the late 1960s. Each major event — from the murder of Emmett Till through the Civil Rights Act of 1968 — is presented with historical photographs, looping archival video clips (served from Cloudinary), quotes, and decade headers. Animated line connectors drawn in SVG thread the events together visually as the user scrolls. The page also embeds topic-linked text passages. A welcome disclaimer modal is shown on first visit.

### Interview Index (`/interview-index`)
A card grid of every interview in the collection, showing each interviewee's name, thumbnail, and duration. Supports name-based keyword search and semantic vector search (toggled via a switch), as well as sorting by name or duration. Each card links through to the Interview Player.

### Playlist Builder (`/playlist-builder`)
The primary exploration tool. Given a keyword, it assembles a sequential playlist of relevant interview segments drawn from across the collection, using progressive loading so the first clip begins playing immediately while the rest load in the background. Features a related-terms panel, shuffle playback, and inline user feedback.

### Topic Glossary (`/topic-glossary`)
A card-based directory of AI-curated civil rights topics drawn from the `events_and_topics` Firestore collection. Topics are categorized as concepts, places, people, events, organizations, or legal terms, and can be filtered by category, sorted by importance or usage count, and searched by keyword or semantic vector search. Clicking a topic launches its clips directly in the Playlist Builder. Also includes a force-directed topic relationship graph.

---

## Contributors

See [CONTRIBUTORS.md](CONTRIBUTORS.md) for the full roster of project leads, code contributors, and research partners — with notes on each person's focus areas and contribution period. Every contributor to this project (code, design, research, prompts, documentation, infrastructure, or curatorial work) is welcome to add or revise their own entry.

---

## Acknowledgments

- [Library of Congress Civil Rights History Project](https://www.loc.gov/collections/civil-rights-history-project) for the original interview content
- [Smithsonian National Museum of African American History and Culture (NMAAHC)](https://nmaahc.si.edu/) for their collaboration in producing the Civil Rights History Project oral history collection
