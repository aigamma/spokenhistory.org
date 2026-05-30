"""Pass 10 rescore: honesty-preserving recalibration of inferential uncertainty.

Diagnosis (2026-05-30): for a clean, fully-audited entry the Pass 1-9 score is
dominated by

    low_confidence_residual_ratio = pending / (applied + pending)

i.e. the fraction of Pass 1-4 correction rows the audit tagged "medium/low
confidence" AT THE TIME IT PROPOSED THEM. That measures how unsure the audit was
about its own proposed edits mid-process, not whether the final text is correct.
Pass 8's line-by-line LoC verification (the strongest evidence in the pipeline)
was only credited as a <= 0.10 nudge, and resolved cross-contamination penalties
were kept sticky on purpose. Net effect: LoC-verified, fully-audited transcripts
were floored at tier "low" and "high" was effectively unreachable (1 of 136).

Example: Aaron Dixon (#1) aligns with the Library of Congress at match 0.95 with
30 confirmed heals and full Pass 1-9 coverage, yet scores 0.385 -> "low" because
0.3505 of that 0.385 is the residual-ratio term and LoC bought him only -0.0475.

Pass 10 recomputes the score so it reflects CURRENT transcript fidelity instead of
audit-process messiness, WITHOUT touching the genuine categorical limits:

    base / truncation_penalty / degradation_penalty
        -> KEPT verbatim. These are real source-audio / coverage limits
           (McClary severe degradation, Lawson/Howell/Richardson truncation, SKIPPED).
    low_confidence_residual_ratio
        -> scaled by (1 - loc_cov). LoC verification is the adjudication those
           proposed-edit residuals were waiting for; where LoC confirmed the text,
           the doubt is retired. Genuine NEEDS_SME_REVIEW divergences are unaffected
           (they live in loc_healing.unresolved_count, not in this term).
    adversarial_flag_density
        -> scaled by (1 - ADV_RETIRE * loc_cov). Partially retired by LoC coverage;
           some adversarial flags are interpretive and survive.
    cross_contamination_penalty
        -> scaled by XCONT_DECAY. The items are resolved
           (cross_contamination_audit.json); keep only a faint "was-a-hotspot" memory.

    loc_cov = clamp(loc_match_score, 0, 1) if healed_count > 0 else 0.0
    (no LoC verification -> no residual retirement -> score is unchanged. Honest.)

The honest core: entries whose only problem was process-history noise rise; entries
with real audio-source limits stay flagged. McClary #109 stays not-auditable because
base 0.7 + degradation 0.325 dominate. Transcript-fidelity tier is a SEPARATE concern
from AI-summary publication-readiness, which stays gated by the dual-scorer 90/90 in
Metadata Generation System/processor/ (Pass 10 does not touch that gate).

Idempotent: recomputes from the stored v8 base components each run (Pass 9 left those
untouched and only added a loc_verification_credit component), so re-running never
compounds. Dry-run by default. Pass --apply to write manifests + summary.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from collections import Counter

CIVIL_ROOT = Path(__file__).resolve().parent.parent
CORRECTED_DIR = CIVIL_ROOT / "transcripts" / "corrected"
SUMMARY_JSON = CIVIL_ROOT / "transcripts" / "pass10_rescore_summary.json"
SUMMARY_MD = CIVIL_ROOT / "transcripts" / "pass10_rescore_summary.md"

PASS10_DATE = "2026-05-30"

# ---- Recalibration knobs (tune here) --------------------------------------
# RESID_RETIRE caps how much of the proposed-edit residual a PERFECT LoC match
# (loc_cov=1.0) is allowed to retire. It is deliberately < 1.0: a high-level
# loc_match_score of 1.0 still leaves hundreds of unresolved LoC divergences per
# entry (loc_healing.unresolved_count), so LoC verification discounts the Pass 1-4
# residual doubt, it does not erase it. At 0.5, LoC verification roughly halves an
# entry's residual-uncertainty term; an entry whose audit flagged 60% of its own
# corrections as low-confidence still lands in "low" (review recommended), which is
# honest. Raise toward 1.0 for a more generous credit; lower for stricter.
RESID_RETIRE = 0.50  # max fraction of residual retired at full LoC coverage
XCONT_DECAY = 0.10   # resolved cross-contamination keeps 10% as faint memory
ADV_RETIRE = 0.50    # LoC coverage retires up to 50% of adversarial density
# ---------------------------------------------------------------------------

TIER_ORDER = ["high", "medium", "low", "publication-block", "not-auditable", "ingestion-only"]

# Components that are KEPT verbatim (genuine source-audio / coverage limits).
KEEP_COMPONENTS = ("base", "truncation_penalty", "degradation_penalty")

# Documented categorical hard-blocks (AUDIT_LIMITATIONS.md sections 1-2): the
# limitation is a property of the source AUDIO, not of audit process-history, so
# residual decay must NOT float these up. Pinned to not-auditable regardless of
# the recomputed score. McClary stays not-auditable on score alone (base 0.7 +
# degradation 0.325); Lawson needs the explicit pin because her old score leaned
# on a since-decayed cross-contamination penalty.
CATEGORICAL_BLOCK_PIN = {
    59: "mid-sentence audio truncation (M-flag); LoC transcript stops at the same cutoff",
    109: "severe Whisper degradation (D-flag); LoC transcript carries the same [inaudible] gaps",
}


def tier_from_score(score: float) -> str:
    """Same thresholds as review_metadata._confidence_tier_from_score."""
    if score < 0.10:
        return "high"
    if score < 0.25:
        return "medium"
    if score < 0.50:
        return "low"
    if score < 0.70:
        return "publication-block"
    return "not-auditable"


def loc_coverage(manifest: dict) -> float:
    """Fraction of proposed-edit doubt that LoC verification adjudicated.

    loc_cov = clamp(loc_match_score, 0, 1) when the entry actually received
    LoC heals; 0.0 otherwise (no verification -> no retirement).
    """
    lh = manifest.get("loc_healing") or {}
    iu = manifest.get("inferential_uncertainty") or {}
    p9 = iu.get("pass9_metadata") or {}

    healed = lh.get("healed_count")
    if healed is None:
        healed = p9.get("loc_healed_count") or 0
    match = lh.get("loc_match_score")
    if match is None:
        match = p9.get("loc_match_score") or 0.0

    if not healed:
        return 0.0
    return max(0.0, min(1.0, float(match)))


def recompute(manifest: dict) -> dict:
    """Compute the Pass 10 score/tier for one manifest. Returns a delta dict."""
    iu = manifest.get("inferential_uncertainty") or {}
    provenance = manifest.get("entry_provenance")
    comp = iu.get("components") or {}

    # Current (pre-Pass-10) score/tier for the before/after.
    cur_score = iu.get("score")
    cur_tier = iu.get("confidence_tier")

    # Provenance-pinned entries are not rescored by formula.
    if provenance == "ingestion-only" or cur_tier == "ingestion-only":
        return {
            "entry_number": manifest.get("entry_number"),
            "entry_subject": manifest.get("entry_subject"),
            "provenance": provenance,
            "cur_score": cur_score, "cur_tier": cur_tier,
            "v10_score": cur_score, "v10_tier": "ingestion-only",
            "loc_cov": None, "tier_changed": False, "kept": True,
        }

    loc_cov = loc_coverage(manifest)

    base = float(comp.get("base", 0.0) or 0.0)
    trunc = float(comp.get("truncation_penalty", 0.0) or 0.0)
    degr = float(comp.get("degradation_penalty", 0.0) or 0.0)
    resid = float(comp.get("low_confidence_residual_ratio", 0.0) or 0.0)
    adv = float(comp.get("adversarial_flag_density", 0.0) or 0.0)
    xcont = float(comp.get("cross_contamination_penalty", 0.0) or 0.0)

    resid_v10 = resid * (1.0 - RESID_RETIRE * loc_cov)
    adv_v10 = adv * (1.0 - ADV_RETIRE * loc_cov)
    xcont_v10 = xcont * XCONT_DECAY

    v10_components = {
        "base": round(base, 4),
        "truncation_penalty": round(trunc, 4),
        "degradation_penalty": round(degr, 4),
        "low_confidence_residual_ratio": round(resid_v10, 4),
        "adversarial_flag_density": round(adv_v10, 4),
        "cross_contamination_penalty": round(xcont_v10, 4),
    }
    v10_score = round(min(1.0, max(0.0, sum(v10_components.values()))), 4)
    v10_tier = tier_from_score(v10_score)

    entry_num = manifest.get("entry_number")
    pin_reason = None
    if entry_num in CATEGORICAL_BLOCK_PIN:
        v10_tier = "not-auditable"
        pin_reason = CATEGORICAL_BLOCK_PIN[entry_num]

    return {
        "entry_number": entry_num,
        "entry_subject": manifest.get("entry_subject"),
        "provenance": provenance,
        "cur_score": cur_score, "cur_tier": cur_tier,
        "v10_score": v10_score, "v10_tier": v10_tier,
        "v10_components": v10_components,
        "categorical_pin_reason": pin_reason,
        "loc_cov": round(loc_cov, 3),
        "resid_before": round(resid, 4), "resid_after": round(resid_v10, 4),
        "xcont_before": round(xcont, 4),
        "tier_changed": cur_tier != v10_tier, "kept": False,
    }


def apply_to_manifest(manifest: dict, delta: dict) -> None:
    if delta["kept"]:
        return
    iu = manifest.setdefault("inferential_uncertainty", {})
    if "previous_score_v9" not in iu:
        iu["previous_score_v9"] = delta["cur_score"]
        iu["previous_tier_v9"] = delta["cur_tier"]
    iu["score"] = delta["v10_score"]
    iu["confidence_tier"] = delta["v10_tier"]
    iu["components"] = delta["v10_components"]
    iu["formula_reference"] = (
        "transcripts/pass10_rescore.py (LoC-verification retires confirmed "
        "residuals; resolved-penalty decay; 2026-05-30)"
    )
    iu["pass10_metadata"] = {
        "applied_date": PASS10_DATE,
        "loc_coverage": delta["loc_cov"],
        "resid_retire": RESID_RETIRE,
        "xcont_decay": XCONT_DECAY,
        "adv_retire": ADV_RETIRE,
        "residual_before": delta["resid_before"],
        "residual_after": delta["resid_after"],
        "categorical_pin_reason": delta.get("categorical_pin_reason"),
        "tier_changed": delta["tier_changed"],
    }


def main(apply: bool) -> int:
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
        d = recompute(data)
        deltas.append(d)
        if apply:
            apply_to_manifest(data, d)
            mf.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    deltas.sort(key=lambda d: (d["entry_number"] or 0))

    before = Counter(d["cur_tier"] for d in deltas)
    after = Counter(d["v10_tier"] for d in deltas)
    changed = [d for d in deltas if d["tier_changed"]]

    # Entries that moved OFF not-auditable / publication-block: surface for SME review.
    off_block = [d for d in changed if d["cur_tier"] in ("not-auditable", "publication-block")]

    print(f"Pass 10 rescore {'(APPLIED)' if apply else '(DRY RUN)'} - {len(deltas)} entries")
    print("\n  Tier distribution before -> after:")
    for t in TIER_ORDER:
        a, b = before.get(t, 0), after.get(t, 0)
        if a or b:
            arrow = "" if a == b else f"   ({'+' if b > a else ''}{b - a})"
            print(f"    {t:<18} {a:>3} -> {b:>3}{arrow}")
    print(f"\n  Entries that changed tier: {len(changed)}")
    print(f"  Moved off publication-block / not-auditable: {len(off_block)}")

    spotlight_nums = {1, 109, 59, 130, 33, 60, 5}
    print("\n  Spotlight:")
    for d in deltas:
        if d["entry_number"] in spotlight_nums:
            cs = f"{d['cur_score']:.3f}" if d['cur_score'] is not None else "—"
            vs = f"{d['v10_score']:.3f}" if d['v10_score'] is not None else "—"
            print(f"    #{d['entry_number']:>3} {str(d['entry_subject'])[:32]:<32} "
                  f"{d['cur_tier']:<17} {cs} -> {d['v10_tier']:<17} {vs}  (loc_cov={d['loc_cov']})")

    if off_block:
        print("\n  Moved off a blocking tier (review these):")
        for d in sorted(off_block, key=lambda d: d["entry_number"] or 0):
            print(f"    #{d['entry_number']:>3} {str(d['entry_subject'])[:34]:<34} "
                  f"{d['cur_tier']} -> {d['v10_tier']}  (loc_cov={d['loc_cov']}, "
                  f"resid {d['resid_before']}->{d['resid_after']}, xcont {d['xcont_before']})")

    if apply:
        summary = {
            "pass10_date": PASS10_DATE,
            "knobs": {"xcont_decay": XCONT_DECAY, "adv_retire": ADV_RETIRE},
            "total_entries": len(deltas),
            "tier_distribution_before": dict(before),
            "tier_distribution_after": dict(after),
            "tier_change_count": len(changed),
            "entries": [
                {k: d.get(k) for k in ("entry_number", "entry_subject", "provenance",
                                       "cur_score", "cur_tier", "v10_score", "v10_tier",
                                       "loc_cov", "tier_changed")}
                for d in deltas
            ],
        }
        SUMMARY_JSON.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
        _write_summary_md(deltas, before, after, changed, off_block)
        print(f"\n  Wrote {SUMMARY_MD.relative_to(CIVIL_ROOT)} and {SUMMARY_JSON.relative_to(CIVIL_ROOT)}")
    else:
        print("\n  (dry run - no manifests modified; re-run with --apply to write)")
    return 0


def _write_summary_md(deltas, before, after, changed, off_block) -> None:
    L = []
    L.append(f"# Pass 10 rescore summary - {PASS10_DATE}")
    L.append("")
    L.append("Honesty-preserving recalibration: LoC line-by-line verification retires the")
    L.append("proposed-edit residuals it confirmed, resolved cross-contamination penalties")
    L.append("decay, and genuine source-audio limits (base / truncation / degradation) are kept.")
    L.append("Generated by `transcripts/pass10_rescore.py`. Idempotent.")
    L.append("")
    L.append(f"Knobs: `XCONT_DECAY={XCONT_DECAY}`, `ADV_RETIRE={ADV_RETIRE}`.")
    L.append("")
    L.append("## Tier distribution")
    L.append("")
    L.append("| Tier | Before (v9) | After (v10) | Delta |")
    L.append("|---|---:|---:|---:|")
    for t in TIER_ORDER:
        a, b = before.get(t, 0), after.get(t, 0)
        if not (a or b):
            continue
        delta_str = "—" if a == b else (("+" if b > a else "") + str(b - a))
        L.append(f"| `{t}` | {a} | {b} | {delta_str} |")
    L.append(f"| **TOTAL** | **{len(deltas)}** | **{len(deltas)}** | |")
    L.append("")
    L.append(f"**{len(changed)} entries changed tier.** {len(off_block)} moved off a blocking tier (listed below for SME review).")
    L.append("")
    L.append("## Moved off publication-block / not-auditable (review)")
    L.append("")
    if off_block:
        L.append("| # | Subject | Before | After | loc_cov | residual before->after | xcontam |")
        L.append("|---:|---|---|---|---:|---|---:|")
        for d in sorted(off_block, key=lambda d: d["entry_number"] or 0):
            L.append(f"| {d['entry_number']} | {d['entry_subject']} | `{d['cur_tier']}` | "
                     f"`{d['v10_tier']}` | {d['loc_cov']} | {d['resid_before']} -> {d['resid_after']} | {d['xcont_before']} |")
    else:
        L.append("_None._")
    L.append("")
    L.append("## Full per-entry table")
    L.append("")
    L.append("| # | Subject | Provenance | v9 score | v10 score | v9 tier | v10 tier | loc_cov |")
    L.append("|---:|---|---|---:|---:|---|---|---:|")
    for d in deltas:
        cs = f"{d['cur_score']:.4f}" if d['cur_score'] is not None else "—"
        vs = f"{d['v10_score']:.4f}" if d['v10_score'] is not None else "—"
        cov = d['loc_cov'] if d['loc_cov'] is not None else "—"
        mark = " **↻**" if d["tier_changed"] else ""
        L.append(f"| {d['entry_number']} | {d['entry_subject']} | {d['provenance']} | "
                 f"{cs} | {vs} | `{d['cur_tier']}` | `{d['v10_tier']}`{mark} | {cov} |")
    L.append("")
    SUMMARY_MD.write_text("\n".join(L), encoding="utf-8")


def _override_knob(name: str, current: float) -> float:
    """Allow --resid-retire 0.6 style overrides for quick calibration sweeps."""
    flag = "--" + name.replace("_", "-")
    if flag in sys.argv:
        i = sys.argv.index(flag)
        if i + 1 < len(sys.argv):
            return float(sys.argv[i + 1])
    return current


if __name__ == "__main__":
    RESID_RETIRE = _override_knob("resid_retire", RESID_RETIRE)
    XCONT_DECAY = _override_knob("xcont_decay", XCONT_DECAY)
    ADV_RETIRE = _override_knob("adv_retire", ADV_RETIRE)
    sys.exit(main(apply="--apply" in sys.argv))
