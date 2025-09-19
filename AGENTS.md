Agents Guide (Authoritative) — Closed Source

Scope

- Applies to the entire repository, all directories and files.
- Agents and contributors must follow this guide for all changes.

Golden Rules

- THINK FIRST: understand existing code, plan solution, check patterns BEFORE coding
- UI FRAMEWORK: use TAILWIND CSS only - no custom CSS, no inline styles
- ATOMIC COMMITS: commit after EVERY file change with typecheck + lint passing
- DRY: do not repeat logic; extract utilities and share types.
- CLEAN CODE: readable, small, single‑purpose modules; name things precisely.
- WORKING AND TESTED: never leave the repo in a broken state; every change typechecked, linted, tested, and built.
- NO ROOT CLUTTER: never place unnecessary files in repo root; keep only top‑level docs and main directories.
- NO ORPHANS: do not keep old or unused files around — move them to `trash/` with a brief reason/date.

Repository Structure

- v7/ — Manifest V3 extension (React, TS, Vite, CRX, Tailwind, Vitest).
- f19n-obtrusive-livetest/ — legacy MV2 reference (read‑only; migrate, don’t mutate).
- trash/ — parking area for deprecated or unused assets (see Trash Policy).

Architecture (v7)

- Side Panel UI (React): displays results and metadata; subscribes to storage changes; no heavy work in components.
- Service Worker: collects events (webNavigation/webRequest/DOM messages), aggregates in `chrome.storage.session`, finalizes via `chrome.alarms`.
- Offscreen Document (Sandbox): runs rule strings using a JS interpreter; communicates with SW via `chrome.runtime` messages. No `eval` in SW.
- Storage Contract: results are appended under `results:<tabId>` in `chrome.storage.local`. Do not block collection while computing.

Quality Gates (must pass)

- Typecheck: `npm run typecheck` with strict TS (no implicit any, strict nulls).
- Lint: `npm run lint` (ESLint flat config, import order, no unused, promise handling).
- Tests: `npm test` (Vitest + jsdom). Add tests for new logic.
- Build: `npm run build` yields a working extension in `v7/dist/`.

Coding Standards

- File size: ≤ 50 lines per file in `v7/src` (config files are exempt). Split modules aggressively.
- Single responsibility: separate collection, aggregation, rule execution, and display.
- Types first: define shared types near boundaries; avoid `any` (or use minimal `unknown` + narrow).
- Async discipline: await with try/catch or `.catch()`; no unhandled promises.
- No dead code or commented blocks; remove or move to `trash/` with a note.
- No `eval`/`new Function` in SW; confine dynamic code to the offscreen sandbox.
- Import hygiene: consistent order/grouping; keep public imports stable.

Dependencies

- Use established libraries that add clear value; avoid gratuitous dependencies.
- Remove unused deps and code paths; keep lockfiles updated.
- Prefer web standards and lightweight utilities before adding a package.

Security & Privacy

- Principle of least privilege in `manifest.json` permissions/hosts.
- Never commit secrets; use `chrome.identity` for OAuth.
- Validate/sanitize external inputs (Zod or equivalent) at boundaries.

Testing Guidance

- Place tests under `v7/tests/**` (unit and e2e).
- Mock Chrome APIs minimally in tests; avoid network I/O.
- Test the pipeline in isolation: collector store, finalizer, runner mapping, and UI subscriptions.

Formatting & Style

- Use Prettier and ESLint (flat config). Don’t fight the formatter.
- Enforce strict import order and no unused symbols.

Trash Policy

- When deprecating or removing code, move files to `trash/` with a short note (reason + date) or keep an adjacent README entry.
- Do not reference files in `trash/` from production code.
- Periodically prune `trash/` once confirmed unused.

Root Hygiene

- Keep the repository root minimal: AGENTS.md, README.md, and top‑level directories only.
- Put all new code inside appropriate subdirectories (e.g., `v7/`).

Mandatory Workflow for ALL Changes

1. UNDERSTAND the challenge
   - Read existing code in the area
   - Check what UI framework is used (TAILWIND here!)
   - Review similar components/patterns
   - Search for existing utilities

2. THINK before coding
   - Plan the complete solution
   - Consider edge cases
   - Design component hierarchy
   - Check for code reuse opportunities

3. CODE with discipline
   - Make ONE file change at a time
   - Run `npm run typecheck` after each change
   - Run `npm run lint` after each change
   - Commit atomically with descriptive message
   - ONLY proceed if tests pass

4. NEVER
   - Create custom CSS files (use Tailwind!)
   - Make multiple file changes without commits
   - Skip typecheck or lint
   - Leave unused code

Commit & PR Checklist

- Update docs when behavior or config changes.
- Run locally: `npm run typecheck && npm run lint && npm test && npm run build`.
- Verify side panel loads and reacts to a live tab.
- Ensure files in `v7/src` respect the ≤ 50‑line rule.

Do / Don’t

- Do: keep layers decoupled and asynchronous; prefer small pure functions.
- Do: remove dead code and unused assets promptly (move to `trash/`).
- Don’t: add in‑page overlays; use the Chrome side panel.
- Don’t: block in service worker; use storage + alarms + offscreen runner.

Quick Start (v7)

- Install deps: `cd v7 && npm i`
- Dev cycle: `npm run typecheck && npm run lint && npm test && npm run build`
- Load in Chrome: `chrome://extensions` → Developer mode → Load unpacked → `v7/dist`
Closed Source Policy

- This repository is PRIVATE and CLOSED SOURCE.
- Do not publish any part of the code to public repositories or registries.
- Do not paste code or internal details into public issues or forums.
- Use redaction/sanitization when sharing logs or errors outside trusted channels.
- Respect LICENSE.txt (Proprietary, All Rights Reserved).

Learnings & Practices

- DRY Core, One Source of Truth
  - Share contracts and execution between CLI and extension.
  - Use `src/core/types.ts` and `src/core/run.ts` as the canonical interfaces and runner.
  - Keep the rules registry at `src/rules/registry.ts` as the only rule list.
- Typed Rules (≤50 lines)
  - Each rule is a tiny typed module: `Rule.run(page, ctx) => Result | Result[]`.
  - Keep one test per rule or per utility; avoid monolithic test files.
  - Prefer pure logic; rely on `Page` (html/url/doc/status/headers) instead of ad‑hoc scraping.
- CLI‑First, Extension around Core
  - CLI and offscreen both call the same `runAll` with the same rules.
  - CLI supports JSON and HTML reports for fast local/CI validation.
  - Extension side panel renders the same results and persists user settings.
- Page Construction
  - Both CLI and offscreen build `Page` objects with DOM (Document), `status` and `headers` (from HEAD) before calling rules.
  - If more page data is needed, add it to `Page` (never pass ad‑hoc blobs).
- Storage & Settings
  - Rule toggles are saved in `chrome.storage.local` under `rule-flags` and overlay rule.enabled at runtime.
  - API keys (e.g., PSI, MFT) are saved under `globalRuleVariables` and passed via `ctx.globals.variables`.
  - Keep names stable and documented.
- No Legacy, No Dynamic Code Execution
  - Never import legacy MV2 code into v7.
  - Do not use interpreters, string‑based `eval`, or `new Function`.
  - Typed TS modules only; if a dynamic behavior is needed, design a typed adapter.
- Strict Quality Gates (run after each bigger change)
  - Typecheck: `npm run -w v7 typecheck`.
  - Lint: `npm run -w v7 lint`.
  - Tests: `npm run -w v7 test`.
  - Build: `npm run -w v7 build`.
  - For local loop: `npm run -w v7 check:watch`.
- File Size & Structure
  - Enforce ≤50 lines per file in `src/**` via ESLint.
  - Split aggressively; place shared helpers in `src/core/**` or the most logical directory.
- Import Order & Style
  - Keep import groups clean: external → shared → local; respect ESLint import/order.
  - Avoid local overrides except when absolutely necessary (e.g., CLI runner file), and keep them scoped.
- Offscreen & Results
  - MV3 offscreen page is the only place for DOM execution in background.
  - Offscreen performs the HEAD request (status/headers) once per run.
  - Side panel subscribes to storage changes and renders results without business logic.
- Security & Privacy
  - Principle of least privilege in manifest permissions.
  - Never log secrets; redact anything user‑provided or sensitive.
  - Do not publish code or artifacts; keep GitHub repository private.
- Git Hygiene
  - Keep commits small and focused; meaningful messages.
  - Pre‑commit hooks run typecheck + lint. Do not skip.
  - Avoid nested repos; if legacy folder exists, treat it as a submodule or ignore in the parent index.
- CI Practices
  - CI runs typecheck/lint/tests/build only; no public releases or artifact publishing.
  - Add HTML report generation (CLI) as a CI artifact only if kept private.
