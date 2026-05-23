#!/usr/bin/env python3
"""Patch Progress Tracker to add Pass 4 column. One-shot script complementing merge_pass4.py."""
import re
from pathlib import Path

MASTER = Path(r"C:\civil\transcripts\CLEANED_TRANSCRIPTS_REVIEW.md")
SKIP = {28, 31, 46, 64, 95}

content = MASTER.read_text(encoding="utf-8")
original_len = len(content)

if "| Pass 4 |" in content:
    print("Pass 4 column already present; nothing to do.")
    raise SystemExit(0)

header_re = re.compile(
    r"^(\| #   \| Interview\s+\| Pass 1\s+\| Pass 2 \| Pass 3) \|\s*$",
    re.MULTILINE,
)
content, hdr_count = header_re.subn(r"\1 | Pass 4     |", content, count=1)
assert hdr_count == 1, f"Header replace count={hdr_count}"

sep_re = re.compile(
    r"^\|-----\|---+\|------------\|--------\|--------\|\s*$",
    re.MULTILINE,
)
content, sep_count = sep_re.subn(
    "|-----|--------------------------------------------------------------------------|------------|--------|--------|------------|",
    content, count=1,
)
assert sep_count == 1, f"Separator replace count={sep_count}"

merged = 0
warnings = []
for n in range(1, 133):
    if n in SKIP:
        continue
    row_re = re.compile(
        rf"^(\| {n}\s+\| [^\n]+? \| 2026-05-22[^|]*\| 2026-05-22[^|]*\| 2026-05-22[^|]*\|)\s*$",
        re.MULTILINE,
    )
    new_content, count = row_re.subn(rf"\1 2026-05-22 |", content, count=1)
    if count == 1:
        content = new_content
        merged += 1
    else:
        warnings.append(f"row {n}: matches={count}")

MASTER.write_text(content, encoding="utf-8")
print(f"Patched {merged} entries. file: {original_len:,} -> {len(content):,} chars (+{len(content)-original_len:,})")
if warnings:
    print(f"Warnings ({len(warnings)}):")
    for w in warnings[:20]:
        print(f"  {w}")
