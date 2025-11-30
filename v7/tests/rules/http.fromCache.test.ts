import { describe, it, expect } from 'vitest'

import { fromCacheRule } from '@/rules/http/fromCache'

const P = (fromCache?: boolean) =>
  ({ html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html'), fromCache })

describe('rule: from cache', () => {
  it('warns when served from cache', async () => {
    const r = await fromCacheRule.run(P(true) as any, { globals: {} })
    expect(r.type).toBe('warn')
  })

  it('reports info when not from cache', async () => {
    const r = await fromCacheRule.run(P(false) as any, { globals: {} })
    expect(r.type).toBe('info')
  })
})
