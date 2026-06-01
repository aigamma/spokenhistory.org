"""Build public/rag/summaries/_entry_list.json: the per-entry roster that the
agentic-summary and influence precomputes read.

`_entry_list.json` is a flat array, one row per on-site interview:
  { entry_number, entry_subject, dir, txt, loc_url, tier, provenance }

It is consumed by:
  - rag/summarize.mjs (capsule regeneration reads `dir` + `txt` to sample the
    corrected transcript, and `entry_subject` / `tier` / `loc_url` for the prompt)
  - rag/precompute_influence.py (the speaker roster for the who-discusses-whom graph)

This file is gitignored (a derived intermediate), and for a long time it had no
committed builder: it was produced once by an ad hoc step during the original
2026-05-26 build and then went stale as the corpus grew (it stopped at entry 138
while the corpus reached 142). This script makes it reproducible and keeps it in
lockstep with the corpus, so the onboarding pipeline and any manual rebuild emit
a current roster every time.

Sources (newest-wins, all already maintained by onboarding):
  - public/rag/summaries/pipeline_output/entry_<N>.json is the authoritative set
    of on-site interviews (same universe build_toc.py walks). It supplies
    entry_subject (interview_name), tier (inferential_uncertainty_tier),
    provenance (entry_provenance), and loc_url (loc_item_url).
  - transcripts/corrected/<dir>/manifest.json supplies `dir` and the `.txt`
    transcript filename, keyed by entry_number (every corrected manifest carries
    one). The manifest's loc_healing.loc_item_url is a fallback for loc_url.

Usage: python scripts/build_entry_list.py
Re-run after onboarding a new interview or re-running the pipeline; it is
deterministic and idempotent (same corpus in, same file out).
"""
import json
import glob
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PIPE = os.path.join(ROOT, "public", "rag", "summaries", "pipeline_output")
CORRECTED = os.path.join(ROOT, "transcripts", "corrected")
OUT = os.path.join(ROOT, "public", "rag", "summaries", "_entry_list.json")


def manifest_index():
    """Map entry_number -> (dir_name, txt_filename, loc_item_url) from corrected manifests.

    Keyed by entry_number because every corrected manifest carries one. The .txt
    is taken from files_processed (the bootstrap records all copied files there);
    we fall back to the first *.txt actually present in the directory."""
    by_entry = {}
    for man_path in glob.glob(os.path.join(CORRECTED, "*", "manifest.json")):
        try:
            man = json.load(open(man_path, encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        n = man.get("entry_number")
        if n is None:
            continue
        dir_name = os.path.basename(os.path.dirname(man_path))
        txt = None
        for f in man.get("files_processed") or []:
            if str(f).lower().endswith(".txt"):
                txt = f
                break
        if not txt:
            for f in sorted(os.listdir(os.path.join(CORRECTED, dir_name))):
                if f.lower().endswith(".txt"):
                    txt = f
                    break
        loc_url = (man.get("loc_healing") or {}).get("loc_item_url")
        by_entry[int(n)] = (dir_name, txt, loc_url)
    return by_entry


def main():
    by_entry = manifest_index()
    rows = []
    for pipe_path in glob.glob(os.path.join(PIPE, "entry_*.json")):
        m = re.search(r"entry_(\d+)\.json$", os.path.basename(pipe_path))
        if not m:
            continue
        n = int(m.group(1))
        try:
            pipe = json.load(open(pipe_path, encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        dir_name, txt, man_loc = by_entry.get(n, (None, None, None))
        rows.append({
            "entry_number": n,
            "entry_subject": pipe.get("interview_name") or f"Entry #{n}",
            "dir": dir_name,
            "txt": txt,
            "loc_url": pipe.get("loc_item_url") or man_loc,
            "tier": pipe.get("inferential_uncertainty_tier") or "ingestion-only",
            "provenance": pipe.get("entry_provenance") or "ingestion-only",
        })

    rows.sort(key=lambda r: r["entry_number"])
    json.dump(rows, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    no_dir = [r["entry_number"] for r in rows if not r["dir"]]
    no_txt = [r["entry_number"] for r in rows if not r["txt"]]
    print(f"wrote {os.path.relpath(OUT, ROOT)}: {len(rows)} entries")
    if no_dir:
        print(f"  WARN {len(no_dir)} entries have no corrected/ dir (capsule regen will skip): {no_dir[:10]}")
    if no_txt:
        print(f"  WARN {len(no_txt)} entries have no .txt transcript: {no_txt[:10]}")


if __name__ == "__main__":
    main()
