import path from 'node:path'
import fs from 'node:fs'

import { test, expect, chromium, BrowserContext } from '@playwright/test'

import { cleanupProfileDir, describeProfileChoice, prepareProfileDir } from '../../scripts/chrome-profile'

const dist = path.resolve(new URL('../../dist', import.meta.url).pathname)

type ExtensionContext = { context: BrowserContext; userDataDir: string; cleanup: () => void }

const buildArgs = () => {
  const args = [
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--disable-extensions-except=${dist}`,
    `--load-extension=${dist}`,
  ]
  if (process.env.PW_EXT_HEADLESS === '1') args.unshift('--headless=new')
  return args
}

const withExtension = async (): Promise<ExtensionContext> => {
  if (!fs.existsSync(dist)) throw new Error('Build dist first (npm run build) before running e2e tests.')
  const profile = prepareProfileDir()
  console.info(`[e2e] Using ${describeProfileChoice(profile)}`)
  const context = await chromium.launchPersistentContext(profile.userDataDir, { args: buildArgs() })
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
  if (!ti) throw new Error('Extension target not found')
  const m = ti.url.match(/^chrome-extension:\/\/([a-z]+)\//)
  if (!m) throw new Error('Extension ID not found')
  return m[1]
}

test('side panel loads and shows results (headless)', async () => {
  const { context: ctx, cleanup } = await withExtension()
  const page = await ctx.newPage()
  await page.goto('https://example.com/')
  await page.waitForTimeout(2500)
  // discover sidepanel URL exposed by content script
  const url = await page.evaluate(() => (window as any).__LT_SIDEPANEL_URL__ as string)
  if (!url) throw new Error('Sidepanel URL not available')
  const side = await ctx.newPage()
  await side.goto(url)
  await expect(side.getByText('Live Test')).toBeVisible()
  await side.waitForTimeout(2000)
  const hasRows = await side.locator('.border.rounded').count()
  expect(hasRows).toBeGreaterThan(0)
  await ctx.close()
  cleanup()
})
