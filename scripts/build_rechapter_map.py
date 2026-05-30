"""
Build a mapping from CRHP entry_number to its source files for the
2026-05-30 re-chapterization pass:
  - the corrected .srt (cue-level timestamps to re-segment from)
  - the existing pipeline_output entry_N.json (chapters[] to replace,
    other fields to preserve)

Output: scripts/rechapter_map.json (a list of records, sorted by entry_number).
This is a throwaway orchestration artifact (gitignored region), not shipped data.

Mapping strategy:
  1. Walk transcripts/corrected/*/manifest.json. Each manifest carries
     entry_number + entry_subject. The .srt lives in the same dir.
  2. Match to public/rag/summaries/pipeline_output/entry_<N>.json by number.
  3. Records with an .srt but no pipeline_output json are the 9 new
     2026-05-25 interviews (flagged needs_build=True).
"""
import json
import os
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORRECTED = os.path.join(ROOT, "transcripts", "corrected")
PIPELINE = os.path.join(ROOT, "public", "rag", "summaries", "pipeline_output")

records = []
no_manifest = []
for manifest_path in glob.glob(os.path.join(CORRECTED, "*", "manifest.json")):
    d = os.path.dirname(manifest_path)
    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            man = json.load(f)
    except Exception as e:
        no_manifest.append((d, str(e)))
        continue
    entry_number = man.get("entry_number")
    subject = man.get("entry_subject") or man.get("interview_name")
    srts = glob.glob(os.path.join(d, "*.srt"))
    srt = srts[0] if srts else None
    json_path = os.path.join(PIPELINE, "entry_%s.json" % entry_number) if entry_number is not None else None
    has_json = bool(json_path and os.path.exists(json_path))
    records.append({
        "entry_number": entry_number,
        "subject": subject,
        "dir": os.path.relpath(d, ROOT).replace("\\", "/"),
        "srt": os.path.relpath(srt, ROOT).replace("\\", "/") if srt else None,
        "json": os.path.relpath(json_path, ROOT).replace("\\", "/") if json_path else None,
        "has_pipeline_json": has_json,
        "provenance": man.get("entry_provenance"),
    })

records.sort(key=lambda r: (r["entry_number"] is None, r["entry_number"] or 0))
out = os.path.join(ROOT, "scripts", "rechapter_map.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(records, f, indent=2, ensure_ascii=False)

total = len(records)
with_json = sum(1 for r in records if r["has_pipeline_json"])
without_json = sum(1 for r in records if not r["has_pipeline_json"])
no_srt = sum(1 for r in records if not r["srt"])
print("records: %d" % total)
print("with pipeline_output json: %d" % with_json)
print("without pipeline_output json (the 9 new): %d" % without_json)
print("missing .srt: %d" % no_srt)
print("manifests unreadable: %d" % len(no_manifest))
print("--- entries without pipeline json ---")
for r in records:
    if not r["has_pipeline_json"]:
        print("  #%s  %s  srt=%s" % (r["entry_number"], r["subject"], bool(r["srt"])))
print("wrote: %s" % os.path.relpath(out, ROOT))
