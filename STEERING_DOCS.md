# Steering Document Hierarchy

**Purpose:** a one-page map of the project's central documents, ranked by where to start and what each one is for. Use this as the teaching aid when explaining the document set to the group.

**Audience:** WWU team, NMAAHC + LoC collaborators, any new contributor (human or AI agent).

**Last updated:** 2026-05-27 (added the per-person pages catalog + the durable-docs principle).

---

## The hierarchy at a glance

| Tier | What it is | When to read | Documents |
|---|---|---|---|
| **1. Orientation** | "Read these first." Where you are, what's been done, who the audience is. | New contributor; presentation prep; stakeholder briefing. | `CLAUDE.md`, `README.md`, `PRESENTATION_REFERENCE.md` |
| **2. Active reference** | "Read these when you're building or running a specific subsystem." Architecture decisions, operations runbooks, design specs that are still load-bearing. | Doing audit / RAG / frontend / deploy / accessibility work. | `docs/*.md`, `rag/README.md`, `rag/INTERACTIVE_FEATURES_DESIGN.md`, `rag/OPERATIONS.md`, `rag/ENDPOINTS.md`, `rag/NEXT_SESSION_PICKUP.md`, `mcp-server/README.md`, `mcp-server/USAGE_GUIDE.md` |
| **3. Lessons learned** | "Read these to understand *why* we made the choices we made." Distilled error categories, conceptual breakthroughs, decision records. | Avoiding past mistakes; teaching the audit cascade; institutional credibility briefings. | `lessons_learned.md`, `docs/RAG_SUBSTRATE_DECISION.md` |
| **4. Demo prep** | "Read these the day of the presentation." Talking points, demo scripts, conference-specific briefings. | The day before, the morning of, or while at the podium. | `rag/CONFERENCE_PREP.md`, `rag/DEMO_SCRIPT.md` |
| **5. Provenance / historical record** | "Read these only if you need to reconstruct what was audited, by whom, when, with what coverage." The institutional-credibility instrument. | External review (Smithsonian / LoC) wants to verify rigor; replacement engineer is reconstructing history. | `transcripts/AUDIT_TRAIL.md`, `transcripts/OPEN_PROBLEMS.md`, `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md`, `transcripts/loc_healing/COVERAGE_REPORT.md`, `transcripts/loc_healing/AUDIT_VS_LOC_DISAGREEMENTS.md`, per-pass stage files |
| **6. Deprecated** | "Read for design-decision provenance only; do not use as a how-to." | Tracing why a substrate decision changed. | `docs/WEAVIATE_INTEGRATION_DESIGN.md` (substrate pivoted to Pinecone Builder + Voyage AI on 2026-05-22) |

---

## Tier 1: Orientation (the three documents to teach the group)

These are the documents a new collaborator should read in order. They get someone from "what is this project?" to "what is the team doing right now?" in ~30 minutes.

### `CLAUDE.md` (project root)
The central guide. Auto-loaded into every AI-agent's context, so it's the only document guaranteed to be read by every contributor (human or otherwise). Contains:
- Project context (what the system is, the Smithsonian quality bar).
- Writing rules (em-dash prohibition, Title Case for headings).
- Architecture overview (five subsystems: `src/`, `functions/`, `Metadata Generation System/`, `mcp-server/`, `scripts/`).
- The audit documentation discipline (per-phase incremental updates, the four governance documents).
- Pass 8 LoC canonical-archive cross-reference and the streamlined ingestion workflow for new transcripts.
- The full documentation map (where to look for each subsystem).
- Validation commands, deployment chain, defensive patterns.
- Operational state ("what's deployed, what isn't, what blocks").

If a contributor only has time to read ONE document, this is it.

### `README.md` (project root)
Public-facing GitHub viewer overview. Shorter, higher-level than CLAUDE.md, written for someone who lands on the GitHub repo without prior context.

### `PRESENTATION_REFERENCE.md` (project root)
The conceptual-map briefing for the WWU presentation. Eight conceptual breakthroughs from the audit work, the coverage table, implications for the user-facing product, slide-friendly section structure. Companion to `lessons_learned.md`.

**This is the document specifically prepared to brief the presentation.**

---

## Tier 2: Active reference (build / operate the subsystems)

### Architecture + decisions
- `docs/ACCESSIBILITY.md` — WCAG 2.2 AA audit + the brand color contrast tokens. Read before touching any UI styling.
- `docs/DEPLOYMENT.md` — End-to-end deployment chain (Python pipeline → Node bridge → Firestore → React + Cloud Functions + MCP server).
- `docs/TRANSCRIPT_AUDIT_DESIGN.md` — Original three-stage audit cascade design.
- `docs/RAG_SUBSTRATE_DECISION.md` — Why Pinecone + Voyage AI was chosen over self-hosted alternatives.

### RAG layer
- `rag/README.md` — Architecture + setup + metadata schema. Read before touching `rag/ingest.mjs` / `rag/retrieve.mjs`.
- `rag/INTERACTIVE_FEATURES_DESIGN.md` — Substrate → precompute → UI architecture for the interactive RAG components (SemanticSearch, QuoteFinder, RelatedPassages, Constellation, Spectrum, Word Search, Interview Map).
- `rag/ENDPOINTS.md` — Live URLs + backend identifiers + `/retrieve` body/response shape.
- `rag/OPERATIONS.md` — Key-rotation, monitoring, abuse-response, reingestion recipes, cost ceilings, disaster recovery.
- `rag/NEXT_SESSION_PICKUP.md` — Fresh-eyes 5-minute orientation for an agent resuming work.

### MCP server
- `mcp-server/README.md` — Engineering reference (Pinecone+Voyage rewire, env vars, citation-payload shape).
- `mcp-server/USAGE_GUIDE.md` — End-user / researcher / Anthropic-Connector-Directory submission doc. Worked examples for grant citation, quote verification, curriculum dev.

### Pipeline (Python)
- `Metadata Generation System/Metadata Generation Documentation.md` — Original 7-step pipeline doc.
- `Metadata Generation System/StandardizedRubric_1.md` — Smithsonian-grade scoring rubric.

### Per-person pages catalog
- `public/rag/people/README.md` — Schema + catalog purpose (integration hub, not biography) + writing discipline (Wikipedia is fact-check only; anti-idempotent prose; cite every claim). Required reading before adding a person page or modifying `src/pages/PersonPage.jsx`.

---

## Tier 3: Lessons learned (why we made the choices we made)

### `lessons_learned.md` (project root)
Deep-dive companion to PRESENTATION_REFERENCE. Categorical error analysis (phonetic confusion, ASR name-bleed, short-needle substring corruption, audit-canon leakage, etc.) with audited examples for each category. Process-governance lessons (apply-step discipline, word-boundary safety, commit+push at every moderate milestone). Read this when teaching the audit cascade in depth, not as a slide pack.

### `docs/RAG_SUBSTRATE_DECISION.md`
Why Pinecone Builder + Voyage AI was chosen over Weaviate / Supabase pgvector / self-hosted alternatives. Includes the alternatives considered, the weighting criteria, what was explicitly deferred, and the migration triggers that should re-open the decision.

---

## Tier 4: Demo prep (the day of the presentation)

### `rag/CONFERENCE_PREP.md`
The London-conference brief (June 2026): what's in the corpus, how the embeddings represent it, what queries the presentation will exercise, the philosophy-of-embedding framing for stakeholder communication.

### `rag/DEMO_SCRIPT.md`
Wednesday-meeting (or any stakeholder) one-pager. Three minutes of demo, three Wednesday-friendly demo queries with expected results, infra-cost numbers, audit-tier color legend, outstanding admin actions.

---

## Tier 5: Provenance / historical record (institutional credibility)

These exist so a future reviewer can reconstruct exactly what was audited, by whom, when, with what coverage. Do NOT treat as how-to. Read only when:

- Smithsonian / LoC review wants verification of audit rigor.
- A replacement engineer needs to know what's already been done.
- An inferential-scoring framework needs the per-entry coverage matrix as input.

### Governance documents (`transcripts/`)
- `transcripts/AUDIT_TRAIL.md` — Longitudinal effort log across sessions, agents, models. The substrate for inferential error-rate scoring.
- `transcripts/OPEN_PROBLEMS.md` — Active punch-list. Numbered problems; never deleted, only annotated as RESOLVED.
- `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` — The ~12 MB master correction overlay. Per-entry Pass 1/2/3/4/5/6/7/8 tables with row IDs, confidence tiers, source attribution.
- `Metadata Generation System/civil_rights_facts.json` — Ground-truth corpus (~140 entries, 291 aliases). Anchors the LLM scorer's accuracy claims.

### Pass 8 (LoC healing) artifacts
- `transcripts/loc_healing/COVERAGE_REPORT.md` — 127/127 entries healed; per-entry source kind, heal counts, failure-mode breakdown.
- `transcripts/loc_healing/AUDIT_VS_LOC_DISAGREEMENTS.md` — 710 SME-reviewable conflicts where audit-canon disagrees with LoC's authoritative text.
- `transcripts/pass8_stage/entry_<NNN>_<slug>.md` — Per-entry institutional-audit artifact (one file per healed entry).

### Per-pass staging
- `transcripts/pass2_stage/`, `pass2_tail_stage/`, `pass3_stage/`, `pass4_stage/`, `pass5_stage/` — machine-generated intermediate audit artifacts. Read the merged result in `CLEANED_TRANSCRIPTS_REVIEW.md` instead.

---

## Tier 6: Deprecated (read for provenance only)

### `docs/WEAVIATE_INTEGRATION_DESIGN.md`
Original RAG substrate design when the plan was Weaviate. The substrate decision pivoted to Pinecone Builder + Voyage AI on 2026-05-22. Kept for design-decision provenance. Current substrate documented in `docs/RAG_SUBSTRATE_DECISION.md` and `rag/README.md`.

---

## When to read what (cheat sheet)

| You're about to... | Read first |
|---|---|
| Start contributing for the first time | `CLAUDE.md` |
| Brief an external stakeholder | `PRESENTATION_REFERENCE.md` then `lessons_learned.md` |
| Demo the live site | `rag/DEMO_SCRIPT.md` |
| Edit audit overlays | `CLAUDE.md` § Audit documentation discipline, `transcripts/AUDIT_TRAIL.md` |
| Ingest a new transcript | `transcripts/ingestion/README.md`, `CLAUDE.md` § Streamlined ingestion |
| Touch the RAG ingest/retrieval code | `rag/README.md` |
| Build a new interactive surface | `rag/INTERACTIVE_FEATURES_DESIGN.md` |
| Add or modify a per-person page | `public/rag/people/README.md` (catalog purpose + schema + writing discipline) |
| Deploy to staging or production | `docs/DEPLOYMENT.md`, `rag/OPERATIONS.md` |
| Touch the MCP server | `mcp-server/README.md`, `mcp-server/USAGE_GUIDE.md` |
| Touch styling / colors / accessibility | `docs/ACCESSIBILITY.md`, `CLAUDE.md` § Writing rules |
| Investigate "why does it work like this?" | `lessons_learned.md`, `docs/RAG_SUBSTRATE_DECISION.md` |
| Show a Smithsonian / LoC reviewer the rigor of the work | `transcripts/AUDIT_TRAIL.md`, `transcripts/loc_healing/COVERAGE_REPORT.md`, the per-entry stage files |
| Discover a new rule mid-session | Put it in `CLAUDE.md` (the auto-loaded doc) or a tier-2 subsystem doc; **never** rely on session memory alone. See `CLAUDE.md` § Documentation as durable source of truth. |

---

## Maintenance rule

Every commit that materially changes a subsystem must update its corresponding Tier-2 reference document in the same commit. Working-tree state where the code has changed but the doc lies is treated as a process failure. Tier 3 / Tier 5 documents are append-only (lessons / audit trail) and grow over time; Tier 1 / Tier 2 / Tier 4 documents are kept evergreen.
