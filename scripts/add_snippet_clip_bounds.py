#!/usr/bin/env python3
"""Compute a clip END timestamp for every person-page interview snippet.

Person snippets carry only a single `timestamp` (the start cue of the
quote), copied from the source transcript. The PersonPage "Hear this in
context" affordance plays a BOUNDED clip, so it needs an end. This script
aligns each verbatim quote against its source Library-of-Congress-healed
.srt, finds the contiguous run of cues that span the quote, and writes
`end_timestamp` (the end of the last spanned cue plus a short tail) right
after `timestamp` on each snippet.

The alignment uses the same normalization as scripts/verify_person_snippets.py
(lowercase, drop editorial brackets, collapse punctuation to single spaces),
so any quote that passes the verbatim gate also aligns here. A quote that
cannot be located is left without an end_timestamp; PersonPage then falls
back to a short fixed window from the start.

Idempotent: re-running recomputes end_timestamp and only rewrites a file
when its content actually changes, so reruns produce no spurious diffs.

Usage:
  python scripts/add_snippet_clip_bounds.py                  # all pages
  python scripts/add_snippet_clip_bounds.py charles-mclaurin # one or more slugs
  python scripts/add_snippet_clip_bounds.py --dry-run        # report only
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PEOPLE = ROOT / "public" / "rag" / "people"
CORRECTED = ROOT / "transcripts" / "corrected"

# Seconds added past the last spanned cue's end so the final word is not
# clipped and the clip lands on a natural pause rather than a hard cut.
TAIL_SECONDS = 1.0

# A correctly-aligned quote clip is at most ~90 seconds (the longest quote in
# the catalog is ~150 words, and even slow speech reaches it well under two
# minutes). Anything longer means the quote text matched the wrong occurrence
# in the transcript (a repeated phrase) or the snippet's stored start cue is
# wrong. Such a computed end is rejected so the player falls back to a short
# fixed window instead of playing minutes of audio.
MAX_CLIP_SECONDS = 120.0


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


def norm(s):
    """Match verify_person_snippets.py normalization exactly."""
    s = s.lower()
    s = re.sub(r"[\(\)\[\]]", " ", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return s.strip()


def ts_to_seconds(ts):
    """'HH:MM:SS,mmm' / 'HH:MM:SS' / 'MM:SS' -> float seconds."""
    ts = ts.strip().replace(",", ".")
    parts = ts.split(":")
    try:
        parts = [float(p) for p in parts]
    except ValueError:
        return 0.0
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    return parts[0] if parts else 0.0


def fmt_hms(seconds):
    """seconds -> 'HH:MM:SS' (drops milliseconds, matches snippet timestamp)."""
    s = int(round(seconds))
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{sec:02d}"


def parse_srt_cues(path):
    """Parse an SRT into a list of cues: {start, end, text}.

    Blocks are separated by blank lines; line 1 is the index, line 2 the
    'start --> end' timestamp, the rest the spoken text.
    """
    cues = []
    raw = path.read_text(encoding="utf-8", errors="replace")
    for block in re.split(r"\r?\n\r?\n", raw):
        lines = [ln.strip() for ln in block.splitlines() if ln.strip()]
        if not lines:
            continue
        # Find the timestamp line (it contains '-->').
        ts_idx = next((i for i, ln in enumerate(lines) if "-->" in ln), None)
        if ts_idx is None:
            continue
        start_str, _, end_str = lines[ts_idx].partition("-->")
        text = " ".join(lines[ts_idx + 1:])
        cues.append(
            {
                "start": ts_to_seconds(start_str),
                "end": ts_to_seconds(end_str),
                "text": text,
            }
        )
    return cues


def build_norm_index(cues):
    """Concatenate cue norm-texts and record each cue's [start,end) char span
    in the concatenated string, so a substring match maps back to cues."""
    pieces = []
    spans = []  # (char_start, char_end, cue_index)
    pos = 0
    for i, c in enumerate(cues):
        nt = norm(c["text"])
        if not nt:
            continue
        if pos > 0:
            pieces.append(" ")
            pos += 1
        start = pos
        pieces.append(nt)
        pos += len(nt)
        spans.append((start, pos, i))
    return "".join(pieces), spans


def cue_for_char(spans, char_pos):
    """Return the cue index whose span contains char_pos, or None."""
    for start, end, idx in spans:
        if start <= char_pos < end:
            return idx
    return None


def anchor_char_for_start(cues, spans, start_seconds):
    """Char offset in `big` of the cue nearest `start_seconds`, so the quote
    search can prefer the occurrence at the snippet's known start time rather
    than the first textual repeat anywhere in the interview."""
    cue_to_char = {idx: cs for (cs, _ce, idx) in spans}
    best_idx, best_d = None, None
    for idx in cue_to_char:
        d = abs(cues[idx]["start"] - start_seconds)
        if best_d is None or d < best_d:
            best_d, best_idx = d, idx
    return cue_to_char.get(best_idx, 0)


def end_timestamp_for_quote(quote, cues, big, spans, start_seconds):
    """Return the clip end timestamp for `quote`, or None to fall back.

    The quote's normalized text is located in the concatenated cue stream. When
    it occurs more than once (repeated phrases are common in oral histories) the
    occurrence nearest the snippet's known start cue is chosen, so the end does
    not latch onto a far-away repeat. A computed span that is non-positive or
    longer than MAX_CLIP_SECONDS is rejected (returns None) so PersonPage falls
    back to a short fixed window instead of playing minutes of audio.
    """
    nq = norm(quote)
    if not nq:
        return None
    occurrences = []
    i = big.find(nq)
    while i != -1:
        occurrences.append(i)
        i = big.find(nq, i + 1)
    if not occurrences:
        return None
    anchor = anchor_char_for_start(cues, spans, start_seconds)
    pos = min(occurrences, key=lambda p: abs(p - anchor))
    last_char = pos + len(nq) - 1
    cue_idx = cue_for_char(spans, last_char)
    if cue_idx is None:
        return None
    end_sec = cues[cue_idx]["end"] + TAIL_SECONDS
    if end_sec <= start_seconds or (end_sec - start_seconds) > MAX_CLIP_SECONDS:
        return None
    return fmt_hms(end_sec)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry_run = "--dry-run" in sys.argv
    targets = set(args)

    ent_idx = build_entry_index()
    cue_cache = {}  # entry -> (cues, big, spans)

    pages = changed = total = aligned = unaligned = 0
    misses = []

    for f in sorted(PEOPLE.glob("*.json")):
        if f.name == "index.json":
            continue
        if targets and f.stem not in targets:
            continue
        raw = f.read_text(encoding="utf-8")
        data = json.loads(raw)
        snips = data.get("interview_snippets") or []
        if not snips:
            continue
        pages += 1

        for sn in snips:
            total += 1
            quote = sn.get("quote", "")
            en = sn.get("source_entry")
            srt = ent_idx.get(en)
            end_ts = None
            if srt is not None and quote:
                if en not in cue_cache:
                    cues = parse_srt_cues(srt)
                    big, spans = build_norm_index(cues)
                    cue_cache[en] = (cues, big, spans)
                cues, big, spans = cue_cache[en]
                start_seconds = ts_to_seconds(sn.get("timestamp", ""))
                end_ts = end_timestamp_for_quote(quote, cues, big, spans, start_seconds)
            if end_ts:
                aligned += 1
            else:
                unaligned += 1
                misses.append((f.stem, en, quote[:60]))
            # Rebuild the snippet dict with end_timestamp right after
            # timestamp; drop any stale end_timestamp so reruns are clean.
            new_sn = {}
            for k, v in sn.items():
                if k == "end_timestamp":
                    continue
                new_sn[k] = v
                if k == "timestamp" and end_ts:
                    new_sn["end_timestamp"] = end_ts
            sn.clear()
            sn.update(new_sn)

        out = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
        if out != raw:
            changed += 1
            if not dry_run:
                f.write_text(out, encoding="utf-8")

    print(
        f"pages={pages} snippets={total} aligned={aligned} "
        f"unaligned={unaligned} files_changed={changed}"
        + (" (dry-run)" if dry_run else "")
    )
    if misses:
        print("Unaligned (left without end_timestamp, render falls back to a window):")
        for slug, en, q in misses[:40]:
            print(f"  {slug} entry={en} :: {q}")
        if len(misses) > 40:
            print(f"  ... and {len(misses) - 40} more")


if __name__ == "__main__":
    main()
