# JIRA Epics

## Context
- Product: Franz Enzenhofer SEO Live Test (MV3 extension)
- Platform: Chrome side panel UI (React, Tailwind)
- Primary flows: run test, advanced filtering, error triage
- Assumptions: technical SEOs expect query tokens and deterministic filter semantics

## Severity Scale
- S1: Blocker
- S2: Major
- S3: Minor
- S4: Polish

## Epics

### EPIC-007: Advanced query filtering
- Outcome: Power users can filter by rule ID, label, and name without noisy matches
- Rationale: Large audits require precise filtering and deterministic query semantics
- Impacted personas: P1, P2
- Linked tickets: TCK-301, TCK-303

### EPIC-008: Error taxonomy semantics
- Outcome: Query keywords map to expected error types
- Rationale: "error" should mean failed checks, not runtime failures
- Impacted personas: P1, P3
- Linked tickets: TCK-302
