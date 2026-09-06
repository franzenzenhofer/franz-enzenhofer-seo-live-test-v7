# Bounded Runtime Architecture

The browser pipeline never serializes complete page HTML. At `document_end` and `document_idle`, the content scripts first ask the service worker to authorize the capture - the sender must be the ACTIVE tab's current top-frame document, its URL must be http(s) and not blocklisted, and either auto-run is on or a one-shot manual intent is pending - and only then run the matching typed rules sequentially against the live `Document`. They emit bounded results plus phase-specific facts. Inactive tabs stop before DOM traversal, remote probes, or API work.

## Runtime contracts

- Phase messages are validated at the service-worker boundary, forbid a top-level `html` field, and must be at most 32,000 UTF-8 bytes.
- Result chunks target 20,000 bytes. Each result message is capped at 2,000 characters; details are capped at 8,192 bytes and evidence arrays at 10 entries.
- Phase messages carry a versioned capture identity (`version: 1`, `captureId`, `phase`, `url`, `capturedAt`, `chunkCount`). The service worker rejects a message that fails the schema, contradicts its lifecycle event, arrives out of order, or comes from a document that is not the authorized one. Result chunks only count once a capture's whole chunk set has arrived.
- DOM facts retain exact counters while sampling evidence: 12 parameterized links, at most 150 head elements, 10 anchors, 20 resource elements, 12 attributes per element, and 512 characters per attribute value. The evidence pools are measured in UTF-8 bytes: 24,000 general, of which the head may use 20,000, plus a separate 2,000-byte anchor pool so a fat head cannot starve body anchors.
- The intensive internal-link status check picks up to five unique internal URLs across the COMPLETE DOM (bottom-k URL hash), reserving 1,000 bytes of the anchor pool before display anchors are budgeted. It is the only check that samples. Every declared hreflang target is checked, deduplicated by URL, two requests at a time - never sampled.
- LD+JSON input is capped at 1 MB and 1,000 flattened nodes. A breach becomes a rule-scoped `runtime_error`; other rules continue.
- Non-resource run events retain the latest 64 records. Resource observations flush every 50 events into a bounded ledger of at most 1,000 distinct URLs and 1 MB. The ledger counts `events` (webRequest callbacks), `completed` and `errors` (terminal observations), the retained URL facts, and `droppedObservations` - terminal observations whose URL did not fit. Several callbacks for one request are one resource and never a drop; once `truncated` is true the real number of distinct URLs is unknown and is reported as such.
- Document headers come only from a `main_frame` response; a subresource's headers are never applied to the page, and URLs are compared exactly apart from the fragment. Repeated indexing fields (`X-Robots-Tag`, `Link`) travel with the same response they were received on.
- Remote probes hold at most two concurrent slots per origin. A 429, or a 503 with `Retry-After`, stops queued probes for at least a minute with no automatic retry. Shared fetches are single-flight per URL with independent per-caller cancellation, and response bodies are read under a byte bound - robots.txt at the 512,000 bytes Google itself reads, HTML at 1 MB - with truncation reported rather than hidden.
- Normal logs retain 200 entries. Debug logging defaults off; warnings, errors, crashes, aborts, and run summaries remain available.
- Result storage retains the latest three runs, has a 2 MB soft target and an 8 MB hard refusal limit. A quota error retries without `details`, preserving every core result.
- Tab closure clears alarms, run state, session facts, logs, ledgers, and pending rows. Closed-tab result keys use a 20-entry LRU.

## Execution ownership

The content scripts own live static and idle DOM rules. The offscreen document owns typed context and cross-phase rules using compact facts and network/navigation records. It creates at most one compact static-fact document; idle facts remain typed data. The service worker collects and coordinates but never evaluates rule strings or holds DOMs.

The CLI parses its supplied HTML once. It runs static and context rules against that document; browser-only idle and comparison rules return explicit unavailable results. Rule IDs, ordering, flags, and the `results:<tabId>` contract remain shared with the extension.

Navigation starts a new session, aborts stale rule work, and clears prior session state. Sessions carry a monotonic run generation: an older run that resolved its page URL late cannot claim the tab from - or abort - the newer run that overtook it, and a superseded run can neither settle the session nor write results. The finalizer checks the tab again before offscreen execution, so an audit cannot continue after its tab becomes inactive. An idle phase whose document identity no longer matches the run is ignored, and when idle completes before a slow static phase the finalize waits for the static completion instead of dropping its rules.
