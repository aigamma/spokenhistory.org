#!/usr/bin/env python3
"""Verify that every interview snippet quote on a person page appears
verbatim in the cited Library-of-Congress-healed transcript.

This is the QA gate for the Opus-4.8 per-person rebuild (2026-05-28).
Snippets are each page's primary substance and MUST be quoted verbatim
from the corrected transcript, so the Smithsonian / LoC review chain can
trace any quote to its source. The script parses each cited entry's
.srt into its continuous spoken text and checks, with punctuation- and
bracket-insensitive normalization, that the quote's word sequence is a
contiguous substring of that text. Editorial bracket insertions
(LoC "(Name)" or our "[Name]") and whitespace differences are tolerated;
word order and wording are not. A quote that fails is either a
paraphrase, a transcription drift, or a cross-entry mismatch, and must
be fixed before the page ships.

Usage:
  python scripts/verify_person_snippets.py                  # all pages
  python scripts/verify_person_snippets.py charles-mclaurin # one or more slugs
Exit code 1 if any snippet fails verbatim verification.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PEOPLE = ROOT / "public" / "rag" / "people"
CORRECTED = ROOT / "transcripts" / "corrected"


def build_entry_index():
    """entry_number -> first .srt path under transcripts/corrected/."""
    idx = {}
    for mf in CORRECTED.glob("*/manifest.json"):
        try:
            m = json.loads(mf.read_text(encoding="utf-8"))
        except Exception:
            continue
        en = m.get("entry_number")
        srts = list(mf.parent.glob("*.srt"))
        if en is not None and srts:
            idx[en] = srts[0]
    return idx


def srt_spoken_text(path):
    """Concatenate just the spoken-text lines of an SRT (drop cue
    indices and timestamp lines) so multi-cue quotes match."""
    lines = []
    for ln in path.read_text(encoding="utf-8", errors="replace").splitlines():
        s = ln.strip()
        if not s or s.isdigit() or "-->" in s:
            continue
        lines.append(s)
    return " ".join(lines)


def norm(s):
    s = s.lower()
    s = re.sub(r"[\(\)\[\]]", " ", s)      # drop editorial brackets/parens
    s = re.sub(r"[^a-z0-9]+", " ", s)      # collapse punctuation to single spaces
    return s.strip()


def main():
    targets = set(sys.argv[1:])
    ent_idx = build_entry_index()
    cache = {}
    pages = total = ok = fail = 0
    failures = []
    for f in sorted(PEOPLE.glob("*.json")):
        if f.name == "index.json":
            continue
        if targets and f.stem not in targets:
            continue
        p = json.loads(f.read_text(encoding="utf-8"))
        snips = p.get("interview_snippets") or []
        if not snips:
            continue
        pages += 1
        for i, sn in enumerate(snips):
            total += 1
            q = sn.get("quote", "")
            en = sn.get("source_entry")
            srt = ent_idx.get(en)
            if not srt:
                fail += 1
                failures.append((f.stem, i, en, "NO_SRT_FOR_ENTRY"))
                continue
            if en not in cache:
                cache[en] = norm(srt_spoken_text(srt))
            nq = norm(q)
            if nq and nq in cache[en]:
                ok += 1
            else:
                fail += 1
                failures.append((f.stem, i, en, "QUOTE_NOT_FOUND: " + q[:70]))
    print(f"pages={pages} snippets={total} verbatim_ok={ok} FAIL={fail}")
    for fl in failures:
        print("  FAIL", fl)
    sys.exit(1 if fail else 0)


if __name__ == "__main__":
    main()
