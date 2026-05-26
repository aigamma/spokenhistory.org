"""Merge loc_video_links.json into each entry_N.json under
Metadata Generation System/output_subagent/. Adds a top-level
"loc_video" field that pipeline-to-firestore.mjs reads.

Idempotent: re-running with no new LoC data leaves files unchanged.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = REPO_ROOT / "Metadata Generation System" / "output_subagent"
LINKS_FILE = OUTPUT_DIR / "loc_video_links.json"


def main() -> int:
    if not LINKS_FILE.exists():
        print(f"ERROR: {LINKS_FILE} not found. Run scripts/fetch-loc-videos.py first.", file=sys.stderr)
        return 1
    links = json.loads(LINKS_FILE.read_text(encoding="utf-8"))
    merged = 0
    skipped = 0
    no_data = 0
    for p in sorted(OUTPUT_DIR.glob("entry_*.json")):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"  SKIP {p}: {e}", file=sys.stderr)
            skipped += 1
            continue
        n = data.get("entry_number")
        if n is None:
            skipped += 1
            continue
        link_data = links.get(str(n))
        if not link_data or not link_data.get("video_url"):
            no_data += 1
            continue
        # Build the loc_video block
        loc_video = {
            "video_url": link_data.get("video_url"),
            "video_stream_url": link_data.get("video_stream_url"),
            "poster_url": link_data.get("poster_url"),
            "duration_seconds": link_data.get("duration_seconds"),
            "caption": link_data.get("caption"),
        }
        # Only rewrite if changed
        if data.get("loc_video") == loc_video:
            continue
        data["loc_video"] = loc_video
        p.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        merged += 1

    print(f"Merged loc_video into {merged} entries; {no_data} entries had no LoC video data; {skipped} skipped", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
