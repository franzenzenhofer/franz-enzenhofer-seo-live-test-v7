import { describe, expect, it } from 'vitest'

import { canonicalTrackingParamsRule } from '@/rules/head/canonicalTrackingParams'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const ctx = { globals: {} }

describe('rule: canonical tracking params', () => {
  it('ok when no tracking params', async () => {
    const res = await canonicalTrackingParamsRule.run({ html: '', url: 'https://ex.com', doc: doc('<link rel="canonical" href="https://ex.com/a">') } as any, ctx as any)
    expect(res.type).toBe('ok')
  })

  it('warns when tracking params present', async () => {
    const res = await canonicalTrackingParamsRule.run({ html: '', url: 'https://ex.com', doc: doc('<link rel="canonical" href="https://ex.com/a?utm_source=newsletter&gclid=123">') } as any, ctx as any)
    expect(res.type).toBe('warn')
    expect(res.message).toContain('utm_source')
  })

  it('warns on invalid canonical URL', async () => {
    const res = await canonicalTrackingParamsRule.run({ html: '', url: 'https://ex.com', doc: doc('<link rel="canonical" href="javascript:alert(1)">') } as any, ctx as any)
    expect(res.type).toBe('warn')
  })
})
