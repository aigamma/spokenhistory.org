"""
Direct-resolve mode for the LoC resolver. Used to recover entries the original
resolver missed due to title-match strictness (e.g., LoC items titled
"Linda Fuller Degelmann interview" instead of "...oral history interview") or
spelling discrepancies between our directory name and LoC's catalog form (e.g.,
LoC "Newson" vs our "Newsom").

Given an explicit LoC item URL and one of our entry directory names, fetch the
item's JSON, find the transcript XML or PDF, download + cache + extract, then
write a resolution.json with status=ok or status=ok_pdf so the standard
heal_one pipeline picks it up.

Usage:
  python resolve_by_item_url.py --subject "Booker and Newsom" --item-url https://www.loc.gov/item/2015669130/
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
            time.sleep(2 ** attempt)
    raise RuntimeError(f"GET {url} failed after {retries} retries: {last_err}")


def _extract_resource_urls(item_data: dict) -> dict:
    """Pull both XML (fulltext) and PDF URLs from an item's resources list."""
    out = {"xml_url": None, "pdf_url": None, "resource_url": None}
    resources = item_data.get("resources") or []
    for r in resources:
        if not isinstance(r, dict):
            continue
        ft = r.get("fulltext")
        if isinstance(ft, str) and ft.endswith(".xml"):
            out["xml_url"] = ft
            out["pdf_url"] = r.get("pdf") or out["pdf_url"]
            out["resource_url"] = r.get("url") or out["resource_url"]
            continue
        caption = (r.get("caption") or "").lower()
        if "transcript" in caption and r.get("pdf"):
            out["pdf_url"] = r.get("pdf")
            out["resource_url"] = out["resource_url"] or r.get("url")
    return out


def resolve(subject: str, item_url: str) -> dict:
    subj_safe = re.sub(r"[^A-Za-z0-9_]+", "_", subject)
    item_json_url = item_url.rstrip("/") + "/?fo=json"
    print(f"[{subject}] item_url={item_url}")

    time.sleep(REQUEST_DELAY_S)
    body = _http_get(item_json_url)
    item_data = json.loads(body.decode("utf-8"))

    resources = _extract_resource_urls(item_data)
    print(f"  xml: {resources['xml_url']}")
    print(f"  pdf: {resources['pdf_url']}")

    title = ((item_data.get("item") or {}).get("title")
             or item_data.get("title") or "")
    contributors = ((item_data.get("item") or {}).get("contributor_names")
                    or item_data.get("contributor_names") or [])

    # Load existing resolution.json (if any) so we preserve other fields
    res_path = LOC_CACHE / f"{subj_safe}.resolution.json"
    if res_path.is_file():
        record = json.loads(res_path.read_text(encoding="utf-8"))
    else:
        record = {"subject": subject, "subject_safe": subj_safe, "candidates": []}
    record["best_match"] = {
        "score": 1.0,
        "id": item_url,
        "title": title[:160],
        "contributor": contributors,
        "url": item_url,
    }
    record["match_score"] = 1.0
    record["loc_item_url"] = item_url
    record["ambiguous"] = False
    record["manual_direct_resolve"] = True

    # Prefer XML; fall back to PDF
    if resources["xml_url"]:
        out_xml = LOC_CACHE / f"{subj_safe}.xml"
        time.sleep(REQUEST_DELAY_S)
        out_xml.write_bytes(_http_get(resources["xml_url"]))
        record["status"] = "ok"
        record["loc_xml_url"] = resources["xml_url"]
        record["loc_xml_path"] = f"loc_cache/{subj_safe}.xml"
        record["loc_xml_bytes"] = out_xml.stat().st_size
        record["loc_pdf_url"] = resources.get("pdf_url")
        print(f"  -> ok (XML, {out_xml.stat().st_size} bytes)")
    elif resources["pdf_url"]:
        out_pdf = LOC_CACHE / f"{subj_safe}.pdf"
        out_pdf_txt = LOC_CACHE / f"{subj_safe}.pdf.txt"
        time.sleep(REQUEST_DELAY_S)
        out_pdf.write_bytes(_http_get(resources["pdf_url"]))
        reader = pypdf.PdfReader(str(out_pdf))
        text = "\n\n".join(p.extract_text() for p in reader.pages)
        out_pdf_txt.write_text(text, encoding="utf-8")
        record["status"] = "ok_pdf"
        record["loc_pdf_url"] = resources["pdf_url"]
        record["loc_pdf_path"] = f"loc_cache/{subj_safe}.pdf"
        record["loc_pdf_txt_path"] = f"loc_cache/{subj_safe}.pdf.txt"
        record["loc_pdf_page_count"] = len(reader.pages)
        record["loc_pdf_word_count"] = len(text.split())
        print(f"  -> ok_pdf ({len(reader.pages)} pages, {len(text.split())} words)")
    else:
        record["status"] = "no_transcript_in_resources"
        print(f"  -> no transcript in resources")

    res_path.write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")
    return record


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--subject", required=True)
    parser.add_argument("--item-url", required=True)
    args = parser.parse_args(argv)
    resolve(args.subject, args.item_url)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
