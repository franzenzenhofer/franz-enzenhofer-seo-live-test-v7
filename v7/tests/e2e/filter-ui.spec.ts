import { test, expect } from '@playwright/test'

import { DEV_EXTENSION_ID, findExtensionId, withExtension } from './extensionHarness'

test.describe('filter ui', () => {
  test.skip(!process.env.LT_FILTER_UI, 'set LT_FILTER_UI=1')

  test('chip states and the Show all link', async () => {
    test.setTimeout(120_000)
    const { context: ctx, cleanup, userDataDir } = await withExtension()
    const page = await ctx.newPage()
    await page.goto('https://orf.at/stories/3440788/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(6000)
    const id = await findExtensionId(ctx, userDataDir).catch(() => DEV_EXTENSION_ID)
    const side = await ctx.newPage()
    await side.setViewportSize({ width: 420, height: 460 })
    await side.goto(`chrome-extension://${id}/src/sidepanel.html`, { waitUntil: 'load' })
    await side.waitForTimeout(3000)
    await side.screenshot({ path: 'test-results/filter-ui/unfiltered.png' })

    // Click "failed" - it must SHOW the failures, not hide them.
    const failed = side.getByRole('button', { name: /failed/ })
    await failed.click()
    await side.waitForTimeout(600)
    await side.screenshot({ path: 'test-results/filter-ui/filtered.png' })
    expect(await failed.getAttribute('aria-pressed')).toBe('true')
    const showAll = side.getByRole('button', { name: 'Show all' })
    await expect(showAll).toBeVisible()
    console.log(`[ui] Show all classes: ${await showAll.getAttribute('class')}`)
    await ctx.close(); cleanup()
  })
})
