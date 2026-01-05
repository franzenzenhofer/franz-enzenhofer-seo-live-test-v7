# JIRA Tickets

## Personas
- P1: Technical SEO lead, enterprise audits, needs deterministic rule IDs for internal QA
- P2: SEO tooling engineer, maps findings to rule docs and automation pipelines
- P3: Agency technical SEO, time-boxed audits, needs run status certainty

## Tickets

### TCK-201: Search does not match rule IDs or rule names
- Epic: EPIC-004
- Type: UX
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Technical SEO searches for a known rule ID (e.g., "head:canonical")
- Steps:
  1. Run a test on a page
  2. Enter "head:canonical" in the filter box
- Expected: Results filtered to the canonical rule(s)
- Actual: Zero results because search only matches label + message
- IS: Search ignores rule IDs and names
- SHOULD: Include rule ID and rule name in search indexing
- Reasoning: Pro users expect deterministic search by ID/name when triaging large rule sets
- Code hints: `src/sidepanel/ui/Results.tsx`, `src/shared/results.ts`
- Acceptance criteria:
  - Filtering by rule ID returns matching results
  - Filtering by rule name returns matching results

### TCK-202: Run status is not visible in the header
- Epic: EPIC-005
- Type: UX
- Severity: S2
- Priority: P1
- Persona: P3
- Scenario: User wants to confirm the run completed before sharing results
- Steps:
  1. Trigger a new run
  2. Look for status in the header area
- Expected: Clear status indicator (running/completed/aborted/error)
- Actual: Only runId and timestamp are shown
- IS: Users cannot verify if data is still running or aborted
- SHOULD: Display run status next to runId/ranAt
- Reasoning: Run status is critical for audit reliability and repeatability
- Code hints: `src/components/RunMetaDisplay.tsx`, `src/components/HeaderUrlSection.tsx`, `src/sidepanel/ui/PanelHeader.tsx`
- Acceptance criteria:
  - Status label is visible and updates with run state
  - Status does not overwhelm the header layout

### TCK-203: Runtime errors are visually labeled as generic "error"
- Epic: EPIC-006
- Type: UX
- Severity: S3
- Priority: P2
- Persona: P2
- Scenario: User distinguishes rule failures from runtime errors
- Steps:
  1. Review type filters and result badges
- Expected: Runtime errors are labeled distinctly ("rule error" or "runtime")
- Actual: Runtime errors show as "error" which is ambiguous with failures
- IS: Error taxonomy is confusing for technical audits
- SHOULD: Rename runtime_error label to a distinct name
- Reasoning: Misclassification can lead to incorrect remediation actions
- Code hints: `src/shared/colors.ts`, `src/sidepanel/ui/TypeFilters.tsx`
- Acceptance criteria:
  - Runtime errors have a distinct label from failed checks

### TCK-204: Rule ID is not visible in result cards
- Epic: EPIC-004
- Type: UX
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: User wants to reference a rule ID while documenting issues
- Steps:
  1. Open a result card
  2. Look for the rule ID
- Expected: Rule ID is visible without copying
- Actual: Rule ID is only available via copy payload (hidden)
- IS: Users must copy or guess rule IDs
- SHOULD: Show rule ID in the result header in a compact style
- Reasoning: Rule IDs are essential for collaboration and referencing docs
- Code hints: `src/components/result/ResultHeader.tsx`
- Acceptance criteria:
  - Rule ID is visible in each result card (when present)
  - Display is compact and not distracting
