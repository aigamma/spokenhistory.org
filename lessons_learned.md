# Lessons Learned: Cleaning a Smithsonian-Grade Oral History Corpus

**Project:** Civil Rights History Project metadata generation
**Scope:** 127 audit-able interviews (~600 hours, 135 raw Whisper transcripts)
**Audit overlay:** ~12 MB master correction file, ~14,500 correction rows across 7 passes
**Publication gate:** Library of Congress + Smithsonian NMAAHC — hallucination tolerance is essentially zero

Drafted 2026-05-25 from a forensic audit of the audit pipeline itself (commit history + side-files + corrected/ vs. master-MD drift analysis). The findings below are the things that, in hindsight, would have changed how the audit was structured — not just bugs that got fixed.

---

## Why this is hard, in one sentence

ASR (Whisper) on 1960s-era oral histories with regional accents, archival names, code-switching, and overlapping speakers produces structured-looking transcript text that is wrong in ways a human reader cannot detect by spot-checking. The errors look like English but reference the wrong person, the wrong place, or a person who does not exist. A Smithsonian-grade summary built on those errors will hallucinate confidently.

---

## Categories of error, with audited examples

### Category 1 — Phonetic confusion on canonical names

The single most damaging class. Whisper renders an unfamiliar canonical name as a phonetically-close common-English wordform; the wordform passes a casual read; the error is invisible until someone who knows the historical record encounters it.

| Whisper output | Canonical reading | Why it matters |
|---|---|---|
| "Daniel H. Crane Dion" / "Don" | **Daniel H. Crena de Iongh** (first Treasurer of the World Bank, 1946–52; Dutch banker; personal banker to Hendrik Verwoerd; Clarence B. Jones's stepfather-in-law) | The "Crane Dion" rendering looks like a person's name. It is not. Clarence Jones is testifying about a specific historical figure whose role in the apartheid financing chain is documented in Dutch and World Bank archives. A summary referencing "Daniel H. Crane Dion" would not be searchable, not be citable, and would confuse downstream researchers about who Jones is actually testifying about. |
| "Heinrich Fairboldt" | **Hendrik Verwoerd** (Prime Minister of apartheid South Africa, 1958–66; "architect of apartheid"; assassinated 1966) | Phonetic confusion. "Fairboldt" doesn't exist. "Verwoerd" is a foundational name in South African history. |
| "Marka Max" / "Mark Max" | **Malcolm X** | Recurring across multiple entries. Whisper rejects "Malcolm X" as a structurally odd name (single letter as surname) and substitutes whatever sounds closest. |
| "Audubon Ballroom" | rendered as **"Auto bom barroom"** / **"audio bom"** | The site of Malcolm X's February 21, 1965 assassination. Renders unrecognizably. |
| "Lenox Avenue" | rendered as **"Linux Avenue"** / **"Lennox Avenue"** | Whisper substitutes the unfamiliar Harlem geographic name with the tech-era homophone "Linux." Renders unrecognizably for any reader of the period. |
| "Stokely Carmichael" | rendered as **"Stoke and Carmichael"** / **"Stokeley Carmichael"** | SNCC chairman, originator of "Black Power" slogan. The "Stoke and Carmichael" rendering invents a second speaker. |
| "Eldridge Cleaver" | rendered as **"Elders Cleaver"** (24 times in Aaron Dixon's transcript) | Black Panther Party Minister of Information. "Elders Cleaver" looks like a parsable English title. |
| "Bunchy Carter" | rendered as **"Bunchy Hutton"** (merged with another BPP member, Bobby Hutton) | Phonetic confusion plus name-merging — two distinct BPP members collapsed into one. |
| "Walter Cronkite" | rendered as **"Walter Concrite"** | News anchor who announced Martin Luther King Jr.'s assassination. |
| "Margaret the King" | should be **Martin Luther King Jr.** | "Martin Luther" rendered as "Margaret the" — Whisper substituted a different first name + parsed "Luther" as a possessive marker. |

**Lesson:** Speaker-specific historical figures need ground-truth corpus grounding *before* ASR output is trusted. We built `Metadata Generation System/civil_rights_facts.json` (140 entries, 291 aliases) for this exact reason, but it didn't exist when the first Whisper passes were run — so 50+ name errors leaked through and had to be cleaned up retroactively across seven passes.

### Category 2 — ASR Name Bleed (the most insidious class)

When a speaker references multiple proper nouns in close proximity, Whisper sometimes *merges* them into a single composite identity. This is harder to catch than Category 1 because the merged name often sounds plausible.

| Bleed | Reality | Confidence-of-detection |
|---|---|---|
| "Paul Hoffman Robeson" / "Paul Hoffman Roberson" (4 occurrences in John Carlos's transcript) | **Paul Robeson** (bass-baritone singer, civil rights intellectual, Rhodes scholar, HUAC witness) + **Paul Hoffman** (Harvard rower, OPHR-button courier in 1968) merged into one entity | Caught in Pass 7 PRR — only because the analyst had read the surrounding context closely enough to recognize that the "Paul Hoffman" passage in the OPHR-button section was a *different* Paul than the Robeson references three paragraphs later. Without that careful read, the bleed would have shipped to publication. |
| "Earl, Adam Clayton Powell Sr, Andrew, Carlos" (John Carlos's siblings list) | **Earl Jr., Andrew, John Carlos** (and sister Hepsy). Adam Clayton Powell Sr. (Abyssinian Baptist Church pastor) is mentioned *3 paragraphs later*; Whisper bled him backward into the siblings enumeration. | Reads as a plausible list. A summarizer would generate "John Carlos's brother Adam Clayton Powell Sr." — a categorically wrong claim. |
| "Bunchy Hutton" | Either **Bunchy Carter** (Alprentice "Bunchy" Carter, BPP LA chapter Deputy Minister) or **Bobby Hutton** ("Little Bobby" Hutton, 17-year-old BPP killed April 1968) — two distinct figures Whisper merged | Reads plausibly. |
| "Frederick Douglass Adam Clayton Powell Sr high school" (John Carlos) | **Frederick Douglass Junior High School** — ACP Sr. bled in from adjacent narrative | The grammar is parseable; the institution does not exist. |

**Lesson:** Name-bleeds cannot be caught by alias matching alone — the bled name is *biographically real*, just attached to the wrong context. Requires either narrative-coherence checking (LLM with full transcript context) or human review of every multi-name passage. We built that into Pass 7 PRR, but it was the seventh pass — six prior passes did not catch them.

### Category 3 — Short-needle substring corruption (the most expensive bug)

The audit-overlay deployment script (`scripts/apply_corrections.py`) uses case-insensitive substring substitution with word-boundary checks based on `.isalnum()`. For correction rows where the Whisper alternative is ≤3 alphabetic characters, this approach is dangerous when the substring appears inside a longer word with a non-alphanumeric separator.

Real example: master MD row 20.12 (Clarence B. Jones interview):

```
| 20.12 | Daniel H. Crane Dion / Don | Daniel H. Krenge De Iongh | high | canonical | ... |
```

The Whisper column has two alternatives, separated by "/": the long form and a short form "Don" (when the speaker just says the first name). When applied to the transcript, the script would search for "Don" case-insensitively. Word-boundary check: the surrounding characters must not be `.isalnum()`. *Apostrophe is not alphanumeric.*

Result: every instance of "don't" in the transcript became "Daniel H. Krenge De Iongh't". Every "I don't know" → "I Daniel H. Krenge De Iongh't know". A reader's eye reads past it; an LLM summarizer would not.

The same class of bug existed in `Red` → `Red Auerbach` (corrupting "red-and-futtle", "ex-red"), `PUM` → `BPUM (...)` (corrupting "B-Pum"), and 35+ other rows.

**Fix (deployed 2026-05-25):** for short needles (≤3 alphabetic chars), block matches adjacent to apostrophe-followed-by-contraction-suffix (`'t`, `'ll`, `'d`, `'m`, `'ve`, `'re`) and hyphen-on-either-side, while still allowing possessive `'s` so legitimate "Tim's" → "Tim Jenkins's" replacements survive. Long needles (≥4 chars) keep their original behavior.

**Lesson:** Substring substitution at corpus scale needs adversarial test cases for every short alternative. Any row with a ≤3-character Whisper alternative is potentially a landmine and should be hand-audited before being applied.

### Category 4 — Duplicate-application of acronym-expansion rows

Acronym-expansion rows (e.g., `UNC` → `UNC-Chapel Hill`, `NSM` → `Northern Student Movement`) have a special failure mode: when the expansion text *itself contains the acronym*, re-running the apply script can apply the expansion to its own output.

Real example: Esther M. A. Terry's transcript had `UNC` → `UNC-Chapel Hill` applied once correctly. A subsequent apply ran the same rule against the already-expanded text, where `UNC-Chapel Hill` still matches the literal substring `UNC`. Result: `UNC-Chapel Hill-Chapel Hill`. Observed in 10 locations across one transcript. The same class of bug produced `B-BPUM` (where `BPUM` was the intended expansion of `PUM`).

**Fix:** the hyphen-compound protection in the short-needle guard skips matches where the trailing character is a hyphen followed by an alphanumeric.

**Lesson:** Apply scripts that aren't strictly idempotent will accumulate damage on every re-run. Idempotency should be a tested invariant, not an assumed property.

### Category 5 — Process governance: uncommitted local state

The most expensive single class of error in this audit was **work that was done but not committed at session close**. Two episodes:

1. **Pass 6 "retroactive" commit** (2026-05-24, commit `ea69ae4`): Pass 6 (low-confidence residual QA + heuristic mutation sweep) was executed in a working session on 2026-05-23 — 290 transcript mutations applied to corrected/ files, 82 D2-ambiguous resolutions generated. None of it was committed at session close. The work sat in the working tree for ~24 hours. The retroactive commit acknowledges: *"the original Pass 6 session executed work but did not commit + push at session close, violating the per-phase atomicity discipline CLAUDE.md mandates."* This nearly resulted in losing 24 hours of audit work.

2. **Per-entry slice freshness drift** (2026-05-22 → 2026-05-24): 11 of the 127 per-entry slices used as Pass 7 PRR input were dated 2026-05-22 — *before* the Pass 5 (Layer 5 fidelity-deploy) on 2026-05-23 00:56. The Pass 7 analytical output for those 11 entries reflects pre-Layer-5 state. Pass 7 was expensive (tens of millions of tokens); 11/127 ≈ 9% of that work was analyzing stale data.

**Lesson:** "Commit + push at every moderate milestone" is not a nice-to-have. Working-tree limbo is a process failure mode that masks itself — the work exists on someone's local disk and looks fine until a parallel session, a system restart, or a teammate's clean clone exposes the gap.

### Category 6 — Audit-tool drift: side-files that never propagate

Each audit pass generated structured side-files (pass2_stage/, pass3_stage/, pass4_stage/, pass5_stage/, pass7_stage/) containing per-entry recommendations. The intended flow:

```
Pass N stage files → merge_passN.py → master MD → apply_corrections.py → corrected/
```

This pipeline broke at multiple points:

- **Pass 7's apply step never ran.** Pass 7 PRR generated 127 per-entry analytical files. `merge_pass7.py` rolled the analytical blocks into the master MD. But `apply_subject_corrections.py` (the only apply step Pass 7 produced) only touched Subject paragraphs in the master MD itself — it never propagated Pass 7 findings into corrected/. The Pass 7 catches 62.P7.1 (Carlos siblings ASR-bleed) and 62.P7.2 (Paul Hoffman/Robeson merge) sat in the analytical block for ~24 hours, documented but not deployed. The 2026-05-25 audit had to retroactively reformat them into a canonical correction table that `apply_corrections.py` recognizes.

- **The merge of Pass 7 PRR into the master MD broke the parser.** Pass 7 PRR sub-sections were inserted with `### N.` (h3) headers — the same heading level used for top-level entry headers (`### 1. Aaron Dixon`). Last-occurrence parser semantics caused `apply_corrections.py` to silently drop the first 5 interview entries on every subsequent run. The bug was invisible until someone diffed sandbox output against `corrected/` and noticed those 5 entry directories were missing.

**Lesson:** Stage-and-merge audit pipelines need end-to-end smoke tests that verify the corrected output reflects the staged input. *"The merge ran"* and *"the corrected directory has files in it"* are not sufficient signals.

### Category 7 — Spelling errors that gate downstream tooling

The audit overlay's value depends on its canonical spellings being right. Any name that the audit gets wrong becomes an alignment failure for downstream tools that try to merge with external authorities (Library of Congress finding aids, World Bank archives, ground-truth corpora).

Specific examples observed in this audit:

| Audit-overlay spelling | Correct spelling (authoritative source) | Failure mode if not caught |
|---|---|---|
| "Daniel H. Krenge De Iongh" (Pass 1 of row 20.12) | **Daniel H. Crena de Iongh** (Dutch banking records, World Bank archives 1946-52) | Cannot align against World Bank Treasurer's Office records; cannot cross-reference with Verwoerd biographies; downstream researchers cannot find the documented figure. |
| "Russian Whitaker" (early Whisper output for an interviewee referenced in the master MD) | **Russel Whitaker** | The kind of phonetic ASR error that, if not caught, produces a transcript referencing a person who does not exist. |
| "Sotaco" / "Soda Coa" (multiple Whisper attempts) | **SCOPE** (Summer Community Organization and Political Education project, 1965 SCLC initiative) | Acronym phonetically rendered as a word; no LoC alignment possible. |

**Lesson — critical for LoC healing:** Before any reference-matching pass (LoC, ground-truth corpus, external archive), every canonical name in the audit overlay should be verified against an authoritative source. Pass 7 PRR did this for ~140 entries via the ground-truth corpus, but ~50+ canonical figures appear in the corpus that don't yet have authoritative-source verification. The risk: we ask LoC for "Krenge De Iongh" and get nothing back, conclude LoC has no record, and miss the fact that our spelling was wrong all along.

---

## Process lessons (independent of error category)

### What worked

- **Pass-based incremental cleanup with row-ID conventions.** The `N.X` / `N.P2.X` / `N.P2T.X` / `N.P3.X` / `N.P4.X` / `N.P7.X` row-ID scheme made every correction traceable to a specific pass and a specific entry. This is the foundation of any institutional credibility instrument.

- **Confidence tiers.** The `correct` / `high` / `medium` / `low` / `speaker-originating` / `flagged-for-adversarial-review` / `n/a` confidence taxonomy let us distinguish "we know this is canonical" from "this is what the speaker actually said" from "Whisper made this up." Without confidence tiers, every row would be treated the same.

- **Ground-truth corpus + alias map.** `civil_rights_facts.json` with 140 canonical entries + 291 alias variants gave us a checkable source-of-truth for Whisper failure → canonical mapping. The corpus grew during the audit (started at 60 entries, ended at 140) but the architecture was right from Pass 2 onward.

- **Per-entry slicing for adversarial isolation.** The `per_entry_slices/` directory let Pass 7 PRR analyze one entry per agent without cross-contamination. This was a deliberate response to a prior contamination incident in an earlier multi-transcript batch attempt.

- **Audit trail document.** `transcripts/AUDIT_TRAIL.md` recorded what was done, when, by whom, with what coverage. The 2026-05-25 forensic audit (which produced this document) was only possible because of that trail.

### What didn't work

- **Implicit apply-back assumption.** Multiple passes generated side-files of "pending corrections" without an accompanying apply script. The first time corrected/ was empty after Pass 4 (and the user discovered the apply step had been silently dropped) should have triggered a hard governance rule: every pass that generates corrections ships with its apply script *in the same commit*. That rule was articulated but not enforced; Pass 7 reproduced the failure.

- **Header-level ambiguity.** Markdown's `###` heading level was reused for both top-level entry headers and Pass 7 PRR sub-section headers. The parser collision was invisible until empirically tested. Using `####` or numbered ordered-list items for sub-sections from day one would have prevented the bug.

- **No idempotency test.** `apply_corrections.py` claimed to be idempotent in its docstring ("re-running on already-corrected output produces identical bytes"). It wasn't — acronym-expansion rows accumulated. A simple snapshot test (apply twice, diff the output) would have caught this in Pass 1.

- **Pass 7 expense vs. yield.** Pass 7 PRR was extraordinarily expensive (tens of millions of tokens) and primarily produced *evaluative* output (publication-readiness scorecards, subject-paragraph audits) rather than *corrective* output. Zero new per-row corrections were added to the correction tables. The audit-quality assessment was valuable, but the cost-per-row-corrected for Pass 7 was effectively infinite. A pre-Pass-7 cost-benefit estimation might have scoped it differently.

### What I'd do differently if starting over

1. **Build the apply pipeline first, before any audit.** The first commit of any audit pass should include: stage files, merge script, apply script, idempotency test, sandbox smoke test. No pass merges until all five exist.

2. **Mandate canonical-spelling verification before any reference-matching pass.** Before going to LoC or any other external authority, run a verification pass: every canonical name in the audit overlay must have an authoritative-source URL (Wikipedia + scholarly archive + Library of Congress entry). Spelling errors that gate downstream tooling are 10x more expensive to fix after the downstream tooling has been built around the wrong spelling.

3. **Word-boundary safety as a design invariant.** Every substring substitution at corpus scale should default to strict word boundaries — including apostrophe-as-word-char for short needles. Short needles should require explicit `--allow-short` opt-in per row, not be silently dangerous.

4. **Commit + push at every moderate milestone, no exceptions.** Uncommitted working-tree state is a process failure, not a "work-in-progress" status. The 24-hour Pass 6 limbo could have been catastrophic.

5. **Header-level discipline.** Top-level entries use `### N.`; nothing else uses `### N.`. Sub-sections inside an entry use `####` or `#####`. Enforced by linter.

6. **Per-pass cost-benefit budget.** Each pass declares a token budget and a target number of corrections it will produce. Passes that significantly under-deliver should be paused before consuming more.

---

## The audit substrate, summarized

After 7 passes spanning ~5 days and tens of millions of tokens:

- **127 audit-able interviews**, each in `transcripts/corrected/` with `.srt` / `.txt` / `.vtt` + `manifest.json`
- **~14,500 correction rows** in the master MD across Pass 1 / Pass 2 / Pass 2-tail / Pass 3 / Pass 4 / Layer 5 / Pass 6 / Pass 7
- **6,933 applied corrections** in the current corrected/ output (as of 2026-05-25 12:54)
- **2,950 pending-context rows** (medium/low/speaker-originating — informational, not applied)
- **140 ground-truth corpus entries** with 291 alias variants
- **3 audit-governance documents**: AUDIT_TRAIL.md, OPEN_PROBLEMS.md, CLEANED_TRANSCRIPTS_REVIEW.md
- **5 per-pass staging directories** (pass2_stage/ through pass7_stage/) + low_conf_resolutions/ + layer5 stage dirs

The substrate is now ready for Library of Congress healing — but only after the canonical-spelling verification pass described above. That's the next single most-load-bearing piece of work before LoC alignment.

---

## Headline takeaways for the WWU presentation

If you only have three slides for this audience, lead with:

1. **ASR on archival-era oral histories produces fluent-sounding errors that a casual read cannot detect.** The audit needs to be designed around the assumption that the AI is confidently wrong about names — not occasionally, but systematically. The "Paul Hoffman Robeson" merge is the kind of error you can't catch without subject-matter context.

2. **Every audit pass needs an apply step in the same commit.** Side-file recommendations that don't propagate to source files are theater. We lost ~24 hours of Pass 6 work to working-tree limbo and ~9% of Pass 7's analytical output to stale-slice drift; both were preventable with one process rule.

3. **Substring substitution at corpus scale is dangerous in ways that are not obvious.** "Replace 'Don' with 'Daniel H. Crena de Iongh' wherever it appears" is a one-line correction row that silently corrupts every contraction in the affected transcript. The fix is precise but the bug is generic — any pipeline that does case-insensitive substring substitution on short needles will reproduce this class of error.

The institutional credibility instrument — the audit trail, the ground-truth corpus, the per-pass row-ID convention — is in good shape. The mechanical pipeline that deploys the audit's findings was the weak link.
