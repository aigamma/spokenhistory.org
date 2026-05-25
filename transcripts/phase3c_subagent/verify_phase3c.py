"""
Phase 3c verification per user protocol:
1. Content check (not exit-status): all 127 have valid JSON + required fields + substantive values
2. Corrected-input traceability spot checks (John Carlos Robeson fix + 3 hard-stop subjects)
3. Build batch_manifest.json
"""
import json, sys, statistics
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

OUT = Path(r'C:\civil\Metadata Generation System\batch_output')
SRC = Path(r'C:\civil\transcripts\corrected')

print("=" * 70)
print("PHASE 3c CONTENT VERIFICATION (127 transcripts)")
print("=" * 70)

all_dirs = sorted([d.name for d in SRC.iterdir() if d.is_dir()])
out_stems = sorted([f.stem for f in OUT.iterdir() if f.suffix == '.json' and f.name != 'batch_manifest.json'])
missing_dirs = [d for d in all_dirs if d not in out_stems]
print(f"Source corrected dirs: {len(all_dirs)}")
print(f"Output JSONs:          {len(out_stems)}")
print(f"Missing:               {len(missing_dirs)}")
if missing_dirs:
    for m in missing_dirs: print(f"  MISSING: {m}")

REQ_TOP = ['interview_name', 'main_summary', 'chapters', 'engagement_scores', 'citation_audit', 'publication_decision', 'pipeline_version']
REQ_MS = ['summary', 'key_themes', 'historical_significance', 'quality_metrics']
REQ_QM = ['accuracy_score', 'quality_score']
REQ_PD = ['publishable', 'human_review_required', 'decision_path']
REQ_CA = ['claims', 'summary_stats']
REQ_CH = ['chapter_number', 'start_time', 'end_time', 'title', 'summary']

results = []
bad = []
for f in sorted(OUT.iterdir()):
    if f.suffix != '.json' or f.name == 'batch_manifest.json': continue
    try:
        d = json.loads(f.read_text(encoding='utf-8'))
    except Exception as e:
        bad.append((f.name, f"json parse: {e}"))
        continue
    miss = []
    for k in REQ_TOP:
        if k not in d: miss.append(f"top:{k}")
    ms = d.get('main_summary') or {}
    if not isinstance(ms, dict): ms = {}
    for k in REQ_MS:
        if k not in ms: miss.append(f"ms:{k}")
    qm = ms.get('quality_metrics') or {}
    for k in REQ_QM:
        if k not in qm: miss.append(f"qm:{k}")
    pd = d.get('publication_decision') or {}
    for k in REQ_PD:
        if k not in pd: miss.append(f"pd:{k}")
    ca = d.get('citation_audit') or {}
    for k in REQ_CA:
        if k not in ca: miss.append(f"ca:{k}")
    chs = d.get('chapters') or []
    if not chs: miss.append("chapters: empty")
    for i, ch in enumerate(chs[:1]):
        for k in REQ_CH:
            if k not in ch: miss.append(f"ch[0]:{k}")
    s = ms.get('summary', '')
    if not isinstance(s, str) or len(s) < 100: miss.append(f"ms.summary too short ({len(s) if isinstance(s,str) else '?'})")
    acc = qm.get('accuracy_score')
    if not isinstance(acc, (int, float)): miss.append(f"acc not numeric: {type(acc).__name__}")
    stats = ca.get('summary_stats') or {}
    tot = stats.get('total_claims')
    if not isinstance(tot, (int, float)) or tot < 1: miss.append(f"citation_audit.total_claims absent or 0")
    if miss:
        bad.append((f.name, ", ".join(miss[:5])))
    results.append({
        "file": f.name,
        "interview_name": d.get('interview_name'),
        "size_bytes": f.stat().st_size,
        "chapters": len(chs),
        "ms_chars": len(s) if isinstance(s, str) else 0,
        "acc": qm.get('accuracy_score'),
        "qual": qm.get('quality_score'),
        "citation_total": stats.get('total_claims'),
        "citation_supported": stats.get('supported'),
        "citation_partial": stats.get('partially_supported'),
        "citation_unsupported": stats.get('unsupported'),
        "publishable": pd.get('publishable'),
        "human_review": pd.get('human_review_required'),
        "decision_path": pd.get('decision_path'),
        "engagement_overall": ((d.get('engagement_scores') or {}).get('overall_score') or {}).get('total'),
    })

print(f"\nContent-complete:  {len(results) - len(bad)} / {len(results)}")
print(f"Schema-incomplete: {len(bad)}")
if bad:
    print("\nBAD:")
    for n, m in bad[:10]: print(f"  {n}: {m}")

print()
print("=" * 70)
print("CORRECTED-INPUT TRACEABILITY SPOT CHECKS")
print("=" * 70)

print("\n[1] John Carlos corrected/.srt — Pass 7 ASR fix verification")
jc_srt = SRC / "John Carlos_interview_20250704_215531" / "John Carlos_interview_transcript_20250704_215531.srt"
jc_text = jc_srt.read_text(encoding='utf-8', errors='replace')
SQ = chr(39)
checks = [
    ("Paul Hoffman Robeson (BAD ASR bleed)", "Paul Hoffman Robeson", False),
    ("Paul Hoffman Roberson (BAD ASR bleed)", "Paul Hoffman Roberson", False),
    ("Paul Robeson (canonical, should appear)", "Paul Robeson", True),
    ("Earl, Adam Clayton Powell Sr (BAD bleed)", "Earl, Adam Clayton Powell Sr", False),
]
for label, needle, want in checks:
    found = needle in jc_text
    ok = found == want
    print(f"  {'PASS' if ok else 'FAIL'}  {label}: found={found}, expected={want}")

print("\n[2] Clarence B. Jones corrected/.srt — Pass 7 'Daniel H. Krenge' fix")
cbj_srt = SRC / "Clarence B. Jones_interview_20250704_184745" / "Clarence B. Jones_interview_transcript_20250704_184745.srt"
cbj_text = cbj_srt.read_text(encoding='utf-8', errors='replace')
krenge_found = "Daniel H. Krenge" in cbj_text
deiongh_typo = ("De Iongh" + SQ + "t") in cbj_text
crena_found = "Crena de Iongh" in cbj_text
print(f"  {'PASS' if not krenge_found else 'FAIL'}  'Daniel H. Krenge' bleed: found={krenge_found} (expect False)")
print(f"  {'PASS' if not deiongh_typo else 'FAIL'}  De Iongh-apostrophe-t typo: found={deiongh_typo} (expect False)")
print(f"  {'PASS' if crena_found else 'FAIL'}  'Crena de Iongh' canonical: found={crena_found} (expect True)")

print("\n[3] Norma Mtume corrected/.srt — Pass 7 'Pinto Union' cross-contamination cleanup")
nm_srt = SRC / "Norma Mtume_interview_20250705_001313" / "Norma Mtume_interview_transcript_20250705_001313.srt"
nm_text = nm_srt.read_text(encoding='utf-8', errors='replace')
pinto = "Pinto Union" in nm_text
print(f"  {'PASS' if not pinto else 'FAIL'}  'Pinto Union' bleed: found={pinto} (expect False)")

print("\n[4] Ruby Sales corrected/.srt — Pass 7 'I was in dead' meaning-inversion fix")
rs_srt = SRC / "Ruby Sales_interview_20250705_013618" / "Ruby Sales_interview_transcript_20250705_013618.srt"
rs_text = rs_srt.read_text(encoding='utf-8', errors='replace')
inverted = "I was in dead" in rs_text
print(f"  {'PASS' if not inverted else 'FAIL'}  'I was in dead' meaning inversion: found={inverted} (expect False)")

print()
print("=" * 70)
print("AGGREGATE METRICS")
print("=" * 70)
publishable_n = sum(1 for r in results if r['publishable'] is True)
review_n = sum(1 for r in results if r['human_review'] is True)
total_chapters = sum(r['chapters'] for r in results)
total_citations = sum(r['citation_total'] or 0 for r in results)
total_partial = sum(r['citation_partial'] or 0 for r in results)
total_unsupp = sum(r['citation_unsupported'] or 0 for r in results)
total_supported = sum(r['citation_supported'] or 0 for r in results)
accs = [r['acc'] for r in results if isinstance(r['acc'], (int, float))]
quals = [r['qual'] for r in results if isinstance(r['qual'], (int, float))]
engs = [r['engagement_overall'] for r in results if isinstance(r['engagement_overall'], (int, float))]
print(f"Total transcripts:        {len(results)}")
print(f"Publishable (90/90 + zero partial + zero unsupported): {publishable_n}")
print(f"Routed to human review:   {review_n}")
print(f"Total chapters generated: {total_chapters}")
print(f"Total citation claims:    {total_citations}")
print(f"  supported:              {total_supported}")
print(f"  partially_supported:    {total_partial}")
print(f"  unsupported:            {total_unsupp}")
print()
print(f"Accuracy: min={min(accs)}, max={max(accs)}, mean={statistics.mean(accs):.1f}, median={statistics.median(accs):.1f}")
print(f"Quality:  min={min(quals)}, max={max(quals)}, mean={statistics.mean(quals):.1f}, median={statistics.median(quals):.1f}")
print(f"Engagement (n={len(engs)}): min={min(engs)}, max={max(engs)}, mean={statistics.mean(engs):.1f}")
print()
print(f"Publishable transcripts ({publishable_n}):")
for r in results:
    if r['publishable']:
        print(f"  {r['interview_name']}: acc={r['acc']}, qual={r['qual']}, citations={r['citation_total']}/all_supported")

manifest = {
    "phase": "3c",
    "completed_at": "2026-05-25",
    "architecture": "Claude Code subagent per transcript (one-agent-per-transcript cross-contamination firewall)",
    "input_dir": str(SRC),
    "output_dir": str(OUT),
    "total_transcripts": len(results),
    "publishable": publishable_n,
    "human_review_required": review_n,
    "total_chapters": total_chapters,
    "total_citation_claims": total_citations,
    "citation_supported": total_supported,
    "citation_partially_supported": total_partial,
    "citation_unsupported": total_unsupp,
    "score_distribution": {
        "accuracy": {"min": min(accs), "max": max(accs), "mean": round(statistics.mean(accs), 1), "median": statistics.median(accs)},
        "quality":  {"min": min(quals), "max": max(quals), "mean": round(statistics.mean(quals), 1), "median": statistics.median(quals)},
        "engagement_overall": {"n": len(engs), "min": min(engs), "max": max(engs), "mean": round(statistics.mean(engs), 1)},
    },
    "schema_complete": len(results) - len(bad),
    "schema_incomplete": len(bad),
    "results": results,
}
mp = OUT / 'batch_manifest.json'
mp.write_text(json.dumps(manifest, indent=2, default=str), encoding='utf-8')
print(f"\nManifest written: {mp}")
