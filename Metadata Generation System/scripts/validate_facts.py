"""
Schema validator for civil_rights_facts.json.

Runs from the Metadata Generation System directory and exits non-zero if
any structural problem is found. Designed for CI pre-commit hook use:
    python scripts/validate_facts.py
returns 0 on a clean file, non-zero on any structural mistake.

Checks performed:
  - File exists and parses as JSON.
  - Top-level value is an object (dict).
  - Every entry value is an object with at least
    wikipedia_title (str), description (str), summary (str) keys.
  - Optional 'aliases' key, if present, is a list of non-empty strings.
  - NO DUPLICATE KEYS at the top level (the json module silently
    overwrites duplicates by default; this validator hooks
    object_pairs_hook to detect them explicitly).
  - Summary length is at least 100 characters (catches truncated entries
    accidentally introduced by Edit operations).

Usage:
    python scripts/validate_facts.py
    python scripts/validate_facts.py --quiet   # only output on failure
"""

import json
import sys
from pathlib import Path

REQUIRED_FIELDS = ("wikipedia_title", "description", "summary")
MIN_SUMMARY_CHARS = 100


def validate(path: Path, quiet: bool = False) -> int:
    """Validate the facts file. Returns 0 on success, non-zero on failure."""
    if not path.exists():
        print(f"ERROR: file not found: {path}", file=sys.stderr)
        return 1

    # Detect duplicate top-level keys -- json.load silently overwrites by
    # default, so a typo or copy-paste error that creates a duplicate
    # entry name would land in the file without warning and shadow the
    # earlier definition. The object_pairs_hook receives the (key, value)
    # pairs in document order, lets us validate uniqueness, then returns
    # a dict for the regular loader.
    def _detect_duplicates(pairs):
        seen = set()
        for key, _value in pairs:
            if key in seen:
                raise ValueError(f"duplicate top-level key: {key!r}")
            seen.add(key)
        return dict(pairs)

    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f, object_pairs_hook=_detect_duplicates)
    except json.JSONDecodeError as e:
        print(f"ERROR: invalid JSON in {path}: {e}", file=sys.stderr)
        return 1
    except ValueError as e:
        print(f"ERROR: {path}: {e}", file=sys.stderr)
        return 1

    if not isinstance(data, dict):
        print(f"ERROR: top-level JSON value must be an object, got {type(data).__name__}", file=sys.stderr)
        return 1

    errors = []

    for key, value in data.items():
        if not isinstance(value, dict):
            errors.append(f"entry '{key}': value is not an object")
            continue

        for field in REQUIRED_FIELDS:
            if field not in value:
                errors.append(f"entry '{key}': missing required field '{field}'")
                continue
            if not isinstance(value[field], str):
                errors.append(f"entry '{key}': field '{field}' is not a string")
                continue
            if not value[field].strip():
                errors.append(f"entry '{key}': field '{field}' is empty")

        summary = value.get("summary", "")
        if isinstance(summary, str) and len(summary) < MIN_SUMMARY_CHARS:
            errors.append(
                f"entry '{key}': summary is suspiciously short "
                f"({len(summary)} chars, expected >= {MIN_SUMMARY_CHARS})"
            )

        if "aliases" in value:
            aliases = value["aliases"]
            if not isinstance(aliases, list):
                errors.append(f"entry '{key}': aliases must be a list, got {type(aliases).__name__}")
            else:
                for i, alias in enumerate(aliases):
                    if not isinstance(alias, str):
                        errors.append(f"entry '{key}': aliases[{i}] is not a string")
                    elif not alias.strip():
                        errors.append(f"entry '{key}': aliases[{i}] is empty")

    if errors:
        print(f"FAIL: {len(errors)} structural problem(s) in {path}:", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    if not quiet:
        alias_count = sum(1 for v in data.values() if "aliases" in v)
        print(
            f"OK: {path.name} has {len(data)} valid entries "
            f"({alias_count} with aliases)"
        )
    return 0


def main():
    here = Path(__file__).resolve().parent.parent
    facts_path = here / "civil_rights_facts.json"
    quiet = "--quiet" in sys.argv
    sys.exit(validate(facts_path, quiet=quiet))


if __name__ == "__main__":
    main()
