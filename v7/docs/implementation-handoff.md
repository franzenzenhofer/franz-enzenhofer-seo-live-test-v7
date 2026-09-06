# Implementation handoff: testing-engine correctness

> **STATUS 2026-09-07: the handoff below was executed and closed.** The tree it
> describes now passes `typecheck`, `lint`, all 914 unit tests and the full
> `npm run build` (including the extension e2e suite). What was finished, and
> what is deliberately still open, is listed in **Completion record** at the
> end of this file. Read that section first - the body of this document is the
> original plan, kept for provenance, not a to-do list.

Updated: 2026-09-06. Repository: `/Users/franzenzenhofer/dev/franz-enzenhofer-seo-live-test-v7`.
Base commit: `4625bd7d7a7eb50f5529f54673b1f31a1f93dfac`.

## Read this first

The user requested implementation of an audited plan, then explicitly paused implementation to save remaining usage and let another AI finish. **Work is unfinished and uncommitted. Preserve the working tree, including untracked source files.** No implementation commits, build, release or deployment have happened. Do not reset/clean/revert these edits. Inspect `git status --short` and `git diff`; untracked files are not shown by `git diff`.

The original baseline passed typecheck, lint and all unit tests before edits. The current tree does NOT pass all gates. No post-change unit/regression tests have been completed, and no new regression test files were written before the pause. Code described below as written is not verified complete.

Read repository `AGENTS.md` and required global instructions. Never delete files: move obsolete files/output into `trash/` with a dated reason. Keep this private, closed-source repository private. Do not print credentials from global configuration. Use Tailwind only for UI. Keep TypeScript strict, DRY/KISS/modular, prefer pure helpers; source limit 75 nonblank/noncomment lines, rule files 150. Tests belong under `v7/tests/`.

## Authoritative user requirements and corrections

1. **Stay inside the existing testing RULE EXECUTION LOGIC.** All fixes and additions use typed `Rule.run`, `runAll`, existing static/idle/compare/context phases and the current collector/offscreen/storage path. No replacement runner, browser-testing service, new rendering engine or dynamic evaluation. If a test cannot run there, do not implement it.
2. **Only the intensive internal-link HTTP/status check samples URLs.** Preserve its maximum five targets. Improve candidate selection across the complete DOM so navigation links cannot starve the sample.
3. **Check ALL declared hreflang targets.** The user explicitly rejected the earlier plan's five-hreflang cap. Deduplicate identical URL fetches while retaining all declarations. Limit concurrency, not target coverage. On timeout/rate-limit/missing facts, report incomplete/unavailable honestly, never success for an unchecked remainder.
4. **Unsupported `noindex` in robots.txt needs its own separate test.** Google ignores it. It must never influence Allow/Disallow evaluation. A new `robots:noindex-unsupported` rule has been written but is not registered yet.
5. **Full-report copy buttons must show visible success feedback after a successful clipboard write.** Changes are written in `report/ExportButtons.tsx` and shared copy feedback; test them.
6. User chose optional deeper URL checks for genuinely new request-heavy checks. They must still be ordinary typed rules through this engine. Do not reinterpret that choice as authorization for a separate JS-off or bot rendering system. No full site crawl.
7. Preserve rule IDs/settings and the previous decisions in `v7/opentickets/round-9-spec-coverage/franz-decisions-2026-09-02.json`: retain robots cluster, retain/upgrade HTTP and PSI, retain debug summary. Only the Article presence overlap has prior consolidation approval; retain distinct responsibilities and compatible IDs.

Earlier plan wording proposing sampling other URL relations is superseded by points 2 and 3. Byte/time/redirect safety limits remain legitimate, but hitting them means incomplete evidence, not a sampled all-clear.

## What the engine actually does

- Content scripts run static rules on the FULL live document at `document_end`, and idle rules at `document_idle`. Neither is raw source HTML nor JavaScript-disabled rendering.
- Full on-page counters/measurements are separate from bounded evidence transported to the service worker. Compact facts retain critical head information, bounded anchor/resource examples and exact local counts.
- Service worker collects navigation/request/phase facts; offscreen builds compact context and runs only context/compare rules. Results stream and then merge by rule/run identity. Similar subject matter in separate rules is not proof of duplicate execution.
- CLI and extension share registry/runner. CLI lacks browser lifecycle evidence and must report it unavailable.
- The code, not stale docs, is authoritative for current caps: general fact pool 24,000 UTF-8 bytes, anchor pool 2,000, head sub-budget 20,000, phase messages 32,000; results details 8,192 bytes, messages 2,000 characters. Existing runtime docs describe older values and need updating after verification.
- Existing internal-link status, redirect, trailing slash and hreflang target checks already exist. Blocked resource URLs were already in details. Do not implement the supplied complaint list blindly.

## Immediate known gate failures

Last root typecheck reported:

- `src/background/listeners/requests.ts:17,30,42,52`: installed Chrome webRequest types do not expose `documentId`. Use a narrow typed optional extension/helper after checking runtime support; do not add `any` or widen permissions.
- `src/background/pipeline/auditAccess.ts:27`: `prior` possibly undefined; explicitly guard it / use `prior?.manual`.
- `src/rules/head/hreflangTarget.ts:50`: `Headers.entries()` not in current TS lib. Use `headers.forEach` as elsewhere.

Last root lint reported:

- `src/rules/body/internalLinkStatus.ts:45`: unused `base` variable.
- `src/shared/domFacts.collect.ts`: 76 counted lines, maximum 75; extract coherent helper, do not disable gate.
- `src/shared/redirectChain.ts`: 81 counted lines, maximum 75; split wrapper/core appropriately, preserve public import.

A final agent patch added PSI/GSC changes after these gate runs. Re-run gates; these lists are not guaranteed exhaustive. Baseline-browser-mapping age notice is unrelated to the implementation failures.

## Written changes: lifecycle and provenance

New helpers:

- `background/rules/sessionStore.ts`, `activeRunMeta.ts`.
- `background/pipeline/auditAccess.ts`, `phaseProgress.ts`.
- `background/listeners/phaseMessages.ts`.
- `shared/auditIntent.ts`, `phaseSchema.ts`.

Modified existing sessions, runner, chunking, seeding, offscreen messaging, collector/finalizer/store, nav/messages listeners, cleanup, content capture/messages, manual run helper and phase contract.

Intended behavior now written:

- Serialized session operations. `finishSession(tabId, status, runId)` requires expected generation; `withActiveSession` guards current metadata and result writes.
- Prevent the reproduced bug where old run A's cleanup terminates newer run B.
- Fix pre-aborted offscreen cleanup referencing an uninitialized timer.
- One-shot manual audit intent before reload; active/current top-frame document authorization checks auto-run and blocklist BEFORE content rule execution.
- Strict phase wire version 1 with capture ID, phase, URL, timestamp, chunk index/count, final completion; persist/acknowledge chunks; reject stale, unauthorized, out-of-order messages.
- `EventRec` and `Run` now optionally carry `documentId`. `addEvent` returns boolean; `popRun(tabId, expectedId?)` avoids consuming a different run. Keep these when changing resource ingestion.

**Unfinished lifecycle review is important:**

- `markDomPhase(tabId)` still lacks expected document identity.
- Idle completion may trigger finalization before a slow static phase completes.
- `collectPhaseResults` still gathers chunks without its own completeness filtering.
- An older `runRulesOn` can resolve its URL late and start after a newer invocation; generation protection must cover creation, not only cleanup.
- Review serialization for re-entrant per-tab locking/deadlocks and stale writes around awaits.
- Existing phase/session/auto-run tests use old signatures, unversioned messages and synchronous/mock assumptions. Update fixtures to the actual protocol rather than weakening production validation.

## Written changes: cancellation and network helpers

Root added:

- `shared/abort.ts`: abort scopes, cancellation checks and abortable promise waits.
- `core/ruleDeadline.ts`; `ruleQueue.ts` now calls it and passes a per-rule signal.
- `shared/responseBody.ts`: streaming bounded decoded-body reader, deadline through body consumption.
- `shared/siteProbeQueue.ts`: two concurrent site probes per origin; 429 or 503 with Retry-After stops queued probes, minimum one-minute cooldown, no automatic retry.
- `shared/singleFlight.ts`: per-consumer cancellation, shared underlying operation canceled only when nobody needs it; bounded settled cache.
- `shared/fetchOnce.ts` rewritten to use these helpers, 512,000-byte robots body bound and existing caching semantics.
- `shared/redirectChain.ts` / `.observed.ts` accept signals; wrapper holds site slot through bounded body read and returns a buffered Response. This has not been regression tested.

Interfaces added in `core/types.ts`:

- `Ctx.signal?: AbortSignal`.
- `Page.baseUri?: string`, `responseHeaderFields?: Array<[string,string]>`.
- `Page.resourceFacts?`, `resourceCoverage?` for future completed ledger integration.

`FollowOptions` now accepts `signal?`, `maxBodyBytes?`. `fetchStatusTextOnce(url, timeoutMs = 1500, signal?)` and `fetchTextOnce` take an optional third signal. `readResponseText(response, { signal?, maxBytes?, timeoutMs? })` returns text or throws, never silently truncates input judged as complete.

**Remaining network work:**

- Propagate `ctx.signal` through ALL rule fetch paths. Hreflang and new robots rule do so, but several existing robots, soft404, gzip, trailingSlash, PSI/GSC calls still do not.
- `shared/page.ts` HEAD/GET probing still lacks timeout/cancellation; pass offscreen run signal into page construction and preserve event/probe provenance.
- PSI/GSC single-flight operations must let callers cancel independently; do not let one timed-out consumer cancel others or cache authorization across identities.
- Replace unbounded `.text()` consumers with bounded reads; check returned buffered Response behavior, null-body HTTP statuses and fixture compatibility.
- Preserve observable MV3 redirect behavior. Existing `redirect:'follow'` allows Chrome to follow before applying analytical maxHops. Do not pretend the analytical limit stops network requests. Keep manual path where supported; disclose hidden hops and distinguish diagnostic/runtime limits.
- Test queue cancellation, cooldown, cross-origin redirects, late body reads, shared-cache cancellation, cache eviction and hung fetches before claiming done.

## Written changes: headers/resources (INTEGRATION NOT FINISHED)

- `shared/responseHeaders.ts`: header normalization and retention of repeated indexing header fields.
- `shared/resourceFacts.ts`: resource fact type and selected caching/MIME/compression header whitelist.
- `background/listeners/requests.ts`: includes request identity/type, selected repeated indexing fields and resource error events. Current typecheck failures listed above.
- `pipeline/types.ts` was expanded for resource facts, event/completion counters and truncation.

**Critical unfinished mismatch:** `storeResources.ts` is STILL the original URL-only collector with WRONG counters (`total events - unique URLs` falsely counts normal lifecycle callbacks as drops). `store.ts` STILL calls `addResource(tabId, ev.u)`, so new type/status/headers/errors are discarded. The new type comments describe intended corrected semantics, not actual behavior yet.

Next implementation must:

1. Pass full EventRec into resource aggregation, preserve lifecycle identity checks in store.ts.
2. Aggregate bounded selected metadata by resource URL; retain at most 1,000 URL records and add a byte bound (recommended 1 MB ledger), with 50-event batching as today.
3. Separate event count, completed/error request observations, retained distinct URLs and genuinely omitted observations. Do not claim an exact count of unique URLs beyond a bounded ledger without storing enough identity to establish it. Report retained population and explicit truncation instead.
4. Never count beforeHeaders/headers/completed for one resource as three resources or two drops.
5. Wire facts/coverage from ledger through `page.enrich.ts` into Page; update blocked-resource reporting to these semantics.
6. Wire repeated `headerFields` through `page.headers.ts`/`page.enrich.ts` into `Page.responseHeaderFields`; effectiveRobots already accepts them, but they do not reach it yet.
7. Fix page header selection: exact document/request evidence, preserve meaningful trailing slash/query differences, no arbitrary subresource fallback. Keep legitimate SPA document-header evidence explicitly associated with its fetched URL.
8. Add passive failed-resource/MIME/compression/cache diagnostic rules over observed facts, with no resource refetch loop.

## Written changes: rules and DOM/schema

Robots/network agent wrote:

- `vendor/robotsPath.ts` and parser fixes in `vendor/robots.ts`: wildcard/end-anchor, encoding, agent normalization; unsupported noindex excluded from crawl rules.
- `shared/effectiveRobots.ts`, `robotsPolicy.ts`; repeated header field parsing support in `shared/robots.ts`.
- Indexability/canonical-noindex/preview rules reuse effective directive logic.
- Protocol advertisement wording, timing-only negotiated protocol, honest untested www result, informational mobile presence, redirect severity/name corrections.
- `shared/internalLinkCandidates.ts`: bottom-k URL hash sample of five unique eligible internal URLs across all anchors, bounded 2 KB evidence. DOM fact type fields exist, but collectDomFacts does NOT yet call/merge this helper; internal status already tries to consume it. Wire the <=2 KB candidates into the reserved anchor pool before display anchor evidence.
- Hreflang rewritten with `rules/head/hreflangTarget.ts`: **all unique remote declared targets**, concurrency two, per-target errors, status/redirect/self/back-reference and canonical/noindex evidence. Source self-reference reused. No sample cap.
- `rules/robots/noindexUnsupported.ts`: separate unsupported noindex diagnostic, same cached robots fetch.

Still unfinished: soft404 classifications, gzip/trailingSlash signal propagation, robots fetch-status consistency, tests. Verify internal-link candidate URL base in CLI/DOMParser fixtures: detached docs default about:blank, real content docs do not. Do not fix fixtures by fabricating on-page coverage. Review all hreflang declarations/malformed values and retained head truncation: unavailable beats a false all-clear.

DOM/schema agent wrote:

- `shared/contentText.ts`, readability/word-frequency/text-length updates; main/article/body scope, exclusion of non-content text.
- `shared/seoPhaseSignals.ts`, DOM facts summaries, `rules/dom/seoPhaseChanges.ts`; bounded full-DOM counts/fingerprints, no full HTML transport.
- `content/phaseSnapshot.ts` captures URL/time/base URI and navigation plus available FP/FCP entries; content capture uses it.
- CSR comparison reports signed text difference and content replacement evidence instead of only positive length growth.
- `shared/structuredParse.ts` and structured helper changes: bounded JSON-LD parse issues with block provenance, exact type matching.
- Schema factory validates matching entities, presence-only wording corrected; Article author arrays supported.
- PSI summaries preserve missing scores, mobile/desktop emit unavailable; runtime-error data retained.
- `rules/google/gsc/inspectionData.ts`: validated inspection fields, expanded existing URL Inspection details; historical-impressions indexing wording corrected. No extra API call added.
- Full-report JSON/HTML buttons use existing copy feedback hook with green success wording only after successful clipboard writes. Hook changed `copy` to return success boolean.

Still unfinished: regression tests, image-dimension heuristic corrections, shared script classification, Article date/entity validation, approved Article overlap responsibilities, local heading/link/meta-refresh/base/language checks, richer visible reporting of evidence. Review fingerprint limitations: a small hash is a change heuristic, not a proof of semantic equality. Do not claim source HTML or JS-disabled comparison.

## Registration/integration still required

Additional concrete integration defects from the final agent handoffs:

- `collectDomFacts` must call `collectInternalLinkCandidates`; currently only types/helper/consumer exist. Honor the existing anchor byte pool rather than silently growing the phase payload.
- `domCapture` does not yet pass `snapshot.baseUri` into Page, although snapshot/payload contain it. Complete Page construction and offscreen enrichment.
- `seoPhaseSignals.ts` has a separator-hash typo: multiplier `1677766261` should be `16777619`. Do not whitespace-normalize JSON-LD string contents when fingerprinting: preserve raw JSON text, or parse and canonicalize semantically.
- `readability.ts` still duplicates content-root selection and has import placement to clean up.
- Review empty internal-candidate outcomes: zero eligible links is different from candidates omitted by byte bound; do not reuse misleading legacy truncated-anchor wording.
- Robots repeated-header parsing needs a combined segment limit across fields. Confirm robots parsing treatment of the 500 KiB crawler limit rather than claiming complete Google evaluation of oversize input.
- Blocked-resource messages still include same-host wording although matching now uses same origin.
- Browser Fetch may flatten repeated headers on remote probes. Do not claim recovered raw field boundaries; distinguish from navigation webRequest evidence.
- `discover:indexable` still has a broad name/ok result for just absence of noindex. Keep its conclusion scoped to measured directives rather than claiming proven indexability.

Neither new rule has been added to registry/input routing:

- `seoPhaseChangesRule` from `rules/dom/seoPhaseChanges.ts`, ID `dom:seo-phase-changes`, input `compare`.
- `robotsNoindexUnsupportedRule` from `rules/robots/noindexUnsupported.ts`, ID `robots:noindex-unsupported`, context via robots prefix.

Use `src/rules/registry.ts` as the only rule list. Update metadata/phase/inventory tests and generated inventory through the existing script when appropriate. Do not register unreachable helpers or invent a second execution list.

## Remaining optional checks from approved plan

Not started. Finish correctness/integration first.

- Disabled-by-default typed context rules for declared canonical destination health, selected hostname/protocol variants and cached sitemap inspection. Use existing rule flags/overrides and runner, no independent audit engine.
- Reuse self-canonical captured evidence; otherwise reuse shared fetch response for status/redirect/noindex/robots/canonical and advisory content similarity. Canonical chains must detect loops and disclose a continuation stopped by a safety cap.
- Existing sitemap design `v7/tickets/sitemap-fetch-spec.md`: cached property artifacts, only with GSC property access or explicit URL whitelist, not a fetch on every page load. Keep current-URL absence inconclusive when traversal incomplete. Do not create a sitemap URL crawl.
- Earlier plan suggested three canonical docs, two sitemap files, 1 MB HTML/2 MB sitemap/8 MB added-body limits, 24h sitemap cache and ten extra target fetch starts for optional deeper work. User subsequently emphasized ONLY internal-link checks sample. Do not apply those old numbers as a blanket relation-sampling policy; stop with explicit incomplete status at resource limits, and always preserve full declared hreflang traversal.
- No JS-off/browser emulation, bot renderer, consent automation or resource-blocked rerendering. No unsupported INP/CLS/LCP attribution claims. Existing optional PSI field data cannot substitute for a newly implemented CrUX integration, which is outside this work.

## Regression and acceptance checklist

Write meaningful tests in `v7/tests/` with local fixtures/minimal Chrome mocks, no public-site crawl:

- Superseded run A cannot finish/write/clear B; reverse timing around async session creation; same-URL reload, stale document chunks, retransmission, incomplete phases, static/idle ordering, closed/inactive tabs.
- Auto-run disabled actually prevents automatic rule execution; one-shot manual run works; blocklist checked before content work.
- Pre-aborted/offscreen/rule/fetch/body cancellation; no requests after cancellation; two-probe concurrency; 429 cooldown; independent single-flight consumers.
- Robots `/*.pdf$`, `/private$`, `/fish*.php`, UTF-8/unreserved encoding, group specificity, Googlebot-News/Image, unsupported noindex cannot override Disallow and produces separate warning.
- Repeated/scoped X-Robots fields, second meta noindex, `none`, Bing-only restriction, effective preview values.
- First ten anchors external/fragments but later eligible links still yield up to five probes; large populations do not create full-link crawl. Hreflang >5 must check ALL unique declared targets; duplicate declarations share a fetch; malformed/failed target doesn't cancel valid others.
- Accurate resource counters with multiple callbacks and repeated URL loads; failed resources/types/status/header evidence; overflow disclosed; wrong resource headers never applied to document.
- Timing-only h2, unrequested www not success, terminal 302 with no Location, rate-limit not broken URL, generated 200 not conclusive soft404.
- Script/JSON contamination, removed/equal-length replaced content, missing phases; scoped local evidence; no false proof of source-vs-rendered equivalence.
- Bad JSON-LD alongside valid blocks, exact type identity, later invalid entities, correct block provenance, valid author arrays; Article dates/order/timezones when implemented.
- PSI absent/null vs genuine zero; expanded GSC fields missing/present without extra requests.
- Copy JSON/HTML success changes button label/color and resets; failure does not show copied; repeated click race uses latest feedback. Use Tailwind.
- Registry metadata and phase coverage; one stored result per rule/run despite streaming/final merging; CLI/browser missing-evidence behavior; message/storage byte caps.

## Suggested continuation order and commands

1. Read this file and working-tree changes. Do not assume any edited subsystem is finished.
2. Fix current compiler/lint blockers, register the two new rules.
3. Complete lifecycle integrity and resource/header wiring; review cancellation propagation.
4. Add regression tests for changed behavior; update stale fixtures without loosening production safety.
5. Complete remaining existing-rule measurement corrections and compatible local diagnostics.
6. Add only optional URL checks that fit the existing execution logic; honor all user corrections.
7. Update `v7/docs/runtime-architecture.md`, phase inventory and relevant existing backlog tickets.
8. Run quality gates from repository root:

```bash
npm run -w v7 typecheck
npm run -w v7 lint
npm run -w v7 test
npm run -w v7 build
```

Before build, inspect `v7/package.json` and scripts: prebuild bumps tracked version/rules JSON; build's `clean:dist` invokes `rm -rf dist .vite`, then verify/tests/e2e/zip. Respect never-delete by moving existing outputs to dated trash before cleanup or replacing cleanup with a trash-aware helper. Do not use destructive clean/reset to make tests pass. Verify generated version/inventory changes before commit.

Use targeted tests during implementation, then all required gates and controlled extension E2E. Commit logical finished units only after required gates; do not commit this incomplete tree as completed work. No public release/publish.

## Sources already checked during audit

- Chrome phase timing: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#run_time
- Google robots.txt matching/status semantics: https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec
- Robots protocol: https://www.rfc-editor.org/rfc/rfc9309.html
- Negotiated protocol evidence: https://www.w3.org/TR/resource-timing/#dom-performanceresourcetiming-nexthopprotocol
- Article fields and author arrays: https://developers.google.com/search/docs/appearance/structured-data/article
- Existing GSC response fields: https://developers.google.com/webmaster-tools/v1/urlInspection.index/UrlInspectionResult
- PSI field-data deprecation notice: https://developers.google.com/speed/docs/insights/v5/get-started

## Completion definition

The same engine runs correctly with honest evidence, all declared hreflang targets checked, only intensive internal-link status sampling, separate unsupported robots noindex reporting, and visible successful-copy feedback. Added checks remain inside existing rule execution. Required tests/build pass, docs match implemented bounds and behavior, and logical commits preserve closed-source/private handling.

## Completion record (2026-09-07)

Done, with gates green (`npm run -w v7 typecheck`, `lint`, 914/914 tests, `npm run -w v7 build` incl. e2e):

- Compiler/lint blockers cleared: narrow typed `documentId` reader for webRequest details, `prior?.manual`, `Headers.forEach` instead of `entries()`, unused `base` removed, `domFacts.collect.ts` split into `domFacts.scan.ts`, `redirectChain.ts` split into `redirectChain.walk.ts` + the public wrapper.
- Both new rules registered in `src/rules/registry.ts`: `dom:seo-phase-changes` (added to the `compare` set) and `robots:noindex-unsupported` (context via the `robots:` prefix). A third passive rule, `http:resource-delivery`, reports failed/uncompressed/uncacheable subresources over the observed ledger. `rules.inventory.json` regenerated (130 rules).
- Lifecycle: sessions carry a monotonic generation, so an older run cannot claim or abort a newer one; `finishSession` requires the run id; `markDomPhase` verifies document identity and waits for a slow static phase (watchdog at 8s) instead of finalizing without it; `collectPhaseResults` only publishes a capture whose whole chunk set arrived.
- Resource ledger completed: `resourceLedger.ts` merges full observations into bounded facts (1,000 URLs / 1 MB) with honest counters - `events`, `completed`, `errors`, retained facts, `droppedObservations`, `truncated`. Lifecycle callbacks are never counted as extra resources or drops. Wired through `page.enrich` into `Page.resourceFacts`/`resourceCoverage`.
- Header evidence: document headers come only from a `main_frame` response (no subresource fallback), URLs compare exactly apart from the fragment, repeated `X-Robots-Tag`/`Link` fields travel with their own response into `Page.responseHeaderFields`, and `Page.headerUrl` records which URL they belong to.
- Cancellation/bounds: `ctx.signal` now reaches robots.txt, sitemap-reference, complexity, gzip, soft404 and trailing-slash fetches; the page header probe is time-bounded and cancellable; `readBoundedText` bounds bodies and reports truncation instead of throwing away the distinction, so `robots:size` can report the 500 KiB limit Google reads without poisoning the shared fetch.
- `followRedirectChain` no longer buffers bodies the caller will discard; callers read bounded bodies themselves and cancel what they do not read.
- DOM facts: internal-link candidates are collected across the complete DOM and charged to a reserved 1,000-byte slice of the anchor pool; `baseUri` reaches `Page`; the FNV separator/multiplier typo is fixed and JSON-LD keeps raw text in fingerprints; `readability.ts` reuses `contentText`'s content-root selection.
- Performance: `getDomPath` walked `parent.children` by index (O(n^2) on large sibling lists) and the candidate pass built a DOM path for every provisional candidate. The full test suite hung indefinitely because of it; it now completes in ~25s. Paths are built only for the surviving five candidates.
- Honest classification fixes: soft-404 no longer calls a 429/5xx/unfollowable redirect a soft 404; `robots:size` reports "larger than the limit" rather than an exact size it never measured; `robotsTxt` shares one status reading with the other robots rules.

Still open, deliberately (not started, listed in the original plan as later steps):

- Remaining existing-rule measurement corrections: image-dimension heuristics, shared script classification, Article date/entity validation and the approved Article overlap consolidation, and the local heading/link/meta-refresh/base/language checks.
- The optional, disabled-by-default deeper URL checks (canonical destination health, hostname/protocol variants, cached sitemap inspection).
