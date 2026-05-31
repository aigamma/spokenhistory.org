"""Pre-extract ~40s blocks for every coarse (not-yet-re-chapterized) entry,
so each re-chapterization agent only has to read blocks_<n>.txt and author
spec_<n>.json. Deterministic, no API. Reports any re-take spans inline."""
import json, subprocess, sys
work = json.load(open('scripts/_rechapter_worklist.json', encoding='utf-8'))
ok = 0; fail = []
for w in work:
    n = w['entry']
    r = subprocess.run([sys.executable, 'scripts/extract_blocks.py', str(n)],
                       capture_output=True, text=True)
    line = (r.stdout.strip() or r.stderr.strip())
    if r.returncode == 0 and 'blocks' in line:
        ok += 1
        print(line)
    else:
        fail.append(n)
        print(f"FAIL {n}: {line[:200]}")
print(f"\nextracted {ok}/{len(work)} | failures: {fail}")
