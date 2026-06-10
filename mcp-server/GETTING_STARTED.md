# Getting Started: The Civil Rights History Archive Connector

A from-scratch guide to using the Civil Rights History Project oral history
archive inside an AI tool. No prior knowledge assumed. If you have never set up
an MCP connector before, start here and read top to bottom. If you just want the
URL: it is **`https://mcp.spokenhistory.org/mcp`** (and the always-available
fallback `https://civil-rights-history-mcp.fly.dev/mcp`).

---

## 1. What this is, in one minute

**MCP (Model Context Protocol)** is an open standard that lets an AI assistant
(Claude, or a tool like Codex) call external tools and read external data
through a small server. You point your AI tool at a server's URL once, and from
then on the assistant can use that server's tools during a conversation.

**This connector** is one such server. It exposes the Library of Congress /
Smithsonian NMAAHC **Civil Rights History Project**: 140 long-form oral history
interviews (roughly 250 hours of recorded testimony from people who lived the movement)
as searchable, citation-grade data. It is not a chatbot. It is a primary-source
**citation oracle**: every answer your AI gives through it is grounded in an
actual interviewee's words, anchored to a Library of Congress catalog URL, and
timestamped to the exact second in the audio.

Why that matters: many of these interviewees have since passed away. The
recorded testimony is, for some, the last accessible primary source on their
lived experience inside the movement. This connector lets an AI reach that
material and cite it correctly.

**It is free, public, and read-only.** There is no login, no API key, and no
account. The server does not log your queries or retain any user data.

---

## 2. Pick your client

| Your AI tool | How it connects | Jump to |
|---|---|---|
| **Codex** (or another tool-only client that runs local commands) | Through a tiny bridge called `mcp-remote` | [Section 3](#3-connect-from-codex) |
| **Claude Desktop** | Paste the URL into the config file | [Section 4](#4-connect-from-claude-desktop) |
| **claude.ai** (web) | Add a Custom Connector in settings | [Section 5](#5-connect-from-claudeai) |
| Anything else that speaks MCP | Point it at the URL, transport is "Streamable HTTP" | [Section 6](#6-other-clients) |

---

## 3. Connect from Codex

### Why Codex needs a bridge

Codex expects each MCP server to be a **local program it launches on your
machine** that talks over stdin/stdout (a transport called "stdio"). Our server
is **remote**: it runs in the cloud and speaks HTTP. The two do not talk
directly, so we put a tiny, widely used adapter in between called
[`mcp-remote`](https://www.npmjs.com/package/mcp-remote). Codex launches
`mcp-remote` locally; `mcp-remote` forwards everything to the cloud server over
HTTP and relays the answers back. You do not install anything by hand: `npx`
fetches `mcp-remote` on first use.

Prerequisite: Node.js 18+ installed (so `npx` is available). Check with
`node --version`.

### Edit your Codex config

Open your Codex config file (create it if it does not exist):

- **Windows:** `C:\Users\<you>\.codex\config.toml`
- **macOS / Linux:** `~/.codex/config.toml`

Add this block (it is the same on every operating system):

```toml
[mcp_servers.civil_rights]
command = "npx"
args = ["-y", "mcp-remote", "https://mcp.spokenhistory.org/mcp"]
startup_timeout_sec = 120
```

Do not replace the whole file if it already has content; just add the block.
Save it, then fully restart Codex.

### Verify it worked

After restarting, the connector's tools should appear in Codex's tool list. The
fastest functional check is to just ask a question that forces a tool call, for
example:

> Using the civil rights archive, find a passage where someone describes
> nonviolence as a theology, not only a tactic. Quote it with its timestamp and
> Library of Congress URL.

You should get back a real quote (for instance, from Joseph Echols Lowery) with
a timestamp like `00:26:57` and a `loc.gov/item/...` link. If you do, you are
done. If not, see [Troubleshooting](#8-troubleshooting).

---

## 4. Connect from Claude Desktop

1. Open Claude Desktop settings, then Developer, then Edit Config.
2. Add this to the `mcpServers` block:

```json
{
  "mcpServers": {
    "civil-rights-history": {
      "url": "https://mcp.spokenhistory.org/mcp"
    }
  }
}
```

3. Restart Claude Desktop. The connector appears in the tools menu, and the
   three research-pattern prompts (see Section 7) show up as slash-command-style
   prompts.

---

## 5. Connect from claude.ai

1. Settings, then Connectors, then Add Custom Connector.
2. URL: `https://mcp.spokenhistory.org/mcp`
3. Save. The tools appear in the chat composer.

---

## 6. Other clients

Any client that supports the MCP **Streamable HTTP** transport works. The
endpoint is `POST /mcp`. There is a liveness probe at `GET /healthz` (returns
`{"ok":true}`) and a readiness probe at `GET /readyz` (returns config + loaded
roster counts). The endpoint is open (no auth) and stateless (every request is
independent).

---

## 7. The tools

The connector offers eight tools. In normal use you do not call these by hand,
you ask your AI a question and it picks the right tool. The examples below show
the raw call and a trimmed response so you know what to expect.

### Browse and discovery

**`list_leaders`** lists the interviewees (people with an oral history in the
corpus) with their `entry_number`, name, and Library of Congress URL.

**`list_people`** lists the full people catalog: the 165 interviewees PLUS the
37 external historical figures who are discussed in the archive but not
themselves interviewed (Martin Luther King Jr., Ella Baker, Malcolm X, and
others). Filter with `person_type: "interviewee"` or `"external_figure"`.

```json
{"name": "list_people", "arguments": {"person_type": "external_figure", "limit": 2}}
```
```json
[
  { "slug": "a-philip-randolph", "display_name": "A. Philip Randolph",
    "person_type": "external_figure", "entry_number": null,
    "role_preview": "President of the Brotherhood of Sleeping Car Porters ..." }
]
```

**`list_essays`** lists the curated essays layer: 23 public-domain / open-license
essays (W. E. B. Du Bois, Booker T. Washington, Anna Julia Cooper, Ida B. Wells,
and others) organized under 10 themes. Pass a `topic` to filter.

### Search

**`search_transcripts`** is the workhorse: citation-grade semantic search across
the archive. Required: `query`. Optional: `limit` (default 10, max 50),
`entry_number` (restrict to one interview), `dedupe_by_entry` (one passage per
voice), `include_persons` / `include_essays` (widen the search to person pages
or essay text).

```json
{"name": "search_transcripts", "arguments": {"query": "nonviolence as theology", "limit": 1, "dedupe_by_entry": true}}
```
```json
[
  {
    "entryNumber": 66,
    "entrySubject": "Joseph Echols Lowery",
    "text": "And we discovered that it was not only effective ... we pursued that theology ...",
    "locItemUrl": "https://www.loc.gov/item/2015669122/",
    "timestampStartStr": "00:26:57",
    "timestampEndStr": "00:27:53",
    "entryProvenance": "audit-original",
    "uncertaintyTier": "high",
    "fidelityNote": "Cross-referenced line by line against the Library of Congress published transcript and confirmed aligned.",
    "suggestedCitation": "Joseph Echols Lowery, interview, Civil Rights History Project, American Folklife Center, Library of Congress in association with the Smithsonian National Museum of African American History and Culture, https://www.loc.gov/item/2015669122/, at 00:26:57–00:27:53."
  }
]
```

**`get_transcript`** returns every chunk of one interview, stitched into order,
with citation metadata on each. Use it when you want the full primary source,
not a ranked excerpt.

```json
{"name": "get_transcript", "arguments": {"entry_number": 66}}
```

### Research patterns

These three wrap search with a preset analytic framing. They exist so the
patterns work even on clients that do not route prompts to the model.

**`compare_perspectives`** (`{topic}`): how multiple interviewees discussed one
topic, deduped to one passage per voice, framed to surface agreements and
tensions rather than collapse them.

**`trace_evolution`** (`{interviewee, topic}`): passages from one interviewee
arranged chronologically, so you can see how their framing of a topic shifts
across the interview.

**`source_for_claim`** (`{claim}`): passages that bear on a claim, each to be
labeled SUPPORTS, COMPLICATES, or CONTRADICTS, with the polyphonic record kept
intact.

---

## 8. Reading the response (citation payload)

Every search result is a structured object. The fields a researcher cares about:

| Field | What it is |
|---|---|
| `entrySubject` | The interviewee's name. |
| `text` | The passage, verbatim. |
| `timestampStartStr` / `timestampEndStr` | Where in the audio it occurs (HH:MM:SS). The audio offset is the chapter anchor. |
| `locItemUrl` | The Library of Congress catalog page, the verifiable primary source. |
| `suggestedCitation` | A ready-to-paste Chicago-Manual-of-Style citation block. |
| `entryProvenance` | `audit-original` (went through the full audit cascade) or `ingestion-only`. |
| `uncertaintyTier` | Transcript-fidelity tier (see below). |
| `fidelityNote` | A one-line, plain-English statement of that transcript's fidelity. |

**Transparency is the point.** The `uncertaintyTier` and `fidelityNote` tell you
how thoroughly a given transcript was verified. The tiers collapse to two
settled states for readers: **LoC-Verified** (cross-referenced against the
Library of Congress published transcript) and **Audio-Limited Source** (the
recording itself has an inherent limit such as truncation). Pass the
`fidelityNote` through to your reader verbatim; it is a statement of fact about a
finished transcript, not a prompt to go re-verify.

---

## 9. Resources (for resource-aware clients)

Clients that support MCP resources (such as Claude Desktop) can browse these
without a tool call:

- `civilrights://corpus/overview`, counts, tier legend, and tool list.
- `civilrights://leaders`, the interviewee roster.
- `civilrights://people`, the full people catalog.
- `civilrights://essays`, the essays catalog and topic taxonomy.
- `civilrights://transcript/{entry_number}`, a full interview transcript.

---

## 10. Troubleshooting

| Symptom | Fix |
|---|---|
| **Tools do not appear after setup.** | Fully restart the client (not just reload the window). Some clients cache the tool list until a full restart. |
| **Codex: "startup timeout" or `mcp-remote` not found.** | Confirm Node.js 18+ is installed (`node --version`) so `npx` works. The first launch downloads `mcp-remote`, which can take a moment, hence `startup_timeout_sec = 120`. |
| **First query is slow (1 to 2 seconds).** | Expected. The server scales to zero when idle and takes a moment to wake on the first request after a quiet period. Subsequent calls are fast. |
| **HTTP 429 / "Rate limit exceeded".** | The public endpoint is rate-limited to protect cost. Wait the number of seconds in the `Retry-After` header and retry. Normal single-user use never hits this. |
| **A search returns nothing.** | Rephrase the query, or widen it. The corpus is 140 interviews; not every topic is present. Do not let the AI fall back to its training data, this corpus is the source of truth. |
| **The custom domain does not resolve.** | Use the direct Fly URL instead: `https://civil-rights-history-mcp.fly.dev/mcp`. |

---

## 11. Going deeper

- `USAGE_GUIDE.md` (this directory): the researcher-facing guide with worked
  examples (grant-proposal citation, quote verification, curriculum building)
  and citation-format references (Chicago / APA / MLA).
- `README.md` (this directory): engineering reference for maintainers.
- `CODEX_SETUP.md` (this directory): the local-development path (running the
  server from a clone over stdio), for contributors who want to modify it.
