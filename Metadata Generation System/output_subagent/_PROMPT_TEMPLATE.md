# Pipeline subagent prompt template

This template is the schema + constraints + chapter-design instructions shared by all 136 Claude-subagent invocations that generate Firestore-shaped pipeline-output JSON. Each individual subagent's inline prompt names ONE entry (number + subject + paths) and points here for the rules.

## Read your assignment, then this template, then begin

You are generating Smithsonian-grade Firestore metadata for ONE Civil Rights History Project oral history interview. Your output will be pushed to Firestore and consumed by InterviewPlayer, ContentDirectory, and other React components.

## CRITICAL: per-entry isolation

Read EXACTLY the two files named in your inline assignment (one manifest, one .srt). Do NOT read any other transcript, slice, master document, capsule, or output JSON. Cross-contamination has been catastrophic in past sessions of this project. You are working on ONE entry only.

If the SRT is large, use Read with limit=2000 multiple times (offset 0, then 2000, then 4000, etc.). Cover the entire transcript at least once before producing chapters.

## Output schema

Write your output to `Metadata Generation System/output_subagent/entry_<N>.json` where `<N>` is your assigned entry number (no padding — `entry_1.json`, `entry_125.json`):

```json
{
  "interview_name": "<as in manifest entry_subject>",
  "entry_number": <integer>,
  "loc_item_url": "<from manifest.loc_healing.loc_item_url>",
  "inferential_uncertainty_tier": "<from manifest.inferential_uncertainty.confidence_tier>",
  "inferential_uncertainty_score": <from manifest.inferential_uncertainty.score>,
  "entry_provenance": "<from manifest.entry_provenance>",
  "main_summary": {
    "summary": "<150-250 word interview summary. WHO+WHEN+WHERE+WHAT-they-contributed. Museum-curator tone. No decorative adjectives.>",
    "key_themes": ["theme1", "theme2", "theme3", "theme4", "theme5"],
    "historical_significance": "<1-2 paragraphs on what this interview contributes to the historical record — what makes it valuable as a primary source.>",
    "quality_metrics": {
      "accuracy_estimate": <0-10>,
      "completeness_estimate": <0-10>,
      "narrative_coherence": <0-10>
    }
  },
  "chapters": [
    {
      "chapter_number": 1,
      "title": "<2-6 word chapter title>",
      "summary": "<2-4 sentence chapter summary>",
      "main_topic_category": "<exactly one of: Early Life / Family History / Movement Entry / Major Campaign / Personal Reflection / Political Analysis / Music & Culture / Legal Work / Religious Foundations / Education / Post-Movement Career / Geographic Context>",
      "keywords": ["kw1", "kw2", "kw3", "kw4"],
      "related_events": ["specific event 1", "specific event 2"],
      "start_time": "HH:MM:SS,mmm",
      "end_time": "HH:MM:SS,mmm",
      "quality_metrics": {
        "accuracy_estimate": <0-10>,
        "narrative_coherence": <0-10>
      }
    }
  ],
  "engagement_scores": {
    "narrative_quality": <0-10>,
    "emotional_resonance": <0-10>,
    "historical_density": <0-10>
  },
  "youtube_video_id": null,
  "cost_data": {
    "total_cost_usd": 0,
    "source": "claude-subagent",
    "model": "claude-opus-4-7",
    "generated": "2026-05-26"
  }
}
```

## Chapter design

Identify 5-12 natural chapters from topic shifts in the interview. Each chapter is typically 5-15 minutes of audio. Pull `start_time` and `end_time` from actual SRT cues (format `HH:MM:SS,mmm` matching SRT convention). The first chapter starts at the interview's first content cue; the last chapter ends at the final cue. Adjacent chapters should be contiguous (one chapter's end_time = next chapter's start_time, give or take a few cue boundaries).

`main_topic_category` MUST be one of the 12 enumerated values. Choose the closest fit.

## Constraints (Smithsonian-grade)

- **NO decorative adjectives**: "powerful", "moving", "fascinating", "remarkable", "important", "inspiring", "profound", "incredible", "compelling"
- **NO meta-commentary**: "This interview...", "Through her story...", "Listeners learn...", "Audiences will appreciate..."
- **Grounded ONLY in the actual interview content.** No inferences not supported by the transcript. No biographical claims drawn from outside knowledge.
- **Cite specific organizations** (SCLC, SNCC, CORE, NAACP, MFDP, BPP, etc.) when the speaker discusses membership or interaction
- **Cite specific events** (Selma march, Birmingham campaign, Mississippi Freedom Summer, March on Washington, Bloody Sunday, etc.) when central
- **Quality metrics**: estimate honestly. Typical range 6-9. Use 10 only for exceptional content (very dense, coherent, audit-tier high/medium with no degradation). Use 5 or below only for genuinely degraded content (visible Whisper errors, very thin content, ingestion-only entries with limited audit history).
- **Audit-tier-aware**: if manifest says tier=`publication-block` or `not-auditable`, lower quality_metrics accordingly (don't claim 9/10 accuracy on an entry with documented publication-blocker issues).
- Museum-curator tone: terse, specific, citation-grade.

## After writing your file

Return a SHORT confirmation (under 80 words):
- Chapters generated (count)
- Summary word count
- Audit tier from manifest
- Any concerns (thin content, degraded transcript sections, mid-sentence truncations, etc.)
