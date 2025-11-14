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
  // Wait for service worker to register in headless
  const w = await ctx.waitForEvent('serviceworker', { timeout: 10_000 }).catch(() => null)
  if (w) {
    const m = w.url().match(/^chrome-extension:\/\/([a-z]+)\//)
    if (m) return m[1]
  }
  // Fallback to CDP target listing
  const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p)
  const { targetInfos } = await cdp.send('Target.getTargets')
  await p.close()
  const ti = targetInfos.find(t => t.url.startsWith('chrome-extension://'))
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
