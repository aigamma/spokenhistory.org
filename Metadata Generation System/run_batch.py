"""
Phase 3c batch pipeline runner — full-corpus pass on transcripts/corrected/.

Sibling to run_sample.py: same pipeline (_process_single_interview via
app.py), same env loading, same params shape, but targets the
post-Phase-1 transcripts/corrected/ directory (Pass 7 Subject
corrections + ASR-bleed repairs applied) instead of the raw Whisper
output in transcripts/raw/. Runs concurrent_workers transcripts at a
time via ThreadPoolExecutor; each worker holds the full sync pipeline
and the OpenAI + Anthropic clients are HTTP-concurrent.

Resume support: if a per-entry JSON already exists in batch_output/,
the entry is skipped. Re-runs only the missing or errored entries.

Output:
  batch_output/<entry_dir_name>.json  -- full pipeline result per entry
  batch_output/batch_manifest.json    -- aggregate (status, scores,
                                         decision_path, cost) for all
                                         entries plus wall-clock and
                                         total cost roll-up.

Run from the project root (or anywhere — PROJECT_ROOT is derived from
__file__):
    python "Metadata Generation System/run_batch.py" [--workers 8] [--limit N]
"""

import argparse
import json
import os
import sys
import time
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Dict, Optional

# UTF-8 stdout/stderr (same as run_sample.py — the pipeline prints
# Unicode check marks that crash cp1252 default consoles).
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if sys.stderr.encoding and sys.stderr.encoding.lower() != "utf-8":
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_ROOT / ".env"
if ENV_PATH.exists():
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip())

assert os.environ.get("OPENAI_API_KEY", "").startswith("sk-"), "OPENAI_API_KEY missing"
assert os.environ.get("ANTHROPIC_API_KEY", "").startswith("sk-ant-"), "ANTHROPIC_API_KEY missing"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import app as _app

PROMPTS = _app.load_prompt_file

OUT_DIR = Path(__file__).resolve().parent / "batch_output"
OUT_DIR.mkdir(exist_ok=True)


def build_params() -> Dict[str, Any]:
    """Same params shape as run_sample.py. Built once and shared across
    workers — all values are immutable prompt strings or scalars."""
    return {
        "block_size":                    20,
        "labeling_sys_prompt":           PROMPTS('label_text_blocks_for_toc_system.txt'),
        "labeling_user_prompt":          PROMPTS('label_text_blocks_for_toc_user.txt'),
        "chapterization_sys_prompt":     PROMPTS('detect_topic_transitions_system.txt'),
        "chapterization_user_prompt":    PROMPTS('detect_topic_transitions_user.txt'),
        "main_summary_sys_prompt":       PROMPTS('generate_main_summary_system.txt'),
        "main_summary_user_prompt":      PROMPTS('generate_main_summary_user.txt'),
        "chapter_sys_prompt":            PROMPTS('generate_chapter_system.txt'),
        "chapter_user_prompt":           PROMPTS('generate_chapter_user.txt'),
        "questions_sys_prompt":          PROMPTS('generate_questions_system.txt'),
        "questions_user_prompt":         PROMPTS('generate_questions_user.txt'),
        "questions_rewrite_sys_prompt":  PROMPTS('rewrite_questions_system.txt'),
        "questions_rewrite_user_prompt": PROMPTS('rewrite_questions_user.txt'),
        "questions_context_max_rows":    14,
        "questions_context_before_chars": 220,
        "questions_context_after_chars": 140,
        "question_placement":            "after_summary",
        "eval_sys_prompt":               PROMPTS('score_summary_system.txt'),
        "eval_user_prompt":              PROMPTS('score_summary_user.txt'),
        "revision_sys_prompt":           PROMPTS('regenerate_main_summary_system.txt'),
        "revision_user_prompt":          PROMPTS('regenerate_main_summary_user.txt'),
        "quality_threshold":             80,
        "accuracy_threshold":            80,
        "max_retries":                   3,
        "engagement_sys_prompt":         PROMPTS('engagement_system.txt'),
        "engagement_rubric":             PROMPTS('engagement_rubric.txt'),
        "engagement_schema":             PROMPTS('engagement_schema.txt'),
        "clips_combined_prompt":         _app._assemble_clips_prompt(_app._load_clips_prompt_sections()),
        "clips_token_limit":             30000,
        "steps_enabled":                 {"clips": False, "questions": True, "tuning": True, "engagement": True},
        "api_key":                       os.environ["OPENAI_API_KEY"],
        "dev_mode":                      False,
    }


def find_corrected_srt(entry_dir: Path) -> Optional[Path]:
    srts = sorted(entry_dir.glob("*.srt"))
    return srts[0] if srts else None


def extract_summary_row(interview_name: str, entry_dir_name: str, result: Dict[str, Any], elapsed: float) -> Dict[str, Any]:
    tr = result.get("tuning_results") or {}
    ms = tr.get("main_summary") if isinstance(tr, dict) else None
    ms = ms if isinstance(ms, dict) else {}
    pd = ms.get("publication_decision") or {}
    os_scores = ms.get("openai_scores") or {}
    cl_scores = ms.get("claude_scores") or {}
    ca = ms.get("citation_audit") or {}
    ca_stats = ca.get("summary_stats") or {}
    cost = (result.get("cost_data") or {}).get("total_cost_usd")
    return {
        "interview": interview_name,
        "entry_dir": entry_dir_name,
        "status": "ok",
        "elapsed_s": round(elapsed, 1),
        "openai_cost_usd": round(float(cost), 4) if cost is not None else None,
        "publishable": pd.get("publishable"),
        "human_review_required": pd.get("human_review_required"),
        "decision_path": pd.get("decision_path"),
        "openai_acc": os_scores.get("accuracy_score"),
        "openai_qual": os_scores.get("quality_score"),
        "claude_acc": cl_scores.get("accuracy_score"),
        "claude_qual": cl_scores.get("quality_score"),
        "claude_unsupported_claims": len(cl_scores.get("unsupported_claims") or []) if isinstance(cl_scores, dict) and "error" not in cl_scores else None,
        "claude_error": cl_scores.get("error") if isinstance(cl_scores, dict) else None,
        "citation_total": ca_stats.get("total_claims"),
        "citation_supported": ca_stats.get("supported"),
        "citation_partial": ca_stats.get("partially_supported"),
        "citation_unsupported": ca_stats.get("unsupported"),
        "citation_error": ca.get("error") if isinstance(ca, dict) else None,
        "chapter_count": len(result.get("chapters") or []),
    }


def process_one(entry_dir: Path, params: Dict[str, Any]) -> Dict[str, Any]:
    interview_name = entry_dir.name.split("_interview_")[0]
    out_path = OUT_DIR / f"{entry_dir.name}.json"
    if out_path.exists():
        # Resume — re-read and re-summarize so the manifest stays
        # consistent across runs.
        try:
            cached = json.loads(out_path.read_text(encoding="utf-8"))
            row = extract_summary_row(interview_name, entry_dir.name, cached, elapsed=0.0)
            row["status"] = "skipped-resume"
            return row
        except Exception:
            # Cached JSON is corrupt; fall through and rerun.
            pass

    srt = find_corrected_srt(entry_dir)
    if not srt:
        return {"interview": interview_name, "entry_dir": entry_dir.name, "status": "no-srt"}

    start = time.time()
    try:
        result = _app._process_single_interview(
            str(srt),
            interview_name,
            params,
            lambda step: None,  # no per-step progress callback inside a worker
            youtube_video_id=None,
            primary_source_info=None,
        )
        elapsed = time.time() - start
        # Persist the full result FIRST, so a crash mid-summary preserves the run.
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, default=str)
        return extract_summary_row(interview_name, entry_dir.name, result, elapsed)
    except Exception as e:
        elapsed = time.time() - start
        return {
            "interview": interview_name,
            "entry_dir": entry_dir.name,
            "status": "error",
            "elapsed_s": round(elapsed, 1),
            "error": f"{type(e).__name__}: {str(e)[:500]}",
            "traceback": traceback.format_exc()[:2000],
        }


def main() -> int:
    parser = argparse.ArgumentParser(description="Phase 3c batch pipeline runner")
    parser.add_argument("--workers", type=int, default=8, help="concurrent pipeline workers (default 8)")
    parser.add_argument("--limit", type=int, default=None, help="limit to first N entries (after sort) — useful for pilots")
    parser.add_argument("--entries", type=str, default=None, help="comma-separated entry directory names to run (subset)")
    args = parser.parse_args()

    corrected = PROJECT_ROOT / "transcripts" / "corrected"
    if not corrected.exists():
        print(f"ERROR: {corrected} does not exist", file=sys.stderr)
        return 1

    entries = sorted([d for d in corrected.iterdir() if d.is_dir()])
    if args.entries:
        wanted = {s.strip() for s in args.entries.split(",") if s.strip()}
        entries = [d for d in entries if d.name in wanted]
    if args.limit:
        entries = entries[:args.limit]

    print(f"Phase 3c batch run starting")
    print(f"  Input dir:    {corrected}")
    print(f"  Output dir:   {OUT_DIR}")
    print(f"  Entries:      {len(entries)}")
    print(f"  Workers:      {args.workers}")
    print()

    params = build_params()
    results = []
    start = time.time()
    interrupted = False

    try:
        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            futures = {ex.submit(process_one, d, params): d for d in entries}
            done = 0
            for fut in as_completed(futures):
                row = fut.result()
                results.append(row)
                done += 1
                elapsed = time.time() - start
                status = row.get("status", "?")
                interview = row.get("interview", "?")[:38]
                decision = row.get("decision_path") or "-"
                cost = row.get("openai_cost_usd")
                cost_str = f"${cost:.4f}" if cost is not None else "  -    "
                print(f"[{elapsed/60:5.1f}m] {done:3d}/{len(entries)} {interview:38} {status:14} {decision:32} {cost_str}", flush=True)
    except KeyboardInterrupt:
        interrupted = True
        print("\n[KeyboardInterrupt] writing partial manifest...", flush=True)

    elapsed = time.time() - start
    ok_count = sum(1 for r in results if r.get("status") == "ok")
    resume_count = sum(1 for r in results if r.get("status") == "skipped-resume")
    error_count = sum(1 for r in results if r.get("status") == "error")
    no_srt_count = sum(1 for r in results if r.get("status") == "no-srt")
    total_cost = sum(r.get("openai_cost_usd") or 0 for r in results)
    publishable = sum(1 for r in results if r.get("publishable") is True)
    human_review = sum(1 for r in results if r.get("human_review_required") is True)

    manifest = {
        "wall_clock_min":       round(elapsed / 60, 2),
        "interrupted":          interrupted,
        "workers":              args.workers,
        "total":                len(entries),
        "ok":                   ok_count,
        "skipped_resume":       resume_count,
        "errors":               error_count,
        "no_srt":               no_srt_count,
        "total_openai_cost_usd": round(total_cost, 4),
        "publishable":          publishable,
        "human_review_required": human_review,
        "results":              results,
    }
    manifest_path = OUT_DIR / "batch_manifest.json"
    with manifest_path.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, default=str)

    print()
    print(f"=== Batch summary ===")
    print(f"Wall clock:        {elapsed/60:.1f} min")
    print(f"OK / resume / err / no-srt: {ok_count} / {resume_count} / {error_count} / {no_srt_count}")
    print(f"Publishable:       {publishable} / {len(entries)}")
    print(f"Human review:      {human_review} / {len(entries)}")
    print(f"OpenAI cost:       ${total_cost:.2f}")
    print(f"Manifest:          {manifest_path}")
    return 0 if not interrupted and error_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
