#!/usr/bin/env python3
"""Pass 6 apply-back: write Track 3 + Track 4 resolutions into master MD.

Consumes per-entry resolution JSONs from:
  - transcripts/low_conf_resolutions/entry_NNN.json  (Track 3, 40 entries / 82 items)
  - transcripts/layer5_pending_resolutions/entry_NNN.json  (Track 4, 11 entries / 218 items)

For each resolution item, locates the corresponding row in
transcripts/CLEANED_TRANSCRIPTS_REVIEW.md by (entry_number, row_id), then
mutates the row per the resolution type:

  resolved-high / confirmed
      -> Keep correction cell as-is (unless new_candidate differs, then update).
         Replace [LAYER-5: D2-ambiguous, ensemble-adjudication-pending] with
         [PASS-6: <type> | see transcripts/<resolutions_dir>/entry_NNN.json].

  narrowed / alternate
      -> Update correction cell to new_candidate.
         Replace D2-ambiguous annotation with [PASS-6: <type> | see ...].

  rejected
      -> Keep original correction cell; flag with
         [PASS-6: rejected — speculation without corroboration | see ...].
         The literal Whisper rendering stands as the safer fallback.

  unresolved
      -> Keep correction cell.
         Replace D2-ambiguous annotation with
         [PASS-6: unresolved-escalated-to-ensemble | see ...].

Constraints:
  - Idempotent: re-runs detect existing [PASS-6:] annotations and skip those rows.
  - Atomic: read master MD once, mutate in memory, write back once.
  - Pre/post row-count + annotation-count verification.
  - Reuses infrastructure from transcripts/fix_layer5_findings.py.

CLI:
  python transcripts/apply_low_conf_resolutions.py --dry-run   # preview
  python transcripts/apply_low_conf_resolutions.py             # apply
"""
from __future__ import annotations

import argparse
import io
import json
import re
import sys
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# Reuse the existing master-MD mutation helpers
sys.path.insert(0, str(Path(__file__).parent))
import fix_layer5_findings as helpers  # noqa: E402

CIVIL_ROOT = Path(r"C:\civil")
MASTER = CIVIL_ROOT / "transcripts" / "CLEANED_TRANSCRIPTS_REVIEW.md"
TRACK3_DIR = CIVIL_ROOT / "transcripts" / "low_conf_resolutions"
TRACK4_DIR = CIVIL_ROOT / "transcripts" / "layer5_pending_resolutions"

D2_AMBIGUOUS_ANNOTATION = "[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]"
PASS6_IDEMPOTENCY_MARKER = "[PASS-6:"


def load_resolutions(directory: Path, source_label: str) -> list[dict]:
    """Load all per-entry resolution JSONs from a directory.

    Returns a flat list of items, each enriched with entry_number and
    source_dir_label so we can build the audit annotation later.
    """
    if not directory.exists():
        return []
    flat: list[dict] = []
    for path in sorted(directory.glob("entry_*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            print(f"  ! Failed to parse {path.name}: {e}", file=sys.stderr)
            continue
        entry_number = data.get("entry_number")
        if entry_number is None:
            print(f"  ! No entry_number in {path.name}, skipping", file=sys.stderr)
            continue
        for item in data.get("items", []):
            item["_entry_number"] = entry_number
            item["_source_label"] = source_label
            item["_source_file"] = f"transcripts/{directory.name}/{path.name}"
            flat.append(item)
    return flat


def build_annotation(item: dict) -> str:
    """Build the [PASS-6: ...] annotation for the notes column."""
    resolution = item.get("resolution", "unknown")
    source_file = item.get("_source_file", "")
    if resolution == "rejected":
        return f"[PASS-6: rejected — speculation without corroboration | see {source_file}]"
    if resolution == "unresolved":
        return f"[PASS-6: unresolved-escalated-to-ensemble | see {source_file}]"
    return f"[PASS-6: {resolution} | see {source_file}]"


def remove_d2_ambiguous_marker(notes_cell: str) -> str:
    """Strip the D2-ambiguous Layer 5 annotation from a notes cell.

    Removes both the marker and any surrounding ` // ` separator.
    """
    # Pattern: optional ` // ` before, the marker, optional ` // ` after.
    # We try to collapse cleanly so the cell doesn't get double separators.
    patterns = [
        rf"\s*//\s*{re.escape(D2_AMBIGUOUS_ANNOTATION)}",
        rf"{re.escape(D2_AMBIGUOUS_ANNOTATION)}\s*//\s*",
        re.escape(D2_AMBIGUOUS_ANNOTATION),
    ]
    out = notes_cell
    for pat in patterns:
        out = re.sub(pat, "", out)
    return out


def apply_item_to_section(
    section: str,
    item: dict,
    skip_counts: dict,
    change_counts: dict,
) -> tuple[str, bool]:
    """Apply one resolution item to one entry's section.

    Returns (new_section, mutated_bool).
    """
    row_id = item.get("row_id", "")
    if not row_id:
        skip_counts["no_row_id"] += 1
        return section, False

    located = helpers.find_row_line(section, row_id)
    if located is None:
        skip_counts["row_not_found"] += 1
        return section, False

    start, end, line = located

    # Idempotency: skip if already touched by Pass 6
    if PASS6_IDEMPOTENCY_MARKER in line:
        skip_counts["already_pass6"] += 1
        return section, False

    cells = helpers.split_row_cells(line)
    if len(cells) < 6:
        skip_counts["malformed_row"] += 1
        return section, False

    # Cells: [row_id, whisper, correction, confidence, source, notes]
    notes_cell = cells[-1]

    # 1. Remove D2-ambiguous marker if present
    new_notes = remove_d2_ambiguous_marker(notes_cell)

    # 2. Append Pass 6 annotation
    annotation = build_annotation(item)
    new_notes = helpers.append_to_notes(new_notes, annotation)

    # 3. Update correction cell if resolution warrants it
    resolution = item.get("resolution", "")
    new_candidate = item.get("new_candidate", "")
    original_candidate = item.get("original_candidate", "")

    if resolution in ("narrowed", "alternate", "resolved-high"):
        if new_candidate and new_candidate.strip() != original_candidate.strip():
            cells[2] = f" {new_candidate.strip()} "
            change_counts["correction_updated"] += 1
    elif resolution == "rejected":
        # Original correction stays as the recorded supervisor hypothesis; the
        # rejection annotation flags it. Downstream consumers should treat the
        # whisper rendering as the safer fallback per the Pass 6 evidence.
        pass
    elif resolution == "confirmed":
        # No correction change.
        pass
    elif resolution == "unresolved":
        # No correction change; escalated to ensemble via annotation.
        pass
    else:
        skip_counts["unknown_resolution"] += 1
        # Still apply the annotation though
        pass

    cells[-1] = new_notes
    new_line = helpers.join_row_cells(cells)
    if new_line == line:
        skip_counts["no_change_after_mutation"] += 1
        return section, False

    new_section = section[:start] + new_line + section[end:]
    change_counts[f"resolution_{resolution}"] = change_counts.get(f"resolution_{resolution}", 0) + 1
    change_counts["rows_mutated"] += 1
    return new_section, True


def apply_all(resolutions: list[dict], master_text: str) -> tuple[str, dict, dict]:
    """Apply all resolutions to master_text.

    Strategy: group resolutions by entry, find each entry's section once,
    mutate all of that entry's resolutions, then splice back into master_text.
    """
    # Group by entry
    by_entry: dict[int, list[dict]] = {}
    for item in resolutions:
        n = item["_entry_number"]
        by_entry.setdefault(n, []).append(item)

    skip_counts = {
        "no_row_id": 0,
        "row_not_found": 0,
        "already_pass6": 0,
        "malformed_row": 0,
        "unknown_resolution": 0,
        "no_change_after_mutation": 0,
    }
    change_counts: dict = {
        "rows_mutated": 0,
        "correction_updated": 0,
    }

    out = master_text
    # Process entries in descending order so earlier-section start indices
    # remain valid when we splice later sections back in. (Actually we
    # re-fetch bounds per entry from the updated text, so order matters only
    # within an entry's items.)
    for entry_number in sorted(by_entry.keys()):
        try:
            start, end = helpers.entry_section_bounds(out, entry_number)
        except ValueError as e:
            for item in by_entry[entry_number]:
                skip_counts["row_not_found"] += 1
            print(f"  ! Entry #{entry_number} section not found: {e}", file=sys.stderr)
            continue

        section = out[start:end]

        # Apply items in row-position order within the section. We re-locate
        # each row after each mutation because indices shift.
        for item in by_entry[entry_number]:
            section, _ = apply_item_to_section(section, item, skip_counts, change_counts)

        out = out[:start] + section + out[end:]

    return out, skip_counts, change_counts


def main():
    parser = argparse.ArgumentParser(description="Apply Pass 6 Track 3+4 resolutions to master MD")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    args = parser.parse_args()

    if not MASTER.exists():
        print(f"FATAL: master MD not found at {MASTER}", file=sys.stderr)
        return 1

    print(f"Reading master MD: {MASTER}")
    master_text = MASTER.read_text(encoding="utf-8")
    pre_chars = len(master_text)
    pre_d2_count = master_text.count(D2_AMBIGUOUS_ANNOTATION)
    pre_pass6_count = master_text.count(PASS6_IDEMPOTENCY_MARKER)
    print(f"  pre: {pre_chars:,} chars, {pre_d2_count} D2-ambiguous markers, {pre_pass6_count} existing [PASS-6:] markers")

    print(f"\nLoading Track 3 resolutions from {TRACK3_DIR}")
    track3 = load_resolutions(TRACK3_DIR, "track3")
    print(f"  {len(track3)} Track 3 items loaded")

    print(f"\nLoading Track 4 resolutions from {TRACK4_DIR}")
    track4 = load_resolutions(TRACK4_DIR, "track4")
    print(f"  {len(track4)} Track 4 items loaded")

    all_items = track3 + track4
    print(f"\nTotal: {len(all_items)} items to apply")

    print("\nApplying...")
    new_text, skip_counts, change_counts = apply_all(all_items, master_text)

    post_chars = len(new_text)
    post_d2_count = new_text.count(D2_AMBIGUOUS_ANNOTATION)
    post_pass6_count = new_text.count(PASS6_IDEMPOTENCY_MARKER)

    print(f"\n=== Result ===")
    print(f"  Rows mutated:           {change_counts['rows_mutated']}")
    print(f"  Correction cells updated: {change_counts['correction_updated']}")
    for k, v in sorted(change_counts.items()):
        if k.startswith("resolution_"):
            print(f"    {k:30s} {v}")
    print(f"\n  Skipped (no row_id):           {skip_counts['no_row_id']}")
    print(f"  Skipped (row_not_found):       {skip_counts['row_not_found']}")
    print(f"  Skipped (already_pass6):       {skip_counts['already_pass6']}")
    print(f"  Skipped (malformed_row):       {skip_counts['malformed_row']}")
    print(f"  Skipped (unknown_resolution):  {skip_counts['unknown_resolution']}")
    print(f"  Skipped (no_change_after_mut): {skip_counts['no_change_after_mutation']}")
    print(f"\n  Pre/post chars:        {pre_chars:,} → {post_chars:,} (delta {post_chars - pre_chars:+,})")
    print(f"  D2-ambiguous markers:  {pre_d2_count} → {post_d2_count} (delta {post_d2_count - pre_d2_count:+d})")
    print(f"  [PASS-6:] markers:     {pre_pass6_count} → {post_pass6_count} (delta {post_pass6_count - pre_pass6_count:+d})")

    if args.dry_run:
        print("\n[DRY RUN] Master MD not modified.")
        return 0

    print(f"\nWriting master MD: {MASTER}")
    MASTER.write_text(new_text, encoding="utf-8")
    print(f"  Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
