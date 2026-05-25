"""
Sequential per-entry driver for Pass 8 healing.

Iterates through entries listed in transcripts/corrected/ alphabetically (which
matches the master MD entry numbering closely). For each entry that has its LoC
XML cached, runs heal_one_entry.py heal_one (= phase1 + apply + verify).

Linear by design -- one entry at a time, no concurrency.

Usage:
  python process_batch.py --start 2 --end 6      # process the 2nd through 6th entries
  python process_batch.py --start 2 --count 5    # process 5 entries starting at the 2nd
  python process_batch.py --skip-existing        # skip entries already staged
  python process_batch.py --dry-run              # list what would be processed
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TRANSCRIPTS = ROOT / "transcripts"
CORRECTED = TRANSCRIPTS / "corrected"
LOC_CACHE = TRANSCRIPTS / "loc_healing" / "loc_cache"
PASS8_STAGE = TRANSCRIPTS / "pass8_stage"
HEAL_SCRIPT = TRANSCRIPTS / "loc_healing" / "heal_one_entry.py"


def list_entries() -> list[str]:
    return sorted(d.name for d in CORRECTED.iterdir() if d.is_dir())


def subject_safe(entry_dir: str) -> str:
    m = re.match(r"^(.*?)_interview_\d{8}_\d{6}$", entry_dir)
    if not m:
        return ""
    return re.sub(r"[^A-Za-z0-9_]+", "_", m.group(1))


def has_loc_xml(entry_dir: str) -> bool:
    s = subject_safe(entry_dir)
    return (LOC_CACHE / f"{s}.xml").is_file()


def has_loc_pdf_text(entry_dir: str) -> bool:
    s = subject_safe(entry_dir)
    return (LOC_CACHE / f"{s}.pdf.txt").is_file()


def has_any_loc_source(entry_dir: str) -> bool:
    return has_loc_xml(entry_dir) or has_loc_pdf_text(entry_dir)


def has_resolution(entry_dir: str) -> bool:
    s = subject_safe(entry_dir)
    return (LOC_CACHE / f"{s}.resolution.json").is_file()


def resolution_status(entry_dir: str) -> str:
    s = subject_safe(entry_dir)
    rp = LOC_CACHE / f"{s}.resolution.json"
    if not rp.is_file():
        return "(not yet resolved)"
    try:
        return json.loads(rp.read_text(encoding="utf-8")).get("status", "unknown")
    except Exception:
        return "(parse error)"


def already_staged(entry_dir: str) -> bool:
    s = subject_safe(entry_dir).lower()
    if not s:
        return False
    candidates = list(PASS8_STAGE.glob(f"entry_*_{s}.md"))
    return bool(candidates)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=1, help="1-based index of first entry to process")
    parser.add_argument("--end", type=int, default=None, help="1-based index of last entry (inclusive)")
    parser.add_argument("--count", type=int, default=None, help="number of entries to process from --start")
    parser.add_argument("--skip-existing", action="store_true", help="skip entries that already have a pass8_stage file")
    parser.add_argument("--dry-run", action="store_true", help="list what would be processed, don't run")
    args = parser.parse_args(argv)

    entries = list_entries()
    if args.end is None and args.count is not None:
        args.end = args.start + args.count - 1
    if args.end is None:
        args.end = len(entries)

    selected = entries[args.start - 1 : args.end]
    print(f"Selected {len(selected)} entries (range {args.start}..{args.end} of {len(entries)}):")

    results = {"healed": [], "skipped_no_xml": [], "skipped_no_resolution": [], "skipped_staged": [],
               "failed": []}

    for i, entry in enumerate(selected, start=args.start):
        s = subject_safe(entry)
        if args.skip_existing and already_staged(entry):
            print(f"  [{i:3d}/{len(entries)}] {entry[:65]}  -> SKIP (already staged)")
            results["skipped_staged"].append(entry)
            continue
        if not has_resolution(entry):
            status = "(no resolution yet)"
            print(f"  [{i:3d}/{len(entries)}] {entry[:65]}  -> SKIP {status}")
            results["skipped_no_resolution"].append(entry)
            continue
        if not has_any_loc_source(entry):
            status = resolution_status(entry)
            print(f"  [{i:3d}/{len(entries)}] {entry[:65]}  -> SKIP (no LoC source, status={status})")
            results["skipped_no_xml"].append(entry)
            continue
        if args.dry_run:
            print(f"  [{i:3d}/{len(entries)}] {entry[:65]}  -> WOULD HEAL")
            continue
        print(f"  [{i:3d}/{len(entries)}] {entry[:65]}  -> healing...")
        proc = subprocess.run(
            [sys.executable, str(HEAL_SCRIPT), "heal_one", entry],
            capture_output=True, text=True, cwd=str(ROOT)
        )
        # Print last 4 lines of the script output (the summary)
        out_tail = "\n".join(proc.stdout.strip().splitlines()[-5:])
        print("        " + out_tail.replace("\n", "\n        "))
        if proc.returncode == 0:
            results["healed"].append(entry)
        else:
            print(f"        STDERR: {proc.stderr[:500]}")
            results["failed"].append(entry)

    print()
    print("=== Batch summary ===")
    for k, v in results.items():
        print(f"  {k}: {len(v)}")
    return 0 if not results["failed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
