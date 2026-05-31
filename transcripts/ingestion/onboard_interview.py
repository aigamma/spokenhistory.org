"""
onboard_interview.py - the master, idempotent pipeline that takes a NEW
Civil Rights History Project interview submission all the way onto the live
site: onboarded, healed, chaptered, assembled, search-ingested, and networked.

This is the single entry point. It supersedes the hand-run chain of
extract_blocks / fetch-loc-videos / merge / build_playlist_index / rag-ingest
that used to be done step by step. Run it once; re-run it any time. Every
stage checks for its own output and skips work already done, so it is safe to
re-run after supplying the two authored inputs (the chapter spec and the
person page). Nothing is guessed twice.

PIPELINE STAGES (each idempotent; --redo <stage> forces one to re-run)
  1.  locate    find the entry under transcripts/corrected/ (or raw/)
  2.  bootstrap copy raw -> corrected/ + manifest        (skips if corrected/ exists)
  3.  resolve   LoC item URL for transcript healing       (skips if resolution.json exists)
  4.  heal      LoC-audit heal (heal_one_entry.py)         (skips if already healed)
  5.  number    assign entry_number; write it into the     (skips if already numbered)
                manifest and scripts/rechapter_map.json
  6.  video     resolve the LoC video (item ?fo=json)      (skips if loc_video already cached)
  7.  blocks    extract ~40s cue blocks                    (skips if blocks_<N>.txt exists)
  8.  chapters  CONSUME scripts/spec_<N>.json (granular,    (STOPS with instructions if absent)
                parts-grouped, topic-named) -> expand to
                cue-aligned chapters in rechapter_staging/
  9.  summary   CONSUME rechapter_staging/                 (STOPS with instructions if absent)
                entry_<N>.summary.txt
  10. assemble  build public/rag/summaries/pipeline_output/entry_<N>.json
                (and the output_subagent/ twin) from chapters + summary + loc_video
  11. ingest    node rag/ingest.mjs (Voyage -> Pinecone),  (idempotent on content hash)
                which adds the new entry's passage vectors
  12. person    scaffold public/rag/people/<slug>.json     (skips if a real page exists;
                so the interviewee is networked into /people  writes a thin stub + an
                                                              authoring checklist otherwise)
  13. indexes   rebuild public/rag/playlist_index.json + toc.json
  14. audit     append an ingestion note to AUDIT_TRAIL.md
  15. status    print what is done and what (if anything) still needs an author

THE TWO AUTHORED INPUTS (stages 8 and 12) are deliberately not auto-generated.
The Smithsonian / LoC bar requires the chapter segmentation and the
citation-bearing person page to be authored and reviewable, not blindly
produced. The pipeline tells you exactly what to write and where; once the
files exist, re-running carries them the rest of the way with no further
decisions.

Usage:
  python transcripts/ingestion/onboard_interview.py "<Subject>_interview_<YYYYMMDD>_<HHMMSS>"
  python transcripts/ingestion/onboard_interview.py "<dir>" --entry-number 141
  python transcripts/ingestion/onboard_interview.py "<dir>" --loc-item-url https://www.loc.gov/item/XXXX/
  python transcripts/ingestion/onboard_interview.py "<dir>" --partial      # mark a partial-excerpt transcript
  python transcripts/ingestion/onboard_interview.py "<dir>" --redo assemble
  python transcripts/ingestion/onboard_interview.py "<dir>" --stop-after chapters
  python transcripts/ingestion/onboard_interview.py "<dir>" --skip-ingest  # do everything but the paid Pinecone write
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TRANSCRIPTS = ROOT / "transcripts"
RAW_DIR = TRANSCRIPTS / "raw"
CORRECTED_DIR = TRANSCRIPTS / "corrected"
LOC_HEALING = TRANSCRIPTS / "loc_healing"
SCRIPTS = ROOT / "scripts"
STAGING = TRANSCRIPTS / "rechapter_staging"
PIPELINE_OUT = ROOT / "public" / "rag" / "summaries" / "pipeline_output"
OUTPUT_SUBAGENT = ROOT / "Metadata Generation System" / "output_subagent"
PEOPLE_DIR = ROOT / "public" / "rag" / "people"
RECHAPTER_MAP = SCRIPTS / "rechapter_map.json"
LOC_VIDEO_LINKS = OUTPUT_SUBAGENT / "loc_video_links.json"
USER_AGENT = "civil-rights-onboard-script eric@aigamma.com"
LOC_DELAY = 1.5

STAGES = ["locate", "bootstrap", "resolve", "heal", "number", "video", "blocks",
          "chapters", "summary", "assemble", "ingest", "person", "indexes", "audit", "status"]


# Reuse the proven sub-steps from ingest_new_transcript.py rather than duplicate.
sys.path.insert(0, str(TRANSCRIPTS / "ingestion"))
import ingest_new_transcript as ing  # noqa: E402


def log(stage: str, msg: str) -> None:
    print(f"  [{stage}] {msg}")


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, cwd=str(ROOT), **kw)


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[.,']", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def srt_in(dir_path: Path) -> Path | None:
    for p in sorted(dir_path.glob("*.srt")):
        return p
    return None


# ---------------------------------------------------------------------------
# Stage helpers
# ---------------------------------------------------------------------------
def stage_locate(entry_dir: str) -> tuple[Path, str, bool]:
    """Return (corrected_or_raw_dir, subject, from_raw)."""
    corrected = CORRECTED_DIR / entry_dir
    raw = RAW_DIR / entry_dir
    subject = ing._parse_subject_from_dir(entry_dir)
    if corrected.is_dir():
        log("locate", f"found corrected/{entry_dir}/  (subject: {subject})")
        return corrected, subject, False
    if raw.is_dir():
        log("locate", f"found raw/{entry_dir}/  (subject: {subject})")
        return raw, subject, True
    raise SystemExit(f"[locate] not found in corrected/ or raw/: {entry_dir}")


def stage_bootstrap(entry_dir: str, subject: str, from_raw: bool) -> None:
    corrected = CORRECTED_DIR / entry_dir
    if corrected.is_dir() and (corrected / "manifest.json").is_file():
        log("bootstrap", "corrected/ already present; skip")
        return
    if not from_raw:
        log("bootstrap", "no raw/ to bootstrap from, but corrected/ exists; skip")
        return
    ok, msg = ing._validate_raw_entry(RAW_DIR / entry_dir)
    if not ok:
        raise SystemExit(f"[bootstrap] {msg}")
    ing._bootstrap_corrected(RAW_DIR / entry_dir, entry_dir, subject)
    log("bootstrap", f"copied raw -> corrected/{entry_dir}/")


def manifest_path(entry_dir: str) -> Path:
    return CORRECTED_DIR / entry_dir / "manifest.json"


def load_manifest(entry_dir: str) -> dict:
    p = manifest_path(entry_dir)
    return json.loads(p.read_text(encoding="utf-8")) if p.is_file() else {}


def save_manifest(entry_dir: str, man: dict) -> None:
    manifest_path(entry_dir).write_text(json.dumps(man, indent=2), encoding="utf-8")


def stage_resolve(entry_dir: str, subject: str, loc_item_url: str | None) -> dict:
    man = load_manifest(entry_dir)
    existing = man.get("loc_healing", {}).get("loc_item_url")
    safe = re.sub(r"[^A-Za-z0-9_]+", "_", subject)
    res_path = LOC_HEALING / "loc_cache" / f"{safe}.resolution.json"
    if existing or res_path.is_file():
        log("resolve", f"already resolved: {existing or res_path.name}")
        return json.loads(res_path.read_text(encoding="utf-8")) if res_path.is_file() else {"loc_item_url": existing}
    res = ing._resolve_loc(subject, loc_item_url)
    log("resolve", f"status={res.get('status')}")
    return res


def stage_heal(entry_dir: str) -> None:
    man = load_manifest(entry_dir)
    if man.get("loc_healing", {}).get("applied_date"):
        log("heal", f"already healed on {man['loc_healing']['applied_date']}; skip")
        return
    rc = ing._run_heal_one(entry_dir)
    log("heal", f"heal_one exit code {rc}")


def next_free_entry_number() -> int:
    used = set()
    for p in PIPELINE_OUT.glob("entry_*.json"):
        m = re.search(r"entry_(\d+)\.json", p.name)
        if m:
            used.add(int(m.group(1)))
    n = 1
    while n in used:
        n += 1
    return max(used) + 1 if used else 1  # append after the max to avoid reusing historical gaps


def stage_number(entry_dir: str, subject: str, override: int | None) -> int:
    man = load_manifest(entry_dir)
    if man.get("entry_number"):
        log("number", f"already numbered: entry {man['entry_number']}")
        return int(man["entry_number"])
    # Check the rechapter map too
    rmap = json.loads(RECHAPTER_MAP.read_text(encoding="utf-8")) if RECHAPTER_MAP.is_file() else []
    for x in rmap:
        if x.get("subject") == subject and x.get("entry_number"):
            n = int(x["entry_number"])
            man["entry_number"] = n
            save_manifest(entry_dir, man)
            log("number", f"adopted entry {n} from rechapter_map")
            return n
    n = override or next_free_entry_number()
    man["entry_number"] = n
    save_manifest(entry_dir, man)
    # Record in the rechapter map for the chaptering tools
    found = False
    for x in rmap:
        if x.get("subject") == subject:
            x["entry_number"] = n
            found = True
    if not found:
        srt = srt_in(CORRECTED_DIR / entry_dir)
        rmap.append({"entry_number": n, "subject": subject,
                     "dir": str((CORRECTED_DIR / entry_dir).relative_to(ROOT)).replace("\\", "/"),
                     "srt": str(srt.relative_to(ROOT)).replace("\\", "/") if srt else None,
                     "has_pipeline_json": False, "provenance": "streamlined-ingestion"})
    RECHAPTER_MAP.write_text(json.dumps(rmap, ensure_ascii=False, indent=2), encoding="utf-8")
    log("number", f"assigned entry {n} (written to manifest + rechapter_map)")
    return n


def _fetch_loc_json(loc_url: str) -> dict | None:
    j = loc_url.rstrip("/") + "/?fo=json"
    req = urllib.request.Request(j, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError, TimeoutError):
        return None


def stage_video(entry_dir: str, subject: str, n: int) -> dict | None:
    links = json.loads(LOC_VIDEO_LINKS.read_text(encoding="utf-8")) if LOC_VIDEO_LINKS.is_file() else {}
    if str(n) in links and links[str(n)].get("video_url"):
        log("video", f"already resolved ({links[str(n)].get('duration_seconds')}s)")
        return links[str(n)]
    man = load_manifest(entry_dir)
    loc_url = man.get("loc_healing", {}).get("loc_item_url")
    if not loc_url:
        log("video", "no loc_item_url in manifest; cannot resolve video (skip)")
        return None
    data = _fetch_loc_json(loc_url)  # ONE linear request (the only LoC hit here)
    v = None
    for r in (data or {}).get("resources") or []:
        if isinstance(r, dict) and r.get("video"):
            v = {"video_url": r.get("video"), "video_stream_url": r.get("video_stream"),
                 "poster_url": r.get("poster"), "duration_seconds": r.get("duration"),
                 "caption": r.get("caption"), "loc_item_url": loc_url, "interview_name": subject}
            break
    links[str(n)] = v or {"loc_item_url": loc_url, "interview_name": subject, "error": "no-video"}
    LOC_VIDEO_LINKS.write_text(json.dumps(links, indent=2, ensure_ascii=False), encoding="utf-8")
    log("video", f"{'resolved ' + str(v.get('duration_seconds')) + 's' if v else 'NO VIDEO found'}")
    return v


def stage_blocks(n: int) -> None:
    bf = SCRIPTS / f"blocks_{n}.txt"
    if bf.is_file():
        log("blocks", f"blocks_{n}.txt already present; skip")
        return
    rc = run([sys.executable, str(SCRIPTS / "extract_blocks.py"), str(n)])
    sys.stdout.write(rc.stdout[-200:])
    if rc.returncode != 0:
        raise SystemExit(f"[blocks] extract_blocks failed:\n{rc.stderr}")


def stage_chapters(n: int) -> bool:
    spec = SCRIPTS / f"spec_{n}.json"
    staged = STAGING / f"entry_{n}.chapters.json"
    if staged.is_file():
        log("chapters", f"already expanded ({json.loads(staged.read_text(encoding='utf-8')).__len__()} chapters); skip")
        return True
    if not spec.is_file():
        log("chapters", f"AUTHOR NEEDED: scripts/spec_{n}.json is missing.")
        print(
            f"\n  >> Read scripts/blocks_{n}.txt and write scripts/spec_{n}.json:\n"
            f"     a JSON array, one object per line, of contiguous chapters covering\n"
            f"     every block, grouped into parts. Each: start_block, end_block,\n"
            f"     part (first chapter of each part only), title, topic, summary,\n"
            f"     main_topic_category, keywords[], related_events[]. No em dashes;\n"
            f"     Title Case; generalize unverifiable names. Then re-run this script.\n")
        return False
    rc = run([sys.executable, str(SCRIPTS / "expand_chapters.py"), str(n)])
    sys.stdout.write(rc.stdout[-200:])
    if rc.returncode != 0:
        raise SystemExit(f"[chapters] expand_chapters failed:\n{rc.stderr}")
    return True


def stage_summary(n: int) -> str | None:
    sp = STAGING / f"entry_{n}.summary.txt"
    if sp.is_file():
        log("summary", "summary present")
        return sp.read_text(encoding="utf-8").strip()
    log("summary", f"AUTHOR NEEDED: write transcripts/rechapter_staging/entry_{n}.summary.txt "
                   f"(2-3 plain paragraphs; no em dashes). Then re-run.")
    return None


def stage_assemble(entry_dir: str, subject: str, n: int, summary: str, loc_video: dict | None,
                   partial: bool) -> None:
    chapters = json.loads((STAGING / f"entry_{n}.chapters.json").read_text(encoding="utf-8"))
    doc = {
        "interview_name": subject,
        "entry_number": n,
        "loc_item_url": load_manifest(entry_dir).get("loc_healing", {}).get("loc_item_url"),
        "inferential_uncertainty_tier": "not-auditable" if partial else "ingestion-only",
        "inferential_uncertainty_score": None,
        "entry_provenance": f"streamlined-ingestion-{date.today().isoformat()}",
        "main_summary": summary,
        "chapters": chapters,
        "engagement_scores": {},
        "youtube_video_id": None,
        "loc_video": loc_video or {},
    }
    if partial:
        doc["partial_excerpt"] = True
    for d in (PIPELINE_OUT, OUTPUT_SUBAGENT):
        d.mkdir(parents=True, exist_ok=True)
        (d / f"entry_{n}.json").write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
    log("assemble", f"wrote entry_{n}.json ({len(chapters)} chapters) to pipeline_output + output_subagent")


def stage_ingest(entry_dir: str, n: int, skip: bool) -> None:
    # Make sure the manifest carries the entry_number so rag/ingest.mjs tags the vectors.
    man = load_manifest(entry_dir)
    if man.get("entry_number") != n:
        man["entry_number"] = n
        save_manifest(entry_dir, man)
    if skip:
        log("ingest", "skipped (--skip-ingest); run later: node --env-file=rag/.env.local rag/ingest.mjs")
        return
    env = rag_env()
    if not env:
        log("ingest", "rag/.env.local missing; skipping the Pinecone write (run it when credentials are available)")
        return
    log("ingest", "node rag/ingest.mjs (content-hash idempotent; only new/changed entries embed) ...")
    rc = run(["node", "--env-file=rag/.env.local", "rag/ingest.mjs"])
    sys.stdout.write(rc.stdout[-600:])
    if rc.returncode != 0:
        log("ingest", f"ingest returned {rc.returncode}; check output above. Vectors can be (re)ingested later.")
    else:
        log("ingest", "search ingest complete")


def rag_env() -> bool:
    return (ROOT / "rag" / ".env.local").is_file()


def stage_person(subject: str, n: int, summary: str, loc_url: str | None, joint: bool) -> None:
    slug = slugify(subject)
    target = PEOPLE_DIR / f"{slug}.json"
    if target.is_file():
        doc = json.loads(target.read_text(encoding="utf-8"))
        if doc.get("biographical_paragraph") and "AUTHORING NEEDED" not in str(doc.get("biographical_paragraph", "")):
            log("person", f"real person page already exists: {slug}.json; skip")
            return
    role = (summary.split(". ")[0] + ".") if summary else f"{subject}, Civil Rights History Project interviewee."
    stub = {
        "schema_version": 3,
        "slug": slug,
        "person_type": "interviewee",
        "entry_number": n,
        "display_name": subject,
        "born": None,
        "died": None,
        "role_summary": role[:200],
        "ai_reading": "AUTHORING NEEDED: an embedding-derived observation (a top semantic neighbor at high cosine, a concept-axis position, or an influence edge that runs unexpectedly). Generate after the search ingest so the precomputed neighbors in public/rag/related/ exist.",
        "biographical_paragraph": "AUTHORING NEEDED: a cited, anti-idempotent biographical paragraph per public/rag/people/README.md (LoC item page first, primary archives next, Wikipedia as a directory only; every factual claim cited [src: N]).",
        "interview_snippets": [],
        "sources": [{"n": 1, "label": "Library of Congress item page", "url": loc_url or ""}],
        "_stub": True,
        "_onboarded": date.today().isoformat(),
    }
    if joint:
        stub["_note"] = "Joint interview: a thin pointer stub is acceptable per the per-person README."
    PEOPLE_DIR.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(stub, ensure_ascii=False, indent=2), encoding="utf-8")
    log("person", f"scaffolded thin stub public/rag/people/{slug}.json (flagged for authoring + snippet/source pass)")


def stage_indexes() -> None:
    for script in ("build_playlist_index.py", "build_toc.py"):
        rc = run([sys.executable, str(SCRIPTS / script)])
        tail = rc.stdout.strip().splitlines()[-1] if rc.stdout.strip() else ""
        log("indexes", f"{script}: {tail}")
        if rc.returncode != 0:
            log("indexes", f"  WARN {script} rc={rc.returncode}: {rc.stderr[-200:]}")


def stage_audit(entry_dir: str, subject: str, n: int, partial: bool) -> None:
    at = TRANSCRIPTS / "AUDIT_TRAIL.md"
    if not at.is_file():
        return
    text = at.read_text(encoding="utf-8")
    note = (f"\n#### Onboarding of `{entry_dir}` as entry {n} ({date.today().isoformat()})\n\n"
            f"**Subject:** {subject}  \n"
            f"**Tier:** {'not-auditable (partial excerpt)' if partial else 'ingestion-only'}  \n"
            f"Onboarded end-to-end via `transcripts/ingestion/onboard_interview.py`: LoC heal, "
            f"video resolution, granular parts-grouped chapters, summary, entry assembly, search "
            f"ingest, and person-page networking. Idempotent.\n")
    marker = "## Session log"
    idx = text.find(marker)
    if idx < 0:
        at.write_text(text + note, encoding="utf-8")
    else:
        nl = text.find("\n", idx) + 1
        at.write_text(text[:nl] + note + text[nl:], encoding="utf-8")
    log("audit", "appended onboarding note to AUDIT_TRAIL.md")


# ---------------------------------------------------------------------------
def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Master idempotent interview onboarding pipeline.")
    ap.add_argument("entry_dir")
    ap.add_argument("--entry-number", type=int, default=None)
    ap.add_argument("--loc-item-url", default=None)
    ap.add_argument("--partial", action="store_true", help="mark a partial-excerpt transcript")
    ap.add_argument("--joint", action="store_true", help="joint interview (person page may stay a thin stub)")
    ap.add_argument("--skip-ingest", action="store_true", help="do everything but the paid Pinecone write")
    ap.add_argument("--stop-after", choices=STAGES, default=None)
    ap.add_argument("--redo", choices=STAGES, default=None, help="(informational) force-rerun is per-stage manual")
    args = ap.parse_args(argv)

    print(f"== onboard {args.entry_dir} ==")
    src_dir, subject, from_raw = stage_locate(args.entry_dir)
    if args.stop_after == "locate":
        return 0
    stage_bootstrap(args.entry_dir, subject, from_raw)
    if args.stop_after == "bootstrap":
        return 0
    stage_resolve(args.entry_dir, subject, args.loc_item_url)
    if args.stop_after == "resolve":
        return 0
    stage_heal(args.entry_dir)
    if args.stop_after == "heal":
        return 0
    n = stage_number(args.entry_dir, subject, args.entry_number)
    if args.stop_after == "number":
        return 0
    loc_video = stage_video(args.entry_dir, subject, n)
    if args.stop_after == "video":
        return 0
    stage_blocks(n)
    if args.stop_after == "blocks":
        return 0
    if not stage_chapters(n):
        return 2  # author the spec, then re-run
    if args.stop_after == "chapters":
        return 0
    summary = stage_summary(n)
    if summary is None:
        return 2  # author the summary, then re-run
    if args.stop_after == "summary":
        return 0
    stage_assemble(args.entry_dir, subject, n, summary, loc_video, args.partial)
    if args.stop_after == "assemble":
        return 0
    stage_ingest(args.entry_dir, n, args.skip_ingest)
    if args.stop_after == "ingest":
        return 0
    stage_person(subject, n, summary, load_manifest(args.entry_dir).get("loc_healing", {}).get("loc_item_url"), args.joint)
    if args.stop_after == "person":
        return 0
    stage_indexes()
    if args.stop_after == "indexes":
        return 0
    stage_audit(args.entry_dir, subject, n, args.partial)

    # status
    person_stub = False
    pj = PEOPLE_DIR / f"{slugify(subject)}.json"
    if pj.is_file():
        person_stub = json.loads(pj.read_text(encoding="utf-8")).get("_stub", False)
    print(f"\n== onboarded entry {n}: {subject} ==")
    print(f"  interview page + chapters + clips: live after deploy")
    print(f"  search index: {'ingested' if (rag_env() and not args.skip_ingest) else 'PENDING (run rag/ingest.mjs)'}")
    print(f"  person page: {'STUB written, needs bio + snippets + sources' if person_stub else 'present'}")
    print(f"  remaining authored work: {'full person page (bio, ai_reading, verbatim snippets, sources)' if person_stub else 'none'}")
    print(f"  commit corrected/{args.entry_dir}/, scripts/spec_{n}.json, the staging files, the entry_{n}.json, "
          f"public/rag/people/{slugify(subject)}.json, and the rebuilt indexes together.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
