"""Structural QA gate for re-chapterized staging files. Reports per-entry
chapter/part counts, average chapter duration, short/long outliers, and FLAGS
em dashes, invalid categories, missing parts, and coverage timestamp issues.
Usage: python scripts/_qa_rechapter.py [entry ...]   (no args = all staged)"""
import json, glob, os, sys
EM = '—'
CATS = {"Early Life","Family History","Education","Geographic Context",
        "Religious Foundations","Movement Entry","Major Campaign","Political Analysis",
        "Legal Work","Post-Movement Career","Personal Reflection","Music & Culture"}
def secs(ts):
    t = ts.split(','); ms = int(t[1]) if len(t) > 1 and t[1].isdigit() else 0
    p = [int(x) for x in t[0].split(':')]
    while len(p) < 3: p.insert(0, 0)
    return p[0]*3600 + p[1]*60 + p[2] + ms/1000
ents = set(int(a) for a in sys.argv[1:]) if len(sys.argv) > 1 else None
issues = 0
for f in sorted(glob.glob('transcripts/rechapter_staging/entry_*.chapters.json'),
                key=lambda p: int(os.path.basename(p).split('_')[1].split('.')[0])):
    n = int(os.path.basename(f).split('_')[1].split('.')[0])
    if ents and n not in ents: continue
    ch = json.load(open(f, encoding='utf-8'))
    durs = [secs(c['end_time']) - secs(c['start_time']) for c in ch]
    em = sum(1 for c in ch for v in [c.get('title',''), c.get('topic',''), c.get('summary',''), c.get('part') or ''] if EM in v)
    badcat = sorted(set(c['main_topic_category'] for c in ch if c.get('main_topic_category') not in CATS))
    parts = sorted(set(c['part'] for c in ch if c.get('part')))
    short = sum(1 for d in durs if d < 60); long = sum(1 for d in durs if d > 360)
    avg = (sum(durs)/len(durs)/60) if durs else 0
    flag = ''
    if em: flag += ' EMDASH=%d' % em; issues += 1
    if badcat: flag += ' BADCAT=%s' % badcat; issues += 1
    if not parts: flag += ' NOPARTS'; issues += 1
    if ch and ch[0]['start_time'] is None: flag += ' BADSTART'; issues += 1
    print("e%-3d ch=%-3d parts=%-2d avg=%.1fmin short<1m=%d long>6m=%d%s" % (n, len(ch), len(parts), avg, short, long, flag))
print("ISSUES:", issues)
