#!/usr/bin/env python3
"""Phase 1a cross-contamination cleanup.

Per `OPEN_PROBLEMS.md` Problem 2, ~22 Pass-2 rows were written into the wrong
entry's table during Session 2's parallel-supervisor Phase A. Most of those
rows were self-flagged by the Pass-2 author at write time (with a "NOTE: not
in this transcript" or "Removed; appears in #X" annotation) but were never
physically removed, so they remained in the master overlay with a "Removed"
label. Pass 3 then surfaced them as a coherent punch-list.

This script performs the physical cleanup:

  - **Drop** actions: remove the row from the source entry's Pass-2 table.
  - **Move to #X** actions: remove from source, append to target's Pass-2
    table with a relocation marker (`74.P2.RELOC.N (orig 73.P2.3)`) and a
    notes-column annotation recording the relocation date.
  - **Prose edit** side-effects for #102.P2.17/18: targeted text replacements
    in #102's Subject paragraph and Pass-2 Notes section to remove the
    Flagler/E.G. Chase/Brewster-Jacksonville detail that was cross-
    contaminated from #103 Hayling, and to de-name "Mayor Calhoun" to "the
    mayor" (the transcript never names the mayor).

The script is idempotent: re-runs detect that the source rows no longer exist
and skip those items. Relocated rows in the target are marked with a stable
`RELOC` suffix and date stamp so the script can detect already-applied moves.

Pre/post row-count verification is printed so a human can sanity-check that
exactly the expected number of rows were removed from each source and added
to each target.
"""
import re
import sys
from pathlib import Path

MASTER = Path(r"C:\civil\transcripts\CLEANED_TRANSCRIPTS_REVIEW.md")
RELOC_DATE = "2026-05-22"

# Items NOT in this manifest (intentionally skipped):
#   - 25.13: not cross-contamination; two Whisper variants of the SAME person
#     within #25's own transcript. Pass 3 already flagged for adversarial.
#   - 110.P2.16: legitimate row (Su City -> Sioux City) referenced in Pass 1
#     #110.5. The Pass 3 confidence-resolutions block mis-cited it with
#     content from a different row; the Pass 2 row itself is correct.

ACTIONS = [
    # (source_entry, row_id, action, target_entry_or_None, justification)
    # ---- Drops (Pass 2 self-flagged "not in this transcript") ----
    (61, "61.P2.83", "drop", None,
     "Pass 2 self-flag 'this is in #63 Churchville not Rosenberg'; Pass 3 confirmed drop."),
    (62, "62.P2.78", "drop", None,
     "Pass 2 self-flag 'John Rosenberg path not Carlos'; Pass 3 confirmed drop."),
    (80, "80.P2.16", "drop", None,
     "Pass 3: cannot disambiguate Shaw conference 'Frank Lyle' attendee from "
     "Whisper artifact; flagged for adversarial; row carries no correction."),
    (81, "81.P2.69", "drop", None,
     "Pass 2 self-flag 'Found in entry 80; not entry 81'; Pass 3 procedural noise."),
    (82, "82.P2.26", "drop", None,
     "Pass 3 'not verbatim in transcript' (shoe-sizing string passage)."),
    (83, "83.P2.65", "drop", None,
     "Pass 2 self-flag 'Bobby Fletcher NOT in #83 transcript'; cross-corpus ref only."),
    (83, "83.P2.67", "drop", None,
     "Pass 2 self-flag 'Sammy Younge NOT in #83 transcript'; cross-corpus ref only."),
    (87, "87.P2.25", "drop", None,
     "Pass 2 self-flag 'appears in Jones #85 not Perry'; housekeeping deletion."),
    (87, "87.P2.26", "drop", None,
     "Pass 2 self-flag 'Maynard Moore reference not Perry'; housekeeping deletion."),
    (102, "102.P2.17", "drop+prose", None,
     "Meta-row about #102 Subject/Notes prose contamination from #103 Hayling. "
     "Row dropped; prose fix applied to remove Flagler/E.G. Chase/Brewster sentence."),
    (102, "102.P2.18", "drop+prose", None,
     "Meta-row about 'Mayor Calhoun' name unsourced in #102 prose. Row dropped; "
     "prose fix applied to replace 'Mayor Calhoun' with 'the mayor' (transcript "
     "only refers to 'the mayor' by title)."),
    (104, "104.P2.49", "drop", None,
     "Pass 2 self-flag 'no such reference in Sobol's transcript'; Pass 3 drop."),
    (105, "105.P2.91", "drop", None,
     "Pass 2 self-flag 'cross-reference Sobol #104.P2.40; not Tuttle's life'; Pass 3 drop."),
    (110, "110.P2.78", "drop", None,
     "Pass 2 self-flag 'NOT present in this transcript (cross-corpus from Carter #108)'."),
    (129, "129.P2.213", "drop", None,
     "Self-cancellation row: 'unread tail' marker contradicts entry's full-read status."),
    # ---- Moves ----
    (71, "71.P2.20", "move", 73,
     "Pass 2 self-flag 'does NOT appear in Becton — appears in #73 Cleaver'."),
    (73, "73.P2.3", "move", 74,
     "Pass 2 self-flag 'This row belongs to #74 Kay Tillow context'."),
    (73, "73.P2.52", "move", 74,
     "Pass 2 self-flag 'This row not from Cleaver' (Crete -> Coretta — Tillow context)."),
    (73, "73.P2.57", "move", 74,
     "Pass 2 self-flag 'Not from Cleaver; appears in #74 Tillow' (Carl/Anne Braden)."),
    (83, "83.P2.58", "move", 85,
     "Pass 2 self-flag 'confused with Mary Jones #85' (a Lang city)."),
    (116, "116.P2.10", "move", 119,
     "Pass 2 self-flag 'not in Bates transcript; cross-reference 119.32 noted'."),
    (117, "117.P2.46", "move", 116,
     "Pass 2 self-flag 'not mentioned in Sherrod transcript; from Bates #116 catalog confusion'."),
    # 130.P2.115 — adversarial-flag row, not a Pass 2 correction row.
    # The canonical "Rev. Eric Schiller (UCLA SCOPE)" content already lives at
    # 129.P2.115. The #130 flag is noise pointing at #129; drop the flag from
    # the adversarial-review feed (which Phase 1c will re-aggregate cleanly
    # against the post-cleanup MD).
    (130, "130.P2.115", "drop-adversarial-flag", None,
     "Adversarial-flag noise; canonical row already at 129.P2.115 Rev. Eric Schiller."),
]

PROSE_EDITS = [
    # (description, old_text, new_text)
    (
        "#110.P2.16: Annotate the Pass 3 confidence-resolutions row that mis-cited "
        "110.P2.16's content as 'White Fair Hotel' (which is from #108 Carter). The "
        "actual Pass-2 row at 110.P2.16 is the legitimate 'Su City -> Sioux City' "
        "correction. Mark the Pass-3 row as a supervisor mis-attribution.",
        "| 110.P2.16 with her marriage, I was known as White Fair Hotel | cross-corpus reference from #108 (Carter) — NOT present in #110 | This Pass-2 row appears to be a cross-reference artifact; verify it does not actually appear in #110 transcript. |",
        "| 110.P2.16 (RESOLVED 2026-05-22 Phase 1a — Pass-3 supervisor mis-attribution) | Pass-3 cited content 'White Fair Hotel' is NOT row 110.P2.16. Actual row 110.P2.16 is the legitimate 'Su City -> Sioux City' correction cross-referencing Pass 1 #110.5. The 'White Fair Hotel' content belongs to #108 Carter; no row 110.P2.16 contains it. Pass-2 row preserved. | (no action needed) |",
    ),
    (
        "#102.P2.18: Remove unsourced 'Mayor Calhoun' name from Subject paragraph "
        "(transcript only says 'the mayor').",
        "via Mayor Calhoun (acquired land for $35,000 reserved",
        "via the mayor (acquired land for $35,000 reserved",
    ),
    (
        "#102.P2.17: Remove cross-contaminated Flagler/E.G. Chase/Brewster-Jacksonville "
        "sentence from Pass 2 Notes (that pathway belongs to #103 Hayling, not Blake).",
        "left him for dead. Blake was treated initially at Flagler Hospital but transferred via mortician E.G. Chase's hearse to Brewster Hospital in Jacksonville for treatment by Black physicians. Forty years later",
        "left him for dead. Blake recovered in Dallas TX at Bishop College's relocated faculty housing (under the school president's care) before returning to Shreveport. Forty years later",
    ),
    (
        "#102.P2.17: Remove the corresponding 'Brewster Hospital / Flagler / E.G. Chase "
        "cross-contamination' enumeration entry from #102's anomaly list (it referred to "
        "an error that this script's prose edit has now corrected).",
        "1. **Brewster Hospital / Flagler / E.G. Chase cross-contamination**: Pass 1 Notes for #102 erroneously attribute the Flagler-Chase-Brewster Jacksonville Black-hospital pathway to Blake's care — but the transcript clearly states Blake went to Dallas (Bishop College's relocated faculty housing). The Brewster Jacksonville detail is actually from Hayling #103's account; the Pass 1 Notes accidentally migrated it across.",
        "1. **Brewster Hospital / Flagler / E.G. Chase cross-contamination** [RESOLVED 2026-05-22 Phase 1a]: Original Pass 1 Notes for #102 erroneously attributed the Flagler-Chase-Brewster Jacksonville Black-hospital pathway to Blake's care. Phase 1a cleanup script removed the contaminated sentence from the Pass 2 Notes section and replaced it with the correct Dallas / Bishop College detail from the transcript.",
    ),
]


def entry_section_bounds(content: str, n: int) -> tuple[int, int]:
    """Return (start, end) char offsets of entry `### n.` section (up to next entry or EOF)."""
    heading_re = re.compile(rf"^### {n}\. ", re.MULTILINE)
    m = heading_re.search(content)
    if not m:
        raise ValueError(f"No heading for entry #{n}")
    next_heading_re = re.compile(r"^### \d+\. ", re.MULTILINE)
    nxt = next_heading_re.search(content, m.end())
    end = nxt.start() if nxt else len(content)
    return m.start(), end


def find_pass2_row(section: str, row_id: str) -> tuple[int, int, str] | None:
    """Find the Pass-2 corrections row whose ID matches row_id exactly.

    Returns (line_start_in_section, line_end_in_section, line_text), or None.

    The Pass-2 row has the form: `| <row_id> | ... |` on a single line.
    There may be a similarly-prefixed row in the Pass-3 confidence-resolutions
    block, which has the form `| <row_id> <description> | ... | ... | ... |`
    (without the leading-column separator). We want the first form only.
    """
    pattern = re.compile(rf"^\| {re.escape(row_id)} \| ", re.MULTILINE)
    for m in pattern.finditer(section):
        line_end = section.find("\n", m.end())
        if line_end == -1:
            line_end = len(section)
        line = section[m.start():line_end]
        # Confirm it's a Pass-2-style row: 6 pipe-delimited columns
        # (`| ID | whisper | correction | confidence | source | notes |`)
        if line.count("|") >= 6:
            return m.start(), line_end, line
    return None


def find_pass3_resolution_row(section: str, row_id: str) -> tuple[int, int, str] | None:
    """Find the Pass-3 confidence-resolutions row referencing this ID."""
    # Pass 3 resolution row format: `| <row_id> ... | <old conf> | <new conf> | <notes> |`
    # The ID line is space-separated from description in Pass 3, not pipe-separated.
    pattern = re.compile(rf"^\| {re.escape(row_id)} ", re.MULTILINE)
    for m in pattern.finditer(section):
        line_end = section.find("\n", m.end())
        if line_end == -1:
            line_end = len(section)
        line = section[m.start():line_end]
        # 4-column Pass-3 row, not 6-column Pass-2 row
        col_count = line.count("|")
        if 4 <= col_count <= 5:
            return m.start(), line_end, line
    return None


def count_pass2_rows(section: str) -> int:
    """Count Pass-2 corrections rows in a section."""
    # Find the Pass-2 table by header
    pass2_header_re = re.compile(
        r"#### Pass 2 corrections \(\d{4}-\d{2}-\d{2}\)", re.MULTILINE
    )
    m = pass2_header_re.search(section)
    if not m:
        return 0
    # Find next #### or ### heading after the Pass-2 header
    next_heading_re = re.compile(r"^#### ", re.MULTILINE)
    nxt = next_heading_re.search(section, m.end() + 1)
    table_end = nxt.start() if nxt else len(section)
    table_text = section[m.end():table_end]
    # Pass-2 rows: `| <NN>.P2.<row> | ... ` OR relocated rows `| <NN>.P2.RELOC[...] | ...`
    direct = re.findall(r"^\| \d+\.P2\.\d+ \| ", table_text, re.MULTILINE)
    reloc = re.findall(r"^\| \d+\.P2\.RELOC\[[^\]]+\] \| ", table_text, re.MULTILINE)
    return len(direct) + len(reloc)


def parse_row_columns(row_line: str) -> list[str]:
    """Parse a markdown table row into stripped column values (excludes leading/trailing empty)."""
    parts = row_line.strip().strip("|").split("|")
    return [p.strip() for p in parts]


def append_relocated_row(
    content: str, target_entry: int, source_row_id: str, source_row_line: str
) -> str:
    """Append a relocated row to target_entry's Pass-2 corrections table.

    Detects existing relocations (by stable `RELOC[source_row_id]` marker) to
    enable idempotent re-runs. The new row uses a synthetic ID
    `<target>.P2.RELOC[<source_row_id>]` and preserves the original whisper,
    correction, confidence, source columns. The notes column is replaced with
    a relocation provenance line.
    """
    target_start, target_end = entry_section_bounds(content, target_entry)
    target_section = content[target_start:target_end]

    # Idempotency check
    reloc_marker = f"P2.RELOC[{source_row_id}]"
    if reloc_marker in target_section:
        return content  # already moved

    # Parse the source row
    cols = parse_row_columns(source_row_line)
    # Expected: [id, whisper, correction, confidence, source, notes]
    if len(cols) < 6:
        # Fallback: emit a structured raw record
        whisper = cols[1] if len(cols) > 1 else "(unparsed)"
        correction = cols[2] if len(cols) > 2 else "(unparsed)"
        confidence = cols[3] if len(cols) > 3 else "n/a"
        src = cols[4] if len(cols) > 4 else "n/a"
        orig_notes = " | ".join(cols[5:]) if len(cols) > 5 else ""
    else:
        _, whisper, correction, confidence, src, *rest = cols
        orig_notes = " | ".join(rest)

    new_id = f"{target_entry}.{reloc_marker}"
    new_notes = (
        f"Relocated from #{source_row_id} on {RELOC_DATE} (Phase 1a cross-contamination "
        f"cleanup). Original notes: {orig_notes}"
    )
    new_row = f"| {new_id} | {whisper} | {correction} | {confidence} | {src} | {new_notes} |"

    # Find target's Pass-2 corrections table and append to it
    pass2_header_re = re.compile(
        r"#### Pass 2 corrections \(\d{4}-\d{2}-\d{2}\)", re.MULTILINE
    )
    m = pass2_header_re.search(target_section)
    if not m:
        raise ValueError(f"No Pass 2 corrections table in entry #{target_entry}")
    # Find next #### heading or section end
    next_header_re = re.compile(r"^#### ", re.MULTILINE)
    nxt = next_header_re.search(target_section, m.end() + 1)
    table_end_in_section = nxt.start() if nxt else len(target_section)

    # Walk back from table_end_in_section to find the last non-empty, non-separator line
    # Append our new row right after it.
    table_text = target_section[m.end():table_end_in_section]
    # Find last `| <ID> | ...` row
    last_row_match = None
    for rm in re.finditer(r"^\| [^|\n]+\|", table_text, re.MULTILINE):
        last_row_match = rm
    if last_row_match is None:
        raise ValueError(
            f"Could not locate last Pass-2 row in entry #{target_entry}'s table"
        )
    # Insert after the last row's line
    insert_at_in_table = table_text.find("\n", last_row_match.end())
    if insert_at_in_table == -1:
        insert_at_in_table = len(table_text)
    insert_at_in_section = m.end() + insert_at_in_table
    new_target_section = (
        target_section[:insert_at_in_section]
        + "\n"
        + new_row
        + target_section[insert_at_in_section:]
    )
    return content[:target_start] + new_target_section + content[target_end:]


def drop_pass2_row(content: str, source_entry: int, row_id: str) -> str:
    """Physically remove the Pass-2 row from source_entry's table. Idempotent."""
    src_start, src_end = entry_section_bounds(content, source_entry)
    section = content[src_start:src_end]
    found = find_pass2_row(section, row_id)
    if found is None:
        return content  # already removed
    line_start, line_end, _ = found
    # Remove the row line plus its trailing newline if present
    if line_end < len(section) and section[line_end] == "\n":
        line_end += 1
    new_section = section[:line_start] + section[line_end:]
    return content[:src_start] + new_section + content[src_end:]


def find_adversarial_flag_row(section: str, row_id: str) -> tuple[int, int, str] | None:
    """Find an adversarial-flag row by row_id (4-column format)."""
    pattern = re.compile(rf"^\| {re.escape(row_id)} \| ", re.MULTILINE)
    for m in pattern.finditer(section):
        line_end = section.find("\n", m.end())
        if line_end == -1:
            line_end = len(section)
        line = section[m.start():line_end]
        # Adversarial-flag row: exactly 4 pipes (3 columns)
        if line.count("|") == 4:
            return m.start(), line_end, line
    return None


def drop_adversarial_flag(content: str, source_entry: int, row_id: str) -> str:
    """Physically remove an adversarial-flag row from source_entry's
    Adversarial-review flags sub-table. Idempotent."""
    src_start, src_end = entry_section_bounds(content, source_entry)
    section = content[src_start:src_end]
    found = find_adversarial_flag_row(section, row_id)
    if found is None:
        return content  # already removed
    line_start, line_end, _ = found
    if line_end < len(section) and section[line_end] == "\n":
        line_end += 1
    new_section = section[:line_start] + section[line_end:]
    return content[:src_start] + new_section + content[src_end:]


def apply_prose_edit(content: str, old_text: str, new_text: str) -> tuple[str, bool]:
    """Apply a literal string substitution. Returns (new_content, changed)."""
    if old_text in content:
        return content.replace(old_text, new_text, 1), True
    if new_text in content:
        return content, False  # already applied
    return content, False  # not found (warn)


def main(dry_run: bool = False) -> int:
    content = MASTER.read_text(encoding="utf-8")
    original_len = len(content)

    # Pre-state row counts
    pre_counts = {}
    affected_entries = set()
    for src, _row, _act, tgt, _just in ACTIONS:
        affected_entries.add(src)
        if tgt is not None:
            affected_entries.add(tgt)
    for n in sorted(affected_entries):
        s, e = entry_section_bounds(content, n)
        pre_counts[n] = count_pass2_rows(content[s:e])

    move_log = []
    drop_log = []
    adv_drop_log = []
    prose_log = []
    skipped_log = []

    # Apply each action
    for source_entry, row_id, action, target_entry, justification in ACTIONS:
        src_start, src_end = entry_section_bounds(content, source_entry)
        section = content[src_start:src_end]

        if action == "drop-adversarial-flag":
            found = find_adversarial_flag_row(section, row_id)
            if found is None:
                skipped_log.append((source_entry, row_id, action, "adversarial flag not present"))
                continue
            content = drop_adversarial_flag(content, source_entry, row_id)
            adv_drop_log.append((source_entry, row_id, justification))
            continue

        found = find_pass2_row(section, row_id)
        if found is None:
            skipped_log.append((source_entry, row_id, action, "row not present (already cleaned?)"))
            continue
        _, _, row_line = found

        if action == "move":
            content = append_relocated_row(content, target_entry, row_id, row_line)
            content = drop_pass2_row(content, source_entry, row_id)
            move_log.append((source_entry, row_id, target_entry, justification))
        elif action in ("drop", "drop+prose"):
            content = drop_pass2_row(content, source_entry, row_id)
            drop_log.append((source_entry, row_id, justification))
        else:
            skipped_log.append((source_entry, row_id, action, f"unknown action {action}"))

    # Apply prose edits
    for desc, old_text, new_text in PROSE_EDITS:
        content, changed = apply_prose_edit(content, old_text, new_text)
        prose_log.append((desc, "applied" if changed else "skipped (not found / already applied)"))

    # Post-state row counts
    post_counts = {}
    for n in sorted(affected_entries):
        s, e = entry_section_bounds(content, n)
        post_counts[n] = count_pass2_rows(content[s:e])

    print("=" * 70)
    print(f"Phase 1a cross-contamination cleanup ({'DRY RUN' if dry_run else 'APPLYING'})")
    print("=" * 70)
    print(f"\nMoves applied: {len(move_log)}")
    for src, row, tgt, just in move_log:
        print(f"  #{src} {row} -> #{tgt}: {just[:80]}")
    print(f"\nDrops applied: {len(drop_log)}")
    for src, row, just in drop_log:
        print(f"  #{src} {row}: {just[:80]}")
    print(f"\nAdversarial-flag drops applied: {len(adv_drop_log)}")
    for src, row, just in adv_drop_log:
        print(f"  #{src} {row}: {just[:80]}")
    print(f"\nProse edits: {len(prose_log)}")
    for desc, status in prose_log:
        print(f"  [{status}] {desc[:80]}")
    print(f"\nSkipped (idempotent / no-op): {len(skipped_log)}")
    for entry, row, action, reason in skipped_log:
        print(f"  #{entry} {row} ({action}): {reason}")

    print("\nPer-entry Pass-2 row count delta:")
    for n in sorted(affected_entries):
        delta = post_counts[n] - pre_counts[n]
        sign = "+" if delta > 0 else ""
        print(f"  #{n}: {pre_counts[n]} -> {post_counts[n]} ({sign}{delta})")

    total_delta = sum(post_counts[n] - pre_counts[n] for n in affected_entries)
    print(f"\nTotal Pass-2 row delta: {total_delta:+d}")
    print(f"Master file: {original_len:,} -> {len(content):,} chars "
          f"({len(content) - original_len:+,})")

    if not dry_run:
        MASTER.write_text(content, encoding="utf-8")
        print(f"\nWrote {MASTER}")
    else:
        print("\n(dry-run; no write)")
    return 0


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    sys.exit(main(dry_run=dry))
