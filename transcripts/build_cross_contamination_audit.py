#!/usr/bin/env python3
"""Build the cross-contamination audit JSON.

Reads transcripts/retraction_candidates_raw.json (output of extract_retractions.py)
and cross-references each candidate against the master MD CLEANED_TRANSCRIPTS_REVIEW.md
to determine the current state of each candidate:

  - already_clean: row no longer exists in master MD
  - annotated_but_still_present: row exists; Pass 4 block has a retraction note alongside
  - no_annotation_in_master: row exists; Pass 4 retraction is in staging file but didn't
    carry through to master MD annotation
  - ambiguous_human_review: signal language ambiguous; defer to human review

For "annotated_but_still_present" and "no_annotation_in_master" we propose
action: physically_remove. For "ambiguous_human_review" we propose action:
log_for_human_review.

The script also applies a manual override list for known false positives
(rows where Pass 4 staging language SOUNDS like a retraction but means
something else, e.g. "Remove from adversarial queue" because the correction
was POSITIVELY confirmed).
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Optional

MASTER = Path(r"D:\civil\transcripts\CLEANED_TRANSCRIPTS_REVIEW.md")
RAW_CANDIDATES = Path(r"D:\civil\transcripts\retraction_candidates_raw.json")
AUDIT_OUT = Path(r"D:\civil\transcripts\cross_contamination_audit.json")

# Known false-positive overrides: (entry_number, row_id) -> reason
# These rows look like retraction candidates but are NOT:
#   - Sub-attribution corrections (row stays; column/sub-field changes)
#   - Positive resolutions (Pass 4 confirmed correction; "remove from queue" means
#     remove from adversarial review queue, NOT remove the row from master)
#   - References to rows that should be MAINTAINED with their "(not in transcript)" status
KNOWN_FALSE_POSITIVES = {
    # (8, "8.8"): "Sub-attribution: drop 'Augustus' prefix from canonical Phil Woolpert correction. Row stays.",
    # (8, "8.P2.27"): "Same as 8.8 - sub-attribution correction, row stays.",
    (21, "21.16"): "POSITIVE RESOLUTION: Pass 4 resolved 'Governor Walla' -> William Waller Sr. 'Remove from adversarial queue' = remove the FLAG, not the row.",
    (21, "21.P2.9"): "POSITIVE RESOLUTION: Same as 21.16. Pass 4 confirmed canonical figure.",
    (33, "33.P2.10"): "Sub-candidate retracted (Hudson) but row kept with new primary candidate (Thames).",
    (34, "34.30"): "Row 34.30 is REFERENCED in the demotion note as confirming Kaunda; the retracted row is 34.P2.9, not 34.30.",
    (59, "59.P3.1"): "Pass 4 demotes to low but row stays as 'corpus-level annotation, not Lawson-specific correction'. Not retraction.",
    (66, "66.22"): "Whisper-form-of-record correction (Snick -> Stick) within the row, but canonical correction (SNCC) stands. Row stays with updated Whisper-form.",
    (66, "66.P2.8"): "Sub-attribution corrected (Goldberg, not Brennan). Row stays, attribution updated.",
    (67, "67.P2.8"): "POSITIVE RESOLUTION: speaker-aside about audible clock. 'Remove from adversarial queue' = remove the FLAG, not the row.",
    (71, "71.P2.20"): "Already resolved by Phase 1a Relocation. Pass 4 confirms.",
    (92, "92.5"): "Pass 3 resolves: rejected as proper noun. Row content (Papakain -> Papa came) is retained as 'Whisper-segmentation failure' note.",
    (92, "92.P2.3"): "Same as 92.5; Pass 3 reframes but doesn't physically remove.",
    (101, "101.34"): "POSITIVE RESOLUTION: BB Beamlands -> BB Beaman's resolved. 'Remove from adversarial-review list' = remove the FLAG, not the row.",
    (102, "102.P2.35"): "Row 102.P2.35 is REFERENCED in the note as separately catalogued (Medical Arts Building); NOT being retracted.",
    (104, "104.P2.3"): "Kept-with-caveat per Pass 4 'kept, with Pass 4 caveat'. Not a full removal.",
    (104, "104.P2.28"): "Same as 104.P2.3 - kept with caveat.",
    (104, "104.P2.49"): "Already resolved by Phase 1a drop. Pass 4 audit-completeness log entry.",
    (112, "112.33"): "Pass 1's Sargent Shriver speculation removed but row stays with Bishop John Morris part. Kept-with-correction.",
    # 130 explicit "(not in transcript)" rows: per Pass 4 these were MAINTAINED, not removed
    (130, "130.43"): "Pass 4 says 'Maintained' - row is an intentional cross-corpus reference with explicit '(not in transcript)' content.",
    (130, "130.46"): "Pass 4 says 'Maintained'.",
    (130, "130.50"): "Pass 4 says 'Maintained'.",
    (130, "130.P2.70"): "Pass 4 says 'Maintained'.",
    (130, "130.P2.82"): "Pass 4 says 'Maintained'.",
}


def entry_section_bounds(content: str, n: int) -> tuple[int, int]:
    """Return (start, end) char offsets of entry `### n.` section."""
    heading_re = re.compile(rf"^### {n}\. ", re.MULTILINE)
    m = heading_re.search(content)
    if not m:
        raise ValueError(f"No heading for entry #{n}")
    next_heading_re = re.compile(r"^### \d+\. ", re.MULTILINE)
    nxt = next_heading_re.search(content, m.end())
    end = nxt.start() if nxt else len(content)
    return m.start(), end


def find_pass1_row(section: str, row_id: str) -> Optional[tuple[int, int, str]]:
    """Find a Pass 1 correction row line whose ID matches.

    Pass 1 rows look like: `| 59.14 | Bandit burn | Bannockburn ...`
    """
    pattern = re.compile(rf"^\|\s*{re.escape(row_id)}\s*\|", re.MULTILINE)
    for m in pattern.finditer(section):
        line_end = section.find("\n", m.end())
        if line_end == -1:
            line_end = len(section)
        line = section[m.start():line_end]
        # Confirm it has 6+ pipes (6 columns including outer pipes)
        if line.count("|") >= 6:
            return m.start(), line_end, line
    return None


def find_pass2_row(section: str, row_id: str) -> Optional[tuple[int, int, str]]:
    """Find a Pass 2 corrections row whose ID matches exactly.

    Pass 2 row: `| 59.P2.9 | <whisper> | ...`
    """
    pattern = re.compile(rf"^\| {re.escape(row_id)} \| ", re.MULTILINE)
    for m in pattern.finditer(section):
        line_end = section.find("\n", m.end())
        if line_end == -1:
            line_end = len(section)
        line = section[m.start():line_end]
        if line.count("|") >= 6:
            return m.start(), line_end, line
    return None


def find_pass3_row(section: str, row_id: str) -> Optional[tuple[int, int, str]]:
    """Find a Pass 3 missed-pattern catches row whose ID matches.

    Pass 3 row: `| 59.P3.1 | <span> | <correction> | <conf> | <source> | <context> |`
    """
    pattern = re.compile(rf"^\| {re.escape(row_id)} \| ", re.MULTILINE)
    for m in pattern.finditer(section):
        line_end = section.find("\n", m.end())
        if line_end == -1:
            line_end = len(section)
        line = section[m.start():line_end]
        if line.count("|") >= 6:
            return m.start(), line_end, line
    return None


def find_row_anywhere(section: str, row_id: str) -> Optional[tuple[int, int, str, str]]:
    """Try multiple finder strategies. Returns (line_start, line_end, line_text, table_type)
    or None if not found.

    Looks for the row in any of these locations within an entry's section:
      - Pass 1 corrections table (6+ pipes)
      - Pass 2 corrections table (6+ pipes)
      - Pass 3 missed-pattern catches table (6+ pipes)
      - Pass 3 confidence resolutions table (5 pipes / 4 cols)
      - Pass 3 adversarial-review flags table (4 pipes / 3 cols)
      - Pass 4 adversarial-review flag updates (4 pipes / 3 cols)
      - Tail-sweep corrections (6+ pipes)

    Returns the FIRST occurrence found.
    """
    # Match `| ROW_ID |` or `| ROW_ID ...` or `| ROW_ID (description) |`
    # Be permissive: row_id may be followed by space-then-description-then-pipe
    pattern = re.compile(rf"^\|\s*{re.escape(row_id)}(?=\s*(?:\(|\||[A-Za-z\"'_]| /|→))", re.MULTILINE)
    matches = []
    for m in pattern.finditer(section):
        line_end = section.find("\n", m.end())
        if line_end == -1:
            line_end = len(section)
        line = section[m.start():line_end]
        pipes = line.count("|")
        # Need at least 3 pipes for a valid markdown table row (| col1 | col2 |)
        if pipes < 3:
            continue
        # Determine table type by pipe count
        if pipes >= 6:
            table_type = "corrections_table"  # Pass 1/2/3 main correction row
        elif pipes == 5:
            table_type = "confidence_resolution"  # Pass 3 confidence resolutions
        elif pipes == 4:
            table_type = "adversarial_flag"  # Pass 3 adversarial-review flags
        else:
            table_type = "unknown"
        matches.append((m.start(), line_end, line, table_type))

    if not matches:
        return None

    # Prefer the corrections_table match (most "official" location); if none, use first
    for r in matches:
        if r[3] == "corrections_table":
            return r
    return matches[0]


def find_pass4_retraction_annotation(section: str, row_id: str) -> bool:
    """Check whether the Pass 4 block in `section` contains an annotation mentioning
    this row_id alongside retraction language."""
    # The Pass 4 block starts with "#### Pass 4 sweeping QA + fact-check"
    p4_idx = section.find("#### Pass 4 sweeping QA + fact-check")
    if p4_idx == -1:
        return False
    p4_block = section[p4_idx:]

    # Look for the row ID with retraction language
    # Cast a wide net: row_id followed within 1000 chars by RETRACTED/REMOVE/drop/phantom/strike/etc
    pattern = re.compile(re.escape(row_id))
    for m in pattern.finditer(p4_block):
        window = p4_block[max(0, m.start() - 50):m.end() + 800]
        if re.search(
            r"\b(RETRACTED|RETRACT entirely|REMOVE|remove from master|"
            r"phantom|strike from|striking|drift(?:ed)?|withdraw|DROP|"
            r"cross-contamination|cross-contaminated|hallucinated row|"
            r"no in-transcript|not-in-transcript|error-of-record|"
            r"unsupported \(REMOVE\)|DROP — unrecoverable)",
            window,
            re.IGNORECASE,
        ):
            return True
    return False


def main() -> int:
    candidates = json.loads(RAW_CANDIDATES.read_text(encoding="utf-8"))
    content = MASTER.read_text(encoding="utf-8")

    audit = {
        "generated": "2026-05-22",
        "scope": "Comprehensive cross-contamination verification across Pass 1/2/3/4 staging files vs master MD post-Pass-4 merge",
        "session": "Session 3 follow-on at user request 2026-05-22 evening",
        "raw_candidate_count": len(candidates),
        "summary": {},
        "candidates": [],
    }

    bucket_counts = {
        "already_clean": 0,
        "annotated_but_still_present": 0,
        "no_annotation_in_master": 0,
        "ambiguous_human_review": 0,
        "known_false_positive": 0,
    }

    for cand in candidates:
        entry = cand["entry_number"]
        row_id = cand["row_id"]

        # Apply false-positive override
        fp_key = (entry, row_id)
        if fp_key in KNOWN_FALSE_POSITIVES:
            cand["master_md_state"] = "known_false_positive"
            cand["action"] = "skip_no_action"
            cand["false_positive_reason"] = KNOWN_FALSE_POSITIVES[fp_key]
            bucket_counts["known_false_positive"] += 1
            audit["candidates"].append(cand)
            continue

        # Locate the entry section in the master MD
        try:
            sec_start, sec_end = entry_section_bounds(content, entry)
        except ValueError:
            cand["master_md_state"] = "entry_not_found"
            cand["action"] = "log_for_human_review"
            bucket_counts["ambiguous_human_review"] += 1
            audit["candidates"].append(cand)
            continue

        section = content[sec_start:sec_end]

        # Find the row in the master MD
        row_found = find_row_anywhere(section, row_id)
        if row_found is None:
            # Row already physically removed
            cand["master_md_state"] = "already_clean"
            cand["action"] = "skip_no_action"
            cand["current_row_text"] = None
            bucket_counts["already_clean"] += 1
            audit["candidates"].append(cand)
            continue

        line_start, line_end, line, table_type = row_found
        cand["current_row_text"] = line
        cand["table_type"] = table_type

        # Check whether Pass 4 block has a retraction annotation alongside
        has_p4_annotation = find_pass4_retraction_annotation(section, row_id)

        # Bucket: annotated_but_still_present vs. no_annotation
        if has_p4_annotation:
            cand["master_md_state"] = "annotated_but_still_present"
            bucket_counts["annotated_but_still_present"] += 1
        else:
            cand["master_md_state"] = "no_annotation_in_master"
            bucket_counts["no_annotation_in_master"] += 1

        # Decide action based on confidence
        if cand["confidence_in_retraction"] == "high":
            cand["action"] = "physically_remove"
        elif cand["confidence_in_retraction"] == "medium":
            # Medium-confidence: still propose removal but flag for human review
            cand["action"] = "physically_remove"
            cand["action_note"] = "Medium-confidence retraction signal; review carefully before/after applying."
        else:
            cand["action"] = "log_for_human_review"
            bucket_counts["ambiguous_human_review"] += 1
            # Roll back the bucket assignment from above
            if cand["master_md_state"] == "annotated_but_still_present":
                bucket_counts["annotated_but_still_present"] -= 1
            else:
                bucket_counts["no_annotation_in_master"] -= 1

        audit["candidates"].append(cand)

    audit["summary"] = {
        "total_retraction_candidates": len(candidates),
        **bucket_counts,
    }

    # Sort candidates by entry then row_id for stable output
    audit["candidates"].sort(key=lambda c: (c["entry_number"], c["row_id"]))

    AUDIT_OUT.write_text(json.dumps(audit, indent=2, ensure_ascii=False), encoding="utf-8")

    print("=" * 70)
    print("Cross-contamination audit summary")
    print("=" * 70)
    print(f"Total candidates: {audit['summary']['total_retraction_candidates']}")
    print(f"Bucket distribution:")
    for k, v in bucket_counts.items():
        print(f"  {k}: {v}")
    print()
    print(f"Wrote {AUDIT_OUT}")

    # Action distribution
    action_counts = {}
    for c in audit["candidates"]:
        a = c.get("action", "?")
        action_counts[a] = action_counts.get(a, 0) + 1
    print()
    print("Action distribution:")
    for k, v in action_counts.items():
        print(f"  {k}: {v}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
