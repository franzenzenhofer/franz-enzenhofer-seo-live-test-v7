import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { runAll } from '@/core/run'
import type { Rule } from '@/core/types'

const createDoc = () => new DOMParser().parseFromString('<html><body></body></html>', 'text/html')
const basePage = { html: '<html></html>', url: 'https://example.com', doc: createDoc() }
const ctx = { globals: {} }

describe('runAll async scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const makeRule = (id: string, delay: number): Rule => ({
    id,
    name: id,
    enabled: true,
    run: vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, delay))
      return { name: id, label: 'T', message: id, type: 'ok', ruleId: id }
    }),
  })

  it('executes enabled rules concurrently while keeping order', async () => {
    const starts: Record<string, number> = {}
    const fast = makeRule('fast', 2000)
    const slow = makeRule('slow', 5000)
    fast.run.mockImplementation(async () => {
      starts.fast = Date.now()
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return { name: 'fast', label: 'T', message: 'fast', type: 'ok', ruleId: 'fast' }
    })
    slow.run.mockImplementation(async () => {
      starts.slow = Date.now()
      await new Promise((resolve) => setTimeout(resolve, 5000))
      return { name: 'slow', label: 'T', message: 'slow', type: 'ok', ruleId: 'slow' }
    })
    const disabled: Rule = { id: 'disabled', name: 'disabled', enabled: false, run: vi.fn() as any }
    const promise = runAll(1, [fast, disabled, slow], basePage as any, ctx)
    await vi.advanceTimersByTimeAsync(5000)
    const results = await promise
    expect(results.map((r) => r.name)).toEqual(['fast', 'disabled', 'slow'])
    expect(starts.fast).toBe(0)
    expect(starts.slow).toBe(0)
  })

  it('stops execution when the abort signal fires', async () => {
    const controller = new AbortController()
    const hanging = makeRule('hang', 10000)
    const promise = runAll(2, [hanging], basePage as any, ctx, undefined, { signal: controller.signal })
    controller.abort()
    await expect(promise).rejects.toThrow(/rule-run-cancelled/)
  })
})
