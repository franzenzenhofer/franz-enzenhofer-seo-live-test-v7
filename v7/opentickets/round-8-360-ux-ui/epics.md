# JIRA Epics

## Context
- Product: Franz Enzenhofer SEO Live Test (MV3 extension)
- Platform: Chrome side panel + report view (React + Tailwind)
- Primary flows: run audit, triage results, filter/sort, inspect details/highlight, copy/export, open report.
- Assumptions: Extension loaded, audits run for multiple URLs, technical SEO and QA users on desktop.

## Severity Scale
- S1: Blocker
- S2: Major
- S3: Minor
- S4: Polish

## Epics

### EPIC-801: Report + side panel parity for triage
- Outcome: Users can filter/sort in the report with the same clarity as the side panel.
- Rationale: Report view is a primary delivery artifact; missing triage controls slows audits.
- Impacted personas: P1, P2, P4
- Linked tickets: TCK-801, TCK-802, TCK-805

### EPIC-802: Priority ordering clarity
- Outcome: Priority sorting reflects urgency, not type grouping.
- Rationale: When urgency is the sorting mode, the list should be globally ordered by priority.
- Impacted personas: P1, P3
- Linked tickets: TCK-803

### EPIC-803: Actionable evidence and controls
- Outcome: Result actions are dismissible and selector evidence is readable/copyable.
- Rationale: Small interaction gaps compound during long audit sessions.
- Impacted personas: P2, P3, P4
- Linked tickets: TCK-804, TCK-806
