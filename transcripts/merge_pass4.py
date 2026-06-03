#!/usr/bin/env python3
"""Merge Session 4 Pass 4 sweeping QA + fact-check staging files into master CLEANED_TRANSCRIPTS_REVIEW.md.

Pass 4 was a one-transcript-per-agent sweep (cross-contamination firewall) — each entry's
staging file lives at transcripts/pass4_stage/entry_NN.md and contains a single
"#### Pass 4 sweeping QA + fact-check (2026-05-22)" block.

Inserts the Pass 4 block AFTER any existing Pass 3 consolidation block but BEFORE the closing
--- of each entry's section. Updates the Status line to add "Pass 4 complete." and updates the
Progress Tracker row's Pass 4 column.
"""
import re
from pathlib import Path

MASTER = Path(r"D:\civil\transcripts\CLEANED_TRANSCRIPTS_REVIEW.md")
STAGE = Path(r"D:\civil\transcripts\pass4_stage")

SKIP = {28, 31, 46, 64, 95}
entries_to_merge = [n for n in range(1, 133) if n not in SKIP]

content = MASTER.read_text(encoding="utf-8")
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
        warnings.append(f"No Pass 4 staging file for entry {n}")
        continue

    pass4_block = stage_file.read_text(encoding="utf-8").strip()

    heading_re = re.compile(rf"^### {n}\. ", re.MULTILINE)
    heading_match = heading_re.search(content)
    if not heading_match:
        warnings.append(f"No heading for entry {n}")
        continue

    next_heading_re = re.compile(r"^### \d+\. ", re.MULTILINE)
    next_match = next_heading_re.search(content, heading_match.end())
    section_end = next_match.start() if next_match else len(content)

    section = content[heading_match.start():section_end]

    if "#### Pass 4 sweeping QA + fact-check (2026-05-22)" in section:
        warnings.append(f"Entry {n}: Pass 4 already present, skipping")
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

    # Update Status line to add "Pass 4 complete."
    status_re = re.compile(r"^(- \*\*Status\*\*:[^\n]*?)$", re.MULTILINE)
    def status_repl(m):
        s = m.group(1)
        if "Pass 4 complete" in s:
            return s
        if "Pass 3 complete" in s:
            return s.rstrip(".") + ". Pass 4 complete."
        return s.rstrip(".") + ". Pass 4 complete."

    new_before = status_re.sub(status_repl, before_closing, count=1)

    new_section = new_before + "\n\n" + pass4_block + closing_and_after

    content = content[:heading_match.start()] + new_section + content[section_end:]
    merged.append(n)

# Update Progress Tracker rows: add Pass 4 column entry for each merged entry.
# The tracker format after Pass 3 is `| N | ... | 2026-05-22 | 2026-05-22 | 2026-05-22 |`
# (Pass 1 / Pass 2 / Pass 3 columns). Pass 4 was not previously tracked. We add a Pass 4 column
# header + a 2026-05-22 cell per merged row. Only do this if a Pass 4 column doesn't already exist.
if "| Pass 4 |" not in content:
    # Add Pass 4 column to the header row and the separator row
    tracker_header_re = re.compile(
        r"(\| Entry \| Subject \| Pass 1 \| Pass 2 \| Pass 3) \|",
    )
    new_content, hdr_count = tracker_header_re.subn(r"\1 | Pass 4 |", content)
    if hdr_count == 1:
        content = new_content
        # Separator row: |---|---|---|---|---| -> |---|---|---|---|---|---|
        sep_re = re.compile(r"^\|---\|---\|---\|---\|---\|\s*$", re.MULTILINE)
        content = sep_re.sub("|---|---|---|---|---|---|", content, count=1)
        # Per-entry rows: add ` 2026-05-22 |` at end of row for each merged entry
        for n in merged:
            row_re = re.compile(
                rf"(\| {n}\s+\|[^\n]+?\| 2026-05-22[^|]*\| 2026-05-22[^|]*\| 2026-05-22[^|]*\|)\s*$",
                re.MULTILINE,
            )
            new_content, count = row_re.subn(rf"\1 2026-05-22 |", content)
            if count == 1:
                content = new_content
            else:
                warnings.append(
                    f"Progress tracker Pass-4 cell add failed for entry {n} (matches={count})"
                )
    else:
        warnings.append(f"Progress tracker header not updated (matches={hdr_count})")

MASTER.write_text(content, encoding="utf-8")

print(f"Merged Pass 4 for {len(merged)} entries.")
print(f"Master file: {original_len:,} -> {len(content):,} chars (+{len(content)-original_len:,})")
if warnings:
    print(f"\nWarnings {len(warnings)}:")
    for w in warnings[:30]:
        print(f"  {w}")
