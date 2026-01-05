# JIRA Epics

## Context
- Product: Franz Enzenhofer SEO Live Test (MV3 extension)
- Platform: Chrome side panel (React + Tailwind)
- Primary flows: run audit for a URL, inspect results, filter/sort, open details + highlight, copy filtered results, open full report.
- Assumptions: Extension is loaded, side panel open, results available for the three test URLs, technical SEO users on desktop Chrome.

## Severity Scale
- S1: Blocker
- S2: Major
- S3: Minor
- S4: Polish

## Epics

### EPIC-701: Power triage for technical SEO audits
- Outcome: Technical SEOs can isolate high-impact issues in seconds using priority-aware filtering.
- Rationale: Numeric priority scores are currently read-only, slowing triage of large result sets.
- Impacted personas: P1, P2, P4
- Linked tickets: TCK-701

### EPIC-702: Fixable evidence and highlight coverage
- Outcome: Results consistently highlight the exact DOM elements that need fixes.
- Rationale: Several rules return fixable elements but do not expose highlight selectors, reducing actionability.
- Impacted personas: P1, P3, P4
- Linked tickets: TCK-702, TCK-703

### EPIC-703: Google spec rule coverage expansion
- Outcome: Core Google-specific technical requirements are enforced with explicit checks.
- Rationale: Hard, testable Google specs are missing from the rule set.
- Impacted personas: P1, P3
- Linked tickets: TCK-704, TCK-705, TCK-706, TCK-707, TCK-708
