"""Print the next K coarse entries that still need a staging file authored.
Usage: python scripts/_next_batch.py [K]"""
import json, os, sys
K = int(sys.argv[1]) if len(sys.argv) > 1 else 7
work = json.load(open('scripts/_rechapter_worklist.json', encoding='utf-8'))
need = [(w['entry'], w['name']) for w in work
        if not os.path.exists('transcripts/rechapter_staging/entry_%d.chapters.json' % w['entry'])]
print("remaining:", len(need))
for n, nm in need[:K]:
    print("%d\t%s" % (n, nm))
