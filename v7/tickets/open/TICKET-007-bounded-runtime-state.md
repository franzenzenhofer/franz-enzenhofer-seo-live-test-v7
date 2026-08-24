# TICKET-007: Bound Runtime Events, Logs, Results, and Tab State

**Status:** Open  
**Priority:** Critical  
**Type:** Reliability  
**Depends on:** TICKET-006

## Problem

The service worker appends every request event to one array and rewrites the complete array for each event. Logs do the same with up to 3,000 entries. Result persistence can throw on size limits, and closed tabs leave state behind.

## Implementation

- Replace the raw event array with one typed per-navigation record containing main response data, phase completion, timing, and the existing 50-hop navigation ledger.
- Deduplicate resource URLs and flush them in bounded batches. Track total and dropped counts separately from bounded evidence.
- Run automatic audits only for the active tab. Inactive tabs do not perform DOM scans, remote probes, or API calls.
- Default debug mode to off. Normal logging retains only run summaries, warnings, errors, and crashes in a small ring buffer.
- Sanitize result details centrally: at most 10 evidence entries, 8 KB of details, and 2,000 characters per message.
- On result quota failure, retry with details removed while preserving the core result for every rule.
- Abort stale work and clear session runs, logs, phase data, and ledgers on navigation or tab closure.
- Maintain a bounded LRU index for closed-tab result keys without changing active-tab storage keys.

## TDD Sequence

### Red

1. Add collector tests for resource deduplication, batching, and bounded state.
2. Add tests proving inactive tabs do not finalize automatic runs.
3. Add log retention and default-debug tests.
4. Add result sanitization and quota-retry tests.
5. Add tab-close cleanup and stale-run cancellation tests.

### Green

Implement one state owner and shared bounding helpers. Pass focused tests before running the full unit suite, typecheck, and lint.

## Acceptance Criteria

- Storage writes do not grow quadratically with resource count.
- Large detail payloads cannot abort an otherwise valid run.
- All enabled rules end in a terminal result, including storage-degradation cases.
- Closed tabs leave no session state.
- Automatic full audits run only for the active tab.
- Typecheck, lint, and all tests pass.

