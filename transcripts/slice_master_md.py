#!/usr/bin/env python3
"""Slice CLEANED_TRANSCRIPTS_REVIEW.md into per-entry chunks.

Pass 4 (Session 4) cross-contamination firewall: each subagent is scoped to ONE
entry by reading only its slice file + its Pass 3 staging file + the corpus.
The master MD is never read directly by a subagent, eliminating the data path
through which prior parallel runs blended content across entries.

Outputs:
  transcripts/per_entry_slices/entry_NN.md  — one slice per audit-able entry
  transcripts/per_entry_slices/manifest.json — entry_num -> subject + raw_dir + slice_path + pass3_path

Re-runnable; overwrites slices.
"""
import json
import re
from pathlib import Path

MASTER = Path(r"C:\civil\transcripts\CLEANED_TRANSCRIPTS_REVIEW.md")
OUT_DIR = Path(r"C:\civil\transcripts\per_entry_slices")
PASS3_DIR = Path(r"C:\civil\transcripts\pass3_stage")
RAW_DIR = Path(r"C:\civil\transcripts\raw")

SKIP = {28, 31, 46, 64, 95}
ENTRY_RANGE = range(1, 133)

OUT_DIR.mkdir(exist_ok=True)

content = MASTER.read_text(encoding="utf-8")

heading_re = re.compile(r"^### (\d+)\. (.+?)$", re.MULTILINE)
matches = list(heading_re.finditer(content))

entry_starts = {}
for m in matches:
    n = int(m.group(1))
    subject = m.group(2).strip()
    entry_starts.setdefault(n, (m.start(), subject))

manifest = {}
warnings = []

for n in ENTRY_RANGE:
    if n in SKIP:
        continue
    if n not in entry_starts:
        warnings.append(f"Entry {n}: no heading found in master MD")
        continue

    start, subject = entry_starts[n]

    next_starts = [s for k, (s, _) in entry_starts.items() if s > start]
    end = min(next_starts) if next_starts else len(content)

    section = content[start:end].rstrip() + "\n"

    source_match = re.search(r"\*\*Source\*\*:\s*`transcripts/raw/([^`]+)/`", section)
    raw_dir_name = source_match.group(1) if source_match else None
    if raw_dir_name and not (RAW_DIR / raw_dir_name).exists():
        warnings.append(f"Entry {n}: declared raw dir '{raw_dir_name}' does not exist")

    slice_path = OUT_DIR / f"entry_{n}.md"
    slice_path.write_text(section, encoding="utf-8")

    pass3_path = PASS3_DIR / f"entry_{n}.md"
    has_pass3 = pass3_path.exists()
    if not has_pass3:
        warnings.append(f"Entry {n}: no Pass 3 staging file")

    manifest[n] = {
        "entry_num": n,
        "subject": subject,
        "raw_dir": raw_dir_name,
        "slice_path": str(slice_path).replace("\\", "/"),
        "pass3_path": str(pass3_path).replace("\\", "/") if has_pass3 else None,
        "slice_size_bytes": len(section.encode("utf-8")),
    }

manifest_path = OUT_DIR / "manifest.json"
manifest_path.write_text(
    json.dumps({"generated": "2026-05-22", "skip_set": sorted(SKIP), "entries": manifest}, indent=2),
    encoding="utf-8",
)

total_bytes = sum(e["slice_size_bytes"] for e in manifest.values())
print(f"Sliced {len(manifest)} entries, total {total_bytes:,} bytes")
print(f"Manifest: {manifest_path}")
if warnings:
    print(f"\nWarnings ({len(warnings)}):")
    for w in warnings[:20]:
        print(f"  {w}")
