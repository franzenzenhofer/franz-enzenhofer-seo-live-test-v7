import { test, expect } from '@playwright/test'

import { DEV_EXTENSION_ID, findExtensionId, withExtension } from './extensionHarness'

const TARGET = process.env.LT_TARGET_URL || 'https://orf.at/stories/3440788/'

test.describe('report view', () => {
  test.skip(!process.env.LT_REPORT, 'set LT_REPORT=1')

  test('opens with every card already expanded', async () => {
    test.setTimeout(180_000)
    const { context: ctx, cleanup, userDataDir } = await withExtension()
    const page = await ctx.newPage()
    await page.goto(TARGET, { waitUntil: 'domcontentloaded' })
    // Read the runIdentifier off the stored results, the way report.html itself
    // resolves a run - readRunSnapshot matches on tab URL and returned nothing here.
    const worker = ctx.serviceWorkers()[0] || await ctx.waitForEvent('serviceworker')
    let runId = ''
    for (let i = 0; i < 60; i++) {
      runId = await worker.evaluate(async () => {
        const all = await chrome.storage.local.get(null)
        const key = Object.keys(all).find((k) => k.startsWith('results:'))
        if (!key) return ''
        // A runIdentifier is enough to open the report; waiting for zero pending
        // would mean waiting out PageSpeed, which is not what this test is about.
        const rows = all[key] as Array<{ runIdentifier?: string; type?: string }>
        if (!rows?.length) return ''
        return rows.find((r) => r.runIdentifier)?.runIdentifier || ''
      }).catch(() => '')
      if (runId) break
      await page.waitForTimeout(500)
    }
    expect(runId).not.toBe('')
    const id = await findExtensionId(ctx, userDataDir).catch(() => DEV_EXTENSION_ID)
    const report = await ctx.newPage()
    await report.setViewportSize({ width: 900, height: 1200 })
    await report.goto(`chrome-extension://${id}/src/report.html?runid=${runId}`, { waitUntil: 'load' })
    await report.waitForTimeout(3000)

    const cards = await report.locator('[data-testid="result-card"]').count()
    // Expanded cards offer "Hide"; collapsed ones offer "Details".
    const hide = await report.getByRole('button', { name: 'Hide' }).count()
    const details = await report.getByRole('button', { name: 'Details' }).count()
    console.log(`REPORT cards=${cards} expanded(Hide)=${hide} collapsed(Details)=${details}`)
    await report.screenshot({ path: 'test-results/report-expanded.png' })
    expect(cards).toBeGreaterThan(50)
    expect(details).toBe(0)
    await ctx.close(); cleanup()
  })
})
