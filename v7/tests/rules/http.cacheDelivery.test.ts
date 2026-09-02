import { describe, it, expect } from 'vitest'

import { cacheDeliveryRule } from '@/rules/http/cacheDelivery'

const P = (headers: Record<string, string> = { 'content-type': 'text/html' }) =>
  ({ html: '', url: 'https://ex.com', doc: new DOMParser().parseFromString('<p/>', 'text/html'), headers })

describe('rule: cache delivery (Age header)', () => {
  it('returns runtime_error when headers not captured', async () => {
    const r = await cacheDeliveryRule.run(P({}) as any, { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.message).toContain('Hard Reload')
  })

  it('does not claim origin delivery when Age header is absent (RFC 9111 5.1)', async () => {
    const r = await cacheDeliveryRule.run(P() as any, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.message).toBe('No Age header (no evidence of shared-cache delivery)')
    expect((r.details as any).isFromCache).toBe(false)
  })

  it('treats Age: 0 as cache-mediated, not fresh from origin (RFC 9111 5.1)', async () => {
    const r = await cacheDeliveryRule.run(P({ 'content-type': 'text/html', age: '0' }) as any, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.message).toContain('passed through a cache')
    expect(r.message).not.toContain('Fresh from origin')
    expect((r.details as any).isFromCache).toBe(true)
  })

  it('reports seconds for small ages', async () => {
    const r = await cacheDeliveryRule.run(P({ 'content-type': 'text/html', age: '42' }) as any, { globals: {} })
    expect(r.message).toContain('42 seconds (From cache)')
    expect((r.details as any).isFromCache).toBe(true)
  })

  it('reports minutes and hours for larger ages', async () => {
    const minutes = await cacheDeliveryRule.run(P({ 'content-type': 'text/html', age: '600' }) as any, { globals: {} })
    expect(minutes.message).toContain('10 minutes (From cache)')
    const hours = await cacheDeliveryRule.run(P({ 'content-type': 'text/html', age: '7200' }) as any, { globals: {} })
    expect(hours.message).toContain('2 hours (From cache)')
  })
})
