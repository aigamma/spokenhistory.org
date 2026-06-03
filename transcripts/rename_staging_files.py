#!/usr/bin/env python3
"""Rename per-entry staging files for institutional auditability.

Before: transcripts/pass{2,3,4}_stage/entry_36.md — opaque to museum reviewers
After:  transcripts/pass{2,3,4}_stage/entry_036_charles_f_mcdew.md

Why: the Smithsonian/LoC institutional review requires that any reviewer
without an LLM in the loop can navigate the audit-trail without first
cross-referencing entry numbers against subject names in a separate file.

Approach:
- Parse "### N. Subject" headings from CLEANED_TRANSCRIPTS_REVIEW.md (131 entries)
- Generate filename-safe subject slugs (lowercase, ASCII, underscores, length-capped)
- Rename via git mv to preserve history across the 5 staging directories
- Generate an INDEX.md per directory with the entry-number → filename mapping
- Run idempotent: re-runs detect already-renamed files and skip

Idempotency: if a file is already named entry_NNN_slug.md it is left alone.
If a file is named entry_NN.md (old format) it gets renamed.
If a file is missing entirely (SKIPPED entry) it is skipped.
"""

import re
import subprocess
import sys
from pathlib import Path
from typing import Optional

CIVIL_ROOT = Path(r"D:\civil")
MASTER_MD = CIVIL_ROOT / "transcripts" / "CLEANED_TRANSCRIPTS_REVIEW.md"

STAGING_DIRS = [
    CIVIL_ROOT / "transcripts" / "pass2_stage",
    CIVIL_ROOT / "transcripts" / "pass2_tail_stage",
    CIVIL_ROOT / "transcripts" / "pass3_stage",
    CIVIL_ROOT / "transcripts" / "pass4_stage",
    CIVIL_ROOT / "transcripts" / "per_entry_slices",
]

# Max length of the subject slug portion (after "entry_NNN_"). Long enough to
# carry compound joint-interview names, capped to keep filenames sane on
# Windows + reasonable in `ls` output.
SLUG_MAX_LEN = 60


def parse_entry_map(master_md: Path) -> dict[int, str]:
    """Parse `### N. Subject` headings from the master overlay."""
    content = master_md.read_text(encoding="utf-8")
    heading_re = re.compile(r"^### (\d+)\.\s+([^\n]+)$", re.MULTILINE)
    entries: dict[int, str] = {}
    for m in heading_re.finditer(content):
        number = int(m.group(1))
        subject = m.group(2).strip()
        # Strip parenthetical suffixes like "(PARTIAL)" — they're audit status,
        # not part of the canonical subject name
        subject = re.sub(r"\s*\([A-Z][A-Z ]+\)\s*$", "", subject).strip()
        entries[number] = subject
    return entries


def slugify(subject: str, max_len: int = SLUG_MAX_LEN) -> str:
    """Convert a subject name to a filename-safe ASCII slug.

    Examples:
      'Aaron Dixon'                  -> 'aaron_dixon'
      'Calvin "Cal" Luper'           -> 'calvin_cal_luper'
      'Audrey Nell Hamilton and JoeAnn Anderson Ulmer'
          -> 'audrey_nell_hamilton_and_joeann_anderson_ulmer'
      'Ekwueme Michael Thelwell'     -> 'ekwueme_michael_thelwell'
      "Joseph & Embry Howell"        -> 'joseph_embry_howell'
      'Dorothy "Dottie" Foreman Zellner'
          -> 'dorothy_dottie_foreman_zellner'
    """
    # Lowercase
    s = subject.lower()
    # ASCII transliteration for common diacritics
    diacritic_map = str.maketrans(
        "áàâäãåéèêëíìîïóòôöõúùûüñçß",
        "aaaaaaeeeeiiiiooooouuuunc" + "s",
    )
    s = s.translate(diacritic_map)
    # Replace ampersand with " and "
    s = s.replace("&", " and ")
    # Drop apostrophes/periods/quotes (don't replace with anything)
    s = re.sub(r"[''`\".,;:]", "", s)
    # Replace any remaining non-alphanumeric with underscore
    s = re.sub(r"[^a-z0-9]+", "_", s)
    # Collapse runs of underscores
    s = re.sub(r"_+", "_", s)
    # Trim leading/trailing underscores
    s = s.strip("_")
    # Length cap (word-boundary truncation if possible)
    if len(s) > max_len:
        cut = s[:max_len]
        last_underscore = cut.rfind("_")
        if last_underscore > max_len * 0.6:
            s = cut[:last_underscore]
        else:
            s = cut
    return s


def current_entry_number(filename: str) -> Optional[int]:
    """Extract entry number from old OR new filename format.

    Accepts:
      entry_73.md            -> 73 (old format)
      entry_073_kathleen_cleaver.md -> 73 (new format)
    Returns None if no match.
    """
    m = re.match(r"^entry_(\d+)(?:_[a-z0-9_]+)?\.md$", filename)
    if m:
        return int(m.group(1))
    return None


def is_new_format(filename: str) -> bool:
    """Return True if filename is already in entry_NNN_slug.md format."""
    return bool(re.match(r"^entry_\d{3}_[a-z0-9_]+\.md$", filename))


def git_mv(src: Path, dst: Path, dry_run: bool = False) -> bool:
    """Rename via git mv to preserve history. Returns True on success."""
    if dry_run:
        print(f"  [dry-run] git mv {src.name} {dst.name}")
        return True
    try:
        subprocess.run(
            ["git", "mv", str(src), str(dst)],
            cwd=str(CIVIL_ROOT),
            check=True,
            capture_output=True,
            text=True,
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"  ERROR git mv {src} -> {dst}: {e.stderr}")
        return False


def rename_directory(
    staging_dir: Path, entry_map: dict[int, str], dry_run: bool = False
) -> tuple[int, int, int]:
    """Rename all entry_*.md files in a staging directory.

    Returns (renamed_count, already_new_count, missing_subject_count).
    """
    if not staging_dir.exists():
        print(f"  Directory does not exist: {staging_dir}")
        return (0, 0, 0)

    renamed = 0
    already_new = 0
    missing_subject = 0

    files = sorted(staging_dir.glob("entry_*.md"))
    print(f"\n{staging_dir.relative_to(CIVIL_ROOT)} — {len(files)} files")

    for f in files:
        # Skip files already in new format
        if is_new_format(f.name):
            already_new += 1
            continue

        number = current_entry_number(f.name)
        if number is None:
            print(f"  SKIP unparseable filename: {f.name}")
            continue

        subject = entry_map.get(number)
        if not subject:
            print(f"  SKIP entry #{number}: no subject in master MD (SKIPPED entry?)")
            missing_subject += 1
            continue

        slug = slugify(subject)
        new_name = f"entry_{number:03d}_{slug}.md"
        new_path = f.parent / new_name

        if new_path.exists():
            print(f"  SKIP {f.name}: target {new_name} already exists")
            continue

        if git_mv(f, new_path, dry_run=dry_run):
            renamed += 1

    print(f"  -> renamed={renamed} already_new={already_new} missing_subject={missing_subject}")
    return (renamed, already_new, missing_subject)


def write_index(staging_dir: Path, entry_map: dict[int, str], dry_run: bool = False) -> None:
    """Write an INDEX.md per staging directory mapping entry number to filename + subject."""
    if not staging_dir.exists():
        return

    files = sorted(staging_dir.glob("entry_*.md"))
    dir_label = staging_dir.name

    lines = [
        f"# {dir_label} — entry index",
        "",
        "Cross-reference for institutional auditability: maps each entry number to its subject name and filename. The files in this directory are named `entry_NNN_subject_slug.md` (zero-padded entry number + lowercase-underscored subject) so museum / LoC reviewers can navigate without an LLM in the loop.",
        "",
        f"Total files: {len(files)}",
        "",
        "| Entry # | Subject | Filename |",
        "|---|---|---|",
    ]

    for f in files:
        number = current_entry_number(f.name)
        if number is None:
            continue
        subject = entry_map.get(number, "(SKIPPED — no subject in master MD)")
        lines.append(f"| {number} | {subject} | `{f.name}` |")

    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("Generated by `transcripts/rename_staging_files.py`. Re-run after adding or renaming files in this directory.")
    lines.append("")

    index_path = staging_dir / "INDEX.md"
    content = "\n".join(lines)
    if dry_run:
        print(f"  [dry-run] would write INDEX.md ({len(lines)} lines)")
    else:
        index_path.write_text(content, encoding="utf-8")
        print(f"  wrote {index_path.relative_to(CIVIL_ROOT)}")


def main() -> int:
    dry_run = "--dry-run" in sys.argv

    print("=" * 60)
    print(f"Renaming per-entry staging files ({'DRY RUN' if dry_run else 'APPLYING'})")
    print("=" * 60)

    if not MASTER_MD.exists():
        print(f"ERROR master MD not found at {MASTER_MD}")
        return 1

    entry_map = parse_entry_map(MASTER_MD)
    print(f"\nParsed {len(entry_map)} entries from master MD")
    print(f"  Entry # range: {min(entry_map)}–{max(entry_map)}")
    print(f"  Examples: #{1}={entry_map[1]!r}, #{73}={entry_map.get(73)!r}, #{132}={entry_map.get(132)!r}")

    total_renamed = 0
    total_already = 0
    total_missing = 0
    for staging_dir in STAGING_DIRS:
        renamed, already, missing = rename_directory(staging_dir, entry_map, dry_run=dry_run)
        total_renamed += renamed
        total_already += already
        total_missing += missing

    print("\n" + "=" * 60)
    print(f"Total: renamed={total_renamed} already_new={total_already} missing_subject={total_missing}")
    print("=" * 60)

    print("\nWriting INDEX.md per directory...")
    for staging_dir in STAGING_DIRS:
        write_index(staging_dir, entry_map, dry_run=dry_run)

    if dry_run:
        print("\n(dry-run; no actual renames or writes)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
