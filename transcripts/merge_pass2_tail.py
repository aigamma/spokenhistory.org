#!/usr/bin/env python3
"""Merge Phase B Pass 2 tail-sweep staging files into master CLEANED_TRANSCRIPTS_REVIEW.md.

Tail-sweep blocks insert AFTER the existing Pass 2 corrections table but BEFORE the closing ---.
"""
import re
from pathlib import Path

MASTER = Path(r"C:\civil\transcripts\CLEANED_TRANSCRIPTS_REVIEW.md")
STAGE = Path(r"C:\civil\transcripts\pass2_tail_stage")

PARTIAL_READS = [1, 6, 7, 8, 12, 13, 14, 17, 20, 26, 29, 30, 34, 38]

content = MASTER.read_text(encoding='utf-8')
original_len = len(content)

merged = []
warnings = []

for n in PARTIAL_READS:
    stage_file = STAGE / f"entry_{n}.md"
    if not stage_file.exists():
        warnings.append(f"No tail-sweep staging file for entry {n}")
        continue

    tail_block = stage_file.read_text(encoding='utf-8').strip()

    # Find this entry's section
    heading_re = re.compile(rf"^### {n}\. ", re.MULTILINE)
    heading_match = heading_re.search(content)
    if not heading_match:
        warnings.append(f"No heading for entry {n}")
        continue

    next_heading_re = re.compile(r"^### \d+\. ", re.MULTILINE)
    next_match = next_heading_re.search(content, heading_match.end())
    section_end = next_match.start() if next_match else len(content)

    section = content[heading_match.start():section_end]

    if "#### Pass 2 tail-sweep (2026-05-22)" in section:
        warnings.append(f"Entry {n}: tail-sweep already present, skipping")
        continue

    if "#### Pass 2 corrections (2026-05-22)" not in section:
        warnings.append(f"Entry {n}: no existing Pass 2 corrections table found, cannot insert tail-sweep after it")
        continue

    # Find the closing "---" that closes this entry's section
    closing_sep_re = re.compile(r"\n\n(---\s*)\n", re.MULTILINE)
    seps = list(closing_sep_re.finditer(section))
    if not seps:
        warnings.append(f"Entry {n}: no closing --- found")
        continue
    closing_sep_match = seps[-1]  # use the LAST --- (which is the section-closing separator)

    # Insert tail block just before the closing ---
    before_closing = section[:closing_sep_match.start()]
    closing_and_after = section[closing_sep_match.start():]

    # Update Status line to remove "Full read still pending" / similar
    new_section = before_closing
    # If a Status line mentions "still pending", flag it as complete now
    status_pending_re = re.compile(r"(- \*\*Status\*\*:[^\n]*?)Full read[^\n]*?still pending\.([^\n]*)")
    new_section_updated, n_status_updates = status_pending_re.subn(
        r"\1Full read complete (tail-sweep applied 2026-05-22).\2",
        new_section
    )
    new_section = new_section_updated

    # Now insert the tail block before the closing separator
    new_section = new_section + "\n\n" + tail_block + closing_and_after

    content = content[:heading_match.start()] + new_section + content[section_end:]
    merged.append(n)

MASTER.write_text(content, encoding='utf-8')

print(f"Merged tail-sweep for {len(merged)} entries: {sorted(merged)}")
print(f"Master file: {original_len:,} -> {len(content):,} chars (+{len(content)-original_len:,})")
if warnings:
    print(f"\nWarnings {len(warnings)}:")
    for w in warnings:
        print(f"  {w}")
