#!/usr/bin/env python3
"""Expand civil_rights_facts.json from Pass 7 ground-truth proposals.

Pass 7 produced a proposal aggregate with a useful but noisy
`deduplicated_names` list. The authoritative source for descriptions and
transcript evidence is the per-entry proposal payload under `by_entry`.

This script builds conservative, schema-valid fact entries from those proposal
payloads while filtering table-header/parser noise and avoiding alias collisions
with the existing corpus.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FACTS_PATH = ROOT / "Metadata Generation System" / "civil_rights_facts.json"
PROPOSALS_PATH = ROOT / "transcripts" / "ground_truth_proposals_pass7.json"
PASS7_STAGE = ROOT / "transcripts" / "pass7_stage"

NOISE_NAMES = {
    "#",
    "1",
    "2",
    "3",
    "candidate",
    "field",
    "role",
    "transcript evidence",
    "why in corpus",
    "why they belong",
    "aliases to include",
}

HONORIFIC_RE = re.compile(
    r"^(?:Dr\.?|Rev\.?|Reverend|Judge|Sheriff|Mayor|Commissioner|President|Sen\.?|Senator)\s+",
    re.IGNORECASE,
)


@dataclass
class Candidate:
    key: str
    original_names: set[str] = field(default_factory=set)
    roles: list[str] = field(default_factory=list)
    reasons: list[str] = field(default_factory=list)
    evidence: list[str] = field(default_factory=list)
    entries: set[int] = field(default_factory=set)


def compact(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = text.replace("\u2013", "-").replace("\u2014", "-")
    text = text.replace("â€“", "-").replace("â€”", "-").replace("â†’", "->")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def strip_markdown(text: str) -> str:
    text = text.replace("*", "")
    text = text.replace("`", "")
    return text.strip()


def split_unmatched_parenthetical(name: str) -> tuple[str, str | None]:
    if name.count("(") <= name.count(")"):
        return name, None
    idx = name.rfind("(")
    if idx <= 0:
        return name, None
    return name[:idx].strip(), name[idx + 1 :].strip()


def clean_name(raw: str) -> tuple[str | None, list[str]]:
    aliases: list[str] = []
    name = strip_markdown(compact(str(raw or "")))
    name = name.strip(" \t\r\n|,;:")
    name = name.strip("\"'")
    if not name:
        return None, aliases

    lower = name.lower()
    if lower in NOISE_NAMES:
        return None, aliases
    if re.fullmatch(r"(?:gt|p7)?\d+(?:\.\d+)?", lower):
        return None, aliases

    # Remove table/proposal prefixes such as "8-A:", "A:", "GT1", "P7.2".
    changed = True
    while changed:
        before = name
        name = re.sub(r"^\s*\d+\s*-\s*[A-Z]\s*:\s*", "", name)
        name = re.sub(r"^\s*[A-Z]\s*:\s*", "", name)
        name = re.sub(r"^\s*(?:GT|P7)\.?\d+\s*[:.-]?\s*", "", name, flags=re.IGNORECASE)
        changed = name != before

    if name.lower() in NOISE_NAMES or not name:
        return None, aliases

    name, unmatched = split_unmatched_parenthetical(name)
    if unmatched:
        alias = compact(unmatched)
        if alias and len(alias) >= 4 and not alias.lower().startswith("pending"):
            aliases.append(alias)

    # Drop trailing lifespan or parser-note parentheticals from the key.
    name = re.sub(
        r"\s*\((?:[^)]*\d{3,4}[^)]*|organizational entry|collective|pending[^)]*)\)\s*$",
        "",
        name,
        flags=re.IGNORECASE,
    )
    name = compact(name).strip(" \t\r\n|,;:")
    if not name:
        return None, aliases

    aliases.append(name)
    no_honorific = HONORIFIC_RE.sub("", name).strip()
    if no_honorific and no_honorific != name:
        aliases.append(no_honorific)
        name = no_honorific

    # Slash-delimited collective/event names should match either side in text.
    if " / " in name:
        for part in name.split(" / "):
            part = compact(part).strip(" ,;:")
            if len(part) >= 4:
                aliases.append(part)

    key = compact(name).strip(" \t\r\n|,;:")
    if not key or key.lower() in NOISE_NAMES:
        return None, aliases
    if len(key) < 3:
        return None, aliases
    if re.search(r"\b(?:pending adversarial|unverified)\b", key, re.IGNORECASE):
        return None, aliases
    return key, unique_preserve([a for a in aliases if a and len(a) >= 3])


def useful_text(value: str) -> str:
    text = compact(strip_markdown(value or ""))
    if not text:
        return ""
    if text.lower().startswith("(extracted from proposal subsection"):
        return ""
    return text


def unique_preserve(values: list[str]) -> list[str]:
    seen = set()
    out = []
    for value in values:
        key = value.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(value)
    return out


def alias_is_useful(alias: str, key: str, claimed_terms: dict[str, str]) -> bool:
    alias = compact(alias).strip(" \t\r\n|,;:")
    if not alias or alias.lower() == key.lower():
        return False
    if alias.lower() in NOISE_NAMES:
        return False
    if re.fullmatch(r"\d{3,4}(?:\s*-\s*\d{2,4})?", alias):
        return False
    if re.match(r"^\d+\s*-\s*[A-Z]\s*:", alias):
        return False
    if re.match(r"^(?:GT|P7)\.?\d+\b", alias, flags=re.IGNORECASE):
        return False
    if alias.count("(") != alias.count(")"):
        return False
    if "(" in alias and re.search(r"\d{3,4}|pending|unverified|organizational entry", alias, re.IGNORECASE):
        return False
    if len(alias) < 4 and not alias.isupper():
        return False
    if alias.lower() in claimed_terms and claimed_terms[alias.lower()] != key:
        return False
    return True


def sentence_limit(text: str, limit: int) -> str:
    text = compact(text)
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip(" ,;:.") + "."


def load_candidates() -> tuple[dict[str, Candidate], list[str]]:
    payload = json.loads(PROPOSALS_PATH.read_text(encoding="utf-8"))
    candidates: dict[str, Candidate] = {}
    skipped: list[str] = []

    for entry_key, entry in payload.get("by_entry", {}).items():
        try:
            entry_number = int(entry_key)
        except ValueError:
            entry_number = int(entry.get("entry_number", 0) or 0)

        for proposal in entry.get("proposals", []):
            raw_name = proposal.get("name", "")
            clean, aliases = clean_name(raw_name)
            role = useful_text(proposal.get("role", ""))
            reason = useful_text(proposal.get("why_they_belong", ""))
            evidence = useful_text(proposal.get("transcript_evidence", ""))
            if not clean:
                shifted_clean, shifted_aliases = clean_name(role)
                raw_lower = str(raw_name).strip().lower()
                can_shift = bool(re.fullmatch(r"(?:gt|p7)\.?\d+|\d+", raw_lower))
                if can_shift and shifted_clean and role.lower() not in {"figure", "name", "role"}:
                    clean = shifted_clean
                    aliases = shifted_aliases
                    raw_name = role
                    role = reason
                    reason = evidence
                    evidence = ""
                else:
                    skipped.append(str(raw_name))
                    continue
            bucket = candidates.setdefault(clean.lower(), Candidate(key=clean))
            bucket.original_names.update(aliases)
            bucket.original_names.add(compact(strip_markdown(str(raw_name))))
            bucket.entries.add(entry_number)
            if role:
                bucket.roles.append(role)
            if reason:
                bucket.reasons.append(reason)
            if evidence:
                bucket.evidence.append(evidence)

    enrich_from_stage(candidates)
    return candidates, skipped


def stage_file_for_entry(entry_number: int) -> Path | None:
    matches = sorted(PASS7_STAGE.glob(f"entry_{entry_number:03d}_*.md"))
    if len(matches) != 1:
        return None
    return matches[0]


def enrich_from_stage(candidates: dict[str, Candidate]) -> None:
    """Recover Role/Why/Evidence fields from proposal heading blocks.

    `merge_pass7.py` intentionally tolerated many proposal formats, but some
    subsection-style proposals landed in the aggregate JSON with placeholder
    fields. This lightweight pass reads only each candidate's own stage files
    and extracts explicit proposal-block bullets when present.
    """
    stage_cache: dict[int, list[str]] = {}
    field_re = re.compile(
        r"^\s*[-*]?\s*\*\*(?P<label>"
        r"Role|Why(?:\s+(?:they|he|she|it)\s+belong| corpus-worthy| in corpus)?|"
        r"Transcript evidence|Aliases(?: to include)?|Whisper failure pattern"
        r"):?\*\*:?\s*(?P<value>.+?)\s*$",
        re.IGNORECASE,
    )

    for candidate in candidates.values():
        for entry_number in sorted(candidate.entries):
            if entry_number not in stage_cache:
                path = stage_file_for_entry(entry_number)
                stage_cache[entry_number] = path.read_text(encoding="utf-8").splitlines() if path else []
            lines = stage_cache[entry_number]
            key_lower = candidate.key.lower()
            for idx, line in enumerate(lines):
                line_lower = line.lower()
                if "proposal" not in line_lower and "candidate" not in line_lower:
                    continue
                if key_lower not in compact(strip_markdown(line)).lower():
                    continue
                block = [line]
                for next_line in lines[idx + 1 : min(len(lines), idx + 12)]:
                    next_lower = next_line.lower()
                    if (
                        ("proposal" in next_lower or "candidate" in next_lower)
                        and key_lower not in compact(strip_markdown(next_line)).lower()
                    ):
                        break
                    if next_line.startswith("---") or re.match(r"^#{1,6}\s+Section\s+4\b", next_line):
                        break
                    block.append(next_line)
                for raw in block:
                    match = field_re.match(raw.strip())
                    if not match:
                        continue
                    label = match.group("label").lower()
                    value = useful_text(match.group("value"))
                    if not value:
                        continue
                    if label.startswith("role"):
                        candidate.roles.append(value)
                    elif label.startswith("why"):
                        candidate.reasons.append(value)
                    elif label.startswith("transcript"):
                        candidate.evidence.append(value)
                    elif label.startswith("aliases"):
                        for alias in re.split(r",|;", value):
                            clean_alias = compact(strip_markdown(alias))
                            if clean_alias:
                                candidate.original_names.add(clean_alias)
                    elif label.startswith("whisper"):
                        candidate.reasons.append(f"Whisper failure pattern: {value}")


def existing_terms(facts: dict) -> dict[str, str]:
    owners: dict[str, str] = {}
    for key, value in facts.items():
        owners[key.lower()] = key
        aliases = value.get("aliases", [])
        if isinstance(aliases, list):
            for alias in aliases:
                if isinstance(alias, str) and alias.strip():
                    owners[alias.lower()] = key
    return owners


def make_entry(candidate: Candidate, claimed_terms: dict[str, str]) -> dict:
    roles = unique_preserve(candidate.roles)
    reasons = unique_preserve(candidate.reasons)
    evidence = unique_preserve(candidate.evidence)

    role = roles[0] if roles else "Pass 7 proposed civil-rights corpus entity"
    description = sentence_limit(role, 240)

    aliases = []
    for alias in sorted(candidate.original_names, key=lambda s: (s.lower() != candidate.key.lower(), s.lower())):
        alias = compact(alias).strip(" \t\r\n|,;:")
        if not alias_is_useful(alias, candidate.key, claimed_terms):
            continue
        aliases.append(alias)

    summary_parts = [
        f"{candidate.key} is included in the Civil Rights History Project ground-truth corpus from the Pass 7 Publication Readiness Review.",
        f"Role or context: {sentence_limit(role, 420)}",
    ]
    if len(roles) > 1:
        summary_parts.append(f"Additional Pass 7 role notes: {sentence_limit('; '.join(roles[1:3]), 360)}")
    if reasons:
        summary_parts.append(f"Why it belongs: {sentence_limit(' '.join(reasons[:2]), 650)}")
    if evidence:
        summary_parts.append(f"Transcript evidence: {sentence_limit(' '.join(evidence[:2]), 650)}")
    summary_parts.append(
        "This entry exists to ground ASR correction, dual scoring, citation audit, and entity matching for the named interview passages."
    )
    if candidate.entries:
        entries = ", ".join(str(n) for n in sorted(candidate.entries))
        summary_parts.append(f"Pass 7 proposal source entries: {entries}.")

    entry = {
        "wikipedia_title": candidate.key,
        "description": description,
        "aliases": unique_preserve(aliases[:8]),
        "summary": " ".join(summary_parts),
    }
    if not entry["aliases"]:
        del entry["aliases"]
    return entry


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--max-additions", type=int, default=None)
    parser.add_argument("--report-skipped", action="store_true")
    parser.add_argument("--base-ref", help="Read civil_rights_facts.json from a git ref before expanding")
    args = parser.parse_args()

    if args.base_ref:
        rel = FACTS_PATH.relative_to(ROOT).as_posix()
        proc = subprocess.run(
            ["git", "show", f"{args.base_ref}:{rel}"],
            cwd=ROOT,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        facts = json.loads(proc.stdout.decode("utf-8"))
    else:
        facts = json.loads(FACTS_PATH.read_text(encoding="utf-8"))
    terms = existing_terms(facts)
    candidates, skipped_noise = load_candidates()

    additions: dict[str, dict] = {}
    skipped_existing: list[str] = []
    claimed_terms = dict(terms)

    for _, candidate in sorted(candidates.items(), key=lambda item: item[1].key.lower()):
        if candidate.key.lower() in terms:
            skipped_existing.append(candidate.key)
            continue
        entry = make_entry(candidate, claimed_terms)
        additions[candidate.key] = entry
        claimed_terms[candidate.key.lower()] = candidate.key
        for alias in entry.get("aliases", []):
            claimed_terms[alias.lower()] = candidate.key
        if args.max_additions is not None and len(additions) >= args.max_additions:
            break

    expanded = dict(facts)
    expanded.update(additions)

    print(f"Existing entries: {len(facts)}")
    print(f"Pass 7 normalized candidates: {len(candidates)}")
    print(f"Additions: {len(additions)}")
    print(f"Projected entries: {len(expanded)}")
    print(f"Skipped noise rows: {len(skipped_noise)}")
    print(f"Skipped already existing: {len(skipped_existing)}")

    if args.report_skipped:
        grouped = defaultdict(list)
        for value in skipped_noise:
            grouped["noise"].append(value)
        for value in skipped_existing:
            grouped["existing"].append(value)
        for label, values in grouped.items():
            print(f"\n{label}:")
            for value in unique_preserve(values)[:120]:
                print(f"  - {value}")

    if not args.dry_run:
        FACTS_PATH.write_text(
            json.dumps(expanded, indent=2, ensure_ascii=True) + "\n",
            encoding="utf-8",
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
