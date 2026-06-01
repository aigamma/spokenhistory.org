#!/usr/bin/env python3
"""Build the Events and Activism network artifact.

Walks every public/rag/summaries/pipeline_output/entry_<N>.json, collecting the
union of each chapter's ``related_events`` tags per interview, normalizes the
free-text event strings to canonical events, drops events that fewer than two
distinct interviewees engage, and writes
public/rag/summaries/event_network.json for the EventNetwork React component.

Run from the project root:

    python scripts/build_event_network.py

The output schema:

    {
      "generated_note": "...",
      "events":  [{ "id", "label", "interviewee_count" }],
      "people":  [{ "entry_number", "name" }],
      "edges":   [{ "event_id", "entry_number", "chapter_count" }]
    }

An edge exists ONLY where a chapter actually carried that event tag. Nothing is
inferred. The synonym map below is hand-curated for the recurring hubs; anything
outside it falls back to a deterministic normalized form (lowercase, strip
trailing years and parentheticals, collapse whitespace, Title Case for display)
so near-duplicate strings still collapse to one canonical key.
"""

import glob
import json
import os
import re
import sys
from collections import defaultdict

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
PIPELINE_DIR = os.path.join(
    PROJECT_ROOT, "public", "rag", "summaries", "pipeline_output"
)
OUTPUT_PATH = os.path.join(
    PROJECT_ROOT, "public", "rag", "summaries", "event_network.json"
)

# Drop any canonical event engaged by fewer than this many distinct
# interviewees, so the graph shows shared anchors rather than a hairball of
# one-off singletons.
MIN_INTERVIEWEES = 2

# ---------------------------------------------------------------------------
# Hand-curated synonym map.
#
# Keys are LOWERCASED raw event strings as they appear (verbatim) in the
# pipeline output; values are the canonical display label the variant collapses
# into. This covers the top recurring hubs plus their dated / re-worded
# variants. Genuinely distinct events that happen to share a prefix (the MFDP
# Atlantic City challenge vs. the MFDP congressional challenge; the Greensboro
# vs. Nashville vs. Jackson sit-ins; the 16th Street bombing vs. the Birmingham
# campaign) are deliberately kept apart.
#
# Anything not listed here is normalized by normalize_fallback() below, which
# already folds simple "<event> <year>" and "<event> (parenthetical)" variants
# together, so this map only needs to capture the cases where the wording (not
# just a trailing date) differs.
# ---------------------------------------------------------------------------

SYNONYM_MAP = {
    # Emmett Till, murder + trial + funeral + reinvestigation all anchor to the
    # one generational hub event.
    "emmett till murder": "Emmett Till Murder",
    "murder of emmett till": "Emmett Till Murder",
    "emmett till murder 1955": "Emmett Till Murder",
    "emmett till murder august 1955": "Emmett Till Murder",
    "emmett till abduction 1955": "Emmett Till Murder",
    "emmett till case": "Emmett Till Murder",
    "emmett till murder trial": "Emmett Till Murder",
    "emmett till trial": "Emmett Till Murder",
    "emmett till trial september 1955": "Emmett Till Murder",
    "charles c. diggs jr. observes till trial 1955": "Emmett Till Murder",
    "emmett till open-casket funeral 1955": "Emmett Till Murder",
    "emmett till funeral photographs 1955": "Emmett Till Murder",
    "jet reprints till funeral issue 1955": "Emmett Till Murder",
    "emmett till case reinvestigation": "Emmett Till Murder",
    "emmett till unsolved civil rights crime act": "Emmett Till Murder",

    # Mississippi Freedom Summer (1964).
    "mississippi freedom summer": "Mississippi Freedom Summer",
    "freedom summer": "Mississippi Freedom Summer",
    "freedom summer 1964": "Mississippi Freedom Summer",
    "1964 freedom summer": "Mississippi Freedom Summer",
    "freedom summer training oxford ohio": "Mississippi Freedom Summer",

    # Selma to Montgomery marches (1965), including Bloody Sunday.
    "selma to montgomery marches": "Selma to Montgomery Marches",
    "selma to montgomery march": "Selma to Montgomery Marches",
    "bloody sunday": "Selma to Montgomery Marches",
    "bloody sunday march 7 1965": "Selma to Montgomery Marches",
    "bloody sunday tv coverage": "Selma to Montgomery Marches",

    # Freedom Rides (1961).
    "freedom rides": "Freedom Rides",
    "freedom rides 1961": "Freedom Rides",
    "freedom ride": "Freedom Rides",
    "freedom rides 1961 anniston": "Freedom Rides",

    # March on Washington for Jobs and Freedom (1963).
    "march on washington": "March on Washington",
    "1963 march on washington": "March on Washington",
    "march on washington 1963": "March on Washington",
    "march on washington august 1963": "March on Washington",
    "march on washington for jobs and freedom": "March on Washington",

    # Birmingham campaign (1963). The Children's Crusade is part of it; the
    # 16th Street Baptist Church bombing is kept as its own event.
    "birmingham campaign": "Birmingham Campaign",
    "birmingham children's crusade": "Birmingham Campaign",
    "birmingham childrens crusade": "Birmingham Campaign",

    # 16th Street Baptist Church bombing (September 1963), distinct from the
    # broader Birmingham campaign.
    "16th street baptist church bombing": "16th Street Baptist Church Bombing",
    "16th street baptist church bombing september 15, 1963":
        "16th Street Baptist Church Bombing",

    # Brown v. Board of Education (1954).
    "brown v. board of education": "Brown v. Board of Education",
    "brown v board of education": "Brown v. Board of Education",
    "brown v. board of education 1954": "Brown v. Board of Education",
    "brown vs. board of education": "Brown v. Board of Education",

    # Voting Rights Act of 1965.
    "voting rights act of 1965": "Voting Rights Act of 1965",
    "voting rights act": "Voting Rights Act of 1965",
    "1965 voting rights act": "Voting Rights Act of 1965",

    # Civil Rights Act of 1964.
    "civil rights act of 1964": "Civil Rights Act of 1964",
    "civil rights act": "Civil Rights Act of 1964",
    "1964 civil rights act": "Civil Rights Act of 1964",

    # MFDP Atlantic City challenge (the 1964 DNC seating challenge). Kept
    # separate from the MFDP congressional challenge below.
    "mfdp atlantic city challenge": "MFDP Atlantic City Challenge",
    "mfdp atlantic city challenge august 1964": "MFDP Atlantic City Challenge",
    "mfdp atlantic city lobbying": "MFDP Atlantic City Challenge",
    "mfdp challenge 1964": "MFDP Atlantic City Challenge",
    "1964 democratic national convention": "MFDP Atlantic City Challenge",
    "mississippi freedom democratic party challenge":
        "MFDP Atlantic City Challenge",

    # MFDP congressional challenge (1965) is a different action.
    "mfdp congressional challenge": "MFDP Congressional Challenge",

    # Albany Movement (1961-62).
    "albany movement": "Albany Movement",

    # Montgomery bus boycott (1955-56).
    "montgomery bus boycott": "Montgomery Bus Boycott",
    "montgomery bus boycott (1955-56)": "Montgomery Bus Boycott",
    "montgomery bus boycott 1955": "Montgomery Bus Boycott",

    # Greensboro sit-ins (February 1960). Other cities' sit-ins are their own
    # events and are not folded in here.
    "greensboro sit-ins": "Greensboro Sit-Ins",
    "greensboro sit-in": "Greensboro Sit-Ins",
    "february 1 1960 greensboro sit-in": "Greensboro Sit-Ins",
    "february 1, 1960 greensboro sit-in": "Greensboro Sit-Ins",
    "greensboro sit-ins (february 1960)": "Greensboro Sit-Ins",

    # Nashville sit-ins (1960).
    "nashville sit-ins": "Nashville Sit-Ins",
    "nashville sit-in": "Nashville Sit-Ins",

    # Assassination of Martin Luther King Jr. (1968).
    "assassination of martin luther king jr.":
        "Assassination of Martin Luther King Jr.",
    "assassination of martin luther king jr":
        "Assassination of Martin Luther King Jr.",
    "assassination of martin luther king jr. 1968":
        "Assassination of Martin Luther King Jr.",

    # Assassination of Medgar Evers (1963).
    "assassination of medgar evers": "Assassination of Medgar Evers",
    "murder of medgar evers": "Assassination of Medgar Evers",

    # Assassination of Malcolm X (1965).
    "assassination of malcolm x": "Assassination of Malcolm X",

    # Assassination of John F. Kennedy (1963).
    "assassination of john f. kennedy": "Assassination of John F. Kennedy",
    "assassination of jfk": "Assassination of John F. Kennedy",

    # Poor People's Campaign (1968).
    "poor people's campaign": "Poor People's Campaign",
    "poor peoples campaign": "Poor People's Campaign",

    # Meredith March Against Fear (1966).
    "march against fear": "Meredith March Against Fear",
    "meredith march": "Meredith March Against Fear",
    "meredith march against fear": "Meredith March Against Fear",
    "1966 meredith march against fear": "Meredith March Against Fear",
    "james meredith march against fear": "Meredith March Against Fear",
    "meredith march black power": "Meredith March Against Fear",

    # Memphis Sanitation Strike (1968).
    "memphis sanitation strike": "Memphis Sanitation Strike",

    # Murders of Chaney, Goodman, and Schwerner (1964).
    "murders of chaney, goodman, and schwerner":
        "Murders of Chaney, Goodman, and Schwerner",
    "murder of chaney, goodman, and schwerner":
        "Murders of Chaney, Goodman, and Schwerner",
    "chaney goodman schwerner murders":
        "Murders of Chaney, Goodman, and Schwerner",

    # Founding of SNCC (1960).
    "founding of sncc": "Founding of SNCC",
    "sncc founding": "Founding of SNCC",

    # Chicago Freedom Movement (1966).
    "chicago freedom movement": "Chicago Freedom Movement",

    # St. Augustine movement (1963-64).
    "st. augustine movement": "St. Augustine Movement",
    "saint augustine movement": "St. Augustine Movement",

    # Cambridge movement (Maryland, 1963-64).
    "cambridge movement": "Cambridge Movement",

    # Vernon Dahmer firebombing (1966).
    "vernon dahmer firebombing": "Vernon Dahmer Firebombing",

    # James Meredith's integration of Ole Miss (1962), distinct from his 1966
    # march above.
    "james meredith integrates ole miss": "Integration of Ole Miss",
    "james meredith ole miss enrollment september 1962":
        "Integration of Ole Miss",
    "integration of ole miss": "Integration of Ole Miss",

    # The wars, used as life-timeline anchors by many interviewees.
    "world war ii": "World War II",
    "wwii": "World War II",
    "second world war": "World War II",
    "korean war": "Korean War",
    "vietnam war": "Vietnam War",
    "the vietnam war": "Vietnam War",

    # Great Migration.
    "great migration": "Great Migration",

    # War on Poverty.
    "war on poverty": "War on Poverty",

    # Desegregation of the armed forces (1948).
    "desegregation of the armed forces": "Desegregation of the Armed Forces",

    # Loving v. Virginia (1967).
    "loving v. virginia": "Loving v. Virginia",
    "loving v virginia": "Loving v. Virginia",
}

# Articles / conjunctions / short prepositions that stay lowercase in Title
# Case (unless first or last word). Matches the project's Title Case rule.
TITLE_LOWER = {
    "a", "an", "the", "and", "but", "or", "nor", "for", "yet", "so",
    "of", "in", "on", "to", "by", "at", "up", "as", "v", "vs",
}


def normalize_fallback(raw):
    """Deterministic canonical form for an event not in SYNONYM_MAP.

    Lowercase, strip trailing/leading years and dates and parentheticals,
    collapse whitespace, then Title Case for the display label. Two raw strings
    that differ only by a trailing year or a parenthetical collapse to the same
    key.
    """
    s = raw.strip()
    # Drop parentheticals anywhere, e.g. "(1955-56)", "(February 1960)".
    s = re.sub(r"\([^)]*\)", " ", s)
    # Drop a trailing 4-digit year (optionally with a preceding month name),
    # e.g. "March on Washington 1963", "Emmett Till murder August 1955".
    s = re.sub(
        r"\s+(?:january|february|march|april|may|june|july|august|"
        r"september|october|november|december)?\s*\b(18|19|20)\d{2}\b\s*$",
        " ",
        s,
        flags=re.IGNORECASE,
    )
    # Drop a leading 4-digit year, e.g. "1963 March on Washington".
    s = re.sub(r"^\s*\b(18|19|20)\d{2}\b\s+", " ", s)
    # Collapse whitespace.
    s = re.sub(r"\s+", " ", s).strip()
    if not s:
        # Degenerate input (was only a year/parenthetical); fall back to the
        # raw string collapsed, so we never emit an empty label.
        s = re.sub(r"\s+", " ", raw.strip())
    return title_case(s)


def title_case(s):
    """Title Case per the project rule, preserving ALL-CAPS acronyms."""
    words = s.split(" ")
    out = []
    last = len(words) - 1
    for i, w in enumerate(words):
        if not w:
            continue
        # Preserve acronyms already in caps (SNCC, NAACP, MFDP, JFK, BPP) and
        # tokens carrying internal punctuation we don't want to re-case
        # (v. in "Brown v. Board").
        bare = re.sub(r"[^A-Za-z]", "", w)
        if bare and bare.isupper() and len(bare) >= 2:
            out.append(w)
            continue
        lower = w.lower()
        if i != 0 and i != last and lower.strip(".") in TITLE_LOWER:
            out.append(lower)
        else:
            # Capitalize first alpha char; keep the rest as-is so hyphenated
            # compounds like "Sit-Ins" can be handled by the hyphen pass.
            out.append(capitalize_compound(w))
    return " ".join(out)


def capitalize_compound(w):
    """Capitalize a single token, including both halves of a hyphen compound."""
    parts = w.split("-")
    fixed = []
    for p in parts:
        if not p:
            fixed.append(p)
            continue
        # Find first alpha index and upper it, lower the remainder.
        m = re.search(r"[A-Za-z]", p)
        if not m:
            fixed.append(p)
            continue
        idx = m.start()
        fixed.append(p[:idx] + p[idx].upper() + p[idx + 1:].lower())
    return "-".join(fixed)


def canonicalize(raw):
    """Return the canonical display label for a raw event string."""
    key = raw.strip().lower()
    if key in SYNONYM_MAP:
        return SYNONYM_MAP[key]
    return normalize_fallback(raw)


def event_id(label):
    """Slug id for a canonical event label (stable, URL-safe)."""
    s = label.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def main():
    files = sorted(glob.glob(os.path.join(PIPELINE_DIR, "entry_*.json")))
    if not files:
        print(f"No entry_*.json found under {PIPELINE_DIR}", file=sys.stderr)
        return 1

    # canonical label -> id
    label_to_id = {}
    # (event_id, entry_number) -> chapter_count
    edge_counts = defaultdict(int)
    # event_id -> set of entry_numbers
    event_interviewees = defaultdict(set)
    # entry_number -> interview name
    people = {}

    raw_strings_seen = set()

    for fp in files:
        try:
            data = json.load(open(fp, encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as exc:
            print(f"Skipping unreadable {os.path.basename(fp)}: {exc}",
                  file=sys.stderr)
            continue

        entry_number = data.get("entry_number")
        if entry_number is None:
            # Recover the entry number from the filename as a fallback.
            m = re.search(r"entry_(\d+)\.json$", os.path.basename(fp))
            if m:
                entry_number = int(m.group(1))
            else:
                continue
        entry_number = int(entry_number)
        name = (data.get("interview_name") or f"Entry #{entry_number}").strip()
        people[entry_number] = name

        for ch in data.get("chapters", []):
            for raw in (ch.get("related_events") or []):
                if not isinstance(raw, str) or not raw.strip():
                    continue
                raw_strings_seen.add(raw.strip())
                label = canonicalize(raw)
                ev_id = label_to_id.get(label)
                if ev_id is None:
                    ev_id = event_id(label)
                    # Guard against two distinct labels slugging to the same id
                    # (rare). Suffix-disambiguate so ids stay unique.
                    if ev_id in label_to_id.values():
                        suffix = 2
                        base = ev_id
                        while f"{base}-{suffix}" in label_to_id.values():
                            suffix += 1
                        ev_id = f"{base}-{suffix}"
                    label_to_id[label] = ev_id
                # An edge per (event, interview). chapter_count counts how many
                # of this interview's chapters carried the event tag.
                edge_counts[(ev_id, entry_number)] += 1
                event_interviewees[ev_id].add(entry_number)

    # Drop events engaged by fewer than MIN_INTERVIEWEES distinct interviewees.
    kept_ids = {
        ev_id
        for ev_id, ppl in event_interviewees.items()
        if len(ppl) >= MIN_INTERVIEWEES
    }

    id_to_label = {v: k for k, v in label_to_id.items()}

    events = [
        {
            "id": ev_id,
            "label": id_to_label[ev_id],
            "interviewee_count": len(event_interviewees[ev_id]),
        }
        for ev_id in kept_ids
    ]
    events.sort(key=lambda e: (-e["interviewee_count"], e["label"]))

    edges = [
        {
            "event_id": ev_id,
            "entry_number": entry_number,
            "chapter_count": count,
        }
        for (ev_id, entry_number), count in edge_counts.items()
        if ev_id in kept_ids
    ]
    edges.sort(key=lambda e: (e["event_id"], e["entry_number"]))

    # Only emit people that actually anchor a kept edge, so the graph has no
    # orphan person nodes.
    people_in_edges = {e["entry_number"] for e in edges}
    people_out = [
        {"entry_number": n, "name": people[n]}
        for n in sorted(people_in_edges)
    ]

    out = {
        "generated_note": (
            "Generated by scripts/build_event_network.py from "
            "public/rag/summaries/pipeline_output/entry_*.json. Each edge "
            "reflects a chapter that actually tagged the event in its "
            "related_events field; no connection is inferred. Event labels are "
            "normalized to canonical events via a hand-curated synonym map plus "
            "a deterministic year/parenthetical-stripping fallback. Events "
            f"engaged by fewer than {MIN_INTERVIEWEES} distinct interviewees "
            "are dropped so the graph shows shared anchors."
        ),
        "events": events,
        "people": people_out,
        "edges": edges,
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    # ----- report -----
    print(f"Scanned {len(files)} entry files.")
    print(f"Distinct raw event strings: {len(raw_strings_seen)}")
    print(f"Canonical events (all): {len(label_to_id)}")
    print(
        f"Canonical events kept (>= {MIN_INTERVIEWEES} interviewees): "
        f"{len(events)}"
    )
    print(f"People (nodes with >= 1 kept edge): {len(people_out)}")
    print(f"Edges: {len(edges)}")
    print(f"Wrote {OUTPUT_PATH}")
    print()
    print("Top 20 events by interviewee_count:")
    for e in events[:20]:
        print(f'  {e["interviewee_count"]:3d}  {e["label"]}  ({e["id"]})')

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
