// src/pages/Connect.jsx
//
// PUBLIC page (registered OUTSIDE ProtectedRoute in App.jsx). The rest of the
// site is behind a login gate, but this page must be reachable by anyone so
// outside researchers can learn how to connect the archive's MCP connector to
// their own AI tools (Codex, Claude Desktop, claude.ai). It renders standalone
// chrome and does not touch the auth context. The canonical, deeper guide lives
// at mcp-server/GETTING_STARTED.md in the repo; this page is the visible,
// on-the-web front door to it.
import { useState } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const MCP_URL = 'https://mcp.spokenhistory.org/mcp';
const FLY_URL = 'https://civil-rights-history-mcp.fly.dev/mcp';
const GETTING_STARTED_URL =
  'https://github.com/aigamma/spokenhistory.org/blob/master/mcp-server/GETTING_STARTED.md';

const CODEX_CONFIG = `[mcp_servers.civil_rights]
command = "npx"
args = ["-y", "mcp-remote", "https://mcp.spokenhistory.org/mcp"]
startup_timeout_sec = 120`;

const CLAUDE_DESKTOP_CONFIG = `{
  "mcpServers": {
    "civil-rights-history": {
      "url": "https://mcp.spokenhistory.org/mcp"
    }
  }
}`;

const TOOLS = [
  ['search_transcripts', 'Citation-grade semantic search across the archive.'],
  ['get_transcript', 'Every chunk of one interview, in order, with citations.'],
  ['list_leaders', 'The interviewee roster with entry numbers and LoC URLs.'],
  ['list_people', 'Interviewees plus the historical figures discussed in the archive.'],
  ['list_essays', 'The curated public-domain essays layer, by theme.'],
  ['compare_perspectives', 'How multiple interviewees discussed one topic.'],
  ['trace_evolution', 'One interviewee on a topic, in chronological order.'],
  ['source_for_claim', 'Passages that support, complicate, or contradict a claim.'],
];

function CopyButton({ value, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable (older browser / insecure context); the user
      // can still select the text manually, so fail quietly.
    }
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className="shrink-0 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
      aria-live="polite"
    >
      {copied ? 'Copied' : label}
    </button>
  );
}

function CodeBlock({ code }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg border border-stone-300 bg-stone-900 p-4 text-sm leading-relaxed text-stone-100">
        <code>{code}</code>
      </pre>
      <div className="absolute right-3 top-3">
        <CopyButton value={code} />
      </div>
    </div>
  );
}

export default function Connect() {
  useDocumentTitle('Connect to the Archive');

  return (
    <div className="min-h-screen bg-[#EBEAE9] font-sans text-stone-900">
      <main id="main-content" className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-civil-red-body">
          For Researchers and Developers
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Use the Archive in Your AI Tools
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-stone-700">
          The Civil Rights History Project oral history archive (140 interviews, roughly 250 hours
          of testimony from the Library of Congress and the Smithsonian NMAAHC) is available as a
          free, public connector for AI assistants. Point your tool at one URL and it can search
          and cite the archive: every result carries the interviewee, a Library of Congress
          catalog link, exact audio timestamps, and a ready-to-paste citation. There is no
          login, no API key, and no account, and the server does not log your queries.
        </p>

        {/* The URL */}
        <section className="mt-10">
          <h2 className="text-xl font-bold">The Connector URL</h2>
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-stone-300 bg-white p-4">
            <code className="grow break-all text-sm text-stone-900">{MCP_URL}</code>
            <CopyButton value={MCP_URL} />
          </div>
          <p className="mt-2 text-sm text-stone-600">
            Always-available fallback if the custom domain has not resolved for you yet:{' '}
            <code className="break-all">{FLY_URL}</code>
          </p>
        </section>

        {/* Codex */}
        <section className="mt-10">
          <h2 className="text-xl font-bold">Connect from Codex</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Codex launches MCP servers as local programs, so it reaches this remote server through
            the small <code>mcp-remote</code> bridge (fetched automatically by <code>npx</code>;
            you need Node.js 18+). Add this block to your Codex config file
            (<code>~/.codex/config.toml</code>, or{' '}
            <code>C:\Users\&lt;you&gt;\.codex\config.toml</code> on Windows), then restart Codex:
          </p>
          <div className="mt-3">
            <CodeBlock code={CODEX_CONFIG} />
          </div>
        </section>

        {/* Claude Desktop */}
        <section className="mt-10">
          <h2 className="text-xl font-bold">Connect from Claude Desktop</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Open Settings, then Developer, then Edit Config, and add the connector to the{' '}
            <code>mcpServers</code> block, then restart:
          </p>
          <div className="mt-3">
            <CodeBlock code={CLAUDE_DESKTOP_CONFIG} />
          </div>
        </section>

        {/* claude.ai */}
        <section className="mt-10">
          <h2 className="text-xl font-bold">Connect from claude.ai</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Go to Settings, then Connectors, then Add Custom Connector, and paste the URL above.
            Save, and the tools appear in the chat composer.
          </p>
        </section>

        {/* Tools */}
        <section className="mt-10">
          <h2 className="text-xl font-bold">What You Can Do</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            You do not call these by hand. You ask your assistant a question and it chooses the
            right tool. The eight tools:
          </p>
          <ul className="mt-4 space-y-2">
            {TOOLS.map(([name, desc]) => (
              <li key={name} className="rounded-md border border-stone-200 bg-white p-3">
                <code className="text-sm font-semibold text-civil-red-body">{name}</code>
                <span className="ml-2 text-sm text-stone-700">{desc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Deeper */}
        <section className="mt-10 rounded-lg border border-stone-300 bg-white p-5">
          <h2 className="text-lg font-bold">Full Guide and Troubleshooting</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            For a step-by-step walkthrough with example queries, a field-by-field reading of the
            citation payload, the available MCP resources, and a troubleshooting table, see the
            complete{' '}
            <a
              href={GETTING_STARTED_URL}
              className="font-medium text-civil-red-body underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Getting Started guide
            </a>
            .
          </p>
        </section>

        <footer className="mt-12 border-t border-stone-300 pt-6 text-sm text-stone-600">
          <a href="/" className="font-medium text-civil-red-body underline hover:no-underline">
            Return to spokenhistory.org
          </a>
          <p className="mt-2">
            A project drawing on the Civil Rights History Project of the Library of Congress
            American Folklife Center and the Smithsonian National Museum of African American
            History and Culture.
          </p>
        </footer>
      </main>
    </div>
  );
}
