"""
Standalone driver for a single-transcript pipeline pass.

Built 2026-05-22 as proof-of-concept that the dual-scorer + citation
audit + Smithsonian-grade publication gate work end-to-end on a real
transcript from the Library of Congress Civil Rights History Project
collection. Picks the shortest .srt in transcripts/raw/ (Maynard E.
Moore, 152 lines, 5KB) to minimize API spend on the first integration
test; the output is dumped to run_sample_output.json next to this
file so a reviewer can inspect every stage's intermediate result.

This script does NOT write to Firestore. It runs the pipeline against
OpenAI + Anthropic, returns a Python dict, dumps it as JSON. Pushing
the result into the new civil-rights-history-project Firestore is a
separate concern that requires firebase-admin service-account auth
which is not configured on this machine.

Run from the Metadata Generation System directory:
    python run_sample.py
"""

import json
import os
import sys
import time
from pathlib import Path

# Force UTF-8 on stdout/stderr so the Unicode checkmarks in
# processor/tuning.py ("✓ Passed threshold", "✗ Below threshold")
# don't crash the run under Windows cp1252 default console encoding.
# Tested on 2026-05-22: the pipeline got to "Accuracy: 85/100, Quality:
# 80/100" before the threshold-passed print crashed with cp1252
# UnicodeEncodeError on '✓'. errors='replace' is a belt-and-
# suspenders fallback in case any other unicode chars sneak through.
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if sys.stderr.encoding and sys.stderr.encoding.lower() != "utf-8":
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Load env from C:\civil\.env. The dotenv pattern keeps the script
# usable from any cwd as long as the .env sits at the project root.
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

# Pipeline imports happen after env load so the api_key default flows in
sys.path.insert(0, str(Path(__file__).resolve().parent))

# Re-import the Flask app module to get its _process_single_interview
# function + the load_prompt_file helper + the prompt-file directory.
# This is hackier than a clean library import but it's what the project
# exposes; refactoring it into a proper package is a separate sprint.
import app as _app

PROMPTS = _app.load_prompt_file


def main():
    # Pick the shortest transcript -- Maynard E. Moore, 152 lines, 5KB.
    raw = PROJECT_ROOT / "transcripts" / "raw"
    target_dir = raw / "Maynard E. Moore_interview_20250704_235635"
    srt_path = target_dir / "Maynard E. Moore_interview_transcript_20250704_235635.srt"
    assert srt_path.exists(), f"transcript not found at {srt_path}"

    interview_name = "Maynard E. Moore"
    start = time.time()

    params = {
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

    def _progress(step):
        elapsed = time.time() - start
        print(f"[{elapsed:6.1f}s] {step}", flush=True)

    result = _app._process_single_interview(
        str(srt_path),
        interview_name,
        params,
        _progress,
        youtube_video_id=None,
        primary_source_info=None,
    )

    elapsed = time.time() - start
    print(f"\nTotal pipeline time: {elapsed:.1f}s", flush=True)
    print(f"Chapters generated: {len(result.get('chapters', []))}", flush=True)
    if 'main_summary' in result:
        ms = result['main_summary']
        if isinstance(ms, dict) and 'summary' in ms:
            print(f"Main summary length: {len(ms['summary'])} chars", flush=True)
    if 'publication_decision' in result:
        print(f"Publication decision: {result['publication_decision'].get('decision_path', 'n/a')}", flush=True)

    out_path = Path(__file__).resolve().parent / "run_sample_output.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, default=str)
    print(f"\nFull output written to: {out_path}", flush=True)


if __name__ == "__main__":
    main()
