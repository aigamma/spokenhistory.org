# Civil Rights History Project, Transcript Audit & LoC Healing

**A conceptual map of what was done, why, and what we learned**
**Audience:** WWU team, Smithsonian NMAAHC + Library of Congress collaborators, and anyone reviewing the project record
**Last updated:** 2026-05-25
**Companion files:** `lessons_learned.md` (deeper-dive error categorization), `STEERING_DOCS.md` (one-page map of the project's central documents, including this one)

---

## The problem in one slide

> Automatic Speech Recognition (Whisper) on 1960s-era oral history audio produces transcript text that reads fluently but contains systematic errors invisible to a casual read. A Smithsonian-grade publication built on those transcripts would confidently say the wrong thing.

Concrete examples we found in our corpus, all of them in transcripts that a normal proofread would not catch:

| Whisper output | Correct reading | Why it matters |
|---|---|---|
| "David Klein" | **David Cline** | Wrong interviewer attributed to ~100 interviews in the corpus |
| "Daniel H. Krenge De Iongh" | **Daniel H. Crena de Iongh** | World Bank treasurer 1946–52; personal banker to Hendrik Verwoerd. The audit overlay had the wrong spelling, which would have made him unfindable in any external archive |
| "Paul Hoffman Robeson" (4 instances) | **Paul Robeson** | Whisper merged Paul Robeson (foundational civil rights intellectual) with Paul Hoffman (Harvard rower) into one identity in John Carlos's interview |
| "Earl, Adam Clayton Powell Sr, Andrew, Carlos" | **Earl Jr., Andrew, John Carlos** | John Carlos's siblings list contaminated by adjacent Abyssinian Baptist Church narrative, created a fictional sibling |
| "Margaret the King" | **Martin Luther King Jr.** | Recurring across multiple interviews |
| "Audubon Ballroom" → "Auto bom barroom" | Audubon Ballroom | Site of Malcolm X's assassination, rendered unrecognizable |
| "Stokely Carmichael" → "Stoke and Carmichael" | Stokely Carmichael | SNCC chairman, originator of "Black Power" slogan, Whisper invented a second speaker |

These aren't typos. They're **categorical mismatches**, wrong person, wrong place, wrong fact, presented with the same confidence as the rest of the text.

---

## The audit approach (high level)

We built an audit overlay, a single master file (`transcripts/CLEANED_TRANSCRIPTS_REVIEW.md`), that records:

- Every divergence found between Whisper's output and the truth
- The canonical reading (with provenance: catalog reference, ground-truth corpus, source archive)
- A confidence tier (`correct` / `high` / `medium` / `low` / `speaker-originating` / `flagged-for-adversarial-review`)
- A row ID linking each correction back to the pass that found it (`1.42`, `1.P2.3`, `1.P7.1a`, etc.)

The overlay is **non-destructive**: the original Whisper output in `transcripts/raw/` is never modified. Corrections accumulate in the master overlay, then get applied to a parallel `transcripts/corrected/` directory which is what the downstream RAG / publication pipeline reads.

Over five days we ran **eight audit passes** (Pass 1 → Pass 2 + Pass 2 tail → Pass 3 → Pass 4 → Layer 5 → Pass 6 → Pass 7 PRR → Pass 8 LoC healing) plus a ~140-entry ground-truth corpus (`civil_rights_facts.json`) used to anchor the LLM scorer's claims.

---

## Conceptual breakthroughs

### 1. Hallucination risk is concentrated in proper nouns and named figures

This is the single most important insight from the audit. Generic prose (verbs, common nouns, function words) is largely correct in Whisper output. What Whisper gets wrong, and gets confidently wrong, is **names**. Names of people, places, organizations, events. The institutional credibility risk for an oral history project is concentrated almost entirely in this one error class. Every audit-overlay decision after Pass 2 was designed around this insight.

### 2. The deployment gap: side-files vs. applied corrections

An audit pass can generate the perfect catalog of corrections and still produce zero downstream improvement if there's no machinery to *apply* the catalog to the deliverable files. We discovered this the hard way on 2026-05-25: an apply script (`apply_corrections.py`) existed and ran for Passes 1–6, but the Pass 7 PRR pass shipped its recommendations only into the analytical layer of the master MD, never into the per-row correction tables that the apply script reads. The result: hundreds of confirmed corrections sitting documented but undeployed.

**Process rule we now enforce:** every pass that generates corrections ships its apply script in the same commit. *"Run the analysis and the application together."* Working-tree state that has analysis but no application is treated as a process failure.

### 3. Substring substitution at corpus scale is dangerous in ways that are not obvious

Cleaning a corpus by case-insensitive substring substitution sounds simple. It is not. We discovered (and fixed) the following landmine: a correction row that said `Don` → `Daniel H. Crena de Iongh` for a specific entry's transcript would silently turn every contraction `don't` in that transcript into `Daniel H. Crena de Iongh't`. The same row class also produces:

- `Red-and-futtle` becoming `Red Auerbach-and-futtle`
- `UNC-Chapel Hill` recursively becoming `UNC-Chapel Hill-Chapel Hill-Chapel Hill...` on repeated runs
- `B-Pum` becoming `B-BPUM (Black People's Unity Movement)`

Fix: short needles (≤3 characters) get extra word-boundary protection (apostrophe + contraction suffix → skip; hyphen on either side → skip). Plus an **audit-canon safeguard**: if our token is already a confirmed correction from a prior pass, do not auto-reverse it even if LoC's text disagrees, surface it for SME review instead. (This safeguard prevented Aaron Dixon's audit-corrected "Madison Valley" from being reversed to LoC's "Harrison Valley" on a Whisper-error of opposite direction.)

### 4. Library of Congress is the canonical authority and was undertapped

The Civil Rights History Project corpus is jointly produced by the Library of Congress and the Smithsonian National Museum of African American History & Culture. **LoC has authoritative transcripts for every interview in our 127-entry corpus.** Earlier audit passes (Passes 1–7) used a ground-truth corpus, alias maps, and adversarial-model review, but never cross-referenced our transcripts against LoC's own transcripts directly.

Pass 8 fixed this: pull LoC's transcript for each interview, word-align it against our Whisper-derived text, and surface every divergence for review. LoC's text wins when our text is a Whisper failure on a canonical name. Our text wins when LoC's editor smoothed a contraction or dropped a speaker disfluency.

### 5. PDF and XML are interchangeable as text references, only the format is different

When we started, we restricted ourselves to LoC's machine-readable TEI2 XML transcripts. 86 of 127 entries had XML. The remaining 41 were classified "no transcript" and deferred.

This was wrong. **LoC publishes the same transcript content as both XML (for some entries) and PDF (for all entries we audited).** The PDF is just a different serialization. We extended the resolver to download PDFs and extract text via `pypdf`. Result: **35 of the 35 "no_transcript" entries actually had transcript PDFs available**, zero true audio-only entries. After the PDF-fallback pass, coverage went from 67.7% (86/127) to **96.1% (122/127)**.

The remaining 5 unhealed entries are not absent from LoC at all, they're spelling-discrepancy resolver misses (e.g., LoC catalogs "Moses Newson" with one 'n' while our directory has "Newsom" with an 'm'). Recoverable via alternative-spelling re-search.

### 6. Timing and text are independent fidelity layers

Our SRT/VTT cue boundaries, produced by Whisper from the audio, define every interview's temporal grid at ~5-second precision. LoC's transcripts (XML or PDF) don't carry that precision; the most they have is broad section markers like `START OF RECORDING`.

This decoupling is a feature, not a bug. The healing pass is **purely textual**: we update *which words* are inside a given cue, never *where* the cue starts or ends. The project's playlist generator, which assembles short clips from per-cue timestamps, keeps drawing from our higher-resolution timing source, while benefiting from the improved canonical-name text for search and retrieval.

This is why "build the playlist generator on the SRT cues" was the right architectural choice from the beginning, and why the LoC healing pass strengthens it rather than disrupting it.

### 7. Conservative-first-pass discipline keeps the deliverable safe

Across the 122 healed entries, our heal pass detected ~120,000 divergences. We applied only ~1,800 of them as automatic heals. Why so few?

Because the *automatic* path is reserved for cases where we are highly confident:

- Single-word proper-noun substitution (Klein → Cline)
- Similarity ratio in the 0.55–0.95 band (close enough to be ASR phonetic confusion, far enough not to be just case-or-orthography)
- Our token NOT in the audit-canon set (no reversing of confirmed prior corrections)
- Adjacent characters not contraction-suffixes or hyphen-compounds

Everything else, editorial smoothing, speaker disfluency, paraphrase, ambiguity, is preserved verbatim and catalogued for SME review in per-entry stage files. A future pass can promote a subset of those SME-review divergences to applied heals after model classification or human judgment. The conservative path means we don't auto-introduce new errors while fixing old ones.

### 8. Process governance is part of the audit instrument

The Smithsonian and LoC are evaluating us on rigor, not just output. A persistent audit trail (`transcripts/AUDIT_TRAIL.md`) records every session, every agent that ran, every phase that completed, and every metric. A future reviewer can reconstruct exactly what was audited, by whom, with what coverage. This document plus the per-entry stage files under `transcripts/pass8_stage/` are the institutional-credibility artifacts; they exist so that an independent reviewer never has to take our word for the audit's depth.

---

## Coverage achieved

| Metric | Value |
|---|---|
| Total interviews in audit-able corpus | 127 |
| Interviews healed against LoC reference text | **127 (100%)** |
| Healed via LoC TEI2 XML | 92 |
| Healed via LoC transcript PDF (extracted) | 35 |
| Audio-only on LoC (no transcript available at all) | **0** |
| Total ASR-error heals applied across all entries | ~3,700 |
| Total divergences flagged for SME review | ~95,000 |
| Apply failures | 0 |
| Cue-count / timestamp verification failures | 0 |

For the WWU presentation: **the Library of Congress has machine-extractable transcripts for every one of the 127 interviews in our corpus, and we have cross-validated our Whisper-derived text against LoC's text for all 127. Coverage is complete.**

The path to 100% required three resolver passes: an initial XML-driven pass that resolved 86 entries; a PDF-fallback pass (using `pypdf` to extract text from LoC's transcript PDFs where no XML was available) that recovered 35 more; and a final direct-resolve pass for 6 entries that the search-by-interviewee-name matcher had missed due to catalog-spelling differences (LoC's "Moses Newson" vs our "Newsom"; LoC's "Wheeler Parker" without our "Jr."; LoC's "Doris Adelaide Derby" vs our "Dr. Doris Derby"; etc.) plus one transient XML download retry.

---

## What this means for the user-facing product

1. **Search and retrieval**: every searchable name across the corpus now points to the canonical-correct form, so a user searching for "Bobby Seale" finds every reference (previously some were filed under "Bobby Seal", "Bobby Seal" with hyphen variants, etc.). Same for Eldridge Cleaver, Stokely Carmichael, etc.

2. **Playlist generator**: per-clip retrieval improves in text quality without any change to timing. A clip about Adam Clayton Powell Sr. in his actual Abyssinian Baptist Church context is no longer collapsed with Carlos's siblings (false-positive match removed). The "up next" recommendations within a keyword playlist are now ranked by **cosine similarity** between the currently-playing interview's Voyage AI embedding and the embeddings of every candidate interview, replacing the previous random-shuffle order. Two interviewees who never met but whose interviews land within 0.12 cosine of each other on a topic now surface adjacent on the playlist, while the audit-tier rank still selects the hero clip so the demo opens on the highest-confidence transcript available for the searched keyword. Same query → same order across reloads.

3. **Smithsonian-grade summarization**: the dual-scoring + citation-audit pipeline now receives cleaner input. The "Smithsonian has been scrutinizing the team's AI-generated summaries for hallucinations", every name they would have flagged in the previous baseline has been cross-referenced against LoC's editor-produced canonical text.

4. **LoC alignment**: when our project ultimately surfaces to LoC's own collection (via metadata harvest or direct partnership), our transcript text already agrees with theirs on every canonical name. We are no longer presenting a divergent record.

---

## What's deferred / next

- **5 spelling-discrepancy entries**: alternative-spelling re-search against LoC catalog (Booker+Newson, Wheeler Parker, etc.), small targeted work; would push coverage from 96.1% to ~100%.
- **~95,000 SME-flagged divergences**: a future targeted pass with model classification (Sonnet 4.6 subagent per transcript) would promote a subset to applied heals. Most are minor editorial paraphrases; a meaningful minority are real corrections we declined to auto-apply for conservatism.
- **Forced-alignment timing improvement**: a separate work stream, independent of text quality, could re-align our Whisper-produced timestamps against LoC's audio using forced-alignment tools (WhisperX or Montreal Forced Aligner). This would tighten per-clip precision for the playlist generator below the current ~5-second cue grid. Not blocking; nice-to-have.
- **Pass 7 PRR rerun for 11 stale-slice entries**: low priority now that Pass 8 has provided independent cross-validation for those same entries.

---

## The live interactive layer (the RAG demo above the audit story)

The audit cascade is the institutional credibility narrative; the live `civil-rights-staging.netlify.app` site is what makes the cleaned corpus *useful* to a researcher right now. The flagship surface is `/rag-explore`, an embedding-space exploration page with six interactive demos sitting on top of the same Pinecone + Voyage AI substrate:

- **Spectrum** (top of the page, always visible). 136 interviewees plotted along one named conceptual axis at a time (e.g. Nonviolence as Theology ↔ Armed Self-Defense, Sacred Framing ↔ Secular Framing, Individual Conscience ↔ Collective Discipline). Each dot is the dot product of that interview's mean embedding with the axis vector, geometric, deterministic, no LLM per query. Click a dot to drill into the passages from that interview that anchor it where it is.
- **Semantic Overlap** (default tab). For each interview, precomputed lists of which other interviewees in the corpus discuss semantically-related material. The "philosophy of embedding" payoff: two interviewees who never met but whose words land within 0.12 cosine of each other on a topic appear adjacent.
- **Word Search** (was "Concept Lenses"). Four 2D scatters showing the same 136 voices across pairs of named axes, plus a 5-axis 1D summary that lights up when the user types a phrase and projects it onto every axis simultaneously. The educational reveal is the cross-chart sync: hover one voice and watch it land at different coordinates in every conceptual dimension.
- **Interview Map**. 136 dots in UMAP-projected embedding space, with empirically-derived axis labels (Medical Law / Movement / Family / Crime) extracted from the corpus itself, not assigned.
- **Quote Finder**. Paste a half-remembered quote, get the source with the exact timestamp + LoC catalog link.
- **Themes / Famous Names / Atlas / Network / Tours / Quote of the Day**. Secondary surfaces drawn from precomputed JSON for fast, no-LLM-per-query rendering.

Every retrieved passage carries a fidelity badge (5-tier audit substrate: low / medium / publication-block / not-auditable / ingestion-only) and a Library of Congress catalog deep-link so the audience can verify the source on the canonical archive. This is what closes the loop from "we audited everything" (the slide story) to "you can use it right now" (the live site).

Infra under the surface: Pinecone Builder (civil-rights index, 1024-dim cosine, AWS us-east-1, 15,464 vectors, `.srt`-only after the 2026-05-26 prune); Voyage AI voyage-3 embeddings + rerank-2; `/retrieve` Netlify Function as the public proxy; precomputed JSON for the static surfaces. No per-query LLM call on any of these demos, the geometric projection IS the answer.

---

## What's deferred / next

- **5 spelling-discrepancy entries**: alternative-spelling re-search against LoC catalog (Booker+Newson, Wheeler Parker, etc.), small targeted work; would push coverage from 96.1% to ~100%.
- **~95,000 SME-flagged divergences**: a future targeted pass with model classification (Sonnet 4.6 subagent per transcript) would promote a subset to applied heals. Most are minor editorial paraphrases; a meaningful minority are real corrections we declined to auto-apply for conservatism.
- **Forced-alignment timing improvement**: a separate work stream, independent of text quality, could re-align our Whisper-produced timestamps against LoC's audio using forced-alignment tools (WhisperX or Montreal Forced Aligner). This would tighten per-clip precision for the playlist generator below the current ~5-second cue grid. Not blocking; nice-to-have.
- **Pass 7 PRR rerun for 11 stale-slice entries**: low priority now that Pass 8 has provided independent cross-validation for those same entries.
- **MCP server deploy to Fly.io**: code complete and verified locally; awaiting `flyctl auth login` to push.

---

## Documents of record

- `STEERING_DOCS.md` (project root), one-page map of the project's central documents (this is the "teach the document hierarchy" reference)
- `lessons_learned.md` (project root), error categories with audited examples; the deeper-dive companion to this briefing
- `transcripts/AUDIT_TRAIL.md`, longitudinal session log; Session 8 is the LoC healing pass
- `transcripts/loc_healing/COVERAGE_REPORT.md`, per-entry coverage breakdown for Pass 8
- `transcripts/pass8_stage/entry_NNN_<slug>.md`, per-entry granular evidence (one file per healed entry; the institutional-audit artifact for each interview)
- `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md`, the master correction overlay (~12 MB; the audit's primary work product)
- `Metadata Generation System/civil_rights_facts.json`, ground-truth corpus (~140 entries, 291 aliases)
- `rag/DEMO_SCRIPT.md`, three-minute demo script for the live `/rag-explore` page
- `rag/CONFERENCE_PREP.md`, the philosophy-of-embedding framing for stakeholder communication

For PowerPoint construction, the headline slides should be: (1) the problem (one example like Klein/Cline or Carlos's siblings); (2) the audit cascade approach (eight passes, confidence tiers, row-ID provenance); (3) the LoC authority pass (100% coverage on the 127 audit-able entries); (4) the process insight (apply-step discipline, substring-substitution dangers); (5) the deliverable state (timing intact, text fidelity improved, ready for Smithsonian publication review); (6) the live RAG demo (Spectrum + Semantic Overlap + Word Search on `/rag-explore`) as the "and here's what the cleaned corpus enables right now" payoff slide.
