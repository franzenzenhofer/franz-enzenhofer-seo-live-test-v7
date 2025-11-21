# Storage quota blow-up dropped results (hard fix)

## What happened
- Side panel showed only 1/103 results after heavy pages and hard reloads.
- chrome.storage.local `set` failed on oversized payload; previous fallback replaced merged results with the last chunk, so the current run looked empty.

## Root cause (7 whys distilled)
1. Panel showed 1/103 because stored array was overwritten with a single chunk.
2. Overwrite happened because persistResults caught storage errors and wrote only the last chunk.
3. Storage errored because the results payload exceeded chrome.storage.local limits (~5MB without unlimitedStorage).
4. Payload was huge due to full PSI API blobs and large HTML/sourceHtml blobs (64KB cap per rule) across ~103 rules and two runs.
5. UI filters by runId, so clobbered arrays became “Missing 102”.
6. Navigation cleanup made stale runs disappear, exposing the bad fallback instead of masking it.
7. No tests covered storage failures, so fallback remained destructive.

## Fix implemented
- Remove destructive fallback: persistResults now size-checks and throws; no overwrite on failure.
- Guard payload size: 4MB limit per stored results array; previous data remains intact on violation.
- Trim payloads: PSI rules now store only scores/metrics (no API blobs); HTML truncation limit lowered to 12KB to avoid massive embeds.
- Permission: added `unlimitedStorage` for headroom while keeping the guard.
- Tests: added coverage for persistResults failure/oversize and PSI summarization; full gates + e2e quick pass.

## Follow-ups / watch points
- Monitor logs for `runner:persist-error` to confirm size guard never triggers in normal runs.
- If guard triggers, consider further trimming rule-specific details before raising the limit.
