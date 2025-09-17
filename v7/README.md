F19N Obtrusive Live Test v7 (MV3)

- MV3 + Chrome side panel (React + Vite)
- Strict TypeScript, ESLint (flat), Prettier
- Unit tests (Vitest + jsdom)
- Tailwind styling
- Decoupled pipeline: collect → aggregate → run rules → display

Scripts

- `npm run dev` – Vite dev server for hot-reload assets
- `npm run build` – Build the extension to `dist/`
- `npm run test` – Run unit tests
- `npm run lint` – ESLint
- `npm run typecheck` – TS type checks

Async, decoupled architecture

- Collector (SW): webNavigation, webRequest, and DOM-phase messages push small event records into `chrome.storage.session`; an alarm finalizes a run (super async, no blocking).
- Runner (offscreen): rules execute in an offscreen document using a JS interpreter (no eval in SW). Fully isolated from collection and UI.
- Results store: rule outputs append to `chrome.storage.local` under `results:<tabId>`.
- UI (side panel): subscribes to storage changes and renders results. No direct coupling to collection or rule execution.

Load in Chrome

1. `npm i && npm run build`
2. Open `chrome://extensions`, enable Developer mode
3. Load unpacked → select `v7/dist`
4. Pin the action and click it to open the side panel

Notes

- Default rules are seeded on install (see `src/background/rules/index.ts`). Add more via storage or extend the importer.
- Offscreen document is created on demand to run rules and stays entirely separate from the SW.
