"""
Layer 5 corpus-global fidelity audit — master MD parser.

Parses transcripts/CLEANED_TRANSCRIPTS_REVIEW.md into structured records:
  - Per-entry correction rows (Pass 1, Pass 2, Pass 2 tail-sweep, Pass 3, Pass 4)
  - Catalog rows (sections A-Z + extension subsections, two formats)
  - Per-entry metadata (subject paragraph, source dir, cross-references)

Reusable module: from layer5_extract_corrections import parse_master_md
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Iterable

MASTER_MD = Path(r"D:\civil\transcripts\CLEANED_TRANSCRIPTS_REVIEW.md")

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class CorrectionRow:
    """One row from a per-entry Pass-N table."""
    entry_number: int
    entry_subject_short: str        # First half of entry header
    pass_section: str               # 'Pass 1', 'Pass 2', 'Pass 2 tail-sweep', 'Pass 3', 'Pass 4'
    row_id: str                     # e.g. '1.4', '1.P2.7', '1.P2T.12', '1.P3.3', '1.P4.1'
    whisper_rendering: str
    correction: str
    confidence: str
    source: str
    notes: str
    raw_line: int                   # 1-based line in master MD


@dataclass
class CatalogRow:
    """One row from a cross-corpus catalog (sections A-Z + extension)."""
    section: str                    # 'A', 'B', ..., 'A-ext', 'B-ext', ...
    section_title: str              # the ### heading text
    canonical_correction: str
    whisper_rendering: str          # may be multiple variants
    extra_columns: list             # frequency/recurrence/source-entries
    raw_line: int


@dataclass
class EntryMetadata:
    """Per-entry metadata."""
    entry_number: int
    entry_header: str               # e.g. '1. Aaron Dixon'
    entry_subject_short: str        # e.g. 'Aaron Dixon'
    source_dir: str | None          # 'transcripts/raw/Aaron Dixon_interview_20250704_170306'
    interviewer_date: str | None
    subject_paragraph: str | None
    cross_references: str | None
    start_line: int
    end_line: int                   # exclusive
    full_text: str                  # the text of just this entry


@dataclass
class ParseResult:
    entries: list[EntryMetadata]
    correction_rows: list[CorrectionRow]
    catalog_rows: list[CatalogRow]
    master_md_chars: int
    master_md_lines: int


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

ENTRY_HEADER_RE = re.compile(r"^### (\d+)\. (.+?)$", re.MULTILINE)
SOURCE_RE = re.compile(r"^\*\*Source\*\*:\s*`(transcripts/raw/[^`]+)/?`", re.MULTILINE)
INTERVIEWER_RE = re.compile(r"^\*\*Interviewer\s*/\s*Date\*\*:\s*(.+)$", re.MULTILINE)
SUBJECT_RE = re.compile(r"^\*\*Subject\*\*:\s*(.+)$", re.MULTILINE)
CROSSREFS_RE = re.compile(r"^\*\*Cross[- ]references\*\*:\s*(.+)$", re.MULTILINE)
PASS_HEADER_RE = re.compile(r"^####\s+(.+?)$", re.MULTILINE)
TABLE_ROW_RE = re.compile(r"^\|(.*?)\|\s*$", re.MULTILINE)
CATALOG_SECTION_RE = re.compile(r"^###\s+([A-Z](?:[\.\-][A-Z0-9a-z]+)?)\s*[\.\-]?\s*(.+?)$", re.MULTILINE)


def _split_table_row(line: str) -> list[str]:
    """Split a markdown table row into cell values (excluding leading/trailing |)."""
    # Strip leading/trailing | and split. Tolerate cells with escaped pipes.
    inner = line.strip()
    if inner.startswith("|"):
        inner = inner[1:]
    if inner.endswith("|"):
        inner = inner[:-1]
    return [c.strip() for c in inner.split("|")]


def _is_separator_row(cells: list[str]) -> bool:
    """Markdown table separator row, e.g. |---|---|."""
    return all(re.fullmatch(r":?-{3,}:?", c.strip()) for c in cells if c.strip())


def _is_correction_row_id(cell0: str) -> bool:
    """Heuristic: does cell0 look like a correction row id (e.g. '1.4', '1.P2.7', '1.P2T.12', '1.P3.3', '1.P4.1', '1.P2T.12 RELOC')?"""
    s = cell0.strip()
    if not s:
        return False
    # Remove optional trailing RELOC / suffix annotations
    s = re.sub(r"\s+\(?(RELOC|MOVED|SKIPPED)\)?$", "", s, flags=re.IGNORECASE)
    return bool(re.fullmatch(r"\d+\.(P[234]T?\.)?\d+[A-Za-z]?", s))


def parse_master_md(path: Path = MASTER_MD) -> ParseResult:
    text = path.read_text(encoding="utf-8")
    lines = text.split("\n")
    n_lines = len(lines)
    n_chars = len(text)

    # Build line-offset to position mapping
    line_offsets = [0]
    for ln in lines:
        line_offsets.append(line_offsets[-1] + len(ln) + 1)

    # Find all entry header positions
    entry_headers: list[tuple[int, int, str]] = []  # (line_idx, number, short_title)
    for m in ENTRY_HEADER_RE.finditer(text):
        # convert char position to line index
        pos = m.start()
        line_idx = text.count("\n", 0, pos)  # 0-based
        entry_headers.append((line_idx, int(m.group(1)), m.group(2).strip()))

    if not entry_headers:
        raise RuntimeError("No entry headers found")

    # Detect the boundary between catalog and entries
    # Catalog stops at the first entry header line
    first_entry_line = entry_headers[0][0]
    catalog_text_lines = lines[:first_entry_line]
    catalog_text = "\n".join(catalog_text_lines)

    # ---- Parse catalog rows ----
    catalog_rows: list[CatalogRow] = []
    # Find ### sub-sections within catalog
    current_section = None
    current_section_title = ""
    in_extension = False
    for i, line in enumerate(catalog_text_lines):
        if line.startswith("## Cross-corpus catalog - Phase 1b back-fill extension"):
            in_extension = True
        if line.startswith("### "):
            # Determine section letter
            m = re.match(r"^### Section\s+([A-Z])\s+extension\b", line)
            if m:
                current_section = m.group(1) + "-ext"
                current_section_title = line[4:].strip()
                continue
            m = re.match(r"^###\s+([A-Z])\.\s+(.+)$", line)
            if m:
                current_section = m.group(1)
                current_section_title = line[4:].strip()
                continue
            # Some Z. section or other naming
            m = re.match(r"^###\s+([A-Z])\b\s*[\.\-]?\s*(.*)$", line)
            if m:
                letter = m.group(1)
                if in_extension:
                    current_section = letter + "-ext"
                else:
                    current_section = letter
                current_section_title = line[4:].strip()
                continue
        if line.startswith("## "):
            # Sub-header inside front-matter
            continue

        if current_section is None:
            continue

        if line.startswith("|"):
            cells = _split_table_row(line)
            if len(cells) < 2:
                continue
            if _is_separator_row(cells):
                continue
            # Catalog format depends on section:
            #   Original A-Z: | Whisper rendering | Canonical correction | Frequency | Example entries |
            #   Extension:    | Canonical correction | Whisper renderings (variants) | Recurrence | Source entries | Source-tag | Confidence |
            first_cell = cells[0].strip()
            # Skip the header row
            if first_cell.lower() in ("whisper rendering", "canonical correction", "#", "row", "pattern"):
                continue
            if not any(c.strip() for c in cells):
                continue
            if current_section.endswith("-ext"):
                # extension format: canonical first, whisper second
                if len(cells) < 2:
                    continue
                canonical = cells[0]
                whisper = cells[1] if len(cells) > 1 else ""
                extras = cells[2:] if len(cells) > 2 else []
                # If the WHISPER cell contains arrow notation like:
                #     "Gloucester Current" -> "Gloster Current"
                # Then prefer the RHS of the arrow as the canonical (it's the real
                # canonical, the LHS is the whisper). And if col[0] (canonical) is
                # a long descriptive note ("NAACP Director of Branches 1947-78..."),
                # use the arrow-rhs canonical instead.
                m_arrow = re.search(r"->\s*[\"']?([^\"'|]+?)[\"']?\s*$", whisper)
                if m_arrow:
                    arrow_canon = m_arrow.group(1).strip()
                    # Also strip the "-> X" portion from whisper to get just the lhs
                    arrow_whisper_match = re.match(r"\s*[\"']?([^\"']+?)[\"']?\s*->", whisper)
                    if arrow_whisper_match:
                        whisper = arrow_whisper_match.group(1).strip()
                    # If canonical cell looks like a description (long, contains
                    # parens, semicolons, etc.) prefer arrow_canon
                    if len(canonical) > 60 or ";" in canonical or "(" in canonical:
                        canonical = arrow_canon
            else:
                # original format: whisper first
                whisper = cells[0]
                canonical = cells[1] if len(cells) > 1 else ""
                extras = cells[2:] if len(cells) > 2 else []
            catalog_rows.append(
                CatalogRow(
                    section=current_section,
                    section_title=current_section_title,
                    canonical_correction=canonical,
                    whisper_rendering=whisper,
                    extra_columns=extras,
                    raw_line=i + 1,
                )
            )

    # ---- Parse entries ----
    entries: list[EntryMetadata] = []
    correction_rows: list[CorrectionRow] = []
    for idx, (line_idx, number, short_title) in enumerate(entry_headers):
        start = line_idx
        end = entry_headers[idx + 1][0] if idx + 1 < len(entry_headers) else n_lines
        # Watch for the end of the "Transcripts" section — closeout sections
        # Find first non-entry boundary (## marker)
        for k in range(start + 1, end):
            if lines[k].startswith("## "):
                end = k
                break
        entry_text = "\n".join(lines[start:end])

        # Skip SKIPPED entries — they have no Source line
        src_match = SOURCE_RE.search(entry_text)
        source_dir = src_match.group(1) if src_match else None

        iv_match = INTERVIEWER_RE.search(entry_text)
        interviewer_date = iv_match.group(1).strip() if iv_match else None

        subj_match = SUBJECT_RE.search(entry_text)
        subject_paragraph = subj_match.group(1).strip() if subj_match else None

        cr_match = CROSSREFS_RE.search(entry_text)
        cross_references = cr_match.group(1).strip() if cr_match else None

        em = EntryMetadata(
            entry_number=number,
            entry_header=f"{number}. {short_title}",
            entry_subject_short=short_title,
            source_dir=source_dir,
            interviewer_date=interviewer_date,
            subject_paragraph=subject_paragraph,
            cross_references=cross_references,
            start_line=start + 1,
            end_line=end + 1,
            full_text=entry_text,
        )
        entries.append(em)

        if source_dir is None:
            # SKIPPED / DEFERRED entries — no correction rows to harvest
            continue

        # Walk through entry's lines, tracking current pass section
        current_pass = "unknown"
        for j in range(start, end):
            line = lines[j]
            if line.startswith("#### "):
                low = line[5:].strip().lower()
                if "pass 1" in low and "closeout" not in low:
                    current_pass = "Pass 1"
                elif "pass 2 tail" in low:
                    current_pass = "Pass 2 tail-sweep"
                elif "pass 2" in low and "tail" not in low:
                    current_pass = "Pass 2"
                elif "pass 3" in low:
                    current_pass = "Pass 3"
                elif "pass 4" in low:
                    current_pass = "Pass 4"
                else:
                    current_pass = line[5:].strip()
                continue
            if not line.lstrip().startswith("|"):
                continue
            cells = _split_table_row(line)
            if len(cells) < 4:
                continue
            if _is_separator_row(cells):
                continue
            if not _is_correction_row_id(cells[0]):
                continue
            # We expect format: row_id | whisper | correction | confidence | source | notes
            row_id = cells[0].strip()
            whisper = cells[1] if len(cells) > 1 else ""
            correction = cells[2] if len(cells) > 2 else ""
            confidence = cells[3] if len(cells) > 3 else ""
            source = cells[4] if len(cells) > 4 else ""
            notes = cells[5] if len(cells) > 5 else ""
            # Detect mis-shaped tables:
            #   (a) Confidence resolutions:  | row_id | old_conf | new_conf | notes |
            #       cells[1] and cells[2] are bare confidence words like "high"/"medium"/"low"
            #   (b) Adversarial-review flags: | row_id | Item | Reason |  (no real whisper rendering)
            #       cells[1] is descriptive, cells[2] is reason text — not a correction row
            _CONF_WORDS = {"high", "medium", "low", "correct", "speaker-originating",
                            "flagged-for-adversarial-review", "flagged", "n/a",
                            "low (spelling)", "high (spelling)", "low (flag)",
                            "medium (flag)", "high (flag)"}
            w_norm = whisper.lower().strip().strip("*")
            c_norm = correction.lower().strip().strip("*")
            if w_norm in _CONF_WORDS and c_norm in _CONF_WORDS:
                # (a) confidence-resolution row — skip; the real correction row is captured elsewhere
                continue
            # If there are MORE cells (e.g. 7+), concat the trailing ones into notes
            if len(cells) > 6:
                notes = " | ".join(cells[5:])
            correction_rows.append(
                CorrectionRow(
                    entry_number=number,
                    entry_subject_short=short_title,
                    pass_section=current_pass,
                    row_id=row_id,
                    whisper_rendering=whisper,
                    correction=correction,
                    confidence=confidence,
                    source=source,
                    notes=notes,
                    raw_line=j + 1,
                )
            )

    return ParseResult(
        entries=entries,
        correction_rows=correction_rows,
        catalog_rows=catalog_rows,
        master_md_chars=n_chars,
        master_md_lines=n_lines,
    )


# ---------------------------------------------------------------------------
# Helpers exposed for downstream scripts
# ---------------------------------------------------------------------------

def normalize_text(s: str) -> str:
    """Lower-case, collapse internal whitespace, strip punctuation that varies."""
    s = s.lower()
    s = re.sub(r"[‘’“”`]", "'", s)
    s = re.sub(r"[–—\-]", "-", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def strip_meta_markers(s: str) -> str:
    """Strip markdown emphasis markers and footnote / annotation tails."""
    s = re.sub(r"\*+", "", s)
    s = re.sub(r"_+", "", s)
    # Strip explanatory parenthetical at end if present
    s = re.sub(r"\s*\(see\s+#[^)]+\)$", "", s)
    return s.strip()


_QUOTED_RE = re.compile(r"\"([^\"]{2,80})\"|'([^']{2,80})'")
_PAREN_RE = re.compile(r"\([^)]*\)")


def first_variant(whisper_field: str) -> list[str]:
    """The whisper field often contains multiple variants in several syntactic forms:

      - slash-separated:   "Joe Manier / Joe Mania / Joe Maner"
      - 'or'-separated:    "Pittsburgh Korea or Pittsburgh Kuzat"
      - quoted-with-context: '"Reverend Brann" (3 occurrences at lines 23, 31)'
      - quoted multiple:    '"Bishop Sterling Brown" / "Ralph Bunch" (in ...)'

    Returns a list of candidate raw renderings to test against the raw transcript.
    """
    s = whisper_field.strip()
    if not s:
        return []

    # 1) If the field contains quoted spans, prefer those as the variants.
    quoted = []
    for m in _QUOTED_RE.finditer(s):
        q = (m.group(1) or m.group(2) or "").strip()
        if q and len(q) >= 2 and q.lower() not in ("see", "n/a", "uncertain"):
            quoted.append(q)
    if quoted:
        return quoted

    # 2) Else: strip parenthetical asides and split on slash/or
    s = _PAREN_RE.sub("", s)
    s = re.sub(r"\s*\bor\b\s*", "||", s, flags=re.IGNORECASE)
    s = s.replace(" / ", "||").replace("/", "||")
    parts = [p.strip(" \"'") for p in s.split("||") if p.strip()]
    return [p for p in parts if p and len(p) >= 2]


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    result = parse_master_md()
    print(f"Master MD: {result.master_md_chars:,} chars, {result.master_md_lines:,} lines")
    print(f"Entries parsed: {len(result.entries)}")
    skipped = [e for e in result.entries if e.source_dir is None]
    print(f"  SKIPPED entries: {len(skipped)} -> {[e.entry_number for e in skipped]}")
    print(f"Correction rows: {len(result.correction_rows):,}")
    # Count by pass
    from collections import Counter
    pass_counts = Counter(r.pass_section for r in result.correction_rows)
    for p, n in pass_counts.most_common():
        print(f"  {p}: {n:,}")
    print(f"Catalog rows: {len(result.catalog_rows):,}")
    cat_counts = Counter(r.section for r in result.catalog_rows)
    for s, n in cat_counts.most_common():
        print(f"  Section {s}: {n}")


if __name__ == "__main__":
    main()
