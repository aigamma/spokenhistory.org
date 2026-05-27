#!/usr/bin/env python3
"""
apply_corrections.py, Phase 3 of the Civil Rights History Project audit
========================================================================

Parse the per-entry correction tables in ``transcripts/CLEANED_TRANSCRIPTS_REVIEW.md``
and apply high-confidence substitutions to the raw transcripts, producing a parallel
``transcripts/corrected/`` directory tree that the downstream RAG pipeline consumes
instead of ``transcripts/raw/``.

The Smithsonian-grade publication pipeline (the dual-scorer + citation-auditor at
``Metadata Generation System/processor/``) needs corrected transcripts as input, not
raw Whisper output. This script is the preprocessing layer.

Behavior
--------
1. Parse the master MD: each entry is a section delimited by ``### N. <Subject>`` ...
   ``### N+1. <Subject>``. Map each entry to its raw directory via the ``**Source**:
   ``transcripts/raw/<dir>/``` line.
2. For each correction-table row inside that section, extract the row id, whisper
   rendering, correction, confidence, source, and notes columns.
3. Apply substitutions to the text files:
   - Rows with confidence ``correct`` or ``high`` are applied directly to the text.
   - ``.srt`` / ``.vtt`` timestamp lines are preserved; only the cue-text lines are
     touched.
   - The match is case-insensitive substring; the original surrounding case is
     ignored (replaced with the correction's own casing).
   - Each successful substitution is logged in the manifest.
4. Medium / low / flagged / speaker-originating rows are NOT applied to text. They
   are recorded in ``manifest.json`` under ``pending_context`` for downstream LLM
   prompt context.
5. Skip rows with confidence ``n/a`` or whose correction column is empty or
   indicates the row should be dropped.

Outputs
-------
- ``transcripts/corrected/<dir>/<file>.txt`` (and ``.srt`` / ``.vtt``)
- ``transcripts/corrected/<dir>/manifest.json``

The raw directory is never modified.

CLI
---
::

    python scripts/apply_corrections.py [--entries 1,2,5-10] [--dry-run] [--verbose]

Run with ``--help`` for a full option listing.

Notes on robustness
-------------------
- The script is **idempotent**, re-running on already-corrected output produces
  identical bytes. Partial outputs from interrupted runs can simply be re-written
  without losing data.
- We do case-insensitive substring substitution at the Python string level
  (``_ci_substring_replace``) rather than via the ``re`` module. Heavy use of
  compiled ``re.Pattern`` objects across many ``subn`` calls has been observed
  to cause occasional CPython segfaults on Windows; the plain-string path is
  both faster and stable.
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import sys
from dataclasses import dataclass, field, asdict
from datetime import date
from pathlib import Path
from typing import Iterable

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MASTER_MD = REPO_ROOT / "transcripts" / "CLEANED_TRANSCRIPTS_REVIEW.md"
DEFAULT_RAW_DIR = REPO_ROOT / "transcripts" / "raw"
DEFAULT_OUT_DIR = REPO_ROOT / "transcripts" / "corrected"

SCRIPT_VERSION = "1.1"  # bumped 2026-05-23: per-entry review_metadata wired in
TODAY = date.today().isoformat()

logger = logging.getLogger("apply_corrections")

# ---------------------------------------------------------------------------
# Per-entry review-metadata helper (transcripts/review_metadata.py)
# ---------------------------------------------------------------------------

# Add transcripts/ to sys.path so we can import the standardized review-history
# + inferential-uncertainty metadata helper. The helper is co-located with the
# audit overlay rather than under scripts/ because its data inputs
# (AUDIT_TRAIL.md, adversarial_review_feed.json, cross_contamination_audit.json,
# layer5_fidelity_audit.json, civil_rights_facts.json) all live in transcripts/
# or alongside it.
_TRANSCRIPTS_DIR = REPO_ROOT / "transcripts"
if str(_TRANSCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_TRANSCRIPTS_DIR))

try:
    from review_metadata import build_review_metadata  # type: ignore
except ImportError:
    # If the helper is unavailable, fall back to a no-op stub so the
    # preprocessor still works in environments without the audit overlay.
    def build_review_metadata(entry_num: int, applied_count: int, pending_count: int) -> dict:
        return {
            "review_history": None,
            "known_issues": [],
            "inferential_uncertainty": None,
            "ground_truth_corpus_version": None,
            "ground_truth_corpus_path": None,
            "_metadata_unavailable": "review_metadata.py not importable from sys.path",
        }

# ---------------------------------------------------------------------------
# Confidence taxonomy
# ---------------------------------------------------------------------------

APPLY_CONFIDENCES = {"correct", "high"}
PENDING_CONFIDENCES = {
    "medium",
    "low",
    "speaker-originating",
    "flagged-for-adversarial-review",
    "flagged",
}
# Any other confidence (including blanks, n/a) is treated as "skipped".

DROP_NOTE_PATTERNS = (
    "removed",
    "drop",
    "not in transcript",
    "not applicable",
    "(none)",
    "(no correction)",
    "no correction needed",
    "placeholder",
    "n/a",
)

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------


@dataclass
class CorrectionRow:
    """One parsed correction row from a Pass-1/2/2T/3 table."""

    row_id: str
    whisper: str
    correction: str
    confidence: str
    source: str
    notes: str
    table: str  # "pass1" | "pass2" | "pass2_tail" | "pass3"

    def normalized_confidence(self) -> str:
        c = (self.confidence or "").strip().lower()
        # Strip markdown emphasis / parentheticals / trailing words
        c = re.sub(r"\([^)]*\)", "", c).strip()
        c = c.replace("**", "")
        # Handle compound markers like "high (spelling)" / "speaker-originating + low"
        # Choose first token that names a known tier.
        for tier in (
            "flagged-for-adversarial-review",
            "flagged",
            "speaker-originating",
            "correct",
            "high",
            "medium",
            "low",
            "n/a",
        ):
            if tier in c:
                return tier
        return c or "n/a"


@dataclass
class EntrySection:
    """One entry section from the master MD."""

    number: int
    subject: str
    raw_dir_name: str | None
    skipped: bool
    skipped_reason: str | None
    rows: list[CorrectionRow] = field(default_factory=list)
    # Pass-3 confidence overrides keyed by row_id.
    overrides: dict[str, str] = field(default_factory=dict)


@dataclass
class AppliedCorrection:
    row_id: str
    whisper: str
    correction: str
    confidence: str
    occurrences: int
    file_paths: list[str]


@dataclass
class PendingCorrection:
    row_id: str
    whisper: str
    candidate_correction: str
    confidence: str
    notes: str


@dataclass
class SkippedRow:
    row_id: str
    reason: str


# ---------------------------------------------------------------------------
# Master-MD parsing
# ---------------------------------------------------------------------------

HEADING_RE = re.compile(r"^### (\d+)\.\s+(.+?)\s*$", re.MULTILINE)
SOURCE_RE = re.compile(
    r"^\*\*Source\*\*:\s*`transcripts/raw/([^`]+?)/?`",
    re.MULTILINE,
)
SKIPPED_HEADING_RE = re.compile(r"\((SKIPPED|DEFERRED|skipped|deferred)\)", re.IGNORECASE)
STATUS_SKIPPED_RE = re.compile(
    r"PERMANENTLY SKIPPED|file does not exist|empty source directory|read returned",
    re.IGNORECASE,
)

# Match the row-id leading token. We accept:
#   "1.5", "1.P2.10", "1.P2T.27", "1.P3.4"
ROW_ID_RE = re.compile(r"^(\d+\.(?:P\d+T?\.)?\d+)\s*$")
ROW_ID_PREFIX_RE = re.compile(r"^(\d+\.(?:P\d+T?\.)?\d+)")


def _is_table_separator(cells: list[str]) -> bool:
    """A markdown table separator row looks like '|---|---|...'."""
    if not cells:
        return False
    return all(re.fullmatch(r":?-{3,}:?", c.strip()) for c in cells if c.strip())


def _split_row(line: str) -> list[str]:
    """Split a pipe-delimited markdown table row into its cells."""
    if not line.startswith("|"):
        return []
    inner = line.strip()
    # Drop leading and trailing pipes if present
    if inner.endswith("|"):
        inner = inner[:-1]
    if inner.startswith("|"):
        inner = inner[1:]
    cells = [c.strip() for c in inner.split("|")]
    return cells


def _clean_cell(cell: str) -> str:
    """Strip markdown emphasis from a cell value."""
    return cell.strip()


def _normalize_row_id(raw: str) -> str | None:
    """Extract just the row-id token from a possibly noisy first cell."""
    if not raw:
        return None
    # Strip emphasis
    candidate = raw.strip().strip("*").strip()
    # Try direct match first
    if ROW_ID_RE.match(candidate):
        return candidate
    # Sometimes Pass-3 confidence rows have form "1.5 Elmer Rhodes -> Eleanor Roosevelt"
    m = ROW_ID_PREFIX_RE.match(candidate)
    if m:
        return m.group(1)
    return None


def _is_correction_table_header(header_cells: list[str]) -> str | None:
    """Decide whether a table header is a correction table, and which kind.

    Returns one of "pass1", "pass2", "pass2_tail", "pass3" if matched, else None.

    The caller is responsible for telling Pass 1 / 2 / 2T / 3 apart based on the
    preceding sub-heading. This routine only checks that the column layout matches
    a correction table (6 columns with span/correction-style schema).
    """
    if len(header_cells) < 5:
        return None
    h = [c.lower().strip() for c in header_cells]
    # Standard schemas all begin with "#" then a "span" / "whisper" / "row" column.
    first = h[0]
    if first not in ("#", "row", "rows"):
        return None
    # The second column should contain "span" or "whisper" or "rendering"
    second = h[1] if len(h) > 1 else ""
    if not any(token in second for token in ("span", "whisper", "rendering", "raw")):
        return None
    # The third column should contain "correction"
    third = h[2] if len(h) > 2 else ""
    if "correction" not in third:
        return None
    return "correction_table"


def _is_confidence_resolution_header(header_cells: list[str]) -> bool:
    """The Pass-3 confidence-resolution table has 4 columns:
    | Original row | Old confidence | New confidence | Resolution notes |
    """
    if len(header_cells) < 4:
        return False
    h = [c.lower().strip() for c in header_cells]
    if "original row" not in h[0]:
        return False
    if "old confidence" not in h[1]:
        return False
    if "new confidence" not in h[2]:
        return False
    return True


def parse_master_md(md_path: Path) -> dict[int, EntrySection]:
    """Parse the master MD into a dict of entry-number -> EntrySection."""
    text = md_path.read_text(encoding="utf-8")
    headings = list(HEADING_RE.finditer(text))
    entries: dict[int, EntrySection] = {}

    for idx, m in enumerate(headings):
        number = int(m.group(1))
        subject = m.group(2).strip()
        start = m.end()
        end = headings[idx + 1].start() if idx + 1 < len(headings) else len(text)
        section_text = text[start:end]

        # Source path
        src_match = SOURCE_RE.search(section_text)
        raw_dir_name = src_match.group(1).strip() if src_match else None

        # Skipped?
        skipped = bool(SKIPPED_HEADING_RE.search(m.group(2)))
        skipped_reason = None
        if skipped:
            skipped_reason = "SKIPPED marker in heading"
        elif STATUS_SKIPPED_RE.search(section_text[:2000]):
            skipped = True
            skipped_reason = "PERMANENTLY SKIPPED or read-error noted in status"

        entry = EntrySection(
            number=number,
            subject=subject,
            raw_dir_name=raw_dir_name,
            skipped=skipped,
            skipped_reason=skipped_reason,
        )

        # Walk the section text line-by-line to detect tables.
        lines = section_text.splitlines()
        current_table_kind: str | None = None  # "pass1" | "pass2" | "pass2_tail" | "pass3"
        in_correction_table = False
        in_resolution_table = False
        i = 0
        while i < len(lines):
            line = lines[i].rstrip()
            stripped = line.lstrip()

            # Track sub-headings to attribute rows to the right pass.
            if stripped.startswith("#### Pass 1 corrections"):
                current_table_kind = "pass1"
                in_correction_table = False
                in_resolution_table = False
                i += 1
                continue
            if stripped.startswith("#### Pass 2 corrections"):
                current_table_kind = "pass2"
                in_correction_table = False
                in_resolution_table = False
                i += 1
                continue
            if stripped.startswith("#### Pass 2 tail-sweep"):
                current_table_kind = "pass2_tail"
                in_correction_table = False
                in_resolution_table = False
                i += 1
                continue
            if stripped.startswith("#### Pass 3 consolidation"):
                current_table_kind = "pass3"
                in_correction_table = False
                in_resolution_table = False
                i += 1
                continue
            # Pass-3 sub-blocks
            if stripped.startswith("**Confidence resolutions:**"):
                in_correction_table = False
                in_resolution_table = "RESOLUTION"
                i += 1
                continue
            if stripped.startswith("**Pass 3 missed-pattern catches:**"):
                in_correction_table = False
                in_resolution_table = False
                # We'll detect the table header in the next pipe-row.
                i += 1
                continue
            if stripped.startswith("**Adversarial-review flags"):
                in_correction_table = False
                in_resolution_table = "ADVERSARIAL"
                i += 1
                continue
            if stripped.startswith("**Ground-truth corpus candidates"):
                in_correction_table = False
                in_resolution_table = "GROUND_TRUTH"
                i += 1
                continue
            if stripped.startswith("**Audit-complete marker**"):
                in_correction_table = False
                in_resolution_table = False
                i += 1
                continue

            # Other headings reset table state.
            if stripped.startswith("####") or stripped.startswith("###"):
                in_correction_table = False
                in_resolution_table = False
                i += 1
                continue

            if stripped.startswith("|"):
                cells = _split_row(line)
                # Skip separator rows.
                if _is_table_separator(cells):
                    i += 1
                    continue

                # Try to detect a header row.
                if not in_correction_table and not in_resolution_table:
                    if _is_correction_table_header(cells):
                        in_correction_table = True
                        i += 1
                        continue
                    if _is_confidence_resolution_header(cells):
                        in_resolution_table = "RESOLUTION"
                        i += 1
                        continue
                    # Adversarial-review header: | Row | Item | Reason |
                    if (
                        len(cells) >= 3
                        and cells[0].lower().strip() == "row"
                        and "item" in cells[1].lower()
                    ):
                        in_resolution_table = "ADVERSARIAL"
                        i += 1
                        continue

                # Data row inside a correction table.
                if in_correction_table and len(cells) >= 4:
                    row_id_raw = cells[0]
                    row_id = _normalize_row_id(row_id_raw)
                    if row_id is None:
                        # Could be an interrupted table or a row with non-standard id.
                        i += 1
                        continue
                    whisper = _clean_cell(cells[1]) if len(cells) > 1 else ""
                    correction = _clean_cell(cells[2]) if len(cells) > 2 else ""
                    confidence = _clean_cell(cells[3]) if len(cells) > 3 else ""
                    source = _clean_cell(cells[4]) if len(cells) > 4 else ""
                    notes = _clean_cell(cells[5]) if len(cells) > 5 else ""
                    if current_table_kind is None:
                        # Defensive: shouldn't happen.
                        i += 1
                        continue
                    row = CorrectionRow(
                        row_id=row_id,
                        whisper=whisper,
                        correction=correction,
                        confidence=confidence,
                        source=source,
                        notes=notes,
                        table=current_table_kind,
                    )
                    entry.rows.append(row)
                    i += 1
                    continue

                # Data row inside a Pass-3 confidence-resolution table.
                if in_resolution_table == "RESOLUTION" and len(cells) >= 3:
                    row_id_raw = cells[0]
                    row_id = _normalize_row_id(row_id_raw)
                    if row_id is None:
                        i += 1
                        continue
                    # cells[1] = old confidence, cells[2] = new confidence
                    new_conf = _clean_cell(cells[2]) if len(cells) > 2 else ""
                    if new_conf:
                        entry.overrides[row_id] = new_conf
                    i += 1
                    continue

                # Otherwise: skip.
                i += 1
                continue

            # Non-table line; if we were in a table, the table has ended.
            if line.strip() == "":
                # A blank line generally ends a table.
                in_correction_table = False
                in_resolution_table = False
            i += 1

        # Apply Pass-3 confidence overrides to rows in-place.
        if entry.overrides:
            for row in entry.rows:
                if row.row_id in entry.overrides:
                    row.confidence = entry.overrides[row.row_id]

        entries[number] = entry

    return entries


# ---------------------------------------------------------------------------
# Text-substitution engine
# ---------------------------------------------------------------------------

# Markers we should refuse to apply mechanically because they refer to
# arrows/notes rather than substring spans.
SKIP_WHISPER_PATTERNS = ("(repeat", "see above", "see ", "(see ")


def _row_should_drop(row: CorrectionRow) -> tuple[bool, str | None]:
    """Return (drop?, reason)."""
    conf = row.normalized_confidence()
    correction = row.correction.strip()
    whisper = row.whisper.strip()

    # Strip emphasis from correction-cell text for the "empty/none" detection.
    correction_lc = correction.lower()
    notes_lc = (row.notes or "").lower()

    if conf == "n/a":
        return True, "n/a confidence"
    if not whisper:
        return True, "empty whisper rendering"
    if not correction or correction in {"-", "-", "n/a"}:
        return True, "empty correction column"
    if any(p in correction_lc for p in DROP_NOTE_PATTERNS):
        return True, f"correction notes indicate drop: {correction[:60]}"
    if any(p in notes_lc for p in ("not in transcript", "not applicable", "removed")):
        return True, f"notes indicate drop: {row.notes[:60]}"
    # If the whisper rendering contains an explicit "(repeat"/"see above" marker,
    # treat it as a documentation row only.
    if any(p in whisper.lower() for p in SKIP_WHISPER_PATTERNS):
        return True, "whisper cell references another row"
    return False, None


def _candidate_renderings(whisper: str) -> list[str]:
    """Return one or more substring candidates from a whisper cell.

    The MD frequently writes alternatives like::

        Stoke the Carmichael / Stoke Lee / Storkley
        Elders Cleaver / Elders / Elders Cleaver

    We split on '/' and the slash-with-spaces separator. We also strip surrounding
    quotes and italic markers.
    """
    raw = whisper.strip()
    # Drop italic / bold markdown emphasis wrappers (single or double asterisks).
    raw = re.sub(r"\*+([^*]+)\*+", r"\1", raw)
    # Strip any leftover stray asterisks at the boundaries.
    raw = raw.strip("*").strip()
    # Drop surrounding curly / straight quotes.
    raw = raw.strip("\"'“”‘’")
    # Split on " / " (with spaces on each side), keeps URLs / names with slashes intact.
    parts = re.split(r"\s+/\s+", raw)
    # If no slash-split happened and the rendering is suspiciously long with no
    # obvious alternatives, keep just the single rendering.
    candidates: list[str] = []
    for p in parts:
        c = p.strip().strip("\"'“”‘’").strip()
        # Strip leading/trailing parentheticals like "(likely)".
        c = re.sub(r"\s*\([^)]*\)\s*$", "", c).strip()
        # Strip leading "or " from things like "or Foreman".
        c = re.sub(r"^or\s+", "", c, flags=re.IGNORECASE)
        # Trim sentence-ending punctuation.
        c = c.rstrip(",;:.")
        if c and len(c) >= 2:
            candidates.append(c)
    # De-duplicate while preserving order.
    seen: set[str] = set()
    out: list[str] = []
    for c in candidates:
        key = c.lower()
        if key not in seen:
            seen.add(key)
            out.append(c)
    return out


def _clean_correction_text(correction: str) -> str:
    """Strip parentheticals, markdown emphasis, and qualifier phrases from the
    correction cell so we can use it as the literal replacement text."""
    raw = correction.strip()
    # Drop italic-marked variants.
    raw = re.sub(r"\*([^*]+)\*", r"\1", raw)
    # Strip surrounding quotes
    raw = raw.strip("\"'“”‘’")
    # Drop trailing parentheticals (qualifications like "(likely)").
    raw = re.sub(r"\s*\([^)]*\)\s*$", "", raw)
    # If the cell has multiple slash-separated alternatives, take the first as the
    # canonical replacement (the corpus convention puts the canonical form first).
    raw = re.split(r"\s+/\s+", raw)[0].strip()
    raw = raw.rstrip(",;:.")
    return raw


# We do case-insensitive substring substitution without the regex engine
# (``_ci_substring_replace`` below). On Windows under heavy use, holding
# compiled ``re.Pattern`` objects across many ``subn`` calls would, very rarely,
# trigger a segfault or return a tuple containing a Pattern instead of the
# expected ``(str, int)``, a memory-corruption-class CPython issue. The
# plain-string approach has the same word-boundary semantics and no such issues.


def apply_substitutions_to_text(
    text: str, candidates: list[str], replacement: str
) -> tuple[str, int]:
    """Apply each candidate -> replacement substitution to ``text``.

    Returns (new_text, total_occurrences_replaced). Substitutions are
    case-insensitive and respect word boundaries on alphanumeric endpoints.
    Idempotent: re-running on already-corrected text leaves it unchanged because
    the candidate strings no longer match.

    The replacement text is treated as a literal string, backslash sequences
    inside it are not interpreted as regex backreferences (we use a no-op lambda
    around the replacement instead of passing it to ``Pattern.subn`` directly).
    """
    if not isinstance(text, str):
        raise TypeError(
            f"apply_substitutions_to_text: text must be str, got {type(text)!r}; "
            f"candidates={candidates!r} replacement={replacement!r}"
        )
    total = 0
    new_text = text
    for cand in candidates:
        if not isinstance(cand, str):  # pragma: no cover - defensive
            continue
        if cand.lower() == replacement.lower():
            # Self-mapping (only differs by case), skip; not a substantive correction.
            continue
        new_text, n = _ci_substring_replace(new_text, cand, replacement)
        if not isinstance(new_text, str):  # pragma: no cover - defensive
            raise TypeError(
                f"_ci_substring_replace returned non-str: {type(new_text)!r} for cand={cand!r}"
            )
        total += n
    return new_text, total


# Short-needle protection: for needles <=3 alphabetic chars (e.g. "Don", "Red",
# "Tim", "PUM"), refuse matches where the needle is adjacent to either:
#   (a) an apostrophe-followed-by-contraction-suffix:  't 'll 'd 'm 've 're
#       (e.g. don't, won't, I'd, we'll, you've, they're, I'm) -- these are
#       contractions, not occurrences of the short needle as a standalone word.
#   (b) a hyphen on either side (e.g. "B-Pum", "red-and-futtle") -- hyphen
#       compounds where the needle is part of a different lexeme.
# Apostrophe-followed-by-"s" is treated as a possessive marker and the match
# IS accepted, so "Tim's" -> "Tim Jenkins's" and "Don's" -> "Daniel's" still
# happen for genuine name replacements. Long needles (>=4 chars) bypass this
# protection -- possessives like "Bobby Seale's" continue to receive the
# canonical-expansion replacement unchanged.
#
# Verified corruption sources observed on 2026-05-24 (before this guard):
#   row 20.12   "Don"  -> "Daniel H. Krenge De Iongh"   ("don't" hits, x192)
#   row 8.P2.26 "Red"  -> "Red Auerbach"                ("red-and-futtle", "ex-red"; x15)
#   row 63.P4.23 "PUM" -> "BPUM (Black People's Unity Movement)" ("B-Pum"; x3)
# (Two earlier-flagged rows -- 7.P2.15 "Tim" and 65.39 "GBI" -- were
# false-positives in the original audit: their hits at "Tim's" / "GBI's" are
# legitimate possessive replacements and are allowed by the rule below.)
_SHORT_NEEDLE_MAX_LEN = 3
_APOSTROPHE_CHARS = "'‘’ʼʻ"
_HYPHEN_CHARS = "-‑‒–-"  # ASCII hyphen + Unicode hyphens/dashes
_CONTRACTION_SUFFIXES = ("t", "ll", "d", "m", "ve", "re")


def _short_needle_blocked_after(text: str, pos: int) -> bool:
    """Return True if the char(s) starting at ``pos`` form a contraction-suffix
    or a hyphen-compound continuation that should block a short-needle match.

    Allows apostrophe+s (possessive). Blocks apostrophe+any-other-contraction
    suffix and hyphen-followed-by-alphanumeric.
    """
    if pos >= len(text):
        return False
    c = text[pos]
    if c in _APOSTROPHE_CHARS:
        rest = text[pos + 1 : pos + 4].lower()
        # 's = possessive; allow the replacement to proceed.
        if rest.startswith("s") and (
            len(rest) == 1 or not rest[1].isalnum()
        ):
            return False
        # Other contractions: block.
        for suffix in _CONTRACTION_SUFFIXES:
            if rest.startswith(suffix) and (
                len(rest) == len(suffix) or not rest[len(suffix)].isalnum()
            ):
                return True
        return False
    if c in _HYPHEN_CHARS:
        # hyphen followed by an alphanumeric = compound continuation
        if pos + 1 < len(text) and text[pos + 1].isalnum():
            return True
    return False


def _short_needle_blocked_before(text: str, pos: int) -> bool:
    """Return True if the char(s) ending at ``pos`` form a hyphen-compound
    that should block a short-needle match (e.g. ``ex-Red``)."""
    if pos < 0:
        return False
    c = text[pos]
    if c in _HYPHEN_CHARS:
        # preceded by alphanumeric = compound
        if pos > 0 and text[pos - 1].isalnum():
            return True
    return False


def _ci_substring_replace(text: str, needle: str, replacement: str) -> tuple[str, int]:
    """Case-insensitive substring replace WITHOUT using the regex engine.

    This avoids CPython's regex engine entirely, substituting at the string
    level via `str.lower` index lookups. Word-boundary handling: if both the
    needle's first and last characters are alphanumeric, we require that the
    character before the match (if any) and the character after the match (if
    any) are NOT alphanumeric, so that substring matches do not bleed into
    adjacent tokens. Tail-only or head-only alphanumeric needles get the
    appropriate one-sided boundary.

    Short-needle protection (added 2026-05-25): for needles <=3 alphabetic
    chars, additionally block contraction-suffix neighbours ('t / 'll / 'd /
    'm / 've / 're) and hyphen-compound neighbours, while still allowing
    possessive 's. See module-level comments for the audited corruption
    sources this guards against.

    Returns (new_text, n_replacements).
    """
    if not needle:
        return text, 0
    needle_lower = needle.lower()
    text_lower = text.lower()
    n_len = len(needle_lower)
    boundary_start = needle[:1].isalnum()
    boundary_end = needle[-1:].isalnum()

    needle_stripped = needle.strip()
    short_needle = (
        len(needle_stripped) <= _SHORT_NEEDLE_MAX_LEN and needle_stripped.isalpha()
    )

    out_parts: list[str] = []
    i = 0
    count = 0
    while True:
        idx = text_lower.find(needle_lower, i)
        if idx == -1:
            out_parts.append(text[i:])
            break
        # Check word-boundaries.
        ok = True
        if boundary_start and idx > 0 and text[idx - 1].isalnum():
            ok = False
        if boundary_end and idx + n_len < len(text) and text[idx + n_len].isalnum():
            ok = False
        if ok and short_needle:
            # Extra protection: refuse matches adjacent to contraction-suffixes
            # or hyphen-compounds. Possessive 's still passes.
            if _short_needle_blocked_after(text, idx + n_len):
                ok = False
            elif idx > 0 and _short_needle_blocked_before(text, idx - 1):
                ok = False
        if ok:
            out_parts.append(text[i:idx])
            out_parts.append(replacement)
            i = idx + n_len
            count += 1
        else:
            # Advance one character to keep searching.
            out_parts.append(text[i:idx + 1])
            i = idx + 1
    return "".join(out_parts), count


def apply_substitutions_to_srt_vtt(
    text: str, candidates: list[str], replacement: str
) -> tuple[str, int]:
    """Apply substitutions to .srt / .vtt files while preserving timestamp lines.

    The cue-text lines are the lines that do NOT contain '-->' and are not the
    integer cue number, the WEBVTT header, or empty. We accumulate per-cue text
    lines, perform substitutions, and reassemble.
    """
    if not isinstance(text, str):  # pragma: no cover - defensive
        raise TypeError(
            f"apply_substitutions_to_srt_vtt: text must be str, got {type(text)!r}"
        )
    total = 0
    out_lines: list[str] = []
    for line in text.splitlines(keepends=False):
        # We need to keep the original line-ending behavior. We'll handle newlines
        # explicitly outside.
        if "-->" in line:
            out_lines.append(line)
            continue
        if line.strip().isdigit():
            # Cue index in SRT, leave alone.
            out_lines.append(line)
            continue
        if line.strip().upper() == "WEBVTT" or line.strip().startswith("WEBVTT"):
            out_lines.append(line)
            continue
        if line.strip() == "":
            out_lines.append(line)
            continue
        # Otherwise it's cue text. Apply substitutions per-line.
        new_line, n = apply_substitutions_to_text(line, candidates, replacement)
        if not isinstance(new_line, str):  # pragma: no cover - defensive
            raise TypeError(
                f"apply_substitutions_to_text returned non-str: {type(new_line)!r}; "
                f"candidates={candidates!r} replacement={replacement!r} line={line!r}"
            )
        total += n
        out_lines.append(new_line)
    # Reconstruct preserving the original separator. We always use \n; downstream
    # consumers should be tolerant of either Unix or Windows EOL.
    new_text = "\n".join(out_lines)
    # Preserve trailing newline if the source had one.
    if text.endswith("\n"):
        new_text += "\n"
    return new_text, total


# ---------------------------------------------------------------------------
# Per-entry processing
# ---------------------------------------------------------------------------


TARGET_SUFFIXES = (".txt", ".srt", ".vtt")


def _files_in_entry(raw_dir: Path) -> list[Path]:
    """All .txt/.srt/.vtt files in the entry's raw directory, excluding summary
    files. The summary file is informational and its content (paths, model
    metadata) should not be touched by the corrections layer."""
    if not raw_dir.exists():
        return []
    out: list[Path] = []
    for p in sorted(raw_dir.iterdir()):
        if not p.is_file():
            continue
        if p.suffix.lower() not in TARGET_SUFFIXES:
            continue
        # Skip the human-readable summary file, it doesn't contain transcript text.
        if "_interview_summary_" in p.name:
            continue
        out.append(p)
    return out


def process_entry(
    entry: EntrySection,
    raw_root: Path,
    out_root: Path,
    dry_run: bool = False,
    verbose: bool = False,
) -> dict | None:
    """Process one entry and write its corrected files + manifest.

    Returns the manifest dict for the entry, or None if the entry was skipped.
    """
    if entry.raw_dir_name is None:
        logger.info(
            "Entry %d (%s): no Source line; skipping",
            entry.number,
            entry.subject,
        )
        return None
    if entry.skipped:
        logger.info(
            "Entry %d (%s): SKIPPED (%s); not processing",
            entry.number,
            entry.subject,
            entry.skipped_reason or "marked skipped",
        )
        return None

    raw_dir = raw_root / entry.raw_dir_name
    if not raw_dir.exists():
        # The MD sometimes records names with ASCII quotes while the on-disk
        # directory uses Unicode smart-quotes (or vice versa). Try a smart-quote
        # variant before giving up.
        alt_name = entry.raw_dir_name.replace('"', "“", 1)
        # Replace only the second occurrence (closing quote) with the closing
        # smart-quote.
        if alt_name != entry.raw_dir_name:
            alt_name = alt_name.replace('"', "”", 1)
        alt_dir = raw_root / alt_name
        if alt_dir.exists():
            raw_dir = alt_dir
            entry.raw_dir_name = alt_name
        else:
            logger.warning(
                "Entry %d (%s): raw directory not found: %s",
                entry.number,
                entry.subject,
                raw_dir,
            )
            return None

    files = _files_in_entry(raw_dir)
    if not files:
        logger.warning(
            "Entry %d (%s): no .txt/.srt/.vtt files in %s",
            entry.number,
            entry.subject,
            raw_dir,
        )
        return None

    # Classify rows.
    apply_rows: list[CorrectionRow] = []
    pending_rows: list[CorrectionRow] = []
    skipped: list[SkippedRow] = []

    for row in entry.rows:
        drop, reason = _row_should_drop(row)
        if drop:
            skipped.append(SkippedRow(row_id=row.row_id, reason=reason or "unspecified"))
            continue
        conf = row.normalized_confidence()
        if conf in APPLY_CONFIDENCES:
            apply_rows.append(row)
        elif conf in PENDING_CONFIDENCES:
            pending_rows.append(row)
        else:
            skipped.append(SkippedRow(row_id=row.row_id, reason=f"unknown confidence '{conf}'"))

    # Prepare output dir.
    out_dir = out_root / entry.raw_dir_name
    if not dry_run:
        out_dir.mkdir(parents=True, exist_ok=True)

    # Apply corrections to each file.
    applied_log: list[AppliedCorrection] = []
    # Keyed by (row_id) -> AppliedCorrection so multiple files can accumulate.
    applied_index: dict[str, AppliedCorrection] = {}
    files_processed: list[str] = []

    for src_file in files:
        # Load original text. Use utf-8 with replacement on rare decoding errors.
        try:
            text = src_file.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            text = src_file.read_text(encoding="utf-8", errors="replace")

        new_text = text
        suffix = src_file.suffix.lower()

        for row in apply_rows:
            candidates = _candidate_renderings(row.whisper)
            replacement = _clean_correction_text(row.correction)
            if not candidates or not replacement:
                continue
            if suffix in (".srt", ".vtt"):
                new_text, n = apply_substitutions_to_srt_vtt(
                    new_text, candidates, replacement
                )
            else:
                new_text, n = apply_substitutions_to_text(
                    new_text, candidates, replacement
                )
            if n > 0:
                if row.row_id not in applied_index:
                    applied_index[row.row_id] = AppliedCorrection(
                        row_id=row.row_id,
                        whisper=row.whisper,
                        correction=replacement,
                        confidence=row.normalized_confidence(),
                        occurrences=0,
                        file_paths=[],
                    )
                ac = applied_index[row.row_id]
                ac.occurrences += n
                if suffix not in ac.file_paths:
                    ac.file_paths.append(suffix)
                if verbose:
                    logger.info(
                        "Entry %d row %s: %d hits in %s",
                        entry.number,
                        row.row_id,
                        n,
                        src_file.name,
                    )

        # Write corrected file (or skip in dry-run).
        out_file = out_dir / src_file.name
        files_processed.append(src_file.name)
        if not dry_run:
            out_file.write_text(new_text, encoding="utf-8")

    applied_log = list(applied_index.values())

    # Build pending list.
    pending_log: list[PendingCorrection] = []
    for row in pending_rows:
        pending_log.append(
            PendingCorrection(
                row_id=row.row_id,
                whisper=row.whisper,
                candidate_correction=_clean_correction_text(row.correction)
                or row.correction.strip(),
                confidence=row.normalized_confidence(),
                notes=row.notes,
            )
        )

    # Build per-entry review-metadata block (review_history + known_issues +
    # inferential_uncertainty + ground_truth_corpus_version). The downstream
    # adversarial-model grader (Kiro/Kimi/Codex/Gemini ensemble) reads this
    # block to know how many passes the entry received, what residual
    # uncertainty remains, and what known issues block publication.
    review_meta = build_review_metadata(
        entry_num=entry.number,
        applied_count=len(applied_log),
        pending_count=len(pending_log),
    )

    manifest = {
        "generated": TODAY,
        "script_version": SCRIPT_VERSION,
        "raw_dir": entry.raw_dir_name,
        "entry_number": entry.number,
        "entry_subject": entry.subject,
        "applied_corrections": [asdict(a) for a in applied_log],
        "pending_context": [asdict(p) for p in pending_log],
        "skipped_rows": [asdict(s) for s in skipped],
        "files_processed": files_processed,
        "stats": {
            "applied": len(applied_log),
            "pending": len(pending_log),
            "skipped": len(skipped),
        },
        # Per-entry review-history + uncertainty metadata block
        "review_history": review_meta.get("review_history"),
        "known_issues": review_meta.get("known_issues", []),
        "inferential_uncertainty": review_meta.get("inferential_uncertainty"),
        "adversarial_review_flag_count": review_meta.get("adversarial_review_flag_count", 0),
        "cross_contamination_items_resolved": review_meta.get("cross_contamination_items_resolved", 0),
        "ground_truth_corpus_version": review_meta.get("ground_truth_corpus_version"),
        "ground_truth_corpus_path": review_meta.get("ground_truth_corpus_path"),
    }

    if not dry_run:
        manifest_path = out_dir / "manifest.json"
        manifest_path.write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    return manifest


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def parse_entries_arg(s: str) -> list[int]:
    """Parse "1,2,5-10" into [1, 2, 5, 6, 7, 8, 9, 10]."""
    out: list[int] = []
    for token in s.split(","):
        token = token.strip()
        if not token:
            continue
        if "-" in token:
            a, b = token.split("-", 1)
            out.extend(range(int(a), int(b) + 1))
        else:
            out.append(int(token))
    return sorted(set(out))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[2])
    parser.add_argument(
        "--master",
        type=Path,
        default=DEFAULT_MASTER_MD,
        help="Path to the master MD overlay (default: %(default)s)",
    )
    parser.add_argument(
        "--raw-dir",
        type=Path,
        default=DEFAULT_RAW_DIR,
        help="Path to transcripts/raw/ root (default: %(default)s)",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=DEFAULT_OUT_DIR,
        help="Path to transcripts/corrected/ root (default: %(default)s)",
    )
    parser.add_argument(
        "--entries",
        type=parse_entries_arg,
        default=None,
        help='Comma-separated entry numbers / ranges, e.g. "1,2,5-10".'
        " Default: process every entry found in the master MD.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and classify rows but do not write any files.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print per-row diagnostics.",
    )
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.INFO if args.verbose else logging.WARNING,
        format="%(message)s",
    )

    if not args.master.exists():
        logger.error("Master MD not found: %s", args.master)
        return 2

    entries = parse_master_md(args.master)
    target = sorted(entries.keys()) if args.entries is None else [
        n for n in args.entries if n in entries
    ]

    if not target:
        logger.error("No entries to process.")
        return 1

    summary = {
        "total_entries": len(target),
        "processed": 0,
        "skipped": 0,
        "applied_corrections": 0,
        "pending_context": 0,
        "skipped_rows": 0,
    }

    for number in target:
        entry = entries[number]
        manifest = process_entry(
            entry,
            raw_root=args.raw_dir,
            out_root=args.out_dir,
            dry_run=args.dry_run,
            verbose=args.verbose,
        )
        if manifest is None:
            summary["skipped"] += 1
            continue
        summary["processed"] += 1
        summary["applied_corrections"] += manifest["stats"]["applied"]
        summary["pending_context"] += manifest["stats"]["pending"]
        summary["skipped_rows"] += manifest["stats"]["skipped"]

    print(
        f"\nProcessed: {summary['processed']} / {summary['total_entries']} entries"
        f" (skipped {summary['skipped']})"
    )
    print(
        f"  Applied corrections (unique rows): {summary['applied_corrections']}"
    )
    print(f"  Pending-context rows: {summary['pending_context']}")
    print(f"  Skipped rows: {summary['skipped_rows']}")
    if args.dry_run:
        print("  (dry-run; no files written)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
