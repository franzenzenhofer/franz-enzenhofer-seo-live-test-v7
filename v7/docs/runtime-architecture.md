# Bounded Runtime Architecture

The browser pipeline never serializes complete page HTML. At `document_end` and `document_idle`, the content scripts first confirm that their sender tab is active, then run the matching typed rules sequentially against the live `Document`. They emit bounded results plus phase-specific facts. Inactive tabs stop before DOM traversal, remote probes, or API work.

## Runtime contracts

- Phase messages are validated at the service-worker boundary, forbid a top-level `html` field, and must be at most 32,000 UTF-8 bytes.
- Result chunks target 20,000 bytes. Each result message is capped at 2,000 characters; details are capped at 8,192 bytes and evidence arrays at 10 entries.
- DOM facts retain exact counters while sampling evidence: 12 parameterized links, at most 40 head elements, 10 anchors, 20 resource elements, 12 attributes per element, and 512 characters per attribute value. The element-fact budget is 14,000 characters.
- LD+JSON input is capped at 1 MB and 1,000 flattened nodes. A breach becomes a rule-scoped `runtime_error`; other rules continue.
- Non-resource run events retain the latest 64 records. Resource events flush every 50 observations, retain at most 1,000 unique URLs, and preserve exact `total` and `dropped` counters.
- Normal logs retain 200 entries. Debug logging defaults off; warnings, errors, crashes, aborts, and run summaries remain available.
- Result storage retains the latest three runs, has a 2 MB soft target and an 8 MB hard refusal limit. A quota error retries without `details`, preserving every core result.
- Tab closure clears alarms, run state, session facts, logs, ledgers, and pending rows. Closed-tab result keys use a 20-entry LRU.

## Execution ownership

The content scripts own live static and idle DOM rules. The offscreen document owns typed context and cross-phase rules using compact facts and network/navigation records. It creates at most one compact static-fact document; idle facts remain typed data. The service worker collects and coordinates but never evaluates rule strings or holds DOMs.

The CLI parses its supplied HTML once. It runs static and context rules against that document; browser-only idle and comparison rules return explicit unavailable results. Rule IDs, ordering, flags, and the `results:<tabId>` contract remain shared with the extension.

Navigation starts a new session, aborts stale rule work, and clears prior session state. The finalizer checks the tab again before offscreen execution, so an audit cannot continue after its tab becomes inactive.
