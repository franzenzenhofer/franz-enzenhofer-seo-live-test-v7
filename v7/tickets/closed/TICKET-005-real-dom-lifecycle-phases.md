# TICKET-005: Restore Real DOM Lifecycle Phases

**Status:** Complete  
**Priority:** Critical  
**Type:** Correctness  
**Depends on:** None

## Problem

The manifest injects one content script at `document_idle`. That script sends two immediate captures named `document_end` and `document_idle`, so rules often compare the same DOM while claiming they are different phases.

The required lifecycle inputs are:

1. Static DOM at Chrome's real `document_end` phase.
2. Hydrated DOM at Chrome's real `document_idle` phase.
3. `DOMContentLoaded` and `load` timing events without extra DOM copies.

## Implementation

- Register separate, top-frame content entrypoints at `document_end` and `document_idle`.
- Share tab resolution, crash handling, navigation identity, and phase messaging through focused utilities.
- Emit exactly one DOM phase event per navigation and phase.
- Store a phase timestamp, URL string, navigation identity, and capture status with each event.
- Remove the idle fallback for missing static DOM. Missing phases must remain missing.
- Keep the legacy directory read-only.

## TDD Sequence

### Red

1. Add a manifest test requiring distinct `document_end` and `document_idle` scripts.
2. Add page-enrichment tests proving static and idle HTML remain distinct.
3. Add a test proving missing static input does not fall back to idle.
4. Add an integration fixture that mutates title, metadata, and links between phases.

Run the focused tests and record the expected failures before changing production code.

### Green

Implement the lifecycle split, then make the focused tests pass. Run typecheck and lint before completion.

## Acceptance Criteria

- Static and idle phase timestamps and content differ on the mutation fixture.
- One navigation cannot emit duplicate events for the same phase.
- Missing static capture is reported as unavailable rather than fabricated.
- Existing Run Test hard reload still triggers a complete run.
- Typecheck, lint, and all focused tests pass.
