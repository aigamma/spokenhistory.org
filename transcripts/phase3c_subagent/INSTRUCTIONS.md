# Phase 3c — Single-Transcript Pipeline Instructions (Subagent Task)

You are a Claude subagent processing exactly ONE Civil Rights History Project oral history interview transcript end-to-end. Read these instructions in full **before** reading the transcript.

This is the Smithsonian / Library of Congress publication-readiness gate. Your output is the canonical record that the WWU team will surface to reviewers. The civil rights project has been scrutinized for AI hallucinations; the quality bar is **publication-grade**, not research-demo.

---

## CROSS-CONTAMINATION FIREWALL (hard rule)

A prior session that read multiple transcripts in a single agent context caused **catastrophic cross-contamination** — facts, names, and biographical details bled across entries inside the agent's working memory, producing inverted attributions and hallucinated cross-references. The Pass 4 / Pass 6 / Pass 7 audit cascades were architected specifically to prevent this recurrence.

**You may read EXACTLY these files:**
1. The transcript .srt file at the path given in your task message
2. `D:\civil\transcripts\phase3c_subagent\INSTRUCTIONS.md` (this file)
3. `D:\civil\Metadata Generation System\StandardizedRubric_1.md` (scoring rubric)
4. `D:\civil\Metadata Generation System\processor_prompts\engagement_schema.txt` (engagement output shape)
5. `D:\civil\Metadata Generation System\processor_prompts\engagement_rubric.txt` (engagement scoring criteria)
6. `D:\civil\Metadata Generation System\processor_prompts\engagement_system.txt` (engagement system prompt)
7. `D:\civil\Metadata Generation System\civil_rights_facts.json` (ground-truth corpus, 378 entries)

**You may NEVER read:**
- Any other transcript file under `D:\civil\transcripts\raw\` or `D:\civil\transcripts\corrected\`
- `D:\civil\transcripts\CLEANED_TRANSCRIPTS_REVIEW.md` (master audit overlay)
- Any other `transcripts/pass*_stage/` file (per-entry audit slices for other entries)
- Any other `Metadata Generation System/batch_output/*.json` file (sibling subagents' outputs)

Violating the firewall invalidates your output and contaminates the corpus.

---

## Pipeline steps (all within your single context window)

### Step 1: Read your transcript

Your task message names the exact .srt file path. Read it once, fully. SRT format is: sequence number, timestamp range (`HH:MM:SS,mmm --> HH:MM:SS,mmm`), text, blank line. This is your only source of truth about what the interviewee said.

Note: many transcripts have been auto-corrected via the Pass 7 audit (entries that fall under `transcripts/corrected/`). Speaker labels are not always present; infer interviewer vs interviewee from context (interviewers ask questions, interviewees give long narrative answers).

### Step 2: Extract interview metadata

From the transcript text (usually within the first 3-5 minutes), extract:
- `interviewee_name`: the person whose oral history this is (in the filename / first segments)
- `interviewee_title`: their primary identity (e.g., "Civil Rights Activist", "SNCC Field Organizer", "SCLC Board Member")
- `interview_date`: when the interview took place (YYYY-MM-DD if known; "unknown" if not)
- `interview_location`: where it was conducted
- `interviewer_name`: who is asking the questions (often "Joseph Mosnier")
- `interviewer_affiliation`: usually "Library of Congress" or similar
- `collection`: "Civil Rights History Project" (standard for this corpus)
- `duration_formatted`: last SRT timestamp's end time as HH:MM:SS

### Step 3: Identify chapter structure

Read through the transcript and detect topical transitions. A new chapter begins when the conversation shifts substantively to a new topic, era, organization, theme, or biographical phase. Aim for **6–15 chapters per transcript** depending on length (longer transcripts get more chapters).

For each chapter, capture:
- `chapter_number` (1-indexed, sequential)
- `start_time` (first segment of the chapter, "HH:MM:SS,mmm" format)
- `end_time` (last segment of the chapter)
- approximate word count

### Step 4: Generate per-chapter content

For each chapter, produce:
- `title`: short descriptive title (5-10 words, e.g., "Childhood in Birmingham, Alabama" or "Founding of SNCC at Shaw University")
- `summary`: 1-3 paragraphs covering what the interviewee said in this chapter. Use third person ("Avery describes..." not "I describe..."). Quote exact phrases sparingly with quotation marks when emphasis matters. **Faithful to the transcript — no embellishment, no inferred details, no historical context that isn't established by the transcript text itself.**
- `main_topic_category`: ONE of these standard categories: `Childhood & Family Background`, `Education`, `Voting & Legal Rights`, `Direct Action & Demonstrations`, `Organizations & Movement Networks`, `Historical Figures & Turning Points`, `Violence, Intimidation & State Repression`, `Integration, Education & Everyday Segregation`, `Religion & Faith`, `Music & Culture`, `Personal Reflections & Legacy`, `Later Career & Continued Activism`. Pick the dominant category.
- `keywords`: 5–10 lowercase keyword strings (names, organizations, events, places)
- `related_events`: 3–7 named events/organizations/people referenced in this chapter (proper nouns from civil rights history, e.g., "Freedom Rides", "March on Washington", "Martin Luther King Jr.", "SCLC", "Birmingham Children's Crusade")
- `quality_metrics`: per-chapter score against the scoring rubric (Step 6 below produces this)

### Step 5: Generate main summary

A coherent main summary covering the full interview. Schema:
- `summary`: 2–4 paragraphs synthesizing the interview as a whole. Third person. Faithful to the transcript only.
- `key_themes`: 4–7 string list of cross-cutting themes (e.g., "Racial Violence", "Sisterhood and Mutual Aid", "Voter Registration", "Religious Foundation of Activism")
- `historical_significance`: 2–3 sentence paragraph explaining what this interview contributes to the historical record (which movements, eras, gaps in scholarship)
- `quality_metrics`: computed in Step 6

### Step 6: Self-score (main summary + each chapter)

Read `D:\civil\Metadata Generation System\StandardizedRubric_1.md` for the scoring rubric. Apply it to the main summary and each chapter.

Output `quality_metrics` per summary with:
- `accuracy_score`: 0–100
- `quality_score`: 0–100
- `accuracy_component_a`: 0–40 (factual accuracy)
- `accuracy_component_b`: 0–30 (faithful representation)
- `accuracy_component_c`: 0–30 (no hallucinations / inventions)
- `quality_component_a`: 0–40 (comprehensiveness)
- `quality_component_b`: 0–20 (organization)
- `quality_component_c`: 0–20 (clarity)
- `quality_component_d`: 0–20 (depth of analysis)
- `errors`: list of strings describing specific factual errors / unsupported claims (empty list if none)
- `improvements`: list of strings describing specific revision suggestions

**Be strict.** Smithsonian's threshold is 90/90. Score honestly — a low score routes to human review, which is the correct outcome for a borderline summary. A summary with even one unsupported claim should score below 90 on accuracy. The Phase 7 PRR audit caught 30+ high-damage facts that earlier passes scored as "ok" — those false-clean scores caused this whole publication-readiness initiative. Don't repeat the mistake.

### Step 7: Engagement scoring (full rubric)

Read these three files:
- `D:\civil\Metadata Generation System\processor_prompts\engagement_system.txt` (system prompt)
- `D:\civil\Metadata Generation System\processor_prompts\engagement_rubric.txt` (criteria)
- `D:\civil\Metadata Generation System\processor_prompts\engagement_schema.txt` (output JSON shape)

Produce `engagement_scores` matching the schema in `engagement_schema.txt` **exactly**. This is a detailed 100-point rubric across four dimensions: narrative quality (30), historical value (25), accessibility (20), educational impact (25). For each sub-dimension, provide evidence quotes from the transcript with segment numbers and timestamps. Skip no fields — the schema is the contract.

### Step 8: Citation audit (per claim)

For **every factual claim** in your main_summary (every named person, date, organization, event, place, attribution, quoted statement), find the supporting transcript passage. Output `citation_audit`:

```json
{
  "claims": [
    {
      "claim": "exact text of the factual claim from the summary",
      "status": "supported" | "partially_supported" | "unsupported",
      "supporting_excerpt": "the transcript passage that establishes the claim, or 'none found' for unsupported",
      "rationale": "1-2 sentence explanation"
    }
    // ... one entry per claim
  ],
  "summary_stats": {
    "total_claims": integer,
    "supported": integer,
    "partially_supported": integer,
    "unsupported": integer
  }
}
```

Status rules:
- `supported`: transcript directly establishes the claim (dates, names, attributions, emphasis all match)
- `partially_supported`: transcript has some basis but the summary extends beyond it — paraphrase changes emphasis, a date the speaker mentioned in passing the summary frames as central, a relationship the speaker named loosely the summary describes specifically
- `unsupported`: no transcript passage establishes the claim; appears invented or imported from outside

Transcription errors are expected: if the summary uses a real historical name (e.g., "Medgar Evers") and the transcript has a garbled version (e.g., "Megahevers"), treat as a match and mark supported. But if the summary uses a real name and the transcript clearly contains a *different* real name, mark unsupported.

Be conservative. When in doubt, partially_supported.

### Step 9: Cross-reference against ground-truth facts (optional but recommended)

Read `D:\civil\Metadata Generation System\civil_rights_facts.json` (378-entry ground-truth corpus). For any named person, event, or organization in your main_summary or chapters, verify the canonical spelling and relationship facts against this corpus. If your output names an entity that the corpus knows about under a different canonical form, use the corpus form. If your output claims a relationship that contradicts the corpus, **demote the claim's citation_audit status to `unsupported`** and add an entry to `quality_metrics.errors` like "Contradicts civil_rights_facts.json: <entity> — <details>".

### Step 10: Publication decision

Combine `quality_metrics` + `citation_audit`:
- `publishable` = true iff (main_summary.quality_metrics.accuracy_score >= 90 AND quality_score >= 90 AND citation_audit.summary_stats.unsupported == 0 AND citation_audit.summary_stats.partially_supported == 0)
- `human_review_required` = NOT publishable
- `decision_path`: descriptive string. Examples: `"scores_passed_citation_passed"`, `"scores_blocked_accuracy_below_90"`, `"citation_blocked_2_unsupported"`, `"scores_passed_citation_blocked_3_partial"`
- `rationale`: one paragraph plain English

The fail-closed gate is the **point** of this whole architecture. Don't fudge scores to push transcripts into publishable. The review queue is the correct destination for anything borderline.

### Step 11: Write JSON output

Write the complete JSON to the OUTPUT_PATH given in your task message. Schema:

```json
{
  "interview_name": "<extracted, e.g. 'Annie Pearl Avery'>",
  "youtube_video_id": null,
  "transcript_source": "<your assigned .srt path>",
  "processed_at": "<ISO 8601 timestamp, UTC>",
  "pipeline_version": "phase3c-subagent-claude-1",
  "interview_metadata": {
    "interviewee_name": "...",
    "interviewee_title": "...",
    "interview_date": "...",
    "interview_location": "...",
    "interviewer_name": "...",
    "interviewer_affiliation": "...",
    "collection": "Civil Rights History Project",
    "duration_formatted": "HH:MM:SS"
  },
  "main_summary": {
    "summary": "...",
    "key_themes": ["..."],
    "historical_significance": "...",
    "quality_metrics": { /* per Step 6 */ }
  },
  "chapters": [
    {
      "chapter_number": 1,
      "start_time": "HH:MM:SS,mmm",
      "end_time": "HH:MM:SS,mmm",
      "title": "...",
      "summary": "...",
      "main_topic_category": "...",
      "keywords": ["..."],
      "related_events": ["..."],
      "quality_metrics": { /* per Step 6 */ }
    }
  ],
  "engagement_scores": { /* full schema from engagement_schema.txt */ },
  "citation_audit": { /* per Step 8 */ },
  "publication_decision": { /* per Step 10 */ }
}
```

Use Write tool to put it at the OUTPUT_PATH. **The JSON must be valid** — escape strings properly, no trailing commas, no comments. If the content is large, you may use multiple Write/Edit calls to build it up.

### Step 12: Return short status (NOT the JSON itself)

After writing the JSON, return a SHORT status message (one paragraph, ~150 words, no JSON in the message body). Include:
- Interview name
- Number of chapters generated
- Main summary length (chars)
- Quality scores (accuracy + quality)
- Citation audit counts (total / supported / partial / unsupported)
- Publication decision (publishable yes/no, decision_path)
- Output file path
- Any anomalies you encountered (unusual transcript content, missing metadata, ambiguous chapter boundaries)

**Do NOT** include the JSON content in your return message. The JSON lives in the file you wrote. Your return message is just a status line for the parent's manifest.

---

## Quality bar reminder

The Phase 7 Publication Readiness Review caught 30+ high-damage publication blockers in earlier passes. Examples:
- Greyhound vs Trailways bus reversal on Anniston Freedom Rides (entry 9)
- Paul Hoffman + Paul Robeson merged into "Paul Hoffman Robeson" by ASR bleed (entry 62)
- Ruby Sales meaning-inversion ("I was in dead" misread as activist's actual statement) (entry 112)
- Sammy Davis Jr. claimed as pallbearer for someone he didn't attend (entry 125)
- Briggs claimed as co-counsel when he was a spectator (entry 87)

Your job is to NOT produce summaries with this class of error. When the transcript mentions a name or fact, check it against `civil_rights_facts.json`. When you can't find a supporting passage for a summary claim, mark it unsupported. When in doubt about a date or relationship, partially_supported.

The fail-closed publication gate exists because earlier "best of 3" scoring would let hallucinations through. Your scores must be honest. A score of 75 with detailed error notes is more useful than a score of 90 that papers over real problems.

---

## Output format final notes

- All timestamps in `HH:MM:SS,mmm` format (comma not period, matching SRT convention)
- All times in the file's local interview timezone (i.e., don't convert)
- JSON strings escape quotes with `\"`, newlines with `\n`
- Lists may be empty `[]` but never null
- Numeric scores are integers
- If you cannot complete a section, write the JSON anyway with explicit null for the failed field and explain in the status return
