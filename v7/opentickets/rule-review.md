# Complete rule review

Scope: all 130 registered rules. Review each rule before marking it complete. Commit each rule fix separately.

Baseline: a complete headless run of https://www.example.com/g/286584 redirected to /g/597748; 128 visible results. Debug-only rules remain explicitly in this inventory. Successful authenticated GSC states require fixture review in addition to the unauthenticated live result.

| Rule | Baseline result | Review status | Commit |
| --- | --- | --- | --- |
| `http:alt-svc-other` | info | Pending | |
| `google:amp-cache-url` | info | Pending | |
| `head:amphtml` | info | Pending | |
| `discover:article-structured-data` | warn | Fixed: optional markup, BlogPosting coverage, exact matching script, incomplete parse explanation; absence/presence/malformed copy tests | `4563095` |
| `discover:author` | warn | Fixed: all named authors and exact sources, optional metadata, unresolved identity limits; multi-author/absent/malformed copy tests | `cf79561` |
| `speed:blocking-scripts` | warn | Pending | |
| `head:brand-in-title` | warn | Pending | |
| `http:cache-delivery` | info | Pending | |
| `head:canonical-noindex-conflict` | info | Pending | |
| `head:canonical-hreflang-consistency` | info | Pending | |
| `head:canonical-header` | info | Pending | |
| `head:canonical-https-preference` | info | Pending | |
| `head-canonical` | warn | Pending | |
| `head:canonical-signals-conflict` | info | Fixed: named HTML/header URL comparison, absent/single/matching/invalid states, specific template/server remedy; copy and invalid-input tests | `87e86af` |
| `head:canonical-tracking-params` | info | Pending | |
| `head:canonical-nav-consistency` | info | Pending | |
| `dom:client-side-rendering` | info | Pending | |
| `http:common-mobile-setup` | info | Pending | |
| `dom:data-nosnippet` | info | Pending | |
| `gsc:directory-worldwide` | runtime_error | Pending | |
| `dom:node-count` | info | Pending | |
| `dom:node-depth` | info | Pending | |
| `speed:first-paint` | ok | Pending | |
| `google:is-connected` | info | Pending | |
| `robots:googlebot-url-check` | ok | Pending | |
| `gsc:url-inspection` | runtime_error | Pending | |
| `http:gzip` | ok | Pending | |
| `body:h1` | ok | Pending | |
| `discover:headline-length` | info | Pending | |
| `gsc:is-indexed` | runtime_error | Pending | |
| `url:history-state-update` | info | Pending | |
| `head-hreflang` | info | Pending | |
| `head:hreflang-multipage` | info | Pending | |
| `head:hreflang-values` | info | Pending | |
| `http:headers-present` | info | Pending | |
| `http:has-header` | info | Pending | |
| `http-status` | runtime_error | Fixed: named statuses, affected page URL, status-specific remedies, cache revalidation and unavailable evidence; context registration and copy tests | `0a0fba4` |
| `http:h2-advertised` | info | Pending | |
| `http:h3-advertised` | info | Pending | |
| `http:https-scheme` | ok | Pending | |
| `body:images-lazy` | info | Pending | |
| `body:images-layout` | ok | Pending | |
| `discover:indexable` | ok | Fixed: named applicable blockers, intentional exclusion guidance, permission vs actual indexing; body meta coverage; pass/block/other-crawler tests | `e3d2451` |
| `body:internal-link-status` | ok | Pending | |
| `body:internal-links` | info | Pending | |
| `discover:og-image-large` | warn | Pending | |
| `dom:ldjson` | info | Pending | |
| `http:link-header` | info | Pending | |
| `a11y:linked-images-alt` | ok | Pending | |
| `body:parameterized-links` | info | Pending | |
| `discover:max-image-preview-large` | warn | Fixed: permission vs eligibility, named conflicting sources, noimageindex, missing/limited/allowed states and complete UI/copy evidence tested | `6a5d529` |
| `head:meta-charset` | ok | Pending | |
| `head-meta-description` | ok | Reviewed: description text and duplicate-tag evidence are retained; added search snippet meaning and CMS/template fix; existing absent/empty/duplicate/single fixtures retained | `5009a98` |
| `head:meta-googlebot` | info | Pending | |
| `head:meta-keywords` | info | Pending | |
| `head:meta-other-robots` | info | Pending | |
| `head:robots-noindex` | info | Pending | |
| `head:unavailable-after` | info | Pending | |
| `head:meta-viewport` | ok | Pending | |
| `http:mixed-content` | ok | Pending | |
| `http:navigation-path` | info | Pending | |
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
| `gsc:page-worldwide` | runtime_error | Pending | |
| `dom:parameterized-links-diff` | ok | Pending | |
| `discover:primary-language` | info | Reviewed: language value and exact opening tag are visible and copied; added accessibility purpose, validation limits and template fix; existing present/missing fixtures retained | `6274e29` |
| `discover:published-time` | warn | Fixed: optional dates, all declared values with exact sources, no fabricated modification dates; absent/published/multiple-source/copy/display tests | `afd09e5` |
| `http:redirect-loop` | ok | Pending | |
| `http:redirect-canonical-chain` | info | Pending | |
| `head:rel-alternate-media` | info | Pending | |
| `speed:dns-prefetch` | info | Pending | |
| `speed:preconnect` | info | Pending | |
| `speed:link-preload` | info | Pending | |
| `head:robots-agent-conflicts` | info | Pending | |
| `head:robots-max-image-preview` | info | Pending | |
| `head:robots-max-snippet` | info | Fixed: readable per-crawler limits with source, units, zero/unlimited/invalid meanings; removed duplicate token dumps; copied multi-source fixture | This rule commit |
| `head:robots-max-video-preview` | info | Pending | |
| `head-robots-meta` | info | Pending | |
| `head:robots-meta-list` | info | Pending | |
| `head:robots-noimageindex` | info | Pending | |
| `head:robots-nosnippet` | info | Pending | |
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
| `gsc:top-queries-of-page` | runtime_error | Pending | |
| `dom:top-words` | info | Pending | |
| `head:twitter-card` | info | Pending | |
| `body:unsecure-input` | info | Pending | |
| `robots:noindex-unsupported` | info | Pending | |
| `url:trailing-slash` | warn | Pending | |
| `psi:desktop` | ok | Pending | |
| `psi:mobile-fcp-tbt` | warn | Pending | |
| `psi:mobile` | ok | Pending | |
| `http:vary-user-agent` | info | Pending | |
| `gsc:property-available` | runtime_error | Pending | |
| `http:canonical-host-redirect` | info | Pending | |
| `http:x-cache` | info | Pending | |
| `http:unavailable-after` | info | Pending | |
| `http:x-robots` | info | Pending | |
