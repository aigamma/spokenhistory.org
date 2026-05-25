# NEXT_SESSION_PROMPT — Library of Congress healing pass (linear)

**Created:** 2026-05-25
**Predecessor work:** commits `9cf77ef` (uncommitted-state cleanup) and `a80a77c` (apply_corrections word-boundary patch + master MD spelling fix + Pass 7 row-table reformat + corrected/ regeneration)
**State of `transcripts/corrected/`:** in sync with `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` as of `a80a77c`. A sandbox re-run of `python scripts/apply_corrections.py --out-dir <sandbox>` produces zero non-manifest diffs against corrected/.
**Hard deadline:** Wednesday 2026-05-27 team meeting at WWU (≈48 hours away).

---

## What this session does

Heal each of the 127 audit-able interview transcripts in `transcripts/corrected/<entry>/` against its corresponding Library of Congress source-of-truth, using LoC's structured TEI2 XML as the authoritative reference. **LoC text wins where it disagrees with our Whisper-derived text on matters of fact (names, places, dates, identities).** Our files remain the master archive — we correct errors within existing timestamped segments, preserving the timestamp + metadata structure.

This is read-only from LoC's public API. **Nothing is submitted to LoC.**

---

## The make-or-break check has already passed

Aaron Dixon (entry #1) was used as the fail-fast sanity check on 2026-05-25 ~12:05. LoC's JSON API for the Civil Rights History Project exposes:
- A structured TEI2 XML transcript at `https://tile.loc.gov/storage-services/service/afc/afc2010039/afc2010039_crhp<NNNN>_<surname>_transcript/afc2010039_crhp<NNNN>_<surname>_transcript.xml`
- 555 `<p>` elements for the Aaron Dixon transcript; 408 are speaker turns; 21,535 words of canonical text
- Speaker labels (`David Cline:`, `Aaron Dixon:`, `John Bishop:`), interview metadata (date, location, length), header fields

The fail-fast finding: LoC's prose already shows clear ASR errors we are carrying. Example: our Whisper rendered the interviewer as "David Klein" — LoC's canonical attribution is "David Cline". Our SRT has a "round of applause" hallucination at line 2 that LoC does not have.

The Aaron Dixon resolver + XML are pre-cached in `transcripts/loc_healing/loc_cache/`. The resolver script `transcripts/loc_healing/resolve_loc_items.py` is verified working — it took ~3 seconds end-to-end for Aaron Dixon with the polite-delay configured.

**You do not need to re-prove the existence of LoC transcript text.** Proceed directly to the healing work below.

---

## Critical constraint: LINEAR processing only

**Do NOT use parallel Agent subagents for this work.** Do not batch LoC API requests. Do not multi-thread.

Reasons:
- LoC's public API is rate-limited; aggressive querying gets the IP labeled as an attacker and blocked.
- This is the National Archive's public infrastructure — we are guests. Be a polite guest.
- The resolver already includes a 1.5-second delay between requests; keep it.
- An autonomous parallel approach is the wrong tool here even though CLAUDE.md's "parallel subagents for backlog work" rule normally applies. The bottleneck is the external service, not your local compute.

Process the 127 transcripts **one at a time, sequentially**. Expect wall-clock of roughly 40-60 minutes for the deterministic pull + diff phase across all 127 entries. The model-judgment phase can be done per-transcript in the main session loop.

---

## Architecture

### Phase 1 — Resolve all 127 entries to LoC items (deterministic, no model in loop)

Run `transcripts/loc_healing/resolve_loc_items.py` against every entry in `transcripts/corrected/`. The script:
1. Parses the interviewee name from each entry's directory name (`Aaron Dixon_interview_20250704_170306` → `Aaron Dixon`).
2. Queries `https://www.loc.gov/collections/civil-rights-history-project/?fo=json&q=<name>&c=50`.
3. Scores candidates by (a) URL is an `/item/` URL, (b) title starts with `<subject> oral history interview`, (c) all (last, first) name-pair tokens appear in a single contributor string.
4. Pulls the transcript XML URL from the chosen item's `resources[0].fulltext` (a URL to `.xml` on `tile.loc.gov`).
5. Downloads the XML to `transcripts/loc_healing/loc_cache/<subject>.xml`.
6. Writes per-entry resolution metadata to `transcripts/loc_healing/loc_cache/<subject>.resolution.json`.
7. Aggregates into `transcripts/loc_healing/loc_cache/_index.json`.

**Possible outcomes per entry:**
- `ok`: matched cleanly, XML cached
- `no_transcript`: LoC has the item but only audio + PDF — no machine-readable transcript text
- `no_candidates`: no LoC item found (unusual; flag for manual lookup)
- `ambiguous_ok`: matched but with low confidence (Eric should review)

Expect ~120-127 `ok` results. The 4 "unaudited" interviewees (Glenda Funchess, Louise Broadway, Lucius Holloway, Luis Zapata) do NOT have entries in corrected/ — they're audit-skipped per CLAUDE.md and not part of the 127. Don't try to heal them; they don't exist in our master.

**Commit + push after Phase 1 lands.**

### Phase 2 — Per-entry diff + judgment + apply + change-log

For each `ok`-resolved entry, in alphabetical/numerical order:

#### Step 2a — Parse both sides
- Read the cached LoC XML; strip `<p>` tags; extract speaker-attributed prose.
- Read our `transcripts/corrected/<entry>/<entry>.srt` (and `.txt` and `.vtt`); extract cue-text per segment.
- Tokenize both to word level (preserving timestamps on our side via segment-boundary anchors).

#### Step 2b — Token-level align + divergence list
- Use `difflib.SequenceMatcher` or equivalent to align the two token streams.
- Produce a divergence list: for each disagreement, record (LoC tokens, our tokens, our segment-cue context). Save to `transcripts/loc_healing/divergences/<subject>.json`.

#### Step 2c — Per-divergence judgment (model in loop)
For each divergence, classify into one of:
- `ASR_ERROR_HEAL`: our token is a Whisper failure; LoC token is canonically correct (proper noun spelling, factual name, place name). **Action: replace our token with LoC's.**
- `EDITORIAL_SMOOTHING`: LoC's prose has been edited for readability (e.g., "the eleventh of May" vs our "the 11th of May", or LoC's contraction-expansion). **Action: keep our verbatim text.**
- `SPEAKER_DISFLUENCY`: a "uh," "um," repetition, false start, or hesitation marker that LoC's prose dropped. **Action: keep our verbatim text.**
- `UNCLEAR`: cannot determine from context. **Action: keep our text, log for human review.**

Batch all divergences for a single transcript into ONE Claude call (don't make 100 separate calls per transcript). Use Claude Sonnet 4.6 or Opus 4.7 — Sonnet is cheaper and adequate for this classification. Pass the divergence list + relevant context windows; receive a JSON array of verdicts back.

#### Step 2d — Surgical apply
For each `ASR_ERROR_HEAL` verdict:
- Locate the divergence in our `.srt` (and `.txt`, `.vtt`) by segment-cue context.
- Replace the bad tokens with LoC's tokens **within the existing cue boundaries**. Do not restructure segments. Do not retime.
- For multi-token replacements, replace the entire matched span as a unit.

Do NOT wholesale-replace our cue text with LoC's prose — LoC's text is edited for readability and would lose the verbatim character of our transcripts. We are correcting within our text, not adopting LoC's.

#### Step 2e — Per-entry change log
Write `transcripts/loc_healing/change_logs/<subject>_change_log.md` with:

```markdown
# Change Log — <Subject> — LoC Healing — <date>

**LoC item:** <URL>
**LoC XML:** <URL>
**LoC match score:** <0.0-1.0>
**Our master:** transcripts/corrected/<entry>/<entry>.srt|txt|vtt

## Divergences detected
Total: N
Healed (ASR_ERROR_HEAL): N
Preserved verbatim (EDITORIAL_SMOOTHING): N
Preserved verbatim (SPEAKER_DISFLUENCY): N
Unresolved (UNCLEAR — flagged for human review): N

## Each correction applied

| # | SRT segment | Our token | LoC token | Verdict | Reasoning |
|---|---|---|---|---|---|
| 1 | <segment_id> @ <timestamp> | "David Klein" | "David Cline" | ASR_ERROR_HEAL | LoC catalog confirms David Cline as the interviewer for this date; "Klein" is a Whisper phonetic substitution. |
| ... | ... | ... | ... | ... | ... |

## Each divergence NOT applied (preserved verbatim)

| # | SRT segment | Our token | LoC token | Verdict | Reasoning |
| ... | ... | ... | ... | ... | ... |
```

This is the audit-trail-of-record for what changed. Eric explicitly requested this per-entry log so every step of every correction is traceable. Do not skip.

#### Step 2f — Content verify
After applying corrections to each entry:
- Read each file back; confirm the corrected tokens are present.
- Confirm timestamps + cue indices are intact (count cues before + after, confirm equal; spot-check 3 cues' timestamps unchanged).
- Confirm the manifest.json is updated with a new "loc_healing" section listing the healed-row count.

If any verification fails, STOP and report. Don't continue to the next entry. **Exit status is not success;** content match is success.

#### Step 2g — Commit every 5-10 entries
Atomic commits as you go. Don't batch all 127 into one commit. Suggested cadence: commit + push every 5-10 entries. Commit messages should be:

```
LoC healing: +N (Subject1, Subject2, ...) = K/127
```

Mirroring the Phase 3c commit style already established.

### Phase 3 — Final coverage report

After all 127 entries are processed (or LoC has run out of transcripts to heal against):
- Aggregate the per-entry change logs into `transcripts/loc_healing/COVERAGE_REPORT.md`
- Stats: total entries healed, total divergences detected, total ASR errors healed, total editorial-smoothing preserved, total unresolved
- List of entries with NO LoC transcript (LoC has the item but only audio/PDF)
- List of entries flagged for human review (high UNCLEAR count or critical-name corrections that couldn't be resolved)
- Final commit + push

---

## Edge cases to handle

- **Joint interviews** (e.g., `Audrey Nell Hamilton and JoeAnn Anderson Ulmer`, `Booker and Newsom`, `Carolyn Miller and James Miller`). These have one LoC item per pair (search by either name should find it). The transcript has both speakers' turns; healing works the same way per turn.
- **`(PARTIAL)` entries** (per master MD's pass coverage flags). 11 entries had stale per-entry slices during the 2026-05-22 Pass 7 PRR run (per `lessons_learned.md` Category 5). Their Pass 7 analytical scoring is slightly stale, but their corrected transcript content is healthy. Heal them normally.
- **Entries with `(SKIPPED)` markers** in the master MD (#46 Geraldine Crawford Bennett group; #64 John Dudley group; #95 Patricia A. Crosby group). These are NOT in corrected/ — they're audit-skipped multi-subject groups. Don't try to heal them.
- **LoC has no transcript**: some Civil Rights History Project items have only audio + PDF, no XML transcript. The PDF could in theory be OCR'd, but **do NOT do that in this session** — flag and skip. PDF OCR is a separate work stream.
- **Spelling-error landmines surface during LoC matching**: if you find names in the audit overlay that don't match LoC's canonical spelling (e.g., we discovered "Krenge De Iongh" → "Crena de Iongh" during the 2026-05-25 audit; see `lessons_learned.md` Category 7), STOP, surface the finding to Eric, and decide together whether to update the master MD before continuing. Spelling mismatches gate LoC alignment.
- **LoC's "edited prose" reflex**: LoC sometimes substantially restructures sentences for readability. Be conservative — when in doubt, preserve our verbatim text. The Smithsonian-grade publication priority is fidelity to what the speaker actually said, not LoC's editorial polish.

---

## Files and infrastructure already in place

```
transcripts/loc_healing/
├── resolve_loc_items.py          # Phase 1 resolver (verified working 2026-05-25 on Aaron Dixon)
├── loc_cache/                    # XML + resolution metadata per entry
│   ├── _index.json              # aggregated coverage summary
│   ├── Aaron_Dixon.resolution.json
│   ├── Aaron_Dixon.xml          # 129 KB, 555 <p> elements, 21,535 words
│   └── (will fill in for the other 126 entries)
├── divergences/                  # per-entry divergence lists (Phase 2b)
└── change_logs/                  # per-entry healing audit trail (Phase 2e)
```

The resolver was tested on Aaron Dixon and returned `status: ok` with `match_score: 0.95`. The infrastructure is ready.

**LoC API headers required:**
- User-Agent must NOT be the default Python `urllib` UA — LoC blocks it. The resolver already uses `Mozilla/5.0 (civil-rights-history-rescue; contact eric@aigamma.com)`. Keep it.
- Polite delay: 1.5 seconds between requests. The resolver enforces this.

---

## Process discipline (non-negotiable)

1. **Commit + push at every moderate milestone.** Per CLAUDE.md and Eric's explicit guidance: uncommitted working-tree state is a process failure. Don't let work sit locally across phase boundaries.
2. **Verify by content, not exit status.** Read healed files back; confirm tokens changed and timestamps preserved.
3. **Linear LoC API access.** No parallel subagents touching LoC. The whole pass should be one main loop in this session.
4. **No silent failures.** If LoC returns 5XX, log it and retry (with backoff). If LoC returns 403/429, STOP the entire pipeline — you've been throttled, don't aggravate it.
5. **Don't auto-advance through hard surprises.** If you find spelling discrepancies that look systematic (e.g., LoC has a different name spelling that suggests our audit overlay is wrong), STOP and surface to Eric.

---

## Recommended starting prompt for the fresh session

Paste the following into a fresh Claude Code session in `C:\civil`:

> Execute `transcripts/session_prompts/NEXT_SESSION_PROMPT.md` end-to-end. Resume from wherever the LoC cache shows progress. Process linearly, with the polite delay. Commit + push every 5-10 entries. Verify content; do not trust exit status. Stop if you encounter the spelling-discrepancy surprise described in the Edge Cases section or if LoC returns 403/429. Report final coverage when done.

After completion, archive this prompt: move it to `transcripts/session_prompts/archive/NEXT_SESSION_PROMPT_2026-05-25_loc-healing-completed.md` per the single-use-prompt convention.

---

## Related reading (not required, but useful for context)

- `lessons_learned.md` (project root) — categorizes the audit-pipeline error classes; Category 7 (spelling errors that gate downstream tooling) is the most relevant for this LoC pass.
- `CLAUDE.md` — project conventions; the "Pacing constraints" section + the "Audit documentation discipline" section apply.
- `transcripts/AUDIT_TRAIL.md` — the longitudinal audit history; the Layer 5 fidelity sweep section explains the canonical-spelling-verification approach we should mirror for LoC healing.
- `docs/TRANSCRIPT_AUDIT_DESIGN.md` — original architectural design for the three-stage audit cascade (exact/alias match → phonetic fuzzy → LLM disambiguation); the LoC healing per-divergence judgment is a fourth stage in that cascade.
