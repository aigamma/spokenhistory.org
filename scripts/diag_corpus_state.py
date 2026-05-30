"""Diagnostic: reconcile the true corpus count across all sources.
Read-only. Answers: how many interviews are in the frontend (constellation),
in pipeline_output, in people index; and the status of the 2026-05-25 batch
and the 4 no-entry-number dirs.
"""
import json, os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load(p):
    with open(os.path.join(ROOT, p), "r", encoding="utf-8") as f:
        return json.load(f)

# constellation
con = load("public/rag/constellation.json")
pts = con.get("points", [])
con_entries = sorted(p.get("entry_number") for p in pts if p.get("entry_number") is not None)
print("constellation points:", len(pts))
print("constellation entry_number range:", min(con_entries), "..", max(con_entries), "count:", len(con_entries))

# pipeline_output
pjs = glob.glob(os.path.join(ROOT, "public/rag/summaries/pipeline_output/entry_*.json"))
pnums = sorted(int(os.path.basename(p).split("_")[1].split(".")[0]) for p in pjs)
print("pipeline_output files:", len(pjs), "range", min(pnums), "..", max(pnums))
missing = [n for n in range(min(pnums), max(pnums)+1) if n not in pnums]
print("pipeline_output gaps:", missing)

# people index
idx = load("public/rag/people/index.json")
counts = idx.get("counts", {})
print("people index counts:", counts)
# interviewee entry_numbers present in people index
ppl = idx.get("by_slug", {})
ppl_entry_nums = set()
for slug, rec in ppl.items():
    if rec.get("person_type") == "interviewee" and rec.get("entry_number") is not None:
        ppl_entry_nums.add(rec.get("entry_number"))
print("interviewee person-pages with entry_number:", len(ppl_entry_nums))

# 2026-05-25 batch + the 4 no-json dirs: read manifests
print("\n=== 2026-05-25 batch + unprocessed dirs ===")
con_set = set(con_entries)
pnum_set = set(pnums)
for d in sorted(glob.glob(os.path.join(ROOT, "transcripts/corrected/*/manifest.json"))):
    man = json.load(open(d, "r", encoding="utf-8"))
    name = os.path.basename(os.path.dirname(d))
    en = man.get("entry_number")
    is2025 = "20260525" in name
    no_json = en is None or en not in pnum_set
    if is2025 or no_json:
        in_con = en in con_set if en is not None else False
        in_ppl = en in ppl_entry_nums if en is not None else False
        print("  %-58s entry=%s  in_pipeline=%s in_constellation=%s in_people=%s%s" % (
            name[:58], en, (en in pnum_set), in_con, in_ppl, "  [2026-05-25]" if is2025 else ""))

# how many interviewee person pages total (files)
ppl_files = [p for p in glob.glob(os.path.join(ROOT, "public/rag/people/*.json")) if not p.endswith("index.json")]
print("\nperson-page json files:", len(ppl_files))
