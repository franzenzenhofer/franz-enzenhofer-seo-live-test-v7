import { expect, test } from '@playwright/test'

import { findExtensionId, readRunSnapshot, withExtension } from './extensionHarness'
import type { RunSnapshot } from './extensionHarness'

test('hard reload updates the completed run ID and timestamp', async () => {
  const { context, userDataDir, cleanup } = await withExtension()
  try {
    const page = await context.newPage()
    await page.goto('https://example.com')
    await page.waitForLoadState('networkidle')
    const targetUrl = page.url()
    let first: RunSnapshot | null = null
    await expect.poll(async () => {
      first = await readRunSnapshot(context, targetUrl)
      return first?.status
    }, { timeout: 30_000 }).toBe('completed')

    await page.bringToFront()
    await page.reload()
    await page.waitForLoadState('networkidle')

    let second: RunSnapshot | null = null
    await expect.poll(async () => {
      second = await readRunSnapshot(context, targetUrl)
      return second?.status === 'completed' && second.runId !== first!.runId
    }, { timeout: 30_000 }).toBe(true)

    expect(second!.ranAt).not.toBe(first!.ranAt)
    const extensionId = await findExtensionId(context, userDataDir)
    const panel = await context.newPage()
    await panel.goto(`chrome-extension://${extensionId}/src/sidepanel.html`)
    await expect(panel.locator(`[title="${second!.runId}"]`)).toBeVisible()
    await expect(panel.getByTestId('result-card').first()).toBeVisible()
  } finally {
    await context.close()
    cleanup()
  }
})
