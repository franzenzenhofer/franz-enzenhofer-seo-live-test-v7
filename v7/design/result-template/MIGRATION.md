# COMPLETED: all 130 registry rules emit the presentation contract (2026-09-11)

Every rule in `src/rules/registry.ts` has `presentation: 1`, migrated by hand and committed separately with the full
build (typecheck, eslint + presentation lint, unit suite, vite build, headless Playwright e2e, zip). Final build and
handover: see `HANDOVER.md` next to this file. Verify: `npm run typecheck && npm run lint && npm test && npm run build`
in `v7/`; the presentation lint reports "130 manually migrated rules".

## Original directive (kept for history)

On 2026-09-10 the user expanded the task from ten rules to **all existing rules**: "finish them all!!! commit one after
the other ... your job is migrating the rules to the new format, not to write new rules! MIGRATION!". Rules had to keep
their IDs and check logic, be changed individually by hand, and be committed one after another with all gates.

## How the migration was finished (Claude Code, 2026-09-11)

- Codex timed out after `og:url` (22/130). Its unapplied drafts are preserved in `trash/codex-migration-patches-20260911/`.
- 11 subagents prepared one patch per rule (a factory together with the rules it builds) in isolated scratch copies;
  5 reviewers checked every patch against a 12-point checklist and supplied verified fixups; each patch then went through
  the full build and its own commit. Work records: `trash/migration-work-20260911/` (BRIEF.md, queue.txt, queue.done,
  REVIEW-R1..R5.md, patches/reviewed/).
- The shutdown instruction was given to Codex, not in this session; the computer was not shut down.

## Completed rule migrations (130/130)

Factory rows cover every rule the factory builds. Codex committed the first 22 (older subject style); Claude Code the rest.

| Rule ID | Commit |
| --- | --- |
| `head-title` | `40490a7` |
| `head:title` | `79afe25` |
| `head:brand-in-title` | `b7a0026` |
| `head-meta-description` | `35ad9b8` |
| `body:h1` | `02cd7c1` |
| `body:parameterized-links` | `1e09107` |
| `body:unsecure-input` | `d66d283` |
| `discover:max-image-preview-large` | `09768e7` |
| `discover:og-image-large` | `eb8d1ed` |
| `discover:article-structured-data` | `3576165` |
| `discover:indexable` | `d5e18cc` |
| `discover:primary-language` | `cfc8e98` |
| `discover:headline-length` | `a8c7294` |
| `discover:author` | `2f297b3` |
| `discover:published-time` | `dfb24fc` |
| `http-status` | `44868e1` |
| `head:meta-keywords` | `f3dc777` |
| `head:meta-viewport` | `400f5ab` |
| `head:meta-charset` | `f89aa6e` |
| `og-title` | `8df4a0d` |
| `og:description` | `5982688` |
| `og:url` | `493bf94` |
| `og:image` | `784a762` (7.0.237) |
| `head-canonical` | `452ab70` (7.0.238) |
| `head:shortlink` | `da954d8` (7.0.239) |
| `dom:ldjson` | `df014bd` (7.0.240) |
| `dom:data-nosnippet` | `03a2160` (7.0.242) |
| `schema:* (13 rules via createSchemaRule)` | `c6fc258` (7.0.243) |
| `head-hreflang` | `ef02775` (7.0.244) |
| `head:amphtml` | `d8f29e7` (7.0.245) |
| `head:canonical-header` | `30f1e9b` (7.0.246) |
| `head:robots-meta-list` | `fda84aa` (7.0.247) |
| `head:hreflang-values` | `c4b6505` (7.0.248) |
| `dom:node-count` | `b840e87` (7.0.250) |
| `dom:node-depth` | `cac420c` (7.0.251) |
| `http:gzip` | `36d9db8` (7.0.255) |
| `robots-exists` | `45309cc` (7.0.256) |
| `head:rel-alternate-media` | `365b36c` (7.0.257) |
| `google:is-connected` | `6177e89` (7.0.258) |
| `head:meta-other-robots` | `6a0b862` (7.0.259) |
| `robots:size` | `93037ac` (7.0.260) |
| `head:twitter-card` | `4089368` (7.0.261) |
| `head:hreflang-multipage` | `945e5d1` (7.0.262) |
| `head:unavailable-after` | `2bdb435` (7.0.263) |
| `google:amp-cache-url` | `2688cc0` (7.0.264) |
| `head:canonical-signals-conflict` | `5cb94a0` (7.0.265) |
| `head:canonical-https-preference` | `f670a89` (7.0.266) |
| `head:robots-max-image-preview` | `97105b1` (7.0.267) |
| `head:robots-agent-conflicts` | `7735421` (7.0.268) |
| `http:hsts` | `e8e9f80` (7.0.269) |
| `dom:top-words` | `1875ad0` (7.0.270) |
| `http:https-scheme` | `312b707` (7.0.271) |
| `http:h2-advertised` | `4011d41` (7.0.272) |
| `http:h3-advertised` | `50211b9` (7.0.273) |
| `http:alt-svc-other` | `f1ee0ce` (7.0.274) |
| `http:negotiated-protocol` | `e43d204` (7.0.275) |
| `http:cache-delivery` | `a42056e` (7.0.276) |
| `http:from-cache` | `a142ab7` (7.0.278) |
| `http:security-headers` | `4b1c05c` (7.0.280) |
| `http:common-mobile-setup` | `73a593f` (7.0.281) |
| `http:unavailable-after` | `c1a2683` (7.0.282) |
| `http:resource-delivery` | `c5f7cd9` (7.0.283) |
| `head:canonical-tracking-params` | `42e1d52` (7.0.284) |
| `head:canonical-nav-consistency` | `d65788f` (7.0.285) |
| `head-robots-meta + head:robots-noindex + head:meta-googlebot (createRobotsMetaRule)` | `c3919eb` (7.0.286) |
| `head:robots-max-snippet + head:robots-max-video-preview (createRobotsNumberRule)` | `45f9c3e` (7.0.287) |
| `body:images-layout` | `0f614a0` (7.0.288) |
| `body:images-lazy` | `d4f608b` (7.0.289) |
| `body:nofollow` | `54bf135` (7.0.290) |
| `a11y:linked-images-alt` | `4d0f6ad` (7.0.291) |
| `dom:parameterized-links-diff` | `c8276b2` (7.0.292) |
| `dom:client-side-rendering` | `5e2996d` (7.0.293) |
| `dom:seo-phase-changes` | `986a6e0` (7.0.295) |
| `speed:link-preload` | `bae7c79` (7.0.296) |
| `speed:blocking-scripts` | `edb3247` (7.0.297) |
| `http:link-header` | `ac6b36d` (7.0.298) |
| `http:x-cache` | `6c2a6ae` (7.0.299) |
| `http:x-robots` | `b9d497c` (7.0.300) |
| `http:vary-user-agent` | `e31109d` (7.0.301) |
| `head:robots-nosnippet + head:robots-noimageindex (createRobotsRestrictionRule)` | `7d1ef02` (7.0.302) |
| `speed:preconnect` | `29c865a` (7.0.303) |
| `speed:dns-prefetch` | `7dda8ce` (7.0.304) |
| `speed:first-paint` | `6072402` (7.0.305) |
| `url:history-state-update` | `390c009` (7.0.306) |
| `robots:blocked-resources` | `cb67674` (7.0.307) |
| `head:canonical-hreflang-consistency` | `207b7a2` (7.0.308) |
| `head:canonical-noindex-conflict` | `a052920` (7.0.309) |
| `body:internal-links` | `b7bbbc6` (7.0.310) |
| `body:internal-link-status` | `6bead3e` (7.0.311) |
| `http:headers-present` | `0261794` (7.0.312) |
| `http:has-header` | `8e1c51b` (7.0.313) |
| `http:redirect-canonical-chain` | `65decf4` (7.0.314) |
| `http:redirect-loop` | `b456f98` (7.0.315) |
| `http:redirect-efficiency` | `243e482` (7.0.317) |
| `http:navigation-path` | `269dd2c` (7.0.318) |
| `http:canonical-host-redirect` | `019c6ca` (7.0.319) |
| `url:trailing-slash` | `8cc2b04` (7.0.320) |
| `robots:noindex-unsupported` | `2851b7d` (7.0.321) |
| `robots:sitemap-reference` | `11654b3` (7.0.322) |
| `robots:complexity` | `b980fea` (7.0.323) |
| `robots:googlebot-url-check` | `5d848a4` (7.0.324) |
| `psi:mobile` | `fbae0e6` (7.0.325) |
| `psi:desktop` | `99723e9` (7.0.326) |
| `psi:mobile-fcp-tbt` | `1c0590e` (7.0.327) |
| `gsc:property-available` | `ac4613d` (7.0.328) |
| `gsc:is-indexed` | `616e03e` (7.0.329) |
| `gsc:url-inspection` | `9f2d6c4` (7.0.330) |
| `http:mixed-content` | `2e1c22b` (7.0.331) |
| `http:soft-404` | `4630229` (7.0.332) |
| `gsc:top-queries-of-page` | `024bd6a` (7.0.333) |
| `gsc:page-worldwide` | `6e4fab4` (7.0.334) |
| `gsc:directory-worldwide` | `5e3ec91` (7.0.335) |
| `debug:page-summary` | `46c6256` (7.0.336) |
| `debug:page-object` | `fa1e601` (7.0.337) |

## Shared changes committed during the migration

| Change | Commit |
| --- | --- |
| `Selector` means the queried CSS selector; element locations are `DOM path` (user decision) | `8a504ac` |
| Collector drops stale webRequest events without logging an error (subject malformed: "migrate (fix) ... presentation") | `1f43fbc` |
| Typed `path` field kind: long DOM paths collapse with an Expand/Collapse toggle; copy/search keep the full path (subject malformed: "migrate (feat) ... presentation") | `888a7a8` |
| Iframe subresources attributed to the page; previous document's aborted requests rejected before commit | `3d45e3e` |
| Every rule emits DOM paths as the `path` field kind | `cf0b998` |
| Helpers left unused removed (copies in `trash/2026-09-11-presentation-migration-unused/`) | `499461c` |

Shared foundation: `d2cbd5a`; shared lint, lifecycle, search and copy integration: `d39231a`.

## Open follow-ups (outside this migration)

- The legacy card path (`ResultDetails`, `LegacyResultCard`, `resultTransforms`, `resourceIssues`) still renders
  non-rule results; retiring it is a separate UI change. `shared/html-utils.ts` is still imported.
- `tests/e2e/actionable-http.spec.ts` is timing-sensitive under heavy CPU load (see HANDOVER.md).
- Verify filter persistence and CLI HTML exports; update the dummy's preview-permission input label.
