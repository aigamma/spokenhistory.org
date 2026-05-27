"""Tests for scripts/apply_corrections.py.

Covers:

1. Single substitution single file: one correction row -> text changed, manifest
   written.
2. Multiple substitutions same file: all applied, occurrences counted.
3. Idempotency: re-running the script yields byte-identical outputs.
4. Timestamp preservation in .srt/.vtt: corrections inside cue text don't touch
   timestamp lines or cue numbers / WEBVTT header.
5. Pending context separation: medium-confidence row lands in
   ``manifest.pending_context``, not in the text.

Plus a few targeted unit tests for the parsing helpers.
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))

import apply_corrections  # noqa: E402  (deferred import for sys.path setup)


FIXTURES = REPO_ROOT / "tests" / "fixtures"
FIXTURE_MASTER = FIXTURES / "fixture_master.md"
FIXTURE_RAW = FIXTURES / "raw"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def tmp_out_dir(tmp_path: Path) -> Path:
    out = tmp_path / "corrected"
    out.mkdir()
    return out


@pytest.fixture
def parsed_entries() -> dict:
    return apply_corrections.parse_master_md(FIXTURE_MASTER)


def _run(out_dir: Path, entries: list[int] | None = None) -> dict[int, dict]:
    """Helper: run the script's process_entry over the fixture entries and
    return per-entry manifests."""
    parsed = apply_corrections.parse_master_md(FIXTURE_MASTER)
    target = sorted(parsed.keys()) if entries is None else entries
    out: dict[int, dict] = {}
    for n in target:
        m = apply_corrections.process_entry(
            parsed[n],
            raw_root=FIXTURE_RAW,
            out_root=out_dir,
            dry_run=False,
            verbose=False,
        )
        if m is not None:
            out[n] = m
    return out


# ---------------------------------------------------------------------------
# Parsing unit tests
# ---------------------------------------------------------------------------


def test_parse_master_md_finds_both_entries(parsed_entries):
    assert set(parsed_entries.keys()) == {1, 2}
    assert parsed_entries[1].subject == "Test Entry One"
    assert parsed_entries[2].subject == "Test Entry Two"


def test_parse_master_md_source_paths(parsed_entries):
    assert parsed_entries[1].raw_dir_name == "test_entry_one_interview"
    assert parsed_entries[2].raw_dir_name == "test_entry_two_interview"


def test_parse_master_md_rows_counts(parsed_entries):
    # Entry 1 has 9 rows in Pass 1 + 0 in Pass 3 missed-pattern.
    assert len(parsed_entries[1].rows) == 9
    # Entry 2 has 3 rows.
    assert len(parsed_entries[2].rows) == 3


def test_pass3_override_applied(parsed_entries):
    """Row 1.2 starts at medium and Pass 3 promotes it to high."""
    e1 = parsed_entries[1]
    row_1_2 = next(r for r in e1.rows if r.row_id == "1.2")
    # Confidence should be the overridden value (high), not the original (medium).
    assert row_1_2.normalized_confidence() == "high"


def test_normalized_confidence_handles_compound_forms():
    row = apply_corrections.CorrectionRow(
        row_id="x.1",
        whisper="foo",
        correction="bar",
        confidence="high (spelling)",
        source="",
        notes="",
        table="pass1",
    )
    assert row.normalized_confidence() == "high"


def test_candidate_renderings_splits_alternatives():
    cands = apply_corrections._candidate_renderings("Foreman / James Foreman")
    assert "Foreman" in cands
    assert "James Foreman" in cands


def test_candidate_renderings_strips_emphasis_and_parentheticals():
    cands = apply_corrections._candidate_renderings("*Stokeley* (likely)")
    assert "Stokeley" in cands


def test_clean_correction_text_takes_first_alternative():
    out = apply_corrections._clean_correction_text(
        "Voodoo Man (likely speaker's actual nickname)"
    )
    assert out == "Voodoo Man"


def test_clean_correction_text_strips_italic_markers():
    out = apply_corrections._clean_correction_text("*Patriotic Betrayal*")
    assert out == "Patriotic Betrayal"


# ---------------------------------------------------------------------------
# Substitution unit tests
# ---------------------------------------------------------------------------


def test_apply_substitutions_to_text_basic():
    text = "We met Stokeley Carmichael at the rally."
    new, n = apply_corrections.apply_substitutions_to_text(
        text, ["Stokeley Carmichael"], "Stokely Carmichael"
    )
    assert n == 1
    assert "Stokely Carmichael" in new
    assert "Stokeley" not in new


def test_apply_substitutions_to_text_case_insensitive():
    text = "stokeley carmichael came to town"
    new, n = apply_corrections.apply_substitutions_to_text(
        text, ["Stokeley Carmichael"], "Stokely Carmichael"
    )
    assert n == 1
    assert "Stokely Carmichael" in new


def test_apply_substitutions_to_text_word_boundary():
    """Don't replace a substring that's embedded inside a longer word."""
    text = "the snickerdoodle is delicious"
    # "snick" is one of the SNCC mishears in the real corpus.
    new, n = apply_corrections.apply_substitutions_to_text(
        text, ["snick"], "SNCC"
    )
    # 'snick' is a substring of 'snickerdoodle' but our word-boundary guard
    # should prevent it from matching.
    assert n == 0
    assert new == text


def test_apply_substitutions_srt_preserves_timestamps():
    srt = (
        "1\n"
        "00:00:00,000 --> 00:00:05,000\n"
        "Walter Concrite reporting.\n"
        "\n"
        "2\n"
        "00:00:05,000 --> 00:00:10,000\n"
        "And then Margaret the King appeared.\n"
    )
    new, n = apply_corrections.apply_substitutions_to_srt_vtt(
        srt, ["Walter Concrite"], "Walter Cronkite"
    )
    assert n == 1
    assert "Walter Cronkite reporting." in new
    # Timestamp and cue index untouched.
    assert "00:00:00,000 --> 00:00:05,000" in new
    assert "\n1\n00:00:00,000" in "\n" + new


def test_apply_substitutions_vtt_preserves_webvtt_header():
    vtt = (
        "WEBVTT\n"
        "\n"
        "00:00:00.000 --> 00:00:05.000\n"
        "Walter Concrite reporting.\n"
    )
    new, _ = apply_corrections.apply_substitutions_to_srt_vtt(
        vtt, ["Walter Concrite"], "Walter Cronkite"
    )
    assert new.startswith("WEBVTT\n")
    assert "00:00:00.000 --> 00:00:05.000" in new
    assert "Walter Cronkite" in new


# ---------------------------------------------------------------------------
# Integration tests against fixture entries
# ---------------------------------------------------------------------------


def test_single_substitution_single_file(tmp_out_dir):
    """Run only entry 2 (single .txt file, three rows including a high-confidence
    one) and verify the text was changed + manifest written."""
    manifests = _run(tmp_out_dir, entries=[2])
    assert 2 in manifests
    out_txt = tmp_out_dir / "test_entry_two_interview" / "test_entry_two_transcript.txt"
    assert out_txt.exists()
    text = out_txt.read_text(encoding="utf-8")
    # Row 2.1 high-confidence: "Reverend Avenue" -> "Reverend Abernathy"
    assert "Reverend Abernathy" in text
    assert "Reverend Avenue" not in text
    # Row 2.2 medium: "Mama King" should NOT be replaced.
    assert "Mama King" in text
    # Row 2.3 high-confidence: "Coretta King" -> "Coretta Scott King"
    assert "Coretta Scott King" in text
    # Manifest written.
    manifest_path = tmp_out_dir / "test_entry_two_interview" / "manifest.json"
    assert manifest_path.exists()


def test_multiple_substitutions_same_file(tmp_out_dir):
    """Entry 1 has multiple high/correct rows applied across the .txt file.
    Verify all of them landed and occurrences counted."""
    manifests = _run(tmp_out_dir, entries=[1])
    m = manifests[1]
    applied = {a["row_id"]: a for a in m["applied_corrections"]}
    # 1.1 high, Southern Oil History Program -> Southern Oral History Program
    assert "1.1" in applied
    # 1.2 was medium but Pass 3 promoted it to high; should now apply.
    assert "1.2" in applied
    # 1.3 high, H. Rat Brown -> H. Rap Brown
    assert "1.3" in applied
    # 1.4 high, Walter Concrite -> Walter Cronkite
    assert "1.4" in applied
    # 1.5 high, Margaret the King -> Martin Luther King
    assert "1.5" in applied
    # 1.6 high, Foreman / James Foreman -> James Forman
    assert "1.6" in applied
    # Row 1.6's whisper rendering "Foreman / James Foreman" should match both
    # "Foreman" and "James Foreman" substrings in the text.
    assert applied["1.6"]["occurrences"] >= 2

    # 1.7 correct, Bobby Seale -> Bobby Seale (self-mapping, skipped at substitution time).
    # The row is classified as "apply" but produces 0 occurrences, so it shouldn't
    # show up in applied_corrections.
    assert "1.7" not in applied
    # 1.8 speaker-originating, pending.
    pending_ids = {p["row_id"] for p in m["pending_context"]}
    assert "1.8" in pending_ids
    # 1.9 medium, pending.
    assert "1.9" in pending_ids
    # All three target file types processed.
    files = set(m["files_processed"])
    assert any(f.endswith(".txt") for f in files)
    assert any(f.endswith(".srt") for f in files)
    assert any(f.endswith(".vtt") for f in files)


def test_idempotency(tmp_out_dir):
    """Running the script twice with the same inputs must produce identical
    output bytes."""
    _run(tmp_out_dir, entries=[1, 2])
    # Snapshot all corrected files (sorted by relative path).
    snap1: dict[str, bytes] = {}
    for p in sorted(tmp_out_dir.rglob("*")):
        if p.is_file():
            snap1[str(p.relative_to(tmp_out_dir))] = p.read_bytes()
    # Re-run.
    _run(tmp_out_dir, entries=[1, 2])
    snap2: dict[str, bytes] = {}
    for p in sorted(tmp_out_dir.rglob("*")):
        if p.is_file():
            snap2[str(p.relative_to(tmp_out_dir))] = p.read_bytes()
    # We compare the transcript files byte-for-byte. The manifest's "generated"
    # date is invariant on the same day (TODAY is computed once at import), so
    # the manifest is also byte-identical within a single test session.
    assert snap1 == snap2


def test_timestamp_preservation_in_srt(tmp_out_dir):
    manifests = _run(tmp_out_dir, entries=[1])
    srt_path = tmp_out_dir / "test_entry_one_interview" / "test_entry_one_transcript.srt"
    srt_text = srt_path.read_text(encoding="utf-8")
    # Every original timestamp line is preserved exactly.
    assert "00:00:00,000 --> 00:00:05,000" in srt_text
    assert "00:00:05,000 --> 00:00:12,000" in srt_text
    assert "00:00:12,000 --> 00:00:18,000" in srt_text
    assert "00:00:18,000 --> 00:00:22,000" in srt_text
    assert "00:00:22,000 --> 00:00:28,000" in srt_text
    # Cue numbers preserved.
    for cue in ("1\n", "2\n", "3\n", "4\n", "5\n"):
        assert cue in srt_text
    # Corrections still applied inside the cue text.
    assert "Southern Oral History Program" in srt_text
    assert "H. Rap Brown" in srt_text
    assert "Walter Cronkite" in srt_text
    assert "Martin Luther King" in srt_text
    # The pre-correction Whisper strings should be gone.
    assert "Southern Oil History Program" not in srt_text
    assert "H. Rat Brown" not in srt_text
    assert "Walter Concrite" not in srt_text
    assert "Margaret the King" not in srt_text


def test_timestamp_preservation_in_vtt(tmp_out_dir):
    _run(tmp_out_dir, entries=[1])
    vtt_path = tmp_out_dir / "test_entry_one_interview" / "test_entry_one_transcript.vtt"
    vtt_text = vtt_path.read_text(encoding="utf-8")
    # WEBVTT header preserved.
    assert vtt_text.startswith("WEBVTT\n")
    # Dots in VTT timestamps preserved.
    assert "00:00:00.000 --> 00:00:05.000" in vtt_text
    assert "00:00:22.000 --> 00:00:28.000" in vtt_text


def test_pending_context_separation(tmp_out_dir):
    manifests = _run(tmp_out_dir, entries=[1])
    m = manifests[1]
    # Row 1.9 is medium-confidence. It must land in pending_context, NOT in
    # applied_corrections, and the text must be unchanged.
    pending_by_id = {p["row_id"]: p for p in m["pending_context"]}
    assert "1.9" in pending_by_id
    # Verify text unchanged for that span. (The entry 1 text doesn't even
    # contain "Reverend Avenue", it lives in entry 2, but the medium row
    # should still appear in pending_context.)
    out_txt = (
        tmp_out_dir / "test_entry_one_interview" / "test_entry_one_transcript.txt"
    )
    text = out_txt.read_text(encoding="utf-8")
    assert "Reverend Avenue" not in text  # never was there
    assert "Reverend Abernathy" not in text  # never substituted in

    # Speaker-originating row 1.8 (Aaron Dixon) should be pending too.
    assert "1.8" in pending_by_id
    # And the speaker's name is still in the text, pending didn't touch it.
    assert "Aaron Dixon" in text


def test_manifest_has_expected_top_level_keys(tmp_out_dir):
    manifests = _run(tmp_out_dir, entries=[1])
    m = manifests[1]
    expected = {
        "generated",
        "script_version",
        "raw_dir",
        "entry_number",
        "entry_subject",
        "applied_corrections",
        "pending_context",
        "skipped_rows",
        "files_processed",
        "stats",
    }
    assert expected.issubset(m.keys())
    assert m["entry_number"] == 1
    assert m["raw_dir"] == "test_entry_one_interview"


def test_dry_run_writes_nothing(tmp_out_dir):
    parsed = apply_corrections.parse_master_md(FIXTURE_MASTER)
    apply_corrections.process_entry(
        parsed[1],
        raw_root=FIXTURE_RAW,
        out_root=tmp_out_dir,
        dry_run=True,
        verbose=False,
    )
    # No files should have been written.
    contents = list(tmp_out_dir.rglob("*"))
    assert contents == []


def test_parse_entries_arg_ranges():
    assert apply_corrections.parse_entries_arg("1,2,5-7,10") == [1, 2, 5, 6, 7, 10]
    assert apply_corrections.parse_entries_arg("3") == [3]
    assert apply_corrections.parse_entries_arg("") == []


def test_skipped_row_classification():
    """Rows with `n/a` confidence go to skipped_rows."""
    row = apply_corrections.CorrectionRow(
        row_id="X.1",
        whisper="foo",
        correction="bar",
        confidence="n/a",
        source="",
        notes="",
        table="pass1",
    )
    drop, reason = apply_corrections._row_should_drop(row)
    assert drop is True
    assert reason is not None and "n/a" in reason.lower()


def test_skipped_row_empty_correction():
    row = apply_corrections.CorrectionRow(
        row_id="X.2",
        whisper="foo",
        correction="",
        confidence="high",
        source="",
        notes="",
        table="pass1",
    )
    drop, reason = apply_corrections._row_should_drop(row)
    assert drop is True


def test_skipped_row_not_in_transcript_note():
    row = apply_corrections.CorrectionRow(
        row_id="X.3",
        whisper="something",
        correction="not in transcript",
        confidence="high",
        source="",
        notes="",
        table="pass1",
    )
    drop, _ = apply_corrections._row_should_drop(row)
    assert drop is True
