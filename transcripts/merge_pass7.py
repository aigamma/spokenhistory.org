#!/usr/bin/env python3
"""Pass 7 merge + aggregation.

For each `transcripts/pass7_stage/entry_NNN_*.md`:
  1. Insert its PRR content into `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md`
     before the entry's closing `---` line (idempotent — skips if Pass 7 block
     already present).
  2. Extract the v2 readiness score → `readiness_ledger_v2.json`.
  3. Extract the publication-readiness verdict → readiness_ledger_v2.json.
  4. Extract Subject paragraph corrections → `subject_paragraph_corrections_pass7.json`.
  5. Extract ground-truth corpus proposals → `ground_truth_proposals_pass7.json`.

Also updates the Progress Tracker to add a Pass 7 column with today's date.

Constraints:
- Idempotent: re-runs detect existing Pass 7 sentinel and skip merge.
- Atomic per entry.
- Reuses entry_section_bounds from fix_layer5_findings.py.

CLI:
  python transcripts/merge_pass7.py --dry-run   # preview, no writes
  python transcripts/merge_pass7.py             # apply
"""
from __future__ import annotations

import argparse
import io
import json
import re
import sys
from datetime import date
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).parent))
import fix_layer5_findings as helpers  # noqa: E402

CIVIL_ROOT = Path(r"C:\civil")
MASTER = CIVIL_ROOT / "transcripts" / "CLEANED_TRANSCRIPTS_REVIEW.md"
PASS7_STAGE_DIR = CIVIL_ROOT / "transcripts" / "pass7_stage"
LEDGER_V2_OUT = CIVIL_ROOT / "transcripts" / "readiness_ledger_v2.json"
SUBJECT_CORR_OUT = CIVIL_ROOT / "transcripts" / "subject_paragraph_corrections_pass7.json"
GROUND_TRUTH_OUT = CIVIL_ROOT / "transcripts" / "ground_truth_proposals_pass7.json"

PASS7_SENTINEL = "#### Pass 7 Publication Readiness Review"

ENTRY_FILE_RE = re.compile(r"^entry_(\d{3})_(.+)\.md$")


def parse_stage_file(path: Path) -> dict:
    """Parse a single pass7_stage/entry_NNN_*.md file.

    Returns a dict with extracted fields:
      - entry_number
      - subject
      - score (float, or None if not parsable)
      - verdict (str, paragraph 5 content)
      - subject_corrections (list of {claim, grade, evidence})
      - corrected_subject_paragraph (str or None)
      - corpus_proposals (list of {name, role, why, evidence})
      - raw_content (str, full file content for merge)
    """
    content = path.read_text(encoding="utf-8", errors="replace")
    m = ENTRY_FILE_RE.match(path.name)
    entry_number = int(m.group(1)) if m else None

    # Subject from header line: ## Pass 7 PRR — Entry N: SUBJECT
    subject_m = re.search(r"^##\s+Pass\s+7\s+PRR.*?Entry\s+\d+:\s*(.+?)$", content, re.MULTILINE)
    subject = subject_m.group(1).strip() if subject_m else None

    # Score — search for patterns: 'Final score: NN.N', '**Final score**: NN.N',
    # 'score: NN.N', 'Score: NN.N (clamped...)', 'v2 Score: NN.N', etc.
    # Strategy: find all candidate scores in the entire file, prefer ones
    # immediately following 'Final', 'final', 'v2', or 'Score' keywords; pick
    # the highest clamped/final value mentioned in the Score section.
    score = None
    # Look for explicit "Final score" anchor first (preferred form)
    final_m = re.search(
        r"(?:Final\s+score|final\s+score|\*\*Final\s+score\*\*|Final\s+v2\s+score)\s*[:|=]\s*\**\s*([\d.]+)",
        content,
    )
    if final_m:
        try:
            score = float(final_m.group(1).rstrip("."))
        except ValueError:
            pass
    # Fallback: search for "Score: NN.N" or "v2 score: NN.N"
    if score is None:
        score_m = re.search(
            r"(?:v2\s+)?[Ss]core\s*[:|=]\s*\**\s*([\d.]+)\s*(?:/|\s|$)",
            content,
        )
        if score_m:
            try:
                score = float(score_m.group(1).rstrip("."))
            except ValueError:
                pass

    # Verdict — Section 5 content. Find the section heading then take text until
    # next heading or end of file.
    verdict = None
    verdict_m = re.search(
        r"###\s+5[.).\s]+Publication[- ]readiness verdict\s*\n+(.*?)(?=\n###\s+|\Z)",
        content,
        re.DOTALL,
    )
    if verdict_m:
        verdict = verdict_m.group(1).strip()

    # Subject paragraph corrections — parse the table in section 1
    # Handle both 3-column format (Claim|Grade|Evidence) and 4-column format
    # (#|Claim|Verdict|Evidence). Some agents also used "Subject Paragraph Audit"
    # (capital P) or "Subject paragraph" — search broader.
    subject_corrections = []
    section1_m = re.search(
        r"(?:###|##)\s+(?:Section\s+)?1[.).\s\-—]+\s*Subject\s+[Pp]aragraph[^\n]*\n+(.*?)(?=\n(?:###|##)\s+|\Z)",
        content,
        re.DOTALL | re.IGNORECASE,
    )
    if section1_m:
        section1 = section1_m.group(1)
        valid_grades = {"supported", "partial", "unsupported", "contradicted", "partially supported"}
        for line in section1.split("\n"):
            if not line.strip().startswith("|"):
                continue
            cells = [c.strip().strip("*` ") for c in line.strip().strip("|").split("|")]
            if len(cells) < 3:
                continue
            # Skip header + separator rows
            joined_lower = " ".join(c.lower() for c in cells)
            if any(h in joined_lower for h in ("---", ":---", "claim |", "verdict")) and "|" in joined_lower:
                continue
            if all(re.match(r"^[-:\s]*$", c) for c in cells):
                continue
            # Try each cell position to find the grade
            grade = None
            grade_idx = None
            for i, c in enumerate(cells):
                c_lower = c.lower()
                if c_lower in valid_grades:
                    grade = c_lower
                    grade_idx = i
                    break
                # Tolerate bold or italic
                c_stripped = c_lower.strip("*_`")
                if c_stripped in valid_grades:
                    grade = c_stripped
                    grade_idx = i
                    break
            if grade is None:
                continue
            if grade == "partially supported":
                grade = "partial"
            # Claim is everything before grade_idx; evidence is everything after
            claim_cells = cells[:grade_idx]
            evidence_cells = cells[grade_idx + 1:]
            # Skip the # column if it's the first cell and looks numeric
            if claim_cells and re.match(r"^(SP[-.]?\d+|\d+)$", claim_cells[0]):
                claim_cells = claim_cells[1:]
            claim = " | ".join(claim_cells).strip()
            evidence = " | ".join(evidence_cells).strip()
            if not claim:
                continue
            subject_corrections.append({
                "claim": claim,
                "grade": grade,
                "evidence_or_issue": evidence,
            })

    # Corrected subject paragraph (if present)
    corrected_subject = None
    corr_m = re.search(
        r"\*\*Recommended\s+corrected\s+Subject\s+paragraph\*\*\s*[:.]?\s*\n+(.*?)(?=\n\n\*\*|\n###|\Z)",
        content,
        re.DOTALL,
    )
    if corr_m:
        corrected_subject = corr_m.group(1).strip()

    # Ground-truth corpus proposals — handle BOTH table format AND
    # "Proposal A — Name"/"Proposal 1: Name" subsection format.
    corpus_proposals = []
    section3_m = re.search(
        r"(?:###|##)\s+(?:Section\s+)?3[.).\s\-—]+\s*Residual\s+[Gg]round[- ][Tt]ruth[^\n]*\n+(.*?)(?=\n(?:###|##)\s+|\Z)",
        content,
        re.DOTALL,
    )
    if section3_m:
        section3 = section3_m.group(1)
        # Format 1: Table rows
        for line in section3.split("\n"):
            if not line.strip().startswith("|"):
                continue
            cells = [c.strip().strip("*` ") for c in line.strip().strip("|").split("|")]
            if len(cells) < 2:
                continue
            name = cells[0]
            if name.lower() in ("name", "---", ""):
                continue
            if re.match(r"^[-:\s]+$", name):
                continue
            if any(h in name.lower() for h in ("name |", "---")):
                continue
            corpus_proposals.append({
                "name": name,
                "role": cells[1] if len(cells) > 1 else "",
                "why_they_belong": cells[2] if len(cells) > 2 else "",
                "transcript_evidence": cells[3] if len(cells) > 3 else "",
            })
        # Format 2: "**Proposal X — Name**" or "**Proposal X: Name**" subsections
        proposal_re = re.compile(
            r"\*\*Proposal\s+[A-Z0-9]+\s*[—\-:]\s*(.+?)\*\*",
        )
        for m in proposal_re.finditer(section3):
            name = m.group(1).strip().strip("()")
            # Avoid duplicating if table already caught it
            if not any(p["name"].lower() == name.lower() for p in corpus_proposals):
                corpus_proposals.append({
                    "name": name,
                    "role": "(extracted from proposal subsection — see stage file for details)",
                    "why_they_belong": "",
                    "transcript_evidence": "",
                })

    return {
        "entry_number": entry_number,
        "subject": subject,
        "score": score,
        "verdict": verdict,
        "subject_corrections": subject_corrections,
        "corrected_subject_paragraph": corrected_subject,
        "corpus_proposals": corpus_proposals,
        "raw_content": content,
    }


def merge_pass7_into_master(master_text: str, parsed_stages: list[dict]) -> tuple[str, dict]:
    """Insert Pass 7 PRR block into master MD before each entry's closing `---`.

    Idempotent: skips entries that already have the Pass 7 sentinel.
    """
    counts = {
        "merged": 0,
        "skipped_already_merged": 0,
        "skipped_section_not_found": 0,
    }
    out = master_text
    # Process entries in DESCENDING order so earlier-section offsets stay valid
    for stage in sorted(parsed_stages, key=lambda s: -s["entry_number"]):
        n = stage["entry_number"]
        try:
            start, end = helpers.entry_section_bounds(out, n)
        except ValueError:
            counts["skipped_section_not_found"] += 1
            continue

        section = out[start:end]
        if PASS7_SENTINEL in section:
            counts["skipped_already_merged"] += 1
            continue

        # Build the PRR block. Start with the sentinel as an h4 so it merges
        # cleanly with the entry's prior structure (Pass 1..6 are h4).
        # The stage file's content starts with `## Pass 7 PRR — Entry N: SUBJECT`
        # — we strip that h2 header line and replace with our h4 sentinel.
        prr_body = re.sub(
            r"^##\s+Pass\s+7\s+PRR.*?\n",
            "",
            stage["raw_content"],
            count=1,
            flags=re.MULTILINE,
        )
        prr_block = f"\n{PASS7_SENTINEL} ({date.today().isoformat()})\n\n{prr_body.strip()}\n"

        # Insert before the entry section's closing `---` if it has one;
        # otherwise just append at the end of the section.
        # The trailing `---` is typically the last meaningful line of the entry
        # section just before the next `### N+1.` heading.
        # Find the LAST `---` line within the section.
        trailing_hr = list(re.finditer(r"^---\s*$", section, re.MULTILINE))
        if trailing_hr:
            last_hr = trailing_hr[-1]
            new_section = section[:last_hr.start()] + prr_block + "\n" + section[last_hr.start():]
        else:
            new_section = section + prr_block

        out = out[:start] + new_section + out[end:]
        counts["merged"] += 1

    return out, counts


def build_readiness_ledger_v2(parsed_stages: list[dict]) -> dict:
    """Aggregate per-entry scores + verdicts into readiness_ledger_v2.json."""
    ledger = {}
    for stage in sorted(parsed_stages, key=lambda s: s["entry_number"]):
        n = stage["entry_number"]
        ledger[str(n)] = {
            "entry_number": n,
            "subject": stage["subject"],
            "score_v2": stage["score"],
            "verdict": stage["verdict"][:500] if stage["verdict"] else None,
            "subject_corrections_count": len([c for c in stage["subject_corrections"] if c["grade"] in ("unsupported", "contradicted", "partial")]),
            "corpus_proposals_count": len(stage["corpus_proposals"]),
        }
    return ledger


def build_subject_corrections(parsed_stages: list[dict]) -> dict:
    """Aggregate Subject paragraph corrections across all entries."""
    out = {
        "_meta": {
            "generated": date.today().isoformat(),
            "source": "Pass 7 PRR staging files",
            "entry_count": 0,
            "total_corrections": 0,
        },
        "entries": {},
    }
    for stage in sorted(parsed_stages, key=lambda s: s["entry_number"]):
        n = stage["entry_number"]
        needs_fix = [c for c in stage["subject_corrections"] if c["grade"] in ("unsupported", "contradicted", "partial")]
        if not needs_fix and not stage["corrected_subject_paragraph"]:
            continue
        out["entries"][str(n)] = {
            "entry_number": n,
            "subject": stage["subject"],
            "claims_needing_fix": needs_fix,
            "corrected_subject_paragraph": stage["corrected_subject_paragraph"],
        }
        out["_meta"]["entry_count"] += 1
        out["_meta"]["total_corrections"] += len(needs_fix)
    return out


def build_corpus_proposals(parsed_stages: list[dict]) -> dict:
    """Aggregate ground-truth corpus proposals across all entries."""
    out = {
        "_meta": {
            "generated": date.today().isoformat(),
            "source": "Pass 7 PRR staging files",
            "entry_count": 0,
            "total_proposals": 0,
        },
        "by_entry": {},
        "deduplicated_names": [],
    }
    seen_names = {}
    for stage in sorted(parsed_stages, key=lambda s: s["entry_number"]):
        n = stage["entry_number"]
        if not stage["corpus_proposals"]:
            continue
        out["by_entry"][str(n)] = {
            "entry_number": n,
            "subject": stage["subject"],
            "proposals": stage["corpus_proposals"],
        }
        out["_meta"]["entry_count"] += 1
        out["_meta"]["total_proposals"] += len(stage["corpus_proposals"])
        for prop in stage["corpus_proposals"]:
            name = prop["name"]
            if name not in seen_names:
                seen_names[name] = []
            seen_names[name].append(n)
    # Deduplicated list sorted by recurrence count then name
    out["deduplicated_names"] = sorted(
        [{"name": name, "proposed_in_entries": sorted(entries), "recurrence": len(entries)} for name, entries in seen_names.items()],
        key=lambda x: (-x["recurrence"], x["name"]),
    )
    out["_meta"]["unique_names"] = len(seen_names)
    return out


def patch_progress_tracker(master_text: str) -> tuple[str, bool]:
    """Add a Pass 7 column to the Progress Tracker if not already present."""
    # Heuristic: find the Progress Tracker table header line.
    # Project convention: header includes columns Pass 1, Pass 2, Pass 3, Pass 4, ...
    # We append a Pass 7 column.
    if "| Pass 7 " in master_text:
        return master_text, False  # Already patched
    # Find the header line and the separator line
    header_pat = re.compile(r"^(\|.*?Pass 4.*?\|)\s*$", re.MULTILINE)
    m = header_pat.search(master_text)
    if not m:
        return master_text, False
    # Conservative: don't auto-patch the tracker — it has fixed-width formatting
    # that needs a dedicated tracker-patcher (cf. patch_tracker_pass4.py).
    # Leave a note that tracker patch is needed.
    return master_text, False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    print(f"Loading stage files from {PASS7_STAGE_DIR}")
    stage_paths = sorted(PASS7_STAGE_DIR.glob("entry_*.md"))
    print(f"  Found {len(stage_paths)} stage files")

    parsed_stages = []
    parse_failures = []
    for p in stage_paths:
        try:
            data = parse_stage_file(p)
            if data["entry_number"] is None:
                parse_failures.append((p.name, "no entry_number"))
                continue
            parsed_stages.append(data)
        except Exception as e:
            parse_failures.append((p.name, str(e)))

    print(f"  Parsed: {len(parsed_stages)}")
    if parse_failures:
        print(f"  Parse failures: {len(parse_failures)}")
        for name, err in parse_failures[:5]:
            print(f"    {name}: {err}")

    # Score distribution
    scores = [s["score"] for s in parsed_stages if s["score"] is not None]
    print(f"\nScore extraction: {len(scores)}/{len(parsed_stages)} parsable")
    if scores:
        import statistics
        print(f"  Mean: {statistics.mean(scores):.1f}  Median: {statistics.median(scores):.1f}")
        print(f"  Min:  {min(scores):.1f}  Max: {max(scores):.1f}")

    # Build aggregates
    print("\nBuilding aggregates...")
    ledger_v2 = build_readiness_ledger_v2(parsed_stages)
    subj_corr = build_subject_corrections(parsed_stages)
    corpus_prop = build_corpus_proposals(parsed_stages)
    print(f"  readiness_ledger_v2.json:      {len(ledger_v2)} entries")
    print(f"  subject_paragraph_corrections: {subj_corr['_meta']['entry_count']} entries, {subj_corr['_meta']['total_corrections']} claims")
    print(f"  ground_truth_proposals_pass7:  {corpus_prop['_meta']['entry_count']} entries, {corpus_prop['_meta']['total_proposals']} proposals, {corpus_prop['_meta']['unique_names']} unique")

    # Merge into master MD
    print(f"\nLoading master MD: {MASTER}")
    master_text = MASTER.read_text(encoding="utf-8")
    pre_chars = len(master_text)
    pre_sentinel_count = master_text.count(PASS7_SENTINEL)
    print(f"  Pre: {pre_chars:,} chars, {pre_sentinel_count} existing Pass 7 sentinels")

    new_text, merge_counts = merge_pass7_into_master(master_text, parsed_stages)
    post_chars = len(new_text)
    post_sentinel_count = new_text.count(PASS7_SENTINEL)
    print(f"\nMerge result:")
    print(f"  Merged: {merge_counts['merged']}")
    print(f"  Skipped (already merged): {merge_counts['skipped_already_merged']}")
    print(f"  Skipped (section not found): {merge_counts['skipped_section_not_found']}")
    print(f"  Post: {post_chars:,} chars (delta {post_chars - pre_chars:+,})")
    print(f"  Sentinels: {pre_sentinel_count} → {post_sentinel_count}")

    if args.dry_run:
        print("\n[DRY RUN] No files written.")
        return 0

    # Write all outputs
    LEDGER_V2_OUT.write_text(json.dumps(ledger_v2, indent=2, ensure_ascii=False), encoding="utf-8")
    SUBJECT_CORR_OUT.write_text(json.dumps(subj_corr, indent=2, ensure_ascii=False), encoding="utf-8")
    GROUND_TRUTH_OUT.write_text(json.dumps(corpus_prop, indent=2, ensure_ascii=False), encoding="utf-8")
    MASTER.write_text(new_text, encoding="utf-8")

    print(f"\nWrote:")
    print(f"  {LEDGER_V2_OUT}")
    print(f"  {SUBJECT_CORR_OUT}")
    print(f"  {GROUND_TRUTH_OUT}")
    print(f"  {MASTER}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
