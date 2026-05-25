"""
Ingest a single new interview transcript into the audit overlay system.

Workflow (see transcripts/ingestion/README.md for full context):
  1. Validate that raw/<entry_dir>/ has the expected file structure
     (.srt + .txt + .vtt; .summary.txt optional).
  2. Bootstrap corrected/<entry_dir>/ by copying the three transcript
     files from raw/, plus an initial manifest.json carrying the
     ingestion provenance (ingestion_date, source_archive, optional
     LoC item URL once resolved).
  3. Resolve the entry's interviewee to its LoC item via the existing
     resolver (XML first, PDF fallback).
  4. Heal against LoC using the existing heal_one_entry.py pipeline
     (conservative-first-pass discipline; audit-canon safeguard).
  5. Stage file emitted to pass8_stage/entry_<NNN>_<slug>.md.
  6. Append a Session-N follow-on entry to AUDIT_TRAIL.md.

This is the primary ingestion pipeline for transcripts that arrive AFTER
the original 127-entry audit was completed. New transcripts do NOT need
to re-run Passes 1-7 -- the master MD's accumulated corrections + the
378-entry civil_rights_facts.json corpus + LoC's authoritative text
together provide the full correction substrate.

Usage:
  python transcripts/ingestion/ingest_new_transcript.py <entry_dir_name>
  python transcripts/ingestion/ingest_new_transcript.py <entry_dir_name> --skip-heal
  python transcripts/ingestion/ingest_new_transcript.py <entry_dir_name> --loc-item-url URL
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import time
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TRANSCRIPTS = ROOT / "transcripts"
RAW_DIR = TRANSCRIPTS / "raw"
CORRECTED_DIR = TRANSCRIPTS / "corrected"
LOC_HEALING = TRANSCRIPTS / "loc_healing"

EXPECTED_SUFFIXES = (".srt", ".txt", ".vtt")


def _entry_files(raw_entry_dir: Path) -> dict:
    """Find the .srt / .txt / .vtt / summary files in a raw entry directory.
    Returns {'srt': Path, 'txt': Path, 'vtt': Path, 'summary': Path | None}."""
    out: dict[str, Path | None] = {"srt": None, "txt": None, "vtt": None, "summary": None}
    for p in raw_entry_dir.iterdir():
        if not p.is_file():
            continue
        if "_summary_" in p.name and p.suffix == ".txt":
            out["summary"] = p
        elif p.suffix == ".srt":
            out["srt"] = p
        elif p.suffix == ".txt":
            out["txt"] = p
        elif p.suffix == ".vtt":
            out["vtt"] = p
    return out


def _validate_raw_entry(raw_entry_dir: Path) -> tuple[bool, str]:
    if not raw_entry_dir.is_dir():
        return False, f"raw entry directory not found: {raw_entry_dir}"
    files = _entry_files(raw_entry_dir)
    missing = [k for k in ("srt", "txt", "vtt") if files[k] is None]
    if missing:
        return False, f"missing required file(s): {missing}"
    return True, "ok"


def _bootstrap_corrected(raw_entry_dir: Path, entry_dir_name: str, subject: str) -> Path:
    """Copy raw transcript files into corrected/<entry>/. Initialize manifest.json."""
    corrected_entry_dir = CORRECTED_DIR / entry_dir_name
    corrected_entry_dir.mkdir(parents=True, exist_ok=True)
    files = _entry_files(raw_entry_dir)
    for k in ("srt", "txt", "vtt"):
        src = files[k]
        if src is None:
            continue
        dest = corrected_entry_dir / src.name
        shutil.copyfile(src, dest)
    # Initial manifest
    manifest = {
        "generated": date.today().isoformat(),
        "script_version": "ingestion-1.0",
        "raw_dir": entry_dir_name,
        "entry_subject": subject,
        "ingestion": {
            "ingestion_date": date.today().isoformat(),
            "source": "transcripts/ingestion/ingest_new_transcript.py",
            "notes": "Initial bootstrap from raw/. Heals applied via Pass 8 LoC architecture.",
        },
        "applied_corrections": [],
        "pending_context": [],
        "skipped_rows": [],
        "files_processed": [files[k].name for k in ("srt", "txt", "vtt") if files[k]],
        "stats": {"applied": 0, "pending": 0, "skipped": 0},
        "review_history": {
            "correction_passes_complete": [],
            "audit_sweeps_complete": [],
            "pass_count_total": 1,
            "ingestion_only": True,
        },
        "known_issues": [],
    }
    (corrected_entry_dir / "manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )
    return corrected_entry_dir


def _resolve_loc(subject: str, loc_item_url_override: str | None = None) -> dict:
    """Call resolver scripts. Returns the final resolution record dict."""
    if loc_item_url_override:
        cmd = [
            sys.executable, str(LOC_HEALING / "resolve_by_item_url.py"),
            "--subject", subject, "--item-url", loc_item_url_override,
        ]
        print(f"  [resolver] direct-resolve via known item URL: {loc_item_url_override}")
        proc = subprocess.run(cmd, capture_output=True, text=True, cwd=str(ROOT))
        sys.stdout.write(proc.stdout)
        if proc.returncode != 0:
            sys.stderr.write(proc.stderr)
            raise RuntimeError("direct-resolve failed")
    else:
        cmd = [sys.executable, str(LOC_HEALING / "resolve_loc_items.py"), "--only", subject]
        print(f"  [resolver] search by subject name: {subject!r}")
        proc = subprocess.run(cmd, capture_output=True, text=True, cwd=str(ROOT))
        sys.stdout.write(proc.stdout)
        if proc.returncode != 0:
            sys.stderr.write(proc.stderr)
            raise RuntimeError("resolver failed")
    safe = re.sub(r"[^A-Za-z0-9_]+", "_", subject)
    res_path = LOC_HEALING / "loc_cache" / f"{safe}.resolution.json"
    if not res_path.is_file():
        raise RuntimeError(f"resolution.json not created at {res_path}")
    record = json.loads(res_path.read_text(encoding="utf-8"))
    # If we got no_transcript, try the PDF fallback
    if record.get("status") == "no_transcript":
        print(f"  [resolver] no XML; running PDF fallback...")
        cmd = [sys.executable, str(LOC_HEALING / "resolve_pdf_fallback.py"), "--only", subject]
        proc = subprocess.run(cmd, capture_output=True, text=True, cwd=str(ROOT))
        sys.stdout.write(proc.stdout)
        if proc.returncode != 0:
            sys.stderr.write(proc.stderr)
        record = json.loads(res_path.read_text(encoding="utf-8"))
    return record


def _run_heal_one(entry_dir_name: str) -> int:
    """Invoke heal_one_entry.py heal_one for the given entry."""
    cmd = [sys.executable, str(LOC_HEALING / "heal_one_entry.py"),
           "heal_one", entry_dir_name]
    proc = subprocess.run(cmd, capture_output=True, text=True, cwd=str(ROOT))
    sys.stdout.write(proc.stdout)
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr)
    return proc.returncode


def _parse_subject_from_dir(entry_dir_name: str) -> str:
    m = re.match(r"^(.*?)_interview_\d{8}_\d{6}$", entry_dir_name)
    if not m:
        raise SystemExit(
            f"Cannot parse subject from {entry_dir_name!r}. Expected format: "
            "<Subject>_interview_<YYYYMMDD>_<HHMMSS>"
        )
    return m.group(1)


def _append_audit_trail_subentry(entry_dir_name: str, subject: str, resolution: dict, heal_rc: int) -> None:
    audit_trail = TRANSCRIPTS / "AUDIT_TRAIL.md"
    if not audit_trail.is_file():
        print(f"  [warn] AUDIT_TRAIL.md not found at {audit_trail}; skipping append")
        return
    text = audit_trail.read_text(encoding="utf-8")
    status = resolution.get("status", "unknown")
    loc_url = resolution.get("loc_item_url") or (resolution.get("best_match") or {}).get("url", "(unknown)")
    today = date.today().isoformat()
    snippet = (
        f"\n#### Ingestion of `{entry_dir_name}` ({today})\n"
        f"\n"
        f"**Subject:** {subject}  \n"
        f"**LoC status:** {status}  \n"
        f"**LoC item URL:** {loc_url}  \n"
        f"**Heal exit code:** {heal_rc} ({'ok' if heal_rc in (0, 3) else 'failed'})\n"
        f"\n"
        f"Ingested via `transcripts/ingestion/ingest_new_transcript.py`. "
        f"Bootstrapped from `raw/{entry_dir_name}/`, healed against LoC using the "
        f"Pass 8 conservative-first-pass discipline. Per-entry artifact at "
        f"`transcripts/pass8_stage/entry_*_*.md` (slug matches the subject).\n"
    )
    # Insert before "### Session 8" or at the top of the Session log if not found
    marker = "## Session log"
    idx = text.find(marker)
    if idx < 0:
        audit_trail.write_text(text + "\n" + snippet, encoding="utf-8")
        print(f"  [audit] appended ingestion note to end of AUDIT_TRAIL.md")
        return
    # Insert immediately after the Session-log header line
    nl_after = text.find("\n", idx)
    inject_at = nl_after + 1 if nl_after >= 0 else idx + len(marker)
    audit_trail.write_text(text[:inject_at] + snippet + text[inject_at:], encoding="utf-8")
    print(f"  [audit] appended ingestion note near top of Session log")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("entry_dir", help="entry directory name (e.g., 'Jane Doe_interview_20260601_120000')")
    parser.add_argument("--skip-heal", action="store_true",
                        help="bootstrap + resolve only; skip heal_one_entry.py (heal can be run later)")
    parser.add_argument("--loc-item-url", default=None,
                        help="known LoC item URL (bypasses the search-by-name resolver)")
    parser.add_argument("--skip-audit-trail", action="store_true")
    args = parser.parse_args(argv)

    raw_entry_dir = RAW_DIR / args.entry_dir
    print(f"== Ingesting {args.entry_dir} ==")
    ok, msg = _validate_raw_entry(raw_entry_dir)
    if not ok:
        print(f"  [error] {msg}", file=sys.stderr)
        return 1
    print(f"  [validate] {msg}")

    subject = _parse_subject_from_dir(args.entry_dir)
    print(f"  [subject] {subject}")

    print(f"  [bootstrap] copying raw -> corrected/{args.entry_dir}/")
    _bootstrap_corrected(raw_entry_dir, args.entry_dir, subject)

    print(f"  [resolver] resolving LoC item...")
    try:
        resolution = _resolve_loc(subject, args.loc_item_url)
    except Exception as e:  # noqa: BLE001
        print(f"  [error] resolver failed: {e}", file=sys.stderr)
        resolution = {"status": "resolver_error", "error": str(e)}

    status = resolution.get("status")
    print(f"  [resolver] status={status}")
    if args.skip_heal:
        print("  [heal] skipped (--skip-heal)")
        heal_rc = -1
    elif status not in ("ok", "ok_pdf"):
        print(f"  [heal] skipped because LoC has no usable transcript (status={status})")
        heal_rc = -1
    else:
        print(f"  [heal] running heal_one_entry.py heal_one ...")
        heal_rc = _run_heal_one(args.entry_dir)
        print(f"  [heal] exit code: {heal_rc}")

    if not args.skip_audit_trail:
        _append_audit_trail_subentry(args.entry_dir, subject, resolution, heal_rc)

    print()
    print(f"== Ingestion complete: {args.entry_dir} ==")
    print(f"  corrected/<entry>/ written")
    print(f"  LoC resolution: {status}")
    if heal_rc in (0, 3):
        print(f"  heal_one applied (see transcripts/pass8_stage/ for the per-entry artifact)")
    elif heal_rc == -1:
        print(f"  heal skipped — run separately with: python transcripts/loc_healing/heal_one_entry.py heal_one {args.entry_dir!r}")
    else:
        print(f"  heal exited with rc={heal_rc} (failure) — investigate before committing")
    print()
    print("Next: review the per-entry stage file, commit with the entry's raw/ + corrected/ + stage file together.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
