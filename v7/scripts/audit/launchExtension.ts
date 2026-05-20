import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

import { chromium, type BrowserContext } from '@playwright/test'

const distPath = (): string => path.resolve(new URL('../../dist', import.meta.url).pathname)

const readIdFromPrefs = (profileDir: string): string | null => {
  const prefs = path.join(profileDir, 'Default', 'Preferences')
  if (!fs.existsSync(prefs)) return null
  try {
    const raw = JSON.parse(fs.readFileSync(prefs, 'utf8')) as { extensions?: { settings?: Record<string, { path?: string }> } }
    const dist = distPath()
    for (const [id, info] of Object.entries(raw.extensions?.settings || {})) {
      if (info?.path && path.resolve(info.path) === dist) return id
    }
  } catch { /* ignore */ }
  return null
}

export interface LaunchedExtension {
  context: BrowserContext
  userDataDir: string
  close: () => Promise<void>
}

export const launchExtension = async (): Promise<LaunchedExtension> => {
  const dist = distPath()
  if (!fs.existsSync(dist)) throw new Error(`Build first: ${dist} does not exist (run npm run build:dev)`)
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'f19n-audit-'))
  const args = [
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--disable-extensions-except=${dist}`,
    `--load-extension=${dist}`,
    '--headless=new',
    '--js-flags=--expose-gc',
    '--enable-precise-memory-info',
  ]
  const context = await chromium.launchPersistentContext(userDataDir, { args, headless: true })
  const close = async (): Promise<void> => {
    await context.close().catch(() => {})
    try { fs.rmSync(userDataDir, { recursive: true, force: true }) } catch { /* ignore */ }
  }
  return { context, userDataDir, close }
}

const fromUrl = (url: string): string | null => {
  const m = url.match(/^chrome-extension:\/\/([a-z]+)\//)
  return m ? m[1]! : null
}

export const findExtensionId = async (ctx: BrowserContext, profileDir: string): Promise<string> => {
  for (const w of ctx.serviceWorkers()) {
    const id = fromUrl(w.url())
    if (id) return id
  }
  const sw = await ctx.waitForEvent('serviceworker', { timeout: 10_000 }).catch(() => null)
  if (sw) {
    const id = fromUrl(sw.url())
    if (id) return id
  }
  // CDP fallback for headless where waitForEvent sometimes misses the SW.
  const probe = await ctx.newPage()
  try {
    const cdp = await ctx.newCDPSession(probe)
    const { targetInfos } = await cdp.send('Target.getTargets')
    for (const ti of targetInfos) {
      const id = fromUrl(ti.url)
      if (id) return id
    }
  } finally { await probe.close() }
  // Last resort: the Chrome profile records which directory each extension was
  // loaded from. We can match against our dist path.
  const prefId = readIdFromPrefs(profileDir)
  if (prefId) return prefId
  // Manifest declares a fixed `key` so the extension ID is deterministic. If
  // every dynamic discovery fails (which can happen if the SW hasn't fired any
  // event yet in fully-headless mode) we fall back to the published ID.
  return 'jbnaibigcohjfefpfocphcjeliohhold'
}
