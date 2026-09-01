# Perf / contract probes

Run from `v7/`.

| script | what it answers |
|---|---|
| `npx tsx scripts/perf/timeRules.ts <url>` | Per-rule wall-clock against a real URL. Shows which rules dominate a run. |
| `npx tsx scripts/perf/factsBudgetCheck.ts` | Whether bounded DOM facts for real sites stay inside the 32 KB phase-message contract, and whether canonical / robots metas survive collection. |

`timeRules.ts` is how the PageSpeed rules were identified as 99% of run time
(3 API rules, ~20 s each; every other rule is single-digit ms).
