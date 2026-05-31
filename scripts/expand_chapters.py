"""Expand a compact chapter spec into the full staging chapters JSON.

Reads:
  scripts/spec_<entry>.json   - [{start_block,end_block,title,topic,summary,
                                 main_topic_category,keywords,related_events,
                                 part?,acc?,coh?}], in order, covering every block.
  scripts/blocks_<entry>.json  - the blocks (for cue-aligned start/end times).

The optional `part` field groups chapters into named PARTS (Dustin, 2026-05-30):
set `part` on the FIRST chapter of each part; every following chapter inherits it
(forward-fill) until the next chapter that sets a new `part`. Parts declutter long
interviews (a 77-chapter interview becomes ~12 scannable parts) and each part is
itself playable as one bounded autoplay run from its first chapter to its last.

Writes transcripts/rechapter_staging/entry_<entry>.chapters.json and validates
that the spec covers blocks 0..N-1 with no gaps or overlaps.

Usage: python scripts/expand_chapters.py <entry_number>
"""
import sys, json

entry = sys.argv[1]
blocks = json.load(open(f'scripts/blocks_{entry}.json', encoding='utf-8'))
spec = json.load(open(f'scripts/spec_{entry}.json', encoding='utf-8'))
N = len(blocks)

# coverage validation
if spec[0]['start_block'] != 0:
    print(f"FAIL entry {entry}: first chapter starts at block {spec[0]['start_block']}, not 0"); sys.exit(1)
if spec[-1]['end_block'] != N - 1:
    print(f"FAIL entry {entry}: last chapter ends at block {spec[-1]['end_block']}, not {N-1}"); sys.exit(1)
for a, b in zip(spec, spec[1:]):
    if b['start_block'] != a['end_block'] + 1:
        print(f"FAIL entry {entry}: gap/overlap, block {a['end_block']} then {b['start_block']}"); sys.exit(1)
    if a['end_block'] < a['start_block']:
        print(f"FAIL entry {entry}: chapter ends before it starts ({a})"); sys.exit(1)

out = []
cur_part = None
for i, ch in enumerate(spec):
    if ch.get('part'):
        cur_part = ch['part']  # forward-fill: this part runs until the next set
    out.append({
        'chapter_number': i + 1,
        'part': cur_part,
        'title': ch['title'],
        'topic': ch['topic'],
        'summary': ch['summary'],
        'main_topic_category': ch['main_topic_category'],
        'keywords': ch.get('keywords', []),
        'related_events': ch.get('related_events', []),
        'start_time': blocks[ch['start_block']]['start'],
        'end_time': blocks[ch['end_block']]['end'],
        'quality_metrics': {'accuracy_estimate': ch.get('acc', 8), 'narrative_coherence': ch.get('coh', 8)},
    })
json.dump(out, open(f'transcripts/rechapter_staging/entry_{entry}.chapters.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(f"entry {entry}: wrote {len(out)} chapters covering blocks 0..{N-1}")
