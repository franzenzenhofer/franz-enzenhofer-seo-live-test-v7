import { describe, it, expect, vi } from 'vitest'
import { canonicalChainRule } from '@/rules/head/canonicalChain'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('rule: canonical chain', () => {
  it('reports hops', async () => {
    const orig = globalThis.fetch
    // first: 301 to /b, then 301 to /c, then 200
    // @ts-expect-error mock
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ status: 301, headers: new Map([['location','/b']]) })
      .mockResolvedValueOnce({ status: 301, headers: new Map([['location','/c']]) })
      .mockResolvedValueOnce({ status: 200, headers: new Map() })
    const r = await canonicalChainRule.run({ html:'', url:'https://ex.com/a', doc: D('<link rel="canonical" href="/a">') } as any, { globals: {} })
    expect((r as any).message.includes('2')).toBe(true)
    globalThis.fetch = orig
  })
})

