"""Collapse a corrected SRT into ~40s blocks for efficient re-chapterization.

Writes:
  scripts/blocks_<entry>.json  - [{i,start,end,text}] for expand_chapters.py
  scripts/blocks_<entry>.txt   - "[i] start | text" compact view to read

Usage: python scripts/extract_blocks.py "<srt path>" <entry_number> [target_seconds]
"""
import sys, json, re

srt = sys.argv[1]
entry = sys.argv[2]
TARGET = float(sys.argv[3]) if len(sys.argv) > 3 else 40.0

content = open(srt, encoding='utf-8', errors='replace').read()
cues = []
for blk in re.split(r'\n\s*\n', content):
    lines = [l for l in blk.strip().split('\n') if l.strip()]
    if len(lines) >= 2 and '-->' in lines[1]:
        st, en = [x.strip() for x in lines[1].split('-->')]
        cues.append((st, en, ' '.join(lines[2:]).strip()))

def secs(ts):
    t = ts.split(','); ms = int(t[1]) if len(t) > 1 and t[1].isdigit() else 0
    p = [int(x) for x in t[0].split(':')]
    while len(p) < 3: p.insert(0, 0)
    return p[0]*3600 + p[1]*60 + p[2] + ms/1000

blocks = []; cur = []
for c in cues:
    cur.append(c)
    if secs(c[1]) - secs(cur[0][0]) >= TARGET:
        blocks.append({'i': len(blocks), 'start': cur[0][0], 'end': cur[-1][1], 'text': ' '.join(x[2] for x in cur)})
        cur = []
if cur:
    blocks.append({'i': len(blocks), 'start': cur[0][0], 'end': cur[-1][1], 'text': ' '.join(x[2] for x in cur)})

json.dump(blocks, open(f'scripts/blocks_{entry}.json', 'w', encoding='utf-8'), ensure_ascii=False)
with open(f'scripts/blocks_{entry}.txt', 'w', encoding='utf-8') as f:
    for b in blocks:
        f.write(f"[{b['i']}] {b['start'][:8]} | {b['text']}\n")
words = sum(len(b['text'].split()) for b in blocks)
print(f"entry {entry}: {len(cues)} cues -> {len(blocks)} blocks (0..{len(blocks)-1}), ~{words} words, ends {blocks[-1]['end'] if blocks else 'NA'}")
