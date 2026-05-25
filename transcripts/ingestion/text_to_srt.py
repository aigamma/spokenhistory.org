"""
Convert a Whisper-from-YouTube `.txt` transcript (no timestamps) into the
audit-overlay system's expected raw/ format: `.srt + .txt + .vtt + .summary.txt`
with synthesized cue-level timestamps derived from a speaking-rate heuristic.

Why this exists: Dustin's student delivered ~104 Whisper-from-YouTube `.txt`
files at `C:\TRANSCRIPTS\`. Most are duplicates of interviews we already
have. But ~9 are genuinely new interviews (Alfred Moldovan, C. T. Vivian,
David + Satoko Ackerman, Gertrude Newsome Jackson, Myrtle Gonza Glascoe,
Simeon Wright, Abernathy Family, Bennett group, Dudley group). For those 9,
we don't have audio to re-Whisper — only the text. This adapter ingests
the text into raw/ format so the standard
`transcripts/ingestion/ingest_new_transcript.py` pipeline can take over.

Synthesized timestamps are intentionally rough (~150 words/minute speaking-
rate heuristic). They are NOT precise enough for the playlist generator's
clip-extraction use case. They ARE good enough for search-and-retrieval,
chapter-level structure, and SRT/VTT viewer overlay.

The student's `.txt` format (observed empirically 2026-05-25):
- Starts with `utf_8` encoding marker on the first line
- Speaker turns identified by `XX: ` (initials) or `FULL NAME:` prefixes
- Multi-line continuation per turn (~100-char wrap)
- `[break in audio]` and similar editorial markers
- Curly quotes / em-dashes preserved

Usage:
    python text_to_srt.py "<source_txt_path>" "<output_dir>" --subject "Jane Doe" --date 20260525

The output directory is named with the standard
`<Subject>_interview_<YYYYMMDD>_<HHMMSS>` convention and contains the 4
files expected by the rest of the pipeline.
"""

from __future__ import annotations

import argparse
import re
import sys
from datetime import datetime
from pathlib import Path

# Speaking-rate constants
WORDS_PER_SECOND_NORMAL = 2.5  # ~150 words per minute average conversational
MIN_CUE_DURATION_S = 1.0  # never emit a cue shorter than 1 second
MAX_CUE_DURATION_S = 60.0  # cap any one cue at 60s; split if longer would result


# Speaker-label patterns observed in the student's transcript format
# - Initials: "XX:" or "XXX:" where letters are A-Z
# - Names: "FULL CAPS NAME:" or "Title FullName:" (Rev., etc.)
# - Generic: "INTERVIEWER:", "INTERVIEWEE:", "MALE:", "FEMALE:"
SPEAKER_LABEL_RE = re.compile(
    r"^(?P<speaker>"
    r"[A-Z]{1,5}|"                                              # initials
    r"INTERVIEWER|INTERVIEWEE|MALE|FEMALE|"                     # generic roles
    r"(?:REVEREND|DR\.|MR\.|MRS\.|MS\.|PROFESSOR)\s+[A-Z][A-Z\.\-\'\s]+|"  # title + name
    r"[A-Z][A-Z\.\-\'\s]{2,40}"                                 # ALL CAPS name
    r"):\s",
)


def parse_text_into_cues(text: str) -> list[dict]:
    """Parse the student's `.txt` into a list of cues. Each cue is one
    speaker turn (with continuation lines merged).

    Returns: [{'speaker': str, 'text': str, 'word_count': int}, ...]
    """
    # Strip the `utf_8` marker line if present
    lines = text.split("\n")
    if lines and lines[0].strip().lower() == "utf_8":
        lines = lines[1:]

    cues: list[dict] = []
    cur_speaker: str | None = None
    cur_text_parts: list[str] = []

    def flush_current_cue() -> None:
        nonlocal cur_speaker, cur_text_parts
        if cur_speaker is None or not cur_text_parts:
            cur_speaker = None
            cur_text_parts = []
            return
        merged = " ".join(t.strip() for t in cur_text_parts if t.strip())
        merged = re.sub(r"\s+", " ", merged).strip()
        if not merged:
            cur_speaker = None
            cur_text_parts = []
            return
        words = merged.split()
        cues.append({
            "speaker": cur_speaker,
            "text": merged,
            "word_count": len(words),
        })
        cur_speaker = None
        cur_text_parts = []

    for raw_line in lines:
        line = raw_line.rstrip()
        if not line.strip():
            continue
        m = SPEAKER_LABEL_RE.match(line)
        if m:
            flush_current_cue()
            cur_speaker = m.group("speaker").strip()
            remainder = line[m.end():].strip()
            if remainder:
                cur_text_parts.append(remainder)
            continue
        # Continuation line
        if cur_speaker is not None:
            cur_text_parts.append(line.strip())
            continue
        # Unattributed leading prose (e.g. interview-header metadata).
        # Skip it — these don't fit the cue structure.
        continue
    flush_current_cue()
    return cues


def split_long_cue(cue: dict, max_duration_s: float = MAX_CUE_DURATION_S,
                   wps: float = WORDS_PER_SECOND_NORMAL) -> list[dict]:
    """Split a cue whose synthesized duration would exceed `max_duration_s`
    into multiple sub-cues at sentence boundaries (or word boundaries if no
    sentences are available)."""
    target_words = int(max_duration_s * wps)
    if cue["word_count"] <= target_words:
        return [cue]
    # Try sentence-boundary splits first
    sentences = re.split(r"(?<=[.!?])\s+", cue["text"])
    chunks: list[list[str]] = []
    current: list[str] = []
    current_words = 0
    for sentence in sentences:
        s_words = len(sentence.split())
        if current_words + s_words > target_words and current:
            chunks.append(current)
            current = [sentence]
            current_words = s_words
        else:
            current.append(sentence)
            current_words += s_words
    if current:
        chunks.append(current)
    if all(sum(len(s.split()) for s in chunk) <= target_words for chunk in chunks):
        return [{
            "speaker": cue["speaker"],
            "text": " ".join(chunk).strip(),
            "word_count": sum(len(s.split()) for s in chunk),
        } for chunk in chunks if chunk]
    # Sentence-split didn't help (one sentence too long); split at word boundary
    words = cue["text"].split()
    out: list[dict] = []
    for i in range(0, len(words), target_words):
        sub = words[i:i + target_words]
        out.append({
            "speaker": cue["speaker"],
            "text": " ".join(sub),
            "word_count": len(sub),
        })
    return out


def cue_to_timestamp(seconds: float) -> str:
    """Format seconds as SRT timestamp (HH:MM:SS,mmm)."""
    total_ms = int(round(seconds * 1000))
    hh = total_ms // 3600000
    mm = (total_ms % 3600000) // 60000
    ss = (total_ms % 60000) // 1000
    ms = total_ms % 1000
    return f"{hh:02d}:{mm:02d}:{ss:02d},{ms:03d}"


def synthesize_timestamps(cues: list[dict], wps: float = WORDS_PER_SECOND_NORMAL) -> list[dict]:
    """Walk cues in order; assign start_s/end_s based on cumulative word position
    and the speaking-rate heuristic."""
    out: list[dict] = []
    elapsed = 0.0
    for cue in cues:
        duration = cue["word_count"] / wps
        if duration < MIN_CUE_DURATION_S:
            duration = MIN_CUE_DURATION_S
        start_s = elapsed
        end_s = elapsed + duration
        out.append({
            **cue,
            "start_s": start_s,
            "end_s": end_s,
            "duration_s": duration,
        })
        elapsed = end_s
    return out


def write_srt(cues: list[dict], path: Path) -> None:
    lines: list[str] = []
    for i, cue in enumerate(cues, 1):
        lines.append(str(i))
        lines.append(f"{cue_to_timestamp(cue['start_s'])} --> {cue_to_timestamp(cue['end_s'])}")
        lines.append(cue["text"])
        lines.append("")
    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def write_vtt(cues: list[dict], path: Path) -> None:
    lines: list[str] = ["WEBVTT", ""]
    for cue in cues:
        # VTT uses period instead of comma for milliseconds separator
        start = cue_to_timestamp(cue["start_s"]).replace(",", ".")
        end = cue_to_timestamp(cue["end_s"]).replace(",", ".")
        lines.append(f"{start} --> {end}")
        lines.append(cue["text"])
        lines.append("")
    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def write_txt(cues: list[dict], path: Path) -> None:
    """Continuous-line format matching the existing raw/.txt convention."""
    parts = [cue["text"] for cue in cues]
    path.write_text(" " + " ".join(parts), encoding="utf-8")


def write_summary(subject: str, cues: list[dict], path: Path) -> None:
    total_words = sum(c["word_count"] for c in cues)
    total_seconds = cues[-1]["end_s"] if cues else 0
    minutes = int(total_seconds // 60)
    summary = (
        f"Interview transcript for {subject}.\n"
        f"Source: student-batch Whisper-from-YouTube (ingested 2026-05-25 via text-only adapter).\n"
        f"Cues: {len(cues)}\n"
        f"Total words: {total_words}\n"
        f"Estimated duration: ~{minutes} minutes (synthesized from speaking-rate heuristic, not authoritative).\n"
        f"\n"
        f"Synthesized timestamps note: this transcript was ingested from a plain-text "
        f"Whisper-from-YouTube source with no audio timing. The .srt and .vtt files carry "
        f"timestamps derived from a ~150-words-per-minute speaking-rate heuristic. They are "
        f"suitable for search/retrieval and chapter-level navigation; they are NOT precise "
        f"enough for fine-grained clip extraction by the playlist generator. If audio for "
        f"this interview becomes available, re-run Whisper with the project's standard "
        f"toolchain to replace these synthesized timestamps with real audio-derived ones.\n"
    )
    path.write_text(summary, encoding="utf-8")


def safe_filename_component(s: str) -> str:
    """Make a string safe for use in a file/directory name. Preserves spaces."""
    s = s.replace("/", "-").replace("\\", "-").replace(":", "")
    s = re.sub(r"[\r\n\t]+", " ", s).strip()
    return s


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_txt", help="path to the student-batch .txt file")
    parser.add_argument("output_dir", help="where to create the new raw/<entry>/ directory (parent path)")
    parser.add_argument("--subject", required=True,
                        help="canonical subject name (e.g., 'Alfred Moldovan')")
    parser.add_argument("--date", default=None,
                        help="ingestion date YYYYMMDD (default: today)")
    parser.add_argument("--time", default=None,
                        help="ingestion timestamp HHMMSS (default: current time)")
    args = parser.parse_args(argv)

    src = Path(args.source_txt)
    if not src.is_file():
        print(f"source file not found: {src}", file=sys.stderr)
        return 1

    today = args.date or datetime.now().strftime("%Y%m%d")
    timestamp = args.time or datetime.now().strftime("%H%M%S")

    subject_clean = safe_filename_component(args.subject)
    entry_dir_name = f"{subject_clean}_interview_{today}_{timestamp}"
    entry_dir = Path(args.output_dir) / entry_dir_name
    entry_dir.mkdir(parents=True, exist_ok=True)

    print(f"Ingesting {src.name}")
    print(f"  -> {entry_dir}")

    text = src.read_text(encoding="utf-8", errors="replace")
    cues = parse_text_into_cues(text)
    print(f"  parsed {len(cues)} speaker-turn cues")

    # Split overly long cues
    final_cues: list[dict] = []
    for c in cues:
        final_cues.extend(split_long_cue(c))
    if len(final_cues) != len(cues):
        print(f"  split long cues -> {len(final_cues)} total")

    timed_cues = synthesize_timestamps(final_cues)
    if not timed_cues:
        print(f"  [error] no cues parsed from {src.name}; aborting", file=sys.stderr)
        return 2

    base_filename = f"{subject_clean}_interview_transcript_{today}_{timestamp}"
    srt_path = entry_dir / f"{base_filename}.srt"
    txt_path = entry_dir / f"{base_filename}.txt"
    vtt_path = entry_dir / f"{base_filename}.vtt"
    summary_path = entry_dir / f"{subject_clean}_interview_summary_{today}_{timestamp}.txt"

    write_srt(timed_cues, srt_path)
    write_vtt(timed_cues, vtt_path)
    write_txt(timed_cues, txt_path)
    write_summary(args.subject, timed_cues, summary_path)

    total_duration = timed_cues[-1]["end_s"]
    total_words = sum(c["word_count"] for c in timed_cues)
    print(f"  wrote {len(timed_cues)} cues; total_words={total_words}; "
          f"estimated_duration={int(total_duration // 60)}m {int(total_duration % 60)}s")
    print(f"  entry_dir_name: {entry_dir_name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
