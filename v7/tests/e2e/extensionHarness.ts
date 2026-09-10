import fs from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'
import type { BrowserContext } from '@playwright/test'

import { cleanupProfileDir, describeProfileChoice, prepareProfileDir } from '../../scripts/chrome-profile'
import { browserExecutable } from './browserExecutable'

const dist = path.resolve(new URL('../../dist', import.meta.url).pathname)
export const DEV_EXTENSION_ID = 'jbnaibigcohjfefpfocphcjeliohhold'

const readExtensionIdFromPreferences = (profileDir: string): string | null => {
  const prefPath = path.join(profileDir, 'Default', 'Preferences')
  if (!fs.existsSync(prefPath)) return null
  try {
    const raw = JSON.parse(fs.readFileSync(prefPath, 'utf8')) as {
      extensions?: { settings?: Record<string, { path?: string }> }
    }
    for (const [id, info] of Object.entries(raw.extensions?.settings || {})) {
      if (info?.path && path.resolve(info.path) === dist) return id
    }
  } catch (error) {
    console.warn('[e2e] Failed to read extension preferences', error)
  }
  return null
}

// Headless by default so e2e runs never pop up browser windows; PW_EXT_HEADLESS=0 forces headed.
export const extensionHeadless = () => process.env.PW_EXT_HEADLESS !== '0'

export const withExtension = async () => {
  if (!fs.existsSync(dist)) throw new Error('Build dist first (npm run build) before running e2e tests.')
  const profile = prepareProfileDir()
  console.info(`[e2e] Using ${describeProfileChoice(profile)}`)
  const headless = extensionHeadless()
  const args = [
    '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    `--disable-extensions-except=${dist}`, `--load-extension=${dist}`,
  ]
  if (headless) args.unshift('--headless=new')
  const context = await chromium.launchPersistentContext(profile.userDataDir, {
    args, headless, executablePath: browserExecutable(),
  })
  return { context, userDataDir: profile.userDataDir, cleanup: () => cleanupProfileDir(profile) }
}

export const findExtensionId = async (context: BrowserContext, profileDir?: string) => {
  for (const worker of context.serviceWorkers()) {
    const match = worker.url().match(/^chrome-extension:\/\/([a-z]+)\//)
    if (match) return match[1]!
  }
  const worker = await context.waitForEvent('serviceworker', { timeout: 10_000 }).catch(() => null)
  const workerMatch = worker?.url().match(/^chrome-extension:\/\/([a-z]+)\//)
  if (workerMatch) return workerMatch[1]!
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  const { targetInfos } = await cdp.send('Target.getTargets')
  await page.close()
  const target = targetInfos.find((item) => item.url.startsWith('chrome-extension://'))
  const targetMatch = target?.url.match(/^chrome-extension:\/\/([a-z]+)\//)
  if (targetMatch) return targetMatch[1]!
  const stored = profileDir ? readExtensionIdFromPreferences(profileDir) : null
  if (stored) return stored
  throw new Error('Extension target not found')
}

export type RunSnapshot = {
  status: string
  runId: string
  ranAt: string
  results: Array<{ type: string; ruleId?: string; message: string; details?: Record<string, unknown> }>
}

// Chrome also runs its own component extensions, whose workers have no
// chrome.tabs - "the first chrome-extension:// worker" is not necessarily ours.
const workerScript = (): string =>
  (JSON.parse(fs.readFileSync(path.join(dist, 'manifest.json'), 'utf8')) as { background: { service_worker: string } }).background.service_worker
const isOwnWorker = (url: string): boolean => url.startsWith('chrome-extension://') && url.endsWith(`/${workerScript()}`)

export const extensionWorker = async (context: BrowserContext) =>
  context.serviceWorkers().find((candidate) => isOwnWorker(candidate.url()))
    || await context.waitForEvent('serviceworker', { predicate: (candidate) => isOwnWorker(candidate.url()), timeout: 10_000 }).catch(() => null)

export const readRunSnapshot = async (context: BrowserContext, targetUrl: string): Promise<RunSnapshot | null> => {
  const worker = await extensionWorker(context)
  if (!worker) return null
  return worker.evaluate(async (url) => {
    // A worker that has just started can be reachable before its extension
    // bindings are: report "no snapshot yet" instead of failing the poll.
    if (!chrome?.tabs || !chrome.storage) return null
    const tab = (await chrome.tabs.query({})).find((candidate) => candidate.url === url)
    if (!tab?.id) return null
    const resultKey = `results:${tab.id}`
    const metaKey = `results-meta:${tab.id}`
    const stored = await chrome.storage.local.get([resultKey, metaKey])
    const meta = stored[metaKey] as { status?: string; runId?: string; ranAt?: string } | undefined
    if (!meta?.status || !meta.runId || !meta.ranAt) return null
    return { status: meta.status, runId: meta.runId, ranAt: meta.ranAt, results: stored[resultKey] || [] }
  }, targetUrl)
}
