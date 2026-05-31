"""Splice a per-chapter topic list into an existing staging file.
Used for interviews that already have good (topic-less) chapters from earlier
runs, so they only need the topic name added without re-reading the transcript.

Usage: python scripts/apply_topics.py <entry_number>
Reads scripts/topics_<entry>.json (a JSON array of topic strings, one per
chapter in order) and inserts each as the chapter's "topic" field.
"""
import json, sys, os

entry = sys.argv[1]
tf = f'scripts/topics_{entry}.json'
sf = f'transcripts/rechapter_staging/entry_{entry}.chapters.json'
topics = json.load(open(tf, encoding='utf-8'))
chs = json.load(open(sf, encoding='utf-8'))
if len(chs) != len(topics):
    print(f"MISMATCH entry {entry}: {len(chs)} chapters vs {len(topics)} topics")
    sys.exit(1)
for c, t in zip(chs, topics):
    # rebuild so topic sits right after title for readability
    nc = {}
    for k, v in c.items():
        nc[k] = v
        if k == 'title':
            nc['topic'] = t
    c.clear(); c.update(nc)
json.dump(chs, open(sf, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
os.remove(tf)
print(f"entry {entry}: applied {len(topics)} topics")
