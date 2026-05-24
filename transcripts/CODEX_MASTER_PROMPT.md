# CODEX_MASTER_PROMPT — Civil Rights History Project handoff

**Generated:** 2026-05-24 end-of-day, by Claude Opus 4.7 (closing Pass 7 of the audit cascade)
**For:** Whichever agent (Codex, Cursor, Kiro, Kimi, Gemini, or fresh Claude session in a new IDE) picks up the project next.
**Self-contained:** This document tells you everything you need to continue. You should not need to read more than the 2-3 referenced docs to orient. Read this first, then `transcripts/AUDIT_TRAIL.md` (history) and `transcripts/OPEN_PROBLEMS.md` (what's open), then start working.

---

## 1. Mission

The Civil Rights History Project is an open-source AI system that transforms the **Library of Congress Civil Rights History Project oral history archive** (600+ hours of interviews, produced in collaboration with the **Smithsonian NMAAHC**) into structured, searchable metadata. The Smithsonian has been scrutinizing the team's AI-generated summaries for hallucinations — **the quality bar is "Smithsonian-grade publication," not "good enough for a research demo."**

Stakeholders:
- **WWU team** (lead: Dustin) — owns the corpus + frontend + ground-truth oral-history relationships.
- **Eric (aigamma.com)** — external RAG-rescue contractor; owns the RAG substrate + audit pipeline + this CLAUDE-based audit cascade.
- **Smithsonian (NMAAHC) + Library of Congress** — downstream institutional gatekeepers for public release.

**Hard deadline:** 2026-05-27 WWU team meeting. Today (handoff date) is 2026-05-24. **Codex has 3 days.**

---

## 2. Where things stand (2026-05-24 end-of-day)

### Audit cascade: COMPLETE

Seven audit passes have been completed on the master correction overlay `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` (12.25 MB after Pass 7 merge):

| Pass | Done | Scope | Key artifact |
| --- | --- | --- | --- |
| Pass 1 | Session 1 (2026-05-21) | Initial Whisper-correction sweep across 132 source transcripts | ~3,000 corrections |
| Pass 2 | Session 2 (2026-05-22) | Re-review + tail-sweep coverage of partial-read entries | ~4,000 additional corrections + 870 tail catches |
| Pass 3 | Session 2 Phase C (2026-05-22) | Confidence-tier consolidation; adversarial-review flag aggregation; ground-truth corpus candidates | ~1,500 confidence resolutions; corpus expanded 60→140 |
| Pass 4 | Session 4 (2026-05-22) | Sweeping QA + fact-check with one-transcript-per-agent cross-contamination firewall | ~2,500 net-new catches; ~1,500 fact-check verifications |
| Layer 5 | Session 3 Layer 5 (2026-05-23) | Corpus-global fidelity sweep (4 dimensions); identified 1,758 advisory findings; high-confidence subset auto-applied | D1 + D2 + D3 + D4 audit reports |
| Pass 6 | Session 5 (2026-05-23 → 2026-05-24) | Low-confidence residual adversarial resolution + heuristic mutation sweep + readiness scoring v1 | 300 D2-ambiguous flags resolved (262 markers cleared); 19 entries got heuristic Whisper→canonical fixes |
| **Pass 7** | **Session 6 (2026-05-24)** | **Publication Readiness Review (PRR) per entry: Subject paragraph audit, cross-pass coherence, ground-truth proposals, v2 readiness score, publication verdict** | **127 PRRs; 330 Subject paragraph corrections; 251 unique corpus proposals; readiness ledger v2** |

**Pass 7 verdict summary:**
- 126 of 127 entries are **conditionally ready** for Smithsonian-grade publication.
- 1 entry (#109 Robert McClary) is **NOT READY** — full re-transcription required (~60-70% incoherent Whisper fragments).
- v2 readiness score distribution: mean 97.5, median 100.0, range 74.1–100 (clamped). All 127 entries scored above 60.

### Deployment chain: PENDING (manual ops actions Eric holds)

The codebase is ready. Six operational steps from `CLAUDE.md` are still pending:

1. **Firebase service-account JSON** — manual console action (Firebase Console > Project settings > Service accounts > Generate new private key). Save to a gitignored path. Blocks steps 2, 3, 5.
2. **Cloud Functions deploy** — requires Blaze billing on `civil-rights-history-project` + `firebase functions:secrets:set OPENAI_API_KEY` + `firebase deploy --only functions`. The `functions/index.js` deterministic-embedding-ID fix is already committed (`ec94c5d`); ready to deploy.
3. **MCP server Fly.io deploy** — `flyctl auth login` then `fly deploy` in `mcp-server/`. `mcp-server/fly.toml` has placeholder app name `civil-rights-history-mcp` — Codex can adjust if needed.
4. **Run pipeline on 131 transcripts** — `python "Metadata Generation System/run_sample.py"` for single transcript; the Flask UI at `python app.py` handles batches. Cost ~$5.40 for all 131 (measured PoC: 64.6s, $0.0348/transcript). Output → `Metadata Generation System/uploads/` or wherever batch path resolves.
5. **Push pipeline outputs to Firestore** — `node scripts/pipeline-to-firestore.mjs --input <pipeline.json> --service-account <sa.json>`. Dry-run validates shape.
6. **Open PR to upstream** — `jsovelove/civil-rights-history-project`. As of this writing, branch is **225 commits ahead** of upstream (was 118 on 2026-05-21; grew by Pass 6 + Pass 7 work).

Plus RAG layer (newer, post-2026-05-22):
- **Pinecone Builder + Voyage AI** chosen substrate (see `docs/RAG_SUBSTRATE_DECISION.md`).
- `rag/ingest.mjs` + `rag/retrieve.mjs` are code-complete + tested.
- **Not yet ingested** — needs Pinecone project provisioned + `rag/.env.local` populated with `PINECONE_API_KEY`, `PINECONE_HOST`, `VOYAGE_API_KEY`. Estimated $2.10 one-time embedding cost.

---

## 3. What Codex should do, in priority order

### Priority 1: Apply the 330 Subject paragraph corrections (~1-3 hrs scripting + apply)

`transcripts/subject_paragraph_corrections_pass7.json` contains 106 entries with corrections. **This is the highest-leverage publication-gate work.**

For each entry where `corrected_subject_paragraph` is non-null:
- Locate the entry's Subject paragraph in `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` (look for the `**Subject:**` line within the entry's section bounds).
- Replace the existing Subject paragraph with `corrected_subject_paragraph`.

For entries with `claims_needing_fix` but no `corrected_subject_paragraph` extracted (parser missed it), read the entry's Pass 7 PRR staging file at `transcripts/pass7_stage/entry_NNN_*.md` and apply manually. There are roughly ~10-15 such entries.

Write `transcripts/apply_subject_corrections.py` modeled on `transcripts/apply_low_conf_resolutions.py`. Reuse `entry_section_bounds` from `transcripts/fix_layer5_findings.py`. Make it idempotent.

After apply: re-run `python scripts/apply_corrections.py` so the corrected/ outputs reflect the changes.

**Hard-stop publication blockers** (entries with `contradicted` Subject paragraph claims that MUST be fixed):
- Entry 9 Booker/Newson: Trailways/Greyhound bus reversal at Anniston
- Entry 47 Arellanes: "1965" Watts pact date is chronologically impossible
- Entry 49 Richardson: "only woman invited" March on Washington wrong (Baker, Horne also on platform)
- Entry 56 Greenberg: tenure "1984-2017" wrong (died 2016)
- Entry 58 Jones Jamila: Mary Ethel Dozier wrongly named as Montgomery Gospel Trio member
- Entry 87 Perry: Briggs v. Elliott co-counsel wrong (he was a spectator)
- Entry 96 Connor: Bennie Thompson "first Black MS Rep since Reconstruction 1993" wrong (Espy 1986)
- Entry 100 Branch+Smith: Kennard application + death dates wrong
- Entry 102 Blake: Florida Memorial College plantation-school + cross-contam refs from #103
- Entry 108 Carter: Newark bar-owner wrong (was Linden NJ)
- Entry 125 Parker: Sammy Davis Jr. pallbearer at Mamie Till funeral factually impossible
- Entry 128 Lucy: Memphis strike settled April 16 1968, not August
- Entry 130 Saunders: Highlander raid was Grundy County TN, not SC police

### Priority 2: Expand civil_rights_facts.json from 140 → ~390 entries

`transcripts/ground_truth_proposals_pass7.json` has 251 unique proposed canonical figures, sorted by recurrence. Top recurring (3+ entries): Joseph L. Rauh Jr.

Codex should:
- Iterate the `deduplicated_names` list.
- For each name with `recurrence >= 1`, look up the figure (use existing `Metadata Generation System/civil_rights_facts.json` schema — see existing entries like Medgar Evers for format).
- Filter out the parser-noise entries (some entries have names like "#", "1", "2", "Role", "Field" — these are table-header bleeds; skip them).
- Build canonical entries with name, aliases (use the Whisper variants from the per-entry staging files), birth/death years, role, key events.
- Validate after each batch: `cd "Metadata Generation System" && python scripts/validate_facts.py`.
- Aim for batches of 20-30 names per commit.

This expansion is what enables the pipeline's dual-scorer + citation-auditor to properly ground its accuracy claims.

### Priority 3: Run the pipeline + dual scoring + citation audit

Once corpus expansion is done (or in parallel if you trust the 140-entry baseline):

```bash
# Single-transcript proof-of-concept
python "Metadata Generation System/run_sample.py"

# Batch mode (Flask UI)
python "Metadata Generation System/app.py"
# Then submit batch via UI
```

Cost: ~$0.04/transcript × 131 = ~$5.40 at dual-scoring + citation-audit thresholds.

Make sure these env vars are set:
- `OPENAI_API_KEY` (existing)
- `ANTHROPIC_API_KEY` (existing)
- `USE_DUAL_SCORING=1` (enables the Claude + OpenAI fail-closed dual gate)
- `FIREBASE_SERVICE_ACCOUNT_PATH=<your-sa.json>` (so review-queue enqueue works)

Failed-gate summaries route to Firestore `review_queue` collection; the React `src/pages/ReviewQueue.jsx` is the admin consumer.

### Priority 4: Deploy ops (Cloud Functions + MCP + RAG + Netlify + Firestore push)

In order:
1. Generate Firebase SA JSON (manual).
2. Enable Blaze billing on `civil-rights-history-project` (manual).
3. `firebase functions:secrets:set OPENAI_API_KEY` and `firebase deploy --only functions`.
4. `flyctl auth login` and `fly deploy` in `mcp-server/`.
5. Provision Pinecone index (manual) + Voyage API key + populate `rag/.env.local`.
6. `node --env-file=rag/.env.local rag/ingest.mjs` to populate Pinecone (~$2.10).
7. After pipeline run: `node scripts/pipeline-to-firestore.mjs --input <pipeline.json> --service-account <sa.json>`.

### Priority 5: Open upstream PR to jsovelove/civil-rights-history-project

`git log upstream/master..master --oneline | wc -l` should show ~225+ commits ahead. Write a thoughtful PR description summarizing the 7-pass audit cascade, the dual-scoring + citation-auditor substrate, the RAG layer, and the deployment chain. Use `gh pr create --base master --head master` against `jsovelove/civil-rights-history-project`. Not deadline-critical; can land after.

### Priority 6: Ensemble adjudication of residual flags

912 `[LAYER-5: D2-ambiguous, ensemble-adjudication-pending]` flags + 130 D1 canonical phantoms + 179 D3 catalog contradictions remain in master MD for Eric's external Kiro/Kimi/Codex/Gemini ensemble. Track these per `OPEN_PROBLEMS.md` Problem 9. NOT Codex's direct work — feed to ensemble queue, await results.

### Priority 7: Schedule entry 109 McClary re-transcription with Dustin

Entry 109 is the only NOT-READY entry. Per Pass 7 PRR finding, ~60-70% of the Whisper output is incoherent fragments. Coordinate with Dustin via WWU team channel to either obtain the original LoC archive transcript OR schedule a fresh Whisper run with a different model. Track via `OPEN_PROBLEMS.md` Problem 1.

---

## 4. Operating conventions (HONOR THESE)

These are non-negotiable conventions Eric has established. Violations break things downstream.

### Cross-contamination firewall

When doing per-entry work, **read ONLY that one entry's files**. Never read the master MD directly from a per-entry agent. Use `transcripts/per_entry_slices/entry_NNN_*.md` as the input. Pass 4 architecture documented in `transcripts/AUDIT_TRAIL.md` Session 4. Pass 6 + 7 inherited this.

### Per-phase atomicity (CLAUDE.md mandate)

Every audit phase commits + pushes its code/data changes + the corresponding AUDIT_TRAIL.md sub-section update in the SAME commit. Per CLAUDE.md: "The commit that lands phase N's code/data changes MUST also include the phase N sub-section update. Atomicity matters — if the session terminates between phase completion and doc update, the docs lie."

### Commit + push at every milestone (Eric's standing rule)

Eric's directive from 2026-05-24: "I always want everything pushed after every moderate milestone." Uncommitted working-tree state is a process failure, not a "work-in-progress" status. After any subagent batch returns, after any script produces output, after any doc update — `git add` + `git commit` + `git push`. Don't accumulate. The original Pass 6 session violated this and left 90 files in working-tree limbo for ~24 hours; the Session 5 retrospective entry in AUDIT_TRAIL is the institutional record of that violation.

### Smithsonian-grade publication gate

90/90 on BOTH the OpenAI scorer AND the Claude scorer independently. Disagreement (one passes, one fails) routes to human review via the Firestore `review_queue` collection. The gate FAILS CLOSED rather than publishing on a coin flip. Per-claim citation failures BLOCK, not skip.

### Don't throttle tokens / don't pulse work into sleeps

Eric is on Claude Max 20x with consistent unused weekly headroom and pre-paid overage credits that have never been touched. **Optimize for wall-clock time and visible progress, not tokens or cache hit rate.** For "burn through N independent items," use parallel subagents in one turn — not `/loop`. For genuine multi-hour persistence, use `/schedule`. The 5-min Anthropic cache TTL matters but don't let it dominate decisions.

### Don't create documentation files unless explicitly requested

Eric's preference (from `~/.claude/CLAUDE.md`): work from conversation context, not intermediate planning docs. The exceptions are the audit governance docs (AUDIT_TRAIL.md, OPEN_PROBLEMS.md, CLEANED_TRANSCRIPTS_REVIEW.md, this Codex prompt) — these are explicitly institutional records.

---

## 5. File map (the things you'll touch)

### Governance docs (READ THESE FIRST)
- `transcripts/AUDIT_TRAIL.md` — longitudinal effort log across 6 sessions. Read for full audit history + inferential-scoring framework + per-entry coverage matrix.
- `transcripts/OPEN_PROBLEMS.md` — active punch-list. As of this handoff: Problem 1 (re-transcription queue), Problem 5 (~10 corpus deferrals), Problem 6 (speaker-originating errors needing editorial footnotes), Problem 9 (912+ residual ensemble flags). Problems 2, 3, 4, 7, 8 marked RESOLVED.
- `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` — 12.25 MB master corrections overlay. The Smithsonian publication-grade artifact. Each entry has Pass 1 + Pass 2 + Pass 3 + Pass 4 + Pass 7 PRR blocks.
- `CLAUDE.md` (project root) — project-wide conventions for AI-agent contributors. Auto-loaded.
- `transcripts/PASS7_DESIGN.md` — Pass 7 scoring formula v2 + per-entry deliverable spec.

### Pass 7 outputs (the apply-ready artifacts)
- `transcripts/subject_paragraph_corrections_pass7.json` — 106 entries / 330 claims with corrected paragraphs ready to apply.
- `transcripts/ground_truth_proposals_pass7.json` — 251 unique corpus proposals with recurrence ranking.
- `transcripts/readiness_ledger_v2.json` — 127 entries with v2 scores + verdicts.
- `transcripts/pass7_stage/entry_NNN_*.md` — 127 per-entry Pass 7 PRR staging files (authoritative source if JSON parsing missed something).

### Audit pipeline (Python)
- `Metadata Generation System/run_sample.py` — single-transcript runner.
- `Metadata Generation System/app.py` — Flask batch UI.
- `Metadata Generation System/processor/` — 7-step pipeline: blocking → labeling → TOC → chapterization → summarization → tuning → engagement.
- `Metadata Generation System/processor/claude_scorer.py` — Independent Claude scorer for dual-scoring gate.
- `Metadata Generation System/processor/citation_check.py` — Per-claim citation auditor.
- `Metadata Generation System/processor/review_queue.py` — Producer for Firestore `review_queue`.
- `Metadata Generation System/civil_rights_facts.json` — Ground-truth corpus (140 entries / 291 aliases as of this handoff; target ~390).
- `Metadata Generation System/scripts/validate_facts.py` — Run after every corpus edit.

### Audit utility scripts (Python in transcripts/)
- `apply_corrections.py` (in `scripts/`) — Generates `transcripts/corrected/<entry>/*.txt` from master MD corrections. Idempotent.
- `slice_master_md.py` — Regenerates `per_entry_slices/` from current master MD. Run if you change master MD and need fresh slices.
- `merge_pass2.py`, `merge_pass3.py`, `merge_pass4.py`, `merge_pass7.py` — Per-pass stage→master MD merge scripts. All idempotent.
- `apply_low_conf_resolutions.py` — Pass 6 Track 3/4 resolution apply-back (already run).
- `fix_layer5_findings.py` — Layer 5 fidelity-deploy script. Contains the reusable helpers (`entry_section_bounds`, `find_row_line`, etc.) — Codex's apply scripts can import these.

### Frontend (React + Vite, in src/)
- `src/pages/Home.jsx` — scroll-driven timeline landing page.
- `src/pages/InterviewIndex.jsx` — card grid with semantic search.
- `src/pages/PlaylistBuilder.jsx` — cross-interview clip assembly.
- `src/pages/TopicGlossary.jsx` — force-directed graph of AI-curated topics.
- `src/pages/ReviewQueue.jsx` — admin UI for the human-review gate (consumes Firestore `review_queue`).
- `src/index.css` — accessibility tokens (`.text-civil-red-body` etc.), focus-visible global rule, prefers-reduced-motion handling.

### Cloud Functions (functions/index.js)
- `generateEmbedding` — deterministic-ID idempotent (commit `ec94c5d`).
- `vectorSearch` — embedding-dimensionality filter guards against NaN poisoning.
- `submitCannyFeedback` — feedback shim.

### MCP server (mcp-server/)
- `server.mjs` — three tools (`search_transcripts`, `get_transcript`, `list_leaders`).
- `fly.toml`, `Dockerfile`, `.dockerignore` — Fly.io deploy package (app name placeholder `civil-rights-history-mcp`).

### RAG layer (rag/)
- `ingest.mjs` — Pinecone ingest with idempotent content-hash diffing.
- `retrieve.mjs` — Two-stage Pinecone hybrid → Voyage rerank-2.
- `.env.example` — Required env vars: `PINECONE_API_KEY`, `PINECONE_HOST`, `VOYAGE_API_KEY`.

### Validation commands
- `npm run build` — React build (from project root)
- `node --check functions/index.js` — Cloud Functions parse-check
- `node --check mcp-server/server.mjs` — MCP server parse-check
- `cd "Metadata Generation System" && python -m compileall -q processor/` — Python pipeline compile-check
- `cd "Metadata Generation System" && python scripts/validate_facts.py` — Ground-truth corpus validate
- `.github/workflows/ci.yml` runs all five in parallel on every push

---

## 6. Specific traps and gotchas (read before editing)

### ASR-bleed artifacts in transcripts/corrected/

The Whisper ASR pipeline that produced `transcripts/corrected/` occasionally MERGES adjacent figures into one phantom name. Pass 7 caught several. Most critical:

- **Entry 62 (John Carlos)**: Every Paul Robeson reference in the corrected `.txt` reads "Paul Hoffman Robeson" — Paul Hoffman (Harvard rower / OPHR button courier) was merged into every Robeson mention. Will hallucinate a fake person in downstream summaries. **Codex must repair before pipeline run.**
- **Entry 62**: Siblings list reads "Earl, Adam Clayton Powell Sr, Andrew" — ACP Sr. is an ASR bleed from the Abyssinian Baptist Church passage two paragraphs later.
- **Entry 20 (Clarence B. Jones)**: "Daniel H. Krenge De Iongh't" repeatedly substitutes for "don't" (processor anomaly cascading from the canonical-name correction for Crena de Iongh).

### Cross-entry pollution caught in Pass 7

- **Entry 93 (Mtume)**: "Pinto Union" cross-contaminated from entry 86 (Camarillo) — zero occurrences in #93's transcript.
- **Entry 102 (Blake)**: Hank Thomas / Sammy Davis Jr. cross-refs bled from entry 103 (Hayling).
- **Entry 60 (Mulholland)**: "Quaker-influenced" + ARA-drills/communist-dupe likely cross-contam from entry 30 (Zellner).

### Hard-stop pipeline gate

- **Entry 112 (Ruby Sales)**: Row 112.P2.45 has a meaning-INVERTING fix in the corrected text — "I was in dead" → "I was not dead." The pipeline MUST consume the corrected `.txt` (not raw Whisper), or it will publish the opposite of Sales' canonical survival testimony.

### NOT a bug

- The legacy `llm-hyper-audio` references in `scripts/firebase/*.cjs` are by filename only — the actual SA JSON files are gitignored. Don't try to "fix" the filenames.
- `score_chapters_batch` in `tuning.py` returns an empty list on length mismatch — this is intentional fallback to per-chapter scoring.
- `MobileAdvisory` was deleted on 2026-05-21 (commit `783d419`) after mobile audit closed the issues it hedged. References in earlier commit messages are historical.
- Three reds: `text-red-500` (Tailwind `#F2483C` brand) for large text only; `text-civil-red-body` (custom utility `#B23E2F`) for normal text per WCAG AA. See `src/index.css`.
- The Whisper transcription-loop triplication artifact at entry #87 (Matthew Perry Jr.) is documented in AUDIT_TRAIL — be aware when reading that transcript.
- 4 entries with `source_dir` set but zero audit-able content: #28 Abernathy Family, #46 Geraldine Bennett+, #64 John Dudley+, #95 Patricia Crosby+ — these are SKIPPED set members (multi-speaker pipeline failures). NOT bugs; documented.
- Entry #75 is a joint-interview redirect of #74 + #79 (Dorie + Joyce Ladner).

### Things to verify before recommending from memory

Project-level CLAUDE.md states: "A memory that names a specific function, file, or flag is a claim that it existed when the memory was written. It may have been renamed, removed, or never merged. Before recommending it: if the memory names a file path, check the file exists; if the memory names a function or flag, grep for it; if the user is about to act on your recommendation (not just asking about history), verify first."

---

## 7. Audit session history (one paragraph each)

**Session 1 (2026-05-21)** — Pass 1 initial Whisper-correction sweep. Single-conversation, sequential per-entry. ~3,000 corrections across 132 entries. 14 entries hit Read-tool 25K-token cap → partial reads (tails covered in Session 2 Phase B). Surfaced 4 SKIPPED entries (empty-source-directory multi-speaker pipeline failures) + 1 severely-degraded transcript (#109 McClary). 3 source-level mid-sentence truncations: #59 Lawson, #67 Howell, #69 Richardson.

**Session 2 (2026-05-22)** — Pass 2 + tail-sweep + Pass 3 + corpus expansion. 4 phases. Phase A: 18 parallel supervisor subagents ran Pass 2 across entries #43-#132 (~4,000 corrections). Phase B: 14 parallel tail-sweep subagents covered the 14 byte-cap-truncated tails of #1-#42 (~870 corrections). Phase C: 26 parallel Pass-3 supervisors consolidated confidence + adversarial-review flags across all 127 audit-able entries. Phase D: corpus expansion 60→140 entries via 80 new canonical figures.

**Session 3 (2026-05-22 evening)** — Audit hygiene + pipeline preprocessor + Pinecone+Voyage RAG scaffolding + aigamma Voyage-3 migration. Phase 1: cross-contamination cleanup (22 items) + catalog back-fill (792 patterns) + adversarial-review feed (825 items). Phases 3+4: `scripts/apply_corrections.py` + `rag/` scaffolding with 57 passing tests + `docs/RAG_SUBSTRATE_DECISION.md`. Voyage-3 migration to aigamma.com Supabase as bonus.

**Session 4 (2026-05-22 later, parallel to Session 3)** — Pass 4 sweeping QA + fact-check across all 127 entries via STRICT one-transcript-per-agent isolation (cross-contamination firewall enforced architecturally via `transcripts/per_entry_slices/`). 128 subagent invocations (127 unique + 1 retry). ~2,500 net-new catches, ~250 promotions, ~100 demotions, ~1,500 fact-check verifications, ~30 cross-contamination retractions, ~120 Subject-paragraph publication-blocking corrections surfaced (became OPEN_PROBLEMS Problem 8 — closed by Pass 7).

**Session 3 follow-on Layer 5 (2026-05-23)** — Corpus-global fidelity sweep. 4 dimensions: D1 (939 phantom Whisper renderings), D2 (628 bidirectional canonical inconsistencies), D3 (191 catalog-vs-per-entry contradictions), D4 (0 cross-entry biographical inconsistencies — methodology-limited). 1,758 total advisory findings. High-confidence subset auto-applied via `transcripts/fix_layer5_findings.py`: 770 low-impact phantom removals, 7 D2 normalizations, 130 canonical-figure annotations. Remainder annotated for ensemble.

**Session 5 (2026-05-23 → 2026-05-24)** — Pass 6 low-confidence residual QA. **Retrospective entry — original session ended without committing, causing a ~24-hour governance gap.** Four tracks: (1) per-entry readiness scoring v1 via `calculate_transcript_readiness.py`; (2) heuristic mutation sweep via `run_qa_batch.py` (19 entries / 57 files modified for 13 hardcoded Whisper→canonical patterns); (3) 40 adversarial-resolution subagents on the highest-density D2-ambiguous entries (82 items resolved); (4) 11 layer5_pending subagents (218 items resolved). All applied to master MD via `apply_low_conf_resolutions.py`. D2-ambiguous markers reduced 1,174 → 912.

**Session 6 (2026-05-24, overnight)** — Pass 7 Publication Readiness Review (PRR). 127 parallel Sonnet 4.6 subagents in 7 batches of 12-22 each, strict one-transcript-per-agent firewall. Per-entry deliverable: Subject paragraph audit + cross-pass coherence check + ground-truth proposals + v2 readiness score + publication verdict. Merged into master MD via `merge_pass7.py` (+3.12 MB). Three aggregation JSONs: readiness_ledger_v2 (127 entries, mean score 97.5), subject_paragraph_corrections_pass7 (106 entries / 330 claims — closes Problem 8), ground_truth_proposals_pass7 (88 entries / 251 unique names). One entry NOT-READY (#109 McClary, needs re-transcription).

---

## 8. Key commits to know (recent history)

- `ec94c5d` — `functions/index.js` deterministic embedding-ID fix (deploy-blocking)
- `ea69ae4` — Pass 6 retrospective: scripts + ledgers + slices + resolutions committed after 24-hr governance gap
- `92becc8` — Pass 6 Track 3 + Track 4 apply-back to master MD (262 D2 markers cleared)
- `7b603fa` — `apply_corrections.py` re-run: refreshed 127 manifests + 78 text files
- `1499d0d` — Pass 7 setup: PASS7_DESIGN.md + Session 6 placeholder + slice regen
- `dcd6243` → `15f9a1c` — Pass 7 batches 1-7 + final (127 PRR stage files)
- `ca5a414` — Pass 7 merge + aggregation + Problem 8 RESOLVED-IN-PRINCIPLE

---

## 9. When in doubt

- Read `transcripts/AUDIT_TRAIL.md` for the full audit history.
- Read `transcripts/OPEN_PROBLEMS.md` for what's still open.
- Read the per-entry Pass 7 PRR staging file (`transcripts/pass7_stage/entry_NNN_*.md`) for the publication verdict on any specific interview.
- Pre-existing scripts in `transcripts/*.py` are reference patterns — don't reinvent. Use `fix_layer5_findings.py` helpers.
- The CLAUDE.md (project root) "Things that look broken but aren't" section is a checklist worth reading once.
- If unsure whether a memory or convention is still load-bearing, **verify against current code/git** before acting.

**Welcome to the project. The audit is done. Now ship it.**

— Claude Opus 4.7, 2026-05-24
