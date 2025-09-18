import { describe, it, expect } from 'vitest'
import { preconnectRule } from '@/rules/speed/preconnect'
import { dnsPrefetchRule } from '@/rules/speed/dnsPrefetch'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('rules: preconnect/dns-prefetch', () => {
  it('counts links', async () => {
    const doc = D('<head><link rel="preconnect" href="https://a.com"><link rel="dns-prefetch" href="//b.com"></head>')
    const p = { html:'', url:'', doc }
    const r1 = await preconnectRule.run(p as any, { globals: {} })
    const r2 = await dnsPrefetchRule.run(p as any, { globals: {} })
    expect((r1 as any).message.includes('preconnect')).toBe(true)
    expect((r2 as any).message.includes('dns-prefetch')).toBe(true)
  })
})

