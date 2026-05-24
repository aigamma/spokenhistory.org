#!/usr/bin/env python3
"""Apply Pass 7 Subject paragraph corrections to the master overlay.

The Pass 7 aggregate JSON records which entries have Subject-paragraph claims
that need fixing, but its `corrected_subject_paragraph` fields are null. The
authoritative revised paragraphs live in the per-entry PRR staging files under
`transcripts/pass7_stage/`.

This script:
  1. Reads `subject_paragraph_corrections_pass7.json`.
  2. For each listed entry, extracts the corrected Subject paragraph from that
     entry's Pass 7 PRR staging file.
  3. Replaces the entry-header `**Subject**:` / `**Subjects**:` line in
     `CLEANED_TRANSCRIPTS_REVIEW.md`, before the Pass 1 block.

It is idempotent: re-running after a successful apply produces zero changes.
"""
from __future__ import annotations

import argparse
import io
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
TRANSCRIPTS = ROOT / "transcripts"
MASTER = TRANSCRIPTS / "CLEANED_TRANSCRIPTS_REVIEW.md"
CORRECTIONS_JSON = TRANSCRIPTS / "subject_paragraph_corrections_pass7.json"
PASS7_STAGE = TRANSCRIPTS / "pass7_stage"

CORRECTED_MARKER_RE = re.compile(
    r"^\*\*(?:"
    r"(?:recommended\s+corrected|corrected|revised|proposed\s+refined)\s+subject\s+paragraph[^*]*"
    r"|corrected/clarified\s+subject\s+paragraph[^*]*"
    r"|recommended\s+subject\s+paragraph\s+rewrite[^*]*"
    r"|subject\s+paragraph\s+(?:-|–|—|â€”)\s+recommended\s+revision[^*]*"
    r"|recommended\s+rewrite"
    r")\s*:?\*\*(?:\s*[:(].*)?\s*$",
    re.IGNORECASE,
)
REPLACE_INSTRUCTION_RE = re.compile(
    r'^Replace(?:\s+the\s+phrase)?\s+"(?P<old>.+?)"\s+with:?\s+"(?P<new>.+?)"(?:\s*\(.*\))?\.?$',
    re.IGNORECASE,
)
CORRECTED_HEADING_RE = re.compile(
    r"^#{1,6}\s+(?:corrected|recommended|revised)\s+subject\s+paragraph\b",
    re.IGNORECASE,
)
NEXT_SECTION_RE = re.compile(r"^(?:---|#{1,6}\s+Section\s+2|#{1,6}\s+2\.|##\s+Section\s+2)", re.IGNORECASE)

MANUAL_REPLACEMENTS: dict[int, list[tuple[str, str]]] = {
    110: [
        ('Roberta "Bird" Alexander', 'Roberta "Birdie" Alexander'),
        (
            "Franklin Alexander (b. 1914 Omaha NE / Sioux City IA / Winnebago Reservation,",
            "Franklin Alexander (b. c. 1914, inferred — Omaha NE / Sioux City IA / Winnebago Reservation area,",
        ),
        (
            "canonical UCSB Spanish professor + their study-abroad-program director Carlos Blanco Aguinaga",
            "canonical UCSD Spanish-language scholar + their study-abroad-program director Carlos Blanco Aguinaga",
        ),
        ("the Adler Justowriter machine", "the (IBM) Justowriter machine"),
    ],
    122: [
        (
            "after his canonical 1940s-era separation from her mother + canonical 1950s remarriage",
            "after his separation from her mother during Virginia's early childhood + subsequent remarriage",
        ),
        ("federal MA-4/MA-5 contracts", "federal MA-4 Manpower Administration contracts"),
    ],
    129: [
        (
            "arrested 3 times in Americus including 1 LIFE magazine front-page incident",
            "arrested 3 times in Americus (described by speaker as front-page news across LA Times, Atlanta Journal-Constitution, and New York Times; LIFE magazine coverage unverified from transcript alone)",
        ),
    ],
}

LINE_REMOVALS: dict[int, list[str]] = {
    71: ["John Patterson (Alabama gov."],
}

# The Pass 7 aggregate JSON missed these hard-stop Subject-paragraph blockers,
# but CODEX_MASTER_PROMPT and the per-entry PRR files explicitly call them out.
SUPPLEMENTAL_HARD_STOP_ENTRIES = {
    96: "Peggy Jean Connor",
    108: "Robert L. Carter",
    130: "William Saunders",
}


@dataclass
class SubjectCorrection:
    entry_number: int
    subject: str
    stage_file: Path
    original_label: str
    current_paragraph: str
    corrected_paragraph: str
    manual: bool = False
    replacement_instructions: bool = False


def entry_section_bounds(content: str, n: int) -> tuple[int, int]:
    # Pass 7 PRR blocks contain nested headings such as
    # `### 3. Residual ground-truth corpus proposals`; top-level entry
    # headings are followed by a blank line and `**Source**:`.
    heading_re = re.compile(rf"^### {n}\. .+\n\n\*\*Source\*\*:", re.MULTILINE)
    m = heading_re.search(content)
    if not m:
        raise ValueError(f"No heading for entry #{n}")
    next_heading_re = re.compile(r"^### \d+\. .+\n\n\*\*Source\*\*:", re.MULTILINE)
    nxt = next_heading_re.search(content, m.end())
    end = nxt.start() if nxt else len(content)
    return m.start(), end


def load_target_entries() -> list[dict]:
    data = json.loads(CORRECTIONS_JSON.read_text(encoding="utf-8"))
    entries = data.get("entries", {})
    if not isinstance(entries, dict):
        raise ValueError("Expected subject_paragraph_corrections_pass7.json entries to be an object")
    out = []
    for key in sorted(entries, key=lambda k: int(k)):
        entry = entries[key]
        claims = entry.get("claims_needing_fix") or []
        if claims:
            out.append(entry)
    existing = {int(entry["entry_number"]) for entry in out}
    for entry_number, subject in sorted(SUPPLEMENTAL_HARD_STOP_ENTRIES.items()):
        if entry_number not in existing:
            out.append(
                {
                    "entry_number": entry_number,
                    "subject": subject,
                    "claims_needing_fix": [{"grade": "hard-stop-supplemental"}],
                }
            )
    out.sort(key=lambda entry: int(entry["entry_number"]))
    return out


def stage_file_for_entry(entry_number: int) -> Path:
    matches = sorted(PASS7_STAGE.glob(f"entry_{entry_number:03d}_*.md"))
    if len(matches) != 1:
        raise FileNotFoundError(
            f"Expected one Pass 7 stage file for entry {entry_number}, found {len(matches)}"
        )
    return matches[0]


def line_block(lines: list[str], start_idx: int) -> list[str]:
    """Return candidate lines after a marker, stopping at Section 2 or divider."""
    block: list[str] = []
    for line in lines[start_idx:]:
        if NEXT_SECTION_RE.match(line.strip()):
            break
        block.append(line)
    return block


def first_blockquote(block: list[str]) -> str | None:
    """Return the first contiguous blockquote in a marker block."""
    collected: list[str] = []
    in_quote = False
    for line in block:
        stripped = line.rstrip()
        if stripped.startswith(">"):
            in_quote = True
            collected.append(re.sub(r"^>\s?", "", stripped))
            continue
        if in_quote:
            break
    if not collected:
        return None
    return " ".join(part.strip() for part in collected if part.strip()).strip()


def first_plain_paragraph(block: list[str]) -> str | None:
    """Return the first non-table, non-list paragraph in a marker block."""
    para: list[str] = []
    started = False
    for raw in block:
        line = raw.strip()
        if not line:
            if started:
                break
            continue
        if line.startswith(">"):
            # Blockquotes are handled separately.
            continue
        if line.startswith("|") or re.match(r"^\d+\.\s+", line):
            if started:
                break
            continue
        if line.startswith("- ") or line.startswith("* "):
            if started:
                break
            continue
        if re.match(r"^\*\*(?:Changes made|Summary|Subject paragraph verdict)", line, re.IGNORECASE):
            if started:
                break
            continue
        if line.startswith("#"):
            if started:
                break
            continue
        started = True
        para.append(line)
    if not para:
        return None
    return " ".join(para).strip()


def inline_after_marker(line: str) -> str | None:
    if ":" not in line:
        return None
    after = line.split(":", 1)[1].strip()
    if not after:
        return None
    after = re.sub(r"^\*\*", "", after).strip()
    if re.search(r"no\s+(?:full\s+rewrite|substantive\s+corrections?|corrections?)\s+(?:required|needed)", after, re.IGNORECASE):
        return None
    if len(after) < 80:
        return None
    return after


def candidate_is_publishable(candidate: str) -> bool:
    lowered = candidate.lower()
    if not candidate or len(candidate) < 80:
        return False
    bad_prefixes = (
        "**changes made",
        "changes made:",
        "**summary",
        "summary:",
        "no corrections needed",
        "no substantive corrections required",
        "no full rewrite required",
        "a minor precision improvement:",
        "replace ",
        "all other claims",
        "changes:",
    )
    return not lowered.startswith(bad_prefixes)


def extract_replacement_instructions(block: list[str]) -> list[tuple[str, str]]:
    replacements: list[tuple[str, str]] = []
    for raw in block:
        line = raw.strip()
        if not line:
            continue
        m = REPLACE_INSTRUCTION_RE.match(line)
        if m:
            replacements.append((m.group("old"), m.group("new")))
    return replacements


def extract_corrected_subject(stage_text: str) -> tuple[str | None, list[tuple[str, str]]]:
    lines = stage_text.splitlines()
    candidates: list[str] = []
    replacements: list[tuple[str, str]] = []
    for i, line in enumerate(lines):
        if not (CORRECTED_MARKER_RE.search(line) or CORRECTED_HEADING_RE.search(line.strip())):
            continue

        block = line_block(lines, i + 1)
        replacements.extend(extract_replacement_instructions(block))
        quoted = first_blockquote(block)
        if quoted and candidate_is_publishable(quoted):
            candidates.append(quoted)

        plain = first_plain_paragraph(block)
        if plain and candidate_is_publishable(plain):
            candidates.append(plain)

    if not candidates:
        return None, replacements
    # Prefer the longest candidate: in files with both a heading and a nested
    # `**Corrected Subject paragraph:**` line, the heading's first block is often
    # a "Changes made" preface, while the real paragraph is longer.
    return max(candidates, key=len), replacements


def clean_publication_markers(paragraph: str) -> str:
    """Remove Pass 7 human-edit markers from the extracted paragraph."""
    out = paragraph.strip()

    # Drop deleted markdown spans while keeping the replacement text.
    out = re.sub(r"~~.*?~~\s*(?:→\s*)?", "", out)

    # Preserve corrected replacement text, remove procedural markers.
    out = re.sub(r"\[CORRECTED:\s*([^\]]+)\]", r"\1", out)
    out = re.sub(r"\[EDIT:\s*([^\]]+)\]", r"\1", out)
    out = re.sub(r"\[PRR-CORRECTION:[^\]]+\]", "", out)
    out = re.sub(r"\[EDIT\]", "", out)
    out = re.sub(r"\[CORRECTED\]", "", out)

    # Remove explicit "remove this" editorial notes.
    out = re.sub(r"\[Remove:[^\]]+\]", "", out, flags=re.IGNORECASE)
    out = re.sub(r"\[NOTE:[^\]]+\]", "", out, flags=re.IGNORECASE)
    out = re.sub(r"\s+\**Cross-references corrections\**:.*$", "", out, flags=re.IGNORECASE)

    # For bracketed rationale like "[term -> old removed: reason]", keep the
    # publishable term before the arrow.
    def clean_bracket(match: re.Match[str]) -> str:
        text = match.group(1).strip()
        if "→" in text:
            return text.split("→", 1)[0].strip()
        if "removed:" in text.lower():
            return ""
        return f"[{text}]"

    out = re.sub(r"\[([^\]]+)\]", clean_bracket, out)

    # Strip markdown emphasis used to show changed words in PRR output.
    out = out.replace("**", "").replace("__", "")
    out = re.sub(r"(?<!\w)\*(?!\s)(.*?)\*(?!\w)", r"\1", out)

    # Remove escape slashes used before markdown tildes in stage files.
    out = out.replace(r"\~", "~")

    # Clean punctuation artifacts from removed markers.
    out = re.sub(r"\s+\)", ")", out)
    out = re.sub(r"\(\s+", "(", out)
    out = re.sub(r"\s{2,}", " ", out)
    out = re.sub(r"\s+([,.;:])", r"\1", out)
    out = re.sub(r"\(\s*\)", "", out)
    return out.strip()


def find_subject_line(section: str) -> tuple[int, int, str, str]:
    pass1_idx = section.find("#### Pass 1")
    search_end = pass1_idx if pass1_idx != -1 else min(len(section), 4000)
    header = section[:search_end]
    pattern = re.compile(r"^\*\*(Subjects?)\*\*:\s*(.+)$", re.MULTILINE)
    matches = list(pattern.finditer(header))
    if not matches:
        raise ValueError("No entry-header Subject/Subjects line found")
    match = matches[0]
    label = match.group(1)
    current = match.group(2).strip()
    return match.start(), match.end(), label, current


def build_corrections(master_text: str, targets: list[dict]) -> tuple[list[SubjectCorrection], list[str]]:
    corrections: list[SubjectCorrection] = []
    errors: list[str] = []
    for target in targets:
        entry_number = int(target["entry_number"])
        subject = target.get("subject", "")
        try:
            stage_file = stage_file_for_entry(entry_number)
            start, end = entry_section_bounds(master_text, entry_number)
            section = master_text[start:end]
            line_start, line_end, label, current = find_subject_line(section)
            revised, replacements = extract_corrected_subject(stage_file.read_text(encoding="utf-8"))
            manual = False
            if revised:
                revised = clean_publication_markers(revised)
            elif replacements:
                revised = current
                for old, new in replacements:
                    needle = old
                    if needle not in revised and "'" in old:
                        quote_variant = old.replace("'", '"')
                        if quote_variant in revised:
                            needle = quote_variant
                    if needle not in revised:
                        if new in revised:
                            continue
                        raise ValueError(f"Replacement instruction text not found: {old!r}")
                    revised = revised.replace(needle, new)
                manual = revised != current
            else:
                revised = current
                for old, new in MANUAL_REPLACEMENTS.get(entry_number, []):
                    revised = revised.replace(old, new)
                manual = revised != current
                if (
                    not manual
                    and entry_number not in MANUAL_REPLACEMENTS
                    and entry_number not in LINE_REMOVALS
                ):
                    raise ValueError("No corrected Subject paragraph extracted from stage file")
            corrections.append(
                SubjectCorrection(
                    entry_number=entry_number,
                    subject=subject,
                    stage_file=stage_file,
                    original_label=label,
                    current_paragraph=current,
                    corrected_paragraph=revised,
                    manual=manual,
                    replacement_instructions=bool(replacements),
                )
            )
        except Exception as exc:  # noqa: BLE001 - aggregate all per-entry failures.
            errors.append(f"Entry {entry_number}: {exc}")
    return corrections, errors


def apply_corrections(master_text: str, corrections: list[SubjectCorrection]) -> tuple[str, dict]:
    out = master_text
    changed = 0
    already = 0
    lines_removed = 0
    for corr in sorted(corrections, key=lambda c: c.entry_number, reverse=True):
        start, end = entry_section_bounds(out, corr.entry_number)
        section = out[start:end]
        line_start, line_end, label, current = find_subject_line(section)
        if current == corr.corrected_paragraph:
            already += 1
        else:
            new_line = f"**{label}**: {corr.corrected_paragraph}"
            section = section[:line_start] + new_line + section[line_end:]
            changed += 1

        for needle in LINE_REMOVALS.get(corr.entry_number, []):
            pass1_idx = section.find("#### Pass 1")
            header_end = pass1_idx if pass1_idx != -1 else len(section)
            header = section[:header_end]
            rest = section[header_end:]
            before_header = header
            header = re.sub(rf"^.*{re.escape(needle)}.*\n?", "", header, flags=re.MULTILINE)
            if header != before_header:
                lines_removed += before_header.count(needle) - header.count(needle)
            section = header + rest

        out = out[:start] + section + out[end:]
    return out, {"changed": changed, "already_current": already, "lines_removed": lines_removed}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing master MD")
    parser.add_argument("--report-details", action="store_true", help="Print every changed entry")
    parser.add_argument(
        "--base-ref",
        help="Read CLEANED_TRANSCRIPTS_REVIEW.md from a git ref before applying corrections, e.g. HEAD",
    )
    args = parser.parse_args()

    if args.base_ref:
        rel = MASTER.relative_to(ROOT).as_posix()
        proc = subprocess.run(
            ["git", "show", f"{args.base_ref}:{rel}"],
            cwd=ROOT,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        master_text = proc.stdout.decode("utf-8")
    else:
        master_text = MASTER.read_text(encoding="utf-8")
    targets = load_target_entries()
    corrections, errors = build_corrections(master_text, targets)

    print(f"Targets from Pass 7 JSON plus hard-stop supplements: {len(targets)}")
    print(f"Corrected paragraphs extracted: {len(corrections)}")
    if errors:
        print("Extraction/location errors:", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    new_text, stats = apply_corrections(master_text, corrections)
    print(f"Subject lines changed: {stats['changed']}")
    print(f"Supplemental metadata lines removed: {stats['lines_removed']}")
    print(f"Already current: {stats['already_current']}")
    print(f"Pre chars: {len(master_text)}")
    print(f"Post chars: {len(new_text)}")

    if args.report_details:
        for corr in corrections:
            if corr.current_paragraph != corr.corrected_paragraph:
                print(f"  - #{corr.entry_number} {corr.subject} <- {corr.stage_file.name}")

    if not args.dry_run and new_text != master_text:
        MASTER.write_text(new_text, encoding="utf-8", newline="\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
