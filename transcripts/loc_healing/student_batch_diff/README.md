# Differential-diagnostics output — student-batch vs our raw/ Whisper

Per-entry word-level divergence dumps produced by
`transcripts/ingestion/differential_diagnostics.py`. For each of the 85
Category-C interviews (entries that exist BOTH in our `transcripts/raw/`
AND in Dustin's student-batch `.txt` files at `C:\TRANSCRIPTS\`), this
directory contains a JSON file capturing every place the two independent
Whisper-from-YouTube passes disagree.

## What's in each `.diff.json`

```jsonc
{
  "subject": "Aaron Dixon",
  "raw_dir": "Aaron Dixon_interview_20250704_170306",
  "raw_srt_path": "transcripts/raw/Aaron Dixon_interview_20250704_170306/...srt",
  "batch_txt_path": "C:/TRANSCRIPTS/Aaron Dixon oral history interview...txt",
  "raw_word_count": 21845,
  "batch_word_count": 20805,
  "divergence_count": 2258,
  "divergences": [
    {
      "op": "replace",
      "raw_tokens": ["David", "Klein"],
      "batch_tokens": ["David", "Cline"],
      "raw_context": "...you are listening to the voice of David Klein for Virginia Tech...",
      "batch_context": "...you are listening to the voice of David Cline for Virginia Tech..."
    },
    ...
  ]
}
```

`op` is one of `"replace"` / `"insert"` / `"delete"` per `difflib.SequenceMatcher.get_opcodes()`.

## Why these are useful

Where two independent Whisper passes **agree** on a token, it's likely
the audio actually said that. Where they **disagree**, at least one of
them is wrong — typically a phonetic ASR confusion that one model
resolved better than the other.

For Pass 8 LoC healing, we already aligned our raw/ Whisper against
LoC's authoritative transcript. But Pass 8 misses cases where our
raw/ Whisper happened to share a hallucination class with LoC (e.g.,
both rendered an unfamiliar name in a similar wrong way). The
student-batch's separate ASR pass surfaces an additional layer of
candidates: anywhere the two Whispers disagree is a high-signal flag
for "this token is ASR-uncertain, look at LoC to resolve."

## Aggregate scale (85 entries, processed 2026-05-25)

- Total divergences detected: ~127,000 across all 85 entries
- Average per entry: ~1500 divergences
- Top-divergence entries: William S. Leventhal (3289), Phil Hutchings (3288),
  Walter Tillow (2233), Aaron Dixon (2258)

The volume is high because the diff includes every word-level
disagreement — punctuation, whitespace, contraction expansion (won't vs
will not), speaker-disfluency handling, etc. — alongside real ASR
errors. A future filtering pass (similar to the conservative-first-pass
discipline in Pass 8 healing) can prune the noise and surface only the
high-signal subset for SME review.

## Suggested SME-review workflow

1. **Filter for proper-noun-class divergences** — short tokens with
   capitalization that aren't sentence-start common words. The
   `looks_like_asr_proper_noun_error` heuristic in
   `transcripts/loc_healing/heal_one_entry.py` is the right starting
   point.
2. **For each surviving candidate, look up LoC's reading.** The LoC XML
   or PDF text is already cached in
   `transcripts/loc_healing/loc_cache/<subject>.{xml,pdf.txt}`.
3. **If LoC matches one Whisper but not the other:** the matching
   Whisper has the canonical reading; the other has the ASR error.
4. **If LoC has a third-distinct rendering:** all three sources
   disagree — high-confidence ASR error in both Whispers; promote
   LoC's reading.
5. **If LoC has no coverage for that passage:** ambiguous, flag for
   manual SME judgment.

These suggested steps are not implemented in this commit — they're the
roadmap for a future targeted-classification pass that would consume
these diff JSONs and produce additional `<entry>.P8.X` row proposals
beyond what Pass 8 already caught.

## Caveats

- **Not auto-healing.** Nothing in these files has been applied to
  `corrected/`. They are SME-reviewable candidates only.
- **Speaker labels stripped.** The student batch's `XX:` /
  `FULL CAPS NAME:` speaker prefixes are removed before alignment so
  the diff focuses on spoken words. This means speaker-attribution
  errors aren't surfaced here (a separate workflow is needed for those).
- **Both Whispers can be wrong.** Treat these as candidates, not
  conclusions. LoC's text is the ground truth, and LoC isn't always
  in scope.
- **autojunk fallback used for some entries.** Python's
  `difflib.SequenceMatcher` can hit edge cases on very repetitive text;
  `differential_diagnostics.py` retries with `autojunk=True` as a
  fallback. Affected entry: Rick Tuttle (recovered via fallback).
