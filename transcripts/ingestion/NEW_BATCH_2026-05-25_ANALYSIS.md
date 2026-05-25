# Analysis of Dustin's new transcript batch — 2026-05-25

**Location of batch:** `C:\TRANSCRIPTS\` (root of C: drive, all-caps directory name)
**File count:** 104 `.txt` files
**Source:** Whisper AI transcription from YouTube uploads of the interviews — same source family as our existing 131 raw/ Whisper transcripts, just a separate ASR pass. The clean appearance (initials speaker labels like `DC:`/`AD:`, em-dashes, curly quotes) likely comes from a different Whisper variant or post-processor (Whisper large-v3 + WhisperX speaker-diarization is a plausible toolchain) rather than from human editing of the transcript text.

**IMPORTANT CORRECTION:** I initially mis-read these as LoC's editor-cleaned reference text based on the LoC-catalog-style filenames + the editorial-feeling formatting. Eric clarified they are Whisper-from-YouTube output. The implications for how to use them shift accordingly — see "Differential diagnostics" below.

## Structural classification

The 104 files break down by relationship to the existing corpus:

### Category A — Genuinely new interviews (6)

These interviewees are NOT in `transcripts/raw/` AND not in `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` as entry headings. The batch is the FIRST data we have for these interviews:

| Subject | Likely LoC item context |
|---|---|
| Alfred Moldovan | New York interview, 2011-07-19; conducted by Joseph Mosnier |
| C. T. Vivian | Atlanta, 2011-03-29; conducted by Taylor Branch — canonical SCLC inner-circle figure |
| David Mercer Ackerman and Satoko Ito Ackerman | Washington D.C., 2011-09-20; conducted by Joseph Mosnier (joint interview) |
| Gertrude Newsome Jackson | (date/conductor in filename) |
| Myrtle Gonza Glascoe | (date/conductor in filename) |
| Simeon Wright | (Emmett Till's cousin; date/conductor in filename) |

**Ingestion path:** These need either (a) audio + a Whisper SRT re-generation, OR (b) text-only ingestion with synthesized timestamps (per `transcripts/ingestion/README.md` adapter section). Option (a) is preferable for playlist-generator precision; option (b) is acceptable if audio isn't available.

### Category B — Matches existing SKIPPED or DEFERRED entries (3)

These interviewees ARE in the master MD as entry headings but were never fully audited (the original pipeline marked them SKIPPED or DEFERRED, usually because of 3+-speaker multi-subject pipeline failure):

| Subject | Existing entry | Reason for original skip |
|---|---|---|
| Abernathy family (Donzaleigh, Juandalynn, and Ralph III) | #28 — DEFERRED | Multi-subject joint interview |
| Geraldine Crawford Bennett, Toni Breaux, and Willie Elliot Jenkins | #46 — SKIPPED | 3+-speaker pipeline failure |
| John Dudley, Eleanor Stewart, Charles Jarmon, Frances Suggs, Harold Suggs, and Samuel Dove | #64 — SKIPPED | 6-speaker group; original audit deferred |

**Ingestion path:** The batch text gives us editor-cleaned transcript content for these groups. Same options as Category A. Audit overlay rows for these can be added as fresh `<entry>.P8.X` rows or as a new pass.

### Category C — Matches existing healed entries (95)

These interviewees are already in `corrected/` with the Pass 1-8 audit overlay applied. The batch text is a SEPARATE Whisper-from-YouTube pass on the same interview — a second ASR output, not an authoritative reference.

**Three forms of the same interview now exist for each Category C entry:**

- Our `raw/<entry>/*.srt|txt|vtt` — first Whisper pass (the original ingest the project started with)
- Our `corrected/<entry>/*.srt|txt|vtt` — first Whisper pass with Pass 1-8 audit corrections applied
- The batch text — second Whisper pass (probably different model variant / post-processor)

Compared to the existing references:
- **Vs. our raw/:** different Whisper interpretation of the same audio. Wording diverges in many places; the batch sometimes has more readable prose because of better speaker diarization, but it's still ASR output with its own hallucination risk.
- **Vs. LoC's authoritative transcript:** the batch is NOT authoritative. It's another ASR pass. LoC's published transcript (XML or PDF) remains the canonical source for healing.

### Differential diagnostics — the actual valuable use

The batch's main value is as a **second-opinion ASR pass** for surfacing Whisper uncertainty. Where our raw/ Whisper and the batch's Whisper *agree* on a word, that word is likely reliable. Where they *disagree*, the disagreement is itself a high-signal flag:

- "Both Whisper passes produced the same hallucination" is rare (independent models making the same mistake)
- "The two Whispers produced different renderings of the same audio" usually means at least one is wrong, and an LoC cross-check resolves it definitively

**Practical workflow this enables:**

1. For each Category C entry, align our raw/ Whisper against the batch's Whisper at the word level (same difflib alignment used in Pass 8).
2. Flag the divergences as "ASR-uncertain candidates."
3. For each ASR-uncertain candidate, check against LoC's authoritative text (already cached in `transcripts/loc_healing/loc_cache/`).
4. Where LoC has a third-different rendering: high-confidence ASR error in both Whispers; promote LoC's reading.
5. Where LoC matches one of the two Whisper renderings: high-confidence that the matching Whisper is correct; the other was a hallucination.
6. Where LoC has no transcript for that passage (e.g., a section the editor cut): leave both Whisper readings as candidates for SME review.

This is a more sensitive ASR-error detector than what Pass 8 alone can do, because Pass 8 only catches errors where LoC's text materially diverges from our raw — and Pass 8 misses errors where our raw and LoC happen to share a hallucination class. Two-Whisper-vs-LoC catches an additional layer.

### Sample wording comparison (Aaron Dixon)

| Source | Opening question area |
|---|---|
| Our Whisper SRT (raw) | "where and how they may have been put together" |
| Our LoC XML extract | "where and how they may have been put together" |
| Batch text | "where, and how they may have influenced you as you grew up" |

Three different renderings of the same audio passage. The first two agree (our raw + LoC XML). The batch's wording is distinct — likely a Whisper variant that hallucinated differently. **None of the three is necessarily right without listening to the audio.** This is exactly the kind of case where the differential-diagnostics workflow would surface an SME-review flag.

## Recommended next steps

### Quick wins (one short session each)

1. **Ingest the 6 Category-A genuinely-new interviews + 3 Category-B SKIPPED/DEFERRED entries (9 total).** These extend the corpus to interviews we have NO existing data for.
   - The batch's Whisper output gives us the text content but no SRT/VTT timestamps (the .txt file is plain prose).
   - For full integration with the playlist generator, audio is needed to re-run Whisper with timestamps. Eric should ask Dustin if audio files are available for these 9.
   - If audio isn't available, ingest via the text-only adapter (synthesized cue-level timestamps; coarser playlist precision but still useful for search/retrieval).

### Medium-term (one focused session)

2. **Differential-diagnostics pass against the 95 Category-C entries.** For each:
   - Align our raw/ Whisper against the batch's Whisper at the word level.
   - Surface every disagreement as an "ASR-uncertain candidate."
   - For each candidate, look up the cached LoC XML/PDF reference and adjudicate (LoC wins; both Whispers wrong is high-confidence ASR-bleed; one Whisper matches LoC means the other is wrong).
   - Use the verdicts to enrich the Pass 8 SME-review bucket — promote high-confidence corrections that Pass 8 alone missed.
   - This is bounded model work: probably ~50-200 ASR-uncertain candidates per entry × 95 entries = ~5000-20000 differential candidates to classify. Linear-LoC-API doesn't apply here because we don't hit LoC again (we already cached its text); we just compare locally.

### Long-term (separate work stream)

3. **For Categories A and B**, if audio files are available, prefer re-running Whisper with our existing pipeline (Whisper-large-v3 + WhisperX speaker-diarization + standard SRT/VTT output) to integrate them fully into the corpus rather than relying on the student's prose-only transcripts. The streamlined ingestion pipeline (`transcripts/ingestion/ingest_new_transcript.py`) handles them end-to-end once raw/ files exist in the expected format.

4. **Evaluate whether the student's Whisper-pass is materially better than our raw/.** If WhisperX with speaker diarization caught speaker turns we missed, the student's pass could become a reference for re-doing our raw/ ingest with the better toolchain. This is an architectural question (do we want a corpus-wide re-Whisper?) — not urgent.

## Files

The 104 files are at `C:\TRANSCRIPTS\<filename>.txt` with the naming convention:

```
<Subject> oral history interview conducted by <Interviewer> in <Location>, <Year> <Month> <Day>.txt
```

The encoding marker `utf_8` appears at the top of each file. Speaker labels are mostly initials (`DC:`, `AD:`) with occasional ALL-CAPS for first-mention.

## Open questions for Eric to ask Dustin

1. ~~Where did the student source these `.txt` files?~~ — **Answered: Whisper AI transcription from YouTube uploads, mostly or entirely.** Same source family as our raw/ Whisper output; the student's pass uses a different model variant or post-processor (Whisper large-v3 + WhisperX speaker-diarization is the likely toolchain, based on the `DC:`/`AD:` initials-style speaker labels in the .txt files).
2. **Which Whisper toolchain did the student use?** Confirming this lets us decide whether the student's pass is a better-quality baseline than ours (e.g., if they used Whisper large-v3 while ours used a smaller model). Specifically: model name (whisper-1 / large-v2 / large-v3 / WhisperX), whether VAD was on, whether speaker diarization was applied.
3. **Are audio files (or YouTube URLs) available for the Category A and B 9-entry batch?** If yes, we re-Whisper with our toolchain to integrate them fully into corrected/. If no, the text-only ingestion path applies (synthesized timestamps).
4. **Is the student planning to send more interviews beyond these 104?**
5. **Did the student do any post-processing beyond Whisper?** (e.g., manual speaker labeling, manual typo fixes, manual em-dash insertion). If yes, the text is partially human-curated and may be more reliable than pure-ASR output in places.
