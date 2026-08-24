# TICKET-008: Restore Rule Phase Parity and Bound Evidence

**Status:** Open  
**Priority:** High  
**Type:** Rule correctness  
**Depends on:** TICKET-007

## Problem

Several migrated rules use the static DOM even though their legacy behavior is idle, and the client-side-rendering implementation no longer performs a phase comparison. Many rules also materialize complete node arrays or DOM-path lists only to display a short snippet.

## Implementation

- Treat the legacy source as authoritative for phase mapping.
- Static families include title, description, robots, canonical, hreflang, Open Graph, H1, internal links, blocking scripts, and preload.
- Idle families include keywords, viewport, alternate media, nofollow, linked images, insecure inputs, LD+JSON, top words, node count, and node depth.
- Cross-phase families include parameterized-link differences, unavailable-after signals, blocked resources, and client-side-rendering analysis.
- Client-side rendering uses streamed fetched-response metrics plus document-end and idle metrics without retaining the fetched body.
- Replace unbounded `Array.from`, DOM-path creation, `outerHTML` joins, and full `innerText` normalization with shared iterators, counters, and bounded evidence helpers.
- Preserve exact counts and severities. Sampling applies only to displayed evidence and is disclosed with `total`, `shown`, and `truncated` fields.
- Oversized or unparseable individual inputs, such as extreme JSON-LD, produce a rule-scoped runtime result rather than terminating the run.

## TDD Sequence

### Red

1. Add static, idle, and cross-phase parity fixtures for every legacy family listed above.
2. Add focused red tests for idle node count/depth, LD+JSON, nofollow, viewport, and parameterized-link differences.
3. Add client-side-rendering tests covering server, static, and hydrated content changes.
4. Add evidence tests with more than 10 matching elements and oversized markup.

### Green

Correct one rule family at a time. Run its focused tests before moving to the next family, then run the full suite, typecheck, and lint.

## Acceptance Criteria

- No idle-derived rule silently reads static DOM.
- No comparison rule treats missing phase data as equality.
- Findings and total counts remain correct when evidence is truncated.
- A single pathological rule input cannot crash or block other rules.
- Typecheck, lint, and all tests pass.

