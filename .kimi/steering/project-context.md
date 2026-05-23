---
inclusion: always
---

# Civil Rights History Project — Kimi steering

Kimi: this file is auto-included in your context for sessions in this repository (when Kimi is wired with steering-directory support — `.kimi/steering/` follows the same convention as `.kiro/steering/` and other agentic IDEs). It is a pointer to the canonical project documentation; substantive conventions live in `CLAUDE.md` to avoid drift.

## Authoritative documents

1. **`CLAUDE.md`** at the repository root — the canonical project guide. Read end-to-end before substantive work. Contains:
   - Project architecture (5 subsystems: `src/`, `functions/`, `Metadata Generation System/`, `mcp-server/`, `scripts/`)
   - The Smithsonian-grade publication gate (dual-scorer + citation-auditor + human-review queue)
   - Ground-truth corpus location and validation
   - **Audit documentation discipline** — strict per-phase update protocol for `transcripts/AUDIT_TRAIL.md`, `transcripts/OPEN_PROBLEMS.md`, `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md`, and `Metadata Generation System/civil_rights_facts.json`
   - **Documentation map** — inventory of ~17 human-facing markdown docs vs ~440 machine-generated per-entry staging files, with role-specific reading order

   Note: `CLAUDE.md` also contains a "Pacing constraints" section that is Claude-Code-specific (references Eric's Anthropic billing relationship and parallel-subagent patterns native to Claude Code's harness). That section does not apply to Kimi — read past it.

2. **`AGENTS.md`** at the repository root — cross-vendor delegator that also points to `CLAUDE.md`.

3. **`transcripts/AUDIT_TRAIL.md`** — longitudinal audit history across sessions.

4. **`transcripts/OPEN_PROBLEMS.md`** — active punch-list.

## Notes for Kimi specifically

- When Kimi is routed through **Cursor Composer**, the relevant project steering also lives at `.cursor/rules/project-context.mdc` (Cursor auto-loads it). This `.kimi/steering/` file is for Kimi sessions that have direct steering-directory awareness independent of Cursor.
- Kimi's autonomous coding capabilities have been notable in the K2 generation. The audit-doc discipline in `CLAUDE.md` matters because failures to follow it leave the audit overlay in inconsistent state across sessions.

## What NOT to read for project context

`transcripts/pass2_stage/`, `transcripts/pass2_tail_stage/`, `transcripts/pass3_stage/`, `transcripts/pass4_stage/`, and `transcripts/per_entry_slices/` contain ~440 per-entry machine-generated audit artifacts. Reading them for project context will saturate your window without informing your understanding. Read `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` (the merged result) instead.

## Why this file exists + caveat on Kimi's IDE convention

Hub-and-spoke pattern: canonical content lives in `CLAUDE.md`, vendor-specific files (this one, `.cursor/rules/project-context.mdc`, `.kiro/steering/project-context.md`, `.github/copilot-instructions.md`, root-level `AGENTS.md`) are pointers only.

**Caveat:** Kimi-IDE-specific steering-file conventions are less standardized in published documentation as of repository setup. This file assumes Kimi will adopt the steering-directory convention common across other agentic IDEs (Kiro's `.kiro/steering/`). If Kimi requires a different file location or format, also see `AGENTS.md` (the cross-vendor convention, which Kimi-CLI honors via the broad ecosystem standard) — both paths lead to `CLAUDE.md`.
