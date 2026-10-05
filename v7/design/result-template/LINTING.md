# Presentation enforcement

The contract is implemented in `src/shared/presentation/schema.ts`; rule construction uses `createPresentation` / `presentResult`. A rule declares `presentation: 1` only after every branch has been migrated. The canonical rules registry remains the sole list of rules.

Run `npm run lint:presentation` from `v7/`; it also runs as part of `npm run lint` and the commit hook. Network access is disabled in its fixtures. It executes every migrated rule against absent, present, duplicate/empty, malformed, invalid-URL and large-capture fixtures. It does not make network requests.

The lint fails when:

- Any branch lacks a valid presentation, speaking name, input, labelled values or checked criteria.
- A value is an object/array rather than an explicitly selected scalar field.
- An original-data field lacks `complete-original` fidelity.
- A field asserted to be original does not equal a complete element retrieved from that fixture's DOM.
- Storage bounding changes a retained original value.
- Existing reference URLs are lost, reordered or replaced with a fallback.
- A reference is empty, invalid or uses an executable scheme.
- The rule still emits a generic legacy `details` payload.
- Captured markup is labelled with the wrong DOM lifecycle phase for its registered input.
- The result contains an unknown state or advice labels such as Fix, Interpretation or Next step.
- Copy output contains a fixture object-coercion dump or omits a reference.

The original-data tests additionally cover attributes and nested children, reconstructed compact documents, large source captures, full-element omission and independent plain-text title values. Schema negative cases cover invalid references, blank keys, object values and incomplete source markers.

This lint cannot prove that a rule's selector, algorithm or SEO criterion is correct. That requires manual inspection of each rule, its reference documents and its individual tests. A passing schema or generic fixture run never substitutes for that review. Do not migrate the remaining rules through a codemod or legacy-object adapter.

Headless browser verification must exercise the actual extension card and report, not only the standalone dummy: narrow layouts, reference and data links, labelled original fields, extracted title text, Details/Hide, keyboard menu, favorites, disabling, copy, clipboard fallback and the not-applicable filter.

Before each commit, run the repository's typecheck, ESLint, complete unit suite and extension build, including the headless browser suite. Preserve generated outputs in `trash/` before any build script cleans its output directories. The build and pre-commit hook both bump versions; follow the documented repository release procedure and verify the committed package version equals `dist/manifest.json`.

## Formatting test (FORMATTING.md, 2026-10-05)

`tests/formatting/formatting.test.ts` runs every registry rule the way the extension does (static/idle rules on the
live document, the rest on the page rebuilt from events) over five realistic pages in `tests/fixtures/formatting/`,
and asserts the mechanical rules F1-F14 of `FORMATTING.md` on the bounded presentation. Every violation is written to
`test-results/formatting-violations.md`. Every rule must pass (baseline 2026-10-05: 126 of 130 violated; now 0).
Fix loop for single rules: `FORMAT_RULES=head-canonical,head-hreflang npx vitest run tests/formatting`.
Shared helpers for doctrine-shaped output: `elementRecords` (records.ts), `tagLabel`, `urlComparison`, `recordCounts`,
`listRow` / `clip` (listRow.ts, the only list-summary row).
