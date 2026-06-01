"""
intake_essay_candidate.py - the standardized candidate front-door for the
curated-essays layer. It is the essay analog of dropping a raw interview into
transcripts/raw/: a proposer records a candidate essay, and this script vets the
metadata and runs the LICENSE-DERIVATIVE GATE deterministically, promoting the
row to 'verified' (ready to harvest) or REFUSING it with the specific reason.

WHERE CANDIDATES LIVE. Candidates live as rows in public/rag/essays/manifest.json
with status 'candidate', exactly the same file and the same lifecycle field the
harvester already reads (status: candidate -> verified -> hosted; 'excluded' for
a permanently disqualified row). This deliberately mirrors how interviews track
state: an interview has ONE manifest in its corrected/ directory that carries it
from bootstrap through onboarding, not a separate "candidate interview" file.
Keeping essays in one manifest preserves a single source of truth, keeps the
harvester's "process verified rows only" invariant intact (it already skips
'candidate' and refuses non-qualifying licenses), and means the suggestion
front-door and the curation record never drift apart. A separate candidates.json
would fork the source of truth and force every downstream reader (harvest, index,
sources report, onboard) to merge two files.

WHAT THIS DOES (and does NOT do). This validates METADATA and LICENSE only. It
never fetches the essay text; that is harvest_essays.py's job (stage 'harvest' of
onboard_essay.py). The separation matters: a candidate can be license-vetted and
queued long before anyone commits the bytes of the reproduction. The license gate
here is the SAME gate harvest enforces (manifest.license_gate qualifies/excluded),
so a row this script marks 'verified' will not be refused later for its license.

THE LICENSE-DERIVATIVE GATE (the controlling rule). Embedding a text into the
search index is a derivative use, so the license MUST permit derivative use.
No-Derivatives licenses (cc-by-nd, cc-by-nc-nd, which is why the SNCC Digital
Gateway tier is out) are categorically excluded. NonCommercial is acceptable for
this non-commercial academic project. Qualifying tiers: public-domain,
us-government-public-domain, cc0, cc-by, cc-by-sa, cc-by-nc, cc-by-nc-sa. A type
that is not in the manifest's 'qualifies' set, or is in its 'excluded' set, is
REFUSED with the reason. Verify the SPECIFIC item, not the repository.

IDEMPOTENT. Re-running on an already-verified (or hosted) row is a no-op that
reports the current state. Adding a candidate whose slug already exists updates
that row in place rather than duplicating it.

Usage:
  # Vet an existing manifest candidate row and (if it passes) mark it verified:
  python scripts/intake_essay_candidate.py --slug douglass-narrative \
      --verified-by "opus-4.8 (Gutenberg public-domain confirmation)"

  # Add a brand-new candidate row from a JSON file, then vet it in one step:
  python scripts/intake_essay_candidate.py --from-json my_candidate.json \
      --verified-by "Eric (per-item license check)"

  # Add a candidate but DO NOT promote it (record only; license still unconfirmed):
  python scripts/intake_essay_candidate.py --from-json my_candidate.json --record-only

  # Dry run: report the verdict without writing the manifest:
  python scripts/intake_essay_candidate.py --slug douglass-narrative --dry-run

The candidate JSON for --from-json is a single object with at least:
  slug, title, authors[], source_url (or source.book_url / source.url),
  year, license {type, url?, note?}, themes[] (topic ids), rationale, proposer.
See public/rag/essays/README.md ("The candidate front-door") and
public/rag/essays/candidate.example.json for the full shape.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ESSAYS = ROOT / "public" / "rag" / "essays"
MANIFEST = ESSAYS / "manifest.json"

# The candidate-record fields a proposer must supply. These are validated as
# metadata; the license is validated separately by the gate. source_url may be
# given top-level or inside source (book_url / url), so it is checked specially.
REQUIRED_CANDIDATE_FIELDS = ["slug", "title", "authors", "year", "license", "themes"]
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def load_manifest() -> dict:
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def save_manifest(man: dict) -> None:
    MANIFEST.write_text(json.dumps(man, ensure_ascii=False, indent=2), encoding="utf-8", newline="")


def qualifies(license_type: str, gate: dict) -> tuple[bool, str]:
    """The license-derivative gate, identical in semantics to
    harvest_essays.py::qualifies, but it also returns the reason so the intake
    front-door can tell a proposer exactly why a row was refused."""
    excluded = gate.get("excluded", [])
    allowed = gate.get("qualifies", [])
    if license_type in excluded:
        return False, (
            f"license type {license_type!r} is in the gate's excluded set "
            f"(No-Derivatives / paywalled / unknown do not permit the derivative "
            f"use that embedding into the search index requires)"
        )
    if license_type not in allowed:
        return False, (
            f"license type {license_type!r} is not in the gate's qualifying set "
            f"{allowed!r}; verify the SPECIFIC item's license and use a qualifying "
            f"type, or mark the row status 'excluded' if it cannot qualify"
        )
    return True, f"license type {license_type!r} permits derivative use (qualifies under the gate)"


def source_url_of(row: dict) -> str | None:
    if row.get("source_url"):
        return row["source_url"]
    src = row.get("source") or {}
    return src.get("book_url") or src.get("url") or row.get("license", {}).get("url")


def validate_candidate_metadata(row: dict, topic_ids: set[str]) -> list[str]:
    """Return a list of human-readable problems; empty list means valid.
    This is metadata hygiene only, NOT the license gate."""
    problems: list[str] = []
    for f in REQUIRED_CANDIDATE_FIELDS:
        if row.get(f) in (None, "", [], {}):
            problems.append(f"missing required field {f!r}")
    slug = row.get("slug", "")
    if slug and not SLUG_RE.match(slug):
        problems.append(f"slug {slug!r} must be lowercase-hyphenated (a-z, 0-9, single hyphens)")
    if not isinstance(row.get("authors"), list) or not all(isinstance(a, str) for a in row.get("authors", [])):
        problems.append("authors must be a list of strings (use [] only for a corporate/anonymous work)")
    lic = row.get("license")
    if not isinstance(lic, dict) or not lic.get("type"):
        problems.append("license must be an object with a 'type' (see the gate's qualifying tiers)")
    themes = row.get("themes")
    if not isinstance(themes, list) or not themes:
        problems.append("themes must be a non-empty list of topic ids from topics.json")
    else:
        unknown = [t for t in themes if t not in topic_ids]
        if unknown:
            problems.append(
                f"theme id(s) {unknown!r} are not in topics.json; add the topic there first "
                f"or use an existing id (cross-linking is keyed on these ids)"
            )
    if not source_url_of(row):
        problems.append(
            "no source URL found (provide top-level 'source_url', or 'source.book_url' / "
            "'source.url', or 'license.url'); harvest needs a canonical source"
        )
    return problems


def upsert_row(man: dict, candidate: dict) -> dict:
    """Insert the candidate as a new manifest row, or update the existing row
    with the same slug in place (idempotent). Returns the row now in the manifest."""
    rows = man["sources"]
    for i, r in enumerate(rows):
        if r.get("slug") == candidate["slug"]:
            merged = {**r, **candidate}
            rows[i] = merged
            return merged
    # New candidate: default status to 'candidate' unless the file set one.
    candidate.setdefault("status", "candidate")
    rows.append(candidate)
    return candidate


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Vet and promote a curated-essay candidate (license-derivative gate).")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--slug", help="vet an existing manifest candidate row by slug")
    g.add_argument("--from-json", help="path to a candidate JSON object to add to the manifest, then vet")
    ap.add_argument("--verified-by", default=None,
                    help="attribution string recorded on a passing row (who confirmed the per-item license)")
    ap.add_argument("--record-only", action="store_true",
                    help="add/update the candidate row but do NOT promote to verified (license still unconfirmed)")
    ap.add_argument("--dry-run", action="store_true", help="report the verdict without writing the manifest")
    args = ap.parse_args(argv)

    if not MANIFEST.is_file():
        raise SystemExit(f"[intake] manifest not found: {MANIFEST}")
    man = load_manifest()
    gate = man.get("license_gate", {})

    # Topic ids drive cross-linking; a candidate's themes must reference them.
    topics_path = ESSAYS / "topics.json"
    topic_ids: set[str] = set()
    if topics_path.is_file():
        topic_ids = {t.get("id") for t in json.loads(topics_path.read_text(encoding="utf-8")).get("topics", [])}

    # 1. Resolve the candidate row (existing slug, or a new row from --from-json).
    if args.from_json:
        cand_path = Path(args.from_json)
        if not cand_path.is_file():
            raise SystemExit(f"[intake] --from-json file not found: {cand_path}")
        try:
            candidate = json.loads(cand_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            raise SystemExit(f"[intake] --from-json is not valid JSON: {e}")
        if not isinstance(candidate, dict) or not candidate.get("slug"):
            raise SystemExit("[intake] --from-json must be a single JSON object with a 'slug'")
        slug = candidate["slug"]
    else:
        slug = args.slug
        candidate = None
        for r in man["sources"]:
            if r.get("slug") == slug:
                candidate = r
                break
        if candidate is None:
            raise SystemExit(
                f"[intake] no manifest row with slug {slug!r}. Add one with --from-json, "
                f"or check the slug against public/rag/essays/manifest.json."
            )

    print(f"== intake essay candidate: {slug} ==")

    # 2. Metadata validation (hygiene, not the gate).
    problems = validate_candidate_metadata(candidate, topic_ids)
    if problems:
        print("  [INVALID] candidate metadata problems:")
        for p in problems:
            print(f"    - {p}")
        print("  Fix the candidate record and re-run. Nothing written.")
        return 1
    print("  [ok] candidate metadata valid")

    # 3. The LICENSE-DERIVATIVE GATE (the controlling check).
    lt = candidate["license"]["type"]
    passed, reason = qualifies(lt, gate)
    if not passed:
        print(f"  [REFUSE] {reason}")
        # Record the refused candidate (so the rejection is auditable) unless this
        # is a dry run. Status stays 'candidate' (or becomes 'excluded' only by a
        # human decision); we never silently flip a refused row to verified.
        if args.from_json and not args.dry_run:
            upsert_row(man, candidate)
            save_manifest(man)
            print(f"  recorded candidate row {slug!r} (status 'candidate'); it will NOT harvest until "
                  f"its license is corrected to a qualifying tier.")
        return 2
    print(f"  [PASS] {reason}")

    # 4. Promote (or record-only). Idempotent on already-verified/hosted rows.
    current = candidate.get("status")
    if args.from_json:
        candidate = upsert_row(man, candidate)
        current = candidate.get("status")

    if args.record_only:
        if current not in ("verified", "hosted"):
            candidate["status"] = "candidate"
        action = f"recorded (status {candidate.get('status')!r}); not promoted (--record-only)"
    elif current == "hosted":
        action = "already hosted; left as-is (re-harvest with scripts/harvest_essays.py --redo if needed)"
    elif current == "verified":
        action = "already verified; ready for harvest"
    else:
        candidate["status"] = "verified"
        candidate["license_verified_date"] = date.today().isoformat()
        if args.verified_by:
            candidate["verified_by"] = args.verified_by
        elif not candidate.get("verified_by"):
            candidate["verified_by"] = "intake_essay_candidate.py (license-gate pass)"
        action = "promoted candidate -> verified (ready for harvest)"

    if args.dry_run:
        print(f"  [dry-run] would have: {action}")
        print("  Nothing written.")
        return 0

    save_manifest(man)
    print(f"  [done] {action}")
    if candidate.get("status") == "verified":
        print(f"  Next: run scripts/onboard_essay.py --slug {slug}  (or scripts/harvest_essays.py --slug {slug}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
