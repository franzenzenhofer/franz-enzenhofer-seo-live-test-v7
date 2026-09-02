import { expect, test } from '@playwright/test'

import { findExtensionId, readRunSnapshot, withExtension } from './extensionHarness'
import type { RunSnapshot } from './extensionHarness'

test('runtime filtering shows only the current run results', async () => {
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

    const extensionId = await findExtensionId(context, userDataDir)
    const panel = await context.newPage()
    await panel.goto(`chrome-extension://${extensionId}/src/sidepanel.html`)
    await expect(panel.getByText('Franz Enzenhofer SEO Live Test')).toBeVisible()
    await expect(panel.locator(`[title="${first!.runId}"]`)).toBeVisible()
    const firstRunResults = await panel.getByTestId('result-card').count()
    expect(firstRunResults).toBeGreaterThan(0)
    // Debug rules are gated behind the Debug data setting - never visible by default
    expect(await panel.getByText('DEBUG:', { exact: false }).count()).toBe(0)

    await page.bringToFront()
    await page.reload()
    await page.waitForLoadState('networkidle')
    let second: RunSnapshot | null = null
    await expect.poll(async () => {
      second = await readRunSnapshot(context, targetUrl)
      return second?.status === 'completed' && second.runId !== first!.runId
    }, { timeout: 30_000 }).toBe(true)

    await expect(panel.locator(`[title="${second!.runId}"]`)).toBeVisible()
    await expect.poll(() => panel.getByTestId('result-card').count()).toBe(second!.results.length)
    const secondRunResults = await panel.getByTestId('result-card').count()
    const typeBadgeSum = await panel.evaluate(() => {
      const badges = Array.from(document.querySelectorAll('.flex.items-center.gap-2 button'))
      return badges.reduce((sum, badge) => {
        const countText = badge.querySelector('span:last-child')?.textContent
        return sum + (countText ? parseInt(countText, 10) : 0)
      }, 0)
    })
    expect(typeBadgeSum).toBe(secondRunResults)
  } finally {
    await context.close()
    cleanup()
  }
})
