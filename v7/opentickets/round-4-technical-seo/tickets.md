# JIRA Tickets

## Personas
- P1: Technical SEO lead, agency-side, needs fast multi-URL triage and clear filter state
- P2: SEO tooling engineer, relies on priority data for deterministic ordering
- P3: Enterprise SEO consultant, needs quick filtered exports for dev teams

## Tickets

### TCK-401: Filter state is invisible during query-driven triage
- Epic: EPIC-009
- Type: UX
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: User runs a test on Wikipedia and types `error canonical` to focus on failed canonical checks
- Steps:
  1. Run a test
  2. Enter `error canonical` in the filter box
  3. Scan results
- Expected: UI shows active filter context and visible count
- Actual: No indication of hidden types or how many results are filtered out
- IS: Users can misinterpret missing results as “no issues”
- SHOULD: Show “showing X of Y” plus active type/search filters with a reset action
- Reasoning: Power users need immediate confirmation that filters are applied correctly
- Code hints: `src/sidepanel/ui/AppBody.tsx`, `src/sidepanel/ui/Results.tsx`, `src/sidepanel/ui/resultQuery.ts`
- Acceptance criteria:
  - Summary displays visible count vs total
  - Active type filters and search text are visible
  - Reset filters clears type filters and search

### TCK-402: Priority score is hidden in the UI
- Epic: EPIC-010
- Type: UX
- Severity: S3
- Priority: P2
- Persona: P2
- Scenario: User runs a test on fullstackoptimization.com and wants to triage high-priority findings first
- Steps:
  1. Run a test
  2. Scan result cards
- Expected: Priority score is visible per result
- Actual: Priority exists in data but is only accessible via copy JSON
- IS: Users cannot triage efficiently based on priority
- SHOULD: Display a small priority badge in each result header
- Reasoning: Priority scores are already computed and are essential for expert workflows
- Code hints: `src/components/result/ResultHeader.tsx`, `src/components/result/resultCopy.ts`
- Acceptance criteria:
  - Results show a priority badge when priority is present
  - Badge does not overpower severity or rule metadata

### TCK-403: No bulk export of filtered results
- Epic: EPIC-009
- Type: UX
- Severity: S3
- Priority: P2
- Persona: P3
- Scenario: User runs a test on veganblatt.com and wants to send filtered errors to a dev team
- Steps:
  1. Run a test
  2. Apply filters/search
  3. Attempt to copy the filtered list
- Expected: A single action copies the filtered findings
- Actual: Users must copy each card individually
- IS: Sharing findings is slow and error-prone
- SHOULD: Add a “Copy filtered” action for the visible results
- Reasoning: Pro users routinely share filtered findings in tickets or audits
- Code hints: `src/sidepanel/ui/AppBody.tsx`, `src/sidepanel/ui/Results.tsx`, `src/components/result/resultCopy.ts`
- Acceptance criteria:
  - Copy action uses the current filtered results
  - Disabled when there are no visible results

## Review (Devil's Advocate)
- TCK-401: Adds UI chrome that could feel busy, but can stay compact and only show filter details when active.
- TCK-402: Priority numbers are opaque; mitigate by labeling as “Priority” and keeping it secondary to severity.
- TCK-403: Bulk copy could create large clipboard payloads; still acceptable because it is user-triggered and scoped to filtered results.
