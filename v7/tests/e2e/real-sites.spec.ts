import path from 'node:path'
import fs from 'node:fs'

import { test, expect, chromium, type BrowserContext } from '@playwright/test'

import { cleanupProfileDir, describeProfileChoice, prepareProfileDir } from '../../scripts/chrome-profile'
import { browserExecutable } from './browserExecutable'

const dist = path.resolve(new URL('../../dist', import.meta.url).pathname)

const buildArgs = (headless: boolean): string[] => {
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

const withExtension = async (): Promise<{ context: BrowserContext; cleanup: () => void }> => {
  if (!fs.existsSync(dist)) throw new Error('Build first: dist missing')
  const profile = prepareProfileDir()
  console.info(`[real-sites] Using ${describeProfileChoice(profile)}`)
  // Default headed so chrome-extension:// URLs resolve. Override with PW_EXT_HEADLESS=1.
  const headless = process.env['PW_EXT_HEADLESS'] === '1'
  const context = await chromium.launchPersistentContext(profile.userDataDir, {
    args: buildArgs(headless), headless, executablePath: browserExecutable(),
  })
  return { context, cleanup: () => cleanupProfileDir(profile) }
}

const DEV_EXTENSION_ID = 'jbnaibigcohjfefpfocphcjeliohhold'

// Serial so each test gets its own clean profile + the parallel-launch race
// against Chrome's user-data dir doesn't trigger spurious failures.
test.describe.configure({ mode: 'serial' })

// Subset to keep test runtime reasonable; CLI covers the broader matrix.
const REAL_SITES = [
  { name: 'orf.at',        url: 'https://orf.at/stories/3430670/' },
  { name: 'TechCrunch',    url: 'https://techcrunch.com/' },
  { name: 'Hacker News',   url: 'https://news.ycombinator.com/' },
]

for (const site of REAL_SITES) {
  test.skip(process.env['EXT_E2E_REAL_SITES'] !== '1', 'Real-site e2e gated by EXT_E2E_REAL_SITES=1 (needs internet)')
  test(`real site: ${site.name} produces results`, async () => {
    const { context, cleanup } = await withExtension()
    try {
      const page = await context.newPage()
      await page.goto(site.url, { waitUntil: 'load', timeout: 30_000 })
      await page.waitForTimeout(12_000)

      const sidePanelUrl = `chrome-extension://${DEV_EXTENSION_ID}/src/sidepanel.html`
      const panel = await context.newPage()
      await panel.goto(sidePanelUrl, { waitUntil: 'load', timeout: 10_000 })
      await panel.waitForTimeout(3_000)

      const total = await panel.evaluate(async () => {
        const all = await chrome.storage.local.get(null)
        const entries = Object.entries(all).filter(([k]) => k.startsWith('results:'))
        return entries.reduce((sum, [, v]) => sum + (Array.isArray(v) ? (v as unknown[]).length : 0), 0)
      })
      console.log(`[real-sites] ${site.name}: ${total} results`)
      expect(total).toBeGreaterThanOrEqual(100)
    } finally {
      await context.close()
      cleanup()
    }
  })
}
