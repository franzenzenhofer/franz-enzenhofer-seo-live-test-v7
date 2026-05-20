// B1 - Heap soak. Opens a page that matches the extension's <all_urls>
// content script, samples its JS heap (which includes the extension's
// content-script bundle), waits the soak period, then samples again.
// Budget: heap growth <= 1 MB over the soak window.

import { launchExtension } from './launchExtension'
import type { AuditFinding, AuditReport } from './contract'

const HEAP_GROWTH_BUDGET_BYTES = 1_024 * 1024 // 1 MB per the plan
const TEST_URL = 'https://example.com/'

type Memory = { usedJSHeapSize: number; totalJSHeapSize: number }

const measureHeap = async (page: import('@playwright/test').Page): Promise<Memory> => {
  return await page.evaluate(() => {
    const m = (performance as unknown as { memory?: Memory }).memory
    return m ? { usedJSHeapSize: m.usedJSHeapSize, totalJSHeapSize: m.totalJSHeapSize } : { usedJSHeapSize: 0, totalJSHeapSize: 0 }
  })
}

export const runB1 = async (soakSeconds: number): Promise<AuditReport> => {
  const startedAt = new Date().toISOString()
  const { context, close } = await launchExtension()
  const findings: AuditFinding[] = []
  let blocking = false
  let metrics: AuditReport['metrics'] = {}
  try {
    const page = await context.newPage()
    await page.goto(TEST_URL, { waitUntil: 'load', timeout: 15_000 })
    await page.waitForTimeout(1500)
    const m0 = await measureHeap(page)
    await page.waitForTimeout(soakSeconds * 1000)
    const m1 = await measureHeap(page)
    const growth = m1.usedJSHeapSize - m0.usedJSHeapSize
    metrics = { initialHeap: m0.usedJSHeapSize, finalHeap: m1.usedJSHeapSize, growthBytes: growth, soakSeconds, budgetBytes: HEAP_GROWTH_BUDGET_BYTES, testUrl: TEST_URL }
    if (m0.usedJSHeapSize === 0) {
      findings.push({ id: 'heap.no-memory-api', severity: 'P3', evidence: 'performance.memory unavailable; need --enable-precise-memory-info', fix: 'launchExtension already sets the flag; check Chrome version.' })
    } else if (growth > HEAP_GROWTH_BUDGET_BYTES) {
      blocking = true
      findings.push({ id: 'heap.growth.over-budget', severity: 'P1', evidence: `growth=${growth}B over ${soakSeconds}s, budget=${HEAP_GROWTH_BUDGET_BYTES}B`, fix: 'Investigate detached DOM / closure leaks via DevTools heap snapshots.' })
    }
    await page.close()
  } finally { await close() }
  return { agent: 'b1-heap-soak', summary: blocking ? 'heap growth exceeds budget' : 'heap growth within budget', findings, metrics, blocking, startedAt, finishedAt: new Date().toISOString() }
}
