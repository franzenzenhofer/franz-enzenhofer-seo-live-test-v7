import { describe, expect, it } from 'vitest'

import { canonicalHreflangConsistencyRule } from '@/rules/head/canonicalHreflangConsistency'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: canonical hreflang consistency', () => {
  it('warns when canonical not in hreflang cluster', async () => {
    const res = await canonicalHreflangConsistencyRule.run(
      { html: '', url: 'https://ex.com/a', doc: doc('<link rel="canonical" href="https://ex.com/a"><link rel="alternate" hreflang="en" href="https://ex.com/en/a">') } as any,
      { globals: {} },
    )
    expect(res.type).toBe('warn')
  })

  it('warns when hreflang uses different host/protocol', async () => {
    const res = await canonicalHreflangConsistencyRule.run(
      {
        html: '',
        url: 'https://ex.com/a',
        doc: doc('<link rel="canonical" href="https://ex.com/a"><link rel="alternate" hreflang="en" href="http://other.com/a">'),
      } as any,
      { globals: {} },
    )
    expect(res.type).toBe('warn')
  })

  it('ok when aligned', async () => {
    const res = await canonicalHreflangConsistencyRule.run(
      {
        html: '',
        url: 'https://ex.com/a',
        doc: doc('<link rel="canonical" href="https://ex.com/a"><link rel="alternate" hreflang="en" href="https://ex.com/a">'),
      } as any,
      { globals: {} },
    )
    expect(res.type).toBe('ok')
  })
})
