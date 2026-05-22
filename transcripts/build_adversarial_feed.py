"""Build the adversarial-review feed JSON from Pass-3 staging files.

Phase 1c of the 2026-05-22 transcript-cleanup audit.

Reads every `transcripts/pass3_stage/entry_*.md` file, extracts the
"Adversarial-review flags" sub-table from each, parses each row into a
structured record, and writes a single deterministic
`transcripts/adversarial_review_feed.json` for the downstream multi-model
ensemble (Kiro / Kimi / Codex / Gemini).

Per-row schema:
    {
      "entry_number": int,
      "entry_subject": str | None,
      "row_id": str,
      "row_id_aliases": [str, ...],
      "whisper_rendering": str | None,
      "candidate_correction": str | None,
      "reason": str,
      "category": str,
      "transcript_excerpt": str,
      "source_pass_3_file": str
    }

Run from anywhere — paths are resolved against this script's location.
"""

from __future__ import annotations

import json
import re
from collections import Counter, OrderedDict
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TRANSCRIPTS_DIR = REPO_ROOT / "transcripts"
STAGE_DIR = TRANSCRIPTS_DIR / "pass3_stage"
OVERLAY_PATH = TRANSCRIPTS_DIR / "CLEANED_TRANSCRIPTS_REVIEW.md"
OUTPUT_PATH = TRANSCRIPTS_DIR / "adversarial_review_feed.json"

CATEGORY_VOCAB = [
    "canonical-figure-identification",
    "local-figure-identification",
    "geographic-place-name",
    "organization-or-event-name",
    "legal-or-political-term",
    "specialized-vocabulary",
    "severely-garbled",
    "chronology-or-date",
    "quotation-or-document-title",
    "speaker-originating",
    "other",
]

# ---------------------------------------------------------------------------
# Subject lookup from the master overlay
# ---------------------------------------------------------------------------

ENTRY_HEADING_RE = re.compile(r"^###\s+(\d+)\.\s+(.+?)\s*$", re.MULTILINE)


def load_entry_subjects(overlay_path: Path) -> dict[int, str]:
    """Parse `### N. <Subject>` headings from CLEANED_TRANSCRIPTS_REVIEW.md."""
    text = overlay_path.read_text(encoding="utf-8")
    subjects: dict[int, str] = {}
    for match in ENTRY_HEADING_RE.finditer(text):
        num = int(match.group(1))
        subject = match.group(2).strip()
        # Strip trailing parenthetical status markers like "(PARTIAL)" or "(SKIPPED)"
        # but only strip them, don't drop the actual name body.
        subject = re.sub(r"\s*\((PARTIAL|SKIPPED|DEFERRED)\)\s*$", "", subject)
        subject = re.sub(r"\s*—\s*(DEFERRED|SKIPPED)\s*$", "", subject)
        subjects[num] = subject.strip()
    return subjects


# ---------------------------------------------------------------------------
# Adversarial-section extraction
# ---------------------------------------------------------------------------

ADVERSARIAL_HEADING_RE = re.compile(
    r"\*\*Adversarial-review flags[^*]*\*\*", re.IGNORECASE
)
NEXT_HEADING_RE = re.compile(r"^\s*\*\*[^*]+\*\*\s*$", re.MULTILINE)


def extract_adversarial_block(file_text: str) -> str | None:
    """Return the markdown block between the Adversarial heading and the next
    bold heading, or None if the heading is missing."""
    start_match = ADVERSARIAL_HEADING_RE.search(file_text)
    if not start_match:
        return None
    block_start = start_match.end()
    # Find the next bold-heading marker after our start
    rest = file_text[block_start:]
    next_match = NEXT_HEADING_RE.search(rest)
    if next_match:
        return rest[: next_match.start()]
    return rest


# ---------------------------------------------------------------------------
# Markdown table parsing
# ---------------------------------------------------------------------------

PIPE_ROW_RE = re.compile(r"^\s*\|(.+)\|\s*$")


def parse_table(block: str) -> list[list[str]]:
    """Parse a markdown pipe-table block into a list of cell lists, skipping
    the header row and the dash-separator row.

    Each returned row is `[col1, col2, col3, ...]` of stripped cell strings.
    """
    rows: list[list[str]] = []
    seen_header = False
    seen_separator = False
    for line in block.splitlines():
        m = PIPE_ROW_RE.match(line)
        if not m:
            continue
        body = m.group(1)
        cells = [cell.strip() for cell in body.split("|")]
        # Detect the markdown separator row (cells are all dashes / colons)
        if all(re.fullmatch(r":?-+:?", c) for c in cells if c):
            seen_separator = True
            continue
        if not seen_header:
            seen_header = True
            continue
        rows.append(cells)
    return rows


# ---------------------------------------------------------------------------
# Per-row field extraction
# ---------------------------------------------------------------------------

NULL_ROW_MARKERS = (
    "(none",
    "(transcript completeness",
)


def is_null_row(row_id_raw: str) -> bool:
    rid = row_id_raw.lower().strip()
    return any(rid.startswith(marker) for marker in NULL_ROW_MARKERS)


def split_row_id(row_id_raw: str) -> tuple[str, list[str]]:
    """Return (primary_id, aliases) for a row identifier that may contain
    multiple `/` separated tokens."""
    tokens = [t.strip() for t in re.split(r"\s*/\s*", row_id_raw) if t.strip()]
    if not tokens:
        return (row_id_raw.strip(), [])
    primary = tokens[0]
    aliases = tokens[1:]
    return (primary, aliases)


ARROW_RE = re.compile(r"\s*(?:->|→|=>)\s*")


def split_whisper_candidate(item_cell: str) -> tuple[str | None, str | None]:
    """Best-effort split of the Item column into (whisper_rendering, candidate_correction).

    Handles forms:
      - "Mary the Kaba → Miriam Makeba"
      - "bunchy / bunky (Fellowship House painter)"
      - "Don Klaug (Atlanta University figure)"
      - "LATAM"
      - "Tiko Netlet → Chico Neblett (Boston BPP deputy chairman)"
      - "Anna Green -> Christina-Taylor Green"
    Anything after the first arrow is the candidate; if no arrow, the whole
    cell is the whisper rendering and the candidate may live in trailing
    parentheses.
    """
    if not item_cell:
        return (None, None)
    parts = ARROW_RE.split(item_cell, maxsplit=1)
    if len(parts) == 2:
        return (parts[0].strip() or None, parts[1].strip() or None)
    return (item_cell.strip() or None, None)


# ---------------------------------------------------------------------------
# Category assignment heuristics
# ---------------------------------------------------------------------------

ORG_KEYWORDS = re.compile(
    r"\b(?:CORE|SNCC|SCLC|NAACP|MFDP|COFO|BPP|MOVE|LDF|YMCA|SDS|NAG|"
    r"organization|committee|council|conference|institute|society|league|"
    r"foundation|club|association|delegation|coalition|fraternity|sorority|"
    r"newsletter|newspaper|journal|magazine|press|chapter|alliance|union)\b",
    re.IGNORECASE,
)
GEO_KEYWORDS = re.compile(
    r"\b(?:neighborhood|street|avenue|boulevard|bridge|river|county|city|town|"
    r"village|district|ward|landmark|county|park|building|hotel|restaurant|"
    r"diner|cafe|cafeteria|hall|theatre|theater|church|baptist|methodist|"
    r"presbyterian|college|university|school|farm|plantation|airport|"
    r"\bMS\b|\bAL\b|\bLA\b|\bGA\b|\bMD\b|\bSF\b|\bNYC\b|\bLA\b|\bDC\b)\b",
    re.IGNORECASE,
)
LEGAL_KEYWORDS = re.compile(
    r"\b(?:Title\s+(?:[IVX]+|\d+)|Section\s+\d+|v\.\s+|case|"
    r"jurisdiction|amendment|statute|act|bill|"
    r"Plessy|Brown\s+v|Loving|Bond\s+v\.\s+Floyd|Gomillion|"
    r"prosecutor|attorney general|judge|justice|congressman|senator|"
    r"legislature|congress|senate|representative|gubernatorial)\b",
    re.IGNORECASE,
)
DATE_KEYWORDS = re.compile(
    r"\b(?:date|chronology|year|founded|founding|birthday|born|died|"
    r"\d{4}|\d+(?:st|nd|rd|th)|"
    r"January|February|March|April|May|June|July|August|September|"
    r"October|November|December)\b",
    re.IGNORECASE,
)
TITLE_KEYWORDS = re.compile(
    r"\b(?:book|song|hymn|speech|essay|article|sermon|memoir|biography|"
    r"film|movie|documentary|episode|titled|titles|cited|quoted|"
    r"newspaper|column|piece)\b",
    re.IGNORECASE,
)
VOCAB_KEYWORDS = re.compile(
    r"\b(?:military|jargon|Latin|medical|medical-term|Yiddish|Spanish|"
    r"foreign-language|technical|jurisprudence)\b",
    re.IGNORECASE,
)
GARBLED_KEYWORDS = re.compile(
    r"\b(?:garbled|unparseable|unrecoverable|fragment|noise artifact|"
    r"whisper noise|unintelligible|severely)\b",
    re.IGNORECASE,
)
SPEAKER_KEYWORDS = re.compile(
    r"\b(?:speaker(?:'s)?(?:\s+misstatement|\s+recall|\s+memory)|"
    r"speaker-originating|misremembered|memory error|"
    r"factually incorrect|misstatement)\b",
    re.IGNORECASE,
)
LOCAL_KEYWORDS = re.compile(
    r"\b(?:local|family|neighbor|grandmother|grandfather|cousin|aunt|uncle|"
    r"mother|father|sister|brother|teacher|classmate|small-town|"
    r"resident|townsperson|mentor|friend|roommate|housemate|"
    r"apartment-mate|landlord|tenant|small town)\b",
    re.IGNORECASE,
)


def categorize(item_cell: str, reason_cell: str, candidate: str | None) -> str:
    """Heuristic mapping of (item, reason, candidate) to category vocabulary."""
    text = " ".join([item_cell or "", reason_cell or "", candidate or ""])

    if GARBLED_KEYWORDS.search(text):
        return "severely-garbled"
    if SPEAKER_KEYWORDS.search(text):
        return "speaker-originating"
    if DATE_KEYWORDS.search(text) and (
        "discrepancy" in text.lower() or "founding" in text.lower()
        or "date" in text.lower() or "chronology" in text.lower()
        or re.search(r"\bvs\b\s+(?:Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep)", text)
    ):
        return "chronology-or-date"
    if TITLE_KEYWORDS.search(text):
        return "quotation-or-document-title"
    if LEGAL_KEYWORDS.search(text):
        return "legal-or-political-term"
    if ORG_KEYWORDS.search(text):
        return "organization-or-event-name"
    if VOCAB_KEYWORDS.search(text):
        return "specialized-vocabulary"
    if LOCAL_KEYWORDS.search(text):
        return "local-figure-identification"
    if GEO_KEYWORDS.search(text):
        return "geographic-place-name"
    # Default: if candidate or item looks like a person name (capitalized words)
    # treat as canonical-figure-identification; else other.
    if candidate and re.match(r"[A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)+", candidate):
        return "canonical-figure-identification"
    if item_cell and re.search(r"[A-Z][\w'.-]+\s+[A-Z][\w'.-]+", item_cell):
        return "canonical-figure-identification"
    # Single-token capitalized name (with possible quotes / honorifics) is most
    # likely a canonical-figure candidate when no other signal applies.
    stripped = (item_cell or "").strip().strip('"“”\'')
    first_word_match = re.match(r"([A-Z][a-z]{2,})", stripped)
    if first_word_match:
        non_name_prefixes = {
            "The", "This", "That", "These", "Those", "Cannot", "Single",
            "Phonetic", "Speaker", "Whisper", "Item", "All", "None", "Both",
            "Most", "Some", "Multi", "Multiple", "Highly", "Ambiguous",
            "Note", "Title",
        }
        if first_word_match.group(1) not in non_name_prefixes:
            return "canonical-figure-identification"
    return "other"


# ---------------------------------------------------------------------------
# Transcript-excerpt extraction
# ---------------------------------------------------------------------------

QUOTE_RE = re.compile(r'"([^"]+)"|“([^”]+)”')


def extract_excerpt(item_cell: str, reason_cell: str) -> str:
    """Pull verbatim quoted material out of the Item / Reason cells.
    Returns empty string if nothing is quoted.
    """
    quotes: list[str] = []
    for cell in (item_cell, reason_cell):
        if not cell:
            continue
        for match in QUOTE_RE.finditer(cell):
            quote = match.group(1) or match.group(2)
            if quote:
                quotes.append(quote.strip())
    return " | ".join(quotes)


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def process_entry(file_path: Path, subjects: dict[int, str]) -> list[dict]:
    entry_number = int(re.search(r"entry_(\d+)\.md", file_path.name).group(1))
    entry_subject = subjects.get(entry_number)
    file_text = file_path.read_text(encoding="utf-8")
    block = extract_adversarial_block(file_text)
    if block is None:
        return []
    table_rows = parse_table(block)
    records: list[dict] = []
    for cells in table_rows:
        if len(cells) < 3:
            continue
        row_id_raw, item_cell, reason_cell = cells[0], cells[1], cells[2]
        if is_null_row(row_id_raw):
            continue
        primary_id, aliases = split_row_id(row_id_raw)
        whisper, candidate = split_whisper_candidate(item_cell)
        excerpt = extract_excerpt(item_cell, reason_cell)
        category = categorize(item_cell, reason_cell, candidate)
        records.append(
            {
                "entry_number": entry_number,
                "entry_subject": entry_subject,
                "row_id": primary_id,
                "row_id_aliases": aliases,
                "whisper_rendering": whisper,
                "candidate_correction": candidate,
                "reason": reason_cell.strip(),
                "category": category,
                "transcript_excerpt": excerpt,
                "source_pass_3_file": f"transcripts/pass3_stage/{file_path.name}",
            }
        )
    return records


def main() -> None:
    subjects = load_entry_subjects(OVERLAY_PATH)
    files = sorted(
        STAGE_DIR.glob("entry_*.md"),
        key=lambda p: int(re.search(r"entry_(\d+)\.md", p.name).group(1)),
    )
    all_records: list[dict] = []
    for f in files:
        all_records.extend(process_entry(f, subjects))

    # Aggregate counts
    cat_counts: Counter[str] = Counter(r["category"] for r in all_records)
    entry_counts: Counter[int] = Counter(r["entry_number"] for r in all_records)

    feed = OrderedDict()
    feed["generated"] = "2026-05-22"
    feed["audit_session"] = "Session 3, Phase 1c"
    feed["ground_truth_corpus_version"] = "140 entries (post Phase D)"
    feed["ground_truth_corpus_path"] = "Metadata Generation System/civil_rights_facts.json"
    feed["schema_version"] = "1.0"
    feed["category_vocabulary"] = CATEGORY_VOCAB
    feed["total_items"] = len(all_records)
    # Preserve category order from the controlled vocab, with extras (if any) appended.
    items_by_category: OrderedDict[str, int] = OrderedDict()
    for c in CATEGORY_VOCAB:
        if c in cat_counts:
            items_by_category[c] = cat_counts[c]
    for c, n in cat_counts.items():
        if c not in items_by_category:
            items_by_category[c] = n
    feed["items_by_category"] = items_by_category
    feed["items_by_entry"] = OrderedDict(
        (str(num), entry_counts[num]) for num in sorted(entry_counts)
    )
    feed["items"] = all_records

    OUTPUT_PATH.write_text(
        json.dumps(feed, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Stdout summary for the orchestrator's report
    print(f"total_items: {len(all_records)}")
    print("items_by_category:")
    for c, n in items_by_category.items():
        print(f"  {c}: {n}")
    top5 = sorted(entry_counts.items(), key=lambda kv: (-kv[1], kv[0]))[:5]
    print("top5_entries_by_density:")
    for num, n in top5:
        print(f"  entry_{num} ({subjects.get(num, '?')}): {n}")


if __name__ == "__main__":
    main()
