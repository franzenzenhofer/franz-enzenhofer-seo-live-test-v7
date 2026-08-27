# Rule Phase Inventory

`src/rules/registry.ts` is the only rule list. `src/rules/ruleInputs.ts` assigns every registered rule one explicit input. This document summarizes that executable mapping; tests require every registry entry to resolve to exactly one phase.

| Input | Execution | Rule families |
| --- | --- | --- |
| `static` | Live `document_end` DOM | Title, description, robots, canonical, hreflang, Open Graph, H1, internal/parameterized links, blocking scripts, preload, preconnect, DNS prefetch, and other default DOM/head rules |
| `idle` | Live `document_idle` DOM | Keywords, viewport, alternate media, nofollow, image checks, insecure inputs, LD+JSON/schema, Discover DOM checks, top words, node count/depth, AMP cache URL, and first paint |
| `compare` | Offscreen over typed static/idle facts | Client-side rendering, parameterized-link differences, and unavailable-after comparison |
| `context` | Offscreen over network/navigation data and compact static facts | HTTP, URL, robots.txt, PSI, GSC, Google connection, debug summaries, multipage and canonical/navigation checks |

Static and idle phases never substitute for one another. Missing facts produce a rule-scoped `runtime_error`. A comparison that needs an exact set also returns unavailable when its sampled evidence is truncated; it never reports equality from incomplete data.

Displayed evidence is sampled, while finding counts and severities remain exact. Evidence details disclose `total` or `count`, `shown`, and `truncated` where sampling occurs. Context rules that require a complete compact DOM are skipped when fact buckets truncate and receive an explicit unavailable result during final merging.

The legacy MV2 inventory remains in [legacy-rule-inventory.md](legacy-rule-inventory.md) for parity research only. Production imports only typed v7 modules.
