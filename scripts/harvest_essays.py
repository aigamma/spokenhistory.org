"""
harvest_essays.py - manifest-driven, license-gated, idempotent harvester for the
curated public-domain / open-license essays layer.

Reads public/rag/essays/manifest.json. For each row whose status is 'verified'
(or 'hosted' with --redo) and whose license type qualifies, it fetches the
verbatim source text from Project Gutenberg, extracts the essay (one titled
chapter, or a whole work), writes the hosted text to
public/rag/essays/text/<slug>.txt and the per-essay metadata to
public/rag/essays/<slug>.json, and flips the row to 'hosted'.

The license gate is the controlling rule: the embedding pipeline is a derivative
use, so No-Derivatives licenses do not qualify (see manifest.license_gate). Rows
in 'candidate' status (license not yet verified) are skipped, and any row whose
license type is not in the qualifying set is REFUSED. Re-running only re-fetches
when the cached book is missing, so it is safe to run repeatedly and scales to
hundreds of rows. This is the path the broader oral-history platform reuses.

Usage:
  python scripts/harvest_essays.py            # process all verified rows
  python scripts/harvest_essays.py --slug X   # one row
  python scripts/harvest_essays.py --redo     # re-extract even if hosted
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ESSAYS = ROOT / "public" / "rag" / "essays"
TEXT_DIR = ESSAYS / "text"
MANIFEST = ESSAYS / "manifest.json"
CACHE = ROOT / "scripts" / "_essay_scratch"
UA = "civil-rights-essays-harvester eric@aigamma.com"

START_RE = re.compile(r"\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG.*?\*\*\*", re.I)
END_RE = re.compile(r"\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG.*?\*\*\*", re.I)


def fetch_book(book_id: int, url: str) -> str:
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / f"gutenberg_{book_id}.txt"
    if cached.is_file():
        return cached.read_text(encoding="utf-8", errors="replace")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    data = urllib.request.urlopen(req, timeout=120).read().decode("utf-8", "replace")
    cached.write_text(data, encoding="utf-8", newline="")
    return data


def body_region(text: str) -> tuple[int, int]:
    s = START_RE.search(text)
    e = END_RE.search(text)
    return (s.end() if s else 0), (e.start() if e else len(text))


def clean(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def chapter_pattern(row: dict) -> "re.Pattern":
    """Heading matcher. Gutenberg sets the Roman numeral and the title on
    separate lines, so allow whitespace (including newlines) between them."""
    src = row["source"]
    roman = src.get("chapter_roman")
    title = src["chapter_title"]
    if roman:
        return re.compile(re.escape(roman) + r"\.\s+" + re.escape(title))
    return re.compile(re.escape(title))


def body_start_of(book_text: str, row: dict):
    """The body occurrence of a chapter heading. The first occurrence is the
    table of contents; the second is the chapter itself, so prefer index 1."""
    occ = [m.start() for m in chapter_pattern(row).finditer(book_text)]
    if not occ:
        return None
    return occ[1] if len(occ) >= 2 else occ[0]


def extract_chapter(book_text: str, row: dict, siblings: list[dict]) -> str:
    _, body_end = body_region(book_text)
    me = body_start_of(book_text, row)
    if me is None:
        raise SystemExit(f"[{row['slug']}] heading not found: {row['source'].get('chapter_title')!r}")
    later = sorted(s for s in (body_start_of(book_text, r) for r in siblings) if s is not None and s > me)
    end = later[0] if later else body_end
    chunk = chapter_pattern(row).sub("", book_text[me:end], count=1)  # strip the leading heading
    return clean(chunk)


def extract_whole(book_text: str) -> str:
    a, b = body_region(book_text)
    return clean(book_text[a:b])


def excerpt_of(text: str, words: int = 45) -> str:
    parts = re.sub(r"\s+", " ", text).strip().split(" ")
    return " ".join(parts[:words]) + ("..." if len(parts) > words else "")


def qualifies(license_type: str, gate: dict) -> bool:
    return license_type in gate.get("qualifies", []) and license_type not in gate.get("excluded", [])


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug")
    ap.add_argument("--redo", action="store_true")
    args = ap.parse_args(argv)

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    gate = manifest.get("license_gate", {})
    rows = manifest["sources"]
    TEXT_DIR.mkdir(parents=True, exist_ok=True)

    by_book: dict[int, list[dict]] = {}
    for r in rows:
        if r["source"].get("kind") == "gutenberg-chapter":
            by_book.setdefault(r["source"]["book_id"], []).append(r)

    hosted = skipped = refused = 0
    for r in rows:
        if args.slug and r["slug"] != args.slug:
            continue
        status = r.get("status")
        if status == "candidate":
            skipped += 1
            print(f"  [skip] {r['slug']}: candidate (license not verified / not ready)")
            continue
        if status == "hosted" and not args.redo:
            skipped += 1
            print(f"  [skip] {r['slug']}: already hosted")
            continue
        lt = r["license"]["type"]
        if not qualifies(lt, gate):
            refused += 1
            print(f"  [REFUSE] {r['slug']}: license {lt!r} does not qualify under the gate")
            continue
        src = r["source"]
        kind = src.get("kind")
        if kind not in ("gutenberg-chapter", "gutenberg-whole"):
            skipped += 1
            print(f"  [skip] {r['slug']}: source kind {kind!r} not harvestable by this script")
            continue

        book = fetch_book(src["book_id"], src["book_url"])
        body = extract_whole(book) if kind == "gutenberg-whole" else extract_chapter(book, r, by_book[src["book_id"]])
        (TEXT_DIR / f"{r['slug']}.txt").write_text(body, encoding="utf-8", newline="")
        wc = len(body.split())
        authors = r.get("authors", [])
        doc = {
            "schema_version": 1,
            "slug": r["slug"],
            "title": r["title"],
            "collection": r.get("collection"),
            "authors": authors,
            "year": r.get("year"),
            "venue": r.get("venue"),
            "license": r["license"],
            "source_url": r["license"].get("url") or src.get("book_url"),
            "provenance": {
                "harvested_from": src.get("book_url"),
                "harvested_date": date.today().isoformat(),
                "license_verified_date": r.get("license_verified_date"),
                "verified_by": r.get("verified_by"),
            },
            "themes": r.get("themes", []),
            "abstract": f"{r['title']} ({r.get('year')}), by {', '.join(authors)}."
            + (f" From {r['collection']}." if r.get("collection") else ""),
            "excerpt": excerpt_of(body),
            "word_count": wc,
            "body": {"format": "text", "path": f"/rag/essays/text/{r['slug']}.txt"},
        }
        (ESSAYS / f"{r['slug']}.json").write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8", newline="")
        r["status"] = "hosted"
        r["harvested_date"] = date.today().isoformat()
        r["content_hash"] = hashlib.sha256(body.encode("utf-8")).hexdigest()[:16]
        r["word_count"] = wc
        hosted += 1
        print(f"  [hosted] {r['slug']}: {wc} words")

    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8", newline="")
    print(f"\nhosted {hosted}, skipped {skipped}, refused {refused}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
