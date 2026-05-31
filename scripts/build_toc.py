"""Build public/rag/toc.json: the Table of Contents data for every on-site interview.

Dustin (2026-05-30) asked for a Table of Contents page: every interview, expandable
to its named chapters, each chapter a link to the bounded video segment, grouped into
PARTS so a long interview is a handful of scannable parts rather than a wall of 250
chapter titles. Each part is itself playable as one bounded autoplay run.

This script produces ONE compact JSON the page fetches once. Per interview it carries:
  { entry, subject, duration_seconds, source, chapter_count, part_count,
    parts: [ { title, start, end, chapters: [ { title, topic, start, end } ] } ] }
Times are SECONDS (floats), so the player gets startSeconds/endSeconds directly and
plays a bounded clip (range-jump, not a multi-hour buffer).

Chapter source per entry, newest wins:
  1. transcripts/rechapter_staging/entry_<N>.chapters.json  (re-chapterized: granular,
     topic-named, grouped into `part`s)
  2. public/rag/summaries/pipeline_output/entry_<N>.json `chapters[]`  (original)

Subject + loc_video duration always come from the pipeline_output entry file (the
source of truth for what is actually on the site). Summaries are intentionally omitted
to keep toc.json small.

Usage: python scripts/build_toc.py
Re-run after any re-chapterization merge or new staging file.
"""
import json, glob, os, re

PIPE = 'public/rag/summaries/pipeline_output'
STAGE = 'transcripts/rechapter_staging'
OUT = 'public/rag/toc.json'


def to_seconds(ts):
    """'HH:MM:SS,mmm' or 'HH:MM:SS.mmm' -> float seconds. Tolerant of stray input."""
    if ts is None:
        return 0.0
    s = str(ts).strip().replace(',', '.')
    parts = s.split(':')
    try:
        parts = [float(p) for p in parts]
    except ValueError:
        return 0.0
    while len(parts) < 3:
        parts.insert(0, 0.0)
    h, m, sec = parts[-3], parts[-2], parts[-1]
    return h * 3600 + m * 60 + sec


def group_parts(chapters):
    """Group a flat chapter list into parts (runs of the same `part` label).

    A chapter with no `part` joins the current run; if the very first chapter has no
    part, the whole interview becomes one untitled part (the page renders it flat)."""
    parts = []
    for c in chapters:
        label = c.get('part') or None
        start = to_seconds(c.get('start_time'))
        end = to_seconds(c.get('end_time'))
        item = {
            'title': c.get('title') or 'Untitled',
            'topic': c.get('topic') or None,
            'start': round(start, 2),
            'end': round(end, 2),
        }
        if not parts or parts[-1]['title'] != label:
            parts.append({'title': label, 'start': item['start'], 'end': item['end'], 'chapters': [item]})
        else:
            parts[-1]['chapters'].append(item)
            parts[-1]['end'] = item['end']
    # part start = its first chapter start, part end = its last chapter end
    for p in parts:
        if p['chapters']:
            p['start'] = p['chapters'][0]['start']
            p['end'] = p['chapters'][-1]['end']
    return parts


def main():
    interviews = []
    for pipe_path in glob.glob(f'{PIPE}/entry_*.json'):
        m = re.search(r'entry_(\d+)\.json$', os.path.basename(pipe_path))
        if not m:
            continue
        entry = int(m.group(1))
        try:
            pipe = json.load(open(pipe_path, encoding='utf-8'))
        except (json.JSONDecodeError, OSError):
            continue
        subject = pipe.get('interview_name') or f'Entry #{entry}'
        lv = pipe.get('loc_video') or {}
        duration = lv.get('duration_seconds')

        stage_path = f'{STAGE}/entry_{entry}.chapters.json'
        if os.path.exists(stage_path):
            chapters = json.load(open(stage_path, encoding='utf-8'))
            source = 'rechaptered'
        else:
            chapters = pipe.get('chapters') or []
            source = 'original'
        if not chapters:
            continue

        parts = group_parts(chapters)
        interviews.append({
            'entry': entry,
            'subject': subject,
            'duration_seconds': duration,
            'source': source,
            'chapter_count': len(chapters),
            'part_count': sum(1 for p in parts if p['title']),  # 0 when unpartitioned
            'has_video': bool(lv.get('video_url') or lv.get('video_stream_url')),
            'parts': parts,
        })

    interviews.sort(key=lambda x: x['subject'].lower())
    out = {
        'note': 'Table of Contents data, built by scripts/build_toc.py. Times are seconds.',
        'count': len(interviews),
        'rechaptered_count': sum(1 for i in interviews if i['source'] == 'rechaptered'),
        'interviews': interviews,
    }
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    size_kb = os.path.getsize(OUT) / 1024
    print(f'wrote {OUT}: {len(interviews)} interviews, '
          f"{out['rechaptered_count']} re-chapterized, {size_kb:.0f} KB")


if __name__ == '__main__':
    main()
