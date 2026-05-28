# Per-Person Pages — JSON Catalog

One JSON file per named individual on the site. Each file is loaded by the `/person/:slug` route's `PersonPage` component and rendered as a citation-bearing reference page. The catalog supports two `person_type` values: interviewees (have their own oral history in the Civil Rights History Project corpus) and external figures (discussed by interviewees but not themselves interviewed).

## Catalog purpose (READ FIRST)

Person pages are **integration hubs** across the site, not freestanding biographies. The primary value of every page is the **cross-link manifest**, the connections to the rest of the site (Library of Congress item URL, semantic neighbors precomputed in `/rag/related/`, position on each concept axis from `/rag/summaries/concept_axes.json`, edges in the influence graph, tour appearances). The biographical paragraph is the connective tissue around those links, not the headline content.

A page is doing its job when a visitor can land on it (via search, via a click from the Interview Map or Semantic Overlap, via an inbound link from another person page) and immediately see how that person connects to the rest of the corpus. The visualizations carry the navigation value; the prose carries voice.

## Writing discipline (READ BEFORE WRITING ANY BIO)

The `biographical_paragraph` field is the only meaningful free-text on each page. Constraints are non-negotiable:

1. **Wikipedia, SNCC Digital Gateway, BlackPast, crmvet.org, LoC item pages, and similar sources are fact-check material ONLY, NEVER writing material.** Verify the date, the role, the affiliation against the source, then write the prose originally in your own voice. Echoing the source's phrasing is plagiarism and gets flagged.
2. **Anti-idempotent prose.** Each bio gets a distinct opening, distinct sentence rhythm, distinct fact-selection that creates a per-person narrative arc. The catalog must not read as N permutations of one biographical template. Vary the verbal entry point (one bio leads with a vivid scene, another with the subject's role, another with a place, another with a year).
3. **Interlinked-data-first.** Wherever you can, name another individual in the corpus by their entry number (e.g., "Kathleen Cleaver (entry 73)"), reference the LoC item URL implicitly via the citation, and let the precomputed cross-link manifest do the rest. The prose is a router into existing material, not a new biographical claim.
4. **Cite every factual claim** with a `[src: N]` reference that maps to an entry in `sources[]`. If a claim can't be cited, omit it.
5. **No subjective or evaluative adjectives.** "Influential," "iconic," "tragic," "courageous," "groundbreaking" are out. Describe roles, dates, and what the person is on record as saying.
6. **No em-dashes** (per the top-level `CLAUDE.md` writing rules). Use commas, semicolons, parentheses, or restructure the sentence.
7. **Title Case for proper-noun phrases**, sentence case otherwise.

## Schema

```jsonc
{
  // Identity
  "schema_version": 1,
  "slug": "aaron-dixon",                // URL-safe; matches the filename
  "person_type": "interviewee",         // "interviewee" | "external_figure"
  "entry_number": 1,                    // required if person_type=interviewee; the CRHP entry number in /rag/constellation.json
  "display_name": "Aaron Dixon",

  // Biographical anchors
  "born": 1949,                         // null if unknown
  "died": null,                         // null if living or unknown
  "role_summary": "Black Panther Party Seattle chapter captain (1968-1972).",

  // Photo block. Public-domain or open-license only. Every photo MUST
  // include the full citation. CRM-era press photos (Charles Moore,
  // Spider Martin, Bob Adelman, Magnum) remain copyrighted and must
  // not be hosted here.
  "photo": {
    "src_local": "/images/people/aaron-dixon.jpg",   // optional local copy
    "src_external": "https://...",                    // optional external hot-link
    "alt": "Aaron Dixon, oral-history portrait",
    "photographer": "...",                            // or "Unknown" if not credited
    "repository": "Library of Congress, AFC 2010/039",
    "license": "Public domain / federal-government work",
    "source_url": "https://www.loc.gov/item/..."
  },

  // Bio paragraph. Interlinked-data-first; citation-bearing; no
  // subjective/evaluative language. Reference other corpus voices by
  // entry_number where relevant; cite each factual claim.
  "biographical_paragraph": "Aaron Dixon co-founded the Seattle chapter of the Black Panther Party in 1968 and served as its captain through 1972 [src: 1]. His oral history is held by the Library of Congress as entry 1 of the Civil Rights History Project (AFC 2010/039) [src: 2]. He discusses chapter organizing, the Free Breakfast for Children program, and his relationship to the national party leadership in dialogue with other Black Panther interviewees in the corpus, including Kathleen Cleaver (entry 73).",

  // Sources cited in the bio paragraph (and any other claims). [src: N]
  // refs in the bio map to indexes in this array.
  "sources": [
    {
      "url": "https://en.wikipedia.org/wiki/Aaron_Dixon",
      "title": "Aaron Dixon",
      "publisher": "Wikipedia"
    },
    {
      "url": "https://www.loc.gov/item/2017689004/",
      "title": "Aaron Dixon oral history",
      "publisher": "Civil Rights History Project, Library of Congress"
    }
  ]
}
```

## Field discipline

### `biographical_paragraph`

See "Writing discipline" above. The seven rules apply to every bio without exception.

### `photo`

- Must be **public domain** or **clearly open-licensed** (CC0, CC-BY, CC-BY-SA, Library of Congress public record, federal-government work).
- The citation block (`photographer`, `repository`, `license`, `source_url`) is required even for clearly-PD images. The institutional review chain (Smithsonian, LoC) expects every image on the site to be source-citable, not assumed-safe.
- Photographers whose work is **still copyrighted** and must NOT be hosted: Charles Moore, Spider Martin, Bob Adelman, Joseph Louw, Magnum agency photographers (Bruce Davidson, Danny Lyon's earlier press work), most AP/UPI/Getty CRM-era press archive material. When no usable PD photo exists, leave the `photo` field absent and the page renders without a portrait.

### `sources[]`

Each entry should have `url`, `title`, and `publisher`. **Wikipedia is LAST priority**; from the institutional-credibility perspective of the Smithsonian and LoC review chain, fewer Wikipedia citations is better and more `loc.gov` citations is better. The strict priority order:

1. **Library of Congress item pages** (most authoritative for interview metadata; the CRHP collection has the formal designation AFC 2010/039 at the LoC American Folklife Center, and every interviewee has a corresponding `loc.gov/item/...` page that should be cited).
2. **Other Library of Congress collections** (Chronicling America newspaper archives, manuscript division finding aids, primary photograph collections).
3. **Other primary-source institutional archives**: Smithsonian NMAAHC digital collections, FBI files, Veterans of the Civil Rights Movement archive at crmvet.org, ANC archives, NAACP archives.
4. **Peer-reviewed scholarly archives and university projects**: SNCC Digital Gateway (Duke University), University of Washington Civil Rights & Labor History Project, university press books with stable URLs.
5. **Established secondary references with editorial review**: BlackPast.org, the Encyclopedia of Civil Rights History (Oxford), and similar.
6. **Wikipedia** (only as a fall-back when no source above carries the fact, and even then prefer to find the underlying citation from the Wikipedia article and cite that primary source instead).

The `sources[]` array in each JSON should reflect this priority: place the LoC item page at index 1 (referenced as `[src: 1]` in the bio for any claim about the oral history itself), and Wikipedia at the LAST index if used at all. The `[src: N]` inline references in the biographical paragraph should map to whichever source actually supports each claim, NOT default to Wikipedia even when multiple sources cover the same fact.

## What the `PersonPage` component derives automatically

The JSON does NOT duplicate data that already lives elsewhere on the site. The component looks up at render time:

- **LoC item URL + audit-tier badge** from `/rag/constellation.json` (keyed by `entry_number`).
- **Semantic-neighbor list** from `/rag/related/entry-${entry_number}.json` (the precomputed top-related interviews per entry).
- **Concept-axis positions** from `/rag/summaries/concept_axes.json` (per-axis position for this entry).
- **ConceptMatrix coordinates** from `/rag/summaries/concept_axes.json` (used by the four-chart matrix).
- **Influence edges** (who-discussed-whom) from `/rag/summaries/influence.json` (in-edges + out-edges).
- **Tour appearances** from `/rag/summaries/tours.json` (tours that feature this person).
- **Geographic anchors** from `/rag/summaries/geography.json` (places associated).

External figures (no `entry_number`) skip the LoC + related-entries + concept-axes lookups but still get influence + tour + (if present in `famous_external.json`) corpus-passage attribution.

## Slug convention

- All lowercase.
- Hyphenated.
- No diacritics: `aaron-dixon` not `Aarón-Dixon`, `bayard-rustin` not `Bayard-Rustin`.
- Suffix disambiguation for common names: `wheeler-parker-jr`, `martin-luther-king-jr`.
- For interviewees, the slug should match the existing `entry_subject` field in `/rag/constellation.json` after lowercasing + hyphenating + stripping parenthetical clarifications.

## Searchability via RAG

After this catalog has enough entries (target: at least the 136 interviewees), each person JSON gets ingested into the main `civil-rights` Pinecone index as ONE vector per person (embedding `display_name + role_summary + biographical_paragraph` as a single document, NOT one vector per paragraph, which would dilute by sheer count). The vector carries `content_type: 'person'` metadata. Existing archive-focused retrieval flows (Quote Finder, Semantic Overlap, Spectrum drill-down, ConceptSpectrum + ConceptMatrix concept queries, InterviewMap concept query) add a filter to exclude `content_type='person'` so their existing ranked-passage UX is unchanged. A new "find a person" affordance or a site-wide search bar can query without the filter and present unified results with a "Person" / "Passage" badge per result.

The filter must be added to all archive-focused retrieval flows BEFORE the first person vector is ingested. The reverse rollout order produces a window where existing flows blend types and rank inconsistently.
