# TICKET-002 – Status Label Alignment & Rule Count Consistency

## Context

- Rule registry + `rules.inventory.json` both list **100 rules**, but the settings search placeholder still says “Search 101 rules...” (`v7/src/settings/RuleToggles.tsx`).
- Result badges/filters labelled `error` and `failed` in different ways (`runtime_error` chips showed “failed” while actual `error` chips showed “error”), causing confusion in the side panel screenshot.
- Result status plumbing exposes `pending`/`disabled`, and we now seed pending placeholders before the offscreen run so counts stay accurate while rules execute.
- Background/offscreen typings (`v7/src/background/rules/types.ts`) still only allow `info|ok|warn|error`, so TypeScript can’t express `runtime_error`/`disabled` items we now persist.

## Actions Just Completed

1. Introduced `resultTypeLabels` + `resultTypeOrder` in `v7/src/shared/colors.ts` so every UI can source consistent labels, colors, and priority.
2. Updated side panel filters (`v7/src/sidepanel/ui/TypeFilters.tsx`) and query parser (`v7/src/sidepanel/ui/useFilterParser.ts`) to display `runtime_error` as “error”, `error` as “failed”, and to treat user-entered “error”/“failed” keywords as the correct underlying types.
3. Aligned report components (`v7/src/report/ResultBadges.tsx`, `v7/src/report/ReportSection.tsx`) with the shared labels so report headers/badges mirror the side panel counts.
4. Implemented real pending state: background seeds placeholders via `v7/src/background/rules/pending.ts`, offscreen respects rule toggles, and `persistResults` drops placeholders when final data arrives.
5. Expanded `RuleResult` types + offscreen runner plumbing so disabled/runtime_error/pending entries flow end-to-end without type gaps.

## Follow-Ups

- [x] Fix the stale placeholder text in `v7/src/settings/RuleToggles.tsx` so it reflects `rulesInventory.length`.
- [x] Surface mismatched totals directly in the side panel filter badges (`v7/src/sidepanel/ui/TypeFilters.tsx`) so users immediately see how many rules are missing even if only a subset of results landed; consider mirroring this treatment in the report header later if duplication concerns are resolved.
