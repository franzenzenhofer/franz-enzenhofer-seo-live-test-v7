import { describe, it, expect } from 'vitest'
import { nofollowRule } from '@/rules/body/nofollow'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: body nofollow', () => {
  it('ok none', async () => {
    const r = await nofollowRule.run({ html:'', url:'', doc: doc('<a href="/">x</a>') }, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
  it('reports some', async () => {
    const r = await nofollowRule.run({ html:'', url:'', doc: doc('<a rel="nofollow" href="/">x</a>') }, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})

