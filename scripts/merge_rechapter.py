"""
Validate and (with --apply) merge re-chapterization staging files into the
shipped pipeline output.

Re-chapterization subagents (or a workflow) write ONLY a new chapters array to
transcripts/rechapter_staging/entry_<N>.chapters.json. This script validates
each one and, with --apply, swaps it into public/rag/summaries/pipeline_output/
entry_<N>.json, replacing the `chapters` field and preserving every other field
(main_summary, loc_video, engagement_scores, tiers, etc.).

After --apply, ALWAYS re-run: python scripts/build_playlist_index.py
so the clip index tracks the new chapter boundaries.

Usage:
  python scripts/merge_rechapter.py            # dry-run: validate, report
  python scripts/merge_rechapter.py --apply    # validate + merge passing entries
"""
import json, os, glob, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STAGING = os.path.join(ROOT, "transcripts", "rechapter_staging")
PIPELINE = os.path.join(ROOT, "public", "rag", "summaries", "pipeline_output")
APPLY = "--apply" in sys.argv

REQUIRED = ["chapter_number", "title", "topic", "summary", "main_topic_category",
            "keywords", "related_events", "start_time", "end_time"]
CATEGORIES = {"Early Life", "Family History", "Education", "Geographic Context",
              "Religious Foundations", "Movement Entry", "Major Campaign",
              "Political Analysis", "Legal Work", "Post-Movement Career",
              "Personal Reflection", "Music & Culture"}


def secs(ts):
    if not ts or not isinstance(ts, str):
        return None
    t = ts.split(",")
    ms = int(t[1]) if len(t) > 1 and t[1].isdigit() else 0
    parts = t[0].split(":")
    try:
        parts = [int(p) for p in parts]
    except ValueError:
        return None
    while len(parts) < 3:
        parts.insert(0, 0)
    return parts[0] * 3600 + parts[1] * 60 + parts[2] + ms / 1000.0


def validate(chapters):
    errs, warns = [], []
    if not isinstance(chapters, list) or not chapters:
        return ["not a non-empty JSON array"], [], []
    prev_end = None
    durs = []
    for i, ch in enumerate(chapters):
        for f in REQUIRED:
            if f not in ch:
                errs.append("chapter %d missing field %s" % (i + 1, f))
        if ch.get("chapter_number") != i + 1:
            warns.append("chapter index %d has chapter_number %s" % (i + 1, ch.get("chapter_number")))
        cat = ch.get("main_topic_category")
        if cat and cat not in CATEGORIES:
            warns.append("chapter %d category not in allowed set: %s" % (i + 1, cat))
        if "—" in json.dumps(ch, ensure_ascii=False):
            errs.append("chapter %d contains an em dash" % (i + 1))
        s, e = secs(ch.get("start_time")), secs(ch.get("end_time"))
        if s is None or e is None:
            errs.append("chapter %d has unparseable timestamps" % (i + 1))
            continue
        if e <= s:
            errs.append("chapter %d end <= start" % (i + 1))
        else:
            durs.append((e - s) / 60.0)
        if prev_end is not None and abs(s - prev_end) > 1.0:
            warns.append("gap/overlap before chapter %d (%.1fs)" % (i + 1, s - prev_end))
        prev_end = e
    return errs, warns, durs


def main():
    files = sorted(glob.glob(os.path.join(STAGING, "entry_*.chapters.json")))
    if not files:
        print("no staging files in", os.path.relpath(STAGING, ROOT))
        return
    applied = 0
    for sf in files:
        n = os.path.basename(sf).split("_")[1].split(".")[0]
        try:
            chapters = json.load(open(sf, encoding="utf-8"))
        except Exception as ex:
            print("entry %s: INVALID JSON (%s)" % (n, ex))
            continue
        errs, warns, durs = validate(chapters)
        avg = sum(durs) / len(durs) if durs else 0
        mx = max(durs) if durs else 0
        status = "FAIL" if errs else "OK"
        print("entry %s: %s  %d chapters  avg %.1f min  max %.1f min  errs=%d warns=%d"
              % (n, status, len(chapters), avg, mx, len(errs), len(warns)))
        for e in errs[:6]:
            print("   ERROR:", e)
        for w in warns[:4]:
            print("   warn:", w)
        if APPLY and not errs:
            target = os.path.join(PIPELINE, "entry_%s.json" % n)
            if not os.path.exists(target):
                print("   (no shipped entry_%s.json to merge into; skipped)" % n)
                continue
            doc = json.load(open(target, encoding="utf-8"))
            doc["chapters"] = chapters
            json.dump(doc, open(target, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
            applied += 1
            print("   APPLIED -> %s" % os.path.relpath(target, ROOT))
    if APPLY:
        print("\napplied %d entries. NOW RUN: python scripts/build_playlist_index.py" % applied)
    else:
        print("\ndry-run only. Re-run with --apply to merge the OK entries.")


if __name__ == "__main__":
    main()
