# Best Practice Rules

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
