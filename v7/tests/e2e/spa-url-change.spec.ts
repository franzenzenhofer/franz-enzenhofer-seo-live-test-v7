import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'

import { expect, test } from '@playwright/test'
import type { BrowserContext, Page, Worker } from '@playwright/test'

import { extensionWorker, findExtensionId, withExtension } from './extensionHarness'
import { HEAD_PROBE_RESPONSE } from '../../src/shared/httpResponseInput'

/**
 * example.com report (7.0.341): a Next.js <Link> click is a history.pushState
 * - no new document, no content-script injection, no HTTP response - and the
 * panel kept showing the previous URL's completed run. The fixture is that
 * page in miniature: one link that pushes a URL and swaps title + h1.
 */
const HEADER_BOUND_MS = 3_000
const RUN_BOUND_MS = 90_000
const NO_RUN_WINDOW_MS = 8_000

const doc = (title: string, body: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title></head><body><h1>${title}</h1>${body}</body></html>`
const SPA_SCRIPT = `<script>
document.getElementById('go').addEventListener('click', (event) => {
  event.preventDefault()
  history.pushState({}, '', '/route-b')
  document.title = 'Route B'
  document.querySelector('h1').textContent = 'Route B'
})
</script>`
const START = doc('Start page', `<a id="go" href="/route-b">Route B</a>${SPA_SCRIPT}`)
const ROUTE_B = doc('Route B', '<p>Served directly.</p>')

const startServer = async () => {
  const server = createServer((req, res) => {
    const path = (req.url || '/').split('?')[0]
    const body = path === '/start' ? START : path === '/route-b' ? ROUTE_B : null
    res.writeHead(body ? 200 : 404, { 'content-type': 'text/html; charset=utf-8' })
    res.end(body || doc('Not found', ''))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return { origin: `http://127.0.0.1:${port}`, close: () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) }
}

type Snap = { url: string; status: string; runId: string; results: Array<{ ruleId?: string; runIdentifier?: string; message: string; presentation?: { input?: string } }>; commits: number }
const snapshot = (worker: Worker, tabId: number) => worker.evaluate(async (id: number): Promise<Snap> => {
  const stored = await chrome.storage.local.get([`results:${id}`, `results-meta:${id}`])
  const meta = (stored[`results-meta:${id}`] || {}) as { url?: string; status?: string; runId?: string }
  const commits = ((globalThis as unknown as { __commits?: number[] }).__commits || []).filter((tab) => tab === id).length
  return { url: meta.url || '', status: meta.status || 'none', runId: meta.runId || '', results: stored[`results:${id}`] || [], commits }
}, tabId)

const armCommitProbe = (worker: Worker) => worker.evaluate(() => {
  const global = globalThis as unknown as { __commits?: number[] }
  global.__commits = []
  chrome.webNavigation.onCommitted.addListener((event) => { if (event.frameId === 0) global.__commits!.push(event.tabId) })
})

const openPanel = async (context: BrowserContext, userDataDir: string) => {
  const panel = await context.newPage()
  await panel.setViewportSize({ width: 420, height: 900 })
  await panel.goto(`chrome-extension://${await findExtensionId(context, userDataDir)}/src/sidepanel.html`, { waitUntil: 'load' })
  return panel
}
const headerUrl = (panel: Page) => panel.locator('input').first()

/** Polls for a completed run of `url` other than `previousRunId`; fails with the last observed state. */
const waitForNewRun = async (worker: Worker, tabId: number, url: string, previousRunId: string) => {
  const t0 = Date.now()
  let last: Snap | null = null
  while (Date.now() - t0 < RUN_BOUND_MS) {
    last = await snapshot(worker, tabId)
    if (last.url === url && last.status === 'completed' && last.runId !== previousRunId) return last
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`no completed run for ${url} within ${RUN_BOUND_MS}ms; last: url=${last?.url} status=${last?.status} runId=${last?.runId} previous=${previousRunId}`)
}

const loadStartPage = async (context: BrowserContext, origin: string) => {
  const page = await context.newPage()
  await page.goto(`${origin}/start`, { waitUntil: 'load' })
  const worker = await extensionWorker(context)
  if (!worker) throw new Error('extension worker not found')
  // A worker that has just started can be reachable before its extension bindings are (see readRunSnapshot).
  let tabId = 0
  await expect.poll(async () => {
    tabId = await worker.evaluate(async (url: string) => chrome?.tabs ? ((await chrome.tabs.query({ url })).find((tab) => tab.id)?.id || 0) : 0, `${origin}/start`)
    return tabId
  }, { timeout: 20_000 }).toBeGreaterThan(0)
  await expect.poll(async () => (await snapshot(worker, tabId)).status, { timeout: RUN_BOUND_MS }).toBe('completed')
  const first = await snapshot(worker, tabId)
  expect(first.url).toBe(`${origin}/start`)
  return { page, worker, tabId, first }
}

test.describe('SPA URL change (history.pushState)', () => {
  test('auto-run on: header follows the URL, a new run for the new route completes from the live DOM, no reload', async () => {
    test.setTimeout(180_000)
    const server = await startServer()
    const { context, userDataDir, cleanup } = await withExtension()
    try {
      const { page, worker, tabId, first } = await loadStartPage(context, server.origin)
      const panel = await openPanel(context, userDataDir)
      await page.bringToFront()
      await expect(headerUrl(panel)).toHaveValue(`${server.origin}/start`, { timeout: 20_000 })
      await armCommitProbe(worker)

      const t0 = Date.now()
      await page.click('#go')
      await expect(headerUrl(panel)).toHaveValue(`${server.origin}/route-b`, { timeout: HEADER_BOUND_MS })
      const headerAfterMs = Date.now() - t0

      const second = await waitForNewRun(worker, tabId, `${server.origin}/route-b`, first.runId)
      console.log(`[spa-url-change] header=${headerAfterMs}ms run=${Date.now() - t0}ms results=${second.results.length}`)

      const own = second.results.filter((r) => r.runIdentifier === second.runId)
      expect(own.length).toBeGreaterThan(10)
      // The DOM of the new route was captured (title/h1 swapped by the SPA), not the previous one.
      const captured = JSON.stringify(own)
      expect(captured).toContain('Route B')
      expect(captured).not.toContain('Start page')
      // The run knows it came from an in-page navigation and that no navigation response exists for the URL.
      expect(own.find((r) => r.ruleId === 'url:history-state-update')?.message).toContain('SPA history update observed: Yes')
      expect(own.find((r) => r.ruleId === 'http-status')?.presentation?.input).toBe(HEAD_PROBE_RESPONSE)
      expect(second.commits, 'no document load happened').toBe(0)
      await expect(panel.getByTestId('page-changed')).toHaveCount(0)
    } finally {
      await context.close()
      cleanup()
      await server.close()
    }
  })

  test('auto-run off: header follows the URL and marks the old run, nothing runs, Run test tests the current page', async () => {
    test.setTimeout(180_000)
    const server = await startServer()
    const { context, userDataDir, cleanup } = await withExtension()
    try {
      const { page, worker, tabId, first } = await loadStartPage(context, server.origin)
      await worker.evaluate(async () => { await chrome.storage.local.set({ 'ui:autoRun': false }) })
      const panel = await openPanel(context, userDataDir)
      await page.bringToFront()
      await expect(headerUrl(panel)).toHaveValue(`${server.origin}/start`, { timeout: 20_000 })
      await armCommitProbe(worker)

      await page.click('#go')
      await expect(headerUrl(panel)).toHaveValue(`${server.origin}/route-b`, { timeout: HEADER_BOUND_MS })
      const notice = panel.getByTestId('page-changed')
      await expect(notice).toBeVisible({ timeout: HEADER_BOUND_MS })
      await expect(notice).toContainText(`${server.origin}/start`)
      await expect(notice).toContainText('Auto-run is off')
      await page.waitForTimeout(NO_RUN_WINDOW_MS)
      const after = await snapshot(worker, tabId)
      expect(after.runId, 'no automatic run').toBe(first.runId)
      expect(after.url).toBe(`${server.origin}/start`)
      expect(after.commits).toBe(0)

      await panel.getByRole('button', { name: 'Run test', exact: true }).click()
      const manual = await waitForNewRun(worker, tabId, `${server.origin}/route-b`, first.runId)
      expect(manual.commits, 'Run test reloaded the current page once').toBe(1)
      await expect(notice).toHaveCount(0)
    } finally {
      await context.close()
      cleanup()
      await server.close()
    }
  })
})
