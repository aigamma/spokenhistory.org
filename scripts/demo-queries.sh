#!/usr/bin/env bash
# scripts/demo-queries.sh
#
# Representative queries against the live civil-rights /retrieve
# endpoint, formatted for stakeholder demos. Each query exercises a
# different facet of the citation-grade payload so a viewer can see:
#
#   - Cross-interview thematic retrieval ("nonviolence as theology")
#   - Topical retrieval anchored to specific events ("16th Street Baptist Church bombing")
#   - Per-interviewee filtering (Wheeler Parker on Emmett Till — entry filter)
#   - Quote-finder pattern (paraphrase → primary source)
#   - Multi-perspective surfacing on a contested topic ("Black Power vs nonviolence")
#
# Run after `rag/ingest.mjs` has populated Pinecone civil-rights:
#
#   bash scripts/demo-queries.sh                # all queries
#   bash scripts/demo-queries.sh nonviolence    # just the nonviolence query
#
# Each query prints the top 3 results' entrySubject + locItemUrl +
# timestampRange. Pipe through `jq` for full payload exploration.

set -euo pipefail

ENDPOINT="${ENDPOINT:-https://civil-rights-staging.netlify.app/retrieve}"

format_results() {
  if command -v jq >/dev/null 2>&1; then
    jq -r '.results[] | "  → \(.entrySubject) (entry \(.entryNumber))\n    \(.suggestedCitation)\n    relevance=\(.similarity)  tier=\(.uncertaintyTier // "n/a")\n    \"\(.textPreview)\"\n"'
  elif command -v python >/dev/null 2>&1; then
    python -c '
import json, sys
data = json.load(sys.stdin)
for r in data.get("results", []):
    subj = r.get("entrySubject")
    num = r.get("entryNumber")
    cite = r.get("suggestedCitation")
    sim = r.get("similarity")
    tier = r.get("uncertaintyTier")
    preview = (r.get("textPreview") or "").replace("\n", " ")[:200]
    print("  -> " + str(subj) + " (entry " + str(num) + ")")
    print("    " + str(cite))
    print("    relevance=" + str(sim) + "  tier=" + str(tier))
    print("    \"" + preview + "\"")
    print()
'
  else
    cat
  fi
}

query_one() {
  local label="$1"
  local body="$2"
  printf "\n────────────────────────────────────────────────\n"
  printf "▶ %s\n" "$label"
  printf "  POST %s\n" "$ENDPOINT"
  printf "  body: %s\n" "$body"
  printf "────────────────────────────────────────────────\n"
  curl -sS -X POST -H "Content-Type: application/json" \
    -d "$body" "$ENDPOINT" | format_results
  printf "\n"
}

want="${1:-all}"

if [ "$want" = "all" ] || [ "$want" = "nonviolence" ]; then
  query_one "Nonviolence as theology vs. tactic (open question)" \
    '{"query":"nonviolence as theology vs. tactic","topN":3}'
fi

if [ "$want" = "all" ] || [ "$want" = "selma" ]; then
  query_one "Bloody Sunday at the Edmund Pettus Bridge" \
    '{"query":"bloody sunday edmund pettus bridge first-person account","topN":3}'
fi

if [ "$want" = "all" ] || [ "$want" = "till" ]; then
  query_one "Wheeler Parker Jr. on Emmett Till — scoped via metadata filter" \
    '{"query":"my cousin Emmett Till","filter":{"entry_number":{"$eq":125}},"topN":3}'
fi

if [ "$want" = "all" ] || [ "$want" = "quote" ]; then
  query_one "Quote-finder pattern (paraphrase → primary source)" \
    '{"query":"the dreamer can be killed but not the dream","topN":3}'
fi

if [ "$want" = "all" ] || [ "$want" = "black-power" ]; then
  query_one "Black Power vs. nonviolence — polyphonic view (dedupeByEntry)" \
    '{"query":"young SNCC organizers turning away from nonviolence toward Black Power","topN":4,"dedupeByEntry":true}'
fi

if [ "$want" = "all" ] || [ "$want" = "selma-poly" ]; then
  query_one "Bloody Sunday — polyphonic view (dedupeByEntry; one voice per interviewee)" \
    '{"query":"bloody sunday edmund pettus bridge first-person account","topN":3,"dedupeByEntry":true}'
fi

if [ "$want" = "all" ] || [ "$want" = "selma-church" ]; then
  query_one "16th Street Baptist Church bombing" \
    '{"query":"sixteenth street baptist church bombing september 1963","topN":3}'
fi

if [ "$want" = "all" ] || [ "$want" = "freedom-summer" ]; then
  query_one "Freedom Summer in Mississippi" \
    '{"query":"freedom summer mississippi 1964 voter registration","topN":3}'
fi

if [ "$want" = "all" ] || [ "$want" = "greensboro" ]; then
  query_one "Greensboro sit-ins 1960 (year-qualified event)" \
    '{"query":"greensboro sit-ins 1960","topN":3,"dedupeByEntry":true}'
fi

if [ "$want" = "all" ] || [ "$want" = "voting-rights" ]; then
  query_one "Voting Rights Act 1965" \
    '{"query":"voting rights act 1965","topN":3,"dedupeByEntry":true}'
fi

if [ "$want" = "all" ] || [ "$want" = "mlk-assassination" ]; then
  query_one "Dr. King assassination 1968 — what witnesses recall" \
    '{"query":"Dr. King assassination 1968","topN":3,"dedupeByEntry":true}'
fi
