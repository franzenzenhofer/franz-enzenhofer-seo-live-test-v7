import path from 'node:path'
import fs from 'node:fs'

import { test, expect, chromium, type BrowserContext } from '@playwright/test'

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
  if (!fs.existsSync(dist)) throw new Error('Build dist first (npm run build)')
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
  throw new Error('Extension not found')
}

test('report.html: opens with runid and shows results', async () => {
  const { context, cleanup } = await withExtension()

  try {
    const extensionId = await findExtensionId(context)
    console.log('[DEBUG] Extension ID:', extensionId)

    const page = await context.newPage()
    await page.goto('https://example.com/')
    await page.waitForLoadState('networkidle')

    console.log('[DEBUG] Waiting for rules to execute...')
    await page.waitForTimeout(3000)

    // Get background worker
    const worker = context.serviceWorkers()[0]
    if (!worker) throw new Error('No service worker found')

    // Get storage via service worker
    const storage = await worker.evaluate(async () => {
      const all = await chrome.storage.local.get(null)
      return all
    })

    const resultsKeys = Object.keys(storage).filter((k) => k.startsWith('results:'))
    expect(resultsKeys.length).toBeGreaterThan(0)

    const tabId = resultsKeys[0]!.replace('results:', '')
    const results = storage[`results:${tabId}`] as Array<{ runIdentifier?: string }>
    const runId = results[0]?.runIdentifier

    expect(runId).toBeDefined()
    console.log('[DEBUG] Found runId:', runId)
    console.log('[DEBUG] Results count:', results.length)

    // Open report.html with runid
    const reportUrl = `chrome-extension://${extensionId}/src/report.html?runid=${runId}`
    console.log('[DEBUG] Opening report:', reportUrl)

    const reportPage = await context.newPage()
    await reportPage.goto(reportUrl)
    await reportPage.waitForLoadState('networkidle')

    // Check for error message
    const errorText = await reportPage.locator('h1').first().textContent()
    expect(errorText).not.toContain('Error')

    // Check that results are displayed
    const resultsCount = await reportPage.locator('[data-testid="result-card"]').count()
    console.log('[DEBUG] Report results count:', resultsCount)
    expect(resultsCount).toBeGreaterThan(0)

    // Verify runId is shown in header
    const headerText = await reportPage.textContent('body')
    expect(headerText).toContain(runId!)

    console.log('[DEBUG] ✅ Report test passed!')

    await reportPage.close()
    await page.close()
  } finally {
    await context.close()
    cleanup()
  }
})
