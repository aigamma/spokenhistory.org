# Civil Rights History Project: agent instructions

This is the agent-discovery entry point for the **Civil Rights History Project** (`aigamma/spokenhistory.org` on GitHub). The project is an open-source AI system that transforms the Library of Congress Civil Rights History Project oral history archive (140 interviews, roughly 250 hours, produced with the Smithsonian NMAAHC) into structured searchable metadata. The Smithsonian/LoC quality bar is "publication-grade," not "good enough for a research demo."

## Authoritative source

**Read [`CLAUDE.md`](CLAUDE.md) for all project conventions.** This file (`AGENTS.md`) is a hub-and-spoke delegator that exists so agents looking for the cross-vendor `AGENTS.md` convention (Codex, Aider, Kimi-CLI, the ensemble lanes Eric is bringing up, generic LangChain-based tools, etc.) discover the project's substantive conventions via the canonical document.

`CLAUDE.md` has two sections that are non-negotiable for any agent doing audit-related work:

1. **Audit documentation discipline** — the per-phase update protocol for `transcripts/AUDIT_TRAIL.md`, the RESOLVED-annotation pattern for `transcripts/OPEN_PROBLEMS.md`, the non-destructive overlay rule for `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md`, and the additions-only rule for `Metadata Generation System/civil_rights_facts.json`. Failure to follow this discipline leaves the audit overlay in inconsistent state.

2. **Documentation map** — inventory of ~17 human-facing markdown documents + ~440 machine-generated per-entry staging files, with role-specific reading order (audit vs RAG vs accessibility vs deployment vs pipeline work). Tells you what to read first and what NOT to read for project context.

## Agent-specific override files

When agent-specific instructions are needed beyond the project-wide conventions, place them in the agent's conventional location rather than expanding this file:

- **Claude Code**: `CLAUDE.md` (canonical — same content this file delegates to)
- **Cursor**: `.cursor/rules/*.mdc` (when added)
- **GitHub Copilot**: `.github/copilot-instructions.md` (when added)
- **Continue / Aider / other**: their own conventional locations

The principle: this file stays a delegator. The substantive content lives in `CLAUDE.md`. Agent-specific overrides live in subdirectories. No duplicated content; no drift risk.

## Quick start for a new agent

1. Read `CLAUDE.md` end to end.
2. Read `transcripts/AUDIT_TRAIL.md` for the longitudinal audit history.
3. Read `transcripts/OPEN_PROBLEMS.md` for the active punch-list.
4. Read the role-specific docs per `CLAUDE.md`'s "When to read what" section.
5. Do not read the per-entry staging files (`transcripts/pass{2,3,4}_stage/`, `transcripts/per_entry_slices/`) as project context — they are machine-generated audit artifacts, not documentation.
