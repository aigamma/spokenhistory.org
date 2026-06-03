"""
Layer 5 corpus-global fidelity audit.

Four dimensions:

  1. Phantom Whisper-renderings:
     correction rows claim Whisper rendered X but X cannot be found in raw.

  2. Bidirectional canonical inconsistency:
     same Whisper rendering -> different canonical corrections across entries.

  3. Catalog-vs-per-entry contradiction:
     per-entry correction contradicts a catalog row for the same Whisper pattern.

  4. Cross-entry biographical inconsistency:
     factual claims (birth year, organization, role) about top-50 mentioned
     canonical figures disagree across entries.

Produces transcripts/layer5_fidelity_audit.json deterministically.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
from collections import Counter, defaultdict
from dataclasses import asdict
from pathlib import Path
from typing import Iterable

# Make this script importable from anywhere
SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))

from layer5_extract_corrections import (  # noqa: E402
    CatalogRow,
    CorrectionRow,
    EntryMetadata,
    ParseResult,
    first_variant,
    normalize_text,
    parse_master_md,
    strip_meta_markers,
)

try:
    from rapidfuzz import fuzz  # type: ignore
except ImportError:
    print("ERROR: rapidfuzz not installed. pip install rapidfuzz", file=sys.stderr)
    sys.exit(2)

ROOT = Path(r"D:\civil")
RAW_DIR = ROOT / "transcripts" / "raw"
OUT_JSON = ROOT / "transcripts" / "layer5_fidelity_audit.json"

# How many entries to audit for biographical consistency (top-N by mention count)
TOP_FIGURES_FOR_BIO = 50

# Fuzzy match threshold below which a whisper rendering is treated as "missing"
PHANTOM_FUZZY_FLOOR = 85  # rapidfuzz partial_ratio threshold


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_raw_text(source_dir_rel: str) -> tuple[str, list[str]]:
    """Read all .txt/.srt/.vtt/.json files from a raw transcript dir.

    Returns (concatenated lowercase text, list of file basenames searched).
    """
    src_path = ROOT / source_dir_rel.rstrip("/")
    if not src_path.exists():
        return "", []
    chunks: list[str] = []
    seen_files: list[str] = []
    for f in sorted(src_path.iterdir()):
        if not f.is_file():
            continue
        suf = f.suffix.lower()
        if suf in (".txt", ".srt", ".vtt", ".json"):
            try:
                data = f.read_text(encoding="utf-8", errors="replace")
            except Exception:
                data = ""
            chunks.append(data)
            seen_files.append(f.name)
    text = "\n".join(chunks)
    return text.lower(), seen_files


# Cache: source_dir -> (lowercase_text, files)
_raw_cache: dict[str, tuple[str, list[str]]] = {}


def get_raw(source_dir_rel: str) -> tuple[str, list[str]]:
    if source_dir_rel not in _raw_cache:
        _raw_cache[source_dir_rel] = load_raw_text(source_dir_rel)
    return _raw_cache[source_dir_rel]


SKIP_META_PATTERNS = {
    "n/a",
    "(uncertain)",
    "uncertain",
    "(none)",
    "none",
    "—",
    "-",
    "(not in tail)",
    "see catalog",
    "(see catalog)",
    "(see below)",
    "tbd",
    "(tbd)",
    "(supervisor logged only a meta-tag; see canonical)",
    "(supervisor logged only a meta-tag)",
}


def looks_meta(s: str) -> bool:
    """Skip rows whose whisper rendering is obviously meta-text."""
    s_norm = normalize_text(strip_meta_markers(s))
    if not s_norm:
        return True
    if s_norm in SKIP_META_PATTERNS:
        return True
    # Speaker tags
    if re.fullmatch(r"\[?speaker\s*\d*\]?", s_norm):
        return True
    # Just a row id
    if re.fullmatch(r"#?\d+(\.\d+)*", s_norm):
        return True
    # Very short or pure punctuation
    if len(s_norm) < 2:
        return True
    # "(not applicable)" etc
    if "not applicable" in s_norm:
        return True
    # Pass 3/4 commentary patterns (descriptive text about a row, not a real rendering)
    commentary_patterns = [
        "spelling propagation",
        "spelling consistency",
        "canonical spelling",
        "pattern reconfirmation",
        "recurrence",
        "(in raw transcript)",
        "(per pass",
        "see catalog",
        "(no change)",
        "no rendering",
        "row index",
        "catalog backfile",
        "catalog back-fill",
        "catalog-backfill",
        "catalog backfill",
        "back-fill candidate",
        "backfill candidate",
        "back-fill recommendation",
        "backfill recommendation",
        "ground-truth corpus candidate",
        "ground-truth candidate",
        "(meta)",
        "[meta]",
        "verification only",
    ]
    if any(p in s_norm for p in commentary_patterns):
        return True
    # "<text> -> <text>" arrow-form commentary
    if "->" in s_norm and "(" in s and ")" in s:
        # commentary about a previous row
        return True
    return False


def is_relocated(row: CorrectionRow) -> bool:
    """Detect RELOC suffix in row_id or whisper field."""
    s = (row.row_id + " " + row.whisper_rendering).lower()
    return "reloc" in s or "moved" in s or "redirect" in s


def confidence_tier(c: str) -> str:
    """Normalize confidence-column free text to a tier."""
    s = normalize_text(strip_meta_markers(c))
    if "high" in s:
        return "high"
    if "correct" in s:
        return "correct"
    if "medium" in s:
        return "medium"
    if "low" in s and "low-stakes" not in s:
        return "low"
    if "speaker" in s:
        return "speaker-originating"
    if "flagged" in s or "flag" in s:
        return "flagged"
    return "other"


# ---------------------------------------------------------------------------
# Dimension 1: phantom Whisper renderings
# ---------------------------------------------------------------------------

def dim1_phantom_whisper(parse: ParseResult) -> list[dict]:
    """Detect whisper renderings claimed but not present in raw transcript."""
    findings: list[dict] = []
    entry_by_num = {e.entry_number: e for e in parse.entries}

    audited = 0
    skipped_meta = 0
    skipped_no_src = 0
    skipped_low_conf = 0
    skipped_reloc = 0

    skipped_self_confirm = 0

    for row in parse.correction_rows:
        # Filter: only correct/high confidence rows
        tier = confidence_tier(row.confidence)
        if tier not in ("high", "correct"):
            skipped_low_conf += 1
            continue
        if is_relocated(row):
            skipped_reloc += 1
            continue
        if looks_meta(row.whisper_rendering):
            skipped_meta += 1
            continue

        # "Self-confirming" rows where whisper rendering == correction (or only differs
        # by minor punctuation/casing). These are bookkeeping "no correction needed"
        # rows, not actual corrections that depend on a Whisper rendering existing in
        # the raw. They are still interesting if absent, but lower-impact than true
        # corrections. We exclude them from the main phantom sweep to focus on
        # actionable findings.
        whisper_norm = normalize_text(strip_meta_markers(row.whisper_rendering))
        corr_norm = normalize_text(strip_meta_markers(row.correction))
        if whisper_norm and corr_norm and whisper_norm == corr_norm:
            skipped_self_confirm += 1
            continue

        entry = entry_by_num.get(row.entry_number)
        if entry is None or not entry.source_dir:
            skipped_no_src += 1
            continue

        # Each whisper field may contain multiple variants
        variants = first_variant(strip_meta_markers(row.whisper_rendering))
        if not variants:
            continue

        raw_text, files = get_raw(entry.source_dir)
        if not raw_text:
            skipped_no_src += 1
            continue

        audited += 1

        # Try each variant; if ANY variant appears, the row is grounded
        best_score = 0.0
        best_variant = ""
        any_substring = False
        for v in variants:
            v_norm = v.lower().strip()
            v_norm = re.sub(r"^[\"'(\[]+|[\"')\]]+$", "", v_norm).strip()
            if not v_norm:
                continue
            # Substring direct hit
            if v_norm in raw_text:
                any_substring = True
                best_score = 100.0
                best_variant = v
                break
            # Fuzzy partial_ratio
            # No score_cutoff — we want the actual best score, not 0 below threshold.
            # partial_ratio handles long haystacks via internal windowing.
            score = fuzz.partial_ratio(v_norm, raw_text)
            if score > best_score:
                best_score = score
                best_variant = v
            if score >= 95:
                # Strong enough — stop early
                break

        if any_substring or best_score >= PHANTOM_FUZZY_FLOOR:
            continue

        # Phantom finding
        findings.append({
            "entry_number": row.entry_number,
            "entry_subject_short": row.entry_subject_short,
            "row_id": row.row_id,
            "pass_section": row.pass_section,
            "whisper_rendering": row.whisper_rendering,
            "correction": row.correction,
            "confidence": row.confidence,
            "source": row.source,
            "raw_dir": entry.source_dir,
            "files_searched": files,
            "best_fuzzy_match_variant": best_variant,
            "best_fuzzy_score": round(best_score, 1),
            "raw_line": row.raw_line,
            "action": "investigate",
        })

    print(
        f"  dim1: audited={audited}, "
        f"skipped(meta)={skipped_meta}, "
        f"skipped(low-conf)={skipped_low_conf}, "
        f"skipped(no-src)={skipped_no_src}, "
        f"skipped(reloc)={skipped_reloc}, "
        f"skipped(self-confirm)={skipped_self_confirm}, "
        f"phantom findings={len(findings)}"
    )
    return findings


# ---------------------------------------------------------------------------
# Dimension 2: bidirectional inconsistency
# ---------------------------------------------------------------------------

def normalize_correction(s: str) -> str:
    """Normalize a canonical correction for comparison.

    Strips parenthetical context, leading articles, trailing punctuation.
    """
    s = strip_meta_markers(s)
    # Strip leading 'the ', 'a '
    s = re.sub(r"^(the |a |an )", "", s, flags=re.IGNORECASE)
    # Strip trailing parenthetical context like "(SCLC)" or "(b. 1928)"
    s = re.sub(r"\s*\([^)]*\)\s*$", "", s)
    # Strip footnote markers
    s = re.sub(r"\[[^\]]+\]", "", s)
    # Drop everything after a slash (treat alternatives as same canonical)
    # Actually, slash often indicates alternative names — keep them as variants
    # We'll keep just the first slash-component for comparison purposes
    primary = s.split("/")[0].strip()
    primary = re.sub(r"\s+", " ", primary).strip(" .,;:")
    return primary.lower()


META_CORRECTION_PHRASES = (
    "catalog-worthy",
    "catalog worthy",
    "full read achieved",
    "unread tail",
    "partial read",
    "(catalog)",
    "n/a",
    "cross-corpus catalog match",
    "master md section",
    "catalog-confirmation",
    "catalog confirmation",
    "catalog match",
    "high",
    "medium",
    "low",
    "speaker-originating",
    "whisper-degradation severity pattern",
    "not present in this transcript",
    "not directly named in this transcript",
    "not in this transcript",
    "new canonical-alias rendering",
    "new pattern",
    "verification only",
)


def looks_meta_correction(s: str) -> bool:
    s_norm = normalize_text(strip_meta_markers(s))
    if not s_norm:
        return True
    for phrase in META_CORRECTION_PHRASES:
        if s_norm == phrase or s_norm.startswith(phrase + " ") or s_norm.endswith(" " + phrase):
            return True
    return False


def dim2_bidirectional(parse: ParseResult) -> list[dict]:
    """Same whisper rendering -> different canonical corrections."""
    # Group correction rows by normalized whisper rendering (per first variant)
    whisper_map: dict[str, list[CorrectionRow]] = defaultdict(list)
    for row in parse.correction_rows:
        # Skip meta + relocated rows
        if looks_meta(row.whisper_rendering):
            continue
        if is_relocated(row):
            continue
        # Skip rows with empty correction or meta correction
        if looks_meta(row.correction) or not strip_meta_markers(row.correction):
            continue
        if looks_meta_correction(row.correction):
            continue
        # Skip "no correction needed" rows
        if confidence_tier(row.confidence) == "correct":
            # Don't include — these aren't real "corrections" so the variance is
            # mostly noise (canonical names appearing with minor punctuation).
            continue
        variants = first_variant(strip_meta_markers(row.whisper_rendering))
        for v in variants:
            v_norm = normalize_text(v).strip()
            v_norm = re.sub(r"[\"'(\[\])]", "", v_norm).strip()
            if not v_norm or len(v_norm) < 3:
                continue
            whisper_map[v_norm].append(row)

    findings: list[dict] = []
    for whisper_norm, rows in whisper_map.items():
        if len(rows) < 2:
            continue
        # Collect distinct corrections
        correction_groups: dict[str, list[CorrectionRow]] = defaultdict(list)
        for r in rows:
            corr_norm = normalize_correction(r.correction)
            if not corr_norm:
                continue
            correction_groups[corr_norm].append(r)

        if len(correction_groups) < 2:
            continue

        # We have a divergence — check entries
        variants = []
        for corr_norm, gr in correction_groups.items():
            entries = sorted(set(r.entry_number for r in gr))
            variants.append({
                "correction": gr[0].correction,
                "correction_norm": corr_norm,
                "entries": entries,
                "count": len(gr),
                "sample_row_ids": [g.row_id for g in gr[:5]],
            })

        # Sort variants by count desc
        variants.sort(key=lambda v: -v["count"])

        # Filter out cases where one variant dominates 10:1 and minority is a typo
        # We still flag — could be legitimate but worth reviewing.
        total = sum(v["count"] for v in variants)
        majority_share = variants[0]["count"] / total

        findings.append({
            "whisper_rendering_normalized": whisper_norm,
            "whisper_sample": rows[0].whisper_rendering,
            "n_variants": len(variants),
            "total_occurrences": total,
            "majority_correction": variants[0]["correction"],
            "majority_share": round(majority_share, 3),
            "variants": variants,
            "context_distinguishes": "review-needed",
            "action": "normalize_variants" if majority_share > 0.7 else "review",
        })

    # Sort findings: most-frequent first
    findings.sort(key=lambda f: -f["total_occurrences"])
    print(f"  dim2: bidirectional whisper-renderings flagged: {len(findings)}")
    return findings


# ---------------------------------------------------------------------------
# Dimension 3: catalog-vs-per-entry contradiction
# ---------------------------------------------------------------------------

def dim3_catalog_contradiction(parse: ParseResult) -> list[dict]:
    """Per-entry rows whose canonical differs from the catalog canonical for the same whisper rendering."""
    # Sections to EXCLUDE from catalog map:
    #   H (and H-ext): "Special patterns to watch for" — col[0] is a meta-description,
    #                  not a whisper rendering. Will produce false-positive matches.
    #   I: cross-reference list with no whisper renderings
    #   P (and P-ext): catalog-meta and reinforcement-only notes
    #   Z (and Z-ext): generic-pattern rules (often broad / hard to map)
    EXCLUDED_SECTIONS = {"H", "H-ext", "I", "I-ext", "P", "P-ext", "Z", "Z-ext"}

    # Build catalog map: normalized whisper rendering -> list of (canonical_norm, raw_canonical, section, line)
    cat_map: dict[str, list[dict]] = defaultdict(list)
    for c in parse.catalog_rows:
        if c.section in EXCLUDED_SECTIONS:
            continue
        whisper = c.whisper_rendering
        canonical = c.canonical_correction
        if looks_meta(whisper) or looks_meta(canonical):
            continue
        if "supervisor logged only a meta-tag" in whisper.lower():
            continue
        if "supervisor logged only a meta-tag" in canonical.lower():
            continue
        # Strip leading/trailing meta
        whisper_clean = strip_meta_markers(whisper)
        # The catalog often has multi-variant whisper strings; split on slash + 'or'
        variants = first_variant(whisper_clean)
        for v in variants:
            # Filter out parenthetical aside variants
            v_clean = re.sub(r"\([^)]*\)", "", v).strip()
            v_norm = normalize_text(v_clean)
            v_norm = re.sub(r"[\"'(\[\])]", "", v_norm).strip()
            if not v_norm or len(v_norm) < 3:
                continue
            cat_map[v_norm].append({
                "catalog_canonical": canonical,
                "catalog_canonical_norm": normalize_correction(canonical),
                "catalog_section": c.section,
                "catalog_raw_line": c.raw_line,
            })

    findings: list[dict] = []
    for row in parse.correction_rows:
        if looks_meta(row.whisper_rendering) or is_relocated(row):
            continue
        if confidence_tier(row.confidence) == "correct":
            continue
        if not strip_meta_markers(row.correction):
            continue

        # Check each variant
        for v in first_variant(strip_meta_markers(row.whisper_rendering)):
            v_norm = normalize_text(re.sub(r"\([^)]*\)", "", v).strip())
            v_norm = re.sub(r"[\"'(\[\])]", "", v_norm).strip()
            if not v_norm or v_norm not in cat_map:
                continue
            row_canon_norm = normalize_correction(row.correction)
            for cat_entry in cat_map[v_norm]:
                cat_canon_norm = cat_entry["catalog_canonical_norm"]
                if not cat_canon_norm or not row_canon_norm:
                    continue
                if cat_canon_norm == row_canon_norm:
                    continue
                # Substring check — if one is a substring of the other, they're consistent
                if cat_canon_norm in row_canon_norm or row_canon_norm in cat_canon_norm:
                    continue
                # Token-set ratio — if names overlap, treat as consistent
                token_overlap = fuzz.token_set_ratio(cat_canon_norm, row_canon_norm)
                if token_overlap >= 85:
                    continue
                # Real divergence
                findings.append({
                    "entry_number": row.entry_number,
                    "entry_subject_short": row.entry_subject_short,
                    "row_id": row.row_id,
                    "pass_section": row.pass_section,
                    "whisper_rendering": row.whisper_rendering,
                    "per_entry_correction": row.correction,
                    "catalog_canonical": cat_entry["catalog_canonical"],
                    "catalog_section": cat_entry["catalog_section"],
                    "catalog_raw_line": cat_entry["catalog_raw_line"],
                    "row_raw_line": row.raw_line,
                    "token_overlap_score": token_overlap,
                    "action": "harmonize_with_catalog",
                })
                break  # Don't flag same row multiple times for same catalog entry
            # If row matches some catalog whisper, don't keep looping
            break

    # Deduplicate by (entry, row_id, catalog_canonical)
    seen = set()
    deduped = []
    for f in findings:
        key = (f["entry_number"], f["row_id"], normalize_correction(f["catalog_canonical"]))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(f)

    deduped.sort(key=lambda f: (f["entry_number"], f["row_id"]))
    print(f"  dim3: catalog-vs-per-entry contradictions: {len(deduped)}")
    return deduped


# ---------------------------------------------------------------------------
# Dimension 4: biographical consistency
# ---------------------------------------------------------------------------

# Patterns to detect factual claims in subject paragraphs and notes
BIRTH_YEAR_RE = re.compile(r"\bb(?:\.|orn)\s*\.?\s*(?:in\s+)?(?:[A-Z][a-z]+\s+(?:\d{1,2},?\s*)?)?(\d{4})\b", re.IGNORECASE)
DEATH_YEAR_RE = re.compile(r"\bd(?:\.|ied)\s*\.?\s*(?:in\s+)?(?:[A-Z][a-z]+\s+(?:\d{1,2},?\s*)?)?(\d{4})\b", re.IGNORECASE)
YEAR_RANGE_RE = re.compile(r"\b(\d{4})\s*[-–]\s*(\d{4})\b")

# Known canonical figures to track — we'll also auto-discover by mention frequency
KNOWN_CANONICAL_FIGURES = [
    "Martin Luther King", "Malcolm X", "Stokely Carmichael", "James Forman",
    "Bob Moses", "Bobby Seale", "Huey Newton", "Eldridge Cleaver",
    "Medgar Evers", "Fannie Lou Hamer", "Ella Baker", "Bayard Rustin",
    "Rosa Parks", "John Lewis", "Andrew Young", "Septima Clark",
    "Diane Nash", "Cleveland Sellers", "Bob Zellner", "Charles Sherrod",
    "Hosea Williams", "Ralph Abernathy", "James Meredith", "Bull Connor",
    "Thurgood Marshall", "W.E.B. Du Bois", "Ida B. Wells",
    "Robert F. Kennedy", "Lyndon B. Johnson", "John F. Kennedy",
    "Adam Clayton Powell", "Wyatt Tee Walker", "James Bevel",
    "Vernon Dahmer", "Clyde Kennard", "Hartman Turnbow", "Amzie Moore",
    "Ruby Doris Smith Robinson", "Marion Barry", "Julian Bond",
    "Coretta Scott King", "Dorothy Cotton", "Dorothy Zellner",
    "Charlie Cobb", "H. Rap Brown", "Kathleen Cleaver", "Fred Hampton",
    "Aaron Henry", "Bernice Johnson Reagon", "Esau Jenkins",
    "Myles Horton", "Constance Baker Motley", "Joe Mosnier",
    "Hasan Kwame Jeffries", "David Cline", "Emilye Crosby", "John Bishop",
    "John Dittmer",
]


def find_mentions_in_text(figure_name: str, text: str) -> int:
    """Count case-insensitive mentions of figure_name (variant-tolerant)."""
    if not text:
        return 0
    # Build a pattern that requires the last token (surname) — exact match against text
    # Use Last name as cheap approximation (most figures referenced by last name)
    tokens = figure_name.split()
    if len(tokens) >= 2:
        # Try the FULL canonical name, then JUST the surname
        pat = re.escape(figure_name)
        count = len(re.findall(pat, text, re.IGNORECASE))
        # Add surname-only mentions for cross-corpus aggregation
        # (most documents use surname after first introduction)
        return count
    return len(re.findall(re.escape(figure_name), text, re.IGNORECASE))


def extract_birth_year(text: str, figure_name: str) -> list[int]:
    """Search for birth-year claims tightly attached to a figure name.

    Only count a year if:
      - figure_name occurs immediately before the year (within ~50 chars), AND
      - the year is in a birth-year syntactic context ("b. YYYY", "born YYYY", "(YYYY-YYYY)").

    This avoids spurious matches like Sam Mahone (b. 1945) being attributed to
    Charles Sherrod because the two names appear in the same paragraph.
    """
    years: list[int] = []
    if not text:
        return years
    # Build a regex that requires figure_name to be near a birth-year pattern.
    pat = re.compile(
        re.escape(figure_name)
        + r"[^.;:]{0,50}?\b(?:b(?:\.|orn)\s*\.?\s*(?:in\s+)?(?:[A-Z][a-z]+\s+(?:\d{1,2},?\s*)?)?(\d{4})|\(\s*(\d{4})\s*[-–]\s*\d{4}\s*\))",
        re.IGNORECASE,
    )
    for m in pat.finditer(text):
        y_str = m.group(1) or m.group(2)
        if not y_str:
            continue
        try:
            y = int(y_str)
        except ValueError:
            continue
        if 1840 <= y <= 2010:
            years.append(y)
    return years


def dim4_biographical(parse: ParseResult) -> list[dict]:
    """Cross-entry biographical consistency for top-mentioned canonical figures."""
    # Build a giant pool of text per figure
    # Sources: subject paragraphs, cross-references lines, correction-row Notes (for the figure)

    # Step 1: collect mention counts for figures
    mention_counts: Counter[str] = Counter()
    figures = list(KNOWN_CANONICAL_FIGURES)

    # For each entry, count mentions
    for e in parse.entries:
        haystack_parts = []
        if e.subject_paragraph:
            haystack_parts.append(e.subject_paragraph)
        if e.cross_references:
            haystack_parts.append(e.cross_references)
        haystack = "\n".join(haystack_parts)
        if not haystack:
            continue
        for fig in figures:
            c = find_mentions_in_text(fig, haystack)
            if c > 0:
                mention_counts[fig] += c

    # Also count from correction-row Notes
    for r in parse.correction_rows:
        text = (r.correction or "") + " " + (r.notes or "")
        for fig in figures:
            c = find_mentions_in_text(fig, text)
            if c > 0:
                mention_counts[fig] += c

    top_figures = [f for f, _ in mention_counts.most_common(TOP_FIGURES_FOR_BIO)]

    findings: list[dict] = []

    for fig in top_figures:
        # Collect birth-year claims across entries
        year_claims: dict[int, list[dict]] = defaultdict(list)
        for e in parse.entries:
            text_sources = []
            if e.subject_paragraph:
                text_sources.append(("Subject paragraph", e.subject_paragraph))
            if e.cross_references:
                text_sources.append(("Cross-references", e.cross_references))
            for src_label, src_text in text_sources:
                years = extract_birth_year(src_text, fig)
                for y in years:
                    year_claims[y].append({
                        "entry_number": e.entry_number,
                        "entry_subject_short": e.entry_subject_short,
                        "source": src_label,
                    })

        if len(year_claims) > 1:
            # Build the variants list
            variants = []
            for y, claims in year_claims.items():
                variants.append({
                    "claim": str(y),
                    "count": len(claims),
                    "occurrences": claims[:10],
                })
            variants.sort(key=lambda v: -v["count"])
            findings.append({
                "canonical_figure": fig,
                "claim_type": "birth_year",
                "n_distinct_values": len(year_claims),
                "variants": variants,
                "total_mentions": mention_counts[fig],
                "action": "verify_and_normalize",
            })

    # Sort findings by mention count
    findings.sort(key=lambda f: -f["total_mentions"])
    print(f"  dim4: biographical inconsistencies: {len(findings)}")
    print(f"        (audited {len(top_figures)} top figures by mention count)")
    return findings


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    t0 = time.time()
    print(f"[{time.strftime('%H:%M:%S')}] Parsing master MD...")
    parse = parse_master_md()
    t1 = time.time()
    print(
        f"  parsed {len(parse.entries)} entries, "
        f"{len(parse.correction_rows):,} correction rows, "
        f"{len(parse.catalog_rows):,} catalog rows "
        f"({t1-t0:.1f}s)"
    )

    print(f"[{time.strftime('%H:%M:%S')}] Pre-loading raw transcripts into cache...")
    for e in parse.entries:
        if e.source_dir:
            get_raw(e.source_dir)
    t2 = time.time()
    print(
        f"  cached {len(_raw_cache)} raw bundles "
        f"(total chars in cache: "
        f"{sum(len(t[0]) for t in _raw_cache.values()):,}) "
        f"({t2-t1:.1f}s)"
    )

    print(f"[{time.strftime('%H:%M:%S')}] Dimension 1 — phantom whisper renderings...")
    dim1 = dim1_phantom_whisper(parse)
    t3 = time.time()
    print(f"  ({t3-t2:.1f}s)")

    print(f"[{time.strftime('%H:%M:%S')}] Dimension 2 — bidirectional inconsistency...")
    dim2 = dim2_bidirectional(parse)
    t4 = time.time()
    print(f"  ({t4-t3:.1f}s)")

    print(f"[{time.strftime('%H:%M:%S')}] Dimension 3 — catalog-vs-per-entry contradiction...")
    dim3 = dim3_catalog_contradiction(parse)
    t5 = time.time()
    print(f"  ({t5-t4:.1f}s)")

    print(f"[{time.strftime('%H:%M:%S')}] Dimension 4 — biographical consistency...")
    dim4 = dim4_biographical(parse)
    t6 = time.time()
    print(f"  ({t6-t5:.1f}s)")

    output = {
        "generated": "2026-05-22",
        "scope": "Layer 5 corpus-global fidelity sweep across 4 dimensions",
        "session": "Session 3 follow-on at user request — final Claude-side review before adversarial multi-model handoff",
        "master_md_chars": parse.master_md_chars,
        "master_md_lines": parse.master_md_lines,
        "entries_audited": len([e for e in parse.entries if e.source_dir]),
        "correction_rows_parsed": len(parse.correction_rows),
        "catalog_rows_parsed": len(parse.catalog_rows),
        "raw_dirs_loaded": len(_raw_cache),
        "raw_total_chars": sum(len(t[0]) for t in _raw_cache.values()),
        "summary": {
            "dimension_1_phantom_whisper_renderings": len(dim1),
            "dimension_2_bidirectional_inconsistencies": len(dim2),
            "dimension_3_catalog_contradictions": len(dim3),
            "dimension_4_biographical_inconsistencies": len(dim4),
        },
        "dimension_1_findings": dim1,
        "dimension_2_findings": dim2,
        "dimension_3_findings": dim3,
        "dimension_4_findings": dim4,
        "parameters": {
            "phantom_fuzzy_floor": PHANTOM_FUZZY_FLOOR,
            "top_figures_for_bio": TOP_FIGURES_FOR_BIO,
            "biographical_known_figures": len(KNOWN_CANONICAL_FIGURES),
        },
        "elapsed_seconds": round(time.time() - t0, 1),
    }

    OUT_JSON.write_text(
        json.dumps(output, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    size_mb = OUT_JSON.stat().st_size / (1024 * 1024)
    print(
        f"[{time.strftime('%H:%M:%S')}] Wrote {OUT_JSON.name} "
        f"({size_mb:.2f} MB, {round(time.time() - t0, 1)}s total)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
