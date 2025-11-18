# (Deprecated) Best Practice Rules

> Archived on 2025-03-17 when the `bestPractice` flag and UI treatment were removed from the live test extension. Keeping the original notes here for historical context only.

Best practice rules surface high-signal checks that remain useful even when they succeed. They focus on sharing the raw HTML/HTTP context so reviewers can confirm implementation quality without digging through DevTools.

## Why the Flag Exists

- The side panel auto-expands best practice cards, keeps DOM highlights active, and copies richer payloads.
- Each rule must expose `snippet`, `sourceHtml`, and either `domPath` or `domPaths` so the UI can show the raw markup next to the new DOM path badge.
- Results stay in the main stream — we **never** duplicate entries — but the badge and detail pane make it obvious which passes are worth celebrating.

## Current Best Practice Inventory

| Rule ID | Name | Layer | Focus | Details Provided |
| --- | --- | --- | --- | --- |
| `body:h1` | H1 Present | static | Ensures exactly one meaningful `<h1>` | Source HTML, cleaned snippet, DOM paths |
| `head-title` | SEO Title Present | static | Title exists and can be highlighted even when OK | Source HTML, snippet, DOM path, reference |
| `head-meta-description` | Meta Description | static | Confirms single, non-empty description | Snippet/content, DOM path(s), reference |
| `head:meta-viewport` | Meta Viewport | static | Valid responsive viewport settings | Snippet, source HTML, DOM path |
| `http:gzip` | Gzip/Brotli | http | Compression headers validated | Captured response headers, Lighthouse reference |

> ⚠️ Keep the list tight. If a result needs deeper manual inspection even on success, it probably deserves the badge. Otherwise, leave it as a regular rule.

## Implementation Checklist

1. Set `bestPractice: true` in the rule definition (`Rule` type now includes the flag).
2. Populate `details.snippet`, `details.sourceHtml`, and at least one DOM selector (`domPath` or `domPaths`).
3. Include a `reference` URL whenever possible so the copy-to-markdown payload stays actionable.
4. Add the rule to the table above in this file to keep humans aligned.
5. Run `npm run -w v7 rules:json` so `rules.inventory.json` exports the updated metadata.

## Rule Timeouts & Async Execution

- **Default:** Each rule now runs asynchronously with a baseline `15s` timeout so fast DOM checks never wait for API calls.
- **API-heavy rules:** Annotate long-lived checks with `timeout: { mode: 'api' }` (or set `timeoutMs`) to grant `60s` while other rules continue streaming results.
- **Multi-page crawls:** Use `timeout: { mode: 'multipage' }` for workflows that chase multiple URLs; these get up to `10 min` before the scheduler aborts them.
- **Custom duration:** When a rule needs a bespoke ceiling, set `timeout: { timeoutMs: 30000 }` (values are clamped between `1s` and `10 min`).
- **Documentation:** Mention the timeout rationale in the rule’s README/comment so reviewers know why it diverges from the default.
- **Behavior:** Background runner cancels the entire run if the active tab reloads, guaranteeing the side panel only shows results from the current `{tabId, runId}` pair.

## UI Guarantees

- **Auto-expansion:** best practice cards open by default so snippet + DOM path + highlight show immediately.
- **Badge + Callout:** both the header and body include a “Best Practice” label, making the status obvious even for passing checks.
- **DOM Highlight:** `domPath`/`domPaths` selectors are sent to the content script so the active element flashes in-page whenever the card is open.
- **Copy Payload:** exports now include a `Best Practice: ✅` line, keeping bug tickets consistent.

## Adding a New Best Practice

1. Confirm the rule is non-blocking but still warrants manual review when it passes.
2. Ensure the rule’s logic can provide the required markup selectors.
3. Implement the flag + details, update tests/documentation, and run the full quality gate (`npm run -w v7 typecheck && npm run -w v7 lint && npm run -w v7 test && npm run -w v7 build`).
4. Update this file, `AGENTS.md`, and `v7/CLAUDE.md` if expectations change.
