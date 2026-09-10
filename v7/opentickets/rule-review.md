# Complete rule review

Scope: all 130 registered rules. Review each rule before marking it complete. Commit each rule fix separately.

Baseline: a complete headless run of https://www.example.com/g/286584 redirected to /g/597748; 128 visible results. Debug-only rules remain explicitly in this inventory. Successful authenticated GSC states require fixture review in addition to the unauthenticated live result.

| Rule | Baseline result | Review status | Commit |
| --- | --- | --- | --- |
| `http:alt-svc-other` | info | Reviewed: advertised IDs, clear and unparsed states retain the full header; added protocol names and advertisement-versus-usage distinction; existing quic/clear fixtures retained | `0a0282e` |
| `google:amp-cache-url` | info | Pending | |
| `head:amphtml` | info | Pending | |
| `discover:article-structured-data` | warn | Fixed: optional markup, BlogPosting coverage, exact matching script, incomplete parse explanation; absence/presence/malformed copy tests | `4563095` |
| `discover:author` | warn | Fixed: all named authors and exact sources, optional metadata, unresolved identity limits; multi-author/absent/malformed copy tests | `cf79561` |
| `speed:blocking-scripts` | warn | Reviewed: complete script URL list and sampled source retained; added parsing impact, detection limits and dependency-aware remediation; existing classic/module/non-JS fixtures retained | `07714f9` |
| `head:brand-in-title` | warn | Reviewed and fixed: estimated-versus-configured brand is explicit in missing-match summary; full title and brand retained; added verify-the-guess guidance; existing configured/inferred fixtures retained | `9280d70` |
| `http:cache-delivery` | info | Pending | |
| `head:canonical-noindex-conflict` | info | Pending | |
| `head:canonical-hreflang-consistency` | info | Pending | |
| `head:canonical-header` | info | Pending | |
| `head:canonical-https-preference` | info | Pending | |
| `head-canonical` | warn | Pending | |
| `head:canonical-signals-conflict` | info | Fixed: named HTML/header URL comparison, absent/single/matching/invalid states, specific template/server remedy; copy and invalid-input tests | `87e86af` |
| `head:canonical-tracking-params` | info | Reviewed source, live baseline and existing rule fixtures; clarified purpose, evidence scope and conditional next step. | `4565ba3` |
| `head:canonical-nav-consistency` | info | Pending | |
| `dom:client-side-rendering` | info | Pending | |
| `http:common-mobile-setup` | info | Reviewed: viewport text and source are retained; added presence-versus-usability distinction and optional icon meaning; existing viewport/icon fixtures retained | `7e8fea8` |
| `dom:data-nosnippet` | info | Pending | |
| `gsc:directory-worldwide` | runtime_error | Reviewed API scope and missing/access/error/success branches; explicit Pacific dates and metric meaning; fixture checks with no live account claims. | `bc00e5f` |
| `dom:node-count` | info | Reviewed: measurement method in walker and captured facts; added counted-node definition and no arbitrary score implication; existing nested-tree fixture retained | `a69ffba` |
| `dom:node-depth` | info | Reviewed: depth convention and fallback traversal; added clear nesting meaning and diagnostic limits; existing nested-tree fixture retained | `f63e1fe` |
| `speed:first-paint` | ok | Reviewed: FCP thresholds and first-paint-only/missing states retained; added metric meaning, units, single-run limits and investigation steps; existing boundary states retained | `83c6e60` |
| `google:is-connected` | info | Reviewed stored/missing credentials and Settings controls; states access-check limits and reconnect steps; existing credential fixture. | `9e46f1b` |
| `robots:googlebot-url-check` | ok | Pending | |
| `gsc:url-inspection` | runtime_error | Reviewed recorded-versus-live evidence, named API states, exclusion versus error and all returned sitemaps; mocked success and evidence fixtures. | `3da233f` |
| `http:gzip` | ok | Reviewed: exact encoding, source and complete headers remain available; added purpose, measurement limits and server/CDN remedy; removed irrelevant browser-version detail; existing encoding/probe fixtures retained | `ee0ae40` |
| `body:h1` | ok | Reviewed and fixed: multiple headings now include their text with locations; purpose and missing/empty remediation; existing single/multiple/empty/missing fixtures retained | `966acd5` |
| `discover:headline-length` | info | Reviewed and fixed: missing versus empty heading wording; full headline and location preserved; added explicit heuristic limits and no-padding guidance; existing short/long fixtures retained | `06e9bc9` |
| `gsc:is-indexed` | runtime_error | Reviewed API scope and missing/access/error/success branches; explicit Pacific dates and metric meaning; fixture checks with no live account claims. | `75227ff` |
| `url:history-state-update` | info | Reviewed: captured history and commit booleans in baseline and source; added history meaning and direct-load guidance; no detection logic changed | `20289b4` |
| `head-hreflang` | info | Pending | |
| `head:hreflang-multipage` | info | Pending | |
| `head:hreflang-values` | info | Pending | |
| `http:headers-present` | info | Pending | |
| `http:has-header` | info | Reviewed: requested, present and missing lists remain fully copied; added custom-requirement scope and configuration/server remedy; existing all-present/missing fixtures retained | `253d632` |
| `http-status` | runtime_error | Fixed: named statuses, affected page URL, status-specific remedies, cache revalidation and unavailable evidence; context registration and copy tests | `0a0fba4` |
| `http:h2-advertised` | info | Pending | |
| `http:h3-advertised` | info | Pending | |
| `http:https-scheme` | ok | Pending | |
| `body:images-lazy` | info | Reviewed and fixed: named per-image loading instructions replace concatenated HTML; explicit eager default and viewport limits; existing mixed/default fixtures retained | `83ee1ac` |
| `body:images-layout` | ok | Fixed: image names and URLs, specific missing attributes, explicit sample count and no-image state; copied two-offender and empty fixtures | `2697ef6` |
| `discover:indexable` | ok | Fixed: named applicable blockers, intentional exclusion guidance, permission vs actual indexing; body meta coverage; pass/block/other-crawler tests | `e3d2451` |
| `body:internal-link-status` | ok | Pending | |
| `body:internal-links` | info | Pending | |
| `discover:og-image-large` | warn | Pending | |
| `dom:ldjson` | info | Fixed: numbered source blocks, declared types, syntax versus schema validity, explicit sample coverage; malformed types never stringify as Object; rendered/copied malformed fixture | `0ab0d11` |
| `http:link-header` | info | Pending | |
| `a11y:linked-images-alt` | ok | Pending | |
| `body:parameterized-links` | info | Pending | |
| `discover:max-image-preview-large` | warn | Fixed: permission vs eligibility, named conflicting sources, noimageindex, missing/limited/allowed states and complete UI/copy evidence tested | `6a5d529` |
| `head:meta-charset` | ok | Pending | |
| `head-meta-description` | ok | Reviewed: description text and duplicate-tag evidence are retained; added search snippet meaning and CMS/template fix; existing absent/empty/duplicate/single fixtures retained | `5009a98` |
| `head:meta-googlebot` | info | Reviewed missing, multiple, body and case-insensitive tags; exact named sources and noindex/nofollow meaning; focused fixtures. | `ca6d1df` |
| `head:meta-keywords` | info | Reviewed source, live baseline and existing rule fixtures; clarified purpose, evidence scope and conditional next step. | `2e2af0e` |
| `head:meta-other-robots` | info | Reviewed and fixed: named crawler instructions replace parser dump; clarified that other-crawler restrictions do not automatically apply to Googlebot; existing non-robots filter fixtures retained | `842add8` |
| `head:robots-noindex` | info | Reviewed missing, multiple, body and case-insensitive tags; exact named sources and noindex/nofollow meaning; focused fixtures. | `0f9442e` |
| `head:unavailable-after` | info | Pending | |
| `head:meta-viewport` | ok | Reviewed source, live baseline and existing rule fixtures; clarified purpose, evidence scope and conditional next step. | `186502b` |
| `http:mixed-content` | ok | Reviewed: named offenders, exact attributes, working copy actions and code-level error semantics from 3261b17; added explicit collection scope; unit and headless offender fixtures retained | `286b757` |
| `http:navigation-path` | info | Reviewed: named HTTP timeline, 308 meaning, actual destination outcome, separate history updates and complete copy from 3261b17; added purpose and intentional redirect guidance; unit and headless journey fixtures retained | `38da089` |
| `http:negotiated-protocol` | ok | Pending | |
| `body:nofollow` | ok | Pending | |
| `http:redirect-efficiency` | ok | Pending | |
| `http:resource-delivery` | error | Pending | |
| `og:description` | info | Pending | |
| `og:image` | warn | Pending | |
| `og-title` | warn | Pending | |
| `og:url` | warn | Pending | |
| `debug:page-object` | Not in live run (review fixture/source) | Pending | |
| `debug:page-summary` | Not in live run (review fixture/source) | Pending | |
| `gsc:page-worldwide` | runtime_error | Reviewed API scope and missing/access/error/success branches; explicit Pacific dates and metric meaning; fixture checks with no live account claims. | `2dac7af` |
| `dom:parameterized-links-diff` | ok | Pending | |
| `discover:primary-language` | info | Reviewed: language value and exact opening tag are visible and copied; added accessibility purpose, validation limits and template fix; existing present/missing fixtures retained | `6274e29` |
| `discover:published-time` | warn | Fixed: optional dates, all declared values with exact sources, no fabricated modification dates; absent/published/multiple-source/copy/display tests | `afd09e5` |
| `http:redirect-loop` | ok | Pending | |
| `http:redirect-canonical-chain` | info | Fixed: one named timeline, separate preferred URL meaning, no fake history response or duplicate trace dump, header-only fallback; rendered and copied journey fixture | `1274af3` |
| `head:rel-alternate-media` | info | Pending | |
| `speed:dns-prefetch` | info | Reviewed: target URLs and actual link markup retained; explained DNS lookup and optional hint applicability; existing target-count fixture retained | `d042c53` |
| `speed:preconnect` | info | Reviewed: full target list and source retained; explained prepared connections and absence without a false failure; existing target-count fixture retained | `87bd793` |
| `speed:link-preload` | info | Reviewed: target URLs and as/source markup retained; added purpose and explicit validation limits; existing preload fixture retained | `dc797e1` |
| `head:robots-agent-conflicts` | info | Pending | |
| `head:robots-max-image-preview` | info | Pending | |
| `head:robots-max-snippet` | info | Fixed: readable per-crawler limits with source, units, zero/unlimited/invalid meanings; removed duplicate token dumps; copied multi-source fixture | `7aa2748` |
| `head:robots-max-video-preview` | info | Fixed: seconds, zero versus unlimited meaning, per-crawler source and value; removed duplicate token dumps; copied multiple-setting fixture | `919bf5f` |
| `head-robots-meta` | info | Reviewed missing, multiple, body and case-insensitive tags; exact named sources and noindex/nofollow meaning; focused fixtures. | `f8ed8aa` |
| `head:robots-meta-list` | info | Reviewed and fixed: crawler/source/instruction records replace raw parser fields; summary names crawlers; actual indexing and header limits explained; existing mixed-meta and crawler fixtures retained | `37425da` |
| `head:robots-noimageindex` | info | Fixed: named sources, page indexing distinction and other image-source limits, intentional restriction guidance; copied restriction fixture | `87025e6` |
| `head:robots-nosnippet` | info | Fixed: named tag/header restrictions, max-snippet zero, static-image and indexing distinctions, intentional restriction guidance; copied cross-crawler fixture | `bc6368a` |
| `robots:blocked-resources` | ok | Pending | |
| `robots:complexity` | info | Pending | |
| `robots-exists` | info | Pending | |
| `robots:sitemap-reference` | ok | Pending | |
| `robots:size` | info | Pending | |
| `schema:article:present` | info | Pending | |
| `schema:article:required` | info | Pending | |
| `schema:breadcrumb:positions` | ok | Pending | |
| `schema:breadcrumb` | ok | Pending | |
| `schema:event` | info | Pending | |
| `schema:faq` | info | Pending | |
| `schema:howto` | info | Pending | |
| `schema:jobposting` | info | Pending | |
| `schema:organization` | ok | Pending | |
| `schema:product` | info | Pending | |
| `schema:recipe` | info | Pending | |
| `schema:video` | info | Pending | |
| `schema:website-searchaction` | info | Pending | |
| `http:security-headers` | info | Pending | |
| `dom:seo-phase-changes` | info | Pending | |
| `head:title` | info | Reviewed: full title remains visible and copied; added units and explanation that character count is not a Google limit; existing missing/empty/long fixtures retained | `5aae648` |
| `head-title` | ok | Reviewed: title text, count and matching source are retained; added purpose and missing/empty/duplicate remediation; existing branch fixtures retained | `ea76cd9` |
| `http:from-cache` | info | Pending | |
| `head:shortlink` | info | Pending | |
| `http:soft-404` | ok | Pending | |
| `http:hsts` | ok | Pending | |
| `gsc:top-queries-of-page` | runtime_error | Reviewed API scope and missing/access/error/success branches; explicit Pacific dates and metric meaning; fixture checks with no live account claims. | `745ff6a` |
| `dom:top-words` | info | Reviewed source, live baseline and existing rule fixtures; clarified purpose, evidence scope and conditional next step. | This rule commit |
| `head:twitter-card` | info | Reviewed source, live baseline and existing rule fixtures; clarified purpose, evidence scope and conditional next step. | `b76d858` |
| `body:unsecure-input` | info | Pending | |
| `robots:noindex-unsupported` | info | Pending | |
| `url:trailing-slash` | warn | Pending | |
| `psi:desktop` | ok | Pending | |
| `psi:mobile-fcp-tbt` | warn | Pending | |
| `psi:mobile` | ok | Pending | |
| `http:vary-user-agent` | info | Reviewed source, live baseline and existing rule fixtures; clarified purpose, evidence scope and conditional next step. | `7493324` |
| `gsc:property-available` | runtime_error | Reviewed access probes, cache limits, sign-in and success fixtures; preserves rule identity and distinguishes an unavailable probe from an absent property. | `678bcd5` |
| `http:canonical-host-redirect` | info | Pending | |
| `http:x-cache` | info | Pending | |
| `http:unavailable-after` | info | Pending | |
| `http:x-robots` | info | Pending | |
