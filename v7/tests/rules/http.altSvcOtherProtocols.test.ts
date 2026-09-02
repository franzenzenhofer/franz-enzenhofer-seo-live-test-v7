import { describe, it, expect } from 'vitest'
import { altSvcOtherProtocolsRule } from '@/rules/http/altSvcOtherProtocols'

const P = (alt: string) => ({ html:'', url:'https://ex.com', doc: new DOMParser().parseFromString('<p/>','text/html'), headers: { 'alt-svc': alt } })

describe('rule: alt-svc other protocols', () => {
  it('reports quic', async () => {
    const r = await altSvcOtherProtocolsRule.run(P('quic=":443"; ma=2592000; v="43"'), { globals: {} })
    expect((r as any).message.includes('Alt-Svc')).toBe(true)
    expect((r as any).message.includes('quic')).toBe(true)
  })

  it('reports RFC 7838 clear semantics instead of "no protocols parsed"', async () => {
    const r = await altSvcOtherProtocolsRule.run(P('clear'), { globals: {} })
    expect((r as any).message).toBe('Alt-Svc: clear - origin invalidates all alternative services.')
    expect((r as any).details.altSvcClear).toBe(true)
  })

  it('does not treat uppercase CLEAR as the case-sensitive clear value', async () => {
    const r = await altSvcOtherProtocolsRule.run(P('CLEAR'), { globals: {} })
    expect((r as any).message.includes('no protocols parsed')).toBe(true)
  })
})

