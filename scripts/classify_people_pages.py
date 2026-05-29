#!/usr/bin/env python3
"""One-off planning helper: classify every person page on four dimensions so the
Opus-4.8 rebuild + axis-correction sweep can be planned precisely.

Dimensions per page:
  built      -> has a non-empty interview_snippets[] array (snippet-enriched)
  flagged    -> ai_reading carries at least one reversed concept-axis pole label
  ptype      -> interviewee | external
  joint      -> slug looks like a joint interview ("-and-" in slug)

The actionable partition:
  built & flagged    -> correct axis labels NOW (cheap ~2 min agent, no re-enrich)
  !built & flagged   -> axes get fixed during full rebuild (do NOT correct now)
  !built & !flagged  -> still needs snippet enrichment (build)
  built & !flagged   -> done

Usage: python scripts/classify_people_pages.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PEOPLE = ROOT / "public" / "rag" / "people"
AXES = ROOT / "public" / "rag" / "summaries" / "concept_axes.json"

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
    ("northern struggle", "southern-northern", "b"),
    ("northern pole", "southern-northern", "b"),
    ("northern", "southern-northern", "b"),
    ("southern struggle", "southern-northern", "a"),
    ("southern pole", "southern-northern", "a"),
    ("southern", "southern-northern", "a"),
    ("collective discipline", "individual-collective", "b"),
    ("collective", "individual-collective", "b"),
    ("individual conscience", "individual-collective", "a"),
]
TOWARD = re.compile(r"toward (?:the )?([A-Za-z][\w\s/.'-]{2,45})")


def load_axis_positions():
    ca = json.loads(AXES.read_text(encoding="utf-8"))
    out = {}
    for ax in ca["axes"]:
        out[ax["slug"]] = {p.get("entry_number"): p.get("position_normalized") for p in ax["positions"]}
    return out


def is_flagged(ar, en, axpos):
    for m in TOWARD.finditer(ar or ""):
        phrase = m.group(1).lower()
        for kw, axis, pole in KEYWORDS:
            if kw in phrase:
                tv = axpos.get(axis, {}).get(en)
                if tv is None:
                    break
                if ("a" if tv >= 0 else "b") != pole:
                    return True
                break
    return False


def main():
    axpos = load_axis_positions()
    buckets = {"built_flagged": [], "unbuilt_flagged": [], "unbuilt_clean": [], "built_clean": []}
    joint = []
    external_unbuilt = []
    for f in sorted(PEOPLE.glob("*.json")):
        if f.name == "index.json":
            continue
        p = json.loads(f.read_text(encoding="utf-8"))
        en = p.get("entry_number")
        ar = p.get("ai_reading", "") or ""
        snips = p.get("interview_snippets") or []
        built = len(snips) > 0
        flagged = is_flagged(ar, en, axpos)
        ptype = p.get("person_type", "?")
        is_joint = "-and-" in f.stem
        key = ("built_" if built else "unbuilt_") + ("flagged" if flagged else "clean")
        buckets[key].append(f.stem)
        if is_joint:
            joint.append((f.stem, built, flagged))
        if ptype == "external" and not built:
            external_unbuilt.append(f.stem)

    for k in ("built_flagged", "unbuilt_flagged", "unbuilt_clean", "built_clean"):
        print(f"\n=== {k} ({len(buckets[k])}) ===")
        for s in buckets[k]:
            print(f"  {s}")
    print(f"\n--- joint-interview pages ({len(joint)}): (slug, built, flagged) ---")
    for s, b, fl in joint:
        print(f"  {s}  built={b} flagged={fl}")
    print(f"\n--- external & unbuilt ({len(external_unbuilt)}) ---")
    for s in external_unbuilt:
        print(f"  {s}")
    print(f"\nTOT:  built_flagged={len(buckets['built_flagged'])}  unbuilt_flagged={len(buckets['unbuilt_flagged'])}"
          f"  unbuilt_clean={len(buckets['unbuilt_clean'])}  built_clean={len(buckets['built_clean'])}")


if __name__ == "__main__":
    main()
