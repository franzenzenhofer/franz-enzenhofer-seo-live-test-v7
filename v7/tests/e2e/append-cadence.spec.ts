import { test } from '@playwright/test'

import { withExtension } from './extensionHarness'

const TARGET = process.env.LT_TARGET_URL || 'https://orf.at/stories/3440788/'

test.describe('append cadence', () => {
  test.skip(!process.env.LT_CADENCE, 'set LT_CADENCE=1')

  test('how long each result write takes and how big the payload gets', async () => {
    test.setTimeout(180_000)
    const { context: ctx, cleanup } = await withExtension()
    const page = await ctx.newPage()
    await page.goto(TARGET, { waitUntil: 'domcontentloaded' })
    const worker = ctx.serviceWorkers()[0] || await ctx.waitForEvent('serviceworker')
    for (let i = 0; i < 20; i++) {
      const ready = await worker.evaluate(() => typeof chrome?.storage?.local !== 'undefined').catch(() => false)
      if (ready) break
      await page.waitForTimeout(250)
    }
    await page.waitForTimeout(45_000)

    const out = await worker.evaluate(async (url) => {
      const tab = (await chrome.tabs.query({})).find((t) => t.url === url)
      if (!tab?.id) return null
      const store = await chrome.storage.session.get(`logs:${tab.id}`)
      const lines = ((store[`logs:${tab.id}`] || []) as unknown[])
        .map((l) => (typeof l === 'string' ? l : String((l as { message?: string })?.message || '')))
        .filter((m) => m.includes('runner:counts'))
      const res = (await chrome.storage.local.get(`results:${tab.id}`))[`results:${tab.id}`]
      return { lines, bytes: new TextEncoder().encode(JSON.stringify(res)).length, count: (res as unknown[])?.length ?? 0 }
    }, TARGET)

    if (!out) { await ctx.close(); cleanup(); return }
    console.log(`RESULTS payload=${(out.bytes / 1024).toFixed(0)} KB entries=${out.count} writes=${out.lines.length}`)
    const stamps = out.lines.map((l) => Date.parse(l.slice(1, 25))).filter((n) => !Number.isNaN(n))
    let prev = stamps[0]
    const gaps: number[] = []
    stamps.slice(1).forEach((t) => { gaps.push(t - (prev as number)); prev = t })
    if (gaps.length) {
      const sorted = [...gaps].sort((a, b) => a - b)
      console.log(`WRITE-GAPS n=${gaps.length} median=${sorted[Math.floor(sorted.length / 2)]}ms max=${sorted[sorted.length - 1]}ms total=${gaps.reduce((a, b) => a + b, 0)}ms`)
    }
    await ctx.close(); cleanup()
  })
})
