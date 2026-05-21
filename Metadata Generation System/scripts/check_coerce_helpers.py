"""
Standalone test for the three model-output coercion helpers shipped in
the Smithsonian-grade overhaul:

  - processor.tuning._coerce_score      (OpenAI scorer output)
  - processor.claude_scorer._coerce_score (Claude scorer output)
  - processor.citation_check._coerce_count (citation auditor output)

These helpers are pure functions with no external dependencies, so they
can be tested without mocking any API. The test exists because the
helpers are load-bearing -- they prevent run_tuning_loop's comparisons
from crashing on type-confused model output, and a regression that
changed their semantics could silently break the publication gate.

Designed to be CI-runnable with NO pytest / mock / fixture dependency.
Plain stdlib, plain print output, exit 0 on all pass, exit 1 on any
fail. Add to .github/workflows/ci.yml as a Python-job step alongside
the existing python -m compileall and validate_facts.py checks.
"""

import sys
from pathlib import Path

# Add the Metadata Generation System directory to sys.path so the
# `processor.*` imports work. The script lives in scripts/ which is
# parallel to processor/, so the parent directory is what we need.
HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))


def main() -> int:
    failures = []

    # Import the three coerce helpers. The imports use try/except so a
    # missing-import is a test failure (with a clear message) rather
    # than a sys.exit at module-load time -- the goal is to catch
    # regressions in the helpers themselves, not crash early on a
    # different problem.
    try:
        from processor.tuning import _coerce_score as tuning_coerce_score
    except Exception as e:
        failures.append(f"import processor.tuning._coerce_score: {e}")
        tuning_coerce_score = None

    try:
        from processor.claude_scorer import _coerce_score as claude_coerce_score
    except Exception as e:
        failures.append(f"import processor.claude_scorer._coerce_score: {e}")
        claude_coerce_score = None

    try:
        from processor.citation_check import _coerce_count as citation_coerce_count
    except Exception as e:
        failures.append(f"import processor.citation_check._coerce_count: {e}")
        citation_coerce_count = None

    try:
        from processor.claude_scorer import _coerce_int as claude_coerce_int
    except Exception as e:
        failures.append(f"import processor.claude_scorer._coerce_int: {e}")
        claude_coerce_int = None

    # ── Score helpers: should clamp to [0, 100] ─────────────────────
    score_cases = [
        # (input, expected_after_coercion, label)
        (85, 85, "int pass-through"),
        (0, 0, "int zero"),
        (100, 100, "int max"),
        (150, 100, "over-max clamps to 100"),
        (-5, 0, "negative clamps to 0"),
        (85.5, 85, "float truncates to int"),
        ("85", 85, "string-of-digits"),
        ("85.5", 85, "string-of-decimal"),
        ("  90  ", 90, "string with whitespace"),
        (None, 0, "None falls back to 0"),
        ("", 0, "empty string falls back to 0"),
        ("high", 0, "non-numeric string falls back to 0"),
        (True, 0, "bool True rejected (subclass-of-int gotcha)"),
        (False, 0, "bool False rejected"),
        ([], 0, "list falls back to 0"),
        ({}, 0, "dict falls back to 0"),
    ]

    for helper_name, helper in [
        ("tuning._coerce_score", tuning_coerce_score),
        ("claude_scorer._coerce_score", claude_coerce_score),
    ]:
        if helper is None:
            continue
        for inp, expected, label in score_cases:
            try:
                got = helper(inp)
            except Exception as e:
                failures.append(f"{helper_name}({inp!r}) raised {type(e).__name__}: {e}")
                continue
            if got != expected:
                failures.append(
                    f"{helper_name}({inp!r}) = {got!r} (expected {expected!r}) [{label}]"
                )

    # ── Count helper: should clamp to non-negative ──────────────────
    # citation_check._coerce_count is the unbounded-non-negative variant
    # (counts can be larger than 100, just not negative).
    count_cases = [
        (20, 20, "int pass-through"),
        (0, 0, "int zero"),
        (500, 500, "no upper clamp (counts can be large)"),
        (-5, 0, "negative clamps to 0"),
        (20.7, 20, "float truncates"),
        ("20", 20, "string-of-digits"),
        ("20.5", 20, "string-of-decimal"),
        (None, 0, "None"),
        ("", 0, "empty string"),
        ("abc", 0, "non-numeric string"),
        (True, 0, "bool True rejected"),
        ([], 0, "list rejected"),
    ]

    # Run the count cases against both citation_check._coerce_count AND
    # claude_scorer._coerce_int -- they are parallel-named helpers with
    # the same semantics (non-negative unbounded int coercion), and the
    # corpus relies on both behaving identically so that the
    # supported_claims_count field from the Claude scorer (handled by
    # _coerce_int) and the per-claim counts from the citation auditor
    # (handled by _coerce_count) produce the same shape of result.
    for helper_name, helper in [
        ("citation_check._coerce_count", citation_coerce_count),
        ("claude_scorer._coerce_int", claude_coerce_int),
    ]:
        if helper is None:
            continue
        for inp, expected, label in count_cases:
            try:
                got = helper(inp)
            except Exception as e:
                failures.append(
                    f"{helper_name}({inp!r}) raised {type(e).__name__}: {e}"
                )
                continue
            if got != expected:
                failures.append(
                    f"{helper_name}({inp!r}) = {got!r} (expected {expected!r}) [{label}]"
                )

    # ── Report ──────────────────────────────────────────────────────
    if failures:
        print(f"FAIL: {len(failures)} coerce-helper test failure(s):", file=sys.stderr)
        for f in failures:
            print(f"  - {f}", file=sys.stderr)
        return 1

    print(
        "OK: all coerce-helper tests passed. Verified "
        f"{len(score_cases) * 2 + len(count_cases) * 2} cases across "
        "tuning._coerce_score, claude_scorer._coerce_score, "
        "citation_check._coerce_count, claude_scorer._coerce_int."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
