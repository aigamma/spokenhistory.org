import json, glob, os
coarse=[]; granular=[]; meta={}
for f in sorted(glob.glob('public/rag/summaries/pipeline_output/entry_*.json')):
    n=int(os.path.basename(f).split('_')[1].split('.')[0])
    d=json.load(open(f,encoding='utf-8'))
    chs=d.get('chapters') or []
    meta[n]={'name':(d.get('interview_name') or d.get('title') or ''),'nch':len(chs)}
    (granular if (chs and any('topic' in c for c in chs)) else coarse).append(n)

rm=json.load(open('scripts/rechapter_map.json',encoding='utf-8')) if os.path.exists('scripts/rechapter_map.json') else []
print("rechapter_map type:", type(rm).__name__, "len:", len(rm))
print("sample element:", json.dumps(rm[0], ensure_ascii=False)[:300] if rm else "EMPTY")

man={}
for mf in glob.glob('transcripts/corrected/*/manifest.json'):
    try: mm=json.load(open(mf,encoding='utf-8'))
    except Exception: continue
    en=mm.get('entry_number')
    if en is None: continue
    srts=glob.glob(os.path.join(os.path.dirname(mf),'*.srt'))
    man[int(en)]= srts[0] if srts else None
print("manifests w/ entry_number:", len(man))
print()
print("GRANULAR done:", len(granular), "| COARSE to do:", len(coarse))
have_srt=[n for n in coarse if man.get(n)]
print("coarse with corrected SRT:", len(have_srt), "| missing:", sorted(set(coarse)-set(have_srt)))
print()
for n in coarse:
    s=man.get(n)
    s=os.path.basename(s) if s else 'NO-SRT'
    print("  %4d: nch=%3d  %-42s  %s" % (n, meta[n]['nch'], meta[n]['name'][:42], s[:48]))
# emit machine-readable worklist
work=[{'entry':n,'name':meta[n]['name'],'srt':man.get(n)} for n in coarse]
json.dump(work, open('scripts/_rechapter_worklist.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)
print()
print("worklist written:", len(work), "-> scripts/_rechapter_worklist.json")
