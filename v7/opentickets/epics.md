# JIRA Epics

## Context
- Product: Franz Enzenhofer SEO Live Test (MV3 extension)
- Platform: Chrome side panel UI (React, Tailwind)
- Primary flows: run test on active page, review results, filter findings, open report/settings
- Assumptions: users expect a visible Run action and clear status feedback

## Severity Scale
- S1: Blocker
- S2: Major
- S3: Minor
- S4: Polish

## Epics

### EPIC-001: First-run clarity and run control
- Outcome: Users can confidently start a test and understand what the Run action does
- Rationale: First-run friction prevents data collection and erodes trust
- Impacted personas: P1, P2, P3
- Linked tickets: TCK-001, TCK-002

### EPIC-002: Fast triage and filtering
- Outcome: Users can quickly narrow results to relevant severities and avoid accidental reruns
- Rationale: Most sessions are triage-first; filters and shortcuts must be precise
- Impacted personas: P1, P3, P4
- Linked tickets: TCK-003, TCK-004

### EPIC-003: Result trust and status clarity
- Outcome: Users understand what totals mean and trust the coverage shown
- Rationale: Confusing totals reduce confidence in findings
- Impacted personas: P1, P2
- Linked tickets: TCK-005
