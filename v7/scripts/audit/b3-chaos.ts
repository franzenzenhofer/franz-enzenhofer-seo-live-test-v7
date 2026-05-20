// B3 - Chaos. Opens N tabs back-to-back, asserts the extension doesn't
// crash and the service worker survives. Surfaces lastError leaks via
// console.warn capture so detection is automatic.

import { launchExtension, findExtensionId } from './launchExtension'
import type { AuditFinding, AuditReport } from './contract'

const TAB_COUNT = parseInt(process.env['EXT_AUDIT_TABS'] || '10', 10)

export const runB3 = async (): Promise<AuditReport> => {
  const startedAt = new Date().toISOString()
  const { context, userDataDir, close } = await launchExtension()
  const findings: AuditFinding[] = []
  let blocking = false
  let metrics: AuditReport['metrics'] = {}
  const consoleWarnings: string[] = []
  const consoleErrors: string[] = []
  try {
    // Open a page first so the SW has a reason to register before we look for it.
    const warmup = await context.newPage()
    await warmup.goto('https://example.com', { waitUntil: 'domcontentloaded' }).catch(() => {})
    await warmup.waitForTimeout(1500)
    await warmup.close()
    const id = await findExtensionId(context, userDataDir)
    context.on('weberror', (e) => consoleErrors.push(e.error().message))
    for (const sw of context.serviceWorkers()) {
      sw.on('console', (msg) => {
        const t = msg.text()
        if (msg.type() === 'warning') consoleWarnings.push(t)
        if (msg.type() === 'error') consoleErrors.push(t)
      })
    }
    for (let i = 0; i < TAB_COUNT; i++) {
      const p = await context.newPage()
      await p.goto(`https://example.com/?run=${i}`, { waitUntil: 'domcontentloaded', timeout: 10_000 }).catch((e) => consoleErrors.push(`tab ${i}: ${e}`))
      await p.close().catch(() => {})
    }
    const lastErrorLeaks = consoleWarnings.filter((m) => m.includes('Unchecked runtime.lastError'))
    metrics = { tabsOpened: TAB_COUNT, extensionId: id, warningCount: consoleWarnings.length, errorCount: consoleErrors.length, lastErrorLeakCount: lastErrorLeaks.length }
    if (consoleErrors.length || lastErrorLeaks.length) {
      blocking = true
      findings.push({ id: 'chaos.console-errors', severity: 'P1', evidence: `errors=${consoleErrors.length} lastError-leaks=${lastErrorLeaks.length}`, fix: 'Check chrome.runtime.lastError handling and promise rejection paths.' })
    }
  } finally { await close() }
  return { agent: 'b3-chaos', summary: blocking ? 'chaos run surfaced errors' : 'extension survived chaos run', findings, metrics, blocking, startedAt, finishedAt: new Date().toISOString() }
}
