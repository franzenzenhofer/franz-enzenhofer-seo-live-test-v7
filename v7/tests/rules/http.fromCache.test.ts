import { describe, it, expect } from 'vitest'

import { fromCacheRule } from '@/rules/http/fromCache'

const P = (fromCache?: boolean, headers: Record<string, string> = { 'content-type': 'text/html' }) =>
  ({ html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html'), fromCache, headers })

describe('rule: from cache', () => {
  it('returns runtime_error when headers not captured', async () => {
    const r = await fromCacheRule.run(P(true, {}) as any, { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.message).toContain('Hard Reload')
  })

  it('warns when served from cache', async () => {
    const r = await fromCacheRule.run(P(true) as any, { globals: {} })
    expect(r.type).toBe('warn')
  })

  it('reports info when not from cache', async () => {
    const r = await fromCacheRule.run(P(false) as any, { globals: {} })
    expect(r.type).toBe('info')
  })
})
