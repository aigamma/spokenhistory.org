"""Pre-compute the influence network: directed graph of who-discussed-whom.

For each of the 136 interviewees, scan all other 135 transcripts for
mentions of their name (full name + last name + known nicknames). Record
matches as edges in a directed graph: speaker --(discusses)--> subject.

Plus include the famous-external panel data (15 figures not in corpus
who are discussed BY many interviewees).

Output: public/rag/summaries/influence.json
{
  "nodes": [{id, name, kind: "interviewee" | "external", entry_number?, ...}],
  "edges": [{from_node_id, to_node_id, mention_count}],
  ...
}

No LLM. Just string matching with normalization.
"""
from __future__ import annotations
import json
import os
import re
import sys
from pathlib import Path
from collections import defaultdict

REPO_ROOT = Path(__file__).resolve().parent.parent
CORRECTED_DIR = REPO_ROOT / "transcripts" / "corrected"
ENTRY_LIST = REPO_ROOT / "public" / "rag" / "summaries" / "_entry_list.json"
FAMOUS_EXTERNAL = REPO_ROOT / "public" / "rag" / "summaries" / "famous_external.json"
OUT_PATH = REPO_ROOT / "public" / "rag" / "summaries" / "influence.json"


def normalize_name(name: str) -> str:
    """Normalize for matching: lowercase, strip honorifics, normalize whitespace."""
    n = name.lower().strip()
    # Strip leading honorifics
    n = re.sub(r"^(rev(\.|erend)?|dr\.?|judge|professor|hon(\.|orable)?|sen(\.|ator)?|mr\.?|mrs\.?|ms\.?)\s+", "", n)
    # Normalize whitespace
    n = re.sub(r"\s+", " ", n)
    # Remove trailing suffixes
    n = re.sub(r",?\s+(jr\.?|sr\.?|iii|ii)$", "", n)
    return n.strip()


def extract_name_components(name: str) -> dict:
    """Extract first, last, last-only-if-unique for matching."""
    norm = normalize_name(name)
    parts = norm.split()
    # Filter out very short parts (initials)
    parts_filt = [p for p in parts if len(p) > 1]
    return {
        "full": norm,
        "first": parts_filt[0] if parts_filt else None,
        "last": parts_filt[-1] if parts_filt else None,
        "parts": parts_filt,
    }


def build_name_patterns(entries: list[dict]) -> dict[int, list[re.Pattern]]:
    """Build regex patterns per entry for matching this person in other transcripts."""
    patterns = {}
    # Track last-names that are NOT unique (so we don't match e.g. "Smith" in
    # someone else's transcript and attribute it to one specific Smith).
    last_name_count = defaultdict(int)
    for e in entries:
        comp = extract_name_components(e["entry_subject"])
        if comp["last"] and len(comp["last"]) >= 4:
            last_name_count[comp["last"]] += 1

    # Strategy: full-name (first + last) match only. No last-name-only and no
    # honorific+last variants — those produce too many false positives across
    # joint-interview entries ("Abernathy family", "Booker and Newsom") and
    # common-word surnames ("Young", "Long", "Head", "King", "Family").
    # This undercounts compared to a human-curated reading but is robust to
    # the common-word false-positive class.
    for e in entries:
        name = e["entry_subject"]
        # Skip joint-interview entry names that don't parse as a single person.
        # We'll add per-person sub-patterns for known multi-speaker joints below.
        comp = extract_name_components(name)
        subj_patterns = []
        if comp["first"] and comp["last"]:
            both = f"{comp['first']} {comp['last']}"
            # Skip "<first> family" patterns (joint interviews) — match literal
            # surname-family pattern instead via canonical "abernathy family"
            # but only if it actually appears as a phrase.
            if "family" in both:
                # match the full literal entry name
                subj_patterns.append(re.compile(r"\b" + re.escape(both) + r"\b", re.IGNORECASE))
            elif len(both) >= 8:
                subj_patterns.append(re.compile(r"\b" + re.escape(both) + r"\b", re.IGNORECASE))
        patterns[e["entry_number"]] = subj_patterns
    return patterns


def main() -> int:
    entries = json.loads(ENTRY_LIST.read_text(encoding="utf-8"))
    famous_data = json.loads(FAMOUS_EXTERNAL.read_text(encoding="utf-8")) if FAMOUS_EXTERNAL.exists() else {"figures": []}
    print(f"Loaded {len(entries)} interviewees + {len(famous_data['figures'])} external figures")

    # Build per-entry patterns for matching
    patterns = build_name_patterns(entries)

    # Read all transcript .txt files into memory
    transcript_texts = {}
    for e in entries:
        path = CORRECTED_DIR / e["dir"] / e["txt"]
        if path.exists():
            try:
                transcript_texts[e["entry_number"]] = path.read_text(encoding="utf-8", errors="ignore")
            except Exception as ex:
                print(f"  SKIP {e['entry_number']}: {ex}", file=sys.stderr)

    print(f"Loaded {len(transcript_texts)} transcripts into memory")

    # Compute in-corpus edges: for each (speaker S, subject T), count mentions of T in S's transcript
    in_corpus_edges = []  # (speaker_entry_number, subject_entry_number, count)
    for speaker_n, text in transcript_texts.items():
        for subj_n, subj_pats in patterns.items():
            if speaker_n == subj_n:
                continue
            # Skip if the speaker's own name appears in the subject's name (avoid
            # matching the interviewee's intro mentions of themselves to themselves)
            # — already handled by speaker_n == subj_n check
            total = 0
            for pat in subj_pats:
                total += len(pat.findall(text))
            if total > 0:
                in_corpus_edges.append((speaker_n, subj_n, total))

    print(f"In-corpus edges: {len(in_corpus_edges)}")

    # External (out-of-corpus) edges from famous_external panel
    external_edges = []
    external_nodes = []
    for f in famous_data.get("figures", []):
        ext_id = f"ext:{f['slug']}"
        external_nodes.append({
            "id": ext_id,
            "name": f["name"],
            "kind": "external",
            "in_corpus": False,
            "discussed_by_count": len(f.get("passages", [])),
        })
        for p in f.get("passages", []):
            if p.get("entry_number") is not None:
                external_edges.append((p["entry_number"], ext_id, 1))

    print(f"External edges: {len(external_edges)}")

    # Build nodes for in-corpus interviewees
    nodes = []
    by_entry = {e["entry_number"]: e for e in entries}
    incoming_count = defaultdict(int)
    for sp, sj, _ in in_corpus_edges:
        incoming_count[sj] += 1
    for ext_sp, ext_sj, _ in external_edges:
        incoming_count[ext_sj] += 1

    for e in entries:
        nodes.append({
            "id": f"in:{e['entry_number']}",
            "name": e["entry_subject"],
            "kind": "interviewee",
            "in_corpus": True,
            "entry_number": e["entry_number"],
            "tier": e.get("tier"),
            "provenance": e.get("provenance"),
            "loc_item_url": e.get("loc_url"),
            "discussed_by_count": incoming_count[e["entry_number"]],
        })

    nodes.extend(external_nodes)

    edges = []
    for sp, sj, count in in_corpus_edges:
        edges.append({
            "from": f"in:{sp}",
            "to": f"in:{sj}",
            "count": count,
        })
    for sp, sj, count in external_edges:
        edges.append({
            "from": f"in:{sp}",
            "to": sj,
            "count": count,
        })

    out = {
        "generated": "2026-05-26",
        "node_count": len(nodes),
        "edge_count": len(edges),
        "in_corpus_count": len(entries),
        "external_count": len(external_nodes),
        "nodes": nodes,
        "edges": edges,
    }

    OUT_PATH.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT_PATH.relative_to(REPO_ROOT)}")

    # Print top discussed
    top_discussed = sorted(nodes, key=lambda n: -n["discussed_by_count"])[:20]
    print("\nTop discussed (in any transcript):")
    for n in top_discussed:
        print(f"  {n['discussed_by_count']:>3}  {n['name']}  ({n['kind']})")

    return 0


if __name__ == "__main__":
    sys.exit(main())
