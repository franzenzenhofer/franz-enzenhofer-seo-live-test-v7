# JIRA Tickets

## Personas
- P1: SEO analyst, desktop, wants quick triage of errors/warnings and shareable insights
- P2: Marketing lead, desktop, wants confidence that results are complete and trustworthy
- P3: Frontend engineer, keyboard-heavy, needs fast filters and minimal accidental reloads
- P4: Consultant, time-boxed reviews, needs fast severity focus and clear status

## Tickets

### TCK-001: Empty state hides Run action and copy is inconsistent
- Epic: EPIC-001
- Type: UX
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: First-time user opens side panel on a page (e.g., veganblatt article)
- Steps:
  1. Open side panel with no prior runs for the tab
  2. Read the empty state copy
- Expected: Visible Run/Start CTA and consistent copy
- Actual: Message says “Click Run to start” but no Run button is visible; only keyboard Enter works
- IS: Empty state is a dead-end for mouse users
- SHOULD: Show the Run CTA and align empty-state copy to the visible action
- Reasoning: First-run friction blocks testing and makes the product feel broken
- Code hints: `src/sidepanel/ui/App.tsx`, `src/sidepanel/ui/NoResults.tsx`, `src/sidepanel/ui/RunNow.tsx`
- Acceptance criteria:
  - Empty state shows a visible Run CTA
  - Copy matches the CTA label
  - Mouse-only users can start a run without guessing shortcuts

### TCK-002: Run action label “Hard Reload” is confusing and lacks intent
- Epic: EPIC-001
- Type: UX
- Severity: S3
- Priority: P2
- Persona: P2
- Scenario: User wants to analyze the current page without fear of destructive actions
- Steps:
  1. Open side panel and locate the primary action button
- Expected: Action explains it runs a test and what it does to the page
- Actual: “Hard Reload” sounds like a dev-only action and doesn’t explain it runs analysis
- IS: Primary CTA doesn’t communicate analysis intent or consequences
- SHOULD: Rename to “Run test” (or “Run now”) and explain reload/cache clearing
- Reasoning: Clear intent increases trust and reduces hesitation to start runs
- Code hints: `src/sidepanel/ui/RunNow.tsx`, `src/shared/hardRefresh.ts`
- Acceptance criteria:
  - Primary CTA label communicates “run test” intent
  - Tooltip or helper text clarifies the reload/cache behavior

### TCK-003: Keyboard shortcuts trigger accidental runs and Cmd/Ctrl+F doesn’t focus search
- Epic: EPIC-002
- Type: UX
- Severity: S2
- Priority: P1
- Persona: P3
- Scenario: Engineer is typing in the URL field or search and presses Enter/Cmd+F
- Steps:
  1. Focus the URL input or search box
  2. Press Enter or Cmd/Ctrl+F
- Expected: Enter submits input only; Cmd/Ctrl+F focuses the filter without browser find
- Actual: Enter triggers a run; Cmd/Ctrl+F opens browser find and may not focus search
- IS: Shortcuts override text entry and cause unintended page reloads
- SHOULD: Ignore Enter when typing and prevent default find while focusing filter
- Reasoning: Reduces accidental reruns and preserves power-user flow
- Code hints: `src/sidepanel/ui/Shortcuts.ts`, `src/sidepanel/ui/Search.tsx`
- Acceptance criteria:
  - Enter does not run when an input/textarea/contenteditable is focused
  - Cmd/Ctrl+F focuses the filter input and prevents browser find

### TCK-004: Severity filters only allow single-type focus (no multi-select)
- Epic: EPIC-002
- Type: UX
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: SEO analyst wants to review errors + warnings together
- Steps:
  1. Click the “Warn” filter
  2. Attempt to add “Failed” to the filter
- Expected: Ability to show multiple severities at once
- Actual: Clicking a filter switches to only that type; multi-select is not possible
- IS: Filter behavior hides relevant issues and slows triage
- SHOULD: Allow toggling multiple types, with optional “only this type” shortcut
- Reasoning: Analysts commonly work from errors + warnings as a combined queue
- Code hints: `src/sidepanel/ui/TypeFilters.tsx`, `src/shared/resultFilterState.ts`
- Acceptance criteria:
  - Users can enable multiple types simultaneously
  - “Only this type” remains possible (e.g., via modifier key or second click)

### TCK-005: “Total 116” label is ambiguous and doesn’t match visible counts
- Epic: EPIC-003
- Type: UX
- Severity: S3
- Priority: P2
- Persona: P2
- Scenario: Marketing lead scans totals to understand coverage
- Steps:
  1. Review the total rule count and per-type counts
- Expected: Totals are self-explanatory and add up, or missing items are surfaced
- Actual: Total shows 116 while counts sum lower; missing rules are hidden unless debug
- IS: Users can’t tell if results are complete or if rules were skipped
- SHOULD: Clarify label (“Total rules”) and surface missing/unconfigured counts
- Reasoning: Trust in coverage is essential for acting on recommendations
- Code hints: `src/sidepanel/ui/TypeFilters.tsx`, `src/shared/resultCoverage.ts`
- Acceptance criteria:
  - Total label reflects what is being counted
  - Missing/unconfigured counts are visible to all users
