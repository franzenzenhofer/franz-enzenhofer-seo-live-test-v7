import { test } from '@playwright/test'

import { withExtension, readRunSnapshot } from './extensionHarness'

const TARGET = process.env.LT_TARGET_URL || 'https://orf.at/stories/3440788/'

/**
 * Reproduces the authenticated-GSC path. With a token present the GSC rules
 * make real googleapis round trips instead of bailing out instantly, which is
 * the code path an unauthenticated test profile never exercises.
 */
test.describe('gsc authed', () => {
  test.skip(!process.env.LT_GSC, 'set LT_GSC=1')

  test('timeline with a Google token present', async () => {
    test.setTimeout(240_000)
    const { context: ctx, cleanup } = await withExtension()
    const page = await ctx.newPage()
    await page.goto('about:blank')
    const worker = ctx.serviceWorkers()[0] || await ctx.waitForEvent('serviceworker')
    for (let i = 0; i < 20; i++) {
      const ready = await worker.evaluate(() => typeof chrome?.storage?.local !== 'undefined').catch(() => false)
      if (ready) break
      await page.waitForTimeout(250)
    }
    // GSC and PSI rules run in the OFFSCREEN document, not the service worker,
    // so patching self.fetch here counts nothing. webRequest observes requests
    // from every extension context.
    await worker.evaluate(async () => {
      await chrome.storage.local.set({ googleApiAccessToken: 'test-token-for-timing' })
      const w = self as unknown as { __gapi?: Array<{ url: string; at: number }> }
      w.__gapi = []
      chrome.webRequest.onBeforeRequest.addListener(
        (details) => { w.__gapi!.push({ url: details.url.split('?')[0]!, at: Date.now() }) },
        { urls: ['*://*.googleapis.com/*', '*://*.searchconsole.googleapis.com/*'] },
      )
    })

    const t0 = Date.now()
    await page.goto(TARGET, { waitUntil: 'domcontentloaded' })
    let last = ''
    for (let i = 0; i < 120; i++) {
      const snap = await readRunSnapshot(ctx, TARGET)
      if (snap) {
        const names = snap.results.filter((r) => r.type === 'pending').map((r) => r.ruleId || '?')
        const line = `${snap.results.length - names.length} ${names.join(',')}`
        if (line !== last) {
          console.log(`[gsc] ${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s resolved=${snap.results.length - names.length}/${snap.results.length} WAITING: ${names.join(' ') || '(none)'}`)
          last = line
        }
        if (!names.length && snap.status !== 'running') break
      }
      await page.waitForTimeout(500)
    }
    // Second run on the same host: the derived property (hit or miss) is cached
    // across runs, so this must cost no further probes.
    const firstCount = (await worker.evaluate(() => ((self as unknown as { __gapi?: unknown[] }).__gapi || []).length))
    await page.reload({ waitUntil: 'domcontentloaded' })
    for (let i = 0; i < 60; i++) {
      const snap = await readRunSnapshot(ctx, TARGET)
      if (snap && !snap.results.some((r) => r.type === 'pending') && snap.status !== 'running') break
      await page.waitForTimeout(500)
    }
    const secondCount = (await worker.evaluate(() => ((self as unknown as { __gapi?: unknown[] }).__gapi || []).length))
    console.log(`[gsc] run1 calls=${firstCount}  run2 added=${secondCount - firstCount}`)

    const calls = await worker.evaluate(() => (self as unknown as { __gapi?: Array<{ url: string; at: number }> }).__gapi || [])
    const byEndpoint: Record<string, number> = {}
    calls.forEach((c) => {
      const k = c.url.replace(/sites\/[^/]+/, 'sites/<property>')
      byEndpoint[k] = (byEndpoint[k] || 0) + 1
    })
    console.log(`[gsc] GOOGLE API CALLS total=${calls.length}`)
    Object.entries(byEndpoint).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`[gsc]   ${String(n).padStart(3)}x ${k}`))
    await ctx.close(); cleanup()
  })
})
