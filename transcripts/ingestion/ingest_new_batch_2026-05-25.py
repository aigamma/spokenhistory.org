"""
One-shot driver that ingests the 9 truly-new entries from the 2026-05-25
Dustin-student batch.

For each entry:
  1. text_to_srt.py: convert C:\TRANSCRIPTS\<filename>.txt to raw/<entry>/ format
     with synthesized speaking-rate timestamps.
  2. ingest_new_transcript.py: validate raw → bootstrap corrected → resolve LoC
     → heal_one → write pass8_stage file → append AUDIT_TRAIL entry.

Linear by design: one entry at a time, 1.5s minimum between LoC API requests
(enforced internally by the resolver). Total wall-clock: ~10-15 minutes for
9 entries.

Usage:
    python transcripts/ingestion/ingest_new_batch_2026-05-25.py
    python transcripts/ingestion/ingest_new_batch_2026-05-25.py --dry-run
    python transcripts/ingestion/ingest_new_batch_2026-05-25.py --skip-existing
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BATCH_DIR = Path("C:/TRANSCRIPTS")
RAW_DIR = ROOT / "transcripts" / "raw"

# The 9 entries from the 2026-05-25 batch that extend the corpus.
# Filename match is by substring of `unique_substring` in the actual file name
# (filename is "{subject} oral history interview conducted by ...").
ENTRIES = [
    {
        "subject": "Alfred Moldovan",
        "filename": "Alfred Moldovan oral history interview conducted by Joseph Mosnier in New York, New York, 2011 July 19.txt",
        "category": "A — genuinely new (was not in our corpus)",
    },
    {
        "subject": "C. T. Vivian",
        "filename": "C. T. Vivian oral history interview conducted by Taylor Branch in Atlanta, Georgia, 2011 March 29.txt",
        "category": "A — genuinely new",
    },
    {
        "subject": "David Mercer Ackerman and Satoko Ito Ackerman",
        "filename": "David Mercer Ackerman and Satoko Ito Ackerman oral history interview conducted by Joseph Mosnier in Washington, D.C., 2011 September 20.txt",
        "category": "A — genuinely new (joint interview)",
    },
    {
        "subject": "Gertrude Newsome Jackson",
        "filename": "Gertrude Newsome Jackson oral history interview conducted by LaFleur Paysour in Marvell, Arkansas, 2010 November 22.txt",
        "category": "A — genuinely new",
    },
    {
        "subject": "Myrtle Gonza Glascoe",
        "filename": "Myrtle Gonza Glascoe oral history interview conducted by Dwandalyn Reece in Capitol Heights, Maryland, 2010 November 17.txt",
        "category": "A — genuinely new",
    },
    {
        "subject": "Simeon Wright",
        "filename": "Simeon Wright oral history interview conducted by Joseph Mosnier in Chicago, Illinois, 2011 May 23.txt",
        "category": "A — genuinely new (Emmett Till's cousin)",
    },
    {
        "subject": "Abernathy family",
        "filename": "Abernathy family oral history interview conducted by Hasan Kwame Jeffries in Atlanta, Georgia, and Stuttgart, Germany, 2013 October 10.txt",
        "category": "B — matches existing DEFERRED entry #28",
    },
    {
        "subject": "Geraldine Crawford Bennett, Toni Breaux, and Willie Elliot Jenkins",
        "filename": "Geraldine Crawford Bennett, Toni Breaux, and Willie Elliot Jenkins oral history interview conducted by Joseph Mosnier in Bogalusa, Louisiana, 2011 May 28.txt",
        "category": "B — matches existing SKIPPED entry #46",
    },
    {
        "subject": "John Dudley, Eleanor Stewart, Charles Jarmon, Frances Suggs, Harold Suggs, and Samuel Dove",
        "filename": "John Dudley, Eleanor Stewart, Charles Jarmon, Frances Suggs, Harold Suggs, and Samuel Dove oral history interview conducted by Emilye Crosby in Hyattsville, Maryland, 2013 June 28.txt",
        "category": "B — matches existing SKIPPED entry #64",
    },
]


def _entry_dir_name(subject: str, date: str, time_: str) -> str:
    safe = subject.replace("/", "-").replace("\\", "-").replace(":", "")
    safe = re.sub(r"[\r\n\t]+", " ", safe).strip()
    return f"{safe}_interview_{date}_{time_}"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--skip-existing", action="store_true")
    parser.add_argument("--start-index", type=int, default=1)
    parser.add_argument("--end-index", type=int, default=len(ENTRIES))
    args = parser.parse_args(argv)

    date = "20260525"
    today = datetime.now().strftime("%Y%m%d")
    if today != date:
        print(f"[note] ingestion-date override active: using {date} (today is {today})")

    results = {"ingested": [], "skipped": [], "failed": []}
    for i, entry in enumerate(ENTRIES[args.start_index - 1 : args.end_index],
                              start=args.start_index):
        subject = entry["subject"]
        # Use a deterministic time slot based on entry index so each entry is unique
        time_ = f"16{i:02d}00"
        entry_dir_name = _entry_dir_name(subject, date, time_)
        source_path = BATCH_DIR / entry["filename"]
        if not source_path.is_file():
            print(f"[{i}/{len(ENTRIES)}] {subject!r}: source file MISSING — {source_path}", file=sys.stderr)
            results["failed"].append({"subject": subject, "reason": "source missing"})
            continue
        if args.skip_existing and (RAW_DIR / entry_dir_name).is_dir():
            print(f"[{i}/{len(ENTRIES)}] {subject!r}: SKIP (raw/ already exists)")
            results["skipped"].append({"subject": subject})
            continue
        if args.dry_run:
            print(f"[{i}/{len(ENTRIES)}] WOULD INGEST {subject!r} -> raw/{entry_dir_name}/  ({entry['category']})")
            continue

        print()
        print(f"==== [{i}/{len(ENTRIES)}] {subject!r} ({entry['category']}) ====")

        # Phase 1: text_to_srt.py — make raw/<entry>/
        cmd1 = [
            sys.executable,
            str(ROOT / "transcripts" / "ingestion" / "text_to_srt.py"),
            str(source_path),
            str(RAW_DIR),
            "--subject", subject,
            "--date", date,
            "--time", time_,
        ]
        p1 = subprocess.run(cmd1, capture_output=True, text=True, cwd=str(ROOT))
        sys.stdout.write(p1.stdout)
        if p1.returncode != 0:
            sys.stderr.write(p1.stderr)
            print(f"  [error] text_to_srt failed for {subject!r}")
            results["failed"].append({"subject": subject, "reason": "text_to_srt failed"})
            continue

        # Phase 2: ingest_new_transcript.py — bootstrap corrected + LoC heal
        cmd2 = [
            sys.executable,
            str(ROOT / "transcripts" / "ingestion" / "ingest_new_transcript.py"),
            entry_dir_name,
        ]
        p2 = subprocess.run(cmd2, capture_output=True, text=True, cwd=str(ROOT))
        sys.stdout.write(p2.stdout)
        if p2.returncode != 0:
            sys.stderr.write(p2.stderr)
            print(f"  [warn] ingest_new_transcript exited with rc={p2.returncode}")
            results["ingested"].append({"subject": subject, "entry_dir": entry_dir_name,
                                        "warning": f"ingest rc={p2.returncode}"})
        else:
            results["ingested"].append({"subject": subject, "entry_dir": entry_dir_name})

    print()
    print("==== Batch summary ====")
    print(f"  ingested:  {len(results['ingested'])}")
    print(f"  skipped:   {len(results['skipped'])}")
    print(f"  failed:    {len(results['failed'])}")
    for f in results["failed"]:
        print(f"    FAIL: {f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
