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
- `npm run rules:json` – Emit `rules.inventory.json` (auto-runs before every build so docs can ingest rule metadata)

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

Real-data rule coverage
-----------------------

- Both the extension and CLI import the exact same registry defined in `src/rules/registry.ts`, so every typed rule (head/meta, body/DOM, HTTP/security, URL, Discover, Schema, PSI/GSC) runs identically in both modes.
- Browser-only signals (Chrome webNavigation/webRequest events) are collected in the extension; the CLI rebuilds a `Page` purely from the fetched HTML + HEAD request. Rules never use placeholder values—when data is missing they emit factual `info` messages (e.g. “No resource requests captured”).
- Newly re-enabled rules include image layout/lazy checks, HTTP common-mobile safeguards, and the full schema family (Breadcrumb, FAQ, HowTo, JobPosting, Organization, Product, Recipe, Event, Video).

Running against real data
-------------------------

### Extension (side panel)

1. Build once (`npm run build`), then load `v7/dist` as an unpacked MV3 extension.
2. Open any real tab (http/https only) and click the Live Test action to open the side panel.
3. Optional: open `src/settings.html` (gear icon) to toggle rules or provide API tokens/variables (e.g. PSI key, GSC site URL).
4. Use the `Run now` button to trigger an immediate capture; results are always sourced from the live DOM plus captured network metadata.

### CLI

```
npm run -w v7 cli -- url https://example.com --format html --out report.html
npm run -w v7 cli -- file ./page.html
```

- Set environment variables for rule inputs: `LIVETEST_VAR_google_page_speed_insights_key`, `LIVETEST_VAR_gsc_site_url`, `GOOGLE_API_ACCESS_TOKEN`, etc.
- Output defaults to structured JSON; pass `--format html --out <file>` for a standalone report. The CLI never fabricates events: it fetches the target URL/file, builds a DOM via jsdom, issues a HEAD probe for headers, and runs the same registry as the extension.

Token-dependent integrations
----------------------------

- Google Search Console and PageSpeed Insights rules are disabled by default. They surface real results only when tokens/keys are present in Settings (extension) or env vars (CLI). Without credentials they emit `info` messages (“No Google token”) instead of fake data.
- Mobile Friendly Test / PSI rules pull live data from Google APIs and cache responses for five minutes (`src/shared/psi.ts`). There is no offline/demo mode.
- Rules that need Chrome-only data (e.g., SPA history updates, blocked resources) clearly state when that data is unavailable in CLI mode rather than simulating it.
