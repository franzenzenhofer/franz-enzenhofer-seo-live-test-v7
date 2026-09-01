# Perf / contract probes

Run from `v7/`.

## Rule timing

| script | what it answers |
|---|---|
| `npx tsx scripts/perf/timeRules.ts <url>` | Per-rule wall clock against a real URL. Names the rules that dominate a run. |
| `npx tsx scripts/perf/factsBudgetCheck.ts` | Whether bounded DOM facts for real sites stay inside the 32 KB phase-message contract, and whether canonical / robots metas survive collection. |

## In-browser diagnostics (Playwright, need `npm run build:dev` first)

| command | what it answers |
|---|---|
| `LT_TIMELINE=1 LT_TARGET_URL=<url> npx playwright test tests/e2e/phase-timeline.spec.ts --project=chromium` | When each rule resolves, and **names** whatever is still pending at each sample. This is the tool that proves "is it stuck, or just slow?". |
| `LT_CADENCE=1 LT_TARGET_URL=<url> npx playwright test tests/e2e/append-cadence.spec.ts --project=chromium` | Storage write cadence and results payload size - median/max gap between persists. |
| `LT_LIVE_PROGRESS=1 LT_TARGET_URL=<url> npx playwright test tests/e2e/live-progress.spec.ts --project=chromium` | End-to-end UI check with screenshots into `test-results/live-progress/`. |

These are opt-in behind env vars on purpose: they drive live sites and the
PageSpeed API for minutes, and running them alongside the normal e2e specs
starved those specs' 30 s polls and made the suite flake.

### Harness trap

Do **not** open the side panel as a browser tab in a diagnostic. It steals
focus from the page, the runner skips inactive tabs, and the run repeats
without the content-script phase events - which reports phantom pending
`static` rules. Keep the target page active.

## Baselines on https://orf.at/stories/3440788/

Measured 2026-09-01, unauthenticated GSC (so GSC rules fail fast):

| checkpoint | before the pipeline fixes | after |
|---|---|---|
| 1.1 s | 0 / 127 | 66 / 127 |
| 3.1 s | 42 / 127 | 124 / 127 |
| 30 s | 43 / 127 (66 parked behind PageSpeed) | only PageSpeed outstanding |
| settle | ~36 s | ~33 s |

Rule cost is dominated by PageSpeed: 3 PSI rules take ~14-20 s each, while all
87 other runnable rules together take 0.4 s.
