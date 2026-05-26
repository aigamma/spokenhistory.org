# RAG layer operations runbook

Short operational reference for the post-deploy phase. What to do
when something breaks, how to rotate, what to monitor. Sister doc to
`rag/ENDPOINTS.md` (reference) and `rag/NEXT_SESSION_PICKUP.md`
(orientation for new agents).

## Key rotation

### Voyage AI

Voyage is the cheaper of the two services and the simplest to rotate.

1. Generate a new key at https://dash.voyageai.com/ → keys
2. Update the key in three places:
   - **Netlify:** Project → Site settings → Environment variables → update `VOYAGE_API_KEY`. Then trigger a redeploy (empty commit + push, or "Trigger deploy" in the dashboard) so the function picks up the new value.
   - **Fly.io (MCP server):** `flyctl secrets set VOYAGE_API_KEY=... -a civil-rights-history-mcp` then `flyctl deploy`.
   - **Local development:** edit `rag/.env.local` and `mcp-server/.env.local`.
3. Verify with `bash scripts/demo-queries.sh nonviolence` — should return results.
4. Revoke the old key in the Voyage dashboard.

### Pinecone

The civil-rights index is co-mingled with worldthought in one Pinecone project. Rotating the key affects BOTH systems.

1. Generate a new project-scoped key in the Pinecone console.
2. Update `PINECONE_API_KEY` in:
   - Netlify (civil-rights-staging + worldthought.com if shared)
   - Fly.io (mcp-server)
   - Local `rag/.env.local`
   - worldthought's equivalent env files
3. Redeploy or wait for Netlify env-cache cycle.
4. Verify with `curl ... describe_index_stats` from `rag/NEXT_SESSION_PICKUP.md`.
5. Revoke old key.

If/when civil-rights migrates to its own Pinecone project, key rotation becomes independent of worldthought.

## What to monitor

Day-of-conference / day-of-demo, watch these signals (~5-min cadence):

1. **`https://civil-rights-staging.netlify.app/retrieve` POST response**
   ```bash
   curl -sS -X POST -H "Content-Type: application/json" \
     -d '{"query":"test","topN":1}' \
     https://civil-rights-staging.netlify.app/retrieve | head -c 200
   ```
   Should return JSON with a `results` array. Common failure modes:
   - `server_misconfigured` → env vars missing or not propagated; redeploy
   - `retrieval_failed status=429` → Voyage rate limit; back off
   - `retrieval_failed status=5xx` → Pinecone or Voyage upstream issue; wait
   - timeout / no response → Netlify function or DNS issue

2. **Pinecone index vector count**
   ```bash
   curl -sS -H "Api-Key: ${PINECONE_API_KEY}" \
     -H "X-Pinecone-API-Version: 2024-07" \
     https://civil-rights-odc9z70.svc.aped-4627-b74a.pinecone.io/describe_index_stats
   ```
   Should return `totalVectorCount: 15464`. Drift means something destructive happened — investigate immediately before re-ingesting.

3. **Latest CI run on master**
   ```bash
   gh run list --repo aigamma/civil-rights-history-project --workflow=ci.yml --limit 1
   ```
   Should be `success`. A failure means a recent commit broke parse-checks or the tiers.test.mjs unit tests.

4. **Latest Netlify deploy**
   Via Netlify MCP: `get-project` on the civil-rights-staging siteId. `currentDeploy.state` should be `ready`. If `failed`, check the deploy log for build errors.

## Abuse response

The `/retrieve` Netlify Function is public (no auth) and has no rate-limiting at the function level. Voyage embed calls cost real money (~$0.10/1M tokens). A determined attacker could run up bills.

**If you notice unusual cost or query volume:**

1. **Immediate mitigation:** rotate `VOYAGE_API_KEY` to break the attacker's request flow.
2. **Edge-level rate limit:** add Cloudflare or Netlify Edge Function in front of `/retrieve`. Per-IP throttle to say 10 req/min.
3. **CAPTCHA gate:** require a one-time CAPTCHA on first query per session (server.mjs has a similar architectural plug-point comment).
4. **Auth gate:** require a JWT or session cookie. The site is already behind Email/Password auth; the function could check for that auth cookie.

The MCP server's `/mcp` endpoint has the same risk profile and the same mitigation options.

## Reingestion after corpus changes

If `transcripts/corrected/` changes (corrections applied, new entries added):

```bash
# 1. Refresh the MCP server's leaders.json
cd mcp-server && npm run build:leaders && cd ..

# 2. Re-ingest (idempotent on content hash — only changed chunks re-embed)
node --env-file=rag/.env.local rag/ingest.mjs

# 3. (Optional) Prune orphans from deleted entries — protected by 50% safety threshold
node --env-file=rag/.env.local rag/ingest.mjs --prune

# 4. Regenerate precompute artifacts
node --env-file=rag/.env.local rag/precompute.mjs

# 5. Commit + push so Netlify rebuilds with new public/rag/ files
git add public/rag mcp-server/data
git commit -m "Reingest + precompute regen $(date +%Y-%m-%d)"
git push
```

### Safety flags

- **`--force-prune`** on `ingest.mjs` bypasses the 50% orphan-ratio safety threshold. Use ONLY when the large prune is intentional (e.g., the 2026-05-26 `.srt`-only switch that dropped 62% of the index). Without it, the script exits with status 2 + an explanatory error rather than silently nuking the index when a typo in `PINECONE_INDEX` or wrong `corrected/` config makes everything look orphaned.

- **`--resume`** on `precompute.mjs` skips entries whose `public/rag/related/entry-N.json` already exists. Useful when a precompute run was killed midway (harness timeout, AV-blocked node process, network blip) — partial state on disk is correct, and resume picks up where it left off without redoing the completed entries. The atomicity invariant: each entry's JSON is written atomically when its loop iteration ends, so `file exists` implies `this entry was fully processed by some earlier run`.

## Cost ceiling

Steady-state expected monthly cost:

- Pinecone Builder: $20/mo (shared with worldthought)
- Voyage AI: $1-5/mo at moderate usage
- Netlify Functions: included in current plan
- Fly.io (MCP server, when deployed): $5-10/mo

**Worst-case abuse (no rate-limit, sustained 1M queries):**

- Voyage embed: ~$100 if a malicious actor sustains heavy traffic for hours
- Pinecone queries: bounded by Builder tier limits
- Fly.io: bounded by VM auto-scale

The cost ceiling is the right reason to enable edge rate-limiting before the connector becomes broadly known.

## Disaster recovery

If the Pinecone index is wiped or corrupted:

1. Re-run `rag/ingest.mjs` (full re-ingest from `transcripts/corrected/`). Takes ~30 min wall-clock at the bumped batch size. Cost: ~$0.80 in Voyage embedding.
2. Re-run `rag/precompute.mjs` against the repopulated index. Takes ~30 min.
3. Commit + push regenerated `public/rag/*.json` artifacts.

If `transcripts/corrected/` is the loss, recover from git history (`git log --all -- "transcripts/corrected/<dir>/"`) or re-apply corrections from `transcripts/CLEANED_TRANSCRIPTS_REVIEW.md` against `transcripts/raw/`.

If the Netlify Function code is the loss, restore from git history — the function is in `netlify/functions/retrieve.mjs`.

If everything is the loss, the corpus + audit work is reconstructable from the LoC source transcripts + the audit overlay in this repository. Treat the repository as the canonical reproduction artifact.
