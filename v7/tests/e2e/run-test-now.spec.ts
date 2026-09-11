import { expect, test } from '@playwright/test'
import type { BrowserContext, Page, Worker } from '@playwright/test'

import { extensionWorker, findExtensionId, withExtension } from './extensionHarness'

/**
 * Issue #1 regression: clicking Run test must show a starting state at once,
 * load the page exactly ONCE, produce the first pending row quickly and settle -
 * with auto-run on and off, over several clicks, never a blank or lost run.
 * Measured on 7.0.207: first row after ~8.3 s or never; auto-run off: never.
 */
const TARGET = 'https://example.com/'
const CLICKS = 3
const FIRST_ROW_BOUND_MS = 3_000
const STARTING_BOUND_MS = 1_500
const SETTLE_BOUND_MS = 60_000

type Snap = { rows: number; pending: number; status: string; commits: number }
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const snapshot = (worker: Worker, tabId: number) => worker.evaluate(async (id: number): Promise<Snap> => {
  const stored = await chrome.storage.local.get([`results:${id}`, `results-meta:${id}`])
  const rows = (stored[`results:${id}`] || []) as Array<{ type: string }>
  const meta = stored[`results-meta:${id}`] as { status?: string } | undefined
  const commits = ((globalThis as unknown as { __commits?: number[] }).__commits || []).filter((tab) => tab === id).length
  return { rows: rows.length, pending: rows.filter((r) => r.type === 'pending').length, status: meta?.status || 'none', commits }
}, tabId)

const armCommitProbe = (worker: Worker) => worker.evaluate(() => {
  const global = globalThis as unknown as { __commits?: number[] }
  global.__commits = []
  chrome.webNavigation.onCommitted.addListener((event) => { if (event.frameId === 0) global.__commits!.push(event.tabId) })
})

const resetCommitProbe = (worker: Worker) => worker.evaluate(() => { (globalThis as unknown as { __commits?: number[] }).__commits = [] })

const openPanel = async (context: BrowserContext, userDataDir: string) => {
  const extensionId = await findExtensionId(context, userDataDir)
  const panel = await context.newPage()
  await panel.setViewportSize({ width: 420, height: 900 })
  await panel.goto(`chrome-extension://${extensionId}/src/sidepanel.html`, { waitUntil: 'load' })
  return panel
}

const clickRunTest = (panel: Page) => panel.getByRole('button', { name: 'Run test', exact: true }).click()

const measureClick = async (worker: Worker, panel: Page, tabId: number) => {
  await resetCommitProbe(worker)
  const t0 = Date.now()
  await clickRunTest(panel)
  const marks: Record<string, number> = {}
  const mark = (name: string) => { if (marks[name] === undefined) marks[name] = Date.now() - t0 }
  let sawBlankPrompt = false
  let sawStartingUi = false
  while (Date.now() - t0 < SETTLE_BOUND_MS) {
    const snap = await snapshot(worker, tabId)
    if (snap.status === 'starting') mark('starting')
    if (snap.pending > 0) mark('firstPending')
    if (await panel.getByText('No results yet').count()) sawBlankPrompt = true
    if (await panel.getByTestId('run-starting').count()) sawStartingUi = true
    if (marks.firstPending !== undefined && snap.pending === 0 && (snap.status === 'completed' || snap.status === 'error')) {
      mark('settled')
      return { marks, sawBlankPrompt, sawStartingUi, commits: snap.commits }
    }
    await wait(100)
  }
  return { marks, sawBlankPrompt, sawStartingUi, commits: (await snapshot(worker, tabId)).commits }
}

const runScenario = async (autoRun: boolean) => {
  test.setTimeout(240_000)
  const { context, userDataDir, cleanup } = await withExtension()
  try {
    const page = await context.newPage()
    await page.goto(TARGET, { waitUntil: 'load' })
    const worker = await extensionWorker(context)
    if (!worker) throw new Error('extension worker not found')
    const tabId = await worker.evaluate(async (url: string) => (await chrome.tabs.query({ url })).find((tab) => tab.id)?.id as number, TARGET)
    expect(tabId).toBeGreaterThan(0)
    await expect.poll(async () => (await snapshot(worker, tabId)).status, { timeout: 60_000 }).toBe('completed')
    await worker.evaluate(async (value: boolean) => { await chrome.storage.local.set({ 'ui:autoRun': value }) }, autoRun)
    await armCommitProbe(worker)
    const panel = await openPanel(context, userDataDir)
    await page.bringToFront()
    await expect(panel.getByRole('button', { name: 'Run test', exact: true })).toBeVisible({ timeout: 20_000 })

    for (let click = 1; click <= CLICKS; click++) {
      const { marks, sawBlankPrompt, sawStartingUi, commits } = await measureClick(worker, panel, tabId)
      console.log(`[run-test-now] autoRun=${autoRun} click=${click} starting=${marks.starting}ms firstPending=${marks.firstPending}ms settled=${marks.settled}ms commits=${commits} startingUi=${sawStartingUi}`)
      expect(marks.starting, 'starting state written').toBeLessThan(STARTING_BOUND_MS)
      expect(marks.firstPending, 'first pending row').toBeLessThan(FIRST_ROW_BOUND_MS)
      expect(marks.settled, 'run settled').toBeLessThan(SETTLE_BOUND_MS)
      expect(commits, 'exactly one document load per click').toBe(1)
      expect(sawBlankPrompt, 'panel never asks the user to click Run test during the run').toBe(false)
      expect(sawStartingUi, 'panel showed the starting state').toBe(true)
      await expect(panel.getByRole('button', { name: 'Run test', exact: true })).toBeEnabled()
      await wait(500)
    }
  } finally {
    await context.close()
    cleanup()
  }
}

test.describe('Run test now (issue #1)', () => {
  test('auto-run on: one load, immediate starting state, first row < 3 s, settles - 3 clicks', () => runScenario(true))
  test('auto-run off: the manual run still happens - 3 clicks', () => runScenario(false))
})
