// B2 - Performance trace. Loads the extension, navigates to a test page,
// records long tasks (>50 ms) observed in the content-script realm via
// PerformanceObserver. The plan budget is 0 long tasks per task in the
// content script.

import { launchExtension } from './launchExtension'
import type { AuditFinding, AuditReport } from './contract'

const LONG_TASK_BUDGET_MS = 50

interface LongTask { duration: number; startTime: number }

export const runB2 = async (): Promise<AuditReport> => {
  const startedAt = new Date().toISOString()
  const { context, close } = await launchExtension()
  const findings: AuditFinding[] = []
  let blocking = false
  let metrics: AuditReport['metrics'] = {}
  try {
    const page = await context.newPage()
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded' })
    const longTasks = await page.evaluate(() => new Promise<LongTask[]>((resolve) => {
      const tasks: LongTask[] = []
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((e) => tasks.push({ duration: e.duration, startTime: e.startTime }))
      })
      try { observer.observe({ entryTypes: ['longtask'] }) } catch { resolve([]); return }
      setTimeout(() => { observer.disconnect(); resolve(tasks) }, 5_000)
    }))
    const worst = longTasks.reduce((m, t) => Math.max(m, t.duration), 0)
    metrics = { longTaskCount: longTasks.length, longestMs: Math.round(worst), budgetMs: LONG_TASK_BUDGET_MS }
    if (worst > LONG_TASK_BUDGET_MS) {
      blocking = true
      findings.push({ id: 'perf.long-task', severity: 'P1', evidence: `worst long task ${Math.round(worst)} ms (budget ${LONG_TASK_BUDGET_MS} ms)`, fix: 'Defer heavy sync work to a Web Worker or chunk via requestIdleCallback.' })
    }
    await page.close()
  } finally { await close() }
  return { agent: 'b2-perf-trace', summary: blocking ? 'long tasks exceed 50 ms budget' : 'main thread within budget', findings, metrics, blocking, startedAt, finishedAt: new Date().toISOString() }
}
