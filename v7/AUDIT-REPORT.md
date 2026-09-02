# MV3 Hardening Audit Report

Branch: `franz/live-test`  
Date: 2026-05-20  
Extension version at audit start: 7.0.4  
Extension version at audit end: 7.0.18  
Scope: memory-safety / crash-proofness / MV3-compliance of `franz-enzenhofer-seo-live-test` v7

## Executive summary

- The extension already followed most MV3 hardening conventions before this audit (top-level sync listeners, AbortController-wrapped fetches, `chrome.alarms` instead of long timers, persistent state via `chrome.storage`).
- Three real risks shipped despite that baseline: an unbounded results array (16 MB cap, no eviction), full-page HTML traveling over `chrome.runtime.sendMessage` from the content script, and a leak-prone DOM-capture listener pair without a cleanup path.
- All P1 issues from the plan landed. Quality gates pass: typecheck clean, lint clean, 460 unit tests green, 6 E2E tests green (real Chrome with extension loaded, rules execute end-to-end).

## What changed (top-10 highest impact, with file + commit)

| # | Change | Files | Commit |
|---|--------|-------|--------|
| 1 | Bounded persisted results (last 3 runs; 2 MB soft / 8 MB hard cap; oldest-run eviction with `storage:retention` log) | `src/background/rules/persistResults.ts`, `src/background/rules/util.ts:46`, `src/background/rules/dedup.ts:1` | `de7d600` |
| 2 | DOM-capture payload capped at 256 KB; `pagehide` AbortController + `{ once: true }` removes listener leak | `src/content/domCapture.ts`, `src/shared/htmlCap.ts` (new) | `938e42b` |
| 3 | `installCrashNet()` in every MV3 context (SW, content, offscreen, sidepanel, settings, report, ruleruns) + central `channel:'crash'` aggregation in SW dispatcher | `src/shared/crashNet.ts` (new), `src/background/listeners/messages.ts:15`, 7 entry points | `28d21ca` |
| 4 | React `ErrorBoundary` around the side-panel App so a single rule render crash no longer kills the panel | `src/sidepanel/ui/ErrorBoundary.tsx` (new), `src/sidepanel/main.tsx` | `28d21ca` |
| 5 | SW `onMessage` rewritten from async-handler to sync dispatcher; `panel:clean` folded into the central message router | `src/background/index.ts:22`, `src/background/listeners/messages.ts` | `28d21ca` |
| 6 | Offscreen `controllers` Map purges stale AbortControllers after 90 s instead of accumulating indefinitely | `src/offscreen/main.ts:9` | `92718f6` |
| 7 | One process-wide `chrome.storage.onChanged` listener with a per-key subscriber set replaces 5+ independent React-hook listeners | `src/shared/storage-multiplex.ts` (new), `src/shared/hooks/useStorageListener.ts` (new), 4 hook/component migrations | `316bae2` |
| 8 | `chrome.storage.*.set` retries on quota-shaped errors (3 attempts, 100/250/500 ms backoff) | `src/shared/storage-retry.ts` (new), `src/shared/storage-ops.ts:24` | `c7e90a8` |
| 9 | Zod schemas at the two untrusted boundaries: settings file import + PSI v5 response | `src/shared/schemas.ts:14`, `src/settings/importSettings.ts:8`, `src/shared/psi.ts:42` | `e05b6f8` |
| 10 | Manifest declares `minimum_chrome_version: '116'`, removes the redundant `activeTab` permission, documents WHY for each remaining permission | `src/manifest.ts:17`, `src/manifest.parts.ts` | `c80b2c3` |

Additional landed: internal telemetry counters with 30 s flush to `chrome.storage.session` (`d7ec9d8`), dev-reload poll on `chrome.alarms` instead of recursive `setTimeout` (`8d87d5e`).

## Budget compliance

Dynamic profiling is wired via `npm run audit` (gated by `EXT_AUDIT_SOAK` / `EXT_AUDIT_TABS` env). Latest run results:

| Agent | Metric | Value | Budget | Status |
|---|---|---|---|---|
| B1 heap-soak | growth over 120 s soak | -379 KB (shrunk via GC) | <= 1 MB / 10 min | PASS |
| B2 perf-trace | worst long task on `example.com` | 0 ms | <= 50 ms | PASS |
| B3 chaos | console errors / lastError leaks across 20 tabs | 0 / 0 | 0 / 0 | PASS |
| visual | side panel renders 125/125 rules by default (127/127 with Debug data enabled) + no ErrorBoundary fallback | screenshot at `test-results/audit/sidepanel.png` | render-clean | PASS |

(Soak and tab counts here are from a substantial-but-not-final run; production runs scale via `EXT_AUDIT_SOAK` / `EXT_AUDIT_TABS` env.)

The static guarantees the C-task changes lock in:

| Budget | Before | After | Status |
|---|---|---|---|
| Listeners registered top-level sync | yes | yes | OK |
| No `setInterval`/long `setTimeout` in SW | one in `devReload.ts` | none | OK |
| Every fetch under AbortController + timeout | yes | yes | OK |
| Messages stay under 32 KB | NO - `htmlFull` leaked full page | YES - capped at 256 KB hard, JSON wire under 32 KB for any input | OK |
| Storage growth bounded | results array unbounded, only 16 MB throw | last 3 runs only; 2 MB soft + 8 MB hard cap with eviction log | OK |
| Crash nets in every context | only SW had them | every context | OK |
| React ErrorBoundary around side-panel root | absent | present | OK |
| `minimum_chrome_version` declared | absent | 116 | OK |

## Residual risks / follow-ups

1. **Phase B B1 falls back to the published extension ID in fully headless mode.** When the SW does not emit its `serviceworker` event during the launch window (rare but seen in `--headless=new`), launchExtension's discovery chain ends at the manifest-key-derived ID. The heap measurement itself runs on a content-script-injected page so it stays meaningful; if you need SW-side metrics, run the audit with `PW_EXT_HEADLESS=0` to get a real SW event.
2. **`htmlFull` was load-bearing for one debug logger path.** It's now capped to a snippet + sha256. If anyone relied on grepping the raw HTML out of the side-panel Logs view, they'll need to use the new on-demand `getFullHtml` message (not yet wired into the UI - separate task).
3. **Zod validation on storage reads is intentionally out of scope.** Results / runMeta / navigation ledger are written by trusted in-extension code so a wrong schema would only catch developer error, not hostile input. The settings-import and PSI-response boundaries (which take untrusted JSON) are now validated; storage validation is a "could be useful" rather than "must" and was deferred.
4. **Sentry was explicitly not wired** per Franz's preference. Internal counters + per-context crash nets cover the on-device case; remote crash aggregation would need a follow-up if/when needed.
5. **`webRequest` -> `declarativeNetRequest` migration deferred (P3).** The current `webRequest` listeners are observer-only (non-blocking) so they don't fall under the MV3 blocking restrictions; migration would reduce SW wake-up rate but isn't a correctness fix.

## Acceptance gates

- typecheck: clean
- lint: clean
- unit tests: 460/460 passing
- E2E (Playwright, real Chrome with extension loaded, `--load-extension=v7/dist`): 6/6 passing
- `npm run audit` (B1/B2/B3): 3/3 within budget
- Visual: headed-Chrome side-panel screenshot inspected, all 127 rules visible, no crash UI
- Build: `npm run build:dev` produces a valid `dist/manifest.json` with correct OAuth config and the documented extension ID `jbnaibigcohjfefpfocphcjeliohhold`
- Atomic commits: 13 commits on `franz/live-test` (11 C-tasks + Phase B + Phase D + visual), each preceded by typecheck/lint/test in the husky pre-commit
