"""Pass 9 rescore: incorporate Pass 8 LoC canonical-archive verification
into the per-entry inferential-uncertainty score.

The Pass 1-7 audit cascade produced an inferential_uncertainty.score per
entry, but those scores predate Pass 8 (the LoC token-level heal). Pass 8
applied 2,550 token-level heals across the corpus against the Library of
Congress's published transcripts, providing primary-source verification
that the original scoring formula does not credit.

This script:
  1. Reads each manifest under transcripts/corrected/*/manifest.json
  2. Computes a LoC verification credit from the existing loc_healing
     block (healed_count, loc_match_score, apply_failure_count)
  3. Subtracts the credit from the existing uncertainty score
  4. Recomputes the confidence_tier from the new score (using the same
     thresholds as review_metadata._confidence_tier_from_score)
  5. Preserves the v8 score under inferential_uncertainty.previous_score_v8
     so reviewers can see what changed
  6. Adds a pass9_metadata block recording when this ran and what changed
  7. Writes a corpus-wide summary table to
     transcripts/pass9_rescore_summary.md and .json

Provenance-pinned tiers (ingestion-only) are NOT re-tiered — their tier
reflects audit history, not score. Their score and Pass 9 credit are
recorded for completeness.

Categorical un-fixable entries (Lawson #59 M-flag mid-sentence
truncation; McClary #109 D-flag severe Whisper degradation) stay
not-auditable regardless of LoC heal volume — the formula's truncation
and degradation penalties remain in force.

Formula:
    uncertainty_v9 = uncertainty_v8 - loc_verification_credit
    loc_verification_credit =
        match_factor * min(0.10, max(0, 0.02 + 0.001 * healed_count - 0.005 * apply_failures))
        where match_factor = clamp(loc_match_score, 0.0, 1.0)
        and credit = 0 if healed_count == 0 or match_factor < 0.3

The 0.02 base credit reflects the institutional-cross-reference value of
having a LoC publication aligned at all (regardless of heal volume); the
0.001-per-heal increment reflects token-level evidence; the 0.005-per-fail
deduction reflects unresolvable apply failures; the 0.10 cap prevents any
single heal-rich entry from masking deeper audit-coverage issues; the 0.3
match-score floor prevents low-quality LoC matches from earning credit.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from datetime import date

CIVIL_ROOT = Path(__file__).resolve().parent.parent
CORRECTED_DIR = CIVIL_ROOT / "transcripts" / "corrected"
SUMMARY_JSON = CIVIL_ROOT / "transcripts" / "pass9_rescore_summary.json"
SUMMARY_MD = CIVIL_ROOT / "transcripts" / "pass9_rescore_summary.md"

PASS9_DATE = "2026-05-26"
PASS9_FORMULA_REFERENCE = (
    "transcripts/AUDIT_TRAIL.md::Inferential scoring framework "
    "(Pass 9 LoC-verification credit, 2026-05-26)"
)

TIER_ORDER = ["high", "medium", "low", "publication-block", "not-auditable", "ingestion-only"]


def confidence_tier_from_score(score: float) -> str:
    """Same thresholds as transcripts/review_metadata._confidence_tier_from_score."""
    if score < 0.10:
        return "high"
    if score < 0.25:
        return "medium"
    if score < 0.50:
        return "low"
    if score < 0.70:
        return "publication-block"
    return "not-auditable"


def loc_verification_credit(loc_healing: dict) -> float:
    """Compute Pass 9 LoC-verification credit (subtracted from uncertainty)."""
    if not loc_healing:
        return 0.0
    healed = loc_healing.get("healed_count") or 0
    match = loc_healing.get("loc_match_score") or 0.0
    fails = loc_healing.get("apply_failure_count") or 0

    if healed == 0:
        return 0.0

    match_factor = max(0.0, min(1.0, float(match)))
    if match_factor < 0.3:
        return 0.0

    raw = 0.02 + 0.001 * healed - 0.005 * fails
    capped = min(0.10, max(0.0, raw))
    return round(match_factor * capped, 4)


def rescore_entry(manifest: dict) -> dict:
    """Compute Pass 9 fields for one manifest. Returns a delta dict.

    Idempotent: if Pass 9 has already been applied (previous_score_v8 is set),
    we recompute from THAT preserved v8 baseline rather than the current score
    (which is the most recent Pass 9 output). This lets the formula evolve
    without compounding credit on re-runs.
    """
    iu = manifest.get("inferential_uncertainty") or {}
    lh = manifest.get("loc_healing") or {}

    if "previous_score_v8" in iu:
        v8_score = iu.get("previous_score_v8")
        v8_tier = iu.get("previous_tier_v8")
    else:
        v8_score = iu.get("score")
        v8_tier = iu.get("confidence_tier")
    provenance = manifest.get("entry_provenance")

    credit = loc_verification_credit(lh)
    if v8_score is None:
        v9_score_raw = None
    else:
        v9_score_raw = max(0.0, min(1.0, round(float(v8_score) - credit, 4)))

    # Ingestion-only is provenance-pinned: keep that tier label.
    if provenance == "ingestion-only" or v8_tier == "ingestion-only":
        v9_tier = "ingestion-only"
    elif v9_score_raw is None:
        v9_tier = v8_tier
    else:
        v9_tier = confidence_tier_from_score(v9_score_raw)

    return {
        "entry_number": manifest.get("entry_number"),
        "entry_subject": manifest.get("entry_subject"),
        "provenance": provenance,
        "v8_score": v8_score,
        "v8_tier": v8_tier,
        "loc_healed_count": lh.get("healed_count"),
        "loc_match_score": lh.get("loc_match_score"),
        "loc_apply_failure_count": lh.get("apply_failure_count"),
        "loc_verification_credit": credit,
        "v9_score": v9_score_raw,
        "v9_tier": v9_tier,
        "tier_changed": v8_tier != v9_tier,
    }


def apply_pass9_to_manifest(manifest: dict, delta: dict) -> dict:
    """Mutate the manifest to record Pass 9 outcome. Returns the manifest."""
    iu = manifest.setdefault("inferential_uncertainty", {})

    if delta["v9_score"] is not None:
        # Preserve v8 score under previous_score_v8 the FIRST time Pass 9
        # runs. If we re-run (idempotent), don't overwrite the original v8.
        if "previous_score_v8" not in iu:
            iu["previous_score_v8"] = delta["v8_score"]
        if "previous_tier_v8" not in iu:
            iu["previous_tier_v8"] = delta["v8_tier"]
        iu["score"] = delta["v9_score"]
        iu["confidence_tier"] = delta["v9_tier"]

        components = iu.setdefault("components", {})
        # Record the credit as a SIGNED component. Pass 9 credits are
        # subtracted, so the recorded value is negative for clarity.
        components["loc_verification_credit"] = round(-delta["loc_verification_credit"], 4)

    iu["formula_reference"] = PASS9_FORMULA_REFERENCE

    iu["pass9_metadata"] = {
        "applied_date": PASS9_DATE,
        "credit_formula": (
            "match_factor * min(0.10, max(0, 0.02 + 0.001*healed - 0.005*fails)); "
            "credit = 0 if healed=0 or match<0.3"
        ),
        "loc_match_score": delta["loc_match_score"],
        "loc_healed_count": delta["loc_healed_count"],
        "loc_apply_failure_count": delta["loc_apply_failure_count"],
        "credit_applied": delta["loc_verification_credit"],
        "tier_changed": delta["tier_changed"],
    }

    return manifest


def main(write: bool = True) -> int:
    manifests = sorted(CORRECTED_DIR.glob("*/manifest.json"))
    if not manifests:
        print(f"ERROR: no manifests under {CORRECTED_DIR}", file=sys.stderr)
        return 1

    deltas = []
    for mf in manifests:
        try:
            data = json.loads(mf.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"SKIP {mf}: {e}", file=sys.stderr)
            continue

        delta = rescore_entry(data)
        deltas.append(delta)

        if write:
            apply_pass9_to_manifest(data, delta)
            mf.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    deltas.sort(key=lambda d: (d["entry_number"] or 0))

    # Summary JSON
    from collections import Counter
    v8_dist = Counter(d["v8_tier"] for d in deltas)
    v9_dist = Counter(d["v9_tier"] for d in deltas)
    tier_changes = [d for d in deltas if d["tier_changed"]]
    tier_changes.sort(key=lambda d: (d["v8_tier"] or "", d["entry_number"] or 0))

    summary = {
        "pass9_date": PASS9_DATE,
        "total_entries": len(deltas),
        "tier_distribution_v8": dict(v8_dist),
        "tier_distribution_v9": dict(v9_dist),
        "tier_change_count": len(tier_changes),
        "tier_changes": [
            {
                "entry_number": d["entry_number"],
                "entry_subject": d["entry_subject"],
                "v8_tier": d["v8_tier"],
                "v9_tier": d["v9_tier"],
                "v8_score": d["v8_score"],
                "v9_score": d["v9_score"],
                "loc_healed_count": d["loc_healed_count"],
                "loc_verification_credit": d["loc_verification_credit"],
            }
            for d in tier_changes
        ],
        "all_entries": [
            {
                "entry_number": d["entry_number"],
                "entry_subject": d["entry_subject"],
                "provenance": d["provenance"],
                "v8_score": d["v8_score"],
                "v8_tier": d["v8_tier"],
                "v9_score": d["v9_score"],
                "v9_tier": d["v9_tier"],
                "loc_healed_count": d["loc_healed_count"],
                "loc_match_score": d["loc_match_score"],
                "loc_verification_credit": d["loc_verification_credit"],
                "tier_changed": d["tier_changed"],
            }
            for d in deltas
        ],
    }

    if write:
        SUMMARY_JSON.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    # Summary markdown
    lines = []
    lines.append(f"# Pass 9 rescore summary — {PASS9_DATE}")
    lines.append("")
    lines.append("Generated by `transcripts/pass9_rescore.py`. This file is a per-entry")
    lines.append("table of the v8 → v9 score + tier transition. The script is idempotent")
    lines.append("(re-running with no new Pass 8 data produces no changes).")
    lines.append("")
    lines.append("## Formula update")
    lines.append("")
    lines.append("```")
    lines.append("uncertainty_v9 = uncertainty_v8 - loc_verification_credit")
    lines.append("loc_verification_credit =")
    lines.append("    match_factor * min(0.10, max(0, 0.02 + 0.001*healed_count - 0.005*apply_failures))")
    lines.append("    where match_factor = clamp(loc_match_score, 0.0, 1.0)")
    lines.append("    credit = 0 if healed_count == 0 or match_factor < 0.3")
    lines.append("```")
    lines.append("")
    lines.append("## Tier distribution")
    lines.append("")
    lines.append("| Tier | Pre-Pass-9 (v8) | Post-Pass-9 (v9) | Delta |")
    lines.append("|---|---:|---:|---:|")
    for t in TIER_ORDER:
        a = v8_dist.get(t, 0)
        b = v9_dist.get(t, 0)
        if a == 0 and b == 0:
            continue
        delta_str = ("+" if b > a else "") + str(b - a) if b != a else "—"
        lines.append(f"| `{t}` | {a} | {b} | {delta_str} |")
    lines.append(f"| **TOTAL** | **{len(deltas)}** | **{len(deltas)}** | |")
    lines.append("")
    lines.append(f"**{len(tier_changes)} entries changed tier** as a result of Pass 9.")
    lines.append("")

    lines.append("## Entries that crossed a tier boundary")
    lines.append("")
    if tier_changes:
        lines.append("| Entry | Subject | v8 tier | v9 tier | v8 score | v9 score | LoC heals | Credit |")
        lines.append("|---:|---|---|---|---:|---:|---:|---:|")
        for d in tier_changes:
            lines.append(
                f"| #{d['entry_number']} | {d['entry_subject']} | "
                f"`{d['v8_tier']}` | `{d['v9_tier']}` | "
                f"{d['v8_score']:.4f} | {d['v9_score']:.4f} | "
                f"{d['loc_healed_count']} | -{d['loc_verification_credit']:.4f} |"
            )
    else:
        lines.append("_None_ — Pass 9 left all tier assignments unchanged.")
    lines.append("")

    lines.append("## Full per-entry table")
    lines.append("")
    lines.append("| # | Subject | Provenance | v8 score | v9 score | v8 tier | v9 tier | LoC heals | Match | Credit |")
    lines.append("|---:|---|---|---:|---:|---|---|---:|---:|---:|")
    for d in deltas:
        v8s = f"{d['v8_score']:.4f}" if d['v8_score'] is not None else "—"
        v9s = f"{d['v9_score']:.4f}" if d['v9_score'] is not None else "—"
        match = f"{d['loc_match_score']:.2f}" if d['loc_match_score'] is not None else "—"
        credit = f"-{d['loc_verification_credit']:.4f}" if d['loc_verification_credit'] else "—"
        change_marker = " **↻**" if d["tier_changed"] else ""
        lines.append(
            f"| {d['entry_number']} | {d['entry_subject']} | {d['provenance']} | "
            f"{v8s} | {v9s} | `{d['v8_tier']}` | `{d['v9_tier']}`{change_marker} | "
            f"{d['loc_healed_count']} | {match} | {credit} |"
        )
    lines.append("")

    if write:
        SUMMARY_MD.write_text("\n".join(lines), encoding="utf-8")

    # Stdout report
    print(f"Pass 9 rescore complete - {len(deltas)} entries processed")
    print(f"  v8 distribution: {dict(v8_dist)}")
    print(f"  v9 distribution: {dict(v9_dist)}")
    print(f"  tier changes:    {len(tier_changes)}")
    for d in tier_changes:
        print(
            f"    #{d['entry_number']:>3} {d['entry_subject'][:40]:<40} "
            f"{d['v8_tier']:<20} -> {d['v9_tier']:<20} "
            f"({d['v8_score']:.4f} -> {d['v9_score']:.4f}, credit=-{d['loc_verification_credit']:.4f})"
        )
    if write:
        print(f"  Summary written: {SUMMARY_MD.relative_to(CIVIL_ROOT)}")
        print(f"  Summary written: {SUMMARY_JSON.relative_to(CIVIL_ROOT)}")
    else:
        print("  (DRY RUN - manifests not modified)")
    return 0


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    sys.exit(main(write=not dry))
