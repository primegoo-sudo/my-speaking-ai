<!-- Copilot instructions for contributors and AI coding agents -->
# Copilot/AI agent instructions — my-speaking-ai

This file gives concise, actionable guidance for automated coding agents working in this repository.

- **Project type:** SvelteKit + Vite app (see `svelte.config.js`, `vite.config.js`). Deployed via Vercel adapter.
- **Entry points:** UI lives under `src/routes` and `src/lib/components`; reusable logic under `src/lib/composables`.

- **Build / dev / test commands** (from `package.json`):
  - `npm run dev` — start Vite dev server
  - `npm run build` — production build
  - `npm run preview` — preview built app
  - `npm test` — runs `vitest` (`test:unit`) with a multi-project config (see `vite.config.js`)

- **Testing patterns:**
  - Browser tests: glob `src/**/*.svelte.{test,spec}.{js,ts}` (Playwright + Vitest browser project in `vite.config.js`).
  - Server tests: glob `src/**/*.{test,spec}.{js,ts}` (node environment).

- **Server / API notes:**
  - Server routes use SvelteKit endpoints under `src/routes/api/*` (example: [src/routes/api/users/+server.js](src/routes/api/users/+server.js)).
  - Supabase client is created from environment variables: `SUPABASE_DB_URL` and `SUPABASE_DB_PUBLIC_KEY`. Validate presence before using.

- **Key patterns to follow / examples**
  - Composables are plain JS exported functions that return handlers (example: `useRecording()` in [src/lib/composables/useRecording.js](src/lib/composables/useRecording.js)). Callers pass an `onStateUpdate` callback to receive updates.
  - UI components accept props via Svelte's props and often expect callbacks (example: `RecordingControls.svelte` props `onStart`/`onStop`). See [src/lib/components/RecordingControls.svelte](src/lib/components/RecordingControls.svelte).
  - `$lib` alias is used for imports (e.g., `import { useRecording } from '$lib/composables/useRecording.js'`). Place shared modules in `src/lib` and expose via `src/lib/index.js` if desired.
  - Components and composables manage browser resources carefully (revoking `ObjectURL`, stopping tracks). Mirror this cleanup pattern when adding new features.

- **External integrations**
  - Supabase (server-side): `@supabase/supabase-js` used in API routes. Keep secrets in environment (SvelteKit `env`).
  - OpenAI and `@openai/agents` are dependencies in `package.json`. If adding agent-related code, follow existing server-side pattern (keep keys server-only).

- **Non-obvious conventions**
  - Tests are split into browser vs node projects in `vite.config.js`; do not place browser tests under server-only folders like `src/lib/server`.
  - Components use simple callback props rather than a centralized store for recording flow; prefer local callbacks for small UI pieces.
  - The project uses Tailwind via `@tailwindcss/vite` plugin; style classes are applied inline in Svelte components.

- **If merging with an existing `.github/copilot-instructions.md`**: preserve any bespoke guidance, but prefer the concrete references above (scripts, file globs, env names, example files).

If anything here is unclear or you want more detail about tests, env setup, or conventions, tell me which area to expand.
