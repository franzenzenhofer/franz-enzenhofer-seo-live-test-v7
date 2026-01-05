# JIRA Tickets

## Personas
- P1: Technical SEO lead, needs to validate rule evidence visually before triage
- P2: SEO tooling engineer, expects deterministic selectors for auditing
- P3: Enterprise consultant, shares screenshots with dev teams

## Tickets

### TCK-501: Highlight fails on pages with utility-class selectors
- Epic: EPIC-011
- Type: Bug
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: User opens a result on fullstackoptimization.com and expects the DOM element to highlight
- Steps:
  1. Run a test
  2. Expand a result with DOM evidence
  3. Observe highlight on the page
- Expected: Evidence element highlights reliably
- Actual: No highlight; selector is invalid when classes contain special characters
- IS: Highlight fails on modern utility-class sites
- SHOULD: Escape ids/classes and ignore invalid selectors without breaking highlight
- Reasoning: Power users rely on highlight as proof of the issue
- Code hints: `src/shared/html-utils.ts`, `src/content/highlight.ts`
- Acceptance criteria:
  - CSS-escaped selectors are generated for IDs/classes
  - Invalid selectors do not crash highlight behavior

### TCK-502: Highlight misses meta/link elements due to incorrect nth-of-type selectors
- Epic: EPIC-011
- Type: Bug
- Severity: S2
- Priority: P1
- Persona: P2
- Scenario: User opens canonical/meta results and expects the exact tag highlighted
- Steps:
  1. Run a test on veganblatt.com or Wikipedia
  2. Expand a canonical/hreflang/meta-related result
- Expected: The matching tag is highlighted
- Actual: Highlight misses because selector indexes are based on filtered lists
- IS: Highlight works only when the tag happens to be first
- SHOULD: Use actual DOM paths for each element
- Reasoning: Incorrect highlights reduce confidence in the rule output
- Code hints: `src/rules/head/canonical.ts`, `src/rules/head/metaDescription.ts`, `src/rules/head/hreflang.ts`, `src/rules/http/mixedContent.ts`
- Acceptance criteria:
  - Dom paths derive from the actual element location
  - Multi-element rules highlight each matched element

### TCK-503: Robots directive summary rules lack highlight selectors
- Epic: EPIC-012
- Type: UX
- Severity: S3
- Priority: P2
- Persona: P3
- Scenario: User wants to highlight robots meta directives from summary rules
- Steps:
  1. Run a test
  2. Expand robots meta list or agent-conflict results
- Expected: Relevant meta tags highlight on the page
- Actual: No highlight because selectors are missing from details
- IS: Summary rules cannot show evidence
- SHOULD: Attach domPaths from parsed directives when available
- Reasoning: Visual confirmation speeds up SEO QA handoffs
- Code hints: `src/shared/robots.ts`, `src/rules/head/robotsMetaList.ts`, `src/rules/head/robotsAgentConflicts.ts`
- Acceptance criteria:
  - Summary robots rules include domPaths when meta tags exist
  - Highlight works for those results

## Review (Devil's Advocate)
- TCK-501: Escaping selectors could make paths less readable; acceptable because highlight reliability matters more than aesthetics.
- TCK-502: DOM paths are longer; still preferable to false highlights.
- TCK-503: More details may slightly clutter debug payloads; still worth it for traceability.
