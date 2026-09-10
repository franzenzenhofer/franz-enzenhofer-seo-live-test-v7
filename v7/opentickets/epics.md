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

---

# Result comprehension review

This is a simulated expert and novice review, not a study with recruited people. The product is the Chrome extension side panel and report. The task is to understand what each result proves, locate its evidence, decide what to do, and copy an actionable ticket.

## EPIC-001: Understand and share every finding

Outcome: all 130 rules use readable evidence and explain the scope of a pass, warning, failure or unavailable test. Personas: novice site owner, content editor, technical SEO. Tickets: UX-001 and the per-rule records in rule-review.md.

## Review scripts

- Novice: identify whether the page is correct, explain the finding without jargon, decide whether any action is needed, and copy a ticket.
- Content editor: identify the affected content, distinguish required changes from optional recommendations, locate the CMS setting or element, and explain the expected outcome.
- Technical SEO: verify the source and crawler scope, distinguish captured facts from inference, check missing-data behavior, and preserve all evidence when copying.

Each rule is reviewed in collapsed and expanded form, including representative passing, failing, absent and unavailable-data branches where they exist. Browser verification remains headless.
