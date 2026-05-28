# Per-Person Pages — JSON Catalog

One JSON file per named individual on the site. Each file is loaded by the `/person/:slug` route's `PersonPage` component and rendered as a citation-bearing reference page. The catalog supports two `person_type` values: interviewees (have their own oral history in the Civil Rights History Project corpus) and external figures (discussed by interviewees but not themselves interviewed).

## Catalog purpose (READ FIRST)

Person pages are **integration hubs that surface NOVEL AI observations** across the site, not freestanding biographies. The primary value of every page is what a blank-slate AI embedding model "thinks about" each civil rights thinker, **versus** what the established cultural / historiographical record has already carved out for them. The page is a case study in what the cosine-similarity space reveals that textbook history has not.

Two equally-important surfaces on every page:

1. **The AI's reading.** The top semantic neighbors of this person in the corpus that AREN'T the obvious cultural-historical pairings; the concept axes where their position is surprising given their public framing; the cosine-similarity connections to other interviewees that the embedding finds but that the cultural record has not foregrounded. Frame these explicitly as "what the embedding space finds" or "cosine similarity in this corpus puts X close to Y," NOT as "X was historically connected to Y." This is the section the paper being presented draws on.
2. **The historical reading.** The established biographical material (Wikipedia, SNCC Digital Gateway, BlackPast, the LoC item page abstract). This follows the AI's reading and provides the orientation a reader needs to make sense of the surprising connections.

The cross-link manifest (semantic neighbors, concept-axis positions, influence-graph edges, tour appearances) is the substrate that drives both surfaces; the AI's-reading paragraph distills it into prose. A page is doing its job when a reader of the paper-in-progress comes away with a specific, citable observation about a connection the embedding space surfaced that historiography hasn't.

## Writing discipline (READ BEFORE WRITING ANY BIO)

Two free-text fields on each page, and a different discipline for each:

### `ai_reading` (the headline content)

Surface what the embedding space finds about this person that the cultural record hasn't. Concretely, look at the precomputed substrate:

- `/rag/related/entry-${N}.json` — top semantic neighbors of this person's passages.
- `/rag/summaries/concept_axes.json` — this person's position on each named concept axis (with the pole labels).
- `/rag/summaries/influence.json` — who-discussed-whom edges.

Then write a paragraph that names ONE or TWO specific connections the embedding finds AND for which there's a meaningful surprise:

- A neighbor at high cosine similarity who is NOT an obvious cultural-historical pairing (e.g., the embedding placing a Black Panther organizer's testimony close to a Christian Methodist Episcopal pastor's, despite different movement framings).
- A position on a concept axis that contradicts or complicates the public framing (e.g., an interviewee culturally tagged with "nonviolence" placing toward the armed-self-defense pole, or a "secular activist" placing close to the sacred pole).
- An influence-graph edge that runs unexpectedly (e.g., a SNCC organizer discussing a Black Panther figure more frequently than their own SNCC contemporaries do).

Frame the observation explicitly as **embedding-derived**: "Cosine similarity in this corpus puts X's passages closer to Y's than to any of his fellow SCLC interviewees," NOT "X was historically allied with Y." The point is the contrast between AI-revealed structure and cultural cataloging.

### `biographical_paragraph` (the historical orientation)

Constraints are non-negotiable:

1. **Wikipedia, SNCC Digital Gateway, BlackPast, crmvet.org, LoC item pages, and similar sources are fact-check material ONLY, NEVER writing material.** Verify the date, the role, the affiliation against the source, then write the prose originally in your own voice. Echoing the source's phrasing, even at the level of distinctive multi-word clusters, is plagiarism and gets flagged. **The stakes here are not abstract:** a flagged plagiarism finding in any one bio paragraph could be sufficient cause for the Smithsonian / LoC review chain to disqualify the catalog as a whole and end the project. Treat Wikipedia text as poison for the writer, only fact-check anchors are safe to draw out, and even then re-express every distinctive phrasing in original language. Academic citations (SNCC Digital Gateway, university-press scholarship, Library of Congress item descriptions, primary archival sources) have first pick whenever they cover the same fact, BOTH as the source you read AND as the `[src: N]` reference in the catalog.
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

  // AI's reading. Headline content; names a specific embedding-
  // derived observation about this person that the cultural record
  // hasn't foregrounded. Drawn from /rag/related/entry-${N}.json,
  // /rag/summaries/concept_axes.json, and /rag/summaries/influence.json.
  // Always framed as embedding-derived, not historical fact.
  "ai_reading": "Despite Dixon's hard cultural association with the Black Panther Party, the embedding space in this corpus puts his testimony closest by cosine similarity to organizers whose framing is community-service rather than revolutionary politics; his passages cluster with Charles McLaurin's (entry 17) Mississippi voter-registration material more readily than with the BPP-internal rhetoric of Kathleen Cleaver (entry 73). The Free Breakfast for Children and clinic-organizing language seems to dominate his vector signature over the party-line content.",

  // Bio paragraph. Historical orientation. Interlinked-data-first;
  // citation-bearing; no subjective/evaluative language. Reference
  // other corpus voices by entry_number where relevant; cite each
  // factual claim.
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

- Must be **public domain** or **clearly open-licensed** (CC0, CC-BY, CC-BY-SA, Library of Congress public record, federal-government work, or any work first published in the U.S. between 1928 and 1977 without a copyright notice).
- The citation block (`photographer`, `repository`, `license`, `source_url`, optional `date_taken`) is required even for clearly-PD images. The institutional review chain (Smithsonian, LoC) expects every image on the site to be source-citable, not assumed-safe.
- Photographers whose work is **still copyrighted** and must NOT be hosted: Charles Moore, Spider Martin, Bob Adelman, Joseph Louw, Magnum agency photographers (Bruce Davidson, Danny Lyon's earlier press work), most AP/UPI/Getty CRM-era press archive material. When no usable PD photo exists, leave the `photo` field absent and the page renders without a portrait.

#### Image-finding workflow (validated 2026-05-27)

Per-person photo sourcing is a two-step web fetch:

1. **WebFetch the person's Wikipedia article** with a prompt asking for the infobox portrait's filename, visible license tag, and Wikimedia Commons file page URL. Example prompt: *"For the main biographical portrait of [NAME] in this article: extract (1) the image filename on Wikipedia/Wikimedia Commons, (2) any visible license tag, (3) the Wikimedia Commons file page URL. If the image is fair-use only (not open-licensed), say so explicitly. If no image appears, say so."*
2. **WebFetch the Commons file page** with a prompt asking for the canonical license, photographer/author, full `upload.wikimedia.org/wikipedia/commons/...` URL, and date. Example prompt: *"Extract: (1) license (CC-BY-SA, CC-BY, CC0, public domain, etc.), (2) full upload.wikimedia.org URL, (3) photographer/author credit, (4) date taken. If the license is fair-use only or non-commercial, say so explicitly."*

If step 2 returns a CC0 / CC-BY / CC-BY-SA / U.S. public-domain verdict, the photo is usable; record it in the JSON with the full citation block. If it returns fair-use, non-commercial-only, "all rights reserved," or "license unclear," do not use it; leave the `photo` field absent and the page renders without a portrait. Wikipedia infoboxes for less-famous CRHP interviewees frequently have no portrait at all; that is a more-common outcome than a copyright collision. Other workable sources include the LoC Prints & Photographs Online Catalog (most federal-government works are PD), the Smithsonian National Museum of African American History and Culture digital collections, and some university archives.

The PersonPage component renders the `photo` block as a small portrait beside the identity header with the full attribution (photographer, repository, license) in a figcaption below the image; CC-BY and CC-BY-SA images surface the photographer credit automatically, which satisfies the attribution requirement.

### `sources[]`

Each entry should have `url`, `title`, and `publisher`. **Wikipedia is LAST priority**; from the institutional-credibility perspective of the Smithsonian and LoC review chain, fewer Wikipedia citations is better and more `loc.gov` citations is better. The strict priority order:

1. **Library of Congress item pages** (most authoritative for interview metadata; the CRHP collection has the formal designation AFC 2010/039 at the LoC American Folklife Center, and every interviewee has a corresponding `loc.gov/item/...` page that should be cited).
2. **Other Library of Congress collections** (Chronicling America newspaper archives, manuscript division finding aids, primary photograph collections).
3. **Other primary-source institutional archives**: Smithsonian NMAAHC digital collections, FBI files, Veterans of the Civil Rights Movement archive at crmvet.org, ANC archives, NAACP archives.
4. **Peer-reviewed scholarly archives and university projects**: SNCC Digital Gateway (Duke University), University of Washington Civil Rights & Labor History Project, university press books with stable URLs.
5. **Established secondary references with editorial review**: BlackPast.org, the Encyclopedia of Civil Rights History (Oxford), and similar.
6. **Wikipedia** is best used as a **directory** to discover diverse non-correlated sources, NOT as a citation in its own right. When you fetch a Wikipedia article during fact-check, follow the references / external-links section to find the underlying primary or scholarly sources that Wikipedia's editors drew on (a memoir, a journal article, an obituary in a paper of record, a university archive, an oral-history transcript). Cite those underlying sources directly in `sources[]`; do NOT include Wikipedia in the array at all if you can avoid it. The diversity of independent sources is what gives the catalog its citation strength, a long list of disparate scholarly references reads better to an institutional reviewer than a single Wikipedia link, and it removes the "monolithic hub source" attack vector entirely. Wikipedia goes in `sources[]` only when no underlying source can be located for a load-bearing fact.

The `sources[]` array in each JSON should reflect this priority: place the LoC item page at the highest index that fits the citation pattern of that bio (often `[src: 1]` for archive-anchoring claims, or higher when the LoC abstract is not the prose driver), interleave non-correlated academic and primary-source citations across the rest of the array, and put Wikipedia at the LAST index or not at all. The `[src: N]` inline references in the biographical paragraph should map to whichever source actually supports each claim, NOT default to Wikipedia even when multiple sources cover the same fact.

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
