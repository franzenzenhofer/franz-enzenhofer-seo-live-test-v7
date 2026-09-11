# Handover - result presentation migration (completed 2026-09-11)

## Result

- All 130 rules in `v7/src/rules/registry.ts` emit the evidence-first presentation contract (`presentation: 1`).
  The presentation lint confirms it: "Presentation lint passed: 130 manually migrated rules, 780 fixture executions".
- Codex migrated 22 rules; Claude Code migrated the other 108 in 92 rule commits (88 single rules plus 4 factory
  commits: schema 13, robots meta 3, robots number 2, robots restriction 2), each with its own full build.
- `main` is not pushed. The final build and committed `v7/package.json` versions are equal (checked by the commit script).
- Load the extension unpacked from `v7/out/tester-build/` (stable copy of the last verified `dist/`) or use
  `v7/zip-build/latest-build.zip`.

## What changed for users

- Every result card shows: speaking name, the input actually checked, labelled factual values, status colour and icon;
  details with the checked selectors/headers/criteria, individually named evidence records, complete original markup
  only in read-only fields, documentation links, and a labelled technical footer. No advice or interpretation text.
- `Selector` always means the CSS selector the rule queried; a found element's location is a `DOM path`, shown
  shortened (start ... end) with an Expand/Collapse button; Copy always contains the full path.
- The "capture failed: Event does not match current capture" error no longer appears: stale network events from a
  previous page or a finished audit are dropped and logged to the tab log instead of thrown.
- Requests made inside iframes now count as the page's resources (they were silently dropped before).

## How it was done

- 11 Sonnet agents prepared hand-made patches per rule in isolated scratch copies, starting from Codex's drafts where
  they existed. 5 reviewers checked every patch (branch type/priority table, meta/userGuide untouched, label, accurate
  input, no advice in values, links only for http(s), `DOM path` vs `Selector`, bounded evidence, markup only via
  `markupEvidence`, test coverage incl. other tests, stray content, apply check) and delivered verified fixups.
- A build queue applied each reviewed patch and fixup and ran `npm run build` (typecheck, eslint, presentation lint,
  vite build, unit suite, headless e2e, zip) before every single commit. A dry replay of all remaining entries
  proved the 130/130 end state before the queue reached it.
- Records: `v7/design/result-template/MIGRATION.md` (table of every rule commit) and `trash/migration-work-20260911/`
  (brief, queue, reviewer verdicts, frozen patches). Codex drafts: `trash/codex-migration-patches-20260911/`.

## Honest notes

- Two commit subjects are malformed ("refactor(rules): migrate (fix)/(feat) ... presentation") for `1f43fbc` and
  `888a7a8`; the content is correct and history was not rewritten.
- Six builds had an e2e-only failure under heavy CPU load and passed on their single automatic rebuild (mostly
  `tests/e2e/actionable-http.spec.ts`). One real e2e failure (the mixed-content card rewrite clicked "Details",
  but the report renders cards expanded) was diagnosed and fixed before its commit.
- Background builds on this Mac were killed three times for low memory; the last entries ran in the foreground.
- Kept on purpose: `html-utils.ts` (still imported) and the legacy card path for non-rule results.
- The computer was not shut down: that instruction was given to Codex, not in this session.

## Verify

```
cd v7 && npm run typecheck && npm run lint && npm test && npm run build
```
