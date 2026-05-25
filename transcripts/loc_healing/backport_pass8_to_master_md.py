"""
Backport Pass 8 LoC healings into CLEANED_TRANSCRIPTS_REVIEW.md as canonical
`<entry>.P8.X` correction-table rows.

Why this exists:
- Pass 8 healed `transcripts/corrected/<entry>/*.srt|txt|vtt` directly (via the
  heal_one_entry.py apply step). That work is on disk now.
- But the master MD overlay does NOT contain Pass 8 rows. Anyone running
  `python scripts/apply_corrections.py` from a fresh clone (or anyone
  regenerating `corrected/` from `raw/` + the master MD) would produce a
  `corrected/` directory that's missing the LoC healings.
- This script closes that gap: for each entry that has applied Pass 8 heals,
  insert a `#### Pass 8 LoC canonical-archive adjudication (2026-05-25)`
  section with a proper 6-column correction table.

Idempotent: if a Pass 8 section already exists for the entry, the section is
removed and re-inserted. Safe to re-run after applying additional heals.

After running this script, `scripts/apply_corrections.py` should produce the
same `corrected/` content we have on disk now (modulo the manifest's
loc_healing section, which is set by the heal pipeline directly and not by
apply_corrections.py).

Usage:
  python backport_pass8_to_master_md.py             # backport all entries
  python backport_pass8_to_master_md.py --dry-run   # report what would change, don't write
  python backport_pass8_to_master_md.py --entry 1   # only entry 1
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TRANSCRIPTS = ROOT / "transcripts"
MASTER_MD = TRANSCRIPTS / "CLEANED_TRANSCRIPTS_REVIEW.md"
DIVERGENCES_DIR = TRANSCRIPTS / "loc_healing" / "divergences"

PASS8_SECTION_HEADER = "#### Pass 8 LoC canonical-archive adjudication (2026-05-25)"
PASS8_MARKER_BEGIN = "<!-- BEGIN-PASS-8-BACKPORT -->"
PASS8_MARKER_END = "<!-- END-PASS-8-BACKPORT -->"


def _name_tokens(name: str) -> list[str]:
    n = re.sub(r'"[^"]*"', " ", name)
    n = re.sub(r"\([^)]*\)", " ", n)
    return re.findall(r"[A-Za-z][A-Za-z\-']+", n.lower())


def _build_entry_subject_index(master_text: str) -> dict[int, tuple[int, int]]:
    """Returns entry_number -> (section_start_offset, section_end_offset) in master_text.

    The section spans from the line containing the `### N. ...` heading to the
    character just before the next `### N+1. ...` heading (or end of file).
    """
    headings: list[tuple[int, int, int, str]] = []  # (num, line_start, line_end_after_newline, heading_text)
    for m in re.finditer(r"^### (\d+)\.\s+(.+?)\s*$", master_text, flags=re.MULTILINE):
        num = int(m.group(1))
        line_start = m.start()
        next_newline = master_text.find("\n", m.end())
        line_end = next_newline + 1 if next_newline >= 0 else len(master_text)
        headings.append((num, line_start, line_end, m.group(2)))
    # Some entry numbers appear multiple times in the master MD because of the
    # Pass 7 PRR / sub-numbering. The FIRST occurrence of a given entry number
    # is the canonical entry heading. We use only first-occurrence.
    seen: dict[int, tuple[int, int]] = {}
    for i, (num, ls, le, _title) in enumerate(headings):
        if num in seen:
            continue
        # Find the next true entry heading (first occurrence of a different number)
        section_end = len(master_text)
        for j in range(i + 1, len(headings)):
            next_num, next_ls, _next_le, _ = headings[j]
            if next_num != num and next_num not in seen:
                section_end = next_ls
                break
        seen[num] = (ls, section_end)
    return seen


def _build_entry_subject_map() -> dict[str, int]:
    """Read directly from master MD and build subject -> entry_number map."""
    text = MASTER_MD.read_text(encoding="utf-8")
    out: dict[str, int] = {}
    for m in re.finditer(r"^### (\d+)\.\s+(.+?)\s*$", text, flags=re.MULTILINE):
        num = int(m.group(1))
        name = m.group(2).strip()
        # Strip parenthetical markers like (PARTIAL), (SKIPPED)
        name_clean = re.sub(r"\s*\([A-Z][A-Z\s]*\)\s*$", "", name).strip()
        if num not in out.values():  # first occurrence only
            out.setdefault(name_clean, num)
    return out


# Manual subject → entry-number overrides for cases the heuristic matcher
# can't resolve (LoC catalog spelling differs materially from our directory).
_SUBJECT_OVERRIDES: dict[str, str] = {
    # Our directory       -> Substring of master MD heading
    "Booker and Newsom":   "Simeon Booker and Moses Newson",
    "Ladners":             "Dorie and Joyce Ladner",
}


def _find_entry_for_subject(subject: str, subject_map: dict[str, int]) -> int | None:
    """Match a divergences-JSON subject to the master MD's entry number using
    progressively looser matching."""
    if subject in subject_map:
        return subject_map[subject]
    # Manual overrides for known catalog-discrepancy cases
    if subject in _SUBJECT_OVERRIDES:
        target_substr = _SUBJECT_OVERRIDES[subject].lower()
        for name, num in subject_map.items():
            if target_substr in name.lower():
                return num
    # Try substring
    for name, num in subject_map.items():
        if subject.lower() in name.lower() or name.lower() in subject.lower():
            return num
    # Token-set on first+last name
    subject_toks = _name_tokens(subject)
    if not subject_toks:
        return None
    subject_first_last = (subject_toks[0], subject_toks[-1])
    for name, num in subject_map.items():
        name_toks = _name_tokens(name)
        if not name_toks:
            continue
        if (name_toks[0], name_toks[-1]) == subject_first_last:
            return num
    # Last-name only fallback
    for name, num in subject_map.items():
        name_toks = _name_tokens(name)
        if subject_toks[-1] in name_toks:
            return num
    # Last-name fuzzy fallback (single-edit distance) — catches Newsom <-> Newson
    if subject_toks:
        target_last = subject_toks[-1]
        for name, num in subject_map.items():
            name_toks = _name_tokens(name)
            for tok in name_toks:
                if _is_edit_distance_one(target_last, tok):
                    return num
    return None


def _is_edit_distance_one(a: str, b: str) -> bool:
    """Cheap edit-distance-<=1 check (insert / delete / substitute)."""
    if a == b:
        return False
    la, lb = len(a), len(b)
    if abs(la - lb) > 1:
        return False
    if la == lb:
        return sum(1 for x, y in zip(a, b) if x != y) == 1
    # Lengths differ by one; check single insert/delete
    short, long_ = (a, b) if la < lb else (b, a)
    i = j = 0
    while i < len(short) and j < len(long_):
        if short[i] != long_[j]:
            j += 1
            if j - i > 1:
                return False
        else:
            i += 1
            j += 1
    return True


def _escape_cell(text: str) -> str:
    """Escape table-row content for Markdown table cell."""
    return text.replace("|", "\\|").replace("\n", " ").strip()


def _build_pass8_section(entry_num: int, heals: list[dict], loc_meta: dict) -> str:
    """Return the markdown section text for the entry's Pass 8 rows."""
    lines = []
    lines.append("")
    lines.append(PASS8_MARKER_BEGIN)
    lines.append(PASS8_SECTION_HEADER)
    lines.append("")
    item_url = loc_meta.get("loc_item_url") or "(unknown LoC item URL)"
    source_kind = loc_meta.get("loc_source_kind") or "?"
    src_url = loc_meta.get("loc_xml_url") or loc_meta.get("loc_pdf_url") or "(unknown)"
    lines.append(f"**LoC item:** {item_url}")
    lines.append(f"**LoC source kind:** {source_kind}  ")
    lines.append(f"**LoC source URL:** {src_url}")
    lines.append("")
    lines.append("These rows are the Pass 8 LoC adjudications: ASR-error heals that the")
    lines.append("Pass 8 conservative-first-pass classifier applied directly to")
    lines.append("`transcripts/corrected/` by aligning our Whisper-derived text against")
    lines.append("LoC's authoritative TEI2 XML (or PDF-extracted text). Backported here as")
    lines.append("canonical `<entry>.P8.X` rows so `scripts/apply_corrections.py` reproduces")
    lines.append("the same `corrected/` state from `raw/` + this master MD.")
    lines.append("")
    lines.append("| #    | Span as Whisper-transcribed | Suggested correction | Confidence | Source | Surrounding context |")
    lines.append("|------|-----------------------------|----------------------|------------|--------|---------------------|")
    for i, h in enumerate(heals, 1):
        row_id = f"{entry_num}.P8.{i}"
        if h.get("context_extended"):
            ours_emit = h["whisper_phrase"]
            theirs_emit = h["correction_phrase"]
            kind = "context-extended"
        else:
            ours_emit = " ".join(h["ours_tokens"])
            theirs_emit = " ".join(h["theirs_tokens"])
            kind = "direct"
        cue = h.get("applied_in_cue") or (h.get("cue_indices") or [None])[0]
        notes = f"Healed against LoC {source_kind} at SRT cue {cue} ({kind})"
        if h.get("reasoning"):
            notes += f"; {h['reasoning']}"
        lines.append(
            f"| {row_id} | {_escape_cell(ours_emit)} | {_escape_cell(theirs_emit)} | high | "
            f"Pass 8 LoC adjudication | {_escape_cell(notes)} |"
        )
    lines.append("")
    lines.append(PASS8_MARKER_END)
    lines.append("")
    return "\n".join(lines)


def _strip_existing_pass8_section(section_text: str) -> str:
    """If a previous Pass 8 backport exists in this entry's section, remove it
    so we can re-insert a fresh version (idempotency)."""
    pattern = re.compile(
        re.escape(PASS8_MARKER_BEGIN) + r".*?" + re.escape(PASS8_MARKER_END) + r"\s*",
        flags=re.DOTALL,
    )
    return pattern.sub("", section_text)


def _find_insertion_point(section_text: str) -> int:
    """Return offset within section_text where Pass 8 section should be inserted.

    Strategy: insert at the very end of the entry's section (just before the
    trailing whitespace / before the next entry's heading). This puts Pass 8
    after every other Pass + the Pass 7 PRR analytical block. The trailing
    `---` that separates entries (if present) stays in place.
    """
    return len(section_text.rstrip())


RAW_DIR = TRANSCRIPTS / "raw"

# How many surrounding words to include on each side when promoting a
# position-specific heal to a context-extended row. The phrase must appear
# uniquely in the entry's text (post-Pass-1-7 state) for the substitution
# to be safe.
CONTEXT_WORDS = 5


def _count_ci_substring(text: str, needle: str) -> int:
    """Count case-insensitive occurrences of needle in text."""
    if not needle:
        return 0
    return text.lower().count(needle.lower())


def _apply_corrections_strips(s: str) -> str:
    """Apply the same trailing-punctuation strip that scripts/apply_corrections.py
    does to both Whisper and Correction columns via _candidate_renderings and
    _clean_correction_text. The strip removes trailing ,;:. — meaning our row's
    'PSU,' becomes 'PSU' as the effective needle when apply runs.
    """
    return s.rstrip(",;:.")


def _extract_srt_cues(srt_text: str) -> dict[int, str]:
    """Parse an SRT into {cue_index: joined_cue_text}."""
    out: dict[int, str] = {}
    blocks = re.split(r"\r?\n\r?\n", srt_text.strip())
    for block in blocks:
        lines = block.splitlines()
        idx = None
        ts_pos = None
        for i, line in enumerate(lines):
            s = line.strip()
            if s.isdigit() and idx is None:
                idx = int(s)
            if "-->" in s:
                ts_pos = i
                break
        if idx is not None and ts_pos is not None:
            text = " ".join(l.strip() for l in lines[ts_pos + 1:] if l.strip())
            out[idx] = text
    return out


def _build_context_extended_row(
    cue_text: str,
    ours_tokens: list[str],
    theirs_tokens: list[str],
    full_srt_text: str,
) -> tuple[str, str] | None:
    """Given a cue text containing `theirs_tokens` (post-heal), find the
    position and build context-extended Whisper/Correction strings such that
    the Whisper phrase is unique within the full SRT.

    Returns (whisper_phrase, correction_phrase) or None if we can't build a
    unique phrase (e.g., theirs_tokens not found in the cue, or even with
    full context the phrase still occurs more than once).
    """
    if not theirs_tokens:
        return None
    cue_words = re.split(r"\s+", cue_text.strip())
    theirs_lc = [t.lower() for t in theirs_tokens]
    cue_lc = [w.lower() for w in cue_words]
    target_len = len(theirs_lc)
    # Find theirs_tokens (case-insensitive contiguous match) in cue
    match_at = None
    for i in range(len(cue_lc) - target_len + 1):
        if cue_lc[i:i + target_len] == theirs_lc:
            match_at = i
            break
    if match_at is None:
        return None
    # Try progressively larger context windows.
    # apply_corrections.py runs P1..P7..P8 against raw/ in order, so at the
    # moment our P8 row applies, the in-memory text is "post-P1-P7-pre-P8",
    # i.e. the corrected/ POST-Pass-8 SRT EXCEPT at heal positions where the
    # words are still ours_tokens (not yet replaced by theirs_tokens).
    #
    # For the row to work safely we need pre_phrase (which contains
    # ours_tokens + context) to appear EXACTLY ONCE in the apply-time text.
    # We approximate that by checking corrected/ POST-Pass-8 SRT:
    #   - pre_phrase count in corrected/ should be 0 (the heal position's
    #     words now read theirs_tokens, so the literal pre_phrase doesn't
    #     occur there anymore)
    #   - pre_phrase count anywhere ELSE in corrected/ should also be 0
    #     (otherwise that other location has unhealed ours_tokens with the
    #     same surrounding context, and our row would over-apply)
    # In summary: pre_phrase count in corrected/ should be 0 — meaning the
    # combined context is unique to the heal site.
    for ctx_n in range(2, CONTEXT_WORDS + 4):
        start = max(0, match_at - ctx_n)
        end = min(len(cue_words), match_at + target_len + ctx_n)
        post_phrase = " ".join(cue_words[start:end])
        pre_words = cue_words[start:match_at] + ours_tokens + cue_words[match_at + target_len:end]
        pre_phrase = " ".join(pre_words)
        # apply_corrections.py strips trailing `,;:.` from the Whisper cell when
        # matching. So uniqueness checks must mirror that behavior — use the
        # stripped form of pre_phrase when counting.
        pre_phrase_effective = _apply_corrections_strips(pre_phrase)
        if _count_ci_substring(full_srt_text, pre_phrase_effective) == 0:
            return (pre_phrase, post_phrase)
        # Otherwise widen the window
    return None


def _load_heals_for_entry(divergences_path: Path) -> tuple[list[dict], dict, dict]:
    """Read a divergences JSON, return ([heals_applied], loc_meta, filter_stats).

    A heal is "safely backportable" iff its `ours_token` no longer appears in
    the corrected/ SRT for this entry — meaning every occurrence in raw/ has
    been healed away. If `corrected_count > 0`, the heal is position-specific
    (only one of several occurrences was changed); generalizing it as a master
    MD row would over-apply. Position-specific heals stay in corrected/ +
    pass8_stage/ and are NOT backported.
    """
    div_data = json.loads(divergences_path.read_text(encoding="utf-8"))
    entry_dir = div_data.get("entry_dir")

    loc_meta = {
        "loc_item_url": div_data.get("loc_item_url"),
        "loc_xml_url": div_data.get("loc_xml_url"),
        "loc_pdf_url": div_data.get("loc_pdf_url"),
        "loc_source_kind": div_data.get("loc_source_kind", "xml"),
    }
    if loc_meta["loc_source_kind"] is None:
        loc_meta["loc_source_kind"] = "xml" if div_data.get("loc_xml_url") else "pdf"

    # Locate the corrected SRT to check occurrence counts for filter
    corrected_srt_text = ""
    if entry_dir:
        corrected_dir = TRANSCRIPTS / "corrected" / entry_dir
        if corrected_dir.is_dir():
            for f in corrected_dir.iterdir():
                if f.suffix == ".srt":
                    corrected_srt_text = f.read_text(encoding="utf-8", errors="replace")
                    break

    # Build cue index for context-extended row generation
    cue_index_map: dict[int, str] = _extract_srt_cues(corrected_srt_text) if corrected_srt_text else {}

    heals: list[dict] = []
    extended_heals: list[dict] = []  # position-specific, promoted via context
    unbackportable: list[dict] = []  # couldn't build a unique context phrase
    for div in div_data.get("divergences", []):
        if div.get("deterministic_verdict") != "ASR_ERROR_HEAL":
            continue
        ours = " ".join(div["ours_tokens"])
        theirs = " ".join(div["theirs_tokens"])
        cue = (div.get("cue_indices") or [None])[0]
        # apply_corrections.py strips trailing `,;:.` from the Whisper cell via
        # _candidate_renderings before matching. So we must check against the
        # stripped form, not the raw token form.
        ours_effective = _apply_corrections_strips(ours)
        rem_count = _count_ci_substring(corrected_srt_text, ours_effective)
        record = {
            "ours_tokens": div["ours_tokens"],
            "theirs_tokens": div["theirs_tokens"],
            "cue_indices": div.get("cue_indices") or [],
            "applied_in_cue": cue,
            "reasoning": div.get("deterministic_reasoning", "")[:120],
            "remaining_count_in_corrected": rem_count,
            "ours_effective": ours_effective,
        }
        if rem_count == 0:
            heals.append(record)
            continue
        # Position-specific — try to promote via multi-word context
        cue_text = cue_index_map.get(cue, "") if cue is not None else ""
        if cue_text:
            ext = _build_context_extended_row(
                cue_text, div["ours_tokens"], div["theirs_tokens"], corrected_srt_text
            )
            if ext is not None:
                pre_phrase, post_phrase = ext
                # Repackage as a tokenized heal whose Whisper/Correction are
                # the longer phrases. ours_tokens / theirs_tokens are kept for
                # provenance but emit phrases as the row payload.
                record["context_extended"] = True
                record["whisper_phrase"] = pre_phrase
                record["correction_phrase"] = post_phrase
                extended_heals.append(record)
                continue
        unbackportable.append(record)

    filter_stats = {
        "safely_backportable_direct": len(heals),
        "context_extended": len(extended_heals),
        "unbackportable": len(unbackportable),
        "unbackportable_samples": [
            {"ours": " ".join(p["ours_tokens"]), "theirs": " ".join(p["theirs_tokens"]),
             "cue": p["applied_in_cue"], "remaining": p["remaining_count_in_corrected"]}
            for p in unbackportable[:3]
        ],
    }
    all_heals = heals + extended_heals
    return all_heals, loc_meta, filter_stats


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--entry", type=int, default=None, help="restrict to a single entry number")
    args = parser.parse_args(argv)

    if not MASTER_MD.is_file():
        print(f"Master MD not found at {MASTER_MD}", file=sys.stderr)
        return 1

    master_text = MASTER_MD.read_text(encoding="utf-8")
    subject_map = _build_entry_subject_map()
    bounds = _build_entry_subject_index(master_text)

    print(f"Master MD: {MASTER_MD} ({len(master_text):,} chars)")
    print(f"Entries in master MD (first-occurrence count): {len(bounds)}")

    # Discover Pass 8 backportable entries
    work: list[tuple[int, Path, list[dict], dict]] = []
    skipped: list[str] = []
    for div_path in sorted(DIVERGENCES_DIR.glob("*.divergences.json")):
        d = json.loads(div_path.read_text(encoding="utf-8"))
        subject = d.get("subject", div_path.stem)
        entry_num = _find_entry_for_subject(subject, subject_map)
        if entry_num is None:
            skipped.append(f"{subject}: no entry number found in master MD")
            continue
        if entry_num not in bounds:
            skipped.append(f"{subject} (entry {entry_num}): no section bounds found")
            continue
        if args.entry is not None and entry_num != args.entry:
            continue
        heals, loc_meta, fstats = _load_heals_for_entry(div_path)
        if not heals:
            if fstats["unbackportable"]:
                skipped.append(f"{subject} (entry {entry_num}): "
                               f"all {fstats['unbackportable']} heals are unbackportable; "
                               f"none safely-emittable")
            continue
        work.append((entry_num, div_path, heals, loc_meta))
        if fstats["context_extended"] or fstats["unbackportable"]:
            print(f"  entry {entry_num}: {fstats['safely_backportable_direct']} direct + "
                  f"{fstats['context_extended']} context-extended + "
                  f"{fstats['unbackportable']} unbackportable")

    print(f"Entries with Pass 8 heals to backport: {len(work)}")
    if skipped:
        print(f"Skipped (no master MD entry mapping): {len(skipped)}")
        for s in skipped[:10]:
            print(f"  - {s}")

    if args.dry_run:
        # Show what would happen for each entry
        total_rows = sum(len(h) for _, _, h, _ in work)
        print(f"\n[DRY RUN] would insert {total_rows} Pass 8 rows across {len(work)} entries.")
        for entry_num, div_path, heals, loc_meta in work[:8]:
            print(f"  entry {entry_num}: {len(heals)} rows  ({loc_meta['loc_source_kind']})")
        return 0

    # Apply edits IN REVERSE entry-number ORDER so earlier offsets stay valid.
    # We sort by section_start offset descending.
    work_sorted = sorted(work, key=lambda x: bounds[x[0]][0], reverse=True)

    new_text = master_text
    edits_applied = 0
    rows_added = 0
    for entry_num, div_path, heals, loc_meta in work_sorted:
        sec_start, sec_end = bounds[entry_num]
        section_text = new_text[sec_start:sec_end]
        section_text_clean = _strip_existing_pass8_section(section_text)
        insertion_point = _find_insertion_point(section_text_clean)
        pass8_section = _build_pass8_section(entry_num, heals, loc_meta)
        new_section_text = (
            section_text_clean[:insertion_point]
            + "\n"
            + pass8_section
            + "\n"
            + section_text_clean[insertion_point:]
        )
        new_text = new_text[:sec_start] + new_section_text + new_text[sec_end:]
        edits_applied += 1
        rows_added += len(heals)

    MASTER_MD.write_text(new_text, encoding="utf-8")
    print(f"\nWrote {MASTER_MD} ({len(new_text):,} chars; {len(new_text) - len(master_text):+,} delta).")
    print(f"Inserted {rows_added} Pass 8 rows across {edits_applied} entries.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
