import { describe, it, expect } from 'vitest'

import { runRuleQueue } from '@/core/ruleQueue'
import type { Page, Result, Rule } from '@/core/types'

const page = {} as Page
const ctx = { globals: {} } as never

const mkRule = (id: string, what: string, ms: number, onDone: (id: string) => void): Rule => ({
  id, name: id, enabled: true, what,
  async run(): Promise<Result> {
    await new Promise((r) => setTimeout(r, ms))
    onDone(id)
    return { label: 'L', name: id, type: 'ok', message: 'ok' }
  },
} as unknown as Rule)

describe('ruleQueue lanes', () => {
  it('lets fast DOM rules finish while slow API rules are still running', async () => {
    const order: string[] = []
    const record = (id: string) => { order.push(id) }
    // 4 slow API rules would have filled the old single 4-wide pool entirely.
    const slow = ['psi:a', 'psi:b', 'psi:c', 'psi:d'].map((id) => mkRule(id, 'psi', 60, record))
    const fast = Array.from({ length: 20 }, (_, i) => mkRule(`fast:${i}`, 'static', 1, record))
    const tasks = [...slow, ...fast].map((rule, i) => ({ rule, slot: i, runIndex: i + 1 }))
    const results: Result[] = []

    await runRuleQueue({
      tabId: 0, page, ctx, tasks,
      assign: (slot, result) => { results[slot] = result },
    })

    expect(results.filter(Boolean)).toHaveLength(24)
    // Every fast rule must land before the slow lane drains.
    const lastFast = Math.max(...order.map((id, i) => (id.startsWith('fast:') ? i : -1)))
    const firstSlow = order.findIndex((id) => id.startsWith('psi:'))
    expect(lastFast).toBeLessThan(firstSlow === -1 ? Number.MAX_SAFE_INTEGER : order.length)
    expect(order.slice(0, 20).every((id) => id.startsWith('fast:'))).toBe(true)
  })

  it('runs slow rules concurrently in their own lane', async () => {
    const started: number[] = []
    const rules = ['psi:a', 'psi:b', 'psi:c'].map((id) => ({
      id, name: id, enabled: true, what: 'psi',
      async run(): Promise<Result> {
        started.push(Date.now())
        await new Promise((r) => setTimeout(r, 50))
        return { label: 'L', name: id, type: 'ok', message: 'ok' }
      },
    } as unknown as Rule))
    const tasks = rules.map((rule, i) => ({ rule, slot: i, runIndex: i + 1 }))
    const t0 = Date.now()
    await runRuleQueue({ tabId: 0, page, ctx, tasks, assign: () => {} })
    // Concurrent, not serial: 3x50ms serial would be >=150ms.
    expect(Date.now() - t0).toBeLessThan(140)
  })
})
