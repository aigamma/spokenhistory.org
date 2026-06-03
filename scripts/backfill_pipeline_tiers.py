"""
backfill_pipeline_tiers.py - reconcile the dormant audit tiers baked into
public/rag/summaries/pipeline_output/entry_<N>.json with the canonical Pass-10
recalibration.

Why this exists: Pass 10 (transcripts/pass10_rescore.py, 2026-05-30) recomputed
every entry's inferential_uncertainty tier against the Library of Congress match
score and wrote the result into the live artifacts the UI reads (neighbors.json,
constellation.json). It did NOT rewrite the per-entry pipeline_output JSON, which
still carries the pre-Pass-10 ("cur_") tier + score. That field is currently
dormant (every tier badge on the site reads neighbors.json, not pipeline_output),
but it is a latent trap: a future surface that reads pipeline_output's tier would
resurrect the stale low/medium values. This script brings pipeline_output into
agreement so the data stops contradicting itself.

Source of truth:
  - transcripts/pass10_rescore_summary.json :: entries[].v10_tier / v10_score
    for the audit corpus (entries 1-138).
  - public/rag/summaries/neighbors.json :: entries keyed by number -> .tier
    for entries Pass 10 did not cover (139-142, onboarded after 2026-05-30),
    which keep their onboarding tier.

The edit is SURGICAL: it replaces only the two field values via a targeted
substitution, so the rest of each file (and its formatting) is untouched and the
diff stays small. Idempotent: re-running reproduces the same files.

Usage:
  python scripts/backfill_pipeline_tiers.py            # report only, writes nothing
  python scripts/backfill_pipeline_tiers.py --write    # apply the changes
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PIPE = ROOT / "public" / "rag" / "summaries" / "pipeline_output"
PASS10 = ROOT / "transcripts" / "pass10_rescore_summary.json"
NEIGHBORS = ROOT / "public" / "rag" / "summaries" / "neighbors.json"

TIER_RE = re.compile(r'("inferential_uncertainty_tier"\s*:\s*)"[^"]*"')
SCORE_RE = re.compile(r'("inferential_uncertainty_score"\s*:\s*)(null|-?[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)')


def fmt_num(x: float) -> str:
    # Keep a float-looking literal (0.0, 1.0, 0.0411), rounded to 4 dp like the
    # Pass-10 summary, so the JSON number reads the same as the rest of the file.
    return repr(round(float(x), 4))


def load_pass10() -> dict[int, dict]:
    data = json.loads(PASS10.read_text(encoding="utf-8"))
    return {int(e["entry_number"]): e for e in data.get("entries", [])}


def load_neighbor_tiers() -> dict[int, str]:
    data = json.loads(NEIGHBORS.read_text(encoding="utf-8"))
    entries = data.get("entries", data)
    out: dict[int, str] = {}
    for k, v in entries.items():
        if isinstance(v, dict) and v.get("tier"):
            try:
                out[int(k)] = v["tier"]
            except (TypeError, ValueError):
                pass
    return out


def current_tier(text: str) -> str | None:
    m = re.search(r'"inferential_uncertainty_tier"\s*:\s*"([^"]*)"', text)
    return m.group(1) if m else None


def main(argv: list[str]) -> int:
    write = "--write" in argv
    p10 = load_pass10()
    nb = load_neighbor_tiers()

    changed = 0
    files = 0
    before: dict[str, int] = {}
    after: dict[str, int] = {}
    changes: list[str] = []
    no_target: list[int] = []

    for f in sorted(PIPE.glob("entry_*.json"), key=lambda p: int(re.search(r"\d+", p.name).group())):
        m = re.search(r"entry_(\d+)\.json", f.name)
        if not m:
            continue
        n = int(m.group(1))
        files += 1
        text = f.read_text(encoding="utf-8")
        cur = current_tier(text)
        before[cur or "?"] = before.get(cur or "?", 0) + 1

        rec = p10.get(n)
        target_tier = rec["v10_tier"] if rec else nb.get(n)
        target_score = rec["v10_score"] if rec else None  # None -> leave score as-is

        if not target_tier:
            no_target.append(n)
            after[cur or "?"] = after.get(cur or "?", 0) + 1
            continue

        new = TIER_RE.sub(lambda mm: mm.group(1) + json.dumps(target_tier), text, count=1)
        if target_score is not None:
            new = SCORE_RE.sub(lambda mm: mm.group(1) + fmt_num(target_score), new, count=1)

        if new != text:
            changed += 1
            if cur != target_tier:
                changes.append(f"  entry {n:>3}: {cur} -> {target_tier}")
            if write:
                f.write_text(new, encoding="utf-8")

        ft = current_tier(new)
        after[ft or "?"] = after.get(ft or "?", 0) + 1

    print(f"pipeline_output entries: {files}")
    print(f"files {'updated' if write else 'that WOULD change'}: {changed}")
    print(f"tier distribution BEFORE: {json.dumps(before)}")
    print(f"tier distribution AFTER : {json.dumps(after)}")
    if no_target:
        print(f"no canonical tier found for entries (left as-is): {no_target}")
    if changes:
        print("tier changes:")
        print("\n".join(changes))
    if not write:
        print("\n(report only) re-run with --write to apply.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
