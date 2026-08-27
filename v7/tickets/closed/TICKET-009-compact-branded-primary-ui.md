# TICKET-009: Compact and Brand the Primary UI

**Status:** Complete (2026-08-27)
**Priority:** High  
**Type:** Product UI  
**Depends on:** TICKET-008

## Problem

The primary side-panel and report flows show excessive help text, coverage diagnostics, metadata badges, and source snippets by default. Product naming is inconsistent across extension surfaces.

## Implementation

- Define one canonical product name: `Franz Enzenhofer SEO Live Test`.
- Use it in the manifest, side panel, report, settings, logs, rule-runs view, CLI HTML report, document titles, action title, and install-facing extension copy.
- Keep internal package names and extension identity unchanged.
- Collapse every result card by default in both the side panel and full report.
- Keep the finding message visible. Move snippets, source, DOM paths, rule ID, phase, priority, and technical metadata behind Details.
- Remove filter tips, coverage diagnostics, missing-rule prose, repeated showing summaries, and metadata badges from the default primary flow.
- Keep diagnostics in debug mode and keep settings explanations unchanged.
- Shorten actions to Run test, Report, Clear, and Settings.
- Use Tailwind classes only and preserve accessible names and keyboard behavior.

## TDD Sequence

### Red

1. Add component tests for the exact product name and compact default state.
2. Add tests proving snippets and technical metadata are hidden until Details opens.
3. Add report tests proving cards are collapsed by default.
4. Add build tests for branded HTML titles and manifest strings.

### Green

Implement the shared brand constant and compact components. Pass focused UI tests, then run typecheck, lint, and the complete unit suite.

## Acceptance Criteria

- Every primary user-facing extension surface says `Franz Enzenhofer SEO Live Test`.
- No result source snippet or technical badge is visible by default.
- Side panel and report use the same compact result behavior.
- Filter and diagnostic power remains available without default prose.
- No custom or inline CSS is introduced.
- Typecheck, lint, and all tests pass.
