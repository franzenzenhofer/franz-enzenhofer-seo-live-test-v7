# JIRA Tickets

## Personas
- P1: Technical SEO Lead, goal: rapid triage across many findings, device: desktop Chrome, constraints: time pressure and large result sets.
- P2: SEO Consultant, goal: create client-ready report deliverables, device: desktop, constraints: clarity and repeatability.
- P3: SEO Engineer, goal: map issues to DOM changes quickly, device: desktop, constraints: needs precise evidence.
- P4: SEO QA Analyst, goal: verify fixes and filter results consistently, device: desktop, constraints: needs transparent filters.

## Tickets

### TCK-801: Report view lacks filtered summary + sort toggle
- Epic: EPIC-801
- Type: UX
- Severity: S2
- Priority: P2
- Persona: P1
- Scenario: Reviewing report for https://en.wikipedia.org/wiki/Search_engine_optimization after running an audit and applying filters.
- Steps:
  1. Open report with runid.
  2. Apply a type filter and search query.
  3. Look for filtered counts and sorting controls.
- Expected: Report shows filtered count, reset controls, and sort mode to mirror side panel triage.
- Actual: Report only shows search input + type toggles; no filtered summary or sort toggle.
- IS: Report triage lacks the side panel summary context.
- SHOULD: Add the filtered summary and sort toggle to the report view.
- Reasoning: Report is a primary deliverable; missing triage context increases audit time.
- Code hints: `src/report/ReportApp.tsx`, `src/sidepanel/ui/ResultsSummary.tsx`, `src/sidepanel/ui/resultSort.ts`.
- Acceptance criteria:
  - Report shows filtered counts and reset when filters are active.
  - Sort toggle works in report with the same behavior as side panel.

### TCK-802: Report search lacks token guidance
- Epic: EPIC-801
- Type: UX
- Severity: S3
- Priority: P3
- Persona: P2
- Scenario: Consultant applies advanced filters for https://www.fullstackoptimization.com/a/seo-growth-consulting.
- Steps:
  1. Focus report search input.
  2. Attempt to use `id:` or `p<200` tokens.
- Expected: Report provides guidance on supported tokens and types.
- Actual: No filter tips are shown in the report UI.
- IS: Token discovery is sidepanel-only.
- SHOULD: Add filter tips to the report view.
- Reasoning: Advanced filters are essential in report deliverables but currently undiscoverable.
- Code hints: `src/report/ReportApp.tsx`, `src/sidepanel/ui/FilterTips.tsx`.
- Acceptance criteria:
  - Filter tips are visible in the report view.
  - Tips include priority examples.

### TCK-803: Priority sort still groups by type
- Epic: EPIC-802
- Type: UX
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Sorting results by priority to triage https://www.veganblatt.com/a/vegane-suppeneinlagen-selber-machen.
- Steps:
  1. Switch to priority sort.
  2. Inspect ordering across different result types.
- Expected: Items are globally ordered by priority regardless of type.
- Actual: Sorting is still grouped by result type.
- IS: Type order is always primary.
- SHOULD: When priority mode is active, prioritize global priority ordering first.
- Reasoning: Priority mode should express urgency, not type categories.
- Code hints: `src/sidepanel/ui/resultSort.ts`.
- Acceptance criteria:
  - Priority sort orders by numeric priority first, then type/name for tie-breaks.

### TCK-804: Result actions menu stays open without outside click/escape
- Epic: EPIC-803
- Type: UX
- Severity: S3
- Priority: P3
- Persona: P4
- Scenario: QA scanning results and opening the actions menu repeatedly.
- Steps:
  1. Open the actions menu (⋮).
  2. Click outside or press Esc.
- Expected: Menu closes when focus leaves the menu.
- Actual: Menu remains open until an action is selected.
- IS: Menu lacks global dismiss behavior.
- SHOULD: Close on outside click and Esc.
- Reasoning: Repetitive triage is slowed by menus that linger.
- Code hints: `src/components/result/ResultActionsMenu.tsx`.
- Acceptance criteria:
  - Outside click closes the menu.
  - Esc closes the menu.

### TCK-805: No-results state hides priority filter context
- Epic: EPIC-801
- Type: UX
- Severity: S4
- Priority: P3
- Persona: P4
- Scenario: Using `p<200` with zero matches.
- Steps:
  1. Apply a priority filter that yields zero results.
  2. Observe the no-results state.
- Expected: The no-results panel shows the active priority constraint.
- Actual: Only types and query presence are shown.
- IS: Priority context is hidden when results are zero.
- SHOULD: Show the active priority constraint in the no-results summary.
- Reasoning: QA needs to see which constraint hid results.
- Code hints: `src/sidepanel/ui/NoResults.tsx`, `src/sidepanel/ui/Results.tsx`.
- Acceptance criteria:
  - No-results view displays priority constraints when active.

### TCK-806: Highlight selectors are hard to read in details
- Epic: EPIC-803
- Type: UX
- Severity: S4
- Priority: P4
- Persona: P3
- Scenario: Developer copies selectors from results details.
- Steps:
  1. Open a result with highlight selectors.
  2. Inspect the details block.
- Expected: Selectors are shown in a readable list with a clear label.
- Actual: Raw JSON array is shown under an uppercase key.
- IS: Selector evidence is technically present but not readable.
- SHOULD: Render selector lists with line breaks and a human label.
- Reasoning: Developer handoff needs copy-friendly selectors.
- Code hints: `src/components/result/ResultDetails.tsx`.
- Acceptance criteria:
  - Highlight selectors render as a list with one selector per line.
  - Label is human-readable.

## Devil's Advocate Review
- Accept: TCK-801, TCK-802, TCK-803, TCK-804, TCK-805, TCK-806.
- Reject/Defer: None for this round; all are low-risk improvements that strengthen end-to-end UX.
