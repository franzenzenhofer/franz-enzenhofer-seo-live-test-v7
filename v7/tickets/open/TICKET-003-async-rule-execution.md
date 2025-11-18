# TICKET-003 – Async Rule Execution & Run-State Integrity

**Status:** 🆕 Open  
**Priority:** P0 — blocks reliable live testing  
**Owner:** Codex (async-rool-executin)  
**Principles:** Single Source of Truth · DRY · Fully Tested · Tailwind-only UI (no direct styling impact here)  
**Goal:** Deliver cancellable, per-run async rule execution so slow rules never block fast ones, while side panel + reports always show results for the active `{tabId, runId}` pair only.

---

## Current Run/Rule Flow (What Exists Today)

- `runRulesOn` (`v7/src/background/rules/runner.ts`) creates a `RunState` via `createRunState`, writes `results:${tabId}` and `results-meta:${tabId}` in `chrome.storage.local`, and pushes events to the offscreen document.
- `runAll` (`v7/src/core/run.ts`) loops through the registry sequentially. Each rule awaits completion before the next begins; the offscreen→background timeout is binary (`15s` vs `60s`) and applies to the entire batch.
- Results already store `runIdentifier` (via `enrichResult`), and the side panel filters with `filterResultsByRunId`, so UI already expects clean `{runId → results}` linkage.
- There is **no cancellation**: once `runInOffscreen` starts, the SW waits even if the user hard-reloads or navigates, so stale runs keep writing into `results:${tabId}`.
- Slow rules (API/multi-page) block simple DOM rules because we await them in series, and there's only a single global timeout knob.

📌 **Implication:** Users see partial data for the wrong run after reload, logs become noisy, and rules that need 60s+ block everything else even though results are chunked incrementally.

---

## Objectives

1. **Run-State Single Source of Truth (SST):** one canonical run-session record per tab that owns runId, status, cancellation reason, and storage guardrails.
2. **Async Rule Execution:** schedule rules concurrently with per-rule timeout configuration (default 15s, API 60s, multi-page 10m) so long-running work never blocks short checks.
3. **Deterministic Results:** persist only chunks that belong to the active `{tabId, runId}`; cancel/ignore writes from aborted runs when the tab reloads/navigates away.
4. **Clean Logging & Tests:** rich run/rule logging (start, finish, timeout, cancel) plus regression tests covering scheduler, timeout metadata, and run-state transitions.
5. **Reversible & Minimal:** touch the smallest set of modules (`background/rules/*`, `core/run.ts`, `offscreen/*`, shared docs/tests) while keeping the UI contract unchanged.

---

## Proposed Plan

### Phase A – Run Session Ledger & Cancellation (SST)

1. **Introduce `RunSessionStore` (`v7/src/background/rules/sessions.ts`, ≤75 lines):**
   - Maintains `Map<tabId, { runId, abortController, status, startedAt }>` in the SW.
   - Persists a mirrored snapshot to `chrome.storage.session` (optional but keeps state after SW restart).
   - Exposes `start(tabId, metadata)`, `complete(tabId, resultCount)`, `fail(tabId, reason)`, and `abort(tabId, reason)` returning the active runId.
2. **Integrate with Runner:**
   - `runRulesOn` calls `sessions.abort(tabId, 'superseded')` before creating a new run to guarantee only one active session per tab.
   - Store the `AbortSignal` from the session and pass it into `runInOffscreen` / `runAll`.
   - When the run finishes (success or error), `completeRunState` is called with the final status and logged reason.
3. **Storage Guard Rail:**
   - Enhance `createChunkSync` to call `sessions.isActive(tabId, runId)` before `persistResults`. If `false`, skip the chunk and log `runner:drop-stale`.
   - Update `writeRunMeta` calls to include `status: 'aborted'` when sessions signal cancellation.
4. **Cancellation Hooks:**
   - Hard Reload / Real Navigation: when `determineTrigger` returns a navigation reason or when `chrome.tabs.onUpdated` reports a new URL for the active tab, call `sessions.abort` for that tab to stop the prior run.
   - Manual `Hard Reload` button (side panel) should clear results, call a `chrome.runtime.sendMessage`/existing pipeline trigger, and also mark the current session as aborted.
5. **Logging:**
   - Add `Logger.logDirect` events `runner:abort`, `runner:cancel-request`, `runner:skip-stale-chunk`, including `{ tabId, runId, reason }`.

### Phase B – Async Rule Scheduler & Per-Rule Timeouts

1. **Extend Rule Contract:**
   - Update `Rule` in `v7/src/core/types.ts` to add optional metadata:
     ```ts
     export type RuleTimeout = { mode?: 'fast' | 'api' | 'multipage'; timeoutMs?: number }
     type Rule = { ..., timeout?: RuleTimeout }
     ```
   - Keep fields optional so existing rules stay untouched; we only annotate the slow/API/multi-page ones over time.
2. **Expose Timeout from Results:**
   - Allow a rule to override the timeout dynamically by returning `{ ...result, timeoutMs?: number }` (documented as best-practice) — background uses metadata first, result override second.
3. **Async Scheduler in `runAll`:**
   - Replace the serial `for` loop with a task scheduler that:
     - Builds an array of `RuleTask = { rule, run: () => Promise<Result>, timeoutMs }`.
     - Uses a simple pooled executor (no new deps) — e.g., `const limit = navigator.hardwareConcurrency ? Math.min(4, N) : 3`.
     - Wraps each promise in `Promise.race([rule.run, timeout, abortSignal])`.
     - Emits chunks immediately as each task resolves, preserving order metadata in `Logger`.
     - On abort, rejects with `RunCancelledError` so `runRulesOn` can mark the session aborted without logging a global error.
   - Keep disabled rules path untouched (still synchronous) for clarity.
4. **Per-Rule Timeout Strategy:**
   - Defaults: `15_000ms` (fast/on-page).
   - If `rule.timeout?.mode === 'api'` → `60_000ms`.
   - If `mode === 'multipage'` → `600_000ms`.
   - If `rule.timeout?.timeoutMs` provided, honor it (bounded to ≤10m).
   - Document fallback in `BEST-PRACTICE-RULES.md` under “Rule metadata”.
5. **Offscreen Runner Updates:**
   - `runInOffscreen`: accept `{ signal, overallTimeoutMs }`. When `signal.aborted`, send `{ channel:'offscreen', action:'cancel', replyTo:id }` so the offscreen page stops scheduling new tasks.
   - `offscreen/main.ts`: track active controllers by `messageId`; on cancel message, call `controller.abort()` so `runAll` stops.
   - `handleRun`: pass the signal down to `runAll` via a new option parameter.
6. **Stopping Rule Execution on Tab Navigation:**
   - When `sessions.abort` runs, call `runInOffscreen.cancel(messageId)` to stop execution; background should flush pending chunk queue and mark run meta as aborted.
7. **Result Integrity:**
   - After cancellation, call `cleanupOldResults` to strip pending entries for the aborted run and immediately seed pending entries for the new run.
   - Ensure `appendRunHistory` records aborted runs with `status: 'aborted'` so history view is accurate.

### Phase C – Documentation, DRY Utilities, and Tests

1. **DRY Utilities:**
   - Extract shared timeout constants + mapping to `v7/src/background/rules/timeouts.ts`.
   - Move repeated log message formatting into `v7/src/background/rules/logLabels.ts` (≤75 lines) to keep runner slim.
2. **Documentation Updates:**
   - `BEST-PRACTICE-RULES.md`: add subsection “Rule Timeouts & Async Execution” explaining default 15s, API 60s, multi-page 10m, plus how to request a custom timeout.
   - `ENHANCED-REPORTING.md` / `RULES-VERIFICATION.md`: mention new `runIdentifier` guard and `timeout` metadata so QA knows how to test.
3. **Testing Strategy:**
   - Unit tests in `v7/tests/core.runAsync.test.ts` verifying:
     - Multiple rules resolve concurrently (mock `setTimeout` + `FakeRule`).
     - Signals cancel outstanding work and no chunk is emitted afterwards.
     - Per-rule timeout fallback/discrete overrides (fast vs API vs multipage).
   - Tests for `RunSessionStore` (start/abort/complete transitions, guard skipping stale chunks) under `v7/tests/background.runSessions.test.ts`.
   - Integration-style test for `filterResultsByRunId` already exists; add one for `cleanupOldResults` to ensure aborted runs drop properly.
4. **Logging Verification:**
   - Add Vitest snapshot of `Logger.logDirectSend` payload for `RunCancelledError`.
   - Ensure `runHistory` stores aborted runs with reason, tested via `v7/tests/shared.runHistory.test.ts`.

---

## Acceptance Criteria

- ✅ Only one active `runId` per tab; starting a new run aborts/cleans the previous.
- ✅ Side panel never shows results from another run (guarded by `runIdentifier` + chunk filter).
- ✅ Rules execute concurrently; long API/multi-page checks do not block on-page rules.
- ✅ Hard reload and true navigations cancel in-flight executions within 100ms and mark run meta `aborted`.
- ✅ Slow rules can declare 60s or 10m timeouts; default remains 15s when unspecified.
- ✅ All new helpers ≤75 lines (≤150 for rule modules), linted, typechecked, unit-tested.

---

## Risks & Mitigations

- **Race conditions when SW restarts:** Mirror session state in `chrome.storage.session` so we can detect stale `runId`s during chunk flush.
- **Burst CPU from running 100 rules at once:** limit concurrency (e.g., 4) and queue the rest; keep ability to tweak easily.
- **Rules unaware of cancellation:** Provide `ctx.globals.abortSignal` so rules that do I/O can opt-in to early bailouts without API change.
- **Offscreen cleanup:** ensure `runInOffscreen` tears down listeners after cancellation to avoid leaks; add regression tests.

---

## Next Steps

1. Approve this ticket (10x-plan) ✅  
2. Land `RunSessionStore` + guard rails.  
3. Refactor `runAll` with async scheduler + tests.  
4. Wire cancellation from UI/events → sessions → offscreen.  
5. Document timeout metadata + update slow rules.  
6. Run `npm run typecheck && npm run lint && npm test && npm run build` before each commit per AGENTS.md.

Once this plan is signed off, implement step-by-step with atomic commits, full gate runs, and Sherlock-level logging. Reversible approach: revert per file/commit without touching unrelated modules.
