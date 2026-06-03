# Deployment guide

Step-by-step instructions for getting a fresh checkout of this repo to a working production-ish state. Aimed at an operator (Eric, Dustin, Jack, or any team member with admin access to the Netlify + Firebase + Fly.io accounts), not at Claude Code.

Times shown are wall-clock estimates assuming you already have the credentials handy and aren't troubleshooting.

## Architecture in one paragraph (read this first)

**The live site is static-JSON-backed, not Firestore-content-backed.** The metadata pipeline writes per-interview JSON files into the repo under `public/rag/`, and Netlify serves those files as static assets. Firestore is NOT the content store. It backs only the Email/Password auth gate and the (currently unused) `review_queue` collection. The Cloud Functions and the MCP server are optional/secondary surfaces, not load-bearing for the site rendering.

The content data path is:

```
authored inputs + raw Whisper transcript
  -> transcripts/ingestion/onboard_interview.py        (LoC heal, chapterization, assembly)
  -> public/rag/summaries/pipeline_output/entry_<N>.json   (one per interview, 140 total)
  -> derived artifacts under public/rag/                (toc.json, playlist_index.json,
       related/, centroids.json, constellation.json, summaries/*.json, people/, curriculum/)
  -> served statically by Netlify
```

Semantic search runs on a separate path: the per-interview passages and the person pages are embedded with Voyage `voyage-3` and upserted into the Pinecone index `civil-rights`; the frontend queries them through the `netlify/functions/retrieve.mjs` server-side proxy (which keeps the Pinecone + Voyage keys out of the client bundle).

The corpus is **140 interviews** (entry IDs 1 to 142, with gaps at 31 and 95). Production deploys to **spokenhistory.org** (Netlify, `master` branch); staging is **civil-rights-staging.netlify.app**. The repo is the standalone `aigamma/spokenhistory.org`; production cut over from robotlogic.org on 2026-06-02.

## Prerequisites

- Node.js 20+ installed locally
- Python 3.11 installed locally
- `firebase-tools` CLI (`npm install -g firebase-tools`)
- `flyctl` CLI (`brew install flyctl` on Mac, or the Windows installer)
- `gh` GitHub CLI (`brew install gh` or scoop/winget)
- `git` configured with credentials for github.com/aigamma/spokenhistory.org

## One-time setup (~30 minutes total)

### 1. Clone the repo + install dependencies (~3 minutes)

```bash
git clone git@github.com:aigamma/spokenhistory.org.git
cd spokenhistory.org
npm install
cd functions && npm install && cd ..
cd mcp-server && npm install && cd ..
cd "Metadata Generation System" && pip install -r requirements.txt && cd ..
```

### 2. Set up the local .env (~5 minutes)

Copy `.env.example` to `.env` and fill in the six `VITE_FIREBASE_*` values from the Firebase Console. These drive the Email/Password **auth gate only** (the site reads its content from static JSON, not Firestore), but they are still required for the app to mount:
- Open https://console.firebase.google.com/project/civil-rights-history-project/settings/general
- Scroll to "Your apps", the Web app, "SDK setup and configuration", "Config"
- Copy each `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId` into the matching `VITE_FIREBASE_*` line in `.env`

For the semantic-search layer (the Pinecone + Voyage retrieval path behind `netlify/functions/retrieve.mjs`), the keys live in `rag/.env.local` (gitignored) and in the Netlify env vars, see step 8. They are not part of the client `.env`.

If you also intend to run the Python metadata pipeline locally, add:
- `OPENAI_API_KEY=sk-proj-...` from https://platform.openai.com/api-keys (generate a new project key if you don't have one)
- `ANTHROPIC_API_KEY=sk-ant-...` from https://console.anthropic.com/settings/keys
- `USE_DUAL_SCORING=1` (enables the Claude Opus second-opinion scorer)

Verify with: `node scripts/preflight.mjs`. Should report 8 of 9 PASS. The one expected FAIL is the Firebase service-account JSON which we handle next (only needed for the optional Cloud Functions and review-queue paths, not for serving site content).

### 3. Firebase service-account credentials (optional, ~2 minutes)

Only needed if you intend to run the optional Cloud Functions or push to the (currently unused) Firestore `review_queue` collection. The live site does NOT need this to serve content. Note: the org policy on this project disallows downloading service-account JSON keys, so prefer Application Default Credentials (`gcloud auth application-default login`) where a script accepts them. Where a JSON key is genuinely required, generate it at https://console.firebase.google.com/project/civil-rights-history-project/settings/serviceaccounts/adminsdk and save it to `scripts/firebase/civil-rights-history-project-firebase-adminsdk.json` (the `scripts/firebase/` dir is gitignored). NEVER commit this file.

Also under Authentication, add the team-shared user (Authentication > Users > Add user) so the auth gate has a login the team can share. This is what unlocks the protected pages on staging.

Re-run `node scripts/preflight.mjs`. Should now report 9 of 9 PASS once credentials are present.

### 4. Enable Blaze billing on the Firebase project (~5 minutes, optional)

Required only if you deploy Cloud Functions (the free Spark plan doesn't allow Functions). The Cloud Functions on this project (`generateEmbedding`, `vectorSearch`, `submitCannyFeedback`) are a secondary surface; the live site's semantic search runs through the Pinecone + Voyage path behind `netlify/functions/retrieve.mjs`, not these Functions. Skip this step entirely if you are not deploying Functions.

- Open https://console.firebase.google.com/project/civil-rights-history-project/usage/details
- Click "Modify plan" or "Upgrade to Blaze"
- Link a billing account (use the WWU billing account if the team has one; otherwise a personal card with the WWU pilot grant reimbursing later)
- Set a budget alert at $20/month so you get an email if anything runs away. Expected actual cost: <$5/month for the current traffic level.

### 5. Push the OpenAI key into Firebase Functions secrets (~1 minute, optional)

Only if you are deploying the optional Cloud Functions.

```bash
firebase use civil-rights-history-project
firebase functions:secrets:set OPENAI_API_KEY
# Paste the same OpenAI key from your local .env when prompted
```

### 6. Deploy the Cloud Functions (~3 minutes, optional)

```bash
firebase deploy --only functions
```

Watch for "deploy complete" with no error lines. If there are errors, they're almost always about Blaze billing not being active yet, step 4 needs to be visible in the console before this works. These Functions are a secondary surface; the site renders and searches without them.

### 7. Authenticate with Fly.io and deploy the MCP server (~5 minutes, optional)

```bash
cd mcp-server
flyctl auth login        # opens a browser; complete the OAuth flow
flyctl deploy            # the fly.toml + Dockerfile in this dir handle the rest
cd ..
```

After deploy, the MCP server is at `civil-rights-mcp.fly.dev` (or whatever the fly.toml has named it). Verify with `flyctl logs` from the `mcp-server/` directory.

### 8. Confirm Netlify is current + check env vars (~1 minute)

Production deploys to **spokenhistory.org** from the `master` branch; **civil-rights-staging.netlify.app** is the staging mirror.

- Open the Netlify project dashboard (https://app.netlify.com/projects/civil-rights-staging for staging)
- Confirm the latest commit shown matches `git log -1 --format=%H` on your local `master`
- Under Project settings, Environment variables, confirm:
  - The six `VITE_FIREBASE_*` vars (auth gate)
  - `SECRETS_SCAN_OMIT_KEYS` lists those six `VITE_FIREBASE_*` keys, or the Netlify secrets scanner blocks the deploy
  - The Pinecone + Voyage vars that `netlify/functions/retrieve.mjs` reads: `PINECONE_API_KEY`, `PINECONE_HOST`, `PINECONE_INDEX`, `VOYAGE_API_KEY`, `VOYAGE_MODEL`, `VOYAGE_RERANK_MODEL`. Set these as non-secret env vars; the `is_secret=true` + `context="all"` combination silently rejects the upsert (see `rag/OPERATIONS.md`).

## Onboarding a new interview (the current content path)

New interviews are added through the single-command ingestion script, NOT through a Firestore write. The script runs the LoC heal, chapterization, and assembly, and writes the per-interview JSON into `public/rag/`, which Netlify serves statically.

```bash
node scripts/preflight.mjs                                          # 9-check sanity gate
python transcripts/ingestion/onboard_interview.py "<Subject>_interview_<YYYYMMDD>_<HHMMSS>"
```

This produces `public/rag/summaries/pipeline_output/entry_<N>.json` for the interview. (For the historical seven-pass workflow and the LoC-healing internals, see `transcripts/ingestion/README.md` and `transcripts/loc_healing/`.)

After the per-interview JSON lands, regenerate the derived artifacts so the rest of the site tracks the new content:

- `python scripts/build_playlist_index.py` rebuilds `public/rag/playlist_index.json` (must be re-run after any re-chapterization, since the static playlist reads chapter boundaries from it)
- the other derived artifacts under `public/rag/` (`toc.json`, `related/`, `centroids.json`, `constellation.json`, the per-interview `summaries/*.json`, `people/`, `curriculum/`) are regenerated by their respective build scripts under `scripts/` and `rag/`

There is no `pipeline-to-firestore.mjs` step in the live content path. Firestore holds the auth gate and the unused `review_queue` collection only.

## Updating the semantic-search index (Pinecone + Voyage)

Search is served from the Pinecone index `civil-rights` (Voyage `voyage-3` embeddings, 1024-dim, cosine, plus `rerank-2`), queried through `netlify/functions/retrieve.mjs`. After content changes, re-embed and upsert:

```bash
# transcript-passage vectors + person-page vectors in one run
node --env-file=rag/.env.local rag/ingest.mjs --include-persons

# person-page vectors only (after a person-page content edit)
node --env-file=rag/.env.local rag/ingest.mjs --persons-only
```

Ingest is idempotent on a content hash, so only changed documents are re-embedded. The index currently holds roughly 16K passage vectors across the 140 interviews plus one vector per person page (`content_type='person'`); verify the exact count against the Pinecone console.

## Running the Python metadata pipeline directly (~5 minutes per transcript)

The standalone pipeline in `Metadata Generation System/` is still available for a single-transcript end-to-end test of the summarization + dual-scorer + citation-audit gate. Its JSON dump is the input that the onboarding path assembles into the per-interview `entry_<N>.json`.

```bash
python "Metadata Generation System/run_sample.py" "Sherrod"         # by interviewee surname
# OR
python "Metadata Generation System/run_sample.py"                   # smallest transcript (default)
```

Expected per-transcript cost: **~$0.04 in OpenAI + Anthropic API credits**, ~64 seconds wall-clock. Measured on the 152-line Maynard E. Moore PoC on 2026-05-22.

## Repository status: standalone (no upstream PR)

As of 2026-06-02 this is a **standalone repository** at `aigamma/spokenhistory.org` (the Dustin-authorized takeover). The earlier plan to open a pull request against `jsovelove/civil-rights-history-project` no longer applies. The `upstream` remote (`jsovelove/...`) is retained for provenance only; the `civil-rights-old` remote points at the prior `aigamma/civil-rights-history-project`. Day-to-day work pushes to `origin` (`aigamma/spokenhistory.org`).

## Troubleshooting

- **Local `vite build` segfaults / kills node mid-transform**: the local antivirus (Malwarebytes + Defender real-time protection) terminates spawned node/vite processes within about a second on the project lead's Windows machine, so the local production build is effectively unusable. Do not fight it; the Netlify build is the deploy gate (it will not deploy a broken build, so production is protected). For local verification, use per-file parse checks (`./node_modules/.bin/esbuild <file> --format=esm`) plus targeted greps. See the `reference_av_blocks_dev_server` note.
- **Pipeline crashes with `UnicodeEncodeError: 'charmap' codec can't encode '✓'`**: the UTF-8 fix in `Metadata Generation System/app.py` should prevent this, but if it surfaces in a new path, set `PYTHONIOENCODING=utf-8` in your environment.
- **`enqueue_for_review returned None`** during pipeline run: documented graceful-degradation when firebase-admin isn't configured. The summary's publication decision still stands; it just doesn't push to the Firestore `review_queue` collection (which is currently unused and not part of the live content path anyway). Provide Firebase credentials and re-run with `USE_DUAL_SCORING=1` if you specifically want the review-queue write.
- **Cloud Functions deploy says "billing is required"**: step 4 above wasn't fully applied. Wait 1-2 minutes after enabling Blaze for the change to propagate, then retry. (Cloud Functions are optional; the site does not require them.)
- **Search returns nothing on a fresh deploy**: confirm the Pinecone + Voyage env vars are set on Netlify as non-secret vars (step 8) and that `rag/ingest.mjs` has been run so the index is populated.

## RAG layer (Pinecone + Voyage semantic search)

The Pinecone + Voyage retrieval layer is the site's semantic-search
backbone (it powers the search and discovery features; the static JSON
under `public/rag/` carries the rendered content). Its own deployment
story is documented separately:

- `rag/README.md`, substrate architecture, current status, key setup steps
- `rag/OPERATIONS.md`, key rotation, monitoring, abuse response, DR, cost ceilings
- `rag/ENDPOINTS.md`, one-page URL/identifier/env-var reference
- `rag/NEXT_SESSION_PICKUP.md`, fresh-eyes orientation for an agent resuming work
- `mcp-server/USAGE_GUIDE.md`, audience-facing MCP connector documentation

The RAG layer is **live**: the Pinecone index `civil-rights` is
populated (roughly 16K passage vectors across the 140 interviews plus
one vector per person page; verify the exact count against the Pinecone
console), the `/retrieve` Netlify Function is deployed, and the
`/rag-explore` page is deployed with its interactive tabs. The MCP
server is rewired and locally smoke-tested; deploying it to Fly.io is
optional and was last blocked on `flyctl auth login`.

## See also

- `CLAUDE.md`, Claude-Code-side architectural guide
- `docs/ACCESSIBILITY.md`, WCAG 2.2 AA audit report
- `README.md`, project overview + "What's new in May 2026"
- `CONTRIBUTORS.md`, ledger of who built what
