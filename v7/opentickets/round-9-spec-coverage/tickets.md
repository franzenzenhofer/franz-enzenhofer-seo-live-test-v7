# JIRA Tickets - Round 9: Spec Coverage

## Personas
- P1: Technical SEO Lead (enterprise), goal: triage high-impact issues fast, device: desktop Chrome, constraints: large result sets and time pressure.
- P2: Agency Technical SEO Consultant, goal: produce client-ready audits and link to specs, device: desktop, constraints: context switching across sites.
- P3: SEO Engineer / Web Platform Developer, goal: map findings to DOM elements and fix quickly, device: desktop, constraints: needs precise selectors and evidence.
- P4: SEO QA Analyst, goal: verify fixes across multiple URLs, device: desktop, constraints: needs deterministic sampling and consistent highlight behavior.

## Tickets

### TCK-901: Implement rule robots:fetch-status - robots.txt HTTP status semantics
- Epic: EPIC-901
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `robots:fetch-status`.
- Expected: A result for `robots:fetch-status` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `robots-exists` - it does not test this.
- SHOULD: How the robots.txt fetch responded, interpreted by crawler semantics rather than mere existence: RFC 9309 says on 4xx a crawler MAY access all resources ('unavailable' = allow all) while on 5xx it MUST assume complete disallow ('unreachable'); Google's spec says 5xx halts crawling for 12 hours, uses a cached copy up to 30 days, and treats >5 redirect hops for robots.txt as a 404. The existing robots-exists rule only warns generically on any non-2xx; it never flags the catastrophic 5xx case or the redirect-hop case.
- Verdict logic: ok: 2xx. info: 404/other 4xx except 429 (no robots.txt = crawl everything allowed, RFC 9309 sec 2.3.1.3). error: 5xx or 429 on /robots.txt (RFC 9309: crawler MUST assume complete disallow; Google stops crawling the site). warn: robots.txt reached only after a redirect, error if observed chain exceeds 5 hops (both RFC 9309 and Google treat that as unavailable/404). warn: network error/timeout.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://www.rfc-editor.org/rfc/rfc9309.html
  - https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
- Code hints: `src/rules/robots/fetchStatus.ts`, `src/rules/registry.ts`, `tests/rules/robots.fetchStatus.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-902: Implement rule robots:noindex-conflict - Noindex blocked by robots.txt
- Epic: EPIC-901
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `robots:noindex-conflict`.
- Expected: A result for `robots:noindex-conflict` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `robots:googlebot-url-check` - it does not test this.
- SHOULD: The classic self-defeating combination: the current URL is disallowed for Googlebot in robots.txt while the page carries a noindex (meta robots/googlebot or X-Robots-Tag). Google's block-indexing doc: 'For the noindex rule to be effective, the page or resource must not be blocked by a robots.txt file... otherwise the crawler will never see the noindex rule, and the page can still appear in search results.' Existing rules check the disallow (robots:googlebot-url-check) and the noindex (head:robots-noindex, http:x-robots) separately but never the interaction.
- Verdict logic: error: current URL matches a Googlebot disallow rule AND noindex present in meta robots/googlebot or X-Robots-Tag (the noindex is invisible to Google; page can still be indexed from links). ok: noindex present and URL crawlable (directive is effective). info: no noindex present (nothing to conflict).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/crawling-indexing/block-indexing
  - https://developers.google.com/search/docs/crawling-indexing/robots/intro
- Code hints: `src/rules/robots/noindexConflict.ts`, `src/rules/registry.ts`, `tests/rules/robots.noindexConflict.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-903: Implement rule robots:syntax-validity - robots.txt syntax and unsupported directives
- Epic: EPIC-901
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `robots:syntax-validity`.
- Expected: A result for `robots:syntax-validity` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `robots:complexity` - it does not test this.
- SHOULD: Parses every line of robots.txt for validity: only user-agent, allow, disallow, sitemap and comments are supported by Google; invalid lines are silently ignored, which hides broken intent. Flags directives Google retired on September 1, 2019 (noindex, nofollow, crawl-delay per the 2019 blog post), orphan allow/disallow rules appearing before any user-agent line (they belong to no group and are dropped), and files that are actually HTML (Google 'attempts to parse HTML content' but that means the rules are broken). The existing robots:complexity rule only counts allow/disallow/sitemap lines and never validates anything.
- Verdict logic: ok: every non-empty non-comment line parses as user-agent/allow/disallow/sitemap. warn: unsupported directives present (crawl-delay, noindex, nofollow, host) - report each with the ignored-since-2019-09-01 note; warn: allow/disallow rules before the first user-agent line (ignored by parsers); warn: >0 unparseable lines (list them). error: body starts with <!doctype or <html (site is serving an HTML page at /robots.txt).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
  - https://developers.google.com/search/blog/2019/07/a-note-on-unsupported-rules-in-robotstxt
  - https://www.rfc-editor.org/rfc/rfc9309.html
  - https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt
- Code hints: `src/rules/robots/syntaxValidity.ts`, `src/rules/registry.ts`, `tests/rules/robots.syntaxValidity.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-904: Implement rule sitemap:fetchable - Sitemap fetchable and well-formed
- Epic: EPIC-901
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `sitemap:fetchable`.
- Expected: A result for `sitemap:fetchable` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `robots:sitemap-reference` - it does not test this.
- SHOULD: Actually fetches the sitemap URL(s) declared in robots.txt (falling back to origin/sitemap.xml when none is declared) and validates the response: HTTP 200, parseable XML, root element urlset or sitemapindex in namespace http://www.sitemaps.org/schemas/sitemap/0.9, UTF-8 encoding, every entry has a loc child (all required by sitemaps.org). Google also accepts RSS/mRSS, Atom 1.0 and plain text per build-sitemap. The existing robots:sitemap-reference rule only greps for a Sitemap: line and never fetches or validates anything.
- Verdict logic: ok: at least one declared sitemap returns 200 and parses as valid urlset/sitemapindex (or RSS/Atom/text format). error: a sitemap URL declared in robots.txt returns 4xx/5xx or is unparseable XML (dead reference actively advertised to crawlers). warn: no sitemap declared in robots.txt and origin/sitemap.xml returns 404 (acceptable only for small sites - Google's overview says sites of about 500 pages or fewer with good internal linking may not need one, which the extension cannot verify, hence warn not error). warn: declared sitemap redirects cross-origin (outside fetch bounds - report as unverifiable).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://www.sitemaps.org/protocol.html
  - https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
  - https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- Code hints: `src/rules/robots/fetchable.ts`, `src/rules/registry.ts`, `tests/rules/robots.fetchable.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-905: Implement rule sitemap:url-membership - Current URL listed in sitemap
- Epic: EPIC-901
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `sitemap:url-membership`.
- Expected: A result for `sitemap:url-membership` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: Whether the current page (or its declared canonical) appears as a loc entry in the site's sitemap(s). Sitemap inclusion is a documented (weak) canonicalization signal per consolidate-duplicate-urls, and build-sitemap says to include only the canonical version of each page. Bounded scan: fetch the robots.txt-declared sitemap; if it is a sitemapindex, fetch a bounded number of child sitemaps (prioritizing ones whose URL/lastmod suggests relevance) and search for exact loc match. Also flags the inverse mismatch: the page is in the sitemap but the sitemap entry differs from the page's canonical.
- Verdict logic: ok: exact match of current URL or its canonical found as a loc entry. warn: URL not found in any scanned sitemap entries (weaker discovery/canonical signals); warn: sitemap lists a different variant of this page than the declared canonical (conflicting canonical hints). info: scan incomplete because the sitemap index exceeded the bounded fetch budget, or no sitemap exists. Skip (info): page is noindex.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
  - https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
  - https://www.sitemaps.org/protocol.html
- Code hints: `src/rules/robots/urlMembership.ts`, `src/rules/registry.ts`, `tests/rules/robots.urlMembership.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort L respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-906: Implement rule robots:canonical-target-blocked - Canonical target blocked by robots.txt
- Epic: EPIC-901
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `robots:canonical-target-blocked`.
- Expected: A result for `robots:canonical-target-blocked` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `head:canonical-signals-conflict` - it does not test this.
- SHOULD: Whether the URL named in rel=canonical (link element or HTTP header) is itself disallowed for Googlebot in the site's robots.txt. Google warns 'Don't use the robots.txt file for canonicalization purposes' - a canonical pointing at an uncrawlable URL sends Google to a target it cannot fetch, so the canonical hint cannot be honored properly. Existing canonical rules (head:canonical-signals-conflict etc.) compare canonical signals to each other but never evaluate the target against robots.txt.
- Verdict logic: error: same-origin canonical target URL matches a Googlebot disallow rule in robots.txt. ok: canonical target allowed. info: no canonical present, or canonical is cross-origin (that host's robots.txt is outside the extension's same-origin fetch bounds).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
  - https://developers.google.com/search/docs/crawling-indexing/block-indexing
- Code hints: `src/rules/robots/canonicalTargetBlocked.ts`, `src/rules/registry.ts`, `tests/rules/robots.canonicalTargetBlocked.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-907: Implement rule robots:content-type - robots.txt Content-Type header
- Epic: EPIC-901
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `robots:content-type`.
- Expected: A result for `robots:content-type` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `robots-exists` - it does not test this.
- SHOULD: RFC 9309 section 2.3 expects robots.txt served as media type text/plain, UTF-8 encoded (Google: 'must be a UTF-8 encoded plain text file'; the parser ignores a BOM). Checks the Content-Type response header of the robots.txt fetch and whether the body decodes as valid UTF-8. No existing rule inspects the robots.txt response headers at all.
- Verdict logic: ok: Content-Type is text/plain (any charset param, or none). warn: Content-Type is text/html, application/octet-stream or anything else (parsers may mishandle it); warn: body contains byte sequences invalid in UTF-8 (those characters may be ignored per Google's spec). info: header missing entirely.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://www.rfc-editor.org/rfc/rfc9309.html
  - https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt
- Code hints: `src/rules/robots/contentType.ts`, `src/rules/registry.ts`, `tests/rules/robots.contentType.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-908: Implement rule robots:favicon-crawlable - Favicon crawlable by Googlebot-Image
- Epic: EPIC-901
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `robots:favicon-crawlable`.
- Expected: A result for `robots:favicon-crawlable` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `robots:googlebot-url-check` - it does not test this.
- SHOULD: Whether robots.txt allows crawling of the favicon URL, since the spec states 'Googlebot-Image must be able to crawl the favicon file and Googlebot must be able to crawl the home page; they cannot be blocked for crawling.' Evaluates the already-fetched robots.txt against the resolved favicon URL for both the Googlebot-Image group (or its fallback group) and Googlebot for the homepage URL.
- Verdict logic: error if the favicon URL is disallowed for Googlebot-Image (after group-selection rules: explicit Googlebot-Image group, else Googlebot, else *), or if the homepage URL '/' is disallowed for Googlebot. ok if both are allowed. warn if the favicon is cross-origin and robots.txt of that host cannot be evaluated from the extension (report as unverifiable rather than silently passing).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/favicon-in-search
- Code hints: `src/rules/robots/faviconCrawlable.ts`, `src/rules/registry.ts`, `tests/rules/robots.faviconCrawlable.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-909: Implement rule robots:googlebot-image-access - Googlebot-Image access to page images
- Epic: EPIC-901
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `robots:googlebot-image-access`.
- Expected: A result for `robots:googlebot-image-access` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `robots:blocked-resources` - it does not test this.
- SHOULD: Evaluates the page's same-host image URLs (content <img> srcs plus og:image and schema image/thumbnailUrl) against the already-fetched robots.txt using the Googlebot-Image user agent, including the group-fallback semantics (Googlebot-Image group if present, else Googlebot). The prevent-images doc shows 'User-agent: Googlebot-Image / Disallow: /' patterns that silently kill Google Images and Discover imagery while robots:blocked-resources - which tests only the generic Googlebot UA against generic page resources - reports everything as fine.
- Verdict logic: error: the declared primary image (og:image / schema image) is disallowed for Googlebot-Image. warn: >=1 same-host content image disallowed for Googlebot-Image, or a Googlebot-Image group exists with 'Disallow: /'. ok: robots.txt reachable and all checked image URLs allowed. info: robots.txt unreachable or no same-host images.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/crawling-indexing/prevent-images-on-your-page
  - https://developers.google.com/search/docs/appearance/google-discover
- Code hints: `src/rules/robots/googlebotImageAccess.ts`, `src/rules/registry.ts`, `tests/rules/robots.googlebotImageAccess.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-910: Implement rule sitemap:entry-quality - Sitemap entry URL quality
- Epic: EPIC-901
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `sitemap:entry-quality`.
- Expected: A result for `sitemap:entry-quality` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: Validates a sample of loc entries from the fetched sitemap: sitemaps.org requires each loc to begin with the protocol, be under 2,048 characters, be XML-entity-escaped (& as &amp; etc.), and to share host and protocol with the sitemap's own location (location-scope rule: a sitemap may only contain URLs under its own path/host unless cross-submitted via robots.txt); Google's build-sitemap requires 'fully-qualified, absolute URLs' and rejects relative ones like /mypage.html.
- Verdict logic: error: any sampled loc is relative or protocol-less (invalid per both specs); error: loc host or protocol differs from the sitemap's own host/protocol without a corresponding robots.txt cross-submit reference. warn: loc length >= 2,048 characters; warn: raw unescaped & in loc values (XML escaping violation); warn: loc entries pointing to http:// while the site serves https (non-canonical variants in sitemap). ok: sampled entries clean.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://www.sitemaps.org/protocol.html
  - https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Code hints: `src/rules/robots/entryQuality.ts`, `src/rules/registry.ts`, `tests/rules/robots.entryQuality.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-911: Implement rule sitemap:lastmod - Sitemap lastmod validity and trust
- Epic: EPIC-901
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `sitemap:lastmod`.
- Expected: A result for `sitemap:lastmod` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: Quality of lastmod values in the fetched sitemap, the only date tag Google actually uses ('used if consistently and verifiably accurate' - build-sitemap; the 2023 blog post: lastmod must be in the sitemaps.org W3C Datetime format and 'consistently match reality... eventually we're not going to believe you anymore'). Validates format (YYYY-MM-DD or full W3C datetime), plausibility (not in the future), and the tell-tale untrustworthy pattern where every entry carries the identical timestamp (sitemap-generation time, not content modification). Also reports info that priority and changefreq are ignored by Google if present.
- Verdict logic: warn: any sampled lastmod fails W3C Datetime parsing; warn: lastmod dated in the future (clock/generator bug destroys trust); warn: >=90% of sampled entries share one identical lastmod value (generation timestamp pattern). info: lastmod absent (optional tag); info: priority/changefreq tags present (Google ignores both per build-sitemap). ok: valid, varied, plausible lastmod values.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping
  - https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
  - https://www.sitemaps.org/protocol.html
- Code hints: `src/rules/robots/lastmod.ts`, `src/rules/registry.ts`, `tests/rules/robots.lastmod.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-912: Implement rule sitemap:size-limits - Sitemap size limits
- Epic: EPIC-901
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `sitemap:size-limits`.
- Expected: A result for `sitemap:size-limits` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: Hard protocol limits on the fetched sitemap file: max 50,000 URLs and max 50MB (52,428,800 bytes) uncompressed per sitemap file, and max 50,000 sitemaps / 50MB per sitemap index (sitemaps.org; Google's build-sitemap repeats '50MB (uncompressed) or 50,000 URLs'). Counts url (or sitemap) entries and measures decompressed byte size of the fetched file.
- Verdict logic: error: >50,000 url entries or >52,428,800 uncompressed bytes in one sitemap file (or same limits for a sitemapindex) - crawlers may truncate or reject. warn: >45,000 entries or >45MB (within 10% of the cap, split proactively). ok: within limits. info: no sitemap found.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://www.sitemaps.org/protocol.html
  - https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Code hints: `src/rules/robots/sizeLimits.ts`, `src/rules/registry.ts`, `tests/rules/robots.sizeLimits.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-913: Implement rule url:case-consistency - URL case consistency
- Epic: EPIC-901
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `url:case-consistency`.
- Expected: A result for `url:case-consistency` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `url:trailing-slash` - it does not test this.
- SHOULD: Google's url-structure doc: 'Google treats both /APPLE and /apple as distinct URLs with their own content' and recommends standardizing on one case. Checks whether internal links on the page contain URL pairs whose paths differ only by letter case (each such pair is a duplicate-content URL split), and whether the current URL's path mixes cases relative to how the page links to itself/canonical. Analogous granularity to the existing url:trailing-slash rule, which checks a different consistency axis.
- Verdict logic: error: >=1 pair of internal links differing only in path case (two crawlable duplicates of one resource). warn: current URL path differs only by case from the declared canonical or from internal self-links. info: uppercase characters present in the current URL path (consistency reminder). ok: consistent casing throughout.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/crawling-indexing/url-structure
- Code hints: `src/rules/url/caseConsistency.ts`, `src/rules/registry.ts`, `tests/rules/url.caseConsistency.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-914: Implement rule url:fragment-routing - Fragment-based content routing
- Epic: EPIC-901
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `url:fragment-routing`.
- Expected: A result for `url:fragment-routing` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `url:history-state-update` - it does not test this.
- SHOULD: Detects hash-based routing: url-structure says 'Don't use fragments to change the content of a page, as Google Search generally doesn't support URL fragments' (example: https://example.com/#/potatoes) and JavaScript SEO basics tells SPAs to use the History API with real hrefs instead. Flags internal links whose href starts with #/ or #! or whose target differs from the current URL only by such a fragment, and a post-JS location containing a routing-style fragment. Distinct from url:history-state-update, which reports History API usage (the recommended pattern) - this rule catches its unsupported opposite.
- Verdict logic: error: current post-JS URL uses a routing fragment (#/... or #!...) - content behind it is invisible to Google; error: >=3 internal navigation links use #/ or #! routing hrefs. warn: 1-2 such links. ok: fragments only used as plain in-page anchors (#section-name) or absent.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/crawling-indexing/url-structure
  - https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Code hints: `src/rules/url/fragmentRouting.ts`, `src/rules/registry.ts`, `tests/rules/url.fragmentRouting.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-915: Implement rule url:session-identifiers - Session IDs in URLs
- Epic: EPIC-901
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `url:session-identifiers`.
- Expected: A result for `url:session-identifiers` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `body:parameterized-links` - it does not test this.
- SHOULD: Detects session/tracking identifiers in the current URL and in internal link hrefs - Google's url-structure doc explicitly warns 'avoid the use of session IDs in URLs and consider using cookies instead' and calls out referral parameters as creating redundant URLs (its own example: ?sessionid=6EE2BF1AF6A3D705D5561B7C3564D9C2). Pattern set: sessionid, sid, phpsessid, jsessionid, sess, s_kwcid-style opaque 16+ hex-char values in query or path segments. Distinct from body:parameterized-links (raw count of any params) and head:canonical-tracking-params (canonical URL only): this targets the session-ID antipattern on the page URL and its outgoing internal links.
- Verdict logic: error: current page URL itself carries a session-ID-pattern parameter or path segment (every crawl mints a new duplicate URL). warn: >=1 internal link contains a session-ID-pattern parameter (crawl budget waste, duplicate creation); ok: none found.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/crawling-indexing/url-structure
- Code hints: `src/rules/url/sessionIdentifiers.ts`, `src/rules/registry.ts`, `tests/rules/url.sessionIdentifiers.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-916: Implement rule url:locale-in-query - Locale carried in URL parameters
- Epic: EPIC-901
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `url:locale-in-query`.
- Expected: A result for `url:locale-in-query` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `body:parameterized-links` - it does not test this.
- SHOULD: Google's URL-structure table marks URL parameters (site.com/?loc=de) as 'Not recommended' for locale segmentation because 'URL-based segmentation [is] difficult', while ccTLDs, subdomains and subdirectories are the recommended structures. Checks the current URL and every hreflang alternate for locale-bearing query parameters (lang, locale, hl, lc, country, region, or values matching ISO language codes) and whether cluster members differ only by such a parameter.
- Verdict logic: ok: neither the page URL nor any hreflang alternate encodes locale in a query parameter. warn: hreflang cluster members differ only by a locale query parameter, or the current URL carries a lang/locale/hl-style parameter whose value is an ISO language or region code (spec: not recommended). info: no locale-shaped parameters found and no cluster present.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- Code hints: `src/rules/url/localeInQuery.ts`, `src/rules/registry.ts`, `tests/rules/url.localeInQuery.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-917: Implement rule url:percent-encoding - URL percent-encoding compliance
- Epic: EPIC-901
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `url:percent-encoding`.
- Expected: A result for `url:percent-encoding` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: url-structure requires following IETF STD 66 (RFC 3986): 'Characters defined by the standard as reserved must be percent encoded', and recommends percent-encoding non-ASCII characters in links (good: /%D9%86%D8%B9..., bad: raw /نعناع). Also flags the non-standard parameter syntax Google warns about (brackets/colons instead of key=value&key2=value2). Scans internal link href attributes as authored in the HTML for raw non-ASCII, raw spaces, and unencoded reserved characters.
- Verdict logic: warn: >=1 internal link href contains raw unencoded non-ASCII characters or literal spaces; warn: links use non-standard parameter delimiters (e.g. ?[key:value] patterns instead of ?key=value&k2=v2). ok: all sampled hrefs are STD 66-compliant. info: none of the links carry non-ASCII or reserved characters.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/crawling-indexing/url-structure
- Code hints: `src/rules/url/percentEncoding.ts`, `src/rules/registry.ts`, `tests/rules/url.percentEncoding.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-918: Implement rule url:word-separators - Hyphens vs underscores in URL
- Epic: EPIC-901
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `url:word-separators`.
- Expected: A result for `url:word-separators` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `url:trailing-slash` - it does not test this.
- SHOULD: Google's url-structure doc: 'We recommend using hyphens (-) instead of underscores (_) to separate words' in URLs (their negative example: /summer_clothing/filter?color_profile=dark_grey). Checks the current URL path (and optionally sampled internal links) for underscore-separated words.
- Verdict logic: warn: current URL path segments contain underscores used between word characters (recommendation-level violation). info: only query-parameter names/values contain underscores (Google's own bad example includes these, but they matter less than path words). ok: hyphens or no separators in the path.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/crawling-indexing/url-structure
- Code hints: `src/rules/url/wordSeparators.ts`, `src/rules/registry.ts`, `tests/rules/url.wordSeparators.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-919: Implement rule head:favicon-declared - Favicon link declared
- Epic: EPIC-902
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `head:favicon-declared`.
- Expected: A result for `head:favicon-declared` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: Whether the page declares a favicon via a <link> whose rel is one of the values Google supports: 'icon' (HTML standard), 'shortcut icon' (historical), or 'apple-touch-icon'/'apple-touch-icon-precomposed'. Google requires the <link> tag in the header of the home page (domain- or subdomain-level root, not subdirectories), and supports one favicon per site defined by hostname. Also flags unstable-looking favicon URLs (e.g. cache-busting query params), since the spec says the favicon URL must be stable.
- Verdict logic: On a homepage (path is '/'): error if no <link> with a supported rel value exists in <head> (falling back silently to /favicon.ico is not declared markup - report the fallback as warn). On non-homepage: info only. Warn if the only rel present is non-standard (e.g. 'Icon', 'SHORTCUT ICON' with wrong casing is fine per HTML, but rel values outside the supported set like 'fluid-icon' alone). Warn if the favicon href contains volatile query parameters (v=, cb=, timestamp-like values) as a URL-stability signal. Ok if at least one supported rel with an absolute-resolvable href is present.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/favicon-in-search
- Code hints: `src/rules/head/faviconDeclared.ts`, `src/rules/registry.ts`, `tests/rules/head.faviconDeclared.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-920: Implement rule head:favicon-validity - Favicon file valid for Search
- Epic: EPIC-902
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `head:favicon-validity`.
- Expected: A result for `head:favicon-validity` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: Fetches the declared favicon (same-origin bounded fetch, falling back to /favicon.ico) and validates it against Google's requirements: HTTP 200; file format among BMP, GIF, ICO, PNG, JPEG, PPM, TIFF (SVG is notably absent from Google's supported list); square 1:1 aspect ratio ('Your favicon must be a square'); at least 8x8px minimum with 'larger than 48x48px' recommended. Dimensions are read by decoding the image bytes (ICO: largest contained image).
- Verdict logic: error if fetch returns non-2xx, or format is unsupported (e.g. SVG, WebP), or width != height (not 1:1), or largest dimension < 8px (spec minimum 'at least 8x8px'). warn if square and supported but < 48x48px (spec: 'larger than 48x48px so that it looks good on various surfaces'). ok if 2xx, supported format, square, and >= 48x48px.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/favicon-in-search
- Code hints: `src/rules/head/faviconValidity.ts`, `src/rules/registry.ts`, `tests/rules/head.faviconValidity.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-921: Implement rule head:hreflang-absolute-urls - Hreflang absolute URLs
- Epic: EPIC-902
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `head:hreflang-absolute-urls`.
- Expected: A result for `head:hreflang-absolute-urls` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `head:canonical-hreflang-consistency` - it does not test this.
- SHOULD: Google requires alternate URLs to be fully-qualified including the transport method: 'https://example.com/foo, not //example.com/foo or /foo'. Existing rules silently resolve relative hrefs via new URL(href, page.url), masking this spec violation. This rule inspects the raw href attribute of every head > link[rel=alternate][hreflang] (and Link-header hreflang) and flags relative paths and protocol-relative URLs.
- Verdict logic: ok: all hreflang hrefs start with http:// or https://. error: any href is relative (/foo, foo) or protocol-relative (//example.com/foo) - spec says these must be fully-qualified. warn: href uses http:// while the page is https (scheme downgrade in cluster). info: no hreflang links present.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/specialty/international/localized-versions
- Code hints: `src/rules/head/hreflangAbsoluteUrls.ts`, `src/rules/registry.ts`, `tests/rules/head.hreflangAbsoluteUrls.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-922: Implement rule head:meta-refresh - Meta refresh redirect
- Epic: EPIC-902
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `head:meta-refresh`.
- Expected: A result for `head:meta-refresh` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `http:navigation-path` - it does not test this.
- SHOULD: Detects <meta http-equiv="refresh"> in static and rendered HTML and applies Google's documented semantics: an instant (0-second) meta refresh is interpreted as a permanent redirect, a delayed one (>0 seconds) only as a temporary redirect (weak canonical signal); server-side redirects are explicitly preferred ('a server side redirect has the highest chance of being interpreted correctly by Google'). The existing http:navigation-path rule only labels an already-observed client-side hop; this rule statically inspects the tag, parses the delay value, and evaluates the target URL even when no navigation occurred.
- Verdict logic: ok: no meta refresh present. warn: instant meta refresh (delay 0) - works as a permanent redirect signal but a server-side 301/308 is more reliable. error: delayed meta refresh (delay > 0) used to move users to another URL - treated only as a temporary redirect and never passes a permanent-move signal; error: meta refresh present only in the rendered DOM (injected by JS - Google may never execute it if rendering fails, per 301-redirects JavaScript caveats).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/crawling-indexing/301-redirects
- Code hints: `src/rules/head/metaRefresh.ts`, `src/rules/registry.ts`, `tests/rules/head.metaRefresh.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-923: Implement rule head:title-quality - Title link quality (vague, half-empty, stuffed)
- Epic: EPIC-902
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `head:title-quality`.
- Expected: A result for `head:title-quality` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `head:title` - it does not test this.
- SHOULD: Detects the specific title patterns Google says trigger title-link rewrites: vague one-word titles like 'Home' or 'Profile' or 'Untitled'; half-empty titles consisting only of a delimiter plus site name (e.g. '| Site Name') where Google supplements missing text from headers; and keyword stuffing via repeated near-identical terms (spec example: 'Foobar, foo bar, foobars, foo bars'), which 'can make your results look spammy to Google and to users'. Complements head:title (length only) and head-title (presence only).
- Verdict logic: error if title is empty after stripping delimiters (-, :, |) and whitespace, or matches a vague-title list (home, index, untitled, new page, default, profile - case-insensitive, whole title). error if half-empty: title minus detected brand/site-name token and delimiters leaves < 3 characters. warn if keyword stuffing: any normalized token stem appears >= 3 times, or comma-separated list of >= 4 items where >= 3 share a stem. ok otherwise.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/title-link
- Code hints: `src/rules/head/titleQuality.ts`, `src/rules/registry.ts`, `tests/rules/head.titleQuality.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-924: Implement rule head:amphtml-reciprocal - AMP/canonical reciprocal linking
- Epic: EPIC-902
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `head:amphtml-reciprocal`.
- Expected: A result for `head:amphtml-reciprocal` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `head:amphtml` - it does not test this.
- SHOULD: The AMP spec's discovery mechanism is bidirectional: the canonical page carries <link rel="amphtml" href=...> and the AMP document must carry <link rel="canonical"> back to the regular version (or itself when standalone). head:amphtml only reports presence of the outbound link; nothing verifies the pair. Mirroring head:hreflang-multipage, this rule fetches the rel=amphtml URL (bounded, with redirect-chain observation), checks HTTP status, confirms the target is an AMP document (html[amp]/[⚡]), and that its rel=canonical resolves back to this page's canonical.
- Verdict logic: info: no rel=amphtml link. ok: AMP URL returns 200, is a real AMP document, and its canonical points back to this page's canonical URL. warn: AMP URL redirects before resolving (report chain), or target canonical points to a different URL on the same origin. error: AMP URL returns non-200, enters a redirect loop, target is not an AMP document, or target's canonical points to an unrelated page (broken pairing - the amphtml annotation is then meaningless).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://amp.dev/documentation/guides-and-tutorials/learn/spec/amphtml
  - https://developers.google.com/search/docs/crawling-indexing/amp
- Code hints: `src/rules/head/amphtmlReciprocal.ts`, `src/rules/registry.ts`, `tests/rules/head.amphtmlReciprocal.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-925: Implement rule head:hreflang-code-registry - Hreflang codes against ISO registries
- Epic: EPIC-902
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `head:hreflang-code-registry`.
- Expected: A result for `head:hreflang-code-registry` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `head:hreflang-values` - it does not test this.
- SHOULD: The spec mandates ISO 639-1 language codes, optional ISO 15924 script and ISO 3166-1 Alpha-2 region, and its common-errors section calls out reserved codes misapplied (EU, UN, UK) and region-only values. head:hreflang-values only runs a shape regex, so 'en-UK' (UK is exceptionally-reserved, Google expects GB), 'eu' (parses as Basque when EU-region was meant) and made-up codes like 'xx' all pass. This rule validates each part against bundled ISO 639-1/639-2, ISO 15924 and ISO 3166-1 lists and flags the documented pitfalls by name.
- Verdict logic: ok: every code's language part is a registered ISO 639 code and any region part is a registered ISO 3166-1 Alpha-2 code (or UN M49 numeric). error: language part not in ISO 639 registry, or region part is a reserved/non-assigned code (EU, UN, UK named in the spec's error list). warn: value that is a valid language code but a well-known confusion (uk=Ukrainian, be=Belarusian when de-BE was likely meant per the spec's 'be instead of de-be' example) while the html lang or cluster suggests otherwise. info: no hreflang links.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/specialty/international/localized-versions
- Code hints: `src/rules/head/hreflangCodeRegistry.ts`, `src/rules/registry.ts`, `tests/rules/head.hreflangCodeRegistry.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-926: Implement rule head:hreflang-combined-attributes - Hreflang link combined with other attributes
- Epic: EPIC-902
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `head:hreflang-combined-attributes`.
- Expected: A result for `head:hreflang-combined-attributes` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `head:rel-alternate-media` - it does not test this.
- SHOULD: The spec explicitly says: 'don't combine link tags for alternate representations of the document; for example don't combine hreflang annotations with other attributes such as media in a single link tag.' No existing rule tests this (head:rel-alternate-media checks media alternates separately but never the illegal combination). Scans link[rel~=alternate][hreflang] for additional selection attributes: media, type, title, or extra rel tokens beyond alternate.
- Verdict logic: ok: every hreflang link carries only rel=alternate, hreflang, href. error: any hreflang link also has a media attribute (the exact combination the spec forbids). warn: hreflang link carries type/title or extra rel tokens (e.g. rel='alternate amphtml') - undefined combination likely ignored. info: no hreflang links.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/specialty/international/localized-versions
- Code hints: `src/rules/head/hreflangCombinedAttributes.ts`, `src/rules/registry.ts`, `tests/rules/head.hreflangCombinedAttributes.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-927: Implement rule head:hreflang-duplicates - Hreflang duplicate and conflicting entries
- Epic: EPIC-902
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `head:hreflang-duplicates`.
- Expected: A result for `head:hreflang-duplicates` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `head:hreflang-values` - it does not test this.
- SHOULD: The spec's annotation model maps each language/region code to exactly one URL per page ('each page version must reference itself plus all alternates'). Two entries with the same hreflang code pointing at different URLs send Google contradictory signals and make the cluster ambiguous; exact duplicate tags are markup bloat. No existing rule groups the cluster by code. Compares case-insensitively normalized hreflang codes against resolved hrefs.
- Verdict logic: ok: every hreflang code appears at most once (x-default included). error: same hreflang code maps to 2+ distinct URLs (conflicting alternates). warn: identical code+href pair repeated (redundant duplicate tags), or the same URL claimed by 3+ different language codes without region qualifiers (likely template bug). info: no hreflang links.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/specialty/international/localized-versions
- Code hints: `src/rules/head/hreflangDuplicates.ts`, `src/rules/registry.ts`, `tests/rules/head.hreflangDuplicates.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-928: Implement rule head:hreflang-x-default - Hreflang x-default present
- Epic: EPIC-902
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `head:hreflang-x-default`.
- Expected: A result for `head:hreflang-x-default` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `head:hreflang-values` - it does not test this.
- SHOULD: Google reserves the x-default value for 'when no other language/region matches the user's browser setting' and recommends it for language selectors and unmatched users. head:hreflang-values only validates x-default syntax when present; nothing checks that a multi-language cluster declares a fallback. This rule detects x-default in the cluster, reports its target URL, and verifies the target resolves to an absolute URL.
- Verdict logic: ok: cluster contains exactly one x-default entry with a fully-qualified href. warn: cluster has 2+ distinct language codes but no x-default (recommended, not required per spec). error: multiple x-default entries pointing to different URLs (conflicting fallback signal). info: no hreflang cluster or single-language cluster.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/specialty/international/localized-versions
- Code hints: `src/rules/head/hreflangXDefault.ts`, `src/rules/registry.ts`, `tests/rules/head.hreflangXDefault.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-929: Implement rule head:title-h1-consistency - Title vs main heading consistency
- Epic: EPIC-902
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `head:title-h1-consistency`.
- Expected: A result for `head:title-h1-consistency` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `body:h1` - it does not test this.
- SHOULD: Whether the <title> element and the page's main visual title (first visible <h1>, or largest prominent heading) describe the same thing. The spec lists the main visual title and heading elements as the top alternative sources Google uses to replace a title link, and calls out mismatched/obsolete titles (e.g. a stale year in <title> vs the visible heading) as a case where 'Google uses the visible version'. Also flags multiple competing headings: if several headings 'carry the same visual weight and prominence,' Google may pick the first as the title link.
- Verdict logic: Compute token overlap (after stemming, stopword and brand removal) between <title> and the first rendered <h1>. ok if overlap >= 50% or one contains the other. warn if overlap < 50% (rewrite risk), or if <title> and <h1> contain different 4-digit years (obsolete-date pattern from the spec), or if > 1 visible <h1> exists post-JS with similar computed font sizes (within 10%). error only if an <h1> exists but shares zero content tokens with the title. info if no <h1> (covered by body:h1).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/title-link
- Code hints: `src/rules/head/titleH1Consistency.ts`, `src/rules/registry.ts`, `tests/rules/head.titleH1Consistency.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-930: Implement rule head:amphtml-url-relation - AMP URL logically related to canonical
- Epic: EPIC-902
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `head:amphtml-url-relation`.
- Expected: A result for `head:amphtml-url-relation` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `head:amphtml` - it does not test this.
- SHOULD: Google's AMP guidelines say AMP URLs should logically relate to the canonical page - e.g. amp.example.com/giraffes or example.com/amp/giraffes - 'rather than unrelated domains', because users see the AMP URL in the address bar (and since the July 1, 2026 change Google sends users directly to the publisher's AMP host page, making the visible host matter even more). Compares the registrable domain of the rel=amphtml href against the page/canonical registrable domain.
- Verdict logic: ok: rel=amphtml URL shares the page's registrable domain (subdomain or path variant is fine per the spec examples). warn: AMP URL is on a different registrable domain (spec: unrelated domains erode user trust); also warn if the AMP URL is not https while the page is. info: no rel=amphtml link.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/crawling-indexing/amp
- Code hints: `src/rules/head/amphtmlUrlRelation.ts`, `src/rules/registry.ts`, `tests/rules/head.amphtmlUrlRelation.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-931: Implement rule head:meta-description-quality - Meta description quality (keyword lists, non-descriptive)
- Epic: EPIC-902
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `head:meta-description-quality`.
- Expected: A result for `head:meta-description-quality` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `head-meta-description` - it does not test this.
- SHOULD: Beyond presence/length (head-meta-description), tests the snippet doc's quality guidance: descriptions must be 'truly descriptive' and not 'long strings of keywords' that 'don't give users a clear idea of the page's content'. Detects comma-separated keyword lists, token repetition, and descriptions that are a verbatim copy of the <title> (adds no snippet value, so Google will ignore it and auto-generate).
- Verdict logic: warn if the description is >= 60% comma/pipe-separated tokens with no verb-bearing sentence (keyword-list pattern), or any token stem repeats >= 3 times, or the description equals the <title> text after normalization. ok otherwise. Never error - Google auto-generates snippets regardless; these patterns only waste the tag ('Google sometimes uses the meta description... if it might give users a more accurate description'). info if no meta description (head-meta-description's job).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/snippet
- Code hints: `src/rules/head/metaDescriptionQuality.ts`, `src/rules/registry.ts`, `tests/rules/head.metaDescriptionQuality.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-932: Implement rule head:title-writing-system - Title writing system matches content
- Epic: EPIC-902
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `head:title-writing-system`.
- Expected: A result for `head:title-writing-system` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `discover:primary-language` - it does not test this.
- SHOULD: Whether the <title> uses 'the same language and writing system (meaning, the script or alphabet for a given language) as the primary content'. The spec's example: a Hindi page with an English/transliterated title gets its title link replaced by Google. Tested deterministically via Unicode script classes: the dominant script of visible body text vs the dominant script of the title.
- Verdict logic: Classify characters of body text sample and title into Unicode scripts (Latin, Devanagari, Cyrillic, Arabic, Han, Kana, Hangul, Greek, Hebrew, Thai...). ok if dominant scripts match, or body is mixed with no script > 60%. warn if body's dominant script (> 60% of letters) differs from the title's dominant script (rewrite risk per spec). Never error - language choice can be intentional. info listing both detected scripts.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/title-link
- Code hints: `src/rules/head/titleWritingSystem.ts`, `src/rules/registry.ts`, `tests/rules/head.titleWritingSystem.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-933: Implement rule schema:date-validity - Schema dates valid (ISO 8601, no future dates)
- Epic: EPIC-903
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:date-validity`.
- Expected: A result for `schema:date-validity` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `discover:published-time` - it does not test this.
- SHOULD: Validates datePublished/dateModified in any CreativeWork subtype (Article, BlogPosting, VideoObject...) against the publication-dates spec: ISO 8601 format (spec example '2021-07-20T08:00:00+08:00'); date required, time optional but recommended with timezone ('specify the correct timezone, accounting for daylight saving time'); 'Don't specify future dates'; and logical ordering (a dateModified earlier than datePublished is inconsistent). discover:published-time only checks presence; this validates the values.
- Verdict logic: error if datePublished or dateModified is present but not parseable as ISO 8601, or parses to a future date (> now + 24h tolerance for timezone skew - spec: 'Don't specify future dates'). warn if a time is given without a timezone offset (precision recommendation), or if dateModified < datePublished. ok if all present values are valid ISO 8601, past-or-present, and ordered. info if no CreativeWork dates exist (presence is discover:published-time's job).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/publication-dates
- Code hints: `src/rules/schema/dateValidity.ts`, `src/rules/registry.ts`, `tests/rules/schema.dateValidity.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-934: Implement rule schema:jsonld-parse - JSON-LD parse validity
- Epic: EPIC-903
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:jsonld-parse`.
- Expected: A result for `schema:jsonld-parse` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `dom:ldjson` - it does not test this.
- SHOULD: Whether every <script type="application/ld+json"> block parses as valid JSON and yields at least one node with @type/@graph. Google's intro doc says all formats are 'equally fine for Google, as long as the markup is valid'. Today src/shared/structured.ts parseLd() silently swallows SyntaxError, so a broken block is invisible to all 17 schema rules and to dom:ldjson (which only counts blocks) - a single stray trailing comma kills eligibility with zero signal in the extension.
- Verdict logic: error: >=1 block throws SyntaxError on JSON.parse (report block index, byte offset, snippet); warn: block parses but contains no @type and no @graph node (dead markup); ok: all blocks parse and yield typed nodes; info: no ld+json blocks on page.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
  - https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Code hints: `src/rules/schema/jsonldParse.ts`, `src/rules/registry.ts`, `tests/rules/schema.jsonldParse.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-935: Implement rule schema:qapage - Schema QAPage
- Epic: EPIC-903
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:qapage`.
- Expected: A result for `schema:qapage` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `schema:faq` - it does not test this.
- SHOULD: QAPage markup validity - the surviving Q&A rich result now that FAQ is deprecated. Doc requires 'one question followed by its answers', user-submittable answers, and forbids QAPage for FAQ pages or multi-question pages. Question requires name, answerCount, and acceptedAnswer or suggestedAnswer; Answer requires text.
- Verdict logic: error: QAPage without mainEntity Question; error: Question missing name or answerCount, or having neither acceptedAnswer nor suggestedAnswer; error: any Answer without text; warn: more than one Question in mainEntity (doc: one question per page); warn: page carries both QAPage and FAQPage markup; ok: single valid Question with valid answers; info: no QAPage node.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/qapage
- Code hints: `src/rules/schema/qapage.ts`, `src/rules/registry.ts`, `tests/rules/schema.qapage.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-936: Implement rule schema:retired-features - Retired rich-result markup
- Epic: EPIC-903
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:retired-features`.
- Expected: A result for `schema:retired-features` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `schema:faq` - it does not test this.
- SHOULD: Whether the page carries structured data for rich-result features Google has retired: FAQPage (deprecation notice May 8, 2026), HowTo (removed Sep 14, 2023), WebSite potentialAction SearchAction / sitelinks search box ('no longer available in Google Search results', docs removed Nov 29, 2024), SpecialAnnouncement (deprecated Apr 23, 2025), Quiz/practice-problems (deprecated Nov 5, 2025). Dead markup wastes bytes and misleads audits; existing per-type rules still validate these as if live.
- Verdict logic: warn: any retired type detected in parsed JSON-LD (one line per type: 'X markup no longer produces a rich result, retired <date>'); ok: none of the retired types present; info: no structured data at all.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/updates
  - https://developers.google.com/search/docs/appearance/structured-data/faqpage
  - https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox
- Code hints: `src/rules/schema/retiredFeatures.ts`, `src/rules/registry.ts`, `tests/rules/schema.retiredFeatures.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-937: Implement rule schema:review-snippet - Schema Review/AggregateRating
- Epic: EPIC-903
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:review-snippet`.
- Expected: A result for `schema:review-snippet` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `schema:product` - it does not test this.
- SHOULD: Standalone review-snippet validity across all eligible types (Book, Course, Event, LocalBusiness, Movie, Product, Recipe, SoftwareApp, Organization etc.): Review needs author (name under 100 characters per doc), itemReviewed and reviewRating.ratingValue; AggregateRating needs ratingValue plus ratingCount or reviewCount; ratingValue must fall inside [worstRating..bestRating] with documented default 5-point scale where 1 is lowest and 5 highest. Also flags the self-serving rule: pages using 'LocalBusiness or any other type of Organization structured data are ineligible for star review feature' when the entity controls its own reviews. Existing schema:product only looks at Product; no rule covers Review/AggregateRating generally.
- Verdict logic: error: Review missing author/itemReviewed/reviewRating.ratingValue, or AggregateRating missing ratingValue or both ratingCount and reviewCount; error: ratingValue outside [worstRating||1, bestRating||5]; warn: review/aggregateRating attached to Organization or LocalBusiness subtype on same-origin entity (self-serving, ineligible); warn: author.name > 100 chars; ok: all required present and in range; info: no Review/AggregateRating nodes.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/review-snippet
- Code hints: `src/rules/schema/reviewSnippet.ts`, `src/rules/registry.ts`, `tests/rules/schema.reviewSnippet.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-938: Implement rule schema:video:fetchable-source - VideoObject fetchable source (contentUrl/embedUrl)
- Epic: EPIC-903
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:video:fetchable-source`.
- Expected: A result for `schema:video:fetchable-source` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `schema:video` - it does not test this.
- SHOULD: Whether Google can actually fetch the video: each VideoObject must expose contentUrl (preferred - must point at actual video bytes in a supported format: 3GP, 3G2, ASF, AVI, DivX, M2V, M3U, M3U8, M4V, MKV, MOV, MP4, MPEG, OGV, QVT, RAM, RM, VOB, WebM, WMV, XAP) or embedUrl. The video doc says data URLs aren't supported and warns against blocking the video-bytes URL with robots.txt/noindex. schema:video only checks name/description/thumbnailUrl/uploadDate presence - it never looks at the source URLs.
- Verdict logic: Fires only when a VideoObject exists. error: neither contentUrl nor embedUrl present, or contentUrl is a data: URL. warn: contentUrl file extension not in the supported-format list, contentUrl is not absolute https, contentUrl points at an HTML page (heuristic: no media extension and same path shape as watch page), or same-host contentUrl is disallowed by robots.txt. ok: contentUrl (supported format, robots-allowed) and/or embedUrl present.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/video
  - https://developers.google.com/search/docs/appearance/video
- Code hints: `src/rules/schema/videoFetchableSource.ts`, `src/rules/registry.ts`, `tests/rules/schema.videoFetchableSource.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-939: Implement rule schema:website-name - Schema WebSite site name
- Epic: EPIC-903
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:website-name`.
- Expected: A result for `schema:website-name` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `schema:website-searchaction` - it does not test this.
- SHOULD: Site-name eligibility via WebSite structured data: required properties 'name' and 'url', where url 'must be the canonical home page of your site's domain or subdomain' and the markup 'must be on the home page of the site' ('the domain or subdomain level root URI'); subdirectory-level site names are not supported. Optional 'alternateName' for acronyms/short variants. Distinct from schema:website-searchaction, which tests the (now retired) SearchAction sitelinks feature, not the name/url pair Google uses for site names in results.
- Verdict logic: On homepage (root URI of domain/subdomain): warn if no WebSite JSON-LD/microdata with a 'name' (site name then inferred from other signals); error if WebSite exists but 'name' is missing/empty, or 'url' is absent or does not match the page's canonical homepage origin (after trailing-slash normalization); ok if name + matching url present (info shows name and any alternateName). On a subdirectory page that carries WebSite markup with name: info noting subdirectory site names are not supported at this level per spec.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/site-names
  - https://developers.google.com/search/docs/appearance/title-link
- Code hints: `src/rules/schema/websiteName.ts`, `src/rules/registry.ts`, `tests/rules/schema.websiteName.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-940: Implement rule schema:carousel-itemlist - Schema Carousel ItemList
- Epic: EPIC-903
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:carousel-itemlist`.
- Expected: A result for `schema:carousel-itemlist` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `schema:breadcrumb:positions` - it does not test this.
- SHOULD: ItemList/ListItem carousel validity: doc requires 'at least two ListItem elements', 1-based position, url (summary page style) or item with item.name and item.url (all-in-one style), 'All items in the list must be of the same type... Don't mix different types', and host-carousel eligibility only for Course list, Movie, Recipe, Restaurant. schema:breadcrumb:positions does position logic for BreadcrumbList only; nothing covers generic ItemList.
- Verdict logic: error: ItemList with fewer than 2 ListItem; error: positions missing, non-integer, not starting at 1, or non-sequential; error: ListItem lacking both url and item.url; warn: mixed @type values across items; warn: nested item type not one of Course/Movie/Recipe/Restaurant (not eligible for host carousel); ok: valid homogeneous list; info: no ItemList (excluding BreadcrumbList).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/carousel
- Code hints: `src/rules/schema/carouselItemlist.ts`, `src/rules/registry.ts`, `tests/rules/schema.carouselItemlist.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-941: Implement rule schema:dataset - Schema Dataset
- Epic: EPIC-903
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:dataset`.
- Expected: A result for `schema:dataset` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: Dataset markup validity for Dataset Search: required name and description, where description must be 'between 50 and 5000 characters long' (threshold from the Dataset doc); distribution entries require distribution.contentUrl ('the link for the download'); recommended license, creator, sameAs, identifier, isAccessibleForFree.
- Verdict logic: error: Dataset missing name or description; warn: description shorter than 50 or longer than 5000 characters; error: distribution present but any DataDownload lacks contentUrl; warn: license and creator both absent; ok: required present and description within 50-5000 chars; info: no Dataset node.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/dataset
- Code hints: `src/rules/schema/dataset.ts`, `src/rules/registry.ts`, `tests/rules/schema.dataset.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-942: Implement rule schema:discussion-forum - Schema DiscussionForumPosting
- Epic: EPIC-903
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:discussion-forum`.
- Expected: A result for `schema:discussion-forum` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: DiscussionForumPosting validity: required author (with name), datePublished in ISO 8601, and at least one of text/image/video. Doc marks as inappropriate 'an article or blog written directly by an agent for the website' and product reviews, and recommends Q&A markup when 'the structure of the forum website is primarily questions with answers'. No existing rule touches this type.
- Verdict logic: error: DiscussionForumPosting missing author or datePublished; error: none of text/image/video present; warn: datePublished not valid ISO 8601; warn: recommended author.url/url/interactionStatistic absent; warn: page also has Article markup on same content (agent-written article is an invalid use); ok: required properties valid; info: no DiscussionForumPosting node.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/discussion-forum
- Code hints: `src/rules/schema/discussionForum.ts`, `src/rules/registry.ts`, `tests/rules/schema.discussionForum.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-943: Implement rule schema:image-crawlability - Structured data image crawlability
- Epic: EPIC-903
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:image-crawlability`.
- Expected: A result for `schema:image-crawlability` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `robots:blocked-resources` - it does not test this.
- SHOULD: The sd-policies image rule: 'All image URLs specified in structured data must be crawlable and indexable.' Collects image/logo/contentUrl values from all JSON-LD nodes, checks each against the already-fetched robots.txt (Googlebot disallow) and, for same-origin URLs, verifies via bounded fetch that they return 200. robots:blocked-resources checks page resources, not URLs referenced only inside structured data.
- Verdict logic: error: any structured-data image URL disallowed by robots.txt for Googlebot; error: same-origin image URL returns 4xx/5xx on bounded fetch; warn: image URL is relative or not a fully-qualified URL; ok: all image URLs allowed and (where checkable) resolving 200; info: structured data contains no image URLs.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Code hints: `src/rules/schema/imageCrawlability.ts`, `src/rules/registry.ts`, `tests/rules/schema.imageCrawlability.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-944: Implement rule schema:image-license - Image license metadata (Licensable badge)
- Epic: EPIC-903
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:image-license`.
- Expected: A result for `schema:image-license` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: ImageObject nodes for the image-license metadata that powers the Licensable badge in Google Images: contentUrl is required to tie metadata to an image; the doc states the license property is mandatory for badge eligibility ('you must include the license property for your image to be eligible'); acquireLicensePage, creator (with name), creditText and copyrightNotice are the recommended set. No existing rule inspects ImageObject at all.
- Verdict logic: Applicability-gated: only fires when an ImageObject node with any license-family property exists (otherwise info/skip). ok: ImageObject has contentUrl + license, plus at least one of acquireLicensePage/creator/creditText/copyrightNotice. warn: license present but contentUrl missing (Google cannot match the image), or license missing while other license-family fields (creator/creditText/copyrightNotice/acquireLicensePage) are present - badge-ineligible per the doc. List missing recommended fields in details.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata
- Code hints: `src/rules/schema/imageLicense.ts`, `src/rules/registry.ts`, `tests/rules/schema.imageLicense.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-945: Implement rule schema:microdata-rdfa - Microdata/RDFa structured data
- Epic: EPIC-903
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:microdata-rdfa`.
- Expected: A result for `schema:microdata-rdfa` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `dom:ldjson` - it does not test this.
- SHOULD: Detects Microdata (itemscope/itemtype) and RDFa (typeof/vocab) markup. Google's intro doc states all three formats are 'equally fine for Google, as long as the markup is valid' - but every existing schema:* rule and dom:ldjson parse only JSON-LD, so a site marked up entirely in Microdata currently reads as 'no structured data' in the extension. This rule surfaces non-JSON-LD markup and its schema.org types so the audit is not blind to two of the three supported formats.
- Verdict logic: ok: Microdata/RDFa detected with itemtype/typeof resolving to schema.org types (list the types and counts); warn: itemscope elements without itemtype, or itemprop attributes outside any itemscope (invalid markup); warn: same entity type duplicated in both JSON-LD and Microdata (risk of conflicting values); info: no Microdata/RDFa on page.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
  - https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Code hints: `src/rules/schema/microdataRdfa.ts`, `src/rules/registry.ts`, `tests/rules/schema.microdataRdfa.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-946: Implement rule schema:noindex-conflict - Structured data on blocked page
- Epic: EPIC-903
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:noindex-conflict`.
- Expected: A result for `schema:noindex-conflict` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `head:canonical-noindex-conflict` - it does not test this.
- SHOULD: The sd-policies technical guideline: 'Don't block your structured data pages to Googlebot using robots.txt, noindex, or any other access control methods.' The extension already knows the page's robots meta, X-Robots-Tag and robots.txt verdict; this rule cross-references them with the presence of rich-result-eligible JSON-LD, catching pages that ship elaborate markup Google will never use.
- Verdict logic: warn: rich-result-eligible structured data present AND (meta robots or X-Robots-Tag contains noindex, OR current URL disallowed for Googlebot in robots.txt); ok: structured data present and page indexable, or no structured data; info: no structured data and page blocked (nothing wasted).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Code hints: `src/rules/schema/noindexConflict.ts`, `src/rules/registry.ts`, `tests/rules/schema.noindexConflict.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-947: Implement rule schema:paywalled-content - Schema paywalled content
- Epic: EPIC-903
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:paywalled-content`.
- Expected: A result for `schema:paywalled-content` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: Paywalled/subscription content markup (critical to avoid cloaking classification): CreativeWork subtypes (Article, NewsArticle, Blog, Course, Review, WebPage...) with isAccessibleForFree:false should declare hasPart with a cssSelector referencing the paywalled section; doc mandates 'Only use .class selectors for the cssSelector property' and 'Don't nest content sections'. The extension can resolve the selector against the live DOM to verify it matches real elements.
- Verdict logic: warn: isAccessibleForFree:false without hasPart.cssSelector; error: cssSelector that is not a .class selector (id, tag, compound); error: cssSelector matches zero elements in the rendered DOM; warn: nested marked sections detected; ok: isAccessibleForFree:false with resolving .class selector, or no paywall markup with no paywall signals; info: no CreativeWork with isAccessibleForFree.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/paywalled-content
- Code hints: `src/rules/schema/paywalledContent.ts`, `src/rules/registry.ts`, `tests/rules/schema.paywalledContent.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-948: Implement rule schema:profile-page - Schema ProfilePage
- Epic: EPIC-903
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:profile-page`.
- Expected: A result for `schema:profile-page` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: ProfilePage validity: required mainEntity of type Person or Organization carrying name ('the primary way the person or organization is identified'; real names in name, handles in alternateName). Recommended: dateCreated/dateModified in ISO 8601, alternateName, description, identifier, image, interactionStatistic, sameAs. Relevant for author E-E-A-T pages; no existing rule covers it.
- Verdict logic: error: ProfilePage without mainEntity, or mainEntity not Person/Organization; error: mainEntity missing name; warn: none of the recommended properties (image, sameAs, dateCreated, description) present; warn: dateCreated/dateModified present but not ISO 8601; ok: mainEntity Person/Organization with name; info: no ProfilePage node.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/profile-page
- Code hints: `src/rules/schema/profilePage.ts`, `src/rules/registry.ts`, `tests/rules/schema.profilePage.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-949: Implement rule schema:software-app - Schema SoftwareApplication
- Epic: EPIC-903
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:software-app`.
- Expected: A result for `schema:software-app` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: SoftwareApplication/MobileApplication/WebApplication validity: required name, offers.price (free apps must set price 0), and at least one of aggregateRating or review. Doc warns 'Google doesn't show a rich result for Software Apps that only have the VideoGame type' - VideoGame must be co-typed. Recommended applicationCategory and operatingSystem.
- Verdict logic: error: missing name; error: missing offers.price (including free apps without explicit 0); error: neither aggregateRating nor review present; warn: @type is only VideoGame without co-typing another application type; warn: applicationCategory or operatingSystem absent; ok: all required present; info: no SoftwareApplication-family node.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/software-app
- Code hints: `src/rules/schema/softwareApp.ts`, `src/rules/registry.ts`, `tests/rules/schema.softwareApp.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-950: Implement rule schema:video:iso8601-dates - VideoObject date/duration validity
- Epic: EPIC-903
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:video:iso8601-dates`.
- Expected: A result for `schema:video:iso8601-dates` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `schema:video` - it does not test this.
- SHOULD: Validates the temporal fields schema:video ignores: uploadDate and expires must be valid ISO 8601 (the 2023-11-01 changelog added the recommendation to include time and timezone), duration must be a valid ISO 8601 duration (doc example PT00H30M5S). Critically, the video doc states 'when a video has an expiration date in the past, the video won't appear in video results' - an expired expires value silently removes the video.
- Verdict logic: Fires only when a VideoObject exists. error: expires parses to a date in the past, or uploadDate/duration present but not parseable as ISO 8601. warn: uploadDate lacks time/timezone (changelog recommendation), duration of 0 seconds, or uploadDate in the future. ok: all present temporal fields valid, expires (if any) in the future.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/video
  - https://developers.google.com/search/docs/appearance/video
  - https://developers.google.com/search/updates
- Code hints: `src/rules/schema/videoIso8601Dates.ts`, `src/rules/registry.ts`, `tests/rules/schema.videoIso8601Dates.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-951: Implement rule schema:video:thumbnail-quality - VideoObject thumbnail fetch and size
- Epic: EPIC-903
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:video:thumbnail-quality`.
- Expected: A result for `schema:video:thumbnail-quality` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `schema:video` - it does not test this.
- SHOULD: Loads each VideoObject thumbnailUrl (and <video poster>, og:video:image when present) and verifies the video doc's thumbnail requirements: minimum 60x30 pixels (larger preferred), a supported format (BMP, GIF, JPEG, PNG, WebP, SVG, AVIF), reachable at a stable URL, and not robots-blocked for Googlebot/Googlebot-Image. Also flags expiring-signature query params (X-Amz-Expires, Expires=, token=) as instability signals - the doc requires 'a single unique and stable thumbnail URL for each video'.
- Verdict logic: Fires only when a VideoObject exists. error: thumbnailUrl fails to load, or measured dimensions < 60x30 px (spec minimum), or unsupported format. warn: same-host thumbnail disallowed by robots.txt, URL carries expiring-signature params, or thumbnail < 1200px wide (larger preferred / Discover-grade guidance). ok: loads, >= 60x30, supported format, robots-allowed.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/video
  - https://developers.google.com/search/docs/appearance/structured-data/video
- Code hints: `src/rules/schema/videoThumbnailQuality.ts`, `src/rules/registry.ts`, `tests/rules/schema.videoThumbnailQuality.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-952: Implement rule schema:visible-content-match - Structured data matches visible content
- Epic: EPIC-903
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:visible-content-match`.
- Expected: A result for `schema:visible-content-match` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: The core sd-policies content rule: don't mark up 'information that is not visible to the user, even if the information is accurate', and markup must genuinely represent page content (doc example: 'a woodworking site labeling instructions as recipes'). Heuristic check: normalize key text values from JSON-LD (headline, name, Question.name, Recipe.name, Product.name, author name) and verify each appears in the rendered document body text.
- Verdict logic: warn: any checked marked-up text value (normalized, whitespace/case-insensitive) not found in the rendered page's visible text - list the invisible values; ok: all checked values found in visible content; info: no structured data or no checkable text properties.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/sd-policies
  - https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Code hints: `src/rules/schema/visibleContentMatch.ts`, `src/rules/registry.ts`, `tests/rules/schema.visibleContentMatch.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort L respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-953: Implement rule schema:course-list - Schema Course list
- Epic: EPIC-903
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:course-list`.
- Expected: A result for `schema:course-list` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: Course-list rich result validity: each Course requires name, description ('Display limit of 60 characters') and provider; the doc mandates 'You must mark up at least three courses' and 'You must add Carousel markup to either a summary page or an all-in-one page'. Titles must not contain promotional phrases or pricing. (Distinct from the retired 'Course info' type, removed Sep 9, 2025 per changelog.)
- Verdict logic: error: any Course missing name, description, or provider; warn: fewer than 3 Course items marked up; warn: Course items present without accompanying ItemList carousel markup; warn: description longer than 60 characters (display truncation); ok: >=3 complete Courses inside ItemList; info: no Course nodes.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/course
  - https://developers.google.com/search/docs/appearance/structured-data/carousel
- Code hints: `src/rules/schema/courseList.ts`, `src/rules/registry.ts`, `tests/rules/schema.courseList.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-954: Implement rule schema:movie - Schema Movie
- Epic: EPIC-903
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:movie`.
- Expected: A result for `schema:movie` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: Movie carousel validity (mobile-only rich result): required name and image, image must be crawlable/indexable, in .jpg/.png/.gif, high resolution with 6:9 aspect ratio ('Images deviating significantly from the 6:9 ratio aren't eligible'); recommended dateCreated, director, aggregateRating, review; Movies must be nested in ItemList ListItems with positions.
- Verdict logic: error: Movie missing name or image; warn: image URL extension not .jpg/.png/.gif; warn: Movie nodes not wrapped in ItemList carousel markup; warn: dateCreated and director both absent; ok: name + image inside a positioned ItemList; info: no Movie nodes.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/movie
  - https://developers.google.com/search/docs/appearance/structured-data/carousel
- Code hints: `src/rules/schema/movie.ts`, `src/rules/registry.ts`, `tests/rules/schema.movie.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-955: Implement rule schema:speakable - Schema Speakable
- Epic: EPIC-903
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:speakable`.
- Expected: A result for `schema:speakable` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: Speakable (beta, US/English news) markup validity: must use cssSelector or xPath - 'Use either cssSelector or xPath; don't use both'; doc recommends 'around 20-30 seconds of content per section... or roughly two to three sentences'. The extension can resolve cssSelector/xPath against the rendered DOM and measure the selected text length.
- Verdict logic: error: speakable with both cssSelector and xPath; error: speakable with neither; error: selector/xpath matches zero nodes in rendered DOM; warn: selected text far outside the 2-3 sentence guidance (e.g. > 500 words); info note that the feature is beta and limited to US English publishers; ok: exactly one locator type resolving to content; info: no speakable property.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/speakable
- Code hints: `src/rules/schema/speakable.ts`, `src/rules/registry.ts`, `tests/rules/schema.speakable.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-956: Implement rule schema:video:key-moments - Clip/SeekToAction key moments markup
- Epic: EPIC-903
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:video:key-moments`.
- Expected: A result for `schema:video:key-moments` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `schema:video` - it does not test this.
- SHOULD: Validates publisher-controlled key-moments markup nested in VideoObject. Clip requires name, startOffset (numeric seconds) and url, and the url must point to the watch page's own path with a time parameter. SeekToAction (potentialAction) requires target containing the literal {seek_to_second_number} placeholder and startOffset-input exactly equal to 'required name=seek_to_second_number'. Also checks clip ordering (startOffset < endOffset when endOffset present) and notes that nosnippet on the page disables key moments entirely (cross-checks head:robots-nosnippet state).
- Verdict logic: Fires only when Clip or SeekToAction markup exists (else skip). error: Clip missing name/startOffset/url, non-numeric startOffset, Clip url on a different path than the watch page, SeekToAction target without the {seek_to_second_number} placeholder, or startOffset-input not the exact required string. warn: endOffset <= startOffset, overlapping/duplicate clip offsets, or page carries nosnippet (key moments disabled despite the markup). ok: all clips/SeekToAction structurally valid.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/video
  - https://developers.google.com/search/docs/appearance/video
- Code hints: `src/rules/schema/videoKeyMoments.ts`, `src/rules/registry.ts`, `tests/rules/schema.videoKeyMoments.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-957: Implement rule schema:video:live-broadcast - BroadcastEvent LIVE badge validity
- Epic: EPIC-903
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `schema:video:live-broadcast`.
- Expected: A result for `schema:video:live-broadcast` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `schema:video` - it does not test this.
- SHOULD: When a VideoObject nests a publication BroadcastEvent (the LIVE badge mechanism), validates the required trio: publication.isLiveBroadcast set to true, publication.startDate as ISO 8601 datetime, and publication.endDate (which the doc requires 'once the livestream finishes'). A stale isLiveBroadcast:true with a long-past startDate and no endDate misrepresents a finished stream as live.
- Verdict logic: Fires only when BroadcastEvent/publication markup exists (else skip). error: isLiveBroadcast true but startDate missing or not ISO 8601. warn: isLiveBroadcast true, startDate > 24h in the past, and no endDate (likely finished stream still marked live - 24h window is a heuristic, labeled as such); or endDate before startDate. ok: isLiveBroadcast true with valid startDate (and endDate when present, ordered correctly).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/structured-data/video
- Code hints: `src/rules/schema/videoLiveBroadcast.ts`, `src/rules/registry.ts`, `tests/rules/schema.videoLiveBroadcast.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-958: Implement rule body:images-alt - Content images alt text
- Epic: EPIC-904
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `body:images-alt`.
- Expected: A result for `body:images-alt` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `a11y:linked-images-alt` - it does not test this.
- SHOULD: All content <img> elements (not just linked ones - a11y:linked-images-alt only covers images inside <a>) for missing or empty alt attributes, and for keyword-stuffed alt values, which the Google Images doc explicitly warns 'may cause your site to be seen as spam'. Also checks inline <svg> content graphics for a <title> child, the doc's stated equivalent. Decorative images (alt="", role=presentation, tiny <=16px) are excluded from the missing count.
- Verdict logic: ok: every non-decorative content image has a non-empty alt (and no stuffing signals). warn: >=1 non-decorative image with missing alt, or any alt showing stuffing signals (>=5 comma-separated tokens or the same token repeated >=3 times - heuristic; the spam warning itself is verbatim spec, the counts are implementation heuristics stated as such in details). info: page has no content images.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/google-images
- Code hints: `src/rules/body/imagesAlt.ts`, `src/rules/registry.ts`, `tests/rules/body.imagesAlt.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-959: Implement rule discover:image-intrinsic-size - Discover hero image intrinsic size
- Epic: EPIC-904
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `discover:image-intrinsic-size`.
- Expected: A result for `discover:image-intrinsic-size` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `discover:og-image-large` - it does not test this.
- SHOULD: Loads the actual pixels of the page's primary image (og:image, schema primaryImageOfPage/Article image, falling back to the largest rendered content <img>) via an Image() probe and measures naturalWidth/naturalHeight. The Discover doc requires images 'at least 1200 px wide' AND 'more than 300,000 total pixels' (their example: 1280x720 = 921,600 px) - the existing rule discover:og-image-large only trusts og:image:width/height META TAGS, which sites routinely omit or misstate; this rule verifies the real file. Also flags extreme aspect ratios, which the Images doc says to avoid for the preferred image.
- Verdict logic: ok: image loads, naturalWidth >= 1200 AND naturalWidth*naturalHeight > 300000 (thresholds from the Discover doc). warn: image loads but naturalWidth < 1200 or total pixels <= 300000, or aspect ratio > 4:1 / < 1:4, or declared og:image:width/height differ from measured by > 10%. error: declared primary image URL fails to load (404, network error, broken).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/google-discover
  - https://developers.google.com/search/docs/appearance/google-images#specify-preferred-image
- Code hints: `src/rules/discover/imageIntrinsicSize.ts`, `src/rules/registry.ts`, `tests/rules/discover.imageIntrinsicSize.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-960: Implement rule dom:canonical-render-diff - Canonical static vs rendered
- Epic: EPIC-904
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `dom:canonical-render-diff`.
- Expected: A result for `dom:canonical-render-diff` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `head:canonical-signals-conflict` - it does not test this.
- SHOULD: Diffs rel=canonical between static HTML and post-JS DOM. JavaScript SEO basics permits injecting a canonical with JS but demands consistency: 'Make sure that you always set the canonical URL to the same value as the original HTML' - a canonical that changes value after rendering, or duplicate canonical elements after hydration, gives Google conflicting signals ('Don't specify different URLs as canonical for the same page using different canonicalization techniques'). Existing canonical rules (head:canonical-signals-conflict compares link element vs HTTP header) never compare rendering phases.
- Verdict logic: error: canonical href in rendered DOM differs from the static HTML canonical (conflicting signals across phases). warn: canonical exists only after JS rendering (works per Google but depends on successful rendering); warn: rendered DOM contains more than one link[rel=canonical] while static had one (hydration duplicated it). ok: exactly one canonical, identical value in both phases; info: no canonical in either phase (covered by head-canonical).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
  - https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Code hints: `src/rules/dom/canonicalRenderDiff.ts`, `src/rules/registry.ts`, `tests/rules/dom.canonicalRenderDiff.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-961: Implement rule dom:robots-meta-render-diff - Robots meta static vs rendered
- Epic: EPIC-904
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `dom:robots-meta-render-diff`.
- Expected: A result for `dom:robots-meta-render-diff` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `head:robots-noindex` - it does not test this.
- SHOULD: Diffs the meta robots/googlebot directives between the static HTML and the post-JS DOM. Per JavaScript SEO basics, when Googlebot finds noindex in the initial HTML it skips rendering entirely - so removing or changing noindex via JavaScript does not work; conversely a noindex injected only by JavaScript is only honored if rendering succeeds, making it fragile. All existing robots-meta rules (head:robots-noindex, head:robots-meta-list) read a single DOM snapshot and cannot see this class of bug.
- Verdict logic: error: static HTML contains noindex but the rendered DOM does not (JS removal is ineffective; Google skips rendering on static noindex, page stays noindexed). warn: noindex present only in the rendered DOM (depends entirely on successful rendering); warn: any other robots directive set differs between static and rendered (nosnippet, max-snippet etc. inconsistency). ok: directive sets identical in both phases.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
  - https://developers.google.com/search/docs/crawling-indexing/block-indexing
- Code hints: `src/rules/dom/robotsMetaRenderDiff.ts`, `src/rules/registry.ts`, `tests/rules/dom.robotsMetaRenderDiff.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-962: Implement rule dom:video-embed-consistency - Video markup vs embed consistency
- Epic: EPIC-904
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `dom:video-embed-consistency`.
- Expected: A result for `dom:video-embed-consistency` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `schema:video` - it does not test this.
- SHOULD: Cross-checks VideoObject structured data against the rendered DOM. The video doc requires the video to actually be embedded on the watch page via <video>, <embed>, <iframe> or <object>, not hidden behind other elements, and present in the rendered HTML rather than gated behind user actions. Two failure directions: (a) VideoObject markup with no video embed in the post-JS DOM - markup describes a video Google cannot see on the page; (b) a prominent video embed with no VideoObject - the video misses required structured data for video indexing features. Also compares static vs post-JS DOM to report JS-injected embeds (fine per the doc as long as they appear in rendered HTML - reported as info with the caveat).
- Verdict logic: error: VideoObject present but no <video>/<embed>/<object>/video-platform <iframe> in the post-JS DOM, or the matching embed is rendered with zero size / visibility:hidden / display:none. warn: a video embed >= 256px wide exists in the content area with no VideoObject on the page. info: embed present only in post-JS DOM (JS-injected, acceptable), or no video content at all. ok: VideoObject and a visible matching embed both present.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/video
  - https://developers.google.com/search/docs/appearance/structured-data/video
- Code hints: `src/rules/dom/videoEmbedConsistency.ts`, `src/rules/registry.ts`, `tests/rules/dom.videoEmbedConsistency.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-963: Implement rule body:images-css-background - Content images in CSS backgrounds
- Epic: EPIC-904
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `body:images-css-background`.
- Expected: A result for `body:images-css-background` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: Post-JS DOM scan for large rendered elements (>=200x200 px in the content area) whose imagery comes only from CSS background-image with no <img> equivalent. The Google Images doc states Google 'doesn't index CSS images' and the 2024-02-06 changelog entry clarified images are 'only extracted from the src attribute of img tags' - so hero/content imagery delivered via background-image is invisible to Google Images.
- Verdict logic: ok: no large content-area elements rely solely on CSS background images. warn: >=1 element >=200x200 px rendered with a background-image URL and no <img> (or <picture>) descendant covering the same content; list the element paths and image URLs. info: background images only on decorative/chrome elements (header, body, elements < 200px).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/google-images
  - https://developers.google.com/search/updates
- Code hints: `src/rules/body/imagesCssBackground.ts`, `src/rules/registry.ts`, `tests/rules/body.imagesCssBackground.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-964: Implement rule body:images-format-support - Image format supported by Google Images
- Epic: EPIC-904
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `body:images-format-support`.
- Expected: A result for `body:images-format-support` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: Every <img> src (and <source srcset> candidate) against Google's supported format list - BMP, GIF, JPEG, PNG, WebP, SVG, AVIF (exact list from the Google Images doc). Flags unsupported formats (e.g. .tiff, .heic, .jxl) that Google Images cannot index, and reports data: URI images separately: supported per the doc, but with the doc's stated trade-off that they 'increase page size significantly' and only make sense for tiny assets.
- Verdict logic: ok: all image sources use a supported format. error: >=1 <img> whose only source is an unsupported format (detected by extension and/or Content-Type from resource observations). info: data: URI images present (list count and total inline bytes; warn when a single data URI exceeds 100KB - heuristic threshold, labeled as such).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/google-images
- Code hints: `src/rules/body/imagesFormatSupport.ts`, `src/rules/registry.ts`, `tests/rules/body.imagesFormatSupport.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-965: Implement rule body:media-embed-dimensions - Video/iframe missing dimensions
- Epic: EPIC-904
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `body:media-embed-dimensions`.
- Expected: A result for `body:media-embed-dimensions` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `body:images-layout` - it does not test this.
- SHOULD: Extends the unsized-media CLS check beyond images: web.dev/articles/optimize-cls says to 'always include width and height size attributes on your images and video elements' or reserve space with CSS aspect-ratio, and to reserve space (min-height/aspect-ratio) for embeds and iframes since late-loading embeds/ads are a top CLS cause. body:images-layout only inspects <img>; this rule inspects <video>, <iframe> and <embed> for width+height attributes or computed aspect-ratio/fixed height.
- Verdict logic: warn if any <video> or <iframe> intersecting the initial viewport lacks both width+height attributes and CSS-reserved space (aspect-ratio or fixed height); info if only below-the-fold embeds are unsized; ok if all video/iframe elements have reserved dimensions or none exist. Evidence: sampled elements with dom paths.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://web.dev/articles/optimize-cls
  - https://web.dev/articles/cls
- Code hints: `src/rules/body/mediaEmbedDimensions.ts`, `src/rules/registry.ts`, `tests/rules/body.mediaEmbedDimensions.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-966: Implement rule body:picture-img-fallback - Picture/srcset img fallback
- Epic: EPIC-904
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `body:picture-img-fallback`.
- Expected: A result for `body:picture-img-fallback` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `body:images-layout` - it does not test this.
- SHOULD: Responsive-image markup safety per the Google Images doc: 'always provide a fallback' - every <picture> must contain an <img> child with a src attribute, and any <img> using srcset must also carry a plain src. Since Google only extracts images from the img src attribute (2024-02-06 clarification), srcset-only or source-only markup can leave Google with nothing to index.
- Verdict logic: ok: all <picture> elements contain an <img> with non-empty src, and all srcset-bearing <img> elements also have src. error: >=1 <picture> without an <img src> fallback. warn: >=1 <img> with srcset but no src. info: no responsive image markup on the page.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/google-images
- Code hints: `src/rules/body/pictureImgFallback.ts`, `src/rules/registry.ts`, `tests/rules/body.pictureImgFallback.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-967: Implement rule discover:date-consistency - Visible date matches structured data date
- Epic: EPIC-904
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `discover:date-consistency`.
- Expected: A result for `discover:date-consistency` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `discover:published-time` - it does not test this.
- SHOULD: The spec's consistency requirement: 'Ensure that the date (and optional time and timezone) match between the equivalent user-visible and structured values.' Compares datePublished/dateModified from CreativeWork markup with the date(s) actually rendered in the visible byline. Mismatches are a leading cause of Google picking the wrong byline date in Search and Discover.
- Verdict logic: Applicable only when both a structured datePublished/dateModified and at least one visible byline-style date exist. ok if the visible date equals the structured date at day precision (timezone-normalized; time optional in visible text per spec). warn if they differ by 1 day (likely timezone rendering skew - spec requires timezone-correct values). error if the calendar dates differ by > 1 day (visible byline contradicts markup). info when either side is absent (covered by schema:date-validity and dom:visible-byline-date).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/publication-dates
- Code hints: `src/rules/discover/dateConsistency.ts`, `src/rules/registry.ts`, `tests/rules/discover.dateConsistency.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-968: Implement rule dom:amp-required-markup - AMP required markup (when page is AMP)
- Epic: EPIC-904
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `dom:amp-required-markup`.
- Expected: A result for `dom:amp-required-markup` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `head:amphtml` - it does not test this.
- SHOULD: No existing rule validates the current page when it IS an AMP document (head:amphtml only checks the pairing link on the canonical page). The AMP HTML spec mandates: <!doctype html>; <html amp> or <html ⚡>; <meta charset="utf-8"> as first child of head; <meta name="viewport" content="width=device-width">; a <link rel="canonical"> (pointing to the regular version, or itself if standalone); <script async src="https://cdn.ampproject.org/v0.js">; and both <style amp-boilerplate> and <noscript><style amp-boilerplate>. Google Search additionally requires 'Your AMP page must follow the AMP HTML specification'. Detects AMP via the html attribute and checks each mandatory element in the static DOM.
- Verdict logic: info: page is not an AMP document (no amp/⚡ attribute). ok: AMP page and all seven mandatory markup requirements present. error: AMP page missing any mandatory item (charset-first, viewport width=device-width, canonical link, v0.js runtime, either boilerplate style) - the document is invalid AMP per spec. warn: canonical link present but relative, or viewport lacks recommended minimum-scale=1/initial-scale=1.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://amp.dev/documentation/guides-and-tutorials/learn/spec/amphtml
  - https://developers.google.com/search/docs/crawling-indexing/amp
- Code hints: `src/rules/dom/ampRequiredMarkup.ts`, `src/rules/registry.ts`, `tests/rules/dom.ampRequiredMarkup.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-969: Implement rule dom:content-language-mismatch - Declared vs detected content language
- Epic: EPIC-904
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `dom:content-language-mismatch`.
- Expected: A result for `dom:content-language-mismatch` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `discover:primary-language` - it does not test this.
- SHOULD: Google states: 'Google uses the visible content of your page to determine its language. We don't use any code-level language information.' So when html[lang], Content-Language header, or the hreflang self-entry claim one language but the visible text is another, Google will classify by the text and the annotations mislead every other consumer. Uses chrome.i18n.detectLanguage on the rendered body text and compares the primary detected language against the language part of html[lang], the Content-Language response header, and the hreflang entry whose URL matches the canonical (self-entry).
- Verdict logic: ok: detected primary language (confidence reliable) matches the language subtag of html[lang] and the hreflang self-entry. warn: detected language differs from the hreflang self-entry or html[lang] language subtag (Google will follow the visible content, per spec quote), or Content-Language header contradicts both. info: detection unreliable (low confidence/short text) or no declarations to compare.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
  - https://developers.google.com/search/docs/specialty/international/localized-versions
- Code hints: `src/rules/dom/contentLanguageMismatch.ts`, `src/rules/registry.ts`, `tests/rules/dom.contentLanguageMismatch.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-970: Implement rule dom:intrusive-interstitial - Intrusive interstitial overlay
- Epic: EPIC-904
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `dom:intrusive-interstitial`.
- Expected: A result for `dom:intrusive-interstitial` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: Heuristically detects interstitials Google says make content less accessible ('Don't obscure the entire page with interstitials'; page-experience self-assessment: 'Do your pages avoid using intrusive interstitials?'): at analysis time, a fixed/sticky-position element covering a large share of the viewport above the main content, and/or body/html scroll-locked (overflow:hidden) on load. Whitelists small banners (Google explicitly permits banners taking 'only a small fraction of the screen') and notes the legal-obligation exceptions (cookie consent, age gates, login walls for private content). No existing rule covers this page-experience item.
- Verdict logic: error if a fixed/absolute overlay covers >=75% of the viewport at load AND body scroll is locked (full-page interstitial); warn if an overlay covers >=50% of the viewport or scroll is locked without such an overlay; ok if no overlay is detected or overlays cover a small fraction (<15% viewport height, banner-sized); always info-annotate that consent/age/login overlays required by law are acceptable per Google.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials
  - https://developers.google.com/search/docs/appearance/page-experience
- Code hints: `src/rules/dom/intrusiveInterstitial.ts`, `src/rules/registry.ts`, `tests/rules/dom.intrusiveInterstitial.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort L respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-971: Implement rule dom:visible-byline-date - Visible byline date on article pages
- Epic: EPIC-904
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `dom:visible-byline-date`.
- Expected: A result for `dom:visible-byline-date` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `discover:published-time` - it does not test this.
- SHOULD: Whether an article page shows 'a user-visible date... featured prominently' and labeled (spec examples: 'Posted Feb 4, 2019', 'Last updated: Feb 14, 2018'), which Google lists as the first best practice for influencing byline dates. Also applies the spec's constraint to 'minimize the presence of other dates on the page' by counting distinct date-like strings in the rendered main content. Runs only when the page declares Article/BlogPosting/NewsArticle structured data or an article og:type.
- Verdict logic: Not applicable (info) on non-article pages. warn if a CreativeWork with datePublished exists but no date string matching common formats (ISO, 'Feb 4, 2019', '04.02.2019', locale variants) is found in visible post-JS text within the first viewport-equivalent of main content. warn if > 5 distinct visible dates appear in main content (ambiguity risk per 'minimize the presence of other dates'). ok if exactly one clearly labeled published/updated date region is found. Never error - visibility is a best practice, not a hard requirement.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/publication-dates
- Code hints: `src/rules/dom/visibleBylineDate.ts`, `src/rules/registry.ts`, `tests/rules/dom.visibleBylineDate.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-972: Implement rule body:image-filenames - Descriptive image filenames
- Epic: EPIC-904
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `body:image-filenames`.
- Expected: A result for `body:image-filenames` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: Content image URL filenames against the Google Images doc's recommendation to use short descriptive names (its own good/bad examples: my-new-black-kitten.jpg vs IMG00023.JPG, image1.jpg, pic.gif, 1.jpg). Flags camera-default and generic patterns: /^(IMG|DSC|DSCN|PXL|GOPR)[-_]?\d+/i, /^(image|img|pic|photo|picture|untitled|screenshot)\d*$/i, /^\d+$/, /^[0-9a-f]{16,}$/ (hash-only names).
- Verdict logic: ok: no content image matches a generic-filename pattern. info: 1-2 generic filenames. warn: >=3 content images or >=50% of content images have generic filenames (counts are heuristics; the recommendation itself is verbatim spec). Skip data: URIs and tracking pixels (<=3px).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/appearance/google-images
- Code hints: `src/rules/body/imageFilenames.ts`, `src/rules/registry.ts`, `tests/rules/body.imageFilenames.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-973: Implement rule body:language-switcher-links - Crawlable links to language alternates
- Epic: EPIC-904
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `body:language-switcher-links`.
- Expected: A result for `body:language-switcher-links` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `body:internal-links` - it does not test this.
- SHOULD: Google 'does NOT attempt to vary the crawler source used for a single site in order to find any possible variations' - variations must be explicitly declared via hreflang, URL structure, or explicit links, and Google recommends 'using different URLs for each language version rather than using cookies or browser settings'. This rule checks whether the rendered body contains crawlable anchor hrefs pointing to the hreflang alternate URLs (a language switcher), versus JS-only/cookie-based switchers that leave alternates undiscoverable through links.
- Verdict logic: ok: for a page with an hreflang cluster, at least one body anchor href resolves to each (or most) alternate URLs. warn: cluster of 2+ alternates but zero body anchors point to any alternate (switcher likely cookie/JS-based, contrary to the different-URLs-with-explicit-links guidance). info: no hreflang cluster, or single-language page.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
  - https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages
- Code hints: `src/rules/body/languageSwitcherLinks.ts`, `src/rules/registry.ts`, `tests/rules/body.languageSwitcherLinks.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-974: Implement rule dom:amp-custom-css-size - AMP custom CSS byte budget
- Epic: EPIC-904
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `dom:amp-custom-css-size`.
- Expected: A result for `dom:amp-custom-css-size` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: The AMP HTML spec caps author CSS: <style amp-custom> plus inline styles may total at most 75,000 bytes (threshold from the amp.dev spec). Exceeding it makes the document invalid AMP. On pages detected as AMP, measures the UTF-8 byte length of the amp-custom stylesheet plus all inline style attributes and compares against the 75,000-byte limit.
- Verdict logic: info: not an AMP page, or AMP page with no amp-custom style. ok: combined custom CSS <= 75,000 bytes (report bytes used and % of budget). warn: >= 90% of the 75,000-byte budget (67,500+ bytes). error: > 75,000 bytes - invalid AMP per spec; also error if more than one <style amp-custom> element exists.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://amp.dev/documentation/guides-and-tutorials/learn/spec/amphtml
- Code hints: `src/rules/dom/ampCustomCssSize.ts`, `src/rules/registry.ts`, `tests/rules/dom.ampCustomCssSize.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-975: Implement rule dom:amp-disallowed-elements - AMP disallowed elements
- Epic: EPIC-904
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `dom:amp-disallowed-elements`.
- Expected: A result for `dom:amp-disallowed-elements` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: The AMP HTML spec prohibits specific tags in AMP documents: <img>, <picture>, <iframe>, <frame>, <frameset>, <base>, <object>, <param>, <applet>, <embed>, and <script> other than the runtime/component scripts and application/ld+json, application/json, text/plain types (they must be replaced by amp-img, amp-iframe, etc.). On pages detected as AMP, scans the static DOM for these forbidden elements - each one invalidates the document.
- Verdict logic: info: not an AMP page. ok: AMP page containing none of the prohibited elements and only permitted script types. error: any prohibited tag found, or a <script> whose src is not cdn.ampproject.org and whose type is not application/ld+json, application/json, or text/plain (list offending elements with DOM paths). warn: none - the spec makes these binary validity violations.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://amp.dev/documentation/guides-and-tutorials/learn/spec/amphtml
- Code hints: `src/rules/dom/ampDisallowedElements.ts`, `src/rules/registry.ts`, `tests/rules/dom.ampDisallowedElements.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-976: Implement rule psi:field-core-web-vitals - CrUX field Core Web Vitals (p75)
- Epic: EPIC-905
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `psi:field-core-web-vitals`.
- Expected: A result for `psi:field-core-web-vitals` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `psi:mobile` - it does not test this.
- SHOULD: Reads the PSI response's loadingExperience (CrUX field data, already captured in src/shared/schemas.ts but unused) and assesses the page's real-user 75th-percentile LCP, INP and CLS against the official Core Web Vitals thresholds (LCP 2.5s/4.0s, INP 200ms/500ms, CLS 0.1/0.25 per web.dev/articles/vitals). This is the actual page experience signal Google names in its self-assessment - field data, not the Lighthouse lab run the existing psi:mobile/psi:desktop rules report.
- Verdict logic: info if loadingExperience absent or origin-fallback only (no page-level CrUX data); ok if all three p75 metrics are Good (LCP<=2500ms AND INP<=200ms AND CLS<=0.1); warn if any metric is Needs Improvement (LCP<=4000ms, INP<=500ms, CLS<=0.25) and none Poor; error if any metric is Poor (LCP>4000ms OR INP>500ms OR CLS>0.25).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://web.dev/articles/vitals
  - https://developers.google.com/search/docs/appearance/page-experience
  - https://web.dev/articles/lcp
  - https://web.dev/articles/inp
  - https://web.dev/articles/cls
- Code hints: `src/rules/psi/fieldCoreWebVitals.ts`, `src/rules/registry.ts`, `tests/rules/psi.fieldCoreWebVitals.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-977: Implement rule psi:lab-lcp - Lab LCP (PSI Lighthouse)
- Epic: EPIC-905
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `psi:lab-lcp`.
- Expected: A result for `psi:lab-lcp` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `psi:mobile-fcp-tbt` - it does not test this.
- SHOULD: Verdicts on the Lighthouse lab largest-contentful-paint value from the PSI run against the official LCP thresholds (2.5s good, 4.0s poor per web.dev/articles/lcp; LCP is 25% of the Lighthouse 10 performance score). summarizePSI already computes lcpMs but psi:mobile-fcp-tbt only surfaces FCP/TBT as info with no LCP verdict.
- Verdict logic: ok if lab LCP <= 2500ms; warn if 2500ms < LCP <= 4000ms; error if LCP > 4000ms; info if the audit value is missing from the PSI response.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://web.dev/articles/lcp
  - https://web.dev/articles/optimize-lcp
  - https://developer.chrome.com/docs/lighthouse/performance/performance-scoring
- Code hints: `src/rules/psi/labLcp.ts`, `src/rules/registry.ts`, `tests/rules/psi.labLcp.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-978: Implement rule speed:lcp-lazy-load - LCP image lazy-loaded
- Epic: EPIC-905
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `speed:lcp-lazy-load`.
- Expected: A result for `speed:lcp-lazy-load` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `body:images-lazy` - it does not test this.
- SHOULD: Identifies the LCP element in the live page (buffered PerformanceObserver 'largest-contentful-paint' entries; fallback: largest above-the-fold <img>) and flags loading="lazy" on it. web.dev/articles/optimize-lcp: 'Never lazy-load your LCP image, as that will always lead to unnecessary resource load delay.' Distinct from body:images-lazy, which only reports images lacking a loading attribute and treats lazy-loading as desirable.
- Verdict logic: error if the identified LCP element is an <img> with loading="lazy"; warn if any image intersecting the initial viewport has loading="lazy"; ok if the LCP image is eager/undecorated; info if no LCP entry is observable (e.g. text-only LCP).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://web.dev/articles/optimize-lcp
  - https://web.dev/articles/lcp
- Code hints: `src/rules/speed/lcpLazyLoad.ts`, `src/rules/registry.ts`, `tests/rules/speed.lcpLazyLoad.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-979: Implement rule speed:ttfb - Time to First Byte
- Epic: EPIC-905
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `speed:ttfb`.
- Expected: A result for `speed:ttfb` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `speed:first-paint` - it does not test this.
- SHOULD: Measures main-document TTFB via the Navigation Timing responseStart value (includes redirect latency, DNS, connection/TLS setup, request time per web.dev/articles/ttfb) and assesses it against the official guidance: good <= 0.8s, poor > 1.8s. optimize-lcp additionally frames TTFB as ~40% of a good LCP budget. Requires adding responseStart/redirect timing to the navigationTiming enrichment (src/shared/page.enrich.ts); speed:first-paint measures render, not server response.
- Verdict logic: ok if responseStart <= 800ms; warn if 800ms < responseStart <= 1800ms; error if responseStart > 1800ms; info/runtime_error if the navigation entry is unavailable. Details should break out redirect time (redirectEnd-redirectStart) since redirects are inside TTFB.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://web.dev/articles/ttfb
  - https://web.dev/articles/optimize-lcp
- Code hints: `src/rules/speed/ttfb.ts`, `src/rules/registry.ts`, `tests/rules/speed.ttfb.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-980: Implement rule psi:lab-cls - Lab CLS (PSI Lighthouse)
- Epic: EPIC-905
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `psi:lab-cls`.
- Expected: A result for `psi:lab-cls` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `psi:mobile-fcp-tbt` - it does not test this.
- SHOULD: Verdicts on the Lighthouse lab cumulative-layout-shift value from the PSI run against the official CLS thresholds (0.1 good, 0.25 poor per web.dev/articles/cls; CLS is 25% of the Lighthouse 10 performance score). No existing rule issues a verdict on CLS although summarizePSI computes it.
- Verdict logic: ok if lab CLS <= 0.1; warn if 0.1 < CLS <= 0.25; error if CLS > 0.25; info if the audit value is missing.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://web.dev/articles/cls
  - https://web.dev/articles/optimize-cls
  - https://developer.chrome.com/docs/lighthouse/performance/performance-scoring
- Code hints: `src/rules/psi/labCls.ts`, `src/rules/registry.ts`, `tests/rules/psi.labCls.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-981: Implement rule speed:cls-observed - Observed layout shifts (live page)
- Epic: EPIC-905
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `speed:cls-observed`.
- Expected: A result for `speed:cls-observed` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `body:images-layout` - it does not test this.
- SHOULD: Sums buffered 'layout-shift' entries in the visited page, excluding entries with hadRecentInput (user-initiated shifts within 500ms of input are excluded per web.dev/articles/cls), grouped into session windows (shifts <1s apart, max 5s) and taking the largest burst, then assesses against 0.1/0.25. Reports the top shifting elements as evidence. body:images-layout tests one cause (unsized images); this measures the actual outcome.
- Verdict logic: ok if largest session-window score <= 0.1; warn if 0.1 < score <= 0.25; error if score > 0.25; info if the Layout Instability API is unavailable or no entries buffered. Message must state this is a lab observation of one load, not the CrUX p75.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://web.dev/articles/cls
  - https://web.dev/articles/optimize-cls
- Code hints: `src/rules/speed/clsObserved.ts`, `src/rules/registry.ts`, `tests/rules/speed.clsObserved.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-982: Implement rule speed:lcp-discoverability - LCP resource discoverable in HTML
- Epic: EPIC-905
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `speed:lcp-discoverability`.
- Expected: A result for `speed:lcp-discoverability` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `dom:client-side-rendering` - it does not test this.
- SHOULD: Tests whether the LCP image resource is discoverable from the initial HTML markup, per web.dev/articles/optimize-lcp: avoid images dynamically added via JavaScript, lazy-load libraries using data-src/data-srcset, and CSS background images without a rel=preload; ideal resource load delay is <10% of LCP. Uses the extension's static-vs-rendered DOM diff: the LCP image URL must appear in the static HTML (img src/srcset, <source>, or preload link). dom:client-side-rendering is a whole-page heuristic and does not target the LCP resource.
- Verdict logic: error if LCP is an image whose URL appears only in the post-JS DOM (JS-injected) and has no <link rel=preload>; warn if the LCP image uses data-src/data-srcset patterns or is a CSS background-image without preload; ok if the LCP image URL is present in static HTML or preloaded; info if LCP is text or unobservable.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://web.dev/articles/optimize-lcp
  - https://web.dev/articles/fetch-priority
- Code hints: `src/rules/speed/lcpDiscoverability.ts`, `src/rules/registry.ts`, `tests/rules/speed.lcpDiscoverability.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-983: Implement rule speed:lcp-fetchpriority - fetchpriority on LCP image
- Epic: EPIC-905
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `speed:lcp-fetchpriority`.
- Expected: A result for `speed:lcp-fetchpriority` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `speed:link-preload` - it does not test this.
- SHOULD: Checks whether the LCP image (or its rel=preload) carries fetchpriority="high", per web.dev/articles/fetch-priority ('Specify fetchpriority="high" to boost the priority of the LCP or other critical images'; browser default for images is Low priority) and optimize-lcp. Also validates that any fetchpriority attribute value on the page is one of high/low/auto. No existing rule touches fetchpriority; speed:link-preload only lists rel=preload links.
- Verdict logic: ok if LCP <img> or a matching <link rel=preload as=image> has fetchpriority="high"; info (recommendation) if LCP is an image without fetchpriority="high"; warn if any element carries an invalid fetchpriority value (not high|low|auto) or if a non-critical/offscreen resource is marked fetchpriority="high"; info if LCP is not an image.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://web.dev/articles/fetch-priority
  - https://web.dev/articles/optimize-lcp
- Code hints: `src/rules/speed/lcpFetchpriority.ts`, `src/rules/registry.ts`, `tests/rules/speed.lcpFetchpriority.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-984: Implement rule speed:lcp-observed - Observed LCP (live page)
- Epic: EPIC-905
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `speed:lcp-observed`.
- Expected: A result for `speed:lcp-observed` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `speed:first-paint` - it does not test this.
- SHOULD: Reads the buffered 'largest-contentful-paint' PerformanceObserver entries in the actual visited page (taking the most recent entry, as web.dev/articles/lcp specifies) and assesses it against the 2.5s/4.0s thresholds. Complements the PSI lab rule: runs instantly, without an API key, on the exact page state the user sees (including logged-in/personalized pages PSI cannot fetch). Reports the LCP element (dom path, size) as evidence; notes the lab-vs-field caveat and that background-tab loads must be discarded.
- Verdict logic: ok if latest LCP entry startTime <= 2500ms; warn if <= 4000ms; error if > 4000ms; info if no entry is buffered (page loaded in background tab, bfcache restore, or observer unavailable).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://web.dev/articles/lcp
  - https://web.dev/articles/vitals
- Code hints: `src/rules/speed/lcpObserved.ts`, `src/rules/registry.ts`, `tests/rules/speed.lcpObserved.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-985: Implement rule speed:asset-fingerprinting - Content-fingerprinted resource URLs
- Epic: EPIC-905
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `speed:asset-fingerprinting`.
- Expected: A result for `speed:asset-fingerprinting` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `speed:link-preload` - it does not test this.
- SHOULD: JavaScript SEO basics' caching section: Googlebot caches aggressively and may ignore normal cache headers, so sites should 'use content fingerprinting' (hashed filenames like main.2bb85551.js) to ensure Googlebot's renderer fetches fresh JS/CSS after deploys; stale cached bundles can render outdated content into the index. Checks same-origin script and stylesheet URLs for a content-hash/version token in the filename, cross-referenced with their Cache-Control lifetimes from observed page resources.
- Verdict logic: warn: >=1 same-origin render-critical script/CSS served with Cache-Control max-age > 30 days and no hash/version token (>=6 hex chars or explicit ?v=) in its URL - Googlebot's web rendering service may execute a stale copy. info: assets unversioned but short-cached. ok: long-cached assets all carry content fingerprints.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Code hints: `src/rules/speed/assetFingerprinting.ts`, `src/rules/registry.ts`, `tests/rules/speed.assetFingerprinting.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-986: Implement rule http:cache-control-validity - Cache-Control presence and directive validity
- Epic: EPIC-906
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `http:cache-control-validity`.
- Expected: A result for `http:cache-control-validity` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `http:cache-delivery` - it does not test this.
- SHOULD: Parses the main document's Cache-Control response header: presence, recognized directives, and self-contradictory combinations. RFC 9111 Section 4.2.2 says caches fall back to heuristic freshness when no explicit expiration is present, and MDN documents the classic misconfigurations: no-store combined with max-age (only no-store applies), the no-cache-prevents-caching misconception, and conflicting piles like 'private, no-cache, no-store, max-age=0'. Unknown directives are silently ignored by caches, so typos like 'max-age = 3600' or 'maxage=3600' quietly disable caching.
- Verdict logic: ok: header present, all directives recognized (max-age, s-maxage, no-cache, no-store, private, public, must-revalidate, proxy-revalidate, immutable, no-transform, stale-while-revalidate, stale-if-error, must-understand), no contradictions. warn: header absent (heuristic caching applies, RFC 9111 4.2.2) or unknown/misspelled directive token found. error: contradictory combination such as no-store together with max-age>0, public, or immutable; or no-cache together with immutable.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
- Code hints: `src/rules/http/cacheControlValidity.ts`, `src/rules/registry.ts`, `tests/rules/http.cacheControlValidity.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-987: Implement rule http:hsts-validity - HSTS max-age and preload validity
- Epic: EPIC-906
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `http:hsts-validity`.
- Expected: A result for `http:hsts-validity` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `http:hsts` - it does not test this.
- SHOULD: Value-level validation the existing http:hsts rule skips (it currently reports 'ok' for any non-empty header, including max-age=0). Per MDN: max-age=0 disables HSTS and removes the host from the browser's HSTS list; preload list eligibility requires max-age of at least 31536000 seconds (1 year) plus includeSubDomains plus the preload token, with 63072000 (2 years) the recommended value; and the header only takes effect over HTTPS.
- Verdict logic: ok: max-age >= 31536000; if the preload token is present, includeSubDomains is also present. warn: 0 < max-age < 31536000 (below the 1-year preload minimum, weak policy), or preload token present while max-age < 31536000 or includeSubDomains missing (preload requirements unmet). error: max-age=0 (HSTS actively disabled) or max-age directive missing/unparseable.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security
- Code hints: `src/rules/http/hstsValidity.ts`, `src/rules/registry.ts`, `tests/rules/http.hstsValidity.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-988: Implement rule http:locale-redirect - Automatic locale redirect
- Epic: EPIC-906
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `http:locale-redirect`.
- Expected: A result for `http:locale-redirect` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `http:redirect-canonical-chain` - it does not test this.
- SHOULD: Google says: 'Avoid automatically redirecting users from one language version of a site to a different language version' and 'Don't use IP analysis to adapt your content'. Googlebot crawls mostly from US IPs without Accept-Language, so locale redirects can hide entire language versions ('Google might not crawl, index, or rank all your content for different locales'). Using the observed redirect chain, this rule detects hops where origin/path changes look locale-shaped: a hop from a URL in the page's hreflang cluster to a different cluster member, or a path/subdomain segment swap matching language patterns (/en/ to /de/, en. to de., ccTLD switch).
- Verdict logic: ok: no redirect hop crosses locale variants. error: observed redirect goes from one hreflang cluster member to another (the exact auto-language-redirect the spec says to avoid). warn: redirect hop swaps a locale-looking path segment/subdomain/ccTLD not confirmable via the cluster, or the root URL redirects to a localized URL without an x-default entry covering the root. info: no redirects observed.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
  - https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages
- Code hints: `src/rules/http/localeRedirect.ts`, `src/rules/registry.ts`, `tests/rules/http.localeRedirect.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-989: Implement rule http:revalidation-probe - 304 Not Modified revalidation probe
- Epic: EPIC-906
- Type: RULE
- Severity: S2
- Priority: P1
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `http:revalidation-probe`.
- Expected: A result for `http:revalidation-probe` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `http:soft-404` - it does not test this.
- SHOULD: Actively tests whether the server honors conditional requests: re-fetches the same-origin page URL (bounded fetch, like the existing soft-404 probe) sending If-None-Match with the observed ETag and/or If-Modified-Since with the observed Last-Modified (RFC 9111 Section 4.3.1 semantics) and checks for a 304 response. Google's HTTP status documentation lists 304 as 'signals unchanged content' with no indexing effect - servers that always answer 200 with the full body waste crawl budget on every recrawl.
- Verdict logic: ok: probe with the page's own validator returns 304. warn: validators are advertised (ETag/Last-Modified present) but the conditional probe returns 200 with a full body (validators are decorative), or the returned ETag differs on every request (unstable validator). info: no validators advertised, probe skipped. error: never (probe may be blocked by network policy; report 'not testable' instead).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/crawling-indexing/http-network-errors
  - https://www.rfc-editor.org/rfc/rfc9111.html#section-4.3.1
  - https://www.rfc-editor.org/rfc/rfc9110.html
- Code hints: `src/rules/http/revalidationProbe.ts`, `src/rules/registry.ts`, `tests/rules/http.revalidationProbe.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-990: Implement rule http:asset-caching - Subresource cache lifetimes
- Epic: EPIC-906
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `http:asset-caching`.
- Expected: A result for `http:asset-caching` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: Inspects same-origin static subresources (scripts, stylesheets, images from the captured resource list, headers via bounded same-origin HEAD probes like http:gzip already performs) for explicit freshness. RFC 9111 Section 4.2.2 forbids heuristics only when explicit expiration exists and describes the typical heuristic as a mere 10% of the Last-Modified interval - so assets without max-age/s-maxage/Expires get short, unpredictable lifetimes. MDN's recommended pattern for versioned static assets is 'max-age=31536000, immutable'.
- Verdict logic: ok: all sampled static same-origin assets have explicit freshness (max-age, s-maxage, or valid Expires). warn: any sampled asset has no explicit freshness (heuristic caching, RFC 9111 4.2.2), or fingerprinted/versioned assets (hash in filename or version query) have max-age < 31536000 without immutable. info: sampling capped (report how many of N were probed).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://www.rfc-editor.org/rfc/rfc9111.html#section-4.2.2
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
- Code hints: `src/rules/http/assetCaching.ts`, `src/rules/registry.ts`, `tests/rules/http.assetCaching.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort L respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-991: Implement rule http:bfcache-blockers - Back/forward cache blockers
- Epic: EPIC-906
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `http:bfcache-blockers`.
- Expected: A result for `http:bfcache-blockers` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `http:cache-delivery` - it does not test this.
- SHOULD: Detects page-level back/forward-cache blockers, which hurt real-user Core Web Vitals on back/forward navigations: Cache-Control: no-store on the main document (historically makes the page bfcache-ineligible per web.dev/articles/bfcache, which says to reserve it for sensitive logged-in content), and a set window.onunload/document unload handler property ('never use the unload event' - use pagehide). http:cache-delivery only reads the Age header for CDN freshness; no rule evaluates bfcache eligibility.
- Verdict logic: warn if the main document response has Cache-Control containing no-store; warn if window.onunload !== null in the live page; ok if neither is present; details list detected blockers and link the DevTools Application > Back/forward cache test. No error level - these are eligibility signals, not spec violations.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://web.dev/articles/bfcache
  - https://web.dev/articles/optimize-cls
- Code hints: `src/rules/http/bfcacheBlockers.ts`, `src/rules/registry.ts`, `tests/rules/http.bfcacheBlockers.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-992: Implement rule http:content-type - Content-Type header validity
- Epic: EPIC-906
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `http:content-type`.
- Expected: A result for `http:content-type` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `http:has-header` - it does not test this.
- SHOULD: Per indexable-file-types, 'The file type is determined by the Content-Type HTTP header returned when Google crawls the file' - a missing or wrong Content-Type forces Google to guess from the extension or re-parse. Checks the main document's Content-Type header: present, a type Google indexes, consistent with the actual payload (HTML document served as text/plain or application/octet-stream is a real-world misconfiguration), and carrying a charset parameter consistent with the meta charset. The existing http:has-header is a generic configurable presence check; head:meta-charset only reads the meta tag.
- Verdict logic: error: Content-Type header absent on the main document, or payload is clearly HTML while the header declares a non-HTML type (text/plain, application/octet-stream). warn: charset parameter missing, or charset conflicts with the document's meta charset declaration. ok: text/html (or the correct type for the resource) with a matching charset.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/crawling-indexing/indexable-file-types
- Code hints: `src/rules/http/contentType.ts`, `src/rules/registry.ts`, `tests/rules/http.contentType.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-993: Implement rule http:etag-validator - ETag validator presence and syntax
- Epic: EPIC-906
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `http:etag-validator`.
- Expected: A result for `http:etag-validator` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `none` - it does not test this.
- SHOULD: Checks whether the main document carries an ETag (RFC 9110 Section 8.8.3), whether it is strong or weak (W/ prefix), and whether the value is a properly double-quoted opaque string as the syntax requires. An ETag enables If-None-Match revalidation and 304 Not Modified responses, which Google's HTTP documentation says signal unchanged content without re-downloading the body - directly relevant to crawl efficiency on frequently recrawled pages.
- Verdict logic: ok: ETag present and syntactically valid (optionally weak). info: no ETag but Last-Modified present (fallback validator available). warn: ETag value not enclosed in double quotes (invalid syntax many CDNs then ignore), or no ETag and no Last-Modified (no revalidation possible, every recrawl fetches the full body).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.3
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag
- Code hints: `src/rules/http/etagValidator.ts`, `src/rules/registry.ts`, `tests/rules/http.etagValidator.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-994: Implement rule http:expires-header - Expires header validity and Cache-Control conflict
- Epic: EPIC-906
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `http:expires-header`.
- Expected: A result for `http:expires-header` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `http:cache-delivery` - it does not test this.
- SHOULD: Validates the Expires header of the main document: HTTP-date format (IMF-fixdate, GMT), whether the value is invalid (RFC 9111 Section 5.3: recipients MUST interpret invalid date formats, especially the value '0', as a time in the past), and whether it is dead weight because RFC 9111 Section 5.3 requires recipients to ignore Expires entirely when Cache-Control max-age is present. Surfaces sites still shipping legacy 'Expires: 0' or 1990s dates alongside modern Cache-Control.
- Verdict logic: ok: no Expires header, or valid IMF-fixdate with no max-age/s-maxage present. info: Expires present alongside Cache-Control max-age (ignored per RFC 9111 5.3, redundant header). warn: Expires value is an invalid date format or literal '0' (treated as already expired) while no Cache-Control freshness directive exists, or Expires date disagrees with max-age-derived expiry by more than the max-age value itself.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://www.rfc-editor.org/rfc/rfc9111.html#section-5.3
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Expires
- Code hints: `src/rules/http/expiresHeader.ts`, `src/rules/registry.ts`, `tests/rules/http.expiresHeader.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-995: Implement rule http:frame-embedding-policy - X-Frame-Options / frame-ancestors policy
- Epic: EPIC-906
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `http:frame-embedding-policy`.
- Expected: A result for `http:frame-embedding-policy` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `http:security-headers` - it does not test this.
- SHOULD: Checks clickjacking protection, which http:security-headers omits entirely (X-Frame-Options is not in its list and it never parses CSP). Valid X-Frame-Options values are DENY and SAMEORIGIN; ALLOW-FROM is obsolete and causes modern browsers to ignore the whole header per MDN. The modern replacement is the CSP frame-ancestors directive, which MDN also notes is ignored when CSP is delivered via meta tag - so it only counts when present in the HTTP header.
- Verdict logic: ok: CSP header (not meta) contains frame-ancestors, or X-Frame-Options is exactly DENY or SAMEORIGIN. warn: neither mechanism present (page embeddable anywhere), or both present with contradictory policies. error: X-Frame-Options uses obsolete ALLOW-FROM or any invalid value (header ignored by modern browsers, protection silently off).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
- Code hints: `src/rules/http/frameEmbeddingPolicy.ts`, `src/rules/registry.ts`, `tests/rules/http.frameEmbeddingPolicy.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-996: Implement rule http:hreflang-link-header - Hreflang via HTTP Link header
- Epic: EPIC-906
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `http:hreflang-link-header`.
- Expected: A result for `http:hreflang-link-header` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `http:link-header` - it does not test this.
- SHOULD: Google accepts hreflang in the HTTP response header: Link: <url>; rel="alternate"; hreflang="lang_code". The extension captures main-document response headers, but head-hreflang and all validators only read the DOM, so header-delivered clusters are invisible today and a site using BOTH methods with diverging sets is never caught. Parses the Link header for rel=alternate+hreflang triples, validates code format and absolute URLs, and diffs the header cluster against the HTML cluster.
- Verdict logic: info: hreflang found only in Link header (report cluster; feeds the same validators). ok: header and HTML clusters absent, or both present and identical. warn: both methods used with different code-to-URL sets (conflicting signals across delivery methods), or header hreflang URL not fully-qualified. error: header entry has malformed hreflang code per the ISO format rules.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/specialty/international/localized-versions
- Code hints: `src/rules/http/hreflangLinkHeader.ts`, `src/rules/registry.ts`, `tests/rules/http.hreflangLinkHeader.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-997: Implement rule http:last-modified - Last-Modified header validity
- Epic: EPIC-906
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `http:last-modified`.
- Expected: A result for `http:last-modified` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `discover:published-time` - it does not test this.
- SHOULD: Checks the main document's Last-Modified header: presence, valid IMF-fixdate format ('Wed, 21 Oct 2015 07:28:00 GMT', GMT only, case-sensitive day/month names), and plausibility (not in the future relative to the Date header). MDN explicitly notes crawlers adjust crawl frequency based on this header and that it serves as the fallback validator via If-Modified-Since when ETags are unavailable. Distinct from discover:published-time, which reads article metadata, not the HTTP validator.
- Verdict logic: ok: valid IMF-fixdate, not later than the response Date. info: header absent but ETag present. warn: date in the future or malformed format (local time zone, missing GMT, numeric month), or absent together with a missing ETag. error: never (advisory validator).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.2
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Last-Modified
- Code hints: `src/rules/http/lastModified.ts`, `src/rules/registry.ts`, `tests/rules/http.lastModified.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-998: Implement rule http:nosniff-validity - X-Content-Type-Options value validation
- Epic: EPIC-906
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `http:nosniff-validity`.
- Expected: A result for `http:nosniff-validity` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `http:security-headers` - it does not test this.
- SHOULD: Validates the value of X-Content-Type-Options, not just its presence (which http:security-headers already covers): 'nosniff' is the only valid value per MDN, and a misspelled or decorated value ('no-sniff', 'nosniff;') is silently ignored by browsers, leaving MIME sniffing enabled and script/style MIME enforcement off while the header's presence gives a false sense of protection.
- Verdict logic: ok: header value is exactly 'nosniff' after trimming (case-insensitive). warn: header present with any other value (browser ignores it, protection not applied). info: header absent (presence itself is scored by http:security-headers, so this rule stays silent to avoid double-reporting).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options
- Code hints: `src/rules/http/nosniffValidity.ts`, `src/rules/registry.ts`, `tests/rules/http.nosniffValidity.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-999: Implement rule http:vary-validity - Vary header cacheability impact
- Epic: EPIC-906
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `http:vary-validity`.
- Expected: A result for `http:vary-validity` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `http:vary-user-agent` - it does not test this.
- SHOULD: Evaluates the full Vary header value beyond the existing User-Agent-only check: RFC 9111 Section 4.1 says a stored response with 'Vary: *' always fails to match, making the page effectively uncacheable by any shared cache or CDN; MDN flags Vary: Cookie as cache-fragmenting (one entry per unique cookie combination) and warns against long header lists that shred hit rates. Also verifies each listed token is a plausible request header name.
- Verdict logic: ok: no Vary, or Vary limited to content-negotiation headers (Accept-Encoding, Accept, Accept-Language). warn: Vary includes Cookie, Authorization, or more than 3 header names (cache fragmentation), or contains a token that is not a valid header name. error: Vary: * on a 200 HTML response (response can never be served from a shared cache per RFC 9111 4.1).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://www.rfc-editor.org/rfc/rfc9111.html#section-4.1
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary
- Code hints: `src/rules/http/varyValidity.ts`, `src/rules/registry.ts`, `tests/rules/http.varyValidity.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-1000: Implement rule http:xss-protection-deprecated - Deprecated X-XSS-Protection header present
- Epic: EPIC-906
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `http:xss-protection-deprecated`.
- Expected: A result for `http:xss-protection-deprecated` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `http:security-headers` - it does not test this.
- SHOULD: Flags the deprecated, non-standard X-XSS-Protection header when present. MDN documents that the legacy XSS auditor it controlled can itself introduce XSS vulnerabilities in otherwise safe pages (filter-induced script removal changing program logic) and recommends removing the header in favor of a strong Content-Security-Policy without unsafe-inline. Presence signals stale security configuration worth surfacing in an audit.
- Verdict logic: ok: header absent. warn: header present with value '1' or '1; mode=block' (deprecated mechanism, potential vulnerability vector, remove and rely on CSP). info: header present with value '0' (explicit disable - harmless but removable legacy).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-XSS-Protection
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
- Code hints: `src/rules/http/xssProtectionDeprecated.ts`, `src/rules/registry.ts`, `tests/rules/http.xssProtectionDeprecated.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-1001: Implement rule http:csp-strength - CSP policy strength
- Epic: EPIC-906
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `http:csp-strength`.
- Expected: A result for `http:csp-strength` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `http:security-headers` - it does not test this.
- SHOULD: Parses the Content-Security-Policy value that http:security-headers only tests for presence: MDN flags 'unsafe-inline' and 'unsafe-eval' in script-src as defeating much of CSP's purpose and wildcard (*) sources as minimal protection, recommends nonces/hashes and 'strict-dynamic' instead, and distinguishes Content-Security-Policy-Report-Only, which reports but never blocks - a report-only header alone is not an enforced policy.
- Verdict logic: ok: enforcing CSP present whose script-src (or default-src fallback) avoids 'unsafe-inline', 'unsafe-eval', and bare '*', or uses nonces/hashes/'strict-dynamic'. warn: enforcing CSP contains 'unsafe-inline' or 'unsafe-eval' in script handling, or wildcard source, or only a Report-Only header exists (nothing enforced). info: no CSP at all (presence already scored by http:security-headers).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
- Code hints: `src/rules/http/cspStrength.ts`, `src/rules/registry.ts`, `tests/rules/http.cspStrength.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort M respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-1002: Implement rule http:date-header - Date header presence and clock sanity
- Epic: EPIC-906
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `http:date-header`.
- Expected: A result for `http:date-header` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `http:headers-present` - it does not test this.
- SHOULD: RFC 9110 Section 6.6.1 requires an origin server to generate a Date header in responses. RFC 9111 Section 4.2 bases every freshness calculation (Expires minus Date, age math) on it and forbids local time zones from influencing age computation. Checks presence, IMF-fixdate validity, and skew against the client clock at response time - a server clock minutes or hours off silently shortens or extends every cache lifetime and corrupts Age/Expires interpretation.
- Verdict logic: ok: Date present, valid IMF-fixdate, absolute skew vs. client clock under 60 seconds. warn: skew between 60 seconds and 1 hour (freshness math distorted), or malformed date. error: Date header absent on an origin 200 response (violates RFC 9110 6.6.1 MUST) or skew over 1 hour.
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `standard`.
- Spec references:
  - https://www.rfc-editor.org/rfc/rfc9110.html#section-6.6.1
  - https://www.rfc-editor.org/rfc/rfc9111.html#section-4.2
- Code hints: `src/rules/http/dateHeader.ts`, `src/rules/registry.ts`, `tests/rules/http.dateHeader.test.ts`; declare `meta: { provenance: 'standard', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-1003: Implement rule http:retry-after - Retry-After on 429/503 responses
- Epic: EPIC-906
- Type: RULE
- Severity: S4
- Priority: P3
- Persona: P1
- Scenario: Auditing a page where this signal matters and finding no coverage in the side panel.
- Steps:
  1. Run the audit on a page exhibiting the condition below.
  2. Search results for `http:retry-after`.
- Expected: A result for `http:retry-after` with the verdict logic below and a spec reference link.
- Actual: No rule covers this check.
- IS: Nearest existing rule: `http-status` - it does not test this.
- SHOULD: Conditional rule that activates only when the observed main-document status (or a hop in the observed redirect chain) is 429 or 503. Google treats 429 as a server error and slows crawling proportionally on 5xx; RFC 9110 Section 10.2.3 defines Retry-After (HTTP-date or delay-seconds) as the mechanism to tell clients when to come back. Validates presence and format so a temporary outage communicates a recovery time instead of an open-ended crawl backoff.
- Verdict logic: ok: status is not 429/503 (rule silent), or 429/503 carries a valid Retry-After (non-negative delay-seconds or valid HTTP-date in the future). warn: 429/503 without Retry-After, or Retry-After value malformed or pointing more than 24 hours out (prolonged deindexing risk since Google eventually drops persistently erroring URLs).
- Reasoning: Spec-backed gap found by the 2026-09-02 official-docs sweep; provenance `google`.
- Spec references:
  - https://developers.google.com/search/docs/crawling-indexing/http-network-errors
  - https://www.rfc-editor.org/rfc/rfc9110.html#section-10.2.3
- Code hints: `src/rules/http/retryAfter.ts`, `src/rules/registry.ts`, `tests/rules/http.retryAfter.test.ts`; declare `meta: { provenance: 'google', references: [...] }` (see RUNBOOK "Add a new rule").
- Acceptance criteria:
  - Rule registered with meta (static `registry.meta.test.ts` stays green) and effort S respected in planning.
  - Verdict logic matches the cited spec passages; test asserts each verdict branch.
  - `npx tsx scripts/export-rules.ts` regenerated.

### TCK-1004: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: Google retired all robots.txt handling of unsupported/unpublished rules (noindex, nofollow, crawl-delay) effective September 1, 2019 - existing robots.txt rules (robots:complexity, robots-exists) should never present these directives as effective, and the proposed robots:syntax-validity rule must flag them as ignored: https://developers.google.com/search/blog/2019/07/a-note-on-unsupported-rules-in-robotstxt
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1005: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: Google deprecated the unauthenticated sitemaps 'ping' REST endpoint (announced June 2023, endpoint stopped functioning 6 months later, now returns 404) - sitemap discovery/submission advice in robots:sitemap-reference and any new sitemap rules must only recommend robots.txt Sitemap lines and Search Console, never pinging: https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1006: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: Google documents that it ignores the <priority> and <changefreq> sitemap tags entirely (only <lastmod> is used, and only 'if it's consistently and verifiably accurate') - no rule should ever recommend setting priority/changefreq: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1007: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: Google announced completion of mobile-first indexing in October 2023 ('Mobile-first indexing has landed', confirmed via the Search Central blog archive) - existing rules head:rel-alternate-media and http:common-mobile-setup should treat separate-mobile-URL setups as legacy since indexing now uses the mobile crawler for all sites: https://developers.google.com/search/blog/2023/10/mobile-first-is-here
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1008: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: schema:website-searchaction - the sitelinks search box feature is retired: Google removed the feature from Search results (Oct 2024) and deleted its structured-data documentation on Nov 29, 2024, archiving the nositelinkssearchbox robots rule; the rule should be downgraded to informational/legacy. https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox and https://developers.google.com/search/blog/2024/10/sitelinks-search-box
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1009: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: schema:faq - FAQ rich results were first restricted to 'well-known, authoritative government and health websites' (Aug 2023) and per the current doc no longer appear in Google Search starting May 7, 2026, with the documentation removed in June 2026; the rule should stop implying a rich-result benefit. https://developers.google.com/search/docs/appearance/structured-data/faqpage and https://developers.google.com/search/blog/2023/08/howto-faq-changes
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1010: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: schema:howto - HowTo rich results are 'no longer shown in search results, on both desktop and mobile devices'; Google removed the How-to structured data documentation on Sept 14, 2023; the rule should stop implying a rich-result benefit. https://developers.google.com/search/docs/appearance/structured-data/how-to and https://developers.google.com/search/blog/2023/08/howto-faq-changes
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1011: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: google:amp-cache-url - Google removed AMP Cache, AMP viewer and signed-exchange references from its AMP documentation on 2026-07-01 ('Simplifying our AMP documentation'); the rule tests a retired delivery mechanism and its verdict should be downgraded to informational/legacy. https://developers.google.com/search/updates
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1012: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: head:amphtml - same 2026-07-01 AMP doc simplification; additionally the Discover doc now names max-image-preview:large as the standing alternative to AMP for large previews, so amphtml absence should never be more than info. https://developers.google.com/search/updates and https://developers.google.com/search/docs/appearance/google-discover
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1013: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: schema:video - video indexing is now restricted to watch pages where the video is the page's main purpose ('the indexed watch page must be performing well... video must be embedded and not hidden'); VideoObject on pages with secondary/embedded-aside videos no longer earns video features, so the rule's ok verdict overpromises on non-watch pages. https://developers.google.com/search/docs/appearance/video
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1014: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: schema:video (video carousel) - Google removed video carousel guidance on 2024-04-17 as it 'wasn't useful for the ecosystem at scale'; no carousel-specific messaging should remain in video rule copy. https://developers.google.com/search/updates
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1015: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: schema:howto - How-to rich results retired 2023-09-14 ('no longer shown in search results, on both desktop and mobile devices'); the existing rule validates markup for a dead rich result and should say so. https://developers.google.com/search/updates
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1016: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: schema:faq - FAQ rich results were restricted to well-known government/health sites on 2023-09-14 and the FAQ rich result documentation was removed entirely on 2026-06-15 ('no longer shown in Google Search results'); the rule's ok verdict should note there is no FAQ rich result to win. https://developers.google.com/search/updates
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1017: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: discover:og-image-large - implementation detail: its reference URL https://developers.google.com/search/docs/appearance/google-discover/appearance is no longer the canonical location; the live Discover doc (which carries the 1200px / 300,000-total-pixels requirements) is https://developers.google.com/search/docs/appearance/google-discover
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1018: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: schema:faq - FAQ rich results are fully deprecated: changelog entry May 8, 2026 'Added a deprecation notice to the FAQ rich result documentation' (previously Aug 2023 limited to well-known authoritative government and health websites); the rule should warn that FAQPage markup no longer yields a rich result. https://developers.google.com/search/updates and https://developers.google.com/search/docs/appearance/structured-data/faqpage
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1019: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: schema:howto - HowTo rich results retired Sep 14, 2023 ('Removed the How-to structured data documentation as this rich result is no longer shown', desktop and mobile); the rule still validates HowTo as if eligible and src/shared/structured.ts docs() links the deleted /how-to page. https://developers.google.com/search/updates
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1020: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: schema:website-searchaction - Sitelinks search box discontinued: 'The sitelinks search box feature is no longer available in Google Search results' (Oct 2024 announcement; docs removed Nov 29, 2024). The rule validates SearchAction target/{search_term_string} for a feature that no longer exists, and docs() maps 'website' to the removed sitelinks-searchbox URL. https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox and https://developers.google.com/search/updates
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1021: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: General (affects future rule scoping, per changelog): Course info removed Sep 9, 2025; Practice problems deprecated Nov 5, 2025; Special announcements deprecated Apr 23, 2025; Home activities removed Jun 11, 2024; Estimated salary, Learning video and Vehicle listing carry upcoming-change banners since Jun 12, 2025 - none of these should get new rules. https://developers.google.com/search/updates
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1022: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: FID (First Input Delay) is retired: 'First Input Delay (FID) is no longer a Core Web Vital, and has been replaced by the Interaction to Next Paint (INP) metric', support ended 2024-09-09 - any new field-CWV rule must read INP, never FID, from PSI loadingExperience (no existing rule uses FID; keep it that way) - https://web.dev/articles/fid
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1023: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: speed:first-paint verdicts on First Paint (700ms/1400ms thresholds), a metric that is not a Core Web Vital and not part of the Lighthouse 10 performance score (which weights FCP 10%, Speed Index 10%, LCP 25%, TBT 30%, CLS 25%); the thresholds are invented, not spec-backed - consider migrating the rule to FCP/LCP with official thresholds - https://developer.chrome.com/docs/lighthouse/performance/performance-scoring and https://web.dev/articles/vitals
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1024: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: Google's current page experience self-assessment contains no AMP item at all (it lists Core Web Vitals, HTTPS, mobile display, ad amount, intrusive interstitials, content distinction) - head:amphtml and google:amp-cache-url messaging must not imply any page-experience or ranking benefit from AMP - https://developers.google.com/search/docs/appearance/page-experience
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1025: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: The page experience doc states 'there is no single signal' used for ranking - rule copy for psi:mobile/psi:desktop should avoid presenting the Lighthouse performance score as a direct ranking signal; the assessed signal is field Core Web Vitals at the 75th percentile - https://developers.google.com/search/docs/appearance/page-experience and https://web.dev/articles/vitals
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1026: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: X-XSS-Protection is deprecated and non-standard per MDN and can itself create XSS vulnerabilities; no existing rule (http:security-headers included) flags its presence as legacy - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-XSS-Protection
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1027: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: X-Frame-Options ALLOW-FROM is obsolete and causes modern browsers to ignore the entire header; no existing rule detects this silently-dead configuration - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1028: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: Content-Encoding 'compress' is abandoned (patent-era LZW, not used by browsers) per MDN; the existing http:gzip rule already labels it obsolete, consistent with current documentation - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Encoding
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1029: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: RFC 9111 Section 5.3 requires recipients to ignore Expires whenever Cache-Control max-age is present; any future rule reading Expires as authoritative must apply this precedence (no existing rule currently parses Expires) - https://www.rfc-editor.org/rfc/rfc9111.html#section-5.3
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1030: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: The existing http:hsts rule returns 'ok' for Strict-Transport-Security: max-age=0, but per MDN max-age=0 actively disables HSTS and removes the host from the browser's HSTS list - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1031: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: google:amp-cache-url is obsolete: per the July 1, 2026 entry on https://developers.google.com/search/updates, Google Search 'simplified our AMP documentation by removing outdated references to the AMP viewer, AMP Cache, and signed exchange' and 'will now take users directly to the publisher's AMP host pages' - deriving cdn.ampproject.org/c/ cache URLs no longer reflects how Google serves AMP, and the rule's reference doc (developers.google.com/amp/cache/overview) is part of the removed guidance.
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1032: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: Signed exchanges for AMP are no longer used by Google Search: https://developers.google.com/search/docs/appearance/signed-exchange now carries the July 1, 2026 notice that publishers 'no longer need to update the AMP cache or configure signed exchanges' - any future SXG/AMP-cache check ideas should be dropped, and google:amp-cache-url messaging must not imply Google serves from the cache.
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1033: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: head:amphtml points its SPEC reference at https://developers.google.com/search/docs/appearance/amp, but current AMP-in-Search guidance lives at https://developers.google.com/search/docs/crawling-indexing/amp (fetched; it contains the live requirements) and was simplified in the July 1, 2026 update - the rule's reference should be updated and its messaging reframed: AMP content 'will continue to rank just like any other web page' (https://developers.google.com/search/updates), so a missing amphtml link is purely informational, never a deficiency.
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1034: Deprecation review
- Epic: EPIC-907
- Type: REVIEW
- Severity: S3
- Priority: P2
- Persona: P2
- Finding: No deprecations affect the hreflang rules: the localized-versions spec (https://developers.google.com/search/docs/specialty/international/localized-versions) still documents all three delivery methods (HTML link, HTTP header, sitemap), bidirectional linking, and x-default; the most recent hreflang doc change per https://developers.google.com/search/updates is a June 2024 clarification of link-tag attributes (the basis for the proposed head:hreflang-combined-attributes rule).
- Acceptance criteria:
  - Affected rule copy/verdicts no longer imply the retired feature; references point at the live deprecation notice.

### TCK-1035: Merge the Article-presence pair (APPROVED by Franz 2026-09-02)
- Epic: EPIC-908
- Type: RULE
- Severity: S3
- Priority: P2
- Persona: P1
- IS: `discover:article-structured-data` and `schema:article:present` run the same JSON-LD Article presence check; the discover one misses BlogPosting (false warns).
- SHOULD: `schema:article:present` (incl. BlogPosting) becomes the single Article-presence rule; `discover:article-structured-data` keeps only its unique Discover checks or is retired into it.
- Reasoning: The ONLY merge Franz approved at the 2026-09-02 checkpoint. All other pairs stay: robots cluster kept (parsing gaps fixed instead), HTTP/PSI trio kept and upgraded, debug:page-summary kept, franz-provenance list confirmed.
- Acceptance criteria:
  - One Article-presence verdict per page; BlogPosting counted; no other rule removed.
