# JIRA Epics

## Context
- Product: Franz Enzenhofer SEO Live Test (MV3 extension)
- Platform: Chrome side panel UI (React, Tailwind)
- Primary flows: run test, triage, search for rules, validate runtime integrity
- Assumptions: technical SEO users know rule IDs and expect run status visibility

## Severity Scale
- S1: Blocker
- S2: Major
- S3: Minor
- S4: Polish

## Epics

### EPIC-004: Traceable, searchable rule discovery
- Outcome: Technical SEOs can find rules by ID/name and map results to rule documentation
- Rationale: Pro users depend on deterministic identifiers for collaboration and QA
- Impacted personas: P1, P2
- Linked tickets: TCK-201, TCK-204

### EPIC-005: Run state transparency
- Outcome: Users can quickly see if a run is running, completed, or failed
- Rationale: Pro workflows rely on knowing whether data is current and trustworthy
- Impacted personas: P1, P3
- Linked tickets: TCK-202

### EPIC-006: Error taxonomy clarity
- Outcome: Users can distinguish rule failures from runtime errors at a glance
- Rationale: Misinterpreting runtime errors leads to false conclusions
- Impacted personas: P1, P2
- Linked tickets: TCK-203
