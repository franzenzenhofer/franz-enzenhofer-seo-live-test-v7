import { describe, it, expect } from 'vitest'
import { varyUserAgentRule } from '@/rules/http/varyUserAgent'

const P = (h: Record<string,string>) => ({ html:'', url:'', doc: new DOMParser().parseFromString('<p/>','text/html'), headers: h })

describe('rule: vary user-agent', () => {
  it('reports vary UA', async () => {
    const r = await varyUserAgentRule.run(P({ 'vary': 'Accept-Encoding, User-Agent' }), { globals: {} })
    expect((r as any).message.includes('User-Agent')).toBe(true)
  })
})

