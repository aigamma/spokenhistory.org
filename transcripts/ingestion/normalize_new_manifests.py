"""
Normalize the manifest.json files for the 9 new entries (ingested 2026-05-25
from Dustin's student batch) so they match the schema of the existing 127
audit-able entries. This makes the new entries indistinguishable from the
original corpus members for downstream consumption (RAG ingest, embedding
pipeline, MCP server tools, React frontend reads).

Fields added (with sensible defaults):
- `entry_number`: the canonical sequential ID assigned during ingestion
  (133-138 for the 6 Category-A genuinely-new entries; 28, 46, 64 for the
  3 Category-B SKIPPED/DEFERRED revivals).
- `adversarial_review_flag_count`: 0 (no Pass 7 PRR adversarial review
  has run on these new entries — they came in after Pass 7 was retired).
- `cross_contamination_items_resolved`: 0 (cross-contamination audit
  didn't run on new entries; they have no cross-contamination because
  ingested clean from the student batch).
- `ground_truth_corpus_path`: standard value.
- `ground_truth_corpus_version`: standard value.
- `inferential_uncertainty`: zero-score baseline (no Pass 1-7 evaluation
  has run, so we don't have a real inferential-uncertainty score; recording
  the zero with components.audit_passes_complete=0 makes the absence of
  audit data explicit rather than hidden).

The original `ingestion` field is preserved as provenance — it's the marker
that distinguishes Pass 8-only entries from the original 127.

Field schema also normalized:
- `script_version` updated to a consistent format identifying the
  ingestion path: "ingestion-1.0+normalized-2026-05-25".

Idempotent — re-running on already-normalized manifests is a no-op.

Usage:
    python transcripts/ingestion/normalize_new_manifests.py
    python transcripts/ingestion/normalize_new_manifests.py --dry-run
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CORRECTED_DIR = ROOT / "transcripts" / "corrected"

# Map of new-entry directory -> canonical entry number
NEW_ENTRY_NUMBERS = {
    "Alfred Moldovan_interview_20260525_160100": 133,
    "C. T. Vivian_interview_20260525_160200": 134,
    "David Mercer Ackerman and Satoko Ito Ackerman_interview_20260525_160300": 135,
    "Gertrude Newsome Jackson_interview_20260525_160400": 136,
    "Myrtle Gonza Glascoe_interview_20260525_160500": 137,
    "Simeon Wright_interview_20260525_160600": 138,
    "Abernathy family_interview_20260525_160700": 28,
    "Geraldine Crawford Bennett, Toni Breaux, and Willie Elliot Jenkins_interview_20260525_160800": 46,
    "John Dudley et al_interview_20260525_160900": 64,
}

GROUND_TRUTH_CORPUS_PATH = "Metadata Generation System/civil_rights_facts.json"
GROUND_TRUTH_CORPUS_VERSION = "140 entries (post Phase D 2026-05-22)"


def _build_inferential_baseline() -> dict:
    """Zero-score baseline indicating no Pass 1-7 audit data is available
    for these entries. Components mirror the existing schema."""
    return {
        "score": 0.0,
        "confidence_tier": "ingestion-only",
        "components": {
            "base": 0.0,
            "truncation_penalty": 0.0,
            "degradation_penalty": 0.0,
            "low_confidence_residual_ratio": 0.0,
            "adversarial_flag_density": 0.0,
            "cross_contamination_penalty": 0.0,
            "audit_passes_complete": 0,
        },
        "formula_reference": "transcripts/AUDIT_TRAIL.md::Inferential scoring framework",
        "notes": (
            "These entries were ingested 2026-05-25 via the streamlined "
            "Pass 8 LoC-healing-as-primary pipeline; they did not pass "
            "through the original Pass 1-7 audit journey. Pass 8 LoC "
            "alignment provides the primary correction substrate; "
            "additional audit signals (adversarial review, "
            "cross-contamination check, ground-truth-corpus validation) "
            "would need to be run separately to fill in this score."
        ),
    }


def normalize_one(entry_dir: Path, entry_number: int, dry_run: bool = False) -> dict:
    manifest_path = entry_dir / "manifest.json"
    if not manifest_path.is_file():
        return {"path": str(manifest_path), "status": "manifest_missing"}
    m = json.loads(manifest_path.read_text(encoding="utf-8"))

    changed = False
    if "entry_number" not in m:
        m["entry_number"] = entry_number
        changed = True
    if "adversarial_review_flag_count" not in m:
        m["adversarial_review_flag_count"] = 0
        changed = True
    if "cross_contamination_items_resolved" not in m:
        m["cross_contamination_items_resolved"] = 0
        changed = True
    if "ground_truth_corpus_path" not in m:
        m["ground_truth_corpus_path"] = GROUND_TRUTH_CORPUS_PATH
        changed = True
    if "ground_truth_corpus_version" not in m:
        m["ground_truth_corpus_version"] = GROUND_TRUTH_CORPUS_VERSION
        changed = True
    if "inferential_uncertainty" not in m:
        m["inferential_uncertainty"] = _build_inferential_baseline()
        changed = True
    if m.get("script_version") == "ingestion-1.0":
        m["script_version"] = "ingestion-1.0+normalized-2026-05-25"
        changed = True

    if not dry_run and changed:
        manifest_path.write_text(json.dumps(m, indent=2), encoding="utf-8")
    return {"path": str(manifest_path), "entry_number": entry_number, "changed": changed}


def verify_corpus_consistency(corrected_root: Path) -> dict:
    """Walk every manifest in corrected/, report schema gaps."""
    REQUIRED_KEYS = (
        "entry_number", "entry_subject", "raw_dir", "files_processed",
        "applied_corrections", "ground_truth_corpus_path",
        "inferential_uncertainty", "review_history",
    )
    counts: dict[str, int] = {"total": 0}
    missing_by_key: dict[str, list[str]] = {k: [] for k in REQUIRED_KEYS}
    for sub in sorted(corrected_root.iterdir()):
        if not sub.is_dir():
            continue
        mp = sub / "manifest.json"
        if not mp.is_file():
            continue
        counts["total"] += 1
        m = json.loads(mp.read_text(encoding="utf-8"))
        for k in REQUIRED_KEYS:
            if k not in m:
                missing_by_key[k].append(sub.name)
    return {"counts": counts, "missing": {k: v for k, v in missing_by_key.items() if v}}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    print(f"Normalizing {len(NEW_ENTRY_NUMBERS)} new-entry manifests...")
    for entry_dir_name, num in NEW_ENTRY_NUMBERS.items():
        entry_dir = CORRECTED_DIR / entry_dir_name
        result = normalize_one(entry_dir, num, dry_run=args.dry_run)
        prefix = "[DRY] " if args.dry_run else ""
        print(f"  {prefix}entry {num:3d}: {entry_dir_name[:55]:55s} changed={result.get('changed')}")

    print()
    print("Corpus-wide schema verification:")
    verdict = verify_corpus_consistency(CORRECTED_DIR)
    print(f"  Total manifests scanned: {verdict['counts']['total']}")
    if verdict["missing"]:
        print(f"  Entries missing required keys:")
        for k, dirs in verdict["missing"].items():
            print(f"    '{k}': {len(dirs)} entries (first 3: {dirs[:3]})")
        return 1
    else:
        print(f"  All entries have the required schema keys (entry_number, entry_subject, raw_dir, "
              f"files_processed, applied_corrections, ground_truth_corpus_path, "
              f"inferential_uncertainty, review_history).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
