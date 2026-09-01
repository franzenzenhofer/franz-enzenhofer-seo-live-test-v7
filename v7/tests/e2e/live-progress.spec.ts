import { test, expect } from '@playwright/test'

import { DEV_EXTENSION_ID, findExtensionId, withExtension, readRunSnapshot } from './extensionHarness'

const TARGET = process.env.LT_TARGET_URL || 'https://orf.at/stories/3440788/'
const SHOTS = 'test-results/live-progress'

// Real-browser proof that a run in flight is visibly progressing rather than
// looking stuck, and that it settles with nothing left pending.
test('live run shows progress and settles', async () => {
  test.setTimeout(240_000)
  const { context: ctx, cleanup, userDataDir } = await withExtension()
  const page = await ctx.newPage()
  const started = Date.now()
  await page.goto(TARGET, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)

  const extensionId = await findExtensionId(ctx, userDataDir).catch(() => DEV_EXTENSION_ID)
  const side = await ctx.newPage()
  await side.setViewportSize({ width: 420, height: 900 })
  await side.goto(`chrome-extension://${extensionId}/src/sidepanel.html`, { waitUntil: 'load' })

  let sawProgressBar = false
  let sawFlashing = false
  let settledAt = 0
  for (let i = 0; i < 80; i++) {
    const snap = await readRunSnapshot(ctx, TARGET)
    const pending = snap ? snap.results.filter((r) => r.type === 'pending').length : -1
    if (await side.locator('[data-testid="run-progress"]').count()) sawProgressBar = true
    if (await side.locator('.animate-pending').count()) sawFlashing = true
    if (i < 5) await side.screenshot({ path: `${SHOTS}/t${i}.png` })
    if (snap && pending === 0) { settledAt = Date.now() - started; break }
    await side.waitForTimeout(1500)
  }
  await side.screenshot({ path: `${SHOTS}/final.png`, fullPage: true })

  const snap = await readRunSnapshot(ctx, TARGET)
  const byType: Record<string, number> = {}
  snap?.results.forEach((r) => { byType[r.type] = (byType[r.type] || 0) + 1 })
  console.log(`[live] target      ${TARGET}`)
  console.log(`[live] rules       ${snap?.results.length} ${JSON.stringify(byType)}`)
  console.log(`[live] progressBar seen=${sawProgressBar} flashingPending seen=${sawFlashing}`)
  console.log(`[live] settled after ${(settledAt / 1000).toFixed(1)}s`)
  snap?.results.filter((r) => r.type === 'runtime_error' || r.type === 'error')
    .forEach((r) => console.log(`[live] ${r.type.padEnd(13)} ${r.ruleId || '?'}: ${r.message.slice(0, 90)}`))

  expect(snap?.results.length).toBeGreaterThan(50)
  expect(byType['pending'] || 0).toBe(0)
  expect(sawProgressBar).toBe(true)
  expect(sawFlashing).toBe(true)
  await ctx.close()
  cleanup()
})
