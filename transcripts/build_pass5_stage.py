#!/usr/bin/env python3
"""Generate per-entry pass5_stage files from the Layer 5 corpus-global audit.

Layer 5 (`transcripts/layer5_fidelity_audit.py`) used a corpus-global
methodology — its primary output is a single 1.58 MB JSON file rather than
per-entry staging files like passes 1-4 produced. This script splits the
audit JSON into per-entry markdown files in `transcripts/pass5_stage/`
following the same naming convention (entry_NNN_subject_slug.md) and
table structure as the other pass-stage directories.

Rationale: institutional reviewers (Smithsonian/LoC, Google Drive sharers,
museum auditors) and the adversarial multi-model ensemble both navigate
the audit by entry. Without pass5_stage/ files, Layer 5 findings are
discoverable only via the corpus-global JSON or via inline annotations
in the master MD — neither of which mirrors the prior-pass directory
structure that reviewers are accustomed to.

This script does NOT modify the master MD or the Layer 5 audit JSON.
It only produces a new pass5_stage/ directory + INDEX.md.

Re-runnable; overwrites existing per-entry files.
"""
import json
import re
from collections import defaultdict
from pathlib import Path

CIVIL_ROOT = Path(r"D:\civil")
AUDIT_JSON = CIVIL_ROOT / "transcripts" / "layer5_fidelity_audit.json"
MASTER_MD = CIVIL_ROOT / "transcripts" / "CLEANED_TRANSCRIPTS_REVIEW.md"
OUT_DIR = CIVIL_ROOT / "transcripts" / "pass5_stage"
RENAME_HELPER = CIVIL_ROOT / "transcripts" / "rename_staging_files.py"

OUT_DIR.mkdir(exist_ok=True)


def slugify(subject: str, max_len: int = 60) -> str:
    """Mirror of transcripts/rename_staging_files.py::slugify (kept in sync)."""
    s = subject.lower()
    diacritic_map = str.maketrans(
        "áàâäãåéèêëíìîïóòôöõúùûüñçß",
        "aaaaaaeeeeiiiiooooouuuunc" + "s",
    )
    s = s.translate(diacritic_map)
    s = s.replace("&", " and ")
    s = re.sub(r"[''`\".,;:]", "", s)
    s = re.sub(r"[^a-z0-9]+", "_", s)
    s = re.sub(r"_+", "_", s)
    s = s.strip("_")
    if len(s) > max_len:
        cut = s[:max_len]
        last_underscore = cut.rfind("_")
        if last_underscore > max_len * 0.6:
            s = cut[:last_underscore]
        else:
            s = cut
    return s


def parse_entry_subjects(master_md: Path) -> dict[int, str]:
    """Parse `### N. Subject` headings from the master overlay."""
    content = master_md.read_text(encoding="utf-8")
    heading_re = re.compile(r"^### (\d+)\.\s+([^\n]+)$", re.MULTILINE)
    entries: dict[int, str] = {}
    for m in heading_re.finditer(content):
        number = int(m.group(1))
        subject = m.group(2).strip()
        subject = re.sub(r"\s*\([A-Z][A-Z ]+\)\s*$", "", subject).strip()
        entries[number] = subject
    return entries


def render_d1_table(findings: list[dict]) -> str:
    if not findings:
        return "*(no D1 phantom-Whisper-rendering findings for this entry)*\n"
    lines = [
        "| Row ID | Pass | Claimed Whisper rendering | Canonical correction | Fuzzy score | Notes |",
        "|---|---|---|---|---:|---|",
    ]
    for f in findings:
        row_id = f.get("row_id", "?")
        pass_section = f.get("pass_section", "?")
        whisper = f.get("whisper_rendering", "").replace("|", "\\|").replace("\n", " ")
        canonical = f.get("correction", "").replace("|", "\\|").replace("\n", " ")
        fuzzy = f.get("fuzzy_score", 0)
        # Whether this is in the canonical-figure subset (high-impact) vs low-impact
        is_canonical_figure = f.get("canonical_figure_match", False)
        notes = "high-impact canonical-figure" if is_canonical_figure else "low-impact"
        lines.append(f"| `{row_id}` | {pass_section} | {whisper[:80]} | {canonical[:80]} | {fuzzy:.1f} | {notes} |")
    return "\n".join(lines) + "\n"


def render_d2_table(d2_findings: list[dict], entry_num: int) -> str:
    """For D2 findings (corpus-global), show only the clusters this entry participates in."""
    relevant = []
    for cluster in d2_findings:
        for variant in cluster.get("variants", []):
            if entry_num in variant.get("entries", []):
                relevant.append({
                    "whisper": cluster.get("whisper_rendering", "?"),
                    "this_entry_correction": variant.get("correction", "?"),
                    "majority_canonical": max(
                        cluster.get("variants", []),
                        key=lambda v: v.get("count", 0),
                    ).get("correction", "?"),
                    "total_variants": len(cluster.get("variants", [])),
                    "total_occurrences": sum(v.get("count", 0) for v in cluster.get("variants", [])),
                    "recommended": cluster.get("recommended_canonical", ""),
                })
                break  # one entry-participation row per cluster
    if not relevant:
        return "*(this entry does not participate in any D2 bidirectional-inconsistency cluster)*\n"
    lines = [
        "| Whisper rendering | This entry's correction | Majority canonical (recommended) | Variants | Total occurrences |",
        "|---|---|---|---:|---:|",
    ]
    for r in relevant:
        whisper = r["whisper"][:60].replace("|", "\\|")
        this = r["this_entry_correction"][:60].replace("|", "\\|")
        majority = (r["recommended"] or r["majority_canonical"])[:60].replace("|", "\\|")
        lines.append(f"| {whisper} | {this} | {majority} | {r['total_variants']} | {r['total_occurrences']} |")
    return "\n".join(lines) + "\n"


def render_d3_table(d3_findings: list[dict], entry_num: int) -> str:
    relevant = [f for f in d3_findings if f.get("entry_number") == entry_num]
    if not relevant:
        return "*(no D3 catalog-vs-per-entry contradictions for this entry)*\n"
    lines = [
        "| Row ID | Whisper rendering | Per-entry correction | Catalog canonical | Catalog section | Deviation type |",
        "|---|---|---|---|---|---|",
    ]
    for f in relevant:
        row_id = f.get("row_id", "?")
        whisper = f.get("whisper_rendering", "").replace("|", "\\|").replace("\n", " ")[:60]
        per_entry = f.get("per_entry_correction", "").replace("|", "\\|").replace("\n", " ")[:60]
        catalog = f.get("catalog_canonical", "").replace("|", "\\|").replace("\n", " ")[:60]
        section = f.get("catalog_section", "?")
        dev = f.get("deviation_type", "")
        lines.append(f"| `{row_id}` | {whisper} | {per_entry} | {catalog} | {section} | {dev} |")
    return "\n".join(lines) + "\n"


def render_entry_file(entry_num: int, subject: str, d1: list, d2: list, d3: list) -> str:
    canonical_figure_count = sum(1 for f in d1 if f.get("canonical_figure_match", False))
    low_impact_count = len(d1) - canonical_figure_count

    lines = [
        f"# Layer 5 fidelity findings — entry #{entry_num} {subject}",
        "",
        "**Source:** `transcripts/layer5_fidelity_audit.json` (commit `6a70838` — corpus-global fidelity sweep, 2026-05-22/23)",
        "**Methodology:** Layer 5 is a corpus-global pass (different from per-entry Passes 1-4). It audits the relationship between the corrections overlay and the raw transcripts (D1), the consistency of canonical corrections across the corpus (D2), the alignment between per-entry rows and the cross-corpus catalog (D3), and cross-entry biographical claims (D4).",
        "",
        "## Summary",
        "",
        f"| Dimension | Findings affecting this entry |",
        "|---|---:|",
        f"| D1 — Phantom Whisper-renderings | {len(d1)} ({canonical_figure_count} canonical-figure / {low_impact_count} low-impact) |",
        f"| D2 — Bidirectional canonical inconsistencies | {sum(1 for c in d2 for v in c.get('variants', []) if entry_num in v.get('entries', []))} (cluster participations) |",
        f"| D3 — Catalog-vs-per-entry contradictions | {sum(1 for f in d3 if f.get('entry_number') == entry_num)} |",
        f"| D4 — Cross-entry biographical inconsistencies | 0 (corpus-wide; regex methodology limited) |",
        "",
        "## D1 — Phantom Whisper renderings",
        "",
        "Correction rows where the supervisor stated 'Whisper rendered X' but X is not present in this entry's raw transcript (fuzzy `partial_ratio` < 85). The rows will silently no-op when `scripts/apply_corrections.py` runs at preprocessing time — the row is dead weight in the audit overlay.",
        "",
        render_d1_table(d1),
        "",
        "## D2 — Bidirectional canonical inconsistency (clusters this entry participates in)",
        "",
        "Where the same Whisper rendering across the corpus has multiple canonical corrections. The 'majority canonical' column shows which form was used by most entries — the adversarial ensemble should normalize against `civil_rights_facts.json` if the majority isn't itself the canonical form.",
        "",
        render_d2_table(d2, entry_num),
        "",
        "## D3 — Catalog-vs-per-entry contradictions",
        "",
        "Where this entry's per-row correction disagrees with the cross-corpus catalog's canonical form for the same Whisper pattern. Most are different-referent false positives (same surface form, different historical referent) but some are genuine reconciliation candidates.",
        "",
        render_d3_table(d3, entry_num),
        "",
        "## Deploy status (per commit `2669753` — 2026-05-22 evening)",
        "",
        "Layer 5 findings were applied to the master MD via `transcripts/fix_layer5_findings.py`:",
        "",
        f"- **{canonical_figure_count} canonical-figure phantoms** for this entry were ANNOTATED `[LAYER-5: phantom-rendering, fuzzy=NN.N, ensemble-adjudication-pending]` in the master MD (not removed — preserved for ensemble review)",
        f"- **{low_impact_count} low-impact phantoms** for this entry were PHYSICALLY REMOVED from the master MD (would have silently no-op'd anyway)",
        "- D2 high-majority normalizations (≥80% share + ≥4 occurrences across the corpus) were applied automatically; this entry may participate in 0+ such normalizations",
        "- D2 ambiguous cases were ANNOTATED `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]`",
        "- D3 contradictions were ANNOTATED `[LAYER-5: D3-catalog-contradiction, ensemble-adjudication-pending]`",
        "",
        "## Ensemble handoff",
        "",
        f"The annotations in the master MD's `### {entry_num}. {subject}` section identify each Layer-5-flagged row. The adversarial multi-model ensemble (Kiro / Kimi / Codex / Gemini) is the next adjudication layer for items not auto-resolved.",
        "",
        "## Related artifacts",
        "",
        "- Full corpus-global findings: `transcripts/layer5_fidelity_audit.json`",
        "- Human-readable summary: `transcripts/layer5_fidelity_audit_summary.md`",
        "- Layer 5 pipeline (re-runnable): `transcripts/layer5_fidelity_audit.py`",
        "- Layer 5 parser module: `transcripts/layer5_extract_corrections.py`",
        "- Layer 5 deploy script: `transcripts/fix_layer5_findings.py`",
        "- Pre-Layer-5 cross-contamination follow-on cleanup: `transcripts/cross_contamination_audit.json` + `fix_cross_contamination_pass4.py`",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    if not AUDIT_JSON.exists():
        print(f"ERROR: Layer 5 audit JSON not found at {AUDIT_JSON}")
        return 1

    print(f"Loading {AUDIT_JSON} ({AUDIT_JSON.stat().st_size / 1024 / 1024:.2f} MB)...")
    audit = json.loads(AUDIT_JSON.read_text(encoding="utf-8"))
    print(f"  Loaded — keys: {sorted(audit.keys())}")

    entry_subjects = parse_entry_subjects(MASTER_MD)
    print(f"Parsed {len(entry_subjects)} entry subjects from master MD")

    # Extract per-dimension findings
    d1_findings = audit.get("dimension_1_findings", [])
    d2_findings = audit.get("dimension_2_findings", [])
    d3_findings = audit.get("dimension_3_findings", [])
    print(f"  D1 total: {len(d1_findings)} / D2 total: {len(d2_findings)} / D3 total: {len(d3_findings)}")

    # Group D1 + D3 by entry; D2 is corpus-global with per-cluster entry lists
    d1_by_entry = defaultdict(list)
    for f in d1_findings:
        n = f.get("entry_number")
        if isinstance(n, int):
            d1_by_entry[n].append(f)

    d3_by_entry = defaultdict(list)
    for f in d3_findings:
        n = f.get("entry_number")
        if isinstance(n, int):
            d3_by_entry[n].append(f)

    # For D2, determine which entries participate in any cluster
    entries_in_d2 = set()
    for cluster in d2_findings:
        for variant in cluster.get("variants", []):
            for e in variant.get("entries", []):
                if isinstance(e, int):
                    entries_in_d2.add(e)

    all_affected_entries = set(d1_by_entry.keys()) | set(d3_by_entry.keys()) | entries_in_d2
    print(f"  Total entries with any Layer 5 finding: {len(all_affected_entries)}")

    # Generate one file per affected entry
    written_files = []
    for entry_num in sorted(all_affected_entries):
        subject = entry_subjects.get(entry_num)
        if not subject:
            print(f"  SKIP entry #{entry_num}: no subject in master MD")
            continue
        slug = slugify(subject)
        out_path = OUT_DIR / f"entry_{entry_num:03d}_{slug}.md"
        body = render_entry_file(
            entry_num=entry_num,
            subject=subject,
            d1=d1_by_entry.get(entry_num, []),
            d2=d2_findings,
            d3=d3_by_entry.get(entry_num, []),
        )
        out_path.write_text(body, encoding="utf-8")
        written_files.append((entry_num, subject, out_path.name))

    print(f"\nWrote {len(written_files)} per-entry Layer 5 staging files")

    # Generate INDEX.md
    index_lines = [
        "# pass5_stage — entry index",
        "",
        "Per-entry Layer 5 fidelity findings, extracted from the corpus-global `transcripts/layer5_fidelity_audit.json` (commit `6a70838`). Files follow the same naming convention as the other pass-stage directories: `entry_NNN_subject_slug.md`.",
        "",
        "## Methodology note",
        "",
        "Layer 5 differs from Passes 1-4 in that its primary methodology was **corpus-global**, not per-entry. The original audit produced ONE JSON file (`layer5_fidelity_audit.json`) covering D1 phantom Whisper renderings + D2 bidirectional canonical inconsistencies + D3 catalog-vs-per-entry contradictions + D4 cross-entry biographical inconsistencies. These per-entry files are a derivative artifact: the same findings, sliced by entry, generated via `transcripts/build_pass5_stage.py`.",
        "",
        "## Inclusion criteria",
        "",
        f"Files exist only for the {len(written_files)} entries that have at least one D1 phantom, one D2 cluster participation, or one D3 catalog contradiction. Entries with zero Layer 5 findings (rare — most entries had at least one phantom) have no file here. D4 findings were 0 corpus-wide, so D4 does not differentiate entries.",
        "",
        "| Entry # | Subject | Filename |",
        "|---|---|---|",
    ]
    for entry_num, subject, filename in written_files:
        index_lines.append(f"| {entry_num} | {subject} | `{filename}` |")
    index_lines.append("")
    index_lines.append("---")
    index_lines.append("")
    index_lines.append("Generated by `transcripts/build_pass5_stage.py`. Re-run to regenerate after Layer 5 re-runs.")
    index_lines.append("")

    (OUT_DIR / "INDEX.md").write_text("\n".join(index_lines), encoding="utf-8")
    print(f"Wrote {OUT_DIR / 'INDEX.md'}")

    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
