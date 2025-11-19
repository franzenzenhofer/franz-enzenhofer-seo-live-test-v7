import { describe, it, expect } from 'vitest'
import { altSvcOtherProtocolsRule } from '@/rules/http/altSvcOtherProtocols'

const P = (alt: string) => ({ html:'', url:'https://ex.com', doc: new DOMParser().parseFromString('<p/>','text/html'), headers: { 'alt-svc': alt } })

describe('rule: alt-svc other protocols', () => {
  it('reports quic', async () => {
    const r = await altSvcOtherProtocolsRule.run(P('quic=":443"; ma=2592000; v="43"'), { globals: {} })
    expect((r as any).message.includes('Alt-Svc')).toBe(true)
    expect((r as any).message.includes('quic')).toBe(true)
  })
})

