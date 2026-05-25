"""
Add an `entry_provenance` field to every manifest in `transcripts/corrected/`
so downstream consumers (RAG ingest, embedding pipeline, MCP server, React
frontend) can distinguish:

- `audit-original`: entries 1-132 ingested via the original Whisper-from-YouTube
  raw/ pipeline and then audit-corrected via Passes 1-8. These have full audit
  provenance: applied_corrections rows, pending_context rows, Pass 1-7 stage
  files, Pass 8 LoC healing, inferential_uncertainty scoring.

- `ingestion-only`: entries ingested via the streamlined Pass-8-as-primary
  pipeline (transcripts/ingestion/ingest_new_transcript.py) on 2026-05-25
  onwards. These had Pass 8 LoC healing applied but did NOT pass through the
  legacy Pass 1-7 audit. Their inferential_uncertainty score is the
  zero-baseline indicating absent audit data.

Why this matters for the conference work: when the RAG / embedding pipeline
needs to filter or weight entries by audit-depth (e.g., "only embed
fully-audited entries for the publication-ready Smithsonian summary index"),
the provenance field gives a clean boolean filter.

Idempotent — safe to re-run.

Usage:
    python transcripts/ingestion/add_provenance_field.py
    python transcripts/ingestion/add_provenance_field.py --dry-run
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CORRECTED = ROOT / "transcripts" / "corrected"

INGESTION_ONLY_DIR_NAMES = {
    "Abernathy family_interview_20260525_160700",
    "Alfred Moldovan_interview_20260525_160100",
    "C. T. Vivian_interview_20260525_160200",
    "David Mercer Ackerman and Satoko Ito Ackerman_interview_20260525_160300",
    "Geraldine Crawford Bennett, Toni Breaux, and Willie Elliot Jenkins_interview_20260525_160800",
    "Gertrude Newsome Jackson_interview_20260525_160400",
    "John Dudley et al_interview_20260525_160900",
    "Myrtle Gonza Glascoe_interview_20260525_160500",
    "Simeon Wright_interview_20260525_160600",
}


def _classify(entry_dir_name: str) -> str:
    if entry_dir_name in INGESTION_ONLY_DIR_NAMES:
        return "ingestion-only"
    return "audit-original"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    counts = {"audit-original": 0, "ingestion-only": 0, "missing_manifest": 0}
    changed = 0
    for sub in sorted(CORRECTED.iterdir()):
        if not sub.is_dir():
            continue
        mp = sub / "manifest.json"
        if not mp.is_file():
            counts["missing_manifest"] += 1
            continue
        m = json.loads(mp.read_text(encoding="utf-8"))
        prov = _classify(sub.name)
        counts[prov] += 1
        if m.get("entry_provenance") == prov:
            continue
        m["entry_provenance"] = prov
        if not args.dry_run:
            mp.write_text(json.dumps(m, indent=2), encoding="utf-8")
        changed += 1

    print(f"Manifests scanned: {sum(counts.values())}")
    print(f"  audit-original: {counts['audit-original']}")
    print(f"  ingestion-only: {counts['ingestion-only']}")
    if counts["missing_manifest"]:
        print(f"  missing manifest: {counts['missing_manifest']}")
    print(f"Manifests {'(would-be) ' if args.dry_run else ''}changed: {changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
