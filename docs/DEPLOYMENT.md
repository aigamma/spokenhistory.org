# Deployment guide

Step-by-step instructions for getting a fresh checkout of this repo to a working production-ish state with the new Smithsonian-grade pipeline + dual-scorer publication gate fully operational. Aimed at an operator (Eric, Dustin, Jack, or any team member with admin access to the Firebase + Netlify + Fly.io accounts), not at Claude Code.

Times shown are wall-clock estimates assuming you already have the credentials handy and aren't troubleshooting.

## Prerequisites

- Node.js 20+ installed locally
- Python 3.11 installed locally
- `firebase-tools` CLI (`npm install -g firebase-tools`)
- `flyctl` CLI (`brew install flyctl` on Mac, or the Windows installer)
- `gh` GitHub CLI (`brew install gh` or scoop/winget)
- `git` configured with credentials for github.com/aigamma/civil-rights-history-project

## One-time setup (~30 minutes total)

### 1. Clone the repo + install dependencies (~3 minutes)

```bash
git clone git@github.com:aigamma/civil-rights-history-project.git
cd civil-rights-history-project
npm install
cd functions && npm install && cd ..
cd mcp-server && npm install && cd ..
cd "Metadata Generation System" && pip install -r requirements.txt && cd ..
```

### 2. Set up the local .env (~5 minutes)

Copy `.env.example` to `.env` and fill in the six `VITE_FIREBASE_*` values from the Firebase Console:
- Open https://console.firebase.google.com/project/civil-rights-history-project/settings/general
- Scroll to "Your apps" → the Web app → "SDK setup and configuration" → "Config"
- Copy each `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId` into the matching `VITE_FIREBASE_*` line in `.env`

Then add:
- `OPENAI_API_KEY=sk-proj-...` from https://platform.openai.com/api-keys (generate a new project key if you don't have one)
- `ANTHROPIC_API_KEY=sk-ant-...` from https://console.anthropic.com/settings/keys
- `USE_DUAL_SCORING=1` (enables the Claude Opus 4.7 second-opinion scorer)

Verify with: `node scripts/preflight.mjs`. Should report 8 of 9 PASS. The one expected FAIL is the Firebase service-account JSON which we handle next.

### 3. Download the Firebase service-account JSON (~2 minutes)

- Open https://console.firebase.google.com/project/civil-rights-history-project/settings/serviceaccounts/adminsdk
- Click "Generate new private key"
- Save the downloaded JSON to `scripts/firebase/civil-rights-history-project-firebase-adminsdk.json` (the `scripts/firebase/` dir is gitignored). NEVER commit this file.

Re-run `node scripts/preflight.mjs`. Should now report 9 of 9 PASS.

### 4. Enable Blaze billing on the Firebase project (~5 minutes)

Required for Cloud Functions (the free Spark plan doesn't allow Functions). The Cloud Functions on this project (`generateEmbedding`, `vectorSearch`, `submitCannyFeedback`) call OpenAI's API; without Functions deployed, the React app falls back to a degraded experience (no semantic search, no Canny feedback submission).

- Open https://console.firebase.google.com/project/civil-rights-history-project/usage/details
- Click "Modify plan" or "Upgrade to Blaze"
- Link a billing account (use the WWU billing account if the team has one; otherwise a personal card with the WWU pilot grant reimbursing later)
- Set a budget alert at $20/month so you get an email if anything runs away. Expected actual cost: <$5/month for the current traffic level.

### 5. Push the OpenAI key into Firebase Functions secrets (~1 minute)

```bash
firebase use civil-rights-history-project
firebase functions:secrets:set OPENAI_API_KEY
# Paste the same OpenAI key from your local .env when prompted
```

### 6. Deploy the Cloud Functions (~3 minutes)

```bash
firebase deploy --only functions
```

Watch for "deploy complete" with no error lines. If there are errors, they're almost always about Blaze billing not being active yet, step 4 needs to be visible in the console before this works.

### 7. Authenticate with Fly.io and deploy the MCP server (~5 minutes)

```bash
cd mcp-server
flyctl auth login        # opens a browser; complete the OAuth flow
flyctl deploy            # the fly.toml + Dockerfile in this dir handle the rest
cd ..
```

After deploy, the MCP server is at `civil-rights-mcp.fly.dev` (or whatever the fly.toml has named it). Verify with `flyctl logs` from the `mcp-server/` directory.

### 8. Confirm Netlify staging is current (~1 minute)

- Open https://app.netlify.com/projects/civil-rights-staging
- Confirm the latest commit shown matches `git log -1 --format=%H` on your local main
- The OpenAI key should already be in the Netlify env var vault (set during the May 2026 overhaul); verify under Project settings → Environment variables

## Running the pipeline on a transcript (~5 minutes per transcript)

```bash
# Single-transcript end-to-end test
node scripts/preflight.mjs                                          # 9-check sanity gate
python "Metadata Generation System/run_sample.py" "Sherrod"         # by interviewee surname
# OR
python "Metadata Generation System/run_sample.py"                   # smallest transcript (default)

# Push the resulting JSON to Firestore
node scripts/pipeline-to-firestore.mjs \
    --input "Metadata Generation System/run_sample_output.json" \
    --service-account scripts/firebase/civil-rights-history-project-firebase-adminsdk.json \
    --both-collections
```

`--both-collections` writes to both `interviewIndex` (the listing-page schema) AND `interviewSummaries` (the legacy detail-page schema). The React app reads from both depending on the page; until the upstream finishes its V1→V2 migration, populating both is the way to make every page work.

Expected per-transcript cost: **~$0.04 in OpenAI + Anthropic API credits**, ~64 seconds wall-clock. Measured on the 152-line Maynard E. Moore PoC on 2026-05-22.

## Running the full 135-transcript corpus (~3 hours, ~$5.40 in API credits)

There's no batch script yet, the recommended approach is a shell loop over `transcripts/raw/`:

```bash
cd transcripts/raw
for d in */; do
  name=$(basename "$d")
  echo "Processing: $name"
  python "../../Metadata Generation System/run_sample.py" "$name"
  node "../../scripts/pipeline-to-firestore.mjs" \
       --input "../../Metadata Generation System/run_sample_output.json" \
       --service-account "../../scripts/firebase/civil-rights-history-project-firebase-adminsdk.json" \
       --both-collections
done
cd ../..
```

The pipeline is idempotent on `interviewIndex/{slug}` via `merge=true` in the bridge script, so re-running picks up where it left off without duplicating writes.

## Pushing to upstream (`jsovelove/civil-rights-history-project`)

```bash
gh pr create --base master --head master \
    --title "Smithsonian-grade overhaul: dual-scorer + citation auditor + WCAG 2.2 AA audit" \
    --body "$(cat docs/ACCESSIBILITY.md | head -50)"
```

Currently 130+ commits ahead. Recommend opening as a draft PR first so the upstream maintainer (`jsovelove`) can review the structure before the full diff lands.

## Troubleshooting

- **Vite build fails locally on Windows**: use PowerShell (not WSL bash), `Set-Location C:\civil; & node node_modules\vite\bin\vite.js build`. WSL bash segfaults on Vite builds on the project lead's Windows machine; PowerShell completes in ~6 seconds.
- **Pipeline crashes with `UnicodeEncodeError: 'charmap' codec can't encode '✓'`**: the UTF-8 fix in `Metadata Generation System/app.py` should prevent this, but if it surfaces in a new path, set `PYTHONIOENCODING=utf-8` in your environment.
- **`enqueue_for_review returned None`** during pipeline run: documented graceful-degradation when firebase-admin isn't configured. The summary's publication decision still stands; it just doesn't push to the Firestore review queue. Drop the service-account JSON in `scripts/firebase/` and re-run with `USE_DUAL_SCORING=1` to fix.
- **Cloud Functions deploy says "billing is required"**: step 4 above wasn't fully applied. Wait 1-2 minutes after enabling Blaze for the change to propagate, then retry.

## RAG layer (added 2026-05-26)

The Pinecone + Voyage retrieval layer landed on top of this deployment
chain as a parallel surface (not a replacement for any existing piece).
Its own deployment story is documented separately:

- `rag/README.md`, substrate architecture, current status, key setup steps
- `rag/OPERATIONS.md`, key rotation, monitoring, abuse response, DR, cost ceilings
- `rag/ENDPOINTS.md`, one-page URL/identifier/env-var reference
- `rag/NEXT_SESSION_PICKUP.md`, fresh-eyes orientation for an agent resuming work
- `mcp-server/USAGE_GUIDE.md`, audience-facing MCP connector documentation

The RAG layer is **already live** as of 2026-05-26: Pinecone index
populated (15,464 vectors), `/retrieve` Netlify Function deployed,
`/rag-explore` page deployed with four interactive tabs. The MCP
server is rewired and locally smoke-tested but not yet deployed to
Fly.io (blocked on `flyctl auth login`).

## See also

- `CLAUDE.md`, Claude-Code-side architectural guide
- `docs/ACCESSIBILITY.md`, WCAG 2.2 AA audit report
- `README.md`, project overview + "What's new in May 2026"
- `CONTRIBUTORS.md`, ledger of who built what
