# Contributors

The Civil Rights History Project is a collaborative undertaking. This file records contributions across all phases of the project's development. We recognize code, design, research, prompt engineering, documentation, infrastructure, and curatorial work — all of it counts, and all of it is welcome.

If you contributed and aren't listed below, please open a pull request adding yourself in the appropriate section, or ask anyone already listed to add you.

_Last updated: 2026-05-20. This roster is reconciled with the Project Team and Student Interns sections on the live About page (`src/pages/About.jsx`); the two surfaces are kept in sync._

---

## Project Team

- **Dustin O'Hara, PhD** ([dustinohara.com](https://dustinohara.com/)) — Principal Investigator and Project Director. Directional control over the repository and the broader research effort. Maintains the partnership with the Library of Congress American Folklife Center and the Smithsonian National Museum of African American History and Culture (NMAAHC) for the underlying interview collection.

- **Jack Sovelove** ([@jsovelove](https://github.com/jsovelove)) — Co-Principal Investigator and Software Developer. Co-lead and primary architect. Built the foundation of every layer of the system: the 7-step Python/Flask metadata-generation pipeline (blocking, labeling, TOC building, chapterization, summarization, iterative tuning, engagement scoring), the React frontend (interview index, playlist builder, topic glossary, scroll-driven civil rights timeline), the Firebase Firestore + Cloud Functions backend, the vector-search and embedding infrastructure, the feedback-reporting flow (Canny integration, captcha, popup), and the standardized rubric for summary quality evaluation. Authored or co-authored the great majority of documentation in the repository.

- **Sofia Choi** — Designer & Visual Curation. Established the visual language that the rest of the team builds within: the cream + civil-rights-red palette (#EBEAE9 background, #F2483C accent), the Inter / Source Serif Pro / Source Serif 4 / Chivo Mono / Lora typographic stack, and the visual treatment of the scroll-driven landing-page timeline. (Distinct from Sophia Zhuk, who is in the Student Interns section below.)

## Student Interns

- **Sophia Zhuk** ([@sophiazhuk](https://github.com/sophiazhuk)) — Software Development. Led the PatternFly UI redesign branch — refactored the frontend to the PatternFly design system, then merged it back to master (PR #1, May 20, 2026). Built the collections feature, video player, and playlist UX polish that shipped with the PatternFly merge. Improved the metadata pipeline's Flask UI: progress bars across pipeline steps, more specific error messages on `upload.html`, hh:mm:ss time formatting on `blocking_output.html`. 9 commits to date, April 19, 2026 – ongoing.

- **Maya Galley** — Software Development and Metadata Design. Contributed to the metadata-generation pipeline architecture and to the design of the structured outputs that the React frontend renders against.

- **Alina Sokolova** — Concept Design. Contributed to the early conceptual design of the project's scope and presentation.

- **Ron Chesko** ([@ron-chesko](https://github.com/ron-chesko)) — Software Development. UI updates and code-integration work during the PatternFly redesign window. 4 commits to date, April 2, 2026 – April 23, 2026.

---

## May 2026 Smithsonian-Grade Overhaul

- **Eric Allione** ([@aigamma](https://github.com/aigamma)) — Smithsonian-grade quality overhaul. Hardened the metadata-pipeline tuning loop with a Claude Opus 4.7 external second-opinion scorer (`processor/claude_scorer.py`), the dual-scorer publication gate (`tune_with_dual_scoring`), the per-claim citation auditor (`processor/citation_check.py`), and the human-review queue (`processor/review_queue.py` producer + `src/pages/ReviewQueue.jsx` admin UI + `src/services/reviewQueue.js`); expanded `civil_rights_facts.json` ground-truth coverage from 17 to 60 entries (51 with alias lists), with full Big Six leadership coverage (Wilkins, Whitney Young, Randolph, Lewis, MLK indirectly, Farmer), the SCLC inner circle (Abernathy, Andrew Young), the foundational pre-Movement intellectuals (Du Bois, Wells, Pauli Murray, Dorothy Height), Rosa Parks and Thurgood Marshall as their own person-entries, the legal precedent Plessy v. Ferguson, and LBJ as federal-executive grounding and replaced the fragile substring matcher in `shared.py::get_relevant_facts` with a word-boundary regex matcher that consults the aliases. Site-wide mobile-friendliness pass: built the dismissible advisory banner replacing the prior hard-block (`src/components/MobileAdvisory.jsx`), brought tap targets up to the WCAG 2.2 AA 44x44 minimum across Header, PlaylistBuilder, TopicGlossary, MobileAdvisory, VectorSearchOverlay, and FeedbackModal close affordances, added dialog semantics and `aria-modal` to all four modal overlays, and added screen-reader announcements to the two route-level loading spinners. Cross-project infrastructure: standalone Model Context Protocol server exposing the archive to Claude Desktop and Claude.ai Custom Connectors (`mcp-server/`), Firestore migration script for the llm-hyper-audio → civil-rights-history-project transition (`scripts/firestore-migrate.mjs`), Firestore security rules (`firestore.rules`), CI workflow (`.github/workflows/ci.yml`), Firebase config moved to `VITE_FIREBASE_*` env-var override pattern. Defensive hardening: input validation on all three Cloud Functions + all three MCP tools + Firebase Auth surface, type-coercion on Claude scorer + citation auditor model outputs, named firebase-admin app in `review_queue.py` to avoid default-app collision. Documentation: this contributors ledger.

---

## Institutional Affiliation

- **[Western Washington University (WWU)](https://www.wwu.edu/)** — Home institution of the project. Pilot grant from WWU supports the work.

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
