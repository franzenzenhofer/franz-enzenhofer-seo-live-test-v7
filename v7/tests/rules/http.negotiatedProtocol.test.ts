import { describe, it, expect } from 'vitest'

import { negotiatedProtocolRule } from '@/rules/http/negotiatedProtocol'

const P = (proto?: string, url = 'https://ex.com', headers: Record<string, string> = { 'content-type': 'text/html' }) =>
  ({ html: '', url, doc: new DOMParser().parseFromString('<p/>', 'text/html'), navigationTiming: { nextHopProtocol: proto || '' }, headers })

describe('rule: negotiated protocol', () => {
  it('returns runtime_error when headers not captured', async () => {
    const r = await negotiatedProtocolRule.run(P('h2', 'https://ex.com', {}) as any, { globals: {} })
    expect(r.type).toBe('runtime_error')
    expect(r.message).toContain('Hard Reload')
  })

  it('warns when HTTPS negotiates http/1.1', async () => {
    const r = await negotiatedProtocolRule.run(P('http/1.1') as any, { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.message).toContain('HTTP/2+')
  })

  it('reports info for h2', async () => {
    const r = await negotiatedProtocolRule.run(P('h2') as any, { globals: {} })
    expect(r.type).toBe('info')
  })
})
