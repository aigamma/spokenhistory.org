"""Backfill `part` labels into an already-written spec_<entry>.json, then re-expand.

Adding parts to interviews segmented before the parts layer existed (Dustin,
2026-05-30). A part is a run of consecutive chapters; you only label the FIRST
chapter of each part and expand_chapters.py forward-fills the rest.

Usage:
  python scripts/add_parts.py <entry> "<chapterNumber>:<Part Label>" [more...]
e.g.
  python scripts/add_parts.py 8 "1:Coming Up in Louisiana" "13:The Celtics" ...

Rewrites scripts/spec_<entry>.json one compact object per line (matching the
hand-authored format) and then runs the expand to regenerate the staging file.
"""
import sys, json, subprocess

entry = sys.argv[1]
path = f'scripts/spec_{entry}.json'
spec = json.load(open(path, encoding='utf-8'))

for arg in sys.argv[2:]:
    num, label = arg.split(':', 1)
    i = int(num) - 1
    if not (0 <= i < len(spec)):
        raise SystemExit(f'chapter {num} out of range (entry {entry} has {len(spec)})')
    # Reinsert with `part` right after end_block for readability, preserving order.
    ch = spec[i]
    ordered = {}
    for k, v in ch.items():
        ordered[k] = v
        if k == 'end_block':
            ordered['part'] = label
    if 'part' not in ordered:
        ordered['part'] = label
    spec[i] = ordered

with open(path, 'w', encoding='utf-8') as f:
    f.write('[\n')
    f.write(',\n'.join(json.dumps(c, ensure_ascii=False) for c in spec))
    f.write('\n]\n')

print(f'set {len(sys.argv) - 2} part labels on entry {entry}')
subprocess.run([sys.executable, 'scripts/expand_chapters.py', entry], check=True)
