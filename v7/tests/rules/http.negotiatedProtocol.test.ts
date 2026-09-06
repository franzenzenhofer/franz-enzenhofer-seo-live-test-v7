import { describe, it, expect } from 'vitest'

import { negotiatedProtocolRule } from '@/rules/http/negotiatedProtocol'

const P = (proto?: string, url = 'https://ex.com', headers: Record<string, string> = { 'content-type': 'text/html' }) =>
  ({ html: '', url, doc: new DOMParser().parseFromString('<p/>', 'text/html'), navigationTiming: { nextHopProtocol: proto || '' }, headers })

describe('rule: negotiated protocol', () => {
  it('reads the protocol from navigation timing, not from response headers', async () => {
    const r = await negotiatedProtocolRule.run(P('h2', 'https://ex.com', {}) as any, { globals: {} })
    expect(r.type).toBe('ok')
    expect(r.details?.nextHopProtocol).toBe('h2')
  })

  it('says the protocol was not captured when navigation timing has none', async () => {
    const r = await negotiatedProtocolRule.run(P('') as any, { globals: {} })
    expect(r.type).toBe('info')
    expect(r.message).toContain('not captured')
  })

  it('errors when HTTPS negotiates http/1.1 (outdated)', async () => {
    const r = await negotiatedProtocolRule.run(P('http/1.1') as any, { globals: {} })
    expect(r.type).toBe('error')
    expect(r.message).toContain('outdated')
    expect(r.message).toContain('HTTP/2 or HTTP/3')
  })

  it('treats h2 as passing and mentions HTTP/3', async () => {
    const r = await negotiatedProtocolRule.run(P('h2') as any, { globals: {} })
    expect(r.type).toBe('ok')
    expect(r.message).toContain('HTTP/3')
  })

  it('reports ok for h3 (optimal)', async () => {
    const r = await negotiatedProtocolRule.run(P('h3') as any, { globals: {} })
    expect(r.type).toBe('ok')
    expect(r.message).toContain('optimal')
  })
})
