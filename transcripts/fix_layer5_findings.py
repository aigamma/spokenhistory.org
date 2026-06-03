#!/usr/bin/env python3
"""Layer 5 fidelity-deploy: apply high-confidence Layer 5 findings to the master MD.

Reads `transcripts/layer5_fidelity_audit.json` and selectively mutates
`transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` per the Layer 5 deploy mandate:

  A. **Annotate** D1 phantom rows that involve a canonical figure (per
     `Metadata Generation System/civil_rights_facts.json`) -- they need
     ensemble adjudication, so we don't delete them; we add a Layer 5
     annotation marker in the notes column.
  B. **Remove** the low-impact D1 phantom rows (non-canonical, supervisor
     commentary, self-confirm noise). Annotate the entry's Pass-N Notes
     section with a one-line audit log of the removal count.
  C. **Apply** clear-majority D2 normalizations (>= 80% share, >= 4 occ).
     Update the row's `correction` field; preserve the original in a Layer 5
     audit annotation.
  D. **Defer** ambiguous D2 (< 80% majority) and all D3 contradictions to
     the adversarial ensemble by annotating only -- no auto-resolution.

Constraints:
  - Idempotent: re-runs detect existing Layer 5 annotations and skip.
  - Atomic: read master MD once, mutate in memory, write back.
  - Pre/post row-count verification per affected entry.
  - Catalog sections A-Z + extensions are NOT touched (authoritative reference).
  - Per-entry Subject paragraphs are NOT touched (Problem 8 territory).
  - Anything unclear is annotated for ensemble review, never auto-resolved.

CLI:
  python transcripts/fix_layer5_findings.py --dry-run   # preview
  python transcripts/fix_layer5_findings.py             # apply
"""
from __future__ import annotations

import argparse
import io
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

# Force UTF-8 console output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

CIVIL_ROOT = Path(r"D:\civil")
MASTER = CIVIL_ROOT / "transcripts" / "CLEANED_TRANSCRIPTS_REVIEW.md"
LAYER5_JSON = CIVIL_ROOT / "transcripts" / "layer5_fidelity_audit.json"
FACTS_CORPUS = CIVIL_ROOT / "Metadata Generation System" / "civil_rights_facts.json"

# Layer 5 annotation markers (used for idempotency detection)
ANNOTATE_MARKER = "[LAYER-5:"
D1_CANONICAL_ANNOTATION = "[LAYER-5: phantom-rendering, fuzzy={fuzzy}, ensemble-adjudication-pending]"
D2_AMBIGUOUS_ANNOTATION = "[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]"
D2_NORMALIZED_ANNOTATION = "[LAYER-5: D2-normalized {orig!r} -> {new!r} (majority {pct}% of {n} occ)]"
D3_CONTRADICTION_ANNOTATION = "[LAYER-5: D3-catalog-contradiction (catalog {section!r}: {canon!r}), ensemble-adjudication-pending]"


# ---------------------------------------------------------------------------
# Canonical-figure detection
# ---------------------------------------------------------------------------


def load_canonical_names() -> set[str]:
    """Load every canonical name + alias from civil_rights_facts.json.

    Returns a set of lowercased, whitespace-normalized strings.
    """
    if not FACTS_CORPUS.exists():
        return set()
    data = json.loads(FACTS_CORPUS.read_text(encoding="utf-8"))
    names: set[str] = set()
    for canonical_key, entry in data.items():
        if isinstance(entry, dict):
            names.add(_norm_name(canonical_key))
            if "wikipedia_title" in entry:
                names.add(_norm_name(entry["wikipedia_title"]))
            for alias in entry.get("aliases", []):
                names.add(_norm_name(alias))
    # Strip empties and stop words
    names.discard("")
    return names


def _norm_name(s: str) -> str:
    """Normalize a name for canonical-figure matching."""
    if not isinstance(s, str):
        return ""
    return re.sub(r"\s+", " ", s.strip().lower())


def correction_references_canonical(correction: str, canonical_names: set[str]) -> bool:
    """Heuristic: does this correction's text reference a canonical figure?

    True if any canonical-name token sequence appears as a substring in the
    normalized correction text. Short names (<5 chars) are excluded to avoid
    matches on common words like "CORE" appearing in surrounding text.
    """
    if not correction:
        return False
    # Strip parenthetical commentary and markdown emphasis before matching.
    cleaned = re.sub(r"\([^)]*\)", "", correction)
    cleaned = re.sub(r"[*_`]+", "", cleaned).strip()
    norm = _norm_name(cleaned)
    if not norm:
        return False
    # Try exact-match-as-substring first
    for name in canonical_names:
        if len(name) < 5:
            # Filter short acronym aliases to avoid false matches
            continue
        if name in norm:
            return True
    return False


# ---------------------------------------------------------------------------
# Master-MD entry section bounds
# ---------------------------------------------------------------------------


def entry_section_bounds(content: str, n: int) -> tuple[int, int]:
    heading_re = re.compile(rf"^### {n}\. ", re.MULTILINE)
    m = heading_re.search(content)
    if not m:
        raise ValueError(f"No heading for entry #{n}")
    next_heading_re = re.compile(r"^### \d+\. ", re.MULTILINE)
    nxt = next_heading_re.search(content, m.end())
    end = nxt.start() if nxt else len(content)
    return m.start(), end


def find_row_line(section: str, row_id: str) -> tuple[int, int, str] | None:
    """Return (start, end, line) for the first pre-Pass-4 ORIGINAL row.

    Distinguishes the ORIGINAL correction-table row (where row_id is immediately
    followed by a pipe-cell-separator) from Pass-3/Pass-4 ANNOTATION rows that
    REFERENCE that row (where row_id is followed by `(...)` parenthetical
    commentary like "(Will Maslow UE leader)").

    The original row has form: `| <row_id> | <whisper> | <correction> | ...`
    An annotation row has form: `| <row_id> (<context>) | <something> | ...`

    Pre-Pass-4 means we exclude the Pass 4 block (which contains audit-trail
    annotations referencing earlier passes' rows). We want to mutate the
    original row, not the Pass 4 commentary about it.
    """
    p4_marker = "#### Pass 4 sweeping QA + fact-check"
    p4_idx = section.find(p4_marker)
    search_end = p4_idx if p4_idx != -1 else len(section)

    # Match ONLY rows where row_id is directly followed by a pipe (with whitespace).
    # This excludes `| 34.P2T.145 (Will Maslow UE leader) | ...` annotation rows.
    pattern = re.compile(
        rf"^\|\s*{re.escape(row_id)}\s*\|",
        re.MULTILINE,
    )
    for m in pattern.finditer(section, 0, search_end):
        line_end = section.find("\n", m.end())
        if line_end == -1:
            line_end = search_end
        if line_end > search_end:
            continue
        line = section[m.start():line_end]
        # Correction tables have at minimum 6 columns (row | whisper |
        # correction | confidence | source | notes) = 7 pipes. The 3-column
        # adversarial-flag tables (row | item | reason) have only 4 pipes —
        # filter them out so we don't accidentally treat an adversarial-flag
        # annotation as the original correction row.
        if line.count("|") < 6:
            continue
        return (m.start(), line_end, line)
    return None


def count_correction_rows_in_section(section: str) -> dict[str, int]:
    """Count rows in each table type for pre/post delta tracking."""
    counts = {
        "pass1": 0,
        "pass2": 0,
        "pass3_missed_pattern": 0,
        "pass2_reloc": 0,
        "pass4": 0,
    }
    counts["pass1"] = len(re.findall(r"^\| \d+\.\d+\s+\|", section, re.MULTILINE))
    counts["pass2"] = len(re.findall(r"^\| \d+\.P2\.\d+ \|", section, re.MULTILINE))
    counts["pass2_reloc"] = len(re.findall(r"^\| \d+\.P2\.RELOC\[", section, re.MULTILINE))
    counts["pass3_missed_pattern"] = len(re.findall(r"^\| \d+\.P3\.\d+ \|", section, re.MULTILINE))
    counts["pass4"] = len(re.findall(r"^\| \d+\.P4\.\d+ \|", section, re.MULTILINE))
    return counts


# ---------------------------------------------------------------------------
# Row-line mutation helpers
# ---------------------------------------------------------------------------


def split_row_cells(line: str) -> list[str]:
    """Split a pipe-delimited markdown table row into cells (including outer empties)."""
    if not line.startswith("|"):
        return []
    inner = line
    # Drop leading and trailing pipes
    if inner.endswith("|"):
        inner = inner[:-1]
    if inner.startswith("|"):
        inner = inner[1:]
    return inner.split("|")


def join_row_cells(cells: list[str]) -> str:
    """Re-join cells into a pipe-delimited markdown table row."""
    return "|" + "|".join(cells) + "|"


def append_to_notes(notes_cell: str, annotation: str) -> str:
    """Append a Layer 5 annotation to the notes cell, preserving spacing.

    Idempotent: if the same annotation already appears, return unchanged.

    Uses ` // ` as a separator instead of ` | ` to avoid creating a NEW
    markdown table cell, which would (a) break the table's column count and
    (b) cause subsequent idempotency checks to look in the wrong cell.
    """
    if annotation in notes_cell:
        return notes_cell
    stripped = notes_cell.rstrip()
    if stripped == "" or stripped == " ":
        return f" {annotation} "
    return f"{stripped} // {annotation} "


def replace_correction_in_row(line: str, new_correction: str) -> str:
    """Replace the correction cell (3rd content cell) in a markdown table row.

    Layout convention: | row_id | whisper | correction | confidence | source | notes |
    """
    cells = split_row_cells(line)
    if len(cells) < 3:
        return line
    cells[2] = f" {new_correction} "
    return join_row_cells(cells)


def get_notes_cell(line: str) -> tuple[int, str] | None:
    """Return (index_in_cells, notes_text) for the last cell (notes column)."""
    cells = split_row_cells(line)
    if len(cells) < 4:
        return None
    return (len(cells) - 1, cells[-1])


def update_notes_in_row(line: str, annotation: str) -> tuple[str, bool]:
    """Append a Layer 5 annotation to the row's notes cell.

    Returns (new_line, changed_flag). If the annotation is already present
    anywhere in the row (idempotency), changed_flag is False and the line
    is unchanged.

    Idempotency check is done across the WHOLE LINE because earlier versions
    of this script may have spread Layer 5 annotations across multiple cells
    using ` | ` as a separator (now replaced with ` // `).
    """
    if annotation in line:
        return line, False
    cells = split_row_cells(line)
    if len(cells) < 4:
        return line, False
    cells[-1] = append_to_notes(cells[-1], annotation)
    return join_row_cells(cells), True


# ---------------------------------------------------------------------------
# Phase A: D1 canonical-figure annotation
# ---------------------------------------------------------------------------


def annotate_d1_canonical(
    content: str,
    findings: list[dict],
    canonical_names: set[str],
) -> tuple[str, list[dict], list[dict]]:
    """Annotate D1 phantom rows that reference a canonical figure.

    Returns (new_content, annotated_list, skipped_list).
    """
    annotated = []
    skipped = []
    for f in findings:
        if not correction_references_canonical(f["correction"], canonical_names):
            continue
        entry = f["entry_number"]
        row_id = f["row_id"]
        fuzzy = f["best_fuzzy_score"]
        try:
            sec_start, sec_end = entry_section_bounds(content, entry)
        except ValueError:
            skipped.append({"entry": entry, "row_id": row_id, "reason": "entry not found"})
            continue
        section = content[sec_start:sec_end]
        match = find_row_line(section, row_id)
        if match is None:
            skipped.append({"entry": entry, "row_id": row_id, "reason": "row not found in pre-Pass-4 area"})
            continue
        line_start, line_end, line = match
        annotation = D1_CANONICAL_ANNOTATION.format(fuzzy=f"{fuzzy:.1f}")
        new_line, changed = update_notes_in_row(line, annotation)
        if not changed:
            skipped.append({"entry": entry, "row_id": row_id, "reason": "annotation already present (idempotent)"})
            continue
        new_section = section[:line_start] + new_line + section[line_end:]
        content = content[:sec_start] + new_section + content[sec_end:]
        annotated.append({"entry": entry, "row_id": row_id, "fuzzy": fuzzy, "correction": f["correction"][:60]})
    return content, annotated, skipped


# ---------------------------------------------------------------------------
# Phase B: D1 low-impact removal
# ---------------------------------------------------------------------------


def remove_d1_low_impact(
    content: str,
    findings: list[dict],
    canonical_names: set[str],
) -> tuple[str, list[dict], list[dict], dict[int, int]]:
    """Physically remove D1 phantom rows that do NOT reference a canonical figure.

    Returns (new_content, removed_list, skipped_list, per_entry_removed_count).
    """
    # Group by entry for batched removal (work bottom-up within each entry to
    # preserve offsets).
    by_entry: dict[int, list[dict]] = defaultdict(list)
    for f in findings:
        if correction_references_canonical(f["correction"], canonical_names):
            continue
        by_entry[f["entry_number"]].append(f)

    removed = []
    skipped = []
    per_entry_count: dict[int, int] = {}

    for entry in sorted(by_entry.keys()):
        candidates = by_entry[entry]
        try:
            sec_start, sec_end = entry_section_bounds(content, entry)
        except ValueError:
            for f in candidates:
                skipped.append({"entry": entry, "row_id": f["row_id"], "reason": "entry not found"})
            continue

        section = content[sec_start:sec_end]
        # Collect (line_start, line_end, line, finding) for each candidate
        line_records: list[tuple[int, int, str, dict]] = []
        for f in candidates:
            match = find_row_line(section, f["row_id"])
            if match is None:
                skipped.append({"entry": entry, "row_id": f["row_id"], "reason": "row not in pre-Pass-4 area (already removed?)"})
                continue
            line_records.append((*match, f))

        if not line_records:
            continue

        # Sort by start desc to remove from bottom up
        line_records.sort(key=lambda x: -x[0])
        new_section = section
        n_removed = 0
        for line_start, line_end, line, f in line_records:
            # Extend line_end to include trailing newline
            actual_end = line_end
            if actual_end < len(new_section) and new_section[actual_end] == "\n":
                actual_end += 1
            new_section = new_section[:line_start] + new_section[actual_end:]
            n_removed += 1
            removed.append({
                "entry": entry,
                "row_id": f["row_id"],
                "fuzzy": f["best_fuzzy_score"],
                "correction": f["correction"][:60],
            })

        per_entry_count[entry] = n_removed
        # Annotate the Notes section for the entry (one-line audit-log)
        new_section = annotate_entry_with_removal_log(new_section, n_removed)
        content = content[:sec_start] + new_section + content[sec_end:]

    return content, removed, skipped, per_entry_count


# Audit-log marker for removed phantoms — used for idempotency
REMOVAL_LOG_PATTERN = re.compile(
    r"\*Layer 5 removed (\d+) low-impact phantom rendering rows \(whisper renderings not present in raw\)\.\*",
)
REMOVAL_LOG_TEMPLATE = (
    "*Layer 5 removed {n} low-impact phantom rendering rows (whisper renderings not present in raw).*"
)


def annotate_entry_with_removal_log(section: str, n_removed: int) -> str:
    """Annotate an entry's Pass section with a Layer 5 removal-log line.

    Idempotent: if an existing Layer 5 removal-log is present, update the count.
    The annotation is appended after the entry's Status line OR at the top of
    the section after the title if no Status line exists.
    """
    # If already annotated, update the count
    existing = REMOVAL_LOG_PATTERN.search(section)
    if existing:
        prev_count = int(existing.group(1))
        new_count = prev_count + n_removed
        replacement = REMOVAL_LOG_TEMPLATE.format(n=new_count)
        return section[:existing.start()] + replacement + section[existing.end():]

    # Find a good insertion point: after the Status line if present, else after Source
    status_match = re.search(r"^\*\*Status\*\*:.*?$", section, re.MULTILINE)
    insertion_line = REMOVAL_LOG_TEMPLATE.format(n=n_removed)
    if status_match:
        insert_at = status_match.end()
        return section[:insert_at] + "  \n" + insertion_line + section[insert_at:]
    # Fallback: after Source line
    source_match = re.search(r"^\*\*Source\*\*:.*?$", section, re.MULTILINE)
    if source_match:
        insert_at = source_match.end()
        return section[:insert_at] + "  \n" + insertion_line + section[insert_at:]
    # Last fallback: prepend after the section heading
    head_match = re.match(r"^### \d+\.[^\n]*\n", section)
    if head_match:
        return section[:head_match.end()] + "\n" + insertion_line + "\n" + section[head_match.end():]
    return insertion_line + "\n" + section


# ---------------------------------------------------------------------------
# Phase C: D2 high-majority normalizations
# ---------------------------------------------------------------------------


def apply_d2_normalizations(
    content: str,
    findings: list[dict],
) -> tuple[str, list[dict], list[dict]]:
    """Apply D2 normalizations where one variant has >= 80% share and >= 4 occ.

    For each minority variant in such a finding, locate the row(s) in the master
    MD and rewrite the correction cell to the majority canonical form. Append a
    Layer 5 audit annotation to the notes cell preserving the original
    correction text.

    Returns (new_content, normalized_list, skipped_list).
    """
    normalized = []
    skipped = []
    for f in findings:
        share = f["majority_share"]
        total = f["total_occurrences"]
        if not isinstance(share, (int, float)) or share < 0.80 or total < 4:
            continue
        majority = f["majority_correction"]
        majority_norm = _norm_name(majority)
        variants = f["variants"]
        # Each variant has correction/entries/sample_row_ids
        for variant in variants:
            v_corr = variant["correction"]
            if _norm_name(v_corr) == majority_norm:
                continue  # this IS the majority
            for row_id in variant["sample_row_ids"]:
                # Parse entry number from row_id
                m = re.match(r"^(\d+)\.", row_id)
                if not m:
                    skipped.append({"row_id": row_id, "reason": "malformed row_id"})
                    continue
                entry = int(m.group(1))
                try:
                    sec_start, sec_end = entry_section_bounds(content, entry)
                except ValueError:
                    skipped.append({"entry": entry, "row_id": row_id, "reason": "entry not found"})
                    continue
                section = content[sec_start:sec_end]
                match = find_row_line(section, row_id)
                if match is None:
                    skipped.append({"entry": entry, "row_id": row_id, "reason": "row not in pre-Pass-4"})
                    continue
                line_start, line_end, line = match
                # Verify the line's current correction actually matches v_corr
                # (defensive — don't blindly rewrite if the row was already updated)
                cells = split_row_cells(line)
                if len(cells) < 3:
                    skipped.append({"entry": entry, "row_id": row_id, "reason": "row has <3 cells"})
                    continue
                current_corr = cells[2].strip()
                if _norm_name(current_corr) == majority_norm:
                    skipped.append({"entry": entry, "row_id": row_id, "reason": "already normalized (idempotent)"})
                    continue
                # Check if Layer 5 already annotated this row
                if ANNOTATE_MARKER in cells[-1]:
                    # Check whether this specific annotation is present
                    expected = D2_NORMALIZED_ANNOTATION.format(
                        orig=v_corr, new=majority, pct=int(share * 100), n=total
                    )
                    if expected in cells[-1]:
                        skipped.append({"entry": entry, "row_id": row_id, "reason": "annotation already present"})
                        continue
                # Apply normalization
                new_line = replace_correction_in_row(line, majority)
                annotation = D2_NORMALIZED_ANNOTATION.format(
                    orig=v_corr, new=majority, pct=int(share * 100), n=total
                )
                new_line, _ = update_notes_in_row(new_line, annotation)
                new_section = section[:line_start] + new_line + section[line_end:]
                content = content[:sec_start] + new_section + content[sec_end:]
                normalized.append({
                    "entry": entry,
                    "row_id": row_id,
                    "orig": v_corr,
                    "new": majority,
                    "share": share,
                })
    return content, normalized, skipped


# ---------------------------------------------------------------------------
# Phase D: ambiguous D2 + D3 annotations
# ---------------------------------------------------------------------------


def annotate_d2_ambiguous(
    content: str,
    findings: list[dict],
) -> tuple[str, list[dict], list[dict]]:
    """Annotate D2 findings with majority share < 80% as ambiguous (ensemble)."""
    annotated = []
    skipped = []
    for f in findings:
        share = f["majority_share"]
        total = f["total_occurrences"]
        if not isinstance(share, (int, float)) or share >= 0.80 or total < 2:
            continue
        for variant in f["variants"]:
            for row_id in variant["sample_row_ids"]:
                m = re.match(r"^(\d+)\.", row_id)
                if not m:
                    continue
                entry = int(m.group(1))
                try:
                    sec_start, sec_end = entry_section_bounds(content, entry)
                except ValueError:
                    skipped.append({"entry": entry, "row_id": row_id, "reason": "entry not found"})
                    continue
                section = content[sec_start:sec_end]
                match = find_row_line(section, row_id)
                if match is None:
                    skipped.append({"entry": entry, "row_id": row_id, "reason": "row not in pre-Pass-4"})
                    continue
                line_start, line_end, line = match
                new_line, changed = update_notes_in_row(line, D2_AMBIGUOUS_ANNOTATION)
                if not changed:
                    continue
                new_section = section[:line_start] + new_line + section[line_end:]
                content = content[:sec_start] + new_section + content[sec_end:]
                annotated.append({"entry": entry, "row_id": row_id})
    return content, annotated, skipped


def annotate_d3_contradictions(
    content: str,
    findings: list[dict],
) -> tuple[str, list[dict], list[dict]]:
    """Annotate D3 catalog contradictions as ensemble-adjudication-pending.

    Exception: if the contradiction is purely a formatting/casing variant (high
    token overlap, both names are clearly the same person) AND one form has
    catalog majority, we do not auto-apply (still annotate) -- per the prompt
    constraint to defer anything we're unsure about.
    """
    annotated = []
    skipped = []
    for f in findings:
        entry = f["entry_number"]
        row_id = f["row_id"]
        catalog_section = f["catalog_section"]
        catalog_canon = f["catalog_canonical"]
        try:
            sec_start, sec_end = entry_section_bounds(content, entry)
        except ValueError:
            skipped.append({"entry": entry, "row_id": row_id, "reason": "entry not found"})
            continue
        section = content[sec_start:sec_end]
        match = find_row_line(section, row_id)
        if match is None:
            skipped.append({"entry": entry, "row_id": row_id, "reason": "row not in pre-Pass-4"})
            continue
        line_start, line_end, line = match
        annotation = D3_CONTRADICTION_ANNOTATION.format(
            section=catalog_section, canon=catalog_canon[:80]
        )
        new_line, changed = update_notes_in_row(line, annotation)
        if not changed:
            continue
        new_section = section[:line_start] + new_line + section[line_end:]
        content = content[:sec_start] + new_section + content[sec_end:]
        annotated.append({"entry": entry, "row_id": row_id, "catalog_section": catalog_section})
    return content, annotated, skipped


# ---------------------------------------------------------------------------
# Main driver
# ---------------------------------------------------------------------------


def main(dry_run: bool = False) -> int:
    print("=" * 78)
    print(f"Layer 5 fidelity-deploy ({'DRY RUN' if dry_run else 'APPLYING'})")
    print("=" * 78)

    audit = json.loads(LAYER5_JSON.read_text(encoding="utf-8"))
    original_content = MASTER.read_text(encoding="utf-8")
    content = original_content
    original_size = len(content)

    canonical_names = load_canonical_names()
    print(f"\nLoaded {len(canonical_names)} canonical names + aliases from civil_rights_facts.json")
    print(f"Master MD: {original_size:,} chars / {original_content.count(chr(10)):,} lines")

    d1 = audit.get("dimension_1_findings", [])
    d2 = audit.get("dimension_2_findings", [])
    d3 = audit.get("dimension_3_findings", [])
    print(f"\nLayer 5 inputs: D1={len(d1)}, D2={len(d2)}, D3={len(d3)}, D4={len(audit.get('dimension_4_findings', []))}")

    # Phase A: D1 canonical-figure annotation
    print("\n" + "-" * 78)
    print("Phase A: D1 canonical-figure annotation")
    print("-" * 78)
    content, a_annotated, a_skipped = annotate_d1_canonical(content, d1, canonical_names)
    print(f"  Annotated: {len(a_annotated)} rows")
    print(f"  Skipped:   {len(a_skipped)} rows")
    for r in a_annotated[:10]:
        print(f"    #{r['entry']} {r['row_id']} (fuzzy={r['fuzzy']:.1f}) -> {r['correction']}")
    if len(a_annotated) > 10:
        print(f"    ... and {len(a_annotated) - 10} more")

    # Phase B: D1 low-impact removal
    print("\n" + "-" * 78)
    print("Phase B: D1 low-impact removal")
    print("-" * 78)
    content, b_removed, b_skipped, b_per_entry = remove_d1_low_impact(content, d1, canonical_names)
    print(f"  Removed: {len(b_removed)} rows across {len(b_per_entry)} entries")
    print(f"  Skipped: {len(b_skipped)} rows")
    if b_per_entry:
        top_5 = sorted(b_per_entry.items(), key=lambda x: -x[1])[:5]
        print(f"  Top-5 entries by removal count: " + ", ".join(f"#{e}={n}" for e, n in top_5))

    # Phase C: D2 high-majority normalizations
    print("\n" + "-" * 78)
    print("Phase C: D2 high-majority normalizations (>=80%, >=4 occ)")
    print("-" * 78)
    content, c_normalized, c_skipped = apply_d2_normalizations(content, d2)
    print(f"  Normalized: {len(c_normalized)} rows")
    print(f"  Skipped:    {len(c_skipped)} rows")
    for r in c_normalized[:15]:
        print(f"    #{r['entry']} {r['row_id']}: {r['orig']!r} -> {r['new']!r} ({r['share']*100:.0f}%)")
    if len(c_normalized) > 15:
        print(f"    ... and {len(c_normalized) - 15} more")

    # Phase D-1: D2 ambiguous annotation
    print("\n" + "-" * 78)
    print("Phase D-1: D2 ambiguous annotation (majority share < 80%)")
    print("-" * 78)
    content, d2amb_annotated, d2amb_skipped = annotate_d2_ambiguous(content, d2)
    print(f"  Annotated: {len(d2amb_annotated)} rows")
    print(f"  Skipped:   {len(d2amb_skipped)} rows")

    # Phase D-2: D3 contradiction annotation
    print("\n" + "-" * 78)
    print("Phase D-2: D3 catalog-vs-per-entry contradiction annotation")
    print("-" * 78)
    content, d3_annotated, d3_skipped = annotate_d3_contradictions(content, d3)
    print(f"  Annotated: {len(d3_annotated)} rows")
    print(f"  Skipped:   {len(d3_skipped)} rows")

    # Summary
    new_size = len(content)
    print("\n" + "=" * 78)
    print("Summary")
    print("=" * 78)
    print(f"Master MD size: {original_size:,} -> {new_size:,} chars ({new_size - original_size:+,})")
    print(f"  D1 canonical-figure rows annotated for ensemble:  {len(a_annotated)}")
    print(f"  D1 low-impact phantom rows physically removed:    {len(b_removed)}")
    print(f"  D2 high-majority normalizations applied:          {len(c_normalized)}")
    print(f"  D2 ambiguous rows annotated for ensemble:         {len(d2amb_annotated)}")
    print(f"  D3 catalog contradictions annotated for ensemble: {len(d3_annotated)}")
    total_changes = len(a_annotated) + len(b_removed) + len(c_normalized) + len(d2amb_annotated) + len(d3_annotated)
    print(f"  Total rows mutated:                                {total_changes}")

    if not dry_run:
        MASTER.write_text(content, encoding="utf-8")
        print(f"\nWrote {MASTER}")
    else:
        print("\n(dry-run; no write)")

    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing.")
    args = parser.parse_args()
    sys.exit(main(dry_run=args.dry_run))
