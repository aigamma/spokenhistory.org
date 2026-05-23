#!/usr/bin/env python3
"""Standardized review-history metadata for per-entry audit provenance.

This module produces per-entry metadata that gets embedded into the
`manifest.json` files in `transcripts/corrected/<dir>/` by
`scripts/apply_corrections.py`. The metadata is the substrate for downstream
adversarial-model grading (Kiro/Kimi/Codex/Gemini ensemble) and for
institutional review by Smithsonian/LoC reviewers.

# Why standardized metadata matters

Each corrected transcript file is the output of an audit pipeline that
ran 4 sweeping passes plus follow-on cleanups. A future grader (human or
model) needs to know:
- How many passes did this entry receive?
- What KIND of review (correction sweep vs. fact-check vs. cross-contamination cleanup)?
- What residual uncertainty remains?
- What known issues block publication-grade release?

Without standardized metadata, a grader has to reconstruct this from
the audit overlay — which is exactly the "show of work" Eric flagged
as the wrong substrate for ensemble grading. With standardized metadata,
the grader reads the per-entry manifest and gets the structured signals
directly.

# Metadata schema (per entry)

```json
{
  "review_history": {
    "correction_passes_complete": ["Pass 1", "Pass 2", "Pass 2 tail-sweep", "Pass 3", "Pass 4"],
    "audit_sweeps_complete": [
      "Cross-contamination Phase 1a (2026-05-22)",
      "Cross-contamination follow-on (2026-05-22)",
      "Layer 5 corpus-global fidelity sweep (2026-05-22/23)"
    ],
    "pass_count_total": 8,
    "pass_coverage_flags": {
      "Pass 1": "F",
      "Pass 2": "F",
      "Pass 3": "F",
      "Pass 4": "F"
    },
    "coverage_flag_legend": {
      "F": "Full transcript read end-to-end",
      "P-NN": "Partial read covered NN% of bytes",
      "T": "Tail-sweep applied (full coverage restored)",
      "S": "SKIPPED (empty source dir / 3+-speaker pipeline failure)",
      "R": "Redirect (covered via joint interview)",
      "D": "Severe Whisper degradation",
      "M": "Mid-sentence source truncation (not retry-resolvable)"
    }
  },
  "known_issues": ["severe-whisper-degradation"],
  "inferential_uncertainty": {
    "score": 0.07,
    "confidence_tier": "high",
    "components": {
      "base": 0.0,
      "truncation_penalty": 0.0,
      "degradation_penalty": 0.0,
      "low_confidence_residual_ratio": 0.03,
      "adversarial_flag_density": 0.04,
      "cross_contamination_penalty": 0.0
    },
    "formula_reference": "transcripts/AUDIT_TRAIL.md::Inferential scoring framework"
  },
  "ground_truth_corpus_version": "140 entries (post Phase D 2026-05-22)",
  "ground_truth_corpus_path": "Metadata Generation System/civil_rights_facts.json"
}
```

# Confidence tier mapping (from uncertainty score)

| Uncertainty score | Tier | Meaning |
|---|---|---|
| 0.00-0.10 | high | Publication-ready; minimal residual error expected |
| 0.10-0.25 | medium | Publication with caveat note; residual error possible |
| 0.25-0.50 | low | Adversarial-ensemble review recommended before publication |
| 0.50-0.70 | publication-block | Re-transcription or re-audit needed before publication |
| 0.70-1.00 | not-auditable | SKIPPED / severe-degradation / source-truncation; no publication path |
"""
import json
import re
from pathlib import Path
from typing import Optional

CIVIL_ROOT = Path(r"C:\civil")
AUDIT_TRAIL = CIVIL_ROOT / "transcripts" / "AUDIT_TRAIL.md"
ADVERSARIAL_FEED = CIVIL_ROOT / "transcripts" / "adversarial_review_feed.json"
CROSS_CONTAMINATION_AUDIT = CIVIL_ROOT / "transcripts" / "cross_contamination_audit.json"
LAYER5_AUDIT = CIVIL_ROOT / "transcripts" / "layer5_fidelity_audit.json"
FACTS_CORPUS = CIVIL_ROOT / "Metadata Generation System" / "civil_rights_facts.json"

# Known issue categories. The coverage flag in AUDIT_TRAIL's matrix maps
# directly to a known_issues category for any non-clean entry.
COVERAGE_FLAG_TO_ISSUE = {
    "D": "severe-whisper-degradation",
    "M": "source-level-mid-sentence-truncation",
    "S": "skipped-empty-source-multispeaker",
    "R": "redirect-covered-via-joint-interview",
}

# Static list of audit sweeps that have run across the corpus. Each agent
# producing a corrected file at a point in time should record which sweeps
# had landed at THAT point. Update this list when new sweeps land.
AUDIT_SWEEPS_AS_OF = [
    "Cross-contamination Phase 1a (2026-05-22, commit e325d79)",
    "Cross-contamination follow-on cleanup (2026-05-22, commit 847f763)",
    # Layer 5 added conditionally if its audit JSON exists at production time
]

GROUND_TRUTH_VERSION = "140 entries (post Phase D 2026-05-22)"
COVERAGE_FLAG_LEGEND = {
    "F": "Full transcript read end-to-end",
    "P-NN": "Partial read covered NN% of bytes",
    "T": "Tail-sweep applied (full coverage restored)",
    "S": "SKIPPED (empty source dir / 3+-speaker pipeline failure)",
    "R": "Redirect (covered via joint interview)",
    "D": "Severe Whisper degradation",
    "M": "Mid-sentence source truncation (not retry-resolvable)",
}


def _parse_audit_trail_coverage() -> dict[int, dict[str, str]]:
    """Parse the per-entry coverage matrix from AUDIT_TRAIL.md.

    Returns: {entry_num: {"Pass 1": "F", "Pass 2": "F (P-59 + T)", "Pass 3": "F"}}
    """
    if not AUDIT_TRAIL.exists():
        return {}
    content = AUDIT_TRAIL.read_text(encoding="utf-8")
    coverage = {}
    # Matrix rows look like:
    #   | 1 Aaron Dixon | P-59 | F (P-59 + T) | F | Tail-sweep applied 2026-05-22 |
    # Capture entry-num + Pass1/Pass2/Pass3 columns. Pass 4 column was added
    # later by Session 4 — handle both 3-pass and 4-pass row shapes.
    row_re = re.compile(
        r"^\|\s*(\d+)\s+[^|]+?\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|(.*?)\|",
        re.MULTILINE,
    )
    for m in row_re.finditer(content):
        try:
            entry_num = int(m.group(1))
        except ValueError:
            continue
        pass1 = m.group(2).strip()
        pass2 = m.group(3).strip()
        pass3 = m.group(4).strip()
        # Don't include header rows or section markers
        if not pass1 or pass1.startswith("-") or "Pass" in pass1:
            continue
        # Pass 4 may be in the 5th column for entries where Session 4 added it
        rest = m.group(5)
        # Extract a leading column from rest (if it looks like a flag)
        rest_parts = [p.strip() for p in rest.split("|")]
        pass4 = rest_parts[0] if rest_parts and rest_parts[0] and len(rest_parts[0]) <= 30 else ""
        # Heuristic: if it doesn't look like a flag value, it's probably a Status note
        if pass4 and not re.match(r"^[FPTSRDM\-\d\s\(\)\+\.]+$", pass4):
            pass4 = ""
        coverage[entry_num] = {
            "Pass 1": pass1,
            "Pass 2": pass2,
            "Pass 3": pass3,
        }
        if pass4:
            coverage[entry_num]["Pass 4"] = pass4
    return coverage


def _load_adversarial_flag_counts() -> dict[int, int]:
    """Count adversarial-review flags per entry from the aggregated feed."""
    if not ADVERSARIAL_FEED.exists():
        return {}
    try:
        data = json.loads(ADVERSARIAL_FEED.read_text(encoding="utf-8"))
    except Exception:
        return {}
    counts: dict[int, int] = {}
    for item in data.get("items", []):
        n = item.get("entry_number")
        if isinstance(n, int):
            counts[n] = counts.get(n, 0) + 1
    return counts


def _load_cross_contamination_counts() -> dict[int, int]:
    """Count cross-contamination items per entry from the most-recent audit."""
    if not CROSS_CONTAMINATION_AUDIT.exists():
        return {}
    try:
        data = json.loads(CROSS_CONTAMINATION_AUDIT.read_text(encoding="utf-8"))
    except Exception:
        return {}
    counts: dict[int, int] = {}
    for candidate in data.get("candidates", []):
        n = candidate.get("entry_number")
        if isinstance(n, int):
            counts[n] = counts.get(n, 0) + 1
    return counts


def _layer5_available() -> bool:
    """Whether the Layer 5 fidelity audit has produced its output JSON."""
    return LAYER5_AUDIT.exists()


def _parse_partial_read_fraction(pass_flag: str) -> float:
    """Extract unread-byte fraction from a partial-read coverage flag.

    'P-59' means 59% covered, so 41% unread → 0.41.
    'F (P-59 + T)' means tail-sweep was applied → 0% unread.
    """
    if "T" in pass_flag or pass_flag.startswith("F"):
        return 0.0
    m = re.search(r"P-(\d+)", pass_flag)
    if m:
        coverage_pct = int(m.group(1))
        return max(0.0, (100 - coverage_pct) / 100.0)
    return 0.0


def _determine_base_uncertainty(coverage_flags: dict[str, str]) -> float:
    """Determine the base uncertainty term from coverage flag combinations."""
    # SKIPPED: 1.0
    # Severe degradation: 0.7
    # Source-truncation: 0.4
    # Otherwise (Pass 1+2+3 complete): 0.0
    flags_str = " ".join(coverage_flags.values())
    if "S" in flags_str.split():
        return 1.0
    if "D" in flags_str.split():
        return 0.7
    if "M" in flags_str.split():
        return 0.4
    return 0.0


def _determine_known_issues(coverage_flags: dict[str, str]) -> list[str]:
    """Identify known issues from coverage flag patterns."""
    issues = []
    flag_set = set()
    for v in coverage_flags.values():
        for tok in re.split(r"[\s\(\)+]", v):
            tok = tok.strip()
            if tok in COVERAGE_FLAG_TO_ISSUE:
                flag_set.add(tok)
    for flag in flag_set:
        issues.append(COVERAGE_FLAG_TO_ISSUE[flag])
    return sorted(issues)


def _confidence_tier_from_score(score: float) -> str:
    """Map uncertainty score to a discrete confidence tier."""
    if score < 0.10:
        return "high"
    if score < 0.25:
        return "medium"
    if score < 0.50:
        return "low"
    if score < 0.70:
        return "publication-block"
    return "not-auditable"


def compute_uncertainty(
    entry_num: int,
    coverage_flags: dict[str, str],
    applied_count: int,
    pending_count: int,
    adversarial_count: int,
    cross_contamination_count: int,
) -> dict:
    """Compute inferential-uncertainty score + tier + components.

    Formula reference: AUDIT_TRAIL.md "Inferential scoring framework".
    """
    base = _determine_base_uncertainty(coverage_flags)

    # truncation_penalty: 0.05 * unread byte fraction from worst pass's coverage
    unread_fractions = [_parse_partial_read_fraction(v) for v in coverage_flags.values()]
    truncation_penalty = 0.05 * max(unread_fractions, default=0.0)

    # degradation_penalty: 0.5 * incoherent_fraction (per Pass-1 supervisor estimate)
    # Hard-coded for #109 McClary at ~0.65 incoherent based on Pass 1 anomaly notes.
    if entry_num == 109:
        degradation_penalty = 0.5 * 0.65  # 0.325
    else:
        degradation_penalty = 0.0

    # low_confidence_residual_ratio
    total_corrections = applied_count + pending_count
    low_conf_ratio = pending_count / total_corrections if total_corrections > 0 else 0.0

    # adversarial_flag_density
    adversarial_density = adversarial_count / total_corrections if total_corrections > 0 else 0.0

    # cross_contamination_penalty
    cross_cont_penalty = 0.1 * cross_contamination_count

    components = {
        "base": round(base, 4),
        "truncation_penalty": round(truncation_penalty, 4),
        "degradation_penalty": round(degradation_penalty, 4),
        "low_confidence_residual_ratio": round(low_conf_ratio, 4),
        "adversarial_flag_density": round(adversarial_density, 4),
        "cross_contamination_penalty": round(cross_cont_penalty, 4),
    }
    score = round(sum(components.values()), 4)
    # Cap at 1.0 (it's a probability-like score)
    score = min(score, 1.0)
    tier = _confidence_tier_from_score(score)

    return {
        "score": score,
        "confidence_tier": tier,
        "components": components,
        "formula_reference": "transcripts/AUDIT_TRAIL.md::Inferential scoring framework",
    }


# Cache layers — parsed once per process
_coverage_cache: Optional[dict[int, dict[str, str]]] = None
_adversarial_cache: Optional[dict[int, int]] = None
_cross_cont_cache: Optional[dict[int, int]] = None


def _get_coverage_cache() -> dict[int, dict[str, str]]:
    global _coverage_cache
    if _coverage_cache is None:
        _coverage_cache = _parse_audit_trail_coverage()
    return _coverage_cache


def _get_adversarial_cache() -> dict[int, int]:
    global _adversarial_cache
    if _adversarial_cache is None:
        _adversarial_cache = _load_adversarial_flag_counts()
    return _adversarial_cache


def _get_cross_cont_cache() -> dict[int, int]:
    global _cross_cont_cache
    if _cross_cont_cache is None:
        _cross_cont_cache = _load_cross_contamination_counts()
    return _cross_cont_cache


def build_review_metadata(
    entry_num: int, applied_count: int, pending_count: int
) -> dict:
    """Build the full review_history + uncertainty metadata block for one entry.

    Args:
        entry_num: 1-132
        applied_count: number of correct/high rows actually applied to the text
        pending_count: number of medium/low/flagged rows routed to manifest.pending_context

    Returns: dict with keys review_history / known_issues / inferential_uncertainty / ground_truth_corpus_version
    """
    coverage_flags = _get_coverage_cache().get(entry_num, {})
    adversarial_count = _get_adversarial_cache().get(entry_num, 0)
    cross_cont_count = _get_cross_cont_cache().get(entry_num, 0)

    # Determine which correction passes are complete based on coverage flags.
    # Accept both ASCII hyphen "-" and Unicode en-dash "–" / em-dash "—" as
    # "not applicable" markers, since the AUDIT_TRAIL coverage matrix uses
    # the en-dash for skipped/redirect pass cells.
    NOT_AVAILABLE_TOKENS = {"-", "–", "—", "S", "R", ""}
    correction_passes = []
    for pass_name in ("Pass 1", "Pass 2", "Pass 3", "Pass 4"):
        flag = coverage_flags.get(pass_name, "")
        flag_stripped = (flag or "").strip()
        if flag_stripped and flag_stripped not in NOT_AVAILABLE_TOKENS:
            correction_passes.append(pass_name)
    # If Pass 2 coverage flag explicitly notes "+ T", record tail-sweep as a separate pass
    if "T" in coverage_flags.get("Pass 2", ""):
        # Insert "Pass 2 tail-sweep" after "Pass 2" in the list
        if "Pass 2" in correction_passes:
            idx = correction_passes.index("Pass 2") + 1
            correction_passes.insert(idx, "Pass 2 tail-sweep")

    audit_sweeps = list(AUDIT_SWEEPS_AS_OF)
    if _layer5_available():
        audit_sweeps.append("Layer 5 corpus-global fidelity sweep (2026-05-22/23)")

    known_issues = _determine_known_issues(coverage_flags)

    uncertainty = compute_uncertainty(
        entry_num=entry_num,
        coverage_flags=coverage_flags,
        applied_count=applied_count,
        pending_count=pending_count,
        adversarial_count=adversarial_count,
        cross_contamination_count=cross_cont_count,
    )

    return {
        "review_history": {
            "correction_passes_complete": correction_passes,
            "audit_sweeps_complete": audit_sweeps,
            "pass_count_total": len(correction_passes) + len(audit_sweeps),
            "pass_coverage_flags": coverage_flags,
            "coverage_flag_legend": COVERAGE_FLAG_LEGEND,
        },
        "known_issues": known_issues,
        "inferential_uncertainty": uncertainty,
        "adversarial_review_flag_count": adversarial_count,
        "cross_contamination_items_resolved": cross_cont_count,
        "ground_truth_corpus_version": GROUND_TRUTH_VERSION,
        "ground_truth_corpus_path": "Metadata Generation System/civil_rights_facts.json",
    }


if __name__ == "__main__":
    # Smoke test: print metadata for a few sample entries
    import sys

    test_entries = [1, 73, 109, 28, 59]
    for n in test_entries:
        md = build_review_metadata(n, applied_count=87, pending_count=23)
        print(f"\n=== Entry #{n} ===")
        print(json.dumps(md, indent=2))
