import { describe, expect, it } from 'vitest'

import { canonicalNavConsistencyRule } from '@/rules/head/canonicalNavConsistency'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const ctx = (trace?: Array<{ url: string; type: string }>) => ({ globals: trace ? { navigationLedger: { trace } } : {} })

describe('rule: canonical vs navigation', () => {
  it('ok when canonical matches final without redirects', async () => {
    const res = await canonicalNavConsistencyRule.run({ html: '', url: 'https://ex.com/a', doc: doc('<link rel="canonical" href="https://ex.com/a">') } as any, ctx())
    expect(res.type).toBe('ok')
  })

  it('warns when canonical follows a redirect chain to a different final', async () => {
    const res = await canonicalNavConsistencyRule.run(
      { html: '', url: 'https://ex.com/final', doc: doc('<link rel="canonical" href="https://ex.com/start">') } as any,
      ctx([
        { url: 'https://ex.com/start', type: 'load' },
        { url: 'https://ex.com/final', type: 'http_redirect' },
      ]) as any,
    )
    expect(res.type).toBe('warn')
    expect(res.message).toContain('redirects')
  })

  it('warns when canonical differs from final landing', async () => {
    const res = await canonicalNavConsistencyRule.run(
      { html: '', url: 'https://ex.com/final', doc: doc('<link rel="canonical" href="https://ex.com/other">') } as any,
      ctx([{ url: 'https://ex.com/final', type: 'load' }]) as any,
    )
    expect(res.type).toBe('warn')
  })
})
