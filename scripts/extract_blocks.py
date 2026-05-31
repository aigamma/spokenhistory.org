"""Collapse a corrected SRT into ~40s blocks for efficient re-chapterization.

Writes:
  scripts/blocks_<entry>.json  - [{i,start,end,text}] for expand_chapters.py
  scripts/blocks_<entry>.txt   - "[i] start | text" compact view to read

Usage:
  python scripts/extract_blocks.py <entry_number> [target_seconds]
  python scripts/extract_blocks.py "<srt path>" <entry_number> [target_seconds]

If the first argument is a bare entry number, the SRT path is looked up from
scripts/rechapter_map.json, so the common case is just the entry number.
"""
import sys, json, re

if sys.argv[1].isdigit() and (len(sys.argv) < 3 or not str(sys.argv[2]).isdigit()):
    # entry-only form: look up the srt from the rechapter map
    entry = sys.argv[1]
    _m = {str(r['entry_number']): r for r in json.load(open('scripts/rechapter_map.json', encoding='utf-8'))}
    srt = _m[entry]['srt']
    TARGET = float(sys.argv[2]) if len(sys.argv) > 2 else 40.0
else:
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

# Re-take detector. Some interviews stopped and restarted, with the
# interviewee re-telling an earlier stretch near-verbatim (entry 7 repeated
# 19 blocks of childhood at the 48-minute mark). Chaptering those as new
# content yields redundant chapters, so flag long runs of blocks whose word
# sets closely match an EARLIER, non-adjacent block. Reported so the reader
# can collapse the span into one "recording resumes" chapter.
def _wset(t):
    return set(w for w in re.split(r'[^a-z0-9]+', t.lower()) if len(w) > 3)
sets = [_wset(b['text']) for b in blocks]
best = []  # best[i] = (j, jaccard) for the closest earlier non-adjacent match
for i in range(len(blocks)):
    bj, bs = -1, 0.0
    for j in range(i - 3):
        a, b = sets[i], sets[j]
        if not a or not b:
            continue
        jac = len(a & b) / len(a | b)
        if jac > bs:
            bj, bs = j, jac
    best.append((bj, bs))
runs = []  # consecutive blocks whose best earlier match is strong AND the
cur = None  # matched source blocks also advance together (a real re-take)
for i, (j, s) in enumerate(best):
    if s >= 0.55 and j >= 0:
        if cur and j == cur['lastj'] + 1:
            cur['end'], cur['srcend'], cur['lastj'] = i, j, j
        else:
            if cur and cur['end'] - cur['start'] >= 2:
                runs.append(cur)
            cur = {'start': i, 'end': i, 'srcstart': j, 'srcend': j, 'lastj': j}
    else:
        if cur and cur['end'] - cur['start'] >= 2:
            runs.append(cur)
        cur = None
if cur and cur['end'] - cur['start'] >= 2:
    runs.append(cur)
for r in runs:
    print(f"  RE-TAKE? blocks {r['start']}..{r['end']} mirror earlier {r['srcstart']}..{r['srcend']} "
          f"(collapse {r['start']}..{r['end']} into one recap chapter)")
