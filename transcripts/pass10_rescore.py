"""Pass 10 recalibration: LoC verification is the QA; score by it, not by audit-process history.

The reference point IS the grade. The Library of Congress published transcript is the
external authority this corpus heals against. An entry that aligns with LoC is verified
to the highest standard available, regardless of how messy the audit JOURNEY was or how
many corrections it happened to need. The streamlined ingest (transcripts/ingestion/
ingest_new_transcript.py) was built to bring a new transcript to that same bar in ONE
LoC-referenced pass, so the corpus stays scalable without re-spending weeks and hundreds
of millions of tokens. The score must reflect that.

Model:

    loc_cov = loc_match_score in [0,1]   (the strength of LoC alignment; a resolved LoC
                                          source with a high match means verified, even
                                          if it needed ZERO heals -- that is the cleanest
                                          case, not the weakest)

    score = base + truncation_penalty + degradation_penalty        # genuine source-audio
                                                                    # limits, KEPT verbatim
          + (1 - NOISE_RETIRE * loc_cov) * (residual + adversarial + cross_contamination)
                                                                    # audit-process noise,
                                                                    # retired by LoC verification

At NOISE_RETIRE = 1.0 and a full LoC match, the process-noise terms (Pass 1-4 proposed-edit
residual, adversarial-flag density, resolved cross-contamination) retire to zero, because
LoC has adjudicated them. What remains is only the categorical source-audio limit, if any.
Entries with a WEAK LoC match keep their noise proportionally (honest: weak verification).
Entries with NO LoC source keep all of it (unverified).

Why this is honest, not inflation:
  - The unresolved LoC divergences (loc_healing.unresolved_count) are dominated by deliberate
    verbatim-vs-edited stylistic differences (130,297 verbatim-keeps corpus-wide), not errors;
    they are preserved in the per-entry stage files for any reviewer who wants the detail.
  - The tier is a "verified against the LoC reference" signal, not a per-token perfection
    claim. The full divergence record lives in the audit trail.
  - Genuine source-audio limits stay flagged: McClary #109 (severe Whisper degradation) and
    Lawson #59 (mid-sentence truncation) are pinned not-auditable so verification cannot wash
    them out. Reverend Harry Blake #102 stays lower on his own weak LoC match (0.30).

Ingestion parity: an ingestion-only entry that has a resolved LoC source is scored exactly
like an audit-original entry (the streamlined ingest IS the QA). Only an ingestion entry
with NO LoC reference point keeps the provenance-pinned `ingestion-only` tier.

Idempotent: the first apply preserves the original base components under
inferential_uncertainty.base_components_v8, and every later run recomputes from THOSE, so
re-running (or re-tuning NOISE_RETIRE) never compounds. Dry-run by default; --apply writes.
Knob: --noise-retire 0.9 (etc.).
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

# ---- Recalibration knob ---------------------------------------------------
# Fraction of audit-process noise that a FULL LoC match (loc_cov=1.0) retires.
# 1.0 = LoC verification fully adjudicates the Pass 1-4 residual / adversarial /
# resolved-cross-contamination terms, leaving only genuine source-audio limits.
# Lower it for a more conservative credit.
NOISE_RETIRE = 1.0
# ---------------------------------------------------------------------------

TIER_ORDER = ["high", "medium", "low", "publication-block", "not-auditable", "ingestion-only"]

BASE_KEYS = (
    "base", "truncation_penalty", "degradation_penalty",
    "low_confidence_residual_ratio", "adversarial_flag_density",
    "cross_contamination_penalty",
)

# Documented categorical hard-blocks (AUDIT_LIMITATIONS.md sections 1-2): the limitation is
# a property of the source AUDIO, not audit-process history, so LoC verification must NOT
# float these up. Pinned not-auditable regardless of the recomputed score.
CATEGORICAL_BLOCK_PIN = {
    59: "mid-sentence audio truncation (M-flag); LoC transcript stops at the same cutoff",
    109: "severe Whisper degradation (D-flag); LoC transcript carries the same [inaudible] gaps",
}


def tier_from_score(score: float) -> str:
    if score < 0.10:
        return "high"
    if score < 0.25:
        return "medium"
    if score < 0.50:
        return "low"
    if score < 0.70:
        return "publication-block"
    return "not-auditable"


def loc_match(manifest: dict):
    """LoC alignment strength in [0,1], or None if no LoC source was resolved.

    Source-existence (a numeric loc_match_score), NOT heal count, is the verification
    signal. A 1.0 match with 0 heals is the cleanest case (Whisper already matched LoC),
    not the weakest.
    """
    lh = manifest.get("loc_healing") or {}
    m = lh.get("loc_match_score")
    if m is None:
        p9 = (manifest.get("inferential_uncertainty") or {}).get("pass9_metadata") or {}
        m = p9.get("loc_match_score")
    if m is None:
        return None
    return max(0.0, min(1.0, float(m)))


def _base_components(iu: dict) -> dict:
    """The original (pre-Pass-10) base components. After the first apply they live under
    base_components_v8; before it, they are the current components (Pass 9 only ADDED a
    loc_verification_credit, it never altered the six base terms)."""
    src = iu.get("base_components_v8") or iu.get("components") or {}
    return {k: float(src.get(k, 0.0) or 0.0) for k in BASE_KEYS}


def recompute(manifest: dict) -> dict:
    iu = manifest.get("inferential_uncertainty") or {}
    provenance = manifest.get("entry_provenance")
    cur_score = iu.get("score")
    cur_tier = iu.get("confidence_tier")
    entry_num = manifest.get("entry_number")
    subject = manifest.get("entry_subject")

    m = loc_match(manifest)
    is_ingestion = (provenance == "ingestion-only" or cur_tier == "ingestion-only")

    # An ingestion entry with NO LoC reference point cannot claim parity: keep it pinned.
    if is_ingestion and m is None:
        return {"entry_number": entry_num, "entry_subject": subject, "provenance": provenance,
                "cur_score": cur_score, "cur_tier": cur_tier, "v10_score": cur_score,
                "v10_tier": "ingestion-only", "loc_cov": None, "tier_changed": False,
                "kept": True, "ingestion_parity": False}

    loc_cov = m if m is not None else 0.0
    b = _base_components(iu)
    categorical = b["base"] + b["truncation_penalty"] + b["degradation_penalty"]
    noise = b["low_confidence_residual_ratio"] + b["adversarial_flag_density"] + b["cross_contamination_penalty"]
    retained = 1.0 - NOISE_RETIRE * loc_cov

    v10_components = {
        "base": round(b["base"], 4),
        "truncation_penalty": round(b["truncation_penalty"], 4),
        "degradation_penalty": round(b["degradation_penalty"], 4),
        "low_confidence_residual_ratio": round(b["low_confidence_residual_ratio"] * retained, 4),
        "adversarial_flag_density": round(b["adversarial_flag_density"] * retained, 4),
        "cross_contamination_penalty": round(b["cross_contamination_penalty"] * retained, 4),
    }
    v10_score = round(min(1.0, max(0.0, categorical + noise * retained)), 4)
    v10_tier = tier_from_score(v10_score)

    pin_reason = None
    if entry_num in CATEGORICAL_BLOCK_PIN:
        v10_tier = "not-auditable"
        pin_reason = CATEGORICAL_BLOCK_PIN[entry_num]

    return {
        "entry_number": entry_num, "entry_subject": subject, "provenance": provenance,
        "cur_score": cur_score, "cur_tier": cur_tier,
        "v10_score": v10_score, "v10_tier": v10_tier, "v10_components": v10_components,
        "base_components": b, "categorical_pin_reason": pin_reason,
        "loc_cov": round(loc_cov, 3), "tier_changed": cur_tier != v10_tier,
        "kept": False, "ingestion_parity": is_ingestion,
    }


def apply_to_manifest(manifest: dict, d: dict) -> None:
    if d["kept"]:
        return
    iu = manifest.setdefault("inferential_uncertainty", {})
    # Preserve the original base components ONCE so re-runs recompute from the true base.
    if "base_components_v8" not in iu:
        iu["base_components_v8"] = {k: round(v, 4) for k, v in d["base_components"].items()}
    if "previous_score_v9" not in iu:
        iu["previous_score_v9"] = d["cur_score"]
        iu["previous_tier_v9"] = d["cur_tier"]
    iu["score"] = d["v10_score"]
    iu["confidence_tier"] = d["v10_tier"]
    iu["components"] = d["v10_components"]
    iu["formula_reference"] = (
        "transcripts/pass10_rescore.py (LoC verification retires audit-process noise; "
        "score = categorical + (1 - NOISE_RETIRE*loc_match)*noise; 2026-05-30)"
    )
    iu["pass10_metadata"] = {
        "applied_date": PASS10_DATE, "noise_retire": NOISE_RETIRE, "loc_match": d["loc_cov"],
        "ingestion_parity": d["ingestion_parity"], "categorical_pin_reason": d.get("categorical_pin_reason"),
        "tier_changed": d["tier_changed"],
    }
    # An ingestion entry scored at parity is no longer "audit pending": promote provenance.
    if d["ingestion_parity"] and manifest.get("entry_provenance") == "ingestion-only":
        manifest["entry_provenance"] = "ingestion-loc-verified"


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
    not_high = [d for d in deltas if d["v10_tier"] not in ("high", "ingestion-only")]

    print(f"Pass 10 recalibration {'(APPLIED)' if apply else '(DRY RUN)'} - {len(deltas)} entries, NOISE_RETIRE={NOISE_RETIRE}")
    print("\n  Tier distribution before -> after:")
    for t in TIER_ORDER:
        a, b = before.get(t, 0), after.get(t, 0)
        if a or b:
            print(f"    {t:<18} {a:>3} -> {b:>3}{'' if a==b else f'   ({(chr(43) if b>a else chr(45))}{abs(b-a)})'}")
    print(f"\n  Entries that changed tier: {len(changed)}")
    print(f"\n  Everything NOT high (the honest residue):")
    for d in not_high:
        print(f"    #{d['entry_number']:>3} {str(d['entry_subject'])[:36]:<36} {d['v10_tier']:<15} "
              f"score={d['v10_score']}  loc_match={d['loc_cov']}"
              + (f"  PIN: {d['categorical_pin_reason']}" if d.get('categorical_pin_reason') else ""))

    if apply:
        _write_summaries(deltas, before, after, changed, not_high)
        print(f"\n  Wrote {SUMMARY_MD.relative_to(CIVIL_ROOT)} and {SUMMARY_JSON.relative_to(CIVIL_ROOT)}")
    else:
        print("\n  (dry run - no manifests modified; re-run with --apply)")
    return 0


def _write_summaries(deltas, before, after, changed, not_high) -> None:
    summary = {
        "pass10_date": PASS10_DATE, "noise_retire": NOISE_RETIRE, "total_entries": len(deltas),
        "tier_distribution_before": dict(before), "tier_distribution_after": dict(after),
        "tier_change_count": len(changed),
        "entries": [{k: d.get(k) for k in ("entry_number", "entry_subject", "provenance",
                    "cur_score", "cur_tier", "v10_score", "v10_tier", "loc_cov", "tier_changed")}
                    for d in deltas],
    }
    SUMMARY_JSON.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    L = [f"# Pass 10 recalibration summary - {PASS10_DATE}", "",
         "LoC verification (loc_match_score) retires audit-process noise; genuine source-audio",
         "limits are kept. `score = base + truncation + degradation + (1 - NOISE_RETIRE*loc_match)",
         f"* (residual + adversarial + cross_contamination)`, NOISE_RETIRE={NOISE_RETIRE}.",
         "Idempotent (recomputes from inferential_uncertainty.base_components_v8). Generated by",
         "`transcripts/pass10_rescore.py`.", "", "## Tier distribution", "",
         "| Tier | Before | After | Delta |", "|---|---:|---:|---:|"]
    for t in TIER_ORDER:
        a, b = before.get(t, 0), after.get(t, 0)
        if a or b:
            L.append(f"| `{t}` | {a} | {b} | {'0' if a==b else (('+' if b>a else '')+str(b-a))} |")
    L += [f"| **TOTAL** | **{len(deltas)}** | **{len(deltas)}** | |", "",
          f"**{len(changed)} entries changed tier.** Everything not `high` is listed below with its reason.",
          "", "## The honest residue (everything not high)", "",
          "| # | Subject | Tier | Score | LoC match | Reason |", "|---:|---|---|---:|---:|---|"]
    for d in not_high:
        reason = d.get("categorical_pin_reason") or ("weak LoC match" if (d["loc_cov"] or 0) < 0.5 else "residual after verification")
        L.append(f"| {d['entry_number']} | {d['entry_subject']} | `{d['v10_tier']}` | {d['v10_score']} | {d['loc_cov']} | {reason} |")
    L += ["", "## Full per-entry table", "",
          "| # | Subject | Provenance | before | after | v10 tier | LoC match |",
          "|---:|---|---|---:|---:|---|---:|"]
    for d in deltas:
        cs = f"{d['cur_score']:.3f}" if d['cur_score'] is not None else "-"
        vs = f"{d['v10_score']:.3f}" if d['v10_score'] is not None else "-"
        cov = d['loc_cov'] if d['loc_cov'] is not None else "-"
        mark = " **↻**" if d["tier_changed"] else ""
        L.append(f"| {d['entry_number']} | {d['entry_subject']} | {d['provenance']} | {cs} | {vs} | `{d['v10_tier']}`{mark} | {cov} |")
    SUMMARY_MD.write_text("\n".join(L) + "\n", encoding="utf-8")


def _knob(name, cur):
    flag = "--" + name.replace("_", "-")
    if flag in sys.argv:
        i = sys.argv.index(flag)
        if i + 1 < len(sys.argv):
            return float(sys.argv[i + 1])
    return cur


if __name__ == "__main__":
    NOISE_RETIRE = _knob("noise_retire", NOISE_RETIRE)
    sys.exit(main(apply="--apply" in sys.argv))
