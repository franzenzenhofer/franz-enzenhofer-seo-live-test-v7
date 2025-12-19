import { describe, expect, it } from 'vitest'

import { canonicalNoindexConflictRule } from '@/rules/head/canonicalNoindexConflict'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const ctx = (headers?: Record<string, string>) => ({ globals: {}, headers: headers || {} })

describe('rule: canonical + noindex conflict', () => {
  it('warns when meta noindex and canonical present', async () => {
    const res = await canonicalNoindexConflictRule.run(
      { html: '', url: 'https://ex.com', doc: doc('<link rel="canonical" href="https://ex.com/"><meta name="robots" content="noindex">'), headers: {} } as any,
      { globals: {} } as any,
    )
    expect(res.type).toBe('warn')
    expect(res.message).toContain('noindex')
  })

  it('warns when x-robots noindex and header canonical present', async () => {
    const res = await canonicalNoindexConflictRule.run(
      { html: '', url: 'https://ex.com', doc: doc('<p></p>'), headers: { link: '<https://ex.com/>; rel=\"canonical\"', 'x-robots-tag': 'noindex' } } as any,
      ctx() as any,
    )
    expect(res.type).toBe('warn')
  })

  it('info when no conflict', async () => {
    const res = await canonicalNoindexConflictRule.run(
      { html: '', url: 'https://ex.com', doc: doc('<link rel="canonical" href="https://ex.com/">'), headers: {} } as any,
      { globals: {} } as any,
    )
    expect(res.type).toBe('info')
  })
})
