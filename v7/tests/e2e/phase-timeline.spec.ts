import { test } from '@playwright/test'

import { withExtension, readRunSnapshot } from './extensionHarness'
import { registry } from '../../src/rules/registry'

const TARGET = process.env.LT_TARGET_URL || 'https://orf.at/stories/3440788/'

// Diagnostic: when does each rule phase actually reach storage?
test.describe('phase timeline', () => {
  test.skip(!process.env.LT_TIMELINE, 'set LT_TIMELINE=1')

  test('timeline of pending -> resolved', async () => {
    test.setTimeout(240_000)
    const { context: ctx, cleanup, userDataDir } = await withExtension()
    const page = await ctx.newPage()
    const t0 = Date.now()
    await page.goto(TARGET, { waitUntil: 'domcontentloaded' })

    const inputOf = new Map(registry.map((r) => [r.id, r.input]))
    let last = ''
    for (let i = 0; i < 90; i++) {
      const snap = await readRunSnapshot(ctx, TARGET)
      if (snap) {
        const pendingByInput: Record<string, number> = { static: 0, context: 0, idle: 0, compare: 0 }
        snap.results.filter((r) => r.type === 'pending').forEach((r) => {
          const k = inputOf.get(r.ruleId || '') || 'unknown'
          pendingByInput[k] = (pendingByInput[k] || 0) + 1
        })
        const pending = snap.results.filter((r) => r.type === 'pending').length
        const done = snap.results.length - pending
        const names = snap.results.filter((r) => r.type === 'pending').map((r) => r.ruleId || '?')
        const line = `${done}/${snap.results.length} ${names.join(',')}`
        if (line !== last) {
          console.log(`[t] ${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s  resolved=${done}/${snap.results.length}  WAITING-ON: ${names.join(' ') || '(none)'}`)
          last = line
        }
        if (pending === 0 && snap.status !== 'running') break
      }
      await page.waitForTimeout(500)
    }
    await ctx.close()
    cleanup()
  })
})
