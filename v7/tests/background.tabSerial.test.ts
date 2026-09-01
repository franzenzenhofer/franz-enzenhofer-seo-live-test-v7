import { describe, it, expect } from 'vitest'

import { serializePerTab } from '@/background/pipeline/tabSerial'

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('serializePerTab', () => {
  it('runs tasks for the same tab strictly in order', async () => {
    const order: number[] = []
    await Promise.all([
      serializePerTab(1, async () => { await tick(); await tick(); order.push(1) }),
      serializePerTab(1, async () => { order.push(2) }),
      serializePerTab(1, async () => { await tick(); order.push(3) }),
    ])
    expect(order).toEqual([1, 2, 3])
  })

  it('does not serialize across different tabs', async () => {
    const order: string[] = []
    await Promise.all([
      serializePerTab(2, async () => { await tick(); await tick(); order.push('slow-tab2') }),
      serializePerTab(3, async () => { order.push('fast-tab3') }),
    ])
    expect(order).toEqual(['fast-tab3', 'slow-tab2'])
  })

  it('keeps the chain alive after a task rejects', async () => {
    const results: string[] = []
    const failing = serializePerTab(4, async () => { throw new Error('boom') })
    await expect(failing).rejects.toThrow('boom')
    await serializePerTab(4, async () => { results.push('after-failure') })
    expect(results).toEqual(['after-failure'])
  })
})
