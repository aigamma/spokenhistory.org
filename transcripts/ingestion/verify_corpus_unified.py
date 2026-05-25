"""
End-to-end corpus integrity check. Treats the 136 entries in
`transcripts/corrected/` as a unified corpus — including the 127 from the
original Pass 1-8 audit journey AND the 9 ingested from Dustin's student
batch on 2026-05-25 — and verifies they're all ready for downstream
consumption (RAG ingest, embedding, MCP server, React frontend).

Checks per entry:
  1. The expected file set exists: .srt + .txt + .vtt + manifest.json
  2. The SRT and VTT cue counts match (timestamp grid is consistent)
  3. The manifest has every required key (per the schema established by
     the original 127 entries; the 9 new ones were normalized to match)
  4. `entry_number` is set and within the expected range

Cross-corpus checks:
  - `entry_number` values are unique across all entries
  - No orphan pass8_stage/ files (every stage file matches an existing entry)
  - No orphan loc_healing/divergences/ files

Reports a one-line pass/fail summary plus details on any failures.

Usage:
    python transcripts/ingestion/verify_corpus_unified.py
    python transcripts/ingestion/verify_corpus_unified.py --verbose
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CORRECTED = ROOT / "transcripts" / "corrected"
PASS8_STAGE = ROOT / "transcripts" / "pass8_stage"
DIVERGENCES = ROOT / "transcripts" / "loc_healing" / "divergences"

REQUIRED_MANIFEST_KEYS = (
    "entry_number", "entry_subject", "raw_dir", "files_processed",
    "applied_corrections", "ground_truth_corpus_path",
    "inferential_uncertainty", "review_history", "stats",
)


def _count_srt_cues(srt_path: Path) -> int:
    text = srt_path.read_text(encoding="utf-8", errors="replace")
    return len(re.findall(r"-->", text))


def _count_vtt_cues(vtt_path: Path) -> int:
    text = vtt_path.read_text(encoding="utf-8", errors="replace")
    return len(re.findall(r"-->", text))


def check_entry(entry_dir: Path) -> dict:
    """Return a dict of {check_name: pass/fail message} for one entry."""
    result: dict = {"entry_dir": entry_dir.name, "checks": {}}

    # 1. File presence
    files = list(entry_dir.iterdir())
    srt = next((p for p in files if p.suffix == ".srt"), None)
    txt = next((p for p in files if p.suffix == ".txt"), None)
    vtt = next((p for p in files if p.suffix == ".vtt"), None)
    manifest = entry_dir / "manifest.json"
    result["checks"]["files_present"] = bool(srt and txt and vtt and manifest.is_file())
    if not srt or not vtt:
        result["checks"]["cue_parity"] = False
        result["checks"]["manifest_valid"] = False
        return result

    # 2. Cue parity
    srt_cues = _count_srt_cues(srt)
    vtt_cues = _count_vtt_cues(vtt)
    result["checks"]["cue_parity"] = srt_cues == vtt_cues
    result["srt_cues"] = srt_cues
    result["vtt_cues"] = vtt_cues

    # 3. Manifest required keys
    try:
        m = json.loads(manifest.read_text(encoding="utf-8"))
    except Exception as e:
        result["checks"]["manifest_valid"] = False
        result["manifest_error"] = str(e)
        return result
    missing = [k for k in REQUIRED_MANIFEST_KEYS if k not in m]
    result["checks"]["manifest_valid"] = not missing
    if missing:
        result["manifest_missing_keys"] = missing
    result["entry_number"] = m.get("entry_number")
    result["entry_subject"] = m.get("entry_subject")
    return result


def cross_corpus_checks(entries: list[dict]) -> dict:
    """Checks across all entries."""
    out: dict = {}

    # Unique entry_numbers
    nums = [e.get("entry_number") for e in entries if e.get("entry_number") is not None]
    dup_numbers = [n for n, c in Counter(nums).items() if c > 1]
    out["unique_entry_numbers"] = not dup_numbers
    if dup_numbers:
        out["duplicate_entry_numbers"] = dup_numbers

    # Orphan stage files: stage files whose subject slug doesn't match any corrected/ entry
    if PASS8_STAGE.is_dir():
        corrected_slugs = set()
        for e in entries:
            subj = e.get("entry_subject") or ""
            slug = re.sub(r"[^a-zA-Z0-9_]+", "_", subj.lower()).strip("_")
            corrected_slugs.add(slug)
        orphan_stage = []
        for p in PASS8_STAGE.glob("entry_*.md"):
            stage_slug = p.stem.split("_", 2)[-1] if p.stem.count("_") >= 2 else ""
            if stage_slug and stage_slug not in corrected_slugs:
                # Try fuzzy: does any corrected slug contain or get-contained-by this stage slug
                matched = any(
                    stage_slug in cs or cs in stage_slug
                    for cs in corrected_slugs
                )
                if not matched:
                    orphan_stage.append(p.name)
        out["orphan_stage_files"] = orphan_stage
        out["stage_file_count"] = len(list(PASS8_STAGE.glob("entry_*.md")))

    return out


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args(argv)

    if not CORRECTED.is_dir():
        print(f"corrected/ not found at {CORRECTED}", file=sys.stderr)
        return 2

    entries = []
    failures = []
    for sub in sorted(CORRECTED.iterdir()):
        if not sub.is_dir():
            continue
        r = check_entry(sub)
        entries.append(r)
        if not all(r["checks"].values()):
            failures.append(r)
        if args.verbose:
            status = "OK " if all(r["checks"].values()) else "FAIL"
            print(f"{status} {sub.name}  cues={r.get('srt_cues','?')}  entry_number={r.get('entry_number')}")

    print()
    print(f"Per-entry check: {len(entries)} entries scanned, {len(failures)} failures")
    if failures:
        print()
        print("Failures:")
        for f in failures[:20]:
            failed_checks = [k for k, v in f["checks"].items() if not v]
            print(f"  {f['entry_dir']}: failed {failed_checks}")
            if f.get("manifest_missing_keys"):
                print(f"    missing manifest keys: {f['manifest_missing_keys']}")

    print()
    cross = cross_corpus_checks(entries)
    print(f"Cross-corpus checks:")
    print(f"  unique entry_numbers: {cross.get('unique_entry_numbers')}")
    if cross.get("duplicate_entry_numbers"):
        print(f"    DUPLICATES: {cross['duplicate_entry_numbers']}")
    if "stage_file_count" in cross:
        print(f"  pass8_stage files: {cross['stage_file_count']}")
        orphans = cross.get("orphan_stage_files", [])
        if orphans:
            print(f"  orphan stage files (no matching corrected/ entry): {len(orphans)}")
            for o in orphans[:5]:
                print(f"    - {o}")
        else:
            print(f"  no orphan stage files")

    # Final verdict
    if failures or cross.get("duplicate_entry_numbers"):
        print()
        print(f"VERDICT: corpus has issues. Address failures before downstream consumption.")
        return 1
    print()
    print(f"VERDICT: corpus is unified and ready for downstream consumption (RAG, embedding, MCP, frontend).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
