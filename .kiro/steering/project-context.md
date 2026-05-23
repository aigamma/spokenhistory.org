---
inclusion: always
---

# Civil Rights History Project — Kiro steering

Kiro: this file is auto-included in your context for all sessions in this repository per `inclusion: always`. It is a pointer to the canonical project documentation; the substantive conventions live elsewhere to avoid drift.

## Authoritative documents (read these first)

1. **`CLAUDE.md`** at the repository root — the canonical project guide. Read end-to-end before substantive work. Contains:
   - Architecture (5 subsystems: `src/`, `functions/`, `Metadata Generation System/`, `mcp-server/`, `scripts/`)
   - Pacing constraints (Claude Max 20x — no token throttling; parallel subagents preferred for backlog work)
   - The Smithsonian-grade publication gate (dual-scorer + citation-auditor + review queue)
   - Ground-truth corpus location + validation
   - **Audit documentation discipline** — strict per-phase update protocol for `transcripts/AUDIT_TRAIL.md`, `transcripts/OPEN_PROBLEMS.md`, `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md`, and `Metadata Generation System/civil_rights_facts.json`
   - **Documentation map** — inventory of ~17 human-facing markdown docs vs ~440 machine-generated per-entry staging files, with role-specific reading order
   - Validation commands
   - Defensive patterns
   - Accessibility tokens
   - Gotchas list ("things that look broken but aren't")

2. **`AGENTS.md`** at the repository root — short cross-vendor delegator that also points to `CLAUDE.md`. Read if you encounter it in repos via AGENTS.md-convention; it delegates the same way.

3. **`transcripts/AUDIT_TRAIL.md`** — longitudinal audit history across sessions. Read for: what passes ran, what coverage each entry got, the inferential-scoring framework for downstream ensemble grading.

4. **`transcripts/OPEN_PROBLEMS.md`** — active punch-list of remaining work.

## What NOT to read for project context

`transcripts/pass2_stage/`, `transcripts/pass2_tail_stage/`, `transcripts/pass3_stage/`, `transcripts/pass4_stage/`, and `transcripts/per_entry_slices/` contain ~440 per-entry machine-generated audit artifacts. Reading them for project context wastes your window without informing your understanding. Read `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` (the merged result) instead.

## Why this file exists

Kiro reads `.kiro/steering/*.md` files automatically. Without a Kiro-specific steering file, a Kiro session on this project would have no awareness of the audit-doc discipline, the documentation map, the Smithsonian-grade quality bar, the non-destructive overlay rule, or the per-phase update protocol — and would risk saturating context by reading the per-entry staging files. The same hub-and-spoke pattern applies to `.cursor/rules/project-context.mdc` (for Cursor) and `.github/copilot-instructions.md` (for Copilot); canonical content lives in `CLAUDE.md`, vendor-specific files are pointers only.
