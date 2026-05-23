# Civil Rights History Project — GitHub Copilot instructions

GitHub Copilot: this file is auto-injected into your context for any chat / inline / agent invocation in this repository. It is a pointer to the canonical project documentation; substantive conventions live in `CLAUDE.md` to avoid drift across the multiple agent-discovery conventions this repo supports.

## Authoritative source

**Read [`CLAUDE.md`](../CLAUDE.md) end-to-end** before substantive work. It contains:

- Project architecture (5 subsystems: `src/`, `functions/`, `Metadata Generation System/`, `mcp-server/`, `scripts/`)
- The Smithsonian-grade publication gate (dual-scorer + citation-auditor + human-review queue; the publication threshold is 90/90 on BOTH scorers independently)
- **Audit documentation discipline** — strict per-phase update protocol for `transcripts/AUDIT_TRAIL.md`, `transcripts/OPEN_PROBLEMS.md`, `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md`, and `Metadata Generation System/civil_rights_facts.json`. **Non-negotiable for audit-related work.**
- **Documentation map** — distinguishes ~17 human-facing markdown documents from ~440 machine-generated per-entry staging files, with role-specific reading order
- Validation commands (`npm run build`, `node --check`, `python -m compileall`, etc.)
- Defensive patterns and gotchas

Note: `CLAUDE.md` also contains a "Pacing constraints" section that is Claude-Code-specific (references Eric's Anthropic billing relationship and parallel-subagent patterns native to Claude Code's harness). That section does not apply to Copilot — read past it.

## What NOT to suggest reading or editing

- `transcripts/raw/` — the canonical source data. **Never modify these files.** Corrections go to the audit overlay (`CLEANED_TRANSCRIPTS_REVIEW.md`) or to `transcripts/corrected/` (the script output), never to raw.
- `transcripts/pass{2,3,4}_stage/` and `transcripts/per_entry_slices/` — machine-generated audit artifacts (~440 files). They are intermediate results consumed by merge scripts, not documentation.

## Quick start

- For audit-related tasks: read `CLAUDE.md` + `transcripts/AUDIT_TRAIL.md` + `transcripts/OPEN_PROBLEMS.md` first.
- For RAG-related tasks: read `CLAUDE.md` + `rag/README.md` + `docs/RAG_SUBSTRATE_DECISION.md`.
- For frontend / accessibility: read `CLAUDE.md` + `docs/ACCESSIBILITY.md`.
- For deployment / DevOps: read `CLAUDE.md` + `docs/DEPLOYMENT.md`.
- For Python pipeline work: read `CLAUDE.md` + `Metadata Generation System/Metadata Generation Documentation.md` + `StandardizedRubric_1.md`.

`CLAUDE.md`'s "When to read what" section gives the role-specific reading order in detail.

## Why this file exists

GitHub Copilot reads `.github/copilot-instructions.md` automatically. Without it, a Copilot session on this project would not discover the audit-doc discipline or the documentation map and might suggest edits that violate the non-destructive overlay rule or read the per-entry staging files as project context. The same hub-and-spoke pattern applies to `.cursor/rules/project-context.mdc` (Cursor), `.kiro/steering/project-context.md` (Kiro), and the root-level `AGENTS.md` (cross-vendor convention used by Codex, Aider, OpenCode, Kimi-CLI, etc.). Canonical content lives in `CLAUDE.md`; vendor-specific files are pointers.
