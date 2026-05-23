#!/usr/bin/env python3
"""Phase 1a follow-on cross-contamination cleanup.

Reads `transcripts/cross_contamination_audit.json` and physically removes each
candidate row marked `action: physically_remove` from the master
`CLEANED_TRANSCRIPTS_REVIEW.md`.

This is the follow-on to Phase 1a (`fix_cross_contamination.py`). Where Phase 1a
addressed 22 manually-enumerated items from `OPEN_PROBLEMS.md` Problem 2, this
script addresses additional cross-contamination items that Pass 4's strict
one-transcript-per-agent sweep surfaced, plus a handful of Pass 3 "DROP —
unrecoverable" items whose retraction directive never made it into a Pass 4
block annotation in the master MD.

The script is idempotent: re-running detects that the row no longer exists in
its expected section and skips. Pre/post Pass-1/Pass-2/Pass-3 row counts are
printed per affected entry.

Usage:
  python transcripts/fix_cross_contamination_pass4.py            # apply
  python transcripts/fix_cross_contamination_pass4.py --dry-run  # preview
"""
from __future__ import annotations

import io
import json
import re
import sys
from pathlib import Path

# Force UTF-8 console output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

MASTER = Path(r"C:\civil\transcripts\CLEANED_TRANSCRIPTS_REVIEW.md")
AUDIT = Path(r"C:\civil\transcripts\cross_contamination_audit.json")


def entry_section_bounds(content: str, n: int) -> tuple[int, int]:
    heading_re = re.compile(rf"^### {n}\. ", re.MULTILINE)
    m = heading_re.search(content)
    if not m:
        raise ValueError(f"No heading for entry #{n}")
    next_heading_re = re.compile(r"^### \d+\. ", re.MULTILINE)
    nxt = next_heading_re.search(content, m.end())
    end = nxt.start() if nxt else len(content)
    return m.start(), end


def find_all_row_lines_in_pre_pass4(section: str, row_id: str) -> list[tuple[int, int, str]]:
    """Return ALL row lines whose ID matches row_id in the section, but ONLY in the
    portion of the section BEFORE the Pass 4 block (so we don't remove the Pass 4
    audit-trail annotations).

    This covers: Pass 1 corrections, Pass 2 corrections, Pass 3 missed-pattern
    catches, Pass 3 confidence resolutions, Pass 3 adversarial-review flags,
    tail-sweep corrections, and any other pre-Pass-4 table.
    """
    # Find Pass 4 block boundary
    p4_marker = "#### Pass 4 sweeping QA + fact-check"
    p4_idx = section.find(p4_marker)
    search_end = p4_idx if p4_idx != -1 else len(section)

    pattern = re.compile(rf"^\|\s*{re.escape(row_id)}(?=\s*(?:\(|\||[A-Za-z\"'_]| /|→))", re.MULTILINE)
    matches = []
    for m in pattern.finditer(section, 0, search_end):
        line_end = section.find("\n", m.end())
        if line_end == -1:
            line_end = search_end
        if line_end > search_end:
            continue
        line = section[m.start():line_end]
        pipes = line.count("|")
        if pipes < 3:
            continue
        matches.append((m.start(), line_end, line))
    return matches


_STOPWORDS = {
    "the", "and", "of", "to", "in", "a", "an", "is", "for", "or",
    "this", "that", "with", "as", "by", "at", "be", "are", "was",
    "from", "row", "rows", "pass", "pass1", "pass2", "pass3", "pass4",
    "transcript", "raw", "spot", "check", "grep", "appear", "appears",
    "actually", "low", "medium", "high", "correct", "n/a", "kept",
    "RETRACT", "RETRACTED", "DROP", "Remove", "removed", "NOT",
}


def _content_tokens(text: str) -> set[str]:
    """Extract content-bearing tokens from a row line / reason for fuzzy matching.
    Returns lowercased significant words/proper nouns."""
    # Strip markdown table syntax, normalize whitespace
    text = re.sub(r"[|*\"_`]", " ", text)
    # Tokenize on non-word boundaries (but keep apostrophes inside words)
    tokens = re.findall(r"[A-Za-z][A-Za-z'-]+", text)
    return {t.lower() for t in tokens if len(t) >= 3 and t.lower() not in _STOPWORDS}


def _significant_content_tokens_from_reason(reason: str) -> set[str]:
    """From a retraction reason like '59.P2.9 Jane Rosette -> Jan Rosett |...',
    extract the distinctive content tokens (typically the row's whisper-form and
    suggested correction)."""
    # The reason has format like "| ROW_ID NAME_ARROW_CORRECTION | confidence | ..."
    # Heuristic: take tokens from the first column (between first two | symbols)
    parts = reason.split("|")
    # Use the part after row_id mention, before next pipe
    # For example: "| 59.P2.9 Jane Rosette -> Jan Rosett | low | low (kept) | ..."
    # parts[1] = " 59.P2.9 Jane Rosette -> Jan Rosett "
    if len(parts) < 2:
        return _content_tokens(reason)
    head = parts[1]
    # Strip the row ID
    head = re.sub(r"^\s*\d+\.[\dPRELOC\[\]]+\s*", "", head)
    return _content_tokens(head)


def _candidate_matches_row(reason: str, row_line: str) -> bool:
    """Return True if the row content seems to correspond to the candidate's reason.

    Strategy: extract the distinctive content tokens from both, and require
    significant overlap.
    """
    reason_tokens = _significant_content_tokens_from_reason(reason)
    row_tokens = _content_tokens(row_line)
    if not reason_tokens:
        return True  # can't tell, default-trust
    overlap = reason_tokens & row_tokens
    # Require at least 1 distinctive overlap, OR if there are <=2 distinct tokens,
    # require all to match
    if len(reason_tokens) <= 2:
        return overlap == reason_tokens
    return len(overlap) >= 1


def find_row_line(section: str, row_id: str, reason: str | None = None) -> tuple[int, int, str] | None:
    """Return the FIRST pre-Pass-4 row line whose ID matches row_id and (if reason
    provided) whose content overlaps the reason's content. Returns None otherwise."""
    matches = find_all_row_lines_in_pre_pass4(section, row_id)
    if not matches:
        return None
    if reason is None:
        matches.sort(key=lambda x: x[0])
        return matches[0]
    # Filter by content match
    filtered = [m for m in matches if _candidate_matches_row(reason, m[2])]
    if not filtered:
        return None
    filtered.sort(key=lambda x: x[0])
    return filtered[0]


def count_correction_rows_in_section(section: str) -> dict[str, int]:
    """Count rows in each table type. For pre/post-state delta tracking."""
    counts = {
        "pass1": 0,
        "pass2": 0,
        "pass3_missed_pattern": 0,
        "pass3_confidence_resolution": 0,
        "pass3_adversarial_flag": 0,
        "pass2_reloc": 0,
    }
    # Pass 1: bare numeric IDs in 6+ pipe rows
    counts["pass1"] = len(re.findall(r"^\| \d+\.\d+\s+\|", section, re.MULTILINE))
    # Pass 2 direct IDs
    counts["pass2"] = len(re.findall(r"^\| \d+\.P2\.\d+ \|", section, re.MULTILINE))
    counts["pass2_reloc"] = len(re.findall(r"^\| \d+\.P2\.RELOC\[", section, re.MULTILINE))
    counts["pass3_missed_pattern"] = len(re.findall(r"^\| \d+\.P3\.\d+ \|", section, re.MULTILINE))
    return counts


def remove_row(content: str, entry_number: int, row_id: str, reason: str | None = None) -> tuple[str, str, int]:
    """Remove pre-Pass-4 occurrences of the row whose content matches the reason.

    Returns (new_content, status, n_removed) where status is one of:
      - 'removed': at least one row was found and removed
      - 'already_clean': row not present (already removed in a prior run)
      - 'entry_not_found': entry section couldn't be located
      - 'no_content_match': row IDs found but none matched the reason's content
    """
    try:
        sec_start, sec_end = entry_section_bounds(content, entry_number)
    except ValueError:
        return content, "entry_not_found", 0
    section = content[sec_start:sec_end]
    all_matches = find_all_row_lines_in_pre_pass4(section, row_id)
    if not all_matches:
        return content, "already_clean", 0

    # Filter to rows whose content matches the reason
    if reason is None:
        matches = all_matches
    else:
        matches = [m for m in all_matches if _candidate_matches_row(reason, m[2])]
        if not matches:
            return content, "no_content_match", 0

    # Remove from last to first so earlier indices stay valid
    matches.sort(key=lambda x: -x[0])
    new_section = section
    n_removed = 0
    for line_start, line_end, _line in matches:
        if line_end < len(new_section) and new_section[line_end] == "\n":
            line_end += 1
        new_section = new_section[:line_start] + new_section[line_end:]
        n_removed += 1
    new_content = content[:sec_start] + new_section + content[sec_end:]
    return new_content, "removed", n_removed


def main(dry_run: bool = False) -> int:
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    content = MASTER.read_text(encoding="utf-8")
    original_len = len(content)

    candidates_to_remove = [
        c for c in audit["candidates"] if c.get("action") == "physically_remove"
    ]

    # Pre-state row counts per affected entry
    affected_entries = sorted({c["entry_number"] for c in candidates_to_remove})
    pre_counts = {}
    for n in affected_entries:
        try:
            s, e = entry_section_bounds(content, n)
            pre_counts[n] = count_correction_rows_in_section(content[s:e])
        except ValueError:
            pre_counts[n] = {"pass1": -1, "pass2": -1, "pass3_missed_pattern": -1, "pass3_confidence_resolution": -1, "pass3_adversarial_flag": -1, "pass2_reloc": -1}

    removed_log = []
    skipped_log = []
    warnings = []

    for cand in candidates_to_remove:
        entry = cand["entry_number"]
        row_id = cand["row_id"]
        reason = cand.get("retraction_reason", "")
        new_content, status, n_removed = remove_row(content, entry, row_id, reason=reason)
        if status == "removed":
            content = new_content
            removed_log.append((entry, row_id, n_removed, reason[:120]))
        elif status == "already_clean":
            skipped_log.append((entry, row_id, "row not present (already cleaned?)"))
        elif status == "no_content_match":
            # This is the expected idempotency state for candidates like 59.P2.9
            # where the legit row with the same ID remains but the contaminated
            # references were removed in a prior run.
            skipped_log.append((
                entry, row_id,
                "row ID present but content does not match candidate's reason — "
                "the contaminated references were likely removed in a prior run; "
                "the remaining row with this ID is a different (legitimate) row"
            ))
        else:
            warnings.append((entry, row_id, status))

    # Post-state row counts
    post_counts = {}
    for n in affected_entries:
        try:
            s, e = entry_section_bounds(content, n)
            post_counts[n] = count_correction_rows_in_section(content[s:e])
        except ValueError:
            post_counts[n] = {"pass1": -1, "pass2": -1, "pass3_missed_pattern": -1, "pass3_confidence_resolution": -1, "pass3_adversarial_flag": -1, "pass2_reloc": -1}

    print("=" * 78)
    print(
        f"Phase 1a follow-on cross-contamination cleanup ({'DRY RUN' if dry_run else 'APPLYING'})"
    )
    print("=" * 78)
    print()
    total_lines_removed = sum(r[2] for r in removed_log)
    print(f"Removal candidates processed: {len(removed_log)} (total row lines deleted across all candidates: {total_lines_removed})")
    for entry, row_id, n_removed, reason in removed_log:
        multi = f" [{n_removed} lines]" if n_removed > 1 else ""
        print(f"  #{entry} {row_id}{multi}: {reason}")
    print()
    print(f"Skipped (idempotent / no-op): {len(skipped_log)}")
    for entry, row_id, reason in skipped_log:
        print(f"  #{entry} {row_id}: {reason}")
    if warnings:
        print()
        print(f"Warnings: {len(warnings)}")
        for entry, row_id, reason in warnings:
            print(f"  #{entry} {row_id}: {reason}")

    print()
    print("Per-entry correction-row count delta:")
    for n in affected_entries:
        pre = pre_counts[n]
        post = post_counts[n]
        deltas = []
        for k in pre:
            if post[k] != pre[k]:
                deltas.append(f"{k} {pre[k]}->{post[k]}")
        if deltas:
            print(f"  #{n}: {' | '.join(deltas)}")
        else:
            print(f"  #{n}: no change")

    print()
    print(f"Master file: {original_len:,} -> {len(content):,} chars "
          f"({len(content) - original_len:+,})")

    if not dry_run:
        MASTER.write_text(content, encoding="utf-8")
        print(f"\nWrote {MASTER}")
    else:
        print("\n(dry-run; no write)")

    return 0


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    sys.exit(main(dry_run=dry))
