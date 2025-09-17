Agents Guide (Authoritative) — Closed Source

Scope

- Applies to the entire repository, all directories and files.
- Agents and contributors must follow this guide for all changes.

Golden Rules

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

- Unit tests live alongside code (`*.test.ts`).
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
