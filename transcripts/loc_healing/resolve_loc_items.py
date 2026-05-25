"""
Resolve civil-rights interview directories to LoC items + cache transcript XML.

For each directory under transcripts/corrected/, this script:
  1. Parses the interviewee name from the directory prefix.
  2. Queries the LoC search API (loc.gov/collections/civil-rights-history-project/?fo=json&q=<name>).
  3. Selects the best-matching item by exact name match on the description, contributor list, or title.
  4. Pulls the transcript XML URL from the chosen item's resources[0].fulltext (which is itself a URL to .xml on tile.loc.gov).
  5. Downloads the XML into loc_cache/<entry>.xml.
  6. Writes a per-entry resolution record into loc_cache/<entry>.resolution.json with the chosen item ID,
     URL, transcript URL, similarity score, and any ambiguity flags.
  7. Writes loc_cache/_index.json — the global coverage report (matched / ambiguous / unmatched / no_transcript).

This is the LoC pull half of the pipeline. It is deterministic; no model in the loop.
Rate-limits to one request per 1.5s to be polite (LoC public API does not require auth but throttles).

Usage:
  python resolve_loc_items.py                # process all 127 corrected/
  python resolve_loc_items.py --limit 5      # process first 5 for smoke-testing
  python resolve_loc_items.py --only "Aaron Dixon"  # single subject
  python resolve_loc_items.py --refresh      # re-fetch even if cache present
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CORRECTED_DIR = ROOT.parent / "corrected"
LOC_CACHE = ROOT / "loc_cache"
LOC_CACHE.mkdir(exist_ok=True)

USER_AGENT = "Mozilla/5.0 (civil-rights-history-rescue; contact eric@aigamma.com)"
COLLECTION_SEARCH = "https://www.loc.gov/collections/civil-rights-history-project/?fo=json&q={q}&c=50"
REQUEST_DELAY_S = 1.5  # be polite to LoC


def _http_get(url: str, retries: int = 3) -> bytes:
    """GET with custom UA + retry on transient failure."""
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read()
        except Exception as e:  # noqa: BLE001
            last_err = e
            sleep_for = 2 ** attempt
            print(f"  HTTP attempt {attempt+1}/{retries} failed: {e}; sleeping {sleep_for}s", file=sys.stderr)
            time.sleep(sleep_for)
    raise RuntimeError(f"GET {url} failed after {retries} retries: {last_err}")


def parse_subject(dirname: str) -> str:
    """'Aaron Dixon_interview_20250704_170306' -> 'Aaron Dixon'."""
    m = re.match(r"^(.*?)_interview_\d{8}_\d{6}$", dirname)
    if not m:
        raise ValueError(f"Cannot parse subject from {dirname!r}")
    return m.group(1)


def _normalize_for_match(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _extract_last_first_tokens(subject: str) -> list[tuple[str, str]]:
    """For a subject like 'Audrey Nell Hamilton and JoeAnn Anderson Ulmer' return
    [('hamilton','audrey'), ('ulmer','joeann')] -- a list of (last, first) pairs
    suitable for matching against LoC's 'lastname, firstname' contributor strings."""
    parts = [p.strip() for p in re.split(r"\s+and\s+", subject)]
    out = []
    for p in parts:
        tokens = p.split()
        if len(tokens) < 2:
            continue
        first = _normalize_for_match(tokens[0])
        last = _normalize_for_match(tokens[-1])
        out.append((last, first))
    return out


def _score_candidate(subject: str, result: dict) -> float:
    """Return a similarity score in [0,1] for how well a LoC search result matches `subject`.

    Heuristic:
      * Only "interview" items count; collection landing pages, articles, indexes return 0.
      * Strong match: title is "<subject> oral history interview ...".
      * Strong match: every (last, first) pair from the subject appears as a SAME contributor string
        ("dixon, aaron"). This is what distinguishes Aaron Dixon from his brother Elmer Dixon.
      * Weak match: only last name appears.
    """
    url = (result.get("url") or "") + " " + " ".join(result.get("aka") or [])
    if "/item/" not in url:
        return 0.0  # collection pages, about pages, articles, etc.

    title = _normalize_for_match(result.get("title") or "")
    if "oral history interview" not in title and "oral history" not in title:
        return 0.0

    needle = _normalize_for_match(subject)
    pairs = _extract_last_first_tokens(subject)

    # build per-contributor matchable strings
    contribs = []
    for k in ("contributor", "contributor_names"):
        v = result.get(k)
        if isinstance(v, list):
            contribs.extend(_normalize_for_match(x) for x in v if isinstance(x, str))
        elif isinstance(v, str):
            contribs.append(_normalize_for_match(v))

    title_score = 0.0
    if title.startswith(needle):
        title_score = 1.0
    elif needle in title:
        title_score = 0.85

    contrib_score = 0.0
    if pairs and contribs:
        # for each pair, find a single contributor entry containing BOTH last and first
        pair_hits = 0
        for (last, first) in pairs:
            for c in contribs:
                if last in c and first in c:
                    pair_hits += 1
                    break
        if pair_hits == len(pairs):
            contrib_score = 0.9
        elif pair_hits > 0:
            contrib_score = 0.4 + 0.2 * pair_hits  # partial match for joint interviews

    score = max(title_score, contrib_score)
    # Weak fallback: last name only in title (almost never useful, included for completeness)
    if score == 0.0 and pairs:
        last_only_in_title = sum(1 for (last, _) in pairs if last in title)
        if last_only_in_title:
            score = 0.3
    return score


def _extract_transcript_resource(item_json: dict) -> dict | None:
    """Return {'xml_url': ..., 'pdf_url': ..., 'resource_url': ...} or None.

    LoC's structure: resources[N] for each transcript/PDF; the transcript resource has
    'fulltext' pointing to the XML, plus 'pdf'. Some items have NO transcript resource
    (audio-only items), which is the case our healing plan must handle.
    """
    resources = item_json.get("resources") or []
    for r in resources:
        ft = r.get("fulltext")
        if isinstance(ft, str) and ft.endswith(".xml"):
            return {
                "xml_url": ft,
                "pdf_url": r.get("pdf"),
                "resource_url": r.get("url"),
                "caption": r.get("caption"),
                "segment_count": r.get("segment_count"),
            }
    # fallback: search nested resource_items
    for r in resources:
        items = r.get("resource_items") or []
        for ri in items:
            if isinstance(ri, dict):
                for k, v in ri.items():
                    if isinstance(v, str) and v.endswith(".xml") and "transcript" in v.lower():
                        return {
                            "xml_url": v,
                            "pdf_url": r.get("pdf"),
                            "resource_url": r.get("url"),
                            "caption": r.get("caption"),
                            "segment_count": r.get("segment_count"),
                        }
    return None


def resolve_one(subject: str, refresh: bool = False) -> dict:
    """Resolve a single subject to a LoC item; return a resolution dict."""
    subj_safe = re.sub(r"[^A-Za-z0-9_]+", "_", subject)
    out_xml = LOC_CACHE / f"{subj_safe}.xml"
    out_meta = LOC_CACHE / f"{subj_safe}.resolution.json"

    if not refresh and out_meta.exists():
        return json.loads(out_meta.read_text(encoding="utf-8"))

    record: dict = {
        "subject": subject,
        "subject_safe": subj_safe,
        "status": "pending",
        "candidates": [],
    }

    # search
    q = urllib.parse.quote_plus(subject)
    search_url = COLLECTION_SEARCH.format(q=q)
    time.sleep(REQUEST_DELAY_S)
    try:
        body = _http_get(search_url)
        data = json.loads(body.decode("utf-8"))
    except Exception as e:  # noqa: BLE001
        record["status"] = "search_failed"
        record["error"] = str(e)
        out_meta.write_text(json.dumps(record, indent=2), encoding="utf-8")
        return record

    results = (data.get("content") or {}).get("results") or data.get("results") or []
    # rank candidates
    scored = []
    for r in results:
        s = _score_candidate(subject, r)
        if s > 0:
            scored.append((s, r))
    scored.sort(key=lambda x: x[0], reverse=True)
    if not scored:
        record["status"] = "no_candidates"
        record["raw_result_count"] = len(results)
        out_meta.write_text(json.dumps(record, indent=2), encoding="utf-8")
        return record

    record["candidates"] = [
        {
            "score": round(s, 3),
            "id": r.get("id"),
            "title": (r.get("title") or "")[:160],
            "contributor": r.get("contributor"),
            "url": r.get("url") or (r.get("aka") or [None])[0],
        }
        for s, r in scored[:5]
    ]

    top_score, top = scored[0]
    second_score = scored[1][0] if len(scored) > 1 else 0.0

    # ambiguity check
    ambiguous = top_score < 0.9 or (second_score >= 0.85 and abs(top_score - second_score) < 0.1)

    # find the per-item resource (resources[]) -- it should be inline on the search hit
    transcript_resource = _extract_transcript_resource(top)

    # If not present in search hit, hit the item resource endpoint
    if not transcript_resource:
        # try to derive item resource url from aka
        akas = top.get("aka") or []
        item_resource_url = None
        for aka in akas:
            if isinstance(aka, str) and "/resource/" in aka and "_transcript" in aka:
                item_resource_url = aka.rstrip("/") + "/?fo=json"
                break
        if not item_resource_url:
            # fallback: try item url + ?fo=json
            item_url = top.get("url") or (akas[0] if akas else None)
            if item_url:
                item_resource_url = item_url.rstrip("/") + "/?fo=json"
        if item_resource_url:
            time.sleep(REQUEST_DELAY_S)
            try:
                body = _http_get(item_resource_url)
                item_data = json.loads(body.decode("utf-8"))
                transcript_resource = _extract_transcript_resource(item_data)
                if not transcript_resource and isinstance(item_data.get("item"), dict):
                    transcript_resource = _extract_transcript_resource(item_data["item"])
            except Exception as e:  # noqa: BLE001
                record["item_fetch_error"] = str(e)

    if not transcript_resource:
        record["status"] = "no_transcript"
        record["best_match"] = record["candidates"][0]
        record["ambiguous"] = ambiguous
        out_meta.write_text(json.dumps(record, indent=2), encoding="utf-8")
        return record

    # download the XML
    xml_url = transcript_resource["xml_url"]
    if not refresh and out_xml.exists() and out_xml.stat().st_size > 100:
        # already cached
        pass
    else:
        time.sleep(REQUEST_DELAY_S)
        try:
            body = _http_get(xml_url)
            out_xml.write_bytes(body)
        except Exception as e:  # noqa: BLE001
            record["status"] = "xml_fetch_failed"
            record["xml_url"] = xml_url
            record["error"] = str(e)
            out_meta.write_text(json.dumps(record, indent=2), encoding="utf-8")
            return record

    record["status"] = "ok"
    record["match_score"] = round(top_score, 3)
    record["ambiguous"] = ambiguous
    record["loc_item_id"] = top.get("id")
    record["loc_item_url"] = top.get("url")
    record["loc_xml_url"] = xml_url
    record["loc_pdf_url"] = transcript_resource.get("pdf_url")
    record["loc_xml_path"] = str(out_xml.relative_to(ROOT))
    record["loc_xml_bytes"] = out_xml.stat().st_size
    record["best_match"] = record["candidates"][0]
    out_meta.write_text(json.dumps(record, indent=2), encoding="utf-8")
    return record


def list_subjects(only: str | None = None, limit: int | None = None) -> list[tuple[str, str]]:
    """Return [(directory_name, subject), ...] for every corrected/ entry."""
    if not CORRECTED_DIR.is_dir():
        raise SystemExit(f"corrected/ dir not found at {CORRECTED_DIR}")
    out = []
    for p in sorted(CORRECTED_DIR.iterdir()):
        if not p.is_dir():
            continue
        try:
            subj = parse_subject(p.name)
        except ValueError as e:
            print(f"  skip (cannot parse subject): {p.name} -- {e}", file=sys.stderr)
            continue
        if only and only.lower() not in subj.lower():
            continue
        out.append((p.name, subj))
    if limit:
        out = out[:limit]
    return out


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--only", type=str, default=None)
    parser.add_argument("--refresh", action="store_true")
    args = parser.parse_args(argv)

    subjects = list_subjects(only=args.only, limit=args.limit)
    print(f"Resolving {len(subjects)} interview(s) against LoC...")

    summary = {
        "ok": [],
        "no_transcript": [],
        "no_candidates": [],
        "search_failed": [],
        "xml_fetch_failed": [],
        "ambiguous_ok": [],
    }

    for i, (dirname, subj) in enumerate(subjects, 1):
        print(f"[{i}/{len(subjects)}] {subj}")
        rec = resolve_one(subj, refresh=args.refresh)
        status = rec["status"]
        bucket = summary.setdefault(status, [])
        bucket.append({"dir": dirname, "subject": subj, **{k: rec.get(k) for k in ("match_score", "loc_item_id", "ambiguous", "error", "candidates")}})
        if status == "ok" and rec.get("ambiguous"):
            summary["ambiguous_ok"].append({"dir": dirname, "subject": subj, "candidates": rec.get("candidates")})
        print(f"   -> {status}" + (f"  (match {rec.get('match_score')})" if rec.get("match_score") else ""))

    index_path = LOC_CACHE / "_index.json"
    index_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print()
    print("=== Resolution summary ===")
    for k, v in summary.items():
        print(f"  {k}: {len(v)}")
    print(f"Index written to {index_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
