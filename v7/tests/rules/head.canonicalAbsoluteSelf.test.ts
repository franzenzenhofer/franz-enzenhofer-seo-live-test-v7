import { describe, it, expect } from 'vitest'
import { canonicalRule } from '@/rules/head/canonical'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('rules: canonical', () => {
  it('absolute and self-referencing', async () => {
    const r = await canonicalRule.run({ html:'', url:'https://ex.com/a', doc: D('<link rel="canonical" href="https://ex.com/a">') } as any, { globals: {} })
    expect(r.type).toBe('ok')
    expect(r.message).toContain('self-references')
    expect((r.details as any).isAbsolute).toBe(true)
    expect((r.details as any).matchesPageUrl).toBe(true)
  })

  it('relative canonical', async () => {
    const r = await canonicalRule.run({ html:'', url:'https://ex.com/a', doc: D('<link rel="canonical" href="/b">') } as any, { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.message).toContain('relative')
    expect((r.details as any).resolvedUrl).toBe('https://ex.com/b')
    expect((r.details as any).isAbsolute).toBe(false)
  })

  it('canonical pointing elsewhere', async () => {
    const r = await canonicalRule.run({ html:'', url:'https://ex.com/a', doc: D('<link rel="canonical" href="https://ex.com/c">') } as any, { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.message).toContain('points to')
    expect((r.details as any).matchesPageUrl).toBe(false)
  })
})
