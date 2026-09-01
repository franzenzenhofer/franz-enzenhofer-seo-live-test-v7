import { test, expect } from '@playwright/test'

import { DEV_EXTENSION_ID, findExtensionId, withExtension, readRunSnapshot } from './extensionHarness'

const TARGET = process.env.LT_TARGET_URL || 'https://orf.at/stories/3440788/'

test.describe('report view', () => {
  test.skip(!process.env.LT_REPORT, 'set LT_REPORT=1')

  test('opens with every card already expanded', async () => {
    test.setTimeout(180_000)
    const { context: ctx, cleanup, userDataDir } = await withExtension()
    const page = await ctx.newPage()
    await page.goto(TARGET, { waitUntil: 'domcontentloaded' })
    let runId = ''
    for (let i = 0; i < 60; i++) {
      const snap = await readRunSnapshot(ctx, TARGET)
      if (snap && !snap.results.some((r) => r.type === 'pending')) { runId = snap.runId; break }
      await page.waitForTimeout(500)
    }
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
