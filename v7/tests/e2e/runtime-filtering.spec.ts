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
    await panel.waitForSelector('[data-testid="result-card"], .dt-result', { timeout: 15_000 })

    const firstRunId = await panel.evaluate(() => {
      const runIdEl = document.querySelector('[title^="run-"]')
      return runIdEl?.getAttribute('title') || null
    })
    console.log('[DEBUG] First run ID:', firstRunId)
    expect(firstRunId).not.toBeNull()

    const firstRunResults = await panel.locator('[data-testid="result-card"], .dt-result').count()
    console.log('[DEBUG] First run results count:', firstRunResults)
    expect(firstRunResults).toBeGreaterThan(0)

    // Trigger second run by reloading the page
    console.log('[DEBUG] Triggering second run...')
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Wait for panel to update with new runId
    await panel.waitForTimeout(2000)

    const secondRunId = await panel.evaluate(() => {
      const runIdEl = document.querySelector('[title^="run-"]')
      return runIdEl?.getAttribute('title') || null
    })
    console.log('[DEBUG] Second run ID:', secondRunId)
    expect(secondRunId).not.toBeNull()
    expect(secondRunId).not.toBe(firstRunId)

    // Results should be from second run only
    const secondRunResults = await panel.locator('[data-testid="result-card"], .dt-result').count()
    console.log('[DEBUG] Second run results count:', secondRunResults)

    // Get statistics from the panel
    const stats = await panel.evaluate(() => {
      const text = document.body.textContent || ''
      const totalMatch = text.match(/Total\s+(\d+)/)
      return totalMatch ? parseInt(totalMatch[1], 10) : 0
    })
    console.log('[DEBUG] Statistics Total:', stats)

    // Stats should match result count (not sum of both runs)
    expect(stats).toBeGreaterThan(0)
    expect(Math.abs(stats - secondRunResults)).toBeLessThan(5) // Allow small variance

    // Verify runId is displayed in UI
    const runIdVisible = await panel.locator('text=/^#run-/').isVisible()
    expect(runIdVisible).toBe(true)

    console.log('[DEBUG] ✅ Runtime filtering test passed!')
  } finally {
    await context.close()
    cleanup()
  }
})
