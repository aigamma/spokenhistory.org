"""
Build public/rag/playlist_index.json: a static, citation-grade clip index
derived from the per-interview chapters in pipeline_output. This is what
makes /playlist-builder work WITHOUT Firestore (which is empty): every
chapter becomes a playable clip (entry_number + start/end seconds), and the
React playlist filters this index by keyword / topic / entry / person.

Re-run after any re-chapterization pass to regenerate the clip set.

Output shape:
{
  "generated_note": "...",
  "clip_count": N,
  "videos": { "<entry>": { subject, tier, has_video, duration_seconds } },
  "clips": [
    { entry_number, subject, chapter_number, title, summary, keywords[],
      related_events[], topic_category, start_time, end_time,
      start_seconds, end_seconds, has_video }
  ],
  "topic_categories": { "<category>": clip_count, ... },
  "keywords": { "<keyword_lower>": clip_count, ... }   // top ~400
}
"""
import json, os, glob, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PIPELINE = os.path.join(ROOT, "public", "rag", "summaries", "pipeline_output")
OUT = os.path.join(ROOT, "public", "rag", "playlist_index.json")


def ts_to_seconds(ts):
    """'HH:MM:SS,mmm' or 'HH:MM:SS' -> int seconds."""
    if not ts or not isinstance(ts, str):
        return None
    t = ts.strip().split(",")[0]
    parts = t.split(":")
    try:
        parts = [int(p) for p in parts]
    except ValueError:
        return None
    while len(parts) < 3:
        parts.insert(0, 0)
    h, m, s = parts[-3], parts[-2], parts[-1]
    return h * 3600 + m * 60 + s


videos = {}
clips = []
topic_cat = collections.Counter()
kw_counter = collections.Counter()
no_video = []

for jf in sorted(glob.glob(os.path.join(PIPELINE, "entry_*.json")),
                 key=lambda p: int(os.path.basename(p).split("_")[1].split(".")[0])):
    entry = int(os.path.basename(jf).split("_")[1].split(".")[0])
    with open(jf, "r", encoding="utf-8") as f:
        d = json.load(f)
    subject = d.get("interview_name") or ("Entry #%d" % entry)
    tier = d.get("inferential_uncertainty_tier")
    lv = d.get("loc_video") or {}
    has_video = bool(lv.get("video_url") or lv.get("video_stream_url"))
    if not has_video:
        no_video.append((entry, subject))
    videos[str(entry)] = {
        "subject": subject,
        "tier": tier,
        "has_video": has_video,
        "duration_seconds": lv.get("duration_seconds"),
    }
    for ch in d.get("chapters", []) or []:
        ss = ts_to_seconds(ch.get("start_time"))
        es = ts_to_seconds(ch.get("end_time"))
        kws = ch.get("keywords") or []
        if isinstance(kws, str):
            kws = [k.strip() for k in kws.split(",") if k.strip()]
        cat = ch.get("main_topic_category") or ch.get("mainTopicCategory")
        if cat:
            topic_cat[cat] += 1
        for k in kws:
            kw_counter[str(k).lower()] += 1
        clips.append({
            "entry_number": entry,
            "subject": subject,
            "chapter_number": ch.get("chapter_number"),
            "title": ch.get("title"),
            "summary": ch.get("summary"),
            "keywords": kws,
            "related_events": ch.get("related_events") or [],
            "topic_category": cat,
            "start_time": ch.get("start_time"),
            "end_time": ch.get("end_time"),
            "start_seconds": ss,
            "end_seconds": es,
            "has_video": has_video,
        })

out = {
    "generated_note": "Derived from pipeline_output chapters. Re-run scripts/build_playlist_index.py after re-chapterization.",
    "clip_count": len(clips),
    "interview_count": len(videos),
    "videos": videos,
    "clips": clips,
    "topic_categories": dict(topic_cat.most_common()),
    "keywords": dict(kw_counter.most_common(400)),
}
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

size_mb = os.path.getsize(OUT) / 1e6
print("interviews:", len(videos))
print("clips:", len(clips))
print("interviews without playable loc_video:", len(no_video))
if no_video:
    print("  ", ", ".join("#%d %s" % (e, s) for e, s in no_video[:20]))
print("distinct topic_categories:", len(topic_cat))
print("top categories:", topic_cat.most_common(12))
print("output size: %.2f MB" % size_mb)
print("wrote:", os.path.relpath(OUT, ROOT))
