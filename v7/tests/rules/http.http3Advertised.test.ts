import { describe, it, expect } from 'vitest'
import { http3AdvertisedRule } from '@/rules/http/http3Advertised'

const P = (alt: string) => ({ html:'', url:'https://ex.com', doc: new DOMParser().parseFromString('<p/>','text/html'), headers: { 'alt-svc': alt } })

describe('rule: http3 advertised', () => {
  it('detects h3', async () => {
    const r = await http3AdvertisedRule.run(P('h3=":443"; ma=2592000'), { globals: {} })
    expect((r as any).message.includes('HTTP/3')).toBe(true)
  })
})

