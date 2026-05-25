# Analysis of Dustin's new transcript batch — 2026-05-25

**Location of batch:** `C:\TRANSCRIPTS\` (root of C: drive, all-caps directory name)
**File count:** 104 `.txt` files
**Source:** Almost certainly LoC's published transcript text (downloaded plain-text edition or text-extracted from PDFs and cleaned). Format: editor-cleaned prose with ALL-CAPS / initials speaker labels, em-dashes, curly quotes. NOT Whisper output.

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

These interviewees are already in `corrected/` with the Pass 1-8 audit overlay applied. The batch text is LoC's clean-edited reference text for the SAME interview, in a form we don't currently have:

- We have Whisper-derived `corrected/<entry>/*.srt|txt|vtt` (with audit corrections applied)
- We've pulled LoC's XML (or pypdf-extracted PDF text) into `transcripts/loc_healing/loc_cache/`
- The batch text is a THIRD form: clean plain-text LoC transcript

**Comparison to existing references:**

- Our Whisper raw + audit corrections: differs substantively (different transcription source)
- Our pypdf-extracted LoC PDF text: differs in encoding (smart-quote artifacts in pypdf output, em-dashes preserved as `—` in batch). The batch is CLEANER.
- Our LoC XML extract: closer match but still some divergence in wording (the batch may be a different LoC edition or a re-edited form)

**Possible uses:**

1. **Re-heal Pass 8 against the batch text** instead of our pypdf-extracted PDF text — the batch is cleaner, so the divergence detection would produce fewer encoding-artifact false-positives and possibly catch more real ASR errors.
2. **Cross-validation source** — for each existing entry, compare three forms (audited corrected/, LoC XML, batch text) to surface high-confidence canonical text.
3. **Replace `loc_cache/<subject>.pdf.txt` with `loc_cache/<subject>.batch.txt`** for the entries where the batch text is materially cleaner than what pypdf gave us.

### Sanity check: file is LoC's edition vs student's own transcription

Sample wording comparison for Aaron Dixon:

| Source | Opening question (Pass-1-corrected raw → cue 4 area) |
|---|---|
| Our Whisper SRT (raw) | "where and how they may have been put together" |
| Our LoC XML extract | "where and how they may have been put together" |
| Batch text | "where, and how they may have influenced you as you grew up" |

The batch differs from BOTH our raw and our XML extract on the same passage. This suggests the batch is either (a) a different LoC edition published after we pulled the XML, OR (b) a re-edited form (possibly by the student). Eric should confirm the source with Dustin to determine whether the batch is canonical-LoC or canonical-student.

## Recommended next steps

### Quick wins (one short session each)

1. **Ingest the 6 Category-A genuinely-new interviews** — these directly extend the corpus.
   - If audio is available: re-run Whisper to get the SRT, then `transcripts/ingestion/ingest_new_transcript.py`.
   - If not: write the text-only adapter described in `transcripts/ingestion/README.md` and ingest via that path.

2. **Ingest the 3 Category-B SKIPPED/DEFERRED entries** — these have audit overlay records but no raw/. The batch text gives us their transcript content; we can add them to corrected/ with synthesized timestamps and a `loc_healing` section.

### Medium-term (one focused session)

3. **Decide on batch-as-canonical-LoC for Category C** — compare a sample of 10 entries' batch text against LoC XML to confirm whether the batch is a cleaner edition we should adopt. If yes, re-heal Pass 8 against the batch text for those 95 entries; the heal counts should change slightly (fewer encoding-artifact false-positives in the SME-review bucket).

4. **Sanity-check the source with Dustin** — confirm where the student got the .txt files. If they're LoC published text, treat them as canonical. If they're the student's own re-transcription, treat them as a fourth reference layer alongside our raw / XML / PDF references.

### Long-term (separate work stream)

5. **For Categories A and B**, consider asking Dustin if audio files are available so we can re-run Whisper and integrate them into the full Pass 8 LoC-healing path rather than relying on synthesized timestamps.

## Files

The 104 files are at `C:\TRANSCRIPTS\<filename>.txt` with the naming convention:

```
<Subject> oral history interview conducted by <Interviewer> in <Location>, <Year> <Month> <Day>.txt
```

The encoding marker `utf_8` appears at the top of each file. Speaker labels are mostly initials (`DC:`, `AD:`) with occasional ALL-CAPS for first-mention.

## Open questions for Eric to ask Dustin

1. Where did the student source these `.txt` files? (LoC website / LoC PDFs / their own transcription / a combination)
2. Are audio files available for the Category A and B interviews?
3. Is the student planning to send more interviews beyond these 104?
4. Should Pass 8 be re-run against the batch text for Category C entries?
