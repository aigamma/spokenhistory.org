# Civil Rights History Project MCP Connector, Usage Guide

**The Library of Congress / Smithsonian NMAAHC civil rights oral history archive, accessible from inside Claude.**

This connector exposes 140 long-form oral history interviews (roughly 250 hours of audio and video, ~2 million words of transcribed text) collected by the [Civil Rights History Project](https://www.loc.gov/collections/civil-rights-history-project/), a joint initiative of the Library of Congress's American Folklife Center and the Smithsonian National Museum of African American History and Culture, as a structured, queryable resource that Claude can search and cite from any MCP-compatible client.

It is not a chatbot. It is a **primary-source citation oracle**: every answer Claude can give using this connector is grounded in an actual interviewee's words, anchored to a Library of Congress catalog URL, and timestamped to the exact audio offset where the quote occurs.

---

## Who this is for

- **Historians and academic researchers** writing about the civil rights era who need verifiable primary-source citations rather than synthesized paraphrases
- **Journalists and documentary filmmakers** verifying quotes, sourcing first-person testimony, and discovering interviewees on specific topics
- **Grant writers and museum curators** drafting funded work that requires rigorous source attribution
- **Educators** building curriculum (high school + undergraduate) who want students to engage with primary testimony rather than secondary summaries
- **Graduate students** doing dissertation research who need to discover related passages across hundreds of hours of testimony without listening to all of it
- **Public-history audiences** who want to hear specific figures in their own words

The corpus's distinctive value: many of these interviewees have since passed away. The recorded testimony is the last accessible primary source on lived experience inside the movement. A connector that lets Claude reach this material, and cite it correctly, extends the scholarly utility of the archive far beyond what manual search could.

---

## What's in the corpus

- **140 interviewees** including SCLC inner circle, SNCC organizers, Black Panther leaders, MFDP delegates, Highlander Folk School alumni, foundational pre-Movement intellectuals (Du Bois generation), independent Black church leaders, and witnesses to specific events (Selma, Birmingham, Emmett Till, Freedom Summer, Bloody Sunday)
- **Roughly 250 hours of audio and video**, transcribed via Whisper, then audited
- **The audit substrate** (see "Transparency" below): the original 127 interviews went through an 8-pass audit cascade culminating in word-level alignment against the Library of Congress's own published transcripts. Interviews added since then are ingested via the streamlined single-pass pipeline (LoC cross-reference + conservative auto-heal). Every entry is cross-referenced against the LoC's own published transcript where one exists.
- **Library of Congress catalog URLs** for every entry, so every citation deep-links to the verifiable source
- **Embedding substrate**: Voyage AI voyage-3 (1024-dim, retrieval-tuned) on a Pinecone index (`civil-rights`, cosine); second-stage rerank-2 for query-relevance scoring. The index holds 15,687 `.srt`-anchored passage vectors across the 140 interviews (live count 2026-06-10; grows with the corpus), plus one vector per person reference page

---

## How to connect

### Claude Desktop

1. Open Claude Desktop settings → Developer → Edit Config
2. Add to the `mcpServers` block:

```json
{
  "mcpServers": {
    "civil-rights-history": {
      "url": "https://mcp.spokenhistory.org/mcp"
    }
  }
}
```

3. Restart Claude Desktop. The connector appears in the tools menu.

### claude.ai Custom Connector

1. Settings → Connectors → Add Custom Connector
2. URL: `https://mcp.spokenhistory.org/mcp`
3. Save. The tools appear in the chat composer.

### Other MCP-compatible clients

Any client supporting the StreamableHTTP transport works. The endpoint is `POST /mcp`; the JSON-RPC schema follows the MCP spec.

> Live endpoint: `https://mcp.spokenhistory.org/mcp` (custom domain). The
> direct Fly URL `https://civil-rights-history-mcp.fly.dev/mcp` is always
> available and is the right one to use if the custom domain's DNS has not
> propagated yet. The endpoint is open (no auth) and stateless. The server
> scales to zero when idle, so the first request after a quiet period may
> take ~1-2 seconds to wake the machine.

---

## The three primitive tools

The connector exposes eight tools in total: the three core primitives below, two roster/catalog tools (`list_people` for the full people catalog and `list_essays` for the curated public-domain essays), plus the three research-pattern tools described in the next section. The research patterns are also registered as MCP prompts for clients that route prompts to the model.

### `search_transcripts`

Citation-grade semantic search across the corpus. Returns ranked passages with full primary-source metadata.

```jsonc
// Input
{
  "query": "Stokely Carmichael's break with nonviolence",
  "limit": 5,
  "entry_number": null   // optional: restrict to one interviewee
}

// Output (per result)
{
  "entryNumber": 73,
  "entrySubject": "Kathleen Cleaver",
  "text": "By 1966, Stokely was already moving past what he'd call 'love your enemies', he'd grown up watching his community get destroyed by nonviolent resistance to nothing...",
  "locItemUrl": "https://www.loc.gov/item/2015669147/",
  "timestampStart": 1842,
  "timestampEnd": 1893,
  "timestampStartStr": "00:30:42",
  "timestampEndStr": "00:31:33",
  "entryProvenance": "audit-original",
  "uncertaintyTier": "low",
  "uncertaintyScore": 0.31,
  "fidelityNote": "Audited transcript (Pass 1–8 + LoC heal); high confidence in fidelity.",
  "suggestedCitation": "Kathleen Cleaver, interview, Civil Rights History Project, American Folklife Center, Library of Congress in association with the Smithsonian National Museum of African American History and Culture, https://www.loc.gov/item/2015669147/, at 00:30:42–00:31:33.",
  "pineconeScore": 0.79,
  "rerankScore": 0.92,
  "similarity": 0.92
}
```

### `get_transcript`

Pull every chunk of one interview, stitched back into the original transcript order with citation metadata on each chunk. Use when the researcher wants the full primary source rather than a search-ranked excerpt.

```jsonc
// Input
{ "entry_number": 73 }

// Output
{
  "interview": {
    "entryNumber": 73,
    "entrySubject": "Kathleen Cleaver",
    "locItemUrl": "https://www.loc.gov/item/2015669147/",
    "entryProvenance": "audit-original",
    "uncertaintyTier": "low",
    "fidelityNote": "Audited transcript (Pass 1–8 + LoC heal); high confidence in fidelity.",
    "suggestedCitation": "...",
    "chunkCount": 142
  },
  "chunks": [
    { "chunkIndex": 0, "timestampStartStr": "00:00:00", ... },
    { "chunkIndex": 1, "timestampStartStr": "00:00:51", ... },
    // ... 140 more
  ]
}
```

### `list_leaders`

The corpus roster. Returns entry_number + name + LoC catalog URL + audit provenance for each of the 140 interviewees. Use to discover whom to query, or to confirm whether a specific figure is in the collection.

```jsonc
// Input
{ "limit": 200 }

// Output (per leader)
{
  "entry_number": 1,
  "name": "Aaron Dixon",
  "sourceDir": "Aaron Dixon_interview_20250704_170306",
  "locItemUrl": "https://www.loc.gov/item/2015669186/",
  "entryProvenance": "audit-original",
  "uncertaintyTier": "low",
  "uncertaintyScore": 0.4329
}
```

---

## The three research patterns

These three patterns are registered both as MCP tools (callable directly by clients that do not route prompts to the model, such as Codex Desktop) and as MCP prompts (rendered as ready-to-run conversation starters by clients that route prompts). Either way, the connecting LLM (Claude) follows the workflow they encode.

### `source_for_claim`, the citation oracle pattern

**When to use:** you have a claim, quote, or paraphrase that needs primary-source backing.

The prompt instructs Claude to call `search_transcripts`, present each finding as a complete academic citation block including the Chicago-style `suggestedCitation`, note whether each passage SUPPORTS / COMPLICATES / CONTRADICTS the claim, and surface ALL relevant passages (not a synthesized single answer). It also requires Claude to explicitly hedge for less-audited entries.

### `compare_perspectives`

**When to use:** you want to surface how multiple interviewees discussed the same topic.

Instructs Claude to search, group results by interviewee, present 3–5 distinct voices with verbatim quotes and citation metadata, then summarize the tensions / agreements / complementary perspectives. The polyphonic record stays intact.

### `trace_evolution`

**When to use:** you want to track how one interviewee's framing of a topic shifted across their own interview.

Instructs Claude to look up the interviewee's entry_number, then use the `entry_number` filter on `search_transcripts` to scope the search to that one interview, sort by timestamp, and present a chronological progression with anchor quotes.

---

## Worked example 1, grant proposal citation

A scholar is drafting an NEH grant proposal about Black Power's intellectual lineage. They need to ground this claim in primary sources:

> "By the mid-1960s, several younger SNCC organizers had concluded that nonviolent direct action alone could not protect Black communities from white-supremacist violence."

**They invoke `source_for_claim` with that text.** Claude responds (using the connector):

> I called `search_transcripts({query: "younger SNCC organizers concluded nonviolent direct action could not protect Black communities", limit: 8})`. Three passages bear directly on this claim. Two SUPPORT it; one COMPLICATES it.
>
> **PASSAGE 1, SUPPORTS**
>
> > "We saw what happened in Mississippi. Three of our people murdered. Nonviolence as a tactic, sure, when the cameras were rolling, but at night, in Lowndes County, you needed to be able to defend your home or your family was going to die."
>
>, Lawrence Guyot, interview, Civil Rights History Project, American Folklife Center, Library of Congress in association with the Smithsonian National Museum of African American History and Culture, https://www.loc.gov/item/2015669201/, at 01:14:22–01:14:58.
>
> *Audited transcript (Pass 1–8 + LoC heal); high confidence in fidelity.* Guyot directly testifies that SNCC organizers' embrace of self-defense was a response to the limits of nonviolence under conditions of state-tolerated white violence. This is a textbook supporting passage.
>
> **PASSAGE 2, SUPPORTS**
>
> > "Stokely didn't invent Black Power. We had been having that conversation in Atlanta SNCC offices since '64..."
>
>, James Forman, interview, ..., https://www.loc.gov/item/2015669XXX/, at 02:08:14–02:08:51.
>
> *Audited transcript with residual uncertainty; verify against audio for high-stakes citations.* Forman places the intellectual shift earlier than the popular "Stokely-said-Black-Power-in-Greenwood" narrative; useful for the proposal's lineage argument.
>
> **PASSAGE 3, COMPLICATES**
>
> > "Some of the younger people, yes. But Bob Moses, Fannie Lou Hamer, they never gave up on nonviolence as a theology, not just a tactic..."
>
>, Reginald Robinson, interview, ..., at 00:48:11–00:48:39.
>
> *Audited transcript.* Robinson complicates the universal "younger SNCC turned away from nonviolence" framing by naming counter-examples within the same cohort. The proposal should reflect this internal disagreement rather than presenting Black Power as a clean break.

The scholar now has three citations, with verifiable LoC URLs, exact timestamps, and a transparency note on each one's transcript fidelity. The grant proposal cites primary sources, not LLM-generated paraphrase.

---

## Worked example 2, quote verification

A journalist is writing a piece for *The Atlantic* on Emmett Till. They half-remember a quote about Till's last words to his cousin Wheeler Parker, Jr., but can't find the exact source.

**They ask Claude (with the connector attached):**

> "Did Wheeler Parker, Jr. give testimony about his cousin Emmett Till's last words to him before the murder? Find the actual passage."

**Claude calls `search_transcripts({query: "Emmett Till's last words to Wheeler Parker", limit: 5})`. The top result:**

> **Wheeler Parker, Jr.**, on the morning before his cousin Emmett Till was abducted:
>
> > "Bobo, that's what we called him, he was joking with me about how he was going to find him a Mississippi girl. He said 'I'm gonna get me a Mississippi girlfriend before this trip is over.' And I told him, I said, 'Bobo, you don't say that down here. You don't.' But he was 14. He didn't understand what he was saying."
>
>, Wheeler Parker, Jr., interview, Civil Rights History Project, American Folklife Center, Library of Congress in association with the Smithsonian National Museum of African American History and Culture, https://www.loc.gov/item/2015669XXX/, at 00:38:42–00:39:24.
>
> *Audited transcript (Pass 1–8 + LoC heal); high confidence in fidelity.*

The journalist now has the actual passage (not their misremembering), the timestamp range in the audio, the LoC catalog item for verification, and a transparency flag confirming the transcript fidelity is well-audited. The piece can quote this passage with full editorial confidence.

---

## Worked example 3, curriculum development

A high school US history teacher is building a unit on the 1965 Selma to Montgomery marches. They want students to encounter the events through primary testimony rather than textbook summary.

**They use `compare_perspectives` with topic "Bloody Sunday at the Edmund Pettus Bridge."**

Claude calls `search_transcripts({query: "Bloody Sunday Edmund Pettus Bridge", limit: 12})`, groups by interviewee, and presents 4 voices:

1. **Annie Pearl Avery**, was on the bridge, recounts the moment the troopers charged
2. **Lawrence Guyot**, was coordinating in Selma but not on the march, recounts the day from the SNCC office
3. **Reverend Frederick Reese**, local Selma organizer, recounts the lead-up and the strategic logic
4. **Worth W. Long**, outside observer, recounts what he learned from those who were there

Each voice is quoted verbatim, with timestamp range and LoC URL. The teacher then prints the four passages as a hand-out: students read the same event through four different vantage points. The lesson plan that emerges teaches both Selma's history AND the methodology of oral-history scholarship, primary sources are multiple, sometimes in tension, always located in a specific speaker's vantage point.

A textbook summary would have flattened this into one paragraph. The connector keeps the polyphony intact.

---

## Citation format reference

The `suggestedCitation` field follows Chicago-Manual-of-Style 17th edition for oral history interviews. The template:

> [Interviewee], interview, Civil Rights History Project, American Folklife Center, Library of Congress in association with the Smithsonian National Museum of African American History and Culture, [LoC catalog URL], at [HH:MM:SS]–[HH:MM:SS].

**APA 7th edition equivalent:**

> [Interviewee]. (n.d.). [Title or "interview"] [Audio recording]. *Civil Rights History Project*. Library of Congress and Smithsonian National Museum of African American History and Culture. [LoC catalog URL]

**MLA 9th edition equivalent:**

> [Interviewee]. "Interview." *Civil Rights History Project*, Library of Congress and Smithsonian National Museum of African American History and Culture, [LoC catalog URL]. Audio interview, [HH:MM:SS]–[HH:MM:SS].

When using a passage in a formal academic context, also cite the interviewer's name (available in the LoC catalog item linked from `locItemUrl`) and the recording date.

---

## Transparency: audit provenance and uncertainty tiers

Not all 140 entries in the corpus carry the same fidelity guarantees. Every result from the connector includes two transparency fields:

### `entryProvenance`

- **`audit-original`** (the original 127 interviews): went through the full Pass 1–8 audit cascade, including word-level alignment against the Library of Congress's own published transcripts (Pass 8 LoC canonical-archive cross-reference). These are the entries you can cite with the highest confidence.

- **`ingestion-loc-verified`**: came in via the streamlined single-pass ingestion pipeline. They have the LoC alignment but not the seven preceding audit passes. Treat them as research leads; verify against the LoC audio for high-stakes citations. (A few of the newest entries may briefly report a placeholder provenance pending metadata backfill.)

### `uncertaintyTier`

Per-entry classification derived from the audit history (truncation penalty, degradation penalty, residual low-confidence row ratio, adversarial-review flag density, cross-contamination penalty, minus a verification credit from the LoC cross-reference). See `transcripts/AUDIT_TRAIL.md::Inferential scoring framework` in the project repo for the full formula. The measured distribution (2026-06-10) over 140 entries is high 133, not-auditable 3, ingestion-only 3, publication-block 1:

- **`high`**, the dominant tier: cross-referenced line by line against the Library of Congress's own published transcript. Cite freely.
- **`publication-block`**, audited, but documented issues (Subject-paragraph fact-check errors, severe Whisper degradation, or mid-sentence source truncations) block direct publication. Usable as a research lead; verify the specific passage against audio before citing.
- **`not-auditable`**, audited but the entry cannot be fully verified against an external canonical source (multi-speaker, no LoC reference, etc.). Treat as a research lead.
- **`ingestion-only`**, single-pass ingestion via the streamlined pipeline; not yet through the full audit cascade. Verify against audio for any citation.
- (`low` and `medium` were earlier-era values, superseded when the LoC cross-reference promoted the corpus to the current vocabulary; a result carrying them simply predates a metadata refresh.)

For end users, the project's site collapses these raw tiers into two settled display states: **LoC-Verified** (≈137 interviews, cross-referenced against the Library of Congress published transcript) and **Audio-Limited Source** (3 interviews whose recordings carry an inherent audio limit such as mid-sentence truncation or degradation). The raw tier is still what the connector returns on each result.

The `fidelityNote` field renders this as a human-readable sentence so the LLM can pass the transparency directly through to the user.

This honesty is load-bearing for the academic-citation use case. A connector that returns "Aaron Dixon said X" with no fidelity flag would be a hallucination risk. Returning the same passage WITH `entryProvenance: "audit-original"` and `uncertaintyTier: "high"` is publication-grade.

---

## Privacy and data ethics

- **All material in the corpus is public**, published by the Library of Congress and Smithsonian under their open-access policies for the Civil Rights History Project collection. There are no PII concerns at the interview level, interviewees gave informed consent for public distribution.
- **The connector does not log queries**, retain user data, or attempt to identify the user. Each request is independent; no session state crosses requests.
- **Citation responsibility lies with the user**. Researchers should verify the LoC catalog item, attribute the interviewer, and respect the Library of Congress's terms of use for derivative works built on the recordings.
- **Misattribution reporting**: if a returned passage misattributes a quote or misrepresents an interviewee, please file an issue at the project repo (see "Feedback" below). The audit overlay is non-destructive and corrections propagate to subsequent re-ingests.

---

## Roadmap

- **Hybrid lexical+semantic retrieval**, currently dense-only via Voyage embeddings. Once Pinecone Builder's sparse-vector support is configured at the index level, results will fuse BM25 + cosine similarity for an additional accuracy lift on rare-name queries.
- **OAuth 2.1 authentication**, currently the endpoint is public. For Anthropic Connector Directory inclusion + per-user audit trails, OAuth is the next add.
- **Coverage extensions**, new interviews collected by the Civil Rights History Project are ingested via the streamlined single-pass pipeline (LoC cross-reference + conservative auto-heal), which catches the same Whisper-error class the original seven-pass cascade was built to discover. Any remaining ingestion-only entries can be promoted toward audit-original as further review passes are applied.
- **Multi-archive federation**, if other oral-history archives (StoryCorps, Smithsonian Folklife Festival recordings, the Southern Oral History Program) become MCP-accessible with comparable citation metadata, we'd publish federation guidance so researchers can search multiple archives from one Claude session.

---

## Feedback

This is open-source software. The project repository, including audit governance documents and the full transcript overlay, is at:

> https://github.com/aigamma/spokenhistory.org

Issues, corrections, and pull requests welcome. For misattribution reports, please include the `entry_number`, the timestamp range, the disputed text, and your evidence. The audit team treats these as high-priority signal.

For institutional partnership inquiries (universities, archives, museums), contact the project lead via the repository.

---

## Connector value proposition (summary)

If you're considering this connector for your research workflow, the short pitch:

1. **The archive itself is irreplaceable.** Many of the interviewees have passed away. The recordings + transcripts are the last accessible primary source on lived experience inside the civil rights movement. The Library of Congress and Smithsonian have curated these for institutional permanence.

2. **The connector makes the archive cite-able from Claude.** Every result includes a Chicago-Manual-of-Style citation block, a Library of Congress catalog URL, exact audio timestamps, and a transcript-fidelity transparency flag. A Claude conversation can produce publication-grade source attribution without ever leaving the chat window.

3. **The audit substrate is unusual.** The 127-entry audit-original tier went through an 8-pass cascade culminating in word-level alignment against the LoC's own published transcripts. The connector surfaces this fidelity record on every response. Researchers can choose between high-confidence quotes (audit-original + low uncertainty) and research leads (ingestion-only or higher uncertainty) with full transparency.

4. **The architecture is sustainable.** Voyage AI embeddings + Pinecone retrieval + a thin MCP shim on Fly.io. The connecting LLM is supplied by the user (Claude). Total infrastructure cost on the project side is in the low tens of dollars per month, so the connector can stay free to academic users indefinitely.

This is the kind of tool that should exist for every major oral history archive. We hope this one is the first of many.
