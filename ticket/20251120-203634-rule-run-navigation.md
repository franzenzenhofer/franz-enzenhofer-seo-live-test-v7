# Run execution reruns stale DOM after navigation/hard refresh

## Context
- User flow: auto-run is enabled, navigating to a new page or clicking “Hard refresh” should produce exactly one run for the latest page in the tab, with results/meta aligned to that page only.
- Current pipeline: DOM capture schedules a finalize alarm (`scheduleFinalize`), and navigation start (`nav:before`) aborts the active session and clears results but does not cancel the pending alarm or reset the buffered events.

## Problem
- If you navigate (or hit hard refresh) after DOM capture but before the 200ms finalize alarm fires, the alarm still runs the previous DOM snapshot even though a new navigation has begun.
- `pushEvent` (`v7/src/background/pipeline/collector.ts`) adds the new `nav:before` event to the same buffered run, clears results, and aborts the old session, but **does not clear the pending alarm or buffer**.
- `onAlarm` then pops that mixed buffer and `runRulesOn` treats it as a fresh run: it derives the run URL from the **last** nav event (the new page) while `pageFromEvents` builds the DOM from the **old** page HTML. Results/meta now claim to belong to the new page but contain the old page’s DOM/headers.
- Hard refresh amplifies this: the run for the pre-refresh DOM is executed after the results were cleared for the refresh, so “stale” results reappear and the new run races it.

## 7 Whys
1. Why do rules look wrong/missing after navigation or hard refresh? Because a run executes with DOM from the previous page.
2. Why is the previous DOM used? The finalize alarm runs even after a new navigation starts.
3. Why does the alarm still fire? `nav:before` aborts sessions/clears results but never cancels the pending finalize alarm or drops the buffer.
4. Why is the buffer reused? Events for the new navigation are appended to the same `run:{tabId}` store instead of starting a new run when navigation starts.
5. Why does the run claim the new URL? `derivePageUrl` in the runner takes the last nav event (new page), while `pageFromEvents` builds the DOM from the first nav event (old page), so metadata points to the new page but DOM is old.
6. Why does that produce haywire counts/results? Rules that depend on URL/header vs DOM now see mismatched inputs, leading to skipped/errored rules and results for the wrong page resurfacing after results were cleared.
7. Why isn’t this self-correcting? There is no guard to drop a run when navigation happens after DOM capture, and no alignment check between DOM timestamp and latest nav in the buffer.

## Desired clean behaviour
- Each navigation/hard refresh creates a fresh run buffer; if navigation begins before finalize, drop the pending run entirely.
- Finalize only executes when the buffered DOM and latest nav belong to the same navigation; otherwise discard.
- Run metadata (runId/url) and results must always reference the DOM captured for that navigation; no stale runs should repopulate cleared results.

## Tasks
1) In `v7/src/background/pipeline/collector.ts`, cancel the pending finalize when `nav:before` arrives (clear alarm + drop buffer), so stale DOM cannot execute after a navigation starts.  
2) Add a stale-run guard in the alarm handler: if the latest event is a `nav:*` newer than the newest `dom:*`, skip execution and drop the buffer.  
3) Align URL derivation: ensure `pageFromEvents` uses the same final URL as `getPageUrl` (last nav), so DOM and URL stay consistent.  
4) Add regression tests covering: navigation between DOM idle and finalize, fast double refresh, and URL alignment when nav events change after DOM capture.  
5) Update docs/runbook to state “runs are per-navigation; nav after DOM cancels the pending run”.  
