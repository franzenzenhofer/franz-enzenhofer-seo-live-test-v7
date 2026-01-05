# JIRA Tickets

## Personas
- P1: Technical SEO lead, agency-side, needs fast issue isolation and DOM-level evidence
- P2: SEO tooling engineer, expects deterministic ordering and advanced filters
- P3: Senior SEO strategist, audits multiple URLs and needs clear run feedback

## Tickets

### TCK-601: Advanced filter syntax is hidden from power users
- Epic: EPIC-011
- Type: UX
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: User audits Wikipedia and wants to isolate robots-related errors using label and rule filters
- Steps:
  1. Run a test
  2. Focus the filter input
  3. Try to discover how to filter by rule ID or label
- Expected: UI reveals filter syntax (id:, label:, name:, rule:) and type keywords; alt-click solo behavior is discoverable
- Actual: Only a placeholder is shown; power users must guess or learn from code
- IS: Filters work but are undiscoverable
- SHOULD: Provide a compact filter tips disclosure with examples and shortcut hints
- Reasoning: Expert users rely on precise filtering for triage and reporting; hidden syntax slows audits
- Code hints: `src/sidepanel/ui/Search.tsx`, `src/sidepanel/ui/AppBody.tsx`, `src/sidepanel/ui/TypeFilters.tsx`, `src/sidepanel/ui/resultQuery.ts`
- Acceptance criteria:
  - Filter tips are available without leaving the panel
  - Tips include token examples and type keywords
  - Tips mention alt-click to solo type filters

### TCK-602: Results are not sortable by priority score
- Epic: EPIC-011
- Type: UX
- Severity: S2
- Priority: P1
- Persona: P2
- Scenario: User audits fullstackoptimization.com and needs to triage the highest priority warnings first
- Steps:
  1. Run a test
  2. Scan the results list
  3. Attempt to prioritize high-priority issues
- Expected: A sort control lets users order by priority within severity
- Actual: Results sort by type then name, so high-priority items are buried
- IS: Priority exists but does not affect order
- SHOULD: Add a sort toggle to prioritize by priority score when present
- Reasoning: Priority scores are computed for a reason; the UI should expose them in ordering
- Code hints: `src/sidepanel/ui/Results.tsx`, `src/sidepanel/ui/ResultsSummary.tsx`, `src/shared/colors.ts`
- Acceptance criteria:
  - Sort toggle offers at least "Priority" and "Name"
  - Priority mode sorts by severity then numeric priority (lower number = higher priority)
  - Sorting keeps pinned rules on top

### TCK-603: Run test failures are silent for invalid URLs or restricted tabs
- Epic: EPIC-012
- Type: UX
- Severity: S2
- Priority: P1
- Persona: P3
- Scenario: User enters a URL without a scheme and clicks Run test on veganblatt.com
- Steps:
  1. Paste `www.veganblatt.com/a/vegane-suppeneinlagen-selber-machen`
  2. Click Run test
  3. Observe results
- Expected: UI validates the URL, auto-prepends https:// when missing, or shows a clear error message
- Actual: The run fails silently or appears to do nothing
- IS: Users cannot tell whether a run started or failed
- SHOULD: Validate input and surface a concise error message in the panel
- Reasoning: Technical SEOs run many URLs quickly; silent failures waste time and erode trust
- Code hints: `src/sidepanel/ui/RunNow.tsx`, `src/sidepanel/utils/runNow.ts`, `src/shared/url-utils.ts`, `src/shared/chrome.ts`
- Acceptance criteria:
  - Missing scheme is auto-normalized to https://
  - Invalid or restricted URLs show an inline error
  - Successful run clears the error state

### TCK-604: DOM highlight is missing for rules that map to elements
- Epic: EPIC-013
- Type: UX
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: User opens "Blocking scripts in head" or "Images missing dimensions" expecting highlight
- Steps:
  1. Run a test
  2. Open details for a rule with element-level evidence
  3. Watch the page highlight
- Expected: Relevant DOM nodes are highlighted
- Actual: No highlight appears for several rules because domPath(s) are missing
- IS: Users must manually search source HTML to find nodes
- SHOULD: Add domPath/domPaths for all rules that expose elements
- Reasoning: Highlighting is critical for fast remediation in technical audits
- Code hints: `src/rules/body/imagesLazy.ts`, `src/rules/body/imagesLayout.ts`, `src/rules/body/nofollow.ts`, `src/rules/body/parameterizedLinks.ts`, `src/rules/body/unsecureInput.ts`, `src/rules/dom/ldjson.ts`, `src/rules/dom/clientSideRendering.ts`, `src/rules/discover/articleStructuredData.ts`, `src/rules/discover/ogImageLarge.ts`, `src/rules/speed/preconnect.ts`, `src/rules/speed/dnsPrefetch.ts`, `src/rules/speed/linkPreload.ts`, `src/rules/speed/blockingScripts.ts`
- Acceptance criteria:
  - Affected rules include domPath or domPaths in details
  - Highlight triggers when details are expanded
  - Multi-element rules highlight all matches

## Review (Devil's Advocate)
- TCK-601: Adding tips could clutter the panel; mitigate with a collapsed disclosure and compact examples only.
- TCK-602: Priority ordering might surprise users used to alphabetical sorting; mitigate with a visible sort toggle and default to Name.
- TCK-603: Auto-normalizing URLs could change user intent (http vs https); mitigate by using https only when scheme is missing and showing the normalized URL in the input.
- TCK-604: Adding domPaths for many rules adds payload size; mitigate by only attaching domPaths for matched elements and using existing truncation utilities.
