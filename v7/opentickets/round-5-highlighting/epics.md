# JIRA Epics

## Context
- Product: Franz Enzenhofer SEO Live Test (MV3 extension)
- Platform: Chrome side panel UI (React, Tailwind)
- Primary flows: open a result, expand details, highlight on-page evidence
- Assumptions: Technical SEOs validate findings on https://www.veganblatt.com/a/vegane-suppeneinlagen-selber-machen, https://www.fullstackoptimization.com/a/seo-growth-consulting, and https://en.wikipedia.org/wiki/Search_engine_optimization

## Severity Scale
- S1: Blocker
- S2: Major
- S3: Minor
- S4: Polish

## Epics

### EPIC-011: Reliable on-page highlighting
- Outcome: Every highlightable rule reliably marks its DOM evidence
- Rationale: Pro workflows depend on instant visual verification
- Impacted personas: P1, P2
- Linked tickets: TCK-501, TCK-502

### EPIC-012: Complete highlight metadata coverage
- Outcome: Rules that can highlight always ship selectors for the DOM evidence
- Rationale: Missing selectors silently break trust in findings
- Impacted personas: P2, P3
- Linked tickets: TCK-503
