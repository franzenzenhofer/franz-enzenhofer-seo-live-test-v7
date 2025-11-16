import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

import { test, expect, chromium, BrowserContext } from '@playwright/test'

import { cleanupProfileDir, describeProfileChoice, prepareProfileDir } from '../../scripts/chrome-profile'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

const DEV_EXTENSION_ID = 'enkjceaniaomnogacnigmlpofdcegcfc'

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

const findExtensionId = async (ctx: BrowserContext, profileDir?: string) => {
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
  const p = await ctx.newPage()
  const cdp = await ctx.newCDPSession(p)
  const { targetInfos } = await cdp.send('Target.getTargets')
  await p.close()
  const ti = targetInfos.find((t) => t.url.startsWith('chrome-extension://'))
  if (!ti) {
    const byPrefs = profileDir ? readExtensionIdFromPreferences(profileDir) : null
    if (byPrefs) return byPrefs
    throw new Error('Extension target not found')
  }
  const m = ti.url.match(/^chrome-extension:\/\/([a-z]+)\//)
  if (!m) throw new Error('Extension ID not found')
  return m[1]
}

const readExtensionIdFromPreferences = (profileDir: string): string | null => {
  const prefPath = path.join(profileDir, 'Default', 'Preferences')
  if (!fs.existsSync(prefPath)) return null
  try {
    const raw = JSON.parse(fs.readFileSync(prefPath, 'utf8')) as {
      extensions?: { settings?: Record<string, { path?: string }> }
    }
    const settings = raw.extensions?.settings || {}
    for (const [id, info] of Object.entries(settings)) {
      if (!info?.path) continue
      if (path.resolve(info.path) === dist) return id
    }
  } catch (err) {
    console.warn('[e2e] Failed to read Preferences for extension id', err)
  }
  return null
}

test('DEBUG: Check if rules actually execute and produce results', async () => {
  const { context: ctx, cleanup, userDataDir } = await withExtension()

  const page = await ctx.newPage()
  await page.goto('https://example.com/')

  // Wait longer for rules to execute
  console.log('[DEBUG] Waiting for rules to execute...')
  await page.waitForTimeout(5000)

  let sidePanelUrl: string | null = null
  try {
    const extensionId = await findExtensionId(ctx, userDataDir).catch(() => DEV_EXTENSION_ID)
    sidePanelUrl = `chrome-extension://${extensionId}/src/sidepanel.html`
    console.log(`[DEBUG] Extension ID: ${extensionId}`)
    console.log(`[DEBUG] Side panel URL: ${sidePanelUrl}`)
  } catch (err) {
    console.warn('[DEBUG] extension id lookup failed:', err)
    throw err
  }

  if (!sidePanelUrl) throw new Error('Sidepanel URL not available')

  const side = await ctx.newPage()
  await side.goto(sidePanelUrl, { waitUntil: 'load', timeout: 10_000 })

  console.log('[DEBUG] Side panel loaded, checking for results...')
  await side.waitForTimeout(3000)

  // Check if Live Test header is visible
  const header = side.getByText('Live Test')
  await expect(header).toBeVisible()
  console.log('[DEBUG] ✓ Header visible')

  // Count result rows
  const resultRows = await side.locator('.border.rounded').count()
  console.log(`[DEBUG] Result rows found: ${resultRows}`)

  // Get all text content from the page
  const pageText = await side.textContent('body')
  console.log('[DEBUG] Page text length:', pageText?.length)

  // Check if there are any results displayed
  const hasResults = await side.locator('[data-testid="result-row"], .result-row, [class*="result"]').count()
  console.log(`[DEBUG] Results with common selectors: ${hasResults}`)

  // Try to find any text that looks like rule results
  const htmlContent = await side.content()
  const hasOkType = htmlContent.includes('type":"ok"') || htmlContent.includes('OK')
  const hasWarnType = htmlContent.includes('type":"warn"') || htmlContent.includes('WARN')
  const hasInfoType = htmlContent.includes('type":"info"') || htmlContent.includes('INFO')

  console.log('[DEBUG] Content analysis:')
  console.log(`  - Contains OK type: ${hasOkType}`)
  console.log(`  - Contains WARN type: ${hasWarnType}`)
  console.log(`  - Contains INFO type: ${hasInfoType}`)

  // Check chrome.storage for results
  const storageResults = await side.evaluate(async () => {
    const keys = await chrome.storage.local.get(null)
    return {
      keyCount: Object.keys(keys).length,
      keys: Object.keys(keys),
      hasResults: Object.keys(keys).some((k) => k.includes('result') || k.includes('run')),
    }
  })

  console.log('[DEBUG] Chrome storage:')
  console.log(`  - Total keys: ${storageResults.keyCount}`)
  console.log(`  - Keys: ${storageResults.keys.join(', ')}`)
  console.log(`  - Has result keys: ${storageResults.hasResults}`)

  // CRITICAL: Verify we have results
  expect(resultRows).toBeGreaterThan(0)

  console.log('\n[DEBUG] ═══════════════════════════════════════')
  console.log(`[DEBUG] TEST RESULT: ${resultRows > 0 ? '✅ RULES EXECUTED' : '❌ NO RULES EXECUTED'}`)
  console.log('[DEBUG] ═══════════════════════════════════════\n')

  await ctx.close()
  cleanup()
})
