# TICKET-010: Stress Verification and Release Gates

**Status:** Open  
**Priority:** Critical  
**Type:** Verification  
**Depends on:** TICKET-009

## Problem

Unit coverage alone does not prove that the extension survives large DOMs, many resources, repeated navigation, storage failures, or multiple open tabs.

## Implementation

- Add generated Playwright fixtures rather than committing huge HTML files.
- Cover a 100,000-node DOM, tens of thousands of links/resources, oversized JSON-LD, rapid navigation, cancellation, and storage rejection.
- Add a many-tab case proving only the active tab performs a complete audit.
- Assert every enabled rule reaches a terminal state and no extension context reports an unhandled error.
- Assert runtime messages and stored phase records stay within their contracts and contain no complete HTML.
- Update architecture and rule-inventory documentation with the final phase mapping, memory bounds, degradation behavior, and active-tab policy.
- Run all repository quality gates and the quick extension E2E suite.

## TDD Sequence

### Red

1. Add stress and contract tests against the pre-ticket implementation and record the expected failures.
2. Do not weaken fixture sizes or assertions to obtain green.

### Green

Fix only defects exposed by the stress suite. Re-run focused stress tests after each fix, then execute all final gates.

## Acceptance Criteria

- The 100,000-node fixture completes without extension-context termination.
- Repeated navigation and cancellation leave no stale running state.
- Many-tab execution remains active-tab-only.
- Missing or exhausted resources produce explicit rule-scoped failures, never false passes.
- `npm run -w v7 typecheck`, `npm run -w v7 lint`, `npm run -w v7 test`, `npm run -w v7 build`, and `npm run -w v7 test:e2e:quick` pass.
- Documentation matches the implemented contracts.
