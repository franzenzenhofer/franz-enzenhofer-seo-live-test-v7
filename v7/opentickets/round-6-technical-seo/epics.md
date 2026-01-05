# JIRA Epics

## Context
- Product: Franz Enzenhofer SEO Live Test (MV3 extension)
- Platform: Chrome side panel + report
- Primary flows: Run test on a URL, triage results, highlight DOM nodes, filter/sort, export findings
- Assumptions: Tested with https://www.veganblatt.com/a/vegane-suppeneinlagen-selber-machen, https://www.fullstackoptimization.com/a/seo-growth-consulting, https://en.wikipedia.org/wiki/Search_engine_optimization; personas are senior technical SEOs

## Severity Scale
- S1: Blocker
- S2: Major
- S3: Minor
- S4: Polish

## Epics

### EPIC-011: Expert triage speed and filter clarity
- Outcome: Technical SEOs isolate critical issues within seconds using discoverable filters and priority-aware sorting.
- Rationale: Power users depend on fast, deterministic triage across large result sets.
- Impacted personas: P1, P2
- Linked tickets: TCK-601, TCK-602

### EPIC-012: Run execution feedback and URL hygiene
- Outcome: Users always know why a run failed and how to fix it.
- Rationale: Silent failures erode trust and slow audits.
- Impacted personas: P3
- Linked tickets: TCK-603

### EPIC-013: Highlight coverage for actionable findings
- Outcome: DOM highlighting works for all rules that map to elements, improving fix speed.
- Rationale: Without highlights, technical SEOs lose time hunting for exact nodes.
- Impacted personas: P1
- Linked tickets: TCK-604
