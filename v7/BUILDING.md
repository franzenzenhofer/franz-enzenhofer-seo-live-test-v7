Build & Release Protocol

Dev
- Run dev server: npm run dev
- Build dev bundle (with name suffix): npm run build:dev
  - Sets EXT_ENV=dev to add a version_name suffix and Dev name

Test & Lint
- Full local gates: npm run ci (typecheck + lint + tests + build)
- E2E: npm run test:e2e (runs headfully under xvfb in CI; headless MV3 is unreliable)

Production Build
- npm run build (generates v7/dist with MV3 extension)
- npm run pack (zips v7/dist into dist.zip)
 - npm run dist (build + out/ release bundle)

Distribution Bundle
- out/ contains (after `npm run dist`):
  - extension/ (built MV3)
  - extension.zip (if present)
  - marketing/ (store listing, screenshots)
  - landing/index.html (install instructions)
)

Debugging & Bug Reports
- Side panel → Show logs → “Copy bug report” copies a JSON containing:
  - meta (time, UA, extension version info)
  - tab (id, url, title)
  - settings (ui:autoRun/ui:autoClear/rule-flags/globalRuleVariables)
  - lastRun (pageUrl, evCount, tail of last events)
  - tailLogs (last 50 log lines)
  - resultsSample (first 50 result rows)
- “No results” view explains whether nothing was saved or everything is filtered, and shows last-run summary.

Manual CLI Test
- Run a URL: `npm run -w v7 cli -- url https://example.com --format json`
- Run a local file: `npm run -w v7 cli -- file path/to/page.html --format html`
- The CLI and the offscreen runner share the same rules and core.

Publishing
- Chrome Web Store: upload extension.zip and store listing assets from out/marketing
- GitHub: push to a private repository; do not commit .env or any keys/tokens

Settings & Keys
- Open side panel Settings:
  - Sign in with Google (for GSC)
  - Set PSI and MFT API keys
  - Set variables (e.g., gsc_site_url)
  - Rule toggles via checkboxes

Notes
- MV3 headless: service workers/content scripts are often not loaded headless; CI runs xvfb E2E without mocks.
- First Paint/FCP: use a content script PerformanceObserver if real FP/FCP is required.
