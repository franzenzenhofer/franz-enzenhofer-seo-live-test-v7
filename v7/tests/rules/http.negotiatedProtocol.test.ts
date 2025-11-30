import { describe, it, expect } from 'vitest'

import { negotiatedProtocolRule } from '@/rules/http/negotiatedProtocol'

const P = (proto?: string, url = 'https://ex.com') =>
  ({ html: '', url, doc: new DOMParser().parseFromString('<p/>', 'text/html'), navigationTiming: { nextHopProtocol: proto || '' } })

describe('rule: negotiated protocol', () => {
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
