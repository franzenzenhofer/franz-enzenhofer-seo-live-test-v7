F19N Obtrusive Live Test v7 (MV3)

- MV3 + Chrome side panel (React + Vite)
- Strict TypeScript, ESLint (flat), Prettier
- Unit tests (Vitest + jsdom)
- Tailwind styling
- Decoupled pipeline: collect → aggregate → run rules → display

## OAuth Configuration (Google Search Console & Analytics)

### Current Setup - Matches Published Extension

The extension uses the **EXACT SAME** OAuth configuration as the published "Franz Enzenhofer SEO Live Test" extension in Chrome Web Store.

**Configuration Values (from `config.js`):**
```javascript
// OAuth Client ID (MUST NOT CHANGE - matches published extension)
OAUTH_CLIENT_ID = '335346275770-6d6s9ja0h7brn24ghf3vqa9kv7ko5vfv.apps.googleusercontent.com'

// OAuth Scopes
OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',  // Google Search Console
  'https://www.googleapis.com/auth/analytics.readonly',   // Google Analytics
]

// Extension Public Key (MUST NOT CHANGE - generates same extension ID)
DEV_EXTENSION_KEY = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsWxGAo8gbhOgcRRk5BK+...'
// This key generates extension ID: jbnaibigcohjfefpfocphcjeliohhold
```

**Why these values matter:**
- Extension ID `jbnaibigcohjfefpfocphcjeliohhold` is SAME as published extension
- OAuth client already has this extension ID registered in Google Cloud Console
- OAuth works immediately - no additional setup needed!

### Testing OAuth

1. Build extension: `npm run build:dev`
2. Load unpacked from `/v7/dist` folder
3. Verify Extension ID: `jbnaibigcohjfefpfocphcjeliohhold` (must match!)
4. Open Settings → Google Account
5. Click "Show" under "Authentication Logs (Live)"
6. Click "Sign In" - OAuth popup should appear immediately

**Success logs:**
```
auth:login:success - tokenMasked: ya29.a0...
auth:login:token-stored
```

### OAuth Token Storage

Tokens stored in `chrome.storage.session` with key `gsc:token`

Access via:
```typescript
import { getStoredToken, setStoredToken } from '@/shared/auth'
const token = await getStoredToken()  // Returns string | null
```

### Google Cloud Console Configuration

- **OAuth Client:** `335346275770-6d6s9ja0h7brn24ghf3vqa9kv7ko5vfv`
- **Project ID:** 335346275770
- **Authorized JavaScript origins:** Should include `chrome-extension://jbnaibigcohjfefpfocphcjeliohhold`

**⚠️ IMPORTANT:** DO NOT change `OAUTH_CLIENT_ID` or `DEV_EXTENSION_KEY` in `config.js` unless you want to break OAuth!

Scripts

- `npm run dev` – Vite dev server for hot-reload assets
- `npm run build` – Build the extension to `dist/`
- `npm run test` – Run unit tests (accepts `--filter <pattern>` → `--testNamePattern` and `--runInBand` → single worker)
- `npm run test:e2e` – Build + run Playwright MV3 tests using headed Chromium (set `PW_EXT_HEADLESS=1` to force headless)
- `npm run test:e2e:dev` – Run Playwright tests in headed mode (no implicit build)
- `npm run lint` – ESLint
- `npm run typecheck` – TS type checks
- `npm run rules:json` – Emit `rules.inventory.json` (auto-runs before every build so docs can ingest rule metadata)
- `npm run chrome:profile` – Launch your chosen Chrome profile (see “Profile-aware testing” below)

Async, decoupled architecture

- Collector (SW): webNavigation, webRequest, and DOM-phase messages push small event records into `chrome.storage.session`; an alarm finalizes a run (super async, no blocking).
- Runner (offscreen): rules execute in an offscreen document using a JS interpreter (no eval in SW). Fully isolated from collection and UI.
- Results store: rule outputs append to `chrome.storage.local` under `results:<tabId>`.
- UI (side panel): subscribes to storage changes and renders results. No direct coupling to collection or rule execution.
- Navigation safety: if a navigation occurs after DOM capture (e.g., hard refresh or SPA transition), the pending run is cancelled so results never mix DOM from a previous page with a newer URL.

Load in Chrome

1. `npm i && npm run build`
2. Open `chrome://extensions`, enable Developer mode
3. Load unpacked → select `v7/dist`
4. Pin the action and click it to open the side panel

Notes

- Default rules are seeded on install (see `src/background/rules/index.ts`). Add more via storage or extend the importer.
- Offscreen document is created on demand to run rules and stays entirely separate from the SW.
- DOM paths from rule results are used only for on-page highlighting; they are not rendered in the side panel.

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
4. Use the `Run now` button to clear previous results/logs, hard-refresh the tab, and trigger an immediate capture; results are always sourced from the live DOM plus captured network metadata.
5. Pin critical rules with the ★ icon so they stay at the top (persisted per user). The ⓘ icon opens the full `report.html` for that result and the `Logs` link pops open `logs.html` with the execution log for the active tab.

### CLI

```
npm run -w v7 cli -- url https://example.com --format html --out report.html
npm run -w v7 cli -- file ./page.html
```

- Set environment variables for rule inputs: `LIVETEST_VAR_google_page_speed_insights_key`, `LIVETEST_VAR_gsc_site_url`, `GOOGLE_API_ACCESS_TOKEN`, etc.
- Output defaults to structured JSON; pass `--format html --out <file>` for a standalone report. The CLI never fabricates events: it fetches the target URL/file, builds a DOM via jsdom, issues a HEAD probe for headers, and runs the same registry as the extension.

Token-dependent integrations
----------------------------

- All rules are enabled by default. PageSpeed Insights rules use a built-in default API key but can be overridden. Google Search Console rules return `runtime_error` when not authenticated. Without credentials they show clear error messages instead of fake data.
- Mobile Friendly Test / PSI rules pull live data from Google APIs and cache responses for five minutes (`src/shared/psi.ts`). There is no offline/demo mode.
- Rules that need Chrome-only data (e.g., SPA history updates, blocked resources) clearly state when that data is unavailable in CLI mode rather than simulating it.
- `gsc_site_url` is required for Search Console rules (`gsc:is-indexed`, `gsc:top-queries-of-page`, `gsc:page-worldwide`, `gsc:directory-worldwide`). Provide the exact property ID (`https://example.com/` or `sc-domain:example.com`) so results stay honest.

Profile-aware testing & automation
----------------------------------

- Playwright e2e tests (`npm run test:e2e`) automatically build the extension and launch Chromium **headed** (Chrome UI visible) with the MV3 bundle loaded. Set `PW_EXT_HEADLESS=1` if you really want the new headless mode. By default they use a temporary profile; set env vars to reuse a real Chrome profile:
- `LT_CHROME_PROFILE_NAME="Profile 2"` – folder name from `chrome://version` (mac path `~/Library/Application Support/Google/Chrome/Profile 2`). Friendly labels (e.g. "Google Chrome") also work; the helper resolves them via the `Local State` profile list.
  - or `LT_CHROME_PROFILE_DIR="~/Library/Application Support/Google/Chrome/Profile 2"` – absolute path override
  - Tests **clone** that profile into a temp dir; set `LT_CHROME_PROFILE_MODE=live` to run directly against the profile (not recommended) or `LT_CHROME_PROFILE_KEEP=1` to keep the cloned copy for debugging.
  - `PW_EXT_HEADLESS=0` switches tests to headed Chromium (or use `npm run test:e2e:dev`).
- Launch Chrome with your preferred profile (for manual dev + auto-reload helpers) via `npm run chrome:profile`. It respects the same `LT_CHROME_PROFILE_NAME / DIR` env vars and opens the profile directly (default URL `chrome://extensions/`—override via `LT_CHROME_PROFILE_URL`). Keep this browser open while you iterate.
- Every `npm run build`/`npm run build:dev` writes `dist/dev-reload.json`. The dev service worker (`src/background/devReload.ts`) polls this file; when it detects a change, it calls `chrome.runtime.reload()` so the unpacked extension in your Franz profile refreshes automatically—no more manual "Reload" clicks in chrome://extensions.

Rule Management & Single Source of Truth
-----------------------------------------

### Architecture: TypeScript Registry as Single Source of Truth

**All rules are defined ONCE in TypeScript and flow to all consumers:**

```
TypeScript Rule Definitions (src/rules/**/*.ts)
                ↓
        Central Registry (src/rules/registry.ts)
                ↓
        ┌───────┴───────────┬──────────────┬────────────────┐
        ↓                   ↓              ↓                ↓
  Runtime Execution    Inventory       Settings UI     Documentation
  (extension/CLI)      (JSON export)   (React)         (external tools)
```

**Why TypeScript as Source of Truth:**
- **Type Safety**: Rules are fully typed; invalid rules fail at compile time, not runtime
- **Single Definition**: Each rule exists in exactly one place with one authoritative implementation
- **Auto-Generated Artifacts**: JSON inventory is derived from TypeScript, never manually edited
- **Guaranteed Consistency**: Settings UI, runtime, and documentation always reflect the same 100 rules

### File Locations

**Source of Truth (TypeScript):**
- `src/rules/registry.ts` - Central registry importing all 100 rules
- `src/rules/**/*.ts` - Individual rule implementations (100 files organized by category)
- `src/rules/inventory.ts` - Derives summary from registry for UI/export

**Generated Artifacts (DO NOT EDIT MANUALLY):**
- `rules.inventory.json` - **AUTO-GENERATED** JSON export of all rules for external consumption
  - Location: `/v7/rules.inventory.json` (project root, next to `package.json`)
  - Generated by: `npm run rules:json` (runs automatically before every build)
  - Used by: Documentation tools, external integrations, settings UI
  - **NEVER edit this file directly** - changes will be overwritten on next build

### Rule Metadata

Every rule includes:
```typescript
{
  id: string              // Unique identifier (e.g., 'head-title', 'psi:mobile')
  name: string            // Human-readable name (e.g., 'Title Present')
  enabled: boolean        // Default enabled state
  what: string            // Test type: 'static' | 'http' | 'psi' | 'gsc'
  run: (page, ctx) => Promise<Result|Result[]>  // Execution function
}
```

**The `what` field categorizes rules by test scope:**
- `static` (70 rules) - Tests static HTML DOM (head, og, schema, body, etc.)
- `http` (22 rules) - Tests HTTP headers/response (status, robots.txt, security)
- `psi` (3 rules) - Tests PageSpeed Insights API (requires API key)
- `gsc` (5 rules) - Tests Google Search Console API (requires authentication)

### Adding a New Rule

**1. Create the Rule File:**
```typescript
// src/rules/head/newMeta.ts
import type { Rule } from '@/core/types'

export const newMetaRule: Rule = {
  id: 'head:new-meta',
  name: 'New Meta Tag Check',
  enabled: true,
  what: 'static',  // Required: categorize the test type
  run: async (page) => {
    const el = page.doc.querySelector('meta[name="new-meta"]')
    const hasTag = Boolean(el)

    return {
      label: 'HEAD',
      message: hasTag ? 'New meta tag present' : 'New meta tag missing',
      type: hasTag ? 'ok' : 'warn',
    }
  },
}
```

**2. Register in Central Registry:**
```typescript
// src/rules/registry.ts
import { newMetaRule } from './head/newMeta'

export const registry: Rule[] = [
  // ... existing rules
  newMetaRule,  // Add here
]
```

**3. Regenerate Inventory (automatic on build):**
```bash
npm run rules:json  # Manually regenerate if needed
npm run build       # Automatically regenerates before building
```

**4. Verify:**
```bash
npx tsx scripts/verify-all-rules.ts  # Runs comprehensive checks
npm run typecheck                     # Ensure no TypeScript errors
npm run lint                          # Ensure no linting violations
```

### Modifying Existing Rules

**DO:**
- ✓ Edit the TypeScript file in `src/rules/**/*.ts`
- ✓ Run `npm run typecheck` to validate changes
- ✓ Run `npm run build` to regenerate inventory
- ✓ Test the rule in both extension and CLI

**DON'T:**
- ✗ Edit `rules.inventory.json` manually (auto-generated, changes will be lost)
- ✗ Modify registry.ts without adding/removing the corresponding rule file
- ✗ Skip the `what` field (required for proper categorization)

### Error Types & Configuration

**Two distinct error types:**

**`error` (Red)** - Page/content has a problem:
- Missing title, broken canonical, HTTP errors, security issues
- The page itself needs fixing

**`runtime_error` (Orange)** - Rule execution or configuration failed:
- Missing API credentials (PSI key, GSC authentication)
- Rule threw exception during execution
- Returns descriptive messages: *"PageSpeed Insights API key not configured. Set google_page_speed_insights_key in settings."*

**Credential-Dependent Rules:**

Rules requiring external APIs return `runtime_error` when not configured:

```typescript
// Example: PSI rule configuration check
if (!apiKey) {
  return {
    label: 'PSI',
    message: 'PageSpeed Insights API key not configured. Set google_page_speed_insights_key in settings.',
    type: 'runtime_error',
    priority: -1000,
  }
}
```

**PSI Default Key**:
- PSI rules (3) use a built-in default API key when user hasn't configured their own
- Users can override with custom key in settings (`google_page_speed_insights_key`)
- GSC rules (5) require Google OAuth token + `gsc_site_url` configuration

### Verification

**Run comprehensive verification:**
```bash
npx tsx scripts/verify-all-rules.ts
```

**Checks performed:**
- ✓ All 100 rules loaded in registry
- ✓ All 100 rules in inventory JSON
- ✓ All rules have required fields (id, name, enabled, run)
- ✓ All rules have `what` field
- ✓ No duplicate rule IDs
- ✓ Inventory matches registry perfectly
- ✓ PSI rules (3/3) present with config checks
- ✓ GSC rules (5/5) present, enabled by default, with config checks

### Documentation

**See `/RULES-VERIFICATION.md` for:**
- Complete list of all 100 rules organized by category
- Detailed breakdown by test type (static/http/psi/gsc)
- Error type definitions and examples
- Result type states: ok, warn, error, runtime_error, info, pending, disabled
- Quality assurance procedures
