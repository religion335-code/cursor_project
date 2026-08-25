# AGENTS.md

## Cursor Cloud specific instructions

`lanyang-cloud` (蘭陽雲工) is a single-page, frontend-only Vite + React 19 + TypeScript
app. There is no backend, database, or API key: all state (quotes, studio board,
runway settings) is persisted in the browser's `localStorage`. The Agent page is a
local rule engine over the runway/offer numbers, not an external model call.

Node 20+ is required (CI uses Node 22, which is what this environment provides).

Standard commands live in `package.json` and are already documented in `README.md`:
- `npm run dev` — Vite dev server on port 5173 (host is enabled via `vite.config.ts`).
- `npm test` — Vitest unit tests (`src/**/*.test.ts`, currently `runway` + `agent`).
- `npm run build` — typechecks with `tsc --noEmit` then runs `vite build`.
- `npm run preview` — serves the production build on port 4173.

Non-obvious notes:
- There is no lint script; `npm run build` is the type-check gate (`tsc --noEmit`),
  and it runs in CI (`.github/workflows/ci.yml`) alongside `npm test`.
- `tsconfig.json` enables `noUnusedLocals`/`noUnusedParameters`, so unused
  imports/vars fail the build, not just lint.
- The app is a client-side SPA using `react-router-dom` `BrowserRouter`; when hosting
  the built `dist/`, route all paths to `index.html`.
- UI text is in Traditional Chinese. Key nav routes: `/` 首頁, `/runway` 跑道,
  `/offers` 方案, `/studio` 工作室, `/agent` Agent.
