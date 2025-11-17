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

test('hard reload: runId and timestamp update', async () => {
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

    console.log('[DEBUG] Waiting for first test run...')
    await panel.waitForSelector('[title^="run-"]', { timeout: 15_000 })

    const firstRunId = await panel.evaluate(() => {
      const runIdEl = document.querySelector('[title^="run-"]')
      return runIdEl?.getAttribute('title') || null
    })
    console.log('[DEBUG] First run ID:', firstRunId)
    expect(firstRunId).not.toBeNull()

    const firstRanAt = await panel.evaluate(() => {
      const ranAtEl = document.querySelector('.text-\\[9px\\].text-gray-500.text-right')
      return ranAtEl?.textContent || null
    })
    console.log('[DEBUG] First ranAt:', firstRanAt)

    // Click "Hard Reload" button
    console.log('[DEBUG] Clicking Hard Reload button...')
    const hardReloadButton = await panel.locator('button:has-text("Hard Reload")').first()
    await hardReloadButton.click()

    // Wait for the button text to change back from "Running..." to "Hard Reload"
    await panel.waitForSelector('button:has-text("Hard Reload")', { timeout: 30_000 })
    console.log('[DEBUG] Hard reload completed')

    // Wait for new runId to appear (it should be different from the first one)
    let secondRunId: string | null = null
    for (let i = 0; i < 40; i++) {
      await panel.waitForTimeout(500)
      secondRunId = await panel.evaluate(() => {
        const runIdEl = document.querySelector('[title^="run-"]')
        return runIdEl?.getAttribute('title') || null
      })
      console.log(`[DEBUG] Attempt ${i + 1}: runId =`, secondRunId)
      if (secondRunId && secondRunId !== firstRunId) {
        console.log('[DEBUG] RunId changed!')
        break
      }
    }

    console.log('[DEBUG] First run ID:', firstRunId)
    console.log('[DEBUG] Second run ID:', secondRunId)

    expect(secondRunId).not.toBeNull()
    expect(secondRunId).not.toBe(firstRunId)

    const secondRanAt = await panel.evaluate(() => {
      const ranAtEl = document.querySelector('.text-\\[9px\\].text-gray-500.text-right')
      return ranAtEl?.textContent || null
    })
    console.log('[DEBUG] First ranAt:', firstRanAt)
    console.log('[DEBUG] Second ranAt:', secondRanAt)

    expect(secondRanAt).not.toBeNull()
    expect(secondRanAt).not.toBe(firstRanAt)

    console.log('[DEBUG] ✅ Hard reload test passed!')
  } finally {
    await context.close()
    cleanup()
  }
})
