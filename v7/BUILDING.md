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

Distribution Bundle
- npm run dist (build + create out/ with:
  - extension/ (built MV3)
  - extension.zip (if present)
  - marketing/ (store listing, screenshots)
  - landing/index.html (install instructions)
)

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
