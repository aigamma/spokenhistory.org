"""
onboard_essay.py - the master, idempotent pipeline that takes a curated-essay
candidate all the way onto the live site: license-vetted, promoted, harvested
verbatim, indexed, search-ingested, and recorded in the provenance report. This
is the essay parity to transcripts/ingestion/onboard_interview.py, so the
content-suggestion concept is unified across interviews and essays.

It is the single entry point for hosting a new essay. It supersedes the hand-run
chain of intake -> harvest -> build_essays_index -> ingest -> sources-report.
Run it once; re-run it any time. Every stage checks for its own output and skips
work already done, so it is safe to re-run after a candidate's license is
confirmed. Nothing is fetched twice (harvest caches the source book; ingest is
content-hash idempotent).

PIPELINE STAGES (each idempotent)
  1. validate   confirm the candidate row exists in manifest.json and its
                metadata is well-formed                       (STOPS if absent/invalid)
  2. license    the LICENSE-DERIVATIVE GATE (hard stop). Embedding is a
                derivative use, so a No-Derivatives / paywalled / unknown
                license is REFUSED here                       (HARD STOP if it fails)
  3. promote    flip the row candidate -> verified via
                intake_essay_candidate.py                      (skips if already verified/hosted)
  4. harvest    fetch + extract the verbatim body via
                scripts/harvest_essays.py (the ONLY network    (skips if already hosted)
                step; writes text/<slug>.txt + <slug>.json)
  5. index      rebuild public/rag/essays/index.json via
                scripts/build_essays_index.mjs                 (rebuilds from current data)
  6. ingest     node rag/ingest.mjs --essays-only (Voyage ->   (gated on rag/.env.local;
                Pinecone), chunks + embeds content_type='essay' idempotent on content hash;
                                                                --skip-ingest to opt out)
  7. report     rebuild output/essays-sources-report.md via
                scripts/build_essays_sources_report.mjs        (rebuilds from current data)
  8. status     print what is done and what (if anything) still needs a human

WHAT IS AUTHORED-BY-HUMAN vs AUTOMATED. The one human decision is the per-item
license verification, recorded when a candidate is proposed (the candidate row's
license.type plus license_verified_date / verified_by) and ENFORCED by stage 2.
The proposer must verify the SPECIFIC item's license, not the repository's. Once
the candidate row is correct, every other stage is mechanical: the essay body is
a verbatim reproduction (no editorial writing), the index and report are derived,
and the embedding is deterministic. This is the deliberate contrast with the
interview pipeline, whose two authored inputs (chapter spec + summary + person
page) exist because an interview needs reviewable segmentation and a
citation-bearing page; an essay needs neither, only a clean license.

THE CANDIDATE FRONT-DOOR. A candidate is a row in public/rag/essays/manifest.json
with status 'candidate'. Add one with:
  python scripts/intake_essay_candidate.py --from-json my_candidate.json --record-only
then run this pipeline on its slug. See public/rag/essays/README.md
("The candidate front-door") for the candidate schema and a worked example.

Usage:
  python scripts/onboard_essay.py --slug douglass-narrative
  python scripts/onboard_essay.py --from-json my_candidate.json   # add the candidate, then onboard it
  python scripts/onboard_essay.py --slug X --verified-by "Eric (per-item license check)"
  python scripts/onboard_essay.py --slug X --skip-ingest          # do everything but the paid Pinecone write
  python scripts/onboard_essay.py --slug X --stop-after harvest
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
ESSAYS = ROOT / "public" / "rag" / "essays"
MANIFEST = ESSAYS / "manifest.json"
TEXT_DIR = ESSAYS / "text"
INDEX = ESSAYS / "index.json"
SOURCES_REPORT = ROOT / "output" / "essays-sources-report.md"

STAGES = ["validate", "license", "promote", "harvest", "index", "ingest", "report", "status"]


def log(stage: str, msg: str) -> None:
    print(f"  [{stage}] {msg}")


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, cwd=str(ROOT))


def rag_env() -> bool:
    return (ROOT / "rag" / ".env.local").is_file()


def load_manifest() -> dict:
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def find_row(man: dict, slug: str) -> dict | None:
    for r in man.get("sources", []):
        if r.get("slug") == slug:
            return r
    return None


# ---------------------------------------------------------------------------
# Stage helpers. Stages 1 to 3 reuse intake_essay_candidate.py (validation +
# license gate + promotion) so the gate has ONE implementation. Stages 4 to 7
# shell out to the existing essay scripts exactly the way onboard_interview.py
# shells out to its sub-steps; none of their logic is duplicated here.
# ---------------------------------------------------------------------------
def stage_intake(slug: str, from_json: str | None, verified_by: str | None) -> int:
    """Stages 1 to 3 in one call: validate -> license gate -> promote.
    intake_essay_candidate.py returns 0 (promoted/already-verified), 1 (invalid
    metadata), or 2 (license refused). We surface its output verbatim and map a
    non-zero code to a hard stop, the gate is the controlling rule."""
    cmd = [sys.executable, str(SCRIPTS / "intake_essay_candidate.py")]
    if from_json:
        cmd += ["--from-json", from_json]
    else:
        cmd += ["--slug", slug]
    if verified_by:
        cmd += ["--verified-by", verified_by]
    rc = run(cmd)
    sys.stdout.write(rc.stdout)
    if rc.stderr.strip():
        sys.stderr.write(rc.stderr)
    return rc.returncode


def stage_harvest(slug: str) -> bool:
    """Reuse scripts/harvest_essays.py for the verbatim extraction. It is the
    ONLY network step and is itself idempotent (skips an already-hosted row,
    re-fetches only when the cached Gutenberg book is missing)."""
    txt = TEXT_DIR / f"{slug}.txt"
    per_essay = ESSAYS / f"{slug}.json"
    if txt.is_file() and per_essay.is_file():
        log("harvest", f"already hosted: text/{slug}.txt + {slug}.json present; skip")
        return True
    log("harvest", f"node scripts/harvest_essays.py --slug {slug} ...")
    rc = run([sys.executable, str(SCRIPTS / "harvest_essays.py"), "--slug", slug])
    sys.stdout.write(rc.stdout)
    if rc.returncode != 0:
        log("harvest", f"harvest_essays.py returned {rc.returncode}; see output above")
        if rc.stderr.strip():
            sys.stderr.write(rc.stderr)
        return False
    if not (txt.is_file() and per_essay.is_file()):
        # harvest refused or skipped this row (e.g. a non-Gutenberg source kind,
        # or a license that did not qualify). Tell the operator plainly.
        log("harvest", f"harvest did not produce text/{slug}.txt. Likely a non-harvestable "
                       f"source kind (only gutenberg-chapter / gutenberg-whole are auto-fetched) "
                       f"or a row not yet 'verified'. See harvest output above.")
        return False
    log("harvest", f"hosted text/{slug}.txt + {slug}.json")
    return True


def stage_index() -> None:
    log("index", "node scripts/build_essays_index.mjs ...")
    rc = run(["node", str(SCRIPTS / "build_essays_index.mjs")])
    tail = rc.stdout.strip().splitlines()[-1] if rc.stdout.strip() else ""
    log("index", tail or "(no output)")
    if rc.returncode != 0:
        log("index", f"  WARN build_essays_index.mjs rc={rc.returncode}: {rc.stderr[-240:]}")


def stage_ingest(slug: str, skip: bool) -> None:
    if skip:
        log("ingest", "skipped (--skip-ingest); run later: "
                      "node --env-file=rag/.env.local rag/ingest.mjs --essays-only")
        return
    if not rag_env():
        log("ingest", "rag/.env.local missing; skipping the Pinecone write. Run it when "
                      "credentials are available: node --env-file=rag/.env.local rag/ingest.mjs --essays-only")
        return
    log("ingest", "node --env-file=rag/.env.local rag/ingest.mjs --essays-only "
                  "(content-hash idempotent; only new/changed essays embed) ...")
    rc = run(["node", "--env-file=rag/.env.local", "rag/ingest.mjs", "--essays-only"])
    sys.stdout.write(rc.stdout[-600:])
    if rc.returncode != 0:
        log("ingest", f"ingest returned {rc.returncode}; check output above. Essay vectors can be (re)ingested later.")
    else:
        log("ingest", "essay search ingest complete")


def stage_report() -> None:
    log("report", "node scripts/build_essays_sources_report.mjs ...")
    rc = run(["node", str(SCRIPTS / "build_essays_sources_report.mjs")])
    tail = rc.stdout.strip().splitlines()[-1] if rc.stdout.strip() else ""
    log("report", tail or "(no output)")
    if rc.returncode != 0:
        log("report", f"  WARN build_essays_sources_report.mjs rc={rc.returncode}: {rc.stderr[-240:]}")


# ---------------------------------------------------------------------------
def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Master idempotent curated-essay onboarding pipeline.")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--slug", help="onboard an existing manifest candidate row by slug")
    g.add_argument("--from-json", help="add a candidate JSON object to the manifest, then onboard it")
    ap.add_argument("--verified-by", default=None,
                    help="attribution recorded on the row when the license gate passes")
    ap.add_argument("--skip-ingest", action="store_true", help="do everything but the paid Pinecone write")
    ap.add_argument("--stop-after", choices=STAGES, default=None)
    args = ap.parse_args(argv)

    if not MANIFEST.is_file():
        raise SystemExit(f"[onboard] essays manifest not found: {MANIFEST}")

    # Resolve the slug now so the status block can report on it even when the
    # candidate is supplied via --from-json.
    slug = args.slug
    if args.from_json:
        try:
            slug = json.loads(Path(args.from_json).read_text(encoding="utf-8")).get("slug")
        except (OSError, json.JSONDecodeError) as e:
            raise SystemExit(f"[onboard] cannot read --from-json: {e}")
        if not slug:
            raise SystemExit("[onboard] --from-json must contain a 'slug'")

    print(f"== onboard essay {slug} ==")

    # Stages 1 to 3: validate + LICENSE GATE + promote (one reused implementation).
    rc = stage_intake(slug, args.from_json, args.verified_by)
    if rc == 1:
        print("\n  STOP: candidate metadata is invalid (see problems above). "
              "Fix the manifest row or the --from-json file, then re-run.")
        return 1
    if rc == 2:
        print("\n  STOP (license gate): this candidate's license does not permit the derivative "
              "use that embedding requires, so it cannot be hosted. Verify the SPECIFIC item's "
              "license; if it is a qualifying tier (public-domain, us-government-public-domain, "
              "cc0, cc-by, cc-by-sa, cc-by-nc, cc-by-nc-sa), correct the row's license.type and "
              "re-run. No-Derivatives / paywalled / unknown are categorically excluded.")
        return 2
    if rc != 0:
        print(f"\n  STOP: intake_essay_candidate.py returned {rc}; see output above.")
        return rc
    if args.stop_after in ("validate", "license", "promote"):
        return 0

    # Stage 4: harvest the verbatim body (reuses harvest_essays.py).
    if not stage_harvest(slug):
        print("\n  STOP: harvest did not host this essay (see harvest output above). "
              "If the source is not Project Gutenberg, host the body via the format adapter "
              "in public/rag/essays/README.md, then re-run from --stop-after index.")
        return 3
    if args.stop_after == "harvest":
        return 0

    # Stage 5: rebuild the /essays index.
    stage_index()
    if args.stop_after == "index":
        return 0

    # Stage 6: ingest to Pinecone (gated on rag/.env.local, like the interview pipeline).
    stage_ingest(slug, args.skip_ingest)
    if args.stop_after == "ingest":
        return 0

    # Stage 7: rebuild the provenance / sources report.
    stage_report()
    if args.stop_after == "report":
        return 0

    # Stage 8: status summary.
    man = load_manifest()
    row = find_row(man, slug) or {}
    status = row.get("status")
    hosted = (TEXT_DIR / f"{slug}.txt").is_file() and (ESSAYS / f"{slug}.json").is_file()
    ingested = rag_env() and not args.skip_ingest
    print(f"\n== onboarded essay {slug}: {row.get('title', '(unknown title)')} ==")
    print(f"  manifest status: {status}")
    print(f"  body hosted: {'yes (' + str(row.get('word_count', '?')) + ' words)' if hosted else 'NO'}")
    print(f"  /essays index: rebuilt ({INDEX.relative_to(ROOT)})")
    print(f"  search index: {'ingested' if ingested else 'PENDING (run rag/ingest.mjs --essays-only)'}")
    print(f"  sources report: rebuilt ({SOURCES_REPORT.relative_to(ROOT)})")
    print(f"  essay page: /essays/{slug} live after deploy; cross-links derive from its themes")
    if not ingested:
        print(f"\n  Search ingest still to run (when Voyage/Pinecone credentials are present):")
        print(f"    node --env-file=rag/.env.local rag/ingest.mjs --essays-only")
    print(f"\n  commit public/rag/essays/manifest.json, public/rag/essays/{slug}.json, "
          f"public/rag/essays/text/{slug}.txt, public/rag/essays/index.json, and "
          f"output/essays-sources-report.md together.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
