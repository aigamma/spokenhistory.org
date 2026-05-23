# Civil Rights History Project — OpenCode pointer

OpenCode honors the cross-vendor `AGENTS.md` convention natively, so the canonical entry point is `AGENTS.md` at this repository's root.

If OpenCode also discovers this file (some configurations read root-level `opencode.md`), the substantive project conventions live in `CLAUDE.md`. Read `CLAUDE.md` end-to-end before substantive work.

## What `CLAUDE.md` contains

- Project architecture (5 subsystems: `src/`, `functions/`, `Metadata Generation System/`, `mcp-server/`, `scripts/`)
- The Smithsonian-grade publication gate (dual-scorer + citation-auditor + human-review queue)
- **Audit documentation discipline** — non-negotiable per-phase update protocol for the four governance documents in `transcripts/`
- **Documentation map** — distinguishes ~17 human-facing markdown docs from ~440 machine-generated per-entry staging files
- Validation commands and defensive patterns

Note: `CLAUDE.md` also contains a "Pacing constraints" section that is Claude-Code-specific (it references Eric's Anthropic billing relationship and parallel-subagent patterns native to Claude Code's harness). That section does not apply to OpenCode or any other agent that doesn't share Claude Code's runtime — read past it.

## Do not read these for project context

`transcripts/pass2_stage/`, `transcripts/pass2_tail_stage/`, `transcripts/pass3_stage/`, `transcripts/pass4_stage/`, `transcripts/per_entry_slices/` — machine-generated audit artifacts. Read `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` (the merged result) instead.

## Why this file exists

Belt-and-suspenders pointer alongside `AGENTS.md` for OpenCode configurations that look for `opencode.md` specifically. Canonical content lives in `CLAUDE.md`. This is the hub-and-spoke pattern used across all vendor-specific steering files in this repo (`.cursor/rules/`, `.kiro/steering/`, `.kimi/steering/`, `.github/copilot-instructions.md`, root-level `AGENTS.md` + `opencode.md`).
