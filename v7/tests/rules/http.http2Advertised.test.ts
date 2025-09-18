import { describe, it, expect } from 'vitest'
import { http2AdvertisedRule } from '@/rules/http/http2Advertised'

const P = (alt: string) => ({ html:'', url:'https://ex.com', doc: new DOMParser().parseFromString('<p/>','text/html'), headers: { 'alt-svc': alt } })

describe('rule: http2 advertised', () => {
  it('detects h2', async () => {
    const r = await http2AdvertisedRule.run(P('h2=":443"; ma=2592000'), { globals: {} })
    expect((r as any).message.includes('HTTP/2')).toBe(true)
  })
})

