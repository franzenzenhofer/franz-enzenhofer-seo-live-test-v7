import { test } from '@playwright/test'

import { withExtension, readRunSnapshot } from './extensionHarness'

const TARGET = process.env.LT_TARGET_URL || 'https://orf.at/stories/3440788/'
const WANTED = (process.env.LT_RULES || 'body:internal-link-status,robots:blocked-resources').split(',')

test.describe('rule message probe', () => {
  test.skip(!process.env.LT_MSG, 'set LT_MSG=1')

  test('what specific rules actually report on a live page', async () => {
    test.setTimeout(180_000)
    const { context: ctx, cleanup } = await withExtension()
    const page = await ctx.newPage()
    await page.goto(TARGET, { waitUntil: 'domcontentloaded' })
    for (let i = 0; i < 90; i++) {
      const snap = await readRunSnapshot(ctx, TARGET)
      if (snap && !snap.results.some((r) => r.type === 'pending')) {
        snap.results
          .filter((r) => WANTED.includes(r.ruleId || ''))
          .forEach((r) => console.log(`MSG [${r.type}] ${r.ruleId}: ${r.message}`))
        break
      }
      await page.waitForTimeout(500)
    }
    await ctx.close(); cleanup()
  })
})
