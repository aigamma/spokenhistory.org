# Contributors

The Civil Rights History Project is a collaborative undertaking. This file records contributions across all phases of the project's development. We recognize code, design, research, prompt engineering, documentation, infrastructure, and curatorial work — all of it counts, and all of it is welcome.

If you contributed and aren't listed below, please open a pull request adding yourself in the appropriate section, or ask anyone already listed to add you.

_Last updated: 2026-05-20._

---

## Project Leadership

- **Dustin Ohara** — Project owner. Directional control over the repository and the broader research effort. Maintains the partnership with the Smithsonian National Museum of African American History and Culture (NMAAHC) for the underlying interview collection.

- **Jack Sovelove** ([@jsovelove](https://github.com/jsovelove)) — Co-lead and primary architect. Built the foundation of every layer of the system: the 7-step Python/Flask metadata-generation pipeline (blocking, labeling, TOC building, chapterization, summarization, iterative tuning, engagement scoring), the React frontend (interview index, playlist builder, topic glossary, scroll-driven civil rights timeline), the Firebase Firestore + Cloud Functions backend, the vector-search and embedding infrastructure, the feedback-reporting flow (Canny integration, captcha, popup), and the standardized rubric for summary quality evaluation. Authored or co-authored the great majority of documentation in the repository.

---

## Code Contributors

The following developers have committed code to the repository. Commit counts are a `git log --all` snapshot as of the date above and will grow.

### Jack Sovelove ([@jsovelove](https://github.com/jsovelove))

- **100 commits.** February 2025 – ongoing.
- Repository creator, primary committer across every subsystem.
- Recent focus (late 2025 – early 2026): metadata generation folder organization, documentation tightening, asset migration (GIF → video), home page polish, topic glossary search, feedback and issue reporting infrastructure, captcha integration.

### Sophia Zhuk ([@sophiazhuk](https://github.com/sophiazhuk))

- **9 commits.** April 19, 2026 – ongoing.
- Led the PatternFly UI redesign branch — refactored the frontend to the PatternFly design system, then merged it back to master (PR #1, May 20, 2026).
- Built the collections feature, video player, and playlist UX polish that shipped with the PatternFly merge.
- Improved the metadata pipeline's Flask UI: progress bars across pipeline steps, more specific error messages on `upload.html`, hh:mm:ss time formatting on `blocking_output.html`.

### Ron Chesko ([@ron-chesko](https://github.com/ron-chesko))

- **4 commits.** April 2, 2026 – April 23, 2026.
- UI updates and code-integration work during the PatternFly redesign window.

### Eric Allione ([@aigamma](https://github.com/aigamma))

- May 2026 – ongoing.
- Working on the Smithsonian-grade quality overhaul: hardening the metadata-pipeline tuning loop (raising thresholds, adding Claude Opus as an external second-opinion scorer, replacing best-attempt-kept publication with a human-review queue), expanding the `civil_rights_facts.json` ground-truth corpus, the mobile-friendly frontend redesign, the password-gated staging site, and the planned remote MCP server that will expose the archive to Claude Desktop and Claude.ai Custom Connectors users.

---

## Source Materials and Research Partners

- **[Library of Congress Civil Rights History Project](https://www.loc.gov/collections/civil-rights-history-project)** — Source of the original 600+ hours of interview content, including the 131 oral histories currently in this repository.

- **[Smithsonian National Museum of African American History and Culture (NMAAHC)](https://nmaahc.si.edu/)** — Co-producers of the Civil Rights History Project oral history collection in collaboration with the Library of Congress.

---

## How to Add Yourself

If you contributed and your work isn't reflected here:

1. Open a pull request that edits this file. Add an entry under the appropriate section with your name, GitHub handle, contribution period, and a sentence (or paragraph — your call) describing what you worked on.
2. If you'd like to expand or revise your own entry above, please do — these descriptions are starting points written from observable commit history, not the final word.
3. Anyone already listed in this file can merge contributor additions. Contributor PRs do not need extensive review.

We aim for every named contributor to leave this project with visible, durable, verifiable credit — useful for academic CVs, grant applications, and professional references.
