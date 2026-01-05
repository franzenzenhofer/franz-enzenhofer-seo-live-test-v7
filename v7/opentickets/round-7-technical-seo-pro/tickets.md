# JIRA Tickets

## Personas
- P1: Technical SEO Lead (enterprise), goal: triage high-impact issues fast, device: desktop Chrome, constraints: large result sets and time pressure.
- P2: Agency Technical SEO Consultant, goal: produce client-ready audits and link to specs, device: desktop, constraints: context switching across sites.
- P3: SEO Engineer / Web Platform Developer, goal: map findings to DOM elements and fix quickly, device: desktop, constraints: needs precise selectors and evidence.
- P4: SEO QA Analyst, goal: verify fixes across multiple URLs, device: desktop, constraints: needs deterministic sampling and consistent highlight behavior.

## Tickets

### TCK-701: Add priority-aware search tokens
- Epic: EPIC-701
- Type: UX
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Triaging https://www.fullstackoptimization.com/a/seo-growth-consulting results to only the highest priority findings.
- Steps:
  1. Run audit on the URL.
  2. Enter `p<200` or `priority:0-200` in search.
- Expected: Results filter to the priority range and the filter summary reflects the numeric constraint.
- Actual: Search ignores numeric priority; results unchanged.
- IS: Search supports only text plus label/name/rule tokens.
- SHOULD: Support `p:`/`priority:` tokens with `<`, `<=`, `>`, `>=`, `=` and `min-max` ranges.
- Reasoning: Priority is already computed but unusable for fast triage in large audits.
- Code hints: `src/sidepanel/ui/resultQuery.ts`, `src/sidepanel/ui/useFilterParser.ts`, `src/sidepanel/ui/FilterTips.tsx`, `src/sidepanel/ui/ResultsSummary.tsx`.
- Acceptance criteria:
  - `p<200`, `p>=400`, and `priority:100-300` filter results correctly.
  - Filter line shows the active priority constraint.

### TCK-702: Highlight selectors for canonical and link sampling rules
- Epic: EPIC-702
- Type: UX
- Severity: S2
- Priority: P1
- Persona: P3
- Scenario: On https://en.wikipedia.org/wiki/Search_engine_optimization, open rules that reference canonical or sampled links and attempt to highlight the fix target.
- Steps:
  1. Expand `Canonical vs navigation` or `Redirect/Canonical chain`.
  2. Expand `Internal link HTTP status` or `Parameterized links (static vs idle)`.
- Expected: Highlight jumps to the canonical element or the sampled anchors.
- Actual: Highlight shows nothing because selectors are missing.
- IS: Rules return fixable elements but omit `domPath(s)` in details.
- SHOULD: Include `domPath` for canonical elements and `domPaths` for sampled link elements so highlight is available.
- Reasoning: Technical SEOs need immediate, precise DOM context to hand off fixes.
- Code hints: `src/rules/head/canonicalNavConsistency.ts`, `src/rules/http/redirectCanonicalChain.ts`, `src/rules/body/internalLinkStatus.ts`, `src/rules/dom/parameterizedLinksDiff.ts`, `src/shared/dom-path.ts`.
- Acceptance criteria:
  - Each of the listed rules returns valid `domPath`/`domPaths` when applicable.
  - Opening details triggers highlight on the correct elements.

### TCK-703: Expose highlight selectors in details for power users
- Epic: EPIC-702
- Type: UX
- Severity: S3
- Priority: P3
- Persona: P4
- Scenario: Preparing a handoff note from https://www.veganblatt.com/a/vegane-suppeneinlagen-selber-machen and needing the exact selector without relying on highlight.
- Steps:
  1. Open a result with highlightable elements.
  2. Inspect details for a selector list.
- Expected: Details include a readable list of highlight selectors.
- Actual: Selectors are hidden.
- IS: `domPath(s)` are removed before rendering details.
- SHOULD: Surface a `Highlight selectors` entry in details when selectors exist.
- Reasoning: QA and dev handoffs often need copyable selectors.
- Code hints: `src/components/result/resultTransforms.ts`, `src/components/result/ResultDetails.tsx`.
- Acceptance criteria:
  - Details show `Highlight selectors` when selectors exist.
  - No selector field appears for non-highlightable results.

### TCK-704: Add robots.txt size limit rule (500 KiB)
- Epic: EPIC-703
- Type: Feature
- Severity: S2
- Priority: P2
- Persona: P1
- Scenario: Auditing any URL and validating robots.txt compliance with Google limits.
- Steps:
  1. Run audit for any URL.
  2. Review robots section for size compliance.
- Expected: Rule reports robots.txt size and warns when exceeding 500 KiB.
- Actual: No rule checks size limits.
- IS: Size limit is not validated.
- SHOULD: Add a rule that warns when robots.txt exceeds 500 KiB (Google ignores beyond this).
- Reasoning: Oversized robots files can silently block crawling.
- Code hints: new rule under `src/rules/robots/`, use `fetchTextOnce`, register in `src/rules/registry.ts`, add tests in `v7/tests/**`.
- Acceptance criteria:
  - Rule reports size in bytes and KiB.
  - Warns when size > 512000 bytes.

### TCK-705: Validate max-image-preview directive values
- Epic: EPIC-703
- Type: Feature
- Severity: S3
- Priority: P2
- Persona: P2
- Scenario: Ensuring robots directives are valid for Google previews.
- Steps:
  1. Run audit and inspect robots directives.
  2. If `max-image-preview` exists, check its value.
- Expected: Invalid values are flagged; valid values are reported.
- Actual: No rule validates `max-image-preview` directives.
- IS: Directive values are unverified.
- SHOULD: Add rule to validate `max-image-preview` values against `none | standard | large`.
- Reasoning: Invalid directives are ignored by Google, risking unexpected snippet previews.
- Code hints: new rule in `src/rules/head/` leveraging `parseRobotsDirectives`/`findRobotsTokens`.
- Acceptance criteria:
  - Warns on invalid values.
  - Lists detected values and source (meta or header).

### TCK-706: Validate hreflang values (BCP 47 + x-default)
- Epic: EPIC-703
- Type: Feature
- Severity: S2
- Priority: P2
- Persona: P3
- Scenario: Auditing international pages with hreflang tags.
- Steps:
  1. Run audit and open Hreflang validation.
  2. Review detected hreflang codes.
- Expected: Invalid hreflang values are flagged with element highlights.
- Actual: No rule checks code validity.
- IS: Hreflang codes are listed without validation.
- SHOULD: Validate codes (language[-region] or `x-default`) and flag invalid ones.
- Reasoning: Invalid hreflang values are ignored by Google.
- Code hints: new rule in `src/rules/head/`, reuse `getDomPaths`, regex validation.
- Acceptance criteria:
  - Invalid codes are listed in result details.
  - `domPaths` include the invalid link tags.

### TCK-707: Add Schema WebSite SearchAction rule
- Epic: EPIC-703
- Type: Feature
- Severity: S3
- Priority: P3
- Persona: P2
- Scenario: Verifying Sitelinks Searchbox eligibility.
- Steps:
  1. Run audit.
  2. Inspect schema rules for WebSite SearchAction coverage.
- Expected: Rule validates WebSite JSON-LD includes SearchAction with required fields.
- Actual: No rule exists.
- IS: WebSite SearchAction is not validated.
- SHOULD: Validate `WebSite` schema with `potentialAction.@type = SearchAction`, `target`, and `query-input`.
- Reasoning: Missing fields invalidate Sitelinks Searchbox markup.
- Code hints: new rule in `src/rules/schema/` using `createSchemaRule` or targeted parser.
- Acceptance criteria:
  - Rule reports missing required fields.
  - Provides reference to Google spec.

### TCK-708: Enforce BreadcrumbList item positions
- Epic: EPIC-703
- Type: Feature
- Severity: S2
- Priority: P2
- Persona: P3
- Scenario: Checking BreadcrumbList markup for Google eligibility.
- Steps:
  1. Run audit.
  2. Review breadcrumb schema rule output.
- Expected: Each itemListElement has numeric `position` and `item` reference.
- Actual: Only presence is checked.
- IS: BreadcrumbList positions are not validated.
- SHOULD: Validate each item has `position` and `item` (or `item.@id`) with name.
- Reasoning: Missing required fields invalidate breadcrumb rich results.
- Code hints: new rule in `src/rules/schema/` with explicit validator.
- Acceptance criteria:
  - Warns when positions are missing or non-numeric.
  - Highlights the JSON-LD script.

## Devil's Advocate Review
- Accept: TCK-701, TCK-702, TCK-703, TCK-704, TCK-705, TCK-706, TCK-707, TCK-708.
- Reject/Defer: None for this round; all are actionable and align with technical SEO power-user needs.
