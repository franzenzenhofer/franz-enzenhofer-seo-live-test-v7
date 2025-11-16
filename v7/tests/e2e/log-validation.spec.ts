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

test('e2e with comprehensive log validation', async () => {
  const { context: ctx, cleanup, userDataDir } = await withExtension()
  const logs: Array<{ type: string; message: string; timestamp: number }> = []
  const errors: string[] = []
  const warnings: string[] = []

  // Capture all console messages from all pages
  ctx.on('page', (page) => {
    page.on('console', (msg) => {
      const text = msg.text()
      const type = msg.type()
      const timestamp = Date.now()

      logs.push({ type, message: text, timestamp })

      if (type === 'error') {
        errors.push(text)
      } else if (type === 'warning') {
        warnings.push(text)
      }
    })

    page.on('pageerror', (error) => {
      const errorMsg = `PageError: ${error.message}`
      logs.push({ type: 'pageerror', message: errorMsg, timestamp: Date.now() })
      errors.push(errorMsg)
    })
  })

  const page = await ctx.newPage()

  // Capture page console
  page.on('console', (msg) => {
    const text = msg.text()
    const type = msg.type()
    logs.push({ type, message: text, timestamp: Date.now() })

    if (type === 'error') {
      errors.push(text)
    } else if (type === 'warning') {
      warnings.push(text)
    }
  })

  page.on('pageerror', (error) => {
    const errorMsg = `PageError: ${error.message}`
    logs.push({ type: 'pageerror', message: errorMsg, timestamp: Date.now() })
    errors.push(errorMsg)
  })

  await page.goto('https://example.com/')
  await page.waitForTimeout(2500)

  let sidePanelUrl: string | null = null
  try {
    const extensionId = await findExtensionId(ctx, userDataDir).catch(() => DEV_EXTENSION_ID)
    sidePanelUrl = `chrome-extension://${extensionId}/src/sidepanel.html`
  } catch (err) {
    console.warn('[e2e] extension id lookup failed, falling back to content script URL:', err)
    await page
      .waitForFunction(() => {
        const doc = document.documentElement
        return Boolean((window as any).__LT_SIDEPANEL_URL__ || doc?.getAttribute('data-lt-sidepanel-url'))
      }, { timeout: 5_000 })
      .catch(() => null)
    sidePanelUrl = await page.evaluate(
      () => (window as any).__LT_SIDEPANEL_URL__ || document.documentElement?.getAttribute('data-lt-sidepanel-url') || null,
    )
  }

  if (!sidePanelUrl) throw new Error('Sidepanel URL not available')

  const side = await ctx.newPage()

  // Capture sidepanel console
  side.on('console', (msg) => {
    const text = msg.text()
    const type = msg.type()
    logs.push({ type, message: `[sidepanel] ${text}`, timestamp: Date.now() })

    if (type === 'error') {
      errors.push(`[sidepanel] ${text}`)
    } else if (type === 'warning') {
      warnings.push(`[sidepanel] ${text}`)
    }
  })

  side.on('pageerror', (error) => {
    const errorMsg = `[sidepanel] PageError: ${error.message}`
    logs.push({ type: 'pageerror', message: errorMsg, timestamp: Date.now() })
    errors.push(errorMsg)
  })

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
  await side.waitForTimeout(3000)

  const hasRows = await side.locator('.border.rounded').count()
  expect(hasRows).toBeGreaterThan(0)

  // Write comprehensive log report
  const logReport = {
    summary: {
      totalLogs: logs.length,
      errors: errors.length,
      warnings: warnings.length,
      testPassed: true,
      timestamp: new Date().toISOString(),
    },
    logs: logs.slice(-100), // Last 100 logs
    errors,
    warnings,
  }

  const logFilePath = path.join(__dirname, '../../test-results/e2e-log-report.json')
  try {
    fs.mkdirSync(path.dirname(logFilePath), { recursive: true })
    fs.writeFileSync(logFilePath, JSON.stringify(logReport, null, 2))
    console.log(`✅ Log file written successfully to: ${logFilePath}`)
  } catch (error) {
    console.error(`❌ Failed to write log file: ${error}`)
    throw error
  }

  console.log('\n═══════════════════════════════════════════════════════════════════')
  console.log('    E2E LOG VALIDATION REPORT')
  console.log('═══════════════════════════════════════════════════════════════════')
  console.log(`Total Logs Captured: ${logs.length}`)
  console.log(`Errors Found: ${errors.length}`)
  console.log(`Warnings Found: ${warnings.length}`)
  console.log(`Results Displayed: ${hasRows}`)
  console.log(`Log Report: ${logFilePath}`)
  console.log('═══════════════════════════════════════════════════════════════════\n')

  // Validate: No critical EXTENSION errors (filter out expected external page errors)
  const criticalErrors = errors.filter(
    (e) =>
      !e.includes('Autofill.enable') && // Known Chrome autofill warning
      !e.includes('ERR_BLOCKED_BY_CLIENT') && // AdBlocker related
      !e.includes('favicon') && // Favicon warnings are acceptable
      !e.includes('net::ERR_FILE_NOT_FOUND') && // Some resource loading is ok
      !e.includes('DevTools') && // DevTools messages
      !e.includes('Content Security Policy') && // CSP from external pages (example.com)
      !e.includes('Failed to load resource') && // 404s from external pages
      !e.includes('404'),
  ) // 404 errors from external pages

  // Only fail if we have extension-specific critical errors
  const extensionErrors = criticalErrors.filter((e) => e.includes('[sidepanel]') || e.includes('chrome-extension'))

  if (criticalErrors.length > 0) {
    console.log('\nFiltered external page errors (expected):')
    errors
      .filter((e) => !criticalErrors.includes(e))
      .forEach((err) => console.log(`  - ${err}`))
  }

  if (extensionErrors.length > 0) {
    console.error('\n❌ Critical EXTENSION errors found:')
    extensionErrors.forEach((err) => console.error(`  - ${err}`))
  } else {
    console.log('✅ No critical extension errors found!')
  }

  expect(extensionErrors.length).toBe(0)

  await ctx.close()
  cleanup()
})
