"""
PDF fallback resolver — for each entry that resolve_loc_items.py marked
``no_transcript`` (because the LoC item has no TEI2 XML transcript), probe the
item's resource list for a transcript PDF, download it, and extract text via
pypdf. Saves a parallel cache to loc_cache:

  loc_cache/<subject>.pdf       -- the original downloaded PDF
  loc_cache/<subject>.pdf.txt   -- the extracted plain text

Also updates the entry's resolution.json with:
  status: ok_pdf  -- PDF cached and text extracted
  status: audio_only -- LoC item has no transcript PDF (only audio + metadata)
  loc_pdf_url, loc_pdf_path, loc_pdf_txt_path, loc_pdf_word_count

Polite-delayed (1.5s between LoC requests) per the LINEAR-LoC-API rule.

Usage:
  python resolve_pdf_fallback.py             # process all no_transcript entries
  python resolve_pdf_fallback.py --only "Betty Garman Robinson"
  python resolve_pdf_fallback.py --refresh   # re-download even if cached
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

import pypdf

ROOT = Path(__file__).resolve().parents[2]
LOC_CACHE = ROOT / "transcripts" / "loc_healing" / "loc_cache"
USER_AGENT = "Mozilla/5.0 (civil-rights-history-rescue; contact eric@aigamma.com)"
REQUEST_DELAY_S = 1.5


def _http_get(url: str, retries: int = 3) -> bytes:
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read()
        except Exception as e:  # noqa: BLE001
            last_err = e
            sleep_for = 2 ** attempt
            print(f"  HTTP attempt {attempt+1}/{retries} failed: {e}; sleeping {sleep_for}s", file=sys.stderr)
            time.sleep(sleep_for)
    raise RuntimeError(f"GET {url} failed after {retries} retries: {last_err}")


def _extract_pdf_from_item(item_data: dict) -> tuple[str | None, str | None]:
    """Return (pdf_url, resource_url) for the transcript PDF, or (None, None).

    LoC's item JSON has a top-level `resources` array. The transcript resource
    usually has `caption: '1 transcript'` and a `pdf` URL. We pick the FIRST
    resource whose caption mentions 'transcript' and which has a non-null pdf.
    """
    resources = item_data.get("resources") or []
    # First pass: look for caption matching 'transcript'
    for r in resources:
        if not isinstance(r, dict):
            continue
        caption = (r.get("caption") or "").lower()
        if "transcript" in caption and r.get("pdf"):
            return r.get("pdf"), r.get("url")
    # Fallback: any resource with a pdf field
    for r in resources:
        if isinstance(r, dict) and r.get("pdf"):
            return r.get("pdf"), r.get("url")
    return None, None


def _extract_text_from_pdf(pdf_path: Path) -> str:
    """Run pypdf to extract all page text. Joins pages with double-newline."""
    reader = pypdf.PdfReader(str(pdf_path))
    parts = []
    for page in reader.pages:
        try:
            parts.append(page.extract_text())
        except Exception as e:  # noqa: BLE001
            print(f"  page extract failed: {e}", file=sys.stderr)
    return "\n\n".join(parts)


def process_one(resolution_path: Path, refresh: bool = False) -> dict:
    resolution = json.loads(resolution_path.read_text(encoding="utf-8"))
    subj = resolution["subject"]
    safe = resolution["subject_safe"]
    print(f"[{subj}]")

    item_url = (resolution.get("best_match") or {}).get("url") or (resolution.get("candidates") or [{}])[0].get("url")
    if not item_url:
        resolution["status"] = "no_item_url"
        resolution_path.write_text(json.dumps(resolution, indent=2), encoding="utf-8")
        print(f"  -> no item URL in resolution")
        return resolution
    item_json_url = item_url.rstrip("/") + "/?fo=json"

    pdf_out = LOC_CACHE / f"{safe}.pdf"
    pdf_txt_out = LOC_CACHE / f"{safe}.pdf.txt"

    # Skip if already cached and not refreshing
    if not refresh and pdf_txt_out.is_file() and pdf_out.is_file():
        resolution.setdefault("loc_pdf_path", str(pdf_out.relative_to(LOC_CACHE.parent.parent / "transcripts")))
        resolution.setdefault("loc_pdf_txt_path", str(pdf_txt_out.relative_to(LOC_CACHE.parent.parent / "transcripts")))
        resolution["status"] = "ok_pdf"
        resolution_path.write_text(json.dumps(resolution, indent=2), encoding="utf-8")
        print(f"  -> cached, status=ok_pdf, txt={pdf_txt_out.stat().st_size} bytes")
        return resolution

    # Fetch item JSON
    time.sleep(REQUEST_DELAY_S)
    try:
        body = _http_get(item_json_url)
        item_data = json.loads(body.decode("utf-8"))
    except Exception as e:  # noqa: BLE001
        resolution["status"] = "item_fetch_failed"
        resolution["item_fetch_error"] = str(e)
        resolution_path.write_text(json.dumps(resolution, indent=2), encoding="utf-8")
        print(f"  -> item fetch failed: {e}")
        return resolution

    # Find PDF in resources
    pdf_url, resource_url = _extract_pdf_from_item(item_data)
    if not pdf_url:
        resolution["status"] = "audio_only"
        resolution_path.write_text(json.dumps(resolution, indent=2), encoding="utf-8")
        print(f"  -> AUDIO-ONLY (no transcript PDF in resources)")
        return resolution

    # Download PDF
    time.sleep(REQUEST_DELAY_S)
    try:
        body = _http_get(pdf_url)
        pdf_out.write_bytes(body)
    except Exception as e:  # noqa: BLE001
        resolution["status"] = "pdf_fetch_failed"
        resolution["loc_pdf_url"] = pdf_url
        resolution["pdf_fetch_error"] = str(e)
        resolution_path.write_text(json.dumps(resolution, indent=2), encoding="utf-8")
        print(f"  -> PDF fetch failed: {e}")
        return resolution

    # Extract text
    try:
        text = _extract_text_from_pdf(pdf_out)
    except Exception as e:  # noqa: BLE001
        resolution["status"] = "pdf_extract_failed"
        resolution["loc_pdf_url"] = pdf_url
        resolution["pdf_extract_error"] = str(e)
        resolution_path.write_text(json.dumps(resolution, indent=2), encoding="utf-8")
        print(f"  -> PDF extract failed: {e}")
        return resolution

    word_count = len(text.split())
    page_count = len(pypdf.PdfReader(str(pdf_out)).pages)
    pdf_txt_out.write_text(text, encoding="utf-8")
    resolution["status"] = "ok_pdf"
    resolution["loc_pdf_url"] = pdf_url
    resolution["loc_pdf_resource_url"] = resource_url
    resolution["loc_pdf_path"] = f"loc_cache/{safe}.pdf"
    resolution["loc_pdf_txt_path"] = f"loc_cache/{safe}.pdf.txt"
    resolution["loc_pdf_word_count"] = word_count
    resolution["loc_pdf_page_count"] = page_count
    resolution_path.write_text(json.dumps(resolution, indent=2), encoding="utf-8")
    print(f"  -> ok_pdf, {page_count} pages, {word_count} words")
    return resolution


def list_no_transcript_entries() -> list[Path]:
    """List resolution.json files for entries that need a PDF fallback."""
    targets = []
    for p in sorted(LOC_CACHE.glob("*.resolution.json")):
        try:
            r = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        if r.get("status") == "no_transcript":
            targets.append(p)
    return targets


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", type=str, default=None, help="case-insensitive substring of subject to filter to")
    parser.add_argument("--refresh", action="store_true")
    args = parser.parse_args(argv)

    targets = list_no_transcript_entries()
    if args.only:
        targets = [t for t in targets if args.only.lower() in t.stem.lower()]
    print(f"Processing {len(targets)} no_transcript entries via PDF fallback...")
    summary = {"ok_pdf": 0, "audio_only": 0, "pdf_fetch_failed": 0, "pdf_extract_failed": 0,
               "item_fetch_failed": 0, "no_item_url": 0}
    audio_only_list = []
    for i, p in enumerate(targets, 1):
        print(f"[{i}/{len(targets)}]", end=" ")
        rec = process_one(p, refresh=args.refresh)
        status = rec.get("status", "unknown")
        summary[status] = summary.get(status, 0) + 1
        if status == "audio_only":
            audio_only_list.append(rec.get("subject"))

    print()
    print("=== PDF fallback summary ===")
    for k, v in summary.items():
        print(f"  {k}: {v}")
    if audio_only_list:
        print()
        print("AUDIO-ONLY ENTRIES (no transcript on LoC side at all):")
        for s in audio_only_list:
            print(f"  - {s}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
