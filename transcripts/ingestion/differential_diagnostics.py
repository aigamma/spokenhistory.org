"""
Differential-diagnostics pass: for each of the 95 Category-C entries (where
Dustin's student batch is a SECOND Whisper-from-YouTube pass on the same
interview we already have in raw/), word-align the two Whisper passes
against each other and surface every disagreement as an "ASR-uncertain
candidate."

Where two independent Whisper passes DISAGREE on a token, the disagreement
is itself a high-signal flag: independent ASR systems rarely produce the
same hallucination, so a disagreement usually means at least one of them
is wrong. Adjudicating against LoC's authoritative text (already cached
in transcripts/loc_healing/loc_cache/) resolves it.

This is a more sensitive ASR-error detector than Pass 8 alone because:
- Pass 8 only catches errors where LoC's text materially diverges from
  our raw — and Pass 8 misses errors where our raw and LoC happen to
  share a hallucination class.
- Two-Whisper-vs-LoC catches the additional class: where our raw and the
  student batch disagree, even if both happen to share a hallucination
  with LoC, we can flag the cue for human review.

Outputs per entry (one file per Category-C interview):
    transcripts/loc_healing/student_batch_diff/<subject>.diff.json

Each file contains:
    {
      "subject": "Aaron Dixon",
      "raw_dir": "Aaron Dixon_interview_20250704_170306",
      "raw_word_count": N,
      "batch_word_count": M,
      "divergence_count": K,
      "divergences": [
        {
          "raw_tokens": [...], "batch_tokens": [...],
          "raw_context": "5 words before + span + 5 after",
          "batch_context": "5 words before + span + 5 after",
        },
        ...
      ]
    }

Linear processing — one entry at a time, no model in the loop. This is
purely deterministic alignment that surfaces SME-reviewable candidates;
no auto-heals are applied. Future work can route each surfaced candidate
through LoC text adjudication and promote a subset to applied heals.

Usage:
    python transcripts/ingestion/differential_diagnostics.py
    python transcripts/ingestion/differential_diagnostics.py --limit 5
    python transcripts/ingestion/differential_diagnostics.py --only "Aaron Dixon"
    python transcripts/ingestion/differential_diagnostics.py --skip-existing
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BATCH_DIR = Path("C:/TRANSCRIPTS")
RAW_DIR = ROOT / "transcripts" / "raw"
OUT_DIR = ROOT / "transcripts" / "loc_healing" / "student_batch_diff"

# Reused conventions for tokenization + normalization (mirror heal_one_entry.py)
_UNICODE_REPLACEMENTS = {
    "‘": "'", "’": "'", "“": '"', "”": '"',
    "–": "-", "—": "-", "…": "...",
    " ": " ", "ʼ": "'", "�": "",
}


def normalize_unicode(text: str) -> str:
    out = text
    for src, dst in _UNICODE_REPLACEMENTS.items():
        out = out.replace(src, dst)
    return out


def tokenize(text: str) -> list[str]:
    return [w for w in re.split(r"\s+", text.strip()) if w]


def normalize_token(w: str) -> str:
    return re.sub(r"^[\W_]+|[\W_]+$", "", w.lower())


def parse_srt_text(srt_path: Path) -> str:
    """Extract all cue-text from an SRT (excluding indices and timestamps).
    Returns a single space-separated string."""
    content = srt_path.read_text(encoding="utf-8", errors="replace")
    content = normalize_unicode(content)
    blocks = re.split(r"\r?\n\r?\n", content.strip())
    text_parts: list[str] = []
    for block in blocks:
        lines = block.splitlines()
        ts_pos = None
        for i, line in enumerate(lines):
            if "-->" in line:
                ts_pos = i
                break
        if ts_pos is None:
            continue
        cue_text = " ".join(line.strip() for line in lines[ts_pos + 1:] if line.strip())
        if cue_text:
            text_parts.append(cue_text)
    return " ".join(text_parts)


def parse_student_batch_text(txt_path: Path) -> str:
    """Read the student's batch .txt, strip the 'utf_8' marker line + speaker
    labels, return continuous prose. Speaker labels are removed because they're
    a different annotation layer; we want to compare WORDS spoken."""
    raw = txt_path.read_text(encoding="utf-8", errors="replace")
    raw = normalize_unicode(raw)
    lines = raw.split("\n")
    # Drop first line if it's just 'utf_8'
    if lines and lines[0].strip().lower() == "utf_8":
        lines = lines[1:]
    # Strip speaker-label prefixes line-by-line
    cleaned_lines = []
    speaker_re = re.compile(
        r"^(?:[A-Z]{1,5}|"
        r"INTERVIEWER|INTERVIEWEE|MALE|FEMALE|"
        r"(?:REVEREND|DR\.|MR\.|MRS\.|MS\.|PROFESSOR)\s+[A-Z][A-Z\.\-\'\s]+|"
        r"[A-Z][A-Z\.\-\'\s]{2,40})"
        r":\s*"
    )
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        cleaned = speaker_re.sub("", stripped, count=1)
        cleaned_lines.append(cleaned.strip())
    return " ".join(cleaned_lines)


def find_divergences(
    raw_text: str, batch_text: str, context_words: int = 5,
    min_segment_chars: int = 0,
) -> tuple[list[dict], int, int]:
    """Word-align two texts via difflib; return divergences with surrounding context."""
    raw_words = tokenize(raw_text)
    batch_words = tokenize(batch_text)
    raw_norm = [normalize_token(w) for w in raw_words]
    batch_norm = [normalize_token(w) for w in batch_words]
    sm = SequenceMatcher(a=raw_norm, b=batch_norm, autojunk=False)
    divergences: list[dict] = []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            continue
        raw_tokens = raw_words[i1:i2]
        batch_tokens = batch_words[j1:j2]
        # Skip pure punctuation/empty differences
        rn = " ".join(normalize_token(t) for t in raw_tokens if normalize_token(t))
        bn = " ".join(normalize_token(t) for t in batch_tokens if normalize_token(t))
        if rn == bn:
            continue
        rs = max(0, i1 - context_words)
        re_ = min(len(raw_words), i2 + context_words)
        bs = max(0, j1 - context_words)
        be = min(len(batch_words), j2 + context_words)
        divergences.append({
            "op": op,
            "raw_tokens": raw_tokens,
            "batch_tokens": batch_tokens,
            "raw_context": " ".join(raw_words[rs:re_]),
            "batch_context": " ".join(batch_words[bs:be]),
        })
    return divergences, len(raw_words), len(batch_words)


def find_batch_file(subject: str) -> Path | None:
    """Find the matching student-batch .txt file for an interviewee. Loose match."""
    if not BATCH_DIR.is_dir():
        return None
    subject_norm = subject.lower()
    for f in BATCH_DIR.glob("*.txt"):
        # Filename starts with "<subject> oral history interview ..."
        head = f.stem.lower()
        if head.startswith(subject_norm + " "):
            return f
    return None


def find_raw_srt(entry_dir_name: str) -> Path | None:
    rd = RAW_DIR / entry_dir_name
    if not rd.is_dir():
        return None
    for p in rd.iterdir():
        if p.suffix == ".srt":
            return p
    return None


def list_category_c_entries() -> list[tuple[str, str]]:
    """Return [(entry_dir_name, subject), ...] for the 95 Category-C entries.

    Category C = an entry directory whose subject ALSO appears in C:\\TRANSCRIPTS\\
    as a student-batch .txt file. Excludes the 9 newly-ingested entries from
    2026-05-25 (those entry dirs end in _20260525_<HHMMSS>)."""
    out: list[tuple[str, str]] = []
    for d in sorted(RAW_DIR.iterdir()):
        if not d.is_dir():
            continue
        # Skip the 9 newly-ingested entries
        if "_20260525_" in d.name:
            continue
        m = re.match(r"^(.+?)_interview_\d{8}_\d{6}$", d.name)
        if not m:
            continue
        subject = m.group(1)
        batch_file = find_batch_file(subject)
        if batch_file is not None:
            out.append((d.name, subject))
    return out


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--only", type=str, default=None)
    parser.add_argument("--skip-existing", action="store_true")
    args = parser.parse_args(argv)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    entries = list_category_c_entries()
    print(f"Found {len(entries)} Category-C entries (with both raw/ and student batch).")
    if args.only:
        entries = [(d, s) for d, s in entries if args.only.lower() in s.lower()]
        print(f"Filtered to {len(entries)} entries matching {args.only!r}.")
    if args.limit:
        entries = entries[:args.limit]
        print(f"Limited to first {args.limit} entries.")

    summary: list[dict] = []
    for i, (entry_dir, subject) in enumerate(entries, 1):
        subj_safe = re.sub(r"[^A-Za-z0-9_]+", "_", subject)
        out_path = OUT_DIR / f"{subj_safe}.diff.json"
        if args.skip_existing and out_path.is_file():
            print(f"[{i}/{len(entries)}] {subject!r}: SKIP (already staged)")
            continue
        batch_file = find_batch_file(subject)
        raw_srt = find_raw_srt(entry_dir)
        if not batch_file or not raw_srt:
            print(f"[{i}/{len(entries)}] {subject!r}: SKIP (missing batch or raw srt)")
            continue
        raw_text = parse_srt_text(raw_srt)
        batch_text = parse_student_batch_text(batch_file)
        try:
            divergences, raw_wc, batch_wc = find_divergences(raw_text, batch_text)
        except Exception as e:  # noqa: BLE001
            print(f"[{i}/{len(entries)}] {subject!r}: DIFF FAILED — {type(e).__name__}: {e}", file=sys.stderr)
            # Try with autojunk True as a fallback (slower but more robust on repetitive text)
            try:
                raw_words = tokenize(raw_text)
                batch_words = tokenize(batch_text)
                raw_norm = [normalize_token(w) for w in raw_words]
                batch_norm = [normalize_token(w) for w in batch_words]
                sm = SequenceMatcher(a=raw_norm, b=batch_norm, autojunk=True)
                divergences = []
                for op, i1, i2, j1, j2 in sm.get_opcodes():
                    if op == "equal":
                        continue
                    rt = raw_words[i1:i2]
                    bt = batch_words[j1:j2]
                    rn = " ".join(normalize_token(t) for t in rt if normalize_token(t))
                    bn = " ".join(normalize_token(t) for t in bt if normalize_token(t))
                    if rn == bn:
                        continue
                    rs = max(0, i1 - 5)
                    re_ = min(len(raw_words), i2 + 5)
                    bs = max(0, j1 - 5)
                    be = min(len(batch_words), j2 + 5)
                    divergences.append({
                        "op": op,
                        "raw_tokens": rt, "batch_tokens": bt,
                        "raw_context": " ".join(raw_words[rs:re_]),
                        "batch_context": " ".join(batch_words[bs:be]),
                    })
                raw_wc = len(raw_words)
                batch_wc = len(batch_words)
                print(f"   recovered via autojunk=True; {len(divergences)} divergences")
            except Exception as e2:  # noqa: BLE001
                print(f"   recovery also failed: {type(e2).__name__}: {e2}", file=sys.stderr)
                continue
        record = {
            "subject": subject,
            "raw_dir": entry_dir,
            "raw_srt_path": str(raw_srt.relative_to(ROOT)),
            "batch_txt_path": str(batch_file),
            "raw_word_count": raw_wc,
            "batch_word_count": batch_wc,
            "divergence_count": len(divergences),
            "divergences": divergences,
        }
        out_path.write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")
        summary.append({"subject": subject, "div": len(divergences),
                        "raw_wc": raw_wc, "batch_wc": batch_wc})
        print(f"[{i}/{len(entries)}] {subject[:45]:45s} divergences={len(divergences):5d}  raw={raw_wc:6d} batch={batch_wc:6d}")

    # Aggregate summary
    print()
    print(f"=== Diff summary ===")
    print(f"Processed: {len(summary)} entries")
    if summary:
        total_div = sum(s["div"] for s in summary)
        print(f"Total divergences across all entries: {total_div}")
        print(f"Avg divergences per entry: {total_div / len(summary):.1f}")
        print(f"Top 10 entries by divergence count:")
        for s in sorted(summary, key=lambda x: -x["div"])[:10]:
            print(f"  {s['subject'][:40]:40s}  divergences={s['div']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
