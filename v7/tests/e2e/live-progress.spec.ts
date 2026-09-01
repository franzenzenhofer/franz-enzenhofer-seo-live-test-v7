import { test, expect } from '@playwright/test'

import { DEV_EXTENSION_ID, findExtensionId, withExtension, readRunSnapshot } from './extensionHarness'

const TARGET = process.env.LT_TARGET_URL || 'https://orf.at/stories/3440788/'
const SHOTS = 'test-results/live-progress'

/**
 * Opt-in real-network verification: LT_LIVE_PROGRESS=1 npx playwright test tests/e2e/live-progress.spec.ts
 *
 * Left out of the default gate on purpose. It drives a live news page plus the
 * PageSpeed API for up to a few minutes, and running that alongside the other
 * extension specs starved their 30 s polls and made them flake.
 */
test.describe('live progress', () => {
  test.skip(!process.env.LT_LIVE_PROGRESS, 'set LT_LIVE_PROGRESS=1 to run the real-network check')

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

    let sawPending = false
    let sawProgressBar = false
    let sawFlashing = false
    let settledAt = 0
    for (let i = 0; i < 80; i++) {
      const snap = await readRunSnapshot(ctx, TARGET)
      const pending = snap ? snap.results.filter((r) => r.type === 'pending').length : -1
      if (pending > 0) sawPending = true
      if (await side.locator('[data-testid="run-progress"]').count()) sawProgressBar = true
      if (await side.locator('.animate-pending').count()) sawFlashing = true
      if (i < 5) await side.screenshot({ path: `${SHOTS}/t${i}.png` })
      if (snap && pending === 0) { settledAt = Date.now() - started; break }
      await side.waitForTimeout(1500)
    }
    await side.screenshot({ path: `${SHOTS}/final.png`, fullPage: true })

    // Expanded-card check: the tiers (evidence once, compact measurements,
    // flat muted technical, footer reference) are only visible with Details open.
    const expandTargets: Array<[string, string]> = [
      ['Meta description (', 'expanded-meta-description.png'],
      ['Canonical self-references', 'expanded-canonical.png'],
      ['Links: internal', 'expanded-internal-links.png'],
      ['HSTS', 'expanded-hsts.png'],
    ]
    for (const [text, file] of expandTargets) {
      const card = side.locator('[data-testid="result-card"]', { hasText: text }).first()
      if (!(await card.count())) continue
      await card.getByRole('button', { name: 'Details' }).click()
      await side.waitForTimeout(200)
      await card.screenshot({ path: `${SHOTS}/${file}` })
    }

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
    // Only meaningful if the run was still in flight when the panel first looked.
    if (sawPending) {
      expect(sawProgressBar).toBe(true)
      expect(sawFlashing).toBe(true)
    }
    await ctx.close()
    cleanup()
  })
})
