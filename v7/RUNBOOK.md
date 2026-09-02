# MV3 Hardening Runbook

A recipe-style reference for the patterns this codebase relies on after the
2026-05-20 hardening audit. Follow these when adding a new listener, storage
key, content script, or fetch.

## Quick reference

- Service worker is **ephemeral**: assume it suspends every ~30 s. State must live in `chrome.storage`.
- Listeners must be registered at top level **synchronously**. Behind `await` = missed on SW wake.
- Every fetch needs an AbortController + timeout < 30 s.
- Every long timer is `chrome.alarms`, never `setInterval`.
- Every chrome.runtime message must JSON-encode to <= 32 KB.
- Every persisted key has a written soft-cap + retention rule.
- Every untrusted input (file import, network response) passes through a Zod `.safeParse`.

## Add a new chrome.* event listener

1. Open the entry point for the realm (SW: `src/background/index.ts`; content: `src/content/index.ts`; offscreen: `src/offscreen/main.ts`).
2. Register the listener at top level, synchronously. No `await` above the `addListener` call.
3. Inside the callback, do **not** mutate module-scope variables you expect to survive SW termination. Persist to `chrome.storage.session` (in-memory across that SW lifetime) or `chrome.storage.local` (disk-backed).
4. If you need a tabId, use the `MessageSender.tab.id` or message payload `tabId` rather than re-querying `chrome.tabs.query`.

Bad:
```ts
const cache: number[] = []
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  await loadStuff()  // BAD: listener missed on wake during the await
  cache.push(tabId)  // BAD: cache evaporates when SW suspends
})
```

Good:
```ts
chrome.tabs.onActivated.addListener(({ tabId }) => {
  void persistTabActivation(tabId).catch(() => {})
})
```

## Add a new storage key

1. Register the literal string in `src/shared/storage-keys.ts` under the appropriate sub-namespace. Never embed an unregistered key string in business code.
2. Decide retention up front. Per-tab arrays (results, logs, navigation ledger) are bounded; if your value is bounded by user input or unlimited, write a ring buffer or a "last N entries" trim alongside the writer.
3. If the value originates from outside the extension (file import, network response, user-pasted text), define a Zod schema in `src/shared/schemas.ts` and call `.safeParse` at the read point.
4. Use the typed facade in `src/shared/storage-ops.ts` (`loggedStorageGet` / `loggedStorageSet`). The facade already wraps `set` in `withQuotaRetry` (3 attempts, exponential backoff on quota-shaped errors) and emits storage telemetry counters.

## Add a new rule

1. Create the rule file in `src/rules/<category>/`, register it in `src/rules/registry.ts`, add the test at `tests/rules/<category>.<ruleName>.test.ts`.
2. Every rule MUST declare `meta: { provenance, references }` (`src/core/types.ts`). `provenance` is `'google'` (Google documentation), `'standard'` (RFC/WHATWG/W3C/schema.org/ogp.me/amp.dev), `'franz'` (Franz Enzenhofer best practice - the only provenance allowed an empty references list), or `'general'` (industry best practice). References are full https URLs, primary/most-authoritative first, and you must have actually fetched and read each one - the static test `tests/rules/registry.meta.test.ts` enforces meta on all 127+ rules with per-provenance host allowlists, zero skips.
3. Do NOT hand-write `details.reference` - the runner injects `details.reference = meta.references[0]` and `details.provenance` into every result (pending/disabled/runtime_error included) via `metaDetails` in `src/core/runHelpers.ts`. Only set `details.reference` explicitly when one specific result intentionally cites a different URL than the primary reference.
4. Debug rules (`debug:` id prefix) run and render only while the "Debug data" setting (`ui:debug`) is on - they are filtered out of `getEnabledRules()`, `readPhaseExecution()`, the sidepanel results, coverage, and the settings rule grid (see `src/rules/debugRules.ts`).
5. After changing rules, regenerate the inventory: `npx tsx scripts/export-rules.ts`.

## Add a new content script

1. Update `src/manifest.parts.ts`. Prefer narrow `matches:` patterns; `<all_urls>` requires explicit justification because Chrome recompiles content scripts in every tab they match.
2. Keep the bundle small. Lazy-load anything optional via dynamic `import()` or `chrome.scripting.executeScript` with a separate file. Heavy compute belongs in a Web Worker.
3. Wrap every `addEventListener` in either `{ once: true }` or an `AbortController.signal` that fires on `pagehide`. The reference implementation is `src/content/domCapture.ts` (`initDomCapture`).
4. Never store DOM nodes on globals / module-scope / closures that outlive the page. The audit found one such pattern in `src/content/highlight.ts:4` (module-scope `Element[]`) and the runbook flagging is the only safeguard against it returning.
5. Cap anything you ship over `chrome.runtime.sendMessage`. The reference helper is `src/shared/htmlCap.ts:capHtmlForMessageAsync` -- it returns size + sha256 + head/tail snippet for anything over 256 KB and the JSON wire stays under the 32 KB MV3 budget for any input.
6. Install the crash net: `installCrashNet('content')`.

## Add a new fetch

1. Use `AbortController` + a timeout strictly less than 30 s (Chrome kills the SW on any single fetch > 30 s and any single task > 5 min). The reference helper is `src/shared/fetchOnce.ts` (`fetchTextOnce`, `fetchWithTimeout`).
2. Bound retries. Use `withQuotaRetry` for storage-side concerns; for network, prefer a fixed small backoff and stop.
3. Validate the response with a Zod schema if it came from outside the extension. `src/shared/psi.ts` is the canonical example -- minimal `passthrough()` schema with `.optional()` on every field except the path you actually depend on.
4. Increment the `fetch.fail` telemetry counter on every non-OK / aborted path so the counters reflect production reality.

## Add a new realm/document

If you add another HTML document (e.g. an onboarding page), wire it like every other realm:

1. Call `installCrashNet('your-context')` at the very top of `main.tsx`, before React renders.
2. If it renders React, wrap the root in `<ErrorBoundary>` (the one in `src/sidepanel/ui/ErrorBoundary.tsx`).
3. Use `useStorageListener` from `src/shared/hooks/useStorageListener.ts` for any storage subscription -- it shares the process-wide `chrome.storage.onChanged` listener and disposes correctly on unmount.

## Things to refuse on review

- Top-level `await` in any SW entry point.
- `setInterval` in the SW.
- A new chrome.runtime message payload over 32 KB.
- A new chrome.storage key without a defined retention rule.
- A new chrome.runtime listener that swallows the result of an async handler (handlers should be sync and return `true` if `sendResponse` will be used).
- Bypassing the `withQuotaRetry` storage facade in favor of raw `chrome.storage.local.set`.
- Removing `chrome.runtime.lastError` checks in callback-form APIs.
- Adding a permission without a justification line in `src/manifest.parts.ts`.

## Verification

After any change in the above areas:

```bash
npm run typecheck && npm run lint && npm test
```

For changes that touch the runtime: `npm run build:dev && npm run test:e2e:quick` loads the built extension into a real Chrome via Playwright and runs the rule engine end-to-end.

For changes that touch storage, content scripts, or message payloads: re-read `AUDIT-REPORT.md` to make sure the regression doesn't undo one of the named gains.
