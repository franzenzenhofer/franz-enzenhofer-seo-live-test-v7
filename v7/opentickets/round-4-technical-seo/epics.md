# JIRA Epics

## Context
- Product: Franz Enzenhofer SEO Live Test (MV3 extension)
- Platform: Chrome side panel UI (React, Tailwind)
- Primary flows: run test on a URL, filter results, triage issues, share findings
- Assumptions: technical SEO power users run audits on https://www.veganblatt.com/a/vegane-suppeneinlagen-selber-machen, https://www.fullstackoptimization.com/a/seo-growth-consulting, and https://en.wikipedia.org/wiki/Search_engine_optimization

## Severity Scale
- S1: Blocker
- S2: Major
- S3: Minor
- S4: Polish

## Epics

### EPIC-009: Filter clarity and shareable outputs
- Outcome: Technical SEOs can confirm filter state and export filtered findings quickly
- Rationale: Advanced triage depends on knowing what is filtered and sharing concise lists
- Impacted personas: P1, P3
- Linked tickets: TCK-401, TCK-403

### EPIC-010: Priority visibility for triage
- Outcome: Users can see priority scores in the UI while scanning results
- Rationale: Priority data is already computed but hidden, slowing expert triage
- Impacted personas: P2
- Linked tickets: TCK-402
