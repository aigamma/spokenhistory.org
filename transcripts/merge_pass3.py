#!/usr/bin/env python3
"""Merge Phase C Pass 3 consolidation staging files into master CLEANED_TRANSCRIPTS_REVIEW.md.

Inserts Pass 3 consolidation block AFTER any existing Pass 2 / Pass 2 tail-sweep tables
but BEFORE the closing --- of each entry.
"""
import re
from pathlib import Path

MASTER = Path(r"D:\civil\transcripts\CLEANED_TRANSCRIPTS_REVIEW.md")
STAGE = Path(r"D:\civil\transcripts\pass3_stage")

SKIP = {28, 31, 46, 64, 95}
entries_to_merge = [n for n in range(1, 133) if n not in SKIP]

content = MASTER.read_text(encoding='utf-8')
original_len = len(content)

merged = []
warnings = []

for n in entries_to_merge:
    # Staging files were renamed 2026-05-22 from entry_N.md to entry_NNN_subject_slug.md
    # for institutional auditability. See transcripts/rename_staging_files.py.
    matches = sorted(STAGE.glob(f"entry_{n:03d}_*.md"))
    if matches:
        stage_file = matches[0]
    else:
        stage_file = STAGE / f"entry_{n}.md"
    if not stage_file.exists():
        warnings.append(f"No Pass 3 staging file for entry {n}")
        continue

    pass3_block = stage_file.read_text(encoding='utf-8').strip()

    heading_re = re.compile(rf"^### {n}\. ", re.MULTILINE)
    heading_match = heading_re.search(content)
    if not heading_match:
        warnings.append(f"No heading for entry {n}")
        continue

    next_heading_re = re.compile(r"^### \d+\. ", re.MULTILINE)
    next_match = next_heading_re.search(content, heading_match.end())
    section_end = next_match.start() if next_match else len(content)

    section = content[heading_match.start():section_end]

    if "#### Pass 3 consolidation (2026-05-22)" in section:
        warnings.append(f"Entry {n}: Pass 3 already present, skipping")
        continue

    # Find closing --- (last one before next entry/EOF)
    closing_sep_re = re.compile(r"\n\n(---\s*)\n", re.MULTILINE)
    seps = list(closing_sep_re.finditer(section))
    if not seps:
        warnings.append(f"Entry {n}: no closing --- found")
        continue
    closing_sep_match = seps[-1]

    before_closing = section[:closing_sep_match.start()]
    closing_and_after = section[closing_sep_match.start():]

    # Update Status line to add "Pass 3 complete."
    status_re = re.compile(r"^(- \*\*Status\*\*:[^\n]*?)$", re.MULTILINE)
    def status_repl(m):
        s = m.group(1)
        if "Pass 3 complete" in s:
            return s
        if "Pass 2 complete" in s:
            return s.rstrip(".") + ". Pass 3 complete."
        # Status line that lacks Pass 2 complete (shouldn't happen post-Phase-A, but safety)
        return s.rstrip(".") + ". Pass 3 complete."

    # Update the Status line within the before_closing slice only
    new_before = status_re.sub(status_repl, before_closing, count=1)

    # Insert Pass 3 block before closing ---
    new_section = new_before + "\n\n" + pass3_block + closing_and_after

    content = content[:heading_match.start()] + new_section + content[section_end:]
    merged.append(n)

# Update Progress Tracker rows: set Pass 3 column to 2026-05-22 for merged entries
for n in merged:
    tracker_re = re.compile(
        rf"(\| {n}\s+\|[^\n]+?\| 2026-05-22[^|]*\| 2026-05-22[^|]*\|)\s*–\s*(\|)",
        re.MULTILINE
    )
    new_content, count = tracker_re.subn(rf"\1 2026-05-22 \2", content)
    if count == 1:
        content = new_content
    else:
        warnings.append(f"Progress tracker Pass-3 update failed for entry {n} (matches={count})")

MASTER.write_text(content, encoding='utf-8')

print(f"Merged Pass 3 for {len(merged)} entries.")
print(f"Master file: {original_len:,} -> {len(content):,} chars (+{len(content)-original_len:,})")
if warnings:
    print(f"\nWarnings {len(warnings)}:")
    for w in warnings[:30]:
        print(f"  {w}")
