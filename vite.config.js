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
  }
})