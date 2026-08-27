import { test, expect } from '@playwright/test'

import { DEV_EXTENSION_ID, findExtensionId, withExtension } from './extensionHarness'

test('side panel loads and shows results (headless)', async () => {
  const { context: ctx, cleanup, userDataDir } = await withExtension()
  let sidePanelUrl: string | null = null
  const page = await ctx.newPage()
  await page.goto('https://example.com/')
  await page.waitForTimeout(2500)
  try {
    const extensionId = await findExtensionId(ctx, userDataDir).catch(() => DEV_EXTENSION_ID)
    sidePanelUrl = `chrome-extension://${extensionId}/src/sidepanel.html`
  } catch (err) {
    console.warn('[e2e] extension id lookup failed, falling back to content script URL:', err)
    await page.waitForFunction(() => {
      const doc = document.documentElement
      return Boolean((window as any).__LT_SIDEPANEL_URL__ || doc?.getAttribute('data-lt-sidepanel-url'))
    }, { timeout: 5_000 }).catch(() => null)
    sidePanelUrl = await page.evaluate(() => (window as any).__LT_SIDEPANEL_URL__ || document.documentElement?.getAttribute('data-lt-sidepanel-url') || null)
  }
  if (!sidePanelUrl) throw new Error('Sidepanel URL not available')
  const side = await ctx.newPage()
  let lastError: unknown = null
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await side.goto(sidePanelUrl, { waitUntil: 'load', timeout: 10_000 })
      lastError = null
      break
    } catch (err) {
      lastError = err
      await side.waitForTimeout(1000)
    }
  }
  if (lastError) throw lastError
  await expect(side.getByText('Live Test')).toBeVisible()
  await side.waitForTimeout(2000)
  const hasRows = await side.locator('.border.rounded').count()
  expect(hasRows).toBeGreaterThan(0)
  await ctx.close()
  cleanup()
})
