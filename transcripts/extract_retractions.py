#!/usr/bin/env python3
"""Extract cross-contamination retraction candidates from staging files.

Focuses on rows that explicitly request REMOVAL of an existing Pass 1/Pass 2/Pass 3
row from the master overlay. Skips:
  - Pass 4 "new catches" (those are additions, not retractions)
  - Subject-paragraph corrections (no row ID; handled by Problem 8)
  - Sub-attribution corrections (e.g., "drop the 'Augustus' prefix from Phil Woolpert"
    where the row STAYS but a column is corrected)
  - Pass 2 self-flagging cross-corpus reference rows (these are intentionally added
    with "(not in this transcript)" labels as catalog provenance)

Outputs retraction_candidates_raw.json with verbatim reason + signal + confidence.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

STAGE_DIRS = {
    "Pass 2": Path(r"D:\civil\transcripts\pass2_stage"),
    "Pass 2 tail": Path(r"D:\civil\transcripts\pass2_tail_stage"),
    "Pass 3": Path(r"D:\civil\transcripts\pass3_stage"),
    "Pass 4": Path(r"D:\civil\transcripts\pass4_stage"),
}

# Sections we look in. Pass 4-only retractions live here:
PASS4_RETRACTION_SECTIONS = {
    "re-grounding demotions (high → medium/low, or kept-with-correction)",
    "re-grounding demotions",
    "re-grounding promotions (low/medium/flagged → high)",  # sometimes a demotion is misfiled here
    "re-grounding promotions",
    "adversarial-review flag updates",
    "audit-complete assessment",  # narrative sometimes contains retraction directives
}

# Pass 3 sometimes contains a "Confidence resolutions" or "Adversarial-review flags"
# section that recommends dropping. These are valid retraction candidates.
PASS3_RETRACTION_SECTIONS = {
    "confidence resolutions",
    "adversarial-review flags (for user's kiro/kimi/codex/gemini multi-model check)",
}

# Pass 2 in-table self-flags: only consider rows with very strong language like
# "remove" or "this row was misfiled" — but Phase 1a already handled the common
# cases via the OPEN_PROBLEMS Problem 2 punch-list.
PASS2_RETRACTION_SECTIONS = {
    "pass 2 corrections (2026-05-22)",
    "pass 2 tail-sweep corrections (2026-05-22)",
}

# Strong retraction signals — row physically should be removed.
HIGH_CONFIDENCE_PATTERNS = [
    r"\bRETRACTED\b",
    r"\bRETRACT entirely\b",
    r"\bretract\.",
    r"\bunsupported \(REMOVE\)\b",
    r"\bdemote to REMOVE\b",
    r"\bremove from master\b",
    r"\bstrike from master\b",
    r"\bstrike from final\b",
    r"\bstrike from the master overlay\b",
    r"\bstrike from corrections table\b",
    r"\bstriking the row entirely\b",
    r"\bstriking from the master\b",
    r"\bstriking from corrections\b",
    r"\bRecommend striking\b",
    r"\bRESOLVED via retraction\b",
    r"\bRESOLVED — RETRACT\b",
    r"\bRESOLVED-RETRACT\b",
    r"\bresolved-PHANTOM\b",
    r"\berror-of-record\b",
    r"\bWHISPER-PHANTOM\b",
    r"\bphantom row\b",
    r"\bphantom rows\b",
    r"\bphantom catch\b",
    r"\bphantom entry\b",
    r"\bphantom entries\b",
    r"\bphantom Pass[ -]\d\b",
    r"\brecommend retract\b",
    r"\brecommend retraction\b",
    r"\bflagged for retraction\b",
    r"\brow should be removed\b",
    r"\brow should be retracted\b",
    r"\brow should be retired\b",
    r"\bshould be dropped from publishable correction\b",
    r"\bRESOLVED — not in this transcript\b",
    r"\bRESOLVED — strike from queue\b",
    r"\bRESOLVED — strike\b",
    r"\bRESOLVED \(removed from queue\)\b",
    r"\bResolved \(removed\)\b",
    r"\bcross-contamination from another\b",
    r"\bcross-contaminated from another\b",
    r"\bappears to be cross-contamination\b",
    r"\bcross-entry leakage\b",
    r"\b0 matches both files\b",
    r"\bDROP — no instance in this transcript\b",
    r"\brow drifted in from a different entry\b",
    r"\brow appears to have drifted\b",
    r"\bdrifted from another entry\b",
    r"\bdrifted in from\b",
    r"\bDROP — unrecoverable\b",
    r"\bwithdraw correction\b",
    r"\bshould be withdrawn\b",
    r"\bRESOLVED — DROP\b",
    r"\bresolved \(DROP\)\b",
    r"\bn/a — not in transcript\b",
    r"\bnot-in-transcript\b",
    r"\bNOT-IN-TRANSCRIPT\b",
    r"\bremove from active correction list\b",
    r"\bremove from this entry's adversarial\b",
    r"\bRemove from adversarial-review list\b",
    r"\bremove from adversarial queue\b",
]

# Medium-confidence signals
MEDIUM_CONFIDENCE_PATTERNS = [
    r"\bdemoted to NULL\b",
    r"\bdemote correction row\b",
    r"\brow .* should be retracted\b",
    r"\bremove the row\b",
    r"\brecommend dropping\b",
    r"\brecommend drop\b",
    r"\brow appears to be cross-contamin",
    r"\blikely cross-contamination from\b",
    r"\bunsupported in raw\b",
    r"\bnot in (?:the )?raw transcript\b",
    r"\bdoes NOT appear in (?:the )?(?:.*?)raw\b",
    r"\bdo NOT appear in (?:the )?(?:.*?)raw\b",
]

# Row ID matcher. Match Pass 1 (NN.NN), Pass 2 (NN.P2.NN), Pass 3 (NN.P3.NN),
# and relocated rows (NN.P2.RELOC[...]). EXCLUDE Pass 4 new catches (NN.P4.NN)
# because those are NEW rows being added.
ROW_ID_REGEX = re.compile(
    r"\b(\d+)\.(P[23]\.RELOC\[[^\]]+\]|P[23]\.\d+|\d+)\b"
)


def is_pass4_new_catch(row_id: str) -> bool:
    return ".P4." in row_id


def detect_referenced_row_ids(text: str, entry_number: int) -> list[str]:
    """Find Pass 1/2/3 row IDs referenced in the text, belonging to entry_number."""
    found = []
    seen = set()
    for m in ROW_ID_REGEX.finditer(text):
        try:
            en = int(m.group(1))
        except ValueError:
            continue
        if en != entry_number:
            continue
        suffix = m.group(2)
        if suffix.startswith("P4"):
            continue
        row_id = f"{m.group(1)}.{suffix}"
        if row_id not in seen:
            seen.add(row_id)
            found.append(row_id)
    return found


def match_retraction_signal(text: str) -> tuple[str | None, str | None]:
    for pat in HIGH_CONFIDENCE_PATTERNS:
        if re.search(pat, text, re.IGNORECASE):
            return (pat, "high")
    for pat in MEDIUM_CONFIDENCE_PATTERNS:
        if re.search(pat, text, re.IGNORECASE):
            return (pat, "medium")
    return (None, None)


def is_full_retraction_row(line: str, section_lower: str) -> bool:
    """Filter to keep only rows that demand full row removal."""
    low = line.lower()

    # Skip if it's clearly a sub-attribution correction (row stays, sub-field changes)
    if "should be dropped" in low and "from the canonical correction" in low:
        return False
    if "should be dropped" in low and "the \"augustus\" prefix" in low:
        return False
    if "row stays" in low or "kept, with" in low:
        # check if it ALSO mentions explicit retraction
        return any(
            re.search(p, line, re.IGNORECASE) for p in [
                r"RETRACTED",
                r"\bdemoted to NULL\b",
                r"strike from",
                r"unsupported \(REMOVE\)",
            ]
        )

    # Skip rows that say "kept" without retract
    if "(kept" in low and "retract" not in low and "remove" not in low:
        return False

    # Skip Pass 3 missed-pattern catches that say "not in this transcript"
    # — these are catalog-clean confirmations, not retractions
    if "missed-pattern catches" in section_lower or "missed pattern" in section_lower:
        # Only keep if very explicit retraction language present
        if not any(re.search(p, line, re.IGNORECASE) for p in [r"\bRETRACT", r"\bDROP\b", r"remove from master"]):
            return False

    # Skip Pass 2 cross-corpus reference rows (intentionally added as catalog provenance)
    # These rows have format: | NN.P2.XX | <whisper> | <correction> | n/a | n/a | n/a |
    # OR they say "(cross-corpus reference)" or "(catalog entry)" in their notes
    if "(cross-corpus reference" in low or "(catalog entry" in low or "cross-corpus catalog" in low:
        return False
    if "verified)" in low and "not in" in low and "cross-corpus check" in low:
        return False

    # Skip rows that say "from cross-corpus catalog for any future"
    if "for any future" in low or "if any future" in low:
        return False

    # Skip rows in "Net-new catalog patterns" / "Net-new ground-truth corpus candidates" /
    # "Adversarial-review flag updates" if the action is "retained"/"new"/"resolved" without retract
    if "retained" in low and "retract" not in low:
        return False
    if "| retained |" in low:
        return False

    return True


def extract_table_rows(text: str) -> list[tuple[str, str]]:
    rows = []
    current_section = ""
    current_section_full = ""
    for raw_line in text.split("\n"):
        line = raw_line.rstrip()
        if line.startswith("**") and line.endswith(":**"):
            current_section = line.strip("*: ")
            current_section_full = current_section
            continue
        if line.startswith("####") or line.startswith("###"):
            current_section = line.lstrip("# ").strip()
            current_section_full = current_section
            continue
        if not line.startswith("|"):
            continue
        l_lower = line.lower()
        if "---" in line and "|" in line:
            continue
        if any(l_lower.startswith(s) for s in [
            "| #",
            "| original row",
            "| row",
            "| pattern",
            "| claim",
            "| metric",
            "| net-new",
        ]):
            continue
        rows.append((current_section, line))
    return rows


def extract_retraction_candidates(text: str, entry_number: int, source_pass: str, file_path: Path) -> list[dict]:
    candidates = []
    valid_sections = set()
    if source_pass == "Pass 4":
        valid_sections = PASS4_RETRACTION_SECTIONS
    elif source_pass == "Pass 3":
        valid_sections = PASS3_RETRACTION_SECTIONS
    elif source_pass.startswith("Pass 2"):
        valid_sections = PASS2_RETRACTION_SECTIONS

    for section, line in extract_table_rows(text):
        section_lower = section.lower()

        if not is_full_retraction_row(line, section_lower):
            continue

        pat, conf = match_retraction_signal(line)
        if pat is None:
            continue

        row_ids = detect_referenced_row_ids(line, entry_number)
        if not row_ids:
            continue

        for row_id in row_ids:
            candidates.append({
                "entry_number": entry_number,
                "row_id": row_id,
                "retraction_source_pass": source_pass,
                "retraction_reason": line[:2500],
                "retraction_signal_matched": pat,
                "confidence_in_retraction": conf,
                "section_heading": section,
                "stage_file": str(file_path.relative_to(file_path.parent.parent)).replace("\\", "/"),
            })

    return candidates


def main() -> int:
    all_candidates = []
    file_count = 0

    for source_pass, stage_dir in STAGE_DIRS.items():
        if not stage_dir.exists():
            print(f"WARN: {stage_dir} does not exist; skipping")
            continue
        for stage_file in sorted(stage_dir.glob("entry_*.md")):
            file_count += 1
            m = re.match(r"entry_(\d+)\.md", stage_file.name)
            if not m:
                continue
            entry_number = int(m.group(1))

            text = stage_file.read_text(encoding="utf-8")
            cs = extract_retraction_candidates(text, entry_number, source_pass, stage_file)
            all_candidates.extend(cs)

    by_key: dict[tuple, list[dict]] = {}
    for cand in all_candidates:
        key = (cand["entry_number"], cand["row_id"])
        by_key.setdefault(key, []).append(cand)

    conf_rank = {"high": 3, "medium": 2, "low": 1, None: 0}
    pass_rank = {"Pass 4": 4, "Pass 3": 3, "Pass 2 tail": 2, "Pass 2": 1}
    consolidated = []
    for key, group in by_key.items():
        # Prefer candidate whose reason line STARTS with this row_id
        row_id = key[1]
        def reason_starts_with_row(c):
            line = c["retraction_reason"].lstrip("|").lstrip()
            return line.startswith(row_id)
        group.sort(
            key=lambda c: (
                # Prefer line that starts with this row_id (most specific reason)
                -int(reason_starts_with_row(c)),
                -conf_rank.get(c["confidence_in_retraction"], 0),
                -pass_rank.get(c["retraction_source_pass"], 0),
            )
        )
        primary = group[0]
        if len(group) > 1:
            additional = [
                f"Also flagged in {g['retraction_source_pass']}: {g['retraction_reason'][:300]}"
                for g in group[1:]
            ]
            primary = dict(primary)
            primary["additional_signals"] = additional
        consolidated.append(primary)

    consolidated.sort(key=lambda c: (c["entry_number"], c["row_id"]))

    output_path = Path(r"D:\civil\transcripts\retraction_candidates_raw.json")
    output_path.write_text(json.dumps(consolidated, indent=2), encoding="utf-8")

    print(f"Scanned {file_count} staging files")
    print(f"Raw candidate count: {len(all_candidates)}")
    print(f"After dedup (by entry+row_id): {len(consolidated)}")
    print(f"By confidence:")
    for conf in ["high", "medium", "low"]:
        n = sum(1 for c in consolidated if c["confidence_in_retraction"] == conf)
        print(f"  {conf}: {n}")
    print(f"By source pass:")
    for sp in ["Pass 2", "Pass 2 tail", "Pass 3", "Pass 4"]:
        n = sum(1 for c in consolidated if c["retraction_source_pass"] == sp)
        print(f"  {sp}: {n}")
    print(f"Wrote {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
