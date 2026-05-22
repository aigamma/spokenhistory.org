#!/usr/bin/env python3
"""Merge Phase A Pass 2 staging files into master CLEANED_TRANSCRIPTS_REVIEW.md."""
import re
from pathlib import Path

MASTER = Path(r"C:\civil\transcripts\CLEANED_TRANSCRIPTS_REVIEW.md")
STAGE = Path(r"C:\civil\transcripts\pass2_stage")

SKIP = {46, 64, 95}
entries_to_merge = [n for n in range(43, 133) if n not in SKIP]

content = MASTER.read_text(encoding='utf-8')
original_len = len(content)

merged = []
skipped = []
warnings = []

for n in entries_to_merge:
    stage_file = STAGE / f"entry_{n}.md"
    if not stage_file.exists():
        warnings.append(f"No staging file for entry {n}")
        continue

    pass2_block = stage_file.read_text(encoding='utf-8').strip()

    # Find this entry's section
    heading_re = re.compile(rf"^### {n}\. ", re.MULTILINE)
    heading_match = heading_re.search(content)
    if not heading_match:
        warnings.append(f"No heading for entry {n}")
        continue

    # Find end of this entry's section (next ### heading or EOF)
    next_heading_re = re.compile(r"^### \d+\. ", re.MULTILINE)
    next_match = next_heading_re.search(content, heading_match.end())
    section_end = next_match.start() if next_match else len(content)

    section = content[heading_match.start():section_end]

    # Already merged?
    if "#### Pass 2 corrections (2026-05-22)" in section:
        skipped.append(f"Entry {n}: Pass 2 table already present")
        continue

    # 1. Find the Status line within this section
    status_line_re = re.compile(r"^(- \*\*Status\*\*: Pass 1[^\n]*)$", re.MULTILINE)
    status_line_match = status_line_re.search(section)
    if not status_line_match:
        warnings.append(f"Entry {n}: no Status line found")
        continue

    # 2. Find the closing "---" of this entry's section (search backward from end)
    # Pattern: a "---" line preceded by blank line, somewhere after the Status line
    # We'll look for the LAST "---" before the next entry heading
    closing_sep_re = re.compile(r"\n\n(---\s*)\n", re.MULTILINE)
    # Find all separators after the status line position
    seps = list(closing_sep_re.finditer(section, status_line_match.end()))
    if not seps:
        warnings.append(f"Entry {n}: no closing --- found after Status")
        continue
    # Use the FIRST --- after the status (which closes this entry)
    closing_sep_match = seps[0]

    # Update Status text
    old_status = status_line_match.group(1)
    if "Pass 2" in old_status and "Awaiting" not in old_status:
        # Status already mentions Pass 2; leave alone
        new_status = old_status
    elif "Awaiting Pass 2" in old_status:
        new_status = old_status.replace("Awaiting Pass 2", "Pass 2 complete")
    elif "Awaiting (a)" in old_status:
        # "Awaiting (a) X, (b) Pass 2" -> "Pass 2 complete"
        new_status = re.sub(r"Awaiting \([a-z]\)[^.]*\.", "Pass 2 complete.", old_status)
        if "Pass 2 complete" not in new_status:
            new_status = old_status.rstrip(".") + ". Pass 2 complete."
    else:
        # No mention of Pass 2; just append
        new_status = old_status.rstrip(".") + ". Pass 2 complete."

    # Build new section content:
    # [content before status] + new_status + [content between status and closing ---] + Pass 2 block + closing ---
    before_status = section[:status_line_match.start()]
    between = section[status_line_match.end():closing_sep_match.start()]
    after_sep = section[closing_sep_match.end():]
    closing = closing_sep_match.group(0)  # the "\n\n---\n" itself

    new_section = (
        before_status
        + new_status
        + between
        + "\n\n"
        + pass2_block
        + closing
        + after_sep
    )
    content = content[:heading_match.start()] + new_section + content[section_end:]
    merged.append(n)

# Update Progress Tracker rows for merged entries
for n in merged:
    tracker_re = re.compile(
        rf"(\| {n}\s+\|[^\n]+?\| 2026-05-22[^|]*?\|)\s*–\s*(\|\s*–\s*\|)",
        re.MULTILINE
    )
    new_content, count = tracker_re.subn(rf"\1 2026-05-22 \2", content)
    if count == 1:
        content = new_content
    else:
        warnings.append(f"Progress tracker update failed for entry {n} (matches={count})")

MASTER.write_text(content, encoding='utf-8')

print(f"Merged {len(merged)} entries: {sorted(merged)}")
print(f"Master file: {original_len:,} -> {len(content):,} chars (+{len(content)-original_len:,})")
if skipped:
    print(f"\nSkipped {len(skipped)}:")
    for s in skipped[:5]:
        print(f"  {s}")
    if len(skipped) > 5:
        print(f"  ... and {len(skipped)-5} more")
if warnings:
    print(f"\nWarnings {len(warnings)}:")
    for w in warnings[:30]:
        print(f"  {w}")
