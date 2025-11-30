# Legacy vs v7 Rule Inventory

Default rules audited from `f19n-obtrusive-livetest/src/public/default-rules/*.js` and v7 rules from `v7/src/rules/**`.

## Legacy rules by area (legacy MV2)
### HEAD
- `static-head-title.js` — requires a single `<title>`; errors on missing/multiple or empty.
- `static-head-title-length.js` — flags titles <40 or >120 chars (error on blank).
- `static-head-meta-description.js` — expects one meta description; error if missing or multiple.
- `static-head-meta-robots.js` — reads robots meta directives; warns on noindex/nofollow and multiples.
- `static-head-meta-googlebot.js` — parses googlebot meta directives; warns on noindex/nofollow and duplicates.
- `idle-head-meta-keywords.js` — warns when meta keywords is present; notes duplicates.
- `idle-head-meta-viewport.js` — reports presence of responsive viewport meta.
- `idle-head-rel-alternate-media.js` — warns when mobile alternate link is present (separate mobile URL).
- `static-head-rel-alternate-hreflang.js` — lists hreflang link references in head.
- `static-head-rel-alternate-hreflang-multipage-check.js` — fetches referenced hreflang targets, checks redirects, self/back references, and canonical alignment across pages.
- `static-head-canonical.js` — enforces single canonical, warns on relative/mismatched href.
- `static-head-link-shortlink.js` — reports shortlink; warns if it differs from page URL.
- `static-head-amp.js` — reports amphtml link and validator URL.
- `static-head-brand-in-title.js` — expects hostname-derived brand string inside title.
- `static-head-open-graph-title.js` — reports og:title content.
- `static-head-open-graph-description.js` — reports og:description content.
- `static-head-open-graph-url.js` — requires og:url and compares against canonical and location; warns on mismatch.
- `static-head-title.js` — emits full title content (info) or errors on missing/multiple.
- `static-idle-dom-unavailable-after.js` — detects meta content starting with unavailable_after; error if date is in the past.

### BODY / LINKS
- `static-body-h1.js` — requires exactly one non-empty `<h1>`; warns on multiple or empty; error on missing.
- `idle-body-nofollow.js` — warns when elements have `rel=nofollow`.
- `idle-body-linked-image-without-alt-tag-no-textnode.js` — warns linked images that lack alt text and surrounding text.
- `idel-body-unsecure-input.js` — warns when HTTP pages contain form inputs/textareas.
- `idle-static-body-parameterized-links.js` — counts links with query params in idle and static DOM; warns when many or when static-only extras exist.
- `static-internal-links-check.js` — fetches internal links (deduped) and reports HTTP status distribution/redirects with timeout and random sampling controls.
- `dom-static-idle-parameterized-href.js` — compares parameterized internal hrefs between static vs idle DOM and reports idle-only additions.

### DOM
- `dom-detect-client-side-rendering.js` — fetches static HTML vs idle DOM and compares size deltas to flag client-side rendering.
- `idle-dom-ldjson.js` — counts ld+json scripts.
- `idle-dom-top-words.js` — extracts top words (≥5 chars) frequency from idle DOM text.
- `idel-dom-node-count.js` — counts DOM nodes and warns when >1500 or >3000.
- `idel-dom-node-depth.js` — measures max nesting depth; warns >20, errors >32.
- `static-idle-robotstxt-blocked-ressources.js` — fetches robots.txt, parses disallows, and lists blocked internal src resources seen in static/idle DOM.
- `debug-stringify-page-object.js` — outputs full page object when enabled (debug gate).

### URL
- `url-with-without-trailing-slash.js` — fetches alternate trailing-slash variant, evaluates redirect behavior and canonical alignment; flags inconsistencies and non-200 responses.
- `check-for-just-history-state-update.js` — errors when only history state updates occur without network events (indicates SPA navigation without reload).

### HTTP
- `http-status-code.js` — reports HTTP status class with link to spec; warns/errors on ≥3xx.
- `http-has-http-header.js` — warns when no HTTP headers captured (likely cached load).
- `http-detect-classic-deliver-from-cache.js` — warns when onCompleted indicates `fromCache` delivery.
- `http-dom-check-common-mobile-setup.js` — errors when neither responsive viewport, mobile alternate, nor Vary UA are present.
- `http-dom-detect-redirect-canonical-chains.js` — reconstructs redirect chain plus history-state updates, compares final URL with canonical; warns/errors on long chains or cache redirects.
- `http-gzip.js` — checks Content-Encoding for gzip/brotli; errors if neither, info if present.
- `http-hsts.js` — validates HSTS header and max-age; warns if absent or short.
- `http-http2-detection.js` — reports network protocol via Navigation Timing nextHopProtocol; warns if HTTPS without h2/hq.
- `http-vary-user-agent.js` — warns when Vary contains User-Agent (dynamic serving noted).
- `http-has-link-header.js` — reports Link header entries and notes presence of shortlink/canonical/alternate.
- `http-check-for-unavailable-after.js` — warns when unavailable_after appears in raw headers.
- `http-x-cache-hit-miss.js` — notes X-Cache / X-Cache-Lookup HIT/MISS values.
- `http-x-robots.js` — reports X-Robots-Tag header.
- `http-sofft-404-check.js` — fetches random non-existent URL to detect soft 404/410/200 responses and redirects.

### ROBOTS
- `robotstxt-exists-complexity-check.js` — fetches robots.txt, reports status/redirects, basic HTML detection, and counts Disallow/Allow/Noindex/Crawl-delay/Host entries.
- `robotstxt-googlebot-url-check-v2.js` — parses robots.txt for current URL with Googlebot UA; reports allow/disallow/noindex/conflicts/user-agent collisions.
- `robotstxt-sitemap-reference.js` — checks robots.txt for Sitemap references and links to GSC.
- `static-idle-robotstxt-blocked-ressources.js` — lists internal resources blocked for Googlebot per robots.txt (static+idle DOM sources).

### SPEED / PERFORMANCE
- `speed-dom-static-blocking-scripts.js` — counts blocking vs async/defer scripts in static DOM; warns when multiple or many.
- `speed-first-paint.js` — uses paint timing to report time to first paint; warns/error on slow or missing data.
- `speed-static-head-link-rel-preload.js` — reports presence/absence of rel=preload links.
- `speed-page-speed-insights-v5-desktop-async.js` — calls PSI v5 desktop, returns Lighthouse performance score.
- `speed-page-speed-insights-v5-mobile-async.js` — calls PSI v5 mobile, returns performance score.
- `speed-page-speed-insights-v5-fcp-fid-mobile-async.js` — calls PSI v5 mobile, returns FCP/FID percentiles and categories.
- `mobile-friendly-test-async.js` — calls Google Mobile Friendly Test API; warns on missing API key or unfinished run.

### GOOGLE / GSC / AMP
- `google-is-connected.js` — warns when Google OAuth token missing.
- `google-amp-cache-url.js` — posts to AMP Cache API stub (no result emitted).
- `google-search-console-webproperty-available.js` — checks GSC site access via Webmasters API; warns on missing access.
- `google-search-console-is-indexed.js` — calls GSC URL Inspection API; reports verdict, referring URLs, last crawl, and index state.
- `gsc-page-directory-worldwide-search-analytics.js` — SA query for directory-level metrics, outputs clicks/impressions/CTR.
- `gsc-page-worldwide-search-analytics.js` — SA query for exact page metrics (clicks/impressions/CTR).
- `gsc-top-queries-of-page.js` — SA query listing top queries for the page.

### OTHER
- `a-promotion-for-reviews.js` — promotional message encouraging store review.
- `debug-stringify-page-object.js` — gated debug result with serialized page object.

## V7 rules by area (MV3)
### HEAD
- `head-title` (title present), `head:title` (length), `head:brand-in-title`, `head:meta-description`, `head:canonical`, `head:canonical-absolute`, `head:canonical-self`, `head:canonical-redirects`, `head:canonical-chain`, `head:robots-meta`, `head:robots-noindex`, `head:meta-charset`, `head:meta-viewport`, `head:meta-keywords`, `head:unavailable-after`, `head:rel-alternate-media`, `head:shortlink`, `head:amphtml`, `head:hreflang`, `head:hreflang-multipage`, `head:twitter-card`, `head:meta-googlebot`.
### BODY / A11Y / LINKS
- `body:h1`, `body:images-layout`, `body:images-lazy`, `body:nofollow`, `body:internal-links`, `body:parameterized-links`, `body:unsecure-input`, `a11y:linked-images-alt`, `a11y:linked-images-alt-no-text`.
### DOM
- `dom:ldjson`, `dom:node-count`, `dom:node-depth`, `dom:html-lang`, `dom:client-side-rendering`, `dom:top-words`.
### URL / NAVIGATION
- `url:trailing-slash`, `url:history-state-update`, `http:navigation-path`, `http:redirect-loop`, `http:redirect-efficiency`.
### HTTP / TRANSPORT / CACHE
- `http-status`, `http:gzip`, `http:hsts`, `http:link-header`, `http:x-robots`, `http:x-cache`, `http:vary-user-agent`, `http:has-header` (configurable presence), `http:soft-404`, `http:common-mobile-setup`, `http:https-scheme`, `http:h2-advertised`, `http:h3-advertised`, `http:alt-svc-other`, `http:unavailable-after`, `http:security-headers`, `http:cache-delivery`.
### ROBOTS
- `robots-exists`, `robots:blocked-resources`, `robots:complexity`, `robots:sitemap-reference`, `robots:googlebot-url-check`.
### OG / SOCIAL
- `og:title`, `og:description`, `og:url`, `og:image`, `head:twitter-card`, `discover:twitter-large-card`, `discover:og-image-large`.
### SPEED
- `speed:blocking-scripts`, `speed:link-preload`, `speed:preconnect`, `speed:dns-prefetch`.
### SCHEMA
- `schema:article:present`, `schema:article:required`, `schema:breadcrumb`, `schema:event`, `schema:faq`, `schema:howto`, `schema:jobposting`, `schema:organization`, `schema:product`, `schema:recipe`, `schema:video`.
### DISCOVER / NEWS SIGNALS
- `discover:max-image-preview-large`, `discover:article-structured-data`, `discover:published-time`, `discover:author`, `discover:headline-length`, `discover:indexable`, `discover:canonical-ok`, `discover:primary-language`.
### GOOGLE / GSC / PSI
- `google:is-connected`, `google:amp-cache-url`, `gsc:property-available`, `gsc:is-indexed`, `gsc:top-queries-of-page`, `gsc:page-worldwide`, `gsc:directory-worldwide`, `psi:mobile`, `psi:desktop`, `psi:mobile-fcp-tbt`.
### DEBUG
- `debug:page-summary`.

## Legacy → v7 mapping (every legacy default rule)
- `static-head-title.js` → `head-title` (full), `head:title` (length aspects split).
- `static-head-title-length.js` → `head:title` (thresholds differ: legacy warns <40; v7 warns <50).
- `static-head-meta-description.js` → `head:meta-description` (full; v7 warns on multiple).
- `static-head-meta-robots.js` → `head:robots-meta` / `head:robots-noindex` (full).
- `static-head-meta-googlebot.js` → `head:meta-googlebot` (full).
- `idle-head-meta-keywords.js` → `head:meta-keywords` (full).
- `idle-head-meta-viewport.js` → `head:meta-viewport` (full).
- `idle-head-rel-alternate-media.js` → `head:rel-alternate-media` (full).
- `static-head-rel-alternate-hreflang.js` → `head:hreflang` (presence listing).
- `static-head-rel-alternate-hreflang-multipage-check.js` → `head:hreflang-multipage` (fetches targets, checks status/redirects, self/back references, canonical alignment).
- `static-head-canonical.js` → `head:canonical`, `head:canonical-absolute`, `head:canonical-self` (split).
- `static-head-link-shortlink.js` → `head:shortlink` (full).
- `static-head-amp.js` → `head:amphtml` (full).
- `static-head-brand-in-title.js` → `head:brand-in-title` (full).
- `static-head-open-graph-title.js` → `og:title` (full).
- `static-head-open-graph-description.js` → `og:description` (full).
- `static-head-open-graph-url.js` → `og:url` (checks absolute and compares against canonical/location; warns on mismatch).
- `static-idle-dom-unavailable-after.js` → `head:unavailable-after` (scans static + idle DOM; error if date is past).
- `static-body-h1.js` → `body:h1` (full; messages differ).
- `idle-body-nofollow.js` → `body:nofollow` (full).
- `idle-body-linked-image-without-alt-tag-no-textnode.js` → `a11y:linked-images-alt` and `a11y:linked-images-alt-no-text` (split; stricter selectors).
- `idel-body-unsecure-input.js` → `body:unsecure-input` (HTTP password check only; legacy also flagged any form fields).
- `idle-static-body-parameterized-links.js` → `body:parameterized-links` (counts only; no static-vs-idle diff).
- `static-internal-links-check.js` → no v7 equivalent (v7 `body:internal-links` counts but does not fetch statuses).
- `dom-static-idle-parameterized-href.js` → no v7 equivalent (idle-vs-static diff missing).
- `dom-detect-client-side-rendering.js` → `dom:client-side-rendering` (heuristics differ; v7 uses text length + script counts).
- `idle-dom-ldjson.js` → `dom:ldjson` (full).
- `idle-dom-top-words.js` → `dom:top-words` (full; legacy used idle DOM).
- `idel-dom-node-count.js` → `dom:node-count` (full; threshold messaging differs).
- `idel-dom-node-depth.js` → `dom:node-depth` (full; thresholds differ).
- `static-idle-robotstxt-blocked-ressources.js` → `robots:blocked-resources` (same intent; v7 uses captured resources list, no static/idle DOM scan).
- `debug-stringify-page-object.js` → no v7 equivalent (closest is `debug:page-summary` but not full dump).
- `url-with-without-trailing-slash.js` → `url:trailing-slash` (partial; v7 compares against canonical only, no live fetch variant).
- `check-for-just-history-state-update.js` → `url:history-state-update` (full).
- `http-status-code.js` → `http-status` (full).
- `http-has-http-header.js` → `http:has-header` partially (v7 configurable list) and `http-status` runtime_error when headers missing; no simple presence-only info.
- `http-detect-classic-deliver-from-cache.js` → no v7 equivalent (v7 `http:cache-delivery` uses Age header only).
- `http-dom-check-common-mobile-setup.js` → `http:common-mobile-setup` (full; v7 also looks for apple-touch-icon).
- `http-dom-detect-redirect-canonical-chains.js` → no direct v7; partially covered by `http:navigation-path`, `http:redirect-loop`, `http:redirect-efficiency`, and canonical checks but no canonical-vs-redirect chain comparison.
- `http-gzip.js` → `http:gzip` (full; v7 understands multiple encodings).
- `http-hsts.js` → `http:hsts` (full; richer details).
- `http-http2-detection.js` → no v7 negotiated-protocol check; closest: `http:h2-advertised`/`http:h3-advertised` (Alt-Svc only).
- `http-vary-user-agent.js` → `http:vary-user-agent` (full).
- `http-has-link-header.js` → `http:link-header` (full; v7 counts entries).
- `http-check-for-unavailable-after.js` → `http:unavailable-after` (header only).
- `http-x-cache-hit-miss.js` → `http:x-cache` (full).
- `http-x-robots.js` → `http:x-robots` (full).
- `http-sofft-404-check.js` → no v7 equivalent (v7 soft-404 inspects current page content only).
- `robotstxt-exists-complexity-check.js` → `robots-exists` (reachability + sitemap count) and `robots:complexity` (counts allow/disallow); v7 does not detect HTML robots.txt response body or redirects explicitly.
- `robotstxt-googlebot-url-check-v2.js` → `robots:googlebot-url-check` (full; v7 uses parser and fetchOnce).
- `robotstxt-sitemap-reference.js` → `robots:sitemap-reference` (full).
- `speed-dom-static-blocking-scripts.js` → `speed:blocking-scripts` (head-only vs legacy body-wide; both count sync scripts).
- `speed-first-paint.js` → no v7 equivalent.
- `speed-static-head-link-rel-preload.js` → `speed:link-preload` (full).
- `speed-page-speed-insights-v5-desktop-async.js` → `psi:desktop` (full; v7 uses shared PSI wrapper).
- `speed-page-speed-insights-v5-mobile-async.js` → `psi:mobile` (full; v7 uses shared PSI wrapper).
- `speed-page-speed-insights-v5-fcp-fid-mobile-async.js` → `psi:mobile-fcp-tbt` (metrics differ: FCP/TBT vs FCP/FID).
- `mobile-friendly-test-async.js` → no v7 equivalent.
- `google-is-connected.js` → `google:is-connected` (full).
- `google-amp-cache-url.js` → `google:amp-cache-url` (legacy stub; v7 returns derived cache URL from amphtml link).
- `google-search-console-webproperty-available.js` → `gsc:property-available` (full; v7 auto-derives property).
- `google-search-console-is-indexed.js` → `gsc:is-indexed` (full; v7 uses impressions heuristic, not URL Inspection API).
- `gsc-page-directory-worldwide-search-analytics.js` → `gsc:directory-worldwide` (full).
- `gsc-page-worldwide-search-analytics.js` → `gsc:page-worldwide` (full).
- `gsc-top-queries-of-page.js` → `gsc:top-queries-of-page` (full).
- `a-promotion-for-reviews.js` → no v7 equivalent.

## Snapshot semantics (static vs idle) and migration plan
- Legacy “static” = first HTML/DOM (document_end/DOMContentLoaded); “idle” = document_idle DOM after JS. Many legacy rules compare these two.
- Current v7 behavior: `page.doc`/`page.html`/`staticDoc`/`staticHtml` are the static snapshot (document_end, fallback DOMContentLoaded, fallback idle). `domIdleDoc` is the post-JS DOM. Rules labeled `what: 'static'` now read the static snapshot by default.
- Next steps for parity:
  - Revisit rules that should explicitly compare static vs idle:
    - `dom:client-side-rendering` ✅ updated to compare static vs idle text/scripts.
    - New rules needed: parameterized links diff (static vs idle), robots-blocked resources based on DOM src (static+idle), trailing slash test with live fetch vs canonical, redirect-canonical chain with history events vs canonical (see below).
  - Audit rules that inadvertently use idle DOM when they should use static: search for `domIdleDoc` once added to rules to ensure intent.

## Gaps to close for 100% parity (actionable checklist)
### HTML/DOM rules
- [ ] Add rule: parameterized links diff (legacy `dom-static-idle-parameterized-href`): compare `page.doc` vs `page.domIdleDoc` for internal `href*='?'`, report idle-only additions and counts.
- [ ] Add rule: parameterized links static vs idle (legacy `idle-static-body-parameterized-links`): count param links in both DOMs, warn on many and static-only extras.
- [ ] Add rule: robots-blocked internal resources from DOM (legacy `static-idle-robotstxt-blocked-ressources`): collect internal `src` from static+idle DOM, test against robots.txt with Googlebot UA.
- [ ] Ensure DOM size/depth rules use static DOM (current `dom:node-count`/`dom:node-depth` already static).

### URL/redirect/canonical rules
- [ ] Add rule: trailing slash live variant (legacy `url-with-without-trailing-slash`): fetch opposite trailing-slash version, evaluate status/redirect and canonical alignment.
- [ ] Add rule: redirect+canonical chain detector (legacy `http-dom-detect-redirect-canonical-chains`): combine navigation ledger redirects + history state updates + canonical comparison; flag cache redirects and mismatches.
- [ ] Enhance `url:history-state-update` if needed to mirror legacy messaging (already present).

### HTTP/transport rules
- [ ] Add negotiated protocol detection (legacy `http-http2-detection`): report `nextHopProtocol` equivalent; today v7 only checks Alt-Svc advertising.
- [ ] Add cache-delivery from browser cache (legacy `http-detect-classic-deliver-from-cache`): detect `fromCache` flag in navigation events; warn users.
- [ ] Add soft-404 probe (legacy `http-sofft-404-check`): fetch random non-existent URL, inspect status/redirect; current v7 soft-404 only inspects current page content.
- [ ] Decide header presence rule parity: choose between info/warn vs runtime_error when headers missing (review `http-status`/`http:gzip` behavior).

### Robots rules
- [ ] Enhance `robots:complexity` to flag HTML-looking robots.txt and redirects (legacy did).
- [ ] Ensure Googlebot URL check remains parity (already present).

### Mobile/PSI/API rules
- [ ] Add Mobile Friendly Test API rule (legacy `mobile-friendly-test-async`).
- [ ] Ensure PSI rules satisfy legacy metrics (v7 FCP/TBT vs legacy FCP/FID); decision required on adding an FID variant.

### Internal links
- [ ] Add link status checker (legacy `static-internal-links-check`): sample internal links, fetch, report status distribution/redirects; configurable limits/domains.

### Debug/UX
- [ ] Add optional debug full page object output (legacy `debug-stringify-page-object`) gated by config.
- [ ] Decision required: include or omit promo rule (legacy `a-promotion-for-reviews`).

## Coverage tags (where parity is DONE vs TODO)
- DONE (legacy behavior covered): title/meta robots/googlebot/keywords/viewport/shortlink/amp/canonical presence & self/absolute, hreflang presence/duplicates + multipage self/back-reference with status/redirect checks, brand-in-title, og:title/desc/url/image presence with og:url vs canonical/location, meta unavailable_after (DOM + header), H1 presence, nofollow, linked images alt/text, ld+json count, top words, node count/depth, robots.txt exists/sitemap ref/Googlebot URL, client-side rendering heuristic (now static vs idle), GSC queries, PSI, speed blocking scripts/preload/preconnect/dns-prefetch, security headers, HTTPS scheme, alt-svc advertise H2/H3, cache Age, navigation ledger-based redirect loop/efficiency/path, twitter card, schema rules, discover signals, google auth check.
- PARTIAL (needs enhancement): `http:has-header` vs legacy presence; `common-mobile-setup` parity OK; `robots:complexity` (HTML/redirect detection missing).
- TODO (new rules needed): parameterized links diff, DOM robots-blocked resources, soft-404 probe, trailing-slash live check, redirect-canonical chain combined rule, http/2 negotiated protocol detection, browser-cache delivery detection, internal link status checker, Mobile Friendly Test API, optional debug full page dump, PSI FID variant (pending decision), header-missing severity decision, promo rule decision.
- CONFIRMED working under static snapshot: `http:navigation-path`, `http:redirect-loop`, `http:redirect-efficiency` (ledger-based), `head:canonical-redirects` and `head:canonical-chain` (HEAD fetch based), all header-based HTTP rules listed in DONE/ PARTIAL (they read headers; unaffected by DOM snapshot change).
- CONFIRMED missing vs legacy (redirect/HTTP): no combined redirect+canonical+history rule; no live trailing-slash probe; no negotiated protocol (nextHopProtocol) check; no browser-cache-fromCache detector; no soft-404 random URL probe; header-missing severity still undecided.

## Guidance for implementers (junior-friendly)
- Use `page.doc`/`page.staticDoc` for static DOM; use `page.domIdleDoc` for idle comparisons.
- When diffing static vs idle: handle missing snapshots gracefully (return info result or skip with clear message).
- Always provide `details.sourceHtml`/`snippet`/`domPath` via html-utils; no inline HTML in messages.
- Keep `label` consistent (HEAD/BODY/DOM/HTTP/ROBOTS/URL/SPEED/OG/A11Y/GSC/PSI/DISCOVER/SCHEMA/DEBUG).
- Use `what` values already established: `static` for static DOM checks, `http` for headers, `psi`/`gsc` for API calls, `idle` only when explicitly about the idle DOM.
- Guard network calls with try/catch; return `runtime_error` when required tokens/keys are missing.
- Add new rule IDs with namespace prefixes (e.g., `dom:parameterized-diff`, `http:soft-404-probe`, `url:trailing-slash-probe`).

## HEAD parity status (current branch)
- Title rules now mirror legacy messaging: presence reported as info, missing/multiple/empty as errors; length thresholds 40/120/240 with short/long labels.
- Meta description returns legacy-style info with content, errors on missing/multiple; robots and Googlebot meta warn on noindex/nofollow and multiple tags; keywords/viewport/alternate-media fall back to idle DOM when static is empty.
- Canonical split rules align with legacy intent: missing = warn, multiple = error, mismatch to page URL = warn; absolute rule warns on relative URLs; chain/redirect rules skip cleanly when canonical absent.
- Hreflang multipage now fetches targets, checks redirects/status 200, validates self-reference and back-reference to canonical (warns if markup lives outside head).
- Open Graph rules match legacy output: og:title/description info only; og:url now compares against canonical and page location before marking OK.
- Shortlink and amphtml mirror legacy (info when present, warn only on mismatch/empty href); brand-in-title warns only when brand missing; new `head:unavailable-after` scans static + idle DOM and errors if date is past.

## Acceptance for “100% parity” milestone
- All TODO rules implemented with tests covering static vs idle behavior where applicable.
- OG/Canonical/Redirect chain rule mirrors legacy logic (canonical vs final URL with redirect/history context).
- HTTP cache/soft-404/negotiated protocol rules restored.
- Mobile Friendly Test rule added.
- Documentation updated as rules ship; mark checklist items DONE.

## Rule coverage comparison
### Legacy-only (no direct v7 rule)
- `a-promotion-for-reviews.js` — promo banner absent from v7.
- `debug-stringify-page-object.js` — no v7 rule emits full page object dump (debug only).
- `mobile-friendly-test-async.js` — Google Mobile Friendly Test API not present in v7.
- `speed-first-paint.js` — paint timing metric not computed in v7.
- `http-detect-classic-deliver-from-cache.js` — cache-delivery detection via onCompleted/fromCache not replicated (v7 only reads headers/Age).
- `http-sofft-404-check.js` — fetches random 404 candidate URL; v7 soft-404 rule inspects current page content only.
- `static-internal-links-check.js` — status-checks internal links via live HTTP requests; v7 only counts internal/external links.
- `dom-static-idle-parameterized-href.js` — compares parameterized internal links between static vs idle DOM; v7 only counts parameterized links overall.
- `http-dom-detect-redirect-canonical-chains.js` — combines redirect chain, cache redirect, history-state updates, and canonical comparison; v7 splits redirect scoring/loop detection and canonical checks but does not cross-check canonical vs redirect path.
- `url-with-without-trailing-slash.js` — live fetch of slash/no-slash variant with canonical comparison; v7 trailing-slash rule only compares current path vs canonical.
- `http-http2-detection.js` — reports actual nextHopProtocol; v7 inspects Alt-Svc advertising but not negotiated protocol.

### V7-only (no legacy analog)
- **Schema.org validation** — Article present/required, BreadcrumbList, Event, FAQPage, HowTo, JobPosting, Organization/LocalBusiness, Product, Recipe, VideoObject.
- **Discover/News signals** — max-image-preview:large, Twitter large card, article structured data presence, published time, author present, headline length, indexable check (robots meta + x-robots), canonical absolute check, OG image large metadata, html lang for Discover.
- **Security/transport** — HTTPS scheme enforcement, security headers set, HTTP/3 Alt-Svc detection, Alt-Svc other protocols, cache Age reporting, redirect efficiency score, redirect loop detection, navigation path ledger, canonical redirect chain detector.
- **Head refinements** — canonical self/absolute split checks, canonical redirects (HEAD), canonical chain depth, twitter:card, meta charset reporting, robots noindex-specific rule.
- **Body/A11Y refinements** — image dimension check, image lazy-loading, linked images alt/text helpers (more precise selectors), internal/external link counts with DOM path coloring.
- **DOM/Meta** — html[lang] rule (non-Discover), debug page summary, client-side rendering heuristic rewritten.
- **Speed** — rel=preconnect, rel=dns-prefetch (not in legacy).
- **Robots** — consolidated robots.txt fetch rule (existence + sitemap counting) separate from complexity; shares behavior but no legacy standalone equivalent.

## Return value and feature mapping (legacy → v7)
- **Shape**: legacy rules call `done(this.createResult(label, message, type, what, priority))`; v7 rules return a `Result` object `{ name, label, message, type, what?, priority?, details? }` from an async `run` function.
- **Types/severity**: map legacy `info/warning/error/unfinished/promotion` to v7 `ok|info|warn|error|runtime_error` (use `runtime_error` for missing tokens/API failures rather than `warning`; `ok` for positive pass cases).
- **Evidence**: instead of HTML in messages (`partialCodeLink`, `highlightLink`), populate `details.sourceHtml`, `details.snippet`, and `details.domPath` using helpers from `@/shared/html-utils`. UI renders these without inline HTML.
- **Stage/what**: legacy `static/idle/http/mobile` strings map to v7 `what` values already in use (`static`, `http`, `psi`, `gsc`). Avoid new ad-hoc labels.
- **Page data**: replace `page.getStaticDom()/getIdleDom()/getURL()/getHttpHeaders()` with v7 `page.doc`, `page.domIdleDoc`, `page.url`, `page.headers`, and `page.status`. For history/redirect data use `ctx.globals.navigationLedger` and `ctx.globals.events`.
- **Globals/config**: legacy `this.getGlobals()` becomes `ctx.globals` (with `variables` for user-set values and `googleApiAccessToken` for OAuth). Prefer to fail with `runtime_error` when required config is absent.
- **Async discipline**: legacy mix of callbacks and window fetch; v7 rules are `async` and should wrap network calls in try/catch, returning a `Result` even on failures (with `reference` links in `details`).
- **IDs and naming**: v7 IDs follow namespaces (`head:...`, `http:...`, `schema:...`). When migrating a rule, keep IDs stable and add `name` plus `label` that match registry grouping.
