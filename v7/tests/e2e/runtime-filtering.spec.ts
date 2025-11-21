import path from 'node:path'
import fs from 'node:fs'

import { test, expect, chromium, BrowserContext } from '@playwright/test'

import { cleanupProfileDir, describeProfileChoice, prepareProfileDir } from '../../scripts/chrome-profile'

const dist = path.resolve(new URL('../../dist', import.meta.url).pathname)

type ExtensionContext = { context: BrowserContext; userDataDir: string; cleanup: () => void }

const buildArgs = (headless: boolean) => {
  const args = [
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--disable-extensions-except=${dist}`,
    `--load-extension=${dist}`,
  ]
  if (headless) args.unshift('--headless=new')
  return args
}

const withExtension = async (): Promise<ExtensionContext> => {
  if (!fs.existsSync(dist)) throw new Error('Build dist first (npm run build) before running e2e tests.')
  const profile = prepareProfileDir()
  console.info(`[e2e] Using ${describeProfileChoice(profile)}`)
  const headless = process.env.PW_EXT_HEADLESS === '1'
  const context = await chromium.launchPersistentContext(profile.userDataDir, {
    args: buildArgs(headless),
    headless,
  })
  const cleanup = () => cleanupProfileDir(profile)
  return { context, userDataDir: profile.userDataDir, cleanup }
}

const findExtensionId = async (ctx: BrowserContext) => {
  const sw = ctx.serviceWorkers()
  for (const w of sw) {
    const url = w.url()
    const m = url.match(/^chrome-extension:\/\/([a-z]+)\//)
    if (m) return m[1]
  }
  const w = await ctx.waitForEvent('serviceworker', { timeout: 10_000 }).catch(() => null)
  if (w) {
    const m = w.url().match(/^chrome-extension:\/\/([a-z]+)\//)
    if (m) return m[1]
  }
  return null
}

test('runtime filtering: multiple runs show only current run results', async () => {
  const { context, cleanup } = await withExtension()
  try {
    const extensionId = await findExtensionId(context)
    expect(extensionId).not.toBeNull()

    const page = await context.newPage()
    await page.goto('https://example.com')
    await page.waitForLoadState('networkidle')

    const sidePanelUrl = `chrome-extension://${extensionId}/src/sidepanel.html`
    const panel = await context.newPage()
    await panel.goto(sidePanelUrl)

    console.log('[DEBUG] First run - waiting for results...')
    await panel.waitForSelector('text=Franz Enzenhofer SEO Live Test', { timeout: 10_000 })
    await panel.waitForSelector('[data-testid="result-card"]', { timeout: 25_000 })

    const firstRunId = await panel.evaluate(() => document.querySelector('[title^="run-"]')?.getAttribute('title') || null)
    console.log('[DEBUG] First run ID:', firstRunId)
    expect(firstRunId).not.toBeNull()

    const firstRunResults = await panel.locator('[data-testid="result-card"]').count()
    console.log('[DEBUG] First run results count:', firstRunResults)
    expect(firstRunResults).toBeGreaterThan(0)

    // Trigger second run by reloading the page
    console.log('[DEBUG] Triggering second run...')
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Wait for panel to update with new runId (retry until it changes)
    let secondRunId: string | null = null
    for (let i = 0; i < 20; i++) {
      await panel.waitForTimeout(500)
      secondRunId = await panel.evaluate(() => {
        const runIdEl = document.querySelector('[title^="run-"]')
        return runIdEl?.getAttribute('title') || null
      })
      if (secondRunId && secondRunId !== firstRunId) break
    }
    console.log('[DEBUG] Second run ID:', secondRunId)
    expect(secondRunId).not.toBeNull()
    expect(secondRunId).not.toBe(firstRunId)

    // Wait for results to complete (similar count to first run)
    let secondRunResults = 0
    for (let i = 0; i < 30; i++) {
      await panel.waitForTimeout(500)
      secondRunResults = await panel.locator('[data-testid="result-card"]').count()
      console.log(`[DEBUG] Second run results after ${(i + 1) * 500}ms:`, secondRunResults)
      if (secondRunResults >= firstRunResults * 0.9) break
    }
    console.log('[DEBUG] Second run results count:', secondRunResults)

    // Get sum of type badge counts from the panel (not inventory total)
    const typeBadgeSum = await panel.evaluate(() => {
      const badges = Array.from(document.querySelectorAll('.flex.items-center.gap-2 button'))
      return badges.reduce((sum, badge) => {
        const countText = badge.querySelector('span:last-child')?.textContent
        return sum + (countText ? parseInt(countText, 10) : 0)
      }, 0)
    })
    console.log('[DEBUG] Type badge sum:', typeBadgeSum)

    // Badge sum should match visible result count (proves filtering works)
    expect(typeBadgeSum).toBe(secondRunResults)

    // Verify runId is displayed in UI
    const runIdVisible = await panel.locator('text=/^#run-/').isVisible()
    expect(runIdVisible).toBe(true)

    console.log('[DEBUG] ✅ Runtime filtering test passed!')
  } finally {
    await context.close()
    cleanup()
  }
})
