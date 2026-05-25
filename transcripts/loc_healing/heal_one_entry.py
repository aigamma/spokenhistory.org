"""
Per-entry Pass 8 LoC-healing toolkit.

Workflow per entry:
  phase1: parse the cached LoC XML + the corrected/<entry>/.srt; word-align both;
          emit a divergence list to transcripts/loc_healing/divergences/<entry>.json
  apply:  read the verdicts JSON produced by classification; surgically apply the
          ASR_ERROR_HEAL verdicts to the corrected/<entry>/.srt / .txt / .vtt files
          within existing cue boundaries; update manifest.json's loc_healing section;
          write transcripts/pass8_stage/entry_<NNN>_<slug>.md
  verify: read the post-apply files and confirm cue counts unchanged, healed tokens
          present.

CLI:
  python heal_one_entry.py phase1 <entry_dir_name>
  python heal_one_entry.py apply  <entry_dir_name>  <verdicts_json_path>
  python heal_one_entry.py verify <entry_dir_name>

Linear by design — no concurrency, no parallel subagents. One entry per invocation.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import html
from dataclasses import dataclass, field, asdict
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TRANSCRIPTS = ROOT / "transcripts"
CORRECTED_DIR = TRANSCRIPTS / "corrected"
RAW_DIR = TRANSCRIPTS / "raw"
LOC_CACHE = TRANSCRIPTS / "loc_healing" / "loc_cache"
DIVERGENCES_DIR = TRANSCRIPTS / "loc_healing" / "divergences"
PASS8_STAGE = TRANSCRIPTS / "pass8_stage"


def parse_entry_dir(entry_dir_name: str) -> dict:
    """Return paths + metadata for an entry directory."""
    entry_path = CORRECTED_DIR / entry_dir_name
    if not entry_path.is_dir():
        raise SystemExit(f"Entry directory not found: {entry_path}")

    # Pull the subject from the dir name
    m = re.match(r"^(.*?)_interview_\d{8}_\d{6}$", entry_dir_name)
    if not m:
        raise SystemExit(f"Cannot parse subject from {entry_dir_name!r}")
    subject = m.group(1)
    subj_safe = re.sub(r"[^A-Za-z0-9_]+", "_", subject)

    # Locate the SRT / TXT / VTT files
    srt = None
    txt = None
    vtt = None
    manifest = None
    for f in entry_path.iterdir():
        if f.suffix == ".srt":
            srt = f
        elif f.suffix == ".txt":
            txt = f
        elif f.suffix == ".vtt":
            vtt = f
        elif f.name == "manifest.json":
            manifest = f
    if not (srt and txt and vtt and manifest):
        raise SystemExit(f"Missing expected file in {entry_path}: srt={srt} txt={txt} vtt={vtt} manifest={manifest}")

    return {
        "entry_dir": entry_path,
        "subject": subject,
        "subj_safe": subj_safe,
        "srt": srt,
        "txt": txt,
        "vtt": vtt,
        "manifest": manifest,
        "loc_xml": LOC_CACHE / f"{subj_safe}.xml",
        "loc_resolution": LOC_CACHE / f"{subj_safe}.resolution.json",
        "divergences_path": DIVERGENCES_DIR / f"{subj_safe}.divergences.json",
        "stage_path": None,  # filled in phase1 from entry_number
    }


# ---------------------------------------------------------------------------
# LoC XML parsing
# ---------------------------------------------------------------------------

SPEAKER_LABEL_RE = re.compile(r"^([A-Z][A-Za-z\.\-\' ]{1,40}?):\s")
HEADER_FIELDS = {"Interview Date", "Interviewee", "Interviewer", "Videographer",
                 "Location", "Length", "Date", "Interviewees", "Length of interview"}


# Unicode normalization map for fair comparison between LoC's edited prose and
# our Whisper-derived text. LoC uses smart-quote / em-dash characters that
# would otherwise show up as divergences purely on encoding grounds.
_UNICODE_REPLACEMENTS = {
    "‘": "'",   # left single quotation mark
    "’": "'",   # right single quotation mark
    "“": '"',   # left double quotation mark
    "”": '"',   # right double quotation mark
    "–": "-",   # en dash
    "—": "-",   # em dash
    "…": "...", # horizontal ellipsis
    " ": " ",   # non-breaking space
    "ʼ": "'",   # modifier letter apostrophe
    "�": "",    # replacement char (UTF-8 decode failure)
}


def normalize_unicode(text: str) -> str:
    """Replace smart quotes / em-dashes / etc. with their ASCII equivalents."""
    out = text
    for src, dst in _UNICODE_REPLACEMENTS.items():
        out = out.replace(src, dst)
    return out


def parse_loc_xml(xml_path: Path) -> list[dict]:
    """Return [{'speaker': 'David Cline', 'text': '...', 'words': [...]}, ...].

    Skips the LoC TEI2 header block (Civil Rights History Project / Interview completed
    by ... / Smithsonian Institution / Interviewee: X / Interview Date: ... / etc.).
    Alignment begins at the first speaker-attributed turn in the body of the transcript.
    """
    raw = xml_path.read_text(encoding="utf-8", errors="replace")
    raw = normalize_unicode(raw)
    paragraphs = re.findall(r"<p>(.*?)</p>", raw, flags=re.DOTALL)
    turns = []
    seen_first_speaker_turn = False
    for p in paragraphs:
        clean = html.unescape(re.sub(r"<[^>]+>", " ", p))
        clean = re.sub(r"\s+", " ", clean).strip()
        if not clean:
            continue
        m = SPEAKER_LABEL_RE.match(clean)
        if m:
            speaker = m.group(1).strip()
            text = clean[m.end():].strip()
        else:
            speaker = None
            text = clean
        # Skip header metadata fields ("Interview Date: ...", "Length: ...", etc.)
        if speaker in HEADER_FIELDS:
            continue
        # Skip leading non-speaker paragraphs (Civil Rights History Project / Interview
        # completed by / etc.). Once we see the first proper speaker turn, all
        # subsequent paragraphs are body content.
        if not seen_first_speaker_turn:
            if speaker is None:
                continue
            seen_first_speaker_turn = True
        words = tokenize(text)
        if not words:
            continue
        turns.append({"speaker": speaker, "text": text, "words": words})
    return turns


# ---------------------------------------------------------------------------
# Our SRT parsing
# ---------------------------------------------------------------------------


@dataclass
class Cue:
    index: int
    timestamp_line: str
    text_lines: list[str]
    words: list[str] = field(default_factory=list)
    start_word_pos: int = 0  # position in flat word stream
    end_word_pos: int = 0


def parse_srt(srt_path: Path) -> list[Cue]:
    """Parse SRT into cues. Whitespace-tolerant. Normalizes smart-quote characters
    in cue text for fair alignment with LoC's TEI2 XML."""
    content = srt_path.read_text(encoding="utf-8", errors="replace")
    cues: list[Cue] = []
    blocks = re.split(r"\r?\n\r?\n", content.strip())
    for block in blocks:
        lines = block.splitlines()
        if len(lines) < 2:
            continue
        # Find index line
        idx = None
        ts_line_pos = None
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.isdigit() and ts_line_pos is None:
                idx = int(stripped)
            if "-->" in stripped:
                ts_line_pos = i
                break
        if ts_line_pos is None or idx is None:
            continue
        timestamp_line = lines[ts_line_pos]
        text_lines = [normalize_unicode(line) for line in lines[ts_line_pos + 1:]]
        cue = Cue(index=idx, timestamp_line=timestamp_line.strip(), text_lines=text_lines)
        cues.append(cue)
    return cues


def tokenize(text: str) -> list[str]:
    """Lightweight whitespace tokenizer — keeps punctuation attached for fidelity."""
    return [w for w in re.split(r"\s+", text.strip()) if w]


def cues_to_word_stream(cues: list[Cue]) -> list[str]:
    """Flatten cues into a single word stream + populate per-cue word positions."""
    pos = 0
    stream: list[str] = []
    for cue in cues:
        text = " ".join(cue.text_lines).strip()
        words = tokenize(text)
        cue.words = words
        cue.start_word_pos = pos
        cue.end_word_pos = pos + len(words)
        stream.extend(words)
        pos += len(words)
    return stream


# ---------------------------------------------------------------------------
# Word alignment / divergence detection
# ---------------------------------------------------------------------------


def normalize_token(w: str) -> str:
    """Lowercase + strip surrounding punctuation for matching purposes."""
    return re.sub(r"^[\W_]+|[\W_]+$", "", w.lower())


def align_streams(ours: list[str], theirs: list[str]) -> list[dict]:
    """Word-level alignment using difflib.SequenceMatcher on normalized tokens.

    Returns a list of divergence records:
      { 'op': 'replace'|'delete'|'insert', 'ours_span': (i1, i2), 'theirs_span': (j1, j2),
        'ours_tokens': [...], 'theirs_tokens': [...] }
    """
    ours_norm = [normalize_token(w) for w in ours]
    theirs_norm = [normalize_token(w) for w in theirs]
    sm = SequenceMatcher(a=ours_norm, b=theirs_norm, autojunk=False)
    divs = []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            continue
        divs.append({
            "op": op,
            "ours_span": (i1, i2),
            "theirs_span": (j1, j2),
            "ours_tokens": ours[i1:i2],
            "theirs_tokens": theirs[j1:j2],
        })
    return divs


def context_window(stream: list[str], i1: int, i2: int, n: int = 8) -> str:
    """Return ``n`` words before + the span + ``n`` words after, joined with space."""
    start = max(0, i1 - n)
    end = min(len(stream), i2 + n)
    return " ".join(stream[start:end])


# ---------------------------------------------------------------------------
# Deterministic pre-classification (no model call needed)
# ---------------------------------------------------------------------------

# Common English contractions and their expansions (matched bidirectionally).
_CONTRACTION_PAIRS = [
    ("we're", "we are"), ("we'd", "we would"), ("we'll", "we will"), ("we've", "we have"),
    ("you're", "you are"), ("you'd", "you would"), ("you'll", "you will"), ("you've", "you have"),
    ("they're", "they are"), ("they'd", "they would"), ("they'll", "they will"), ("they've", "they have"),
    ("he's", "he is"), ("he'd", "he would"), ("he'll", "he will"),
    ("she's", "she is"), ("she'd", "she would"), ("she'll", "she will"),
    ("it's", "it is"), ("it'd", "it would"), ("it'll", "it will"),
    ("i'm", "i am"), ("i'd", "i would"), ("i'll", "i will"), ("i've", "i have"),
    ("don't", "do not"), ("doesn't", "does not"), ("didn't", "did not"),
    ("won't", "will not"), ("wouldn't", "would not"),
    ("can't", "cannot"), ("couldn't", "could not"),
    ("shouldn't", "should not"), ("isn't", "is not"), ("aren't", "are not"),
    ("wasn't", "was not"), ("weren't", "were not"),
    ("hasn't", "has not"), ("haven't", "have not"), ("hadn't", "had not"),
    ("let's", "let us"), ("that's", "that is"), ("there's", "there is"),
    ("what's", "what is"), ("who's", "who is"), ("here's", "here is"),
    ("how's", "how is"), ("when's", "when is"), ("where's", "where is"),
    ("y'all", "you all"),
]


def _norm_seq(tokens: list[str]) -> str:
    """Lowercased + punctuation-stripped joined string for comparison."""
    return " ".join(normalize_token(t) for t in tokens if normalize_token(t))


def _contraction_form(tokens: list[str], expansion: str) -> bool:
    """Does this token sequence match a contraction or its expansion?"""
    joined = _norm_seq(tokens)
    return joined == expansion


_SENTENCE_START_COMMON = {
    "And", "The", "But", "So", "It", "He", "She", "I", "We", "You", "They",
    "Yes", "No", "Now", "Then", "Well", "What", "When", "Where", "Why", "How",
    "This", "That", "These", "Those", "There", "Here", "Today", "Yesterday",
    "Tomorrow", "Tonight", "Okay", "OK", "Alright", "Of", "Or", "If", "Just",
    "Like", "About", "After", "Before", "From", "To", "On", "In", "At", "By",
    "For", "With", "Without", "Through", "Into", "Out", "Up", "Down", "Over",
    "Under", "All", "Some", "Any", "Each", "Every", "Both", "Many", "Most",
    "Other", "Another", "Such", "Same", "Only", "Even", "Also", "Too", "Very",
    "Mr", "Mrs", "Ms", "Dr", "Mr.", "Mrs.", "Ms.", "Dr.",
    "American", "African", "Black", "White",  # too generic for ASR healing
}

_DISFLUENCY_WORDS = {"uh", "um", "er", "ah", "mm", "hmm", "huh", "eh",
                     "okay", "ok", "right", "yeah", "yes", "no", "well"}

_COMMON_FUNCTION_WORDS = {"and", "the", "a", "an", "but", "so", "or", "if",
                          "of", "in", "on", "at", "by", "for", "to", "with",
                          "is", "was", "were", "are", "be", "been", "being",
                          "has", "have", "had", "do", "does", "did",
                          "you", "i", "we", "they", "he", "she", "it",
                          "this", "that", "these", "those",
                          "my", "your", "his", "her", "our", "their",
                          "as", "from", "into", "over", "out", "up", "down"}


def _seq_ratio(a: str, b: str) -> float:
    """SequenceMatcher ratio in [0, 1] for two strings."""
    if not a or not b:
        return 0.0
    return SequenceMatcher(a=a, b=b, autojunk=False).ratio()


def looks_like_asr_proper_noun_error(ours_tokens: list[str], theirs_tokens: list[str]) -> tuple[bool, str]:
    """Conservative heuristic: a single capitalized-word vs single capitalized-word
    divergence where the two words are similar enough to be a Whisper phonetic
    mistake but different enough not to be a case-only difference.
    """
    if len(ours_tokens) != 1 or len(theirs_tokens) != 1:
        return False, ""
    o = ours_tokens[0].strip(".,;:!?\"'()[]{}")
    t = theirs_tokens[0].strip(".,;:!?\"'()[]{}")
    if not o or not t:
        return False, ""
    if not (o[:1].isupper() and t[:1].isupper()):
        return False, ""
    if o.lower() == t.lower():
        return False, "case-only differs"
    if o in _SENTENCE_START_COMMON or t in _SENTENCE_START_COMMON:
        return False, "common-word at sentence start"
    ratio = _seq_ratio(o.lower(), t.lower())
    if ratio < 0.55:
        return False, f"similarity {ratio:.2f} below 0.55"
    if ratio >= 0.95:
        # Nearly identical — case-only or orthography
        return False, f"similarity {ratio:.2f} too close (probably orthography)"
    return True, f"single capitalized-word ASR phonetic substitution (similarity {ratio:.2f})"


def _is_loc_bracketed_stage_direction(tokens: list[str]) -> bool:
    """LoC's editors mark inaudible / stage directions with brackets:
    [crosstalk], [inaudible], [laughs], [clears throat]."""
    joined = " ".join(tokens)
    return bool(re.search(r"\[[^\]]+\]", joined))


def _is_hyphenated_false_start(tokens: list[str]) -> bool:
    """LoC retains some false-start hyphenations like 'My-let' or 'just-is'.
    Pattern: word containing a hyphen between two alpha tokens, where the
    pre-hyphen portion is 1-4 characters."""
    for tok in tokens:
        if not re.fullmatch(r"[A-Za-z]{1,4}-[A-Za-z]+", tok):
            continue
        return True
    return False


def _all_common_function_words(tokens: list[str]) -> bool:
    """All tokens (after normalization) are common English function words."""
    if not tokens:
        return False
    for t in tokens:
        n = normalize_token(t)
        if not n:
            continue
        if n not in _COMMON_FUNCTION_WORDS:
            return False
    return True


def deterministic_verdict(ours_tokens: list[str], theirs_tokens: list[str],
                          audit_canon: set[str] | None = None) -> tuple[str, str] | None:
    """Pre-classify common patterns without a model call.

    Returns (verdict_label, reasoning) or None if the divergence requires a model judgment.

    ``audit_canon`` is the lowercased set of tokens that have been promoted to Correction
    values by prior audit passes for this entry. Auto-heal proposals where our token is
    already in the audit canon are skipped (would reverse a confirmed audit decision).
    """
    audit_canon = audit_canon or set()
    ours_n = _norm_seq(ours_tokens)
    theirs_n = _norm_seq(theirs_tokens)

    # LoC stage-direction insertion ([crosstalk], [inaudible], [laughs]) -- runs
    # BEFORE the ASR-error check so "[crosstalk]" tokens never reach it.
    if _is_loc_bracketed_stage_direction(theirs_tokens):
        return ("SPEAKER_DISFLUENCY",
                "LoC inserted a bracketed stage direction (crosstalk / inaudible / laughs); preserve our verbatim")

    # LoC false-start hyphenation ("M-let", "j-just"). Runs BEFORE the ASR-error
    # check so the false-start tokens don't get caught as proper-noun substitutions.
    if _is_hyphenated_false_start(theirs_tokens):
        return ("EDITORIAL_SMOOTHING",
                "LoC retained a false-start hyphenation; our verbatim is the smoother form")

    # Identical after normalization — punctuation/case only
    if ours_n == theirs_n and ours_n:
        return ("EDITORIAL_SMOOTHING",
                "punctuation/case-only difference; ours and LoC say the same word(s) modulo orthography")

    # ASR error on a proper-noun-class single word — heal toward LoC ONLY when
    # our token is not already an audit-canonized form (otherwise we'd reverse
    # a confirmed prior audit decision).
    looks_asr, asr_reason = looks_like_asr_proper_noun_error(ours_tokens, theirs_tokens)
    if looks_asr:
        ours_token_norm = normalize_token(ours_tokens[0])
        if ours_token_norm in audit_canon:
            return ("UNCLEAR",
                    f"LoC differs from our audit-canonized token ({ours_token_norm!r}); "
                    f"prior pass promoted this spelling, do not auto-reverse without SME review")
        return ("ASR_ERROR_HEAL", asr_reason)

    # LoC stage-direction insertion ([crosstalk], [inaudible], [laughs])
    if _is_loc_bracketed_stage_direction(theirs_tokens):
        return ("SPEAKER_DISFLUENCY",
                "LoC inserted a bracketed stage direction (crosstalk / inaudible / laughs); preserve our verbatim")

    # LoC false-start hyphenation (M-let, j-just) — editorial artifact of LoC's
    # transcript style; preserve our verbatim
    if _is_hyphenated_false_start(theirs_tokens):
        return ("EDITORIAL_SMOOTHING",
                "LoC retained a false-start hyphenation; our verbatim is the smoother form")

    # Insert or delete of <=2 common function words — editorial smoothing
    if not ours_n and len(theirs_tokens) <= 2 and _all_common_function_words(theirs_tokens):
        return ("EDITORIAL_SMOOTHING",
                f"LoC editor added function word(s) ({theirs_n}); preserve our verbatim")
    if not theirs_n and len(ours_tokens) <= 2 and _all_common_function_words(ours_tokens):
        return ("EDITORIAL_SMOOTHING",
                f"LoC editor dropped function word(s) ({ours_n}); preserve our verbatim")

    # Contraction pairs (either direction)
    for short, long_ in _CONTRACTION_PAIRS:
        if (ours_n == short and theirs_n == long_) or (ours_n == long_ and theirs_n == short):
            return ("EDITORIAL_SMOOTHING",
                    f"contraction-expansion editorial difference ({short!r} <-> {long_!r}); preserve verbatim speaker form")

    # Number <-> spelled-out form ("11th" vs "eleventh", "1965" vs "nineteen sixty-five")
    NUMBERS_ORDINAL = {
        "1st": "first", "2nd": "second", "3rd": "third", "4th": "fourth", "5th": "fifth",
        "6th": "sixth", "7th": "seventh", "8th": "eighth", "9th": "ninth", "10th": "tenth",
        "11th": "eleventh", "12th": "twelfth", "13th": "thirteenth", "14th": "fourteenth",
        "15th": "fifteenth", "16th": "sixteenth", "17th": "seventeenth", "18th": "eighteenth",
        "19th": "nineteenth", "20th": "twentieth", "21st": "twenty-first",
    }
    NUMBERS_CARDINAL = {
        "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
        "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten",
        "11": "eleven", "12": "twelve", "13": "thirteen", "14": "fourteen",
        "15": "fifteen", "16": "sixteen", "17": "seventeen", "18": "eighteen",
        "19": "nineteen", "20": "twenty", "30": "thirty", "40": "forty", "50": "fifty",
        "60": "sixty", "70": "seventy", "80": "eighty", "90": "ninety", "100": "one hundred",
    }
    if (NUMBERS_ORDINAL.get(ours_n) == theirs_n or NUMBERS_ORDINAL.get(theirs_n) == ours_n or
        NUMBERS_CARDINAL.get(ours_n) == theirs_n or NUMBERS_CARDINAL.get(theirs_n) == ours_n):
        return ("EDITORIAL_SMOOTHING",
                "number/word editorial difference; preserve verbatim form spoken in the interview")

    # Year range / decade renderings ("1960's" vs "1960s", "60's" vs "sixties")
    if re.match(r"^\d{4}'?s?$", ours_n.replace(" ", "")) and re.match(r"^\d{4}'?s?$", theirs_n.replace(" ", "")):
        if ours_n.replace("'", "") == theirs_n.replace("'", ""):
            return ("EDITORIAL_SMOOTHING", "year orthography ('1960's vs 1960s)")

    # Disfluency on our side, dropped on LoC side (LoC's editor removed "uh", "um",
    # repetitions, false starts). If theirs is empty (delete from our perspective)
    # and ours is just "uh"/"um"/"er"/"ah"/"you know", classify as SPEAKER_DISFLUENCY.
    DISFLUENCIES = {"uh", "um", "er", "ah", "mm", "hmm", "you know", "i mean",
                    "like", "well", "so"}
    if not theirs_n and ours_n in DISFLUENCIES:
        return ("SPEAKER_DISFLUENCY",
                f"LoC's edited prose dropped speaker disfluency {ours_n!r}; preserve verbatim")

    # Empty-vs-empty (shouldn't really happen, but defensive)
    if not ours_n and not theirs_n:
        return ("EDITORIAL_SMOOTHING", "punctuation-only difference (both normalize to empty)")

    # Otherwise: needs model judgment
    return None


def locate_cues(cues: list[Cue], i1: int, i2: int) -> list[int]:
    """Return cue indices (1-based, as in SRT) whose word range overlaps [i1, i2)."""
    hits = []
    for cue in cues:
        if cue.start_word_pos < i2 and cue.end_word_pos > i1:
            hits.append(cue.index)
    return hits


# ---------------------------------------------------------------------------
# Phase 1 — emit divergence list
# ---------------------------------------------------------------------------


def phase1(entry_dir_name: str) -> int:
    DIVERGENCES_DIR.mkdir(parents=True, exist_ok=True)
    info = parse_entry_dir(entry_dir_name)
    if not info["loc_xml"].is_file():
        print(f"  [skip] no LoC XML cached: {info['loc_xml']}")
        return 1
    if not info["loc_resolution"].is_file():
        print(f"  [skip] no LoC resolution: {info['loc_resolution']}")
        return 1
    resolution = json.loads(info["loc_resolution"].read_text(encoding="utf-8"))

    cues = parse_srt(info["srt"])
    if not cues:
        print(f"  [skip] no cues parsed: {info['srt']}")
        return 1
    our_stream = cues_to_word_stream(cues)

    loc_turns = parse_loc_xml(info["loc_xml"])
    loc_stream = []
    for t in loc_turns:
        loc_stream.extend(t["words"])

    divs = align_streams(our_stream, loc_stream)

    # Filter "noise" divergences: pure whitespace, single-char punctuation diffs, etc.
    filtered = []
    for d in divs:
        ours_normed = " ".join(normalize_token(w) for w in d["ours_tokens"] if normalize_token(w))
        theirs_normed = " ".join(normalize_token(w) for w in d["theirs_tokens"] if normalize_token(w))
        if ours_normed == theirs_normed and ours_normed:
            # purely punctuation differences — skip
            continue
        filtered.append(d)

    # Build audit-canon set for this entry to gate proper-noun heal decisions
    entry_number = guess_entry_number(info["subject"])
    audit_canon = get_audit_canon_set(entry_number) if entry_number else set()

    # Decorate with cue context + deterministic pre-classification
    enriched = []
    det_counts = {"EDITORIAL_SMOOTHING": 0, "SPEAKER_DISFLUENCY": 0, "ASR_ERROR_HEAL": 0, "UNCLEAR": 0}
    needs_model = 0
    for d in filtered:
        i1, i2 = d["ours_span"]
        j1, j2 = d["theirs_span"]
        cue_hits = locate_cues(cues, i1, i2)
        det = deterministic_verdict(d["ours_tokens"], d["theirs_tokens"], audit_canon=audit_canon)
        rec = {
            "id": len(enriched) + 1,
            "op": d["op"],
            "ours_tokens": d["ours_tokens"],
            "theirs_tokens": d["theirs_tokens"],
            "ours_context": context_window(our_stream, i1, i2, n=8),
            "theirs_context": context_window(loc_stream, j1, j2, n=8),
            "cue_indices": cue_hits,
            "ours_span": list(d["ours_span"]),
            "theirs_span": list(d["theirs_span"]),
        }
        if det is not None:
            rec["deterministic_verdict"] = det[0]
            rec["deterministic_reasoning"] = det[1]
            det_counts[det[0]] += 1
        else:
            needs_model += 1
        enriched.append(rec)

    out = {
        "subject": info["subject"],
        "entry_dir": entry_dir_name,
        "loc_item_url": resolution.get("loc_item_url"),
        "loc_xml_url": resolution.get("loc_xml_url"),
        "loc_match_score": resolution.get("match_score"),
        "our_word_count": len(our_stream),
        "loc_word_count": len(loc_stream),
        "cue_count": len(cues),
        "loc_turn_count": len(loc_turns),
        "divergence_count": len(enriched),
        "deterministic_pre_classified_count": sum(det_counts.values()),
        "needs_model_classification": needs_model,
        "deterministic_breakdown": det_counts,
        "divergences": enriched,
    }
    info["divergences_path"].parent.mkdir(parents=True, exist_ok=True)
    info["divergences_path"].write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  Phase 1 wrote {len(enriched)} divergences -> {info['divergences_path']}")
    print(f"    our_words={len(our_stream)}  loc_words={len(loc_stream)}  cues={len(cues)}  loc_turns={len(loc_turns)}")
    return 0


# ---------------------------------------------------------------------------
# Apply — surgical heal within cue boundaries
# ---------------------------------------------------------------------------


def apply_heal_to_cue(cue: Cue, ours_tokens: list[str], theirs_tokens: list[str]) -> tuple[bool, str]:
    """Replace the first occurrence of ``ours_tokens`` (as a contiguous sequence,
    case-insensitive on normalized tokens) within ``cue.text_lines`` with the
    rendered ``theirs_tokens``. Returns (changed, reasoning).

    Edits the cue's text_lines in-place by joining + re-splitting.
    """
    if not ours_tokens:
        return False, "empty ours_tokens"
    joined = " ".join(cue.text_lines).strip()
    cue_words = tokenize(joined)
    cue_norm = [normalize_token(w) for w in cue_words]
    target_norm = [normalize_token(w) for w in ours_tokens]
    target_len = len(target_norm)
    if target_len == 0:
        return False, "no normalizable tokens in ours"
    # Find a contiguous match
    match_at = None
    for i in range(len(cue_norm) - target_len + 1):
        if cue_norm[i:i+target_len] == target_norm:
            match_at = i
            break
    if match_at is None:
        return False, f"target sequence not found in cue {cue.index}"
    # Replace the matched slice with theirs_tokens (preserve their casing)
    new_cue_words = cue_words[:match_at] + theirs_tokens + cue_words[match_at+target_len:]
    cue.text_lines = [" ".join(new_cue_words)]
    return True, f"healed in cue {cue.index} at word offset {match_at}"


def apply_heals(entry_dir_name: str, verdicts_path: Path | None = None) -> int:
    """Apply heal decisions to corrected/<entry>/.srt|txt|vtt.

    Two modes:
      - If ``verdicts_path`` is provided: read explicit verdicts JSON (one entry per
        divergence id with a verdict label). Used by the future model-classification flow.
      - If ``verdicts_path`` is None: use the deterministic verdicts embedded in the
        divergences JSON by phase1. Divergences without a deterministic verdict are
        treated as ``NEEDS_SME_REVIEW`` and preserved verbatim. This is the conservative
        first-pass behavior — only well-classified deterministic heals are applied.
    """
    info = parse_entry_dir(entry_dir_name)
    if not info["divergences_path"].is_file():
        print(f"  [error] missing divergences file: {info['divergences_path']}")
        return 2
    divergences = json.loads(info["divergences_path"].read_text(encoding="utf-8"))

    # Optional explicit verdicts (for future model-classification path)
    explicit_verdicts: dict[int, dict] = {}
    if verdicts_path and verdicts_path.is_file():
        verdicts_blob = json.loads(verdicts_path.read_text(encoding="utf-8"))
        explicit_verdicts = {v["id"]: v for v in verdicts_blob.get("verdicts", verdicts_blob)}

    cues = parse_srt(info["srt"])
    cues_by_idx = {c.index: c for c in cues}

    applied = []
    failed = []
    preserved = []
    unresolved = []
    for d in divergences["divergences"]:
        # Decide verdict source: explicit > deterministic > NEEDS_SME_REVIEW
        if d["id"] in explicit_verdicts:
            vlabel = explicit_verdicts[d["id"]]["verdict"].upper()
            reasoning = explicit_verdicts[d["id"]].get("reasoning", "")
        elif "deterministic_verdict" in d:
            vlabel = d["deterministic_verdict"]
            reasoning = d.get("deterministic_reasoning", "")
        else:
            vlabel = "NEEDS_SME_REVIEW"
            reasoning = "no deterministic verdict; flagged for SME review (no model classification in this pass)"

        record = {**d, "verdict": vlabel, "reasoning": reasoning}

        if vlabel == "ASR_ERROR_HEAL":
            # Apply
            cue_indices = d["cue_indices"]
            if not cue_indices:
                failed.append({**record, "fail_reason": "no cue indices"})
                continue
            success = False
            for cidx in cue_indices:
                cue = cues_by_idx.get(cidx)
                if cue is None:
                    continue
                changed, why = apply_heal_to_cue(cue, d["ours_tokens"], d["theirs_tokens"])
                if changed:
                    record["applied_in_cue"] = cidx
                    record["apply_note"] = why
                    applied.append(record)
                    success = True
                    break
            if not success:
                failed.append({**record, "fail_reason": "not found in any cue"})
        elif vlabel == "UNCLEAR" or vlabel == "NEEDS_SME_REVIEW":
            unresolved.append(record)
        else:
            # EDITORIAL_SMOOTHING, SPEAKER_DISFLUENCY, or any other "preserve" label
            preserved.append(record)

    # Write the modified SRT (only changed if any heals applied)
    write_srt(info["srt"], cues)
    # Regenerate VTT from SRT (the two are 1:1 in cue structure; SRT writes win)
    regenerate_vtt(info["srt"], info["vtt"])
    # Apply heals to TXT in-place via text substitution (preserves original
    # continuous-line format of the raw Whisper output).
    heal_pairs = [(" ".join(r["ours_tokens"]), " ".join(r["theirs_tokens"])) for r in applied]
    apply_text_substitutions(info["txt"], heal_pairs)

    # Update manifest
    update_manifest(info["manifest"], divergences, applied, preserved, unresolved, failed)

    # Write the stage file
    write_stage_file(info, divergences, applied, preserved, unresolved, failed)

    print(f"  Apply complete:")
    print(f"    applied (healed):    {len(applied)}")
    print(f"    preserved verbatim:  {len(preserved)}")
    print(f"    unresolved (review): {len(unresolved)}")
    print(f"    apply failures:      {len(failed)}")
    return 0 if not failed else 3


# ---------------------------------------------------------------------------
# Writers
# ---------------------------------------------------------------------------


def write_srt(srt_path: Path, cues: list[Cue]) -> None:
    lines: list[str] = []
    for cue in cues:
        lines.append(str(cue.index))
        lines.append(cue.timestamp_line)
        lines.extend(cue.text_lines if cue.text_lines else [""])
        lines.append("")
    srt_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def regenerate_vtt(srt_path: Path, vtt_path: Path) -> None:
    """Convert SRT cues to VTT format. SRT uses comma in timestamps, VTT uses period."""
    srt_text = srt_path.read_text(encoding="utf-8")
    out = ["WEBVTT", ""]
    blocks = re.split(r"\r?\n\r?\n", srt_text.strip())
    for block in blocks:
        lines = block.splitlines()
        # Find timestamp line
        ts_pos = None
        for i, line in enumerate(lines):
            if "-->" in line:
                ts_pos = i
                break
        if ts_pos is None:
            continue
        # VTT uses period for milliseconds separator
        vtt_ts = lines[ts_pos].replace(",", ".")
        out.append(vtt_ts)
        out.extend(lines[ts_pos+1:])
        out.append("")
    vtt_path.write_text("\n".join(out).rstrip() + "\n", encoding="utf-8")


def apply_text_substitutions(txt_path: Path, heals: list[tuple[str, str]]) -> int:
    """Apply (ours_text, theirs_text) substitution pairs to the .txt file in-place.

    Each pair is replaced once (first occurrence) -- the same edit semantics as the
    SRT cue-level apply. Matches the on-disk format of the original Whisper-output
    .txt (typically a single continuous line of prose). Returns the number of pairs
    that were actually substituted.
    """
    if not heals:
        return 0
    txt = txt_path.read_text(encoding="utf-8", errors="replace")
    txt = normalize_unicode(txt)
    applied = 0
    for ours_text, theirs_text in heals:
        if not ours_text or not theirs_text:
            continue
        # First occurrence (case-sensitive, since the heal pairs come from the SRT
        # which preserves casing). Avoid corrupting the file with multi-replacements.
        idx = txt.find(ours_text)
        if idx >= 0:
            txt = txt[:idx] + theirs_text + txt[idx + len(ours_text):]
            applied += 1
    txt_path.write_text(txt, encoding="utf-8")
    return applied


def update_manifest(manifest_path: Path, divs: dict, applied: list, preserved: list,
                    unresolved: list, failed: list) -> None:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["loc_healing"] = {
        "applied_date": "2026-05-25",
        "loc_item_url": divs.get("loc_item_url"),
        "loc_xml_url": divs.get("loc_xml_url"),
        "loc_match_score": divs.get("loc_match_score"),
        "divergence_count": divs.get("divergence_count"),
        "healed_count": len(applied),
        "preserved_verbatim_count": len(preserved),
        "unresolved_count": len(unresolved),
        "apply_failure_count": len(failed),
    }
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")


def write_stage_file(info: dict, divs: dict, applied: list, preserved: list,
                     unresolved: list, failed: list) -> None:
    # Derive an entry number from the resolution / index if available, else 0
    # We'll use the alphabetical position which matches the audit's entry numbering closely
    # but for now just use the subject slug for the filename.
    entry_num = guess_entry_number(info["subject"])
    slug = info["subj_safe"].lower()
    filename = f"entry_{entry_num:03d}_{slug}.md"
    PASS8_STAGE.mkdir(parents=True, exist_ok=True)
    out_path = PASS8_STAGE / filename

    md = []
    md.append(f"# Pass 8 LoC Healing — Entry {entry_num}: {info['subject']}")
    md.append("")
    md.append(f"**Date:** 2026-05-25")
    md.append(f"**LoC item URL:** {divs.get('loc_item_url')}")
    md.append(f"**LoC XML URL:** {divs.get('loc_xml_url')}")
    md.append(f"**LoC match score:** {divs.get('loc_match_score')}")
    md.append(f"**Our master:** `transcripts/corrected/{info['entry_dir'].name}/`")
    md.append("")
    md.append("## Coverage")
    md.append("")
    md.append(f"- Our word count: {divs.get('our_word_count')}")
    md.append(f"- LoC word count: {divs.get('loc_word_count')}")
    md.append(f"- SRT cues: {divs.get('cue_count')}")
    md.append(f"- LoC speaker turns: {divs.get('loc_turn_count')}")
    md.append(f"- Divergences detected: {divs.get('divergence_count')}")
    md.append("")
    md.append("## Verdict distribution")
    md.append("")
    md.append(f"- **ASR_ERROR_HEAL (applied)**: {len(applied)}")
    md.append(f"- **EDITORIAL_SMOOTHING / SPEAKER_DISFLUENCY (preserved verbatim)**: {len(preserved)}")
    md.append(f"- **UNCLEAR (flagged for SME review)**: {len(unresolved)}")
    md.append(f"- **Apply failures (need investigation)**: {len(failed)}")
    md.append("")

    if applied:
        md.append("## Corrections applied")
        md.append("")
        md.append("| # | Cue | Our tokens | LoC tokens | Reasoning |")
        md.append("|---|---|---|---|---|")
        for r in applied[:200]:
            cue = r.get("applied_in_cue", "?")
            ours = " ".join(r["ours_tokens"])
            theirs = " ".join(r["theirs_tokens"])
            reason = (r.get("reasoning", "") or "").replace("|", "\\|").replace("\n", " ")
            md.append(f"| {r['id']} | {cue} | {ours} | {theirs} | {reason} |")
        if len(applied) > 200:
            md.append(f"| ... | ... | ... | ... | ({len(applied) - 200} more) |")
        md.append("")

    if preserved:
        md.append("## Preserved verbatim (LoC's text was editorial smoothing, speaker disfluency, etc.)")
        md.append("")
        md.append("| # | Cue(s) | Our tokens | LoC tokens | Verdict | Reasoning |")
        md.append("|---|---|---|---|---|---|")
        for r in preserved[:200]:
            cues_str = ",".join(str(c) for c in r["cue_indices"])
            ours = " ".join(r["ours_tokens"])
            theirs = " ".join(r["theirs_tokens"])
            reason = (r.get("reasoning", "") or "").replace("|", "\\|").replace("\n", " ")
            md.append(f"| {r['id']} | {cues_str} | {ours} | {theirs} | {r['verdict']} | {reason} |")
        if len(preserved) > 200:
            md.append(f"| ... | ... | ... | ... | ... | ({len(preserved) - 200} more) |")
        md.append("")

    if unresolved:
        md.append("## Flagged for SME review")
        md.append("")
        md.append("| # | Cue(s) | Our tokens | LoC tokens | Reasoning |")
        md.append("|---|---|---|---|---|")
        for r in unresolved[:200]:
            cues_str = ",".join(str(c) for c in r["cue_indices"])
            ours = " ".join(r["ours_tokens"])
            theirs = " ".join(r["theirs_tokens"])
            reason = (r.get("reasoning", "") or "").replace("|", "\\|").replace("\n", " ")
            md.append(f"| {r['id']} | {cues_str} | {ours} | {theirs} | {reason} |")
        md.append("")

    if failed:
        md.append("## Apply failures (investigation required)")
        md.append("")
        md.append("| # | Cue(s) | Our tokens | LoC tokens | Reason |")
        md.append("|---|---|---|---|---|")
        for r in failed[:200]:
            cues_str = ",".join(str(c) for c in r["cue_indices"])
            ours = " ".join(r["ours_tokens"])
            theirs = " ".join(r["theirs_tokens"])
            reason = r.get("fail_reason", "")
            md.append(f"| {r['id']} | {cues_str} | {ours} | {theirs} | {reason} |")
        md.append("")

    out_path.write_text("\n".join(md) + "\n", encoding="utf-8")
    print(f"    stage file -> {out_path}")


# ---------------------------------------------------------------------------
# Entry-number lookup (alphabetical position in corrected/, matching master MD)
# ---------------------------------------------------------------------------


_ENTRY_NUMBER_CACHE: dict[str, int] | None = None
_AUDIT_CANON_BY_ENTRY: dict[int, set[str]] | None = None


def _build_master_md_indices() -> None:
    """Populate _ENTRY_NUMBER_CACHE and _AUDIT_CANON_BY_ENTRY in one pass over the master MD."""
    global _ENTRY_NUMBER_CACHE, _AUDIT_CANON_BY_ENTRY
    if _ENTRY_NUMBER_CACHE is not None and _AUDIT_CANON_BY_ENTRY is not None:
        return
    _ENTRY_NUMBER_CACHE = {}
    _AUDIT_CANON_BY_ENTRY = {}
    master = TRANSCRIPTS / "CLEANED_TRANSCRIPTS_REVIEW.md"
    if not master.is_file():
        return
    cur_entry: int | None = None
    in_correction_table = False
    for line in master.read_text(encoding="utf-8").split("\n"):
        m = re.match(r"^### (\d+)\. (.+?)\s*$", line)
        if m:
            cur_entry = int(m.group(1))
            name = m.group(2).strip()
            name = re.sub(r"\s*\([A-Z][A-Z\s]*\)\s*$", "", name).strip()
            _ENTRY_NUMBER_CACHE[name] = cur_entry
            _AUDIT_CANON_BY_ENTRY.setdefault(cur_entry, set())
            in_correction_table = False
            continue
        if cur_entry is None:
            continue
        # Detect correction-table header: '| # | Span ... | Correction | ... |' or
        # '| # | Whisper ... | Correction | ...|' or '| # | Rendering | Correction | ... |'
        stripped = line.strip().lower()
        if stripped.startswith("| #") and "correction" in stripped:
            in_correction_table = True
            continue
        if in_correction_table and stripped.startswith("|-"):
            continue
        if in_correction_table and line.startswith("| "):
            parts = [c.strip() for c in line.split("|")]
            if len(parts) >= 5:
                correction_cell = parts[3]
                # Tokenize the correction cell into words and add to the canon set
                for tok in re.findall(r"[A-Za-z][A-Za-z'-]+", correction_cell):
                    if len(tok) >= 3:
                        _AUDIT_CANON_BY_ENTRY[cur_entry].add(tok.lower())
            continue
        # End of correction table on blank line / new heading
        if in_correction_table and (not line.strip() or line.startswith("#")):
            in_correction_table = False


def get_audit_canon_set(entry_number: int) -> set[str]:
    """Return the set of lowercased canonical tokens that have been promoted to
    Correction values by prior audit passes for this entry."""
    _build_master_md_indices()
    return (_AUDIT_CANON_BY_ENTRY or {}).get(entry_number, set())


def guess_entry_number(subject: str) -> int:
    """Look up entry number from CLEANED_TRANSCRIPTS_REVIEW.md headings."""
    _build_master_md_indices()
    if not _ENTRY_NUMBER_CACHE:
        return 0
    # Try exact match first
    if subject in _ENTRY_NUMBER_CACHE:
        return _ENTRY_NUMBER_CACHE[subject]
    # Try fuzzy
    for name, num in _ENTRY_NUMBER_CACHE.items():
        if subject.lower() in name.lower() or name.lower() in subject.lower():
            return num
    return 0


# ---------------------------------------------------------------------------
# Verify
# ---------------------------------------------------------------------------


def verify(entry_dir_name: str) -> int:
    info = parse_entry_dir(entry_dir_name)
    cues = parse_srt(info["srt"])
    # Parse VTT
    vtt_content = info["vtt"].read_text(encoding="utf-8", errors="replace")
    vtt_cue_count = len(re.findall(r"-->", vtt_content))
    srt_cue_count = len(cues)
    if srt_cue_count != vtt_cue_count:
        print(f"  [FAIL] cue count mismatch: srt={srt_cue_count} vtt={vtt_cue_count}")
        return 1
    print(f"  [OK] cue counts match: srt={srt_cue_count} vtt={vtt_cue_count}")
    return 0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("phase", choices=["phase1", "apply", "verify", "heal_one"])
    parser.add_argument("entry_dir")
    parser.add_argument("verdicts_path", nargs="?")
    args = parser.parse_args(argv)

    if args.phase == "phase1":
        return phase1(args.entry_dir)
    elif args.phase == "apply":
        verdicts = Path(args.verdicts_path) if args.verdicts_path else None
        return apply_heals(args.entry_dir, verdicts)
    elif args.phase == "verify":
        return verify(args.entry_dir)
    elif args.phase == "heal_one":
        # Combined: phase1 + apply (using deterministic verdicts only) + verify
        rc = phase1(args.entry_dir)
        if rc != 0:
            return rc
        rc = apply_heals(args.entry_dir, None)
        if rc not in (0, 3):
            return rc
        return verify(args.entry_dir)


if __name__ == "__main__":
    raise SystemExit(main())
