#!/usr/bin/env python3
"""Audit gate: every concept-axis pole label in a person page's ai_reading
must match the actual sign of that page's position on the axis.

THE CONVENTION (proven empirically, not assumed). In
public/rag/summaries/concept_axes.json each axis lists pole_a first and
pole_b second, and position_normalized is oriented so that:

    position_normalized POSITIVE  -> pole_a   (the first-listed pole)
    position_normalized NEGATIVE  -> pole_b   (the second-listed pole)

uniformly across all five axes. Anchors that fix the orientation:
  * nonviolence-self-defense: the Black Panther cohort (Elmer Dixon -1.00,
    Elbert Howard -0.85, Kathleen Cleaver -0.80) sits at the negative end,
    which is therefore Armed Self-Defense (pole_b); Ralph Abernathy, a
    nonviolent minister, is at +0.91 = Nonviolence as Theology (pole_a).
  * sacred-secular: Abernathy +1.00 = Sacred (pole_a).
  * southern-northern: Michael D. McCarty (Chicago) +1.00 = Northern (pole_a).
    (Re-synced 2026-05-31: the precompute now makes Northern pole_a/positive,
    so positive = Northern Struggle, negative = Southern Struggle.)

So pole_a (POSITIVE) by axis:
  nonviolence-self-defense -> Nonviolence as Theology
  sacred-secular           -> Sacred / Theological Framing
  tactical-strategic       -> Tactical Pragmatism
  southern-northern        -> Northern Struggle
  individual-collective    -> Individual Conscience
and pole_b (NEGATIVE) is the opposite of each.

An earlier build pass (and the original older-engine pages) used the
OPPOSITE convention, so ai_reading axis-pole labels were reversed on ~79
pages. This script flags any "toward <pole>" claim whose pole contradicts
the page's actual signed position. Run it after writing/correcting any
ai_reading; exit code 1 if any mismatch remains.

Usage: python scripts/audit_axis_labels.py [slug ...]   (no args = all)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PEOPLE = ROOT / "public" / "rag" / "people"
AXES = ROOT / "public" / "rag" / "summaries" / "concept_axes.json"

# keyword (lowercased substring of a "toward ..." phrase) -> (axis slug, expected pole)
KEYWORDS = [
    ("armed self-defense", "nonviolence-self-defense", "b"),
    ("self-defense", "nonviolence-self-defense", "b"),
    ("self defense", "nonviolence-self-defense", "b"),
    ("nonviolence", "nonviolence-self-defense", "a"),
    ("secular", "sacred-secular", "b"),
    ("sacred", "sacred-secular", "a"),
    ("strategic vision", "tactical-strategic", "b"),
    ("strategic", "tactical-strategic", "b"),
    ("tactical pragmatism", "tactical-strategic", "a"),
    ("tactical", "tactical-strategic", "a"),
    ("northern struggle", "southern-northern", "a"),
    ("northern pole", "southern-northern", "a"),
    ("northern", "southern-northern", "a"),
    ("southern struggle", "southern-northern", "b"),
    ("southern pole", "southern-northern", "b"),
    ("southern", "southern-northern", "b"),
    ("collective discipline", "individual-collective", "b"),
    ("collective", "individual-collective", "b"),
    ("individual conscience", "individual-collective", "a"),
]

TOWARD = re.compile(r"toward (?:the )?([A-Za-z][\w\s/.'-]{2,45})")


def load_axis_positions():
    ca = json.loads(AXES.read_text(encoding="utf-8"))
    out = {}
    for ax in ca["axes"]:
        out[ax["slug"]] = {
            p.get("entry_number"): p.get("position_normalized") for p in ax["positions"]
        }
    return out


def main():
    targets = set(sys.argv[1:])
    axpos = load_axis_positions()
    pages = fails = 0
    flagged = {}
    for f in sorted(PEOPLE.glob("*.json")):
        if f.name == "index.json":
            continue
        if targets and f.stem not in targets:
            continue
        p = json.loads(f.read_text(encoding="utf-8"))
        en = p.get("entry_number")
        ar = p.get("ai_reading", "") or ""
        if not ar:
            continue
        pages += 1
        for m in TOWARD.finditer(ar):
            phrase = m.group(1).lower()
            for kw, axis, pole in KEYWORDS:
                if kw in phrase:
                    tv = axpos.get(axis, {}).get(en)
                    if tv is None:
                        break
                    true_pole = "a" if tv >= 0 else "b"
                    if true_pole != pole:
                        flagged.setdefault(f.stem, []).append(
                            f'"toward {m.group(1).strip()[:28]}" but {axis}={tv:+.2f} -> true pole {true_pole}'
                        )
                        fails += 1
                    break
    print(f"pages_with_ai_reading={pages} axis_label_mismatches={fails} pages_flagged={len(flagged)}")
    for slug, issues in sorted(flagged.items()):
        print(f"  {slug}: " + " ; ".join(issues))
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
