import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// vite-plugin-env-compatible was removed in 2026-05-21: it shimmed
// process.env.X in client code to read from .env files, which made
// the unsafe pattern of `process.env.VITE_OPENAI_API_KEY` actually
// work in the browser (silently shipping any matching value in the
// bundle). After removing the two client-side OpenAI-key reads in
// commit 0f511d9 and confirming grep across src/ shows zero
// remaining process.env.X references in code (only comments), the
// plugin is unused. Removing it makes the unsafe pattern fail
// loud (`process is not defined`) on any future attempt, rather than
// silently exposing a secret.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/', // Use root path for Vercel deployment
  server: {
    port: 3000,
    open: true, // This will open the browser automatically
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  esbuild: {
    // Strip console.log and debugger statements from production builds.
    // The codebase has ~150 console.log calls spread across pages,
    // hooks, and services -- most are legacy breadcrumbs (Firebase
    // fetch counts, semantic search timings, navigation traces) that
    // were useful during development but are noise + potential
    // privacy leakage in production. Stripping them via esbuild's
    // pure-call elimination keeps the source intact (so devs running
    // `npm run dev` still see the logs) but removes them from the
    // shipped bundle that end users load. console.error and
    // console.warn are preserved because they signal genuine
    // problems the team needs to see in the wild.
    pure: ['console.log', 'console.debug', 'console.info'],
    drop: ['debugger'],
  },
})