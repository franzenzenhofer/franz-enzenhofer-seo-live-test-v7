# TICKET-006: Analyze Live DOM Without Full-Page Copies

**Status:** Complete (2026-08-27)
**Priority:** Critical  
**Type:** Performance and architecture  
**Depends on:** TICKET-005

## Problem

Each phase currently serializes the whole document, sends it through runtime messaging, rewrites it in session storage, and parses it into multiple detached `Document` objects. Memory therefore scales as several copies of each page and can terminate extension contexts on large sites.

Static and idle DOM semantics are required, but complete HTML strings are not.

## Implementation

- Add explicit rule input metadata: `static`, `idle`, `compare`, or `context`.
- Run static and idle DOM rules sequentially against the live `Document` in their real content-script phases.
- Send bounded rule results and typed comparison facts, never full-page HTML.
- Keep HTTP, navigation, API, and remote-fetch evaluation in the offscreen runner.
- Provide compact typed SEO facts only for context rules that also need DOM signals.
- Compare rules retain only their required phase data. Parameterized-link sets use an extension-owned, chunked spill store instead of in-memory full documents.
- The CLI adapter parses its provided HTML once as static input. Idle and comparison rules return explicit unavailable results when browser lifecycle data does not exist.
- Retire full-HTML capture and multi-document page assembly. Move truly orphaned modules to `trash/` with a dated note.

## TDD Sequence

### Red

1. Add contract tests requiring phase metadata for every registered rule.
2. Add tests proving phase messages reject an `html` field and enforce payload limits.
3. Add runner tests proving only the matching phase's rules execute.
4. Add comparison tests proving static and idle facts remain distinct.
5. Add a generated large-DOM test proving results do not contain full HTML or unbounded arrays.

### Green

Implement the phase runner and compact contracts until the focused tests pass, then run the complete unit suite, typecheck, and lint.

## Acceptance Criteria

- No production runtime message or session record contains complete page HTML.
- No offscreen run creates static, idle, end, and DOMContentLoaded `Document` clones.
- Every registered rule has an explicit input phase.
- Rule IDs, user flags, result names, and the `results:<tabId>` contract remain stable.
- A failed or missing phase affects only rules that require that phase.
- Typecheck, lint, and all tests pass.

## Completion - 2026-08-27

The live phase runner, compact facts, bounded result chunks, CLI single-parse adapter, comparison-unavailable behavior, and full pipeline integration coverage are complete. Final release gates are recorded in TICKET-010.
