"""Backfill `part` labels directly into a staging chapters file.

Some interviews were segmented in earlier sessions before the spec/expand pipeline
existed, so they have transcripts/rechapter_staging/entry_<N>.chapters.json but no
scripts/spec_<N>.json. For those, scripts/add_parts.py (which patches the spec and
re-expands) cannot run, so this patches the staging file in place instead.

You label the FIRST chapter of each part by chapter_number; every following chapter
inherits it (forward-fill). `part` is placed right after chapter_number for
readability.

Usage:
  python scripts/add_parts_staging.py <entry> "<chapterNumber>:<Part Label>" [more...]
"""
import sys, json

entry = sys.argv[1]
path = f'transcripts/rechapter_staging/entry_{entry}.chapters.json'
chapters = json.load(open(path, encoding='utf-8'))

starts = {}
for arg in sys.argv[2:]:
    num, label = arg.split(':', 1)
    starts[int(num)] = label

cur = None
out = []
for c in chapters:
    if c['chapter_number'] in starts:
        cur = starts[c['chapter_number']]
    rest = {k: v for k, v in c.items() if k not in ('chapter_number', 'part')}
    out.append({'chapter_number': c['chapter_number'], 'part': cur, **rest})

json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(f'entry {entry}: set {len(starts)} part-starts across {len(out)} chapters')
