"""Fetch LoC video URLs for all 136 entries by hitting each item's
?fo=json endpoint linearly with 1.5s pacing.

Per memory feedback_linear_loc_api: LoC infrastructure is National
Archive level; aggressive parallel querying gets the IP banned.
Stay sequential, 1.5s/request, abort on 403/429.

Output: Metadata Generation System/output_subagent/loc_video_links.json
Shape: { "<entry_number>": { video_url, video_stream_url, poster_url, duration_seconds, caption }, ... }

Reads loc_item_url from each entry_N.json in output_subagent/.
"""
from __future__ import annotations
import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = REPO_ROOT / "Metadata Generation System" / "output_subagent"
RESULTS_FILE = OUTPUT_DIR / "loc_video_links.json"
DELAY_SECONDS = 1.5
USER_AGENT = "civil-rights-recovery-script eric@aigamma.com"


def fetch_loc_json(loc_url: str) -> dict | None:
    """Fetch the ?fo=json variant of a LoC item URL."""
    # Strip trailing slash, append ?fo=json
    if loc_url.endswith("/"):
        json_url = loc_url + "?fo=json"
    else:
        json_url = loc_url + "/?fo=json"
    req = urllib.request.Request(json_url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status in (403, 429):
                raise RuntimeError(f"LoC rate-limited: status {resp.status}")
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code in (403, 429):
            raise RuntimeError(f"LoC rate-limited or blocked: {e.code}") from e
        return None
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError):
        return None


def extract_video(loc_data: dict) -> dict | None:
    """Pull video URLs from the resources[0] block."""
    if not isinstance(loc_data, dict):
        return None
    resources = loc_data.get("resources") or []
    for r in resources:
        if not isinstance(r, dict):
            continue
        video = r.get("video")
        if not video:
            continue
        return {
            "video_url": video,
            "video_stream_url": r.get("video_stream"),
            "poster_url": r.get("poster"),
            "duration_seconds": r.get("duration"),
            "caption": r.get("caption"),
            "info_url": r.get("info"),
        }
    return None


def main() -> int:
    entries = []
    for p in sorted(OUTPUT_DIR.glob("entry_*.json")):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        n = data.get("entry_number")
        loc = data.get("loc_item_url")
        if not n or not loc:
            continue
        entries.append((n, loc, data.get("interview_name")))
    entries.sort()
    print(f"Found {len(entries)} entries with LoC URLs to fetch", file=sys.stderr)

    # Resume from existing results if present
    results: dict[str, dict] = {}
    if RESULTS_FILE.exists():
        try:
            existing = json.loads(RESULTS_FILE.read_text(encoding="utf-8"))
            if isinstance(existing, dict):
                results.update(existing)
                print(f"Resuming with {len(results)} previously-extracted entries", file=sys.stderr)
        except Exception:
            pass

    success = 0
    no_video = 0
    failed = 0
    skipped_resumed = 0

    for idx, (n, loc, name) in enumerate(entries, 1):
        key = str(n)
        if key in results and results[key].get("video_url"):
            skipped_resumed += 1
            continue
        print(f"  [{idx:>3}/{len(entries)}] #{n} {name[:50]} ... ", end="", flush=True, file=sys.stderr)
        try:
            loc_data = fetch_loc_json(loc)
        except RuntimeError as e:
            print(f"BLOCKED ({e})", file=sys.stderr)
            print("\n*** ABORTING, LoC blocked further requests. Resume later.", file=sys.stderr)
            break

        if not loc_data:
            print("fetch-failed", file=sys.stderr)
            results[key] = {"loc_item_url": loc, "error": "fetch-failed"}
            failed += 1
        else:
            v = extract_video(loc_data)
            if v:
                results[key] = {"loc_item_url": loc, "interview_name": name, **v}
                print(f"ok ({v.get('duration_seconds')}s)", file=sys.stderr)
                success += 1
            else:
                results[key] = {"loc_item_url": loc, "interview_name": name, "error": "no-video"}
                print("no-video", file=sys.stderr)
                no_video += 1

        # Save incrementally so a crash mid-run doesn't lose progress
        if idx % 10 == 0:
            RESULTS_FILE.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")

        time.sleep(DELAY_SECONDS)

    # Final save
    RESULTS_FILE.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nDone. success={success} no_video={no_video} failed={failed} resumed={skipped_resumed}", file=sys.stderr)
    print(f"Output: {RESULTS_FILE.relative_to(REPO_ROOT)}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
