# JIRA Tickets

## Personas
- P1: Technical SEO lead, relies on deterministic queries for audit QA
- P2: SEO tooling engineer, filters by rule IDs for automation and scripting
- P3: Agency technical SEO, uses keyword filters to triage errors fast

## Tickets

### TCK-301: Structured query tokens (id:, label:, name:) are not supported
- Epic: EPIC-007
- Type: UX
- Severity: S2
- Priority: P1
- Persona: P2
- Scenario: User wants to filter a specific rule by ID or label
- Steps:
  1. Run a test
  2. Enter `id:head:canonical` or `label:head` in the filter box
- Expected: Results filtered to rule IDs/labels that match the token
- Actual: Zero results (tokens treated as plain text)
- IS: Precision filtering is not possible for large audits
- SHOULD: Support id:/label:/name: tokens with deterministic matching
- Reasoning: Technical SEOs need structured queries for reproducible triage
- Code hints: `src/sidepanel/ui/Results.tsx` (filtering), `src/sidepanel/ui/useFilterParser.ts`
- Acceptance criteria:
  - `id:` matches ruleId
  - `label:` matches label
  - `name:` matches rule name

### TCK-302: Error keyword maps to runtime errors instead of failed checks
- Epic: EPIC-008
- Type: UX
- Severity: S3
- Priority: P2
- Persona: P3
- Scenario: User types `error` to focus on failed checks
- Steps:
  1. Run a test
  2. Enter `error` in the filter box
- Expected: Failed checks (type=error) are shown
- Actual: Runtime errors are shown instead
- IS: Query semantics are inverted for technical triage
- SHOULD: Map `error` to failed checks; add `runtime` keyword for runtime_error
- Reasoning: Industry usage expects “error” to mean failed checks
- Code hints: `src/sidepanel/ui/useFilterParser.ts`, `src/shared/colors.ts`
- Acceptance criteria:
  - `error` keyword filters failed checks
  - `runtime` keyword filters runtime errors

### TCK-303: Search UI does not hint supported query tokens
- Epic: EPIC-007
- Type: UX
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: User tries advanced queries without guidance
- Steps:
  1. Focus the filter input
  2. Look for token help
- Expected: A small hint describing tokens (id:, label:, name:, type keywords)
- Actual: No hint; users guess or fail
- IS: Discoverability is low for advanced filtering
- SHOULD: Add a compact hint under the filter box
- Reasoning: Pro features should be discoverable without docs
- Code hints: `src/sidepanel/ui/Search.tsx`
- Acceptance criteria:
  - Hint text appears below the filter input
  - Hint includes examples of tokens and type keywords
